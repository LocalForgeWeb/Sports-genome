import { describe, expect, it } from "vitest";
import { catalogExerciseIdForName, isRepCountLift, ordinal, strengthPercentileCard, strengthPercentileGapCopy, topPercentileFigure } from "./strengthPercentileCard";
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

describe("Ordinals at the top end", () => {
  it("are whole below the 99th and keep a tenth, then a hundredth, above it", () => {
    expect(ordinal(63)).toBe("63rd");
    expect(ordinal(96.531)).toBe("97th");
    expect(ordinal(99)).toBe("99th");
    expect(ordinal(99.239)).toBe("99.2nd");
    expect(ordinal(99.5)).toBe("99.5th");
    expect(ordinal(99.892)).toBe("99.8th");
    expect(ordinal(99.91)).toBe("99.91st");
    expect(ordinal(99.93)).toBe("99.93rd");
    expect(ordinal(99.99)).toBe("99.99th");
  });

  it("never round up to 100", () => {
    expect(ordinal(99.996)).toBe("99.99th");
    expect(ordinal(100)).toBe("99.99th");
    expect(topPercentileFigure(99.95999)).toBe(99.95);
  });
});

describe("Which sets are placed as a rep count", () => {
  it("is a rep-scored movement done with no added load", () => {
    expect(isRepCountLift("Pull-Up", 0, 12)).toBe(true);
    expect(isRepCountLift("Standard Push-Up", null, 150)).toBe(true);
    expect(isRepCountLift("Standard Push-Up", "", "40")).toBe(true);
  });

  it("is not a loaded set, a load-scored lift, or a set with no reps", () => {
    expect(isRepCountLift("Pull-Up", 20, 8)).toBe(false);
    expect(isRepCountLift("Barbell Bench Press", 0, 10)).toBe(false);
    expect(isRepCountLift("Pull-Up", 0, 0)).toBe(false);
    expect(isRepCountLift("Pull-Up", 0, null)).toBe(false);
    expect(isRepCountLift("Pull-Up", 0, 1001)).toBe(false);
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

describe("A percentile past the top anchor (14 Oct 2026)", () => {
  const tail = { version: "lognormal_upper_tail_v1" as const, aboveAnchorPercentile: 95, capped: false };

  it("says it is an estimate in the headline and why in the sentence", () => {
    const card = strengthPercentileCard(resolved({ percentile: 96.88, tailEstimate: tail }), { sex: "male", bodyMassKg: 80 })!;
    expect(card.headline).toBe("≈ 97th percentile (estimated)");
    expect(card.detail).toContain("Past the 95th percentile, where the comparison data stops, so this is estimated from the curve's shape.");
    expect(card.placement).toContain("estimated from the curve's shape");
    expect(card.detail).not.toContain("Estimates stop");
  });

  it("says where the estimate stops when it reached the cap", () => {
    const card = strengthPercentileCard(resolved({ percentile: 99.99, tailEstimate: { ...tail, capped: true } }), { sex: "female" })!;
    expect(card.headline).toBe("≈ 99.99th percentile (estimated)");
    expect(card.detail).toMatch(/Estimates stop at the 99\.99th\.$/);
  });

  it("keeps the decimals that tell the top end apart, floored", () => {
    expect(strengthPercentileCard(resolved({ percentile: 99.239, tailEstimate: tail }), { sex: "male", bodyMassKg: 80 })!.headline).toBe("≈ 99.2nd percentile (estimated)");
    expect(strengthPercentileCard(resolved({ percentile: 99.985, tailEstimate: tail }), { sex: "male", bodyMassKg: 80 })!.headline).toBe("≈ 99.98th percentile (estimated)");
  });

  it("says when the lift was compared through a related one", () => {
    const card = strengthPercentileCard(resolved({ percentile: 70, borrowedCurve: true, aliasOfExerciseId: "source" }), { sex: "male", bodyMassKg: 80 })!;
    expect(card.detail).toContain("Compared through a closely related lift");
    expect(strengthPercentileCard(resolved({ percentile: 70 }), { sex: "male", bodyMassKg: 80 })!.detail).not.toContain("related lift");
  });

  it("leaves a placement between measured anchors exactly as before", () => {
    const card = strengthPercentileCard(resolved({ percentile: 63 }), { sex: "male", bodyMassKg: 80 })!;
    expect(card.headline).toBe("63rd percentile");
    expect(card.detail).not.toContain("estimated");
  });
});
