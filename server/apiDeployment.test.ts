import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createServer, type Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import apiHandler from "./_core/serverless";

const read = (relative: string) => readFileSync(join(process.cwd(), relative), "utf8");
const vercelConfig = JSON.parse(read("vercel.json"));

/**
 * Production served the SPA for every /api call: the catch-all rewrite matched them
 * first, so tRPC received `index.html` with a 200 and every server-backed feature was
 * silently inert. These pin the two halves of the fix - the route has to reach a
 * function, and that function has to answer as an API.
 */
describe("the API is actually deployed", () => {
  it("routes the tRPC path explicitly, carrying the procedure path through", () => {
    // The catch-all alone matched only a single segment under this framework preset:
    // /api/anything reached the function, /api/trpc/healthcheck did not.
    const api = (vercelConfig.rewrites || []).find((r: { source: string }) => r.source.startsWith("/api/trpc"));
    expect(api, "an explicit /api/trpc rewrite exists").toBeTruthy();
    expect(api.destination).toContain("__trpc=:path*");
  });

  it("routes every other deeper /api path to the function too, after tRPC", () => {
    // /api/health/ready answered the platform's own plain-text 404 in production: the
    // catch-all never saw it. Deeper paths now reach the function and its JSON answers.
    const rewrites: { source: string; destination: string }[] = vercelConfig.rewrites || [];
    const deeper = rewrites.findIndex((r) => r.destination.includes("__api="));
    const trpc = rewrites.findIndex((r) => r.source.startsWith("/api/trpc"));
    expect(deeper, "a rewrite carries deeper /api paths").toBeGreaterThan(-1);
    expect(rewrites[deeper].source).toBe("/api/:first/:rest+");
    expect(rewrites[deeper].destination).toBe("/api/[...path]?__api=:first/:rest+");
    expect(trpc, "tRPC keeps its own rule, ahead of the general one").toBeLessThan(deeper);
  });

  it("keeps the SPA rewrite away from /api", () => {
    const rewrites = vercelConfig.rewrites || [];
    expect(rewrites.length).toBeGreaterThan(0);
    const spa = rewrites.find((r: { destination: string }) => r.destination === "/index.html");
    expect(spa, "an SPA fallback rewrite exists").toBeTruthy();

    // Exercise the rule the way Vercel does, rather than trusting the string.
    const pattern = new RegExp("^" + spa.source + "$");
    expect(pattern.test("/api/trpc/strengthGenome.referenceRows"), "API is not rewritten").toBe(false);
    expect(pattern.test("/api/anything"), "nothing under /api is rewritten").toBe(false);
    expect(pattern.test("/"), "the app root still resolves to the SPA").toBe(true);
    expect(pattern.test("/progress"), "client routes still resolve to the SPA").toBe(true);
  });

  it("refuses to be framed and to have its responses sniffed", () => {
    const rule = (vercelConfig.headers || []).find((r: { source: string }) => r.source === "/(.*)");
    expect(rule, "a catch-all headers rule exists").toBeTruthy();

    // Exercise the rule the way Vercel does: it has to cover the app and the API alike.
    const pattern = new RegExp("^" + rule.source + "$");
    for (const path of ["/", "/progress", "/api/trpc/x"]) expect(pattern.test(path), path).toBe(true);

    const headers = Object.fromEntries(rule.headers.map((h: { key: string; value: string }) => [h.key, h.value]));
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Content-Security-Policy"]).toBe("frame-ancestors 'none'");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
  });

  it("still ships the client from the vite build", () => {
    expect(vercelConfig.outputDirectory).toBe("dist/public");
  });

  it("defines the API as one catch-all function so /api/trpc keeps its mount path", () => {
    const source = read("server/_core/serverless.ts");
    // The router and context are imported, never redefined, so the deployed surface
    // cannot drift from the one the dev server runs. Both entry points mount the one
    // shared handler, which is where the router and context are imported.
    const handler = read("server/_core/apiHandler.ts");
    expect(source).toContain('from "./apiHandler"');
    expect(read("server/_core/index.ts")).toContain('from "./apiHandler"');
    expect(handler).toContain('from "../routers"');
    expect(handler).toContain('from "./context"');
    expect(source).toContain('app.use("/api/trpc", noStore, requireJsonMutations, trpcHandler());');
    expect(source).not.toContain("listen(");
  });

  it("ships the function as a bundle, because the platform transpiles without bundling", () => {
    // Vercel emitted api/[...path].js with its extensionless `../server/routers`
    // import intact. Under "type": "module" Node refuses to resolve that, and every
    // invocation died with ERR_MODULE_NOT_FOUND. A bundle has no internal specifiers
    // left to resolve.
    const entry = read("api/[...path].js");
    expect(entry).toContain('export { default } from "../dist/serverless.js"');
    // The extension is what Node's ESM resolver requires; dropping it reintroduces
    // exactly the failure above.
    expect(entry).toContain(".js\"");
    expect(JSON.parse(read("package.json")).scripts.build).toContain("--outfile=dist/serverless.js");
  });
});

describe("the deployed handler answers as an API", () => {
  let server: Server;
  let base = "";

  beforeAll(async () => {
    server = createServer(apiHandler as never);
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (address && typeof address === "object") base = `http://127.0.0.1:${address.port}`;
  });
  afterAll(async () => {
    await new Promise<void>(resolve => server.close(() => resolve()));
  });

  it("returns JSON from a tRPC query rather than the SPA document", async () => {
    const response = await fetch(base + "/api/trpc/strengthGenome.referenceRows");
    expect(response.headers.get("content-type")).toMatch(/application\/json/);
    const body = await response.json();
    // Without registry credentials the adapter yields an empty list rather than
    // throwing, so this asserts the shape of a real tRPC envelope.
    expect(body).toHaveProperty("result");
    expect(Array.isArray(body.result.data.json)).toBe(true);
  });

  it("restores the tRPC mount path when the platform delivers the function path", async () => {
    // Simulates the rewritten shape: the function's own path plus the carried
    // procedure. Without the normalizer this 404s instead of reaching tRPC.
    const response = await fetch(base + "/api/%5B...path%5D?__trpc=strengthGenome.referenceRows");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/application\/json/);
    const body = await response.json();
    expect(Array.isArray(body.result.data.json)).toBe(true);
  });

  it("restores a deeper /api path carried by the rewrite, and only a plain one", async () => {
    const previous = process.env.HEALTH_CHECK_TOKEN;
    process.env.HEALTH_CHECK_TOKEN = "test-token";
    try {
      // The function's own path plus the carried one reaches readiness, which still needs its token.
      const hidden = await fetch(base + "/api/%5B...path%5D?__api=health/ready");
      expect(hidden.status).toBe(404);
      const ready = await fetch(base + "/api/%5B...path%5D?__api=health/ready", { headers: { "x-health-token": "test-token" } });
      expect([200, 503]).toContain(ready.status);
      await expect(ready.json()).resolves.toHaveProperty("status");
      // A dot-segment is not a path to restore: the request stays where it was, a JSON 404.
      for (const carried of ["health/../ready", "health/./ready", "health//ready", "health"]) {
        const refused = await fetch(base + `/api/%5B...path%5D?__api=${encodeURIComponent(carried)}`, { headers: { "x-health-token": "test-token" } });
        expect(refused.status, carried).toBe(404);
        await expect(refused.json()).resolves.toMatchObject({ error: "Not found" });
      }
    } finally {
      if (previous === undefined) delete process.env.HEALTH_CHECK_TOKEN; else process.env.HEALTH_CHECK_TOKEN = previous;
    }
  });

  it("404s unknown API paths in JSON, so a client never parses an HTML error page", async () => {
    const response = await fetch(base + "/api/not-a-route");
    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toMatch(/application\/json/);
    await expect(response.json()).resolves.toMatchObject({ error: "Not found", path: "/api/not-a-route" });
  });
});
