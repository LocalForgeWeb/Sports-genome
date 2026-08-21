export type EvidenceConfidence = "High" | "Moderate" | "Developing";

export interface EvidenceCoverage {
  confidence: EvidenceConfidence;
  sourceRange: string;
  directScope: string;
  planningBoundary: string;
}

const sportConfidence: Record<string, EvidenceConfidence> = {
  wrestling: "High", "american-football": "High", basketball: "High", soccer: "High", baseball: "High", "track-and-field": "Moderate", swimming: "High", tennis: "High", volleyball: "High", boxing: "High", mma: "Moderate", "brazilian-jiu-jitsu": "Moderate", "ice-hockey": "High", lacrosse: "Moderate", rugby: "High", golf: "High", gymnastics: "Moderate", rowing: "High", skiing: "Moderate", "olympic-weightlifting": "High",
};

export function sportEvidenceCoverage(sportId: string): EvidenceCoverage {
  const confidence = sportConfidence[sportId] || "Developing";
  return {
    confidence,
    sourceRange: "3–6 source-reviewed biomechanics or match-demand records",
    directScope: "Action phases, position or event context, and measured demand descriptors are evidence-indexed for this sport.",
    planningBoundary: "Exercise suggestions share physical qualities with the action; they do not replace technical practice or guarantee transfer.",
  };
}

export function exerciseEvidenceCoverage(exercise: { category?: string; movementPattern?: string; equipment?: string }): EvidenceCoverage {
  const descriptor = `${exercise.category || ""} ${exercise.movementPattern || ""} ${exercise.equipment || ""}`.toLowerCase();
  const confidence: EvidenceConfidence = /press|row|pull|squat|lunge|deadlift|hinge|cable|fly|rotation|plyometric|jump|sled/.test(descriptor) ? "High" : /arm|calf|serratus|scap/.test(descriptor) ? "Moderate" : "Developing";
  return {
    confidence,
    sourceRange: "Exercise-family mechanics evidence register",
    directScope: "Movement pattern, setup modifiers, and acute mechanics are source-indexed at the exercise-family level.",
    planningBoundary: "The displayed indices remain catalog models; EMG or acute biomechanics do not by themselves prove long-term adaptation or sport-skill transfer.",
  };
}
