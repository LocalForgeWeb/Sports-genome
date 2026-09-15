import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

/**
 * The API as a serverless function.
 *
 * `server/_core/index.ts` is the long-running dev server: it binds a port and also
 * serves the client. Neither of those belongs in a serverless deployment, so this
 * file mounts the same router and the same context on a bare Express app and exports
 * it as the request handler. There is deliberately no second definition of the API
 * here - the router and context are imported, so the deployed surface and the local
 * one cannot drift apart.
 *
 * The filename is a catch-all so that every /api/* path reaches this handler with its
 * original URL intact, which is what lets the tRPC middleware keep its /api/trpc
 * mount point. vercel.json must also exclude /api from the SPA rewrite, or the
 * rewrite swallows these requests and returns index.html with a 200 - which is
 * exactly how this API came to be silently missing from production.
 */
const app = express();

// Vercel terminates TLS upstream, so the original protocol arrives in
// x-forwarded-proto. Without this, secure-cookie decisions read the internal hop.
app.set("trust proxy", 1);

// Vercel caps request bodies well below this; the limit only guards the parser.
app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ limit: "4mb", extended: true }));

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Anything else under /api is a genuine 404. Answering in JSON keeps clients from
// parsing an HTML error page as a tRPC response.
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

export default app;
