import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { boot } from './home.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const dock = (p, l) => p.locator('.mobile-bottom-nav button').filter({ hasText: l }).first().dispatchEvent('click');
const tab = (p, l) => p.locator('.workspace-top-switcher button').filter({ hasText: l }).first().dispatchEvent('click');
const p = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await boot(p, { draft: true });
await dock(p, 'Train'); await tab(p, 'Plan'); await p.waitForTimeout(800);
await p.evaluate(() => window.scrollTo(0, 700)); await p.waitForTimeout(500);
console.log('STICKY', JSON.stringify(await p.evaluate(() => { const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), pos: getComputedStyle(e).position }; }; return { scrollY: window.scrollY, topbar: r('.apex-topbar'), tabs: r('.workspace-top-switcher'), shell: r('.workspace-top-switcher-shell') }; })));
// Smart Draft on a day that already has rows: what does it offer, and does applying ask first?
await p.evaluate(() => window.scrollTo(0, 0));
await p.locator('.day-plan-draft > summary').first().dispatchEvent('click'); await p.waitForTimeout(400);
console.log('DRAFT', JSON.stringify(await p.evaluate(() => ({ summary: document.querySelector('.day-plan-draft > summary')?.innerText.replace(/\n/g, ' '), buttons: [...document.querySelectorAll('.day-plan-draft button')].map((b) => b.textContent.trim()).slice(0, 6), copy: document.querySelector('.day-plan-draft')?.innerText.replace(/\n/g, ' ').slice(0, 300) }))));
const replace = p.locator('.day-plan-draft button').filter({ hasText: /replace|draft|apply/i }).first();
if (await replace.count()) {
  const label = (await replace.textContent()).trim();
  const rowsBefore = await p.locator('.custom-prescription').count();
  await replace.dispatchEvent('click'); await p.waitForTimeout(700);
  const after = await p.evaluate(() => ({ confirm: document.querySelector('[role="alertdialog"], [role="dialog"]')?.innerText.replace(/\n/g, ' ').slice(0, 220) ?? null, rows: document.querySelectorAll('.custom-prescription').length, draft: document.querySelector('.day-plan-draft')?.innerText.replace(/\n/g, ' ').slice(0, 220), toast: document.querySelector('[data-sonner-toast]')?.innerText.replace(/\n/g, ' ').slice(0, 120) ?? null }));
  console.log('DRAFT apply', JSON.stringify({ label, rowsBefore, ...after }));
  await p.locator('[role="alertdialog"] button, [role="dialog"] button').filter({ hasText: /cancel|keep|close|back/i }).first().dispatchEvent('click').catch(() => {});
}
// Empty day → Workout: what does prestart say?
await p.locator('.training-plan-day').nth(1).dispatchEvent('click'); await p.waitForTimeout(500);
await tab(p, 'Workout'); await p.waitForTimeout(800);
console.log('EMPTY DAY WORKOUT', JSON.stringify(await p.evaluate(() => ({ text: document.querySelector('main')?.innerText.replace(/\n/g, ' | ').slice(0, 200), start: !!document.querySelector('.session-prestart-start'), startDisabled: document.querySelector('.session-prestart-start')?.disabled, buttons: [...document.querySelectorAll('main button')].map((b) => b.textContent.trim()).slice(0, 5) }))));
// Double tap on Log set.
await tab(p, 'Plan'); await p.waitForTimeout(400); await p.locator('.training-plan-day').nth(4).dispatchEvent('click'); await p.waitForTimeout(400);
await tab(p, 'Workout'); await p.waitForTimeout(800); await p.locator('.session-prestart-start').dispatchEvent('click'); await p.waitForTimeout(800);
await p.evaluate(() => { const b = document.querySelector('.live-set-commit'); b.click(); b.click(); }); await p.waitForTimeout(600);
console.log('DOUBLE LOG', JSON.stringify(await p.evaluate(() => ({ complete: document.querySelectorAll('.session-set-complete').length, set: document.querySelector('.live-set-prescription span')?.textContent }))));
await browser.close();
