import { describe, expect, it } from "vitest";
import { getStrengthReferencePresentation, getStrengthReferencePresentationForCandidate } from "../../../shared/strengthReferencePresentation";

describe("athlete-facing Strength reference presentation", () => {
  it("does not turn a generic catalog test into a population result", () => {
    const result = getStrengthReferencePresentation({ exerciseName: "Machine Preacher Curl", testType: "MULTI_REP", repetitions: 10, bodyMassKgAtTest: 80, equipment: "machine" });
    expect(result.title).toBe("Population reference unavailable.");
    expect(result.message).toContain("No reviewed reference is installed");
    expect(result.message).toContain("No percentile, rank, tier, or general benchmark is shown");
  });

  it("surfaces an exact candidate as incomplete until its source-specific gates are actually documented", () => {
    const result = getStrengthReferencePresentation({ exerciseName: "Preacher Curl", testType: "MULTI_REP", repetitions: 10, bodyMassKgAtTest: 80, equipment: "preacher bench" });
    expect(result.message).toContain("still needs documented");
    expect(result.message).toContain("sourcePopulationId");
    expect(result.sourceUrl).toContain("10.47206");
  });

  it("keeps a context-only source unavailable even when its visible test fields are supplied", () => {
    const result = getStrengthReferencePresentation({ exerciseName: "Handgrip", testType: "DYNAMOMETRY", sex: "female", ageYears: 25, laterality: "right", equipment: "dynamometer", sourcePopulationId: "tomkinson_2025_adult_handgrip:population", sourceProtocolId: "tomkinson_2025_adult_handgrip:protocol", sourceTestId: "tomkinson_2025_adult_handgrip:exact-test", sourceNormalizationId: "tomkinson_2025_adult_handgrip:normalization" });
    expect(result.message).toContain("context only");
    expect(result.message).toContain("No percentile, rank, tier, or general benchmark is shown");
  });

  it("keeps representative youth, sport, competition, context-only, and license-review source categories unavailable in the same athlete-facing language", () => {
    const base = { exerciseName: "Handgrip", testType: "DYNAMOMETRY" as const, sex: "female" as const, ageYears: 16, equipment: "dynamometer", laterality: "right" as const };
    const cases = [
      getStrengthReferencePresentationForCandidate("fitback_2023_european_youth", base),
      getStrengthReferencePresentationForCandidate("campos_2026_elite_judo", { ...base, sourcePopulationId: "campos_2026_elite_judo:population", sourceProtocolId: "campos_2026_elite_judo:protocol", sourceTestId: "campos_2026_elite_judo:exact-test", sourceNormalizationId: "campos_2026_elite_judo:normalization", sport: "tennis", competitiveLevel: "international", weightCategory: "-63 kg", bodyMassKgAtTest: 63 }),
      getStrengthReferencePresentationForCandidate("van_den_hoek_2024_powerlifting", { ...base, exerciseName: "Bench Press", testType: "MEASURED_1RM", ageYears: 24, bodyMassKgAtTest: 75, rawUnequippedDrugTestedCompetition: false, powerliftingWeightClass: "76 kg", sourcePopulationId: "van_den_hoek_2024_powerlifting:population", sourceProtocolId: "van_den_hoek_2024_powerlifting:protocol", sourceTestId: "van_den_hoek_2024_powerlifting:exact-test", sourceNormalizationId: "van_den_hoek_2024_powerlifting:normalization" }),
      getStrengthReferencePresentationForCandidate("isokinetic_strength_review_2022", { ...base, exerciseName: "Knee extension", testType: "ISOMETRIC", ageYears: 24, jointAngle: "60", contractionMode: "isometric", sourcePopulationId: "isokinetic_strength_review_2022:population", sourceProtocolId: "isokinetic_strength_review_2022:protocol", sourceTestId: "isokinetic_strength_review_2022:exact-test", sourceNormalizationId: "isokinetic_strength_review_2022:normalization" }),
      getStrengthReferencePresentationForCandidate("strength_level_community_standards", { ...base, exerciseName: "Bench Press", testType: "MEASURED_1RM", ageYears: 24, bodyMassKgAtTest: 75, sourcePopulationId: "strength_level_community_standards:population", sourceProtocolId: "strength_level_community_standards:protocol", sourceTestId: "strength_level_community_standards:exact-test", sourceNormalizationId: "strength_level_community_standards:normalization" }),
    ];
    cases.forEach((result) => {
      expect(result.title).toBe("Population reference unavailable.");
      expect(result.message).toContain("No percentile, rank, tier, or general benchmark is shown");
    });
    expect(cases[3].message).toContain("context only");
    expect(cases[4].message).toContain("authorization or license review");
  });
});
