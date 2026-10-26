// Headless Chromium, iPhone emulation (viewport, isMobile, hasTouch, scale 3): the forearm page, seeded with
// the forearmWeek fixture, at a fixed clock (16 Oct 2026). Usage: node capture.cjs <buildDir> <outDir> [query]
const { execSync } = require("child_process");
const http = require("http");
const fs = require("fs");
const path = require("path");
const playwright = require(`${execSync("npm root -g").toString().trim()}/playwright`);
const [buildDir, outDir, query = "workspace=specialization&region=forearm&map=drawing"] = process.argv.slice(2);
const week = JSON.parse(fs.readFileSync(path.join(__dirname, process.env.WEEK || "week.json"), "utf8"));
const types = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml", ".glb": "model/gltf-binary", ".wasm": "application/wasm", ".webmanifest": "application/manifest+json" };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (url.startsWith("/api/")) { res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify({ result: { data: { json: null } } })); return; }
  let file = path.join(buildDir, url);
  if (!file.startsWith(buildDir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(buildDir, "index.html");
  res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise((r) => server.listen(0, r));
  const base = `http://localhost:${server.address().port}`;
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await playwright.chromium.launch();
  for (const [w, h] of [[390, 844], [375, 667]]) {
    const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
    const page = await context.newPage();
    await page.clock.install({ time: new Date("2026-10-16T12:00:00.000Z") });
    await page.addInitScript((seed) => {
      if (sessionStorage.getItem("seeded")) return;
      sessionStorage.setItem("seeded", "1");
      localStorage.setItem("sports-genome-launch-experience-enabled-v1", "off");
      localStorage.setItem("gym-optimizer-athlete-profile-v1", JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Muscle growth", trainingDays: 4, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb", sexForReference: "male", birthYear: 1995, bodyWeight: 180 } }));
      localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(seed.sessions));
      localStorage.setItem("sports-genome-specialization-goals-v1", JSON.stringify(seed.goals));
    }, week);
    await page.goto(`${base}/?${query}`, { waitUntil: "load" });
    await page.waitForTimeout(4000);
    await page.evaluate(() => window.scrollTo(0, 0));
    const tag = `${w}`;
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    fs.writeFileSync(path.join(outDir, `${tag}-text.txt`), await page.evaluate(() => (document.querySelector("main") || document.body).innerText));
    let n = 0;
    for (let y = 0; y < total && n < 40; y += h - 80, n++) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(outDir, `${tag}-${String(n).padStart(2, "0")}.png`), scale: "css" });
    }
    console.log(tag, "height", total, "shots", n);
    await context.close();
  }
  await browser.close();
  server.close();
})().catch((e) => { console.error(e); process.exit(1); });
