// Percentile-ceiling brief §8 and §10: the lats sheet for the two screenshots, rendered by the
// production build (vite preview) in headless Chromium. The rank route is answered with the
// server's own output for those lifts (scoreMuscleProfile over the database's recorded
// answers, server/fixtures/latsScreenshots.ts); everything else answers null. Viewport
// emulation only: not a phone, not a person.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { browser, base, seed, page, wait } from '../../exercise-intelligence/probes/shared.mjs';

const responses = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const out = process.argv[3]; mkdirSync(out, { recursive: true });
const results = [];
const check = (name, pass, detail = '') => { results.push({ name, pass: Boolean(pass), detail }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`); };

const lb = (pounds) => Number((pounds * 0.45359237).toFixed(3));
const obs = (id, name, date, pounds, reps) => ({ id, exerciseName: name, observedAt: `${date}T12:00:00.000Z`, measurementType: 'MULTI_REP', loadKg: lb(pounds), repetitions: reps, bodyMassKgAtTest: 65.77 });
const scenarios = {
  A: [obs('a-lp', 'Lat Pulldown', '2026-09-26', 187, 6), obs('a-row', 'Machine Low Row', '2026-10-13', 600, 12)],
  B: [obs('b-lp', 'Lat Pulldown', '2026-10-13', 350, 1), obs('b-row', 'Machine Low Row', '2026-10-13', 325, 8)],
};

const trpcFor = (scenario) => (route) => {
  const url = new URL(route.request().url());
  const procs = url.pathname.replace('/api/trpc/', '').split(',');
  const body = procs.map((proc) => ({ result: { data: { json: proc === 'strengthProfile.muscleRanks' ? responses[scenario] : null } } }));
  return route.fulfill({ contentType: 'application/json', body: JSON.stringify(url.searchParams.get('batch') ? body : body[0]) });
};

async function openLats(p) {
  await p.goto(`${base}/?workspace=strength`); await wait(p, 2500);
  await p.getByText(/View all \d+ regions/).first().dispatchEvent('click').catch(() => {}); await wait(p, 400);
  await p.locator('.region-grid-card').filter({ hasText: /^Lats/ }).first().dispatchEvent('click'); await wait(p, 1200);
}

for (const scenario of ['A', 'B']) {
  for (const [width, height, label] of [[390, 844, '390'], [320, 640, '320']]) {
    const [ctx, p] = await page(width, height, { trpc: trpcFor(scenario) });
    await seed(p, { 'sports-genome-device-strength-observations-v1': JSON.stringify(scenarios[scenario]) });
    await openLats(p);
    const rank = p.locator('.rank-card').first();
    const present = await rank.count();
    check(`${scenario} ${label}: the Lats sheet shows a rank card`, present === 1);
    if (!present) { await p.screenshot({ path: `${out}/lats-${scenario}-${label}-missing.png` }); await ctx.close(); continue; }
    const text = (await rank.evaluate((n) => n.textContent)).replace(/\s+/g, ' ');
    const name = (await rank.locator('.rank-name').textContent()).trim();
    const score = await rank.locator('.rank-percentile').innerText();
    if (scenario === 'A') {
      check(`A ${label}: State Circuit, benchmark score 91–92`, name === 'State Circuit' && score === 'Benchmark score 91–92', `${name} · ${score}`);
      check(`A ${label}: the row is above the 95th-percentile benchmark, the pulldown 89th`, text.includes('Machine Low Row · above the 95th-percentile benchmark') && text.includes('Lat Pulldown · 89th percentile on its own'));
      check(`A ${label}: placed 6.41× against the 1.75× benchmark`, text.includes('Placed at 6.41× body weight once scaled for age, against the 95th-percentile benchmark of 1.75×.'));
    } else {
      check(`B ${label}: National Circuit at least, benchmark score above 95`, name === 'National Circuit' && score === 'Benchmark score above 95' && text.includes('Minimum rank'), `${name} · ${score}`);
      check(`B ${label}: no 94 and no exact 95th anywhere on the card`, !/\b94\b|95th percentile on its own/.test(text), text.slice(0, 200));
    }
    check(`${scenario} ${label}: the excluded pulldown is still named, with its reason`, text.includes('Not counted: Wide-Grip Cable Lat Pulldown (not in the comparison library yet)'));
    const fits = await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1 && [...document.querySelectorAll('.rank-card *')].every((n) => n.getBoundingClientRect().right <= window.innerWidth + 1));
    check(`${scenario} ${label}: no sideways scroll`, fits);
    await rank.scrollIntoViewIfNeeded(); await wait(p, 300);
    await p.screenshot({ path: `${out}/lats-${scenario}-${label}.png` });
    // How this is calculated, opened.
    await rank.locator('details summary').filter({ hasText: 'How this is calculated' }).click(); await wait(p, 400);
    const arithmetic = await rank.locator('[data-rank-arithmetic]').innerText().catch(() => '');
    check(`${scenario} ${label}: the arithmetic is shown`, scenario === 'A' ? arithmetic === '89.4 × 68% + above 95 × 32% = 91.2 to 92.8' : arithmetic === 'above 95 × 68% + above 95 × 32% = above 95', arithmetic);
    await rank.locator('details').scrollIntoViewIfNeeded(); await wait(p, 300);
    await p.screenshot({ path: `${out}/lats-${scenario}-${label}-calculation.png` });
    await ctx.close();
  }
}
writeFileSync(`${out}/lats-sheet.json`, JSON.stringify(results, null, 2));
console.log(`${results.filter((r) => r.pass).length}/${results.length} pass`);
await browser.close();
