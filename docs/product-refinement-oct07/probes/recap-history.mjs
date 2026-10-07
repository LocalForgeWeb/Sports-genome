// Oct 7 brief §5, §6, §12: finish → "Workout saved" → Progress session detail → history list,
// and Home's last-workout entry, driven through the built app (vite preview) in headless Chromium.
// Viewport emulation only: not a phone, not a person. Run: node docs/product-refinement-oct07/probes/recap-history.mjs
import { writeFileSync } from 'node:fs';
import { browser, base, seed, page, wait } from '../../exercise-intelligence/probes/shared.mjs';

const out = new URL('../evidence/', import.meta.url).pathname;
const results = [];
const check = (name, pass, detail = '') => { results.push({ name, pass: Boolean(pass), detail }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`); };
const historyKey = 'sports-genome-device-workout-history-v1';
const noSideScroll = (p) => p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
const stored = (p) => p.evaluate((key) => JSON.parse(localStorage.getItem(key) || '[]'), historyKey);

const live = () => ({
  id: 'device-live', title: 'Week 1 · Day 01 · Push workout', dayLabel: 'Week 1 · Day 01 · Push', startedAt: new Date(Date.now() - 47 * 60000).toISOString(), status: 'active', restSeconds: 90, weightUnit: 'lb',
  exercises: [
    { id: 'bench', exerciseName: 'Barbell Bench Press', catalogId: 1, plannedPrescription: '3 × 5', sets: Array.from({ length: 3 }, () => ({ weight: '', reps: '', completed: false })) },
    { id: 'fly', exerciseName: 'Cable Fly', plannedPrescription: '3 × 12', sets: Array.from({ length: 3 }, () => ({ weight: '', reps: '', completed: false })) },
  ],
});
/** n finished workouts, one every two days, newest first; the oldest is "Workout 0". */
const finished = (count) => Array.from({ length: count }, (_, i) => {
  const n = count - 1 - i;
  const at = new Date(Date.now() - (i + 1) * 2 * 86400000).toISOString();
  const name = i % 2 ? 'Back Squat' : 'Barbell Bench Press';
  return { id: `old-${n}`, title: `Workout ${n}`, dayLabel: `Week 1 · Workout ${n}`, startedAt: at, completedAt: at, status: 'completed', weightUnit: 'lb',
    exercises: [{ id: `e${n}`, exerciseName: name, plannedPrescription: '3 × 5', sets: [{ weight: '135', reps: '5', unit: 'lb', completed: true }], ...(n === 0 ? { } : {}) }] };
});
// The oldest carries a drop set, so its stages can be inspected from history.
const withDrop = (list) => list.map((s) => s.id !== 'old-0' ? s : { ...s, exercises: [{ ...s.exercises[0], sets: [{ id: 'd', type: 'drop', weight: '100', reps: '5', unit: 'lb', completed: true, stages: [{ id: 'd1', weight: '100', reps: '5', unit: 'lb' }, { id: 'd2', weight: '70', reps: '6', unit: 'lb' }, { id: 'd3', weight: '50', reps: '10', unit: 'lb' }] }] }] });

for (const [width, height] of [[390, 844], [320, 640], [1280, 900]]) {
  const [ctx, p] = await page(width, height);
  await seed(p, { [historyKey]: JSON.stringify([live(), ...withDrop(finished(13))]) });
  await p.goto(`${base}/?workspace=tracker`); await wait(p, 1800);
  const card = p.locator('.live-set-card').first();
  await card.getByLabel(/^Weight/).fill('185'); await card.getByLabel('Reps').fill('5');
  await card.getByRole('button', { name: /^Log set/ }).click(); await wait(p, 300);
  await card.getByLabel('Reps').fill('5');
  await card.getByRole('button', { name: /^Log set/ }).click(); await wait(p, 300);

  // R13: finishing early asks in place; Keep going returns to the same set.
  await p.getByRole('button', { name: /Finish workout early/ }).click(); await wait(p, 300);
  const confirm = p.locator('.live-finish-confirm');
  check(`${width}: finishing early asks first and says what stays not done`, (await confirm.textContent())?.includes('4 planned sets stay not done'), await confirm.textContent());
  check(`${width}: nothing is saved before confirming`, (await stored(p)).find((s) => s.id === 'device-live')?.status === 'active');
  await p.getByRole('button', { name: 'Keep going' }).click(); await wait(p, 300);
  check(`${width}: Keep going returns to set 3 of Bench`, (await p.locator('.live-set-card').first().textContent())?.includes('Set 3'), (await p.locator('.live-set-card h3, .live-set-card strong').first().textContent()) ?? '');
  await p.getByRole('button', { name: /Finish workout early/ }).click(); await wait(p, 200);
  await p.getByRole('button', { name: 'Finish now' }).click(); await wait(p, 800);

  // R01-R09: the saved recap.
  const saved = p.locator('[data-session-detail="saved"]');
  check(`${width}: "Workout saved" heading with day, date and storage status`, await saved.getByRole('heading', { name: 'Workout saved' }).isVisible() && (await saved.locator('.session-detail-meta').textContent())?.includes('Saved on this device'));
  const summary = await saved.locator('.session-detail-summary dt').allTextContents();
  check(`${width}: at most three summary numbers, time labelled elapsed`, summary.length <= 3 && (await saved.locator('.session-detail-summary').textContent()).includes('min elapsed'), summary.join(', '));
  check(`${width}: Bench reads 2 of 3 planned sets · 1 not recorded`, (await saved.locator('.session-detail-exercises').textContent()).includes('2 of 3 planned sets · 1 not recorded'));
  check(`${width}: Cable Fly listed as not done, not recorded`, (await saved.locator('.session-detail-not-done').textContent()).includes('Cable Fly · not recorded'));
  check(`${width}: no calories, effort or score copy`, !/calorie|effort|score|readiness/i.test(await saved.textContent()));
  check(`${width}: no sideways scroll on the recap`, await noSideScroll(p));
  await p.screenshot({ path: `${out}recap-saved-${width}.png`, fullPage: true });

  // R11: a note survives a reload.
  await saved.getByLabel(/^Note/).fill('Felt strong today');
  await saved.getByRole('button', { name: 'Save note' }).click(); await wait(p, 300);

  // R14 / H03: "View in Progress" opens the same session by ID, in the address.
  await saved.getByRole('button', { name: 'View in Progress' }).click(); await wait(p, 900);
  check(`${width}: Progress opens the same session by ID in the address`, new URL(p.url()).searchParams.get('session') === 'device-live', p.url());
  await p.reload(); await wait(p, 1800);
  const detail = p.locator('[data-session-detail="history"]');
  check(`${width}: after reload, the same session detail and its note`, (await detail.getAttribute('data-session-id')) === 'device-live' && (await detail.getByLabel(/^Note/).inputValue()) === 'Felt strong today');
  check(`${width}: exactly one finished copy of the workout is stored`, (await stored(p)).filter((s) => s.id === 'device-live').length === 1);

  // R12 / J07: correct one set from the detail; Home reads the same record.
  await detail.getByRole('button', { name: 'Correct a set' }).click(); await wait(p, 200);
  await detail.getByRole('button', { name: 'Edit set 2 of Barbell Bench Press' }).click();
  await detail.getByLabel('Weight').fill('190'); await detail.getByRole('button', { name: 'Save set' }).click(); await wait(p, 300);
  const fixed = (await stored(p)).find((s) => s.id === 'device-live');
  check(`${width}: correction stored on the one record and marked corrected`, fixed.exercises[0].sets[1].weight === '190' && Boolean(fixed.correctedAt));

  // H01 / J15 / J16: back to the list, all 14 reachable, filters, oldest drop set, return position.
  await detail.getByRole('button', { name: 'All workouts' }).click(); await wait(p, 700);
  const rows = () => p.locator('[data-session-row]').count();
  check(`${width}: first page shows 10 of 14`, (await rows()) === 10, String(await rows()));
  await p.getByRole('button', { name: /^Show 4 more/ }).click(); await wait(p, 300);
  check(`${width}: Show more reaches all 14 and says it reached the end`, (await rows()) === 14 && await p.getByText("That's every workout: 14.").isVisible());
  await p.getByRole('combobox', { name: 'When' }).selectOption('30'); await wait(p, 200);
  await p.getByRole('combobox', { name: 'Exercise' }).selectOption({ label: 'Cable Fly' }).catch(() => {});
  await p.getByRole('combobox', { name: 'When' }).selectOption('all');
  const exerciseOptions = await p.getByRole('combobox', { name: 'Exercise' }).locator('option').allTextContents();
  check(`${width}: exercise filter lists only exercises done`, exerciseOptions.includes('Back Squat') && !exerciseOptions.includes('Cable Fly'), exerciseOptions.join(', '));
  await p.getByRole('combobox', { name: 'Exercise' }).selectOption({ label: 'Back Squat' }); await p.getByRole('combobox', { name: 'When' }).selectOption('30'); await wait(p, 200);
  const matched = await rows();
  await p.evaluate(() => { const s = document.querySelector('select[value], .progress-history-toolbar select'); });
  check(`${width}: filters narrow the list and show a count`, matched > 0 && matched < 14 && await p.locator('.progress-section-head span').textContent().then((t) => /of 15|of 14/.test(t)), `${matched} rows`);
  await p.getByRole('button', { name: 'Clear filters' }).first().click(); await wait(p, 200);
  check(`${width}: Clear filters restores the list`, (await rows()) >= 10);
  await p.getByRole('button', { name: /^Show 4 more/ }).click().catch(() => {}); await wait(p, 200);
  await p.getByRole('button', { name: /^View session: Workout 0,/ }).click(); await wait(p, 600);
  const oldest = p.locator('[data-session-detail="history"]');
  check(`${width}: oldest workout opens with its drop set as one set of three stages`, (await oldest.textContent()).includes('Drop set · 100 lb × 5 → 70 lb × 6 → 50 lb × 10') && (await oldest.locator('.session-detail-summary').textContent()).includes('Working sets1'));
  await p.screenshot({ path: `${out}history-detail-${width}.png`, fullPage: true });
  await p.goBack(); await wait(p, 700);
  const focused = await p.evaluate(() => document.activeElement?.getAttribute('data-session-row'));
  check(`${width}: Back returns to the list with the opened row focused`, focused === 'old-0', String(focused));
  check(`${width}: no sideways scroll on history`, await noSideScroll(p));
  await p.screenshot({ path: `${out}history-list-${width}.png` });

  // O08: Home's last-workout entry opens that exact recap.
  await p.goto(`${base}/?workspace=command`); await wait(p, 1800);
  const last = p.locator('.home-last-session');
  check(`${width}: Home shows Last workout: Push`, (await last.textContent())?.includes('Push'), await last.textContent());
  await last.click(); await wait(p, 800);
  check(`${width}: Home's entry opens that session`, new URL(p.url()).searchParams.get('session') === 'device-live');
  await ctx.close();
}

// N06: a deleted or unknown ID opens an explanatory state, not another workout.
{
  const [ctx, p] = await page(390, 844);
  await seed(p, { [historyKey]: JSON.stringify(finished(2)) });
  await p.goto(`${base}/?workspace=progress&session=missing-id`); await wait(p, 1800);
  check('Unknown session ID shows "Workout not found" with a way back', await p.getByRole('heading', { name: 'Workout not found' }).isVisible() && await p.getByRole('button', { name: 'All workouts' }).isVisible());
  await p.getByRole('button', { name: 'All workouts' }).click(); await wait(p, 600);
  check('…and All workouts opens the list', (await p.locator('[data-session-row]').count()) === 2);
  await ctx.close();
}

// H10 / J17: repeat a past workout into a chosen plan day. Only exercises and prescriptions copy.
{
  const [ctx, p] = await page(390, 844);
  const past = [{ id: 'past-1', title: 'Week 1 · Day 02 · Pull workout', dayLabel: 'Week 1 · Day 02 · Pull', startedAt: '2026-10-01T10:00:00.000Z', completedAt: '2026-10-01T11:00:00.000Z', status: 'completed', weightUnit: 'lb',
    exercises: [
      { id: 'a', exerciseName: 'Barbell Bench Press', catalogId: 1, plannedPrescription: '5 × 3', sets: [{ weight: '185', reps: '3', unit: 'lb', completed: true }] },
      { id: 'b', exerciseName: 'Back Squat', catalogId: 161, plannedPrescription: '4 × 6–8', sets: [{ weight: '225', reps: '6', unit: 'lb', completed: true }] },
    ] }];
  await seed(p, { [historyKey]: JSON.stringify(past) });
  await p.goto(`${base}/?workspace=progress&session=past-1`); await wait(p, 2000);
  const before = JSON.stringify(await stored(p));
  await p.getByRole('button', { name: 'Repeat in your plan' }).click(); await wait(p, 800);
  const dialog = p.getByRole('dialog');
  const text = await dialog.textContent();
  check('Repeat opens Save to plan with the workout and what travels', text.includes('Repeat this workout') && text.includes('2 exercises with their prescriptions; your logged sets stay in history'), text.slice(0, 160));
  const daySelect = dialog.locator('select[aria-label^="Day in"]').first();
  if (await daySelect.count()) await daySelect.selectOption({ index: 2 });
  await p.screenshot({ path: `${out}repeat-dialog-390.png` });
  await dialog.getByRole('button', { name: /^Save to Week|^Replace and save/ }).first().click(); await wait(p, 600);
  if (await p.getByRole('alertdialog').count()) { await p.getByRole('button', { name: 'Replace and save' }).last().click(); await wait(p, 600); }
  check('The dialog confirms where it was saved', await p.getByRole('heading', { name: 'Saved to your plan' }).isVisible());
  await p.getByRole('button', { name: 'Open workout' }).click(); await wait(p, 1500);
  const plan = await p.locator('body').textContent();
  check('The chosen day now holds both exercises with their prescriptions', plan.includes('Barbell Bench Press') && plan.includes('Back Squat') && plan.includes('5 × 3'), new URL(p.url()).search);
  check('History is unchanged: no set, completion or timestamp copied or altered', JSON.stringify(await stored(p)) === before);
  await p.screenshot({ path: `${out}repeat-plan-day-390.png` });
  await ctx.close();
}

await browser.close();
writeFileSync(`${out}recap-history.json`, JSON.stringify(results, null, 2));
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
