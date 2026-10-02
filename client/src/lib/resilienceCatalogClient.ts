import { getSupabaseClient } from "@/lib/supabaseClient";
import {
  catalogEntryFromRow,
  connectedCatalogBoundary,
  type ResilienceTargetCatalog,
  type ResilienceTargetCatalogEntry,
} from "@shared/resilienceContext";

/**
 * The target catalog, read by the athlete's own session.
 *
 * The server route reads `app_resilience_target_catalog_v1` behind the service
 * role, and on a deployment without that key it answers `unavailable` — which
 * turns targeted capacity off entirely, in onboarding and in the profile, with
 * nothing selectable anywhere.
 *
 * It does not have to be the only way in. The view is `security_invoker = true`
 * and `resilience_targets` carries one policy: `SELECT` for `authenticated`,
 * `USING (true)`. A signed-in athlete may read the whole list — it is 26 body
 * regions and functional tasks, the same list for everyone, with no personal
 * data in it. The row-level security is the access control, and it already says
 * yes to exactly this.
 *
 * So this is a fallback, not a second source: the server answer wins whenever it
 * is connected, both parse rows through `catalogEntryFromRow`, and both carry
 * the same boundary sentence. What it removes is a deployment setting standing
 * between the athlete and a list the database was already willing to hand them.
 *
 * It needs a session, because the policy is for `authenticated` and not `anon`.
 * The app signs in anonymously on first launch, and an anonymous Supabase user
 * holds the `authenticated` role — so this works without an account, and returns
 * null rather than throwing when there is no session to work with.
 */
export async function fetchTargetCatalogAsAthlete(userId: string | null): Promise<ResilienceTargetCatalog | null> {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) return null;

  try {
    const { data, error } = await supabase
      .from("app_resilience_target_catalog_v1")
      .select("target_id,target_key,name,region,target_type,laterality_supported,supported_routes")
      .order("region", { ascending: true })
      .order("name", { ascending: true });
    if (error || !data) return null;

    const targets = (data as Record<string, unknown>[])
      .map(catalogEntryFromRow)
      .filter((entry): entry is ResilienceTargetCatalogEntry => entry !== null);
    // An empty read is not a connected catalog. Reporting `connected` with no
    // targets would replace the honest "unavailable" copy with a picker that
    // silently has nothing in it.
    if (targets.length === 0) return null;
    return { status: "connected", targets, boundary: connectedCatalogBoundary };
  } catch {
    return null;
  }
}
