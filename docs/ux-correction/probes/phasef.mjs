// Phase F sweep: overflow, touch targets, chrome reservation, focus and motion rules.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { boot } from './home.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const dock = (p, l) => p.locator('.mobile-bottom-nav button').filter({ hasText: l }).dispatchEvent('click');
const tab = (p, l) => p.locator('.workspace-top-switcher button').filter({ hasText: l }).dispatchEvent('click');
const screens = [['Home', null], ['Body Lab', 'Movements'], ['Body Lab', 'Muscles'], ['Body Lab', 'Exercises'], ['Train', 'Plan'], ['Train', 'Review'], ['Train', 'Workout'], ['Train', 'Matches'], ['Progress', 'Progress'], ['Progress', 'Strength']];
const sweep = (label) => ({ label }) => 0;
for (const [width, font] of [[320, '16px'], [360, '20px'], [390, '16px'], [430, '16px'], [1280, '16px']]) {
  const p = await browser.newPage({ viewport: { width, height: 800 } });
  await boot(p, { draft: true });
  await p.addStyleTag({ content: `html { font-size: ${font} !important; }` });
  // Make a live session so the strip is present for the chrome check.
  await dock(p, 'Train'); await tab(p, 'Workout'); await p.waitForTimeout(600);
  await p.locator('.session-prestart-start').dispatchEvent('click'); await p.waitForTimeout(500);
  const lines = [];
  for (const [d, t] of screens) {
    await dock(p, d); await p.waitForTimeout(300); if (t) await tab(p, t); await p.waitForTimeout(800);
    lines.push(await p.evaluate((label) => {
      const inScroller = (e) => { let s = e.parentElement; while (s) { const o = getComputedStyle(s).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden') return true; s = s.parentElement; } return false; };
      const over = [...document.querySelectorAll('main *')].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.right > innerWidth + 1 && !inScroller(e); }).map((e) => (e.className?.toString() || e.tagName).slice(0, 30)).slice(0, 2);
      const small = [...document.querySelectorAll('main button, main a[href], main summary, main input, main select')].filter((e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && (b.height < 40 || b.width < 40); }).map((e) => `${(e.getAttribute('aria-label') || e.textContent || e.tagName).trim().slice(0, 28)}@${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`);
      const strip = document.querySelector('.session-resume-bar')?.getBoundingClientRect();
      window.scrollTo(0, document.documentElement.scrollHeight);
      const main = document.querySelector('main').getBoundingClientRect();
      const last = [...document.querySelectorAll('main button, main summary, main input, main select, main li')].filter((e) => e.getBoundingClientRect().height > 0).pop();
      const lastB = last?.getBoundingClientRect();
      const chromeTop = Math.min(strip?.top ?? Infinity, document.querySelector('.mobile-bottom-nav')?.getBoundingClientRect().top ?? Infinity);
      return `${label}: scrollW ${document.documentElement.scrollWidth}${over.length ? ' OVER ' + over.join(',') : ''} | small(<40) ${small.length}${small.length ? ' [' + small.slice(0, 6).join('; ') + ']' : ''} | strip ${strip ? 'yes' : 'no'} | last item bottom ${Math.round(lastB?.bottom ?? -1)} vs chrome top ${Math.round(chromeTop)} ${lastB && lastB.bottom > chromeTop + 1 ? 'COVERED' : 'ok'}`;
    }, t || d));
  }
  console.log(`\n== ${width}px @ ${font} ==\n${lines.join('\n')}`);
  await p.close();
}
await browser.close();
