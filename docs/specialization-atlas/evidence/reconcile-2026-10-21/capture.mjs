/**
 * Phone evidence for the reconciliation of main (4dac1ae: the 3D forearm, both arms as one) into
 * wave 0 (21 Oct 2026): Body Lab → Specialize with the 3D model and with the Drawing, and the live
 * set card of a one-arm forearm exercise, at 390 × 844 and 375 × 667, for the merged build and for
 * main's build made the same way.
 *
 * Headless Chromium emulating an iPhone (viewport, isMobile, hasTouch, deviceScaleFactor 3, en-US,
 * UTC; SwiftShader WebGL): not an iPhone, not Safari. The production client build, served by a
 * small static server here, device stores seeded: this week's forearm work, one-arm wrist curls on
 * the right, on the left and with no arm recorded; a forearm target (FCR), which before 20 Oct laid
 * a one-arm set out per arm; a plan whose first day holds the One-Arm Dumbbell Wrist Curl (410).
 *
 *   npx vite build --outDir <build>            (with `three` resolvable; see the reconciliation report)
 *   node docs/specialization-atlas/evidence/reconcile-2026-10-21/capture.mjs <build> <label>
 *
 * Writes <label>-<width>-{model,drawing,logger}.png (the first screen), <label>-<width>-model-below.png
 * (the 3D model's "What these numbers mean", opened) and <label>-<width>-drawing-below.png (the
 * counting line under the map), each reduced to 256 colours afterwards with Pillow, and
 * checks-<label>.json next to this file.
 */
import { createReadStream, existsSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const buildDir = resolve(process.argv[2] ?? "");
const label = process.argv[3] ?? "";
if (!existsSync(join(buildDir, "index.html")) || !/^[a-z0-9-]+$/.test(label)) throw new Error("Usage: capture.mjs <production build> <label>");

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".json": "application/json", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json", ".glb": "model/gltf-binary", ".wasm": "application/wasm" };
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
const workout = (id, dayOffset, dayLabel, exercises) => ({ id, title: dayLabel, dayLabel: `Week 1 · ${dayLabel}`, startedAt: at(dayOffset, 17), completedAt: at(dayOffset, 18), status: "completed", exercises });
const ex = (id, catalogId, exerciseName, sets) => ({ id, exerciseName, catalogId, plannedPrescription: `${sets.length} × 12`, sets });
const sessions = [
  workout("s1", 0, "Day 01 · Upper", [
    ex("e1", 132, "Hammer Curl", [set(30, 12), set(30, 12), set(30, 10)]),
    ex("e2", 410, "One-Arm Dumbbell Wrist Curl", [set(25, 15, { side: "right" }), set(25, 15, { side: "right" }), set(25, 15, { side: "left" }), set(25, 15)]),
  ]),
  workout("s2", 1, "Day 02 · Lower", [ex("e3", 139, "Wrist Curl", [set(60, 15), set(60, 15), set(60, 12)])]),
];
const lastWeek = new Date(mondayMs - 7 * DAY).toISOString().slice(0, 10);
const goals = [{ id: "fcr", regionId: "forearm", nodeId: "forearm.fcr", actionId: null, side: "right", metric: "direct_dynamic_bouts", target: 8, period: "calendar_week", startsOn: lastWeek, endsOn: null, timezone: "UTC", createdAt: at(-7, 8), updatedAt: at(-7, 8) }];
const entries = (ids) => ids.map((id) => ({ entryId: id, catalogExerciseId: id }));
const planWeek = { customWorkoutIds: [], weeklyPlanIds: {}, weeklyPlanEntries: { "0-Upper": entries([410, 132]), "1-Lower": entries([167]), "2-Upper": entries([3, 139]), "3-Lower": entries([168]) }, prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: {}, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 0 };
const plan = { version: 2, ...planWeek, weeks: { "1": planWeek }, activeWeek: 1 };

// ---------------------------------------------------------------- the browser

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const checks = {
  note: `Headless Chromium emulating an iPhone (viewport, isMobile, hasTouch, deviceScaleFactor 3, en-US, UTC, SwiftShader WebGL); not an iPhone, not Safari. Build: ${label}. Device stores seeded (this week: Hammer Curl x3 and One-Arm Dumbbell Wrist Curl twice on the right, once on the left and once with no arm on Monday; Wrist Curl x3 on Tuesday; a forearm target, FCR 8 a week; a 4-day plan whose first day holds 410 and 132). Run on ${todayKey}, UTC. Coordinates are CSS px.`,
  scenes: [],
};
const shot = (name) => join(here, `${label}-${name}.png`);
const record = (entry) => { checks.scenes.push(entry); console.log(JSON.stringify(entry)); };

async function open(width, height, path) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, timezoneId: "UTC", locale: "en-US" });
  const page = await context.newPage();
  const failed = [];
  // Requests to the app's own origin that failed (the photo store outside it is not reachable from the sandbox).
  page.on("requestfailed", (request) => { if (request.url().startsWith(base)) failed.push(request.url()); });
  await page.route("**/api/trpc/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(new URL(route.request().url()).searchParams.get("batch") ? [{ result: { data: { json: null } } }] : { result: { data: { json: null } } }) }));
  await page.addInitScript((seed) => {
    if (sessionStorage.getItem("reconcile-seeded")) return;
    sessionStorage.setItem("reconcile-seeded", "1");
    localStorage.setItem("sports-genome-launch-experience-enabled-v1", "off");
    localStorage.setItem("gym-optimizer-athlete-profile-v1", JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Muscle growth", trainingDays: 4, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb", sexForReference: "male", birthYear: 1995, bodyWeight: 180 } }));
    localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(seed.sessions));
    localStorage.setItem("gym-optimizer-workout-plan-v1", JSON.stringify(seed.plan));
    localStorage.setItem("sports-genome-specialization-goals-v1", JSON.stringify(seed.goals));
  }, { sessions, plan, goals });
  await page.goto(`${base}${path}`);
  return { context, page, failed };
}
const overflowX = (page) => page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth));
/** What names a side anywhere on screen or in an accessible name, besides an exercise's own name. */
const sideWords = (page) => page.evaluate(() => {
  const names = Array.from(document.querySelectorAll("[aria-label]")).map((element) => element.getAttribute("aria-label"));
  const text = `${document.body.innerText}\n${names.join("\n")}`.replace(/One-Arm|Single-Leg/g, "");
  return Array.from(new Set(text.match(/[^\n.]{0,30}\b(left|right) (arm|leg|forearm|side)\b[^\n.]{0,30}|[^\n.]{0,30}\b(each arm|per arm|no arm recorded|Which arm)\b[^\n.]{0,30}/gi) ?? []));
});
const sideSwitch = (page) => page.evaluate(() => Array.from(document.querySelectorAll("[role=group]")).map((group) => group.getAttribute("aria-label") ?? "").filter((name) => /^(Arm|Side|Leg)\b|^Arm for set|leg for set/i.test(name)));

for (const [width, height] of [[390, 844], [375, 667]]) {
  // The page, with the 3D model, FCR selected.
  for (const figure of ["model", "drawing"]) {
    const { context, page, failed } = await open(width, height, `/?workspace=specialization&region=forearm&node=forearm.fcr&fig=${figure}`);
    await page.locator(".spz-page").waitFor({ timeout: 30000 });
    await page.locator(".spz-row").first().waitFor({ timeout: 30000 });
    let status = null;
    if (figure === "model") {
      await page.locator(".sg-anatomy3d-stage[data-status='ready'], .sg-anatomy3d-stage[data-status='error']").first().waitFor({ timeout: 60000 }).catch(() => {});
      status = await page.locator(".sg-anatomy3d-stage").first().getAttribute("data-status").catch(() => null);
    } else {
      await page.locator(".spz-diagram svg").first().waitFor({ timeout: 30000 });
    }
    await page.waitForTimeout(1200);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    await page.screenshot({ path: shot(`${width}-${figure}`) });
    // Below the first screen, where the words differ from main's: the 3D model's "What these
    // numbers mean", opened, and the counting line under the map with the list's first rows.
    let below = null;
    if (figure === "model") {
      below = await page.evaluate(() => {
        const details = Array.from(document.querySelectorAll("details")).find((item) => /What these numbers mean/.test(item.querySelector("summary")?.textContent ?? ""));
        if (!details) return null;
        details.open = true;
        details.scrollIntoView({ block: "center" });
        return details.querySelector("summary")?.textContent ?? null;
      });
    } else {
      below = await page.evaluate(() => {
        const lede = document.querySelector(".spz-lede");
        if (!lede) return null;
        window.scrollTo(0, 0);
        window.scrollBy(0, lede.getBoundingClientRect().top - window.innerHeight / 3);
        return lede.textContent;
      });
    }
    await page.waitForTimeout(500);
    await page.screenshot({ path: shot(`${width}-${figure}-below`) });
    const toggle = await page.getByRole("group", { name: /Show the muscles as/ }).count();
    const lede = await page.locator(".spz-lede").first().textContent().catch(() => null);
    record({ scene: `specialize-${figure}`, width, height, modelStatus: status, figureToggle: toggle > 0, below, sideSwitchGroups: await sideSwitch(page), sideWords: await sideWords(page), lede, overflowX: await overflowX(page), address: new URL(page.url()).search, failedRequests: failed });
    await context.close();
  }

  // The live set card of a one-arm forearm exercise, from the plan's first day, with a forearm target.
  {
    const { context, page, failed } = await open(width, height, "/?workspace=tracker");
    await page.getByRole("button", { name: /start workout/i }).first().waitFor({ timeout: 30000 });
    const prestart = await page.evaluate(() => ({
      counts: document.querySelector(".session-prestart-counts")?.textContent ?? null,
      rows: Array.from(document.querySelectorAll(".session-prestart-name")).map((row) => row.textContent),
    }));
    await page.getByRole("button", { name: /start workout/i }).first().click();
    await page.locator(".live-set-card").first().waitFor({ timeout: 30000 });
    await page.waitForTimeout(800);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    await page.screenshot({ path: shot(`${width}-logger`) });
    const card = await page.evaluate(() => {
      const element = document.querySelector(".live-set-card");
      const box = element.getBoundingClientRect();
      return { exercise: element.querySelector("h4")?.textContent ?? null, prescription: element.querySelector(".live-set-prescription")?.textContent ?? null, top: Math.round(box.top), bottom: Math.round(box.bottom) };
    });
    const stored = await page.evaluate(() => {
      const active = JSON.parse(localStorage.getItem("sports-genome-device-workout-history-v1") || "[]").find((session) => session.status === "active");
      return active ? active.exercises.map((item) => ({ name: item.exerciseName, perArm: item.perArm ?? null, rows: item.sets.length, sides: item.sets.map((row) => row.side ?? null) })) : null;
    });
    record({ scene: "live-set-card", width, height, prestart, card, stored, sideSwitchGroups: await sideSwitch(page), sideWords: await sideWords(page), overflowX: await overflowX(page), failedRequests: failed });
    await context.close();
  }
}

writeFileSync(join(here, `checks-${label}.json`), `${JSON.stringify(checks, null, 1)}\n`);
await browser.close();
server.close();
