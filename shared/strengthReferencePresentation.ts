import { qualifyStrengthReference, type StrengthReferenceMatchInput } from "./strengthReferenceQualification";

export type ReferenceObservationInput = Pick<StrengthReferenceMatchInput, "exerciseName" | "testType" | "repetitions" | "bodyMassKgAtTest" | "equipment" | "sex" | "ageYears" | "laterality" | "rawUnequippedDrugTestedCompetition" | "powerliftingWeightClass" | "sourcePopulationId" | "sourceProtocolId" | "sourceTestId" | "sourceNormalizationId" | "sport">;

export const candidateForObservation = (observation: ReferenceObservationInput) => {
  if (observation.exerciseName === "Preacher Curl" && observation.testType === "MULTI_REP") return "piper_2021_preacher_curl_10rm";
  if (["Back Squat", "Bench Press", "Deadlift"].includes(observation.exerciseName ?? "") && observation.testType === "MEASURED_1RM") return "van_den_hoek_2024_powerlifting";
  if (observation.exerciseName?.toLowerCase().includes("handgrip") && observation.testType === "DYNAMOMETRY") return "tomkinson_2025_adult_handgrip";
  return undefined;
};

export type StrengthReferencePresentation = {
  title: string;
  message: string;
  sourceUrl?: string;
};

/** Maps source qualification state to one athlete-facing, no-score message. */
export function getStrengthReferencePresentationForCandidate(candidateId: string | undefined, observation: ReferenceObservationInput): StrengthReferencePresentation {
  if (!candidateId) return { title: "Population reference unavailable.", message: "No reviewed reference is installed for this exact test. No percentile, rank, tier, or general benchmark is shown." };
  const qualification = qualifyStrengthReference(candidateId, observation);
  if (!qualification) return { title: "Population reference unavailable.", message: "No reviewed reference is installed for this exact test. No percentile, rank, tier, or general benchmark is shown." };
  if (qualification.status === "needs_details") return { title: "Population reference unavailable.", message: `This possible source match still needs documented ${qualification.missingFields.join(", ")}. No percentile, rank, tier, or general benchmark is shown.`, sourceUrl: qualification.candidate.citationUrl };
  if (qualification.status === "source_access_not_authorized") return { title: "Population reference unavailable.", message: "The source requires completed authorization or license review before numeric use. No percentile, rank, tier, or general benchmark is shown.", sourceUrl: qualification.candidate.citationUrl };
  if (qualification.status === "context_only_not_numeric") return { title: "Population reference unavailable.", message: "This source is retained as context only, not as a numeric athlete reference. No percentile, rank, tier, or general benchmark is shown.", sourceUrl: qualification.candidate.citationUrl };
  if (qualification.status === "not_eligible") return { title: "Population reference unavailable.", message: `${qualification.mismatchReason} No percentile, rank, tier, or general benchmark is shown.`, sourceUrl: qualification.candidate.citationUrl };
  return { title: "Population reference unavailable.", message: "The source scope is recorded, but an authorized verified numeric table has not been installed. No percentile, rank, tier, or general benchmark is shown.", sourceUrl: qualification.candidate.citationUrl };
}

export function getStrengthReferencePresentation(observation: ReferenceObservationInput): StrengthReferencePresentation {
  return getStrengthReferencePresentationForCandidate(candidateForObservation(observation), observation);
}
