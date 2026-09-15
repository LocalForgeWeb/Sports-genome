import express, { type Request, type Response } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";

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

// The platform caps request bodies well below this; the limit only guards the parser.
app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ limit: "4mb", extended: true }));

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Anything else under /api is a genuine 404. Answering in JSON stops a client from
// parsing an HTML error page as if it were a tRPC response.
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

export default app;
