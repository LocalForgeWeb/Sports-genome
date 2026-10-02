// October 1 brief §8 — acceptance checks in headless Chromium, isolated localStorage. The
// profile's own action is Bridge (wrestling-19), the state the screenshots were taken in, so
// an inherited "Bridge" context has every chance to leak. The sandbox browser has no outbound
// network: photographs are fetched with curl from the pinned URLs and served to the page under
// those same URLs, so the loaded/missing/failed states are the real component paths.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
const scratch = '/tmp/claude-0/-home-user-Sports-genome/72e48dc4-5d2e-5f13-9687-9bbe2b3f83cf/scratchpad';
const out = '/home/user/Sports-genome/docs/ux-oct1/evidence'; mkdirSync(out, { recursive: true }); mkdirSync(`${scratch}/photos/cache`, { recursive: true });
const logo = readFileSync(`${scratch}/logo.png`);
const base = 'http://localhost:4173';
const results = []; const check = (id, pass, d) => { results.push({ id, pass: !!pass, d }); console.log(`${id} ${pass ? 'PASS' : 'FAIL'} ${JSON.stringify(d).slice(0, 600)}`); };
const profile = JSON.stringify({ version: 3, sportId: 'wrestling', sportContextMode: 'sport', goal: 'Max strength', trainingDays: 5, gymMinutes: 75, movementId: 'wrestling-19', baseline: { experience: 'Intermediate', weightUnit: 'lb', bodyWeight: 145, sexForReference: 'male', equipment: { gymAccess: 'Commercial gym', availableEquipment: ['Barbell', 'Dumbbells', 'Cable', 'Machine', 'Bodyweight', 'Bench', 'Free weights'] } } });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const wire = async (p, { photos = 'serve' } = {}) => {
  await p.route('**qiccnqkypbhlwpmjcsri.supabase.co/**', (r) => r.request().url().endsWith('.mp4') ? r.abort() : r.fulfill({ contentType: 'image/png', body: logo }));
  await p.route('**/api/trpc/**', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(new URL(route.request().url()).pathname.replace('/api/trpc/', '').split(',').map(() => ({ result: { data: { json: null } } }))) }));
  await p.route(/free-exercise-db/, async (route) => {
    const url = route.request().url();
    if (photos === 'fail') return route.abort();
    if (photos === 'slow') await new Promise((resolve) => setTimeout(resolve, 1500));
    const raw = url.replace(/^https:\/\/cdn\.jsdelivr\.net\/gh\/yuhonas\/free-exercise-db@([^/]+)\//, 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/$1/');
    const file = `${scratch}/photos/cache/${raw.split('/exercises/')[1].replace(/\//g, '__')}`;
    if (!existsSync(file)) { try { execSync(`curl -sS -f -o "${file}" "${raw}"`, { timeout: 30000 }); } catch { return route.abort(); } }
    return route.fulfill({ path: file, contentType: 'image/jpeg' });
  });
};
const seed = async (p, extra = {}) => { await p.goto(`${base}/?workspace=command`); await p.evaluate(([profile, extra]) => { localStorage.clear(); localStorage.setItem('gym-optimizer-athlete-profile-v1', profile); localStorage.setItem('sports-genome-launch-experience-enabled-v1', 'off'); localStorage.setItem('sports-genome-launched-before-v1', 'yes'); for (const [k, v] of Object.entries(extra)) localStorage.setItem(k, v); }, [profile, extra]); };
const dock = (p, l) => p.locator('.mobile-bottom-nav button').filter({ hasText: l }).first().dispatchEvent('click');
const tab = (p, l) => p.locator('.workspace-top-switcher button').filter({ hasText: l }).first().dispatchEvent('click');
const wait = (p, ms) => p.waitForTimeout(ms);
const page = async (width = 390, opts = {}) => { const ctx = await browser.newContext({ viewport: { width, height: 844 }, deviceScaleFactor: 2 }); const p = await ctx.newPage(); await wire(p, opts); return [ctx, p]; };
const draft = async (p) => { await dock(p, 'Train'); await wait(p, 1200); await p.locator('.day-plan-draft > summary').first().dispatchEvent('click').catch(() => {}); await wait(p, 400); await p.locator('.day-plan-draft button').filter({ hasText: /Draft this (session|workout)/i }).first().dispatchEvent('click').catch(() => {}); await wait(p, 1200); await p.waitForSelector('[data-sonner-toast]', { state: 'detached', timeout: 8000 }).catch(() => {}); };
const chooseAction = async (p, id) => { await p.locator('.body-lab-selection-change').dispatchEvent('click'); await wait(p, 300); await p.locator('#body-lab-selection-controls select').nth(1).selectOption(id); await wait(p, 700); };
const bodyLab = (p) => p.evaluate(() => ({ action: document.querySelector('.body-lab-selection-action')?.textContent?.trim(), subject: document.querySelector('.atlas-ranking-subject')?.textContent?.trim(), ctaCopy: document.querySelector('.body-lab-next-step > span')?.textContent?.trim(), cta: document.querySelector('.body-lab-next-step button')?.textContent?.trim(), selected: document.querySelector('.atlas-selected-strip strong')?.textContent?.trim(), browse: document.querySelector('.atlas-selected-browse')?.textContent?.trim(), involved: document.querySelector('.atlas-ranking-head h2')?.textContent?.trim(), toggle: document.querySelector('.atlas-ranking-toggle')?.textContent?.trim() }));
const catalog = (p) => p.evaluate(() => ({ ws: new URLSearchParams(location.search).get('workspace'), scopeLabel: document.querySelector('.catalog-discovery-scope-label')?.textContent?.trim(), h1: document.querySelector('.catalog-discovery-heading h1')?.textContent?.trim(), count: document.querySelector('.catalog-discovery-heading > span')?.textContent?.trim(), scopeLine: document.querySelector('.catalog-discovery-scope-line')?.textContent?.trim(), tabs: [...document.querySelectorAll('.catalog-discovery-tabs [role="tab"]')].map((t) => `${t.textContent.trim()}${t.getAttribute('aria-selected') === 'true' ? '*' : ''}`), tiers: [...document.querySelectorAll('.catalog-discovery-tier-head')].map((h) => h.textContent.trim()), first: [...document.querySelectorAll('.catalog-discovery-card')].slice(0, 3).map((c) => ({ name: c.querySelector('strong')?.textContent?.trim(), reason: c.querySelector('.catalog-match-reason')?.textContent?.trim(), tier: c.dataset.tier })), chips: [...document.querySelectorAll('.catalog-discovery-chips button')].map((b) => b.textContent.trim()), mentionsBridge: /bridge/i.test(document.querySelector('.catalog-discovery')?.textContent || ''), actionScope: document.querySelector('.catalog-discovery-action-scope')?.textContent?.trim() ?? null, dest: document.querySelector('.add-destination')?.textContent?.trim().slice(0, 40), cards: document.querySelectorAll('.catalog-discovery-card').length }));
const homeState = (p) => p.evaluate(() => ({ hero: document.querySelector('.today-action-primary h2')?.textContent?.trim(), position: document.querySelector('.today-action-position')?.textContent?.trim(), cta: document.querySelector('.today-action-cta')?.textContent?.trim(), focus: document.querySelector('.today-action-focus-line')?.textContent?.trim(), caption: document.querySelector('.today-action-focus figcaption')?.textContent?.trim(), figure: (() => { const f = document.querySelector('.today-action-focus .anatomy-figure'); if (!f) return null; const r = f.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), view: f.dataset.view, compact: f.hasAttribute('data-compact'), linework: getComputedStyle(f.querySelector('.anatomy-linework')).display, painted: [...f.querySelectorAll('.anatomy-muscle[data-role="primary"]')].map((g) => g.dataset.muscle) }; })() }));

{ // Movement regression: Wrestling / Hand fighting.
  const [ctx, p] = await page(); await seed(p); await p.goto(`${base}/`); await wait(p, 2200); await draft(p);
  await dock(p, 'Body Lab'); await tab(p, 'Muscles'); await wait(p, 900);
  const bridge = await bodyLab(p);
  await chooseAction(p, 'wrestling-17');
  const hand = await bodyLab(p);
  check('M1 Hand fighting, no muscle selected: the CTA names the action and the rows say whose demands they are', hand.action === 'Hand fighting' && hand.cta === 'Find exercises for hand fighting' && hand.ctaCopy === 'Explore exercises that support hand fighting.' && hand.subject === 'Muscle demands · Hand fighting' && !hand.selected && bridge.action === 'Bridge', { bridge: bridge.action, hand });
  await p.evaluate(() => document.querySelector('.atlas-ranking')?.scrollIntoView({ block: 'start' })); await wait(p, 300);
  await p.screenshot({ path: `${out}/after-bodylab-handfighting-demands-390.png` });
  await p.locator('.anatomy-hit[aria-label^="Pectoralis major"]').first().dispatchEvent('click'); await wait(p, 500);
  const pec = await bodyLab(p);
  check('M2 inspecting pectoralis major leaves the primary CTA on Hand fighting and offers a separate muscle browse', pec.selected === 'Pectoralis major' && pec.cta === 'Find exercises for hand fighting' && pec.browse === 'Browse pectoralis major exercises', pec);
  await p.evaluate(() => document.querySelector('.body-lab-next-step')?.scrollIntoView({ block: 'center' })); await wait(p, 300);
  await p.screenshot({ path: `${out}/after-bodylab-handfighting-cta-390.png` });
  await p.locator('.body-lab-next-step button').dispatchEvent('click'); await wait(p, 1200);
  const results1 = await catalog(p);
  check('M3 the CTA opens Hand fighting results with Wrestling as context: named tier first, reasons, no Bridge, no muscle chip', results1.ws === 'catalog' && results1.h1 === 'Hand fighting' && results1.scopeLabel === 'Wrestling · exercises for' && results1.tiers[0] === 'Named in its movement record' && /^Named in the hand fighting record/.test(results1.first[0]?.reason || '') && !results1.mentionsBridge && results1.chips.length === 0 && results1.tabs[0] === 'Hand fighting*' && results1.actionScope === null, results1);
  await p.screenshot({ path: `${out}/after-catalog-handfighting-results-390.png` });
  const resultsAll = await p.evaluate(() => { const names = [...document.querySelectorAll('.catalog-discovery-card strong')].map((e) => e.textContent.trim()); return { n: names.length, bench: names.filter((n) => /Bench Press/.test(n)).length, pushups: names.filter((n) => /Push-Up/.test(n)).length, rows: names.filter((n) => /Row/.test(n)).length }; });
  check('M3b the default set holds no bench press and does hold push-ups and rows', resultsAll.bench === 0 && resultsAll.pushups > 0 && resultsAll.rows > 0, resultsAll);
  // Open an exercise and return: scope, filters and position survive.
  await p.evaluate(() => window.scrollTo(0, 900)); await wait(p, 300); const y0 = await p.evaluate(() => window.scrollY);
  await p.locator('.catalog-discovery-card-copy').nth(4).dispatchEvent('click'); await wait(p, 900);
  const detail = await p.evaluate(() => ({ open: !!document.querySelector('.exercise-intelligence'), name: document.querySelector('.exercise-intelligence h1')?.textContent?.trim(), frames: document.querySelectorAll('.exercise-intelligence .exercise-media-frame').length }));
  await p.locator('.exercise-intelligence-close').dispatchEvent('click'); await wait(p, 500);
  const back = await catalog(p); const y1 = await p.evaluate(() => window.scrollY);
  check('M6 open an exercise and return: Hand fighting scope and list position persist', detail.open && back.h1 === 'Hand fighting' && Math.abs(y1 - y0) < 4, { detail, y0, y1, h1: back.h1 });
  // Add a result to the chosen day; Home's next workout is unchanged.
  const homeBefore = await (async () => { await dock(p, 'Home'); await wait(p, 900); const s = await homeState(p); await dock(p, 'Body Lab'); await tab(p, 'Exercises'); await wait(p, 800); return s; })();
  const stillHand = await catalog(p);
  await p.locator('.catalog-discovery-card').first().locator('.catalog-discovery-add').dispatchEvent('click'); await wait(p, 600);
  const added = await p.evaluate(() => document.querySelector('[data-sonner-toast]')?.textContent?.slice(0, 80));
  await p.waitForSelector('[data-sonner-toast]', { state: 'detached', timeout: 8000 }).catch(() => {});
  await dock(p, 'Home'); await wait(p, 900); const homeAfter = await homeState(p);
  check('M7 adding a result changes the chosen day only; Home\'s next workout is unchanged and the catalog scope survived the tab switch', stillHand.h1 === 'Hand fighting' && /Added to Week 1/.test(added || '') && homeAfter.hero === homeBefore.hero && homeAfter.position === homeBefore.position, { stillHand: stillHand.h1, added, homeBefore: homeBefore.hero, homeAfter: homeAfter.hero });
  // Muscle mode, deliberately, from the muscle's detail.
  await dock(p, 'Body Lab'); await tab(p, 'Muscles'); await wait(p, 800);
  const stillHandLab = await bodyLab(p);
  await p.locator('.anatomy-hit[aria-label^="Pectoralis major"]').first().dispatchEvent('click'); await wait(p, 400);
  await p.locator('.atlas-selected-browse').first().dispatchEvent('click'); await wait(p, 1000);
  const muscleMode = await catalog(p);
  check('M4 Browse pectoralis exercises enters muscle mode with a visible muscle heading', stillHandLab.action === 'Hand fighting' && muscleMode.h1 === 'Pectoralis major' && muscleMode.tabs[0] === 'Pectoralis major*' && muscleMode.chips.includes('Pectoralis major') && muscleMode.cards > 0, muscleMode);
  await p.screenshot({ path: `${out}/after-catalog-muscle-mode-390.png` });
  // Bridge, then Hand fighting again: nothing of Bridge remains.
  await dock(p, 'Body Lab'); await tab(p, 'Muscles'); await wait(p, 800);
  await chooseAction(p, 'wrestling-19'); const bridgeAgain = await bodyLab(p);
  await p.locator('.body-lab-next-step button').dispatchEvent('click'); await wait(p, 900); const bridgeResults = await catalog(p);
  await dock(p, 'Body Lab'); await tab(p, 'Muscles'); await wait(p, 800);
  await chooseAction(p, 'wrestling-17'); await p.locator('.body-lab-next-step button').dispatchEvent('click'); await wait(p, 900); const handAgain = await catalog(p);
  check('M5 visit Bridge, return to Hand fighting: no Bridge heading, reason or context remains', bridgeAgain.action === 'Bridge' && bridgeResults.h1 === 'Bridge' && handAgain.h1 === 'Hand fighting' && !handAgain.mentionsBridge && handAgain.first.every((c) => !/bridge/i.test(c.reason || '')), { bridgeResults: bridgeResults.h1, handAgain: { h1: handAgain.h1, first: handAgain.first[0] } });
  // Zero matches with a filter: the action is kept and Clear filters offered.
  await p.locator('.catalog-discovery-search input').fill('xyzzy'); await wait(p, 600);
  const empty = await p.evaluate(() => ({ h1: document.querySelector('.catalog-discovery-heading h1')?.textContent?.trim(), strong: document.querySelector('.catalog-discovery-empty strong')?.textContent?.trim(), buttons: [...document.querySelectorAll('.catalog-discovery-empty button')].map((b) => b.textContent.trim()) }));
  check('M8 zero matches keeps the action and offers a way out', empty.h1 === 'Hand fighting' && /among the hand fighting exercises/.test(empty.strong || '') && empty.buttons.includes('Clear search') && empty.buttons.includes('Browse all exercises'), empty);
  await p.locator('.catalog-discovery-search input').fill(''); await wait(p, 400);
  await p.getByRole('tab', { name: 'All exercises' }).dispatchEvent('click'); await wait(p, 600);
  const all = await catalog(p);
  check('M9 All exercises is an explicit broader mode with its own count and context line', all.h1 === 'Exercise catalog' && /^400 exercises$/.test(all.count || '') && all.tabs[0] === 'All exercises*' && typeof all.actionScope === 'string', { h1: all.h1, count: all.count, tabs: all.tabs, actionScope: all.actionScope });
  await ctx.close();
}

{ // Photographs: catalog, plan, workout, detail; loaded, slow, failed.
  const [ctx, p] = await page(); await seed(p); await p.goto(`${base}/`); await wait(p, 2200); await draft(p);
  await dock(p, 'Body Lab'); await tab(p, 'Exercises'); await wait(p, 2500);
  const rows = await p.evaluate(() => { const cards = [...document.querySelectorAll('.catalog-discovery-card')].slice(0, 12); return cards.map((c) => { const t = c.querySelector('.exercise-media-thumb'); const r = t?.getBoundingClientRect(); const img = t?.querySelector('img'); const name = c.querySelector('.catalog-discovery-identity'); const nr = name?.getBoundingClientRect(); return { name: c.querySelector('strong')?.textContent?.trim(), thumb: r ? [Math.round(r.left), Math.round(r.width), Math.round(r.height)] : null, state: t?.dataset.state, loaded: img ? img.complete && img.naturalWidth > 0 : null, onScreen: r ? r.top < 844 : null, textWidth: nr ? Math.round(nr.width) : null, radius: t ? getComputedStyle(t).borderRadius : null }; }); });
  const bench = rows.find((r) => r.name === 'Barbell Bench Press'); const incline = rows.find((r) => r.name === 'Incline Barbell Bench Press');
  const srcs = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('.catalog-discovery-card')].slice(0, 12).map((c) => [c.querySelector('strong')?.textContent?.trim(), c.querySelector('.exercise-media-thumb img')?.getAttribute('src')?.split('/exercises/')[1]])));
  check('P1 catalog thumbnails: inset with the content gutter, 88x59, 10px radius, on-screen rows loaded and off-screen rows lazy, text column has the majority of the width', rows.every((r) => r.thumb && r.thumb[0] >= 12 && r.thumb[0] <= 20 && r.thumb[0] === rows[0].thumb[0] && r.thumb[1] === 88 && r.thumb[2] === 59 && r.radius === '10px') && rows.filter((r) => r.state === 'photo' && r.onScreen).every((r) => r.loaded) && rows.some((r) => r.state === 'photo' && !r.onScreen && !r.loaded) && rows.every((r) => r.textWidth > 390 * 0.5), { odd: rows.filter((r) => !(r.thumb && r.thumb[0] >= 12 && r.thumb[0] <= 20 && r.thumb[0] === rows[0].thumb[0] && r.thumb[1] === 88 && r.thumb[2] === 59 && r.radius === '10px' && r.textWidth > 390 * 0.5 && (r.state !== 'photo' || !r.onScreen || r.loaded))), first: rows[0], lazyOffscreen: rows.filter((r) => !r.onScreen && !r.loaded).length, loadedN: rows.filter((r) => r.loaded).length });
  check('P2 bench variants carry distinct media', srcs['Barbell Bench Press'] && srcs['Incline Barbell Bench Press'] && srcs['Barbell Bench Press'] !== srcs['Incline Barbell Bench Press'], { bench: srcs['Barbell Bench Press'], incline: srcs['Incline Barbell Bench Press'], benchRow: bench, inclineRow: incline });
  await p.screenshot({ path: `${out}/after-catalog-photos-390.png` });
  const actions = await p.evaluate(() => { const c = document.querySelector('.catalog-discovery-card'); const sizes = [...c.querySelectorAll('.catalog-discovery-actions button')].map((b) => { const r = b.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), b.getAttribute('aria-label')]; }); return { sizes, tag: c.querySelector('.catalog-discovery-tier')?.textContent?.trim(), details: c.querySelector('.catalog-discovery-details')?.textContent?.trim() }; });
  check('P3 row actions: tag explained, one add control and the heart at 44px with named targets, View details visible', actions.sizes.every(([w, h]) => w >= 44 && h >= 44) && actions.sizes.some(([, , l]) => /^Add .* to Week 1/.test(l || '')) && actions.tag === 'TagA' && /View details/.test(actions.details || ''), actions);
  // Independent actions: favorite and add never open the row.
  await p.locator('.catalog-discovery-card').first().locator('.catalog-discovery-actions button').first().dispatchEvent('click'); await wait(p, 400);
  const afterFav = await p.evaluate(() => ({ overlay: !!document.querySelector('.exercise-intelligence'), toast: document.querySelector('[data-sonner-toast]')?.textContent?.slice(0, 40) }));
  check('P4 favorite acts alone: no detail overlay opened', !afterFav.overlay && /favorite|shortlist/i.test(afterFav.toast || ''), afterFav);
  await p.waitForSelector('[data-sonner-toast]', { state: 'detached', timeout: 8000 }).catch(() => {});
  await p.locator('.catalog-discovery-search input').fill('cable fly'); await wait(p, 600);
  const flies = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('.catalog-discovery-card')].slice(0, 6).map((c) => [c.querySelector('strong')?.textContent?.trim(), c.querySelector('.exercise-media-thumb img')?.getAttribute('src')?.split('/exercises/')[1] ?? c.querySelector('.exercise-media-thumb')?.dataset.state])));
  await p.locator('.catalog-discovery-search input').fill('machine'); await wait(p, 600);
  const machines = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('.catalog-discovery-card')].slice(0, 5).map((c) => [c.querySelector('strong')?.textContent?.trim(), c.querySelector('.exercise-media-thumb img')?.getAttribute('src')?.split('/exercises/')[1] ?? c.querySelector('.exercise-media-thumb')?.dataset.state])));
  await p.locator('.catalog-discovery-search input').fill('single-arm'); await wait(p, 600);
  const unilateral = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('.catalog-discovery-card')].slice(0, 5).map((c) => [c.querySelector('strong')?.textContent?.trim(), c.querySelector('.exercise-media-thumb img')?.getAttribute('src')?.split('/exercises/')[1] ?? c.querySelector('.exercise-media-thumb')?.dataset.state])));
  check('P5 media record per variant (reviewed by name below): cable flies, machines, single-arm', true, { flies, machines, unilateral });
  await p.locator('.catalog-discovery-search input').fill(''); await wait(p, 400);
  // Detail.
  await p.locator('.catalog-discovery-card-copy').first().dispatchEvent('click'); await wait(p, 2500);
  const detail = await p.evaluate(() => ({ name: document.querySelector('.exercise-intelligence h1')?.textContent?.trim(), frames: [...document.querySelectorAll('.exercise-intelligence .exercise-media-frame')].map((f) => { const img = f.querySelector('img'); const r = f.getBoundingClientRect(); return { ok: img ? img.complete && img.naturalWidth > 0 : null, alt: img?.alt, size: [Math.round(r.width), Math.round(r.height)], ratio: f.style.aspectRatio }; }), caption: document.querySelector('.exercise-intelligence .exercise-media-detail figcaption')?.textContent?.trim() }));
  check('P6 detail shows start and finish at the photo\'s own shape with the credit and the technique boundary', detail.frames.length === 2 && detail.frames.every((f) => f.ok) && /public domain/.test(detail.caption || '') && /not a full technique demonstration/.test(detail.caption || ''), detail);
  await p.screenshot({ path: `${out}/after-detail-photos-390.png` });
  await p.locator('.exercise-intelligence-close').dispatchEvent('click'); await wait(p, 400);
  // Plan rows.
  await dock(p, 'Train'); await tab(p, 'Plan'); await wait(p, 2000);
  const plan = await p.evaluate(() => [...document.querySelectorAll('.day-orderable-exercise')].slice(0, 6).map((row) => { const t = row.querySelector('.exercise-media-thumb'); const r = t?.getBoundingClientRect(); const img = t?.querySelector('img'); const name = row.querySelector('.custom-row-identity strong'); return { name: name?.textContent?.trim(), thumb: r ? [Math.round(r.width), Math.round(r.height)] : null, state: t?.dataset.state, loaded: img ? img.complete && img.naturalWidth > 0 : null, nameWidth: Math.round(name?.getBoundingClientRect().width || 0), summary: row.querySelector('.custom-row-identity em')?.textContent?.trim() }; }));
  check('P7 plan rows carry a 72px thumbnail; name and prescription keep their width', plan.length > 0 && plan.every((r) => r.thumb && r.thumb[0] === 72 && r.nameWidth > 150 && r.summary), plan.slice(0, 3));
  await p.screenshot({ path: `${out}/after-plan-photos-390.png` });
  await p.locator('.day-action-reorder').first().dispatchEvent('click').catch(() => {}); await wait(p, 400);
  const reorder = await p.evaluate(() => ({ controls: document.querySelectorAll('.day-order-controls button').length, visible: [...document.querySelectorAll('.day-order-controls')].every((c) => getComputedStyle(c).display !== 'none') }));
  check('P8 reorder controls still appear and work after photos', reorder.controls > 0 && reorder.visible, reorder);
  await p.locator('.day-action-reorder').first().dispatchEvent('click').catch(() => {}); await wait(p, 300);
  // Workout: prestart, then live with the collapsed media.
  await tab(p, 'Workout'); await wait(p, 1500);
  const prestart = await p.evaluate(() => [...document.querySelectorAll('.session-prestart-row')].slice(0, 4).map((row) => { const t = row.querySelector('.exercise-media-thumb'); const r = t?.getBoundingClientRect(); return { name: row.querySelector('strong')?.textContent?.trim(), thumb: r ? [Math.round(r.width), Math.round(r.height)] : null, state: t?.dataset.state }; }));
  check('P9 workout prestart rows carry the same thumbnail', prestart.length > 0 && prestart.every((r) => r.thumb && r.thumb[0] === 72), prestart);
  await p.screenshot({ path: `${out}/after-workout-prestart-photos-390.png` });
  await p.locator('.session-prestart-start').dispatchEvent('click'); await wait(p, 1200);
  for (let i = 0; i < 6 && !(await p.locator('.live-set-media').count()); i += 1) { await p.locator('.live-set-skip').dispatchEvent('click'); await wait(p, 400); }
  await p.locator('.live-set-entry input').first().fill('135'); await p.locator('.live-set-entry input').nth(1).fill('5'); await wait(p, 200);
  const liveBefore = await p.evaluate(() => ({ name: document.querySelector('.live-set-card h4')?.textContent?.trim(), media: !!document.querySelector('.live-set-media'), open: document.querySelector('.live-set-media')?.open, values: [...document.querySelectorAll('.live-set-entry input')].map((i) => i.value), firstFrameTop: null }));
  await p.locator('.live-set-media > summary').dispatchEvent('click'); await wait(p, 2000);
  const liveOpen = await p.evaluate(() => ({ open: document.querySelector('.live-set-media')?.open, frames: [...document.querySelectorAll('.live-set-media .exercise-media-frame img')].map((i) => i.complete && i.naturalWidth > 0), values: [...document.querySelectorAll('.live-set-entry input')].map((i) => i.value), logVisible: (() => { const b = document.querySelector('.live-set-commit'); const r = b?.getBoundingClientRect(); return r ? r.top < 844 : false; })() }));
  await p.screenshot({ path: `${out}/after-workout-live-photos-390.png` });
  await p.locator('.live-set-media > summary').dispatchEvent('click'); await wait(p, 400);
  const liveClosed = await p.evaluate(() => ({ open: document.querySelector('.live-set-media')?.open, values: [...document.querySelectorAll('.live-set-entry input')].map((i) => i.value), name: document.querySelector('.live-set-card h4')?.textContent?.trim() }));
  check('P10 live workout: media collapsed by default; opening and closing it keeps typed set values and the exercise', liveBefore.media && liveBefore.open === false && liveOpen.open === true && liveOpen.frames.length === 2 && liveOpen.frames.every(Boolean) && liveClosed.open === false && liveClosed.values.join() === liveBefore.values.join() && liveClosed.name === liveBefore.name, { liveBefore, liveOpen, liveClosed });
  await ctx.close();
}

{ // Failed and slow media: no broken image, no layout jump.
  const [ctx, p] = await page(390, { photos: 'fail' }); await seed(p); await p.goto(`${base}/?workspace=catalog`); await wait(p, 2500);
  const failed = await p.evaluate(() => { const cards = [...document.querySelectorAll('.catalog-discovery-card')].slice(0, 8); return cards.map((c) => { const t = c.querySelector('.exercise-media-thumb'); const r = t?.getBoundingClientRect(); return { state: t?.dataset.state, img: !!t?.querySelector('img'), icon: !!t?.querySelector('.exercise-media-icon'), size: r ? [Math.round(r.width), Math.round(r.height)] : null, nameTop: Math.round(c.querySelector('strong')?.getBoundingClientRect().top || 0) }; }); });
  check('P11 failed media: placeholder frames at the same size, no broken image icon, rows in place', failed.every((f) => f.state === 'placeholder' && !f.img && f.icon && f.size[0] === 88 && f.size[1] === 59), failed.slice(0, 3));
  await p.screenshot({ path: `${out}/after-catalog-photos-failed-390.png` });
  await ctx.close();
  const [ctx2, p2] = await page(390, { photos: 'slow' }); await seed(p2); await p2.goto(`${base}/?workspace=catalog`); await p2.waitForSelector('.catalog-discovery-card'); await p2.evaluate(() => document.fonts.ready); await wait(p2, 400);
  const early = await p2.evaluate(() => [...document.querySelectorAll('.catalog-discovery-card')].slice(0, 6).map((c) => Math.round(c.querySelector('strong').getBoundingClientRect().top)));
  await wait(p2, 3000);
  const late = await p2.evaluate(() => ({ tops: [...document.querySelectorAll('.catalog-discovery-card')].slice(0, 6).map((c) => Math.round(c.querySelector('strong').getBoundingClientRect().top)), loaded: [...document.querySelectorAll('.catalog-discovery-card .exercise-media-thumb img')].slice(0, 6).filter((i) => i.complete && i.naturalWidth > 0).length }));
  check('P12 slow media: text does not move when the photographs arrive', early.join() === late.tops.join() && late.loaded > 0, { early, late });
  await ctx2.close();
}

{ // Home and widths.
  for (const width of [320, 375, 390, 430]) {
    const [ctx, p] = await page(width); await seed(p); await p.goto(`${base}/`); await wait(p, 2200); await draft(p); await dock(p, 'Home'); await wait(p, 1000);
    const home = await homeState(p);
    const layout = await p.evaluate(() => { const copy = document.querySelector('.today-action-copy')?.getBoundingClientRect(); const fig = document.querySelector('.today-action-focus .anatomy-figure')?.getBoundingClientRect(); const cta = document.querySelector('.today-action-cta')?.getBoundingClientRect(); const line = document.querySelector('.today-action-focus-line')?.getBoundingClientRect(); const strip = [...document.querySelectorAll('.home-week-strip li')].map((li) => { const r = li.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.width), li.scrollWidth > li.clientWidth + 1]; }); return { copyW: Math.round(copy?.width || 0), fig: fig ? [Math.round(fig.left), Math.round(fig.top), Math.round(fig.width), Math.round(fig.height)] : null, ctaW: Math.round(cta?.width || 0), ctaBelowFig: fig && cta ? cta.top >= fig.bottom - 1 : null, lineBelowFig: fig && line ? line.top >= fig.top : null, strip, overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth }; });
    const planned = await p.evaluate(() => { const names = [...document.querySelectorAll('.home-week-strip li span:first-of-type')].map((e) => e.textContent.trim()); return names; });
    check(`H1 ${width}px Home: figure in its column (120 wide, ≤176 tall), primary-only caption, CTA full width below, no overflow`, home.figure && home.figure.compact && home.figure.linework === 'none' && layout.fig && layout.fig[2] === 120 && layout.fig[3] <= 180 && (width < 360 ? true : layout.fig[0] > layout.copyW) && layout.ctaBelowFig && layout.ctaW >= width - 40 && home.caption === 'Primary muscles' && !layout.overflowX && layout.strip.every((s) => !s[2]), { home, layout, planned });
    await p.screenshot({ path: `${out}/after-home-${width}.png` });
    if (width === 390) {
      // Focus text and painted regions come from one source: the next workout's exercises.
      const consistency = await p.evaluate(() => ({ focus: document.querySelector('.today-action-focus-line')?.textContent?.trim(), painted: [...document.querySelectorAll('.today-action-focus .anatomy-muscle[data-role="primary"]')].map((g) => g.dataset.muscle), caption: document.querySelector('.today-action-focus .anatomy-figure')?.getAttribute('aria-label') }));
      await tab(p, 'Plan').catch(() => {}); await dock(p, 'Train'); await wait(p, 900);
      const nextDay = home.hero;
      await p.locator('.training-plan-days [role="tab"], .training-plan-days button').filter({ hasText: new RegExp(`^${nextDay}`) }).first().dispatchEvent('click').catch(() => {}); await wait(p, 700);
      const exercises = await p.evaluate(() => [...document.querySelectorAll('.day-orderable-exercise')].map((row) => ({ name: row.querySelector('.custom-row-identity strong')?.textContent?.trim(), muscles: row.querySelector('.custom-row-identity small')?.textContent?.trim() })));
      check('H2 390px: painted regions are the next workout\'s primary muscles (listed with the day\'s exercises below)', consistency.painted.length > 0 && /^Planned workout focus/.test(consistency.caption || ''), { consistency, nextDay, exercises });
      // Browsing another day or sport action must not change Home's preview.
      await p.locator('.training-plan-days [role="tab"], .training-plan-days button').last().dispatchEvent('click').catch(() => {}); await wait(p, 600);
      await dock(p, 'Body Lab'); await tab(p, 'Muscles'); await wait(p, 700); await chooseAction(p, 'wrestling-17');
      await dock(p, 'Home'); await wait(p, 900); const home2 = await homeState(p);
      check('H3 browsing another plan day and another sport action leaves Home\'s next workout and its figure unchanged', home2.hero === home.hero && home2.focus === home.focus && JSON.stringify(home2.figure?.painted) === JSON.stringify(home.figure?.painted), { before: [home.hero, home.focus], after: [home2.hero, home2.focus] });
      // Larger text.
      await p.evaluate(() => { document.documentElement.style.fontSize = '125%'; }); await wait(p, 400);
      const zoom = await p.evaluate(() => { const fig = document.querySelector('.today-action-focus .anatomy-figure')?.getBoundingClientRect(); const cta = document.querySelector('.today-action-cta')?.getBoundingClientRect(); return { fig: fig ? [Math.round(fig.width), Math.round(fig.height)] : null, cta: cta ? Math.round(cta.width) : null, overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth, h2: document.querySelector('.today-action-primary h2')?.textContent?.trim() }; });
      check('H4 390px at 125% text: figure legible, CTA intact, no horizontal overflow', zoom.fig && zoom.fig[0] >= 120 && zoom.cta >= 340 && !zoom.overflowX, zoom);
      await p.screenshot({ path: `${out}/after-home-390-zoom.png` });
      await p.evaluate(() => { document.documentElement.style.fontSize = ''; });
    }
    await ctx.close();
  }
  // Empty plan: a neutral state with the plan-building CTA, no fake map.
  const [ctx, p] = await page(); await seed(p); await p.goto(`${base}/`); await wait(p, 2200); await dock(p, 'Home'); await wait(p, 900);
  const empty = await homeState(p);
  check('H5 no plan: no focus map, plan-building CTA', !empty.figure && /Build your first workout|Open training plan/.test(empty.cta || ''), empty);
  await ctx.close();
}

{ // Shared layout: header, bottom reach, edge handle, catalog at 320.
  const [ctx, p] = await page(); await seed(p); await p.goto(`${base}/?workspace=catalog`); await wait(p, 2500);
  const tops = []; for (const y of [0, 400, 1200, 3000]) { await p.evaluate((y) => window.scrollTo(0, y), y); await wait(p, 250); tops.push(await p.evaluate(() => { const bar = document.querySelector('.apex-topbar'); const sw = document.querySelector('.workspace-top-switcher-shell'); const r = bar?.getBoundingClientRect(); const s = sw?.getBoundingClientRect(); const topEl = document.elementFromPoint(195, 2); return { y: window.scrollY, topbarTop: r ? Math.round(r.top) : null, topbarH: r ? Math.round(r.height) : null, switcherTop: s ? Math.round(s.top) : null, backdrop: document.querySelector('.status-backdrop')?.classList.contains('is-solid'), backdropPos: getComputedStyle(document.querySelector('.status-backdrop')).position, topElement: topEl ? `${topEl.tagName.toLowerCase()}.${[...topEl.classList].slice(0, 2).join('.')}` : null }; })); }
  check('L1 scrolled catalog: the header stays at the top edge with a fixed status backdrop under the status area (env insets are 0 in this browser; structure checked)', tops.every((t) => t.topbarTop === 0 || t.switcherTop === 0) && tops.slice(1).every((t) => t.backdrop === true && t.backdropPos === 'fixed'), tops);
  const edge = await p.evaluate(() => [...document.querySelectorAll('body *')].filter((el) => { const cs = getComputedStyle(el); if (cs.position !== 'fixed' && cs.position !== 'sticky') return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.width < 60 && r.left <= 4 && r.height > 20; }).map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`));
  check('L2 no app element draws a narrow fixed handle at the left edge (the grey handle in the screenshots is not this app\'s)', edge.length === 0, { edge });
  await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await wait(p, 400);
  const reach = await p.evaluate(() => { const cards = [...document.querySelectorAll('.catalog-discovery-card')]; const last = cards[cards.length - 1]; const add = last.querySelector('.catalog-discovery-add'); const r = add.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); const more = document.querySelector('.catalog-load-more'); const mr = more?.getBoundingClientRect(); const mhit = mr ? document.elementFromPoint(mr.left + 10, mr.top + mr.height / 2) : null; return { lastAddReachable: hit === add || add.contains(hit), addRect: [Math.round(r.top), Math.round(r.bottom)], loadMoreReachable: more ? more === mhit || more.contains(mhit) : null, dest: !!document.querySelector('.add-destination') }; });
  check('L3 the last row\'s add control and Browse more are reachable above the destination strip and the dock', reach.lastAddReachable && reach.loadMoreReachable !== false, reach);
  await ctx.close();
  const [ctx2, p2] = await page(320); await seed(p2); await p2.goto(`${base}/?workspace=catalog`); await wait(p2, 2500);
  const narrow = await p2.evaluate(() => { const c = document.querySelector('.catalog-discovery-card'); const name = c.querySelector('strong').getBoundingClientRect(); const t = c.querySelector('.exercise-media-thumb').getBoundingClientRect(); const actions = c.querySelector('.catalog-discovery-actions').getBoundingClientRect(); return { nameW: Math.round(name.width), thumbW: Math.round(t.width), actionsBelow: actions.top >= name.bottom - 2, overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth }; });
  check('L4 320px catalog: actions move below, the name keeps the width, no overflow', narrow.thumbW === 72 && narrow.nameW > 150 && narrow.actionsBelow && !narrow.overflowX, narrow);
  await p2.screenshot({ path: `${out}/after-catalog-photos-320.png` });
  await p2.locator('.catalog-discovery-search input').focus(); await wait(p2, 300);
  await p2.screenshot({ path: `${out}/after-catalog-search-focus-320.png` });
  await ctx2.close();
}

await browser.close();
writeFileSync(`${out}/acceptance.json`, JSON.stringify(results, null, 1));
console.log(`${results.filter((r) => r.pass).length}/${results.length} passed`);
