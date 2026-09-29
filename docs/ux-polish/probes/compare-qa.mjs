// 11B compare sheet, 11C day-wide rest, VIS-14 front/back tabs, the expiry notice (STATE-10), decimal loads (VIS-11).
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { boot } from './home.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const dock = (p, l) => p.locator('.mobile-bottom-nav button').filter({ hasText: l }).first().dispatchEvent('click');
const tab = (p, l) => p.locator('.workspace-top-switcher button').filter({ hasText: l }).first().dispatchEvent('click');
const wait = (p, ms = 700) => p.waitForTimeout(ms);
const results = []; const check = (id, pass, d) => { results.push(!!pass); console.log(`${id} ${pass ? 'PASS' : 'FAIL'} ${JSON.stringify(d)}`); };
const p = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
await boot(p, { draft: true });
// Compare
await dock(p, 'Body Lab'); await tab(p, 'Exercises'); await wait(p, 900);
await p.locator('.catalog-discovery-card-copy').nth(0).dispatchEvent('click'); await wait(p, 800);
const a = await p.evaluate(() => document.querySelector('#exercise-intelligence-title')?.textContent);
const b0 = await p.evaluate(() => document.querySelector('.exercise-intelligence-compare')?.textContent?.trim());
await p.locator('.exercise-intelligence-compare').dispatchEvent('click'); await wait(p, 500);
const b1 = await p.evaluate(() => ({ label: document.querySelector('.exercise-intelligence-compare')?.textContent?.trim(), toast: document.querySelector('[data-sonner-toast]')?.innerText.split('\n')[0] }));
await p.locator('.exercise-intelligence-close').dispatchEvent('click'); await wait(p, 700);
const pending = await p.evaluate(() => document.querySelector('.catalog-compare-pending')?.innerText.replace(/\n/g, ' '));
await p.locator('.catalog-discovery-card-copy').nth(3).dispatchEvent('click'); await wait(p, 800);
const b = await p.evaluate(() => document.querySelector('#exercise-intelligence-title')?.textContent);
const b2 = await p.evaluate(() => document.querySelector('.exercise-intelligence-compare')?.textContent?.trim());
await p.locator('.exercise-intelligence-compare').dispatchEvent('click'); await wait(p, 900);
const sheet = await p.evaluate(() => { const rows = [...document.querySelectorAll('.exercise-compare-rows > div')].map((d) => ({ label: d.querySelector('dt')?.textContent, a: d.querySelectorAll('dd')[0]?.textContent, b: d.querySelectorAll('dd')[1]?.textContent })); return { open: !!document.querySelector('.exercise-compare'), overlay: !!document.querySelector('.exercise-intelligence'), title: document.querySelector('#exercise-compare-title')?.textContent, rows: rows.length, sample: rows.slice(0, 2), numeric: rows.filter((r) => /\/ 100$/.test(r.a || '')).length, missing: rows.filter((r) => r.a === 'Not available' || r.b === 'Not available').length, focused: document.activeElement?.getAttribute('aria-label'), adds: [...document.querySelectorAll('.exercise-compare-actions button')].map((x) => x.getAttribute('aria-label')), scrollW: document.documentElement.scrollWidth, pending: !!document.querySelector('.catalog-compare-pending') }; });
check('EXTRA-B compare sheet', b0?.startsWith('Compare with another') && b1.label?.startsWith('Comparing this') && pending?.includes(a) && b2 === `Compare with ${a}` && sheet.open && !sheet.overlay && sheet.title?.includes(a) && sheet.title?.includes(b) && sheet.rows >= 15 && sheet.numeric === 8 && sheet.focused === 'Close comparison' && sheet.adds.length === 2 && sheet.scrollW === 390 && !sheet.pending, { a, b, b0, b1, pending, b2, sheet });
await p.locator('.exercise-compare-actions button').first().dispatchEvent('click'); await wait(p, 500);
const added = await p.evaluate(() => document.querySelector('[data-sonner-toast]')?.innerText.split('\n')[0]);
await p.keyboard.press('Escape'); await wait(p, 500);
const closed = await p.evaluate(() => ({ sheet: !!document.querySelector('.exercise-compare'), search: location.search, rows: document.querySelectorAll('.catalog-discovery-card').length }));
check('EXTRA-B add and close', added?.startsWith('Added to Week 1') && !closed.sheet && closed.search === '?workspace=catalog' && closed.rows > 0, { added, closed });
// Day-wide rest (11C)
await dock(p, 'Train'); await tab(p, 'Plan'); await wait(p, 900);
await p.evaluate(() => document.querySelector('.custom-prescription')?.setAttribute('open', ''));
const restBefore = await p.evaluate(() => [...document.querySelectorAll('.custom-row-identity em')].map((e) => e.textContent));
const r0 = await p.evaluate(() => !!document.querySelector('.custom-prescription[open] .prescription-rest-all'));
await p.evaluate(() => { const s = document.querySelector('.custom-prescription[open] select[aria-label$=" rest"]'); s.value = '120 sec'; s.dispatchEvent(new Event('change', { bubbles: true })); }); await wait(p, 400);
const r1 = await p.evaluate(() => document.querySelector('.custom-prescription[open] .prescription-rest-all')?.textContent);
await p.locator('.custom-prescription[open] .prescription-rest-all').first().dispatchEvent('click'); await wait(p, 600);
const r2 = await p.evaluate(() => ({ lines: [...document.querySelectorAll('.custom-row-identity em')].map((e) => e.textContent), toast: document.querySelector('[data-sonner-toast]')?.innerText.replace(/\n/g, ' | '), button: !!document.querySelector('.custom-prescription[open] .prescription-rest-all') }));
await p.locator('[data-sonner-toast] button').filter({ hasText: 'Undo' }).first().dispatchEvent('click'); await wait(p, 500);
const r3 = await p.evaluate(() => [...document.querySelectorAll('.custom-row-identity em')].map((e) => e.textContent));
await p.reload(); await wait(p, 2200); await dock(p, 'Train'); await tab(p, 'Plan'); await wait(p, 800);
const r4 = await p.evaluate(() => [...document.querySelectorAll('.custom-row-identity em')].map((e) => e.textContent));
check('EXTRA-C day-wide rest', !r0 && r1?.startsWith('Use 120 sec for the other ') && r2.lines.every((l) => l.includes('120 sec')) && r2.toast?.includes('Undo') && !r2.button && r3[0].includes('120 sec') && JSON.stringify(r3.slice(1)) === JSON.stringify(restBefore.slice(1)) && JSON.stringify(r4.slice(1)) === JSON.stringify(restBefore.slice(1)), { restBefore, r0, r1, r2, r3, r4 });
// VIS-14 front/back tabs on both surfaces
await dock(p, 'Body Lab'); await tab(p, 'Muscles'); await wait(p, 900);
const m = await p.evaluate(() => [...document.querySelectorAll('.atlas-side-tab')].map((b) => `${b.textContent}:${b.getAttribute('aria-pressed')}`));
await p.locator('.atlas-side-tab').nth(1).dispatchEvent('click'); await wait(p, 400);
const m2 = await p.evaluate(() => [...document.querySelectorAll('.atlas-side-tab')].map((b) => `${b.textContent}:${b.getAttribute('aria-pressed')}`));
await dock(p, 'Progress'); await tab(p, 'Strength'); await wait(p, 1200);
const s = await p.evaluate(() => [...document.querySelectorAll('.strength-body-side-toggle')].map((b) => `${b.textContent}:${b.getAttribute('aria-pressed')}:${getComputedStyle(b).borderBottomColor}`));
check('VIS-14 one front/back control', m.join() === 'Front:true,Back:false' && m2.join() === 'Front:false,Back:true' && s.length === 2 && s[0].startsWith('Front:true'), { m, m2, s });
// Decimal and three-digit loads (VIS-11)
await dock(p, 'Train'); await tab(p, 'Workout'); await wait(p, 800); await p.locator('.session-prestart-start').dispatchEvent('click'); await wait(p, 800);
await p.locator('.live-set-entry input').first().fill('137.5'); await p.locator('.live-set-entry input').last().fill('12'); await p.locator('.live-set-commit').dispatchEvent('click'); await wait(p, 500);
const v = await p.evaluate((H) => { const s = JSON.parse(localStorage.getItem(H) || '[]').find((x) => x.status === 'active'); const last = document.querySelector('.live-set-last'); const r = last?.getBoundingClientRect(); return { stored: s.exercises[0].sets[0].weight, last: last?.textContent, fits: r ? r.right <= innerWidth : null, scrollW: document.documentElement.scrollWidth }; }, 'sports-genome-device-workout-history-v1');
check('VIS-11 decimal load kept exactly', v.stored === '137.5' && v.last?.includes('137.5 lb × 12') && v.fits && v.scrollW === 390, v);
// STATE-10 expiry notice: auth.me is refused too, so no sign-in was ever seen and nothing has "expired"
await p.route('**/api/trpc/**', (route) => route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify(new URL(route.request().url()).pathname.replace('/api/trpc/', '').split(',').map(() => ({ error: { json: { message: 'Please login (10001)', code: -32001, data: { code: 'UNAUTHORIZED', httpStatus: 401 } } } }))) }));
await dock(p, 'Progress'); await tab(p, 'Progress'); await wait(p, 2500);
const e = await p.evaluate(() => ({ toasts: [...document.querySelectorAll('[data-sonner-toast]')].map((t) => t.innerText.split('\n')[0]), record: document.querySelector('.progress-facts')?.getAttribute('aria-label') }));
check('STATE-10 no expiry notice without a sign-in, record kept', e.toasts.filter((t) => t === 'Your sign-in has expired').length === 0 && e.record?.includes('workouts recorded'), e);
check('errors', errs.length === 0, errs);
await browser.close();
console.log(`${results.filter(Boolean).length}/${results.length} passed`);
