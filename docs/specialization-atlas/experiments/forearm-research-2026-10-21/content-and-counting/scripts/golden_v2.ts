import { writeFileSync } from "node:fs";
const [scenario, out] = process.argv.slice(2);
const V2 = "forearm_mappings_v2";
const drafts = new Set(["cat-144:forearm.fpl", "cat-145:forearm.fpl", "cat-299:forearm.fpl", "cat-409:forearm.fpl", "cat-317:forearm.br"]);
(async () => {
  const { regionDataFor } = await import("@shared/specialization/registry");
  const region = regionDataFor("forearm")! as any;
  if (scenario !== "base") {
    let mappings = region.mappings.map((m: any) => ({ ...m, versionKey: V2, reviewStatus: drafts.has(m.id) ? "reviewed" : m.reviewStatus }));
    if (scenario === "v2-own-only") mappings = mappings.filter((m: any) => !m.nodeId.startsWith("upper_arm."));
    if (scenario === "v2-fpl-stabilizer") mappings = mappings.map((m: any) => (drafts.has(m.id) && m.nodeId === "forearm.fpl" ? { ...m, relationship: "stabilizer" } : m));
    region.mappings = mappings;
    region.mappingVersion = { ...region.mappingVersion, key: V2 };
  }
  const fx = await import("@/lib/specialization/__fixtures__/releaseGateHistories");
  const check = (await import("@shared/specialization/registry")).regionDataFor("forearm") === region;
  const cases = fx.goldenSummaries().map((c: any) => ({ id: c.id, totals: fx.summaryTotals(c.summary), coverage: Object.fromEntries(c.summary.nodes.map((n: any) => [n.nodeId, n.mappingCoverage])) }));
  writeFileSync(out, JSON.stringify(cases));
  console.log(scenario, cases.length, "same region object:", check, cases[0].totals.mappingVersion);
})();
