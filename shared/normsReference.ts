/**
 * Registry-driven population reference resolution.
 *
 * The Sports Genome research project (Supabase) carries thousands of norm rows,
 * but `app_reference_eligibility` is the gate that decides which of them may ever
 * reach an athlete as a rank. This module holds the shape of an approved reference
 * row and the pure matching rules that turn a saved observation into either a
 * source-bounded percentile band or an explicit, typed unavailable state.
 *
 * The rules here are deliberately literal. A reference row describes exactly one
 * population, protocol, and normalization; nothing in this file may widen it by
 * interpolating a percentile, converting between measurement families, or
 * substituting a nearby population. When a row does not match the athlete on
 * every declared field, the result is `unavailable` with a reason the interface
 * can explain - never a softened or approximate rank.
 */

export type NormsComparisonSex = "male" | "female";

/**
 * One approved cut point, as it reaches the browser.
 *
 * The matching engine runs on the device, so this has to carry everything a match
 * depends on - and nothing else. `strengthGenome.referenceRows` is a public,
 * unauthenticated query, so every field here is readable by anyone who loads the
 * app. The registry's own bookkeeping - primary keys, table names, the internal
 * taxonomy, and the reviewers' notes to each other - is deliberately not on this
 * type; it stays server-side on RegistryRow.
 *
 * Where an internal value was load-bearing it is replaced by an opaque digest:
 * grouping needs those values to be *distinct*, never to be readable.
 */
export type NormsReferenceRow = {
  /** Opaque, stable identity for one approved cut point. Not a database key. */
  referenceKey: string;
  /**
   * Opaque discriminator for the published table a cut point belongs to. Two
   * different tables must never pool into one percentile ladder, which needs this
   * to differ between them - it does not need to name either.
   */
  tableGroup: string;
  exerciseId: string | null;
  exerciseName: string | null;
  /** Approved local-catalog identities for this exercise, from app_exercise_source_mappings. */
  localCatalogIds: readonly number[];
  measurementType: string;
  unit: string;
  sex: NormsComparisonSex | null;
  ageMin: number | null;
  ageMax: number | null;
  bodyweightMinKg: number | null;
  bodyweightMaxKg: number | null;
  trainingStatus: string | null;
  equipment: string | null;
  protocol: string | null;
  /** Non-empty when the source population is a competition cohort the athlete must confirm. */
  competitionConditions: string | null;
  populationDefinition: string | null;
  percentile: number;
  value: number;
  sampleSize: number | null;
  sourceText: string | null;
  sourceStudyId: string | null;
  /** Citation link for the source study, when the registry records one. */
  sourceUrl: string | null;
};

/**
 * What the athlete actually recorded, in their own terms. Nothing is inferred:
 * a field left undefined is treated as missing, which blocks any reference that
 * declares it.
 */
export type NormsAthleteContext = {
  catalogExerciseId?: number | null;
  exerciseName?: string | null;
  sex?: NormsComparisonSex | null;
  ageYears?: number | null;
  bodyMassKg?: number | null;
  /** A directly measured one-repetition maximum, in kilograms. */
  measuredOneRmKg?: number | null;
  /** The load carried for `repetitions`, in kilograms. Feeds rep-max references only. */
  loadKg?: number | null;
  /** Repetitions performed at `loadKg`; a rep-max reference requires an exact match. */
  repetitions?: number | null;
  trainingStatus?: string | null;
  /**
   * Competition/population contexts the athlete has explicitly confirmed, matched
   * verbatim against a row's competition_conditions. An unconfirmed competition
   * reference never resolves.
   */
  confirmedContexts?: readonly string[];
};

export type NormsUnavailableReason =
  | "registry_unavailable"
  | "no_reference_for_exercise"
  | "unsupported_measurement_protocol"
  | "comparison_sex_required"
  | "sex_not_in_reference"
  | "age_required"
  | "age_not_in_reference"
  | "body_mass_required"
  | "body_mass_not_in_reference_band"
  | "measured_maximum_required"
  | "load_required"
  | "repetition_count_mismatch"
  | "training_status_mismatch"
  | "competition_context_confirmation_required"
  | "ambiguous_reference_match";

export type NormsUnavailable = {
  status: "unavailable";
  reason: NormsUnavailableReason;
  /** How many approved rows existed for the exercise before the gate rejected them. */
  candidateCount: number;
};

export type NormsMatch = {
  status: "matched";
  referenceKey: string;
  exerciseName: string | null;
  /** The athlete's observation expressed in the reference's own unit. */
  observedValue: number;
  unit: string;
  /** A band label between reported cut points. Never an interpolated percentile. */
  percentileBandLabel: string;
  measurementType: string;
  populationDefinition: string | null;
  competitionConditions: string | null;
  sampleSize: number | null;
  sourceText: string | null;
  sourceStudyId: string | null;
  sourceUrl: string | null;
  /** Every cut point in the matched table, for transparent display. */
  cutPoints: readonly { percentile: number; value: number }[];
};

export type NormsResolution = NormsMatch | NormsUnavailable;

const KG_PER_LB = 0.45359237;

/** Measurement families whose reference values are load relative to body mass. */
function isRelativeToBodyMass(row: NormsReferenceRow): boolean {
  return row.unit === "x_bodyweight";
}

/**
 * The repetition count a reference was measured at, read from the registry's
 * measurement type (`direct_relative_1rm_by_age_sex` -> 1,
 * `direct_10rm_percentile_pretraining` -> 10) rather than hardcoded per source.
 * Returns null when the protocol is not a repetition maximum, in which case this
 * engine declines the row instead of guessing which load to compare.
 */
function requiredRepetitions(row: NormsReferenceRow): number | null {
  const match = /(?:^|[_\W])(\d+)\s*rm(?:[_\W]|$)/i.exec(row.measurementType);
  return match ? Number(match[1]) : null;
}

function kgToUnit(valueKg: number, unit: string): number | null {
  if (unit === "kg") return valueKg;
  if (unit === "lb") return valueKg / KG_PER_LB;
  return null;
}

function withinInclusive(value: number, min: number | null, max: number | null): boolean {
  if (min !== null && value < min) return false;
  if (max !== null && value > max) return false;
  return true;
}

/**
 * Body-mass bands are published as a contiguous ladder whose neighbours share a
 * boundary value (the Piper 10RM bands convert to 61.235 kg as both the top of one
 * band and the bottom of the next). Treating both ends as inclusive would put an
 * athlete sitting exactly on a boundary into two tables at once, which the engine
 * would then refuse as ambiguous. The source's own bands are half-open - "up to
 * 135 lb", then "above 135 lb up to 150 lb" - so the lower bound is exclusive
 * wherever one exists, and the lightest band keeps an open bottom.
 */
function withinBand(value: number, min: number | null, max: number | null): boolean {
  if (min !== null && value <= min) return false;
  if (max !== null && value > max) return false;
  return true;
}

function positiveOrNull(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

/** Approved rows whose exercise identity matches the observation. */
function referencesForExercise(
  rows: readonly NormsReferenceRow[],
  context: NormsAthleteContext
): NormsReferenceRow[] {
  const catalogId = context.catalogExerciseId ?? null;
  const name = context.exerciseName?.trim().toLowerCase() ?? null;
  return rows.filter(row => {
    if (catalogId !== null && row.localCatalogIds.includes(catalogId)) return true;
    // Name matching is a fallback for observations saved before catalog selection
    // existed. It is exact and case-insensitive only - never fuzzy, because a
    // near-name match is exactly the "name-only conversion" the gate registry exists
    // to prevent.
    return name !== null && row.exerciseName?.trim().toLowerCase() === name;
  });
}

/**
 * Picks the load this reference compares against and expresses it in the
 * reference's unit, or returns the reason it cannot be expressed.
 *
 * A 1RM table compares a directly measured maximum; a rep-max table compares the
 * load carried at exactly its own repetition count. The two are never substituted
 * for one another, and an estimated maximum never stands in for a measured one.
 */
function observedValueInReferenceUnit(
  row: NormsReferenceRow,
  context: NormsAthleteContext,
  reps: number
): { value: number } | { reason: NormsUnavailableReason } {
  let loadKg: number | null;
  if (reps === 1) {
    loadKg = positiveOrNull(context.measuredOneRmKg);
    if (loadKg === null) return { reason: "measured_maximum_required" };
  } else {
    if (context.repetitions !== reps) return { reason: "repetition_count_mismatch" };
    loadKg = positiveOrNull(context.loadKg);
    if (loadKg === null) return { reason: "load_required" };
  }

  if (isRelativeToBodyMass(row)) {
    const bodyMassKg = positiveOrNull(context.bodyMassKg);
    if (bodyMassKg === null) return { reason: "body_mass_required" };
    return { value: loadKg / bodyMassKg };
  }

  const converted = kgToUnit(loadKg, row.unit);
  // An unrecognised unit is not a silent pass-through: the reference is simply
  // not usable for this observation.
  if (converted === null) return { reason: "unsupported_measurement_protocol" };
  return { value: converted };
}

/**
 * Builds the band label from the reported cut points. Matching the existing
 * van den Hoek route, an observation between two deciles is reported as the
 * interval it falls in, and one outside the table is reported as beyond its edge.
 */
export function percentileBandLabel(
  observedValue: number,
  cutPoints: readonly { percentile: number; value: number }[]
): string {
  const ordered = [...cutPoints].sort((first, second) => first.percentile - second.percentile);
  const exact = ordered.find(point => Math.abs(observedValue - point.value) < 0.005);
  if (exact) return `${exact.percentile}th percentile`;
  const lowest = ordered[0];
  const highest = ordered[ordered.length - 1];
  if (observedValue < lowest.value) return `Below the ${lowest.percentile}th percentile`;
  if (observedValue > highest.value) return `Above the ${highest.percentile}th percentile`;
  const upperIndex = ordered.findIndex(point => observedValue < point.value);
  return `${ordered[upperIndex - 1].percentile}th-${ordered[upperIndex].percentile}th percentile`;
}

/**
 * Identifies the published table a cut point belongs to. Rows from two different
 * tables must never be pooled into one percentile ladder - that would blend
 * distinct populations into a cut point no source reported.
 */
function referenceTableKey(row: NormsReferenceRow): string {
  return [
    row.tableGroup,
    row.exerciseId ?? row.exerciseName ?? "",
    row.measurementType,
    row.unit,
    row.sex ?? "",
    row.ageMin ?? "",
    row.ageMax ?? "",
    row.bodyweightMinKg ?? "",
    row.bodyweightMaxKg ?? "",
    row.trainingStatus ?? "",
    row.protocol ?? "",
    row.sourceStudyId ?? "",
  ].join("|");
}

/**
 * Ordering used to decide which blocked gate to report when nothing matches.
 * Higher wins, so the athlete is told about the most specific, most actionable
 * gap (a missing body mass they can enter) rather than a generic mismatch.
 */
const blockerPriority: Record<NormsUnavailableReason, number> = {
  registry_unavailable: 0,
  no_reference_for_exercise: 1,
  unsupported_measurement_protocol: 2,
  sex_not_in_reference: 3,
  age_not_in_reference: 4,
  training_status_mismatch: 5,
  repetition_count_mismatch: 6,
  body_mass_not_in_reference_band: 7,
  ambiguous_reference_match: 8,
  comparison_sex_required: 9,
  age_required: 10,
  measured_maximum_required: 11,
  load_required: 12,
  body_mass_required: 13,
  competition_context_confirmation_required: 14,
};

/**
 * Resolves an observation against the approved registry.
 *
 * A band is reported only when the athlete matches one published table on every
 * field that table declares.
 */
export function resolveNormsReference(
  rows: readonly NormsReferenceRow[],
  context: NormsAthleteContext
): NormsResolution {
  const candidates = referencesForExercise(rows, context);
  if (candidates.length === 0) {
    return { status: "unavailable", reason: "no_reference_for_exercise", candidateCount: 0 };
  }

  const candidateCount = candidates.length;
  let blockingReason: NormsUnavailableReason = "no_reference_for_exercise";
  const noteBlocker = (reason: NormsUnavailableReason) => {
    if (blockerPriority[reason] > blockerPriority[blockingReason]) blockingReason = reason;
  };

  const matches: { row: NormsReferenceRow; observedValue: number }[] = [];

  for (const row of candidates) {
    const reps = requiredRepetitions(row);
    if (reps === null) {
      noteBlocker("unsupported_measurement_protocol");
      continue;
    }

    if (row.sex !== null) {
      if (!context.sex) {
        noteBlocker("comparison_sex_required");
        continue;
      }
      if (context.sex !== row.sex) {
        noteBlocker("sex_not_in_reference");
        continue;
      }
    }

    if (row.ageMin !== null || row.ageMax !== null) {
      const age = context.ageYears ?? null;
      if (age === null || !Number.isFinite(age)) {
        noteBlocker("age_required");
        continue;
      }
      if (!withinInclusive(age, row.ageMin, row.ageMax)) {
        noteBlocker("age_not_in_reference");
        continue;
      }
    }

    if (row.competitionConditions && row.competitionConditions.trim()) {
      const confirmed = context.confirmedContexts ?? [];
      if (!confirmed.includes(row.competitionConditions)) {
        noteBlocker("competition_context_confirmation_required");
        continue;
      }
    }

    if (row.trainingStatus && row.trainingStatus.trim()) {
      if (context.trainingStatus !== row.trainingStatus) {
        noteBlocker("training_status_mismatch");
        continue;
      }
    }

    if (row.bodyweightMinKg !== null || row.bodyweightMaxKg !== null) {
      const bodyMassKg = positiveOrNull(context.bodyMassKg);
      if (bodyMassKg === null) {
        noteBlocker("body_mass_required");
        continue;
      }
      if (!withinBand(bodyMassKg, row.bodyweightMinKg, row.bodyweightMaxKg)) {
        noteBlocker("body_mass_not_in_reference_band");
        continue;
      }
    }

    const observed = observedValueInReferenceUnit(row, context, reps);
    if ("reason" in observed) {
      noteBlocker(observed.reason);
      continue;
    }

    matches.push({ row, observedValue: observed.value });
  }

  if (matches.length === 0) {
    return { status: "unavailable", reason: blockingReason, candidateCount };
  }

  const tables = new Map<string, { row: NormsReferenceRow; observedValue: number }[]>();
  for (const match of matches) {
    const key = referenceTableKey(match.row);
    const group = tables.get(key);
    if (group) group.push(match);
    else tables.set(key, [match]);
  }

  // Matching more than one approved table is an ambiguity in the registry, not a
  // rank to guess at.
  if (tables.size > 1) {
    return { status: "unavailable", reason: "ambiguous_reference_match", candidateCount };
  }

  const group = Array.from(tables.values())[0];
  const cutPoints = group
    .map(match => ({ percentile: match.row.percentile, value: match.row.value }))
    .sort((first, second) => first.percentile - second.percentile);
  const primary = group[0];

  return {
    status: "matched",
    referenceKey: primary.row.referenceKey,
    exerciseName: primary.row.exerciseName,
    observedValue: primary.observedValue,
    unit: primary.row.unit,
    percentileBandLabel: percentileBandLabel(primary.observedValue, cutPoints),
    measurementType: primary.row.measurementType,
    populationDefinition: primary.row.populationDefinition,
    competitionConditions: primary.row.competitionConditions,
    sampleSize: primary.row.sampleSize,
    sourceText: primary.row.sourceText,
    sourceStudyId: primary.row.sourceStudyId,
    sourceUrl: primary.row.sourceUrl,
    cutPoints,
  };
}

export const normsReferenceInternals = { requiredRepetitions, kgToUnit, referenceTableKey, withinBand };
