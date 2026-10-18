/**
 * Turns the authored views into the DiagramAsset the app, the tests and the database seed
 * read (shared/specialization/types.ts). Pure: no files, no clock, so the manifest test can
 * rebuild it and require the committed file to match.
 *
 * Path ids: `<view>__<layer>__<shortNameLower>__<n>` for a node's bellies, tendons and
 * ghosts (the node's own abbreviation, lower case: `palm__surface__fcr__1`), and
 * `<view>__<layer>__<structure>__<n>` for skin, bone and creases. `n` counts from 1 per
 * view, layer and name, in draw order.
 */
import { buildViews } from "./views/index.mjs";
import { CANVAS } from "./silhouettes.mjs";

export const ASSET_KEY = "forearm_schematic";
export const ASSET_VERSION = 1;

/**
 * The views in the order the page offers them, with the words on their buttons and in its
 * captions. The page reads these from the asset; it names no view itself. Every authored view
 * is listed once, and nothing else is.
 */
export const VIEW_ORDER = [
  { id: "palm", label: "Palm" },
  { id: "back", label: "Back" },
  { id: "thumb", label: "Thumb side" },
];

/** The node each abbreviation draws. Checked by test against the region's node catalog. */
export const NODE_FOR_SHORT_NAME = {
  BR: "forearm.br", FCR: "forearm.fcr", FCU: "forearm.fcu", PL: "forearm.pl", FDS: "forearm.fds", FDP: "forearm.fdp", FPL: "forearm.fpl",
  PT: "forearm.pt", PQ: "forearm.pq", ECRL: "forearm.ecrl", ECRB: "forearm.ecrb", ECU: "forearm.ecu", ED: "forearm.ed", EDM: "forearm.edm",
  EI: "forearm.ei", APL: "forearm.apl", EPB: "forearm.epb", EPL: "forearm.epl", SUP: "forearm.supinator",
  ANC: "forearm.anconeus", Biceps: "upper_arm.biceps", Brachialis: "upper_arm.brachialis",
};

export const LICENSE_NOTE =
  "Original artwork drawn for Sports Genome (2026): a schematic built from hand-placed control points and anatomical landmarks, "
  + "checked against the anatomy references cited in the atlas. Not traced or copied from any illustration, photograph or 3D model, "
  + "and not a dissection image. All rights reserved by Sports Genome.";

export function buildAsset() {
  const views = buildViews();
  const authored = Object.keys(views);
  const listed = VIEW_ORDER.map((view) => view.id);
  if (authored.length !== listed.length || authored.some((view) => !listed.includes(view)) || new Set(listed).size !== listed.length) {
    throw new Error(`VIEW_ORDER (${listed.join(", ")}) must list each authored view (${authored.join(", ")}) exactly once`);
  }
  for (const view of VIEW_ORDER) {
    if (!/^[a-z][a-z0-9_]*$/.test(view.id) || !view.label.trim()) throw new Error(`View ${JSON.stringify(view)}: an id of lowercase letters, digits and underscores, and a label`);
  }
  const outcrops = [];
  const out = {};
  for (const { id: view } of VIEW_ORDER) {
    const layers = views[view];
    out[view] = {};
    for (const [layer, drawn] of Object.entries(layers)) {
      const counters = new Map();
      const paths = drawn.paths.map((path) => {
        const name = path.node ? path.node.toLowerCase() : path.structure;
        if (!name || !/^[a-z][a-z0-9-]*$/.test(name)) throw new Error(`${view}/${layer}: bad path name ${name}`);
        const n = (counters.get(name) ?? 0) + 1;
        counters.set(name, n);
        const nodeId = path.node ? NODE_FOR_SHORT_NAME[path.node] : null;
        if (path.node && !nodeId) throw new Error(`${view}/${layer}: unknown node ${path.node}`);
        const id = `${view}__${layer}__${name}__${n}`;
        if (path.outcrop) outcrops.push({ pathId: id, nodeId, view, layer, note: path.outcrop });
        return { id, nodeId, kind: path.kind, d: path.d };
      });
      out[view][layer] = { paths, labels: drawn.labels };
    }
  }
  return {
    asset: { key: ASSET_KEY, version: ASSET_VERSION, regionId: "forearm", viewBox: { width: CANVAS.width, height: CANVAS.height }, viewOrder: VIEW_ORDER.map((view) => ({ ...view })), views: out, licenseNote: LICENSE_NOTE },
    outcrops,
  };
}
