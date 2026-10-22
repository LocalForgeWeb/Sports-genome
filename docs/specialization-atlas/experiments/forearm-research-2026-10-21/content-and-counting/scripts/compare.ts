import { readFileSync, writeFileSync } from "node:fs";
import { forearmRegionData } from "/home/user/Sports-genome/shared/specialization/regions/forearm/index.ts";
import { categoryFor } from "/home/user/Sports-genome/shared/specialization/rules.ts";

const [pkgDir, outDir] = process.argv.slice(2);
const E = JSON.parse(readFileSync(`${pkgDir}/exercises.json`, "utf8"));
const M = JSON.parse(readFileSync(`${pkgDir}/muscles.json`, "utf8"));
const node: Record<string, string> = {
  brachioradialis: "forearm.br", "flexor-carpi-radialis": "forearm.fcr", "flexor-carpi-ulnaris": "forearm.fcu", "palmaris-longus": "forearm.pl",
  "flexor-digitorum-superficialis": "forearm.fds", "flexor-digitorum-profundus": "forearm.fdp", "flexor-pollicis-longus": "forearm.fpl",
  "pronator-teres": "forearm.pt", "pronator-quadratus": "forearm.pq", "extensor-carpi-radialis-longus": "forearm.ecrl",
  "extensor-carpi-radialis-brevis": "forearm.ecrb", "extensor-carpi-ulnaris": "forearm.ecu", "extensor-digitorum": "forearm.ed",
  "extensor-digiti-minimi": "forearm.edm", "extensor-indicis": "forearm.ei", "abductor-pollicis-longus": "forearm.apl",
  "extensor-pollicis-brevis": "forearm.epb", "extensor-pollicis-longus": "forearm.epl", supinator: "forearm.supinator",
};
const code = Object.fromEntries(M.map((m: any) => [node[m.id], m.code]));
// Package record -> catalog id whose shipped definition is the same joint task (null: no row). Reasons in the report.
const alias: Record<string, number | null> = {
  "fa-01": 139, "fa-02": 140, "fa-03": null, "fa-04": 135, "fa-05": null, "fa-06": null, "fa-07": null, "fa-08": 121, "fa-09": 42, "fa-10": null,
  "fa-11": 410, "fa-12": 411, "fa-13": null, "fa-14": 132, "fa-15": null, "fa-16": 136, "fa-17": 405, "fa-18": 406, "fa-19": 407, "fa-20": 408,
  "fa-21": 299, "fa-22": 411, "fa-23": null, "fa-24": 350, "fa-25": null, "fa-26": 134, "fa-27": null, "fa-28": 332, "fa-29": null, "fa-30": null,
  "fa-31": null, "fa-32-flexion": null, "fa-32-extension": null, "fa-33": 409, "fa-34": null, "fa-35": null, "fa-36": null, "fa-37-flexion": null,
  "fa-37-extension": null, "fa-38": 142, "fa-39": null, "fa-40": null, "fa-41": 143, "fa-42": 78, "fa-43": 144, "fa-44": 143, "fa-45": null,
  "fa-46": null, "fa-47": 402, "fa-48": null, "fa-49": null, "fa-50-finger-close": null, "fa-50-finger-open": null, "fa-50-pronation": null,
  "fa-50-supination": null, "fa-50-wrist-flexion": null, "fa-50-wrist-extension": null,
};
const pkgCat: Record<string, string> = { direct_dynamic: "direct_dynamic", supporting_dynamic: "contributing_dynamic", deliberate_isometric: "deliberate_isometric", supporting_isometric: "incidental_isometric", incidental_grip: "incidental_isometric" };
const ab: Record<string, string> = { direct_dynamic: "DD", contributing_dynamic: "CD", deliberate_isometric: "DI", incidental_isometric: "II", mixed: "MX", unknown: "UN" };
const pab: Record<string, string> = { direct_dynamic: "DD", supporting_dynamic: "SD", deliberate_isometric: "DI", supporting_isometric: "SI", incidental_grip: "IG" };

const data = forearmRegionData;
const variantByCat = new Map(data.variants.map((v) => [v.catalogExerciseId, v] as const));
const ours = (catId: number) => {
  const v = variantByCat.get(catId)!;
  const out = new Map<string, { cat: string; rel: string; mode: string; action: string | null; status: string; shared: boolean; noStraps: boolean }>();
  for (const m of data.mappings.filter((m) => m.variantId === v.id && m.nodeId.startsWith("forearm."))) {
    out.set(m.nodeId, { cat: categoryFor(m.relationship, m.muscleMode, v.deliberateHold), rel: m.relationship, mode: m.muscleMode, action: m.actionId, status: m.reviewStatus, shared: m.allocation === "shared", noStraps: m.requiresNoStraps });
  }
  return { v, out };
};
const lines: string[] = [];
const csv: string[] = ["package_id,catalog_id,catalog_name,node,package_grade,package_bucket,ours_category,ours_relationship,ours_mode,ours_action,ours_status,agreement"];
let tally: Record<string, number> = {};
lines.push("| Package record | Catalog row | Package cells (grade+bucket) | Ours (reviewed category; d = draft) | Differences |", "|---|---|---|---|---|");
for (const e of E) {
  const cat = alias[e.id];
  const pkgCells = e.mappings.filter((m: any) => m.targeting_grade_0_4 !== null);
  const pkgText = pkgCells.map((m: any) => `${code[node[m.muscle_id]]} ${m.targeting_grade_0_4}${pab[m.exposure_bucket]}`).join(", ") || "none (blocked)";
  if (cat === null || cat === undefined) { lines.push(`| ${e.id} ${e.name} | none | ${pkgText} | — | no catalog row |`); continue; }
  const { v, out } = ours(cat);
  const oursText = Array.from(out).map(([n, o]) => `${code[n]} ${ab[o.cat]}${o.status === "draft" ? "(d)" : ""}`).join(", ");
  const diffs: string[] = [];
  const nodes = new Set([...pkgCells.map((m: any) => node[m.muscle_id]), ...out.keys()]);
  for (const n of nodes) {
    const p = pkgCells.find((m: any) => node[m.muscle_id] === n);
    const o = out.get(n);
    let agree: string;
    if (p && o) {
      const pc = pkgCat[p.exposure_bucket];
      agree = o.status === "draft" ? "ours draft" : pc === o.cat ? "same" : `differs`;
      if (agree !== "same") diffs.push(`${code[n]}: pkg ${p.targeting_grade_0_4}${pab[p.exposure_bucket]} vs ours ${ab[o.cat]}${o.status === "draft" ? " draft" : ""}`);
    } else if (p) { agree = "package only"; diffs.push(`${code[n]}: pkg ${p.targeting_grade_0_4}${pab[p.exposure_bucket]}, ours unmapped`); }
    else { agree = "ours only"; diffs.push(`${code[n]}: ours ${ab[o!.cat]}${o!.status === "draft" ? " draft" : ""}, pkg null`); }
    tally[agree] = (tally[agree] ?? 0) + 1;
    csv.push([e.id, cat, JSON.stringify(v.catalogName), code[n], p?.targeting_grade_0_4 ?? "", p?.exposure_bucket ?? "", o?.cat ?? "", o?.rel ?? "", o?.mode ?? "", o?.action ?? "", o?.status ?? "", agree].join(","));
  }
  lines.push(`| ${e.id} ${e.name} | ${cat} ${v.catalogName} | ${pkgText} | ${oursText} | ${diffs.join("; ") || "same categories"} |`);
}
writeFileSync(`${outDir}/package-vs-shipped-mappings.md`, lines.join("\n") + "\n");
writeFileSync(`${outDir}/package-vs-shipped-cells.csv`, csv.join("\n") + "\n");
console.log(JSON.stringify(tally));

// Coverage per node: reviewed variants giving direct work, by category.
const cov: string[] = ["| Node | Reviewed direct dynamic (variants) | Reviewed deliberate hold, direct (variants) | Contributing only | Draft |", "|---|---|---|---|---|"];
for (const n of Object.keys(code)) {
  const ms = data.mappings.filter((m) => m.nodeId === n);
  const vById = new Map(data.variants.map((v) => [v.id, v] as const));
  const dd = ms.filter((m) => m.reviewStatus === "reviewed" && categoryFor(m.relationship, m.muscleMode, vById.get(m.variantId)!.deliberateHold) === "direct_dynamic");
  const di = ms.filter((m) => m.reviewStatus === "reviewed" && m.relationship === "direct" && categoryFor(m.relationship, m.muscleMode, vById.get(m.variantId)!.deliberateHold) === "deliberate_isometric");
  const cd = ms.filter((m) => m.reviewStatus === "reviewed" && m.relationship === "contributing");
  const dr = ms.filter((m) => m.reviewStatus === "draft");
  const name = (m: any) => vById.get(m.variantId)!.catalogExerciseId;
  cov.push(`| ${code[n]} | ${dd.length}: ${dd.map(name).join(", ")} | ${di.length}: ${di.map(name).join(", ")} | ${cd.length} | ${dr.map((m) => m.id).join(", ") || "—"} |`);
}
writeFileSync(`${outDir}/shipped-coverage-by-node.md`, cov.join("\n") + "\n");
console.log(cov.join("\n"));
