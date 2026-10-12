// The photo checklist's rows: every catalog exercise and warm-up drill that still has no
// photograph, each with what its start and finish photos must show (Oct 12).
//
//   npx tsx scripts/exercise-photos/checklist.ts <out.json>
//
// Reads the catalog and the preparation library, drops whatever exercisePhotos.json and
// drillPhotos.json already photograph, and attaches each remaining item's spec from
// docs/exercise-photo-checklist/specs.json. Writes one row per item, in the shape the
// checklist page keeps in its store (docs/exercise-photo-checklist/README.md). Exits non-zero
// if an item without a photo has no spec, so a new exercise cannot slip onto the list
// without a brief for its photographer.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { exercises } from "../../client/src/lib/exerciseCatalog";
import { preTrainingMobilityLibrary } from "../../client/src/lib/preTrainingMobility";

type Spec = { key: string; start: string; finish: string; avoid: string };

const [out] = process.argv.slice(2);
if (!out) { console.error("usage: checklist.ts <out.json>"); process.exit(1); }
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const read = (file: string) => JSON.parse(readFileSync(path.join(root, file), "utf8"));
const photos: Record<string, unknown> = read("client/src/data/exercisePhotos.json");
const drillPhotos: Record<string, unknown> = read("client/src/data/drillPhotos.json");
const specs = new Map((read("docs/exercise-photo-checklist/specs.json") as Spec[]).map((spec) => [spec.key, spec]));
const phase: Record<string, string> = { raise: "Raise", mobilize: "Mobilize", activate: "Activate", rehearse: "Rehearse" };

const rows = [
  ...exercises.filter((exercise) => !(String(exercise.id) in photos)).map((exercise) => ({
    key: `ex-${exercise.id}`, kind: "exercise", ref: exercise.id, name: exercise.name,
    group: exercise.category, equipment: exercise.equipment, order: 0,
  })),
  ...preTrainingMobilityLibrary.map((drill, index) => ({ drill, index })).filter(({ drill }) => !(drill.id in drillPhotos)).map(({ drill, index }) => ({
    key: `drill-${drill.id}`, kind: "drill", ref: drill.id, name: drill.name,
    group: phase[drill.phase] ?? "Drills", equipment: null, order: index,
  })),
].map((row) => {
  const spec = specs.get(row.key);
  return { ...row, needStart: spec?.start ?? null, needFinish: spec?.finish ?? null, needAvoid: spec?.avoid ?? null, photoStart: null, photoFinish: null, checked: false, live: false };
});

writeFileSync(out, JSON.stringify(rows, null, 1) + "\n");
const unspecified = rows.filter((row) => !row.needStart);
console.log(`${rows.length} items without a photo (${rows.filter((row) => row.kind === "exercise").length} exercises, ${rows.filter((row) => row.kind === "drill").length} drills)`);
if (unspecified.length) {
  console.error(`no spec in docs/exercise-photo-checklist/specs.json for: ${unspecified.map((row) => `${row.key} (${row.name})`).join(", ")}`);
  process.exit(1);
}
