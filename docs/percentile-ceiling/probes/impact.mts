// Dry-run impact of the v3 benchmark score against v2, on the database's recorded inputs
// (server/fixtures/liveMuscleAggregation.ts: eight lift sets, low to high). Nothing is stored,
// so there is nothing to backfill: this only reports how each drawn muscle's number and band
// move. Run: npx tsx docs/percentile-ceiling/probes/impact.mts <out.json>
import { writeFileSync } from "node:fs";
import { aggregateMuscleBenchmarkScores, aggregateMuscleStrength } from "../../../server/muscleAggregation";
import { liveMuscleAggregation as live } from "../../../server/fixtures/liveMuscleAggregation";
import { isStabilizerOnly, muscleCanonicalNameToRegionId, rankForPercentile } from "../../../shared/capabilityRank";

const tables = { mappings: live.mappings, muscles: live.muscles, exercises: live.exercises };
const rows: Record<string, unknown>[] = [];
for (const [set, inputs] of Object.entries(live.inputs)) {
  const v2 = aggregateMuscleStrength(inputs, tables);
  const v3 = aggregateMuscleBenchmarkScores(inputs.map((input) => ({ ...input, bound: "exact" as const })), tables);
  for (const muscle of v3.muscles) {
    const region = muscleCanonicalNameToRegionId[muscle.muscle_canonical_name];
    const drawn = region && !isStabilizerOnly({ evidence: muscle.evidence.map((e) => ({ role: e.role })) as never });
    if (!drawn) continue;
    const old = v2.muscles.find((m) => m.muscle_id === muscle.muscle_id)!;
    const roles = Array.from(new Set(muscle.evidence.map((e) => e.role))).join("+");
    rows.push({
      set, muscle: muscle.muscle_canonical_name, region, roles,
      v2: old.strength_percentile, v2Band: rankForPercentile(old.strength_percentile)?.id,
      v3: Number(muscle.strength_percentile.toFixed(2)), v3Band: rankForPercentile(muscle.strength_percentile)?.id,
      change: Number((muscle.strength_percentile - old.strength_percentile).toFixed(2)),
    });
  }
}
const changed = rows.filter((r) => r.v2Band !== r.v3Band);
const summary = {
  muscles: rows.length,
  bandChanges: changed.length,
  up: changed.filter((r) => (r.change as number) > 0).length,
  down: changed.filter((r) => (r.change as number) < 0).length,
  meanChangePrimaryOnly: Number((rows.filter((r) => r.roles === "primary").reduce((s, r) => s + (r.change as number), 0) / Math.max(1, rows.filter((r) => r.roles === "primary").length)).toFixed(2)),
  largestRise: rows.reduce((a, r) => ((r.change as number) > (a.change as number) ? r : a), rows[0]),
  largestFall: rows.reduce((a, r) => ((r.change as number) < (a.change as number) ? r : a), rows[0]),
};
writeFileSync(process.argv[2], JSON.stringify({ summary, changed, rows }, null, 1));
console.log(JSON.stringify(summary, null, 1));
console.table(changed);
