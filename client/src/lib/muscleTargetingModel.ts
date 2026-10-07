import type { Exercise } from "./exerciseCatalog";
import { getExerciseStudyCalibration } from "./exerciseStudyCalibration";
import { logicCalibration } from "./evidenceTraceability";
import { descriptorFor, type TargetingPredicates } from "./exerciseDescriptors";

/**
 * v2 (50-exercise brief): expansion records state the inputs below in their descriptor instead of
 * having them read from the name, and a direct-evidence floor needs both the study and a stated
 * association with this exact variation. The original records' inputs and scores are unchanged.
 */
export const MUSCLE_TARGETING_REVISION = "muscle_targeting_v2";

export type MuscleTargetingRole = "Prime mover" | "Synergist" | "Stabilizer";
export type MuscleEvidenceTier = "Direct longitudinal exercise evidence" | "Conditional mechanics ranking";

export interface MechanicsFactor {
  id: "jointAngles" | "externalForceVector" | "externalMoment" | "momentArms" | "architecture" | "forceLength" | "forceVelocity" | "contractionType" | "biarticularPosition" | "stabilization";
  label: string;
  context: string;
  status: "Configured descriptor" | "Conditional inference" | "Not individually measured";
  rankingInfluence: number;
  sources?: { label: string; url: string }[];
}

export interface MuscleTargetingEstimate {
  score: number;
  evidenceTier: MuscleEvidenceTier;
  directEvidenceNote?: string;
  mechanicsFactors: MechanicsFactor[];
  uncertainty: string;
}

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const textFor = (exercise: Exercise) => `${exercise.name} ${exercise.movement} ${exercise.equipment} ${exercise.qualities.join(" ")}`.toLowerCase();
const isBiarticular = (muscle: string) => ["hamstrings", "calves", "biceps", "triceps", "rectusFemoris"].includes(muscle);
const pubmed = (pmid: string) => `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;

export const mechanicsEvidenceSources = [
  { label: "Lieber & Ward, 2011 · architecture and functional demand", url: pubmed("21502118") },
  { label: "Arnold et al., 2013 · moment-arm estimation methods", url: pubmed("23998280") },
  { label: "Rugg et al., 2019 · shoulder moment-arm systematic review", url: pubmed("30411350") },
  { label: "Hofmann et al., 2019 · static optimization and antagonist activity", url: pubmed("31668905") },
  { label: "Ishikawa & Komi, 2006 · muscle–tendon dynamics review", url: pubmed("16871004") },
  { label: "Ackland et al., 2012 · model sensitivity analysis", url: pubmed("22507351") },
] as const;

function resistanceContext(text: string, stated?: TargetingPredicates["forceVector"]) {
  if (stated === "band") return { forceVector: "Band line; the band and how far it is stretched set the external force.", forceLength: "Band tension rises with stretch, so the length–tension context depends on the band and setup." };
  if (stated === "self") return { forceVector: "Self-applied resistance (your own hand); no external load is recorded.", forceLength: "A held position: the muscle works at one length per hold." };
  if (stated === "cable" || (!stated && /cable/.test(text))) return { forceVector: "Cable line of pull; the athlete’s setup sets the external-force vector.", forceLength: "Cable line and joint position create a setup-dependent length–tension context." };
  if (stated === "guided" || (!stated && /machine|smith|leg press/.test(text))) return { forceVector: "Guided resistance path; machine geometry and setup alter the external-force vector.", forceLength: "Joint range and machine geometry create a setup-dependent length–tension context." };
  return { forceVector: "Gravity-dominant external force, modified by the load position and body orientation.", forceLength: "Joint position and usable range create a setup-dependent length–tension context." };
}

function directEvidenceNote(exercise: Exercise, muscle: string) {
  const calibration = getExerciseStudyCalibration(exercise);
  if (calibration?.kind !== "Direct longitudinal adaptation") return undefined;
  const matches = (
    (calibration.key === "seated-leg-curl" && muscle === "hamstrings") ||
    (calibration.key === "overhead-triceps-extension" && muscle === "triceps") ||
    (calibration.key === "standing-calf-raise" && muscle === "calves") ||
    (calibration.key === "squat-pattern" && ["quads", "adductors", "glutes"].includes(muscle)) ||
    (calibration.key === "nordic-hamstring" && muscle === "hamstrings") ||
    (calibration.key === "leg-extension-rom" && muscle === "quads") ||
    (calibration.key === "leg-press-rom" && muscle === "quads") ||
    // Expansion: the prone arm of the same seated-versus-prone trial (Maeo 2021).
    (calibration.key === "prone-leg-curl" && muscle === "hamstrings")
  );
  return matches ? calibration.summary : undefined;
}

/**
 * The inputs the ten factors read. An expansion record states them in its descriptor; an original
 * record has them read from its text by the rules the model has always used. Exported so the
 * diagnostics can show the inputs behind every factor.
 */
export function targetingPredicatesFor(exercise: Exercise): TargetingPredicates {
  const stated = descriptorFor(exercise.id)?.targeting;
  if (stated) return stated;
  const text = textFor(exercise);
  const lengthened = /romanian|\brdl\b|good morning|nordic|fly|pullover|deep squat/.test(text);
  return {
    forceVector: /cable/.test(text) ? "cable" : /machine|smith|leg press/.test(text) ? "guided" : "gravity",
    unilateral: /single|one.arm|split|lunge|step.up|bulgarian/.test(text) || exercise.qualities.includes("unilateral"),
    ballistic: /jump|throw|clean|snatch|plyometric|explosive|sprint/.test(text) || exercise.qualities.includes("power"),
    eccentric: /nordic|eccentric|depth|landing/.test(text),
    lengthened,
    broadMoment: /squat|deadlift|hinge|press|row|lunge|split/.test(text),
    momentArm: /curl|extension|raise|calf|leg curl/.test(text) ? "focused" : /squat|hinge|press|row/.test(text) ? "compound" : "default",
    forceLength: lengthened ? "lengthened" : /extension|kickback|squeeze|cable fly/.test(text) ? "shortened" : "default",
  };
}

export function buildMuscleTargetingEstimate(exercise: Exercise, muscle: string, role: MuscleTargetingRole): MuscleTargetingEstimate {
  const text = textFor(exercise);
  const inputs = targetingPredicatesFor(exercise);
  const setup = resistanceContext(text, descriptorFor(exercise.id)?.targeting.forceVector);
  const directNote = directEvidenceNote(exercise, muscle);
  const { unilateral, ballistic, eccentric, lengthened } = inputs;
  const calibration = getExerciseStudyCalibration(exercise);
  const targeting = logicCalibration.targeting;
  const jointAngleSignal = calibration?.rangeOfMotion === "Full" ? targeting.jointAngleFullRomSignal : calibration?.rangeOfMotion === "Long-length partial" ? targeting.jointAngleLongLengthSignal : calibration?.rangeOfMotion === "Individualized" ? targeting.jointAngleIndividualizedSignal : targeting.jointAngleFallbackSignal;
  // Band and self-applied resistance have no signal of their own in the calibration; they read as
  // the gravity default, which is what the original model gave every non-cable, non-machine task.
  const forceVectorSignal = inputs.forceVector === "cable" ? targeting.cableForceVectorSignal : inputs.forceVector === "guided" ? targeting.guidedForceVectorSignal : targeting.gravityForceVectorSignal;
  const externalMomentSignal = inputs.broadMoment ? targeting.broadMomentSignal : targeting.defaultMomentSignal;
  const momentArmSignal = inputs.momentArm === "focused" ? targeting.focusedMomentArmSignal : inputs.momentArm === "compound" ? targeting.compoundMomentArmSignal : targeting.defaultMomentArmSignal;
  const architectureSignal = ["hamstrings", "quads", "calves", "chest", "frontDelts", "sideDelts", "rearDelts", "biceps", "triceps"].includes(muscle) ? targeting.majorArchitectureSignal : targeting.defaultArchitectureSignal;
  const forceLengthSignal = inputs.forceLength === "lengthened" ? targeting.lengthenedForceLengthSignal : inputs.forceLength === "shortened" ? targeting.shortenedForceLengthSignal : targeting.defaultForceLengthSignal;
  const forceVelocitySignal = ballistic ? targeting.ballisticForceVelocitySignal : targeting.defaultForceVelocitySignal;
  const contractionSignal = eccentric ? targeting.eccentricContractionSignal : ballistic ? targeting.ballisticContractionSignal : targeting.defaultContractionSignal;
  const biarticularSignal = isBiarticular(muscle) ? targeting.biarticularSignal : targeting.nonBiarticularSignal;
  const stabilizationSignal = role === "Stabilizer" ? (unilateral ? targeting.unilateralStabilizerSignal : targeting.stabilizerSignal) : unilateral ? targeting.unilateralSynergistSignal : targeting.defaultStabilizationSignal;
  const mechanicsFactors: MechanicsFactor[] = [
    { id: "jointAngles", label: "Joint-angle context", context: "The catalog records movement and ROM context, not the athlete’s measured joint angles or technique.", status: "Not individually measured", rankingInfluence: jointAngleSignal },
    { id: "externalForceVector", label: "External-force vector", context: setup.forceVector, status: "Configured descriptor", rankingInfluence: forceVectorSignal },
    { id: "externalMoment", label: "External moment", context: "External moment is inferred from load placement, movement direction, and range—not calculated from a recorded load vector.", status: "Conditional inference", rankingInfluence: externalMomentSignal },
    { id: "momentArms", label: "Moment-arm context", context: "Muscle leverage changes with joint position, geometry, and method; no fixed individual moment arm is assumed.", status: "Conditional inference", rankingInfluence: momentArmSignal, sources: [mechanicsEvidenceSources[1], mechanicsEvidenceSources[2]] },
    { id: "architecture", label: "Architecture context", context: "Architecture informs broad force/excursion capacity context but is not available as a personal measurement.", status: "Not individually measured", rankingInfluence: architectureSignal, sources: [mechanicsEvidenceSources[0]] },
    { id: "forceLength", label: "Force–length context", context: lengthened ? "The named setup plausibly preserves resistance in a relatively lengthened region; exact operating length is not measured." : setup.forceLength, status: "Conditional inference", rankingInfluence: forceLengthSignal, sources: [mechanicsEvidenceSources[0], mechanicsEvidenceSources[4], mechanicsEvidenceSources[5]] },
    { id: "forceVelocity", label: "Force–velocity context", context: ballistic ? "Explosive intent changes force–velocity demands; repetition velocity is not measured." : "Tempo and velocity can alter force capacity; repetition velocity is not measured.", status: "Not individually measured", rankingInfluence: forceVelocitySignal, sources: [mechanicsEvidenceSources[0], mechanicsEvidenceSources[4]] },
    { id: "contractionType", label: "Contraction-type context", context: eccentric ? "The named task includes a substantial eccentric-control context." : "The catalog does not infer a unique contraction distribution without execution data.", status: "Conditional inference", rankingInfluence: contractionSignal },
    { id: "biarticularPosition", label: "Biarticular-position context", context: isBiarticular(muscle) ? "This muscle can span more than one joint, so proximal and distal positions can change its contribution." : "Biarticular-position effects are not a primary driver for this listed muscle.", status: isBiarticular(muscle) ? "Conditional inference" : "Configured descriptor", rankingInfluence: biarticularSignal },
    { id: "stabilization", label: "Stabilization and co-contraction", context: role === "Stabilizer" || unilateral ? "Positional control can require co-contraction; a simple optimization can understate antagonist contribution." : "Co-contraction can still occur, but it is not directly measured for this exercise.", status: "Conditional inference", rankingInfluence: stabilizationSignal, sources: [mechanicsEvidenceSources[3]] },
  ];
  const rolePrior: Record<MuscleTargetingRole, number> = { "Prime mover": logicCalibration.targeting.primeMoverPrior, Synergist: logicCalibration.targeting.synergistPrior, Stabilizer: logicCalibration.targeting.stabilizerPrior };
  const mechanicsScore = clamp(rolePrior[role] * targeting.rolePriorWeight + mechanicsFactors.reduce((sum, factor) => sum + factor.rankingInfluence, 0) / mechanicsFactors.length * targeting.mechanicsFactorsWeight);
  const score = directNote ? Math.max(mechanicsScore, logicCalibration.targeting.directEvidenceRelativeFloor) : mechanicsScore;

  return {
    score,
    evidenceTier: directNote ? "Direct longitudinal exercise evidence" : "Conditional mechanics ranking",
    directEvidenceNote: directNote,
    mechanicsFactors,
    uncertainty: directNote ? "Direct adaptation evidence is prioritized above the mechanics ranking for this exercise–muscle pair. The displayed score remains a comparative planning rank, not a measured force or guaranteed outcome." : "This is a conditional mechanics ranking. Its inputs are transparent heuristic influences, not scientific constants; joint angles, load vector, moment arms, architecture, activation, and co-contraction are not individually measured here.",
  };
}
