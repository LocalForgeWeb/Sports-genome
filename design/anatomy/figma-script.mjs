/**
 * Emits the `use_figma` plugin script for one view.
 *
 * Rather than shipping the rendered path data to Figma, this ships the anchors
 * and the curve function, so the Figma file is generated from the same source
 * of truth as the production SVG. It is also far smaller: anchors are integers,
 * the emitted Béziers are not.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { VIEW } from "./geometry.mjs";
import * as front from "./front.mjs";
import * as back from "./back.mjs";

const here = dirname(fileURLToPath(import.meta.url));

const sideFor = (view, half) =>
  view === "front" ? (half === "near" ? "right" : "left") : (half === "near" ? "left" : "right");

const flat = (pts) => pts.flatMap((p) => (Array.isArray(p) ? [p[0], p[1], 0] : [p.x, p.y, p.corner ? 1 : 0]));

function payload(view, source) {
  const regions = [];
  for (const r of source.regions) {
    const halves = r.midline ? [null] : ["near", "far"];
    for (const half of halves) {
      const side = half ? sideFor(view, half) : null;
      const name = r.structural
        ? (side ? `base__${r.id}__${side}` : `base__${r.id}`)
        : ["muscle", r.key, r.part, side].filter(Boolean).join("__");
      regions.push([name, r.tension ?? 1, half === "far" ? 1 : 0, flat(r.anchors), r.structural ? 1 : 0]);
    }
  }
  return { sil: flat(source.silhouette), regions };
}

const script = (view, data) => `// Sports Genome Body Lab anatomy — ${view} view.
// Anchors + Catmull-Rom, identical to design/anatomy/*.mjs in the repo.
const MID = ${VIEW.midX}, W = ${VIEW.width}, H = ${VIEW.height};
const un = (f) => { const o = []; for (let i = 0; i < f.length; i += 3) o.push([f[i], f[i + 1], f[i + 2]]); return o; };
const mir = (p) => p.map((q) => [MID * 2 - q[0], q[1], q[2]]).reverse();
const r2 = (v) => Math.round(v * 100) / 100;
function curve(pts, t) {
  const n = pts.length, at = (i) => pts[((i % n) + n) % n];
  let d = "";
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const t1 = at(i)[2] ? 0 : t, t2 = at(i + 1)[2] ? 0 : t;
    const c1 = [p1[0] + ((p2[0] - p0[0]) / 6) * t1, p1[1] + ((p2[1] - p0[1]) / 6) * t1];
    const c2 = [p2[0] - ((p3[0] - p1[0]) / 6) * t2, p2[1] - ((p3[1] - p1[1]) / 6) * t2];
    if (i === 0) d += "M" + r2(p1[0]) + "," + r2(p1[1]);
    d += "C" + r2(c1[0]) + "," + r2(c1[1]) + " " + r2(c2[0]) + "," + r2(c2[1]) + " " + r2(p2[0]) + "," + r2(p2[1]);
  }
  return d + "Z";
}
const SIL = ${JSON.stringify(data.sil)};
const REGIONS = ${JSON.stringify(data.regions)};

const half = un(SIL);
const outline = curve(half.concat(mir(half).slice(1, -1)), 0.9);
const parts = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '">',
  '<g id="body_${view}">',
  '<path id="base__silhouette" d="' + outline + '" fill="#5A6D85"/>',
  '<g id="regions" stroke="#243348" stroke-width="1.1" stroke-linejoin="round">',
];
for (const [name, tension, flip, fa, structural] of REGIONS) {
  const pts = flip ? mir(un(fa)) : un(fa);
  parts.push('<path id="' + name + '" d="' + curve(pts, tension) + '" fill="' + (structural ? "#6B7F97" : "#93A9C0") + '"/>');
}
parts.push('</g>', '<path id="base__contour" d="' + outline + '" fill="none" stroke="#243348" stroke-width="1.6" stroke-linejoin="round"/>', '</g></svg>');

const node = figma.createNodeFromSvg(parts.join(""));
node.name = "body_${view}";
node.x = ${view === "front" ? 0 : 320};
node.y = 0;
figma.currentPage.appendChild(node);
return { createdNodeIds: [node.id], name: node.name, children: node.children.length };
`;

for (const [view, source] of [["front", front], ["back", back]]) {
  const code = script(view, payload(view, source));
  writeFileSync(join(here, `out/figma_${view}.js`), code);
  console.log(`figma_${view}.js  ${(code.length / 1024).toFixed(1)}kB  (limit 50kB)`);
}
