// Before screenshots of the question, as it shipped (Oct 5, prior to this change).
import { browser, newQuiz, toAreaQuestion, heading } from './quiz-harness.mjs';
const out = new URL('../evidence/before/', import.meta.url).pathname;
for (const [name, w, h] of [['phone-390', 390, 844], ['desktop-1280', 1280, 800]]) {
  const [ctx, p] = await newQuiz(w, h);
  await toAreaQuestion(p, { area: 'Shoulder' });
  console.log(name, JSON.stringify(await heading(p)), await p.locator('.athlete-quiz-count').innerText());
  await p.screenshot({ path: `${out}area-question-${name}.png` });
  await p.screenshot({ path: `${out}area-question-${name}-full.png`, fullPage: true });
  const actions = await p.locator('.athlete-quiz-actions').boundingBox();
  console.log(name, 'Continue top', Math.round(actions?.y ?? -1), 'viewport', h);
  await ctx.close();
}
await browser.close();
