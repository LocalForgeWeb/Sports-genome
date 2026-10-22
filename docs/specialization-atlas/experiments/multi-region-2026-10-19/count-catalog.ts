import { exercises } from "/home/user/Sports-genome/client/src/lib/exerciseCatalog";
import { forearmRegionData } from "/home/user/Sports-genome/shared/specialization/regions/forearm";

const regions: Record<string, string[]> = {
  shoulders: ["frontDelts", "sideDelts", "rearDelts", "rotatorCuff"],
  chest: ["chest"],
  back: ["lats", "upperBack", "traps", "lowerBack"],
  upper_arm: ["biceps", "brachialis", "triceps"],
  core: ["abs", "obliques"],
  hips: ["glutes", "abductors", "hipFlexors", "adductors"],
  thigh: ["quads", "hamstrings"],
  lower_leg: ["calves", "tibialis"],
  forearm: ["forearms", "brachioradialis"],
};
const forearmVariantIds = new Set(forearmRegionData.variants.map((v) => v.catalogExerciseId));
const forearmMappedIds = new Set(forearmRegionData.mappings.map((m) => Number(m.variantId.replace("cat-", ""))));

const allKeys = new Map<string, { p: number; s: number }>();
for (const e of exercises) {
  for (const k of e.primaryMuscles) { const c = allKeys.get(k) ?? { p: 0, s: 0 }; c.p++; allKeys.set(k, c); }
  for (const k of e.secondaryMuscles) { const c = allKeys.get(k) ?? { p: 0, s: 0 }; c.s++; allKeys.set(k, c); }
}
console.log("catalog size", exercises.length, "max id", Math.max(...exercises.map((e) => e.id)));
console.log("forearm variants", forearmRegionData.variants.length, "distinct catalog ids", forearmVariantIds.size);
console.log("\nALL MUSCLE KEYS (primary/secondary rows):");
for (const [k, c] of [...allKeys].sort()) console.log(`  ${k}: primary ${c.p}, secondary ${c.s}`);

const unilateralQ = (e: any) => e.qualities.includes("unilateral");
console.log("\nPER REGION");
const regionOf = new Map<number, string[]>();
for (const [region, keys] of Object.entries(regions)) {
  const prim = exercises.filter((e) => e.primaryMuscles.some((k) => keys.includes(k)));
  const secOnly = exercises.filter((e) => !e.primaryMuscles.some((k) => keys.includes(k)) && e.secondaryMuscles.some((k) => keys.includes(k)));
  const any = [...prim, ...secOnly];
  for (const e of any) regionOf.set(e.id, [...(regionOf.get(e.id) ?? []), region]);
  const fv = (list: any[]) => list.filter((e) => forearmVariantIds.has(e.id)).length;
  console.log(`${region} [${keys.join(",")}]: primary ${prim.length} (forearm cat- variant ${fv(prim)}), secondary-only ${secOnly.length} (forearm variant ${fv(secOnly)}), total ${any.length} (forearm variant ${fv(any)}), unilateral quality ${any.filter(unilateralQ).length}`);
  for (const k of keys) {
    const p = exercises.filter((e) => e.primaryMuscles.includes(k));
    const s = exercises.filter((e) => e.secondaryMuscles.includes(k));
    console.log(`   ${k}: primary ${p.length} (fv ${fv(p)}), secondary ${s.length} (fv ${fv(s)})`);
  }
}
const multi = [...regionOf.values()].filter((r) => r.filter((x) => x !== "forearm").length >= 2).length;
console.log("\nexercises tagged in >=2 of the 8 new regions:", multi);
const hist = new Map<number, number>();
for (const r of regionOf.values()) { const n = r.filter((x) => x !== "forearm").length; hist.set(n, (hist.get(n) ?? 0) + 1); }
console.log("histogram of new-region count per exercise:", [...hist].sort());
const untagged = exercises.filter((e) => !regionOf.has(e.id));
console.log("exercises in no region at all:", untagged.length, untagged.slice(0, 15).map((e) => `${e.id} ${e.name} [${e.primaryMuscles}|${e.secondaryMuscles}]`));
// unilateral leg work
const legKeys = ["glutes", "abductors", "hipFlexors", "adductors", "quads", "hamstrings", "calves", "tibialis"];
const legUni = exercises.filter((e) => e.qualities.includes("unilateral") && e.primaryMuscles.some((k) => legKeys.includes(k)));
console.log("\nunilateral-quality exercises with a leg primary:", legUni.length);
console.log(legUni.map((e) => `${e.id} ${e.name}${forearmVariantIds.has(e.id) ? " [FOREARM cat-, laterality " + forearmRegionData.variants.find((v) => v.catalogExerciseId === e.id)!.laterality + "]" : ""}`).join("\n"));
const legNamed = exercises.filter((e) => /single-leg|split squat|lunge|step-up|pistol|single leg|one-leg|bulgarian|cossack|lateral squat|skater|curtsy/i.test(e.name));
console.log("\nby name: single-leg/split/lunge/step-up etc:", legNamed.length);
console.log(legNamed.map((e) => `${e.id} ${e.name} q=${e.qualities.includes("unilateral") ? "U" : "-"}${forearmVariantIds.has(e.id) ? " [FOREARM laterality " + forearmRegionData.variants.find((v) => v.catalogExerciseId === e.id)!.laterality + "]" : ""}`).join("\n"));
// core holds
const holds = exercises.filter((e) => /plank|hollow|hold|l-sit|wall sit|isometric|bridge hold|dead bug|pallof|carry|hang/i.test(e.name));
console.log("\nhold-like names:", holds.length);
console.log(holds.map((e) => `${e.id} ${e.name} [${e.primaryMuscles}|${e.secondaryMuscles}]${forearmVariantIds.has(e.id) ? " FOREARM measure " + forearmRegionData.variants.find((v) => v.catalogExerciseId === e.id)!.measure : ""}`).join("\n"));
