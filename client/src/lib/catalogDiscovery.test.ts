import { describe, expect, it } from "vitest";
import { exercises } from "./exerciseCatalog";
import { defaultCatalogFilters, filterCatalogExercises } from "./catalogDiscovery";

describe("catalog discovery filters", () => {
  it("finds cable exercises by text and equipment without losing relevant results", () => {
    const results = filterCatalogExercises(exercises, { ...defaultCatalogFilters, query: "row", equipment: "Cable" }, new Set());
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((exercise) => exercise.equipment === "Cable")).toBe(true);
  });

  it("shows only bookmarked exercises when the favorites filter is active", () => {
    const ids = new Set([exercises[0].id, exercises[1].id]);
    const results = filterCatalogExercises(exercises, { ...defaultCatalogFilters, favoritesOnly: true }, ids);
    expect(results.map((exercise) => exercise.id)).toEqual([exercises[0].id, exercises[1].id]);
  });

  it("finds serratus anterior work when an athlete searches with the full anatomical name", () => {
    const results = filterCatalogExercises(exercises, { ...defaultCatalogFilters, query: "serratus anterior" }, new Set());
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results.every((exercise) => [...exercise.primaryMuscles, ...exercise.secondaryMuscles].includes("serratusAnterior"))).toBe(true);
  });
});
