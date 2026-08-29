import { describe, expect, it } from "vitest";
import { canPromoteStudy, citationFingerprint, normalizeDoi, normalizedSourceUrl, validateStudyCandidate } from "@shared/ingestionGovernance";

const approvedCandidate = {
  title: "Example training study",
  sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/12345/?utm_source=test#details",
  doi: "https://doi.org/10.1000/Example.DOI",
  publicationYear: 2021,
  sourceText: "Methods: measured 10RM under the specified protocol.",
  screeningDecision: "approve" as const,
  relevanceScore: 90,
  methodologicalQualityScore: 80,
  populationRelevanceScore: 85,
  measurementReliabilityScore: 90,
  specificityScore: 85,
  extractionConfidenceScore: 95,
};

describe("ingestion governance", () => {
  it("normalizes external identities before duplicate checks", () => {
    expect(normalizeDoi(" DOI:10.1000/Example.DOI ")).toBe("10.1000/example.doi");
    expect(normalizedSourceUrl(approvedCandidate.sourceUrl)).toBe("https://pubmed.ncbi.nlm.nih.gov/12345?utm_source=test");
    expect(citationFingerprint(approvedCandidate)).toBe("doi:10.1000/example.doi");
  });

  it("requires provenance, an explicit decision, and complete approved-candidate scores", () => {
    expect(validateStudyCandidate({ ...approvedCandidate, sourceText: "", relevanceScore: null }).map(error => error.code)).toEqual(expect.arrayContaining(["source_text_missing", "score_missing"]));
    expect(canPromoteStudy(approvedCandidate, false)).toBe(true);
    expect(canPromoteStudy(approvedCandidate, true)).toBe(false);
  });
});
