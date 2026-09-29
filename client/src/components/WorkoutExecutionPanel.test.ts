import { describe, expect, it } from "vitest";
import { buildSetLogPayload, resolvedWeightUnit } from "./WorkoutExecutionPanel";

describe("WorkoutExecutionPanel helpers", () => {
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
