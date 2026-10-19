import { exercises } from "../../../../../../home/user/Sports-genome/client/src/lib/exerciseCatalog";
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
const keys = new Map<string, { p: number; s: number }>();
for (const e of exercises as any[]) {
  for (const k of e.primaryMuscles ?? []) { const v = keys.get(k) ?? { p: 0, s: 0 }; v.p++; keys.set(k, v); }
  for (const k of e.secondaryMuscles ?? []) { const v = keys.get(k) ?? { p: 0, s: 0 }; v.s++; keys.set(k, v); }
}
console.log("catalog rows", exercises.length);
console.log("all keys", JSON.stringify(Object.fromEntries([...keys].sort())));
for (const [r, ks] of Object.entries(regions)) {
  const any = (exercises as any[]).filter((e) => [...(e.primaryMuscles ?? []), ...(e.secondaryMuscles ?? [])].some((k: string) => ks.includes(k)));
  const prim = (exercises as any[]).filter((e) => (e.primaryMuscles ?? []).some((k: string) => ks.includes(k)));
  console.log(r, "primary-tagged", prim.length, "any-tagged", any.length, ks.map((k) => `${k}:${keys.get(k)?.p ?? 0}p/${keys.get(k)?.s ?? 0}s`).join(" "));
}
// overlap: exercises tagged for >1 proposed region (any)
const regionOf = (k: string) => Object.entries(regions).find(([, ks]) => ks.includes(k))?.[0];
const multi = (exercises as any[]).map((e) => new Set([...(e.primaryMuscles ?? []), ...(e.secondaryMuscles ?? [])].map(regionOf).filter(Boolean))).filter((s) => s.size > 1).length;
console.log("rows tagged in more than one region", multi);
const dist: Record<number, number> = {};
for (const e of exercises as any[]) { const n = new Set([...(e.primaryMuscles ?? []), ...(e.secondaryMuscles ?? [])].map(regionOf).filter(Boolean)).size; dist[n] = (dist[n] ?? 0) + 1; }
console.log("regions per row", JSON.stringify(dist));
