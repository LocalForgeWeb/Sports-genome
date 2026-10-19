import { exercises } from "/home/user/Sports-genome/client/src/lib/exerciseCatalog";
import { forearmRegionData } from "/home/user/Sports-genome/shared/specialization/regions/forearm";
const keys = ["frontDelts","sideDelts","rearDelts","rotatorCuff","chest","lats","upperBack","traps","lowerBack","biceps","brachialis","triceps","abs","obliques","glutes","abductors","hipFlexors","adductors","quads","hamstrings","calves","tibialis"];
const fv = new Set(forearmRegionData.variants.map((v) => v.catalogExerciseId));
const any = exercises.filter((e) => [...e.primaryMuscles, ...e.secondaryMuscles].some((k) => keys.includes(k)));
const prim = exercises.filter((e) => e.primaryMuscles.some((k) => keys.includes(k)));
console.log("union any:", any.length, "with forearm variant", any.filter((e) => fv.has(e.id)).length);
console.log("union primary:", prim.length, "with forearm variant", prim.filter((e) => fv.has(e.id)).length);
const forearmOnly = forearmRegionData.variants.filter((v) => !any.some((e) => e.id === v.catalogExerciseId));
console.log("forearm variants in none of the 8 new regions:", forearmOnly.length, forearmOnly.map((v) => v.catalogExerciseId).join(","));
const noKey = exercises.filter((e) => ![...e.primaryMuscles, ...e.secondaryMuscles].some((k) => keys.includes(k)));
console.log("catalog rows with none of the proposed keys:", noKey.length, noKey.map((e) => `${e.id} ${e.name} [${e.primaryMuscles}|${e.secondaryMuscles}]`).join("; "));
// how many forearm variants with laterality != bilateral overlap leg/core regions
const legCore = ["abs","obliques","glutes","abductors","hipFlexors","adductors","quads","hamstrings","calves","tibialis"];
const lc = forearmRegionData.variants.filter((v) => { const e = exercises.find((x) => x.id === v.catalogExerciseId)!; return e.primaryMuscles.some((k) => legCore.includes(k)); });
console.log("forearm variants whose exercise has a leg/core PRIMARY key:", lc.length, lc.map((v) => `${v.catalogExerciseId} ${v.catalogName} (${v.laterality})`).join("; "));
