// Contact sheets of every mapped exercise photograph, both frames in the movement's order, with
// the exercise's name, equipment and source folder: what the Oct 6 visual review looked at.
//
//   PLAYWRIGHT_MODULE=/opt/node22/lib/node_modules/playwright/index.mjs PLAYWRIGHT_EXECUTABLE=/opt/pw-browsers/chromium \
//   node scripts/exercise-photos/sheets.mjs <catalog.json> <cacheDir> <outDir>
//
// <cacheDir> holds the frames audit.mjs fetched ({source}__{frame}.jpg). Writes sheet-01.png...
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const [catalogPath, cacheDir, outDir] = process.argv.slice(2);
if (!catalogPath || !cacheDir || !outDir) { console.error("usage: sheets.mjs <catalog.json> <cacheDir> <outDir>"); process.exit(1); }
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const mapping = JSON.parse(readFileSync(path.join(root, "client/src/data/exercisePhotos.json"), "utf8"));
const order = JSON.parse(readFileSync(path.join(root, "client/src/data/exercisePhotoOrder.json"), "utf8"));
const mapped = catalog.filter((exercise) => mapping[exercise.id]);
mkdirSync(outDir, { recursive: true });
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");
const browser = await chromium.launch(process.env.PLAYWRIGHT_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE } : {});
const page = await browser.newPage({ viewport: { width: 1500, height: 900 } });
const perSheet = 24;
const cache = path.resolve(cacheDir);
for (let sheet = 0; sheet * perSheet < mapped.length; sheet += 1) {
  const cells = mapped.slice(sheet * perSheet, (sheet + 1) * perSheet).map((exercise) => {
    const [source, count] = mapping[exercise.id];
    const frames = count > 1 ? (order[source] ? [1, 0] : [0, 1]) : [0];
    return `<div class=c><b>${exercise.id} · ${exercise.name}</b><i>${exercise.equipment} · ${source}</i><div class=f>${frames.map((frame) => `<img src="file://${cache}/${source}__${frame}.jpg">`).join("")}</div></div>`;
  }).join("");
  // file:// images only load from a file:// page, so the sheet is written out and opened.
  const html = path.join(path.resolve(outDir), "sheet.html");
  writeFileSync(html, `<style>body{margin:0;font:12px sans-serif;background:#fff}.g{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:6px}.c{border:1px solid #ccc;padding:3px}b{display:block;font-size:13px}i{display:block;color:#555;font-size:11px}.f{display:flex;gap:2px}.f img{width:50%;height:120px;object-fit:contain;background:#eee}</style><div class=g>${cells}</div>`);
  await page.goto(`file://${html}`);
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, `sheet-${String(sheet + 1).padStart(2, "0")}.png`), fullPage: true });
}
console.log(`${Math.ceil(mapped.length / perSheet)} sheets`);
await browser.close();
