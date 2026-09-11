import { describe, expect, it } from "vitest";
import { mergeStrengthHistory, trackerSetsToComparableObservations } from "./unifiedStrengthHistory";
import { findWithinAthleteStrengthChanges } from "./withinAthleteStrengthChange";

describe("unified strength history (tracker + manual)", () => {
  it("converts completed tracker sets into comparable observations", () => {
    const observations = trackerSetsToComparableObservations([
      { sessionId: 1, completedAt: "2026-01-01", exerciseName: "Barbell Curl", actualWeight: 30, weightUnit: "lb", actualReps: 10, completed: true },
      { sessionId: 1, completedAt: "2026-01-01", exerciseName: "Barbell Curl", actualWeight: 30, weightUnit: "lb", actualReps: null, completed: true },
      { sessionId: 1, completedAt: "2026-01-01", exerciseName: "Barbell Curl", actualWeight: null, weightUnit: "lb", actualReps: 10, completed: true },
      { sessionId: 1, completedAt: "2026-01-01", exerciseName: "Barbell Curl", actualWeight: 30, weightUnit: "lb", actualReps: 10, completed: false },
    ]);
    expect(observations).toHaveLength(1);
    expect(observations[0]).toMatchObject({ exerciseName: "Barbell Curl", measurementType: "MULTI_REP", repetitions: 10 });
  });

  it("lets a tracker-logged set and a later tracker-logged set register as real progress, unprompted by any manual entry", () => {
    const merged = mergeStrengthHistory([], [
      { sessionId: 1, completedAt: "2026-01-01", exerciseName: "Barbell Curl", actualWeight: 30, weightUnit: "lb", actualReps: 10, completed: true },
      { sessionId: 2, completedAt: "2026-04-01", exerciseName: "Barbell Curl", actualWeight: 50, weightUnit: "lb", actualReps: 12, completed: true },
    ]);
    const changes = findWithinAthleteStrengthChanges(merged);
    expect(changes).toHaveLength(1);
    expect(changes[0].changeState).toBe("meaningful_change_supported");
  });

  it("merges manual Strength Genome logs and tracker sets into one progression signal for the same exercise", () => {
    const merged = mergeStrengthHistory(
      [{ id: 1, exerciseName: "Bench Press", measurementType: "MEASURED_1RM", observedAt: "2026-01-01", loadKg: 100, repetitions: null, laterality: "BILATERAL" }],
      [{ sessionId: 5, completedAt: "2026-03-01", exerciseName: "Bench Press", actualWeight: 240, weightUnit: "lb", actualReps: 1, completed: true }]
    );
    expect(merged).toHaveLength(2);
  });
});
