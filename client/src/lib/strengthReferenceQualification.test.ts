import { describe, expect, it } from "vitest";
import { qualifyStrengthReference, strengthReferenceCandidates } from "../../../shared/strengthReferenceQualification";

describe("Strength reference qualification", () => {
  it("keeps every candidate source scoped and table-free until authorized numeric data is separately introduced", () => {
    expect(strengthReferenceCandidates.length).toBeGreaterThanOrEqual(40);
    strengthReferenceCandidates.forEach((candidate) => {
      expect(candidate.citationUrl).toMatch(/^https:\/\//);
      expect(candidate.requiredFields.length).toBeGreaterThan(2);
      expect(candidate.boundary.length).toBeGreaterThan(45);
      expect(candidate.numericReferenceStatus).not.toBe("ingested");
      expect(candidate.sourcePopulationId).toBe(`${candidate.id}:population`);
      expect(candidate.sourceProtocolId).toBe(`${candidate.id}:protocol`);
      expect(candidate.sourceTestId).toBe(`${candidate.id}:exact-test`);
      expect(candidate.sourceNormalizationId).toBe(`${candidate.id}:normalization`);
      expect(candidate.sourceAccess).toBeTruthy();
    });
    const auditedOrdinals = strengthReferenceCandidates.flatMap((candidate) => candidate.auditRecordNumber == null ? [] : [candidate.auditRecordNumber]).sort((a, b) => a - b);
    expect(auditedOrdinals).toEqual(Array.from({ length: 40 }, (_, index) => index + 1));
  });

  it("withholds the preacher-curl reference until all demographic, load-context, and 10RM conditions match", () => {
    const pending = qualifyStrengthReference("piper_2021_preacher_curl_10rm", { exerciseName: "Preacher Curl", testType: "MULTI_REP", repetitions: 10 });
    expect(pending?.status).toBe("needs_details");
    expect(pending?.missingFields).toContain("sex");

    const mismatch = qualifyStrengthReference("piper_2021_preacher_curl_10rm", { exerciseName: "Machine Preacher Curl", testType: "MULTI_REP", repetitions: 10, sex: "male", ageYears: 21, bodyMassKgAtTest: 80, equipment: "preacher bench", sourcePopulationId: "piper_2021_preacher_curl_10rm:population", sourceProtocolId: "piper_2021_preacher_curl_10rm:protocol", sourceTestId: "piper_2021_preacher_curl_10rm:exact-test", sourceNormalizationId: "piper_2021_preacher_curl_10rm:normalization" });
    expect(mismatch?.status).toBe("not_eligible");
    expect(mismatch?.mismatchReason).toContain("preacher-curl 10RM scope");
  });

  it("blocks Strength Level table use until written source authorization exists", () => {
    const result = qualifyStrengthReference("strength_level_community_standards", { exerciseName: "Bench Press", testType: "MEASURED_1RM", sex: "male", ageYears: 25, bodyMassKgAtTest: 80, sourcePopulationId: "strength_level_community_standards:population", sourceProtocolId: "strength_level_community_standards:protocol", sourceTestId: "strength_level_community_standards:exact-test", sourceNormalizationId: "strength_level_community_standards:normalization" });
    expect(result?.status).toBe("source_access_not_authorized");
    expect(result?.mismatchReason).toContain("written authorization");
  });

  it("requires every separately audited source to confirm its own population and protocol rather than falling back to a broad youth or sport bucket", () => {
    const missingSourceContext = qualifyStrengthReference("fitback_2023_european_youth", { exerciseName: "Handgrip", testType: "DYNAMOMETRY", sex: "female", ageYears: 13, equipment: "TKK 5101", laterality: "right" });
    expect(missingSourceContext?.status).toBe("needs_details");
    expect(missingSourceContext?.missingFields).toEqual(expect.arrayContaining(["sourcePopulationId", "sourceProtocolId"]));

    const wrongProtocol = qualifyStrengthReference("fitback_2023_european_youth", { exerciseName: "Handgrip", testType: "DYNAMOMETRY", sex: "female", ageYears: 13, equipment: "TKK 5101", laterality: "right", sourcePopulationId: "fitback_2023_european_youth:population", sourceProtocolId: "other:protocol", sourceTestId: "fitback_2023_european_youth:exact-test", sourceNormalizationId: "fitback_2023_european_youth:normalization" });
    expect(wrongProtocol?.status).toBe("not_eligible");
    expect(wrongProtocol?.mismatchReason).toContain("source-specific test protocol");

    const review = qualifyStrengthReference("isokinetic_strength_review_2022", { exerciseName: "Knee extension", testType: "ISOMETRIC", sex: "male", ageYears: 30, equipment: "dynamometer", laterality: "right", jointAngle: "60 degrees", contractionMode: "isometric", sourcePopulationId: "isokinetic_strength_review_2022:population", sourceProtocolId: "isokinetic_strength_review_2022:protocol", sourceTestId: "isokinetic_strength_review_2022:exact-test", sourceNormalizationId: "isokinetic_strength_review_2022:normalization" });
    expect(review?.status).toBe("context_only_not_numeric");
    expect(review?.candidate.boundary).toContain("cannot supply a single percentile");
  });

  it("does not treat a generic exercise name as a source-installed test identity", () => {
    const result = qualifyStrengthReference("piper_2021_preacher_curl_10rm", { exerciseName: "Preacher Curl", testType: "MULTI_REP", repetitions: 10, sex: "male", ageYears: 21, bodyMassKgAtTest: 80, equipment: "preacher bench", sourcePopulationId: "piper_2021_preacher_curl_10rm:population", sourceProtocolId: "piper_2021_preacher_curl_10rm:protocol", sourceTestId: "generic-curl", sourceNormalizationId: "piper_2021_preacher_curl_10rm:normalization" });
    expect(result?.status).toBe("not_eligible");
    expect(result?.mismatchReason).toContain("exact test identity");
  });

  it("keeps sport-specific and competition-only records unavailable when their own scope does not match", () => {
    const wrongSport = qualifyStrengthReference("campos_2026_elite_judo", { exerciseName: "Bench Press", testType: "MEASURED_1RM", sex: "female", ageYears: 23, bodyMassKgAtTest: 63, competitiveLevel: "international", weightCategory: "-63 kg", sport: "tennis", sourcePopulationId: "campos_2026_elite_judo:population", sourceProtocolId: "campos_2026_elite_judo:protocol", sourceTestId: "campos_2026_elite_judo:exact-test", sourceNormalizationId: "campos_2026_elite_judo:normalization" });
    expect(wrongSport?.status).toBe("not_eligible");
    expect(wrongSport?.mismatchReason).toContain("sport population");

    const nonCompetition = qualifyStrengthReference("van_den_hoek_2024_powerlifting", { exerciseName: "Bench Press", testType: "MEASURED_1RM", sex: "male", ageYears: 26, bodyMassKgAtTest: 91, rawUnequippedDrugTestedCompetition: false, powerliftingWeightClass: "93 kg", sourcePopulationId: "van_den_hoek_2024_powerlifting:population", sourceProtocolId: "van_den_hoek_2024_powerlifting:protocol", sourceTestId: "van_den_hoek_2024_powerlifting:exact-test", sourceNormalizationId: "van_den_hoek_2024_powerlifting:normalization" });
    expect(nonCompetition?.status).toBe("not_eligible");
    expect(nonCompetition?.mismatchReason).toContain("drug-tested, unequipped competition-lift scope");
  });
});
