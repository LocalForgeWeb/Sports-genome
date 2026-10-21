// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { effectiveEffort, isNotToFailure, usuallyLightExercises, usuallyLightReason } from "@shared/setEffort";
import { exercises } from "@/lib/exerciseCatalog";
import { muscleRankLiftSelection } from "@/lib/muscleRankLifts";
import { workoutStrengthObservations } from "@/lib/workoutStrengthRecord";
import { deviceWorkoutHistoryKey, loadDeviceWorkoutSessions, type DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { deviceStrengthObservationKey, loadDeviceStrengthObservations } from "@/lib/deviceStrengthObservations";
import { strengthPercentileCard } from "@/lib/strengthPercentileCard";
import type { StrengthPercentileResult } from "@shared/strengthPercentile";

/**
 * "You should be able to specify a set isn't being taken to failure" (owner, 15 Oct 2026), and a
 * short list of exercises like good mornings that count that way unless the athlete says otherwise.
 */
const nameOf = (id: number) => exercises.find((exercise) => exercise.id === id)?.name;

describe("The usually-light list", () => {
  it("names the exercises it means, by the catalog's own names", () => {
    const named = Array.from(usuallyLightExercises.keys()).map(nameOf);
    expect(named).not.toContain(undefined);
    expect(named).toEqual(expect.arrayContaining(["Good Morning", "Seated Good Morning", "Cable Good Morning", "Face Pull", "Cable Pull-Through", "Single-Leg Romanian Deadlift"]));
  });

  it("leaves out lifts trained heavy as strength lifts", () => {
    const strengthLifts = ["Conventional Deadlift", "Romanian Deadlift", "Zercher Squat", "Back Squat", "Barbell Bench Press", "Barbell Hip Thrust"];
    for (const name of strengthLifts) {
      const exercise = exercises.find((entry) => entry.name === name);
      expect(exercise, name).toBeTruthy();
      expect(usuallyLightReason(exercise!.id), name).toBeNull();
    }
  });
});

describe("How a set's effort is read", () => {
  it("takes what the athlete said, first", () => {
    expect(effectiveEffort({ catalogExerciseId: 190, effort: "failure" })).toEqual({ effort: "failure", assumed: false });
    expect(effectiveEffort({ catalogExerciseId: 1, effort: "not_to_failure" })).toEqual({ effort: "not_to_failure", assumed: false });
  });

  it("reads an unmarked set of a usually-light exercise as not to failure, and any other as before", () => {
    expect(effectiveEffort({ catalogExerciseId: 190 })).toEqual({ effort: "not_to_failure", assumed: true });
    expect(effectiveEffort({ catalogExerciseId: 1 })).toEqual({ effort: null, assumed: false });
    expect(effectiveEffort({ catalogExerciseId: null })).toEqual({ effort: null, assumed: false });
  });

  it("always counts a one-rep max in full", () => {
    expect(isNotToFailure({ catalogExerciseId: 190, measurementType: "MEASURED_1RM" })).toBe(false);
    expect(isNotToFailure({ catalogExerciseId: 1, measurementType: "MEASURED_1RM", effort: "not_to_failure" })).toBe(false);
  });

  it("ignores an effort the app does not know", () => {
    expect(effectiveEffort({ catalogExerciseId: 1, effort: "half" })).toEqual({ effort: null, assumed: false });
  });
});

describe("The effort travels with the lift to the ranks", () => {
  const at = "2026-10-01T10:00:00.000Z";

  it("marks a good morning left unmarked, and not a bench press", () => {
    const { lifts, sources } = muscleRankLiftSelection([
      { exerciseName: "Good Morning", loadKg: 40, repetitions: 10, observedAt: at },
      { exerciseName: "Barbell Bench Press", loadKg: 100, repetitions: 5, observedAt: at },
    ], [], 80);
    expect(lifts.find((lift) => lift.exerciseName === "Good Morning")?.notToFailure).toBe(true);
    expect(lifts.find((lift) => lift.exerciseName === "Barbell Bench Press")).not.toHaveProperty("notToFailure");
    expect(sources.find((source) => source.exerciseName === "Good Morning")?.notToFailure).toBe(true);
  });

  it("counts a good morning in full when it was a one-rep max or said to be to failure", () => {
    const { lifts } = muscleRankLiftSelection([
      { exerciseName: "Good Morning", loadKg: 120, repetitions: 1, measurementType: "MEASURED_1RM", observedAt: at },
      { exerciseName: "Good Morning", loadKg: 60, repetitions: 10, effort: "failure", observedAt: "2026-09-01T10:00:00.000Z" },
    ], [], 80);
    expect(lifts.every((lift) => !lift.notToFailure)).toBe(true);
  });

  it("marks any lift the athlete said was not to failure", () => {
    const { lifts } = muscleRankLiftSelection([{ exerciseName: "Barbell Bench Press", loadKg: 100, repetitions: 5, effort: "not_to_failure", observedAt: at }], [], 80);
    expect(lifts[0].notToFailure).toBe(true);
  });

  it("is kept on a workout's set and read from the set that speaks for the exercise", () => {
    const session: DeviceWorkoutSession = {
      id: "s1", title: "Pull", dayLabel: "Week 1 · Pull", status: "completed",
      startedAt: at, completedAt: at, weightUnit: "kg",
      exercises: [{ id: "bench", exerciseName: "Barbell Bench Press", catalogId: 1, plannedPrescription: "2 × 5", sets: [
        { weight: "100", reps: "5", completed: true, effort: "not_to_failure" },
        { weight: "80", reps: "5", completed: true },
      ] }],
    };
    const [observation] = workoutStrengthObservations([session], "kg");
    expect(observation.loadKg).toBe(100);
    expect(observation.effort).toBe("not_to_failure");
  });
});

describe("The effort is kept on this device", () => {
  afterEach(() => localStorage.clear());

  it("survives a reload on a workout's set and on a typed lift, and an unknown one does not", () => {
    localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify([{ id: "s1", title: "Pull", dayLabel: "Pull", status: "completed", startedAt: "2026-10-01T10:00:00.000Z", exercises: [{ id: "e", exerciseName: "Good Morning", plannedPrescription: "2 × 8", sets: [
      { weight: "40", reps: "8", completed: true, effort: "failure" },
      { weight: "40", reps: "8", completed: true, effort: "sort of" },
    ] }] }]));
    const [set, odd] = loadDeviceWorkoutSessions()[0].exercises[0].sets;
    expect(set.effort).toBe("failure");
    expect(odd).not.toHaveProperty("effort");

    localStorage.setItem(deviceStrengthObservationKey, JSON.stringify([
      { id: "a", exerciseName: "Good Morning", observedAt: "2026-10-01T10:00:00.000Z", measurementType: "MULTI_REP", effort: "not_to_failure" },
      { id: "b", exerciseName: "Good Morning", observedAt: "2026-10-01T10:00:00.000Z", measurementType: "MULTI_REP", effort: 3 },
    ]));
    const [typed, unknown] = loadDeviceStrengthObservations();
    expect(typed.effort).toBe("not_to_failure");
    expect(unknown).not.toHaveProperty("effort");
  });
});

describe("The card for a set stopped short of failure", () => {
  const placed = { status: "resolved", percentile: 41.2, observedValue: 0.5, confidence: 0.7, scoringVersion: "strength_beta_v2", route: "beta_community_curve",
    estimate: { valueKg: 40, basis: "estimated", confidence: 0.8, effectiveReps: 10, method: "mean_epley_brzycki", estimator: "sports_genome_generic_v1", repsInReserve: null },
    ageAdjustment: { status: "not_applied", reason: "age_missing", ageYears: null },
    normalizationMethod: "direct_community_relative_1rm_percentile", unit: "x_bodyweight", sourceRole: "beta_fallback", exerciseId: "gm", aliasOfExerciseId: null, borrowedCurve: false } as StrengthPercentileResult;

  it("reads as at least that much, and says why", () => {
    const said = strengthPercentileCard(placed, { sex: "male", bodyMassKg: 80, effort: { effort: "not_to_failure", assumed: false } })!;
    expect(said.headline).toBe("At least 41st percentile");
    expect(said.detail).toContain("Not taken to failure, so this is the least the lift shows. It can raise a rank, never lower it.");
    const assumed = strengthPercentileCard(placed, { sex: "male", bodyMassKg: 80, effort: { effort: "not_to_failure", assumed: true } })!;
    expect(assumed.detail).toContain("Usually done light");
    expect(assumed.detail).toContain("mark the set to failure if it was");
  });

  it("drops the unknown-effort note once the athlete said it was to failure", () => {
    expect(strengthPercentileCard(placed, { sex: "male", bodyMassKg: 80 })!.detail).toContain("Read as a set taken to failure, because effort was not recorded");
    const toFailure = strengthPercentileCard(placed, { sex: "male", bodyMassKg: 80, effort: { effort: "failure", assumed: false } })!;
    expect(toFailure.headline).toBe("41st percentile");
    expect(toFailure.detail).not.toContain("effort was not recorded");
  });
});
