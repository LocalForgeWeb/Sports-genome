import { describe, expect, it } from "vitest";
import { parseSetCount } from "./sessionVolume";
import { getGoalPrescription, holdDefaultPrescription, prescriptionOf, type TrainingGoal } from "./workoutPlanner";
import * as planBouts from "./specialization/planBouts";

/**
 * One reading of a plan entry's prescription, in the planner beside the goal's defaults, so the
 * first screens (Home's Plan editor, picker, print, share) read it without loading the atlas, and
 * Train and the planned atlas read the very same function.
 */
const goals: TrainingGoal[] = ["Athleticism", "Muscle growth", "Max strength", "Capacity"];
const positions = [0, 1, 2, 3, 4, 5];

describe("a plan entry's prescription", () => {
  it("is one function for Home, Train and the planned atlas", () => {
    expect(planBouts.prescriptionOf).toBe(prescriptionOf);
    expect(planBouts.holdDefaultPrescription).toBe(holdDefaultPrescription);
  });

  it("gives an unset hold the goal's set count with a hold's target, so every set count agrees", () => {
    for (const goal of goals) for (const index of positions) {
      const goalDefault = getGoalPrescription(goal, index);
      const hold = prescriptionOf(undefined, index, goal, "seconds");
      expect(hold, `${goal} ${index}`).toBe(`${parseSetCount(goalDefault)} × 30 sec`);
      // The week review, the weekly volume map, Today and the diagnostics count sets from the
      // goal's default: the hold's reading keeps that count.
      expect(parseSetCount(hold), `${goal} ${index}`).toBe(parseSetCount(goalDefault));
      expect(prescriptionOf(undefined, index, goal, "reps")).toBe(goalDefault);
      expect(prescriptionOf(undefined, index, goal)).toBe(goalDefault);
    }
  });

  it("reads any goal's pinned default on a hold as the hold's default, wherever the entry now sits", () => {
    for (const pinnedGoal of goals) for (const pinnedAt of positions) {
      const pinned = getGoalPrescription(pinnedGoal, pinnedAt);
      for (const goal of goals) for (const index of positions) {
        expect(prescriptionOf(pinned, index, goal, "seconds")).toBe(`${parseSetCount(pinned)} × 30 sec`);
        expect(prescriptionOf(pinned, index, goal, "reps")).toBe(pinned);
      }
    }
  });

  it("keeps what the athlete wrote, on a hold and on a rep exercise", () => {
    for (const written of ["3 × 20–40", "4 × 45 sec", "3 × 40", "5 × 10/8/6"]) {
      expect(prescriptionOf(written, 0, "Athleticism", "seconds")).toBe(written);
      expect(prescriptionOf(written, 0, "Athleticism", "reps")).toBe(written);
    }
    expect(prescriptionOf(undefined, 0, undefined, "seconds")).toBe(holdDefaultPrescription);
    expect(prescriptionOf(undefined, 0, undefined)).toBeUndefined();
  });
});
