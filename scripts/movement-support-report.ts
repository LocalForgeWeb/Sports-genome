/**
 * Regenerates the data sections of docs/movement-support/README.md from the code
 * that places exercises in movement support tiers (client/src/lib/movementSupport.ts).
 *
 *   npx tsx scripts/movement-support-report.ts
 *
 * Everything between the "generated" markers in the README is replaced; the method
 * text above them is written by hand. Run it after changing the catalog, the movement
 * records, the synonym list or BROAD_PATTERNS, and commit the result.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { exercises, type Exercise } from "../client/src/lib/exerciseCatalog";
import { enrichedSportMovements, getEnrichedMovement } from "../client/src/lib/enrichedSportMovementDatabase";
import { sportMovementProfiles, sportProfiles } from "../client/src/lib/sportMovementDatabase";
import { BROAD_PATTERNS, SAME_EXERCISE_SYNONYMS, getMovementSupport, movementMatchCount, nameContainsPhrase, normalizeExercisePhrase, type MovementSupport, type SupportRow } from "../client/src/lib/movementSupport";
import { catalogKeysForRecordMuscle } from "../client/src/lib/recordMuscleKeys";

const README = resolve(import.meta.dirname, "../docs/movement-support/README.md");
const START = "<!-- generated:start (scripts/movement-support-report.ts) -->";
const END = "<!-- generated:end -->";

const audited: [string, string][] = [["wrestling", "wrestling-19"], ["wrestling", "wrestling-1"], ["baseball", "baseball-4"]];
const cell = (value: string) => value.replace(/\|/g, "\\|");
const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]));
const patternCounts = new Map<string, number>();
exercises.forEach((exercise) => patternCounts.set(exercise.movement, (patternCounts.get(exercise.movement) ?? 0) + 1));

function rowsTable(rows: SupportRow[], withAnchorPattern = false): string {
  if (!rows.length) return "_None._\n";
  const head = withAnchorPattern ? "| Id | Exercise | Pattern | Why it appears |\n|---:|---|---|---|\n" : "| Id | Exercise | Why it appears |\n|---:|---|---|\n";
  return head + rows.map((row) => withAnchorPattern
    ? `| ${row.exercise.id} | ${cell(row.exercise.name)} | ${cell(row.exercise.movement)} | ${cell(row.reason)} |`
    : `| ${row.exercise.id} | ${cell(row.exercise.name)} | ${cell(row.reason)} |`).join("\n") + "\n";
}

function auditedSection(support: MovementSupport): string {
  const record = getEnrichedMovement(support.sportId, support.movementId)!;
  const lines = [
    `### ${support.sportLabel} · ${support.movementLabel} (\`${support.movementId}\`)`,
    "",
    `- Record: ${support.record ? `${support.record.confidence} confidence, ${support.record.sourceCount} sources` : "none"}.`,
    `- Named exercises, in record order: ${record.recommendedExercises.map((phrase) => `"${phrase}"`).join(", ")}.`,
    `- Prime movers: ${record.primeMovers.join(", ")} (catalog keys: ${support.primeMoverKeys.join(", ") || "none"}).`,
    `- Named exercises with no catalog match: ${support.unmatchedPhrases.length ? support.unmatchedPhrases.map((phrase) => `"${phrase}"`).join(", ") : "none"}.`,
    `- Counts: ${support.specific.length} movement-specific, ${support.related.length} related pattern (${movementMatchCount(support)} movement matches); ${support.muscle.length} muscle support, shown apart and not counted.`,
    "",
    `#### Movement-specific (${support.specific.length})`,
    "",
    rowsTable(support.specific, true),
    `#### Related pattern (${support.related.length})`,
    "",
    rowsTable(support.related, true),
    `<details><summary>Muscle support (${support.muscle.length}), shown collapsed and never counted as matches</summary>`,
    "",
    rowsTable(support.muscle),
    "</details>",
    "",
  ];
  return lines.join("\n");
}

function coverageSection(supports: MovementSupport[]): string {
  const total = supports.length;
  const count = (status: MovementSupport["status"]) => supports.filter((support) => support.status === status).length;
  const lines = [
    "## Coverage across all movements",
    "",
    `${total} sport movements. ${count("ok")} have at least one movement-specific match; ${count("no-named-matches")} have an enriched record that names nothing in the catalog; ${count("no-record")} have no enriched record. The last two show "Movement-specific matches aren't available yet".`,
    "",
    "| Sport | Movements | With movement-specific matches | Record names nothing in the catalog | No enriched record |",
    "|---|---:|---:|---:|---:|",
  ];
  for (const sport of sportProfiles) {
    const own = supports.filter((support) => support.sportId === sport.id);
    lines.push(`| ${sport.label} | ${own.length} | ${own.filter((s) => s.status === "ok").length} | ${own.filter((s) => s.status === "no-named-matches").length} | ${own.filter((s) => s.status === "no-record").length} |`);
  }
  const sizes = supports.filter((support) => support.status === "ok").map((support) => support.specific.length).sort((a, b) => a - b);
  const median = sizes[Math.floor(sizes.length / 2)];
  lines.push("", `Movement-specific matches per movement that has any: median ${median}, range ${sizes[0]} to ${sizes[sizes.length - 1]}.`, "");
  lines.push("Record names nothing in the catalog:", "");
  supports.filter((support) => support.status === "no-named-matches").forEach((support) => lines.push(`- ${support.sportLabel} · ${support.movementLabel} (\`${support.movementId}\`): ${support.unmatchedPhrases.map((phrase) => `"${phrase}"`).join(", ")}`));
  lines.push("", "No enriched record:", "");
  supports.filter((support) => support.status === "no-record").forEach((support) => lines.push(`- ${support.sportLabel} · ${support.movementLabel} (\`${support.movementId}\`)`));
  lines.push("");
  return lines.join("\n");
}

function unmatchedSection(supports: MovementSupport[]): string {
  const byPhrase = new Map<string, { text: string; movements: string[] }>();
  for (const support of supports) {
    for (const phrase of support.unmatchedPhrases) {
      const key = normalizeExercisePhrase(phrase);
      const entry = byPhrase.get(key) ?? { text: phrase, movements: [] };
      entry.movements.push(support.movementId);
      byPhrase.set(key, entry);
    }
  }
  const normalizedNames = exercises.map((exercise) => ({ exercise, name: normalizeExercisePhrase(exercise.name) }));
  const nearest = (key: string) => {
    const words = key.split(" ").filter((word) => word.length > 2);
    return normalizedNames.filter(({ name }) => words.length > 0 && words.every((word) => ` ${name} `.includes(` ${word} `))).map(({ exercise }) => `${exercise.name} (${exercise.id})`);
  };
  const entries = Array.from(byPhrase.entries()).sort((left, right) => right[1].movements.length - left[1].movements.length || left[0].localeCompare(right[0]));
  const lines = [
    "## Named exercises that resolve to nothing",
    "",
    `${entries.length} distinct phrases (after normalizing) that movement records name and no catalog exercise contains. They are listed for the owner to review: each is either an exercise the catalog lacks, or a name the catalog writes differently that could earn an entry in the synonym list. The last column lists catalog names that contain every word of the phrase (words of three letters or more). It is a review aid only; these exercises are **not** matched.`,
    "",
    "| Phrase (as first written) | Movements | Movement ids | Catalog names containing every word (not matched) |",
    "|---|---:|---|---|",
  ];
  for (const [key, entry] of entries) {
    const ids = entry.movements.length > 6 ? `${entry.movements.slice(0, 6).join(", ")} and ${entry.movements.length - 6} more` : entry.movements.join(", ");
    lines.push(`| ${cell(entry.text)} | ${entry.movements.length} | ${ids} | ${cell(nearest(key).slice(0, 4).join("; "))} |`);
  }
  lines.push("");
  return lines.join("\n");
}

function referenceSection(): string {
  const lines = [
    "## Reference lists",
    "",
    "### Same-exercise synonyms",
    "",
    "| Record phrase | Catalog name | Why it is the same exercise | Catalog exercises it reaches |",
    "|---|---|---|---|",
    ...SAME_EXERCISE_SYNONYMS.map((entry) => `| ${entry.phrase} | ${entry.sameAs} | ${cell(entry.why)} | ${exercises.filter((exercise) => nameContainsPhrase(exercise.name, entry.sameAs)).map((exercise) => `${exercise.name} (${exercise.id})`).join("; ")} |`),
    "",
    "### Broad patterns",
    "",
    "| Catalog pattern | Exercises |",
    "|---|---:|",
    ...BROAD_PATTERNS.map((pattern) => `| ${pattern} | ${patternCounts.get(pattern) ?? 0} |`),
    "",
    `The next largest pattern is ${Array.from(patternCounts).filter(([pattern]) => !BROAD_PATTERNS.includes(pattern)).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([pattern, count]) => `"${pattern}" (${count})`).join(", ")}.`,
    "",
  ];
  return lines.join("\n");
}

/** Observations about the data, each re-checked against the data so a fixed one drops out. */
function deficienciesSection(supports: MovementSupport[]): string {
  const lines = ["## Deficiencies noticed", "", "Recorded, not fixed: this correction does not edit the catalog or the movement records.", ""];

  lines.push("### Catalog: duplicate names", "");
  const byName = new Map<string, Exercise[]>();
  exercises.forEach((exercise) => byName.set(exercise.name, [...(byName.get(exercise.name) ?? []), exercise]));
  const duplicates = Array.from(byName.values()).filter((list) => list.length > 1);
  duplicates.forEach((list) => lines.push(`- "${list[0].name}" appears ${list.length} times: ${list.map((exercise) => `id ${exercise.id} (${exercise.category}, ${exercise.movement})`).join(" and ")}. Both copies are matched, so a movement that names it lists it twice.`));
  if (!duplicates.length) lines.push("- None.");
  lines.push("");

  lines.push("### Catalog: tags that do not fit the exercise", "", "The tiers read `movement` (pattern) and `primaryMuscles`, so these change results.", "");
  const checks: { id: number; holds: (exercise: Exercise) => boolean; note: string }[] = [
    { id: 249, holds: (e) => e.primaryMuscles.includes("chest") && e.movement === "Horizontal push", note: "an anti-rotation core exercise, tagged primary chest and the Horizontal push pattern" },
    { id: 223, holds: (e) => e.primaryMuscles.includes("chest") && e.movement === "Horizontal push", note: "a calf exercise, tagged primary chest and the Horizontal push pattern" },
    { id: 267, holds: (e) => e.primaryMuscles.includes("chest") && e.movement === "Horizontal push", note: "an anti-rotation press, tagged primary chest and the Horizontal push pattern" },
    { id: 105, holds: (e) => e.primaryMuscles.includes("chest") && e.movement === "Horizontal push", note: "an overhead press, tagged primary chest and the Horizontal push pattern" },
    { id: 110, holds: (e) => e.primaryMuscles.includes("chest") && e.movement === "Horizontal push", note: "an overhead press, tagged primary chest and the Horizontal push pattern" },
    { id: 172, holds: (e) => e.primaryMuscles.includes("glutes"), note: "a knee extension, tagged primary glutes (Leg Extension, 171, is quads only)" },
    { id: 232, holds: (e) => e.movement === "Grip isometric", note: "tagged Grip isometric while Hanging Leg Raise (231) is Trunk flexion / anti-extension" },
    { id: 282, holds: (e) => e.equipment === "Free weights", note: "a medicine-ball throw, tagged Free weights equipment" },
  ];
  for (const check of checks) {
    const exercise = byId.get(check.id);
    if (exercise && check.holds(exercise)) lines.push(`- ${exercise.name} (${exercise.id}): ${check.note}.`);
  }
  const landminePresses = exercises.filter((exercise) => nameContainsPhrase(exercise.name, "landmine press"));
  const landminePatterns = Array.from(new Set(landminePresses.map((exercise) => exercise.movement)));
  if (landminePatterns.length > 1) lines.push(`- The landmine presses are split across patterns: ${landminePatterns.map((pattern) => `${pattern} (${landminePresses.filter((exercise) => exercise.movement === pattern).map((exercise) => exercise.id).join(", ")})`).join(" and ")}. Diagonal push is not broad, so only the second group relates other exercises (cable incline presses, flys and punches for overhand throwing).`);
  const unilateral = [206, 161].map((id) => byId.get(id)!).filter((exercise) => exercise.qualities.includes("unilateral"));
  if (unilateral.length) lines.push(`- ${unilateral.map((exercise) => `${exercise.name} (${exercise.id})`).join(" and ")} carry the "unilateral" quality. Qualities are copied across catalog groups and are not used by the tiers.`);
  lines.push("");

  lines.push("### Movement records", "");
  const mismatched = sportMovementProfiles.filter((profile) => {
    const record = getEnrichedMovement(profile.sportId, profile.id);
    return record && record.label.toLowerCase() !== profile.label.toLowerCase();
  });
  mismatched.forEach((profile) => lines.push(`- ${profile.id}: the movement is "${profile.label}" but its enriched record is labelled "${getEnrichedMovement(profile.sportId, profile.id)!.label}". The tiers use the record and show the movement's label, so they may describe a different action.`));
  lines.push(`- ${supports.filter((support) => support.status === "no-record").length} movements have no enriched record (listed under coverage).`);
  const differing = enrichedSportMovements.filter((record) => JSON.stringify(record.recommendedExercises) !== JSON.stringify(record.recommendedExercisePatterns)).length;
  lines.push(`- ${differing} records keep a separate \`recommendedExercisePatterns\` list of pattern descriptions ("Hip-hinge power", "Sprint exposure"); the other ${enrichedSportMovements.length - differing} repeat \`recommendedExercises\` there. Only \`recommendedExercises\`, the named exercises, are matched.`);
  const notMuscles = new Map<string, number>();
  enrichedSportMovements.forEach((record) => record.primeMovers.flatMap((entry) => entry.split(",")).map((name) => name.trim().replace(/\.+$/, "").toLowerCase()).filter(Boolean).forEach((name) => {
    if (!catalogKeysForRecordMuscle(name).length) notMuscles.set(name, (notMuscles.get(name) ?? 0) + 1);
  }));
  lines.push(`- Prime-mover entries the shared muscle list maps to no catalog muscle key, so they cannot relate any exercise (some are joint actions, some are muscles the catalog has no key for): ${Array.from(notMuscles).sort((a, b) => b[1] - a[1]).map(([name, count]) => `"${name}"${count > 1 ? ` (${count})` : ""}`).join(", ")}.`);
  const primaryKeys = new Set(exercises.flatMap((exercise) => exercise.primaryMuscles));
  const unreachable = new Map<string, number>();
  supports.forEach((support) => support.primeMoverKeys.filter((key) => !primaryKeys.has(key)).forEach((key) => unreachable.set(key, (unreachable.get(key) ?? 0) + 1)));
  if (unreachable.size) lines.push(`- Prime-mover keys that no catalog exercise has as a primary muscle, so they never relate an exercise: ${Array.from(unreachable).map(([key, count]) => `\`${key}\` (a prime mover in ${count} movements)`).join(", ")}. Bridge's erector spinae is one: it maps to \`lowerBack\`, which the catalog only ever tags as a secondary muscle.`);
  lines.push("");

  lines.push("### Phrases the name rule stretches", "", "A phrase matches every catalog name that contains it as whole words, so short or generic phrases reach variants the record may not mean. Phrases reaching five or more exercises:", "");
  const phrases = new Map<string, { text: string; movements: number }>();
  enrichedSportMovements.forEach((record) => record.recommendedExercises.forEach((text) => {
    const key = normalizeExercisePhrase(text);
    phrases.set(key, { text: phrases.get(key)?.text ?? text, movements: (phrases.get(key)?.movements ?? 0) + 1 });
  }));
  Array.from(phrases.values())
    .map((entry) => ({ ...entry, hits: exercises.filter((exercise) => nameContainsPhrase(exercise.name, entry.text)) }))
    .filter((entry) => entry.hits.length >= 5)
    .sort((left, right) => right.hits.length - left.hits.length)
    .forEach((entry) => lines.push(`- "${entry.text}" (${entry.movements} movement${entry.movements === 1 ? "" : "s"}) reaches ${entry.hits.length}: ${entry.hits.map((exercise) => exercise.name).join("; ")}.`));
  // Read by hand from the lists above; each is re-checked so a catalog change drops it.
  const differentExercise: [string, string][] = [["leg press", "Leg-Press Calf Raise"], ["row", "Cable Upright Row"], ["push-up", "Handstand Push-Up"], ["split squat", "Split-Squat Jump"], ["cable press", "Cable Press-Out"], ["plank", "Side Plank Hip Adduction"]];
  const stillTrue = differentExercise.filter(([phrase, name]) => phrases.has(normalizeExercisePhrase(phrase)) && exercises.some((exercise) => exercise.name === name && nameContainsPhrase(exercise.name, phrase)));
  if (stillTrue.length) lines.push("", `Matches that are a different exercise from the one named: ${stillTrue.map(([phrase, name]) => `"${phrase}" reaches ${name}`).join("; ")}.`);
  lines.push("");
  return lines.join("\n");
}

const supports = sportMovementProfiles.map((profile) => getMovementSupport(profile.sportId, profile.id));
const generated = [
  START,
  "",
  "## Audited movements",
  "",
  ...audited.map(([sportId, movementId]) => auditedSection(getMovementSupport(sportId, movementId))),
  coverageSection(supports),
  unmatchedSection(supports),
  referenceSection(),
  deficienciesSection(supports),
  END,
].join("\n");

const current = readFileSync(README, "utf8");
const start = current.indexOf(START);
const end = current.indexOf(END);
if (start < 0 || end < 0) throw new Error(`README needs the markers ${START} and ${END}`);
writeFileSync(README, `${current.slice(0, start)}${generated}${current.slice(end + END.length)}`);
console.log(`wrote ${README}`);
