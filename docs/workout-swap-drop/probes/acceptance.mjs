// Oct 6 brief §7: the owner's two examples driven through the built app in headless Chromium
// (vite preview, no network beyond the photo cache). Viewport emulation only: not a phone, not
// a person. Run: node docs/workout-swap-drop/probes/acceptance.mjs
import { writeFileSync } from 'node:fs';
import { browser, base, seed, page, wait } from '../../exercise-intelligence/probes/shared.mjs';

const out = new URL('../evidence/', import.meta.url).pathname;
const results = [];
const check = (name, pass, detail = '') => { results.push({ name, pass: Boolean(pass), detail }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`); };
const historyKey = 'sports-genome-device-workout-history-v1';
const session = (unit = 'lb') => JSON.stringify([{
  id: 'device-probe', title: 'Week 1 · Legs workout', dayLabel: 'Week 1 · Legs', startedAt: new Date().toISOString(), status: 'active', restSeconds: 90, weightUnit: unit,
  exercises: [
    { id: '182-0', exerciseName: 'Sissy Squat', catalogId: 182, plannedPrescription: '4 × 10', sets: Array.from({ length: 4 }, () => ({ weight: '', reps: '', completed: false })) },
    { id: '4-1', exerciseName: 'Dumbbell Bench Press', catalogId: 4, plannedPrescription: '3 × 10', sets: Array.from({ length: 3 }, () => ({ weight: '', reps: '', completed: false })) },
  ],
}]);
const stored = (p) => p.evaluate((key) => JSON.parse(localStorage.getItem(key) || '[]'), historyKey);
const card = (p) => p.locator('.live-set-card').first();
const noSideScroll = (p) => p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
const inView = (p, selector) => p.evaluate((s) => { const el = document.querySelector(s); if (!el) return false; const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= window.innerHeight + 1 && r.left >= 0 && r.right <= window.innerWidth + 1; }, selector);

async function open(width, height, { unit = 'lb', rootScale = null } = {}) {
  const [ctx, p] = await page(width, height);
  await seed(p, { [historyKey]: session(unit) });
  await p.goto(`${base}/?workspace=tracker`); await wait(p, 1800);
  if (rootScale) { await p.addStyleTag({ content: `html { font-size: ${rootScale}% !important; }` }); await wait(p, 300); }
  return [ctx, p];
}
async function logReps(p, reps, weight) {
  if (weight !== undefined) await card(p).getByLabel(/^Weight/).fill(weight);
  await card(p).getByLabel('Reps').fill(reps);
  await card(p).getByRole('button', { name: /^Log set/ }).click(); await wait(p, 250);
}
async function openSwap(p) { await card(p).getByRole('button', { name: 'Swap exercise' }).click(); await wait(p, 500); return p.getByRole('dialog', { name: /^Replace / }); }

// 1. The owner's swap at 390 x 844, with the full set of facts checked.
{
  const [ctx, p] = await open(390, 844);
  await logReps(p, '12'); await logReps(p, '12');
  await p.screenshot({ path: `${out}swap-1-before-390.png` });
  const dialog = await openSwap(p);
  const suggested = await dialog.locator('section[aria-label="Suggested"] .swap-option strong').allTextContents();
  check('With no search, suggestions of the same movement include Back Squat', suggested.includes('Back Squat'), suggested.slice(0, 6).join(', '));
  check('Equipment filters are fully visible (row at least 44 px tall)', await p.evaluate(() => document.querySelector('.swap-filters').getBoundingClientRect().height >= 43.5));
  await p.screenshot({ path: `${out}swap-2a-suggestions-390.png` });
  await dialog.getByRole('searchbox').fill('barbell squat'); await wait(p, 400);
  const first = await dialog.locator('.swap-option strong').first().textContent();
  check('Search "barbell squat" puts Back Squat first', first === 'Back Squat', first);
  await dialog.locator('.swap-option').filter({ hasText: 'Back Squat' }).first().click(); await wait(p, 300);
  const text = await dialog.textContent();
  check('Sheet is titled "Replace Sissy Squat"', (await dialog.locator('h2').textContent()) === 'Replace Sissy Squat');
  check('Sheet says the 2 logged sets stay with Sissy Squat', text.includes('Your 2 logged sets stay with Sissy Squat. The exercise you choose takes the remaining 2 sets.'));
  check('Default scope is this workout only', text.includes('This workout only'));
  check('Confirm reads "Use Back Squat" and is on screen', (await dialog.locator('.swap-confirm').textContent()) === 'Use Back Squat' && await inView(p, '.swap-confirm'));
  check('No sideways scroll with the sheet open (390)', await noSideScroll(p));
  await p.screenshot({ path: `${out}swap-2-sheet-390.png` });
  await dialog.locator('.swap-details').scrollIntoViewIfNeeded(); await wait(p, 200);
  await p.screenshot({ path: `${out}swap-3-sheet-details-390.png` });
  await dialog.locator('.swap-confirm').click(); await wait(p, 600);
  check('Live card now tracks Back Squat, set 1 of 2', (await card(p).locator('h4').textContent()) === 'Back Squat' && (await card(p).textContent()).includes('Set 1 of 2'));
  check('Live card says "Switched from Sissy Squat after 2 sets"', (await card(p).textContent()).includes('Switched from Sissy Squat after 2 sets'));
  check('No load carried across: weight box empty', (await card(p).getByLabel(/^Weight/).inputValue()) === '');
  await p.screenshot({ path: `${out}swap-4-after-390.png` });
  await logReps(p, '5', '135');
  const [s] = await stored(p);
  check('Stored: Sissy Squat keeps its 2 completed sets, Back Squat has 1 of 2, total still 7 sets',
    JSON.stringify(s.exercises.map((e) => [e.exerciseName, e.sets.filter((x) => x.completed).length, e.sets.length])) === JSON.stringify([['Sissy Squat', 2, 2], ['Back Squat', 1, 2], ['Dumbbell Bench Press', 0, 3]]), JSON.stringify(s.exercises.map((e) => [e.exerciseName, e.sets.length])));

  // 2. The owner's drop set, on the barbell squat's second set.
  await card(p).getByRole('button', { name: 'Drop set' }).click(); await wait(p, 200);
  const restBefore = await p.locator('.live-rest-state').textContent();
  await p.locator('.live-rest-row button', { hasText: /Skip|Clear/ }).first().click().catch(() => {}); await wait(p, 200);
  for (const [w, r] of [['100', '5'], ['70', '6']]) { await card(p).getByLabel(/^Weight/).fill(w); await card(p).getByLabel('Reps').fill(r); await card(p).getByRole('button', { name: 'Add drop' }).click(); await wait(p, 250); }
  check('No rest between stages', (await p.locator('.live-rest-state').textContent()) !== 'Resting', `before drop: ${restBefore}`);
  await card(p).getByLabel(/^Weight/).fill('50'); await card(p).getByLabel('Reps').fill('10');
  await p.screenshot({ path: `${out}drop-1-stages-390.png` });
  await card(p).getByRole('button', { name: 'Finish drop set' }).click(); await wait(p, 400);
  check('Rest starts when the drop set is finished', (await p.locator('.live-rest-state').textContent()) === 'Resting');
  await p.locator('.live-session-queue > summary').click(); await wait(p, 300);
  const queue = await p.locator('.live-session-queue').textContent();
  check('Full list shows "Drop set · 100 lb × 5 → 70 lb × 6 → 50 lb × 10"', queue.includes('Drop set · 100 lb × 5 → 70 lb × 6 → 50 lb × 10'));
  check('Full list shows "1 drop set · 3 stages · 21 reps · 1,420 lb·reps"', queue.includes('1 drop set · 3 stages · 21 reps · 1,420 lb·reps'));
  check('Full list shows "Switched to Back Squat after 2 sets" on Sissy Squat', queue.includes('Switched to Back Squat after 2 sets'));
  await p.locator('.session-set-drop').first().scrollIntoViewIfNeeded();
  await p.screenshot({ path: `${out}drop-2-queue-390.png` });
  const [s2] = await stored(p);
  const drop = s2.exercises[1].sets[1];
  check('Stored as one set with three ordered stages', drop.type === 'drop' && drop.completed && drop.stages.map((x) => `${x.weight}x${x.reps}`).join(',') === '100x5,70x6,50x10');
  { const head = await p.locator('.execution-head').textContent(); check('Tally counts the drop set once: 4/7 sets (2 Sissy Squat + 1 Back Squat + 1 drop set, of 4 + 3 planned)', head.replace(/\s+/g, '').includes('4/7sets'), head); }

  // 3. Reload mid-workout: the swap and the drop set come back.
  await p.reload(); await wait(p, 1800);
  check('After reload: still on Back Squat, which is done; Dumbbell Bench Press next', (await card(p).locator('h4').textContent()) === 'Dumbbell Bench Press');

  // 4. Finish and read the record in Progress.
  await p.locator('.live-session-finish').last().click(); await wait(p, 800);
  await p.goto(`${base}/?workspace=progress`); await wait(p, 1800);
  await p.locator('.progress-session-card > summary').first().click().catch(() => {}); await wait(p, 300);
  const record = await p.locator('.progress-session-sets').first().textContent().catch(() => '');
  check('Progress record shows both exercises and the swap', record.includes('Switched to Back Squat after 2 sets') && record.includes('Switched from Sissy Squat after 2 sets'));
  check('Progress record shows the drop set as one line with its totals', record.includes('Drop set · 100 lb × 5 → 70 lb × 6 → 50 lb × 10') && record.includes('1 drop set · 3 stages · 21 reps · 1,420 lb·reps'));
  await p.evaluate(() => document.querySelectorAll('.progress-session-set-lines')[1]?.scrollIntoView({ block: 'center' }));
  await p.screenshot({ path: `${out}record-progress-390.png` });
  await ctx.close();
}

// 5. Widths, desktop, larger text and an open keyboard: the sheet and the drop-set card.
for (const [width, height, label, opts] of [[320, 640, 'phone-320'], [375, 812, 'phone-375'], [430, 932, 'phone-430'], [1280, 800, 'desktop-1280'], [390, 844, 'phone-390-large-text', { rootScale: 140 }], [390, 500, 'phone-390-keyboard']]) {
  const [ctx, p] = await open(width, height, opts || {});
  await logReps(p, '12');
  const dialog = await openSwap(p);
  await dialog.getByRole('searchbox').fill('back squat'); await wait(p, 300);
  await dialog.locator('.swap-option').filter({ hasText: 'Back Squat' }).first().click(); await wait(p, 300);
  const confirmVisible = await inView(p, '.swap-confirm');
  const sheetFits = await p.evaluate(() => { const r = document.querySelector('.swap-sheet').getBoundingClientRect(); return r.left >= 0 && r.right <= window.innerWidth + 1 && document.querySelector('.swap-filters').getBoundingClientRect().height >= 43.5; });
  const smallTargets = await p.evaluate(() => [...document.querySelectorAll('.swap-sheet button, .swap-sheet input[type="search"]')].filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.height < 43.5); }).map((el) => el.textContent?.trim() || el.getAttribute('aria-label')).slice(0, 5));
  check(`${label}: sheet fits, no sideways scroll, "Use Back Squat" on screen, targets ≥ 44 px`, confirmVisible && sheetFits && await noSideScroll(p) && smallTargets.length === 0, smallTargets.join(', '));
  await p.screenshot({ path: `${out}sheet-${label}.png` });
  await dialog.locator('.swap-confirm').click(); await wait(p, 500);
  await card(p).getByRole('button', { name: 'Drop set' }).click(); await wait(p, 200);
  await card(p).getByLabel(/^Weight/).fill('100'); await card(p).getByLabel('Reps').fill('5');
  await card(p).getByRole('button', { name: 'Add drop' }).click(); await wait(p, 250);
  await card(p).getByLabel(/^Weight/).fill('70'); await card(p).getByLabel('Reps').fill('6');
  const actionsFit = await p.evaluate(() => [...document.querySelectorAll('.live-drop-actions button, .live-set-type button')].every((el) => { const r = el.getBoundingClientRect(); return r.right <= window.innerWidth + 1 && r.height >= 43.5; }));
  check(`${label}: drop-set controls fit and are ≥ 44 px tall`, actionsFit && await noSideScroll(p));
  await card(p).scrollIntoViewIfNeeded();
  await p.screenshot({ path: `${out}drop-${label}.png` });
  await ctx.close();
}

// 6. Keyboard only: open the sheet, search, choose, confirm, without a pointer.
{
  const [ctx, p] = await open(1280, 800);
  await logReps(p, '12');
  await card(p).getByRole('button', { name: 'Swap exercise' }).focus(); await p.keyboard.press('Enter'); await wait(p, 400);
  check('Keyboard: focus moves into the sheet', await p.evaluate(() => Boolean(document.activeElement?.closest('.swap-sheet'))));
  await p.keyboard.press('Tab'); await p.keyboard.press('Tab');
  await p.getByRole('searchbox').focus(); await p.keyboard.type('back squat'); await wait(p, 300);
  await p.locator('.swap-option').filter({ hasText: 'Back Squat' }).first().focus(); await p.keyboard.press('Enter'); await wait(p, 200);
  await p.locator('.swap-confirm').focus(); await p.keyboard.press('Enter'); await wait(p, 500);
  check('Keyboard: Enter on "Use Back Squat" swaps', (await card(p).locator('h4').textContent()) === 'Back Squat');
  await card(p).getByRole('button', { name: 'Swap exercise' }).focus(); await p.keyboard.press('Enter'); await wait(p, 300);
  await p.keyboard.press('Escape'); await wait(p, 300);
  check('Keyboard: Escape closes the sheet and returns focus to Swap exercise', !(await p.locator('.swap-sheet').count()) && await p.evaluate(() => document.activeElement?.textContent?.includes('Swap exercise')));
  await ctx.close();
}

// 7. Kilograms with decimals, and a bodyweight drop.
{
  const [ctx, p] = await open(390, 844, { unit: 'kg' });
  const dialog = await openSwap(p);
  await dialog.getByRole('searchbox').fill('back squat'); await wait(p, 300);
  await dialog.locator('.swap-option').filter({ hasText: 'Back Squat' }).first().click();
  await dialog.locator('.swap-confirm').click(); await wait(p, 500);
  check('Nothing logged: Back Squat replaces Sissy Squat in place, 4 sets', (await card(p).textContent()).includes('Set 1 of 4') && (await stored(p))[0].exercises.length === 2);
  await card(p).getByRole('button', { name: 'Drop set' }).click();
  for (const [w, r] of [['42.5', '6'], ['30', '8']]) { await card(p).getByLabel(/^Weight/).fill(w); await card(p).getByLabel('Reps').fill(r); await card(p).getByRole('button', { name: 'Add drop' }).click(); await wait(p, 200); }
  await card(p).getByLabel(/^Weight/).fill('17.5'); await card(p).getByLabel('Reps').fill('12');
  await card(p).getByRole('button', { name: 'Finish drop set' }).click(); await wait(p, 300);
  await p.locator('.live-session-queue > summary').click(); await wait(p, 300);
  const queue = await p.locator('.live-session-queue').textContent();
  check('kg with decimals: "Drop set · 42.5 kg × 6 → 30 kg × 8 → 17.5 kg × 12 … 705 kg·reps"', queue.includes('Drop set · 42.5 kg × 6 → 30 kg × 8 → 17.5 kg × 12') && queue.includes('705 kg·reps'));
  await ctx.close();
}

writeFileSync(`${out}acceptance.json`, JSON.stringify({ ranAt: new Date().toISOString(), environment: 'headless Chromium, vite preview of the production build, viewport emulation', results }, null, 1));
console.log(`${results.filter((r) => r.pass).length}/${results.length} pass`);
await browser.close();
