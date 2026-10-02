// Phase A baseline: reproduce the register's symptoms in the current build.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { boot } from './home.mjs';
const out = process.argv[2] || 'baseline';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const dock = (p, l) => p.locator('.mobile-bottom-nav button').filter({ hasText: l }).dispatchEvent('click');
const tab = (p, l) => p.locator('.workspace-top-switcher button').filter({ hasText: l }).dispatchEvent('click');
const wait = (p, ms = 800) => p.waitForTimeout(ms);
const shell = (p) => p.evaluate(() => {
  const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { x: Math.round(b.left), r: Math.round(b.right), w: Math.round(b.width), h: Math.round(b.height) }; };
  const tabs = [...document.querySelectorAll('.workspace-top-switcher button')].map((b) => { const bb = b.getBoundingClientRect(); const actions = document.querySelector('.workspace-top-actions')?.getBoundingClientRect(); return `${b.textContent}${b.getAttribute('aria-current') ? '*' : ''}@${Math.round(bb.left)}-${Math.round(bb.right)}${actions && bb.right > actions.left ? ' COVERED' : ''}`; });
  return { topbar: r('.apex-topbar'), switcherShell: r('.workspace-top-switcher-shell'), nav: r('.workspace-top-switcher'), actions: r('.workspace-top-actions'), tabs, overflowEnd: document.querySelector('.workspace-top-switcher-shell')?.getAttribute('data-overflow-end'), h1: document.querySelector('main h1')?.textContent?.trim().slice(0, 50), scrollY: window.scrollY, scrollW: document.documentElement.scrollWidth };
});
for (const width of [390, 360]) {
  const p = await browser.newPage({ viewport: { width, height: 844 }, deviceScaleFactor: 1 });
  await boot(p, { draft: true });
  console.log(`\n== ${width} Home (no session) ==`, JSON.stringify(await shell(p)));
  await p.screenshot({ path: `${out}-home-${width}.png`, fullPage: false });
  await dock(p, 'Train'); await wait(p);
  for (const t of ['Plan', 'Review', 'Session', 'Matches']) { await tab(p, t); await wait(p, 600); console.log(`== ${width} Train/${t} ==`, JSON.stringify(await shell(p))); await p.screenshot({ path: `${out}-train-${t.toLowerCase()}-${width}.png`, fullPage: false }); }
  await dock(p, 'Body Lab'); await wait(p); console.log(`== ${width} Body Lab ==`, JSON.stringify((await shell(p)).tabs));
  await dock(p, 'Progress'); await wait(p); console.log(`== ${width} Progress ==`, JSON.stringify((await shell(p)).tabs));
  await p.locator('.topbar-profile-button').dispatchEvent('click'); await wait(p); console.log(`== ${width} Profile ==`, JSON.stringify(await shell(p))); await p.screenshot({ path: `${out}-profile-${width}.png`, fullPage: false });
  if (width === 390) {
    // Start a workout, log a set, then look at every other screen with it active.
    await dock(p, 'Train'); await tab(p, 'Session'); await wait(p);
    await p.locator('.session-prestart-start').dispatchEvent('click'); await wait(p);
    await p.locator('.live-set-card button').filter({ hasText: /Log set/ }).first().dispatchEvent('click'); await wait(p, 500);
    console.log('== live workout entry (after start) ==', JSON.stringify(await p.evaluate(() => { const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { top: Math.round(b.top), h: Math.round(b.height) }; }; return { scrollY: window.scrollY, head: r('.execution-head'), card: r('.live-set-card'), rest: r('.live-rest-row'), resumeBar: !!document.querySelector('.session-resume-bar') }; })));
    await p.screenshot({ path: `${out}-workout-live-390.png`, fullPage: false });
    await tab(p, 'Plan'); await wait(p);
    await p.evaluate(() => window.scrollTo(0, 600)); await wait(p, 300);
    await tab(p, 'Session'); await wait(p);
    console.log('== live workout via tab from scrolled Plan ==', JSON.stringify(await p.evaluate(() => { const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { top: Math.round(b.top), h: Math.round(b.height) }; }; return { scrollY: window.scrollY, head: r('.execution-head'), card: r('.live-set-card'), rest: r('.live-rest-row'), pageH: document.documentElement.scrollHeight, resumeBar: !!document.querySelector('.session-resume-bar') }; })));
    await p.screenshot({ path: `${out}-workout-live-fromplan-390.png`, fullPage: false });
    await tab(p, 'Plan'); await wait(p);
    await p.locator('.training-plan-day').nth(1).dispatchEvent('click').catch(() => {}); await wait(p, 600);
    console.log('== Plan with another day selected while live ==', JSON.stringify(await p.evaluate(() => ({ selected: document.querySelector('.training-plan-day[aria-pressed="true"], .training-plan-day-active')?.textContent?.trim(), h2: document.querySelector('.day-design-main h2, .day-design-main h1')?.textContent?.trim(), editingLabel: document.body.innerText.includes('Editing'), resumeBar: document.querySelector('.session-resume-bar')?.innerText.replace(/\n/g, ' | '), prompt: !!document.querySelector('.day-profile-prompt, .day-programming-panel .metric-label') }))));
    await p.screenshot({ path: `${out}-plan-live-390.png`, fullPage: true });
    await dock(p, 'Home'); await wait(p);
    console.log('== Home with live session ==', JSON.stringify(await p.evaluate(() => ({ order: [...document.querySelectorAll('.today-action-panel > *')].map((e) => e.className + ': ' + (e.querySelector('h2')?.textContent || e.textContent.slice(0, 40))), primaryTop: Math.round(document.querySelector('.today-action-primary')?.getBoundingClientRect().top ?? -1), resumeBar: document.querySelector('.session-resume-bar')?.innerText.replace(/\n/g, ' | '), facts: [...document.querySelectorAll('.today-action-facts > *')].map((e) => e.innerText.replace(/\n/g, ' ')) }))));
    await p.screenshot({ path: `${out}-home-live-390.png`, fullPage: true });
    await dock(p, 'Body Lab'); await tab(p, 'Catalog'); await wait(p);
    console.log('== Catalog add destination ==', JSON.stringify(await p.evaluate(() => ({ strip: document.querySelector('.add-destination')?.innerText.replace(/\n/g, ' | ').slice(0, 120), stripTop: Math.round(document.querySelector('.add-destination')?.getBoundingClientRect().top ?? -1), stripBottom: Math.round(document.querySelector('.add-destination')?.getBoundingClientRect().bottom ?? -1), resumeTop: Math.round(document.querySelector('.session-resume-bar')?.getBoundingClientRect().top ?? -1), plusLabel: document.querySelector('.catalog-discovery-actions button:last-child')?.getAttribute('aria-label'), innerH: innerHeight }))));
    await p.screenshot({ path: `${out}-catalog-live-390.png`, fullPage: false });
    await dock(p, 'Progress'); await tab(p, 'Strength'); await wait(p, 1500);
    console.log('== Strength (live) ==', JSON.stringify(await p.evaluate(() => ({ metrics: document.querySelector('.strength-profile-metrics')?.innerText.replace(/\n/g, ' '), encoding: document.querySelector('.anatomy-figure')?.getAttribute('data-encoding'), resumeBar: !!document.querySelector('.session-resume-bar') }))));
  }
  await p.close();
}
await browser.close();
