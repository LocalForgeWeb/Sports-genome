import { describe, expect, it } from "vitest";
import { exercises } from "./exerciseCatalog";
import { defaultCatalogFilters, filterCatalogByActionLink, filterCatalogExercises } from "./catalogDiscovery";

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

  it("returns serratus work when only the muscle quick-filter value is applied", () => {
    const results = filterCatalogExercises(exercises, { ...defaultCatalogFilters, muscle: "serratusAnterior" }, new Set());
    expect(results.map((exercise) => exercise.name)).toEqual(expect.arrayContaining(["Cable Serratus Punch", "Scapular Wall Slide"]));
  });

  it("filters selected-action exercise results by direct or supporting links without using retired sport grades", () => {
    const sample = exercises.slice(0, 3);
    const connectionForExercise = (exercise: (typeof sample)[number]) => ({ label: exercise.id === sample[0].id ? "Direct support" : exercise.id === sample[1].id ? "Supporting link" : "Not mapped", detail: "test" }) as const;
    expect(filterCatalogByActionLink(sample, "direct", connectionForExercise).map((exercise) => exercise.id)).toEqual([sample[0].id]);
    expect(filterCatalogByActionLink(sample, "supporting", connectionForExercise).map((exercise) => exercise.id)).toEqual([sample[1].id]);
    expect(filterCatalogByActionLink(sample, "all", connectionForExercise).map((exercise) => exercise.id)).toEqual(sample.map((exercise) => exercise.id));
  });
});
