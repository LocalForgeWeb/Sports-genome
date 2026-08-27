import { describe, expect, it } from "vitest";
import type { Exercise } from "./exerciseCatalog";
import { enrichedSportMovements } from "./enrichedSportMovementDatabase";
import { getExerciseActionConnection } from "./movementProgramAnalysis";

const exercise = (name: string, primaryMuscles: string[]): Exercise => ({
  id: 999,
  name,
  sourceGroup: "Test",
  category: "Test",
  equipment: "Test",
  movement: "Test",
  primaryMuscles,
  secondaryMuscles: [],
  qualities: [],
  muscleGrade: "C",
  sportFit: {
    tennis: { grade: "C", movementHelp: "Test" },
    basketball: { grade: "C", movementHelp: "Test" },
    soccer: { grade: "C", movementHelp: "Test" },
    baseball: { grade: "C", movementHelp: "Test" },
    combat: { grade: "C", movementHelp: "Test" },
  },
});

describe("selected action exercise connections", () => {
  const movement = enrichedSportMovements[0];

  it("marks movement-record exercises as direct support", () => {
    const connection = getExerciseActionConnection(exercise(movement.recommendedExercises[0], ["sideDelts"]), movement);
    expect(connection.label).toBe("Direct support");
    expect(connection.detail).toContain("Named in the selected action");
  });

  it("marks shared movement role demands as supporting links", () => {
    const connection = getExerciseActionConnection(exercise("Quadriceps support", ["quads"]), movement);
    expect(connection.label).toBe("Supporting link");
    expect(connection.detail).toContain("prime-mover demand");
  });

  it("does not imply a connection where the record contains none", () => {
    const connection = getExerciseActionConnection(exercise("Lateral deltoid isolation", ["sideDelts"]), movement);
    expect(connection.label).toBe("Not mapped");
    expect(connection.detail).toContain("No direct movement-record");
  });
});
