import {
  catalogEntryFromRow,
  connectedCatalogBoundary,
  unavailableTargetCatalog,
  type ResilienceTargetCatalog,
  type ResilienceTargetCatalogEntry,
} from "../shared/resilienceContext";

/**
 * The service-role read of the resilience target catalog.
 *
 * Not the only read any more: the same view is readable by a signed-in athlete
 * under its own row-level security, and the client falls back to that when this
 * route reports unavailable. Both share one row parser so a target means the
 * same thing whichever door it came through.
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

const CACHE_TTL_MS = 5 * 60 * 1000;
let catalogCache: { expiresAt: number; value: ResilienceTargetCatalog } | null = null;

/** Kept as this module's name for the shared shape, which server callers import. */
export function unavailableCatalog(): ResilienceTargetCatalog {
  return unavailableTargetCatalog();
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
      const rows = (await response.json()) as Record<string, unknown>[];
      const targets = rows.map(catalogEntryFromRow).filter((entry): entry is ResilienceTargetCatalogEntry => entry !== null);
      return { status: "connected", targets, boundary: connectedCatalogBoundary };
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
