/**
 * Translates an athlete's saved reference declaration into the population fields
 * the research registry states for its approved rows.
 *
 * A reference row in `app_reference_eligibility` names its population in the
 * source's own words (`training_status: "strength-trained competitive"`,
 * `competition_conditions: "powerlifting; drug-tested unequipped competition"`).
 * The app captures the same facts as explicit athlete confirmations. This module
 * is the one place the two vocabularies meet, so the matching engine never has to
 * infer a population from an exercise name.
 *
 * Every entry requires the athlete to have confirmed each fact the source's
 * population depends on. A partial declaration yields nothing, which leaves the
 * observation in its unavailable state rather than borrowing a population the
 * athlete never confirmed.
 */

export type NormsDeclarationContext = {
  trainingStatus: string | null;
  confirmedContexts: readonly string[];
  /**
   * Sex and age as declared for this specific test. The workspace captures these
   * beside the confirmations, which lets a saved observation resolve even when the
   * athlete has not filled in a profile. Only male and female are carried, because
   * those are the only populations the registry reports.
   */
  declaredSex: "male" | "female" | null;
  declaredAgeYears: number | null;
  /**
   * True only when the athlete confirmed this test was a directly measured maximum.
   * A 1RM reference compares measured maxima, so without this the recorded load is
   * never promoted into that comparison.
   */
  declaresMeasuredMaximum: boolean;
};

type DeclarationRule = {
  referenceId: string;
  /** Declaration flags that must all be present and true. */
  requiredConfirmations: readonly string[];
  /** The registry's `training_status` for the population these confirmations establish. */
  trainingStatus: string | null;
  /** The registry's `competition_conditions`, matched verbatim. */
  competitionConditions?: string;
  /** Whether this route's confirmations establish a directly measured maximum. */
  measuredMaximum?: boolean;
};

/**
 * One rule per approved population route. These mirror values stored in the
 * research registry; changing a registry population string requires changing the
 * matching rule here, which is why both are asserted in tests.
 */
export const declarationRules: readonly DeclarationRule[] = [
  {
    referenceId: "van_den_hoek_2024_powerlifting_relative_strength",
    requiredConfirmations: [
      "drugTestedCompetitionConfirmed",
      "unequippedCompetitionConfirmed",
      "maximumSuccessfulLiftConfirmed",
    ],
    trainingStatus: "strength-trained competitive",
    competitionConditions: "powerlifting; drug-tested unequipped competition",
    measuredMaximum: true,
  },
  {
    referenceId: "piper_2021_preacher_curl_10rm",
    requiredConfirmations: [
      "collegeStudentConfirmed",
      "preTrainingConfirmed",
      "exactProtocolConfirmed",
      "directlyObservedConfirmed",
    ],
    trainingStatus: "novice-to-intermediate; pre-training",
  },
];

const emptyContext: NormsDeclarationContext = {
  trainingStatus: null,
  confirmedContexts: [],
  declaredSex: null,
  declaredAgeYears: null,
  declaresMeasuredMaximum: false,
};

function declaredSex(value: unknown): "male" | "female" | null {
  return value === "male" || value === "female" ? value : null;
}

function declaredAge(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 && value < 130 ? value : null;
}

/**
 * Reads a saved `referenceContextJson` blob. Returns an empty context for missing,
 * malformed, unknown, or incomplete declarations - all of which must leave the
 * observation unranked rather than partially matched.
 */
export function parseNormsDeclaration(referenceContextJson: string | null | undefined): NormsDeclarationContext {
  if (!referenceContextJson?.trim()) return emptyContext;

  let parsed: unknown;
  try {
    parsed = JSON.parse(referenceContextJson);
  } catch {
    return emptyContext;
  }
  if (typeof parsed !== "object" || parsed === null) return emptyContext;

  const declaration = parsed as Record<string, unknown>;
  const referenceId = typeof declaration.referenceId === "string" ? declaration.referenceId : null;
  if (!referenceId) return emptyContext;

  const rule = declarationRules.find(candidate => candidate.referenceId === referenceId);
  if (!rule) return emptyContext;

  const allConfirmed = rule.requiredConfirmations.every(field => declaration[field] === true);
  if (!allConfirmed) return emptyContext;

  return {
    trainingStatus: rule.trainingStatus,
    confirmedContexts: rule.competitionConditions ? [rule.competitionConditions] : [],
    declaredSex: declaredSex(declaration.sex),
    declaredAgeYears: declaredAge(declaration.ageYears),
    declaresMeasuredMaximum: rule.measuredMaximum === true,
  };
}
