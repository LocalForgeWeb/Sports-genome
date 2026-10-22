import { readFileSync, writeFileSync } from "node:fs";
import { forearmRegionData as R } from "/home/user/Sports-genome/shared/specialization/regions/forearm/index";
import { exercises } from "/home/user/Sports-genome/client/src/lib/exerciseCatalog";
import { indexRegion } from "/home/user/Sports-genome/shared/specialization/exposure";
import { categoryFor } from "/home/user/Sports-genome/shared/specialization/rules";
const PKG = "/home/user/Sports-genome/docs/specialization-atlas/forearm-research-v1";
const pkg = JSON.parse(readFileSync(`${PKG}/exercises.json`, "utf8")) as any[];
const muscles = JSON.parse(readFileSync(`${PKG}/muscles.json`, "utf8")) as any[];
const toNode = new Map(muscles.map((m) => [m.id, `forearm.${m.code === "SUP" ? "supinator" : m.code.toLowerCase()}`]));
// Hand reconciliation by set-up (variant notes), not by name similarity; null = no catalog row with this set-up.
const match: Record<string, [number | null, string]> = {
  "fa-01": [139, "catalog 139 is kneeling, forearms on a bench (variant notes); package is seated: same action, different support"],
  "fa-02": [140, "kneeling vs seated, same action"], "fa-03": [null, "no behind-the-back row"], "fa-04": [135, "same"],
  "fa-05": [null, "no reverse preacher row"], "fa-06": [null, "no barbell static hold row (145 Farmer Hold is an implement in each hand)"],
  "fa-07": [null, "blocked in package; app splits the roller by direction: 141 (direction not recorded), 415, 416"],
  "fa-08": [null, "no thick-handle variant; app has no grip-diameter dimension"], "fa-09": [null, "no thick-handle variant"],
  "fa-10": [null, "blocked in package"], "fa-11": [410, "410 is one-arm, forearm on the thigh; package does not say one or two dumbbells"],
  "fa-12": [411, "as fa-11"], "fa-13": [null, "blocked in package"], "fa-14": [132, "same"], "fa-15": [null, "no preacher hammer row"],
  "fa-16": [136, "same; both refuse rotation credit for the turn"], "fa-17": [405, "same set-up (offset lever, elbow 90)"],
  "fa-18": [406, "same"], "fa-19": [407, "same"], "fa-20": [408, "same"], "fa-21": [null, "no thick-handle carry; 299 Farmer's Walk is the plain-handle row"],
  "fa-22": [411, "package alias of fa-12"], "fa-23": [null, "no cable wrist curl (flexion) row"], "fa-24": [350, "350 Cable Wrist Extension: bar or handle not recorded"],
  "fa-25": [null, "no cable reverse curl row"], "fa-26": [337, "two catalog rows read as this: 134 Rope Hammer Curl and 337 Rope Hammer Cable Curl"],
  "fa-27": [null, "blocked in package"], "fa-28": [null, "no rope-attachment row (54 is Seated Cable Row, handle not recorded)"],
  "fa-29": [null, "no towel cable row"], "fa-30": [null, "machine; 405 is a loaded handle"], "fa-31": [null, "machine; 406 is a loaded handle"],
  "fa-32-flexion": [null, "no wrist machine row"], "fa-32-extension": [null, "no wrist machine row"], "fa-33": [409, "409 Suitcase Carry, dumbbell or kettlebell, walking"],
  "fa-34": [null, "no bottoms-up press row"], "fa-35": [null, "no bottoms-up clean row (387 is a standard kettlebell clean)"], "fa-36": [null, "no kettlebell hammer curl row"],
  "fa-37-flexion": [null, "no kettlebell wrist curl row"], "fa-37-extension": [null, "no kettlebell reverse wrist curl row"], "fa-38": [142, "same"],
  "fa-39": [null, "blocked in package"], "fa-40": [null, "blocked in package"], "fa-41": [143, "same"], "fa-42": [78, "same"], "fa-43": [144, "same"],
  "fa-44": [null, "no thick-bar hang row"], "fa-45": [null, "no fingertip push-up row"], "fa-46": [null, "no fingertip plank row"], "fa-47": [402, "same"],
  "fa-48": [null, "no ball-squeeze row"], "fa-49": [null, "no crab walk row"],
  "fa-50-finger-close": [null, "no rice-bucket rows"], "fa-50-finger-open": [null, "no rice-bucket rows"], "fa-50-pronation": [null, "no rice-bucket rows"],
  "fa-50-supination": [null, "no rice-bucket rows"], "fa-50-wrist-flexion": [null, "no rice-bucket rows"], "fa-50-wrist-extension": [null, "no rice-bucket rows"],
};
const idx = indexRegion(R);
const cat = new Map(exercises.map((e) => [e.id, e.name]));
const appCats = (catalogId: number) => {
  const variant = R.variants.find((v) => v.catalogExerciseId === catalogId);
  if (!variant) return null;
  const out = new Map<string, string>();
  for (const m of idx.mappingsByVariant.get(variant.id) ?? []) if (m.nodeId.startsWith("forearm.") && m.reviewStatus === "reviewed") out.set(m.nodeId, `${m.relationship}/${categoryFor(m.relationship, m.muscleMode, variant.deliberateHold)}`);
  return out;
};
const rows = ["fa_id\tcandidate\tpackage_status\tcatalog_id\tcatalog_name\tsetup_note\tpackage_direct(dynamic|hold)\tapp_direct(dynamic|hold)\tagree_on_direct\tother_differences"];
let agree = 0, differ = 0, matched = 0;
for (const r of pkg) {
  const [cid, note] = match[r.id] ?? [null, "unreviewed"];
  const pdirect = r.mappings.filter((m: any) => m.exposure_bucket === "direct_dynamic" || m.exposure_bucket === "deliberate_isometric").map((m: any) => `${toNode.get(m.muscle_id)!.slice(8)}:${m.exposure_bucket === "direct_dynamic" ? "dyn" : "hold"}`).sort();
  let adirect: string[] = []; let diffs: string[] = []; let ok = "";
  if (cid !== null) {
    matched += 1;
    const a = appCats(cid)!;
    adirect = Array.from(a.entries()).filter(([, v]) => v.startsWith("direct/")).map(([k, v]) => `${k.slice(8)}:${v.endsWith("direct_dynamic") ? "dyn" : "hold"}`).sort();
    ok = JSON.stringify(pdirect) === JSON.stringify(adirect) ? "yes" : "no";
    if (ok === "yes") agree += 1; else differ += 1;
    for (const m of r.mappings) {
      const node = toNode.get(m.muscle_id)!; const app = a.get(node);
      const pb = m.exposure_bucket;
      if (pb === "unmodeled" && app) diffs.push(`${node.slice(8)}: package unmodeled, app ${app}`);
      else if (pb !== "unmodeled" && !app) diffs.push(`${node.slice(8)}: package ${pb} g${m.targeting_grade_0_4}, app no mapping`);
      else if (pb !== "unmodeled" && app) {
        const same = (pb === "direct_dynamic" && app.endsWith("direct_dynamic")) || (pb === "deliberate_isometric" && app.endsWith("deliberate_isometric")) || (pb === "supporting_dynamic" && app.endsWith("contributing_dynamic")) || ((pb === "supporting_isometric" || pb === "incidental_grip") && app.endsWith("incidental_isometric"));
        if (!same) diffs.push(`${node.slice(8)}: package ${pb} g${m.targeting_grade_0_4}, app ${app}`);
      }
    }
  }
  rows.push([r.id, r.original_candidate_number, r.publication_status, cid ?? "", cid ? cat.get(cid) : "", note, pdirect.join(" "), adirect.join(" "), ok, diffs.join("; ")].join("\t"));
}
writeFileSync("/tmp/claude-0/-home-user-Sports-genome/1ff0a7bc-72e5-5e41-a8d9-937a97929500/scratchpad/forearm-v2/package-to-catalog.tsv", rows.join("\n"));
console.log(`matched ${matched} of ${pkg.length}; direct sets agree ${agree}, differ ${differ}`);
console.log(rows.filter((r) => r.includes("\tno\t") || r.split("\t")[9]).slice(1).map((r) => { const c = r.split("\t"); return `${c[0]} -> ${c[3]} ${c[4]} | agree ${c[8]} | ${c[9]}`; }).join("\n"));
