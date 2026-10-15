import { describe, expect, it } from "vitest";
import { rankOrdinal, rankPercentileText } from "./CapabilityRank";
import type { MuscleScore } from "@shared/capabilityRank";
import type { StrengthPercentileResult } from "@shared/strengthPercentile";
import { strengthPercentileCard } from "@/lib/strengthPercentileCard";

/** A rank past the top anchor rests on an estimated lift and says so wherever it is printed (14 Oct 2026). */
const muscle = (percentile: number, estimated?: boolean): MuscleScore => ({
  muscleId: "m", canonicalName: "pectoralis_major", name: "Pectoralis major", percentile, confidence01: 0.7,
  evidenceCount: 1, movementPatternCount: 1, evidence: [], referenceGroups: [], ...(estimated ? { estimated } : {}),
});

describe("Printing a rank's percentile", () => {
  it("marks an estimated percentile with ≈ and (estimated), floored like every rank number", () => {
    expect(rankOrdinal(96.9, true)).toBe("≈ 96th (estimated)");
    expect(rankOrdinal(96.9, true, "percentile on its own")).toBe("≈ 96th percentile on its own (estimated)");
    expect(rankOrdinal(96.9)).toBe("96th");
    expect(rankOrdinal(41.2, false, "percentile")).toBe("41st percentile");
  });

  it("puts the estimate ahead of thin-evidence wording, which it already implies", () => {
    expect(rankPercentileText({ representative: muscle(97.2, true), confidence: "low" })).toBe("≈ 97th percentile (estimated)");
    expect(rankPercentileText({ representative: muscle(97.2, true), confidence: "high" })).toBe("≈ 97th percentile (estimated)");
    expect(rankPercentileText({ representative: muscle(41.6), confidence: "low" })).toBe("About 41st percentile");
    expect(rankPercentileText({ representative: muscle(41.6), confidence: "high" })).toBe("41st percentile");
  });
});

/**
 * One lift, one printed number (owner, 14 Oct 2026: "make them match"). The card used to round
 * (96.53 read "97th") while the ranks floored the same lift (96.53 read "96th"). Now the card takes
 * the lift to 2 decimals, as the ranks report it, and prints it by the ranks' own rule.
 */
describe("A lift's card and its line in the ranks", () => {
  // The ranks' rounding of a lift (server/muscleAggregation.ts: exercise_percentile).
  const asRanksReport = (value: number) => Math.round(value * 100) / 100;
  const card = (percentile: number, estimated: boolean) => strengthPercentileCard({
    status: "resolved", percentile, observedValue: 1.5, confidence: 0.8, scoringVersion: "strength_beta_v2", route: "beta_community_curve",
    estimate: { valueKg: 120, basis: "measured", confidence: 1, effectiveReps: 1, method: "measured_1rm", estimator: "measured", repsInReserve: null },
    ageAdjustment: { status: "not_applied", reason: "age_missing", ageYears: null },
    normalizationMethod: "direct_community_relative_1rm_percentile", unit: "x_bodyweight", sourceRole: "beta_fallback",
    exerciseId: "lift", aliasOfExerciseId: null, borrowedCurve: false,
    ...(estimated ? { tailEstimate: { version: "lognormal_upper_tail_v1", aboveAnchorPercentile: 95, capped: false } } : {}),
  } as StrengthPercentileResult, { sex: "male", bodyMassKg: 80 })!.headline;

  it.each([5.4, 19.6, 37.327999999999996, 57.996, 63, 89.99, 96.531, 98.995, 99.239, 99.8999, 99.985, 99.99])("%s reads the same on both", (raw) => {
    const estimated = raw > 95;
    expect(card(raw, estimated)).toBe(`${rankOrdinal(asRanksReport(raw), estimated, "percentile")}`);
  });

  it("is floored on both, so a lift short of the next whole number never reads it", () => {
    expect(card(96.531, true)).toBe("≈ 96th percentile (estimated)");
    expect(card(57.994, false)).toBe("57th percentile");
    // At 2 decimals the ranks report 57.996 as 58.00, and so does the card.
    expect(card(57.996, false)).toBe("58th percentile");
  });
});

/** Owner, 15 Oct 2026: a set stopped short of failure may raise a rank, never lower it - a floor. */
describe("A rank read from sets stopped short of failure", () => {
  it("reads as at least that much", () => {
    expect(rankPercentileText({ representative: { ...muscle(41.2), atLeast: true }, confidence: "low" })).toBe("At least 41st percentile");
    expect(rankOrdinal(30.4, false, "percentile on its own", true)).toBe("at least 30th percentile on its own");
    expect(rankOrdinal(96.9, true, "", true)).toBe("at least ≈ 96th (estimated)");
  });

  it("is not changed when the muscle has a measured lift too", () => {
    expect(rankPercentileText({ representative: muscle(41.2), confidence: "high" })).toBe("41st percentile");
  });
});
