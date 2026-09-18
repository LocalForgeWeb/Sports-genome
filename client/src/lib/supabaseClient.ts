import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The browser-side Supabase client, for the athlete's own rows only.
 *
 * It carries the publishable key, so everything it can reach is what row-level
 * security allows an authenticated user to reach: their own `athlete_profiles`
 * row, their own `athlete_strength_entries`, and read-only reference data like
 * `public.sports`. The service-role key stays on the server, where it already
 * lives for the evidence library.
 *
 * Returns null when the app has not been configured with Supabase credentials,
 * so every caller has to handle "no backend" — which is also the offline case,
 * and the case during local development. Nothing in the app may depend on this
 * being present: a workout logged with no connection is still a logged workout.
 */
const url = import.meta.env.VITE_SUPABASE_URL || "https://qiccnqkypbhlwpmjcsri.supabase.co";
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || "";

let client: SupabaseClient | null | undefined;

export function getSupabaseClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  if (typeof window === "undefined" || !url || !publishableKey) {
    client = null;
    return client;
  }
  try {
    client = createClient(url, publishableKey, {
      auth: {
        // The session is the athlete's identity across launches, so it persists
        // and refreshes itself. Losing it would orphan their history.
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "sports-genome-auth-v1",
      },
    });
  } catch {
    client = null;
  }
  return client;
}

export const supabaseConfigured = Boolean(url && publishableKey);
