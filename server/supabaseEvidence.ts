import type {
  SupabaseEvidenceCoverageLevel,
  SupabaseEvidenceInventory,
  SupabaseEvidenceSource,
  SupabaseExerciseEvidence,
} from "../shared/supabaseEvidence";

type FetchImplementation = typeof fetch;

type SupabaseEvidenceClientConfig = {
  url: string;
  serviceRoleKey: string;
  fetchImplementation?: FetchImplementation;
};

type EmbeddedStudy = {
  id?: unknown;
  title?: unknown;
  publication_year?: unknown;
  source_url?: unknown;
  study_type?: unknown;
  population_summary?: unknown;
  sex?: unknown;
  training_status?: unknown;
  sport_population?: unknown;
  evidence_level?: unknown;
};

type EmbeddedCoverage = {
  coverage_level?: unknown;
  anchor_metric?: unknown;
  studies?: EmbeddedStudy | EmbeddedStudy[] | null;
};

type SupabaseExerciseRow = {
  id?: unknown;
  canonical_name?: unknown;
  exercise_evidence_coverage?: EmbeddedCoverage | EmbeddedCoverage[] | null;
};

type SupabaseOutcomeRow = {
  metric?: unknown;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const evidenceCache = new Map<
  number,
  { expiresAt: number; value: SupabaseExerciseEvidence }
>();
let inventoryCache:
  | { expiresAt: number; value: SupabaseEvidenceInventory }
  | undefined;

function textOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : null;
}

function getCoverageLevel(value: unknown): SupabaseEvidenceCoverageLevel {
  return value === "direct_norm" ||
    value === "direct_outcome" ||
    value === "variant_derived" ||
    value === "movement_derived"
    ? value
    : "unavailable";
}

function coverageLabel(level: SupabaseEvidenceCoverageLevel): string {
  switch (level) {
    case "direct_norm":
      return "Direct normative reference";
    case "direct_outcome":
      return "Direct exercise outcome";
    case "variant_derived":
      return "Variant-derived context";
    case "movement_derived":
      return "Movement-derived context";
    default:
      return "Source record unavailable";
  }
}

function sourceFromEmbeddedRecord(value: unknown): SupabaseEvidenceSource | null {
  const study = Array.isArray(value) ? value[0] : value;
  if (!study || typeof study !== "object") return null;
  const record = study as EmbeddedStudy;
  const title = textOrNull(record.title);
  const sourceUrl = textOrNull(record.source_url);
  if (!title || !sourceUrl) return null;

  return {
    title,
    publicationYear: numberOrNull(record.publication_year),
    sourceUrl,
    studyType: textOrNull(record.study_type),
    populationSummary: textOrNull(record.population_summary),
    sex: textOrNull(record.sex),
    trainingStatus: textOrNull(record.training_status),
    sportPopulation: textOrNull(record.sport_population),
    evidenceLevel: textOrNull(record.evidence_level),
  };
}

function sourceIdFromEmbeddedRecord(value: unknown): string | null {
  const study = Array.isArray(value) ? value[0] : value;
  if (!study || typeof study !== "object") return null;
  return textOrNull((study as EmbeddedStudy).id);
}

function outcomeMetricLabels(rows: SupabaseOutcomeRow[]): string[] {
  const labels = new Set<string>();
  for (const row of rows) {
    const metric = textOrNull(row.metric);
    if (!metric) continue;
    labels.add(
      metric
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 90)
    );
    if (labels.size === 3) break;
  }
  return Array.from(labels);
}

function parseExactCount(response: Response, fallback: number): number {
  const range = response.headers.get("content-range");
  const total = range?.match(/\/(\d+)$/)?.[1];
  return total ? Number(total) : fallback;
}

function unavailableEvidence(
  catalogExerciseId: number,
  status: "not_mapped" | "unavailable"
): SupabaseExerciseEvidence {
  return {
    status,
    catalogExerciseId,
    canonicalExerciseName: null,
    coverageLevel: "unavailable",
    coverageLabel: "Source record unavailable",
    anchorMetric: null,
    source: null,
    normativeRecordCount: 0,
    sourceOutcomeCount: 0,
    sourceOutcomeMetrics: [],
    boundary:
      "The local catalog evidence summary remains in use. A missing or unavailable upstream record never changes an exercise score, recommendation, or athlete comparison.",
  };
}

function unavailableInventory(): SupabaseEvidenceInventory {
  return {
    status: "unavailable",
    sourceExercises: 0,
    localCatalogLinks: 0,
    sourceOnlyExercises: 0,
    linkedCoverageRecords: 0,
    studies: 0,
    studyOutcomes: 0,
    strengthNorms: 0,
    performanceTests: 0,
    performanceNorms: 0,
    strengthEstimationModels: 0,
    stagingStudies: 0,
    boundary:
      "The upstream research repository is unavailable, so the app retains its local reviewed evidence and does not infer new claims.",
  };
}

export function createSupabaseEvidenceClient({
  url,
  serviceRoleKey,
  fetchImplementation = fetch,
}: SupabaseEvidenceClientConfig) {
  const baseUrl = url.replace(/\/+$/, "");

  async function getRows<T>(
    table: string,
    params: Record<string, string>
  ): Promise<{ data: T[]; count: number }> {
    const requestUrl = new URL(`/rest/v1/${table}`, baseUrl);
    for (const [key, value] of Object.entries(params)) {
      requestUrl.searchParams.set(key, value);
    }
    const response = await fetchImplementation(requestUrl, {
      headers: {
        Accept: "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Prefer: "count=exact",
      },
    });
    if (!response.ok) {
      throw new Error(`Supabase ${table} request failed (${response.status})`);
    }
    const data = (await response.json()) as T[];
    return { data, count: parseExactCount(response, data.length) };
  }

  return {
    async getExerciseEvidence(
      catalogExerciseId: number
    ): Promise<SupabaseExerciseEvidence> {
      const exerciseResult = await getRows<SupabaseExerciseRow>("exercises", {
        source_catalog_id: `eq.${catalogExerciseId}`,
        select:
          "id,canonical_name,exercise_evidence_coverage(coverage_level,anchor_metric,studies(id,title,publication_year,source_url,study_type,population_summary,sex,training_status,sport_population,evidence_level))",
        limit: "1",
      });
      const exercise = exerciseResult.data[0];
      if (!exercise || typeof exercise.id !== "string") {
        return unavailableEvidence(catalogExerciseId, "not_mapped");
      }

      const coverage = Array.isArray(exercise.exercise_evidence_coverage)
        ? exercise.exercise_evidence_coverage[0]
        : exercise.exercise_evidence_coverage;
      const level = getCoverageLevel(coverage?.coverage_level);
      const norms = await getRows<Record<string, never>>("strength_norms", {
        exercise_id: `eq.${exercise.id}`,
        select: "id",
        limit: "1",
      });
      const sourceId = sourceIdFromEmbeddedRecord(coverage?.studies);
      const outcomes = sourceId
        ? await getRows<SupabaseOutcomeRow>("study_outcomes", {
            study_id: `eq.${sourceId}`,
            select: "metric",
            limit: "3",
          })
        : { data: [] as SupabaseOutcomeRow[], count: 0 };

      return {
        status: level === "unavailable" ? "not_mapped" : "connected",
        catalogExerciseId,
        canonicalExerciseName: textOrNull(exercise.canonical_name),
        coverageLevel: level,
        coverageLabel: coverageLabel(level),
        anchorMetric: textOrNull(coverage?.anchor_metric),
        source: sourceFromEmbeddedRecord(coverage?.studies),
        normativeRecordCount: norms.count,
        sourceOutcomeCount: outcomes.count,
        sourceOutcomeMetrics: outcomeMetricLabels(outcomes.data),
        boundary:
          "This connected source record provides citation and coverage context. It does not replace local exercise mechanics, change catalog grades, or create a personal rank; normative rows remain unavailable for athlete comparison until an exact reviewed protocol and population gate is implemented.",
      };
    },
    async getInventory(): Promise<SupabaseEvidenceInventory> {
      const countedTables = [
        { table: "exercises", countColumn: "id" },
        { table: "studies", countColumn: "id" },
        { table: "study_outcomes", countColumn: "id" },
        { table: "strength_norms", countColumn: "id" },
        { table: "performance_tests", countColumn: "id" },
        { table: "performance_norms", countColumn: "id" },
        { table: "strength_estimation_models", countColumn: "id" },
        { table: "staging_studies", countColumn: "id" },
        { table: "exercise_evidence_coverage", countColumn: "exercise_id" },
      ] as const;
      const counts = await Promise.all(
        countedTables.map(async ({ table, countColumn }) => [
          table,
          (await getRows<Record<string, never>>(table, {
            select: countColumn,
            limit: "1",
          })).count,
        ])
      );
      const countByTable = Object.fromEntries(counts) as Record<
        (typeof countedTables)[number]["table"],
        number
      >;

      const localCatalogLinks = await getRows<Record<string, never>>(
        "exercises",
        {
          source_catalog_id: "not.is.null",
          select: "id",
          limit: "1",
        }
      );
      return {
        status: "connected",
        sourceExercises: countByTable.exercises,
        localCatalogLinks: localCatalogLinks.count,
        sourceOnlyExercises: Math.max(
          0,
          countByTable.exercises - localCatalogLinks.count
        ),
        linkedCoverageRecords: countByTable.exercise_evidence_coverage,
        studies: countByTable.studies,
        studyOutcomes: countByTable.study_outcomes,
        strengthNorms: countByTable.strength_norms,
        performanceTests: countByTable.performance_tests,
        performanceNorms: countByTable.performance_norms,
        strengthEstimationModels: countByTable.strength_estimation_models,
        stagingStudies: countByTable.staging_studies,
        boundary:
          "Counts describe connected upstream data. Staging records, source-only exercises, and heterogeneous norms are not automatically used to create athlete-facing recommendations, percentiles, or medical claims.",
      };
    },
  };
}

function getRuntimeClient() {
  const url = process.env.VITE_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) return null;
  return createSupabaseEvidenceClient({ url, serviceRoleKey });
}

export async function getSupabaseExerciseEvidence(
  catalogExerciseId: number
): Promise<SupabaseExerciseEvidence> {
  const cached = evidenceCache.get(catalogExerciseId);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const client = getRuntimeClient();
  if (!client) return unavailableEvidence(catalogExerciseId, "unavailable");
  try {
    const value = await client.getExerciseEvidence(catalogExerciseId);
    evidenceCache.set(catalogExerciseId, {
      value,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    return value;
  } catch (error) {
    console.warn("[Supabase evidence] exercise lookup unavailable", {
      catalogExerciseId,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return unavailableEvidence(catalogExerciseId, "unavailable");
  }
}

export async function getSupabaseEvidenceInventory(): Promise<SupabaseEvidenceInventory> {
  if (inventoryCache && inventoryCache.expiresAt > Date.now()) {
    return inventoryCache.value;
  }
  const client = getRuntimeClient();
  if (!client) return unavailableInventory();
  try {
    const value = await client.getInventory();
    inventoryCache = { value, expiresAt: Date.now() + CACHE_TTL_MS };
    return value;
  } catch (error) {
    console.warn("[Supabase evidence] inventory unavailable", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return unavailableInventory();
  }
}
