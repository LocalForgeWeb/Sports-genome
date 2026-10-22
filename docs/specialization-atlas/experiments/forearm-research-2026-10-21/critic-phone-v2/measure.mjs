// Critic experiment (phone lens, 21 Oct): where draft 11's "Design a stack" section lands, and how big it is,
// on origin/main's page (the supplied 3D forearm, the muscle rail, both arms as one). Headless Chromium
// emulating an iPhone (viewport, isMobile, hasTouch, deviceScaleFactor 3): not an iPhone, not Safari.
// Production client build of origin/main (4dac1ae), served from a scratch folder; localStorage seeded with
// the architect's plan A (3 days, 60 min, Muscle growth, Hammer Curl on Day 03).
// The stack section does not exist: it is mocked with the page's own classes, from the draft's §3.2 list,
// with plan A's 11 rows from architect-v2/stack-prototype-output.md, inserted where §3.2 puts it.
// Usage: node measure.mjs <build dir> <out dir>
import { createReadStream, existsSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";

const [buildDir, outDir] = process.argv.slice(2).map((d) => resolve(d));
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".json": "application/json", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json", ".glb": "model/gltf-binary", ".wasm": "application/wasm" };
const server = createServer((req, res) => {
  let file = join(buildDir, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!file.startsWith(buildDir) || !existsSync(file) || statSync(file).isDirectory()) file = join(buildDir, "index.html");
  res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const base = `http://127.0.0.1:${server.address().port}`;

const entries = (ids) => ids.map((id) => ({ entryId: id, catalogExerciseId: id }));
const planWeek = { customWorkoutIds: [], weeklyPlanIds: {}, weeklyPlanEntries: { "0-Push": entries([161, 1, 43, 103, 150]), "1-Pull": entries([41, 4, 66, 111, 121]), "2-Legs": entries([173, 2, 54, 186, 132]) }, prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: {}, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 0 };
const plan = { version: 2, ...planWeek, weeks: { "1": planWeek }, activeWeek: 1 };

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] }).catch(() => chromium.launch());
const out = { note: "Headless Chromium emulating an iPhone (viewport, isMobile, hasTouch, deviceScaleFactor 3); not an iPhone, not Safari. origin/main build; stack section mocked with the page's own CSS classes from draft 11 §3.2.", scenes: [] };

async function open(width, height, query) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, timezoneId: "UTC", locale: "en-US" });
  const page = await context.newPage();
  await page.route("**/api/trpc/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(new URL(route.request().url()).searchParams.get("batch") ? [{ result: { data: { json: null } } }] : { result: { data: { json: null } } }) }));
  await page.addInitScript((seed) => {
    if (sessionStorage.getItem("seeded")) return;
    sessionStorage.setItem("seeded", "1");
    localStorage.setItem("sports-genome-launch-experience-enabled-v1", "off");
    localStorage.setItem("gym-optimizer-athlete-profile-v1", JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Muscle growth", trainingDays: 3, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb", sexForReference: "male", birthYear: 1995, bodyWeight: 180 } }));
    localStorage.setItem("gym-optimizer-workout-plan-v1", JSON.stringify(seed.plan));
  }, { plan });
  await page.goto(`${base}/?workspace=specialization&region=forearm${query}`);
  await page.locator(".spz-row").first().waitFor({ timeout: 30000 });
  await page.waitForTimeout(1500);
  return { context, page };
}

const layout = (page) => page.evaluate(() => {
  const y = (el) => (el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : null);
  const b = (el) => (el ? Math.round(el.getBoundingClientRect().bottom + window.scrollY) : null);
  const dock = document.querySelector(".mobile-workspace-dock");
  const firstDisc = document.querySelector(".spz-disclosures > details");
  const cs = firstDisc ? getComputedStyle(firstDisc) : null;
  const findings = document.getElementById("spz-findings-title")?.closest("section");
  const list = document.getElementById("spz-list-title")?.closest("section");
  const map = document.querySelector(".spz-map");
  return {
    dockTop: dock ? Math.round(dock.getBoundingClientRect().top) : null,
    railTop: y(document.querySelector(".sg-anatomy3d-rail")),
    stageTop: y(document.querySelector(".sg-anatomy3d-stage")), stageBottom: b(document.querySelector(".sg-anatomy3d-stage")),
    panelText: document.querySelector(".sg-anatomy3d-detail")?.textContent?.slice(0, 160) ?? null,
    mapBottom: b(map),
    windowLine: document.querySelector(".spz-window")?.textContent ?? null,
    muscleListTop: y(list), muscleListHeight: list ? Math.round(list.getBoundingClientRect().height) : null,
    findingsTop: y(findings), findingsHeight: findings ? Math.round(findings.getBoundingClientRect().height) : null,
    findingTitles: Array.from(document.querySelectorAll(".spz-finding strong")).map((n) => n.textContent),
    firstDisclosureTop: y(firstDisc),
    disclosureContentWidth: firstDisc ? Math.round(firstDisc.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) : null,
    documentHeight: document.documentElement.scrollHeight,
  };
});

// Plan A at its starting value (architect-v2/stack-prototype-output.md "A · total start value (14)"), as draft §3.2 item 5 words rows.
const shared = { 407: "Shared between flexor carpi radialis, extensor carpi radialis longus and brevis; the evidence does not split it.", 408: "Shared between flexor carpi ulnaris and extensor carpi ulnaris; the evidence does not split it.", 405: "Shared between pronator teres and pronator quadratus; the evidence does not split it.", 401: "Shared between flexor digitorum superficialis and profundus; the evidence does not split it.", 413: "Shared between extensor pollicis brevis and longus; the evidence does not split it." };
const A = [
  ["Day 01 · Push · adds 4 · about 48 of your 60 min", [[140, "Reverse Wrist Curl", "1 × 10–25", "Wrist extension: no direct work this week"], [407, "Lever Radial Deviation", "1 × 10–25 each arm", "Radial deviation: no direct work this week"], [139, "Wrist Curl", "1 × 10–25", "Wrist flexion: no direct work this week"], [408, "Lever Ulnar Deviation", "1 × 10–25 each arm", "Ulnar deviation: no direct work this week"]]],
  ["Day 02 · Pull · adds 4 · about 48 of your 60 min", [[405, "Lever Pronation", "1 × 10–20 each arm", "Pronation: no direct work this week"], [401, "Finger Curl", "1 × 10–25", "Finger flexion: no direct work this week"], [404, "Band Finger Extension", "1 × 10–25", "Finger extension: no direct work this week"], [413, "Band Thumb Extension", "1 × 12–25 each arm", "Thumb extension: no direct work this week"]]],
  ["Day 03 · Legs · adds 3 · about 46 of your 60 min", [[406, "Lever Supination", "1 × 10–20 each arm", "Supination: no direct work this week"], [412, "Band Thumb Flexion", "1 × 12–25 each arm", "Thumb-tip flexion: no direct work this week"], [414, "Band Thumb Abduction", "1 × 12–25 each arm", "Thumb abduction: no direct work this week"]]],
];

const mock = (page, days) => page.evaluate(({ days, shared }) => {
  const host = document.querySelector(".spz-disclosures");
  const d = document.createElement("details");
  d.className = "spz-disclosure spz-card"; d.id = "mock-stack"; d.open = true;
  const stepper = (label, n) => `<span class="mock-stepper" style="display:inline-flex;align-items:center;gap:.25rem"><button type="button" class="spz-icon-button" aria-label="${label} fewer">−</button><b style="min-width:1.5rem;text-align:center">${n}</b><button type="button" class="spz-icon-button" aria-label="${label} more">+</button></span>`;
  const row = ([id, name, rx, why]) => `<li class="mock-row" style="display:grid;gap:.35rem;padding:.55rem 0;border-bottom:1px solid rgb(164 200 232 / .14)"><span style="display:grid"><b>${name}</b><small>${rx}</small></span><small>${why}</small>${shared[id] ? `<small>${shared[id]}</small>` : ""}
    <div class="mock-controls" style="display:flex;flex-wrap:wrap;gap:.5rem;align-items:center">${stepper("One set", 1)}<button type="button" class="spz-button mock-change" aria-expanded="false">Change</button><button type="button" class="spz-button mock-leave">Leave out</button></div></li>`;
  d.innerHTML = `<summary id="mock-summary"><span><b>Design a stack</b><small>Plan Week 1 · 3 direct forearm sets a week now</small></span></summary>
  <p class="spz-note" id="mock-lede">Choose how many direct forearm sets you want a week. The app gives each movement your plan does not train yet a set, evens the rest out muscle by muscle, and puts them on your plan days. Nothing changes until you tap Add.</p>
  <p class="spz-note">Plan Week 1 has 3 direct forearm sets (Hammer Curl, Day 03). Its other 18 forearm sets are grip and steadying in rows and deadlifts, which are not counted here.</p>
  <div class="spz-field" id="mock-total"><span>Direct forearm sets a week</span><div style="display:flex;gap:.5rem;align-items:center"><button type="button" class="spz-icon-button">−</button><input id="mock-input" inputmode="numeric" value="14" style="max-width:5rem;font-size:16px;min-height:2.75rem"><button type="button" class="spz-icon-button">+</button></div></div>
  <p class="spz-note">Your plan has 3. With these settings the stack can add up to 33.</p>
  <p class="spz-note">It starts at 14: one set for each movement your plan does not train directly yet. You choose the number; no number suits everyone, and you can change it any time.</p>
  <fieldset class="spz-fieldset"><legend>Days</legend><div class="spz-chips"><button class="spz-chip" aria-pressed="true">Day 01 · Push</button><button class="spz-chip" aria-pressed="true">Day 02 · Pull</button><button class="spz-chip" aria-pressed="true">Day 03 · Legs</button></div></fieldset>
  <fieldset class="spz-fieldset"><legend>Forearm exercises a day</legend>${stepper("One exercise", 4)}<small>Your plan's own forearm exercises included.</small></fieldset>
  <fieldset class="spz-fieldset"><legend>Holds</legend><div class="spz-segment"><button aria-pressed="true">Off</button><button aria-pressed="false">On</button></div></fieldset>
  ${days.map(([head, rows]) => `<h3 class="spz-section-head mock-dayhead" style="margin-top:.5rem">${head}</h3><ul class="spz-exercise-list" style="list-style:none;padding:0">${rows.map(row).join("")}</ul>`).join("")}
  <p class="spz-note" id="mock-preview">Direct forearm sets 3 → 14 · muscles with direct work 1 → 16 of 19 · about 8–10 min more a day</p>
  <details class="spz-disclosure"><summary><span><b>See each muscle</b></span></summary></details>
  <p class="spz-note">No reviewed exercise trains these directly, so the stack cannot give them direct sets: palmaris longus (tensing the palm), extensor digiti minimi and extensor indicis (straightening the little and index finger on their own). Band Finger Extension and the wrist curls work them as helpers. Palmaris longus is missing in some people.</p>
  <button type="button" class="spz-primary" id="mock-add" style="width:100%;min-height:3rem">Add 11 exercises to Week 1</button>
  <p class="spz-note">Your own exercises and their sets stay as they are.</p>`;
  host.prepend(d);
  const sy = window.scrollY;
  const box = (sel) => document.querySelector(sel).getBoundingClientRect();
  const controlsRows = Array.from(document.querySelectorAll(".mock-controls")).map((c) => new Set(Array.from(c.children).map((k) => Math.round(k.getBoundingClientRect().top))).size);
  const rows = Array.from(document.querySelectorAll(".mock-row")).map((r) => Math.round(r.getBoundingClientRect().height));
  return {
    sectionTop: Math.round(box("#mock-stack").top + sy), sectionHeight: Math.round(box("#mock-stack").height),
    totalControlTop: Math.round(box("#mock-total").top + sy),
    firstDayHeadTop: Math.round(document.querySelector(".mock-dayhead").getBoundingClientRect().top + sy),
    previewTop: Math.round(box("#mock-preview").top + sy), addButtonTop: Math.round(box("#mock-add").top + sy),
    totalToPreviewPx: Math.round(box("#mock-preview").top - box("#mock-total").top),
    totalToAddPx: Math.round(box("#mock-add").top - box("#mock-total").top),
    rowControlLines: controlsRows, rowHeights: rows, rowsTotal: rows.reduce((a, b) => a + b, 0),
    inputFontPx: parseFloat(getComputedStyle(document.querySelector("#mock-input")).fontSize),
    horizontalOverflowPx: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
  };
}, { days, shared });

for (const [w, h] of [[390, 844], [375, 667], [430, 932]]) {
  for (const mode of ["planned", "completed"]) {
    const { context, page } = await open(w, h, `&mode=${mode}`);
    const base = await layout(page);
    let shot = null;
    if (mode === "planned" && w !== 430) { shot = `main-first-screen-${w}.png`; await page.screenshot({ path: join(outDir, shot) }); }
    const stack = await mock(page, A);
    const screens = (px) => Math.round((px / (base.dockTop ?? h)) * 10) / 10;
    let shot2 = null;
    if (mode === "planned" && w !== 430) {
      await page.evaluate(() => { document.querySelector("#mock-total").scrollIntoView({ block: "start" }); window.scrollBy(0, -70); });
      await page.waitForTimeout(200);
      shot2 = `stack-total-${w}.png`; await page.screenshot({ path: join(outDir, shot2) });
      await page.evaluate(() => { document.querySelector(".mock-dayhead").scrollIntoView({ block: "start" }); window.scrollBy(0, -70); });
      await page.waitForTimeout(200);
      await page.screenshot({ path: join(outDir, `stack-rows-${w}.png`) });
    }
    out.scenes.push({ viewport: `${w}x${h}`, mode, ...base, stackMock: stack, sectionTopInScreens: screens(stack.sectionTop), totalToAddInScreens: screens(stack.totalToAddPx), totalToPreviewInScreens: screens(stack.totalToPreviewPx), shots: [shot, shot2].filter(Boolean) });
    console.log(JSON.stringify(out.scenes.at(-1)));
    await context.close();
  }
}
writeFileSync(join(outDir, "measure.json"), JSON.stringify(out, null, 2));
await browser.close();
server.close();
