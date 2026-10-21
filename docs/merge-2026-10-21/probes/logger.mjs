// The merged workout logger (main's atlas holds + the 50-exercise expansion's measures) in the
// production build (vite preview), headless Chromium at 390 px. Signed out, network stubbed.
// Viewport emulation only.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { mkdirSync } from 'node:fs';

const out = process.argv[2]; mkdirSync(out, { recursive: true });
const base = 'http://localhost:4173';
const profile = JSON.stringify({ version: 3, sportId: 'wrestling', sportContextMode: 'sport', goal: 'Muscle growth', trainingDays: 3, gymMinutes: 60, movementId: 'wrestling-17', baseline: { experience: 'Intermediate', weightUnit: 'lb', bodyWeight: 160, equipment: { gymAccess: 'Commercial gym', availableEquipment: ['Barbell', 'Dumbbells', 'Cable', 'Machine', 'Bodyweight', 'Bench', 'Free weights', 'Band', 'Kettlebell'] } } });
// Day 01: a neck hold (expansion, seconds, per side), an overhead carry (expansion, distance),
// a band neck flexion (expansion, setting), a dead hang (main's atlas hold), a back squat.
const day = [423, 451, 421, 143, 161];
const entries = day.map((id) => ({ entryId: id, catalogExerciseId: id }));
const week = { customWorkoutIds: day, weeklyPlanIds: { '0-Push': day }, customWorkoutEntries: entries, weeklyPlanEntries: { '0-Push': entries }, prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: {}, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 0 };
const plan = JSON.stringify({ version: 2, ...week, weeks: { 1: week }, activeWeek: 1 });

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const results = [];
const check = (name, pass, detail = '') => { results.push(Boolean(pass)); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`); };
const wait = (p, ms) => p.waitForTimeout(ms);

const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.route('**/api/trpc/**', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(new URL(route.request().url()).pathname.replace('/api/trpc/', '').split(',').map(() => ({ result: { data: { json: null } } }))) }));
await p.route('**qiccnqkypbhlwpmjcsri.supabase.co/**', (r) => r.abort());
await p.route(/free-exercise-db|githubusercontent/, (r) => r.abort());
await p.goto(`${base}/?workspace=command`);
await p.evaluate(([profile, plan]) => { localStorage.clear(); localStorage.setItem('gym-optimizer-athlete-profile-v1', profile); localStorage.setItem('gym-optimizer-workout-plan-v1', plan); localStorage.setItem('sports-genome-launch-experience-enabled-v1', 'off'); localStorage.setItem('sports-genome-launched-before-v1', 'yes'); }, [profile, plan]);

// The plan reads each entry's default in its own measure.
await p.goto(`${base}/?workspace=day-plan`); await wait(p, 1800);
const planText = (await p.locator('.day-orderable-exercise').allTextContents()).join(' | ');
check('Plan: the neck hold defaults to its own 20-second target', /3\s×\s20\ssec/.test(planText));
check('Plan: the carry defaults to its distance', /3\s×\s20\sm\b/.test(planText));
check('Plan: the dead hang defaults to a hold (main\'s 30 sec)', /3\s×\s30\ssec/.test(planText));
await p.screenshot({ path: `${out}/plan-390.jpg`, type: 'jpeg', quality: 70 });

// Train: the active card is the neck hold.
await p.goto(`${base}/?workspace=tracker`); await wait(p, 1500);
await p.getByRole('button', { name: /start workout/i }).first().click(); await wait(p, 900);
const card = p.locator('.live-set-entry').first();
const labels = async () => (await card.locator('label > span').allTextContents()).map((t) => t.trim());
check('Neck hold: the card asks for Seconds only', JSON.stringify(await labels()) === JSON.stringify(['Seconds']), JSON.stringify(await labels()));
check('Neck hold: the side is asked, left or right', await p.getByRole('group', { name: /Side for set 1/ }).count() === 1);
await p.getByRole('group', { name: /Side for set 1/ }).getByRole('button', { name: 'Left' }).click();
await card.locator('input').first().fill('20');
await p.screenshot({ path: `${out}/hold-card-390.jpg`, type: 'jpeg', quality: 70 });
await p.getByRole('button', { name: /^Log set/i }).first().click(); await wait(p, 700);
const stored = await p.evaluate(() => JSON.parse(localStorage.getItem('sports-genome-device-workout-history-v1') || '[]'));
const first = stored[0]?.exercises?.[0]?.sets?.[0];
check('Neck hold: logged as holdSeconds 20 with its side, no reps', first?.holdSeconds === '20' && first?.side === 'left' && first?.reps === '' && first?.completed === true, JSON.stringify(first));

// Every exercise's rows in the full workout, by what their boxes ask for.
await p.locator('.live-session-queue > summary').click(); await wait(p, 400);
const rows = await p.locator('.live-session-queue .session-exercise').evaluateAll((articles) => articles.map((a) => ({
  name: a.querySelector('strong')?.textContent?.trim(),
  boxes: [...(a.querySelector('.session-set-row:not(.session-set-complete)')?.querySelectorAll('label > span') ?? [])].map((s) => s.textContent.trim()),
})));
const boxesOf = (name) => JSON.stringify(rows.find((r) => r.name === name)?.boxes);
check('Carry rows: weight per hand, then Distance', boxesOf('Single-Arm Kettlebell Overhead Carry') === JSON.stringify(['Weight per hand', 'Distance']), boxesOf('Single-Arm Kettlebell Overhead Carry'));
check('Band rows: the band setting, then Reps', boxesOf('Band-Resisted Neck Flexion') === JSON.stringify(['Band', 'Reps']), boxesOf('Band-Resisted Neck Flexion'));
check('Dead hang rows (main\'s atlas hold): Seconds, with optional added weight', boxesOf('Dead Hang') === JSON.stringify(['Added weight', 'Seconds']), boxesOf('Dead Hang'));
check('Back squat rows: Weight, then Reps', boxesOf('Back Squat') === JSON.stringify(['Weight', 'Reps']), boxesOf('Back Squat'));

// Log a carry from its row: distance stored as distance, never as reps.
const carryRow = p.locator('.live-session-queue .session-exercise').filter({ hasText: 'Single-Arm Kettlebell Overhead Carry' }).locator('.session-set-row').first();
await carryRow.locator('label').filter({ hasText: 'Weight per hand' }).locator('input').fill('35');
await carryRow.locator('label').filter({ hasText: 'Distance' }).locator('input').fill('20');
await carryRow.locator('button.session-set-log, button[aria-pressed]').first().click(); await wait(p, 600);
const after = await p.evaluate(() => JSON.parse(localStorage.getItem('sports-genome-device-workout-history-v1') || '[]'));
const carrySet = after[0]?.exercises?.find((e) => e.exerciseName === 'Single-Arm Kettlebell Overhead Carry')?.sets?.[0];
check('Carry: logged as distance 20 m with 35 lb, no reps', carrySet?.distance === '20' && carrySet?.distanceUnit === 'm' && carrySet?.weight === '35' && carrySet?.reps === '' && carrySet?.completed === true, JSON.stringify(carrySet));
const fits = await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
check('No sideways scroll on the workout', fits);
await p.locator('.live-session-queue').scrollIntoViewIfNeeded();
await p.screenshot({ path: `${out}/queue-390.jpg`, type: 'jpeg', quality: 70, fullPage: false });

await ctx.close(); await browser.close();
const failed = results.filter((r) => !r).length;
console.log(`${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
