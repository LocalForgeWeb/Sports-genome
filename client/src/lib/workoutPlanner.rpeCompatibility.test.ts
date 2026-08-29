import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { getWorkoutDiagnostics } from "@/lib/workoutPlanner";

describe("RPE-free saved-plan diagnostic compatibility", () => {
  it("keeps diagnostics available when a saved exercise setting has no legacy RPE field", () => {
    const exercise = exercises[0];
    const legacyOrRpeFreeSettings = { [exercise.id]: { rest: "90 sec", notes: "", completed: false } } as never;

    expect(() => getWorkoutDiagnostics([exercise], { [exercise.id]: "3 × 8" }, legacyOrRpeFreeSettings, "Muscle growth")).not.toThrow();
  });
});
