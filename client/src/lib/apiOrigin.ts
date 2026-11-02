/**
 * Where the app's API lives (iOS readiness audit, A02). The one place that decides it.
 *
 * On the website the API is the same origin as the page, so every call stays relative
 * ("/api/trpc") and nothing about the site changes. A native iOS shell serves the bundled app
 * from its own origin (capacitor://localhost), where a relative URL would reach nothing, so a
 * native build must be told the API's HTTPS origin at build time:
 *
 *   VITE_NATIVE_SHELL=1 VITE_API_ORIGIN=https://<api host> pnpm build
 *
 * A native build without a valid HTTPS origin fails at start-up with a message that says so,
 * rather than shipping an app that silently cannot reach its server. Staging and production
 * native builds differ only in VITE_API_ORIGIN, which is what keeps a staging app off
 * production data (see docs/ios-readiness/native-build.md).
 */

export type ApiOriginConfig = { native: boolean; origin: string | null };

export class ApiOriginConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiOriginConfigError";
  }
}

/** Reads the build's settings. Kept separate from `resolveApiOrigin` so the rule is testable. */
export function buildApiOriginConfig(env: Record<string, string | boolean | undefined> = import.meta.env): ApiOriginConfig {
  const native = env.VITE_NATIVE_SHELL === "1" || env.VITE_NATIVE_SHELL === "true" || env.VITE_NATIVE_SHELL === true;
  const raw = typeof env.VITE_API_ORIGIN === "string" ? env.VITE_API_ORIGIN.trim() : "";
  return { native, origin: raw || null };
}

/**
 * The origin to prefix API paths with: "" for the website (relative), the configured HTTPS
 * origin for a native build. Throws ApiOriginConfigError for a native build that lacks one.
 */
export function resolveApiOrigin(config: ApiOriginConfig = buildApiOriginConfig()): string {
  if (!config.native) return "";
  if (!config.origin) throw new ApiOriginConfigError("This iOS build has no API address. Build it with VITE_API_ORIGIN set to the HTTPS address of the Sports Genome API.");
  let parsed: URL;
  try {
    parsed = new URL(config.origin);
  } catch {
    throw new ApiOriginConfigError(`This iOS build's API address is not a valid URL: ${config.origin}`);
  }
  if (parsed.protocol !== "https:") throw new ApiOriginConfigError("This iOS build's API address must use HTTPS.");
  if (parsed.pathname !== "/" || parsed.search || parsed.hash) throw new ApiOriginConfigError("This iOS build's API address must be an origin only, with no path.");
  return parsed.origin;
}

/** An API path ("/api/trpc") as the URL this build should call. */
export function apiUrl(path: string, config?: ApiOriginConfig): string {
  if (!path.startsWith("/")) throw new Error(`API paths start with "/": ${path}`);
  return `${resolveApiOrigin(config)}${path}`;
}
