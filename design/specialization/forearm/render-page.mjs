/**
 * Screenshots the diagram on the real page: the production client build (`npx vite build`,
 * served from dist/public by a small static server here), device stores seeded with a week of
 * forearm work, opened at ?workspace=specialization&region=forearm. Headless Chromium emulating
 * an iPhone (390 × 844 and 375 × 667 pt, device scale 3, touch): not an iPhone, not Safari.
 *
 *   npx vite build && node design/specialization/forearm/render-page.mjs [outDir]
 *
 * The pattern is scripts/perf/measure-client.cjs: /api/trpc answers as the server answers a
 * visitor with no account, so only the device stores speak.
 */
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const outDir = resolve(root, process.argv[2] ?? "docs/specialization-atlas/evidence");
const publicDir = resolve(root, "dist/public");
if (!existsSync(join(publicDir, "index.html"))) throw new Error("Build the client first: npx vite build");
mkdirSync(outDir, { recursive: true });

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".json": "application/json", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json" };
const server = createServer((request, response) => {
  const path = decodeURIComponent(new URL(request.url, "http://x").pathname);
  let file = join(publicDir, path);
  if (!file.startsWith(publicDir) || !existsSync(file) || statSync(file).isDirectory()) file = join(publicDir, "index.html");
  response.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(response);
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const base = `http://127.0.0.1:${server.address().port}`;

/** This week: hammer curls, wrist curls and reverse wrist curls, two-handed, so both arms get them. */
const set = (weight, reps) => ({ weight: String(weight), reps: String(reps), unit: "lb", completed: true });
const day = (iso) => new Date(iso).toISOString();
const sessions = [
  { id: "s1", title: "Pull", dayLabel: "Week 1 · Day 02 · Pull", startedAt: day("2026-10-13T17:00:00Z"), completedAt: day("2026-10-13T18:00:00Z"), status: "completed", exercises: [
    { id: "e1", exerciseName: "Hammer Curl", catalogId: 132, plannedPrescription: "3 × 12", sets: [set(30, 12), set(30, 12), set(30, 10)] },
    { id: "e2", exerciseName: "Wrist Curl", catalogId: 139, plannedPrescription: "4 × 15", sets: [set(60, 15), set(60, 15), set(60, 14), set(60, 12)] },
  ] },
  { id: "s2", title: "Upper", dayLabel: "Week 1 · Day 04 · Upper", startedAt: day("2026-10-15T17:00:00Z"), completedAt: day("2026-10-15T18:00:00Z"), status: "completed", exercises: [
    { id: "e3", exerciseName: "Reverse Wrist Curl", catalogId: 140, plannedPrescription: "3 × 15", sets: [set(30, 15), set(30, 15), set(30, 12)] },
    { id: "e4", exerciseName: "Wrist Curl", catalogId: 139, plannedPrescription: "4 × 15", sets: [set(60, 15), set(60, 15), set(60, 15), set(60, 12)] },
  ] },
];

const browser = await chromium.launch();
const shots = [];
for (const [width, height] of [[390, 844], [375, 667]]) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.route("**/api/trpc/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(new URL(route.request().url()).searchParams.get("batch") ? [{ result: { data: { json: null } } }] : { result: { data: { json: null } } }) }));
  await page.addInitScript((seed) => {
    if (sessionStorage.getItem("diagram-seeded")) return;
    sessionStorage.setItem("diagram-seeded", "1");
    localStorage.setItem("sports-genome-launch-experience-enabled-v1", "off");
    localStorage.setItem("gym-optimizer-athlete-profile-v1", JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Muscle growth", trainingDays: 4, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb", sexForReference: "male", birthYear: 1995, bodyWeight: 180 } }));
    localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(seed));
  }, sessions);
  await page.goto(`${base}/?workspace=specialization&region=forearm`);
  const card = page.locator("section.spz-card", { has: page.locator(".spz-diagram-svg") });
  await card.waitFor({ timeout: 30000 });
  await page.waitForTimeout(400);
  const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  const svgWidth = await page.locator(".spz-diagram-svg").evaluate((svg) => Math.round(svg.getBoundingClientRect().width));
  const name = (suffix) => `diagram-page-${width}-${suffix}.png`;
  // What the athlete sees first: the top of the page at this phone size.
  await page.screenshot({ path: join(outDir, name("viewport")) });
  shots.push({ width, file: name("viewport") });
  // The card on its own. It is taller than the screen, so the capture scrolls; the tab row and
  // the bottom bar are pinned to the screen and would be stitched over it, so they are hidden
  // for the capture only and shown again after.
  const shootCard = async (file) => {
    await page.evaluate(() => {
      for (const element of document.querySelectorAll("body *")) {
        const position = getComputedStyle(element).position;
        if ((position === "fixed" || position === "sticky") && !element.closest(".spz-card")) {
          element.setAttribute("data-capture-hidden", element.style.visibility);
          element.style.visibility = "hidden";
        }
      }
    });
    await card.screenshot({ path: join(outDir, file) });
    await page.evaluate(() => {
      for (const element of document.querySelectorAll("[data-capture-hidden]")) {
        element.style.visibility = element.getAttribute("data-capture-hidden");
        element.removeAttribute("data-capture-hidden");
      }
    });
  };
  await shootCard(name("palm-surface-right"));
  shots.push({ width, file: name("palm-surface-right"), svgWidth, noOverflow });

  // Tap a muscle where it is drawn (its tap square), as a finger would, and see it selected.
  const square = page.locator('.spz-diagram-hit[data-node="forearm.fcu"] rect');
  await square.scrollIntoViewIfNeeded();
  const box = await square.boundingBox();
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(300);
  const pressed = await page.locator('.spz-diagram-hit[data-node="forearm.fcu"]').getAttribute("aria-pressed");
  await shootCard(name("fcu-selected"));
  shots.push({ width, file: name("fcu-selected"), pressed });

  // The left arm, back view: the drawing flips, the words do not, the selection stays.
  await page.getByRole("button", { name: "Left arm" }).click();
  await page.getByRole("group", { name: "View" }).getByRole("button", { name: "Back" }).click();
  await page.waitForTimeout(300);
  await shootCard(name("back-surface-left"));
  shots.push({ width, file: name("back-surface-left") });
  await context.close();
}
await browser.close();
server.close();
writeFileSync(join(outDir, "diagram-page-checks.json"), `${JSON.stringify(shots, null, 2)}\n`);
console.log(JSON.stringify(shots, null, 2));
