/**
 * Phone evidence for release F3 (docs/specialization-atlas/11-forearm-research-and-stack.md §1.7,
 * §8.2 V1 and C1): `forearm_mappings_v2` and the catalog rows 417–420, 24 Oct 2026.
 *
 * Headless Chromium emulating an iPhone (viewport, isMobile, hasTouch, deviceScaleFactor 3,
 * en-US, UTC): emulation, not an iPhone, not Safari. The production client build, served by a
 * small static server here, device stores seeded as in wave-a-2026-10/capture.mjs, with a dead
 * hang and a farmer hold added to the week.
 *
 *   npx vite build --outDir <build>
 *   node docs/specialization-atlas/evidence/f3-2026-10/capture.mjs <build>
 *
 * Scenes, at 390 × 844 and 375 × 667:
 * - Plan's exercise picker (Train → Plan → Add, All catalog) searched for "wrist curl" (417 Cable
 *   Wrist Curl, 418 Behind-the-Back Wrist Curl), "barbell hold" (419) and "band index" (420);
 * - the new exercises on the forearm page: the extensor indicis's sheet, which now suggests 420;
 *   Planned mode's wrist flexion sheet, which suggests 417 and 418; the stack card, whose plan
 *   adds 420;
 * - the thumb flexor's (FPL) sheet: the dead hang, farmer hold and suitcase carry as incidental
 *   grip, where v1 had them under review;
 * - How this is counted, open: "specialization_exposure_v2 · forearm_mappings_v2" and v2's method
 *   notes;
 * - on each: every visible control under 44 × 44 px, the search field's font size, sideways scroll.
 *
 * The wrist flexion target (right) is there so its movement sheet has a way in (Targets, opened → Open).
 *
 * Writes the screenshots and checks.json next to this file. Dates are relative to the day it runs
 * (this week's workouts on Monday and Tuesday), UTC.
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
/** Wave A's week, with a dead hang and a farmer hold added on Tuesday. */
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
    ex("e3", 140, "Reverse Wrist Curl", [set(30, 15), set(30, 15), set(30, 12)]),
    ex("e15", 143, "Dead Hang", [hold(45), hold(40)]),
    ex("e16", 145, "Farmer Hold", [hold(30, { weight: "70" }), hold(30, { weight: "70" })]),
  ]),
];
const goal = (id, regionId, nodeId, side, target) => ({ id, regionId, nodeId, actionId: null, side, metric: "direct_dynamic_bouts", target, period: "calendar_week", startsOn: new Date(mondayMs - 7 * DAY).toISOString().slice(0, 10), endsOn: null, timezone: "UTC", createdAt: at(-7, 8), updatedAt: at(-7, 8) });
const targets = [goal("t1", "forearm", "forearm.fcu", "right", 6), { ...goal("t2", "forearm", null, "right", 8), actionId: "wrist.flexion" }];
const entries = (ids) => ids.map((id) => ({ entryId: id, catalogExerciseId: id }));
const planWeek = { customWorkoutIds: [], weeklyPlanIds: {}, weeklyPlanEntries: { "0-Upper": entries([1, 45, 132]), "1-Lower": entries([167]), "2-Upper": entries([3, 139, 140, 148]), "3-Lower": entries([168]) }, prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: {}, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 0 };
const plan = { version: 2, ...planWeek, weeks: { "1": planWeek }, activeWeek: 1 };

// ---------------------------------------------------------------- the browser

const browser = await chromium.launch();
const checks = {
  note: `Headless Chromium emulating an iPhone (viewport, isMobile, hasTouch, deviceScaleFactor 3, en-US, UTC); emulation, not an iPhone, not Safari. The production build of branch f3, served here. Device stores seeded: this week, Hammer Curl x3, Wrist Curl x4, Dumbbell Row one per arm, Suitcase Carry in the left hand, Pull-Up x2 and Barbell Curl x3 on Monday; Barbell Bench Press x3, Reverse Wrist Curl x3, Dead Hang 45 s and 40 s, Farmer Hold 2 x 30 s (straps not recorded) on Tuesday; wave A's 4-day Upper/Lower plan; targets on the FCU (right) and wrist flexion (right; its row opens the movement sheet). Run on ${todayKey}, UTC. Coordinates are CSS px from the top of the screen.`,
  scenes: [],
};
const keep = new Set();
const shot = (name) => (keep.add(name), join(here, `${name}.png`));
const record = (entry) => { checks.scenes.push(entry); console.log(JSON.stringify(entry).slice(0, 400)); };
const round = (value) => Math.round(value * 10) / 10;

async function open(width, height, path) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, timezoneId: "UTC", locale: "en-US" });
  const page = await context.newPage();
  await page.route("**/api/trpc/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(new URL(route.request().url()).searchParams.get("batch") ? [{ result: { data: { json: null } } }] : { result: { data: { json: null } } }) }));
  await page.addInitScript((seed) => {
    if (sessionStorage.getItem("f3-seeded")) return;
    sessionStorage.setItem("f3-seeded", "1");
    localStorage.setItem("sports-genome-launch-experience-enabled-v1", "off");
    localStorage.setItem("gym-optimizer-athlete-profile-v1", JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Muscle growth", trainingDays: 4, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb", sexForReference: "male", birthYear: 1995, bodyWeight: 180 } }));
    localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(seed.sessions));
    localStorage.setItem("gym-optimizer-workout-plan-v1", JSON.stringify(seed.plan));
    localStorage.setItem("sports-genome-specialization-goals-v1", JSON.stringify(seed.targets));
  }, { sessions, plan, targets });
  await page.goto(`${base}${path}`);
  return { context, page };
}
async function openForearm(width, height, query = "") {
  const opened = await open(width, height, `/?workspace=specialization&region=forearm${query}`);
  await opened.page.locator(".spz-page").waitFor({ timeout: 30000 });
  await opened.page.locator(".spz-row").first().waitFor({ timeout: 30000 });
  await opened.page.waitForTimeout(600);
  return opened;
}

/** Taps the element's centre, scrolled to the middle of the screen first (clear of the sticky tabs and the bottom dock). */
const tap = async (page, locator) => {
  await locator.scrollIntoViewIfNeeded();
  await locator.evaluate((element) => element.scrollIntoView({ block: "center", behavior: "instant" }));
  await page.waitForTimeout(150);
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
const textOf = (locator) => locator.evaluate((element) => element.innerText.replace(/\n+/g, " · "));
/** Scrolls a sheet (a dialog that scrolls itself, or the page) so the line is in view, and screenshots the screen. */
async function showLine(page, scope, text, name, block = "center") {
  const line = scope.getByText(text, { exact: false }).first();
  await line.scrollIntoViewIfNeeded();
  await line.evaluate((element, where) => element.scrollIntoView({ block: where, behavior: "instant" }), block);
  await page.waitForTimeout(300);
  const box = await line.boundingBox();
  await page.screenshot({ path: shot(name) });
  return box ? { top: round(box.y), height: round(box.height) } : null;
}

const sizes = [[390, 844], [375, 667]];

// ---------------------------------------------------------------- Plan's exercise picker

for (const [width, height] of sizes) {
  const { context, page } = await open(width, height, "/");
  await page.waitForTimeout(2500);
  await page.locator(".mobile-bottom-nav button").filter({ hasText: "Train" }).first().dispatchEvent("click");
  await page.waitForTimeout(1200);
  await page.locator(".workspace-top-switcher button").filter({ hasText: "Plan" }).first().dispatchEvent("click");
  await page.waitForTimeout(1200);
  await tap(page, page.locator(".day-action-add, button.day-exercise-open-catalog").first());
  const sheet = page.locator(".day-picker-sheet");
  await sheet.waitFor({ timeout: 15000 });
  await tap(page, sheet.getByRole("button", { name: "All catalog" }));
  const search = sheet.locator(".day-picker-tools input").first();
  for (const [query, expected, slug] of [["wrist curl", ["Cable Wrist Curl", "Behind-the-Back Wrist Curl"], "wrist-curl"], ["barbell hold", ["Barbell Hold"], "barbell-hold"], ["band index", ["Band Index and Little Finger Extension"], "band-index"]]) {
    await search.fill(query);
    await page.waitForTimeout(600);
    await page.evaluate(() => { const element = document.querySelector(".day-picker-sheet"); if (element) element.scrollTop = 0; });
    // Bring the new rows into view: the last of them in the middle of the screen.
    const row = sheet.locator(".day-picker-result", { hasText: expected[expected.length - 1] }).first();
    await row.scrollIntoViewIfNeeded();
    await row.evaluate((element) => element.scrollIntoView({ block: "center", behavior: "instant" }));
    await page.waitForTimeout(300);
    const name = `plan-picker-${slug}-${width}`;
    await page.screenshot({ path: shot(name) });
    const results = await sheet.locator(".day-picker-result strong").allInnerTexts();
    const rows = await Promise.all(expected.map(async (exercise) => {
      const result = sheet.locator(".day-picker-result", { hasText: exercise }).first();
      const found = await result.count();
      if (!found) return { exercise, found: false };
      const [open, add] = [await result.locator("button").first().boundingBox(), await result.locator("button").last().boundingBox()];
      return { exercise, found: true, line: (await result.locator("small").first().innerText()).trim(), position: results.indexOf(exercise) + 1, openButton: { width: round(open.width), height: round(open.height) }, addButton: { width: round(add.width), height: round(add.height), label: await result.locator("button").last().getAttribute("aria-label") } };
    }));
    record({ scene: "plan-picker", viewport: `${width}x${height}`, query, count: await sheet.locator(".day-picker-result-count").innerText(), firstResults: results.slice(0, 6), rows, searchFontPx: await search.evaluate((element) => getComputedStyle(element).fontSize), sweep: await sweep(page, [".day-picker-sheet"]), horizontalOverflowPx: await overflowX(page), file: `${name}.png` });
  }
  await context.close();
}

// ---------------------------------------------------------------- the new exercises on the forearm page

for (const [width, height] of sizes) {
  // The extensor indicis's sheet suggests 420, which trains it directly.
  {
    const { context, page } = await openForearm(width, height);
    await tap(page, page.locator("button.spz-row", { hasText: "Extensor indicis" }).first());
    const sheet = page.getByRole("dialog").first();
    await sheet.waitFor();
    await page.waitForTimeout(400);
    const name = `forearm-ei-sheet-420-${width}`;
    const line = await showLine(page, sheet, "Band Index and Little Finger Extension", name);
    record({ scene: "forearm-ei-sheet", viewport: `${width}x${height}`, suggests420: (await sheet.getByText("Band Index and Little Finger Extension").count()) > 0, line, sheet: (await textOf(sheet)).slice(0, 700), sweep: await sweep(page, ["[role='dialog']"]), horizontalOverflowPx: await overflowX(page), file: `${name}.png` });
    await context.close();
  }
  // Planned mode's wrist flexion sheet suggests 417 and 418.
  {
    const { context, page } = await openForearm(width, height, "&mode=planned");
    await tap(page, page.locator("details.spz-disclosure > summary", { hasText: "Targets" }).first());
    await tap(page, page.getByRole("button", { name: "Open Wrist flexion" }).first());
    const sheet = page.getByRole("dialog").first();
    await sheet.waitFor();
    await page.waitForTimeout(400);
    const name = `forearm-wrist-flexion-planned-${width}`;
    const line = await showLine(page, sheet, "Cable Wrist Curl", name);
    record({ scene: "forearm-wrist-flexion-planned", viewport: `${width}x${height}`, suggests417: (await sheet.getByText("Cable Wrist Curl").count()) > 0, suggests418: (await sheet.getByText("Behind-the-Back Wrist Curl").count()) > 0, line, sheet: (await textOf(sheet)).slice(0, 900), sweep: await sweep(page, ["[role='dialog']"]), horizontalOverflowPx: await overflowX(page), file: `${name}.png` });
    await context.close();
  }
  // The stack card: its plan adds 420 for the index and little finger extensors.
  {
    const { context, page } = await openForearm(width, height);
    await tap(page, page.locator("details.spz-stack > summary"));
    await page.locator(".spz-stack-total").waitFor({ timeout: 30000 });
    await page.waitForTimeout(500);
    const card = page.locator("details.spz-stack");
    const name = `forearm-stack-420-${width}`;
    const line = await showLine(page, card, "Band Index and Little Finger Extension", name);
    record({ scene: "forearm-stack", viewport: `${width}x${height}`, lists420: (await card.getByText("Band Index and Little Finger Extension").count()) > 0, line, card: (await textOf(card)).slice(0, 1200), sweep: await sweep(page, ["details.spz-stack"]), horizontalOverflowPx: await overflowX(page), file: `${name}.png` });
    await context.close();
  }
}

// ---------------------------------------------------------------- the thumb flexor's sheet: hangs and carries as incidental grip

for (const [width, height] of sizes) {
  const { context, page } = await openForearm(width, height);
  const row = page.locator("button.spz-row", { hasText: "Flexor pollicis longus" }).first();
  const rowText = (await row.getAttribute("aria-label")) ?? (await row.innerText());
  await tap(page, row);
  const sheet = page.getByRole("dialog").first();
  await sheet.waitFor();
  await page.waitForTimeout(400);
  // The sheet's counts (incidental grip or steadying), then its ledger.
  const top = `forearm-fpl-sheet-${width}`;
  await showLine(page, sheet, "Incidental grip or steadying", top);
  const ledger = `forearm-fpl-sheet-ledger-${width}`;
  const line = await showLine(page, sheet, "Where the numbers come from", ledger, "start");
  const text = await textOf(sheet);
  record({ scene: "forearm-fpl-sheet", viewport: `${width}x${height}`, row: rowText, incidental: /incidental grip/i.test(text), underReview: /under review/i.test(text), line, sheet: text.slice(0, 1200), sweep: await sweep(page, ["[role='dialog']"]), horizontalOverflowPx: await overflowX(page), sheetOverflowPx: await sheet.evaluate((element) => Math.max(0, element.scrollWidth - element.clientWidth)), files: [`${top}.png`, `${ledger}.png`] });
  await context.close();
}

// ---------------------------------------------------------------- How this is counted, naming forearm_mappings_v2

for (const [width, height] of sizes) {
  const { context, page } = await openForearm(width, height);
  const method = page.locator("#spz-method");
  const summary = method.locator("summary");
  await tap(page, summary);
  await page.waitForTimeout(400);
  await summary.scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const element = document.querySelector("#spz-method");
    const sticky = document.querySelector(".workspace-top-switcher-shell")?.getBoundingClientRect().bottom ?? 0;
    window.scrollBy({ top: element.getBoundingClientRect().top - (sticky + 12), behavior: "instant" });
  });
  await page.waitForTimeout(300);
  const head = `forearm-method-${width}`;
  await page.screenshot({ path: shot(head) });
  const notes = method.locator(".spz-method-notes");
  await notes.scrollIntoViewIfNeeded();
  // The notes' end (v2's sentences) just above the bottom dock.
  await notes.evaluate((element) => {
    const dockTop = document.querySelector(".mobile-workspace-dock")?.getBoundingClientRect().top ?? window.innerHeight;
    window.scrollBy({ top: element.getBoundingClientRect().bottom - (dockTop - 16), behavior: "instant" });
  });
  await page.waitForTimeout(300);
  const notesName = `forearm-method-notes-${width}`;
  await page.screenshot({ path: shot(notesName) });
  const summaryBox = await summary.boundingBox();
  record({ scene: "forearm-method", viewport: `${width}x${height}`, summary: (await summary.innerText()).replace(/\n+/g, " · "), summaryHeight: round(summaryBox.height), namesV2: /forearm_mappings_v2/.test(await summary.innerText()), notes: await notes.innerText(), horizontalOverflowPx: await overflowX(page), files: [`${head}.png`, `${notesName}.png`] });
  await context.close();
}

await browser.close();
server.close();
checks.kept = [...keep].sort().map((name) => `${name}.png`);
writeFileSync(join(here, "checks.json"), `${JSON.stringify(checks, null, 2)}\n`);
