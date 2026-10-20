/**
 * Writes what the workout logger reads of the atlas, from the registry and the variant library
 * (docs/specialization-atlas/10-multi-region.md §6.4; 07-logger.md):
 *
 *   npx tsx scripts/specialization/emit-logging-table.ts          # rewrite both files
 *   npx tsx scripts/specialization/emit-logging-table.ts --check  # exit 1 if either is stale
 *
 * - `shared/specialization/loggingTable.generated.ts`: one row per catalog exercise a production
 *   region maps, with its measure, its counting attributes (laterality, leg laterality, the limb
 *   whose side is recorded and the leg a side names), whether a production region paired by that
 *   limb maps it, and which production regions map it, with and without a straps-sensitive
 *   mapping. The tracker and the swap sheet read this table instead of every region's variants
 *   and mappings, so the workout logger downloads a few kilobytes, not the regions' mapping text.
 * - `shared/specialization/holdCatalogIds.ts`: the catalog ids measured in seconds, which the
 *   first screens read. It imports nothing, so it adds only its own bytes to them.
 *
 * Both are deterministic (rows in catalog id order, regions in body order, no dates), so
 * client/src/lib/specialization/loggingTable.test.ts regenerates them in memory and fails on
 * any drift from the registry.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { specializationRegions } from "../../shared/specialization/registry";
import { variantById, variantFor } from "../../shared/specialization/variants";
import type { ExerciseVariant, LegLaterality, Laterality, RegionId, SetMeasure, SideAnchor, SidedBy, SpecializationRegionData, VariantId } from "../../shared/specialization/types";

const here = dirname(fileURLToPath(import.meta.url));
export const LOGGING_TABLE_PATH = resolve(here, "../../shared/specialization/loggingTable.generated.ts");
export const HOLD_CATALOG_IDS_PATH = resolve(here, "../../shared/specialization/holdCatalogIds.ts");
const COMMAND = "npx tsx scripts/specialization/emit-logging-table.ts";

/** One row of the table, as the generated file declares it. */
export type LoggingTableRowInput = {
  catalogExerciseId: number;
  catalogName: string;
  measure: SetMeasure;
  laterality: Laterality;
  legLaterality?: LegLaterality;
  sidedBy: SidedBy;
  sideAnchor?: SideAnchor;
  sideCounted: boolean;
  strapsBy: RegionId[];
  mappedBy: RegionId[];
};

/** What the table reads of a region: its record and its own mappings. */
export type LoggingRegionInput = Pick<SpecializationRegionData, "region" | "mappings">;

/** The variant library as the table reads it: every record by id, and the current one per catalog id. */
export type VariantLookup = { byId: ReadonlyMap<VariantId, ExerciseVariant>; current: (catalogExerciseId: number) => ExerciseVariant | null };
const library: VariantLookup = { byId: variantById, current: variantFor };

/**
 * The rows for these regions. Only production regions are read; a mapping marked rejected says
 * the exercise does not load that muscle, so it maps nothing here. Every mapped variant must be
 * the current one for its catalog id (`variantFor`), and a variant whose side is recorded on the
 * leg must name the leg a side means: the emitter refuses either, rather than guess.
 */
export function loggingTableRows(regions: readonly LoggingRegionInput[] = specializationRegions, variants: VariantLookup = library): LoggingTableRowInput[] {
  const production = [...regions].filter((data) => data.region.status === "production").sort((a, b) => a.region.sortOrder - b.region.sortOrder || a.region.id.localeCompare(b.region.id));
  const rows = new Map<number, LoggingTableRowInput>();
  for (const { region, mappings } of production) {
    for (const mapping of mappings) {
      if (mapping.reviewStatus === "rejected") continue;
      const named = variants.byId.get(mapping.variantId);
      if (!named) throw new Error(`${region.id}: mapping ${mapping.id} names ${mapping.variantId}, which the variant library does not hold`);
      const variant = variants.current(named.catalogExerciseId);
      if (!variant || variant.id !== named.id) throw new Error(`${region.id}: mapping ${mapping.id} names ${named.id}, which is not the current variant of catalog ${named.catalogExerciseId} (${variant?.id ?? "none"})`);
      const { catalogExerciseId } = variant;
      if (variant.sidedBy === "leg" && !variant.sideAnchor) throw new Error(`${variant.id}: its side is recorded on the leg, but it has no side anchor to say which leg`);
      const row = rows.get(catalogExerciseId) ?? {
        catalogExerciseId,
        catalogName: variant.catalogName,
        measure: variant.measure,
        laterality: variant.laterality,
        ...(variant.legLaterality ? { legLaterality: variant.legLaterality } : {}),
        sidedBy: variant.sidedBy,
        ...(variant.sideAnchor ? { sideAnchor: variant.sideAnchor } : {}),
        sideCounted: false,
        strapsBy: [],
        mappedBy: [],
      };
      if (!row.mappedBy.includes(region.id)) row.mappedBy.push(region.id);
      if (mapping.requiresNoStraps && !row.strapsBy.includes(region.id)) row.strapsBy.push(region.id);
      if (region.sides.model === "paired" && region.sides.limb === variant.sidedBy) row.sideCounted = true;
      rows.set(catalogExerciseId, row);
    }
  }
  return Array.from(rows.values()).sort((a, b) => a.catalogExerciseId - b.catalogExerciseId);
}

const quoted = (value: string) => JSON.stringify(value);
const list = (values: readonly string[]) => `[${values.map(quoted).join(", ")}]`;

function rowLine(row: LoggingTableRowInput): string {
  const fields = [
    `measure: ${quoted(row.measure)}`,
    `laterality: ${quoted(row.laterality)}`,
    ...(row.legLaterality ? [`legLaterality: ${quoted(row.legLaterality)}`] : []),
    `sidedBy: ${quoted(row.sidedBy)}`,
    ...(row.sideAnchor ? [`sideAnchor: ${quoted(row.sideAnchor)}`] : []),
    `sideCounted: ${row.sideCounted}`,
    `strapsBy: ${list(row.strapsBy)}`,
    `mappedBy: ${list(row.mappedBy)}`,
  ];
  return `  // ${row.catalogName}\n  [${row.catalogExerciseId}, { ${fields.join(", ")} }],`;
}

/** The logging table's module text. */
export function emitLoggingTable(rows: readonly LoggingTableRowInput[] = loggingTableRows()): string {
  return `// Generated by scripts/specialization/emit-logging-table.ts from the registry and the variant
// library. Do not edit: run ${COMMAND}
import type { Laterality, LegLaterality, RegionId, SetMeasure, SideAnchor, SidedBy } from "./types";

/**
 * What the workout logger reads of one catalog exercise that a production region maps
 * (docs/specialization-atlas/10-multi-region.md §6.4). The logger's policy
 * (\`loggingPolicy.ts\`) and the athlete's gates (\`client/src/lib/specialization/loggerGates.ts\`)
 * are read from it; an exercise no production region maps has no row and asks nothing.
 */
export type LoggingTableRow = {
  /** What the set's dose is entered in: reps, or the seconds of a hold. */
  measure: SetMeasure;
  /** Whether the arms work one at a time (the variant's \`laterality\`). */
  laterality: Laterality;
  /** Whether the legs work one at a time; written only where a region reads it. */
  legLaterality?: LegLaterality;
  /** The limb whose side a set records (\`side\` for the arm, \`legSide\` for the leg), or none. */
  sidedBy: SidedBy;
  /** Which leg a recorded leg side names: the front leg of a split squat, the standing leg of a single-leg hinge. */
  sideAnchor?: SideAnchor;
  /** A production region paired by the \`sidedBy\` limb maps it, so a side recorded on that limb is counted. */
  sideCounted: boolean;
  /** Production regions with a mapping of it that a strapped set does not earn. */
  strapsBy: readonly RegionId[];
  /** Production regions that map it (a rejected mapping maps nothing), in body order. */
  mappedBy: readonly RegionId[];
};

/** Every catalog exercise a production region maps, by catalog id. */
export const loggingTable: ReadonlyMap<number, LoggingTableRow> = new Map<number, LoggingTableRow>([
${rows.map(rowLine).join("\n")}
]);
`;
}

/** The light hold list's module text: the rows measured in seconds. */
export function emitHoldCatalogIds(rows: readonly LoggingTableRowInput[] = loggingTableRows()): string {
  const holds = rows.filter((row) => row.measure === "seconds");
  const names = holds.map((row, index) => `${row.catalogExerciseId} ${row.catalogName}${index === holds.length - 1 ? "." : ","}`);
  const wrapped = wrap(names, 96).map((line) => ` * ${line}`).join("\n");
  return `// Generated by scripts/specialization/emit-logging-table.ts with the logging table. Do not edit:
// run ${COMMAND}

/**
 * The catalog exercises the atlas measures in seconds held, by catalog id: the one fact about an
 * exercise that the app's first screens need from the atlas (07-logger.md, "One reading of a
 * hold's prescription").
 *
 * Home's Plan editor, its picker, print and share, and the workout history load with the first
 * screen, so they must not import the atlas's logging table (every mapped exercise's row,
 * \`loggingTable.generated.ts\`) or its region data (\`registry.ts\` carries the drawing, claims
 * and sources too). This list is that measure and nothing else, a few bytes in the main bundle.
 * It imports nothing.
 *
 * It is written with the logging table from the same rows: exactly the exercises a production
 * region maps with a variant measured in seconds (10-multi-region.md §3, "Holds"). The emitter's
 * \`--check\` and client/src/lib/specialization/loggingTable.test.ts fail when it drifts.
 *
${wrapped}
 */
export const holdCatalogIds: ReadonlySet<number> = new Set([${holds.map((row) => row.catalogExerciseId).join(", ")}]);

/** What a catalog exercise's sets are measured in: seconds for a hold, else reps (also for no id). */
export function catalogMeasureOf(catalogExerciseId: number | null | undefined): "reps" | "seconds" {
  return catalogExerciseId !== null && catalogExerciseId !== undefined && holdCatalogIds.has(catalogExerciseId) ? "seconds" : "reps";
}
`;
}

/** Items joined by spaces into lines of at most `width` characters, never breaking an item. */
function wrap(items: readonly string[], width: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const item of items) {
    if (line && `${line} ${item}`.length > width) {
      lines.push(line);
      line = item;
    } else line = line ? `${line} ${item}` : item;
  }
  if (line) lines.push(line);
  return lines.length ? lines : ["None yet."];
}

/** Both files, path and text, from the registry. */
export function emitLoggingFiles(): { path: string; text: string }[] {
  const rows = loggingTableRows();
  return [
    { path: LOGGING_TABLE_PATH, text: emitLoggingTable(rows) },
    { path: HOLD_CATALOG_IDS_PATH, text: emitHoldCatalogIds(rows) },
  ];
}

// ---------------------------------------------------------------- command line

const isMain = process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) {
  const files = emitLoggingFiles();
  if (process.argv.includes("--check")) {
    const stale = files.filter(({ path, text }) => {
      try {
        return readFileSync(path, "utf8") !== text;
      } catch {
        return true;
      }
    });
    if (stale.length) {
      for (const { path } of stale) console.error(`${path} is stale: run ${COMMAND}`);
      process.exit(1);
    }
    console.log("Logging table and hold list are current.");
  } else {
    for (const { path, text } of files) {
      writeFileSync(path, text);
      console.log(`Wrote ${path} (${text.length} characters).`);
    }
  }
}
