import type { NormsComparisonSex, NormsReferenceRow } from "../shared/normsReference";

/**
 * Server-only adapter over the Sports Genome research project's reference gate.
 *
 * `app_reference_eligibility` is the single source of truth for which norm rows may
 * become an athlete-facing rank. This adapter reads only rows the registry marks
 * `approved` and denormalizes each one into a self-contained NormsReferenceRow, so
 * approving a new source is a reviewed data change rather than a code change.
 *
 * It runs behind the service role and is never reachable from the browser.
 */

type FetchImplementation = typeof fetch;

type NormsRegistryClientConfig = {
  url: string;
  serviceRoleKey: string;
  fetchImplementation?: FetchImplementation;
};

type EligibilityRow = {
  id?: unknown;
  source_table?: unknown;
  source_record_id?: unknown;
  reference_family?: unknown;
  exercise_id?: unknown;
  measurement_type?: unknown;
  unit?: unknown;
  sex?: unknown;
  age_min?: unknown;
  age_max?: unknown;
  training_status?: unknown;
  equipment?: unknown;
  protocol?: unknown;
  competition_conditions?: unknown;
  body_mass_normalization_method?: unknown;
  population_definition?: unknown;
  blocking_reason?: unknown;
  provenance?: unknown;
};

type StrengthNormRow = {
  id?: unknown;
  value?: unknown;
  percentile?: unknown;
  unit?: unknown;
  bodyweight_min_kg?: unknown;
  bodyweight_max_kg?: unknown;
  sample_size?: unknown;
  source_text?: unknown;
  source_study_id?: unknown;
};

type PerformanceNormRow = {
  id?: unknown;
  value?: unknown;
  percentile?: unknown;
  unit?: unknown;
  sample_size?: unknown;
  source_text?: unknown;
  source_study_id?: unknown;
};

type ExerciseRow = { id?: unknown; name?: unknown };

type MappingRow = { supabase_exercise_id?: unknown; local_catalog_id?: unknown };

const CACHE_TTL_MS = 60 * 60 * 1000;
const ID_BATCH_SIZE = 80;

let cache: { expiresAt: number; value: NormsReferenceRow[] } | null = null;

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function comparisonSex(value: unknown): NormsComparisonSex | null {
  return value === "male" || value === "female" ? value : null;
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

export function createNormsRegistryClient({
  url,
  serviceRoleKey,
  fetchImplementation = fetch,
}: NormsRegistryClientConfig) {
  const baseUrl = url.replace(/\/+$/, "");

  async function get<T>(path: string, params: Record<string, string>): Promise<T[]> {
    const requestUrl = new URL(`/rest/v1/${path}`, baseUrl);
    for (const [key, value] of Object.entries(params)) {
      requestUrl.searchParams.set(key, value);
    }
    const response = await fetchImplementation(requestUrl, {
      headers: {
        Accept: "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });
    if (!response.ok) {
      throw new Error(`Supabase ${path} request failed (${response.status})`);
    }
    return (await response.json()) as T[];
  }

  /** Fetches rows whose id is in `ids`, in batches, so the request URL stays bounded. */
  async function getByIds<T>(path: string, select: string, ids: readonly string[]): Promise<T[]> {
    const batches = await Promise.all(
      chunk(ids, ID_BATCH_SIZE).map(batch =>
        get<T>(path, { select, id: `in.(${batch.join(",")})`, limit: String(batch.length) })
      )
    );
    return batches.flat();
  }

  return {
    /**
     * Returns every approved reference cut point, joined to its source norm row,
     * its canonical exercise name, and the approved local-catalog identities that
     * let a saved observation find it.
     */
    async getApprovedReferenceRows(): Promise<NormsReferenceRow[]> {
      const eligibility = await get<EligibilityRow>("app_reference_eligibility", {
        select:
          "id,source_table,source_record_id,reference_family,exercise_id,measurement_type,unit,sex,age_min,age_max,training_status,equipment,protocol,competition_conditions,body_mass_normalization_method,population_definition,blocking_reason,provenance",
        eligibility_status: "eq.approved",
        limit: "5000",
      });

      // Catalog-display approvals (for example the performance-test catalog) carry no
      // percentile and are not a ranking route; they are excluded here.
      const rankable = eligibility.filter(row => {
        const sourceTable = text(row.source_table);
        return sourceTable === "strength_norms" || sourceTable === "performance_norms";
      });
      if (rankable.length === 0) return [];

      const strengthIds = rankable
        .filter(row => text(row.source_table) === "strength_norms")
        .map(row => text(row.source_record_id))
        .filter((id): id is string => id !== null);
      const performanceIds = rankable
        .filter(row => text(row.source_table) === "performance_norms")
        .map(row => text(row.source_record_id))
        .filter((id): id is string => id !== null);
      const exerciseIds = Array.from(
        new Set(rankable.map(row => text(row.exercise_id)).filter((id): id is string => id !== null))
      );

      const [strengthNorms, performanceNorms, exercises, mappings] = await Promise.all([
        strengthIds.length
          ? getByIds<StrengthNormRow>(
              "strength_norms",
              "id,value,percentile,unit,bodyweight_min_kg,bodyweight_max_kg,sample_size,source_text,source_study_id",
              strengthIds
            )
          : Promise.resolve([]),
        performanceIds.length
          ? getByIds<PerformanceNormRow>(
              "performance_norms",
              "id,value,percentile,unit,sample_size,source_text,source_study_id",
              performanceIds
            )
          : Promise.resolve([]),
        exerciseIds.length
          ? getByIds<ExerciseRow>("exercises", "id,name", exerciseIds)
          : Promise.resolve([]),
        get<MappingRow>("app_exercise_source_mappings", {
          select: "supabase_exercise_id,local_catalog_id",
          mapping_status: "eq.approved",
          limit: "2000",
        }),
      ]);

      const strengthById = new Map(
        strengthNorms.map(row => [text(row.id) ?? "", row] as const).filter(([id]) => id !== "")
      );
      const performanceById = new Map(
        performanceNorms.map(row => [text(row.id) ?? "", row] as const).filter(([id]) => id !== "")
      );
      const exerciseNameById = new Map(
        exercises.map(row => [text(row.id) ?? "", text(row.name)] as const).filter(([id]) => id !== "")
      );

      const catalogIdsByExercise = new Map<string, number[]>();
      for (const mapping of mappings) {
        const exerciseId = text(mapping.supabase_exercise_id);
        const catalogId = numberOrNull(mapping.local_catalog_id);
        if (exerciseId === null || catalogId === null) continue;
        const existing = catalogIdsByExercise.get(exerciseId);
        if (existing) existing.push(catalogId);
        else catalogIdsByExercise.set(exerciseId, [catalogId]);
      }

      return rankable
        .map((row): NormsReferenceRow | null => {
          const referenceKey = text(row.id);
          const sourceRecordId = text(row.source_record_id);
          const sourceTable = text(row.source_table);
          const measurementType = text(row.measurement_type);
          if (!referenceKey || !sourceRecordId || !sourceTable || !measurementType) return null;

          const norm =
            sourceTable === "strength_norms"
              ? strengthById.get(sourceRecordId)
              : performanceById.get(sourceRecordId);
          if (!norm) return null;

          const provenance =
            typeof row.provenance === "object" && row.provenance !== null
              ? (row.provenance as Record<string, unknown>)
              : {};

          // The gate row and the norm row each carry percentile and unit. The norm row
          // is the published record, so it wins; the gate's copy is the fallback.
          const percentile = numberOrNull(norm.percentile) ?? numberOrNull(provenance.percentile);
          const value = numberOrNull(norm.value);
          const unit = text(norm.unit) ?? text(row.unit);
          if (percentile === null || value === null || unit === null) return null;

          const exerciseId = text(row.exercise_id);
          const strengthNorm = sourceTable === "strength_norms" ? (norm as StrengthNormRow) : null;

          return {
            referenceKey,
            sourceRecordId,
            sourceTable,
            referenceFamily: text(row.reference_family) ?? sourceTable,
            exerciseId,
            exerciseName: exerciseId ? exerciseNameById.get(exerciseId) ?? null : null,
            localCatalogIds: exerciseId ? catalogIdsByExercise.get(exerciseId) ?? [] : [],
            measurementType,
            unit,
            sex: comparisonSex(row.sex),
            ageMin: numberOrNull(row.age_min),
            ageMax: numberOrNull(row.age_max),
            bodyweightMinKg: strengthNorm ? numberOrNull(strengthNorm.bodyweight_min_kg) : null,
            bodyweightMaxKg: strengthNorm ? numberOrNull(strengthNorm.bodyweight_max_kg) : null,
            trainingStatus: text(row.training_status),
            equipment: text(row.equipment),
            protocol: text(row.protocol),
            competitionConditions: text(row.competition_conditions),
            normalizationMethod: text(row.body_mass_normalization_method),
            populationDefinition: text(row.population_definition),
            percentile,
            value,
            sampleSize: numberOrNull(norm.sample_size) ?? numberOrNull(provenance.sample_size),
            sourceText: text(norm.source_text) ?? text(provenance.source_text),
            sourceStudyId: text(norm.source_study_id) ?? text(provenance.source_study_id),
            boundary: text(row.blocking_reason),
          };
        })
        .filter((row): row is NormsReferenceRow => row !== null);
    },
  };
}

function getRuntimeClient() {
  const url = process.env.VITE_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) return null;
  return createNormsRegistryClient({ url, serviceRoleKey });
}

/**
 * Returns [] (never throws) when the registry is unreachable. An empty registry
 * resolves every observation to an explicit unavailable state, which is the same
 * outcome the app already shows when no reference qualifies - it never degrades
 * into an ungated comparison.
 */
export async function getApprovedNormsReference(): Promise<NormsReferenceRow[]> {
  if (cache && cache.expiresAt > Date.now()) return cache.value;
  const client = getRuntimeClient();
  if (!client) return [];
  try {
    const value = await client.getApprovedReferenceRows();
    cache = { value, expiresAt: Date.now() + CACHE_TTL_MS };
    return value;
  } catch (error) {
    console.warn("[Norms registry] approved reference lookup unavailable", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return [];
  }
}

/** Test seam: drops the memoized registry so a fresh fetch runs. */
export function resetNormsReferenceCache() {
  cache = null;
}
