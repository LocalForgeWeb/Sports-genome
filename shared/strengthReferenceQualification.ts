import { auditedStrengthReferenceGates } from "./strengthReferenceAuditGates";

export type ReferenceGateStatus =
  | "needs_details"
  | "not_eligible"
  | "source_access_not_authorized"
  | "context_only_not_numeric"
  | "qualified_but_no_authorized_table";

export type SourceAccess = "authorized_not_ingested" | "license_review_required" | "context_only" | "blocked";

export type StrengthReferenceCandidate = {
  id: string;
  label: string;
  citationUrl: string;
  referencePopulation: string;
  scope: string;
  requiredFields: readonly string[];
  sourcePopulationId: string;
  sourceProtocolId: string;
  sourceTestId: string;
  sourceNormalizationId: string;
  sourceAccess: SourceAccess;
  expectedSport?: string;
  auditRecordNumber?: number;
  numericReferenceStatus: "not_ingested" | "blocked_pending_license";
  boundary: string;
};

export type StrengthReferenceMatchInput = {
  exerciseName?: string;
  testType?: "MEASURED_1RM" | "MULTI_REP" | "BODYWEIGHT" | "ISOMETRIC" | "DYNAMOMETRY";
  repetitions?: number | null;
  sex?: "female" | "male" | "intersex" | "self_described" | "prefer_not_to_say";
  ageYears?: number;
  bodyMassKgAtTest?: number;
  laterality?: "left" | "right" | "bilateral" | "not_recorded";
  equipment?: string;
  rawUnequippedDrugTestedCompetition?: boolean;
  powerliftingWeightClass?: string;
  sourcePopulationId?: string;
  sourceProtocolId?: string;
  sourceTestId?: string;
  sourceNormalizationId?: string;
  competitiveLevel?: string;
  weightCategory?: string;
  maturityStatus?: string;
  heightCm?: number;
  populationEthnicity?: string;
  durationSeconds?: number;
  administrationMode?: string;
  sport?: string;
  position?: string;
  jointAngle?: string;
  servicePopulation?: string;
  contractionMode?: string;
};

export type StrengthReferenceQualification = {
  status: ReferenceGateStatus;
  candidate: StrengthReferenceCandidate;
  missingFields: readonly string[];
  mismatchReason?: string;
};

const exactSourceFields = ["sourcePopulationId", "sourceProtocolId", "sourceTestId", "sourceNormalizationId"] as const;

/**
 * This registry stores source scope and eligibility gates only. It intentionally
 * stores no copied percentile or strength-standard table values. A matched gate
 * still cannot generate a population result until appropriately authorized,
 * source-checked numeric reference data are separately introduced.
 */
export const strengthReferenceCandidates: readonly StrengthReferenceCandidate[] = [
  {
    id: "piper_2021_preacher_curl_10rm",
    label: "College-aged male standardized preacher-curl 10RM",
    citationUrl: "https://doi.org/10.47206/ijsc.v1i1.40",
    referencePopulation: "College-aged males, 18–25 years, tested in one facility on the study protocol.",
    scope: "Preacher curl 10RM only; exact body-mass category and protocol required.",
    requiredFields: ["exerciseName", "testType", "repetitions", "sex", "ageYears", "bodyMassKgAtTest", "equipment", ...exactSourceFields],
    sourcePopulationId: "piper_2021_preacher_curl_10rm:population",
    sourceProtocolId: "piper_2021_preacher_curl_10rm:protocol",
    sourceTestId: "piper_2021_preacher_curl_10rm:exact-test",
    sourceNormalizationId: "piper_2021_preacher_curl_10rm:normalization",
    sourceAccess: "authorized_not_ingested",
    numericReferenceStatus: "not_ingested",
    boundary: "It must not rate a generic curl, a 1RM, another repetition count, a regional biceps value, or sport ability.",
  },
  {
    id: "van_den_hoek_2024_powerlifting",
    label: "Drug-tested unequipped powerlifting competition reference",
    citationUrl: "https://pubmed.ncbi.nlm.nih.gov/39060209/",
    referencePopulation: "Global drug-tested, unequipped powerlifting competition entries.",
    scope: "Maximum successful competition squat, bench press, or deadlift normalized to competition body mass.",
    requiredFields: ["exerciseName", "testType", "sex", "ageYears", "bodyMassKgAtTest", "rawUnequippedDrugTestedCompetition", "powerliftingWeightClass", ...exactSourceFields],
    sourcePopulationId: "van_den_hoek_2024_powerlifting:population",
    sourceProtocolId: "van_den_hoek_2024_powerlifting:protocol",
    sourceTestId: "van_den_hoek_2024_powerlifting:exact-test",
    sourceNormalizationId: "van_den_hoek_2024_powerlifting:normalization",
    sourceAccess: "authorized_not_ingested",
    auditRecordNumber: 1,
    numericReferenceStatus: "not_ingested",
    boundary: "It must not rate an ordinary gym lift, equipped lift, non-competition observation, or a regional muscle score.",
  },
  {
    id: "tomkinson_2025_adult_handgrip",
    label: "International adult handgrip reference",
    citationUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11863340/",
    referencePopulation: "Adults aged 20 years and older across 69 countries and regions.",
    scope: "Handgrip dynamometry only, subject to the exact source normalization and protocol rules.",
    requiredFields: ["testType", "sex", "ageYears", "laterality", "equipment", ...exactSourceFields],
    sourcePopulationId: "tomkinson_2025_adult_handgrip:population",
    sourceProtocolId: "tomkinson_2025_adult_handgrip:protocol",
    sourceTestId: "tomkinson_2025_adult_handgrip:exact-test",
    sourceNormalizationId: "tomkinson_2025_adult_handgrip:normalization",
    sourceAccess: "context_only",
    auditRecordNumber: 17,
    numericReferenceStatus: "not_ingested",
    boundary: "It must not rate barbell lifts, generic grip work, regional forearm force, health, or sport potential.",
  },
  {
    id: "strength_level_community_standards",
    label: "Strength Level community-lifter standards",
    citationUrl: "https://strengthlevel.com/strength-standards",
    referencePopulation: "Community-submitted lifter entries, as described by Strength Level.",
    scope: "Potential exercise-specific community-lifter comparison only after written authorization and versioned data access.",
    requiredFields: ["exerciseName", "testType", "sex", "ageYears", "bodyMassKgAtTest", ...exactSourceFields],
    sourcePopulationId: "strength_level_community_standards:population",
    sourceProtocolId: "strength_level_community_standards:protocol",
    sourceTestId: "strength_level_community_standards:exact-test",
    sourceNormalizationId: "strength_level_community_standards:normalization",
    sourceAccess: "blocked",
    numericReferenceStatus: "blocked_pending_license",
    boundary: "Strength Level terms prohibit automated or programmatic access without explicit written authorization; Sports Genome must not scrape, copy, or derive its tables.",
  },
  ...auditedStrengthReferenceGates,
] as const;

export function getStrengthReferenceCandidate(id: string) {
  return strengthReferenceCandidates.find((candidate) => candidate.id === id);
}

function missing(candidate: StrengthReferenceCandidate, input: StrengthReferenceMatchInput) {
  return candidate.requiredFields.filter((field) => input[field as keyof StrengthReferenceMatchInput] == null || input[field as keyof StrengthReferenceMatchInput] === "");
}

export function qualifyStrengthReference(candidateId: string, input: StrengthReferenceMatchInput): StrengthReferenceQualification | undefined {
  const candidate = getStrengthReferenceCandidate(candidateId);
  if (!candidate) return undefined;

  const missingFields = missing(candidate, input);
  if (missingFields.length) return { status: "needs_details", candidate, missingFields };
  if (candidate.sourcePopulationId !== input.sourcePopulationId) return { status: "not_eligible", candidate, missingFields: [], mismatchReason: "This observation does not confirm the source-specific reference population." };
  if (candidate.sourceProtocolId !== input.sourceProtocolId) return { status: "not_eligible", candidate, missingFields: [], mismatchReason: "This observation does not confirm the source-specific test protocol." };
  if (candidate.sourceTestId !== input.sourceTestId) return { status: "not_eligible", candidate, missingFields: [], mismatchReason: "This observation does not confirm an explicitly installed exact test identity." };
  if (candidate.sourceNormalizationId !== input.sourceNormalizationId) return { status: "not_eligible", candidate, missingFields: [], mismatchReason: "This observation does not confirm the source-specific normalization method." };
  if (candidate.expectedSport && input.sport !== candidate.expectedSport) return { status: "not_eligible", candidate, missingFields: [], mismatchReason: "This observation does not match the source-specific sport population." };
  if (candidate.sourceAccess === "context_only") return { status: "context_only_not_numeric", candidate, missingFields: [], mismatchReason: "This source is context only and cannot provide a numeric athlete reference." };
  if (candidate.sourceAccess === "blocked" || candidate.sourceAccess === "license_review_required" || candidate.numericReferenceStatus === "blocked_pending_license") return { status: "source_access_not_authorized", candidate, missingFields: [], mismatchReason: "This source requires a completed written authorization or license review before numeric use." };

  if (candidate.id === "piper_2021_preacher_curl_10rm" && (input.exerciseName !== "Preacher Curl" || input.testType !== "MULTI_REP" || input.repetitions !== 10 || input.sex !== "male" || (input.ageYears ?? 0) < 18 || (input.ageYears ?? 0) > 25)) return { status: "not_eligible", candidate, missingFields: [], mismatchReason: "This observation does not match the reviewed college-aged male preacher-curl 10RM scope." };

  if (candidate.id === "van_den_hoek_2024_powerlifting") {
    const supportedLift = ["Back Squat", "Bench Press", "Deadlift"].includes(input.exerciseName ?? "");
    if (!supportedLift || input.testType !== "MEASURED_1RM" || input.rawUnequippedDrugTestedCompetition !== true) return { status: "not_eligible", candidate, missingFields: [], mismatchReason: "This observation does not match drug-tested, unequipped competition-lift scope." };
  }

  if (candidate.id === "tomkinson_2025_adult_handgrip" && (input.testType !== "DYNAMOMETRY" || (input.ageYears ?? 0) < 20)) return { status: "not_eligible", candidate, missingFields: [], mismatchReason: "This observation does not match the adult handgrip reference scope." };
  return { status: "qualified_but_no_authorized_table", candidate, missingFields: [] };
}
