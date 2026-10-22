import { forearmMappings } from "/home/user/Sports-genome/shared/specialization/regions/forearm/mappings";
import { forearmV1Variants } from "/home/user/Sports-genome/shared/specialization/variants/forearm";
import { categoryFor } from "/home/user/Sports-genome/shared/specialization/rules";
import { writeFileSync } from "node:fs";
const vById = new Map(forearmV1Variants.map((v) => [v.catalogExerciseId, v]));
const maps = forearmMappings.map((m) => {
  const cat = Number(m.variantId.replace("cat-", ""));
  const v = vById.get(cat)!;
  return { catalogId: cat, nodeId: m.nodeId, actionId: m.actionId, relationship: m.relationship, mode: m.muscleMode, allocation: m.allocation, requiresNoStraps: m.requiresNoStraps, basis: m.evidenceBasis, status: m.reviewStatus, sources: m.sources.map((s) => s.sourceId), category: categoryFor(m.relationship, m.muscleMode, v.deliberateHold) };
});
writeFileSync(process.argv[2], JSON.stringify({ mappings: maps, variants: forearmV1Variants }, null, 1));
console.log(maps.length, "mappings", forearmV1Variants.length, "variants", maps.filter(m=>m.status==="reviewed").length, "reviewed", maps.filter(m=>m.nodeId.startsWith("forearm.")).length, "forearm-node");
