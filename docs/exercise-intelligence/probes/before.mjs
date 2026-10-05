// The overlay as it shipped (eaf8d5f), at the brief's widths, before any change.
import { browser, page, seed, draft, openExercise, wait, base } from './shared.mjs';
const out = '/home/user/Sports-genome/docs/exercise-intelligence/evidence';
const shots = [[390, 844], [800, 900], [1024, 768]];
for (const [w, h] of shots) {
  const [ctx, p] = await page(w, h); await seed(p); await p.goto(`${base}/`); await wait(p, 2000); await draft(p);
  await openExercise(p, 'Barbell Bench Press');
  await p.screenshot({ path: `${out}/before-top-${w}.png` });
  await p.evaluate(() => document.querySelector('.genome-panel')?.scrollIntoView({ block: 'start' })); await wait(p, 400);
  await p.screenshot({ path: `${out}/before-fingerprint-${w}.png` });
  await p.evaluate(() => document.querySelector('.genome-quicknote')?.scrollIntoView({ block: 'center' })); await wait(p, 300);
  await p.screenshot({ path: `${out}/before-fastread-${w}.png` });
  await p.evaluate(() => document.querySelector('.exercise-intelligence-muscles')?.scrollIntoView({ block: 'start' })); await wait(p, 300);
  await p.screenshot({ path: `${out}/before-anatomy-${w}.png` });
  const info = await p.evaluate(() => ({ name: document.querySelector('.exercise-intelligence h1')?.textContent, add: document.querySelector('.exercise-intelligence-add')?.textContent, bars: [...document.querySelectorAll('.genome-fingerprint-bars .genome-meter')].map((m) => m.textContent), quick: document.querySelector('.genome-quicknote')?.textContent }));
  console.log(w, JSON.stringify(info));
  await ctx.close();
}
await browser.close();
