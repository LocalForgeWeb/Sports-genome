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

  it("still ships the client from the vite build", () => {
    expect(vercelConfig.outputDirectory).toBe("dist/public");
  });

  it("defines the API as one catch-all function so /api/trpc keeps its mount path", () => {
    const source = read("server/_core/serverless.ts");
    // The router and context are imported, never redefined, so the deployed surface
    // cannot drift from the one the dev server runs.
    expect(source).toContain('from "../routers"');
    expect(source).toContain('from "./context"');
    expect(source).toContain('app.use(\n  "/api/trpc",');
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

  it("404s unknown API paths in JSON, so a client never parses an HTML error page", async () => {
    const response = await fetch(base + "/api/not-a-route");
    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toMatch(/application\/json/);
    await expect(response.json()).resolves.toEqual({ error: "Not found" });
  });
});
