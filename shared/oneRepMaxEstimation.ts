export const oneRepMaxEstimationMethod = "epley" as const;

/** Rep-max estimation error grows quickly past this range; beyond it the app shows no estimate rather than a false-precision one. */
export const maxValidEstimationReps = 12;

/**
 * Epley formula: 1RM = load × (1 + reps/30). Widely used, reasonably accurate
 * inside ~1-12 reps; the philosophy blueprint's own evidence notes put pooled
 * rep-based estimation error in roughly this range, which is why the change-state
 * thresholds in withinAthleteStrengthChange.ts are calibrated wider than that.
 */
export function estimateOneRepMaxKg(loadKg: number, reps: number): number | null {
  if (!Number.isFinite(loadKg) || loadKg <= 0) return null;
  if (!Number.isFinite(reps) || reps < 1 || reps > maxValidEstimationReps) return null;
  if (reps === 1) return loadKg;
  return loadKg * (1 + reps / 30);
}
