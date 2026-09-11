import { displayWeightToKilograms } from "@/lib/weightUnits";
import type { ComparableStrengthObservation } from "@/lib/withinAthleteStrengthChange";

export type TrackedWorkoutSet = {
  sessionId: number;
  completedAt: Date | string | null;
  exerciseName: string;
  actualWeight: string | number | null;
  weightUnit: "lb" | "kg" | null;
  actualReps: number | null;
  completed: boolean;
};

/**
 * Feeds completed workout-tracker sets into the same within-athlete strength
 * comparison as manually logged Strength Genome tests, so training a lift in
 * the tracker registers as progress without a separate duplicate entry.
 */
export function trackerSetsToComparableObservations(rows: readonly TrackedWorkoutSet[]): ComparableStrengthObservation[] {
  const observations: ComparableStrengthObservation[] = [];
  rows.forEach((row, index) => {
    if (!row.completed || !row.completedAt) return;
    const weight = Number(row.actualWeight);
    if (!Number.isFinite(weight) || weight <= 0) return;
    if (!row.actualReps || row.actualReps < 1) return;
    observations.push({
      id: `tracker-${row.sessionId}-${index}`,
      exerciseName: row.exerciseName,
      measurementType: "MULTI_REP",
      observedAt: new Date(row.completedAt),
      loadKg: displayWeightToKilograms(weight, row.weightUnit === "kg" ? "kg" : "lb"),
      repetitions: row.actualReps,
      laterality: "BILATERAL",
    });
  });
  return observations;
}

export function mergeStrengthHistory(
  manualObservations: readonly ComparableStrengthObservation[],
  trackedSets: readonly TrackedWorkoutSet[]
): ComparableStrengthObservation[] {
  return [...manualObservations, ...trackerSetsToComparableObservations(trackedSets)];
}
