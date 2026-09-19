/**
 * Measures the source anatomy so sides are assigned from geometry, not order.
 *
 * The handoff is explicit that path order does not determine side, and it is
 * right to be: a two-path group can be authored in either order, and guessing
 * would silently mirror a muscle. Every path is measured in the browser and
 * assigned by which side of the figure's own midline its centroid falls.
 */
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 900, height: 1400 } });

const out = {};
for (const [view, file] of [["front", "front_src.svg"], ["back", "back_src.svg"]]) {
  const svg = readFileSync(join(here, file), "utf8");
  await page.setContent(`<body style="margin:0">${svg}</body>`);
  await page.waitForTimeout(150);
  out[view] = await page.evaluate(() => {
    const svg = document.querySelector("svg");
    const all = [...svg.querySelectorAll("path")];
    const rows = all.map((p, i) => {
      const b = p.getBBox();
      const g = p.closest("g[id]");
      return {
        docIndex: i,
        group: g?.id ?? null,
        fill: p.getAttribute("fill") ?? (p.closest("[fill]")?.getAttribute("fill") ?? null),
        stroke: p.getAttribute("stroke"),
        x: +b.x.toFixed(2), y: +b.y.toFixed(2), w: +b.width.toFixed(2), h: +b.height.toFixed(2),
        cx: +(b.x + b.width / 2).toFixed(2),
        len: (p.getAttribute("d") || "").length,
      };
    });
    const total = svg.getBBox();
    return { bbox: { x: +total.x.toFixed(2), y: +total.y.toFixed(2), w: +total.width.toFixed(2), h: +total.height.toFixed(2) }, rows };
  });
}
await browser.close();

writeFileSync(join(here, "measured.json"), JSON.stringify(out, null, 2));

for (const view of ["front", "back"]) {
  const { bbox, rows } = out[view];
  const mid = bbox.x + bbox.w / 2;
  console.log(`\n=== ${view}  bbox ${bbox.w}x${bbox.h} at (${bbox.x},${bbox.y})  midline x=${mid.toFixed(1)} ===`);
  const byGroup = new Map();
  rows.forEach((r) => { const k = r.group ?? "(ungrouped)"; byGroup.set(k, [...(byGroup.get(k) ?? []), r]); });
  for (const [g, list] of byGroup) {
    if (g === "body") { console.log(`  ${g.padEnd(22)} ${String(list.length).padStart(3)} paths  (line art, fill=none)`); continue; }
    const sides = list.map((r) => {
      const spans = r.x < mid && r.x + r.w > mid;
      return spans ? "SPANS" : r.cx < mid ? "viewerL" : "viewerR";
    });
    console.log(`  ${g.padEnd(22)} ${String(list.length).padStart(3)} paths  ${sides.join(", ")}`);
  }
}
