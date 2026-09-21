import { describe, expect, it } from "vitest";
import { assembleCurve, catalogIdFromCanonicalName, createSupabaseStrengthCurveClient, findCurveExercise } from "./supabaseStrengthCurves";

const anchor = (percentile: number, value: number, overrides: Record<string, unknown> = {}) => ({
  exercise_id: "bench-press",
  sex: "male",
  normalization_method: "direct_community_relative_1rm_percentile",
  unit: "x_bodyweight",
  source_role: "beta_fallback",
  confidence_cap: 0.82,
  percentile,
  value,
  ...overrides,
});

describe("Assembling a curve from anchor rows", () => {
  it("keeps the anchors and the source's confidence cap", () => {
    const curve = assembleCurve([anchor(25, 0.75), anchor(50, 1), anchor(75, 1.25)], "bench-press", "male");
    expect(curve).toMatchObject({ exerciseId: "bench-press", sex: "male", sourceRole: "beta_fallback", confidenceCap: 0.82 });
    expect(curve?.anchors).toHaveLength(3);
  });

  it("drops any row the policy does not admit, whatever the query returned", () => {
    // Defence in depth: the view already excludes these, so a row arriving here means
    // something upstream changed, and the curve should shrink rather than quietly widen.
    const curve = assembleCurve(
      [anchor(25, 0.75), anchor(50, 1), anchor(75, 1.25, { source_role: "excluded" })],
      "bench-press",
      "male",
    );
    expect(curve?.anchors).toHaveLength(2);
  });

  it("never mixes ladders of different units", () => {
    // Relative anchors are kg per kg of bodyweight and absolute ones are pounds; placing a lift
    // against a blend of both would compare it to the wrong scale entirely.
    const curve = assembleCurve(
      [
        anchor(25, 0.75), anchor(50, 1), anchor(75, 1.25),
        anchor(50, 225, { normalization_method: "direct_community_1rm_percentile", unit: "lb_1rm" }),
        anchor(75, 315, { normalization_method: "direct_community_1rm_percentile", unit: "lb_1rm" }),
      ],
      "bench-press",
      "male",
    );
    expect(curve?.normalizationMethod).toBe("direct_community_relative_1rm_percentile");
    expect(curve?.unit).toBe("x_bodyweight");
    expect(curve?.anchors.every(entry => entry.value < 10)).toBe(true);
  });

  it("keeps the unit that arrived with the rows rather than assuming kilograms", () => {
    const curve = assembleCurve(
      [
        anchor(50, 225, { normalization_method: "direct_community_1rm_percentile", unit: "lb_1rm" }),
        anchor(75, 315, { normalization_method: "direct_community_1rm_percentile", unit: "lb_1rm" }),
      ],
      "bench-press",
      "male",
    );
    expect(curve?.normalizationMethod).toBe("direct_community_1rm_percentile");
    expect(curve?.unit).toBe("lb_1rm");
  });

  // A rep ladder ranks how many reps people get, not how much they lift. It is admitted only
  // when nothing else exists, and the engine refuses to place a load on it.
  it("prefers a one-rep-max ladder over a rep ladder for the same exercise", () => {
    const curve = assembleCurve(
      [
        anchor(50, 20, { normalization_method: "direct_community_rep_percentile", unit: "reps" }),
        anchor(75, 32, { normalization_method: "direct_community_rep_percentile", unit: "reps" }),
        anchor(90, 44, { normalization_method: "direct_community_rep_percentile", unit: "reps" }),
        anchor(50, 225, { normalization_method: "direct_community_1rm_percentile", unit: "lb_1rm" }),
        anchor(75, 315, { normalization_method: "direct_community_1rm_percentile", unit: "lb_1rm" }),
      ],
      "bench-press",
      "male",
    );
    expect(curve?.unit).toBe("lb_1rm");
  });

  it("drops a unit it does not recognise rather than placing a lift on it", () => {
    expect(assembleCurve(
      [anchor(50, 1, { unit: "furlongs" }), anchor(75, 1.25, { unit: "furlongs" })],
      "bench-press",
      "male",
    )).toBeNull();
  });

  it("takes the strictest cap so one lenient row cannot raise the ceiling", () => {
    const curve = assembleCurve([anchor(25, 0.75), anchor(50, 1, { confidence_cap: 0.6 })], "bench-press", "male");
    expect(curve?.confidenceCap).toBe(0.6);
  });

  it("refuses to build a curve from fewer than two anchors", () => {
    expect(assembleCurve([anchor(50, 1)], "bench-press", "male")).toBeNull();
    expect(assembleCurve([], "bench-press", "male")).toBeNull();
  });

  it("does not serve one sex's rows to the other", () => {
    expect(assembleCurve([anchor(25, 0.75, { sex: "female" }), anchor(50, 1, { sex: "female" })], "bench-press", "male")).toBeNull();
  });
});

describe("The curve request", () => {
  function clientReturning(payload: unknown, ok = true) {
    const calls: string[] = [];
    const client = createSupabaseStrengthCurveClient({
      url: "https://example.supabase.co",
      serviceRoleKey: "service-role",
      fetchImplementation: async (input: URL | RequestInfo) => {
        calls.push(String(input));
        return { ok, status: ok ? 200 : 500, json: async () => payload } as unknown as Response;
      },
    });
    return { client, calls };
  }

  it("reads the policy-gated view, never the ungated norms view", async () => {
    const { client, calls } = clientReturning([anchor(25, 0.75), anchor(50, 1)]);
    await client.getCurve("bench-press", "male");
    expect(calls[0]).toContain("app_strength_beta_curves_v1");
    expect(calls[0]).not.toContain("app_strength_norms_v1");
    expect(calls[0]).toContain("sex=eq.male");
  });

  it("surfaces an upstream failure instead of returning an empty curve", async () => {
    const { client } = clientReturning([], false);
    await expect(client.getCurve("bench-press", "male")).rejects.toThrow(/failed \(500\)/);
  });
});

describe("Matching a logged lift to a curve's exercise", () => {
  const index = [
    { exerciseId: "uuid-bench", canonicalName: "barbell_bench_press__catalog_1", displayName: "Barbell Bench Press" },
    { exerciseId: "uuid-incline", canonicalName: "incline_barbell_bench_press__catalog_2", displayName: "Incline Barbell Bench Press" },
    { exerciseId: "uuid-cable-curl", canonicalName: "cable_biceps_curl", displayName: "Cable Biceps Curl" },
  ];

  it("reads the app's own catalog id out of the canonical name", () => {
    expect(catalogIdFromCanonicalName("barbell_bench_press__catalog_1")).toBe(1);
    expect(catalogIdFromCanonicalName("cable_biceps_curl")).toBeNull();
  });

  it("joins on the catalog id, which cannot be wrong", () => {
    expect(findCurveExercise(index, { catalogExerciseId: 2 })?.exerciseId).toBe("uuid-incline");
  });

  /**
   * Catalog id 1 is "Barbell Bench Press" and 2 is "Incline Barbell Bench Press". A prefix or
   * substring match would hand the incline lift the flat bench's curve, so the id wins outright
   * and the name is compared whole.
   */
  it("does not let one exercise borrow a similarly named exercise's curve", () => {
    expect(findCurveExercise(index, { catalogExerciseId: 1, exerciseName: "Incline Barbell Bench Press" })?.exerciseId)
      .toBe("uuid-bench");
    expect(findCurveExercise(index, { exerciseName: "Barbell Bench" })).toBeNull();
  });

  it("falls back to the display name for a curve carrying no catalog id", () => {
    expect(findCurveExercise(index, { exerciseName: "cable biceps curl" })?.exerciseId).toBe("uuid-cable-curl");
    expect(findCurveExercise(index, { exerciseName: "Cable Biceps-Curl" })?.exerciseId).toBe("uuid-cable-curl");
  });

  it("returns nothing rather than a near miss", () => {
    expect(findCurveExercise(index, { catalogExerciseId: 9999, exerciseName: "Interpretive Deadlift" })).toBeNull();
    expect(findCurveExercise(index, {})).toBeNull();
  });
});
