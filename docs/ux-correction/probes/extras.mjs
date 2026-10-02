// Checks the journeys do not cover: text contrast, rapid tab switching, 200% text at 360px,
// and the desktop layout. Same built app, same headless Chromium.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { boot } from './home.mjs';
const evidence = new URL('../evidence', import.meta.url).pathname;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const dock = (p, l) => p.locator('.mobile-bottom-nav button').filter({ hasText: l }).first().dispatchEvent('click');
const tab = (p, l) => p.locator('.workspace-top-switcher button').filter({ hasText: l }).first().dispatchEvent('click');
const wait = (p, ms = 700) => p.waitForTimeout(ms);
const settle = (p) => p.waitForSelector('[data-sonner-toast]', { state: 'detached', timeout: 8000 }).catch(() => {});
const say = (k, v) => console.log(k, typeof v === 'string' ? v : JSON.stringify(v));

// WCAG contrast of every visible text run in the first viewport, against the nearest solid
// background. Runs on a gradient are listed separately rather than guessed.
const contrast = (p, label) => p.evaluate((label) => {
  const lum = ({ r, g, b }) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const parse = (s) => { const m = s?.match(/rgba?\(([^)]+)\)/); if (!m) return null; const [r, g, b, a = 1] = m[1].split(/[\s,\/]+/).map(Number); return { r, g, b, a }; };
  const blend = (top, under) => ({ r: top.r * top.a + under.r * (1 - top.a), g: top.g * top.a + under.g * (1 - top.a), b: top.b * top.a + under.b * (1 - top.a), a: 1 });
  // A gradient background is judged against every one of its colour stops (the worst case
  // counts); an image background stays "unknown".
  const stops = (img) => { const m = img.match(/rgba?\([^)]+\)/g); return m ? m.map(parse).filter(Boolean) : null; };
  const bgOf = (el) => { const layers = []; let e = el; while (e) { const cs = getComputedStyle(e); if (cs.backgroundImage && cs.backgroundImage !== 'none') { const s = /gradient\(/.test(cs.backgroundImage) ? stops(cs.backgroundImage) : null; if (!s || !s.length) return { gradient: true }; return { stops: s.map((st) => { let out = st.a < 1 ? blend(st, { r: 10, g: 20, b: 40, a: 1 }) : st; for (const l of layers.reverse()) out = blend(l, out); return out; }) }; } const c = parse(cs.backgroundColor); if (c && c.a > 0) { layers.push(c); if (c.a >= 0.99) break; } e = e.parentElement; } let out = { r: 255, g: 255, b: 255, a: 1 }; for (const l of layers.reverse()) out = blend(l, out); return out; };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); const seen = new Map(); let node;
  while ((node = walker.nextNode())) {
    const text = node.textContent.trim(); if (!text) continue; const el = node.parentElement; if (!el || el.closest('script, style, [aria-hidden="true"]')) continue;
    const r = (() => { const range = document.createRange(); range.selectNodeContents(node); return range.getBoundingClientRect(); })(); if (r.height === 0 || r.bottom < 0 || r.top > innerHeight) continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
    const fg = parse(cs.color); const bg = bgOf(el); if (!fg) continue;
    const size = parseFloat(cs.fontSize); const bold = Number(cs.fontWeight) >= 700; const large = size >= 24 || (size >= 18.66 && bold); const needed = large ? 3 : 4.5;
    const key = `${el.className}|${text.slice(0, 24)}`; if (seen.has(key)) continue;
    if (bg.gradient) { seen.set(key, { text: text.slice(0, 30), fg: cs.color, bg: 'gradient', size, needed }); continue; }
    const against = bg.stops || [bg];
    const ratios = against.map((b) => { const fgc = fg.a < 1 ? blend(fg, b) : fg; const L1 = lum(fgc), L2 = lum(b); return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); });
    const ratio = Math.min(...ratios); const worst = against[ratios.indexOf(ratio)];
    seen.set(key, { text: text.slice(0, 30), cls: String(el.className).slice(0, 40), fg: cs.color, bg: `rgb(${Math.round(worst.r)},${Math.round(worst.g)},${Math.round(worst.b)})${bg.stops ? ' (gradient stop)' : ''}`, size, needed, ratio: Math.round(ratio * 100) / 100, pass: ratio >= needed });
  }
  const all = [...seen.values()]; return { label, checked: all.filter((x) => x.ratio).length, gradient: all.filter((x) => x.bg === 'gradient').length, failing: all.filter((x) => x.ratio && !x.pass) };
}, label);

{
  const p = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await boot(p, { draft: true }); await settle(p);
  const reports = [];
  await dock(p, 'Home'); await wait(p, 800); reports.push(await contrast(p, 'Home'));
  await dock(p, 'Train'); await tab(p, 'Plan'); await wait(p, 800); reports.push(await contrast(p, 'Plan'));
  await tab(p, 'Workout'); await wait(p, 800); await p.locator('.session-prestart-start').dispatchEvent('click'); await wait(p, 800); reports.push(await contrast(p, 'Workout live'));
  await tab(p, 'Matches'); await wait(p, 800); reports.push(await contrast(p, 'Matches'));
  await dock(p, 'Body Lab'); await tab(p, 'Exercises'); await wait(p, 800); reports.push(await contrast(p, 'Exercises'));
  await dock(p, 'Progress'); await tab(p, 'Strength'); await wait(p, 1200); reports.push(await contrast(p, 'Strength'));
  await p.locator('.topbar-profile-button').dispatchEvent('click'); await wait(p, 800); reports.push(await contrast(p, 'Profile'));
  for (const r of reports) say(`CONTRAST ${r.label}`, { checked: r.checked, onGradient: r.gradient, failing: r.failing });
  // Rapid tab switching: the last tap wins, with its own heading and content.
  await dock(p, 'Train'); await wait(p, 600);
  await p.evaluate(() => { const b = [...document.querySelectorAll('.workspace-top-switcher button')]; for (const t of b) t.click(); });
  await wait(p, 1000);
  say('RAPID forward', await p.evaluate(() => ({ current: document.querySelector('.workspace-top-switcher [aria-current="page"]')?.textContent?.trim(), h1: document.querySelector('main h1')?.textContent?.trim(), search: location.search, title: document.title, review: !!document.querySelector('.day-review-workspace'), plan: !!document.querySelector('.day-design-main') })));
  await p.evaluate(() => { const b = [...document.querySelectorAll('.workspace-top-switcher button')].reverse(); for (const t of b) t.click(); });
  await wait(p, 1000);
  say('RAPID back', await p.evaluate(() => ({ current: document.querySelector('.workspace-top-switcher [aria-current="page"]')?.textContent?.trim(), h1: document.querySelector('main h1')?.textContent?.trim(), search: location.search, title: document.title, plan: !!document.querySelector('.day-design-main'), matches: !!document.querySelector('.matches-page') })));
  await p.close();
}

{ // 200% text at 360px: the selected day tab stays in view, nothing overflows the page, the primary action is reachable.
  const p = await browser.newPage({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 1 });
  await boot(p, { draft: true }); await settle(p);
  await p.addStyleTag({ content: 'html { font-size: 32px !important; }' }); await wait(p, 500);
  const out = [];
  for (const [d, t] of [['Home', null], ['Train', 'Plan'], ['Train', 'Review'], ['Train', 'Workout'], ['Train', 'Matches'], ['Body Lab', 'Movements'], ['Body Lab', 'Muscles'], ['Body Lab', 'Exercises'], ['Progress', 'Progress'], ['Progress', 'Strength']]) {
    await dock(p, d); await wait(p, 400); if (t) await tab(p, t); await wait(p, 900);
    out.push(await p.evaluate((label) => { const tabs = [...document.querySelectorAll('.workspace-top-switcher button')].map((b) => { const r = b.getBoundingClientRect(); return `${b.textContent.trim()}@${Math.round(r.left)}-${Math.round(r.right)}${b.getAttribute('aria-current') ? '*' : ''}`; }); const active = document.querySelector('.training-plan-day[aria-selected="true"]'); const a = active?.getBoundingClientRect(); const cta = document.querySelector('.today-action-cta')?.getBoundingClientRect(); return { label, scrollW: document.documentElement.scrollWidth, tabs, activeDay: a ? { l: Math.round(a.left), r: Math.round(a.right), visible: a.left >= 0 && a.right <= innerWidth } : null, cta: cta ? Math.round(cta.bottom) : null }; }, t || d));
  }
  for (const o of out) say('200%', o);
  await p.evaluate(() => window.scrollTo(0, 0)); await dock(p, 'Train'); await tab(p, 'Plan'); await wait(p, 900); await settle(p);
  await p.screenshot({ path: `${evidence}/plan-200pct-360.png`, fullPage: false });
  await p.close();
}

{ // Desktop: a deliberate layout at 1280, captured for the record.
  const p = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  await boot(p, { draft: true }); await settle(p);
  await dock(p, 'Home'); await wait(p, 800); await p.screenshot({ path: `${evidence}/desktop-1280-home.png`, fullPage: false });
  await dock(p, 'Train'); await tab(p, 'Plan'); await wait(p, 900); await settle(p); await p.screenshot({ path: `${evidence}/desktop-1280-plan.png`, fullPage: false });
  say('DESKTOP', await p.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, contentWidth: Math.round(document.querySelector('main')?.getBoundingClientRect().width ?? 0), maxLineWidth: Math.max(...[...document.querySelectorAll('main p')].map((e) => e.getBoundingClientRect().width)) })));
  await p.close();
}
await browser.close();
