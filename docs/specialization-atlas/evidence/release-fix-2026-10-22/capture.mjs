/**
 * Phone screenshots of the screens the release review's fixes changed (22 Oct 2026): Progress's
 * subtitle ("Circumference and grip", no "by arm"), the 3D model's credits ("It is one model of one
 * arm, never mirrored."), and a planned one-arm set in a muscle's ledger, with no side note.
 * Headless Chromium emulating an iPhone (390 × 844 and 375 × 667, isMobile, hasTouch,
 * deviceScaleFactor 3, en-US, UTC, SwiftShader WebGL): not an iPhone, not Safari.
 *
 *   npx vite build --outDir <build>
 *   node docs/specialization-atlas/evidence/release-fix-2026-10-22/capture.mjs <build> <out dir>
 *
 * Prints what each scene read (the subtitle, the credits, the ledger's notes, horizontal overflow).
 * The PNGs here were reduced to 256 colours afterwards with Pillow.
 */
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { join, extname } from "node:path";
const [buildDir, outDir] = process.argv.slice(2);
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".json": "application/json", ".woff2": "font/woff2", ".glb": "model/gltf-binary", ".wasm": "application/wasm" };
const server = createServer((req, res) => { let f = join(buildDir, decodeURIComponent(new URL(req.url, "http://x").pathname)); if (!existsSync(f) || statSync(f).isDirectory()) f = join(buildDir, "index.html"); res.writeHead(200, { "content-type": types[extname(f)] ?? "application/octet-stream" }); createReadStream(f).pipe(res); });
await new Promise((d) => server.listen(0, "127.0.0.1", d));
const base = `http://127.0.0.1:${server.address().port}`;
const DAY = 86_400_000; const todayKey = new Date().toISOString().slice(0, 10);
const mondayMs = (() => { const d = new Date(`${todayKey}T00:00:00Z`); return d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY; })();
const at = (o, h) => new Date(mondayMs + o * DAY + h * 3_600_000).toISOString();
const set = (w, r, x = {}) => ({ weight: String(w), reps: String(r), unit: "lb", completed: true, ...x });
const workout = (id, o, label, exercises) => ({ id, title: label, dayLabel: `Week 1 · ${label}`, startedAt: at(o, 17), completedAt: at(o, 18), status: "completed", exercises });
const ex = (id, catalogId, exerciseName, sets) => ({ id, exerciseName, catalogId, plannedPrescription: `${sets.length} × 12`, sets });
const sessions = [workout("s1", 0, "Day 01 · Upper", [ex("e1", 132, "Hammer Curl", [set(30, 12), set(30, 12)]), ex("e2", 410, "One-Arm Dumbbell Wrist Curl", [set(25, 15), set(25, 15)])]), workout("s2", 1, "Day 02 · Lower", [ex("e3", 139, "Wrist Curl", [set(60, 15), set(60, 12)])])];
const goals = [{ id: "fcr", regionId: "forearm", nodeId: "forearm.fcr", actionId: null, side: "right", metric: "direct_dynamic_bouts", target: 8, period: "calendar_week", startsOn: new Date(mondayMs - 7 * DAY).toISOString().slice(0, 10), endsOn: null, timezone: "UTC", createdAt: at(-7, 8), updatedAt: at(-7, 8) }];
const entries = (ids) => ids.map((id) => ({ entryId: id, catalogExerciseId: id }));
const planWeek = { customWorkoutIds: [], weeklyPlanIds: {}, weeklyPlanEntries: { "0-Upper": entries([410, 132]), "1-Lower": entries([167]), "2-Upper": entries([3, 139]), "3-Lower": entries([168]) }, prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: {}, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 0 };
const plan = { version: 2, ...planWeek, weeks: { "1": planWeek }, activeWeek: 1 };
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const out = [];
async function open(width, height, path) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, timezoneId: "UTC", locale: "en-US" });
  const page = await context.newPage();
  await page.route("**/api/trpc/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(new URL(route.request().url()).searchParams.get("batch") ? [{ result: { data: { json: null } } }] : { result: { data: { json: null } } }) }));
  await page.addInitScript((seed) => {
    if (sessionStorage.getItem("seeded")) return; sessionStorage.setItem("seeded", "1");
    localStorage.setItem("sports-genome-launch-experience-enabled-v1", "off");
    localStorage.setItem("gym-optimizer-athlete-profile-v1", JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Muscle growth", trainingDays: 4, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb", sexForReference: "male", birthYear: 1995, bodyWeight: 180 } }));
    localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(seed.sessions));
    localStorage.setItem("gym-optimizer-workout-plan-v1", JSON.stringify(seed.plan));
    localStorage.setItem("sports-genome-specialization-goals-v1", JSON.stringify(seed.goals));
  }, { sessions, plan, goals });
  await page.goto(`${base}${path}`);
  await page.locator(".spz-page").waitFor({ timeout: 30000 });
  await page.locator(".spz-row").first().waitFor({ timeout: 30000 });
  return { context, page };
}
const overflow = (page) => page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth));
const centre = async (page, element) => { await element.evaluate((node) => node.scrollIntoView({ block: "center" })); await page.waitForTimeout(400); };
for (const [w, h] of [[390, 844], [375, 667]]) {
  // Progress's subtitle, and the 3D model's credits opened.
  {
    const { context, page } = await open(w, h, "/?workspace=specialization&region=forearm&fig=model");
    await page.locator(".sg-anatomy3d-stage[data-status='ready'], .sg-anatomy3d-stage[data-status='error']").first().waitFor({ timeout: 90000 }).catch(() => {});
    const progress = page.locator("details summary").filter({ hasText: /^Progress/ }).first();
    await centre(page, progress);
    await page.screenshot({ path: `${outDir}/progress-subtitle-${w}.png` });
    const summary = await progress.textContent();
    const credits = page.locator("details summary").filter({ hasText: /About the 3D model/ }).first();
    await credits.click();
    await page.waitForTimeout(300);
    const paragraph = page.locator(".sg-anatomy3d-credits p").filter({ hasText: /one model of/ }).first();
    await centre(page, paragraph);
    await page.screenshot({ path: `${outDir}/model-credits-${w}.png` });
    const box = await credits.boundingBox();
    out.push({ scene: "progress and credits", width: w, progressSummary: summary, credits: await paragraph.textContent(), creditsSummaryHeight: box && Math.round(box.height), overflowX: await overflow(page) });
    await context.close();
  }
  // Planned: FCR's sheet, its ledger with the planned one-arm wrist curl, no side note.
  {
    const { context, page } = await open(w, h, "/?workspace=specialization&region=forearm&mode=planned&node=forearm.fcr&fig=drawing");
    await page.getByRole("button", { name: /Inspect coverage/ }).first().click();
    const sheet = page.getByRole("dialog");
    await sheet.waitFor();
    await sheet.evaluate((node) => node.querySelectorAll("details").forEach((d) => { d.open = true; }));
    await page.waitForTimeout(400);
    const row = sheet.locator("text=One-Arm Dumbbell Wrist Curl").first();
    await row.evaluate((node) => node.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${outDir}/planned-ledger-fcr-${w}.png` });
    const notes = await sheet.locator(".spz-note").allTextContents();
    out.push({ scene: "planned ledger", width: w, notes, eachSideAssumed: (await sheet.textContent()).includes("Each side assumed"), overflowX: await overflow(page) });
    await context.close();
  }
}
console.log(JSON.stringify(out, null, 1));
await browser.close(); server.close();
