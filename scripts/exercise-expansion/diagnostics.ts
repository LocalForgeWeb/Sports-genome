/**
 * Regenerates docs/exercise-expansion-v1/diagnostics.json from the application's own functions
 * (50-exercise brief §9, §11): nothing in it is typed by hand.
 *
 *   npx tsx scripts/exercise-expansion/diagnostics.ts
 *
 * For every expansion record (ids 401-450) it exports the catalog fields, the stated descriptor
 * inputs, the eight fingerprint values with the predicates behind them, every genome mechanics
 * field, each muscle's ten targeting factors and derived profile, similarity to its closest and to
 * deliberately unrelated records, context scores, the three coverage numbers, movement-support
 * tiers, measurement and load semantics, media, and the validator's verdict. It ends with the
 * brief's synthetic fixtures, computed the same way. Field origins come from evidence.json.
 * Run it after any catalog, descriptor or engine change and commit the result.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { exercises, type Exercise } from "../../client/src/lib/exerciseCatalog";
import { analyzeExerciseContext, buildExerciseGenome, exerciseSimilarity, fingerprintPredicatesFor, genomeTaskPredicatesFor, EXERCISE_GENOME_REVISION } from "../../client/src/lib/exerciseGenome";
import { MUSCLE_TARGETING_REVISION, targetingPredicatesFor } from "../../client/src/lib/muscleTargetingModel";
import { descriptorFor } from "../../client/src/lib/exerciseDescriptors";
import { analyzeSplitStack, coveragePoints, COVERAGE_TARGET_REVISION } from "../../client/src/lib/splitStackAnalysis";
import { analyzeWholeStackMuscles } from "../../client/src/lib/stackMuscleAnalysis";
import { getSessionMuscleVolume } from "../../client/src/lib/sessionVolume";
import { analyzeWeek, commonMovements, WEEK_REVIEW_REVISION } from "../../client/src/lib/weekReview";
import { buildDaySlots } from "../../client/src/lib/trainingDayPlan";
import { splitDaysForFrequency } from "../../client/src/lib/splitCycle";
import { matchesTrainingSplit, type TrainingSplit } from "../../client/src/lib/splitAssignment";
import { qualityToDemand } from "../../client/src/lib/stackQualityCoverage";
import { enrichedSportMovements } from "../../client/src/lib/enrichedSportMovementDatabase";
import { getMovementSupport } from "../../client/src/lib/movementSupport";
import { exercisePhotoSet } from "../../client/src/lib/exercisePhotos";
import { setCountFieldFor, setEntryFieldsFor } from "../../client/src/lib/setEntryFields";
import { getGoalPrescription } from "../../client/src/lib/workoutPlanner";
import { validateExpansion } from "../../client/src/lib/exerciseExpansionValidator";
import { performedSetLine, setVolume, totalReps } from "../../client/src/lib/dropSets";
import { loadConventionFor } from "../../shared/loadConventions";
import { measurementFor } from "../../shared/exerciseMeasurement";
import { catalogMuscleRegionIds } from "../../shared/strengthGenomeDefinitions";

const root = resolve(import.meta.dirname, "../..");
const out = resolve(root, "docs/exercise-expansion-v1/diagnostics.json");
const evidencePath = resolve(root, "docs/exercise-expansion-v1/evidence.json");
const evidence = existsSync(evidencePath) ? JSON.parse(readFileSync(evidencePath, "utf8")) as { candidates?: Record<string, { fieldOrigins?: Record<string, string> }> } : {};

const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]));
const added = exercises.filter((exercise) => exercise.id >= 401);
const legacy = exercises.filter((exercise) => exercise.id <= 400);
const splits: TrainingSplit[] = ["Push", "Pull", "Legs", "Upper", "Lower", "Full Body", "Sport Transfer"];
const slots = buildDaySlots(splitDaysForFrequency(5));
const upperSlot = slots.find((slot) => slot.day === "Upper") ?? slots[0];

/** Fixed, deliberately unrelated probes: a press, a calf raise and a crunch. */
const probes = [1, 221, 239].map((id) => byId.get(id)!);

/** Movement support across every record: how often the exercise is placed in each tier. */
const supportCounts = new Map<number, { specific: string[]; related: string[]; muscle: number }>();
for (const record of enrichedSportMovements) {
  const support = getMovementSupport(record.sportId, record.id);
  for (const tier of ["specific", "related"] as const) for (const row of support[tier]) {
    if (row.exercise.id < 401) continue;
    const entry = supportCounts.get(row.exercise.id) ?? { specific: [], related: [], muscle: 0 };
    entry[tier].push(`${record.sportId}/${record.id}`);
    supportCounts.set(row.exercise.id, entry);
  }
  for (const row of support.muscle) {
    if (row.exercise.id < 401) continue;
    const entry = supportCounts.get(row.exercise.id) ?? { specific: [], related: [], muscle: 0 };
    entry.muscle += 1;
    supportCounts.set(row.exercise.id, entry);
  }
}

function diagnostics(exercise: Exercise) {
  const descriptor = descriptorFor(exercise.id)!;
  const genome = buildExerciseGenome(exercise);
  const measurement = measurementFor(exercise.id);
  const nearest = legacy
    .map((other) => ({ id: other.id, name: other.name, similarity: exerciseSimilarity(exercise, other) }))
    .sort((a, b) => b.similarity - a.similarity || a.id - b.id)
    .slice(0, 3);
  const prescription = getGoalPrescription("Athleticism", 2, exercise);
  const week = analyzeWeek({ slots, plan: { [upperSlot.key]: [exercise] }, prescriptions: { [upperSlot.key]: { [exercise.id]: prescription } }, goal: "Athleticism", catalog: exercises });
  const homeSplit = splits.find((split) => matchesTrainingSplit(exercise, split)) ?? "Full Body";
  const support = supportCounts.get(exercise.id) ?? { specific: [], related: [], muscle: 0 };
  const photos = exercisePhotoSet(exercise.id);
  return {
    id: exercise.id,
    candidate: descriptor.candidate,
    requestedName: descriptor.requestedName,
    catalog: exercise,
    descriptor,
    fieldOrigins: evidence.candidates?.[descriptor.candidate]?.fieldOrigins ?? "pending: evidence.json has no entry for this candidate",
    fingerprint: { values: genome.fingerprint, predicates: fingerprintPredicatesFor(exercise), taskPredicates: genomeTaskPredicatesFor(exercise) },
    mechanics: {
      movementPatterns: genome.movementPatterns, jointActions: genome.jointActions, forceDirection: genome.forceDirection, chain: genome.chain, stance: genome.stance,
      resistanceProfile: genome.resistanceProfile, fatigue: genome.fatigue, practicality: genome.practicality, adaptation: genome.adaptation, evidence: genome.evidence,
      study: genome.studyCalibration ? { key: genome.studyCalibration.key, kind: genome.studyCalibration.kind, rangeOfMotion: genome.studyCalibration.rangeOfMotion, planningBoundary: genome.studyCalibration.planningBoundary, sources: genome.studyCalibration.sources } : null,
    },
    targetingInputs: targetingPredicatesFor(exercise),
    muscles: genome.muscleProfile.map((entry) => ({
      muscle: entry.muscle, anatomicalLabel: entry.anatomicalLabel, role: entry.role, contribution: entry.contribution, tier: entry.tier,
      mechanicalLoading: entry.mechanicalLoading, longLengthLoading: entry.longLengthLoading, peakContraction: entry.peakContraction,
      stabilizationDemand: entry.stabilizationDemand, fatigueContribution: entry.fatigueContribution,
      evidenceTier: entry.targeting.evidenceTier, directEvidence: Boolean(entry.targeting.directEvidenceNote),
      factors: entry.targeting.mechanicsFactors.map((factor) => ({ id: factor.id, rankingInfluence: factor.rankingInfluence, status: factor.status })),
      strengthRegion: catalogMuscleRegionIds[entry.muscle] ?? null,
    })),
    similarity: { nearest, unrelated: probes.map((other) => ({ id: other.id, name: other.name, similarity: exerciseSimilarity(exercise, other) })) },
    context: {
      emptyStack: analyzeExerciseContext(exercise, { goal: "Athleticism", currentWorkout: [] }),
      withNearest: analyzeExerciseContext(exercise, { goal: "Athleticism", currentWorkout: nearest.map((item) => byId.get(item.id)!) }),
    },
    coverage: {
      splitTagPoints: Object.fromEntries([...exercise.primaryMuscles, ...exercise.secondaryMuscles].map((muscle) => [muscle, coveragePoints(exercise, muscle)])),
      homeSplit,
      splitAnalysis: analyzeSplitStack([exercise], exercises, homeSplit).ratings.filter((rating) => rating.rawScore > 0),
      stackInvolvement: analyzeWholeStackMuscles([exercise]),
      sessionExposure: getSessionMuscleVolume([exercise], () => 3),
      week: { prescription, muscles: week.muscles.filter((muscle) => muscle.total > 0).map((muscle) => ({ key: muscle.key, label: muscle.label, direct: muscle.direct, supporting: muscle.supporting, supportingPerformed: muscle.supportingPerformed, total: muscle.total, figureKeys: muscle.figureKeys })), patterns: week.patterns.map((pattern) => pattern.movement) },
      qualityDemands: exercise.qualities.map((quality) => ({ quality, demand: qualityToDemand[quality] ?? null })),
    },
    movementSupport: { specific: support.specific.length, related: support.related.length, muscleSupport: support.muscle, specificIn: support.specific.slice(0, 12), relatedIn: support.related.slice(0, 12) },
    recording: {
      measurement, loadConvention: loadConventionFor(exercise.id),
      entryFields: setEntryFieldsFor(exercise, "lb").map((field) => ({ measure: field.measure, label: field.label, unit: field.unit, optional: field.optional })),
      countField: setCountFieldFor(exercise),
      defaultPrescription: prescription,
    },
    media: photos ? { status: "exact-variation photo", source: photos.source, captions: photos.captions, size: [photos.width, photos.height] } : { status: "missing: equipment placeholder shown", source: null },
  };
}

/** The brief's §12 numerical fixtures, computed by the same functions the app uses. */
function fixtures() {
  const name = (value: string) => exercises.find((exercise) => exercise.name === value)!;
  const carry = name("Single-Arm Kettlebell Overhead Carry");
  const neck = name("Neck Extension Machine");
  const week = analyzeWeek({ slots, plan: { [upperSlot.key]: [carry, neck] }, prescriptions: { [upperSlot.key]: { [carry.id]: "3 × 20 m", [neck.id]: "4 × 12" } }, goal: "Athleticism", catalog: exercises });
  const traps = week.muscles.find((muscle) => muscle.key === "traps")!;
  const drop = { id: "set-1", type: "drop" as const, weight: "100", reps: "5", unit: "lb" as const, completed: true, stages: [
    { id: "s1", weight: "100", reps: "5", unit: "lb" as const }, { id: "s2", weight: "70", reps: "6", unit: "lb" as const }, { id: "s3", weight: "50", reps: "10", unit: "lb" as const },
  ] };
  const zercher = name("Zercher Deadlift");
  return {
    directPlusSupporting: { exercises: [carry.name, neck.name], sets: "3 direct + 4 supporting", traps: { direct: traps.direct, supporting: traps.supporting, total: traps.total, supportingPerformed: traps.supportingPerformed } },
    dropSet: { exercise: zercher.name, line: performedSetLine(drop, "lb", loadConventionFor(zercher.id)), totalReps: totalReps(drop), volume: setVolume(drop, "lb", loadConventionFor(zercher.id)) },
    timedSet: performedSetLine({ weight: "", reps: "", seconds: "20", side: "left", completed: true }, "lb", loadConventionFor(name("Isometric Neck Lateral Flexion").id)),
    carrySet: performedSetLine({ weight: "24", unit: "kg", reps: "", distance: "30", distanceUnit: "m", side: "left", completed: true }, "kg", loadConventionFor(name("Suitcase Carry").id)),
    assistedSet: performedSetLine({ weight: "40", unit: "lb", reps: "8", completed: true }, "lb", loadConventionFor(name("Assisted Pull-Up Machine").id)),
    commonMovementsUnchanged: [...commonMovements(exercises)].sort().join("|") === [...commonMovements(legacy)].sort().join("|"),
  };
}

const errors = validateExpansion();
const report = {
  generatedBy: "scripts/exercise-expansion/diagnostics.ts",
  revisions: { genome: EXERCISE_GENOME_REVISION, targeting: MUSCLE_TARGETING_REVISION, weekReview: WEEK_REVIEW_REVISION, splitTargets: COVERAGE_TARGET_REVISION },
  validator: { errors: errors.length, detail: errors },
  exercises: added.map(diagnostics),
  fixtures: fixtures(),
};
writeFileSync(out, JSON.stringify(report, null, 1) + "\n");
console.log(`${report.exercises.length} exercises, ${errors.length} validator errors -> ${out}`);
