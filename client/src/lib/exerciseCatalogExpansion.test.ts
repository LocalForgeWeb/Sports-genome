import { describe, expect, it } from "vitest";
import { baseExercises, exercises } from "./exerciseCatalog";
import { expandedExercises } from "./exerciseCatalogExpansion";

describe("sport-relevant catalog expansion", () => {
  it("adds exactly 100 unique records after the original 300-exercise catalog", () => {
    expect(expandedExercises).toHaveLength(100);
    expect(exercises).toHaveLength(400);
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(400);
    const baseNames = new Set(baseExercises.map((exercise) => exercise.name.toLowerCase()));
    const expansionNames = expandedExercises.map((exercise) => exercise.name.toLowerCase());
    expect(new Set(expansionNames).size).toBe(100);
    expect(expansionNames.every((name) => !baseNames.has(name))).toBe(true);
  });

  it("adds strong cable coverage while retaining all sport-fit records", () => {
    expect(expandedExercises.filter((exercise) => exercise.equipment === "Cable")).toHaveLength(80);
    expect(expandedExercises.every((exercise) => Object.keys(exercise.sportFit).length === 5)).toBe(true);
  });
});
