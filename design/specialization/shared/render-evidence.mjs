/**
 * Renders a region's drawing through the real component (SpecializationDiagram.tsx, its CSS and
 * the app's colour tokens) in headless Chromium at phone sizes, writes PNGs, and measures the tap
 * targets. Headless emulation of a 390 × 844 and a 375 × 667 pt phone at device scale 3 (touch,
 * mobile): not an iPhone, not Safari.
 *
 *   node design/specialization/shared/render-evidence.mjs <region> [outDir] [--only=palm-surface-right,...] [--scale=3]
 *
 * outDir defaults to docs/specialization-atlas/evidence/<region>. The figures are the region's
 * (design/specialization/<region>/evidence.mjs): every view and layer on each side the drawing
 * offers, one muscle selected per layer, and any extra figures it lists. Writes
 * diagram-<width>-<figure>.png and hit-targets.json: for each muscle on each layer, at each width,
 * the largest square of screen that a tap there selects it and nothing else, in CSS px.
 *
 * The gate (10-multi-region.md §7.3): every muscle's square at least 44 px at both widths. The
 * script exits 1, after writing everything, if one is smaller.
 */
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { buildAsset } from "./asset.mjs";
import { chromium } from "./browser.mjs";
import { loadDrawing, regionArgument, root } from "./region.mjs";

/** The phones: the design width and the small one (CLAUDE.md), each at device scale 3. */
const PHONES = [{ width: 390, height: 844 }, { width: 375, height: 667 }];
/** The smallest square of screen, in CSS px, a tap must have to select a muscle (Apple HIG; CLAUDE.md). */
const GATE_PX = 44;

const args = process.argv.slice(2);
const usage = "node design/specialization/shared/render-evidence.mjs <region> [outDir] [--only=<figure>,...] [--scale=3]";
const region = regionArgument(args, usage);
const outDir = resolve(root, args.filter((arg) => !arg.startsWith("--"))[1] ?? `docs/specialization-atlas/evidence/${region}`);
const only = (args.find((arg) => arg.startsWith("--only=")) ?? "").slice(7).split(",").filter(Boolean);
const scale = Number((args.find((arg) => arg.startsWith("--scale=")) ?? "--scale=3").slice(8));
mkdirSync(outDir, { recursive: true });

const { config, views, members } = await loadDrawing(region);
const { asset } = buildAsset(config, views, members);
const { FIGURES } = await import(pathToFileURL(resolve(root, "design/specialization", region, "evidence.mjs")).href);

const bundleDir = mkdtempSync(resolve(tmpdir(), `${region}-diagram-evidence-`));
await build({
  entryPoints: [resolve(root, "design/specialization/shared/evidence-entry.tsx")],
  bundle: true,
  outdir: bundleDir,
  format: "iife",
  jsx: "automatic",
  loader: { ".css": "css" },
  // The region's data module (its config's REGION_DATA), so a region draws before it is registered.
  alias: { "@shared": resolve(root, "shared"), "@": resolve(root, "client/src"), "@evidence/region": resolve(root, config.REGION_DATA.module) },
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "warning",
});
const js = readFileSync(resolve(bundleDir, "evidence-entry.js"), "utf8");
const css = readFileSync(resolve(bundleDir, "evidence-entry.css"), "utf8");
// The app's tokens: the first :root block of index.css (colours, type scale, motion).
const indexCss = readFileSync(resolve(root, "client/src/index.css"), "utf8");
const tokens = indexCss.slice(indexCss.indexOf(":root {"), indexCss.indexOf("}", indexCss.indexOf(":root {")) + 1);

/** Fills that let every muscle be told from its neighbours, and show every fill kind. */
const cycle = [{ kind: "bin", step: 5 }, { kind: "bin", step: 2 }, { kind: "bin", step: 4 }, { kind: "zero" }, { kind: "bin", step: 1 }, { kind: "bin", step: 3 }, { kind: "hatch" }, { kind: "none" }];
const nodeOrder = [...new Set(Object.values(asset.views).flatMap((layers) => Object.values(layers).flatMap((layer) => layer.paths.filter((path) => path.kind === "belly").map((path) => path.nodeId))))];
const fills = { cycle: Object.fromEntries(nodeOrder.map((id, index) => [id, cycle[index % cycle.length]])), rest: {} };
/** The words on the page's view buttons, from the drawing itself (asset.viewOrder). */
const viewNames = Object.fromEntries(asset.viewOrder.map((view) => [view.id, view.label]));
const layerNames = { surface: "Surface", intermediate: "Middle", deep: "Deep" };
const sideOf = (id) => FIGURES.sides.find((side) => side.id === id);
const caption = (view, layer, side) => `${FIGURES.label}, ${side.words ? `${side.words}, ` : ""}${viewNames[view].toLowerCase()} view, ${layerNames[layer].toLowerCase()} layer`;

const figures = [];
for (const [view, layers] of Object.entries(asset.views)) {
  for (const layer of Object.keys(layers)) {
    for (const side of FIGURES.sides) {
      const id = `${view}-${layer}-${side.id}`;
      if (only.length && !only.includes(id)) continue;
      figures.push({
        id, file: id, title: `${viewNames[view]} · ${layerNames[layer]}${side.words ? ` · ${side.words}` : ""}`, view, layer, mirrored: side.mirrored,
        selected: FIGURES.selected[`${view}-${layer}`] ?? null, fills: fills.cycle, caption: caption(view, layer, side),
      });
    }
  }
}
for (const extra of FIGURES.extra ?? []) {
  if (only.length && !only.includes(extra.id)) continue;
  const side = sideOf(extra.side);
  figures.push({ id: extra.id, file: extra.file, title: extra.title, view: extra.view, layer: extra.layer, mirrored: side.mirrored, selected: extra.selected, fills: fills[extra.fills], caption: caption(extra.view, extra.layer, side) });
}

const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>${tokens}
html, body { margin: 0; background: radial-gradient(circle at 14% 3%, #1e5f98 0, var(--sg-surface-panel) 35%, var(--sg-surface-deep) 82%); background-attachment: fixed; color: var(--sg-text-on-dark); font-family: "DM Sans", Inter, system-ui, sans-serif; }
.evidence { display: grid; gap: 16px; padding: 16px; }
.evidence-card { display: grid; gap: .6rem; border: 1px solid rgb(164 200 232 / .18); background: rgb(255 255 255 / .035); padding: 16px; }
.evidence-card h2 { margin: 0; font-size: 12px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--sg-text-muted-on-dark); }
${css}</style></head><body><div id="root"></div><script>window.EVIDENCE = ${JSON.stringify({ region, export: config.REGION_DATA.export, figures })};</script><script>${js}</script></body></html>`;
writeFileSync(resolve(bundleDir, "evidence.html"), html);

const browser = await chromium.launch();
const report = { note: `Headless Chromium emulating a phone (viewport, isMobile, hasTouch, deviceScaleFactor ${scale}): not an iPhone, not Safari. Each figure on an evidence card; the square is the largest one of screen whose every point, read with elementFromPoint every 1.5 px, selects that muscle.`, gatePx: GATE_PX, widths: {} };
for (const phone of PHONES) {
  const page = await browser.newPage({ viewport: phone, deviceScaleFactor: scale, isMobile: true, hasTouch: true });
  await page.setContent(html, { waitUntil: "load" });
  await page.waitForSelector(".spz-diagram-svg");
  for (const figure of figures) await page.locator(`#${figure.id}`).screenshot({ path: join(outDir, `diagram-${phone.width}-${figure.file}.png`) });

  // Tap targets: which muscle a tap at each point of the drawing selects, read with
  // elementFromPoint while the drawing is scrolled through the viewport.
  const measured = {};
  for (const figure of figures) {
    measured[figure.id] = await page.evaluate(async (id) => {
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
  }
  await page.close();
  const smallest = Math.min(...Object.values(measured).flatMap((result) => Object.values(result.squares)));
  report.widths[phone.width] = { viewport: phone, smallest, figures: measured };
}
await browser.close();
writeFileSync(join(outDir, "hit-targets.json"), `${JSON.stringify(report, null, 2)}\n`);

let failed = false;
for (const [width, { smallest, figures: measured }] of Object.entries(report.widths)) {
  for (const [id, result] of Object.entries(measured)) {
    const small = Object.entries(result.squares).filter(([, px]) => px < GATE_PX);
    const squares = Object.values(result.squares);
    console.log(`${width} ${id}: drawn ${Math.round(result.svgWidth)} px wide; smallest tap square ${squares.length ? Math.min(...squares) : "(none)"} px${small.length ? `; under ${GATE_PX}: ${small.map(([node, px]) => `${node} ${px}`).join(", ")}` : ""}`);
  }
  console.log(`${width} pt: smallest tap square on any layer ${smallest} px`);
  if (smallest < GATE_PX) failed = true;
}
console.log(`wrote ${figures.length * PHONES.length} PNGs and hit-targets.json to ${outDir}`);
if (failed) {
  console.error(`A muscle's tap square is under ${GATE_PX} px on a phone (10-multi-region.md §7.3): enlarge or move it, or draw the muscle as structure and leave it to the list.`);
  process.exit(1);
}
