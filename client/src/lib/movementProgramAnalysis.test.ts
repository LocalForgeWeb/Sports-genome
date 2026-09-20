import { describe, expect, it } from "vitest";
import type { Exercise } from "./exerciseCatalog";
import { enrichedSportMovements } from "./enrichedSportMovementDatabase";
import { getExerciseActionConnection, sharedConnectionSummary } from "./movementProgramAnalysis";

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

describe("a connection stated once instead of on every row", () => {
  it("words the shared fact for each label, and agrees in number", () => {
    expect(sharedConnectionSummary("Supporting link", 24)).toBe("All 24 share a muscle demand with it.");
    expect(sharedConnectionSummary("Direct support", 24)).toBe("All 24 are named in its movement record.");
    expect(sharedConnectionSummary("Not mapped", 24)).toBe("None of the 24 has a mapped link to it.");
    expect(sharedConnectionSummary("Supporting link", 1)).toBe("This one shares a muscle demand with it.");
    expect(sharedConnectionSummary("Direct support", 1)).toBe("This one is named in its movement record.");
  });

  it("keeps the badge on the rows only while it tells them apart", () => {
    // Measured on the shipped build: the default view and the "row" and "press"
    // searches each held one label across all 24 rows, so the badge was
    // twenty-four identical pills in the accent colour. The "squat" search split
    // 21/3, where it earns its place.
    const uniform = ["Supporting link", "Supporting link", "Supporting link"];
    const split = ["Supporting link", "Direct support", "Supporting link"];
    expect(new Set(uniform).size > 1).toBe(false);
    expect(new Set(split).size > 1).toBe(true);
  });
});
