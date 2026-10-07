import { describe, expect, it } from "vitest";
import { exercises } from "./exerciseCatalog";
import { validateExpansion, EXPANSION_FIRST_ID, EXPANSION_LAST_ID } from "./exerciseExpansionValidator";
import { descriptorFor } from "./exerciseDescriptors";
import { rankExerciseMatches } from "./exerciseSearch";

describe("the 50-exercise expansion validator (brief §9, §12)", () => {
  it("reports no required-data error for any of E01-E50", () => {
    expect(validateExpansion()).toEqual([]);
  });

  it("holds exactly ids 401-450, in candidate order, after the untouched 400", () => {
    const added = exercises.filter((exercise) => exercise.id >= EXPANSION_FIRST_ID);
    expect(added.map((exercise) => exercise.id)).toEqual(Array.from({ length: EXPANSION_LAST_ID - EXPANSION_FIRST_ID + 1 }, (_, index) => EXPANSION_FIRST_ID + index));
    expect(exercises.slice(0, 400).every((exercise, index) => exercise.id === index + 1)).toBe(true);
  });

  it("reports a missing descriptor, an overlapping muscle and an unknown quality as errors, not warnings", () => {
    const broken = { ...exercises.find((exercise) => exercise.id === 431)!, secondaryMuscles: ["glutes", "quads"], qualities: ["strength", "grit"] };
    const errors = validateExpansion(exercises.map((exercise) => exercise.id === 431 ? broken : exercise)).filter((error) => error.id === 431);
    expect(errors.map((error) => error.field)).toEqual(expect.arrayContaining(["secondaryMuscles", "qualities"]));
    const orphan = { ...broken, id: 451, name: "Orphan Lift" };
    expect(validateExpansion([...exercises, orphan]).some((error) => error.id === 451 && error.field === "id")).toBe(true);
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
