import { exercises } from "../../../../../../../home/user/Sports-genome/client/src/lib/exerciseCatalog";
import { forearmRegionData as f } from "../../../../../../../home/user/Sports-genome/shared/specialization/regions/forearm/index";
// Target nodes per catalog key, from the draft's §1.2 tables (role target only; group/adjacent excluded).
const targetsByKey: Record<string, [string, number]> = {
  frontDelts: ["shoulders", 1], sideDelts: ["shoulders", 1], rearDelts: ["shoulders", 1], rotatorCuff: ["shoulders", 4], shoulders: ["shoulders", 3],
  chest: ["chest", 3], serratusAnterior: ["chest", 1],
  lats: ["back", 1], upperBack: ["back", 2], traps: ["back", 2], lowerBack: ["back", 1],
  biceps: ["upper_arm", 1], brachialis: ["upper_arm", 1], triceps: ["upper_arm", 3],
  abs: ["core", 1], obliques: ["core", 2],
  glutes: ["hips", 1], abductors: ["hips", 3], hipFlexors: ["hips", 1], adductors: ["hips", 3],
  quads: ["thigh", 4], hamstrings: ["thigh", 4],
  calves: ["lower_leg", 2], tibialis: ["lower_leg", 1],
};
const regions = ["shoulders", "chest", "back", "upper_arm", "core", "hips", "thigh", "lower_leg"];
const forearmVariantIds = new Set(f.variants.map((v: any) => Number(String(v.id ?? v.key).replace(/^cat-/, ""))));
const rows: any[] = [];
let totP = 0, totAny = 0, totLo = 0, totHi = 0;
for (const r of regions) {
  let prim = 0, secOnly = 0, lo = 0, hi = 0;
  for (const e of exercises as any[]) {
    const p = (e.primaryMuscles ?? []).filter((k: string) => targetsByKey[k]?.[0] === r);
    const s = (e.secondaryMuscles ?? []).filter((k: string) => targetsByKey[k]?.[0] === r && !p.includes(k));
    if (p.length) prim++; else if (s.length) secOnly++;
    // low estimate: primary keys fan to their target nodes; secondary-only rows one row each
    lo += p.reduce((n: number, k: string) => n + targetsByKey[k][1], 0) + (p.length ? 0 : s.length ? 1 : 0);
    // high estimate: every tagged key fans to its target nodes
    hi += [...p, ...s].reduce((n: number, k: string) => n + targetsByKey[k][1], 0);
  }
  totP += prim; totAny += prim + secOnly; totLo += lo; totHi += hi;
  rows.push({ region: r, primaryTaggedRows: prim, secondaryOnlyRows: secOnly, decisions: prim + secOnly, mappingRowsLow: lo, mappingRowsHigh: hi });
}
console.table(rows);
console.log({ totalPrimary: totP, totalDecisions: totAny, mappingRowsLow: totLo, mappingRowsHigh: totHi, forearm: { variants: f.variants.length, mappings: f.mappings.length } });
const waves: Record<string, string[]> = { A: ["upper_arm", "shoulders", "chest"], B: ["back", "core"], C: ["hips", "thigh", "lower_leg"] };
for (const [w, rs] of Object.entries(waves)) {
  const sel = rows.filter((x) => rs.includes(x.region));
  console.log("wave", w, "decisions", sel.reduce((n, x) => n + x.decisions, 0), "mapping rows", sel.reduce((n, x) => n + x.mappingRowsLow, 0), "-", sel.reduce((n, x) => n + x.mappingRowsHigh, 0));
}
