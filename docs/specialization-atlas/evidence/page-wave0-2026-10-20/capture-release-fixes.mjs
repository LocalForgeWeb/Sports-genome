/**
 * Phone evidence for the wave 0 release review's page fixes (20 Oct 2026): Coverage to review
 * with targets saved earlier on muscles that are not targets here (said last, as ones to end or
 * remove), a muscle nothing can be counted for (the anconeus's strip), and Progress's reading date
 * and time in two equal columns.
 *
 * Headless Chromium emulating an iPhone (viewport, isMobile, hasTouch, deviceScaleFactor 3, en-US,
 * UTC): not an iPhone, not Safari. The production client build, served by a small static server
 * here, device stores seeded.
 *
 *   npx vite build --outDir <prod>
 *   node docs/specialization-atlas/evidence/page-wave0-2026-10-20/capture-release-fixes.mjs <prod>
 *
 * Writes release-*.png (each reduced to 256 colours afterwards with Pillow) and
 * checks-release-fixes.json next to this file. Dates are relative to the day it runs (this week's
 * workouts on Monday and Tuesday), UTC.
 */
import { createReadStream, existsSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const prodDir = resolve(process.argv[2] ?? "");
if (!existsSync(join(prodDir, "index.html"))) throw new Error("Usage: capture-release-fixes.mjs <production build>");

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

// ---------------------------------------------------------------- the athlete's records

const DAY = 86_400_000;
const todayKey = new Date().toISOString().slice(0, 10);
const mondayMs = (() => { const d = new Date(`${todayKey}T00:00:00Z`); return d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY; })();
const at = (dayOffset, hour) => new Date(mondayMs + dayOffset * DAY + hour * 3_600_000).toISOString();
const set = (weight, reps, extra = {}) => ({ weight: String(weight), reps: String(reps), unit: "lb", completed: true, ...extra });
const workout = (id, dayOffset, label, exercises) => ({ id, title: label, dayLabel: `Week 1 · ${label}`, startedAt: at(dayOffset, 17), completedAt: at(dayOffset, 18), status: "completed", exercises });
const ex = (id, catalogId, exerciseName, sets) => ({ id, exerciseName, catalogId, plannedPrescription: `${sets.length} × 12`, sets });
/** Curls, wrist curls one arm at a time with more on the right (and one set with no arm recorded), two-handed wrist curls. */
const sessions = [
  workout("s1", 0, "Day 02 · Pull", [
    ex("e1", 132, "Hammer Curl", [set(30, 12), set(30, 12), set(30, 10)]),
    ex("e2", 410, "One-Arm Dumbbell Wrist Curl", [set(25, 15, { side: "right" }), set(25, 15, { side: "right" }), set(25, 15, { side: "right" }), set(25, 15, { side: "left" }), set(25, 15)]),
  ]),
  workout("s2", 1, "Day 04 · Upper", [ex("e3", 139, "Wrist Curl", [set(60, 15), set(60, 15), set(60, 12)])]),
];
const lastWeek = new Date(mondayMs - 7 * DAY).toISOString().slice(0, 10);
const goal = (id, nodeId, side, target) => ({ id, regionId: "forearm", nodeId, actionId: null, side, metric: "direct_dynamic_bouts", target, period: "calendar_week", startsOn: lastWeek, endsOn: null, timezone: "UTC", createdAt: at(-7, 8), updatedAt: at(-7, 8) });
/** A target on a target muscle (behind), and two saved before targets were limited to a region's target muscles (10-multi-region.md §2.2). */
const goals = [goal("fcr", "forearm.fcr", "right", 8), goal("bic", "upper_arm.biceps", "right", 5), goal("anc", "forearm.anconeus", "right", 3)];
const entries = (ids) => ids.map((id) => ({ entryId: id, catalogExerciseId: id }));
const planWeek = { customWorkoutIds: [], weeklyPlanIds: {}, weeklyPlanEntries: { "0-Upper": entries([1, 45, 132]), "1-Lower": entries([167]), "2-Upper": entries([3, 139, 140]), "3-Lower": entries([168]) }, prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: {}, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 0 };
const plan = { version: 2, ...planWeek, weeks: { "1": planWeek }, activeWeek: 1 };

// ---------------------------------------------------------------- the browser

const browser = await chromium.launch();
const checks = {
  note: `Headless Chromium emulating an iPhone (viewport, isMobile, hasTouch, deviceScaleFactor 3, en-US, UTC); not an iPhone, not Safari. Production build. Device stores seeded (this week: Hammer Curl x3 and One-Arm Dumbbell Wrist Curl three times on the right, once on the left and once with no arm on Monday; Wrist Curl x3 on Tuesday; targets: FCR right 8, and saved earlier, biceps right 5 and anconeus right 3; a 4-day Upper/Lower plan). Run on ${todayKey}, UTC. Coordinates are CSS px.`,
  scenes: [],
};
const shot = (name) => join(here, `${name}.png`);
const record = (entry) => { checks.scenes.push(entry); console.log(JSON.stringify(entry)); };
const round = (value) => Math.round(value * 10) / 10;

async function open(width, height, query = "") {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, timezoneId: "UTC", locale: "en-US" });
  const page = await context.newPage();
  await page.route("**/api/trpc/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(new URL(route.request().url()).searchParams.get("batch") ? [{ result: { data: { json: null } } }] : { result: { data: { json: null } } }) }));
  await page.addInitScript((seed) => {
    if (sessionStorage.getItem("release-seeded")) return;
    sessionStorage.setItem("release-seeded", "1");
    localStorage.setItem("sports-genome-launch-experience-enabled-v1", "off");
    localStorage.setItem("gym-optimizer-athlete-profile-v1", JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Muscle growth", trainingDays: 4, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb", sexForReference: "male", birthYear: 1995, bodyWeight: 180 } }));
    localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(seed.sessions));
    localStorage.setItem("gym-optimizer-workout-plan-v1", JSON.stringify(seed.plan));
    localStorage.setItem("sports-genome-specialization-goals-v1", JSON.stringify(seed.goals));
  }, { sessions, plan, goals });
  await page.goto(`${base}/?workspace=specialization&region=forearm&limb=right${query}`);
  await page.locator(".spz-page").waitFor({ timeout: 30000 });
  await page.locator(".spz-row").first().waitFor({ timeout: 30000 });
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
const overflowX = (page) => page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth));
/** Scrolls so `selector`'s top sits just under whatever is pinned to the top of the screen (the tab row), and returns its box. */
const toTop = async (page, selector) => {
  await page.evaluate((target) => {
    window.scrollTo(0, 0);
    const element = document.querySelector(target);
    window.scrollBy(0, element.getBoundingClientRect().top - window.innerHeight / 2);
    const pinned = Array.from(document.querySelectorAll("body *"))
      .filter((item) => ["fixed", "sticky"].includes(getComputedStyle(item).position))
      .map((item) => item.getBoundingClientRect())
      .filter((box) => box.top <= 1 && box.bottom > 0 && box.bottom < window.innerHeight / 2)
      .reduce((bottom, box) => Math.max(bottom, box.bottom), 0);
    window.scrollBy(0, element.getBoundingClientRect().top - pinned - 12);
  }, selector);
  await page.waitForTimeout(300);
  return page.locator(selector).boundingBox();
};

// ---------------------------------------------------------------- Coverage to review

for (const [width, height] of [[390, 844], [375, 667]]) {
  const { context, page } = await open(width, height);
  const more = page.getByRole("button", { name: /^Show \d+ more$/ });
  if (await more.count()) await tap(page, more);
  await toTop(page, "#spz-findings-title");
  const findings = await page.evaluate(() => Array.from(document.querySelectorAll(".spz-finding")).map((item) => {
    const button = item.querySelector("button");
    const box = button?.getBoundingClientRect();
    return { title: item.querySelector("strong")?.textContent, detail: item.querySelector("p")?.textContent, action: button?.textContent?.trim() ?? null, actionBox: box ? [Math.round(box.width * 10) / 10, Math.round(box.height * 10) / 10] : null };
  }));
  await page.screenshot({ path: shot(`release-findings-${width}`) });
  // On the small phone the targets saved earlier, said last, are a scroll further: their own screen.
  if (height < 700) {
    await page.evaluate(() => document.querySelectorAll(".spz-finding")[3]?.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(300);
    await page.screenshot({ path: shot(`release-findings-${width}-end`) });
  }
  // Its action opens the muscle's sheet at its targets, which End and Remove there.
  const anconeus = page.locator(".spz-finding").filter({ hasText: "Anconeus: a target saved earlier" }).getByRole("button");
  await tap(page, anconeus);
  const sheet = page.getByRole("dialog");
  const sheetText = await sheet.evaluate((element) => element.textContent);
  record({
    scene: "coverage-to-review", viewport: `${width}x${height}`, findings,
    readOnlyLast: findings.slice(-2).map((item) => item.title),
    seeExercisesFor: findings.filter((item) => item.action === "See exercises for it").map((item) => item.title),
    anconeusActionOpens: { sheet: await sheet.getAttribute("aria-label") ?? (await sheet.locator("h2").first().textContent()), readOnlyNote: /You can end or remove this one\./.test(sheetText), nothingCounted: /cannot be counted yet/.test(sheetText), zeroOfTarget: /0 of your 3/.test(sheetText) },
    horizontalOverflowPx: await overflowX(page), file: `release-findings-${width}.png`,
  });
  await context.close();
}

// ---------------------------------------------------------------- a muscle nothing can be counted for

for (const [width, height] of [[390, 844], [375, 667]]) {
  const { context, page } = await open(width, height, "&node=forearm.anconeus");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  await page.screenshot({ path: shot(`release-anconeus-strip-${width}`) });
  const strip = await page.evaluate(() => {
    const box = document.querySelector(".spz-strip").getBoundingClientRect();
    const dock = document.querySelector(".mobile-workspace-dock")?.getBoundingClientRect().top ?? window.innerHeight;
    return { line: document.querySelector(".spz-strip-line")?.textContent, goal: document.querySelector(".spz-strip-goal")?.textContent, bottom: Math.round(box.bottom), dockTop: Math.round(dock) };
  });
  record({ scene: "anconeus-strip", viewport: `${width}x${height}`, ...strip, stripWhole: strip.bottom <= strip.dockTop, horizontalOverflowPx: await overflowX(page), file: `release-anconeus-strip-${width}.png` });
  await context.close();
}

// ---------------------------------------------------------------- a reading's date and time

for (const [width, height] of [[320, 568], [375, 667], [390, 844], [430, 932]]) {
  const { context, page } = await open(width, height);
  const progress = page.locator("details.spz-disclosure").filter({ has: page.locator("summary", { hasText: "Progress" }) });
  await tap(page, progress.locator("summary"));
  await tap(page, page.getByRole("button", { name: "Add a reading" }));
  // A date with wide digits, so the date's whole width is tested (the Custom dates' check).
  const date = page.locator(".spz-progress-when input[type=date]");
  await date.evaluate((input, value) => { input.value = value; }, `${todayKey.slice(0, 5)}08-08` <= todayKey ? `${todayKey.slice(0, 5)}08-08` : todayKey);
  const when = await toTop(page, ".spz-progress-when");
  const fields = await page.evaluate(() => Array.from(document.querySelectorAll(".spz-progress-when input")).map((input) => {
    const box = input.getBoundingClientRect();
    const style = getComputedStyle(input);
    return { type: input.type, left: Math.round(box.left * 10) / 10, right: Math.round(box.right * 10) / 10, top: Math.round(box.top), width: Math.round(box.width * 10) / 10, height: Math.round(box.height * 10) / 10, fontSize: style.fontSize, value: input.value };
  }));
  const [dateField, timeField] = fields;
  const sameRow = dateField.top === timeField.top;
  await page.screenshot({ path: shot(`release-progress-when-${width}`), clip: { x: 0, y: Math.max(0, when.y - 40), width, height: when.height + 80 } });
  record({ scene: "progress-date-time", viewport: `${width}x${height}`, fields, sameRow, gapPx: sameRow ? round(timeField.left - dateField.right) : null, overlap: sameRow && timeField.left < dateField.right, horizontalOverflowPx: await overflowX(page), file: `release-progress-when-${width}.png` });
  await context.close();
}

await browser.close();
server.close();
writeFileSync(join(here, "checks-release-fixes.json"), `${JSON.stringify(checks, null, 1)}\n`);
