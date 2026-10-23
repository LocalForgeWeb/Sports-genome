/**
 * Phone screenshots of the forearm's Drawing as the owner's rendered plates (23 Oct 2026).
 * Headless Chromium emulating an iPhone (390 × 844 and 375 × 667, isMobile, hasTouch,
 * deviceScaleFactor 3, en-US, UTC): not an iPhone, not Safari.
 *
 *   npx vite build --outDir <build>
 *   node docs/specialization-atlas/evidence/forearm-plates/capture.mjs <build> <out dir>
 *
 * The device stores are seeded with a week of forearm work (curls, wrist curls both ways, a
 * reverse curl, a cable wrist extension and holds), so the plates show several steps of the ramp.
 * For each width: the three views at surface; the palm's deep layer; a muscle chosen by a touch
 * tap on the plate itself; a deep muscle opened from the address (the plates move to its pass);
 * the Target colouring; the page with nothing logged. Then 320 × 568 for sideways scroll. Prints
 * what each scene read: the pass shown, the chip pressed, the requests made for plate images
 * (none until Drawing is chosen), the chips' sizes and any horizontal overflow.
 * The PNGs here were reduced to 256 colours afterwards with Pillow, and the map-card shots to two
 * device pixels per CSS pixel (the viewport shots keep three).
 */
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { join, extname } from "node:path";

const [buildDir, outDir] = process.argv.slice(2);
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".json": "application/json", ".woff2": "font/woff2", ".glb": "model/gltf-binary", ".wasm": "application/wasm" };
const server = createServer((req, res) => { let f = join(buildDir, decodeURIComponent(new URL(req.url, "http://x").pathname)); if (!existsSync(f) || statSync(f).isDirectory()) f = join(buildDir, "index.html"); res.writeHead(200, { "content-type": types[extname(f)] ?? "application/octet-stream" }); createReadStream(f).pipe(res); });
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const base = `http://127.0.0.1:${server.address().port}`;

const DAY = 86_400_000; const todayKey = new Date().toISOString().slice(0, 10);
const mondayMs = (() => { const d = new Date(`${todayKey}T00:00:00Z`); return d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY; })();
const at = (o, h) => new Date(mondayMs + o * DAY + h * 3_600_000).toISOString();
const set = (w, r, x = {}) => ({ weight: String(w), reps: String(r), unit: "lb", completed: true, ...x });
const hold = (s) => ({ weight: "", reps: "", holdSeconds: String(s), unit: "lb", completed: true });
const workout = (id, o, label, exercises) => ({ id, title: label, dayLabel: `Week 1 · ${label}`, startedAt: at(o, 7), completedAt: at(o, 8), status: "completed", exercises });
const ex = (id, catalogId, exerciseName, sets) => ({ id, exerciseName, catalogId, plannedPrescription: `${sets.length} × 12`, sets });
const times = (n, make) => Array.from({ length: n }, make);
const loggedWeek = [
  workout("s1", 0, "Day 01 · Upper", [ex("e1", 139, "Wrist Curl", times(6, () => set(60, 15))), ex("e2", 132, "Hammer Curl", times(4, () => set(30, 12)))]),
  workout("s2", 0, "Day 02 · Lower", [ex("e3", 140, "Reverse Wrist Curl", times(3, () => set(30, 15))), ex("e4", 135, "Reverse Curl", times(2, () => set(50, 12))), ex("e5", 143, "Dead Hang", [hold(40), hold(35)])]),
  workout("s3", 0, "Day 03 · Arms", [ex("e6", 350, "Cable Wrist Extension", times(5, () => set(20, 15))), ex("e7", 410, "One-Arm Dumbbell Wrist Curl", times(8, () => set(25, 15)))]),
];
const goals = [{ id: "fcu", regionId: "forearm", nodeId: "forearm.fcu", actionId: null, side: "right", metric: "direct_dynamic_bouts", target: 20, period: "calendar_week", startsOn: new Date(mondayMs - 7 * DAY).toISOString().slice(0, 10), endsOn: null, timezone: "UTC", createdAt: at(-7, 8), updatedAt: at(-7, 8) }, { id: "ed", regionId: "forearm", nodeId: "forearm.ed", actionId: null, side: "right", metric: "direct_dynamic_bouts", target: 6, period: "calendar_week", startsOn: new Date(mondayMs - 7 * DAY).toISOString().slice(0, 10), endsOn: null, timezone: "UTC", createdAt: at(-7, 8), updatedAt: at(-7, 8) }];
const entries = (ids) => ids.map((id) => ({ entryId: id, catalogExerciseId: id }));
const planWeek = { customWorkoutIds: [], weeklyPlanIds: {}, weeklyPlanEntries: { "0-Upper": entries([139, 132]), "1-Lower": entries([140]), "2-Upper": entries([350, 410]) }, prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: {}, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 0 };
const plan = { version: 2, ...planWeek, weeks: { "1": planWeek }, activeWeek: 1 };

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const out = [];

async function open(width, height, path, { sessions = loggedWeek } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, timezoneId: "UTC", locale: "en-US" });
  const page = await context.newPage();
  const plateRequests = [];
  // The app's requests for plate images (this script's own read of a label image, to aim a tap, is marked ?probe and left out).
  page.on("request", (request) => { const url = new URL(request.url()); if (url.pathname.includes("/assets/anatomy/forearm-plates/") && !url.searchParams.has("probe")) plateRequests.push(url.pathname.split("/").pop()); });
  await page.route("**/api/trpc/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(new URL(route.request().url()).searchParams.get("batch") ? [{ result: { data: { json: null } } }] : { result: { data: { json: null } } }) }));
  await page.addInitScript((seed) => {
    if (sessionStorage.getItem("seeded")) return; sessionStorage.setItem("seeded", "1");
    localStorage.setItem("sports-genome-launch-experience-enabled-v1", "off");
    localStorage.setItem("gym-optimizer-athlete-profile-v1", JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Muscle growth", trainingDays: 4, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb", sexForReference: "male", birthYear: 1995, bodyWeight: 180 } }));
    localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(seed.sessions));
    localStorage.setItem("gym-optimizer-workout-plan-v1", JSON.stringify(seed.plan));
    localStorage.setItem("sports-genome-specialization-goals-v1", JSON.stringify(seed.goals));
  }, { sessions, plan, goals });
  await page.goto(`${base}${path}`);
  await page.locator(".spz-page").waitFor({ timeout: 30000 });
  await page.locator(".spz-row").first().waitFor({ timeout: 30000 });
  return { context, page, plateRequests };
}
const overflow = (page) => page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth));
const ready = (page) => page.locator(".spz-plate[data-status='ready']").waitFor({ timeout: 30000 });
const settle = (page) => page.waitForTimeout(350);
/**
 * The whole map card. The sticky tab row and the bottom dock are hidden for these shots only (they
 * would sit over the card wherever it is scrolled); the viewport shots keep them. The plate's height
 * follows the screen's (svh), and a full-page capture enlarges the screen, so the plate is held at
 * the height it has on the phone while the card is captured.
 */
async function shootCard(page, file) {
  const card = page.locator(".spz-map");
  const plateHeight = await page.locator(".spz-plate-canvas").evaluate((node) => node.getBoundingClientRect().height);
  const hide = await page.addStyleTag({ content: `.mobile-workspace-dock, .workspace-top-switcher-shell { visibility: hidden !important; } .spz-plate-canvas { height: ${plateHeight}px !important; }` });
  await card.evaluate((node) => node.scrollIntoView({ block: "start" }));
  await settle(page);
  const box = await card.evaluate((node) => { const rect = node.getBoundingClientRect(); return { x: rect.left + window.scrollX, y: rect.top + window.scrollY, width: rect.width, height: rect.height }; });
  await page.screenshot({ path: `${outDir}/${file}`, fullPage: true, clip: box });
  await hide.evaluate((node) => node.remove());
}
async function read(page, scene, width, plateRequests) {
  const figure = page.locator(".spz-plate");
  const chips = await page.locator(".spz-plate-chip").evaluateAll((nodes) => nodes.map((node) => { const box = node.getBoundingClientRect(); return { node: node.dataset.node, fill: node.dataset.fill, pressed: node.getAttribute("aria-pressed") === "true", width: Math.round(box.width * 10) / 10, height: Math.round(box.height * 10) / 10 }; }));
  const canvas = await page.locator(".spz-plate-canvas").boundingBox();
  const controls = await page.locator(".spz-map .spz-segment button").evaluateAll((nodes) => nodes.map((node) => ({ text: node.textContent, pressed: node.getAttribute("aria-pressed"), height: Math.round(node.getBoundingClientRect().height * 10) / 10 })));
  out.push({
    scene, width,
    pass: await figure.getAttribute("data-pass").catch(() => null),
    canvas: canvas && { width: Math.round(canvas.width), height: Math.round(canvas.height) },
    chips, smallestChip: chips.length ? Math.min(...chips.flatMap((chip) => [chip.width, chip.height])) : null,
    controls: controls.filter((item) => /Palm|Back|Thumb|Surface|Deep|Volume|Target|Drawing|3D/.test(item.text)),
    plateRequests: [...plateRequests],
    note: await page.locator(".spz-plate .spz-diagram-note").textContent().catch(() => null),
    overflowX: await overflow(page),
  });
}
/** A touch tap on the plate at a pixel of the given muscle (read from the label image the page loaded). */
async function tapMuscle(page, nodeId) {
  const point = await page.evaluate(async (wanted) => {
    const figure = document.querySelector(".spz-plate");
    const canvas = figure.querySelector("canvas");
    const chips = Array.from(figure.querySelectorAll(".spz-plate-chip")).map((chip) => chip.dataset.node);
    const label = chips.indexOf(wanted) + 1;
    const pass = figure.dataset.pass;
    const image = new Image();
    image.src = `/assets/anatomy/forearm-plates/${pass}.labels.png?probe`;
    await image.decode();
    const scratch = document.createElement("canvas");
    scratch.width = image.naturalWidth; scratch.height = image.naturalHeight;
    const context = scratch.getContext("2d");
    context.drawImage(image, 0, 0);
    const data = context.getImageData(0, 0, scratch.width, scratch.height).data;
    // The muscle's pixel farthest inside it: the most same-label pixels in a 9 × 9 square.
    let best = null;
    for (let y = 4; y < scratch.height - 4; y += 2) for (let x = 4; x < scratch.width - 4; x += 2) {
      if (data[(y * scratch.width + x) * 4] !== label) continue;
      let count = 0;
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) if (data[((y + dy) * scratch.width + x + dx) * 4] === label) count++;
      if (!best || count > best.count) best = { x, y, count };
    }
    canvas.scrollIntoView({ block: "center" });
    const rect = canvas.getBoundingClientRect();
    return { x: rect.left + (best.x + 0.5) * rect.width / scratch.width, y: rect.top + (best.y + 0.5) * rect.height / scratch.height };
  }, nodeId);
  await settle(page);
  await page.touchscreen.tap(point.x, point.y);
  await settle(page);
  return point;
}

for (const [w, h] of [[390, 844], [375, 667]]) {
  // Opened on the 3D model: no plate image is requested. Then Drawing: only the palm's surface pass.
  // (A context of its own: the model keeps SwiftShader busy, so the screenshots are taken in the next.)
  {
    const { context, page, plateRequests } = await open(w, h, "/?workspace=specialization&region=forearm&fig=model");
    await page.waitForTimeout(3000);
    const beforeDrawing = [...plateRequests];
    await page.getByRole("button", { name: "Drawing", exact: true }).click();
    await ready(page);
    out.push({ scene: "opened on the 3D model, then Drawing", width: w, requestsBeforeDrawing: beforeDrawing, requestsAfterDrawing: [...plateRequests] });
    await context.close();
  }
  {
    const { context, page, plateRequests } = await open(w, h, "/?workspace=specialization&region=forearm&fig=drawing");
    await ready(page);
    await shootCard(page, `plates-${w}-palm-surface.png`);
    await read(page, "palm surface", w, plateRequests);
    for (const [view, file] of [["Back", "back-surface"], ["Thumb side", "thumb-surface"]]) {
      await page.locator(".spz-map .spz-segment[aria-label='View'] button", { hasText: view }).click();
      await ready(page);
      await shootCard(page, `plates-${w}-${file}.png`);
      await read(page, `${view} surface`, w, plateRequests);
    }
    await page.locator(".spz-map .spz-segment[aria-label='View'] button", { hasText: "Palm" }).click();
    await page.locator(".spz-map .spz-segment[aria-label='Layer'] button", { hasText: "Deep" }).click();
    await ready(page);
    await shootCard(page, `plates-${w}-palm-deep.png`);
    await read(page, "palm deep", w, plateRequests);
    // A muscle chosen by a touch tap on the plate: back to the surface, tap FCU on the image.
    await page.locator(".spz-map .spz-segment[aria-label='Layer'] button", { hasText: "Surface" }).click();
    await ready(page);
    const tapped = await tapMuscle(page, "forearm.fcu");
    await shootCard(page, `plates-${w}-fcu-tapped.png`);
    await read(page, "FCU chosen by a touch tap on the plate", w, plateRequests);
    out[out.length - 1].tappedAt = tapped;
    // The plate under the finger, as the athlete sees it.
    await page.locator(".spz-plate-canvas").evaluate((node) => node.scrollIntoView({ block: "center" }));
    await settle(page);
    await page.screenshot({ path: `${outDir}/plates-${w}-fcu-viewport.png` });
    // Target colouring.
    await page.locator(".spz-map .spz-segment[aria-label='Colour by'] button", { hasText: "Target" }).click();
    await settle(page);
    await shootCard(page, `plates-${w}-target.png`);
    await read(page, "Target colouring, FCU selected", w, plateRequests);
    await context.close();
  }
  // A deep muscle named in the address: the plates move to the pass that shows it.
  {
    const { context, page, plateRequests } = await open(w, h, "/?workspace=specialization&region=forearm&fig=drawing&node=forearm.fdp");
    await ready(page);
    await shootCard(page, `plates-${w}-fdp-deep.png`);
    await read(page, "FDP from the address (a deep muscle): the palm's deep pass", w, plateRequests);
    out[out.length - 1].address = await page.evaluate(() => location.search);
    await context.close();
  }
  // Nothing logged: every muscle "Mapped, no direct work".
  {
    const { context, page, plateRequests } = await open(w, h, "/?workspace=specialization&region=forearm&fig=drawing", { sessions: [] });
    await ready(page);
    await shootCard(page, `plates-${w}-nothing-logged.png`);
    await read(page, "nothing logged", w, plateRequests);
    await context.close();
  }
}
{
  const { context, page, plateRequests } = await open(320, 568, "/?workspace=specialization&region=forearm&fig=drawing&node=forearm.ecrl");
  await ready(page);
  await shootCard(page, "plates-320-ecrl.png");
  await read(page, "320 × 568, ECRL", 320, plateRequests);
  await context.close();
}
console.log(JSON.stringify(out, null, 1));
await browser.close(); server.close();
