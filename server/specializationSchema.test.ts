import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SpecializationGoal } from "@shared/specialization/types";
import { forearmRegionData } from "@shared/specialization/regions/forearm";
import { registeredRegionContents } from "@shared/specialization/registry";
import { emitSeedSql, productionSeedInput } from "../scripts/specialization/emit-seed";
import {
  MIGRATION_STEPS,
  SCHEMA_MIGRATION_PATH,
  SCHEMA_V2_MIGRATION_PATH,
  SEED_MIGRATION_PATH,
  SEED_V1_MIGRATION_PATH,
  SEED_V2_MIGRATION_PATH,
  USER_A,
  USER_B,
  applyMigration,
  applyMigrationAsDoBlock,
  as,
  asDoBlock,
  count,
  createReleaseDb,
  createSupabaseLikeDb,
  failure,
  readMigration,
  rows,
  scriptFailure,
  snapshot,
} from "./fixtures/specializationPg";

/**
 * Schema `specialization` in real Postgres (PGlite, Postgres 17): the migrations replayed in
 * production's order (each schema file twice, schema v2 included, the current seed last),
 * then every grant, policy, constraint and trigger exercised as the caller it is meant for —
 * anon, two signed-in users, the service role — switching identity the way the API does (JWT
 * subject, then SET ROLE). The design is docs/specialization-atlas/04-database.md; what
 * schema v2 adds is tested on its own in server/specializationSchemaV2.test.ts.
 */

const SETUP = 120_000;

const REFERENCE_TABLES = [
  "regions", "actions", "nodes", "sources", "claims", "claim_sources", "node_actions",
  "diagram_assets", "diagram_views", "diagram_paths", "diagram_labels", "catalog_exercises", "exercise_variants",
  "mapping_versions", "variant_mappings", "mapping_sources", "rule_versions",
  // Schema v2.
  "region_nodes", "region_actions", "variant_dimensions", "variant_dimension_values", "variant_attributes",
];
const PERSONAL_TABLES = ["goals", "measurements"];
const ALL_TABLES = [...REFERENCE_TABLES, ...PERSONAL_TABLES];

/** A text column per reference table, for an UPDATE that would change nothing. */
const UPDATABLE: Record<string, string> = {
  regions: "label", actions: "label", nodes: "name", sources: "title", claims: "statement", claim_sources: "locator",
  node_actions: "role", diagram_assets: "license_note", diagram_views: "label", diagram_paths: "d", diagram_labels: "label_text",
  catalog_exercises: "name", exercise_variants: "notes", mapping_versions: "method_notes", variant_mappings: "rationale",
  mapping_sources: "locator", rule_versions: "notes",
  region_nodes: "role", region_actions: "region_id", variant_dimensions: "label", variant_dimension_values: "label", variant_attributes: "notes",
};

const userA = { user: USER_A };
const userB = { user: USER_B };

// Counts from the content itself, so a content change only needs the seed regenerated.
/** Every published version's rows: forearm_mappings_v1 and, from wave A, upper_arm_mappings_v1. */
const publishedMappings = registeredRegionContents.flatMap((content) => (content.mappingVersion?.state === "published" ? content.mappings : []));
const reviewedMappingCount = publishedMappings.filter((mapping) => mapping.reviewStatus === "reviewed").length;
const draftMappingCount = forearmRegionData.mappings.filter((mapping) => mapping.reviewStatus === "draft").length;
/** Records the seed writes once each, however many regions list them. */
const distinctIn = (ids: (number | string)[]) => new Set(ids).size;
const sourceCount = distinctIn(registeredRegionContents.flatMap((content) => content.sources.map((source) => source.id)));
const actionCount = distinctIn(registeredRegionContents.flatMap((content) => content.actions.map((action) => action.id)));
const variantCount = distinctIn(registeredRegionContents.flatMap((content) => content.variants.map((variant) => variant.id)));
const catalogCount = distinctIn(registeredRegionContents.flatMap((content) => content.variants.map((variant) => variant.catalogExerciseId)));

/** Tables holding what a published or retired mapping version rests on (refuse TRUNCATE while one exists). */
const FROZEN_TABLES = ["mapping_versions", "variant_mappings", "mapping_sources", "rule_versions", "exercise_variants", "nodes", "node_actions", "claims", "claim_sources", "sources", "region_nodes", "variant_attributes"];

/** What a production or fixture region needs since schema v2: a complete side model. */
const PAIRED_BY_ARM = { side_model: "paired", side_limb: "arm", side_word: "arm", side_word_plural: "arms", on_side_template: "your {side} arm" };

let db: Awaited<ReturnType<typeof createReleaseDb>>;

beforeAll(async () => {
  db = await createReleaseDb();
}, SETUP);

afterAll(async () => {
  await db?.close();
});

const affected = async (sql: string, params: unknown[] = []) => (await db.query(sql, params)).affectedRows ?? 0;

// ---------------------------------------------------------------- helpers for test rows

async function insertTestNode(id: string, parentId: string | null, status = "draft") {
  await db.query(
    `insert into specialization.nodes (id, region_id, parent_id, kind, role, name, short_name, layer, surface_visibility, status, location, what_it_does, shape_note)
     values ($1, 'forearm', $2, 'muscle', 'target', $1, 'T', 'surface', 'clear', $3, 'Test', 'Test', 'Test')`,
    [id, parentId, status],
  );
}

async function newDraftVersion(key: string): Promise<string> {
  const [row] = await rows<{ id: string }>(db, "insert into specialization.mapping_versions (version_key, region_id, method_notes) values ($1, 'forearm', 'Test version') returning id", [key]);
  return row.id;
}

async function addMapping(
  versionKey: string,
  mappingKey: string,
  spec: { variant: string; node: string; action: string | null; status?: string; sources?: { key: string; locator: string | null }[] },
) {
  const [row] = await rows<{ id: string }>(
    db,
    `insert into specialization.variant_mappings (version_id, mapping_key, variant_key, node_id, action_id, relationship, muscle_mode, evidence_basis, rationale, review_status)
     select v.id, $2, $3, $4, $5, 'direct', 'dynamic', 'anatomy', 'Test mapping.', $6 from specialization.mapping_versions v where v.version_key = $1
     returning id`,
    [versionKey, mappingKey, spec.variant, spec.node, spec.action, spec.status ?? "reviewed"],
  );
  for (const [index, source] of (spec.sources ?? []).entries()) {
    await db.query(
      "insert into specialization.mapping_sources (mapping_id, source_id, locator, sort_order) select $1, s.id, $2, $3 from specialization.sources s where s.source_key = $4",
      [row.id, source.locator, index, source.key],
    );
  }
}

const publish = (key: string) => failure(db, "update specialization.mapping_versions set state = 'published' where version_key = $1", [key]);

/**
 * Schema v2's rule 11: a version is published only when its variants carry the counting
 * attributes its region reads, sided_by for the forearm. The seed writes them for the content's
 * variants (the dimension and its values too); this writes them for a variant a test maps.
 */
async function giveSidedBy(...variants: string[]) {
  await db.exec(`
    insert into specialization.variant_dimensions (id, label, sort_order, kind) values ('sided_by', 'Side recorded for', 0, 'counting') on conflict (id) do nothing;
    insert into specialization.variant_dimension_values (dimension_id, value, label, sort_order) values ('sided_by', 'arm', 'Arm', 0), ('sided_by', 'leg', 'Leg', 1), ('sided_by', 'none', 'Neither', 2)
      on conflict (dimension_id, value) do nothing;
  `);
  for (const variant of variants) {
    await db.query(
      "insert into specialization.variant_attributes (variant_key, dimension_id, value) select variant_key, 'sided_by', case laterality when 'bilateral' then 'none' else 'arm' end from specialization.exercise_variants where variant_key = $1 on conflict do nothing",
      [variant],
    );
  }
}

/** Schema v2's rule 10: a version maps only muscles its region lists. The seed lists the content's; this lists a test muscle. */
const listInForearm = (nodeId: string) => db.query("insert into specialization.region_nodes (region_id, node_id, role) values ('forearm', $1, 'target') on conflict do nothing", [nodeId]);

// ---------------------------------------------------------------- structure and privileges

describe("structure", () => {
  it("creates every table with row-level security on (after applying the schema twice)", async () => {
    const tables = await rows<{ relname: string; rls: boolean }>(
      db,
      "select c.relname, c.relrowsecurity as rls from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'specialization' and c.relkind = 'r' order by 1",
    );
    expect(tables.map((table) => table.relname)).toEqual([...ALL_TABLES].sort());
    for (const table of tables) expect(table.rls, table.relname).toBe(true);
  });

  it("has no exposure ledger: no table can point at a bout that only exists on the device", async () => {
    expect(await count(db, "select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'specialization' and c.relname like '%ledger%'")).toBe(0);
  });

  it("has the brief's indexes", async () => {
    const names = (await rows<{ indexname: string }>(db, "select indexname from pg_indexes where schemaname = 'specialization'")).map((row) => row.indexname);
    for (const name of ["goals_user_dates", "measurements_user_date", "mapping_variant_version"]) expect(names).toContain(name);
  });

  it("defines no SECURITY DEFINER function, and every function pins an empty search_path", async () => {
    const fns = await rows<{ proname: string; prosecdef: boolean; proconfig: string[] | null }>(
      db,
      "select p.proname, p.prosecdef, p.proconfig from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'specialization'",
    );
    expect(fns.length).toBeGreaterThan(5);
    for (const fn of fns) {
      expect(fn.prosecdef, fn.proname).toBe(false);
      expect(fn.proconfig, fn.proname).toEqual(['search_path=""']);
    }
  });

  it("grants nothing to PUBLIC or anon; authenticated reads reference tables and writes only goals and measurements", async () => {
    const grants = await rows<{ table_name: string; grantee: string; privilege_type: string }>(
      db,
      `select c.relname as table_name, coalesce(r.rolname, 'PUBLIC') as grantee, a.privilege_type
       from pg_class c join pg_namespace n on n.oid = c.relnamespace
       cross join lateral aclexplode(c.relacl) a
       left join pg_roles r on r.oid = a.grantee
       where n.nspname = 'specialization' and c.relkind = 'r'`,
    );
    const of = (grantee: string, table: string) => grants.filter((g) => g.grantee === grantee && g.table_name === table).map((g) => g.privilege_type).sort();
    for (const table of ALL_TABLES) {
      expect(of("PUBLIC", table), `PUBLIC on ${table}`).toEqual([]);
      expect(of("anon", table), `anon on ${table}`).toEqual([]);
      expect(of("authenticated", table), `authenticated on ${table}`).toEqual(PERSONAL_TABLES.includes(table) ? ["DELETE", "INSERT", "SELECT", "UPDATE"] : ["SELECT"]);
      // Exactly these: TRUNCATE would bypass every row guard; TRIGGER and REFERENCES are not needed.
      expect(of("service_role", table), `service_role on ${table}`).toEqual(["DELETE", "INSERT", "SELECT", "UPDATE"]);
    }
    const [schema] = await rows<Record<string, boolean>>(
      db,
      `select has_schema_privilege('anon', 'specialization', 'USAGE') as anon,
              has_schema_privilege('authenticated', 'specialization', 'USAGE') as authenticated,
              has_schema_privilege('service_role', 'specialization', 'USAGE') as service_role,
              has_function_privilege('authenticated', 'specialization.mapping_version_problems(uuid)', 'EXECUTE') as auth_problems,
              has_function_privilege('anon', 'specialization.mapping_version_problems(uuid)', 'EXECUTE') as anon_problems,
              has_function_privilege('service_role', 'specialization.mapping_version_problems(uuid)', 'EXECUTE') as service_problems`,
    );
    expect(schema).toEqual({ anon: false, authenticated: true, service_role: true, auth_problems: false, anon_problems: false, service_problems: true });
  });
});

describe("function privileges", () => {
  /** Signature -> the roles among PUBLIC, anon and authenticated allowed to execute it. Nothing today. */
  const EXECUTE_ALLOWED: Readonly<Record<string, readonly string[]>> = {};

  /** Every EXECUTE that PUBLIC, anon or authenticated holds on a function in the schema. A NULL proacl is Postgres's default: EXECUTE for PUBLIC. */
  const clientExecute = () =>
    rows<{ fn: string; grantee: string }>(
      db,
      `select p.oid::regprocedure::text as fn, coalesce(r.rolname, 'PUBLIC') as grantee
       from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
       cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
       left join pg_roles r on r.oid = a.grantee
       where n.nspname = 'specialization' and a.privilege_type = 'EXECUTE' and (a.grantee = 0 or r.rolname in ('anon', 'authenticated'))
       order by 1, 2`,
    );
  const notAllowed = (found: { fn: string; grantee: string }[]) => found.filter(({ fn, grantee }) => !(EXECUTE_ALLOWED[fn] ?? []).includes(grantee));

  it("no function in the schema is executable by PUBLIC, anon or authenticated outside the allow-list", async () => {
    expect(notAllowed(await clientExecute())).toEqual([]);
    const reach = await rows<{ fn: string; anon: boolean; authenticated: boolean }>(
      db,
      `select p.oid::regprocedure::text as fn, has_function_privilege('anon', p.oid, 'EXECUTE') as anon, has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated
       from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'specialization'`,
    );
    expect(reach.length).toBeGreaterThan(10);
    for (const { fn, anon, authenticated } of reach) {
      expect(anon && !(EXECUTE_ALLOWED[fn] ?? []).includes("anon"), `anon can execute ${fn}`).toBe(false);
      expect(authenticated && !(EXECUTE_ALLOWED[fn] ?? []).includes("authenticated"), `authenticated can execute ${fn}`).toBe(false);
    }
  });

  it("catches a function added without its own revoke: Postgres gives PUBLIC execute, and no default privilege takes it away", async () => {
    const code = readMigration(SCHEMA_MIGRATION_PATH).split("\n").filter((line) => !/^\s*--/.test(line)).join("\n");
    expect(code).not.toMatch(/alter default privileges/i);
    expect(await count(db, "select 1 from pg_default_acl")).toBe(0);
    await db.exec("create function specialization.zz_later() returns integer language sql set search_path = '' as 'select 1'");
    try {
      expect(notAllowed(await clientExecute())).toEqual([{ fn: "specialization.zz_later()", grantee: "PUBLIC" }]);
      expect(await rows(db, "select has_function_privilege('authenticated', 'specialization.zz_later()', 'EXECUTE') as ok")).toEqual([{ ok: true }]);
    } finally {
      await db.exec("drop function specialization.zz_later()");
    }
  });
});

describe("CHECK vocabularies match shared/specialization/types.ts", () => {
  const typesSource = readFileSync(resolve(process.cwd(), "shared/specialization/types.ts"), "utf8");
  // A type's string literals, with those of any union it names (`SummarySide = BodySide | "midline"`).
  const literals = (text: string): string[] => {
    const named = [...text.matchAll(/\b([A-Z][A-Za-z]*)\b/g)].map((match) => match[1]).filter((name) => new RegExp(`export type ${name} =`).test(typesSource));
    return [...new Set([...[...text.matchAll(/"([^"]+)"/g)].map((match) => match[1]), ...named.flatMap((name) => union(name))])].sort();
  };
  const union = (name: string): string[] => {
    const match = new RegExp(`export type ${name} =([^;]+);`).exec(typesSource);
    if (!match) throw new Error(`No type ${name} in types.ts`);
    return literals(match[1]);
  };
  const property = (iface: string, prop: string) => {
    const body = new RegExp(`export interface ${iface} \\{([\\s\\S]*?)\\n\\}`).exec(typesSource)?.[1];
    const line = body && new RegExp(`\\n\\s*${prop}\\??: ([^;]+);`).exec(body)?.[1];
    if (!line) throw new Error(`No ${iface}.${prop} in types.ts`);
    return literals(line);
  };
  /** The side models a region record can name: `model` in each member of RegionSides. */
  const sideModels = () => [...(/export type RegionSides = (.+);$/m.exec(typesSource)?.[1] ?? "").matchAll(/model: "([^"]+)"/g)].map((match) => match[1]).sort();

  const expected: [table: string, column: string, values: () => string[]][] = [
    ["nodes", "kind", () => union("NodeKind")],
    ["nodes", "role", () => union("NodeRole")],
    ["nodes", "layer", () => union("AnatomicalLayer")],
    ["nodes", "surface_visibility", () => union("SurfaceVisibility")],
    ["nodes", "status", () => union("ReviewStatus")],
    ["nodes", "border", () => union("ForearmBorder")],
    ["claims", "kind", () => union("ClaimKind")],
    ["claims", "basis", () => union("ClaimBasis")],
    ["claims", "review_status", () => union("ReviewStatus")],
    ["sources", "evidence_type", () => union("EvidenceType")],
    ["node_actions", "role", () => property("NodeAction", "role")],
    ["exercise_variants", "organization", () => union("Organization")],
    ["exercise_variants", "forearm_orientation", () => union("ForearmOrientation")],
    ["exercise_variants", "wrist_position", () => union("WristPosition")],
    ["exercise_variants", "grip_type", () => union("GripType")],
    ["exercise_variants", "straps", () => union("StrapsUse")],
    ["exercise_variants", "laterality", () => union("Laterality")],
    ["exercise_variants", "phase", () => union("Phase")],
    ["exercise_variants", "measure", () => union("SetMeasure")],
    ["variant_mappings", "relationship", () => union("Relationship")],
    ["variant_mappings", "muscle_mode", () => union("MuscleMode")],
    ["variant_mappings", "evidence_basis", () => union("MappingEvidenceBasis")],
    ["variant_mappings", "allocation", () => property("VariantMapping", "allocation")],
    ["variant_mappings", "review_status", () => union("ReviewStatus")],
    ["mapping_versions", "state", () => property("MappingVersion", "state")],
    // Diagram view and layer ids are the drawing's own: a shape, not a list (tested below).
    ["diagram_paths", "kind", () => union("DiagramPathKind")],
    ["diagram_labels", "anchor", () => property("DiagramLabel", "anchor")],
    // Schema v2: one side drawn and mirrored, or both drawn (null reads as one side).
    ["diagram_assets", "sides", () => union("DiagramSides")],
    // A goal's or measurement's stored side (`StoredSide`): left or right in a paired region, midline in a midline region or for a girth.
    // Never `both`: that is a summary's side (`SummarySide`), counting both sides as one (owner, 20 Oct 2026); nothing stores it.
    ["goals", "side", () => union("StoredSide")],
    ["goals", "metric", () => union("GoalMetric")],
    ["goals", "period", () => union("GoalPeriod")],
    ["measurements", "side", () => union("StoredSide")],
    ["measurements", "metric", () => union("MeasurementMetric")],
    // `reference`: a region that only holds other regions' external members.
    ["regions", "status", () => union("RegionStatus")],
    // Schema v2.
    ["regions", "side_model", sideModels],
    ["regions", "side_limb", () => union("Limb")],
    ["regions", "region_only_tag_scope", () => union("RegionOnlyTagScope")],
    ["variant_mappings", "side_relation", () => union("SideRelation")],
    ["region_nodes", "role", () => union("NodeRole")],
  ];

  it.each(expected)("%s.%s", async (table, column, values) => {
    const defs = (await rows<{ def: string }>(
      db,
      `select pg_get_constraintdef(c.oid) as def from pg_constraint c join pg_class t on t.oid = c.conrelid join pg_namespace n on n.oid = t.relnamespace
       where n.nspname = 'specialization' and t.relname = $1 and c.contype = 'c'`,
      [table],
    )).map((row) => row.def);
    const pattern = new RegExp(`\\(${column} = ANY \\(ARRAY\\[([^\\]]+)\\]\\)\\)`);
    const def = defs.find((text) => pattern.test(text));
    expect(def, `${table}.${column} has a CHECK vocabulary`).toBeDefined();
    const inDb = [...pattern.exec(def!)![1].matchAll(/'([^']+)'::text/g)].map((match) => match[1]).sort();
    expect(inDb).toEqual(values());
  });

  it("diagram view and layer ids are the drawing's own: any lowercase id (front, side, rear), no fixed list", async () => {
    for (const [table, columns] of [["diagram_views", ["view"]], ["diagram_paths", ["view", "layer"]], ["diagram_labels", ["view", "layer"]]] as const) {
      const defs = (await rows<{ def: string }>(
        db,
        `select pg_get_constraintdef(c.oid) as def from pg_constraint c join pg_class t on t.oid = c.conrelid join pg_namespace n on n.oid = t.relnamespace
         where n.nspname = 'specialization' and t.relname = $1 and c.contype = 'c'`,
        [table],
      )).map((row) => row.def);
      for (const column of columns) {
        expect(defs.some((def) => def.includes(`(${column} ~ '^[a-z][a-z0-9_]*$'::text)`)), `${table}.${column}`).toBe(true);
        expect(defs.some((def) => new RegExp(`\\(${column} = ANY`).test(def)), `${table}.${column} has no fixed list`).toBe(false);
      }
    }
    await as(db, "service_role", async () => {
      const [asset] = await rows<{ id: string }>(db, "insert into specialization.diagram_assets (region_id, asset_key, version, view_box_width, view_box_height, license_note) values ('forearm', 'zz_views', 1, 10, 10, 'Test') returning id");
      const view = (id: string, label: string, order: number) =>
        failure(db, "insert into specialization.diagram_views (asset_id, view, label, sort_order) values ($1, $2, $3, $4)", [asset.id, id, label, order]);
      const path = (id: string, view: string, layer: string) =>
        failure(db, "insert into specialization.diagram_paths (asset_id, path_id, view, layer, kind, d, sort_order) values ($1, $2, $3, $4, 'outline', 'M0 0', 0)", [asset.id, id, view, layer]);
      const label = (view: string, layer: string, order: number) =>
        failure(db, "insert into specialization.diagram_labels (asset_id, view, layer, sort_order, label_text, x, y, anchor) values ($1, $2, $3, $4, 'Test', 1, 1, 'start')", [asset.id, view, layer, order]);
      // A view is declared with the words on its button before anything is drawn in it.
      expect(await path("undeclared", "front", "surface")).toMatch(/diagram_paths_view_declared/);
      expect(await label("front", "surface", 0)).toMatch(/diagram_labels_view_declared/);
      for (const [index, [id, words]] of [["front", "Front"], ["side", "Side"], ["rear", "Rear"], ["palm", "Palm"]].entries()) {
        expect(await view(id, words, index), id).toBeNull();
        expect(await path(`p${index}`, id, "superficial"), id).toBeNull();
        expect(await label(id, "deep_2", index), id).toBeNull();
      }
      expect(await view("front", "Front again", 9)).toMatch(/diagram_views_pkey/);
      expect(await view("top", " ", 9)).toMatch(/diagram_views_label_check/);
      for (const bad of ["Front", "front view", "", "2nd", "front-left"]) {
        expect(await view(bad, "Words", 90), JSON.stringify(bad)).toMatch(/diagram_views_view_check/);
        expect(await path(`bad-${bad}`, bad, "surface"), JSON.stringify(bad)).toMatch(/diagram_paths_view_check/);
        expect(await path(`bad-layer-${bad}`, "front", bad), JSON.stringify(bad)).toMatch(/diagram_paths_layer_check/);
        expect(await label(bad, "surface", 90), JSON.stringify(bad)).toMatch(/diagram_labels_view_check/);
      }
      // A view still drawn in cannot be taken away; the asset takes its views with it.
      expect(await failure(db, "delete from specialization.diagram_views where asset_id = $1 and view = 'side'", [asset.id])).toMatch(/diagram_paths_view_declared|diagram_labels_view_declared/);
      await db.query("delete from specialization.diagram_assets where id = $1", [asset.id]);
      expect(await count(db, "select 1 from specialization.diagram_views where asset_id = $1", [asset.id])).toBe(0);
    });
  });

  it("a region with a page carries its own words and the measures it offers; a reference region needs none", async () => {
    const defs = (await rows<{ def: string }>(
      db,
      `select pg_get_constraintdef(c.oid) as def from pg_constraint c join pg_class t on t.oid = c.conrelid join pg_namespace n on n.oid = t.relnamespace
       where n.nspname = 'specialization' and t.relname = 'regions' and c.contype = 'c'`,
    )).map((row) => row.def);
    // The measures a region may offer are the measurements table's own list, MeasurementMetric in types.ts.
    const offered = defs.map((def) => /\(measurement_metrics <@ ARRAY\[([^\]]+)\]\)/.exec(def)?.[1]).find(Boolean);
    expect(offered, "regions.measurement_metrics has a CHECK vocabulary").toBeDefined();
    expect([...offered!.matchAll(/'([^']+)'::text/g)].map((match) => match[1]).sort()).toEqual(union("MeasurementMetric"));

    await as(db, "service_role", async () => {
      const insert = (id: string, status: string, columns: Record<string, string | string[] | null>) => {
        const names = Object.keys(columns);
        return failure(db, `insert into specialization.regions (id, label, status, ${names.join(", ")}) values ($1, 'Test', $2, ${names.map((_, index) => `$${index + 3}`).join(", ")})`, [id, status, ...Object.values(columns)]);
      };
      const page = { heading: "Test specialization", entry_label: "Explore test coverage", external_group: "Other muscles credited here", incidental_work: "bracing", progress_subtitle: "Circumference", ...PAIRED_BY_ARM };
      expect(await insert("zz_page", "fixture", { ...page, measurement_metrics: ["circumference_cm"] })).toBeNull();
      for (const missing of ["external_group", "incidental_work", "progress_subtitle"]) {
        expect(await insert(`zz_no_${missing}`, "fixture", { ...page, [missing]: null }), missing).toMatch(/regions_page_copy/);
        expect(await insert(`zz_blank_${missing}`, "fixture", { ...page, [missing]: "  " }), missing).toMatch(new RegExp(`regions_${missing}_check`));
      }
      expect(await insert("zz_metric", "fixture", { ...page, measurement_metrics: ["skinfold_mm"] })).toMatch(/regions_measurement_metrics_check/);
      expect(await insert("zz_null_metric", "fixture", { ...page, measurement_metrics: [null as unknown as string] })).toMatch(/regions_measurement_metrics_check/);
      expect(await insert("zz_reference", "reference", { heading: null })).toBeNull();
      expect(await rows(db, "select measurement_metrics from specialization.regions where id = 'zz_reference'")).toEqual([{ measurement_metrics: [] }]);
      await db.exec("delete from specialization.regions where id in ('zz_page', 'zz_reference')");
    });
  });

  it("accepts every measurement posture and condition the app records, and nothing else", async () => {
    const protocol = (posture: string, condition: string) => JSON.stringify({ landmark: "Thickest point", distanceFromLandmarkCm: null, posture, condition, device: null, timeOfDay: null });
    const insert = (id: string, posture: string, condition: string) =>
      as(db, userA, () => failure(db, "insert into specialization.measurements (id, region_id, side, measured_at, metric, value, protocol) values ($1, 'forearm', 'left', now(), 'circumference_cm', 30, $2::jsonb)", [id, protocol(posture, condition)]));
    for (const posture of property("MeasurementProtocol", "posture")) expect(await insert(`vocab-${posture}`, posture, "unknown"), posture).toBeNull();
    for (const condition of property("MeasurementProtocol", "condition")) expect(await insert(`vocab-c-${condition}`, "other", condition), condition).toBeNull();
    expect(await insert("vocab-bad-posture", "sitting", "unknown")).toMatch(/measurements_protocol_shape/);
    expect(await insert("vocab-bad-condition", "other", "warm")).toMatch(/measurements_protocol_shape/);
  });
});

// ---------------------------------------------------------------- who can read and write what

describe("anon", () => {
  it("can read and write nothing in the schema", async () => {
    await as(db, "anon", async () => {
      for (const table of ALL_TABLES) {
        expect(await failure(db, `select 1 from specialization.${table} limit 1`), table).toMatch(/permission denied for schema specialization/);
        expect(await failure(db, `insert into specialization.${table} default values`), table).toMatch(/permission denied for schema specialization/);
      }
    });
  });
});

describe("reference content, as a signed-in user", () => {
  beforeAll(async () => {
    // Rows that must stay hidden, next to the seeded ones.
    await as(db, "service_role", async () => {
      await db.exec(`
        insert into specialization.regions (id, label, heading, status, entry_label, external_group, incidental_work, progress_subtitle, side_model, side_limb, side_word, side_word_plural, on_side_template)
          values ('zz_fixture', 'Fixture', 'Fixture', 'fixture', 'Fixture', 'Other muscles', 'bracing', 'Circumference', 'paired', 'arm', 'arm', 'arms', 'your {side} arm');
        insert into specialization.claims (claim_key, node_id, kind, statement, basis, review_status) values ('test:fcu.draft', 'forearm.fcu', 'selectivity', 'Draft claim.', 'unknown', 'draft');
        insert into specialization.claim_sources (claim_id, source_id, locator) select c.id, s.id, 'Test' from specialization.claims c, specialization.sources s where c.claim_key = 'test:fcu.draft' and s.source_key = 'S2';
        insert into specialization.rule_versions (id, specification, published_at, notes) values ('zz_rule_draft', '{}', null, 'Unpublished rule.');
      `);
      await insertTestNode("forearm.zz_hidden", "forearm.anterior", "draft");
      await db.exec(`
        insert into specialization.claims (claim_key, node_id, kind, statement, basis, review_status, reviewed_on) values ('test:zz_hidden.function', 'forearm.zz_hidden', 'function', 'Reviewed claim of a draft node.', 'established_anatomy', 'reviewed', '2026-10-16');
        insert into specialization.claim_sources (claim_id, source_id, locator) select c.id, s.id, 'Test' from specialization.claims c, specialization.sources s where c.claim_key = 'test:zz_hidden.function' and s.source_key = 'S2';
      `);
      await newDraftVersion("zz_unpublished");
      await addMapping("zz_unpublished", "zz:cat-139:forearm.fcu", { variant: "cat-139", node: "forearm.fcu", action: "wrist.flexion", sources: [{ key: "S4", locator: "Test" }] });
    });
  });

  it("sees production and reference regions, not fixtures", async () => {
    const ids = await as(db, userA, () => rows<{ id: string }>(db, "select id from specialization.regions order by id"));
    expect(ids.map((row) => row.id)).toEqual(["forearm", "upper_arm"]);
  });

  it("sees reviewed nodes and their reviewed claims, node actions and claim sources only", async () => {
    const owner = await rows<Record<string, number>>(
      db,
      `select (select count(*)::int from specialization.nodes where status = 'reviewed') as nodes,
              (select count(*)::int from specialization.claims c join specialization.nodes n on n.id = c.node_id where c.review_status = 'reviewed' and n.status = 'reviewed') as claims,
              (select count(*)::int from specialization.claim_sources cs join specialization.claims c on c.id = cs.claim_id join specialization.nodes n on n.id = c.node_id where c.review_status = 'reviewed' and n.status = 'reviewed') as claim_sources,
              (select count(*)::int from specialization.node_actions) as node_actions`,
    );
    const seen = await as(db, userA, () =>
      rows<Record<string, number>>(
        db,
        `select (select count(*)::int from specialization.nodes) as nodes, (select count(*)::int from specialization.claims) as claims,
                (select count(*)::int from specialization.claim_sources) as claim_sources, (select count(*)::int from specialization.node_actions) as node_actions`,
      ),
    );
    expect(seen).toEqual(owner);
    // Seed v3 (wave A): the forearm's 24 nodes, 60 claims and 38 node actions, and the upper arm's 5 more nodes (its triceps
    // group, three heads and the coracobrachialis), 19 claims and 6 node actions, every one reviewed.
    expect(owner[0]).toMatchObject({ nodes: 29, claims: 79, node_actions: 44 });
    const hidden = await as(db, userA, () => count(db, "select 1 from specialization.claims where claim_key like 'test:%' union all select 1 from specialization.nodes where id = 'forearm.zz_hidden'"));
    expect(hidden).toBe(0);
  });

  it("sees the published mapping versions' reviewed rows only: not their drafts, not an unpublished version", async () => {
    const versions = await as(db, userA, () => rows<{ version_key: string }>(db, "select version_key from specialization.mapping_versions order by 1"));
    expect(versions.map((row) => row.version_key)).toEqual(["forearm_mappings_v1", "upper_arm_mappings_v1"]);
    const seen = await as(db, userA, () => rows<{ review_status: string; n: number }>(db, "select review_status, count(*)::int as n from specialization.variant_mappings group by 1"));
    expect(seen).toEqual([{ review_status: "reviewed", n: reviewedMappingCount }]);
    const drafts = await count(db, "select 1 from specialization.variant_mappings m join specialization.mapping_versions v on v.id = m.version_id where v.version_key = 'forearm_mappings_v1' and m.review_status = 'draft'");
    expect(drafts).toBe(draftMappingCount);
    const visibleSources = await count(
      db,
      "select 1 from specialization.mapping_sources s join specialization.variant_mappings m on m.id = s.mapping_id join specialization.mapping_versions v on v.id = m.version_id where v.state = 'published' and m.review_status = 'reviewed'",
    );
    expect(await as(db, userA, () => count(db, "select 1 from specialization.mapping_sources"))).toBe(visibleSources);
  });

  it("sees published rule versions only, and every source, action, variant and catalog exercise", async () => {
    const seen = await as(db, userA, () =>
      rows<Record<string, unknown>>(
        db,
        `select (select array_agg(id order by id) from specialization.rule_versions) as rules,
                (select count(*)::int from specialization.sources) as sources, (select count(*)::int from specialization.actions) as actions,
                (select count(*)::int from specialization.exercise_variants) as variants, (select count(*)::int from specialization.catalog_exercises) as catalog`,
      ),
    );
    expect(seen[0]).toEqual({ rules: ["specialization_exposure_v1", "specialization_exposure_v2"], sources: sourceCount, actions: actionCount, variants: variantCount, catalog: catalogCount });
  });

  it("cannot insert, update, delete or truncate any reference table", async () => {
    await as(db, userA, async () => {
      for (const table of REFERENCE_TABLES) {
        const denied = new RegExp(`permission denied for table ${table}`);
        expect(await failure(db, `insert into specialization.${table} default values`), `insert ${table}`).toMatch(denied);
        expect(await failure(db, `update specialization.${table} set ${UPDATABLE[table]} = ${UPDATABLE[table]}`), `update ${table}`).toMatch(denied);
        expect(await failure(db, `delete from specialization.${table}`), `delete ${table}`).toMatch(denied);
        expect(await failure(db, `truncate specialization.${table}`), `truncate ${table}`).toMatch(denied);
      }
    });
  });

  it("cannot run the publication check (service role only)", async () => {
    const message = await as(db, userA, () => failure(db, "select specialization.mapping_version_problems(gen_random_uuid())"));
    expect(message).toMatch(/permission denied for function mapping_version_problems/);
  });
});

// ---------------------------------------------------------------- goals and measurements

const goalColumns = "id, region_id, node_id, action_id, side, metric, target, period, starts_on, ends_on, timezone, created_at, updated_at";
const goalValues = (goal: SpecializationGoal) => [
  goal.id, goal.regionId, goal.nodeId, goal.actionId, goal.side, goal.metric, goal.target, goal.period, goal.startsOn, goal.endsOn, goal.timezone, goal.createdAt, goal.updatedAt,
];
/** Reads a row back in the device's own shape (SpecializationGoal). */
const goalAsDevice = `select id, region_id as "regionId", node_id as "nodeId", action_id as "actionId", side, metric, target::float8 as target, period,
  starts_on::text as "startsOn", ends_on::text as "endsOn", timezone,
  to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "createdAt", to_char(updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "updatedAt"
  from specialization.goals`;

describe("goals: owner-only, and a straight copy of the device record", () => {
  /** A target as the page saves it since 20 Oct 2026: once, its side `right` a placeholder (both sides count as one). */
  const saved: SpecializationGoal = {
    id: "goal-rls-1",
    regionId: "forearm",
    nodeId: "forearm.fcu",
    actionId: null,
    side: "right",
    metric: "direct_dynamic_bouts",
    target: 20,
    period: "calendar_week",
    startsOn: "2026-10-12",
    endsOn: null,
    timezone: "Europe/London",
    createdAt: "2026-10-16T09:30:00.000Z",
    updatedAt: "2026-10-16T09:30:00.000Z",
  };
  /**
   * A target saved for the left arm before 20 Oct, on another measure of the same muscle, so another
   * target: it stays as it was stored. (The same target saved for the other arm is refused, as one
   * target: `goal rules` below.)
   */
  const earlier: SpecializationGoal = { ...saved, id: "goal-rls-2", side: "left", metric: "deliberate_hold_bouts", target: 4 };
  const insert = `insert into specialization.goals (${goalColumns}) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`;

  it("user A stores a target as the page saves it and one saved for the left arm before 20 Oct, as they are on the device, and reads them back unchanged", async () => {
    await as(db, userA, async () => {
      expect(await failure(db, insert, goalValues(saved))).toBeNull();
      expect(await failure(db, insert, goalValues(earlier))).toBeNull();
      const back = await rows(db, `${goalAsDevice} where id like 'goal-rls-%' order by id`);
      expect(back).toEqual([saved, earlier]);
    });
    expect(await count(db, "select 1 from specialization.goals where id like 'goal-rls-%' and user_id = $1", [USER_A])).toBe(2);
  });

  it("user B cannot read, change or delete A's goals, nor write one in A's name", async () => {
    await as(db, userB, async () => {
      expect(await count(db, "select 1 from specialization.goals where id like 'goal-rls-%'")).toBe(0);
      expect(await affected("update specialization.goals set target = 1 where id = 'goal-rls-1'")).toBe(0);
      expect(await affected("delete from specialization.goals where id = 'goal-rls-1'")).toBe(0);
      expect(await failure(db, `insert into specialization.goals (user_id, ${goalColumns}) values ($14, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`, [...goalValues({ ...saved, id: "goal-forged", nodeId: "forearm.ecu" }), USER_A])).toMatch(/row-level security/);
    });
    expect(await rows(db, "select target::float8 as target from specialization.goals where id = 'goal-rls-1'")).toEqual([{ target: 20 }]);
  });

  it("user A cannot hand a goal to B, but can change and delete their own", async () => {
    await as(db, userA, async () => {
      expect(await failure(db, "update specialization.goals set user_id = $1 where id = 'goal-rls-1'", [USER_B])).toMatch(/row-level security/);
      expect(await affected("update specialization.goals set target = 40 where id = 'goal-rls-1'")).toBe(1);
      const [touched] = await rows<{ updatedAt: string; target: number }>(db, `${goalAsDevice} where id = 'goal-rls-1'`);
      expect(touched.target).toBe(40);
      expect(touched.updatedAt).not.toBe(saved.updatedAt);
      // A sync that carries the device's own time keeps it.
      await db.query("update specialization.goals set target = 41, updated_at = '2026-10-17T08:00:00Z' where id = 'goal-rls-1'");
      expect((await rows<{ updatedAt: string }>(db, `${goalAsDevice} where id = 'goal-rls-1'`))[0].updatedAt).toBe("2026-10-17T08:00:00.000Z");
      expect(await affected("delete from specialization.goals where id = 'goal-rls-2'")).toBe(1);
    });
  });

  it("a signed-in role with no user id writes nothing", async () => {
    await as(db, { user: "" }, async () => {
      expect(await failure(db, insert, goalValues({ ...saved, id: "goal-nobody", nodeId: "forearm.ecu" }))).toMatch(/row-level security|null value in column "user_id"/);
    });
  });

  it("anon is refused at the schema", async () => {
    expect(await as(db, "anon", () => failure(db, "select 1 from specialization.goals"))).toMatch(/permission denied for schema specialization/);
  });

  it("the service role reads every user's goals and can write for any user", async () => {
    await as(db, "service_role", async () => {
      expect(await failure(db, `insert into specialization.goals (user_id, ${goalColumns}) values ($14, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`, [...goalValues({ ...saved, id: "goal-service-b" }), USER_B])).toBeNull();
      const owners = await rows<{ user_id: string }>(db, "select distinct user_id from specialization.goals where id in ('goal-rls-1', 'goal-service-b') order by 1");
      expect(owners.map((row) => row.user_id)).toEqual([USER_A, USER_B]);
      expect(await affected("update specialization.goals set target = 12 where id = 'goal-service-b'")).toBe(1);
      expect(await affected("delete from specialization.goals where id = 'goal-service-b'")).toBe(1);
    });
  });
});

describe("measurements: owner-only, and a straight copy of the device record", () => {
  const measurement = {
    id: "measure-rls-1",
    regionId: "forearm",
    side: "right",
    measuredAt: "2026-10-16T07:15:00.000Z",
    metric: "circumference_cm",
    value: 33.5,
    protocol: { landmark: "Thickest point of the forearm", distanceFromLandmarkCm: 4, posture: "arm_relaxed_hanging", condition: "unpumped", device: "Tape", timeOfDay: "07:15" },
    notes: null,
  };
  const insert = "insert into specialization.measurements (id, region_id, side, measured_at, metric, value, protocol, notes) values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)";
  const values = (entry: typeof measurement) => [entry.id, entry.regionId, entry.side, entry.measuredAt, entry.metric, entry.value, JSON.stringify(entry.protocol), entry.notes];
  const asDevice = `select id, region_id as "regionId", side, to_char(measured_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "measuredAt", metric, value::float8 as value, protocol, notes from specialization.measurements`;

  it("user A stores a measurement as it is on the device and reads it back unchanged", async () => {
    await as(db, userA, async () => {
      expect(await failure(db, insert, values(measurement))).toBeNull();
      expect(await rows(db, `${asDevice} where id = 'measure-rls-1'`)).toEqual([measurement]);
    });
  });

  it("user B cannot read, change, delete or forge A's measurements", async () => {
    await as(db, userB, async () => {
      expect(await count(db, "select 1 from specialization.measurements where id = 'measure-rls-1'")).toBe(0);
      expect(await affected("update specialization.measurements set value = 1 where id = 'measure-rls-1'")).toBe(0);
      expect(await affected("delete from specialization.measurements where id = 'measure-rls-1'")).toBe(0);
      expect(await failure(db, "insert into specialization.measurements (user_id, id, region_id, side, measured_at, metric, value, protocol) values ($1, 'forged', 'forearm', 'left', now(), 'grip_force_n', 400, $2::jsonb)", [USER_A, JSON.stringify(measurement.protocol)])).toMatch(/row-level security/);
    });
  });

  it("user A cannot hand a measurement to B, but can change and delete their own", async () => {
    await as(db, userA, async () => {
      expect(await failure(db, "update specialization.measurements set user_id = $1 where id = 'measure-rls-1'", [USER_B])).toMatch(/row-level security/);
      expect(await affected("update specialization.measurements set value = 34 where id = 'measure-rls-1'")).toBe(1);
      expect(await affected("delete from specialization.measurements where id = 'measure-rls-1'")).toBe(1);
    });
  });

  it("the same device id in two accounts is two rows: no account can block another's ids", async () => {
    await as(db, userA, () => db.query(insert, values({ ...measurement, id: "measure-shared-id" })));
    await as(db, userB, () => db.query(insert, values({ ...measurement, id: "measure-shared-id" })));
    expect(await count(db, "select 1 from specialization.measurements where id = 'measure-shared-id'")).toBe(2);
  });

  it("the service role reads and changes every user's measurements", async () => {
    await as(db, "service_role", async () => {
      expect(await count(db, "select 1 from specialization.measurements where id = 'measure-shared-id'")).toBe(2);
      expect(await affected("delete from specialization.measurements where id = 'measure-shared-id'")).toBe(2);
    });
  });

  it("refuses values and protocols the device would never write", async () => {
    const bad = async (changes: Partial<typeof measurement> & { protocolJson?: string }, id: string) =>
      as(db, userA, () => {
        const entry = { ...measurement, ...changes, id };
        const params = values(entry);
        if (changes.protocolJson !== undefined) params[6] = changes.protocolJson;
        return failure(db, insert, params);
      });
    const p = measurement.protocol;
    expect(await bad({ value: 0 }, "m-zero")).toMatch(/measurements_value_check/);
    expect(await bad({ value: -2 }, "m-negative")).toMatch(/measurements_value_check/);
    expect(await bad({ protocolJson: JSON.stringify(p), value: Number.NaN }, "m-nan")).toMatch(/measurements_value_check/);
    expect(await bad({ metric: "skinfold_mm" }, "m-metric")).toMatch(/measurements_metric_check/);
    expect(await bad({ side: "both" }, "m-side")).toMatch(/measurements_side_check/);
    for (const [label, protocol] of [
      ["no landmark", { ...p, landmark: undefined }],
      ["blank landmark", { ...p, landmark: "  " }],
      ["negative distance", { ...p, distanceFromLandmarkCm: -1 }],
      ["distance as text", { ...p, distanceFromLandmarkCm: "4" }],
      ["time of day 25:00", { ...p, timeOfDay: "25:00" }],
      ["device as a number", { ...p, device: 5 }],
      ["an unknown key", { ...p, pumpedMinutes: 10 }],
      ["no posture", { ...p, posture: undefined }],
    ] as const) {
      expect(await bad({ protocolJson: JSON.stringify(protocol) }, `m-${label}`), label).toMatch(/measurements_protocol_shape/);
    }
    expect(await bad({ protocolJson: "[]" }, "m-array")).toMatch(/measurements_protocol_shape/);
    expect(await bad({ protocolJson: '"tape"' }, "m-scalar")).toMatch(/measurements_protocol_shape/);
    expect(await bad({ protocolJson: JSON.stringify({ ...p, distanceFromLandmarkCm: null, device: null, timeOfDay: null }) }, "m-nulls")).toBeNull();
  });
});

// ---------------------------------------------------------------- integrity rules

describe("anatomy integrity", () => {
  it("refuses a parent cycle, direct or through other nodes", async () => {
    await as(db, "service_role", async () => {
      expect(await failure(db, "update specialization.nodes set parent_id = 'forearm.fcr' where id = 'forearm.anterior'")).toMatch(/cycle/);
      expect(await failure(db, "update specialization.nodes set parent_id = id where id = 'forearm.fcr'")).toMatch(/cycle|nodes_not_own_parent/);
      await insertTestNode("forearm.zz_a", null);
      await insertTestNode("forearm.zz_b", "forearm.zz_a");
      await insertTestNode("forearm.zz_c", "forearm.zz_b");
      expect(await failure(db, "update specialization.nodes set parent_id = 'forearm.zz_c' where id = 'forearm.zz_a'")).toMatch(/forearm\.zz_a cannot have forearm\.zz_c as its parent: that makes a cycle/);
      expect(await failure(db, "update specialization.nodes set parent_id = 'forearm.posterior' where id = 'forearm.zz_a'")).toBeNull();
    });
  });

  it("refuses a node action resting on another node's claim, or on a claim that is not a function claim", async () => {
    await as(db, "service_role", async () => {
      const insert = "insert into specialization.node_actions (node_id, action_id, role, claim_id) select 'forearm.fcr', 'wrist.extension', 'assist', id from specialization.claims where claim_key = $1";
      expect(await failure(db, insert, ["forearm:fcu.function"])).toMatch(/node_actions_function_claim_of_same_node/);
      expect(await failure(db, insert, ["forearm:fcr.appearance"])).toMatch(/node_actions_function_claim_of_same_node/);
      // Turning the claim under a node action into another kind, on a muscle no published
      // version maps (on a mapped one the claim is frozen outright: see below).
      await insertTestNode("forearm.zz_fk", "forearm.anterior", "reviewed");
      await db.exec(`
        insert into specialization.claims (claim_key, node_id, kind, statement, basis, review_status, reviewed_on) values ('test:zz_fk.function', 'forearm.zz_fk', 'function', 'Test.', 'established_anatomy', 'reviewed', '2026-10-16');
        insert into specialization.node_actions (node_id, action_id, role, claim_id) select 'forearm.zz_fk', 'wrist.flexion', 'assist', id from specialization.claims where claim_key = 'test:zz_fk.function';
      `);
      expect(await failure(db, "update specialization.claims set kind = 'appearance' where claim_key = 'test:zz_fk.function'")).toMatch(/node_actions_function_claim_of_same_node/);
      expect(await failure(db, insert, ["forearm:fcr.function"])).toBeNull();
      await db.query("delete from specialization.node_actions where node_id = 'forearm.fcr' and action_id = 'wrist.extension'");
      await db.exec(`
        delete from specialization.node_actions where node_id = 'forearm.zz_fk';
        delete from specialization.claims where claim_key = 'test:zz_fk.function';
        delete from specialization.nodes where id = 'forearm.zz_fk';
      `);
    });
  });
});

describe("a published mapping version is immutable", () => {
  it("refuses changing, deleting or adding its mappings, draft rows included, even for the owner", async () => {
    for (const who of ["service_role", "postgres"] as const) {
      await as(db, who, async () => {
        expect(await failure(db, "update specialization.variant_mappings set rationale = 'Edited.' where mapping_key = 'cat-139:forearm.fcu'"), who).toMatch(/cannot change. Publish a new version instead/);
        expect(await failure(db, "update specialization.variant_mappings set review_status = 'reviewed' where mapping_key = 'cat-317:forearm.br'"), who).toMatch(/cannot change/);
        expect(await failure(db, "delete from specialization.variant_mappings where mapping_key = 'cat-139:forearm.fcu'"), who).toMatch(/cannot change/);
      });
    }
    await as(db, "service_role", async () => {
      const added = await failure(
        db,
        `insert into specialization.variant_mappings (version_id, mapping_key, variant_key, node_id, action_id, relationship, muscle_mode, evidence_basis, rationale, review_status)
         select id, 'cat-139:forearm.anconeus', 'cat-139', 'forearm.anconeus', 'elbow.extension', 'stabilizer', 'isometric', 'inference', 'Added later.', 'reviewed' from specialization.mapping_versions where version_key = 'forearm_mappings_v1'`,
      );
      expect(added).toMatch(/mappings cannot be added to it/);
    });
  });

  it("refuses changing its mapping sources", async () => {
    await as(db, "service_role", async () => {
      const ofMapping = "mapping_id = (select id from specialization.variant_mappings where mapping_key = 'cat-139:forearm.fcu')";
      expect(await failure(db, `update specialization.mapping_sources set locator = 'Elsewhere' where ${ofMapping}`)).toMatch(/cannot change/);
      expect(await failure(db, `delete from specialization.mapping_sources where ${ofMapping}`)).toMatch(/cannot change/);
      expect(await failure(db, "insert into specialization.mapping_sources (mapping_id, source_id, locator) select m.id, s.id, 'New' from specialization.variant_mappings m, specialization.sources s where m.mapping_key = 'cat-139:forearm.fcu' and s.source_key = 'S1'")).toMatch(/cannot change/);
    });
  });

  it("refuses editing, unpublishing or deleting the version itself", async () => {
    await as(db, "service_role", async () => {
      expect(await failure(db, "update specialization.mapping_versions set method_notes = 'Rewritten.' where version_key = 'forearm_mappings_v1'")).toMatch(/is published; it cannot change/);
      expect(await failure(db, "update specialization.mapping_versions set state = 'draft', published_at = null where version_key = 'forearm_mappings_v1'")).toMatch(/is published; it cannot change/);
      expect(await failure(db, "delete from specialization.mapping_versions where version_key = 'forearm_mappings_v1'")).toMatch(/is published; it cannot be deleted/);
      expect(await failure(db, "insert into specialization.mapping_versions (version_key, region_id, state, published_at, method_notes) values ('zz_born_published', 'forearm', 'published', now(), 'x')")).toMatch(/must be created as a draft/);
    });
  });
});

describe("what a published mapping version rests on is frozen with it", () => {
  const owners = ["service_role", "postgres"] as const;

  it("a variant it uses cannot change or be deleted, for the owner too; an update that changes nothing passes", async () => {
    for (const who of owners) {
      await as(db, who, async () => {
        // cat-403 maps FDS and FDP as direct isometric work: this flag moves them between deliberate and incidental holds.
        expect(await failure(db, "update specialization.exercise_variants set deliberate_hold = not deliberate_hold where variant_key = 'cat-403'"), who).toMatch(
          /variant cat-403 is used by mapping version forearm_mappings_v1 \(published\); it cannot change or be deleted/,
        );
        expect(await failure(db, "update specialization.exercise_variants set straps = 'yes' where variant_key = 'cat-139'"), who).toMatch(/variant cat-139 is used by mapping version forearm_mappings_v1/);
        expect(await failure(db, "delete from specialization.exercise_variants where variant_key = 'cat-139'"), who).toMatch(/variant cat-139 is used by mapping version forearm_mappings_v1/);
        expect(await failure(db, "update specialization.exercise_variants set notes = notes where variant_key = 'cat-139'"), who).toBeNull();
      });
    }
  });

  it("a node action its mappings name cannot change or be removed; a muscle it maps stays reviewed but may be renamed", async () => {
    for (const who of owners) {
      await as(db, who, async () => {
        const named = /node action forearm\.fcu wrist\.flexion is named by mapping version forearm_mappings_v1 \(published\); it cannot change or be deleted/;
        expect(await failure(db, "update specialization.node_actions set role = case role when 'prime' then 'assist' else 'prime' end where node_id = 'forearm.fcu' and action_id = 'wrist.flexion'"), who).toMatch(named);
        expect(await failure(db, "delete from specialization.node_actions where node_id = 'forearm.fcu' and action_id = 'wrist.flexion'"), who).toMatch(named);
        const mapped = /node forearm\.fcr is mapped by mapping version forearm_mappings_v1 \(published\); it must stay reviewed and cannot be deleted/;
        expect(await failure(db, "update specialization.nodes set status = 'draft' where id = 'forearm.fcr'"), who).toMatch(mapped);
        expect(await failure(db, "delete from specialization.nodes where id = 'forearm.fcr'"), who).toMatch(mapped);
      });
    }
    await as(db, "service_role", async () => {
      expect(await failure(db, "update specialization.nodes set name = name || ' (renamed)' where id = 'forearm.fcr'")).toBeNull();
      expect(await failure(db, "update specialization.nodes set name = replace(name, ' (renamed)', '') where id = 'forearm.fcr'")).toBeNull();
    });
  });

  // Final review F-database-2: what decides counting on a mapped muscle is frozen with the version.
  it("a muscle it maps keeps its region, role and catalog muscle key; its kind, parent, words and database muscle may change", async () => {
    // Region and role decide whether FDP's bouts are the forearm's (regionNodeIds); role and catalog key decide which catalog-tagged work is region work.
    const decides = /node forearm\.fdp is mapped by mapping version forearm_mappings_v1 \(published\); it must stay reviewed and cannot be deleted, and its region, role and catalog muscle key, which decide what its work counts toward, cannot change/;
    const before = await rows(db, "select * from specialization.nodes where id = 'forearm.fdp'");
    for (const who of owners) {
      await as(db, who, async () => {
        for (const change of ["region_id = 'upper_arm'", "role = 'external'", "role = 'adjacent'", "region_id = 'upper_arm', role = 'external'", "catalog_muscle_key = null", "catalog_muscle_key = 'forearm_flexors'"]) {
          expect(await failure(db, `update specialization.nodes set ${change} where id = 'forearm.fdp'`), `${who}: ${change}`).toMatch(decides);
        }
        // An update that changes nothing passes, whatever columns it names.
        expect(await failure(db, "update specialization.nodes set region_id = region_id, role = role, catalog_muscle_key = catalog_muscle_key, status = status where id = 'forearm.fdp'"), who).toBeNull();
        // What only places or describes it may change, and change back.
        for (const [change, back] of [["kind = 'head'", "kind = 'muscle'"], ["parent_id = 'forearm.posterior'", "parent_id = 'forearm.anterior'"], ["short_name = 'FDP (edited)'", "short_name = 'FDP'"]]) {
          expect(await failure(db, `update specialization.nodes set ${change} where id = 'forearm.fdp'`), `${who}: ${change}`).toBeNull();
          expect(await failure(db, `update specialization.nodes set ${back} where id = 'forearm.fdp'`), `${who}: ${back}`).toBeNull();
        }
      });
    }
    // database_muscle follows public.muscles (on update cascade): the guard lets the cascade through.
    expect(await failure(db, "update public.muscles set canonical_name = 'forearm_flexors_renamed' where canonical_name = 'forearm_flexors'")).toBeNull();
    expect(await rows(db, "select database_muscle from specialization.nodes where id = 'forearm.fdp'")).toEqual([{ database_muscle: "forearm_flexors_renamed" }]);
    expect(await failure(db, "update public.muscles set canonical_name = 'forearm_flexors' where canonical_name = 'forearm_flexors_renamed'")).toBeNull();
    expect(await rows(db, "select * from specialization.nodes where id = 'forearm.fdp'")).toEqual(before);
  });

  it("a muscle, claim and node action no published version uses stay free", async () => {
    await as(db, "service_role", async () => {
      await insertTestNode("forearm.zz_free", "forearm.anterior", "reviewed");
      await db.exec(`
        insert into specialization.claims (claim_key, node_id, kind, statement, basis, review_status, reviewed_on) values ('test:zz_free.function', 'forearm.zz_free', 'function', 'Test.', 'established_anatomy', 'reviewed', '2026-10-16');
        insert into specialization.claim_sources (claim_id, source_id, locator) select c.id, s.id, 'Test' from specialization.claims c, specialization.sources s where c.claim_key = 'test:zz_free.function' and s.source_key = 'S2';
        insert into specialization.node_actions (node_id, action_id, role, claim_id) select 'forearm.zz_free', 'wrist.flexion', 'prime', id from specialization.claims where claim_key = 'test:zz_free.function';
      `);
      for (const sql of [
        "update specialization.node_actions set role = 'assist' where node_id = 'forearm.zz_free'",
        "update specialization.claims set statement = 'Rewritten.' where claim_key = 'test:zz_free.function'",
        "update specialization.claim_sources set locator = 'Elsewhere' where claim_id = (select id from specialization.claims where claim_key = 'test:zz_free.function')",
        "update specialization.nodes set role = 'adjacent', catalog_muscle_key = null where id = 'forearm.zz_free'",
        "update specialization.nodes set status = 'draft' where id = 'forearm.zz_free'",
        "delete from specialization.node_actions where node_id = 'forearm.zz_free'",
        "delete from specialization.claims where claim_key = 'test:zz_free.function'",
        "delete from specialization.nodes where id = 'forearm.zz_free'",
      ]) {
        expect(await failure(db, sql), sql).toBeNull();
      }
    });
  });

  it("a reviewed claim of a mapped muscle keeps its key, node, kind, statement, basis and review, and stays; its note and review date may change; a draft claim is free", async () => {
    const frozen = /claim forearm:fcu\.function is a reviewed claim on forearm\.fcu, which mapping version forearm_mappings_v1 \(published\) maps; its key, node, kind, statement, basis and review status cannot change/;
    // The basis is the provenance label users read beside the claim (MuscleSheet): relabelling it rewrites what was published.
    const [{ basis }] = await rows<{ basis: string }>(db, "select basis from specialization.claims where claim_key = 'forearm:fcu.function'");
    const otherBasis = basis === "product_assumption" ? "anatomical_inference" : "product_assumption";
    for (const who of owners) {
      await as(db, who, async () => {
        for (const change of ["statement = 'Rewritten.'", "review_status = 'draft'", "review_status = 'rejected'", "kind = 'appearance'", "node_id = 'forearm.fcr'", "claim_key = 'forearm:fcu.function.renamed'", `basis = '${otherBasis}'`]) {
          expect(await failure(db, `update specialization.claims set ${change} where claim_key = 'forearm:fcu.function'`), `${who}: ${change}`).toMatch(frozen);
        }
        expect(await failure(db, "delete from specialization.claims where claim_key = 'forearm:fcu.function'"), who).toMatch(frozen);
        // An update that changes nothing passes.
        expect(await failure(db, "update specialization.claims set basis = basis, statement = statement where claim_key = 'forearm:fcu.function'"), who).toBeNull();
      });
    }
    await as(db, "service_role", async () => {
      const [{ note, reviewedOn }] = await rows<{ note: string | null; reviewedOn: string }>(db, "select review_note as note, reviewed_on::text as \"reviewedOn\" from specialization.claims where claim_key = 'forearm:fcu.function'");
      expect(await failure(db, "update specialization.claims set review_note = 'Checked again.', reviewed_on = '2026-10-18' where claim_key = 'forearm:fcu.function'")).toBeNull();
      expect(await failure(db, "update specialization.claims set review_note = $1, reviewed_on = $2 where claim_key = 'forearm:fcu.function'", [note, reviewedOn])).toBeNull();
      // The draft claim set up for the read tests is free; a new claim may be added and reviewed, and is then frozen like the rest.
      expect(await failure(db, "update specialization.claims set statement = 'Draft claim, rewritten.' where claim_key = 'test:fcu.draft'")).toBeNull();
      expect(await failure(db, "insert into specialization.claims (claim_key, node_id, kind, statement, basis, review_status) values ('test:fcu.added', 'forearm.fcu', 'variation', 'Added later.', 'unknown', 'draft')")).toBeNull();
      expect(await failure(db, "update specialization.claims set review_status = 'reviewed', reviewed_on = '2026-10-17' where claim_key = 'test:fcu.added'")).toBeNull();
      expect(await failure(db, "delete from specialization.claims where claim_key = 'test:fcu.added'")).toMatch(/claim test:fcu\.added is a reviewed claim on forearm\.fcu/);
    });
  });

  it("the sources of such a claim cannot be added, changed or removed; a draft claim's can", async () => {
    await as(db, "service_role", async () => {
      const ofClaim = (key: string) => `claim_id = (select id from specialization.claims where claim_key = '${key}')`;
      const frozen = /the sources of claim forearm:fcu\.function cannot change: it is a reviewed claim on a muscle that mapping version forearm_mappings_v1 \(published\) maps/;
      expect(await failure(db, `update specialization.claim_sources set locator = 'Elsewhere' where ${ofClaim("forearm:fcu.function")}`)).toMatch(frozen);
      expect(await failure(db, `delete from specialization.claim_sources where ${ofClaim("forearm:fcu.function")}`)).toMatch(frozen);
      expect(
        await failure(
          db,
          `insert into specialization.claim_sources (claim_id, source_id, locator)
           select c.id, s.id, 'New' from specialization.claims c, specialization.sources s
           where c.claim_key = 'forearm:fcu.function' and s.source_key = 'S1'`,
        ),
      ).toMatch(frozen);
      expect(await failure(db, `update specialization.claim_sources set locator = 'Elsewhere' where ${ofClaim("test:fcu.draft")}`)).toBeNull();
    });
  });

  it("a source it cites keeps its key, url, title and evidence type and is not deleted; its notes may change; an uncited source is free", async () => {
    // One cited by a mapping, and one cited only by a reviewed claim of a mapped muscle.
    const [{ key: claimOnly }] = await rows<{ key: string }>(
      db,
      `select s.source_key as key from specialization.sources s
       where not exists (select 1 from specialization.mapping_sources ms where ms.source_id = s.id)
         and exists (select 1 from specialization.claim_sources cs join specialization.claims c on c.id = cs.claim_id join specialization.variant_mappings m on m.node_id = c.node_id
                     where cs.source_id = s.id and c.review_status = 'reviewed')
       order by 1 limit 1`,
    );
    for (const who of owners) {
      await as(db, who, async () => {
        for (const key of ["S4", claimOnly]) {
          const cited = new RegExp(`source ${key} is cited by mapping version forearm_mappings_v1 \\(published\\); its key, url, title and evidence type cannot change and it cannot be deleted`);
          for (const change of ["evidence_type = 'product_assumption'", "url = 'https://example.invalid/moved'", "title = title || ' (2nd edition)'", "source_key = source_key || 'x'"]) {
            expect(await failure(db, `update specialization.sources set ${change} where source_key = '${key}'`), `${who}: ${key} ${change}`).toMatch(cited);
          }
          expect(await failure(db, `delete from specialization.sources where source_key = '${key}'`), `${who}: delete ${key}`).toMatch(cited);
        }
      });
    }
    await as(db, "service_role", async () => {
      const [{ notes }] = await rows<{ notes: string | null }>(db, "select notes from specialization.sources where source_key = 'S4'");
      expect(await failure(db, "update specialization.sources set notes = 'Re-checked.' where source_key = 'S4'")).toBeNull();
      expect(await failure(db, "update specialization.sources set notes = $1 where source_key = 'S4'", [notes])).toBeNull();
      await db.query("insert into specialization.sources (source_key, url, title, evidence_type, retrieved_on) values ('ZZ1', 'https://example.invalid/zz1', 'Test source', 'anatomy', '2026-10-17')");
      expect(await failure(db, "update specialization.sources set title = 'Retitled', evidence_type = 'emg' where source_key = 'ZZ1'")).toBeNull();
      expect(await failure(db, "delete from specialization.sources where source_key = 'ZZ1'")).toBeNull();
    });
  });

  it("after all of that the published version still passes its publication rule", async () => {
    const [{ problems }] = await rows<{ problems: string | null }>(db, "select specialization.mapping_version_problems(id) as problems from specialization.mapping_versions where version_key = 'forearm_mappings_v1'");
    expect(problems).toBeNull();
  });

  // Last: it publishes a second version over forearm.fcu and S4, which the messages above name alone.
  it("a variant only drafts use may change, until a version using it is published", async () => {
    await as(db, "service_role", async () => {
      await db.exec(`
        insert into specialization.catalog_exercises (catalog_id, name) values (9001, 'Test exercise');
        insert into specialization.exercise_variants (variant_key, catalog_id, organization, forearm_orientation, wrist_position, grip_type, straps, laterality, phase, measure, deliberate_hold)
          values ('zz-variant', 9001, 'single_joint', 'neutral', 'neutral', 'overhand', 'no', 'bilateral', 'concentric_eccentric', 'reps', false);
      `);
      await giveSidedBy("zz-variant");
      await newDraftVersion("zz_variant_v1");
      await addMapping("zz_variant_v1", "zz:variant", { variant: "zz-variant", node: "forearm.fcu", action: "wrist.flexion", sources: [{ key: "S4", locator: "Table" }] });
      expect(await failure(db, "update specialization.exercise_variants set deliberate_hold = true where variant_key = 'zz-variant'")).toBeNull();
      expect(await publish("zz_variant_v1")).toBeNull();
      expect(await failure(db, "update specialization.exercise_variants set deliberate_hold = false where variant_key = 'zz-variant'")).toMatch(/variant zz-variant is used by mapping version zz_variant_v1 \(published\)/);
    });
  });
});

describe("truncate", () => {
  it("the service role holds no TRUNCATE on any table", async () => {
    await as(db, "service_role", async () => {
      for (const table of ALL_TABLES) expect(await failure(db, `truncate specialization.${table}`), table).toMatch(new RegExp(`permission denied for table ${table}`));
    });
  });

  it("the owner is refused truncating anything a published version rests on, through CASCADE too, and nothing is emptied", async () => {
    const sizes = async () => Object.fromEntries(await Promise.all(FROZEN_TABLES.map(async (table) => [table, await count(db, `select 1 from specialization.${table}`)] as const)));
    const before = await sizes();
    for (const table of FROZEN_TABLES) {
      // Without CASCADE a table other tables point at is refused by its foreign keys first.
      expect(await failure(db, `truncate specialization.${table}`), table).toMatch(/cannot be truncated|cannot truncate a table referenced in a foreign key constraint/);
      expect(await failure(db, `truncate specialization.${table} cascade`), `${table} cascade`).toMatch(/cannot be truncated/);
    }
    expect(await failure(db, "truncate specialization.rule_versions")).toMatch(/rule_versions holds a published rule version; it cannot be truncated/);
    expect(await failure(db, "truncate specialization.mapping_sources")).toMatch(/mapping_sources holds rows that published or retired mapping versions rest on; it cannot be truncated/);
    // Reached only through CASCADE from a table that has no guard of its own.
    expect(await failure(db, "truncate specialization.regions cascade")).toMatch(/cannot be truncated/);
    expect(await failure(db, "truncate specialization.catalog_exercises cascade")).toMatch(/cannot be truncated/);
    expect(await sizes()).toEqual(before);
  });
});

describe("publishing a mapping version", () => {
  beforeAll(async () => {
    await as(db, "service_role", () => giveSidedBy("cat-139", "cat-140", "cat-408"));
  });

  const problemsOf = async (key: string) =>
    (await rows<{ problems: string | null }>(db, "select specialization.mapping_version_problems(id) as problems from specialization.mapping_versions where version_key = $1", [key]))[0].problems;

  it("refuses an empty version", async () => {
    await as(db, "service_role", async () => {
      await newDraftVersion("zz_empty");
      expect(await publish("zz_empty")).toMatch(/zz_empty cannot be published: it has no mappings/);
    });
  });

  it("refuses a mapping with no source, reviewed or draft", async () => {
    await as(db, "service_role", async () => {
      await newDraftVersion("zz_unsourced");
      await addMapping("zz_unsourced", "zz:reviewed", { variant: "cat-139", node: "forearm.fcu", action: "wrist.flexion", sources: [{ key: "S4", locator: "Table" }] });
      await addMapping("zz_unsourced", "zz:draft-unsourced", { variant: "cat-139", node: "forearm.fcr", action: "wrist.flexion", status: "draft" });
      expect(await publish("zz_unsourced")).toMatch(/mappings without a source: zz:draft-unsourced/);
    });
  });

  it("refuses a reviewed mapping whose sources say nowhere where", async () => {
    await as(db, "service_role", async () => {
      await newDraftVersion("zz_unlocated");
      await addMapping("zz_unlocated", "zz:unlocated", { variant: "cat-139", node: "forearm.fcu", action: "wrist.flexion", sources: [{ key: "S4", locator: null }] });
      expect(await publish("zz_unlocated")).toMatch(/reviewed mappings without a located source: zz:unlocated/);
    });
  });

  it("refuses a mapping to a muscle with no reviewed function claim, and a reviewed mapping to an unreviewed muscle", async () => {
    await as(db, "service_role", async () => {
      await insertTestNode("forearm.zz_noclaim", "forearm.anterior", "draft");
      await newDraftVersion("zz_noclaim");
      await addMapping("zz_noclaim", "zz:noclaim", { variant: "cat-139", node: "forearm.zz_noclaim", action: null, sources: [{ key: "S4", locator: "Table" }] });
      const message = await publish("zz_noclaim");
      expect(message).toMatch(/mapped muscles without a reviewed function claim: forearm\.zz_noclaim/);
      expect(message).toMatch(/reviewed mappings credit muscles that are not reviewed: forearm\.zz_noclaim/);
    });
  });

  it("refuses a rejected mapping, and a movement the muscle does not perform", async () => {
    await as(db, "service_role", async () => {
      await newDraftVersion("zz_rejected");
      await addMapping("zz_rejected", "zz:rejected", { variant: "cat-139", node: "forearm.fcu", action: "wrist.flexion", status: "rejected", sources: [{ key: "S4", locator: "Table" }] });
      await addMapping("zz_rejected", "zz:wrong-action", { variant: "cat-140", node: "forearm.fcu", action: "wrist.extension", sources: [{ key: "S4", locator: "Table" }] });
      const message = await publish("zz_rejected");
      expect(message).toMatch(/rejected mappings must be removed first: zz:rejected/);
      expect(message).toMatch(/a movement their muscle has no node action for: zz:wrong-action/);
    });
  });

  // Final review F-database-1: a reviewed mapping never rests on a claim users cannot read, or one with no citation.
  it("refuses a reviewed mapping whose node action rests on a draft or unsourced function claim; a draft row may; the claim it rests on is then frozen", async () => {
    await as(db, "service_role", async () => {
      await insertTestNode("forearm.zz_claims", "forearm.anterior", "reviewed");
      await insertTestNode("forearm.zz_draftnode", "forearm.anterior", "draft");
      await listInForearm("forearm.zz_claims");
      await listInForearm("forearm.zz_draftnode");
      await db.exec(`
        insert into specialization.claims (claim_key, node_id, kind, statement, basis, review_status, reviewed_on) values
          ('test:zz_claims.function', 'forearm.zz_claims', 'function', 'Reviewed and sourced.', 'established_anatomy', 'reviewed', '2026-10-16'),
          ('test:zz_claims.unsourced', 'forearm.zz_claims', 'function', 'Reviewed, with no source.', 'established_anatomy', 'reviewed', '2026-10-16'),
          ('test:zz_draftnode.function', 'forearm.zz_draftnode', 'function', 'Reviewed claim of a draft muscle.', 'established_anatomy', 'reviewed', '2026-10-16');
        insert into specialization.claims (claim_key, node_id, kind, statement, basis, review_status) values
          ('test:zz_claims.draft', 'forearm.zz_claims', 'function', 'Still a draft.', 'anatomical_inference', 'draft');
        insert into specialization.claim_sources (claim_id, source_id, locator)
          select c.id, s.id, 'Test' from specialization.claims c, specialization.sources s
          where c.claim_key in ('test:zz_claims.function', 'test:zz_claims.draft', 'test:zz_draftnode.function') and s.source_key = 'S2';
        insert into specialization.node_actions (node_id, action_id, role, claim_id)
          select c.node_id, a.action_id, 'prime', c.id from specialization.claims c
          join (values ('wrist.flexion', 'test:zz_claims.function'), ('wrist.extension', 'test:zz_claims.draft'), ('wrist.ulnar_deviation', 'test:zz_claims.unsourced'), ('wrist.flexion', 'test:zz_draftnode.function')) as a (action_id, claim_key)
            on a.claim_key = c.claim_key;
      `);
    });
    const located = [{ key: "S4", locator: "Table" }];
    for (const who of ["service_role", "postgres"] as const) {
      await as(db, who, async () => {
        const key = `zz_claims_${who}`;
        await newDraftVersion(key);
        await addMapping(key, `${key}:flexion`, { variant: "cat-139", node: "forearm.zz_claims", action: "wrist.flexion", sources: located });
        await addMapping(key, `${key}:extension`, { variant: "cat-140", node: "forearm.zz_claims", action: "wrist.extension", sources: located });
        await addMapping(key, `${key}:ulnar`, { variant: "cat-408", node: "forearm.zz_claims", action: "wrist.ulnar_deviation", sources: located });
        await addMapping(key, `${key}:draft-muscle`, { variant: "cat-139", node: "forearm.zz_draftnode", action: "wrist.flexion", status: "draft", sources: located });
        const message = await publish(key);
        expect(message, who).toMatch(new RegExp(`reviewed mappings rest on a function claim that is not reviewed: ${key}:extension \\(test:zz_claims\\.draft\\)(;|$)`));
        expect(message, who).toMatch(new RegExp(`reviewed mappings rest on a function claim with no source: ${key}:ulnar \\(test:zz_claims\\.unsourced\\)(;|$)`));
        expect(message, who).not.toMatch(/:flexion|:draft-muscle/);
      });
    }
    await as(db, "service_role", async () => {
      expect(await failure(db, "delete from specialization.mapping_versions where version_key = 'zz_claims_postgres'")).toBeNull();
      // As draft rows they may rest on those claims: users never see them and nothing counts them.
      expect(await failure(db, "update specialization.variant_mappings set review_status = 'draft' where mapping_key in ('zz_claims_service_role:extension', 'zz_claims_service_role:ulnar')")).toBeNull();
      expect(await problemsOf("zz_claims_service_role")).toBeNull();
      expect(await publish("zz_claims_service_role")).toBeNull();
    });
    // A signed-in user reads the reviewed mapping and the node action under it; the draft claim's node action stays hidden.
    const seen = await as(db, userA, async () => ({
      mappings: (await rows<{ mapping_key: string }>(db, "select mapping_key from specialization.variant_mappings where mapping_key like 'zz_claims_service_role:%' order by 1")).map((row) => row.mapping_key),
      actions: (await rows<{ action_id: string }>(db, "select action_id from specialization.node_actions where node_id = 'forearm.zz_claims' order by 1")).map((row) => row.action_id),
      // Across every published version: no reviewed mapping a user reads rests on a node action the user cannot read.
      orphans: await count(db, "select 1 from specialization.variant_mappings m where m.action_id is not null and not exists (select 1 from specialization.node_actions na where na.node_id = m.node_id and na.action_id = m.action_id)"),
    }));
    expect(seen).toEqual({ mappings: ["zz_claims_service_role:flexion"], actions: ["wrist.flexion", "wrist.ulnar_deviation"], orphans: 0 });
    for (const who of ["service_role", "postgres"] as const) {
      await as(db, who, async () => {
        const frozen = /claim test:zz_claims\.function is a reviewed claim on forearm\.zz_claims, which mapping version zz_claims_service_role \(published\) maps/;
        expect(await failure(db, "update specialization.claims set review_status = 'rejected', statement = 'Rewritten.' where claim_key = 'test:zz_claims.function'"), who).toMatch(frozen);
        expect(await failure(db, "update specialization.claims set basis = 'product_assumption' where claim_key = 'test:zz_claims.function'"), who).toMatch(frozen);
        expect(await failure(db, "delete from specialization.claim_sources where claim_id = (select id from specialization.claims where claim_key = 'test:zz_claims.function')"), who).toMatch(/the sources of claim test:zz_claims\.function cannot change/);
        // The draft claim behind a draft row is free, and so is a draft muscle a draft row maps, until it is reviewed.
        expect(await failure(db, "update specialization.claims set statement = 'Still a draft, rewritten.' where claim_key = 'test:zz_claims.draft'"), who).toBeNull();
        expect(await failure(db, "update specialization.nodes set role = 'adjacent' where id = 'forearm.zz_draftnode'"), who).toBeNull();
        expect(await failure(db, "update specialization.nodes set role = 'target' where id = 'forearm.zz_draftnode'"), who).toBeNull();
      });
    }
    await as(db, "service_role", async () => {
      expect(await failure(db, "update specialization.nodes set status = 'reviewed' where id = 'forearm.zz_draftnode'")).toBeNull();
      expect(await failure(db, "update specialization.nodes set role = 'adjacent' where id = 'forearm.zz_draftnode'")).toMatch(/node forearm\.zz_draftnode is mapped by mapping version zz_claims_service_role \(published\); .* its region, role and catalog muscle key/);
    });
  });

  it("publishes reviewed rows beside sourced draft rows; users then see the reviewed ones; it can be retired and nothing else", async () => {
    await as(db, "service_role", async () => {
      await newDraftVersion("zz_good");
      await addMapping("zz_good", "zz:reviewed", { variant: "cat-139", node: "forearm.fcu", action: "wrist.flexion", sources: [{ key: "S4", locator: "Forearm muscle tables: FCU" }, { key: "S2", locator: null }] });
      await addMapping("zz_good", "zz:draft", { variant: "cat-139", node: "forearm.fcr", action: "wrist.flexion", status: "draft", sources: [{ key: "S4", locator: null }] });
      expect(await problemsOf("zz_good")).toBeNull();
      expect(await publish("zz_good")).toBeNull();
      const [version] = await rows<{ state: string; published: boolean }>(db, "select state, published_at is not null as published from specialization.mapping_versions where version_key = 'zz_good'");
      expect(version).toEqual({ state: "published", published: true });
    });
    const seen = await as(db, userA, () =>
      rows<{ mapping_key: string }>(db, "select m.mapping_key from specialization.variant_mappings m join specialization.mapping_versions v on v.id = m.version_id where v.version_key = 'zz_good'"),
    );
    expect(seen).toEqual([{ mapping_key: "zz:reviewed" }]);
    await as(db, "service_role", async () => {
      expect(await failure(db, "update specialization.mapping_versions set state = 'retired' where version_key = 'zz_good'")).toBeNull();
      expect(await failure(db, "update specialization.mapping_versions set state = 'published' where version_key = 'zz_good'")).toMatch(/is retired; it cannot change/);
      expect(await failure(db, "delete from specialization.mapping_versions where version_key = 'zz_good'")).toMatch(/is retired; it cannot be deleted/);
    });
    expect(await as(db, userA, () => count(db, "select 1 from specialization.mapping_versions where version_key = 'zz_good'"))).toBe(0);
  });

  it("lets a draft version be changed and deleted", async () => {
    await as(db, "service_role", async () => {
      await newDraftVersion("zz_scratch");
      await addMapping("zz_scratch", "zz:scratch", { variant: "cat-139", node: "forearm.fcu", action: "wrist.flexion", sources: [{ key: "S4", locator: "Table" }] });
      expect(await failure(db, "update specialization.variant_mappings set rationale = 'Better.' where mapping_key = 'zz:scratch'")).toBeNull();
      expect(await failure(db, "update specialization.mapping_versions set state = 'retired' where version_key = 'zz_scratch'")).toMatch(/delete it instead of retiring it/);
      expect(await failure(db, "delete from specialization.mapping_versions where version_key = 'zz_scratch'")).toBeNull();
      expect(await count(db, "select 1 from specialization.variant_mappings where mapping_key = 'zz:scratch'")).toBe(0);
    });
  });
});

describe("rule versions", () => {
  it("a published rule cannot change or be deleted; a draft can, until it is published", async () => {
    await as(db, "service_role", async () => {
      expect(await failure(db, "update specialization.rule_versions set notes = 'Edited.' where id = 'specialization_exposure_v1'")).toMatch(/specialization_exposure_v1 is published; it cannot change/);
      expect(await failure(db, "delete from specialization.rule_versions where id = 'specialization_exposure_v1'")).toMatch(/is published/);
      await db.query("insert into specialization.rule_versions (id, specification, notes) values ('zz_rule_v2', '{\"bout\": \"draft\"}', 'Draft.')");
      expect(await failure(db, "update specialization.rule_versions set notes = 'Still a draft.' where id = 'zz_rule_v2'")).toBeNull();
      expect(await failure(db, "update specialization.rule_versions set published_at = now() where id = 'zz_rule_v2'")).toBeNull();
      expect(await failure(db, "update specialization.rule_versions set notes = 'Too late.' where id = 'zz_rule_v2'")).toMatch(/zz_rule_v2 is published/);
      expect(await failure(db, "insert into specialization.rule_versions (id, specification, notes) values ('zz_rule_array', '[]', 'Not an object.')")).toMatch(/rule_versions_specification_check/);
    });
  });
});

describe("goal rules", () => {
  type GoalRow = { id: string; node?: string | null; action?: string | null; side?: string; metric?: string; period?: string; target?: number | string; from: string; to?: string | null; zone?: string };
  const tryGoal = (goal: GoalRow, who: { user: string } = userA) =>
    as(db, who, () =>
      failure(
        db,
        "insert into specialization.goals (id, region_id, node_id, action_id, side, metric, target, period, starts_on, ends_on, timezone) values ($1, 'forearm', $2, $3, $4, $5, $6, $7, $8, $9, $10)",
        [goal.id, goal.node === undefined ? "forearm.ecu" : goal.node, goal.action ?? null, goal.side ?? "left", goal.metric ?? "direct_dynamic_bouts", goal.target ?? 12, goal.period ?? "calendar_week", goal.from, goal.to ?? null, goal.zone ?? "Europe/London"],
      ),
    );

  it("refuses an overlapping goal for the same muscle, arm, measure and period, including open-ended ones", async () => {
    expect(await tryGoal({ id: "ov-1", from: "2026-10-01", to: "2026-10-31" })).toBeNull();
    expect(await tryGoal({ id: "ov-2", from: "2026-10-31" })).toMatch(/goals_no_overlap/);
    expect(await tryGoal({ id: "ov-3", from: "2026-09-01" })).toMatch(/goals_no_overlap/);
    expect(await tryGoal({ id: "ov-4", from: "2026-10-10", to: "2026-10-12" })).toMatch(/goals_no_overlap/);
  });

  it("refuses the same target saved for the other arm: both sides count as one (schema v2)", async () => {
    expect(await tryGoal({ id: "ov-right", side: "right", from: "2026-10-01", to: "2026-10-31" })).toMatch(/goals_no_overlap/);
  });

  it("allows the next period, another measure or period, a movement target, and another user", async () => {
    expect(await tryGoal({ id: "ok-next", from: "2026-11-01" })).toBeNull();
    expect(await tryGoal({ id: "ok-holds", metric: "deliberate_hold_seconds", target: 600, from: "2026-10-01", to: "2026-10-31" })).toBeNull();
    expect(await tryGoal({ id: "ok-rolling", period: "rolling_7d", from: "2026-10-01", to: "2026-10-31" })).toBeNull();
    expect(await tryGoal({ id: "ok-action", node: null, action: "wrist.extension", from: "2026-10-01", to: "2026-10-31" })).toBeNull();
    expect(await tryGoal({ id: "ok-user-b", from: "2026-10-01", to: "2026-10-31" }, userB)).toBeNull();
  });

  it("checks the time zone against Postgres's IANA list, on insert and on update", async () => {
    expect(await tryGoal({ id: "tz-bad", node: "forearm.ed", from: "2026-10-01", zone: "Mars/Olympus_Mons" })).toMatch(/unknown time zone: Mars\/Olympus_Mons/);
    expect(await tryGoal({ id: "tz-ny", node: "forearm.ed", from: "2026-10-01", zone: "America/New_York" })).toBeNull();
    expect(await as(db, userA, () => failure(db, "update specialization.goals set timezone = 'Not/AZone' where id = 'tz-ny'"))).toMatch(/unknown time zone/);
  });

  it("refuses an end before the start, two targets or none, and a target that is not above zero or is a typo", async () => {
    expect(await tryGoal({ id: "bad-dates", node: "forearm.edm", from: "2026-10-10", to: "2026-10-09" })).toMatch(/goals_dates_in_order/);
    expect(await tryGoal({ id: "bad-both", node: "forearm.edm", action: "wrist.extension", from: "2026-10-01" })).toMatch(/goals_one_target/);
    expect(await tryGoal({ id: "bad-neither", node: null, action: null, from: "2026-10-01" })).toMatch(/goals_one_target/);
    for (const target of [0, -3, "NaN", 10_001]) expect(await tryGoal({ id: `bad-target-${target}`, node: "forearm.edm", target, from: "2026-10-01" }), String(target)).toMatch(/goals_target_check/);
    expect(await tryGoal({ id: "bad-side", node: "forearm.edm", side: "both", from: "2026-10-01" })).toMatch(/goals_side_check/);
    expect(await tryGoal({ id: "high-target", node: "forearm.edm", target: 40, from: "2026-10-01" })).toBeNull();
  });
});

// ---------------------------------------------------------------- rollback

describe("rollback", () => {
  // Schema v1's header line, on the pair it was written for (seed v1). Every later file is
  // forward-only: after schema v2 this line would destroy published history (04-database.md §10).
  it("drops cleanly with schema v1's header SQL, and schema v1 and seed v1 apply again", async () => {
    const fresh = await createSupabaseLikeDb();
    try {
      await applyMigration(fresh, SCHEMA_MIGRATION_PATH);
      // Before anything is published, the reference tables can still be cleared.
      await fresh.exec(`
        insert into specialization.regions (id, label, heading, status, entry_label, external_group, incidental_work, progress_subtitle) values ('zz_region', 'Test', 'Test', 'fixture', 'Test', 'Test', 'test', 'Test');
        insert into specialization.mapping_versions (version_key, region_id, method_notes) values ('zz_draft', 'zz_region', 'Draft.');
      `);
      expect(await scriptFailure(fresh, "truncate specialization.mapping_versions, specialization.rule_versions cascade")).toBeNull();
      expect(await scriptFailure(fresh, "delete from specialization.regions where id = 'zz_region'")).toBeNull();
      await applyMigration(fresh, SEED_V1_MIGRATION_PATH);
      await fresh.query("select set_config('request.jwt.claim.sub', $1, false)", [USER_A]);
      await fresh.exec("set role authenticated");
      await fresh.query("insert into specialization.goals (id, region_id, node_id, side, metric, target, period, starts_on, timezone) values ('rollback-goal', 'forearm', 'forearm.br', 'left', 'direct_dynamic_bouts', 8, 'calendar_week', '2026-10-12', 'UTC')");
      await fresh.exec("reset role");

      const rollback = readMigration(SCHEMA_MIGRATION_PATH).split("\n").find((line) => /^--\s+drop schema if exists specialization cascade;$/.test(line));
      expect(rollback).toBeDefined();
      await fresh.exec(rollback!.replace(/^--\s+/, ""));
      expect((await fresh.query<{ n: number }>("select count(*)::int as n from pg_namespace where nspname = 'specialization'")).rows[0].n).toBe(0);
      expect((await fresh.query<{ n: number }>("select count(*)::int as n from pg_extension where extname = 'btree_gist'")).rows[0].n).toBe(1);

      await applyMigration(fresh, SCHEMA_MIGRATION_PATH);
      await applyMigration(fresh, SEED_V1_MIGRATION_PATH);
      const [after] = (await fresh.query<{ mappings: number; goals: number }>("select (select count(*)::int from specialization.variant_mappings) as mappings, (select count(*)::int from specialization.goals) as goals")).rows;
      expect(after).toEqual({ mappings: forearmRegionData.mappings.length, goals: 0 });
    } finally {
      await fresh.close();
    }
  }, SETUP);
});

// ---------------------------------------------------------------- how it reaches production

describe("applied as one DO block per file, the way it reaches production", () => {
  it("wraps a file as exactly one statement, with quote tags the file does not contain", () => {
    for (const path of [SCHEMA_MIGRATION_PATH, SEED_V1_MIGRATION_PATH, SCHEMA_V2_MIGRATION_PATH, SEED_V2_MIGRATION_PATH, SEED_MIGRATION_PATH]) {
      const text = readMigration(path);
      const block = asDoBlock(text);
      expect(block.startsWith("do $outer$ declare body text := $body$")).toBe(true);
      expect(block.endsWith("$body$; begin execute body; end $outer$;")).toBe(true);
      expect(block.slice("do $outer$ declare body text := $body$".length, -"$body$; begin execute body; end $outer$;".length)).toBe(text);
      // Nothing a function's EXECUTE cannot run: no transaction control, nothing CONCURRENTLY.
      const code = text.split("\n").filter((line) => !/^\s*--/.test(line)).join("\n");
      expect(code).not.toMatch(/\b(commit|rollback|savepoint|release)\b\s*;|\bstart\s+transaction\b|\bbegin\s*(transaction|work)?\s*;|\bconcurrently\b/i);
    }
    expect(asDoBlock("select '$body$ and $outer$'")).toMatch(/^do \$outer1\$ declare body text := \$body1\$/);
  });

  /**
   * The runbook (04-database.md §9) names every existing table the files lock, so the
   * owner can choose the moment to apply them. Schema v1's foreign keys take SHARE ROW
   * EXCLUSIVE on what they reference, which blocks writes there (sign-ups, sign-ins and
   * account deletions on auth.users) until it commits; a seed only reads and key-shares.
   * Schema v2 locks nothing outside the schema (server/specializationSchemaV2.test.ts).
   */
  it("locks only the existing tables the runbook names: auth.users, public.muscles and public.exercises", async () => {
    const fresh = await createSupabaseLikeDb();
    const held = () =>
      rows<{ relation: string; mode: string }>(
        fresh,
        `select n.nspname || '.' || c.relname as relation, l.mode from pg_locks l
         join pg_class c on c.oid = l.relation join pg_namespace n on n.oid = c.relnamespace
         where l.locktype = 'relation' and l.pid = pg_backend_pid() and c.relkind in ('r', 'p')
           and n.nspname not in ('specialization', 'pg_catalog', 'information_schema')
         order by 1, 2`,
      );
    try {
      await fresh.exec("begin");
      await applyMigration(fresh, SCHEMA_MIGRATION_PATH);
      expect(await held()).toEqual(
        ["auth.users", "public.exercises", "public.muscles"].flatMap((relation) => [{ relation, mode: "AccessShareLock" }, { relation, mode: "ShareRowExclusiveLock" }]),
      );
      await fresh.exec("commit");
      // Each seed over the files production applies before it. It reads public.exercises for the
      // catalog links, and foreign-key checks key-share the rows they name. Neither blocks ordinary writes.
      const seedLocks = [{ relation: "public.exercises", mode: "AccessShareLock" }, { relation: "public.exercises", mode: "RowShareLock" }, { relation: "public.muscles", mode: "RowShareLock" }];
      await fresh.exec("begin");
      await applyMigration(fresh, SEED_V1_MIGRATION_PATH);
      expect(await held()).toEqual(seedLocks);
      await fresh.exec("commit");
      await applyMigration(fresh, SCHEMA_V2_MIGRATION_PATH);
      // Seed v2 over schema v2, as production ran it, then the current seed over seed v2.
      for (const path of [SEED_V2_MIGRATION_PATH, SEED_MIGRATION_PATH]) {
        await fresh.exec("begin");
        await applyMigration(fresh, path);
        const locks = await held();
        expect(locks, basename(path)).toContainEqual({ relation: "public.exercises", mode: "AccessShareLock" });
        expect(seedLocks, basename(path)).toEqual(expect.arrayContaining(locks));
        await fresh.exec("commit");
      }
    } finally {
      await fresh.close();
    }
  }, SETUP);

  it("gives the same database as applying the files directly, every file in production's order, and refuses a changed seed the same way, applying none of it", async () => {
    const direct = await createSupabaseLikeDb();
    const wrapped = await createSupabaseLikeDb();
    try {
      for (const path of [...MIGRATION_STEPS.map((entry) => entry.path), SEED_MIGRATION_PATH]) {
        await applyMigration(direct, path);
        await applyMigrationAsDoBlock(wrapped, path);
      }
      const expected = await snapshot(direct);
      expect(expected.data.variant_mappings).toHaveLength(publishedMappings.length);
      expect(expected.catalog.triggers.length).toBeGreaterThan(20);
      expect(await snapshot(wrapped)).toEqual(expected);

      const changed = emitSeedSql({
        ...productionSeedInput(),
        regions: registeredRegionContents.map((content) => ({ ...content, variants: content.variants.map((variant) => (variant.id === "cat-403" ? { ...variant, deliberateHold: !variant.deliberateHold } : variant)) })),
      });
      const refusal = /variant cat-403 is used by mapping version forearm_mappings_v1 \(published\)/;
      expect(await scriptFailure(direct, changed)).toMatch(refusal);
      expect(await scriptFailure(wrapped, asDoBlock(changed))).toMatch(refusal);
      expect(await snapshot(wrapped)).toEqual(expected);
      expect(await snapshot(direct)).toEqual(expected);
    } finally {
      await direct.close();
      await wrapped.close();
    }
  }, SETUP);
});
