import express from "express";
import { requireJsonMutations, trpcHandler } from "./apiHandler";
import { serveSharePage } from "../sharePage";
import { BODY_LIMIT, apiErrorHandler, apiNotFound, mountHealth, noStore, requestContext } from "./http";
import { warnOnMissingConfig } from "./config";

/**
 * The API as a serverless request handler.
 *
 * `index.ts` beside this file is the long-running dev server: it binds a port and
 * serves the client too. Neither belongs in a serverless deployment, so this mounts
 * the same router and the same context on a bare Express app and exports it. The API
 * is never redefined here - both entry points import the one router, so the deployed
 * surface cannot drift from the local one.
 *
 * This is bundled to `dist/serverless.js` at build time and re-exported by
 * `api/[...path].js`. That indirection is load-bearing: the platform transpiles but
 * does not bundle, and under `"type": "module"` Node resolves relative imports
 * strictly, so an extensionless `../server/routers` throws ERR_MODULE_NOT_FOUND at
 * invocation. Bundling leaves no internal specifiers to resolve at runtime.
 */
export const app = express();

// TLS terminates upstream, so the original protocol arrives in x-forwarded-proto.
// Without this, secure-cookie decisions read the internal hop instead.
app.set("trust proxy", 1);
app.disable("x-powered-by");

warnOnMissingConfig();
// Identified and timed before anything can fail, so even a parser error carries an id.
app.use(requestContext);

// The platform caps request bodies well below this; the limit only guards the parser.
app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ limit: BODY_LIMIT, extended: true }));

/** The request again, at `path`, with the rewrite's carrier dropped from the query. */
function restorePath(req: express.Request, carrier: string, path: string): void {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (key !== carrier && typeof value === "string") search.set(key, value);
  }
  const query = search.toString();
  req.url = `${path}${query ? `?${query}` : ""}`;
}

/** Plain path segments only: no empty segment, no dot-segment, no query or fragment. */
const CARRIED_API_PATH = /^(?!.*(?:^|\/)\.\.?(?:\/|$))[A-Za-z0-9._~-]+(?:\/[A-Za-z0-9._~-]+)+$/;

/**
 * Restores the request path when the platform routes through a rewrite.
 *
 * `api/[...path].js` only matches ONE segment under this framework preset, so every deeper
 * path is rewritten to the function file (vercel.json): `/api/trpc/<procedure>` carrying
 * `__trpc`, and any other `/api/<a>/<b>...` (e.g. `/api/health/ready`) carrying `__api`.
 * Depending on how the platform resolves that, the app may receive the function's own path
 * instead of the request path, so the carried copy rebuilds it exactly. When the request
 * arrives unmodified this is a no-op. A carried path only selects a route, never a
 * privilege: every route still applies its own checks.
 */
app.use((req, _res, next) => {
  const trpc = typeof req.query.__trpc === "string" ? req.query.__trpc : null;
  const api = typeof req.query.__api === "string" && CARRIED_API_PATH.test(req.query.__api) ? req.query.__api : null;
  if (trpc && !req.path.startsWith("/api/trpc")) restorePath(req, "__trpc", `/api/trpc/${trpc}`);
  else if (api && req.path !== `/api/${api}`) restorePath(req, "__api", `/api/${api}`);
  next();
});

/**
 * A shared workout's page. `/s/<token>` is rewritten here (vercel.json) so its head can
 * carry the workout's name for link previews; the page itself is the app, as anywhere.
 */
app.get("*", (req, res, next) => {
  // The token arrives in the rewrite's query, or - if the platform hands over the original
  // request path, as it can for the tRPC rewrite above - in the path itself.
  const token = typeof req.query.__sharePage === "string" ? req.query.__sharePage : req.path.match(/^\/s\/([^/]+)\/?$/)?.[1];
  if (typeof token !== "string") return next();
  serveSharePage(token, req.headers, res).catch(next);
});

mountHealth(app);
app.use("/api/trpc", noStore, requireJsonMutations, trpcHandler());

// Anything else under /api is a genuine 404. Answering in JSON stops a client from
// parsing an HTML error page as if it were a tRPC response.
app.use(apiNotFound);
app.use(apiErrorHandler);

export default app;
