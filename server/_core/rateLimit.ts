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

/**
 * A separate, smaller per-client allowance for the public sign-in routes (register, signIn and
 * the two passkey sign-in steps). It bounds, per address and per instance: password spraying
 * across many accounts (each staying under its own lockout), how fast registered emails can be
 * probed, the scrypt work a password check costs, and how many junk accounts one address can
 * create. It does NOT bound the 5-attempt lockout of one named account or the replacement of a
 * pending passkey challenge: each of those needs only one to five calls. A person signing in
 * makes at most a few calls a minute.
 */
export const AUTH_ROUTE_LIMIT = { windowMs: 60_000, maxCalls: 20 } as const;

type CallWindows = Map<string, { startedAt: number; calls: number }>;

const MAX_TRACKED_CLIENTS = 5000;
const windows: CallWindows = new Map();
const authWindows: CallWindows = new Map();

function takeCall(table: CallWindows, clientKey: string, now: number, limit: { windowMs: number; maxCalls: number }): boolean {
  const current = table.get(clientKey);
  if (!current || now - current.startedAt >= limit.windowMs) {
    table.delete(clientKey);
    table.set(clientKey, { startedAt: now, calls: 1 });
    // Forget the longest-idle clients first, so the table itself stays bounded.
    while (table.size > MAX_TRACKED_CLIENTS) table.delete(table.keys().next().value as string);
    return true;
  }
  current.calls += 1;
  return current.calls <= limit.maxCalls;
}

/** True when the call is allowed; counts it either way. */
export function takeCostlyCall(clientKey: string, now = Date.now(), limit = COSTLY_ROUTE_LIMIT): boolean {
  return takeCall(windows, clientKey, now, limit);
}

/** True when the sign-in call is allowed; counts it either way, apart from the costly allowance. */
export function takeAuthCall(clientKey: string, now = Date.now(), limit = AUTH_ROUTE_LIMIT): boolean {
  return takeCall(authWindows, clientKey, now, limit);
}

/** Forgets every count, in both allowances. */
export function resetCostlyCallWindows(): void {
  windows.clear();
  authWindows.clear();
}

/** The address a request came from. `trust proxy` is set, so behind the platform this is the client's. */
export function clientKeyOf(req: { ip?: string; socket?: { remoteAddress?: string } } | undefined): string {
  return req?.ip || req?.socket?.remoteAddress || "unknown";
}

function tooManyRequests(): TRPCError {
  return new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many requests in a short time. Wait a minute and try again." });
}

export function assertCostlyCallAllowed(req: Parameters<typeof clientKeyOf>[0]): void {
  if (!takeCostlyCall(clientKeyOf(req))) throw tooManyRequests();
}

export function assertAuthCallAllowed(req: Parameters<typeof clientKeyOf>[0]): void {
  if (!takeAuthCall(clientKeyOf(req))) throw tooManyRequests();
}
