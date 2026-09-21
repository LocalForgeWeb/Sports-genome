import { describe, expect, it } from "vitest";
import { catalogExerciseIdForName, ordinal, strengthPercentileCard, strengthPercentileGapCopy } from "./strengthPercentileCard";
import type { StrengthPercentileResult } from "@shared/strengthPercentile";

const resolved = (overrides: Partial<Extract<StrengthPercentileResult, { status: "resolved" }>> = {}): StrengthPercentileResult => ({
  status: "resolved",
  percentile: 63,
  observedValue: 1.41,
  estimate: { valueKg: 112.6, basis: "estimated", confidence: 0.8, effectiveReps: 5 },
  confidence: 0.8,
  scoringVersion: "strength_beta_v1",
  route: "beta_community_curve",
  normalizationMethod: "direct_community_relative_1rm_percentile",
  unit: "x_bodyweight",
  sourceRole: "beta_fallback",
  exerciseId: "bench",
  aliasOfExerciseId: null,
  borrowedCurve: false,
  ...overrides,
});

describe("Ordinals", () => {
  it("names the ordinary cases", () => {
    expect(ordinal(1)).toBe("1st");
    expect(ordinal(22)).toBe("22nd");
    expect(ordinal(63)).toBe("63rd");
    expect(ordinal(40)).toBe("40th");
  });

  // The exception every naive implementation gets wrong: 11, 12 and 13 take "th".
  it("takes th through the teens", () => {
    expect(ordinal(11)).toBe("11th");
    expect(ordinal(12)).toBe("12th");
    expect(ordinal(13)).toBe("13th");
  });
});

describe("The percentile card", () => {
  it("leads with the percentile and names who it is against", () => {
    const card = strengthPercentileCard(resolved(), { sex: "male", bodyMassKg: 80 });
    expect(card?.headline).toBe("63rd percentile");
    expect(card?.detail).toContain("1.41× body weight");
    expect(card?.detail).toContain("men who lift");
  });

  /**
   * The card describes the lift in the unit it was actually placed in. Printing a bodyweight
   * multiple beside a percentile read off a pound ladder would describe a comparison that never
   * happened.
   */
  it("describes an absolute placement as a load, not a ratio", () => {
    const card = strengthPercentileCard(
      resolved({ unit: "lb_1rm", observedValue: 248.2, normalizationMethod: "direct_community_1rm_percentile" }),
      { sex: "female", bodyMassKg: 62 },
    );
    expect(card?.detail).toContain("248 lb");
    expect(card?.detail).not.toContain("body weight");
    expect(card?.detail).toContain("women who lift");
  });

  it("has nothing to show when the lift was not placed", () => {
    expect(strengthPercentileCard({ status: "unavailable", reason: "no_curve_for_exercise" }, { sex: "male" })).toBeNull();
  });
});

describe("What the athlete can do about a missing percentile", () => {
  it("asks only for the inputs they can actually supply", () => {
    expect(strengthPercentileGapCopy.sex_required).toContain("About Me");
    expect(strengthPercentileGapCopy.body_mass_required).toContain("body weight");
  });

  // A lift off the end of the curve, or an exercise with no curve, is not the athlete's to fix.
  // Those say nothing rather than asking for something that would not help.
  it("stays quiet where there is no next step", () => {
    expect(strengthPercentileGapCopy.no_curve_for_exercise).toBeUndefined();
    expect(strengthPercentileGapCopy.above_highest_anchor).toBeUndefined();
    expect(strengthPercentileGapCopy.curve_is_not_one_rep_max).toBeUndefined();
  });
});

describe("Finding the curve's exercise from a logged lift", () => {
  it("matches a catalog exercise by the name the athlete saw", () => {
    expect(catalogExerciseIdForName("Barbell Bench Press")).toBe(1);
    expect(catalogExerciseIdForName("  barbell bench press  ")).toBe(1);
  });

  it("returns nothing for a name the catalog does not hold", () => {
    expect(catalogExerciseIdForName("Interpretive Deadlift")).toBeUndefined();
  });
});
