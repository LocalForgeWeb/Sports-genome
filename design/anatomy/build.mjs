/**
 * Emits the anterior and posterior figures as SVG.
 *
 * Layer names are the contract between Figma and the app. Every selectable
 * region is named
 *
 *     muscle__<canonicalCatalogKey>[__<part>]__<side>
 *
 * where `canonicalCatalogKey` is a Sports Genome exercise-catalog muscle key,
 * `part` is a purely visual subdivision, and `side` is the subject's anatomical
 * side. Several paths may share a key; nothing downstream has to learn a part
 * name. Structural body is `base__…` and is never selectable.
 *
 * Fills are neutral only. Role colour is applied by the app from Body Lab data,
 * so no training meaning is baked into the artwork.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { VIEW, smoothClosed, mirrorPath, ringFromHalf } from "./geometry.mjs";
import * as front from "./front.mjs";
import * as back from "./back.mjs";

const here = dirname(fileURLToPath(import.meta.url));

/** Neutral palette only — the app recolours by role at runtime. */
const PAINT = {
  silhouette: "#5a6d85",
  structural: "#6b7f97",
  muscle: "#93a9c0",
  separator: "#243348",
};

/**
 * Anatomical side naming, which is not image side.
 *
 * On an anterior view the subject's right is the viewer's left; on a posterior
 * view it is the viewer's right. Region IDs name the subject's side, so
 * `muscle__quads__vastus_lateralis__right` is the same limb in both views. The
 * library this replaces named by image side and disagreed between its views.
 */
const sideFor = (view, half) =>
  view === "front" ? (half === "near" ? "right" : "left") : (half === "near" ? "left" : "right");

const regionName = (region, side) => {
  if (region.structural) return side ? `base__${region.id}__${side}` : `base__${region.id}`;
  return ["muscle", region.key, region.part, side].filter(Boolean).join("__");
};

function buildView(view, source) {
  const { silhouette, regions } = source;
  const outline = smoothClosed(ringFromHalf(silhouette), 0.9);

  const layers = [];
  for (const region of regions) {
    const halves = region.midline ? [null] : ["near", "far"];
    for (const half of halves) {
      const anchors = half === "far" ? mirrorPath(region.anchors) : region.anchors;
      const side = half ? sideFor(view, half) : null;
      const name = regionName(region, side);
      const fill = region.structural ? PAINT.structural : PAINT.muscle;
      const attrs = region.structural
        ? ""
        : ` data-muscle="${region.key}"${region.part ? ` data-part="${region.part}"` : ""} data-side="${side}"`;
      layers.push(
        `      <path id="${name}"${attrs} d="${smoothClosed(anchors, region.tension ?? 1)}" fill="${fill}"/>`,
      );
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW.width} ${VIEW.height}" width="${VIEW.width}" height="${VIEW.height}">
  <defs>
    <clipPath id="clip_body_${view}"><path d="${outline}"/></clipPath>
  </defs>
  <g id="body_${view}">
    <path id="base__silhouette" d="${outline}" fill="${PAINT.silhouette}"/>
    <g id="regions" clip-path="url(#clip_body_${view})" stroke="${PAINT.separator}" stroke-width="1.1" stroke-linejoin="round">
${layers.join("\n")}
    </g>
    <path id="base__contour" d="${outline}" fill="none" stroke="${PAINT.separator}" stroke-width="1.6" stroke-linejoin="round"/>
  </g>
</svg>
`;
}

const outDir = join(here, "out");
mkdirSync(outDir, { recursive: true });

const summary = [];
for (const [view, source] of [["front", front], ["back", back]]) {
  const svg = buildView(view, source);
  writeFileSync(join(outDir, `body_${view}.svg`), svg);
  const keys = new Set([...svg.matchAll(/data-muscle="([^"]+)"/g)].map((m) => m[1]));
  summary.push({
    view,
    selectable: svg.match(/id="muscle__/g)?.length ?? 0,
    structural: svg.match(/id="base__/g)?.length ?? 0,
    keys: [...keys].sort(),
    bytes: svg.length,
  });
}

for (const s of summary) {
  console.log(`body_${s.view}.svg  selectable=${s.selectable}  structural=${s.structural}  ${(s.bytes / 1024).toFixed(1)}kB`);
  console.log(`  canonical keys (${s.keys.length}): ${s.keys.join(", ")}`);
}
const union = new Set(summary.flatMap((s) => s.keys));
console.log(`\nunion of canonical keys (${union.size}): ${[...union].sort().join(", ")}`);
