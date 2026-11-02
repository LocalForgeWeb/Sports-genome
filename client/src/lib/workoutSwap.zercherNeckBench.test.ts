import { describe, expect, it } from "vitest";
import type { DeviceWorkoutSession } from "./deviceWorkoutLog";
import { applySwap, canUndoSwap } from "./workoutSwap";
import { catalogMeasureOf } from "@shared/specialization/holdCatalogIds";

/**
 * A swap from a timed manual neck hold to a dynamic machine row (the owner's handoff, T12): what was
 * done stays as it was done, in seconds with its direction and its setup; what is left to do goes to
 * the new exercise in reps, with no direction, no arm loads and no setup of the old one's.
 */
const session = (): DeviceWorkoutSession => ({
  id: "s", title: "Neck", dayLabel: "Week 1 · Day 01 · Neck", startedAt: "2026-11-02T10:00:00.000Z", status: "active", weightUnit: "kg",
  exercises: [{
    id: "hold", exerciseName: "Isometric Neck Lateral Flexion — Manual Resistance", catalogId: 435, plannedPrescription: "3 × 20 s", setup: { setup_note: "towel" },
    sets: [
      { id: "a", weight: "", reps: "", holdSeconds: "20", headDirection: "right", completed: true },
      { id: "b", weight: "", reps: "", holdSeconds: "18", headDirection: "left", completed: false },
      { id: "c", weight: "", reps: "", headDirection: "left", completed: false },
    ],
  }],
});
const measureOf = (target: { id?: number }) => catalogMeasureOf(target.id);

describe("swapping a manual neck hold for a machine extension (T12)", () => {
  it("keeps the done hold in seconds with its direction and setup, and gives the machine row empty rep sets", () => {
    for (const draft of ["keep", "discard", "reuse"] as const) {
      const { session: after, receipt } = applySwap(session(), "hold", { name: "Machine Neck Extension", id: 426 }, { swapId: `x-${draft}`, newExerciseId: "ext", at: "2026-11-02T10:20:00.000Z", draft, measureOf, prescription: "2 × your reps" });
      const original = after.exercises.find((exercise) => exercise.id === "hold")!;
      const replacement = after.exercises.find((exercise) => exercise.id === "ext")!;
      expect(original.sets.filter((set) => set.completed), draft).toEqual([session().exercises[0].sets[0]]);
      expect(original.setup, draft).toEqual({ setup_note: "towel" });
      expect(replacement.setup, draft).toBeUndefined();
      expect(replacement.plannedPrescription, draft).toBe("2 × your reps");
      // Seconds never become reps, and no direction comes across: the extension has none to record.
      expect(replacement.sets.every((set) => !set.holdSeconds && !set.reps && !set.headDirection && set.leftLoad === undefined), draft).toBe(true);
      expect(receipt).not.toBeNull();
    }
  });

  it("can no longer be undone once a direction, an arm's load or a setup is recorded on either side", () => {
    const { session: after, receipt } = applySwap(session(), "hold", { name: "Machine Neck Extension", id: 426 }, { swapId: "x", newExerciseId: "ext", at: "2026-11-02T10:20:00.000Z", draft: "discard", measureOf });
    expect(canUndoSwap(after, receipt!)).toBe(true);
    const withSetup = { ...after, exercises: after.exercises.map((exercise) => (exercise.id === "ext" ? { ...exercise, setup: { machine_model: "Neck 4-way" } } : exercise)) };
    expect(canUndoSwap(withSetup, receipt!)).toBe(false);
  });
});
