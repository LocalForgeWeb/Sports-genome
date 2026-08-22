import { describe, expect, it } from "vitest";
import { exercises } from "./exerciseCatalog";
import { getExerciseProgressionRecommendation, getMuscleSegmentSignals, getWeeklyProgressReview, parseTargetRepRange, type LoggedPerformanceSet, type ProgressionExercise } from "./progressiveTraining";

const lateralRaise: ProgressionExercise = { id: 1, name: "Cable Lateral Raise", targetPrescription: "3 × 8–12", primaryMuscles: ["deltoid_lateral"] };
const overheadPress: ProgressionExercise = { id: 2, name: "Seated Overhead Press", targetPrescription: "3 × 8–12", primaryMuscles: ["deltoid_anterior"] };
const records: LoggedPerformanceSet[] = [
  { sessionId: 2, completedAt: "2026-08-20", catalogExerciseId: 1, exerciseName: lateralRaise.name, actualWeight: 20, weightUnit: "lb", actualReps: 12, completed: true },
  { sessionId: 1, completedAt: "2026-08-13", catalogExerciseId: 1, exerciseName: lateralRaise.name, actualWeight: 20, weightUnit: "lb", actualReps: 11, completed: true },
  { sessionId: 2, completedAt: "2026-08-20", catalogExerciseId: 2, exerciseName: overheadPress.name, actualWeight: 65, weightUnit: "lb", actualReps: 6, completed: true },
  { sessionId: 1, completedAt: "2026-08-13", catalogExerciseId: 2, exerciseName: overheadPress.name, actualWeight: 65, weightUnit: "lb", actualReps: 7, completed: true },
];

describe("progressive training model", () => {
  it("parses single and ranged prescriptions without treating them as universal strength standards", () => {
    expect(parseTargetRepRange("3 × 8–12")).toEqual({ min: 8, max: 12 });
    expect(parseTargetRepRange("5 x 5")).toEqual({ min: 5, max: 5 });
  });

  it("recommends the next available load increment only after repeated comparable work reaches the target ceiling", () => {
    const recommendation = getExerciseProgressionRecommendation(lateralRaise, records);
    expect(recommendation.action).toBe("increase_load");
    expect(recommendation.confidence).toBe("medium");
    expect(recommendation.boundary).toContain("not a direct muscle-strength measurement");
  });

  it("keeps below-range performance conservative and reports distinct deltoid segment signals", () => {
    const press = getExerciseProgressionRecommendation(overheadPress, records);
    expect(press.action).toBe("repeat");
    const signals = getMuscleSegmentSignals([lateralRaise, overheadPress], records);
    expect(signals.find((signal) => signal.muscle === "deltoid_lateral")?.status).toBe("progressing");
    expect(signals.find((signal) => signal.muscle === "deltoid_anterior")?.family).toBe("Deltoid");
  });

  it("uses high recorded effort as a conservative hold guardrail even when the rep ceiling is reached", () => {
    const highEffort = records.map((record) => ({ ...record, actualRpe: 9.7 }));
    expect(getExerciseProgressionRecommendation(lateralRaise, highEffort).action).toBe("hold");
  });

  it("uses recorded effort across increase, repeat, and reduce decisions", () => {
    const hardCeiling = records.map((record) => ({ ...record, actualRpe: 9.1 }));
    expect(getExerciseProgressionRecommendation(lateralRaise, hardCeiling).action).toBe("repeat");
    const hardBelowRange = records.map((record) => ({ ...record, catalogExerciseId: 2, exerciseName: overheadPress.name, actualReps: 6, actualRpe: 9.2 }));
    expect(getExerciseProgressionRecommendation(overheadPress, hardBelowRange).action).toBe("reduce_load");
  });

  it("allows add-repetition progress at moderate effort but blocks it at high effort", () => {
    const moderate = records.slice(0, 2).map((record) => ({ ...record, actualReps: 10, actualRpe: 8 }));
    const hard = records.slice(0, 2).map((record) => ({ ...record, actualReps: 10, actualRpe: 9.1 }));
    expect(getExerciseProgressionRecommendation(lateralRaise, moderate).action).toBe("add_repetitions");
    expect(getExerciseProgressionRecommendation(lateralRaise, hard).action).toBe("repeat");
  });

  it("uses optional bodyweight only as an athlete-specific exercise-context normalizer", () => {
    const normalized = getExerciseProgressionRecommendation({ ...lateralRaise, bodyWeightKg: 70 }, records);
    expect(normalized.relativePerformance).toBeGreaterThan(0);
    expect(normalized.boundary).toContain("not a direct muscle-strength measurement");
  });

  it("builds calendar-week comparisons without treating them as readiness or muscle-strength measurements", () => {
    const review = getWeeklyProgressReview([lateralRaise], records);
    expect(review.latest?.weekStart).toBe("2026-08-17");
    expect(review.previous?.weekStart).toBe("2026-08-10");
    expect(review.performanceChange).toBeGreaterThan(0);
    expect(review.boundary).toContain("do not diagnose readiness");
  });

  it("normalizes real catalog front, side, and rear deltoid labels into distinct review segments", () => {
    const front = exercises.find((exercise) => exercise.primaryMuscles.includes("frontDelts"));
    const side = exercises.find((exercise) => exercise.primaryMuscles.includes("sideDelts"));
    const rear = exercises.find((exercise) => exercise.primaryMuscles.includes("rearDelts"));
    expect(front).toBeTruthy();
    expect(side).toBeTruthy();
    expect(rear).toBeTruthy();
    const catalogExercises: ProgressionExercise[] = [front, side, rear].filter((exercise): exercise is NonNullable<typeof exercise> => Boolean(exercise)).map((exercise) => ({ id: exercise.id, name: exercise.name, targetPrescription: "3 × 8–12", primaryMuscles: exercise.primaryMuscles }));
    const catalogHistory = catalogExercises.flatMap((exercise, index) => [
      { sessionId: 2, completedAt: "2026-08-20", catalogExerciseId: exercise.id, exerciseName: exercise.name, actualWeight: 20 + index, weightUnit: "lb" as const, actualReps: 10, completed: true },
      { sessionId: 1, completedAt: "2026-08-13", catalogExerciseId: exercise.id, exerciseName: exercise.name, actualWeight: 20 + index, weightUnit: "lb" as const, actualReps: 9, completed: true },
    ]);
    const segments = getMuscleSegmentSignals(catalogExercises, catalogHistory);
    expect(segments.map((signal) => signal.muscle)).toEqual(expect.arrayContaining(["deltoid_anterior", "deltoid_lateral", "deltoid_posterior"]));
  });
});
