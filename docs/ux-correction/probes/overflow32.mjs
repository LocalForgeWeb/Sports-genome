// Which elements push the page past 360px at a 32px root font (200% text)?
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { boot } from './home.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const dock = (p, l) => p.locator('.mobile-bottom-nav button').filter({ hasText: l }).first().dispatchEvent('click');
const tab = (p, l) => p.locator('.workspace-top-switcher button').filter({ hasText: l }).first().dispatchEvent('click');
const font = process.argv[2] || '32px';
const p = await browser.newPage({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 1 });
await boot(p, { draft: true });
await p.addStyleTag({ content: `html { font-size: ${font} !important; }` }); await p.waitForTimeout(500);
for (const [d, t] of [['Home', null], ['Train', 'Plan'], ['Train', 'Review'], ['Train', 'Workout'], ['Train', 'Matches'], ['Body Lab', 'Movements'], ['Body Lab', 'Muscles'], ['Body Lab', 'Exercises'], ['Progress', 'Progress'], ['Progress', 'Strength']]) {
  await dock(p, d); await p.waitForTimeout(400); if (t) await tab(p, t); await p.waitForTimeout(900);
  const r = await p.evaluate((label) => {
    const scrollers = new Set();
    const inScroller = (e) => { let n = e.parentElement; while (n) { const cs = getComputedStyle(n); if (/(auto|scroll)/.test(cs.overflowX) && n.scrollWidth > n.clientWidth) return true; n = n.parentElement; } return false; };
    const offenders = [...document.querySelectorAll('body *')].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.right > innerWidth + 1 && getComputedStyle(e).position !== 'fixed' && !inScroller(e); })
      .map((e) => ({ tag: e.tagName.toLowerCase(), cls: String(e.className).slice(0, 50), right: Math.round(e.getBoundingClientRect().right), width: Math.round(e.getBoundingClientRect().width), text: e.textContent.trim().slice(0, 30) }));
    // Keep the outermost offenders: drop any whose ancestor is also listed.
    const els = [...document.querySelectorAll('body *')].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.right > innerWidth + 1 && getComputedStyle(e).position !== 'fixed' && !inScroller(e); });
    const outer = els.filter((e) => !els.some((o) => o !== e && o.contains(e)));
    return { label, scrollW: document.documentElement.scrollWidth, outer: outer.map((e) => ({ tag: e.tagName.toLowerCase(), cls: String(e.className).slice(0, 60), right: Math.round(e.getBoundingClientRect().right), width: Math.round(e.getBoundingClientRect().width), text: e.textContent.trim().slice(0, 30) })).slice(0, 8), count: offenders.length };
  }, t || d);
  console.log(JSON.stringify(r));
}
await browser.close();
