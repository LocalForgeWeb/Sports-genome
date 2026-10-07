import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { summarizeWithinAthleteStrengthComparisons, strengthSeriesKey, type ComparableStrengthObservation } from "./withinAthleteStrengthChange";
import { workoutStrengthObservations } from "./workoutStrengthRecord";
import type { DeviceWorkoutSession } from "./deviceWorkoutLog";

/**
 * The Oct 7 brief's required calculation fixtures (§7), run against the comparison Progress, Home
 * and Strength actually use (summarizeWithinAthleteStrengthComparisons): one series per exercise
 * identity, never a pooled whole-athlete figure.
 */
const lift = (over: Partial<ComparableStrengthObservation> & { exerciseName: string; observedAt: string }): ComparableStrengthObservation => ({
  id: `${over.exerciseName}-${over.observedAt}`, measurementType: "MULTI_REP", loadKg: 100, repetitions: 5, laterality: "BILATERAL", ...over,
});
const lbToKg = (lb: number) => lb * 0.45359237;

describe("required calculation fixtures", () => {
  it("same lift, same sets, typed in lb then kg: no false change", () => {
    const { comparable } = summarizeWithinAthleteStrengthComparisons([
      lift({ exerciseName: "Back Squat", observedAt: "2026-09-01", loadKg: lbToKg(225) }),
      lift({ exerciseName: "Back Squat", observedAt: "2026-09-08", loadKg: 102.0582 }),
    ]);
    expect(comparable).toHaveLength(1);
    expect(Math.abs(comparable[0].relativeChangePercent)).toBeLessThan(0.01);
    expect(comparable[0].changeState).toBe("stable");
  });

  it("a curl-only week then a deadlift-only week: two separate one-log series, no whole-body change", () => {
    const { comparable } = summarizeWithinAthleteStrengthComparisons([
      lift({ exerciseName: "Barbell Curl", observedAt: "2026-09-01", loadKg: 30, repetitions: 8 }),
      lift({ exerciseName: "Barbell Curl", observedAt: "2026-09-02", loadKg: 30, repetitions: 8 }),
      lift({ exerciseName: "Conventional Deadlift", observedAt: "2026-09-08", loadKg: 180 }),
    ]);
    // The curls compare with the curls; the deadlift has nothing to compare with yet. Nothing pools them.
    expect(comparable.map((change) => change.exerciseName)).toEqual(["Barbell Curl"]);
    expect(comparable[0].relativeChangePercent).toBe(0);
  });

  it("same name, different catalog IDs: separate series", () => {
    const observations = [
      lift({ exerciseName: "Romanian Deadlift", catalogExerciseId: 42, observedAt: "2026-09-01", loadKg: 100 }),
      lift({ exerciseName: "Romanian Deadlift", catalogExerciseId: 186, observedAt: "2026-09-08", loadKg: 140 }),
    ];
    expect(strengthSeriesKey(observations[0])).not.toBe(strengthSeriesKey(observations[1]));
    // Neither has a second log, so no +40% appears.
    expect(summarizeWithinAthleteStrengthComparisons(observations).comparable).toEqual([]);
    // A name two entries share, with no ID kept, stays its own legacy series rather than guessing.
    expect(strengthSeriesKey(lift({ exerciseName: "Romanian Deadlift", observedAt: "2026-09-01" }))).toBe("name:romanian deadlift|BILATERAL");
    // An unambiguous name and its ID are one series, so typed lifts and workout lifts still meet.
    expect(strengthSeriesKey(lift({ exerciseName: "Back Squat", observedAt: "x" }))).toBe(strengthSeriesKey(lift({ exerciseName: "Back Squat", catalogExerciseId: 161, observedAt: "x" })));
  });

  it("same lift with a changed load convention (weight added to a bodyweight movement) or side: separate", () => {
    const base = lift({ exerciseName: "Pull-Up", observedAt: "2026-09-01" });
    expect(strengthSeriesKey(base)).not.toBe(strengthSeriesKey({ ...base, loadSemantics: "additional_load" }));
    expect(strengthSeriesKey(base)).not.toBe(strengthSeriesKey({ ...base, laterality: "UNILATERAL" }));
  });

  it("one eligible observation: shown as data elsewhere, no trend here", () => {
    expect(summarizeWithinAthleteStrengthComparisons([lift({ exerciseName: "Back Squat", observedAt: "2026-09-01" })]).comparable).toEqual([]);
  });

  it("missing actual RPE with a planned RPE 8: effort stays unknown - the comparison has no effort input at all", () => {
    const [change] = summarizeWithinAthleteStrengthComparisons([
      lift({ exerciseName: "Back Squat", observedAt: "2026-09-01" }),
      lift({ exerciseName: "Back Squat", observedAt: "2026-09-29", loadKg: 110 }),
    ]).comparable;
    expect(Object.keys(change)).not.toContain("rpe");
    expect(Object.keys(change)).not.toContain("effort");
  });

  it("Week 1 and Week 4 only: the comparison carries both dates, not 'last week'", () => {
    const [change] = summarizeWithinAthleteStrengthComparisons([
      lift({ exerciseName: "Back Squat", observedAt: "2026-09-01T10:00:00Z" }),
      lift({ exerciseName: "Back Squat", observedAt: "2026-09-22T10:00:00Z", loadKg: 110 }),
    ]).comparable;
    expect(change.firstPoint.observedAt.toISOString()).toBe("2026-09-01T10:00:00.000Z");
    expect(change.latestPoint.observedAt.toISOString()).toBe("2026-09-22T10:00:00.000Z");
  });

  it("one drop set of three stages: one parent set, read by its first stage only", () => {
    const session: DeviceWorkoutSession = {
      id: "s", title: "W", dayLabel: "W", startedAt: "2026-09-01T10:00:00Z", completedAt: "2026-09-01T11:00:00Z", status: "completed", weightUnit: "lb",
      exercises: [{ id: "e", exerciseName: "Barbell Curl", catalogId: 121, plannedPrescription: "1 × 5", sets: [
        { id: "d", type: "drop", weight: "100", reps: "5", unit: "lb", completed: true, stages: [{ id: "1", weight: "100", reps: "5", unit: "lb" }, { id: "2", weight: "70", reps: "6", unit: "lb" }, { id: "3", weight: "50", reps: "10", unit: "lb" }] },
      ] }],
    };
    const [observation] = workoutStrengthObservations([session], "lb");
    expect(observation.setCount).toBe(1);
    expect(observation.repetitions).toBe(5);
    expect(observation.loadKg).toBeCloseTo(lbToKg(100), 6);
    expect(observation.catalogExerciseId).toBe(121);
  });
});

/**
 * P01: the legacy progression path stays dormant. getWeeklyProgressReview pools estimated
 * performance across different exercises (a heavy-deadlift week beats a curl week with no lift
 * improving), and its set type has no setup fields while its panel promises setup matching. It
 * is reachable only through WorkoutExecutionPanel, which nothing renders. These checks fail if any
 * live file starts rendering those panels or calling those helpers, so reviving them is a
 * deliberate change that must repair them first.
 */
describe("the dormant progression path is not reachable from the live app", () => {
  const root = new URL("..", import.meta.url).pathname;
  const files: string[] = [];
  const walk = (dir: string) => { for (const name of readdirSync(dir)) { const path = join(dir, name); if (statSync(path).isDirectory()) walk(path); else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)) files.push(path); } };
  walk(root);
  const dormant = ["components/WorkoutExecutionPanel.tsx", "components/ProgressionReviewPanel.tsx", "components/WorkoutHistoryTimeline.tsx", "lib/progressiveTraining.ts", "lib/segmentPrioritySuggestions.ts"];
  const live = files.filter((file) => !dormant.some((suffix) => file.endsWith(suffix)));

  it("no live file renders the legacy panels", () => {
    const offenders = live.filter((file) => /<(WorkoutExecutionPanel|ProgressionReviewPanel|WorkoutHistoryTimeline)\b/.test(readFileSync(file, "utf8")));
    expect(offenders).toEqual([]);
  });

  it("no live file imports the legacy panel or listens for its approval events", () => {
    const offenders = live.filter((file) => /from "@\/components\/(WorkoutExecutionPanel|ProgressionReviewPanel|WorkoutHistoryTimeline)"|APPROVAL_EVENT|buildApproved(Progression|SegmentPriority)Note/.test(readFileSync(file, "utf8")));
    expect(offenders).toEqual([]);
  });

  it("no live file calls the pooled weekly review or the legacy recommendation helpers", () => {
    const offenders = live.filter((file) => /\b(getWeeklyProgressReview|getExerciseProgressionRecommendation|getMuscleSegmentSignals|getSegmentPrioritySuggestions)\s*\(/.test(readFileSync(file, "utf8")));
    expect(offenders).toEqual([]);
  });
});
