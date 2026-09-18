/**
 * Emits the production geometry module the app renders from.
 *
 * Regions are grouped by canonical catalog key on the way out, because that is
 * the unit Body Lab actually selects: the app stores one active muscle key, not
 * a side or a subdivision. Grouping here means the component gets one focusable,
 * tappable object per muscle instead of 48 separate paths — which is both the
 * right accessibility shape and the reason tap resolution is unambiguous.
 *
 * `area` is the shoelace area of a region's anchors. The component orders hit
 * targets largest-first so a small muscle's target sits above its big
 * neighbour's, giving deterministic hit priority without enlarging any muscle.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { VIEW, smoothClosed, mirrorPath, ringFromHalf } from "./geometry.mjs";
import * as front from "./front.mjs";
import * as back from "./back.mjs";

const here = dirname(fileURLToPath(import.meta.url));

const sideFor = (view, half) =>
  view === "front" ? (half === "near" ? "right" : "left") : (half === "near" ? "left" : "right");

const shoelace = (points) => {
  const pts = points.map((p) => (Array.isArray(p) ? p : [p.x, p.y]));
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
};

function buildView(view, source) {
  const outline = smoothClosed(ringFromHalf(source.silhouette), 0.9);
  const byKey = new Map();
  const structural = [];

  for (const region of source.regions) {
    const halves = region.midline ? [null] : ["near", "far"];
    for (const half of halves) {
      const anchors = half === "far" ? mirrorPath(region.anchors) : region.anchors;
      const d = smoothClosed(anchors, region.tension ?? 1);
      if (region.structural) {
        structural.push({ id: half ? `${region.id}__${sideFor(view, half)}` : region.id, d });
        continue;
      }
      const side = sideFor(view, half);
      const entry = byKey.get(region.key) ?? { key: region.key, paths: [], area: 0 };
      entry.paths.push({ id: ["muscle", region.key, region.part, side].filter(Boolean).join("__"), part: region.part ?? null, side, d });
      entry.area += shoelace(anchors);
      byKey.set(region.key, entry);
    }
  }
  // Largest first: later siblings paint and hit-test on top, so the smallest
  // muscle ends up with the topmost target rather than being swallowed.
  const muscles = [...byKey.values()].sort((a, b) => b.area - a.area);
  return { outline, muscles, structural };
}

const views = { front: buildView("front", front), back: buildView("back", back) };

const ts = `/**
 * GENERATED FILE — do not edit by hand.
 *
 * Run \`node design/anatomy/emit-ts.mjs\` to regenerate from the anchor sources
 * in design/anatomy. The Figma workspace is built from the same anchors, so the
 * three stay in step:
 * https://www.figma.com/design/FpmnqIn4u6mn4XvgAqyymG
 *
 * Fills carry no training meaning. Role colour, selection and hover are applied
 * by the app from Body Lab data at runtime.
 */

/** A single drawn path. \`part\` is visual only and is never a data identifier. */
export type AnatomyPath = { id: string; part: string | null; side: "left" | "right"; d: string };

/** One canonical catalog muscle key and every path that draws it. */
export type AnatomyMuscle = { key: string; paths: AnatomyPath[]; area: number };

export type AnatomyView = {
  /** The body outline. Doubles as the clip so adjacent muscles share a border. */
  outline: string;
  /** Ordered largest-area first, which is also the hit-priority order. */
  muscles: AnatomyMuscle[];
  /** Head, hands, joints — drawn, never selectable. */
  structural: { id: string; d: string }[];
};

export const anatomyViewBox = { width: ${VIEW.width}, height: ${VIEW.height} } as const;

export const anatomyViews: Record<"front" | "back", AnatomyView> = ${JSON.stringify(views, null, 2)};

/** Canonical keys this figure can draw, for tests and coverage checks. */
export const drawnMuscleKeys: Record<"front" | "back", string[]> = {
  front: ${JSON.stringify(views.front.muscles.map((m) => m.key).sort())},
  back: ${JSON.stringify(views.back.muscles.map((m) => m.key).sort())},
};
`;

const target = join(here, "../../client/src/components/anatomy/figureGeometry.ts");
writeFileSync(target, ts);
console.log(`wrote ${target}  ${(ts.length / 1024).toFixed(1)}kB`);
for (const [view, data] of Object.entries(views)) {
  console.log(`  ${view}: ${data.muscles.length} selectable muscles, ${data.muscles.reduce((n, m) => n + m.paths.length, 0)} paths, ${data.structural.length} structural`);
  console.log(`    smallest by area: ${data.muscles.slice(-4).map((m) => `${m.key}(${Math.round(m.area)})`).join(", ")}`);
}
