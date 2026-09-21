import {
  resolveStrengthPercentile,
  type OneRepMaxInput,
  type StrengthCurve,
  type StrengthNormMethod,
  type StrengthPercentileResult,
  type StrengthSourceRole,
} from "../shared/strengthPercentile";

/**
 * Server-only read of the beta percentile curves.
 *
 * Reads `app_strength_beta_curves_v1`, which carries the source policy with the data, and never
 * `app_strength_norms_v1`, which would also serve the excluded competitive-powerlifting rows.
 * Resolution stays in the shared engine; this module only fetches and shapes.
 */

type FetchImplementation = typeof fetch;

type SupabaseStrengthCurveClientConfig = {
  url: string;
  serviceRoleKey: string;
  fetchImplementation?: FetchImplementation;
};

type CurveRow = {
  exercise_id?: unknown;
  sex?: unknown;
  normalization_method?: unknown;
  source_role?: unknown;
  confidence_cap?: unknown;
  percentile?: unknown;
  value?: unknown;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const curveCache = new Map<string, { expiresAt: number; value: StrengthCurve | null }>();

const normMethods: StrengthNormMethod[] = [
  "direct_community_relative_1rm_percentile",
  "direct_community_absolute_1rm_percentile",
  "direct_community_rep_percentile",
  "bodyweight_repetition_max",
];

function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function textOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * Turns anchor rows into one curve.
 *
 * A curve mixing normalization methods is not a curve — kg and kg-per-kg anchors on one ladder
 * would place a lift against the wrong scale — so the most common method wins and the rest are
 * dropped rather than blended.
 */
export function assembleCurve(rows: readonly CurveRow[], exerciseId: string, sex: "male" | "female"): StrengthCurve | null {
  const usable = rows
    .map(row => ({
      method: textOrNull(row.normalization_method),
      role: textOrNull(row.source_role),
      cap: numberOrNull(row.confidence_cap),
      percentile: numberOrNull(row.percentile),
      value: numberOrNull(row.value),
      sex: textOrNull(row.sex),
    }))
    .filter(row =>
      row.method !== null &&
      (normMethods as string[]).includes(row.method) &&
      row.role === "beta_fallback" &&
      row.percentile !== null &&
      row.value !== null &&
      row.sex === sex
    );
  if (usable.length < 2) return null;

  const byMethod = new Map<string, typeof usable>();
  for (const row of usable) {
    const bucket = byMethod.get(row.method as string) ?? [];
    bucket.push(row);
    byMethod.set(row.method as string, bucket);
  }
  // Prefer the bodyweight-relative curve the scoring version asks for; otherwise take whichever
  // method has the most anchors, which is the best-supported ladder available.
  const relative = byMethod.get("direct_community_relative_1rm_percentile");
  const buckets: (typeof usable)[] = [];
  byMethod.forEach(bucket => buckets.push(bucket));
  const chosen = relative && relative.length >= 2
    ? relative
    : buckets.sort((first, second) => second.length - first.length)[0];
  if (!chosen || chosen.length < 2) return null;

  const caps = chosen.map(row => row.cap).filter((cap): cap is number => cap !== null);
  return {
    exerciseId,
    sex,
    normalizationMethod: chosen[0].method as StrengthNormMethod,
    sourceRole: "beta_fallback" as StrengthSourceRole,
    // The strictest cap among the contributing rows, so one lenient row cannot raise the ceiling.
    confidenceCap: caps.length ? Math.min(...caps) : null,
    anchors: chosen.map(row => ({ percentile: row.percentile as number, value: row.value as number })),
  };
}

export function createSupabaseStrengthCurveClient({
  url,
  serviceRoleKey,
  fetchImplementation = fetch,
}: SupabaseStrengthCurveClientConfig) {
  const baseUrl = url.replace(/\/+$/, "");

  return {
    async getCurve(exerciseId: string, sex: "male" | "female"): Promise<StrengthCurve | null> {
      const requestUrl = new URL("/rest/v1/app_strength_beta_curves_v1", baseUrl);
      requestUrl.searchParams.set("select", "exercise_id,sex,normalization_method,source_role,confidence_cap,percentile,value");
      requestUrl.searchParams.set("exercise_id", `eq.${exerciseId}`);
      requestUrl.searchParams.set("sex", `eq.${sex}`);
      requestUrl.searchParams.set("order", "percentile.asc");
      const response = await fetchImplementation(requestUrl, {
        headers: {
          Accept: "application/json",
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      });
      if (!response.ok) throw new Error(`Supabase strength curve request failed (${response.status})`);
      const rows = (await response.json()) as CurveRow[];
      return assembleCurve(rows, exerciseId, sex);
    },
  };
}

function getRuntimeClient() {
  const url = process.env.VITE_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) return null;
  return createSupabaseStrengthCurveClient({ url, serviceRoleKey });
}

export async function getStrengthCurve(exerciseId: string, sex: "male" | "female"): Promise<StrengthCurve | null> {
  const key = `${exerciseId}:${sex}`;
  const cached = curveCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const client = getRuntimeClient();
  if (!client) return null;
  try {
    const value = await client.getCurve(exerciseId, sex);
    curveCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    return value;
  } catch (error) {
    console.warn("[Supabase strength curve] lookup unavailable", {
      exerciseId,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }
}

export type StrengthPercentileRequest = {
  exerciseId: string;
  sex: "male" | "female" | null;
  bodyMassKg?: number | null;
} & OneRepMaxInput;

/**
 * The whole beta route for one lift: fetch the curve, then resolve in the shared engine.
 *
 * A missing curve is an ordinary answer rather than an error, so a catalog exercise with no
 * community data returns `no_curve_for_exercise` and the caller can say so plainly.
 */
export async function getStrengthPercentile(request: StrengthPercentileRequest): Promise<StrengthPercentileResult> {
  if (!request.sex) return { status: "unavailable", reason: "sex_required" };
  const curve = await getStrengthCurve(request.exerciseId, request.sex);
  return resolveStrengthPercentile(curve, request, { sex: request.sex, bodyMassKg: request.bodyMassKg ?? null });
}

/** Test seam: the module-level cache would otherwise leak between cases. */
export function resetStrengthCurveCache() {
  curveCache.clear();
}
