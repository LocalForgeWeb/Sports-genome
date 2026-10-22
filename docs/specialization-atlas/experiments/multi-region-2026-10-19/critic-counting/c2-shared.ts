import { forearmRegionData as f } from "/home/user/Sports-genome/shared/specialization/regions/forearm";
import { categoryFor } from "/home/user/Sports-genome/shared/specialization/rules";
const ext = new Set(["upper_arm.biceps", "upper_arm.brachialis"]);
const vById = new Map(f.variants.map((v) => [v.id, v]));
const extVariants = [...new Set(f.mappings.filter((m) => ext.has(m.nodeId)).map((m) => m.variantId))];
for (const vid of extVariants) {
  const v = vById.get(vid)!;
  const rows = f.mappings.filter((m) => m.variantId === vid && m.reviewStatus === "reviewed");
  const cat = (m: any) => categoryFor(m.relationship, m.muscleMode, v.deliberateHold);
  const extRows = rows.filter((m) => ext.has(m.nodeId)).map((m) => `${m.nodeId.split(".")[1]}:${m.allocation}:${cat(m)}`);
  const ownShared = rows.filter((m) => !ext.has(m.nodeId) && m.allocation === "shared").map((m) => `${m.nodeId.split(".")[1]}:${cat(m)}`);
  console.log(vid, v.catalogName, "| ext:", extRows.join(" "), "| own shared:", [...new Set(ownShared)].join(" "));
}
