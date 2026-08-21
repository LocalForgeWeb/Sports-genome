import { describe, expect, it } from "vitest";
import { exercises } from "./exerciseCatalog";
import { analyzeWholeStackMuscles } from "./stackMuscleAnalysis";

describe("whole-stack muscle analysis", () => {
  it("aggregates a complete exercise set into ranked muscles with traceable per-exercise contributions", () => {
    const workout = exercises.filter((exercise) => [1, 2, 3].includes(exercise.id));
    const analysis = analyzeWholeStackMuscles(workout);
    expect(analysis.length).toBeGreaterThan(0);
    expect(analysis[0].involvement).toBeGreaterThan(0);
    expect(analysis[0].contributions[0]).toMatchObject({ exerciseId: expect.any(Number), movement: expect.any(String), role: expect.any(String) });
  });
});
