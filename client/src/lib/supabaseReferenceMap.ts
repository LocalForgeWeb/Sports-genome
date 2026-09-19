import { getSupabaseClient } from "@/lib/supabaseClient";

/**
 * Resolves the app's own ids to the Supabase uuids its foreign keys require.
 *
 * `athlete_strength_entries.exercise_id` references `public.exercises`, and
 * `sport_id` references `public.sports`, but the app catalog keys exercises by
 * integer and sports by slug. The bridge for exercises already exists in the
 * database — `app_exercise_source_mappings` holds all 400 catalog ids against
 * their uuids, marked approved — so this reads it rather than re-deriving a
 * mapping the project has already reviewed.
 *
 * Sports are matched by normalised name. Two of the app's twenty (skiing,
 * Olympic weightlifting) have no row in `public.sports` yet, and they resolve to
 * undefined: `sport_id` is nullable, and a lift filed under the wrong sport
 * would poison the very cohort the column exists to define.
 *
 * Both tables are readable with the publishable key — the exercise mapping and
 * `public.sports` are reference data — so this needs no session.
 */
export type ReferenceMap = {
  exerciseUuidByCatalogId: Record<number, string>;
  sportUuidBySlug: Record<string, string>;
  loadedAt: string;
};

export const referenceMapKey = "sports-genome-supabase-reference-map-v1";

const normalise = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();

export function loadCachedReferenceMap(): ReferenceMap | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(referenceMapKey) || "null");
    return parsed && parsed.exerciseUuidByCatalogId ? parsed as ReferenceMap : null;
  } catch {
    return null;
  }
}

/** Pairs app sports to Supabase sports by name, and says nothing about the rest. */
export function matchSportUuids(
  appSports: readonly { id: string; label: string }[],
  supabaseSports: readonly { id: string; name: string }[],
): Record<string, string> {
  const byName = new Map(supabaseSports.map((sport) => [normalise(sport.name), sport.id]));
  const map: Record<string, string> = {};
  appSports.forEach((sport) => {
    const uuid = byName.get(normalise(sport.label)) ?? byName.get(normalise(sport.id));
    if (uuid) map[sport.id] = uuid;
  });
  return map;
}

/**
 * Fetches the mapping once and caches it. The cache is what the sync reads, so
 * a flush never waits on a round trip it does not need.
 */
export async function refreshReferenceMap(appSports: readonly { id: string; label: string }[]): Promise<ReferenceMap | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return loadCachedReferenceMap();
  try {
    const [mappings, sports] = await Promise.all([
      supabase.from("app_exercise_source_mappings").select("local_catalog_id,supabase_exercise_id").eq("mapping_status", "approved"),
      supabase.from("sports").select("id,name"),
    ]);
    if (mappings.error || sports.error) return loadCachedReferenceMap();

    const exerciseUuidByCatalogId: Record<number, string> = {};
    (mappings.data || []).forEach((row) => {
      const local = Number((row as { local_catalog_id: number | null }).local_catalog_id);
      const uuid = (row as { supabase_exercise_id: string | null }).supabase_exercise_id;
      if (Number.isFinite(local) && uuid) exerciseUuidByCatalogId[local] = uuid;
    });

    const map: ReferenceMap = {
      exerciseUuidByCatalogId,
      sportUuidBySlug: matchSportUuids(appSports, (sports.data || []) as { id: string; name: string }[]),
      loadedAt: new Date().toISOString(),
    };
    try { window.localStorage.setItem(referenceMapKey, JSON.stringify(map)); } catch { /* the cache is optional. */ }
    return map;
  } catch {
    return loadCachedReferenceMap();
  }
}
