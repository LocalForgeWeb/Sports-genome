import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { boot } from './home.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const dock = (p, l) => p.locator('.mobile-bottom-nav button').filter({ hasText: l }).dispatchEvent('click');
const tab = (p, l) => p.locator('.workspace-top-switcher button').filter({ hasText: l }).dispatchEvent('click');
const shell = (p) => p.evaluate(() => {
  const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return `${Math.round(b.left)}-${Math.round(b.right)}x${Math.round(b.height)}`; };
  const util = document.querySelector('.topbar-utilities')?.getBoundingClientRect();
  return { topbar: r('.apex-topbar'), brand: document.querySelector('.topbar-wordmark')?.textContent, context: document.querySelector('.topbar-context-chips')?.innerText.replace(/\n/g, ' '), utilities: [...document.querySelectorAll('.topbar-utilities button')].map((b) => `${b.getAttribute('aria-label')}@${Math.round(b.getBoundingClientRect().width)}x${Math.round(b.getBoundingClientRect().height)}`), tabRow: r('.workspace-top-switcher-shell'), tabs: [...document.querySelectorAll('.workspace-top-switcher button')].map((b) => { const bb = b.getBoundingClientRect(); return `${b.textContent}${b.getAttribute('aria-current') ? '*' : ''}@${Math.round(bb.left)}-${Math.round(bb.right)}${util && bb.right > util.left && bb.top < util.bottom ? ' COVERED' : ''}${bb.right > innerWidth ? ' CLIPPED' : ''}`; }), overflowEnd: document.querySelector('.workspace-top-switcher-shell')?.getAttribute('data-overflow-end'), title: document.title, h1: document.querySelector('main h1')?.textContent?.trim().slice(0, 40), scrollY: window.scrollY, scrollW: document.documentElement.scrollWidth };
});
for (const width of [390, 360, 320]) {
  const p = await browser.newPage({ viewport: { width, height: 844 }, deviceScaleFactor: 1 });
  await boot(p, { draft: true });
  console.log(`\n== ${width} Home ==`, JSON.stringify(await shell(p)));
  if (width === 390) await p.screenshot({ path: 'shell-home-390.png', fullPage: false });
  await dock(p, 'Train'); await p.waitForTimeout(700);
  console.log(`== ${width} Train/Plan ==`, JSON.stringify(await shell(p)));
  if (width === 390) await p.screenshot({ path: 'shell-train-390.png', fullPage: false });
  await tab(p, 'Matches'); await p.waitForTimeout(500); console.log(`== ${width} Train/Matches ==`, JSON.stringify((await shell(p)).tabs), await p.evaluate(() => document.title));
  await dock(p, 'Body Lab'); await p.waitForTimeout(600); console.log(`== ${width} Body Lab ==`, JSON.stringify((await shell(p)).tabs));
  await dock(p, 'Progress'); await p.waitForTimeout(600); console.log(`== ${width} Progress ==`, JSON.stringify((await shell(p)).tabs));
  await p.locator('.topbar-profile-button').dispatchEvent('click'); await p.waitForTimeout(600); console.log(`== ${width} Profile ==`, JSON.stringify(await shell(p)));
  if (width === 390) {
    // LOC-06: tapping the active destination returns to the top and keeps the page.
    await dock(p, 'Train'); await p.waitForTimeout(500); await tab(p, 'Review'); await p.waitForTimeout(500);
    await p.evaluate(() => window.scrollTo(0, 700)); await p.waitForTimeout(300);
    await dock(p, 'Train'); await p.waitForTimeout(900);
    console.log('LOC-06 ->', await p.evaluate(() => ({ search: location.search, scrollY: window.scrollY })));
    // LOC-07: back closes the overlay first, then follows history.
    await dock(p, 'Body Lab'); await tab(p, 'Exercises'); await p.waitForTimeout(800);
    await p.evaluate(() => window.scrollTo(0, 500)); await p.waitForTimeout(200);
    await p.locator('.catalog-discovery-card-copy').first().dispatchEvent('click'); await p.waitForTimeout(600);
    const open1 = await p.evaluate(() => ({ overlay: !!document.querySelector('.exercise-intelligence'), state: history.state }));
    await p.goBack(); await p.waitForTimeout(600);
    const afterBack = await p.evaluate(() => ({ overlay: !!document.querySelector('.exercise-intelligence'), search: location.search, scrollY: window.scrollY }));
    await p.locator('.catalog-discovery-card-copy').first().dispatchEvent('click'); await p.waitForTimeout(500);
    await p.locator('.exercise-intelligence-close').dispatchEvent('click'); await p.waitForTimeout(500);
    const afterClose = await p.evaluate(() => ({ overlay: !!document.querySelector('.exercise-intelligence'), search: location.search, state: history.state }));
    await p.goBack(); await p.waitForTimeout(600);
    const back2 = await p.evaluate(() => ({ search: location.search, overlay: !!document.querySelector('.exercise-intelligence') }));
    console.log('LOC-07 ->', JSON.stringify({ open1, afterBack, afterClose, back2 }));
    // Old Genome deep link lands on Exercises.
    await p.goto('http://localhost:4173/?workspace=genome'); await p.waitForTimeout(1500);
    console.log('genome link ->', await p.evaluate(() => ({ search: location.search, tab: document.querySelector('.workspace-top-switcher [aria-current="page"]')?.textContent, title: document.title })));
  }
  await p.close();
}
await browser.close();
