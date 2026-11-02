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
 *   first screens read. It imports nothing, so it adds only its own bytes to them. It reads two
 *   sources: the atlas's rows above, and the catalog's own execution records
 *   (client/src/lib/exerciseExecution.ts), so a hold no production region maps (Zercher Hold, the
 *   manual neck isometrics) is timed without pretending an atlas region maps it (Zercher, neck
 *   and bench handoff §3.3). One row per catalog id; a row both sources measure must be measured
 *   the same way by both, or the emitter refuses to write either file.
 * - `client/src/lib/exerciseLoggingFacts.generated.ts`: what the logger and the screens that read
 *   a workout back need of those execution records (the load convention, the neck action, the
 *   head direction, the setup fields), and nothing else: no steps, roles or sources, so the first
 *   screens can read it for about two kilobytes.
 *
 * - `shared/specialization/regions/<region>/libraryVariants.generated.ts`, one per production region
 *   (wave A, 23 Oct 2026): the variant library's records that region's page reads beyond its own
 *   version's: those of the catalog exercises tagged with its keys (within its tag scope) that its
 *   version does not map, which it reads for region-only sets (`taggedVariants`), those its
 *   homes' published versions map for its external members (`homeVariants`), and, for a region
 *   whose page reads its own lane's records (`regionVariantRecords`, the forearm), those its own
 *   version maps that another lane wrote (`versionVariants`; F3, 24 Oct 2026: the face pulls, cable
 *   rows and kneeling pulldown whose brachioradialis `forearm_mappings_v2` credits). A region's page reads these
 *   instead of the whole library, so opening the forearm does not download every region's
 *   variants (10-multi-region.md §6.1's download gate).
 *
 * All are deterministic (rows in catalog id order, regions in body order, records in library
 * order, no dates), so client/src/lib/specialization/loggingTable.test.ts regenerates them in
 * memory and fails on any drift from the registry, the library or the catalog.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { exercises as catalog } from "../../client/src/lib/exerciseCatalog";
import { exerciseExecutionById, type ExerciseExecution } from "../../client/src/lib/exerciseExecution";
import { registeredRegionContents, specializationRegions } from "../../shared/specialization/registry";
import { regionVariantRecords, variantById, variantFor, variantLibrary } from "../../shared/specialization/variants";
import type { ExerciseVariant, LegLaterality, Laterality, RegionContent, RegionId, SetMeasure, SideAnchor, SidedBy, SpecializationRegionData, VariantId } from "../../shared/specialization/types";

const here = dirname(fileURLToPath(import.meta.url));
export const LOGGING_TABLE_PATH = resolve(here, "../../shared/specialization/loggingTable.generated.ts");
export const HOLD_CATALOG_IDS_PATH = resolve(here, "../../shared/specialization/holdCatalogIds.ts");
export const LOGGING_FACTS_PATH = resolve(here, "../../client/src/lib/exerciseLoggingFacts.generated.ts");
export const libraryVariantsPath = (regionId: RegionId) => resolve(here, `../../shared/specialization/regions/${regionId}/libraryVariants.generated.ts`);
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

/** A catalog row's measure, as one source states it: the atlas (a production region's variant) or the catalog's own execution record. */
export type MeasuredRow = { catalogExerciseId: number; catalogName: string; measure: SetMeasure };

/** The execution records as the emitter reads them, by catalog id. */
export type ExecutionLookup = ReadonlyMap<number, Pick<ExerciseExecution, "measure" | "load" | "neckAction" | "headDirection" | "setupFields">>;

/**
 * The catalog's own measures: every execution record's, named as the catalog names its row. A
 * record whose id the catalog does not hold is refused, rather than timed under no name.
 */
export function catalogMeasureRows(records: ExecutionLookup = exerciseExecutionById, tags: readonly { id: number; name: string }[] = catalog): MeasuredRow[] {
  return Array.from(records, ([catalogExerciseId, record]) => {
    const catalogName = tags.find((row) => row.id === catalogExerciseId)?.name;
    if (catalogName === undefined) throw new Error(`execution record ${catalogExerciseId} names no catalog row`);
    return { catalogExerciseId, catalogName, measure: record.measure };
  }).sort((a, b) => a.catalogExerciseId - b.catalogExerciseId);
}

/**
 * Every catalog row either source measures, once each, in catalog id order. The atlas's row
 * stands for its id; the catalog's own record adds the ids the atlas does not map. A row both
 * measure must be measured the same way by both: one reading of a set's dose, or none.
 */
export function measuredRows(atlas: readonly MeasuredRow[], own: readonly MeasuredRow[]): MeasuredRow[] {
  const rows = new Map<number, MeasuredRow>(atlas.map((row) => [row.catalogExerciseId, { catalogExerciseId: row.catalogExerciseId, catalogName: row.catalogName, measure: row.measure }]));
  for (const row of own) {
    const mapped = rows.get(row.catalogExerciseId);
    if (mapped && mapped.measure !== row.measure) throw new Error(`catalog ${row.catalogExerciseId} (${row.catalogName}): the atlas measures it in ${mapped.measure}, its execution record in ${row.measure}`);
    if (!mapped) rows.set(row.catalogExerciseId, { ...row });
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

/**
 * The light hold list's module text: the rows measured in seconds, from the atlas's rows and the
 * catalog's own execution records together (`measuredRows`).
 */
export function emitHoldCatalogIds(rows: readonly LoggingTableRowInput[] = loggingTableRows(), own: readonly MeasuredRow[] = catalogMeasureRows()): string {
  const holds = measuredRows(rows, own).filter((row) => row.measure === "seconds");
  const names = holds.map((row, index) => `${row.catalogExerciseId} ${row.catalogName}${index === holds.length - 1 ? "." : ","}`);
  const wrapped = wrap(names, 96).map((line) => ` * ${line}`).join("\n");
  return `// Generated by scripts/specialization/emit-logging-table.ts with the logging table. Do not edit:
// run ${COMMAND}

/**
 * The catalog exercises measured in seconds held, by catalog id: the one fact about an exercise
 * that the app's first screens need from the atlas (07-logger.md, "One reading of a hold's
 * prescription") or from the catalog's execution records.
 *
 * Home's Plan editor, its picker, print and share, and the workout history load with the first
 * screen, so they must not import the atlas's logging table (every mapped exercise's row,
 * \`loggingTable.generated.ts\`) or its region data (\`registry.ts\` carries the drawing, claims
 * and sources too). This list is that measure and nothing else, a few bytes in the main bundle.
 * It imports nothing.
 *
 * It is written with the logging table, from two sources: the exercises a production region maps
 * with a variant measured in seconds (10-multi-region.md §3, "Holds"), and the catalog rows whose
 * own execution record (client/src/lib/exerciseExecution.ts) is measured in seconds, which no
 * region needs to map (the Zercher, neck and bench handoff, §3.3). One entry per id; the emitter
 * refuses a row the two sources measure differently. Its \`--check\` and
 * client/src/lib/specialization/loggingTable.test.ts fail when the list drifts.
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

/**
 * The light logging facts' module text: per execution record, what a set of it records and how two
 * sets of it compare (its load convention, neck action, head direction and setup fields), in
 * catalog id order. Steps, roles, aliases and sources stay in exerciseExecution.ts.
 */
export function emitExerciseLoggingFacts(records: ExecutionLookup = exerciseExecutionById, tags: readonly { id: number; name: string }[] = catalog): string {
  const lines = catalogMeasureRows(records, tags).map(({ catalogExerciseId, catalogName }) => {
    const record = records.get(catalogExerciseId)!;
    const fields = [
      `load: ${quoted(record.load)}`,
      ...(record.neckAction ? [`neckAction: ${quoted(record.neckAction)}`] : []),
      ...(record.headDirection ? [`headDirection: ${quoted(record.headDirection)}`] : []),
      `setupFields: ${list(record.setupFields)}`,
    ];
    return `  // ${catalogName}\n  [${catalogExerciseId}, { ${fields.join(", ")} }],`;
  });
  return `// Generated by scripts/specialization/emit-logging-table.ts from client/src/lib/exerciseExecution.ts.
// Do not edit: run ${COMMAND}
import type { HeadDirectionAction, LoadConvention, NeckAction, SetupField } from "./exerciseExecution";

/**
 * What the workout logger and every screen that reads a workout back need of an exercise's
 * execution record (exerciseExecution.ts), and nothing more: what one number of load means, the
 * neck action, whether each set is done to the left or the right of the head, and the setup values
 * recorded with the exercise. The history, the session detail and the recap load with the app's
 * first screens, so they read this, about two kilobytes before compression, instead of the
 * records' steps, roles and sources. Its measure is in the light hold list (shared/specialization/holdCatalogIds.ts).
 * client/src/lib/specialization/loggingTable.test.ts fails when it drifts from the records.
 */
export type ExerciseLoggingFacts = {
  load: LoadConvention;
  /** The neck action, on neck rows. */
  neckAction?: NeckAction;
  /** Each set is done to the left or the right, recorded as the head's direction (never an arm). */
  headDirection?: HeadDirectionAction;
  setupFields: readonly SetupField[];
};

/** Every catalog row with an execution record, by catalog id. */
export const exerciseLoggingFacts: ReadonlyMap<number, ExerciseLoggingFacts> = new Map<number, ExerciseLoggingFacts>([
${lines.join("\n")}
]);
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

// ---------------------------------------------------------------- the library records a page reads

/** A catalog row's muscle tags, as the page's `catalogMusclesFor` reads them. */
export type CatalogTags = { id: number; primaryMuscles: readonly string[]; secondaryMuscles: readonly string[] };

/**
 * The library's records a production region's page reads beyond its own version's, in library order:
 * - `taggedVariants`: the current variants of the catalog exercises tagged with the region's
 *   catalog keys within its tag scope (`primary`, or `any` tag) that neither its version nor its
 *   homes' (for its external members, `homeVariants`) map. A
 *   bout of one is region-only work, read with this record (its sides, measure and straps) as the
 *   calculator always read it from the library (§3; §11 decision 11(c)); it is never credited.
 * - `homeVariants`: the variants its homes' published versions map for its external members that
 *   its version does not map, which those rows credit.
 * - `versionVariants`: for a region whose page reads its own lane's records (`ownRecords`, from
 *   `regionVariantRecords`), the variants its own version maps that those records do not hold;
 *   empty for a region that reads the whole library.
 */
export function libraryReadsOf(
  content: RegionContent,
  contents: readonly RegionContent[] = registeredRegionContents,
  tags: readonly CatalogTags[] = catalog,
  library: readonly ExerciseVariant[] = variantLibrary,
  ownRecords: readonly ExerciseVariant[] | undefined = regionVariantRecords[content.region.id],
): { taggedVariants: ExerciseVariant[]; homeVariants: ExerciseVariant[]; versionVariants: ExerciseVariant[] } {
  const { region } = content;
  const own = new Set(content.mappings.map((mapping) => mapping.variantId));
  const keys = new Set(region.catalogKeys);
  const inScope = (row: CatalogTags) => row.primaryMuscles.some((key) => keys.has(key)) || (region.regionOnlyTagScope === "any" && row.secondaryMuscles.some((key) => keys.has(key)));
  const tagged = new Set(tags.filter(inScope).map((row) => row.id));
  const current = (variant: ExerciseVariant) => variantFor(variant.catalogExerciseId)?.id === variant.id;
  const ownNodes = new Set(content.nodes.map((node) => node.id));
  const external = new Set(content.members.map((member) => member.nodeId).filter((id) => !ownNodes.has(id)));
  const homeMapped = new Set(
    contents
      .filter((home) => home !== content && home.mappingVersion?.state === "published")
      .flatMap((home) => home.mappings.filter((mapping) => mapping.versionKey === home.mappingVersion!.key && external.has(mapping.nodeId)).map((mapping) => mapping.variantId)),
  );
  return {
    taggedVariants: library.filter((variant) => current(variant) && tagged.has(variant.catalogExerciseId) && !own.has(variant.id) && !homeMapped.has(variant.id)),
    homeVariants: library.filter((variant) => homeMapped.has(variant.id) && !own.has(variant.id)),
    versionVariants: ownRecords ? library.filter((variant) => own.has(variant.id) && !ownRecords.some((record) => record.id === variant.id)) : [],
  };
}

/** One record as a literal, its fields in the library's order. */
const recordLine = (variant: ExerciseVariant) => `  ${JSON.stringify(variant)},`;

/** A region's library-records module text. */
export function emitLibraryVariants(content: RegionContent, reads = libraryReadsOf(content)): string {
  const block = (list: readonly ExerciseVariant[]) => (list.length ? `\n${list.map(recordLine).join("\n")}\n` : "");
  return `// Generated by scripts/specialization/emit-logging-table.ts from the registry, the variant library
// and the exercise catalog. Do not edit: run ${COMMAND}
import type { ExerciseVariant } from "../../types";

/**
 * The variant library's records the ${region(content)} page reads beyond its own version's
 * (docs/specialization-atlas/10-multi-region.md §3, §6.1), copied record for record, so the page
 * never loads the whole library (shared/specialization/variants/).
 */

/**
 * The current variants of the catalog exercises tagged with this region's catalog keys
 * (${content.region.regionOnlyTagScope === "any" ? "primary or secondary tags" : "primary tags"}) that neither its version nor its homes' map: read for
 * region-only sets and plans as the library reads them, never credited (\`RegionContent.taggedVariants\`).
 */
export const taggedVariants: ExerciseVariant[] = [${block(reads.taggedVariants)}];

/** The variants its homes' published versions map for its external members that its version does not map. */
export const homeVariants: ExerciseVariant[] = [${block(reads.homeVariants)}];

/** The variants its own version maps whose records another region's lane wrote (empty where the page reads the whole library). */
export const versionVariants: ExerciseVariant[] = [${block(reads.versionVariants)}];
`;
}

const region = (content: RegionContent) => content.region.label.toLowerCase().replace(/s$/, "");

/** Every file, path and text, from the registry. */
export function emitLoggingFiles(): { path: string; text: string }[] {
  const rows = loggingTableRows();
  return [
    { path: LOGGING_TABLE_PATH, text: emitLoggingTable(rows) },
    { path: HOLD_CATALOG_IDS_PATH, text: emitHoldCatalogIds(rows) },
    { path: LOGGING_FACTS_PATH, text: emitExerciseLoggingFacts() },
    ...registeredRegionContents.filter((content) => content.region.status === "production").map((content) => ({ path: libraryVariantsPath(content.region.id), text: emitLibraryVariants(content) })),
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
    console.log("Logging table, hold list, logging facts and the regions' library records are current.");
  } else {
    for (const { path, text } of files) {
      writeFileSync(path, text);
      console.log(`Wrote ${path} (${text.length} characters).`);
    }
  }
}
