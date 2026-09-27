import type { RequestHandler } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { logApiError } from "./apiErrors";

/**
 * The tRPC mount both entry points share, so the dev server and the deployed function
 * cannot disagree about limits or error handling.
 */

/**
 * The most procedures one HTTP request may carry. Uncapped, a single request could
 * batch any number of the public routes that fan out to Supabase. The client's batch
 * link is set to the same number (client/src/main.tsx), so it splits rather than fails.
 */
export const MAX_BATCH_SIZE = 10;

/**
 * Mutations arrive as JSON from the app, always. A cross-site HTML form can only send
 * urlencoded, multipart or text/plain, and it can do that with the session cookie
 * attached because the cookie is SameSite=None (the future native shell calls the API
 * from another origin, so the cookie has to stay that way). tRPC also accepts
 * multipart form data, so a form posted from another site could call a mutation that
 * takes no input - auth.logout did sign people out that way. Refusing any POST that is
 * not JSON closes that without touching the cookie.
 */
export const requireJsonMutations: RequestHandler = (req, res, next) => {
  if (req.method !== "POST") return next();
  const type = String(req.headers["content-type"] ?? "").split(";")[0].trim().toLowerCase();
  if (type === "application/json") return next();
  res.status(415).json({ error: { message: "Requests that change data must be sent as JSON.", code: "UNSUPPORTED_MEDIA_TYPE" } });
};

export function trpcHandler(): RequestHandler {
  return createExpressMiddleware({
    router: appRouter,
    createContext,
    maxBatchSize: MAX_BATCH_SIZE,
    onError: ({ error, path, type }) => logApiError(error, path, type),
  });
}
