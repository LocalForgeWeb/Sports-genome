// Writes client/src/data/rankableExercises.json from the saved `snapshot` of rankable-exercises.sql:
// [[catalogId, "load" | "reps", norm_resolution, [[muscle, role, weight], ...], name], ...]
// Stabilizer mappings are dropped: a muscle only steadied by a lift is never ranked by it
// (shared/capabilityRank.ts, isStabilizerOnly).
//
// Every row is checked before anything is written (Oct 7 brief S03). A resolution the scorer has
// not used before, a malformed mapping, an impossible weight or a repeated ID stops the run with
// the rows named: an unexpected scorer state must never quietly become a "related" comparison.
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

/** The scorer's norm_resolution values this table knows, and what each means to the athlete. */
export const RESOLUTIONS = Object.freeze({
  direct: "direct", // compared with lifters who logged this exact lift
  aliased_variant: "related", // compared through a named variant's norms
  aliased_rep_variant: "related", // compared through a named variant's rep norms
});
const MODES = new Set(["load", "reps"]);
const ROLES = new Set(["primary", "secondary", "stabilizer"]);
export const SCHEMA_VERSION = 2;
export const SCORER = "score_strength_profile_v1";

/** Validates the raw rows and returns the table, or throws with every problem listed. */
export function buildRankableTable(rows) {
  const problems = [];
  const warnings = [];
  const exercises = {};
  const names = [];
  if (!Array.isArray(rows)) throw new Error("snapshot must be an array of rows");
  for (const [index, row] of rows.entries()) {
    const where = `row ${index}`;
    if (!Array.isArray(row) || row.length !== 5) { problems.push(`${where}: expected [catalogId, mode, resolution, mappings, name]`); continue; }
    const [catalogId, mode, resolution, mappings, name] = row;
    const at = `${where} (catalog ${catalogId})`;
    if (!Number.isInteger(catalogId) || catalogId <= 0) problems.push(`${at}: catalogId must be a positive integer`);
    else if (String(catalogId) in exercises) problems.push(`${at}: duplicate catalogId`);
    if (!MODES.has(mode)) problems.push(`${at}: unknown mode ${JSON.stringify(mode)}`);
    if (!Object.hasOwn(RESOLUTIONS, resolution)) problems.push(`${at}: unknown norm_resolution ${JSON.stringify(resolution)} - add it to RESOLUTIONS only once its meaning is known`);
    if (typeof name !== "string" || !name.trim()) problems.push(`${at}: missing exercise name`);
    if (!Array.isArray(mappings) || mappings.length === 0) { problems.push(`${at}: no muscle mappings`); continue; }
    const working = [];
    for (const mapping of mappings) {
      const [muscle, role, weight] = Array.isArray(mapping) ? mapping : [];
      if (typeof muscle !== "string" || !muscle) { problems.push(`${at}: mapping without a muscle`); continue; }
      if (!ROLES.has(role)) { problems.push(`${at}: ${muscle} has unknown role ${JSON.stringify(role)}`); continue; }
      // A stabilizer is dropped whatever its weight, so a missing one cannot change a rank: noted, not fatal.
      if (role === "stabilizer") { if (typeof weight !== "number") warnings.push(`${at}: stabilizer ${muscle} has no weight (dropped either way)`); continue; }
      if (typeof weight !== "number" || !Number.isFinite(weight) || weight <= 0 || weight > 1) { problems.push(`${at}: ${muscle} has weight ${JSON.stringify(weight)} outside (0, 1]`); continue; }
      working.push([muscle, role, Math.round(weight * 100) / 100]);
    }
    if (working.length === 0) problems.push(`${at}: only stabilizer mappings, so it can rank no muscle group`);
    if (problems.length === 0) {
      exercises[catalogId] = [mode, RESOLUTIONS[resolution], working];
      names.push([catalogId, name]);
    }
  }
  if (problems.length) throw new Error(`rankable snapshot rejected:\n  ${problems.join("\n  ")}`);
  return { exercises, names: names.sort((a, b) => a[0] - b[0]), warnings };
}

/** md5 of "id:name" lines, in ID order: the same digest the SQL can compute, and a test can recompute from the app catalog. */
export function namesFingerprint(names) {
  return createHash("md5").update(names.map(([id, name]) => `${id}:${name}`).join("\n")).digest("hex");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [input] = process.argv.slice(2);
  if (!input) { console.error("usage: rankable-exercises.mjs <snapshot.json>"); process.exit(1); }
  let table;
  try { table = buildRankableTable(JSON.parse(readFileSync(input, "utf8"))); }
  catch (error) { console.error(error.message); process.exit(1); }
  for (const warning of table.warnings) console.warn(`note: ${warning}`);
  const doc = {
    about: "Catalog exercises the muscle ranks can score, from score_strength_profile_v1 (the scorer behind strengthProfile.muscleRanks), with their working muscle mappings from exercise_muscle_mappings. Regenerate with scripts/strength/rankable-exercises.sql and scripts/strength/rankable-exercises.mjs.",
    schemaVersion: SCHEMA_VERSION,
    scorer: SCORER,
    resolutions: RESOLUTIONS,
    generatedAt: new Date().toISOString().slice(0, 10),
    // Compatibility with the app's catalog, beyond a date: the names the database holds for these
    // IDs, as a digest the app's own catalog must reproduce (rankRecommendations.test.ts).
    catalog: { scored: Object.keys(table.exercises).length, namesFingerprint: namesFingerprint(table.names) },
    exercises: table.exercises,
  };
  writeFileSync(new URL("../../client/src/data/rankableExercises.json", import.meta.url), JSON.stringify(doc));
  console.log(`${Object.keys(table.exercises).length} rankable exercises, names ${doc.catalog.namesFingerprint}`);
}
