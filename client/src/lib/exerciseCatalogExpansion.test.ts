import { describe, expect, it } from "vitest";
import { baseExercises, exercises } from "./exerciseCatalog";
import { expandedExercises } from "./exerciseCatalogExpansion";
import { forearmCatalogExercises } from "./exerciseCatalogForearm";

describe("sport-relevant catalog expansion", () => {
  it("adds exactly 100 unique records after the original 300-exercise catalog", () => {
    expect(expandedExercises).toHaveLength(100);
    expect(expandedExercises.map((exercise) => exercise.id)).toEqual(Array.from({ length: 100 }, (_, index) => 301 + index));
    // The forearm atlas brief of 16 Oct 2026 adds 16 forearm rows from id 401
    // (exerciseCatalogForearm.ts), and the 50-exercise brief 42 records at 417-458
    // (exerciseCatalogAdditions.ts; its other 8 candidates are forearm rows), so the catalog
    // holds 458; the expansion itself stays 301-400.
    expect(forearmCatalogExercises).toHaveLength(16);
    expect(exercises).toHaveLength(458);
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(458);
    expect(exercises.map((exercise) => exercise.id)).toEqual(Array.from({ length: 458 }, (_, index) => index + 1));
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
