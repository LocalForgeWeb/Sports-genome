// Headless Chromium, iPhone emulation (viewport, isMobile, hasTouch, device scale 3), at a fixed clock
// (Wed 4 Nov 2026). Seeds the device workout log and opens: the logger on 435 (direction chips and the
// manual-resistance line), the logger on 437 (Setup open, then arms loaded differently), and Review's
// week board with the neck card. Usage: node capture.cjs <buildDir> <outDir>
const { execSync } = require("child_process");
const http = require("http");
const fs = require("fs");
const path = require("path");
const playwright = require(`${execSync("npm root -g").toString().trim()}/playwright`);
const [buildDir, outDir] = process.argv.slice(2);
const types = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml", ".glb": "model/gltf-binary", ".wasm": "application/wasm", ".webmanifest": "application/manifest+json" };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (url.startsWith("/api/")) { res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify({ result: { data: { json: null } } })); return; }
  let file = path.join(buildDir, url);
  if (!file.startsWith(buildDir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(buildDir, "index.html");
  res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
const set = (id) => ({ id, weight: "", reps: "", completed: false });
const active = (exercises) => [{ id: "device-live", title: "Day 01 · Neck & press workout", dayLabel: "Week 1 · Day 01 · Neck & press", startedAt: "2026-11-04T11:30:00.000Z", status: "active", restSeconds: 90, weightUnit: "kg", exercises }];
const neck435 = { id: "435-0", exerciseName: "Isometric Neck Lateral Flexion — Manual Resistance", catalogId: 435, plannedPrescription: "3 × 20 s", sets: [set("s1"), set("s2"), set("s3")] };
const press437 = { id: "437-1", exerciseName: "Plate-Loaded Incline Chest Press", catalogId: 437, plannedPrescription: "3 × 8", setup: { machine_model: "Hammer Strength Iso-Lateral", seat_or_bench_setting: "4" }, sets: [set("p1"), set("p2"), set("p3")] };
const doneAt = "2026-11-03T18:00:00.000Z";
const finished = [{
  id: "device-neck-1", title: "Neck workout", dayLabel: "Week 1 · Day 02 · Neck", startedAt: "2026-11-03T17:10:00.000Z", completedAt: doneAt, status: "completed", weightUnit: "kg",
  exercises: [
    { id: "f1", exerciseName: "Machine Neck Flexion", catalogId: 425, plannedPrescription: "3 × 12", sets: [{ weight: "15", reps: "12", unit: "kg", completed: true }, { weight: "15", reps: "12", unit: "kg", completed: true }, { weight: "15", reps: "10", unit: "kg", completed: true }] },
    { id: "f2", exerciseName: "Cable Harness Neck Lateral Flexion", catalogId: 431, plannedPrescription: "2 × 12", sets: [{ weight: "10", reps: "12", unit: "kg", headDirection: "left", completed: true }, { weight: "10", reps: "12", unit: "kg", headDirection: "right", completed: true }] },
    { id: "f3", exerciseName: "Isometric Neck Rotation — Manual Resistance", catalogId: 436, plannedPrescription: "2 × 20 s", sets: [{ weight: "", reps: "", holdSeconds: "20", headDirection: "right", completed: true }, { weight: "", reps: "", holdSeconds: "15", headDirection: "left", completed: true }, { weight: "", reps: "", holdSeconds: "20", completed: true }] },
    { id: "f4", exerciseName: "Isometric Neck Extension — Manual Resistance", catalogId: 434, plannedPrescription: "2 × 30 s", sets: [{ weight: "", reps: "", holdSeconds: "30", completed: true }, { weight: "", reps: "", holdSeconds: "25", completed: true }] },
  ],
}];
const scenes = [
  { name: "435-logger", query: "workspace=tracker", sessions: active([neck435, press437]), act: async () => {} },
  { name: "435-chosen", query: "workspace=tracker", sessions: active([neck435, press437]), act: async (page) => {
    await page.getByRole("button", { name: "Right", exact: true }).first().click();
    await page.locator(".live-set-entry input").first().fill("20");
  } },
  { name: "435-lower", query: "workspace=tracker", sessions: active([neck435, press437]), act: async (page) => {
    await page.locator(".live-set-entry input").first().fill("20");
    await page.locator(".live-set-commit").scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 120));
  } },
  { name: "437-setup", query: "workspace=tracker", sessions: active([{ ...neck435, sets: neck435.sets.map((item) => ({ ...item, completed: true, holdSeconds: "20", headDirection: "right" })) }, press437]), act: async (page) => {
    await page.locator(".live-set-setup > summary").click();
    await page.waitForTimeout(200);
    await page.locator(".live-set-setup").scrollIntoViewIfNeeded();
  } },
  { name: "437-arms", query: "workspace=tracker", sessions: active([{ ...neck435, sets: neck435.sets.map((item) => ({ ...item, completed: true, holdSeconds: "20", headDirection: "right" })) }, press437]), act: async (page) => {
    await page.getByRole("button", { name: "Arms loaded differently" }).click();
    const inputs = page.locator(".live-set-entry input");
    await inputs.nth(0).fill("40");
    await inputs.nth(1).fill("50");
    await inputs.nth(2).fill("8");
    await page.locator(".live-set-entry").scrollIntoViewIfNeeded();
  } },
  { name: "neck-week", query: "workspace=review", sessions: finished, act: async (page) => {
    await page.locator(".wr-neck").scrollIntoViewIfNeeded();
  } },
  { name: "neck-week-unknown", query: "workspace=review", sessions: finished, act: async (page) => {
    await page.getByRole("button", { name: /^Rotation · Unknown direction:/ }).scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 160));
  } },
  { name: "neck-week-open", query: "workspace=review", sessions: finished, act: async (page) => {
    await page.getByRole("button", { name: /^Rotation · Right:/ }).click();
    await page.locator(".wr-neck").scrollIntoViewIfNeeded();
  } },
];
(async () => {
  await new Promise((r) => server.listen(0, r));
  const base = `http://localhost:${server.address().port}`;
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await playwright.chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM || "/opt/pw-browsers/chromium" }).catch(() => playwright.chromium.launch());
  const report = [];
  for (const [w, h] of [[390, 844], [375, 667]]) {
    for (const scene of scenes) {
      const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
      const page = await context.newPage();
      await page.clock.install({ time: new Date("2026-11-04T12:00:00.000Z") });
      await page.addInitScript((seed) => {
        if (sessionStorage.getItem("seeded")) return;
        sessionStorage.setItem("seeded", "1");
        localStorage.setItem("sports-genome-launch-experience-enabled-v1", "off");
        localStorage.setItem("gym-optimizer-athlete-profile-v1", JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Muscle growth", trainingDays: 4, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "kg", sexForReference: "male", birthYear: 1995, bodyWeight: 82 } }));
        localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(seed));
      }, scene.sessions);
      await page.goto(`${base}/?${scene.query}`, { waitUntil: "load" });
      await page.waitForTimeout(3500);
      await scene.act(page);
      await page.waitForTimeout(400);
      const file = path.join(outDir, `${w}-${scene.name}.png`);
      await page.screenshot({ path: file, scale: "css" });
      // What a reviewer checks without the picture: horizontal overflow, and the smallest tap target and input text in the region shown.
      const metrics = await page.evaluate(() => {
        const overflow = document.documentElement.scrollWidth > window.innerWidth + 1;
        const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight; };
        const targets = Array.from(document.querySelectorAll(".live-set-card button, .live-set-card summary, .wr-neck button")).filter(visible).map((el) => ({ text: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 40), h: Math.round(el.getBoundingClientRect().height), w: Math.round(el.getBoundingClientRect().width) }));
        const inputs = Array.from(document.querySelectorAll(".live-set-card input")).filter(visible).map((el) => parseFloat(getComputedStyle(el).fontSize));
        return { overflow, smallTargets: targets.filter((t) => t.h < 44 || t.w < 44), minInputFont: inputs.length ? Math.min(...inputs) : null };
      });
      report.push({ file: path.basename(file), ...metrics });
      await context.close();
    }
  }
  fs.writeFileSync(path.join(outDir, "metrics.json"), JSON.stringify(report, null, 1));
  console.log(JSON.stringify(report, null, 1));
  await browser.close();
  server.close();
})().catch((e) => { console.error(e); process.exit(1); });
