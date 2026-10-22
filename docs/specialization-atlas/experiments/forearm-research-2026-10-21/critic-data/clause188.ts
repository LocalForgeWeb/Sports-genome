/**
 * Critic experiment (data/release lens): the draft's decision 4 recommends writing 188 and 264 as
 * sided_by "leg" (standing leg) when forearm_mappings_v2 is published at wave A (seed v3, rule v2).
 * Does the forearm, a production region, then reach a rule branch whose clause is unpublished?
 * ROOT is the checkout to read (the wave 0 head, or the reconcile worktree).
 */
const ROOT = process.env.ROOT!;
async function main() {
  const { forearmRegionData } = await import(`${ROOT}/shared/specialization/regions/forearm/index.ts`);
  const { ruleBranchesOf } = await import(`${ROOT}/shared/specialization/exposure.ts`);
  const { unpublishedBranches, exposureRuleV1, exposureRuleIds, ruleClauses } = await import(`${ROOT}/shared/specialization/rules.ts`);
  const waveA = [exposureRuleV1, { ...exposureRuleV1, id: exposureRuleIds.v2 }];
  const waveB = [...waveA, { ...exposureRuleV1, id: exposureRuleIds.v3 }];
  const leg = (v: any) => ([188, 264].includes(v.catalogExerciseId) ? { ...v, sidedBy: "leg", legLaterality: "unilateral", sideAnchor: "stance_leg" } : v);
  const asShipped = forearmRegionData;
  const standingLeg = { ...forearmRegionData, variants: forearmRegionData.variants.map(leg) };
  for (const [label, region] of [["188/264 as pinned (arm)", asShipped], ["188/264 standing leg (draft decision 4)", standingLeg]] as const) {
    for (const [wave, published] of [["wave A (v1+v2)", waveA], ["wave B (v1..v3)", waveB]] as const) {
      const missing = unpublishedBranches(ruleBranchesOf(region as any), published as any);
      console.log(`${label} | ${wave} | unpublished branches reached: ${JSON.stringify(missing.map((b: string) => `${b} -> ${ruleClauses[b].rule}`))}`);
    }
  }
}
main();
