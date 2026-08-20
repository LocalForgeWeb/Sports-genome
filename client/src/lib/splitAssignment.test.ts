import { describe, expect, it } from "vitest";
import { exercises } from "./exerciseCatalog";
import { getSplitExercisePool, matchesTrainingSplit, type TrainingSplit } from "./splitAssignment";

describe("split category integrity", () => {
  const splits: TrainingSplit[] = ["Push", "Pull", "Legs", "Upper", "Lower", "Full Body", "Sport Transfer"];

  it("only returns exercises that match each requested split", () => {
    splits.forEach((split) => {
      const pool = getSplitExercisePool(exercises, split);
      expect(pool.length).toBeGreaterThan(0);
      expect(pool.every((exercise) => matchesTrainingSplit(exercise, split))).toBe(true);
    });
  });

  it("does not allow pulling patterns inside a Push pool", () => {
    const pushNames = getSplitExercisePool(exercises, "Push").map((exercise) => `${exercise.name} ${exercise.movement}`.toLowerCase());
    expect(pushNames.some((name) => name.includes("row") || name.includes("pull") || name.includes("chin"))).toBe(false);
  });
});
