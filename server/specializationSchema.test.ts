import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { goalsForBothArms } from "@shared/specialization/goals";
import {
  SCHEMA_MIGRATION_PATH,
  SEED_MIGRATION_PATH,
  USER_A,
  USER_B,
  applyMigration,
  as,
  count,
  createSeededDb,
  createSupabaseLikeDb,
  failure,
  readMigration,
  rows,
} from "./fixtures/specializationPg";

/**
 * Schema `specialization` in real Postgres (PGlite, Postgres 17): the migration applied
 * twice, the seed on top, then every grant, policy, constraint and trigger exercised as
 * the caller it is meant for — anon, two signed-in users, the service role — switching
 * identity the way the API does (JWT subject, then SET ROLE). The design is
 * docs/specialization-atlas/04-database.md.
 */

const SETUP = 120_000;

const REFERENCE_TABLES = [
  "regions", "actions", "nodes", "sources", "claims", "claim_sources", "node_actions",
  "diagram_assets", "diagram_paths", "diagram_labels", "catalog_exercises", "exercise_variants",
  "mapping_versions", "variant_mappings", "mapping_sources", "rule_versions",
];
const PERSONAL_TABLES = ["goals", "measurements"];
const ALL_TABLES = [...REFERENCE_TABLES, ...PERSONAL_TABLES];

/** A text column per reference table, for an UPDATE that would change nothing. */
const UPDATABLE: Record<string, string> = {
  regions: "label", actions: "label", nodes: "name", sources: "title", claims: "statement", claim_sources: "locator",
  node_actions: "role", diagram_assets: "license_note", diagram_paths: "d", diagram_labels: "label_text",
  catalog_exercises: "name", exercise_variants: "notes", mapping_versions: "method_notes", variant_mappings: "rationale",
  mapping_sources: "locator", rule_versions: "notes",
};

const userA = { user: USER_A };
const userB = { user: USER_B };

let db: Awaited<ReturnType<typeof createSeededDb>>;

beforeAll(async () => {
  db = await createSeededDb();
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
      expect(of("service_role", table), `service_role on ${table}`).toEqual(expect.arrayContaining(["DELETE", "INSERT", "SELECT", "UPDATE"]));
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

describe("CHECK vocabularies match shared/specialization/types.ts", () => {
  const typesSource = readFileSync(resolve(process.cwd(), "shared/specialization/types.ts"), "utf8");
  const literals = (text: string) => [...text.matchAll(/"([^"]+)"/g)].map((match) => match[1]).sort();
  const union = (name: string) => {
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
    ["diagram_paths", "view", () => union("DiagramViewId")],
    ["diagram_paths", "layer", () => union("DiagramLayerId")],
    ["diagram_paths", "kind", () => union("DiagramPathKind")],
    ["diagram_labels", "view", () => union("DiagramViewId")],
    ["diagram_labels", "layer", () => union("DiagramLayerId")],
    ["diagram_labels", "anchor", () => property("DiagramLabel", "anchor")],
    ["goals", "side", () => union("ArmSide")],
    ["goals", "metric", () => union("GoalMetric")],
    ["goals", "period", () => union("GoalPeriod")],
    ["measurements", "side", () => union("ArmSide")],
    ["measurements", "metric", () => union("MeasurementMetric")],
    // `reference` is the database's own: a region that only holds external contributors.
    ["regions", "status", () => [...property("SpecializationRegion", "status"), "reference"].sort()],
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
        insert into specialization.regions (id, label, heading, status, entry_label) values ('zz_fixture', 'Fixture', 'Fixture', 'fixture', 'Fixture');
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
    expect(owner[0]).toMatchObject({ nodes: 24, claims: 60, node_actions: 38 });
    const hidden = await as(db, userA, () => count(db, "select 1 from specialization.claims where claim_key like 'test:%' union all select 1 from specialization.nodes where id = 'forearm.zz_hidden'"));
    expect(hidden).toBe(0);
  });

  it("sees the published mapping version's reviewed rows only: not its 5 drafts, not an unpublished version", async () => {
    const versions = await as(db, userA, () => rows<{ version_key: string }>(db, "select version_key from specialization.mapping_versions"));
    expect(versions.map((row) => row.version_key)).toEqual(["forearm_mappings_v1"]);
    const seen = await as(db, userA, () => rows<{ review_status: string; n: number }>(db, "select review_status, count(*)::int as n from specialization.variant_mappings group by 1"));
    expect(seen).toEqual([{ review_status: "reviewed", n: 399 }]);
    const drafts = await count(db, "select 1 from specialization.variant_mappings m join specialization.mapping_versions v on v.id = m.version_id where v.version_key = 'forearm_mappings_v1' and m.review_status = 'draft'");
    expect(drafts).toBe(5);
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
    expect(seen[0]).toEqual({ rules: ["specialization_exposure_v1"], sources: 71, actions: 20, variants: 117, catalog: 117 });
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
const goalValues = (goal: ReturnType<typeof goalsForBothArms>[number]) => [
  goal.id, goal.regionId, goal.nodeId, goal.actionId, goal.side, goal.metric, goal.target, goal.period, goal.startsOn, goal.endsOn, goal.timezone, goal.createdAt, goal.updatedAt,
];
/** Reads a row back in the device's own shape (SpecializationGoal). */
const goalAsDevice = `select id, region_id as "regionId", node_id as "nodeId", action_id as "actionId", side, metric, target::float8 as target, period,
  starts_on::text as "startsOn", ends_on::text as "endsOn", timezone,
  to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "createdAt", to_char(updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "updatedAt"
  from specialization.goals`;

describe("goals: owner-only, and a straight copy of the device record", () => {
  const [left, right] = goalsForBothArms({
    id: "goal-rls-1",
    regionId: "forearm",
    nodeId: "forearm.fcu",
    actionId: null,
    metric: "direct_dynamic_bouts",
    target: 20,
    period: "calendar_week",
    startsOn: "2026-10-12",
    endsOn: null,
    timezone: "Europe/London",
    createdAt: "2026-10-16T09:30:00.000Z",
    updatedAt: "2026-10-16T09:30:00.000Z",
  });
  const insert = `insert into specialization.goals (${goalColumns}) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`;

  it("user A stores both arms' goals as they are on the device, and reads them back unchanged", async () => {
    await as(db, userA, async () => {
      expect(await failure(db, insert, goalValues(left))).toBeNull();
      expect(await failure(db, insert, goalValues(right))).toBeNull();
      const back = await rows(db, `${goalAsDevice} where id like 'goal-rls-1:%' order by id`);
      expect(back).toEqual([left, right]);
    });
    expect(await count(db, "select 1 from specialization.goals where id like 'goal-rls-1:%' and user_id = $1", [USER_A])).toBe(2);
  });

  it("user B cannot read, change or delete A's goals, nor write one in A's name", async () => {
    await as(db, userB, async () => {
      expect(await count(db, "select 1 from specialization.goals where id like 'goal-rls-1:%'")).toBe(0);
      expect(await affected("update specialization.goals set target = 1 where id = 'goal-rls-1:left'")).toBe(0);
      expect(await affected("delete from specialization.goals where id = 'goal-rls-1:left'")).toBe(0);
      expect(await failure(db, `insert into specialization.goals (user_id, ${goalColumns}) values ($14, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`, [...goalValues({ ...left, id: "goal-forged" }), USER_A])).toMatch(/row-level security/);
    });
    expect(await rows(db, "select target::float8 as target from specialization.goals where id = 'goal-rls-1:left'")).toEqual([{ target: 20 }]);
  });

  it("user A cannot hand a goal to B, but can change and delete their own", async () => {
    await as(db, userA, async () => {
      expect(await failure(db, "update specialization.goals set user_id = $1 where id = 'goal-rls-1:left'", [USER_B])).toMatch(/row-level security/);
      expect(await affected("update specialization.goals set target = 40 where id = 'goal-rls-1:left'")).toBe(1);
      const [touched] = await rows<{ updatedAt: string; target: number }>(db, `${goalAsDevice} where id = 'goal-rls-1:left'`);
      expect(touched.target).toBe(40);
      expect(touched.updatedAt).not.toBe(left.updatedAt);
      // A sync that carries the device's own time keeps it.
      await db.query("update specialization.goals set target = 41, updated_at = '2026-10-17T08:00:00Z' where id = 'goal-rls-1:left'");
      expect((await rows<{ updatedAt: string }>(db, `${goalAsDevice} where id = 'goal-rls-1:left'`))[0].updatedAt).toBe("2026-10-17T08:00:00.000Z");
      expect(await affected("delete from specialization.goals where id = 'goal-rls-1:right'")).toBe(1);
    });
  });

  it("a signed-in role with no user id writes nothing", async () => {
    await as(db, { user: "" }, async () => {
      expect(await failure(db, insert, goalValues({ ...left, id: "goal-nobody" }))).toMatch(/row-level security|null value in column "user_id"/);
    });
  });

  it("anon is refused at the schema", async () => {
    expect(await as(db, "anon", () => failure(db, "select 1 from specialization.goals"))).toMatch(/permission denied for schema specialization/);
  });

  it("the service role reads every user's goals and can write for any user", async () => {
    await as(db, "service_role", async () => {
      expect(await failure(db, `insert into specialization.goals (user_id, ${goalColumns}) values ($14, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`, [...goalValues({ ...right, id: "goal-service-b" }), USER_B])).toBeNull();
      const owners = await rows<{ user_id: string }>(db, "select distinct user_id from specialization.goals where id in ('goal-rls-1:left', 'goal-service-b') order by 1");
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
      expect(await failure(db, "update specialization.claims set kind = 'appearance' where claim_key = 'forearm:fcr.function'")).toMatch(/node_actions_function_claim_of_same_node/);
      expect(await failure(db, insert, ["forearm:fcr.function"])).toBeNull();
      await db.query("delete from specialization.node_actions where node_id = 'forearm.fcr' and action_id = 'wrist.extension'");
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

describe("publishing a mapping version", () => {
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

  it("allows the next period, the other arm, another measure or period, a movement target, and another user", async () => {
    expect(await tryGoal({ id: "ok-next", from: "2026-11-01" })).toBeNull();
    expect(await tryGoal({ id: "ok-right", side: "right", from: "2026-10-01", to: "2026-10-31" })).toBeNull();
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
  it("drops cleanly with the header's SQL, and the schema and seed apply again", async () => {
    const fresh = await createSupabaseLikeDb();
    try {
      await applyMigration(fresh, SCHEMA_MIGRATION_PATH);
      await applyMigration(fresh, SEED_MIGRATION_PATH);
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
      await applyMigration(fresh, SEED_MIGRATION_PATH);
      const [after] = (await fresh.query<{ mappings: number; goals: number }>("select (select count(*)::int from specialization.variant_mappings) as mappings, (select count(*)::int from specialization.goals) as goals")).rows;
      expect(after).toEqual({ mappings: 404, goals: 0 });
    } finally {
      await fresh.close();
    }
  }, SETUP);
});
