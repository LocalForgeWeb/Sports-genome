import { exercises } from "/home/user/Sports-genome/client/src/lib/exerciseCatalog";
import { forearmRegionData as f } from "/home/user/Sports-genome/shared/specialization/regions/forearm";
const keys: Record<string, string[]> = {
  shoulders: ["frontDelts", "sideDelts", "rearDelts", "rotatorCuff", "shoulders"], chest: ["chest", "serratusAnterior"], back: ["lats", "upperBack", "traps", "lowerBack"],
  upper_arm: ["biceps", "brachialis", "triceps"], core: ["abs", "obliques"], hips: ["glutes", "abductors", "hipFlexors", "adductors"], thigh: ["quads", "hamstrings"], lower_leg: ["calves", "tibialis"],
};
const waves: [string, string[]][] = [["A", ["upper_arm"]], ["B", ["shoulders", "chest", "back"]], ["C", ["core"]], ["D", ["lower_leg"]], ["E", ["hips", "thigh"]]];
const have = new Set(f.variants.map((v) => v.catalogExerciseId));
let total = 0;
for (const [wave, regions] of waves) {
  const ks = new Set(regions.flatMap((r) => keys[r]));
  const rows = exercises.filter((e) => [...e.primaryMuscles, ...e.secondaryMuscles].some((k) => ks.has(k)));
  const fresh = rows.filter((e) => !have.has(e.id));
  const frozen = rows.filter((e) => have.has(e.id) && !(wave === "0"));
  fresh.forEach((e) => have.add(e.id));
  total += fresh.length;
  console.log(wave, regions.join("+"), "rows tagged:", rows.length, "new variants:", fresh.length, "rows with an existing variant:", rows.length - fresh.length);
}
console.log("total new variants", total, "catalog rows", exercises.length);
