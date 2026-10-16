import { randomUUID } from "node:crypto";
import type { ErrorRequestHandler, Express, RequestHandler } from "express";
import { errorReference, unexpectedErrorMessage } from "./apiErrors";
import { configSummary } from "./config";

/**
 * The HTTP layer both entry points share (Infrastructure V2): the deployed function
 * (`serverless.ts`) and the long-running dev server (`index.ts`) mount exactly this, so a
 * request is identified, timed, limited and answered the same way in both.
 */

/** One request body, parsed. The platform caps bodies lower; this guards the parser. */
export const BODY_LIMIT = "4mb";

/** What this deployment is, without anything secret: enough to say which release broke. */
export function releaseInfo() {
  return {
    commit: (process.env.VERCEL_GIT_COMMIT_SHA || process.env.SG_RELEASE_COMMIT || "unknown").slice(0, 12),
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID || null,
    environment: process.env.VERCEL_ENV || (process.env.NODE_ENV === "production" ? "production-unknown-host" : "local"),
    region: process.env.VERCEL_REGION || null,
  };
}

/**
 * A caller-supplied id is kept only when it looks like one of ours or the platform's, so a
 * client cannot write arbitrary text into the logs through it.
 */
const REQUEST_ID = /^[A-Za-z0-9:_-]{8,80}$/;

/** The coarse kind of route, for counting outcomes without logging paths or inputs. */
export function routeCategory(path: string): string {
  if (path.startsWith("/api/health")) return "health";
  if (path.startsWith("/api/trpc")) return "trpc";
  if (/^\/s\//.test(path) || path.includes("__sharePage")) return "share-page";
  if (path.startsWith("/api")) return "api-other";
  return "other";
}

/** The tRPC procedure names a request carried (a batch carries several), never its input. */
export function procedureNames(path: string): string[] {
  const match = path.match(/^\/api\/trpc\/([^?]+)/);
  if (!match) return [];
  return decodeURIComponent(match[1]).split(",").filter((name) => /^[A-Za-z0-9_.]{1,80}$/.test(name)).slice(0, 10);
}

/**
 * Gives every request an id (the caller's, if well-formed; else the platform's; else a new
 * one), returns it in `X-Request-Id`, and writes one JSON line when the response finishes:
 * event, release, route category, procedure names, status, duration and outcome. No body,
 * query string, cookie, IP address or user identifier is logged.
 */
export const requestContext: RequestHandler = (req, res, next) => {
  const incoming = String(req.headers["x-request-id"] ?? "");
  const platform = String(req.headers["x-vercel-id"] ?? "");
  const id = REQUEST_ID.test(incoming) ? incoming : REQUEST_ID.test(platform) ? platform : randomUUID();
  res.locals.requestId = id;
  res.setHeader("X-Request-Id", id);
  const started = process.hrtime.bigint();
  res.on("finish", () => {
    const status = res.statusCode;
    const path = req.originalUrl.split("?")[0];
    const category = routeCategory(req.originalUrl);
    if (category === "health" && status < 400) return;
    const line = {
      event: "http_request",
      requestId: id,
      release: releaseInfo().commit,
      category,
      procedures: procedureNames(path),
      method: req.method,
      status,
      durationMs: Math.round(Number(process.hrtime.bigint() - started) / 1e6),
      // An expected refusal (bad input, not signed in, throttled) is not a fault; alerts key on "fault".
      outcome: status >= 500 ? "fault" : status === 429 ? "throttled" : status >= 400 ? "refused" : "ok",
    };
    (status >= 500 ? console.error : console.log)(JSON.stringify(line));
  });
  next();
};

/** API answers are per-request and may carry an athlete's data: never stored by a shared cache. */
export const noStore: RequestHandler = (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
};

/**
 * Liveness: cheap, no dependency calls, safe to poll. Readiness (dependencies configured,
 * Supabase answering) costs an upstream request, so it needs `HEALTH_CHECK_TOKEN` in the
 * `x-health-token` header and is otherwise not found - a public endpoint must not be a way to
 * make the server call its database on demand.
 */
export function mountHealth(app: Express, fetcher: typeof upstreamFetch = upstreamFetch): void {
  app.get("/api/health", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({ status: "ok", release: releaseInfo(), time: new Date().toISOString() });
  });
  app.get("/api/health/ready", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const token = process.env.HEALTH_CHECK_TOKEN;
    if (!token || req.headers["x-health-token"] !== token) { res.status(404).json({ error: "Not found" }); return; }
    const config = configSummary();
    const url = process.env.VITE_SUPABASE_URL?.trim();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    let supabase: { ok: boolean; status?: number; ms?: number; error?: string } = { ok: false, error: "not configured" };
    if (url && key) {
      const started = Date.now();
      try {
        // The smallest read that proves the database and the key both work.
        const response = await fetcher(new URL("/rest/v1/sports?select=id&limit=1", url), { headers: { apikey: key, ...(key.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {}) } }, 3000);
        supabase = { ok: response.ok, status: response.status, ms: Date.now() - started };
      } catch (error) {
        supabase = { ok: false, ms: Date.now() - started, error: error instanceof Error && error.name === "TimeoutError" ? "timeout" : "unreachable" };
      }
    }
    const ready = supabase.ok && config.missingRequired.length === 0;
    res.status(ready ? 200 : 503).json({ status: ready ? "ready" : "degraded", release: releaseInfo(), config, dependencies: { supabase } });
  });
}

/**
 * The last word on errors outside tRPC (tRPC formats its own): a malformed or oversized body,
 * and anything a route let through. JSON always, with a reference for a fault - never Express's
 * HTML page, a stack trace, SQL, or a URL that might carry a key.
 */
export const apiErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (res.headersSent) { next(error); return; }
  const type = (error as { type?: string })?.type;
  const status = Number((error as { status?: number; statusCode?: number })?.status ?? (error as { statusCode?: number })?.statusCode);
  res.setHeader("Cache-Control", "no-store");
  if (type === "entity.parse.failed") { res.status(400).json({ error: { message: "The request body is not valid JSON.", code: "BAD_REQUEST" } }); return; }
  if (type === "entity.too.large") { res.status(413).json({ error: { message: "The request is too large.", code: "PAYLOAD_TOO_LARGE" } }); return; }
  if (status >= 400 && status < 500) { res.status(status).json({ error: { message: "The request could not be read.", code: "BAD_REQUEST" } }); return; }
  const reference = errorReference(error && typeof error === "object" ? error : { error });
  console.error(JSON.stringify({ event: "http_fault", requestId: res.locals.requestId ?? null, reference, category: routeCategory(req.originalUrl), name: error instanceof Error ? error.name : typeof error }));
  res.status(500).json({ error: { message: unexpectedErrorMessage(reference), code: "INTERNAL_SERVER_ERROR" } });
};

/** Anything else under /api is a genuine 404, in JSON, naming the path but not echoing the query. */
export const apiNotFound: RequestHandler = (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.status(404).json({ error: "Not found", path: req.originalUrl.split("?")[0].slice(0, 200) });
};

/**
 * Every upstream call the server makes has a time budget. Without one a hung Supabase
 * request held the function until the platform killed it, and the athlete waited the
 * whole time for an answer that was never coming. Eight seconds is well inside the
 * function's own limit and far above a healthy read (tens to hundreds of milliseconds).
 * A caller's own signal still applies; whichever fires first wins.
 */
export const UPSTREAM_TIMEOUT_MS = 8000;

export async function upstreamFetch(input: Parameters<typeof fetch>[0], init: RequestInit = {}, timeoutMs = UPSTREAM_TIMEOUT_MS): Promise<Response> {
  const timeout = AbortSignal.timeout(timeoutMs);
  const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  return fetch(input, { ...init, signal });
}
