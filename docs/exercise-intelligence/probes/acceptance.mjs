// Exercise Intelligence and anatomy brief §11: the acceptance checks, in headless Chromium
// against `vite preview`. Isolated localStorage; no outbound network (tRPC answers null, the
// photographs come from a curl cache of their pinned URLs). Emulated viewports, not phones.
import { browser, page, seed, draft, openExercise, wait, base, dock } from './shared.mjs';
import { writeFileSync } from 'node:fs';
const out = '/home/user/Sports-genome/docs/exercise-intelligence/evidence';
const results = [];
const check = (id, pass, detail) => { results.push({ id, pass: !!pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'} ${id} ${JSON.stringify(detail).slice(0, 700)}`); };

/** Geometry of the open sheet: overflow, header, tabs, rows, footer. */
const layout = (p) => p.evaluate(() => {
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height), r: Math.round(b.right), b: Math.round(b.bottom) }; };
  const sheet = document.querySelector('.exercise-intelligence-sheet');
  const body = document.querySelector('.exercise-intelligence-body');
  const h1 = document.querySelector('#exercise-intelligence-title');
  const close = document.querySelector('.exercise-intelligence-close');
  const footer = document.querySelector('.exercise-intelligence-actions');
  const add = document.querySelector('.exercise-intelligence-add');
  const fav = document.querySelector('.exercise-intelligence-favorite');
  const rows = [...document.querySelectorAll('.ei-row')].filter((row) => row.offsetParent).map((row) => ({ label: r(row.querySelector('.ei-row-label')), help: r(row.querySelector('.ei-help')), value: r(row.querySelector('.ei-row-value')), bar: r(row.querySelector('.ei-bar')) }));
  const overlap = (a, b) => a && b && a.x < b.r && b.x < a.r && a.y < b.b && b.y < a.b;
  return {
    vw: innerWidth, vh: innerHeight,
    pageOverflow: document.documentElement.scrollWidth - innerWidth,
    sheetOverflow: sheet ? sheet.scrollWidth - sheet.clientWidth : null,
    bodyOverflow: body ? body.scrollWidth - body.clientWidth : null,
    sheet: r(sheet), h1: r(h1), close: r(close), footer: r(footer), add: r(add), fav: r(fav), body: r(body),
    h1HitsClose: overlap(r(h1), r(close)),
    rowsCollide: rows.filter((row) => (row.label && row.value && row.label.r > row.value.x) || (row.help && row.value && row.help.r > row.value.x)).length,
    rowsOutside: rows.filter((row) => row.value && body && row.value.r > r(body).r).length,
    rowCount: rows.length,
    labelPx: rows[0]?.label ? parseFloat(getComputedStyle(document.querySelector('.ei-row-label')).fontSize) : null,
    tabs: [...document.querySelectorAll('.ei-tab')].map((tab) => ({ text: tab.textContent, h: Math.round(tab.getBoundingClientRect().height), selected: tab.getAttribute('aria-selected') })),
  };
});

/** Every radar label, at its rendered size: inside the figure, outside the plot, apart from each other. */
const radar = (p) => p.evaluate(() => {
  const svg = document.querySelector('.ei-radar-svg');
  if (!svg || !svg.getClientRects().length) return null;
  const box = svg.getBoundingClientRect();
  const ctm = svg.getScreenCTM();
  const edge = svg.querySelector('.ei-radar-edge');
  const pts = [...edge.points].map((pt) => { const q = new DOMPoint(pt.x, pt.y).matrixTransform(ctm); return [q.x, q.y]; });
  const inside = ([x, y]) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
  const labels = [...svg.querySelectorAll('.ei-radar-label')].map((t) => { const b = t.getBoundingClientRect(); return { text: t.textContent, x: b.x, y: b.y, r: b.right, b: b.bottom }; });
  const pairs = [];
  for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) { const a = labels[i], c = labels[j]; if (a.x < c.r && c.x < a.r && a.y < c.b && c.y < a.b) pairs.push(`${a.text}/${c.text}`); }
  const scale = box.width / svg.viewBox.baseVal.width;
  return {
    width: Math.round(box.width), labelPx: +(13.5 * scale).toFixed(1),
    collisions: pairs,
    clipped: labels.filter((l) => l.x < Math.min(box.x, 0) - 0.5 || l.r > Math.min(box.right, innerWidth) + 0.5 || l.y < box.y - 0.5 || l.b > box.bottom + 0.5).map((l) => l.text),
    onPlot: labels.filter((l) => [[l.x, l.y], [l.r, l.y], [l.x, l.b], [l.r, l.b], [(l.x + l.r) / 2, (l.y + l.b) / 2]].some(inside)).map((l) => l.text),
    labels: labels.map((l) => l.text),
  };
});

const body = (p, y) => p.evaluate((top) => { const el = document.querySelector('.exercise-intelligence-body'); el.scrollTop = top === 'end' ? el.scrollHeight : top; }, y);
const selectTab = async (p, name) => { await p.locator('.ei-tab').filter({ hasText: name }).first().click(); await wait(p, 500); };
const open = async (p, name) => { await openExercise(p, name); await p.waitForSelector('.ei-panel', { timeout: 15000 }); await wait(p, 400); };
const fresh = async (w, h, opts = {}) => { const [ctx, p] = await page(w, h, opts); await seed(p, opts.extra || {}); await p.goto(`${base}/`); await wait(p, 1800); if (!opts.noDraft) await draft(p); return [ctx, p]; };

// ── V1/V2: the brief's widths, and the screenshot's ~800px ─────────────────────
for (const [w, h] of [[320, 640], [375, 812], [390, 844], [430, 932], [768, 1024], [800, 900], [1024, 768]]) {
  const [ctx, p] = await fresh(w, h);
  await open(p, 'Barbell Bench Press');
  const top = await layout(p);
  await body(p, 'end'); await wait(p, 300);
  const end = await layout(p);
  const lastBottom = await p.evaluate(() => { const panel = document.querySelector('.ei-view'); const kids = [...panel.children].filter((k) => k.offsetParent); return Math.round(kids[kids.length - 1].getBoundingClientRect().bottom); });
  check(`V1 ${w}: no horizontal overflow, Close clear of the name, Add and Favorite reachable`, top.pageOverflow <= 0 && top.sheetOverflow <= 0 && top.bodyOverflow <= 0 && !top.h1HitsClose && top.close.r <= w && top.close.w >= 44 && top.add.b <= h && top.add.h >= 48 && top.fav.r <= w, { overflow: [top.pageOverflow, top.sheetOverflow, top.bodyOverflow], h1: top.h1, close: top.close, add: top.add, fav: top.fav });
  check(`V2 ${w}: rows aligned, nothing past the edge, labels at reading size`, top.rowsCollide === 0 && top.rowsOutside === 0 && top.labelPx >= 14 && top.tabs.every((t) => t.h >= 44), { rows: top.rowCount, labelPx: top.labelPx, tabs: top.tabs });
  check(`V3 ${w}: the last content ends above the footer`, lastBottom <= end.footer.y, { lastBottom, footerTop: end.footer.y });
  // The radar at this width: shown beside the rows when there is room, else behind its line.
  if (!(await p.$('.ei-radar-svg')) || !(await p.evaluate(() => document.querySelector('.ei-radar-svg').getClientRects().length))) { await body(p, 0); const toggle = p.locator('.ei-chart-toggle'); if (await toggle.isVisible()) await toggle.click(); await wait(p, 300); }
  await p.evaluate(() => document.querySelector('.ei-radar')?.scrollIntoView({ block: 'center' })); await wait(p, 300);
  const chart = await radar(p);
  check(`V4 ${w}: all eight radar labels outside the plot, apart, unclipped`, chart && chart.labels.length === 8 && chart.collisions.length === 0 && chart.clipped.length === 0 && chart.onPlot.length === 0, chart);
  const twoColumn = await p.evaluate(() => getComputedStyle(document.querySelector('.ei-profile-body')).gridTemplateAreas);
  const profileWidth = await p.evaluate(() => Math.round(document.querySelector('.ei-profile').getBoundingClientRect().width));
  // The rule is the profile's own width (680px: a ~320px chart, a 2rem gap and readable rows), not the window's.
  check(`V5 ${w}: two columns only where the profile itself is at least 680px wide`, (profileWidth >= 680) === /chart rows/.test(twoColumn), { twoColumn, profileWidth });
  if ([390, 800, 1024].includes(w)) {
    await body(p, 0); await wait(p, 200);
    await p.screenshot({ path: `${out}/after-top-${w}.png` });
    await p.evaluate(() => { const b = document.querySelector('.exercise-intelligence-body'); b.scrollTop = document.querySelector('.ei-profile').offsetTop - 8; }); await wait(p, 300);
    await p.screenshot({ path: `${out}/after-fingerprint-${w}.png` });
    await selectTab(p, 'Muscle Genome'); await p.screenshot({ path: `${out}/after-anatomy-${w}.png` });
    await selectTab(p, 'Mechanics'); await p.screenshot({ path: `${out}/after-mechanics-${w}.png` });
    await selectTab(p, 'Context'); await p.screenshot({ path: `${out}/after-context-${w}.png` });
  }
  await ctx.close();
}

// ── V6: short heights and larger text ───────────────────────────────────────────
for (const [w, h, zoom] of [[390, 568, 1], [1024, 600, 1], [390, 844, 1.25], [320, 640, 1.25]]) {
  const [ctx, p] = await fresh(w, h);
  if (zoom !== 1) await p.addStyleTag({ content: `html { font-size: ${16 * zoom}px !important; }` });
  await open(p, 'Barbell Bench Press');
  const a = await layout(p);
  const scroll = await p.evaluate(() => { const b = document.querySelector('.exercise-intelligence-body'); return { scrollable: b.scrollHeight > b.clientHeight, visible: b.clientHeight }; });
  await body(p, 'end'); await wait(p, 200);
  const lastBottom = await p.evaluate(() => { const panel = document.querySelector('.ei-view'); const kids = [...panel.children].filter((k) => k.offsetParent); return Math.round(kids[kids.length - 1].getBoundingClientRect().bottom); });
  check(`V6 ${w}x${h} text ${zoom * 100}%: scrolls, controls reachable, nothing under the footer, no sideways scroll`, scroll.scrollable && scroll.visible >= 120 && a.add.b <= h && a.close.y >= 0 && lastBottom <= a.footer.y && a.pageOverflow <= 0 && a.sheetOverflow <= 0 && a.bodyOverflow <= 0, { scroll, add: a.add, footer: a.footer, lastBottom, overflow: [a.pageOverflow, a.sheetOverflow, a.bodyOverflow] });
  if (w === 390 && h === 568) await p.screenshot({ path: `${out}/after-short-390x568.png` });
  if (w === 320 && zoom > 1) await p.screenshot({ path: `${out}/after-text125-320.png` });
  await ctx.close();
}

// ── V7: a long name and a long movement name ────────────────────────────────────
{
  const [ctx, p] = await fresh(320, 640);
  // The catalog's longest names (from exerciseCatalog), at the narrowest width.
  for (const name of ['Rope Face Pull with External Rotation', 'Single-Arm Dumbbell Triceps Extension', 'Landmine Single-Leg Romanian Deadlift']) {
    await open(p, name);
    const a = await layout(p);
    const glance = await p.evaluate(() => { const r = document.querySelector('.ei-glance').getBoundingClientRect(); return { r: Math.round(r.right), w: Math.round(r.width) }; });
    const tabsTop = await p.evaluate(() => Math.round(document.querySelector('.exercise-intelligence-tabs').getBoundingClientRect().top));
    const h1Px = await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('#exercise-intelligence-title')).fontSize));
    check(`V7 320: "${name}" wraps at full size, clear of Close and the tabs`, !a.h1HitsClose && a.h1.r <= 320 && a.h1.b <= tabsTop && h1Px >= 26 && a.pageOverflow <= 0 && a.sheetOverflow <= 0 && glance.r <= 320, { h1: a.h1, h1Px, close: a.close, tabsTop, glance });
    await p.locator('.exercise-intelligence-close').click(); await wait(p, 500);
  }
  await p.screenshot({ path: `${out}/after-longname-320.png` }).catch(() => {});
  await ctx.close();
}

// ── B1: two exercises, everything updates together ─────────────────────────────
{
  const [ctx, p] = await fresh(390, 844);
  const read = () => p.evaluate(() => ({ name: document.querySelector('#exercise-intelligence-title')?.textContent, glance: document.querySelector('.ei-glance-lead')?.textContent, values: [...document.querySelectorAll('.ei-row-value')].map((v) => v.textContent), meta: document.querySelector('.exercise-intelligence-meta')?.textContent }));
  await open(p, 'Barbell Bench Press'); const bench = await read();
  await selectTab(p, 'Muscle Genome');
  const benchPainted = await p.evaluate(() => [...document.querySelectorAll('.exercise-intelligence .anatomy-muscle[data-role="primary"]')].map((g) => g.dataset.muscle));
  await p.locator('.exercise-intelligence-close').click(); await wait(p, 500);
  await open(p, 'Romanian Deadlift'); const rdl = await read();
  const tabAfterReopen = await p.evaluate(() => document.querySelector('.ei-tab[aria-selected="true"]')?.textContent);
  await selectTab(p, 'Muscle Genome');
  const rdlPainted = await p.evaluate(() => [...document.querySelectorAll('.exercise-intelligence .anatomy-muscle[data-role="primary"]')].map((g) => g.dataset.muscle));
  check('B1 a second exercise changes the name, metadata, summary, all eight values and the anatomy together', bench.name !== rdl.name && bench.meta !== rdl.meta && bench.glance !== rdl.glance && JSON.stringify(bench.values) !== JSON.stringify(rdl.values) && rdl.values.length === 8 && JSON.stringify(benchPainted) !== JSON.stringify(rdlPainted) && tabAfterReopen === 'Fingerprint', { bench, rdl, benchPainted, rdlPainted, tabAfterReopen });
  // In place: search (Cmd/Ctrl+K) over the open sheet, choosing another exercise.
  await p.keyboard.press('Control+K'); await wait(p, 400);
  await p.keyboard.type('Back Squat'); await wait(p, 700);
  await p.keyboard.press('Enter'); await wait(p, 1500);
  const swapped = await read();
  const views = await p.evaluate(() => document.querySelectorAll('.ei-panel').length);
  check('B2 an exercise chosen from search over the sheet replaces the last one entirely (one panel, its own name and values)', swapped.name === 'Back Squat' && views === 1 && JSON.stringify(swapped.values) !== JSON.stringify(rdl.values), { swapped, views });
  await ctx.close();
}

// ── B3: the movement in context ──────────────────────────────────────────────────
{
  const link = async (movementId) => { const [ctx, p] = await page(390, 844); await seed(p, {}); await p.evaluate((id) => { const prof = JSON.parse(localStorage.getItem('gym-optimizer-athlete-profile-v1')); prof.movementId = id; localStorage.setItem('gym-optimizer-athlete-profile-v1', JSON.stringify(prof)); }, movementId); await p.goto(`${base}/`); await wait(p, 1500); await open(p, 'Barbell Hip Thrust'); const text = await p.evaluate(() => document.querySelector('.ei-glance-lines > div:nth-child(2)')?.textContent); await ctx.close(); return text; };
  const hand = await link('wrestling-17');
  const bridge = await link('wrestling-19');
  check('B3 the movement link names the movement in view and follows it when it changes', /Hand fighting/.test(hand) && /No mapped link to Hand fighting in this catalog\./.test(hand) && /Bridge/.test(bridge) && /Movement-specific/.test(bridge) && !/\d+\/100/.test(hand + bridge), { hand, bridge });
}

// ── B4: disclosures and help open and close without losing the exercise ─────────
{
  const [ctx, p] = await fresh(390, 844);
  await open(p, 'Barbell Bench Press');
  const name = await p.textContent('#exercise-intelligence-title');
  await p.locator('.ei-more').click(); await wait(p, 200);
  const all = await p.evaluate(() => [...document.querySelectorAll('.ei-row')].filter((r) => r.offsetParent).length);
  await p.locator('.ei-chart-toggle').click(); await wait(p, 200);
  const chartShown = await p.evaluate(() => !!document.querySelector('.ei-radar-svg')?.getClientRects().length);
  await p.locator('.ei-disclosure > summary').first().click(); await wait(p, 200);
  const methodOpen = await p.evaluate(() => document.querySelector('.ei-disclosure').open);
  await p.locator('.ei-help').first().click(); await wait(p, 300);
  const term = await p.evaluate(() => ({ dialog: document.querySelector('.genome-learn-overlay')?.getAttribute('aria-label'), focus: document.activeElement?.getAttribute('aria-label') }));
  await p.keyboard.press('Escape'); await wait(p, 300);
  const afterTerm = await p.evaluate(() => ({ sheet: !!document.querySelector('.exercise-intelligence'), focus: document.activeElement?.getAttribute('aria-label') }));
  await p.locator('.ei-more').click(); await p.locator('.ei-chart-toggle').click(); await wait(p, 200);
  const fewer = await p.evaluate(() => [...document.querySelectorAll('.ei-row')].filter((r) => r.offsetParent).length);
  check('B4 all 8 rows, the chart, the method and a help card open and close; Escape closes only the card, focus returns to its button, the exercise stays', all === 8 && chartShown && methodOpen && term.dialog === 'Hypertrophy potential explained' && term.focus === 'Close term explanation' && afterTerm.sheet && afterTerm.focus === 'Learn about Hypertrophy potential' && fewer === 4 && (await p.textContent('#exercise-intelligence-title')) === name, { all, chartShown, methodOpen, term, afterTerm, fewer });
  // Keyboard: arrows move the tabs, Tab stays inside the sheet.
  await p.focus('#exercise-analysis-tab-fingerprint'); await p.keyboard.press('ArrowRight'); await wait(p, 300);
  const arrowed = await p.evaluate(() => ({ selected: document.querySelector('.ei-tab[aria-selected="true"]')?.textContent, focus: document.activeElement?.textContent }));
  let escaped = 0; for (let i = 0; i < 60; i++) { await p.keyboard.press('Tab'); if (!(await p.evaluate(() => !!document.activeElement?.closest('.exercise-intelligence')))) escaped++; }
  check('B5 arrow keys move between the tabs; Tab never leaves the sheet', arrowed.selected === 'Muscle Genome' && arrowed.focus === 'Muscle Genome' && escaped === 0, { arrowed, escaped });
  await ctx.close();
}

// ── B6: Add to the chosen day, saved; a refused add and its retry ────────────────
{
  const [ctx, p] = await fresh(390, 844);
  await open(p, 'Cable Lateral Raise');
  await p.locator('.exercise-intelligence-change').click(); await wait(p, 300);
  const days = await p.evaluate(() => [...document.querySelectorAll('.exercise-intelligence-days button')].map((b) => ({ text: b.textContent, pressed: b.getAttribute('aria-pressed') })));
  const target = days.find((d) => d.pressed === 'false');
  await p.locator('.exercise-intelligence-days button[aria-pressed="false"]').first().click(); await wait(p, 400);
  const dest = await p.textContent('.exercise-intelligence-destination');
  const stillOpen = await p.evaluate(() => !!document.querySelector('.exercise-intelligence'));
  await p.locator('.exercise-intelligence-add').click(); await wait(p, 100);
  await p.locator('.exercise-intelligence-add').click({ timeout: 500 }).catch(() => {});
  await wait(p, 600);
  const toast = await p.evaluate(() => document.querySelector('[data-sonner-toast]')?.textContent);
  const saved = await p.evaluate(() => { const plan = JSON.parse(localStorage.getItem('gym-optimizer-workout-plan-v1') || '{}'); const days = plan.weeks?.['1']?.weeklyPlanEntries || plan.weeklyPlanEntries || {}; return Object.fromEntries(Object.entries(days).map(([k, v]) => [k, v.length])); });
  const closed = await p.evaluate(() => !document.querySelector('.exercise-intelligence'));
  check('B6 Change day moves the destination without adding; Add saves to that day once, closes, and says where', stillOpen && dest.includes(target.text.split(' · ')[1].replace(/\d+ planned|Empty/, '').trim()) && /^Added to Week 1 · /.test(toast || '') && closed && !/Already in this workout/.test(toast || ''), { days, target, dest, toast, saved, closed });
  await ctx.close();
}
{
  // The add is refused while the saved plan is still being read: keep auth.me (and so the plan) pending.
  let release; const gate = new Promise((resolve) => { release = resolve; });
  const trpc = async (route) => { const names = new URL(route.request().url()).pathname.replace('/api/trpc/', '').split(','); if (names.includes('auth.me')) await gate; return route.fulfill({ contentType: 'application/json', body: JSON.stringify(names.map(() => ({ result: { data: { json: null } } }))) }); };
  const [ctx, p] = await page(390, 844, { trpc });
  await seed(p); await p.goto(`${base}/?workspace=catalog`); await wait(p, 2500);
  const opened = await openExercise(p, 'Cable Lateral Raise').then(() => true).catch(() => false);
  const ready = await p.$('.exercise-intelligence-add');
  let refusal = null, retried = null;
  if (ready) {
    await p.locator('.exercise-intelligence-add').click(); await wait(p, 400);
    refusal = await p.evaluate(() => ({ alert: document.querySelector('.exercise-intelligence-add-status')?.textContent, button: document.querySelector('.exercise-intelligence-add')?.textContent, open: !!document.querySelector('.exercise-intelligence') }));
    release(); await wait(p, 2000);
    await p.locator('.exercise-intelligence-add').click(); await wait(p, 700);
    retried = await p.evaluate(() => ({ open: !!document.querySelector('.exercise-intelligence'), toast: document.querySelector('[data-sonner-toast]')?.textContent }));
  } else release();
  check('B7 a refused add says so in the footer, keeps the sheet, offers Try again; the retry adds', refusal && /still loading, so nothing was added/.test(refusal.alert || '') && /Try again/.test(refusal.button) && refusal.open && retried && !retried.open && /^Added to/.test(retried.toast || ''), { opened, refusal, retried });
  await ctx.close();
}

// ── B8: Favorite persists; B9: every way out restores focus and the page ────────
{
  const [ctx, p] = await fresh(390, 844);
  await open(p, 'Barbell Bench Press');
  await p.locator('.exercise-intelligence-favorite').click(); await wait(p, 300);
  const on = await p.getAttribute('.exercise-intelligence-favorite', 'aria-pressed');
  await p.locator('.exercise-intelligence-close').click(); await wait(p, 500);
  await open(p, 'Barbell Bench Press');
  const reopened = await p.getAttribute('.exercise-intelligence-favorite', 'aria-pressed');
  await p.reload(); await wait(p, 2000);
  await open(p, 'Barbell Bench Press');
  const reloaded = await p.getAttribute('.exercise-intelligence-favorite', 'aria-pressed');
  check('B8 Favorite shows its state and persists across close, reopen and reload, without adding', on === 'true' && reopened === 'true' && reloaded === 'true', { on, reopened, reloaded });
  await ctx.close();
}
{
  const [ctx, p] = await fresh(390, 844);
  await p.goto(`${base}/?workspace=catalog`); await wait(p, 1500);
  await p.locator('.catalog-discovery input').first().fill('press'); await wait(p, 700);
  await p.evaluate(() => window.scrollTo(0, 500)); await wait(p, 300);
  const results = {};
  for (const how of ['button', 'escape', 'back']) {
    const y0 = await p.evaluate(() => window.scrollY);
    const opener = p.locator('.catalog-discovery-row-copy').nth(3);
    await opener.focus(); const label = await opener.evaluate((el) => el.getAttribute('aria-label') || el.textContent.slice(0, 30));
    await opener.press('Enter'); await p.waitForSelector('.ei-panel', { timeout: 15000 }); await wait(p, 300);
    const held = await p.evaluate(() => ({ bodyPosition: document.body.style.position, inert: !!document.querySelector('.catalog-experience-surface')?.closest('[inert]') }));
    await p.mouse.move(195, 800); await p.mouse.wheel(0, 600); await wait(p, 200);
    const yDuring = await p.evaluate(() => -parseInt(document.body.style.top || '0', 10));
    if (how === 'button') await p.locator('.exercise-intelligence-close').click();
    if (how === 'escape') await p.keyboard.press('Escape');
    if (how === 'back') await p.goBack();
    await wait(p, 600);
    const after = await p.evaluate(() => ({ open: !!document.querySelector('.exercise-intelligence'), y: window.scrollY, focus: document.activeElement?.getAttribute('aria-label') || document.activeElement?.textContent?.slice(0, 30), position: document.body.style.position, inert: document.querySelectorAll('[inert]').length }));
    results[how] = { y0, yDuring, held, after, label };
  }
  check('B9 close by button, Escape and Back: page held still and inert while open, then scroll and focus restored', Object.values(results).every((r) => r.held.bodyPosition === 'fixed' && r.held.inert && r.yDuring === r.y0 && !r.after.open && Math.abs(r.after.y - r.y0) <= 2 && r.after.focus === r.label && r.after.position === '' && r.after.inert === 0), results);
  await ctx.close();
}

// ── B10: the four views each still show what they did ───────────────────────────
{
  const [ctx, p] = await fresh(1024, 768);
  await open(p, 'Barbell Bench Press');
  const views = {};
  for (const tab of ['Fingerprint', 'Muscle Genome', 'Mechanics', 'Context']) {
    await selectTab(p, tab);
    views[tab] = await p.evaluate(() => { const panel = document.querySelector('[role="tabpanel"]'); return { label: panel?.getAttribute('aria-labelledby'), scrollTop: document.querySelector('.exercise-intelligence-body').scrollTop, figure: !!panel?.querySelector('.anatomy-figure'), muscles: panel?.querySelectorAll('.ei-muscle').length, curve: !!panel?.querySelector('.ei-curve'), fatigue: panel?.querySelectorAll('.ei-row').length, sport: !!panel?.querySelector('.inspection-action-connection'), fit: !!panel?.querySelector('[aria-label^="Contextual fit"]'), evidence: !!panel?.querySelector('.exercise-intelligence-evidence'), tier: panel?.querySelector('.exercise-intelligence-tier-note')?.textContent, rows: panel?.querySelectorAll('.ei-row').length, glance: !!panel?.querySelector('.ei-glance'), photos: panel?.querySelectorAll('.exercise-media-frame, .exercise-media img').length }; });
    await body(p, 400); await wait(p, 150);
  }
  check('B10 Fingerprint (summary, photos, 8 rows), Muscle Genome (figure, muscle rows), Mechanics (curve, fatigue), Context (sport, fit, tier, evidence); each opens at its top', views.Fingerprint.glance && views.Fingerprint.rows === 8 && views.Fingerprint.photos > 0 && views['Muscle Genome'].figure && views['Muscle Genome'].muscles > 0 && views.Mechanics.curve && views.Mechanics.fatigue === 4 && views.Context.sport && views.Context.fit && views.Context.evidence && /Catalog tier/.test(views.Context.tier || '') && Object.values(views).every((v) => v.scrollTop === 0), views);
  // Anatomy: names centred over each body, legend readable, neutral named accurately.
  await selectTab(p, 'Muscle Genome');
  const anatomy = await p.evaluate(() => {
    const svg = document.querySelector('.exercise-intelligence .anatomy-figure');
    const captions = [...svg.querySelectorAll('.anatomy-captions text')].map((t) => { const b = t.getBoundingClientRect(); return { text: t.textContent, cx: Math.round(b.x + b.width / 2), bottom: Math.round(b.bottom) }; });
    const bodies = [...svg.querySelectorAll(':scope > g[aria-hidden="true"]:not(.anatomy-captions)')].slice(0, 2).map((g) => { const b = g.getBoundingClientRect(); return { cx: Math.round(b.x + b.width / 2), top: Math.round(b.y), h: Math.round(b.height) }; });
    const legend = [...document.querySelectorAll('.exercise-intelligence .atlas-heat-legend-pro li')].map((li) => li.textContent);
    const legendPx = parseFloat(getComputedStyle(document.querySelector('.exercise-intelligence .atlas-heat-legend-pro')).fontSize);
    const title = document.querySelector('.exercise-intelligence .atlas-figure-title')?.textContent;
    return { captions, bodies, legend, legendPx, title };
  });
  check('B11 anatomy: Front and Back centred above matching bodies, subject named above, legend readable with an accurate neutral label', anatomy.captions.length === 2 && anatomy.captions.every((c, i) => Math.abs(c.cx - anatomy.bodies[i].cx) <= 6 && c.bottom <= anatomy.bodies[i].top) && Math.abs(anatomy.bodies[0].h - anatomy.bodies[1].h) <= 2 && anatomy.legend.includes('No role recorded') && !anatomy.legend.some((l) => /Neutral|Not involved/.test(l)) && anatomy.legendPx >= 14 && /Muscle roles · Barbell Bench Press/.test(anatomy.title), anatomy);
  // Contrast on the final ground.
  const contrast = await p.evaluate(() => {
    const lum = (c) => { const [r, g, b] = c.match(/[\d.]+/g).slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return +((x + 0.05) / (y + 0.05)).toFixed(2); };
    const bg = getComputedStyle(document.querySelector('.exercise-intelligence-sheet')).backgroundColor;
    const color = (sel) => { const el = document.querySelector(sel); return el ? getComputedStyle(el).color : null; };
    const pairs = { title: color('#exercise-intelligence-title'), meta: color('.exercise-intelligence-meta'), tabInactive: color('.ei-tab:not(.is-active)'), tabActive: color('.ei-tab.is-active'), legend: color('.atlas-heat-legend-pro'), destination: color('.exercise-intelligence-destination'), change: color('.exercise-intelligence-change'), roleRow: color('.atlas-role-row-copy strong') };
    return { bg, ratios: Object.fromEntries(Object.entries(pairs).filter(([, c]) => c).map(([k, c]) => [k, ratio(c, bg)])), add: ratio('rgb(255,255,255)', getComputedStyle(document.querySelector('.exercise-intelligence-add')).backgroundColor) };
  });
  check('B12 text contrast on the sheet clears 4.5:1, and white on the Add fill', Object.values(contrast.ratios).every((r) => r >= 4.5) && contrast.add >= 4.5, contrast);
  await ctx.close();
}

// ── B13: Body Lab's map, the same component on its own page ──────────────────────
for (const [w, h] of [[390, 844], [1024, 768]]) {
  const [ctx, p] = await fresh(w, h, { noDraft: true });
  await dock(p, 'Body Lab'); await wait(p, 700);
  await p.locator('.workspace-top-switcher button').filter({ hasText: 'Muscles' }).first().dispatchEvent('click'); await wait(p, 900);
  const lab = await p.evaluate(() => {
    const fig = document.querySelector('.destination-body .anatomy-figure');
    const style = getComputedStyle(fig);
    const wrap = getComputedStyle(document.querySelector('.destination-body .atlas-body-chart-wrap'));
    const line = getComputedStyle(fig.querySelector('.anatomy-linework > path'));
    const stab = [...fig.querySelectorAll('.anatomy-muscle[data-role="stabilizing"] > path')][0];
    return { view: fig.dataset.view, muscle: style.getPropertyValue('--anatomy-muscle').trim(), line: line.stroke, lineWidth: line.strokeWidth, wrapBg: wrap.backgroundImage.slice(0, 80), legend: [...document.querySelectorAll('.destination-body .atlas-heat-legend-pro li')].map((li) => li.textContent), captions: [...fig.querySelectorAll('.anatomy-captions text')].map((t) => t.textContent), sideTabs: [...document.querySelectorAll('.destination-body .atlas-side-tab')].map((b) => b.textContent), stabilizingFill: stab ? getComputedStyle(document.documentElement).getPropertyValue('--sg-role-stabilizing-1').trim() : null, legendColumns: getComputedStyle(document.querySelector('.destination-body .atlas-heat-legend-pro')).gridTemplateColumns };
  });
  check(`B13 Body Lab ${w}: navy ground, subdued thin boundaries, dark neutral, gold stabilizing, accurate legend${w < 720 ? ', two-column legend and a Front/Back switch' : ', names over both bodies'}`, lab.line === 'rgb(113, 134, 155)' && parseFloat(lab.lineWidth) <= 1.2 && /#0e2742|rgb\(14, 39, 66\)/.test(lab.wrapBg) && lab.legend.includes('Stabilizing') && lab.legend.includes('No role recorded') && lab.stabilizingFill === '#fce3a8' && (w < 720 ? lab.sideTabs.join() === 'Front,Back' && lab.legendColumns.split(' ').length === 2 : lab.captions.join() === 'Front,Back'), lab);
  await p.evaluate(() => document.querySelector('.atlas-body-chart-wrap')?.scrollIntoView({ block: 'start' })); await p.evaluate(() => window.scrollBy(0, -70)); await wait(p, 400);
  await p.screenshot({ path: `${out}/after-bodylab-${w}.png` });
  await ctx.close();
}

writeFileSync(`${out}/acceptance.json`, JSON.stringify(results, null, 2));
console.log(`${results.filter((r) => r.pass).length}/${results.length} passed`);
await browser.close();
