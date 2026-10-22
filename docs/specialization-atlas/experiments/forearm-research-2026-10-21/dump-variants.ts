import { forearmRegionData as data } from "/home/user/Sports-genome/shared/specialization/regions/forearm/index.ts";
import { categoryFor } from "/home/user/Sports-genome/shared/specialization/rules.ts";
const byVariant = new Map<string, string[]>();
for (const m of data.mappings) {
  const v = data.variants.find((x) => x.id === m.variantId)!;
  const cat = categoryFor(m.relationship, m.muscleMode, v.deliberateHold);
  const list = byVariant.get(m.variantId) ?? [];
  list.push(`${m.nodeId.replace("forearm.", "").replace("upper_arm.", "UA.")}:${cat}${m.reviewStatus !== "reviewed" ? "(" + m.reviewStatus + ")" : ""}${m.requiresNoStraps ? "*" : ""}`);
  byVariant.set(m.variantId, list);
}
for (const v of data.variants) {
  console.log(`${v.catalogExerciseId}\t${v.catalogName}\t${v.measure}\thold=${v.deliberateHold}\t${v.laterality}\t${(byVariant.get(v.id) ?? []).join(" ")}`);
}
console.log("variants", data.variants.length, "mappings", data.mappings.length);
