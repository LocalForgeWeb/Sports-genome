/**
 * Client latency and request counts for the six flows in brief B231, under stated conditions (B232).
 *
 * What it measures: the production client bundle (`npm run build`, served from dist/public) in
 * headless Chromium, on the device stores (the build's direct workspace access). Each flow is
 * timed from the athlete's action to the element that shows its result, and the tRPC
 * procedures the flow sends are counted.
 *
 * What it does not measure: server or database time. `/api/trpc` is answered in the page the
 * way the server's own code answers a visitor with no account (auth.me null, protected routes
 * UNAUTHORIZED, everything else an empty success) with no network delay, so these are client
 * costs only. Production route latency needs a run against the deployed URL (see README).
 *
 * Usage: node scripts/perf/measure-client.cjs [baseUrl] [runs]   (PERF_ONLY=flow,flow to run a subset)
 *   baseUrl defaults to http://localhost:4173 (serve -s dist/public -l 4173)
 * Needs Playwright (global install) and Chromium at PLAYWRIGHT_CHROMIUM or /opt/pw-browsers/chromium.
 */
const { execSync } = require("child_process");
const playwright = require(`${execSync("npm root -g").toString().trim()}/playwright`);

const BASE = process.argv[2] || "http://localhost:4173";
const RUNS = Number(process.argv[3] || 10);
const CHROMIUM = process.env.PLAYWRIGHT_CHROMIUM || "/opt/pw-browsers/chromium";

/**
 * Every protectedProcedure in server/routers.ts, read from the file rather than listed by hand:
 * the hand list had seven and missed auth.passkeys, favorites.set, setPriority and the passkey
 * mutations, the device-store calls that were still refused (Sep 28 regression brief §7).
 */
const PROTECTED = (() => {
  const found = new Set();
  let router = "";
  for (const line of require("fs").readFileSync(require("path").resolve(__dirname, "../../server/routers.ts"), "utf8").split("\n")) {
    if (/^\s*\/\//.test(line)) continue;
    const routerMatch = line.match(/^ {2}(\w+): router\(\{/);
    if (routerMatch) router = routerMatch[1];
    const procedure = line.match(/^ {4}(\w+): protectedProcedure\b/);
    if (procedure && router) found.add(`${router}.${procedure[1]}`);
  }
  return found;
})();

/** A year of training: 104 finished workouts (two a week), five lifts of three sets each, and 40 typed lifts. */
function loadedFixture() {
  const lifts = ["Back Squat", "Barbell Bench Press", "Conventional Deadlift", "Barbell Overhead Press", "Lat Pulldown", "Seated Cable Row", "Romanian Deadlift", "Leg Press", "Barbell Curl", "Pull-Up"];
  const start = Date.UTC(2025, 8, 29);
  const sessions = Array.from({ length: 104 }, (_, index) => {
    const at = new Date(start + index * 3.5 * 86400000);
    const chosen = lifts.slice(index % 2 ? 5 : 0, index % 2 ? 10 : 5);
    return {
      id: `fixture-${index}`, title: index % 2 ? "Lower" : "Upper", dayLabel: `Week ${Math.floor(index / 2) + 1} · ${index % 2 ? "Lower" : "Upper"}`,
      startedAt: at.toISOString(), completedAt: new Date(at.getTime() + 3600000).toISOString(), status: "completed", weightUnit: "lb", bodyMassKgAtCompletion: 81,
      exercises: chosen.map((name, lift) => ({ id: `${index}-${lift}`, exerciseName: name, plannedPrescription: "3 × 6–10", sets: [0, 1, 2].map((set) => ({ weight: String(95 + lift * 20 + index + set * 5), reps: String(8 - set), unit: "lb", completed: true, skipped: false })) })),
    };
  });
  const typed = Array.from({ length: 40 }, (_, index) => ({ id: `typed-${index}`, exerciseName: lifts[index % lifts.length], observedAt: new Date(start + index * 9 * 86400000).toISOString(), measurementType: "MULTI_REP", loadKg: 40 + index, repetitions: 5, bodyMassKgAtTest: 81, laterality: "BILATERAL" }));
  return { sessions, typed };
}

async function freshPage(browser, { fixture, throttle }) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const calls = [];
  await page.route("**/api/trpc/**", async (route) => {
    const url = new URL(route.request().url());
    const procs = url.pathname.replace("/api/trpc/", "").split(",");
    calls.push(...procs);
    const body = procs.map((p) => PROTECTED.has(p)
      ? { error: { json: { message: "Please login (10001)", code: -32001, data: { code: "UNAUTHORIZED", httpStatus: 401, path: p } } } }
      : { result: { data: { json: null } } });
    await route.fulfill({ status: procs.some((p) => PROTECTED.has(p)) ? 207 : 200, contentType: "application/json", body: JSON.stringify(url.searchParams.get("batch") ? body : body[0]) });
  });
  const data = fixture === "loaded" ? loadedFixture() : { sessions: [], typed: [] };
  await page.addInitScript((seed) => {
    if (sessionStorage.getItem("perf-seeded")) return;
    sessionStorage.setItem("perf-seeded", "1");
    localStorage.setItem("sports-genome-launch-experience-enabled-v1", "off");
    localStorage.setItem("gym-optimizer-athlete-profile-v1", JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Muscle growth", trainingDays: 4, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb", sexForReference: "male", birthYear: 1995, bodyWeight: 180 } }));
    localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(seed.sessions));
    localStorage.setItem("sports-genome-device-strength-observations-v1", JSON.stringify(seed.typed));
  }, data);
  await page.addInitScript(installProbes);
  if (throttle > 1) {
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle });
  }
  return { context, page, calls };
}

/**
 * Timing runs inside the page. Playwright's own waits poll with a back-off (up to 500 ms between
 * checks), which rounded every short flow to its poll interval. Here the clock starts in the page
 * at the action and stops on the first animation frame in which the result is in the document -
 * rendered and laid out, 16 ms granularity. Home is timed from navigation start
 * (performance.now()'s origin) to the frame its "Your next workout" line appears.
 */
function installProbes() {
  const text = (selector, pattern) => [...document.querySelectorAll(selector)].find((el) => pattern.test(el.textContent.trim()) && el.getClientRects().length > 0) || null;
  const byLabel = (label) => [...document.querySelectorAll("button[aria-label]")].find((el) => el.getAttribute("aria-label") === label && el.getClientRects().length > 0) || null;
  const probes = {
    home: () => text("p.metric-label", /your next workout/i),
    searchResult: () => byLabel("Inspect Romanian Deadlift"),
    undoToast: () => text("[data-sonner-toast] button", /^Undo$/),
    gapRow: () => [...document.querySelectorAll("button[aria-label$='points short']")].find((el) => el.getClientRects().length > 0) || null,
    nextSet: () => text("button.live-set-commit", /Log set 2/),
    strengthMap: () => text("button", /^View all \d+ regions/),
  };
  const setInput = (input, value) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  };
  const actions = {
    search: () => setInput(document.querySelector("input[placeholder='Search exercises']"), "romanian"),
    add: () => byLabel("Add Barbell Bench Press to Week 1 · Upper").click(),
    openTrain: () => text(".mobile-bottom-nav button", /^Train$/).click(),
    logSet: () => text("button.live-set-commit", /Log set 1/).click(),
    openStrength: () => [...document.querySelectorAll("button")].find((el) => (el.getAttribute("aria-label") || el.textContent).startsWith("View strength progress")).click(),
  };
  const waitFor = (probe, from, resolve) => {
    const tick = () => (probes[probe]() ? resolve(performance.now() - from) : performance.now() - from > 30000 ? resolve(-1) : requestAnimationFrame(tick));
    requestAnimationFrame(tick);
  };
  window.__perf = {
    run: (action, probe) => new Promise((resolve) => { const t0 = performance.now(); actions[action](); waitFor(probe, t0, resolve); }),
  };
  waitFor("home", 0, (ms) => { window.__perfHomeReady = ms; });
}

const homeReady = async (page) => {
  await page.waitForFunction(() => window.__perfHomeReady !== undefined, null, { timeout: 30000 });
  return page.evaluate(() => window.__perfHomeReady);
};

async function inPage(page, calls, action, probe) {
  const before = calls.length;
  const ms = await page.evaluate(([a, p]) => window.__perf.run(a, p), [action, probe]);
  if (ms < 0) throw new Error(`${action} -> ${probe} did not appear within 30 s`);
  await page.waitForTimeout(300);
  return { ms: Math.round(ms), procs: calls.slice(before) };
}

const flows = {
  async home_cold(browser, condition) {
    const { context, page, calls } = await freshPage(browser, condition);
    await page.goto(BASE, { waitUntil: "commit" });
    const ms = Math.round(await homeReady(page));
    await page.waitForTimeout(1200);
    const fcp = await page.evaluate(() => performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? null);
    await context.close();
    return { ms, procs: calls.slice(), fcp };
  },
  async home_warm(browser, condition) {
    const { context, page, calls } = await freshPage(browser, condition);
    await page.goto(BASE); await homeReady(page);
    await page.waitForTimeout(500);
    const before = calls.length;
    await page.reload({ waitUntil: "commit" });
    const ms = Math.round(await homeReady(page));
    await page.waitForTimeout(300);
    await context.close();
    return { ms, procs: calls.slice(before) };
  },
  async search_exercises(browser, condition) {
    const { context, page, calls } = await freshPage(browser, condition);
    await page.goto(BASE); await homeReady(page);
    await page.getByRole("button", { name: /Explore exercises/ }).first().click();
    await page.getByPlaceholder("Search exercises").waitFor();
    const result = await inPage(page, calls, "search", "searchResult");
    await context.close();
    return result;
  },
  async add_to_plan(browser, condition) {
    const { context, page, calls } = await freshPage(browser, condition);
    await page.goto(BASE); await homeReady(page);
    await page.getByRole("button", { name: /Explore exercises/ }).first().click();
    await page.getByRole("button", { name: "Add Barbell Bench Press to Week 1 · Upper" }).waitFor();
    const result = await inPage(page, calls, "add", "undoToast");
    await context.close();
    return result;
  },
  async coverage_open_day(browser, condition) {
    const { context, page, calls } = await freshPage(browser, condition);
    await page.goto(BASE); await homeReady(page);
    await page.getByRole("button", { name: /Explore exercises/ }).first().click();
    for (const name of ["Barbell Bench Press", "Barbell Overhead Press", "Seated Cable Row"]) {
      await page.getByPlaceholder("Search exercises").fill(name);
      await page.getByRole("button", { name: `Add ${name} to Week 1 · Upper` }).click();
    }
    const result = await inPage(page, calls, "openTrain", "gapRow");
    await context.close();
    return result;
  },
  async save_set(browser, condition) {
    const { context, page, calls } = await freshPage(browser, condition);
    await page.goto(BASE); await homeReady(page);
    await page.getByRole("button", { name: /Explore exercises/ }).first().click();
    await page.getByRole("button", { name: "Add Barbell Bench Press to Week 1 · Upper" }).click();
    await page.getByRole("button", { name: "Train", exact: true }).click();
    await page.getByRole("button", { name: "Open workout" }).click();
    await page.getByRole("button", { name: "Start workout" }).click();
    const inputs = page.locator("input[inputmode]");
    await inputs.first().waitFor();
    await inputs.nth(0).fill("135");
    await inputs.nth(1).fill("8");
    const result = await inPage(page, calls, "logSet", "nextSet");
    await context.close();
    return result;
  },
  async open_strength(browser, condition) {
    const { context, page, calls } = await freshPage(browser, condition);
    await page.goto(BASE); await homeReady(page);
    await page.waitForTimeout(500);
    const result = await inPage(page, calls, "openStrength", "strengthMap");
    await context.close();
    return result;
  },
};

const only = process.env.PERF_ONLY ? new Set(process.env.PERF_ONLY.split(",")) : null;
const plan = [
  ...Object.keys(flows).flatMap((flow) => [1, 4].map((throttle) => ({ flow, fixture: "loaded", throttle }))),
  ...["home_cold", "open_strength"].flatMap((flow) => [1, 4].map((throttle) => ({ flow, fixture: "empty", throttle }))),
].filter((step) => !only || only.has(step.flow));

const pct = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];

(async () => {
  const browser = await playwright.chromium.launch({ executablePath: CHROMIUM });
  const rows = [];
  for (const step of plan) {
    const samples = [];
    let procs = [];
    let fcp = [];
    for (let run = 0; run < RUNS; run++) {
      const result = await flows[step.flow](browser, step);
      samples.push(result.ms);
      procs = result.procs;
      if (result.fcp != null) fcp.push(result.fcp);
    }
    const sorted = [...samples].sort((a, b) => a - b);
    const counts = procs.reduce((map, p) => map.set(p, (map.get(p) || 0) + 1), new Map());
    rows.push({ ...step, runs: RUNS, p50: pct(sorted, 50), p95: pct(sorted, 95), min: sorted[0], max: sorted[sorted.length - 1], fcpP50: fcp.length ? Math.round(pct([...fcp].sort((a, b) => a - b), 50)) : null, procedures: Object.fromEntries(counts) });
    console.error(`${step.flow} ${step.fixture} x${step.throttle}: p50 ${pct(sorted, 50)} ms, p95 ${pct(sorted, 95)} ms`);
  }
  await browser.close();
  console.log(JSON.stringify({ base: BASE, runs: RUNS, node: process.version, chromium: CHROMIUM, when: new Date().toISOString(), rows }, null, 2));
})();
