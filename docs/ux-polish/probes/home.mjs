import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { readFileSync } from 'node:fs';
const out = new URL('.', import.meta.url).pathname.replace(/\/$/, '');
const logo = readFileSync(`${out}/logo.png`);
const widths = (process.argv[2] || '390').split(',').map(Number);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

export async function boot(p, { draft = true } = {}) {
  await p.route('**qiccnqkypbhlwpmjcsri.supabase.co/**', async (r) => r.request().url().endsWith('.mp4') ? r.abort() : r.fulfill({ contentType: 'image/png', body: logo }));
  await p.route('**/api/trpc/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace('/api/trpc/', '');
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(path.split(',').map(() => ({ result: { data: { json: null } } }))) });
  });
  await p.goto('http://localhost:4173/');
  await p.evaluate(() => localStorage.setItem('gym-optimizer-athlete-profile-v1', JSON.stringify({
    version: 3, sportId: 'wrestling', sportContextMode: 'sport', goal: 'Max strength', trainingDays: 5, gymMinutes: 75, movementId: 'wrestling-1',
    baseline: { experience: 'Intermediate', weightUnit: 'lb', bodyWeight: 145, equipment: { gymAccess: 'Commercial gym', availableEquipment: ['Barbell','Dumbbells','Cable','Machine','Bodyweight','Bench','Free weights'] } } })));
  await p.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2600);
  if (draft) {
    await p.locator('.mobile-bottom-nav button').filter({ hasText: /^Train$/i }).first().dispatchEvent('click');
    await p.waitForTimeout(1400);
    await p.locator('.day-plan-draft > summary').first().dispatchEvent('click').catch(() => {});
    await p.waitForTimeout(400);
    await p.locator('.day-plan-draft button').filter({ hasText: /Draft this (session|workout)/i }).first().dispatchEvent('click').catch(() => {});
    await p.waitForTimeout(1200);
    await p.locator('.mobile-bottom-nav button').filter({ hasText: /^Home$/i }).first().dispatchEvent('click');
    await p.waitForTimeout(1400);
  }
}

const tab = (p, re) => p.locator('.workspace-top-switcher button, .workspace-context-tabs button').filter({ hasText: re }).first();

if (import.meta.url === `file://${process.argv[1]}`) for (const width of widths) {
  const p = await b.newPage({ viewport: { width, height: 844 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await boot(p);
  const read = () => p.evaluate(() => {
    const t = (sel) => document.querySelector(sel)?.textContent?.trim();
    const top = (sel) => { const r = document.querySelector(sel)?.getBoundingClientRect(); return r ? Math.round(r.top) : null; };
    const off = [...document.querySelectorAll('*')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > innerWidth + 1; }).map(e => e.className?.toString().slice(0, 40)).slice(0, 4);
    return { scrollW: document.documentElement.scrollWidth, off,
      state: t('.today-action-state'), priority: t('.today-action-priority h2'),
      hero: t('.today-action-primary h2'), position: t('.today-action-position'), count: t('.today-action-count'),
      reviewTop: top('.today-action-cta'), editTop: top('.today-action-secondary'),
      facts: [...document.querySelectorAll('.today-action-facts > *')].map(e => e.textContent.trim()),
      focus: t('.home-focus'), priorityRows: [...document.querySelectorAll('.home-priority-row')].map(e => e.innerText.replace(/\n/g, ' | ')),
      entries: [...document.querySelectorAll('.home-entries button')].map(e => e.textContent.trim()),
      pageH: document.documentElement.scrollHeight };
  });
  const m = await read();
  console.log(`\n== ${width}px ==`); console.log(JSON.stringify(m, null, 1));
  await p.screenshot({ path: `${out}/home-${width}.png`, fullPage: true });
  if (width === 390) {
    // Review session -> Session prestart, same day, no workout started.
    await p.locator('.today-action-cta').dispatchEvent('click'); await p.waitForTimeout(1300);
    console.log('review ->', JSON.stringify(await p.evaluate(() => ({ ws: location.search, day: document.querySelector('.session-prestart-day')?.textContent, pos: document.querySelector('.session-prestart-position')?.textContent, live: Boolean(document.querySelector('.live-set-card')) }))));
    await p.locator('.mobile-bottom-nav button').filter({ hasText: /^Home$/i }).first().dispatchEvent('click'); await p.waitForTimeout(1200);
    await p.locator('.today-action-secondary').dispatchEvent('click'); await p.waitForTimeout(1300);
    console.log('edit ->', JSON.stringify(await p.evaluate(() => ({ ws: location.search, plan: document.querySelector('.training-plan-identity')?.textContent?.slice(0, 60) }))));
    await p.locator('.mobile-bottom-nav button').filter({ hasText: /^Home$/i }).first().dispatchEvent('click'); await p.waitForTimeout(1200);
    await p.locator('.home-focus .home-link').dispatchEvent('click'); await p.waitForTimeout(1300);
    console.log('explore ->', JSON.stringify(await p.evaluate(() => ({ ws: location.search, ctx: document.querySelector('.body-lab-selection-context')?.textContent }))));
    await p.locator('.mobile-bottom-nav button').filter({ hasText: /^Home$/i }).first().dispatchEvent('click'); await p.waitForTimeout(1200);
    await p.locator('.home-section-head .home-link').dispatchEvent('click'); await p.waitForTimeout(1300);
    console.log('all matches ->', JSON.stringify(await p.evaluate(() => ({ ws: location.search, action: document.querySelector('.matches-action select')?.selectedOptions[0]?.textContent }))));
    await p.locator('.mobile-bottom-nav button').filter({ hasText: /^Home$/i }).first().dispatchEvent('click'); await p.waitForTimeout(1200);
    await p.locator('.home-priority-row').first().dispatchEvent('click'); await p.waitForTimeout(1200);
    console.log('priority row ->', JSON.stringify(await p.evaluate(() => ({ inspector: Boolean(document.querySelector('.exercise-inspector, [class*="inspect"]')), title: document.querySelector('.exercise-inspector h1, .exercise-inspector h2, [class*="inspection"] h2')?.textContent?.slice(0, 60) }))));
  }
  console.log('errors:', errs.length ? errs.slice(0, 2) : 'none');
  await p.close();
}
await b.close();
