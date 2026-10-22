import { exercises } from "/home/user/Sports-genome/client/src/lib/exerciseCatalog";
const catalogKeys: Record<string, string[]> = {
  shoulders: ["frontDelts", "sideDelts", "rearDelts", "rotatorCuff", "shoulders"], chest: ["chest", "serratusAnterior"], back: ["lats", "upperBack", "traps", "lowerBack"],
  upper_arm: ["biceps", "brachialis", "triceps"], forearm: ["forearms"], core: ["abs", "obliques"], hips: ["glutes", "abductors", "hipFlexors", "adductors"], thigh: ["quads", "hamstrings"], lower_leg: ["calves", "tibialis"],
};
const all = new Set(Object.values(catalogKeys).flat());
const counts = new Map<string, number>();
for (const e of exercises) for (const k of [...e.primaryMuscles, ...e.secondaryMuscles]) counts.set(k, (counts.get(k) ?? 0) + 1);
console.log("catalog keys not in any region's catalogKeys:", [...counts].filter(([k]) => !all.has(k)).map(([k, n]) => `${k}(${n})`).join(", "));
console.log("region catalog keys never used by the catalog:", [...all].filter((k) => !counts.has(k)).join(", ") || "none");
// rows whose ONLY region keys are secondary for every new region (excluded by primary scope)
const prim = (e: any, keys: string[]) => e.primaryMuscles.some((k: string) => keys.includes(k));
const sec = (e: any, keys: string[]) => e.secondaryMuscles.some((k: string) => keys.includes(k));
for (const [r, keys] of Object.entries(catalogKeys)) {
  const p = exercises.filter((e) => prim(e, keys)).length, s = exercises.filter((e) => !prim(e, keys) && sec(e, keys)).length;
  console.log(r, "primary-tagged", p, "secondary-only", s);
}
