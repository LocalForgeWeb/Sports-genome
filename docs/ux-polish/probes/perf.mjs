// PERF-01 baseline: initial load, one catalog query, one anatomy selection, one set log. Median of 3, same fixture.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { boot } from './home.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const dock = (p, l) => p.locator('.mobile-bottom-nav button').filter({ hasText: l }).first().dispatchEvent('click');
const tab = (p, l) => p.locator('.workspace-top-switcher button').filter({ hasText: l }).first().dispatchEvent('click');
const timed = async (p, act, until) => { const t0 = Date.now(); await act(); await p.waitForFunction(until, null, { polling: 5, timeout: 15000 }); return Date.now() - t0; };
const runs = { load: [], loadBytes: [], jsBytes: [], cssBytes: [], firstCta: [], query: [], anatomy: [], log: [] };
for (let i = 0; i < 3; i++) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await boot(p, { draft: true }); // warm: profile seeded, draft made
  // Cold-ish initial load of Home (cache cleared by new context above only for the first goto; use a fresh context now).
  const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const p2 = await ctx2.newPage();
  await p2.route('**qiccnqkypbhlwpmjcsri.supabase.co/**', (r) => r.fulfill({ contentType: 'image/png', body: Buffer.alloc(0) }));
  await p2.route('**/api/trpc/**', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(new URL(route.request().url()).pathname.replace('/api/trpc/', '').split(',').map(() => ({ result: { data: { json: null } } }))) }));
  await p2.goto('http://localhost:4173/'); await p2.evaluate(() => localStorage.setItem('gym-optimizer-athlete-profile-v1', JSON.stringify({ version: 3, sportId: 'wrestling', sportContextMode: 'sport', goal: 'Max strength', trainingDays: 5, gymMinutes: 75, movementId: 'wrestling-1', baseline: { experience: 'Intermediate', weightUnit: 'lb', bodyWeight: 145, equipment: { gymAccess: 'Commercial gym', availableEquipment: ['Barbell', 'Dumbbells', 'Cable', 'Machine', 'Bodyweight', 'Bench', 'Free weights'] } } })));
  const t0 = Date.now();
  await p2.goto('http://localhost:4173/?workspace=command', { waitUntil: 'commit' });
  await p2.waitForSelector('.today-action-cta, .today-action-primary', { timeout: 20000 });
  runs.firstCta.push(Date.now() - t0);
  const nav = await p2.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; const res = performance.getEntriesByType('resource'); const sum = (f) => res.filter(f).reduce((a, r) => a + (r.transferSize || r.encodedBodySize || 0), 0); return { load: Math.round(n.loadEventEnd), js: sum((r) => r.name.endsWith('.js')), css: sum((r) => r.name.endsWith('.css')), total: sum(() => true) + (n.transferSize || 0), jsCount: res.filter((r) => r.name.endsWith('.js')).length }; });
  runs.load.push(nav.load); runs.jsBytes.push(nav.js); runs.cssBytes.push(nav.css); runs.loadBytes.push(nav.total);
  // Warm, returning launch: same context, reload.
  const t1 = Date.now(); await p2.reload({ waitUntil: 'commit' }); await p2.waitForSelector('.today-action-cta, .today-action-primary', { timeout: 20000 }); (runs.warm ||= []).push(Date.now() - t1);
  await ctx2.close();
  // Catalog query
  await dock(p, 'Body Lab'); await tab(p, 'Exercises'); await p.waitForTimeout(800);
  const before = await p.evaluate(() => document.querySelectorAll('.catalog-discovery-card').length);
  runs.query.push(await timed(p, () => p.locator('input[aria-label="Search exercises"]').fill('press'), (b) => document.querySelectorAll('.catalog-discovery-card').length !== b && document.querySelector('input[aria-label="Search exercises"]').value === 'press', before));
  // Anatomy selection
  await tab(p, 'Muscles'); await p.waitForTimeout(800);
  runs.anatomy.push(await timed(p, () => p.locator('.atlas-role-row').nth(1).dispatchEvent('click'), () => document.querySelector('.atlas-role-row.is-selected, .atlas-role-row[aria-pressed="true"]') === document.querySelectorAll('.atlas-role-row')[1]));
  // Log a set
  await dock(p, 'Train'); await tab(p, 'Workout'); await p.waitForTimeout(800); await p.locator('.session-prestart-start').dispatchEvent('click'); await p.waitForTimeout(700);
  runs.log.push(await timed(p, () => p.locator('.live-set-commit').dispatchEvent('click'), () => document.querySelectorAll('.session-set-complete').length === 1));
  await ctx.close();
}
console.log(JSON.stringify({ firstCtaMs: median(runs.firstCta), warmCtaMs: median(runs.warm || [0]), loadEventMs: median(runs.load), jsKB: Math.round(median(runs.jsBytes) / 1024), cssKB: Math.round(median(runs.cssBytes) / 1024), totalKB: Math.round(median(runs.loadBytes) / 1024), queryMs: median(runs.query), anatomyMs: median(runs.anatomy), logMs: median(runs.log), raw: runs }));
await browser.close();
