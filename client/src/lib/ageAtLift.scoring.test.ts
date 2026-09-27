import { describe, expect, it } from "vitest";
import type { StrengthPercentileResult } from "@shared/strengthPercentile";
import type { WithinAthleteStrengthChange } from "@/lib/withinAthleteStrengthChange";
import { muscleRankLifts } from "./muscleRankLifts";
import { liftsToPlace } from "./progressPercentiles";
import { ageAdjustmentNote, strengthPercentileCard } from "./strengthPercentileCard";

/**
 * A birth year entered today has to reach lifts logged before it existed. Nothing about a lift
 * is stored with an age, so each request is built from the lift's own date and whatever birth
 * year the profile holds now.
 */
const lastSpring = { exerciseName: "Barbell Bench Press", loadKg: 81.65, measurementType: "MEASURED_1RM", observedAt: "2025-04-10T10:00:00Z", bodyMassKgAtTest: 65.77 };
const thisMonth = { ...lastSpring, loadKg: 85, observedAt: "2026-09-20T10:00:00Z" };

describe("Muscle-rank lifts carry the age at each lift", () => {
  it("carries no age before a birth year is given", () => {
    expect(muscleRankLifts([lastSpring, thisMonth], [], null).map((lift) => lift.ageYears)).toEqual([null, null]);
  });

  it("gives every earlier lift its own age once one is", () => {
    const lifts = muscleRankLifts([lastSpring, thisMonth], [], null, 2010);
    expect(lifts.map((lift) => [lift.loadKg, lift.ageYears])).toEqual([[85, 16], [81.65, 15]]);
  });
});

describe("Progress placements carry the age at each lift", () => {
  const change = {
    exerciseName: "Barbell Bench Press", laterality: "BILATERAL", changeState: "stable", observationCount: 2,
    firstPoint: { id: "a", observedAt: new Date("2025-04-10"), estimatedOneRmKg: 81.65, repetitions: 1 },
    latestPoint: { id: "b", observedAt: new Date("2026-09-20"), estimatedOneRmKg: 85, repetitions: 1 },
    relativeChangePercent: 4, estimationMethod: "epley",
  } as unknown as WithinAthleteStrengthChange;
  const history = [
    { id: "a", exerciseName: "Barbell Bench Press", measurementType: "MEASURED_1RM", observedAt: "2025-04-10T10:00:00Z", loadKg: 81.65, repetitions: 1 },
    { id: "b", exerciseName: "Barbell Bench Press", measurementType: "MEASURED_1RM", observedAt: "2026-09-20T10:00:00Z", loadKg: 85, repetitions: 1 },
  ];

  it("reads the age from the latest lift's own date", () => {
    const [lift] = liftsToPlace([change], history, new Map([["b", 65.77]]), { sex: "male", birthYear: 2010 });
    expect(lift.request.ageYears).toBe(16);
  });

  it("sends no age without a birth year", () => {
    const [lift] = liftsToPlace([change], history, new Map([["b", 65.77]]), { sex: "male" });
    expect(lift.request.ageYears).toBeNull();
  });
});

describe("What the card says about age", () => {
  const resolved = (ageAdjustment: Extract<StrengthPercentileResult, { status: "resolved" }>["ageAdjustment"]): StrengthPercentileResult => ({
    status: "resolved", percentile: 69.6, observedValue: 1.2414, ageAdjustment,
    estimate: { valueKg: 81.65, basis: "measured", confidence: 1, effectiveReps: 1 },
    confidence: 0.82, scoringVersion: "strength_beta_v1", route: "beta_community_curve",
    normalizationMethod: "direct_community_relative_1rm_percentile", unit: "x_bodyweight", sourceRole: "beta_fallback",
    exerciseId: "bench", aliasOfExerciseId: null, borrowedCurve: false,
  });

  it("says the comparison was adjusted, and for what age", () => {
    const card = strengthPercentileCard(resolved({ status: "applied", version: "strengthlevel_age_factor_v1", ageYears: 16, factor: 0.8784, placedValue: 1.4133 }), { sex: "male" });
    expect(card?.detail).toBe("1.24× body weight · among men who lift this lift, adjusted for age 16.");
  });

  /** 25 to 40 is the table's baseline: "adjusted" would describe a change that did not happen. */
  it("says nothing about age at the adult baseline", () => {
    expect(ageAdjustmentNote({ status: "applied", version: "strengthlevel_age_factor_v1", ageYears: 30, factor: 1, placedValue: 1.2414 })).toBe(".");
  });

  it("says why a lift at 14 was not adjusted", () => {
    expect(ageAdjustmentNote({ status: "not_applied", reason: "outside_published_age_range", ageYears: 14 }))
      .toBe(". Not adjusted for age 14: the published age adjustment covers 15 to 90.");
  });

  it("says nothing when no birth year was given, or from a response cached before age existed", () => {
    expect(ageAdjustmentNote({ status: "not_applied", reason: "age_missing", ageYears: null })).toBe(".");
    expect(ageAdjustmentNote(undefined)).toBe(".");
  });
});
