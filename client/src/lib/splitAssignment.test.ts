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
    // "chin" at a word start: the bare substring is inside "machine", and the machine presses are push work.
    expect(pushNames.some((name) => name.includes("row") || name.includes("pull") || /\bchin/.test(name))).toBe(false);
  });

  it("keeps machine presses in Push: 'machine' is not a chin-up", () => {
    const push = new Set(getSplitExercisePool(exercises, "Push").map((exercise) => exercise.name));
    for (const name of ["Machine Chest Press", "Incline Machine Chest Press", "Smith Machine Bench Press", "Machine Shoulder Press", "Machine Lateral Raise", "Seated Dip Machine"]) expect(push.has(name), name).toBe(true);
    expect(push.has("Chin-Up")).toBe(false);
  });

  it("keeps serratus-focused protraction work visible in the default Push pool", () => {
    const serratusExercise = exercises.find((exercise) => exercise.name === "Cable Serratus Punch");
    expect(serratusExercise).toBeDefined();
    expect(matchesTrainingSplit(serratusExercise!, "Push")).toBe(true);
  });
});
