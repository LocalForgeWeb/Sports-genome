// The drawing's canvas alone, at 390 px, scale 3, for the heavy week: palm and back views.
const { execSync } = require("child_process"); const http = require("http"); const fs = require("fs"); const path = require("path");
const playwright = require(`${execSync("npm root -g").toString().trim()}/playwright`);
const [buildDir, outDir] = process.argv.slice(2);
const week = JSON.parse(fs.readFileSync(path.join(__dirname, process.env.WEEK || "week.json"), "utf8"));
const types = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml" };
const server = http.createServer((req, res) => { const url = decodeURIComponent(new URL(req.url, "http://x").pathname); if (url.startsWith("/api/")) { res.writeHead(200, { "content-type": "application/json" }); res.end("{}"); return; } let file = path.join(buildDir, url); if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(buildDir, "index.html"); res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" }); fs.createReadStream(file).pipe(res); });
(async () => {
  await new Promise((r) => server.listen(0, r)); const base = `http://localhost:${server.address().port}`; fs.mkdirSync(outDir, { recursive: true });
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
  const page = await context.newPage(); await page.clock.install({ time: new Date("2026-10-16T12:00:00.000Z") });
  await page.addInitScript((seed) => { if (sessionStorage.getItem("seeded")) return; sessionStorage.setItem("seeded", "1"); localStorage.setItem("sports-genome-launch-experience-enabled-v1", "off"); localStorage.setItem("gym-optimizer-athlete-profile-v1", JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Muscle growth", trainingDays: 4, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb", sexForReference: "male", birthYear: 1995, bodyWeight: 180 } })); localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(seed.sessions)); localStorage.setItem("sports-genome-specialization-goals-v1", JSON.stringify(seed.goals)); }, week);
  for (const view of ["palm", "back"]) {
    await page.goto(`${base}/?workspace=specialization&region=forearm&fig=drawing${view === "palm" ? "" : `&view=${view}`}`, { waitUntil: "load" }); await page.waitForTimeout(3500);
    await page.locator(".spz-plate-stage").screenshot({ path: path.join(outDir, `stage-${view}.png`) });
  }
  await browser.close(); server.close();
})().catch((e) => { console.error(e); process.exit(1); });
