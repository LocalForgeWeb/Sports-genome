/**
 * Writes the specialization atlas seed migration from the TypeScript content.
 *
 *   npx tsx scripts/specialization/emit-seed.ts          # rewrite the seed file
 *   npx tsx scripts/specialization/emit-seed.ts --check  # exit 1 if the file is stale
 *
 * The anatomy, mappings and rule are written once, in shared/specialization (registry.ts
 * for the production regions, rules.ts for the accounting rule), and this turns them into
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
 *   version is immutable, and so is what it rests on (its variants, node actions, the
 *   reviewed claims of its muscles and their sources, the sources it cites): re-applying
 *   identical content is a no-op, and changed content under a key a published version
 *   depends on is refused by the database, so the whole seed rolls back with the
 *   database's message. Changing them means new keys and a new mapping version.
 * - Sets the content owns end up exactly as the content has them: a mapping version's
 *   mappings and their sources; the claims of the regions in the seed (claim keys carry
 *   the region), with their sources and the node actions resting on them; a diagram asset
 *   version's views, paths and labels. Rows the content no longer has are deleted before the
 *   upserts, so a removal under a published version is refused like any other change,
 *   and a draft is cleaned.
 * - It never deletes the records others point at: regions, nodes (goals may point at
 *   one), actions, sources, catalog exercises and variants.
 *
 * Keys: node, action, variant, region and rule ids are the TypeScript ids. Source keys are
 * shared across regions (S2 is the same paper everywhere), so two regions may name one
 * only with identical content. Claim keys are `<region>:<claim id>`, because claim ids are
 * only unique inside a region's data.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { specializationRegions } from "../../shared/specialization/registry";
import { exposureRuleV1 } from "../../shared/specialization/rules";
import type {
  AnatomyNode,
  ExerciseVariant,
  JointAction,
  RuleVersion,
  Source,
  SpecializationRegion,
  SpecializationRegionData,
} from "../../shared/specialization/types";

const here = dirname(fileURLToPath(import.meta.url));
export const SEED_MIGRATION_PATH = resolve(here, "../../supabase/migrations/20261016120100_specialization_atlas_seed_v1.sql");

/**
 * Regions that only appear as the home of another region's external contributors (the
 * biceps and brachialis a curl also loads). They have no page, so the content has no
 * region record for them; the seed needs a label for their row.
 */
export const referenceRegionLabels: Readonly<Record<string, string>> = {
  upper_arm: "Upper arm",
};

/** public.exercises rows carry the app catalog's id under this repository name. */
export const CATALOG_REPOSITORY = "LocalForgeWeb/Sports-genome";

export interface SeedInput {
  regions: readonly SpecializationRegionData[];
  rules: readonly RuleVersion[];
  referenceRegionLabels: Readonly<Record<string, string>>;
}

export const productionSeedInput = (): SeedInput => ({ regions: specializationRegions, rules: [exposureRuleV1], referenceRegionLabels });

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
}): string {
  const { table, columns, select, valueColumns, joins, conflict, rows } = options;
  if (!rows.length) return `-- ${table}: none`;
  const update = columns.filter((column) => !conflict.includes(column));
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

// ---------------------------------------------------------------- the seed

/**
 * View and layer ids are the drawing's own (palm, back, thumb; surface, intermediate,
 * deep for the forearm; front, side, rear could be another region's). This is the shape
 * the schema's CHECK accepts, so the emitter refuses what the database would.
 */
const DIAGRAM_ID = /^[a-z][a-z0-9_]*$/;

export function emitSeedSql(input: SeedInput = productionSeedInput()): string {
  const { rules } = input;
  // Region order in the registry must not change the output.
  const regions = [...input.regions].sort((a, b) => byKey(a.region.id, b.region.id));
  assertUnique("region", regions.map((data) => data.region.id));
  assertUnique("mapping version", regions.map((data) => data.mappingVersion.key));
  assertUnique("rule version", rules.map((rule) => rule.id));

  // Per region: ids unique and every reference resolvable, before any SQL is written.
  for (const data of regions) {
    const where = `region ${data.region.id}`;
    assertUnique(`node in ${where}`, data.nodes.map((node) => node.id));
    assertUnique(`action in ${where}`, data.actions.map((action) => action.id));
    assertUnique(`claim in ${where}`, data.claims.map((claim) => claim.id));
    assertUnique(`source in ${where}`, data.sources.map((source) => source.id));
    assertUnique(`variant in ${where}`, data.variants.map((variant) => variant.id));
    assertUnique(`mapping in ${where}`, data.mappings.map((mapping) => mapping.id));
    const nodeIds = new Set(data.nodes.map((node) => node.id));
    const actionIds = new Set(data.actions.map((action) => action.id));
    const sourceIds = new Set(data.sources.map((source) => source.id));
    const variantIds = new Set(data.variants.map((variant) => variant.id));
    const claimById = new Map(data.claims.map((claim) => [claim.id, claim]));
    // The page's words and measures for the region are its data, like its heading.
    if (!data.region.wording) throw new Error(`Region ${data.region.id} has no wording`);
    for (const field of ["externalGroup", "incidentalWork", "progressSubtitle"] as const) {
      const text: unknown = data.region.wording[field];
      if (typeof text !== "string" || !text.trim()) throw new Error(`Region ${data.region.id}: wording.${field} must be text`);
    }
    assertUnique(`measurement metric in ${where}`, data.region.measurementMetrics);
    for (const node of data.nodes) {
      if (node.regionId !== data.region.id && !(node.regionId in input.referenceRegionLabels)) {
        throw new Error(`Node ${node.id} lives in region ${node.regionId}, which is neither ${data.region.id} nor a labelled reference region`);
      }
    }
    for (const claim of data.claims) {
      if (!nodeIds.has(claim.nodeId)) throw new Error(`Claim ${claim.id}: node ${claim.nodeId} is not in ${where}`);
      for (const ref of claim.sources) if (!sourceIds.has(ref.sourceId)) throw new Error(`Claim ${claim.id}: source ${ref.sourceId} is not in ${where}`);
      if (claim.reviewedAt !== null) dateValue(claim.reviewedAt, `Claim ${claim.id} reviewedAt`);
    }
    for (const row of data.nodeActions) {
      const claim = claimById.get(row.claimId);
      if (!nodeIds.has(row.nodeId) || !actionIds.has(row.actionId)) throw new Error(`Node action ${row.nodeId} ${row.actionId}: unknown node or action`);
      if (!claim || claim.nodeId !== row.nodeId || claim.kind !== "function") throw new Error(`Node action ${row.nodeId} ${row.actionId}: ${row.claimId} is not a function claim of that node`);
    }
    for (const mapping of data.mappings) {
      if (mapping.versionKey !== data.mappingVersion.key) throw new Error(`Mapping ${mapping.id} is in version ${mapping.versionKey}, not ${data.mappingVersion.key}`);
      if (!variantIds.has(mapping.variantId)) throw new Error(`Mapping ${mapping.id}: variant ${mapping.variantId} is not in ${where}`);
      if (!nodeIds.has(mapping.nodeId)) throw new Error(`Mapping ${mapping.id}: node ${mapping.nodeId} is not in ${where}`);
      if (mapping.actionId !== null && !actionIds.has(mapping.actionId)) throw new Error(`Mapping ${mapping.id}: action ${mapping.actionId} is not in ${where}`);
      assertUnique(`source of mapping ${mapping.id}`, mapping.sources.map((ref) => ref.sourceId));
      for (const ref of mapping.sources) if (!sourceIds.has(ref.sourceId)) throw new Error(`Mapping ${mapping.id}: source ${ref.sourceId} is not in ${where}`);
    }
    for (const claim of data.claims) assertUnique(`source of claim ${claim.id}`, claim.sources.map((ref) => ref.sourceId));
  }

  // Records shared between regions: one row each, identical content or an error.
  const regionRows = new Map<string, SpecializationRegion | { id: string; label: string; reference: true }>();
  for (const data of regions) regionRows.set(data.region.id, data.region);
  for (const data of regions) {
    for (const node of data.nodes) {
      if (!regionRows.has(node.regionId)) regionRows.set(node.regionId, { id: node.regionId, label: input.referenceRegionLabels[node.regionId], reference: true });
    }
  }
  const nodes = mergeByKey<AnatomyNode>("Node", regions.flatMap((data) => data.nodes.map((node) => ({ key: node.id, value: node, from: data.region.id }))));
  const actions = mergeByKey<JointAction>("Action", regions.flatMap((data) => data.actions.map((action) => ({ key: action.id, value: action, from: data.region.id }))));
  // Display order is the content's own order, in the first region that lists the record.
  const firstIndex = (lists: readonly (readonly { id: string }[])[]) => {
    const order = new Map<string, number>();
    for (const list of lists) list.forEach((item, index) => order.has(item.id) || order.set(item.id, index));
    return order;
  };
  const nodeOrder = firstIndex(regions.map((data) => data.nodes));
  const actionOrder = firstIndex(regions.map((data) => data.actions));
  const sources = mergeByKey<Source>("Source", regions.flatMap((data) => data.sources.map((source) => ({ key: source.id, value: source, from: data.region.id }))));
  const variants = mergeByKey<ExerciseVariant>("Variant", regions.flatMap((data) => data.variants.map((variant) => ({ key: variant.id, value: variant, from: data.region.id }))));
  const catalog = mergeByKey<string>(
    "Catalog exercise",
    [...variants.values()].map((variant) => ({ key: String(variant.catalogExerciseId), value: variant.catalogName, from: variant.id })),
  );

  const claimKey = (regionId: string, claimId: string) => `${regionId}:${claimId}`;
  const claims = regions.flatMap((data) => data.claims.map((claim) => ({ key: claimKey(data.region.id, claim.id), claim })));
  const nodeActions = mergeByKey(
    "Node action",
    regions.flatMap((data) => data.nodeActions.map((row) => ({ key: `${row.nodeId} ${row.actionId}`, value: { ...row, claimKey: claimKey(data.region.id, row.claimId) }, from: data.region.id }))),
  );

  const sections: string[] = [];
  const section = (title: string, sql: string) => sections.push(`-- ${title}\n${sql}`);

  section(
    "Regions (reference regions only hold another region's external contributors)",
    upsertValues(
      "regions",
      ["id", "label", "heading", "sort_order", "status", "body_map_keys", "entry_label", "node_for_body_map_key", "external_group", "incidental_work", "progress_subtitle", "measurement_metrics"],
      ["id"],
      [...regionRows.values()].sort((a, b) => byKey(a.id, b.id)).map((region) =>
        "reference" in region
          ? [region.id, region.label, null, 0, "reference", [], null, { jsonb: {} }, null, null, null, []]
          : [
            region.id, region.label, region.heading, region.sortOrder, region.status, [...region.bodyMapKeys], region.entryLabel, { jsonb: region.nodeForBodyMapKey ?? {} },
            region.wording.externalGroup, region.wording.incidentalWork, region.wording.progressSubtitle, [...region.measurementMetrics],
          ],
      ),
    ),
  );

  section(
    "Joint actions",
    upsertValues(
      "actions",
      ["id", "joint", "label", "plain_description", "sort_order"],
      ["id"],
      [...actions.values()].sort((a, b) => byKey(a.id, b.id)).map((action) => [action.id, action.joint, action.label, action.plainDescription, actionOrder.get(action.id)!]),
    ),
  );

  section(
    "Anatomy nodes, parents first",
    upsertValues(
      "nodes",
      ["id", "region_id", "parent_id", "kind", "role", "name", "short_name", "aliases", "layer", "surface_visibility", "status", "catalog_muscle_key", "database_muscle", "border", "location", "what_it_does", "shape_note", "caveats", "sort_order"],
      ["id"],
      parentsFirst([...nodes.values()]).map((node) => [node.id, node.regionId, node.parentId, node.kind, node.role, node.name, node.shortName, [...node.aliases], node.layer, node.surfaceVisibility, node.status, node.catalogMuscleKey, node.databaseMuscle, node.border, node.location, node.whatItDoes, node.shapeNote, [...node.caveats], nodeOrder.get(node.id)!]),
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

  // The claims of the regions in this seed are the content's: their keys carry the region
  // (`<region>:<claim id>`), and claims of other regions are left alone. What the content no
  // longer has goes before any claim is written. Node actions first, since they point at
  // claims, matched by node, action and claim, so one moved to another claim is written
  // again below once that claim is in. Then the claims, with their sources, and then the
  // sources of the claims that stay. Each delete is refused for what a published version
  // rests on, and the refusal names the node action or claim; a draft is cleaned.
  const sortedClaims = [...claims].sort((a, b) => byKey(a.key, b.key));
  const sortedNodeActions = [...nodeActions.entries()].sort(([a], [b]) => byKey(a, b)).map(([, row]) => row);
  if (regions.length) {
    const ownClaim = inValues("split_part(c.claim_key, ':', 1)", regions.map((data): Value[] => [data.region.id]));
    section(
      "Node actions, claims and claim sources no longer in the content (refused for what a published or retired version rests on)",
      [
        deleteWhere("specialization.node_actions na", ["specialization.claims c"], [
          "na.claim_id = c.id",
          ownClaim,
          notIn("(na.node_id, na.action_id, c.claim_key)", sortedNodeActions.map((row): Value[] => [row.nodeId, row.actionId, row.claimKey])),
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

  section(
    "Claims (key: <region>:<claim id>)",
    upsertValues(
      "claims",
      ["claim_key", "node_id", "kind", "statement", "basis", "review_status", "reviewed_on", "review_note"],
      ["claim_key"],
      sortedClaims.map(({ key, claim }) => [key, claim.nodeId, claim.kind, claim.statement, claim.basis, claim.reviewStatus, claim.reviewedAt, claim.reviewNote]),
    ),
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
    "Node actions (each rests on a function claim of its own node)",
    upsertSelect({
      table: "node_actions",
      columns: ["node_id", "action_id", "role", "claim_id"],
      select: ["x.node_id", "x.action_id", "x.role", "c.id"],
      valueColumns: ["node_id", "action_id", "role", "claim_key"],
      joins: ["left join specialization.claims c on c.claim_key = x.claim_key"],
      conflict: ["node_id", "action_id"],
      rows: sortedNodeActions.map((row) => [row.nodeId, row.actionId, row.role, row.claimKey]),
    }),
  );

  // Diagrams: optional per region (null until drawn). A seeded asset version holds exactly
  // the seeded views, paths and labels: stale ones are deleted, the rest upserted. Paths and
  // labels name a declared view by foreign key, so views are written before them and stale
  // views deleted after them (a path may move to a new view in the same seed).
  const diagrams = regions.map((data) => data.diagram).filter((diagram): diagram is NonNullable<typeof diagram> => diagram !== null);
  assertUnique("diagram asset", diagrams.map((diagram) => `${diagram.key} v${diagram.version}`));
  if (!diagrams.length) {
    section("Diagram assets", "-- none: no production region has a diagram yet; regenerate this file once one is drawn");
  } else {
    const sorted = [...diagrams].sort((a, b) => byKey(a.key, b.key) || a.version - b.version);
    section(
      "Diagram assets",
      upsertValues(
        "diagram_assets",
        ["region_id", "asset_key", "version", "view_box_width", "view_box_height", "license_note"],
        ["asset_key", "version"],
        sorted.map((diagram) => [diagram.regionId, diagram.key, diagram.version, diagram.viewBox.width, diagram.viewBox.height, diagram.licenseNote]),
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

  section(
    "Accounting rule versions (immutable once published)",
    upsertValues(
      "rule_versions",
      ["id", "specification", "published_at", "notes"],
      ["id"],
      [...rules].sort((a, b) => byKey(a.id, b.id)).map((rule) => [rule.id, { jsonb: rule.specification }, instantValue(rule.publishedAt, `Rule ${rule.id} publishedAt`), rule.notes]),
    ),
  );

  const versions = [...regions].sort((a, b) => byKey(a.mappingVersion.key, b.mappingVersion.key));
  section(
    "Mapping versions, inserted as drafts (published below, once their rows are in)",
    upsertValues(
      "mapping_versions",
      ["version_key", "region_id", "state", "published_at", "method_notes"],
      ["version_key"],
      versions.map((data) => [data.mappingVersion.key, data.region.id, "draft", null, data.mappingVersion.methodNotes]),
      // Never reset a version's state from here: publishing is the explicit step below.
      ["region_id", "method_notes"],
    ),
  );

  const mappings = versions.flatMap((data) => [...data.mappings].sort((a, b) => byKey(a.id, b.id)));
  // Per version in the content, mappings first, so a removed mapping is refused by name;
  // their sources go with them. Versions not in the content are left alone.
  const staleMappings = versions.flatMap((data) => {
    const version = `v.version_key = ${quote(data.mappingVersion.key)}`;
    const rows = [...data.mappings].sort((a, b) => byKey(a.id, b.id));
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
    "Variant mappings (draft rows are kept: shown as pending review, never counted, never readable by users)",
    upsertSelect({
      table: "variant_mappings",
      columns: ["version_id", "mapping_key", "variant_key", "node_id", "action_id", "relationship", "muscle_mode", "evidence_basis", "allocation", "requires_no_straps", "rationale", "review_status"],
      select: ["v.id", "x.mapping_key", "x.variant_key", "x.node_id", "x.action_id", "x.relationship", "x.muscle_mode", "x.evidence_basis", "x.allocation", "x.requires_no_straps", "x.rationale", "x.review_status"],
      valueColumns: ["version_key", "mapping_key", "variant_key", "node_id", "action_id", "relationship", "muscle_mode", "evidence_basis", "allocation", "requires_no_straps", "rationale", "review_status"],
      joins: ["left join specialization.mapping_versions v on v.version_key = x.version_key"],
      conflict: ["version_id", "mapping_key"],
      rows: mappings.map((mapping) => [mapping.versionKey, mapping.id, mapping.variantId, mapping.nodeId, mapping.actionId, mapping.relationship, mapping.muscleMode, mapping.evidenceBasis, mapping.allocation, mapping.requiresNoStraps, mapping.rationale, mapping.reviewStatus]),
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

  const publishing = versions.filter((data) => data.mappingVersion.state !== "draft");
  section(
    "Publish (the database refuses this if the version breaks the publication rule; a version already published is left alone)",
    publishing.length
      ? publishing
          .flatMap((data) => {
            const version = data.mappingVersion;
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
    `-- Regions: ${[...regionRows.keys()].sort(byKey).join(", ")}. Contents: ${[
      count(nodes.size, "nodes"),
      count(actions.size, "actions"),
      count(nodeActions.size, "node actions"),
      count(claims.length, "claims"),
      count(sources.size, "sources"),
      count(catalog.size, "catalog exercises"),
      count(variants.size, "variants"),
      count(mappings.length, "mappings"),
      count(mappings.reduce((n, mapping) => n + mapping.sources.length, 0), "mapping sources"),
      count(diagrams.length, "diagram assets"),
      count(rules.length, "rule versions"),
    ].join(", ")}.`,
    ...versions.map((data) => {
      const rows = data.mappings;
      const draft = rows.filter((mapping) => mapping.reviewStatus === "draft").map((mapping) => mapping.id).sort(byKey);
      return `-- Mapping version ${data.mappingVersion.key} (${data.mappingVersion.state}): ${rows.filter((mapping) => mapping.reviewStatus === "reviewed").length} reviewed, ${draft.length} draft${draft.length ? ` (${draft.join(", ")})` : ""}.`;
    }),
    "--",
    "-- Applies after 20261016120000_specialization_atlas_schema.sql, and can be applied again:",
    "-- every write is an upsert keyed by the content's own keys that skips unchanged rows, and",
    "-- the sets the content owns (a version's mappings and their sources, a region's claims with",
    "-- their sources and node actions, a drawing's views, paths and labels) lose the rows the",
    "-- content no longer has. A published mapping or rule version is immutable, and so is what a",
    "-- published version rests on (its variants, node actions, reviewed claims and their",
    "-- sources, cited sources), so a change or removal under such a key is refused here and",
    "-- nothing of this file is applied; give the change new keys and a new version. See",
    "-- docs/specialization-atlas/04-database.md.",
    "--",
    "-- Rollback: the schema's (drop schema if exists specialization cascade). Published",
    "-- versions are deliberately undeletable row by row.",
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
      current = readFileSync(SEED_MIGRATION_PATH, "utf8");
    } catch {
      // Missing reads as stale.
    }
    if (current !== sql) {
      console.error(`${SEED_MIGRATION_PATH} is stale: run npx tsx scripts/specialization/emit-seed.ts`);
      process.exit(1);
    }
    console.log("Seed is current.");
  } else {
    writeFileSync(SEED_MIGRATION_PATH, sql);
    console.log(`Wrote ${SEED_MIGRATION_PATH} (${sql.length} characters).`);
  }
}
