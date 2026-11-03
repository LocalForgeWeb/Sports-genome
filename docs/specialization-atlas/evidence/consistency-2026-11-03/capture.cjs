// Headless Chromium, iPhone emulation (viewport, isMobile, hasTouch, scale 3): the screens the 3 Nov
// consistency pass changed. Usage: node capture.cjs <buildDir> <outDir>
const { execSync } = require("child_process"); const http = require("http"); const fs = require("fs"); const path = require("path");
const playwright = require(`${execSync("npm root -g").toString().trim()}/playwright`);
const [buildDir, outDir] = process.argv.slice(2);
const week = JSON.parse(fs.readFileSync(path.join(__dirname, "../cleanup-2026-10-26/week.json"), "utf8"));
const types = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".json": "application/json", ".glb": "model/gltf-binary" };
const server = http.createServer((req, res) => { const url = decodeURIComponent(new URL(req.url, "http://x").pathname); if (url.startsWith("/api/")) { res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify({ result: { data: { json: null } } })); return; } let file = path.join(buildDir, url); if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(buildDir, "index.html"); res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" }); fs.createReadStream(file).pipe(res); });
// A built week: four days, so the week board has planned sets per muscle to paint.
const plan = { version: 2, customWorkoutIds: [], weeklyPlanIds: { "0-Upper": [1, 2, 437, 132, 139], "1-Lower": [164, 421, 422], "2-Upper": [14, 442, 441, 140], "3-Lower": [423, 425, 433] }, prescriptions: {}, exerciseSettings: {}, activeWeek: 1 };
const scenes = [
  { name: "review-week", query: "workspace=review", act: async (page) => { const el = page.locator(".wr-exposure").first(); if (await el.count()) await el.scrollIntoViewIfNeeded(); } },
  { name: "detail-437", query: "workspace=catalog", act: async (page) => { await page.getByPlaceholder(/Search/).first().fill("plate-loaded incline"); await page.waitForTimeout(500); await page.getByText("Plate-Loaded Incline Chest Press").first().click(); await page.waitForTimeout(1200); await page.getByRole("heading", { name: "How a set is logged" }).scrollIntoViewIfNeeded(); } },
  { name: "detail-435-mapped", query: "workspace=catalog", act: async (page) => { await page.getByPlaceholder(/Search/).first().fill("isometric neck lateral"); await page.waitForTimeout(500); await page.getByText("Isometric Neck Lateral Flexion — Manual Resistance").first().click(); await page.waitForTimeout(1200); await page.getByRole("heading", { name: "How this is mapped" }).scrollIntoViewIfNeeded(); } },
  { name: "forearm-ledger", query: "workspace=specialization&region=forearm&fig=drawing&node=forearm.br", act: async (page) => { await page.getByRole("button", { name: /Inspect coverage/ }).first().click(); await page.waitForTimeout(800); await page.getByRole("heading", { name: "Where the numbers come from" }).scrollIntoViewIfNeeded(); await page.locator(".spz-ledger details").first().evaluate((d) => { d.open = true; }); await page.waitForTimeout(300); } },
];
(async () => {
  await new Promise((r) => server.listen(0, r)); const base = `http://localhost:${server.address().port}`; fs.mkdirSync(outDir, { recursive: true });
  const browser = await playwright.chromium.launch();
  for (const [w, h] of [[390, 844], [375, 667]]) for (const scene of scenes) {
    const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
    const page = await context.newPage(); await page.clock.install({ time: new Date("2026-10-16T12:00:00.000Z") });
    await page.addInitScript(([seed, planJson]) => { if (sessionStorage.getItem("seeded")) return; sessionStorage.setItem("seeded", "1"); localStorage.setItem("sports-genome-launch-experience-enabled-v1", "off"); localStorage.setItem("gym-optimizer-athlete-profile-v1", JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Muscle growth", trainingDays: 4, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb", sexForReference: "male", birthYear: 1995, bodyWeight: 180 } })); localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(seed.sessions)); localStorage.setItem("sports-genome-specialization-goals-v1", JSON.stringify(seed.goals)); localStorage.setItem("gym-optimizer-workout-plan-v1", planJson); }, [week, JSON.stringify(plan)]);
    try {
      await page.goto(`${base}/?${scene.query}`, { waitUntil: "load" }); await page.waitForTimeout(3000);
      await scene.act(page); await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(outDir, `${w}-${scene.name}.png`), scale: "css" });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      console.log(w, scene.name, "overflow", overflow);
    } catch (error) { console.log(w, scene.name, "FAILED", String(error).split("\n")[0]); }
    await context.close();
  }
  await browser.close(); server.close();
})().catch((e) => { console.error(e); process.exit(1); });
