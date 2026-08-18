/** Exercise Genome: intrinsic exercise vectors plus transparent contextual utility, redundancy, and marginal-value analysis. */
import { exercises, type Exercise, type Grade } from "@/lib/exerciseCatalog";
import { getMovementMuscles, getMovementSignals } from "@/lib/movementRecommendations";
import type { SportMovementProfile } from "@/lib/sportMovementDatabase";

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
  evidence: { quality: EvidenceQuality; confidence: "High" | "Moderate"; note: string };
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
  explanation: string;
  strengths: string[];
  limits: string[];
}

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const tierFor = (value: number): Exclude<Grade, "SS"> => value >= 88 ? "S" : value >= 76 ? "A" : value >= 62 ? "B" : value >= 46 ? "C" : "D";
const gradeFor = (value: number): Grade => value >= 91 ? "SS" : value >= 82 ? "S" : value >= 72 ? "A" : value >= 60 ? "B" : value >= 45 ? "C" : value >= 28 ? "D" : "F";
const gradeBase: Record<Grade, number> = { F: 28, D: 40, C: 52, B: 64, A: 76, S: 88, SS: 94 };

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
  if (patterns.includes("rotation")) ["Spinal rotation", "Hip rotation", "Trunk anti-rotation"].forEach((action) => actions.add(action));
  if (patterns.includes("carry") || patterns.includes("locomotion")) ["Trunk anti-lateral-flexion", "Hip stabilization", "Grip isometric"].forEach((action) => actions.add(action));
  if (patterns.includes("jump")) ["Hip extension", "Knee extension", "Ankle plantarflexion", "Eccentric landing control"].forEach((action) => actions.add(action));
  return Array.from(actions.size ? actions : new Set(["Joint-specific controlled motion"]));
}

function getResistanceProfile(exercise: Exercise): ExerciseGenome["resistanceProfile"] {
  const text = lower(exercise);
  if (/fly|pullover|romanian|rdl|good morning|deep squat|sissy/.test(text)) return { bias: "Lengthened", stickingRegion: "Bottom / stretched position", peakRegion: "Early-to-mid range", curve: [86, 94, 72, 45, 30] };
  if (/cable|band|squeeze|kickback|extension/.test(text)) return { bias: "Shortened", stickingRegion: "End-range contraction", peakRegion: "Late range", curve: [35, 48, 65, 84, 94] };
  if (/machine|smith|sled|leg press/.test(text)) return { bias: "Even", stickingRegion: "Machine-specific mid range", peakRegion: "Mid range", curve: [62, 74, 79, 73, 61] };
  return { bias: "Mid-range", stickingRegion: "Mid-range leverage transition", peakRegion: "Middle range", curve: [54, 72, 91, 70, 48] };
}

function getFingerprint(exercise: Exercise): Record<GenomeDimension, number> {
  const text = lower(exercise);
  const freeWeight = /barbell|dumbbell|kettlebell|sandbag|bodyweight/.test(text);
  const unilateral = /single|one-arm|one arm|split|lunge|step-up|bulgarian/.test(text) || exercise.qualities.includes("unilateral");
  const ballistic = /jump|throw|clean|snatch|plyometric|explosive|sprint/.test(text) || exercise.qualities.includes("power");
  const complex = /clean|snatch|turkish|get-up|pistol|muscle-up|handstand/.test(text);
  const hypertrophy = clamp(42 + qualityValue(exercise, "hypertrophy", 38, 8) + (exercise.equipment === "Machine" ? 6 : 0) + (/fly|curl|extension|raise|leg curl/.test(text) ? 5 : 0));
  const strength = clamp(34 + qualityValue(exercise, "strength", 45, 10) + (freeWeight ? 8 : 0) + (/barbell|trap bar|deadlift|squat|press/.test(text) ? 8 : 0));
  const power = clamp(12 + qualityValue(exercise, "power", 56, 8) + (ballistic ? 18 : 0) + (exercise.qualities.includes("jumping") ? 10 : 0));
  const stability = clamp(22 + qualityValue(exercise, "bracing", 32, 8) + (unilateral ? 20 : 0) + (freeWeight ? 10 : 0));
  const mobility = clamp(20 + (/overhead|deep|cossack|pullover|lunge|split squat/.test(text) ? 40 : 14) + (unilateral ? 8 : 0));
  const skill = clamp(18 + (freeWeight ? 16 : 4) + (unilateral ? 15 : 0) + (ballistic ? 18 : 0) + (complex ? 22 : 0));
  const fatigue = clamp(25 + (strength > 75 ? 25 : 0) + (ballistic ? 12 : 0) + (/deadlift|squat|good morning|clean|snatch/.test(text) ? 18 : 0) + (unilateral ? 6 : 0));
  const practicality = clamp(84 - (exercise.equipment === "Machine" ? 18 : 0) - (/barbell|rack|sled/.test(text) ? 16 : 0) - (complex ? 9 : 0));
  return { hypertrophy, strength, power, stability, mobility, sfr: clamp(hypertrophy - fatigue * 0.34 + 30), skill, practicality };
}

function getMuscleProfile(exercise: Exercise, fingerprint: Record<GenomeDimension, number>) {
  const profile = [...exercise.primaryMuscles.map((muscle) => ({ muscle, role: "Prime mover" as const })), ...exercise.secondaryMuscles.map((muscle) => ({ muscle, role: exercise.qualities.includes("bracing") && ["abs", "obliques", "lowerBack"].includes(muscle) ? "Stabilizer" as const : "Synergist" as const }))];
  return profile.map(({ muscle, role }, index) => {
    const base = gradeBase[exercise.muscleGrade] - (role === "Prime mover" ? index * 3 : 24 + index * 4);
    const contribution = clamp(base + (role === "Stabilizer" ? -7 : 0));
    const lengthened = getResistanceProfile(exercise).bias === "Lengthened" ? clamp(contribution - 3) : clamp(contribution * .6);
    const peak = getResistanceProfile(exercise).bias === "Shortened" ? clamp(contribution - 3) : clamp(contribution * .58);
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
      why: role === "Prime mover" ? `${anatomicalLabels[muscle] || muscle} produces the primary force in this ${exercise.movement.toLowerCase()} pattern.` : role === "Stabilizer" ? `${anatomicalLabels[muscle] || muscle} resists unwanted motion and helps maintain force transfer while the prime movers work.` : `${anatomicalLabels[muscle] || muscle} assists the primary motion or maintains joint position through the working range.`,
    };
  });
}

export function buildExerciseGenome(exercise: Exercise): ExerciseGenome {
  const fingerprint = getFingerprint(exercise);
  const patterns = getMovementPatterns(exercise);
  const text = lower(exercise);
  const unilateral = /single|one-arm|one arm|split|lunge|step-up|bulgarian/.test(text) || exercise.qualities.includes("unilateral");
  const chain = /push-up|pull-up|chin-up|crawl|carry|jump|bodyweight/.test(text) ? "Closed" : unilateral && /cable|dumbbell|kettlebell/.test(text) ? "Mixed" : "Open";
  const fatigueBase = clamp(100 - fingerprint.sfr + 16);
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
    fatigue: { local: fatigueBase, systemic: clamp(fatigueBase + (fingerprint.strength > 75 ? 12 : -4)), grip: clamp((/carry|deadlift|row|pull|farmer|hang/.test(text) ? 62 : 16) + (fingerprint.strength > 75 ? 8 : 0)), axial: clamp(/squat|deadlift|good morning|carry|overhead/.test(text) ? 70 : 22), technical: fingerprint.skill },
    practicality: { setup: clamp(fingerprint.practicality + (exercise.equipment === "Bodyweight" ? 9 : 0)), space: clamp(fingerprint.practicality + (/carry|sled|sprint/.test(text) ? -32 : 0)), accessibility: clamp(fingerprint.practicality), homeGym: clamp(fingerprint.practicality + (/machine|sled/.test(text) ? -34 : 0)), supersetEase: clamp(90 - fatigueBase * .62) },
    evidence: { quality: fingerprint.skill > 75 ? "Context-sensitive — coaching inference" : "Moderate — biomechanical inference", confidence: fingerprint.skill > 75 ? "Moderate" : "High", note: "Values are standardized estimates that summarize movement mechanics and training-practice inference; individual execution, loading, and programming change the result." },
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
  return clamp((muscle * .4 + movement * .26 + profile * .14 + qualities * .2) * 100);
}

export function analyzeExerciseContext(exercise: Exercise, context: GenomeContext): GenomeContextAnalysis {
  const genome = getExerciseGenome(exercise);
  const goalKey: GenomeDimension = /muscle|hypertrophy/i.test(context.goal) ? "hypertrophy" : /strength/i.test(context.goal) ? "strength" : /capacity|endurance/i.test(context.goal) ? "sfr" : "power";
  const peers = context.currentWorkout.filter((item) => item.id !== exercise.id);
  const redundancy = peers.length ? clamp(peers.reduce((sum, item) => sum + similarity(exercise, item), 0) / peers.length) : 10;
  const marginalValue = clamp(100 - redundancy + (genome.fingerprint.stability > 68 ? 4 : 0));
  const selectedMuscles = context.sportMovement ? getMovementMuscles(context.sportMovement) : [];
  const selectedSignals = context.sportMovement ? getMovementSignals(context.sportMovement) : [];
  const muscleMatch = selectedMuscles.length ? overlap([...exercise.primaryMuscles, ...exercise.secondaryMuscles], selectedMuscles) : .4;
  const signalText = genome.movementPatterns.join(" ").toLowerCase();
  const signalMatch = selectedSignals.length ? selectedSignals.filter((signal) => signalText.includes(signal.replace("singleLeg", "unilateral")) || exercise.qualities.some((quality) => quality.toLowerCase().includes(signal.toLowerCase()))).length / selectedSignals.length : .4;
  const sportTransfer = clamp((muscleMatch * .54 + signalMatch * .3 + (genome.fingerprint.stability / 100) * .16) * 100);
  const contextualScore = clamp(genome.fingerprint[goalKey] * .52 + marginalValue * .24 + sportTransfer * .24);
  const goalLabel = goalKey === "sfr" ? "repeatable training value" : goalKey;
  const strengths = [`${genome.fingerprint[goalKey]}/100 ${goalLabel} potential`, `${sportTransfer}/100 mechanical match for the selected sport action`, `${marginalValue}/100 marginal value against the current stack`];
  const limits = [redundancy > 62 ? "Overlaps meaningfully with the current stack; its added value is reduced." : "Adds a relatively distinct exposure to the current stack.", genome.fatigue.systemic > 70 ? "Higher systemic and technical cost may limit placement or volume." : "Fatigue profile is comparatively manageable for its intended adaptation."];
  const explanation = redundancy > 62 ? `This exercise has solid intrinsic ${goalLabel} value, but the current stack already overlaps with its muscle and movement profile. It is most useful if it replaces a similar exercise or if its resistance profile solves a specific gap.` : `This exercise is a useful addition because its ${goalLabel} profile and sport-action match add value without duplicating the current stack heavily.`;
  return { contextualScore, grade: gradeFor(contextualScore), marginalValue, redundancy, sportTransfer, explanation, strengths, limits };
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
