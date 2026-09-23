import { supabaseServiceHeaders } from "./supabaseServiceHeaders";
import type {
  SupabaseSportExerciseRecommendation,
  SupabaseSportMovementDemand,
  SupabaseSportMuscleDemand,
  SupabaseSportProfile,
  SupabaseSportQualityDemand,
} from "../shared/supabaseSportProfile";

type FetchImplementation = typeof fetch;

type SupabaseSportProfileClientConfig = {
  url: string;
  serviceRoleKey: string;
  fetchImplementation?: FetchImplementation;
};

type SportRow = { id?: unknown; name?: unknown; category?: unknown };

type MovementDemandRow = {
  importance_weight?: unknown;
  confidence_score?: unknown;
  movement_patterns?: { name?: unknown } | { name?: unknown }[] | null;
};

type MuscleDemandRow = {
  importance_weight?: unknown;
  confidence_score?: unknown;
  muscles?: { name?: unknown; region?: unknown } | { name?: unknown; region?: unknown }[] | null;
};

type QualityDemandRow = {
  importance_weight?: unknown;
  confidence_score?: unknown;
  athletic_attributes?: { name?: unknown } | { name?: unknown }[] | null;
};

type RecommendationRow = {
  recommendation_goal?: unknown;
  recommendation_role?: unknown;
  confidence_score?: unknown;
  effect_metric?: unknown;
  effect_size?: unknown;
  rationale?: unknown;
  dose_summary?: unknown;
  exercises?:
    | { name?: unknown; source_catalog_id?: unknown }
    | { name?: unknown; source_catalog_id?: unknown }[]
    | null;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const profileCache = new Map<
  string,
  { expiresAt: number; value: SupabaseSportProfile }
>();

const CONNECTED_BOUNDARY =
  "Sport demand and recommendation records describe population-level evidence from the Sports Genome research registry. They add reasoning context here and do not replace the local exercise catalog, athlete-specific mechanics, or existing recommendation scoring.";

function textOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function integerOrNull(value: unknown): number | null {
  const parsed = numberOrNull(value);
  return parsed === null ? null : Math.trunc(parsed);
}

function embedded<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/** The client's sport ids are kebab-case (e.g. "brazilian-jiu-jitsu"); the registry uses snake_case canonical names. */
export function toSportCanonicalName(sportId: string): string {
  return sportId.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function unavailableProfile(
  sportId: string,
  status: "not_mapped" | "unavailable"
): SupabaseSportProfile {
  return {
    status,
    sportId,
    sportName: null,
    category: null,
    movementDemands: [],
    muscleDemands: [],
    qualityDemands: [],
    recommendations: [],
    boundary:
      "The upstream sport evidence registry does not have a matching record. Local sport, movement, and recommendation logic remains in use unchanged.",
  };
}

export function createSupabaseSportProfileClient({
  url,
  serviceRoleKey,
  fetchImplementation = fetch,
}: SupabaseSportProfileClientConfig) {
  const baseUrl = url.replace(/\/+$/, "");

  async function getRows<T>(
    table: string,
    params: Record<string, string>
  ): Promise<T[]> {
    const requestUrl = new URL(`/rest/v1/${table}`, baseUrl);
    for (const [key, value] of Object.entries(params)) {
      requestUrl.searchParams.set(key, value);
    }
    const response = await fetchImplementation(requestUrl, {
      headers: supabaseServiceHeaders(serviceRoleKey),
    });
    if (!response.ok) {
      throw new Error(`Supabase ${table} request failed (${response.status})`);
    }
    return (await response.json()) as T[];
  }

  return {
    async getSportProfile(sportId: string): Promise<SupabaseSportProfile> {
      const canonicalName = toSportCanonicalName(sportId);
      const sports = await getRows<SportRow>("sports", {
        canonical_name: `eq.${canonicalName}`,
        select: "id,name,category",
        limit: "1",
      });
      const sport = sports[0];
      if (!sport || typeof sport.id !== "string") {
        return unavailableProfile(sportId, "not_mapped");
      }
      const sportRowId = sport.id;

      const [movementRows, muscleRows, qualityRows, recommendationRows] =
        await Promise.all([
          getRows<MovementDemandRow>("sport_movement_demands", {
            sport_id: `eq.${sportRowId}`,
            select: "importance_weight,confidence_score,movement_patterns(name)",
            order: "importance_weight.desc.nullslast",
            limit: "6",
          }),
          getRows<MuscleDemandRow>("sport_muscle_demands", {
            sport_id: `eq.${sportRowId}`,
            select: "importance_weight,confidence_score,muscles(name,region)",
            order: "importance_weight.desc.nullslast",
            limit: "8",
          }),
          getRows<QualityDemandRow>("sport_demands", {
            sport_id: `eq.${sportRowId}`,
            select: "importance_weight,confidence_score,athletic_attributes(name)",
            order: "importance_weight.desc.nullslast",
            limit: "8",
          }),
          getRows<RecommendationRow>("sport_exercise_recommendations", {
            sport_id: `eq.${sportRowId}`,
            exercise_id: "not.is.null",
            select:
              "recommendation_goal,recommendation_role,confidence_score,effect_metric,effect_size,rationale,dose_summary,exercises(name,source_catalog_id)",
            order: "confidence_score.desc.nullslast",
            limit: "8",
          }),
        ]);

      const movementDemands: SupabaseSportMovementDemand[] = movementRows
        .map(row => ({
          patternName: textOrNull(embedded(row.movement_patterns)?.name),
          importanceWeight: numberOrNull(row.importance_weight),
          confidenceScore: numberOrNull(row.confidence_score),
        }))
        .filter((row): row is SupabaseSportMovementDemand => row.patternName !== null);

      const muscleDemands: SupabaseSportMuscleDemand[] = muscleRows
        .map(row => {
          const muscle = embedded(row.muscles);
          return {
            muscleName: textOrNull(muscle?.name),
            region: textOrNull(muscle?.region),
            importanceWeight: numberOrNull(row.importance_weight),
            confidenceScore: numberOrNull(row.confidence_score),
          };
        })
        .filter((row): row is SupabaseSportMuscleDemand => row.muscleName !== null);

      const qualityDemands: SupabaseSportQualityDemand[] = qualityRows
        .map(row => ({
          qualityName: textOrNull(embedded(row.athletic_attributes)?.name),
          importanceWeight: numberOrNull(row.importance_weight),
          confidenceScore: numberOrNull(row.confidence_score),
        }))
        .filter((row): row is SupabaseSportQualityDemand => row.qualityName !== null);

      const recommendations: SupabaseSportExerciseRecommendation[] = recommendationRows
        .map(row => {
          const exercise = embedded(row.exercises);
          const exerciseName = textOrNull(exercise?.name);
          if (!exerciseName) return null;
          return {
            catalogExerciseId: integerOrNull(exercise?.source_catalog_id),
            exerciseName,
            recommendationGoal: textOrNull(row.recommendation_goal),
            recommendationRole: textOrNull(row.recommendation_role),
            confidenceScore: numberOrNull(row.confidence_score),
            effectMetric: textOrNull(row.effect_metric),
            effectSize: numberOrNull(row.effect_size),
            rationale: textOrNull(row.rationale),
            doseSummary: textOrNull(row.dose_summary),
          };
        })
        .filter((row): row is SupabaseSportExerciseRecommendation => row !== null);

      return {
        status: "connected",
        sportId,
        sportName: textOrNull(sport.name),
        category: textOrNull(sport.category),
        movementDemands,
        muscleDemands,
        qualityDemands,
        recommendations,
        boundary: CONNECTED_BOUNDARY,
      };
    },
  };
}

function getRuntimeClient() {
  const url = process.env.VITE_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) return null;
  return createSupabaseSportProfileClient({ url, serviceRoleKey });
}

export async function getSupabaseSportProfile(
  sportId: string
): Promise<SupabaseSportProfile> {
  const cached = profileCache.get(sportId);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const client = getRuntimeClient();
  if (!client) return unavailableProfile(sportId, "unavailable");
  try {
    const value = await client.getSportProfile(sportId);
    profileCache.set(sportId, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    return value;
  } catch (error) {
    console.warn("[Supabase sport profile] lookup unavailable", {
      sportId,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return unavailableProfile(sportId, "unavailable");
  }
}
