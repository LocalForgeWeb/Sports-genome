import { isNativePlatform } from "./platform";

/**
 * Where API calls go.
 *
 * On web the SPA is served by the same Express process that serves `/api`, so a
 * relative URL is both correct and required — it keeps the session cookie
 * same-origin.
 *
 * In the iOS app the bundle is served from `capacitor://localhost`, which has no
 * `/api` route of its own. Every call must be absolute against the deployed API
 * origin, set at build time via `VITE_API_BASE_URL`.
 */
const RAW_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").trim();

function normalize(base: string): string {
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

export function apiBaseUrl(): string {
  if (!isNativePlatform()) return "";

  if (!RAW_BASE) {
    // Loud rather than silent: without this the app falls back to a relative
    // URL that resolves against capacitor://localhost and every request fails
    // with an opaque network error.
    console.error(
      "[apiBase] VITE_API_BASE_URL is not set. The native build cannot reach the API. " +
        "Set it in .env before running `pnpm build` and `npx cap sync ios`."
    );
    return "";
  }

  return normalize(RAW_BASE);
}

/** Absolute URL for an API path such as `/api/trpc`. */
export function apiUrl(path: string): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${apiBaseUrl()}${suffix}`;
}
