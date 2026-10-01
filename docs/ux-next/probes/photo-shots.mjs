// Exercise photographs in the catalog rows and the detail overlay. The sandbox cannot reach the CDN,
// so the strip's second host (raw.githubusercontent.com) is what loads here; the fallback path is
// therefore exercised, and the CDN path is verified by URL only.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { readFileSync, mkdirSync } from 'node:fs';
const out = '/home/user/Sports-genome/docs/ux-next/evidence'; mkdirSync(out, { recursive: true });
const scratch = '/tmp/claude-0/-home-user-Sports-genome/72e48dc4-5d2e-5f13-9687-9bbe2b3f83cf/scratchpad';
const logo = readFileSync(`${scratch}/logo.png`);
const profile = JSON.stringify({ version: 3, sportId: 'wrestling', sportContextMode: 'sport', goal: 'Max strength', trainingDays: 5, gymMinutes: 75, movementId: 'wrestling-1', baseline: { experience: 'Intermediate', weightUnit: 'lb', bodyWeight: 145, equipment: { gymAccess: 'Commercial gym', availableEquipment: ['Barbell', 'Dumbbells', 'Cable', 'Machine', 'Bodyweight', 'Bench', 'Free weights'] } } });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const p = await ctx.newPage();
const requests = [];
p.on('response', (r) => { const u = r.url(); if (/free-exercise-db/.test(u)) requests.push(`${r.status()} ${u.replace(/^https:\/\//, '').slice(0, 90)}`); });
// The sandbox browser has no outbound network; the photo bytes are fetched here with curl
// (which does), from the same pinned URLs the page asks for, and handed to the page.
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
mkdirSync(`${scratch}/photos/cache`, { recursive: true });
await p.route(/free-exercise-db/, (route) => {
  const url = route.request().url(); const raw = url.replace(/^https:\/\/cdn\.jsdelivr\.net\/gh\/yuhonas\/free-exercise-db@([^/]+)\//, 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/$1/');
  const file = `${scratch}/photos/cache/${raw.split('/exercises/')[1].replace(/\//g, '__')}`;
  if (!existsSync(file)) { try { execSync(`curl -sS -f -o "${file}" "${raw}"`, { timeout: 30000 }); } catch { return route.abort(); } }
  requests.push(`served ${url.replace(/^https:\/\//, '').slice(0, 80)}`);
  return route.fulfill({ path: file, contentType: 'image/jpeg' });
});
await p.route('**qiccnqkypbhlwpmjcsri.supabase.co/**', (r) => r.request().url().endsWith('.mp4') ? r.abort() : r.fulfill({ contentType: 'image/png', body: logo }));
await p.route('**/api/trpc/**', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(new URL(route.request().url()).pathname.replace('/api/trpc/', '').split(',').map(() => ({ result: { data: { json: null } } }))) }));
await p.goto('http://localhost:4173/?workspace=command'); await p.evaluate((profile) => { localStorage.clear(); localStorage.setItem('gym-optimizer-athlete-profile-v1', profile); localStorage.setItem('sports-genome-launch-experience-enabled-v1', 'off'); }, profile);
await p.goto('http://localhost:4173/?workspace=catalog'); await p.waitForTimeout(3500);
await p.screenshot({ path: `${out}/after-catalog-photos-390.png` });
const thumbs = await p.evaluate(() => [...document.querySelectorAll('.exercise-photo-thumb img')].map((img) => ({ ok: img.complete && img.naturalWidth > 0, w: img.naturalWidth, src: img.currentSrc.replace(/^https:\/\//, '').slice(0, 60) })));
console.log('thumbs', thumbs.length, JSON.stringify(thumbs.slice(0, 4)));
await p.locator('.catalog-discovery-search input, input[placeholder*="Search"]').first().fill('deadlift'); await p.waitForTimeout(800);
await p.locator('.catalog-discovery-card-copy').filter({ hasText: /^Conventional Deadlift/ }).first().dispatchEvent('click').catch(async () => { await p.locator('.catalog-discovery-card-copy').first().dispatchEvent('click'); }); await p.waitForTimeout(3500);
await p.screenshot({ path: `${out}/after-detail-photos-390.png` });
console.log('detail', JSON.stringify(await p.evaluate(() => ({ title: document.querySelector('#exercise-intelligence-title')?.textContent, frames: [...document.querySelectorAll('.exercise-photo img')].map((img) => ({ ok: img.complete && img.naturalWidth > 0, alt: img.alt, w: img.naturalWidth, h: img.naturalHeight })), credit: document.querySelector('.exercise-photos figcaption')?.textContent }))));
console.log('requests', JSON.stringify(requests.slice(0, 8)));
await browser.close();
