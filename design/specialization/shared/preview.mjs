/**
 * Quick look while drawing: renders every layer of a region's views straight from the view
 * modules (no React, no app) side by side, and writes a PNG. The evidence renders in
 * docs/ come from render-evidence.mjs, which draws through the real component.
 *
 *   node design/specialization/shared/preview.mjs <region> <out.png> [view ...] [--grid]
 *
 * --grid rules the canvas every 50 units, labelled, to place points by.
 */
import { writeFileSync } from "node:fs";
import { chromium } from "./browser.mjs";
import { loadConfig, loadViews, regionArgument } from "./region.mjs";

const args = process.argv.slice(2);
const region = regionArgument(args, "node design/specialization/shared/preview.mjs <region> <out.png> [view ...] [--grid]");
const out = args.find((arg) => arg.endsWith(".png"));
if (!out) throw new Error("Name the PNG to write: node design/specialization/shared/preview.mjs <region> <out.png>");
const grid = args.includes("--grid");
const wanted = args.filter((arg) => arg !== region && !arg.endsWith(".png") && !arg.startsWith("--"));
const { CANVAS } = await loadConfig(region);
const views = await loadViews(region);
const names = wanted.length ? wanted : Object.keys(views);

const style = {
  skin: 'fill="#1b2c3e" stroke="#6b839b" stroke-width="1.2"',
  bone: 'fill="#22364b" stroke="#7e95ad" stroke-width="1" stroke-dasharray="0"',
  outline: 'fill="none" stroke="#4a6179" stroke-width="1.2"',
  ghost: 'fill="none" stroke="#6f86a0" stroke-width="1" stroke-dasharray="4 3"',
  belly: 'fill="#34495f" stroke="#0e1c2b" stroke-width=".8"',
  tendon: 'fill="#9aabbd" stroke="#0e1c2b" stroke-width=".5"',
};

// Grid lines every 50 units over the whole canvas, whatever its size.
const across = Math.floor(CANVAS.height / 50) + 1;
const down = Math.floor(CANVAS.width / 50) + 1;
const gridLines = grid
  ? Array.from({ length: across }, (_, i) => `<line x1="0" x2="${CANVAS.width}" y1="${i * 50}" y2="${i * 50}" stroke="#ff000044"/><text x="2" y="${i * 50 - 2}" fill="#ff8888" font-size="9">${i * 50}</text>`).join("")
    + Array.from({ length: down }, (_, i) => `<line y1="0" y2="${CANVAS.height}" x1="${i * 50}" x2="${i * 50}" stroke="#ff000044"/><text y="9" x="${i * 50 + 2}" fill="#ff8888" font-size="9">${i * 50}</text>`).join("")
  : "";

const panels = [];
for (const name of names) {
  if (!views[name]) throw new Error(`${region} has no view ${name} (it has ${Object.keys(views).join(", ")})`);
  for (const [layer, drawn] of Object.entries(views[name])) {
    const paths = drawn.paths.map((path) => `<path ${style[path.kind]} d="${path.d}"><title>${path.node ?? path.structure}</title></path>`).join("");
    const labels = drawn.labels.map((label) => `<text x="${label.x}" y="${label.y}" text-anchor="${label.anchor}" fill="#c3d7ea" font-size="14" font-family="sans-serif">${label.text}</text>`).join("");
    const bellies = drawn.paths.filter((path) => path.kind === "belly").map((path) => path.node);
    panels.push(`<figure><figcaption>${name} · ${layer} · ${bellies.join(" ")}</figcaption><svg viewBox="0 0 ${CANVAS.width} ${CANVAS.height}" width="${CANVAS.width}" height="${CANVAS.height}">${paths}${labels}${gridLines}</svg></figure>`);
  }
}
const html = `<!doctype html><html><body style="margin:0;background:#0b2240;color:#c3d7ea;font:12px sans-serif;display:flex;flex-wrap:wrap;gap:12px;padding:12px">${panels.join("")}</body></html>`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Math.min(4000, panels.length * (CANVAS.width + 20) + 30), height: CANVAS.height + 70 }, deviceScaleFactor: 1.5 });
await page.setContent(html);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
writeFileSync(out.replace(/\.png$/, ".html"), html);
console.log(`wrote ${out}`);
