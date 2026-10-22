import { forearmRegionData as f } from "/home/user/Sports-genome/shared/specialization/regions/forearm";
const odd = f.variants.filter((v) => v.id !== `cat-${v.catalogExerciseId}`);
console.log("non-default variant ids:", odd.length, odd.map((v) => v.id).join(", "));
console.log("measure seconds:", f.variants.filter((v) => v.measure === "seconds").map((v) => v.catalogExerciseId).join(","));
console.log("versions:", f.mappingVersion.key, "statuses:", JSON.stringify(f.mappings.reduce((a: any, m) => (a[m.reviewStatus] = (a[m.reviewStatus] ?? 0) + 1, a), {})));
console.log("rule:", JSON.stringify(Object.keys(f)));
