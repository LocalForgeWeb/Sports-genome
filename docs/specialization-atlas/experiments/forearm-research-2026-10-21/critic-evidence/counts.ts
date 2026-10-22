import { forearmMappings } from "@shared/specialization/regions/forearm/mappings";
import { forearmRegionData as data } from "@shared/specialization/regions/forearm";
import { categoryFor } from "@shared/specialization/rules";
const ext = forearmMappings.filter((m) => !m.nodeId.startsWith("forearm."));
const own = forearmMappings.filter((m) => m.nodeId.startsWith("forearm."));
console.log("total", forearmMappings.length, "external", ext.length, "own", own.length);
console.log("own drafts", own.filter((m) => m.reviewStatus === "draft").map((m) => m.id));
const variants = new Map(data.variants.map((v) => [v.id, v] as const));
const cat = new Map<string, number>();
for (const m of own) {
  if (m.reviewStatus !== "reviewed") continue;
  const v = variants.get(m.variantId)!;
  const c = categoryFor(m.relationship, m.muscleMode, v.deliberateHold);
  const key = `${m.relationship}/${m.muscleMode}/${v.deliberateHold}->${c}`;
  cat.set(key, (cat.get(key) ?? 0) + 1);
}
console.log(cat);
// contributing isometric on deliberate-hold variants (deliberate_isometric with relationship != direct)
for (const m of own) {
  const v = variants.get(m.variantId)!;
  if (m.reviewStatus === "reviewed" && m.relationship !== "direct" && categoryFor(m.relationship, m.muscleMode, v.deliberateHold) === "deliberate_isometric") console.log("non-direct deliberate:", m.id, m.relationship, v.organization);
}
// stabilizer rows by variant
const stab = own.filter((m) => m.relationship === "stabilizer").map((m) => m.variantId);
console.log("stabilizer variants", Array.from(new Set(stab)));
// prime node actions
const prime = data.nodeActions.filter((na) => na.role === "prime");
console.log("prime", prime.length, prime.filter((p) => ["forearm.pl","forearm.edm","forearm.ei","forearm.fcr","forearm.ed"].includes(p.nodeId)).map((p) => `${p.nodeId}:${p.actionId}`));
