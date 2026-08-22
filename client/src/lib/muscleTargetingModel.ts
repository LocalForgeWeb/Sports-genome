import type { Exercise } from "./exerciseCatalog";
import { getExerciseStudyCalibration } from "./exerciseStudyCalibration";

export type MuscleTargetingRole = "Prime mover" | "Synergist" | "Stabilizer";
export type MuscleEvidenceTier = "Direct longitudinal exercise evidence" | "Conditional mechanics ranking";

export interface MechanicsFactor {
  id: "jointAngles" | "externalForceVector" | "externalMoment" | "momentArms" | "architecture" | "forceLength" | "forceVelocity" | "contractionType" | "biarticularPosition" | "stabilization";
  label: string;
  context: string;
  status: "Configured descriptor" | "Conditional inference" | "Not individually measured";
  rankingInfluence: number;
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
  const jointAngleSignal = calibration?.rangeOfMotion === "Full" ? 72 : calibration?.rangeOfMotion === "Long-length partial" ? 78 : calibration?.rangeOfMotion === "Individualized" ? 64 : 58;
  const forceVectorSignal = /cable/.test(text) ? 73 : /machine|smith|leg press/.test(text) ? 63 : 68;
  const externalMomentSignal = /squat|deadlift|hinge|press|row|lunge|split/.test(text) ? 74 : 58;
  const momentArmSignal = /curl|extension|raise|calf|leg curl/.test(text) ? 68 : /squat|hinge|press|row/.test(text) ? 64 : 56;
  const architectureSignal = ["hamstrings", "quads", "calves", "chest", "frontDelts", "sideDelts", "rearDelts", "biceps", "triceps"].includes(muscle) ? 66 : 56;
  const forceLengthSignal = lengthened ? 82 : /extension|kickback|squeeze|cable fly/.test(text) ? 50 : 62;
  const forceVelocitySignal = ballistic ? 86 : 54;
  const contractionSignal = eccentric ? 82 : ballistic ? 68 : 58;
  const biarticularSignal = isBiarticular(muscle) ? 72 : 50;
  const stabilizationSignal = role === "Stabilizer" ? (unilateral ? 82 : 66) : unilateral ? 68 : 48;
  const mechanicsFactors: MechanicsFactor[] = [
    { id: "jointAngles", label: "Joint-angle context", context: "The catalog records movement and ROM context, not the athlete’s measured joint angles or technique.", status: "Not individually measured", rankingInfluence: jointAngleSignal },
    { id: "externalForceVector", label: "External-force vector", context: setup.forceVector, status: "Configured descriptor", rankingInfluence: forceVectorSignal },
    { id: "externalMoment", label: "External moment", context: "External moment is inferred from load placement, movement direction, and range—not calculated from a recorded load vector.", status: "Conditional inference", rankingInfluence: externalMomentSignal },
    { id: "momentArms", label: "Moment-arm context", context: "Muscle leverage changes with joint position, geometry, and method; no fixed individual moment arm is assumed.", status: "Conditional inference", rankingInfluence: momentArmSignal },
    { id: "architecture", label: "Architecture context", context: "Architecture informs broad force/excursion capacity context but is not available as a personal measurement.", status: "Not individually measured", rankingInfluence: architectureSignal },
    { id: "forceLength", label: "Force–length context", context: lengthened ? "The named setup plausibly preserves resistance in a relatively lengthened region; exact operating length is not measured." : setup.forceLength, status: "Conditional inference", rankingInfluence: forceLengthSignal },
    { id: "forceVelocity", label: "Force–velocity context", context: ballistic ? "Explosive intent changes force–velocity demands; repetition velocity is not measured." : "Tempo and velocity can alter force capacity; repetition velocity is not measured.", status: "Not individually measured", rankingInfluence: forceVelocitySignal },
    { id: "contractionType", label: "Contraction-type context", context: eccentric ? "The named task includes a substantial eccentric-control context." : "The catalog does not infer a unique contraction distribution without execution data.", status: "Conditional inference", rankingInfluence: contractionSignal },
    { id: "biarticularPosition", label: "Biarticular-position context", context: isBiarticular(muscle) ? "This muscle can span more than one joint, so proximal and distal positions can change its contribution." : "Biarticular-position effects are not a primary driver for this listed muscle.", status: isBiarticular(muscle) ? "Conditional inference" : "Configured descriptor", rankingInfluence: biarticularSignal },
    { id: "stabilization", label: "Stabilization and co-contraction", context: role === "Stabilizer" || unilateral ? "Positional control can require co-contraction; a simple optimization can understate antagonist contribution." : "Co-contraction can still occur, but it is not directly measured for this exercise.", status: "Conditional inference", rankingInfluence: stabilizationSignal },
  ];
  const rolePrior: Record<MuscleTargetingRole, number> = { "Prime mover": 78, Synergist: 50, Stabilizer: 30 };
  const mechanicsScore = clamp(rolePrior[role] * 0.5 + mechanicsFactors.reduce((sum, factor) => sum + factor.rankingInfluence, 0) / mechanicsFactors.length * 0.5);
  const score = directNote ? Math.max(mechanicsScore, 82) : mechanicsScore;

  return {
    score,
    evidenceTier: directNote ? "Direct longitudinal exercise evidence" : "Conditional mechanics ranking",
    directEvidenceNote: directNote,
    mechanicsFactors,
    uncertainty: directNote ? "Direct adaptation evidence is prioritized above the mechanics ranking for this exercise–muscle pair. The displayed score remains a comparative planning rank, not a measured force or guaranteed outcome." : "This is a conditional mechanics ranking. Its inputs are transparent heuristic influences, not scientific constants; joint angles, load vector, moment arms, architecture, activation, and co-contraction are not individually measured here.",
  };
}
