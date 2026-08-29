export type ScreeningDecision = "approve" | "review" | "reject";

export type StudyCandidateForValidation = {
  title?: string | null;
  sourceUrl?: string | null;
  doi?: string | null;
  pmid?: string | null;
  publicationYear?: number | null;
  sourceText?: string | null;
  screeningDecision?: ScreeningDecision | null;
  relevanceScore?: number | null;
  methodologicalQualityScore?: number | null;
  populationRelevanceScore?: number | null;
  measurementReliabilityScore?: number | null;
  specificityScore?: number | null;
  extractionConfidenceScore?: number | null;
};

export type IngestionValidationError = {
  code: string;
  message: string;
  severity: "warning" | "error";
};

function normalized(value: string | null | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

export function normalizeDoi(doi: string | null | undefined) {
  return normalized(doi).replace(/^https?:\/\/(dx\.)?doi\.org\//, "").replace(/^doi:/, "");
}

export function normalizedSourceUrl(sourceUrl: string | null | undefined) {
  try {
    const parsed = new URL((sourceUrl ?? "").trim());
    parsed.hash = "";
    parsed.searchParams.sort();
    parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

export function citationFingerprint(candidate: Pick<StudyCandidateForValidation, "doi" | "pmid" | "title" | "publicationYear">) {
  const doi = normalizeDoi(candidate.doi);
  if (doi) return `doi:${doi}`;
  const pmid = normalized(candidate.pmid);
  if (pmid) return `pmid:${pmid}`;
  return `title:${normalized(candidate.title)}|year:${candidate.publicationYear ?? "unknown"}`;
}

function scoreError(label: string, value: number | null | undefined): IngestionValidationError | null {
  if (value == null) return { code: "score_missing", message: `${label} is required for an approved candidate.`, severity: "error" };
  if (!Number.isFinite(value) || value < 0 || value > 100) return { code: "score_out_of_range", message: `${label} must be between 0 and 100.`, severity: "error" };
  return null;
}

export function validateStudyCandidate(candidate: StudyCandidateForValidation): IngestionValidationError[] {
  const errors: IngestionValidationError[] = [];
  if (!normalized(candidate.title)) errors.push({ code: "title_missing", message: "Study title is required.", severity: "error" });
  if (!normalizedSourceUrl(candidate.sourceUrl)) errors.push({ code: "source_url_invalid", message: "A valid source URL is required.", severity: "error" });
  if (candidate.publicationYear != null && (!Number.isInteger(candidate.publicationYear) || candidate.publicationYear < 1800 || candidate.publicationYear > 2200)) {
    errors.push({ code: "publication_year_invalid", message: "Publication year must be an integer between 1800 and 2200.", severity: "error" });
  }
  if (!candidate.screeningDecision) errors.push({ code: "screening_decision_missing", message: "Screening decision is required.", severity: "error" });
  if (candidate.screeningDecision === "approve") {
    if (!normalized(candidate.sourceText)) errors.push({ code: "source_text_missing", message: "Approved candidates require a retained source excerpt.", severity: "error" });
    for (const [label, value] of Object.entries({ relevanceScore: candidate.relevanceScore, methodologicalQualityScore: candidate.methodologicalQualityScore, populationRelevanceScore: candidate.populationRelevanceScore, measurementReliabilityScore: candidate.measurementReliabilityScore, specificityScore: candidate.specificityScore, extractionConfidenceScore: candidate.extractionConfidenceScore })) {
      const error = scoreError(label, value);
      if (error) errors.push(error);
    }
  }
  return errors;
}

export function canPromoteStudy(candidate: StudyCandidateForValidation, duplicateExists: boolean) {
  return candidate.screeningDecision === "approve" && !duplicateExists && validateStudyCandidate(candidate).every(error => error.severity !== "error");
}
