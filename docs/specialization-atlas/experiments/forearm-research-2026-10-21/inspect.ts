import { forearmRegionData as R } from "@shared/specialization/regions/forearm/index";
const nodes = R.nodes.filter(n => n.role === "target");
console.log("target nodes", nodes.length, nodes.map(n=>n.id).join(" "));
console.log("actions", R.actions.map(a=>a.id+"="+a.label).join(" | "));
console.log("nodeActions:");
for (const n of nodes) console.log(" ", n.id, R.nodeActions.filter(a=>a.nodeId===n.id).map(a=>a.actionId+":"+a.role).join(", "));
console.log("variants", R.variants.length, "mappings", R.mappings.length);
const byRel: Record<string, number> = {};
for (const m of R.mappings) { const k = m.reviewStatus+"/"+m.relationship+"/"+m.muscleMode+"/"+m.allocation; byRel[k]=(byRel[k]??0)+1; }
console.log(byRel);
console.log("mappingVersion", JSON.stringify(R.mappingVersion ?? (R as any).mappingVersions));
console.log(Object.keys(R));
