import { supabaseServiceHeaders } from "./supabaseServiceHeaders";
import type { PowerliftingNormLift, PowerliftingNormRow } from "../shared/powerliftingNormsReference";

type FetchImplementation = typeof fetch;

type PowerliftingNormsClientConfig = {
  url: string;
  serviceRoleKey: string;
  fetchImplementation?: FetchImplementation;
};

type NormRow = {
  sex?: unknown;
  age_min?: unknown;
  age_max?: unknown;
  percentile?: unknown;
  value?: unknown;
  exercises?: { name?: unknown } | { name?: unknown }[] | null;
};

const knownLifts: readonly PowerliftingNormLift[] = ["Back Squat", "Barbell Bench Press", "Conventional Deadlift"];
const CACHE_TTL_MS = 60 * 60 * 1000;
let cache: { expiresAt: number; value: PowerliftingNormRow[] } | null = null;

function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function embedded<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export function createPowerliftingNormsClient({
  url,
  serviceRoleKey,
  fetchImplementation = fetch,
}: PowerliftingNormsClientConfig) {
  const baseUrl = url.replace(/\/+$/, "");

  return {
    /**
     * Van den Hoek et al. 2024 is the drug-tested, unequipped powerlifting reference the
     * app's qualification gates already cite by name. This pulls the full reported decile
     * table (all age bands, not just the one hand-transcribed 18-35 subset) so the existing
     * percentile comparison can cover the age ranges the source itself reports.
     */
    async getPowerliftingNorms(): Promise<PowerliftingNormRow[]> {
      const requestUrl = new URL("/rest/v1/strength_norms", baseUrl);
      requestUrl.searchParams.set("source_text", "ilike.*van den hoek*");
      requestUrl.searchParams.set("select", "sex,age_min,age_max,percentile,value,exercises(name)");
      requestUrl.searchParams.set("limit", "500");
      const response = await fetchImplementation(requestUrl, {
        headers: supabaseServiceHeaders(serviceRoleKey),
      });
      if (!response.ok) {
        throw new Error(`Supabase strength_norms request failed (${response.status})`);
      }
      const rows = (await response.json()) as NormRow[];
      return rows
        .map(row => {
          const exerciseName = embedded(row.exercises)?.name;
          const sex = row.sex === "male" || row.sex === "female" ? row.sex : null;
          const ageMin = numberOrNull(row.age_min);
          const ageMax = numberOrNull(row.age_max);
          const percentile = numberOrNull(row.percentile);
          const relativeStrength = numberOrNull(row.value);
          if (
            typeof exerciseName !== "string" ||
            !knownLifts.includes(exerciseName as PowerliftingNormLift) ||
            !sex ||
            ageMin === null ||
            ageMax === null ||
            percentile === null ||
            relativeStrength === null
          ) {
            return null;
          }
          return {
            exerciseName: exerciseName as PowerliftingNormLift,
            sex,
            ageMin,
            ageMax,
            percentile,
            relativeStrength,
          } satisfies PowerliftingNormRow;
        })
        .filter((row): row is PowerliftingNormRow => row !== null);
    },
  };
}

function getRuntimeClient() {
  const url = process.env.VITE_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) return null;
  return createPowerliftingNormsClient({ url, serviceRoleKey });
}

/** Returns [] (never throws) when the registry is unavailable; callers fall back to the local reference table. */
export async function getPowerliftingNormsReference(): Promise<PowerliftingNormRow[]> {
  if (cache && cache.expiresAt > Date.now()) return cache.value;
  const client = getRuntimeClient();
  if (!client) return [];
  try {
    const value = await client.getPowerliftingNorms();
    cache = { value, expiresAt: Date.now() + CACHE_TTL_MS };
    return value;
  } catch (error) {
    console.warn("[Powerlifting norms] registry lookup unavailable", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return [];
  }
}
