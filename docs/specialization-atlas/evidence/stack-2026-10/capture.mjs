/**
 * Phone evidence for the stack page (docs/specialization-atlas/11-forearm-research-and-stack.md
 * §3.2, §3.12, §5.2, §7.5; lane S4), 22 Oct 2026.
 *
 * Headless Chromium emulating an iPhone (viewport, isMobile, hasTouch, deviceScaleFactor 3, en-US,
 * UTC, SwiftShader WebGL): not an iPhone, not Safari. Two production builds, each served by a small
 * static server here, device stores seeded as page-wave0-2026-10-20/capture.mjs seeds them, with the
 * design's plans A and C (experiments/forearm-research-2026-10-21/architect-v3/run.ts):
 *
 *   npx vite build --outDir <before>     (at e1153d8, before this lane)
 *   npx vite build --outDir <after>      (this lane)
 *   node docs/specialization-atlas/evidence/stack-2026-10/capture.mjs <before> <after>
 *
 * Writes the screenshots it keeps (PNG; reduced to 256 colours afterwards with Pillow) and checks.json
 * next to this file. Scenes: the page's download before and after (09-page.md's method: open Muscles,
 * tap Specialize, every .js file until the map is drawn); the first screen, 3D model and drawing,
 * before and after; the card closed; the card open with plans A and C and the §3.2 acceptance (the
 * total control just under the sticky row, then the control, What changes and Add above the dock);
 * a row open with its Change choices; Leave out's Undo line; after Add, with its Undo, and the
 * notice gone after the card's Undo; Not in this stack's lines; Design for Week 2; the add sheet's prescription field focused; the muscle sheet's ranges; 320 overflow; the
 * 44 px sweep over every new control; the − / + to What changes time on a heavy plan.
 */
import { createReadStream, existsSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { createServer } from "node:http";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const [beforeDir, afterDir] = process.argv.slice(2).map((dir) => resolve(dir));
for (const dir of [beforeDir, afterDir]) if (!dir || !existsSync(join(dir, "index.html"))) throw new Error("Usage: capture.mjs <build before> <build after>");

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".json": "application/json", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json", ".glb": "model/gltf-binary", ".wasm": "application/wasm" };
const serve = async (publicDir) => {
  const server = createServer((request, response) => {
    const path = decodeURIComponent(new URL(request.url, "http://x").pathname);
    let file = join(publicDir, path);
    if (!file.startsWith(publicDir) || !existsSync(file) || statSync(file).isDirectory()) file = join(publicDir, "index.html");
    response.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream", "content-length": statSync(file).size });
    createReadStream(file).pipe(response);
  });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  return { server, base: `http://127.0.0.1:${server.address().port}` };
};
const builds = { before: await serve(beforeDir), after: await serve(afterDir) };

// ---------------------------------------------------------------- the athlete's records

const DAY = 86_400_000;
const todayKey = new Date().toISOString().slice(0, 10);
const mondayMs = (() => { const d = new Date(`${todayKey}T00:00:00Z`); return d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY; })();
const at = (dayOffset, hour) => new Date(mondayMs + dayOffset * DAY + hour * 3_600_000).toISOString();
const set = (weight, reps, extra = {}) => ({ weight: String(weight), reps: String(reps), unit: "lb", completed: true, ...extra });
const workout = (id, dayOffset, label, exercises) => ({ id, title: label, dayLabel: `Week 1 · ${label}`, startedAt: at(dayOffset, 17), completedAt: at(dayOffset, 18), status: "completed", exercises });
const ex = (id, catalogId, exerciseName, sets) => ({ id, exerciseName, catalogId, plannedPrescription: `${sets.length} × 12`, sets });
/** The wave 0 evidence's forearm work this week (page-wave0-2026-10-20), so the strip has its sets beside the new button. */
const sessions = [
  workout("s1", 0, "Day 02 · Pull", [ex("e1", 132, "Hammer Curl", [set(30, 12), set(30, 12), set(30, 10)]), ex("e2", 139, "Wrist Curl", [set(60, 15), set(60, 15), set(60, 14)])]),
  workout("s2", 1, "Day 01 · Push", [ex("e3", 140, "Reverse Wrist Curl", [set(30, 15), set(30, 15), set(30, 12)])]),
];
const entries = (ids) => ids.map((id) => ({ entryId: id, catalogExerciseId: id }));
const weekWith = (days) => ({ customWorkoutIds: [], weeklyPlanIds: {}, weeklyPlanEntries: Object.fromEntries(Object.entries(days).map(([key, ids]) => [key, entries(ids)])), prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: {}, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 0 });
const atHome = ["Bodyweight", "Band", "Dumbbells", "Kettlebell", "Medicine ball"];
/** The design's plans (architect-v3/run.ts), seeded as Home stores them. */
const plans = {
  A: { days: 3, goal: "Muscle growth", gymMinutes: 60, equipment: null, week: weekWith({ "0-Push": [161, 1, 43, 103, 150], "1-Pull": [41, 4, 66, 111, 121], "2-Legs": [173, 2, 54, 186, 132] }) },
  C: { days: 5, goal: "Athleticism", gymMinutes: 45, equipment: { gymAccess: "At home", availableEquipment: atHome }, week: weekWith({ "0-Push": [4, 103, 26, 155], "1-Pull": [46, 75, 123, 82], "2-Legs": [165, 189, 175, 224], "3-Upper": [7, 46, 108, 132], "4-Sport Transfer": [173, 26, 66] }) },
};
/** A heavy plan for the timing gate: 7 days × 8 exercises × 4 sets. */
const heavyIds = [1, 2, 3, 4, 5, 7, 41, 43, 45, 46, 47, 54, 57, 66, 75, 82, 101, 103, 108, 111, 121, 123, 148, 150, 155, 161, 165, 167, 168, 171, 173, 175, 186, 189, 194, 195, 206, 221, 222, 224, 26, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
const heavyDays = ["0-Push", "1-Pull", "2-Legs", "3-Upper", "4-Lower", "5-Full Body", "6-Sport Transfer"];
const heavyWeek = (() => {
  const week = weekWith(Object.fromEntries(heavyDays.map((key, index) => [key, heavyIds.slice(index * 8, index * 8 + 8)])));
  week.weeklyPrescriptions = Object.fromEntries(heavyDays.map((key, index) => [key, Object.fromEntries(heavyIds.slice(index * 8, index * 8 + 8).map((id) => [id, "4 × 8–12"]))]));
  return week;
})();

// ---------------------------------------------------------------- the browser

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const checks = {
  note: `Headless Chromium emulating an iPhone (viewport, isMobile, hasTouch, deviceScaleFactor 3, en-US, UTC, SwiftShader WebGL); not an iPhone, not Safari. Production builds: before = e1153d8 (before lane S4), after = this lane. Device stores seeded: plan A (3 days, 60 min, Muscle growth, commercial gym, Hammer Curl on Day 03) or plan C (5 days, 45 min, Athleticism, at home), as Home stores them; this week Hammer Curl x3 and Wrist Curl x3 on Monday, Reverse Wrist Curl x3 on Tuesday. Run on ${todayKey}, UTC. Coordinates are CSS px from the top of the screen.`,
  scenes: [],
};
const kept = new Set();
const shot = (name) => (kept.add(`${name}.png`), join(here, `${name}.png`));
const scratch = (name) => join(tmpdir(), `stack-${name}.png`);
const record = (entry) => { checks.scenes.push(entry); console.log(JSON.stringify(entry)); };
/** A screenshot, given time: the 3D model renders through SwiftShader on the sandbox's CPU, and a frame can be slow. */
async function snap(page, path) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try { await page.screenshot({ path, timeout: 90000 }); return; } catch (error) { if (attempt === 2) throw error; await page.waitForTimeout(1000); }
  }
}
const round = (value) => Math.round(value * 10) / 10;

async function open(build, width, height, { plan = "A", path = "/?workspace=specialization&region=forearm", weeks = null, stacks = null, withSessions = true, heavy = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, timezoneId: "UTC", locale: "en-US" });
  const page = await context.newPage();
  await page.route("**/api/trpc/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(new URL(route.request().url()).searchParams.get("batch") ? [{ result: { data: { json: null } } }] : { result: { data: { json: null } } }) }));
  const chosen = heavy ? { days: 7, goal: "Muscle growth", gymMinutes: 90, equipment: null, week: heavyWeek } : plans[plan];
  const stored = { version: 2, ...chosen.week, weeks: weeks ? Object.fromEntries(weeks.map((week) => [String(week), chosen.week])) : { "1": chosen.week }, activeWeek: 1 };
  await page.addInitScript((seed) => {
    if (sessionStorage.getItem("stack-seeded")) return;
    sessionStorage.setItem("stack-seeded", "1");
    localStorage.setItem("sports-genome-launch-experience-enabled-v1", "off");
    localStorage.setItem("gym-optimizer-athlete-profile-v1", JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: seed.goal, trainingDays: seed.days, gymMinutes: seed.gymMinutes, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb", sexForReference: "male", birthYear: 1995, bodyWeight: 180, ...(seed.equipment ? { equipment: seed.equipment } : {}) } }));
    localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(seed.sessions));
    localStorage.setItem("gym-optimizer-workout-plan-v1", JSON.stringify(seed.plan));
    if (seed.stacks) localStorage.setItem("sports-genome-specialization-stacks-v1", JSON.stringify(seed.stacks));
  }, { goal: chosen.goal, days: chosen.days, gymMinutes: chosen.gymMinutes, equipment: chosen.equipment, sessions: withSessions ? sessions : [], plan: stored, stacks });
  await page.goto(`${builds[build].base}${path}`);
  return { context, page };
}
async function pageReady(page, figure) {
  await page.locator(".spz-page").waitFor({ timeout: 30000 });
  await page.locator(".spz-row").first().waitFor({ timeout: 30000 });
  if (figure === "model") await page.locator(".sg-anatomy3d-stage[data-status='ready'], .sg-anatomy3d-stage[data-status='error']").first().waitFor({ timeout: 60000 }).catch(() => {});
  else await page.locator(".spz-diagram svg").first().waitFor({ timeout: 30000 });
  await page.waitForTimeout(800);
}
/** A finger's tap: the element brought to the middle of the screen first, clear of the sticky row and the dock. */
const tap = async (page, locator) => {
  await locator.evaluate((element) => element.scrollIntoView({ block: "center", behavior: "instant" }));
  await page.waitForTimeout(150);
  const box = await locator.boundingBox();
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(350);
  return box;
};
const overflowX = (page) => page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth));
/** Every visible control under 44 × 44 px inside the scopes (the drawing's own tap squares are the drawing's). */
const smallControls = (page, selectors) => page.evaluate((scopes) => scopes.flatMap((selector) => Array.from(document.querySelectorAll(selector)).flatMap((scope) => Array.from(scope.querySelectorAll("button, summary, a[href], [role='button'], input:not([type=radio]):not([type=checkbox]), select"))))
  .filter((element) => !element.closest(".spz-diagram-svg, .sr-only, [hidden]") && element.getClientRects().length > 0)
  .map((element) => ({ element, box: element.getBoundingClientRect(), style: getComputedStyle(element) }))
  .filter(({ box }) => box.width > 0 && (box.width < 43.5 || box.height < 43.5))
  .map(({ element, box }) => ({ text: (element.getAttribute("aria-label") || element.textContent || "").trim().slice(0, 60), width: Math.round(box.width * 10) / 10, height: Math.round(box.height * 10) / 10 })), selectors);
const controlsChecked = (page, selectors) => page.evaluate((scopes) => scopes.reduce((count, selector) => count + Array.from(document.querySelectorAll(selector)).reduce((sum, scope) => sum + Array.from(scope.querySelectorAll("button, summary, a[href], input:not([type=radio]):not([type=checkbox]), select")).filter((element) => !element.closest(".spz-diagram-svg, .sr-only, [hidden]") && element.getClientRects().length > 0).length, 0), 0), selectors);
/** Controls that are faint at rest: below full opacity, or with no border and no fill (an outline or a fill is required). */
const faintControls = (page, selector) => page.evaluate((scope) => Array.from(document.querySelectorAll(`${scope} button, ${scope} input`)).filter((element) => element.getClientRects().length > 0 && !element.closest(".sr-only")).map((element) => {
  const style = getComputedStyle(element);
  let opacity = 1;
  for (let node = element; node; node = node.parentElement) opacity *= Number(getComputedStyle(node).opacity);
  // A segment's buttons are outlined by the segment around them (the page's pattern).
  const holder = element.closest(".spz-segment") ? getComputedStyle(element.closest(".spz-segment")) : style;
  const outlined = parseFloat(holder.borderTopWidth) > 0 && holder.borderTopStyle !== "none";
  const filled = style.backgroundColor !== "rgba(0, 0, 0, 0)" && style.backgroundColor !== "transparent";
  const link = element.classList.contains("spz-link") || element.classList.contains("spz-stack-row");
  return { text: (element.getAttribute("aria-label") || element.textContent || "").trim().slice(0, 50), opacity: Math.round(opacity * 100) / 100, outlined, filled, link };
}).filter((item) => item.opacity < 1 || (!item.outlined && !item.filled && !item.link)), selector);
const bars = (page) => page.evaluate(() => {
  const box = (selector) => { const element = document.querySelector(selector); const rect = element?.getBoundingClientRect(); return rect && rect.height > 0 ? rect : null; };
  return { dockTop: Math.round(box(".mobile-workspace-dock")?.top ?? window.innerHeight), stickyBottom: Math.round(box(".workspace-top-switcher-shell")?.bottom ?? 0) };
});
async function openCard(page) {
  const summary = page.locator("details.spz-stack > summary");
  await tap(page, summary);
  await page.locator(".spz-stack-total").waitFor({ timeout: 30000 });
  await page.waitForTimeout(400);
}
/** Puts an element's top just under the sticky tab row, as the card's ways in do. */
async function underSticky(page, selector) {
  await page.evaluate((target) => {
    const element = document.querySelector(target);
    const sticky = document.querySelector(".workspace-top-switcher-shell")?.getBoundingClientRect().bottom ?? 0;
    window.scrollBy({ top: element.getBoundingClientRect().top - (sticky + 12), behavior: "instant" });
  }, selector);
  await page.waitForTimeout(250);
}
const rect = (page, selector) => page.evaluate((target) => { const box = document.querySelector(target)?.getBoundingClientRect(); return box ? { top: Math.round(box.top), bottom: Math.round(box.bottom), height: Math.round(box.height) } : null; }, selector);

// ---------------------------------------------------------------- the download (09-page.md's method)

async function download(build) {
  const { context, page } = await open(build, 390, 844, { path: "/?workspace=body" });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
  const files = [];
  let counting = true;
  page.on("response", async (response) => {
    const url = response.url();
    if (!counting || !url.endsWith(".js")) return;
    const size = Number(response.headers()["content-length"] ?? 0) || (await response.body().catch(() => Buffer.alloc(0))).length;
    files.push({ file: url.split("/").pop(), bytes: size });
  });
  const tabs = page.getByRole("navigation", { name: "Body Lab workspace pages" });
  await tap(page, tabs.getByRole("button", { name: "Specialize" }));
  await pageReady(page, "model");
  counting = false;
  const status = await page.locator(".sg-anatomy3d-stage").first().getAttribute("data-status").catch(() => null);
  await context.close();
  const total = files.reduce((sum, item) => sum + item.bytes, 0);
  return { build, files: files.sort((a, b) => b.bytes - a.bytes), total, modelStatus: status };
}
const downloads = { before: await download("before"), after: await download("after") };
record({ scene: "download", method: "390 × 844: open Muscles (/?workspace=body), let it settle, tap Specialize, every .js file requested until the map (the 3D model) is drawn; raw bytes as served", ...downloads, change: downloads.after.total - downloads.before.total });

// ---------------------------------------------------------------- the first screen, 3D model and drawing, before and after

const firstScreen = (page) => page.evaluate(() => {
  const box = (selector) => document.querySelector(selector)?.getBoundingClientRect() ?? null;
  const map = box(".spz-map");
  const card = box("details.spz-stack");
  const dock = box(".mobile-workspace-dock");
  return { mapTop: Math.round(map.top), mapBottom: Math.round(map.bottom), cardTop: card ? Math.round(card.top) : null, dockTop: Math.round(dock?.top ?? window.innerHeight), windowLine: document.querySelector(".spz-window")?.textContent ?? null, horizontalOverflowPx: Math.max(0, document.documentElement.scrollWidth - window.innerWidth) };
});
for (const [width, height] of [[390, 844], [375, 667], [430, 932]]) {
  for (const figure of ["model", "drawing"]) {
    for (const build of ["before", "after"]) {
      const { context, page } = await open(build, width, height, { path: `/?workspace=specialization&region=forearm&mode=planned&fig=${figure}` });
      await pageReady(page, figure);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);
      const name = `first-screen-${figure}-${width}-${build}`;
      await snap(page, width === 430 ? scratch(name) : shot(name));
      record({ scene: "first-screen", build, figure, mode: "planned", viewport: `${width}x${height}`, ...(await firstScreen(page)), ...(width === 430 ? {} : { file: `${name}.png` }) });
      await context.close();
    }
  }
}

// ---------------------------------------------------------------- the card closed, the ways in

for (const [width, height] of [[390, 844], [375, 667]]) {
  const { context, page } = await open("after", width, height, { path: "/?workspace=specialization&region=forearm&mode=planned&fig=drawing" });
  await pageReady(page, "drawing");
  // The drawing's strip with nothing selected: See these sets and Design a stack, side by side.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  await page.screenshot({ path: shot(`strip-design-a-stack-${width}`) });
  const stripTouch = await smallControls(page, [".spz-strip"]);
  await underSticky(page, "details.spz-stack");
  await page.screenshot({ path: shot(`card-closed-${width}`) });
  record({ scene: "card-closed", viewport: `${width}x${height}`, summary: await page.locator("details.spz-stack > summary").innerText(), card: await rect(page, "details.spz-stack"), stripControlsUnder44px: stripTouch, files: [`strip-design-a-stack-${width}.png`, `card-closed-${width}.png`] });
  // Coverage to review, Planned mode: the stack's line first.
  await underSticky(page, ".spz-findings");
  await page.screenshot({ path: scratch(`findings-${width}`) });
  record({ scene: "coverage-to-review", viewport: `${width}x${height}`, first: await page.locator(".spz-finding").first().innerText(), controlsUnder44px: await smallControls(page, [".spz-findings"]) });
  await context.close();
}
{
  // The 3D model's panel with nothing selected: Design a stack beside See these sets; tapping it opens the card and brings it into view.
  const { context, page } = await open("after", 390, 844, { path: "/?workspace=specialization&region=forearm&mode=planned" });
  await pageReady(page, "model");
  const button = page.locator(".sg-anatomy3d-detail").getByRole("button", { name: "Design a stack" });
  await button.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await snap(page, shot("model-overview-design-a-stack-390"));
  const overview = { line: await page.locator(".sg-anatomy3d-detail .sg-anatomy3d-status").first().innerText(), controlsUnder44px: await smallControls(page, [".sg-anatomy3d-detail > .spz-actions"]) };
  await tap(page, button);
  await page.locator(".spz-stack-total").waitFor({ timeout: 30000 });
  await page.waitForTimeout(800);
  const after = await page.evaluate(() => ({ open: document.querySelector("details.spz-stack").open, summaryTop: Math.round(document.querySelector("details.spz-stack > summary").getBoundingClientRect().top), focused: document.activeElement?.tagName }));
  record({ scene: "way-in-3d-overview", viewport: "390x844", ...overview, ...after, ...(await bars(page)), file: "model-overview-design-a-stack-390.png" });
  await context.close();
}

// ---------------------------------------------------------------- the card open: plans A and C, the §3.2 acceptance

for (const plan of ["A", "C"]) {
  for (const [width, height] of [[390, 844], [375, 667]]) {
    const { context, page } = await open("after", width, height, { plan, path: "/?workspace=specialization&region=forearm&mode=planned&fig=drawing", withSessions: false });
    await pageReady(page, "drawing");
    await openCard(page);
    await underSticky(page, ".spz-stack-total");
    const name = `card-open-plan-${plan}-${width}`;
    await snap(page, shot(name));
    const { dockTop, stickyBottom } = await bars(page);
    const control = await rect(page, ".spz-stack-total");
    const changes = await rect(page, ".spz-stack-changes");
    const add = await rect(page, ".spz-stack-add");
    record({
      scene: "acceptance", plan, viewport: `${width}x${height}`, stickyBottom, dockTop, control, whatChanges: changes, add,
      allOnOneScreenAboveDock: control.top >= stickyBottom && add.bottom <= dockTop,
      total: await page.locator(".spz-stack-number").inputValue(), whatChangesText: await page.locator(".spz-stack-changes").innerText(), addLabel: await page.locator(".spz-stack-add").innerText(),
      numberFieldFontPx: await page.locator(".spz-stack-number").evaluate((element) => getComputedStyle(element).fontSize),
      rowsClosed: await page.locator(".spz-stack-row").evaluateAll((rows) => ({ count: rows.length, heights: rows.map((row) => Math.round(row.getBoundingClientRect().height)) })),
      horizontalOverflowPx: await overflowX(page), file: `${name}.png`,
    });
    await context.close();
  }
}

// ---------------------------------------------------------------- a row open with Change; Leave out's Undo; Add and its Undo; the sweep

for (const [width, height] of [[390, 844], [375, 667]]) {
  const { context, page } = await open("after", width, height, { path: "/?workspace=specialization&region=forearm&mode=planned&fig=drawing", withSessions: false });
  await pageReady(page, "drawing");
  await openCard(page);
  // A row, open, with its Change choices.
  const row = page.locator(".spz-stack-row", { hasText: "Lever Pronation" });
  await tap(page, row);
  await tap(page, row.locator("xpath=..").getByRole("button", { name: "Change" }));
  await underSticky(page, ".spz-stack-row[aria-expanded='true']");
  await page.screenshot({ path: shot(`row-open-change-${width}`) });
  const controlsLine = await page.locator(".spz-stack-row[aria-expanded='true'] + .spz-stack-row-detail .spz-stack-controls").evaluate((element) => { const tops = Array.from(element.children).map((child) => Math.round(child.getBoundingClientRect().top)); return { lines: new Set(tops).size, width: Math.round(element.getBoundingClientRect().width) }; });
  // The sweep with every part of the card open: a row and its Change, Settings, See each muscle, How the stack is built.
  await page.evaluate(() => document.querySelectorAll("details.spz-stack details").forEach((details) => { details.open = true; }));
  await page.waitForTimeout(500);
  const scopes = ["details.spz-stack"];
  const sweep = { checked: await controlsChecked(page, scopes), under44px: await smallControls(page, scopes), faint: await faintControls(page, "details.spz-stack") };
  record({ scene: "row-open-change", viewport: `${width}x${height}`, controlsLine, sweep, horizontalOverflowPx: await overflowX(page), file: `row-open-change-${width}.png` });
  await page.evaluate(() => document.querySelectorAll("details.spz-stack details").forEach((details) => { details.open = false; }));
  // Leave out: the line and its Undo where the row was, focus on Undo, clear of the dock.
  await tap(page, page.locator(".spz-stack-row-detail").getByRole("button", { name: /^Leave out/ }).first());
  await page.waitForTimeout(500);
  const undo = page.locator(".spz-stack-day .spz-inline-status button", { hasText: "Undo" });
  const undoBox = await undo.boundingBox();
  await page.screenshot({ path: shot(`leave-out-undo-${width}`) });
  record({ scene: "leave-out-undo", viewport: `${width}x${height}`, line: await undo.locator("xpath=..").innerText(), undo: { top: Math.round(undoBox.y), bottom: Math.round(undoBox.y + undoBox.height), width: round(undoBox.width), height: round(undoBox.height) }, focused: await page.evaluate(() => document.activeElement?.textContent), ...(await bars(page)), file: `leave-out-undo-${width}.png` });
  await tap(page, undo);
  // Add: one batch, the card's line with Undo, focus on it, clear of the dock; the notice with its Undo.
  await tap(page, page.locator(".spz-stack-add"));
  await page.waitForTimeout(900);
  const added = page.locator(".spz-stack-done button", { hasText: "Undo" });
  const addedBox = await added.boundingBox();
  await page.screenshot({ path: shot(`after-add-${width}`) });
  record({
    scene: "after-add", viewport: `${width}x${height}`, line: await page.locator(".spz-stack-done").innerText(), detail: await page.locator(".spz-stack-body > .spz-note").first().innerText(),
    undo: { top: Math.round(addedBox.y), bottom: Math.round(addedBox.y + addedBox.height), width: round(addedBox.width), height: round(addedBox.height) }, focused: await page.evaluate(() => document.activeElement?.textContent), ...(await bars(page)),
    notice: await page.locator("[data-sonner-toast]").first().innerText().catch(() => null),
    summary: await page.locator("details.spz-stack > summary").innerText(), windowLine: await page.locator(".spz-window").innerText(),
    sweep: await smallControls(page, ["details.spz-stack", "[data-sonner-toast]"]), file: `after-add-${width}.png`,
  });
  // The card's Undo takes the notice away with it, so no Undo is left showing that does nothing.
  await tap(page, added);
  await page.waitForTimeout(900);
  record({ scene: "after-add-card-undo", viewport: `${width}x${height}`, line: await page.locator(".spz-stack-done").innerText(), noticesShowing: await page.locator("[data-sonner-toast]").count(), summary: await page.locator("details.spz-stack > summary").innerText() });
  await context.close();
}

// ---------------------------------------------------------------- Not in this stack: the muscles nothing trains directly, in the region's plain words

{
  const { context, page } = await open("after", 390, 844, { path: "/?workspace=specialization&region=forearm&mode=planned&fig=drawing", withSessions: false });
  await pageReady(page, "drawing");
  await openCard(page);
  await underSticky(page, ".spz-stack-out");
  await snap(page, shot("not-in-this-stack-390"));
  record({ scene: "not-in-this-stack", viewport: "390x844", lines: await page.locator(".spz-stack-out li").allInnerTexts(), box: await rect(page, ".spz-stack-out"), ...(await bars(page)), controlsUnder44px: await smallControls(page, [".spz-stack-out"]), horizontalOverflowPx: await overflowX(page), file: "not-in-this-stack-390.png" });
  await context.close();
}

// ---------------------------------------------------------------- another week: "Your stack is in Week 1, not Week 2 · Design for Week 2"

{
  const { context, page } = await open("after", 390, 844, { path: "/?workspace=specialization&region=forearm&mode=planned&fig=drawing", weeks: [1, 2], withSessions: false });
  await pageReady(page, "drawing");
  await openCard(page);
  await tap(page, page.locator(".spz-stack-add"));
  await page.waitForTimeout(900);
  await tap(page, page.getByRole("group", { name: "Plan week" }).getByRole("button", { name: "Week 2" }));
  await page.waitForTimeout(800);
  await underSticky(page, "details.spz-stack");
  await snap(page, shot("design-for-week-2-390"));
  const line = await page.locator(".spz-stack-body").innerText();
  await tap(page, page.getByRole("button", { name: "Design for Week 2" }));
  await underSticky(page, ".spz-stack-total");
  await snap(page, scratch("design-for-week-2-open-390"));
  record({ scene: "design-for-week-2", viewport: "390x844", line, then: { total: await page.locator(".spz-stack-number").inputValue(), add: await page.locator(".spz-stack-add").innerText() }, controlsUnder44px: await smallControls(page, ["details.spz-stack"]), file: "design-for-week-2-390.png" });
  await context.close();
}

// ---------------------------------------------------------------- the add sheet's prescription field, and the muscle sheet's ranges

for (const [width, height] of [[390, 844], [375, 667]]) {
  const { context, page } = await open("after", width, height, { path: "/?workspace=specialization&region=forearm&node=forearm.br&mode=planned&fig=drawing", withSessions: false });
  await pageReady(page, "drawing");
  // The muscle sheet's suggestions with their starting ranges.
  await page.locator(".spz-row", { hasText: "Brachioradialis" }).first().click();
  await page.waitForTimeout(500);
  const exercises = page.getByRole("dialog").locator("#spz-exercises");
  await exercises.scrollIntoViewIfNeeded();
  await page.locator(".spz-range-note").first().waitFor({ timeout: 10000 }).catch(() => {});
  await page.evaluate(() => document.querySelector("#spz-exercises")?.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot(`muscle-sheet-ranges-${width}`) });
  record({ scene: "muscle-sheet-ranges", viewport: `${width}x${height}`, note: await page.locator(".spz-range-note").first().innerText().catch(() => null), ranges: await page.locator(".spz-candidate .spz-range").allInnerTexts(), file: `muscle-sheet-ranges-${width}.png` });
  // The add sheet from the first suggestion: a day, then the field, focused.
  await page.getByRole("dialog").locator(".spz-candidate").first().getByRole("button", { name: /Add or swap/ }).click();
  await page.waitForTimeout(500);
  const add = page.getByRole("dialog", { name: "Add to your plan" });
  await add.getByRole("button", { name: /Day 03 · Legs/ }).click();
  await page.waitForTimeout(400);
  const field = add.getByRole("textbox", { name: /^Sets × reps/ });
  await field.waitFor({ timeout: 10000 });
  await field.scrollIntoViewIfNeeded();
  await field.tap();
  await page.waitForTimeout(500);
  const fieldInfo = await field.evaluate((element) => ({ value: element.value, fontPx: getComputedStyle(element).fontSize, focused: document.activeElement === element, box: (({ width, height }) => ({ width: Math.round(width), height: Math.round(height) }))(element.getBoundingClientRect()) }));
  const scale = await page.evaluate(() => window.visualViewport?.scale ?? 1);
  await page.screenshot({ path: shot(`add-sheet-prescription-${width}`) });
  record({ scene: "add-sheet-prescription", viewport: `${width}x${height}`, field: fieldInfo, visualViewportScale: scale, plannedAs: await add.getByText(/^Planned as /).innerText(), controlsUnder44px: await smallControls(page, ["#spz-change"]), file: `add-sheet-prescription-${width}.png` });
  await context.close();
}

// ---------------------------------------------------------------- 320 and 430: no sideways scroll with the card open

for (const [width, height] of [[320, 568], [430, 932]]) {
  const { context, page } = await open("after", width, height, { path: "/?workspace=specialization&region=forearm&mode=planned&fig=drawing", withSessions: false });
  await pageReady(page, "drawing");
  await openCard(page);
  await tap(page, page.locator(".spz-stack-row").first());
  await tap(page, page.locator(".spz-stack-row-detail").getByRole("button", { name: "Change" }).first());
  await page.evaluate(() => document.querySelectorAll("details.spz-stack details").forEach((details) => { details.open = true; }));
  await page.waitForTimeout(500);
  await underSticky(page, ".spz-stack-total");
  const name = `card-open-${width}`;
  await snap(page, width === 320 ? shot(name) : scratch(name));
  const wide = await page.evaluate(() => Array.from(document.querySelectorAll("details.spz-stack *")).filter((element) => element.getBoundingClientRect().right > window.innerWidth + 0.5).map((element) => `${element.tagName}.${element.className}`).slice(0, 10));
  record({ scene: "narrow-and-wide", viewport: `${width}x${height}`, horizontalOverflowPx: await overflowX(page), elementsPastRightEdge: wide, controlsUnder44px: await smallControls(page, ["details.spz-stack"]), ...(width === 320 ? { file: `${name}.png` } : {}) });
  await context.close();
}

// ---------------------------------------------------------------- the time gate: − or + to the updated What changes line, heavy plan

{
  const { context, page } = await open("after", 390, 844, { heavy: true, path: "/?workspace=specialization&region=forearm&mode=planned&fig=drawing", withSessions: false });
  await pageReady(page, "drawing");
  await openCard(page);
  await page.waitForTimeout(1500);
  const times = [];
  for (let run = 0; run < 9; run += 1) {
    const label = run % 2 ? "One set fewer" : "One set more";
    times.push(await page.evaluate((name) => new Promise((done) => {
      const target = document.querySelector(".spz-stack-changes");
      const before = target.textContent;
      const button = Array.from(document.querySelectorAll("details.spz-stack button")).find((item) => item.getAttribute("aria-label") === name);
      let changed = null;
      const start = performance.now();
      const observer = new MutationObserver(() => {
        if (changed !== null || target.textContent === before) return;
        changed = performance.now() - start;
        observer.disconnect();
        requestAnimationFrame(() => setTimeout(() => done({ dom: Math.round(changed * 10) / 10, frame: Math.round((performance.now() - start) * 10) / 10 }), 0));
      });
      observer.observe(target, { subtree: true, characterData: true, childList: true });
      button.click();
      setTimeout(() => { observer.disconnect(); done(null); }, 3000);
    }), label));
    await page.waitForTimeout(400);
  }
  const frames = times.filter(Boolean).map((item) => item.frame).sort((a, b) => a - b);
  const doms = times.filter(Boolean).map((item) => item.dom).sort((a, b) => a - b);
  record({ scene: "time-gate", viewport: "390x844", plan: "7 days × 8 exercises × 4 sets, Muscle growth, 90 min", runs: times, medianToDom: doms[Math.floor(doms.length / 2)] ?? null, medianToFrame: frames[Math.floor(frames.length / 2)] ?? null, gateMs: 100, note: "Per − or + (a click in the page): ms to What changes changing in the DOM, and to the next frame after it, in headless Chromium emulating an iPhone on the sandbox's CPU, not a phone." });
  await context.close();
}

await browser.close();
for (const build of Object.values(builds)) build.server.close();
checks.kept = Array.from(kept).sort();
writeFileSync(join(here, "checks.json"), `${JSON.stringify(checks, null, 1)}\n`);
console.log(`kept ${kept.size} screenshots`);
