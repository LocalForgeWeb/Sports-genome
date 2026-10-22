// Scratch simulation: what a forearm_mappings_v2 would do to the golden histories (nothing in the repo changes).
async function main() {
  const mode = process.argv[2] ?? "v1"; // v1 | v2-contributing | v2-incidental
  const { regionDataFor } = await import("/home/user/Sports-genome/shared/specialization/registry");
  const region = regionDataFor("forearm")! as any;
  if (mode !== "v1") {
    const key = "forearm_mappings_v2";
    const fpl = new Set(["cat-144:forearm.fpl", "cat-145:forearm.fpl", "cat-299:forearm.fpl", "cat-409:forearm.fpl"]);
    region.mappingVersion = { ...region.mappingVersion, key, publishedAt: null, state: "draft" };
    region.mappings = region.mappings
      .filter((m: any) => !m.nodeId.startsWith("upper_arm."))
      .map((m: any) => ({ ...m, versionKey: key, ...(fpl.has(m.id) ? { reviewStatus: "reviewed", relationship: mode === "v2-incidental" ? "incidental" : "contributing" } : {}) }));
  }
  const { goldenSummaries } = await import("/home/user/Sports-genome/client/src/lib/specialization/__fixtures__/releaseGateHistories");
  const out: Record<string, unknown> = {};
  for (const { id, summary } of goldenSummaries()) {
    out[id] = {
      mappingVersion: summary.mappingVersion,
      regionDistinctBouts: summary.regionDistinctBouts,
      regionUnknownSideBouts: summary.regionUnknownSideBouts,
      completeness: summary.completeness,
      goals: summary.goals.map((g: any) => [g.goal.nodeId ?? g.goal.actionId, g.goal.metric, g.value]),
      nodes: Object.fromEntries(summary.nodes.map((n: any) => [n.nodeId, [n.directDynamicBouts, n.contributingDynamicBouts, n.deliberateHoldBouts, n.deliberateHoldSeconds, n.incidentalBouts, n.mixedBouts, n.unknownBouts, n.pendingReviewBouts, n.unknownSide.bouts, n.mappingCoverage].join("/")])),
    };
  }
  console.log(JSON.stringify(out));
}
main();
