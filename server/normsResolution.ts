import { parseNormsDeclaration } from "../shared/normsDeclarations";
import {
  resolveNormsReference,
  type NormsAthleteContext,
  type NormsComparisonSex,
  type NormsReferenceRow,
  type NormsResolution,
} from "../shared/normsReference";
import { getAthleteStrengthProfile } from "./athleteStrengthProfile";
import { describeRegistryConnection, getApprovedNormsReference } from "./normsRegistry";
import { getStrengthGenomeOverview, listStrengthObservations } from "./strengthGenome";

/**
 * Binds a saved Strength Genome observation to the approved research registry.
 *
 * Everything the comparison needs comes from data the athlete already entered:
 * the observation itself, the sex/date-of-birth captured once in onboarding, and
 * the explicit source-population declaration saved alongside the test. Nothing is
 * inferred, and no observation is compared against a reference whose population
 * the athlete has not confirmed.
 */

type StrengthObservation = Awaited<ReturnType<typeof listStrengthObservations>>[number];

function decimalToNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

/**
 * Only male and female reference populations exist in the registry. An intersex or
 * unspecified profile is not silently mapped onto one of them; it leaves the
 * comparison unavailable, which the interface reports as a missing declaration.
 */
function comparisonSex(sexForReference: unknown): NormsComparisonSex | null {
  return sexForReference === "male" || sexForReference === "female" ? sexForReference : null;
}

/** Whole years completed at the moment of the test, not at today's date. */
export function ageYearsAt(dateOfBirth: Date | null, observedAt: Date): number | null {
  if (!dateOfBirth || Number.isNaN(dateOfBirth.getTime()) || Number.isNaN(observedAt.getTime())) return null;
  let age = observedAt.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const monthDelta = observedAt.getUTCMonth() - dateOfBirth.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && observedAt.getUTCDate() < dateOfBirth.getUTCDate())) {
    age -= 1;
  }
  return age >= 0 && age < 130 ? age : null;
}

/**
 * Builds the matching context for one observation.
 *
 * A measured maximum is taken only from `measuredOneRmKg`; an estimated 1RM is
 * deliberately not substituted, because the registry's 1RM populations report
 * directly measured lifts.
 */
export function buildAthleteContext(
  observation: StrengthObservation,
  profile: { dateOfBirth: Date | null; sexForReference: string } | null
): NormsAthleteContext {
  const declaration = parseNormsDeclaration(observation.referenceContextJson);
  const observedAt = observation.observedAt instanceof Date ? observation.observedAt : new Date(observation.observedAt);

  return {
    catalogExerciseId: observation.catalogExerciseId ?? null,
    exerciseName: observation.exerciseName,
    sex: comparisonSex(profile?.sexForReference),
    ageYears: ageYearsAt(profile?.dateOfBirth ?? null, observedAt),
    bodyMassKg: decimalToNumber(observation.bodyMassKgAtTest),
    measuredOneRmKg: decimalToNumber(observation.measuredOneRmKg),
    loadKg: decimalToNumber(observation.loadKg),
    repetitions: observation.repetitions ?? null,
    trainingStatus: declaration.trainingStatus,
    confirmedContexts: declaration.confirmedContexts,
  };
}

export type StrengthObservationReference = {
  observationId: number;
  exerciseName: string;
  resolution: NormsResolution;
};

/** Pure core, so the whole resolution path is testable without a database or network. */
export function resolveObservations(
  observations: readonly StrengthObservation[],
  profile: { dateOfBirth: Date | null; sexForReference: string } | null,
  rows: readonly NormsReferenceRow[]
): StrengthObservationReference[] {
  return observations.map(observation => ({
    observationId: observation.id,
    exerciseName: observation.exerciseName,
    resolution: rows.length
      ? resolveNormsReference(rows, buildAthleteContext(observation, profile))
      : ({ status: "unavailable", reason: "registry_unavailable", candidateCount: 0 } as const),
  }));
}

/**
 * Resolves every saved observation for an athlete against the approved registry.
 * Returns one entry per observation, each either a source-bounded band or the
 * typed reason no approved reference applies.
 */
export async function getStrengthObservationReferences(
  userId: number
): Promise<StrengthObservationReference[]> {
  const [observations, profile, rows] = await Promise.all([
    listStrengthObservations(userId),
    getAthleteStrengthProfile(userId),
    getApprovedNormsReference(),
  ]);
  return resolveObservations(observations, profile, rows);
}

/**
 * Reports what the registry currently makes available, so the workspace can show
 * an honest inventory (how many approved references exist, for which exercises)
 * without implying any of them rank the athlete.
 */
export async function getNormsRegistryStatus() {
  const rows = await getApprovedNormsReference();
  const exerciseNames = Array.from(
    new Set(rows.map(row => row.exerciseName).filter((name): name is string => name !== null))
  ).sort();
  return {
    available: rows.length > 0,
    approvedCutPointCount: rows.length,
    exerciseNames,
    referenceFamilies: Array.from(new Set(rows.map(row => row.referenceFamily))).sort(),
    // Read after the lookup above, so it reflects that attempt rather than the last one.
    connection: describeRegistryConnection(),
  };
}

/**
 * The Strength Genome overview, with the registry's verdict folded in.
 *
 * The overview's own summary describes routing only; it cannot say whether any
 * saved test actually reached an approved population comparison. Composing it here
 * keeps `strengthGenome.ts` free of a dependency on the registry - the import
 * direction stays one-way - while letting the workspace state what really happened.
 */
export async function getStrengthGenomeOverviewWithReferences(userId: number) {
  const [overview, references] = await Promise.all([
    getStrengthGenomeOverview(userId),
    getStrengthObservationReferences(userId),
  ]);
  return summarizeOverviewWithReferences(overview, references);
}

/** Pure merge, so the summary wording is testable without a database. */
export function summarizeOverviewWithReferences<T extends { nextAction: string }>(
  overview: T,
  references: readonly StrengthObservationReference[]
) {
  const comparedObservationCount = references.filter(entry => entry.resolution.status === "matched").length;
  if (comparedObservationCount === 0) return { ...overview, comparedObservationCount };
  const subject = comparedObservationCount === 1 ? "test matches" : "tests match";
  const pronoun = comparedObservationCount === 1 ? "it" : "them";
  return {
    ...overview,
    comparedObservationCount,
    nextAction: `${comparedObservationCount} saved ${subject} a reviewed source's exact population and protocol, so a comparison is shown for ${pronoun}. Every other saved test stays on your own logs only.`,
  };
}
