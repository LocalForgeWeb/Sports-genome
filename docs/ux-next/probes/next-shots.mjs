// Next-update brief: the six supplied surfaces at matching data state. Usage: node next-shots.mjs <label> [widths] [zoom]
// e.g. `node next-shots.mjs before 390,320` or `node next-shots.mjs after 390 1.25` (large text via root font-size).
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { readFileSync, mkdirSync } from 'node:fs';
const [label = 'after', widthArg = '390,320', zoomArg = '1'] = process.argv.slice(2);
const widths = widthArg.split(',').map(Number); const zoom = Number(zoomArg);
const base = 'http://localhost:4173';
const out = '/home/user/Sports-genome/docs/ux-next/evidence'; mkdirSync(out, { recursive: true });
const scratch = '/tmp/claude-0/-home-user-Sports-genome/72e48dc4-5d2e-5f13-9687-9bbe2b3f83cf/scratchpad';
const logo = readFileSync(`${scratch}/logo.png`);
const profile = JSON.stringify({ version: 3, sportId: 'wrestling', sportContextMode: 'sport', goal: 'Max strength', trainingDays: 5, gymMinutes: 75, movementId: 'wrestling-1', baseline: { experience: 'Intermediate', weightUnit: 'lb', bodyWeight: 145, sexForReference: 'male', equipment: { gymAccess: 'Commercial gym', availableEquipment: ['Barbell', 'Dumbbells', 'Cable', 'Machine', 'Bodyweight', 'Bench', 'Free weights'] } } });
const muscle = (canonicalName, percentile, confidence01, evidenceCount = 1) => ({ muscleId: `id-${canonicalName}`, canonicalName, name: canonicalName.replace(/_/g, ' '), percentile, confidence01, evidenceCount, movementPatternCount: evidenceCount, evidence: [{ exerciseName: 'Barbell Bench Press', role: 'primary', exercisePercentile: percentile }], referenceGroups: [{ label: 'Strength Level, men', sex: 'male' }] });
const rankProfile = { status: 'ok', scoringVersion: 'strength_beta_v1', rankSchemeVersion: 'sg_capability_rank_v1', confidenceCalibrationVersion: 'muscle_aggregate_structural_v1', muscles: [
  muscle('pectoralis_major_sternocostal', 68.5, 0.6), muscle('latissimus_dorsi', 55.1, 0.6), muscle('rectus_femoris', 85.2, 0.7, 2), muscle('gluteus_maximus', 30.4, 0.5), muscle('anterior_deltoid', 96.1, 0.55), muscle('biceps_brachii', 10.2, 0.75, 2), muscle('biceps_femoris_long_head', 99.4, 0.6), muscle('rectus_abdominis', 45.0, 0.4), muscle('triceps_brachii_long_head', 62.0, 0.5), muscle('erector_spinae', 22.0, 0.45),
], counts: { scored: 6, estimatedOnly: 0, failed: 0 }, unranked: [], rejectedMuscles: 0, ageAdjustment: { applied: 0, outsideTable: 0, noAge: 6, status: 'not_applied', reason: 'age_missing', ageYears: null } };
const lifts = JSON.stringify([
  { id: 'w1', exerciseName: 'Barbell Back Squat', observedAt: '2026-09-20T10:00:00.000Z', measurementType: 'MEASURED_1RM', loadKg: 120, repetitions: 1, bodyMassKgAtTest: 66 },
  { id: 'w2', exerciseName: 'Barbell Bench Press', observedAt: '2026-09-21T10:00:00.000Z', measurementType: 'MEASURED_1RM', loadKg: 80, repetitions: 1, bodyMassKgAtTest: 66 },
  { id: 'w3', exerciseName: 'Conventional Deadlift', observedAt: '2026-09-22T10:00:00.000Z', measurementType: 'MEASURED_1RM', loadKg: 150, repetitions: 1, bodyMassKgAtTest: 66 },
]);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const wire = async (p) => {
  await p.route('**qiccnqkypbhlwpmjcsri.supabase.co/**', (r) => r.request().url().endsWith('.mp4') ? r.abort() : r.fulfill({ contentType: 'image/png', body: logo }));
  await p.route('**/api/trpc/**', (route) => { const path = new URL(route.request().url()).pathname.replace('/api/trpc/', ''); return route.fulfill({ contentType: 'application/json', body: JSON.stringify(path.split(',').map((one) => ({ result: { data: { json: one.includes('muscleRanks') ? rankProfile : null } } }))) }); });
};
const seed = async (p, extra = {}) => { await p.goto(`${base}/?workspace=command`); await p.evaluate(([profile, extra]) => { localStorage.clear(); localStorage.setItem('gym-optimizer-athlete-profile-v1', profile); localStorage.setItem('sports-genome-launch-experience-enabled-v1', 'off'); for (const [k, v] of Object.entries(extra)) localStorage.setItem(k, v); }, [profile, extra]); };
const dock = (p, l) => p.locator('.mobile-bottom-nav button').filter({ hasText: l }).first().dispatchEvent('click');
const tab = (p, l) => p.locator('.workspace-top-switcher button').filter({ hasText: l }).first().dispatchEvent('click');
const wait = (p, ms) => p.waitForTimeout(ms);
const settle = (p) => p.waitForSelector('[data-sonner-toast]', { state: 'detached', timeout: 8000 }).catch(() => {});
const applyZoom = (p) => zoom !== 1 ? p.addStyleTag({ content: `html { font-size: ${zoom * 100}% !important; }` }) : Promise.resolve();
const draftDay = async (p, name) => {
  await p.locator('.training-plan-days [role="tab"], .training-plan-days button').filter({ hasText: new RegExp(`^${name}`) }).first().dispatchEvent('click'); await wait(p, 700);
  await p.locator('.day-plan-draft > summary').first().dispatchEvent('click').catch(() => {}); await wait(p, 300);
  await p.locator('.day-plan-draft button').filter({ hasText: /Draft this (session|workout)/i }).first().dispatchEvent('click').catch(() => {}); await wait(p, 1000); await settle(p);
};
const shotEl = async (p, sel, name, w) => { const el = p.locator(sel).first(); await el.scrollIntoViewIfNeeded().catch(() => {}); await wait(p, 300); await p.evaluate((sel) => { const el = document.querySelector(sel); if (el) window.scrollBy(0, el.getBoundingClientRect().top - 120); }, sel); await wait(p, 300); await p.screenshot({ path: `${out}/${label}-${name}-${w}${zoom !== 1 ? '-zoom' : ''}.png` }); };
const shot = (p, name, w) => p.screenshot({ path: `${out}/${label}-${name}-${w}${zoom !== 1 ? '-zoom' : ''}.png` });

for (const w of widths) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 844 }, deviceScaleFactor: 2 }); const p = await ctx.newPage(); await wire(p);
  const now = new Date(); const done = new Date(now.getTime() - 3600e3).toISOString();
  const history = JSON.stringify([{ id: 'h1', title: 'Push', dayLabel: 'Week 1 · Day 01 · Push', startedAt: done, completedAt: done, status: 'completed', exercises: [{ id: 'e1', exerciseName: 'Barbell Bench Press', plannedPrescription: '4 × 3–5', sets: [{ weight: '80', reps: '5', height: '', completed: true, skipped: false }] }] }]);
  await seed(p, { 'sports-genome-device-strength-observations-v1': lifts, 'sports-genome-device-workout-history-v1': history });
  await p.goto(`${base}/`); await wait(p, 2200); await applyZoom(p);
  // Plan: Push, Pull and Sport Transfer drafted so Review has overlap to talk about.
  await dock(p, 'Train'); await wait(p, 1000); await draftDay(p, 'Push'); await draftDay(p, 'Pull'); await draftDay(p, 'Sport Transfer');
  await tab(p, 'Plan'); await wait(p, 500); await shotEl(p, '.day-plan-list', 'plan-rows', w);
  // Coverage on an empty day (Upper).
  await p.locator('.training-plan-days [role="tab"], .training-plan-days button').filter({ hasText: /^Upper/ }).first().dispatchEvent('click'); await wait(p, 700);
  await p.locator('.rate-stack-trigger').first().dispatchEvent('click').catch(() => {}); await wait(p, 800); await shot(p, 'coverage-empty', w);
  await p.locator('.stack-analysis-head button').first().dispatchEvent('click').catch(() => {}); await wait(p, 400);
  // Review: volume and recovery.
  await tab(p, 'Review'); await wait(p, 900); await applyZoom(p);
  await shotEl(p, '.weekly-volume-panel', 'review-volume', w);
  await shotEl(p, '.recovery-spacing-panel', 'review-recovery', w);
  await shotEl(p, '.programming-guide-panel', 'review-guide', w);
  // Plan in Reorder mode, on the staged day.
  await tab(p, 'Plan'); await wait(p, 500);
  await p.locator('.training-plan-days [role="tab"], .training-plan-days button').filter({ hasText: /^Sport Transfer/ }).first().dispatchEvent('click'); await wait(p, 700);
  await p.locator('.day-action-reorder').first().dispatchEvent('click').catch(() => {}); await wait(p, 400); await shotEl(p, '.day-plan-list', 'plan-reorder', w);
  await p.locator('.day-action-reorder').first().dispatchEvent('click').catch(() => {}); await wait(p, 300);
  // Home, next workout staged (Sport Transfer) with Push completed this week.
  await dock(p, 'Home'); await wait(p, 1000); await p.evaluate(() => window.scrollTo(0, 0)); await wait(p, 300); await shot(p, 'home', w);
  console.log(w, 'home', JSON.stringify(await p.evaluate(() => ({ cta: document.querySelector('.today-action-cta')?.textContent?.trim(), figure: !!document.querySelector('.home-focus'), caption: document.querySelector('.home-focus .anatomy-figure')?.getAttribute('aria-label')?.slice(0, 80), strip: [...document.querySelectorAll('.home-week-strip li')].map((li) => li.dataset.state + ':' + li.textContent.trim()), week: document.querySelector('.home-week-line')?.textContent?.trim() }))));
  // Home with the completed day selected: the record is the primary action.
  await dock(p, 'Train'); await tab(p, 'Plan'); await wait(p, 500);
  await p.locator('.training-plan-days [role="tab"], .training-plan-days button').filter({ hasText: /^Push/ }).first().dispatchEvent('click'); await wait(p, 600);
  await dock(p, 'Home'); await wait(p, 900); await p.evaluate(() => window.scrollTo(0, 0)); await wait(p, 300); await shot(p, 'home-completed', w);
  console.log(w, 'home-completed', JSON.stringify(await p.evaluate(() => ({ cta: document.querySelector('.today-action-cta')?.textContent?.trim(), secondary: document.querySelector('.today-action-secondary')?.textContent?.trim() }))));
  // Strength, ranked.
  await dock(p, 'Progress'); await tab(p, 'Strength'); await wait(p, 1500); await applyZoom(p);
  await p.evaluate(() => document.querySelector('.strength-body-map')?.scrollIntoView()); await wait(p, 400); await shot(p, 'strength-front', w);
  await p.locator('.strength-body-side-toggle').filter({ hasText: /Back/ }).first().dispatchEvent('click'); await wait(p, 500); await shot(p, 'strength-back', w);
  await p.evaluate(() => document.querySelector('.rank-legend')?.scrollIntoView()); await wait(p, 300); await shot(p, 'strength-legend', w);
  console.log(w, JSON.stringify(await p.evaluate(() => ({ mode: document.querySelector('.strength-body-map')?.dataset.mode, encoding: document.querySelector('.anatomy-figure')?.dataset.encoding, fills: [...new Set([...document.querySelectorAll('.anatomy-muscle[data-rank] path')].map((el) => getComputedStyle(el).fill))].slice(0, 8), opacity: [...new Set([...document.querySelectorAll('.anatomy-muscle[data-rank]')].map((el) => { let o = 1; let n = el; while (n && n !== document.body) { o *= Number(getComputedStyle(n).opacity); n = n.parentElement; } return o.toFixed(2); }))] }))));
  await ctx.close();
}
await browser.close(); console.log('done', label);
