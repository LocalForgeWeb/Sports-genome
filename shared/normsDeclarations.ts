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
};

type DeclarationRule = {
  referenceId: string;
  /** Declaration flags that must all be present and true. */
  requiredConfirmations: readonly string[];
  /** The registry's `training_status` for the population these confirmations establish. */
  trainingStatus: string | null;
  /** The registry's `competition_conditions`, matched verbatim. */
  competitionConditions?: string;
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

const emptyContext: NormsDeclarationContext = { trainingStatus: null, confirmedContexts: [] };

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
  };
}
