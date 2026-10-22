import { writeFileSync } from "node:fs";
const [scenario, out] = process.argv.slice(2);
const fplDrafts = new Set(["cat-144:forearm.fpl", "cat-145:forearm.fpl", "cat-299:forearm.fpl", "cat-409:forearm.fpl"]);
(async () => {
  const { regionDataFor } = await import("@shared/specialization/registry");
  const region = regionDataFor("forearm")! as any;
  if (scenario !== "base") {
    region.mappings = region.mappings.map((m: any) => ({ ...m, versionKey: "forearm_mappings_v2", ...(fplDrafts.has(m.id) ? { reviewStatus: "reviewed", relationship: "incidental", requiresNoStraps: scenario === "nostraps" } : {}) }));
    region.mappingVersion = { ...region.mappingVersion, key: "forearm_mappings_v2" };
  }
  const fx = await import("@/lib/specialization/__fixtures__/releaseGateHistories");
  const rows = fx.goldenSummaries().map((c: any) => { const n = c.summary.nodes.find((x: any) => x.nodeId === "forearm.fpl"); return { id: c.id, inc: n.incidentalBouts, hold: n.deliberateHoldBouts, pend: n.pendingReviewBouts, notCounted: n.notCounted.length, notes: n.notCounted.map((c: any) => (c.notes ?? []).join("|")), unknownSide: n.unknownSide }; });
  writeFileSync(out, JSON.stringify(rows, null, 1));
})();
