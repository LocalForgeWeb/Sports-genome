// "Add a comparable lift" (was "Get a Chest rank" before Oct 7): an unranked muscle group's sheet suggests the lifts that would rank it, and
// one tap opens the lift log with that exercise chosen. Headless Chromium against `vite preview`
// of the production build; tRPC answers null (no ranks), so every group is unranked. Viewport
// emulation, not a phone.
import { writeFileSync } from 'node:fs';
import { browser, base, seed, page, wait } from '../../exercise-intelligence/probes/shared.mjs';

const out = new URL('../evidence/', import.meta.url).pathname;
const results = [];
const check = (name, pass, detail = '') => { results.push({ name, pass: Boolean(pass), detail }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`); };

async function openRegion(p, label) {
  await p.goto(`${base}/?workspace=strength`); await wait(p, 2500);
  await p.getByText(/View all \d+ regions/).first().dispatchEvent('click').catch(() => {}); await wait(p, 400);
  await p.locator('.region-grid-card').filter({ hasText: new RegExp(`^${label}`) }).first().dispatchEvent('click'); await wait(p, 900);
}

for (const [width, height, label] of [[390, 844, 'phone-390'], [320, 640, 'phone-320'], [1280, 800, 'desktop-1280']]) {
  const [ctx, p] = await page(width, height);
  await seed(p);
  await openRegion(p, 'Chest');
  const section = p.locator('[data-rank-suggestions]').first();
  const names = await section.locator('.rank-suggestion-copy strong').allTextContents();
  check(`${label}: Chest sheet shows "Add a comparable lift" with Barbell Bench Press first, tagged Common option`, (await section.locator('h3').textContent()) === 'Add a comparable lift' && names[0] === 'Barbell Bench PressCommon option' && names.length === 3, names.join(' | '));
  const fits = await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1 && [...document.querySelectorAll('.rank-suggestion-log')].every((b) => { const r = b.getBoundingClientRect(); return r.height >= 43.5 && r.right <= window.innerWidth + 1; }));
  check(`${label}: rows fit, no sideways scroll, Log this lift buttons at least 44 px`, fits);
  await section.scrollIntoViewIfNeeded(); await wait(p, 300);
  await p.screenshot({ path: `${out}chest-suggestions-${label}.png` });
  if (label === 'phone-390') {
    // S06: equipment narrows the list, without touching the profile.
    await section.getByRole('combobox', { name: 'Equipment' }).selectOption('Machine'); await wait(p, 300);
    const machine = await section.locator('.rank-suggestion-copy small').allTextContents();
    check('Equipment: Machine lists machine lifts only', machine.filter((line) => line.includes(' · main mover') || line.includes(' · helper')).every((line) => line.startsWith('Machine · ')), machine.join(' | '));
    await p.screenshot({ path: `${out}chest-suggestions-machine-390.png` });
    await section.getByRole('combobox', { name: 'Equipment' }).selectOption(''); await wait(p, 300);
    await section.getByRole('button', { name: 'Log this lift: Barbell Bench Press' }).click(); await wait(p, 1200);
    const state = await p.evaluate(() => ({ sheet: !!document.querySelector('.strength-region-sheet'), open: document.querySelector('.strength-log-entry')?.open, search: document.querySelector('input[aria-label="Search and choose a catalog exercise"]')?.value, focused: document.activeElement?.getAttribute('aria-label') }));
    check('Log it closes the sheet and opens the lift log with Barbell Bench Press chosen, focus on the set', !state.sheet && state.open === true && state.search === 'Barbell Bench Press' && state.focused && state.focused !== 'Search and choose a catalog exercise', JSON.stringify(state));
    await p.screenshot({ path: `${out}chest-log-opened-390.png` });
    // S11: save the set, then the saved toast leads back to Chest (not to whichever group the lift lists first).
    const entry = p.locator('.strength-log-entry');
    const decimal = entry.locator('input[inputmode="decimal"]'); const numeric = entry.locator('input[inputmode="numeric"]');
    await decimal.first().fill('185'); if (await numeric.count()) await numeric.first().fill('5');
    await entry.locator('button.min-h-12').filter({ hasText: /save/i }).first().click(); await wait(p, 1200);
    const back = p.locator('[data-sonner-toast] button').filter({ hasText: 'Back to Chest' });
    check('After saving, the toast offers Back to Chest', await back.count() === 1, (await p.locator('[data-sonner-toast]').first().textContent().catch(() => '')) ?? '');
    if (await back.count()) { await back.click(); await wait(p, 900); }
    check('Back to Chest reopens the Chest sheet', (await p.locator('.strength-region-sheet h2, .strength-region-sheet h3').first().textContent().catch(() => ''))?.includes('Chest'));
    for (const [region, first] of [['Quadriceps', 'Back Squat'], ['Lats', 'Lat Pulldown'], ['Biceps', 'Barbell Curl']]) {
      await openRegion(p, region);
      const top = await p.locator('[data-rank-suggestions] .rank-suggestion-copy strong').first().textContent().catch(() => '');
      check(`${region}: first suggestion is ${first}`, top?.startsWith(first), top);
    }
    await openRegion(p, 'Tibialis anterior');
    const none = await p.locator('[data-rank-suggestions="none"]').textContent().catch(() => '');
    check('Tibialis anterior says no lift can rank it yet, and suggests nothing', none.includes('No lift in the comparison data ranks the tibialis anterior yet') && await p.locator('.rank-suggestion').count() === 0);
  }
  await ctx.close();
}

writeFileSync(`${out}acceptance.json`, JSON.stringify({ ranAt: new Date().toISOString(), environment: 'headless Chromium, vite preview of the production build, viewport emulation', results }, null, 1));
console.log(`${results.filter((r) => r.pass).length}/${results.length} pass`);
await browser.close();
