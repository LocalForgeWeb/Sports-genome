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

  it("keeps the authenticated set-log payload focused on recorded weight, reps, and completion", () => {
    expect(buildSetLogPayload(21, 2, "lb", { weight: 20, reps: 12, completed: true })).toEqual({ sessionExerciseId: 21, setNumber: 2, actualWeight: 20, weightUnit: "lb", actualReps: 12, completed: true });
  });

  it("starts set logging in the athlete's configured display unit", () => {
    expect(resolvedWeightUnit("kg")).toBe("kg");
    expect(resolvedWeightUnit("lb")).toBe("lb");
    expect(resolvedWeightUnit()).toBe("lb");
  });

  it("keeps one readable authenticated set-save label without duplicating the button action", async () => {
    const { readFileSync } = await import("node:fs");
    const source = readFileSync(new URL("./WorkoutExecutionPanel.tsx", import.meta.url), "utf8");
    expect(source).not.toContain(': "Save"}\n      <span>{complete ? "Saved" : "Save set"}</span>');
  });
});
