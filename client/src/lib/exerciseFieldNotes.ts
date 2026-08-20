import type { Exercise } from "./exerciseCatalog";

export type ExerciseFieldNote = {
  patternLabel: string;
  coachingCue: string;
  equipmentLens: string;
  selectionLens: string;
};

const movementNotes: Record<string, Pick<ExerciseFieldNote, "patternLabel" | "coachingCue" | "selectionLens">> = {
  "Horizontal push": {
    patternLabel: "Horizontal push",
    coachingCue: "Keep the ribs quiet and drive through a controlled press path.",
    selectionLens: "Use this to build pressing force while keeping the sport-specific movement demand in view.",
  },
  "Vertical push": {
    patternLabel: "Vertical push",
    coachingCue: "Finish tall through the torso; do not trade shoulder motion for rib flare.",
    selectionLens: "Use this to develop overhead force and shoulder-control exposure.",
  },
  "Horizontal pull": {
    patternLabel: "Horizontal pull",
    coachingCue: "Set the torso first, then drive the elbow through the intended pull path.",
    selectionLens: "Use this to add pulling strength and scapular-control work to the session.",
  },
  "Vertical pull": {
    patternLabel: "Vertical pull",
    coachingCue: "Start with shoulder control, then pull the elbows toward the intended line.",
    selectionLens: "Use this to build upper-body pulling capacity without duplicating horizontal rows.",
  },
  "Knee dominant": {
    patternLabel: "Knee dominant",
    coachingCue: "Keep pressure balanced through the foot and let the knee travel on a controlled path.",
    selectionLens: "Use this to build lower-body force through a knee-dominant pattern.",
  },
  "Hip hinge": {
    patternLabel: "Hip hinge",
    coachingCue: "Load the hips while keeping the trunk braced and the bar or handle path deliberate.",
    selectionLens: "Use this to develop posterior-chain force and hip-dominant coordination.",
  },
  "Rotation": {
    patternLabel: "Rotation",
    coachingCue: "Control the pelvis and ribcage before expressing rotation through the intended range.",
    selectionLens: "Use this to train force transfer rather than simply adding more trunk volume.",
  },
  "Anti-rotation": {
    patternLabel: "Anti-rotation",
    coachingCue: "Brace first and resist unwanted torso turn while keeping the stance quiet.",
    selectionLens: "Use this to add trunk-control exposure alongside rotational or unilateral work.",
  },
  "Carry": {
    patternLabel: "Carry",
    coachingCue: "Walk tall, keep the load close, and let the gait stay smooth rather than rushed.",
    selectionLens: "Use this to build loaded posture, grip, and gait control.",
  },
  "Locomotion": {
    patternLabel: "Locomotion",
    coachingCue: "Keep each repetition crisp enough that position and intent stay recognizable.",
    selectionLens: "Use this to add conditioning or change-of-direction exposure without replacing the key strength pattern.",
  },
};

function fallbackNote(exercise: Exercise): Pick<ExerciseFieldNote, "patternLabel" | "coachingCue" | "selectionLens"> {
  return {
    patternLabel: exercise.movement,
    coachingCue: "Use a controlled range and keep the working position consistent from rep to rep.",
    selectionLens: `Use this as a ${exercise.movement.toLowerCase()} option when its muscle and sport-transfer fit supports the session goal.`,
  };
}

export function getExerciseFieldNote(exercise: Exercise): ExerciseFieldNote {
  const movement = movementNotes[exercise.movement] ?? fallbackNote(exercise);
  const equipmentLens = exercise.equipment.toLowerCase().includes("cable")
    ? "Cable lens: adjust the line of pull, stance, and handle height to fit the intended movement path."
    : exercise.equipment.toLowerCase().includes("dumbbell")
      ? "Free-weight lens: use the implement to match the needed range and control demand."
      : exercise.equipment.toLowerCase().includes("body")
        ? "Bodyweight lens: earn clean positions before adding speed, range, or density."
        : "Equipment lens: keep the resistance path and setup repeatable across working sets.";

  return { ...movement, equipmentLens };
}
