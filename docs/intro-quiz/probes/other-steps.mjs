// The shared action bar on other questions: the first one, and the measurements step with its own Skip.
import { browser, newQuiz, next, wait } from './quiz-harness.mjs';
const out = new URL('../evidence/after/', import.meta.url).pathname;
const [ctx, p] = await newQuiz(390, 844);
await p.screenshot({ path: `${out}step-1-goal-phone-390.png` });
console.log('step 1:', await p.locator('.athlete-quiz-count').innerText());
await next(p);
await p.locator('.athlete-choice').filter({ hasText: 'General strength and resilience' }).click();
await next(p);
console.log('after mode:', await p.locator('.athlete-quiz-count').innerText());
for (let i = 0; i < 8 && !(await p.getByText('if you want.').count()); i += 1) await next(p);
await p.screenshot({ path: `${out}step-measurements-phone-390.png` });
console.log('measurements:', await p.locator('.athlete-quiz-count').innerText(), 'skip visible:', await p.locator('.athlete-quiz-skip').isVisible());
await browser.close();
