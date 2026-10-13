import { createHmac } from "node:crypto";
import { upstreamFetch } from "./http";
import { supabaseServiceHeaders } from "../supabaseServiceHeaders";

/**
 * The cross-instance half of the rate limits (Infrastructure V2, RL02-RL06).
 *
 * `rateLimit.ts` counts per function instance in memory: cheap, always on, but every cold
 * start and every parallel instance grants a fresh allowance. This asks one counter in the
 * database (`public.sg_rate_limit_hit`, supabase/migrations/20261008120000_shared_rate_limit.sql)
 * that every instance shares, so switching instances cannot reset the count.
 *
 * - Buckets are `<scope>:<HMAC-SHA256 of the client address>`, keyed by the service key, so the
 *   database never holds an address and the hash is useless outside this server (RL10).
 * - Allowances are per address and set well above one person's use, because a gym or a school
 *   shares one public address (RL05): they stop scripts, not a busy room.
 * - Fail-open by design (RL06): when the store is unconfigured, slow (over 700 ms) or failing,
 *   the call is decided by the local limit alone, and the store is not asked again for a
 *   minute. Every route here serves reads or small writes whose own backend is the same
 *   Supabase project, so a limiter outage must not become an app outage.
 */
export type SharedLimit = { scope: string; windowSeconds: number; maxCalls: number };

/** Per address, across all instances, per minute. */
export const SHARED_LIMITS = {
  costly: { scope: "costly", windowSeconds: 60, maxCalls: 600 },
  auth: { scope: "auth", windowSeconds: 60, maxCalls: 60 },
  shareCreate: { scope: "share-create", windowSeconds: 60, maxCalls: 30 },
} as const satisfies Record<string, SharedLimit>;

export type SharedVerdict = { allowed: boolean; retryAfterSeconds: number; source: "shared" } | { allowed: true; retryAfterSeconds: 0; source: "unavailable" };

const UNAVAILABLE: SharedVerdict = { allowed: true, retryAfterSeconds: 0, source: "unavailable" };
export const SHARED_LIMIT_TIMEOUT_MS = 700;
const BREAKER_MS = 60_000;

export function createSharedRateLimiter({ url, key, fetcher = upstreamFetch, now = Date.now }: { url: string; key: string; fetcher?: typeof upstreamFetch; now?: () => number }) {
  const endpoint = new URL("/rest/v1/rpc/sg_rate_limit_hit", url.replace(/\/+$/, ""));
  let pausedUntil = 0;
  const bucketFor = (scope: string, clientKey: string) => `${scope}:${createHmac("sha256", key).update(clientKey).digest("hex").slice(0, 32)}`;

  return {
    bucketFor,
    async hit(limit: SharedLimit, clientKey: string): Promise<SharedVerdict> {
      if (now() < pausedUntil) return UNAVAILABLE;
      try {
        const response = await fetcher(endpoint, {
          method: "POST",
          headers: supabaseServiceHeaders(key, { "Content-Type": "application/json" }),
          body: JSON.stringify({ p_bucket: bucketFor(limit.scope, clientKey), p_window_seconds: limit.windowSeconds, p_max_calls: limit.maxCalls }),
        }, SHARED_LIMIT_TIMEOUT_MS);
        if (!response.ok) throw Object.assign(new Error("shared limiter refused"), { status: response.status });
        const body = await response.json() as { allowed?: unknown; retry_after_seconds?: unknown };
        if (typeof body.allowed !== "boolean") throw new Error("shared limiter answered without a verdict");
        return { allowed: body.allowed, retryAfterSeconds: Number(body.retry_after_seconds) || 0, source: "shared" };
      } catch (error) {
        pausedUntil = now() + BREAKER_MS;
        console.warn(JSON.stringify({ event: "rate_limit_store_unavailable", reason: error instanceof Error && error.name === "TimeoutError" ? "timeout" : (error as { status?: number })?.status ?? "error", pausedForMs: BREAKER_MS }));
        return UNAVAILABLE;
      }
    },
  };
}

let runtime: ReturnType<typeof createSharedRateLimiter> | null | undefined;

/** The deployment's limiter, or null when it is turned off or has no store configured. */
export function sharedRateLimiter() {
  if (runtime !== undefined) return runtime;
  const url = process.env.VITE_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  runtime = process.env.RATE_LIMIT_SHARED === "off" || !url || !key ? null : createSharedRateLimiter({ url, key });
  return runtime;
}

/** For tests: forget the configured limiter. */
export function resetSharedRateLimiter(next?: ReturnType<typeof createSharedRateLimiter> | null): void {
  runtime = next;
}
