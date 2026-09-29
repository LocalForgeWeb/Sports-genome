// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

type InsertResult = { error: { code: string } | null; status: number };
const insert = vi.hoisted(() => vi.fn<(rows: Record<string, unknown>[]) => Promise<InsertResult>>());
vi.mock("@/lib/supabaseClient", () => ({ getSupabaseClient: () => ({ from: () => ({ insert }) }) }));

import { flushSyncQueue, loadSyncQueue, loadSyncedKeys, saveSyncQueue, type QueuedLift } from "./strengthSyncQueue";

/**
 * One row the database turns down fails the whole batch. It used to hold back every other
 * queued lift on every flush after it. A dropped connection, which postgrest-js returns as
 * status 0 instead of throwing, was also reported as a rejection.
 */
const lift = (key: string, reportedLoad: number): QueuedLift => ({
  key,
  queuedAt: "2026-09-28T12:00:00.000Z",
  athlete: { sexForReference: "male", birthYear: 1998 },
  lift: { catalogExerciseId: 1, observedAt: "2026-09-28T12:00:00.000Z", measurementType: "MULTI_REP", reportedLoad, reportedUnit: "kg", repetitions: 5, source: "device" },
});
const mapped = () => "00000000-0000-0000-0000-00000000000e";
const queuedKeys = () => loadSyncQueue().map((item) => item.key);
// A load past numeric(9,3) overflows the column: Postgres refuses any statement that holds it.
const overflows = (rows: Record<string, unknown>[]) => rows.some((row) => row.reported_load_value === 2000000);

beforeEach(() => { window.localStorage.clear(); insert.mockReset(); });

describe("A lift the database turns down", () => {
  it("stays queued while the lifts queued with it land", async () => {
    insert.mockImplementation(async (rows) => (overflows(rows) ? { error: { code: "22003" }, status: 400 } : { error: null, status: 201 }));
    saveSyncQueue([lift("a", 100), lift("b", 2000000)]);

    const result = await flushSyncQueue("user-1", mapped);
    expect(result).toMatchObject({ sent: 1, remaining: 1, reason: "rejected" });
    expect(queuedKeys()).toEqual(["b"]);
    expect(loadSyncedKeys()).toEqual(["a"]);

    const again = await flushSyncQueue("user-1", mapped);
    expect(again).toMatchObject({ sent: 0, remaining: 1, reason: "rejected" });
    expect(queuedKeys()).toEqual(["b"]);
    expect(loadSyncedKeys()).toEqual(["a"]);
  });
});

describe("A dropped connection", () => {
  it("is reported as offline, keeps every lift and is not retried row by row", async () => {
    insert.mockResolvedValue({ error: { code: "" }, status: 0 });
    saveSyncQueue([lift("a", 100), lift("b", 110)]);

    const result = await flushSyncQueue("user-1", mapped);
    expect(result).toMatchObject({ sent: 0, reason: "offline" });
    expect(queuedKeys()).toEqual(["a", "b"]);
    expect(loadSyncedKeys()).toEqual([]);
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it("stops the row-by-row retry where the connection went, keeping what did not land", async () => {
    insert
      .mockResolvedValueOnce({ error: { code: "22003" }, status: 400 })
      .mockResolvedValueOnce({ error: null, status: 201 })
      .mockResolvedValueOnce({ error: { code: "" }, status: 0 });
    saveSyncQueue([lift("a", 100), lift("b", 2000000), lift("c", 120)]);

    const result = await flushSyncQueue("user-1", mapped);
    expect(result).toMatchObject({ sent: 1, reason: "offline" });
    expect(insert).toHaveBeenCalledTimes(3);
    expect(queuedKeys()).toEqual(["b", "c"]);
    expect(loadSyncedKeys()).toEqual(["a"]);
  });
});
