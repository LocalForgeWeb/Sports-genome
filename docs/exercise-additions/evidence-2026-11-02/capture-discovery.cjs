// Headless Chromium, iPhone emulation (viewport, isMobile, hasTouch, device scale 3): lane D's screens.
// Usage: node capture-d.cjs <buildDir> <outDir>
const { execSync } = require("child_process");
const http = require("http");
const fs = require("fs");
const path = require("path");
const playwright = require(`${execSync("npm root -g").toString().trim()}/playwright`);
const [buildDir, outDir] = process.argv.slice(2);
const types = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".glb": "model/gltf-binary", ".wasm": "application/wasm", ".webmanifest": "application/manifest+json", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (url.startsWith("/api/")) { res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify({ result: { data: { json: null } } })); return; }
  let file = path.join(buildDir, url);
  if (!file.startsWith(buildDir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(buildDir, "index.html");
  res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
const profile = { version: 3, sportId: "wrestling", sportContextMode: "sport", goal: "Max strength", trainingDays: 4, gymMinutes: 60, movementId: "wrestling-19", baseline: { experience: "Intermediate", weightUnit: "kg", sexForReference: "male", birthYear: 1995, bodyWeight: 80, equipment: { gymAccess: "Commercial gym", availableEquipment: ["Bodyweight", "Band", "Dumbbells", "Kettlebell", "Barbell", "Cable", "Machine", "Landmine", "Medicine ball", "Sled"] } } };
async function shoot(page, name) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(outDir, `${name}.png`), scale: "css" }); }
async function scrollInspector(page, top) { await page.evaluate((y) => { const body = document.querySelector(".exercise-intelligence-body"); if (body) body.scrollTo(0, y); }, top); }
(async () => {
  await new Promise((r) => server.listen(0, r));
  const base = `http://localhost:${server.address().port}`;
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await playwright.chromium.launch();
  const report = [];
  for (const [w, h] of [[390, 844], [375, 667]]) {
    const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
    await context.route(/cdn\.jsdelivr\.net/, (route) => route.abort());
    const page = await context.newPage();
    await page.addInitScript((seed) => {
      if (sessionStorage.getItem("seeded")) return;
      sessionStorage.setItem("seeded", "1");
      localStorage.setItem("sports-genome-launch-experience-enabled-v1", "off");
      localStorage.setItem("gym-optimizer-athlete-profile-v1", JSON.stringify(seed));
    }, profile);
    // 1. The catalog, "zercher".
    await page.goto(`${base}/?workspace=catalog`, { waitUntil: "load" });
    await page.waitForTimeout(2500);
    const search = page.getByRole("textbox", { name: "Search exercises" }).first();
    await search.fill("zercher");
    await page.waitForTimeout(800);
    const first = page.locator(".catalog-discovery-row").first();
    await first.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -140));
    await shoot(page, `${w}-catalog-zercher-1`);
    await page.evaluate(() => window.scrollBy(0, window.innerHeight - 120));
    await shoot(page, `${w}-catalog-zercher-2`);
    report.push(`${w} catalog rows: ${await page.locator(".catalog-discovery-row").count()} | ${(await page.locator(".catalog-discovery-row .catalog-discovery-identity small").allTextContents()).join(" / ")}`);
    // 2. The detail of 435 and 437.
    for (const [query, name, tag] of [["isometric neck lateral", "Isometric Neck Lateral Flexion — Manual Resistance", "435"], ["plate-loaded incline", "Plate-Loaded Incline Chest Press", "437"]]) {
      await search.fill(query);
      await page.waitForTimeout(600);
      await page.getByRole("button", { name: `Inspect ${name}` }).first().click();
      await page.waitForTimeout(1500);
      const height = await page.evaluate(() => document.querySelector(".exercise-intelligence-body")?.scrollHeight ?? 0);
      const view = await page.evaluate(() => document.querySelector(".exercise-intelligence-body")?.clientHeight ?? 0);
      let n = 0;
      for (let y = 0; y < height && n < 6; y += view - 60, n++) { await scrollInspector(page, y); await shoot(page, `${w}-detail-${tag}-${n}`); }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      const smallTargets = await page.evaluate(() => Array.from(document.querySelectorAll(".ei-view a, .ei-view button")).filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.height < 44 && !el.closest(".ei-row-head") && !el.classList.contains("ei-help")); }).map((el) => `${el.textContent?.slice(0, 30)} ${Math.round(el.getBoundingClientRect().height)}`));
      report.push(`${w} detail ${tag}: ${n} shots, overflow ${overflow}px, targets under 44px: ${smallTargets.join("; ") || "none"}`);
      await page.getByRole("button", { name: "Close exercise intelligence" }).click();
      await page.waitForTimeout(600);
    }
    // 3. Body Lab's Neck row.
    await page.goto(`${base}/?workspace=body`, { waitUntil: "load" });
    await page.waitForTimeout(2500);
    const neck = page.getByRole("list", { name: "Regions not drawn on the figure" }).getByRole("button", { name: /Neck/ });
    await neck.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -260));
    await shoot(page, `${w}-bodylab-neck-row`);
    await neck.click();
    await page.waitForTimeout(800);
    const strip = page.locator(".atlas-selected-strip");
    await strip.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -120));
    await shoot(page, `${w}-bodylab-neck-selected`);
    const box = await neck.boundingBox();
    report.push(`${w} body lab neck row height ${box ? Math.round(box.height) : "?"}px; strip: ${(await strip.innerText()).replace(/\n/g, " | ")}`);
    const browse = page.getByRole("button", { name: /Browse neck exercises/ }).first();
    await browse.click();
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await shoot(page, `${w}-catalog-neck-mode`);
    report.push(`${w} neck mode heading: ${await page.getByRole("heading", { level: 1 }).first().innerText()} | rows ${await page.locator(".catalog-discovery-row").count()}`);
    await context.close();
  }
  await browser.close();
  server.close();
  fs.writeFileSync(path.join(outDir, "report.txt"), report.join("\n") + "\n");
  console.log(report.join("\n"));
})().catch((e) => { console.error(e); process.exit(1); });
