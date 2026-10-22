/**
 * Experiment 2 (scratch only): a prototype additive schema v2 over the applied v1 (schema +
 * seed), then a hand-written slice of what a seed v2 emitter would add for an upper-arm region
 * whose targets are the frozen upper_arm.biceps and upper_arm.brachialis rows.
 *
 *   cd /home/user/Sports-genome && npx tsx <scratch>/exp2-schema-v2.ts
 */
import { readFileSync } from "node:fs";
import { emitSeedSql } from "/home/user/Sports-genome/scripts/specialization/emit-seed";
import { SCHEMA_MIGRATION_PATH, SEED_MIGRATION_PATH, USER_A, applyMigration, as, asDoBlock, count, createSupabaseLikeDb, failure, readMigration, rows, scriptFailure } from "./harness";

type Db = Awaited<ReturnType<typeof createSupabaseLikeDb>>;
const here = "/tmp/claude-0/-home-user-Sports-genome/1ff0a7bc-72e5-5e41-a8d9-937a97929500/scratchpad/multi-region";
const log = (label: string, value: unknown) => console.log(`${label}: ${typeof value === "string" ? value : JSON.stringify(value)}`);

function functionBlock(text: string, name: string): string {
  const start = text.indexOf(`create or replace function specialization.${name}(`);
  const end = text.indexOf("$fn$;", text.indexOf("as $fn$", start)) + "$fn$;".length;
  if (start < 0 || end < start) throw new Error(`no ${name}`);
  return text.slice(start, end);
}

/** The prototype v2 text: the scratch file plus the two v1 functions restated with the v2 additions. */
function schemaV2(): string {
  const v1 = readMigration(SCHEMA_MIGRATION_PATH);
  const problems = functionBlock(v1, "mapping_version_problems").replace(
    "\n  )\n  select string_agg(problem, '; ' order by ord) from listed",
    `
    union all
    select 10, 'mapped muscles the version''s region does not list: ' || string_agg(distinct m.node_id, ', ' order by m.node_id)
    from m
    where not exists (
      select 1 from specialization.region_nodes rn
      join specialization.mapping_versions v on v.region_id = rn.region_id
      where v.id = p_version_id and rn.node_id = m.node_id
    )
    having count(*) > 0
  )
  select string_agg(problem, '; ' order by ord) from listed`,
  );
  const guard = functionBlock(v1, "guard_mapping_version").replace(
    "      v_problems := specialization.mapping_version_problems(new.id);",
    `      perform 1 from specialization.region_nodes rn
      where rn.region_id = new.region_id
        and rn.node_id in (select m.node_id from specialization.variant_mappings m where m.version_id = new.id)
      for share;
      perform 1 from specialization.variant_attributes va
      where va.variant_key in (select m.variant_key from specialization.variant_mappings m where m.version_id = new.id)
      for share;
      v_problems := specialization.mapping_version_problems(new.id);`,
  );
  if (!problems.includes("select 10,") || !guard.includes("region_nodes rn")) throw new Error("splice failed");
  return `${readFileSync(`${here}/schema_v2_prototype.sql`, "utf8")}\n${problems}\n\n${guard}\n`;
}

/** What a v2 emitter would add for the upper arm (hand-written; the real one is generated). */
const SEED_V2_SLICE = `
update specialization.regions set status = 'production', heading = 'Upper-arm specialization', entry_label = 'Explore upper-arm coverage',
  external_group = 'Forearm muscles credited here', incidental_work = 'bracing', progress_subtitle = 'Circumference, by arm',
  measurement_metrics = array['circumference_cm'], body_map_keys = array['biceps', 'brachialis', 'triceps'], sort_order = 20
  where id = 'upper_arm' and status is distinct from 'production';
insert into specialization.nodes as t (id, region_id, parent_id, kind, role, name, short_name, layer, surface_visibility, status, catalog_muscle_key, database_muscle, location, what_it_does, shape_note, sort_order)
  values ('upper_arm.triceps', 'upper_arm', null, 'muscle', 'target', 'Triceps brachii', 'Triceps', 'surface', 'clear', 'reviewed', 'triceps', null, 'Back of the upper arm.', 'Straightens the elbow.', 'Three heads.', 2)
  on conflict (id) do update set name = excluded.name where (t.name) is distinct from (excluded.name);
insert into specialization.actions as t (id, joint, label, plain_description, sort_order) values ('shoulder.flexion', 'Shoulder', 'Shoulder flexion', 'Raises the arm forward.', 20)
  on conflict (id) do update set label = excluded.label where (t.label) is distinct from (excluded.label);
-- Memberships the content owns: the forearm's 24 (the 21 mapped ones were backfilled by schema v2) and the upper arm's own.
insert into specialization.region_nodes as t (region_id, node_id, role, sort_order)
select 'forearm', n.id, case when n.region_id = 'forearm' then n.role else 'external' end, n.sort_order from specialization.nodes n where n.id like 'forearm.%' or n.id in ('upper_arm.biceps', 'upper_arm.brachialis')
union all select 'upper_arm', 'upper_arm.biceps', 'target', 0
union all select 'upper_arm', 'upper_arm.brachialis', 'target', 1
union all select 'upper_arm', 'upper_arm.triceps', 'target', 2
union all select 'upper_arm', 'forearm.br', 'external', 3
on conflict (region_id, node_id) do update set role = excluded.role, sort_order = excluded.sort_order
  where (t.role, t.sort_order) is distinct from (excluded.role, excluded.sort_order);
-- New claims are written as drafts, given their sources, then reviewed (a claim born reviewed on a mapped muscle cannot take a source).
insert into specialization.claims as t (claim_key, node_id, kind, statement, basis, review_status, reviewed_on, review_note) values
  ('upper_arm:triceps.function', 'upper_arm.triceps', 'function', 'Extends the elbow.', 'established_anatomy', 'draft', null, null),
  ('upper_arm:biceps.shoulder_function', 'upper_arm.biceps', 'function', 'The long head assists shoulder flexion.', 'established_anatomy', 'draft', null, null)
  on conflict (claim_key) do update set statement = excluded.statement where (t.statement) is distinct from (excluded.statement);
insert into specialization.claim_sources as t (claim_id, source_id, locator, qualification, sort_order)
select c.id, s.id, 'Experiment', null, 0 from specialization.claims c, specialization.sources s
 where c.claim_key in ('upper_arm:triceps.function', 'upper_arm:biceps.shoulder_function') and s.source_key = 'A8'
on conflict (claim_id, source_id) do update set locator = excluded.locator where (t.locator) is distinct from (excluded.locator);
update specialization.claims as t set review_status = 'reviewed', reviewed_on = '2026-10-19'
  where t.claim_key in ('upper_arm:triceps.function', 'upper_arm:biceps.shoulder_function') and (t.review_status, t.reviewed_on) is distinct from ('reviewed', '2026-10-19'::date);
insert into specialization.node_actions as t (node_id, action_id, role, claim_id)
select x.node_id, x.action_id, x.role, c.id from (values ('upper_arm.triceps', 'elbow.extension', 'prime', 'upper_arm:triceps.function'), ('upper_arm.biceps', 'shoulder.flexion', 'assist', 'upper_arm:biceps.shoulder_function')) as x (node_id, action_id, role, claim_key)
left join specialization.claims c on c.claim_key = x.claim_key
on conflict (node_id, action_id) do update set role = excluded.role, claim_id = excluded.claim_id where (t.role, t.claim_id) is distinct from (excluded.role, excluded.claim_id);
-- Execution dimensions: a new attribute on the frozen cat-121, and a new variant with a region-neutral "not applicable".
insert into specialization.variant_dimensions as t (id, label, sort_order) values ('shoulder_position', 'Shoulder position', 0)
  on conflict (id) do update set label = excluded.label where (t.label) is distinct from (excluded.label);
insert into specialization.variant_dimension_values as t (dimension_id, value, label, sort_order) values ('shoulder_position', 'neutral', 'Arm at the side', 0), ('shoulder_position', 'flexed', 'Arm in front', 1), ('shoulder_position', 'extended', 'Arm behind', 2)
  on conflict (dimension_id, value) do update set label = excluded.label where (t.label) is distinct from (excluded.label);
insert into specialization.variant_attributes as t (variant_key, dimension_id, value) values ('cat-121', 'shoulder_position', 'neutral'), ('cat-125', 'shoulder_position', 'extended')
  on conflict (variant_key, dimension_id) do update set value = excluded.value where (t.value) is distinct from (excluded.value);
insert into specialization.catalog_exercises as t (catalog_id, name) values (9100, 'Experiment Triceps Pushdown') on conflict (catalog_id) do nothing;
insert into specialization.exercise_variants as t (variant_key, catalog_id, organization, forearm_orientation, wrist_position, grip_type, straps, laterality, phase, measure, deliberate_hold)
  values ('cat-9100', 9100, 'single_joint', 'pronated', 'not_applicable', 'overhand', 'not_applicable', 'bilateral', 'concentric_eccentric', 'reps', false)
  on conflict (variant_key) do update set notes = excluded.notes where (t.notes) is distinct from (excluded.notes);
-- The upper arm's own version: the curl credits the biceps as a TARGET, through the forearm's node action and claim.
insert into specialization.mapping_versions as t (version_key, region_id, state, published_at, method_notes) values ('upper_arm_mappings_v1', 'upper_arm', 'draft', null, 'Experiment.')
  on conflict (version_key) do update set method_notes = excluded.method_notes where (t.method_notes) is distinct from (excluded.method_notes);
insert into specialization.variant_mappings as t (version_id, mapping_key, variant_key, node_id, action_id, relationship, muscle_mode, evidence_basis, rationale, review_status)
select v.id, x.k, x.variant, x.node, x.action, 'direct', 'dynamic', 'anatomy', 'Experiment.', 'reviewed'
from (values ('cat-121:upper_arm.biceps', 'cat-121', 'upper_arm.biceps', 'elbow.flexion'), ('cat-121:forearm.br', 'cat-121', 'forearm.br', 'elbow.flexion'), ('cat-9100:upper_arm.triceps', 'cat-9100', 'upper_arm.triceps', 'elbow.extension')) as x (k, variant, node, action)
left join specialization.mapping_versions v on v.version_key = 'upper_arm_mappings_v1'
on conflict (version_id, mapping_key) do update set rationale = excluded.rationale where (t.rationale) is distinct from (excluded.rationale);
insert into specialization.mapping_sources as t (mapping_id, source_id, locator, sort_order)
select m.id, s.id, 'Experiment', 0 from specialization.variant_mappings m join specialization.mapping_versions v on v.id = m.version_id, specialization.sources s
 where v.version_key = 'upper_arm_mappings_v1' and s.source_key = 'A8'
on conflict (mapping_id, source_id) do update set locator = excluded.locator where (t.locator) is distinct from (excluded.locator);
update specialization.mapping_versions set state = 'published', published_at = '2026-10-19 00:00:00+00' where version_key = 'upper_arm_mappings_v1' and state = 'draft';
`;

async function rowVersions(db: Db, only?: string[]): Promise<Record<string, string>> {
  const tables = (await rows<{ relname: string }>(db, "select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'specialization' and c.relkind = 'r' order by 1")).map((r) => r.relname).filter((t) => !only || only.includes(t));
  const out: Record<string, string> = {};
  for (const t of tables) out[t] = (await rows<{ v: string | null }>(db, `select string_agg(xmin::text || '@' || ctid::text, ',' order by ctid) as v from specialization.${t}`))[0].v ?? "";
  return out;
}
/** Every row version in `a` is still there in `b` (rows may have been added). */
const diff = (a: Record<string, string>, b: Record<string, string>) => {
  const changed = Object.keys(a).filter((k) => {
    const after = new Set((b[k] ?? "").split(",").filter(Boolean));
    return (a[k] ?? "").split(",").filter(Boolean).some((v) => !after.has(v));
  });
  const added = Object.keys(b).filter((k) => (b[k] ?? "").split(",").filter(Boolean).length > (a[k] ?? "").split(",").filter(Boolean).length);
  return `${changed.length ? `EXISTING ROWS CHANGED in ${changed.join(", ")}` : "no existing row touched"}${added.length ? `; rows added to ${added.join(", ")}` : ""}`;
};

import { writeFileSync } from "node:fs";
const require_write = (text: string) => writeFileSync(`${here}/schema_v2_prototype.assembled.sql`, text);
async function main() {
  const v2 = schemaV2();
  require_write(v2);
  const db = await createSupabaseLikeDb();
  let t0 = Date.now();
  await applyMigration(db, SCHEMA_MIGRATION_PATH);
  log("timing: schema v1 ms", Date.now() - t0);
  t0 = Date.now();
  await applyMigration(db, SEED_MIGRATION_PATH);
  log("timing: seed v1 ms", Date.now() - t0);
  const v1Tables = (await rows<{ relname: string }>(db, "select relname from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'specialization' and relkind = 'r'")).map((r) => r.relname);
  const base = await rowVersions(db, v1Tables);

  // Locks schema v2 takes outside the schema.
  await db.exec("begin");
  t0 = Date.now();
  await db.exec(v2);
  log("timing: schema v2 ms", Date.now() - t0);
  log(
    "1. locks schema v2 holds outside specialization",
    await rows(db, `select n.nspname || '.' || c.relname as relation, l.mode from pg_locks l join pg_class c on c.oid = l.relation join pg_namespace n on n.oid = c.relnamespace
      where l.locktype = 'relation' and l.pid = pg_backend_pid() and c.relkind in ('r','p') and n.nspname not in ('specialization','pg_catalog','information_schema') order by 1, 2`),
  );
  log(
    "1. locks schema v2 holds on v1 tables",
    await rows(db, `select c.relname as relation, string_agg(l.mode, ', ' order by l.mode) as modes from pg_locks l join pg_class c on c.oid = l.relation join pg_namespace n on n.oid = c.relnamespace
      where l.locktype = 'relation' and l.pid = pg_backend_pid() and c.relkind = 'r' and n.nspname = 'specialization' and c.relname = any($1) group by 1 order by 1`, [v1Tables]),
  );
  await db.exec("commit");
  await db.exec(v2);
  log("2. schema v2 applied twice over schema v1 + seed v1", diff(base, await rowVersions(db, v1Tables)));
  log("2. backfilled memberships", await rows(db, "select region_id, role, count(*)::int as n from specialization.region_nodes group by 1, 2 order by 1, 2"));
  log("2. biceps memberships", await rows(db, "select region_id, role from specialization.region_nodes where node_id like 'upper_arm.%' order by 1, 2"));
  log("2. forearm_mappings_v1 still passes the (extended) rule", await rows(db, "select specialization.mapping_version_problems(id) as problems from specialization.mapping_versions where version_key = 'forearm_mappings_v1'"));
  log(
    "2. function grants after the replace",
    await rows(db, `select has_function_privilege('service_role', 'specialization.mapping_version_problems(uuid)', 'EXECUTE') as service, has_function_privilege('authenticated', 'specialization.mapping_version_problems(uuid)', 'EXECUTE') as auth,
      (select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a left join pg_roles r on r.oid = a.grantee
        where n.nspname = 'specialization' and a.privilege_type = 'EXECUTE' and (a.grantee = 0 or r.rolname in ('anon', 'authenticated'))) as client_executable`),
  );

  await applyMigration(db, SEED_MIGRATION_PATH);
  log("3. seed v1 re-applied after schema v2", diff(base, await rowVersions(db, v1Tables)));
  log("3. full re-emit of current content after schema v2", `${(await scriptFailure(db, emitSeedSql())) ?? "ok"}; ${diff(base, await rowVersions(db, v1Tables))}`);

  // A claim born reviewed on a mapped muscle cannot take its sources (v1 claim_sources guard).
  const bornReviewed = `insert into specialization.claims (claim_key, node_id, kind, statement, basis, review_status, reviewed_on) values ('upper_arm:biceps.born_reviewed', 'upper_arm.biceps', 'appearance', 'x', 'established_anatomy', 'reviewed', '2026-10-19');
    insert into specialization.claim_sources (claim_id, source_id, locator) select c.id, s.id, 'x' from specialization.claims c, specialization.sources s where c.claim_key = 'upper_arm:biceps.born_reviewed' and s.source_key = 'A8';`;
  log("4. a new claim written reviewed, then its source, on a mapped muscle", (await scriptFailure(db, bornReviewed)) ?? "applied");

  const beforeSlice = await rowVersions(db, v1Tables);
  t0 = Date.now();
  log("5. seed v2 slice (upper arm) applied", (await scriptFailure(db, SEED_V2_SLICE)) ?? "applied");
  log("timing: slice ms", Date.now() - t0);
  log("5. v1 rows touched by the slice", diff(beforeSlice, await rowVersions(db, v1Tables)));
  const all = await rowVersions(db);
  log("5. slice applied again", (await scriptFailure(db, SEED_V2_SLICE)) ?? "ok");
  log("5. second application", diff(all, await rowVersions(db)));
  log("5. versions", await rows(db, "select version_key, region_id, state from specialization.mapping_versions order by 1"));
  log("5. full re-emit of the forearm after the slice", `${(await scriptFailure(db, emitSeedSql())) ?? "ok"}; ${diff(all, await rowVersions(db))}`);

  console.log("\n-- 6. freezes --");
  const tries: [string, string][] = [
    ["biceps role in upper_arm -> external", "update specialization.region_nodes set role = 'external' where region_id = 'upper_arm' and node_id = 'upper_arm.biceps'"],
    ["biceps role in forearm -> target", "update specialization.region_nodes set role = 'target' where region_id = 'forearm' and node_id = 'upper_arm.biceps'"],
    ["remove biceps from forearm", "delete from specialization.region_nodes where region_id = 'forearm' and node_id = 'upper_arm.biceps'"],
    ["reorder biceps in forearm (sort_order only)", "update specialization.region_nodes set sort_order = sort_order + 100 where region_id = 'forearm' and node_id = 'upper_arm.biceps'"],
    ["anconeus role in forearm (unmapped) -> target", "update specialization.region_nodes set role = 'target' where region_id = 'forearm' and node_id = 'forearm.anconeus'"],
    ["cat-121 shoulder_position -> flexed", "update specialization.variant_attributes set value = 'flexed' where variant_key = 'cat-121'"],
    ["delete cat-121 shoulder_position", "delete from specialization.variant_attributes where variant_key = 'cat-121'"],
    ["new attribute on frozen cat-122", "insert into specialization.variant_attributes (variant_key, dimension_id, value) values ('cat-122', 'shoulder_position', 'neutral')"],
    ["a value outside the dimension's list", "insert into specialization.variant_attributes (variant_key, dimension_id, value) values ('cat-123', 'shoulder_position', 'overhead')"],
    ["frozen v1 node role still frozen", "update specialization.nodes set role = 'target' where id = 'upper_arm.biceps'"],
    ["triceps (mapped by upper_arm v1) catalog key", "update specialization.nodes set catalog_muscle_key = 'arms' where id = 'upper_arm.triceps'"],
    ["upper_arm back to reference (regions has no guard)", "update specialization.regions set status = 'reference', heading = null, entry_label = null, external_group = null, incidental_work = null, progress_subtitle = null where id = 'upper_arm'"],
  ];
  for (const [label, sql] of tries) {
    await db.exec("begin");
    log(`6. ${label}`, (await failure(db, sql)) ?? "allowed");
    await db.exec("rollback");
  }
  for (const table of ["region_nodes", "variant_attributes"]) log(`6. truncate ${table} as owner`, (await failure(db, `truncate specialization.${table} cascade`)) ?? "allowed");

  // Rule 10.
  await db.exec("begin");
  await db.exec(`insert into specialization.mapping_versions (version_key, region_id, method_notes) values ('upper_arm_rule10', 'upper_arm', 'x');
    insert into specialization.variant_mappings (version_id, mapping_key, variant_key, node_id, action_id, relationship, muscle_mode, evidence_basis, rationale, review_status)
      select id, 'k', 'cat-139', 'forearm.fcu', 'wrist.flexion', 'direct', 'dynamic', 'anatomy', 'x', 'reviewed' from specialization.mapping_versions where version_key = 'upper_arm_rule10';
    insert into specialization.mapping_sources (mapping_id, source_id, locator) select m.id, s.id, 'x' from specialization.variant_mappings m, specialization.sources s where m.mapping_key = 'k' and s.source_key = 'S4';`);
  log("7. publish a version mapping a muscle its region does not list", (await failure(db, "update specialization.mapping_versions set state = 'published' where version_key = 'upper_arm_rule10'")) ?? "published");
  await db.exec("rollback");

  console.log("\n-- 8. RLS and grants --");
  log(
    "8. user A reads",
    await as(db, { user: USER_A }, async () => ({
      memberships: await count(db, "select 1 from specialization.region_nodes"),
      attributes: await count(db, "select 1 from specialization.variant_attributes"),
      write: await failure(db, "insert into specialization.region_nodes (region_id, node_id, role) values ('forearm', 'forearm.fcu', 'target')"),
    })),
  );
  log("8. anon", await as(db, "anon", () => failure(db, "select 1 from specialization.region_nodes")));
  log(
    "8. table grants on new tables",
    await rows(db, `select c.relname, coalesce(r.rolname, 'PUBLIC') as grantee, string_agg(a.privilege_type, ',' order by a.privilege_type) as privs from pg_class c join pg_namespace n on n.oid = c.relnamespace cross join lateral aclexplode(c.relacl) a left join pg_roles r on r.oid = a.grantee
      where n.nspname = 'specialization' and c.relname in ('region_nodes','variant_dimensions','variant_dimension_values','variant_attributes') and coalesce(r.rolname, 'PUBLIC') <> 'postgres' group by 1, 2 order by 1, 2`),
  );
  log("8. a goal on a muscle its region does not list", await as(db, { user: USER_A }, () => failure(db, "insert into specialization.goals (id, region_id, node_id, side, metric, target, period, starts_on, timezone) values ('g', 'upper_arm', 'forearm.fcu', 'left', 'direct_dynamic_bouts', 5, 'calendar_week', '2026-10-19', 'UTC')")));
  log("8. a goal on the biceps as an upper-arm target", await as(db, { user: USER_A }, () => failure(db, "insert into specialization.goals (id, region_id, node_id, side, metric, target, period, starts_on, timezone) values ('g2', 'upper_arm', 'upper_arm.biceps', 'left', 'direct_dynamic_bouts', 5, 'calendar_week', '2026-10-19', 'UTC')")));
  await db.close();

  // 9. The DO-block route gives the same catalog as the direct one (structure only, a smaller snapshot than the repo test's).
  const catalog = async (d: Db) => ({
    constraints: await rows(d, "select t.relname, c.conname, pg_get_constraintdef(c.oid) as def from pg_constraint c join pg_class t on t.oid = c.conrelid join pg_namespace n on n.oid = t.relnamespace where n.nspname = 'specialization' order by 1, 2"),
    triggers: await rows(d, "select c.relname, t.tgname, pg_get_triggerdef(t.oid) as def from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'specialization' and not t.tgisinternal order by 1, 2"),
    functions: await rows(d, "select p.oid::regprocedure::text as fn, pg_get_functiondef(p.oid) as def, p.proacl::text as acl from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'specialization' order by 1"),
    policies: await rows(d, "select tablename, policyname, roles::text, cmd, qual from pg_policies where schemaname = 'specialization' order by 1, 2"),
    acls: await rows(d, "select relname, relacl::text from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'specialization' order by 1"),
    memberships: await rows(d, "select * from specialization.region_nodes order by 1, 2"),
  });
  const direct = await createSupabaseLikeDb();
  const wrapped = await createSupabaseLikeDb();
  for (const d of [direct, wrapped]) {
    await applyMigration(d, SCHEMA_MIGRATION_PATH);
    await applyMigration(d, SEED_MIGRATION_PATH);
  }
  await direct.exec(v2);
  await direct.exec(v2);
  await wrapped.exec(asDoBlock(v2));
  await wrapped.exec(asDoBlock(v2));
  log("9. schema v2 as one DO block gives the same catalog and memberships", String(JSON.stringify(await catalog(direct)) === JSON.stringify(await catalog(wrapped))));
  await direct.close();
  await wrapped.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
