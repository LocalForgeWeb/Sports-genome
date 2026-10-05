// Shared harness for the Exercise Intelligence redesign checks: headless Chromium against
// `vite preview`, isolated localStorage, no outbound network (tRPC answers null, photographs
// come from a curl cache of the pinned URLs). Not a phone; not a user.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
export const scratch = '/tmp/claude-0/-home-user-Sports-genome/72e48dc4-5d2e-5f13-9687-9bbe2b3f83cf/scratchpad';
export const base = 'http://localhost:4173';
const logo = readFileSync(`${scratch}/logo.png`);
mkdirSync(`${scratch}/photos/cache`, { recursive: true });
export const profile = JSON.stringify({ version: 3, sportId: 'wrestling', sportContextMode: 'sport', goal: 'Max strength', trainingDays: 5, gymMinutes: 75, movementId: 'wrestling-17', baseline: { experience: 'Intermediate', weightUnit: 'lb', bodyWeight: 145, sexForReference: 'male', equipment: { gymAccess: 'Commercial gym', availableEquipment: ['Barbell', 'Dumbbells', 'Cable', 'Machine', 'Bodyweight', 'Bench', 'Free weights'] } } });
export const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
export const wire = async (p, { trpc } = {}) => {
  await p.route('**qiccnqkypbhlwpmjcsri.supabase.co/**', (r) => r.request().url().endsWith('.mp4') ? r.abort() : r.fulfill({ contentType: 'image/png', body: logo }));
  await p.route('**/api/trpc/**', (route) => trpc ? trpc(route) : route.fulfill({ contentType: 'application/json', body: JSON.stringify(new URL(route.request().url()).pathname.replace('/api/trpc/', '').split(',').map(() => ({ result: { data: { json: null } } }))) }));
  await p.route(/free-exercise-db/, async (route) => {
    const url = route.request().url();
    const raw = url.replace(/^https:\/\/cdn\.jsdelivr\.net\/gh\/yuhonas\/free-exercise-db@([^/]+)\//, 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/$1/');
    const file = `${scratch}/photos/cache/${raw.split('/exercises/')[1].replace(/\//g, '__')}`;
    if (!existsSync(file)) { try { execSync(`curl -sS -f -o "${file}" "${raw}"`, { timeout: 30000 }); } catch { return route.abort(); } }
    return route.fulfill({ path: file, contentType: 'image/jpeg' });
  });
};
export const wait = (p, ms) => p.waitForTimeout(ms);
export const seed = async (p, extra = {}) => { await p.goto(`${base}/?workspace=command`); await p.evaluate(([profile, extra]) => { localStorage.clear(); localStorage.setItem('gym-optimizer-athlete-profile-v1', profile); localStorage.setItem('sports-genome-launch-experience-enabled-v1', 'off'); localStorage.setItem('sports-genome-launched-before-v1', 'yes'); for (const [k, v] of Object.entries(extra)) localStorage.setItem(k, v); }, [profile, extra]); };
export const dock = (p, l) => p.locator('.mobile-bottom-nav button').filter({ hasText: l }).first().dispatchEvent('click');
export const page = async (width = 390, height = 844, opts = {}) => { const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, ...(opts.context || {}) }); const p = await ctx.newPage(); await wire(p, opts); return [ctx, p]; };
export const draft = async (p) => { await dock(p, 'Train'); await wait(p, 1200); await p.locator('.day-plan-draft > summary').first().dispatchEvent('click').catch(() => {}); await wait(p, 400); await p.locator('.day-plan-draft button').filter({ hasText: /Draft this (session|workout)/i }).first().dispatchEvent('click').catch(() => {}); await wait(p, 1200); await p.waitForSelector('[data-sonner-toast]', { state: 'detached', timeout: 8000 }).catch(() => {}); };
/** Opens the catalog, searches the name and opens the first result's overlay. */
export const openExercise = async (p, name) => {
  await p.goto(`${base}/?workspace=catalog`); await wait(p, 1500);
  const input = p.locator('.catalog-discovery input[type="search"], .catalog-discovery input').first();
  await input.fill(name); await wait(p, 700);
  const row = p.locator('.catalog-discovery-row').filter({ has: p.locator('strong', { hasText: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }) }).first();
  await row.locator('.catalog-discovery-row-copy').first().click(); await wait(p, 900);
};
