// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

// The insert is held open by the test, so it can act while the flush waits on the network.
const insertCalls: { rows: unknown[]; finish: (result: { error: null }) => void }[] = [];
vi.mock("@/lib/supabaseClient", () => ({
  getSupabaseClient: () => ({
    from: () => ({
      insert: (rows: unknown[]) => new Promise((resolve) => { insertCalls.push({ rows, finish: resolve }); }),
    }),
  }),
}));

import { enqueueLifts, flushSyncQueue, loadSyncQueue, loadSyncedKeys, removeQueuedLiftsForSession, saveSyncQueue, type QueuedLift } from "./strengthSyncQueue";
import { workoutStrengthObservations } from "./workoutStrengthRecord";
import type { DeviceWorkoutSession } from "./deviceWorkoutLog";
import { matchSportUuids } from "./supabaseReferenceMap";

const lift = (key: string): QueuedLift => ({
  key,
  queuedAt: "2026-09-18T12:00:00.000Z",
  athlete: { sexForReference: "male", birthYear: 1998 },
  lift: { catalogExerciseId: 1, observedAt: "2026-09-18T12:00:00.000Z", measurementType: "MULTI_REP", reportedLoad: 225, reportedUnit: "lb", repetitions: 8, source: "device" },
});

beforeEach(() => { window.localStorage.clear(); insertCalls.length = 0; });

describe("the outbox between a logged lift and Supabase", () => {
  it("queues a lift that has neither been queued nor sent", () => {
    expect(enqueueLifts([], [], [lift("a"), lift("b")]).map((item) => item.key)).toEqual(["a", "b"]);
  });

  it("never re-queues something already sent, which is what stops duplicates on re-derivation", () => {
    // Observations are re-derived from the session log on every launch, so the
    // same key arrives again and again; only the sent-set makes that safe.
    expect(enqueueLifts([], ["a"], [lift("a"), lift("b")]).map((item) => item.key)).toEqual(["b"]);
  });

  it("does not double-queue something already waiting", () => {
    expect(enqueueLifts([lift("a")], [], [lift("a")]).map((item) => item.key)).toEqual(["a"]);
  });

  it("drops an entry with no key rather than queueing something it cannot dedupe", () => {
    expect(enqueueLifts([], [], [lift(""), lift("b")]).map((item) => item.key)).toEqual(["b"]);
  });

  it("lets go of a removed workout's unsent lifts and keeps every other workout's", () => {
    // Removing a workout deletes it from this device; a lift of it still waiting to be sent
    // would otherwise reach the account on the next flush.
    const workout = (id: string, exerciseIds: string[]) => ({
      id,
      title: "Push",
      dayLabel: "Week 1 · Day 01 · Push",
      startedAt: "2026-09-22T10:00:00.000Z",
      completedAt: "2026-09-22T11:00:00.000Z",
      status: "completed",
      exercises: exerciseIds.map((exerciseId) => ({ id: exerciseId, exerciseName: "Barbell Bench Press", plannedPrescription: "3 × 5", sets: [{ weight: "225", reps: "5", completed: true }] })),
    }) as DeviceWorkoutSession;
    const removed = workout("device-1", ["bench-0", "row-1"]);
    const kept = workout("device-17", ["bench-0"]);
    // The keys the sync queues, derived the same way it derives them.
    const queue = workoutStrengthObservations([removed, kept]).map((observation) => lift(observation.id));
    expect(queue).toHaveLength(3);

    expect(removeQueuedLiftsForSession(queue, removed).map((item) => item.key)).toEqual(
      workoutStrengthObservations([kept]).map((observation) => observation.id),
    );
    expect(removeQueuedLiftsForSession(queue, workout("device-9", ["bench-0"]))).toEqual(queue);
  });

  it("does not bring back a removed workout's lift that was pruned while a send was in flight", async () => {
    // One lift can be sent now; the other belongs to workout "push", whose exercise has no
    // Supabase uuid yet, so it waits. The athlete removes "push" while the send is pending.
    const sendable = { ...lift("workout-pull-e"), lift: { ...lift("workout-pull-e").lift, catalogExerciseId: 1 } };
    const waiting = { ...lift("workout-push-e"), lift: { ...lift("workout-push-e").lift, catalogExerciseId: 2 } };
    saveSyncQueue([sendable, waiting]);

    const flushing = flushSyncQueue("user-1", (id) => (id === 1 ? "00000000-0000-0000-0000-00000000000e" : undefined));
    expect(insertCalls).toHaveLength(1);
    // What ProgressOverviewPanel's removal does: prune the workout's lifts from storage.
    saveSyncQueue(loadSyncQueue().filter((item) => item.key !== "workout-push-e"));
    expect(loadSyncQueue().map((item) => item.key)).toEqual(["workout-pull-e"]);

    insertCalls[0].finish({ error: null });
    const result = await flushing;

    expect(loadSyncQueue()).toEqual([]);
    expect(result).toMatchObject({ sent: 1, remaining: 0 });
    expect(loadSyncedKeys()).toEqual(["workout-pull-e"]);
  });

  it("keeps a lift queued while a send was in flight", async () => {
    saveSyncQueue([lift("workout-a-e")]);
    const flushing = flushSyncQueue("user-1", () => "00000000-0000-0000-0000-00000000000e");
    saveSyncQueue([...loadSyncQueue(), lift("workout-b-e")]);
    insertCalls[0].finish({ error: null });
    await flushing;
    expect(loadSyncQueue().map((item) => item.key)).toEqual(["workout-b-e"]);
  });
});

describe("bridging app ids to the uuids the foreign keys need", () => {
  const supabaseSports = [
    { id: "uuid-wrestling", name: "Wrestling" },
    { id: "uuid-bjj", name: "Brazilian Jiu-Jitsu" },
    { id: "uuid-track", name: "Track and field" },
  ];

  it("matches on normalised names, across punctuation and case", () => {
    const map = matchSportUuids(
      [{ id: "wrestling", label: "Wrestling" }, { id: "brazilian-jiu-jitsu", label: "Brazilian jiu-jitsu" }, { id: "track-and-field", label: "Track & field" }],
      supabaseSports,
    );
    expect(map["wrestling"]).toBe("uuid-wrestling");
    expect(map["brazilian-jiu-jitsu"]).toBe("uuid-bjj");
  });

  it("leaves a sport with no Supabase row unmapped instead of guessing a neighbour", () => {
    // skiing and Olympic weightlifting have no row in public.sports yet, and a
    // lift filed under the wrong sport would poison the cohort.
    const map = matchSportUuids([{ id: "skiing", label: "Skiing" }], supabaseSports);
    expect(map["skiing"]).toBeUndefined();
  });

  it("falls back to the slug when the label does not match but the id does", () => {
    const map = matchSportUuids([{ id: "wrestling", label: "Folkstyle" }], supabaseSports);
    expect(map["wrestling"]).toBe("uuid-wrestling");
  });
});
