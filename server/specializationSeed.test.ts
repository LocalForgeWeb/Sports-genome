import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { forearmRegionData } from "@shared/specialization/regions/forearm";
import { specializationRegions } from "@shared/specialization/registry";
import { exposureRuleV1 } from "@shared/specialization/rules";
import { deltoidRegionData } from "@/lib/specialization/__fixtures__/deltoidRegion";
import { emitSeedSql, productionSeedInput, quote, referenceRegionLabels, type SeedInput } from "../scripts/specialization/emit-seed";
import { SEED_MIGRATION_PATH, USER_A, applyMigration, as, count, createSeededDb, readMigration, rows, scriptFailure, stubExercises } from "./fixtures/specializationPg";

/**
 * The seed migration is generated from the TypeScript content (scripts/specialization/
 * emit-seed.ts). This holds the committed file to the generator byte for byte, applies
 * it to Postgres (PGlite) and reads every record back in the content's own shape, so
 * "the database carries the content" is checked, not assumed.
 */

const SETUP = 120_000;
const byId = <T extends { id: string }>(a: T, b: T) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

let db: Awaited<ReturnType<typeof createSeededDb>>;

beforeAll(async () => {
  db = await createSeededDb();
}, SETUP);

afterAll(async () => {
  await db?.close();
});

/** Every row's physical version: unchanged only if no statement touched the row. */
async function rowVersions(): Promise<Record<string, string>> {
  const tables = (await rows<{ relname: string }>(db, "select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'specialization' and c.relkind = 'r' order by 1")).map((row) => row.relname);
  const out: Record<string, string> = {};
  for (const table of tables) {
    const [row] = await rows<{ v: string | null }>(db, `select string_agg(xmin::text || '@' || ctid::text, ',' order by ctid) as v from specialization.${table}`);
    out[table] = row.v ?? "";
  }
  return out;
}

const withRegions = (regions: SeedInput["regions"]): SeedInput => ({ ...productionSeedInput(), regions });

describe("drift guard", () => {
  it("the committed seed is exactly what the emitter writes from the current content", () => {
    const committed = readMigration(SEED_MIGRATION_PATH);
    const emitted = emitSeedSql();
    if (committed !== emitted) {
      const a = committed.split("\n");
      const b = emitted.split("\n");
      const line = a.findIndex((text, index) => text !== b[index]);
      throw new Error(
        `supabase/migrations/20261016120100_specialization_atlas_seed_v1.sql is stale (first difference at line ${line + 1}). ` +
          "Run: npx tsx scripts/specialization/emit-seed.ts",
      );
    }
  });

  it("is deterministic and does not depend on the order regions are listed in", () => {
    expect(emitSeedSql()).toBe(emitSeedSql());
    const input = { rules: [exposureRuleV1], referenceRegionLabels };
    expect(emitSeedSql({ ...input, regions: [forearmRegionData, deltoidRegionData] })).toBe(emitSeedSql({ ...input, regions: [deltoidRegionData, forearmRegionData] }));
  });

  it("seeds the production registry and says what it holds", () => {
    expect(specializationRegions.map((data) => data.region.id)).toEqual(["forearm"]);
    const header = readMigration(SEED_MIGRATION_PATH).split("\n").slice(0, 8).join("\n");
    expect(header).toContain("Do not edit by hand");
    expect(header).toMatch(/24 nodes, 20 actions, 38 node actions, 60 claims, \d+ sources, 117 catalog exercises, 117 variants, 404 mappings/);
    expect(header).toContain("forearm_mappings_v1 (published): 399 reviewed, 5 draft");
  });
});

describe("SQL text", () => {
  it("quotes any text so the database reads it back unchanged, dollar signs included", async () => {
    for (const text of ["plain", "it's", "a$$b", "ends with $", "$", "$$", "$q$ and $q", "line\nbreak", "émigré · 90°"]) {
      const [row] = await rows<{ t: string }>(db, `select ${quote(text)} as t`);
      expect(row.t, JSON.stringify(text)).toBe(text);
    }
  });
});

describe("the seeded database", () => {
  it("applying the seed again touches no row", async () => {
    const before = await rowVersions();
    await applyMigration(db, SEED_MIGRATION_PATH);
    expect(await rowVersions()).toEqual(before);
  });

  it("holds every node, action, source and node action exactly as the content has them", async () => {
    const nodes = await rows(
      db,
      `select id, region_id as "regionId", parent_id as "parentId", kind, role, name, short_name as "shortName", aliases, layer, surface_visibility as "surfaceVisibility",
              status, catalog_muscle_key as "catalogMuscleKey", database_muscle as "databaseMuscle", border, location, what_it_does as "whatItDoes", shape_note as "shapeNote", caveats
       from specialization.nodes`,
    );
    expect([...nodes].sort(byId)).toEqual([...forearmRegionData.nodes].sort(byId));

    const actions = await rows(db, `select id, joint, label, plain_description as "plainDescription" from specialization.actions`);
    expect([...actions].sort(byId)).toEqual([...forearmRegionData.actions].sort(byId));

    const sources = await rows(db, `select source_key as id, url, title, doi, evidence_type as "evidenceType", retrieved_on::text as "retrievedOn", notes from specialization.sources`);
    expect([...sources].sort(byId)).toEqual([...forearmRegionData.sources].sort(byId));
    expect(sources.map((source) => (source as { id: string }).id)).not.toContain("S9");

    const nodeActions = await rows<{ nodeId: string; actionId: string; role: string; claimId: string }>(
      db,
      `select na.node_id as "nodeId", na.action_id as "actionId", na.role, split_part(c.claim_key, ':', 2) as "claimId"
       from specialization.node_actions na join specialization.claims c on c.id = na.claim_id`,
    );
    const key = (row: { nodeId: string; actionId: string }) => `${row.nodeId} ${row.actionId}`;
    expect([...nodeActions].sort((a, b) => (key(a) < key(b) ? -1 : 1))).toEqual([...forearmRegionData.nodeActions].sort((a, b) => (key(a) < key(b) ? -1 : 1)));
  });

  it("holds every claim with its sources in order", async () => {
    const claims = await rows(
      db,
      `select split_part(c.claim_key, ':', 2) as id, c.node_id as "nodeId", c.kind, c.statement, c.basis, c.review_status as "reviewStatus", c.reviewed_on::text as "reviewedAt", c.review_note as "reviewNote",
              coalesce((select json_agg(json_build_object('sourceId', s.source_key, 'locator', cs.locator, 'qualification', cs.qualification) order by cs.sort_order)
                        from specialization.claim_sources cs join specialization.sources s on s.id = cs.source_id where cs.claim_id = c.id), '[]') as sources
       from specialization.claims c where c.claim_key like 'forearm:%'`,
    );
    expect(claims).toHaveLength(60);
    expect([...claims].sort(byId)).toEqual([...forearmRegionData.claims].sort(byId));
  });

  it("holds every variant, and each catalog exercise once", async () => {
    const variants = await rows(
      db,
      `select v.variant_key as id, v.catalog_id as "catalogExerciseId", c.name as "catalogName", v.organization, v.forearm_orientation as "forearmOrientation", v.wrist_position as "wristPosition",
              v.grip_type as "gripType", v.straps, v.laterality, v.phase, v.measure, v.deliberate_hold as "deliberateHold", v.elbow_angle_deg::float8 as "elbowAngleDeg", v.notes
       from specialization.exercise_variants v join specialization.catalog_exercises c on c.catalog_id = v.catalog_id`,
    );
    expect(variants).toHaveLength(117);
    expect([...variants].sort(byId)).toEqual([...forearmRegionData.variants].sort(byId));
    expect(await count(db, "select 1 from specialization.catalog_exercises")).toBe(new Set(forearmRegionData.variants.map((variant) => variant.catalogExerciseId)).size);
  });

  it("holds the published mapping version with all 404 rows, its 5 drafts included, each with its sources in order", async () => {
    const [version] = await rows(
      db,
      `select version_key as key, state, to_char(published_at at time zone 'UTC', 'YYYY-MM-DD') as "publishedAt", method_notes as "methodNotes", region_id from specialization.mapping_versions where version_key = 'forearm_mappings_v1'`,
    );
    expect(version).toEqual({ ...forearmRegionData.mappingVersion, region_id: "forearm" });

    const mappings = await rows(
      db,
      `select m.mapping_key as id, v.version_key as "versionKey", m.variant_key as "variantId", m.node_id as "nodeId", m.action_id as "actionId", m.relationship,
              m.muscle_mode as "muscleMode", m.evidence_basis as "evidenceBasis", m.allocation, m.requires_no_straps as "requiresNoStraps", m.rationale, m.review_status as "reviewStatus",
              coalesce((select json_agg(json_build_object('sourceId', s.source_key, 'locator', ms.locator, 'limitation', ms.limitation) order by ms.sort_order)
                        from specialization.mapping_sources ms join specialization.sources s on s.id = ms.source_id where ms.mapping_id = m.id), '[]') as sources
       from specialization.variant_mappings m join specialization.mapping_versions v on v.id = m.version_id where v.version_key = 'forearm_mappings_v1'`,
    );
    expect(mappings).toHaveLength(404);
    expect([...mappings].sort(byId)).toEqual([...forearmRegionData.mappings].sort(byId));
    const drafts = forearmRegionData.mappings.filter((mapping) => mapping.reviewStatus === "draft").map((mapping) => mapping.id).sort();
    expect(drafts).toHaveLength(5);
    expect((await rows<{ k: string }>(db, "select mapping_key as k from specialization.variant_mappings where review_status = 'draft'")).map((row) => row.k).sort()).toEqual(drafts);
  });

  it("users read the 399 reviewed rows; the 5 drafts stay with the service role", async () => {
    expect(await as(db, { user: USER_A }, () => count(db, "select 1 from specialization.variant_mappings"))).toBe(399);
    expect(await as(db, { user: USER_A }, () => count(db, "select 1 from specialization.variant_mappings where review_status = 'draft'"))).toBe(0);
    expect(await as(db, "service_role", () => count(db, "select 1 from specialization.variant_mappings where review_status = 'draft'"))).toBe(5);
  });

  it("holds the published accounting rule as written", async () => {
    const [rule] = await rows(db, `select id, to_char(published_at at time zone 'UTC', 'YYYY-MM-DD') as "publishedAt", notes, specification from specialization.rule_versions where id = 'specialization_exposure_v1'`);
    expect(rule).toEqual(exposureRuleV1);
  });

  it("holds the region and the upper-arm reference region its external contributors live in", async () => {
    const regions = await rows(db, `select id, label, heading, sort_order as "sortOrder", status, body_map_keys as "bodyMapKeys", entry_label as "entryLabel", node_for_body_map_key as "nodeForBodyMapKey" from specialization.regions order by id`);
    expect(regions).toEqual([
      { ...forearmRegionData.region, nodeForBodyMapKey: forearmRegionData.region.nodeForBodyMapKey ?? {} },
      { id: "upper_arm", label: "Upper arm", heading: null, sortOrder: 0, status: "reference", bodyMapKeys: [], entryLabel: null, nodeForBodyMapKey: {} },
    ]);
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
  it("refuses changed mappings under the published key, and applies nothing of that seed", async () => {
    const edited = {
      ...forearmRegionData,
      nodes: forearmRegionData.nodes.map((node) => (node.id === "forearm.fcu" ? { ...node, name: "Renamed in the same seed" } : node)),
      mappings: forearmRegionData.mappings.map((mapping) => (mapping.id === "cat-139:forearm.fcu" ? { ...mapping, rationale: "Edited after publication." } : mapping)),
    };
    const message = await scriptFailure(db, emitSeedSql(withRegions([edited])));
    expect(message).toMatch(/cat-139:forearm\.fcu belongs to published version forearm_mappings_v1; it cannot change/);
    expect(await rows(db, "select name from specialization.nodes where id = 'forearm.fcu'")).toEqual([{ name: "Flexor carpi ulnaris" }]);
  });

  it("seeds changed mappings published under a new key beside the old version", async () => {
    const v2 = "forearm_mappings_v2";
    const next = {
      ...forearmRegionData,
      mappingVersion: { ...forearmRegionData.mappingVersion, key: v2 },
      mappings: forearmRegionData.mappings.map((mapping) => ({ ...mapping, versionKey: v2, reviewStatus: mapping.id === "cat-317:forearm.br" ? ("reviewed" as const) : mapping.reviewStatus })),
    };
    const sql = emitSeedSql(withRegions([next]));
    expect(await scriptFailure(db, sql)).toBeNull();
    expect(await scriptFailure(db, sql)).toBeNull();
    const states = await rows(db, "select v.version_key, v.state, count(*) filter (where m.review_status = 'draft')::int as drafts from specialization.mapping_versions v join specialization.variant_mappings m on m.version_id = v.id where v.version_key like 'forearm_mappings_%' group by 1, 2 order by 1");
    expect(states).toEqual([
      { version_key: "forearm_mappings_v1", state: "published", drafts: 5 },
      { version_key: v2, state: "published", drafts: 4 },
    ]);
  });

  it("seeds a second region with no schema change: the deltoid fixture, its draft version and its diagram", async () => {
    const both = withRegions([forearmRegionData, deltoidRegionData]);
    expect(await scriptFailure(db, emitSeedSql(both))).toBeNull();
    const [state] = await rows(db, "select state from specialization.mapping_versions where version_key = 'deltoid_fixture_mappings_v1'");
    expect(state).toEqual({ state: "draft" });
    expect(await count(db, "select 1 from specialization.regions where id = 'upper_arm'")).toBe(1);
    expect(await count(db, "select 1 from specialization.actions where id = 'elbow.extension'")).toBe(1);
    expect(await count(db, "select 1 from specialization.claims where claim_key like 'deltoid:%'")).toBe(3);

    const drawing = deltoidRegionData.diagram!;
    const paths = await rows(
      db,
      `select p.path_id as id, p.node_id as "nodeId", p.kind, p.d from specialization.diagram_paths p join specialization.diagram_assets a on a.id = p.asset_id
       where a.asset_key = $1 and a.version = $2 and p.view = 'back' and p.layer = 'surface' order by p.sort_order`,
      [drawing.key, drawing.version],
    );
    expect(paths).toEqual(drawing.views.back!.surface!.paths);
    // Scoped to the fixture asset: the production forearm drawing is seeded beside it.
    const labels = await rows(db, `select l.label_text as text, l.x::float8 as x, l.y::float8 as y, l.anchor from specialization.diagram_labels l join specialization.diagram_assets a on a.id = l.asset_id
       where a.asset_key = $1 and a.version = $2 order by l.sort_order`, [drawing.key, drawing.version]);
    expect(labels).toEqual(drawing.views.back!.surface!.labels);

    // A fixture region and its draft content stay out of users' sight.
    const seen = await as(db, { user: USER_A }, () => rows<{ n: number }>(db, "select (select count(*)::int from specialization.regions where id = 'deltoid') + (select count(*)::int from specialization.nodes where region_id = 'deltoid') + (select count(*)::int from specialization.mapping_versions where version_key like 'deltoid%') as n"));
    expect(seen).toEqual([{ n: 0 }]);

    // Re-applying is a no-op, and a redrawn asset holds exactly the new drawing.
    const before = await rowVersions();
    expect(await scriptFailure(db, emitSeedSql(both))).toBeNull();
    expect(await rowVersions()).toEqual(before);
    const redrawn = {
      ...deltoidRegionData,
      diagram: {
        ...drawing,
        views: { back: { surface: { paths: drawing.views.back!.surface!.paths.slice(0, 3), labels: [{ text: "Front side", x: 20, y: 76, anchor: "start" as const }] } } },
      },
    };
    expect(await scriptFailure(db, emitSeedSql(withRegions([forearmRegionData, redrawn])))).toBeNull();
    const fixtureAsset = `join specialization.diagram_assets a on a.id = x.asset_id where a.asset_key = '${drawing.key}'`;
    expect(await count(db, `select 1 from specialization.diagram_paths x ${fixtureAsset}`)).toBe(3);
    expect(await rows(db, `select x.label_text from specialization.diagram_labels x ${fixtureAsset}`)).toEqual([{ label_text: "Front side" }]);
  });
});

describe("the emitter refuses content it cannot seed faithfully", () => {
  it("a shared key that means two different things", () => {
    const clash = { ...deltoidRegionData, sources: [...deltoidRegionData.sources, { ...forearmRegionData.sources.find((source) => source.id === "S2")!, title: "Another paper" }] };
    expect(() => emitSeedSql(withRegions([forearmRegionData, clash]))).toThrow(/Source S2 differs between deltoid and forearm/);
  });

  it("a mapping, claim or node action that points at nothing", () => {
    const [first] = forearmRegionData.mappings;
    expect(() => emitSeedSql(withRegions([{ ...forearmRegionData, mappings: [{ ...first, nodeId: "forearm.nowhere" }] }]))).toThrow(/node forearm\.nowhere is not in region forearm/);
    expect(() => emitSeedSql(withRegions([{ ...forearmRegionData, nodeActions: [{ ...forearmRegionData.nodeActions[0], claimId: "fcu.function" }] }]))).toThrow(/is not a function claim of that node/);
  });

  it("a node in a region that is neither seeded nor labelled, and a parent cycle", () => {
    const stray = forearmRegionData.nodes.map((node) => (node.id === "upper_arm.biceps" ? { ...node, regionId: "torso" } : node));
    expect(() => emitSeedSql(withRegions([{ ...forearmRegionData, nodes: stray }]))).toThrow(/region torso/);
    const loop = forearmRegionData.nodes.map((node) => (node.id === "forearm.anterior" ? { ...node, parentId: "forearm.fcr" } : node));
    expect(() => emitSeedSql(withRegions([{ ...forearmRegionData, nodes: loop }]))).toThrow(/cycle/);
  });
});
