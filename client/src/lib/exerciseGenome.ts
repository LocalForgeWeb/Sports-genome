/** Exercise Genome: intrinsic exercise vectors plus transparent contextual utility, redundancy, and marginal-value analysis. */
import { exercises, type Exercise, type Grade } from "@/lib/exerciseCatalog";
import { getExerciseStudyCalibration, type ExerciseStudyCalibration } from "@/lib/exerciseStudyCalibration";
import { buildMuscleTargetingEstimate, type MuscleTargetingEstimate } from "@/lib/muscleTargetingModel";
import type { SportMovementProfile } from "@/lib/sportMovementDatabase";
import { logicCalibration } from "@/lib/evidenceTraceability";
import { descriptorFor, type FingerprintPredicates, type GenomeTaskPredicates, type ResistanceBias } from "@/lib/exerciseDescriptors";

/**
 * Model revision. v2 (50-exercise brief, 6 Oct 2026): force direction and stance read the
 * movement patterns case-insensitively (they were title case against lowercase rules, so no
 * squat, hinge, carry or rotation ever reached its branch); "bear" alone no longer means Crawling;
 * a neck extension is not given the triceps-extension "shortened" curve; expansion records read
 * their stated descriptors instead of their names; an unestablished resistance profile is left
 * out of similarity rather than counted as a mismatch; and the evidence line separates the
 * model's own confidence from the strength of any study behind it.
 * Before/after for the original 400: docs/exercise-expansion-v1/genome-v2-deltas.json.
 */
export const EXERCISE_GENOME_REVISION = "exercise_genome_v2";

export type GenomeDimension = "hypertrophy" | "strength" | "power" | "stability" | "mobility" | "sfr" | "skill" | "practicality";
export type EvidenceQuality = "Moderate — biomechanical inference" | "Established — movement mechanics" | "Context-sensitive — coaching inference";

export interface MuscleGenomeEntry {
  muscle: string;
  anatomicalLabel: string;
  role: "Prime mover" | "Synergist" | "Stabilizer";
  contribution: number;
  mechanicalLoading: number;
  longLengthLoading: number;
  peakContraction: number;
  stabilizationDemand: number;
  fatigueContribution: number;
  tier: Exclude<Grade, "SS">;
  why: string;
  targeting: MuscleTargetingEstimate;
}

export interface ExerciseGenome {
  exerciseId: number;
  fingerprint: Record<GenomeDimension, number>;
  muscleProfile: MuscleGenomeEntry[];
  movementPatterns: string[];
  jointActions: string[];
  forceDirection: string;
  chain: "Open" | "Closed" | "Mixed";
  stance: "Bilateral" | "Unilateral" | "Mixed";
  /** `curve` is empty where no repetition curve applies (a hold) or none is established (bias says which). */
  resistanceProfile: { bias: ResistanceBias; stickingRegion: string; peakRegion: string; curve: number[] };
  fatigue: { local: number; systemic: number; grip: number; axial: number; technical: number };
  practicality: { setup: number; space: number; accessibility: number; homeGym: number; supersetEase: number };
  adaptation: { primary: string[]; secondary: string[]; rationale: string };
  /**
   * `confidence` is the model's confidence in its own inference rules for this kind of movement
   * (lower for high-skill, technique-dependent lifts). It says nothing about research behind the
   * exercise; `sourceStrength` does, from the study context actually attached.
   */
  evidence: { quality: EvidenceQuality; confidence: "High" | "Moderate"; sourceStrength: "Direct longitudinal study attached" | "Mechanics or transfer context attached" | "No study attached"; note: string };
  studyCalibration: ExerciseStudyCalibration | null;
}

export interface GenomeContext {
  goal: string;
  currentWorkout: Exercise[];
  /** The sport action in view. The panel shows its movement support tier (lib/movementSupport); no score here reads it. */
  sportMovement?: SportMovementProfile;
}

export interface GenomeContextAnalysis {
  contextualScore: number;
  grade: Grade;
  marginalValue: number;
  redundancy: number;
  signals: { goalAlignment: number; stackDistinctness: number; recoveryManageability: number };
  explanation: string;
  strengths: string[];
  limits: string[];
}

const clamp = (value: number) => Math.max(logicCalibration.exerciseGenome.relativeScaleMinimum, Math.min(logicCalibration.exerciseGenome.relativeScaleMaximum, Math.round(value)));
const tierFor = (value: number): Exclude<Grade, "SS"> => value >= logicCalibration.exerciseGenome.roleTierS ? "S" : value >= logicCalibration.exerciseGenome.roleTierA ? "A" : value >= logicCalibration.exerciseGenome.roleTierB ? "B" : value >= logicCalibration.exerciseGenome.roleTierC ? "C" : "D";
const gradeFor = (value: number): Grade => value >= logicCalibration.exerciseGenome.contextualGradeSS ? "SS" : value >= logicCalibration.exerciseGenome.contextualGradeS ? "S" : value >= logicCalibration.exerciseGenome.contextualGradeA ? "A" : value >= logicCalibration.exerciseGenome.contextualGradeB ? "B" : value >= logicCalibration.exerciseGenome.contextualGradeC ? "C" : value >= logicCalibration.exerciseGenome.contextualGradeD ? "D" : "F";

const anatomicalLabels: Record<string, string> = {
  chest: "Pectoralis major", frontDelts: "Anterior deltoid", sideDelts: "Lateral deltoid", rearDelts: "Posterior deltoid", shoulders: "Deltoid complex",
  triceps: "Triceps brachii", biceps: "Biceps brachii", brachialis: "Brachialis", forearms: "Forearm flexors / extensors", abs: "Rectus abdominis", obliques: "Internal / external obliques",
  lats: "Latissimus dorsi", upperBack: "Rhomboids / middle trapezius", traps: "Trapezius", lowerBack: "Spinal erectors", rotatorCuff: "Rotator cuff",
  neckFlexors: "Sternocleidomastoid / deep neck flexors", neckExtensors: "Splenius / semispinalis / neck extensors", hipFlexors: "Iliopsoas", serratusAnterior: "Serratus anterior",
  glutes: "Gluteus maximus", quads: "Quadriceps", hamstrings: "Hamstrings", calves: "Gastrocnemius / soleus", tibialis: "Tibialis anterior", adductors: "Hip adductors", abductors: "Gluteus medius / abductors",
};

const qualityValue = (exercise: Exercise, quality: string, present: number, absent: number) => exercise.qualities.includes(quality) ? present : absent;
const lower = (exercise: Exercise) => `${exercise.name} ${exercise.category} ${exercise.movement} ${exercise.equipment}`.toLowerCase();
const includes = (exercise: Exercise, expression: RegExp) => expression.test(lower(exercise));

/**
 * The predicates the fingerprint formula reads. An expansion record states them in its
 * descriptor; an original record has them read from its text by the rules the model has always
 * used. Exported so the diagnostics can show which predicates produced each number.
 */
export function fingerprintPredicatesFor(exercise: Exercise): FingerprintPredicates {
  const stated = descriptorFor(exercise.id)?.fingerprint;
  if (stated) return stated;
  const text = lower(exercise);
  return {
    freeWeight: /barbell|dumbbell|kettlebell|sandbag|bodyweight/.test(text),
    unilateral: /single|one-arm|one arm|split|lunge|step-up|bulgarian/.test(text) || exercise.qualities.includes("unilateral"),
    ballistic: /jump|throw|clean|snatch|plyometric|explosive|sprint/.test(text) || exercise.qualities.includes("power"),
    complex: /clean|snatch|turkish|get-up|pistol|muscle-up|handstand/.test(text),
    machine: exercise.equipment === "Machine",
    isolation: /fly|curl|extension|raise|leg curl/.test(text),
    strengthPattern: /barbell|trap bar|deadlift|squat|press/.test(text),
    deepRange: /overhead|deep|cossack|pullover|lunge|split squat/.test(text),
    axialPattern: /deadlift|squat|good morning|clean|snatch/.test(text),
    rackCost: /barbell|rack|sled/.test(text),
  };
}

/** The predicates the genome's grip, axial, space and home-gym fields read; stated or read the same way. */
export function genomeTaskPredicatesFor(exercise: Exercise): GenomeTaskPredicates {
  const stated = descriptorFor(exercise.id)?.task;
  if (stated) return stated;
  const text = lower(exercise);
  return {
    gripTask: /carry|deadlift|row|pull|farmer|hang/.test(text),
    axialTask: /squat|deadlift|good morning|carry|overhead/.test(text),
    needsSpace: /carry|sled|sprint/.test(text),
    specialistEquipment: /machine|sled/.test(text),
  };
}

function getMovementPatterns(exercise: Exercise) {
  const stated = descriptorFor(exercise.id)?.movementPatterns;
  if (stated) return [...stated];
  const text = lower(exercise);
  const patterns = new Set<string>();
  const movement = exercise.movement.toLowerCase();
  if (movement.includes("horizontal push")) patterns.add("Horizontal push");
  if (movement.includes("vertical push")) patterns.add("Vertical push");
  if (movement.includes("horizontal pull")) patterns.add("Horizontal pull");
  if (movement.includes("vertical pull")) patterns.add("Vertical pull");
  if (movement.includes("squat")) patterns.add("Squat");
  if (movement.includes("hinge")) patterns.add("Hinge");
  if (movement.includes("lunge") || text.includes("split squat")) patterns.add("Lunge");
  if (movement.includes("carry") || text.includes("walk")) patterns.add("Carry");
  if (movement.includes("rotation") || text.includes("twist") || text.includes("chop")) patterns.add("Rotation");
  if (movement.includes("anti") || exercise.qualities.includes("antiRotation") || exercise.qualities.includes("bracing")) patterns.add("Anti-movement bracing");
  if (exercise.qualities.includes("jumping") || /jump|plyometric|bound/.test(text)) patterns.add("Jump / landing");
  // Whole words: "run" inside "Trunk" and "Crunch" tagged every plank and crunch as locomotion.
  if (exercise.qualities.includes("locomotion") || /\bsled\b|\bsprint|\bmarch\b|\brun\b|\brunning\b/.test(text)) patterns.add("Locomotion");
  if (exercise.qualities.includes("power") || /throw|ballistic|explosive|clean|snatch/.test(text)) patterns.add("Power expression");
  // "Bear" alone is not crawling: a bear-hug carry holds a load to the chest (brief §5).
  if (/\bcrawl|\bbear crawl/.test(text)) patterns.add("Crawling");
  return Array.from(patterns.size ? patterns : new Set([exercise.movement]));
}

function getJointActions(exercise: Exercise) {
  const stated = descriptorFor(exercise.id)?.jointActions;
  if (stated) return [...stated];
  const patterns = getMovementPatterns(exercise).join(" ").toLowerCase();
  const actions = new Set<string>();
  if (patterns.includes("horizontal push")) ["Shoulder horizontal adduction", "Elbow extension", "Scapular protraction"].forEach((action) => actions.add(action));
  if (patterns.includes("vertical push")) ["Shoulder flexion / abduction", "Elbow extension", "Scapular upward rotation"].forEach((action) => actions.add(action));
  if (patterns.includes("horizontal pull")) ["Shoulder extension / horizontal abduction", "Elbow flexion", "Scapular retraction"].forEach((action) => actions.add(action));
  if (patterns.includes("vertical pull")) ["Shoulder adduction", "Elbow flexion", "Scapular depression"].forEach((action) => actions.add(action));
  if (patterns.includes("squat") || patterns.includes("lunge")) ["Hip flexion / extension", "Knee extension", "Ankle dorsiflexion / plantarflexion"].forEach((action) => actions.add(action));
  if (patterns.includes("hinge")) ["Hip flexion / extension", "Spinal anti-flexion", "Knee flexion control"].forEach((action) => actions.add(action));
  if (patterns.includes("rotation")) ["Spinal rotation", "Hip rotation"].forEach((action) => actions.add(action));
  if (patterns.includes("anti-movement bracing")) ["Trunk anti-rotation", "Trunk anti-flexion", "Trunk anti-lateral-flexion"].forEach((action) => actions.add(action));
  if (patterns.includes("carry") || patterns.includes("locomotion")) ["Trunk anti-lateral-flexion", "Hip stabilization", "Grip isometric"].forEach((action) => actions.add(action));
  if (patterns.includes("jump")) ["Hip extension", "Knee extension", "Ankle plantarflexion", "Eccentric landing control"].forEach((action) => actions.add(action));
  return Array.from(actions.size ? actions : new Set(["Joint-specific controlled motion"]));
}

function getResistanceProfile(exercise: Exercise): ExerciseGenome["resistanceProfile"] {
  const stated = descriptorFor(exercise.id)?.resistance;
  if (stated) return { ...stated, curve: [...stated.curve] };
  const text = lower(exercise);
  if (/cable/.test(text)) {
    if (/bayesian|incline cable curl/.test(text)) return { bias: "Lengthened", stickingRegion: "Early elbow-flexion / stretched position", peakRegion: "Early-to-mid range", curve: [88, 92, 70, 46, 30] };
    if (/cable fly|cable press around|press-around/.test(text)) return { bias: "Shortened", stickingRegion: "Adduction path and cable line", peakRegion: "Late range", curve: [40, 55, 72, 88, 92] };
    if (/cable row|pulldown|face pull/.test(text)) return { bias: "Mid-range", stickingRegion: "Scapular and elbow-drive transition", peakRegion: "Middle range", curve: [52, 72, 88, 70, 48] };
    if (/press|press-out|pallof/.test(text)) return { bias: "Even", stickingRegion: "Setup-dependent leverage transition", peakRegion: "Cable line and body-position dependent", curve: [60, 72, 78, 73, 62] };
    return { bias: "Even", stickingRegion: "Setup-dependent leverage transition", peakRegion: "Cable line and body-position dependent", curve: [60, 72, 78, 73, 62] };
  }
  if (/fly|pullover|romanian|rdl|good morning|deep squat|sissy/.test(text)) return { bias: "Lengthened", stickingRegion: "Bottom / stretched position", peakRegion: "Early-to-mid range", curve: [86, 94, 72, 45, 30] };
  // A neck extension is a cervical movement; the word "extension" alone is not a resistance curve.
  if (/band|squeeze|kickback|(?<!neck )extension/.test(text)) return { bias: "Shortened", stickingRegion: "End-range contraction", peakRegion: "Late range", curve: [35, 48, 65, 84, 94] };
  if (/machine|smith|sled|leg press/.test(text)) return { bias: "Even", stickingRegion: "Machine-specific mid range", peakRegion: "Mid range", curve: [62, 74, 79, 73, 61] };
  return { bias: "Mid-range", stickingRegion: "Mid-range leverage transition", peakRegion: "Middle range", curve: [54, 72, 91, 70, 48] };
}

function getFingerprint(exercise: Exercise): Record<GenomeDimension, number> {
  const { freeWeight, unilateral, ballistic, complex, machine, isolation, strengthPattern, deepRange, axialPattern, rackCost } = fingerprintPredicatesFor(exercise);
  const calibration = logicCalibration.fingerprint;
  // Machine equipment lifts the hypertrophy score here although the machine-modality evidence
  // note says equipment creates no default growth advantage. Recorded as a model issue in
  // docs/exercise-expansion-v1/inventory.md; not retuned for the expansion (brief §4.1).
  const hypertrophy = clamp(calibration.hypertrophyBase + qualityValue(exercise, "hypertrophy", calibration.hypertrophyQualityPresent, calibration.hypertrophyQualityAbsent) + (machine ? calibration.hypertrophyMachineLift : 0) + (isolation ? calibration.hypertrophyIsolationLift : 0));
  const strength = clamp(calibration.strengthBase + qualityValue(exercise, "strength", calibration.strengthQualityPresent, calibration.strengthQualityAbsent) + (freeWeight ? calibration.strengthFreeWeightLift : 0) + (strengthPattern ? calibration.strengthBarbellPatternLift : 0));
  const power = clamp(calibration.powerBase + qualityValue(exercise, "power", calibration.powerQualityPresent, calibration.powerQualityAbsent) + (ballistic ? calibration.powerBallisticLift : 0) + (exercise.qualities.includes("jumping") ? calibration.powerJumpingLift : 0));
  const stability = clamp(calibration.stabilityBase + qualityValue(exercise, "bracing", calibration.stabilityBracingPresent, calibration.stabilityBracingAbsent) + (unilateral ? calibration.stabilityUnilateralLift : 0) + (freeWeight ? calibration.stabilityFreeWeightLift : 0));
  const mobility = clamp(calibration.mobilityBase + (deepRange ? calibration.mobilityDeepRangeLift : calibration.mobilityStandardRangeLift) + (unilateral ? calibration.mobilityUnilateralLift : 0));
  const skill = clamp(calibration.skillBase + (freeWeight ? calibration.skillFreeWeightLift : calibration.skillNonFreeWeightLift) + (unilateral ? calibration.skillUnilateralLift : 0) + (ballistic ? calibration.skillBallisticLift : 0) + (complex ? calibration.skillComplexLift : 0));
  const fatigue = clamp(calibration.fatigueBase + (strength > calibration.fatigueStrengthThreshold ? calibration.fatigueStrengthLift : 0) + (ballistic ? calibration.fatigueBallisticLift : 0) + (axialPattern ? calibration.fatigueAxialPatternLift : 0) + (unilateral ? calibration.fatigueUnilateralLift : 0));
  const practicality = clamp(calibration.practicalityBase - (machine ? calibration.practicalityMachineCost : 0) - (rackCost ? calibration.practicalityRackCost : 0) - (complex ? calibration.practicalityComplexCost : 0));
  return { hypertrophy, strength, power, stability, mobility, sfr: clamp(hypertrophy - fatigue * calibration.stimulusFatigueMultiplier + calibration.stimulusFatigueBase), skill, practicality };
}

function getAdaptationProfile(fingerprint: Record<GenomeDimension, number>): ExerciseGenome["adaptation"] {
  const calibration = logicCalibration.exerciseGenome;
  const ranked = Object.entries({ Hypertrophy: fingerprint.hypertrophy, Strength: fingerprint.strength, Power: fingerprint.power, Stability: fingerprint.stability, Mobility: fingerprint.mobility, Skill: fingerprint.skill }).sort(([, first], [, second]) => second - first);
  const primary = ranked.slice(0, calibration.adaptationPrimaryCount).map(([label]) => label);
  const secondary = ranked.slice(calibration.adaptationSecondaryStart, calibration.adaptationSecondaryEnd).map(([label]) => label);
  return { primary, secondary, rationale: `${primary.join(" and ")} are the highest relative opportunity or demand signals in this standardized exercise model; programming dose, technique, and athlete context determine the realised adaptation.` };
}

function getMuscleProfile(exercise: Exercise, fingerprint: Record<GenomeDimension, number>) {
  const calibration = logicCalibration.exerciseGenome;
  // A muscle the catalog lists as both primary and secondary counts once, as a prime mover,
  // the way session volume and coverage already read it. 17 catalog rows do this (every
  // overhead press for front delts, the grip moves for forearms), and the second entry
  // added a synergist share on top of the prime mover's (Sep 30 brief §7).
  const primary = new Set(exercise.primaryMuscles);
  // An expansion record names its stabilizers; the original rule (bracing makes the trunk
  // muscles stabilizers) stays for the original records.
  const descriptor = descriptorFor(exercise.id);
  const isStabilizer = (muscle: string) => descriptor ? descriptor.stabilizers.includes(muscle) : exercise.qualities.includes("bracing") && ["abs", "obliques", "lowerBack"].includes(muscle);
  const labelFor = (muscle: string) => descriptor?.anatomy[muscle] || anatomicalLabels[muscle] || muscle;
  const profile = [...Array.from(primary, (muscle) => ({ muscle, role: "Prime mover" as const })), ...Array.from(new Set(exercise.secondaryMuscles.filter((muscle) => !primary.has(muscle))), (muscle) => ({ muscle, role: isStabilizer(muscle) ? "Stabilizer" as const : "Synergist" as const }))];
  return profile.map(({ muscle, role }) => {
    const targeting = buildMuscleTargetingEstimate(exercise, muscle, role);
    const contribution = targeting.score;
    const lengthened = getResistanceProfile(exercise).bias === "Lengthened" ? clamp(contribution - calibration.lengthenedLoadingOffset) : clamp(contribution * calibration.nonLengthenedLoadingMultiplier);
    const peak = getResistanceProfile(exercise).bias === "Shortened" ? clamp(contribution - calibration.shortenedPeakOffset) : clamp(contribution * calibration.nonShortenedPeakMultiplier);
    const mechanicsSummary = targeting.mechanicsFactors.slice(0, calibration.mechanicsSummaryLimit).map((factor) => factor.label.toLowerCase()).join(", ");
    const roleSummary = role === "Prime mover" ? `${labelFor(muscle)} is ranked as a primary contributor in this movement.` : role === "Stabilizer" ? `${labelFor(muscle)} is ranked for positional-control context.` : `${labelFor(muscle)} is ranked as a supporting contributor in this movement.`;
    return {
      muscle,
      anatomicalLabel: labelFor(muscle),
      role,
      contribution,
      mechanicalLoading: clamp(contribution + (fingerprint.strength > calibration.mechanicalStrengthThreshold ? calibration.mechanicalStrengthLift : 0)),
      longLengthLoading: lengthened,
      peakContraction: peak,
      stabilizationDemand: role === "Stabilizer" ? clamp(calibration.stabilizerDemandBase + fingerprint.stability * calibration.stabilizerDemandMultiplier) : clamp(calibration.supportDemandBase + fingerprint.stability * calibration.supportDemandMultiplier),
      fatigueContribution: clamp(contribution * calibration.fatigueContributionMultiplier + fingerprint.sfr * calibration.fatigueContributionSfrMultiplier),
      tier: tierFor(contribution),
      why: `${targeting.evidenceTier}. ${targeting.directEvidenceNote || roleSummary} Key mechanics inputs: ${mechanicsSummary}. ${targeting.uncertainty}`,
      targeting,
    };
  });
}

export function buildExerciseGenome(exercise: Exercise): ExerciseGenome {
  const fingerprint = getFingerprint(exercise);
  const patterns = getMovementPatterns(exercise);
  const text = lower(exercise);
  const descriptor = descriptorFor(exercise.id);
  const { unilateral } = fingerprintPredicatesFor(exercise);
  const tasks = genomeTaskPredicatesFor(exercise);
  const chain = descriptor?.chain ?? (/push-up|pull-up|chin-up|crawl|carry|jump|bodyweight/.test(text) ? "Closed" : unilateral && /cable|dumbbell|kettlebell/.test(text) ? "Mixed" : "Open");
  const calibration = logicCalibration.fingerprint;
  const fatigueBase = clamp(logicCalibration.exerciseGenome.relativeScaleMaximum - fingerprint.sfr + calibration.fatigueBaseOffset);
  // The pattern labels are title case ("Squat", "Carry"); these rules used to test them with
  // lowercase, case-sensitive expressions, so neither branch was ever taken (brief §5).
  // A gait task is one the athlete walks, runs or drags through - read from what the exercise is,
  // not from a "locomotion" quality tag, which a calf raise carries because it supports running.
  const gait = /\b(carry|walk|march|sprint|sled|drag(?! curl)|run|running)\b/.test(`${exercise.name} ${exercise.movement}`.toLowerCase());
  const forceDirection = descriptor?.forceDirection ?? (patterns.some((pattern) => /squat|hinge|lunge|jump/i.test(pattern)) ? "Vertical / ground-reaction" : gait || patterns.some((pattern) => /rotation/i.test(pattern)) ? "Multi-planar / diagonal" : "Task-specific line of force");
  const stance = descriptor?.stance ?? (unilateral ? "Unilateral" : gait ? "Mixed" : "Bilateral");
  const studyCalibration = getExerciseStudyCalibration(exercise);
  const sourceStrength = studyCalibration?.kind === "Direct longitudinal adaptation" ? "Direct longitudinal study attached" as const : studyCalibration ? "Mechanics or transfer context attached" as const : "No study attached" as const;
  return {
    exerciseId: exercise.id,
    fingerprint,
    muscleProfile: getMuscleProfile(exercise, fingerprint),
    movementPatterns: patterns,
    jointActions: getJointActions(exercise),
    forceDirection,
    chain,
    stance,
    resistanceProfile: getResistanceProfile(exercise),
    fatigue: { local: fatigueBase, systemic: clamp(fatigueBase + (fingerprint.strength > calibration.fatigueStrengthThreshold ? calibration.systemicStrengthLift : calibration.systemicNonStrengthOffset)), grip: clamp((tasks.gripTask ? calibration.gripTaskBase : calibration.gripDefaultBase) + (fingerprint.strength > calibration.fatigueStrengthThreshold ? calibration.gripStrengthLift : 0)), axial: clamp(tasks.axialTask ? calibration.axialTaskBase : calibration.axialDefaultBase), technical: fingerprint.skill },
    practicality: { setup: clamp(fingerprint.practicality + (exercise.equipment === "Bodyweight" ? calibration.setupBodyweightLift : 0)), space: clamp(fingerprint.practicality + (tasks.needsSpace ? -calibration.spaceLocomotionCost : 0)), accessibility: clamp(fingerprint.practicality), homeGym: clamp(fingerprint.practicality + (tasks.specialistEquipment ? -calibration.homeGymMachineCost : 0)), supersetEase: clamp(calibration.supersetEaseBase - fatigueBase * calibration.supersetFatigueMultiplier) },
    adaptation: getAdaptationProfile(fingerprint),
    evidence: { quality: fingerprint.skill > calibration.fatigueStrengthThreshold ? "Context-sensitive — coaching inference" : "Moderate — biomechanical inference", confidence: fingerprint.skill > calibration.fatigueStrengthThreshold ? "Moderate" : "High", sourceStrength, note: "Values are standardized estimates that summarize movement mechanics and training-practice inference; individual execution, loading, and programming change the result." },
    studyCalibration,
  };
}

export const exerciseGenomes: Record<number, ExerciseGenome> = Object.fromEntries(exercises.map((exercise) => [exercise.id, buildExerciseGenome(exercise)]));
export const getExerciseGenome = (exercise: Exercise | number) => {
  if (typeof exercise === "number") return exerciseGenomes[exercise];
  const catalogExerciseId = (exercise as Exercise & { catalogExerciseId?: number }).catalogExerciseId || exercise.id;
  return exerciseGenomes[catalogExerciseId];
};

const overlap = (first: string[], second: string[]) => {
  const shared = first.filter((item) => second.includes(item));
  return first.length || second.length ? shared.length / new Set([...first, ...second]).size : 0;
};

function similarity(first: Exercise, second: Exercise) {
  const firstGenome = getExerciseGenome(first);
  const secondGenome = getExerciseGenome(second);
  const muscle = overlap([...first.primaryMuscles, ...first.secondaryMuscles], [...second.primaryMuscles, ...second.secondaryMuscles]);
  const movement = overlap(firstGenome.movementPatterns, secondGenome.movementPatterns);
  const qualities = overlap(first.qualities, second.qualities);
  const weights = logicCalibration.exerciseGenome;
  const partial = muscle * weights.muscleSimilarityWeight + movement * weights.movementSimilarityWeight + qualities * weights.qualitySimilarityWeight;
  // An unestablished profile is unknown, not different: the term is left out and the other three
  // keep their relative weights, so an exercise is neither more nor less "distinct" for it.
  if (firstGenome.resistanceProfile.bias === "Not established" || secondGenome.resistanceProfile.bias === "Not established") {
    return clamp(partial / (weights.muscleSimilarityWeight + weights.movementSimilarityWeight + weights.qualitySimilarityWeight) * weights.relativeScaleMaximum);
  }
  const profile = firstGenome.resistanceProfile.bias === secondGenome.resistanceProfile.bias ? 1 : weights.resistanceProfileMismatchSimilarity;
  return clamp((partial + profile * weights.resistanceProfileSimilarityWeight) * weights.relativeScaleMaximum);
}

/** Genome similarity between two exercises, 0-100, for the diagnostics and fixtures. */
export const exerciseSimilarity = similarity;

/** The fingerprint dimension a stated goal is read against: the goal alignment signal is that dimension's value. */
export const goalDimensionFor = (goal: string): GenomeDimension => /muscle|hypertrophy/i.test(goal) ? "hypertrophy" : /strength/i.test(goal) ? "strength" : /capacity|endurance/i.test(goal) ? "sfr" : "power";

export function analyzeExerciseContext(exercise: Exercise, context: GenomeContext): GenomeContextAnalysis {
  const genome = getExerciseGenome(exercise);
  const goalKey = goalDimensionFor(context.goal);
  const peers = context.currentWorkout.filter((item) => item.id !== exercise.id);
  const redundancy = peers.length ? clamp(peers.reduce((sum, item) => sum + similarity(exercise, item), 0) / peers.length) : logicCalibration.exerciseGenome.emptyStackRedundancyBaseline;
  const marginalValue = clamp(logicCalibration.exerciseGenome.relativeScaleMaximum - redundancy + (genome.fingerprint.stability > logicCalibration.exerciseGenome.contextualGradeB ? logicCalibration.exerciseGenome.contextStabilityLift : 0));
  /*
   * The selected sport action is not an input. It used to be a third signal, a
   * 0-100 "mechanical match" built from the Matches engine's text signals and
   * muscle aliases, weighted into the contextual fit. Over Bridge it scored the
   * Barbell Hip Thrust, which the Bridge record names, 35 and Landmine Rotation
   * 48, beside a tier that said the opposite. How an exercise relates to a
   * movement is now its movement support tier (lib/movementSupport), which has
   * no number; goal and stack weigh what they did relative to each other.
   */
  const recoveryManageability = clamp(logicCalibration.exerciseGenome.relativeScaleMaximum - (genome.fatigue.systemic * logicCalibration.exerciseGenome.systemicRecoveryCostWeight + genome.fatigue.technical * logicCalibration.exerciseGenome.technicalRecoveryCostWeight + genome.fatigue.axial * logicCalibration.exerciseGenome.axialRecoveryCostWeight));
  const signals = { goalAlignment: genome.fingerprint[goalKey], stackDistinctness: marginalValue, recoveryManageability };
  const contextualScore = clamp(signals.goalAlignment * logicCalibration.exerciseGenome.contextualGoalWeight + signals.stackDistinctness * logicCalibration.exerciseGenome.contextualDistinctnessWeight);
  const goalLabel = goalKey === "sfr" ? "repeatable training value" : goalKey;
  const strengths = [`${signals.goalAlignment}/100 ${goalLabel} alignment`, `${signals.stackDistinctness}/100 stack distinctness`, `${signals.recoveryManageability}/100 recovery manageability`];
  const limits = [redundancy > logicCalibration.exerciseGenome.highRedundancyReview ? "Overlaps meaningfully with the current stack; its added value is reduced." : "Adds a relatively distinct exposure to the current stack.", genome.fatigue.systemic > logicCalibration.exerciseGenome.highFatigueReview ? "Higher systemic and technical cost may limit placement or volume." : "Fatigue profile is comparatively manageable for its intended adaptation."];
  /*
   * The verdict, not a re-reading of the panel. This was 40-odd words saying what
   * `strengths` already states as four scored lines and `limits` states again
   * underneath - the redundancy branch and the first limit were near-identical.
   * What the numbers cannot say is what to do about them, so that is what is left.
   */
  const explanation = redundancy > logicCalibration.exerciseGenome.highRedundancyReview
    ? `Best as a replacement for something similar, or to solve a specific gap.`
    : `Adds ${goalLabel} value without repeating the stack.`;
  return { contextualScore, grade: gradeFor(contextualScore), marginalValue, redundancy, signals, explanation, strengths, limits };
}

export function getWorkoutGenome(workout: Exercise[]) {
  const patterns = workout.flatMap((exercise) => getExerciseGenome(exercise).movementPatterns);
  const muscles = workout.flatMap((exercise) => [...exercise.primaryMuscles, ...exercise.secondaryMuscles]);
  const countBy = (items: string[]) => Object.entries(items.reduce<Record<string, number>>((all, item) => ({ ...all, [item]: (all[item] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1]);
  const pairScores = workout.flatMap((exercise, index) => workout.slice(index + 1).map((peer) => similarity(exercise, peer)));
  const redundancy = pairScores.length ? clamp(pairScores.reduce((sum, score) => sum + score, 0) / pairScores.length) : logicCalibration.exerciseGenome.emptyWorkoutRedundancy;
  const gaps = ["Horizontal push", "Horizontal pull", "Squat", "Hinge", "Rotation", "Carry"].filter((pattern) => !patterns.includes(pattern));
  return { dominantPatterns: countBy(patterns).slice(0, logicCalibration.exerciseGenome.workoutPatternSummaryLimit), dominantMuscles: countBy(muscles).slice(0, logicCalibration.exerciseGenome.workoutMuscleSummaryLimit), redundancy, gaps };
}
