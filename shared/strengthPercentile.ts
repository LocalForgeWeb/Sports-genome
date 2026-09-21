/**
 * The beta strength → percentile engine, version `strength_beta_v1`.
 *
 * This is the second of two percentile routes and is deliberately separate from the
 * research-grade one in `normsReference.ts`. That route reports a band between published cut
 * points from a directly measured lift. This route interpolates a community curve from an
 * estimated 1RM. They answer differently and carry different confidence, so every result here
 * names its route and its scoring version, and the two are never pooled.
 *
 * The method is not invented here. It is transcribed from the `strength_beta_v1` row of
 * `strength_scoring_versions`, which the research side owns; if that record changes, this
 * module changes with it rather than drifting from the version it claims to implement.
 */

export const strengthScoringVersion = "strength_beta_v1" as const;

/** Community curves are the only source the policy admits for a beta percentile. */
export type StrengthSourceRole = "beta_fallback" | "validation_only" | "excluded";

export type StrengthNormMethod =
  | "direct_community_relative_1rm_percentile"
  | "direct_community_absolute_1rm_percentile"
  | "direct_community_rep_percentile"
  | "bodyweight_repetition_max";

/** One stored point on a curve. Values between anchors are interpolated; beyond them are not. */
export type CurveAnchor = { percentile: number; value: number };

export type StrengthCurve = {
  exerciseId: string;
  /** Set when the curve is borrowed from a variant, so the result can say whose curve it is. */
  aliasOfExerciseId?: string | null;
  sex: "male" | "female";
  normalizationMethod: StrengthNormMethod;
  sourceRole: StrengthSourceRole;
  /** The policy's ceiling on confidence for this source, e.g. 0.82 for community curves. */
  confidenceCap: number | null;
  anchors: CurveAnchor[];
};

export type OneRepMaxEstimate = {
  valueKg: number;
  /** `measured` passes a direct 1RM through untouched; nothing is estimated on top of it. */
  basis: "measured" | "estimated";
  /** 0–1 before any source cap is applied. A direct 1RM is 1. */
  confidence: number;
  effectiveReps: number;
};

export type StrengthPercentileUnavailableReason =
  | "no_curve_for_exercise"
  | "source_role_not_permitted"
  | "sex_required"
  | "body_mass_required"
  | "load_required"
  | "repetitions_out_of_range"
  | "insufficient_anchors"
  | "below_lowest_anchor"
  | "above_highest_anchor";

export type StrengthPercentileResult =
  | {
      status: "resolved";
      percentile: number;
      /** What was placed on the curve: kg, or kg per kg of bodyweight for a relative curve. */
      observedValue: number;
      estimate: OneRepMaxEstimate;
      confidence: number;
      scoringVersion: typeof strengthScoringVersion;
      route: "beta_community_curve";
      normalizationMethod: StrengthNormMethod;
      sourceRole: StrengthSourceRole;
      exerciseId: string;
      aliasOfExerciseId: string | null;
      /** True when the curve belongs to a variant rather than the logged exercise. */
      borrowedCurve: boolean;
    }
  | {
      status: "unavailable";
      reason: StrengthPercentileUnavailableReason;
      /** Set when a value sat off the end of the curve, so the caller can say which end. */
      censoredAt?: number;
    };

/** Past this the spread between formulas is wider than anything the result could claim. */
export const maxEffectiveReps = 12;

/** Epley: load × (1 + reps/30). */
export function epleyOneRepMaxKg(loadKg: number, reps: number): number {
  return loadKg * (1 + reps / 30);
}

/** Brzycki: load × 36 / (37 − reps). Diverges from Epley at both ends, which is why the
 * version averages them rather than picking a favourite. */
export function brzyckiOneRepMaxKg(loadKg: number, reps: number): number {
  return (loadKg * 36) / (37 - reps);
}

/**
 * Confidence in the estimate itself, before the source's cap.
 *
 * A single rep is the lift. Every rep after it, and every rep left in reserve, widens the gap
 * between the two formulas, so the number decays rather than staying flat and then falling off
 * a cliff at the rep limit.
 */
export function estimateConfidence(effectiveReps: number): number {
  if (effectiveReps <= 1) return 1;
  return Math.max(0.4, Number((1 - (effectiveReps - 1) * 0.05).toFixed(4)));
}

export type OneRepMaxInput = {
  /** A directly measured maximum, if the athlete recorded one. */
  measuredOneRmKg?: number | null;
  loadKg?: number | null;
  repetitions?: number | null;
  /** Reps in reserve, if reported. Counts toward effective reps. */
  repsInReserve?: number | null;
};

/**
 * Direct 1RM passes through unchanged. A working set uses the mean of Epley and Brzycki on
 * effective reps = reps + optional RIR.
 */
export function estimateOneRepMax(input: OneRepMaxInput): OneRepMaxEstimate | { reason: StrengthPercentileUnavailableReason } {
  const measured = numberOrNull(input.measuredOneRmKg);
  if (measured !== null && measured > 0) {
    return { valueKg: round2(measured), basis: "measured", confidence: 1, effectiveReps: 1 };
  }

  const loadKg = numberOrNull(input.loadKg);
  if (loadKg === null || loadKg <= 0) return { reason: "load_required" };

  const reps = numberOrNull(input.repetitions);
  if (reps === null || reps < 1) return { reason: "repetitions_out_of_range" };

  const rir = Math.max(0, numberOrNull(input.repsInReserve) ?? 0);
  const effectiveReps = reps + rir;
  if (effectiveReps > maxEffectiveReps) return { reason: "repetitions_out_of_range" };

  if (effectiveReps === 1) {
    // One rep with nothing in reserve is a measured maximum in all but name, but the athlete
    // did not record it as one, so it stays flagged as estimated.
    return { valueKg: round2(loadKg), basis: "estimated", confidence: 1, effectiveReps };
  }

  const mean = (epleyOneRepMaxKg(loadKg, effectiveReps) + brzyckiOneRepMaxKg(loadKg, effectiveReps)) / 2;
  return { valueKg: round2(mean), basis: "estimated", confidence: estimateConfidence(effectiveReps), effectiveReps };
}

/**
 * Places a value on a curve.
 *
 * Interpolates linearly between the two anchors it falls between. Outside the stored range it
 * returns a censored state rather than an extrapolated number: a lift below the 5th or above the
 * 95th anchor is off the end of what the curve actually measured, and inventing a 2nd or 99th
 * percentile there would be the false precision this version exists to avoid.
 */
export function placeOnCurve(anchors: readonly CurveAnchor[], observedValue: number): { percentile: number } | { reason: StrengthPercentileUnavailableReason; censoredAt: number } {
  const ordered = [...anchors]
    .filter(anchor => Number.isFinite(anchor.percentile) && Number.isFinite(anchor.value))
    .sort((first, second) => first.value - second.value);
  if (ordered.length < 2) return { reason: "insufficient_anchors", censoredAt: 0 };

  const lowest = ordered[0];
  const highest = ordered[ordered.length - 1];
  if (observedValue < lowest.value) return { reason: "below_lowest_anchor", censoredAt: lowest.percentile };
  if (observedValue > highest.value) return { reason: "above_highest_anchor", censoredAt: highest.percentile };

  for (let index = 1; index < ordered.length; index += 1) {
    const upper = ordered[index];
    const lower = ordered[index - 1];
    if (observedValue > upper.value) continue;
    if (upper.value === lower.value) return { percentile: Math.min(lower.percentile, upper.percentile) };
    const share = (observedValue - lower.value) / (upper.value - lower.value);
    const percentile = lower.percentile + share * (upper.percentile - lower.percentile);
    return { percentile: Number(percentile.toFixed(1)) };
  }
  return { percentile: highest.percentile };
}

export type PercentileContext = {
  sex: "male" | "female" | null;
  bodyMassKg?: number | null;
};

function relativeCurve(method: StrengthNormMethod): boolean {
  return method === "direct_community_relative_1rm_percentile";
}

/**
 * The whole beta route, end to end and free of any database.
 *
 * Every refusal is typed, because "no percentile" has to be as explainable as a percentile:
 * the caller decides between asking for a measurement and saying nothing, and it can only do
 * that if it knows which input was missing.
 */
export function resolveStrengthPercentile(
  curve: StrengthCurve | null,
  input: OneRepMaxInput,
  context: PercentileContext
): StrengthPercentileResult {
  if (!curve) return { status: "unavailable", reason: "no_curve_for_exercise" };
  // The policy admits exactly one role for a beta percentile. Competitive powerlifting curves
  // are excluded at the source, and validation-only sources are not a fallback for them.
  if (curve.sourceRole !== "beta_fallback") return { status: "unavailable", reason: "source_role_not_permitted" };
  if (!context.sex) return { status: "unavailable", reason: "sex_required" };
  if (curve.sex !== context.sex) return { status: "unavailable", reason: "no_curve_for_exercise" };

  const estimate = estimateOneRepMax(input);
  if ("reason" in estimate) return { status: "unavailable", reason: estimate.reason };

  const bodyMassKg = numberOrNull(context.bodyMassKg);
  if (relativeCurve(curve.normalizationMethod) && (bodyMassKg === null || bodyMassKg <= 0)) {
    return { status: "unavailable", reason: "body_mass_required" };
  }

  const observedValue = relativeCurve(curve.normalizationMethod) && bodyMassKg
    ? Number((estimate.valueKg / bodyMassKg).toFixed(4))
    : estimate.valueKg;

  const placement = placeOnCurve(curve.anchors, observedValue);
  if ("reason" in placement) return { status: "unavailable", reason: placement.reason, censoredAt: placement.censoredAt };

  // Confidence is the estimate's own, held under the source's ceiling. It never changes the
  // percentile: how sure we are and how strong the lift is are separate answers.
  const capped = curve.confidenceCap === null ? estimate.confidence : Math.min(estimate.confidence, curve.confidenceCap);

  return {
    status: "resolved",
    percentile: placement.percentile,
    observedValue,
    estimate,
    confidence: Number(capped.toFixed(4)),
    scoringVersion: strengthScoringVersion,
    route: "beta_community_curve",
    normalizationMethod: curve.normalizationMethod,
    sourceRole: curve.sourceRole,
    exerciseId: curve.exerciseId,
    aliasOfExerciseId: curve.aliasOfExerciseId ?? null,
    borrowedCurve: Boolean(curve.aliasOfExerciseId),
  };
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function round2(value: number): number {
  return Number(value.toFixed(2));
}
