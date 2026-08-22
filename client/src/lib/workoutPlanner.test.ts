import { describe, expect, it } from "vitest";
import { getGoalPrescription, getProgrammingTarget, getWorkoutDiagnostics } from "./workoutPlanner";
import { exercises } from "@/lib/exerciseCatalog";
import { trainingEvidence } from "./trainingEvidence";

describe("evidence-bounded programming guidance", () => {
  it("keeps all goal modes explicit that their numeric ranges are planning anchors", () => {
    (["Athleticism", "Muscle growth", "Max strength", "Capacity"] as const).forEach((goal) => {
      expect(getProgrammingTarget(goal).evidenceBoundary).toMatch(/planning|app|model|individual/i);
    });
  });

  it("uses an evidence-informed hypertrophy volume reference without calling it an optimum", () => {
    const target = getProgrammingTarget("Muscle growth");
    expect(target.weeklyVolumeCue).toContain("Approximately 10");
    expect(target.weeklyVolumeCue).toMatch(/starting reference/i);
  });

  it("derives the default hypertrophy prescription from the source-linked broad loading anchor", () => {
    expect(getGoalPrescription("Muscle growth", 0)).toBe(`3 × ${trainingEvidence.hypertrophy.workingRepetitions[0]}–${trainingEvidence.hypertrophy.workingRepetitions[1]}`);
    expect(getProgrammingTarget("Max strength").restCue).toContain(`${trainingEvidence.strength.trainedRestFloorSeconds / 60} minutes`);
  });

  it("surfaces pair-level redundancy findings as a planning model, not a recovery measurement", () => {
    const bench = exercises.find((exercise) => exercise.name === "Barbell Bench Press") || exercises[0];
    const dumbbellBench = exercises.find((exercise) => exercise.name === "Dumbbell Bench Press") || exercises[1];
    const diagnostics = getWorkoutDiagnostics([bench, dumbbellBench], {}, {}, "Muscle growth");
    expect(diagnostics.redundancyFindings.length).toBeGreaterThan(0);
    expect(diagnostics.redundancyFindings[0]?.reason).toMatch(/purpose|planning|complementary/i);
  });
});
