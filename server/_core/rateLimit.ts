import { TRPCError } from "@trpc/server";

/**
 * A per-client allowance for the public routes that fan out to Supabase with the
 * service key (strength ranks, percentiles, sport profiles, exercise evidence).
 *
 * Each call to one of them costs up to dozens of upstream requests, and nothing
 * stopped a script from calling them in a loop. This is a fixed-window count per
 * client address, held in the function instance's memory: it bounds what one
 * address can make one instance do, and it is not a global quota - instances do not
 * share it. It is set far above what a person tapping through the app can reach.
 */
export const COSTLY_ROUTE_LIMIT = { windowMs: 60_000, maxCalls: 120 } as const;

const MAX_TRACKED_CLIENTS = 5000;
const windows = new Map<string, { startedAt: number; calls: number }>();

/** True when the call is allowed; counts it either way. */
export function takeCostlyCall(clientKey: string, now = Date.now(), limit = COSTLY_ROUTE_LIMIT): boolean {
  const current = windows.get(clientKey);
  if (!current || now - current.startedAt >= limit.windowMs) {
    windows.delete(clientKey);
    windows.set(clientKey, { startedAt: now, calls: 1 });
    // Forget the longest-idle clients first, so the table itself stays bounded.
    while (windows.size > MAX_TRACKED_CLIENTS) windows.delete(windows.keys().next().value as string);
    return true;
  }
  current.calls += 1;
  return current.calls <= limit.maxCalls;
}

export function resetCostlyCallWindows(): void {
  windows.clear();
}

/** The address a request came from. `trust proxy` is set, so behind the platform this is the client's. */
export function clientKeyOf(req: { ip?: string; socket?: { remoteAddress?: string } } | undefined): string {
  return req?.ip || req?.socket?.remoteAddress || "unknown";
}

export function assertCostlyCallAllowed(req: Parameters<typeof clientKeyOf>[0]): void {
  if (!takeCostlyCall(clientKeyOf(req))) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many requests in a short time. Wait a minute and try again." });
  }
}
