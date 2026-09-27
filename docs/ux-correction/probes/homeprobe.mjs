import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { boot } from './home.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const dock = (p, l) => p.locator('.mobile-bottom-nav button').filter({ hasText: l }).dispatchEvent('click');
const tab = (p, l) => p.locator('.workspace-top-switcher button').filter({ hasText: l }).dispatchEvent('click');
const read = (p) => p.evaluate(() => ({
  h1: document.querySelector('main h1')?.textContent, primaryLabel: document.querySelector('.today-action-primary .metric-label')?.textContent, primaryH2: document.querySelector('.today-action-primary h2')?.textContent,
  ctas: [...document.querySelectorAll('.today-action-cta, .today-action-secondary')].map((b) => b.textContent.trim()), ctaTop: Math.round(document.querySelector('.today-action-cta')?.getBoundingClientRect().top ?? -1),
  week: document.querySelector('.home-week-line')?.innerText.replace(/\n/g, ' '), record: document.querySelector('.home-week-record')?.textContent,
  insight: document.querySelector('.today-action-state, .today-action-priority')?.querySelector('.metric-label')?.textContent ?? null,
  explore: [...document.querySelectorAll('.home-explore-row strong')].map((e) => e.textContent), focus: document.querySelector('.home-focus h2')?.textContent, matches: document.querySelectorAll('.home-priority-row').length,
  resumeBar: document.querySelector('.session-resume-bar')?.innerText.replace(/\n/g, ' | ') ?? null, scrollW: document.documentElement.scrollWidth, firstLift: document.body.innerText.includes('first lift'),
}));
const p = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await boot(p, { draft: true });
console.log('Home ordinary ->', JSON.stringify(await read(p), null, 1));
await p.screenshot({ path: 'home-ordinary-390.png', fullPage: true });
// Explore doors
for (const [label, expectTab] of [['Find exercises', 'Exercises'], ['Explore muscles', 'Movements'], ['View strength progress', 'Strength']]) {
  await dock(p, 'Home'); await p.waitForTimeout(500);
  await p.locator('.home-explore-row').filter({ hasText: label }).dispatchEvent('click'); await p.waitForTimeout(900);
  console.log(`door ${label} ->`, await p.evaluate(() => ({ search: location.search, tab: document.querySelector('.workspace-top-switcher [aria-current="page"]')?.textContent, h1: document.querySelector('main h1')?.textContent?.trim(), scrollY: window.scrollY })), 'expected tab', expectTab);
}
// Start a workout and log a set, then Home with a live session.
await dock(p, 'Train'); await tab(p, 'Workout'); await p.waitForTimeout(700);
await p.locator('.session-prestart-start').dispatchEvent('click'); await p.waitForTimeout(700);
await p.locator('.live-set-card button').filter({ hasText: /Log set/ }).first().dispatchEvent('click'); await p.waitForTimeout(400);
await dock(p, 'Home'); await p.waitForTimeout(800);
console.log('Home live ->', JSON.stringify(await read(p), null, 1));
await p.screenshot({ path: 'home-live-390.png', fullPage: true });
await p.locator('.today-action-cta').dispatchEvent('click'); await p.waitForTimeout(800);
console.log('resume ->', await p.evaluate(() => ({ search: location.search, live: !!document.querySelector('.live-set-card'), cardTop: Math.round(document.querySelector('.live-set-card')?.getBoundingClientRect().top ?? -1) })));
// Finish the workout, then log a lift, then compare the three screens' counts.
await p.locator('.live-session-finish').first().dispatchEvent('click'); await p.waitForTimeout(600);
await p.locator('[role="alertdialog"] button').filter({ hasText: /finish|keep|save/i }).first().dispatchEvent('click').catch(() => {}); await p.waitForTimeout(600);
await dock(p, 'Progress'); await tab(p, 'Strength'); await p.waitForTimeout(1200);
await p.locator('.strength-log-open').dispatchEvent('click'); await p.waitForTimeout(300);
await p.locator('input[aria-label="Search and choose a catalog exercise"]').fill('back squat'); await p.waitForTimeout(400);
await p.locator('.strength-exercise-picker button').first().dispatchEvent('click'); await p.waitForTimeout(300);
await p.locator('input[aria-label="Load in pounds"]').fill('275'); await p.waitForTimeout(200);
await p.locator('.strength-log-submit button').dispatchEvent('click'); await p.waitForTimeout(800);
const strength = await p.evaluate(() => document.querySelector('.strength-profile-metrics')?.innerText.replace(/\n/g, ' '));
await tab(p, 'Progress'); await p.waitForTimeout(800);
const progress = await p.evaluate(() => [...document.querySelectorAll('.progress-facts > *')].map((e) => e.innerText.replace(/\n/g, ' ')));
await dock(p, 'Home'); await p.waitForTimeout(800);
const home = await p.evaluate(() => document.querySelector('.home-week-record')?.textContent);
console.log('DATA ->', JSON.stringify({ strength, progress, home }));
await p.reload(); await p.waitForTimeout(1500);
console.log('after reload ->', await p.evaluate(() => document.querySelector('.home-week-record')?.textContent));
await browser.close();
