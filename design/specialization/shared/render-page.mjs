/**
 * Screenshots a region's page and its drawing as the athlete sees them: the production client
 * build (`npx vite build`, served from dist/public), the device stores seeded as the region's
 * evidence.mjs says (`PAGE`: a week of the region's work and a plan), opened at
 * ?workspace=specialization&region=<region>. Headless Chromium emulating an iPhone (390 × 844 and
 * 375 × 667 pt, device scale 3, touch): not an iPhone, not Safari.
 *
 *   npx vite build && node design/specialization/shared/render-page.mjs <region> [outDir] [--dist=<build>]
 *
 * outDir defaults to docs/specialization-atlas/evidence/<region>. --dist serves another build's
 * dist/public (a checkout of an earlier commit, to compare the page before and after a change).
 * The pattern is scripts/perf/measure-client.cjs: /api/trpc answers as the server answers a
 * visitor with no account, so only the device stores speak.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { answerAsVisitor, chromium, serveBuild } from "./browser.mjs";
import { loadConfig, regionArgument, root } from "./region.mjs";

const args = process.argv.slice(2);
const region = regionArgument(args, "npx vite build && node design/specialization/shared/render-page.mjs <region> [outDir] [--dist=<build>]");
const outDir = resolve(root, args.filter((arg) => !arg.startsWith("--"))[1] ?? `docs/specialization-atlas/evidence/${region}`);
const dist = args.find((arg) => arg.startsWith("--dist="))?.slice(7);
const publicDir = resolve(root, dist ?? "dist", "public");
mkdirSync(outDir, { recursive: true });

const { VIEW_ORDER } = await loadConfig(region);
const { PAGE } = await import(pathToFileURL(resolve(root, "design/specialization", region, "evidence.mjs")).href);
const firstView = VIEW_ORDER[0];
const otherView = VIEW_ORDER.find((view) => view.id === PAGE.otherView) ?? VIEW_ORDER[1] ?? firstView;
const tapName = PAGE.tap.split(".").slice(1).join(".");

// This week's workouts, before now: `at(share)` is that share of the way from this week's
// Monday, 00:00 UTC, to now, so the page's default window (this week) always holds them.
const now = Date.now();
const monday = (() => { const day = new Date(new Date(now).toISOString().slice(0, 10)); return day.getTime() - ((day.getUTCDay() + 6) % 7) * 86_400_000; })();
const at = (share) => new Date(monday + (now - monday) * share).toISOString();
const seed = { sessions: PAGE.sessions(at), plan: PAGE.plan };

const { base, close } = await serveBuild(publicDir);
const browser = await chromium.launch();
const shots = [];
for (const [width, height] of [[390, 844], [375, 667]]) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, timezoneId: "UTC" });
  const page = await context.newPage();
  await answerAsVisitor(page);
  await page.addInitScript((value) => {
    if (sessionStorage.getItem("diagram-seeded")) return;
    sessionStorage.setItem("diagram-seeded", "1");
    localStorage.setItem("sports-genome-launch-experience-enabled-v1", "off");
    localStorage.setItem("gym-optimizer-athlete-profile-v1", JSON.stringify({ version: 3, sportId: "", sportContextMode: "general", goal: "Muscle growth", trainingDays: 4, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb", sexForReference: "male", birthYear: 1995, bodyWeight: 180 } }));
    localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(value.sessions));
    localStorage.setItem("gym-optimizer-workout-plan-v1", JSON.stringify(value.plan));
  }, seed);
  await page.goto(`${base}/?workspace=specialization&region=${region}`);
  const card = page.locator("section.spz-card", { has: page.locator(".spz-diagram-svg") });
  await card.waitFor({ timeout: 30000 });
  await page.waitForTimeout(400);
  const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  const svgWidth = await page.locator(".spz-diagram-svg").evaluate((svg) => Math.round(svg.getBoundingClientRect().width));
  const name = (suffix) => `diagram-page-${width}-${suffix}.png`;
  const side = (id) => (PAGE.sides ? `-${id}` : "");
  // What the athlete sees first: the top of the page at this phone size.
  await page.screenshot({ path: join(outDir, name("viewport")) });
  shots.push({ width, file: name("viewport") });
  // The card on its own. It is taller than the screen, so the capture scrolls; the tab row and
  // the bottom bar are pinned to the screen and would be stitched over it, so they are hidden
  // for the capture only and shown again after.
  const shootCard = async (file) => {
    await page.evaluate(() => {
      for (const element of document.querySelectorAll("body *")) {
        const position = getComputedStyle(element).position;
        if ((position === "fixed" || position === "sticky") && !element.closest(".spz-card")) {
          element.setAttribute("data-capture-hidden", element.style.visibility);
          element.style.visibility = "hidden";
        }
      }
    });
    await card.screenshot({ path: join(outDir, file) });
    await page.evaluate(() => {
      for (const element of document.querySelectorAll("[data-capture-hidden]")) {
        element.style.visibility = element.getAttribute("data-capture-hidden");
        element.removeAttribute("data-capture-hidden");
      }
    });
  };
  await shootCard(name(`${firstView.id}-surface${side("right")}`));
  shots.push({ width, file: name(`${firstView.id}-surface${side("right")}`), svgWidth, noOverflow });

  // Tap a muscle where it is drawn (its tap square), as a finger would, and see it selected.
  const square = page.locator(`.spz-diagram-hit[data-node="${PAGE.tap}"] rect`);
  await square.scrollIntoViewIfNeeded();
  const box = await square.boundingBox();
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(300);
  const pressed = await page.locator(`.spz-diagram-hit[data-node="${PAGE.tap}"]`).getAttribute("aria-pressed");
  await shootCard(name(`${tapName}-selected`));
  shots.push({ width, file: name(`${tapName}-selected`), pressed });

  // The other side, another view: the drawing flips, the words do not, the selection stays.
  if (PAGE.sides) await page.getByRole("button", { name: PAGE.sides.left }).click();
  await page.getByRole("group", { name: "View" }).getByRole("button", { name: otherView.label }).click();
  await page.waitForTimeout(300);
  await shootCard(name(`${otherView.id}-surface${side("left")}`));
  shots.push({ width, file: name(`${otherView.id}-surface${side("left")}`) });

  // The deep layer (brief §11: surface and deep views), first view, right side.
  if (PAGE.sides) await page.getByRole("button", { name: PAGE.sides.right }).click();
  await page.getByRole("group", { name: "View" }).getByRole("button", { name: firstView.label }).click();
  await page.getByRole("group", { name: "Layer" }).getByRole("button", { name: "Deep" }).click();
  await page.waitForTimeout(300);
  await shootCard(name(`${firstView.id}-deep${side("right")}`));
  shots.push({ width, file: name(`${firstView.id}-deep${side("right")}`) });

  // The contribution ledger: the tapped muscle's sheet, scrolled to where its numbers come from.
  await page.getByRole("button", { name: /Inspect coverage/ }).first().click();
  const sheet = page.getByRole("dialog").first();
  await sheet.waitFor();
  const ledger = sheet.getByRole("heading", { name: "Where the numbers come from" });
  await ledger.evaluate((element) => element.scrollIntoView({ block: "start" }));
  // The first exercise's bouts, opened, as an athlete checks what was counted.
  await sheet.locator(".spz-ledger > details > summary").first().click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(outDir, name("ledger")) });
  shots.push({ width, file: name("ledger"), ledgerOnScreen: await ledger.evaluate((element) => { const box = element.getBoundingClientRect(); return box.top >= 0 && box.bottom <= window.innerHeight; }) });

  // The add preview: the first suggestion's Add or swap, a day chosen, the planned totals before → after.
  const addOrSwap = sheet.getByRole("button", { name: /Add or swap/ }).first();
  await addOrSwap.scrollIntoViewIfNeeded();
  await addOrSwap.click();
  const change = page.getByRole("dialog", { name: "Add to your plan" });
  await change.waitFor();
  await change.getByRole("button", { name: PAGE.addDay }).click();
  const preview = change.getByRole("heading", { name: /^Planned totals, Week 1/ });
  await preview.evaluate((element) => element.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(outDir, name("add-preview")) });
  shots.push({ width, file: name("add-preview"), noOverflow: await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth) });
  await context.close();
}
await browser.close();
close();
writeFileSync(join(outDir, "diagram-page-checks.json"), `${JSON.stringify(shots, null, 2)}\n`);
console.log(JSON.stringify(shots, null, 2));
