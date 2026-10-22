import { forearmRegionData as data } from "/home/user/Sports-genome/shared/specialization/regions/forearm/index.ts";
import { categoryFor } from "/home/user/Sports-genome/shared/specialization/rules.ts";
const variants = new Map(data.variants.map((v) => [v.id, v]));
const rows: string[] = [];
const byVariant = new Map<string, typeof data.mappings>();
for (const m of data.mappings) { const l = byVariant.get(m.variantId) ?? []; l.push(m); byVariant.set(m.variantId, l); }
console.log("version", data.mappingVersion.key, data.mappingVersion.state, "mappings", data.mappings.length, "variants", data.variants.length, "external versions", data.externalMappingVersions.map((e) => `${e.regionId}:${e.version.key}:${e.mappings.length}`).join(","));
const statusCount: Record<string, number> = {};
for (const m of data.mappings) statusCount[m.reviewStatus] = (statusCount[m.reviewStatus] ?? 0) + 1;
console.log("status", JSON.stringify(statusCount));
for (const [vid, ms] of Array.from(byVariant).sort((a, b) => variants.get(a[0])!.catalogExerciseId - variants.get(b[0])!.catalogExerciseId)) {
  const v = variants.get(vid)!;
  const parts = ms.map((m) => `${m.nodeId.replace("forearm.", "").replace("upper_arm.", "UA.")}:${categoryFor(m.relationship, m.muscleMode, v.deliberateHold).replace("direct_dynamic", "DD").replace("contributing_dynamic", "CD").replace("deliberate_isometric", "HOLD").replace("incidental_isometric", "INC")}${m.requiresNoStraps ? "*" : ""}${m.reviewStatus !== "reviewed" ? "(" + m.reviewStatus + ")" : ""}`);
  rows.push(`${v.catalogExerciseId}\t${v.catalogName}\t${v.laterality}\t${v.measure}\thold=${v.deliberateHold}\tstraps=${v.straps}\t${parts.join(" ")}`);
}
console.log(rows.join("\n"));
