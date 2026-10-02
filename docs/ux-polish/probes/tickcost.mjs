// PERF-06: DOM mutations per second while the rest clock runs (a proxy for how much re-renders touch).
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { boot } from './home.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const dock = (p, l) => p.locator('.mobile-bottom-nav button').filter({ hasText: l }).first().dispatchEvent('click');
const tab = (p, l) => p.locator('.workspace-top-switcher button').filter({ hasText: l }).first().dispatchEvent('click');
const p = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await boot(p, { draft: true });
await dock(p, 'Train'); await tab(p, 'Workout'); await p.waitForTimeout(800); await p.locator('.session-prestart-start').dispatchEvent('click'); await p.waitForTimeout(800);
await p.locator('.live-set-commit').dispatchEvent('click'); await p.waitForTimeout(500);
const r = await p.evaluate(() => new Promise((resolve) => { let mutations = 0; let nodes = 0; const kinds = {}; const o = new MutationObserver((list) => { mutations += list.length; for (const m of list) { nodes += m.addedNodes.length + m.removedNodes.length + (m.type === 'characterData' ? 1 : 0); const k = m.type === 'attributes' ? `attr:${m.attributeName}@${m.target.className?.toString().split(' ')[0] || m.target.tagName}` : `${m.type}@${(m.target.className || m.target.parentElement?.className || '').toString().split(' ')[0]}`; kinds[k] = (kinds[k] || 0) + 1; } }); o.observe(document.querySelector('main'), { subtree: true, childList: true, characterData: true, attributes: true }); const t0 = performance.now(); setTimeout(() => { o.disconnect(); resolve({ seconds: Math.round((performance.now() - t0) / 100) / 10, mutations, nodes, top: Object.entries(kinds).sort((a, b) => b[1] - a[1]).slice(0, 6), clock: document.querySelector('.live-rest-clock')?.textContent }); }, 5000); }));
console.log(JSON.stringify(r));
await browser.close();
