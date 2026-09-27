// Phase E audit: one pass over every page, reading what §11 asks for.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { boot } from './home.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const dock = (p, l) => p.locator('.mobile-bottom-nav button').filter({ hasText: l }).dispatchEvent('click');
const tab = (p, l) => p.locator('.workspace-top-switcher button').filter({ hasText: l }).dispatchEvent('click');
const p = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await boot(p, { draft: true });
const say = (k, v) => console.log(k, JSON.stringify(v, null, 1));
// Movements
await dock(p, 'Body Lab'); await tab(p, 'Movements'); await p.waitForTimeout(900);
say('MOV', await p.evaluate(() => ({ h1: document.querySelector('main h1')?.textContent, purpose: document.querySelector('.atlas-quiet-context')?.textContent, sport: document.querySelector('.atlas-sport-select select')?.value, selected: document.querySelector('.atlas-selected h2')?.textContent, stepper: [...document.querySelectorAll('.atlas-stepper button')].map((b) => `${b.getAttribute('aria-label')}${b.disabled ? ' (disabled)' : ''}`), trace: document.querySelector('.atlas-trace')?.textContent, figure: !!document.querySelector('.atlas-figure, .atlas-selected img, .atlas-selected svg') })));
await p.locator('.atlas-stepper button').first().dispatchEvent('click'); await p.waitForTimeout(300);
say('MOV prev at first', await p.evaluate(() => ({ position: document.querySelector('.atlas-stepper')?.innerText.replace(/\n/g, ' '), disabledPrev: document.querySelector('.atlas-stepper button')?.disabled })));
await p.locator('.atlas-trace').dispatchEvent('click'); await p.waitForTimeout(900);
say('MOV->MUS', await p.evaluate(() => ({ search: location.search, h1: document.querySelector('main h1')?.textContent, action: document.querySelector('.body-lab-selection-action')?.textContent, sport: document.querySelector('.body-lab-selection-sport')?.textContent, legend: [...document.querySelectorAll('.atlas-legend span, .anatomy-legend span')].map((e) => e.textContent).slice(0, 4), sides: [...document.querySelectorAll('.atlas-turn button, .anatomy-turn button, .atlas-figure-caption')].map((e) => e.textContent).slice(0, 3), rows: document.querySelectorAll('.atlas-role-row').length, find: document.querySelector('.atlas-foot button, .atlas-find-exercises')?.textContent })));
// Select a muscle row, find exercises.
await p.locator('.atlas-role-row').first().dispatchEvent('click'); await p.waitForTimeout(400);
say('MUS selected', await p.evaluate(() => ({ selected: document.querySelector('.atlas-role-row[aria-pressed="true"], .atlas-role-row.is-selected')?.innerText.split('\n')[0], find: [...document.querySelectorAll('.atlas-foot button, .atlas-inspector button')].map((b) => b.textContent).slice(0, 3) })));
const findBtn = p.locator('button').filter({ hasText: /Find .*exercises|exercises for/i }).first();
if (await findBtn.count()) { await findBtn.dispatchEvent('click'); await p.waitForTimeout(900); say('MUS->CAT', await p.evaluate(() => ({ search: location.search, h1: document.querySelector('main h1')?.textContent, chips: [...document.querySelectorAll('.catalog-discovery-chips button')].map((b) => b.textContent.trim()), count: document.querySelector('.catalog-discovery-heading > span')?.textContent, scope: document.querySelector('.catalog-discovery-action-scope')?.textContent }))); }
// Catalog
await dock(p, 'Body Lab'); await tab(p, 'Exercises'); await p.waitForTimeout(700);
say('CAT', await p.evaluate(() => ({ h1: document.querySelector('main h1')?.textContent, eyebrow: document.querySelector('.catalog-discovery-heading p')?.textContent, count: document.querySelector('.catalog-discovery-heading > span')?.textContent, search: document.querySelector('.catalog-discovery-search input')?.getAttribute('aria-label'), scopeLine: document.querySelector('.local-search-scope')?.innerText.replace(/\n/g, ' '), tabs: [...document.querySelectorAll('.catalog-discovery-tabs button')].map((b) => b.textContent), rowControls: [...document.querySelectorAll('.catalog-discovery-card:first-child button')].map((b) => b.getAttribute('aria-label')), tier: document.querySelector('.catalog-discovery-tier')?.getAttribute('aria-label'), boxed: getComputedStyle(document.querySelector('.catalog-discovery-card')).borderTopWidth })));
// Overlay
await p.locator('.catalog-discovery-card-copy').first().dispatchEvent('click'); await p.waitForTimeout(700);
say('EX', await p.evaluate(() => ({ title: document.querySelector('#exercise-intelligence-title')?.textContent, close: document.querySelector('.exercise-intelligence-close')?.getAttribute('aria-label'), tabs: [...document.querySelectorAll('.genome-tab')].map((b) => b.textContent), roles: document.querySelector('.exercise-intelligence-roles')?.innerText.replace(/\n/g, ' | ').slice(0, 120), explore: document.querySelector('.exercise-intelligence-explore')?.textContent, context: document.querySelector('.inspection-action-connection-label')?.textContent, evidence: document.querySelector('.exercise-intelligence-disclosure summary')?.textContent, add: document.querySelector('.exercise-intelligence-add')?.textContent, fav: document.querySelector('.exercise-intelligence-favorite')?.getAttribute('aria-label') })));
await p.locator('.exercise-intelligence-close').dispatchEvent('click'); await p.waitForTimeout(500);
// Plan
await dock(p, 'Train'); await tab(p, 'Plan'); await p.waitForTimeout(800);
say('PLAN', await p.evaluate(() => ({ h1: document.querySelector('main h1')?.textContent, weeks: [...document.querySelectorAll('.training-plan-week, .training-plan-weeks button')].map((b) => b.innerText.replace(/\n/g, ' ')).slice(0, 3), days: [...document.querySelectorAll('.training-plan-day')].map((b) => `${b.innerText.replace(/\n/g, ' ')}${b.getAttribute('aria-pressed') === 'true' || b.className.includes('active') ? '*' : ''}`), identity: document.querySelector('.training-plan-identity')?.innerText.replace(/\n/g, ' | '), rowEdit: document.querySelector('.custom-row-edit-label')?.textContent, reorder: [...document.querySelectorAll('.day-order-controls button')].slice(0, 2).map((b) => b.getAttribute('aria-label')), actions: [...document.querySelectorAll('.day-plan-actions button')].map((b) => b.textContent.trim()), draft: document.querySelector('.day-plan-draft summary')?.innerText.replace(/\n/g, ' '), saved: document.querySelector('.training-plan-saved')?.textContent, noteAfterList: !!document.querySelector('.day-plan-list ~ .day-capacity-note') })));
// Review
await tab(p, 'Review'); await p.waitForTimeout(800);
say('REV', await p.evaluate(() => ({ h1: document.querySelector('main h1')?.textContent, sub: document.querySelector('.day-review-workspace .view-header p, .day-review-head p')?.textContent, sections: [...document.querySelectorAll('.day-review-workspace .metric-label, .day-review-workspace h2')].map((e) => e.textContent).slice(0, 8), open: document.querySelector('.day-review-open')?.textContent })));
// Workout prestart
await tab(p, 'Workout'); await p.waitForTimeout(800);
say('WORK prestart', await p.evaluate(() => ({ eyebrow: document.querySelector('.session-prestart-hero .metric-label')?.textContent, day: document.querySelector('.session-prestart-day')?.textContent, start: document.querySelector('.session-prestart-start')?.textContent, rows: document.querySelectorAll('.session-prestart-row').length, disclosures: [...document.querySelectorAll('.session-prestart-disclosure > summary')].map((e) => e.innerText.replace(/\n/g, ' ')) })));
// Matches
await tab(p, 'Matches'); await p.waitForTimeout(800);
say('MATCH', await p.evaluate(() => ({ h1: document.querySelector('main h1')?.textContent, purpose: document.querySelector('.matches-head p')?.textContent, lens: document.querySelector('.matches-lens')?.innerText.replace(/\n/g, ' ').slice(0, 140), change: document.querySelector('.matches-link')?.textContent, count: document.querySelector('.matches-count')?.textContent, firstRow: document.querySelector('.recommendation-row')?.innerText.replace(/\n/g, ' | ').slice(0, 160), why: document.querySelector('.recommendation-why summary')?.textContent, scoreLabel: document.querySelector('.recommendation-score')?.getAttribute('aria-label'), add: document.querySelector('.recommendation-add')?.getAttribute('aria-label') })));
await p.locator('.recommendation-why summary').first().dispatchEvent('click'); await p.waitForTimeout(300);
say('MATCH why', await p.evaluate(() => [...document.querySelectorAll('.recommendation-why')].slice(0, 2).map((d) => d.innerText.replace(/\n/g, ' ').slice(0, 120))));
// Progress + Strength + Profile identity lines
await dock(p, 'Progress'); await p.waitForTimeout(700);
say('PROG', await p.evaluate(() => ({ h1: document.querySelector('main h1')?.textContent, facts: [...document.querySelectorAll('.progress-facts > *')].map((e) => e.innerText.replace(/\n/g, ' ')), trend: document.querySelector('.progress-comparison-card h2')?.textContent })));
await tab(p, 'Strength'); await p.waitForTimeout(1200);
say('STR', await p.evaluate(() => ({ h1: document.querySelector('main h1')?.textContent, metrics: document.querySelector('.strength-profile-metrics')?.innerText.replace(/\n/g, ' '), caption: document.querySelector('.strength-body-map-caption')?.textContent, encoding: document.querySelector('.anatomy-figure')?.getAttribute('data-encoding'), legend: [...document.querySelectorAll('.strength-map-legend span')].map((e) => e.textContent) })));
await p.locator('.topbar-profile-button').dispatchEvent('click'); await p.waitForTimeout(700);
say('PROFILE', await p.evaluate(() => ({ h1: document.querySelector('main h1')?.textContent, edit: document.querySelector('.about-me-edit')?.textContent, groups: document.querySelectorAll('.about-me-group').length, saved: document.querySelector('.about-me-saved')?.textContent })));
await browser.close();
