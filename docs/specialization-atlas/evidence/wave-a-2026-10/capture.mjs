/**
 * Phone evidence for wave A's integration (docs/specialization-atlas/10-multi-region.md §9.1):
 * the upper arm promoted to a page of its own, beside the forearm, 24 Oct 2026.
 *
 * Headless Chromium emulating an iPhone (viewport, isMobile, hasTouch, deviceScaleFactor 3,
 * en-US, UTC): emulation, not an iPhone, not Safari. The production client build, served by a
 * small static server here, device stores seeded as in page-wave0-2026-10-20/capture.mjs, with a
 * week of upper-arm work added.
 *
 *   npx vite build --outDir <build>
 *   node docs/specialization-atlas/evidence/wave-a-2026-10/capture.mjs <build>
 *
 * Scenes:
 * - the heading row with the region picker at 320, 375, 390 and 430, with and without Back, and
 *   the grid open;
 * - the upper-arm page's first screen and a selected muscle (its sheet) at 390 and 375, with its
 *   SVG drawing (the upper arm has no rendered plates; the forearm's are #102's);
 * - the forearm's biceps and brachialis sheets at 390 and 375: "Targets for this muscle are set on
 *   the upper-arms page" and "Open the upper-arms page", and where that opens;
 * - a 44 px sweep of every visible control on both pages and in the sheets, at 390;
 * - no sideways scroll at 320 on either page or in the sheets.
 *
 * Writes the screenshots kept and checks.json next to this file. Dates are relative to the day it
 * runs (this week's workouts on Monday and Tuesday), UTC.
 */
import { createReadStream, existsSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const buildDir = resolve(process.argv[2] ?? "");
if (!existsSync(join(buildDir, "index.html"))) throw new Error("Usage: capture.mjs <production build>");

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".json": "application/json", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json" };
const server = createServer((request, response) => {
  const path = decodeURIComponent(new URL(request.url, "http://x").pathname);
  let file = join(buildDir, path);
  if (!file.startsWith(buildDir) || !existsSync(file) || statSync(file).isDirectory()) file = join(buildDir, "index.html");
  response.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(response);
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const base = `http://127.0.0.1:${server.address().port}`;

// ---------------------------------------------------------------- the athlete's records

const DAY = 86_400_000;
const todayKey = new Date().toISOString().slice(0, 10);
const mondayMs = (() => { const d = new Date(`${todayKey}T00:00:00Z`); return d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY; })();
const at = (dayOffset, hour) => new Date(mondayMs + dayOffset * DAY + hour * 3_600_000).toISOString();
const set = (weight, reps, extra = {}) => ({ weight: String(weight), reps: String(reps), unit: "lb", completed: true, ...extra });
const hold = (seconds, extra = {}) => ({ weight: "", reps: "", holdSeconds: String(seconds), unit: "lb", completed: true, ...extra });
const workout = (id, dayOffset, label, exercises) => ({ id, title: label, dayLabel: `Week 1 · ${label}`, startedAt: at(dayOffset, 17), completedAt: at(dayOffset, 18), status: "completed", exercises });
const ex = (id, catalogId, exerciseName, sets) => ({ id, exerciseName, catalogId, plannedPrescription: `${sets.length} × 12`, sets });
/** wave 0's forearm week, with a bench press, skull crushers, pushdowns, a pull-up and barbell curls added. */
const sessions = [
  workout("s1", 0, "Day 02 · Pull", [
    ex("e1", 132, "Hammer Curl", [set(30, 12), set(30, 12), set(30, 10)]),
    ex("e2", 139, "Wrist Curl", [set(60, 15), set(60, 15), set(60, 14), set(60, 12)]),
    ex("e5", 46, "Dumbbell Row", [set(60, 10, { side: "right" }), set(60, 10, { side: "left" })]),
    ex("e6", 409, "Suitcase Carry", [hold(40, { side: "left" })]),
    ex("e10", 66, "Pull-Up", [set(0, 8), set(0, 8)]),
    ex("e11", 121, "Barbell Curl", [set(65, 10), set(65, 10), set(65, 8)]),
  ]),
  workout("s2", 1, "Day 04 · Upper", [
    ex("e12", 1, "Barbell Bench Press", [set(185, 8), set(185, 8), set(185, 6)]),
    ex("e13", 148, "Skull Crusher", [set(60, 12), set(60, 10)]),
    ex("e14", 150, "Cable Triceps Pushdown", [set(50, 15), set(50, 12)]),
    ex("e3", 140, "Reverse Wrist Curl", [set(30, 15), set(30, 15), set(30, 12)]),
  ]),
];
const goal = (id, regionId, nodeId, side, target) => ({ id, regionId, nodeId, actionId: null, side, metric: "direct_dynamic_bouts", target, period: "calendar_week", startsOn: new Date(mondayMs - 7 * DAY).toISOString().slice(0, 10), endsOn: null, timezone: "UTC", createdAt: at(-7, 8), updatedAt: at(-7, 8) });
const targets = [goal("t1", "forearm", "forearm.fcu", "right", 6), goal("t2", "upper_arm", "upper_arm.triceps_long", "right", 6), goal("t3", "upper_arm", "upper_arm.biceps", "left", 4)];
const entries = (ids) => ids.map((id) => ({ entryId: id, catalogExerciseId: id }));
const planWeek = { customWorkoutIds: [], weeklyPlanIds: {}, weeklyPlanEntries: { "0-Upper": entries([1, 45, 132]), "1-Lower": entries([167]), "2-Upper": entries([3, 139, 140, 148]), "3-Lower": entries([168]) }, prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: {}, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 0 };
const plan = { version: 2, ...planWeek, weeks: { "1": planWeek }, activeWeek: 1 };

// ---------------------------------------------------------------- the browser

const browser = await chromium.launch();
const checks = {
  note: `Headless Chromium emulating an iPhone (viewport, isMobile, hasTouch, deviceScaleFactor 3, en-US, UTC); emulation, not an iPhone, not Safari. The production build of wave A's head, served here. Device stores seeded: this week, Hammer Curl x3, Wrist Curl x4, Dumbbell Row one per arm, Suitcase Carry in the left hand, Pull-Up x2 and Barbell Curl x3 on Monday; Barbell Bench Press x3, Skull Crusher x2, Cable Triceps Pushdown x2 and Reverse Wrist Curl x3 on Tuesday; a 4-day Upper/Lower plan; targets on the forearm's FCU (right) and the upper arm's long head (right) and biceps (left). Run on ${todayKey}, UTC. Coordinates are CSS px from the top of the screen.`,
  scenes: [],
};
const keep = new Set();
const shot = (name) => (keep.add(name), join(here, `${name}.png`));
const record = (entry) => { checks.scenes.push(entry); console.log(JSON.stringify(entry)); };
const round = (value) => Math.round(value * 10) / 10;

async function open(width, height, { query = "", origin = null, region = "forearm", remembered = null } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, timezoneId: "UTC", locale: "en-US" });
  const page = await context.newPage();
  await page.route("**/api/trpc/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(new URL(route.request().url()).searchParams.get("batch") ? [{ result: { data: { json: null } } }] : { result: { data: { json: null } } }) }));
  if (origin) await page.addInitScript((from) => { window.history.replaceState({ workspace: "specialization", specializationOrigin: from }, "", window.location.href); }, origin);
  await page.addInitScript((seed) => {
    if (sessionStorage.getItem("wave-a-seeded")) return;
    sessionStorage.setItem("wave-a-seeded", "1");
    localStorage.setItem("sports-genome-launch-experience-enabled-v1", "off");
    localStorage.setItem("gym-optimizer-athlete-profile-v1", JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Muscle growth", trainingDays: 4, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb", sexForReference: "male", birthYear: 1995, bodyWeight: 180 } }));
    localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(seed.sessions));
    localStorage.setItem("gym-optimizer-workout-plan-v1", JSON.stringify(seed.plan));
    localStorage.setItem("sports-genome-specialization-goals-v1", JSON.stringify(seed.targets));
    if (seed.remembered) localStorage.setItem("sports-genome-specialization-region-v1", seed.remembered);
  }, { sessions, plan, targets, remembered });
  await page.goto(`${base}/?workspace=specialization${region ? `&region=${region}` : ""}${query}`);
  await page.locator(".spz-page").waitFor({ timeout: 30000 });
  await page.locator(".spz-row").first().waitFor({ timeout: 30000 });
  await page.waitForTimeout(600);
  return { context, page };
}

const tap = async (page, locator) => {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(450);
  return box;
};
const overflowX = (page) => page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth));
/** Every visible control under 44 × 44 px inside the scopes; the drawing's own tap areas are the drawing's. */
const sweep = (page, selectors) => page.evaluate((scopes) => {
  const controls = scopes.flatMap((selector) => Array.from(document.querySelectorAll(selector)).flatMap((scope) => Array.from(scope.querySelectorAll("button, summary, a[href], [role='button'], input:not([type=radio]):not([type=checkbox]), select"))))
    .filter((element, index, all) => all.indexOf(element) === index)
    .filter((element) => !element.closest(".spz-diagram-svg, .spz-diagram svg, .sr-only, [hidden]") && element.getClientRects().length > 0);
  const small = controls.map((element) => ({ element, box: element.getBoundingClientRect() }))
    .filter(({ box }) => box.width > 0 && (box.width < 43.5 || box.height < 43.5))
    .map(({ element, box }) => ({ text: (element.getAttribute("aria-label") || element.textContent || "").trim().slice(0, 60), width: Math.round(box.width * 10) / 10, height: Math.round(box.height * 10) / 10 }))
    .filter((item, index, all) => all.findIndex((other) => other.text === item.text && other.width === item.width) === index);
  return { checked: controls.length, under44px: small };
}, selectors);
/** The drawing the page shows: its SVG, or rendered plates (the forearm's, from #102); with WebGL (SwiftShader here) the forearm draws its 3D model instead, a canvas. */
const drawing = (page) => page.evaluate(() => {
  const svg = document.querySelector(".spz-diagram svg");
  const plate = document.querySelector(".spz-plate");
  const box = (svg ?? plate)?.getBoundingClientRect();
  return { svg: Boolean(svg), svgShapes: svg ? svg.querySelectorAll("path, ellipse, polygon, rect").length : 0, plates: document.querySelectorAll(".spz-plate").length, model3d: Boolean(document.querySelector(".spz-page canvas")), top: box ? Math.round(box.top) : null, width: box ? Math.round(box.width) : null, height: box ? Math.round(box.height) : null };
});
const firstScreen = (page) => page.evaluate(() => {
  const box = (selector) => { const element = document.querySelector(selector); return element ? element.getBoundingClientRect() : null; };
  const dock = box(".mobile-workspace-dock");
  const strip = box(".spz-strip");
  const heading = document.querySelector("#spz-heading");
  const dockTop = dock ? dock.top : window.innerHeight;
  return { heading: heading.textContent, headingIsToggle: Boolean(heading.querySelector("button")), back: document.querySelector(".spz-back")?.textContent ?? null, dockTop: Math.round(dockTop), stripTop: strip ? Math.round(strip.top) : null, stripBottom: strip ? Math.round(strip.bottom) : null, stripWhole: strip ? strip.bottom <= dockTop : null };
});
const sheetText = (sheet) => sheet.evaluate((element) => element.innerText.replace(/\n+/g, " · ").slice(0, 600));

// ---------------------------------------------------------------- the heading row and the region grid

for (const [width, height] of [[320, 568], [375, 667], [390, 844], [430, 932]]) {
  for (const origin of [null, "body"]) {
    const { context, page } = await open(width, height, { origin });
    const toggle = page.locator(".spz-region-toggle");
    const toggleBox = await toggle.boundingBox();
    const head = await page.locator(".spz-head").boundingBox();
    const name = `heading-row${origin ? "-back" : ""}-${width}`;
    await page.screenshot({ path: shot(name), clip: { x: 0, y: 0, width, height: Math.min(height, head.y + head.height + 140) } });
    await tap(page, toggle);
    const grid = await page.locator("#spz-regions").boundingBox();
    const cells = await page.evaluate(() => Array.from(document.querySelectorAll("#spz-regions .spz-region")).map((cell) => {
      const box = cell.getBoundingClientRect();
      return { label: cell.querySelector("span").textContent, targets: cell.querySelector("small")?.textContent ?? null, pressed: cell.getAttribute("aria-pressed"), width: Math.round(box.width * 10) / 10, height: Math.round(box.height * 10) / 10, row: Math.round(box.top) };
    }));
    const gridName = `region-grid${origin ? "-back" : ""}-${width}`;
    if (!origin || width === 320) await page.screenshot({ path: shot(gridName), clip: { x: 0, y: 0, width, height: Math.min(height, grid.y + grid.height + 120) } });
    record({
      scene: "heading-row-and-grid", viewport: `${width}x${height}`, back: origin ? await page.locator(".spz-back").textContent() : null,
      head: { top: round(head.y), height: round(head.height) }, toggle: { label: await toggle.textContent(), width: round(toggleBox.width), height: round(toggleBox.height), expanded: await toggle.getAttribute("aria-expanded") },
      grid: { top: round(grid.y), height: round(grid.height), rows: new Set(cells.map((cell) => cell.row)).size }, cells,
      sweep: await sweep(page, [".spz-head-wrap"]), horizontalOverflowPx: await overflowX(page),
      files: [`${name}.png`, `${gridName}.png`].filter((file) => keep.has(file.replace(/\.png$/, ""))),
    });
    // Pick the upper arm from the grid: the page changes region and keeps its drawing an SVG.
    if (!origin && width === 390) {
      await tap(page, page.locator("#spz-regions .spz-region", { hasText: "Upper arms" }));
      await page.locator(".spz-row").first().waitFor();
      await page.waitForTimeout(600);
      record({ scene: "pick-upper-arms", viewport: `${width}x${height}`, address: await page.evaluate(() => window.location.search), heading: await page.locator(".spz-region-toggle").textContent(), gridHidden: await page.locator("#spz-regions").evaluate((element) => element.hidden), said: await page.locator(".spz-page > [aria-live='polite']").textContent(), drawing: await drawing(page) });
    }
    await context.close();
  }
}

// ---------------------------------------------------------------- the upper-arm page

for (const [width, height] of [[390, 844], [375, 667], [320, 568]]) {
  const { context, page } = await open(width, height, { region: "upper_arm" });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  const name = `upper-arm-first-screen-${width}`;
  if (width !== 320) await page.screenshot({ path: shot(name) });
  const rows = await page.evaluate(() => Array.from(document.querySelectorAll(".spz-row")).map((row) => (row.getAttribute("aria-label") || row.textContent || "").trim().slice(0, 90)));
  const full = `upper-arm-page-${width}`;
  if (width === 390) await page.screenshot({ path: shot(full), fullPage: true });
  record({ scene: "upper-arm-first-screen", viewport: `${width}x${height}`, address: await page.evaluate(() => window.location.search), ...(await firstScreen(page)), drawing: await drawing(page), rows, sweep: width === 390 ? await sweep(page, [".spz-page"]) : undefined, horizontalOverflowPx: await overflowX(page), files: [name, full].filter((file) => keep.has(file)).map((file) => `${file}.png`) });

  // A selected muscle: the long head's sheet, from its row.
  await tap(page, page.locator("button.spz-row", { hasText: "Triceps, long head" }).first());
  const sheet = page.getByRole("dialog").first();
  await sheet.waitFor();
  await page.waitForTimeout(400);
  const sheetName = `upper-arm-long-head-sheet-${width}`;
  if (width !== 320) await page.screenshot({ path: shot(sheetName) });
  record({ scene: "upper-arm-selected", viewport: `${width}x${height}`, address: await page.evaluate(() => window.location.search), sheet: (await sheetText(sheet)).slice(0, 400), sweep: await sweep(page, ["[role='dialog']"]), horizontalOverflowPx: await overflowX(page), sheetOverflowPx: await sheet.evaluate((element) => Math.max(0, element.scrollWidth - element.clientWidth)), files: keep.has(sheetName) ? [`${sheetName}.png`] : [] });
  await context.close();
}
// The upper arm selected by the address: the drawing shows the selection.
for (const [width, height] of [[390, 844], [375, 667]]) {
  const { context, page } = await open(width, height, { region: "upper_arm", query: "&node=upper_arm.biceps" });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  const name = `upper-arm-biceps-selected-${width}`;
  await page.screenshot({ path: shot(name) });
  record({ scene: "upper-arm-node-in-address", viewport: `${width}x${height}`, address: await page.evaluate(() => window.location.search), ...(await firstScreen(page)), drawing: await drawing(page), selected: await page.evaluate(() => document.querySelector(".spz-diagram [aria-pressed='true'], .spz-diagram .is-selected, .spz-diagram [data-selected='true']")?.getAttribute("aria-label") ?? null), horizontalOverflowPx: await overflowX(page), files: [`${name}.png`] });
  await context.close();
}

// ---------------------------------------------------------------- the forearm's biceps and brachialis sheets

for (const [width, height] of [[390, 844], [375, 667], [320, 568]]) {
  for (const muscle of ["Biceps brachii", "Brachialis"]) {
    const { context, page } = await open(width, height, { region: "forearm" });
    const forearm = { drawing: await drawing(page), sweep: width === 390 && muscle === "Brachialis" ? await sweep(page, [".spz-page"]) : undefined, horizontalOverflowPx: await overflowX(page) };
    if (width === 390 && muscle === "Brachialis") await page.screenshot({ path: shot("forearm-page-390"), fullPage: true });
    await tap(page, page.locator("button.spz-row", { hasText: muscle }).first());
    const sheet = page.getByRole("dialog").first();
    await sheet.waitFor();
    await page.waitForTimeout(400);
    const slug = muscle === "Brachialis" ? "brachialis" : "biceps";
    const topName = `forearm-${slug}-sheet-${width}`;
    if (width !== 320) await page.screenshot({ path: shot(topName) });
    const note = sheet.getByText("Targets for this muscle are set on the upper-arms page.");
    const link = sheet.getByRole("button", { name: "Open the upper-arms page" });
    await link.scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    const linkBox = await link.boundingBox();
    const linkName = `forearm-${slug}-sheet-link-${width}`;
    if (width !== 320) await page.screenshot({ path: shot(linkName) });
    const entry = { scene: "forearm-external-sheet", viewport: `${width}x${height}`, muscle, forearm, note: await note.count(), link: { width: round(linkBox.width), height: round(linkBox.height), top: round(linkBox.y) }, sheet: (await sheetText(sheet)).slice(0, 500), sweep: await sweep(page, ["[role='dialog']"]), horizontalOverflowPx: await overflowX(page), sheetOverflowPx: await sheet.evaluate((element) => Math.max(0, element.scrollWidth - element.clientWidth)) };
    await tap(page, link);
    await page.locator(".spz-row").first().waitFor();
    await page.waitForTimeout(600);
    entry.afterOpen = { address: await page.evaluate(() => window.location.search), heading: await page.locator("#spz-heading").textContent(), drawing: await drawing(page), focus: await page.evaluate(() => (document.activeElement?.textContent ?? "").trim().slice(0, 40)), said: await page.locator(".spz-page > [aria-live='polite']").textContent() };
    entry.files = [topName, linkName].filter((file) => keep.has(file)).map((file) => `${file}.png`);
    record(entry);
    await context.close();
  }
}

await browser.close();
server.close();
checks.kept = [...keep].sort().map((name) => `${name}.png`);
writeFileSync(join(here, "checks.json"), `${JSON.stringify(checks, null, 2)}\n`);
