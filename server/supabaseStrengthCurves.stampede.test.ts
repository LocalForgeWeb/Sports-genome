import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getStrengthPercentile, getStrengthPercentiles, resetStrengthCurveCache } from "./supabaseStrengthCurves";

/**
 * A batch of lifts on a cold server. Every lift misses the cache at the same moment, so without
 * a shared fetch each one would download the whole exercise index and its own copy of the curve.
 */
const anchor = (percentile: number, value: number) => ({
  exercise_id: "bench-press",
  sex: "male",
  normalization_method: "direct_community_relative_1rm_percentile",
  unit: "x_bodyweight",
  source_role: "beta_fallback",
  confidence_cap: 0.82,
  percentile,
  value,
});

const requests = { index: 0, curve: 0 };
let indexStatus = 200;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const fakeFetch = vi.fn(async (input: URL | string) => {
  const url = new URL(String(input));
  // Let every caller that started together reach the fetch before any answer arrives.
  await new Promise(resolve => setTimeout(resolve, 5));
  if (url.searchParams.get("select") === "exercise_id,exercise_canonical_name,exercise_name") {
    requests.index += 1;
    if (indexStatus !== 200) return json({ message: "unavailable" }, indexStatus);
    return json([
      { exercise_id: "bench-press", exercise_canonical_name: "barbell_bench_press__catalog_1", exercise_name: "Barbell Bench Press" },
      { exercise_id: "bench-press", exercise_canonical_name: "barbell_bench_press__catalog_1", exercise_name: "Barbell Bench Press" },
    ]);
  }
  requests.curve += 1;
  return json([anchor(25, 0.75), anchor(50, 1), anchor(75, 1.25)]);
});

const benchLift = { catalogExerciseId: 1, exerciseName: "Barbell Bench Press", sex: "male" as const, bodyMassKg: 80, measuredOneRmKg: 90 };

beforeEach(() => {
  vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-test-key");
  vi.stubGlobal("fetch", fakeFetch);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  requests.index = 0;
  requests.curve = 0;
  indexStatus = 200;
});

afterEach(() => {
  resetStrengthCurveCache();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Lifts placed together on a cold server", () => {
  it("share one index request and one curve request", async () => {
    const results = await getStrengthPercentiles(Array.from({ length: 24 }, () => benchLift));

    expect(requests).toEqual({ index: 1, curve: 1 });
    expect(results).toHaveLength(24);
    resetStrengthCurveCache();
    const alone = await getStrengthPercentile(benchLift);
    expect(alone.status).toBe("resolved");
    results.forEach(result => expect(result).toEqual(alone));
  });

  it("share one failed index request, and the next request tries again", async () => {
    indexStatus = 500;

    const results = await getStrengthPercentiles(Array.from({ length: 24 }, () => benchLift));

    expect(results).toEqual(Array.from({ length: 24 }, () => ({ status: "unavailable", reason: "no_curve_for_exercise" })));
    expect(requests).toEqual({ index: 1, curve: 0 });

    indexStatus = 200;
    const retried = await getStrengthPercentiles([benchLift]);
    expect(requests.index).toBe(2);
    expect(retried[0].status).toBe("resolved");
  });
});
