/**
 * The all-candidate validator for the 50-exercise expansion (brief §9, §12).
 *
 * Every required input of a record is checked against the consumers that read it, and each
 * failure is returned as an error naming the candidate, the field and why - never a console
 * warning. `exerciseExpansion.validator.test.ts` requires the list to be empty, and the
 * diagnostics script writes it into docs/exercise-expansion-v1/diagnostics.json.
 */
import { exercises, type Exercise, type Grade, type Sport } from "./exerciseCatalog";
import { descriptorFor, describedExerciseIds } from "./exerciseDescriptors";
import { studyCalibrationKeys } from "./exerciseStudyCalibration";
import { buildExerciseGenome } from "./exerciseGenome";
import { catalogEquipment } from "./equipmentProfile";
import { matchesTrainingSplit, type TrainingSplit } from "./splitAssignment";
import { qualityToDemand, unmappedQualities } from "./stackQualityCoverage";
import { regionKeysForValue } from "./anatomyRegions";
import { displayNames } from "./weeklyVolume";
import { catalogMuscleRegionIds } from "@shared/strengthGenomeDefinitions";
import { expansionLoadConventions, type LoadConvention } from "@shared/loadConventions";
import { explicitMeasurementIds, measurementFor, type MeasurementMode } from "@shared/exerciseMeasurement";

export const EXPANSION_FIRST_ID = 401;
export const EXPANSION_LAST_ID = 450;

export type ExpansionError = { id: number; candidate: string; field: string; problem: string };

const grades: readonly Grade[] = ["F", "D", "C", "B", "A", "S", "SS"];
const sports: readonly Sport[] = ["tennis", "basketball", "soccer", "baseball", "combat"];
const splits: readonly TrainingSplit[] = ["Push", "Pull", "Legs", "Upper", "Lower", "Full Body", "Sport Transfer"];
const recognisedQualities = new Set<string>([...Object.keys(qualityToDemand), ...unmappedQualities]);

/** Which load conventions each measurement mode may be logged under; anything else is a contradiction. */
const conventionsForMode: Record<MeasurementMode, readonly LoadConvention[]> = {
  load_reps: ["total_external_load", "per_implement", "machine_displayed_load", "per_hand"],
  reps_only: ["bodyweight_reps"],
  setting_reps: ["resistance_setting"],
  assisted_reps: ["assistance"],
  duration: ["no_external_load"],
  load_duration: ["total_external_load", "per_hand", "per_implement"],
  load_distance: ["total_external_load", "per_hand", "per_implement"],
};

/** The patterns the original rule derives from quality tags, which a stated pattern list must keep. */
const qualityPatterns: Record<string, string> = { bracing: "Anti-movement bracing", antiRotation: "Anti-movement bracing", locomotion: "Locomotion", power: "Power expression", jumping: "Jump / landing" };

export function validateExpansionRecord(exercise: Exercise, catalog: readonly Exercise[] = exercises): ExpansionError[] {
  const descriptor = descriptorFor(exercise.id);
  const candidate = descriptor?.candidate ?? `id ${exercise.id}`;
  const errors: ExpansionError[] = [];
  const fail = (field: string, problem: string) => errors.push({ id: exercise.id, candidate, field, problem });

  if (!descriptor) { fail("descriptor", "no reviewed descriptor; the engines would fall back to name inference"); return errors; }
  if (!exercise.name.trim()) fail("name", "empty");
  const sameName = catalog.filter((other) => other.id !== exercise.id && other.name.trim().toLowerCase() === exercise.name.trim().toLowerCase());
  if (sameName.length) fail("name", `duplicates ${sameName.map((other) => other.id).join(", ")}`);

  // Muscles: unique, disjoint, and known to every vocabulary that reads them.
  const muscles = [...exercise.primaryMuscles, ...exercise.secondaryMuscles];
  if (!exercise.primaryMuscles.length) fail("primaryMuscles", "none");
  if (new Set(exercise.primaryMuscles).size !== exercise.primaryMuscles.length) fail("primaryMuscles", "repeats a key");
  if (new Set(exercise.secondaryMuscles).size !== exercise.secondaryMuscles.length) fail("secondaryMuscles", "repeats a key");
  exercise.secondaryMuscles.filter((muscle) => exercise.primaryMuscles.includes(muscle)).forEach((muscle) => fail("secondaryMuscles", `${muscle} is also primary`));
  muscles.forEach((muscle) => {
    if (!displayNames[muscle]) fail(`muscle ${muscle}`, "no week-review label");
    if (!regionKeysForValue(muscle).length) fail(`muscle ${muscle}`, "no figure region");
    if (!catalogMuscleRegionIds[muscle]) fail(`muscle ${muscle}`, "no strength region");
    if (!descriptor.anatomy[muscle]) fail(`descriptor.anatomy.${muscle}`, "no named muscles for this key");
  });
  Object.keys(descriptor.anatomy).filter((key) => !muscles.includes(key)).forEach((key) => fail(`descriptor.anatomy.${key}`, "names a key the record does not tag"));
  descriptor.stabilizers.filter((key) => !exercise.secondaryMuscles.includes(key)).forEach((key) => fail("descriptor.stabilizers", `${key} is not a supporting muscle`));

  // Taxonomy every consumer reads.
  exercise.qualities.filter((quality) => !recognisedQualities.has(quality)).forEach((quality) => fail("qualities", `unrecognised tag ${quality}`));
  if (new Set(exercise.qualities).size !== exercise.qualities.length) fail("qualities", "repeats a tag");
  if (!(catalogEquipment as readonly string[]).includes(exercise.equipment)) fail("equipment", `${exercise.equipment} is not an access option`);
  if (!splits.some((split) => matchesTrainingSplit(exercise, split))) fail("category", `${exercise.category} reaches no training split`);
  if (!exercise.movement.trim()) fail("movement", "empty");
  if (!grades.includes(exercise.muscleGrade)) fail("muscleGrade", exercise.muscleGrade);
  sports.forEach((sport) => {
    const fit = exercise.sportFit[sport];
    if (!fit || !grades.includes(fit.grade) || !fit.movementHelp.trim()) fail(`sportFit.${sport}`, "missing grade or help text");
  });

  // Descriptor fields the engines read.
  if (!descriptor.setup.trim() || !descriptor.entryNote.trim() || !descriptor.distinctFrom.trim()) fail("descriptor", "setup, entry note and distinction are all required");
  if (!descriptor.movementPatterns.length) fail("descriptor.movementPatterns", "none");
  if (!descriptor.jointActions.length) fail("descriptor.jointActions", "none");
  exercise.qualities.forEach((quality) => {
    const pattern = qualityPatterns[quality];
    if (pattern && !descriptor.movementPatterns.includes(pattern)) fail("descriptor.movementPatterns", `the ${quality} tag implies ${pattern}`);
  });
  if (descriptor.movementPatterns.includes("Crawling")) fail("descriptor.movementPatterns", "no expansion record crawls");
  if (descriptor.studyKey !== null && !studyCalibrationKeys().includes(descriptor.studyKey)) fail("descriptor.studyKey", `${descriptor.studyKey} is not a calibration record`);
  if (descriptor.studyQualification && !descriptor.studyKey) fail("descriptor.studyQualification", "qualifies no study");
  const { curve, bias } = descriptor.resistance;
  if (curve.length && curve.length !== 5) fail("descriptor.resistance.curve", "five points or none");
  if (!curve.length && !["Isometric", "Not established", "Lengthened"].includes(bias)) fail("descriptor.resistance", `an empty curve needs a stated reason, not ${bias}`);
  if (descriptor.fingerprint.unilateral !== descriptor.targeting.unilateral) fail("descriptor", "fingerprint and targeting disagree on unilateral");
  if (descriptor.fingerprint.ballistic !== descriptor.targeting.ballistic) fail("descriptor", "fingerprint and targeting disagree on ballistic");
  if (descriptor.fingerprint.machine !== (exercise.equipment === "Machine")) fail("descriptor.fingerprint.machine", "must match the equipment");

  // Recording: an explicit measurement and convention that agree.
  const measurement = measurementFor(exercise.id);
  const convention = expansionLoadConventions().get(exercise.id);
  if (!measurement.explicit) fail("measurement", "not classified");
  if (!convention) fail("loadConvention", "not classified; it would default to total external load");
  else if (!conventionsForMode[measurement.mode].includes(convention)) fail("loadConvention", `${convention} contradicts ${measurement.mode}`);
  if (!measurement.e1rmEligible && !measurement.e1rmReason) fail("measurement.e1rmReason", "ineligible without a reason");
  if (measurement.laterality === "per_side" && descriptor.stance !== "Unilateral" && descriptor.stance !== "Mixed") fail("descriptor.stance", "a per-side exercise is not bilateral");

  // Every number the genome produces is finite and on its scale.
  const genome = buildExerciseGenome(exercise);
  Object.entries(genome.fingerprint).forEach(([dimension, value]) => { if (!Number.isFinite(value) || value < 0 || value > 100) fail(`fingerprint.${dimension}`, String(value)); });
  if (genome.muscleProfile.length !== new Set(muscles).size) fail("muscleProfile", "does not cover every tagged muscle");
  genome.muscleProfile.forEach((entry) => {
    [entry.contribution, entry.mechanicalLoading, entry.longLengthLoading, entry.peakContraction, entry.stabilizationDemand, entry.fatigueContribution].forEach((value) => { if (!Number.isFinite(value)) fail(`muscleProfile.${entry.muscle}`, "non-finite"); });
    if (entry.targeting.mechanicsFactors.length !== 10) fail(`muscleProfile.${entry.muscle}`, "not ten mechanics factors");
  });
  return errors;
}

/** Every expansion record, plus the ledger checks across all of them. */
export function validateExpansion(catalog: readonly Exercise[] = exercises): ExpansionError[] {
  const errors: ExpansionError[] = [];
  const expected = Array.from({ length: EXPANSION_LAST_ID - EXPANSION_FIRST_ID + 1 }, (_, index) => EXPANSION_FIRST_ID + index);
  const present = catalog.filter((exercise) => exercise.id >= EXPANSION_FIRST_ID);
  expected.filter((id) => !present.some((exercise) => exercise.id === id)).forEach((id) => errors.push({ id, candidate: `E${String(id - 400).padStart(2, "0")}`, field: "id", problem: "missing from the catalog" }));
  present.filter((exercise) => exercise.id > EXPANSION_LAST_ID).forEach((exercise) => errors.push({ id: exercise.id, candidate: "-", field: "id", problem: "outside the expansion range" }));
  if (new Set(catalog.map((exercise) => exercise.id)).size !== catalog.length) errors.push({ id: 0, candidate: "-", field: "id", problem: "catalog ids are not unique" });
  const described = new Set(describedExerciseIds());
  expected.filter((id) => !described.has(id)).forEach((id) => errors.push({ id, candidate: `E${String(id - 400).padStart(2, "0")}`, field: "descriptor", problem: "missing" }));
  const measured = new Set(explicitMeasurementIds());
  expected.filter((id) => !measured.has(id)).forEach((id) => errors.push({ id, candidate: `E${String(id - 400).padStart(2, "0")}`, field: "measurement", problem: "missing" }));
  // Candidate numbers and ids agree, so the ledger can be read either way.
  present.forEach((exercise) => {
    const descriptor = descriptorFor(exercise.id);
    if (descriptor && descriptor.candidate !== `E${String(exercise.id - 400).padStart(2, "0")}`) errors.push({ id: exercise.id, candidate: descriptor.candidate, field: "candidate", problem: "does not match the id" });
  });
  present.forEach((exercise) => errors.push(...validateExpansionRecord(exercise, catalog)));
  return errors;
}
