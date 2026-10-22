// Critic experiment (phone lens): where the draft's "Design a stack" section would sit, and how big it
// would be, on the shipped page. Headless Chromium emulating an iPhone (viewport, isMobile, hasTouch,
// deviceScaleFactor 3): not an iPhone, not Safari. Production client build served from a scratch folder.
// The stack section itself does not exist yet: it is mocked with the page's own classes, from the draft's
// §3.2 list and the prototype's P1 output (12 rows over 3 days), and inserted where §3.2 puts it
// (the first disclosure). Usage: node measure.mjs <build dir> <out dir>
import { createReadStream, existsSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";

const [buildDir, outDir] = process.argv.slice(2).map((d) => resolve(d));
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".json": "application/json", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json" };
const server = createServer((req, res) => {
  let file = join(buildDir, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!file.startsWith(buildDir) || !existsSync(file) || statSync(file).isDirectory()) file = join(buildDir, "index.html");
  res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const base = `http://127.0.0.1:${server.address().port}`;

const DAY = 86_400_000;
const todayKey = new Date().toISOString().slice(0, 10);
const mondayMs = (() => { const d = new Date(`${todayKey}T00:00:00Z`); return d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY; })();
const at = (o, h) => new Date(mondayMs + o * DAY + h * 3_600_000).toISOString();
const set = (w, r, extra = {}) => ({ weight: String(w), reps: String(r), unit: "lb", completed: true, ...extra });
const workout = (id, o, label, exercises) => ({ id, title: label, dayLabel: `Week 1 · ${label}`, startedAt: at(o, 17), completedAt: at(o, 18), status: "completed", exercises });
const ex = (id, catalogId, exerciseName, sets) => ({ id, exerciseName, catalogId, plannedPrescription: `${sets.length} × 12`, sets });
const sessions = [
  workout("s1", 0, "Day 02 · Pull", [ex("e1", 132, "Hammer Curl", [set(30, 12), set(30, 12)]), ex("e2", 139, "Wrist Curl", [set(60, 15)])]),
  workout("s2", 1, "Day 04 · Upper", [ex("e3", 140, "Reverse Wrist Curl", [set(30, 15)])]),
];
const entries = (ids) => ids.map((id) => ({ entryId: id, catalogExerciseId: id }));
const planWeek = { customWorkoutIds: [], weeklyPlanIds: {}, weeklyPlanEntries: { "0-Upper": entries([1, 45, 132]), "1-Lower": entries([167]), "2-Upper": entries([3, 139, 140]), "3-Lower": entries([168]) }, prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: {}, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 0 };
const plan = { version: 2, ...planWeek, weeks: { "1": planWeek, "2": planWeek, "3": planWeek, "4": planWeek }, activeWeek: 1 };

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" }).catch(() => chromium.launch());
const out = { note: "Headless Chromium emulating an iPhone (viewport, isMobile, hasTouch, deviceScaleFactor 3); not an iPhone, not Safari. Stack section mocked with the page's own CSS classes.", scenes: [] };

async function open(width, height, query) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, timezoneId: "UTC", locale: "en-US" });
  const page = await context.newPage();
  await page.route("**/api/trpc/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(new URL(route.request().url()).searchParams.get("batch") ? [{ result: { data: { json: null } } }] : { result: { data: { json: null } } }) }));
  await page.addInitScript((seed) => {
    if (sessionStorage.getItem("seeded")) return;
    sessionStorage.setItem("seeded", "1");
    localStorage.setItem("sports-genome-launch-experience-enabled-v1", "off");
    localStorage.setItem("gym-optimizer-athlete-profile-v1", JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Muscle growth", trainingDays: 4, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb", sexForReference: "male", birthYear: 1995, bodyWeight: 180 } }));
    localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(seed.sessions));
    localStorage.setItem("gym-optimizer-workout-plan-v1", JSON.stringify(seed.plan));
  }, { sessions, plan });
  await page.goto(`${base}/?workspace=specialization&region=forearm${query}`);
  await page.locator(".spz-row").first().waitFor({ timeout: 30000 });
  await page.waitForTimeout(600);
  return { context, page };
}

const layout = (page) => page.evaluate(() => {
  const y = (el) => (el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : null);
  const dock = document.querySelector(".mobile-workspace-dock");
  const firstDisc = document.querySelector(".spz-disclosures > details");
  const cs = firstDisc ? getComputedStyle(firstDisc) : null;
  const findings = document.getElementById("spz-findings-title")?.closest("section");
  const list = document.getElementById("spz-list-title")?.closest("section");
  return {
    dockTop: dock ? Math.round(dock.getBoundingClientRect().top) : null,
    mapBottom: Math.round(document.querySelector(".spz-map").getBoundingClientRect().bottom + window.scrollY),
    muscleListTop: y(list), muscleListHeight: list ? Math.round(list.getBoundingClientRect().height) : null,
    findingsTop: y(findings), findingsHeight: findings ? Math.round(findings.getBoundingClientRect().height) : null,
    firstDisclosureTop: y(firstDisc),
    disclosureContentWidth: firstDisc ? Math.round(firstDisc.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) : null,
    documentHeight: document.documentElement.scrollHeight,
    findingTitles: Array.from(document.querySelectorAll(".spz-finding strong")).map((n) => n.textContent),
  };
});

// The draft's §3.2 open section, with the prototype's P1 rows (3 days × 4 exercises), in the page's own classes.
const P1 = [
  ["Day 01 · Push · about 13 min", [["Reverse Wrist Curl", "1 × 10–25", "Wrist extension: no direct work this week"], ["Lever Pronation", "1 × 10–20 each arm", "Forearm pronation: no direct work this week"], ["Lever Ulnar Deviation", "1 × 10–25 each arm", "Wrist ulnar deviation: no direct work this week"], ["Band Thumb Abduction", "1 × 12–25 each arm", "Thumb abduction: no direct work this week"]]],
  ["Day 02 · Pull · about 13 min", [["Finger Curl", "1 × 10–25", "Finger flexion: no direct work this week"], ["Lever Supination", "1 × 10–20 each arm", "Forearm supination: no direct work this week"], ["Band Finger Extension", "1 × 10–25 each arm", "Finger extension: no direct work this week"], ["Band Thumb Extension", "1 × 12–25 each arm", "Thumb extension: no direct work this week"]]],
  ["Day 03 · Legs · about 12 min", [["Hammer Curl", "1 × 6–20", "Elbow flexion: no direct work this week"], ["Wrist Curl", "1 × 10–25", "Wrist flexion: no direct work this week"], ["Lever Radial Deviation", "1 × 10–25 each arm", "Wrist radial deviation: no direct work this week"], ["Band Thumb Flexion", "1 × 12–25 each arm", "Thumb flexion: no direct work this week"]]],
];
const mock = (page) => page.evaluate((days) => {
  const host = document.querySelector(".spz-disclosures");
  const d = document.createElement("details");
  d.className = "spz-disclosure spz-card"; d.id = "mock-stack"; d.open = true;
  const row = ([name, rx, why]) => `<li class="mock-row" style="display:grid;gap:.35rem;padding:.55rem 0;border-bottom:1px solid rgb(164 200 232 / .14)"><span><b>${name}</b><small>${rx}</small></span><small>${why}</small>
    <div class="mock-controls" style="display:flex;flex-wrap:wrap;gap:.5rem;align-items:center"><span class="mock-stepper" style="display:inline-flex;align-items:center;gap:.25rem"><button type="button" class="spz-icon-button" aria-label="One set fewer">−</button><b style="min-width:1.5rem;text-align:center">1</b><button type="button" class="spz-icon-button" aria-label="One set more">+</button></span><button type="button" class="spz-button mock-change">Change</button><button type="button" class="spz-button mock-leave">Leave out</button></div></li>`;
  d.innerHTML = `<summary><span><b>Design a stack</b><small>Plan Week 1 · 3 direct sets a week on each arm now</small></span></summary>
  <p class="spz-note">Choose how many direct sets a week you want for the forearms, on each arm. The app gives every movement it can a set, then evens the rest out muscle by muscle, and puts them on your plan days. Nothing changes in your plan until you add it.</p>
  <p class="spz-note">Plan Week 1 as written: 3 direct sets a week on each arm (Hammer Curl). Grip and steadying in your other exercises (15 sets) are not counted here.</p>
  <div class="spz-field" id="mock-total"><span>Direct sets a week, each arm</span><div style="display:flex;gap:.5rem;align-items:center"><button type="button" class="spz-icon-button">−</button><input inputmode="numeric" value="12" style="max-width:5rem"><button type="button" class="spz-icon-button">+</button></div></div>
  <p class="spz-note">Your plan has 3. With these settings the stack can add up to 14, to 17.</p>
  <p class="spz-note">It starts at 12, the fewest that give every movement below one direct set. You choose the number; no number is right for everyone, and you can change it any time.</p>
  <fieldset class="spz-fieldset"><legend>Days</legend><div class="spz-chips"><button class="spz-chip" aria-pressed="true">Day 01</button><button class="spz-chip" aria-pressed="true">Day 02</button><button class="spz-chip" aria-pressed="true">Day 03</button><button class="spz-chip" aria-pressed="true">Day 04</button></div></fieldset>
  <fieldset class="spz-fieldset"><legend>Added exercises a day</legend><div style="display:flex;gap:.5rem;align-items:center"><button class="spz-icon-button">−</button><b>4</b><button class="spz-icon-button">+</button></div></fieldset>
  <fieldset class="spz-fieldset"><legend>Minutes a day for these</legend><div class="spz-segment"><button aria-pressed="false">10</button><button aria-pressed="true">15</button><button aria-pressed="false">20</button><button aria-pressed="false">30</button></div></fieldset>
  <fieldset class="spz-fieldset"><legend>Holds (hangs, pinches)</legend><div class="spz-segment"><button aria-pressed="true">Off</button><button aria-pressed="false">On</button></div></fieldset>
  ${days.map(([head, rows]) => `<h3 class="spz-section-head" style="margin-top:.5rem">${head}</h3><ul class="spz-exercise-list" style="list-style:none;padding:0">${rows.map(row).join("")}</ul>`).join("")}
  <p class="spz-note" id="mock-summary">Adds 12 exercises: 12 direct sets a week on each arm, over 3 days, about 12–13 min a day.</p>
  <button type="button" class="spz-primary" id="mock-add" style="width:100%;min-height:3rem">Add to Plan Week 1</button>
  <p class="spz-note">Your own exercises and their sets stay as they are.</p>
  <p class="spz-note">Reaches 12 movements. No reviewed exercise trains these directly, so the stack cannot give them direct sets: palmaris longus (palmar fascia tension), extensor digiti minimi and extensor indicis (little- and index-finger extension). Band Finger Extension and the wrist curls in the stack work them as helpers. Palmaris longus is missing in some people.</p>
  <details class="spz-disclosure"><summary><span><b>Muscle by muscle, planned</b></span></summary></details>
  <p class="spz-note">This adds 12 direct sets a week where the plan had 0. You can start lower and add sets later.</p>`;
  host.prepend(d);
  const box = (sel) => document.querySelector(sel).getBoundingClientRect();
  const sy = window.scrollY;
  const controlsRows = Array.from(document.querySelectorAll(".mock-controls")).map((c) => new Set(Array.from(c.children).map((k) => Math.round(k.getBoundingClientRect().top))).size);
  const leave = Array.from(document.querySelectorAll(".mock-leave")).map((b) => b.getBoundingClientRect());
  return {
    sectionTop: Math.round(box("#mock-stack").top + sy), sectionHeight: Math.round(box("#mock-stack").height),
    totalControlTop: Math.round(box("#mock-total").top + sy), addButtonTop: Math.round(box("#mock-add").top + sy),
    totalToAddPx: Math.round(box("#mock-add").top - box("#mock-total").top),
    rowControlLines: controlsRows, rowControlsOnOneLine: controlsRows.every((n) => n === 1),
    rowHeight: Math.round(document.querySelector(".mock-row").getBoundingClientRect().height),
    leaveOutButton: [Math.round(leave[0].width), Math.round(leave[0].height)],
    horizontalOverflowPx: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
  };
}, P1);

for (const [w, h] of [[390, 844], [375, 667], [430, 932], [320, 568]]) {
  for (const mode of ["planned", "completed"]) {
    const { context, page } = await open(w, h, `&mode=${mode}`);
    const base = await layout(page);
    const stack = await mock(page);
    await page.evaluate(() => document.querySelector("#mock-total").scrollIntoView({ block: "start" }));
    await page.evaluate(() => window.scrollBy(0, -60));
    await page.waitForTimeout(150);
    let shotFile = null;
    if (mode === "planned" && (w === 390 || w === 375)) { shotFile = `stack-mock-total-${w}.png`; await page.screenshot({ path: join(outDir, shotFile) }); }
    // Tendon day columns: Completed, This week, "Exercises in this window" opened (the .spz-days the draft reuses).
    let dayCells = null;
    if (mode === "completed") {
      await page.evaluate(() => { const d = Array.from(document.querySelectorAll(".spz-disclosures > details")).find((x) => x.textContent.includes("Exercises in this window")); d.open = true; });
      await page.waitForTimeout(200);
      dayCells = await page.evaluate(() => Array.from(document.querySelectorAll(".spz-days .spz-day")).map((c) => [Math.round(c.getBoundingClientRect().width * 10) / 10, Math.round(c.getBoundingClientRect().height * 10) / 10, c.tagName]).slice(0, 7));
    }
    out.scenes.push({ viewport: `${w}x${h}`, mode, ...base, stackMock: stack, dayCells, shotFile });
    console.log(JSON.stringify(out.scenes.at(-1)));
    await context.close();
  }
}
writeFileSync(join(outDir, "measure.json"), JSON.stringify(out, null, 2));
await browser.close();
server.close();
