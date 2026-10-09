// SEC10: the report-only CSP in vercel.json, ENFORCED on the built app in headless Chromium
// (vite preview), across the main screens. Any violation is a resource the policy would block.
// Viewport emulation only; not a phone. Run: node docs/infrastructure-v2/probes/csp.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { browser, base, seed, page, wait, openExercise } from '../../exercise-intelligence/probes/shared.mjs';

const vercel = JSON.parse(readFileSync(new URL('../../../vercel.json', import.meta.url), 'utf8'));
const policy = vercel.headers[0].headers.find((h) => h.key === 'Content-Security-Policy-Report-Only').value;
const violations = [];
const [ctx, p] = await page(390, 844);
// Enforce it on every document the app loads.
await p.route('**/*', async (route) => {
  const request = route.request();
  if (request.resourceType() !== 'document' || !request.url().startsWith(base)) return route.fallback();
  const response = await route.fetch();
  const headers = { ...response.headers(), 'content-security-policy': policy };
  return route.fulfill({ response, headers });
});
await p.exposeFunction('reportViolation', (v) => violations.push(v));
await p.addInitScript(() => document.addEventListener('securitypolicyviolation', (e) => window.reportViolation({ directive: e.effectiveDirective, blocked: e.blockedURI, source: e.sourceFile, line: e.lineNumber })));
p.on('console', (m) => { if (/Content Security Policy/i.test(m.text())) violations.push({ console: m.text().slice(0, 200) }); });

await seed(p);
for (const workspace of ['command', 'catalog', 'day-plan', 'tracker', 'progress', 'strength', 'movement', 'body', 'review']) {
  await p.goto(`${base}/?workspace=${workspace}`); await wait(p, 1500);
}
await openExercise(p, 'Barbell Bench Press');
await p.goto(`${base}/s/not-a-real-token`); await wait(p, 1200);
// The intro and boot splash run on a first launch.
await p.evaluate(() => localStorage.removeItem('sports-genome-launch-experience-enabled-v1'));
await p.goto(`${base}/`); await wait(p, 3000);
await ctx.close(); await browser.close();
const unique = Array.from(new Map(violations.map((v) => [JSON.stringify(v), v])).values());
writeFileSync(new URL('../evidence/csp-violations.json', import.meta.url), JSON.stringify({ policy, violations: unique }, null, 2));
console.log(unique.length ? `${unique.length} distinct violations:\n${unique.map((v) => JSON.stringify(v)).join('\n')}` : 'no violations');
