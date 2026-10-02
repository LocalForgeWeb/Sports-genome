// Photo order: opens Cable Lateral Raise (the reported case) and two more reversed exercises
// in Exercise Intelligence, and records which source frame each Start/Finish slot loads.
// Also renders every reversed pair as the app now orders it (start | finish). Headless Chromium;
// the sandbox has no outbound network, so frames are served from curl-fetched copies under their
// real URLs, as in docs/ux-oct1/probes/oct1.mjs.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
const S = '/tmp/claude-0/-home-user-Sports-genome/72e48dc4-5d2e-5f13-9687-9bbe2b3f83cf/scratchpad';
const out = '/home/user/Sports-genome/docs/exercise-photo-order/evidence';
const logo = readFileSync(`${S}/logo.png`);
const profile = JSON.stringify({ version: 3, sportId: 'wrestling', sportContextMode: 'sport', goal: 'Max strength', trainingDays: 5, gymMinutes: 75, movementId: 'wrestling-1', baseline: { experience: 'Intermediate', weightUnit: 'lb', bodyWeight: 145, equipment: { gymAccess: 'Commercial gym', availableEquipment: ['Barbell', 'Dumbbells', 'Cable', 'Machine', 'Bodyweight', 'Bench', 'Free weights'] } } });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const results = [];
for (const [name, source] of [['Cable Lateral Raise', 'Standing_Low-Pulley_Deltoid_Raise'], ['Parallel-Bar Dip', 'Parallel_Bar_Dip'], ['Smith Machine Bench Press', 'Smith_Machine_Bench_Press'], ['Dumbbell Lateral Raise', 'Side_Lateral_Raise']]) {
  const p = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await p.route('**qiccnqkypbhlwpmjcsri.supabase.co/**', (r) => r.request().url().endsWith('.mp4') ? r.abort() : r.fulfill({ contentType: 'image/png', body: logo }));
  await p.route('**/api/trpc/**', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(new URL(route.request().url()).pathname.replace('/api/trpc/', '').split(',').map(() => ({ result: { data: { json: null } } }))) }));
  await p.route(/free-exercise-db/, (route) => { const raw = route.request().url().replace(/^https:\/\/cdn\.jsdelivr\.net\/gh\/yuhonas\/free-exercise-db@([^/]+)\//, 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/$1/'); const file = `${S}/photos/cache/${raw.split('/exercises/')[1].replace(/\//g, '__')}`; if (!existsSync(file)) { try { execSync(`curl -sS -f -o "${file}" "${raw}"`); } catch { return route.abort(); } } return route.fulfill({ path: file, contentType: 'image/jpeg' }); });
  await p.goto('http://localhost:4173/?workspace=command'); await p.evaluate((profile) => { localStorage.clear(); localStorage.setItem('gym-optimizer-athlete-profile-v1', profile); localStorage.setItem('sports-genome-launch-experience-enabled-v1', 'off'); }, profile);
  await p.goto('http://localhost:4173/?workspace=catalog'); await p.waitForTimeout(2000);
  await p.locator('.catalog-discovery-search input').fill(name); await p.waitForTimeout(700);
  await p.locator('.catalog-discovery-row-copy').filter({ has: p.locator('strong', { hasText: new RegExp(`^${name}$`) }) }).first().dispatchEvent('click'); await p.waitForTimeout(2500);
  const slots = await p.evaluate(() => [...document.querySelectorAll('.exercise-intelligence .exercise-media-frame')].map((f) => ({ caption: f.querySelector('small')?.textContent, frame: f.querySelector('img')?.getAttribute('src')?.match(/\/(\d)\.jpg$/)?.[1], loaded: f.querySelector('img')?.naturalWidth > 0 })));
  await p.evaluate(() => document.querySelector('.exercise-intelligence .exercise-media-detail')?.scrollIntoView({ block: 'center' })); await p.waitForTimeout(300);
  const file = `after-${name.toLowerCase().replace(/[^a-z]+/g, '-')}-390.png`;
  await p.screenshot({ path: `${out}/${file}` });
  results.push({ name, source, slots, screenshot: file });
  console.log(name, JSON.stringify(slots));
  await p.close();
}
// Every reversed pair as the app now shows it.
const reversed = JSON.parse(readFileSync('/home/user/Sports-genome/client/src/data/exercisePhotoOrder.json', 'utf8'));
const list = Object.keys(reversed);
const page = await browser.newPage({ viewport: { width: 1100, height: 400 } });
for (let i = 0; i < list.length; i += 10) {
  const rows = list.slice(i, i + 10);
  writeFileSync(`${S}/zoom/after.html`, `<body style="margin:0;font:13px sans-serif">${rows.map((src) => `<div style="display:flex;gap:6px;align-items:center;border-bottom:2px solid #333;padding:3px"><div style="width:260px"><b>${src}</b></div>${[[1, 'START'], [0, 'FINISH']].map(([f, label]) => `<div style="position:relative"><img src="file://${S}/photos/cache/${src}__${f}.jpg" style="height:150px"><b style="position:absolute;left:0;top:0;background:#123;color:#fff;padding:1px 6px">${label}</b></div>`).join('')}</div>`).join('')}</body>`);
  await page.goto(`file://${S}/zoom/after.html`); await page.waitForLoadState('load');
  await page.screenshot({ path: `${out}/after-reversed-${i / 10 + 1}.png`, fullPage: true });
}
writeFileSync(`${out}/app-check.json`, JSON.stringify(results, null, 1));
await browser.close();
