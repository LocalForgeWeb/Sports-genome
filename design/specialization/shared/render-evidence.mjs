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
 * the largest square of screen shown to select it and nothing else, in CSS px, and the SHA-256 of
 * the generated module it measured.
 *
 * It draws the asset it builds from the region's views, and refuses (exit 1) unless that is the
 * committed diagram.generated.ts byte for byte: run emit.mjs first. So the record is always of the
 * committed drawing, and client/src/lib/specialization/diagramContract.test.ts requires the
 * record's hash to be the committed file's.
 *
 * The gate (10-multi-region.md §7.3): every muscle's square at least 44 px at both widths. The
 * script exits 1, after writing everything, if one is smaller.
 */
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { buildAsset } from "./asset.mjs";
import { chromium } from "./browser.mjs";
import { renderModule } from "./emit.mjs";
import { generatedPath, loadDrawing, regionArgument, root } from "./region.mjs";

/** The phones: the design width and the small one (CLAUDE.md), each at device scale 3. */
const PHONES = [{ width: 390, height: 844 }, { width: 375, height: 667 }];
/** The smallest square of screen, in CSS px, a tap must have to select a muscle (Apple HIG; CLAUDE.md). */
const GATE_PX = 44;
/** The sweep's spacing, in CSS px. */
const STEP_PX = 1.5;

const args = process.argv.slice(2);
const usage = "node design/specialization/shared/render-evidence.mjs <region> [outDir] [--only=<figure>,...] [--scale=3]";
const region = regionArgument(args, usage);
const outDir = resolve(root, args.filter((arg) => !arg.startsWith("--"))[1] ?? `docs/specialization-atlas/evidence/${region}`);
const only = (args.find((arg) => arg.startsWith("--only=")) ?? "").slice(7).split(",").filter(Boolean);
const scale = Number((args.find((arg) => arg.startsWith("--scale=")) ?? "--scale=3").slice(8));

const { config, views, members } = await loadDrawing(region);
const target = generatedPath(region);
let committed = null;
try {
  committed = readFileSync(target);
} catch {
  committed = null;
}
if (committed === null || committed.toString("utf8") !== renderModule(config, views, members)) {
  console.error(`${relative(root, target)} is ${committed === null ? "missing" : "stale"}: run node design/specialization/shared/emit.mjs ${region} first, so the gate measures the committed drawing`);
  process.exit(1);
}
const { asset } = buildAsset(config, views, members);
const { FIGURES } = await import(pathToFileURL(resolve(root, "design/specialization", region, "evidence.mjs")).href);
mkdirSync(outDir, { recursive: true });

const bundleDir = mkdtempSync(resolve(tmpdir(), `${region}-diagram-evidence-`));
await build({
  entryPoints: [resolve(root, "design/specialization/shared/evidence-entry.tsx")],
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

// What the entry draws: this asset and the region's members (what the renderer and the labels read of them).
// Each card paints the page's ground itself (23 Oct): a card taller than the screen (every figure at
// 375 × 667) is captured in parts, and the page's fixed background was not painted beyond the
// screen, so the card's title or caption sat on a white band. The drawing and the measured squares
// do not depend on it.
const drawnMembers = members.map(({ id, kind, parentId, name, shortName }) => ({ id, kind, parentId, name, shortName }));
const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>${tokens}
html, body { margin: 0; background: radial-gradient(circle at 14% 3%, #1e5f98 0, var(--sg-surface-panel) 35%, var(--sg-surface-deep) 82%); background-attachment: fixed; background-color: var(--sg-surface-deep); color: var(--sg-text-on-dark); font-family: "DM Sans", Inter, system-ui, sans-serif; }
.evidence { display: grid; gap: 16px; padding: 16px; }
.evidence-card { display: grid; gap: .6rem; border: 1px solid rgb(164 200 232 / .18); background: linear-gradient(rgb(255 255 255 / .035), rgb(255 255 255 / .035)), radial-gradient(circle at 14% 3%, #1e5f98 0, var(--sg-surface-panel) 35%, var(--sg-surface-deep) 82%); padding: 16px; }
.evidence-card h2 { margin: 0; font-size: 12px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--sg-text-muted-on-dark); }
${css}</style></head><body><div id="root"></div><script>window.EVIDENCE = ${JSON.stringify({ region, asset, members: drawnMembers, figures }).replace(/</g, "\\u003c")};</script><script>${js}</script></body></html>`;
writeFileSync(resolve(bundleDir, "evidence.html"), html);

const browser = await chromium.launch();
const report = {
  note: `Headless Chromium emulating a phone (viewport, isMobile, hasTouch, deviceScaleFactor ${scale}): not an iPhone, not Safari. Each figure on an evidence card. A muscle's square is the largest square of screen shown to select it and nothing else, rounded down to 0.1 px: its own tap square (the renderer's rect, measured exactly) where every point inside it read with elementFromPoint every ${STEP_PX} px selects it and no other muscle's square overlaps it, or else, if larger, the span between the outermost points of the largest square of points that all select it.`,
  gatePx: GATE_PX,
  generated: { file: relative(root, target), sha256: createHash("sha256").update(committed).digest("hex") },
  widths: {},
};
for (const phone of PHONES) {
  const page = await browser.newPage({ viewport: phone, deviceScaleFactor: scale, isMobile: true, hasTouch: true });
  await page.setContent(html, { waitUntil: "load" });
  await page.waitForSelector(".spz-diagram-svg");
  for (const figure of figures) await page.locator(`#${figure.id}`).screenshot({ path: join(outDir, `diagram-${phone.width}-${figure.file}.png`) });

  // Tap targets: which muscle a tap at each point of the drawing selects, read with
  // elementFromPoint while the drawing is scrolled through the viewport.
  const measured = {};
  for (const figure of figures) {
    measured[figure.id] = await page.evaluate(async ({ id, step }) => {
      const svg = document.querySelector(`#${id} .spz-diagram-svg`);
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
      // Largest square of points all selecting the same muscle (dynamic programming), in points a side.
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
      // Each muscle's own tap square as drawn, in the drawing's box (read together, so scrolling
      // does not matter), cut to the drawing: its exact side counts where nothing else takes a tap in it.
      box = svg.getBoundingClientRect();
      const squares = [...svg.querySelectorAll(".spz-diagram-hit")].map((hit) => {
        const rect = hit.querySelector("rect").getBoundingClientRect();
        return {
          node: hit.getAttribute("data-hit"),
          left: Math.max(0, rect.left - box.left), right: Math.min(box.width, rect.right - box.left),
          top: Math.max(0, rect.top - box.top), bottom: Math.min(box.height, rect.bottom - box.top),
        };
      });
      const overlaps = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.01 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.01;
      const exact = new Map();
      for (const square of squares) {
        const side = Math.min(square.right - square.left, square.bottom - square.top);
        if (side <= 0 || squares.some((other) => other !== square && overlaps(square, other))) continue;
        let alone = true;
        for (let r = Math.ceil((square.top - step / 2) / step); alone && r < rows && r * step + step / 2 < square.bottom; r++) {
          if (r * step + step / 2 <= square.top) continue;
          for (let c = Math.ceil((square.left - step / 2) / step); c < cols && c * step + step / 2 < square.right; c++) {
            if (c * step + step / 2 <= square.left) continue;
            if (labels[grid[r * cols + c]] !== square.node) { alone = false; break; }
          }
        }
        if (alone) exact.set(square.node, side);
      }
      // A square of n × n points holding one muscle spans (n − 1) steps between its outer points.
      const proven = (label, index) => Math.max(exact.get(label) ?? 0, (best[index] - 1) * step);
      return { svgWidth: box.width, squares: Object.fromEntries(labels.map((label, index) => [label, Math.floor(proven(label, index) * 10) / 10])) };
    }, { id: figure.id, step: STEP_PX });
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
    console.log(`${width} ${id}: drawn ${result.svgWidth} px wide; smallest tap square ${squares.length ? Math.min(...squares) : "(none)"} px${small.length ? `; under ${GATE_PX}: ${small.map(([node, px]) => `${node} ${px}`).join(", ")}` : ""}`);
  }
  console.log(`${width} pt: smallest tap square on any layer ${smallest} px`);
  if (smallest < GATE_PX) failed = true;
}
console.log(`wrote ${figures.length * PHONES.length} PNGs and hit-targets.json to ${outDir}`);
if (failed) {
  console.error(`A muscle's tap square is under ${GATE_PX} px on a phone (10-multi-region.md §7.3): enlarge or move it, or draw the muscle as structure and leave it to the list.`);
  process.exit(1);
}
