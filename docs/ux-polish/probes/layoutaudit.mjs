// VIS-03/04/08: the left edges text starts at, the vertical gaps between sections, and icon sizes, per page.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { boot } from './home.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const dock = (p, l) => p.locator('.mobile-bottom-nav button').filter({ hasText: l }).first().dispatchEvent('click');
const tab = (p, l) => p.locator('.workspace-top-switcher button').filter({ hasText: l }).first().dispatchEvent('click');
const p = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await boot(p, { draft: true });
for (const [d, t] of [['Home', null], ['Body Lab', 'Movements'], ['Body Lab', 'Muscles'], ['Body Lab', 'Exercises'], ['Train', 'Plan'], ['Train', 'Review'], ['Train', 'Workout'], ['Train', 'Matches'], ['Progress', 'Progress'], ['Progress', 'Strength']]) {
  await dock(p, d); await p.waitForTimeout(400); if (t) await tab(p, t); await p.waitForTimeout(900);
  const r = await p.evaluate((label) => {
    const main = document.querySelector('main');
    const texts = [...main.querySelectorAll('h1, h2, h3, p, li, dt, dd, label, summary, button')].filter((e) => e.getBoundingClientRect().height > 0 && e.innerText?.trim());
    const lefts = {}; for (const e of texts) { const l = Math.round(e.getBoundingClientRect().left); lefts[l] = (lefts[l] || 0) + 1; }
    const svgs = {}; for (const s of main.querySelectorAll('svg')) { const b = s.getBoundingClientRect(); if (b.width === 0) continue; const k = `${Math.round(b.width)}x${Math.round(b.height)}`; svgs[k] = (svgs[k] || 0) + 1; }
    const heads = [...main.querySelectorAll('h1, h2, section > .metric-label, .metric-label')].filter((e) => e.getBoundingClientRect().height > 0).map((e) => Math.round(e.getBoundingClientRect().top + window.scrollY));
    const gaps = heads.slice(1).map((v, i) => v - heads[i]).filter((g) => g > 0);
    return { label, lefts: Object.entries(lefts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([l, n]) => `${l}:${n}`), svgs: Object.entries(svgs).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, n]) => `${k}:${n}`), sectionGaps: gaps.slice(0, 12) };
  }, t || d);
  console.log(JSON.stringify(r));
}
await browser.close();
