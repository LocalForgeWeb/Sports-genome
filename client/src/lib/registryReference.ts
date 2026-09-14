import { parseNormsDeclaration } from "@shared/normsDeclarations";
import {
  resolveNormsReference,
  type NormsAthleteContext,
  type NormsReferenceRow,
  type NormsResolution,
} from "@shared/normsReference";

/**
 * Workspace adapter over the registry-driven reference engine.
 *
 * The server sends only the cut points `app_reference_eligibility` has approved,
 * and the matching itself runs here against the same pure rules the server uses.
 * Doing it this way means a device-local observation - one that never reaches the
 * database - gets exactly the same gated comparison as an account-backed one, and
 * no athlete record has to leave the device to be ranked.
 */

export type RegistryReferenceObservation = {
  catalogExerciseId?: number | null;
  exerciseName: string;
  measurementType: string;
  loadKg?: number | string | null;
  repetitions?: number | null;
  bodyMassKgAtTest?: number | string | null;
  referenceContextJson?: string | null;
};

/** Sex and birth year captured once in onboarding and held by the workspace. */
export type RegistryReferenceProfile = {
  sexForReference?: string | null;
  birthYear?: number | null;
} | null;

function numeric(value: number | string | null | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function profileSex(profile: RegistryReferenceProfile): "male" | "female" | null {
  const sex = profile?.sexForReference;
  return sex === "male" || sex === "female" ? sex : null;
}

/**
 * Age at the test from the profile's birth year. The workspace only holds a year,
 * so this is the age the athlete reaches during the test year and can sit one year
 * high before their birthday. It is a fallback: when the athlete declared an exact
 * age beside the test itself, that value is used instead.
 */
export function profileAgeYears(profile: RegistryReferenceProfile, observedAt: Date): number | null {
  const birthYear = profile?.birthYear;
  if (typeof birthYear !== "number" || !Number.isFinite(birthYear)) return null;
  if (Number.isNaN(observedAt.getTime())) return null;
  const age = observedAt.getUTCFullYear() - birthYear;
  return age >= 0 && age < 130 ? age : null;
}

/**
 * Builds the matching context for one saved test.
 *
 * Sex and age come from the declaration the athlete filled in beside this specific
 * test when present, and otherwise from the saved profile - the same precedence the
 * existing per-source routes use.
 *
 * A 1RM reference compares a directly measured maximum. This workspace records that
 * as the test load plus an explicit "this was a maximum successful lift"
 * confirmation, so the load is promoted to a measured maximum only when the
 * declaration carries that confirmation. Without it the observation stays unranked
 * rather than being compared as though it were a max.
 */
export function buildRegistryContext(
  observation: RegistryReferenceObservation,
  observedAt: Date,
  profile: RegistryReferenceProfile
): NormsAthleteContext {
  const declaration = parseNormsDeclaration(observation.referenceContextJson);
  const loadKg = numeric(observation.loadKg);

  return {
    catalogExerciseId: observation.catalogExerciseId ?? null,
    exerciseName: observation.exerciseName,
    sex: declaration.declaredSex ?? profileSex(profile),
    ageYears: declaration.declaredAgeYears ?? profileAgeYears(profile, observedAt),
    bodyMassKg: numeric(observation.bodyMassKgAtTest),
    measuredOneRmKg: declaration.declaresMeasuredMaximum ? loadKg : null,
    loadKg,
    repetitions: observation.repetitions ?? null,
    trainingStatus: declaration.trainingStatus,
    confirmedContexts: declaration.confirmedContexts,
  };
}

/**
 * Resolves one observation against the approved registry, or returns null when the
 * registry has not loaded - which leaves the existing per-source routes in charge
 * rather than replacing a working comparison with an empty one.
 */
export function getRegistryReferenceForObservation(
  observation: RegistryReferenceObservation,
  rows: readonly NormsReferenceRow[],
  profile: RegistryReferenceProfile,
  observedAt: Date
): NormsResolution | null {
  if (rows.length === 0) return null;
  return resolveNormsReference(rows, buildRegistryContext(observation, observedAt, profile));
}

/** Athlete-facing wording for each gate the registry can close a comparison on. */
export const registryUnavailableExplanation: Record<string, string> = {
  registry_unavailable: "The research library is not reachable right now, so no outside comparison is shown.",
  no_reference_for_exercise: "No reviewed study covers this exact lift yet.",
  unsupported_measurement_protocol: "No reviewed study measures this lift the way it was recorded.",
  comparison_sex_required: "Add the sex to compare against to see whether a study matches.",
  sex_not_in_reference: "The matching study does not report this sex.",
  age_required: "Add your age on the test day to see whether a study matches.",
  age_not_in_reference: "The matching study does not report your age group.",
  body_mass_required: "Add your body weight on the test day to see whether a study matches.",
  body_mass_not_in_reference_band: "The matching study does not report your body-weight group.",
  measured_maximum_required: "Only a directly measured maximum can be compared; an estimate cannot.",
  load_required: "Add the load you lifted to see whether a study matches.",
  repetition_count_mismatch: "The matching study measured a different number of reps.",
  training_status_mismatch: "Your training situation does not match the study group.",
  competition_context_confirmation_required: "Confirm the exact competition conditions to use this study.",
  ambiguous_reference_match: "More than one study matches this test, so no single rank is shown.",
};
