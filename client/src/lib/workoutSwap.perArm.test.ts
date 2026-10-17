import { describe, expect, it } from "vitest";
import { exercises } from "./exerciseCatalog";
import { countPlannedSets, type DeviceSetLog, type DeviceWorkoutExercise, type DeviceWorkoutSession, type SetSide } from "./deviceWorkoutLog";
import { addAfter, addSets, applySwap, perArmRowSides, swapMeasurementNotes, swapSets, undoSwap } from "./workoutSwap";

/**
 * Swap and add mid-workout with sets laid out per arm (the tracker's `perArmSets` gate, for an
 * athlete tracking per-arm totals). A planned one-arm "3 × 12" is six rows, Right then Left; a
 * swap counts the plan in planned sets, so whichever exercise does the work, the plan's work is
 * the same: three two-handed sets, or six one-arm rows with their arms.
 */
const byId = (id: number) => exercises.find((exercise) => exercise.id === id)!;
const oneArmCurl = byId(410); // One-Arm Dumbbell Wrist Curl
const hammerCurl = byId(132); // Hammer Curl
const otherOneArm = byId(411);

let ids = 0;
const newSetId = () => `set-${(ids += 1)}`;
const open = (side?: SetSide): DeviceSetLog => ({ id: newSetId(), weight: "", reps: "", completed: false, ...(side ? { side } : {}) });
const done = (side?: SetSide): DeviceSetLog => ({ id: newSetId(), weight: "25", reps: "12", unit: "lb", completed: true, ...(side ? { side } : {}) });
const perArm = (sets: DeviceSetLog[]): DeviceWorkoutExercise => ({ id: "curl-0", exerciseName: oneArmCurl.name, catalogId: oneArmCurl.id, plannedPrescription: "3 × 12", perArm: true, sets });
const twoHanded = (sets: DeviceSetLog[]): DeviceWorkoutExercise => ({ id: "hammer-0", exerciseName: hammerCurl.name, catalogId: hammerCurl.id, plannedPrescription: "3 × 12", sets });
const session = (exercise: DeviceWorkoutExercise): DeviceWorkoutSession => ({
  id: "s1", title: "Pull workout", dayLabel: "Week 1 · Day 01 · Pull", startedAt: "2026-10-17T10:00:00.000Z", status: "active", weightUnit: "lb", restSeconds: 90, exercises: [exercise],
});
const swap = (before: DeviceWorkoutSession, target: { name: string; id: number }, extra: Record<string, unknown> = {}) =>
  applySwap(before, before.exercises[0].id, target, { swapId: "swap-1", newExerciseId: "new-1", at: "2026-10-17T10:20:00.000Z", newSetId, ...extra }, exercises);
const rowsOf = (exercise: DeviceWorkoutExercise) => exercise.sets.map((set) => set.side ?? null);
const sixRows = () => perArmRowSides(3).map((side) => open(side));

describe("Swapping an exercise laid out per arm for a two-handed one", () => {
  it("gives the planned 3 sets, not the 6 rows, with no arm and no per-arm layout", () => {
    const before = session(perArm(sixRows()));
    expect(swapSets(before.exercises[0])).toEqual({ moving: 6, sets: 3, plannedSets: 3, perArm: false });
    const { session: after, receipt } = swap(before, { name: hammerCurl.name, id: hammerCurl.id });
    const replacement = after.exercises[0];
    expect(replacement).toMatchObject({ exerciseName: hammerCurl.name, plannedPrescription: "3 × 12" });
    expect(replacement).not.toHaveProperty("perArm");
    expect(rowsOf(replacement)).toEqual([null, null, null]);
    expect(replacement.sets.every((set) => set.id && !set.completed)).toBe(true);
    expect(undoSwap(after, receipt!)).toEqual(before);
  });

  it("gives what is left of the plan once some arms are done: two one-arm rows left are one two-handed set", () => {
    // Right of set 1 logged: 5 rows left, 3 two-handed sets (set 1's left arm, then sets 2 and 3).
    const one = session(perArm([done("right"), ...sixRows().slice(1)]));
    expect(swapSets(one.exercises[0])).toMatchObject({ moving: 5, sets: 3 });
    const afterOne = swap(one, { name: hammerCurl.name, id: hammerCurl.id });
    expect(afterOne.session.exercises.map((exercise) => [exercise.exerciseName, exercise.sets.length])).toEqual([[oneArmCurl.name, 1], [hammerCurl.name, 3]]);
    expect(undoSwap(afterOne.session, afterOne.receipt!)).toEqual(one);
    // Set 1 done on both arms: 2 sets left.
    const two = session(perArm([done("right"), done("left"), ...sixRows().slice(2)]));
    expect(swap(two, { name: hammerCurl.name, id: hammerCurl.id }).session.exercises[1].sets).toHaveLength(2);
  });
});

describe("Swapping into a one-arm exercise, under the gate", () => {
  it("builds a Right and a Left row for each planned set, with the arm preset, as a planned one is built", () => {
    const before = session(twoHanded([open(), open(), open()]));
    expect(swapSets(before.exercises[0], { perArm: true })).toEqual({ moving: 3, sets: 6, plannedSets: 3, perArm: true });
    const { session: after, receipt } = swap(before, { name: oneArmCurl.name, id: oneArmCurl.id }, { perArm: true });
    const replacement = after.exercises[0];
    expect(replacement).toMatchObject({ exerciseName: oneArmCurl.name, perArm: true, plannedPrescription: "3 × 12" });
    expect(rowsOf(replacement)).toEqual(["right", "left", "right", "left", "right", "left"]);
    expect(countPlannedSets(after)).toBe(6);
    expect(undoSwap(after, receipt!)).toEqual(before);
  });

  it("splits what is left the same way after a logged two-handed set", () => {
    const before = session(twoHanded([done(), open(), open()]));
    const { session: after, receipt } = swap(before, { name: oneArmCurl.name, id: oneArmCurl.id }, { perArm: true });
    expect(after.exercises.map((exercise) => [exercise.exerciseName, rowsOf(exercise)])).toEqual([[hammerCurl.name, [null]], [oneArmCurl.name, ["right", "left", "right", "left"]]]);
    expect(undoSwap(after, receipt!)).toEqual(before);
  });

  it("passes one-arm rows to another one-arm exercise as they are, each with its arm", () => {
    const before = session(perArm([done("right"), ...sixRows().slice(1)]));
    const { session: after, receipt } = swap(before, { name: otherOneArm.name, id: otherOneArm.id }, { perArm: true });
    expect(rowsOf(after.exercises[1])).toEqual(["left", "right", "left", "right", "left"]);
    expect(after.exercises[1].perArm).toBe(true);
    expect(undoSwap(after, receipt!)).toEqual(before);
  });

  it("carries a reused typed set to the first row, which keeps its arm", () => {
    const typed: DeviceSetLog = { id: "typed", weight: "30", reps: "9", unit: "lb", completed: false, side: "left" };
    const before = session(perArm([done("right"), typed, ...sixRows().slice(2)]));
    const { session: after } = swap(before, { name: otherOneArm.name, id: otherOneArm.id }, { perArm: true, draft: "reuse" });
    expect(after.exercises[1].sets[0]).toMatchObject({ side: "left", reps: "9", weight: "" });
  });

  it("starts from the prescription the tracker reads for the incoming exercise", () => {
    const before = session(twoHanded([open(), open(), open()]));
    expect(swap(before, { name: "Dead Hang", id: 143 }, { prescription: "3 × 30 sec" }).session.exercises[0].plannedPrescription).toBe("3 × 30 sec");
  });
});

describe("Without the gate, nothing changes", () => {
  it("swaps a two-handed exercise for a one-arm one row for row, with no arm", () => {
    const before = session(twoHanded([done(), open(), open()]));
    expect(swapSets(before.exercises[0])).toEqual({ moving: 2, sets: 2, plannedSets: 2, perArm: false });
    const { session: after } = swap(before, { name: oneArmCurl.name, id: oneArmCurl.id });
    expect(after.exercises[1]).not.toHaveProperty("perArm");
    expect(rowsOf(after.exercises[1])).toEqual([null, null]);
  });

  it("adds one row per planned set", () => {
    const after = addAfter(session(twoHanded([done(), done(), done()])), "hammer-0", { name: oneArmCurl.name, id: oneArmCurl.id }, { newExerciseId: "added", at: "2026-10-17T10:30:00.000Z", newSetId });
    expect(after.exercises[1]).not.toHaveProperty("perArm");
    expect(rowsOf(after.exercises[1])).toEqual([null, null, null]);
  });
});

describe("Adding an exercise, under the gate", () => {
  it("lays a one-arm exercise out per arm, Right then Left for each planned set", () => {
    const before = session(twoHanded([done(), done(), done()]));
    const after = addAfter(before, "hammer-0", { name: oneArmCurl.name, id: oneArmCurl.id }, { newExerciseId: "added", at: "2026-10-17T10:30:00.000Z", newSetId, perArm: true });
    expect(after.exercises[1]).toMatchObject({ exerciseName: oneArmCurl.name, perArm: true, plannedPrescription: "3 × 12", addedDuringWorkout: { afterExerciseName: hammerCurl.name } });
    expect(rowsOf(after.exercises[1])).toEqual(["right", "left", "right", "left", "right", "left"]);
    expect(addSets("3 × 12", true)).toEqual({ sets: 6, plannedSets: 3, perArm: true });
  });

  it("passes on an anchor's planned sets, not its rows: a two-handed exercise after a per-arm one gets 3", () => {
    const after = addAfter(session(perArm(perArmRowSides(3).map((side) => done(side)))), "curl-0", { name: hammerCurl.name, id: hammerCurl.id }, { newExerciseId: "added", at: "2026-10-17T10:30:00.000Z", newSetId });
    expect(rowsOf(after.exercises[1])).toEqual([null, null, null]);
  });
});

/**
 * The sheet's notes when the new exercise starts from another reading of the same plan entry
 * (the tracker's `incomingFor`): each way round, the note names the reading the new exercise
 * starts from, so it never says "30 sec" is the plan's time for a rep exercise.
 */
describe("the swap sheet's notes on a hold's default", () => {
  const deadHang = byId(143);
  const wristCurl = byId(139);
  const measure = (exercise: { id: number } | undefined) => (exercise?.id === deadHang.id ? "seconds" as const : "reps" as const);

  it("says a hold's default is read as the goal's reps for a rep exercise, and nothing about a time", () => {
    const notes = swapMeasurementNotes(deadHang, wristCurl, "4 × 30 sec", measure, "4 × 3–6");
    expect(notes).toContain("4 × 30 sec is Dead Hang's default as a hold, so Wrist Curl starts from the goal's: 4 × 3–6.");
    expect(notes.join(" ")).not.toContain("is a time");
  });

  it("says the time is a time when the rep exercise starts from it", () => {
    expect(swapMeasurementNotes(deadHang, wristCurl, "3 × 45 sec", measure, "3 × 45 sec")).toContain("The plan's target (3 × 45 sec) is a time; sets here are logged in reps, so set the reps as you go.");
    expect(swapMeasurementNotes(deadHang, wristCurl, "3 × 45 sec", measure).join(" ")).toContain("is a time");
  });

  it("still says a rep default becomes a hold's for a hold coming in", () => {
    expect(swapMeasurementNotes(wristCurl, deadHang, "4 × 3–6", measure, "4 × 30 sec")).toContain("The plan's 4 × 3–6 is the goal's rep default, so Dead Hang starts from a hold's: 4 × 30 sec.");
  });
});
