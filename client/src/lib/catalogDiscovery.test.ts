import { describe, expect, it } from "vitest";
import { exercises } from "./exerciseCatalog";
import { defaultCatalogFilters, filterCatalogByActionLink, filterCatalogExercises, muscleModeExercises, refineMovementSupport, spokenDestination } from "./catalogDiscovery";
import { getMovementSupport, type MovementSupport } from "./movementSupport";
import { recordMuscleAliases } from "./recordMuscleKeys";

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

  it("filters selected-action exercise results by movement support tier without using retired sport grades", () => {
    // Sep 30: "direct" is the movement-specific tier; "supporting" is related pattern or muscle support.
    const sample = exercises.slice(0, 4);
    const labels = ["Movement-specific", "Related pattern", "Muscle support", "Not mapped"] as const;
    const connectionForExercise = (exercise: (typeof sample)[number]) => ({ label: labels[sample.indexOf(exercise)], detail: "test" });
    expect(filterCatalogByActionLink(sample, "direct", connectionForExercise).map((exercise) => exercise.id)).toEqual([sample[0].id]);
    expect(filterCatalogByActionLink(sample, "supporting", connectionForExercise).map((exercise) => exercise.id)).toEqual([sample[1].id, sample[2].id]);
    expect(filterCatalogByActionLink(sample, "all", connectionForExercise).map((exercise) => exercise.id)).toEqual(sample.map((exercise) => exercise.id));
  });
});

describe("refinements inside the movement support tiers", () => {
  const bridge = () => getMovementSupport("wrestling", "wrestling-19");
  const rowIds = (support: MovementSupport, tier: "specific" | "related" | "muscle") => support[tier].map((row) => row.exercise.id);

  it("narrows each tier by equipment and keeps the tier's own order", () => {
    const refined = refineMovementSupport(bridge(), { ...defaultCatalogFilters, equipment: "Landmine" }, new Set());
    expect(refined.specific.map((row) => row.exercise.name)).toEqual(["Landmine Romanian Deadlift", "Landmine Single-Leg Romanian Deadlift"]);
    expect(refined.specific.every((row) => row.reason === "Named in the Bridge movement record: Romanian deadlift")).toBe(true);
    expect(refined.status).toBe("ok");
    expect(refined.movementLabel).toBe("Bridge");
  });

  it("finds by search text only among a tier's own rows, without re-ranking them", () => {
    const refined = refineMovementSupport(bridge(), { ...defaultCatalogFilters, query: "thrust" }, new Set());
    expect(refined.specific.map((row) => row.exercise.name)).toEqual(["Barbell Hip Thrust", "Smith Machine Hip Thrust", "Dumbbell Hip Thrust", "Single-Leg Hip Thrust", "Cable Hip Thrust", "Hip Thrust Machine"]);
    expect(refined.related).toEqual([]);
  });

  it("keeps favorites only when asked", () => {
    const favorites = new Set([210, 41, 161, 1]);
    const refined = refineMovementSupport(bridge(), { ...defaultCatalogFilters, favoritesOnly: true }, favorites);
    expect(rowIds(refined, "specific")).toEqual([210]);
    expect(rowIds(refined, "related")).toEqual([41]);
    expect(rowIds(refined, "muscle")).toEqual([161]);
  });

  it("never adds a candidate or moves one between tiers, whatever the refinement", () => {
    const support = bridge();
    const refinements = [
      defaultCatalogFilters,
      { ...defaultCatalogFilters, equipment: "Cable" },
      { ...defaultCatalogFilters, query: "romanian" },
      { ...defaultCatalogFilters, query: "bench press" },
      { ...defaultCatalogFilters, favoritesOnly: true },
      { ...defaultCatalogFilters, equipment: "Barbell", query: "squat" },
    ];
    for (const filters of refinements) {
      const refined = refineMovementSupport(support, filters, new Set([1, 41, 206]));
      for (const tier of ["specific", "related", "muscle"] as const) {
        const before = rowIds(support, tier);
        const after = rowIds(refined, tier);
        expect(after.every((id) => before.includes(id))).toBe(true);
        expect(after).toEqual(before.filter((id) => after.includes(id)));
      }
    }
    // "bench press" is in the catalog but not in Bridge's tiers: the search does not reach outside them.
    expect(rowIds(refineMovementSupport(support, { ...defaultCatalogFilters, query: "bench press" }, new Set()), "specific")).toEqual([]);
  });
});

describe("muscle mode's base list", () => {
  it("holds every exercise that trains the muscle, primary ones first, each group in catalog order", () => {
    const list = muscleModeExercises(exercises, "glutes");
    const primary = exercises.filter((exercise) => exercise.primaryMuscles.includes("glutes"));
    const supporting = exercises.filter((exercise) => !exercise.primaryMuscles.includes("glutes") && exercise.secondaryMuscles.includes("glutes"));
    expect(primary.length).toBeGreaterThan(0);
    expect(supporting.length).toBeGreaterThan(0);
    expect(list.map((exercise) => exercise.id)).toEqual([...primary, ...supporting].map((exercise) => exercise.id));
    // The same set the Muscle filter keeps, only ordered by role.
    const filtered = filterCatalogExercises(exercises, { ...defaultCatalogFilters, muscle: "glutes" }, new Set());
    expect(new Set(list.map((exercise) => exercise.id))).toEqual(new Set(filtered.map((exercise) => exercise.id)));
  });

  it("is empty for a muscle no exercise trains", () => {
    expect(muscleModeExercises(exercises, "not-a-muscle")).toEqual([]);
  });

  it("lists a region the body map draws but the catalog never tags under the key for the same tissue", () => {
    // Soleus, a Penetration step prime mover, opened an empty list: no catalog exercise carries the key.
    const soleus = muscleModeExercises(exercises, "soleus");
    expect(soleus.length).toBeGreaterThan(0);
    expect(soleus.map((exercise) => exercise.id)).toEqual(muscleModeExercises(exercises, "calves").map((exercise) => exercise.id));
    expect(muscleModeExercises(exercises, "peroneals")).toEqual([]);
    // Every body-map muscle has a list, except the one the catalog has no key for.
    const empty = Object.keys(recordMuscleAliases).filter((key) => muscleModeExercises(exercises, key).length === 0);
    expect(empty).toEqual(["peroneals"]);
  });
});

describe("the add destination, spoken", () => {
  it("reads the strip's middle dot as a pause", () => {
    expect(spokenDestination("Week 1 · Push")).toBe("Week 1, Push");
    expect(spokenDestination("Week 2 · Sport Transfer")).toBe("Week 2, Sport Transfer");
    expect(spokenDestination("Push")).toBe("Push");
  });
});
