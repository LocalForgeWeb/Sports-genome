/**
 * Phone evidence for the final review's page lane (17 Oct 2026): F-phone-1, -2, -5, -7, -8,
 * F-completeness-2, -4, -5 and the first-screen numbers 09-page.md cites (F-docs-9).
 *
 * Headless Chromium emulating an iPhone (viewport, isMobile, hasTouch, deviceScaleFactor 3):
 * not an iPhone, not Safari. The production client build (`npx vite build`) served from
 * dist/public by a small static server here, device stores seeded, opened at
 * ?workspace=specialization&region=forearm. The pattern is design/specialization/forearm/render-page.mjs.
 *
 *   npx vite build && node docs/specialization-atlas/evidence/page-final-2026-10-17/capture.mjs
 *
 * Writes the screenshots and checks.json next to this file. Dates are relative to the day it
 * runs (this week's workouts on this week's Monday and Tuesday), in UTC.
 */
import { createReadStream, existsSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { createServer } from "node:http";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../../..");
const publicDir = "/tmp/claude-0/-home-user-Sports-genome/1ff0a7bc-72e5-5e41-a8d9-937a97929500/scratchpad/multi-region/critic-phone/dist";
if (!existsSync(join(publicDir, "index.html"))) throw new Error("Build the client first: npx vite build");

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

// ---------------------------------------------------------------- the athlete's records

const DAY = 86_400_000;
const now = Date.now();
const todayKey = new Date(now).toISOString().slice(0, 10);
const mondayMs = (() => { const d = new Date(`${todayKey}T00:00:00Z`); return d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY; })();
const at = (dayOffset, hour) => new Date(mondayMs + dayOffset * DAY + hour * 3_600_000).toISOString();
const set = (weight, reps, extra = {}) => ({ weight: String(weight), reps: String(reps), unit: "lb", completed: true, ...extra });
const hold = (seconds) => ({ weight: "", reps: "", holdSeconds: String(seconds), unit: "lb", completed: true });
const workout = (id, dayOffset, label, exercises) => ({ id, title: label, dayLabel: `Week 1 · ${label}`, startedAt: at(dayOffset, 17), completedAt: at(dayOffset, 18), status: "completed", exercises });
const sessions = [
  // This week: hammer curls and wrist curls on Monday, reverse wrist curls and wrist curls on Tuesday, two-handed.
  workout("s1", 0, "Day 02 · Pull", [
    { id: "e1", exerciseName: "Hammer Curl", catalogId: 132, plannedPrescription: "3 × 12", sets: [set(30, 12), set(30, 12), set(30, 10)] },
    { id: "e2", exerciseName: "Wrist Curl", catalogId: 139, plannedPrescription: "4 × 15", sets: [set(60, 15), set(60, 15), set(60, 14), set(60, 12)] },
  ]),
  workout("s2", 1, "Day 04 · Upper", [
    { id: "e3", exerciseName: "Reverse Wrist Curl", catalogId: 140, plannedPrescription: "3 × 15", sets: [set(30, 15), set(30, 15), set(30, 12)] },
    { id: "e4", exerciseName: "Wrist Curl", catalogId: 139, plannedPrescription: "4 × 15", sets: [set(60, 15), set(60, 15), set(60, 15), set(60, 12)] },
  ]),
  // Dead hangs over three earlier weeks: 40 s, 80 s, 75 s. The 80 s hang beat every earlier one.
  workout("h1", -20, "Day 02 · Pull", [{ id: "d1", exerciseName: "Dead Hang", catalogId: 143, plannedPrescription: "2 × 40 s", sets: [hold(40), hold(35)] }]),
  workout("h2", -13, "Day 02 · Pull", [{ id: "d2", exerciseName: "Dead Hang", catalogId: 143, plannedPrescription: "2 × 40 s", sets: [hold(80), hold(60)] }]),
  workout("h3", -6, "Day 02 · Pull", [{ id: "d3", exerciseName: "Dead Hang", catalogId: 143, plannedPrescription: "2 × 40 s", sets: [hold(75), hold(70)] }]),
];
const reading = (id, dayOffset, metric, value, protocol) => ({
  id, regionId: "forearm", side: "right", measuredAt: at(dayOffset, 7), metric, value,
  protocol: { landmark: "5 cm below elbow crease", distanceFromLandmarkCm: 5, posture: "elbow_90_supported", condition: "unpumped", device: "Gulick tape", timeOfDay: "07:00", ...protocol },
  notes: null,
});
const N = 9.80665;
const measurements = [
  reading("c1", -21, "circumference_cm", 31.5, {}),
  reading("c2", -14, "circumference_cm", 31.6, {}),
  // The tape moved: a different landmark and no distance. Drawn as a diamond and counted.
  reading("c3", -7, "circumference_cm", 32.4, { landmark: "Thickest point", distanceFromLandmarkCm: null }),
  reading("c4", 0, "circumference_cm", 31.7, {}),
  reading("g1", -21, "grip_force_n", 40 * N, { landmark: "Dynamometer grip", distanceFromLandmarkCm: null, device: "Camry" }),
  reading("g2", -14, "grip_force_n", 45 * N, { landmark: "Dynamometer grip", distanceFromLandmarkCm: null, device: "Camry" }),
  reading("g3", 0, "grip_force_n", 43 * N, { landmark: "Dynamometer grip", distanceFromLandmarkCm: null, device: "Camry" }),
];
const goal = (id, nodeId, side, target, metric = "direct_dynamic_bouts") => ({ id, regionId: "forearm", nodeId, actionId: null, side, metric, target, period: "calendar_week", startsOn: new Date(mondayMs - 7 * DAY).toISOString().slice(0, 10), endsOn: null, timezone: "UTC", createdAt: at(-7, 8), updatedAt: at(-7, 8) });
const fourTargets = [goal("t1", "forearm.fcu", "left", 6), goal("t2", "forearm.fcu", "right", 6), goal("t3", "forearm.br", "left", 8), goal("t4", "forearm.br", "right", 8)];

/** The four-day Upper/Lower split the profile builds, with forearm work on both Upper days. */
const entries = (ids) => ids.map((id) => ({ entryId: id, catalogExerciseId: id }));
const planWeek = { customWorkoutIds: [], weeklyPlanIds: {}, weeklyPlanEntries: { "0-Upper": entries([1, 45, 132]), "1-Lower": entries([167]), "2-Upper": entries([3, 139, 140]), "3-Lower": entries([168]) }, prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: {}, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 0 };
const plan = { version: 2, ...planWeek, weeks: { "1": planWeek }, activeWeek: 1 };

// ---------------------------------------------------------------- the browser

const browser = await chromium.launch();
const checks = { note: `Headless Chromium emulating an iPhone (viewport, isMobile, hasTouch, deviceScaleFactor 3); not an iPhone, not Safari. Production build (npx vite build) served from dist/public; device stores seeded (this week: Hammer Curl x3 and Wrist Curl x4 on Monday, Reverse Wrist Curl x3 and Wrist Curl x4 on Tuesday; Dead Hang 40 s, 80 s, 75 s on three earlier weeks; circumference and grip readings, one taken at a different place; a 4-day Upper/Lower plan). Run on ${todayKey}, UTC. Page coordinates are CSS px from the top of the screen.`, scenes: [] };
/**
 * Screenshots kept next to this file: 390 and 375 wide, plus 320 for the Not for me sheet (the
 * tightest case). The rest are measured into checks.json and drawn to the system temp folder only.
 */
const kept = (name) => !/-320(-\d+)?$/.test(name) || name === "not-for-me-undo-320";
const shot = (name) => (kept(name) ? join(here, `${name}.png`) : join(tmpdir(), `${name}.png`));
const keptFiles = (entry) => {
  const out = { ...entry };
  if (typeof out.file === "string" && !kept(out.file.replace(/\.png$/, ""))) delete out.file;
  if (Array.isArray(out.files)) out.files = out.files.filter((file) => kept(file.replace(/\.png$/, "")));
  return out;
};
/** Scenes to run (all when none are named): node capture.mjs progress toast. checks.json is written only for a full run. */
const only = new Set(process.argv.slice(2));
const want = (name) => !only.size || only.has(name);
const record = (raw) => { const entry = keptFiles(raw); checks.scenes.push(entry); console.log(JSON.stringify(entry)); };

async function open(width, height, { query = "", goals = [], extraSessions = [], origin = null } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, timezoneId: "UTC" });
  const page = await context.newPage();
  await page.route("**/api/trpc/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(new URL(route.request().url()).searchParams.get("batch") ? [{ result: { data: { json: null } } }] : { result: { data: { json: null } } }) }));
  // Opened from another page: the origin rides in history.state, as Home pushes it, so the page shows "Back to …".
  if (origin) await page.addInitScript((from) => { window.history.replaceState({ workspace: "specialization", specializationOrigin: from }, "", window.location.href); }, origin);
  await page.addInitScript((seed) => {
    if (sessionStorage.getItem("final-seeded")) return;
    sessionStorage.setItem("final-seeded", "1");
    localStorage.setItem("sports-genome-launch-experience-enabled-v1", "off");
    localStorage.setItem("gym-optimizer-athlete-profile-v1", JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Muscle growth", trainingDays: 4, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb", sexForReference: "male", birthYear: 1995, bodyWeight: 180 } }));
    localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(seed.sessions));
    localStorage.setItem("gym-optimizer-workout-plan-v1", JSON.stringify(seed.plan));
    localStorage.setItem("sports-genome-specialization-measurements-v1", JSON.stringify(seed.measurements));
    localStorage.setItem("sports-genome-specialization-goals-v1", JSON.stringify(seed.goals));
  }, { sessions: [...sessions, ...extraSessions], plan, measurements, goals });
  await page.goto(`${base}/?workspace=specialization&region=forearm${query}`);
  await page.locator(".spz-page").waitFor({ timeout: 30000 });
  await page.locator(".spz-diagram-svg").waitFor({ timeout: 30000 });
  await page.waitForTimeout(500);
  return { context, page };
}

const tap = async (page, locator) => {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(400);
  return box;
};
const round = (value) => Math.round(value * 10) / 10;
const boxOf = (page, selector) => page.evaluate((s) => { const element = document.querySelector(s); if (!element) return null; const b = element.getBoundingClientRect(); return { top: Math.round(b.top * 10) / 10, bottom: Math.round(b.bottom * 10) / 10, height: Math.round(b.height * 10) / 10, width: Math.round(b.width * 10) / 10 }; }, selector);
const dockTop = (page) => page.evaluate(() => { const element = document.querySelector(".mobile-workspace-dock"); return element ? Math.round(element.getBoundingClientRect().top) : window.innerHeight; });
const active = (page) => page.evaluate(() => { const element = document.activeElement; return element ? { tag: element.tagName, text: (element.getAttribute("aria-label") || element.textContent || "").trim().slice(0, 80) } : null; });
const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
/** Every visible control under 44 × 44 px inside a scope (the drawing's tap squares are checked in hit-targets.json). */
const smallControls = (page, scope) => page.evaluate((selector) => {
  const scopeElement = document.querySelector(selector);
  if (!scopeElement) return null;
  return Array.from(scopeElement.querySelectorAll("button, summary, a[href], [role='button'], input:not([type=radio]):not([type=checkbox]), select"))
    .filter((element) => !element.closest(".spz-diagram-svg, .sr-only") && element.getClientRects().length > 0)
    .map((element) => ({ element, box: element.getBoundingClientRect() }))
    .filter(({ box }) => box.width > 0 && (box.width < 43.5 || box.height < 43.5))
    .map(({ element, box }) => ({ text: (element.getAttribute("aria-label") || element.textContent || "").trim().slice(0, 60), width: Math.round(box.width * 10) / 10, height: Math.round(box.height * 10) / 10 }));
}, scope);

const firstScreen = async (page) => page.evaluate(() => {
  const box = (selector) => { const element = document.querySelector(selector); return element ? element.getBoundingClientRect() : null; };
  const bar = box(".mobile-workspace-dock");
  const strip = box(".spz-strip");
  const drawing = box(".spz-diagram-svg");
  const barTop = bar ? bar.top : window.innerHeight;
  const controls = Array.from(document.querySelectorAll(".spz-top button, .spz-map button, .spz-top input"))
    .filter((element) => !element.closest(".spz-diagram-svg") && element.getClientRects().length > 0)
    .map((element) => ({ element, b: element.getBoundingClientRect() }))
    .filter(({ b }) => b.width < 43.5 || b.height < 43.5)
    .map(({ element, b }) => `${(element.getAttribute("aria-label") || element.textContent || "").trim().slice(0, 30)} ${Math.round(b.width)}x${Math.round(b.height)}`);
  return { bottomBarTop: Math.round(barTop), navTop: Math.round(box(".mobile-bottom-nav")?.top ?? barTop), stripTop: Math.round(strip.top), stripBottom: Math.round(strip.bottom), drawingTop: Math.round(drawing.top), drawingOnFirstScreenPx: Math.round(barTop - drawing.top), stripPastBarPx: Math.max(0, Math.round(strip.bottom - barTop)), stripWhole: strip.bottom <= barTop, horizontalOverflowPx: Math.max(0, document.documentElement.scrollWidth - window.innerWidth), controlsUnder44px: controls };
});
const custom = `&window=custom&from=${new Date(mondayMs - 6 * DAY).toISOString().slice(0, 10)}&to=${todayKey}`;

// ---------------------------------------------------------------- critic experiments (19 Oct)
const out = [];
const log = (entry) => { out.push(entry); console.log(JSON.stringify(entry)); };
const target = [goal("t2", "forearm.fcu", "right", 6)];
const states = [
  ["FCU", "&node=forearm.fcu", [], null],
  ["FCU, target", "&node=forearm.fcu", target, null],
  ["FCU, Custom, target", `&node=forearm.fcu${custom}`, target, null],
  ["FCU, Back, Custom, target", `&node=forearm.fcu${custom}`, target, "body"],
];
/** The draft's heading row (§6.1): [‹ short origin] h1=label [Regions ⌄], and optionally the 3 × 3 grid open under it. */
const mockHead = (page, { label, backText, grid, targetsOn = 2 }) => page.evaluate(({ label, backText, grid, targetsOn }) => {
  const head = document.querySelector(".spz-head");
  const back = head.querySelector(".spz-back");
  const row = document.createElement("div");
  row.className = "mock-row";
  row.style.cssText = "display:flex;align-items:center;gap:.5rem;min-height:2.75rem;min-width:0";
  if (backText !== null) {
    const b = back ? back.cloneNode(true) : document.createElement("button");
    b.className = "spz-back"; b.innerHTML = `<svg width="16" height="16"></svg>${backText}`; b.style.flex = "0 0 auto";
    row.appendChild(b);
  }
  const h1 = head.querySelector("h1").cloneNode(true);
  h1.textContent = label; h1.style.minWidth = "0";
  row.appendChild(h1);
  const toggle = document.createElement("button");
  toggle.className = "spz-button"; toggle.textContent = "Regions ⌄"; toggle.style.cssText = "margin-left:auto;flex:0 0 auto";
  row.appendChild(toggle);
  head.replaceWith(row);
  if (grid) {
    const g = document.createElement("div");
    g.setAttribute("role", "group");
    g.style.cssText = "display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.375rem";
    ["Shoulders", "Chest", "Back", "Upper arms", "Forearms", "Core", "Hips", "Thighs", "Lower legs"].forEach((name, index) => {
      const button = document.createElement("button");
      button.className = "spz-chip"; button.style.minWidth = "0"; button.style.fontSize = "16px";
      button.innerHTML = name + (index < targetsOn ? `<small style="font-size:12px">2 targets</small>` : "");
      g.appendChild(button);
    });
    row.after(g);
  }
  const r = row.getBoundingClientRect();
  return { headRowHeight: Math.round(r.height), toggleRight: Math.round(toggle.getBoundingClientRect().right), h1Height: Math.round(h1.getBoundingClientRect().height) };
}, { label, backText, grid, targetsOn });

const fonts = { checked: false };
for (const [width, height] of [[390, 844], [375, 667]]) {
  for (const [state, query, goals, origin] of states) {
    for (const variant of ["as shipped", "draft row, grid closed", "draft row, grid open"]) {
      const { context, page } = await open(width, height, { query, goals, origin });
      if (!fonts.checked) { fonts.checked = true; fonts.barlow = await page.evaluate(() => document.fonts.check('800 24px "Barlow Condensed"')); log({ fonts }); }
      await page.evaluate(() => window.scrollTo(0, 0));
      let head = null;
      if (variant !== "as shipped") head = await mockHead(page, { label: "Forearms", backText: origin ? "Muscles" : null, grid: variant.endsWith("open") });
      await page.waitForTimeout(150);
      const fs = await firstScreen(page);
      log({ scene: "first-screen", viewport: `${width}x${height}`, state, variant, head, stripBottom: fs.stripBottom, drawingTop: fs.drawingTop, dock: fs.bottomBarTop, drawingOnFirstScreenPx: fs.drawingOnFirstScreenPx, stripWhole: fs.stripWhole });
      if (variant.endsWith("open") && state === "FCU, Custom, target") await page.screenshot({ path: join(here, `grid-open-${state.replace(/[^a-z]+/gi, "-")}-${width}.png`) });
      await context.close();
    }
  }
}

// Side words in the controls row: does "Completed · Planned" still sit beside the side switch?
for (const [width, height] of [[390, 844], [375, 667]]) for (const [left, right] of [["Left arm", "Right arm"], ["Left side", "Right side"], ["Left hip", "Right hip"], ["Left leg", "Right leg"], ["Left shoulder", "Right shoulder"]]) {
  const { context, page } = await open(width, height, { query: "&node=forearm.fcu", goals: target });
  await page.evaluate(() => window.scrollTo(0, 0));
  const result = await page.evaluate(([left, right]) => {
    const group = document.querySelector('.spz-controls [aria-label="Arm"]');
    const [l, r] = group.querySelectorAll("button");
    l.textContent = left; r.textContent = right;
    const controls = document.querySelector(".spz-controls").getBoundingClientRect();
    const mode = document.querySelector('.spz-controls [aria-label="Planned or completed"]').getBoundingClientRect();
    const side = group.getBoundingClientRect();
    return { controlsHeight: Math.round(controls.height), sideOnModeRow: Math.abs(side.top - mode.top) < 2, sideHeight: Math.round(side.height) };
  }, [left, right]);
  await page.waitForTimeout(100);
  const fs = await firstScreen(page);
  log({ scene: "side-words", viewport: `${width}x${height}`, words: `${left} · ${right}`, ...result, drawingOnFirstScreenPx: fs.drawingOnFirstScreenPx, stripWhole: fs.stripWhole });
  await context.close();
}

// The heading row on one line? Longest labels with short and long origin names, at 375 and 320.
for (const [width, height] of [[375, 667], [320, 568], [390, 844]]) for (const label of ["Upper arms", "Lower legs", "Shoulders"]) for (const backText of [null, "Review", "Muscles", "Exercise matches", "Review your week"]) {
  const { context, page } = await open(width, height, { query: "&node=forearm.fcu", origin: backText ? "body" : null });
  const head = await mockHead(page, { label, backText, grid: false });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  log({ scene: "head-row", viewport: `${width}x${height}`, label, backText, ...head, oneLine: head.headRowHeight <= 46, horizontalOverflowPx: overflow });
  await context.close();
}

// The 3 × 3 grid at 320 and 375: label wrap and button heights.
for (const [width, height] of [[320, 568], [375, 667], [390, 844]]) {
  const { context, page } = await open(width, height, {});
  await mockHead(page, { label: "Forearms", backText: null, grid: true, targetsOn: 9 });
  const cells = await page.evaluate(() => Array.from(document.querySelectorAll('[role="group"] .spz-chip')).map((b) => ({ t: b.firstChild.textContent, w: Math.round(b.getBoundingClientRect().width), h: Math.round(b.getBoundingClientRect().height) })));
  const gridBox = await page.evaluate(() => { const g = document.querySelector('.mock-row + [role="group"]').getBoundingClientRect(); return Math.round(g.height); });
  log({ scene: "grid", viewport: `${width}x${height}`, gridHeightWithTargetLines: gridBox, cells });
  await context.close();
}

await browser.close();
server.close();
writeFileSync(join(here, "checks.json"), JSON.stringify(out, null, 1));
