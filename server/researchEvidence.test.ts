import { describe, expect, it } from "vitest";
import {
  evidenceModelRules,
  evidenceSeedRecords,
} from "./researchEvidenceSeed";
import { getEvidenceImportPreview, optionalEvidenceText } from "./researchEvidence";

describe("verified Sportsgenome research evidence seed", () => {
  it("preserves all 100 unique PubMed study records", () => {
    expect(evidenceSeedRecords).toHaveLength(100);
    const pmids = evidenceSeedRecords.map(record => record.study.pmid);
    expect(new Set(pmids).size).toBe(100);
    expect(pmids).toContain("33009197");
    expect(pmids).toContain("22222322");
    expect(pmids).toContain("22344055");
  });

  it("preserves review-depth and recommendation safeguards", () => {
    const statuses = new Set(
      evidenceSeedRecords.map(record => record.study.reviewStatus)
    );
    expect(statuses).toEqual(
      new Set(["FULL_TEXT_VERIFIED", "ABSTRACT_VERIFIED", "RECORD_ONLY"])
    );
    const recordOnly = evidenceSeedRecords.filter(
      record => record.study.reviewStatus === "RECORD_ONLY"
    );
    expect(recordOnly).toHaveLength(1);
    expect(recordOnly[0]?.study.pmid).toBe("35165946");
    expect(recordOnly[0]?.note.implementationImplication).toMatch(
      /Do not use this source/i
    );
  });

  it("retains the non-negotiable reasoning rules with the generated import preview", () => {
    const preview = getEvidenceImportPreview();
    expect(preview).toEqual({
      totalStudies: 100,
      fullTextVerified: 24,
      abstractVerified: 75,
      recordOnly: 1,
      rules: 8,
    });
    expect(evidenceModelRules.map(rule => rule.ruleKey)).toContain(
      "activation_not_equivalent_to_adaptation"
    );
    expect(evidenceModelRules.map(rule => rule.ruleKey)).toContain(
      "fulltext_rule"
    );
  });

  it("represents absent optional outcomes as unavailable data rather than a blank placeholder", () => {
    expect(optionalEvidenceText("")).toBeNull();
    expect(optionalEvidenceText("   ")).toBeNull();
    expect(optionalEvidenceText("Muscle thickness and strength")).toBe("Muscle thickness and strength");
  });
});
