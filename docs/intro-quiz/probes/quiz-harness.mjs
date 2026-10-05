// Harness for the intro-quiz checks: headless Chromium against `vite preview` (:4173), fresh
// storage (a new athlete, so the quiz shows), tRPC answered locally with a target catalog shaped
// like production's `resilience_targets` (names as stored there on Oct 5). Not a phone, not a person.
import { browser, wire } from '../../exercise-intelligence/probes/shared.mjs';

export { browser };
export const base = process.env.BASE ?? 'http://localhost:4173';
const t = (targetKey, name, targetType, region, lateralitySupported, routes = ['general']) => ({ targetId: `00000000-0000-0000-0000-${String(targetKey.length).padStart(12, '0')}${targetKey}`.slice(0, 36), targetKey, name, targetType, region, lateralitySupported, supportedRoutes: routes });
export const catalog = {
  status: 'connected',
  boundary: 'Targets come from the reviewed catalog.',
  targets: [
    t('shoulder', 'Shoulder', 'body_region', 'shoulder', true),
    t('knee', 'Knee', 'body_region', 'knee', true),
    t('hamstring', 'Hamstrings', 'body_region', 'hamstring', true),
    t('lumbar_spine', 'Low back', 'body_region', 'low back', false),
    t('calf_achilles', 'Calf and Achilles', 'body_region', 'lower leg', true),
    t('wrist_hand', 'Wrist and hand', 'body_region', 'wrist/hand', true),
    t('general_musculoskeletal', 'General musculoskeletal', 'body_region', 'whole body', false, []),
    t('overhead_reaching', 'Overhead reaching and throwing', 'functional_task', 'shoulder', true),
    t('sprinting', 'Sprinting', 'functional_task', 'lower limb', false),
  ],
};
const answer = (route) => {
  const url = new URL(route.request().url());
  const calls = url.pathname.replace('/api/trpc/', '').split(',');
  return route.fulfill({ contentType: 'application/json', body: JSON.stringify(calls.map((call) => ({ result: { data: { json: call === 'resilience.targetCatalog' ? catalog : null } } }))) });
};
export async function newQuiz(width, height, { catalogOff = false, scale = 1 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await wire(p, { trpc: catalogOff ? undefined : answer });
  await p.goto(base);
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('sports-genome-launch-experience-enabled-v1', 'off'); localStorage.setItem('sports-genome-launched-before-v1', 'yes'); });
  await p.goto(base);
  await p.waitForSelector('.athlete-quiz-shell', { timeout: 15000 });
  if (scale !== 1) await p.evaluate((scale) => { document.documentElement.style.fontSize = `${16 * scale}px`; }, scale);
  return [ctx, p];
}
export const wait = (p, ms) => p.waitForTimeout(ms);
export const heading = (p) => p.locator('.athlete-quiz-stage h1').innerText();
export const next = async (p) => { await p.locator('.athlete-quiz-actions .athlete-quiz-next').click(); await wait(p, 450); };
export const back = async (p) => { await p.locator('.athlete-quiz-actions .athlete-quiz-back').click(); await wait(p, 450); };
/** Goal → sport mode → Wrestling → general role → the chosen area (and side), stopping on the question after it. */
export async function toAreaQuestion(p, { area = 'Shoulder', side = null, sport = true } = {}) {
  await next(p);
  await p.locator('.athlete-choice').filter({ hasText: sport ? 'I train for a sport' : 'General strength and resilience' }).click();
  await next(p);
  if (sport) {
    await p.locator('.athlete-sport-trigger').click(); await wait(p, 300);
    await p.getByRole('combobox', { name: 'Search sports' }).fill('Wrestling'); await wait(p, 300);
    await p.getByRole('option').filter({ hasText: /^Wrestling/ }).first().click(); await wait(p, 200);
    await next(p);
    await next(p);
  }
  await p.locator('.athlete-choice').filter({ has: p.locator('strong', { hasText: new RegExp(`^${area}$`) }) }).click(); await wait(p, 200);
  if (side) { await p.locator('.athlete-choice').filter({ has: p.locator('strong', { hasText: new RegExp(`^${side}$`) }) }).click(); await wait(p, 200); }
  await next(p);
}
