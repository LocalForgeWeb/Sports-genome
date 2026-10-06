// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { exercises } from "./exerciseCatalog";
import { activePosition, carriedEntryFor, countCompletedSets, countPlannedSets, finalizeSession, loadDeviceWorkoutSessions, saveDeviceWorkoutSessions, type DeviceSetLog, type DeviceWorkoutExercise, type DeviceWorkoutSession } from "./deviceWorkoutLog";
import { addAfter, applySwap, assessSwap, canUndoSwap, swapMeasurementNotes, swapNote, swapSuggestions, undoSwap } from "./workoutSwap";
import { workoutStrengthObservations } from "./workoutStrengthRecord";
import { rankExerciseMatches } from "./exerciseSearch";

const sissy = exercises.find((exercise) => exercise.name === "Sissy Squat")!;
const barbell = exercises.find((exercise) => exercise.name === "Back Squat")!;
const bench = exercises.find((exercise) => exercise.name === "Barbell Bench Press")!;

const done = (weight: string, reps: string): DeviceSetLog => ({ weight, reps, unit: "lb", completed: true });
const open = (): DeviceSetLog => ({ weight: "", reps: "", completed: false });

function session(sets: DeviceSetLog[], extra: Partial<DeviceWorkoutSession> = {}): DeviceWorkoutSession {
  return {
    id: "s1", title: "Legs workout", dayLabel: "Week 1 · Legs", startedAt: "2026-10-06T10:00:00.000Z", status: "active", weightUnit: "lb", restSeconds: 90,
    exercises: [
      { id: `${sissy.id}-0`, exerciseName: sissy.name, catalogId: sissy.id, plannedPrescription: "4 × 10", sets },
      { id: `${bench.id}-1`, exerciseName: bench.name, catalogId: bench.id, plannedPrescription: "3 × 8", sets: [open(), open(), open()] },
    ],
    ...extra,
  };
}
const to = { name: barbell.name, id: barbell.id };
const options = (extra: Record<string, unknown> = {}) => ({ swapId: "swap-1", newExerciseId: "new-1", at: "2026-10-06T10:20:00.000Z", ...extra });

beforeEach(() => window.localStorage.clear());

describe("swapping an exercise mid-workout (Oct 6 brief §3)", () => {
  it("replaces in place when nothing is logged, with the same sets to do", () => {
    const before = session([open(), open(), open(), open()]);
    expect(assessSwap(before.exercises[0]).kind).toBe("replace");
    const { session: after, receipt } = applySwap(before, before.exercises[0].id, to, options(), exercises);
    expect(after.exercises.map((exercise) => exercise.exerciseName)).toEqual(["Back Squat", "Barbell Bench Press"]);
    expect(after.exercises[0]).toMatchObject({ id: "new-1", catalogId: barbell.id, plannedPrescription: "4 × 10", swappedFrom: { swapId: "swap-1", exerciseName: "Sissy Squat", catalogId: sissy.id, afterSets: 0 } });
    expect(after.exercises[0].sets).toHaveLength(4);
    expect(countPlannedSets(after)).toBe(countPlannedSets(before));
    expect(receipt?.original).toBeNull();
    expect(swapNote(after.exercises[0])).toBe("Switched from Sissy Squat before any sets");
  });

  it("keeps the 2 logged sets with Sissy Squat and gives Barbell Squat the remaining 2, straight after it", () => {
    const logged = [done("", "12"), done("10", "10")];
    const before = session([...logged, open(), open()]);
    const assessment = assessSwap(before.exercises[0]);
    expect(assessment).toMatchObject({ kind: "split", completedSets: 2, openSets: 2 });
    const { session: after } = applySwap(before, before.exercises[0].id, to, options(), exercises);
    expect(after.exercises.map((exercise) => exercise.exerciseName)).toEqual(["Sissy Squat", "Back Squat", "Barbell Bench Press"]);
    // The completed sets are untouched, byte for byte, and still Sissy Squat's.
    expect(after.exercises[0].sets).toEqual(logged);
    expect(after.exercises[0].replacedBy).toMatchObject({ exerciseName: "Back Squat", afterSets: 2 });
    expect(after.exercises[1].sets).toEqual([open(), open()]);
    expect(countPlannedSets(after)).toBe(4 + 3);
    expect(countCompletedSets(after)).toBe(2);
    expect(swapNote(after.exercises[0])).toBe("Switched to Back Squat after 2 sets");
    expect(swapNote(after.exercises[1])).toBe("Switched from Sissy Squat after 2 sets");
    // Tracking carries on at the new exercise's first set.
    expect(activePosition(after)).toEqual({ exerciseIndex: 1, setIndex: 0 });
  });

  it("leaves the rest timer exactly as it was", () => {
    const before = session([done("", "12"), open()], { restEndsAt: "2026-10-06T10:21:30.000Z", restSeconds: 120 });
    const { session: after } = applySwap(before, before.exercises[0].id, to, options(), exercises);
    expect(after.restEndsAt).toBe(before.restEndsAt);
    expect(after.restSeconds).toBe(120);
  });

  it("asks about typed-but-unlogged input: keep it with the original, discard it, or reuse the reps without the load", () => {
    const typed: DeviceSetLog = { weight: "25", reps: "9", unit: "lb", completed: false };
    const before = session([done("", "12"), typed, open()]);
    expect(assessSwap(before.exercises[0]).draftSets).toBe(1);

    const kept = applySwap(before, before.exercises[0].id, to, options({ draft: "keep" }), exercises).session;
    expect(kept.exercises[0].sets).toEqual([done("", "12"), typed]);
    expect(kept.exercises[1].sets).toHaveLength(1);
    // The kept draft is never made the next set: tracking moves to the new exercise.
    expect(activePosition(kept)).toEqual({ exerciseIndex: 1, setIndex: 0 });
    // And, unlogged, it is left out at finish like any draft.
    expect(finalizeSession(kept).excludedDrafts).toBe(1);

    const discarded = applySwap(before, before.exercises[0].id, to, options({ draft: "discard" }), exercises).session;
    expect(discarded.exercises[0].sets).toEqual([done("", "12")]);
    expect(discarded.exercises[1].sets).toEqual([open(), open()]);

    const reused = applySwap(before, before.exercises[0].id, to, options({ draft: "reuse" }), exercises).session;
    expect(reused.exercises[1].sets[0]).toEqual({ weight: "", reps: "9", completed: false });
    expect(reused.exercises[1].sets[0].weight).toBe("");
  });

  it("keeps a drop set under way with the original, as the set it was", () => {
    const partial: DeviceSetLog = { id: "d1", type: "drop", stages: [{ id: "d1-stage-1", weight: "100", reps: "5", unit: "lb" }, { id: "d1-stage-2", weight: "70", reps: "6", unit: "lb" }], weight: "", reps: "", completed: false };
    const before = session([done("", "12"), partial, open()]);
    expect(assessSwap(before.exercises[0]).partialDrop).toEqual({ setIndex: 1, stages: 2 });
    const kept = applySwap(before, before.exercises[0].id, to, options({ partialDrop: "keep" }), exercises).session;
    expect(kept.exercises[0].sets[1]).toMatchObject({ type: "drop", completed: true, weight: "100", reps: "5" });
    expect(kept.exercises[0].sets[1].stages).toHaveLength(2);
    expect(kept.exercises[1].sets).toHaveLength(1);
    const discarded = applySwap(before, before.exercises[0].id, to, options({ partialDrop: "discard" }), exercises).session;
    expect(discarded.exercises[0].sets).toHaveLength(1);
    expect(discarded.exercises[1].sets).toHaveLength(2);
  });

  it("says there is nothing left when every set is done, and adds the exercise after it instead", () => {
    const before = session([done("", "12"), done("", "12")]);
    expect(assessSwap(before.exercises[0]).kind).toBe("nothing_left");
    const after = addAfter(before, before.exercises[0].id, to, { newExerciseId: "added-1", at: "2026-10-06T10:30:00.000Z" });
    expect(after.exercises.map((exercise) => exercise.exerciseName)).toEqual(["Sissy Squat", "Back Squat", "Barbell Bench Press"]);
    expect(after.exercises[0]).toEqual(before.exercises[0]);
    expect(after.exercises[1].sets).toHaveLength(4);
    expect(swapNote(after.exercises[1])).toBe("Added after Sissy Squat");
    // A second tap with the same id adds nothing more.
    expect(addAfter(after, before.exercises[0].id, to, { newExerciseId: "added-1", at: "x" })).toBe(after);
  });

  it("applies one swap once: the same confirm again, or a swap of an exercise already swapped out, changes nothing", () => {
    const before = session([done("", "12"), open()]);
    const first = applySwap(before, before.exercises[0].id, to, options(), exercises);
    const again = applySwap(first.session, before.exercises[0].id, to, options(), exercises);
    expect(again.session).toBe(first.session);
    expect(again.receipt).toBeNull();
    const second = applySwap(first.session, before.exercises[0].id, to, options({ swapId: "swap-2", newExerciseId: "new-2" }), exercises);
    expect(second.session).toBe(first.session);
  });

  it("undoes exactly, until something is logged or typed on the new exercise", () => {
    const before = session([done("", "12"), done("", "12"), open(), open()]);
    const { session: after, receipt } = applySwap(before, before.exercises[0].id, to, options(), exercises);
    expect(canUndoSwap(after, receipt!)).toBe(true);
    expect(undoSwap(after, receipt!)).toEqual(before);

    const inPlace = session([open(), open()]);
    const swapped = applySwap(inPlace, inPlace.exercises[0].id, to, options(), exercises);
    expect(undoSwap(swapped.session, swapped.receipt!)).toEqual(inPlace);

    const worked: DeviceWorkoutSession = { ...after, exercises: after.exercises.map((exercise, index) => index === 1 ? { ...exercise, sets: [done("135", "5"), exercise.sets[1]] } : exercise) };
    expect(canUndoSwap(worked, receipt!)).toBe(false);
    expect(undoSwap(worked, receipt!)).toBe(worked);
  });

  it("survives a reload: the swap, the identities and the position come back from storage", () => {
    const before = session([done("", "12"), done("", "10"), open(), open()]);
    const { session: after } = applySwap(before, before.exercises[0].id, to, options(), exercises);
    expect(saveDeviceWorkoutSessions([after])).toBe(true);
    const [restored] = loadDeviceWorkoutSessions();
    expect(restored.exercises[0]).toMatchObject({ catalogId: sissy.id, replacedBy: { swapId: "swap-1", exerciseName: "Back Squat" } });
    expect(restored.exercises[1]).toMatchObject({ catalogId: barbell.id, swappedFrom: { exerciseName: "Sissy Squat", afterSets: 2 } });
    expect(activePosition(restored)).toEqual({ exerciseIndex: 1, setIndex: 0 });
  });

  it("never carries load across exercises: Barbell Squat's last logged comes from its own history", () => {
    const history: DeviceWorkoutSession[] = [{
      id: "old", title: "Old", dayLabel: "Legs", startedAt: "2026-10-01T10:00:00.000Z", completedAt: "2026-10-01T11:00:00.000Z", status: "completed", weightUnit: "lb",
      exercises: [{ id: "x", exerciseName: "Back Squat", plannedPrescription: "3 × 5", sets: [done("185", "5")] }],
    }];
    const before = session([done("40", "12"), done("40", "12"), open(), open()]);
    const { session: after } = applySwap(before, before.exercises[0].id, to, options(), exercises);
    expect(carriedEntryFor(after.exercises[1], 0, history, "lb")).toMatchObject({ weight: "185", reps: "5", source: "history" });
    expect(carriedEntryFor(after.exercises[1], 0, [], "lb")).toBeNull();
  });

  it("records each part as the exercise actually performed, for history and analysis", () => {
    const before = session([done("", "12"), done("", "12"), open(), open()]);
    const swapped = applySwap(before, before.exercises[0].id, to, options(), exercises).session;
    const logged: DeviceWorkoutSession = { ...swapped, exercises: swapped.exercises.map((exercise, index) => index === 1 ? { ...exercise, sets: [done("185", "5"), done("185", "5")] } : exercise) };
    const { session: finished } = finalizeSession(logged, "2026-10-06T11:00:00.000Z");
    expect(finished.exercises.map((exercise) => [exercise.exerciseName, exercise.sets.length])).toEqual([["Sissy Squat", 2], ["Back Squat", 2]]);
    const observations = workoutStrengthObservations([finished], "lb");
    const byName = Object.fromEntries(observations.map((observation) => [observation.exerciseName, observation]));
    expect(byName["Sissy Squat"]).toMatchObject({ repetitions: 12, setCount: 2, loadSemantics: "bodyweight_reps" });
    expect(byName["Back Squat"]).toMatchObject({ reportedLoad: 185, repetitions: 5, setCount: 2, loadSemantics: "total_external_load" });
  });

  it("explains how the new exercise is logged where that differs, and flags a timed target", () => {
    const notes = swapMeasurementNotes(sissy, barbell, "3 × 10");
    expect(notes.join(" ")).toContain("Sissy Squat is logged as reps, with any weight added to the body; Back Squat as the whole load");
    expect(swapMeasurementNotes(barbell, barbell, "3 × 5")).toEqual([]);
    expect(swapMeasurementNotes(barbell, barbell, "3 × 30 s").join(" ")).toContain("is a time");
  });

  it("finds Barbell Squat for Sissy Squat: suggested, and by the words people use", () => {
    const suggested = swapSuggestions(sissy, exercises, new Set()).map((exercise) => exercise.name);
    expect(suggested).toContain("Back Squat");
    expect(suggested).not.toContain("Sissy Squat");
    expect(rankExerciseMatches(exercises, "barbell squat")[0].exercise.name).toBe("Back Squat");
  });
});

describe("a session exercise's identity", () => {
  it("keeps the catalog id and name it was logged under", () => {
    const exercise: DeviceWorkoutExercise = { id: "a", exerciseName: "Sissy Squat", catalogId: sissy.id, plannedPrescription: "3 × 10", sets: [done("", "10")] };
    expect(saveDeviceWorkoutSessions([{ ...session([]), exercises: [exercise] }])).toBe(true);
    expect(loadDeviceWorkoutSessions()[0].exercises[0]).toMatchObject({ id: "a", exerciseName: "Sissy Squat", catalogId: sissy.id, sets: [{ reps: "10", completed: true }] });
  });
});
