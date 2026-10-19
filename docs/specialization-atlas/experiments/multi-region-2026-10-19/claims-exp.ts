import { forearmRegionData as f } from "/home/user/Sports-genome/shared/specialization/regions/forearm";
import { exposureRuleV1 } from "/home/user/Sports-genome/shared/specialization/rules";
import { emitSeedSql, referenceRegionLabels } from "/home/user/Sports-genome/scripts/specialization/emit-seed";
import type { SpecializationRegionData } from "/home/user/Sports-genome/shared/specialization/types";
const biceps = f.nodes.find((n) => n.id === "upper_arm.biceps")!;
const claims = f.claims.filter((c) => c.nodeId === biceps.id);
const nodeActions = f.nodeActions.filter((r) => r.nodeId === biceps.id);
const actions = f.actions.filter((a) => nodeActions.some((r) => r.actionId === a.id));
const srcIds = new Set(claims.flatMap((c) => c.sources.map((s) => s.sourceId)));
const upperArm: SpecializationRegionData = {
  region: { id: "upper_arm", label: "Upper arm", heading: "Upper-arm specialization", sortOrder: 20, status: "production", bodyMapKeys: ["biceps"], entryLabel: "x", wording: { externalGroup: "x", incidentalWork: "x", progressSubtitle: "x" }, measurementMetrics: ["circumference_cm"] },
  nodes: [biceps], actions, nodeActions, claims, sources: f.sources.filter((s) => srcIds.has(s.id)), variants: [], mappings: [],
  mappingVersion: { key: "upper_arm_mappings_v1", state: "draft", publishedAt: null, methodNotes: "x" }, diagram: null,
};
console.log("claims on biceps:", claims.map((c) => c.id).join(", "), "| node actions:", nodeActions.map((r) => `${r.actionId}->${r.claimId}`).join(", "));
try { emitSeedSql({ regions: [f, upperArm], rules: [exposureRuleV1], referenceRegionLabels }); console.log("seed ok"); } catch (e) { console.log("seed:", (e as Error).message); }
try { emitSeedSql({ regions: [f, { ...upperArm, mappings: [] , mappingVersion: { ...upperArm.mappingVersion }, claims: [], nodeActions: [] }], rules: [exposureRuleV1], referenceRegionLabels }); console.log("seed without claims/node actions: ok"); } catch (e) { console.log("seed (no claims):", (e as Error).message); }
