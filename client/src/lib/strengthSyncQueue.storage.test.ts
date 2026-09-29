// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabaseClient", () => ({ getSupabaseClient: () => null }));

import { enqueueLifts, loadSyncQueue, loadSyncedKeys, strengthSyncQueueKey, strengthSyncedKey, type QueuedLift } from "./strengthSyncQueue";

/**
 * What is stored under the two sync keys is read on every launch, while Home renders.
 * A value of the wrong shape must read as empty, not throw: nothing in the app would
 * ever rewrite it, so the app would stay broken until site data was cleared.
 */
const lift = (key: string): QueuedLift => ({
  key,
  queuedAt: "2026-09-28T12:00:00.000Z",
  athlete: { sexForReference: "male", birthYear: 1998 },
  lift: { catalogExerciseId: 1, observedAt: "2026-09-28T12:00:00.000Z", measurementType: "MULTI_REP", reportedLoad: 100, reportedUnit: "kg", repetitions: 5, source: "device" },
});

beforeEach(() => { window.localStorage.clear(); });

describe("Reading the lift queue back from the device", () => {
  it.each(["{}", "42", "\"abc\""])("reads %s under either key as empty and still queues new lifts", (stored) => {
    window.localStorage.setItem(strengthSyncQueueKey, stored);
    window.localStorage.setItem(strengthSyncedKey, stored);
    expect(loadSyncQueue()).toEqual([]);
    expect(loadSyncedKeys()).toEqual([]);
    expect(enqueueLifts(loadSyncQueue(), loadSyncedKeys(), [lift("x")]).map((item) => item.key)).toEqual(["x"]);
  });

  it("keeps only the string keys among those already sent", () => {
    window.localStorage.setItem(strengthSyncedKey, JSON.stringify(["a", 1, null]));
    expect(loadSyncedKeys()).toEqual(["a"]);
  });

  it("drops a queued entry that has no lift to send", () => {
    window.localStorage.setItem(strengthSyncQueueKey, JSON.stringify([{ key: "k" }, null, 7, lift("valid")]));
    expect(loadSyncQueue()).toEqual([lift("valid")]);
  });
});
