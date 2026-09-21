import { describe, expect, it } from "vitest";
import { exercises } from "./exerciseCatalog";
import { buildApprovedProgressionNote, buildApprovedSegmentPriorityNote, getExerciseProgressionRecommendation, getMuscleSegmentSignals, getWeeklyProgressReview, parseTargetRepRange, type LoggedPerformanceSet, type ProgressionExercise } from "./progressiveTraining";

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

  /**
   * A prescription can ask for a different target per set, and the band has to be
   * aggregated the way the comparison aggregates what was actually done - by the
   * session mean. Spanning min-to-max looks right and makes the ceiling
   * unreachable; reading only the first target makes the floor unreachable.
   */
  it("aggregates a per-set target the way the comparison aggregates the work", () => {
    expect(parseTargetRepRange("4 × 10/8/6/6")).toEqual({ min: 7.5, max: 7.5 });
    expect(parseTargetRepRange("2 × 6/10")).toEqual({ min: 8, max: 8 });
    // A uniform prescription is untouched, whether it is a range or a single number.
    expect(parseTargetRepRange("4 × 8–12")).toEqual({ min: 8, max: 12 });
    expect(parseTargetRepRange("3 × 5/8–12/8–12")).toEqual({ min: 7, max: 29 / 3 });
  });

  /**
   * The test that matters, and the one that was missing: an athlete who hits the
   * prescription exactly has to be able to progress off it. With the band spanning
   * 6-10, a perfect 10/8/6/6 averages 7.5, never reaches the 10 ceiling, and the
   * advice sticks on "add repetitions" forever.
   */
  it("lets an athlete who executes a varied plan exactly progress off it", () => {
    const exercise: ProgressionExercise = { id: 1, name: "Bench", targetPrescription: "4 × 10/8/6/6", primaryMuscles: ["chest"] };
    const exact: LoggedPerformanceSet[] = [1, 2].flatMap((sessionId) =>
      [10, 8, 6, 6].map((actualReps) => ({
        sessionId, completedAt: `2026-08-${10 + sessionId}`, catalogExerciseId: 1, exerciseName: "Bench",
        actualWeight: 185, weightUnit: "lb" as const, actualReps, completed: true,
      })));
    expect(getExerciseProgressionRecommendation(exercise, exact).action).toBe("increase_load");
  });

  it("still tells an athlete who falls short of a varied plan to hold or reduce", () => {
    const exercise: ProgressionExercise = { id: 1, name: "Bench", targetPrescription: "4 × 10/8/6/6", primaryMuscles: ["chest"] };
    const short: LoggedPerformanceSet[] = [1, 2].flatMap((sessionId) =>
      [6, 5, 4, 4].map((actualReps) => ({
        sessionId, completedAt: `2026-08-${10 + sessionId}`, catalogExerciseId: 1, exerciseName: "Bench",
        actualWeight: 185, weightUnit: "lb" as const, actualReps, completed: true,
      })));
    expect(getExerciseProgressionRecommendation(exercise, short).action).not.toBe("increase_load");
  });

  it("still reads a prescription with no numeric target at all as having none", () => {
    expect(parseTargetRepRange("as many as possible")).toBeUndefined();
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

  it("turns athlete-approved advice into an explicit next-session planner note", () => {
    expect(buildApprovedProgressionNote({ action: "add_repetitions", rationale: "Keep load steady." }, "Tempo: controlled")).toBe("Tempo: controlled\nApproved progression: add repetitions. Keep load steady.");
  });

  it("turns an athlete-approved segment review into an explicit planner focus note", () => {
    expect(buildApprovedSegmentPriorityNote({ muscle: "deltoid_anterior", rationale: "Review direct exposure." })).toBe("Approved segment focus: deltoid anterior. Review direct exposure.");
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

  it("provides a bounded within-athlete progress index rather than a direct strength rank", () => {
    const signal = getMuscleSegmentSignals([lateralRaise], records)[0];
    expect(signal?.progressIndex).toBeGreaterThanOrEqual(0);
    expect(signal?.progressIndex).toBeLessThanOrEqual(100);
    expect(signal?.boundary).toContain("not a direct muscle-strength score");
  });
});
