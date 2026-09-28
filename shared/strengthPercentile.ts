/**
 * The beta strength → percentile engine, version `strength_beta_v2`.
 *
 * This is the second of two percentile routes and is deliberately separate from the
 * research-grade one in `normsReference.ts`. That route reports a band between published cut
 * points from a directly measured lift. This route interpolates a community curve from an
 * estimated 1RM. They answer differently and carry different confidence, so every result here
 * names its route and its scoring version, and the two are never pooled.
 *
 * The method is not invented here. It is transcribed from the database functions the muscle
 * ranks run on - `estimate_e1rm_strengthlevel_v1`, `estimate_e1rm_v1`,
 * `get_strength_e1rm_estimator_v1` and `get_beta_strength_percentile_v1_core` - so a lift gets
 * one estimate and one placement whether it is read on its own card or inside a muscle rank
 * (Backend V1 EN-03, B017, B056, B057). Those functions label their output
 * `strength_beta_v2` with the `strengthlevel_compatible_v1` estimator, and so does this.
 * `server/strengthPercentile.parity.test.ts` pins it to what the database returns.
 */

export const strengthScoringVersion = "strength_beta_v2" as const;

/**
 * Which e1RM formula a curve calls for, decided the way `get_strength_e1rm_estimator_v1`
 * decides it: a Strength Level curve is read with Strength Level's own calculator, anything
 * else with the generic mean of Epley and Brzycki.
 */
export type OneRepMaxEstimator = "strengthlevel_compatible_v1" | "sports_genome_generic_v1";

/** Community curves are the only source the policy admits for a beta percentile. */
export type StrengthSourceRole = "beta_fallback" | "validation_only" | "excluded";

export type StrengthNormMethod =
  | "direct_community_relative_1rm_percentile"
  | "direct_community_1rm_percentile"
  | "absolute_1RM"
  | "direct_community_rep_percentile"
  | "bodyweight_repetition_max";

/**
 * What the numbers on a curve actually are.
 *
 * This is not decoration. The stored community curves are a mix: bodyweight multiples for most
 * exercises, pounds for the rest, and rep counts for a few. Placing an estimated one-rep max in
 * kilograms onto a pound ladder reads every lift as roughly half of what it was, so the unit
 * travels with the curve and the engine converts to it rather than assuming.
 */
export type StrengthCurveUnit = "x_bodyweight" | "kg" | "lb" | "lb_1rm" | "reps";

export const kilogramsPerPound = 0.45359237;

/** One stored point on a curve. Values between anchors are interpolated; beyond them are not. */
export type CurveAnchor = { percentile: number; value: number };

export type StrengthCurve = {
  exerciseId: string;
  /** Set when the curve is borrowed from a variant, so the result can say whose curve it is. */
  aliasOfExerciseId?: string | null;
  /**
   * The study the anchors come from. Only the Strength Level family publishes an age table,
   * so this decides whether an age adjustment can be made at all.
   */
  sourceStudyId?: string | null;
  sex: "male" | "female";
  normalizationMethod: StrengthNormMethod;
  /** The unit the anchor values are in, which decides what gets placed on them. */
  unit: StrengthCurveUnit;
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
  /** The formula used, in the database's own words. */
  method: "measured_1rm" | "direct_1rm" | "mean_epley_brzycki" | "brzycki_strengthlevel_compatible" | "brzycki_epley_linear_blend_strengthlevel_compatible" | "epley_strengthlevel_compatible";
  estimator: OneRepMaxEstimator | "measured";
  /**
   * Reps in reserve as reported, or null when the athlete did not say. Unknown effort is read
   * the way the source calculator reads every set - as taken to failure - and costs confidence
   * rather than being assumed away (EN-06, decision D-008).
   */
  repsInReserve: number | null;
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
  | "above_highest_anchor"
  | "curve_is_not_one_rep_max";

/**
 * Whether the comparison was scaled for the athlete's age at the time of the lift.
 *
 * `placedValue` is what went onto the curve once scaled; `observedValue` on the result is
 * always the lift as recorded. The lift itself is never changed - the comparison is.
 */
export type AgeAdjustment =
  | { status: "applied"; version: typeof ageFactorVersion; ageYears: number; factor: number; placedValue: number }
  | { status: "not_applied"; reason: "age_missing" | "outside_published_age_range" | "not_age_scalable_source"; ageYears: number | null };

export type StrengthPercentileResult =
  | {
      status: "resolved";
      percentile: number;
      /** The lift as recorded, in the curve's unit: kg, lb, or kg per kg of bodyweight. */
      observedValue: number;
      /** Age scaling, applied or not and why. The percentile already includes it. */
      ageAdjustment: AgeAdjustment;
      estimate: OneRepMaxEstimate;
      confidence: number;
      scoringVersion: typeof strengthScoringVersion;
      route: "beta_community_curve";
      normalizationMethod: StrengthNormMethod;
      /** The unit `observedValue` is in, so a caller never has to guess its scale. */
      unit: StrengthCurveUnit;
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

/** The most reps either database estimator accepts in one set. */
export const maxRepetitions = 15;
/** The most reps in reserve either estimator accepts when effort is reported. */
export const maxRepsInReserve = 5;
/** Reps plus reps in reserve must stay below this. */
export const effectiveRepsLimit = 20;

/** Epley: load × (1 + reps/30). */
export function epleyOneRepMaxKg(loadKg: number, reps: number): number {
  return loadKg * (1 + reps / 30);
}

/** Brzycki: load × 36 / (37 − reps). */
export function brzyckiOneRepMaxKg(loadKg: number, reps: number): number {
  return (loadKg * 36) / (37 - reps);
}

/** `estimate_e1rm_strengthlevel_v1`'s confidence: by effective reps, less when effort is unknown or inferred. */
export function strengthLevelEstimateConfidence(effectiveReps: number, repsInReserve: number | null): number {
  let confidence = effectiveReps <= 3 ? 0.95 : effectiveReps <= 5 ? 0.92 : effectiveReps <= 8 ? 0.88 : effectiveReps <= 10 ? 0.84 : effectiveReps <= 12 ? 0.78 : 0.68;
  if (repsInReserve === null) confidence = Math.max(0.5, confidence - 0.08);
  else if (repsInReserve > 0) confidence = Math.max(0.45, confidence - Math.min(0.12, repsInReserve * 0.025));
  return round3(confidence);
}

/** `estimate_e1rm_v1`'s confidence, for curves that are not Strength Level's. */
export function genericEstimateConfidence(effectiveReps: number, repsInReserve: number | null): number {
  let confidence = effectiveReps <= 3 ? 0.94 : effectiveReps <= 5 ? 0.92 : effectiveReps <= 8 ? 0.88 : effectiveReps <= 10 ? 0.84 : effectiveReps <= 12 ? 0.78 : 0.7;
  if (repsInReserve === null) confidence = Math.max(0.5, confidence - 0.08);
  else if (repsInReserve > 3) confidence = Math.max(0.5, confidence - 0.05);
  return round3(confidence);
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
 * One e1RM, computed the way the database computes it.
 *
 * A direct 1RM passes through unchanged. A working set of 1-15 reps, with reps in reserve of
 * 0-5 when reported, is read on effective reps = reps + RIR (below 20):
 * - Strength Level curves (`strengthlevel_compatible_v1`): Brzycki below 8 effective reps,
 *   Epley above 10, and a straight blend from 8 (all Brzycki) to 10 (all Epley).
 * - Any other curve (`sports_genome_generic_v1`): a single rep with nothing in reserve is the
 *   lift; otherwise the mean of Epley and Brzycki.
 * The estimate is kept to 3 decimals, as the database passes it on to placement.
 */
export function estimateOneRepMax(input: OneRepMaxInput, estimator: OneRepMaxEstimator = "strengthlevel_compatible_v1"): OneRepMaxEstimate | { reason: StrengthPercentileUnavailableReason } {
  const measured = numberOrNull(input.measuredOneRmKg);
  if (measured !== null && measured > 0) {
    return { valueKg: round3(measured), basis: "measured", confidence: 1, effectiveReps: 1, method: "measured_1rm", estimator: "measured", repsInReserve: null };
  }

  const loadKg = numberOrNull(input.loadKg);
  if (loadKg === null || loadKg <= 0) return { reason: "load_required" };

  const rawReps = numberOrNull(input.repetitions);
  // The database takes reps as an integer, rounding what it is given.
  const reps = rawReps === null ? null : Math.round(rawReps);
  if (reps === null || reps < 1 || reps > maxRepetitions) return { reason: "repetitions_out_of_range" };

  const repsInReserve = numberOrNull(input.repsInReserve);
  if (repsInReserve !== null && (repsInReserve < 0 || repsInReserve > maxRepsInReserve)) return { reason: "repetitions_out_of_range" };
  const effectiveReps = reps + (repsInReserve ?? 0);
  if (effectiveReps >= effectiveRepsLimit) return { reason: "repetitions_out_of_range" };

  if (estimator === "sports_genome_generic_v1") {
    if (reps === 1 && (repsInReserve ?? 0) === 0) {
      return { valueKg: round3(loadKg), basis: "estimated", confidence: 0.98, effectiveReps, method: "direct_1rm", estimator, repsInReserve };
    }
    const mean = (epleyOneRepMaxKg(loadKg, effectiveReps) + brzyckiOneRepMaxKg(loadKg, effectiveReps)) / 2;
    return { valueKg: round3(mean), basis: "estimated", confidence: genericEstimateConfidence(effectiveReps, repsInReserve), effectiveReps, method: "mean_epley_brzycki", estimator, repsInReserve };
  }

  const brzycki = brzyckiOneRepMaxKg(loadKg, effectiveReps);
  const epley = epleyOneRepMaxKg(loadKg, effectiveReps);
  const [valueKg, method]: [number, OneRepMaxEstimate["method"]] = effectiveReps < 8
    ? [brzycki, "brzycki_strengthlevel_compatible"]
    : effectiveReps > 10
      ? [epley, "epley_strengthlevel_compatible"]
      : [brzycki * (1 - (effectiveReps - 8) / 2) + epley * ((effectiveReps - 8) / 2), "brzycki_epley_linear_blend_strengthlevel_compatible"];
  return { valueKg: round3(valueKg), basis: "estimated", confidence: strengthLevelEstimateConfidence(effectiveReps, repsInReserve), effectiveReps, method, estimator, repsInReserve };
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
    .sort((first, second) => first.value - second.value || first.percentile - second.percentile);
  if (new Set(ordered.map((anchor) => anchor.percentile)).size < 2) return { reason: "insufficient_anchors", censoredAt: 0 };

  const lowest = ordered[0];
  const highest = ordered[ordered.length - 1];
  if (observedValue < lowest.value) return { reason: "below_lowest_anchor", censoredAt: Math.min(...ordered.map((anchor) => anchor.percentile)) };
  if (observedValue > highest.value) return { reason: "above_highest_anchor", censoredAt: Math.max(...ordered.map((anchor) => anchor.percentile)) };

  // As `get_beta_strength_percentile_v1_core`: a value sitting on anchors takes the middle of
  // their percentiles; otherwise interpolate between the nearest anchor below and above.
  // The percentile is not rounded here - it is banded raw and rounded only for display (EN-19).
  const onAnchor = ordered.filter((anchor) => anchor.value === observedValue);
  if (onAnchor.length) {
    const percentiles = onAnchor.map((anchor) => anchor.percentile);
    return { percentile: (Math.min(...percentiles) + Math.max(...percentiles)) / 2 };
  }
  const lower = [...ordered].reverse().find((anchor) => anchor.value < observedValue)!;
  const upper = ordered.find((anchor) => anchor.value > observedValue)!;
  const share = (observedValue - lower.value) / (upper.value - lower.value);
  return { percentile: lower.percentile + share * (upper.percentile - lower.percentile) };
}

export type PercentileContext = {
  sex: "male" | "female" | null;
  bodyMassKg?: number | null;
  /**
   * Age on the day of the lift, not today. A birth year entered after the lift still counts:
   * nothing is stored, so every lift is re-read at the age it was lifted at.
   */
  ageYears?: number | null;
};

/* -------------------------------------------------------------------------------------------
 * Age: the published Strength Level age table
 * ---------------------------------------------------------------------------------------- */

/** The Strength Level study every beta curve is drawn from; the only source with an age table. */
export const STRENGTH_LEVEL_SOURCE_STUDY_ID = "485b3c5e-cbe7-4755-b0bd-adb224877193";

export const ageFactorVersion = "strengthlevel_age_factor_v1" as const;

/**
 * Transcribed from the database's `strengthlevel_age_factor_v1`, anchors and interpolation
 * alike, the way the rest of this engine is transcribed from the database functions: the muscle
 * ranks call that function directly, and the two routes must give one lift one number.
 *
 * A factor below 1 means that age is expected to lift less than the 25-40 baseline, so the
 * lift is compared as though it were lift / factor.
 */
const AGE_ANCHORS = [15, 20, 25, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90] as const;
const AGE_FACTORS = [0.854, 0.976, 1.0, 1.0, 0.949, 0.887, 0.816, 0.745, 0.675, 0.608, 0.547, 0.491, 0.439, 0.392] as const;

export type AgeFactor =
  | { status: "ok"; factor: number; confidence: number }
  | { status: "age_missing" }
  | { status: "outside_published_age_range" };

/**
 * The published table runs 15 to 90 and nothing is invented past either end: a 14-year-old
 * gets no adjustment rather than an extrapolated one, exactly as the database refuses it.
 */
export function strengthLevelAgeFactor(ageYears: unknown): AgeFactor {
  const age = numberOrNull(ageYears);
  if (age === null) return { status: "age_missing" };
  if (age < AGE_ANCHORS[0] || age > AGE_ANCHORS[AGE_ANCHORS.length - 1]) return { status: "outside_published_age_range" };
  if (age >= 25 && age <= 40) return { status: "ok", factor: 1, confidence: 0.96 };
  for (let index = 0; index < AGE_ANCHORS.length - 1; index += 1) {
    const lowAge = AGE_ANCHORS[index];
    const highAge = AGE_ANCHORS[index + 1];
    if (age < lowAge || age > highAge) continue;
    const share = (age - lowAge) / (highAge - lowAge);
    const factor = AGE_FACTORS[index] + share * (AGE_FACTORS[index + 1] - AGE_FACTORS[index]);
    return { status: "ok", factor: Number(factor.toFixed(4)), confidence: 0.93 };
  }
  return { status: "outside_published_age_range" };
}

/**
 * How a one-rep max in kilograms has to be expressed to sit on this curve.
 *
 * A rep ladder is not a one-rep-max ladder. `direct_community_rep_percentile` and
 * `bodyweight_repetition_max` rank how many reps people get, so no load belongs on them at all
 * and they are refused by name rather than quietly placed and reported as a percentile.
 */
export type CurvePlacement = "relative" | "kilograms" | "pounds" | "not_one_rep_max";

export function curvePlacement(curve: Pick<StrengthCurve, "unit">): CurvePlacement {
  switch (curve.unit) {
    case "x_bodyweight": return "relative";
    case "lb":
    case "lb_1rm": return "pounds";
    case "reps": return "not_one_rep_max";
    default: return "kilograms";
  }
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

  const placement = curvePlacement(curve);
  if (placement === "not_one_rep_max") return { status: "unavailable", reason: "curve_is_not_one_rep_max" };

  // The formula the curve's source calls for, as the database resolves it.
  const estimate = estimateOneRepMax(input, curve.sourceStudyId === STRENGTH_LEVEL_SOURCE_STUDY_ID ? "strengthlevel_compatible_v1" : "sports_genome_generic_v1");
  if ("reason" in estimate) return { status: "unavailable", reason: estimate.reason };

  const bodyMassKg = numberOrNull(context.bodyMassKg);
  if (placement === "relative" && (bodyMassKg === null || bodyMassKg <= 0)) {
    return { status: "unavailable", reason: "body_mass_required" };
  }

  // Unrounded, as the database places it; only `observedValue` is trimmed, for display.
  const inCurveUnit = (kilograms: number) => placement === "relative" && bodyMassKg
    ? kilograms / bodyMassKg
    : placement === "pounds"
      ? kilograms / kilogramsPerPound
      : kilograms;
  const observedValue = Number(inCurveUnit(estimate.valueKg).toFixed(5));

  // Age scales the comparison, never the lift: a 16-year-old's bench is placed as the
  // 25-40 equivalent the published table gives it, and the recorded lift stays as it was.
  const ageYears = numberOrNull(context.ageYears);
  const ageFactor = strengthLevelAgeFactor(ageYears);
  const ageScalable = curve.sourceStudyId === STRENGTH_LEVEL_SOURCE_STUDY_ID;
  const placedValue = ageScalable && ageFactor.status === "ok" ? inCurveUnit(estimate.valueKg / ageFactor.factor) : observedValue;
  const ageAdjustment: AgeAdjustment = ageFactor.status === "age_missing"
    ? { status: "not_applied", reason: "age_missing", ageYears: null }
    : !ageScalable
      ? { status: "not_applied", reason: "not_age_scalable_source", ageYears }
      : ageFactor.status === "ok"
        ? { status: "applied", version: ageFactorVersion, ageYears: ageYears!, factor: ageFactor.factor, placedValue }
        : { status: "not_applied", reason: "outside_published_age_range", ageYears };

  const placed = placeOnCurve(curve.anchors, placedValue);
  if ("reason" in placed) return { status: "unavailable", reason: placed.reason, censoredAt: placed.censoredAt };

  // Confidence is the estimate's own, held under the source's ceiling and, when age scaled the
  // comparison, under the age table's own confidence too - the same three the database takes
  // the least of. It never changes the percentile: how sure we are and how strong the lift is
  // are separate answers.
  const capped = Math.min(
    estimate.confidence,
    curve.confidenceCap ?? 1,
    ageAdjustment.status === "applied" && ageFactor.status === "ok" ? ageFactor.confidence : 1,
  );

  return {
    status: "resolved",
    percentile: placed.percentile,
    observedValue,
    ageAdjustment,
    estimate,
    confidence: Number(capped.toFixed(4)),
    scoringVersion: strengthScoringVersion,
    route: "beta_community_curve",
    normalizationMethod: curve.normalizationMethod,
    unit: curve.unit,
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

function round3(value: number): number {
  return Number(value.toFixed(3));
}
