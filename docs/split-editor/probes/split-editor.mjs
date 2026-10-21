// The day editor (docs/split-editor) in the production build (vite preview), headless Chromium at phone widths.
// Signed out, no network: tRPC answers null. Viewport emulation only.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { mkdirSync } from 'node:fs';

const out = process.argv[2]; mkdirSync(out, { recursive: true });
const base = 'http://localhost:4173';
const profile = JSON.stringify({ version: 3, sportId: 'wrestling', sportContextMode: 'sport', goal: 'Max strength', trainingDays: 3, gymMinutes: 60, movementId: 'wrestling-17', baseline: { experience: 'Intermediate', weightUnit: 'lb', bodyWeight: 160, equipment: { gymAccess: 'Commercial gym', availableEquipment: ['Barbell', 'Dumbbells', 'Cable', 'Machine', 'Bodyweight', 'Bench', 'Free weights'] } } });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const results = [];
const check = (name, pass, detail = '') => { results.push({ name, pass: Boolean(pass) }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`); };
const wait = (p, ms) => p.waitForTimeout(ms);

const tabs = (p) => p.locator('.training-plan-days [role="tab"]').evaluateAll((nodes) => nodes.map((n) => n.firstChild.textContent.trim()));
const tabCount = (p, i) => p.locator('.training-plan-days [role="tab"]').nth(i).locator('small').textContent();
const fits = (p, scope) => p.evaluate((scope) => document.documentElement.scrollWidth <= window.innerWidth + 1 && [...document.querySelectorAll(`${scope} *`)].every((n) => { const r = n.getBoundingClientRect(); return r.width === 0 || r.right <= window.innerWidth + 1; }), scope);
const storedPlan = (p) => p.evaluate(() => { const key = Object.keys(localStorage).find((k) => k.startsWith('gym-optimizer-workout-plan-v1')); return key ? JSON.parse(localStorage.getItem(key)) : null; });
const storedProfile = (p) => p.evaluate(() => { const key = Object.keys(localStorage).find((k) => k.startsWith('gym-optimizer-athlete-profile-v1')); return key ? JSON.parse(localStorage.getItem(key)) : null; });
const draftDay = async (p, index) => {
  await p.locator('.training-plan-days [role="tab"]').nth(index).click(); await wait(p, 500);
  await p.locator('.day-plan-draft > summary').first().click(); await wait(p, 400);
  await p.locator('.day-plan-draft button').filter({ hasText: /Draft this (session|workout)/i }).first().click(); await wait(p, 900);
  await p.locator('.day-plan-draft > summary').first().click().catch(() => {}); await wait(p, 200);
};

for (const [width, height] of [[390, 844], [320, 640]]) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.route('**/api/trpc/**', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(new URL(route.request().url()).pathname.replace('/api/trpc/', '').split(',').map(() => ({ result: { data: { json: null } } }))) }));
  await p.route('**qiccnqkypbhlwpmjcsri.supabase.co/**', (r) => r.abort());
  await p.route(/free-exercise-db|githubusercontent/, (r) => r.abort());
  await p.goto(`${base}/?workspace=command`);
  await p.evaluate((profile) => { localStorage.clear(); localStorage.setItem('gym-optimizer-athlete-profile-v1', profile); localStorage.setItem('sports-genome-launch-experience-enabled-v1', 'off'); localStorage.setItem('sports-genome-launched-before-v1', 'yes'); }, profile);
  await p.goto(`${base}/?workspace=day-plan`); await wait(p, 1800);
  const w = String(width);

  check(`${w}: a three-day week opens as the recommended Push / Pull / Legs`, JSON.stringify(await tabs(p)) === JSON.stringify(['Push', 'Pull', 'Legs']), JSON.stringify(await tabs(p)));
  await draftDay(p, 0); await draftDay(p, 2);
  const legsCount = (await tabCount(p, 2)).trim();
  check(`${w}: Push and Legs are built before editing`, Number((await tabCount(p, 0)).trim()) > 0 && Number(legsCount) > 0, `Push ${(await tabCount(p, 0)).trim()}, Legs ${legsCount}`);

  await p.locator('.training-plan-edit-days').click(); await wait(p, 600);
  const sheet = p.getByRole('dialog', { name: 'Your training days' });
  check(`${w}: Edit days opens the day editor`, await sheet.count() === 1);
  check(`${w}: the editor fits the screen with no sideways scroll`, await fits(p, '.se-body'));
  await p.screenshot({ path: `${out}/editor-${w}-open.jpg`, type: 'jpeg', quality: 70 });

  await sheet.locator('#se-day-2').selectOption('Lower');
  const row3 = (await sheet.locator('.se-days li').nth(2).locator('small').textContent()).trim();
  check(`${w}: renaming Day 03 to Lower says it keeps the Legs exercises`, row3 === `${legsCount} exercises · from Day 03 · Legs`, row3);
  await sheet.getByRole('button', { name: 'Add a day' }).click();
  await sheet.locator('#se-day-3').selectOption('Full Body');
  await sheet.getByRole('button', { name: 'Remove Day 02 · Pull' }).waitFor();
  check(`${w}: the edited week still fits`, await fits(p, '.se-body'));
  await sheet.locator('.se-days').scrollIntoViewIfNeeded();
  await p.screenshot({ path: `${out}/editor-${w}-edited.jpg`, type: 'jpeg', quality: 70 });
  await sheet.getByRole('button', { name: 'Save days' }).click(); await wait(p, 900);

  check(`${w}: the plan now shows the chosen days`, JSON.stringify(await tabs(p)) === JSON.stringify(['Push', 'Pull', 'Lower', 'Full Body']), JSON.stringify(await tabs(p)));
  check(`${w}: Day 03 · Lower holds the former Legs exercises`, (await tabCount(p, 2)).trim() === legsCount, (await tabCount(p, 2)).trim());
  const plan = await storedPlan(p); const prof = await storedProfile(p);
  check(`${w}: the plan stores the chosen days`, JSON.stringify(plan?.split) === JSON.stringify(['Push', 'Pull', 'Lower', 'Full Body']), JSON.stringify(plan?.split));
  check(`${w}: the profile's frequency follows the week's length`, prof?.trainingDays === 4, String(prof?.trainingDays));
  check(`${w}: the stored week keys name the new days`, Boolean(plan?.weeks?.['1']?.weeklyPlanEntries?.['2-Lower']?.length), Object.keys(plan?.weeks?.['1']?.weeklyPlanEntries || {}).join(','));
  check(`${w}: the plan header still fits`, await fits(p, '.training-plan-header'));
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.screenshot({ path: `${out}/plan-${w}-saved.jpg`, type: 'jpeg', quality: 70 });

  await p.reload(); await wait(p, 1800);
  check(`${w}: a reload opens the same chosen days`, JSON.stringify(await tabs(p)) === JSON.stringify(['Push', 'Pull', 'Lower', 'Full Body']), JSON.stringify(await tabs(p)));
  check(`${w}: and Day 03 · Lower still holds its exercises`, (await tabCount(p, 2)).trim() === legsCount, (await tabCount(p, 2)).trim());

  // A shorter week says what it hides, and Cancel changes nothing.
  await p.locator('.training-plan-edit-days').click(); await wait(p, 500);
  await sheet.getByRole('button', { name: /^Upper · Lower\s*2 days/ }).click(); await wait(p, 200);
  const day02 = (await sheet.locator('.se-days li').nth(1).locator('small').textContent()).trim();
  check(`${w}: Upper · Lower moves the built Lower day to Day 02, and hides nothing built`, day02 === `${legsCount} exercises · from Day 03 · Lower` && !(await sheet.locator('.stp-warn').count()), day02);
  await sheet.getByRole('button', { name: /^Full body\s*2 days/ }).click(); await wait(p, 200);
  const day01 = (await sheet.locator('.se-days li').nth(0).locator('small').textContent()).trim();
  const status = (await sheet.getByRole('status').textContent()).trim();
  check(`${w}: Full body ×2 keeps Push on Day 01, not an empty day`, /^\d+ exercises · from Day 01 · Push$/.test(day01), day01);
  check(`${w}: and names the built day it hides, as hidden not deleted`, /Day 03 · Lower \(\d+ exercises?\) has no place in this week, so it is hidden, not deleted\. Add Day 03 · Lower back to see it again\./.test(status), status);
  await sheet.locator('.stp-actions').scrollIntoViewIfNeeded();
  await p.screenshot({ path: `${out}/editor-${w}-hidden-warning.jpg`, type: 'jpeg', quality: 70 });
  await sheet.getByRole('button', { name: 'Cancel' }).click(); await wait(p, 400);
  check(`${w}: Cancel leaves the week as it was`, JSON.stringify(await tabs(p)) === JSON.stringify(['Push', 'Pull', 'Lower', 'Full Body']));

  // Back to the recommendation for four days: the stored choice goes, the days follow the frequency.
  await p.locator('.training-plan-edit-days').click(); await wait(p, 500);
  await sheet.getByRole('button', { name: /^Recommended/ }).click();
  await sheet.getByRole('button', { name: 'Save days' }).click(); await wait(p, 800);
  check(`${w}: Recommended returns to Upper / Lower ×2 for four days`, JSON.stringify(await tabs(p)) === JSON.stringify(['Upper', 'Lower', 'Upper', 'Lower']), JSON.stringify(await tabs(p)));
  check(`${w}: and nothing is stored as a chosen split`, (await storedPlan(p))?.split === undefined);
  const builtTotal = await p.locator('.training-plan-days [role="tab"] small').evaluateAll((nodes) => nodes.map((n) => Number(n.textContent.trim()) || 0).reduce((a, b) => a + b, 0));
  check(`${w}: every built exercise is still in the week`, builtTotal === Number(legsCount) + Number((await tabCount(p, 0)).trim()), String(builtTotal));
  await ctx.close();
}
await browser.close();
const failed = results.filter((r) => !r.pass).length;
console.log(`${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
