// Landscape logging (LAY-04), reduced motion (QA-10), a missing image and a slow server (QA-08).
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { boot } from './home.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const dock = (p, l) => p.locator('.mobile-bottom-nav button').filter({ hasText: l }).first().dispatchEvent('click');
const tab = (p, l) => p.locator('.workspace-top-switcher button').filter({ hasText: l }).first().dispatchEvent('click');
const wait = (p, ms = 700) => p.waitForTimeout(ms);
const say = (id, pass, d) => console.log(`${id} ${pass ? 'PASS' : 'FAIL'} ${JSON.stringify(d)}`);
{ // Landscape phone
  const p = await browser.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
  await boot(p, { draft: true });
  await dock(p, 'Train'); await tab(p, 'Workout'); await wait(p, 800); await p.locator('.session-prestart-start').dispatchEvent('click'); await wait(p, 800);
  const r = await p.evaluate(() => { const rect = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { t: Math.round(b.top), b: Math.round(b.bottom) }; }; const input = document.querySelector('.live-set-entry input'); input.focus(); input.scrollIntoView({ block: 'center' }); const i = rect('.live-set-entry input'); const btn = document.querySelector('.live-set-commit'); btn.scrollIntoView({ block: 'center' }); const l = rect('.live-set-commit'); const dockEl = rect('.mobile-bottom-nav'); return { input: i, log: l, dock: dockEl, scrollW: document.documentElement.scrollWidth, logClear: l && dockEl ? l.b <= dockEl.t : true }; });
  say('LAY-04 landscape logging', r.scrollW === 844 && r.input.t >= 0 && r.input.b <= 390 && r.log.t >= 0 && r.log.b <= 390 && r.logClear, r);
  await p.screenshot({ path: '/home/user/Sports-genome/docs/ux-polish/after/workout-landscape-844.png' });
  await p.close();
}
{ // Reduced motion: results still communicated
  const p = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await p.emulateMedia({ reducedMotion: 'reduce' });
  await boot(p, { draft: true });
  await dock(p, 'Body Lab'); await tab(p, 'Exercises'); await wait(p, 900);
  await p.locator('.catalog-discovery-actions button:last-child').first().dispatchEvent('click'); await wait(p, 500);
  const toast = await p.evaluate(() => document.querySelector('[data-sonner-toast]')?.innerText.split('\n')[0]);
  await p.locator('.catalog-discovery-card-copy').first().dispatchEvent('click'); await wait(p, 600);
  const overlay = await p.evaluate(() => ({ open: !!document.querySelector('.exercise-intelligence'), skeletonAnim: getComputedStyle(document.body).animationName }));
  say('QA-10 reduced motion', toast?.startsWith('Added to') && overlay.open, { toast, overlay });
  await p.close();
}
{ // Missing image and a slow server
  const p = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await boot(p, { draft: true });
  await p.route('**qiccnqkypbhlwpmjcsri.supabase.co/**', (r) => r.abort());
  await p.route('**/api/trpc/**', async (route) => { await new Promise((r) => setTimeout(r, 3000)); return route.fulfill({ contentType: 'application/json', body: JSON.stringify(new URL(route.request().url()).pathname.replace('/api/trpc/', '').split(',').map(() => ({ result: { data: { json: null } } }))) }); });
  const t0 = Date.now(); await p.goto('http://localhost:4173/?workspace=command', { waitUntil: 'commit' }); await p.waitForSelector('.today-action-cta', { timeout: 15000 }); const ctaMs = Date.now() - t0;
  const img = await p.evaluate(() => { const i = document.querySelector('.topbar-brand-logo'); const b = i.getBoundingClientRect(); return { w: Math.round(b.width), h: Math.round(b.height), alt: i.alt, complete: i.complete, natural: i.naturalWidth, topbarH: Math.round(document.querySelector('.apex-topbar').getBoundingClientRect().height) }; });
  say('QA-08 slow server & missing image', ctaMs < 4000 && img.w === 44 && img.h === 44 && img.topbarH < 90, { ctaMs, img });
  await p.close();
}
await browser.close();
