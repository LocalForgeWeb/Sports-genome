import type { Exercise } from "./exerciseCatalog";
import { getExerciseStudyCalibration } from "./exerciseStudyCalibration";
import { logicCalibration } from "./evidenceTraceability";

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

function resistanceContext(text: string) {
  if (/cable/.test(text)) return { forceVector: "Cable line of pull; the athlete’s setup sets the external-force vector.", forceLength: "Cable line and joint position create a setup-dependent length–tension context." };
  if (/machine|smith|leg press/.test(text)) return { forceVector: "Guided resistance path; machine geometry and setup alter the external-force vector.", forceLength: "Joint range and machine geometry create a setup-dependent length–tension context." };
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
    (calibration.key === "leg-press-rom" && muscle === "quads")
  );
  return matches ? calibration.summary : undefined;
}

export function buildMuscleTargetingEstimate(exercise: Exercise, muscle: string, role: MuscleTargetingRole): MuscleTargetingEstimate {
  const text = textFor(exercise);
  const setup = resistanceContext(text);
  const directNote = directEvidenceNote(exercise, muscle);
  const unilateral = /single|one.arm|split|lunge|step.up|bulgarian/.test(text) || exercise.qualities.includes("unilateral");
  const ballistic = /jump|throw|clean|snatch|plyometric|explosive|sprint/.test(text) || exercise.qualities.includes("power");
  const eccentric = /nordic|eccentric|depth|landing/.test(text);
  const lengthened = /romanian|\brdl\b|good morning|nordic|fly|pullover|deep squat/.test(text);
  const calibration = getExerciseStudyCalibration(exercise);
  const targeting = logicCalibration.targeting;
  const jointAngleSignal = calibration?.rangeOfMotion === "Full" ? targeting.jointAngleFullRomSignal : calibration?.rangeOfMotion === "Long-length partial" ? targeting.jointAngleLongLengthSignal : calibration?.rangeOfMotion === "Individualized" ? targeting.jointAngleIndividualizedSignal : targeting.jointAngleFallbackSignal;
  const forceVectorSignal = /cable/.test(text) ? targeting.cableForceVectorSignal : /machine|smith|leg press/.test(text) ? targeting.guidedForceVectorSignal : targeting.gravityForceVectorSignal;
  const externalMomentSignal = /squat|deadlift|hinge|press|row|lunge|split/.test(text) ? targeting.broadMomentSignal : targeting.defaultMomentSignal;
  const momentArmSignal = /curl|extension|raise|calf|leg curl/.test(text) ? targeting.focusedMomentArmSignal : /squat|hinge|press|row/.test(text) ? targeting.compoundMomentArmSignal : targeting.defaultMomentArmSignal;
  const architectureSignal = ["hamstrings", "quads", "calves", "chest", "frontDelts", "sideDelts", "rearDelts", "biceps", "triceps"].includes(muscle) ? targeting.majorArchitectureSignal : targeting.defaultArchitectureSignal;
  const forceLengthSignal = lengthened ? targeting.lengthenedForceLengthSignal : /extension|kickback|squeeze|cable fly/.test(text) ? targeting.shortenedForceLengthSignal : targeting.defaultForceLengthSignal;
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
