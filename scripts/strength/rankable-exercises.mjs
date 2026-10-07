// Writes client/src/data/rankableExercises.json from the saved `snapshot` of rankable-exercises.sql:
// [[catalogId, "load" | "reps", norm_resolution, [[muscle, role, weight], ...]], ...]
// Stabilizer mappings are dropped: a muscle only steadied by a lift is never ranked by it
// (shared/capabilityRank.ts, isStabilizerOnly).
import { readFileSync, writeFileSync } from "node:fs";

const [input] = process.argv.slice(2);
if (!input) { console.error("usage: rankable-exercises.mjs <snapshot.json>"); process.exit(1); }
const rows = JSON.parse(readFileSync(input, "utf8"));
const exercises = {};
for (const [catalogId, mode, resolution, mappings] of rows) {
  exercises[catalogId] = [mode, resolution === "direct" ? "direct" : "related", (mappings ?? []).filter(([, role]) => role !== "stabilizer").map(([muscle, role, weight]) => [muscle, role, Math.round(weight * 100) / 100])];
}
const doc = {
  about: "Catalog exercises the muscle ranks can score, from score_strength_profile_v1 (the scorer behind strengthProfile.muscleRanks), with their working muscle mappings from exercise_muscle_mappings. Regenerate with scripts/strength/rankable-exercises.sql and scripts/strength/rankable-exercises.mjs.",
  generatedAt: new Date().toISOString().slice(0, 10),
  exercises,
};
writeFileSync(new URL("../../client/src/data/rankableExercises.json", import.meta.url), JSON.stringify(doc));
console.log(`${Object.keys(exercises).length} rankable exercises`);
