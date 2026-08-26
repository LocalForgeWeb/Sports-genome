/** Exercise Genome: intrinsic exercise vectors plus transparent contextual utility, redundancy, and marginal-value analysis. */
import { exercises, type Exercise, type Grade } from "@/lib/exerciseCatalog";
import { getExerciseStudyCalibration, type ExerciseStudyCalibration } from "@/lib/exerciseStudyCalibration";
import { buildMuscleTargetingEstimate, type MuscleTargetingEstimate } from "@/lib/muscleTargetingModel";
import { getMovementMuscles, getMovementSignals } from "@/lib/movementRecommendations";
import type { SportMovementProfile } from "@/lib/sportMovementDatabase";
import { logicCalibration } from "@/lib/evidenceTraceability";

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
  resistanceProfile: { bias: "Lengthened" | "Mid-range" | "Shortened" | "Even"; stickingRegion: string; peakRegion: string; curve: number[] };
  fatigue: { local: number; systemic: number; grip: number; axial: number; technical: number };
  practicality: { setup: number; space: number; accessibility: number; homeGym: number; supersetEase: number };
  adaptation: { primary: string[]; secondary: string[]; rationale: string };
  evidence: { quality: EvidenceQuality; confidence: "High" | "Moderate"; note: string };
  studyCalibration: ExerciseStudyCalibration | null;
}

export interface GenomeContext {
  goal: string;
  currentWorkout: Exercise[];
  sportMovement?: SportMovementProfile;
}

export interface GenomeContextAnalysis {
  contextualScore: number;
  grade: Grade;
  marginalValue: number;
  redundancy: number;
  sportTransfer: number;
  signals: { goalAlignment: number; stackDistinctness: number; sportActionMatch: number; recoveryManageability: number };
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
  glutes: "Gluteus maximus", quads: "Quadriceps", hamstrings: "Hamstrings", calves: "Gastrocnemius / soleus", tibialis: "Tibialis anterior", adductors: "Hip adductors", abductors: "Gluteus medius / abductors",
};

const qualityValue = (exercise: Exercise, quality: string, present: number, absent: number) => exercise.qualities.includes(quality) ? present : absent;
const lower = (exercise: Exercise) => `${exercise.name} ${exercise.category} ${exercise.movement} ${exercise.equipment}`.toLowerCase();
const includes = (exercise: Exercise, expression: RegExp) => expression.test(lower(exercise));

function getMovementPatterns(exercise: Exercise) {
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
  if (exercise.qualities.includes("locomotion") || /sled|sprint|march|run/.test(text)) patterns.add("Locomotion");
  if (exercise.qualities.includes("power") || /throw|ballistic|explosive|clean|snatch/.test(text)) patterns.add("Power expression");
  if (/crawl|bear/.test(text)) patterns.add("Crawling");
  return Array.from(patterns.size ? patterns : new Set([exercise.movement]));
}

function getJointActions(exercise: Exercise) {
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
  const text = lower(exercise);
  if (/cable/.test(text)) {
    if (/bayesian|incline cable curl/.test(text)) return { bias: "Lengthened", stickingRegion: "Early elbow-flexion / stretched position", peakRegion: "Early-to-mid range", curve: [88, 92, 70, 46, 30] };
    if (/cable fly|cable press around|press-around/.test(text)) return { bias: "Shortened", stickingRegion: "Adduction path and cable line", peakRegion: "Late range", curve: [40, 55, 72, 88, 92] };
    if (/cable row|pulldown|face pull/.test(text)) return { bias: "Mid-range", stickingRegion: "Scapular and elbow-drive transition", peakRegion: "Middle range", curve: [52, 72, 88, 70, 48] };
    if (/press|press-out|pallof/.test(text)) return { bias: "Even", stickingRegion: "Setup-dependent leverage transition", peakRegion: "Cable line and body-position dependent", curve: [60, 72, 78, 73, 62] };
    return { bias: "Even", stickingRegion: "Setup-dependent leverage transition", peakRegion: "Cable line and body-position dependent", curve: [60, 72, 78, 73, 62] };
  }
  if (/fly|pullover|romanian|rdl|good morning|deep squat|sissy/.test(text)) return { bias: "Lengthened", stickingRegion: "Bottom / stretched position", peakRegion: "Early-to-mid range", curve: [86, 94, 72, 45, 30] };
  if (/band|squeeze|kickback|extension/.test(text)) return { bias: "Shortened", stickingRegion: "End-range contraction", peakRegion: "Late range", curve: [35, 48, 65, 84, 94] };
  if (/machine|smith|sled|leg press/.test(text)) return { bias: "Even", stickingRegion: "Machine-specific mid range", peakRegion: "Mid range", curve: [62, 74, 79, 73, 61] };
  return { bias: "Mid-range", stickingRegion: "Mid-range leverage transition", peakRegion: "Middle range", curve: [54, 72, 91, 70, 48] };
}

function getFingerprint(exercise: Exercise): Record<GenomeDimension, number> {
  const text = lower(exercise);
  const freeWeight = /barbell|dumbbell|kettlebell|sandbag|bodyweight/.test(text);
  const unilateral = /single|one-arm|one arm|split|lunge|step-up|bulgarian/.test(text) || exercise.qualities.includes("unilateral");
  const ballistic = /jump|throw|clean|snatch|plyometric|explosive|sprint/.test(text) || exercise.qualities.includes("power");
  const complex = /clean|snatch|turkish|get-up|pistol|muscle-up|handstand/.test(text);
  const calibration = logicCalibration.fingerprint;
  const hypertrophy = clamp(calibration.hypertrophyBase + qualityValue(exercise, "hypertrophy", calibration.hypertrophyQualityPresent, calibration.hypertrophyQualityAbsent) + (exercise.equipment === "Machine" ? calibration.hypertrophyMachineLift : 0) + (/fly|curl|extension|raise|leg curl/.test(text) ? calibration.hypertrophyIsolationLift : 0));
  const strength = clamp(calibration.strengthBase + qualityValue(exercise, "strength", calibration.strengthQualityPresent, calibration.strengthQualityAbsent) + (freeWeight ? calibration.strengthFreeWeightLift : 0) + (/barbell|trap bar|deadlift|squat|press/.test(text) ? calibration.strengthBarbellPatternLift : 0));
  const power = clamp(calibration.powerBase + qualityValue(exercise, "power", calibration.powerQualityPresent, calibration.powerQualityAbsent) + (ballistic ? calibration.powerBallisticLift : 0) + (exercise.qualities.includes("jumping") ? calibration.powerJumpingLift : 0));
  const stability = clamp(calibration.stabilityBase + qualityValue(exercise, "bracing", calibration.stabilityBracingPresent, calibration.stabilityBracingAbsent) + (unilateral ? calibration.stabilityUnilateralLift : 0) + (freeWeight ? calibration.stabilityFreeWeightLift : 0));
  const mobility = clamp(calibration.mobilityBase + (/overhead|deep|cossack|pullover|lunge|split squat/.test(text) ? calibration.mobilityDeepRangeLift : calibration.mobilityStandardRangeLift) + (unilateral ? calibration.mobilityUnilateralLift : 0));
  const skill = clamp(calibration.skillBase + (freeWeight ? calibration.skillFreeWeightLift : calibration.skillNonFreeWeightLift) + (unilateral ? calibration.skillUnilateralLift : 0) + (ballistic ? calibration.skillBallisticLift : 0) + (complex ? calibration.skillComplexLift : 0));
  const fatigue = clamp(calibration.fatigueBase + (strength > calibration.fatigueStrengthThreshold ? calibration.fatigueStrengthLift : 0) + (ballistic ? calibration.fatigueBallisticLift : 0) + (/deadlift|squat|good morning|clean|snatch/.test(text) ? calibration.fatigueAxialPatternLift : 0) + (unilateral ? calibration.fatigueUnilateralLift : 0));
  const practicality = clamp(calibration.practicalityBase - (exercise.equipment === "Machine" ? calibration.practicalityMachineCost : 0) - (/barbell|rack|sled/.test(text) ? calibration.practicalityRackCost : 0) - (complex ? calibration.practicalityComplexCost : 0));
  return { hypertrophy, strength, power, stability, mobility, sfr: clamp(hypertrophy - fatigue * calibration.stimulusFatigueMultiplier + calibration.stimulusFatigueBase), skill, practicality };
}

function getAdaptationProfile(fingerprint: Record<GenomeDimension, number>): ExerciseGenome["adaptation"] {
  const ranked = Object.entries({ Hypertrophy: fingerprint.hypertrophy, Strength: fingerprint.strength, Power: fingerprint.power, Stability: fingerprint.stability, Mobility: fingerprint.mobility, Skill: fingerprint.skill }).sort(([, first], [, second]) => second - first);
  const primary = ranked.slice(0, 2).map(([label]) => label);
  const secondary = ranked.slice(2, 4).map(([label]) => label);
  return { primary, secondary, rationale: `${primary.join(" and ")} are the highest relative opportunity or demand signals in this standardized exercise model; programming dose, technique, and athlete context determine the realised adaptation.` };
}

function getMuscleProfile(exercise: Exercise, fingerprint: Record<GenomeDimension, number>) {
  const profile = [...exercise.primaryMuscles.map((muscle) => ({ muscle, role: "Prime mover" as const })), ...exercise.secondaryMuscles.map((muscle) => ({ muscle, role: exercise.qualities.includes("bracing") && ["abs", "obliques", "lowerBack"].includes(muscle) ? "Stabilizer" as const : "Synergist" as const }))];
  return profile.map(({ muscle, role }) => {
    const targeting = buildMuscleTargetingEstimate(exercise, muscle, role);
    const contribution = targeting.score;
    const lengthened = getResistanceProfile(exercise).bias === "Lengthened" ? clamp(contribution - 3) : clamp(contribution * .6);
    const peak = getResistanceProfile(exercise).bias === "Shortened" ? clamp(contribution - 3) : clamp(contribution * .58);
    const mechanicsSummary = targeting.mechanicsFactors.slice(0, 5).map((factor) => factor.label.toLowerCase()).join(", ");
    const roleSummary = role === "Prime mover" ? `${anatomicalLabels[muscle] || muscle} is ranked as a primary contributor in this movement.` : role === "Stabilizer" ? `${anatomicalLabels[muscle] || muscle} is ranked for positional-control context.` : `${anatomicalLabels[muscle] || muscle} is ranked as a supporting contributor in this movement.`;
    return {
      muscle,
      anatomicalLabel: anatomicalLabels[muscle] || muscle,
      role,
      contribution,
      mechanicalLoading: clamp(contribution + (fingerprint.strength > 75 ? 6 : 0)),
      longLengthLoading: lengthened,
      peakContraction: peak,
      stabilizationDemand: role === "Stabilizer" ? clamp(66 + fingerprint.stability * .22) : clamp(18 + fingerprint.stability * .28),
      fatigueContribution: clamp(contribution * .64 + fingerprint.sfr * .15),
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
  const unilateral = /single|one-arm|one arm|split|lunge|step-up|bulgarian/.test(text) || exercise.qualities.includes("unilateral");
  const chain = /push-up|pull-up|chin-up|crawl|carry|jump|bodyweight/.test(text) ? "Closed" : unilateral && /cable|dumbbell|kettlebell/.test(text) ? "Mixed" : "Open";
  const calibration = logicCalibration.fingerprint;
  const fatigueBase = clamp(logicCalibration.exerciseGenome.relativeScaleMaximum - fingerprint.sfr + calibration.fatigueBaseOffset);
  return {
    exerciseId: exercise.id,
    fingerprint,
    muscleProfile: getMuscleProfile(exercise, fingerprint),
    movementPatterns: patterns,
    jointActions: getJointActions(exercise),
    forceDirection: patterns.some((pattern) => /squat|hinge|lunge|jump/.test(pattern)) ? "Vertical / ground-reaction" : patterns.some((pattern) => /rotation|locomotion/.test(pattern)) ? "Multi-planar / diagonal" : "Task-specific line of force",
    chain,
    stance: unilateral ? "Unilateral" : patterns.some((pattern) => /carry|locomotion/.test(pattern)) ? "Mixed" : "Bilateral",
    resistanceProfile: getResistanceProfile(exercise),
    fatigue: { local: fatigueBase, systemic: clamp(fatigueBase + (fingerprint.strength > calibration.fatigueStrengthThreshold ? calibration.systemicStrengthLift : calibration.systemicNonStrengthOffset)), grip: clamp((/carry|deadlift|row|pull|farmer|hang/.test(text) ? calibration.gripTaskBase : calibration.gripDefaultBase) + (fingerprint.strength > calibration.fatigueStrengthThreshold ? calibration.gripStrengthLift : 0)), axial: clamp(/squat|deadlift|good morning|carry|overhead/.test(text) ? calibration.axialTaskBase : calibration.axialDefaultBase), technical: fingerprint.skill },
    practicality: { setup: clamp(fingerprint.practicality + (exercise.equipment === "Bodyweight" ? calibration.setupBodyweightLift : 0)), space: clamp(fingerprint.practicality + (/carry|sled|sprint/.test(text) ? -calibration.spaceLocomotionCost : 0)), accessibility: clamp(fingerprint.practicality), homeGym: clamp(fingerprint.practicality + (/machine|sled/.test(text) ? -calibration.homeGymMachineCost : 0)), supersetEase: clamp(calibration.supersetEaseBase - fatigueBase * calibration.supersetFatigueMultiplier) },
    adaptation: getAdaptationProfile(fingerprint),
    evidence: { quality: fingerprint.skill > calibration.fatigueStrengthThreshold ? "Context-sensitive — coaching inference" : "Moderate — biomechanical inference", confidence: fingerprint.skill > calibration.fatigueStrengthThreshold ? "Moderate" : "High", note: "Values are standardized estimates that summarize movement mechanics and training-practice inference; individual execution, loading, and programming change the result." },
    studyCalibration: getExerciseStudyCalibration(exercise),
  };
}

export const exerciseGenomes: Record<number, ExerciseGenome> = Object.fromEntries(exercises.map((exercise) => [exercise.id, buildExerciseGenome(exercise)]));
export const getExerciseGenome = (exercise: Exercise | number) => exerciseGenomes[typeof exercise === "number" ? exercise : exercise.id];

const overlap = (first: string[], second: string[]) => {
  const shared = first.filter((item) => second.includes(item));
  return first.length || second.length ? shared.length / new Set([...first, ...second]).size : 0;
};

function similarity(first: Exercise, second: Exercise) {
  const firstGenome = getExerciseGenome(first);
  const secondGenome = getExerciseGenome(second);
  const muscle = overlap([...first.primaryMuscles, ...first.secondaryMuscles], [...second.primaryMuscles, ...second.secondaryMuscles]);
  const movement = overlap(firstGenome.movementPatterns, secondGenome.movementPatterns);
  const profile = firstGenome.resistanceProfile.bias === secondGenome.resistanceProfile.bias ? 1 : .25;
  const qualities = overlap(first.qualities, second.qualities);
  return clamp((muscle * logicCalibration.exerciseGenome.muscleSimilarityWeight + movement * logicCalibration.exerciseGenome.movementSimilarityWeight + profile * logicCalibration.exerciseGenome.resistanceProfileSimilarityWeight + qualities * logicCalibration.exerciseGenome.qualitySimilarityWeight) * logicCalibration.exerciseGenome.relativeScaleMaximum);
}

export function analyzeExerciseContext(exercise: Exercise, context: GenomeContext): GenomeContextAnalysis {
  const genome = getExerciseGenome(exercise);
  const goalKey: GenomeDimension = /muscle|hypertrophy/i.test(context.goal) ? "hypertrophy" : /strength/i.test(context.goal) ? "strength" : /capacity|endurance/i.test(context.goal) ? "sfr" : "power";
  const peers = context.currentWorkout.filter((item) => item.id !== exercise.id);
  const redundancy = peers.length ? clamp(peers.reduce((sum, item) => sum + similarity(exercise, item), 0) / peers.length) : logicCalibration.exerciseGenome.emptyStackRedundancyBaseline;
  const marginalValue = clamp(logicCalibration.exerciseGenome.relativeScaleMaximum - redundancy + (genome.fingerprint.stability > 68 ? logicCalibration.exerciseGenome.contextStabilityLift : 0));
  const selectedMuscles = context.sportMovement ? getMovementMuscles(context.sportMovement) : [];
  const selectedSignals = context.sportMovement ? getMovementSignals(context.sportMovement) : [];
  const muscleMatch = selectedMuscles.length ? overlap([...exercise.primaryMuscles, ...exercise.secondaryMuscles], selectedMuscles) : .4;
  const signalText = genome.movementPatterns.join(" ").toLowerCase();
  const signalMatch = selectedSignals.length ? selectedSignals.filter((signal) => signalText.includes(signal.replace("singleLeg", "unilateral")) || exercise.qualities.some((quality) => quality.toLowerCase().includes(signal.toLowerCase()))).length / selectedSignals.length : .4;
  const sportTransfer = clamp((muscleMatch * logicCalibration.exerciseGenome.sportMuscleMatchWeight + signalMatch * logicCalibration.exerciseGenome.sportSignalMatchWeight + (genome.fingerprint.stability / logicCalibration.exerciseGenome.relativeScaleMaximum) * logicCalibration.exerciseGenome.sportStabilityMatchWeight) * logicCalibration.exerciseGenome.relativeScaleMaximum);
  const recoveryManageability = clamp(logicCalibration.exerciseGenome.relativeScaleMaximum - (genome.fatigue.systemic * logicCalibration.exerciseGenome.systemicRecoveryCostWeight + genome.fatigue.technical * logicCalibration.exerciseGenome.technicalRecoveryCostWeight + genome.fatigue.axial * logicCalibration.exerciseGenome.axialRecoveryCostWeight));
  const signals = { goalAlignment: genome.fingerprint[goalKey], stackDistinctness: marginalValue, sportActionMatch: sportTransfer, recoveryManageability };
  const contextualScore = clamp(signals.goalAlignment * logicCalibration.exerciseGenome.contextualGoalWeight + signals.stackDistinctness * logicCalibration.exerciseGenome.contextualDistinctnessWeight + signals.sportActionMatch * logicCalibration.exerciseGenome.contextualSportWeight);
  const goalLabel = goalKey === "sfr" ? "repeatable training value" : goalKey;
  const strengths = [`${signals.goalAlignment}/100 ${goalLabel} alignment`, `${signals.sportActionMatch}/100 mechanical match for the selected sport action`, `${signals.stackDistinctness}/100 stack distinctness`, `${signals.recoveryManageability}/100 recovery manageability`];
  const limits = [redundancy > logicCalibration.exerciseGenome.highRedundancyReview ? "Overlaps meaningfully with the current stack; its added value is reduced." : "Adds a relatively distinct exposure to the current stack.", genome.fatigue.systemic > logicCalibration.exerciseGenome.highFatigueReview ? "Higher systemic and technical cost may limit placement or volume." : "Fatigue profile is comparatively manageable for its intended adaptation."];
  const explanation = redundancy > logicCalibration.exerciseGenome.highRedundancyReview ? `This exercise has solid intrinsic ${goalLabel} value, but the current stack already overlaps with its muscle and movement profile. It is most useful if it replaces a similar exercise or if its resistance profile solves a specific gap.` : `This exercise is a useful addition because its ${goalLabel} profile and sport-action match add value without duplicating the current stack heavily.`;
  return { contextualScore, grade: gradeFor(contextualScore), marginalValue, redundancy, sportTransfer, signals, explanation, strengths, limits };
}

export function getWorkoutGenome(workout: Exercise[]) {
  const patterns = workout.flatMap((exercise) => getExerciseGenome(exercise).movementPatterns);
  const muscles = workout.flatMap((exercise) => [...exercise.primaryMuscles, ...exercise.secondaryMuscles]);
  const countBy = (items: string[]) => Object.entries(items.reduce<Record<string, number>>((all, item) => ({ ...all, [item]: (all[item] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1]);
  const pairScores = workout.flatMap((exercise, index) => workout.slice(index + 1).map((peer) => similarity(exercise, peer)));
  const redundancy = pairScores.length ? clamp(pairScores.reduce((sum, score) => sum + score, 0) / pairScores.length) : 0;
  const gaps = ["Horizontal push", "Horizontal pull", "Squat", "Hinge", "Rotation", "Carry"].filter((pattern) => !patterns.includes(pattern));
  return { dominantPatterns: countBy(patterns).slice(0, 4), dominantMuscles: countBy(muscles).slice(0, 5), redundancy, gaps };
}
