import { exercises } from "/home/user/Sports-genome/client/src/lib/exerciseCatalog";
import { forearmRegionData as f, } from "/home/user/Sports-genome/shared/specialization/regions/forearm";
import { unmappedForearmTaggedExercises } from "/home/user/Sports-genome/shared/specialization/regions/forearm/variants";
const fv = new Set(f.variants.map((v) => v.catalogExerciseId));
const bicepsTagged = exercises.filter((e) => [...e.primaryMuscles, ...e.secondaryMuscles].some((k) => k === "biceps" || k === "brachialis"));
const notForearmMapped = bicepsTagged.filter((e) => !fv.has(e.id));
console.log("biceps/brachialis-tagged rows:", bicepsTagged.length, "not in forearm v1:", notForearmMapped.length);
const fTag = (e: any) => [...e.primaryMuscles, ...e.secondaryMuscles].includes("forearms");
console.log("  of those, also tagged forearms (forearm region-only today):", notForearmMapped.filter(fTag).map((e) => `${e.id} ${e.name}`).join("; "));
console.log("  not tagged forearms (unrelated to forearm today):", notForearmMapped.filter((e) => !fTag(e)).length, notForearmMapped.filter((e) => !fTag(e)).slice(0, 15).map((e) => `${e.id} ${e.name} [${e.primaryMuscles}|${e.secondaryMuscles}]`).join("; "));
for (const u of unmappedForearmTaggedExercises) { const e = exercises.find((x) => x.id === u.catalogExerciseId)!; console.log("unmapped forearm-tagged", e.id, e.name, e.primaryMuscles, e.secondaryMuscles); }
