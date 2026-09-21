import type {
  EvidenceRoute,
  ResilienceTargetCatalog,
  ResilienceTargetCatalogEntry,
  ResilienceTargetType,
} from "../shared/resilienceContext";

/**
 * Server-only read of the resilience target catalog.
 *
 * The catalog is the selectable list for onboarding and settings. It deliberately carries
 * `supportedRoutes` rather than recommendations: a target with no reviewed route is still
 * selectable, and the empty array is what drives the insufficiency state instead of a
 * borrowed recommendation.
 */

type FetchImplementation = typeof fetch;

type SupabaseResilienceClientConfig = {
  url: string;
  serviceRoleKey: string;
  fetchImplementation?: FetchImplementation;
};

type CatalogRow = {
  target_id?: unknown;
  target_key?: unknown;
  name?: unknown;
  region?: unknown;
  target_type?: unknown;
  laterality_supported?: unknown;
  supported_routes?: unknown;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
let catalogCache: { expiresAt: number; value: ResilienceTargetCatalog } | null = null;

const CONNECTED_BOUNDARY =
  "These are selectable training targets, not diagnoses. A target listed without a reviewed evidence route can still be chosen; the plan will say what is missing rather than borrowing a recommendation from another population or sport.";

const UNAVAILABLE_BOUNDARY =
  "The target catalog is unavailable, so targeted capacity selection is off. Ordinary training and every other workspace are unaffected.";

const targetTypes: ResilienceTargetType[] = ["body_region", "functional_task", "movement_pattern", "tissue_system"];
const evidenceRoutes: EvidenceRoute[] = ["general", "presentation_matched", "sport_specific"];

function textOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function toTargetType(value: unknown): ResilienceTargetType | null {
  const text = textOrNull(value);
  return text && (targetTypes as string[]).includes(text) ? (text as ResilienceTargetType) : null;
}

/** Unknown route names are dropped rather than passed through: an unrecognized route
 * cannot be reasoned about, and treating it as usable is how a sport row leaks. */
function toRoutes(value: unknown): EvidenceRoute[] {
  if (!Array.isArray(value)) return [];
  const routes = value
    .map(entry => textOrNull(entry))
    .filter((entry): entry is string => entry !== null && (evidenceRoutes as string[]).includes(entry));
  return routes.filter((route, index) => routes.indexOf(route) === index) as EvidenceRoute[];
}

function toEntry(row: CatalogRow): ResilienceTargetCatalogEntry | null {
  const targetId = textOrNull(row.target_id);
  const targetKey = textOrNull(row.target_key);
  const name = textOrNull(row.name);
  const region = textOrNull(row.region);
  const targetType = toTargetType(row.target_type);
  if (!targetId || !targetKey || !name || !region || !targetType) return null;
  return {
    targetId,
    targetKey,
    name,
    region,
    targetType,
    lateralitySupported: row.laterality_supported !== false,
    supportedRoutes: toRoutes(row.supported_routes),
  };
}

export function unavailableCatalog(): ResilienceTargetCatalog {
  return { status: "unavailable", targets: [], boundary: UNAVAILABLE_BOUNDARY };
}

export function createSupabaseResilienceClient({
  url,
  serviceRoleKey,
  fetchImplementation = fetch,
}: SupabaseResilienceClientConfig) {
  const baseUrl = url.replace(/\/+$/, "");

  return {
    async getTargetCatalog(): Promise<ResilienceTargetCatalog> {
      const requestUrl = new URL("/rest/v1/app_resilience_target_catalog_v1", baseUrl);
      requestUrl.searchParams.set(
        "select",
        "target_id,target_key,name,region,target_type,laterality_supported,supported_routes"
      );
      requestUrl.searchParams.set("order", "region.asc,name.asc");
      const response = await fetchImplementation(requestUrl, {
        headers: {
          Accept: "application/json",
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Supabase resilience catalog request failed (${response.status})`);
      }
      const rows = (await response.json()) as CatalogRow[];
      const targets = rows.map(toEntry).filter((entry): entry is ResilienceTargetCatalogEntry => entry !== null);
      return { status: "connected", targets, boundary: CONNECTED_BOUNDARY };
    },
  };
}

function getRuntimeClient() {
  const url = process.env.VITE_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) return null;
  return createSupabaseResilienceClient({ url, serviceRoleKey });
}

export async function getResilienceTargetCatalog(): Promise<ResilienceTargetCatalog> {
  if (catalogCache && catalogCache.expiresAt > Date.now()) return catalogCache.value;
  const client = getRuntimeClient();
  if (!client) return unavailableCatalog();
  try {
    const value = await client.getTargetCatalog();
    catalogCache = { value, expiresAt: Date.now() + CACHE_TTL_MS };
    return value;
  } catch (error) {
    console.warn("[Supabase resilience catalog] lookup unavailable", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return unavailableCatalog();
  }
}

/** Test seam: the module-level cache would otherwise leak between cases. */
export function resetResilienceCatalogCache() {
  catalogCache = null;
}
