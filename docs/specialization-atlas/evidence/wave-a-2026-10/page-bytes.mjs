/**
 * What opening Specialize downloads, counted the way 09-page.md ("What the page downloads") counts
 * it: open Muscles, let it settle, tap Specialize, and add up every .js file requested from then
 * until the map is drawn, in raw bytes as built (the file on disk, not the bytes on the wire).
 *
 * Headless Chromium emulating an iPhone (390 × 844, isMobile, hasTouch, deviceScaleFactor 3,
 * en-US, UTC): not an iPhone, not Safari. The production client build, served by a small static
 * server here, with a week of forearm work, a plan and a forearm target on the device.
 *
 * Two figures. With WebGL (SwiftShader; a phone's default) the page draws the 3D model, and "drawn"
 * is the model's stage ready; the model's own lazy chunk (three.js and the viewer,
 * `ForearmModelView-*.js`, and its Draco decoder) loads once the stage is on screen and is listed apart (`model`), since
 * main loads the same chunk the same way. With --drawing, 3D APIs are off, so the page falls back to
 * the Drawing, and "drawn" is the drawing's svg.
 *
 *   npx vite build --outDir <build>
 *   node docs/specialization-atlas/evidence/wave-a-2026-10/page-bytes.mjs <build> <label> [--drawing] [runs] [--region <id>]
 *
 * Prints one JSON object: the .js files requested after the tap until the map is drawn, in order,
 * with their sizes raw and gzipped (zlib level 9, as a server would send them); the total, the
 * model's chunk and the rest (`page`), each raw and gzipped; and whether every run requested the
 * same files.
 *
 * Wave A (23 Oct 2026): release-fix-2026-10-22/page-bytes.mjs with the gzipped sizes added and
 * `--region <id>`, which seeds the device's last-opened region (`sports-genome-specialization-region-v1`,
 * no account) so the tab opens that region's page; and, with --drawing, "drawn" is the region's SVG
 * or its rendered plates where it has them (the forearm's from #102), ready or failed. Nothing else
 * changed. Without --region the tab opens the forearm, as on `main`. Only .js files are counted, as
 * the gate always has; a plate's images (two files, 12-18 KB) follow once it is on screen.
 */
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";

const buildDir = resolve(process.argv[2] ?? "");
const label = process.argv[3] ?? "";
const drawing = process.argv.includes("--drawing");
const runs = Number(process.argv.find((arg) => /^\d+$/.test(arg)) ?? 3);
const regionAt = process.argv.indexOf("--region");
const region = regionAt > 0 ? process.argv[regionAt + 1] : null;
if (!existsSync(join(buildDir, "index.html")) || !label) throw new Error("Usage: page-bytes.mjs <production build> <label> [--drawing] [runs]");

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".json": "application/json", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json", ".glb": "model/gltf-binary", ".wasm": "application/wasm" };
const server = createServer((request, response) => {
  const path = decodeURIComponent(new URL(request.url, "http://x").pathname);
  let file = join(buildDir, path);
  if (!file.startsWith(buildDir) || !existsSync(file) || statSync(file).isDirectory()) file = join(buildDir, "index.html");
  response.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(response);
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const base = `http://127.0.0.1:${server.address().port}`;

// The athlete's records: this week's forearm work, a plan, a forearm target (as reconcile-2026-10-21/capture.mjs seeds them).
const DAY = 86_400_000;
const todayKey = new Date().toISOString().slice(0, 10);
const mondayMs = (() => { const d = new Date(`${todayKey}T00:00:00Z`); return d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY; })();
const at = (dayOffset, hour) => new Date(mondayMs + dayOffset * DAY + hour * 3_600_000).toISOString();
const set = (weight, reps, extra = {}) => ({ weight: String(weight), reps: String(reps), unit: "lb", completed: true, ...extra });
const workout = (id, dayOffset, dayLabel, exercises) => ({ id, title: dayLabel, dayLabel: `Week 1 · ${dayLabel}`, startedAt: at(dayOffset, 17), completedAt: at(dayOffset, 18), status: "completed", exercises });
const ex = (id, catalogId, exerciseName, sets) => ({ id, exerciseName, catalogId, plannedPrescription: `${sets.length} × 12`, sets });
const sessions = [
  workout("s1", 0, "Day 01 · Upper", [ex("e1", 132, "Hammer Curl", [set(30, 12), set(30, 12), set(30, 10)]), ex("e2", 410, "One-Arm Dumbbell Wrist Curl", [set(25, 15), set(25, 15)])]),
  workout("s2", 1, "Day 02 · Lower", [ex("e3", 139, "Wrist Curl", [set(60, 15), set(60, 15), set(60, 12)])]),
];
const lastWeek = new Date(mondayMs - 7 * DAY).toISOString().slice(0, 10);
const goals = [{ id: "fcr", regionId: "forearm", nodeId: "forearm.fcr", actionId: null, side: "right", metric: "direct_dynamic_bouts", target: 8, period: "calendar_week", startsOn: lastWeek, endsOn: null, timezone: "UTC", createdAt: at(-7, 8), updatedAt: at(-7, 8) }];
const entries = (ids) => ids.map((id) => ({ entryId: id, catalogExerciseId: id }));
const planWeek = { customWorkoutIds: [], weeklyPlanIds: {}, weeklyPlanEntries: { "0-Upper": entries([410, 132]), "1-Lower": entries([167]), "2-Upper": entries([3, 139]), "3-Lower": entries([168]) }, prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: {}, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 0 };
const plan = { version: 2, ...planWeek, weeks: { "1": planWeek }, activeWeek: 1 };

const browser = await chromium.launch({ args: drawing ? ["--disable-3d-apis"] : ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const sizeOf = (url) => { const file = join(buildDir, decodeURIComponent(new URL(url).pathname)); return existsSync(file) ? statSync(file).size : null; };
const gzipOf = (url) => { const file = join(buildDir, decodeURIComponent(new URL(url).pathname)); return existsSync(file) ? gzipSync(readFileSync(file), { level: 9 }).length : null; };

async function measure() {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, timezoneId: "UTC", locale: "en-US" });
  const page = await context.newPage();
  await page.route("**/api/trpc/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(new URL(route.request().url()).searchParams.get("batch") ? [{ result: { data: { json: null } } }] : { result: { data: { json: null } } }) }));
  await page.addInitScript((seed) => {
    if (sessionStorage.getItem("page-bytes-seeded")) return;
    sessionStorage.setItem("page-bytes-seeded", "1");
    localStorage.setItem("sports-genome-launch-experience-enabled-v1", "off");
    localStorage.setItem("gym-optimizer-athlete-profile-v1", JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Muscle growth", trainingDays: 4, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb", sexForReference: "male", birthYear: 1995, bodyWeight: 180 } }));
    localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(seed.sessions));
    localStorage.setItem("gym-optimizer-workout-plan-v1", JSON.stringify(seed.plan));
    localStorage.setItem("sports-genome-specialization-goals-v1", JSON.stringify(seed.goals));
    if (seed.region) localStorage.setItem("sports-genome-specialization-region-v1", seed.region);
  }, { sessions, plan, goals, region });
  let phase = "muscles";
  const requested = { muscles: [], specialize: [] };
  page.on("request", (request) => {
    const url = request.url();
    if (url.startsWith(base) && new URL(url).pathname.endsWith(".js")) requested[phase].push(url);
  });
  await page.goto(`${base}/?workspace=body`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
  phase = "specialize";
  await page.locator("button, [role=tab], a").filter({ hasText: /^Specialize$/ }).first().click();
  // The Drawing is the region's SVG, or its rendered plates where it has them (the forearm's, from #102), ready or failed.
  const drawn = drawing ? ".spz-diagram svg, .spz-plate[data-status='ready'], .spz-plate[data-status='error']" : ".sg-anatomy3d-stage[data-status='ready'], .sg-anatomy3d-stage[data-status='error']";
  await page.locator(drawn).first().waitFor({ timeout: 90000 });
  await page.waitForTimeout(1500);
  const figure = await page.evaluate(() => (document.querySelector(".sg-anatomy3d-stage") ? `3D model (${document.querySelector(".sg-anatomy3d-stage").getAttribute("data-status")})` : document.querySelector(".spz-plate") ? `Drawing: plates (${document.querySelector(".spz-plate").getAttribute("data-status")})` : document.querySelector(".spz-diagram svg") ? "Drawing: SVG" : "none"));
  await context.close();
  const files = (urls) => [...new Set(urls)].map((url) => ({ file: new URL(url).pathname.replace(/^\/assets\//, ""), bytes: sizeOf(url), gzip: gzipOf(url) }));
  const specialize = files(requested.specialize);
  const sum = (list) => list.reduce((n, file) => n + (file.bytes ?? 0), 0);
  const sumGzip = (list) => list.reduce((n, file) => n + (file.gzip ?? 0), 0);
  const isModel = (file) => /^ForearmModelView-|^\/draco\//.test(file.file);
  const rest = specialize.filter((file) => !isModel(file));
  return { figure, specialize, total: sum(specialize), totalGzip: sumGzip(specialize), model: sum(specialize.filter(isModel)), page: sum(rest), pageGzip: sumGzip(rest), filesBeforeTheTap: files(requested.muscles).length };
}

const results = [];
for (let run = 0; run < runs; run += 1) results.push(await measure());
await browser.close();
server.close();
const same = results.every((result) => JSON.stringify(result.specialize) === JSON.stringify(results[0].specialize));
console.log(JSON.stringify({ label, region: region ?? "(the tab)", figureAsked: drawing ? "drawing (3D APIs off)" : "3D model (WebGL)", runs, sameEveryRun: same, ...results[0] }, null, 1));
