// Checks for the polish brief's new behaviours: recent row, empty-result help, workout aids, finish
// continuation, reorder undo, region log continuation, search shortcut.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { boot } from './home.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const dock = (p, l) => p.locator('.mobile-bottom-nav button').filter({ hasText: l }).first().dispatchEvent('click');
const tab = (p, l) => p.locator('.workspace-top-switcher button').filter({ hasText: l }).first().dispatchEvent('click');
const wait = (p, ms = 700) => p.waitForTimeout(ms);
const results = []; const check = (id, pass, detail) => { results.push({ id, pass: !!pass }); console.log(`${id} ${pass ? 'PASS' : 'FAIL'} ${JSON.stringify(detail)}`); };
const p = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
await boot(p, { draft: true });
// Discovery: count copy, recent row, suggestions, filter removal.
await dock(p, 'Body Lab'); await tab(p, 'Exercises'); await wait(p, 900);
const c0 = await p.evaluate(() => ({ count: document.querySelector('.catalog-discovery-heading > span')?.textContent, scope: !!document.querySelector('.local-search-scope'), recent: !!document.querySelector('.catalog-recent') }));
await p.locator('.catalog-discovery-card-copy').nth(2).dispatchEvent('click'); await wait(p, 800);
const opened = await p.evaluate(() => document.querySelector('#exercise-intelligence-title')?.textContent);
await p.locator('.exercise-intelligence-close').dispatchEvent('click'); await wait(p, 700);
const c1 = await p.evaluate(() => ({ recent: [...document.querySelectorAll('.catalog-recent-row button')].map((b) => b.textContent), stored: JSON.parse(localStorage.getItem('sports-genome-recent-exercises-v1') || '[]') }));
await p.locator('input[aria-label="Search exercises"]').fill('press'); await wait(p, 500);
const c2 = await p.evaluate(() => ({ count: document.querySelector('.catalog-discovery-heading > span')?.textContent, scope: !!document.querySelector('.local-search-scope'), recent: !!document.querySelector('.catalog-recent') }));
check('FIND-08 count copy', c0.count === '400 exercises' && c2.count?.endsWith('of 400 exercises'), { c0, c2 });
check('EXTRA-A recent row', !c0.recent && c1.recent[0] === opened && c1.stored.length === 1 && !c2.recent, { opened, c1, c2recent: c2.recent });
check('VIS-09 scope line only with a query', !c0.scope && c2.scope, { before: c0.scope, after: c2.scope });
await p.locator('input[aria-label="Search exercises"]').fill('romanain dedlift'); await wait(p, 600);
const c3 = await p.evaluate(() => ({ rows: document.querySelectorAll('.catalog-discovery-card').length, empty: document.querySelector('.catalog-discovery-empty')?.innerText.replace(/\n/g, ' | ').slice(0, 200), buttons: [...document.querySelectorAll('.catalog-discovery-empty button')].map((b) => b.textContent) }));
if (c3.rows === 0) { await p.locator('.catalog-discovery-empty button').first().dispatchEvent('click'); await wait(p, 500); }
const c3b = await p.evaluate(() => ({ query: document.querySelector('input[aria-label="Search exercises"]')?.value, rows: document.querySelectorAll('.catalog-discovery-card').length, first: document.querySelector('.catalog-discovery-identity strong')?.textContent }));
check('FIND-06 suggestions', (c3.rows > 0 && c3b.first?.includes('Romanian')) || (c3.rows === 0 && c3.buttons.some((b) => b.startsWith('Try')) && c3b.rows > 0), { c3, c3b });
await p.locator('input[aria-label="Search exercises"]').fill('zzzzqq'); await wait(p, 400);
await p.evaluate(() => { const d = document.querySelector('.catalog-discovery-controls'); d.open = true; const s = d.querySelector('select'); s.value = s.options[1].value; s.dispatchEvent(new Event('change', { bubbles: true })); }); await wait(p, 500);
const c4 = await p.evaluate(() => ({ rows: document.querySelectorAll('.catalog-discovery-card').length, buttons: [...document.querySelectorAll('.catalog-discovery-empty button')].map((b) => b.textContent), chips: document.querySelectorAll('.catalog-discovery-chips button').length }));
check('FIND-06 filter-specific action', c4.rows === 0 && c4.buttons.some((b) => b.startsWith('Remove the ')) && c4.buttons.includes('Clear search'), c4);
await p.locator('.catalog-discovery-empty button').filter({ hasText: 'Clear search' }).dispatchEvent('click'); await wait(p, 400);
await p.locator('.catalog-discovery-chips button').first().dispatchEvent('click').catch(() => {}); await wait(p, 400);
// Workout aids.
await dock(p, 'Train'); await tab(p, 'Workout'); await wait(p, 800); await p.locator('.session-prestart-start').dispatchEvent('click'); await wait(p, 800);
const w0 = await p.evaluate(() => ({ next: document.querySelector('.live-set-next')?.textContent, carried: document.querySelectorAll('.live-set-entry input[data-carried]').length, eyebrow: document.querySelector('.execution-head .metric-label')?.textContent }));
await p.locator('.live-set-entry input').first().fill('135'); await p.locator('.live-set-entry input').last().fill('5'); await p.locator('.live-set-commit').dispatchEvent('click'); await wait(p, 500);
const w1 = await p.evaluate(() => ({ carried: [...document.querySelectorAll('.live-set-entry input')].map((i) => ({ v: i.value, carried: i.hasAttribute('data-carried'), italic: getComputedStyle(i).fontStyle })), last: document.querySelector('.live-set-last')?.textContent, next: document.querySelector('.live-set-next')?.textContent }));
await p.locator('.live-set-entry input').first().fill('140'); await wait(p, 200);
const w2 = await p.evaluate(() => [...document.querySelectorAll('.live-set-entry input')].map((i) => ({ v: i.value, carried: i.hasAttribute('data-carried') })));
check('LIFT-01 next exercise cue', w0.next?.startsWith('Next · ') && w1.next?.startsWith('Next · '), { w0next: w0.next, w1next: w1.next });
check('LIFT-09 carried values marked', w0.carried === 0 && w1.carried.every((i) => i.carried && i.italic === 'italic') && w1.carried[0].v === '135' && !w2[0].carried && w2[1].carried, { w0, w1, w2 });
await p.locator('.live-session-finish').first().dispatchEvent('click'); await wait(p, 700);
const f0 = await p.evaluate(() => ({ toast: document.querySelector('[data-sonner-toast]')?.innerText.replace(/\n/g, ' | '), buttons: [...document.querySelectorAll('[data-sonner-toast] button')].map((b) => b.textContent) }));
await p.locator('[data-sonner-toast] button').filter({ hasText: 'View record' }).first().dispatchEvent('click'); await wait(p, 900);
const f1 = await p.evaluate(() => ({ search: location.search, label: document.querySelector('.progress-facts')?.getAttribute('aria-label') }));
check('LIFT-17/FLOW finish → record', f0.buttons.includes('View record') && f1.search === '?workspace=progress' && f1.label?.startsWith('1 workout recorded'), { f0, f1 });
// Reorder undo.
await dock(p, 'Train'); await tab(p, 'Plan'); await wait(p, 800);
const r0 = await p.evaluate(() => [...document.querySelectorAll('.custom-row-identity strong')].map((e) => e.textContent).slice(0, 2));
await p.locator('.day-order-controls button').nth(1).dispatchEvent('click'); await wait(p, 500);
const r1 = await p.evaluate(() => ({ order: [...document.querySelectorAll('.custom-row-identity strong')].map((e) => e.textContent).slice(0, 2), toast: document.querySelector('[data-sonner-toast]')?.innerText.replace(/\n/g, ' | '), undo: [...document.querySelectorAll('[data-sonner-toast] button')].map((b) => b.textContent) }));
await p.locator('[data-sonner-toast] button').filter({ hasText: 'Undo' }).first().dispatchEvent('click'); await wait(p, 500);
const r2 = await p.evaluate(() => [...document.querySelectorAll('.custom-row-identity strong')].map((e) => e.textContent).slice(0, 2));
check('INT-09 reorder undo', r1.order[0] === r0[1] && r1.order[1] === r0[0] && r1.undo.includes('Undo') && r2[0] === r0[0] && r2[1] === r0[1], { r0, r1, r2 });
// Region without a record → Log a lift for it.
await dock(p, 'Progress'); await tab(p, 'Strength'); await wait(p, 1200);
await p.getByText('View all 18 regions').first().dispatchEvent('click').catch(() => {}); await wait(p, 400);
const emptyRegion = p.locator('.region-grid-card').filter({ hasNotText: 'On record' }).first();
await emptyRegion.dispatchEvent('click'); await wait(p, 800);
const s0 = await p.evaluate(() => ({ sheet: document.querySelector('.strength-region-sheet')?.getAttribute('aria-label'), button: document.querySelector('.strength-region-record-empty button')?.textContent }));
await p.locator('.strength-region-record-empty button').first().dispatchEvent('click').catch(() => {}); await wait(p, 900);
const s1 = await p.evaluate(() => ({ sheet: !!document.querySelector('.strength-region-sheet'), logOpen: document.querySelector('.strength-log-entry')?.open, focused: document.activeElement?.getAttribute('aria-label') }));
check('FLOW region → log a lift', s0.button?.startsWith('Log a lift for') && !s1.sheet && s1.logOpen === true && s1.focused === 'Search and choose a catalog exercise', { s0, s1 });
// ⌘K shortcut and Escape.
await p.keyboard.press('Escape'); await wait(p, 300);
await dock(p, 'Home'); await wait(p, 600);
await p.keyboard.press('Control+k'); await wait(p, 500);
const k0 = await p.evaluate(() => ({ dialog: !!document.querySelector('[role="dialog"].universal-search, .universal-search-dialog, [role="dialog"]'), focused: document.activeElement?.tagName, title: document.querySelector('.universal-search-trigger')?.getAttribute('title') }));
await p.keyboard.press('Escape'); await wait(p, 400);
const k1 = await p.evaluate(() => ({ dialog: !!document.querySelector('[role="dialog"]'), focused: document.activeElement?.className }));
check('EXTRA-D shortcut', k0.dialog && k0.focused === 'INPUT' && !k1.dialog && k1.focused?.includes('universal-search-trigger') && k0.title?.includes('⌘K'), { k0, k1 });
check('errors', errs.length === 0, errs);
await browser.close();
console.log(`${results.filter((r) => r.pass).length}/${results.length} passed`);
