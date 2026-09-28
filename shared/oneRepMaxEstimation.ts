import { estimateOneRepMax, maxRepetitions } from "./strengthPercentile";

/**
 * The app's one e1RM, for every surface that is not placing a lift on a curve: the
 * within-athlete trend, the heaviest-set choice for a finished workout, and the declared
 * competition comparison.
 *
 * It used to be Epley alone, up to 12 reps, while the single-lift card averaged Epley and
 * Brzycki and the muscle ranks used Strength Level's calculator - three answers for one set
 * (Backend V1 EN-03, B017). It is now the Strength Level-compatible estimator the database
 * and the percentile route use: Brzycki below 8 reps, Epley above 10, a blend between.
 */
export const oneRepMaxEstimationMethod = "strengthlevel_compatible_v1" as const;

/** Past this the estimators refuse rather than extrapolate; the same limit as the database. */
export const maxValidEstimationReps = maxRepetitions;

/** e1RM in kg for a set to failure (effort unknown), or null when it cannot be estimated. */
export function estimateOneRepMaxKg(loadKg: number, reps: number): number | null {
  if (!Number.isFinite(loadKg) || loadKg <= 0) return null;
  if (!Number.isInteger(reps) || reps < 1 || reps > maxValidEstimationReps) return null;
  const estimate = estimateOneRepMax({ loadKg, repetitions: reps });
  return "reason" in estimate ? null : estimate.valueKg;
}
