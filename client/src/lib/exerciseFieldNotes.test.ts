import { describe, expect, it } from "vitest";
import { getExerciseFieldNote } from "./exerciseFieldNotes";
import { exercises } from "./exerciseCatalog";

describe("exercise field notes", () => {
  it("returns a concise cable-aware note for every catalog exercise", () => {
    const cablePress = exercises.find((exercise) => exercise.name === "Cable Chest Press");
    expect(cablePress).toBeDefined();
    const note = getExerciseFieldNote(cablePress!);
    expect(note.patternLabel).toBe("Horizontal push");
    expect(note.equipmentLens).toContain("Cable lens");
    expect(note.coachingCue.length).toBeGreaterThan(24);
  });

  it("keeps every catalog record covered even when a movement is uncommon", () => {
    expect(exercises.every((exercise) => Boolean(getExerciseFieldNote(exercise).selectionLens))).toBe(true);
  });
});
