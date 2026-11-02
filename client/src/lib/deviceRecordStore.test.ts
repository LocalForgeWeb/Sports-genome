// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const inserted: Record<string, unknown>[][] = [];
vi.mock("@/lib/supabaseClient", () => ({
  getSupabaseClient: () => ({
    from: () => ({
      insert: async (rows: Record<string, unknown>[]) => {
        inserted.push(rows);
        return { error: null, status: 201 };
      },
    }),
  }),
}));

import {
  claimLegacyRecord, deviceStorageOwner, discardUnreadableRecord, isOwnedKey, legacyClaimSuffix, ownedKey, readOwnedList,
  resetDeviceRecordStoreForTests, setDeviceStorageOwner, unreadableRecords, writeOwnedList,
} from "./deviceRecordStore";
import { deviceWorkoutHistoryKey, loadDeviceWorkoutSessions, saveDeviceWorkoutSessions, type DeviceWorkoutSession } from "./deviceWorkoutLog";
import { bodyWeightLogKey, loadBodyWeightLog, saveBodyWeightLog } from "./bodyWeightLog";
import { claimQueueFor, flushSyncQueue, loadSyncQueue, saveSyncQueue, strengthSyncQueueKey, type QueuedLift } from "./strengthSyncQueue";

/**
 * iOS readiness audit, A03: the device's own records belong to an owner, a legacy record is
 * claimed once and safely, unreadable data is never read as "nothing" and saved over, and an
 * outbox entry is sent only by the identity it belongs to.
 */
const HISTORY = deviceWorkoutHistoryKey;

const session = (id: string, extra: Partial<DeviceWorkoutSession> = {}): DeviceWorkoutSession => ({
  id,
  title: "Upper",
  dayLabel: "Day 1",
  startedAt: "2026-10-01T15:00:00.000Z",
  completedAt: "2026-10-01T16:00:00.000Z",
  status: "completed",
  weightUnit: "lb",
  exercises: [{ id: "e1", exerciseName: "Barbell Bench Press", catalogId: 1, plannedPrescription: "3 x 8", sets: [{ weight: "185", reps: "8", completed: true, unit: "lb", id: "s1" }] }],
  ...extra,
});

const lift = (key: string, ownerId?: string): QueuedLift => ({
  key,
  queuedAt: "2026-10-01T16:00:00.000Z",
  athlete: { sexForReference: "male", birthYear: 1998 },
  lift: { catalogExerciseId: 1, observedAt: "2026-10-01T16:00:00.000Z", measurementType: "MULTI_REP", reportedLoad: 185, reportedUnit: "lb", repetitions: 8, source: "device" },
  ...(ownerId ? { ownerId } : {}),
});

beforeEach(() => {
  window.localStorage.clear();
  resetDeviceRecordStoreForTests();
  inserted.length = 0;
});
afterEach(() => vi.restoreAllMocks());

describe("the device storage owner", () => {
  it("is nobody in this build, so every key is the key it always was", () => {
    expect(deviceStorageOwner()).toBeNull();
    expect(ownedKey(HISTORY)).toBe(HISTORY);
    expect(saveDeviceWorkoutSessions([session("w1")])).toBe(true);
    expect(JSON.parse(window.localStorage.getItem(HISTORY)!)).toHaveLength(1);
    expect(loadDeviceWorkoutSessions().map((item) => item.id)).toEqual(["w1"]);
  });

  it("keeps two accounts' workouts, body weights and outboxes apart", () => {
    setDeviceStorageOwner("athlete-a");
    expect(saveDeviceWorkoutSessions([session("a1")])).toBe(true);
    expect(saveBodyWeightLog([{ bodyMassKg: 80, enteredUnit: "kg", observedAt: "2026-10-01T00:00:00.000Z", source: "athlete_entry" }])).toBe(true);
    saveSyncQueue([lift("workout-a1-e1", "cloud-a")]);

    setDeviceStorageOwner("athlete-b");
    expect(loadDeviceWorkoutSessions()).toEqual([]);
    expect(loadBodyWeightLog()).toEqual([]);
    expect(loadSyncQueue()).toEqual([]);
    expect(saveDeviceWorkoutSessions([session("b1")])).toBe(true);

    setDeviceStorageOwner("athlete-a");
    expect(loadDeviceWorkoutSessions().map((item) => item.id)).toEqual(["a1"]);
    expect(loadBodyWeightLog()).toHaveLength(1);
    expect(loadSyncQueue().map((item) => item.key)).toEqual(["workout-a1-e1"]);
    expect(window.localStorage.getItem(`${HISTORY}::athlete-b`)).toContain("b1");
    expect(window.localStorage.getItem(`${bodyWeightLogKey}::athlete-a`)).toContain("80");
  });

  it("writes to the owner a screen captured, not to whoever is signed in when a late write lands", () => {
    setDeviceStorageOwner("athlete-a");
    const captured = deviceStorageOwner();
    setDeviceStorageOwner("athlete-b");
    expect(saveDeviceWorkoutSessions([session("late")], captured)).toBe(true);
    expect(loadDeviceWorkoutSessions()).toEqual([]);
    expect(loadDeviceWorkoutSessions("athlete-a").map((item) => item.id)).toEqual(["late"]);
  });

  it("recognises its own storage events, and a cleared store", () => {
    setDeviceStorageOwner("athlete-a");
    expect(isOwnedKey(HISTORY, `${HISTORY}::athlete-a`)).toBe(true);
    expect(isOwnedKey(HISTORY, `${HISTORY}::athlete-b`)).toBe(false);
    expect(isOwnedKey(HISTORY, HISTORY)).toBe(false);
    expect(isOwnedKey(HISTORY, null)).toBe(true);
  });
});

describe("claiming a record written before it had an owner", () => {
  it("moves it to the first owner that reads it, and notes the claim", () => {
    window.localStorage.setItem(HISTORY, JSON.stringify([session("legacy")]));
    setDeviceStorageOwner("athlete-a");
    expect(loadDeviceWorkoutSessions().map((item) => item.id)).toEqual(["legacy"]);
    expect(window.localStorage.getItem(HISTORY)).toBeNull();
    expect(window.localStorage.getItem(`${HISTORY}${legacyClaimSuffix}`)).toBe("athlete-a");
  });

  it("is never claimed again by a second account, even if signed-out use writes there later", () => {
    window.localStorage.setItem(HISTORY, JSON.stringify([session("legacy")]));
    expect(claimLegacyRecord(HISTORY, "athlete-a")).toBe("claimed");
    window.localStorage.setItem(HISTORY, JSON.stringify([session("signed-out")]));
    expect(claimLegacyRecord(HISTORY, "athlete-b")).toBe("claimed-by-other");
    setDeviceStorageOwner("athlete-b");
    expect(loadDeviceWorkoutSessions()).toEqual([]);
    // The signed-out record is still there, unguessed, for the backup import to offer.
    expect(window.localStorage.getItem(HISTORY)).toContain("signed-out");
  });

  it("finishes safely when retried after an interruption between the copy and the removal", () => {
    const legacy = JSON.stringify([session("legacy")]);
    window.localStorage.setItem(HISTORY, legacy);
    // The state a crash after step 2 leaves: claimed, copied, original not yet removed.
    window.localStorage.setItem(`${HISTORY}${legacyClaimSuffix}`, "athlete-a");
    window.localStorage.setItem(`${HISTORY}::athlete-a`, legacy);
    expect(claimLegacyRecord(HISTORY, "athlete-b")).toBe("claimed-by-other");
    expect(claimLegacyRecord(HISTORY, "athlete-a")).toBe("claimed");
    expect(window.localStorage.getItem(HISTORY)).toBeNull();
    expect(JSON.parse(window.localStorage.getItem(`${HISTORY}::athlete-a`)!)).toHaveLength(1);
  });

  it("keeps the original when the copy cannot be written", () => {
    const legacy = JSON.stringify([session("legacy")]);
    window.localStorage.setItem(HISTORY, legacy);
    const setItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key: string, value: string) {
      if (key === `${HISTORY}::athlete-a`) throw new DOMException("full", "QuotaExceededError");
      return setItem.call(this, key, value);
    });
    expect(claimLegacyRecord(HISTORY, "athlete-a")).toBe("failed");
    expect(window.localStorage.getItem(HISTORY)).toBe(legacy);
  });

  it("does not merge a legacy record into an owner that already has its own", () => {
    window.localStorage.setItem(HISTORY, JSON.stringify([session("legacy")]));
    window.localStorage.setItem(`${HISTORY}::athlete-a`, JSON.stringify([session("own")]));
    expect(claimLegacyRecord(HISTORY, "athlete-a")).toBe("kept");
    expect(window.localStorage.getItem(HISTORY)).toContain("legacy");
  });
});

describe("unreadable data", () => {
  it("is copied aside and read as empty, and a later save cannot destroy it", () => {
    window.localStorage.setItem(HISTORY, "[{\"id\":\"w1\",\"exercises\":[");
    expect(loadDeviceWorkoutSessions()).toEqual([]);
    const kept = unreadableRecords();
    expect(kept).toHaveLength(1);
    expect(kept[0].base).toBe(HISTORY);
    expect(kept[0].raw).toBe("[{\"id\":\"w1\",\"exercises\":[");
    // The next checkpoint is allowed, because the original text is safe.
    expect(saveDeviceWorkoutSessions([session("new")])).toBe(true);
    expect(unreadableRecords()[0].raw).toBe("[{\"id\":\"w1\",\"exercises\":[");
    // Reading the same damage twice keeps one copy.
    window.localStorage.setItem(HISTORY, "[{\"id\":\"w1\",\"exercises\":[");
    loadDeviceWorkoutSessions();
    expect(unreadableRecords()).toHaveLength(1);
  });

  it("refuses a save over it when it cannot be copied aside, so the screen says 'not saved'", () => {
    window.localStorage.setItem(HISTORY, "{not json");
    const setItem = Storage.prototype.setItem;
    let full = true;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key: string, value: string) {
      if (full && key.includes("::unreadable")) throw new DOMException("full", "QuotaExceededError");
      return setItem.call(this, key, value);
    });
    expect(loadDeviceWorkoutSessions()).toEqual([]);
    expect(saveDeviceWorkoutSessions([session("new")])).toBe(false);
    expect(window.localStorage.getItem(HISTORY)).toBe("{not json");
    // Once there is room, the copy is made and the save goes through.
    full = false;
    expect(saveDeviceWorkoutSessions([session("new")])).toBe(true);
    expect(unreadableRecords()[0].raw).toBe("{not json");
  });

  it("treats a stored object as damage too, not as an empty history", () => {
    window.localStorage.setItem(HISTORY, "{\"id\":\"w1\"}");
    expect(loadDeviceWorkoutSessions()).toEqual([]);
    expect(unreadableRecords()).toHaveLength(1);
  });

  it("lists only the current owner's copies, and lets one be discarded", () => {
    setDeviceStorageOwner("athlete-a");
    window.localStorage.setItem(`${HISTORY}::athlete-a`, "{broken");
    readOwnedList(HISTORY);
    setDeviceStorageOwner("athlete-b");
    expect(unreadableRecords()).toEqual([]);
    setDeviceStorageOwner("athlete-a");
    const [copy] = unreadableRecords();
    expect(discardUnreadableRecord(copy.key)).toBe(true);
    expect(unreadableRecords()).toEqual([]);
    expect(discardUnreadableRecord(HISTORY)).toBe(false);
  });

  it("reports a write the device refused, never 'saved'", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("full", "QuotaExceededError"); });
    expect(writeOwnedList(HISTORY, [])).toBe(false);
    expect(saveDeviceWorkoutSessions([session("w1")])).toBe(false);
  });
});

describe("the outbox and its owner", () => {
  it("sends only the flushing identity's lifts, and claims unowned ones once", () => {
    const queue = [lift("a", "cloud-a"), lift("b", "cloud-b"), lift("legacy")];
    const claim = claimQueueFor(queue, "cloud-a");
    expect(claim.mine.map((item) => item.key)).toEqual(["a", "legacy"]);
    expect(claim.others).toBe(1);
    expect(claim.claimed).toBe(1);
    const again = claimQueueFor(claim.queue, "cloud-b");
    expect(again.mine.map((item) => item.key)).toEqual(["b"]);
    expect(again.claimed).toBe(0);
  });

  it("keeps account A's queued lift as A's after B signs in on the device", async () => {
    window.localStorage.setItem(strengthSyncQueueKey, JSON.stringify([lift("workout-a1-e1", "cloud-a")]));
    const result = await flushSyncQueue("cloud-b", () => "uuid-bench");
    expect(inserted).toEqual([]);
    expect(result).toMatchObject({ sent: 0, remaining: 1, heldForOtherOwner: 1 });
    expect(loadSyncQueue()[0].ownerId).toBe("cloud-a");
    const own = await flushSyncQueue("cloud-a", () => "uuid-bench");
    expect(own.sent).toBe(1);
    expect(inserted).toHaveLength(1);
  });

  it("stamps an unowned lift with the identity that sends it, in storage", async () => {
    window.localStorage.setItem(strengthSyncQueueKey, JSON.stringify([lift("old")]));
    // Unmappable for now, so it stays queued: the claim is what is being checked.
    await flushSyncQueue("cloud-a", () => undefined);
    expect(loadSyncQueue()[0].ownerId).toBe("cloud-a");
    const other = await flushSyncQueue("cloud-b", () => "uuid-bench");
    expect(other).toMatchObject({ sent: 0, heldForOtherOwner: 1 });
    expect(inserted).toEqual([]);
  });
});
