/**
 * Query plans for the owner-only tables (brief §11: "summary query plan on representative data"),
 * in PGlite (Postgres 17, as production) with the schema and seed migrations applied: 2,000
 * accounts with 8 goals and 150 measurements each, then EXPLAIN ANALYZE of what a later sync would
 * read, as user A under row-level security. Loading the rows takes several minutes in PGlite.
 * Results: docs/specialization-atlas/README.md, "Release gates".
 *
 *   npx tsx scripts/specialization/release-gates/owner-table-plans.ts   (from the repository root)
 */
import { createSeededDb, as, rows, USER_A } from "../../../server/fixtures/specializationPg";

const USERS = 2000;
const GOALS_PER_USER = 8;
const MEASUREMENTS_PER_USER = 150;

async function main() {
  const db = await createSeededDb();
  await db.exec(`
    insert into auth.users (id)
      select ('00000000-0000-4000-9000-' || lpad(to_hex(g), 12, '0'))::uuid from generate_series(1, ${USERS}) g;
  `);
  const nodes = (await rows<{ id: string }>(db, "select id from specialization.nodes where region_id = 'forearm' and role = 'target' order by id limit $1", [GOALS_PER_USER])).map((r) => r.id);
  const t0 = performance.now();
  await db.exec(`
    insert into specialization.goals (user_id, id, region_id, node_id, side, metric, target, period, starts_on, timezone)
      select u.id, 'goal-' || n.ord || ':left', 'forearm', n.node, 'left', 'direct_dynamic_bouts', 12, 'calendar_week', date '2026-09-01', 'Europe/London'
      from auth.users u cross join unnest(array[${nodes.map((n) => `'${n}'`).join(",")}]) with ordinality as n(node, ord);
    insert into specialization.goals (user_id, id, region_id, node_id, side, metric, target, period, starts_on, timezone)
      values ('${USER_A}', 'goal-a:right', 'forearm', '${nodes[0]}', 'right', 'direct_dynamic_bouts', 20, 'calendar_week', date '2026-10-01', 'Europe/London');
    insert into specialization.measurements (user_id, id, region_id, side, measured_at, metric, value, protocol)
      select u.id, 'm-' || g, 'forearm', case when g % 2 = 0 then 'left' else 'right' end,
        timestamptz '2025-10-01 08:00+00' + (g || ' days')::interval, 'circumference_cm', 30 + (g % 7) * 0.1,
        '{"landmark":"elbow crease","distanceFromLandmarkCm":5,"posture":"arm_relaxed_hanging","condition":"unpumped","device":null,"timeOfDay":"08:00"}'::jsonb
      from auth.users u cross join generate_series(1, ${MEASUREMENTS_PER_USER}) g;
    analyze specialization.goals;
    analyze specialization.measurements;
  `);
  const loaded = performance.now() - t0;
  const counts = await rows(db, "select (select count(*) from specialization.goals)::int as goals, (select count(*) from specialization.measurements)::int as measurements, (select count(*) from auth.users)::int as users");
  console.log("rows", JSON.stringify(counts[0]), `loaded in ${loaded.toFixed(0)} ms`);

  const queries: [string, string][] = [
    ["a user's goals (what a sync reads; RLS adds user_id = auth.uid())", "select * from specialization.goals"],
    ["a user's goals active on a date", "select * from specialization.goals where starts_on <= date '2026-10-17' and (ends_on is null or ends_on >= date '2026-10-17')"],
    ["a user's measurements in a window, in date order", "select * from specialization.measurements where region_id = 'forearm' and measured_at >= timestamptz '2026-01-01' and measured_at < timestamptz '2026-04-01' order by measured_at"],
    ["a user's measurements, all", "select * from specialization.measurements order by measured_at"],
  ];
  for (const [label, sql] of queries) {
    const plan = await as(db, { user: USER_A }, () => rows<{ "QUERY PLAN": string }>(db, `explain (analyze, costs off, timing on, summary on) ${sql}`));
    console.log(`\n-- ${label}\n${sql}`);
    for (const row of plan) console.log("   " + row["QUERY PLAN"]);
  }
  await db.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
