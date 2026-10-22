import { exercises } from "/home/user/Sports-genome/client/src/lib/exerciseCatalog";
const pats = process.argv.slice(2).map((p) => new RegExp(p, "i"));
for (const e of exercises) {
  const hay = `${e.name} | ${e.equipment} | ${e.movement}`;
  if (pats.some((p) => p.test(hay))) console.log(e.id, "|", e.name, "|", e.equipment, "|", e.movement, "|", e.category, "| P:", e.primaryMuscles.join(","), "| S:", e.secondaryMuscles.join(","), "| Q:", e.qualities.join(","));
}
