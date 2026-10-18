/**
 * What the specialization page does with no network (brief §9: "Provide zero, loading,
 * partial-data, error, and offline states distinctly"). Headless Chromium emulating an iPhone
 * (390 × 844, isMobile, hasTouch, device scale 3) on the production build served from dist/public:
 * not an iPhone, not Safari. The pattern is design/specialization/forearm/render-page.mjs.
 *
 *   npx vite build && node scripts/specialization/release-gates/page-offline.mjs [outDir]
 *
 * A. The page opened online, then the network drops: switch arm and mode, open a muscle's sheet,
 *    and count the requests made while offline.
 * B. Body Lab opened online, the page never opened, then the network drops and Specialize is
 *    tapped; then the network returns and Reload is tapped.
 */
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const outDir = resolve(root, process.argv[2] ?? "docs/specialization-atlas/evidence/release-gates-2026-10-18");
mkdirSync(outDir, { recursive: true });
const publicDir = join(root, "dist/public");
if (!existsSync(join(publicDir, "index.html"))) throw new Error("Build the client first: npx vite build");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".json": "application/json", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json" };
const requests = [];
const server = createServer((request, response) => {
  requests.push(request.url);
  const path = decodeURIComponent(new URL(request.url, "http://x").pathname);
  let file = join(publicDir, path);
  if (!file.startsWith(publicDir) || !existsSync(file) || statSync(file).isDirectory()) file = join(publicDir, "index.html");
  response.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(response);
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const base = `http://127.0.0.1:${server.address().port}`;

const set = (weight, reps) => ({ weight: String(weight), reps: String(reps), unit: "lb", completed: true });
const sessions = [
  { id: "s1", title: "Pull", dayLabel: "Week 1 · Day 02 · Pull", startedAt: "2026-10-13T17:00:00.000Z", completedAt: "2026-10-13T18:00:00.000Z", status: "completed", exercises: [
    { id: "e1", exerciseName: "Hammer Curl", catalogId: 132, plannedPrescription: "3 × 12", sets: [set(30, 12), set(30, 12), set(30, 10)] },
    { id: "e2", exerciseName: "Wrist Curl", catalogId: 139, plannedPrescription: "4 × 15", sets: [set(60, 15), set(60, 15), set(60, 14), set(60, 12)] },
  ] },
];
const entries = (ids) => ids.map((id) => ({ entryId: id, catalogExerciseId: id }));
const planWeek = { customWorkoutIds: [], weeklyPlanIds: {}, weeklyPlanEntries: { "0-Upper": entries([1, 45, 132]), "1-Lower": entries([167]), "2-Upper": entries([3, 139, 140]), "3-Lower": entries([168]) }, prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: {}, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 0 };
const plan = { version: 2, ...planWeek, weeks: { "1": planWeek }, activeWeek: 1 };

const browser = await chromium.launch();
const results = {};
async function phone() {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  page.on("pageerror", (error) => { results.pageErrors = [...(results.pageErrors ?? []), String(error.message).slice(0, 200)]; });
  await page.route("**/api/trpc/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(new URL(route.request().url()).searchParams.get("batch") ? [{ result: { data: { json: null } } }] : { result: { data: { json: null } } }) }));
  await page.addInitScript((seed) => {
    if (sessionStorage.getItem("offline-seeded")) return;
    sessionStorage.setItem("offline-seeded", "1");
    localStorage.setItem("sports-genome-launch-experience-enabled-v1", "off");
    localStorage.setItem("gym-optimizer-athlete-profile-v1", JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Muscle growth", trainingDays: 4, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb", sexForReference: "male", birthYear: 1995, bodyWeight: 180 } }));
    localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(seed.sessions));
    localStorage.setItem("gym-optimizer-workout-plan-v1", JSON.stringify(seed.plan));
  }, { sessions, plan });
  return { context, page };
}
const bodyText = (page) => page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").slice(0, 400));

// A. The page opened online, then the network drops.
{
  const { context, page } = await phone();
  await page.goto(`${base}/?workspace=specialization&region=forearm`);
  await page.locator(".spz-diagram-svg").waitFor({ timeout: 30000 });
  await context.setOffline(true);
  const before = requests.length;
  await page.getByRole("button", { name: "Left arm" }).click();
  await page.getByRole("button", { name: "Planned" }).first().click();
  await page.waitForTimeout(300);
  const plannedLine = await page.locator(".spz-strip-line").first().innerText().catch(() => null);
  await page.getByRole("button", { name: "Completed" }).first().click();
  // Selected through its control (render-page.mjs taps it with a finger; this check is about the network).
  await page.locator('.spz-diagram-hit[data-node="forearm.fcu"]').dispatchEvent("click");
  await page.waitForTimeout(300);
  const fcuSelected = await page.locator('.spz-diagram-hit[data-node="forearm.fcu"]').getAttribute("aria-pressed");
  await page.getByRole("button", { name: /Inspect coverage|Add targeted exercise/ }).first().click({ timeout: 5000 });
  const sheet = page.getByRole("dialog").first();
  await sheet.waitFor({ timeout: 5000 });
  const sheetOpen = await sheet.isVisible();
  await page.screenshot({ path: join(outDir, "offline-after-load-390.png") });
  results.afterLoad = { requestsWhileOffline: requests.length - before, plannedLine, fcuSelected, sheetOpen, noOverflow: await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth) };
  await context.close();
}

// B. Body Lab opened online, the page never opened, then the network drops and Specialize is tapped.
{
  const { context, page } = await phone();
  await page.goto(`${base}/?workspace=body`);
  await page.waitForTimeout(2500);
  await context.setOffline(true);
  await page.getByRole("button", { name: "Specialize" }).first().click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: join(outDir, "offline-before-load-390.png") });
  results.beforeLoad = { drawing: await page.locator(".spz-diagram-svg").count(), alert: await page.getByRole("alert").count(), text: await bodyText(page) };
  // Back online, and Reload tapped.
  await context.setOffline(false);
  await page.getByRole("button", { name: /Reload/ }).first().click().catch(() => {});
  await page.waitForTimeout(3000);
  results.beforeLoadThenOnline = { drawing: await page.locator(".spz-diagram-svg").count(), url: page.url().replace(base, "") };
  await context.close();
}
await browser.close();
server.close();
writeFileSync(join(outDir, "offline-checks.json"), `${JSON.stringify(results, null, 2)}\n`);
console.log(JSON.stringify(results, null, 2));
