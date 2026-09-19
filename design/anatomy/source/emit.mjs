/**
 * Emits the production geometry module from the extracted source anatomy.
 *
 * Run `node design/anatomy/source/extract.mjs && node design/anatomy/source/emit.mjs`
 * to regenerate. `extracted.json` is the intermediate.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const views = JSON.parse(readFileSync(join(here, "extracted.json"), "utf8"));

const CATALOG_KEYS = new Set([
  "abductors", "abs", "adductors", "biceps", "brachialis", "brachioradialis", "calves",
  "chest", "feet", "forearms", "frontDelts", "glutes", "hamstrings", "hipFlexors", "lats",
  "lowerBack", "obliques", "peroneals", "quads", "rearDelts", "rotatorCuff",
  "serratusAnterior", "sideDelts", "soleus", "tfl", "tibialis", "traps", "triceps", "upperBack",
]);

const invented = [];
for (const view of ["front", "back"]) {
  for (const m of views[view].muscles) if (!CATALOG_KEYS.has(m.key)) invented.push(`${view}/${m.key}`);
}
if (invented.length) throw new Error(`keys outside the catalog vocabulary: ${invented.join(", ")}`);

const [, , vbw, vbh] = views.front.viewBox;
if (views.front.viewBox.join() !== views.back.viewBox.join()) {
  throw new Error(`front and back viewBoxes differ: ${views.front.viewBox} vs ${views.back.viewBox}`);
}

const shape = (view) => ({
  mid: views[view].mid,
  shell: views[view].shell,
  structural: views[view].structural,
  muscles: views[view].muscles,
  linework: views[view].linework,
});

const ts = `/**
 * GENERATED FILE — do not edit by hand.
 *
 * Anatomy geometry adapted from muscle_mapper by Surya Mouly (MIT), keeping the
 * vector anatomy and none of its UI. See THIRD_PARTY_NOTICES.md.
 *
 * Regenerate with:
 *   node design/anatomy/source/extract.mjs && node design/anatomy/source/emit.mjs
 *
 * The artwork is a geometry layer and carries no training meaning. Role, rank
 * and selection colour are applied by the app at runtime, so the same geometry
 * serves every Body Lab mode rather than one mode owning an anatomy.
 */

/** One drawn path. \`part\` is a visual subdivision, never a data identifier. */
export type AnatomyPath = {
  id: string;
  part: string | null;
  /** The subject's own side, so a limb keeps its name across both views. */
  side: "left" | "right";
  d: string;
  /**
   * Set when the source drew a paired muscle as one shape crossing the midline.
   * The path is rendered once per half against this clip, which recovers the
   * pair exactly rather than cutting path data by hand.
   */
  clipHalf: "viewerLeft" | "viewerRight" | null;
};

/** One canonical catalog muscle key and every path that draws it. */
export type AnatomyMuscle = { key: string; paths: AnatomyPath[]; area: number };

export type AnatomyView = {
  /** The figure's midline in viewBox units, for the half clips. */
  mid: number;
  /** Filled body shell under the muscles, so joints read as body not holes. */
  shell: string[];
  /** Drawn, never selectable: neck, hands. */
  structural: { id: string; d: string }[];
  /** Ordered largest-area first, which is also the hit-priority order. */
  muscles: AnatomyMuscle[];
  /** Stroke-only anatomical detail, painted above every fill. */
  linework: string[];
};

export const anatomyViewBox = { width: ${vbw}, height: ${vbh} } as const;

export const anatomyViews: Record<"front" | "back", AnatomyView> = ${JSON.stringify({ front: shape("front"), back: shape("back") })};

/** Canonical keys this figure can draw, for tests and coverage checks. */
export const drawnMuscleKeys: Record<"front" | "back", string[]> = {
  front: ${JSON.stringify(views.front.muscles.map((m) => m.key).sort())},
  back: ${JSON.stringify(views.back.muscles.map((m) => m.key).sort())},
};

/**
 * Canonical keys Body Lab may reference that this artwork does not draw.
 *
 * Declared rather than silently absent: a role on one of these colours nothing,
 * and that should be a visible fact in the codebase, not a mystery on screen.
 */
export const unresolvedMuscleKeys: string[] = ${JSON.stringify(["brachialis", "serratusAnterior", "tfl", "peroneals", "rotatorCuff"])};
`;

const target = join(here, "../../../client/src/components/anatomy/figureGeometry.ts");
writeFileSync(target, ts);

console.log(`wrote figureGeometry.ts  ${(ts.length / 1024).toFixed(1)}kB  viewBox ${vbw}x${vbh}`);
for (const view of ["front", "back"]) {
  const v = views[view];
  const paths = v.muscles.reduce((n, m) => n + m.paths.length, 0);
  console.log(`  ${view}: ${v.muscles.length} keys / ${paths} paths / ${v.shell.length} shell / ${v.structural.length} structural / ${v.linework.length} linework`);
  console.log(`    keys: ${v.muscles.map((m) => m.key).join(", ")}`);
}
