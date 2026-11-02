// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cloudTablesDeletableByAthlete, deleteAthleteData, personalKeysOnDevice, sharedLinksKeyBase, type DeletionDeps } from "./deviceDataDeletion";
import { deviceWorkoutHistoryKey } from "./deviceWorkoutLog";
import { bodyWeightLogKey } from "./bodyWeightLog";
import { resetDeviceRecordStoreForTests, readOwnedList } from "./deviceRecordStore";
import { strengthSyncQueueKey } from "./strengthSyncQueue";
import { workoutPlanKeyBase } from "./deviceBackup";

/**
 * iOS readiness audit, A04: deleting an athlete's data removes exactly their records, turns their
 * shared links off first, never reports a step done that was not, and can be run again safely.
 */
const seed = (owner: string | null = null) => {
  const key = (base: string) => (owner ? `${base}::${owner}` : base);
  window.localStorage.setItem(key(deviceWorkoutHistoryKey), JSON.stringify([{ id: "w1", status: "completed", startedAt: "2026-10-01", exercises: [] }]));
  window.localStorage.setItem(key(bodyWeightLogKey), JSON.stringify([{ bodyMassKg: 80, observedAt: "2026-10-01" }]));
  window.localStorage.setItem(key(strengthSyncQueueKey), JSON.stringify([{ key: "q", lift: {}, athlete: {} }]));
  window.localStorage.setItem(key(workoutPlanKeyBase), JSON.stringify({ weeks: [] }));
  window.localStorage.setItem(key(sharedLinksKeyBase), JSON.stringify([{ token: "t1", manageSecret: "m1" }, { token: "t2", manageSecret: "m2" }]));
};

const deps = (overrides: Partial<DeletionDeps> = {}): DeletionDeps => ({
  storage: window.localStorage,
  owner: null,
  disableLink: vi.fn(async () => true),
  cloud: null,
  ...overrides,
});

beforeEach(() => {
  window.localStorage.clear();
  resetDeviceRecordStoreForTests();
});

describe("deleting the athlete's data", () => {
  it("turns links off, removes every record, and keeps app preferences", async () => {
    seed();
    window.localStorage.setItem("sports-genome-theme-v1", "dark");
    window.localStorage.setItem(`${deviceWorkoutHistoryKey}::unreadable::2026-10-01T00:00:00.000Z`, JSON.stringify({ savedAt: "2026-10-01T00:00:00.000Z", raw: "{" }));
    const disableLink = vi.fn(async () => true);
    const report = await deleteAthleteData(deps({ disableLink }));
    expect(disableLink).toHaveBeenCalledTimes(2);
    expect(report.complete).toBe(true);
    expect(report.steps.map((step) => [step.step, step.status])).toEqual([["links", "done"], ["cloud", "nothing"], ["device", "done"]]);
    expect(Object.keys({ ...window.localStorage })).toEqual(["sports-genome-theme-v1"]);
  });

  it("keeps links that could not be turned off, with their secrets, so trying again can", async () => {
    seed();
    const report = await deleteAthleteData(deps({ disableLink: vi.fn(async (link) => link.token === "t1") }));
    expect(report.complete).toBe(false);
    expect(report.steps[0]).toMatchObject({ step: "links", status: "partial" });
    expect(JSON.parse(window.localStorage.getItem(sharedLinksKeyBase)!)).toEqual([{ token: "t2", manageSecret: "m2" }]);
    expect(window.localStorage.getItem(deviceWorkoutHistoryKey)).toBeNull();
    // Run again, now online: the last link goes, and nothing else needs doing.
    const again = await deleteAthleteData(deps());
    expect(again.complete).toBe(true);
    expect(window.localStorage.getItem(sharedLinksKeyBase)).toBeNull();
  });

  it("deletes the cloud rows and signs out before touching the device, and keeps the device copy if the cloud fails", async () => {
    seed();
    const deleteRows = vi.fn(async (table: string) => table !== "athlete_profiles");
    const signOut = vi.fn(async () => true);
    const failed = await deleteAthleteData(deps({ cloud: { userId: "anon-1", deleteRows, signOut } }));
    expect(failed.complete).toBe(false);
    expect(failed.steps.find((step) => step.step === "cloud")?.status).toBe("failed");
    expect(signOut).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(deviceWorkoutHistoryKey)).not.toBeNull();

    const deleteAll = vi.fn(async () => true);
    const done = await deleteAthleteData(deps({ cloud: { userId: "anon-1", deleteRows: deleteAll, signOut } }));
    expect(deleteAll.mock.calls.map(([table, userId]) => [table, userId])).toEqual(cloudTablesDeletableByAthlete.map((table) => [table, "anon-1"]));
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(done.complete).toBe(true);
    expect(window.localStorage.getItem(deviceWorkoutHistoryKey)).toBeNull();
  });

  it("removes only the signed-in owner's records, never another account's", async () => {
    seed("athlete-a");
    seed("athlete-b");
    const report = await deleteAthleteData(deps({ owner: "athlete-a" }));
    expect(report.complete).toBe(true);
    expect(window.localStorage.getItem(`${deviceWorkoutHistoryKey}::athlete-a`)).toBeNull();
    expect(readOwnedList(deviceWorkoutHistoryKey, "athlete-b")).toHaveLength(1);
    expect(window.localStorage.getItem(`${sharedLinksKeyBase}::athlete-b`)).not.toBeNull();
    expect(personalKeysOnDevice(window.localStorage, "athlete-a")).toEqual([]);
  });

  it("is a no-op the second time, reported as nothing to do", async () => {
    const report = await deleteAthleteData(deps());
    expect(report.complete).toBe(true);
    expect(report.steps.map((step) => step.status)).toEqual(["nothing", "nothing", "nothing"]);
  });
});
