import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { requireJsonMutations, trpcHandler } from "./apiHandler";
import { serveStatic, setupVite } from "./vite";
import { serveSharePage } from "../sharePage";
import { BODY_LIMIT, apiErrorHandler, apiNotFound, mountHealth, noStore, requestContext } from "./http";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.disable("x-powered-by");
  // The same request layer as the deployed function (http.ts), so local runs answer as production does.
  app.use(requestContext);
  app.use(express.json({ limit: BODY_LIMIT }));
  app.use(express.urlencoded({ limit: BODY_LIMIT, extended: true }));
  mountHealth(app);
  app.use("/api/trpc", noStore, requireJsonMutations, trpcHandler());
  app.use("/api", apiNotFound);
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    // A shared workout's page, its head written for link previews (server/sharePage.ts).
    app.get("/s/:token", (req, res, next) => { serveSharePage(req.params.token, req.headers, res).catch(next); });
    serveStatic(app);
  }
  app.use(apiErrorHandler);

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
