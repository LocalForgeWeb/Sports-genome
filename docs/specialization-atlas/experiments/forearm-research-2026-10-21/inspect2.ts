import { forearmRegionData as R } from "@shared/specialization/regions/forearm/index";
import { exercises } from "@/lib/exerciseCatalog";
import { categoryFor } from "@shared/specialization/rules";
const cat = new Map(exercises.map(e => [e.id, e]));
const abbr = (id: string) => id.replace("forearm.", "").replace("upper_arm.", "UA.");
const lines: string[] = [];
for (const v of R.variants) {
  const ms = R.mappings.filter(m => m.variantId === v.id && m.reviewStatus === "reviewed");
  const parts = ms.map(m => ({ m, c: categoryFor(m.relationship, m.muscleMode, v.deliberateHold) }));
  const direct = parts.filter(p => p.c === "direct_dynamic").map(p => `${abbr(p.m.nodeId)}:${p.m.actionId}${p.m.allocation==="shared"?"(sh)":""}`);
  const hold = parts.filter(p => p.c === "deliberate_isometric").map(p => `${abbr(p.m.nodeId)}:${p.m.actionId}${p.m.allocation==="shared"?"(sh)":""}`);
  const contrib = parts.filter(p => p.c === "contributing_dynamic").map(p => `${abbr(p.m.nodeId)}`);
  const inc = parts.filter(p => p.c === "incidental_isometric").map(p => abbr(p.m.nodeId));
  const e = cat.get(v.catalogExerciseId) as any;
  lines.push([v.id, e?.name ?? v.catalogName, e?.equipment, v.laterality, v.measure, v.deliberateHold?"hold":"", "D["+direct.join(" ")+"]", "H["+hold.join(" ")+"]", "C["+contrib.join(" ")+"]", "I["+inc.length+"]", (e?.movement??""), (e?.muscles??[]).join?.(",") ?? "" ].join(" | "));
}
console.log(lines.join("\n"));
console.log(Object.keys(exercises[0]));
