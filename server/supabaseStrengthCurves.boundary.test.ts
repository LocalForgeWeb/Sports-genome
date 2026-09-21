import { describe, expect, it } from "vitest";
import { assembleCurve, createSupabaseStrengthCurveClient } from "./supabaseStrengthCurves";

const anchor = (percentile: number, value: number, overrides: Record<string, unknown> = {}) => ({
  exercise_id: "bench-press",
  sex: "male",
  normalization_method: "direct_community_relative_1rm_percentile",
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

  it("never mixes normalization methods on one ladder", () => {
    // Relative anchors are kg per kg of bodyweight and absolute ones are kg; placing a lift
    // against a blend of both would compare it to the wrong scale entirely.
    const curve = assembleCurve(
      [
        anchor(25, 0.75), anchor(50, 1), anchor(75, 1.25),
        anchor(50, 100, { normalization_method: "direct_community_absolute_1rm_percentile" }),
        anchor(75, 140, { normalization_method: "direct_community_absolute_1rm_percentile" }),
      ],
      "bench-press",
      "male",
    );
    expect(curve?.normalizationMethod).toBe("direct_community_relative_1rm_percentile");
    expect(curve?.anchors.every(entry => entry.value < 10)).toBe(true);
  });

  it("falls back to the best-supported method when no relative curve exists", () => {
    const curve = assembleCurve(
      [
        anchor(50, 100, { normalization_method: "direct_community_absolute_1rm_percentile" }),
        anchor(75, 140, { normalization_method: "direct_community_absolute_1rm_percentile" }),
      ],
      "bench-press",
      "male",
    );
    expect(curve?.normalizationMethod).toBe("direct_community_absolute_1rm_percentile");
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
