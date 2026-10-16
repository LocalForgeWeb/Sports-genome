import { supabaseServiceHeaders } from "./supabaseServiceHeaders";
import { BoundedCache, withTimeout } from "./boundedCache";
import { comparableName, numberOrNull, textOrNull } from "./rowValues";
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
import { upstreamFetch } from "./_core/http";
import { loadConventionFor } from "../shared/loadConventions";

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
  source_study_id?: unknown;
};

/** One line of the exercise index: enough to go from a logged lift to a curve. */
export type CurveExerciseRow = {
  exerciseId: string;
  canonicalName: string;
  displayName: string;
};

/**
 * A link from an exercise with no curve of its own to a related exercise's curve, as the
 * database's `strength_norm_curve_aliases` (loads) and `strength_rep_curve_aliases` (rep counts)
 * hold it for scoring version `strength_beta_v1`.
 */
export type CurveAlias = { sourceExerciseId: string; multiplier: number; confidenceModifier: number };
export type CurveAliases = Record<CurveKind, ReadonlyMap<string, CurveAlias>>;

const CACHE_TTL_MS = 5 * 60 * 1000;
// Bounded: the key comes from the caller (exercise id and sex).
const curveCache = new BoundedCache<string, StrengthCurve | null>(500, CACHE_TTL_MS);
// Fetches in flight, so lifts that miss the cache at once share one request. An entry lives only
// until its fetch settles, which keeps the map as small as the number of requests running.
const pendingCurves = new Map<string, Promise<StrengthCurve | null>>();

const normMethods: StrengthNormMethod[] = [
  "direct_community_relative_1rm_percentile",
  "direct_community_1rm_percentile",
  "absolute_1RM",
  "direct_community_rep_percentile",
  "bodyweight_repetition_max",
];

const curveUnits: StrengthCurveUnit[] = ["x_bodyweight", "kg", "lb", "lb_1rm", "reps"];

const CURVE_SELECT = "exercise_id,sex,normalization_method,unit,source_role,confidence_cap,percentile,value,source_study_id";

/**
 * Turns anchor rows into one curve.
 *
 * A curve mixing normalization methods is not a curve — kg and kg-per-kg anchors on one ladder
 * would place a lift against the wrong scale — so the most common method wins and the rest are
 * dropped rather than blended.
 */
/**
 * Which ladder a request needs: a load's (one-rep-max curves first), or a rep count's - the rep
 * curve only, for a movement scored on reps done without added load.
 */
export type CurveKind = "load" | "reps";

export function assembleCurve(rows: readonly CurveRow[], exerciseId: string, sex: "male" | "female", kind: CurveKind = "load"): StrengthCurve | null {
  const usable = rows
    .map(row => ({
      method: textOrNull(row.normalization_method),
      unit: textOrNull(row.unit),
      role: textOrNull(row.source_role),
      cap: numberOrNull(row.confidence_cap),
      percentile: numberOrNull(row.percentile),
      value: numberOrNull(row.value),
      sex: textOrNull(row.sex),
      source: textOrNull(row.source_study_id),
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
  byLadder.forEach(bucket => {
    if (bucket.length < 2) return;
    // A rep count belongs on a rep ladder and nowhere else; a load may fall back to one only to be refused by name.
    if (kind === "reps" && curvePlacement({ unit: bucket[0].unit as StrengthCurveUnit }) !== "not_one_rep_max") return;
    ladders.push(bucket);
  });
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
  // One source for the whole ladder, or none: an age table applies to the study it came from,
  // and a ladder that mixed sources could not say which study's table to use.
  const sources = new Set(chosen.map(row => row.source));
  const sourceStudyId = sources.size === 1 ? chosen[0].source : null;
  return {
    exerciseId,
    sourceStudyId,
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

/**
 * Active aliases by the exercise they answer for. A row without a usable multiplier or with a
 * confidence modifier outside 0-1 is dropped rather than repaired; the first row for a target
 * wins, as the database's own lookup takes one.
 */
export function aliasesFrom(rows: readonly Record<string, unknown>[], multiplierColumn: "e1rm_multiplier" | "reps_multiplier"): Map<string, CurveAlias> {
  const aliases = new Map<string, CurveAlias>();
  for (const row of rows) {
    const target = textOrNull(row.target_exercise_id);
    const source = textOrNull(row.source_exercise_id);
    const multiplier = numberOrNull(row[multiplierColumn]);
    const confidenceModifier = numberOrNull(row.confidence_modifier);
    if (!target || !source || target === source || aliases.has(target)) continue;
    if (row.is_active === false) continue;
    if (multiplier === null || multiplier <= 0 || confidenceModifier === null || confidenceModifier < 0 || confidenceModifier > 1) continue;
    aliases.set(target, { sourceExerciseId: source, multiplier, confidenceModifier });
  }
  return aliases;
}

export function createSupabaseStrengthCurveClient({
  url,
  serviceRoleKey,
  fetchImplementation = upstreamFetch,
}: SupabaseStrengthCurveClientConfig) {
  const baseUrl = url.replace(/\/+$/, "");
  const headers = supabaseServiceHeaders(serviceRoleKey);

  return {
    async getCurve(exerciseId: string, sex: "male" | "female", kind: CurveKind = "load"): Promise<StrengthCurve | null> {
      const requestUrl = new URL("/rest/v1/app_strength_beta_curves_v1", baseUrl);
      requestUrl.searchParams.set("select", CURVE_SELECT);
      requestUrl.searchParams.set("exercise_id", `eq.${exerciseId}`);
      requestUrl.searchParams.set("sex", `eq.${sex}`);
      requestUrl.searchParams.set("order", "percentile.asc");
      const response = await fetchImplementation(requestUrl, withTimeout({ headers }));
      if (!response.ok) throw new Error(`Supabase strength curve request failed (${response.status})`);
      const rows = (await response.json()) as CurveRow[];
      return assembleCurve(rows, exerciseId, sex, kind);
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
      const response = await fetchImplementation(requestUrl, withTimeout({ headers }));
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

    /**
     * Every catalog exercise, curve or not - the same rows the muscle ranks look a lift up in -
     * so a lift scored through a related exercise's curve is found too.
     */
    async getCatalogExercises(): Promise<CurveExerciseRow[]> {
      const requestUrl = new URL("/rest/v1/exercises", baseUrl);
      requestUrl.searchParams.set("select", "id,name,canonical_name");
      requestUrl.searchParams.set("canonical_name", "like.*__catalog_*");
      const response = await fetchImplementation(requestUrl, withTimeout({ headers }));
      if (!response.ok) throw new Error(`Supabase exercise catalog request failed (${response.status})`);
      const rows = (await response.json()) as Record<string, unknown>[];
      return rows.flatMap(row => {
        const exerciseId = textOrNull(row.id);
        const canonicalName = textOrNull(row.canonical_name);
        return exerciseId && canonicalName ? [{ exerciseId, canonicalName, displayName: textOrNull(row.name) || canonicalName }] : [];
      });
    },

    /** The active aliases of both kinds, read whole: a few hundred rows at most. */
    async getAliases(): Promise<CurveAliases> {
      const read = async (table: string, multiplierColumn: "e1rm_multiplier" | "reps_multiplier") => {
        const requestUrl = new URL(`/rest/v1/${table}`, baseUrl);
        requestUrl.searchParams.set("select", `target_exercise_id,source_exercise_id,${multiplierColumn},confidence_modifier,is_active`);
        requestUrl.searchParams.set("scoring_version", "eq.strength_beta_v1");
        requestUrl.searchParams.set("is_active", "is.true");
        const response = await fetchImplementation(requestUrl, withTimeout({ headers }));
        if (!response.ok) throw new Error(`Supabase ${table} request failed (${response.status})`);
        const rows = (await response.json()) as Record<string, unknown>[];
        return aliasesFrom(Array.isArray(rows) ? rows : [], multiplierColumn);
      };
      const [load, reps] = await Promise.all([read("strength_norm_curve_aliases", "e1rm_multiplier"), read("strength_rep_curve_aliases", "reps_multiplier")]);
      return { load, reps };
    },
  };
}

type StrengthCurveClient = ReturnType<typeof createSupabaseStrengthCurveClient>;

function getRuntimeClient() {
  const url = process.env.VITE_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) return null;
  return createSupabaseStrengthCurveClient({ url, serviceRoleKey });
}

export async function getStrengthCurve(exerciseId: string, sex: "male" | "female", kind: CurveKind = "load"): Promise<StrengthCurve | null> {
  const key = `${exerciseId}:${sex}:${kind}`;
  const cached = curveCache.get(key);
  if (cached !== undefined) return cached;
  const client = getRuntimeClient();
  if (!client) return null;
  const pending = pendingCurves.get(key);
  if (pending) return pending;
  const request = (async () => {
    try {
      const value = await client.getCurve(exerciseId, sex, kind);
      curveCache.set(key, value);
      return value;
    } catch (error) {
      console.warn("[Supabase strength curve] lookup unavailable", {
        exerciseId,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    } finally {
      pendingCurves.delete(key);
    }
  })();
  pendingCurves.set(key, request);
  return request;
}

/**
 * A whole table, read once and kept for the cache window. Requests that miss together share one
 * fetch. A failure is not cached and answers `empty`, so the next request after an outage tries
 * again. `read` is async, so it cannot throw before the shared fetch is recorded.
 */
function cachedRead<T>(what: string, empty: T, read: (client: StrengthCurveClient) => Promise<T>) {
  const state: { expiresAt: number; value: T; pending: Promise<T> | null } = { expiresAt: 0, value: empty, pending: null };
  return {
    async get(): Promise<T> {
      if (state.expiresAt > Date.now()) return state.value;
      const client = getRuntimeClient();
      if (!client) return empty;
      if (state.pending) return state.pending;
      const request = (async () => {
        try {
          const value = await read(client);
          state.expiresAt = Date.now() + CACHE_TTL_MS;
          state.value = value;
          return value;
        } catch (error) {
          console.warn(`[Supabase strength curve] ${what} unavailable`, {
            message: error instanceof Error ? error.message : "Unknown error",
          });
          return empty;
        } finally {
          state.pending = null;
        }
      })();
      state.pending = request;
      return request;
    },
    reset() {
      state.expiresAt = 0;
      state.value = empty;
      state.pending = null;
    },
  };
}

const curveIndex = cachedRead<CurveExerciseRow[]>("index", [], client => client.getExerciseIndex());
const catalogIndex = cachedRead<CurveExerciseRow[]>("exercise catalog", [], client => client.getCatalogExercises());
const curveAliases = cachedRead<CurveAliases>("aliases", { load: new Map(), reps: new Map() }, client => client.getAliases());

/** The exercise index, cached like the curves themselves; an outage returns an empty index. */
export function getCurveExerciseIndex(): Promise<CurveExerciseRow[]> {
  return curveIndex.get();
}

/**
 * The exercise a logged lift names, and its catalog id.
 *
 * The catalog id first, because it cannot be wrong: among the exercises with a curve of their
 * own, then across the whole catalog, which also holds the ones scored through a related lift.
 * The name is the fallback, in the same order. The catalog is read only when the curve index
 * has no answer.
 */
export async function findLoggedExercise(request: Pick<StrengthPercentileRequest, "catalogExerciseId" | "exerciseName">): Promise<{ exerciseId: string; catalogId: number | null } | null> {
  const byIdOnly = { catalogExerciseId: request.catalogExerciseId, exerciseName: null };
  const withCurve = await getCurveExerciseIndex();
  let found = findCurveExercise(withCurve, byIdOnly);
  if (!found) {
    const catalog = await catalogIndex.get();
    found = findCurveExercise(catalog, byIdOnly) ?? findCurveExercise(withCurve, request) ?? findCurveExercise(catalog, request);
  }
  return found ? { exerciseId: found.exerciseId, catalogId: catalogIdFromCanonicalName(found.canonicalName) } : null;
}

/**
 * A related exercise's curve, for an exercise with none of its own, carrying the alias's
 * multiplier and confidence modifier - the database's alias step in `get_beta_strength_percentile_v1`
 * and `get_beta_rep_percentile_v1`, so the card and the ranks read the lift the same way.
 */
export async function getAliasedCurve(exerciseId: string, sex: "male" | "female", kind: CurveKind = "load"): Promise<StrengthCurve | null> {
  const alias = (await curveAliases.get())[kind].get(exerciseId);
  if (!alias) return null;
  const source = await getStrengthCurve(alias.sourceExerciseId, sex, kind);
  if (!source) return null;
  return {
    ...source,
    exerciseId,
    aliasOfExerciseId: alias.sourceExerciseId,
    alias: { multiplier: alias.multiplier, confidenceModifier: alias.confidenceModifier },
  };
}

export type StrengthPercentileRequest = {
  /** The curve's own exercise id, when the caller already holds one. */
  exerciseId?: string | null;
  /** What the athlete logged: the app's catalog id, and the name they saw. */
  catalogExerciseId?: number | null;
  exerciseName?: string | null;
  sex: "male" | "female" | null;
  bodyMassKg?: number | null;
  /** Age on the day of the lift, from the birth year the athlete has given, whenever given. */
  ageYears?: number | null;
} & OneRepMaxInput;

/**
 * The whole beta route for one lift: fetch the curve, then resolve in the shared engine.
 *
 * An exercise with no curve of its own is read on a related exercise's, where the database links
 * one. A missing curve is an ordinary answer rather than an error, so a catalog exercise with no
 * community data and no link returns `no_curve_for_exercise` and the caller can say so plainly.
 */
export async function getStrengthPercentile(request: StrengthPercentileRequest): Promise<StrengthPercentileResult> {
  if (!request.sex) return { status: "unavailable", reason: "sex_required" };
  const given = request.exerciseId?.trim();
  const exercise = given ? { exerciseId: given, catalogId: null } : await findLoggedExercise(request);
  if (!exercise) return { status: "unavailable", reason: "no_curve_for_exercise" };
  const repsOnly = isRepCountRequest(request, exercise.catalogId);
  const kind: CurveKind = repsOnly ? "reps" : "load";
  // Its own curve, or else a related exercise's through the database's alias, as the ranks read it.
  const curve = await getStrengthCurve(exercise.exerciseId, request.sex, kind) ?? await getAliasedCurve(exercise.exerciseId, request.sex, kind);
  // `repsOnly` comes from the exercise's own convention, never from the caller.
  const { repsOnly: _ignored, ...lift } = request;
  return resolveStrengthPercentile(curve, { ...lift, repsOnly }, { sex: request.sex, bodyMassKg: request.bodyMassKg ?? null, ageYears: request.ageYears ?? null });
}

/**
 * A set the muscle ranks would score on reps: a movement whose convention is `bodyweight_reps`
 * (shared/loadConventions.ts, the scoring policy's), done for reps without added load or a
 * measured max. A loaded set of the same movement keeps its old route.
 */
export function isRepCountRequest(request: Pick<StrengthPercentileRequest, "catalogExerciseId" | "loadKg" | "measuredOneRmKg" | "repetitions">, curveCatalogId: number | null): boolean {
  const catalogId = curveCatalogId ?? request.catalogExerciseId ?? null;
  if (loadConventionFor(catalogId) !== "bodyweight_reps") return false;
  if ((request.loadKg ?? 0) > 0 || (request.measuredOneRmKg ?? 0) > 0) return false;
  return (request.repetitions ?? 0) >= 1;
}

/**
 * The same route for a list of lifts, answered in the order asked.
 *
 * The Progress section reads every lift the athlete has a trend for, and one round trip per
 * lift was N requests for one screen. The exercise index and each curve are cached, and lifts
 * that miss the cache at once share one fetch, so the only cost per extra lift is the
 * resolution itself.
 */
export async function getStrengthPercentiles(requests: readonly StrengthPercentileRequest[]): Promise<StrengthPercentileResult[]> {
  return Promise.all(requests.map(request => getStrengthPercentile(request)));
}

/** Test seam: the module-level caches would otherwise leak between cases. */
export function resetStrengthCurveCache() {
  curveCache.clear();
  pendingCurves.clear();
  curveIndex.reset();
  catalogIndex.reset();
  curveAliases.reset();
}
