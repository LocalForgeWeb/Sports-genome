import { supabaseServiceHeaders } from "./supabaseServiceHeaders";
import {
  curvePlacement,
  resolveStrengthPercentile,
  type OneRepMaxInput,
  type StrengthCurve,
  type StrengthCurveUnit,
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
  unit?: unknown;
  source_role?: unknown;
  confidence_cap?: unknown;
  percentile?: unknown;
  value?: unknown;
};

/** One line of the exercise index: enough to go from a logged lift to a curve. */
export type CurveExerciseRow = {
  exerciseId: string;
  canonicalName: string;
  displayName: string;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const curveCache = new Map<string, { expiresAt: number; value: StrengthCurve | null }>();

const normMethods: StrengthNormMethod[] = [
  "direct_community_relative_1rm_percentile",
  "direct_community_1rm_percentile",
  "absolute_1RM",
  "direct_community_rep_percentile",
  "bodyweight_repetition_max",
];

const curveUnits: StrengthCurveUnit[] = ["x_bodyweight", "kg", "lb", "lb_1rm", "reps"];

const CURVE_SELECT = "exercise_id,sex,normalization_method,unit,source_role,confidence_cap,percentile,value";

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
      unit: textOrNull(row.unit),
      role: textOrNull(row.source_role),
      cap: numberOrNull(row.confidence_cap),
      percentile: numberOrNull(row.percentile),
      value: numberOrNull(row.value),
      sex: textOrNull(row.sex),
    }))
    .filter(row =>
      row.method !== null &&
      (normMethods as string[]).includes(row.method) &&
      row.unit !== null &&
      (curveUnits as string[]).includes(row.unit) &&
      row.role === "beta_fallback" &&
      row.percentile !== null &&
      row.value !== null &&
      row.sex === sex
    );
  if (usable.length < 2) return null;

  // Grouped by method AND unit. Method alone is not enough: the same method name is stored
  // against more than one unit, and a ladder built from pounds and bodyweight multiples together
  // is not a ladder at all.
  const byLadder = new Map<string, typeof usable>();
  for (const row of usable) {
    const key = `${row.method}|${row.unit}`;
    const bucket = byLadder.get(key) ?? [];
    bucket.push(row);
    byLadder.set(key, bucket);
  }

  const ladders: (typeof usable)[] = [];
  byLadder.forEach(bucket => { if (bucket.length >= 2) ladders.push(bucket); });
  if (!ladders.length) return null;

  /**
   * Which ladder answers "how strong is this lift".
   *
   * A bodyweight-relative curve is what the scoring version asks for, so it leads. An absolute
   * curve answers the same question in a different unit and comes next. A rep curve answers a
   * different question entirely and is only taken when it is all there is — where the engine
   * then refuses it by name rather than placing a load on it.
   */
  const rank = (bucket: typeof usable) => {
    const placement = curvePlacement({ unit: bucket[0].unit as StrengthCurveUnit });
    return placement === "relative" ? 0 : placement === "not_one_rep_max" ? 2 : 1;
  };
  const chosen = ladders.sort((first, second) => rank(first) - rank(second) || second.length - first.length)[0];

  const caps = chosen.map(row => row.cap).filter((cap): cap is number => cap !== null);
  return {
    exerciseId,
    sex,
    normalizationMethod: chosen[0].method as StrengthNormMethod,
    unit: chosen[0].unit as StrengthCurveUnit,
    sourceRole: "beta_fallback" as StrengthSourceRole,
    // The strictest cap among the contributing rows, so one lenient row cannot raise the ceiling.
    confidenceCap: caps.length ? Math.min(...caps) : null,
    anchors: chosen.map(row => ({ percentile: row.percentile as number, value: row.value as number })),
  };
}

/**
 * The catalog id a curve's canonical name carries, e.g. `barbell_bench_press__catalog_1` -> 1.
 *
 * The research side already wrote the app's own catalog id into the canonical name, which makes
 * this an exact join rather than a name match. Curves whose name carries no id are reachable by
 * display name only.
 */
export function catalogIdFromCanonicalName(canonicalName: string): number | null {
  const match = /__catalog_(\d+)$/.exec(canonicalName.trim());
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function comparableName(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Finds the curve's exercise for a lift the athlete logged.
 *
 * Catalog id first, because it cannot be wrong. The display name is the fallback for the handful
 * of curves whose canonical name has no id attached, compared loosely enough that a hyphen or a
 * capital does not lose a match.
 */
export function findCurveExercise(
  index: readonly CurveExerciseRow[],
  lift: { catalogExerciseId?: number | null; exerciseName?: string | null }
): CurveExerciseRow | null {
  if (lift.catalogExerciseId) {
    const byId = index.find(row => catalogIdFromCanonicalName(row.canonicalName) === lift.catalogExerciseId);
    if (byId) return byId;
  }
  const wanted = comparableName(lift.exerciseName || "");
  if (!wanted) return null;
  return index.find(row => comparableName(row.displayName) === wanted)
    ?? index.find(row => comparableName(row.canonicalName.replace(/__catalog_\d+$/, "").replace(/_/g, " ")) === wanted)
    ?? null;
}

export function createSupabaseStrengthCurveClient({
  url,
  serviceRoleKey,
  fetchImplementation = fetch,
}: SupabaseStrengthCurveClientConfig) {
  const baseUrl = url.replace(/\/+$/, "");
  const headers = supabaseServiceHeaders(serviceRoleKey);

  return {
    async getCurve(exerciseId: string, sex: "male" | "female"): Promise<StrengthCurve | null> {
      const requestUrl = new URL("/rest/v1/app_strength_beta_curves_v1", baseUrl);
      requestUrl.searchParams.set("select", CURVE_SELECT);
      requestUrl.searchParams.set("exercise_id", `eq.${exerciseId}`);
      requestUrl.searchParams.set("sex", `eq.${sex}`);
      requestUrl.searchParams.set("order", "percentile.asc");
      const response = await fetchImplementation(requestUrl, { headers });
      if (!response.ok) throw new Error(`Supabase strength curve request failed (${response.status})`);
      const rows = (await response.json()) as CurveRow[];
      return assembleCurve(rows, exerciseId, sex);
    },

    /**
     * Every exercise that has a curve, once, so a logged lift can be matched to one.
     *
     * The view has a row per anchor, so this arrives long and is deduplicated here rather than
     * asking Postgres for a DISTINCT the REST layer does not offer.
     */
    async getExerciseIndex(): Promise<CurveExerciseRow[]> {
      const requestUrl = new URL("/rest/v1/app_strength_beta_curves_v1", baseUrl);
      requestUrl.searchParams.set("select", "exercise_id,exercise_canonical_name,exercise_name");
      const response = await fetchImplementation(requestUrl, { headers });
      if (!response.ok) throw new Error(`Supabase strength curve index request failed (${response.status})`);
      const rows = (await response.json()) as Record<string, unknown>[];
      const seen = new Map<string, CurveExerciseRow>();
      for (const row of rows) {
        const exerciseId = textOrNull(row.exercise_id);
        const canonicalName = textOrNull(row.exercise_canonical_name);
        if (!exerciseId || !canonicalName || seen.has(exerciseId)) continue;
        seen.set(exerciseId, {
          exerciseId,
          canonicalName,
          displayName: textOrNull(row.exercise_name) || canonicalName,
        });
      }
      const index: CurveExerciseRow[] = [];
      seen.forEach(row => index.push(row));
      return index;
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

const indexCache: { expiresAt: number; value: CurveExerciseRow[] } = { expiresAt: 0, value: [] };

/** The exercise index, cached like the curves themselves; an outage returns an empty index. */
export async function getCurveExerciseIndex(): Promise<CurveExerciseRow[]> {
  if (indexCache.expiresAt > Date.now()) return indexCache.value;
  const client = getRuntimeClient();
  if (!client) return [];
  try {
    const value = await client.getExerciseIndex();
    indexCache.expiresAt = Date.now() + CACHE_TTL_MS;
    indexCache.value = value;
    return value;
  } catch (error) {
    console.warn("[Supabase strength curve] index unavailable", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return [];
  }
}

export type StrengthPercentileRequest = {
  /** The curve's own exercise id, when the caller already holds one. */
  exerciseId?: string | null;
  /** What the athlete logged: the app's catalog id, and the name they saw. */
  catalogExerciseId?: number | null;
  exerciseName?: string | null;
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
  const exerciseId = request.exerciseId?.trim()
    || (await getCurveExerciseIndex().then(index => findCurveExercise(index, request)?.exerciseId));
  if (!exerciseId) return { status: "unavailable", reason: "no_curve_for_exercise" };
  const curve = await getStrengthCurve(exerciseId, request.sex);
  return resolveStrengthPercentile(curve, request, { sex: request.sex, bodyMassKg: request.bodyMassKg ?? null });
}

/**
 * The same route for a list of lifts, answered in the order asked.
 *
 * The Progress section reads every lift the athlete has a trend for, and one round trip per
 * lift was N requests for one screen. The exercise index and each curve are cached, so the
 * only cost per extra lift is the resolution itself.
 */
export async function getStrengthPercentiles(requests: readonly StrengthPercentileRequest[]): Promise<StrengthPercentileResult[]> {
  return Promise.all(requests.map(request => getStrengthPercentile(request)));
}

/** Test seam: the module-level caches would otherwise leak between cases. */
export function resetStrengthCurveCache() {
  curveCache.clear();
  indexCache.expiresAt = 0;
  indexCache.value = [];
}
