import { describe, expect, it } from "vitest";
import { findWithinAthleteStrengthChanges } from "./withinAthleteStrengthChange";

describe("within-athlete recorded strength changes", () => {
  it("compares only repeated matching observations and returns a directly recorded load change", () => {
    const changes = findWithinAthleteStrengthChanges([
      { id: 1, exerciseName: "Barbell Back Squat", measurementType: "MEASURED_1RM", observedAt: "2026-01-01", loadKg: "100", repetitions: null, laterality: "BILATERAL" },
      { id: 2, exerciseName: "Barbell Back Squat", measurementType: "MEASURED_1RM", observedAt: "2026-02-01", loadKg: "110", repetitions: null, laterality: "BILATERAL" },
      { id: 3, exerciseName: "Barbell Back Squat", measurementType: "MULTI_REP", observedAt: "2026-02-01", loadKg: "90", repetitions: 5, laterality: "BILATERAL" },
    ]);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ exerciseName: "Barbell Back Squat", loadChangeKg: 10, relativeLoadChangePercent: 10 });
  });

  it("does not compare working sets with different repetitions or observations with different laterality", () => {
    const changes = findWithinAthleteStrengthChanges([
      { id: 1, exerciseName: "Row", measurementType: "MULTI_REP", observedAt: "2026-01-01", loadKg: 50, repetitions: 8, laterality: "LEFT" },
      { id: 2, exerciseName: "Row", measurementType: "MULTI_REP", observedAt: "2026-02-01", loadKg: 55, repetitions: 10, laterality: "LEFT" },
      { id: 3, exerciseName: "Row", measurementType: "MULTI_REP", observedAt: "2026-03-01", loadKg: 55, repetitions: 8, laterality: "RIGHT" },
    ]);
    expect(changes).toHaveLength(0);
  });
});
