// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

const inserted: unknown[][] = [];
vi.mock("@/lib/supabaseClient", () => ({
  getSupabaseClient: () => ({ from: () => ({ insert: async (rows: unknown[]) => { inserted.push(rows); return { error: null }; } }) }),
}));

import { flushSyncQueue, loadSyncQueue, loadSyncedKeys, saveSyncQueue, type QueuedLift } from "./strengthSyncQueue";

/**
 * A lift that cannot be mapped yet is kept, not lost (Backend V1 SB-06, PS-18). The mapping
 * read failed for every browser, so every queued lift was dropped as unmappable and marked sent.
 */
const lift = (key: string, catalogExerciseId: number): QueuedLift => ({
  key,
  queuedAt: "2026-09-28T12:00:00.000Z",
  athlete: { sexForReference: "male", birthYear: 1998 },
  lift: { catalogExerciseId, observedAt: "2026-09-28T12:00:00.000Z", measurementType: "MULTI_REP", reportedLoad: 100, reportedUnit: "kg", repetitions: 5, source: "device" },
});

beforeEach(() => { window.localStorage.clear(); inserted.length = 0; });

describe("Flushing the lift queue", () => {
  it("sends what it can map and keeps the rest queued, unmarked", async () => {
    saveSyncQueue([lift("mapped", 1), lift("not-yet", 2)]);
    const result = await flushSyncQueue("user-1", (id) => (id === 1 ? "00000000-0000-0000-0000-00000000000e" : undefined));
    expect(result).toMatchObject({ sent: 1, remaining: 1, skipped: 1 });
    expect(loadSyncQueue().map((item) => item.key)).toEqual(["not-yet"]);
    expect(loadSyncedKeys()).toEqual(["mapped"]);
  });

  it("keeps the whole queue when nothing can be mapped, and sends it once the mapping resolves", async () => {
    saveSyncQueue([lift("a", 2), lift("b", 3)]);
    await flushSyncQueue("user-1", () => undefined);
    expect(loadSyncQueue().map((item) => item.key)).toEqual(["a", "b"]);
    expect(inserted).toEqual([]);
    const later = await flushSyncQueue("user-1", () => "00000000-0000-0000-0000-00000000000e");
    expect(later).toMatchObject({ sent: 2, remaining: 0 });
    expect(loadSyncQueue()).toEqual([]);
  });

  it("still lets go of a lift that can never form a row", async () => {
    const broken = { ...lift("broken", 1), lift: { ...lift("broken", 1).lift, reportedLoad: undefined, repetitions: undefined } };
    saveSyncQueue([broken, lift("not-yet", 2)]);
    await flushSyncQueue("user-1", (id) => (id === 1 ? "00000000-0000-0000-0000-00000000000e" : undefined));
    expect(loadSyncQueue().map((item) => item.key)).toEqual(["not-yet"]);
  });
});
