// Walkthrough brief §11 — acceptance journeys A–E, headless Chromium 390x844, isolated localStorage
// (never the athlete's real data). The intro asset is stood in for by a local webm; env(safe-area-*) is 0
// in this browser, so the safe-area checks are structural (backdrop/sticky offsets), not a notch.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
const scratch = '/tmp/claude-0/-home-user-Sports-genome/72e48dc4-5d2e-5f13-9687-9bbe2b3f83cf/scratchpad';
const logo = readFileSync(`${scratch}/logo.png`);
const clip = readFileSync('/home/user/Sports-genome/docs/ux-correction/evidence/transition-recording.webm');
const base = 'http://localhost:4173';
const results = []; const check = (id, pass, d) => { results.push({ id, pass: !!pass, d }); console.log(`${id} ${pass ? 'PASS' : 'FAIL'} ${JSON.stringify(d)}`); };
const profile = JSON.stringify({ version: 3, sportId: 'wrestling', sportContextMode: 'sport', goal: 'Max strength', trainingDays: 5, gymMinutes: 75, movementId: 'wrestling-1', baseline: { experience: 'Intermediate', weightUnit: 'lb', bodyWeight: 145, sexForReference: 'male', equipment: { gymAccess: 'Commercial gym', availableEquipment: ['Barbell', 'Dumbbells', 'Cable', 'Machine', 'Bodyweight', 'Bench', 'Free weights'] } } });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const wire = async (p, { video = 'clip', ranks = 'null' } = {}) => {
  await p.route('**qiccnqkypbhlwpmjcsri.supabase.co/**', (r) => { const u = r.request().url(); if (u.endsWith('.mp4')) return video === 'clip' ? r.fulfill({ contentType: 'video/webm', body: clip }) : r.abort(); return r.fulfill({ contentType: 'image/png', body: logo }); });
  await p.route('**/api/trpc/**', (route) => { const path = new URL(route.request().url()).pathname.replace('/api/trpc/', ''); if (ranks === 'hang' && path.includes('muscleRanks')) return new Promise(() => {}); return route.fulfill({ contentType: 'application/json', body: JSON.stringify(path.split(',').map(() => ({ result: { data: { json: null } } }))) }); });
};
const seed = async (p, extra = {}) => { await p.goto(`${base}/?workspace=command`); await p.evaluate(([profile, extra]) => { localStorage.clear(); localStorage.setItem('gym-optimizer-athlete-profile-v1', profile); for (const [k, v] of Object.entries(extra)) localStorage.setItem(k, v); }, [profile, extra]); };
const dock = (p, l) => p.locator('.mobile-bottom-nav button').filter({ hasText: l }).first().dispatchEvent('click');
const tab = (p, l) => p.locator('.workspace-top-switcher button').filter({ hasText: l }).first().dispatchEvent('click');
const wait = (p, ms) => p.waitForTimeout(ms);
const page = async (opts) => { const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); await wire(p, opts); return [ctx, p]; };
const draft = async (p) => { await dock(p, 'Train'); await wait(p, 1200); await p.locator('.day-plan-draft > summary').first().dispatchEvent('click').catch(() => {}); await wait(p, 400); await p.locator('.day-plan-draft button').filter({ hasText: /Draft this (session|workout)/i }).first().dispatchEvent('click').catch(() => {}); await wait(p, 1200); await p.waitForSelector('[data-sonner-toast]', { state: 'detached', timeout: 8000 }).catch(() => {}); };
const ready = (p) => p.waitForFunction(() => document.documentElement.classList.contains('sports-genome-app-ready'), null, { timeout: 8000 }).catch(() => {});
const homeState = (p) => p.evaluate(() => ({ hero: document.querySelector('.today-action-primary h2')?.textContent?.trim(), position: document.querySelector('.today-action-position')?.textContent?.trim(), count: document.querySelector('.today-action-count')?.textContent?.trim(), cta: document.querySelector('.today-action-cta')?.textContent?.trim(), loading: !!document.querySelector('.today-action-loading') }));

{ // Journey A — returning user.
  const [ctx, p] = await page(); await seed(p, { 'sports-genome-launched-before-v1': 'yes' }); await draft(p);
  const samples = []; await p.goto(`${base}/?workspace=command`, { waitUntil: 'commit' }); await p.waitForFunction(() => !!document.documentElement.dataset.sportsGenomeBoot, null, { timeout: 5000 });
  const t0 = Date.now(); while (Date.now() - t0 < 6000) { const s = await p.evaluate(() => ({ boot: document.documentElement.dataset.sportsGenomeBootVideo, ready: document.documentElement.classList.contains('sports-genome-app-ready'), cta: document.querySelector('.today-action-cta')?.textContent?.trim() ?? (document.querySelector('.today-action-loading') ? 'LOADING' : null) })); samples.push(s); if (s.ready && s.cta && s.cta !== 'LOADING') break; await wait(p, 120); }
  await p.evaluate(() => document.getElementById('sports-genome-boot-video')?.dispatchEvent(new Event('ended'))); await ready(p); await wait(p, 800);
  const home = await homeState(p);
  const falseEmpty = samples.some((s) => /Create your plan/i.test(s.cta || ''));
  check('A1 launch plays, lifts once, Home never says "Create your plan"', samples[0].boot === 'playing' && !falseEmpty && home.cta === 'Open next workout', { first: samples[0], home, samplesN: samples.length });
  await p.locator('.today-action-cta').dispatchEvent('click'); await wait(p, 1300);
  const review = await p.evaluate(() => ({ ws: new URLSearchParams(location.search).get('workspace'), day: document.querySelector('.session-prestart-day')?.textContent?.trim(), position: document.querySelector('.session-prestart-position')?.textContent?.trim(), rows: document.querySelectorAll('.session-prestart-exercise, .session-prestart-row, .prestart-exercise').length }));
  check('A2 Review workout shows the day Home named', ['review', 'tracker'].includes(review.ws) && !!review.day && home.hero && review.day.toLowerCase().includes(home.hero.toLowerCase().split('\n')[0].slice(0, 8).toLowerCase()), { review, hero: home.hero });
  await dock(p, 'Home'); await wait(p, 1000);
  const back = await p.evaluate(() => ({ splash: !!document.getElementById('sports-genome-boot-splash'), boot: document.documentElement.dataset.sportsGenomeBootVideo, ws: new URLSearchParams(location.search).get('workspace') }));
  const home2 = await homeState(p);
  check('A3 return Home: no replay, same selection', !back.splash && back.ws === 'command' && home2.hero === home.hero && home2.position === home.position, { back, home2 });
  await ctx.close();
}
{ // Journey B — muscle to exercise to plan.
  const [ctx, p] = await page({ video: 'fail' }); await seed(p, { 'sports-genome-launch-experience-enabled-v1': 'off' }); await p.goto(`${base}/`); await wait(p, 2500); await draft(p);
  await dock(p, 'Body Lab'); await tab(p, 'Muscles'); await wait(p, 900);
  await p.locator('.atlas-role-row').first().dispatchEvent('click'); await wait(p, 500);
  const muscle = await p.evaluate(() => ({ selected: document.querySelector('.atlas-role-row.is-selected strong')?.textContent?.trim(), cta: document.querySelector('.body-lab-next-step button')?.textContent?.trim() }));
  await p.locator('.body-lab-next-step button').dispatchEvent('click'); await wait(p, 1000);
  const cat = await p.evaluate(() => ({ ws: new URLSearchParams(location.search).get('workspace'), chips: [...document.querySelectorAll('.catalog-discovery-chips button, .catalog-discovery-chips span')].map((e) => e.textContent.trim()).slice(0, 4), dest: document.querySelector('.add-destination')?.textContent?.trim().slice(0, 40), scope: document.querySelector('.catalog-scope, .catalog-discovery-count, .catalog-count')?.textContent?.trim() }));
  const named = (muscle.selected || '').toLowerCase().split(' ')[0];
  check('B1 named filter, selected muscle and destination agree', cat.ws === 'catalog' && (muscle.cta || '').toLowerCase().includes(named) && JSON.stringify(cat).toLowerCase().includes(named) && /Week 1/.test(cat.dest || ''), { muscle, cat });
  await p.locator('.catalog-discovery-actions button[aria-label*="avorite"], .catalog-discovery-actions button:first-child').first().dispatchEvent('click'); await wait(p, 500);
  const fav = await p.evaluate(() => { const t = document.querySelector('[data-sonner-toast]'); const cs = t ? getComputedStyle(t) : null; return { text: t?.textContent?.slice(0, 40), opaque: cs ? !/rgba\(.*, 0?\.\d+\)$/.test(cs.backgroundColor) : null, count: document.querySelectorAll('[data-sonner-toast]').length }; });
  check('B2 favourite feedback readable, one notice', /favorite|shortlist|device/i.test(fav.text || '') && fav.opaque === true && fav.count === 1, fav);
  await p.waitForSelector('[data-sonner-toast]', { state: 'detached', timeout: 8000 }).catch(() => {});
  const before = await p.evaluate(() => document.querySelector('.add-destination')?.textContent?.match(/\d+ exercises?/)?.[0] ?? null);
  await p.locator('.catalog-discovery-card button, .catalog-card button').filter({ hasText: /View details/i }).first().dispatchEvent('click'); await wait(p, 900);
  const detailName = await p.evaluate(() => document.querySelector('.exercise-intelligence h1')?.textContent?.trim());
  await p.locator('.exercise-intelligence button').filter({ hasText: /^Add to Week/ }).first().dispatchEvent('click'); await wait(p, 700);
  const added = await p.evaluate(() => ({ toast: document.querySelector('[data-sonner-toast]')?.textContent?.slice(0, 60), undo: !!document.querySelector('[data-sonner-toast] [data-cancel]') }));
  await p.locator('.exercise-intelligence-close').dispatchEvent('click').catch(() => {}); await wait(p, 400);
  await dock(p, 'Train'); await tab(p, 'Plan'); await wait(p, 900);
  const plan = await p.evaluate((name) => ({ inPlan: [...document.querySelectorAll('.day-orderable-exercise strong, .day-orderable-exercise h3')].some((e) => e.textContent.trim() === name), count: document.querySelector('.day-plan-list')?.querySelectorAll('.day-orderable-exercise').length, summary: document.querySelector('.rate-stack-headline')?.textContent?.trim() }), detailName);
  check('B3 detail add lands in the intended day', /Added to Week 1/.test(added.toast || '') && added.undo && plan.inPlan, { detailName, added, plan });
  await dock(p, 'Body Lab'); await tab(p, 'Exercises'); await wait(p, 700);
  await p.locator('.catalog-discovery-card').nth(2).locator('.catalog-discovery-actions button:last-child').dispatchEvent('click'); await wait(p, 500);
  const secondName = await p.evaluate(() => document.querySelector('[data-sonner-toast]')?.textContent?.match(/([A-Z][^.]+) is in that day now/)?.[1] ?? null);
  await p.locator('[data-sonner-toast] [data-cancel]').first().dispatchEvent('click'); await wait(p, 600);
  await dock(p, 'Train'); await tab(p, 'Plan'); await wait(p, 900);
  const afterUndo = await p.evaluate(([a, b]) => { const names = [...document.querySelectorAll('.day-orderable-exercise strong, .day-orderable-exercise h3')].map((e) => e.textContent.trim()); return { first: names.includes(a), second: names.includes(b), count: names.length, summary: document.querySelector('.rate-stack-headline')?.textContent?.trim() }; }, [detailName, secondName]);
  check('B4 Undo reverses exactly the last add; counts and coverage recompute', afterUndo.first && !afterUndo.second && afterUndo.count === plan.count && !!afterUndo.summary, { secondName, afterUndo, planCount: plan.count });
  await ctx.close();
}
{ // Journey C — plan picker and detail.
  const [ctx, p] = await page({ video: 'fail' }); await seed(p, { 'sports-genome-launch-experience-enabled-v1': 'off' }); await p.goto(`${base}/`); await wait(p, 2500); await draft(p); await tab(p, 'Plan'); await wait(p, 800);
  const dayCount = await p.evaluate(() => document.querySelectorAll('.day-orderable-exercise').length);
  await p.locator('.day-action-add').first().dispatchEvent('click'); await wait(p, 800);
  const foot = await p.evaluate(() => ({ head: document.querySelector('.day-picker-sheet-head .metric-label')?.textContent?.trim(), foot: document.querySelector('.day-picker-sheet-foot span')?.textContent?.trim() }));
  check('C1 footer count is the persisted day and the destination is explicit', foot.foot === `${dayCount} in Week 1 · Sport Transfer` && foot.head === 'Add to Week 1 · Sport Transfer', { dayCount, foot });
  await p.locator('.day-picker-sheet .day-picker-tools input').fill('row'); await wait(p, 500);
  const resultsBefore = await p.evaluate(() => ({ n: document.querySelectorAll('.day-picker-sheet .day-picker-result').length, first: document.querySelector('.day-picker-sheet .day-picker-result strong')?.textContent?.trim() }));
  await p.evaluate(() => { document.querySelector('.day-picker-sheet').scrollTop = 300; });
  const scrollBefore = await p.evaluate(() => document.querySelector('.day-picker-sheet').scrollTop);
  await p.locator('.day-picker-sheet .day-picker-result button').first().dispatchEvent('click'); await wait(p, 900);
  const detail = await p.evaluate(() => ({ open: !!document.querySelector('.exercise-intelligence'), name: document.querySelector('.exercise-intelligence h1')?.textContent?.trim(), pickerBehind: !!document.querySelector('.day-picker-sheet') }));
  await p.locator('.exercise-intelligence-close').dispatchEvent('click'); await wait(p, 500);
  const after = await p.evaluate(() => ({ query: document.querySelector('.day-picker-sheet .day-picker-tools input')?.value, n: document.querySelectorAll('.day-picker-sheet .day-picker-result').length, scroll: document.querySelector('.day-picker-sheet')?.scrollTop, focusIn: document.activeElement?.closest('.day-picker-sheet') !== null }));
  check('C2 detail is foreground; query, results and position survive the return', detail.open && detail.name === resultsBefore.first && after.query === 'row' && after.n === resultsBefore.n && Math.abs(after.scroll - scrollBefore) < 4, { resultsBefore, scrollBefore, detail, after });
  await p.locator('.day-picker-sheet .day-picker-result > button:last-child:not(:disabled)').first().dispatchEvent('click'); await wait(p, 600);
  const afterAdd = await p.evaluate(() => ({ foot: document.querySelector('.day-picker-sheet-foot span')?.textContent?.trim(), toast: document.querySelector('[data-sonner-toast]')?.textContent?.slice(0, 40), addedState: [...document.querySelectorAll('.day-picker-sheet .day-picker-result > button:last-child:disabled')].length }));
  await p.locator('.day-picker-sheet-foot button').dispatchEvent('click'); await wait(p, 600);
  const plan = await p.evaluate(() => ({ n: document.querySelectorAll('.day-orderable-exercise').length, sub: document.querySelector('.training-day-subtitle, .day-plan-subtitle, .day-design-main .metric-label')?.textContent?.trim(), summary: document.querySelector('.rate-stack-headline')?.textContent?.trim() }));
  check('C3 add updates footer, Added state, plan count and analysis together', afterAdd.foot === `${dayCount + 1} in Week 1 · Sport Transfer · 1 added now` && afterAdd.addedState >= 1 && plan.n === dayCount + 1 && !!plan.summary, { afterAdd, plan });
  await p.locator('.training-plan-days [role="tab"], .training-plan-days button').filter({ hasText: /^Legs/ }).first().dispatchEvent('click'); await wait(p, 800);
  await p.locator('.day-action-add, .day-plan-empty button').first().dispatchEvent('click'); await wait(p, 800);
  const legs = await p.evaluate(() => ({ head: document.querySelector('.day-picker-sheet-head .metric-label')?.textContent?.trim(), foot: document.querySelector('.day-picker-sheet-foot span')?.textContent?.trim() }));
  check('C4 changing the day changes the destination, no stale count', /Legs/.test(legs.head || '') && /^0 in Week 1 · Legs$/.test(legs.foot || ''), legs);
  await ctx.close();
}
{ // Journey D — analysis and strength.
  const [ctx, p] = await page({ video: 'fail', ranks: 'hang' });
  const lifts = JSON.stringify([{ id: 'w1', exerciseName: 'Barbell Back Squat', observedAt: '2026-09-20T10:00:00.000Z', measurementType: 'MEASURED_1RM', loadKg: 120, repetitions: 1, bodyMassKgAtTest: 66 }, { id: 'w2', exerciseName: 'Barbell Bench Press', observedAt: '2026-09-21T10:00:00.000Z', measurementType: 'MEASURED_1RM', loadKg: 80, repetitions: 1, bodyMassKgAtTest: 66 }]);
  await seed(p, { 'sports-genome-launch-experience-enabled-v1': 'off', 'sports-genome-device-strength-observations-v1': lifts }); await p.goto(`${base}/`); await wait(p, 2500); await draft(p); await tab(p, 'Plan'); await wait(p, 800);
  const summary = await p.evaluate(() => document.querySelector('.rate-stack-headline')?.textContent?.trim());
  await p.locator('.rate-stack-trigger').first().dispatchEvent('click'); await wait(p, 900);
  const an = await p.evaluate(() => { const o = document.querySelector('.stack-analysis-overlay'); const r = o?.getBoundingClientRect(); const scrollers = [...document.querySelectorAll('.stack-analysis-page *')].filter((e) => { const cs = getComputedStyle(e); return /(auto|scroll)/.test(cs.overflowY) && e.scrollHeight > e.clientHeight + 4; }).length; return { rect: r ? [Math.round(r.top), Math.round(r.left), Math.round(r.width), Math.round(r.height)] : null, title: o?.querySelector('h1')?.textContent, day: o?.querySelector('.stack-analysis-head p:last-child')?.textContent, close: o?.querySelector('.stack-analysis-head button')?.textContent?.trim(), nestedScrollers: scrollers, tips: [...document.querySelectorAll('.stack-analysis-page p, .stack-analysis-page li')].map((e) => e.textContent).filter((x) => /points (short|under)/.test(x)).slice(0, 2) }; });
  const sPts = summary?.match(/(\d+) points short/)?.[1]; const tPts = an.tips.map((x) => x.match(/(\d+) points/)?.[1]);
  check('D1 analysis is a full-height surface with one scroll area and a titled exit', an.rect && an.rect[0] === 0 && an.rect[2] === 390 && an.rect[3] === 844 && /coverage/.test(an.title || '') && /Week 1 · Day 05/.test(an.day || '') && an.close === 'Close' && an.nestedScrollers === 0, an);
  check('D2 summary and detailed gap agree under the same state', !sPts || tPts.length === 0 || tPts.includes(sPts), { summary, tips: an.tips });
  await p.locator('.stack-analysis-head button').dispatchEvent('click'); await wait(p, 500);
  await dock(p, 'Progress'); await tab(p, 'Strength'); await wait(p, 1200);
  const pending = await p.evaluate(() => ({ mode: document.querySelector('.strength-body-map')?.dataset.mode, legend: document.querySelector('.strength-map-legend-on')?.textContent?.trim(), notice: document.querySelector('.rank-profile-partial')?.textContent?.slice(0, 40), figureH: Math.round(document.querySelector('.strength-body-chart')?.getBoundingClientRect().height || 0), rowState: document.querySelector('.region-grid-state, .anatomy-region-row small')?.textContent?.trim(), red: [...document.querySelectorAll('.strength-body-chart .anatomy-muscle path')].some((el) => /rgb\(236, 95, 74\)|#ec5f4a/.test(getComputedStyle(el).fill)) }));
  check('D3 Strength shows truthful loading: muted coverage, said in the legend and notice, no red', pending.mode === 'pending' && /ranking/.test(pending.legend || '') && /Ranking your lifts/.test(pending.notice || '') && !pending.red && pending.figureH > 300, pending);
  await ctx.close();
}
{ // Journey E — profile and video.
  const [ctx, p] = await page(); await seed(p, { 'sports-genome-launch-experience-enabled-v1': 'off' }); await p.goto(`${base}/?workspace=profile`); await wait(p, 2500);
  const tops = []; for (const y of [0, 300, 900, 1600]) { await p.evaluate((y) => window.scrollTo(0, y), y); await wait(p, 250); tops.push(await p.evaluate(() => ({ y: window.scrollY, backdrop: document.querySelector('.status-backdrop')?.classList.contains('is-solid'), backdropFixed: getComputedStyle(document.querySelector('.status-backdrop')).position, topbarTop: Math.round(document.querySelector('.apex-topbar')?.getBoundingClientRect().top ?? -1) }))); }
  check('E1 scrolled About me keeps a status backdrop', tops[0].backdrop === false && tops.slice(1).every((t) => t.backdrop === true && t.backdropFixed === 'fixed'), tops);
  await p.locator('.about-me-group > summary').filter({ hasText: 'Launch video' }).dispatchEvent('click'); await wait(p, 400);
  await p.evaluate(() => window.scrollTo(0, 700)); await wait(p, 300); const y0 = await p.evaluate(() => window.scrollY);
  const trigger = p.getByRole('button', { name: /Preview intro video/i }).first();
  await trigger.dispatchEvent('click'); await wait(p, 800);
  await p.evaluate(() => document.querySelector('.intro-preview-video')?.dispatchEvent(new Event('ended'))); await wait(p, 1200);
  const e2 = await p.evaluate(() => ({ preview: !!document.querySelector('.intro-preview'), y: window.scrollY, overflow: document.documentElement.style.overflow, focus: document.activeElement?.textContent?.trim(), h1: document.querySelector('main h1')?.textContent?.trim() }));
  check('E2 natural end returns to About me at the same position', !e2.preview && Math.abs(e2.y - y0) < 4 && e2.overflow === '' && e2.focus === 'Preview intro video', { y0, e2 });
  await trigger.dispatchEvent('click'); await wait(p, 700);
  const e3a = await p.evaluate(() => ({ preview: !!document.querySelector('.intro-preview'), t: document.querySelector('.intro-preview-video')?.currentTime ?? null }));
  await p.keyboard.press('Escape'); await wait(p, 600);
  const e3 = await p.evaluate(() => ({ preview: !!document.querySelector('.intro-preview'), y: window.scrollY, focus: document.activeElement?.textContent?.trim(), layers: document.querySelectorAll('.intro-preview, .sports-genome-boot-splash').length }));
  check('E3 reopen starts fresh; early close restores scroll and focus, no layer left', e3a.preview && e3a.t !== null && e3a.t < 1.5 && !e3.preview && Math.abs(e3.y - y0) < 4 && e3.focus === 'Preview intro video' && e3.layers === 0, { e3a, e3 });
  await p.getByLabel(/Play video while app opens/i).first().dispatchEvent('click').catch(() => {}); await wait(p, 300);
  const pref = await p.evaluate(() => localStorage.getItem('sports-genome-launch-experience-enabled-v1'));
  await p.goto(`${base}/?workspace=command`, { waitUntil: 'commit' }); await wait(p, 1500);
  const e4 = await p.evaluate(() => ({ boot: document.documentElement.dataset.sportsGenomeBoot, video: document.documentElement.dataset.sportsGenomeBootVideo }));
  await p.evaluate(() => document.getElementById('sports-genome-boot-video')?.dispatchEvent(new Event('ended'))); await ready(p);
  await p.goto(`${base}/?workspace=profile`); await wait(p, 2000);
  await p.locator('.about-me-group > summary').filter({ hasText: 'Launch video' }).dispatchEvent('click'); await wait(p, 400);
  await p.getByLabel(/Play video while app opens/i).first().dispatchEvent('click').catch(() => {}); await wait(p, 300);
  const pref2 = await p.evaluate(() => localStorage.getItem('sports-genome-launch-experience-enabled-v1'));
  await p.goto(`${base}/?workspace=command`, { waitUntil: 'commit' }); await p.waitForFunction(() => !!document.documentElement.dataset.sportsGenomeBoot, null, { timeout: 5000 }); await wait(p, 800);
  const e5 = await p.evaluate(() => ({ boot: document.documentElement.dataset.sportsGenomeBoot, video: document.documentElement.dataset.sportsGenomeBootVideo }));
  check('E4 the launch preference is honoured on the next open, both ways', pref !== 'off' && e4.boot === 'on' && e4.video === 'playing' && pref2 === 'off' && e5.boot === 'off' && e5.video === 'skipped', { pref, e4, pref2, e5 });
  await ctx.close();
}
await browser.close();
writeFileSync(`${scratch}/walk-journeys.json`, JSON.stringify(results, null, 1));
console.log(`${results.filter((r) => r.pass).length}/${results.length} passed`);
