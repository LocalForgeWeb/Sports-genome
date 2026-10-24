import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { registeredRegionContents } from "@shared/specialization/registry";
import { emitSeedSql, productionSeedInput } from "../scripts/specialization/emit-seed";
import {
  APPLIED_MIGRATION_PATHS,
  MIGRATION_STEPS,
  PENDING_MIGRATION_PATHS,
  SCHEMA_V2_MIGRATION_PATH,
  SEED_MIGRATION_PATH,
  SEED_V1_MIGRATION_PATH,
  SEED_V2_MIGRATION_PATH,
  SEED_V3_MIGRATION_PATH,
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
  migrationRecord,
  readMigration,
  recordMigration,
  replayMigrations,
  rowVersions,
  rows,
  scriptFailure,
  snapshot,
} from "./fixtures/specializationPg";

/**
 * Schema v2 (supabase/migrations/…_specialization_atlas_schema_v2.sql; 10-multi-region.md §5;
 * 04-database.md §10) in PGlite: its five tables with their grants and row-level security as
 * anon, two users and the service role; every guard and refusal, the prototype experiment's
 * included; publication rules 10 to 13; what it writes over schema v1 and seed v1 (nothing but
 * the forearm region row's new columns); the DO-block route and its locks; the undo; and the
 * apply tool's SQL, run with the `http` extension stood in for. The schema v1 tests run on the same
 * release database in server/specializationSchema.test.ts.
 */

const SETUP = 120_000;
const UNDO_PATH = resolve(process.cwd(), "scripts/specialization/release/schema_v2_undo.sql");
const APPLY_TOOL = resolve(process.cwd(), "scripts/specialization/release/make-apply-sql.mjs");

const NEW_TABLES = ["region_actions", "region_nodes", "variant_attributes", "variant_dimension_values", "variant_dimensions"];
const NEW_FUNCTIONS = [
  "specialization.check_goal_target()",
  "specialization.check_node_memberships()",
  "specialization.check_region_node_role()",
  "specialization.check_region_sides()",
  "specialization.guard_frozen_variant_attribute()",
  "specialization.guard_published_region()",
  "specialization.guard_published_region_node()",
];
const REGION_COLUMNS = ["side_model", "side_limb", "side_word", "side_word_plural", "catalog_keys", "region_only_tag_scope", "external_heading", "measurement_defaults", "on_side_template"];
const FOREARM_SIDES = {
  side_model: "paired",
  side_limb: "arm",
  side_word: "arm",
  side_word_plural: "arms",
  catalog_keys: ["forearms"],
  region_only_tag_scope: "any",
  external_heading: "Forearm muscles credited here",
  measurement_defaults: { circumference_cm: { landmark: "Thickest point", posture: "arm_relaxed_hanging" }, grip_force_n: { landmark: "Dynamometer grip", posture: "elbow_90_supported" } },
  on_side_template: "your {side} forearm",
};
const PAGE_WORDS = "heading, entry_label, external_group, incidental_work, progress_subtitle";
const PAGE_VALUES = "'Test specialization', 'Explore test coverage', 'Other muscles credited here', 'bracing', 'Performance from your logged sets'";
/** What the current seed lists, from the registered content: every region's members and actions (the forearm's and the upper arm's). */
const SEEDED_MEMBERS = registeredRegionContents.reduce((n, content) => n + content.members.length, 0);
const SEEDED_ACTIONS = registeredRegionContents.map((content) => ({ region_id: content.region.id, n: content.actions.length })).sort((a, b) => a.region_id.localeCompare(b.region_id));
const SEEDED_ACTION_COUNT = SEEDED_ACTIONS.reduce((n, region) => n + region.n, 0);

const userA = { user: USER_A };
const userB = { user: USER_B };

let db: PGlite;

beforeAll(async () => {
  db = await createReleaseDb();
}, SETUP);

afterAll(async () => {
  await db?.close();
});

/**
 * Runs `body` on a database as production held it before wave A: replayed through seed v2, the
 * upper arm a reference region with no version. The file's helpers read it while `body` runs. For
 * the cases that need a region with no page, which the release database (from seed v3 on, the
 * upper arm promoted) no longer has.
 */
async function atSeedV2(body: () => Promise<void>): Promise<void> {
  const release = db;
  db = await createSupabaseLikeDb();
  try {
    await replayMigrations(db, "seed v2");
    await body();
  } finally {
    await db.close();
    db = release;
  }
}

// ---------------------------------------------------------------- helpers for test rows

/** The refusal a statement (or a script, without parameters) meets, or null; whatever it did is rolled back either way. */
async function attempt(sql: string, params: unknown[] = []): Promise<string | null> {
  await db.exec("begin");
  try {
    return params.length > 0 ? await failure(db, sql, params) : await scriptFailure(db, sql);
  } finally {
    await db.exec("rollback");
  }
}

/** The counting dimensions with their values (10-multi-region.md §3) and two descriptive ones, as the seed will write them; rows it already wrote stay. */
const DIMENSIONS = `
  insert into specialization.variant_dimensions (id, label, sort_order, kind) values
    ('sided_by', 'Side recorded for', 0, 'counting'), ('leg_laterality', 'Legs', 1, 'counting'), ('side_anchor', 'Leg side named by', 2, 'counting'),
    ('grip_width', 'Grip width', 10, 'descriptive'), ('stance', 'Stance', 11, 'descriptive')
  on conflict (id) do nothing;
  insert into specialization.variant_dimension_values (dimension_id, value, label, sort_order) values
    ('sided_by', 'arm', 'Arm', 0), ('sided_by', 'leg', 'Leg', 1), ('sided_by', 'none', 'Neither', 2),
    ('leg_laterality', 'bilateral', 'Both legs', 0), ('leg_laterality', 'unilateral', 'One leg', 1), ('leg_laterality', 'either', 'Either leg', 2), ('leg_laterality', 'not_applicable', 'Legs do no work', 3),
    ('side_anchor', 'working_leg', 'Working leg', 0), ('side_anchor', 'front_leg', 'Front leg', 1), ('side_anchor', 'stance_leg', 'Standing leg', 2), ('side_anchor', 'top_leg', 'Top leg', 3), ('side_anchor', 'bottom_leg', 'Bottom leg', 4),
    ('grip_width', 'narrow', 'Narrow', 0), ('grip_width', 'shoulder', 'Shoulder width', 1), ('grip_width', 'wide', 'Wide', 2),
    ('stance', 'bilateral', 'Both feet', 0), ('stance', 'split', 'Split', 1), ('stance', 'staggered', 'Staggered', 2)
  on conflict (dimension_id, value) do nothing;`;

/** An attribute the seed has not written; one it has is left as it is. */
const giveAttribute = (variant: string, dimension: string, value: string) =>
  db.query("insert into specialization.variant_attributes (variant_key, dimension_id, value) values ($1, $2, $3) on conflict do nothing", [variant, dimension, value]);

async function newVariant(key: string, catalogId: number, name: string, laterality = "bilateral") {
  await db.query("insert into specialization.catalog_exercises (catalog_id, name) values ($1, $2)", [catalogId, name]);
  await db.query(
    `insert into specialization.exercise_variants (variant_key, catalog_id, organization, forearm_orientation, wrist_position, grip_type, straps, laterality, phase, measure, deliberate_hold)
     values ($1, $2, 'multi_joint', 'not_applicable', 'not_applicable', 'none', 'not_applicable', $3, 'concentric_eccentric', 'reps', false)`,
    [key, catalogId, laterality],
  );
}

/** A reviewed muscle with a reviewed, sourced function claim and the node action resting on it: rules 5 to 9 pass for it. */
async function newMuscle(id: string, region: string, action: string) {
  await db.query(
    `insert into specialization.nodes (id, region_id, kind, role, name, short_name, layer, surface_visibility, status, location, what_it_does, shape_note)
     values ($1, $2, 'muscle', 'target', $1, 'T', 'surface', 'clear', 'reviewed', 'Test', 'Test', 'Test')`,
    [id, region],
  );
  await db.query("insert into specialization.claims (claim_key, node_id, kind, statement, basis, review_status) values ($1, $2, 'function', 'Test.', 'established_anatomy', 'draft')", [`${region}:${id}.function`, id]);
  await db.query("insert into specialization.claim_sources (claim_id, source_id, locator) select c.id, s.id, 'Test' from specialization.claims c, specialization.sources s where c.claim_key = $1 and s.source_key = 'A8'", [`${region}:${id}.function`]);
  await db.query("update specialization.claims set review_status = 'reviewed', reviewed_on = '2026-10-19' where claim_key = $1", [`${region}:${id}.function`]);
  await db.query("insert into specialization.node_actions (node_id, action_id, role, claim_id) select $1, $2, 'prime', id from specialization.claims where claim_key = $3", [id, action, `${region}:${id}.function`]);
}

type TestMapping = { key: string; variant: string; node: string; action: string | null; sideRelation?: string };

/** A draft version with reviewed, located mappings. */
async function draftVersion(key: string, region: string, mappings: TestMapping[]) {
  await db.query("insert into specialization.mapping_versions (version_key, region_id, method_notes) values ($1, $2, 'Test version.')", [key, region]);
  for (const mapping of mappings) {
    await db.query(
      `insert into specialization.variant_mappings (version_id, mapping_key, variant_key, node_id, action_id, relationship, muscle_mode, evidence_basis, rationale, review_status, side_relation)
       select v.id, $2, $3, $4, $5, 'direct', 'dynamic', 'anatomy', 'Test mapping.', 'reviewed', $6 from specialization.mapping_versions v where v.version_key = $1`,
      [key, mapping.key, mapping.variant, mapping.node, mapping.action, mapping.sideRelation ?? "same"],
    );
    await db.query(
      `insert into specialization.mapping_sources (mapping_id, source_id, locator)
       select m.id, s.id, 'Test' from specialization.variant_mappings m join specialization.mapping_versions v on v.id = m.version_id, specialization.sources s
       where v.version_key = $1 and m.mapping_key = $2 and s.source_key = 'A8'`,
      [key, mapping.key],
    );
  }
}

const publish = (key: string) => failure(db, "update specialization.mapping_versions set state = 'published' where version_key = $1", [key]);
const problemsOf = async (key: string) =>
  (await rows<{ problems: string | null }>(db, "select specialization.mapping_version_problems(id) as problems from specialization.mapping_versions where version_key = $1", [key]))[0].problems;
const dropDraft = (key: string) => db.query("delete from specialization.mapping_versions where version_key = $1 and state = 'draft'", [key]);

// ---------------------------------------------------------------- structure and privileges

describe("structure", () => {
  const columns = (table: string) =>
    rows<{ c: string }>(
      db,
      `select column_name || ' ' || data_type || case when is_nullable = 'NO' then ' not null' else '' end || coalesce(' default ' || column_default, '') as c
       from information_schema.columns where table_schema = 'specialization' and table_name = $1 order by ordinal_position`,
      [table],
    ).then((found) => found.map((row) => row.c));

  it("creates the five tables with row-level security on, their columns as §5.1 lists them", async () => {
    const tables = await rows<{ relname: string; rls: boolean }>(
      db,
      "select c.relname, c.relrowsecurity as rls from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'specialization' and c.relkind = 'r' and c.relname = any($1)",
      [NEW_TABLES],
    );
    expect(tables.sort((a, b) => (a.relname < b.relname ? -1 : 1))).toEqual(NEW_TABLES.map((relname) => ({ relname, rls: true })));
    expect(await columns("region_nodes")).toEqual([
      "region_id text not null", "node_id text not null", "role text not null", "sort_order integer not null default 0",
      "caveats ARRAY not null default '{}'::text[]", "listed boolean not null default true",
    ]);
    expect(await columns("region_actions")).toEqual(["region_id text not null", "action_id text not null", "sort_order integer not null default 0", "listed boolean not null default true"]);
    expect(await columns("variant_dimensions")).toEqual(["id text not null", "label text not null", "sort_order integer not null default 0", "kind text not null"]);
    expect(await columns("variant_dimension_values")).toEqual(["dimension_id text not null", "value text not null", "label text not null", "sort_order integer not null default 0"]);
    expect(await columns("variant_attributes")).toEqual(["variant_key text not null", "dimension_id text not null", "value text not null", "notes text", "frozen_at timestamp with time zone"]);
    expect((await columns("regions")).slice(-REGION_COLUMNS.length)).toEqual([
      "side_model text", "side_limb text", "side_word text", "side_word_plural text", "catalog_keys ARRAY not null default '{}'::text[]",
      "region_only_tag_scope text not null default 'any'::text", "external_heading text", "measurement_defaults jsonb not null default '{}'::jsonb", "on_side_template text",
    ]);
    expect((await columns("variant_mappings")).at(-1)).toBe("side_relation text not null default 'same'::text");
    expect((await columns("diagram_assets")).at(-1)).toBe("sides text");
  });

  it("keys every table, and keys goals into the memberships and region actions", async () => {
    const defs = await rows<{ relname: string; conname: string; def: string }>(
      db,
      `select t.relname, c.conname, pg_get_constraintdef(c.oid) as def from pg_constraint c join pg_class t on t.oid = c.conrelid join pg_namespace n on n.oid = t.relnamespace
       where n.nspname = 'specialization' and c.contype in ('p', 'f') and (t.relname = any($1) or c.conname like 'goals\\_%\\_in\\_region') order by 1, 2`,
      [NEW_TABLES],
    );
    expect(defs.map(({ conname, def }) => `${conname}: ${def}`)).toEqual([
      "goals_action_in_region: FOREIGN KEY (region_id, action_id) REFERENCES specialization.region_actions(region_id, action_id)",
      "goals_node_in_region: FOREIGN KEY (region_id, node_id) REFERENCES specialization.region_nodes(region_id, node_id)",
      "region_actions_action_id_fkey: FOREIGN KEY (action_id) REFERENCES specialization.actions(id)",
      "region_actions_pkey: PRIMARY KEY (region_id, action_id)",
      "region_actions_region_id_fkey: FOREIGN KEY (region_id) REFERENCES specialization.regions(id)",
      "region_nodes_node_id_fkey: FOREIGN KEY (node_id) REFERENCES specialization.nodes(id)",
      "region_nodes_pkey: PRIMARY KEY (region_id, node_id)",
      "region_nodes_region_id_fkey: FOREIGN KEY (region_id) REFERENCES specialization.regions(id)",
      "variant_attributes_pkey: PRIMARY KEY (variant_key, dimension_id)",
      "variant_attributes_value_listed: FOREIGN KEY (dimension_id, value) REFERENCES specialization.variant_dimension_values(dimension_id, value)",
      "variant_attributes_variant_key_fkey: FOREIGN KEY (variant_key) REFERENCES specialization.exercise_variants(variant_key)",
      "variant_dimension_values_dimension_id_fkey: FOREIGN KEY (dimension_id) REFERENCES specialization.variant_dimensions(id)",
      "variant_dimension_values_pkey: PRIMARY KEY (dimension_id, value)",
      "variant_dimensions_pkey: PRIMARY KEY (id)",
    ]);
    const indexes = (await rows<{ indexname: string }>(db, "select indexname from pg_indexes where schemaname = 'specialization'")).map((row) => row.indexname);
    expect(indexes).toEqual(expect.arrayContaining(["region_nodes_node_idx", "variant_attributes_value_idx"]));
  });

  it("grants authenticated select and the service role select, insert, update and delete on each new table; nothing to PUBLIC or anon", async () => {
    const grants = await rows<{ table_name: string; grantee: string; privileges: string }>(
      db,
      `select c.relname as table_name, coalesce(r.rolname, 'PUBLIC') as grantee, string_agg(a.privilege_type, ',' order by a.privilege_type) as privileges
       from pg_class c join pg_namespace n on n.oid = c.relnamespace cross join lateral aclexplode(c.relacl) a left join pg_roles r on r.oid = a.grantee
       where n.nspname = 'specialization' and c.relname = any($1) and coalesce(r.rolname, 'PUBLIC') <> current_user group by 1, 2`,
      [NEW_TABLES],
    );
    expect(grants.sort((a, b) => (`${a.table_name} ${a.grantee}` < `${b.table_name} ${b.grantee}` ? -1 : 1))).toEqual(
      NEW_TABLES.flatMap((table) => [
        { table_name: table, grantee: "authenticated", privileges: "SELECT" },
        { table_name: table, grantee: "service_role", privileges: "DELETE,INSERT,SELECT,UPDATE" },
      ]),
    );
  });

  it("creates its functions SECURITY INVOKER with an empty search_path, executable by no API role, and writes no default privileges", async () => {
    const fns = await rows<{ fn: string; definer: boolean; config: string[]; executors: string[] }>(
      db,
      `select p.oid::regprocedure::text as fn, p.prosecdef as definer, p.proconfig as config,
              coalesce((select array_agg(coalesce(r.rolname, 'PUBLIC')) from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a left join pg_roles r on r.oid = a.grantee
                        where a.privilege_type = 'EXECUTE' and coalesce(r.rolname, 'PUBLIC') <> current_user), '{}') as executors
       from pg_proc p join pg_namespace n on n.oid = p.pronamespace where p.oid::regprocedure::text = any($1)`,
      [NEW_FUNCTIONS],
    );
    expect(fns.map((fn) => fn.fn).sort()).toEqual(NEW_FUNCTIONS);
    for (const fn of fns) expect(fn, fn.fn).toMatchObject({ definer: false, config: ['search_path=""'], executors: [] });
    // The two restated functions keep v1's ACL: execute on the publication rule for the service role only.
    expect(await rows(db, "select has_function_privilege('service_role', 'specialization.mapping_version_problems(uuid)', 'EXECUTE') as service, has_function_privilege('authenticated', 'specialization.mapping_version_problems(uuid)', 'EXECUTE') as signed_in")).toEqual([
      { service: true, signed_in: false },
    ]);
    const code = readMigration(SCHEMA_V2_MIGRATION_PATH).split("\n").filter((line) => !/^\s*--/.test(line)).join("\n");
    expect(code).not.toMatch(/alter default privileges|security definer/i);
    expect(await count(db, "select 1 from pg_default_acl")).toBe(0);
  });

  it("marks nodes.role, nodes.sort_order and actions.sort_order as legacy", async () => {
    const comments = await rows<{ column: string; comment: string }>(
      db,
      `select c.relname || '.' || a.attname as column, col_description(c.oid, a.attnum) as comment from pg_attribute a join pg_class c on c.oid = a.attrelid join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'specialization' and (c.relname, a.attname) in (('nodes', 'role'), ('nodes', 'sort_order'), ('actions', 'sort_order')) order by 1`,
    );
    expect(comments.map((row) => row.column)).toEqual(["actions.sort_order", "nodes.role", "nodes.sort_order"]);
    for (const { column, comment } of comments) expect(comment, column).toMatch(/^Legacy \(schema v1\).* Readers use region_(nodes|actions)\.(role|sort_order)\.$/);
  });
});

// ---------------------------------------------------------------- what it writes over schema v1 and seed v1

describe("what schema v2 writes", () => {
  // Over schema v1 and seed v1, before seed v2 lists the rest: the rows schema v2 writes itself.
  let backfilled: PGlite;
  beforeAll(async () => {
    backfilled = await createSupabaseLikeDb();
    await replayMigrations(backfilled, "schema v2 again");
  }, SETUP);
  afterAll(async () => {
    await backfilled?.close();
  });

  it("lists the muscles the published version maps, in their version's region, with v1's role and order: 19 forearm targets and the biceps and brachialis as externals", async () => {
    const members = await rows<{ node_id: string; role: string; sort_order: number; caveats: string[]; listed: boolean }>(backfilled, "select node_id, role, sort_order, caveats, listed from specialization.region_nodes where region_id = 'forearm' order by node_id");
    const mapped = await rows<{ node_id: string; role: string; sort_order: number }>(
      backfilled,
      `select distinct m.node_id, case when n.region_id = 'forearm' then n.role else 'external' end as role, n.sort_order
       from specialization.variant_mappings m join specialization.mapping_versions v on v.id = m.version_id join specialization.nodes n on n.id = m.node_id
       where v.version_key = 'forearm_mappings_v1' order by 1`,
    );
    expect(members).toEqual(mapped.map((row) => ({ ...row, caveats: [], listed: true })));
    expect(members.filter((row) => row.role === "target")).toHaveLength(19);
    expect(members.filter((row) => row.role === "external").map((row) => row.node_id)).toEqual(["upper_arm.biceps", "upper_arm.brachialis"]);
    expect(await count(backfilled, "select 1 from specialization.region_nodes where region_id <> 'forearm'")).toBe(0);
  });

  it("lists the forearm's 20 actions in v1's order", async () => {
    const offered = await rows(backfilled, "select action_id, sort_order, listed from specialization.region_actions where region_id = 'forearm' order by sort_order");
    expect(offered).toEqual(await rows(backfilled, "select id as action_id, sort_order, true as listed from specialization.actions order by sort_order"));
    expect(offered).toHaveLength(20);
    expect(await count(backfilled, "select 1 from specialization.region_actions where region_id <> 'forearm'")).toBe(0);
  });

  it("writes the forearm's side model, words, side sentence, catalog keys, tag scope, external heading and measure defaults; the upper arm, a reference region, gets none; no drawing gets sides", async () => {
    const regions = await rows<Record<string, unknown>>(backfilled, `select id, ${REGION_COLUMNS.join(", ")} from specialization.regions order by id`);
    expect(regions).toEqual([
      { id: "forearm", ...FOREARM_SIDES },
      { id: "upper_arm", side_model: null, side_limb: null, side_word: null, side_word_plural: null, catalog_keys: [], region_only_tag_scope: "any", external_heading: null, measurement_defaults: {}, on_side_template: null },
    ]);
    expect(await rows(backfilled, "select asset_key, sides from specialization.diagram_assets")).toEqual([{ asset_key: "forearm_schematic", sides: null }]);
  });

  it("keeps every forearm_mappings_v1 row on side relation 'same', and the version passing its publication rule (rules 11 and 12 are not read for it)", async () => {
    expect(await rows(db, "select side_relation, count(*)::int as n from specialization.variant_mappings group by 1")).toEqual([{ side_relation: "same", n: await count(db, "select 1 from specialization.variant_mappings") }]);
    expect(await problemsOf("forearm_mappings_v1")).toBeNull();
    // It maps the biceps, whose home is the upper arm, and its variants carry no attributes: rules 12 and 11 would refuse a draft like it.
    expect(await count(db, "select 1 from specialization.variant_mappings m join specialization.nodes n on n.id = m.node_id where n.region_id <> 'forearm'")).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------- who can read and write the new tables

describe("row-level security on the new tables", () => {
  beforeAll(async () => {
    await as(db, "service_role", async () => {
      await db.exec(`
        ${DIMENSIONS}
        insert into specialization.regions (id, label, status, ${PAGE_WORDS}, side_model, side_limb, side_word, side_word_plural, on_side_template)
          values ('zz_hidden', 'Hidden', 'fixture', ${PAGE_VALUES}, 'paired', 'arm', 'arm', 'arms', 'your {side} arm');
        insert into specialization.region_actions (region_id, action_id) values ('zz_hidden', 'elbow.flexion');
        insert into specialization.nodes (id, region_id, kind, role, name, short_name, layer, surface_visibility, status, location, what_it_does, shape_note) values
          ('zz_hidden.muscle', 'zz_hidden', 'muscle', 'target', 'Fixture muscle', 'FM', 'surface', 'clear', 'reviewed', 'Test', 'Test', 'Test'),
          ('forearm.zz_draft', 'forearm', 'muscle', 'target', 'Draft muscle', 'DM', 'surface', 'clear', 'draft', 'Test', 'Test', 'Test');
        insert into specialization.region_nodes (region_id, node_id, role) values ('zz_hidden', 'zz_hidden.muscle', 'target'), ('forearm', 'forearm.zz_draft', 'target');
        update specialization.region_nodes set listed = false where region_id = 'forearm' and node_id = 'forearm.anconeus';
        insert into specialization.variant_attributes (variant_key, dimension_id, value) values ('cat-140', 'sided_by', 'none') on conflict do nothing;
      `);
    });
  });

  it("anon is refused at the schema", async () => {
    await as(db, "anon", async () => {
      for (const table of NEW_TABLES) {
        expect(await failure(db, `select 1 from specialization.${table} limit 1`), table).toMatch(/permission denied for schema specialization/);
        expect(await failure(db, `insert into specialization.${table} default values`), table).toMatch(/permission denied for schema specialization/);
      }
    });
  });

  it("a signed-in user reads memberships of reviewed muscles in production and reference regions, unlisted ones too, and every dimension, value and attribute", async () => {
    const seenBy = (identity: { user: string }) =>
      as(db, identity, async () => ({
        members: (await rows<{ k: string }>(db, "select region_id || ' ' || node_id || case when listed then '' else ' (unlisted)' end as k from specialization.region_nodes order by 1")).map((row) => row.k),
        actions: await rows(db, "select region_id, count(*)::int as n from specialization.region_actions group by 1 order by 1"),
        dimensions: await count(db, "select 1 from specialization.variant_dimensions"),
        values: await count(db, "select 1 from specialization.variant_dimension_values"),
        attributes: await count(db, "select 1 from specialization.variant_attributes"),
      }));
    const a = await seenBy(userA);
    expect(a.members).toContain("forearm forearm.anconeus (unlisted)");
    expect(a.members).toContain("forearm upper_arm.biceps");
    expect(a.members.filter((member) => member.includes("zz_"))).toEqual([]);
    expect(a.members).toHaveLength(SEEDED_MEMBERS);
    expect(a.members).toContain("upper_arm upper_arm.biceps");
    expect(a.actions).toEqual(SEEDED_ACTIONS);
    expect(a).toMatchObject({
      dimensions: await count(db, "select 1 from specialization.variant_dimensions"),
      values: await count(db, "select 1 from specialization.variant_dimension_values"),
      attributes: await count(db, "select 1 from specialization.variant_attributes"),
    });
    expect(a.attributes).toBeGreaterThan(0);
    // Reference content is the same for every user.
    expect(await seenBy(userB)).toEqual(a);
  });

  it("a signed-in user cannot insert, update, delete or truncate any of them", async () => {
    const updatable: Record<string, string> = { region_nodes: "role", region_actions: "listed", variant_dimensions: "label", variant_dimension_values: "label", variant_attributes: "notes" };
    for (const who of [userA, userB]) {
      await as(db, who, async () => {
        for (const table of NEW_TABLES) {
          const denied = new RegExp(`permission denied for table ${table}`);
          expect(await failure(db, `insert into specialization.${table} default values`), `insert ${table}`).toMatch(denied);
          expect(await failure(db, `update specialization.${table} set ${updatable[table]} = ${updatable[table]}`), `update ${table}`).toMatch(denied);
          expect(await failure(db, `delete from specialization.${table}`), `delete ${table}`).toMatch(denied);
          expect(await failure(db, `truncate specialization.${table}`), `truncate ${table}`).toMatch(denied);
        }
      });
    }
  });

  it("the service role reads every row, hidden ones included, and writes them; it holds no TRUNCATE", async () => {
    await as(db, "service_role", async () => {
      expect(await count(db, "select 1 from specialization.region_nodes")).toBe(SEEDED_MEMBERS + 2);
      expect(await count(db, "select 1 from specialization.region_actions")).toBe(SEEDED_ACTION_COUNT + 1);
      expect(await failure(db, "insert into specialization.variant_dimensions (id, label, kind) values ('zz_dimension', 'Test', 'descriptive')")).toBeNull();
      expect(await failure(db, "update specialization.variant_dimensions set label = 'Renamed' where id = 'zz_dimension'")).toBeNull();
      expect(await failure(db, "delete from specialization.variant_dimensions where id = 'zz_dimension'")).toBeNull();
      for (const table of NEW_TABLES) expect(await failure(db, `truncate specialization.${table}`), table).toMatch(new RegExp(`permission denied for table ${table}`));
    });
  });

  it("the owner is refused truncating the memberships and attributes while a version is published, through CASCADE too", async () => {
    for (const table of ["region_nodes", "variant_attributes"]) {
      expect(await failure(db, `truncate specialization.${table} cascade`), table).toMatch(new RegExp(`specialization\\.${table} holds rows that published or retired mapping versions rest on; it cannot be truncated`));
    }
    // Reached through CASCADE from tables that have no guard of their own.
    expect(await failure(db, "truncate specialization.variant_dimensions cascade")).toMatch(/variant_attributes holds rows .* cannot be truncated/);
    expect(await count(db, "select 1 from specialization.region_nodes")).toBe(SEEDED_MEMBERS + 2);
  });
});

// ---------------------------------------------------------------- regions

describe("regions", () => {
  /** `sides`: side_model, side_limb, side_word, side_word_plural and on_side_template, as SQL. */
  const insertRegion = (id: string, status: string, sides: string) =>
    as(db, "service_role", () =>
      attempt(
        `insert into specialization.regions (id, label, status, ${status === "reference" ? "" : `${PAGE_WORDS}, `}side_model, side_limb, side_word, side_word_plural, on_side_template) values ($1, 'Test', $2, ${status === "reference" ? "" : `${PAGE_VALUES}, `}${sides})`,
        [id, status],
      ),
    );

  it("a production or fixture region has a complete side model, its sentence naming a side exactly when it is paired; a reference region needs none", async () => {
    const incomplete = /region zz_\w+ \((production|fixture|reference)\) needs a complete side model/;
    expect(await insertRegion("zz_none", "fixture", "null, null, null, null, null")).toMatch(incomplete);
    expect(await insertRegion("zz_none", "production", "null, null, null, null, null")).toMatch(incomplete);
    expect(await insertRegion("zz_no_words", "fixture", "'paired', 'leg', null, null, 'your {side} leg'")).toMatch(incomplete);
    expect(await insertRegion("zz_no_limb", "production", "'paired', null, 'leg', 'legs', 'your {side} leg'")).toMatch(incomplete);
    expect(await insertRegion("zz_midline_limb", "production", "'midline', 'arm', null, null, 'your core'")).toMatch(incomplete);
    expect(await insertRegion("zz_reference_part", "reference", "null, 'arm', null, null, null")).toMatch(incomplete);
    // The sentence: one {side} on a paired region, none on a midline region, none at all without a side model.
    expect(await insertRegion("zz_no_sentence", "production", "'paired', 'leg', 'leg', 'legs', null")).toMatch(incomplete);
    expect(await insertRegion("zz_no_slot", "production", "'paired', 'leg', 'leg', 'legs', 'your leg'")).toMatch(incomplete);
    expect(await insertRegion("zz_two_slots", "fixture", "'paired', 'leg', 'leg', 'legs', 'your {side} leg, the {side} one'")).toMatch(incomplete);
    expect(await insertRegion("zz_midline_slot", "production", "'midline', null, null, null, 'your {side} core'")).toMatch(incomplete);
    expect(await insertRegion("zz_midline_silent", "production", "'midline', null, null, null, null")).toMatch(incomplete);
    expect(await insertRegion("zz_reference_sentence", "reference", "null, null, null, null, 'your {side} arm'")).toMatch(incomplete);
    expect(await insertRegion("zz_blank_sentence", "fixture", "'paired', 'arm', 'arm', 'arms', ' '")).toMatch(/regions_on_side_template_check/);
    expect(await insertRegion("zz_legs", "production", "'paired', 'leg', 'leg', 'legs', 'your {side} leg'")).toBeNull();
    expect(await insertRegion("zz_sides", "fixture", "'paired', 'arm', 'side', 'sides', 'the {side} side of your chest'")).toBeNull();
    expect(await insertRegion("zz_core", "production", "'midline', null, null, null, 'your core'")).toBeNull();
    expect(await insertRegion("zz_reference", "reference", "null, null, null, null, null")).toBeNull();
    // A reference region may also hold a complete one: the upper arm's, from its record (written by the current seed).
    expect(await insertRegion("zz_reference_whole", "reference", "'paired', 'arm', 'arm', 'arms', 'your {side} arm'")).toBeNull();
    expect(await insertRegion("zz_bad_model", "fixture", "'crossed', 'arm', 'arm', 'arms', 'your {side} arm'")).toMatch(/regions_side_model_check/);
    expect(await insertRegion("zz_bad_limb", "fixture", "'paired', 'tail', 'tail', 'tails', 'your {side} tail'")).toMatch(/regions_side_limb_check/);
    expect(await insertRegion("zz_blank", "fixture", "'paired', 'arm', ' ', 'arms', 'your {side} arm'")).toMatch(/regions_side_word_check/);
    // A reference region with no version and no side model is promoted with one, or not at all.
    const promote = (sides: string) =>
      as(db, "service_role", () =>
        attempt(`
          insert into specialization.regions (id, label, status) values ('zz_promoted', 'Test', 'reference');
          update specialization.regions set status = 'production', ${PAGE_WORDS.split(", ").map((column) => `${column} = 'Test'`).join(", ")}${sides} where id = 'zz_promoted';
        `),
      );
    expect(await promote("")).toMatch(/region zz_promoted \(production\) needs a complete side model/);
    expect(await promote(", side_model = 'paired', side_limb = 'arm', side_word = 'arm', side_word_plural = 'arms'")).toMatch(/region zz_promoted \(production\) needs a complete side model/);
    expect(await promote(", side_model = 'paired', side_limb = 'arm', side_word = 'arm', side_word_plural = 'arms', on_side_template = 'your {side} arm'")).toBeNull();
  });

  it("is checked on the stored row, so seed v1's upsert of the forearm row, which names none of these columns, passes, changing only the one v1 column seed v2 rewords", async () => {
    const seedV1 = readMigration(SEED_V1_MIGRATION_PATH);
    const start = seedV1.indexOf("insert into specialization.regions as t");
    const upsert = seedV1.slice(start, seedV1.indexOf(";\n", start) + 1);
    expect(upsert).not.toMatch(/side_model/);
    // From seed v3 it is refused whole: it would demote the upper arm, whose published version keeps its status (§1.3: seed v1
    // is never run again after v2).
    expect(await as(db, "service_role", () => attempt(upsert))).toMatch(/region upper_arm has mapping version upper_arm_mappings_v1 \(published\); its status, side model, limb, catalog keys and region-only tag scope, which decide what counts there, cannot change/);
    // Over seed v2, as production held it before wave A, the forearm's row passes.
    await atSeedV2(async () => {
    const regionRows = () => rows<{ id: string; row: Record<string, unknown>; v: string }>(db, "select id, to_jsonb(r) as row, xmin::text || '@' || ctid::text as v from specialization.regions r where id in ('forearm', 'upper_arm') order by id");
    const [forearm, upperArm] = await regionRows();
    // Seed v2 rewords the forearm's Progress subtitle (both sides as one: no "by arm"), so seed v1's
    // upsert really writes the row, and the side model it does not name is read from the stored row.
    expect(forearm.row.progress_subtitle).toBe("Circumference and grip");
    expect(await scriptFailure(db, upsert)).toBeNull();
    const [forearmAfter, upperArmAfter] = await regionRows();
    expect(forearmAfter.v).not.toBe(forearm.v);
    expect(forearmAfter.row).toEqual({ ...forearm.row, progress_subtitle: "Circumference and grip, by arm" });
    expect(upperArmAfter.v).toBe(upperArm.v);
    // As seed v2 wrote it again.
    await db.query("update specialization.regions set progress_subtitle = $1 where id = 'forearm'", [forearm.row.progress_subtitle]);
    expect((await regionRows())[0].row).toEqual(forearm.row);
    });
  });

  it("a region with a published version keeps its status, side model, limb, catalog keys and tag scope, and stays; its words, order and measures may change", async () => {
    const kept = /region forearm has mapping version forearm_mappings_v1 \(published\), forearm_mappings_v2 \(published\); its status, side model, limb, catalog keys and region-only tag scope, which decide what counts there, cannot change and it cannot be deleted/;
    for (const who of ["service_role", "postgres"] as const) {
      await as(db, who, async () => {
        for (const change of [
          "status = 'fixture'",
          "side_model = 'midline', side_limb = null, side_word = null, side_word_plural = null",
          "side_limb = 'leg', side_word = 'leg', side_word_plural = 'legs'",
          "catalog_keys = array['forearms', 'biceps']",
          "region_only_tag_scope = 'primary'",
        ]) {
          expect(await attempt(`update specialization.regions set ${change} where id = 'forearm'`), `${who}: ${change}`).toMatch(kept);
        }
        expect(await attempt("delete from specialization.regions where id = 'forearm'"), who).toMatch(kept);
        expect(await attempt("update specialization.regions set status = status, catalog_keys = catalog_keys where id = 'forearm'"), who).toBeNull();
        for (const change of [
          "label = 'Forearm'", "heading = 'Forearm work'", "sort_order = 11", "side_word = 'hand', side_word_plural = 'hands'", "external_heading = 'Forearm muscles'",
          `measurement_defaults = '{"circumference_cm": {"landmark": "Widest point", "posture": "arm_relaxed_hanging"}}'`, "measurement_metrics = array['circumference_cm', 'girth_cm']",
        ]) {
          expect(await attempt(`update specialization.regions set ${change} where id = 'forearm'`), `${who}: ${change}`).toBeNull();
        }
      });
    }
    expect(await attempt("update specialization.regions set measurement_defaults = '[]' where id = 'forearm'")).toMatch(/regions_measurement_defaults_check/);
    expect(await attempt("update specialization.regions set on_side_template = 'your forearm' where id = 'forearm'")).toMatch(/region forearm \(production\) needs a complete side model/);
    // The scope's own check, on a region with no version; the upper arm, published from wave A, keeps its scope.
    expect(await attempt("insert into specialization.regions (id, label, status, region_only_tag_scope) values ('zz_scope', 'Test', 'reference', 'secondary')")).toMatch(/regions_region_only_tag_scope_check/);
    expect(await attempt("update specialization.regions set region_only_tag_scope = 'any' where id = 'upper_arm'")).toMatch(/region upper_arm has mapping version upper_arm_mappings_v1 \(published\)/);
  });
});

// ---------------------------------------------------------------- drawings

describe("drawings", () => {
  it("a drawing shows one side, mirrored for the other, or both sides; none written reads as one side", async () => {
    const setSides = (value: string) => as(db, "service_role", () => attempt(`update specialization.diagram_assets set sides = ${value} where asset_key = 'forearm_schematic'`));
    expect(await setSides("'one_side'")).toBeNull();
    expect(await setSides("'both_sides'")).toBeNull();
    expect(await setSides("null")).toBeNull();
    expect(await setSides("'mirrored'")).toMatch(/diagram_assets_sides_check/);
    expect(await rows(db, "select sides from specialization.diagram_assets where asset_key = 'forearm_schematic'")).toEqual([{ sides: null }]);
  });
});

// ---------------------------------------------------------------- variants and mappings

describe("variants and mappings", () => {
  it("a variant may say not_applicable for its laterality, forearm orientation and wrist position", async () => {
    await as(db, "service_role", async () => {
      expect(await attempt(`
        insert into specialization.catalog_exercises (catalog_id, name) values (9001, 'Test leg press');
        insert into specialization.exercise_variants (variant_key, catalog_id, organization, forearm_orientation, wrist_position, grip_type, straps, laterality, phase, measure, deliberate_hold)
          values ('zz-leg-press', 9001, 'multi_joint', 'not_applicable', 'not_applicable', 'none', 'not_applicable', 'not_applicable', 'concentric_eccentric', 'reps', false)`)).toBeNull();
      for (const [column, constraint] of [["laterality", "laterality"], ["forearm_orientation", "forearm_orientation"], ["wrist_position", "wrist_position"]]) {
        expect(
          await attempt(`
            insert into specialization.catalog_exercises (catalog_id, name) values (9002, 'Test');
            insert into specialization.exercise_variants (variant_key, catalog_id, organization, forearm_orientation, wrist_position, grip_type, straps, laterality, phase, measure, deliberate_hold)
              values ('zz-bad', 9002, 'multi_joint', 'neutral', 'neutral', 'none', 'no', 'bilateral', 'concentric_eccentric', 'reps', false);
            update specialization.exercise_variants set ${column} = 'n/a' where variant_key = 'zz-bad'`),
          column,
        ).toMatch(new RegExp(`exercise_variants_${constraint}_check`));
      }
    });
  });

  it("a mapping's side relation is same, opposite or both, 'same' unless written", async () => {
    await as(db, "service_role", async () => {
      await db.query("insert into specialization.mapping_versions (version_key, region_id, method_notes) values ('zz_relation', 'forearm', 'Test.')");
      const add = (key: string, relation: string | null) =>
        failure(
          db,
          `insert into specialization.variant_mappings (version_id, mapping_key, variant_key, node_id, action_id, relationship, muscle_mode, evidence_basis, rationale${relation ? ", side_relation" : ""})
           select id, $1, 'cat-139', 'forearm.fcu', 'wrist.flexion', 'direct', 'dynamic', 'anatomy', 'Test.'${relation ? ", $2" : ""} from specialization.mapping_versions where version_key = 'zz_relation'`,
          relation ? [key, relation] : [key],
        );
      expect(await add("zz:default", null)).toBeNull();
      expect(await rows(db, "select side_relation from specialization.variant_mappings where mapping_key = 'zz:default'")).toEqual([{ side_relation: "same" }]);
      expect(await add("zz:left", "left")).toMatch(/variant_mappings_side_relation_check/);
      await dropDraft("zz_relation");
    });
  });
});

// ---------------------------------------------------------------- the publication rule

describe("publishing: rules 10 to 13", () => {
  beforeAll(async () => {
    await as(db, "service_role", async () => {
      await db.exec(`
        ${DIMENSIONS}
        insert into specialization.actions (id, joint, label, plain_description, sort_order) values
          ('knee.extension', 'Knee', 'Knee extension', 'Straightens the knee.', 2000), ('spine.flexion', 'Spine', 'Spine flexion', 'Curls the trunk forward.', 2001);
        insert into specialization.regions (id, label, status, ${PAGE_WORDS}, side_model, side_limb, side_word, side_word_plural, on_side_template) values
          ('zz_legs', 'Test legs', 'fixture', ${PAGE_VALUES}, 'paired', 'leg', 'leg', 'legs', 'your {side} leg'),
          ('zz_trunk', 'Test trunk', 'fixture', ${PAGE_VALUES}, 'midline', null, null, null, 'your trunk');
      `);
      await newMuscle("zz_legs.quad", "zz_legs", "knee.extension");
      await newMuscle("zz_trunk.abs", "zz_trunk", "spine.flexion");
      await db.exec("insert into specialization.region_nodes (region_id, node_id, role) values ('zz_legs', 'zz_legs.quad', 'target'), ('zz_trunk', 'zz_trunk.abs', 'target')");
      await newVariant("zz-split-squat", 9101, "Test split squat");
      await newVariant("zz-back-squat", 9102, "Test back squat");
      await newVariant("zz-sit-up", 9103, "Test sit-up");
      await newVariant("zz-hands-free", 9104, "Test hands-free back extension", "not_applicable");
      await newVariant("zz-plain", 9105, "Test without attributes");
      for (const [variant, dimension, value] of [
        ["zz-back-squat", "sided_by", "none"], ["zz-back-squat", "leg_laterality", "bilateral"],
        ["zz-sit-up", "sided_by", "none"],
        ["zz-hands-free", "sided_by", "none"], ["zz-hands-free", "leg_laterality", "not_applicable"],
        ["cat-121", "sided_by", "none"], ["cat-139", "sided_by", "none"],
      ]) {
        await giveAttribute(variant, dimension, value);
      }
    });
  });

  it("10: refuses a version that maps a muscle its region does not list, or no longer lists", async () => {
    await as(db, "service_role", async () => {
      // The anconeus is the forearm's own, reviewed, with a node action, and unlisted (set up above).
      await draftVersion("zz_rule10", "forearm", [{ key: "zz:anconeus", variant: "cat-121", node: "forearm.anconeus", action: "elbow.extension" }]);
      expect(await problemsOf("zz_rule10")).toBe("mapped muscles the version's region does not list: forearm.anconeus");
      expect(await publish("zz_rule10")).toMatch(/mapping version zz_rule10 cannot be published: mapped muscles the version's region does not list: forearm\.anconeus$/);
      await db.query("update specialization.region_nodes set listed = true where region_id = 'forearm' and node_id = 'forearm.anconeus'");
      expect(await problemsOf("zz_rule10")).toBeNull();
      await db.query("update specialization.region_nodes set listed = false where region_id = 'forearm' and node_id = 'forearm.anconeus'");
      await dropDraft("zz_rule10");
    });
  });

  it("11: refuses a version whose variants lack the counting attributes its region reads", async () => {
    await as(db, "service_role", async () => {
      // Every region reads sided_by.
      await draftVersion("zz_rule11_arm", "forearm", [{ key: "zz:plain", variant: "zz-plain", node: "forearm.fcu", action: "wrist.flexion" }]);
      expect(await problemsOf("zz_rule11_arm")).toBe("mapped variants without the counting attributes their region reads: zz-plain (sided_by)");
      // sided_by leg needs the leg's laterality and anchor, in an arm region too.
      await giveAttribute("zz-plain", "sided_by", "leg");
      expect(await problemsOf("zz_rule11_arm")).toBe("mapped variants without the counting attributes their region reads: zz-plain (leg_laterality, side_anchor)");
      await dropDraft("zz_rule11_arm");

      // A leg region reads the leg's laterality, and the anchor of a one-sided leg variant.
      await draftVersion("zz_rule11_legs", "zz_legs", [
        { key: "zz:split", variant: "zz-split-squat", node: "zz_legs.quad", action: "knee.extension" },
        { key: "zz:squat", variant: "zz-back-squat", node: "zz_legs.quad", action: "knee.extension" },
      ]);
      expect(await problemsOf("zz_rule11_legs")).toBe("mapped variants without the counting attributes their region reads: zz-split-squat (sided_by, leg_laterality)");
      await giveAttribute("zz-split-squat", "sided_by", "leg");
      await giveAttribute("zz-split-squat", "leg_laterality", "unilateral");
      expect(await problemsOf("zz_rule11_legs")).toBe("mapped variants without the counting attributes their region reads: zz-split-squat (side_anchor)");
      expect(await publish("zz_rule11_legs")).toMatch(/mapping version zz_rule11_legs cannot be published: mapped variants without the counting attributes their region reads: zz-split-squat \(side_anchor\)$/);
      await giveAttribute("zz-split-squat", "side_anchor", "front_leg");
      expect(await problemsOf("zz_rule11_legs")).toBeNull();
      await dropDraft("zz_rule11_legs");

      // A midline region reads sided_by only.
      await draftVersion("zz_rule11_trunk", "zz_trunk", [{ key: "zz:situp", variant: "zz-sit-up", node: "zz_trunk.abs", action: "spine.flexion" }]);
      expect(await problemsOf("zz_rule11_trunk")).toBeNull();
      await dropDraft("zz_rule11_trunk");
    });
  });

  it("11: a mapping on a variant that does not use the region's limb counts on both sides", async () => {
    await as(db, "service_role", async () => {
      // The legs do no work in it (leg_laterality not_applicable), and the hands none either (laterality not_applicable).
      await draftVersion("zz_rule11_both_legs", "zz_legs", [{ key: "zz:legs-same", variant: "zz-hands-free", node: "zz_legs.quad", action: "knee.extension" }]);
      await draftVersion("zz_rule11_both_arms", "forearm", [{ key: "zz:arms-same", variant: "zz-hands-free", node: "forearm.fcu", action: "wrist.flexion" }]);
      expect(await problemsOf("zz_rule11_both_legs")).toBe("mappings on a variant that does not use the region's limb must count on both sides (side_relation both): zz:legs-same");
      expect(await problemsOf("zz_rule11_both_arms")).toBe("mappings on a variant that does not use the region's limb must count on both sides (side_relation both): zz:arms-same");
      await db.query("update specialization.variant_mappings set side_relation = 'both' where mapping_key in ('zz:legs-same', 'zz:arms-same')");
      expect(await problemsOf("zz_rule11_both_legs")).toBeNull();
      expect(await problemsOf("zz_rule11_both_arms")).toBeNull();
      await dropDraft("zz_rule11_both_legs");
      await dropDraft("zz_rule11_both_arms");
    });
  });

  it("12: refuses a version that maps a muscle whose home is another region (critic experiment 1b), and lets forearm_mappings_v1 keep passing", async () => {
    await as(db, "service_role", async () => {
      // A new forearm version mapping the biceps, as v1 does; the biceps is listed in the forearm, as an external.
      await draftVersion("forearm_mappings_v2_probe", "forearm", [{ key: "cat-121:upper_arm.biceps", variant: "cat-121", node: "upper_arm.biceps", action: "elbow.flexion" }]);
      expect(await problemsOf("forearm_mappings_v2_probe")).toBe("mapped muscles whose home is another region: upper_arm.biceps");
      expect(await publish("forearm_mappings_v2_probe")).toMatch(/mapping version forearm_mappings_v2_probe cannot be published: mapped muscles whose home is another region: upper_arm\.biceps$/);
      await dropDraft("forearm_mappings_v2_probe");
      expect(await problemsOf("forearm_mappings_v1")).toBeNull();
    });
  });

  it("13: refuses a version in a region with no page yet, since publishing freezes the region's status and it could never be promoted after", async () => {
    // From wave A the upper arm has its page and its published version; the rule is read where it applied, over seed v2.
    expect(await count(db, "select 1 from specialization.mapping_versions where version_key = 'upper_arm_mappings_v1' and state = 'published'")).toBe(1);
    await atSeedV2(() => as(db, "service_role", async () => {
      // The reference upper arm lists the biceps as a target from seed v2, and cat-121 has sided_by (set up above): rules 1 to 12 pass.
      await draftVersion("upper_arm_mappings_v1", "upper_arm", [{ key: "cat-121:upper_arm.biceps", variant: "cat-121", node: "upper_arm.biceps", action: "elbow.flexion" }]);
      const noPage = "region upper_arm has no page yet (reference): promote it before publishing a version of it";
      expect(await problemsOf("upper_arm_mappings_v1")).toBe(noPage);
      expect(await publish("upper_arm_mappings_v1")).toBe(`mapping version upper_arm_mappings_v1 cannot be published: ${noPage}`);
      expect(await rows(db, "select state from specialization.mapping_versions where version_key = 'upper_arm_mappings_v1'")).toEqual([{ state: "draft" }]);
      // Promoted first, as seed v3 writes the region before its versions, the same draft passes; and the region stays promotable meanwhile.
      await db.exec("begin");
      try {
        expect(await failure(db, `update specialization.regions set status = 'production', (${PAGE_WORDS}) = (${PAGE_VALUES}) where id = 'upper_arm'`)).toBeNull();
        expect(await problemsOf("upper_arm_mappings_v1")).toBeNull();
      } finally {
        await db.exec("rollback");
      }
      await dropDraft("upper_arm_mappings_v1");
    }));
  });

  it("a publish changes the state alone: a key, region or notes changed in the same statement is refused and the version stays a draft, since the rules read the stored draft", async () => {
    // Over seed v2, where the upper arm had no page yet (case A needs a region with no page).
    await atSeedV2(() => as(db, "service_role", async () => {
      const published = (key: string, set: string) => failure(db, `update specialization.mapping_versions set state = 'published', ${set} where version_key = $1`, [key]);
      const alone = (key: string) => new RegExp(`mapping version ${key} is published by changing its state alone: change its key, region or notes while it is a draft, then publish it`);
      const held = (key: string) => rows(db, "select region_id, state, method_notes from specialization.mapping_versions where version_key = $1", [key]);
      // (A) An upper-arm draft of the biceps and brachialis passes rules 1 to 12 as the upper arm's (only 13 holds it while the upper
      // arm has no page); published as the forearm's, rule 12 would not have seen it.
      await draftVersion("zz_moved_a", "upper_arm", [
        { key: "cat-121:upper_arm.biceps", variant: "cat-121", node: "upper_arm.biceps", action: "elbow.flexion" },
        { key: "cat-121:upper_arm.brachialis", variant: "cat-121", node: "upper_arm.brachialis", action: "elbow.flexion" },
      ]);
      expect(await problemsOf("zz_moved_a")).toBe("region upper_arm has no page yet (reference): promote it before publishing a version of it");
      expect(await published("zz_moved_a", "region_id = 'forearm'")).toMatch(alone("zz_moved_a"));
      expect(await held("zz_moved_a")).toEqual([{ region_id: "upper_arm", state: "draft", method_notes: "Test version." }]);
      // Moved while a draft, it is judged as the forearm's.
      await db.query("update specialization.mapping_versions set region_id = 'forearm' where version_key = 'zz_moved_a'");
      expect(await publish("zz_moved_a")).toMatch(/mapping version zz_moved_a cannot be published: mapped muscles whose home is another region: upper_arm\.biceps, upper_arm\.brachialis$/);
      await dropDraft("zz_moved_a");

      // (B) A forearm draft of the forearm's own muscles, published as the upper arm's, would have rested on memberships the upper arm does not have.
      await draftVersion("zz_moved_b", "forearm", [{ key: "cat-139:forearm.fcu", variant: "cat-139", node: "forearm.fcu", action: "wrist.flexion" }]);
      expect(await problemsOf("zz_moved_b")).toBeNull();
      expect(await published("zz_moved_b", "region_id = 'upper_arm'")).toMatch(alone("zz_moved_b"));
      expect(await published("zz_moved_b", "method_notes = 'Changed on the way.'")).toMatch(alone("zz_moved_b"));
      expect(await published("zz_moved_b", "version_key = 'zz_moved_c'")).toMatch(alone("zz_moved_b"));
      expect(await held("zz_moved_b")).toEqual([{ region_id: "forearm", state: "draft", method_notes: "Test version." }]);
      expect(await count(db, "select 1 from specialization.variant_attributes where variant_key = 'cat-139' and frozen_at is not null")).toBe(0);
      await dropDraft("zz_moved_b");
    }));
  });

  it("guard_mapping_version locks the region row first, then the version's memberships and attributes, then v1's rows, and freezes attributes after the check", async () => {
    // PGlite is one connection, so the race itself is reasoned (04-database.md §8); the order is read from the function.
    const [{ body }] = await rows<{ body: string }>(db, "select pg_get_functiondef('specialization.guard_mapping_version()'::regprocedure) as body");
    const at = (text: string) => {
      const index = body.indexOf(text);
      expect(index, text).toBeGreaterThan(-1);
      return index;
    };
    const order = [
      at("perform 1 from specialization.regions r where r.id = new.region_id for share;"),
      at("perform 1 from specialization.region_nodes rn"),
      at("perform 1 from specialization.variant_attributes va"),
      at("perform 1 from specialization.exercise_variants ev"),
      at("perform 1 from specialization.sources s"),
      at("v_problems := specialization.mapping_version_problems(new.id);"),
      at("set frozen_at = pg_catalog.now()"),
    ];
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(body.slice(at("perform 1 from specialization.region_nodes rn"), at("perform 1 from specialization.variant_attributes va"))).toMatch(/for share;\s*$/);
  });
});

// ---------------------------------------------------------------- attributes

describe("variant attributes", () => {
  const attribute = (variant: string, dimension: string) =>
    rows<{ value: string; frozen: boolean }>(db, "select value, frozen_at is not null as frozen from specialization.variant_attributes where variant_key = $1 and dimension_id = $2", [variant, dimension]).then((found) => found[0] ?? null);

  it("names a value its dimension lists; dimensions are counting or descriptive, with ids and values of a fixed shape", async () => {
    await as(db, "service_role", async () => {
      expect(await attempt("insert into specialization.variant_attributes (variant_key, dimension_id, value) values ('cat-123', 'grip_width', 'overhead')")).toMatch(/variant_attributes_value_listed/);
      expect(await attempt("insert into specialization.variant_attributes (variant_key, dimension_id, value) values ('cat-nowhere', 'grip_width', 'wide')")).toMatch(/variant_attributes_variant_key_fkey/);
      expect(await attempt("insert into specialization.variant_dimensions (id, label, kind) values ('zz_dim', 'Test', 'derived')")).toMatch(/variant_dimensions_kind_check/);
      expect(await attempt("insert into specialization.variant_dimensions (id, label, kind) values ('Knee angle', 'Test', 'descriptive')")).toMatch(/variant_dimensions_id_check/);
      expect(await attempt("insert into specialization.variant_dimensions (id, label, kind) values ('zz_dim', ' ', 'descriptive')")).toMatch(/variant_dimensions_label_check/);
      expect(await attempt("insert into specialization.variant_dimension_values (dimension_id, value, label) values ('grip_width', 'Very wide', 'Test')")).toMatch(/variant_dimension_values_value_check/);
      expect(await attempt("insert into specialization.variant_dimension_values (dimension_id, value, label) values ('zz_nowhere', 'wide', 'Test')")).toMatch(/variant_dimension_values_dimension_id_fkey/);
      // A value an attribute names cannot be removed from its dimension.
      await giveAttribute("cat-124", "grip_width", "narrow");
      expect(await attempt("delete from specialization.variant_dimension_values where dimension_id = 'grip_width' and value = 'narrow'")).toMatch(/variant_attributes_value_listed/);
    });
  });

  it("an attribute added after a version mapping its variant was published stays free (critic experiment 2: cat-205)", async () => {
    await as(db, "service_role", async () => {
      expect(await rows(db, "select distinct v.version_key, v.state from specialization.variant_mappings m join specialization.mapping_versions v on v.id = m.version_id where m.variant_key = 'cat-205' order by 1")).toEqual([
        { version_key: "forearm_mappings_v1", state: "published" },
        { version_key: "forearm_mappings_v2", state: "published" },
      ]);
      await giveAttribute("cat-205", "leg_laterality", "bilateral");
      await giveAttribute("cat-205", "stance", "bilateral");
      expect(await failure(db, "update specialization.variant_attributes set value = 'unilateral' where variant_key = 'cat-205' and dimension_id = 'leg_laterality'")).toBeNull();
      expect(await failure(db, "update specialization.variant_attributes set value = 'staggered', notes = 'B stance.' where variant_key = 'cat-205' and dimension_id = 'stance'")).toBeNull();
      expect(await failure(db, "delete from specialization.variant_attributes where variant_key = 'cat-205' and dimension_id = 'stance'")).toBeNull();
      expect(await attribute("cat-205", "leg_laterality")).toEqual({ value: "unilateral", frozen: false });
    });
  });

  it("publishing freezes the attributes its variants have then, and only those; a frozen one refuses change and delete; one added later stays free until the next publish", async () => {
    await as(db, "service_role", async () => {
      await giveAttribute("cat-139", "grip_width", "shoulder");
      await giveAttribute("cat-140", "grip_width", "shoulder");
      await draftVersion("zz_freeze_v1", "forearm", [{ key: "cat-139:forearm.fcu", variant: "cat-139", node: "forearm.fcu", action: "wrist.flexion" }]);
      // While the version is a draft, its variants' attributes are free.
      expect(await failure(db, "update specialization.variant_attributes set value = 'narrow' where variant_key = 'cat-139' and dimension_id = 'grip_width'")).toBeNull();
      expect(await publish("zz_freeze_v1")).toBeNull();
      const stamps = await rows<{ dimension_id: string; same: boolean }>(
        db,
        "select a.dimension_id, a.frozen_at = v.published_at as same from specialization.variant_attributes a, specialization.mapping_versions v where a.variant_key = 'cat-139' and v.version_key = 'zz_freeze_v1' order by 1",
      );
      // cat-139's sided_by was frozen already, by forearm_mappings_v2's publish (F3, seed v4), and keeps that stamp.
      expect(stamps).toEqual([{ dimension_id: "grip_width", same: true }, { dimension_id: "sided_by", same: false }]);
      expect(await attribute("cat-140", "grip_width")).toEqual({ value: "shoulder", frozen: false });
    });
    const frozen = /attribute grip_width of variant cat-139 is frozen: a published mapping version rests on it, so it cannot change or be deleted/;
    for (const who of ["service_role", "postgres"] as const) {
      await as(db, who, async () => {
        expect(await attempt("update specialization.variant_attributes set value = 'wide' where variant_key = 'cat-139' and dimension_id = 'grip_width'"), who).toMatch(frozen);
        expect(await attempt("update specialization.variant_attributes set notes = 'Measured.' where variant_key = 'cat-139' and dimension_id = 'grip_width'"), who).toMatch(frozen);
        expect(await attempt("update specialization.variant_attributes set frozen_at = null where variant_key = 'cat-139' and dimension_id = 'grip_width'"), who).toMatch(frozen);
        expect(await attempt("delete from specialization.variant_attributes where variant_key = 'cat-139' and dimension_id = 'grip_width'"), who).toMatch(frozen);
        expect(await attempt("delete from specialization.variant_attributes where variant_key = 'cat-139'"), who).toMatch(/attribute \w+ of variant cat-139 is frozen/);
        // An update that changes nothing passes (a seed applied again).
        expect(await attempt("update specialization.variant_attributes set value = value where variant_key = 'cat-139'"), who).toBeNull();
        // Unfrozen, only a publish freezes an attribute, setting frozen_at and nothing else: no writer sets it by hand, and no
        // attribute is written frozen, since one frozen with no version resting on it could never be corrected or dropped.
        expect(await attempt("update specialization.variant_attributes set frozen_at = now(), value = 'wide' where variant_key = 'cat-140' and dimension_id = 'grip_width'"), who).toMatch(
          /attribute grip_width of variant cat-140 is frozen as it stands: freezing sets frozen_at and nothing else/,
        );
        expect(await attempt("update specialization.variant_attributes set frozen_at = now() where variant_key = 'cat-140' and dimension_id = 'grip_width'"), who).toMatch(
          /attribute grip_width of variant cat-140 is frozen only by the publish of a mapping version that maps its variant/,
        );
        expect(await attempt("insert into specialization.variant_attributes (variant_key, dimension_id, value, frozen_at) values ('cat-140', 'stance', 'bilateral', '2000-01-01')"), who).toMatch(
          /attribute stance of variant cat-140 cannot be written frozen: frozen_at is set only by the publish of a mapping version that maps its variant/,
        );
        expect(await attempt("insert into specialization.variant_attributes (variant_key, dimension_id, value, frozen_at) values ('cat-140', 'grip_width', 'wide', now()) on conflict (variant_key, dimension_id) do update set frozen_at = excluded.frozen_at"), who).toMatch(
          /attribute grip_width of variant cat-140 cannot be written frozen/,
        );
      });
    }
    expect(await attribute("cat-140", "grip_width")).toEqual({ value: "shoulder", frozen: false });
    await as(db, "service_role", async () => {
      // Added after the publish: free, until the next version that maps the variant is published.
      await giveAttribute("cat-139", "stance", "bilateral");
      expect(await failure(db, "update specialization.variant_attributes set value = 'split' where variant_key = 'cat-139' and dimension_id = 'stance'")).toBeNull();
      expect(await failure(db, "update specialization.variant_attributes set value = 'bilateral' where variant_key = 'cat-139' and dimension_id = 'stance'")).toBeNull();
      await draftVersion("zz_freeze_v2", "forearm", [{ key: "cat-139:forearm.fcr", variant: "cat-139", node: "forearm.fcr", action: "wrist.flexion" }]);
      expect(await publish("zz_freeze_v2")).toBeNull();
      expect(await attribute("cat-139", "stance")).toEqual({ value: "bilateral", frozen: true });
      expect(await attempt("update specialization.variant_attributes set value = 'split' where variant_key = 'cat-139' and dimension_id = 'stance'")).toMatch(/attribute stance of variant cat-139 is frozen/);
    });
  });
});

// ---------------------------------------------------------------- applied again

describe("schema v2 and the current seed applied again", () => {
  it("schema v2 touches no row, so frozen_at and every membership survive; a seed refuses to drop a frozen attribute, drops an unfrozen one, leaves frozen_at alone and, applied twice, touches nothing", async () => {
    const frozen = () => rows(db, "select variant_key, dimension_id, value, frozen_at::text from specialization.variant_attributes where frozen_at is not null order by 1, 2");
    const frozenBefore = await frozen();
    expect(frozenBefore.length).toBeGreaterThan(0);
    const before = await rowVersions(db);
    // From seed v3 schema v2 cannot be applied again: its membership backfill reads every published version and gives a
    // node's stored role, so it would list the upper arm's own biceps and brachialis (stored role external, §1.3) as external
    // in the upper arm, which the membership guard refuses; the whole file rolls back. Production never applies a recorded
    // file again (make-apply-sql.mjs refuses one, §5.3), and schema v2 is history, never edited.
    expect(await attempt(readMigration(SCHEMA_V2_MIGRATION_PATH))).toMatch(/node upper_arm\.(biceps|brachialis) lives in region upper_arm, so its role in region upper_arm is target, adjacent or group, not external/);
    expect(await rowVersions(db)).toEqual(before);
    expect(await frozen()).toEqual(frozenBefore);
    // A seeded variant's attributes are the content's. The tests above froze two the content does not have (cat-139's grip width
    // and stance), so the current seed, which would drop them, is refused by name and applies nothing.
    expect(await attempt(readMigration(SEED_MIGRATION_PATH))).toMatch(/attribute (grip_width|stance) of variant cat-139 is frozen: a published mapping version rests on it, so it cannot change or be deleted/);
    expect(await rowVersions(db)).toEqual(before);
    // With those two in the content, the seed applies: it writes its own dimension and attribute rows over the test's, leaves
    // frozen_at alone (it is not among its columns), and drops the unfrozen attributes the content does not have.
    // The attributes the content does not have: the ones these tests wrote (from wave A the content's own descriptive
    // attributes are many, and upper_arm_mappings_v1's publish froze those of its variants).
    const content = new Set(registeredRegionContents.flatMap((item) => item.variants.flatMap((variant) => ["sided_by", ...(variant.legLaterality ? ["leg_laterality"] : []), ...(variant.sideAnchor ? ["side_anchor"] : []), ...Object.keys(variant.dimensions ?? {})].map((dimension) => `${variant.id} ${dimension}`))));
    const testMade = <T extends { variant_key: string; dimension_id: string }>(found: T[]) => found.filter((row) => !content.has(`${row.variant_key} ${row.dimension_id}`));
    const kept = testMade(await rows<{ variant_key: string; dimension_id: string; value: string }>(
      db,
      "select variant_key, dimension_id, value from specialization.variant_attributes where frozen_at is not null and variant_key like 'cat-%' and dimension_id <> 'sided_by' order by 1, 2",
    ));
    expect(kept).toEqual([
      { variant_key: "cat-139", dimension_id: "grip_width", value: "narrow" },
      { variant_key: "cat-139", dimension_id: "stance", value: "bilateral" },
    ]);
    const unfrozen = async () => testMade(await rows<{ variant_key: string; dimension_id: string }>(db, "select variant_key, dimension_id from specialization.variant_attributes where frozen_at is null and variant_key like 'cat-%' and dimension_id <> 'sided_by' order by 1, 2"));
    expect(await unfrozen()).toEqual([
      { variant_key: "cat-124", dimension_id: "grip_width" },
      { variant_key: "cat-140", dimension_id: "grip_width" },
      { variant_key: "cat-205", dimension_id: "leg_laterality" },
    ]);
    const withKept = emitSeedSql({
      ...productionSeedInput(),
      regions: registeredRegionContents.map((content) => ({
        ...content,
        variants: content.variants.map((variant) => {
          const own = kept.filter((attribute) => attribute.variant_key === variant.id);
          return own.length ? { ...variant, dimensions: Object.fromEntries(own.map((attribute) => [attribute.dimension_id, attribute.value])) as (typeof variant)["dimensions"] } : variant;
        }),
      })),
    });
    expect(await scriptFailure(db, withKept)).toBeNull();
    expect(await frozen()).toEqual(frozenBefore);
    expect(await unfrozen()).toEqual([]);
    const seeded = await rowVersions(db);
    expect(await scriptFailure(db, withKept)).toBeNull();
    expect(await rowVersions(db)).toEqual(seeded);
  });
});

// ---------------------------------------------------------------- memberships

describe("memberships", () => {
  it("a membership's role is external exactly when the region is not the node's home, when written and when a node moves home", async () => {
    await as(db, "service_role", async () => {
      expect(await attempt("insert into specialization.region_nodes (region_id, node_id, role) values ('upper_arm', 'forearm.br', 'target')")).toMatch(
        /node forearm\.br lives in region forearm, so its role in region upper_arm is external, not target/,
      );
      // The upper arm lists the brachioradialis from seed v2; another forearm muscle may be listed beside it.
      expect(await attempt("insert into specialization.region_nodes (region_id, node_id, role) values ('upper_arm', 'forearm.fcu', 'external')")).toBeNull();
      expect(await attempt("insert into specialization.region_nodes (region_id, node_id, role) values ('upper_arm', 'upper_arm.triceps_nowhere', 'target')")).toMatch(/region_nodes_node_id_fkey/);
      expect(await attempt("update specialization.region_nodes set role = 'external' where region_id = 'forearm' and node_id = 'forearm.anconeus'")).toMatch(
        /node forearm\.anconeus lives in region forearm, so its role in region forearm is target, adjacent or group, not external/,
      );
      expect(await attempt("update specialization.region_nodes set role = 'bystander' where region_id = 'forearm' and node_id = 'forearm.anconeus'")).toMatch(/region_nodes_role_check/);
      // The anconeus no published version maps may move home, but not while its forearm membership says it lives there.
      expect(await attempt("update specialization.nodes set region_id = 'upper_arm' where id = 'forearm.anconeus'")).toMatch(
        /node forearm\.anconeus cannot move to region upper_arm: its memberships in forearm \(adjacent\) say it lives elsewhere/,
      );
      expect(await attempt("delete from specialization.region_nodes where node_id = 'forearm.anconeus'; update specialization.nodes set region_id = 'upper_arm' where id = 'forearm.anconeus'")).toBeNull();
    });
  });

  it("a membership a published version of its region maps keeps its role, stays listed and stays; its order and caveats may change", async () => {
    // forearm_mappings_v2 (F3) maps the forearm's own muscles too, not the biceps (rule 12).
    const frozen = (node: string) => new RegExp(`node ${node.replace(".", "\\.")} is mapped in region forearm by mapping version forearm_mappings_v1 \\(published\\)(, forearm_mappings_v2 \\(published\\))?(, zz_freeze_v\\d \\(published\\))*; its role there cannot change, it stays listed and it cannot leave the region`);
    for (const who of ["service_role", "postgres"] as const) {
      await as(db, who, async () => {
        expect(await attempt("update specialization.region_nodes set role = 'adjacent' where region_id = 'forearm' and node_id = 'forearm.fcu'"), who).toMatch(frozen("forearm.fcu"));
        expect(await attempt("update specialization.region_nodes set listed = false where region_id = 'forearm' and node_id = 'upper_arm.biceps'"), who).toMatch(frozen("upper_arm.biceps"));
        expect(await attempt("delete from specialization.region_nodes where region_id = 'forearm' and node_id = 'upper_arm.biceps'"), who).toMatch(frozen("upper_arm.biceps"));
        expect(await attempt("update specialization.region_nodes set node_id = 'forearm.anconeus', role = 'adjacent' where region_id = 'forearm' and node_id = 'forearm.ecu'"), who).toMatch(frozen("forearm.ecu"));
        expect(await attempt("update specialization.region_nodes set sort_order = sort_order + 100, caveats = array['Credited here as the upper arm credits it.'] where region_id = 'forearm' and node_id = 'upper_arm.biceps'"), who).toBeNull();
        expect(await attempt("update specialization.region_nodes set role = role, listed = listed where region_id = 'forearm'"), who).toBeNull();
      });
    }
    // One no published version maps is free; a new membership may be added to a region with a published version.
    await as(db, "service_role", async () => {
      expect(await attempt("update specialization.region_nodes set role = 'target', listed = true where region_id = 'forearm' and node_id = 'forearm.anconeus'")).toBeNull();
      expect(await attempt("delete from specialization.region_nodes where region_id = 'forearm' and node_id = 'forearm.anconeus'")).toBeNull();
      expect(await attempt("insert into specialization.region_nodes (region_id, node_id, role, sort_order) values ('forearm', 'zz_legs.quad', 'external', 30)")).toBeNull();
    });
  });

  it("a membership names a node that exists (critic experiment 4: the shoulders listing back.latissimus_dorsi before the back ships)", async () => {
    await as(db, "service_role", async () => {
      expect(await attempt("insert into specialization.regions (id, label, status) values ('zz_shoulders', 'Shoulders', 'reference'); insert into specialization.region_nodes (region_id, node_id, role) values ('zz_shoulders', 'back.latissimus_dorsi', 'external')")).toMatch(
        /violates foreign key constraint "region_nodes_node_id_fkey"/,
      );
    });
  });
});

// ---------------------------------------------------------------- goals and measurements

describe("goals", () => {
  const goal = (who: { user: string }, id: string, region: string, target: { node?: string; action?: string }, side: string, from = "2026-10-19") =>
    as(db, who, () =>
      failure(
        db,
        "insert into specialization.goals (id, region_id, node_id, action_id, side, metric, target, period, starts_on, timezone) values ($1, $2, $3, $4, $5, 'direct_dynamic_bouts', 6, 'calendar_week', $6, 'UTC')",
        [id, region, target.node ?? null, target.action ?? null, side, from],
      ),
    );

  beforeAll(async () => {
    await as(db, "service_role", async () => {
      await db.exec(`
        insert into specialization.regions (id, label, status, ${PAGE_WORDS}, side_model, on_side_template) values ('zz_core', 'Core', 'production', ${PAGE_VALUES}, 'midline', 'your core');
        insert into specialization.region_actions (region_id, action_id) values ('zz_core', 'spine.flexion'), ('forearm', 'knee.extension');
        update specialization.region_actions set listed = false where region_id = 'forearm' and action_id = 'knee.extension';
        insert into specialization.region_nodes (region_id, node_id, role) values ('forearm', 'forearm.anconeus', 'adjacent')
          on conflict (region_id, node_id) do update set role = excluded.role, listed = true;
      `);
      await newMuscle("zz_core.abs", "zz_core", "spine.flexion");
      await newMuscle("forearm.zz_dropped", "forearm", "wrist.flexion");
      await newMuscle("forearm.zz_demoted", "forearm", "wrist.flexion");
      await db.exec("insert into specialization.region_nodes (region_id, node_id, role) values ('zz_core', 'zz_core.abs', 'target'), ('forearm', 'forearm.zz_dropped', 'target'), ('forearm', 'forearm.zz_demoted', 'target')");
    });
  });

  it("a goal's side is midline exactly in a midline region", async () => {
    expect(await goal(userA, "core-midline", "zz_core", { node: "zz_core.abs" }, "midline")).toBeNull();
    expect(await goal(userA, "core-movement", "zz_core", { action: "spine.flexion" }, "midline")).toBeNull();
    expect(await goal(userA, "core-left", "zz_core", { node: "zz_core.abs" }, "left", "2027-01-04")).toMatch(/region zz_core is midline: a goal there has side midline/);
    expect(await goal(userA, "forearm-midline", "forearm", { node: "forearm.fcu" }, "midline")).toMatch(/region forearm is not midline: a goal there is for the left or the right side/);
    expect(await goal(userA, "forearm-both", "forearm", { node: "forearm.fcu" }, "both")).toMatch(/goals_side_check/);
  });

  it("a new goal names a listed target muscle or a listed movement of its region", async () => {
    const notTarget = (node: string) => new RegExp(`node ${node.replace(".", "\\.")} is not a listed target muscle of region forearm; a target names one of the region's own target muscles`);
    expect(await goal(userA, "adjacent", "forearm", { node: "forearm.anconeus" }, "left")).toMatch(notTarget("forearm.anconeus"));
    expect(await goal(userA, "external", "forearm", { node: "upper_arm.biceps" }, "left")).toMatch(notTarget("upper_arm.biceps"));
    expect(await goal(userA, "group", "forearm", { node: "forearm.anterior" }, "left")).toMatch(notTarget("forearm.anterior"));
    expect(await goal(userA, "other-region", "upper_arm", { node: "forearm.fcu" }, "left")).toMatch(/node forearm\.fcu is not a listed target muscle of region upper_arm/);
    expect(await goal(userA, "unlisted-action", "forearm", { action: "knee.extension" }, "left")).toMatch(/action knee\.extension is not a listed movement of region forearm/);
    expect(await goal(userA, "other-action", "forearm", { action: "spine.flexion" }, "left")).toMatch(/action spine\.flexion is not a listed movement of region forearm/);
    expect(await goal(userA, "target", "forearm", { node: "forearm.zz_dropped" }, "left")).toBeNull();
    expect(await goal(userA, "movement", "forearm", { action: "wrist.flexion" }, "left")).toBeNull();
    // A service-role write (a later sync) is held to the same rule.
    expect(await as(db, "service_role", () => failure(db, `insert into specialization.goals (user_id, id, region_id, node_id, side, metric, target, period, starts_on, timezone) values ($1, 'synced', 'forearm', 'forearm.anconeus', 'left', 'direct_dynamic_bouts', 6, 'calendar_week', '2026-10-19', 'UTC')`, [USER_B]))).toMatch(
      notTarget("forearm.anconeus"),
    );
  });

  it("a reference region takes no goal, though it lists the muscle and the movement: it has no page (the upper arm before its promotion)", async () => {
    // From wave A the upper arm has a page and takes a target on its muscles; the rule is read where it applied, over seed v2.
    expect(await goal(userA, "promoted-muscle", "upper_arm", { node: "upper_arm.biceps" }, "left")).toBeNull();
    expect(await as(db, userA, () => failure(db, "delete from specialization.goals where id = 'promoted-muscle'"))).toBeNull();
    await atSeedV2(async () => {
    const noPage = /region upper_arm has no page yet \(it is a reference region\), so it takes no target/;
    expect(await rows(db, "select status from specialization.regions where id = 'upper_arm'")).toEqual([{ status: "reference" }]);
    expect(await count(db, "select 1 from specialization.region_nodes where region_id = 'upper_arm' and node_id = 'upper_arm.biceps' and role = 'target' and listed")).toBe(1);
    expect(await goal(userA, "reference-muscle", "upper_arm", { node: "upper_arm.biceps" }, "left")).toMatch(noPage);
    expect(await goal(userA, "reference-movement", "upper_arm", { action: "shoulder.flexion" }, "left")).toMatch(noPage);
    // A later sync, as the service role, too.
    expect(await as(db, "service_role", () => failure(db, `insert into specialization.goals (user_id, id, region_id, node_id, side, metric, target, period, starts_on, timezone) values ($1, 'synced-reference', 'upper_arm', 'upper_arm.brachialis', 'left', 'direct_dynamic_bouts', 6, 'calendar_week', '2026-10-19', 'UTC')`, [USER_B]))).toMatch(noPage);
    // And a goal moved there is a new goal.
    expect(await goal(userA, "to-move", "forearm", { node: "forearm.fcu" }, "left", "2027-03-01")).toBeNull();
    expect(await as(db, userA, () => failure(db, "update specialization.goals set region_id = 'upper_arm', node_id = 'upper_arm.biceps' where id = 'to-move'"))).toMatch(noPage);
    expect(await as(db, userA, () => failure(db, "delete from specialization.goals where id = 'to-move'"))).toBeNull();
    });
  });

  it("a dropped member is unlisted, not deleted, while another user's goal names it; the goal stays and may only be ended or deleted", async () => {
    expect(await goal(userB, "kept", "forearm", { node: "forearm.zz_dropped" }, "right")).toBeNull();
    await as(db, "service_role", async () => {
      // The seed's way: a delete fails on user B's row (critic experiment 3), so it unlists.
      expect(await attempt("delete from specialization.region_nodes where region_id = 'forearm' and node_id = 'forearm.zz_dropped'")).toMatch(
        /update or delete on table "region_nodes" violates foreign key constraint "goals_node_in_region" on table "goals"/,
      );
      expect(await failure(db, "update specialization.region_nodes set listed = false where region_id = 'forearm' and node_id = 'forearm.zz_dropped'")).toBeNull();
    });
    const onlyEnded = /goal kept is on forearm\.zz_dropped, which region forearm no longer offers as a target; it can only be ended or deleted/;
    await as(db, userB, async () => {
      // B still reads it, and its key still resolves to the membership B reads.
      expect(await rows(db, "select g.id, rn.listed from specialization.goals g join specialization.region_nodes rn using (region_id, node_id) where g.id = 'kept'")).toEqual([{ id: "kept", listed: false }]);
      expect(await failure(db, "update specialization.goals set target = 8 where id = 'kept'")).toMatch(onlyEnded);
      expect(await failure(db, "update specialization.goals set side = 'left' where id = 'kept'")).toMatch(onlyEnded);
      // Ended: an end date set, kept or brought forward (onlyEnds in goals.ts), never moved later or back to open.
      expect(await failure(db, "update specialization.goals set ends_on = '2026-11-01' where id = 'kept'")).toBeNull();
      expect(await failure(db, "update specialization.goals set ends_on = null where id = 'kept'")).toMatch(onlyEnded);
      expect(await failure(db, "update specialization.goals set ends_on = '2026-11-08' where id = 'kept'")).toMatch(onlyEnded);
      expect(await failure(db, "update specialization.goals set ends_on = '9999-12-31' where id = 'kept'")).toMatch(onlyEnded);
      expect(await failure(db, "update specialization.goals set ends_on = ends_on where id = 'kept'")).toBeNull();
      expect(await failure(db, "update specialization.goals set ends_on = '2026-10-26' where id = 'kept'")).toBeNull();
      expect(await rows(db, "select ends_on::text from specialization.goals where id = 'kept'")).toEqual([{ ends_on: "2026-10-26" }]);
    });
    expect(await goal(userA, "new-on-dropped", "forearm", { node: "forearm.zz_dropped" }, "right", "2027-01-04")).toMatch(/node forearm\.zz_dropped is not a listed target muscle of region forearm/);
    // User A's own goal on it is untouched by B's, and B deletes theirs.
    expect(await as(db, userA, () => count(db, "select 1 from specialization.goals where id = 'target' and ends_on is null"))).toBe(1);
    expect(await as(db, userB, () => failure(db, "delete from specialization.goals where id = 'kept'"))).toBeNull();
  });

  it("a goal on a target the region later lists as adjacent may only be ended or deleted", async () => {
    expect(await goal(userA, "demoted", "forearm", { node: "forearm.zz_demoted" }, "left")).toBeNull();
    await as(db, "service_role", () => db.query("update specialization.region_nodes set role = 'adjacent' where region_id = 'forearm' and node_id = 'forearm.zz_demoted'"));
    await as(db, userA, async () => {
      expect(await failure(db, "update specialization.goals set target = 9 where id = 'demoted'")).toMatch(/goal demoted is on forearm\.zz_demoted, which region forearm no longer offers as a target; it can only be ended or deleted/);
      expect(await failure(db, "update specialization.goals set ends_on = starts_on + 14 where id = 'demoted'")).toBeNull();
      // Moved to a listed target, it is a new goal and passes.
      expect(await failure(db, "update specialization.goals set node_id = 'forearm.fcu', ends_on = null where id = 'demoted'")).toBeNull();
    });
  });
});

describe("measurements", () => {
  const protocol = (posture: string) => JSON.stringify({ landmark: "Widest point", distanceFromLandmarkCm: null, posture, condition: "unpumped", device: "Tape", timeOfDay: null });
  const measure = (id: string, side: string, metric: string, posture = "standing_relaxed") =>
    as(db, userA, () => failure(db, "insert into specialization.measurements (id, region_id, side, measured_at, metric, value, protocol) values ($1, 'forearm', $2, now(), $3, 100, $4::jsonb)", [id, side, metric, protocol(posture)]));

  it("a girth goes around the trunk, so it is midline; every other measure is of one side", async () => {
    expect(await measure("girth", "midline", "girth_cm")).toBeNull();
    expect(await measure("girth-left", "left", "girth_cm")).toMatch(/measurements_side_metric/);
    expect(await measure("tape-midline", "midline", "circumference_cm", "arm_relaxed_hanging")).toMatch(/measurements_side_metric/);
    expect(await measure("grip-midline", "midline", "grip_force_n", "elbow_90_supported")).toMatch(/measurements_side_metric/);
    expect(await measure("skinfold", "left", "skinfold_mm")).toMatch(/measurements_metric_check/);
  });

  it("accepts the postures arm_flexed and standing_relaxed beside v1's, and nothing else", async () => {
    for (const posture of ["arm_flexed", "standing_relaxed", "arm_relaxed_hanging", "arm_extended_supported", "elbow_90_supported", "other"]) {
      expect(await measure(`posture-${posture}`, "right", "circumference_cm", posture), posture).toBeNull();
    }
    expect(await measure("posture-sitting", "right", "circumference_cm", "sitting")).toMatch(/measurements_protocol_shape/);
  });
});

// ---------------------------------------------------------------- the prototype experiment, case by case

/**
 * experiments/multi-region-2026-10-19/exp2-schema-v2.ts with the final schema: the upper arm
 * promoted and its own version published (it maps only its own muscles now, rule 12), then
 * each change the experiment tried, with what the database answers now. "allowed" changes are
 * rolled back like the rest.
 */
describe("the prototype experiment's cases", () => {
  // The prototype promoted the upper arm by hand and published a two-row version of it; from wave A seed v3 does both for
  // real (the upper arm's region row, members and actions, and upper_arm_mappings_v1), so the cases run on what it wrote.
  beforeAll(async () => {
    expect(await rows(db, "select status from specialization.regions where id = 'upper_arm'")).toEqual([{ status: "production" }]);
    expect(await rows(db, "select state from specialization.mapping_versions where version_key = 'upper_arm_mappings_v1'")).toEqual([{ state: "published" }]);
    await as(db, "service_role", () => db.exec("insert into specialization.region_nodes (region_id, node_id, role) values ('forearm', 'forearm.anconeus', 'adjacent') on conflict do nothing"));
  });

  const NOT_HOME = (node: string, home: string, region: string, role: string) => new RegExp(`node ${node.replace(".", "\\.")} lives in region ${home}, so its role in region ${region} is ${role}`);
  const cases: [label: string, sql: string, outcome: RegExp | null][] = [
    ["biceps role in upper_arm -> external", "update specialization.region_nodes set role = 'external' where region_id = 'upper_arm' and node_id = 'upper_arm.biceps'", NOT_HOME("upper_arm.biceps", "upper_arm", "upper_arm", "target, adjacent or group")],
    ["biceps role in forearm -> target", "update specialization.region_nodes set role = 'target' where region_id = 'forearm' and node_id = 'upper_arm.biceps'", NOT_HOME("upper_arm.biceps", "upper_arm", "forearm", "external")],
    ["biceps unlisted in forearm", "update specialization.region_nodes set listed = false where region_id = 'forearm' and node_id = 'upper_arm.biceps'", /node upper_arm\.biceps is mapped in region forearm by mapping version forearm_mappings_v1 \(published\)/],
    ["remove biceps from forearm", "delete from specialization.region_nodes where region_id = 'forearm' and node_id = 'upper_arm.biceps'", /node upper_arm\.biceps is mapped in region forearm by mapping version forearm_mappings_v1 \(published\); .* cannot leave the region/],
    ["unlist the triceps' long head, which the upper arm maps", "update specialization.region_nodes set listed = false where region_id = 'upper_arm' and node_id = 'upper_arm.triceps_long'", /node upper_arm\.triceps_long is mapped in region upper_arm by mapping version upper_arm_mappings_v1 \(published\)/],
    ["reorder biceps in forearm (sort_order only)", "update specialization.region_nodes set sort_order = sort_order + 100 where region_id = 'forearm' and node_id = 'upper_arm.biceps'", null],
    ["anconeus role in forearm (unmapped) -> target", "update specialization.region_nodes set role = 'target' where region_id = 'forearm' and node_id = 'forearm.anconeus'", null],
    ["unlist brachioradialis from the upper arm (listed, not mapped there)", "update specialization.region_nodes set listed = false where region_id = 'upper_arm' and node_id = 'forearm.br'", null],
    ["cat-121 sided_by -> arm (frozen by the upper arm's publish)", "update specialization.variant_attributes set value = 'arm' where variant_key = 'cat-121' and dimension_id = 'sided_by'", /attribute sided_by of variant cat-121 is frozen/],
    ["delete cat-121 sided_by", "delete from specialization.variant_attributes where variant_key = 'cat-121' and dimension_id = 'sided_by'", /attribute sided_by of variant cat-121 is frozen/],
    // Free until F3: only forearm_mappings_v1 mapped it, published before attributes existed; forearm_mappings_v2's publish froze it.
    ["cat-140 sided_by (frozen by forearm_mappings_v2's publish) -> arm", "update specialization.variant_attributes set value = 'arm' where variant_key = 'cat-140' and dimension_id = 'sided_by'", /attribute sided_by of variant cat-140 is frozen/],
    ["new attribute on frozen cat-122", "insert into specialization.variant_attributes (variant_key, dimension_id, value) values ('cat-122', 'grip_width', 'narrow')", null],
    ["a value outside the dimension's list", "insert into specialization.variant_attributes (variant_key, dimension_id, value) values ('cat-123', 'grip_width', 'overhead')", /variant_attributes_value_listed/],
    ["frozen v1 node role still frozen", "update specialization.nodes set role = 'target' where id = 'upper_arm.biceps'", /node upper_arm\.biceps is mapped by mapping version .*its region, role and catalog muscle key/],
    ["the triceps' long head (mapped by upper_arm v1) catalog key", "update specialization.nodes set catalog_muscle_key = 'arms' where id = 'upper_arm.triceps_long'", /node upper_arm\.triceps_long is mapped by mapping version upper_arm_mappings_v1 \(published\)/],
    [
      "upper_arm back to reference (the prototype had no regions guard)",
      "update specialization.regions set status = 'reference', heading = null, entry_label = null, external_group = null, incidental_work = null, progress_subtitle = null, side_model = null, side_limb = null, side_word = null, side_word_plural = null where id = 'upper_arm'",
      /region upper_arm has mapping version upper_arm_mappings_v1 \(published\); its status, side model, limb/,
    ],
    ["upper_arm's catalog keys", "update specialization.regions set catalog_keys = array['biceps'] where id = 'upper_arm'", /region upper_arm has mapping version upper_arm_mappings_v1 \(published\)/],
    ["upper_arm's words", "update specialization.regions set side_word = 'side', side_word_plural = 'sides', heading = 'Upper arms' where id = 'upper_arm'", null],
  ];

  it.each(cases)("%s", async (_label, sql, outcome) => {
    const message = await attempt(sql);
    if (outcome) expect(message).toMatch(outcome);
    else expect(message).toBeNull();
  });

  it("truncating the memberships or attributes as the owner is refused", async () => {
    for (const table of ["region_nodes", "variant_attributes"]) expect(await attempt(`truncate specialization.${table} cascade`), table).toMatch(/cannot be truncated/);
  });

  it("publishing a version that maps a muscle its region does not list is refused (rules 10 and 12 when it is another region's)", async () => {
    await as(db, "service_role", async () => {
      await draftVersion("upper_arm_rule10", "upper_arm", [{ key: "k", variant: "cat-139", node: "forearm.fcu", action: "wrist.flexion" }]);
      expect(await publish("upper_arm_rule10")).toMatch(
        /mapping version upper_arm_rule10 cannot be published: mapped muscles the version's region does not list: forearm\.fcu; mapped muscles whose home is another region: forearm\.fcu$/,
      );
      await dropDraft("upper_arm_rule10");
    });
  });

  it("users read both regions' memberships and attributes, write none; a goal names a target its region lists", async () => {
    const seen = await as(db, userA, async () => ({
      upperArm: (await rows<{ node_id: string; role: string }>(db, "select node_id, role from specialization.region_nodes where region_id = 'upper_arm' order by sort_order")).map((row) => `${row.node_id} ${row.role}`),
      biceps: (await rows<{ region_id: string; role: string }>(db, "select region_id, role from specialization.region_nodes where node_id = 'upper_arm.biceps' order by 1")).map((row) => `${row.region_id} ${row.role}`),
      attributes: await count(db, "select 1 from specialization.variant_attributes where variant_key = 'cat-121'"),
      write: await failure(db, "insert into specialization.region_nodes (region_id, node_id, role) values ('forearm', 'forearm.fcu', 'target')"),
    }));
    expect(seen).toEqual({
      upperArm: [
        "upper_arm.biceps target", "upper_arm.brachialis target", "upper_arm.triceps group", "upper_arm.triceps_long target", "upper_arm.triceps_lateral target", "upper_arm.triceps_medial target",
        "upper_arm.coracobrachialis adjacent", "forearm.br external",
      ],
      biceps: ["forearm external", "upper_arm target"],
      attributes: 1,
      write: "permission denied for table region_nodes",
    });
    expect(await as(db, "anon", () => failure(db, "select 1 from specialization.region_nodes"))).toMatch(/permission denied for schema specialization/);
    expect(await as(db, userA, () => failure(db, "insert into specialization.goals (id, region_id, node_id, side, metric, target, period, starts_on, timezone) values ('g', 'upper_arm', 'forearm.fcu', 'left', 'direct_dynamic_bouts', 5, 'calendar_week', '2026-10-19', 'UTC')"))).toMatch(
      /node forearm\.fcu is not a listed target muscle of region upper_arm/,
    );
    expect(await as(db, userA, () => failure(db, "insert into specialization.goals (id, region_id, node_id, side, metric, target, period, starts_on, timezone) values ('g2', 'upper_arm', 'upper_arm.biceps', 'left', 'direct_dynamic_bouts', 5, 'calendar_week', '2026-10-19', 'UTC')"))).toBeNull();
  });
});

// ---------------------------------------------------------------- how it reached production (22 Oct 2026)

describe("applied over what production held (schema v1 and seed v1)", () => {
  it("writes the forearm region row's new columns and its own tables' rows, and touches no other existing row; applied again, nothing; seed v2 after it, two existing rows: the upper arm's region row in schema v2's columns and the forearm's progress subtitle", async () => {
    const fresh = await createSupabaseLikeDb();
    try {
      await replayMigrations(fresh, "seed v1");
      const before = await rowVersions(fresh);
      const regionRow = (id: string) => rows<{ row: Record<string, unknown>; v: string }>(fresh, "select to_jsonb(r) as row, xmin::text || '@' || ctid::text as v from specialization.regions r where id = $1", [id]).then((found) => found[0]);
      const [forearm, upperArm] = [await regionRow("forearm"), await regionRow("upper_arm")];
      await applyMigration(fresh, SCHEMA_V2_MIGRATION_PATH);
      const after = await rowVersions(fresh);
      const touched = Object.keys(before).filter((table) => before[table].some((version) => !after[table].includes(version)));
      expect(touched).toEqual(["regions"]);
      expect((await regionRow("upper_arm")).v).toBe(upperArm.v);
      const changed = (await regionRow("forearm")).row;
      expect(Object.fromEntries(Object.entries(changed).filter(([column]) => !REGION_COLUMNS.includes(column)))).toEqual(forearm.row);
      expect(Object.fromEntries(REGION_COLUMNS.map((column) => [column, changed[column]]))).toEqual(FOREARM_SIDES);
      // Adding side_relation with a constant default wrote no mapping row.
      expect(after.variant_mappings).toEqual(before.variant_mappings);

      await applyMigration(fresh, SCHEMA_V2_MIGRATION_PATH);
      expect(await rowVersions(fresh)).toEqual(after);

      // Seed v2 after it, as production ran it: two existing rows change, both region rows: the upper arm's in the columns schema v2 added, and the
      // forearm's in one v1 column, its Progress subtitle, which no longer says "by arm" (both sides as one; server/specializationSeed.test.ts holds the rest).
      const [upperArmBefore, forearmBefore] = [await regionRow("upper_arm"), await regionRow("forearm")];
      await applyMigration(fresh, SEED_V2_MIGRATION_PATH);
      const seeded = await rowVersions(fresh);
      for (const table of Object.keys(after)) expect(after[table].filter((version) => !seeded[table].includes(version)).sort(), table).toEqual(table === "regions" ? [forearmBefore.v, upperArmBefore.v].sort() : []);
      const upperArmAfter = (await regionRow("upper_arm")).row;
      expect(Object.fromEntries(Object.entries(upperArmAfter).filter(([column]) => !REGION_COLUMNS.includes(column)))).toEqual(upperArm.row);
      expect(forearmBefore.row.progress_subtitle).toBe("Circumference and grip, by arm");
      expect((await regionRow("forearm")).row).toEqual({ ...forearmBefore.row, progress_subtitle: "Circumference and grip" });
    } finally {
      await fresh.close();
    }
  }, SETUP);

  it("locks nothing outside schema specialization; inside it, holds ACCESS EXCLUSIVE on the six tables it alters, which nothing in the app reads", async () => {
    const fresh = await createSupabaseLikeDb();
    const held = (where: string) =>
      rows<{ relation: string; mode: string }>(
        fresh,
        `select n.nspname || '.' || c.relname as relation, l.mode from pg_locks l join pg_class c on c.oid = l.relation join pg_namespace n on n.oid = c.relnamespace
         where l.locktype = 'relation' and l.pid = pg_backend_pid() and c.relkind in ('r', 'p') and ${where} order by 1, 2`,
      );
    try {
      await replayMigrations(fresh, "seed v1");
      await fresh.exec("begin");
      await applyMigration(fresh, SCHEMA_V2_MIGRATION_PATH);
      expect(await held("n.nspname not in ('specialization', 'pg_catalog', 'information_schema')")).toEqual([]);
      const exclusive = (await held(`n.nspname = 'specialization' and l.mode = 'AccessExclusiveLock' and c.relname <> all (array['${NEW_TABLES.join("', '")}'])`)).map((lock) => lock.relation);
      expect(exclusive).toEqual(["diagram_assets", "exercise_variants", "goals", "measurements", "regions", "variant_mappings"].map((table) => `specialization.${table}`));
      await fresh.exec("rollback");
    } finally {
      await fresh.close();
    }
  }, SETUP);

  it("is one statement as a DO block, holds no transaction control, and gives the same database as applying it directly; refuses itself the same way over a region without a side model", async () => {
    const text = readMigration(SCHEMA_V2_MIGRATION_PATH);
    expect(asDoBlock(text).slice("do $outer$ declare body text := $body$".length, -"$body$; begin execute body; end $outer$;".length)).toBe(text);
    const code = text.split("\n").filter((line) => !/^\s*--/.test(line)).join("\n");
    expect(code).not.toMatch(/\b(commit|rollback|savepoint|release)\b\s*;|\bstart\s+transaction\b|\bbegin\s*(transaction|work)?\s*;|\bconcurrently\b/i);

    const direct = await createSupabaseLikeDb();
    const wrapped = await createSupabaseLikeDb();
    try {
      for (const target of [direct, wrapped]) {
        await replayMigrations(target, "seed v1");
        // A fixture region written under v1 has no side model: schema v2 refuses itself, applying nothing.
        await target.exec(`insert into specialization.regions (id, label, status, ${PAGE_WORDS}) values ('zz_fixture', 'Fixture', 'fixture', ${PAGE_VALUES})`);
      }
      const v1 = await snapshot(direct);
      const refusal = /regions without a complete side model: zz_fixture/;
      expect(await scriptFailure(direct, text)).toMatch(refusal);
      expect(await scriptFailure(wrapped, asDoBlock(text))).toMatch(refusal);
      expect(await snapshot(direct)).toEqual(v1);
      expect(await snapshot(wrapped)).toEqual(v1);
      for (const target of [direct, wrapped]) await target.exec("delete from specialization.regions where id = 'zz_fixture'");

      // As production ran them (schema v2, seed v2, seed v3), and the current seed after them.
      for (const path of [SCHEMA_V2_MIGRATION_PATH, SCHEMA_V2_MIGRATION_PATH, SEED_V2_MIGRATION_PATH, SEED_V3_MIGRATION_PATH, SEED_MIGRATION_PATH]) {
        await applyMigration(direct, path);
        await applyMigrationAsDoBlock(wrapped, path);
      }
      const expected = await snapshot(direct);
      expect(expected.data.region_nodes).toHaveLength(SEEDED_MEMBERS);
      expect(await snapshot(wrapped)).toEqual(expected);
    } finally {
      await direct.close();
      await wrapped.close();
    }
  }, SETUP);

  it("production applies the specialization migrations in name order: the applied files, any pending schema, the current seed", () => {
    const files = readdirSync(resolve(process.cwd(), "supabase/migrations")).filter((name) => name.includes("_specialization_atlas_")).sort();
    const order = [...APPLIED_MIGRATION_PATHS, ...PENDING_MIGRATION_PATHS, SEED_MIGRATION_PATH];
    expect(files).toEqual(order.map((path) => basename(path)));
    expect([...new Set(MIGRATION_STEPS.map((entry) => entry.path))]).toEqual(order);
    for (const path of order) expect(MIGRATION_STEPS.filter((entry) => entry.path === path), basename(path)).toHaveLength(path.includes("_schema") ? 2 : 1);
  });
});

// ---------------------------------------------------------------- the undo

describe("the undo (scripts/specialization/release/schema_v2_undo.sql)", () => {
  const undo = readFileSync(UNDO_PATH, "utf8");
  const recorded = (target: PGlite) => rows<{ version: string; name: string }>(target, "select version, name from supabase_migrations.schema_migrations order by version");

  it("is one DO block with no transaction control, kept out of supabase/migrations", () => {
    const code = undo.split("\n").filter((line) => !/^\s*--/.test(line)).join("\n").trim();
    expect(code.startsWith("do $undo$")).toBe(true);
    expect(code.endsWith("$undo$;")).toBe(true);
    expect(code.split("$undo$")).toHaveLength(3);
    expect(code).not.toMatch(/\b(commit|rollback|savepoint|release)\b\s*;|\bstart\s+transaction\b|\bbegin\s*(transaction|work)?\s*;|\bconcurrently\b/i);
    expect(readdirSync(resolve(process.cwd(), "supabase/migrations")).filter((name) => name.includes("undo"))).toEqual([]);
  });

  it("after schema v2 and seed v2, what production held from 22 to 24 Oct 2026, gives the database schema v1 and seed v1 gave (goals_no_overlap keyed on the side again), plus what seed v2 wrote to v1's tables and the goals kept; both then apply again; it refuses once seed v3 is recorded, after a publish under schema v2, while a goal names what schema v2 would not list, and while a variant uses not_applicable", async () => {
    const target = await createSupabaseLikeDb();
    // Production as it stood from 22 to 24 Oct 2026: every file through seed v2, seed v3 not yet.
    const production = await createSupabaseLikeDb();
    try {
      await replayMigrations(production, "seed v2");
      await replayMigrations(target, "seed v1");
      const v1 = await snapshot(target);
      const v1Recorded = await recorded(target);
      for (const path of [SCHEMA_V2_MIGRATION_PATH, SCHEMA_V2_MIGRATION_PATH, SEED_V2_MIGRATION_PATH]) {
        await applyMigration(target, path);
        await recordMigration(target, path);
      }
      expect(await recorded(target)).toEqual([...v1Recorded, migrationRecord(SCHEMA_V2_MIGRATION_PATH), migrationRecord(SEED_V2_MIGRATION_PATH)]);
      expect(await recorded(target)).toEqual(await recorded(production));
      // A user's goals on a forearm muscle and movement: schema v2 lists both before it adds the goals' keys, so they survive the
      // undo and the apply after it (a goal on the upper arm, which only the seed lists, is refused: it has no page yet).
      await as(target, { user: USER_A }, async () => {
        for (const [id, node, action] of [["undo-fcu", "forearm.fcu", null], ["undo-wrist", null, "wrist.flexion"]]) {
          expect(
            await failure(
              target,
              "insert into specialization.goals (id, region_id, node_id, action_id, side, metric, target, period, starts_on, timezone) values ($1, 'forearm', $2, $3, 'left', 'direct_dynamic_bouts', 6, 'calendar_week', '2026-10-19', 'UTC')",
              [id, node, action],
            ),
          ).toBeNull();
        }
        expect(await failure(target, "insert into specialization.goals (id, region_id, node_id, side, metric, target, period, starts_on, timezone) values ('undo-biceps', 'upper_arm', 'upper_arm.biceps', 'left', 'direct_dynamic_bouts', 6, 'calendar_week', '2026-10-19', 'UTC')")).toMatch(
          /region upper_arm has no page yet/,
        );
      });
      const beforeUndo = await rowVersions(target);
      // The undo's limit (its header, 04-database.md §10): what seed v2 wrote to a table of v1's stays. That is the upper arm's
      // two shoulder actions, added, and one value rewritten, the forearm's Progress subtitle, which no longer says "by arm"
      // (both sides as one); every other row it wrote is in schema v2's tables. The goals stay too.
      const seeded = await snapshot(target);
      const v1Columns = (table: string) => new Set(v1.catalog.columns.filter((column) => column.table_name === table).map((column) => column.column_name as string));
      const asV1Row = (table: string, row: string) => JSON.stringify(Object.fromEntries(Object.entries(JSON.parse(row) as Record<string, unknown>).filter(([column]) => v1Columns(table).has(column))));
      const idOf = (row: string) => (JSON.parse(row) as { id?: string }).id;
      const v1Ids = (table: string) => new Set(v1.data[table].map(idOf).filter((id) => id !== undefined));
      const notInV1 = Object.fromEntries(Object.keys(v1.data).map((table) => [table, seeded.data[table].map((row) => asV1Row(table, row)).filter((row) => !v1.data[table].includes(row))]));
      const added = Object.fromEntries(Object.entries(notInV1).map(([table, extra]) => [table, extra.filter((row) => !v1Ids(table).has(idOf(row)!))]));
      const rewritten = Object.fromEntries(Object.entries(notInV1).map(([table, extra]) => [table, extra.filter((row) => v1Ids(table).has(idOf(row)!))]));
      const idsOf = (byTable: Record<string, string[]>) => Object.fromEntries(Object.entries(byTable).filter(([, extra]) => extra.length).map(([table, extra]) => [table, extra.map(idOf)]));
      expect(idsOf(added)).toEqual({
        actions: ["shoulder.extension", "shoulder.flexion"],
        goals: ["undo-fcu", "undo-wrist"],
      });
      expect(idsOf(rewritten)).toEqual({ regions: ["forearm"] });
      const forearmIn = (list: string[]) => JSON.parse(list.find((row) => idOf(row) === "forearm")!) as Record<string, unknown>;
      expect(forearmIn(rewritten.regions)).toEqual({ ...forearmIn(v1.data.regions), progress_subtitle: "Circumference and grip" });
      expect(forearmIn(v1.data.regions).progress_subtitle).toBe("Circumference and grip, by arm");
      // goals_no_overlap: schema v2 keys a target without its side, and the side columns' comments say `right` is a placeholder.
      const overlapRule = (state: Awaited<ReturnType<typeof snapshot>>) => ({
        constraint: state.catalog.constraints.filter((row) => row.relname === "goals" && row.conname === "goals_no_overlap"),
        index: state.catalog.indexes.filter((row) => row.indexname === "goals_no_overlap"),
        sideComments: state.catalog.columns.filter((row) => (row.table_name === "goals" || row.table_name === "measurements") && row.column_name === "side").map((row) => row.comment),
      });
      expect(overlapRule(v1).constraint).toEqual([{ relname: "goals", conname: "goals_no_overlap", def: expect.stringMatching(/\bside WITH =/) }]);
      expect(overlapRule(v1).sideComments).toEqual([null, null]);
      expect(overlapRule(seeded).constraint).toEqual([{ relname: "goals", conname: "goals_no_overlap", def: expect.not.stringMatching(/\bside\b/) }]);
      expect(overlapRule(seeded).sideComments).toEqual([expect.stringMatching(/right is a placeholder/), expect.stringMatching(/right is a placeholder/)]);

      expect(await scriptFailure(target, undo)).toBeNull();
      // Catalog (tables, columns, constraints, indexes, triggers, functions with their bodies, policies, grants, comments) and rows, table by table.
      const undone = await snapshot(target);
      // v1's goals_no_overlap again, its definition and index as v1 wrote them (the side a key again), and v1's comments, none.
      expect(overlapRule(undone)).toEqual(overlapRule(v1));
      expect(undone.catalog).toEqual(v1.catalog);
      for (const table of Object.keys(v1.data)) {
        const kept = v1.data[table].filter((row) => !rewritten[table].some((now) => idOf(now) === idOf(row)));
        expect(undone.data[table], table).toEqual([...kept, ...added[table], ...rewritten[table]].sort());
      }
      expect(Object.keys(undone.data)).toEqual(Object.keys(v1.data));
      expect(await recorded(target)).toEqual(v1Recorded);
      // It wrote no row of v1's tables.
      const afterUndo = await rowVersions(target);
      for (const table of Object.keys(afterUndo)) expect(afterUndo[table], table).toEqual(beforeUndo[table]);

      // Applied again (the apply tool takes both files again): the same database as production's, but for the
      // columns' order (a dropped column leaves its number unused, so the re-added ones are numbered after it).
      for (const path of [SCHEMA_V2_MIGRATION_PATH, SCHEMA_V2_MIGRATION_PATH, SEED_V2_MIGRATION_PATH]) {
        await applyMigration(target, path);
        await recordMigration(target, path);
      }
      const unnumbered = ({ catalog, data }: Awaited<ReturnType<typeof snapshot>>) => ({
        catalog: { ...catalog, columns: catalog.columns.map(({ ordinal_position: _position, ...column }) => column) },
        data,
      });
      expect(await count(target, "select 1 from specialization.goals where id like 'undo-%'")).toBe(2);
      await target.exec("delete from specialization.goals where id like 'undo-%'");
      const reapplied = await snapshot(target);
      expect(unnumbered(reapplied)).toEqual(unnumbered(await snapshot(production)));
      expect(await recorded(target)).toEqual(await recorded(production));

      // Seed v3, recorded as the apply recorded it on 24 Oct 2026: refused, nothing changed. Its version sorts after seed v2's,
      // which is what the undo reads.
      expect(migrationRecord(SEED_V3_MIGRATION_PATH)).toEqual({ version: "20261022120100", name: "specialization_atlas_seed_v3" });
      await recordMigration(target, SEED_V3_MIGRATION_PATH);
      expect(await scriptFailure(target, undo)).toMatch(/schema v2 cannot be undone: 20261022120100 specialization_atlas_seed_v3 is recorded, and from seed v3 on the specialization schema is forward-only/);
      expect(await snapshot(target)).toEqual(reapplied);
      await target.query("delete from supabase_migrations.schema_migrations where version = $1", [migrationRecord(SEED_V3_MIGRATION_PATH).version]);

      // Refused, changing nothing, in a transaction rolled back after: what a publish under schema v2 rests on, however it was
      // published (here by hand), or a frozen attribute alone; and a goal on what only the seed lists, stored past the goals trigger.
      const refusedWith = async (setup: string, refusal: RegExp) => {
        await target.exec("begin");
        try {
          await target.exec(setup);
          const ready = await snapshot(target);
          expect(await scriptFailure(target, undo)).toMatch(refusal);
          await target.exec("rollback to savepoint undo_ready");
          expect(await snapshot(target)).toEqual(ready);
        } finally {
          await target.exec("rollback");
        }
        expect(await snapshot(target)).toEqual(reapplied);
      };
      await refusedWith(
        `insert into specialization.mapping_versions (version_key, region_id, method_notes) values ('zz_undo_v1', 'forearm', 'Test version.');
         insert into specialization.variant_mappings (version_id, mapping_key, variant_key, node_id, action_id, relationship, muscle_mode, evidence_basis, rationale, review_status)
           select v.id, 'cat-139:forearm.fcu', 'cat-139', 'forearm.fcu', 'wrist.flexion', 'direct', 'dynamic', 'anatomy', 'Test mapping.', 'reviewed' from specialization.mapping_versions v where v.version_key = 'zz_undo_v1';
         insert into specialization.mapping_sources (mapping_id, source_id, locator)
           select m.id, s.id, 'Test' from specialization.variant_mappings m join specialization.mapping_versions v on v.id = m.version_id, specialization.sources s
           where v.version_key = 'zz_undo_v1' and s.source_key = 'A8';
         update specialization.mapping_versions set state = 'published' where version_key = 'zz_undo_v1';
         savepoint undo_ready;`,
        /schema v2 cannot be undone: a version published under it rests on what it added \(zz_undo_v1 \(published\)\)/,
      );
      // Only a publish freezes an attribute; frozen here past its guard, as an attribute left frozen by a publish the database no longer holds.
      await refusedWith(
        `alter table specialization.variant_attributes disable trigger variant_attributes_guard_frozen;
         update specialization.variant_attributes set frozen_at = now() where variant_key = 'cat-139';
         alter table specialization.variant_attributes enable trigger variant_attributes_guard_frozen;
         savepoint undo_ready;`,
        /schema v2 cannot be undone: a version published under it rests on what it added \(attributes of cat-139\)/,
      );
      await refusedWith(
        `alter table specialization.goals disable trigger goals_check_target;
         insert into specialization.goals (user_id, id, region_id, node_id, action_id, side, metric, target, period, starts_on, timezone) values
           ('${USER_A}', 'undo-biceps', 'upper_arm', 'upper_arm.biceps', null, 'left', 'direct_dynamic_bouts', 6, 'calendar_week', '2026-10-19', 'UTC'),
           ('${USER_A}', 'undo-shoulder', 'upper_arm', null, 'shoulder.flexion', 'left', 'direct_dynamic_bouts', 6, 'calendar_week', '2026-10-19', 'UTC'),
           ('${USER_A}', 'undo-fcu', 'forearm', 'forearm.fcu', null, 'left', 'direct_dynamic_bouts', 6, 'calendar_week', '2026-10-19', 'UTC');
         alter table specialization.goals enable trigger goals_check_target;
         savepoint undo_ready;`,
        /schema v2 cannot be undone: goals undo-biceps, undo-shoulder name a muscle or movement that schema v2, applied again, would not list first, so it could not be applied again/,
      );

      // A variant only schema v2 allows: refused, nothing changed.
      await target.exec(`
        insert into specialization.catalog_exercises (catalog_id, name) values (9001, 'Test leg press');
        insert into specialization.exercise_variants (variant_key, catalog_id, organization, forearm_orientation, wrist_position, grip_type, straps, laterality, phase, measure, deliberate_hold)
          values ('zz-leg-press', 9001, 'multi_joint', 'not_applicable', 'not_applicable', 'none', 'not_applicable', 'not_applicable', 'concentric_eccentric', 'reps', false);
      `);
      const withVariant = await snapshot(target);
      expect(await scriptFailure(target, undo)).toMatch(/schema v2 cannot be undone: variants zz-leg-press use not_applicable, which schema v1's checks refuse/);
      expect(await snapshot(target)).toEqual(withVariant);
    } finally {
      await target.close();
      await production.close();
    }
  }, SETUP);
});

// ---------------------------------------------------------------- the apply tool

describe("the apply tool (scripts/specialization/release/make-apply-sql.mjs)", () => {
  const sha = "0123456789abcdef0123456789abcdef01234567";
  // Wave 0's two files, as production applied them on 22 Oct 2026, wave A's seed v3, applied on 24 Oct, and the current seed,
  // which the next release applies after them.
  const files = [SCHEMA_V2_MIGRATION_PATH, SEED_V2_MIGRATION_PATH, SEED_V3_MIGRATION_PATH, SEED_MIGRATION_PATH].map((path) => basename(path));
  const urlOf = (file: string) => `https://raw.githubusercontent.com/LocalForgeWeb/Sports-genome/${sha}/supabase/migrations/${file}`;
  const run = (args: string[]) => execFileSync(process.execPath, [APPLY_TOOL, ...args], { encoding: "utf8", stdio: "pipe" });
  let out: string;

  beforeAll(() => {
    out = mkdtempSync(join(tmpdir(), "atlas-apply-"));
    run([sha, out, ...files]);
  });

  afterAll(() => {
    if (out) rmSync(out, { recursive: true, force: true });
  });

  const applySql = (file: string) => readFileSync(join(out, file.replace(/\.sql$/, ".apply.sql")), "utf8");

  it("writes one DO block per file given, and no drop-http.sql", () => {
    expect(readdirSync(out).sort()).toEqual(files.map((file) => file.replace(/\.sql$/, ".apply.sql")).sort());
    for (const [index, file] of files.entries()) {
      const sql = applySql(file);
      expect(sql.startsWith("do $apply$\n")).toBe(true);
      expect(sql.endsWith("\n$apply$;\n")).toBe(true);
      expect(sql.split("$apply$")).toHaveLength(3);
      expect(sql).not.toMatch(/drop extension/i);
      const text = readFileSync(resolve(process.cwd(), "supabase/migrations", file), "utf8");
      const steps = [
        "perform set_config('lock_timeout', '5000', true);",
        "create extension if not exists http with schema extensions;",
        "perform extensions.http_set_curlopt('CURLOPT_TIMEOUT', '30');",
        `select status, content into response from extensions.http_get('${urlOf(file)}');`,
        "if response.status <> 200 then raise exception",
        `<> '${createHash("sha256").update(Buffer.from(text, "utf8")).digest("hex")}' then`,
        "which production has not recorded",
        "which production recorded with other text than this commit holds",
        "is already recorded in supabase_migrations.schema_migrations",
        "execute response.content;",
        `insert into supabase_migrations.schema_migrations (version, name, statements) values ('${migrationRecord(file).version}', '${migrationRecord(file).name}', array[response.content]);`,
      ];
      const at = steps.map((step) => sql.indexOf(step));
      for (const [position, step] of steps.entries()) expect(at[position], step).toBeGreaterThan(-1);
      expect([...at].sort((a, b) => a - b)).toEqual(at);
      // Every earlier specialization migration, by version and name, and recorded with the text this commit holds.
      const earlierPaths = [...APPLIED_MIGRATION_PATHS, ...PENDING_MIGRATION_PATHS].slice(0, 2 + index);
      const earlier = earlierPaths.map((path) => migrationRecord(path));
      const list = (values: string[]) => `array[${values.map((value) => `'${value}'`).join(", ")}]::text[]`;
      expect(sql).toContain(`unnest(${list(earlier.map((entry) => entry.version))}, ${list(earlier.map((entry) => entry.name))}) as e (version, name)`);
      const digests = earlierPaths.map((path) => createHash("sha256").update(readFileSync(path)).digest("hex"));
      expect(digests.slice(0, 2)).toEqual([
        "b67a9cd7a90383c205686e17b029a55ffd5a59ee4d928189d3a7d16296da542d",
        "a267fdc4997699401822c2f4166a97b427fe28d8081bebcba037f963a35189f8",
      ]);
      expect(sql).toContain(`unnest(${list(earlier.map((entry) => entry.version))}, ${list(earlier.map((entry) => entry.name))}, ${list(digests)}) as e (version, name, digest)`);
    }
  });

  it("refuses a short sha, no files, and a file that is not a specialization migration", () => {
    expect(() => run(["abc123", out, files[0]])).toThrow(/full 40-character SHA/);
    expect(() => run([sha, out])).toThrow(/Pass the migration files to apply/);
    expect(() => run([sha, out, "20261016120000_other.sql"])).toThrow(/is not a specialization migration in supabase\/migrations/);
  });

  it("run in PGlite with http stood in for: refuses a file out of order, after an earlier file recorded with other text, a failed fetch, a changed file and one already recorded, changing nothing; applies and records the rest, the current seed last", async () => {
    const target = await createSupabaseLikeDb();
    const release = await createReleaseDb();
    try {
      await replayMigrations(target, "seed v1");
      // PGlite has no http extension: functions of the same names serve the repository's files.
      await target.exec(`
        create table extensions.http_files (url text primary key, status integer not null, content text);
        create function extensions.http_set_curlopt(curlopt text, value text) returns boolean language sql as 'select true';
        create function extensions.http_get(uri text, out status integer, out content text) language sql
          as $$ select coalesce(f.status, 404), f.content from (select 1) as one left join extensions.http_files f on f.url = uri $$;
      `);
      const serve = (file: string, status: number, content: string) =>
        target.query("insert into extensions.http_files (url, status, content) values ($1, $2, $3) on conflict (url) do update set status = excluded.status, content = excluded.content", [urlOf(file), status, content]);
      const apply = (file: string) => scriptFailure(target, applySql(file).replace("  create extension if not exists http with schema extensions;\n", ""));
      const [schemaV2, seedV2, seedV3, current] = files;
      const text = (file: string) => readFileSync(resolve(process.cwd(), "supabase/migrations", file), "utf8");
      const recorded = () => rows<{ version: string }>(target, "select version from supabase_migrations.schema_migrations order by 1").then((found) => found.map((row) => row.version));
      const v1 = await snapshot(target);

      await serve(seedV2, 200, text(seedV2));
      expect(await apply(seedV2)).toMatch(new RegExp(`${seedV2} applies after 20261019120000 specialization_atlas_schema_v2, which production has not recorded`));
      await serve(schemaV2, 404, "");
      expect(await apply(schemaV2)).toMatch(new RegExp(`Could not fetch ${schemaV2} at ${sha.slice(0, 12)}: HTTP 404`));
      await serve(schemaV2, 200, `${text(schemaV2)}\n-- changed`);
      expect(await apply(schemaV2)).toMatch(new RegExp(`Checksum mismatch for ${schemaV2}`));
      expect(await snapshot(target)).toEqual(v1);
      expect(await recorded()).toEqual(["20261016120000", "20261016120100"]);

      // Schema v2 recorded from another commit (seed v2 then failed, and the fix edited schema v2): the recorded text is
      // history this commit no longer has, so seed v2 is refused rather than run over a schema the repository does not hold.
      await target.query("insert into supabase_migrations.schema_migrations (version, name, statements) values ('20261019120000', 'specialization_atlas_schema_v2', array[$1])", [
        text(schemaV2).replace(/create or replace trigger regions_guard_published[\s\S]*?;\n/, ""),
      ]);
      expect(await apply(seedV2)).toMatch(
        new RegExp(`${seedV2} applies after 20261019120000 specialization_atlas_schema_v2, which production recorded with other text than this commit holds: a recorded file is history, so correct it in a new file`),
      );
      await target.query("update supabase_migrations.schema_migrations set statements = null where version = '20261019120000'");
      expect(await apply(seedV2)).toMatch(/which production recorded with other text than this commit holds/);
      await target.query("delete from supabase_migrations.schema_migrations where version = '20261019120000'");
      // So is a file after a schema v1 recorded with other text.
      await target.query("update supabase_migrations.schema_migrations set statements = array[$1] where version = '20261016120000'", ["-- another schema v1"]);
      await serve(schemaV2, 200, text(schemaV2));
      expect(await apply(schemaV2)).toMatch(new RegExp(`${schemaV2} applies after 20261016120000 specialization_atlas_schema, which production recorded with other text than this commit holds`));
      await target.query("update supabase_migrations.schema_migrations set statements = array[$1] where version = '20261016120000'", [readFileSync(APPLIED_MIGRATION_PATHS[0], "utf8")]);
      expect(await snapshot(target)).toEqual(v1);
      expect(await recorded()).toEqual(["20261016120000", "20261016120100"]);

      expect(await apply(schemaV2)).toBeNull();
      expect(await rows(target, "select name, statements = array[$1] as exact from supabase_migrations.schema_migrations where version = '20261019120000'", [text(schemaV2)])).toEqual([
        { name: "specialization_atlas_schema_v2", exact: true },
      ]);
      const afterSchema = await snapshot(target);
      expect(await apply(schemaV2)).toMatch(new RegExp(`${schemaV2} is already recorded in supabase_migrations.schema_migrations`));
      expect(await snapshot(target)).toEqual(afterSchema);
      // Seed v3 waits for seed v2.
      await serve(seedV3, 200, text(seedV3));
      expect(await apply(seedV3)).toMatch(new RegExp(`${seedV3} applies after 20261019120100 specialization_atlas_seed_v2, which production has not recorded`));
      expect(await snapshot(target)).toEqual(afterSchema);
      expect(await apply(seedV2)).toBeNull();
      expect(await recorded()).toEqual(["20261016120000", "20261016120100", "20261019120000", "20261019120100"]);
      expect((await snapshot(target)).catalog).toEqual((await snapshot(db)).catalog);
      // Then seed v3, as production applied it on 24 Oct 2026; the current seed waits for it.
      await serve(current, 200, text(current));
      const afterSeedV2 = await snapshot(target);
      expect(await apply(current)).toMatch(new RegExp(`${current} applies after 20261022120100 specialization_atlas_seed_v3, which production has not recorded`));
      expect(await snapshot(target)).toEqual(afterSeedV2);
      expect(await apply(seedV3)).toBeNull();
      expect(await recorded()).toEqual(["20261016120000", "20261016120100", "20261019120000", "20261019120100", "20261022120100"]);
      // Then the current seed applies over what production holds: the release database, history included.
      expect(await apply(current)).toBeNull();
      expect(await recorded()).toEqual(["20261016120000", "20261016120100", "20261019120000", "20261019120100", "20261022120100", "20261024120100"]);
      expect(await snapshot(target)).toEqual(await snapshot(release));
      expect(await recorded()).toEqual((await rows<{ version: string }>(release, "select version from supabase_migrations.schema_migrations order by 1")).map((row) => row.version));
    } finally {
      await target.close();
      await release.close();
    }
  }, SETUP);
});
