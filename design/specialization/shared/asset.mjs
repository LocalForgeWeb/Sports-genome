/**
 * Turns a region's authored views into the DiagramAsset the app, the tests and the database
 * seed read (shared/specialization/types.ts). Pure: no files, no clock, so the manifest test can
 * rebuild it and require the committed file to match.
 *
 * Path ids: `<view>__<layer>__<shortNameLower>__<n>` for a node's bellies, tendons and
 * ghosts (the node's own short name, lower case: `palm__surface__fcr__1`), and
 * `<view>__<layer>__<structure>__<n>` for skin, bone and creases. `n` counts from 1 per
 * view, layer and name, in draw order.
 *
 * A view names a muscle by its short name (`node: "FCR"`). The table from short name to node id
 * is derived from the region's members (its own nodes and the other regions' muscles it lists),
 * never kept by hand: only muscles and heads that are no node's parent can be drawn
 * (10-multi-region.md §7.3), and two of them whose short names are the same in lower case would
 * give one path name to two muscles, so the build refuses that.
 */

/**
 * The members a drawing may show, by short name: muscles and heads, never a group or a
 * compartment, and never a node that is another node's parent, whatever its kind (a muscle
 * split into heads is drawn as its heads). Mirrors `drawableNodeIds` in
 * client/src/components/specialization/diagramGeometry.ts, which the renderer and the contract
 * test use.
 */
export function drawableMembers(members) {
  const parents = new Set(members.map((node) => node.parentId).filter(Boolean));
  const drawable = members.filter((node) => (node.kind === "muscle" || node.kind === "head") && !parents.has(node.id));
  const byShortName = new Map();
  const byPathName = new Map();
  for (const node of drawable) {
    if (!/^[A-Za-z][A-Za-z0-9-]*$/.test(node.shortName)) throw new Error(`${node.id}: short name ${JSON.stringify(node.shortName)} is not letters, digits and hyphens starting with a letter`);
    const name = node.shortName.toLowerCase();
    const clash = byPathName.get(name);
    if (clash) throw new Error(`${clash.id} and ${node.id} would share the path name ${name}: short names must differ in lower case within a drawing`);
    byPathName.set(name, node);
    byShortName.set(node.shortName, node);
  }
  return byShortName;
}

/**
 * `config` is the region's config.mjs, `views` what its views/index.mjs builds, `members` the
 * region's nodes as its data lists them (shared/specialization/regions/<region>/).
 */
export function buildAsset(config, views, members) {
  const authored = Object.keys(views);
  const listed = config.VIEW_ORDER.map((view) => view.id);
  if (authored.length !== listed.length || authored.some((view) => !listed.includes(view)) || new Set(listed).size !== listed.length) {
    throw new Error(`VIEW_ORDER (${listed.join(", ")}) must list each authored view (${authored.join(", ")}) exactly once`);
  }
  for (const view of config.VIEW_ORDER) {
    if (!/^[a-z][a-z0-9_]*$/.test(view.id) || !view.label.trim()) throw new Error(`View ${JSON.stringify(view)}: an id of lowercase letters, digits and underscores, and a label`);
  }
  // A drawing says whether it shows one side, mirrored for the other, or both. Only one published
  // before the side policy (its text pinned by MODULE_TEXT: the forearm) leaves it out, and is
  // read as one side; the contract test ties the policy to the region's side model.
  if (config.SIDES === undefined && !config.MODULE_TEXT) throw new Error("SIDES: one_side (a paired region, mirrored for the left) or both_sides (a midline region, never mirrored)");
  if (config.SIDES !== undefined && config.SIDES !== "one_side" && config.SIDES !== "both_sides") throw new Error(`SIDES ${JSON.stringify(config.SIDES)}: one_side or both_sides`);
  const drawable = drawableMembers(members);
  const listOnly = config.LIST_ONLY ?? {};
  const structures = config.STRUCTURE_WORDS ? new Set(config.STRUCTURE_WORDS) : null;
  const outcrops = [];
  const out = {};
  for (const { id: view } of config.VIEW_ORDER) {
    const layers = views[view];
    out[view] = {};
    for (const [layer, drawn] of Object.entries(layers)) {
      const counters = new Map();
      const paths = drawn.paths.map((path) => {
        const name = path.node ? path.node.toLowerCase() : path.structure;
        if (!name || !/^[a-z][a-z0-9-]*$/.test(name)) throw new Error(`${view}/${layer}: bad path name ${name}`);
        if (!path.node && structures && !structures.has(name)) throw new Error(`${view}/${layer}: structure ${name} is not one of the config's STRUCTURE_WORDS`);
        const n = (counters.get(name) ?? 0) + 1;
        counters.set(name, n);
        const node = path.node ? drawable.get(path.node) : null;
        if (path.node && !node) {
          const member = members.find((item) => item.shortName === path.node);
          throw new Error(member
            ? `${view}/${layer}: ${path.node} (${member.id}) is a group, a compartment or another node's parent, and is never drawn`
            : `${view}/${layer}: unknown node ${path.node}`);
        }
        if (node && listOnly[node.id]) throw new Error(`${view}/${layer}: ${node.id} is listed as list-only (${listOnly[node.id]}) and is never drawn`);
        const id = `${view}__${layer}__${name}__${n}`;
        if (path.outcrop) outcrops.push({ pathId: id, nodeId: node.id, view, layer, note: path.outcrop });
        return { id, nodeId: node ? node.id : null, kind: path.kind, d: path.d };
      });
      out[view][layer] = { paths, labels: drawn.labels };
    }
  }
  const asset = {
    key: config.ASSET_KEY,
    version: config.ASSET_VERSION,
    regionId: config.REGION,
    viewBox: { width: config.CANVAS.width, height: config.CANVAS.height },
    ...(config.SIDES ? { sides: config.SIDES } : {}),
    viewOrder: config.VIEW_ORDER.map((view) => ({ ...view })),
    views: out,
    licenseNote: config.LICENSE_NOTE,
  };
  return { asset, outcrops };
}
