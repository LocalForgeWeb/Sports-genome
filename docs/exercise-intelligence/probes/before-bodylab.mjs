// Body Lab's muscle map as it shipped, for the anatomy before/after.
import { browser, page, seed, wait, base, dock } from './shared.mjs';
const out = '/home/user/Sports-genome/docs/exercise-intelligence/evidence';
const tag = process.argv[2] || 'before';
for (const [w, h] of [[390, 844], [1024, 768]]) {
  const [ctx, p] = await page(w, h); await seed(p); await p.goto(`${base}/`); await wait(p, 1800);
  await dock(p, 'Body Lab'); await wait(p, 700);
  await p.locator('.workspace-top-switcher button').filter({ hasText: 'Muscles' }).first().dispatchEvent('click'); await wait(p, 900);
  await p.evaluate(() => document.querySelector('.atlas-body-chart-wrap')?.scrollIntoView({ block: 'start' })); await p.evaluate(() => window.scrollBy(0, -70)); await wait(p, 400);
  await p.screenshot({ path: `${out}/${tag}-bodylab-${w}.png` });
  await ctx.close();
}
await browser.close();
