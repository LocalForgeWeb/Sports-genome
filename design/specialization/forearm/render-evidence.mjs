/**
 * Renders the diagram through the real component (SpecializationDiagram.tsx, its CSS and the
 * app's colour tokens) in headless Chromium at phone size, writes PNGs, and measures the tap
 * targets. Headless emulation of a 390 × 844 pt phone at device scale 3: not an iPhone, not Safari.
 *
 *   node design/specialization/forearm/render-evidence.mjs [outDir] [--only=palm-surface-right,...] [--scale=2]
 *
 * outDir defaults to docs/specialization-atlas/evidence. Writes diagram-<view>-<layer>-<arm>.png
 * per view, layer and arm, a fills/selection sheet, and hit-targets.json: for each muscle on
 * each layer, the largest square of screen that a tap there selects it, in CSS px.
 */
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const args = process.argv.slice(2);
const outDir = resolve(root, args.find((arg) => !arg.startsWith("--")) ?? "docs/specialization-atlas/evidence");
const only = (args.find((arg) => arg.startsWith("--only=")) ?? "").slice(7).split(",").filter(Boolean);
const scale = Number((args.find((arg) => arg.startsWith("--scale=")) ?? "--scale=3").slice(8));
mkdirSync(outDir, { recursive: true });

const bundleDir = mkdtempSync(resolve(tmpdir(), "forearm-diagram-evidence-"));
await build({
  entryPoints: [resolve(root, "design/specialization/forearm/evidence-entry.tsx")],
  bundle: true,
  outdir: bundleDir,
  format: "iife",
  jsx: "automatic",
  loader: { ".css": "css" },
  alias: { "@shared": resolve(root, "shared"), "@": resolve(root, "client/src") },
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "warning",
});
const js = readFileSync(resolve(bundleDir, "evidence-entry.js"), "utf8");
const css = readFileSync(resolve(bundleDir, "evidence-entry.css"), "utf8");
// The app's tokens: the first :root block of index.css (colours, type scale, motion).
const indexCss = readFileSync(resolve(root, "client/src/index.css"), "utf8");
const tokens = indexCss.slice(indexCss.indexOf(":root {"), indexCss.indexOf("}", indexCss.indexOf(":root {")) + 1);
const asset = await import(resolve(root, "design/specialization/forearm/asset.mjs")).then((module) => module.buildAsset().asset);

/** Fills that let every muscle be told from its neighbours, and show every fill kind. */
const cycle = [{ kind: "bin", step: 5 }, { kind: "bin", step: 2 }, { kind: "bin", step: 4 }, { kind: "zero" }, { kind: "bin", step: 1 }, { kind: "bin", step: 3 }, { kind: "hatch" }, { kind: "none" }];
const nodeOrder = [...new Set(Object.values(asset.views).flatMap((layers) => Object.values(layers).flatMap((layer) => layer.paths.filter((path) => path.kind === "belly").map((path) => path.nodeId))))];
const demoFills = Object.fromEntries(nodeOrder.map((id, index) => [id, cycle[index % cycle.length]]));
const restFills = {};
const selectedFor = { "palm-surface": "forearm.fcu", "palm-intermediate": "forearm.fds", "palm-deep": "forearm.fpl", "back-surface": "forearm.ecrb", "back-deep": "forearm.epl", "thumb-surface": "forearm.br", "thumb-deep": "forearm.supinator" };
const viewNames = { palm: "Palm", back: "Back", thumb: "Thumb side" };
const layerNames = { surface: "Surface", intermediate: "Middle", deep: "Deep" };

const figures = [];
for (const [view, layers] of Object.entries(asset.views)) {
  for (const layer of Object.keys(layers)) {
    for (const arm of ["right", "left"]) {
      const id = `${view}-${layer}-${arm}`;
      if (only.length && !only.includes(id)) continue;
      figures.push({
        id, file: `diagram-${id}.png`, title: `${viewNames[view]} · ${layerNames[layer]} · ${arm} arm`, view, layer, mirrored: arm === "left",
        selected: selectedFor[`${view}-${layer}`] ?? null, fills: demoFills,
        caption: `Forearms, ${arm} arm, ${viewNames[view].toLowerCase()} view, ${layerNames[layer].toLowerCase()} layer`,
      });
    }
  }
}
if (!only.length) {
  figures.push({ id: "fills-at-rest", file: "diagram-palm-surface-at-rest.png", title: "Palm · Surface · right arm · nothing selected, no data", view: "palm", layer: "surface", mirrored: false, selected: null, fills: restFills, caption: "Forearms, right arm, palm view, surface layer" });
  figures.push({ id: "not-on-layer", file: "diagram-selection-not-on-layer.png", title: "FDS selected, deep layer shown", view: "palm", layer: "deep", mirrored: false, selected: "forearm.fds", fills: demoFills, caption: "Forearms, right arm, palm view, deep layer" });
}

const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>${tokens}
html, body { margin: 0; background: radial-gradient(circle at 14% 3%, #1e5f98 0, var(--sg-surface-panel) 35%, var(--sg-surface-deep) 82%); background-attachment: fixed; color: var(--sg-text-on-dark); font-family: "DM Sans", Inter, system-ui, sans-serif; }
.evidence { display: grid; gap: 16px; padding: 16px; }
.evidence-card { display: grid; gap: .6rem; border: 1px solid rgb(164 200 232 / .18); background: rgb(255 255 255 / .035); padding: 16px; }
.evidence-card h2 { margin: 0; font-size: 12px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--sg-text-muted-on-dark); }
${css}</style></head><body><div id="root"></div><script>window.FIGURES = ${JSON.stringify(figures)};</script><script>${js}</script></body></html>`;
writeFileSync(resolve(bundleDir, "evidence.html"), html);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: scale, isMobile: true, hasTouch: true });
await page.setContent(html, { waitUntil: "load" });
await page.waitForSelector(".spz-diagram-svg");

const report = {};
for (const figure of figures) await page.locator(`#${figure.id}`).screenshot({ path: resolve(outDir, figure.file) });

// Tap targets: which muscle a tap at each point of the drawing selects, read with
// elementFromPoint while the drawing is scrolled through the viewport.
for (const figure of figures) {
  const result = await page.evaluate(async (id) => {
    const svg = document.querySelector(`#${id} .spz-diagram-svg`);
    const step = 1.5;
    svg.scrollIntoView({ block: "start" });
    let box = svg.getBoundingClientRect();
    const cols = Math.floor(box.width / step);
    const rows = Math.floor(box.height / step);
    const labels = [];
    const grid = new Int16Array(cols * rows).fill(-1);
    const indexOf = new Map();
    for (let r = 0; r < rows; r++) {
      const docY = r * step + step / 2;
      box = svg.getBoundingClientRect();
      let y = box.top + docY;
      if (y > window.innerHeight - 2 || y < 2) {
        window.scrollBy(0, y - 40);
        await new Promise((resolve) => requestAnimationFrame(resolve));
        box = svg.getBoundingClientRect();
        y = box.top + docY;
      }
      for (let c = 0; c < cols; c++) {
        const hit = document.elementFromPoint(box.left + c * step + step / 2, y)?.closest("[data-hit]");
        const node = hit?.getAttribute("data-hit");
        if (!node) continue;
        if (!indexOf.has(node)) { indexOf.set(node, labels.length); labels.push(node); }
        grid[r * cols + c] = indexOf.get(node);
      }
    }
    // Largest square of cells all selecting the same muscle (dynamic programming).
    const best = new Array(labels.length).fill(0);
    const size = new Int32Array(cols * rows);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const k = r * cols + c;
        const v = grid[k];
        if (v < 0) continue;
        const up = r > 0 && grid[k - cols] === v ? size[k - cols] : 0;
        const left = c > 0 && grid[k - 1] === v ? size[k - 1] : 0;
        const diag = r > 0 && c > 0 && grid[k - cols - 1] === v ? size[k - cols - 1] : 0;
        size[k] = 1 + Math.min(up, left, diag);
        if (size[k] > best[v]) best[v] = size[k];
      }
    }
    return { svgWidth: box.width, squares: Object.fromEntries(labels.map((label, index) => [label, Math.round(best[index] * step)])) };
  }, figure.id);
  report[figure.id] = result;
}
await browser.close();
writeFileSync(resolve(outDir, "hit-targets.json"), `${JSON.stringify(report, null, 2)}\n`);
for (const [id, result] of Object.entries(report)) {
  const small = Object.entries(result.squares).filter(([, px]) => px < 44);
  console.log(`${id}: drawn ${Math.round(result.svgWidth)} px wide; smallest tap square ${Math.min(...Object.values(result.squares))} px${small.length ? `; under 44: ${small.map(([node, px]) => `${node} ${px}`).join(", ")}` : ""}`);
}
console.log(`wrote ${figures.length} PNGs to ${outDir}`);
