import { describe, expect, it } from "vitest";
import { STRENGTH_LEVEL_SOURCE_STUDY_ID, resolveStrengthPercentile, type StrengthCurve } from "@shared/strengthPercentile";
import { effortNote, strengthPercentileCard } from "./strengthPercentileCard";

/**
 * Effort (Backend V1 B059, B093, B253; decision D-008). Nothing records reps in reserve yet,
 * so a working set is read as taken to failure - the source calculator's own assumption. The
 * card says so, and what it means: the estimate is a floor.
 */
const bench: StrengthCurve = {
  exerciseId: "bench", sourceStudyId: STRENGTH_LEVEL_SOURCE_STUDY_ID, sex: "male",
  normalizationMethod: "direct_community_relative_1rm_percentile", unit: "x_bodyweight", sourceRole: "beta_fallback", confidenceCap: 0.95,
  anchors: [{ percentile: 5, value: 0.5 }, { percentile: 20, value: 1.0 }, { percentile: 50, value: 1.25 }, { percentile: 80, value: 1.5 }, { percentile: 95, value: 2.0 }],
};
const context = { sex: "male" as const, bodyMassKg: 65.77 };
const resolved = (input: Parameters<typeof resolveStrengthPercentile>[1]) => {
  const result = resolveStrengthPercentile(bench, input, context);
  if (result.status !== "resolved") throw new Error("expected a placement");
  return result;
};

describe("What changes when effort is known", () => {
  it("places the same set higher when reps in reserve are reported", () => {
    const unknown = resolved({ loadKg: 70, repetitions: 5 });
    const twoLeft = resolved({ loadKg: 70, repetitions: 5, repsInReserve: 2 });
    // The database's own numbers for these two sets: 43.68 and 53.26.
    expect(unknown.percentile).toBeCloseTo(43.68, 2);
    expect(twoLeft.percentile).toBeCloseTo(53.26, 2);
    expect(unknown.estimate).toMatchObject({ repsInReserve: null, confidence: 0.84 });
    // Confidence follows the database: unknown effort costs 0.08; two reps in reserve cost
    // 0.05 but make it a 7-rep effort, so both land near 0.83-0.84.
    expect(twoLeft.estimate).toMatchObject({ repsInReserve: 2, effectiveReps: 7, confidence: 0.83 });
  });

  it("says on the card that unrecorded effort was read as failure, and that this is a floor", () => {
    const card = strengthPercentileCard(resolved({ loadKg: 70, repetitions: 5 }), context)!;
    expect(card.detail).toContain("Read as a set taken to failure, because effort was not recorded; if reps were left in reserve, the lift places higher.");
  });

  it("says nothing about effort for a single rep, a measured maximum, a reported effort, or an older cached result", () => {
    expect(strengthPercentileCard(resolved({ loadKg: 80, repetitions: 1 }), context)!.detail).not.toContain("effort");
    expect(strengthPercentileCard(resolved({ measuredOneRmKg: 80 }), context)!.detail).not.toContain("effort");
    expect(strengthPercentileCard(resolved({ loadKg: 70, repetitions: 5, repsInReserve: 0 }), context)!.detail).not.toContain("effort");
    expect(effortNote({ basis: "estimated", effectiveReps: 5 })).toBe("");
  });
});
