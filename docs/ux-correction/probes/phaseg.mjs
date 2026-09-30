// UX correction brief §16: journeys A–H against the built app at :4173, headless Chromium
// (browser emulation, not a physical phone). Prints one PASS/FAIL line per checklist item,
// writes the §18 evidence screenshots and a transition recording into docs/ux-correction/evidence.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { mkdirSync, writeFileSync, copyFileSync } from 'node:fs';
import { boot } from './home.mjs';

const evidence = '/home/user/Sports-genome/docs/ux-correction/evidence';
const scratch = '/tmp/claude-0/-home-user-Sports-genome/72e48dc4-5d2e-5f13-9687-9bbe2b3f83cf/scratchpad';
mkdirSync(evidence, { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

const dock = (p, l) => p.locator('.mobile-bottom-nav button').filter({ hasText: l }).first().dispatchEvent('click');
const tab = (p, l) => p.locator('.workspace-top-switcher button').filter({ hasText: l }).first().dispatchEvent('click');
const wait = (p, ms = 700) => p.waitForTimeout(ms);
const text = (p, sel) => p.evaluate((s) => document.querySelector(s)?.textContent?.trim() ?? null, sel);
const inner = (p, sel) => p.evaluate((s) => document.querySelector(s)?.innerText.replace(/\n/g, ' | ') ?? null, sel);
// Screens are captured once transient toasts have gone, unless the toast is the evidence.
const settle = (p) => p.waitForSelector('[data-sonner-toast]', { state: 'detached', timeout: 8000 }).catch(() => {});
const shot = async (p, name, { keepToasts = false } = {}) => { if (!keepToasts) await settle(p); await p.screenshot({ path: `${evidence}/${name}.png`, fullPage: false }); };
const page = (viewport = { width: 390, height: 844 }) => browser.newPage({ viewport, deviceScaleFactor: 1 });
const results = [];
const check = (id, pass, detail) => { results.push({ id, pass: Boolean(pass), detail }); console.log(`${id} ${pass ? 'PASS' : 'FAIL'} ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`); };
const dayTabs = (p) => p.evaluate(() => [...document.querySelectorAll('.training-plan-day')].map((b, i) => ({ i, text: b.innerText.replace(/\n/g, ' '), active: b.getAttribute('aria-selected') === 'true' })));
const HISTORY_KEY = 'sports-genome-device-workout-history-v1';
const LIFTS_KEY = 'sports-genome-device-strength-observations-v1';

// ── Journey A: a new visitor understands Home ──────────────────────────────────
{
  const p = await page(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await boot(p, { draft: true }); await dock(p, 'Home'); await wait(p, 900);
  const a = await p.evaluate(() => { const cta = document.querySelector('.today-action-cta'); const r = cta?.getBoundingClientRect(); return { label: document.querySelector('.home-head .metric-label')?.textContent, title: document.title, live: !!document.querySelector('.today-action-live'), strip: !!document.querySelector('.session-resume-bar'), heading: document.querySelector('.today-action-primary h2')?.textContent, cta: cta?.textContent.trim(), ctaBottom: r ? Math.round(r.bottom) : null, tabRows: document.querySelectorAll('.workspace-top-switcher').length, doors: [...document.querySelectorAll('.home-explore-row')].map((b) => b.innerText.replace(/\n/g, ' | ')) }; });
  check('J-A1', a.label === 'Home' && !a.live && !a.strip && a.title.startsWith('Home'), { label: a.label, title: a.title, live: a.live, strip: a.strip });
  check('J-A2', a.cta && a.ctaBottom < 844 && a.tabRows === 0, { heading: a.heading, cta: a.cta, ctaBottom: a.ctaBottom });
  await shot(p, 'home-ordinary');
  const titles = [];
  for (const [id, label, ws, h1] of [['J-A3', 'Find exercises', 'catalog', 'Exercise catalog'], ['J-A4', 'Explore muscles', 'movement', 'Movement explorer'], ['J-A5', 'View strength progress', 'strength', 'Strength Genome']]) {
    await dock(p, 'Home'); await wait(p, 600);
    await p.locator('.home-explore-row').filter({ hasText: label }).dispatchEvent('click'); await wait(p, 1000);
    const landed = await p.evaluate(() => ({ search: location.search, h1: document.querySelector('main h1')?.textContent?.trim(), title: document.title, scrollY: window.scrollY, tab: document.querySelector('.workspace-top-switcher [aria-current="page"]')?.textContent?.trim() }));
    titles.push(landed);
    check(id, landed.search === `?workspace=${ws}` && landed.h1 === h1 && landed.scrollY === 0, { door: a.doors.find((d) => d.includes(label)), landed });
  }
  check('J-A6', titles.every((t) => t.title.includes(t.h1)), titles.map((t) => `${t.h1} · title "${t.title}" · tab ${t.tab}`));
  check('J-A errors', errs.length === 0, errs.length ? errs : 'none');
  await p.close();
}

// ── Journey B: resume while editing a different day ─────────────────────────────
{
  const p = await page(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await boot(p, { draft: true });
  await dock(p, 'Train'); await tab(p, 'Workout'); await wait(p, 800);
  await p.locator('.session-prestart-start').dispatchEvent('click'); await wait(p, 800);
  await p.locator('.live-set-commit').dispatchEvent('click'); await wait(p, 500);
  const live = await p.evaluate(() => ({ day: document.querySelector('.execution-head .metric-label')?.textContent, exercise: document.querySelector('.live-set-card h4')?.textContent, set: document.querySelector('.live-set-prescription span')?.textContent, strip: !!document.querySelector('.session-resume-bar') }));
  check('J-B1', live.exercise && /^Set 2 of/.test(live.set || ''), live);
  await tab(p, 'Plan'); await wait(p, 800);
  const days = await dayTabs(p); const other = days.find((d) => !d.active);
  await p.locator('.training-plan-day').nth(other.i).dispatchEvent('click'); await wait(p, 800);
  if ((await p.locator('.custom-prescription').count()) === 0) { // an empty day: draft it so there is a prescription to change
    await p.locator('.day-plan-draft > summary').first().dispatchEvent('click').catch(() => {}); await wait(p, 400);
    await p.locator('.day-plan-draft button').filter({ hasText: /Draft this (session|workout)/i }).first().dispatchEvent('click').catch(() => {}); await wait(p, 1200);
  }
  const editing = await inner(p, '.day-editing-context');
  const editingDay = (editing || '').split(' | ')[0];
  check('J-B2', editing?.startsWith('Editing'), { chose: other.text, editing });
  check('J-B3', editing?.includes('Editing') && editing?.includes('workout in progress') && editing?.includes('Resume') && !editingDay.includes((live.day || '').split(' · ').pop()), { editingDay, liveDay: live.day });
  await p.evaluate(() => document.querySelector('.custom-prescription')?.setAttribute('open', ''));
  const name = await text(p, '.custom-row-identity strong');
  const before = await text(p, '.custom-row-identity em');
  await p.locator(`button[aria-label="One more set of ${name}"]`).first().dispatchEvent('click'); await wait(p, 500);
  const after = await text(p, '.custom-row-identity em');
  await p.reload(); await wait(p, 2200);
  await dock(p, 'Train'); await tab(p, 'Plan'); await wait(p, 900);
  await p.locator('.training-plan-day').nth(other.i).dispatchEvent('click'); await wait(p, 700);
  const persisted = await text(p, '.custom-row-identity em');
  check('J-B4', before !== after && persisted === after, { name, before, after, persisted });
  await p.evaluate(() => window.scrollTo(0, 0)); await wait(p, 300);
  await shot(p, 'plan-with-active-workout');
  await p.locator('.session-resume-bar').dispatchEvent('click'); await wait(p, 900);
  const resumed = await p.evaluate(() => ({ search: location.search, day: document.querySelector('.execution-head .metric-label')?.textContent, exercise: document.querySelector('.live-set-card h4')?.textContent, set: document.querySelector('.live-set-prescription span')?.textContent, strip: !!document.querySelector('.session-resume-bar'), resumeControls: [...document.querySelectorAll('button')].filter((b) => /resume/i.test(b.textContent)).length }));
  check('J-B5', resumed.day === live.day && resumed.exercise === live.exercise && resumed.set === live.set, resumed);
  check('J-B6', !resumed.strip && resumed.resumeControls === 0, { strip: resumed.strip, resumeControls: resumed.resumeControls });
  await dock(p, 'Home'); await wait(p, 900);
  const home = await p.evaluate(() => ({ label: document.querySelector('.today-action-primary .metric-label')?.textContent, heading: document.querySelector('.today-action-primary h2')?.textContent, cta: document.querySelector('.today-action-cta')?.textContent.trim(), strip: !!document.querySelector('.session-resume-bar'), visibleResumeControls: [...document.querySelectorAll('button')].filter((b) => /resume/i.test(b.textContent) && b.getBoundingClientRect().top < innerHeight && b.getBoundingClientRect().height > 0).length }));
  check('J-B7', home.label === 'Continue your workout' && home.heading === (live.day || '').split(' · ').pop() && home.cta === `Resume ${home.heading} workout` && !home.strip && home.visibleResumeControls === 1, home);
  await shot(p, 'home-active-workout');
  check('J-B errors', errs.length === 0, errs.length ? errs : 'none');
  await p.close();
}

// ── Journey C: add an exercise with a known destination ────────────────────────
{
  const p = await page(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await boot(p, { draft: true });
  await dock(p, 'Train'); await tab(p, 'Plan'); await wait(p, 800);
  await p.locator('.training-plan-day').nth(1).dispatchEvent('click'); await wait(p, 700);
  const day1 = (await dayTabs(p))[1].text; const rows1 = await p.locator('.custom-prescription').count();
  await dock(p, 'Body Lab'); await tab(p, 'Exercises'); await wait(p, 900);
  const strip = await p.evaluate(() => { const r = document.querySelector('.add-destination')?.getBoundingClientRect(); return { summary: document.querySelector('.add-destination > summary')?.innerText.replace(/\n/g, ' '), visible: !!r && r.top < innerHeight && r.bottom > 0, plus: document.querySelector('.catalog-discovery-actions button:last-child')?.getAttribute('aria-label') }; });
  const dayName = (t) => t.replace(/\s+(—|\d+)$/, '').trim();
  const day1Name = dayName(day1);
  check('J-C1', strip.visible && strip.summary?.includes(day1Name), { day1, strip });
  check('J-C2', strip.plus?.startsWith('Add ') && strip.plus?.includes(`· ${day1Name}`), strip.plus);
  await shot(p, 'catalog-before-add');
  // C3: query, scroll and filters survive the overlay.
  await p.locator('input[aria-label="Search exercises"]').fill('press'); await wait(p, 600);
  const listBefore = await p.evaluate(() => ({ count: document.querySelectorAll('.catalog-discovery-card').length, chips: [...document.querySelectorAll('.catalog-discovery-chips button')].map((b) => b.textContent) }));
  await p.evaluate(() => window.scrollTo(0, 420)); await wait(p, 300);
  const scrollBefore = await p.evaluate(() => window.scrollY);
  await p.locator('.catalog-discovery-card-copy').nth(2).dispatchEvent('click'); await wait(p, 900);
  const overlayName = await text(p, '#exercise-intelligence-title');
  await p.locator('.exercise-intelligence-disclosure > summary').dispatchEvent('click'); await wait(p, 300);
  const disclosureOpen = await p.evaluate(() => document.querySelector('.exercise-intelligence-disclosure')?.open);
  await p.locator('.exercise-intelligence-close').dispatchEvent('click'); await wait(p, 700);
  const afterClose = await p.evaluate(() => ({ overlay: !!document.querySelector('.exercise-intelligence'), query: document.querySelector('input[aria-label="Search exercises"]')?.value, count: document.querySelectorAll('.catalog-discovery-card').length, chips: [...document.querySelectorAll('.catalog-discovery-chips button')].map((b) => b.textContent), scrollY: window.scrollY, search: location.search }));
  check('J-C3', !afterClose.overlay && afterClose.query === 'press' && afterClose.count === listBefore.count && Math.abs(afterClose.scrollY - scrollBefore) < 5 && afterClose.search === '?workspace=catalog' && JSON.stringify(afterClose.chips) === JSON.stringify(listBefore.chips), { overlayName, disclosureOpen, scrollBefore, listBefore, afterClose });
  // C4/C5: add the first result, follow the toast.
  await p.evaluate(() => window.scrollTo(0, 0)); await wait(p, 200);
  const plusLabel = await p.evaluate(() => document.querySelector('.catalog-discovery-actions button:last-child')?.getAttribute('aria-label'));
  await p.locator('.catalog-discovery-actions button:last-child').first().dispatchEvent('click'); await wait(p, 600);
  const toast = await p.evaluate(() => ({ text: document.querySelector('[data-sonner-toast]')?.innerText.replace(/\n/g, ' | '), buttons: [...document.querySelectorAll('[data-sonner-toast] button')].map((b) => b.textContent) }));
  check('J-C4', toast.text?.startsWith(`Added to Week 1 · ${day1Name}`) && toast.buttons.includes('View workout') && toast.buttons.includes('Undo'), { plusLabel, toast });
  await shot(p, 'catalog-add-feedback', { keepToasts: true });
  await p.locator('[data-sonner-toast] button').filter({ hasText: 'View workout' }).first().dispatchEvent('click'); await wait(p, 900);
  const added = plusLabel.replace(/^Add /, '').replace(/ to Week.*$/, '');
  const view = await p.evaluate(() => ({ search: location.search, active: [...document.querySelectorAll('.training-plan-day')].find((b) => b.getAttribute('aria-selected') === 'true')?.innerText.replace(/\n/g, ' '), rows: document.querySelectorAll('.custom-prescription').length, names: [...document.querySelectorAll('.custom-row-identity strong')].map((e) => e.textContent), days: [...document.querySelectorAll('.training-plan-day')].map((b) => b.innerText.replace(/\n/g, ' ')) }));
  check('J-C5', view.search === '?workspace=day-plan' && dayName(view.active || '') === day1Name && view.rows === rows1 + 1 && view.names.includes(added), { added, rows1, view: { ...view, names: view.names.length } });
  // C6: a changed destination gets the addition, the earlier day does not.
  await dock(p, 'Body Lab'); await tab(p, 'Exercises'); await wait(p, 900);
  await p.locator('.add-destination > summary').dispatchEvent('click'); await wait(p, 300);
  const options = await p.evaluate(() => [...document.querySelectorAll('.add-destination-options button')].map((b) => b.innerText.replace(/\n/g, ' ')));
  await p.locator('.add-destination-options button').nth(2).dispatchEvent('click'); await wait(p, 500);
  const strip2 = await inner(p, '.add-destination > summary');
  const plus2 = await p.evaluate(() => document.querySelector('.catalog-discovery-actions button:last-child')?.getAttribute('aria-label'));
  await p.locator('.catalog-discovery-actions button:last-child').first().dispatchEvent('click'); await wait(p, 600);
  const toast2 = await p.evaluate(() => [...document.querySelectorAll('[data-sonner-toast]')].map((t) => t.innerText.split('\n')[0]));
  await p.locator('[data-sonner-toast] button').filter({ hasText: 'View workout' }).first().dispatchEvent('click'); await wait(p, 900);
  const view2 = await p.evaluate(() => ({ active: [...document.querySelectorAll('.training-plan-day')].find((b) => b.getAttribute('aria-selected') === 'true')?.innerText.replace(/\n/g, ' '), rows: document.querySelectorAll('.custom-prescription').length, days: [...document.querySelectorAll('.training-plan-day')].map((b) => b.innerText.replace(/\n/g, ' ')) }));
  const day3Name = (strip2 || '').split(' · ').pop()?.split(' | ')[0]?.trim();
  check('J-C6', plus2 !== plusLabel && plus2?.includes(day3Name) && toast2[0]?.startsWith(`Added to Week 1 · ${day3Name}`) && dayName(view2.active || '') !== day1Name && view2.active?.includes(day3Name) && view2.days[1] === view.days[1] && view2.days[2] !== view.days[2], { options, strip2, plus2, toast2, before: view.days, after: view2.days, active: view2.active });
  // C7: two taps in one tick add once.
  await dock(p, 'Body Lab'); await tab(p, 'Exercises'); await wait(p, 900);
  const label7 = await p.evaluate(() => { const b = document.querySelectorAll('.catalog-discovery-actions button:last-child')[1]; const l = b.getAttribute('aria-label'); b.click(); b.click(); return l; }); await wait(p, 700);
  const toasts7 = await p.evaluate(() => [...document.querySelectorAll('[data-sonner-toast]')].map((t) => t.innerText.split('\n')[0]));
  const name7 = label7.replace(/^Add /, '').replace(/ to Week.*$/, '');
  await p.locator('[data-sonner-toast] button').filter({ hasText: 'View workout' }).first().dispatchEvent('click'); await wait(p, 900);
  const occurrences = await p.evaluate((n) => [...document.querySelectorAll('.custom-row-identity strong')].filter((e) => e.textContent === n).length, name7);
  check('J-C7', occurrences === 1, { name7, toasts7, occurrences });
  // C8: favorite neither adds nor opens.
  await dock(p, 'Body Lab'); await tab(p, 'Exercises'); await wait(p, 900);
  const fav = await p.evaluate(() => { const b = document.querySelector('.catalog-discovery-actions button:first-child'); return { label: b?.getAttribute('aria-label'), pressed: b?.getAttribute('aria-pressed'), toasts: [...document.querySelectorAll('[data-sonner-toast]')].map((t) => t.innerText.split('\n')[0]), rows: document.querySelectorAll('.catalog-discovery-card').length }; });
  await p.locator('.catalog-discovery-actions button:first-child').first().dispatchEvent('click'); await wait(p, 500);
  const fav2 = await p.evaluate(() => { const b = document.querySelector('.catalog-discovery-actions button:first-child'); return { label: b?.getAttribute('aria-label'), pressed: b?.getAttribute('aria-pressed'), overlay: !!document.querySelector('.exercise-intelligence'), toasts: [...document.querySelectorAll('[data-sonner-toast]')].map((t) => t.innerText.split('\n')[0]), favoritesFilter: document.querySelector('.catalog-favorites-filter')?.innerText.replace(/\n/g, ' '), rows: document.querySelectorAll('.catalog-discovery-card').length }; });
  const newToasts = fav2.toasts.filter((t) => !fav.toasts.includes(t));
  check('J-C8', fav.label?.startsWith('Save ') && fav2.label?.startsWith('Remove ') && fav2.pressed === 'true' && !fav2.overlay && !newToasts.some((t) => t.startsWith('Added')) && newToasts.includes('Saved to favorites') && fav2.rows === fav.rows, { before: fav, after: fav2, newToasts });
  check('J-C errors', errs.length === 0, errs.length ? errs : 'none');
  await p.close();
}

// ── Journey D: record consistency ──────────────────────────────────────────────
{
  const p = await page(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await boot(p, { draft: true });
  await p.evaluate(([H, L]) => {
    const now = Date.now(); const day = 86400e3;
    localStorage.setItem(L, JSON.stringify([
      { id: 'd1', exerciseName: 'Barbell Bench Press', observedAt: new Date(now - day * 2).toISOString(), measurementType: 'MEASURED_1RM', loadKg: 100, bodyMassKgAtTest: 82, dataQuality: 'SELF_REPORTED', laterality: 'BILATERAL' },
      { id: 'd2', exerciseName: 'Back Squat', observedAt: new Date(now - day * 9).toISOString(), measurementType: 'MULTI_REP', loadKg: 120, repetitions: 5, bodyMassKgAtTest: 82, dataQuality: 'SELF_REPORTED', laterality: 'BILATERAL' },
      { id: 'd3', exerciseName: 'Lat Pulldown', observedAt: new Date(now - day * 12).toISOString(), measurementType: 'MULTI_REP', loadKg: 70, repetitions: 8, bodyMassKgAtTest: 82, dataQuality: 'SELF_REPORTED', laterality: 'BILATERAL' },
    ]));
    const sets = (w) => [1, 2, 3].map(() => ({ weight: w, reps: '5', completed: true }));
    localStorage.setItem(H, JSON.stringify([{ id: 'w1', title: 'Push', dayLabel: 'Week 1 · Day 01 · Push', startedAt: new Date(now - day * 3).toISOString(), completedAt: new Date(now - day * 3 + 3600e3).toISOString(), status: 'completed', exercises: [{ id: 'w1-0', exerciseName: 'Barbell Bench Press', plannedPrescription: '3 × 5', sets: sets('185') }, { id: 'w1-1', exerciseName: 'Overhead Press', plannedPrescription: '3 × 5', sets: sets('95') }] }]));
  }, [HISTORY_KEY, LIFTS_KEY]);
  // Reload onto Home and watch what the record line says from first paint.
  await p.goto('http://localhost:4173/?workspace=command', { waitUntil: 'commit' });
  const samples = await p.evaluate(() => new Promise((resolve) => { const seen = []; const start = performance.now(); const tick = () => { const v = document.querySelector('.home-week-record')?.textContent ?? null; if (seen.length === 0 || seen[seen.length - 1].v !== v) seen.push({ t: Math.round(performance.now() - start), v }); if (performance.now() - start < 2500) setTimeout(tick, 40); else resolve(seen); }; tick(); }));
  const distinct = samples.map((s) => s.v).filter(Boolean);
  const expected = '5 lifts logged · 1 workout recorded';
  check('J-D1', distinct[distinct.length - 1]?.startsWith(expected), { samples });
  const homeLine = await text(p, '.home-week-record');
  await dock(p, 'Progress'); await tab(p, 'Progress'); await wait(p, 1000);
  const progress = await p.evaluate(() => ({ label: document.querySelector('.progress-facts')?.getAttribute('aria-label'), facts: [...document.querySelectorAll('.progress-facts > *')].map((e) => e.innerText.replace(/\n/g, ' ')) }));
  await tab(p, 'Strength'); await wait(p, 1200);
  const strength = await inner(p, '.strength-profile-metrics');
  check('J-D2', homeLine?.startsWith(expected) && progress.label === '1 workout recorded, 5 lifts logged' && strength?.includes('5 lifts recorded'), { homeLine, progress, strength });
  const firstLift = await p.evaluate(() => document.body.innerText.toLowerCase().includes('first lift'));
  await dock(p, 'Home'); await wait(p, 700);
  const firstLiftHome = await p.evaluate(() => document.body.innerText.toLowerCase().includes('first lift'));
  check('J-D3', !firstLift && !firstLiftHome, { strength: firstLift, home: firstLiftHome });
  await dock(p, 'Progress'); await tab(p, 'Strength'); await wait(p, 1000);
  await p.locator('.strength-log-open').dispatchEvent('click'); await wait(p, 400);
  await p.locator('input[aria-label="Search and choose a catalog exercise"]').fill('deadlift'); await wait(p, 400);
  await p.locator('.strength-exercise-picker button').first().dispatchEvent('click'); await wait(p, 400);
  await p.locator('input[aria-label="Load in pounds"]').fill('315'); await wait(p, 300);
  await p.locator('.strength-log-submit button').dispatchEvent('click'); await wait(p, 900);
  const strength2 = await inner(p, '.strength-profile-metrics');
  await p.locator('.strength-recent-lifts > summary').dispatchEvent('click'); await wait(p, 300);
  const history = await p.evaluate(() => [...document.querySelectorAll('.strength-recent-rows > div')].map((e) => e.innerText.split('\n')[0]));
  await tab(p, 'Progress'); await wait(p, 800);
  const progress2 = await p.evaluate(() => document.querySelector('.progress-facts')?.getAttribute('aria-label'));
  await dock(p, 'Home'); await wait(p, 800);
  const home2 = await text(p, '.home-week-record');
  check('J-D4', strength2?.includes('6 lifts recorded') && progress2 === '1 workout recorded, 6 lifts logged' && home2?.startsWith('6 lifts logged · 1 workout recorded') && history[0]?.includes('Deadlift'), { strength2, progress2, home2, history });
  await p.reload(); await wait(p, 2000);
  const home3 = await text(p, '.home-week-record');
  await dock(p, 'Progress'); await tab(p, 'Strength'); await wait(p, 1200);
  const strength3 = await inner(p, '.strength-profile-metrics');
  check('J-D5', home3 === home2 && strength3?.includes('6 lifts recorded'), { home3, strength3 });
  await shot(p, 'strength');
  await tab(p, 'Progress'); await wait(p, 800); await shot(p, 'progress');
  // Zero record, watched from first paint.
  const z = await page(); await boot(z, { draft: false });
  await z.goto('http://localhost:4173/?workspace=command', { waitUntil: 'commit' });
  const zero = await z.evaluate(() => new Promise((resolve) => { const seen = []; const start = performance.now(); const tick = () => { const v = document.querySelector('.home-week-record')?.textContent ?? null; if (seen.length === 0 || seen[seen.length - 1].v !== v) seen.push({ t: Math.round(performance.now() - start), v }); if (performance.now() - start < 2500) setTimeout(tick, 40); else resolve(seen); }; tick(); }));
  const zeroValues = zero.map((s) => s.v).filter(Boolean);
  const zeroFirstLift = await z.evaluate(() => document.body.innerText.toLowerCase().includes('first lift'));
  check('J-D6', distinct.length === 1 && zeroValues.length === 1 && zeroValues[0].startsWith('0 lifts logged · 0 workouts recorded') && !zeroFirstLift, { fixtureSamples: distinct, zeroSamples: zeroValues, zeroFirstLift });
  await z.close();
  check('J-D errors', errs.length === 0, errs.length ? errs : 'none');
  await p.close();
}

// ── Journey E: movement → muscle → exercise ─────────────────────────────────────
{
  const p = await page(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await boot(p, { draft: false });
  await dock(p, 'Body Lab'); await tab(p, 'Movements'); await wait(p, 900);
  await p.locator('.atlas-action-item').nth(1).dispatchEvent('click'); await wait(p, 700);
  const chosen = await p.evaluate(() => ({ selected: document.querySelector('.atlas-selected')?.innerText.split('\n').filter(Boolean).slice(0, 2), sport: document.querySelector('.atlas-sport-select')?.value }));
  const actionLabel = chosen.selected?.find((line) => line.length > 3 && !/^[A-Z ]+$/.test(line)) || chosen.selected?.[0];
  check('J-E1', !!actionLabel, chosen);
  await p.getByText('Explore involved muscles').first().dispatchEvent('click'); await wait(p, 900);
  const muscles = await p.evaluate(() => ({ search: location.search, context: document.querySelector('.body-lab-selection-context')?.innerText.replace(/\n/g, ' '), h1: document.querySelector('main h1')?.textContent, scrollY: window.scrollY }));
  const same = (a, b) => (a || '').toLowerCase().includes((b || '').toLowerCase()); // the atlas renders its label in capitals
  check('J-E2', muscles.search === '?workspace=body' && same(muscles.context, actionLabel) && muscles.scrollY === 0, { actionLabel, muscles });
  await p.locator('.atlas-role-row').first().dispatchEvent('click'); await wait(p, 600);
  const picked = await p.evaluate(() => ({ part: document.querySelector('.atlas-selected-part')?.textContent?.trim(), next: document.querySelector('.body-lab-next-step button')?.textContent?.trim() }));
  await p.locator('.body-lab-next-step button').dispatchEvent('click'); await wait(p, 900);
  const cat = await p.evaluate(() => ({ search: location.search, chips: [...document.querySelectorAll('.catalog-discovery-chips button')].map((b) => b.getAttribute('aria-label')), count: document.querySelectorAll('.catalog-discovery-card').length, scrollY: window.scrollY }));
  check('J-E3', cat.search === '?workspace=catalog' && picked.next?.startsWith('Find ') && cat.chips.length > 0, { picked, cat });
  await p.locator('.catalog-discovery-chips button').first().dispatchEvent('click'); await wait(p, 600);
  const cat2 = await p.evaluate(() => ({ chips: [...document.querySelectorAll('.catalog-discovery-chips button')].map((b) => b.getAttribute('aria-label')), count: document.querySelectorAll('.catalog-discovery-card').length }));
  check('J-E4', cat.chips.some((c) => c?.startsWith('Remove filter')) && cat2.chips.length < cat.chips.length && cat2.count >= cat.count, { before: cat, after: cat2 });
  await p.goBack(); await wait(p, 900);
  const back1 = await p.evaluate(() => ({ search: location.search, part: document.querySelector('.atlas-selected-part')?.textContent?.trim(), context: document.querySelector('.body-lab-selection-context')?.innerText.replace(/\n/g, ' '), scrollY: window.scrollY }));
  await p.goBack(); await wait(p, 900);
  const back2 = await p.evaluate(() => ({ search: location.search, selected: document.querySelector('.atlas-selected')?.innerText.split('\n').filter(Boolean).slice(0, 2), scrollY: window.scrollY }));
  check('J-E5', back1.search === '?workspace=body' && back1.part === picked.part && same(back1.context, actionLabel) && back1.scrollY === 0 && back2.search === '?workspace=movement' && back2.selected?.includes(actionLabel) && back2.scrollY === 0, { picked, back1, back2 });
  check('J-E errors', errs.length === 0, errs.length ? errs : 'none');
  await p.close();
}

// ── Journey F: active workout layout and persistence ───────────────────────────
{
  const p = await page(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await boot(p, { draft: true });
  await dock(p, 'Train'); await tab(p, 'Workout'); await wait(p, 800);
  await p.locator('.session-prestart-start').dispatchEvent('click'); await wait(p, 800);
  const layout = (via) => p.evaluate((via) => {
    const main = document.querySelector('main'); const card = document.querySelector('.live-set-card');
    const limit = Math.min(innerHeight, main.getBoundingClientRect().bottom);
    // Painted leaves: text, fields, or anything with its own fill (the progress track). The
    // measure starts under the fixed chrome, where the page's own content begins.
    const rects = [];
    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT); let node;
    while ((node = walker.nextNode())) { if (!node.textContent.trim()) continue; const range = document.createRange(); range.selectNodeContents(node); for (const r of range.getClientRects()) if (r.height > 0) rects.push(r); }
    for (const e of main.querySelectorAll('input, svg, [class*="progress-track"]')) { const r = e.getBoundingClientRect(); if (r.height > 0) rects.push(r); }
    for (const e of main.querySelectorAll('*')) { if (e.children.length === 0 && getComputedStyle(e).backgroundColor !== 'rgba(0, 0, 0, 0)') { const r = e.getBoundingClientRect(); if (r.height > 0) rects.push(r); } }
    const spans = rects.map((r) => [Math.max(r.top, 0), Math.min(r.bottom, limit)]).filter(([a, b]) => b > a).sort((a, b) => a[0] - b[0]);
    const chrome = document.querySelector('.workspace-top-switcher')?.getBoundingClientRect().bottom ?? 0;
    let cursor = Math.max(main.getBoundingClientRect().top, chrome); let maxGap = 0; let gapAt = null; for (const [a, b] of spans) { if (a - cursor > maxGap) { maxGap = a - cursor; gapAt = [Math.round(cursor), Math.round(a)]; } if (b > cursor) cursor = b; } if (limit - cursor > maxGap) { maxGap = limit - cursor; gapAt = [Math.round(cursor), Math.round(limit)]; }
    return { via, search: location.search, card: !!card, cardTop: card ? Math.round(card.getBoundingClientRect().top) : null, inView: !!card && card.getBoundingClientRect().top < innerHeight - 100, maxBlankGap: Math.round(maxGap), gapAt, set: document.querySelector('.live-set-prescription span')?.textContent, exercise: document.querySelector('.live-set-card h4')?.textContent };
  }, via);
  const entries = [];
  await p.goto('http://localhost:4173/?workspace=tracker'); await wait(p, 2200); entries.push(await layout('direct URL'));
  await tab(p, 'Plan'); await wait(p, 600); await p.evaluate(() => window.scrollTo(0, 500)); await wait(p, 300); await tab(p, 'Workout'); await wait(p, 900); entries.push(await layout('tab'));
  await dock(p, 'Home'); await wait(p, 800); await p.locator('.today-action-cta').dispatchEvent('click'); await wait(p, 900); entries.push(await layout('Home resume'));
  await dock(p, 'Progress'); await wait(p, 800); await p.locator('.session-resume-bar').dispatchEvent('click'); await wait(p, 900); entries.push(await layout('strip'));
  check('J-F1', entries.every((e) => e.search === '?workspace=tracker' && e.card), entries.map((e) => `${e.via}: ${e.search} card ${e.card}`));
  check('J-F2', entries.every((e) => e.inView && e.maxBlankGap < 120), entries.map((e) => `${e.via}: cardTop ${e.cardTop}, largest unpainted run ${e.maxBlankGap}px at ${JSON.stringify(e.gapAt)}`));
  // F3: a logged set is visible feedback and a stored record.
  const inputs = p.locator('.live-set-entry input');
  await inputs.first().fill('135'); await inputs.last().fill('5'); await wait(p, 200);
  await shot(p, 'workout-active');
  await p.locator('.live-set-commit').dispatchEvent('click'); await wait(p, 600);
  const f3 = await p.evaluate((H) => { const s = JSON.parse(localStorage.getItem(H) || '[]').find((x) => x.status === 'active'); return { complete: document.querySelectorAll('.session-set-complete').length, set: document.querySelector('.live-set-prescription span')?.textContent, restState: document.querySelector('.live-rest-state')?.textContent, clock: document.querySelector('.live-rest-clock')?.textContent, stored: s ? { weight: s.exercises[0].sets[0].weight, reps: s.exercises[0].sets[0].reps, completed: s.exercises[0].sets[0].completed } : null }; }, HISTORY_KEY);
  await wait(p, 1300);
  const clock2 = await text(p, '.live-rest-clock');
  check('J-F3', f3.complete === 1 && /^Set 2 of/.test(f3.set || '') && f3.restState === 'Resting' && f3.stored?.completed === true && f3.stored.weight === '135' && f3.stored.reps === '5' && clock2 !== f3.clock, { ...f3, clockLater: clock2 });
  // F4: away and back keeps the set and the rest.
  await dock(p, 'Home'); await wait(p, 1500);
  await p.locator('.today-action-cta').dispatchEvent('click'); await wait(p, 900);
  const f4 = await p.evaluate(() => ({ set: document.querySelector('.live-set-prescription span')?.textContent, restState: document.querySelector('.live-rest-state')?.textContent, clock: document.querySelector('.live-rest-clock')?.textContent, complete: document.querySelectorAll('.session-set-complete').length, exercise: document.querySelector('.live-set-card h4')?.textContent }));
  check('J-F4', f4.set === f3.set && f4.complete === 1 && ['Resting', 'Rest complete'].includes(f4.restState || '') && f4.exercise === entries[0].exercise, f4);
  // F5: finishing early keeps the one logged set as one record.
  await p.locator('.live-session-finish').first().dispatchEvent('click'); await wait(p, 900);
  const f5 = await p.evaluate((H) => { const all = JSON.parse(localStorage.getItem(H) || '[]'); return { sessions: all.length, completed: all.filter((s) => s.status === 'completed').length, active: all.filter((s) => s.status === 'active').length, loggedSets: all[0]?.exercises.flatMap((e) => e.sets).filter((s) => s.completed).length, prestart: !!document.querySelector('.session-prestart'), live: !!document.querySelector('.live-set-card'), strip: !!document.querySelector('.session-resume-bar') }; }, HISTORY_KEY);
  await dock(p, 'Progress'); await tab(p, 'Progress'); await wait(p, 1000);
  const progressF = await p.evaluate(() => document.querySelector('.progress-facts')?.getAttribute('aria-label'));
  await dock(p, 'Home'); await wait(p, 800);
  const homeF = await text(p, '.home-week-record');
  check('J-F5', f5.sessions === 1 && f5.completed === 1 && f5.active === 0 && f5.loggedSets === 1 && f5.prestart && !f5.live && !f5.strip && progressF === '1 workout recorded, 1 lift logged' && homeF?.startsWith('1 lift logged · 1 workout recorded'), { ...f5, progressF, homeF });
  check('J-F errors', errs.length === 0, errs.length ? errs : 'none');
  await p.close();
}

// ── Journey G: settings and recovery ───────────────────────────────────────────
{
  const p = await page(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await boot(p, { draft: true });
  await dock(p, 'Train'); await tab(p, 'Plan'); await wait(p, 700);
  await p.locator('.training-plan-day').nth(4).dispatchEvent('click'); await wait(p, 500);
  const planDay = (await dayTabs(p)).find((d) => d.active)?.text;
  await p.locator('.topbar-profile-button').dispatchEvent('click'); await wait(p, 900);
  const g1 = await p.evaluate(() => ({ search: location.search, h1: document.querySelector('main h1')?.textContent, title: document.title, profileCurrent: document.querySelector('.topbar-profile-button')?.getAttribute('aria-current'), dockActive: [...document.querySelectorAll('.mobile-bottom-nav button')].filter((b) => b.getAttribute('aria-current') === 'page').map((b) => b.textContent.trim()), tabRows: document.querySelectorAll('.workspace-top-switcher').length, strip: !!document.querySelector('.session-resume-bar') }));
  check('J-G1', g1.search === '?workspace=profile' && g1.profileCurrent === 'page' && g1.tabRows === 0 && g1.h1 === 'About me', g1);
  // Session time is reversible and does not reshape the plan's days (days per week would).
  const minutesBefore = await p.evaluate(() => document.querySelector('input[name="about-me-session-minutes"]:checked')?.value);
  await p.evaluate(() => document.querySelector('input[name="about-me-session-minutes"][value="45"]')?.click()); await wait(p, 500);
  const g2 = await p.evaluate(() => ({ checked: document.querySelector('input[name="about-me-session-minutes"]:checked')?.value, chipActive: document.querySelector('.about-me-day-active input[name="about-me-session-minutes"]')?.value, saved: document.querySelector('.about-me-saved')?.textContent }));
  await p.reload(); await wait(p, 2000);
  const g2b = await p.evaluate(() => ({ checked: document.querySelector('input[name="about-me-session-minutes"]:checked')?.value, stored: JSON.parse(localStorage.getItem('gym-optimizer-athlete-profile-v1') || '{}').gymMinutes }));
  check('J-G2', minutesBefore !== '45' && g2.checked === '45' && g2.chipActive === '45' && g2.saved?.startsWith('Saved on this device') && g2b.checked === '45' && g2b.stored === 45, { minutesBefore, g2, afterReload: g2b });
  const groups = await p.evaluate(() => [...document.querySelectorAll('.about-me-group > summary strong')].map((e) => e.textContent));
  await p.locator('.about-me-group > summary').filter({ hasText: 'Equipment' }).dispatchEvent('click'); await wait(p, 300);
  const eqBefore = await p.evaluate(() => ({ summary: [...document.querySelectorAll('.about-me-group > summary')].find((s) => s.textContent.includes('Equipment'))?.querySelector('small')?.textContent, kettlebell: document.querySelector('.about-me-equipment-grid button:has(span)')?.textContent }));
  const toggled = await p.evaluate(() => { const b = [...document.querySelectorAll('.about-me-equipment-grid button')].find((x) => !x.className.includes('active')); const label = b?.textContent; b?.click(); return label; }); await wait(p, 400);
  const eqAfter = await p.evaluate(() => [...document.querySelectorAll('.about-me-group > summary')].find((s) => s.textContent.includes('Equipment'))?.querySelector('small')?.textContent);
  check('J-G3', ['Equipment', 'Account & sync', 'Appearance', 'Security', 'Guides & research'].every((g) => groups.includes(g)) && eqBefore.summary !== eqAfter, { groups, toggled, before: eqBefore.summary, after: eqAfter });
  await shot(p, 'profile');
  await p.goBack(); await wait(p, 900);
  const g4 = await p.evaluate(() => ({ search: location.search, active: [...document.querySelectorAll('.training-plan-day')].find((b) => b.getAttribute('aria-selected') === 'true')?.innerText.replace(/\n/g, ' ') }));
  check('J-G4', g4.search === '?workspace=day-plan' && g4.active === planDay, { planDay, g4 });
  // G5a: the tracker when the device refuses the write.
  await tab(p, 'Workout'); await wait(p, 800);
  await p.locator('.session-prestart-start').dispatchEvent('click'); await wait(p, 800);
  await p.locator('.live-set-entry input').first().fill('135'); await p.locator('.live-set-entry input').last().fill('5');
  await p.evaluate((H) => { const original = Storage.prototype.setItem; window.__restoreSetItem = () => { Storage.prototype.setItem = original; }; Storage.prototype.setItem = function (k, v) { if (k === H) throw new DOMException('QuotaExceededError'); return original.call(this, k, v); }; }, HISTORY_KEY);
  await p.locator('.live-set-commit').dispatchEvent('click'); await wait(p, 600);
  const g5a = await p.evaluate(() => ({ alert: document.querySelector('.tracker-storage-warning[role="alert"]')?.textContent?.trim().slice(0, 120), complete: document.querySelectorAll('.session-set-complete').length, set: document.querySelector('.live-set-prescription span')?.textContent }));
  await p.evaluate(() => window.__restoreSetItem());
  await p.locator('.live-set-entry input').first().fill('135'); await p.locator('.live-set-entry input').last().fill('5');
  await p.locator('.live-set-commit').dispatchEvent('click'); await wait(p, 600);
  const g5b = await p.evaluate((H) => ({ alert: !!document.querySelector('.tracker-storage-warning'), complete: document.querySelectorAll('.session-set-complete').length, storedSets: JSON.parse(localStorage.getItem(H) || '[]').find((s) => s.status === 'active')?.exercises[0].sets.filter((s) => s.completed).length }), HISTORY_KEY);
  check('J-G5 tracker', !!g5a.alert && g5a.complete === 1 && !g5b.alert && g5b.complete === 2 && g5b.storedSets === 2, { refused: g5a, retried: g5b });
  // G5b: the lift log when the device refuses the write.
  await dock(p, 'Progress'); await tab(p, 'Strength'); await wait(p, 1000);
  await p.locator('.strength-log-open').dispatchEvent('click'); await wait(p, 400);
  await p.locator('input[aria-label="Search and choose a catalog exercise"]').fill('bench press'); await wait(p, 400);
  await p.locator('.strength-exercise-picker button').first().dispatchEvent('click'); await wait(p, 300);
  await p.locator('input[aria-label="Load in pounds"]').fill('225'); await wait(p, 300);
  await p.evaluate((L) => { const original = Storage.prototype.setItem; window.__restoreSetItem = () => { Storage.prototype.setItem = original; }; Storage.prototype.setItem = function (k, v) { if (k === L) throw new DOMException('QuotaExceededError'); return original.call(this, k, v); }; }, LIFTS_KEY);
  await p.locator('.strength-log-submit button').dispatchEvent('click'); await wait(p, 700);
  const g5c = await p.evaluate(() => ({ alert: document.querySelector('.strength-log-save-error[role="alert"]')?.textContent?.slice(0, 80), load: document.querySelector('input[aria-label="Load in pounds"]')?.value, exercise: document.querySelector('input[aria-label="Search and choose a catalog exercise"]')?.value, metrics: document.querySelector('.strength-profile-metrics')?.innerText.replace(/\n/g, ' '), toast: [...document.querySelectorAll('[data-sonner-toast]')].map((t) => t.innerText.split('\n')[0]) }));
  await p.evaluate(() => window.__restoreSetItem());
  await p.locator('.strength-log-submit button').dispatchEvent('click'); await wait(p, 900);
  const g5d = await p.evaluate(() => ({ alert: !!document.querySelector('.strength-log-save-error'), load: document.querySelector('input[aria-label="Load in pounds"]')?.value, metrics: document.querySelector('.strength-profile-metrics')?.innerText.replace(/\n/g, ' '), toast: [...document.querySelectorAll('[data-sonner-toast]')].map((t) => t.innerText.split('\n')[0]) }));
  check('J-G5 lift log', !!g5c.alert && g5c.load === '225' && g5c.exercise?.includes('Bench') && !/1 lift recorded/.test(g5c.metrics || '') && !g5d.alert && g5d.load === '' && /1 lift recorded/.test(g5d.metrics || '') && g5d.toast.includes('Lift saved on this device.'), { refused: g5c, retried: g5d });
  check('J-G errors', errs.length === 0, errs.length ? errs : 'none');
  await p.close();
}

// ── Journey H: constrained mobile use ──────────────────────────────────────────
{
  const p = await page({ width: 360, height: 780 }); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await boot(p, { draft: true });
  await dock(p, 'Train'); await tab(p, 'Plan'); await wait(p, 800);
  const rect = (e) => { const r = e.getBoundingClientRect(); return { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) }; };
  const h1 = await p.evaluate(() => { const rect = (e) => { const r = e.getBoundingClientRect(); return { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) }; }; const tabs = [...document.querySelectorAll('.workspace-top-switcher button')].map((b) => ({ label: b.textContent.trim(), ...rect(b) })); const utilities = [...document.querySelectorAll('.topbar-utilities button, .topbar-utilities [role="button"], .topbar-utilities input')].map((b) => ({ label: b.getAttribute('aria-label') || b.tagName, ...rect(b) })); return { tabs, utilities, scrollW: document.documentElement.scrollWidth }; });
  const tabsOk = h1.tabs.length === 4 && h1.tabs.every((t, i) => t.r <= 360 && t.h >= 44 && (i === 0 || t.l >= h1.tabs[i - 1].r)) && h1.tabs.map((t) => t.label).join(',') === 'Plan,Review,Workout,Matches';
  const utilOk = h1.utilities.length >= 2 && h1.utilities.every((u) => u.w >= 44 && u.h >= 44 && u.b <= Math.min(...h1.tabs.map((t) => t.t))) && h1.utilities.every((u, i) => i === 0 || u.l >= h1.utilities[i - 1].r);
  check('J-H1', tabsOk && utilOk && h1.scrollW === 360, h1);
  await shot(p, 'train-header-360');
  // H2: large text with the longest plan row.
  await p.addStyleTag({ content: 'html { font-size: 20px !important; }' }); await wait(p, 400);
  // Reorder is a mode now: the arrows are measured in it, as the athlete meets them.
  await p.locator('.day-action-reorder').first().dispatchEvent('click').catch(() => {}); await wait(p, 300);
  const h2 = await p.evaluate(() => { const rows = [...document.querySelectorAll('.day-orderable-exercise')]; const longest = rows.map((row) => ({ row, name: row.querySelector('.custom-row-identity strong')?.textContent || '' })).sort((a, b) => b.name.length - a.name.length)[0]; if (!longest) return null; const name = longest.row.querySelector('.custom-row-identity strong').getBoundingClientRect(); const controls = [...longest.row.querySelectorAll('.day-order-controls button')].map((b) => b.getBoundingClientRect()); const overlaps = controls.some((c) => c.left < name.right && c.right > name.left && c.top < name.bottom && c.bottom > name.top); const nameLines = Math.round(name.height / parseFloat(getComputedStyle(longest.row.querySelector('.custom-row-identity strong')).lineHeight)); return { name: longest.name, nameRight: Math.round(name.right), nameLines, controls: controls.map((c) => `${Math.round(c.width)}x${Math.round(c.height)}@${Math.round(c.left)}`), overlaps, scrollW: document.documentElement.scrollWidth, nameClipped: name.right > 360 }; });
  await p.locator('.day-action-reorder').first().dispatchEvent('click').catch(() => {}); await wait(p, 200);
  check('J-H2', h2 && !h2.overlaps && !h2.nameClipped && h2.scrollW === 360 && h2.controls.every((c) => { const [w, h] = c.split('@')[0].split('x').map(Number); return w >= 44 && h >= 44; }), h2);
  await p.evaluate(() => window.scrollTo(0, 0)); await wait(p, 200);
  await shot(p, 'narrow-large-text-360');
  await p.evaluate(() => { [...document.querySelectorAll('style')].filter((s) => s.textContent.includes('font-size: 20px !important')).forEach((s) => s.remove()); });
  // H3: a numeric form with the keyboard up (viewport shortened to what a keyboard leaves).
  await p.setViewportSize({ width: 360, height: 420 });
  await dock(p, 'Progress'); await tab(p, 'Strength'); await wait(p, 1000);
  await p.locator('.strength-log-open').dispatchEvent('click'); await wait(p, 400);
  await p.locator('input[aria-label="Search and choose a catalog exercise"]').fill('bench press'); await wait(p, 400);
  await p.locator('.strength-exercise-picker button').first().dispatchEvent('click'); await wait(p, 300);
  await p.locator('input[aria-label="Load in pounds"]').focus(); await p.locator('input[aria-label="Load in pounds"]').fill('225'); await wait(p, 300);
  const h3 = await p.evaluate(() => { const rect = (e) => { const r = e.getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom), h: Math.round(r.height) }; }; const input = document.querySelector('input[aria-label="Load in pounds"]'); input.scrollIntoView({ block: 'center' }); const i = rect(input); const button = document.querySelector('.strength-log-submit button'); button.scrollIntoView({ block: 'center' }); const b = rect(button); const dockEl = document.querySelector('.mobile-bottom-nav'); const d = dockEl ? rect(dockEl) : null; return { input: i, inputVisible: i.t >= 0 && i.b <= innerHeight, button: b, buttonVisible: b.t >= 0 && b.b <= innerHeight && (!d || b.b <= d.t), disabled: button.disabled, dockTop: d?.t, scrollW: document.documentElement.scrollWidth }; });
  check('J-H3', h3.inputVisible && h3.buttonVisible && !h3.disabled && h3.scrollW === 360, h3);
  await p.setViewportSize({ width: 360, height: 780 });
  // H4: the last row clears the strip.
  await dock(p, 'Train'); await tab(p, 'Workout'); await wait(p, 800);
  await p.locator('.session-prestart-start').dispatchEvent('click'); await wait(p, 800);
  const h4 = [];
  for (const [d, t] of [['Train', 'Plan'], ['Body Lab', 'Exercises'], ['Progress', 'Progress']]) {
    await dock(p, d); await wait(p, 400); await tab(p, t); await wait(p, 900);
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await wait(p, 500);
    h4.push(await p.evaluate((label) => { const strip = document.querySelector('.session-resume-bar')?.getBoundingClientRect(); const items = [...document.querySelectorAll('main button, main summary, main a, main input')].filter((e) => e.getBoundingClientRect().height > 0); const last = items[items.length - 1]; return { label, strip: strip ? Math.round(strip.top) : null, lastBottom: last ? Math.round(last.getBoundingClientRect().bottom) : null, last: last?.textContent?.trim().slice(0, 40), clear: !!strip && !!last && last.getBoundingClientRect().bottom <= strip.top + 1 }; }, t));
  }
  check('J-H4', h4.every((r) => r.clear), h4);
  // H5: back/close and focus restoration on the overlay.
  await dock(p, 'Body Lab'); await tab(p, 'Exercises'); await wait(p, 900);
  const opener = p.locator('.catalog-discovery-card-copy').nth(1);
  await opener.focus(); await p.keyboard.press('Enter'); await wait(p, 800);
  const opened = await p.evaluate(() => ({ overlay: !!document.querySelector('.exercise-intelligence'), focus: document.activeElement?.getAttribute('aria-label') || document.activeElement?.tagName, historyOverlay: history.state?.overlay }));
  await p.keyboard.press('Escape'); await wait(p, 700);
  const escaped = await p.evaluate(() => ({ overlay: !!document.querySelector('.exercise-intelligence'), focus: document.activeElement?.getAttribute('aria-label') || document.activeElement?.tagName, search: location.search }));
  await opener.focus(); await p.keyboard.press('Enter'); await wait(p, 800);
  await p.goBack(); await wait(p, 800);
  const backed = await p.evaluate(() => ({ overlay: !!document.querySelector('.exercise-intelligence'), focus: document.activeElement?.getAttribute('aria-label') || document.activeElement?.tagName, search: location.search }));
  const openerLabel = await opener.getAttribute('aria-label');
  check('J-H5', opened.overlay && opened.focus === 'Close exercise intelligence' && !escaped.overlay && escaped.focus === openerLabel && escaped.search === '?workspace=catalog' && !backed.overlay && backed.focus === openerLabel && backed.search === '?workspace=catalog', { openerLabel, opened, escaped, backed });
  check('J-H errors', errs.length === 0, errs.length ? errs : 'none');
  await p.close();
}

// ── Transition recording: entry, add, back, resume, scroll ─────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, recordVideo: { dir: `${scratch}/video`, size: { width: 390, height: 844 } } });
  const p = await ctx.newPage();
  await boot(p, { draft: true }); await dock(p, 'Home'); await wait(p, 1200);
  await p.locator('.home-explore-row').filter({ hasText: 'Find exercises' }).dispatchEvent('click'); await wait(p, 1500);
  await p.locator('.catalog-discovery-card-copy').first().dispatchEvent('click'); await wait(p, 1500);
  await p.goBack(); await wait(p, 1200);
  await p.locator('.catalog-discovery-actions button:last-child').first().dispatchEvent('click'); await wait(p, 1500);
  await p.locator('[data-sonner-toast] button').filter({ hasText: 'View workout' }).first().dispatchEvent('click'); await wait(p, 1500);
  await tab(p, 'Workout'); await wait(p, 1200);
  await p.locator('.session-prestart-start').dispatchEvent('click'); await wait(p, 1200);
  await p.locator('.live-set-commit').dispatchEvent('click'); await wait(p, 1000);
  await dock(p, 'Home'); await wait(p, 1500);
  await p.evaluate(() => window.scrollTo({ top: 1200, behavior: 'smooth' })); await wait(p, 1500);
  await p.locator('.session-resume-bar').dispatchEvent('click'); await wait(p, 1500);
  const video = p.video();
  await ctx.close();
  const path = await video.path();
  copyFileSync(path, `${evidence}/transition-recording.webm`);
  console.log('recording ->', `${evidence}/transition-recording.webm`);
}

await browser.close();
writeFileSync(`${scratch}/phaseg-results.json`, JSON.stringify(results, null, 1));
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed${failed.length ? ' — failed: ' + failed.map((f) => f.id).join(', ') : ''}`);
