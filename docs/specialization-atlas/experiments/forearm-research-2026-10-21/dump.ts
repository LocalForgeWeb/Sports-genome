import { forearmRegionData as R } from "/home/user/Sports-genome/shared/specialization/regions/forearm/index";
import { exercises } from "/home/user/Sports-genome/client/src/lib/exerciseCatalog";
import { categoryFor } from "/home/user/Sports-genome/shared/specialization/rules";
import { indexRegion } from "/home/user/Sports-genome/shared/specialization/exposure";
const idx = indexRegion(R);
const cat = new Map(exercises.map(e => [e.id, e]));
const variants = new Map(R.variants.map(v => [v.id, v]));
const targets = R.nodes.filter(n => n.role === "target").map(n => n.id);
console.log("target nodes", targets.length, targets.join(","));
console.log("nodes roles", R.nodes.map(n=>`${n.id}:${n.role}`).join(" "));
const maps = Array.from(idx.mappingsByVariant.values()).flat();
console.log("mappings total", maps.length, "reviewed", maps.filter(m=>m.reviewStatus==="reviewed").length, "versions", Array.from(new Set(maps.map(m=>m.versionKey))).join(","));
// per variant credited work on own target nodes
const rows: string[] = [];
const byVariant = new Map<string, any[]>();
for (const m of maps) { if (m.reviewStatus !== "reviewed") continue; (byVariant.get(m.variantId) ?? byVariant.set(m.variantId, []).get(m.variantId)!).push(m); }
const lines: string[] = ["catalogId\tname\tequipment\tlaterality\tsidedBy\tmeasure\tdeliberateHold\tcredits(node:action:category:alloc)"];
for (const [vid, ms] of byVariant) {
  const v = variants.get(vid)!; const c = cat.get(v.catalogExerciseId);
  const credits = ms.filter(m => targets.includes(m.nodeId)).map(m => `${m.nodeId.replace("forearm.","")}:${m.actionId?.split(".")[1]}:${categoryFor(m.relationship, m.muscleMode, v.deliberateHold)}:${m.allocation}`);
  const direct = credits.some(x => /direct_dynamic|deliberate_isometric/.test(x));
  if (!direct) continue;
  lines.push([v.catalogExerciseId, c?.name, c?.equipment, v.laterality, v.sidedBy, v.measure, v.deliberateHold, credits.join(" ")].join("\t"));
}
console.log(lines.join("\n"));
// node actions
console.log("\nnode actions:"); for (const na of R.nodeActions) if (targets.includes(na.nodeId)) console.log(na.nodeId, na.actionId, na.role);
