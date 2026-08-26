import { describe, expect, it } from "vitest";
import { buildSetLogPayload, plannedSetCount, resolvedWeightUnit } from "./WorkoutExecutionPanel";

describe("plannedSetCount", () => {
  it("reads the planned number of work sets from common prescription formats", () => {
    expect(plannedSetCount("4 × 3–5")).toBe(4);
    expect(plannedSetCount("3 x 8–12")).toBe(3);
  });

  it("uses a safe default and prevents impractical set-log counts", () => {
    expect(plannedSetCount("RPE 8, autoregulated")).toBe(3);
    expect(plannedSetCount("20 × 1")).toBe(12);
  });

  it("preserves optional actual RPE in the authenticated set-log payload used by progression history", () => {
    expect(buildSetLogPayload(21, 2, "lb", { weight: 20, reps: 12, rpe: 8.5, completed: true })).toEqual({ sessionExerciseId: 21, setNumber: 2, actualWeight: 20, weightUnit: "lb", actualReps: 12, actualRpe: 8.5, completed: true });
  });

  it("starts set logging in the athlete's configured display unit", () => {
    expect(resolvedWeightUnit("kg")).toBe("kg");
    expect(resolvedWeightUnit("lb")).toBe("lb");
    expect(resolvedWeightUnit()).toBe("lb");
  });
});
