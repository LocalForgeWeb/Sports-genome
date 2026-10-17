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
  const outcrops = [];
  const out = {};
  for (const [view, layers] of Object.entries(views)) {
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
    asset: { key: ASSET_KEY, version: ASSET_VERSION, regionId: "forearm", viewBox: { width: CANVAS.width, height: CANVAS.height }, views: out, licenseNote: LICENSE_NOTE },
    outcrops,
  };
}
