import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { readFileSync } from "node:fs";
const front = readFileSync("front_src.svg", "utf8");
const back = readFileSync("back_src.svg", "utf8");
// Render exactly as the app would at rest: every muscle one neutral grey, line
// art on top. If it only looks good coloured, it is not good enough.
const css = `
  svg { width: 300px; height: auto; color: #6F7886; }
  svg [fill="none"] { stroke: #929CAA; stroke-width: 2; }
`;
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 760, height: 1180 }, deviceScaleFactor: 2 });
await page.setContent(`<body style="margin:0;background:#0d1b2e;display:flex;gap:40px;justify-content:center;padding:24px">
  <style>${css}</style>${front}${back}</body>`);
await page.waitForTimeout(250);
await page.screenshot({ path: "source-neutral.png" });
await browser.close();
console.log("rendered source-neutral.png");
