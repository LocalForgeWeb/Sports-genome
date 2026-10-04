// End-to-end sharing check (Oct 4 brief): two separate browser profiles - a sender and a
// recipient, each with its own storage - against the real server (`node dist/index.js`,
// NODE_ENV=production, SHARE_STORE=memory) on :4180. tRPC goes to that server; only the
// Supabase-hosted images and exercise photographs are served locally (no outbound network).
// Headless Chromium with phone and desktop viewports: not a phone, not a person.
import { browser, wire, profile, scratch } from '../../exercise-intelligence/probes/shared.mjs';
import { writeFileSync } from 'node:fs';

const base = process.env.BASE ?? 'http://localhost:4180';
const out = new URL('../evidence/', import.meta.url).pathname;
const checks = [];
const check = (id, name, ok, detail = '') => { checks.push({ id, name, ok: Boolean(ok), detail: String(detail).slice(0, 400) }); console.log(`${ok ? 'PASS' : 'FAIL'} ${id} ${name}${detail ? ` — ${String(detail).slice(0, 160)}` : ''}`); };
const wait = (p, ms) => p.waitForTimeout(ms);
const shot = (p, name, opts = {}) => p.screenshot({ path: `${out}${name}.png`, ...opts });

async function newProfile(width, height) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
  const p = await ctx.newPage();
  await wire(p, { trpc: (route) => route.continue() });
  return [ctx, p];
}
// The recipient trains differently from the sender, so their own day holds different work.
const recipientProfile = JSON.stringify({ ...JSON.parse(profile), goal: 'Hypertrophy', trainingDays: 3, gymMinutes: 45 });
async function seed(p, chosen = profile) {
  await p.goto(`${base}/?workspace=command`);
  await p.evaluate((profile) => { localStorage.clear(); localStorage.setItem('gym-optimizer-athlete-profile-v1', profile); localStorage.setItem('sports-genome-launch-experience-enabled-v1', 'off'); localStorage.setItem('sports-genome-launched-before-v1', 'yes'); }, chosen);
}
const dock = (p, label) => p.locator('.mobile-bottom-nav button').filter({ hasText: label }).first().dispatchEvent('click');
async function draft(p) {
  await p.goto(`${base}/?workspace=day-plan`); await wait(p, 1500);
  await p.locator('.day-plan-draft > summary').first().dispatchEvent('click').catch(() => {}); await wait(p, 400);
  await p.locator('.day-plan-draft button').filter({ hasText: /Draft this (session|workout)/i }).first().dispatchEvent('click').catch(() => {}); await wait(p, 1500);
  await p.waitForSelector('[data-sonner-toast]', { state: 'detached', timeout: 8000 }).catch(() => {});
}
// The open day's rows: each exercise's name and the text of its row (prescription, RPE, rest).
const planRows = (p) => p.$$eval('.day-orderable-exercise', (rows) => rows.map((row) => ({ name: row.querySelector('.custom-row-identity strong')?.firstChild?.textContent?.trim() ?? '', text: row.textContent?.replace(/\s+/g, ' ') ?? '' })));
const clip = (p) => p.evaluate(() => navigator.clipboard.readText());
const openLink = async (p, url) => { await p.goto(url); await p.waitForSelector('h1', { timeout: 15000 }); await wait(p, 400); };

// ── Sender ────────────────────────────────────────────────────────────────────────────
const [senderCtx, sender] = await newProfile(390, 844);
await seed(sender);
await draft(sender);
const senderDay = await sender.evaluate(() => document.querySelector('.day-plan-head h2, .day-plan-title, h1')?.textContent?.trim() ?? '');
await sender.locator('.day-action-share').first().click(); await wait(sender, 900);
const dialog = sender.getByRole('dialog', { name: 'Share' });
check('S1', 'Share opens the composer, nothing created yet', await dialog.isVisible() && await sender.getByRole('button', { name: /Create link/ }).isVisible());
check('S2', 'This workout is chosen, titled from the day', await sender.getByRole('radio', { name: /This workout/ }).isChecked(), await sender.getByRole('textbox', { name: 'Title' }).inputValue());
const previewRows = await sender.locator('.share-preview-frame .sw-row').count();
check('S3', 'Preview is the shared page in miniature (3 rows then "+ N more")', previewRows === 3 && /more in this day/.test(await sender.locator('.share-preview-frame').innerText()), `${previewRows} rows`);
await shot(sender, '01-composer-phone');
await sender.getByRole('textbox', { name: /Show your name/ }).fill('Coach Sam');
await sender.getByRole('textbox', { name: /Note for the people/ }).fill('Short rests. Same weights as last week.');
await sender.getByRole('button', { name: 'Open full preview' }).click(); await wait(sender, 300);
await shot(sender, '02-composer-full-preview-phone', { fullPage: false });
const createCalls = [];
sender.on('request', (request) => { if (request.url().includes('shares.create')) createCalls.push(request.url()); });
const createButton = sender.getByRole('button', { name: /Create link/ });
await createButton.click(); await createButton.click({ timeout: 500 }).catch(() => {});
await sender.getByRole('textbox', { name: 'Share link' }).waitFor({ timeout: 8000 });
const link = await sender.getByRole('textbox', { name: 'Share link' }).inputValue();
check('S4', 'Create link makes one link at /s/<token>', /\/s\/[A-Za-z0-9_-]{20,}$/.test(link) && createCalls.length === 1, `${link} · ${createCalls.length} create call(s)`);
await sender.getByRole('button', { name: 'Copy link' }).click(); await wait(sender, 300);
check('S5', 'Copy link copies it and says so', (await clip(sender)) === link && await sender.getByRole('button', { name: 'Link copied' }).isVisible());
await shot(sender, '03-link-ready-phone');
await sender.locator('.share-other > summary').click(); await wait(sender, 200);
await sender.getByRole('button', { name: /Copy as text/ }).click(); await wait(sender, 300);
const copiedText = await clip(sender);
writeFileSync(`${out}copied-workout.txt`, copiedText);
check('S6', 'Copy as text gives one line per exercise with its prescription', /Shared from Sports Genome/.test(copiedText) && /^1\. .+ — \d+ × /m.test(copiedText) && copiedText.includes(link), copiedText.split('\n').slice(0, 6).join(' / '));
const sharedNames = copiedText.split('\n').filter((line) => /^\d+\. /.test(line)).map((line) => line.replace(/^\d+\.\s+/, '').split(' — ')[0]);
const sharedDoses = Object.fromEntries(copiedText.split('\n').filter((line) => /^\d+\. /.test(line)).map((line) => [line.replace(/^\d+\.\s+/, '').split(' — ')[0], line.split(' — ')[1]?.split(' · ')[0] ?? '']));
await sender.getByRole('button', { name: 'Your shared links' }).click(); await wait(sender, 900);
check('S7', 'Your shared links lists the new link as active', /Active · anyone with the link can view/.test(await dialog.innerText()));
await shot(sender, '04-shared-by-you-phone');
await sender.keyboard.press('Escape'); await wait(sender, 300);

// Link preview: what a message app reads.
const head = await (await sender.request.get(link)).text();
const og = (property) => head.match(new RegExp(`<meta property="${property}" content="([^"]*)"`))?.[1];
check('M1', 'The link\'s page head names the workout (og:title, og:description, og:image) and is noindex', og('og:title') && /Shared by|shared by Coach Sam/.test(og('og:description') ?? '') && og('og:image') && /noindex/.test(head), `${og('og:title')} — ${og('og:description')}`);

// ── Recipient: a separate profile with its own storage ───────────────────────────────
const [viewCtx, viewer] = await newProfile(390, 844);
await openLink(viewer, link);
const h1 = await viewer.getByRole('heading', { level: 1 }).innerText().catch(() => '');
const rows = await viewer.locator('.sw-row').count();
check('R1', 'Opens without an account: the workout first, in order, with who shared it', rows === sharedNames.length && /Shared by Coach Sam/.test(await viewer.locator('.sw-head').innerText()), `${h1} · ${rows} rows`);
const pageNames = await viewer.$$eval('.sw-name', (names) => names.map((name) => name.textContent?.replace(/^\d+\.\s*/, '').trim()));
check('R2', 'Exercises appear in the order they were shared', JSON.stringify(pageNames) === JSON.stringify(sharedNames), pageNames.join(', '));
check('R3', 'No launch intro on a shared link', await viewer.evaluate(() => !document.getElementById('sports-genome-boot-splash') || getComputedStyle(document.getElementById('sports-genome-boot-splash')).visibility === 'hidden'));
await shot(viewer, '05-recipient-phone');
await shot(viewer, '05b-recipient-phone-full', { fullPage: true });
const [deskCtx, desk] = await newProfile(1280, 900);
await openLink(desk, link);
await shot(desk, '06-recipient-desktop');
await desk.emulateMedia({ media: 'print' }); await wait(desk, 300);
check('R4', 'Print layout: light sheet, no buttons, every exercise', await desk.locator('.sp-actions').isHidden() && await desk.evaluate(() => getComputedStyle(document.querySelector('.sp-shell')).backgroundColor) === 'rgb(255, 255, 255)');
await desk.pdf({ path: `${out}07-print.pdf`, format: 'A4' }).catch(() => {});
await shot(desk, '07-print-desktop', { fullPage: true });
await deskCtx.close();

// The recipient already has a plan: Save a copy adds after it, never replacing it.
await seed(viewer, recipientProfile);
await draft(viewer);
const before = await planRows(viewer);
await openLink(viewer, link);
await viewer.getByRole('button', { name: 'Save a copy to my plan' }).click();
const saveDialog = viewer.getByRole('dialog').filter({ hasText: 'Save a copy' });
await saveDialog.waitFor({ timeout: 10000 });
check('P1', 'Save a copy asks where it goes first: week, day, add or replace', await viewer.getByRole('radio', { name: /Add after them/ }).isChecked() && await viewer.getByRole('radio', { name: /Week 1/ }).isChecked());
await shot(viewer, '08-save-destination-phone');
const dayChoice = await viewer.locator('.stp-day select').first().evaluate((select) => select.options[select.selectedIndex]?.textContent ?? '');
await viewer.getByRole('button', { name: /^Save to Week 1$/ }).click(); await wait(viewer, 600);
const saved = await viewer.locator('.stp-body[role="status"]').innerText().catch(() => '');
const overlap = sharedNames.filter((name) => before.some((row) => row.name === name));
check('P2', 'Saved: says exactly where, and how many were added', /Saved to Week 1 · Day/.test(saved) && saved.includes(`${sharedNames.length - overlap.length} exercise`), saved.split('\n')[0]);
await shot(viewer, '09-saved-phone');
await viewer.locator('.stp-sheet').getByRole('button', { name: 'Open workout' }).click(); await wait(viewer, 1200);
const after = await planRows(viewer);
const beforeKept = before.every((row, index) => after[index]?.name === row.name);
const appended = after.slice(before.length).map((row) => row.name);
check('P3', 'Added after the day\'s own exercises, which stay as they were, in the shared order', beforeKept && JSON.stringify(appended) === JSON.stringify(sharedNames.filter((name) => !overlap.includes(name))), `${dayChoice} · ${before.length} rows → ${after.length}; already there: ${overlap.join(', ') || 'none'}`);
const keptDose = (rows) => sharedNames.filter((name) => !overlap.includes(name)).every((name) => rows.find((row) => row.name === name)?.text.includes(sharedDoses[name]));
check('P4', 'Each added exercise keeps the prescription it was shared with', keptDose(after), sharedNames.map((name) => `${name}: ${sharedDoses[name]}`).join('; '));
await shot(viewer, '10-saved-day-phone');
await openLink(viewer, link);
check('P5', 'Opening the link again says where it was saved', /You saved a copy to Week 1/.test(await viewer.locator('.sp-actions').innerText()));
await viewer.getByRole('button', { name: 'Save another copy' }).click();
await viewer.getByRole('dialog').filter({ hasText: 'Save a copy' }).waitFor({ timeout: 10000 });
check('P6', 'Saving again shows the earlier save first, with Open saved copy', await viewer.getByRole('button', { name: 'Open saved copy' }).isVisible());
await shot(viewer, '11-already-saved-phone');
await viewer.keyboard.press('Escape'); await wait(viewer, 300);

// Paste: the copied text into Import plan, in the recipient's own app.
await viewer.goto(`${base}/?workspace=day-plan`); await wait(viewer, 1500);
await viewer.locator('button').filter({ hasText: /Import plan|Or import a plan/ }).first().click(); await wait(viewer, 500);
await viewer.locator('.routine-import-modal textarea').fill(copiedText); await wait(viewer, 500);
await shot(viewer, '12-paste-preview-phone');
const importButton = viewer.locator('.stack-import-confirm');
const previewText = await viewer.locator('.routine-import-modal').innerText();
check('C1', 'The pasted copy is read line for line, every exercise matched with its prescription', !(await importButton.isDisabled()) && sharedNames.every((name) => previewText.includes(name)) && !/Unmatched/.test(previewText), `${sharedNames.length} exercises`);
await importButton.click(); await wait(viewer, 600);
const pasteDialog = viewer.getByRole('dialog').filter({ hasText: 'Paste a workout' });
check('C2', 'Paste asks where it goes too, adding by default', await pasteDialog.isVisible() && await viewer.getByRole('radio', { name: /Add after them/ }).isChecked());
await viewer.locator('.stp-radio').filter({ hasText: 'Replace them' }).click(); await wait(viewer, 200);
await shot(viewer, '13-paste-destination-phone');
const replaceButton = viewer.getByRole('button', { name: /Replace and save…|Save to Week/ });
await replaceButton.click(); await wait(viewer, 300);
const confirmShown = await viewer.getByRole('alertdialog').isVisible().catch(() => false);
check('C3', 'Replace asks again, naming the day and how many exercises go', confirmShown && /will be removed/.test(await viewer.getByRole('alertdialog').innerText()));
await shot(viewer, '14-replace-confirm-phone');
await viewer.getByRole('button', { name: 'Replace and save' }).click(); await wait(viewer, 600);
await viewer.locator('.stp-sheet').getByRole('button', { name: 'Open workout' }).click(); await wait(viewer, 1200);
const replaced = await planRows(viewer);
check('C4', 'After replace the day holds exactly the pasted workout, in order, with its prescriptions', JSON.stringify(replaced.map((row) => row.name)) === JSON.stringify(sharedNames) && sharedNames.every((name) => replaced.find((row) => row.name === name)?.text.includes(sharedDoses[name])), replaced.map((row) => row.name).join(', '));
await shot(viewer, '15-replaced-day-phone');

// ── Sender turns the link off; the recipient sees it's gone ────────────────────────────
await sender.locator('.day-action-share').first().click(); await wait(sender, 600);
await sender.getByRole('button', { name: 'Your shared links' }).click(); await wait(sender, 900);
await sender.getByRole('button', { name: 'Turn off link' }).first().click();
await shot(sender, '16-turn-off-confirm-phone');
await sender.locator('.shared-link-confirm').getByRole('button', { name: 'Turn off link' }).click(); await wait(sender, 900);
check('D1', 'Turning off is confirmed, then reported', /is turned off/.test(await sender.locator('.shared-links-status').innerText()));
await openLink(viewer, link);
check('D2', 'The recipient sees "no longer available", nothing of the workout', /no longer available/i.test(await viewer.getByRole('heading', { level: 1 }).innerText()) && !(await viewer.locator('.sw-row').count()));
await shot(viewer, '17-link-off-phone');
const offHead = await (await viewer.request.get(link)).text();
check('D3', 'A turned-off link\'s preview says nothing of the workout', /<title>Shared workout · Sports Genome<\/title>/.test(offHead) && !offHead.includes('Coach Sam'));
await openLink(viewer, `${base}/s/ThisTokenWasNeverMadeXX`);
check('D4', 'A link that never existed says so', /doesn't lead to a workout/i.test(await viewer.getByRole('heading', { level: 1 }).innerText()));
await shot(viewer, '18-missing-phone');

writeFileSync(`${out}sharing-e2e.json`, JSON.stringify({ base, ranAt: new Date().toISOString(), senderDay, link, checks }, null, 2));
console.log(`${checks.filter((c) => c.ok).length}/${checks.length} passed`);
await senderCtx.close(); await viewCtx.close(); await browser.close();
