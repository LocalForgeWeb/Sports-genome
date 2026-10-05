// Acceptance checks for the intro quiz's area question (Oct 5 brief §7), in headless Chromium.
import { writeFileSync } from 'node:fs';
import { browser, newQuiz, toAreaQuestion, heading, next, back, wait } from './quiz-harness.mjs';

const out = new URL('../evidence/', import.meta.url).pathname;
const checks = [];
const check = (id, name, ok, detail = '') => { checks.push({ id, name, ok: Boolean(ok), detail: String(detail).slice(0, 300) }); console.log(`${ok ? 'PASS' : 'FAIL'} ${id} ${name}${detail ? ` — ${String(detail).slice(0, 150)}` : ''}`); };
const radios = (p) => p.locator('.athlete-radio input[type="radio"]');
const checkedLabels = (p) => p.$$eval('.athlete-radio input:checked', (inputs) => inputs.map((input) => input.closest('label').querySelector('strong').textContent));
const count = (p) => p.locator('.athlete-quiz-count').innerText();
const radio = (p, label) => p.locator('.athlete-radio').filter({ has: p.locator('strong', { hasText: new RegExp(`^${label}$`) }) });

// ── Phone 390: the screenshot's path (sport, shoulder, left) ───────────────────────────
{
  const [ctx, p] = await newQuiz(390, 844);
  await toAreaQuestion(p, { area: 'Shoulder', side: 'Left' });
  check('Q1', 'The question names the area and side', (await heading(p)) === 'HOW IS YOUR LEFT SHOULDER FEELING?' || (await heading(p)).toLowerCase() === 'how is your left shoulder feeling?', await heading(p));
  check('Q2', 'Progress reads "Step 6 of 14"', (await count(p)) === 'Step 6 of 14', await count(p));
  check('Q3', 'A new athlete sees no answer chosen', (await checkedLabels(p)).length === 0 && (await radios(p).count()) === 6);
  const nextButton = p.locator('.athlete-quiz-actions .athlete-quiz-next');
  const box = await nextButton.boundingBox();
  check('Q4', 'Continue is on screen without scrolling, held at the bottom', box && box.y + box.height <= 844 && box.y > 600, `top ${Math.round(box?.y)}`);
  check('Q5', 'Before an answer: Continue disabled, "Choose one option to continue" beside it', await nextButton.isDisabled() && (await p.locator('.athlete-quiz-hint').innerText()) === 'Choose one option to continue');
  await p.screenshot({ path: `${out}after/area-question-phone-390.png` });
  const fontSize = await p.$eval('.athlete-quiz-stage h1', (h) => parseFloat(getComputedStyle(h).fontSize));
  const colours = await p.$eval('.athlete-quiz-stage h1', (h) => [...new Set([h, ...h.querySelectorAll('*')].map((n) => getComputedStyle(n).color))]);
  check('Q6', 'Heading 28–34px on a phone, one colour', fontSize >= 28 && fontSize <= 34 && colours.length === 1, `${fontSize}px, ${colours.join(' ')}`);
  check('Q7', 'No RIGHT NOW eyebrow; plain instruction and Select one', !(await p.locator('.athlete-quiz-stage .athlete-quiz-kicker').count()) && /Choose the closest match/.test(await p.locator('.athlete-quiz-stage').innerText()) && await p.getByText('Select one', { exact: true }).isVisible());
  // Select by tapping anywhere on the row (its description), then change.
  const detail = await radio(p, 'Bothering me now').locator('small').boundingBox();
  await p.mouse.click(detail.x + detail.width - 8, detail.y + detail.height / 2); await wait(p, 150);
  check('Q8', 'The whole row selects; selected row has an orange edge and a filled mark', JSON.stringify(await checkedLabels(p)) === '["Bothering me now"]' && await radio(p, 'Bothering me now').evaluate((row) => row.classList.contains('athlete-radio-selected') && getComputedStyle(row.querySelector('.athlete-radio-mark')).backgroundImage.includes('gradient')));
  check('Q9', 'Choosing does not advance; Continue becomes available', (await count(p)) === 'Step 6 of 14' && !(await nextButton.isDisabled()) && (await p.locator('.athlete-quiz-hint').innerText()) === '');
  await p.screenshot({ path: `${out}after/area-question-phone-390-selected.png` });
  await radio(p, 'Feels fine').click(); await wait(p, 150);
  check('Q10', 'One answer at a time; changing it moves the selection', JSON.stringify(await checkedLabels(p)) === '["Feels fine"]');
  await radio(p, 'Not sure').click(); await wait(p, 200);
  check('Q11', 'Not sure is an answer, followed by the optional red-flag check', JSON.stringify(await checkedLabels(p)) === '["Not sure"]' && await p.getByRole('group', { name: /Do any of these apply/ }).isVisible() && !(await nextButton.isDisabled()));
  await p.screenshot({ path: `${out}after/area-question-phone-390-not-sure-full.png`, fullPage: true });
  // The bottom of the page: the last answer and the note are above the bar, not under it.
  await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await wait(p, 200);
  const lastBottom = await p.locator('.athlete-quiz-stage .athlete-quiz-note').evaluate((n) => n.getBoundingClientRect().bottom);
  const barTop = await p.locator('.athlete-quiz-actions').evaluate((n) => n.getBoundingClientRect().top);
  check('Q12', 'At the bottom, the bar sits below the last content instead of covering it', lastBottom <= barTop + 1, `content ends ${Math.round(lastBottom)}, bar starts ${Math.round(barTop)}`);
  await next(p);
  check('Q13', 'Continue advances exactly one step, to the top of the next question, focused on it', (await count(p)) === 'Step 7 of 14' && /HOW MANY DAYS|how many days/i.test(await heading(p)) && await p.evaluate(() => window.scrollY) === 0 && await p.evaluate(() => document.activeElement?.tagName) === 'H1', await count(p));
  await back(p);
  check('Q14', 'Back returns to the question with the answer kept', (await count(p)) === 'Step 6 of 14' && JSON.stringify(await checkedLabels(p)) === '["Not sure"]');
  // A quick double tap on Continue moves one question, not two.
  await next(p);
  const b = await p.locator('.athlete-quiz-actions .athlete-quiz-next').boundingBox();
  await p.mouse.dblclick(b.x + b.width / 2, b.y + b.height / 2); await wait(p, 500);
  check('Q15', 'A double tap on Continue moves exactly one step', (await count(p)) === 'Step 8 of 14', await count(p));
  // Changing the area: the answer is not carried over.
  for (let i = 0; i < 3; i += 1) await back(p);
  await p.locator('.athlete-choice').filter({ has: p.locator('strong', { hasText: /^Knee$/ }) }).click(); await wait(p, 200);
  await next(p);
  check('Q16', 'A different area is asked about afresh, nothing carried over', /knee/i.test(await heading(p)) && (await checkedLabels(p)).length === 0, await heading(p));
  await ctx.close();
}

// ── Desktop, short laptop, phones, larger text ──────────────────────────────────────────
const layouts = [];
for (const [name, w, h, scale] of [['desktop-1280', 1280, 800, 1], ['laptop-short-1280x640', 1280, 640, 1], ['phone-320', 320, 640, 1], ['phone-375', 375, 667, 1], ['phone-430', 430, 932, 1], ['phone-390-large-text', 390, 844, 1.4]]) {
  const [ctx, p] = await newQuiz(w, h, { scale });
  await toAreaQuestion(p, { area: name.startsWith('phone-320') ? 'Overhead reaching and throwing' : 'Calf and Achilles', side: 'Both sides' });
  const metrics = await p.evaluate(() => {
    const h1 = document.querySelector('.athlete-quiz-stage h1');
    const next = document.querySelector('.athlete-quiz-actions .athlete-quiz-next').getBoundingClientRect();
    const back = document.querySelector('.athlete-quiz-actions .athlete-quiz-back').getBoundingClientRect();
    const rows = [...document.querySelectorAll('.athlete-radio')].map((row) => row.getBoundingClientRect());
    const overlaps = rows.some((row) => { const mark = row; return false; });
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      fontSize: parseFloat(getComputedStyle(h1).fontSize),
      headingHeight: Math.round(h1.getBoundingClientRect().height),
      continueVisible: next.top >= 0 && next.bottom <= window.innerHeight,
      backVisible: back.top >= 0 && back.bottom <= window.innerHeight,
      rowsMinHeight: Math.min(...rows.map((r) => r.height)),
      rowGap: rows.length > 1 ? Math.round(rows[1].top - rows[0].bottom) : 0,
      columnLeft: [h1.getBoundingClientRect().left, rows[0].left, document.querySelector('.athlete-quiz-copy').getBoundingClientRect().left].map(Math.round),
      text: h1.textContent,
    };
  });
  // Every answer reachable: scroll each into view and confirm the bar is not on top of it.
  let reachable = true;
  for (let i = 0; i < 6; i += 1) {
    const row = p.locator('.athlete-radio').nth(i);
    await row.scrollIntoViewIfNeeded();
    const covered = await row.evaluate((el) => { const r = el.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + 20, r.top + r.height / 2); return !el.contains(hit); });
    if (covered) reachable = false;
  }
  layouts.push({ name, ...metrics, reachable });
  await p.evaluate(() => window.scrollTo(0, 0)); await wait(p, 100);
  await p.screenshot({ path: `${out}after/area-question-${name}.png` });
  await ctx.close();
}
for (const layout of layouts) {
  const desktop = layout.name.startsWith('desktop') || layout.name.startsWith('laptop');
  const sizeOk = desktop ? layout.fontSize >= 40 && layout.fontSize <= 48 : layout.fontSize >= 28 && layout.fontSize <= (layout.name.includes('large') ? 48 : 34);
  check(`L-${layout.name}`, `${layout.name}: no sideways scroll, heading ${desktop ? '40–48px' : layout.name.includes('large') ? 'scaled with the text (≤48px)' : '28–34px'}, Continue and Back on screen, every answer reachable, one column`, layout.overflow <= 0 && sizeOk && layout.continueVisible && layout.backVisible && layout.reachable && new Set(layout.columnLeft).size === 1, `${layout.text} · ${layout.fontSize}px · h ${layout.headingHeight} · gap ${layout.rowGap} · left ${layout.columnLeft.join('/')}`);
}

// ── Keyboard ─────────────────────────────────────────────────────────────────────────────
{
  const [ctx, p] = await newQuiz(1280, 800);
  await toAreaQuestion(p, { area: 'Low back' });
  await p.locator('.athlete-quiz-copy').click();
  let reached = false;
  for (let i = 0; i < 12 && !reached; i += 1) { await p.keyboard.press('Tab'); reached = await p.evaluate(() => document.activeElement?.getAttribute('type') === 'radio'); }
  const ring = await p.evaluate(() => getComputedStyle(document.activeElement.closest('.athlete-radio')).outlineStyle);
  await p.keyboard.press('Space'); await wait(p, 100);
  const first = await checkedLabels(p);
  await p.keyboard.press('ArrowDown'); await wait(p, 100);
  const second = await checkedLabels(p);
  await p.screenshot({ path: `${out}after/area-question-keyboard.png` });
  check('K1', 'Tab reaches the answers, focus is visible, Space and arrow keys choose', reached && ring === 'solid' && JSON.stringify(first) === '["Feels fine"]' && JSON.stringify(second) === '["Bothering me now"]', `${ring} ${first} → ${second}`);
  let onContinue = false;
  for (let i = 0; i < 6 && !onContinue; i += 1) { await p.keyboard.press('Tab'); onContinue = await p.evaluate(() => document.activeElement?.classList.contains('athlete-quiz-next')); }
  await p.keyboard.press('Enter'); await wait(p, 500);
  check('K2', 'Enter on Continue moves one step and puts focus on the next question', onContinue && (await count(p)) === 'Step 7 of 14' && await p.evaluate(() => document.activeElement?.tagName) === 'H1', await count(p));
  await ctx.close();
}

writeFileSync(`${out}acceptance.json`, JSON.stringify({ ranAt: new Date().toISOString(), checks, layouts }, null, 2));
console.log(`${checks.filter((c) => c.ok).length}/${checks.length} passed`);
await browser.close();
