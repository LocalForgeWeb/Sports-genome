import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { readFileSync } from "node:fs";
const front = readFileSync("front_src.svg", "utf8");
const back = readFileSync("back_src.svg", "utf8");
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 760, height: 1180 }, deviceScaleFactor: 2 });
await page.setContent(`<body style="margin:0;background:#0d1b2e;display:flex;gap:40px;justify-content:center;padding:24px">
  <style>svg{width:300px;height:auto;color:#6F7886}</style>
  ${front}${back}</body>`);
const picked = await page.evaluate(() => {
  const report = [];
  document.querySelectorAll("svg").forEach((svg, si) => {
    const body = svg.querySelector("#body");
    const paths = [...body.querySelectorAll("path")];
    // Only the big outline paths become the shell. Blanket-filling every
    // line-art path turns open detail strokes (face, nape) into dark wedges.
    const big = paths.filter((p) => { const b = p.getBBox(); return b.width > 150 && b.height > 400; });
    report.push({ svg: si, total: paths.length, shell: big.length });
    const shell = document.createElementNS("http://www.w3.org/2000/svg", "g");
    big.forEach((p) => {
      const c = p.cloneNode(true);
      c.setAttribute("fill", "#343D4A"); c.setAttribute("stroke", "none");
      shell.appendChild(c);
    });
    svg.insertBefore(shell, svg.firstChild);
    paths.forEach((p) => { p.setAttribute("stroke", "#929CAA"); p.setAttribute("stroke-width", "2"); });
  });
  return report;
});
console.log(JSON.stringify(picked));
await page.waitForTimeout(250);
await page.screenshot({ path: "test-base.png" });
await browser.close();
