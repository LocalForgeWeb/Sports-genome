/**
 * The headers a server-side Supabase read carries.
 *
 * Supabase has two key shapes in circulation. The legacy `service_role` key is a JWT, and
 * PostgREST reads the role out of it, so it travels in `Authorization: Bearer` as well as
 * `apikey`. The newer secret key (`sb_secret_...`) is an opaque string the gateway translates
 * into an internal JWT before the request reaches the database - and Supabase's own migration
 * guide says it "cannot be sent in the Authorization: Bearer header", because whatever sits
 * behind it is then asked to parse a JWT that was never a JWT.
 *
 * Sending Bearer unconditionally is therefore a key-shape trap: it works today and breaks the
 * day the project is handed a secret key, with a 401 that names neither the key nor the header.
 * One helper decides it once, so no caller has to know which kind of key it was given.
 */

/** Legacy keys are JWTs - three base64url segments, the first of which encodes `{"alg":...`. */
export function isJwtApiKey(key: string): boolean {
  return /^eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test(key.trim());
}

export function supabaseServiceHeaders(
  serviceRoleKey: string,
  extra: Record<string, string> = {},
): Record<string, string> {
  const key = serviceRoleKey.trim();
  return {
    Accept: "application/json",
    apikey: key,
    ...(isJwtApiKey(key) ? { Authorization: `Bearer ${key}` } : {}),
    ...extra,
  };
}
