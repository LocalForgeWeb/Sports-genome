import { describe, expect, it } from "vitest";
import { exercises } from "./exerciseCatalog";
import { validateExpansion, EXPANSION_FIRST_ID, EXPANSION_LAST_ID } from "./exerciseExpansionValidator";
import { descriptorFor } from "./exerciseDescriptors";
import { rankExerciseMatches } from "./exerciseSearch";
import { EXPANSION_CANDIDATE_IDS, RETIRED_CANDIDATES } from "./exerciseCatalogAdditions";

describe("the 50-exercise expansion validator (brief §9, §12)", () => {
  it("reports no required-data error for any of E01-E50", () => {
    expect(validateExpansion()).toEqual([]);
  });

  it("holds exactly ids 417-458, in candidate order, after the untouched 400 and the forearm catalog's 401-416", () => {
    const added = exercises.filter((exercise) => exercise.id >= EXPANSION_FIRST_ID);
    expect([EXPANSION_FIRST_ID, EXPANSION_LAST_ID]).toEqual([417, 458]);
    expect(added.map((exercise) => exercise.id)).toEqual(Array.from({ length: EXPANSION_LAST_ID - EXPANSION_FIRST_ID + 1 }, (_, index) => EXPANSION_FIRST_ID + index));
    expect(exercises.slice(0, 416).every((exercise, index) => exercise.id === index + 1)).toBe(true);
  });

  it("accounts for all fifty candidates: 42 records, and 8 retired onto the forearm row that is the same exercise", () => {
    expect(Object.keys(EXPANSION_CANDIDATE_IDS)).toHaveLength(42);
    expect(Object.fromEntries(Object.entries(RETIRED_CANDIDATES).map(([candidate, row]) => [candidate, row.catalogId]))).toEqual({ E09: 405, E10: 406, E11: 407, E12: 408, E15: 401, E16: 402, E17: 404, E41: 409 });
    expect(EXPANSION_CANDIDATE_IDS.E01).toBe(417);
    expect(EXPANSION_CANDIDATE_IDS.E50).toBe(458);
    // A retired candidate's name still finds its row.
    expect(rankExerciseMatches(exercises, "dumbbell pronation")[0]?.exercise.id).toBe(405);
    expect(rankExerciseMatches(exercises, "hand gripper")[0]?.exercise.id).toBe(402);
  });

  it("reports a missing descriptor, an overlapping muscle and an unknown quality as errors, not warnings", () => {
    const zercher = EXPANSION_CANDIDATE_IDS.E31;
    const broken = { ...exercises.find((exercise) => exercise.id === zercher)!, secondaryMuscles: ["glutes", "quads"], qualities: ["strength", "grit"] };
    const errors = validateExpansion(exercises.map((exercise) => exercise.id === zercher ? broken : exercise)).filter((error) => error.id === zercher);
    expect(errors.map((error) => error.field)).toEqual(expect.arrayContaining(["secondaryMuscles", "qualities"]));
    const orphan = { ...broken, id: 459, name: "Orphan Lift" };
    expect(validateExpansion([...exercises, orphan]).some((error) => error.id === 459 && error.field === "id")).toBe(true);
  });

  it("finds every record by its canonical name and by the name the brief asked for", () => {
    for (const exercise of exercises.filter((item) => item.id >= EXPANSION_FIRST_ID)) {
      const requested = descriptorFor(exercise.id)!.requestedName;
      for (const query of [exercise.name, requested]) {
        expect(rankExerciseMatches(exercises, query)[0]?.exercise.id, `${query}`).toBe(exercise.id);
      }
    }
  });

  it("resolves \"incline bench machine\" to the existing incline machine press, not a new record", () => {
    const top = rankExerciseMatches(exercises, "incline bench machine")[0]?.exercise;
    expect(top?.name).toBe("Incline Machine Chest Press");
    expect(top!.id).toBeLessThan(EXPANSION_FIRST_ID);
  });
});
