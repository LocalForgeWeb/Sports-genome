// Regional's purple (#9332F7, owner, 22 Oct 2026) on the strength map, its legend and the rank
// card, in the production build (vite preview). Headless Chromium emulating an iPhone (viewport,
// isMobile, hasTouch, device scale 3): emulation, not an iPhone or Safari.
// The rank route is answered with a recorded response whose scores are set to put the lats in
// Regional (70), the upper back in Varsity (50) and the biceps in State (85).
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { mkdirSync, readFileSync } from 'node:fs';

const out = process.argv[2]; mkdirSync(out, { recursive: true });
const base = 'http://localhost:4173';
const recorded = JSON.parse(readFileSync(new URL('../../percentile-ceiling/route-responses.json', import.meta.url), 'utf8')).A;
const scoreOf = { latissimus_dorsi: 70, middle_trapezius: 50, rhomboid_major: 50, rhomboid_minor: 50, biceps_brachii: 85 };
const response = { ...recorded, muscles: recorded.muscles.map((m) => scoreOf[m.canonicalName] === undefined ? m : { ...m, percentile: scoreOf[m.canonicalName], scoreBound: 'exact', lowerBound: scoreOf[m.canonicalName], upperBound: scoreOf[m.canonicalName], evidence: m.evidence.map((e) => ({ ...e, bound: 'exact', exercisePercentile: scoreOf[m.canonicalName], countedLow: scoreOf[m.canonicalName], countedHigh: scoreOf[m.canonicalName] })) }) };
const profile = JSON.stringify({ version: 3, sportId: 'wrestling', sportContextMode: 'sport', goal: 'Max strength', trainingDays: 3, gymMinutes: 60, movementId: 'wrestling-17', baseline: { experience: 'Intermediate', weightUnit: 'lb', bodyWeight: 145, sexForReference: 'male', equipment: { gymAccess: 'Commercial gym', availableEquipment: ['Barbell', 'Machine', 'Cable'] } } });
const lifts = JSON.stringify([{ id: 'a-lp', exerciseName: 'Lat Pulldown', observedAt: '2026-10-13T12:00:00.000Z', measurementType: 'MULTI_REP', loadKg: 84.822, repetitions: 6, bodyMassKgAtTest: 65.77 }]);

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const results = [];
const check = (name, pass, detail = '') => { results.push(Boolean(pass)); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`); };
for (const [width, height] of [[390, 844], [375, 667]]) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.route('**/api/trpc/**', (route) => {
    const url = new URL(route.request().url());
    const body = url.pathname.replace('/api/trpc/', '').split(',').map((proc) => ({ result: { data: { json: proc === 'strengthProfile.muscleRanks' ? response : null } } }));
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(url.searchParams.get('batch') ? body : body[0]) });
  });
  await p.route('**qiccnqkypbhlwpmjcsri.supabase.co/**', (r) => r.abort());
  await p.goto(`${base}/?workspace=command`);
  await p.evaluate(([profile, lifts]) => { localStorage.clear(); localStorage.setItem('gym-optimizer-athlete-profile-v1', profile); localStorage.setItem('sports-genome-device-strength-observations-v1', lifts); localStorage.setItem('sports-genome-launch-experience-enabled-v1', 'off'); localStorage.setItem('sports-genome-launched-before-v1', 'yes'); }, [profile, lifts]);
  await p.goto(`${base}/?workspace=strength`); await p.waitForTimeout(2500);
  const w = String(width);

  const token = await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--sg-rank-regional-color').trim());
  check(`${w}: the Regional token is #9332F7`, token.toUpperCase() === '#9332F7', token);
  const fills = await p.locator('.anatomy-muscle[data-rank="regional"] > path').evaluateAll((paths) => [...new Set(paths.map((path) => getComputedStyle(path).fill))]);
  check(`${w}: Regional muscles on the map are filled with it`, fills.length > 0 && fills.every((fill) => fill === 'rgb(147, 50, 247)'), JSON.stringify(fills));
  const swatch = await p.locator('.rank-legend-swatch[data-rank="regional"]').first().evaluate((node) => getComputedStyle(node).backgroundColor).catch(() => null);
  check(`${w}: the legend's Regional swatch is it`, swatch === 'rgb(147, 50, 247)', String(swatch));
  check(`${w}: no sideways scroll`, await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await p.locator('.anatomy-muscle[data-rank="regional"]').first().scrollIntoViewIfNeeded().catch(() => {});
  await p.screenshot({ path: `${out}/map-${w}.jpg`, type: 'jpeg', quality: 72 });
  await p.locator('.rank-legend').first().scrollIntoViewIfNeeded().catch(() => {});
  await p.screenshot({ path: `${out}/legend-${w}.jpg`, type: 'jpeg', quality: 72 });
  // The lats card: the rank's own badge and name.
  await p.getByText(/View all \d+ regions/).first().dispatchEvent('click').catch(() => {}); await p.waitForTimeout(400);
  await p.locator('.region-grid-card').filter({ hasText: /^Lats/ }).first().dispatchEvent('click').catch(() => {}); await p.waitForTimeout(1200);
  const card = p.locator('.rank-card').first();
  check(`${w}: the lats card reads Regional`, /Regional/.test((await card.textContent().catch(() => '')) ?? ''));
  await card.scrollIntoViewIfNeeded().catch(() => {});
  await p.screenshot({ path: `${out}/card-${w}.jpg`, type: 'jpeg', quality: 72 });
  await ctx.close();
}
await browser.close();
const failed = results.filter((r) => !r).length;
console.log(`${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
