// Walkthrough brief: launch lifecycle (V01–V03), preview (V04/V05), safe-area backdrop (U01), toast placement (U02),
// picker surface and layering (U03/U04), analysis exit (U05), coverage agreement (D02). Headless Chromium; the intro
// asset is not reachable from this sandbox, so a 25 s WebM recording stands in for it where playback is needed.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { readFileSync } from 'node:fs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const logo = readFileSync(new URL('./logo.png', import.meta.url));
const clip = readFileSync('/home/user/Sports-genome/docs/ux-correction/evidence/transition-recording.webm');
const results = []; const check = (id, pass, d) => { results.push(!!pass); console.log(`${id} ${pass ? 'PASS' : 'FAIL'} ${JSON.stringify(d)}`); };
const profile = JSON.stringify({ version: 3, sportId: 'wrestling', sportContextMode: 'sport', goal: 'Max strength', trainingDays: 5, gymMinutes: 75, movementId: 'wrestling-1', baseline: { experience: 'Intermediate', weightUnit: 'lb', bodyWeight: 145, equipment: { gymAccess: 'Commercial gym', availableEquipment: ['Barbell', 'Dumbbells', 'Cable', 'Machine', 'Bodyweight', 'Bench', 'Free weights'] } } });
const wire = async (p, { video = 'clip' } = {}) => {
  await p.route('**qiccnqkypbhlwpmjcsri.supabase.co/**', (r) => { const u = r.request().url(); if (u.endsWith('.mp4')) return video === 'clip' ? r.fulfill({ contentType: 'video/webm', body: clip }) : r.abort(); return r.fulfill({ contentType: 'image/png', body: logo }); });
  await p.route('**/api/trpc/**', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(new URL(route.request().url()).pathname.replace('/api/trpc/', '').split(',').map(() => ({ result: { data: { json: null } } }))) }));
};
const seed = async (p, extra = {}) => { await p.goto('http://localhost:4173/?workspace=command'); await p.evaluate(([profile, extra]) => { localStorage.clear(); localStorage.setItem('gym-optimizer-athlete-profile-v1', profile); for (const [k, v] of Object.entries(extra)) localStorage.setItem(k, v); }, [profile, extra]); };
const dock = (p, l) => p.locator('.mobile-bottom-nav button').filter({ hasText: l }).first().dispatchEvent('click');
const tab = (p, l) => p.locator('.workspace-top-switcher button').filter({ hasText: l }).first().dispatchEvent('click');
const wait = (p, ms) => p.waitForTimeout(ms);
const bootState = (p) => p.evaluate(() => ({ video: document.documentElement.dataset.sportsGenomeBootVideo, ready: document.documentElement.classList.contains('sports-genome-app-ready'), splash: !!document.getElementById('sports-genome-boot-splash'), skipVisible: (() => { const b = document.getElementById('sports-genome-boot-skip'); if (!b) return false; const cs = getComputedStyle(b); return cs.opacity !== '0' && b.getBoundingClientRect().height >= 44; })(), vt: document.getElementById('sports-genome-boot-video')?.currentTime ?? null }));

{ // Cold first launch, video plays, Skip lifts the screen once.
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); await wire(p);
  await seed(p); await p.goto('http://localhost:4173/?workspace=command', { waitUntil: 'commit' });
  await wait(p, 1800); const s1 = await bootState(p);
  await p.locator('#sports-genome-boot-skip').click(); const t0 = Date.now();
  await p.waitForFunction(() => document.documentElement.classList.contains('sports-genome-app-ready'), null, { timeout: 5000 }); const lift = Date.now() - t0;
  await wait(p, 900); const s2 = await bootState(p);
  const cta = await p.evaluate(() => document.querySelector('.today-action-cta')?.textContent?.trim());
  check('V02 cold launch plays, Skip lifts', s1.video === 'playing' && s1.skipVisible && !s1.ready && lift < 800 && s2.ready && !s2.splash && !!cta, { s1, lift, s2, cta });
  await ctx.close();
}
{ // Returning launch still plays the intro (preference on); intro ends → app.
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); await wire(p);
  await seed(p, { 'sports-genome-launched-before-v1': 'yes' }); await p.goto('http://localhost:4173/?workspace=command', { waitUntil: 'commit' });
  await wait(p, 1500); const s1 = await bootState(p);
  await p.evaluate(() => document.getElementById('sports-genome-boot-video').dispatchEvent(new Event('ended')));
  await p.waitForFunction(() => document.documentElement.classList.contains('sports-genome-app-ready'), null, { timeout: 8000 }).catch(() => {});
  const s2 = await bootState(p);
  check('V02 returning launch plays to the end', s1.video === 'playing' && s2.ready && s2.video === 'done', { s1, s2 });
  await ctx.close();
}
{ // Preference off: no media surface at all.
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); await wire(p);
  await seed(p, { 'sports-genome-launch-experience-enabled-v1': 'off' }); await p.goto('http://localhost:4173/?workspace=command', { waitUntil: 'commit' });
  await p.waitForFunction(() => !!document.documentElement.dataset.sportsGenomeBoot && !!document.getElementById('sports-genome-boot-splash'), null, { timeout: 5000 });
  const early = await p.evaluate(() => ({ boot: document.documentElement.dataset.sportsGenomeBoot, splashVisible: (() => { const s = document.getElementById('sports-genome-boot-splash'); return s ? getComputedStyle(s).visibility === 'visible' && getComputedStyle(s).opacity !== '0' : false; })() }));
  await p.waitForSelector('.today-action-cta, .today-action-loading', { timeout: 8000 }); const s = await bootState(p);
  const hidden = await p.evaluate(() => { const el = document.getElementById('sports-genome-boot-splash'); return !el || getComputedStyle(el).visibility === 'hidden'; });
  check('intro off opens without a media flash', early.boot === 'off' && !early.splashVisible && s.video === 'skipped' && s.ready && hidden, { early, s, hidden });
  await ctx.close();
}
{ // Media failure: the static sequence, then the app within the start ceiling.
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); await wire(p, { video: 'fail' });
  await seed(p); const t0 = Date.now(); await p.goto('http://localhost:4173/?workspace=command', { waitUntil: 'commit' });
  await p.waitForFunction(() => document.documentElement.classList.contains('sports-genome-app-ready'), null, { timeout: 9000 }); const ms = Date.now() - t0;
  const s = await bootState(p);
  check('media failure still reaches the app', s.ready && s.video === 'skipped' && ms < 6000, { ms, s });
  await ctx.close();
}
{ // V03: a saved plan never shows as "no plan" while loading; the module holds its shape.
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); await wire(p, { video: 'fail' });
  await seed(p, { 'sports-genome-launch-experience-enabled-v1': 'off' }); await p.goto('http://localhost:4173/'); await wait(p, 2500);
  await dock(p, 'Train'); await wait(p, 1200); await p.locator('.day-plan-draft > summary').first().dispatchEvent('click').catch(() => {}); await wait(p, 400); await p.locator('.day-plan-draft button').filter({ hasText: /Draft this (session|workout)/i }).first().dispatchEvent('click').catch(() => {}); await wait(p, 1200);
  await p.goto('http://localhost:4173/?workspace=command', { waitUntil: 'commit' });
  const samples = await p.evaluate(() => new Promise((resolve) => { const seen = []; const start = performance.now(); const tick = () => { const el = document.querySelector('.today-action-primary'); const v = el ? (el.classList.contains('today-action-loading') ? 'LOADING' : el.querySelector('h2')?.textContent) : null; if (seen.length === 0 || seen[seen.length - 1].v !== v) seen.push({ t: Math.round(performance.now() - start), v }); if (performance.now() - start < 3000) setTimeout(tick, 30); else resolve(seen); }; tick(); }));
  const values = samples.map((s) => s.v).filter(Boolean);
  check('V03 no false empty plan', !values.includes('Build training around your goals') && !values.includes('Choose your next workout') && values[values.length - 1] === 'Sport Transfer', { samples });
  await ctx.close();
}
{ // Preview from About me: no reload, scroll kept, Close returns focus, replay restarts, natural end closes.
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); await wire(p);
  await seed(p, { 'sports-genome-launch-experience-enabled-v1': 'off' }); await p.goto('http://localhost:4173/?workspace=profile'); await wait(p, 2500);
  await p.evaluate(() => { window.__marker = 42; window.scrollTo(0, 500); }); await wait(p, 300);
  const scroll0 = await p.evaluate(() => window.scrollY);
  await p.locator('.about-me-group > summary').filter({ hasText: 'Launch video' }).dispatchEvent('click'); await wait(p, 400); await p.evaluate(() => window.scrollTo(0, 500)); await wait(p, 300);
  const button = p.locator('.launch-setting button'); await button.scrollIntoViewIfNeeded(); await wait(p, 200); const scroll0b = await p.evaluate(() => window.scrollY); await button.click(); await wait(p, 1200);
  const o1 = await p.evaluate(() => ({ marker: window.__marker, preview: !!document.querySelector('.intro-preview'), focused: document.activeElement?.getAttribute('aria-label'), status: document.querySelector('.intro-preview-status')?.textContent ?? null, playing: !document.querySelector('.intro-preview-video')?.paused, overflow: document.documentElement.style.overflow, navs: performance.getEntriesByType('navigation').length }));
  await p.keyboard.press('Escape'); await wait(p, 400);
  const o2 = await p.evaluate(() => ({ preview: !!document.querySelector('.intro-preview'), scroll: window.scrollY, focusedText: document.activeElement?.textContent?.trim(), overflow: document.documentElement.style.overflow, blankTop: (() => { const el = document.elementFromPoint(195, 60); return el ? el.tagName + '.' + String(el.className).split(' ')[0] : null; })() }));
  await button.click(); await wait(p, 900);
  const o3 = await p.evaluate(() => { const v = document.querySelector('.intro-preview-video'); return { preview: !!v, time: v ? v.currentTime : null }; });
  await p.evaluate(() => document.querySelector('.intro-preview-video').dispatchEvent(new Event('ended'))); await wait(p, 1200);
  const o4 = await p.evaluate(() => ({ preview: !!document.querySelector('.intro-preview'), scroll: window.scrollY, marker: window.__marker, profileH1: document.querySelector('main h1')?.textContent }));
  check('V04/V05 preview without a relaunch', o1.marker === 42 && o1.preview && o1.focused === 'Close intro preview' && o1.playing && o1.overflow === 'hidden' && o1.navs === 1 && !o2.preview && Math.abs(o2.scroll - scroll0b) < 2 && o2.focusedText === 'Preview intro video' && o2.overflow === '' && o3.preview && o3.time < 1.5 && !o4.preview && o4.marker === 42 && o4.profileH1 === 'About me', { scroll0, scroll0b, o1, o2, o3, o4 });
  await ctx.close();
}
{ // U01 backdrop, U02 toast placement, U03/U04 picker surface and layering, U05 analysis exit, D02 agreement.
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); await wire(p, { video: 'fail' });
  await seed(p, { 'sports-genome-launch-experience-enabled-v1': 'off' }); await p.goto('http://localhost:4173/'); await wait(p, 2500);
  await dock(p, 'Train'); await wait(p, 1200); await p.locator('.day-plan-draft > summary').first().dispatchEvent('click').catch(() => {}); await wait(p, 400); await p.locator('.day-plan-draft button').filter({ hasText: /Draft this (session|workout)/i }).first().dispatchEvent('click').catch(() => {}); await wait(p, 1200);
  await p.waitForSelector('[data-sonner-toast]', { state: 'detached', timeout: 8000 }).catch(() => {});
  const b0 = await p.evaluate(() => document.querySelector('.status-backdrop')?.classList.contains('is-solid'));
  await p.evaluate(() => window.scrollTo(0, 400)); await wait(p, 300);
  const b1 = await p.evaluate(() => ({ solid: document.querySelector('.status-backdrop')?.classList.contains('is-solid'), tabsTop: Math.round(document.querySelector('.workspace-top-switcher-shell').getBoundingClientRect().top) }));
  check('U01 status backdrop follows the scroll', b0 === false && b1.solid === true && b1.tabsTop === 0, { b0, b1 });
  await dock(p, 'Body Lab'); await tab(p, 'Exercises'); await wait(p, 900);
  await p.locator('.catalog-discovery-actions button:last-child').first().dispatchEvent('click'); await wait(p, 600);
  const t = await p.evaluate(() => { const toast = document.querySelector('[data-sonner-toast]'); const r = toast?.getBoundingClientRect(); const strip = document.querySelector('.add-destination')?.getBoundingClientRect(); const dockEl = document.querySelector('.mobile-bottom-nav').getBoundingClientRect(); const cs = toast ? getComputedStyle(toast) : null; return { bottom: r ? Math.round(r.bottom) : null, stripTop: strip ? Math.round(strip.top) : null, dockTop: Math.round(dockEl.top), bg: cs?.backgroundColor, opaque: cs ? !/rgba\(.*, 0?\.\d+\)$/.test(cs.backgroundColor) : false, filter: cs?.backdropFilter }; });
  check('U02 feedback solid and above the strip', t.bottom !== null && t.bottom <= t.stripTop && t.opaque, t);
  await p.waitForSelector('[data-sonner-toast]', { state: 'detached', timeout: 8000 }).catch(() => {});
  await dock(p, 'Train'); await tab(p, 'Plan'); await wait(p, 900);
  const summary = await p.evaluate(() => document.querySelector('.rate-stack-headline')?.textContent);
  await p.locator('.day-action-add, button.day-exercise-open-catalog').first().dispatchEvent('click').catch(() => {}); await wait(p, 800);
  const pk = await p.evaluate(() => { const s = document.querySelector('.day-picker-sheet'); if (!s) return null; const cs = getComputedStyle(s); return { bg: cs.backgroundColor, color: cs.color, title: s.querySelector('h2')?.textContent, foot: s.querySelector('.day-picker-sheet-foot span')?.textContent }; });
  await p.locator('.day-picker-sheet .day-picker-result button, .day-picker-sheet button[aria-label^="Inspect"], .day-picker-sheet .day-picker-result-copy').first().dispatchEvent('click').catch(() => {}); await wait(p, 900);
  const layer = await p.evaluate(() => { const el = document.elementFromPoint(195, 400); const overlay = document.querySelector('.exercise-intelligence'); return { overlay: !!overlay, onTop: !!(overlay && el && overlay.contains(el)), z: overlay ? getComputedStyle(overlay).zIndex : null, scrimZ: document.querySelector('.day-picker-sheet-scrim') ? getComputedStyle(document.querySelector('.day-picker-sheet-scrim')).zIndex : null }; });
  check('U03/U04 picker in app surface, detail on top', pk && /rgb\(\d+, \d+, \d+\)/.test(pk.bg) && pk.bg !== 'rgb(255, 255, 255)' && layer.overlay && layer.onTop && Number(layer.z) > Number(layer.scrimZ), { pk, layer });
  await p.locator('.exercise-intelligence-close').dispatchEvent('click').catch(() => {}); await wait(p, 500);
  await p.locator('.day-picker-sheet-head button, .day-picker-sheet-foot button').last().dispatchEvent('click').catch(() => {}); await wait(p, 500);
  await p.locator('.rate-stack-trigger').first().dispatchEvent('click').catch(() => {}); await wait(p, 900);
  const an = await p.evaluate(() => { const head = document.querySelector('.stack-analysis-head'); const btn = head?.querySelector('button'); const tip = document.querySelector('.stack-analysis-hint, .stack-tip, [class*="stack-analysis"] p')?.textContent; return { open: !!document.querySelector('.stack-analysis-overlay'), title: head?.querySelector('h1')?.textContent, sticky: head ? getComputedStyle(head).position : null, close: btn?.textContent?.trim(), tips: [...document.querySelectorAll('.stack-analysis-page p, .stack-analysis-page li')].map((e) => e.textContent).filter((x) => /points (short|under)/.test(x)).slice(0, 2) }; });
  const summaryPts = summary?.match(/(\d+) points short/)?.[1]; const tipPts = an.tips.map((x) => x.match(/(\d+) points/)?.[1]);
  check('U05/D02 analysis exit and one gap number', an.open && an.sticky === 'sticky' && an.close === 'Close' && (!summaryPts || tipPts.length === 0 || tipPts.includes(summaryPts)), { summary, an, summaryPts, tipPts });
  await ctx.close();
}
await browser.close();
console.log(`${results.filter(Boolean).length}/${results.length} passed`);
