import { forearmMappings, forearmMappingVersion } from "/home/user/Sports-genome/shared/specialization/regions/forearm/mappings";
import { variantLibrary } from "/home/user/Sports-genome/shared/specialization/variants/index";
import { categoryFor } from "/home/user/Sports-genome/shared/specialization/rules";
import { forearmUnmappedTagged } from "/home/user/Sports-genome/shared/specialization/regions/forearm/unmapped";
import { forearmNodeActions } from "/home/user/Sports-genome/shared/specialization/regions/forearm/nodeActions";
import { writeFileSync } from "node:fs";
const vById = new Map(variantLibrary.map((v) => [v.id, v]));
const maps = forearmMappings.map((m) => {
  const v = vById.get(m.variantId)!;
  return { id: m.id, variantId: m.variantId, catalogId: v.catalogExerciseId, nodeId: m.nodeId, actionId: m.actionId, relationship: m.relationship, mode: m.muscleMode, basis: m.evidenceBasis, allocation: m.allocation, requiresNoStraps: m.requiresNoStraps, status: m.reviewStatus, category: categoryFor(m.relationship, m.muscleMode, v.deliberateHold), sources: m.sources.map((s) => s.sourceId) };
});
writeFileSync(process.argv[2], JSON.stringify({ version: forearmMappingVersion.key, state: forearmMappingVersion.state, mappings: maps, variants: variantLibrary, unmapped: forearmUnmappedTagged, nodeActions: forearmNodeActions }, null, 0));
console.log(maps.length, variantLibrary.length, forearmUnmappedTagged.length, forearmNodeActions.length);
