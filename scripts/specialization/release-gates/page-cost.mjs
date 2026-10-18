/**
 * The page's cost with a long device history: from tapping Specialize on Body Lab to the drawing
 * on screen, then Custom, an arm switch, the arm back and the switch again, each to the next
 * painted frame. Home does not preload the page's lazy chunk, so the first figure includes
 * fetching it (from a local server: no network latency) and running it; `chunkOnTap` records that
 * the chunk was requested after the tap. Headless Chromium emulating an iPhone (390 × 844,
 * isMobile, hasTouch, device scale 3) on the production build, on whatever CPU runs it: not a
 * phone, not Safari. Results: docs/specialization-atlas/README.md, "Release gates".
 *
 *   npx vite build && node scripts/specialization/release-gates/page-cost.mjs
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
if (!existsSync(join(root, "dist/public/index.html"))) throw new Error("Build the client first: npx vite build");
const publicDir = join(root, "dist/public");
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

const NOW = Date.now();
const names = { 1: "Barbell Bench Press", 2: "Incline Barbell Bench Press", 5: "Incline Dumbbell Bench Press", 20: "High-to-Low Cable Fly", 150: "Cable Triceps Pushdown", 139: "Wrist Curl", 43: "Barbell Bent-Over Row", 66: "Pull-Up", 46: "Dumbbell Row", 81: "Barbell Shrug", 121: "Barbell Curl", 143: "Dead Hang", 41: "Conventional Deadlift", 220: "Cossack Squat", 210: "Glute Bridge", 200: "45-Degree Back Extension", 145: "Farmer Hold", 140: "Reverse Wrist Curl", 132: "Hammer Curl", 135: "Reverse Curl", 410: "One-Arm Dumbbell Wrist Curl", 411: "One-Arm Dumbbell Reverse Wrist Curl", 160: "Bodyweight Triceps Extension", 100: "Band Pull-Apart" };
const days = [[[1, 4], [2, 4], [5, 3], [20, 3], [150, 3], [139, 3]], [[43, 4], [66, 4], [46, 3], [81, 3], [121, 3], [143, 3]], [[41, 4], [220, 3], [210, 3], [200, 3], [145, 3], [140, 3]], [[132, 4], [135, 3], [410, 3], [411, 3], [160, 3], [100, 3]]];
const holds = new Set([143, 145]);
const oneArm = new Set([46, 410, 411]);
function history(weeks, perWeek, scale = 1) {
  const sessions = [];
  for (let w = 0; w < weeks; w += 1) for (let d = 0; d < perWeek; d += 1) {
    const started = NOW - (w * 7 + d * (7 / perWeek)) * 86_400_000 - 3_600_000;
    const items = days[(w * perWeek + d) % days.length];
    sessions.push({ id: `s-${w}-${d}`, title: "Day", dayLabel: "Day", startedAt: new Date(started).toISOString(), completedAt: new Date(started + 3_600_000).toISOString(), status: "completed",
      exercises: items.map(([id, sets], e) => ({ id: `ex-${w}-${d}-${e}`, exerciseName: names[id], catalogId: id, plannedPrescription: `${sets} × 8–12`,
        sets: Array.from({ length: Math.round(sets * scale) }, (_, s) => ({ id: `set-${w}-${d}-${e}-${s}`, weight: "40", reps: holds.has(id) ? "" : "10", unit: "kg", completed: true, ...(holds.has(id) ? { holdSeconds: "40" } : {}), ...(oneArm.has(id) ? { side: s % 2 ? "left" : "right" } : {}) })) })) });
  }
  return sessions;
}
const entries = (ids) => ids.map((id) => ({ entryId: id, catalogExerciseId: id }));
const planWeek = { customWorkoutIds: [], weeklyPlanIds: {}, weeklyPlanEntries: { "0-Upper": entries([1, 45, 132]), "1-Lower": entries([167]), "2-Upper": entries([3, 139, 140]), "3-Lower": entries([168]) }, prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: {}, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 0 };
const plan = { version: 2, ...planWeek, weeks: { "1": planWeek }, activeWeek: 1 };

const browser = await chromium.launch();
const results = [];
for (const [label, sessions] of [["one week", history(1, 4)], ["a year, 4 a week", history(52, 4)], ["a heavy year, 6 a week, sets x2.5", history(52, 6, 2.5)]]) {
  for (let run = 0; run < 3; run += 1) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    const chunkRequests = [];
    page.on("request", (request) => { if (/\/assets\/SpecializationPanel-[^/]*\.js$/.test(request.url())) chunkRequests.push(request.url()); });
    await page.route("**/api/trpc/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(new URL(route.request().url()).searchParams.get("batch") ? [{ result: { data: { json: null } } }] : { result: { data: { json: null } } }) }));
    await page.addInitScript((seed) => {
      if (sessionStorage.getItem("cost-seeded")) return;
      sessionStorage.setItem("cost-seeded", "1");
      localStorage.setItem("sports-genome-launch-experience-enabled-v1", "off");
      localStorage.setItem("gym-optimizer-athlete-profile-v1", JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Muscle growth", trainingDays: 4, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "kg", sexForReference: "male", birthYear: 1995, bodyWeight: 80 } }));
      localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(seed.sessions));
      localStorage.setItem("gym-optimizer-workout-plan-v1", JSON.stringify(seed.plan));
    }, { sessions, plan });
    // Body Lab first, settled, so the timing below starts at the tap.
    await page.goto(`${base}/?workspace=body`);
    await page.waitForTimeout(1500);
    const chunkBeforeTap = chunkRequests.length;
    const open = await page.evaluate(async () => {
      const button = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Specialize");
      const t0 = performance.now();
      button.click();
      while (!document.querySelector(".spz-diagram-svg")) await new Promise((r) => setTimeout(r, 5));
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      return performance.now() - t0;
    });
    const tap = (name) => page.evaluate(async (text) => {
      const button = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === text);
      const t0 = performance.now();
      button.click();
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      return performance.now() - t0;
    }, name);
    const custom = await tap("Custom");
    const left = await tap("Left arm");
    const right = await tap("Right arm");
    const leftAgain = await tap("Left arm");
    results.push({ history: label, sessions: sessions.length, run, chunkOnTap: chunkBeforeTap === 0 && chunkRequests.length > 0, openMs: Math.round(open), customMs: Math.round(custom), leftArmFirstMs: Math.round(left), rightArmBackMs: Math.round(right), leftArmAgainMs: Math.round(leftAgain) });
    await context.close();
  }
}
await browser.close();
server.close();
console.table(results);
