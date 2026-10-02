import { describe, expect, it } from "vitest";
import { exercises } from "./exerciseCatalog";
import { analyzeWholeStackMuscles } from "./stackMuscleAnalysis";

describe("whole-stack muscle analysis", () => {
  it("aggregates a complete exercise set into ranked muscles with traceable per-exercise contributions", () => {
    const workout = exercises.filter((exercise) => [1, 2, 3].includes(exercise.id));
    const analysis = analyzeWholeStackMuscles(workout);
    expect(analysis.length).toBeGreaterThan(0);
    expect(analysis[0].involvement).toBeGreaterThan(0);
    expect(analysis[0].involvement).toBe(100);
    expect(new Set(analysis.map((item) => item.involvement)).size).toBeGreaterThan(1);
    expect(analysis[0].contributions[0]).toMatchObject({ exerciseId: expect.any(Number), movement: expect.any(String), role: expect.any(String) });
  });

  /**
   * The Sep 30 recording's Push day: Barbell Bench Press (1), Machine Chest Press (11),
   * Barbell Overhead Press (101), Cable Triceps Pushdown (150). These figures come from the
   * catalog's muscle tags and the genome's targeting scores, so a catalog edit can move
   * them legitimately. Before the double-count guard the overhead press counted frontDelts
   * as a prime mover and again as a synergist, which put anterior deltoid at 100 and
   * triceps at 84 (Sep 30 brief §7).
   */
  it("gives the recorded Push day its corrected relative involvement", () => {
    const workout = [1, 11, 101, 150].map((id) => exercises.find((exercise) => exercise.id === id)!);
    const analysis = analyzeWholeStackMuscles(workout);
    const byMuscle = Object.fromEntries(analysis.map((item) => [item.muscle, item]));
    expect(analysis.map((item) => [item.muscle, item.involvement])).toEqual([
      ["triceps", 100],
      ["frontDelts", 99],
      ["chest", 77],
      ["abs", 40],
      ["sideDelts", 39],
    ]);
    // The denominator is the day's highest muscle on the same basis: triceps' role-weighted sum.
    expect(byMuscle.triceps.rawInvolvement).toBeCloseTo(178.2, 1);
    expect(byMuscle.frontDelts.rawInvolvement).toBeCloseTo(175.6, 1);
    // The overhead press is listed once for front delts, as a prime mover; three other exercises support it.
    expect(byMuscle.frontDelts.contributions.filter((entry) => entry.exerciseId === 101).map((entry) => entry.role)).toEqual(["Prime mover"]);
    expect(byMuscle.frontDelts.primaryExercises).toBe(1);
    expect(byMuscle.frontDelts.supportingExercises).toBe(3);
  });
});
