/**
 * Phone evidence for the page lane's review fixes (wave 0, 20 Oct 2026): the inline dates between
 * 320 and 390 px, Undo on a target saved earlier on a muscle that is not a target here, the failed
 * region load and its Reload, the forearm ledger's side labels, and the planned announcement.
 *
 * Headless Chromium emulating an iPhone (viewport, isMobile, hasTouch, deviceScaleFactor 3): not an
 * iPhone, not Safari. The production client build, served by a small static server here, device
 * stores seeded.
 *
 *   npx vite build --outDir <prod>
 *   node docs/specialization-atlas/evidence/page-wave0-2026-10-20/capture-fixes.mjs <prod>
 *
 * Writes the screenshots kept (fix-*.png) and checks-fixes.json next to this file. Dates are
 * relative to the day it runs (this week's workouts on Monday and Tuesday), UTC.
 */
import { createReadStream, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const prodDir = resolve(process.argv[2] ?? "");
if (!existsSync(join(prodDir, "index.html"))) throw new Error("Usage: capture-fixes.mjs <production build>");

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".json": "application/json", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json" };
const server = createServer((request, response) => {
  const path = decodeURIComponent(new URL(request.url, "http://x").pathname);
  let file = join(prodDir, path);
  if (!file.startsWith(prodDir) || !existsSync(file) || statSync(file).isDirectory()) file = join(prodDir, "index.html");
  response.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(response);
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const base = `http://127.0.0.1:${server.address().port}`;
/** The forearm's own chunk: the region's data, imported when the page shows the forearm. */
const forearmChunk = readdirSync(join(prodDir, "assets")).find((name) => name.endsWith(".js") && readFileSync(join(prodDir, "assets", name), "utf8").includes("Holding on is the purpose of the set"));

// ---------------------------------------------------------------- the athlete's records

const DAY = 86_400_000;
const todayKey = new Date().toISOString().slice(0, 10);
const mondayMs = (() => { const d = new Date(`${todayKey}T00:00:00Z`); return d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY; })();
const at = (dayOffset, hour) => new Date(mondayMs + dayOffset * DAY + hour * 3_600_000).toISOString();
const set = (weight, reps, extra = {}) => ({ weight: String(weight), reps: String(reps), unit: "lb", completed: true, ...extra });
const workout = (id, dayOffset, label, exercises) => ({ id, title: label, dayLabel: `Week 1 · ${label}`, startedAt: at(dayOffset, 17), completedAt: at(dayOffset, 18), status: "completed", exercises });
const ex = (id, catalogId, exerciseName, sets) => ({ id, exerciseName, catalogId, plannedPrescription: `${sets.length} × 12`, sets });
/** Two-handed curls, wrist curls one arm at a time (one set with no arm recorded, one logged Both), a row one per arm. */
const sessions = [
  workout("s1", 0, "Day 02 · Pull", [
    ex("e1", 132, "Hammer Curl", [set(30, 12), set(30, 12), set(30, 10)]),
    ex("e2", 410, "One-Arm Dumbbell Wrist Curl", [set(25, 15, { side: "both" }), set(25, 15, { side: "left" }), set(25, 15)]),
    ex("e3", 46, "Dumbbell Row", [set(60, 10, { side: "right" }), set(60, 10, { side: "left" })]),
  ]),
  workout("s2", 1, "Day 04 · Upper", [ex("e4", 139, "Wrist Curl", [set(60, 15), set(60, 15), set(60, 12)])]),
];
const lastWeek = new Date(mondayMs - 7 * DAY).toISOString().slice(0, 10);
const goal = (id, nodeId, side, target) => ({ id, regionId: "forearm", nodeId, actionId: null, side, metric: "direct_dynamic_bouts", target, period: "calendar_week", startsOn: lastWeek, endsOn: null, timezone: "UTC", createdAt: at(-7, 8), updatedAt: at(-7, 8) });
/** Targets saved before targets were limited to a region's target muscles (10-multi-region.md §2.2). */
const earlierTargets = [goal("bic", "upper_arm.biceps", "right", 5), goal("anc", "forearm.anconeus", "right", 3)];
const entries = (ids) => ids.map((id) => ({ entryId: id, catalogExerciseId: id }));
const planWeek = { customWorkoutIds: [], weeklyPlanIds: {}, weeklyPlanEntries: { "0-Upper": entries([1, 45, 132]), "1-Lower": entries([167]), "2-Upper": entries([3, 139, 140]), "3-Lower": entries([168]) }, prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: {}, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 0 };
const plan = { version: 2, ...planWeek, weeks: { "1": planWeek }, activeWeek: 1 };
const custom = `&window=custom&from=${new Date(mondayMs - 6 * DAY).toISOString().slice(0, 10)}&to=${todayKey}`;

// ---------------------------------------------------------------- the browser

const browser = await chromium.launch();
const checks = {
  note: `Headless Chromium emulating an iPhone (viewport, isMobile, hasTouch, deviceScaleFactor 3, en-US); not an iPhone, not Safari. Production build, device stores seeded (Hammer Curl x3, One-Arm Dumbbell Wrist Curl logged Both, Left and with no arm, Dumbbell Row one per arm on Monday; Wrist Curl x3 on Tuesday; targets saved earlier on the biceps and the anconeus, right arm). Run on ${todayKey}, UTC. Coordinates are CSS px from the top of the screen.`,
  scenes: [],
};
const keep = new Set();
const shot = (name) => (keep.add(`${name}.png`), join(here, `${name}.png`));
const record = (entry) => { checks.scenes.push(entry); console.log(JSON.stringify(entry)); };
const round = (value) => Math.round(value * 10) / 10;

async function open(width, height, { query = "", goals = [], origin = null, routes = null, waitRows = true } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, timezoneId: "UTC", locale: "en-US" });
  const page = await context.newPage();
  await page.route("**/api/trpc/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(new URL(route.request().url()).searchParams.get("batch") ? [{ result: { data: { json: null } } }] : { result: { data: { json: null } } }) }));
  if (routes) await routes(page);
  if (origin) await page.addInitScript((from) => { if (!window.history.state?.specializationOrigin) window.history.replaceState({ workspace: "specialization", specializationOrigin: from }, "", window.location.href); }, origin);
  await page.addInitScript((seed) => {
    if (sessionStorage.getItem("fixes-seeded")) return;
    sessionStorage.setItem("fixes-seeded", "1");
    localStorage.setItem("sports-genome-launch-experience-enabled-v1", "off");
    localStorage.setItem("gym-optimizer-athlete-profile-v1", JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Muscle growth", trainingDays: 4, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb", sexForReference: "male", birthYear: 1995, bodyWeight: 180 } }));
    localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(seed.sessions));
    localStorage.setItem("gym-optimizer-workout-plan-v1", JSON.stringify(seed.plan));
    localStorage.setItem("sports-genome-specialization-goals-v1", JSON.stringify(seed.goals));
  }, { sessions, plan, goals });
  await page.goto(`${base}/?workspace=specialization&region=forearm${query}`);
  await page.locator(".spz-page").waitFor({ timeout: 30000 });
  if (waitRows) await page.locator(".spz-row").first().waitFor({ timeout: 30000 });
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
const active = (page) => page.evaluate(() => { const element = document.activeElement; return element ? { tag: element.tagName, text: (element.getAttribute("aria-label") || element.textContent || "").trim().slice(0, 80) } : null; });
const overflowX = (page) => page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth));
const storedGoals = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("sports-genome-specialization-goals-v1") ?? "[]").map((item) => `${item.nodeId}:${item.side}:${item.endsOn ?? "open"}`).sort());
const alerts = (page) => page.evaluate(() => Array.from(document.querySelectorAll("[role='alert']")).map((element) => element.textContent.trim()).filter(Boolean));
const sizeOf = async (locator) => { const box = await locator.boundingBox(); return box ? { width: round(box.width), height: round(box.height), top: round(box.y) } : null; };

// ---------------------------------------------------------------- the inline dates, 320 to 430 px

/** A date with wide digits in the From field ("08/08/…"), the field the year was cut from. */
const wideDates = `&window=custom&from=${todayKey.slice(0, 4)}-08-08&to=${todayKey}`;
for (const [width, height] of [[320, 568], [360, 780], [368, 780], [372, 780], [375, 667], [390, 844], [430, 932]]) {
  const { context, page } = await open(width, height, { query: `&node=forearm.fcu${wideDates}` });
  const fields = await page.evaluate(() => Array.from(document.querySelectorAll(".spz-dates input")).map((input) => {
    const style = getComputedStyle(input);
    const canvas = document.createElement("canvas").getContext("2d");
    canvas.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const [y, m, d] = input.value.split("-");
    const box = input.getBoundingClientRect();
    // Chromium draws its calendar icon inside this content box, so the room the date has is less; the screenshots show it.
    return { label: document.querySelector(`label[for="${input.id}"]`)?.textContent ?? null, input: [Math.round(box.width * 10) / 10, Math.round(box.height * 10) / 10], fontSize: style.fontSize, contentPx: Math.round((input.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)) * 10) / 10, datePx: Math.round(canvas.measureText(`${m}/${d}/${y}`).width * 10) / 10, top: Math.round(box.top) };
  }));
  const dates = await page.locator(".spz-dates").boundingBox();
  const name = [320, 360, 375, 390].includes(width) ? `fix-dates-${width}` : null;
  if (name) await page.screenshot({ path: shot(name), clip: { x: 0, y: dates.y - 8, width, height: dates.height + 16 } });
  record({ scene: "inline-dates", viewport: `${width}x${height}`, rows: new Set(fields.map((field) => field.top)).size, fields, datesHeight: round(dates.height), horizontalOverflowPx: await overflowX(page), ...(name ? { file: `${name}.png` } : {}) });
  await context.close();
}

// The first screen with Back, Custom dates and a target: at 375, 390 and 430 (one row of dates), and at 360 (stacked).
for (const [width, height] of [[375, 667], [390, 844], [430, 932], [360, 780]]) {
  const { context, page } = await open(width, height, { query: `&node=forearm.fcu${custom}`, goals: [goal("t", "forearm.fcu", "right", 6)], origin: "body" });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  const screen = await page.evaluate(() => {
    const dock = document.querySelector(".mobile-workspace-dock")?.getBoundingClientRect().top ?? window.innerHeight;
    const strip = document.querySelector(".spz-strip").getBoundingClientRect();
    const drawing = document.querySelector(".spz-diagram-svg").getBoundingClientRect();
    return { dockTop: Math.round(dock), stripBottom: Math.round(strip.bottom), drawingOnFirstScreenPx: Math.round(dock - drawing.top), stripWhole: strip.bottom <= dock };
  });
  record({ scene: "first-screen", state: "Back, Custom dates and a target", viewport: `${width}x${height}`, ...screen, horizontalOverflowPx: await overflowX(page) });
  await context.close();
}

// ---------------------------------------------------------------- Undo on a target saved earlier on a muscle that is not a target here

for (const [width, height] of [[390, 844], [375, 667]]) {
  for (const [muscle, node, action] of [["Biceps brachii", "upper_arm.biceps", "Remove"], ["Anconeus", "forearm.anconeus", "End"]]) {
    const { context, page } = await open(width, height, { query: `&node=${node}&limb=right`, goals: earlierTargets });
    await tap(page, page.getByRole("button", { name: /Inspect coverage/ }));
    const sheet = page.getByRole("dialog");
    const before = await storedGoals(page);
    await tap(page, sheet.getByRole("button", { name: new RegExp(`^${action} the right-arm target`) }));
    const undo = sheet.getByRole("button", { name: "Undo" });
    const afterAction = { stored: await storedGoals(page), message: (await sheet.getByRole("status").textContent()).trim(), undo: await sizeOf(undo), focus: await active(page), alerts: await alerts(page) };
    const name = width === 390 ? `fix-undo-${node.split(".")[1]}-${action.toLowerCase()}-390` : null;
    if (name) await page.screenshot({ path: shot(name) });
    await tap(page, undo);
    const afterUndo = { stored: await storedGoals(page), message: (await sheet.getByRole("status").textContent()).trim(), focus: await active(page), alerts: await alerts(page) };
    const restoredName = width === 390 ? `${name}-undone` : null;
    if (restoredName) await page.screenshot({ path: shot(restoredName) });
    record({ scene: "read-only-target-undo", where: "muscle sheet", muscle, action, viewport: `${width}x${height}`, before, afterAction, afterUndo, restored: JSON.stringify(afterUndo.stored) === JSON.stringify(before), horizontalOverflowPx: await overflowX(page), files: [name, restoredName].filter(Boolean).map((file) => `${file}.png`) });
    await context.close();
  }
}
{
  const { context, page } = await open(390, 844, { query: "&limb=right", goals: earlierTargets });
  const targets = page.locator("details", { has: page.getByText("Targets", { exact: true }) }).first();
  await tap(page, targets.locator("summary"));
  const before = await storedGoals(page);
  await tap(page, targets.getByRole("button", { name: /^End the right-arm target of 5 direct dynamic bouts per calendar week for Biceps brachii/ }));
  const undo = targets.getByRole("button", { name: "Undo" });
  const afterEnd = { stored: await storedGoals(page), undo: await sizeOf(undo), focus: await active(page), alerts: await alerts(page) };
  await tap(page, undo);
  record({ scene: "read-only-target-undo", where: "Targets overview", muscle: "Biceps brachii", action: "End", viewport: "390x844", before, afterEnd, afterUndo: { stored: await storedGoals(page), alerts: await alerts(page) }, restored: JSON.stringify(await storedGoals(page)) === JSON.stringify(before) });
  await context.close();
}

// ---------------------------------------------------------------- a failed region load, and Reload

for (const [width, height] of [[390, 844], [375, 667]]) {
  const requests = [];
  const { context, page } = await open(width, height, { origin: "body", waitRows: false, routes: async (target) => {
    await target.route(new RegExp(`assets/${forearmChunk.replace(/[.]/g, "\\.")}$`), async (route) => { requests.push(route.request().url()); if (requests.length === 1) await route.abort("connectionreset"); else await route.continue(); });
  } });
  await page.getByRole("button", { name: "Reload" }).waitFor({ timeout: 15000 });
  const failed = { text: (await page.locator(".spz-loading").innerText()).replace(/\s+/g, " "), reload: await sizeOf(page.getByRole("button", { name: "Reload" })), back: await page.locator(".spz-back").textContent(), requests: requests.length };
  const name = width === 390 ? "fix-reload-390" : null;
  if (name) await page.screenshot({ path: shot(name) });
  await tap(page, page.getByRole("button", { name: "Reload" }));
  await page.locator(".spz-row").first().waitFor({ timeout: 30000 });
  const reloaded = { rows: await page.locator(".spz-row").count(), requests: requests.length, address: await page.evaluate(() => window.location.search), back: await page.locator(".spz-back").textContent(), heading: await page.locator("#spz-heading").textContent() };
  record({ scene: "failed-load-reload", viewport: `${width}x${height}`, chunk: forearmChunk, failed, reloaded, horizontalOverflowPx: await overflowX(page), ...(name ? { file: `${name}.png` } : {}) });
  await context.close();
}

// ---------------------------------------------------------------- the forearm ledger's side labels, and the planned announcement

{
  const { context, page } = await open(390, 844, { query: "&node=forearm.fcr&limb=left" });
  await tap(page, page.getByRole("button", { name: /Inspect coverage/ }));
  const sheet = page.getByRole("dialog");
  await page.evaluate(() => document.querySelectorAll("[role='dialog'] details").forEach((details) => { details.open = true; }));
  await page.waitForTimeout(300);
  const rows = await sheet.locator(".spz-ledger .spz-bout-head small").allTextContents();
  const ledger = sheet.locator(".spz-ledger").first();
  await ledger.scrollIntoViewIfNeeded();
  await page.screenshot({ path: shot("fix-ledger-fcr-left-390") });
  record({ scene: "ledger-side-labels", viewport: "390x844", muscle: "Flexor carpi radialis", side: "left", rowLines: rows.map((text) => text.trim()), file: "fix-ledger-fcr-left-390.png" });
  await context.close();
}
{
  const { context, page } = await open(390, 844, { query: "&limb=left" });
  await tap(page, page.getByRole("group", { name: "Planned or completed" }).getByRole("button", { name: "Planned" }));
  await page.waitForTimeout(600);
  const said = await page.locator(".spz-page > [aria-live='polite']").textContent();
  record({ scene: "planned-announcement", viewport: "390x844", said, planWeekNamed: (said.match(/Plan\sWeek\s1/g) ?? []).length });
  await context.close();
}

checks.kept = Array.from(keep).sort();
writeFileSync(join(here, "checks-fixes.json"), `${JSON.stringify(checks, null, 1)}\n`);
await browser.close();
server.close();
