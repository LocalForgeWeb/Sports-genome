/**
 * Phone check for the logger lane: a mid-workout swap under the per-arm gate (the sheet's copy and
 * the rows it builds), the Plan editor showing a hold's prescription in seconds, and a rep exercise
 * swapped or added in place of a hold starting from the plan's reps (the sheet's notes agreeing
 * with its plan line).
 *
 * Headless Chromium emulating an iPhone (viewport, isMobile, hasTouch, device scale 3): not an
 * iPhone, not Safari. Pattern: design/specialization/shared/render-page.mjs, whose browser and
 * server (design/specialization/shared/browser.mjs) it uses.
 *
 *   npx vite build && node design/specialization/forearm/render-logger.mjs [outDir]
 *
 * Screenshots are taken at every width; the evidence folder keeps the 390 and 375 ones, and
 * logger-checks.json holds the measurements for all three.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { answerAsVisitor, chromium, serveBuild } from "../shared/browser.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const outDir = resolve(root, process.argv[2] ?? "docs/specialization-atlas/evidence/logger-fixes-2026-10-17");
mkdirSync(outDir, { recursive: true });
const { base, close } = await serveBuild(join(root, "dist/public"));

const entries = (ids) => ids.map((id) => ({ entryId: id, catalogExerciseId: id }));
const planWith = (ids, prescriptions = {}) => {
  const week = { customWorkoutIds: [], weeklyPlanIds: {}, weeklyPlanEntries: { "0-Upper": entries(ids), "1-Lower": entries([167]), "2-Upper": entries([3]), "3-Lower": entries([168]) }, prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: { "0-Upper": prescriptions }, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 0 };
  return { version: 2, ...week, weeks: { "1": week }, activeWeek: 1 };
};
const profile = { version: 3, sportId: "", sportContextMode: "general", goal: "Athleticism", trainingDays: 4, gymMinutes: 60, movementId: "", baseline: { experience: "Intermediate", weightUnit: "lb", sexForReference: "male", birthYear: 1995, bodyWeight: 180 } };
const today = new Date().toISOString().slice(0, 10);
// An active forearm target: the gate (Home's askStraps, passed as perArmSets).
const goal = { id: "g1", regionId: "forearm", nodeId: "forearm.fcr", actionId: null, side: "right", metric: "direct_dynamic_bouts", target: 6, period: "calendar_week", startsOn: "2026-10-01", endsOn: null, timezone: "UTC", createdAt: `${today}T00:00:00.000Z`, updatedAt: `${today}T00:00:00.000Z` };

const browser = await chromium.launch();
const checks = [];
const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
const hideFixed = (page) => page.evaluate(() => { for (const element of document.querySelectorAll("body *")) { const position = getComputedStyle(element).position; if (position === "fixed" || position === "sticky") { if (element.closest(".swap-scrim")) continue; element.setAttribute("data-capture-hidden", element.style.visibility); element.style.visibility = "hidden"; } } });
const showFixed = (page) => page.evaluate(() => { for (const element of document.querySelectorAll("[data-capture-hidden]")) { element.style.visibility = element.getAttribute("data-capture-hidden"); element.removeAttribute("data-capture-hidden"); } });

async function open(width, height, seed, url) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await answerAsVisitor(page);
  await page.addInitScript((value) => {
    if (sessionStorage.getItem("seeded")) return;
    sessionStorage.setItem("seeded", "1");
    localStorage.setItem("sports-genome-launch-experience-enabled-v1", "off");
    localStorage.setItem("gym-optimizer-athlete-profile-v1", JSON.stringify(value.profile));
    localStorage.setItem("gym-optimizer-workout-plan-v1", JSON.stringify(value.plan));
    if (value.goals) localStorage.setItem("sports-genome-specialization-goals-v1", JSON.stringify(value.goals));
  }, seed);
  await page.goto(`${base}${url}`);
  return { context, page };
}

for (const [width, height] of [[390, 844], [375, 667], [320, 568]]) {
  // 1. The Plan editor: Dead Hang and Farmer's Walk (pinned "3 × 6–10") read in seconds.
  {
    const { context, page } = await open(width, height, { profile, plan: planWith([143, 132, 299], { 299: "3 × 6–10" }) }, "/?workspace=day-plan");
    await page.locator(".day-plan-list .custom-row-identity").first().waitFor({ timeout: 30000 });
    await page.waitForTimeout(400);
    const rows = await page.locator(".day-plan-list .custom-row-identity").evaluateAll((nodes) => nodes.map((node) => ({ name: node.querySelector("strong")?.textContent, line: node.querySelector("em")?.textContent?.replace(/ /g, " ") })));
    await page.locator(".day-plan-list").first().scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -80));
    await page.screenshot({ path: join(outDir, `plan-${width}-hold-rows.png`) });
    // The Dead Hang's editor, open: the stepper and the target box.
    await page.locator(".day-plan-list .custom-prescription > summary").first().click();
    await page.waitForTimeout(300);
    const editor = page.locator(".day-plan-list .custom-prescription").first();
    await editor.scrollIntoViewIfNeeded();
    const target = await editor.locator(".prescription-reps").evaluate((input) => ({ value: input.value, fontSize: getComputedStyle(input).fontSize, height: Math.round(input.getBoundingClientRect().height) }));
    const stepper = await editor.locator(".set-stepper output").textContent();
    await page.screenshot({ path: join(outDir, `plan-${width}-hold-editor.png`) });
    checks.push({ width, screen: "plan", rows, editor: { sets: stepper, target }, horizontalOverflow: await overflow(page) });
    await context.close();
  }

  // 2. A swap under the gate: Hammer Curl out, One-Arm Dumbbell Wrist Curl in.
  {
    const { context, page } = await open(width, height, { profile, plan: planWith([132, 167], { 132: "3 × 12" }), goals: [goal] }, "/?workspace=tracker");
    await page.getByRole("button", { name: /start workout/i }).click({ timeout: 30000 });
    await page.locator(".live-set-card").waitFor();
    await page.getByRole("button", { name: "Swap exercise" }).click();
    const sheet = page.getByRole("dialog", { name: /^Replace / });
    await sheet.getByRole("searchbox").fill("one-arm dumbbell wrist curl");
    await sheet.getByRole("button", { name: /^One-Arm Dumbbell Wrist Curl/ }).first().click();
    await page.waitForTimeout(300);
    const what = await sheet.locator("#swap-what").textContent();
    // The sheet as it stands after the choice (the athlete's view), then scrolled to its top line.
    await page.screenshot({ path: join(outDir, `swap-${width}-sheet-chosen.png`) });
    await sheet.locator("#swap-what").evaluate((node) => node.scrollIntoView({ block: "start" }));
    await page.waitForTimeout(200);
    const whatBox = await sheet.locator("#swap-what").evaluate((node) => { const box = node.getBoundingClientRect(); return { top: Math.round(box.top), bottom: Math.round(box.bottom), fontSize: getComputedStyle(node).fontSize }; });
    await page.screenshot({ path: join(outDir, `swap-${width}-sheet-count.png`) });
    const detailsLine = await sheet.locator(".swap-logging").evaluate((node) => node.textContent);
    const confirm = sheet.getByRole("button", { name: /^Use One-Arm Dumbbell Wrist Curl/ });
    const confirmBox = await confirm.boundingBox();
    await confirm.click();
    await page.waitForTimeout(400);
    const cardLine = await page.locator(".live-set-prescription").textContent();
    const arm = await page.getByRole("group", { name: /^Arm for set/ }).evaluate((group) => Array.from(group.querySelectorAll("button")).map((button) => ({ label: button.textContent, pressed: button.getAttribute("aria-pressed"), w: Math.round(button.getBoundingClientRect().width), h: Math.round(button.getBoundingClientRect().height) })));
    await page.locator(".live-set-card").scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(outDir, `swap-${width}-card-after.png`) });
    await page.getByText("Full workout").click();
    await page.waitForTimeout(300);
    const headers = await page.locator(".session-set-row > strong").evaluateAll((nodes) => nodes.map((node) => node.textContent));
    await page.locator(".session-exercise").first().scrollIntoViewIfNeeded();
    await hideFixed(page);
    await page.locator(".session-exercise").first().screenshot({ path: join(outDir, `swap-${width}-rows-after.png`) });
    await showFixed(page);
    checks.push({ width, screen: "swap two-handed → one-arm", what, whatBox, detailsLine, confirm: confirmBox && { w: Math.round(confirmBox.width), h: Math.round(confirmBox.height) }, cardLine, arm, rowHeaders: headers, horizontalOverflow: await overflow(page) });
    await context.close();
  }

  // 3. The other way, under the gate: One-Arm Dumbbell Wrist Curl (6 rows) out, Wrist Curl in.
  {
    const { context, page } = await open(width, height, { profile, plan: planWith([410, 167], { 410: "3 × 12" }), goals: [goal] }, "/?workspace=tracker");
    await page.getByRole("button", { name: /start workout/i }).click({ timeout: 30000 });
    await page.locator(".live-set-card").waitFor();
    const before = await page.locator(".live-set-prescription").textContent();
    await page.getByRole("button", { name: "Swap exercise" }).click();
    const sheet = page.getByRole("dialog", { name: /^Replace / });
    await sheet.getByRole("searchbox").fill("wrist curl");
    await sheet.getByRole("button", { name: /^Wrist Curl/ }).first().click();
    await page.waitForTimeout(300);
    const what = await sheet.locator("#swap-what").textContent();
    await sheet.locator("#swap-what").evaluate((node) => node.scrollIntoView({ block: "start" }));
    await page.waitForTimeout(200);
    await page.screenshot({ path: join(outDir, `swap-${width}-oneArm-out-sheet.png`) });
    await sheet.getByRole("button", { name: /^Use Wrist Curl/ }).click();
    await page.waitForTimeout(400);
    const cardLine = await page.locator(".live-set-prescription").textContent();
    await page.locator(".live-set-card").scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(outDir, `swap-${width}-oneArm-out-card.png`) });
    checks.push({ width, screen: "swap one-arm → two-handed", before, what, cardLine, horizontalOverflow: await overflow(page) });
    await context.close();
  }

  // 4. A rep exercise in a hold's place: Dead Hang on the goal's pinned "4 × 3–6" ("4 × 30 sec")
  // swapped for Wrist Curl, which starts from "4 × 3–6"; then Wrist Curl added after the hang.
  {
    const { context, page } = await open(width, height, { profile, plan: planWith([143, 167], { 143: "4 × 3–6" }) }, "/?workspace=tracker");
    await page.getByRole("button", { name: /start workout/i }).click({ timeout: 30000 });
    await page.locator(".live-set-card").waitFor();
    const before = await page.locator(".live-set-prescription").textContent();
    await page.getByRole("button", { name: "Swap exercise" }).click();
    const sheet = page.getByRole("dialog", { name: /^Replace / });
    await sheet.getByRole("searchbox").fill("wrist curl");
    await sheet.getByRole("button", { name: /^Wrist Curl/ }).first().click();
    await page.waitForTimeout(300);
    const logging = sheet.locator(".swap-logging");
    await logging.evaluate((node) => node.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(200);
    const notes = await logging.locator("li").evaluateAll((nodes) => nodes.map((node) => ({ text: node.textContent, fontSize: getComputedStyle(node).fontSize })));
    const planLine = await sheet.locator(".swap-plan small").textContent().catch(() => null);
    await page.screenshot({ path: join(outDir, `swap-${width}-hold-to-reps-sheet.png`) });
    await sheet.getByRole("button", { name: /^Use Wrist Curl/ }).click();
    await page.waitForTimeout(400);
    const cardLine = await page.locator(".live-set-prescription").textContent();
    await page.locator(".live-set-card").scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(outDir, `swap-${width}-hold-to-reps-card.png`) });
    checks.push({ width, screen: "swap hold → rep exercise", before, notes, planLine, cardLine, horizontalOverflow: await overflow(page) });
    await context.close();
  }
  {
    const { context, page } = await open(width, height, { profile, plan: planWith([143, 167], { 143: "4 × 3–6" }) }, "/?workspace=tracker");
    await page.getByRole("button", { name: /start workout/i }).click({ timeout: 30000 });
    await page.locator(".live-set-card").waitFor();
    await page.getByRole("button", { name: "Add exercise" }).click();
    const sheet = page.getByRole("dialog", { name: "Add an exercise" });
    await sheet.getByRole("searchbox").fill("wrist curl");
    await sheet.getByRole("button", { name: /^Wrist Curl/ }).first().click();
    await page.waitForTimeout(300);
    const what = await sheet.locator("#swap-what").textContent();
    await sheet.locator("#swap-what").evaluate((node) => node.scrollIntoView({ block: "start" }));
    await page.waitForTimeout(200);
    const whatBox = await sheet.locator("#swap-what").evaluate((node) => { const box = node.getBoundingClientRect(); return { top: Math.round(box.top), bottom: Math.round(box.bottom), fontSize: getComputedStyle(node).fontSize }; });
    await page.screenshot({ path: join(outDir, `add-${width}-reps-after-hold-sheet.png`) });
    checks.push({ width, screen: "add rep exercise after a hold", what, whatBox, horizontalOverflow: await overflow(page) });
    await context.close();
  }
}
await browser.close();
close();
writeFileSync(join(outDir, "logger-checks.json"), `${JSON.stringify(checks, null, 2)}\n`);
console.log(JSON.stringify(checks, null, 2));
