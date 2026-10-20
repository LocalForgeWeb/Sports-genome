/**
 * Phone evidence for the page lane of wave 0 (docs/specialization-atlas/10-multi-region.md §9.2,
 * §6.1–§6.3), 20 Oct 2026.
 *
 * Headless Chromium emulating an iPhone (viewport, isMobile, hasTouch, deviceScaleFactor 3): not
 * an iPhone, not Safari. Two builds, each served by a small static server here, device stores
 * seeded:
 *
 * - the production client build (`npx vite build`), forearm only: the first screen in every state
 *   09-page.md tabulates, the inline dates, and the heading as plain text with one region;
 * - a scratch build with the test regions given pages (`fixture-build.mjs`, never committed and
 *   never in dist/public): the heading row as the region toggle and the grid of regions, a pick,
 *   a midline region, and another region's muscle linking to its home.
 *
 *   npx vite build --outDir <prod> && node fixture-build.mjs <fixture>
 *   node docs/specialization-atlas/evidence/page-wave0-2026-10-20/capture.mjs <prod> <fixture>
 *
 * Writes the screenshots kept and checks.json next to this file (others to the system temp
 * folder). Dates are relative to the day it runs (this week's workouts on Monday and Tuesday), UTC.
 */
import { createReadStream, existsSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { createServer } from "node:http";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const [prodDir, fixtureDir] = process.argv.slice(2).map((dir) => resolve(dir));
for (const dir of [prodDir, fixtureDir]) if (!dir || !existsSync(join(dir, "index.html"))) throw new Error("Usage: capture.mjs <production build> <fixture build>");

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".json": "application/json", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json" };
const serve = async (publicDir) => {
  const server = createServer((request, response) => {
    const path = decodeURIComponent(new URL(request.url, "http://x").pathname);
    let file = join(publicDir, path);
    if (!file.startsWith(publicDir) || !existsSync(file) || statSync(file).isDirectory()) file = join(publicDir, "index.html");
    response.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
    createReadStream(file).pipe(response);
  });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  return { server, base: `http://127.0.0.1:${server.address().port}` };
};
const prod = await serve(prodDir);
const fixture = await serve(fixtureDir);

// ---------------------------------------------------------------- the athlete's records

const DAY = 86_400_000;
const todayKey = new Date().toISOString().slice(0, 10);
const mondayMs = (() => { const d = new Date(`${todayKey}T00:00:00Z`); return d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY; })();
const at = (dayOffset, hour) => new Date(mondayMs + dayOffset * DAY + hour * 3_600_000).toISOString();
const set = (weight, reps, extra = {}) => ({ weight: String(weight), reps: String(reps), unit: "lb", completed: true, ...extra });
const hold = (seconds, extra = {}) => ({ weight: "", reps: "", holdSeconds: String(seconds), unit: "lb", completed: true, ...extra });
const workout = (id, dayOffset, label, exercises) => ({ id, title: label, dayLabel: `Week 1 · ${label}`, startedAt: at(dayOffset, 17), completedAt: at(dayOffset, 18), status: "completed", exercises });
const ex = (id, catalogId, exerciseName, sets) => ({ id, exerciseName, catalogId, plannedPrescription: `${sets.length} × 12`, sets });
/** The forearm week of the earlier evidence (page-final-2026-10-17), and work the test regions count: squats, a single-leg RDL, a row, a carry, sit-ups. */
const sessions = [
  workout("s1", 0, "Day 02 · Pull", [
    ex("e1", 132, "Hammer Curl", [set(30, 12), set(30, 12), set(30, 10)]),
    ex("e2", 139, "Wrist Curl", [set(60, 15), set(60, 15), set(60, 14), set(60, 12)]),
    ex("e5", 46, "Dumbbell Row", [set(60, 10, { side: "right" }), set(60, 10, { side: "left" })]),
    ex("e6", 409, "Suitcase Carry", [hold(40, { side: "left" })]),
  ]),
  workout("s2", 1, "Day 04 · Upper", [
    ex("e3", 140, "Reverse Wrist Curl", [set(30, 15), set(30, 15), set(30, 12)]),
    ex("e4", 139, "Wrist Curl", [set(60, 15), set(60, 15), set(60, 15), set(60, 12)]),
    ex("e7", 161, "Back Squat", [set(185, 8), set(185, 8)]),
    ex("e8", 188, "Single-Leg Romanian Deadlift", [set(40, 10, { legSide: "left" })]),
    ex("e9", 241, "Decline Sit-Up", [set(0, 15)]),
  ]),
];
const goal = (id, regionId, nodeId, side, target) => ({ id, regionId, nodeId, actionId: null, side, metric: "direct_dynamic_bouts", target, period: "calendar_week", startsOn: new Date(mondayMs - 7 * DAY).toISOString().slice(0, 10), endsOn: null, timezone: "UTC", createdAt: at(-7, 8), updatedAt: at(-7, 8) });
const fcuTarget = [goal("t2", "forearm", "forearm.fcu", "right", 6)];
const gridTargets = [goal("t1", "forearm", "forearm.fcu", "left", 6), goal("t2", "forearm", "forearm.fcu", "right", 6), goal("t3", "fx_thigh", "fx_thigh.quads", "right", 8)];
const entries = (ids) => ids.map((id) => ({ entryId: id, catalogExerciseId: id }));
const planWeek = { customWorkoutIds: [], weeklyPlanIds: {}, weeklyPlanEntries: { "0-Upper": entries([1, 45, 132]), "1-Lower": entries([167]), "2-Upper": entries([3, 139, 140]), "3-Lower": entries([168]) }, prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: {}, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 0 };
const plan = { version: 2, ...planWeek, weeks: { "1": planWeek }, activeWeek: 1 };
const custom = `&window=custom&from=${new Date(mondayMs - 6 * DAY).toISOString().slice(0, 10)}&to=${todayKey}`;

// ---------------------------------------------------------------- the browser

const browser = await chromium.launch();
const checks = {
  note: `Headless Chromium emulating an iPhone (viewport, isMobile, hasTouch, deviceScaleFactor 3); not an iPhone, not Safari. Production build served for the forearm scenes; a scratch build with the test regions given pages (fixture-build.mjs, never committed) for the heading-row and grid scenes. Device stores seeded (this week: Hammer Curl x3, Wrist Curl x4, Dumbbell Row one per arm, Suitcase Carry in the left hand on Monday; Reverse Wrist Curl x3, Wrist Curl x4, Back Squat x2, Single-Leg Romanian Deadlift on the left leg, Decline Sit-Up on Tuesday; a 4-day Upper/Lower plan). Run on ${todayKey}, UTC. Page coordinates are CSS px from the top of the screen.`,
  scenes: [],
};
const keep = new Set();
const shot = (name) => (keep.add(name), join(here, `${name}.png`));
const scratchShot = (name) => join(tmpdir(), `${name}.png`);
const record = (entry) => { checks.scenes.push(entry); console.log(JSON.stringify(entry)); };
const round = (value) => Math.round(value * 10) / 10;

async function open(base, width, height, { query = "", goals = [], origin = null, region = "forearm", remembered = null } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, timezoneId: "UTC", locale: "en-US" });
  const page = await context.newPage();
  await page.route("**/api/trpc/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(new URL(route.request().url()).searchParams.get("batch") ? [{ result: { data: { json: null } } }] : { result: { data: { json: null } } }) }));
  // Opened from another page: the origin rides in history.state, as Home pushes it, so the page shows Back.
  if (origin) await page.addInitScript((from) => { window.history.replaceState({ workspace: "specialization", specializationOrigin: from }, "", window.location.href); }, origin);
  await page.addInitScript((seed) => {
    if (sessionStorage.getItem("wave0-seeded")) return;
    sessionStorage.setItem("wave0-seeded", "1");
    localStorage.setItem("sports-genome-launch-experience-enabled-v1", "off");
    localStorage.setItem("gym-optimizer-athlete-profile-v1", JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Muscle growth", trainingDays: 4, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb", sexForReference: "male", birthYear: 1995, bodyWeight: 180 } }));
    localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(seed.sessions));
    localStorage.setItem("gym-optimizer-workout-plan-v1", JSON.stringify(seed.plan));
    localStorage.setItem("sports-genome-specialization-goals-v1", JSON.stringify(seed.goals));
    if (seed.remembered) localStorage.setItem("sports-genome-specialization-region-v1", seed.remembered);
  }, { sessions, plan, goals, remembered });
  await page.goto(`${base}/?workspace=specialization${region ? `&region=${region}` : ""}${query}`);
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
const active = (page) => page.evaluate(() => { const element = document.activeElement; return element ? { tag: element.tagName, className: element.className || null, text: (element.getAttribute("aria-label") || element.textContent || "").trim().slice(0, 80) } : null; });
const overflowX = (page) => page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth));
/** Every visible control under 44 × 44 px inside the scopes (the drawing's tap squares are the drawing lane's). */
const smallControls = (page, selectors) => page.evaluate((scopes) => scopes.flatMap((selector) => Array.from(document.querySelectorAll(selector)).flatMap((scope) => Array.from(scope.querySelectorAll("button, summary, a[href], [role='button'], input:not([type=radio]):not([type=checkbox]), select"))))
  .filter((element) => !element.closest(".spz-diagram-svg, .sr-only, [hidden]") && element.getClientRects().length > 0)
  .map((element) => ({ element, box: element.getBoundingClientRect() }))
  .filter(({ box }) => box.width > 0 && (box.width < 43.5 || box.height < 43.5))
  .map(({ element, box }) => ({ text: (element.getAttribute("aria-label") || element.textContent || "").trim().slice(0, 60), width: round(box.width), height: round(box.height) }))
  .filter((item, index, all) => all.findIndex((other) => other.text === item.text && other.width === item.width) === index), selectors).then((list) => list);
const controlsChecked = (page, selectors) => page.evaluate((scopes) => scopes.reduce((count, selector) => count + Array.from(document.querySelectorAll(selector)).reduce((sum, scope) => sum + Array.from(scope.querySelectorAll("button, summary, a[href], input:not([type=radio]):not([type=checkbox]), select")).filter((element) => !element.closest(".spz-diagram-svg, .sr-only, [hidden]") && element.getClientRects().length > 0).length, 0), 0), selectors);

// ---------------------------------------------------------------- the first screen, forearm only (the table in 09-page.md)

const firstScreen = (page) => page.evaluate(() => {
  const box = (selector) => { const element = document.querySelector(selector); return element ? element.getBoundingClientRect() : null; };
  const bar = box(".mobile-workspace-dock");
  const strip = box(".spz-strip");
  const drawing = box(".spz-diagram-svg");
  const heading = document.querySelector("#spz-heading");
  const barTop = bar ? bar.top : window.innerHeight;
  return {
    heading: heading.textContent, headingIsToggle: Boolean(heading.querySelector("button")), headingLines: Math.round(heading.getBoundingClientRect().height / parseFloat(getComputedStyle(heading).lineHeight || "1")),
    back: document.querySelector(".spz-back")?.textContent ?? null,
    dockTop: Math.round(barTop), stripTop: Math.round(strip.top), stripBottom: Math.round(strip.bottom), drawingTop: Math.round(drawing.top),
    drawingOnFirstScreenPx: Math.round(barTop - drawing.top), stripPastDockPx: Math.max(0, Math.round(strip.bottom - barTop)), stripWhole: strip.bottom <= barTop,
    horizontalOverflowPx: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
  };
});
const states = [
  ["FCU selected", "&node=forearm.fcu", [], null],
  ["with a target", "&node=forearm.fcu", fcuTarget, null],
  ["Custom dates", `&node=forearm.fcu${custom}`, [], null],
  ["Custom dates and a target", `&node=forearm.fcu${custom}`, fcuTarget, null],
  ["Back", "&node=forearm.fcu", [], "body"],
  ["Back and a target", "&node=forearm.fcu", fcuTarget, "body"],
  ["Back and Custom dates", `&node=forearm.fcu${custom}`, [], "body"],
  ["Back, Custom dates and a target", `&node=forearm.fcu${custom}`, fcuTarget, "body"],
];
const keptFirst = { "FCU selected": "first-screen-fcu", "Back, Custom dates and a target": "first-screen-back-custom-target" };
for (const [width, height] of [[390, 844], [375, 667], [430, 932]]) {
  for (const [state, query, goals, origin] of states) {
    const { context, page } = await open(prod.base, width, height, { query, goals, origin });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    const file = keptFirst[state] ? `${keptFirst[state]}-${width}` : null;
    await page.screenshot({ path: file ? shot(file) : scratchShot(`first-${state}-${width}`) });
    const touch = await smallControls(page, [".spz-head-wrap", ".spz-top", ".spz-map"]);
    record({ scene: "first-screen", build: "production", state, viewport: `${width}x${height}`, ...(await firstScreen(page)), controlsUnder44px: touch, ...(file ? { file: `${file}.png` } : {}) });
    await context.close();
  }
}
{
  const { context, page } = await open(prod.base, 320, 568, { query: `&node=forearm.fcu${custom}`, goals: fcuTarget, origin: "body" });
  await page.screenshot({ path: shot("first-screen-back-custom-target-320") });
  record({ scene: "first-screen", build: "production", state: "Back, Custom dates and a target", viewport: "320x568", ...(await firstScreen(page)), controlsUnder44px: await smallControls(page, [".spz-head-wrap", ".spz-top", ".spz-map"]), file: "first-screen-back-custom-target-320.png" });
  await context.close();
}

// ---------------------------------------------------------------- the inline dates (the first checkpoint)

for (const [width, height] of [[320, 568], [375, 667], [390, 844], [430, 932]]) {
  const { context, page } = await open(prod.base, width, height, { query: `&node=forearm.fcu${custom}` });
  const fields = await page.evaluate(() => Array.from(document.querySelectorAll(".spz-dates .spz-field")).map((field) => {
    const input = field.querySelector("input");
    const label = field.querySelector("span");
    const style = getComputedStyle(input);
    const canvas = document.createElement("canvas").getContext("2d");
    canvas.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const [y, m, d] = input.value.split("-");
    const box = input.getBoundingClientRect();
    const content = input.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    return { label: label.textContent, input: [Math.round(box.width * 10) / 10, Math.round(box.height * 10) / 10], fontSize: style.fontSize, contentWidth: Math.round(content * 10) / 10, dateTextWidth: Math.round(canvas.measureText(`${m}/${d}/${y}`).width * 10) / 10, top: Math.round(field.getBoundingClientRect().top) };
  }));
  const dates = await page.locator(".spz-dates").boundingBox();
  await page.screenshot({ path: shot(`dates-${width}`), clip: { x: 0, y: dates.y - 8, width, height: dates.height + 16 } });
  record({ scene: "inline-dates", build: "production", viewport: `${width}x${height}`, rows: new Set(fields.map((field) => field.top)).size, wholeDateShown: fields.every((field) => field.contentWidth >= field.dateTextWidth), fields, horizontalOverflowPx: await overflowX(page), file: `dates-${width}.png` });
  await context.close();
}

// ---------------------------------------------------------------- the heading row and the region grid (fixture build)

/**
 * The toggle's border against the blue it sits on, as drawn: the page's background is a gradient
 * image, so the colour behind the toggle is read from the screenshot (decoded in the page), just
 * right of the toggle and just above it, and the lower of the two ratios is kept.
 */
const contrast = async (page) => {
  const toggle = page.locator(".spz-region-toggle");
  const box = await toggle.boundingBox();
  const border = await toggle.evaluate((element) => getComputedStyle(element).borderTopColor);
  const clip = { x: Math.max(0, box.x - 4), y: Math.max(0, box.y - 8), width: Math.min(box.width + 16, page.viewportSize().width - Math.max(0, box.x - 4)), height: box.height + 8 };
  const png = (await page.screenshot({ clip })).toString("base64");
  return page.evaluate(async ({ data, border: borderColour, box: b, clip: c }) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width; canvas.height = image.height;
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0);
    const scale = image.width / c.width;
    const at = (x, y) => Array.from(context.getImageData(Math.round((x - c.x) * scale), Math.round((y - c.y) * scale), 1, 1).data).slice(0, 3);
    const luminance = ([r, g, bl]) => { const channel = (v) => { const k = v / 255; return k <= 0.03928 ? k / 12.92 : ((k + 0.055) / 1.055) ** 2.4; }; return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(bl); };
    const ratio = (one, two) => { const [x, y] = [luminance(one), luminance(two)]; return Math.round(((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)) * 100) / 100; };
    const ink = (borderColour.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
    const right = at(Math.min(b.x + b.width + 8, c.x + c.width - 1), b.y + b.height / 2);
    const above = at(b.x + b.width / 2, b.y - 4);
    return { border: borderColour, behind: { right: `rgb(${right.join(", ")})`, above: `rgb(${above.join(", ")})` }, ratio: Math.min(ratio(ink, right), ratio(ink, above)) };
  }, { data: png, border, box, clip });
};
const gridCells = (page) => page.evaluate(() => Array.from(document.querySelectorAll("#spz-regions .spz-region")).map((cell) => {
  const box = cell.getBoundingClientRect();
  const label = cell.querySelector("span");
  const small = cell.querySelector("small");
  return { label: label.textContent, targets: small?.textContent ?? null, pressed: cell.getAttribute("aria-pressed"), width: Math.round(box.width * 10) / 10, height: Math.round(box.height * 10) / 10, labelFont: getComputedStyle(label).fontSize, targetsFont: small ? getComputedStyle(small).fontSize : null, row: Math.round(box.top) };
}));
for (const [width, height] of [[320, 568], [375, 667], [390, 844], [430, 932]]) {
  for (const origin of [null, "body"]) {
    const { context, page } = await open(fixture.base, width, height, { goals: gridTargets, origin });
    const toggle = page.locator(".spz-region-toggle");
    const toggleBox = await toggle.boundingBox();
    const head = await page.locator(".spz-head").boundingBox();
    const name = `heading-row${origin ? "-back" : ""}-${width}`;
    await page.screenshot({ path: (width === 320 || width === 390 || origin) ? shot(name) : scratchShot(name), clip: { x: 0, y: 0, width, height: Math.min(height, head.y + head.height + 140) } });
    await tap(page, toggle);
    const cells = await gridCells(page);
    const grid = await page.locator("#spz-regions").boundingBox();
    const gridName = `region-grid${origin ? "-back" : ""}-${width}`;
    await page.screenshot({ path: origin ? scratchShot(gridName) : shot(gridName), clip: { x: 0, y: 0, width, height: Math.min(height, grid.y + grid.height + 120) } });
    record({
      scene: "heading-row-and-grid", build: "fixture", viewport: `${width}x${height}`, back: origin ? await page.locator(".spz-back").textContent() : null,
      head: { top: round(head.y), height: round(head.height) }, toggle: { label: await toggle.textContent(), width: round(toggleBox.width), height: round(toggleBox.height), expanded: await toggle.getAttribute("aria-expanded"), border: await contrast(page) },
      grid: { top: round(grid.y), height: round(grid.height), columns: new Set(cells.map((cell) => cell.row)).size ? Math.max(...Object.values(cells.reduce((rows, cell) => ({ ...rows, [cell.row]: (rows[cell.row] ?? 0) + 1 }), {}))) : 0, rows: new Set(cells.map((cell) => cell.row)).size },
      cells, controlsUnder44px: await smallControls(page, [".spz-head-wrap"]), controlsChecked: await controlsChecked(page, [".spz-head-wrap"]), horizontalOverflowPx: await overflowX(page),
      files: [`${name}.png`, `${gridName}.png`].filter((file) => keep.has(file.replace(/\.png$/, ""))),
    });
    await context.close();
  }
}

// A pick: the grid closes, focus stays on the toggle, the count is said; then the midline core.
for (const [width, height] of [[390, 844], [375, 667], [320, 568]]) {
  const { context, page } = await open(fixture.base, width, height, { goals: gridTargets });
  await tap(page, page.locator(".spz-region-toggle"));
  await tap(page, page.locator("#spz-regions .spz-region", { hasText: "Fixture thighs" }));
  await page.locator(".spz-row").first().waitFor();
  await page.waitForTimeout(400);
  const after = { address: await page.evaluate(() => window.location.search), gridHidden: await page.locator("#spz-regions").evaluate((element) => element.hidden), focus: await active(page), said: await page.locator(".spz-page > [aria-live='polite']").textContent(), heading: await page.locator(".spz-region-toggle").textContent(), sideGroup: await page.locator(".spz-top [role='group'][aria-label='Leg']").count() };
  const name = `picked-thighs-${width}`;
  await page.screenshot({ path: width === 390 ? shot(name) : scratchShot(name) });
  await tap(page, page.locator(".spz-region-toggle"));
  await tap(page, page.locator("#spz-regions .spz-region", { hasText: "Fixture core" }));
  await page.locator(".spz-row").first().waitFor();
  await page.waitForTimeout(400);
  const core = { address: await page.evaluate(() => window.location.search), sideGroups: await page.locator(".spz-top [role='group'][aria-label='Arm'], .spz-top [role='group'][aria-label='Side'], .spz-top [role='group'][aria-label='Leg']").count(), regionLine: (await page.locator(".spz-strip").innerText()).replace(/\n/g, " ").slice(0, 160) };
  const coreName = `midline-core-${width}`;
  await page.screenshot({ path: width === 390 ? shot(coreName) : scratchShot(coreName) });
  record({ scene: "pick-and-midline", build: "fixture", viewport: `${width}x${height}`, afterPick: after, core, controlsUnder44px: await smallControls(page, [".spz-head-wrap", ".spz-top"]), horizontalOverflowPx: await overflowX(page), files: width === 390 ? [`${name}.png`, `${coreName}.png`] : [] });
  await context.close();
}

// Another region's muscle: the back lists the shoulder's rear deltoid, and its sheet opens the shoulder's page.
for (const [width, height] of [[390, 844], [375, 667]]) {
  const { context, page } = await open(fixture.base, width, height, { region: "fx_back" });
  await tap(page, page.locator("button.spz-row", { hasText: "Fixture rear deltoid" }));
  const sheet = page.getByRole("dialog").first();
  await sheet.waitFor();
  const link = sheet.getByRole("button", { name: "Open the fixture shoulders page" });
  await link.scrollIntoViewIfNeeded();
  const linkBox = await link.boundingBox();
  const name = `external-home-${width}`;
  await page.screenshot({ path: width === 390 ? shot(name) : scratchShot(name) });
  const sheetSmall = await smallControls(page, ["[role='dialog']"]);
  await tap(page, link);
  await page.locator(".spz-row").first().waitFor();
  await page.waitForTimeout(400);
  record({ scene: "external-home", build: "fixture", viewport: `${width}x${height}`, link: { width: round(linkBox.width), height: round(linkBox.height) }, sheetControlsUnder44px: sheetSmall, afterOpen: { address: await page.evaluate(() => window.location.search), heading: await page.locator(".spz-region-toggle").textContent(), focus: await active(page), said: await page.locator(".spz-page > [aria-live='polite']").textContent() }, files: width === 390 ? [`${name}.png`] : [] });
  await context.close();
}

// The page opened with no region named and none remembered: the forearm, with the grid open once.
{
  const { context, page } = await open(fixture.base, 390, 844, { region: null });
  await page.waitForTimeout(300);
  record({ scene: "first-open-chooses", build: "fixture", viewport: "390x844", address: await page.evaluate(() => window.location.search), expanded: await page.locator(".spz-region-toggle").getAttribute("aria-expanded") });
  await context.close();
}

await browser.close();
prod.server.close();
fixture.server.close();
checks.kept = [...keep].sort().map((name) => `${name}.png`);
writeFileSync(join(here, "checks.json"), `${JSON.stringify(checks, null, 2)}\n`);
