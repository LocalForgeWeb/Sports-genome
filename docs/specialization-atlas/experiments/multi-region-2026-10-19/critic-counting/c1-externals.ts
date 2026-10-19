import { forearmRegionData as f } from "/home/user/Sports-genome/shared/specialization/regions/forearm";
import { exercises } from "/home/user/Sports-genome/client/src/lib/exerciseCatalog";
const ext = new Set(["upper_arm.biceps", "upper_arm.brachialis"]);
const byVariant = new Map<string, typeof f.mappings>();
for (const m of f.mappings) { const l = byVariant.get(m.variantId) ?? []; l.push(m); byVariant.set(m.variantId, l); }
const onlyExt = [...byVariant].filter(([, ms]) => ms.filter(m=>m.reviewStatus!=="rejected").every((m) => ext.has(m.nodeId)));
console.log("variants whose forearm v1 mappings are all external:", onlyExt.map(([v, ms]) => `${v}(${ms.map(m=>m.nodeId+":"+m.reviewStatus).join(",")})`).join("; ") || "none");
for (const [v] of onlyExt) { const e = exercises.find((x) => `cat-${x.id}` === v); console.log(v, e?.name, e?.primaryMuscles, e?.secondaryMuscles); }
// shared allocation on external nodes and on BR in the same variants
const sharedExt = f.mappings.filter((m) => ext.has(m.nodeId) && m.allocation === "shared");
console.log("external mappings with allocation shared:", sharedExt.length, sharedExt.slice(0, 10).map((m) => `${m.id} ${m.relationship}/${m.muscleMode}`).join("; "));
const sharedAll = f.mappings.filter((m) => m.allocation === "shared");
console.log("all shared mappings:", sharedAll.length, [...new Set(sharedAll.map(m=>m.nodeId))].join(","));
const brShared = f.mappings.filter((m) => m.nodeId === "forearm.br");
console.log("BR mappings:", brShared.length, "allocations", [...new Set(brShared.map(m=>m.allocation))]);
const extCount = f.mappings.filter((m) => ext.has(m.nodeId));
console.log("external mapping rows:", extCount.length, "variants", new Set(extCount.map(m=>m.variantId)).size);
// mapping ids format
console.log("sample ids", f.mappings.slice(0,3).map(m=>m.id));
// variants mapped with no mapping at all?
const mapped = new Set(f.mappings.map((m) => m.variantId));
console.log("variants with no mappings:", f.variants.filter((v) => !mapped.has(v.id)).map((v) => v.id).join(",") || "none");
// variants whose mappings are only draft
const onlyDraft = [...byVariant].filter(([, ms]) => ms.every((m) => m.reviewStatus === "draft"));
console.log("variants with only draft mappings:", onlyDraft.map(([v])=>v).join(","));
console.log("draft mappings:", f.mappings.filter(m=>m.reviewStatus==="draft").map(m=>m.id).join("; "));
