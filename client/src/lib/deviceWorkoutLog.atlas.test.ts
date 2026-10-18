// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  carriedEntryFor, countCompletedSets, deviceWorkoutHistoryKey, finalizeSession, holdSecondsOf, isCompletedSet, isDraftSet, isHoldSet,
  lastCompletedSetFor, loadDeviceWorkoutSessions, newSetId, saveDeviceWorkoutSessions, type DeviceSetLog, type DeviceWorkoutSession,
} from "./deviceWorkoutLog";
import { addAfter, applySwap, canUndoSwap } from "./workoutSwap";

/**
 * The set and exercise fields the specialization atlas adds (02-design.md §6): which arm, a
 * hold's seconds, a warm-up mark, and straps on the exercise. Stored history is read through
 * the same normalizer every screen uses, so what it keeps and what it drops decides what the
 * atlas can ever count.
 */
const session = (sets: unknown[], exercise: Record<string, unknown> = {}): DeviceWorkoutSession => ({
  id: "s1", title: "Pull workout", dayLabel: "Week 1 · Day 01 · Pull", startedAt: "2026-10-16T10:00:00.000Z", completedAt: "2026-10-16T10:40:00.000Z", status: "completed", weightUnit: "lb",
  exercises: [{ id: "hang", exerciseName: "Dead Hang", catalogId: 143, plannedPrescription: "3 × 30", sets: sets as DeviceSetLog[], ...exercise }],
});
const roundTrip = (stored: DeviceWorkoutSession) => {
  window.localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify([stored]));
  return loadDeviceWorkoutSessions()[0];
};

beforeEach(() => window.localStorage.clear());

describe("stored sets keep the atlas's fields, and only valid ones", () => {
  it("keeps a recorded side, hold seconds and a warm-up mark", () => {
    const loaded = roundTrip(session([
      { id: "a", weight: "", reps: "", holdSeconds: "30", side: "left", completed: true },
      { id: "b", weight: "20", reps: "", holdSeconds: "45", side: "both", warmup: true, completed: true },
    ]));
    expect(loaded.exercises[0].sets[0]).toMatchObject({ id: "a", holdSeconds: "30", side: "left" });
    expect(loaded.exercises[0].sets[1]).toMatchObject({ id: "b", holdSeconds: "45", side: "both", warmup: true });
  });

  it("drops an unknown side, hold seconds that are not whole seconds, and a warm-up mark that is not true", () => {
    const loaded = roundTrip(session([
      { weight: "", reps: "8", side: "middle", holdSeconds: "thirty", warmup: "yes", completed: true },
      { weight: "", reps: "8", side: "LEFT", holdSeconds: "-5", warmup: false, completed: true },
      { weight: "", reps: "8", side: 1, holdSeconds: "12.5", completed: true },
      { weight: "", reps: "8", holdSeconds: "", completed: true },
    ]));
    for (const set of loaded.exercises[0].sets) {
      expect(set).not.toHaveProperty("side");
      expect(set).not.toHaveProperty("holdSeconds");
      expect(set).not.toHaveProperty("warmup");
    }
  });

  it("reads hold seconds written as a number, and drops leading zeros", () => {
    const loaded = roundTrip(session([{ weight: "", reps: "", holdSeconds: 40, completed: true }, { weight: "", reps: "", holdSeconds: "030", completed: true }]));
    expect(loaded.exercises[0].sets.map((set) => set.holdSeconds)).toEqual(["40", "30"]);
  });

  it("keeps straps on the exercise only when they are yes or no", () => {
    expect(roundTrip(session([], { straps: "yes" })).exercises[0].straps).toBe("yes");
    expect(roundTrip(session([], { straps: "no" })).exercises[0].straps).toBe("no");
    expect(roundTrip(session([], { straps: "unknown" })).exercises[0]).not.toHaveProperty("straps");
    expect(roundTrip(session([], { straps: true })).exercises[0]).not.toHaveProperty("straps");
  });

  it("writes them back the same way it reads them", () => {
    const written = session([{ weight: "", reps: "", holdSeconds: "30", side: "right", completed: true }, { weight: "", reps: "5", side: "sideways", completed: true }], { straps: "maybe" });
    expect(saveDeviceWorkoutSessions([written])).toBe(true);
    const raw = JSON.parse(window.localStorage.getItem(deviceWorkoutHistoryKey) || "[]") as DeviceWorkoutSession[];
    expect(raw[0].exercises[0]).not.toHaveProperty("straps");
    expect(raw[0].exercises[0].sets[0]).toMatchObject({ holdSeconds: "30", side: "right" });
    expect(raw[0].exercises[0].sets[1]).not.toHaveProperty("side");
  });

  it("leaves history logged before set ids without ids: nothing is migrated", () => {
    const loaded = roundTrip(session([{ weight: "100", reps: "5", completed: true }, { weight: "100", reps: "5", completed: true }]));
    expect(loaded.exercises[0].sets.every((set) => set.id === undefined)).toBe(true);
    expect(saveDeviceWorkoutSessions([loaded])).toBe(true);
    expect(loadDeviceWorkoutSessions()[0].exercises[0].sets.every((set) => set.id === undefined)).toBe(true);
  });
});

describe("a hold is a set with seconds and no reps", () => {
  const hold: DeviceSetLog = { weight: "", reps: "", holdSeconds: "30", completed: true };

  it("is recognised, read as a number, and still counts as a completed set", () => {
    expect(isHoldSet(hold)).toBe(true);
    expect(holdSecondsOf(hold)).toBe(30);
    expect(isHoldSet({ holdSeconds: "" })).toBe(false);
    expect(holdSecondsOf({ holdSeconds: undefined })).toBeNull();
    expect(isCompletedSet(hold)).toBe(true);
    expect(countCompletedSets(session([hold, hold]))).toBe(2);
  });

  it("counts seconds typed but not logged as a draft, so finishing reports it", () => {
    expect(isDraftSet({ weight: "", reps: "", holdSeconds: "20", completed: false })).toBe(true);
    const { session: finished, excludedDrafts, completedSets } = finalizeSession({ ...session([hold, { weight: "", reps: "", holdSeconds: "20", completed: false }]), status: "active" }, "2026-10-16T10:40:00.000Z");
    expect(excludedDrafts).toBe(1);
    expect(completedSets).toBe(1);
    expect(finished.exercises[0].sets).toEqual([hold]);
  });

  it("keeps side, seconds and straps through finishing", () => {
    const active = { ...session([{ id: "x", weight: "70", reps: "", holdSeconds: "40", side: "left", completed: true }], { straps: "yes" }), status: "active" as const };
    const { session: finished } = finalizeSession(active, "2026-10-16T10:40:00.000Z");
    expect(finished.exercises[0]).toMatchObject({ straps: "yes", sets: [{ id: "x", weight: "70", holdSeconds: "40", side: "left" }] });
  });

  it("carries its seconds to the next set, from this workout or the last one", () => {
    const today = session([hold, { weight: "", reps: "", completed: false }]).exercises[0];
    expect(carriedEntryFor(today, 1, [], "lb")).toMatchObject({ seconds: "30", reps: "", source: "session" });
    const past = session([{ weight: "", reps: "", holdSeconds: "45", completed: true }]);
    const fresh = session([{ weight: "", reps: "", completed: false }]).exercises[0];
    expect(lastCompletedSetFor(fresh, [past])).toMatchObject({ holdSeconds: "45" });
    expect(carriedEntryFor(fresh, 0, [past], "lb")).toMatchObject({ seconds: "45", source: "history" });
  });
});

describe("new sets get ids when they are created", () => {
  const running = (): DeviceWorkoutSession => ({ ...session([{ id: "s-1", weight: "", reps: "", completed: false }, { id: "s-2", weight: "", reps: "", completed: false }]), status: "active", completedAt: undefined });

  it("makes ids that differ", () => {
    const ids = Array.from({ length: 50 }, newSetId);
    expect(new Set(ids).size).toBe(50);
    expect(ids.every((id) => id.startsWith("set-"))).toBe(true);
  });

  it("gives an added exercise's sets ids when asked to", () => {
    let n = 0;
    const next = addAfter(running(), "hang", { name: "Wrist Curl", id: 139 }, { newExerciseId: "added", at: "2026-10-16T10:30:00.000Z", newSetId: () => `new-${++n}` });
    expect(next.exercises[1].sets.map((set) => set.id)).toEqual(["new-1", "new-2", "new-3"]);
  });

  it("gives a swapped-in exercise's sets ids, and the swap can still be undone", () => {
    let n = 0;
    const { session: next, receipt } = applySwap(running(), "hang", { name: "Towel Dead Hang", id: 144 }, { swapId: "w1", newExerciseId: "towel", at: "2026-10-16T10:30:00.000Z", newSetId: () => `new-${++n}` });
    expect(next.exercises[0].sets.map((set) => set.id)).toEqual(["new-1", "new-2"]);
    expect(canUndoSwap(next, receipt!)).toBe(true);
  });

  it("counts seconds typed on a swapped-in hold as work, so the swap is no longer undone silently", () => {
    const { session: next, receipt } = applySwap(running(), "hang", { name: "Towel Dead Hang", id: 144 }, { swapId: "w1", newExerciseId: "towel", at: "2026-10-16T10:30:00.000Z" });
    const typed = { ...next, exercises: next.exercises.map((exercise) => ({ ...exercise, sets: exercise.sets.map((set, index) => (index === 0 ? { ...set, holdSeconds: "25" } : set)) })) };
    expect(canUndoSwap(typed, receipt!)).toBe(false);
  });
});
