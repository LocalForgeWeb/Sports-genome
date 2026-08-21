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
});
