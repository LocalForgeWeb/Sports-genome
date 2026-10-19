import { readFileSync } from "node:fs";
import { SCHEMA_MIGRATION_PATH, SEED_MIGRATION_PATH, applyMigration, createSupabaseLikeDb, rows, readMigration } from "../harness";
const here = "/tmp/claude-0/-home-user-Sports-genome/1ff0a7bc-72e5-5e41-a8d9-937a97929500/scratchpad/multi-region";
function functionBlock(text: string, name: string): string {
  const start = text.indexOf(`create or replace function specialization.${name}(`);
  const end = text.indexOf("$fn$;", text.indexOf("as $fn$", start)) + "$fn$;".length;
  return text.slice(start, end);
}
async function main() {
  const db = await createSupabaseLikeDb();
  await applyMigration(db, SCHEMA_MIGRATION_PATH);
  await applyMigration(db, SEED_MIGRATION_PATH);
  const v2 = readFileSync(`${here}/schema_v2_prototype.assembled.sql`, "utf8");
  await db.exec(v2);
  const q = "select specialization.mapping_version_problems(id) as problems from specialization.mapping_versions where version_key = 'forearm_mappings_v1'";
  console.log("prototype (rules 1-10):", JSON.stringify(await rows(db, q)));
  // Rule 12 exactly as the draft words it: every mapped node's home is the version's region.
  const withRule12 = functionBlock(v2, "mapping_version_problems").replace(
    "\n  )\n  select string_agg(problem, '; ' order by ord) from listed",
    `
    union all
    select 12, 'mapped muscles whose home is another region: ' || string_agg(distinct m.node_id, ', ' order by m.node_id)
    from m
    join specialization.nodes n on n.id = m.node_id
    join specialization.mapping_versions v on v.id = p_version_id
    where n.region_id <> v.region_id
    having count(*) > 0
  )
  select string_agg(problem, '; ' order by ord) from listed`);
  await db.exec(withRule12);
  console.log("with rule 12:", JSON.stringify(await rows(db, q)));
}
main().catch((e) => { console.error(e); process.exit(1); });
