// Walkthrough brief evidence: the same eight screens on the pre-brief build (port 4174, "before")
// and the current build (port 4173, "after"). Headless Chromium at 390x844 @2x; env(safe-area-inset-*)
// is 0 here, so the status backdrop is exercised by class, not by a real notch.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { readFileSync, mkdirSync } from 'node:fs';
const [port = '4173', label = 'after'] = process.argv.slice(2);
const base = `http://localhost:${port}`;
const out = '/home/user/Sports-genome/docs/ux-walkthrough/evidence'; mkdirSync(out, { recursive: true });
const scratch = '/tmp/claude-0/-home-user-Sports-genome/72e48dc4-5d2e-5f13-9687-9bbe2b3f83cf/scratchpad';
const logo = readFileSync(`${scratch}/logo.png`);
const clip = readFileSync('/home/user/Sports-genome/docs/ux-correction/evidence/transition-recording.webm');
const profile = JSON.stringify({ version: 3, sportId: 'wrestling', sportContextMode: 'sport', goal: 'Max strength', trainingDays: 5, gymMinutes: 75, movementId: 'wrestling-1', baseline: { experience: 'Intermediate', weightUnit: 'lb', bodyWeight: 145, sexForReference: 'male', equipment: { gymAccess: 'Commercial gym', availableEquipment: ['Barbell', 'Dumbbells', 'Cable', 'Machine', 'Bodyweight', 'Bench', 'Free weights'] } } });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const shot = (p, name) => p.screenshot({ path: `${out}/${label}-${name}.png` });
const wire = async (p, { video = 'clip', pendingRanks = false } = {}) => {
  await p.route('**qiccnqkypbhlwpmjcsri.supabase.co/**', (r) => { const u = r.request().url(); if (u.endsWith('.mp4')) return video === 'clip' ? r.fulfill({ contentType: 'video/webm', body: clip }) : r.abort(); return r.fulfill({ contentType: 'image/png', body: logo }); });
  await p.route('**/api/trpc/**', (route) => { const path = new URL(route.request().url()).pathname.replace('/api/trpc/', ''); if (pendingRanks && path.includes('muscleRanks')) return new Promise(() => {}); return route.fulfill({ contentType: 'application/json', body: JSON.stringify(path.split(',').map(() => ({ result: { data: { json: null } } }))) }); });
};
const seed = async (p, extra = {}) => { await p.goto(`${base}/?workspace=command`); await p.evaluate(([profile, extra]) => { localStorage.clear(); localStorage.setItem('gym-optimizer-athlete-profile-v1', profile); for (const [k, v] of Object.entries(extra)) localStorage.setItem(k, v); }, [profile, extra]); };
const dock = (p, l) => p.locator('.mobile-bottom-nav button').filter({ hasText: l }).first().dispatchEvent('click');
const tab = (p, l) => p.locator('.workspace-top-switcher button').filter({ hasText: l }).first().dispatchEvent('click');
const wait = (p, ms) => p.waitForTimeout(ms);
const page = async (opts) => { const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const p = await ctx.newPage(); await wire(p, opts); return [ctx, p]; };
const draft = async (p) => { await dock(p, 'Train'); await wait(p, 1200); await p.locator('.day-plan-draft > summary').first().dispatchEvent('click').catch(() => {}); await wait(p, 400); await p.locator('.day-plan-draft button').filter({ hasText: /Draft this (session|workout)/i }).first().dispatchEvent('click').catch(() => {}); await wait(p, 1200); await p.waitForSelector('[data-sonner-toast]', { state: 'detached', timeout: 8000 }).catch(() => {}); };

{ // 1. Launch: the splash mid-intro (Skip is visible on the current build).
  const [ctx, p] = await page(); await seed(p); await p.goto(`${base}/?workspace=command`, { waitUntil: 'commit' }); await wait(p, 2200); await shot(p, 'launch-splash'); await ctx.close();
}
{ // 2. Returning launch, Home ~250ms after the splash lifts: loading module, never "Create your plan".
  const [ctx, p] = await page({ video: 'fail' }); await seed(p, { 'sports-genome-launched-before-v1': 'yes' }); await draft(p);
  await p.goto(`${base}/?workspace=command`, { waitUntil: 'commit' });
  await p.waitForFunction(() => document.documentElement.classList.contains('sports-genome-app-ready'), null, { timeout: 8000 }).catch(() => {});
  await shot(p, 'home-first-paint'); await wait(p, 1200); await shot(p, 'home-ready'); await ctx.close();
}
{ // 3. Profile scrolled (U01), preview open (V04), preview closed (V05).
  const [ctx, p] = await page(); await seed(p, { 'sports-genome-launch-experience-enabled-v1': 'off' }); await p.goto(`${base}/?workspace=profile`); await wait(p, 2500);
  await p.evaluate(() => window.scrollTo(0, 420)); await wait(p, 400); await shot(p, 'profile-scrolled');
  await p.locator('.about-me-group > summary').filter({ hasText: 'Launch video' }).dispatchEvent('click').catch(() => {}); await wait(p, 400);
  await p.evaluate(() => window.scrollTo(0, 500)); await wait(p, 300);
  await p.getByRole('button', { name: /Preview intro video/i }).first().dispatchEvent('click').catch(() => {}); await wait(p, 1200); await shot(p, 'preview-open');
  await p.keyboard.press('Escape'); await p.locator('.intro-preview button[aria-label="Close intro preview"]').first().dispatchEvent('click').catch(() => {}); await wait(p, 900);
  await p.waitForFunction(() => document.documentElement.classList.contains('sports-genome-app-ready'), null, { timeout: 8000 }).catch(() => {}); await wait(p, 600); await shot(p, 'preview-closed'); await ctx.close();
}
{ // 4. Catalog feedback (U02), picker sheet (U03), detail over picker (U04), analysis (U05/D02).
  const [ctx, p] = await page({ video: 'fail' }); await seed(p, { 'sports-genome-launch-experience-enabled-v1': 'off' }); await p.goto(`${base}/`); await wait(p, 2500); await draft(p);
  await dock(p, 'Body Lab'); await tab(p, 'Exercises'); await wait(p, 900);
  await p.locator('.catalog-discovery-actions button:last-child').first().dispatchEvent('click'); await wait(p, 500); await shot(p, 'catalog-feedback');
  await p.waitForSelector('[data-sonner-toast]', { state: 'detached', timeout: 8000 }).catch(() => {});
  await dock(p, 'Train'); await tab(p, 'Plan'); await wait(p, 900);
  await p.locator('.day-action-add, button.day-exercise-open-catalog').first().dispatchEvent('click').catch(() => {}); await wait(p, 800); await shot(p, 'picker-sheet');
  await p.locator('.day-picker-sheet .day-picker-result button').first().dispatchEvent('click').catch(() => {}); await wait(p, 900); await shot(p, 'picker-detail');
  await p.locator('.exercise-intelligence-close').dispatchEvent('click').catch(() => {}); await wait(p, 500);
  await p.locator('.day-picker-sheet-head button, .day-picker-sheet-foot button').last().dispatchEvent('click').catch(() => {}); await wait(p, 500);
  await p.locator('.rate-stack-trigger').first().dispatchEvent('click').catch(() => {}); await wait(p, 900); await shot(p, 'analysis');
  await p.evaluate(() => { const s = document.querySelector('.stack-analysis-page, .stack-analysis-overlay'); if (s) s.scrollTop = 600; }); await wait(p, 300); await shot(p, 'analysis-scrolled'); await ctx.close();
}
{ // 5. Strength map with lifts on record while ranks are pending (D01).
  const [ctx, p] = await page({ video: 'fail', pendingRanks: true });
  const lifts = JSON.stringify([{ id: 'w1', exerciseName: 'Barbell Back Squat', observedAt: '2026-09-20T10:00:00.000Z', measurementType: 'MEASURED_1RM', loadKg: 120, repetitions: 1, bodyMassKgAtTest: 66 }, { id: 'w2', exerciseName: 'Barbell Bench Press', observedAt: '2026-09-21T10:00:00.000Z', measurementType: 'MEASURED_1RM', loadKg: 80, repetitions: 1, bodyMassKgAtTest: 66 }]);
  await seed(p, { 'sports-genome-launch-experience-enabled-v1': 'off', 'sports-genome-device-strength-observations-v1': lifts }); await p.goto(`${base}/?workspace=strength`); await wait(p, 2500);
  await p.evaluate(() => { document.querySelector('.strength-body-map')?.scrollIntoView(); }); await wait(p, 400); await shot(p, 'strength-map');
  console.log(label, 'strength', JSON.stringify(await p.evaluate(() => ({ mode: document.querySelector('.strength-body-chart')?.dataset.mode ?? null, legend: document.querySelector('.strength-map-legend')?.textContent?.slice(0, 80), notice: document.querySelector('.rank-profile-partial')?.textContent?.slice(0, 80), regions: document.querySelector('.strength-profile-metrics')?.textContent }))));
  await ctx.close();
}
await browser.close();
console.log('done', label);
