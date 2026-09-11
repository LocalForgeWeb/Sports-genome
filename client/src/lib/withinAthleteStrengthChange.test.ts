import { describe, expect, it } from "vitest";
import { findWithinAthleteStrengthChanges, summarizeWithinAthleteStrengthComparisons } from "./withinAthleteStrengthChange";

describe("within-athlete estimated strength change", () => {
  it("compares different rep counts via estimated one-rep max instead of requiring an exact rep match", () => {
    // 30 lb x 10 -> e1RM 40; later 50 lb x 12 -> e1RM 70: a real ~75% jump, not comparable under the old exact-rep-match rule.
    const changes = findWithinAthleteStrengthChanges([
      { id: 1, exerciseName: "Barbell Curl", measurementType: "MULTI_REP", observedAt: "2026-01-01", loadKg: 30, repetitions: 10, laterality: "BILATERAL" },
      { id: 2, exerciseName: "Barbell Curl", measurementType: "MULTI_REP", observedAt: "2026-04-01", loadKg: 50, repetitions: 12, laterality: "BILATERAL" },
    ]);
    expect(changes).toHaveLength(1);
    expect(changes[0].changeState).toBe("meaningful_change_supported");
    expect(changes[0].relativeChangePercent).toBeGreaterThan(15);
    expect(changes[0].firstPoint.estimatedOneRmKg).toBeCloseTo(30 * (1 + 10 / 30), 2);
    expect(changes[0].latestPoint.estimatedOneRmKg).toBeCloseTo(50 * (1 + 12 / 30), 2);
  });

  it("labels a small fluctuation as stable rather than a false improvement or decline claim", () => {
    const changes = findWithinAthleteStrengthChanges([
      { id: 1, exerciseName: "Bench Press", measurementType: "MEASURED_1RM", observedAt: "2026-01-01", loadKg: 100, repetitions: null, laterality: "BILATERAL" },
      { id: 2, exerciseName: "Bench Press", measurementType: "MEASURED_1RM", observedAt: "2026-02-01", loadKg: 102, repetitions: null, laterality: "BILATERAL" },
    ]);
    expect(changes).toHaveLength(1);
    expect(changes[0].changeState).toBe("stable");
  });

  it("labels a moderate change as an emerging signal, not yet a confirmed change", () => {
    const changes = findWithinAthleteStrengthChanges([
      { id: 1, exerciseName: "Deadlift", measurementType: "MEASURED_1RM", observedAt: "2026-01-01", loadKg: 100, repetitions: null, laterality: "BILATERAL" },
      { id: 2, exerciseName: "Deadlift", measurementType: "MEASURED_1RM", observedAt: "2026-02-01", loadKg: 110, repetitions: null, laterality: "BILATERAL" },
    ]);
    expect(changes).toHaveLength(1);
    expect(changes[0].changeState).toBe("directional_signal_emerging");
  });

  it("does not compare different laterality and keeps exercises separate", () => {
    const changes = findWithinAthleteStrengthChanges([
      { id: 1, exerciseName: "Row", measurementType: "MULTI_REP", observedAt: "2026-01-01", loadKg: 50, repetitions: 8, laterality: "LEFT" },
      { id: 2, exerciseName: "Row", measurementType: "MULTI_REP", observedAt: "2026-02-01", loadKg: 55, repetitions: 10, laterality: "RIGHT" },
    ]);
    expect(changes).toHaveLength(0);
  });

  it("never fabricates a change from a single observation", () => {
    const changes = findWithinAthleteStrengthChanges([
      { id: 1, exerciseName: "Overhead Press", measurementType: "MEASURED_1RM", observedAt: "2026-01-01", loadKg: 60, repetitions: null, laterality: "BILATERAL" },
    ]);
    expect(changes).toHaveLength(0);
  });

  it("excludes and reports sets whose rep count is outside the validated estimation range, rather than guessing", () => {
    const summary = summarizeWithinAthleteStrengthComparisons([
      { id: 1, exerciseName: "Leg Press", measurementType: "MULTI_REP", observedAt: "2026-01-01", loadKg: 200, repetitions: 20, laterality: "BILATERAL" },
      { id: 2, exerciseName: "Leg Press", measurementType: "MULTI_REP", observedAt: "2026-02-01", loadKg: 210, repetitions: 22, laterality: "BILATERAL" },
    ]);
    expect(summary.comparable).toHaveLength(0);
    expect(summary.excluded).toEqual([expect.objectContaining({ exerciseName: "Leg Press", observationCount: 2, reason: "reps_outside_estimation_range" })]);
  });
});
