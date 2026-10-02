import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { boot } from './home.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const dock = (p, l) => p.locator('.mobile-bottom-nav button').filter({ hasText: l }).dispatchEvent('click');
const tab = (p, l) => p.locator('.workspace-top-switcher button').filter({ hasText: l }).dispatchEvent('click');
const p = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await boot(p, { draft: true });
// Start Sport Transfer (Day 05), log one set.
await dock(p, 'Train'); await tab(p, 'Workout'); await p.waitForTimeout(700);
await p.locator('.session-prestart-start').dispatchEvent('click'); await p.waitForTimeout(700);
await p.locator('.live-set-card button').filter({ hasText: /Log set/ }).first().dispatchEvent('click'); await p.waitForTimeout(400);
console.log('tracker strip ->', await p.evaluate(() => ({ strip: !!document.querySelector('.session-resume-bar'), gapHeadToCard: Math.round(document.querySelector('.live-set-card').getBoundingClientRect().top - document.querySelector('.execution-head').getBoundingClientRect().bottom) })));
// Plan: select another day (Pull) while live.
await tab(p, 'Plan'); await p.waitForTimeout(700);
await p.locator('.training-plan-day').nth(1).dispatchEvent('click'); await p.waitForTimeout(700);
console.log('plan editing ->', await p.evaluate(() => ({ heading: document.querySelector('.day-design-main h2, .training-plan-identity h2, .training-plan-identity h1')?.textContent?.trim(), editing: document.querySelector('.day-editing-context')?.innerText.replace(/\n/g, ' | '), noteBelowList: (document.querySelector('.day-capacity-note')?.compareDocumentPosition(document.querySelector('.day-plan-list')) & Node.DOCUMENT_POSITION_PRECEDING) > 0, editLabel: document.querySelector('.custom-row-edit-label')?.textContent, reorder: [...document.querySelectorAll('.day-order-controls button')].slice(0, 2).map((b) => b.getAttribute('aria-label')), strip: document.querySelector('.session-resume-bar')?.innerText.replace(/\n/g, ' | ') })));
await p.screenshot({ path: 'plan-live-390.png', fullPage: false });
// Resume from the strip: still Sport Transfer.
await p.locator('.session-resume-bar').dispatchEvent('click'); await p.waitForTimeout(800);
console.log('resume from strip ->', await p.evaluate(() => ({ search: location.search, day: document.querySelector('.execution-head .metric-label')?.textContent, exercise: document.querySelector('.live-set-card h4')?.textContent, set: document.querySelector('.live-set-prescription span')?.textContent })));
// Catalog with a live session: destination strip above the resume bar; add feedback.
await dock(p, 'Body Lab'); await tab(p, 'Exercises'); await p.waitForTimeout(900);
console.log('catalog strip ->', await p.evaluate(() => { const s = document.querySelector('.add-destination').getBoundingClientRect(); const r = document.querySelector('.session-resume-bar').getBoundingClientRect(); return { strip: document.querySelector('.add-destination > summary').innerText.replace(/\n/g, ' '), stripBottom: Math.round(s.bottom), resumeTop: Math.round(r.top), clear: s.bottom <= r.top + 1, plus: document.querySelector('.catalog-discovery-actions button:last-child')?.getAttribute('aria-label') }; }));
await p.screenshot({ path: 'catalog-live-390.png', fullPage: false });
await p.locator('.catalog-discovery-actions button:last-child').first().dispatchEvent('click'); await p.waitForTimeout(600);
console.log('add toast ->', await p.evaluate(() => ({ toast: document.querySelector('[data-sonner-toast]')?.innerText.replace(/\n/g, ' | '), buttons: [...document.querySelectorAll('[data-sonner-toast] button')].map((b) => b.textContent) })));
await p.screenshot({ path: 'catalog-added-390.png', fullPage: false });
await p.locator('.catalog-discovery-actions button:last-child').first().dispatchEvent('click'); await p.waitForTimeout(400);
console.log('second tap ->', await p.evaluate(() => [...document.querySelectorAll('[data-sonner-toast]')].map((t) => t.innerText.split('\n')[0])));
await p.locator('[data-sonner-toast] button').filter({ hasText: 'View workout' }).first().dispatchEvent('click'); await p.waitForTimeout(800);
console.log('view workout ->', await p.evaluate(() => ({ search: location.search, day: document.querySelector('.training-plan-identity h1, .training-plan-identity h2')?.textContent?.trim(), rows: document.querySelectorAll('.custom-prescription').length, last: [...document.querySelectorAll('.custom-row-identity strong')].pop()?.textContent })));
// Home: hero resume visible → no strip; scroll past → strip.
await dock(p, 'Home'); await p.waitForTimeout(900);
const top = await p.evaluate(() => ({ strip: !!document.querySelector('.session-resume-bar'), ctas: document.querySelectorAll('.today-action-cta').length }));
await p.evaluate(() => window.scrollTo(0, 900)); await p.waitForTimeout(600);
const scrolled = await p.evaluate(() => ({ strip: !!document.querySelector('.session-resume-bar'), text: document.querySelector('.session-resume-bar')?.innerText.replace(/\n/g, ' | ') }));
console.log('home strip policy ->', JSON.stringify({ top, scrolled }));
await p.screenshot({ path: 'home-live-top-390.png', fullPage: false });
// Undo: add then undo from the overlay path.
await dock(p, 'Train'); await tab(p, 'Matches'); await p.waitForTimeout(900);
console.log('matches add label ->', await p.evaluate(() => document.querySelector('.recommendation-add')?.getAttribute('aria-label')));
await browser.close();
