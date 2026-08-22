import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { analyzeExerciseContext, getExerciseGenome } from "./exerciseGenome";
import { sportMovementProfiles } from "./sportMovementDatabase";

describe("Exercise Genome checklist coverage", () => {
  it("keeps intrinsic mechanics, practical constraints, adaptation, muscle targeting, and study calibration in one exercise record", () => {
    const exercise = exercises.find((item) => item.name === "Seated Leg Curl") || exercises[0];
    const genome = getExerciseGenome(exercise);
    expect(Object.keys(genome.fingerprint)).toEqual(["hypertrophy", "strength", "power", "stability", "mobility", "sfr", "skill", "practicality"]);
    expect(genome.muscleProfile[0]).toMatchObject({ muscle: expect.any(String), role: expect.any(String), targeting: expect.any(Object) });
    expect(genome.jointActions.length).toBeGreaterThan(0);
    expect(genome.resistanceProfile.curve).toHaveLength(5);
    expect(genome.fatigue).toMatchObject({ local: expect.any(Number), systemic: expect.any(Number), axial: expect.any(Number), grip: expect.any(Number), technical: expect.any(Number) });
    expect(genome.practicality).toMatchObject({ setup: expect.any(Number), accessibility: expect.any(Number), homeGym: expect.any(Number) });
    expect(genome.adaptation.primary.length).toBeGreaterThan(0);
    expect(genome).toHaveProperty("studyCalibration");
  });

  it("changes contextual utility when goal, stack overlap, and sport movement context change", () => {
    const exercise = exercises.find((item) => item.name === "Seated Leg Curl") || exercises[0];
    const squat = exercises.find((item) => item.name === "Back Squat") || exercises[1];
    const sportMovement = sportMovementProfiles.find((item) => item.sportId === "soccer");
    expect(sportMovement).toBeDefined();
    const isolated = analyzeExerciseContext(exercise, { goal: "Muscle growth", currentWorkout: [], sportMovement });
    const overlapping = analyzeExerciseContext(exercise, { goal: "Strength", currentWorkout: [exercise, squat], sportMovement });
    expect(isolated.contextualScore).not.toBe(overlapping.contextualScore);
    expect(isolated.signals).toMatchObject({ goalAlignment: expect.any(Number), stackDistinctness: expect.any(Number), sportActionMatch: expect.any(Number), recoveryManageability: expect.any(Number) });
    expect(overlapping.explanation).toMatch(/stack|exercise/i);
  });
});
