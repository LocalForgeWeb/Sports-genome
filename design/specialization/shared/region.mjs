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

export async function loadConfig(region) {
  return import(pathToFileURL(join(designDir, region, "config.mjs")).href);
}

export async function loadViews(region) {
  const { buildViews } = await import(pathToFileURL(join(designDir, region, "views/index.mjs")).href);
  return buildViews();
}

/** The region's members (its own nodes and the other regions' muscles it lists), as the config says where to read them. */
export async function loadMembers(config) {
  const { tsImport } = await import("tsx/esm/api");
  const module = await tsImport(pathToFileURL(resolve(root, config.REGION_DATA.module)).href, import.meta.url);
  const data = module[config.REGION_DATA.export];
  if (!data?.nodes) throw new Error(`${config.REGION_DATA.module} exports no ${config.REGION_DATA.export} with nodes`);
  return data.nodes;
}

export async function loadDrawing(region) {
  const config = await loadConfig(region);
  return { config, views: await loadViews(region), members: await loadMembers(config) };
}

/** Where a region's generated asset is written: shared/specialization/regions/<region>/diagram.generated.ts. */
export const generatedPath = (region) => resolve(root, "shared/specialization/regions", region, "diagram.generated.ts");
