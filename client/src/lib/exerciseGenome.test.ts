import { describe, expect, it } from "vitest";
import { exercises } from "./exerciseCatalog";
import { analyzeExerciseContext, buildExerciseGenome } from "./exerciseGenome";

describe("Exercise Genome multi-signal model", () => {
  const exercise = exercises.find((item) => item.name === "Cable Serratus Punch") || exercises[0];

  it("exposes explicit adaptation opportunities without claiming a guaranteed outcome", () => {
    const genome = buildExerciseGenome(exercise);
    expect(genome.adaptation.primary).toHaveLength(2);
    expect(genome.adaptation.rationale).toContain("standardized exercise model");
  });

  it("keeps goal, stack, sport-action, and recovery signals separate from the summary grade", () => {
    const analysis = analyzeExerciseContext(exercise, { goal: "Athleticism", currentWorkout: [exercise] });
    expect(Object.keys(analysis.signals).sort()).toEqual(["goalAlignment", "recoveryManageability", "sportActionMatch", "stackDistinctness"]);
    expect(analysis.strengths).toHaveLength(4);
  });

  it("differentiates cable mechanics by the exercise setup instead of using a universal cable profile", () => {
    const byName = (name: string) => exercises.find((item) => item.name === name) || exercise;
    expect(buildExerciseGenome(byName("Cable Fly")).resistanceProfile.bias).toBe("Shortened");
    expect(buildExerciseGenome(byName("Seated Cable Row")).resistanceProfile.bias).toBe("Mid-range");
    expect(buildExerciseGenome(byName("Cable Press Around")).resistanceProfile.bias).toBe("Shortened");
    expect(buildExerciseGenome(byName("Bayesian Cable Curl")).resistanceProfile.bias).toBe("Lengthened");
  });

  it("keeps anti-rotation mechanics distinct from active rotation", () => {
    const antiRotation = exercises.find((item) => /pallof/i.test(item.name)) || exercise;
    const genome = buildExerciseGenome(antiRotation);
    expect(genome.jointActions).toContain("Trunk anti-rotation");
    expect(genome.jointActions).not.toContain("Spinal rotation");
  });
});
