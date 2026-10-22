const V2 = "forearm_mappings_v2";
const fplDrafts = new Set(["cat-144:forearm.fpl", "cat-145:forearm.fpl", "cat-299:forearm.fpl", "cat-409:forearm.fpl"]);
(async () => {
  const { regionDataFor } = await import("@shared/specialization/registry");
  const fx = await import("@/lib/specialization/__fixtures__/releaseGateHistories");
  const before = fx.goldenSummaries().map((c: any) => ({ id: c.id, fpl: c.summary.nodes.find((n: any) => n.nodeId === "forearm.fpl") }));
  const region = regionDataFor("forearm")! as any;
  const variant = (region.variants as any[]).find((v) => v.id === "cat-143");
  region.mappings = region.mappings.map((m: any) => ({ ...m, versionKey: V2, ...(fplDrafts.has(m.id) ? { reviewStatus: "reviewed", relationship: "incidental", requiresNoStraps: true } : {}) }));
  region.mappingVersion = { ...region.mappingVersion, key: V2 };
  const after = fx.goldenSummaries().map((c: any) => ({ id: c.id, fpl: c.summary.nodes.find((n: any) => n.nodeId === "forearm.fpl") }));
  let changed = 0;
  for (let i = 0; i < before.length; i++) {
    const a = before[i].fpl, b = after[i].fpl;
    const f = (n: any) => `inc ${n.incidentalBouts} hold ${n.deliberateHoldBouts} pend ${n.pendingReviewBouts} notCounted ${n.notCounted.length} (strapped ${n.notCounted.filter((c: any) => (c.notes ?? []).some((x: string) => /strap/i.test(x))).length}) unknownSide ${JSON.stringify(n.unknownSide)}`;
    if (f(a) !== f(b)) { changed++; if (/edge-week/.test(before[i].id)) console.log(before[i].id, "\n  before:", f(a), "\n  after: ", f(b)); }
  }
  console.log("changed FPL rows:", changed, "of", before.length, "143 deliberateHold", variant?.deliberateHold);
})();
