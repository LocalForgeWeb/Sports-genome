// Quick look during the build: the overlay's views at one width.
import { browser, page, seed, draft, openExercise, wait, base } from './shared.mjs';
const scratch = '/tmp/claude-0/-home-user-Sports-genome/72e48dc4-5d2e-5f13-9687-9bbe2b3f83cf/scratchpad/look';
import { mkdirSync } from 'node:fs'; mkdirSync(scratch, { recursive: true });
const [w, h] = [Number(process.argv[2] || 390), Number(process.argv[3] || 844)];
const name = process.argv[4] || 'Barbell Bench Press';
const [ctx, p] = await page(w, h); await seed(p); await p.goto(`${base}/`); await wait(p, 1800); await draft(p);
p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await openExercise(p, name);
await p.screenshot({ path: `${scratch}/top-${w}.png` });
const shoot = async (tag, sel) => { if (sel) await p.evaluate((s) => { const el = document.querySelector(s); const body = document.querySelector('.exercise-intelligence-body'); if (el && body) body.scrollTop = el.offsetTop - 8; }, sel); await wait(p, 350); await p.screenshot({ path: `${scratch}/${tag}-${w}.png` }); };
await shoot('profile', '.ei-profile');
for (const tab of ['Muscle Genome', 'Mechanics', 'Context']) { await p.locator('.ei-tab').filter({ hasText: tab }).first().click(); await wait(p, 600); await shoot(tab.split(' ')[0].toLowerCase()); }
console.log(JSON.stringify(await p.evaluate(() => ({ h1: document.querySelector('#exercise-intelligence-title')?.textContent, glance: document.querySelector('.ei-glance')?.textContent?.slice(0, 400) }))));
await ctx.close(); await browser.close();
