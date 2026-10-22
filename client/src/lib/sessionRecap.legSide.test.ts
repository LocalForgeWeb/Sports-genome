import { describe, expect, it } from "vitest";
import type { DeviceWorkoutSession } from "./deviceWorkoutLog";
import { legSideLabel, sessionRecap, setSideLabel, sideLabel } from "./sessionRecap";

/**
 * A leg's side is read back where a set is (07-logger.md, "A set's leg side"): the logger writes a
 * leg-sided set's side to `legSide`, and the recap after Finish, a workout opened from Progress
 * and an exercise's history name it as the live set card does ("· Left", "· Both legs"), the arm's
 * side as before.
 */

const set = (over: Record<string, unknown>) => ({ weight: "40", reps: "8", unit: "kg" as const, completed: true, ...over });
const session: DeviceWorkoutSession = {
  id: "s-legs", title: "Legs", dayLabel: "Week 1 · Day 02 · Legs", startedAt: "2026-10-14T17:00:00.000Z", completedAt: "2026-10-14T18:00:00.000Z", status: "completed", weightUnit: "kg",
  exercises: [
    { id: "split", exerciseName: "Bulgarian Split Squat", catalogId: 173, plannedPrescription: "3 × 8", sets: [set({ legSide: "right" }), set({ legSide: "left" }), set({ legSide: "both" }), set({})] },
    { id: "row", exerciseName: "Dumbbell Row", catalogId: 46, plannedPrescription: "2 × 10", sets: [set({ side: "right" }), set({ side: "both" })] },
  ],
} as DeviceWorkoutSession;

describe("a set's recorded side, read back", () => {
  it("names a leg's side as the live set card does, and an arm's as before; nothing where none was recorded", () => {
    expect([legSideLabel("left"), legSideLabel("right"), legSideLabel("both"), legSideLabel(undefined)]).toEqual(["Left", "Right", "Both legs", null]);
    expect([sideLabel("both"), setSideLabel({ side: "both" }), setSideLabel({ legSide: "both" }), setSideLabel({})]).toEqual(["Both arms", "Both arms", "Both legs", null]);
  });

  it("in the recap after Finish (and so in a workout opened from Progress and an exercise's history)", () => {
    const recap = sessionRecap(session, "kg");
    const [split, row] = recap.exercises;
    expect(split.sets.map((item) => item.side)).toEqual(["Right", "Left", "Both legs", null]);
    expect(split.sets.map((item) => item.line)).toEqual(["40 kg × 8 · Right", "40 kg × 8 · Left", "40 kg × 8 · Both legs", "40 kg × 8"]);
    expect(row.sets.map((item) => item.side)).toEqual(["Right", "Both arms"]);
  });
});
