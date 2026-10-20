/**
 * Loads a region's drawing for the command-line tools: its config.mjs, the layers its
 * views/index.mjs builds, and its members from the region's TypeScript data (through tsx, as
 * scripts/specialization/emit-seed.ts is run), so the short-name table always follows the data.
 */
import { existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const designDir = resolve(root, "design/specialization");
const regionsDir = resolve(root, "shared/specialization/regions");

/** The regions with a drawing folder: every folder here with a config.mjs. */
export const drawnRegions = () => readdirSync(designDir).filter((name) => existsSync(join(designDir, name, "config.mjs"))).sort();

/** The region named on the command line, or a usage message and exit 2. */
export function regionArgument(args, usage) {
  const region = args.find((arg) => !arg.startsWith("--"));
  if (!region || !drawnRegions().includes(region)) {
    console.error(`${usage}\n  <region> is one of: ${drawnRegions().join(", ")}`);
    process.exit(2);
  }
  return region;
}

/** `upper_arm` → `upperArm`: the stem of a region's export names (`upperArmNodes`, `upperArmMembers`, `upperArmDiagram`). */
export const exportStem = (region) => region.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());

export async function loadConfig(region) {
  return import(pathToFileURL(join(designDir, region, "config.mjs")).href);
}

export async function loadViews(region) {
  const { buildViews } = await import(pathToFileURL(join(designDir, region, "views/index.mjs")).href);
  return buildViews();
}

/**
 * The modules a region's members are read from: its member list (`regions/<region>/members.ts`,
 * null until the region lists its members) and every region's nodes (`regions/<home>/nodes.ts`,
 * the homes of the muscles it lists), with compose.ts, which resolves them as the page does. Not the
 * region's index.ts: that composes the page's data, which imports the drawing this generator
 * writes and needs a mapping version, so a missing or broken drawing, or a region drawn before
 * it has a page, could not be built (client/src/lib/specialization/diagramContract.test.ts holds
 * these modules to never import a drawing).
 */
export function memberSources(region) {
  const members = join(regionsDir, region, "members.ts");
  return {
    compose: resolve(root, "shared/specialization/compose.ts"),
    members: existsSync(members) ? members : null,
    nodes: readdirSync(regionsDir).sort().filter((name) => existsSync(join(regionsDir, name, "nodes.ts"))).map((name) => ({ region: name, path: join(regionsDir, name, "nodes.ts") })),
  };
}

/** Imports a TypeScript module through tsx, as the seed's emitter is run, so nothing is installed. */
async function importTypeScript(path) {
  const { tsImport } = await import("tsx/esm/api");
  return tsImport(pathToFileURL(path).href, import.meta.url);
}

function exported(module, name, path) {
  if (!Array.isArray(module[name])) throw new Error(`${path} exports no ${name} array`);
  return module[name];
}

/**
 * The region's members (its own nodes and the other regions' muscles it lists), in its order, as
 * `resolveMembers` (compose.ts) resolves them for the page. Before the region lists its members,
 * its own nodes, so its first drawing can be built. `load` imports a TypeScript module (tsx by
 * default; a test passes its own).
 */
export async function loadMembers(region, load = importTypeScript) {
  const sources = memberSources(region);
  const { resolveMembers } = await load(sources.compose);
  const contents = await Promise.all(sources.nodes.map(async ({ region: id, path }) => ({ region: { id }, nodes: exported(await load(path), `${exportStem(id)}Nodes`, path) })));
  const own = contents.find((content) => content.region.id === region);
  if (!own) throw new Error(`shared/specialization/regions/${region}/nodes.ts is missing: the drawing names the region's nodes by their short names`);
  if (!sources.members) {
    console.warn(`shared/specialization/regions/${region}/members.ts is missing: drawing the region's own nodes only, until it lists its members`);
    return own.nodes;
  }
  const members = exported(await load(sources.members), `${exportStem(region)}Members`, sources.members);
  return resolveMembers({ ...own, members }, contents.filter((content) => content !== own)).map(({ node }) => node);
}

export async function loadDrawing(region) {
  const config = await loadConfig(region);
  return { config, views: await loadViews(region), members: await loadMembers(region) };
}

/** Where a region's generated asset is written: shared/specialization/regions/<region>/diagram.generated.ts. */
export const generatedPath = (region) => resolve(regionsDir, region, "diagram.generated.ts");
