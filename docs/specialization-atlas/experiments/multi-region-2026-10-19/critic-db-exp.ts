/**
 * Database critic experiments (scratch only) over schema v1 + seed v1 + the assembled schema v2
 * prototype, all in PGlite.
 *
 *   cd /tmp/.../multi-region && npx tsx critic-db-exp.ts
 */
import { readFileSync } from "node:fs";
import { SCHEMA_MIGRATION_PATH, SEED_MIGRATION_PATH, USER_A, applyMigration, as, createSupabaseLikeDb, failure, rows, scriptFailure } from "./harness";

const here = "/tmp/claude-0/-home-user-Sports-genome/1ff0a7bc-72e5-5e41-a8d9-937a97929500/scratchpad/multi-region";
const log = (label: string, value: unknown) => console.log(`${label}: ${typeof value === "string" ? value : JSON.stringify(value)}`);

const db = await createSupabaseLikeDb();
await applyMigration(db, SCHEMA_MIGRATION_PATH);
await applyMigration(db, SEED_MIGRATION_PATH);
const proto = readFileSync(`${here}/schema_v2_prototype.assembled.sql`, "utf8");
log("prototype v2 applied", (await scriptFailure(db, proto)) ?? "ok");

// ---------------------------------------------------------------- 1. rule 12 as §5.1 words it
// "12 every mapped node's home is the version's region", added to the one problems function.
const v2Problems = proto.slice(proto.indexOf("create or replace function specialization.mapping_version_problems("));
const problemsFn = v2Problems.slice(0, v2Problems.indexOf("$fn$;", v2Problems.indexOf("as $fn$")) + 5);
const rule12 = (guard: string) => problemsFn.replace(
  "\n  )\n  select string_agg(problem, '; ' order by ord) from listed",
  `
    union all
    select 12, 'mapped muscles whose home is another region: ' || string_agg(distinct m.node_id, ', ' order by m.node_id)
    from m
    join specialization.nodes n on n.id = m.node_id
    join specialization.mapping_versions v on v.id = p_version_id
    where n.region_id <> v.region_id ${guard}
    having count(*) > 0
  )
  select string_agg(problem, '; ' order by ord) from listed`,
);
log("1. rule 12 spliced", (await scriptFailure(db, rule12(""))) ?? "ok");
log("1. §5.3 verification: mapping_version_problems(forearm_mappings_v1)", await rows(db, "select specialization.mapping_version_problems(id) as problems from specialization.mapping_versions where version_key = 'forearm_mappings_v1'"));
// Publish-time only: the BEFORE UPDATE trigger runs the rule while the stored row is still a draft.
log("1b. rule 12 limited to drafts", (await scriptFailure(db, rule12("and v.state = 'draft'"))) ?? "ok");
log("1b. forearm_mappings_v1 now", await rows(db, "select specialization.mapping_version_problems(id) as problems from specialization.mapping_versions where version_key = 'forearm_mappings_v1'"));
// and it still blocks a publish: a draft version of a region that maps a node homed elsewhere.
await db.exec(`
  insert into specialization.mapping_versions (version_key, region_id, method_notes) values ('forearm_mappings_v2_probe', 'forearm', 'probe');
  insert into specialization.variant_mappings (version_id, mapping_key, variant_key, node_id, action_id, relationship, muscle_mode, evidence_basis, rationale, review_status)
  select v.id, m.mapping_key, m.variant_key, m.node_id, m.action_id, m.relationship, m.muscle_mode, m.evidence_basis, m.rationale, m.review_status
  from specialization.variant_mappings m join specialization.mapping_versions o on o.id = m.version_id and o.version_key = 'forearm_mappings_v1',
       specialization.mapping_versions v where v.version_key = 'forearm_mappings_v2_probe' and m.node_id = 'upper_arm.biceps' limit 1;
  insert into specialization.mapping_sources (mapping_id, source_id, locator, limitation, sort_order)
  select m.id, s.id, 'p. 1', null, 0 from specialization.variant_mappings m join specialization.mapping_versions v on v.id = m.version_id and v.version_key = 'forearm_mappings_v2_probe', specialization.sources s where s.source_key = 'S2';
`);
log("1b. publishing a new forearm version that maps the biceps", (await failure(db, "update specialization.mapping_versions set state = 'published' where version_key = 'forearm_mappings_v2_probe'")) ?? "published");
await db.exec("delete from specialization.mapping_versions where version_key = 'forearm_mappings_v2_probe'");

// ---------------------------------------------------------------- 2. attribute freeze scope
await db.exec(`
  insert into specialization.variant_dimensions (id, label, sort_order) values ('leg_laterality', 'Legs', 1), ('stance', 'Stance', 2);
  insert into specialization.variant_dimension_values (dimension_id, value, label, sort_order) values
    ('leg_laterality', 'bilateral', 'Both legs', 0), ('leg_laterality', 'unilateral', 'One leg', 1), ('leg_laterality', 'either', 'Either', 2),
    ('stance', 'bilateral', 'Bilateral', 0), ('stance', 'staggered', 'Staggered', 1);
`);
log("2. versions mapping cat-205 (B-Stance RDL)", await rows(db, "select distinct v.version_key, v.region_id, v.state from specialization.variant_mappings m join specialization.mapping_versions v on v.id = m.version_id where m.variant_key = 'cat-205'"));
log("2. wave-1 attribute on a frozen forearm row (seed v3, wave A)", (await failure(db, "insert into specialization.variant_attributes (variant_key, dimension_id, value) values ('cat-205', 'leg_laterality', 'bilateral'), ('cat-205', 'stance', 'bilateral')")) ?? "inserted");
log("2. wave-C correction of the leg laterality (no leg version exists yet)", (await failure(db, "update specialization.variant_attributes set value = 'unilateral' where variant_key = 'cat-205' and dimension_id = 'leg_laterality'")) ?? "updated");
log("2. wave-C correction of a descriptive dim", (await failure(db, "update specialization.variant_attributes set value = 'staggered' where variant_key = 'cat-205' and dimension_id = 'stance'")) ?? "updated");
log("2. frozen forearm variants a leg/trunk region will also map (hinges, carries, raises)", await rows(db, `
  select count(*)::int as n, string_agg(variant_key, ', ' order by catalog_id) as keys from specialization.exercise_variants
  where catalog_id in (41, 42, 186, 187, 188, 189, 202, 203, 204, 205, 263, 264, 145, 299, 300, 409, 231, 232, 234)`));

// ---------------------------------------------------------------- 3. goals -> region_nodes, and a seed that drops a membership
await db.exec("insert into specialization.region_nodes (region_id, node_id, role, sort_order) values ('forearm', 'forearm.anconeus', 'adjacent', 99) on conflict do nothing");
log("3. a user's goal on an unmapped member", (await as(db, { user: USER_A }, () => failure(db, "insert into specialization.goals (id, region_id, node_id, side, metric, target, period, starts_on, timezone) values ('g-anc', 'forearm', 'forearm.anconeus', 'left', 'direct_dynamic_bouts', 4, 'calendar_week', '2026-10-19', 'UTC')"))) ?? "inserted");
log("3. the seed's stale-membership delete for that unmapped, unfrozen member", (await scriptFailure(db, "delete from specialization.region_nodes rn where rn.region_id = 'forearm' and rn.node_id not in (select node_id from specialization.region_nodes where node_id <> 'forearm.anconeus');")) ?? "deleted");

// ---------------------------------------------------------------- 4. the cross-wave external (shoulders lists back.* at wave A)
await db.exec(`insert into specialization.regions (id, label, status) values ('shoulders', 'Shoulders', 'reference') on conflict do nothing`);
log("4. shoulders' external back.latissimus_dorsi without a back region/node", (await failure(db, "insert into specialization.region_nodes (region_id, node_id, role) values ('shoulders', 'back.latissimus_dorsi', 'external')")) ?? "inserted");

process.exit(0);
