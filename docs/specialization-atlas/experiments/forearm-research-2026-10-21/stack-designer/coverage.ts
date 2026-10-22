import { readFileSync, writeFileSync } from "node:fs";
import { forearmRegionData as R } from "/home/user/Sports-genome/shared/specialization/regions/forearm/index";
import { exercises } from "/home/user/Sports-genome/client/src/lib/exerciseCatalog";
import { candidatesOf } from "./stackDesigner";
const PKG = "/home/user/Sports-genome/docs/specialization-atlas/forearm-research-v1";
const pkg = JSON.parse(readFileSync(`${PKG}/exercises.json`, "utf8")) as any[];
const muscles = JSON.parse(readFileSync(`${PKG}/muscles.json`, "utf8")) as any[];
const cands = candidatesOf(R, exercises);
const lines = ["| Muscle | Main actions (app, prime) | App reviewed exercises with direct work: dynamic | App: deliberate hold | Package protocols, direct dynamic (excl. blocked, alias) | Package: deliberate isometric | Stack can fill a gap? |", "|---|---|---|---|---:|---:|---|"];
for (const m of muscles) {
  const node = `forearm.${m.code === "SUP" ? "supinator" : m.code.toLowerCase()}`;
  const primes = R.nodeActions.filter((na) => na.nodeId === node && na.role === "prime").map((na) => R.actions.find((a) => a.id === na.actionId)!.label);
  const dyn = cands.filter((c) => c.directNodes.has(node) && c.credits.get(node) === "direct_dynamic").map((c) => `${c.exercise.id} ${c.exercise.name}`);
  const hold = cands.filter((c) => c.directNodes.has(node) && c.credits.get(node) === "deliberate_isometric").map((c) => `${c.exercise.id} ${c.exercise.name}`);
  const live = pkg.filter((r) => r.publication_status === "draft_mapping");
  const pd = live.filter((r) => r.mappings.some((x: any) => x.muscle_id === m.id && x.exposure_bucket === "direct_dynamic")).length;
  const pi = live.filter((r) => r.mappings.some((x: any) => x.muscle_id === m.id && x.exposure_bucket === "deliberate_isometric")).length;
  const primeCovered = R.nodeActions.filter((na) => na.nodeId === node && na.role === "prime").map((na) => cands.some((c) => c.covers.has(`${node}|${na.actionId}`)));
  const fill = primeCovered.every(Boolean) ? "yes, every main action" : primeCovered.some(Boolean) ? "partly" : "no: no reviewed direct exercise";
  lines.push(`| ${m.display_name} (${m.code}) | ${primes.join("; ")} | ${dyn.join("; ") || "none"} | ${hold.join("; ") || "none"} | ${pd} | ${pi} | ${fill} |`);
}
writeFileSync("/tmp/claude-0/-home-user-Sports-genome/1ff0a7bc-72e5-5e41-a8d9-937a97929500/scratchpad/forearm-v2/stack-designer/coverage-app-vs-package.md", "# Direct coverage: app (forearm_mappings_v1, reviewed) vs research package (draft)\n\nPackage counts recomputed from exercises.json (draft_mapping records only); they match Coverage-and-verification.md lines 18-38. App lists from candidatesOf() over forearmRegionData.\n\n" + lines.join("\n") + "\n");
console.log(lines.join("\n"));
