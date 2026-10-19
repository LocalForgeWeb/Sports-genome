/**
 * The headless browser and the local server the drawing's evidence scripts share, so none of
 * them names a machine's paths. Headless Chromium emulating a phone is evidence of layout and
 * tap targets, not a test on an iPhone or in Safari.
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Playwright, wherever this machine has it: PLAYWRIGHT_MODULE (a path to the package or its
 * index.mjs), the project's own dependency, or the copy installed beside this Node (the sandbox
 * keeps it in /opt/node22/lib/node_modules). The project does not depend on it, so nothing is installed.
 */
async function loadPlaywright() {
  const named = process.env.PLAYWRIGHT_MODULE;
  const candidates = [
    ...(named ? [named.endsWith(".mjs") ? named : join(named, "index.mjs")] : []),
    "playwright",
    resolve(dirname(process.execPath), "../lib/node_modules/playwright/index.mjs"),
  ];
  for (const candidate of candidates) {
    try {
      return await import(candidate === "playwright" ? candidate : pathToFileURL(candidate).href);
    } catch {
      // Not there; try the next.
    }
  }
  throw new Error(`Playwright not found (tried ${candidates.join(", ")}). Set PLAYWRIGHT_MODULE to its folder.`);
}

export const { chromium } = await loadPlaywright();

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".json": "application/json", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json" };

/**
 * Serves a production client build (`npx vite build` writes dist/public) on a free local port,
 * every unknown path answered with index.html as the app's host does. Resolves to its base URL
 * and a close function.
 */
export async function serveBuild(publicDir) {
  if (!existsSync(join(publicDir, "index.html"))) throw new Error(`No build in ${publicDir}: run npx vite build first`);
  const server = createServer((request, response) => {
    const path = decodeURIComponent(new URL(request.url, "http://x").pathname);
    let file = join(publicDir, path);
    if (!file.startsWith(publicDir) || !existsSync(file) || statSync(file).isDirectory()) file = join(publicDir, "index.html");
    response.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
    createReadStream(file).pipe(response);
  });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  return { base: `http://127.0.0.1:${server.address().port}`, close: () => server.close() };
}

/**
 * The tRPC answer the server gives a visitor with no account, so only the device stores speak
 * (the pattern of scripts/perf/measure-client.cjs).
 */
export const answerAsVisitor = (page) => page.route("**/api/trpc/**", (route) => route.fulfill({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify(new URL(route.request().url()).searchParams.get("batch") ? [{ result: { data: { json: null } } }] : { result: { data: { json: null } } }),
}));
