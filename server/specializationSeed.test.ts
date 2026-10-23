import { readFileSync, readdirSync } from "node:fs";
import { basename, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { claimKeyOf, resolveMembers, sideRelationOf } from "@shared/specialization/compose";
import { forearmContent, forearmRegionData } from "@shared/specialization/regions/forearm";
import { upperArmContent } from "@shared/specialization/regions/upper_arm";
import { registeredRegionContents } from "@shared/specialization/registry";
import { exposureRuleV1 } from "@shared/specialization/rules";
import { countingDimensions, descriptiveDimensions } from "@shared/specialization/variants/dimensions";
import { deltoidContent, deltoidIds, fixtureArmContent } from "@/lib/specialization/__fixtures__/deltoidRegion";
import { CURRENT_SEED_MIGRATION_PATH as EMITTED_SEED_PATH, emitSeedSql, productionSeedInput, quote, v1SortOrders, type SeedInput } from "../scripts/specialization/emit-seed";
import {
  SCHEMA_MIGRATION_PATH,
  SEED_MIGRATION_PATH,
  SEED_V1_MIGRATION_PATH,
  SEED_V2_MIGRATION_PATH,
  USER_B,
  applyMigration,
  as,
  count,
  createReleaseDb,
  createSupabaseLikeDb,
  readMigration,
  replayMigrations,
  rowVersions,
  rows,
  scriptFailure,
  stubExercises,
  stubMuscles,
} from "./fixtures/specializationPg";
import type { AnatomyNode, DiagramAsset, RegionContent, SpecializationRegion } from "@shared/specialization/types";

/**
 * The seed migration is generated from the TypeScript content (scripts/specialization/
 * emit-seed.ts). This holds the committed file to the generator byte for byte, applies it to
 * Postgres (PGlite) in production's order (schema v1, seed v1, schema v2, seed v2, then this
 * seed; server/fixtures/specializationPg.ts) and reads every record back in the content's own
 * shape, so "the database carries the content" is checked, not assumed. It also proves what a
 * seed may change in rows production already holds (10-multi-region.md §5.2): seed v2, at wave
 * 0's release, two region rows; the current seed, in this release, nothing.
 */

const SETUP = 120_000;
const byId = <T extends { id: string }>(a: T, b: T) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const sorted = <T>(values: readonly T[]) => [...values].sort();

let db: Awaited<ReturnType<typeof createReleaseDb>>;

beforeAll(async () => {
  db = await createReleaseDb();
}, SETUP);

afterAll(async () => {
  await db?.close();
});

/** The production content with these regions' content in place of theirs, and any others added (the deltoid fixture and its arm). */
const withRegions = (...replaced: RegionContent[]): SeedInput => {
  const ids = new Set(replaced.map((content) => content.region.id));
  return { ...productionSeedInput(), regions: [...registeredRegionContents.filter((content) => !ids.has(content.region.id)), ...replaced] };
};
/** The production content and the deltoid fixture, with these in place of theirs. */
const withDeltoid = (...replaced: RegionContent[]): SeedInput => {
  const ids = new Set(replaced.map((content) => content.region.id));
  return withRegions(...[fixtureArmContent, deltoidContent].filter((content) => !ids.has(content.region.id)), ...replaced);
};
const seeded = (input: SeedInput) => scriptFailure(db, emitSeedSql(input));

/** Every content's records, as the seed writes them: each node from its home, each claim keyed by its owner. */
const contents = registeredRegionContents;
const allNodes = contents.flatMap((content) => content.nodes);
const allClaims = contents.flatMap((content) => content.claims);
const allNodeActions = contents.flatMap((content) => content.nodeActions);
const allActions = [...new Map(contents.flatMap((content) => content.actions.map((action) => [action.id, action] as const))).values()];
const allSources = [...new Map(contents.flatMap((content) => content.sources.map((source) => [source.id, source] as const))).values()];
const allVariants = [...new Map(contents.flatMap((content) => content.variants.map((variant) => [variant.id, variant] as const))).values()];
const membersOf = (content: RegionContent) => resolveMembers(content, contents.filter((other) => other !== content));
/** The registered regions in id order, the order the seed writes and the database sorts them in. */
const byRegionId = [...contents].sort((a, b) => a.region.id.localeCompare(b.region.id));
const allMembers = byRegionId.flatMap((content) => membersOf(content).map(({ member, node, role }) => ({ region_id: content.region.id, node_id: node.id, role, sort_order: member.sortOrder, caveats: member.caveats ?? [], listed: true })));
const allRegionActions = byRegionId.flatMap((content) => content.actions.map((action, index) => ({ region_id: content.region.id, action_id: action.id, sort_order: index, listed: true })));
const dimensionIds = [...Object.keys(countingDimensions), ...Object.keys(descriptiveDimensions)];

// Counts come from the content itself, so another content change only needs the seed regenerated.
const forearm = forearmRegionData;
const reviewedMappings = forearm.mappings.filter((mapping) => mapping.reviewStatus === "reviewed");
const draftMappings = forearm.mappings.filter((mapping) => mapping.reviewStatus === "draft");

/** A node row read back in the content's shape: the database's role is the stored role where one is kept (storedRole ?? role). */
const asNodeRow = ({ storedRole, ...node }: AnatomyNode) => ({ ...node, role: storedRole ?? node.role });

/** Every region row, every column, in the content's own shape (SpecializationRegion); a reference region's holds no page words, sides or measures. */
const readRegions = () =>
  rows(
    db,
    `select id, label, heading, sort_order as "sortOrder", status, body_map_keys as "bodyMapKeys", entry_label as "entryLabel", node_for_body_map_key as "nodeForBodyMapKey",
            external_group as "externalGroup", incidental_work as "incidentalWork", progress_subtitle as "progressSubtitle", measurement_metrics as "measurementMetrics",
            side_model as "sideModel", side_limb as "sideLimb", side_word as "sideWord", side_word_plural as "sideWordPlural", catalog_keys as "catalogKeys",
            region_only_tag_scope as "regionOnlyTagScope", external_heading as "externalHeading", measurement_defaults as "measurementDefaults", on_side_template as "onSideTemplate"
     from specialization.regions order by id`,
  );
/** A region record as its row holds it. */
const asRegionRow = (region: SpecializationRegion) => ({
  id: region.id, label: region.label, heading: region.heading, sortOrder: region.sortOrder, status: region.status, bodyMapKeys: region.bodyMapKeys, entryLabel: region.entryLabel,
  nodeForBodyMapKey: region.nodeForBodyMapKey ?? {}, externalGroup: region.wording.externalGroup, incidentalWork: region.wording.incidentalWork, progressSubtitle: region.wording.progressSubtitle,
  measurementMetrics: region.measurementMetrics, sideModel: region.sides.model, sideLimb: region.sides.model === "paired" ? region.sides.limb : null,
  sideWord: region.wording.sideWord ?? null, sideWordPlural: region.wording.sideWordPlural ?? null, catalogKeys: region.catalogKeys, regionOnlyTagScope: region.regionOnlyTagScope,
  externalHeading: region.wording.externalHeading, measurementDefaults: region.measurementDefaults, onSideTemplate: region.wording.onSideTemplate,
});
/**
 * A reference region's row until its promotion: schema v1's columns as seed v1 wrote the upper
 * arm's (its label and status, nothing of a page), schema v2's from its record.
 */
const asReferenceRow = (region: SpecializationRegion) => ({
  ...asRegionRow(region), heading: null, sortOrder: 0, bodyMapKeys: [], entryLabel: null, nodeForBodyMapKey: {}, externalGroup: null, incidentalWork: null, progressSubtitle: null, measurementMetrics: [],
});

/** One seeded drawing read back whole, in the content's own shape (DiagramAsset): its views in order with their words, every layer's paths and labels in draw order. */
async function readDrawing(key: string, version: number): Promise<DiagramAsset | null> {
  const [asset] = await rows<{ id: string; regionId: string; width: number; height: number; licenseNote: string; sides: DiagramAsset["sides"] | null }>(
    db,
    `select id, region_id as "regionId", view_box_width::float8 as width, view_box_height::float8 as height, license_note as "licenseNote", sides from specialization.diagram_assets where asset_key = $1 and version = $2`,
    [key, version],
  );
  if (!asset) return null;
  const viewOrder = await rows<{ id: string; label: string }>(db, "select view as id, label from specialization.diagram_views where asset_id = $1 order by sort_order", [asset.id]);
  const paths = await rows<{ view: string; layer: string; id: string; nodeId: string | null; kind: string; d: string }>(
    db,
    `select view, layer, path_id as id, node_id as "nodeId", kind, d from specialization.diagram_paths where asset_id = $1 order by view, layer, sort_order`,
    [asset.id],
  );
  const labels = await rows<{ view: string; layer: string; text: string; x: number; y: number; anchor: string }>(
    db,
    `select view, layer, label_text as text, x::float8 as x, y::float8 as y, anchor from specialization.diagram_labels where asset_id = $1 order by view, layer, sort_order`,
    [asset.id],
  );
  const views: Record<string, Record<string, { paths: unknown[]; labels: unknown[] }>> = {};
  const layerOf = (view: string, layer: string) => ((views[view] ??= {})[layer] ??= { paths: [], labels: [] });
  for (const { view, layer, ...path } of paths) layerOf(view, layer).paths.push(path);
  for (const { view, layer, ...label } of labels) layerOf(view, layer).labels.push(label);
  // A drawing that leaves its sides out is stored with none (null), which reads as one_side.
  return {
    key, version, regionId: asset.regionId, ...(asset.sides === null ? {} : { sides: asset.sides }), viewBox: { width: asset.width, height: asset.height }, viewOrder, views: views as DiagramAsset["views"],
    licenseNote: asset.licenseNote,
  };
}

/** A drawing compared as data: the same views in the same order, each layer's paths and labels in the same order (object key order aside). */
const sameDrawing = (drawing: DiagramAsset) => ({
  ...drawing,
  views: Object.fromEntries(Object.entries(drawing.views).map(([view, layers]) => [view, Object.fromEntries(Object.entries(layers ?? {}).map(([layer, drawn]) => [layer, { paths: drawn!.paths, labels: drawn!.labels }]))])),
});

/** A database replayed in production's order through `through`: a fresh one for a test that must start from that state. */
async function freshDb(through: Parameters<typeof replayMigrations>[1]) {
  const fresh = await createSupabaseLikeDb();
  await replayMigrations(fresh, through);
  return fresh;
}

describe("drift guard", () => {
  it("the committed seed is exactly what the emitter writes from the current content", () => {
    const committed = readMigration(SEED_MIGRATION_PATH);
    const emitted = emitSeedSql();
    if (committed !== emitted) {
      const a = committed.split("\n");
      const b = emitted.split("\n");
      const line = a.findIndex((text, index) => text !== b[index]);
      throw new Error(
        `supabase/migrations/${basename(SEED_MIGRATION_PATH)} is stale (first difference at line ${line + 1}). ` +
          "Run: npx tsx scripts/specialization/emit-seed.ts",
      );
    }
  });

  /**
   * The two files are renamed to the versions Supabase records after the production apply
   * (04-database.md §9). Every reference to them must follow, or the tests read a file that is
   * not there; this names any that did not.
   */
  it("names only migration files that exist, and the seed names schema v2 without its version", () => {
    const root = process.cwd();
    const inDir = (dir: string, keep: (name: string) => boolean) => readdirSync(resolve(root, dir)).filter(keep).map((name) => `${dir}/${name}`);
    const files = [
      ...inDir("docs/specialization-atlas", (name) => name.endsWith(".md")),
      "docs/infrastructure-v2/deployment.md",
      ...inDir("scripts/specialization", (name) => name.endsWith(".ts")),
      ...inDir("server/fixtures", (name) => name.startsWith("specialization")),
      ...inDir("server", (name) => /^specialization.*\.test\.ts$/.test(name)),
      ...inDir("supabase/migrations", (name) => name.includes("specialization_atlas")),
    ];
    const existing = new Set(readdirSync(resolve(root, "supabase/migrations")));
    const references = files.flatMap((file) => Array.from(readFileSync(resolve(root, file), "utf8").matchAll(/\b\d{14}_specialization_atlas_[a-z0-9_]+\.sql\b/g), (match) => ({ file, name: match[0] })));
    expect(references.filter((reference) => !existing.has(reference.name))).toEqual([]);
    // The scan reaches the places the tests and the generator read the files from.
    expect(Array.from(new Set(references.map((reference) => reference.file)))).toEqual(expect.arrayContaining(["server/fixtures/specializationPg.ts", "scripts/specialization/emit-seed.ts", "docs/specialization-atlas/04-database.md"]));
    // The tests and the generator read the same seed file, and the seed's text names no file by version, so the rename leaves what production ran unchanged.
    expect(SEED_MIGRATION_PATH).toBe(EMITTED_SEED_PATH);
    expect(basename(SCHEMA_MIGRATION_PATH)).toMatch(/^\d{14}_specialization_atlas_schema\.sql$/);
    expect(readMigration(SEED_MIGRATION_PATH)).toContain("-- Applies after schema v2 (…_specialization_atlas_schema_v2.sql), and can be applied again:");
    expect(readMigration(SEED_MIGRATION_PATH)).not.toMatch(/\d{14}_specialization_atlas_/);
  });

  it("says it is forward-only, and carries no rollback that would drop the schema", () => {
    const header = readMigration(SEED_MIGRATION_PATH).split("\n\n")[0];
    expect(header).toContain("-- Forward-only: a correction is a new key in the next seed (schema v2 has one undo, valid only before seed v3).");
    expect(readMigration(SEED_MIGRATION_PATH)).not.toMatch(/rollback|drop schema/i);
    // Seed v1 said otherwise, and stays as it was.
    expect(readMigration(SEED_V1_MIGRATION_PATH)).toContain("-- Rollback: the schema's (drop schema if exists specialization cascade).");
  });

  it("is deterministic and does not depend on the order regions are listed in", () => {
    expect(emitSeedSql()).toBe(emitSeedSql());
    const regions = [...registeredRegionContents, deltoidContent, fixtureArmContent];
    expect(emitSeedSql({ rules: [exposureRuleV1], regions })).toBe(emitSeedSql({ rules: [exposureRuleV1], regions: [...regions].reverse() }));
  });

  it("seeds every registered region, production and reference, and says what it holds", () => {
    expect(registeredRegionContents.map((content) => `${content.region.id} ${content.region.status}`)).toEqual(["upper_arm reference", "forearm production"]);
    const header = readMigration(SEED_MIGRATION_PATH).split("\n").slice(0, 8).join("\n");
    expect(header).toContain("Do not edit by hand");
    const catalogIds = new Set(allVariants.map((variant) => variant.catalogExerciseId));
    expect(header).toContain(
      `-- Regions: forearm (production), upper_arm (reference). Contents: ${allNodes.length} nodes, ${allActions.length} actions, ${allMembers.length} region members, ${allRegionActions.length} region actions, ` +
        `${allNodeActions.length} node actions, ${allClaims.length} claims, ${allSources.length} sources, ${catalogIds.size} catalog exercises, ${allVariants.length} variants, ` +
        `${dimensionIds.length} variant dimensions, ${allVariants.length} variant attributes, ${forearm.mappings.length} mappings`,
    );
    expect(header).toContain(`forearm_mappings_v1 (published): ${reviewedMappings.length} reviewed, ${draftMappings.length} draft (${draftMappings.map((mapping) => mapping.id).sort().join(", ")})`);
  });

  it("the public.muscles stub holds every canonical name the content refines, as production does", () => {
    const names = new Set<string>(stubMuscles.map((row) => row.canonical_name));
    const used = [...allNodes, ...deltoidContent.nodes, ...fixtureArmContent.nodes].map((node) => node.databaseMuscle).filter((name): name is string => name !== null);
    expect(used.filter((name) => !names.has(name))).toEqual([]);
  });
});

describe("SQL text", () => {
  it("quotes any text so the database reads it back unchanged, dollar signs included", async () => {
    for (const text of ["plain", "it's", "a$$b", "ends with $", "$", "$$", "$q$ and $q", "line\nbreak", "émigré · 90°"]) {
      const [row] = await rows<{ t: string }>(db, `select ${quote(text)} as t`);
      expect(row.t, JSON.stringify(text)).toBe(text);
    }
  });

  it("writes published rule versions only, never a draft", () => {
    const draft = { ...exposureRuleV1, id: "specialization_exposure_v2", publishedAt: null };
    const sql = emitSeedSql({ ...productionSeedInput(), rules: [exposureRuleV1, draft] });
    expect(sql).toBe(emitSeedSql());
    expect(sql).not.toContain("specialization_exposure_v2");
  });
});

// ---------------------------------------------------------------- what production holds stays as it is

describe("over what production holds: seed v1's rows stay as they were", () => {
  let before: Awaited<ReturnType<typeof createSupabaseLikeDb>>;
  beforeAll(async () => {
    before = await freshDb("schema v2 again");
  }, SETUP);
  afterAll(async () => {
    await before?.close();
  });

  it("pins every v1 node's and action's sort order as seed v1 wrote it, in the database and in the text the emitter writes", async () => {
    const written = async (table: string) => Object.fromEntries((await rows<{ id: string; sort_order: number }>(before, `select id, sort_order from specialization.${table} order by id`)).map((row) => [row.id, row.sort_order]));
    expect(await written("nodes")).toEqual(v1SortOrders.nodes);
    expect(await written("actions")).toEqual(v1SortOrders.actions);
    // And the current seed keeps them.
    expect(Object.fromEntries((await rows<{ id: string; sort_order: number }>(db, "select id, sort_order from specialization.nodes where id = any($1) order by id", [Object.keys(v1SortOrders.nodes)])).map((row) => [row.id, row.sort_order]))).toEqual(v1SortOrders.nodes);

    // The column is insert-only, so a database seeded by seed v1 never shows what the emitter writes: read it from the text.
    // Each row is one line, its sort order last; seed v1's text and the emitted one name the same value for every v1 row,
    // with the regions as registered and with a region placed before the forearm.
    const sortOrdersIn = (sql: string, title: string) => {
      const start = sql.indexOf(`\n-- ${title}`);
      expect(start, title).toBeGreaterThan(-1);
      const body = sql.slice(start, sql.indexOf("\non conflict", start));
      return Object.fromEntries(Array.from(body.matchAll(/^ {2}\(\$\$([^$]+)\$\$, .*, (\d+)\),?$/gm), (match) => [match[1], Number(match[2])]));
    };
    const seedV1 = readMigration(SEED_V1_MIGRATION_PATH);
    expect({ nodes: sortOrdersIn(seedV1, "Anatomy nodes"), actions: sortOrdersIn(seedV1, "Joint actions") }).toEqual(v1SortOrders);
    const pinned = (orders: Record<string, number>, table: keyof typeof v1SortOrders) => Object.fromEntries(Object.keys(v1SortOrders[table]).map((id) => [id, orders[id]]));
    const first: RegionContent = { ...deltoidContent, region: { ...deltoidContent.region, sortOrder: 2 } };
    for (const sql of [emitSeedSql(), emitSeedSql(withDeltoid(first))]) {
      const nodes = sortOrdersIn(sql, "Anatomy nodes");
      const actions = sortOrdersIn(sql, "Joint actions");
      expect(pinned(nodes, "nodes")).toEqual(v1SortOrders.nodes);
      expect(pinned(actions, "actions")).toEqual(v1SortOrders.actions);
    }
    // Every row was read.
    const emitted = emitSeedSql();
    expect(Object.keys(sortOrdersIn(emitted, "Anatomy nodes")).sort()).toEqual(allNodes.map((node) => node.id).sort());
    expect(Object.keys(sortOrdersIn(emitted, "Joint actions")).sort()).toEqual(allActions.map((action) => action.id).sort());
  });

  it("keeps every v1 claim key and node-action claim key byte for byte", async () => {
    const claimKeys = (target: typeof db) => rows<{ k: string }>(target, "select claim_key as k from specialization.claims").then((found) => sorted(found.map((row) => row.k)));
    const nodeActions = (target: typeof db) =>
      rows<{ k: string }>(target, "select na.node_id || ' ' || na.action_id || ' ' || na.role || ' ' || c.claim_key as k from specialization.node_actions na join specialization.claims c on c.id = na.claim_id").then((found) => sorted(found.map((row) => row.k)));
    const v1Keys = await claimKeys(before);
    expect(v1Keys).toHaveLength(60);
    expect(sorted(allClaims.map(claimKeyOf))).toEqual(v1Keys);
    expect(await claimKeys(db)).toEqual(expect.arrayContaining(v1Keys));
    const v1NodeActions = await nodeActions(before);
    expect(v1NodeActions).toHaveLength(38);
    expect(sorted(allNodeActions.map((row) => `${row.nodeId} ${row.actionId} ${row.role} ${row.claimKey}`))).toEqual(v1NodeActions);
    // The emitted text names the same keys in the same order as seed v1 did.
    const claimSection = (sql: string) => sql.slice(sql.indexOf("\n-- Claims (key: <region>:<claim id>)\n"), sql.indexOf("\n-- Claim sources\n"));
    const keysIn = (sql: string) => Array.from(claimSection(sql).matchAll(/^ {2}\(\$\$([^$]+)\$\$, \$\$/gm), (match) => match[1]);
    expect(keysIn(readMigration(SEED_MIGRATION_PATH))).toEqual(keysIn(readMigration(SEED_V1_MIGRATION_PATH)));
  });

  it("writes the 21 memberships and 20 region actions schema v2 backfilled exactly as it did, and adds the rest", async () => {
    const memberships = (target: typeof db) => rows(target, "select region_id, node_id, role, sort_order, caveats, listed from specialization.region_nodes order by region_id, sort_order, node_id");
    const backfilled = await memberships(before);
    expect(backfilled).toHaveLength(21);
    const content = allMembers;
    expect(content).toEqual(expect.arrayContaining(backfilled));
    expect(await memberships(db)).toEqual(content);
    // The rows the backfill had no published mapping for: the forearm's two groups and the anconeus, and the upper arm's own two.
    const key = (row: { region_id: string; node_id: string; role: string }) => `${row.region_id} ${row.node_id} ${row.role}`;
    const backfilledKeys = new Set(backfilled.map((row) => key(row as never)));
    expect(content.filter((row) => !backfilledKeys.has(key(row))).map(key)).toEqual([
      "forearm forearm.anterior group",
      "forearm forearm.posterior group",
      "forearm forearm.anconeus adjacent",
      "upper_arm upper_arm.biceps target",
      "upper_arm upper_arm.brachialis target",
    ]);
    // The forearm's actions: the backfilled 20 in v1's order, which the content keeps.
    const offered = (target: typeof db) => rows(target, "select region_id, action_id, sort_order, listed from specialization.region_actions order by region_id, sort_order");
    expect((await offered(before)).length).toBe(20);
    expect(await offered(db)).toEqual(allRegionActions);
    expect(allRegionActions.filter((row) => row.region_id === "forearm")).toEqual(await offered(before));
  });

  /**
   * §5.2 "What a seed may change in existing rows, and nothing else", for seed v2 as production
   * ran it on 22 Oct 2026, over schema v1, seed v1 and schema v2: two rows, the upper arm's region
   * row in the columns schema v2 added (its v1 columns staying as seed v1 wrote them) and the
   * forearm's progress subtitle. Every other row it writes is new (rows of schema v2's tables, and
   * the upper arm's two shoulder actions), and applied a second time it touches no row. xmin and
   * ctid compared on every table.
   */
  it("seed v2 changes only the upper arm's new region columns and the forearm's progress subtitle, adds only new rows, and applied again touches nothing; forearm_mappings_v1 still passes its publication rule", async () => {
    const fresh = await freshDb("schema v2 again");
    try {
      const regionRows = async () => {
        const found = await rows<{ id: string; row: Record<string, unknown>; v: string }>(fresh, "select id, to_jsonb(r) as row, xmin::text || '@' || ctid::text as v from specialization.regions r order by id");
        return Object.fromEntries(found.map(({ id, ...rest }) => [id, rest]));
      };
      const prior = await rowVersions(fresh);
      const regionsBefore = await regionRows();
      await applyMigration(fresh, SEED_V2_MIGRATION_PATH);
      const after = await rowVersions(fresh);
      const allowedChanges: Record<string, number> = { regions: 2 };
      const changed = Object.fromEntries(Object.keys(prior).map((table) => [table, prior[table].filter((version) => !after[table].includes(version)).length]).filter(([, n]) => n));
      expect(changed).toEqual(allowedChanges);
      // Those rows are the forearm's, in exactly one column, its Progress subtitle, which no longer says "by arm" (both sides as one,
      // owner 20 Oct 2026), and the upper arm's: schema v1's columns exactly as seed v1 wrote them, schema v2's from its record.
      const regionsAfter = await regionRows();
      expect(regionsAfter.forearm.v).not.toBe(regionsBefore.forearm.v);
      expect(regionsBefore.forearm.row.progress_subtitle).toBe("Circumference and grip, by arm");
      expect(regionsAfter.forearm.row).toEqual({ ...regionsBefore.forearm.row, progress_subtitle: "Circumference and grip" });
      expect(regionsAfter.forearm.row.progress_subtitle).toBe(forearmContent.region.wording.progressSubtitle);
      // The upper arm's subtitle is a v1 column of a reference region: null, as seed v1 wrote it, until its promotion.
      expect(regionsAfter.upper_arm.row.progress_subtitle).toBeNull();
      const v2Columns = ["side_model", "side_limb", "side_word", "side_word_plural", "catalog_keys", "region_only_tag_scope", "external_heading", "measurement_defaults", "on_side_template"];
      const v1Part = (row: Record<string, unknown>) => Object.fromEntries(Object.entries(row).filter(([column]) => !v2Columns.includes(column)));
      expect(v1Part(regionsAfter.upper_arm.row)).toEqual(v1Part(regionsBefore.upper_arm.row));
      expect(v1Part(regionsAfter.upper_arm.row)).toMatchObject({ label: "Upper arm", heading: null, sort_order: 0, status: "reference", body_map_keys: [], entry_label: null, measurement_metrics: [] });
      const record = upperArmContent.region;
      expect(Object.fromEntries(v2Columns.map((column) => [column, regionsAfter.upper_arm.row[column]]))).toEqual({
        side_model: "paired", side_limb: "arm", side_word: record.wording.sideWord, side_word_plural: record.wording.sideWordPlural, catalog_keys: record.catalogKeys,
        region_only_tag_scope: record.regionOnlyTagScope, external_heading: record.wording.externalHeading, measurement_defaults: record.measurementDefaults, on_side_template: record.wording.onSideTemplate,
      });
      const added = Object.fromEntries(Object.keys(after).map((table) => [table, after[table].length - prior[table].length]).filter(([, n]) => n));
      expect(added).toEqual({
        actions: allActions.filter((action) => v1SortOrders.actions[action.id] === undefined).length,
        region_nodes: allMembers.length - 21,
        region_actions: allRegionActions.length - 20,
        variant_dimensions: dimensionIds.length,
        variant_dimension_values: Object.values({ ...countingDimensions, ...descriptiveDimensions }).reduce((n, dimension) => n + Object.keys(dimension.values).length, 0),
        variant_attributes: allVariants.length,
      });
      expect(added.actions).toBe(2);

      await applyMigration(fresh, SEED_V2_MIGRATION_PATH);
      expect(await rowVersions(fresh)).toEqual(after);
      expect(await rows(fresh, "select specialization.mapping_version_problems(id) as problems from specialization.mapping_versions where version_key = 'forearm_mappings_v1'")).toEqual([{ problems: null }]);
    } finally {
      await fresh.close();
    }
  }, SETUP);

  /**
   * §5.2 for the current seed: over every file production has recorded (schema v1, seed v1,
   * schema v2, seed v2), what it may change in existing rows. In this release, nothing: seed v3
   * carries seed v2's content, so it changes no existing row and adds none.
   */
  it("the current seed, over every applied file, changes no existing row and adds none; forearm_mappings_v1 still passes its publication rule", async () => {
    const fresh = await freshDb("seed v2");
    try {
      const prior = await rowVersions(fresh);
      await applyMigration(fresh, SEED_MIGRATION_PATH);
      expect(await rowVersions(fresh)).toEqual(prior);
      expect(await rows(fresh, "select specialization.mapping_version_problems(id) as problems from specialization.mapping_versions where version_key = 'forearm_mappings_v1'")).toEqual([{ problems: null }]);
    } finally {
      await fresh.close();
    }
  }, SETUP);
});

// ---------------------------------------------------------------- the seeded database

describe("the seeded database", () => {
  it("applying the seed again touches no row", async () => {
    const before = await rowVersions(db);
    await applyMigration(db, SEED_MIGRATION_PATH);
    expect(await rowVersions(db)).toEqual(before);
  });

  it("holds every node from its home region, and every action, source and node action, exactly as the content has them", async () => {
    const nodes = await rows(
      db,
      `select id, region_id as "regionId", parent_id as "parentId", kind, role, name, short_name as "shortName", aliases, layer, surface_visibility as "surfaceVisibility",
              status, catalog_muscle_key as "catalogMuscleKey", database_muscle as "databaseMuscle", border, location, what_it_does as "whatItDoes", shape_note as "shapeNote", caveats
       from specialization.nodes`,
    );
    expect([...nodes].sort(byId)).toEqual(allNodes.map(asNodeRow).sort(byId));
    // The two frozen upper-arm muscles keep the role seed v1 stored; their home role is target.
    expect(nodes.filter((node) => (node as { role: string }).role === "external").map((node) => (node as { id: string }).id).sort()).toEqual(["upper_arm.biceps", "upper_arm.brachialis"]);

    const actions = await rows(db, `select id, joint, label, plain_description as "plainDescription" from specialization.actions`);
    expect([...actions].sort(byId)).toEqual([...allActions].sort(byId));

    const sources = await rows(db, `select source_key as id, url, title, doi, evidence_type as "evidenceType", retrieved_on::text as "retrievedOn", notes from specialization.sources`);
    expect([...sources].sort(byId)).toEqual([...allSources].sort(byId));
    expect(sources.map((source) => (source as { id: string }).id)).not.toContain("S9");

    const nodeActions = await rows<{ nodeId: string; actionId: string; role: string; claimId: string; claimKey: string }>(
      db,
      `select na.node_id as "nodeId", na.action_id as "actionId", na.role, split_part(c.claim_key, ':', 2) as "claimId", c.claim_key as "claimKey"
       from specialization.node_actions na join specialization.claims c on c.id = na.claim_id`,
    );
    const key = (row: { nodeId: string; actionId: string }) => `${row.nodeId} ${row.actionId}`;
    expect([...nodeActions].sort((a, b) => (key(a) < key(b) ? -1 : 1))).toEqual([...allNodeActions].sort((a, b) => (key(a) < key(b) ? -1 : 1)));
  });

  it("gives a node or action added since seed v1 its region's sort × 1000 + its index there", async () => {
    expect(await rows(db, "select id, sort_order from specialization.actions where id like 'shoulder.%' order by id")).toEqual([
      { id: "shoulder.extension", sort_order: upperArmContent.region.sortOrder * 1000 + 4 },
      { id: "shoulder.flexion", sort_order: upperArmContent.region.sortOrder * 1000 + 3 },
    ]);
  });

  it("holds every claim, keyed by its owner wherever its record is kept, with its sources in order", async () => {
    const claims = await rows(
      db,
      `select split_part(c.claim_key, ':', 2) as id, split_part(c.claim_key, ':', 1) as "ownerRegionId", c.node_id as "nodeId", c.kind, c.statement, c.basis, c.review_status as "reviewStatus", c.reviewed_on::text as "reviewedAt", c.review_note as "reviewNote",
              coalesce((select json_agg(json_build_object('sourceId', s.source_key, 'locator', cs.locator, 'qualification', cs.qualification) order by cs.sort_order)
                        from specialization.claim_sources cs join specialization.sources s on s.id = cs.source_id where cs.claim_id = c.id), '[]') as sources
       from specialization.claims c where c.claim_key like 'forearm:%'`,
    );
    expect(claims).toHaveLength(60);
    const key = (claim: { ownerRegionId: string; id: string }) => `${claim.ownerRegionId}:${claim.id}`;
    expect([...claims].sort((a, b) => key(a as never).localeCompare(key(b as never)))).toEqual([...allClaims].sort((a, b) => claimKeyOf(a).localeCompare(claimKeyOf(b))));
    // The four on the biceps and brachialis are kept with the upper arm and stay the forearm's.
    expect(upperArmContent.claims.map(claimKeyOf)).toEqual(["forearm:biceps.function", "forearm:biceps.appearance", "forearm:brachialis.function", "forearm:brachialis.appearance"]);
  });

  it("holds every variant, and each catalog exercise once", async () => {
    const variants = await rows(
      db,
      `select v.variant_key as id, v.catalog_id as "catalogExerciseId", c.name as "catalogName", v.organization, v.forearm_orientation as "forearmOrientation", v.wrist_position as "wristPosition",
              v.grip_type as "gripType", v.straps, v.laterality, v.phase, v.measure, v.deliberate_hold as "deliberateHold", v.elbow_angle_deg::float8 as "elbowAngleDeg", v.notes
       from specialization.exercise_variants v join specialization.catalog_exercises c on c.catalog_id = v.catalog_id`,
    );
    expect(variants).toHaveLength(allVariants.length);
    // The counting attributes are variant attributes, held beside the frozen rows (below).
    expect([...variants].sort(byId)).toEqual(allVariants.map(({ sidedBy: _sidedBy, legLaterality: _legs, sideAnchor: _anchor, dimensions: _dimensions, replaces: _replaces, ...variant }) => variant).sort(byId));
    expect(await count(db, "select 1 from specialization.catalog_exercises")).toBe(new Set(allVariants.map((variant) => variant.catalogExerciseId)).size);
  });

  it("holds the variant dimensions with rule 11's exact ids and values, counting before descriptive", async () => {
    const dimensions = await rows<{ id: string; kind: string; values: string[] }>(
      db,
      `select d.id, d.kind, array(select v.value from specialization.variant_dimension_values v where v.dimension_id = d.id order by v.sort_order) as values
       from specialization.variant_dimensions d order by d.sort_order`,
    );
    expect(dimensions.slice(0, 3)).toEqual([
      { id: "sided_by", kind: "counting", values: ["arm", "leg", "none"] },
      { id: "leg_laterality", kind: "counting", values: ["bilateral", "unilateral", "either", "not_applicable"] },
      { id: "side_anchor", kind: "counting", values: ["working_leg", "front_leg", "stance_leg", "top_leg", "bottom_leg"] },
    ]);
    expect(dimensions.slice(3).map((dimension) => [dimension.id, dimension.kind])).toEqual(["knee", "hip", "torso", "bench", "plane", "grip_width", "stance", "range", "shoulder"].map((id) => [id, "descriptive"]));
    expect(dimensions.slice(3).map((dimension) => dimension.values)).toEqual(Object.values(descriptiveDimensions).map((dimension) => Object.keys(dimension.values)));
  });

  it("gives every variant its sided_by, written out, unfrozen: forearm_mappings_v1 was published before attributes existed", async () => {
    const attributes = await rows<{ variant_key: string; dimension_id: string; value: string; frozen: boolean }>(
      db,
      "select variant_key, dimension_id, value, frozen_at is not null as frozen from specialization.variant_attributes where variant_key like 'cat-%' and dimension_id = 'sided_by' order by variant_key, dimension_id",
    );
    expect(attributes).toHaveLength(119);
    expect(attributes).toEqual(allVariants.map((variant) => ({ variant_key: variant.id, dimension_id: "sided_by", value: variant.sidedBy, frozen: false })).sort((a, b) => a.variant_key.localeCompare(b.variant_key)));
    // Today's behaviour, written down: the arm wherever the arms are not bilateral, no side elsewhere.
    for (const variant of allVariants) expect(variant.sidedBy, variant.id).toBe(variant.laterality === "bilateral" ? "none" : "arm");
  });

  it("holds the published mapping version with all its rows, its drafts included, each with its sources in order and side relation 'same'", async () => {
    const [version] = await rows(
      db,
      `select version_key as key, state, to_char(published_at at time zone 'UTC', 'YYYY-MM-DD') as "publishedAt", method_notes as "methodNotes", region_id from specialization.mapping_versions where version_key = 'forearm_mappings_v1'`,
    );
    expect(version).toEqual({ ...forearmContent.mappingVersion, region_id: "forearm" });

    const mappings = await rows(
      db,
      `select m.mapping_key as id, v.version_key as "versionKey", m.variant_key as "variantId", m.node_id as "nodeId", m.action_id as "actionId", m.relationship,
              m.muscle_mode as "muscleMode", m.evidence_basis as "evidenceBasis", m.allocation, m.requires_no_straps as "requiresNoStraps", m.rationale, m.review_status as "reviewStatus",
              m.side_relation as "sideRelation",
              coalesce((select json_agg(json_build_object('sourceId', s.source_key, 'locator', ms.locator, 'limitation', ms.limitation) order by ms.sort_order)
                        from specialization.mapping_sources ms join specialization.sources s on s.id = ms.source_id where ms.mapping_id = m.id), '[]') as sources
       from specialization.variant_mappings m join specialization.mapping_versions v on v.id = m.version_id where v.version_key = 'forearm_mappings_v1'`,
    );
    expect(mappings).toHaveLength(forearm.mappings.length);
    expect([...mappings].sort(byId)).toEqual(forearmContent.mappings.map((mapping) => ({ ...mapping, sideRelation: sideRelationOf(mapping) })).sort(byId));
    const drafts = draftMappings.map((mapping) => mapping.id).sort();
    expect(drafts.length).toBeGreaterThan(0);
    expect((await rows<{ k: string }>(db, "select mapping_key as k from specialization.variant_mappings where review_status = 'draft'")).map((row) => row.k).sort()).toEqual(drafts);
    expect(forearmContent.mappings.every((mapping) => sideRelationOf(mapping) === "same")).toBe(true);
    expect(await rows(db, "select side_relation, count(*)::int as n from specialization.variant_mappings group by 1")).toEqual([{ side_relation: "same", n: forearm.mappings.length }]);
  });

  it("users read the reviewed rows; the drafts stay with the service role", async () => {
    expect(await as(db, { user: USER_B }, () => count(db, "select 1 from specialization.variant_mappings"))).toBe(reviewedMappings.length);
    expect(await as(db, { user: USER_B }, () => count(db, "select 1 from specialization.variant_mappings where review_status = 'draft'"))).toBe(0);
    expect(await as(db, "service_role", () => count(db, "select 1 from specialization.variant_mappings where review_status = 'draft'"))).toBe(draftMappings.length);
  });

  it("holds the published accounting rule as written", async () => {
    const [rule] = await rows(db, `select id, to_char(published_at at time zone 'UTC', 'YYYY-MM-DD') as "publishedAt", notes, specification from specialization.rule_versions where id = 'specialization_exposure_v1'`);
    expect(rule).toEqual(exposureRuleV1);
  });

  it("holds each region's row as its record has it, side sentence included; the upper arm's v1 columns as seed v1 wrote them, its v2 columns from its record", async () => {
    expect(await readRegions()).toEqual([asRegionRow(forearmContent.region), asReferenceRow(upperArmContent.region)]);
    expect(upperArmContent.region.status).toBe("reference");
    // The defaults have one shape on both sides: {metric: {landmark, posture}}, as schema v2 wrote the forearm's.
    expect(forearmContent.region.measurementDefaults).toEqual({
      circumference_cm: { landmark: "Thickest point", posture: "arm_relaxed_hanging" },
      grip_force_n: { landmark: "Dynamometer grip", posture: "elbow_90_supported" },
    });
    expect(forearmContent.region.wording.onSideTemplate).toBe("your {side} forearm");
  });

  it("lists each region's members and actions in its order, the role derived from each member's home", async () => {
    expect(await rows(db, "select region_id, node_id, role, sort_order, caveats, listed from specialization.region_nodes where region_id = 'upper_arm' order by sort_order")).toEqual(
      allMembers.filter((row) => row.region_id === "upper_arm"),
    );
    expect(await rows(db, "select region_id, role from specialization.region_nodes where node_id = 'upper_arm.biceps' order by 1")).toEqual([
      { region_id: "forearm", role: "external" },
      { region_id: "upper_arm", role: "target" },
    ]);
    expect(await rows(db, "select action_id from specialization.region_actions where region_id = 'upper_arm' order by sort_order")).toEqual(upperArmContent.actions.map((action) => ({ action_id: action.id })));
  });

  it("holds the forearm drawing whole: its views in the page's order with the words on their buttons, every path and label", async () => {
    const drawing = forearmContent.diagram!;
    expect(drawing.viewOrder).toEqual([{ id: "palm", label: "Palm" }, { id: "back", label: "Back" }, { id: "thumb", label: "Thumb side" }]);
    expect(await readDrawing(drawing.key, drawing.version)).toEqual(sameDrawing(drawing));
    // Its sides are left out on purpose (the published file stays byte for byte), so the row holds none: one side, mirrored.
    expect(drawing.sides).toBeUndefined();
    expect(await rows(db, "select sides from specialization.diagram_assets where asset_key = $1", [drawing.key])).toEqual([{ sides: null }]);
    // Users read the drawing, views included.
    expect(await as(db, { user: USER_B }, () => count(db, "select 1 from specialization.diagram_views"))).toBe(drawing.viewOrder.length);
  });

  it("links catalog exercises to public.exercises by catalog id, else by the name suffix, never by another repository's id", async () => {
    const linked = await rows<{ catalog_id: number; supabase_exercise_id: string | null }>(db, "select catalog_id, supabase_exercise_id from specialization.catalog_exercises where catalog_id in (139, 140, 141, 331, 401) order by 1");
    const stub = (name: string) => stubExercises.find((row) => row.canonical_name === name)!.id;
    expect(linked).toEqual([
      { catalog_id: 139, supabase_exercise_id: stub("wrist_curl__catalog_139") },
      { catalog_id: 140, supabase_exercise_id: stub("reverse_wrist_curl__catalog_140") },
      { catalog_id: 141, supabase_exercise_id: null },
      { catalog_id: 331, supabase_exercise_id: stub("low_cable_row") },
      { catalog_id: 401, supabase_exercise_id: null },
    ]);
  });
});

describe("changing content", () => {
  const f = forearmContent;
  /** The production content with one change, plus a harmless rename earlier in the same seed: the database's refusal, or null. */
  const reapplied = (...edited: RegionContent[]) =>
    seeded(withRegions(...edited.map((content) => (content.region.id === "forearm" ? { ...content, nodes: content.nodes.map((node) => (node.id === "forearm.fcu" ? { ...node, name: "Renamed in the same seed" } : node)) } : content))));
  /** One source changed in every region that lists it (a library record is one record). */
  const withSource = (id: string, change: (source: RegionContent["sources"][number]) => RegionContent["sources"][number]) =>
    registeredRegionContents.map((content) => ({ ...content, sources: content.sources.map((source) => (source.id === id ? change(source) : source)) }));

  it("refuses changed mappings under the published key, and applies nothing of that seed", async () => {
    const edited = {
      ...f,
      nodes: f.nodes.map((node) => (node.id === "forearm.fcu" ? { ...node, name: "Renamed in the same seed" } : node)),
      mappings: f.mappings.map((mapping) => (mapping.id === "cat-139:forearm.fcu" ? { ...mapping, rationale: "Edited after publication." } : mapping)),
    };
    expect(await seeded(withRegions(edited))).toMatch(/cat-139:forearm\.fcu belongs to published version forearm_mappings_v1; it cannot change/);
    expect(await rows(db, "select name from specialization.nodes where id = 'forearm.fcu'")).toEqual([{ name: "Flexor carpi ulnaris" }]);
  });

  it("refuses rewriting what the published version rests on, and applies nothing of that seed", async () => {
    const decides = /node forearm\.fdp is mapped by mapping version forearm_mappings_v1 \(published\); it must stay reviewed and cannot be deleted, and its region, role and catalog muscle key, which decide what its work counts toward, cannot change/;
    const fdp = f.nodes.find((node) => node.id === "forearm.fdp")!;
    const cases: [what: string, edited: RegionContent[], refusal: RegExp][] = [
      // cat-403 maps FDS and FDP as direct isometric work: the flag moves them between deliberate and incidental holds.
      ["a variant's deliberate hold", [{ ...f, variants: f.variants.map((v) => (v.id === "cat-403" ? { ...v, deliberateHold: !v.deliberateHold } : v)) }], /variant cat-403 is used by mapping version forearm_mappings_v1 \(published\); it cannot change/],
      ["a variant's straps", [{ ...f, variants: f.variants.map((v) => (v.id === "cat-139" ? { ...v, straps: "yes" as const } : v)) }], /variant cat-139 is used by mapping version forearm_mappings_v1 \(published\)/],
      ["a source's evidence type", withSource("S4", (s) => ({ ...s, evidenceType: "product_assumption" as const })), /source S4 is cited by mapping version forearm_mappings_v1 \(published\); its key, url, title and evidence type cannot change/],
      ["a source's title", withSource("A8", (s) => ({ ...s, title: `${s.title} (2nd edition)` })), /source A8 is cited by mapping version forearm_mappings_v1 \(published\)/],
      ["a claim's statement", [{ ...f, claims: f.claims.map((c) => (c.id === "fcu.function" ? { ...c, statement: `${c.statement} Edited.` } : c)) }], /claim forearm:fcu\.function is a reviewed claim on forearm\.fcu, which mapping version forearm_mappings_v1 \(published\) maps/],
      ["a claim's review", [{ ...f, claims: f.claims.map((c) => (c.id === "fcu.function" ? { ...c, reviewStatus: "draft" as const, reviewedAt: null } : c)) }], /claim forearm:fcu\.function is a reviewed claim/],
      ["a node action's role", [{ ...f, nodeActions: f.nodeActions.map((n) => (n.nodeId === "forearm.fcu" && n.actionId === "wrist.flexion" ? { ...n, role: "assist" as const } : n)) }], /node action forearm\.fcu wrist\.flexion is named by mapping version forearm_mappings_v1 \(published\)/],
      ["a mapped muscle's review", [{ ...f, nodes: f.nodes.map((n) => (n.id === "forearm.fcr" ? { ...n, status: "draft" as const } : n)) }], /node forearm\.fcr is mapped by mapping version forearm_mappings_v1 \(published\); it must stay reviewed/],
      // What decides counting on a mapped muscle (final review F-database-2): region and role decide whether its bouts are the forearm's, role and catalog key which tagged work is region work.
      ["a mapped muscle's role", [{ ...f, nodes: f.nodes.map((n) => (n.id === "forearm.fdp" ? { ...n, role: "adjacent" as const } : n)) }], decides],
      ["a mapped muscle's catalog muscle key", [{ ...f, nodes: f.nodes.map((n) => (n.id === "forearm.fdp" ? { ...n, catalogMuscleKey: null } : n)) }], decides],
      [
        "a mapped muscle's home",
        [
          { ...f, nodes: f.nodes.filter((n) => n.id !== "forearm.fdp") },
          { ...upperArmContent, nodes: [...upperArmContent.nodes, { ...fdp, regionId: "upper_arm" }], members: [...upperArmContent.members, { nodeId: fdp.id, sortOrder: 2 }] },
        ],
        decides,
      ],
      // The membership a published version of the region maps (schema v2): unlisted only by dropping it, which is refused.
      [
        "a mapped muscle's membership",
        [{ ...f, members: f.members.filter((member) => member.nodeId !== "upper_arm.brachialis") }],
        /node upper_arm\.brachialis is mapped in region forearm by mapping version forearm_mappings_v1 \(published\); its role there cannot change, it stays listed/,
      ],
      // The provenance label users read beside the claim.
      [
        "a claim's basis",
        [{ ...f, claims: f.claims.map((c) => (c.id === "fcu.function" ? { ...c, basis: c.basis === "product_assumption" ? ("anatomical_inference" as const) : ("product_assumption" as const) } : c)) }],
        /claim forearm:fcu\.function is a reviewed claim on forearm\.fcu, which mapping version forearm_mappings_v1 \(published\) maps; its key, node, kind, statement, basis and review status cannot change/,
      ],
    ];
    const before = await rowVersions(db);
    for (const [what, edited, refusal] of cases) expect(await reapplied(...edited), what).toMatch(refusal);
    expect(await rowVersions(db)).toEqual(before);
  });

  it("refuses removing a mapping, a mapping source, a node action, a claim or a claim source under the published version", async () => {
    expect(f.mappings.find((m) => m.id === "cat-121:upper_arm.biceps")!.sources.length).toBeGreaterThan(1);
    expect(f.claims.find((c) => c.id === "fcu.function")!.sources.length).toBeGreaterThan(0);
    // A reviewed claim of a mapped muscle that no node action rests on: removing it from the content is refused, not ignored.
    const selectivity = f.claims.find((c) => c.nodeId === "forearm.fcu" && c.kind === "selectivity" && c.reviewStatus === "reviewed")!;
    expect(allNodeActions.some((n) => n.claimKey === claimKeyOf(selectivity))).toBe(false);
    const cases: [what: string, edited: RegionContent[], refusal: RegExp][] = [
      ["a mapping", [{ ...f, mappings: f.mappings.filter((m) => m.id !== "cat-139:forearm.fcu") }], /mapping cat-139:forearm\.fcu belongs to published version forearm_mappings_v1; it cannot change/],
      ["a mapping source", [{ ...f, mappings: f.mappings.map((m) => (m.id === "cat-121:upper_arm.biceps" ? { ...m, sources: m.sources.slice(0, 1) } : m)) }], /the sources of mapping cat-121:upper_arm\.biceps in published version forearm_mappings_v1 cannot change/],
      ["a node action", [{ ...f, nodeActions: f.nodeActions.filter((n) => !(n.nodeId === "forearm.fcu" && n.actionId === "wrist.flexion")) }], /node action forearm\.fcu wrist\.flexion is named by mapping version forearm_mappings_v1 \(published\)/],
      ["a claim source", [{ ...f, claims: f.claims.map((c) => (c.id === "fcu.function" ? { ...c, sources: c.sources.slice(1) } : c)) }], /the sources of claim forearm:fcu\.function cannot change/],
      [
        "a claim",
        [{ ...f, claims: f.claims.filter((c) => c.id !== selectivity.id) }],
        new RegExp(`claim forearm:${selectivity.id.replace(/\./g, "\\.")} is a reviewed claim on forearm\\.fcu, which mapping version forearm_mappings_v1 \\(published\\) maps; .* it cannot be deleted`),
      ],
      // Kept with the upper arm, owned by the forearm: dropping the record is removing the forearm's claim.
      [
        "a claim kept with another region",
        [{ ...upperArmContent, claims: upperArmContent.claims.filter((c) => c.id !== "biceps.appearance") }],
        /claim forearm:biceps\.appearance is a reviewed claim on upper_arm\.biceps, which mapping version forearm_mappings_v1 \(published\) maps; .* it cannot be deleted/,
      ],
    ];
    const before = await rowVersions(db);
    for (const [what, edited, refusal] of cases) expect(await reapplied(...edited), what).toMatch(refusal);
    expect(await rowVersions(db)).toEqual(before);
  });

  it("moves a claim's record to another region's folder without touching its row", async () => {
    const claim = f.claims.find((c) => c.id === "fcu.appearance")!;
    const moved = [{ ...f, claims: f.claims.filter((c) => c !== claim) }, { ...upperArmContent, claims: [...upperArmContent.claims, claim] }];
    const before = await rowVersions(db);
    expect(await seeded(withRegions(...moved))).toBeNull();
    expect(await rowVersions(db)).toEqual(before);
  });

  it("seeds changed mappings published under a new key beside the old version: only the forearm's own muscles (rule 12), resting on the seeded sided_by (rule 11)", async () => {
    const v2 = "forearm_mappings_v2";
    const own = f.mappings.filter((mapping) => !mapping.nodeId.startsWith("upper_arm."));
    expect(f.mappings.length - own.length).toBe(53);
    const next: RegionContent = {
      ...f,
      mappingVersion: { ...f.mappingVersion!, key: v2 },
      mappings: own.map((mapping) => ({ ...mapping, versionKey: v2, reviewStatus: mapping.id === "cat-317:forearm.br" ? ("reviewed" as const) : mapping.reviewStatus })),
    };
    // With the biceps' and brachialis' rows, rule 12 refuses it, and nothing is written.
    const all: RegionContent = { ...next, mappings: f.mappings.map((mapping) => ({ ...mapping, versionKey: v2 })) };
    expect(await seeded(withRegions(all))).toMatch(/mapping version forearm_mappings_v2 cannot be published: mapped muscles whose home is another region: upper_arm\.biceps, upper_arm\.brachialis$/);
    expect(await count(db, "select 1 from specialization.mapping_versions where version_key = $1", [v2])).toBe(0);

    const sql = emitSeedSql(withRegions(next));
    expect(await scriptFailure(db, sql)).toBeNull();
    expect(await scriptFailure(db, sql)).toBeNull();
    const states = await rows(db, "select v.version_key, v.state, count(*) filter (where m.review_status = 'draft')::int as drafts from specialization.mapping_versions v join specialization.variant_mappings m on m.version_id = v.id where v.version_key like 'forearm_mappings_%' group by 1, 2 order by 1");
    expect(states).toEqual([
      { version_key: "forearm_mappings_v1", state: "published", drafts: 5 },
      { version_key: v2, state: "published", drafts: 4 },
    ]);
    // Publishing froze the counting attributes it rests on, and only its variants'.
    const mapped = new Set(own.map((mapping) => mapping.variantId));
    const frozen = await rows<{ variant_key: string }>(db, "select variant_key from specialization.variant_attributes where frozen_at is not null order by 1");
    expect(frozen.map((row) => row.variant_key)).toEqual([...mapped].sort());
    // The production content after it, which has no v2, leaves both versions and frozen_at alone.
    const before = await rowVersions(db);
    expect(await seeded(productionSeedInput())).toBeNull();
    expect(await rowVersions(db)).toEqual(before);
  });

  it("seeds a second region with no schema change: the deltoid fixture, its draft version and its diagram", async () => {
    expect(await seeded(withDeltoid())).toBeNull();
    const [state] = await rows(db, "select state from specialization.mapping_versions where version_key = 'deltoid_fixture_mappings_v1'");
    expect(state).toEqual({ state: "draft" });
    expect(await count(db, "select 1 from specialization.regions where id = 'upper_arm'")).toBe(1);
    expect(await count(db, "select 1 from specialization.actions where id = 'elbow.extension'")).toBe(1);
    expect(await count(db, "select 1 from specialization.claims where claim_key like 'deltoid:%'")).toBe(3);

    // The region with its own page words, sides and one measure, its home-region arm, their
    // members and actions, and its drawing from the front, the side and the rear with its own
    // button words: all rows, no new column or table.
    const regions = await readRegions();
    expect(regions.find((region) => (region as { id: string }).id === "deltoid")).toEqual(asRegionRow(deltoidContent.region));
    expect(regions.find((region) => (region as { id: string }).id === "fixture_arm")).toEqual(asRegionRow(fixtureArmContent.region));
    expect(await rows(db, "select node_id, role, sort_order from specialization.region_nodes where region_id = 'deltoid' order by sort_order")).toEqual([
      { node_id: deltoidIds.anterior, role: "target", sort_order: 0 },
      { node_id: deltoidIds.lateral, role: "target", sort_order: 1 },
      { node_id: deltoidIds.posterior, role: "target", sort_order: 2 },
      { node_id: deltoidIds.triceps, role: "external", sort_order: 3 },
    ]);
    // New nodes: their home's sort × 1000 + their place there.
    expect(await rows(db, "select id, sort_order from specialization.nodes where region_id in ('deltoid', 'fixture_arm') order by sort_order")).toEqual([
      { id: deltoidIds.anterior, sort_order: 90_000 },
      { id: deltoidIds.lateral, sort_order: 90_001 },
      { id: deltoidIds.posterior, sort_order: 90_002 },
      { id: deltoidIds.triceps, sort_order: 91_000 },
    ]);
    expect(await count(db, "select 1 from specialization.variant_attributes where variant_key like 'fx-%' and dimension_id = 'sided_by'")).toBe(deltoidContent.variants.length);
    const drawing = deltoidContent.diagram!;
    expect(drawing.viewOrder.map((view) => view.label)).toEqual(["Front", "Side", "Rear"]);
    expect(drawing.views.side!.surface!.paths.some((path) => path.nodeId === deltoidIds.lateral && path.kind === "belly")).toBe(true);
    expect(await readDrawing(drawing.key, drawing.version)).toEqual(sameDrawing(drawing));

    // A fixture region and its draft content stay out of users' sight.
    const seen = await as(db, { user: USER_B }, () =>
      rows<{ n: number }>(
        db,
        `select (select count(*)::int from specialization.regions where id in ('deltoid', 'fixture_arm')) + (select count(*)::int from specialization.nodes where region_id in ('deltoid', 'fixture_arm'))
                + (select count(*)::int from specialization.mapping_versions where version_key like 'deltoid%') + (select count(*)::int from specialization.region_nodes where region_id in ('deltoid', 'fixture_arm'))
                + (select count(*)::int from specialization.region_actions where region_id in ('deltoid', 'fixture_arm')) as n`,
      ),
    );
    expect(seen).toEqual([{ n: 0 }]);

    // Re-applying is a no-op, and a redrawn asset holds exactly the new drawing.
    const before = await rowVersions(db);
    expect(await seeded(withDeltoid())).toBeNull();
    expect(await rowVersions(db)).toEqual(before);
    // Redrawn: the rear view gone, the side view renamed and trimmed, drawn whole for both sides.
    const redrawn: RegionContent = {
      ...deltoidContent,
      diagram: {
        ...drawing,
        sides: "both_sides",
        viewOrder: [{ id: "front", label: "Front" }, { id: "side", label: "Outside" }],
        views: { front: drawing.views.front, side: { surface: { paths: drawing.views.side!.surface!.paths.slice(0, 3), labels: [{ text: "Back side", x: 4, y: 77, anchor: "start" as const }] } } },
      },
    };
    expect(await seeded(withDeltoid(redrawn))).toBeNull();
    expect(await readDrawing(drawing.key, drawing.version)).toEqual(sameDrawing(redrawn.diagram!));
    // Redrawn again: every view replaced by a new one in one seed, its paths keeping their ids.
    const moved: RegionContent = {
      ...deltoidContent,
      diagram: { ...drawing, viewOrder: [{ id: "top", label: "From above" }], views: { top: { surface: { paths: drawing.views.front!.surface!.paths, labels: [] } } } },
    };
    expect(await seeded(withDeltoid(moved))).toBeNull();
    expect(await readDrawing(drawing.key, drawing.version)).toEqual(sameDrawing(moved.diagram!));
    expect(await seeded(withDeltoid())).toBeNull();
    expect(await readDrawing(drawing.key, drawing.version)).toEqual(sameDrawing(drawing));
  });

  it("writes each mapping's side relation and every attribute a variant has, as the content has them; drops an unfrozen attribute the content drops, and refuses a frozen one by name", async () => {
    const d = deltoidContent;
    const [variant] = d.variants;
    // Values no forearm row has: every v1 mapping is 'same', the column's default, and every v1 variant has sided_by alone.
    const sided: RegionContent = {
      ...d,
      variants: d.variants.map((v) => (v.id === variant.id ? { ...v, legLaterality: "unilateral" as const, sideAnchor: "front_leg" as const, dimensions: { knee: "bent" as const, stance: "split" as const } } : v)),
      mappings: d.mappings.map((m) => (m.id === "dm-111-lateral" ? { ...m, sideRelation: "opposite" as const } : m.id === "dm-090-posterior" ? { ...m, sideRelation: "both" as const } : m)),
    };
    const relations = () =>
      rows<{ id: string; relation: string }>(db, "select m.mapping_key as id, m.side_relation as relation from specialization.variant_mappings m join specialization.mapping_versions v on v.id = m.version_id where v.version_key = $1", [d.mappingVersion!.key]).then((found) => found.sort(byId));
    const expected = (content: RegionContent) => content.mappings.map((m) => ({ id: m.id, relation: sideRelationOf(m) })).sort(byId);
    const attributesOf = (key: string) => rows(db, "select dimension_id, value, notes, frozen_at from specialization.variant_attributes where variant_key = $1 order by dimension_id", [key]);
    const unfrozen = (dimension_id: string, value: string) => ({ dimension_id, value, notes: null, frozen_at: null });

    expect(await seeded(withDeltoid(sided))).toBeNull();
    expect(sided.mappings.map(sideRelationOf)).toEqual(expect.arrayContaining(["same", "opposite", "both"]));
    expect(await relations()).toEqual(expected(sided));
    expect(await attributesOf(variant.id)).toEqual([
      unfrozen("knee", "bent"), unfrozen("leg_laterality", "unilateral"), unfrozen("side_anchor", "front_leg"), unfrozen("sided_by", variant.sidedBy!), unfrozen("stance", "split"),
    ]);
    const before = await rowVersions(db);
    expect(await seeded(withDeltoid(sided))).toBeNull();
    expect(await rowVersions(db)).toEqual(before);

    // The content as it was: the draft's relations back to 'same', and the attributes it no longer has gone (left in place, the
    // next publish of a version mapping the variant would freeze what the calculator and the logger no longer read).
    expect(await seeded(withDeltoid())).toBeNull();
    expect(await relations()).toEqual(expected(d));
    expect(await attributesOf(variant.id)).toEqual([unfrozen("sided_by", variant.sidedBy!)]);

    // A frozen attribute the content drops is refused by name, and nothing of that seed is applied. (Frozen here past its guard, as
    // a publish of a version mapping cat-139 would freeze it, in a transaction rolled back after: only a publish may set frozen_at.)
    const withGrip = registeredRegionContents.map((content) => ({ ...content, variants: content.variants.map((v) => (v.id === "cat-139" ? { ...v, dimensions: { grip_width: "shoulder" as const } } : v)) }));
    const kept = await rowVersions(db);
    await db.exec("begin");
    try {
      expect(await seeded(withRegions(...withGrip))).toBeNull();
      expect(await attributesOf("cat-139")).toEqual(expect.arrayContaining([unfrozen("grip_width", "shoulder")]));
      await db.exec(`
        alter table specialization.variant_attributes disable trigger variant_attributes_guard_frozen;
        update specialization.variant_attributes set frozen_at = now() where variant_key = 'cat-139' and dimension_id = 'grip_width';
        alter table specialization.variant_attributes enable trigger variant_attributes_guard_frozen;
        savepoint frozen;
      `);
      const frozen = await rowVersions(db);
      expect(await seeded(productionSeedInput())).toMatch(/attribute grip_width of variant cat-139 is frozen: a published mapping version rests on it, so it cannot change or be deleted/);
      await db.exec("rollback to savepoint frozen");
      expect(await rowVersions(db)).toEqual(frozen);
    } finally {
      await db.exec("rollback");
    }
    expect(await rowVersions(db)).toEqual(kept);
  });

  it("never rewrites a legacy sort order: a region placed first that lists an action and its own nodes later leaves their orders as they were", async () => {
    const order = () => rows(db, "select id, sort_order from specialization.actions where id in ('elbow.flexion', 'shoulder.flexion') union all select id, sort_order from specialization.nodes where region_id = 'deltoid' order by 1");
    const before = await order();
    // The deltoid fixture at sort 2: shoulder.flexion is its first action, 2000 < the upper arm's 8003, and its nodes would be 2000 on.
    const first: RegionContent = { ...deltoidContent, region: { ...deltoidContent.region, sortOrder: 2 } };
    const sql = emitSeedSql(withDeltoid(first));
    expect(sql).toContain("($$shoulder.flexion$$, $$Shoulder$$, $$Shoulder flexion$$, $$Raises the arm forward and up in front of the body.$$, 2000)");
    expect(await scriptFailure(db, sql)).toBeNull();
    expect(await order()).toEqual(before);
    expect(before).toContainEqual({ id: "elbow.flexion", sort_order: 0 });
    expect(await seeded(withDeltoid())).toBeNull();
  });

  it("unlists a member or action the content drops, never deleting it, with another user's goal on it; lists it again when it returns", async () => {
    const d = deltoidContent;
    expect(await seeded(withDeltoid())).toBeNull();
    // User B's goals on the posterior head and on horizontal abduction (written by the service role, as a goals sync would).
    await as(db, "service_role", async () => {
      await db.query(
        `insert into specialization.goals (user_id, id, region_id, node_id, action_id, side, metric, target, period, starts_on, timezone) values
           ($1, 'zz-seed-node-goal', 'deltoid', $2, null, 'left', 'direct_dynamic_bouts', 6, 'calendar_week', '2026-10-19', 'UTC'),
           ($1, 'zz-seed-action-goal', 'deltoid', null, 'shoulder.horizontal_abduction', 'left', 'direct_dynamic_bouts', 6, 'calendar_week', '2026-10-19', 'UTC')`,
        [USER_B, deltoidIds.posterior],
      );
    });
    // The posterior head leaves the content with everything that names it, and so does horizontal abduction.
    const dropped: RegionContent = {
      ...d,
      nodes: d.nodes.filter((node) => node.id !== deltoidIds.posterior),
      members: d.members.filter((member) => member.nodeId !== deltoidIds.posterior),
      actions: d.actions.filter((action) => action.id !== "shoulder.horizontal_abduction"),
      nodeActions: d.nodeActions.filter((row) => row.nodeId !== deltoidIds.posterior),
      claims: d.claims.filter((claim) => claim.nodeId !== deltoidIds.posterior),
      mappings: d.mappings.filter((mapping) => mapping.nodeId !== deltoidIds.posterior),
      variants: d.variants.filter((variant) => d.mappings.some((mapping) => mapping.nodeId !== deltoidIds.posterior && mapping.variantId === variant.id)),
      diagram: {
        ...d.diagram!,
        views: Object.fromEntries(Object.entries(d.diagram!.views).map(([view, layers]) => [view, { surface: { ...layers!.surface!, paths: layers!.surface!.paths.filter((path) => path.nodeId !== deltoidIds.posterior) } }])),
      },
    };
    expect(await seeded(withDeltoid(dropped))).toBeNull();
    const state = () =>
      rows(
        db,
        `select (select listed from specialization.region_nodes where region_id = 'deltoid' and node_id = $1) as member,
                (select listed from specialization.region_actions where region_id = 'deltoid' and action_id = 'shoulder.horizontal_abduction') as action,
                (select count(*)::int from specialization.nodes where id = $1) as node,
                (select count(*)::int from specialization.goals where id like 'zz-seed-%') as goals`,
        [deltoidIds.posterior],
      );
    expect(await state()).toEqual([{ member: false, action: false, node: 1, goals: 2 }]);
    // Applied again, nothing; then the full content lists both again.
    const before = await rowVersions(db);
    expect(await seeded(withDeltoid(dropped))).toBeNull();
    expect(await rowVersions(db)).toEqual(before);
    expect(await seeded(withDeltoid())).toBeNull();
    expect(await state()).toEqual([{ member: true, action: true, node: 1, goals: 2 }]);
    await db.exec("delete from specialization.goals where id like 'zz-seed-%'");
  });

  it("cleans a draft version and draft claims of what the content no longer has: mappings, mapping sources, node actions, claim sources", async () => {
    const d = deltoidContent;
    const held = async () =>
      (
        await rows<Record<string, number>>(
          db,
          `select (select count(*)::int from specialization.variant_mappings m join specialization.mapping_versions v on v.id = m.version_id where v.version_key = $1) as mappings,
                  (select count(*)::int from specialization.mapping_sources ms join specialization.variant_mappings m on m.id = ms.mapping_id join specialization.mapping_versions v on v.id = m.version_id where v.version_key = $1) as mapping_sources,
                  (select count(*)::int from specialization.node_actions na join specialization.claims c on c.id = na.claim_id where c.claim_key like 'deltoid:%') as node_actions,
                  (select count(*)::int from specialization.claim_sources cs join specialization.claims c on c.id = cs.claim_id where c.claim_key like 'deltoid:%') as claim_sources`,
          [d.mappingVersion!.key],
        )
      )[0];
    const full = { mappings: d.mappings.length, mapping_sources: d.mappings.reduce((n, m) => n + m.sources.length, 0), node_actions: d.nodeActions.length, claim_sources: d.claims.reduce((n, c) => n + c.sources.length, 0) };
    const v1 = "select m.mapping_key from specialization.variant_mappings m join specialization.mapping_versions v on v.id = m.version_id where v.version_key = 'forearm_mappings_v1' order by 1";
    const v1Before = await rows(db, v1);

    // A second source on one mapping, so one can be taken away while the mapping stays.
    const s2 = forearmContent.sources.find((source) => source.id === "S2")!;
    const fuller: RegionContent = {
      ...d,
      sources: [...d.sources, s2],
      mappings: d.mappings.map((m) => (m.id === "dm-111-lateral" ? { ...m, sources: [...m.sources, { sourceId: "S2", locator: "Test", limitation: null }] } : m)),
    };
    expect(await seeded(withDeltoid(fuller))).toBeNull();
    expect(await held()).toEqual({ ...full, mapping_sources: full.mapping_sources + 1 });

    const fewer: RegionContent = {
      ...d,
      mappings: d.mappings.filter((m) => m.id !== "dm-093-posterior"),
      nodeActions: d.nodeActions.filter((n) => n.nodeId !== deltoidIds.posterior),
      claims: d.claims.map((c) => (c.nodeId === deltoidIds.posterior ? { ...c, sources: [] } : c)),
    };
    expect(await seeded(withDeltoid(fewer))).toBeNull();
    // dm-093-posterior took its one source with it; dm-111-lateral lost S2.
    expect(await held()).toEqual({ mappings: full.mappings - 1, mapping_sources: full.mapping_sources - 1, node_actions: full.node_actions - 1, claim_sources: full.claim_sources - 1 });
    expect(await count(db, "select 1 from specialization.variant_mappings where mapping_key = 'dm-093-posterior'")).toBe(0);

    // The published forearm version is untouched, and the full content puts every row back.
    expect(await rows(db, v1)).toEqual(v1Before);
    expect(await seeded(withDeltoid())).toBeNull();
    expect(await held()).toEqual(full);
  });
});

describe("a draft region's claims are the content's", () => {
  const claimsHeld = async () =>
    rows<{ key: string; kind: string; node_actions: string[]; sources: number }>(
      db,
      `select c.claim_key as key, c.kind,
              coalesce((select array_agg(na.node_id || ' ' || na.action_id order by na.node_id, na.action_id) from specialization.node_actions na where na.claim_id = c.id), '{}') as node_actions,
              (select count(*)::int from specialization.claim_sources cs where cs.claim_id = c.id) as sources
       from specialization.claims c where c.claim_key like 'deltoid:%' order by 1`,
    );
  const d = deltoidContent;
  const withoutPosteriorWork = { mappings: d.mappings.filter((m) => m.nodeId !== deltoidIds.posterior), nodeActions: d.nodeActions.filter((n) => n.nodeId !== deltoidIds.posterior) };

  it("deletes a claim the content no longer has, with its node action and sources, and puts it back", async () => {
    expect(await seeded(withDeltoid())).toBeNull();
    const full = await claimsHeld();
    expect(full.map((claim) => claim.key)).toEqual(d.claims.map((claim) => `deltoid:${claim.id}`).sort());
    const removed: RegionContent = { ...d, ...withoutPosteriorWork, claims: d.claims.filter((c) => c.nodeId !== deltoidIds.posterior) };
    expect(await seeded(withDeltoid(removed))).toBeNull();
    expect(await claimsHeld()).toEqual(full.filter((claim) => claim.key !== "deltoid:deltoid.posterior.function"));
    expect(await count(db, "select 1 from specialization.node_actions where node_id = $1", [deltoidIds.posterior])).toBe(0);
    expect(await seeded(withDeltoid())).toBeNull();
    expect(await claimsHeld()).toEqual(full);
  });

  it("lets a draft claim change kind in the same seed that takes its node action away, and moves a node action to another claim", async () => {
    const full = await claimsHeld();
    const recast: RegionContent = {
      ...d,
      ...withoutPosteriorWork,
      claims: d.claims.map((c) => (c.nodeId === deltoidIds.posterior ? { ...c, kind: "appearance" as const } : c)),
    };
    expect(await seeded(withDeltoid(recast))).toBeNull();
    expect((await claimsHeld()).find((claim) => claim.key === "deltoid:deltoid.posterior.function")).toEqual({ key: "deltoid:deltoid.posterior.function", kind: "appearance", node_actions: [], sources: 1 });

    // The lateral head's node action rests on a second function claim; the first becomes an appearance claim.
    const second = { ...d.claims.find((c) => c.nodeId === deltoidIds.lateral)!, id: "deltoid.lateral.function.2" };
    const moved: RegionContent = {
      ...d,
      claims: [...d.claims.map((c) => (c.nodeId === deltoidIds.lateral ? { ...c, kind: "appearance" as const } : c)), second],
      nodeActions: d.nodeActions.map((n) => (n.nodeId === deltoidIds.lateral ? { ...n, claimId: second.id, claimKey: claimKeyOf(second) } : n)),
    };
    expect(await seeded(withDeltoid(moved))).toBeNull();
    const held = await claimsHeld();
    expect(held.find((claim) => claim.key === "deltoid:deltoid.lateral.function")).toMatchObject({ kind: "appearance", node_actions: [] });
    expect(held.find((claim) => claim.key === "deltoid:deltoid.lateral.function.2")).toMatchObject({ kind: "function", node_actions: [`${deltoidIds.lateral} shoulder.abduction`] });

    expect(await seeded(withDeltoid())).toBeNull();
    expect(await claimsHeld()).toEqual(full);
  });

  it("leaves claims whose owner is not in the seed alone", async () => {
    // The deltoid claims stay when the seed holds only the registered regions.
    const before = await claimsHeld();
    expect(before.length).toBe(d.claims.length);
    expect(await seeded(productionSeedInput())).toBeNull();
    expect(await claimsHeld()).toEqual(before);
  });
});

describe("a new reviewed claim on a muscle the published version maps", () => {
  it("goes in as a draft, gets its sources, then its review; applied again it touches nothing, and from then on it is frozen", async () => {
    const fresh = await freshDb("current seed");
    try {
      const fcu = forearmContent.claims.find((claim) => claim.id === "fcu.function")!;
      const added = { ...fcu, id: "fcu.variation", kind: "variation" as const, statement: "Test: a reviewed claim added after publication." };
      const next: RegionContent = { ...forearmContent, claims: [...forearmContent.claims, added] };
      const sql = emitSeedSql(withRegions(next));
      expect(await scriptFailure(fresh, sql)).toBeNull();
      expect(await rows(fresh, "select c.review_status, c.reviewed_on::text, (select count(*)::int from specialization.claim_sources cs where cs.claim_id = c.id) as sources from specialization.claims c where c.claim_key = 'forearm:fcu.variation'")).toEqual([
        { review_status: "reviewed", reviewed_on: fcu.reviewedAt, sources: fcu.sources.length },
      ]);
      const before = await rowVersions(fresh);
      expect(await scriptFailure(fresh, sql)).toBeNull();
      expect(await rowVersions(fresh)).toEqual(before);
      // Reviewed on a mapped muscle: its sources are frozen with the version it rests beside.
      const fewer: RegionContent = { ...forearmContent, claims: [...forearmContent.claims, { ...added, sources: added.sources.slice(0, 0) }] };
      expect(await scriptFailure(fresh, emitSeedSql(withRegions(fewer)))).toMatch(/the sources of claim forearm:fcu\.variation cannot change/);
    } finally {
      await fresh.close();
    }
  }, SETUP);
});

describe("diagram views and layers are the drawing's own", () => {
  it("seeds a drawing seen from the front, side and rear, on a layer of its own name, with no schema change", async () => {
    const drawing = deltoidContent.diagram!;
    // The fixture's own views, moved to a layer the forearm never uses.
    const views = Object.fromEntries(drawing.viewOrder.map(({ id }) => [id, { superficial: drawing.views[id]!.surface! }]));
    const redrawn: RegionContent = { ...deltoidContent, diagram: { ...drawing, version: 2, views: views as unknown as typeof drawing.views } };
    expect(await seeded(withDeltoid(redrawn))).toBeNull();
    const asset = "join specialization.diagram_assets a on a.id = x.asset_id where a.asset_key = $1 and a.version = 2 group by 1, 2 order by 1, 2";
    const per = (table: string) => rows(db, `select x.view, x.layer, count(*)::int as n from specialization.${table} x ${asset}`, [drawing.key]);
    expect(await per("diagram_paths")).toEqual(["front", "rear", "side"].map((view) => ({ view, layer: "superficial", n: drawing.views[view]!.surface!.paths.length })));
    expect(await per("diagram_labels")).toEqual(["front", "rear", "side"].map((view) => ({ view, layer: "superficial", n: drawing.views[view]!.surface!.labels.length })));
    expect(await rows(db, "select x.view, x.label from specialization.diagram_views x join specialization.diagram_assets a on a.id = x.asset_id where a.asset_key = $1 and a.version = 2 order by x.sort_order", [drawing.key]))
      .toEqual([{ view: "front", label: "Front" }, { view: "side", label: "Side" }, { view: "rear", label: "Rear" }]);
  });
});

describe("the emitter refuses content it cannot seed faithfully", () => {
  const withDeltoidAs = (patch: Partial<RegionContent>) => emitSeedSql(withDeltoid({ ...deltoidContent, ...patch }));

  it("a view or layer id the schema would refuse", () => {
    const drawing = deltoidContent.diagram!;
    const withViews = (views: unknown) => withDeltoidAs({ diagram: { ...drawing, views: views as typeof drawing.views } });
    expect(() => withViews({ "Front view": drawing.views.front })).toThrow(/view id "Front view" must be lowercase letters/);
    expect(() => withViews({ front: { "Deep-1": drawing.views.front!.surface } })).toThrow(/layer id "Deep-1" in view front must be lowercase letters/);
  });

  it("a view order that is not exactly the views drawn, or a view without the words for its button", () => {
    const drawing = deltoidContent.diagram!;
    const withOrder = (viewOrder: unknown) => withDeltoidAs({ diagram: { ...drawing, viewOrder: viewOrder as typeof drawing.viewOrder } });
    const [front, side, rear] = drawing.viewOrder;
    expect(() => withOrder([front, side])).toThrow(/viewOrder lists front, side but the drawing has front, rear, side/);
    expect(() => withOrder([front, side, rear, { id: "top", label: "Top" }])).toThrow(/viewOrder lists front, rear, side, top but the drawing has front, rear, side/);
    expect(() => withOrder([front, side, rear, front])).toThrow(/Duplicate view in diagram deltoid-fixture front/);
    expect(() => withOrder([front, { ...side, label: " " }, rear])).toThrow(/view side needs the words for its button/);
    expect(() => withOrder([front, { ...side, id: "Side" }, rear])).toThrow(/view id "Side" in viewOrder must be lowercase letters/);
  });

  it("a region without its page words, offering a measure twice, or with a default for a measure it does not offer", () => {
    const region = deltoidContent.region;
    const withRegion = (patch: Partial<typeof region>) => withDeltoidAs({ region: { ...region, ...patch } });
    expect(() => withRegion({ wording: { ...region.wording, incidentalWork: "  " } })).toThrow(/Region deltoid: wording\.incidentalWork must be text/);
    expect(() => withRegion({ wording: { ...region.wording, externalHeading: "" } })).toThrow(/Region deltoid: wording\.externalHeading must be text/);
    expect(() => withRegion({ wording: undefined as unknown as typeof region.wording })).toThrow(/Region deltoid has no wording/);
    const { progressSubtitle: _dropped, ...partial } = region.wording;
    expect(() => withRegion({ wording: partial as typeof region.wording })).toThrow(/Region deltoid: wording\.progressSubtitle must be text/);
    expect(() => withRegion({ measurementMetrics: ["circumference_cm", "circumference_cm"] })).toThrow(/Duplicate measurement metric in region deltoid circumference_cm/);
    expect(() => withRegion({ measurementDefaults: { girth_cm: { landmark: "Around the shoulders", posture: "standing_relaxed" } } })).toThrow(/Region deltoid: a default for girth_cm, which the region does not offer/);
  });

  it("a region without a complete side model, as the database would", () => {
    const region = deltoidContent.region;
    const withRegion = (patch: Partial<typeof region>) => withDeltoidAs({ region: { ...region, ...patch } });
    const { sideWord: _word, ...noWord } = region.wording;
    expect(() => withRegion({ wording: noWord })).toThrow(/Region deltoid: a paired region needs wording\.sideWord and wording\.sideWordPlural/);
    expect(() => withRegion({ sides: { model: "midline" } })).toThrow(/Region deltoid: a midline region has no side words/);
    expect(() => withRegion({ sides: undefined as unknown as typeof region.sides })).toThrow(/Region deltoid needs a side model/);
    // The sentence that names the region and a side: {side} once on a paired region, never on a midline one.
    const sentence = (onSideTemplate: string) => ({ ...region.wording, onSideTemplate });
    expect(() => withRegion({ wording: sentence("your shoulder") })).toThrow(/Region deltoid: a paired region's wording\.onSideTemplate names \{side\} once/);
    expect(() => withRegion({ wording: sentence("your {side} shoulder, {side}") })).toThrow(/names \{side\} once/);
    expect(() => withRegion({ wording: sentence(" ") })).toThrow(/Region deltoid: wording\.onSideTemplate must be text/);
    const { sideWord: _one, sideWordPlural: _both, ...midlineWords } = region.wording;
    expect(() => withRegion({ sides: { model: "midline" }, wording: { ...midlineWords, onSideTemplate: "your {side} trunk" } })).toThrow(/Region deltoid: a midline region's wording\.onSideTemplate names no side/);
    expect(() => withRegion({ sides: { model: "midline" }, wording: { ...midlineWords, onSideTemplate: "your trunk" } })).not.toThrow();
  });

  it("a reference region's record, though its row keeps no page: its side model and sentence are written", () => {
    const reference = upperArmContent.region;
    const withReference = (patch: Partial<typeof reference>) => emitSeedSql(withRegions({ ...upperArmContent, region: { ...reference, ...patch } }));
    expect(() => withReference({ wording: { ...reference.wording, onSideTemplate: "your upper arm" } })).toThrow(/Region upper_arm: a paired region's wording\.onSideTemplate names \{side\} once/);
    expect(() => withReference({ wording: { ...reference.wording, externalHeading: "" } })).toThrow(/Region upper_arm: wording\.externalHeading must be text/);
    // Its page words are not written before its promotion, so they are not asked for.
    expect(() => withReference({ wording: { ...reference.wording, incidentalWork: "" } })).not.toThrow();
  });

  it("a variant without its sided_by, or an attribute outside the dimension vocabulary", () => {
    const [first, ...rest] = deltoidContent.variants;
    const { sidedBy: _sidedBy, ...unsided } = first;
    expect(() => withDeltoidAs({ variants: [unsided as typeof first, ...rest] })).toThrow(/Variant fx-111 has no sidedBy/);
    expect(() => withDeltoidAs({ variants: [{ ...first, sideAnchor: "left_leg" as never }, ...rest] })).toThrow(/Variant fx-111: side_anchor left_leg is not in the dimension vocabulary/);
    expect(() => withDeltoidAs({ variants: [{ ...first, dimensions: { knee: "locked" as never } }, ...rest] })).toThrow(/Variant fx-111: knee locked is not in the dimension vocabulary/);
  });

  it("a shared key that means two different things", () => {
    const clash = { ...deltoidContent, sources: [...deltoidContent.sources, { ...forearmContent.sources.find((source) => source.id === "S2")!, title: "Another paper" }] };
    expect(() => emitSeedSql(withDeltoid(clash))).toThrow(/Source S2 differs between deltoid and forearm/);
  });

  it("a mapping, claim or node action that points at nothing", () => {
    const f = forearmContent;
    const [first] = f.mappings;
    expect(() => emitSeedSql(withRegions({ ...f, mappings: [{ ...first, nodeId: "forearm.nowhere" }] }))).toThrow(/node forearm\.nowhere is not a node in this seed/);
    const row = f.nodeActions.find((n) => n.nodeId !== "forearm.fcu")!;
    expect(() => emitSeedSql(withRegions({ ...f, nodeActions: [{ ...row, claimId: "fcu.function", claimKey: "forearm:fcu.function" }] }))).toThrow(/is not a function claim of that node/);
    expect(() => emitSeedSql(withRegions({ ...f, nodeActions: [...f.nodeActions, f.nodeActions[0]] }))).toThrow(/Duplicate node action/);
  });

  it("a node kept with another region, a member whose home is not in the seed, a claim whose owner is not, and a parent cycle", () => {
    const f = forearmContent;
    const stray = f.nodes.map((node) => (node.id === "forearm.anconeus" ? { ...node, regionId: "torso" } : node));
    expect(() => emitSeedSql(withRegions({ ...f, nodes: stray }))).toThrow(/Region forearm keeps node forearm\.anconeus, whose home is torso/);
    expect(() => emitSeedSql({ ...productionSeedInput(), regions: [f] })).toThrow(/Region forearm lists upper_arm\.biceps, which is neither its own node nor one of the home regions passed in/);
    const orphan = { ...f.claims[0], id: "orphan.function", ownerRegionId: "torso" };
    expect(() => emitSeedSql(withRegions({ ...f, claims: [...f.claims, orphan] }))).toThrow(/Claim torso:orphan\.function: its owner torso is not a region in this seed/);
    expect(() => emitSeedSql(withRegions({ ...f, members: f.members.filter((member) => member.nodeId !== "forearm.anconeus") }))).toThrow(/Node forearm\.anconeus is not a member of its home region forearm/);
    const loop = f.nodes.map((node) => (node.id === "forearm.anterior" ? { ...node, parentId: "forearm.fcr" } : node));
    expect(() => emitSeedSql(withRegions({ ...f, nodes: loop }))).toThrow(/cycle/);
  });
});
