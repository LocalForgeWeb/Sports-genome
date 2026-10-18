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
const publicDir = resolve(root, "dist/public");
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

// ---------------------------------------------------------------- F-phone-1: Not for me, in a sheet

if (want("not-for-me")) for (const [width, height] of [[390, 844], [375, 667], [320, 568]]) {
  const { context, page } = await open(width, height, { query: "&node=forearm.fcu" });
  await tap(page, page.getByRole("button", { name: /Inspect coverage/ }).first());
  const sheet = page.getByRole("dialog").first();
  await sheet.waitFor();
  const bodyBox = await boxOf(page, ".spz-sheet-body");
  // The first Not for me, scrolled to the bottom of the visible sheet, where a thumb reaches it.
  const notForMe = sheet.getByRole("button", { name: /^Do not suggest / }).first();
  const name = (await notForMe.getAttribute("aria-label")).replace("Do not suggest ", "");
  await notForMe.evaluate((element) => { const body = element.closest(".spz-sheet-body"); const b = element.getBoundingClientRect(); body.scrollTop += b.bottom - (body.getBoundingClientRect().bottom - 24); });
  await page.waitForTimeout(200);
  const tapped = await tap(page, notForMe);
  const undo = sheet.getByRole("button", { name: "Undo" });
  const undoBox = await undo.boundingBox();
  const afterBody = await boxOf(page, ".spz-sheet-body");
  const focusAfterExclude = await active(page);
  await page.screenshot({ path: shot(`not-for-me-undo-${width}`) });
  await tap(page, undo);
  const focusAfterUndo = await active(page);
  record({ scene: "not-for-me-undo", viewport: `${width}x${height}`, excluded: name, tappedY: round(tapped.y), sheetBody: { top: afterBody.top, bottom: afterBody.bottom }, undo: { top: round(undoBox.y), bottom: round(undoBox.y + undoBox.height), width: round(undoBox.width), height: round(undoBox.height) }, undoInSheetView: undoBox.y >= bodyBox.top && undoBox.y + undoBox.height <= afterBody.bottom, focusAfterExclude, focusAfterUndo, file: `not-for-me-undo-${width}.png` });
  await context.close();
}

// ---------------------------------------------------------------- F-phone-2: Targets overview Undo, clear of the dock

if (want("targets")) for (const [width, height, tapAt] of [[390, 844, 440], [390, 844, 480], [375, 667, 520], [320, 568, 430]]) {
  const { context, page } = await open(width, height, { goals: fourTargets });
  const disclosure = page.locator("details.spz-disclosure", { has: page.locator("summary b", { hasText: /^Targets$/ }) });
  await tap(page, disclosure.locator("summary"));
  const remove = page.getByRole("button", { name: /^Remove the right-arm target of 8 direct dynamic bouts per calendar week for Brachioradialis/ });
  // Put the Remove button where a thumb tapped it in the review (y = tapAt), then tap it.
  await remove.evaluate((element, y) => window.scrollBy({ top: element.getBoundingClientRect().top - y, behavior: "instant" }), tapAt);
  await page.waitForTimeout(200);
  const box = await remove.boundingBox();
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(500);
  const undoBox = await page.getByRole("button", { name: "Undo" }).boundingBox();
  const dock = await dockTop(page);
  const covering = await page.evaluate(({ x, y }) => { const element = document.elementFromPoint(x, y); return element ? (element.closest("button")?.textContent ?? element.tagName).trim().slice(0, 40) : null; }, { x: undoBox.x + undoBox.width / 2, y: undoBox.y + undoBox.height / 2 });
  const name = `targets-undo-${width}-${tapAt}`;
  await page.screenshot({ path: shot(name) });
  record({ scene: "targets-undo", viewport: `${width}x${height}`, removeTappedAtY: round(box.y), undo: { top: round(undoBox.y), bottom: round(undoBox.y + undoBox.height) }, dockTop: dock, clearOfDockPx: round(dock - (undoBox.y + undoBox.height)), elementAtUndoCentre: covering, focus: await active(page), file: `${name}.png` });
  await context.close();
}

// ---------------------------------------------------------------- F-phone-8: How this is counted, from a sheet

if (want("method")) for (const [width, height] of [[390, 844], [375, 667]]) {
  const { context, page } = await open(width, height);
  await tap(page, page.getByRole("button", { name: /^Brachioradialis,/ }));
  const sheet = page.getByRole("dialog").first();
  await sheet.waitFor();
  await tap(page, sheet.getByRole("button", { name: /How this is counted/ }));
  await page.waitForTimeout(900);
  const summary = await boxOf(page, "#spz-method > summary");
  const tabRow = await boxOf(page, ".workspace-top-switcher-shell");
  record({ scene: "method-from-sheet", viewport: `${width}x${height}`, focus: await active(page), methodSummary: summary, tabRowBottom: tabRow?.bottom ?? null, summaryClearOfTabRow: tabRow ? summary.top >= tabRow.bottom : true, file: `method-from-sheet-${width}.png` });
  await page.screenshot({ path: shot(`method-from-sheet-${width}`) });
  await context.close();
}

// ---------------------------------------------------------------- F-phone-7: planned mode's strip

if (want("planned")) for (const [width, height] of [[390, 844], [375, 667]]) {
  const { context, page } = await open(width, height, { query: "&mode=planned" });
  const strip = await page.locator(".spz-strip").innerText();
  await page.screenshot({ path: shot(`planned-strip-${width}`) });
  record({ scene: "planned-strip", viewport: `${width}x${height}`, strip: strip.replace(/\n/g, " "), saysTouched: /touched/.test(strip), file: `planned-strip-${width}.png` });
  await context.close();
}

// ---------------------------------------------------------------- Progress: bests so far, a moved tape, a week's bouts

if (want("progress")) for (const [width, height] of [[390, 844], [375, 667], [320, 568]]) {
  const { context, page } = await open(width, height);
  const progress = page.locator("details.spz-disclosure", { has: page.locator("summary b", { hasText: /^Progress$/ }) });
  await tap(page, progress.locator("summary"));
  await page.waitForTimeout(400);
  const circumference = page.locator("figure.spz-chart", { has: page.locator("figcaption", { hasText: /^Circumference/ }) });
  const grip = page.locator("figure.spz-chart", { has: page.locator("figcaption", { hasText: /^Grip strength on a dynamometer/ }) });
  const hang = page.locator("figure.spz-chart", { has: page.locator("figcaption", { hasText: /^Dead Hang/ }) });
  // The exposure chart with its weeks as buttons under it.
  const weekly = page.locator("figure.spz-chart", { has: page.locator("figcaption", { hasText: /^Distinct bouts per week/ }) });
  await weekly.evaluate((element) => window.scrollBy({ top: element.getBoundingClientRect().top - 70, behavior: "instant" }));
  await page.waitForTimeout(200);
  await page.screenshot({ path: shot(`progress-weeks-${width}`) });
  await circumference.evaluate((element) => window.scrollBy({ top: element.getBoundingClientRect().top - 70, behavior: "instant" }));
  await page.waitForTimeout(200);
  await page.screenshot({ path: shot(`progress-readings-${width}`) });
  // The exercise chart reads the most recent exercise first; choose the hang.
  const select = page.locator(".spz-progress-section select");
  const hangKey = await select.evaluate((element) => Array.from(element.options).find((option) => /^Dead Hang/.test(option.textContent))?.value ?? null);
  if (hangKey) await select.selectOption(hangKey);
  await page.waitForTimeout(300);
  await hang.evaluate((element) => window.scrollBy({ top: element.getBoundingClientRect().top - 120, behavior: "instant" }));
  await page.waitForTimeout(200);
  await page.screenshot({ path: shot(`progress-performance-${width}`) });
  const text = async (figure) => (await figure.count()) ? (await figure.innerText()).replace(/\n/g, " | ") : null;
  const weeks = page.getByRole("list", { name: /^Distinct bouts per week/ });
  const weekButtons = await weeks.getByRole("button").evaluateAll((buttons) => buttons.map((button) => { const b = button.getBoundingClientRect(); return { label: button.getAttribute("aria-label"), width: Math.round(b.width * 10) / 10, height: Math.round(b.height * 10) / 10 }; }));
  record({ scene: "progress", viewport: `${width}x${height}`, circumference: await text(circumference), diamonds: await circumference.locator('polygon[data-protocol="changed"]').count(), grip: await text(grip), gripRings: await grip.locator("[data-best]").count(), deadHang: await text(hang), hangRings: await hang.locator("[data-best]").count(), weekButtons, noOverflow: await noOverflow(page), smallControls: await smallControls(page, ".spz-measure"), files: [`progress-weeks-${width}.png`, `progress-readings-${width}.png`, `progress-performance-${width}.png`] });

  // This week's bar, opened: its bouts, as a day's bar opens them.
  await tap(page, weeks.getByRole("button").last());
  const sheet = page.getByRole("dialog").first();
  await sheet.waitFor();
  await page.waitForTimeout(400);
  // The first exercise opened, as an athlete checks what was counted: its sets and their workouts.
  await tap(page, sheet.locator(".spz-ledger > details > summary").first());
  await sheet.locator(".spz-sheet-body").evaluate((body) => { body.scrollTop = 0; });
  await page.waitForTimeout(300);
  await page.screenshot({ path: shot(`week-bouts-${width}`) });
  record({ scene: "week-bouts", viewport: `${width}x${height}`, title: await sheet.locator("h2").innerText(), intro: (await sheet.locator(".spz-sheet-subtitle").innerText()).replace(/\n/g, " "), exercises: await sheet.locator(".spz-ledger summary b").allInnerTexts(), openThisWorkoutInFirstExercise: await sheet.getByRole("button", { name: /Open this workout/ }).count(), smallControls: await smallControls(page, ".spz-sheet"), file: `week-bouts-${width}.png` });
  await context.close();
}

// ---------------------------------------------------------------- F-phone-5: touch targets, the page and its sheets

if (want("touch")) for (const [width, height] of [[390, 844], [375, 667], [320, 568]]) {
  const extraSessions = [workout("s3", 1, "Day 04 · Upper", [{ id: "e5", exerciseName: "Dumbbell Pullover", catalogId: 24, plannedPrescription: "3 × 12", sets: [set(40, 12)] }, { id: "e6", exerciseName: "One-Arm Dumbbell Wrist Curl", catalogId: 410, plannedPrescription: "1 × 12", sets: [set(25, 12)] }])];
  extraSessions[0].note = "Grip gave out on the last set.";
  const { context, page } = await open(width, height, { goals: fourTargets, extraSessions });
  // Every disclosure on the page open, so every control is drawn.
  for (const summary of await page.locator(".spz-page details > summary").all()) { if (!(await summary.evaluate((element) => element.parentElement.open))) await summary.evaluate((element) => element.click()); }
  await page.waitForTimeout(400);
  const pageSmall = await smallControls(page, ".spz-page");
  await tap(page, page.getByRole("button", { name: /^Flexor carpi ulnaris,/ }));
  const sheet = page.getByRole("dialog").first();
  await sheet.waitFor();
  for (const summary of await sheet.locator("details > summary").all()) { if (!(await summary.evaluate((element) => element.parentElement.open))) await summary.evaluate((element) => element.click()); }
  await page.waitForTimeout(300);
  const muscleSmall = await smallControls(page, ".spz-sheet");
  await tap(page, sheet.getByRole("button", { name: "Close" }));
  // The sets with no arm recorded, from How this is counted (F-completeness-4), every group opened.
  await tap(page, page.locator("#spz-method").getByRole("button", { name: /with no arm recorded/ }));
  const bouts = page.getByRole("dialog").first();
  await bouts.waitFor();
  for (const summary of await bouts.locator("details > summary").all()) { if (!(await summary.evaluate((element) => element.parentElement.open))) await summary.evaluate((element) => element.click()); }
  await page.waitForTimeout(300);
  const boutsSmall = await smallControls(page, ".spz-sheet");
  record({ scene: "touch-targets", viewport: `${width}x${height}`, scope: "every disclosure on the page open; the FCU sheet with every disclosure open; the no-arm sets sheet", pageUnder44: pageSmall, muscleSheetUnder44: muscleSmall, boutSheetUnder44: boutsSmall, noOverflow: await noOverflow(page) });
  await context.close();
}

// The other sheets: a movement (from its target in Targets, every disclosure open), the add sheet
// with a day chosen, and a week's bouts from Progress with every exercise open.
if (want("touch")) for (const [width, height] of [[390, 844], [375, 667], [320, 568]]) {
  const movementGoal = { ...goal("t5", null, "right", 10), actionId: "wrist.flexion" };
  const { context, page } = await open(width, height, { goals: [movementGoal], query: "&node=forearm.fcu" });
  const targets = page.locator("details.spz-disclosure", { has: page.locator("summary b", { hasText: /^Targets$/ }) });
  await targets.locator("summary").evaluate((element) => element.click());
  await page.waitForTimeout(300);
  await tap(page, targets.getByRole("button", { name: /^Open Wrist flexion/ }));
  let sheet = page.getByRole("dialog").first();
  await sheet.waitFor();
  for (const summary of await sheet.locator("details > summary").all()) { if (!(await summary.evaluate((element) => element.parentElement.open))) await summary.evaluate((element) => element.click()); }
  await page.waitForTimeout(300);
  const movementSmall = await smallControls(page, ".spz-sheet");
  await tap(page, sheet.getByRole("button", { name: "Close" }));
  await tap(page, page.getByRole("button", { name: /Inspect coverage/ }).first());
  sheet = page.getByRole("dialog").first();
  await sheet.waitFor();
  await tap(page, sheet.getByRole("button", { name: /Add or swap/ }).first());
  const change = page.getByRole("dialog", { name: "Add to your plan" });
  await change.waitFor();
  await tap(page, change.getByRole("button", { name: /^Day 02 · Lower/ }));
  const addSmall = await smallControls(page, ".spz-sheet");
  await tap(page, change.getByRole("button", { name: "Close" }));
  const progress = page.locator("details.spz-disclosure", { has: page.locator("summary b", { hasText: /^Progress$/ }) });
  await progress.locator("summary").evaluate((element) => element.click());
  await page.waitForTimeout(400);
  await tap(page, page.getByRole("list", { name: /^Distinct bouts per week/ }).getByRole("button").last());
  sheet = page.getByRole("dialog").first();
  await sheet.waitFor();
  for (const summary of await sheet.locator("details > summary").all()) { if (!(await summary.evaluate((element) => element.parentElement.open))) await summary.evaluate((element) => element.click()); }
  await page.waitForTimeout(300);
  const weekSmall = await smallControls(page, ".spz-sheet");
  record({ scene: "touch-targets-sheets", viewport: `${width}x${height}`, scope: "the wrist flexion movement sheet with every disclosure open; the add sheet with a day chosen; this week's bouts from Progress with every exercise open", movementSheetUnder44: movementSmall, addSheetUnder44: addSmall, weekSheetUnder44: weekSmall, noOverflow: await noOverflow(page) });
  await context.close();
}

// ---------------------------------------------------------------- toasts: the add's Undo, and the app's other toasts

if (want("toast")) for (const [width, height] of [[390, 844], [375, 667], [320, 568]]) {
  const { context, page } = await open(width, height, { query: "&node=forearm.fcu" });
  await tap(page, page.getByRole("button", { name: /Inspect coverage/ }).first());
  const sheet = page.getByRole("dialog").first();
  await sheet.waitFor();
  await tap(page, sheet.getByRole("button", { name: /Add or swap/ }).first());
  const change = page.getByRole("dialog", { name: "Add to your plan" });
  await change.waitFor();
  await tap(page, change.getByRole("button", { name: /^Day 02 · Lower/ }));
  await tap(page, change.getByRole("button", { name: "Save to plan" }));
  const toast = page.locator("[data-sonner-toast]").first();
  await toast.waitFor({ timeout: 5000 });
  await page.waitForTimeout(600);
  const buttons = await toast.locator("button").evaluateAll((list) => list.map((button) => { const b = button.getBoundingClientRect(); return { text: (button.getAttribute("aria-label") || button.textContent || "").trim(), width: Math.round(b.width * 10) / 10, height: Math.round(b.height * 10) / 10, top: Math.round(b.top) }; }));
  const toastBox = await toast.boundingBox();
  await page.screenshot({ path: shot(`toast-add-undo-${width}`) });
  record({ scene: "toast-add-undo", viewport: `${width}x${height}`, toast: { top: round(toastBox.y), bottom: round(toastBox.y + toastBox.height), height: round(toastBox.height) }, dockTop: await dockTop(page), buttons, text: (await toast.innerText()).replace(/\n/g, " | "), file: `toast-add-undo-${width}.png` });
  await context.close();
}

// Plan's own toasts, which share the styling: an exercise removed from a day (Undo as the action)
// and one moved later in Reorder (Undo as the cancel). Opened from the Plan workspace.
if (want("toast")) for (const [width, height] of [[390, 844], [375, 667]]) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, timezoneId: "UTC" });
  const page = await context.newPage();
  await page.route("**/api/trpc/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(new URL(route.request().url()).searchParams.get("batch") ? [{ result: { data: { json: null } } }] : { result: { data: { json: null } } }) }));
  await page.addInitScript((seed) => {
    if (sessionStorage.getItem("final-seeded")) return;
    sessionStorage.setItem("final-seeded", "1");
    localStorage.setItem("sports-genome-launch-experience-enabled-v1", "off");
    localStorage.setItem("gym-optimizer-athlete-profile-v1", JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Muscle growth", trainingDays: 4, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb", sexForReference: "male", birthYear: 1995, bodyWeight: 180 } }));
    localStorage.setItem("gym-optimizer-workout-plan-v1", JSON.stringify(seed.plan));
  }, { plan });
  await page.goto(`${base}/?workspace=day-plan`);
  await page.waitForTimeout(2500);
  const shots = [];
  const toastShot = async (kind, file) => {
    const toast = page.locator("[data-sonner-toast]").first();
    await toast.waitFor({ timeout: 5000 }).catch(() => null);
    await page.waitForTimeout(600);
    if (!(await toast.count())) { shots.push({ toast: kind, missing: true }); return null; }
    const buttons = await toast.locator("button").evaluateAll((list) => list.map((button) => { const b = button.getBoundingClientRect(); return { text: (button.getAttribute("aria-label") || button.textContent || "").trim(), width: Math.round(b.width * 10) / 10, height: Math.round(b.height * 10) / 10 }; }));
    const box = await toast.boundingBox();
    await page.screenshot({ path: shot(file) });
    shots.push({ toast: kind, text: (await toast.innerText()).replace(/\n/g, " | "), toastHeight: round(box.height), buttons, file: `${file}.png` });
    return toast;
  };
  // Remove the first exercise from the day: "Removed from …" with Undo as its action. Undo puts it back.
  await tap(page, page.locator(".day-row-remove").first());
  const removed = await toastShot("removed from the day", `toast-plan-remove-${width}`);
  if (removed) await tap(page, removed.getByRole("button", { name: "Undo" }));
  await page.waitForTimeout(800);
  // Reorder, then move the first exercise later: "Moved … later" with Undo as its cancel.
  const reorder = page.getByRole("button", { name: /^Reorder$/i }).first();
  if (await reorder.count()) {
    await tap(page, reorder);
    const later = page.locator('button[aria-label^="Move "][aria-label$=" later"]:not([disabled])').first();
    if (await later.count()) { await tap(page, later); await toastShot("moved later", `toast-plan-move-${width}`); }
  }
  record({ scene: "toast-plan", viewport: `${width}x${height}`, toasts: shots });
  await context.close();
}

// ---------------------------------------------------------------- the first screen (the numbers 09-page cites)

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
if (want("first-screen")) for (const [width, height] of [[390, 844], [375, 667], [430, 932], [320, 568]]) {
  const { context, page } = await open(width, height, { query: "&node=forearm.fcu" });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  if (width === 375) await page.screenshot({ path: shot("first-screen-fcu-375") });
  if (width === 390) await page.screenshot({ path: shot("first-screen-fcu-390") });
  record({ scene: "first-screen", state: "FCU selected", viewport: `${width}x${height}`, ...(await firstScreen(page)) });
  await context.close();
}
if (want("first-screen")) for (const [width, height] of [[375, 667], [390, 844]]) {
  const target = [goal("t2", "forearm.fcu", "right", 6)];
  for (const [state, query, goals, origin] of [
    ["with a target", "&node=forearm.fcu", target, null],
    ["Custom dates", `&node=forearm.fcu${custom}`, [], null],
    ["Custom dates and a target", `&node=forearm.fcu${custom}`, target, null],
    ["Back to Muscle map", "&node=forearm.fcu", [], "body"],
    ["Back to Muscle map and a target", "&node=forearm.fcu", target, "body"],
    ["Back to Muscle map and Custom dates", `&node=forearm.fcu${custom}`, [], "body"],
    ["Back to Muscle map, Custom dates and a target", `&node=forearm.fcu${custom}`, target, "body"],
  ]) {
    const { context, page } = await open(width, height, { query, goals, origin });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    const back = await page.locator(".spz-back").count();
    record({ scene: "first-screen", state, viewport: `${width}x${height}`, back: back > 0, ...(await firstScreen(page)) });
    await context.close();
  }
}

// A tap on the drawing changes the strip above it (the region line gives way to a muscle's name):
// how far the strip's height changed, which is how far the drawing would move under the finger,
// and how far it moved.
if (want("first-screen")) for (const [width, height] of [[390, 844], [375, 667], [430, 932], [320, 568]]) {
  const { context, page } = await open(width, height);
  const square = page.locator('.spz-diagram-hit[data-node="forearm.fcu"] rect');
  // In the middle of the screen, clear of the dock, as a thumb reaches it.
  await square.evaluate((element) => window.scrollBy({ top: element.getBoundingClientRect().top - window.innerHeight / 2, behavior: "instant" }));
  await page.waitForTimeout(200);
  const before = await page.evaluate(() => ({ strip: document.querySelector(".spz-strip").getBoundingClientRect().height, drawing: document.querySelector(".spz-diagram-svg").getBoundingClientRect().top }));
  const box = await square.boundingBox();
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => ({ strip: document.querySelector(".spz-strip").getBoundingClientRect().height, drawing: document.querySelector(".spz-diagram-svg").getBoundingClientRect().top, selected: document.querySelector(".spz-strip-name b")?.textContent ?? null }));
  record({ scene: "drawing-under-the-finger", viewport: `${width}x${height}`, selected: after.selected, stripHeightChangePx: round(after.strip - before.strip), drawingMovedPx: round(after.drawing - before.drawing) });
  await context.close();
}

await browser.close();
server.close();
if (!only.size) writeFileSync(join(here, "checks.json"), `${JSON.stringify(checks, null, 2)}\n`);
