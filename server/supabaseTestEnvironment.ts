/**
 * Four tests in this directory are live connection checks against the Supabase
 * project rather than unit tests. Without that project's credentials they cannot
 * pass, so a fresh clone used to fail five tests before anyone had touched the
 * code — which teaches everyone to read a red suite as normal, and that is
 * exactly where a genuine regression hides.
 *
 * Each of those tests now declares what it needs and skips when it is absent.
 * Where the credentials exist the checks run and fail loudly as before.
 */

const projectUrlPattern = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i;

/**
 * The project URL, which every Supabase-facing test needs before it can reach
 * anything at all. A test with no key of its own still needs this, because it is
 * what says the environment is pointed at the project.
 */
export const hasSupabaseProjectUrl = projectUrlPattern.test(
  process.env.VITE_SUPABASE_URL ?? ""
);

/** Server-only service-role access: bucket metadata and the evidence data layer. */
export const hasSupabaseServiceAccess =
  hasSupabaseProjectUrl && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

/** Browser-side publishable access, used to prove RLS keeps a browser key out. */
export const hasSupabasePublishableAccess =
  hasSupabaseProjectUrl && Boolean(process.env.VITE_SUPABASE_PUBLISHABLE_KEY);
