// Second end-to-end pass (Oct 4 brief, acceptance matrix): a week shared in order; a lost
// response retried without a second link; the plan edited after sharing; an updated version
// published; another device trying to manage the link; what the public API returns; phone
// widths. Two browser profiles against `node dist/index.js` (production, SHARE_STORE=memory).
import { browser, wire, profile } from '../../exercise-intelligence/probes/shared.mjs';
import { readFileSync, writeFileSync } from 'node:fs';

const base = process.env.BASE ?? 'http://localhost:4180';
const out = new URL('../evidence/', import.meta.url).pathname;
const checks = [];
const check = (id, name, ok, detail = '') => { checks.push({ id, name, ok: Boolean(ok), detail: String(detail).slice(0, 400) }); console.log(`${ok ? 'PASS' : 'FAIL'} ${id} ${name}${detail ? ` — ${String(detail).slice(0, 160)}` : ''}`); };
const wait = (p, ms) => p.waitForTimeout(ms);
const shot = (p, name, opts = {}) => p.screenshot({ path: `${out}${name}.png`, ...opts });
async function newProfile(width, height, extra = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, ...extra });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
  const p = await ctx.newPage();
  await wire(p, { trpc: (route) => route.continue() });
  return [ctx, p];
}
const openLink = async (p, url) => { await p.goto(url); await p.waitForSelector('h1', { timeout: 15000 }); await wait(p, 400); };
const draftOpenDay = async (p) => {
  await p.locator('.day-plan-draft > summary').first().dispatchEvent('click').catch(() => {}); await wait(p, 400);
  await p.locator('.day-plan-draft button').filter({ hasText: /Draft this (session|workout)/i }).first().dispatchEvent('click').catch(() => {}); await wait(p, 1500);
  await p.waitForSelector('[data-sonner-toast]', { state: 'detached', timeout: 8000 }).catch(() => {});
};
const trpcGet = async (p, path, input) => (await p.request.get(`${base}/api/trpc/${path}?input=${encodeURIComponent(JSON.stringify({ json: input }))}`)).json();
const trpcPost = async (p, path, input) => { const res = await p.request.post(`${base}/api/trpc/${path}`, { data: { json: input }, headers: { 'content-type': 'application/json' } }); return { status: res.status(), body: await res.json() }; };

// ── Sender plans two days and shares the week ────────────────────────────────────────
const [senderCtx, sender] = await newProfile(390, 844);
await sender.goto(`${base}/?workspace=command`);
await sender.evaluate((profile) => { localStorage.clear(); localStorage.setItem('gym-optimizer-athlete-profile-v1', profile); localStorage.setItem('sports-genome-launch-experience-enabled-v1', 'off'); localStorage.setItem('sports-genome-launched-before-v1', 'yes'); }, profile);
await sender.goto(`${base}/?workspace=day-plan`); await wait(sender, 1500);
await draftOpenDay(sender);
await sender.locator('.training-plan-day').nth(1).click(); await wait(sender, 800);
await draftOpenDay(sender);
const dayLabels = await sender.$$eval('.training-plan-day', (days) => days.slice(0, 2).map((day) => day.firstChild?.textContent?.trim()));
await sender.locator('.day-action-share').first().click(); await wait(sender, 800);
await sender.locator('.share-scope-option').filter({ hasText: 'Week 1' }).click(); await wait(sender, 300);
const weekTitle = await sender.getByRole('textbox', { name: 'Title' }).inputValue();
check('W1', 'The week can be chosen once two days are planned; its title names the days in order', weekTitle === `Week 1 · ${dayLabels.join(', ')}`, weekTitle);
await shot(sender, '20-composer-week-phone');

// The first answer is lost after the server made the link; the retry must return that same link.
let lost = 0;
const answers = [];
await sender.route('**/api/trpc/shares.create**', async (route) => {
  const response = await route.fetch();
  const body = await response.text();
  answers.push(JSON.parse(body));
  if (lost++ === 0) return route.abort('connectionreset');
  return route.fulfill({ response, body });
});
await sender.getByRole('button', { name: /Create link/ }).click(); await wait(sender, 800);
const failure = await sender.getByRole('alert').innerText().catch(() => '');
check('W2', 'A lost answer says what happened and keeps what was entered', /what you entered is kept/.test(failure) && (await sender.getByRole('textbox', { name: 'Title' }).inputValue()) === weekTitle, failure);
await shot(sender, '21-create-failed-phone');
await sender.getByRole('button', { name: 'Try again' }).click();
await sender.getByRole('textbox', { name: 'Share link' }).waitFor({ timeout: 8000 });
const weekLink = await sender.getByRole('textbox', { name: 'Share link' }).inputValue();
const made = answers.map((answer) => answer[0]?.result?.data?.json ?? answer.result?.data?.json);
check('W3', 'Try again returns the link the lost attempt made - one share, not two', made.length === 2 && made[0].token === made[1].token && made[1].reused === true && weekLink.endsWith(made[0].token), JSON.stringify(made.map((m) => ({ token: m.token, reused: m.reused }))));
await sender.unroute('**/api/trpc/shares.create**');
await sender.keyboard.press('Escape'); await wait(sender, 300);

// ── Recipient reads the week ──────────────────────────────────────────────────────────
const [viewCtx, viewer] = await newProfile(390, 844);
await openLink(viewer, weekLink);
const sections = await viewer.$$eval('.sw-day-title', (days) => days.map((day) => day.textContent?.trim()));
const overview = await viewer.locator('.sw-overview a').count();
const firstCount = await viewer.locator('.sw-row').count();
check('W4', 'The week arrives as its days in order, with an overview to jump between them', sections.length === 2 && sections[0].includes(dayLabels[0]) && sections[1].includes(dayLabels[1]) && overview === 2, sections.join(' | '));
await shot(viewer, '22-recipient-week-phone');

// ── The sender edits the plan: the link doesn't change until an update is published ────
const removable = sender.locator('.remove-prescription').first();
const removedName = (await removable.getAttribute('aria-label'))?.replace(/^Remove /, '');
await removable.dispatchEvent('click'); await wait(sender, 600);
await openLink(viewer, weekLink);
check('W5', 'Editing the plan after sharing leaves the shared copy as it was', (await viewer.locator('.sw-row').count()) === firstCount && (await viewer.locator('.sw-view').innerText()).includes(removedName), `${removedName} removed from the plan; link still has ${firstCount} exercises`);
await sender.locator('.day-action-share').first().click(); await wait(sender, 800);
await sender.locator('.share-scope-option').filter({ hasText: 'Week 1' }).click(); await wait(sender, 300);
await sender.getByRole('button', { name: 'Your shared links' }).click(); await wait(sender, 1000);
await shot(sender, '23-publish-update-phone');
await sender.getByRole('button', { name: 'Publish updated version' }).click(); await wait(sender, 1200);
const published = await sender.locator('.shared-links-status').innerText().catch(() => '');
check('W6', 'Publish updated version makes version 2 at a new link', /Version 2 published at a new link/.test(published), published);
await shot(sender, '24-version-2-phone');
await sender.keyboard.press('Escape'); await wait(sender, 300);
await openLink(viewer, weekLink);
const notice = await viewer.locator('.sp-newer').innerText().catch(() => '');
check('W7', 'The old link still shows what was shared, and points to the newer version', /newer version/.test(notice) && (await viewer.locator('.sw-row').count()) === firstCount, notice);
await shot(viewer, '25-older-version-phone');
await viewer.getByRole('link', { name: 'View the newer version' }).click(); await viewer.waitForSelector('.sw-row', { timeout: 10000 }); await wait(viewer, 500);
check('W8', 'The newer version has the edit', (await viewer.locator('.sw-row').count()) === firstCount - 1 && /version 2/i.test(await viewer.locator('.sw-facts').innerText()), `${await viewer.locator('.sw-row').count()} exercises`);

// ── Another device can't manage the link; the public answer holds only the workout ─────
const token = weekLink.split('/s/')[1];
const forged = await trpcPost(viewer, 'shares.disable', { token, manageSecret: 'x'.repeat(43) });
const stillOn = await trpcGet(viewer, 'shares.get', { token });
check('I1', 'Another device can\'t turn the link off', forged.status === 403 && stillOn.result?.data?.json?.state === 'active', `HTTP ${forged.status}`);
const mine = await trpcPost(viewer, 'shares.mine', { items: [{ token, manageSecret: 'x'.repeat(43) }] });
check('I2', 'Nor learn anything about it from the management list', JSON.stringify(mine.body.result?.data?.json) === JSON.stringify([{ token, state: 'forbidden' }]));
const publicShare = stillOn.result?.data?.json ?? {};
const keys = Object.keys(publicShare).sort();
const snapshotKeys = Object.keys(publicShare.snapshot ?? {}).sort();
const exerciseKeys = Array.from(new Set((publicShare.snapshot?.days ?? []).flatMap((day) => day.exercises.flatMap((exercise) => Object.keys(exercise))))).sort();
const allowedExercise = ['catalogId', 'equipment', 'movement', 'name', 'notes', 'order', 'prescription', 'prescriptionIsDefault', 'rest', 'rpe'];
check('I3', 'The public answer is the approved snapshot only - no secret, hash, request key or account', JSON.stringify(keys) === JSON.stringify(['createdAt', 'newerToken', 'snapshot', 'state', 'token', 'version']) && snapshotKeys.every((key) => ['attribution', 'days', 'description', 'goal', 'schema', 'scope', 'sport', 'title', 'week'].includes(key)) && exerciseKeys.every((key) => allowedExercise.includes(key)) && !/manage|hash|request_key|email/i.test(JSON.stringify(publicShare)), `${keys.join(',')} / ${snapshotKeys.join(',')} / ${exerciseKeys.join(',')}`);

// ── Widths and larger text: nothing runs off the side ─────────────────────────────────
const widths = [];
for (const [width, zoom] of [[320, 1], [375, 1], [390, 1], [430, 1], [390, 1.5]]) {
  const [ctx, p] = await newProfile(width, 800);
  await openLink(p, weekLink);
  if (zoom !== 1) { await p.evaluate((zoom) => { document.documentElement.style.fontSize = `${16 * zoom}px`; }, zoom); await wait(p, 300); }
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const headerFits = await p.evaluate(() => { const brand = document.querySelector('.sp-brand')?.getBoundingClientRect(); const open = document.querySelector('.sp-open')?.getBoundingClientRect(); return Boolean(brand && open && brand.right <= open.left + 1); });
  widths.push({ width, zoom, overflow, headerFits });
  if (width === 320 || zoom !== 1) await shot(p, `26-recipient-${width}${zoom !== 1 ? '-large-text' : ''}`);
  await ctx.close();
}
check('V1', 'At 320, 375, 390 and 430 px, and with 150% text, nothing scrolls sideways and the header fits', widths.every((entry) => entry.overflow <= 0 && entry.headerFits), JSON.stringify(widths));

writeFileSync(`${out}sharing-e2e-week.json`, JSON.stringify({ base, ranAt: new Date().toISOString(), weekLink, checks }, null, 2));
console.log(`${checks.filter((c) => c.ok).length}/${checks.length} passed`);
await senderCtx.close(); await viewCtx.close(); await browser.close();
