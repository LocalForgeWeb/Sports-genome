import { describe, expect, it } from "vitest";
import { assembleCurve, findCurveExercise, type CurveExerciseRow } from "./supabaseStrengthCurves";
import { resolveStrengthPercentile } from "../shared/strengthPercentile";

/**
 * A smoke check against rows shaped exactly as the live view returns them, so the whole chain -
 * index lookup, ladder choice, unit conversion, placement - is exercised on real data shapes
 * rather than on fixtures invented to match the code.
 */
const index: CurveExerciseRow[] = [
  { exerciseId: "uuid-bench", canonicalName: "barbell_bench_press__catalog_1", displayName: "Barbell Bench Press" },
];

// Live anchors for barbell_bench_press__catalog_1, male, read 2026-09-21.
const rows = [
  { exercise_id: "uuid-bench", sex: "male", normalization_method: "direct_community_relative_1rm_percentile", unit: "x_bodyweight", source_role: "beta_fallback", confidence_cap: 0.82, percentile: 5, value: 0.5 },
  { exercise_id: "uuid-bench", sex: "male", normalization_method: "direct_community_relative_1rm_percentile", unit: "x_bodyweight", source_role: "beta_fallback", confidence_cap: 0.82, percentile: 20, value: 1.0 },
  { exercise_id: "uuid-bench", sex: "male", normalization_method: "direct_community_relative_1rm_percentile", unit: "x_bodyweight", source_role: "beta_fallback", confidence_cap: 0.82, percentile: 50, value: 1.25 },
  { exercise_id: "uuid-bench", sex: "male", normalization_method: "direct_community_relative_1rm_percentile", unit: "x_bodyweight", source_role: "beta_fallback", confidence_cap: 0.82, percentile: 80, value: 1.5 },
  { exercise_id: "uuid-bench", sex: "male", normalization_method: "direct_community_relative_1rm_percentile", unit: "x_bodyweight", source_role: "beta_fallback", confidence_cap: 0.82, percentile: 95, value: 2.0 },
];

describe("a logged bench press, all the way to a percentile", () => {
  it("finds the curve from the catalog id and places the lift on it", () => {
    const match = findCurveExercise(index, { catalogExerciseId: 1, exerciseName: "Barbell Bench Press" });
    expect(match?.exerciseId).toBe("uuid-bench");

    const curve = assembleCurve(rows, match!.exerciseId, "male");
    expect(curve?.unit).toBe("x_bodyweight");
    expect(curve?.anchors).toHaveLength(5);

    // 100kg x 5 at 80kg bodyweight: ~114.6kg estimated, ~1.43x body weight.
    const result = resolveStrengthPercentile(curve, { loadKg: 100, repetitions: 5 }, { sex: "male", bodyMassKg: 80 });
    expect(result.status).toBe("resolved");
    if (result.status !== "resolved") return;
    expect(result.observedValue).toBeCloseTo(1.43, 2);
    expect(result.percentile).toBeGreaterThan(70);
    expect(result.percentile).toBeLessThan(80);
  });
});
