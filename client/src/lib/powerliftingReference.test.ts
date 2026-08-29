import { describe, expect, it } from "vitest";
import { getVanDenHoek2024PowerliftingReference } from "./powerliftingReference";

describe("van den Hoek 2024 powerlifting reference", () => {
  const eligibleBenchContext = {
    exerciseName: "Barbell Bench Press",
    measurementType: "MEASURED_1RM",
    loadKg: 124.8,
    bodyMassKgAtTest: 80,
    declaration: {
      sex: "male" as const,
      ageYears: 24,
      drugTestedCompetitionConfirmed: true,
      unequippedCompetitionConfirmed: true,
      maximumSuccessfulLiftConfirmed: true,
    },
  };

  it("returns the reported 50th-percentile cut point for an exact eligible male 18–35 bench result", () => {
    const result = getVanDenHoek2024PowerliftingReference(eligibleBenchContext);
    expect(result).toMatchObject({
      status: "matched",
      lift: "Bench press",
      relativeStrength: 1.56,
      percentileBandLabel: "50th percentile cut point",
      sourceLabel: "van den Hoek et al. 2024 · drug-tested, unequipped powerlifting competitors · males 18–35",
    });
  });

  it("uses a reported decile band rather than inventing an interpolated percentile between cut points", () => {
    const result = getVanDenHoek2024PowerliftingReference({ ...eligibleBenchContext, loadKg: 128, bodyMassKgAtTest: 80 });
    expect(result).toMatchObject({ status: "matched", relativeStrength: 1.6, percentileBandLabel: "50th–60th percentile band" });
  });

  it("keeps ordinary, noncompetition and mismatched tests unavailable", () => {
    expect(getVanDenHoek2024PowerliftingReference({ ...eligibleBenchContext, declaration: { ...eligibleBenchContext.declaration, drugTestedCompetitionConfirmed: false } })).toMatchObject({ status: "unavailable", reason: "competition_context_required" });
    expect(getVanDenHoek2024PowerliftingReference({ ...eligibleBenchContext, exerciseName: "Incline Barbell Bench Press" })).toMatchObject({ status: "unavailable", reason: "exercise_not_in_reference" });
    expect(getVanDenHoek2024PowerliftingReference({ ...eligibleBenchContext, measurementType: "MULTI_REP" })).toMatchObject({ status: "unavailable", reason: "maximum_lift_required" });
  });
});
