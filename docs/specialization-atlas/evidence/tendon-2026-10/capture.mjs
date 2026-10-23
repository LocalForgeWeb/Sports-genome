/**
 * Phone evidence for tendon exposure (docs/specialization-atlas/11-forearm-research-and-stack.md
 * §4.3, §7.5; lane T3), 23 Oct 2026.
 *
 * Headless Chromium emulating an iPhone (viewport, isMobile, hasTouch, deviceScaleFactor 3, en-US,
 * UTC, SwiftShader WebGL): not an iPhone, not Safari. Two production builds, each served by a small
 * static server here, device stores seeded as stack-2026-10/capture.mjs seeds them (its plan A, with a
 * Reverse Wrist Curl written "3 × 10–25" on Day 01), and five weeks of forearm work so last week is
 * above every earlier week at the outer elbow:
 *
 *   npx vite build --outDir <before>     (at d322439, before this lane)
 *   npx vite build --outDir <after>      (this lane)
 *   node docs/specialization-atlas/evidence/tendon-2026-10/capture.mjs <before> <after>
 *
 * Writes the screenshots it keeps (PNG; reduced to 256 colours afterwards with Pillow) and checks.json
 * next to this file. Scenes: the page's download
 * before and after (09-page.md's method: open Muscles, tap Specialize, every .js file until the map is
 * drawn), with each file's gzip size read from the build; the section closed; open on the outer elbow;
 * the change line and its prompt; the planned rows, Move's day chips and the Undo line; the rolling
 * window's eight columns; Planned mode; the muscle sheet's and the 3D panel's "Attaches at" line and
 * where its link lands; 320 with no sideways scroll; the 44 px sweep and the faint-control check over
 * the section, the line and the sheets the section opens.
 */
import { createReadStream, existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { createServer } from "node:http";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
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
  return { server, base: `http://127.0.0.1:${server.address().port}`, dir: publicDir };
};
const builds = { before: await serve(beforeDir), after: await serve(afterDir) };

// ---------------------------------------------------------------- the athlete's records

const DAY = 86_400_000;
const todayKey = new Date().toISOString().slice(0, 10);
const mondayMs = (() => { const d = new Date(`${todayKey}T00:00:00Z`); return d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY; })();
const at = (dayOffset, hour) => new Date(mondayMs + dayOffset * DAY + hour * 3_600_000).toISOString();
const set = (weight, reps, extra = {}) => ({ weight: String(weight), reps: String(reps), unit: "lb", completed: true, ...extra });
const workout = (id, dayOffset, label, exercises) => ({ id, title: label, dayLabel: `Week 1 · ${label}`, startedAt: at(dayOffset, 17), completedAt: at(dayOffset, 18), status: "completed", exercises });
const ex = (id, catalogId, exerciseName, count, extra = {}) => ({ id, exerciseName, catalogId, plannedPrescription: `${count} × 12`, sets: Array.from({ length: count }, () => set(30, 12, extra)) });
/** Four earlier weeks of reverse wrist curls (2, 2, 1, 2 sets), a heavier last week (9 at the outer elbow), and this week's work. */
const sessions = [
  workout("w-35", -33, "Day 01 · Push", [ex("a", 140, "Reverse Wrist Curl", 2), ex("a2", 139, "Wrist Curl", 2)]),
  workout("w-28", -26, "Day 01 · Push", [ex("b", 140, "Reverse Wrist Curl", 2), ex("b2", 139, "Wrist Curl", 2)]),
  workout("w-21", -19, "Day 01 · Push", [ex("c", 140, "Reverse Wrist Curl", 1), ex("c2", 139, "Wrist Curl", 3)]),
  workout("w-14", -12, "Day 01 · Push", [ex("d", 140, "Reverse Wrist Curl", 2), ex("d2", 139, "Wrist Curl", 2)]),
  workout("w-7a", -7, "Day 01 · Push", [ex("e", 140, "Reverse Wrist Curl", 3), ex("e2", 132, "Hammer Curl", 3)]),
  workout("w-7b", -5, "Day 02 · Pull", [ex("f", 140, "Reverse Wrist Curl", 3), { id: "f2", exerciseName: "Dead Hang", catalogId: 143, plannedPrescription: "2 × 40 sec", sets: [set("", "", { holdSeconds: "40" }), set("", "", { holdSeconds: "35" })] }]),
  workout("s1", 0, "Day 02 · Pull", [ex("g", 132, "Hammer Curl", 3), ex("g2", 139, "Wrist Curl", 3)]),
  workout("s2", 1, "Day 01 · Push", [ex("h", 140, "Reverse Wrist Curl", 3)]),
];
const entries = (ids) => ids.map((id) => ({ entryId: id, catalogExerciseId: id }));
/** Plan A (stack-2026-10/capture.mjs) with a Reverse Wrist Curl on Day 01, written "3 × 10–25". */
const week = {
  customWorkoutIds: [], weeklyPlanIds: {},
  weeklyPlanEntries: { "0-Push": entries([161, 1, 43, 140]), "1-Pull": entries([41, 4, 66, 111, 121]), "2-Legs": entries([173, 2, 54, 186, 132]) },
  prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: { "0-Push": { 140: "3 × 10–25" } }, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 0,
};
const plan = { version: 2, ...week, weeks: { "1": week }, activeWeek: 1 };

// ---------------------------------------------------------------- the browser

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const checks = {
  note: `Headless Chromium emulating an iPhone (viewport, isMobile, hasTouch, deviceScaleFactor 3, en-US, UTC, SwiftShader WebGL); not an iPhone, not Safari. Production builds: before = d322439 (before lane T3), after = this lane. Device stores seeded: plan A (3 days, 60 min, Muscle growth) with a Reverse Wrist Curl written "3 × 10–25" on Day 01, as Home stores it; reverse wrist curls in each of the four weeks before last (2, 2, 1 and 2 sets), 6 and 3 hammer curls last week, and this week's hammer curls, wrist curls and reverse wrist curls. Run on ${todayKey}, UTC. Coordinates are CSS px from the top of the screen.`,
  scenes: [],
};
const kept = new Set();
const shot = (name) => (kept.add(`${name}.png`), join(here, `${name}.png`));
const scratch = (name) => join(tmpdir(), `tendon-${name}.png`);
const record = (entry) => { checks.scenes.push(entry); console.log(JSON.stringify(entry)); };
async function snap(page, path) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try { await page.screenshot({ path, timeout: 90000 }); return; } catch (error) { if (attempt === 2) throw error; await page.waitForTimeout(1000); }
  }
}

async function open(build, width, height, path = "/?workspace=specialization&region=forearm&fig=drawing") {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, timezoneId: "UTC", locale: "en-US" });
  const page = await context.newPage();
  await page.route("**/api/trpc/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(new URL(route.request().url()).searchParams.get("batch") ? [{ result: { data: { json: null } } }] : { result: { data: { json: null } } }) }));
  await page.addInitScript((seed) => {
    if (sessionStorage.getItem("tendon-seeded")) return;
    sessionStorage.setItem("tendon-seeded", "1");
    localStorage.setItem("sports-genome-launch-experience-enabled-v1", "off");
    localStorage.setItem("gym-optimizer-athlete-profile-v1", JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Muscle growth", trainingDays: 3, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb", sexForReference: "male", birthYear: 1995, bodyWeight: 180 } }));
    localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(seed.sessions));
    localStorage.setItem("gym-optimizer-workout-plan-v1", JSON.stringify(seed.plan));
  }, { sessions, plan });
  await page.goto(`${builds[build].base}${path}`);
  return { context, page };
}
async function pageReady(page, figure = "drawing") {
  await page.locator(".spz-page").waitFor({ timeout: 30000 });
  await page.locator(".spz-row").first().waitFor({ timeout: 30000 });
  if (figure === "model") await page.locator(".sg-anatomy3d-stage[data-status='ready'], .sg-anatomy3d-stage[data-status='error']").first().waitFor({ timeout: 60000 }).catch(() => {});
  else await page.locator(".spz-diagram svg").first().waitFor({ timeout: 30000 });
  await page.waitForTimeout(800);
}
const tap = async (page, locator) => {
  await locator.evaluate((element) => element.scrollIntoView({ block: "center", behavior: "instant" }));
  await page.waitForTimeout(150);
  const box = await locator.boundingBox();
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(350);
  return box;
};
const overflowX = (page) => page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth));
/** Every visible control under 44 × 44 px inside the scopes. */
const smallControls = (page, selectors) => page.evaluate((scopes) => scopes.flatMap((selector) => Array.from(document.querySelectorAll(selector)).flatMap((scope) => Array.from(scope.querySelectorAll("button, summary, a[href], [role='button'], input:not([type=radio]):not([type=checkbox]), select"))))
  .filter((element) => !element.closest(".sr-only, [hidden]") && element.getClientRects().length > 0)
  .map((element) => ({ element, box: element.getBoundingClientRect() }))
  .filter(({ box }) => box.width > 0 && (box.width < 43.5 || box.height < 43.5))
  .map(({ element, box }) => ({ text: (element.getAttribute("aria-label") || element.textContent || "").trim().slice(0, 60), width: Math.round(box.width * 10) / 10, height: Math.round(box.height * 10) / 10 })), selectors);
const controlsChecked = (page, selectors) => page.evaluate((scopes) => scopes.reduce((count, selector) => count + Array.from(document.querySelectorAll(selector)).reduce((sum, scope) => sum + Array.from(scope.querySelectorAll("button, summary, a[href], input:not([type=radio]):not([type=checkbox]), select")).filter((element) => !element.closest(".sr-only, [hidden]") && element.getClientRects().length > 0).length, 0), 0), selectors);
/** Controls that are faint at rest: below full opacity, or with no border and no fill (an outline or a fill is required; a link is underlined or arrowed text). */
const faintControls = (page, selector) => page.evaluate((scope) => Array.from(document.querySelectorAll(`${scope} button, ${scope} input`)).filter((element) => element.getClientRects().length > 0 && !element.closest(".sr-only")).map((element) => {
  const style = getComputedStyle(element);
  let opacity = 1;
  for (let node = element; node; node = node.parentElement) opacity *= Number(getComputedStyle(node).opacity);
  const outlined = parseFloat(style.borderTopWidth) > 0 && style.borderTopStyle !== "none";
  const filled = style.backgroundColor !== "rgba(0, 0, 0, 0)" && style.backgroundColor !== "transparent";
  const link = element.classList.contains("spz-link") || element.classList.contains("spz-tendon-group");
  return { text: (element.getAttribute("aria-label") || element.textContent || "").trim().slice(0, 50), opacity: Math.round(opacity * 100) / 100, outlined, filled, link };
}).filter((item) => item.opacity < 1 || (!item.outlined && !item.filled && !item.link)), selector);
async function underSticky(page, selector) {
  await page.evaluate((target) => {
    const element = document.querySelector(target);
    const sticky = document.querySelector(".workspace-top-switcher-shell")?.getBoundingClientRect().bottom ?? 0;
    window.scrollBy({ top: element.getBoundingClientRect().top - (sticky + 12), behavior: "instant" });
  }, selector);
  await page.waitForTimeout(300);
}
const rect = (page, selector) => page.evaluate((target) => { const box = document.querySelector(target)?.getBoundingClientRect(); return box ? { top: Math.round(box.top), bottom: Math.round(box.bottom), height: Math.round(box.height) } : null; }, selector);
const bars = (page) => page.evaluate(() => {
  const box = (selector) => { const element = document.querySelector(selector); const r = element?.getBoundingClientRect(); return r && r.height > 0 ? r : null; };
  return { dockTop: Math.round(box(".mobile-workspace-dock")?.top ?? window.innerHeight), stickyBottom: Math.round(box(".workspace-top-switcher-shell")?.bottom ?? 0) };
});
async function openSection(page) {
  await tap(page, page.locator("#spz-tendon > summary"));
  await page.locator(".spz-tendon-areas").waitFor({ timeout: 30000 });
  await page.waitForTimeout(500);
}
const areaButton = (page, name) => page.locator(".spz-tendon-area", { hasText: new RegExp(`^${name}\\s·\\s`) });

// ---------------------------------------------------------------- the download (09-page.md's method)

async function download(build) {
  const { context, page } = await open(build, 390, 844, "/?workspace=body");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
  const files = [];
  let counting = true;
  page.on("response", async (response) => {
    const url = response.url();
    if (!counting || !url.endsWith(".js")) return;
    const file = url.split("/").pop();
    const body = readFileSync(join(builds[build].dir, decodeURIComponent(new URL(url).pathname)));
    files.push({ file, bytes: body.length, gzip: gzipSync(body, { level: 9 }).length });
  });
  const tabs = page.getByRole("navigation", { name: "Body Lab workspace pages" });
  await tap(page, tabs.getByRole("button", { name: "Specialize" }));
  await pageReady(page, "model");
  counting = false;
  const tendonFiles = files.filter((item) => /tendon/i.test(item.file));
  await context.close();
  const total = files.reduce((sum, item) => sum + item.bytes, 0);
  const gzip = files.reduce((sum, item) => sum + item.gzip, 0);
  return { build, files: files.sort((a, b) => b.bytes - a.bytes), total, gzip, tendonFilesFetched: tendonFiles };
}
const downloads = { before: await download("before"), after: await download("after") };
const byName = (list) => new Map(list.files.map((item) => [item.file.replace(/-[A-Za-z0-9_-]{8}\.js$/, ".js"), item]));
const changedFiles = (() => {
  const before = byName(downloads.before);
  const after = byName(downloads.after);
  return Array.from(new Set([...before.keys(), ...after.keys()])).map((name) => ({ name, bytes: (after.get(name)?.bytes ?? 0) - (before.get(name)?.bytes ?? 0), gzip: (after.get(name)?.gzip ?? 0) - (before.get(name)?.gzip ?? 0) })).filter((item) => item.bytes !== 0);
})();
record({ scene: "download", method: "390 × 844: open Muscles (/?workspace=body), let it settle, tap Specialize, every .js file requested until the map (the 3D model) is drawn; raw bytes as built, gzip -9 of the same files", before: { total: downloads.before.total, gzip: downloads.before.gzip, files: downloads.before.files.length }, after: { total: downloads.after.total, gzip: downloads.after.gzip, files: downloads.after.files.length, tendonFilesFetched: downloads.after.tendonFilesFetched }, change: { bytes: downloads.after.total - downloads.before.total, gzip: downloads.after.gzip - downloads.before.gzip, files: changedFiles } });

// ---------------------------------------------------------------- the section at 390 and 375

for (const [width, height] of [[390, 844], [375, 667]]) {
  const { context, page } = await open("after", width, height);
  await pageReady(page);
  // Closed, after Exercises in this window and before Targets.
  await underSticky(page, "#spz-tendon");
  await snap(page, shot(`section-closed-${width}`));
  const order = await page.evaluate(() => Array.from(document.querySelectorAll(".spz-disclosures > details > summary b")).map((item) => item.textContent));
  record({ scene: "section-closed", viewport: `${width}x${height}`, summary: await page.locator("#spz-tendon > summary").innerText(), card: await rect(page, "#spz-tendon"), order, tendonChunkBeforeOpen: await page.evaluate(() => performance.getEntriesByType("resource").some((entry) => /TendonExposure|tendonAreas/.test(entry.name))), file: `section-closed-${width}.png` });

  // Open, on the outer elbow.
  await openSection(page);
  await tap(page, areaButton(page, "Outer elbow"));
  await underSticky(page, ".spz-tendon-areas");
  await snap(page, shot(`open-outer-elbow-${width}`));
  record({ scene: "open-area", viewport: `${width}x${height}`, areas: await page.locator(".spz-tendon-area").allInnerTexts(), pressed: await page.locator(".spz-tendon-area[aria-pressed='true']").innerText(), groups: await page.locator(".spz-tendon-groups > li").allInnerTexts(), tendonChunkAfterOpen: await page.evaluate(() => performance.getEntriesByType("resource").filter((entry) => /TendonExposure|tendonAreas/.test(entry.name)).map((entry) => entry.name.split("/").pop())), file: `open-outer-elbow-${width}.png` });

  // The day columns.
  await underSticky(page, ".spz-tendon-days");
  await snap(page, scratch(`days-${width}`));
  record({ scene: "days", viewport: `${width}x${height}`, columns: await page.locator(".spz-tendon-days > li").count(), values: await page.locator(".spz-tendon-days > li b").allInnerTexts(), dayControlsUnder44px: await smallControls(page, [".spz-tendon-days"]) });

  // The change line and its prompt.
  await underSticky(page, ".spz-tendon-change");
  await snap(page, shot(`change-line-${width}`));
  record({ scene: "change-line", viewport: `${width}x${height}`, heading: await page.locator(".spz-tendon-change > h4").innerText(), lines: await page.locator(".spz-tendon-changes li").allInnerTexts(), prompt: await page.locator(".spz-tendon-prompt > p").first().innerText(), file: `change-line-${width}.png` });

  // The planned rows, then Move's chips, then the Undo line.
  await underSticky(page, ".spz-tendon-planned");
  await snap(page, shot(`planned-rows-${width}`));
  const rows = await page.locator(".spz-tendon-entry > p").allInnerTexts();
  const first = page.locator(".spz-tendon-entry").first();
  await tap(page, first.getByRole("button", { name: "Move to another day" }));
  await underSticky(page, ".spz-tendon-planned");
  await snap(page, shot(`planned-move-${width}`));
  const sweep = await smallControls(page, ["#spz-tendon"]);
  const checked = await controlsChecked(page, ["#spz-tendon"]);
  const faint = await faintControls(page, "#spz-tendon");
  await tap(page, first.locator(".spz-tendon-move .spz-chip").first());
  await page.locator(".spz-tendon-done").waitFor({ timeout: 10000 });
  await underSticky(page, ".spz-tendon-planned");
  await snap(page, shot(`planned-undo-${width}`));
  const doneLine = await page.locator(".spz-tendon-done").innerText();
  const focused = await page.evaluate(() => document.activeElement?.textContent ?? null);
  await tap(page, page.locator(".spz-tendon-done").getByRole("button", { name: "Undo" }));
  const undone = await page.locator(".spz-tendon-done").innerText();
  record({ scene: "planned-rows", viewport: `${width}x${height}`, rows, doneLine, focusedAfterMove: focused, undone, controlsChecked: checked, controlsUnder44px: sweep, faintControls: faint, ...(await bars(page)), files: [`planned-rows-${width}.png`, `planned-move-${width}.png`, `planned-undo-${width}.png`] });

  // A day's sets, from its column: the sheet's controls too.
  await underSticky(page, ".spz-tendon-days");
  const day = page.locator(".spz-tendon-days button.spz-day").first();
  await tap(page, day);
  await page.getByRole("dialog").waitFor({ timeout: 10000 });
  await page.waitForTimeout(400);
  await snap(page, scratch(`day-sheet-${width}`));
  record({ scene: "day-sheet", viewport: `${width}x${height}`, title: await page.getByRole("dialog").locator("h2").innerText(), lists: await page.getByRole("dialog").locator(".spz-sheet-section h3").allInnerTexts(), controlsUnder44px: await smallControls(page, ["[role='dialog']"]) });
  await tap(page, page.getByRole("dialog").getByRole("button", { name: "Close" }));

  // How this is counted, open.
  await tap(page, page.locator("#spz-tendon-method > summary"));
  await underSticky(page, "#spz-tendon-method");
  await snap(page, scratch(`method-${width}`));
  record({ scene: "method", viewport: `${width}x${height}`, text: (await page.locator(".spz-tendon-method-body").innerText()).slice(0, 400), controlsUnder44px: await smallControls(page, ["#spz-tendon-method"]) });
  await context.close();

  // The muscle sheet's Attaches at line, and where its link lands.
  {
    const { context: sheetContext, page: sheetPage } = await open("after", width, height);
    await pageReady(sheetPage);
    await tap(sheetPage, sheetPage.locator(".spz-row", { hasText: "Extensor carpi radialis brevis" }));
    await sheetPage.locator("[role='dialog'] .spz-attaches").waitFor({ timeout: 30000 });
    await sheetPage.locator("[role='dialog'] .spz-attaches").evaluate((element) => element.scrollIntoView({ block: "center", behavior: "instant" }));
    await sheetPage.waitForTimeout(400);
    await snap(sheetPage, shot(`muscle-sheet-attaches-${width}`));
    const line = await sheetPage.locator("[role='dialog'] .spz-attaches p").innerText();
    const lineControls = await smallControls(sheetPage, ["[role='dialog'] .spz-attaches"]);
    await tap(sheetPage, sheetPage.locator("[role='dialog'] .spz-attaches").getByRole("button", { name: /See tendon exposure/ }));
    await sheetPage.locator(".spz-tendon-areas").waitFor({ timeout: 30000 });
    await sheetPage.waitForTimeout(800);
    const landed = await sheetPage.evaluate(() => ({ dialogOpen: Boolean(document.querySelector("[role='dialog']")), sectionOpen: document.getElementById("spz-tendon").open, pressed: document.querySelector(".spz-tendon-area[aria-pressed='true']")?.textContent, summaryTop: Math.round(document.querySelector("#spz-tendon > summary").getBoundingClientRect().top), focused: document.activeElement?.tagName }));
    record({ scene: "muscle-sheet-attaches", viewport: `${width}x${height}`, line, controlsUnder44px: lineControls, landed, ...(await bars(sheetPage)), file: `muscle-sheet-attaches-${width}.png` });
    await sheetContext.close();
  }
}

// ---------------------------------------------------------------- the rolling window, Planned mode, the 3D panel

{
  const { context, page } = await open("after", 390, 844, "/?workspace=specialization&region=forearm&fig=drawing&window=7d");
  await pageReady(page);
  await openSection(page);
  await underSticky(page, ".spz-tendon-days");
  await snap(page, shot("days-rolling-390"));
  record({ scene: "days-rolling", viewport: "390x844", columns: await page.locator(".spz-tendon-days > li").count(), partial: await page.locator(".spz-tendon-partial").count(), file: "days-rolling-390.png" });
  await context.close();
}
{
  const { context, page } = await open("after", 390, 844, "/?workspace=specialization&region=forearm&fig=drawing&mode=planned");
  await pageReady(page);
  await underSticky(page, "#spz-tendon");
  const summary = await page.locator("#spz-tendon > summary").innerText();
  await openSection(page);
  await underSticky(page, "#spz-tendon");
  await snap(page, shot("planned-mode-390"));
  record({ scene: "planned-mode", viewport: "390x844", summary, areas: await page.locator(".spz-tendon-area").allInnerTexts(), groups: await page.locator(".spz-tendon-groups").count(), change: await page.locator(".spz-tendon-change").count(), file: "planned-mode-390.png" });
  await context.close();
}
{
  const { context, page } = await open("after", 390, 844, "/?workspace=specialization&region=forearm&node=forearm.ecrb");
  await pageReady(page, "model");
  const line = page.locator(".sg-anatomy3d-attaches");
  await line.waitFor({ timeout: 30000 });
  await line.evaluate((element) => element.scrollIntoView({ block: "center", behavior: "instant" }));
  await page.waitForTimeout(500);
  await snap(page, shot("model-panel-attaches-390"));
  record({ scene: "model-panel-attaches", viewport: "390x844", line: await line.locator("p").innerText(), controlsUnder44px: await smallControls(page, [".sg-anatomy3d-attaches"]), file: "model-panel-attaches-390.png" });
  await context.close();
}

// ---------------------------------------------------------------- 320: no sideways scroll

{
  const { context, page } = await open("after", 320, 568);
  await pageReady(page);
  const closed = await overflowX(page);
  await openSection(page);
  await tap(page, areaButton(page, "Outer elbow"));
  await tap(page, page.locator(".spz-tendon-entry").first().getByRole("button", { name: "Move to another day" }));
  await tap(page, page.locator("#spz-tendon-method > summary"));
  const open320 = await overflowX(page);
  const wide = await page.evaluate(() => Array.from(document.querySelectorAll("#spz-tendon *")).filter((element) => element.getBoundingClientRect().right > window.innerWidth + 0.5).map((element) => `${element.tagName.toLowerCase()}.${element.className}`).slice(0, 10));
  await underSticky(page, ".spz-tendon-areas");
  await snap(page, shot("open-320"));
  record({ scene: "320", viewport: "320x568", overflowClosedPx: closed, overflowOpenPx: open320, elementsPastTheEdge: wide, controlsUnder44px: await smallControls(page, ["#spz-tendon"]), file: "open-320.png" });
  await context.close();
}

await browser.close();
for (const build of Object.values(builds)) build.server.close();
writeFileSync(join(here, "checks.json"), `${JSON.stringify({ ...checks, kept: Array.from(kept).sort() }, null, 2)}\n`);
console.log(`kept ${kept.size} screenshots`);
