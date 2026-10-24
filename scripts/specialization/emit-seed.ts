/**
 * Writes the specialization atlas seed migration from the TypeScript content.
 *
 *   npx tsx scripts/specialization/emit-seed.ts          # rewrite the seed file
 *   npx tsx scripts/specialization/emit-seed.ts --check  # exit 1 if the file is stale
 *
 * The anatomy, mappings and rule are written once, in shared/specialization (registry.ts
 * for the registered regions, rules.ts for the accounting rule), and this turns them into
 * SQL so the database can never quietly disagree with what the app counts. The output is
 * deterministic (rows sorted by key, nodes parents first; no dates or counters from the run), so
 * server/specializationSeed.test.ts can regenerate it in memory and fail on any drift.
 *
 * What the SQL does (docs/specialization-atlas/04-database.md):
 * - Upserts keyed by the content's own text keys (`on conflict ... do update ... where
 *   distinct`), so applying it twice changes nothing and touches no row.
 * - Rows that point at other rows look their targets up by key with LEFT JOINs: a key the
 *   database does not have turns into a NULL in a NOT NULL column and fails loudly,
 *   rather than dropping the row.
 * - Mapping versions are inserted as drafts, filled, then published, so the publication
 *   rule (specialization.mapping_version_problems) runs on the real rows. Once published a
 *   version is immutable, and so is what it rests on (its variants and their attributes, node
 *   actions, the reviewed claims of its muscles and their sources, the sources it cites, its
 *   muscles' memberships): re-applying identical content is a no-op, and changed content under
 *   a key a published version depends on is refused by the database, so the whole seed rolls
 *   back with the database's message. Changing them means new keys and a new mapping version.
 * - Sets the content owns end up exactly as the content has them: a mapping version's
 *   mappings and their sources; the claims each region in the seed owns, with their sources
 *   and the node actions resting on them; each seeded variant's attributes; a drawing's views,
 *   paths and labels. Rows the content no longer has are deleted before the upserts, so a
 *   removal under a published version (or of a frozen attribute) is refused like any other
 *   change, and a draft is cleaned. An attribute's `frozen_at` is the database's own (set when a
 *   version mapping the variant is published), never written here.
 * - A region's members and actions are never deleted: goals name them, so one the content drops
 *   is unlisted (`listed = false`), which the database refuses for a member a published version
 *   of the region maps.
 * - It never deletes the records others point at: regions, nodes (goals may point at
 *   one), actions, sources, catalog exercises, variants, dimensions and their values.
 *
 * Keys: node, action, variant, region, dimension and rule ids are the TypeScript ids. Records
 * are defined once (the shared libraries, and each node with its home region), so two regions
 * listing one source, action or variant list the same record. Claim keys are
 * `<owner region>:<claim id>` (`claimKeyOf`), whichever region's folder keeps the record.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { claimKeyOf, resolveMembers, sideRelationOf, type ResolvedMember } from "../../shared/specialization/compose";
import { registeredRegionContents } from "../../shared/specialization/registry";
import { publishedExposureRules } from "../../shared/specialization/rules";
import { countingDimensions, descriptiveDimensions } from "../../shared/specialization/variants/dimensions";
import type { AnatomyNode, Claim, ExerciseVariant, JointAction, RegionContent, RuleVersion, Source, SpecializationRegion } from "../../shared/specialization/types";

const here = dirname(fileURLToPath(import.meta.url));
/**
 * Where the seed is written. Production records each file under its own version and name, so
 * a file keeps its name (04-database.md §9 lists every place that names the files;
 * server/specializationSeed.test.ts fails on any reference to a file that is not there). The
 * seed's own text names no file by version.
 */
// The seed this content is written to. Seed v1 (…_seed_v1.sql, applied to production on 18 Oct 2026), seed v2
// (…_seed_v2.sql, 22 Oct 2026), seed v3 (…_seed_v3.sql, 24 Oct 2026) and seed v4 (…_seed_v4.sql, 24 Oct 2026) are
// history: never written again (server/specializationHistory.test.ts pins them). Each release gets the next file.
export const CURRENT_SEED_MIGRATION_PATH = resolve(here, "../../supabase/migrations/20261025120100_specialization_atlas_seed_v5.sql");

/** public.exercises rows carry the app catalog's id under this repository name. */
export const CATALOG_REPOSITORY = "LocalForgeWeb/Sports-genome";

export interface SeedInput {
  /**
   * Every region the seed holds, as its folder declares it (`RegionContent`): the production
   * and reference regions of the registry, and in tests fixture regions. A node's home region
   * and a claim's owner are always among them.
   */
  regions: readonly RegionContent[];
  /** Accounting rule versions. Only published ones are written: a draft waits for its release (10-multi-region.md §4.3). */
  rules: readonly RuleVersion[];
}

export const productionSeedInput = (): SeedInput => ({ regions: registeredRegionContents, rules: publishedExposureRules });

/**
 * nodes.sort_order and actions.sort_order as seed v1 wrote them. Both columns are legacy since
 * schema v2 (readers use region_nodes and region_actions), and a v1 row keeps its value for good;
 * server/specializationSeed.test.ts reads these back from seed v1. A row added since gets
 * `region sort × 1000 + its index there` (`legacySortOrders`).
 */
export const v1SortOrders: { readonly nodes: Readonly<Record<string, number>>; readonly actions: Readonly<Record<string, number>> } = {
  nodes: {
    "forearm.anterior": 0, "forearm.posterior": 1, "forearm.br": 2, "forearm.fcr": 3, "forearm.fcu": 4, "forearm.pl": 5, "forearm.fds": 6, "forearm.fdp": 7,
    "forearm.fpl": 8, "forearm.pt": 9, "forearm.pq": 10, "forearm.ecrl": 11, "forearm.ecrb": 12, "forearm.ecu": 13, "forearm.ed": 14, "forearm.edm": 15,
    "forearm.ei": 16, "forearm.apl": 17, "forearm.epb": 18, "forearm.epl": 19, "forearm.supinator": 20, "forearm.anconeus": 21,
    "upper_arm.biceps": 22, "upper_arm.brachialis": 23,
  },
  actions: {
    "elbow.flexion": 0, "elbow.extension": 1, "forearm.pronation": 2, "forearm.supination": 3, "wrist.flexion": 4, "wrist.extension": 5,
    "wrist.radial_deviation": 6, "wrist.ulnar_deviation": 7, "fingers.mcp_flexion": 8, "fingers.pip_flexion": 9, "fingers.dip_flexion": 10,
    "fingers.extension": 11, "little_finger.extension": 12, "index_finger.extension": 13, "thumb.ip_flexion": 14, "thumb.cmc_abduction": 15,
    "thumb.mcp_extension": 16, "thumb.ip_extension": 17, "hand.palmar_aponeurosis_tension": 18, "forearm.distal_radioulnar_stabilization": 19,
  },
};

// ---------------------------------------------------------------- SQL literals

type Json = { jsonb: unknown };
type Sql = { sql: string };
type Value = string | number | boolean | null | readonly string[] | Json | Sql;

const byKey = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Dollar-quoted text, with a tag the text cannot close early. */
export function quote(text: string): string {
  if (!text.includes("$$") && !text.endsWith("$")) return `$$${text}$$`;
  for (let n = 0; ; n += 1) {
    const tag = `$q${n || ""}$`;
    if (!text.includes(tag.slice(0, -1))) return `${tag}${text}${tag}`;
  }
}

function literal(value: Value): string {
  if (value === null) return "null";
  if (typeof value === "string") return quote(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`Not a finite number: ${value}`);
    return String(value);
  }
  if (Array.isArray(value)) return value.length ? `array[${value.map((item) => quote(item)).join(", ")}]` : "array[]::text[]";
  if ("sql" in (value as Sql)) return (value as Sql).sql;
  return `${quote(JSON.stringify((value as Json).jsonb))}::jsonb`;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function dateValue(value: string, what: string): string {
  if (!DATE.test(value)) throw new Error(`${what}: expected a YYYY-MM-DD date, got ${value}`);
  return value;
}

/** A content date ("2026-10-16") as an instant, at midnight UTC, so no session zone leaks in. */
function instantValue(value: string | null, what: string): Value {
  if (value === null) return null;
  if (DATE.test(value)) return `${value} 00:00:00+00`;
  if (/^\d{4}-\d{2}-\d{2}T[\d:.]+(Z|[+-]\d{2}:\d{2})$/.test(value)) return value;
  throw new Error(`${what}: expected a date or an ISO instant with a zone, got ${value}`);
}

const rowsBlock = (rows: readonly Value[][]) => rows.map((row) => `  (${row.map(literal).join(", ")})`).join(",\n");

const valuesList = (rows: readonly Value[][]) => `(values\n${rows.map((row) => `      (${row.map(literal).join(", ")})`).join(",\n")})`;

/** `<expr> in (values ...)`, one row per line. */
function inValues(expr: string, rows: readonly Value[][]): string {
  if (!rows.length) throw new Error(`An empty list for ${expr}: leave the statement out instead`);
  return `${expr} in ${valuesList(rows)}`;
}

/** `<expr> not in (values ...)`; null when nothing is kept, so the caller drops the condition. */
function notIn(expr: string, rows: readonly Value[][]): string | null {
  return rows.length ? `${expr} not in ${valuesList(rows)}` : null;
}

/** `delete ... using ... where <conditions>`, one condition per line, the null ones left out. */
function deleteWhere(target: string, using: readonly string[], conditions: readonly (string | null)[]): string {
  const kept = conditions.filter((condition): condition is string => condition !== null);
  return `delete from ${target}${using.length ? ` using ${using.join(", ")}` : ""}\n  where ${kept.join("\n    and ")};`;
}

function updateClause(alias: string, columns: readonly string[]): string {
  if (!columns.length) return "do nothing";
  const set = columns.map((column) => `${column} = excluded.${column}`).join(", ");
  const mine = columns.map((column) => `${alias}.${column}`).join(", ");
  const theirs = columns.map((column) => `excluded.${column}`).join(", ");
  return `do update set ${set}\n  where (${mine}) is distinct from (${theirs})`;
}

/** insert ... values ... on conflict (key) do update, for rows that need no lookups. */
function upsertValues(
  table: string,
  columns: readonly string[],
  conflict: readonly string[],
  rows: readonly Value[][],
  update: readonly string[] = columns.filter((column) => !conflict.includes(column)),
): string {
  if (!rows.length) return `-- ${table}: none`;
  return [
    `insert into specialization.${table} as t (${columns.join(", ")}) values`,
    rowsBlock(rows),
    `on conflict (${conflict.join(", ")}) ${updateClause("t", update)};`,
  ].join("\n");
}

/** insert ... select ... from (values ...) left join <lookups>, for rows that point at other rows by key. */
function upsertSelect(options: {
  table: string;
  columns: readonly string[];
  select: readonly string[];
  valueColumns: readonly string[];
  joins: readonly string[];
  conflict: readonly string[];
  rows: readonly Value[][];
  update?: readonly string[];
}): string {
  const { table, columns, select, valueColumns, joins, conflict, rows } = options;
  if (!rows.length) return `-- ${table}: none`;
  const update = options.update ?? columns.filter((column) => !conflict.includes(column));
  return [
    `insert into specialization.${table} as t (${columns.join(", ")})`,
    `select ${select.join(", ")}`,
    "from (values",
    rowsBlock(rows),
    `) as x (${valueColumns.join(", ")})`,
    ...joins,
    `on conflict (${conflict.join(", ")}) ${updateClause("t", update)};`,
  ].join("\n");
}

/**
 * `update ... set listed = false` for the rows of the seeded regions the content no longer
 * lists: memberships and region actions are never deleted, since goals name them.
 */
function unlist(table: string, key: string, regionIds: readonly string[], kept: readonly Value[][]): string {
  if (!regionIds.length) return `-- ${table}: no region`;
  const conditions = [
    `${inValues("r.region_id", regionIds.map((id): Value[] => [id]))}`,
    notIn(`(r.region_id, r.${key})`, kept),
  ].filter((condition): condition is string => condition !== null);
  return `update specialization.${table} r set listed = false\n  where r.listed\n    and ${conditions.join("\n    and ")};`;
}

// ---------------------------------------------------------------- merging regions

/** One record per key across regions; the same key with different content is an error. */
function mergeByKey<T>(kind: string, entries: { key: string; value: T; from: string }[]): Map<string, T> {
  const merged = new Map<string, { value: T; from: string }>();
  for (const entry of entries) {
    const seen = merged.get(entry.key);
    if (!seen) merged.set(entry.key, { value: entry.value, from: entry.from });
    else if (JSON.stringify(seen.value) !== JSON.stringify(entry.value)) {
      throw new Error(`${kind} ${entry.key} differs between ${seen.from} and ${entry.from}; give one of them its own key`);
    }
  }
  return new Map([...merged].map(([key, { value }]) => [key, value]));
}

function assertUnique(kind: string, keys: readonly string[]) {
  const seen = new Set<string>();
  for (const key of keys) {
    if (seen.has(key)) throw new Error(`Duplicate ${kind} ${key}`);
    seen.add(key);
  }
}

/** Parents before children, then content order, so every parent exists when its child is written. */
function parentsFirst(nodes: readonly AnatomyNode[]): AnatomyNode[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const depth = new Map<string, number>();
  const depthOf = (node: AnatomyNode, trail: Set<string>): number => {
    const known = depth.get(node.id);
    if (known !== undefined) return known;
    if (trail.has(node.id)) throw new Error(`Node parent cycle through ${node.id}`);
    if (node.parentId === null) return 0;
    const parent = byId.get(node.parentId);
    if (!parent) throw new Error(`Node ${node.id}: parent ${node.parentId} is not a node`);
    const value = depthOf(parent, new Set([...trail, node.id])) + 1;
    depth.set(node.id, value);
    return value;
  };
  return nodes.map((node, index) => ({ node, index, depth: depthOf(node, new Set()) })).sort((a, b) => a.depth - b.depth || a.index - b.index).map((entry) => entry.node);
}

/**
 * The legacy sort_order of each node and action the seed writes: the v1 value for a v1 row; for
 * a new node, its home region's sort × 1000 + its place in the home's members; for a new action,
 * the lowest region sort × 1000 + place among the regions listing it. Written when the row is
 * inserted and never rewritten (the columns are not among the upserts' update columns), so a
 * region added later cannot reorder rows already there (10-multi-region.md §5.2, D experiment 3).
 */
function legacySortOrders(regions: readonly RegionContent[], members: ReadonlyMap<string, readonly ResolvedMember[]>) {
  const nodes = new Map<string, number>();
  for (const content of regions) {
    for (const node of content.nodes) {
      const pinned = v1SortOrders.nodes[node.id];
      if (pinned !== undefined) {
        nodes.set(node.id, pinned);
        continue;
      }
      const index = members.get(content.region.id)!.findIndex((member) => member.node.id === node.id);
      nodes.set(node.id, content.region.sortOrder * 1000 + index);
    }
  }
  const actions = new Map<string, number>();
  for (const content of regions) {
    content.actions.forEach((action, index) => {
      const value = v1SortOrders.actions[action.id] ?? content.region.sortOrder * 1000 + index;
      const seen = actions.get(action.id);
      if (seen === undefined || (v1SortOrders.actions[action.id] === undefined && value < seen)) actions.set(action.id, value);
    });
  }
  return { nodes, actions };
}

// ---------------------------------------------------------------- the seed

/**
 * View and layer ids are the drawing's own (palm, back, thumb; surface, intermediate,
 * deep for the forearm; front, side, rear could be another region's). This is the shape
 * the schema's CHECK accepts, so the emitter refuses what the database would.
 */
const DIAGRAM_ID = /^[a-z][a-z0-9_]*$/;

/** The words a region with a page carries in its row (RegionWording), each refused blank like the database does. */
const PAGE_WORDS = ["externalGroup", "incidentalWork", "progressSubtitle"] as const;

/** Every dimension of the vocabulary (variants/dimensions.ts) in its order: the counting ones, then the descriptive ones. */
const dimensionVocabulary = [
  ...Object.entries(countingDimensions).map(([id, dimension]) => ({ id, kind: "counting" as const, label: dimension.label, values: dimension.values as Readonly<Record<string, string>> })),
  ...Object.entries(descriptiveDimensions).map(([id, dimension]) => ({ id, kind: "descriptive" as const, label: dimension.label, values: dimension.values as Readonly<Record<string, string>> })),
];

/** A variant's attributes, dimension to value: the counting ones always written out (sided_by on every variant), then its descriptive ones. */
function attributesOf(variant: ExerciseVariant): [dimension: string, value: string][] {
  if (!variant.sidedBy) throw new Error(`Variant ${variant.id} has no sidedBy: every variant says which limb's side is recorded, explicitly`);
  const out: [string, string][] = [["sided_by", variant.sidedBy]];
  if (variant.legLaterality) out.push(["leg_laterality", variant.legLaterality]);
  if (variant.sideAnchor) out.push(["side_anchor", variant.sideAnchor]);
  for (const [dimension, value] of Object.entries(variant.dimensions ?? {})) if (value !== undefined) out.push([dimension, value as string]);
  for (const [dimension, value] of out) {
    const known = dimensionVocabulary.find((entry) => entry.id === dimension);
    if (!known || !(value in known.values)) throw new Error(`Variant ${variant.id}: ${dimension} ${value} is not in the dimension vocabulary (shared/specialization/variants/dimensions.ts)`);
  }
  return out;
}

/**
 * The columns schema v2 added to a region's row, from its record: the side model with its words
 * and its sentence, catalog keys, tag scope, external heading and measure defaults. Refused here
 * where the database's side model (regions_sides_shape) would refuse them: a paired region names
 * its limb, the words for it and a sentence with `{side}` once; a midline region has no limb or
 * words, and a sentence that names no side.
 */
function sideColumns(region: SpecializationRegion): Value[] {
  const { wording, sides } = region;
  const heading: unknown = wording.externalHeading;
  if (typeof heading !== "string" || !heading.trim()) throw new Error(`Region ${region.id}: wording.externalHeading must be text`);
  const sideWords = [wording.sideWord, wording.sideWordPlural];
  const template: unknown = wording.onSideTemplate;
  if (typeof template !== "string" || !template.trim()) throw new Error(`Region ${region.id}: wording.onSideTemplate must be text`);
  if (sides?.model === "paired") {
    if (sides.limb !== "arm" && sides.limb !== "leg") throw new Error(`Region ${region.id}: a paired region names its limb, arm or leg`);
    if (sideWords.some((word) => typeof word !== "string" || !word.trim())) throw new Error(`Region ${region.id}: a paired region needs wording.sideWord and wording.sideWordPlural`);
    if (template.split("{side}").length !== 2) throw new Error(`Region ${region.id}: a paired region's wording.onSideTemplate names {side} once`);
  } else if (sides?.model === "midline") {
    if (sideWords.some((word) => word !== undefined)) throw new Error(`Region ${region.id}: a midline region has no side words`);
    if (template.includes("{side}")) throw new Error(`Region ${region.id}: a midline region's wording.onSideTemplate names no side`);
  } else {
    throw new Error(`Region ${region.id} needs a side model, paired or midline`);
  }
  assertUnique(`measurement metric in region ${region.id}`, region.measurementMetrics);
  for (const [metric, defaults] of Object.entries(region.measurementDefaults ?? {})) {
    if (!region.measurementMetrics.includes(metric as (typeof region.measurementMetrics)[number])) throw new Error(`Region ${region.id}: a default for ${metric}, which the region does not offer`);
    if (!defaults?.landmark.trim()) throw new Error(`Region ${region.id}: the ${metric} default needs a landmark`);
  }
  return [
    sides.model, sides.model === "paired" ? sides.limb : null, wording.sideWord ?? null, wording.sideWordPlural ?? null,
    [...region.catalogKeys], region.regionOnlyTagScope, wording.externalHeading, { jsonb: region.measurementDefaults ?? {} }, template,
  ];
}

/**
 * A region's row. A reference region has no page: until its promotion, schema v1's columns hold
 * what seed v1 wrote for the upper arm (its label and status; no heading, entry label, words or
 * measures; sort order 0; no keys), and only schema v2's come from its record (10-multi-region.md
 * §1.3, §5.2), so the promotion is the one change that writes the rest.
 */
function regionRow(region: SpecializationRegion): Value[] {
  const { wording } = region;
  if (!wording) throw new Error(`Region ${region.id} has no wording`);
  if (region.status === "reference") return [region.id, region.label, null, 0, "reference", [], null, { jsonb: {} }, null, null, null, [], ...sideColumns(region)];
  for (const field of PAGE_WORDS) {
    const text: unknown = wording[field];
    if (typeof text !== "string" || !text.trim()) throw new Error(`Region ${region.id}: wording.${field} must be text`);
  }
  return [
    region.id, region.label, region.heading, region.sortOrder, region.status, [...region.bodyMapKeys], region.entryLabel, { jsonb: region.nodeForBodyMapKey ?? {} },
    wording.externalGroup, wording.incidentalWork, wording.progressSubtitle, [...region.measurementMetrics], ...sideColumns(region),
  ];
}

export function emitSeedSql(input: SeedInput = productionSeedInput()): string {
  // Region order in the registry must not change the output.
  const regions = [...input.regions].sort((a, b) => byKey(a.region.id, b.region.id));
  const rules = input.rules.filter((rule) => rule.publishedAt !== null);
  assertUnique("region", regions.map((content) => content.region.id));
  assertUnique("mapping version", regions.flatMap((content) => (content.mappingVersion ? [content.mappingVersion.key] : [])));
  assertUnique("rule version", rules.map((rule) => rule.id));
  const regionIds = new Set(regions.map((content) => content.region.id));

  // Records, each defined once: every node with its home region; actions, sources and variants from
  // the shared libraries, so two regions listing one list the same record.
  for (const content of regions) {
    for (const node of content.nodes) {
      if (node.regionId !== content.region.id) throw new Error(`Region ${content.region.id} keeps node ${node.id}, whose home is ${node.regionId}: a node is kept with its home region`);
      if (node.role === "external") throw new Error(`Node ${node.id}: its role is its role in its home region, never external`);
    }
    assertUnique(`action in region ${content.region.id}`, content.actions.map((action) => action.id));
  }
  assertUnique("node", regions.flatMap((content) => content.nodes.map((node) => node.id)));
  const nodes = new Map(regions.flatMap((content) => content.nodes.map((node) => [node.id, node] as const)));
  const actions = mergeByKey<JointAction>("Action", regions.flatMap((content) => content.actions.map((action) => ({ key: action.id, value: action, from: content.region.id }))));
  const sources = mergeByKey<Source>("Source", regions.flatMap((content) => content.sources.map((source) => ({ key: source.id, value: source, from: content.region.id }))));
  const variants = mergeByKey<ExerciseVariant>("Variant", regions.flatMap((content) => content.variants.map((variant) => ({ key: variant.id, value: variant, from: content.region.id }))));
  const catalog = mergeByKey<string>(
    "Catalog exercise",
    [...variants.values()].map((variant) => ({ key: String(variant.catalogExerciseId), value: variant.catalogName, from: variant.id })),
  );

  // Members, each resolved against its home's record: the role a region lists it with is derived
  // (its home role at home, external anywhere else). Every node is listed by its home region.
  const members = new Map(regions.map((content) => [content.region.id, resolveMembers(content, regions.filter((other) => other !== content))] as const));
  for (const content of regions) {
    const listed = members.get(content.region.id)!;
    assertUnique(`member of region ${content.region.id}`, listed.map(({ node }) => node.id));
    for (const node of content.nodes) {
      if (!listed.some((member) => member.node.id === node.id)) throw new Error(`Node ${node.id} is not a member of its home region ${content.region.id}`);
    }
  }

  // Claims keyed by their owner, wherever their records are kept; the owner is a region in the
  // seed, so the stale-claim delete below covers every claim the content holds.
  const claims = regions.flatMap((content) => content.claims.map((claim) => ({ key: claimKeyOf(claim), claim })));
  assertUnique("claim", claims.map(({ key }) => key));
  const claimByKey = new Map(claims.map(({ key, claim }) => [key, claim] as const));
  for (const { key, claim } of claims) {
    if (!regionIds.has(claim.ownerRegionId)) throw new Error(`Claim ${key}: its owner ${claim.ownerRegionId} is not a region in this seed`);
    if (!nodes.has(claim.nodeId)) throw new Error(`Claim ${key}: node ${claim.nodeId} is not a node in this seed`);
    assertUnique(`source of claim ${key}`, claim.sources.map((ref) => ref.sourceId));
    for (const ref of claim.sources) if (!sources.has(ref.sourceId)) throw new Error(`Claim ${key}: source ${ref.sourceId} is not a source in this seed`);
    if (claim.reviewedAt !== null) dateValue(claim.reviewedAt, `Claim ${key} reviewedAt`);
    else if (claim.reviewStatus === "reviewed") throw new Error(`Claim ${key} is reviewed and needs its review date`);
  }

  // Node actions are global: one per node and action, declared by the node's home region.
  const nodeActions = regions.flatMap((content) => content.nodeActions).sort((a, b) => byKey(`${a.nodeId} ${a.actionId}`, `${b.nodeId} ${b.actionId}`));
  assertUnique("node action", nodeActions.map((row) => `${row.nodeId} ${row.actionId}`));
  for (const row of nodeActions) {
    const claim: Claim | undefined = claimByKey.get(row.claimKey);
    if (!nodes.has(row.nodeId) || !actions.has(row.actionId)) throw new Error(`Node action ${row.nodeId} ${row.actionId}: unknown node or action`);
    if (!claim || claim.id !== row.claimId || claim.nodeId !== row.nodeId || claim.kind !== "function") {
      throw new Error(`Node action ${row.nodeId} ${row.actionId}: ${row.claimKey} is not a function claim of that node`);
    }
  }

  for (const content of regions) {
    const where = `region ${content.region.id}`;
    const version = content.mappingVersion;
    if (!version && content.mappings.length) throw new Error(`Region ${content.region.id} has mappings but no mapping version`);
    assertUnique(`mapping in ${where}`, content.mappings.map((mapping) => mapping.id));
    for (const mapping of content.mappings) {
      if (mapping.versionKey !== version?.key) throw new Error(`Mapping ${mapping.id} is in version ${mapping.versionKey}, not ${version?.key}`);
      if (!variants.has(mapping.variantId)) throw new Error(`Mapping ${mapping.id}: variant ${mapping.variantId} is not a variant in this seed`);
      if (!nodes.has(mapping.nodeId)) throw new Error(`Mapping ${mapping.id}: node ${mapping.nodeId} is not a node in this seed`);
      if (mapping.actionId !== null && !actions.has(mapping.actionId)) throw new Error(`Mapping ${mapping.id}: action ${mapping.actionId} is not an action in this seed`);
      assertUnique(`source of mapping ${mapping.id}`, mapping.sources.map((ref) => ref.sourceId));
      for (const ref of mapping.sources) if (!sources.has(ref.sourceId)) throw new Error(`Mapping ${mapping.id}: source ${ref.sourceId} is not a source in this seed`);
    }
  }

  const sortOrders = legacySortOrders(regions, members);
  const attributes = [...variants.values()].sort((a, b) => byKey(a.id, b.id)).flatMap((variant) => attributesOf(variant).map(([dimension, value]): Value[] => [variant.id, dimension, value, null]));
  const membershipRows = regions.flatMap((content) =>
    members.get(content.region.id)!.map(({ member, node, role }): Value[] => [content.region.id, node.id, role, member.sortOrder, [...(member.caveats ?? [])], true]),
  );
  const regionActionRows = regions.flatMap((content) => content.actions.map((action, index): Value[] => [content.region.id, action.id, index, true]));

  const sections: string[] = [];
  const section = (title: string, sql: string) => sections.push(`-- ${title}\n${sql}`);

  section(
    "Regions (a reference region only holds other regions' members and has no page: schema v1's columns stay as seed v1 wrote them until its promotion)",
    upsertValues(
      "regions",
      [
        "id", "label", "heading", "sort_order", "status", "body_map_keys", "entry_label", "node_for_body_map_key", "external_group", "incidental_work", "progress_subtitle", "measurement_metrics",
        "side_model", "side_limb", "side_word", "side_word_plural", "catalog_keys", "region_only_tag_scope", "external_heading", "measurement_defaults", "on_side_template",
      ],
      ["id"],
      regions.map((content) => regionRow(content.region)),
    ),
  );

  section(
    "Joint actions (sort_order is legacy: written once, when the action is new; regions order their actions in region_actions)",
    upsertValues(
      "actions",
      ["id", "joint", "label", "plain_description", "sort_order"],
      ["id"],
      [...actions.values()].sort((a, b) => byKey(a.id, b.id)).map((action) => [action.id, action.joint, action.label, action.plainDescription, sortOrders.actions.get(action.id)!]),
      ["joint", "label", "plain_description"],
    ),
  );

  section(
    "Anatomy nodes, parents first (each from its home region; role is the stored role where one is kept; sort_order is legacy, written once)",
    upsertValues(
      "nodes",
      ["id", "region_id", "parent_id", "kind", "role", "name", "short_name", "aliases", "layer", "surface_visibility", "status", "catalog_muscle_key", "database_muscle", "border", "location", "what_it_does", "shape_note", "caveats", "sort_order"],
      ["id"],
      parentsFirst(regions.flatMap((content) => content.nodes)).map((node) => [
        node.id, node.regionId, node.parentId, node.kind, node.storedRole ?? node.role, node.name, node.shortName, [...node.aliases], node.layer, node.surfaceVisibility, node.status,
        node.catalogMuscleKey, node.databaseMuscle, node.border, node.location, node.whatItDoes, node.shapeNote, [...node.caveats], sortOrders.nodes.get(node.id)!,
      ]),
      ["region_id", "parent_id", "kind", "role", "name", "short_name", "aliases", "layer", "surface_visibility", "status", "catalog_muscle_key", "database_muscle", "border", "location", "what_it_does", "shape_note", "caveats"],
    ),
  );

  section(
    "Sources",
    upsertValues(
      "sources",
      ["source_key", "url", "title", "doi", "evidence_type", "retrieved_on", "notes"],
      ["source_key"],
      [...sources.values()].sort((a, b) => byKey(a.id, b.id)).map((source) => [source.id, source.url, source.title, source.doi, source.evidenceType, dateValue(source.retrievedOn, `Source ${source.id} retrievedOn`), source.notes]),
    ),
  );

  // The claims of the regions in this seed are the content's: a claim's key carries its owner
  // (`<owner>:<claim id>`), claims owned by regions not in the seed are left alone, and the set is
  // every claim the content holds, whichever folder keeps it, so moving a record never looks like
  // deleting it. What the content no longer has goes before any claim is written. Node actions
  // first, since they point at claims, matched by node, action and claim, so one moved to another
  // claim is written again below once that claim is in. Then the claims, with their sources, and
  // then the sources of the claims that stay. Each delete is refused for what a published version
  // rests on, and the refusal names the node action or claim; a draft is cleaned.
  const sortedClaims = [...claims].sort((a, b) => byKey(a.key, b.key));
  if (regions.length) {
    const ownClaim = inValues("split_part(c.claim_key, ':', 1)", regions.map((content): Value[] => [content.region.id]));
    section(
      "Node actions, claims and claim sources no longer in the content (refused for what a published or retired version rests on)",
      [
        deleteWhere("specialization.node_actions na", ["specialization.claims c"], [
          "na.claim_id = c.id",
          ownClaim,
          notIn("(na.node_id, na.action_id, c.claim_key)", nodeActions.map((row): Value[] => [row.nodeId, row.actionId, row.claimKey])),
        ]),
        deleteWhere("specialization.claims c", [], [ownClaim, notIn("c.claim_key", sortedClaims.map(({ key }): Value[] => [key]))]),
        deleteWhere("specialization.claim_sources cs", ["specialization.claims c", "specialization.sources s"], [
          "cs.claim_id = c.id and s.id = cs.source_id",
          ownClaim,
          notIn("(c.claim_key, s.source_key)", sortedClaims.flatMap(({ key, claim }) => claim.sources.map((ref): Value[] => [key, ref.sourceId]))),
        ]),
      ].join("\n"),
    );
  }

  // A new claim goes in as a draft and is reviewed below, once its sources are in: the sources of a
  // reviewed claim on a muscle a published version maps are frozen, first ones included.
  section(
    "Claims (key: <region>:<claim id>)",
    upsertSelect({
      table: "claims",
      columns: ["claim_key", "node_id", "kind", "statement", "basis", "review_status", "reviewed_on", "review_note"],
      select: ["x.claim_key", "x.node_id", "x.kind", "x.statement", "x.basis", "'draft'", "null", "x.review_note"],
      valueColumns: ["claim_key", "node_id", "kind", "statement", "basis", "review_note"],
      joins: [],
      conflict: ["claim_key"],
      rows: sortedClaims.map(({ key, claim }) => [key, claim.nodeId, claim.kind, claim.statement, claim.basis, claim.reviewNote]),
      update: ["node_id", "kind", "statement", "basis", "review_note"],
    }),
  );

  section(
    "Claim sources",
    upsertSelect({
      table: "claim_sources",
      columns: ["claim_id", "source_id", "locator", "qualification", "sort_order"],
      select: ["c.id", "s.id", "x.locator", "x.qualification", "x.sort_order"],
      valueColumns: ["claim_key", "source_key", "locator", "qualification", "sort_order"],
      joins: [
        "left join specialization.claims c on c.claim_key = x.claim_key",
        "left join specialization.sources s on s.source_key = x.source_key",
      ],
      conflict: ["claim_id", "source_id"],
      rows: sortedClaims.flatMap(({ key, claim }) => claim.sources.map((ref, index): Value[] => [key, ref.sourceId, ref.locator, ref.qualification, index])),
    }),
  );

  section(
    "Claim review: each claim's status and date, set once its sources are in",
    sortedClaims.length
      ? [
          "update specialization.claims c set review_status = x.review_status, reviewed_on = x.reviewed_on::date",
          "from (values",
          rowsBlock(sortedClaims.map(({ key, claim }): Value[] => [key, claim.reviewStatus, claim.reviewedAt])),
          ") as x (claim_key, review_status, reviewed_on)",
          "where c.claim_key = x.claim_key and (c.review_status, c.reviewed_on) is distinct from (x.review_status, x.reviewed_on::date);",
        ].join("\n")
      : "-- claims: none",
  );

  section(
    "Node actions (each rests on a function claim of its own node)",
    upsertSelect({
      table: "node_actions",
      columns: ["node_id", "action_id", "role", "claim_id"],
      select: ["x.node_id", "x.action_id", "x.role", "c.id"],
      valueColumns: ["node_id", "action_id", "role", "claim_key"],
      joins: ["left join specialization.claims c on c.claim_key = x.claim_key"],
      conflict: ["node_id", "action_id"],
      rows: nodeActions.map((row) => [row.nodeId, row.actionId, row.role, row.claimKey]),
    }),
  );

  section(
    "Region members (role in that region: its home role at home, external anywhere else)",
    upsertValues("region_nodes", ["region_id", "node_id", "role", "sort_order", "caveats", "listed"], ["region_id", "node_id"], membershipRows),
  );
  section(
    "Region members no longer listed (unlisted, never deleted: goals name them; refused for a member a published version of the region maps)",
    unlist("region_nodes", "node_id", regions.map((content) => content.region.id), membershipRows.map((row) => row.slice(0, 2))),
  );

  section(
    "Region actions (the movements each region offers, in its order)",
    upsertValues("region_actions", ["region_id", "action_id", "sort_order", "listed"], ["region_id", "action_id"], regionActionRows),
  );
  section(
    "Region actions no longer listed (unlisted, never deleted: goals name them)",
    unlist("region_actions", "action_id", regions.map((content) => content.region.id), regionActionRows.map((row) => row.slice(0, 2))),
  );

  // Diagrams: optional per region (null until drawn). A seeded asset version holds exactly
  // the seeded views, paths and labels: stale ones are deleted, the rest upserted. Paths and
  // labels name a declared view by foreign key, so views are written before them and stale
  // views deleted after them (a path may move to a new view in the same seed).
  const diagrams = regions.map((content) => content.diagram).filter((diagram): diagram is NonNullable<typeof diagram> => diagram !== null);
  assertUnique("diagram asset", diagrams.map((diagram) => `${diagram.key} v${diagram.version}`));
  if (!diagrams.length) {
    section("Diagram assets", "-- none: no production region has a diagram yet; regenerate this file once one is drawn");
  } else {
    const sorted = [...diagrams].sort((a, b) => byKey(a.key, b.key) || a.version - b.version);
    section(
      "Diagram assets",
      upsertValues(
        "diagram_assets",
        ["region_id", "asset_key", "version", "view_box_width", "view_box_height", "license_note", "sides"],
        ["asset_key", "version"],
        // sides: null where the drawing leaves it out (the forearm's, as published), which reads as one_side.
        sorted.map((diagram) => [diagram.regionId, diagram.key, diagram.version, diagram.viewBox.width, diagram.viewBox.height, diagram.licenseNote, diagram.sides ?? null]),
      ),
    );
    const viewRows: Value[][] = [];
    const pathRows: Value[][] = [];
    const labelRows: Value[][] = [];
    for (const diagram of sorted) {
      // Views and layers in key order, so the output never depends on how the object was built.
      const drawing = Object.entries(diagram.views)
        .sort(([a], [b]) => byKey(a, b))
        .flatMap(([view, layers]) => Object.entries(layers ?? {}).sort(([a], [b]) => byKey(a, b)).map(([layer, drawn]) => ({ view, layer, drawn })));
      for (const { view, layer } of drawing) {
        if (!DIAGRAM_ID.test(view)) throw new Error(`Diagram ${diagram.key}: view id ${JSON.stringify(view)} must be lowercase letters, digits and underscores, starting with a letter`);
        if (!DIAGRAM_ID.test(layer)) throw new Error(`Diagram ${diagram.key}: layer id ${JSON.stringify(layer)} in view ${view} must be lowercase letters, digits and underscores, starting with a letter`);
      }
      // The views in the page's order with their button words: exactly the views drawn.
      const order = diagram.viewOrder ?? [];
      assertUnique(`view in diagram ${diagram.key}`, order.map((view) => view.id));
      order.forEach((view, index) => {
        if (!DIAGRAM_ID.test(view.id)) throw new Error(`Diagram ${diagram.key}: view id ${JSON.stringify(view.id)} in viewOrder must be lowercase letters, digits and underscores, starting with a letter`);
        if (typeof view.label !== "string" || !view.label.trim()) throw new Error(`Diagram ${diagram.key}: view ${view.id} needs the words for its button`);
        viewRows.push([diagram.key, diagram.version, view.id, view.label, index]);
      });
      const drawnViews = Object.keys(diagram.views).sort(byKey);
      const listedViews = order.map((view) => view.id).sort(byKey);
      if (drawnViews.join(" ") !== listedViews.join(" ")) {
        throw new Error(`Diagram ${diagram.key}: viewOrder lists ${listedViews.join(", ") || "no view"} but the drawing has ${drawnViews.join(", ") || "none"}; list each drawn view once`);
      }
      assertUnique(`path in diagram ${diagram.key}`, drawing.flatMap(({ drawn }) => drawn?.paths.map((path) => path.id) ?? []));
      for (const { view, layer, drawn } of drawing) {
        if (!drawn) continue;
        drawn.paths.forEach((path, index) => {
          if (path.nodeId !== null && !nodes.has(path.nodeId)) throw new Error(`Diagram ${diagram.key} path ${path.id}: node ${path.nodeId} is not a node`);
          pathRows.push([diagram.key, diagram.version, path.id, view, layer, path.kind, path.nodeId, path.d, index]);
        });
        drawn.labels.forEach((label, index) => labelRows.push([diagram.key, diagram.version, view, layer, index, label.text, label.x, label.y, label.anchor]));
      }
    }
    const stale = sorted.flatMap((diagram) => {
      const asset = `a.asset_key = ${quote(diagram.key)} and a.version = ${diagram.version}`;
      const paths = pathRows.filter((row) => row[0] === diagram.key && row[1] === diagram.version).map((row) => row[2] as string);
      const labels = labelRows.filter((row) => row[0] === diagram.key && row[1] === diagram.version).map((row) => `(${literal(row[2])}, ${literal(row[3])}, ${literal(row[4])})`);
      return [
        `delete from specialization.diagram_paths p using specialization.diagram_assets a\n  where p.asset_id = a.id and ${asset} and p.path_id <> all (${literal(paths)});`,
        `delete from specialization.diagram_labels l using specialization.diagram_assets a\n  where l.asset_id = a.id and ${asset}${labels.length ? ` and (l.view, l.layer, l.sort_order) not in (values ${labels.join(", ")})` : ""};`,
      ];
    });
    section("Diagram paths and labels no longer in the drawing", stale.join("\n"));
    const assetJoin = "left join specialization.diagram_assets a on a.asset_key = x.asset_key and a.version = x.version";
    section(
      "Diagram views (the page's order and the words on its buttons)",
      upsertSelect({
        table: "diagram_views",
        columns: ["asset_id", "view", "label", "sort_order"],
        select: ["a.id", "x.view", "x.label", "x.sort_order"],
        valueColumns: ["asset_key", "version", "view", "label", "sort_order"],
        joins: [assetJoin],
        conflict: ["asset_id", "view"],
        rows: viewRows,
      }),
    );
    section(
      "Diagram paths (draw order is sort_order within a view and layer)",
      upsertSelect({
        table: "diagram_paths",
        columns: ["asset_id", "path_id", "view", "layer", "kind", "node_id", "d", "sort_order"],
        select: ["a.id", "x.path_id", "x.view", "x.layer", "x.kind", "x.node_id", "x.d", "x.sort_order"],
        valueColumns: ["asset_key", "version", "path_id", "view", "layer", "kind", "node_id", "d", "sort_order"],
        joins: [assetJoin],
        conflict: ["asset_id", "path_id"],
        rows: pathRows,
      }),
    );
    section(
      "Diagram labels",
      upsertSelect({
        table: "diagram_labels",
        columns: ["asset_id", "view", "layer", "sort_order", "label_text", "x", "y", "anchor"],
        select: ["a.id", "x.view", "x.layer", "x.sort_order", "x.label_text", "x.x", "x.y", "x.anchor"],
        valueColumns: ["asset_key", "version", "view", "layer", "sort_order", "label_text", "x", "y", "anchor"],
        joins: [assetJoin],
        conflict: ["asset_id", "view", "layer", "sort_order"],
        rows: labelRows,
      }),
    );
    section(
      "Diagram views no longer in the drawing (after its paths and labels have left them)",
      sorted.map((diagram) => {
        const views = viewRows.filter((row) => row[0] === diagram.key && row[1] === diagram.version).map((row) => row[2] as string);
        return `delete from specialization.diagram_views v using specialization.diagram_assets a\n  where v.asset_id = a.id and a.asset_key = ${quote(diagram.key)} and a.version = ${diagram.version} and v.view <> all (${literal(views)});`;
      }).join("\n"),
    );
  }

  section(
    `Catalog exercises the variants use. supabase_exercise_id: the public.exercises row with this catalog id under ${CATALOG_REPOSITORY}, else the one canonical_name ending __catalog_<id>, else null (not there yet)`,
    [
      "insert into specialization.catalog_exercises as t (catalog_id, name, supabase_exercise_id)",
      "select x.catalog_id, x.name, coalesce(",
      `    (select e.id from public.exercises e where e.source_repository = ${quote(CATALOG_REPOSITORY)} and e.source_catalog_id = x.catalog_id),`,
      "    (select (array_agg(e.id))[1] from public.exercises e where e.canonical_name ~ ('__catalog_' || x.catalog_id || '$') having count(*) = 1))",
      "from (values",
      rowsBlock([...catalog.entries()].map(([id, name]): Value[] => [Number(id), name]).sort((a, b) => (a[0] as number) - (b[0] as number))),
      ") as x (catalog_id, name)",
      `on conflict (catalog_id) ${updateClause("t", ["name", "supabase_exercise_id"])};`,
    ].join("\n"),
  );

  section(
    "Exercise variants (one default variant per catalog exercise: cat-<id>)",
    upsertValues(
      "exercise_variants",
      ["variant_key", "catalog_id", "organization", "forearm_orientation", "wrist_position", "grip_type", "straps", "laterality", "phase", "measure", "deliberate_hold", "elbow_angle_deg", "notes"],
      ["variant_key"],
      [...variants.values()].sort((a, b) => byKey(a.id, b.id)).map((variant) => [variant.id, variant.catalogExerciseId, variant.organization, variant.forearmOrientation, variant.wristPosition, variant.gripType, variant.straps, variant.laterality, variant.phase, variant.measure, variant.deliberateHold, variant.elbowAngleDeg, variant.notes]),
    ),
  );

  // The vocabulary, then the attributes that name it, all before the versions below, so a
  // version this seed publishes freezes the attributes it rests on (rule 11 reads them).
  section(
    "Variant dimensions (counting: the calculator, the logger and publication rule 11 read them; descriptive: mapping rationales cite them)",
    upsertValues("variant_dimensions", ["id", "label", "sort_order", "kind"], ["id"], dimensionVocabulary.map((dimension, index): Value[] => [dimension.id, dimension.label, index, dimension.kind])),
  );
  section(
    "Variant dimension values (never deleted: an attribute may name one)",
    upsertValues(
      "variant_dimension_values",
      ["dimension_id", "value", "label", "sort_order"],
      ["dimension_id", "value"],
      dimensionVocabulary.flatMap((dimension) => Object.entries(dimension.values).map(([value, label], index): Value[] => [dimension.id, value, label, index])),
    ),
  );
  // A seeded variant's attributes are the content's, like a version's mappings: one the content
  // drops goes, so a later publish never freezes what the calculator and logger no longer read.
  // A frozen one is refused by name. Variants not in the seed keep theirs.
  section(
    "Variant attributes no longer in the content (refused for a frozen one: a published version rests on it)",
    attributes.length
      ? deleteWhere("specialization.variant_attributes a", [], [
          inValues("a.variant_key", [...variants.keys()].sort(byKey).map((id): Value[] => [id])),
          notIn("(a.variant_key, a.dimension_id)", attributes.map((row) => row.slice(0, 2))),
        ])
      : "-- none: the seed has no variant",
  );
  section(
    "Variant attributes (frozen_at is the database's own, set when a version mapping the variant is published)",
    upsertValues("variant_attributes", ["variant_key", "dimension_id", "value", "notes"], ["variant_key", "dimension_id"], attributes),
  );

  section(
    "Accounting rule versions (published ones only; immutable once published)",
    upsertValues(
      "rule_versions",
      ["id", "specification", "published_at", "notes"],
      ["id"],
      [...rules].sort((a, b) => byKey(a.id, b.id)).map((rule) => [rule.id, { jsonb: rule.specification }, instantValue(rule.publishedAt, `Rule ${rule.id} publishedAt`), rule.notes]),
    ),
  );

  const versions = regions.filter((content) => content.mappingVersion !== null).sort((a, b) => byKey(a.mappingVersion!.key, b.mappingVersion!.key));
  section(
    "Mapping versions, inserted as drafts (published below, once their rows are in)",
    upsertValues(
      "mapping_versions",
      ["version_key", "region_id", "state", "published_at", "method_notes"],
      ["version_key"],
      versions.map((content) => [content.mappingVersion!.key, content.region.id, "draft", null, content.mappingVersion!.methodNotes]),
      // Never reset a version's state from here: publishing is the explicit step below.
      ["region_id", "method_notes"],
    ),
  );

  const mappings = versions.flatMap((content) => [...content.mappings].sort((a, b) => byKey(a.id, b.id)));
  // Per version in the content, mappings first, so a removed mapping is refused by name;
  // their sources go with them. Versions not in the content are left alone.
  const staleMappings = versions.flatMap((content) => {
    const version = `v.version_key = ${quote(content.mappingVersion!.key)}`;
    const rows = [...content.mappings].sort((a, b) => byKey(a.id, b.id));
    return [
      deleteWhere("specialization.variant_mappings m", ["specialization.mapping_versions v"], [`m.version_id = v.id and ${version}`, notIn("m.mapping_key", rows.map((mapping): Value[] => [mapping.id]))]),
      deleteWhere("specialization.mapping_sources ms", ["specialization.variant_mappings m", "specialization.mapping_versions v", "specialization.sources s"], [
        `ms.mapping_id = m.id and m.version_id = v.id and s.id = ms.source_id and ${version}`,
        notIn("(m.mapping_key, s.source_key)", rows.flatMap((mapping) => mapping.sources.map((ref): Value[] => [mapping.id, ref.sourceId]))),
      ]),
    ];
  });
  section(
    "Mappings and mapping sources no longer in the content (refused for a published or retired version; a draft is cleaned)",
    staleMappings.length ? staleMappings.join("\n") : "-- none: the content has no mapping version",
  );

  section(
    "Variant mappings (draft rows are kept: shown as pending review, never counted, never readable by users; side_relation always written)",
    upsertSelect({
      table: "variant_mappings",
      columns: ["version_id", "mapping_key", "variant_key", "node_id", "action_id", "relationship", "muscle_mode", "evidence_basis", "allocation", "requires_no_straps", "rationale", "review_status", "side_relation"],
      select: ["v.id", "x.mapping_key", "x.variant_key", "x.node_id", "x.action_id", "x.relationship", "x.muscle_mode", "x.evidence_basis", "x.allocation", "x.requires_no_straps", "x.rationale", "x.review_status", "x.side_relation"],
      valueColumns: ["version_key", "mapping_key", "variant_key", "node_id", "action_id", "relationship", "muscle_mode", "evidence_basis", "allocation", "requires_no_straps", "rationale", "review_status", "side_relation"],
      joins: ["left join specialization.mapping_versions v on v.version_key = x.version_key"],
      conflict: ["version_id", "mapping_key"],
      rows: mappings.map((mapping) => [
        mapping.versionKey, mapping.id, mapping.variantId, mapping.nodeId, mapping.actionId, mapping.relationship, mapping.muscleMode, mapping.evidenceBasis, mapping.allocation, mapping.requiresNoStraps,
        mapping.rationale, mapping.reviewStatus, sideRelationOf(mapping),
      ]),
    }),
  );

  section(
    "Mapping sources",
    upsertSelect({
      table: "mapping_sources",
      columns: ["mapping_id", "source_id", "locator", "limitation", "sort_order"],
      select: ["m.id", "s.id", "x.locator", "x.limitation", "x.sort_order"],
      valueColumns: ["version_key", "mapping_key", "source_key", "locator", "limitation", "sort_order"],
      joins: [
        "left join specialization.mapping_versions v on v.version_key = x.version_key",
        "left join specialization.variant_mappings m on m.version_id = v.id and m.mapping_key = x.mapping_key",
        "left join specialization.sources s on s.source_key = x.source_key",
      ],
      conflict: ["mapping_id", "source_id"],
      rows: mappings.flatMap((mapping) => mapping.sources.map((ref, index): Value[] => [mapping.versionKey, mapping.id, ref.sourceId, ref.locator, ref.limitation, index])),
    }),
  );

  const publishing = versions.filter((content) => content.mappingVersion!.state !== "draft");
  section(
    "Publish (the database refuses this if the version breaks the publication rule; a version already published is left alone)",
    publishing.length
      ? publishing
          .flatMap((content) => {
            const version = content.mappingVersion!;
            const publishedAt = instantValue(version.publishedAt, `Mapping version ${version.key} publishedAt`);
            const steps = [
              `update specialization.mapping_versions set state = 'published', published_at = ${literal(publishedAt ?? { sql: "now()" })}\n  where version_key = ${quote(version.key)} and state = 'draft';`,
            ];
            if (version.state === "retired") steps.push(`update specialization.mapping_versions set state = 'retired'\n  where version_key = ${quote(version.key)} and state = 'published';`);
            return steps;
          })
          .join("\n")
      : "-- none: every mapping version in the content is a draft",
  );

  const count = (n: number, word: string) => `${n} ${word}`;
  const header = [
    "-- Specialization atlas seed: GENERATED by scripts/specialization/emit-seed.ts from",
    "-- shared/specialization (registry.ts, rules.ts). Do not edit by hand. Regenerate with",
    "--   npx tsx scripts/specialization/emit-seed.ts",
    "-- server/specializationSeed.test.ts fails when this file and the TypeScript disagree.",
    "--",
    `-- Regions: ${regions.map((content) => `${content.region.id} (${content.region.status})`).join(", ")}. Contents: ${[
      count(nodes.size, "nodes"),
      count(actions.size, "actions"),
      count(membershipRows.length, "region members"),
      count(regionActionRows.length, "region actions"),
      count(nodeActions.length, "node actions"),
      count(claims.length, "claims"),
      count(sources.size, "sources"),
      count(catalog.size, "catalog exercises"),
      count(variants.size, "variants"),
      count(dimensionVocabulary.length, "variant dimensions"),
      count(attributes.length, "variant attributes"),
      count(mappings.length, "mappings"),
      count(mappings.reduce((n, mapping) => n + mapping.sources.length, 0), "mapping sources"),
      count(diagrams.length, "diagram assets"),
      count(rules.length, "rule versions"),
    ].join(", ")}.`,
    ...versions.map((content) => {
      const rows = content.mappings;
      const draft = rows.filter((mapping) => mapping.reviewStatus === "draft").map((mapping) => mapping.id).sort(byKey);
      return `-- Mapping version ${content.mappingVersion!.key} (${content.mappingVersion!.state}): ${rows.filter((mapping) => mapping.reviewStatus === "reviewed").length} reviewed, ${draft.length} draft${draft.length ? ` (${draft.join(", ")})` : ""}.`;
    }),
    "--",
    "-- Applies after schema v2 (…_specialization_atlas_schema_v2.sql), and can be applied again:",
    "-- every write is an upsert keyed by the content's own keys that skips unchanged rows, and",
    "-- the sets the content owns (a version's mappings and their sources, the claims of the",
    "-- regions in this file with their sources and node actions, each variant's attributes, a",
    "-- drawing's views, paths and labels) lose the rows the content no longer has. A region's",
    "-- members and actions are never deleted, since goals name them: one the content drops is",
    "-- unlisted. A published mapping or rule version is immutable, and so is what a published",
    "-- version rests on (its variants and their attributes; its muscles' review, region, role,",
    "-- catalog key and membership; node actions; reviewed claims with their basis and sources;",
    "-- cited sources), so a change or removal under such a key is refused here and nothing of",
    "-- this file is applied; give the change new keys and a new version. See",
    "-- docs/specialization-atlas/04-database.md.",
    "--",
    "-- Forward-only: a correction is a new key in the next seed (schema v2 has one undo, valid only before seed v3).",
  ].join("\n");

  return `${header}\n\n${sections.join("\n\n")}\n`;
}

// ---------------------------------------------------------------- command line

const isMain = process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) {
  const sql = emitSeedSql();
  if (process.argv.includes("--check")) {
    let current = "";
    try {
      current = readFileSync(CURRENT_SEED_MIGRATION_PATH, "utf8");
    } catch {
      // Missing reads as stale.
    }
    if (current !== sql) {
      console.error(`${CURRENT_SEED_MIGRATION_PATH} is stale: run npx tsx scripts/specialization/emit-seed.ts`);
      process.exit(1);
    }
    console.log("Seed is current.");
  } else {
    writeFileSync(CURRENT_SEED_MIGRATION_PATH, sql);
    console.log(`Wrote ${CURRENT_SEED_MIGRATION_PATH} (${sql.length} characters).`);
  }
}
