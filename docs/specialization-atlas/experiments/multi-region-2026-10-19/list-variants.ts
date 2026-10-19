import { forearmRegionData } from "/home/user/Sports-genome/shared/specialization/regions/forearm/index";

const f = forearmRegionData;
console.log("variants", f.variants.length);
for (const v of f.variants) {
  console.log([v.id, v.catalogName, v.organization, v.forearmOrientation, v.wristPosition, v.gripType, v.straps, v.laterality, v.measure, v.deliberateHold, v.elbowAngleDeg].join(" | "));
}
console.log("nodes");
for (const n of f.nodes) console.log([n.id, n.regionId, n.role, n.status, n.catalogMuscleKey, n.databaseMuscle, n.border].join(" | "));
const mappedNodes = new Set(f.mappings.map((m) => m.nodeId));
console.log("mapped nodes", [...mappedNodes].sort().join(", "));
const ua = f.mappings.filter((m) => m.nodeId.startsWith("upper_arm."));
console.log("upper_arm mappings", ua.length, ua.filter((m) => m.reviewStatus === "reviewed").length);
console.log("upper_arm claims", f.claims.filter((c) => c.nodeId.startsWith("upper_arm.")).map((c) => `${c.id}:${c.kind}:${c.reviewStatus}`).join(", "));
console.log("upper_arm node actions", f.nodeActions.filter((c) => c.nodeId.startsWith("upper_arm.")).map((c) => `${c.nodeId} ${c.actionId} ${c.role} ${c.claimId}`).join("; "));
console.log("actions", f.actions.map((a) => a.id).join(", "));
