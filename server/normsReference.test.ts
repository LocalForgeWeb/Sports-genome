import { describe, expect, it } from "vitest";
import {
  percentileBandLabel,
  resolveNormsReference,
  type NormsAthleteContext,
  type NormsReferenceRow,
} from "../shared/normsReference";

function row(overrides: Partial<NormsReferenceRow> = {}): NormsReferenceRow {
  return {
    referenceKey: `ref-${overrides.percentile ?? 50}`,
    sourceRecordId: `src-${overrides.percentile ?? 50}`,
    sourceTable: "strength_norms",
    referenceFamily: "strength_norm",
    exerciseId: "exercise-back-squat",
    exerciseName: "Back Squat",
    localCatalogIds: [101],
    measurementType: "direct_relative_1rm_by_age_sex",
    unit: "x_bodyweight",
    sex: "male",
    ageMin: 18,
    ageMax: 35,
    bodyweightMinKg: null,
    bodyweightMaxKg: null,
    trainingStatus: "strength-trained competitive",
    equipment: null,
    protocol: "Competition 1RM/bodyweight percentile; exact age/sex/competition context required.",
    competitionConditions: "powerlifting; drug-tested unequipped competition",
    normalizationMethod: "direct_relative_1rm_by_age_sex",
    populationDefinition: "powerlifting; strength-trained competitive",
    percentile: 50,
    value: 2.28,
    sampleSize: 103984,
    sourceText: "Published age-by-sex decile from van den Hoek et al. 2024",
    sourceStudyId: "study-van-den-hoek",
    sourceUrl: "https://example.org/van-den-hoek-2024",
    boundary: "Competitive drug-tested unequipped powerlifting only.",
    ...overrides,
  };
}

/** The male 18-35 squat decile ladder, as the registry stores it. */
const squatDeciles = [
  [10, 1.75],
  [20, 1.93],
  [30, 2.06],
  [40, 2.17],
  [50, 2.28],
  [60, 2.38],
  [70, 2.5],
  [80, 2.63],
  [90, 2.83],
].map(([percentile, value]) => row({ percentile, value }));

const qualifiedLifter: NormsAthleteContext = {
  catalogExerciseId: 101,
  exerciseName: "Back Squat",
  sex: "male",
  ageYears: 27,
  bodyMassKg: 80,
  measuredOneRmKg: 200, // 2.5x bodyweight
  trainingStatus: "strength-trained competitive",
  confirmedContexts: ["powerlifting; drug-tested unequipped competition"],
};

describe("resolveNormsReference", () => {
  it("reports the band a qualified observation falls in", () => {
    const result = resolveNormsReference(squatDeciles, qualifiedLifter);
    expect(result.status).toBe("matched");
    if (result.status !== "matched") return;
    expect(result.observedValue).toBeCloseTo(2.5, 5);
    expect(result.percentileBandLabel).toBe("70th percentile");
    expect(result.unit).toBe("x_bodyweight");
    expect(result.cutPoints).toHaveLength(9);
    expect(result.sampleSize).toBe(103984);
  });

  it("names the interval when the lift falls between two reported cut points", () => {
    // 176 kg at 80 kg body mass is 2.20x, between the reported 40th (2.17) and 50th (2.28).
    const result = resolveNormsReference(squatDeciles, { ...qualifiedLifter, measuredOneRmKg: 176 });
    expect(result.status).toBe("matched");
    if (result.status !== "matched") return;
    expect(result.observedValue).toBeCloseTo(2.2, 5);
    expect(result.percentileBandLabel).toBe("40th-50th percentile");
  });

  it("reports beyond the table's edges rather than extrapolating", () => {
    const weak = resolveNormsReference(squatDeciles, { ...qualifiedLifter, measuredOneRmKg: 100 });
    const strong = resolveNormsReference(squatDeciles, { ...qualifiedLifter, measuredOneRmKg: 300 });
    expect(weak.status === "matched" && weak.percentileBandLabel).toBe("Below the 10th percentile");
    expect(strong.status === "matched" && strong.percentileBandLabel).toBe("Above the 90th percentile");
  });

  it("withholds a rank when the athlete has not confirmed the competition population", () => {
    const result = resolveNormsReference(squatDeciles, { ...qualifiedLifter, confirmedContexts: [] });
    expect(result).toMatchObject({
      status: "unavailable",
      reason: "competition_context_confirmation_required",
      candidateCount: 9,
    });
  });

  it("withholds a rank when the training status does not match the source population", () => {
    const result = resolveNormsReference(squatDeciles, { ...qualifiedLifter, trainingStatus: "recreational" });
    expect(result).toMatchObject({ status: "unavailable", reason: "training_status_mismatch" });
  });

  it("withholds a rank outside the reported age band", () => {
    const result = resolveNormsReference(squatDeciles, { ...qualifiedLifter, ageYears: 44 });
    expect(result).toMatchObject({ status: "unavailable", reason: "age_not_in_reference" });
  });

  it("asks for age rather than comparing against an unmatched band", () => {
    const result = resolveNormsReference(squatDeciles, { ...qualifiedLifter, ageYears: null });
    expect(result).toMatchObject({ status: "unavailable", reason: "age_required" });
  });

  it("withholds a rank for a sex the reference does not report", () => {
    const result = resolveNormsReference(squatDeciles, { ...qualifiedLifter, sex: "female" });
    expect(result).toMatchObject({ status: "unavailable", reason: "sex_not_in_reference" });
  });

  it("asks for a comparison sex when the profile has not declared one", () => {
    const result = resolveNormsReference(squatDeciles, { ...qualifiedLifter, sex: null });
    expect(result).toMatchObject({ status: "unavailable", reason: "comparison_sex_required" });
  });

  it("requires body mass before a relative-strength reference can be used", () => {
    const result = resolveNormsReference(squatDeciles, { ...qualifiedLifter, bodyMassKg: null });
    expect(result).toMatchObject({ status: "unavailable", reason: "body_mass_required" });
  });

  it("never substitutes an estimated maximum for the measured one a 1RM source reports", () => {
    const result = resolveNormsReference(squatDeciles, { ...qualifiedLifter, measuredOneRmKg: null, loadKg: 180, repetitions: 3 });
    expect(result).toMatchObject({ status: "unavailable", reason: "measured_maximum_required" });
  });

  it("does not rank an exercise the registry has no approved reference for", () => {
    const result = resolveNormsReference(squatDeciles, {
      ...qualifiedLifter,
      catalogExerciseId: 999,
      exerciseName: "Landmine Press",
    });
    expect(result).toMatchObject({ status: "unavailable", reason: "no_reference_for_exercise", candidateCount: 0 });
  });

  it("matches on catalog identity even when the saved name differs from the canonical one", () => {
    const result = resolveNormsReference(squatDeciles, { ...qualifiedLifter, exerciseName: "back squat (high bar)" });
    expect(result.status).toBe("matched");
  });

  it("does not fuzzy-match a near name onto a reference", () => {
    const result = resolveNormsReference(squatDeciles, {
      ...qualifiedLifter,
      catalogExerciseId: null,
      exerciseName: "Front Squat",
    });
    expect(result).toMatchObject({ status: "unavailable", reason: "no_reference_for_exercise" });
  });

  describe("repetition-maximum references", () => {
    const preacherCurlBand = [
      [10, 40],
      [50, 55],
      [90, 70],
    ].map(([percentile, value]) =>
      row({
        percentile,
        value,
        exerciseId: "exercise-preacher-curl",
        exerciseName: "Preacher Curl",
        localCatalogIds: [202],
        measurementType: "direct_10rm_percentile_pretraining",
        unit: "lb",
        ageMin: 18,
        ageMax: 25,
        trainingStatus: "novice-to-intermediate; pre-training",
        competitionConditions: "",
        bodyweightMinKg: 61.235,
        bodyweightMaxKg: 68.039,
        sourceStudyId: "study-piper",
      })
    );

    const novice: NormsAthleteContext = {
      catalogExerciseId: 202,
      exerciseName: "Preacher Curl",
      sex: "male",
      ageYears: 20,
      bodyMassKg: 65,
      loadKg: 24.9476, // 55 lb
      repetitions: 10,
      trainingStatus: "novice-to-intermediate; pre-training",
    };

    it("converts the recorded kilogram load into the reference's reported unit", () => {
      const result = resolveNormsReference(preacherCurlBand, novice);
      expect(result.status).toBe("matched");
      if (result.status !== "matched") return;
      expect(result.observedValue).toBeCloseTo(55, 2);
      expect(result.unit).toBe("lb");
      expect(result.percentileBandLabel).toBe("50th percentile");
    });

    it("requires the exact repetition count the source measured", () => {
      const result = resolveNormsReference(preacherCurlBand, { ...novice, repetitions: 8 });
      expect(result).toMatchObject({ status: "unavailable", reason: "repetition_count_mismatch" });
    });

    it("places an athlete on a shared band boundary in exactly one table", () => {
      // The published bands convert to a contiguous kg ladder whose neighbours share
      // a boundary (61.235 tops one band and floors the next). Inclusive-both-ends
      // matching would put this athlete in two tables and refuse to rank either.
      const neighbouring = [
        ...preacherCurlBand,
        ...preacherCurlBand.map(reference =>
          row({
            ...reference,
            referenceKey: `lighter-${reference.percentile}`,
            bodyweightMinKg: null,
            bodyweightMaxKg: 61.235,
          })
        ),
      ];
      const onBoundary = resolveNormsReference(neighbouring, { ...novice, bodyMassKg: 61.235 });
      expect(onBoundary.status).toBe("matched");
      if (onBoundary.status !== "matched") return;
      // 61.235 kg is the top of the lighter band, not the bottom of the heavier one.
      expect(onBoundary.referenceKey).toMatch(/^lighter-/);

      const justAbove = resolveNormsReference(neighbouring, { ...novice, bodyMassKg: 61.3 });
      expect(justAbove.status).toBe("matched");
      if (justAbove.status !== "matched") return;
      expect(justAbove.referenceKey).not.toMatch(/^lighter-/);
    });

    it("withholds a rank outside the source's body-mass band", () => {
      const result = resolveNormsReference(preacherCurlBand, { ...novice, bodyMassKg: 95 });
      expect(result).toMatchObject({ status: "unavailable", reason: "body_mass_not_in_reference_band" });
    });
  });

  it("declines a protocol whose measurement family it cannot interpret", () => {
    const unsupported = [row({ measurementType: "bodyweight_repetition_max", unit: "reps" })];
    const result = resolveNormsReference(unsupported, qualifiedLifter);
    expect(result).toMatchObject({ status: "unavailable", reason: "unsupported_measurement_protocol" });
  });

  it("refuses to pool two different published tables into one ladder", () => {
    // Same exercise and athlete context, two distinct source studies. Blending them
    // would invent a cut point neither source reported.
    const overlapping = [
      ...squatDeciles,
      row({ percentile: 50, value: 2.0, sourceStudyId: "study-other", referenceKey: "other-50" }),
    ];
    const result = resolveNormsReference(overlapping, qualifiedLifter);
    expect(result).toMatchObject({ status: "unavailable", reason: "ambiguous_reference_match" });
  });
});

describe("percentileBandLabel", () => {
  const ladder = [
    { percentile: 10, value: 1 },
    { percentile: 50, value: 2 },
    { percentile: 90, value: 3 },
  ];

  it("reports an exact cut point without inventing precision around it", () => {
    expect(percentileBandLabel(2, ladder)).toBe("50th percentile");
  });

  it("is insensitive to the order rows arrive in", () => {
    expect(percentileBandLabel(1.5, [...ladder].reverse())).toBe("10th-50th percentile");
  });
});
