import { describe, expect, it } from "vitest";
import { exercises } from "./exerciseCatalog";
import type { DeviceSetLog, DeviceWorkoutExercise, DeviceWorkoutSession, SetSide } from "./deviceWorkoutLog";
import { addAfter, applySwap, perArmRowSides, rowsLimbOf, undoSwap } from "./workoutSwap";

/**
 * Rows laid out per side on the leg (10-multi-region.md §2.1, §6.4): a planned set of an exercise
 * done one leg at a time is a Right and a Left row with the side in `legSide`, never in `side`, which
 * stays the arm's. A swap hands rows on with both sides copied together; onto an exercise sided by
 * the other limb, each row's side moves to that limb. No leg region is in production in wave 0, so
 * the limbs are given here as the tracker would give them from the logging policy.
 */
const byId = (id: number) => exercises.find((exercise) => exercise.id === id)!;
const split = byId(173); // Bulgarian Split Squat: one leg at a time
const singleLegRdl = byId(188); // Single-Leg Romanian Deadlift
const oneArmCurl = byId(410); // One-Arm Dumbbell Wrist Curl
const limbs = new Map([[split.id, "leg"], [singleLegRdl.id, "leg"], [oneArmCurl.id, "arm"]] as const);
const sideLimbOf = (target: { id?: number }) => (target.id !== undefined ? limbs.get(target.id) ?? "arm" : "arm");

let ids = 0;
const newSetId = () => `set-${(ids += 1)}`;
const legRow = (legSide: SetSide, fields: Partial<DeviceSetLog> = {}): DeviceSetLog => ({ id: newSetId(), weight: "", reps: "", completed: false, legSide, ...fields });
const perSide = (exercise: { name: string; id: number }, sets: DeviceSetLog[]): DeviceWorkoutExercise => ({ id: `${exercise.id}-0`, exerciseName: exercise.name, catalogId: exercise.id, plannedPrescription: "3 × 10", perArm: true, sets });
const session = (exercise: DeviceWorkoutExercise): DeviceWorkoutSession => ({
  id: "s1", title: "Legs workout", dayLabel: "Week 1 · Day 02 · Legs", startedAt: "2026-10-20T10:00:00.000Z", status: "active", weightUnit: "kg", restSeconds: 90, exercises: [exercise],
});
const swap = (before: DeviceWorkoutSession, target: { name: string; id: number }, extra: Record<string, unknown> = {}) =>
  applySwap(before, before.exercises[0].id, target, { swapId: "swap-1", newExerciseId: "new-1", at: "2026-10-20T10:20:00.000Z", newSetId, sideLimbOf, perArm: true, ...extra }, exercises);
const sidesOf = (exercise: DeviceWorkoutExercise) => exercise.sets.map((set) => [set.side ?? null, set.legSide ?? null]);

describe("one-leg rows handed to another one-leg exercise", () => {
  it("keep each row's leg side, and an arm side a row holds beside it, copied together", () => {
    const rows = [legRow("right"), legRow("left", { side: "both" }), ...perArmRowSides(2).map((side) => legRow(side))];
    const before = session(perSide(split, rows));
    const { session: after, receipt } = swap(before, { name: singleLegRdl.name, id: singleLegRdl.id });
    expect(sidesOf(after.exercises[0])).toEqual([[null, "right"], ["both", "left"], [null, "right"], [null, "left"], [null, "right"], [null, "left"]]);
    expect(after.exercises[0]).toMatchObject({ perArm: true, exerciseName: singleLegRdl.name });
    expect(undoSwap(after, receipt!)).toEqual(before);
  });
});

describe("rows handed across limbs", () => {
  it("move each row's side to the new exercise's limb: leg rows to a one-arm exercise", () => {
    const before = session(perSide(split, perArmRowSides(3).map((side) => legRow(side))));
    const replacement = swap(before, { name: oneArmCurl.name, id: oneArmCurl.id }).session.exercises[0];
    expect(sidesOf(replacement)).toEqual([["right", null], ["left", null], ["right", null], ["left", null], ["right", null], ["left", null]]);
  });

  it("and arm rows to a one-leg exercise", () => {
    const before = session(perSide(oneArmCurl, perArmRowSides(2).map((side) => ({ id: newSetId(), weight: "", reps: "", completed: false, side }))));
    const replacement = swap(before, { name: split.name, id: split.id }).session.exercises[0];
    expect(sidesOf(replacement)).toEqual([[null, "right"], [null, "left"], [null, "right"], [null, "left"]]);
  });

  it("lay a two-sided exercise's sets out on the leg for a one-leg exercise coming in", () => {
    const before = session({ id: "squat-0", exerciseName: "Pendulum Squat", catalogId: 167, plannedPrescription: "2 × 10", sets: [{ id: "a", weight: "", reps: "", completed: false }, { id: "b", weight: "", reps: "", completed: false }] });
    const replacement = swap(before, { name: split.name, id: split.id }).session.exercises[0];
    expect(sidesOf(replacement)).toEqual([[null, "right"], [null, "left"], [null, "right"], [null, "left"]]);
  });
});

describe("rows whose limb this release does not know (a workout left open across a release)", () => {
  const oneArmRow = byId(46); // Dumbbell Row: one arm at a time
  // This release's own answer: 173 is in no production region's mappings in wave 0, so it has no limb.
  const waveZeroLimbOf = (target: { id?: number }) => (target.id === oneArmRow.id || target.id === oneArmCurl.id ? "arm" : null);

  it("take their limb from the rows: leg rows to a one-arm exercise give it arm sides, and none on the leg", () => {
    const before = session(perSide(split, [legRow("right"), legRow("left")]));
    const { session: after, receipt } = swap(before, { name: oneArmRow.name, id: oneArmRow.id }, { sideLimbOf: waveZeroLimbOf });
    expect(sidesOf(after.exercises[0])).toEqual([["right", null], ["left", null]]);
    expect(undoSwap(after, receipt!)).toEqual(before);
  });

  it("read the rows before this release's policy, which may name the other limb", () => {
    // Rows a later release built per leg, on an exercise this release sides by the arm (188 after it is re-sided).
    const before = session(perSide(singleLegRdl, [legRow("right"), legRow("left")]));
    const armLimbOf = () => "arm" as const;
    expect(sidesOf(swap(before, { name: oneArmCurl.name, id: oneArmCurl.id }, { sideLimbOf: armLimbOf }).session.exercises[0])).toEqual([["right", null], ["left", null]]);
  });

  it("go by the limb more rows hold a side on: an arm side picked on a leg row does not make the rows the arm's", () => {
    const before = session(perSide(split, [legRow("right", { side: "both", completed: true, weight: "20", reps: "10" }), legRow("left"), legRow("right"), legRow("left")]));
    const replacement = swap(before, { name: oneArmRow.name, id: oneArmRow.id }, { sideLimbOf: waveZeroLimbOf }).session.exercises.find((exercise) => exercise.id === "new-1")!;
    expect(sidesOf(replacement)).toEqual([["left", null], ["right", null], ["left", null]]);
  });

  it("fall back to the policy, then the arm, when the rows hold as many sides on each limb", () => {
    const rows = [legRow("right", { side: "right" }), legRow("left", { side: "left" })];
    expect(rowsLimbOf({ perArm: true, sets: rows })).toBeNull();
    expect(rowsLimbOf({ perArm: false, sets: [legRow("right")] })).toBeNull();
    expect(rowsLimbOf({ perArm: true, sets: [legRow("right")] })).toBe("leg");
    // Arm rows from this release, to the leg: the side moves to the leg.
    const armRows = session(perSide(oneArmCurl, perArmRowSides(1).map((side) => ({ id: newSetId(), weight: "", reps: "", completed: false, side }))));
    expect(sidesOf(swap(armRows, { name: split.name, id: split.id }).session.exercises[0])).toEqual([[null, "right"], [null, "left"]]);
  });
});

describe("adding a one-leg exercise laid out per side", () => {
  it("builds a Right and a Left row per planned set, on the leg", () => {
    const anchor = session({ id: "squat-0", exerciseName: "Pendulum Squat", catalogId: 167, plannedPrescription: "2 × 10", sets: [] });
    const added = addAfter(anchor, "squat-0", { name: split.name, id: split.id }, { newExerciseId: "new-1", at: "2026-10-20T10:20:00.000Z", newSetId, perArm: true, sideLimb: "leg" }).exercises[1];
    expect(sidesOf(added)).toEqual([[null, "right"], [null, "left"], [null, "right"], [null, "left"]]);
    // Without a limb, rows are the arm's, as before.
    const armRows = addAfter(anchor, "squat-0", { name: oneArmCurl.name, id: oneArmCurl.id }, { newExerciseId: "new-2", at: "2026-10-20T10:20:00.000Z", newSetId, perArm: true }).exercises[1];
    expect(sidesOf(armRows)).toEqual([["right", null], ["left", null], ["right", null], ["left", null]]);
  });
});
