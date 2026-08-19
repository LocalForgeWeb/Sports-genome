import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sourcePath = "/home/ubuntu/enrich_sport_movement_profiles.json";
const outputPath = resolve(root, "client/src/lib/enrichedSportMovementDatabase.ts");
const archivePath = resolve(root, "data/sport-movement-research/enriched-movement-records.json");

function asList(value) {
  if (Array.isArray(value)) return value.flatMap((item) => asList(item));
  if (value == null) return [];
  const text = String(value).trim();
  return text ? text.split(/\s*;\s*|\n+/).map((item) => item.trim()).filter(Boolean) : [];
}

function normalizedRecord(record, sportId, sourceSummary) {
  const required = [
    "id",
    "label",
    "movement_family",
    "body_actions",
    "joint_actions",
    "prime_movers",
    "assisting_muscles",
    "stabilizers",
    "contraction_roles",
    "recommended_exercise_patterns",
    "transfer_rationale",
    "exercise_selection_cautions",
    "evidence_confidence",
    "sources",
  ];
  const missing = required.filter((key) => record[key] == null || record[key] === "");
  if (missing.length) throw new Error(`${sportId}/${record.id || "unknown"} missing: ${missing.join(", ")}`);
  return {
    id: String(record.id),
    sportId,
    label: String(record.label),
    movementFamily: String(record.movement_family),
    bodyActions: asList(record.body_actions),
    jointActions: asList(record.joint_actions),
    primeMovers: asList(record.prime_movers),
    assistingMuscles: asList(record.assisting_muscles),
    stabilizers: asList(record.stabilizers),
    contractionRoles: asList(record.contraction_roles),
    commonForceOrSkillDemand: String(record.common_force_or_skill_demand || "Task-specific force and coordination demand."),
    recommendedExercisePatterns: asList(record.recommended_exercise_patterns),
    recommendedExercises: asList(record.recommended_exercises || record.recommended_exercise_names || record.exercise_recommendations || record.recommended_exercise_patterns),
    transferRationale: String(record.transfer_rationale),
    exerciseSelectionCautions: String(record.exercise_selection_cautions),
    evidenceConfidence: String(record.evidence_confidence).toLowerCase(),
    sources: asList(record.sources),
    sourceSummary,
  };
}

async function main() {
  const manifest = JSON.parse(await readFile(sourcePath, "utf8"));
  const rows = manifest.results || [];
  if (rows.length !== 20) throw new Error(`Expected 20 sport files; received ${rows.length}.`);

  const records = [];
  for (const row of rows) {
    const sportId = row.output?.sport_id;
    const fileUrl = row.output?.research_file;
    const sourceSummary = row.output?.source_summary || "Research synthesis; see linked sources.";
    if (!sportId || !fileUrl) throw new Error(`Invalid research manifest entry for ${row.input}.`);
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error(`Could not fetch ${sportId} research file: ${response.status}.`);
    const sportRecords = JSON.parse(await response.text());
    if (!Array.isArray(sportRecords) || sportRecords.length !== 20) {
      throw new Error(`${sportId} must contain exactly 20 movement records.`);
    }
    records.push(...sportRecords.map((record) => normalizedRecord(record, sportId, sourceSummary)));
  }

  if (records.length !== 400) throw new Error(`Expected 400 movement records; received ${records.length}.`);
  const seen = new Set();
  for (const record of records) {
    const key = `${record.sportId}/${record.id}`;
    if (seen.has(key)) throw new Error(`Duplicate record key: ${key}.`);
    seen.add(key);
  }

  const file = `/**\n * Research-enriched sport movement profiles.\n * Each record contains phase-aware muscle roles, joint actions, exercise rationale, source links,\n * and a confidence label. Values support training decisions; they are not medical assessments.\n */\nexport type EnrichedSportMovement = {\n  id: string;\n  sportId: string;\n  label: string;\n  movementFamily: string;\n  bodyActions: string[];\n  jointActions: string[];\n  primeMovers: string[];\n  assistingMuscles: string[];\n  stabilizers: string[];\n  contractionRoles: string[];\n  commonForceOrSkillDemand: string;\n  recommendedExercisePatterns: string[];\n  recommendedExercises: string[];\n  transferRationale: string;\n  exerciseSelectionCautions: string;\n  evidenceConfidence: string;\n  sources: string[];\n  sourceSummary: string;\n};\n\nexport const enrichedSportMovements: EnrichedSportMovement[] = ${JSON.stringify(records, null, 2)} as const;\n\nexport const enrichedMovementById = new Map(enrichedSportMovements.map((movement) => [\`\${movement.sportId}/\${movement.id}\`, movement]));\n\nexport function getEnrichedMovement(sportId: string, movementId: string) {\n  return enrichedMovementById.get(\`\${sportId}/\${movementId}\`);\n}\n`;

  await mkdir(dirname(outputPath), { recursive: true });
  await mkdir(dirname(archivePath), { recursive: true });
  await writeFile(outputPath, file, "utf8");
  await writeFile(archivePath, JSON.stringify(records, null, 2), "utf8");
  console.log(`Consolidated ${records.length} enriched movement records across ${rows.length} sports.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
