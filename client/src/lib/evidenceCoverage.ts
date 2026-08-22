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

export function exerciseEvidenceCoverage(exercise: { name?: string; category?: string; movement?: string; movementPattern?: string; equipment?: string; evidenceContext?: { rangeOfMotion: string; comparisonRangeContexts?: string[]; evidenceKind: string; sourceRange: string; summary: string; counterevidence: string } }): EvidenceCoverage {
  const descriptor = `${exercise.name || ""} ${exercise.category || ""} ${exercise.movement || ""} ${exercise.movementPattern || ""} ${exercise.equipment || ""}`.toLowerCase();
  if (exercise.evidenceContext) return {
    confidence: exercise.evidenceContext.evidenceKind === "Direct longitudinal adaptation" ? "High" : "Moderate",
    sourceRange: `${exercise.evidenceContext.evidenceKind} · ${exercise.evidenceContext.sourceRange} · ROM: ${[exercise.evidenceContext.rangeOfMotion, ...(exercise.evidenceContext.comparisonRangeContexts || [])].join(" vs ")}`,
    directScope: exercise.evidenceContext.summary,
    planningBoundary: exercise.evidenceContext.counterevidence,
  };
  if (/seated.*leg curl/.test(descriptor)) return {
    confidence: "High",
    sourceRange: "Direct 12-week MRI intervention · Maeo et al. 2021 (PMID 33009197)",
    directScope: "Seated versus prone leg-curl training produced greater whole- and biarticular-hamstring volume gains in the studied protocol.",
    planningBoundary: "This source supports a protocol-specific tendency, not a guaranteed individual outcome or a complete hamstring-program ranking.",
  };
  if (/overhead.*(triceps|extension)|(triceps|extension).*overhead/.test(descriptor)) return {
    confidence: "High",
    sourceRange: "Direct 12-week MRI intervention · Maeo et al. 2023 (PMID 35819335)",
    directScope: "Overhead elbow-extension training produced larger measured triceps gains than a neutral-arm comparator in the studied protocol.",
    planningBoundary: "The result is a shoulder-position and muscle-length context note, not a universal exercise mandate or a shoulder-tolerance assessment.",
  };
  if (/standing.*calf/.test(descriptor)) return {
    confidence: "High",
    sourceRange: "Direct 12-week MRI intervention · Kinoshita et al. 2023 (PMID 38156065)",
    directScope: "Standing calf raises produced greater gastrocnemius and whole-triceps-surae growth than seated training; soleus growth was similar in the studied protocol.",
    planningBoundary: "This is a gastrocnemius-bias note, not evidence that seated calf work lacks value for soleus or every training plan.",
  };
  if (/nordic/.test(descriptor)) return {
    confidence: "High",
    sourceRange: "Hamstring-adaptation RCT plus prevention-program meta-analysis · PMIDs 40586278 and 30808663",
    directScope: "Nordic work is a knee-flexion, lengthened-eccentric hamstring pattern with selective adaptation evidence and injury-rate reduction when included in prevention programs.",
    planningBoundary: "EMG is not used as a growth score, and program-level injury reduction does not promise prevention or prescribe a dose for an individual.",
  };
  if (/squat|hip thrust/.test(descriptor)) return {
    confidence: "High",
    sourceRange: "MRI intervention and lower-body biomechanics evidence · PMIDs 37877099, 23604798, and 40113586",
    directScope: "Squats and hip thrusts both supported glute growth in one MRI trial; squats produced greater quadriceps and adductor growth in that protocol.",
    planningBoundary: "Depth, technique, loading, and individual response alter demand. Acute EMG or modeled force does not become a hypertrophy rank in this app.",
  };
  if (/bench press/.test(descriptor)) return {
    confidence: "Moderate",
    sourceRange: "Bench-angle biomechanics, EMG, and regional adaptation evidence · PMIDs 33555823, 33049982, and 36334406",
    directScope: "Angle changes joint demand and regional excitation; one intervention supports possible regional pectoralis adaptation differences.",
    planningBoundary: "Bench angle is shown as a mechanical descriptor, not an EMG-derived hypertrophy score or universal optimal setup.",
  };
  if (/romanian|\brdl\b|stiff.?leg deadlift/.test(descriptor)) return {
    confidence: "Moderate",
    sourceRange: "Posterior-chain RCT and deadlift-variant mechanics evidence · PMIDs 40586278 and 32107499",
    directScope: "Romanian and stiff-leg deadlift variants are hip-hinge/posterior-chain patterns with regional-response and acute mechanics evidence.",
    planningBoundary: "Technique and individual response alter regional demand; acute excitation evidence is not converted into a deterministic growth score.",
  };
  if (exercise.equipment === "Machine" || ["Barbell", "Dumbbells", "Kettlebell", "Free weights"].includes(exercise.equipment || "")) return {
    confidence: "High",
    sourceRange: "Matched-modality trials and machine-versus-free-weight meta-analysis · PMIDs 37535335 and 34609100",
    directScope: "Matched machine and free-weight programs can produce similar hypertrophy, while strength tends to transfer most specifically to the trained modality.",
    planningBoundary: "Equipment is not ranked as inherently better for muscle growth; access, skill, stability, and the target task remain separate planning inputs.",
  };
  const confidence: EvidenceConfidence = /press|row|pull|squat|lunge|deadlift|hinge|cable|fly|rotation|plyometric|jump|sled/.test(descriptor) ? "High" : /arm|calf|serratus|scap/.test(descriptor) ? "Moderate" : "Developing";
  return {
    confidence,
    sourceRange: "Exercise-family mechanics evidence register",
    directScope: "Movement pattern, setup modifiers, and acute mechanics are source-indexed at the exercise-family level.",
    planningBoundary: "The displayed indices remain catalog models; EMG or acute biomechanics do not by themselves prove long-term adaptation or sport-skill transfer.",
  };
}
