// Body Lab muscle map: the three role fills (primary, supporting, stabilizing) and the legend
// that names them, on the Wrestling / Bridge action at phone width. Also the Back view.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { readFileSync, mkdirSync } from 'node:fs';
const out = '/home/user/Sports-genome/docs/ux-next/evidence'; mkdirSync(out, { recursive: true });
const scratch = '/tmp/claude-0/-home-user-Sports-genome/72e48dc4-5d2e-5f13-9687-9bbe2b3f83cf/scratchpad';
const logo = readFileSync(`${scratch}/logo.png`);
const profile = JSON.stringify({ version: 3, sportId: 'wrestling', sportContextMode: 'sport', goal: 'Max strength', trainingDays: 5, gymMinutes: 75, movementId: 'wrestling-1', baseline: { experience: 'Intermediate', weightUnit: 'lb', bodyWeight: 145, equipment: { gymAccess: 'Commercial gym', availableEquipment: ['Barbell', 'Dumbbells', 'Cable', 'Machine', 'Bodyweight', 'Bench', 'Free weights'] } } });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const p = await ctx.newPage();
await p.route('**qiccnqkypbhlwpmjcsri.supabase.co/**', (r) => r.request().url().endsWith('.mp4') ? r.abort() : r.fulfill({ contentType: 'image/png', body: logo }));
await p.route('**/api/trpc/**', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(new URL(route.request().url()).pathname.replace('/api/trpc/', '').split(',').map(() => ({ result: { data: { json: null } } }))) }));
await p.goto('http://localhost:4173/?workspace=command'); await p.evaluate((profile) => { localStorage.clear(); localStorage.setItem('gym-optimizer-athlete-profile-v1', profile); localStorage.setItem('sports-genome-launch-experience-enabled-v1', 'off'); }, profile);
const dock = async (label) => { await p.locator('.dock-nav button, nav button, [role="tablist"] button').filter({ hasText: new RegExp(`^${label}$`) }).first().dispatchEvent('click'); await p.waitForTimeout(700); };
await p.goto('http://localhost:4173/?workspace=command'); await p.waitForTimeout(2500);
await dock('Body Lab');
await p.locator('button').filter({ hasText: /^Muscles$/ }).first().dispatchEvent('click').catch(() => undefined); await p.waitForTimeout(1200);
const state = async () => p.evaluate(() => ({
  action: document.querySelector('.body-lab-selection-context, .body-lab-nav')?.textContent?.trim().slice(0, 60),
  legend: [...document.querySelectorAll('.atlas-heat-legend-pro span')].map((s) => s.textContent?.trim()),
  swatches: [...document.querySelectorAll('.atlas-heat-legend-pro .atlas-swatch')].map((s) => getComputedStyle(s).backgroundImage.slice(0, 70) || getComputedStyle(s).backgroundColor),
  roles: Object.fromEntries([...document.querySelectorAll('.anatomy-muscle[data-role]:not([data-role="neutral"])')].map((g) => [g.getAttribute('data-muscle'), g.getAttribute('data-role')])),
  fills: [...new Set([...document.querySelectorAll('.anatomy-muscle[data-role]:not([data-role="neutral"]) path')].map((path) => `${path.parentElement.getAttribute('data-role')}=${path.style.fill}`))],
  stops: [...document.querySelectorAll('.anatomy-figure linearGradient')].map((g) => `${g.id.split('-').pop()}:${[...g.querySelectorAll('stop')].map((s) => getComputedStyle(s).stopColor).join('→')}`),
  counts: document.querySelector('.atlas-ranking-head span')?.textContent,
  dots: [...document.querySelectorAll('.atlas-role-row')].slice(0, 9).map((row) => `${row.querySelector('strong')?.textContent}: ${row.querySelector('.atlas-role-tag')?.textContent} ${getComputedStyle(row.querySelector('.atlas-rank-dot')).backgroundColor} tag ${getComputedStyle(row.querySelector('.atlas-role-tag')).color}`),
}));
console.log('front', JSON.stringify(await state(), null, 1));
await p.evaluate(() => document.querySelector('.atlas-body-chart-wrap')?.scrollIntoView({ block: 'start' })); await p.waitForTimeout(300);
await p.screenshot({ path: `${out}/after-role-colours-front-390.png` });
await p.locator('button').filter({ hasText: /^Back$/ }).first().dispatchEvent('click'); await p.waitForTimeout(600);
await p.screenshot({ path: `${out}/after-role-colours-back-390.png` });
console.log('back roles', JSON.stringify((await state()).roles));
await p.locator('.atlas-ranking-toggle').first().dispatchEvent('click').catch(() => undefined); await p.waitForTimeout(400);
await p.evaluate(() => document.querySelector('.atlas-ranking')?.scrollIntoView({ block: 'start' })); await p.waitForTimeout(300);
await p.screenshot({ path: `${out}/after-role-colours-rows-390.png` });
await browser.close();
