// Body Lab after the change, scrolled so the in-figure Front/Back names clear the sticky switcher.
import { browser, page, seed, wait, base, dock } from './shared.mjs';
const out = '/home/user/Sports-genome/docs/exercise-intelligence/evidence';
const [ctx, p] = await page(1024, 768); await seed(p); await p.goto(`${base}/`); await wait(p, 1800);
await dock(p, 'Body Lab'); await wait(p, 700);
await p.locator('.workspace-top-switcher button').filter({ hasText: 'Muscles' }).first().dispatchEvent('click'); await wait(p, 900);
await p.evaluate(() => { const el = document.querySelector('.atlas-body-chart-wrap'); window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 150); }); await wait(p, 400);
await p.screenshot({ path: `${out}/after-bodylab-captions-1024.png` });
await ctx.close(); await browser.close();
