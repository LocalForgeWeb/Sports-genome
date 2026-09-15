import { describe, expect, it } from "vitest";
import type { NormsReferenceRow } from "../shared/normsReference";
import { ageYearsAt, buildAthleteContext, resolveObservations, summarizeOverviewWithReferences } from "./normsResolution";

type Observation = Parameters<typeof buildAthleteContext>[0];

/** Mirrors a saved row: decimals arrive from the driver as strings. */
function observation(overrides: Partial<Record<string, unknown>> = {}): Observation {
  return {
    id: 1,
    catalogExerciseId: 101,
    exerciseName: "Back Squat",
    observedAt: new Date("2026-06-01T00:00:00Z"),
    measurementType: "MEASURED_1RM",
    loadKg: null,
    repetitions: null,
    measuredOneRmKg: "200.00",
    bodyMassKgAtTest: "80.00",
    referenceContextJson: JSON.stringify({
      referenceId: "van_den_hoek_2024_powerlifting_relative_strength",
      drugTestedCompetitionConfirmed: true,
      unequippedCompetitionConfirmed: true,
      maximumSuccessfulLiftConfirmed: true,
    }),
    ...overrides,
  } as unknown as Observation;
}

const profile = { dateOfBirth: new Date("1999-01-15T00:00:00Z"), sexForReference: "male" };

const squatDeciles: NormsReferenceRow[] = [
  [10, 1.75],
  [50, 2.28],
  [90, 2.83],
].map(([percentile, value]) => ({
  referenceKey: `ref-${percentile}`,
  sourceRecordId: `src-${percentile}`,
  sourceTable: "strength_norms",
  referenceFamily: "strength_norm",
  exerciseId: "exercise-1",
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
  protocol: "Competition 1RM/bodyweight percentile.",
  competitionConditions: "powerlifting; drug-tested unequipped competition",
  normalizationMethod: "direct_relative_1rm_by_age_sex",
  populationDefinition: "powerlifting; strength-trained competitive",
  percentile,
  value,
  sampleSize: 103984,
  sourceText: "van den Hoek et al. 2024",
  sourceStudyId: "study-1",
  sourceUrl: "https://example.org/study-1",
  boundary: "Competitive drug-tested unequipped powerlifting only.",
}));

describe("ageYearsAt", () => {
  it("counts whole years completed at the test date, not today", () => {
    expect(ageYearsAt(new Date("1999-01-15T00:00:00Z"), new Date("2026-06-01T00:00:00Z"))).toBe(27);
  });

  it("does not round a birthday up before it has occurred", () => {
    expect(ageYearsAt(new Date("1999-07-15T00:00:00Z"), new Date("2026-06-01T00:00:00Z"))).toBe(26);
    expect(ageYearsAt(new Date("1999-06-02T00:00:00Z"), new Date("2026-06-01T00:00:00Z"))).toBe(26);
    expect(ageYearsAt(new Date("1999-06-01T00:00:00Z"), new Date("2026-06-01T00:00:00Z"))).toBe(27);
  });

  it("returns null rather than a nonsense age", () => {
    expect(ageYearsAt(null, new Date("2026-06-01T00:00:00Z"))).toBeNull();
    expect(ageYearsAt(new Date("invalid"), new Date("2026-06-01T00:00:00Z"))).toBeNull();
    expect(ageYearsAt(new Date("2030-01-01T00:00:00Z"), new Date("2026-06-01T00:00:00Z"))).toBeNull();
  });
});

describe("buildAthleteContext", () => {
  it("reads the saved decimals and declaration into one matching context", () => {
    expect(buildAthleteContext(observation(), profile)).toEqual({
      catalogExerciseId: 101,
      exerciseName: "Back Squat",
      sex: "male",
      ageYears: 27,
      bodyMassKg: 80,
      measuredOneRmKg: 200,
      loadKg: null,
      repetitions: null,
      trainingStatus: "strength-trained competitive",
      confirmedContexts: ["powerlifting; drug-tested unequipped competition"],
    });
  });

  it("does not map an intersex or unspecified profile onto a male or female population", () => {
    for (const sexForReference of ["intersex", "unspecified"]) {
      expect(buildAthleteContext(observation(), { ...profile, sexForReference }).sex).toBeNull();
    }
  });

  it("leaves the population undeclared when no profile exists", () => {
    const context = buildAthleteContext(observation(), null);
    expect(context.sex).toBeNull();
    expect(context.ageYears).toBeNull();
  });
});

describe("resolveObservations", () => {
  it("returns a source-bounded band for a qualified observation", () => {
    const [result] = resolveObservations([observation()], profile, squatDeciles);
    expect(result.observationId).toBe(1);
    expect(result.resolution).toMatchObject({
      status: "matched",
      percentileBandLabel: "50th-90th percentile",
      unit: "x_bodyweight",
    });
  });

  it("reports registry_unavailable rather than falling back to an ungated comparison", () => {
    const [result] = resolveObservations([observation()], profile, []);
    expect(result.resolution).toEqual({
      status: "unavailable",
      reason: "registry_unavailable",
      candidateCount: 0,
    });
  });

  it("withholds a rank when the athlete never confirmed the source population", () => {
    const [result] = resolveObservations(
      [observation({ referenceContextJson: null })],
      profile,
      squatDeciles
    );
    expect(result.resolution).toMatchObject({
      status: "unavailable",
      reason: "competition_context_confirmation_required",
    });
  });

  it("resolves each observation independently", () => {
    const results = resolveObservations(
      [observation(), observation({ id: 2, exerciseName: "Landmine Press", catalogExerciseId: 999 })],
      profile,
      squatDeciles
    );
    expect(results.map(result => result.resolution.status)).toEqual(["matched", "unavailable"]);
    expect(results[1].resolution).toMatchObject({ reason: "no_reference_for_exercise" });
  });
});

describe("summarizeOverviewWithReferences", () => {
  const overview = { nextAction: "Test routing shows broad context only." };
  const matched = { observationId: 1, exerciseName: "Back Squat", resolution: { status: "matched" } } as never;
  const unmatched = { observationId: 2, exerciseName: "Landmine Press", resolution: { status: "unavailable" } } as never;

  it("leaves the routing-only summary alone when nothing reached a comparison", () => {
    const result = summarizeOverviewWithReferences(overview, [unmatched, unmatched]);
    expect(result.comparedObservationCount).toBe(0);
    expect(result.nextAction).toBe(overview.nextAction);
  });

  it("counts only the tests that actually matched an approved source", () => {
    const result = summarizeOverviewWithReferences(overview, [matched, unmatched, matched]);
    expect(result.comparedObservationCount).toBe(2);
    expect(result.nextAction).toContain("2 saved tests match");
    // The boundary travels with the count: the rest are still logs-only.
    expect(result.nextAction).toContain("Every other saved test stays on your own logs only.");
  });

  it("reads correctly for a single matched test", () => {
    const result = summarizeOverviewWithReferences(overview, [matched, unmatched]);
    expect(result.nextAction).toContain("1 saved test matches");
    expect(result.nextAction).toContain("shown for it");
  });
});
