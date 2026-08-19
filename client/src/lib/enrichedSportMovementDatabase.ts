/**
 * Research-enriched sport movement profiles.
 * Each record contains phase-aware muscle roles, joint actions, exercise rationale, source links,
 * and a confidence label. Values support training decisions; they are not medical assessments.
 */
export type EnrichedSportMovement = {
  id: string;
  sportId: string;
  label: string;
  movementFamily: string;
  bodyActions: string[];
  jointActions: string[];
  primeMovers: string[];
  assistingMuscles: string[];
  stabilizers: string[];
  contractionRoles: string[];
  commonForceOrSkillDemand: string;
  recommendedExercisePatterns: string[];
  recommendedExercises: string[];
  transferRationale: string;
  exerciseSelectionCautions: string;
  evidenceConfidence: string;
  sources: string[];
  sourceSummary: string;
};

export const enrichedSportMovements: EnrichedSportMovement[] = [
  {
    "id": "wrestling-1",
    "sportId": "wrestling",
    "label": "penetration step",
    "movementFamily": "penetration and entry",
    "bodyActions": [
      "step deeply with one leg while lowering the hips and maintaining forward projection"
    ],
    "jointActions": [
      "unilateral hip/knee flexion",
      "ankle dorsiflexion",
      "contralateral hip extension",
      "trunk anti-rotation"
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps",
      "adductor magnus",
      "soleus"
    ],
    "assistingMuscles": [
      "hamstrings",
      "gluteus medius",
      "gastrocnemius",
      "pectoralis major"
    ],
    "stabilizers": [
      "obliquus externus abdominis",
      "transversus abdominis",
      "tibialis anterior",
      "scapular stabilizers"
    ],
    "contractionRoles": [
      "eccentric entry absorption followed by concentric leg drive and isometric attachment"
    ],
    "commonForceOrSkillDemand": "unilateral projection through a low base with whole-body connection",
    "recommendedExercisePatterns": [
      "rear-foot-elevated split squat",
      "walking lunge",
      "sled push",
      "landmine press"
    ],
    "recommendedExercises": [
      "rear-foot-elevated split squat",
      "walking lunge",
      "sled push",
      "landmine press"
    ],
    "transferRationale": "Unilateral squatting and sled work overlap with leg drive and low-position force direction; transfer remains mechanical rather than causal.",
    "exerciseSelectionCautions": "Use controlled range and avoid collapsing the front knee or loading speed before positional skill.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7739678/",
      "https://www.nsca.com/education/articles/kinetic-select/wrestling/",
      "https://www.mdpi.com/2076-3417/11/22/10658"
    ],
    "sourceSummary": "The enrichment uses a peer-reviewed double-leg biomechanics study, NSCA wrestling strength-and-conditioning education, and a combat-sport conditioning review; evidence supports mechanical-demand descriptions but does not establish direct EMG findings or causal exercise-to-performance effects for each movement."
  },
  {
    "id": "wrestling-2",
    "sportId": "wrestling",
    "label": "double-leg shot",
    "movementFamily": "bilateral takedown attack",
    "bodyActions": [
      "penetrate beneath the opponent’s center, connect the arms, and drive through the legs"
    ],
    "jointActions": [
      "bilateral hip/knee extension",
      "ankle plantarflexion",
      "shoulder extension/adduction",
      "trunk anti-flexion"
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps",
      "adductor magnus",
      "latissimus dorsi"
    ],
    "assistingMuscles": [
      "hamstrings",
      "gastrocnemius",
      "pectoralis major",
      "biceps brachii"
    ],
    "stabilizers": [
      "transversus abdominis",
      "obliques",
      "erector spinae",
      "forearm flexors"
    ],
    "contractionRoles": [
      "rapid concentric drive with isometric upper-body connection and eccentric redirection"
    ],
    "commonForceOrSkillDemand": "horizontal force production while maintaining close attachment",
    "recommendedExercisePatterns": [
      "front squat",
      "trap-bar deadlift",
      "sled push",
      "bear-hug carry"
    ],
    "recommendedExercises": [
      "front squat",
      "trap-bar deadlift",
      "sled push",
      "bear-hug carry"
    ],
    "transferRationale": "Deadlift/sled/carry patterns share leg-driven horizontal force and close-load bracing, but no exercise alone teaches shot timing or finishing skill.",
    "exerciseSelectionCautions": "Use a neutral spine and coach the entry; avoid maximal loaded speed or neck loading.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7739678/",
      "https://www.nsca.com/education/articles/kinetic-select/wrestling/",
      "https://www.mdpi.com/2076-3417/11/22/10658"
    ],
    "sourceSummary": "The enrichment uses a peer-reviewed double-leg biomechanics study, NSCA wrestling strength-and-conditioning education, and a combat-sport conditioning review; evidence supports mechanical-demand descriptions but does not establish direct EMG findings or causal exercise-to-performance effects for each movement."
  },
  {
    "id": "wrestling-3",
    "sportId": "wrestling",
    "label": "single-leg shot",
    "movementFamily": "unilateral takedown attack",
    "bodyActions": [
      "drop and penetrate on one leg, elevate or control the opponent’s leg, and finish from an angled base"
    ],
    "jointActions": [
      "unilateral hip/knee flexion-extension",
      "ankle stabilization",
      "shoulder/elbow flexion and pulling",
      "trunk anti-rotation"
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps",
      "adductor magnus",
      "latissimus dorsi"
    ],
    "assistingMuscles": [
      "hamstrings",
      "gluteus medius",
      "biceps brachii",
      "forearm flexors"
    ],
    "stabilizers": [
      "obliques",
      "transversus abdominis",
      "soleus",
      "rotator cuff"
    ],
    "contractionRoles": [
      "unilateral concentric drive with isometric grip and eccentric balance correction"
    ],
    "commonForceOrSkillDemand": "single-leg force, attachment, and angle change under perturbation",
    "recommendedExercisePatterns": [
      "split squat",
      "step-up",
      "single-arm cable row",
      "suitcase carry"
    ],
    "recommendedExercises": [
      "split squat",
      "step-up",
      "single-arm cable row",
      "suitcase carry"
    ],
    "transferRationale": "Unilateral strength and anti-rotation exercises address shared base and attachment demands, not the technical chain or opponent variability.",
    "exerciseSelectionCautions": "Progress unilateral loading gradually; monitor hip, knee, and lumbar position during fatigue.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7739678/",
      "https://www.nsca.com/education/articles/kinetic-select/wrestling/",
      "https://www.mdpi.com/2076-3417/11/22/10658"
    ],
    "sourceSummary": "The enrichment uses a peer-reviewed double-leg biomechanics study, NSCA wrestling strength-and-conditioning education, and a combat-sport conditioning review; evidence supports mechanical-demand descriptions but does not establish direct EMG findings or causal exercise-to-performance effects for each movement."
  },
  {
    "id": "wrestling-4",
    "sportId": "wrestling",
    "label": "high-crotch entry",
    "movementFamily": "penetration and entry",
    "bodyActions": [
      "step deeply with one leg while lowering the hips and maintaining forward projection"
    ],
    "jointActions": [
      "unilateral hip/knee flexion",
      "ankle dorsiflexion",
      "contralateral hip extension",
      "trunk anti-rotation"
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps",
      "adductor magnus",
      "soleus"
    ],
    "assistingMuscles": [
      "hamstrings",
      "gluteus medius",
      "gastrocnemius",
      "pectoralis major"
    ],
    "stabilizers": [
      "obliquus externus abdominis",
      "transversus abdominis",
      "tibialis anterior",
      "scapular stabilizers"
    ],
    "contractionRoles": [
      "eccentric entry absorption followed by concentric leg drive and isometric attachment"
    ],
    "commonForceOrSkillDemand": "unilateral projection through a low base with whole-body connection",
    "recommendedExercisePatterns": [
      "rear-foot-elevated split squat",
      "walking lunge",
      "sled push",
      "landmine press"
    ],
    "recommendedExercises": [
      "rear-foot-elevated split squat",
      "walking lunge",
      "sled push",
      "landmine press"
    ],
    "transferRationale": "Unilateral squatting and sled work overlap with leg drive and low-position force direction; transfer remains mechanical rather than causal.",
    "exerciseSelectionCautions": "Use controlled range and avoid collapsing the front knee or loading speed before positional skill.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7739678/",
      "https://www.nsca.com/education/articles/kinetic-select/wrestling/",
      "https://www.mdpi.com/2076-3417/11/22/10658"
    ],
    "sourceSummary": "The enrichment uses a peer-reviewed double-leg biomechanics study, NSCA wrestling strength-and-conditioning education, and a combat-sport conditioning review; evidence supports mechanical-demand descriptions but does not establish direct EMG findings or causal exercise-to-performance effects for each movement."
  },
  {
    "id": "wrestling-5",
    "sportId": "wrestling",
    "label": "sprawl",
    "movementFamily": "shot defense and sprawl",
    "bodyActions": [
      "rapidly extend the hips back and down while distributing weight through the opponent and recovering the base"
    ],
    "jointActions": [
      "hip extension",
      "knee extension",
      "ankle plantarflexion",
      "shoulder flexion/extension",
      "trunk anti-extension"
    ],
    "primeMovers": [
      "gluteus maximus",
      "hamstrings",
      "quadriceps",
      "triceps brachii"
    ],
    "assistingMuscles": [
      "adductor magnus",
      "gastrocnemius",
      "pectoralis major",
      "latissimus dorsi"
    ],
    "stabilizers": [
      "erector spinae",
      "obliques",
      "transversus abdominis",
      "scapular stabilizers"
    ],
    "contractionRoles": [
      "explosive hip extension with eccentric braking and isometric upper-body pressure"
    ],
    "commonForceOrSkillDemand": "reactive posterior-chain projection and force absorption",
    "recommendedExercisePatterns": [
      "hip thrust",
      "Romanian deadlift",
      "broad jump",
      "sled drag"
    ],
    "recommendedExercises": [
      "hip thrust",
      "Romanian deadlift",
      "broad jump",
      "sled drag"
    ],
    "transferRationale": "Hip-extension and braking drills share posterior-chain demands, but reactive sprawl timing and safe contact are sport skills.",
    "exerciseSelectionCautions": "Do not substitute repeated uncontrolled prone landings for strength work; scale impact and protect shoulders.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7739678/",
      "https://www.nsca.com/education/articles/kinetic-select/wrestling/",
      "https://www.mdpi.com/2076-3417/11/22/10658"
    ],
    "sourceSummary": "The enrichment uses a peer-reviewed double-leg biomechanics study, NSCA wrestling strength-and-conditioning education, and a combat-sport conditioning review; evidence supports mechanical-demand descriptions but does not establish direct EMG findings or causal exercise-to-performance effects for each movement."
  },
  {
    "id": "wrestling-6",
    "sportId": "wrestling",
    "label": "reshot",
    "movementFamily": "shot defense and sprawl",
    "bodyActions": [
      "rapidly extend the hips back and down while distributing weight through the opponent and recovering the base"
    ],
    "jointActions": [
      "hip extension",
      "knee extension",
      "ankle plantarflexion",
      "shoulder flexion/extension",
      "trunk anti-extension"
    ],
    "primeMovers": [
      "gluteus maximus",
      "hamstrings",
      "quadriceps",
      "triceps brachii"
    ],
    "assistingMuscles": [
      "adductor magnus",
      "gastrocnemius",
      "pectoralis major",
      "latissimus dorsi"
    ],
    "stabilizers": [
      "erector spinae",
      "obliques",
      "transversus abdominis",
      "scapular stabilizers"
    ],
    "contractionRoles": [
      "explosive hip extension with eccentric braking and isometric upper-body pressure"
    ],
    "commonForceOrSkillDemand": "reactive posterior-chain projection and force absorption",
    "recommendedExercisePatterns": [
      "hip thrust",
      "Romanian deadlift",
      "broad jump",
      "sled drag"
    ],
    "recommendedExercises": [
      "hip thrust",
      "Romanian deadlift",
      "broad jump",
      "sled drag"
    ],
    "transferRationale": "Hip-extension and braking drills share posterior-chain demands, but reactive sprawl timing and safe contact are sport skills.",
    "exerciseSelectionCautions": "Do not substitute repeated uncontrolled prone landings for strength work; scale impact and protect shoulders.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7739678/",
      "https://www.nsca.com/education/articles/kinetic-select/wrestling/",
      "https://www.mdpi.com/2076-3417/11/22/10658"
    ],
    "sourceSummary": "The enrichment uses a peer-reviewed double-leg biomechanics study, NSCA wrestling strength-and-conditioning education, and a combat-sport conditioning review; evidence supports mechanical-demand descriptions but does not establish direct EMG findings or causal exercise-to-performance effects for each movement."
  },
  {
    "id": "wrestling-7",
    "sportId": "wrestling",
    "label": "stand-up escape",
    "movementFamily": "hip-heist and escape",
    "bodyActions": [
      "rotate the pelvis around a posted hand while extending the hips to create space or re-face the opponent"
    ],
    "jointActions": [
      "hip extension and external rotation",
      "trunk rotation",
      "shoulder/elbow extension",
      "wrist stabilization"
    ],
    "primeMovers": [
      "gluteus maximus",
      "gluteus medius",
      "external obliques",
      "triceps brachii"
    ],
    "assistingMuscles": [
      "adductor magnus",
      "hamstrings",
      "pectoralis major",
      "rotator cuff"
    ],
    "stabilizers": [
      "transversus abdominis",
      "multifidus",
      "wrist flexors/extensors",
      "scapular stabilizers"
    ],
    "contractionRoles": [
      "concentric pelvic rotation/extension with isometric posting and eccentric return"
    ],
    "commonForceOrSkillDemand": "grounded rotational escape with a stable upper-limb base",
    "recommendedExercisePatterns": [
      "hip thrust",
      "lateral lunge",
      "landmine rotation",
      "single-arm press"
    ],
    "recommendedExercises": [
      "hip thrust",
      "lateral lunge",
      "landmine rotation",
      "single-arm press"
    ],
    "transferRationale": "Hip-extension and rotational patterns overlap with the pelvic redirection component, not the technical leverage or opponent pressure.",
    "exerciseSelectionCautions": "Use supported variations and avoid forced shoulder rotation or wrist extension.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7739678/",
      "https://www.nsca.com/education/articles/kinetic-select/wrestling/",
      "https://www.mdpi.com/2076-3417/11/22/10658"
    ],
    "sourceSummary": "The enrichment uses a peer-reviewed double-leg biomechanics study, NSCA wrestling strength-and-conditioning education, and a combat-sport conditioning review; evidence supports mechanical-demand descriptions but does not establish direct EMG findings or causal exercise-to-performance effects for each movement."
  },
  {
    "id": "wrestling-8",
    "sportId": "wrestling",
    "label": "hip-heist",
    "movementFamily": "hip-heist and escape",
    "bodyActions": [
      "rotate the pelvis around a posted hand while extending the hips to create space or re-face the opponent"
    ],
    "jointActions": [
      "hip extension and external rotation",
      "trunk rotation",
      "shoulder/elbow extension",
      "wrist stabilization"
    ],
    "primeMovers": [
      "gluteus maximus",
      "gluteus medius",
      "external obliques",
      "triceps brachii"
    ],
    "assistingMuscles": [
      "adductor magnus",
      "hamstrings",
      "pectoralis major",
      "rotator cuff"
    ],
    "stabilizers": [
      "transversus abdominis",
      "multifidus",
      "wrist flexors/extensors",
      "scapular stabilizers"
    ],
    "contractionRoles": [
      "concentric pelvic rotation/extension with isometric posting and eccentric return"
    ],
    "commonForceOrSkillDemand": "grounded rotational escape with a stable upper-limb base",
    "recommendedExercisePatterns": [
      "hip thrust",
      "lateral lunge",
      "landmine rotation",
      "single-arm press"
    ],
    "recommendedExercises": [
      "hip thrust",
      "lateral lunge",
      "landmine rotation",
      "single-arm press"
    ],
    "transferRationale": "Hip-extension and rotational patterns overlap with the pelvic redirection component, not the technical leverage or opponent pressure.",
    "exerciseSelectionCautions": "Use supported variations and avoid forced shoulder rotation or wrist extension.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7739678/",
      "https://www.nsca.com/education/articles/kinetic-select/wrestling/",
      "https://www.mdpi.com/2076-3417/11/22/10658"
    ],
    "sourceSummary": "The enrichment uses a peer-reviewed double-leg biomechanics study, NSCA wrestling strength-and-conditioning education, and a combat-sport conditioning review; evidence supports mechanical-demand descriptions but does not establish direct EMG findings or causal exercise-to-performance effects for each movement."
  },
  {
    "id": "wrestling-9",
    "sportId": "wrestling",
    "label": "sit-out",
    "movementFamily": "bottom escape",
    "bodyActions": [
      "rotate from a seated base, post the hand, extend the hips, and clear the pelvis"
    ],
    "jointActions": [
      "hip extension/rotation",
      "knee extension",
      "shoulder/elbow extension",
      "trunk rotation"
    ],
    "primeMovers": [
      "gluteus maximus",
      "gluteus medius",
      "obliquus externus abdominis",
      "triceps brachii"
    ],
    "assistingMuscles": [
      "quadriceps",
      "hamstrings",
      "adductor magnus",
      "pectoralis major"
    ],
    "stabilizers": [
      "transversus abdominis",
      "rotator cuff",
      "wrist stabilizers",
      "scapular stabilizers"
    ],
    "contractionRoles": [
      "concentric hip elevation and rotation with isometric post and eccentric reset"
    ],
    "commonForceOrSkillDemand": "rapid space creation from a constrained bottom position",
    "recommendedExercisePatterns": [
      "single-leg hip thrust",
      "half-kneeling cable press",
      "landmine rotation",
      "step-up"
    ],
    "recommendedExercises": [
      "single-leg hip thrust",
      "half-kneeling cable press",
      "landmine rotation",
      "step-up"
    ],
    "transferRationale": "Unilateral hip extension and rotational pressing share positional force demands, while the escape remains technique- and timing-dependent.",
    "exerciseSelectionCautions": "Keep the posting shoulder centered and use a reduced range if wrist or shoulder tolerance is limited.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7739678/",
      "https://www.nsca.com/education/articles/kinetic-select/wrestling/",
      "https://www.mdpi.com/2076-3417/11/22/10658"
    ],
    "sourceSummary": "The enrichment uses a peer-reviewed double-leg biomechanics study, NSCA wrestling strength-and-conditioning education, and a combat-sport conditioning review; evidence supports mechanical-demand descriptions but does not establish direct EMG findings or causal exercise-to-performance effects for each movement."
  },
  {
    "id": "wrestling-10",
    "sportId": "wrestling",
    "label": "switch",
    "movementFamily": "reversal and hip-switch",
    "bodyActions": [
      "change hip orientation around a posted base to turn toward or through the opponent"
    ],
    "jointActions": [
      "hip rotation/extension",
      "trunk rotation",
      "shoulder/elbow extension",
      "knee flexion-extension"
    ],
    "primeMovers": [
      "gluteus maximus",
      "adductor magnus",
      "obliquus internus abdominis",
      "triceps brachii"
    ],
    "assistingMuscles": [
      "gluteus medius",
      "hamstrings",
      "quadriceps",
      "pectoralis major"
    ],
    "stabilizers": [
      "transversus abdominis",
      "multifidus",
      "rotator cuff",
      "wrist stabilizers"
    ],
    "contractionRoles": [
      "concentric pelvic rotation with isometric posting and eccentric control"
    ],
    "commonForceOrSkillDemand": "rapid rotational base change from bottom",
    "recommendedExercisePatterns": [
      "split squat",
      "lateral lunge",
      "cable chop",
      "single-arm press"
    ],
    "recommendedExercises": [
      "split squat",
      "lateral lunge",
      "cable chop",
      "single-arm press"
    ],
    "transferRationale": "Split-stance and rotational exercises address shared force orientation but do not establish a direct performance effect.",
    "exerciseSelectionCautions": "Control the knee and shoulder; practice technical switching separately from heavy resistance.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7739678/",
      "https://www.nsca.com/education/articles/kinetic-select/wrestling/",
      "https://www.mdpi.com/2076-3417/11/22/10658"
    ],
    "sourceSummary": "The enrichment uses a peer-reviewed double-leg biomechanics study, NSCA wrestling strength-and-conditioning education, and a combat-sport conditioning review; evidence supports mechanical-demand descriptions but does not establish direct EMG findings or causal exercise-to-performance effects for each movement."
  },
  {
    "id": "wrestling-11",
    "sportId": "wrestling",
    "label": "mat return",
    "movementFamily": "mat return and lowering",
    "bodyActions": [
      "lift or steer a standing opponent and lower them while maintaining close body contact"
    ],
    "jointActions": [
      "hip/knee extension",
      "trunk anti-rotation",
      "shoulder adduction/extension",
      "controlled hip/knee flexion"
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps",
      "adductor magnus",
      "latissimus dorsi"
    ],
    "assistingMuscles": [
      "hamstrings",
      "biceps brachii",
      "forearm flexors",
      "gluteus medius"
    ],
    "stabilizers": [
      "erector spinae",
      "obliques",
      "transversus abdominis",
      "neck stabilizers"
    ],
    "contractionRoles": [
      "concentric lift/steer, isometric clamp, and eccentric lowering"
    ],
    "commonForceOrSkillDemand": "load control and deceleration with a close external mass",
    "recommendedExercisePatterns": [
      "trap-bar deadlift",
      "bear-hug carry",
      "sandbag load",
      "front squat"
    ],
    "recommendedExercises": [
      "trap-bar deadlift",
      "bear-hug carry",
      "sandbag load",
      "front squat"
    ],
    "transferRationale": "Carries and deadlifts share close-load bracing and lowering; they cannot validate technical safety or scoring outcomes.",
    "exerciseSelectionCautions": "Use crash mats and coaching for returns; avoid twisting under maximal load.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7739678/",
      "https://www.nsca.com/education/articles/kinetic-select/wrestling/",
      "https://www.mdpi.com/2076-3417/11/22/10658"
    ],
    "sourceSummary": "The enrichment uses a peer-reviewed double-leg biomechanics study, NSCA wrestling strength-and-conditioning education, and a combat-sport conditioning review; evidence supports mechanical-demand descriptions but does not establish direct EMG findings or causal exercise-to-performance effects for each movement."
  },
  {
    "id": "wrestling-12",
    "sportId": "wrestling",
    "label": "body-lock lift",
    "movementFamily": "body-lock lift",
    "bodyActions": [
      "compress the trunk, extend the hips and knees, and elevate or off-balance the opponent"
    ],
    "jointActions": [
      "hip/knee extension",
      "ankle plantarflexion",
      "shoulder adduction",
      "elbow flexion",
      "trunk anti-flexion"
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps",
      "adductor magnus",
      "latissimus dorsi"
    ],
    "assistingMuscles": [
      "hamstrings",
      "biceps brachii",
      "forearm flexors",
      "gastrocnemius"
    ],
    "stabilizers": [
      "erector spinae",
      "obliques",
      "transversus abdominis",
      "gluteus medius"
    ],
    "contractionRoles": [
      "concentric lower-body lift with isometric clamp and eccentric descent"
    ],
    "commonForceOrSkillDemand": "bilateral force production around a close, unstable load",
    "recommendedExercisePatterns": [
      "trap-bar deadlift",
      "front squat",
      "bear-hug carry",
      "sandbag load"
    ],
    "recommendedExercises": [
      "trap-bar deadlift",
      "front squat",
      "bear-hug carry",
      "sandbag load"
    ],
    "transferRationale": "Close-load lifting and carries reproduce shared force vectors and bracing, not opponent dynamics or technique.",
    "exerciseSelectionCautions": "Keep the load close, hinge before lifting, and use appropriate spotting and landing surfaces.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7739678/",
      "https://www.nsca.com/education/articles/kinetic-select/wrestling/",
      "https://www.mdpi.com/2076-3417/11/22/10658"
    ],
    "sourceSummary": "The enrichment uses a peer-reviewed double-leg biomechanics study, NSCA wrestling strength-and-conditioning education, and a combat-sport conditioning review; evidence supports mechanical-demand descriptions but does not establish direct EMG findings or causal exercise-to-performance effects for each movement."
  },
  {
    "id": "wrestling-13",
    "sportId": "wrestling",
    "label": "underhook drive",
    "movementFamily": "underhook drive",
    "bodyActions": [
      "use inside arm control with forward steps, hip pressure, and shoulder-to-hip connection"
    ],
    "jointActions": [
      "hip/knee extension",
      "shoulder adduction/flexion",
      "elbow flexion",
      "trunk anti-rotation"
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps",
      "adductor magnus",
      "pectoralis major"
    ],
    "assistingMuscles": [
      "latissimus dorsi",
      "hamstrings",
      "deltoid",
      "biceps brachii"
    ],
    "stabilizers": [
      "obliques",
      "transversus abdominis",
      "scapular stabilizers",
      "gluteus medius"
    ],
    "contractionRoles": [
      "concentric stepping/pushing with isometric arm position and eccentric redirection"
    ],
    "commonForceOrSkillDemand": "linear clinch pressure and whole-body force transfer",
    "recommendedExercisePatterns": [
      "sled push",
      "split squat",
      "single-arm row",
      "landmine press"
    ],
    "recommendedExercises": [
      "sled push",
      "split squat",
      "single-arm row",
      "landmine press"
    ],
    "transferRationale": "Sleds, unilateral legs, and single-arm pulls overlap with drive and connection, without proving direct transfer to match success.",
    "exerciseSelectionCautions": "Avoid lumbar hyperextension and excessive shoulder internal rotation; vary sides and loading.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7739678/",
      "https://www.nsca.com/education/articles/kinetic-select/wrestling/",
      "https://www.mdpi.com/2076-3417/11/22/10658"
    ],
    "sourceSummary": "The enrichment uses a peer-reviewed double-leg biomechanics study, NSCA wrestling strength-and-conditioning education, and a combat-sport conditioning review; evidence supports mechanical-demand descriptions but does not establish direct EMG findings or causal exercise-to-performance effects for each movement."
  },
  {
    "id": "wrestling-14",
    "sportId": "wrestling",
    "label": "overhook/whizzer",
    "movementFamily": "overhook counter-control",
    "bodyActions": [
      "press the opponent’s arm inward/downward while rotating the trunk and positioning the hips"
    ],
    "jointActions": [
      "shoulder internal rotation/adduction",
      "elbow flexion",
      "trunk rotation",
      "hip abduction/adduction"
    ],
    "primeMovers": [
      "posterior deltoid",
      "latissimus dorsi",
      "pectoralis major",
      "obliquus externus abdominis"
    ],
    "assistingMuscles": [
      "adductor magnus",
      "gluteus medius",
      "biceps brachii",
      "forearm flexors"
    ],
    "stabilizers": [
      "rotator cuff",
      "scapular stabilizers",
      "transversus abdominis",
      "neck stabilizers"
    ],
    "contractionRoles": [
      "isometric positional resistance with concentric pull/rotation and eccentric redirection"
    ],
    "commonForceOrSkillDemand": "anti-underhook control and rotational bracing",
    "recommendedExercisePatterns": [
      "single-arm cable row",
      "landmine rotation",
      "suitcase carry",
      "Pallof press"
    ],
    "recommendedExercises": [
      "single-arm cable row",
      "landmine rotation",
      "suitcase carry",
      "Pallof press"
    ],
    "transferRationale": "Single-arm pulls, carries, and anti-rotation overlap with arm-to-trunk control; exact leverage is skill-specific.",
    "exerciseSelectionCautions": "Respect shoulder range and avoid forceful end-range internal rotation or neck traction.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7739678/",
      "https://www.nsca.com/education/articles/kinetic-select/wrestling/",
      "https://www.mdpi.com/2076-3417/11/22/10658"
    ],
    "sourceSummary": "The enrichment uses a peer-reviewed double-leg biomechanics study, NSCA wrestling strength-and-conditioning education, and a combat-sport conditioning review; evidence supports mechanical-demand descriptions but does not establish direct EMG findings or causal exercise-to-performance effects for each movement."
  },
  {
    "id": "wrestling-15",
    "sportId": "wrestling",
    "label": "snapdown",
    "movementFamily": "snapdown and head control",
    "bodyActions": [
      "pull the opponent’s head/upper trunk downward while hinging and maintaining a stable base"
    ],
    "jointActions": [
      "shoulder extension/adduction",
      "elbow flexion",
      "hip hinge",
      "trunk flexion control"
    ],
    "primeMovers": [
      "latissimus dorsi",
      "biceps brachii",
      "posterior deltoid",
      "hamstrings"
    ],
    "assistingMuscles": [
      "pectoralis major",
      "forearm flexors",
      "gluteus maximus",
      "erector spinae"
    ],
    "stabilizers": [
      "obliques",
      "transversus abdominis",
      "scapular stabilizers",
      "cervical musculature"
    ],
    "contractionRoles": [
      "rapid concentric pull with eccentric hinge and isometric grip"
    ],
    "commonForceOrSkillDemand": "downward traction, hinge control, and positional disruption",
    "recommendedExercisePatterns": [
      "chest-supported row",
      "Romanian deadlift",
      "cable row",
      "farmer carry"
    ],
    "recommendedExercises": [
      "chest-supported row",
      "Romanian deadlift",
      "cable row",
      "farmer carry"
    ],
    "transferRationale": "Rows and hinges share pulling-plus-base mechanics, but head control and timing require coached partner practice.",
    "exerciseSelectionCautions": "Never apply uncoached cervical traction; use handles and loads that preserve shoulder and spine position.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7739678/",
      "https://www.nsca.com/education/articles/kinetic-select/wrestling/",
      "https://www.mdpi.com/2076-3417/11/22/10658"
    ],
    "sourceSummary": "The enrichment uses a peer-reviewed double-leg biomechanics study, NSCA wrestling strength-and-conditioning education, and a combat-sport conditioning review; evidence supports mechanical-demand descriptions but does not establish direct EMG findings or causal exercise-to-performance effects for each movement."
  },
  {
    "id": "wrestling-16",
    "sportId": "wrestling",
    "label": "front-headlock pull",
    "movementFamily": "front-head control",
    "bodyActions": [
      "maintain head-and-arm control with downward traction, torso flexion, and steering"
    ],
    "jointActions": [
      "shoulder adduction/extension",
      "elbow flexion",
      "trunk anti-rotation/flexion",
      "hip hinge"
    ],
    "primeMovers": [
      "latissimus dorsi",
      "biceps brachii",
      "pectoralis major",
      "external obliques"
    ],
    "assistingMuscles": [
      "forearm flexors",
      "posterior deltoid",
      "hamstrings",
      "erector spinae"
    ],
    "stabilizers": [
      "transversus abdominis",
      "rotator cuff",
      "scapular stabilizers",
      "cervical musculature"
    ],
    "contractionRoles": [
      "isometric clamp with concentric pulling/steering and eccentric stance changes"
    ],
    "commonForceOrSkillDemand": "sustained upper-body attachment with trunk bracing",
    "recommendedExercisePatterns": [
      "chest-supported row",
      "half-kneeling cable row",
      "suitcase carry",
      "Pallof press"
    ],
    "recommendedExercises": [
      "chest-supported row",
      "half-kneeling cable row",
      "suitcase carry",
      "Pallof press"
    ],
    "transferRationale": "Rows and anti-rotation carries address shared attachment and trunk demands but not the technical control or neck risk.",
    "exerciseSelectionCautions": "Use neutral neck alignment and avoid aggressive loading of cervical flexion or traction.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7739678/",
      "https://www.nsca.com/education/articles/kinetic-select/wrestling/",
      "https://www.mdpi.com/2076-3417/11/22/10658"
    ],
    "sourceSummary": "The enrichment uses a peer-reviewed double-leg biomechanics study, NSCA wrestling strength-and-conditioning education, and a combat-sport conditioning review; evidence supports mechanical-demand descriptions but does not establish direct EMG findings or causal exercise-to-performance effects for each movement."
  },
  {
    "id": "wrestling-17",
    "sportId": "wrestling",
    "label": "hand fighting",
    "movementFamily": "hand fighting and pummeling",
    "bodyActions": [
      "repeated posting, pulling, wrist control, pummeling, and short foot/trunk adjustments"
    ],
    "jointActions": [
      "shoulder flexion/adduction",
      "elbow flexion/extension",
      "forearm pronation/supination",
      "trunk anti-rotation"
    ],
    "primeMovers": [
      "forearm flexors",
      "forearm extensors",
      "biceps brachii",
      "triceps brachii",
      "deltoid"
    ],
    "assistingMuscles": [
      "pectoralis major",
      "latissimus dorsi",
      "brachioradialis",
      "posterior deltoid"
    ],
    "stabilizers": [
      "rotator cuff",
      "serratus anterior",
      "lower trapezius",
      "obliques",
      "grip musculature"
    ],
    "contractionRoles": [
      "mixed isometric gripping with repeated concentric pulls/pushes and eccentric repositioning"
    ],
    "commonForceOrSkillDemand": "repeated grip and upper-limb force under changing direction",
    "recommendedExercisePatterns": [
      "cable row",
      "push-up",
      "farmer carry",
      "towel pull-up"
    ],
    "recommendedExercises": [
      "cable row",
      "push-up",
      "farmer carry",
      "towel pull-up"
    ],
    "transferRationale": "Pulling, pushing, and carries share grip and scapular demands, but hand fighting is highly technical and opponent-dependent.",
    "exerciseSelectionCautions": "Manage elbow/wrist volume and use neutral grips when possible; avoid training to failure before technical practice.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7739678/",
      "https://www.nsca.com/education/articles/kinetic-select/wrestling/",
      "https://www.mdpi.com/2076-3417/11/22/10658"
    ],
    "sourceSummary": "The enrichment uses a peer-reviewed double-leg biomechanics study, NSCA wrestling strength-and-conditioning education, and a combat-sport conditioning review; evidence supports mechanical-demand descriptions but does not establish direct EMG findings or causal exercise-to-performance effects for each movement."
  },
  {
    "id": "wrestling-18",
    "sportId": "wrestling",
    "label": "lateral shuffle",
    "movementFamily": "lateral footwork",
    "bodyActions": [
      "shuffle side to side with hip/knee flexion, frontal-plane push-off, and rapid re-centering"
    ],
    "jointActions": [
      "hip abduction/adduction",
      "knee flexion-extension",
      "ankle inversion/eversion control",
      "trunk anti-lateral-flexion"
    ],
    "primeMovers": [
      "gluteus medius",
      "adductor magnus",
      "quadriceps",
      "gastrocnemius"
    ],
    "assistingMuscles": [
      "gluteus maximus",
      "hamstrings",
      "soleus",
      "peroneus longus"
    ],
    "stabilizers": [
      "obliquus internus abdominis",
      "obliquus externus abdominis",
      "tibialis anterior",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "concentric lateral push-off with eccentric deceleration and isometric bracing"
    ],
    "commonForceOrSkillDemand": "frontal-plane repositioning and braking",
    "recommendedExercisePatterns": [
      "lateral lunge",
      "skater bound",
      "Copenhagen plank",
      "suitcase carry"
    ],
    "recommendedExercises": [
      "lateral lunge",
      "skater bound",
      "Copenhagen plank",
      "suitcase carry"
    ],
    "transferRationale": "Lateral strength and anti-lateral-flexion patterns overlap with footwork and base control, not reactive tactical success.",
    "exerciseSelectionCautions": "Land quietly, keep the knee aligned, and reduce bound amplitude if ankle or adductor tolerance is limited.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7739678/",
      "https://www.nsca.com/education/articles/kinetic-select/wrestling/",
      "https://www.mdpi.com/2076-3417/11/22/10658"
    ],
    "sourceSummary": "The enrichment uses a peer-reviewed double-leg biomechanics study, NSCA wrestling strength-and-conditioning education, and a combat-sport conditioning review; evidence supports mechanical-demand descriptions but does not establish direct EMG findings or causal exercise-to-performance effects for each movement."
  },
  {
    "id": "wrestling-19",
    "sportId": "wrestling",
    "label": "bridge",
    "movementFamily": "bridge and arch",
    "bodyActions": [
      "extend the hips and trunk from supine support, sometimes rotating to create space or resist a pin"
    ],
    "jointActions": [
      "hip extension",
      "spinal extension",
      "trunk rotation",
      "cervical extension only when technically required"
    ],
    "primeMovers": [
      "gluteus maximus",
      "hamstrings",
      "erector spinae",
      "obliquus externus abdominis"
    ],
    "assistingMuscles": [
      "adductor magnus",
      "gluteus medius",
      "quadratus lumborum",
      "gastrocnemius"
    ],
    "stabilizers": [
      "deep neck flexors/extensors",
      "rotator cuff",
      "transversus abdominis",
      "foot stabilizers"
    ],
    "contractionRoles": [
      "concentric hip/trunk extension with eccentric lowering and isometric support"
    ],
    "commonForceOrSkillDemand": "posterior-chain elevation and ground-based force transfer",
    "recommendedExercisePatterns": [
      "hip thrust",
      "glute bridge",
      "Romanian deadlift",
      "cable anti-rotation"
    ],
    "recommendedExercises": [
      "hip thrust",
      "glute bridge",
      "Romanian deadlift",
      "cable anti-rotation"
    ],
    "transferRationale": "Hip-extension and anti-rotation work overlaps with pelvic elevation, but does not justify claims about pin-escape performance.",
    "exerciseSelectionCautions": "Progress neck involvement conservatively; avoid loaded cervical extension and uncontrolled bridging.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7739678/",
      "https://www.nsca.com/education/articles/kinetic-select/wrestling/",
      "https://www.mdpi.com/2076-3417/11/22/10658"
    ],
    "sourceSummary": "The enrichment uses a peer-reviewed double-leg biomechanics study, NSCA wrestling strength-and-conditioning education, and a combat-sport conditioning review; evidence supports mechanical-demand descriptions but does not establish direct EMG findings or causal exercise-to-performance effects for each movement."
  },
  {
    "id": "wrestling-20",
    "sportId": "wrestling",
    "label": "rotational finish",
    "movementFamily": "rotational takedown finish",
    "bodyActions": [
      "continue leg/hip drive while rotating the torso, changing angle, and steering around the opponent"
    ],
    "jointActions": [
      "hip extension/rotation",
      "knee extension",
      "trunk rotation",
      "shoulder adduction",
      "elbow flexion"
    ],
    "primeMovers": [
      "gluteus maximus",
      "adductor magnus",
      "quadriceps",
      "obliquus externus abdominis",
      "latissimus dorsi"
    ],
    "assistingMuscles": [
      "hamstrings",
      "gluteus medius",
      "pectoralis major",
      "biceps brachii",
      "forearm flexors"
    ],
    "stabilizers": [
      "transversus abdominis",
      "multifidus",
      "scapular stabilizers",
      "soleus"
    ],
    "contractionRoles": [
      "concentric drive and rotation with eccentric braking and isometric attachment"
    ],
    "commonForceOrSkillDemand": "whole-body rotational force with unilateral foot pressure",
    "recommendedExercisePatterns": [
      "split squat",
      "landmine rotation",
      "cable lift",
      "suitcase carry"
    ],
    "recommendedExercises": [
      "split squat",
      "landmine rotation",
      "cable lift",
      "suitcase carry"
    ],
    "transferRationale": "Unilateral leg drive, rotation, and carries share broad mechanical qualities; they do not establish causal improvement in finishing skill.",
    "exerciseSelectionCautions": "Train rotation through the hips and trunk without forcing lumbar range; coach partner finishes separately.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7739678/",
      "https://www.nsca.com/education/articles/kinetic-select/wrestling/",
      "https://www.mdpi.com/2076-3417/11/22/10658"
    ],
    "sourceSummary": "The enrichment uses a peer-reviewed double-leg biomechanics study, NSCA wrestling strength-and-conditioning education, and a combat-sport conditioning review; evidence supports mechanical-demand descriptions but does not establish direct EMG findings or causal exercise-to-performance effects for each movement."
  },
  {
    "id": "american-football-1",
    "sportId": "american-football",
    "label": "acceleration sprint",
    "movementFamily": "linear acceleration",
    "bodyActions": [
      "Forward projection from a split or staggered stance",
      "Progressive hip, knee and ankle extension with aggressive arm drive"
    ],
    "jointActions": [
      "Hip extension",
      "Knee extension",
      "Ankle plantarflexion",
      "Contralateral shoulder flexion and extension"
    ],
    "primeMovers": [
      "Gluteus maximus",
      "Hamstring muscles",
      "Quadriceps femoris",
      "Gastrocnemius",
      "Soleus"
    ],
    "assistingMuscles": [
      "Iliopsoas",
      "Rectus femoris",
      "Adductor magnus",
      "Biceps brachii",
      "Triceps brachii"
    ],
    "stabilizers": [
      "Gluteus medius",
      "Adductor muscles",
      "Erector spinae",
      "Transversus abdominis",
      "Intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Concentric propulsion during stance",
      "eccentric swing-leg control",
      "brief isometric trunk and pelvic stiffness."
    ],
    "commonForceOrSkillDemand": "High horizontal force and rapid force production over the first steps, with repeated unilateral ground contacts.",
    "recommendedExercisePatterns": [
      "Horizontal resisted push",
      "Split-stance strength",
      "Hip-hinge power",
      "Sprint exposure"
    ],
    "recommendedExercises": [
      "sled push",
      "split squat",
      "resisted sprint",
      "Romanian deadlift"
    ],
    "transferRationale": "These patterns share forward force orientation, unilateral stance control, hip extension and trunk bracing; they support preparation for acceleration but do not establish direct game-performance causation.",
    "exerciseSelectionCautions": "Keep resisted sprint loads light enough to preserve sprint posture and shin projection; progress hamstring and calf loading gradually; stop for pain or loss of mechanics.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10098592/",
      "https://www.nsca.com/education/journals/nsca-coach/football-issue-5-4/",
      "https://www.ncbi.nlm.nih.gov/books/NBK554393/"
    ],
    "sourceSummary": "The records synthesize American-football biomechanics reviews, peer-reviewed cutting and tackling studies, quarterback throwing analyses, anatomy references, and governing-body guidance; confidence is reduced where position-specific evidence or direct exercise-to-performance transfer is limited."
  },
  {
    "id": "american-football-2",
    "sportId": "american-football",
    "label": "max-velocity sprint",
    "movementFamily": "maximal-speed locomotion",
    "bodyActions": [
      "Tall upright cyclical running",
      "Rapid front-side recovery and elastic ground contact"
    ],
    "jointActions": [
      "Hip flexion and extension",
      "Knee flexion and extension",
      "Ankle dorsiflexion and plantarflexion"
    ],
    "primeMovers": [
      "Hamstring muscles",
      "Gluteus maximus",
      "Iliopsoas",
      "Quadriceps femoris",
      "Gastrocnemius",
      "Soleus"
    ],
    "assistingMuscles": [
      "Rectus femoris",
      "Tibialis anterior",
      "Adductor magnus",
      "Gluteus medius"
    ],
    "stabilizers": [
      "Deep hip rotator muscles",
      "Erector spinae",
      "Abdominal wall muscles",
      "Intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Concentric stance propulsion and swing recovery",
      "eccentric hamstring braking",
      "isometric trunk stiffness."
    ],
    "commonForceOrSkillDemand": "High rate of force application and elastic stiffness at speed, with precise timing and front-side mechanics.",
    "recommendedExercisePatterns": [
      "Unresisted sprint",
      "Fly sprint",
      "Hip-hinge strength",
      "Calf and ankle stiffness"
    ],
    "recommendedExercises": [
      "fly sprint",
      "Romanian deadlift",
      "Nordic hamstring curl",
      "standing calf raise"
    ],
    "transferRationale": "Fast sprinting and these exercises overlap in hip-extension capacity, hamstring force control and ankle stiffness, while maximal-speed technique itself requires sprint practice.",
    "exerciseSelectionCautions": "Use maximal-speed work only after a progressive warm-up and acceleration exposure; Nordic curls and sprint volume need conservative progression because eccentric hamstring demand is high.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10098592/",
      "https://www.ncbi.nlm.nih.gov/books/NBK554393/",
      "https://www.nsca.com/education/journals/nsca-coach/football-issue-5-4/"
    ],
    "sourceSummary": "The records synthesize American-football biomechanics reviews, peer-reviewed cutting and tackling studies, quarterback throwing analyses, anatomy references, and governing-body guidance; confidence is reduced where position-specific evidence or direct exercise-to-performance transfer is limited."
  },
  {
    "id": "american-football-3",
    "sportId": "american-football",
    "label": "backpedal",
    "movementFamily": "backward locomotion",
    "bodyActions": [
      "Backward displacement while keeping the field in view",
      "Low hip position with repeated posterior pushes"
    ],
    "jointActions": [
      "Hip and knee flexion-extension",
      "Ankle dorsiflexion and plantarflexion",
      "Pelvic control in the transverse plane"
    ],
    "primeMovers": [
      "Quadriceps femoris",
      "Gluteus maximus",
      "Gluteus medius",
      "Hamstring muscles",
      "Tibialis anterior"
    ],
    "assistingMuscles": [
      "Adductor muscles",
      "Gastrocnemius",
      "Soleus",
      "Iliopsoas"
    ],
    "stabilizers": [
      "Erector spinae",
      "Oblique muscles",
      "Deep hip rotator muscles",
      "Intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Concentric backward propulsion",
      "eccentric lowering and braking",
      "isometric trunk and pelvic control."
    ],
    "commonForceOrSkillDemand": "Repeated low-position posterior contacts and rapid transition from backward movement to forward pursuit.",
    "recommendedExercisePatterns": [
      "Backward resisted drag",
      "Reverse locomotion",
      "Single-leg squat",
      "Anti-rotation bracing"
    ],
    "recommendedExercises": [
      "backward sled drag",
      "reverse lunge",
      "single-leg squat",
      "Pallof press"
    ],
    "transferRationale": "Backward drags and unilateral squatting reproduce hip-knee loading and posture demands; anti-rotation work supports trunk control during visual-orientation changes.",
    "exerciseSelectionCautions": "Do not use loaded backward dragging if it causes knee pain or forced lumbar extension; teach controlled transition mechanics separately from strength loading.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10098592/",
      "https://www.ncbi.nlm.nih.gov/books/NBK554393/",
      "https://www.americanfootball.sport/a-guide-to-tackle-football/"
    ],
    "sourceSummary": "The records synthesize American-football biomechanics reviews, peer-reviewed cutting and tackling studies, quarterback throwing analyses, anatomy references, and governing-body guidance; confidence is reduced where position-specific evidence or direct exercise-to-performance transfer is limited."
  },
  {
    "id": "american-football-4",
    "sportId": "american-football",
    "label": "lateral shuffle",
    "movementFamily": "lateral shuffle",
    "bodyActions": [
      "Sideways displacement without crossing the feet",
      "Repeated lateral push-off while maintaining a low center of mass"
    ],
    "jointActions": [
      "Hip abduction and adduction",
      "Knee flexion and extension",
      "Ankle eversion and inversion control"
    ],
    "primeMovers": [
      "Gluteus medius",
      "Gluteus minimus",
      "Adductor muscles",
      "Quadriceps femoris",
      "Gluteus maximus"
    ],
    "assistingMuscles": [
      "Gastrocnemius",
      "Soleus",
      "Hamstring muscles",
      "Tensor fasciae latae"
    ],
    "stabilizers": [
      "Oblique muscles",
      "Erector spinae",
      "Deep hip rotator muscles",
      "Intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Concentric lateral push",
      "eccentric acceptance on the receiving leg",
      "isometric trunk and pelvic control."
    ],
    "commonForceOrSkillDemand": "Lateral force production and repeated frontal-plane braking while preserving readiness to react.",
    "recommendedExercisePatterns": [
      "Lateral resisted drag",
      "Lateral shuffle",
      "Unilateral squat",
      "Frontal-plane landing"
    ],
    "recommendedExercises": [
      "lateral sled drag",
      "band-resisted shuffle",
      "lateral lunge",
      "single-leg squat"
    ],
    "transferRationale": "The exercises overlap lateral hip/adductor loading and single-leg control, but they cannot reproduce opponent perception or the exact field-surface interaction.",
    "exerciseSelectionCautions": "Use tolerable ranges for adductors and knees; avoid letting the knee collapse medially; increase speed only after quiet, controlled contacts are consistent.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://www.mdpi.com/2075-4663/11/9/184",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10098592/",
      "https://www.ncbi.nlm.nih.gov/books/NBK554393/"
    ],
    "sourceSummary": "The records synthesize American-football biomechanics reviews, peer-reviewed cutting and tackling studies, quarterback throwing analyses, anatomy references, and governing-body guidance; confidence is reduced where position-specific evidence or direct exercise-to-performance transfer is limited."
  },
  {
    "id": "american-football-5",
    "sportId": "american-football",
    "label": "crossover run",
    "movementFamily": "multidirectional locomotion",
    "bodyActions": [
      "Angled acceleration with crossover steps",
      "Reorientation of pelvis and shoulders while preserving forward intent"
    ],
    "jointActions": [
      "Hip abduction-adduction and rotation",
      "Knee flexion-extension",
      "Ankle plantarflexion"
    ],
    "primeMovers": [
      "Gluteus maximus",
      "Gluteus medius",
      "Adductor muscles",
      "Quadriceps femoris",
      "Hamstring muscles"
    ],
    "assistingMuscles": [
      "Gastrocnemius",
      "Soleus",
      "Iliopsoas",
      "Tensor fasciae latae"
    ],
    "stabilizers": [
      "Oblique muscles",
      "Erector spinae",
      "Deep hip rotator muscles",
      "Intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Concentric angled propulsion",
      "eccentric control of trunk and pelvis during foot crossover",
      "isometric bracing at contact."
    ],
    "commonForceOrSkillDemand": "Rapid diagonal repositioning with frontal- and transverse-plane control.",
    "recommendedExercisePatterns": [
      "Crossover locomotion",
      "Lateral lunge",
      "Rotational strength",
      "Single-leg landing"
    ],
    "recommendedExercises": [
      "crossover step-up",
      "lateral lunge",
      "landmine rotation",
      "single-leg squat-to-stick"
    ],
    "transferRationale": "These drills combine diagonal foot placement, unilateral hip force and trunk rotation similar to the movement family, without claiming skill transfer beyond shared mechanics.",
    "exerciseSelectionCautions": "Start slowly to avoid uncontrolled knee valgus or twisting; rotational loading should be limited when the athlete cannot maintain foot and pelvis alignment.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://www.mdpi.com/2075-4663/11/9/184",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10098592/",
      "https://www.ncbi.nlm.nih.gov/books/NBK554393/"
    ],
    "sourceSummary": "The records synthesize American-football biomechanics reviews, peer-reviewed cutting and tackling studies, quarterback throwing analyses, anatomy references, and governing-body guidance; confidence is reduced where position-specific evidence or direct exercise-to-performance transfer is limited."
  },
  {
    "id": "american-football-6",
    "sportId": "american-football",
    "label": "three-point-stance start",
    "movementFamily": "linear acceleration",
    "bodyActions": [
      "Explosive rise from a crouched three-point stance",
      "Forward projection with coordinated arm drive"
    ],
    "jointActions": [
      "Hip extension",
      "Knee extension",
      "Ankle plantarflexion",
      "Shoulder flexion-extension"
    ],
    "primeMovers": [
      "Gluteus maximus",
      "Quadriceps femoris",
      "Hamstring muscles",
      "Gastrocnemius",
      "Soleus"
    ],
    "assistingMuscles": [
      "Adductor magnus",
      "Iliopsoas",
      "Pectoralis major",
      "Latissimus dorsi"
    ],
    "stabilizers": [
      "Erector spinae",
      "Abdominal wall muscles",
      "Gluteus medius",
      "Intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Concentric whole-body projection",
      "eccentric control during first-step recovery",
      "isometric trunk stiffness under a low start."
    ],
    "commonForceOrSkillDemand": "Very short-latency force production from a constrained posture.",
    "recommendedExercisePatterns": [
      "Sled push",
      "Split-stance strength",
      "Loaded jump",
      "Acceleration sprint"
    ],
    "recommendedExercises": [
      "sled push",
      "split squat",
      "trap bar jump",
      "resisted sprint"
    ],
    "transferRationale": "The patterns share initial joint extension and horizontal force orientation; start technique remains highly task-specific.",
    "exerciseSelectionCautions": "Do not overload the start position to the point that spinal posture or first-step mechanics deteriorate; use qualified coaching for explosive lifts.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10098592/",
      "https://www.nsca.com/education/journals/nsca-coach/football-issue-5-4/",
      "https://www.ncbi.nlm.nih.gov/books/NBK554393/"
    ],
    "sourceSummary": "The records synthesize American-football biomechanics reviews, peer-reviewed cutting and tackling studies, quarterback throwing analyses, anatomy references, and governing-body guidance; confidence is reduced where position-specific evidence or direct exercise-to-performance transfer is limited."
  },
  {
    "id": "american-football-7",
    "sportId": "american-football",
    "label": "blocking drive",
    "movementFamily": "contact force production",
    "bodyActions": [
      "Low forward body drive against resistance",
      "Leg-driven extension while maintaining a rigid torso and hand connection"
    ],
    "jointActions": [
      "Hip and knee extension",
      "Ankle plantarflexion",
      "Shoulder and elbow extension",
      "Scapular protraction"
    ],
    "primeMovers": [
      "Gluteus maximus",
      "Quadriceps femoris",
      "Hamstring muscles",
      "Pectoralis major",
      "Triceps brachii"
    ],
    "assistingMuscles": [
      "Soleus",
      "Gastrocnemius",
      "Anterior deltoid",
      "Serratus anterior",
      "Latissimus dorsi"
    ],
    "stabilizers": [
      "Erector spinae",
      "Transversus abdominis",
      "Oblique muscles",
      "Gluteus medius",
      "Rotator cuff muscles"
    ],
    "contractionRoles": [
      "Concentric leg drive and upper-body push",
      "isometric trunk and scapular connection",
      "eccentric absorption when contact shifts."
    ],
    "commonForceOrSkillDemand": "Sustained horizontal force under external perturbation and hand-fighting constraints.",
    "recommendedExercisePatterns": [
      "Sled push",
      "Horizontal press",
      "Loaded carry",
      "Isometric trunk bracing"
    ],
    "recommendedExercises": [
      "sled push",
      "bench press",
      "farmer carry",
      "front plank"
    ],
    "transferRationale": "These patterns share horizontal force, bracing and force transmission, but a gym exercise cannot recreate opponent mass, hand placement or technique.",
    "exerciseSelectionCautions": "Prioritize neutral spine, shoulder control and gradual contact exposure; avoid treating pressing strength as a substitute for coached blocking technique.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://link.springer.com/article/10.1007/s10439-020-02625-7",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10098592/",
      "https://www.ncbi.nlm.nih.gov/books/NBK554393/"
    ],
    "sourceSummary": "The records synthesize American-football biomechanics reviews, peer-reviewed cutting and tackling studies, quarterback throwing analyses, anatomy references, and governing-body guidance; confidence is reduced where position-specific evidence or direct exercise-to-performance transfer is limited."
  },
  {
    "id": "american-football-8",
    "sportId": "american-football",
    "label": "pass-rush bull rush",
    "movementFamily": "contact force production",
    "bodyActions": [
      "Forward drive through an opponent with a tight body angle",
      "Arm extension and torso bracing during collision"
    ],
    "jointActions": [
      "Hip-knee-ankle extension",
      "Shoulder flexion and elbow extension",
      "Scapular protraction"
    ],
    "primeMovers": [
      "Gluteus maximus",
      "Quadriceps femoris",
      "Pectoralis major",
      "Triceps brachii",
      "Serratus anterior"
    ],
    "assistingMuscles": [
      "Hamstring muscles",
      "Soleus",
      "Anterior deltoid",
      "Latissimus dorsi",
      "Adductor magnus"
    ],
    "stabilizers": [
      "Erector spinae",
      "Oblique muscles",
      "Rotator cuff muscles",
      "Gluteus medius",
      "Abdominal wall muscles"
    ],
    "contractionRoles": [
      "Concentric leg and arm drive",
      "isometric trunk and shoulder-girdle fixation",
      "eccentric absorption during counterforce."
    ],
    "commonForceOrSkillDemand": "High horizontal impulse and sustained contact force with changing opponent resistance.",
    "recommendedExercisePatterns": [
      "Sled push",
      "Heavy horizontal press",
      "Loaded carry",
      "Anti-extension bracing"
    ],
    "recommendedExercises": [
      "sled push",
      "bench press",
      "farmer carry",
      "ab wheel rollout"
    ],
    "transferRationale": "Shared qualities are horizontal impulse, pressing force and torso stiffness; direct pass-rush efficacy is not inferred.",
    "exerciseSelectionCautions": "Avoid maximal-load contact simulation in the weight room; use progressive, supervised pressing and bracing with shoulder-friendly ranges.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10098592/",
      "https://www.nsca.com/education/journals/nsca-coach/football-issue-5-4/",
      "https://www.ncbi.nlm.nih.gov/books/NBK554393/"
    ],
    "sourceSummary": "The records synthesize American-football biomechanics reviews, peer-reviewed cutting and tackling studies, quarterback throwing analyses, anatomy references, and governing-body guidance; confidence is reduced where position-specific evidence or direct exercise-to-performance transfer is limited."
  },
  {
    "id": "american-football-9",
    "sportId": "american-football",
    "label": "pass-rush bend",
    "movementFamily": "lateral acceleration and trunk control",
    "bodyActions": [
      "High-speed arc around an edge",
      "Lowered center of mass with trunk inclination and foot reorientation"
    ],
    "jointActions": [
      "Hip flexion, abduction and rotation",
      "Knee flexion-extension",
      "Ankle inversion-eversion control",
      "Trunk lateral flexion and rotation"
    ],
    "primeMovers": [
      "Gluteus medius",
      "Gluteus maximus",
      "Quadriceps femoris",
      "Hamstring muscles",
      "Adductor muscles"
    ],
    "assistingMuscles": [
      "Gastrocnemius",
      "Soleus",
      "Tensor fasciae latae",
      "Oblique muscles"
    ],
    "stabilizers": [
      "Erector spinae",
      "Deep hip rotator muscles",
      "Rotator cuff muscles",
      "Intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Concentric edge propulsion",
      "eccentric braking and redirection",
      "isometric trunk stiffness against lateral flexion."
    ],
    "commonForceOrSkillDemand": "High-speed curved-path force with large lateral and rotational demands under contact risk.",
    "recommendedExercisePatterns": [
      "Curved sprint",
      "Lateral lunge",
      "Single-leg deceleration",
      "Anti-lateral-flexion carry"
    ],
    "recommendedExercises": [
      "curve sprint",
      "lateral lunge",
      "single-leg squat-to-stick",
      "suitcase carry"
    ],
    "transferRationale": "Curved running, unilateral braking and anti-lateral-flexion loading overlap the broad physical demands, while bend technique needs field coaching.",
    "exerciseSelectionCautions": "Progress curve radius and speed gradually; monitor groin, knee and ankle symptoms; do not force deep trunk lean under load.",
    "evidenceConfidence": "limited",
    "sources": [
      "https://www.mdpi.com/2075-4663/11/9/184",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10098592/",
      "https://www.ncbi.nlm.nih.gov/books/NBK554393/"
    ],
    "sourceSummary": "The records synthesize American-football biomechanics reviews, peer-reviewed cutting and tackling studies, quarterback throwing analyses, anatomy references, and governing-body guidance; confidence is reduced where position-specific evidence or direct exercise-to-performance transfer is limited."
  },
  {
    "id": "american-football-10",
    "sportId": "american-football",
    "label": "tackling drive",
    "movementFamily": "contact force production and absorption",
    "bodyActions": [
      "Approach, lower the hips and drive through contact",
      "Wrap and maintain a braced torso while redirecting the ball carrier"
    ],
    "jointActions": [
      "Hip and knee flexion then extension",
      "Ankle plantarflexion",
      "Shoulder flexion and adduction",
      "Elbow flexion",
      "Trunk anti-flexion and anti-rotation"
    ],
    "primeMovers": [
      "Gluteus maximus",
      "Quadriceps femoris",
      "Hamstring muscles",
      "Pectoralis major",
      "Latissimus dorsi"
    ],
    "assistingMuscles": [
      "Soleus",
      "Gastrocnemius",
      "Biceps brachii",
      "Brachialis",
      "Serratus anterior"
    ],
    "stabilizers": [
      "Erector spinae",
      "Oblique muscles",
      "Rotator cuff muscles",
      "Gluteus medius",
      "Abdominal wall muscles"
    ],
    "contractionRoles": [
      "Eccentric lowering and impact absorption",
      "concentric leg drive",
      "isometric wrap, trunk and scapular control."
    ],
    "commonForceOrSkillDemand": "Rapid deceleration followed by whole-body collision force and grip-like attachment.",
    "recommendedExercisePatterns": [
      "Sled drive",
      "Split squat",
      "Loaded carry",
      "Anti-rotation bracing"
    ],
    "recommendedExercises": [
      "sled push",
      "split squat",
      "bear-hug carry",
      "Pallof press"
    ],
    "transferRationale": "These patterns train force production, bracing and load carriage that are mechanically relevant, but safe tackling requires coached technique and appropriate contact progression.",
    "exerciseSelectionCautions": "Never use weight-room exercises as a replacement for certified tackle instruction; contact exposure must be supervised and follow governing-body safety protocols.",
    "evidenceConfidence": "high",
    "sources": [
      "https://link.springer.com/article/10.1007/s10439-020-02625-7",
      "https://www.americanfootball.sport/a-guide-to-tackle-football/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10098592/"
    ],
    "sourceSummary": "The records synthesize American-football biomechanics reviews, peer-reviewed cutting and tackling studies, quarterback throwing analyses, anatomy references, and governing-body guidance; confidence is reduced where position-specific evidence or direct exercise-to-performance transfer is limited."
  },
  {
    "id": "american-football-11",
    "sportId": "american-football",
    "label": "cutting",
    "movementFamily": "cutting and change of direction",
    "bodyActions": [
      "Plant and redirect from a sprint",
      "Lower center of mass while projecting into a new line"
    ],
    "jointActions": [
      "Hip flexion and abduction-adduction",
      "Knee flexion-extension",
      "Ankle dorsiflexion and plantarflexion",
      "Trunk rotation"
    ],
    "primeMovers": [
      "Gluteus medius",
      "Gluteus maximus",
      "Quadriceps femoris",
      "Hamstring muscles",
      "Adductor muscles"
    ],
    "assistingMuscles": [
      "Gastrocnemius",
      "Soleus",
      "Tensor fasciae latae",
      "Oblique muscles"
    ],
    "stabilizers": [
      "Erector spinae",
      "Deep hip rotator muscles",
      "Intrinsic foot muscles",
      "Transversus abdominis"
    ],
    "contractionRoles": [
      "Eccentric braking before plant",
      "concentric re-acceleration",
      "isometric trunk and pelvic control during redirection."
    ],
    "commonForceOrSkillDemand": "Large braking and propulsive forces in short ground-contact windows, often under perception and opponent constraints.",
    "recommendedExercisePatterns": [
      "Deceleration drill",
      "Single-leg squat",
      "Lateral lunge",
      "Plyometric plant"
    ],
    "recommendedExercises": [
      "single-leg squat-to-stick",
      "lateral lunge",
      "drop landing",
      "lateral bound"
    ],
    "transferRationale": "Unilateral strength and controlled landing share braking and redirection qualities; change-of-direction skill must still be practiced with progressive speed and decision demands.",
    "exerciseSelectionCautions": "Emphasize quiet, aligned landings and adequate recovery; do not increase speed, angle and fatigue simultaneously.",
    "evidenceConfidence": "high",
    "sources": [
      "https://www.mdpi.com/2075-4663/11/9/184",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10098592/",
      "https://www.ncbi.nlm.nih.gov/books/NBK554393/"
    ],
    "sourceSummary": "The records synthesize American-football biomechanics reviews, peer-reviewed cutting and tackling studies, quarterback throwing analyses, anatomy references, and governing-body guidance; confidence is reduced where position-specific evidence or direct exercise-to-performance transfer is limited."
  },
  {
    "id": "american-football-12",
    "sportId": "american-football",
    "label": "deceleration",
    "movementFamily": "braking and force absorption",
    "bodyActions": [
      "Reduce forward velocity with controlled lowering",
      "Maintain balance and prepare for immediate re-acceleration"
    ],
    "jointActions": [
      "Hip and knee flexion",
      "Ankle dorsiflexion",
      "Trunk flexion control",
      "Foot pronation-supination control"
    ],
    "primeMovers": [
      "Quadriceps femoris",
      "Gluteus maximus",
      "Hamstring muscles",
      "Soleus",
      "Gastrocnemius"
    ],
    "assistingMuscles": [
      "Gluteus medius",
      "Adductor muscles",
      "Tibialis anterior",
      "Erector spinae"
    ],
    "stabilizers": [
      "Oblique muscles",
      "Deep hip rotator muscles",
      "Intrinsic foot muscles",
      "Transversus abdominis"
    ],
    "contractionRoles": [
      "Predominantly eccentric braking of knee, hip and ankle extensors, followed by concentric re-acceleration and isometric trunk control."
    ],
    "commonForceOrSkillDemand": "High eccentric force and impulse management over one or a few contacts.",
    "recommendedExercisePatterns": [
      "Drop landing",
      "Snap-down",
      "Single-leg landing",
      "Eccentric squat"
    ],
    "recommendedExercises": [
      "drop landing",
      "snap-down",
      "single-leg squat-to-stick",
      "split squat"
    ],
    "transferRationale": "The selected patterns expose the athlete to controlled eccentric absorption and single-leg stability, which are shared demands without promising injury prevention.",
    "exerciseSelectionCautions": "Scale height, speed and fatigue carefully; use a surface and footwear appropriate to the athlete; pain, swelling or giving way warrants clinical assessment.",
    "evidenceConfidence": "high",
    "sources": [
      "https://www.mdpi.com/2075-4663/11/9/184",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10098592/",
      "https://www.ncbi.nlm.nih.gov/books/NBK554393/"
    ],
    "sourceSummary": "The records synthesize American-football biomechanics reviews, peer-reviewed cutting and tackling studies, quarterback throwing analyses, anatomy references, and governing-body guidance; confidence is reduced where position-specific evidence or direct exercise-to-performance transfer is limited."
  },
  {
    "id": "american-football-13",
    "sportId": "american-football",
    "label": "route break",
    "movementFamily": "cutting and route change",
    "bodyActions": [
      "Accelerate, sink and break at a planned angle",
      "Re-accelerate while coordinating head, trunk and arms"
    ],
    "jointActions": [
      "Hip and knee flexion-extension",
      "Ankle dorsiflexion and plantarflexion",
      "Trunk rotation and anti-rotation"
    ],
    "primeMovers": [
      "Gluteus maximus",
      "Gluteus medius",
      "Quadriceps femoris",
      "Hamstring muscles",
      "Adductor muscles"
    ],
    "assistingMuscles": [
      "Iliopsoas",
      "Gastrocnemius",
      "Soleus",
      "Oblique muscles"
    ],
    "stabilizers": [
      "Erector spinae",
      "Deep hip rotator muscles",
      "Intrinsic foot muscles",
      "Transversus abdominis"
    ],
    "contractionRoles": [
      "Eccentric braking into the break",
      "concentric re-acceleration out",
      "isometric trunk control for route precision."
    ],
    "commonForceOrSkillDemand": "Repeated high-speed braking and redirection with perceptual timing and ball-orientation demands.",
    "recommendedExercisePatterns": [
      "Deceleration",
      "Single-leg strength",
      "Lateral power",
      "Sprint"
    ],
    "recommendedExercises": [
      "single-leg squat-to-stick",
      "lateral bound",
      "resisted sprint",
      "drop landing"
    ],
    "transferRationale": "These exercises overlap braking, lateral projection and sprint force qualities; route timing, disguise and catching remain skill-specific.",
    "exerciseSelectionCautions": "Avoid excessive plyometric volume when sprint or route practice is high; preserve technical quality and introduce reactive cues separately.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://www.mdpi.com/2075-4663/11/9/184",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10098592/",
      "https://www.ncbi.nlm.nih.gov/books/NBK554393/"
    ],
    "sourceSummary": "The records synthesize American-football biomechanics reviews, peer-reviewed cutting and tackling studies, quarterback throwing analyses, anatomy references, and governing-body guidance; confidence is reduced where position-specific evidence or direct exercise-to-performance transfer is limited."
  },
  {
    "id": "american-football-14",
    "sportId": "american-football",
    "label": "vertical jump",
    "movementFamily": "jumping and landing power",
    "bodyActions": [
      "Countermovement followed by vertical projection",
      "Controlled landing with renewed readiness"
    ],
    "jointActions": [
      "Hip-knee-ankle extension",
      "Shoulder swing",
      "Hip-knee-ankle flexion on landing"
    ],
    "primeMovers": [
      "Gluteus maximus",
      "Quadriceps femoris",
      "Gastrocnemius",
      "Soleus"
    ],
    "assistingMuscles": [
      "Hamstring muscles",
      "Adductor magnus",
      "Iliopsoas",
      "Deltoid muscles"
    ],
    "stabilizers": [
      "Gluteus medius",
      "Erector spinae",
      "Abdominal wall muscles",
      "Intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Eccentric countermovement",
      "concentric triple extension",
      "eccentric landing absorption and isometric stabilization."
    ],
    "commonForceOrSkillDemand": "High rate of vertical force production followed by precise force absorption, sometimes through contact.",
    "recommendedExercisePatterns": [
      "Loaded jump",
      "Countermovement jump",
      "Landing",
      "Squat strength"
    ],
    "recommendedExercises": [
      "trap bar jump",
      "countermovement jump",
      "drop landing",
      "front squat"
    ],
    "transferRationale": "The patterns share triple-extension power and landing control, while reach, timing and contested-ball context require sport practice.",
    "exerciseSelectionCautions": "Use low volumes of maximal jumps, land softly with aligned knees and hips, and avoid loaded jumps when fatigue compromises landing quality.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10098592/",
      "https://www.ncbi.nlm.nih.gov/books/NBK554393/",
      "https://www.nsca.com/education/journals/nsca-coach/football-issue-5-4/"
    ],
    "sourceSummary": "The records synthesize American-football biomechanics reviews, peer-reviewed cutting and tackling studies, quarterback throwing analyses, anatomy references, and governing-body guidance; confidence is reduced where position-specific evidence or direct exercise-to-performance transfer is limited."
  },
  {
    "id": "american-football-15",
    "sportId": "american-football",
    "label": "stiff-arm",
    "movementFamily": "contact-resisted upper-body projection",
    "bodyActions": [
      "Maintain balance while extending one arm to manage an opponent",
      "Drive through the legs and resist trunk rotation"
    ],
    "jointActions": [
      "Elbow extension",
      "Shoulder flexion and horizontal adduction",
      "Scapular protraction",
      "Hip and knee extension",
      "Trunk anti-rotation"
    ],
    "primeMovers": [
      "Triceps brachii",
      "Pectoralis major",
      "Anterior deltoid",
      "Serratus anterior",
      "Gluteus maximus"
    ],
    "assistingMuscles": [
      "Quadriceps femoris",
      "Hamstring muscles",
      "Latissimus dorsi",
      "Wrist and finger flexor muscles"
    ],
    "stabilizers": [
      "Rotator cuff muscles",
      "Oblique muscles",
      "Erector spinae",
      "Gluteus medius",
      "Intrinsic hand muscles"
    ],
    "contractionRoles": [
      "Concentric arm extension and leg drive",
      "isometric grip, scapular and trunk bracing",
      "eccentric control as contact changes."
    ],
    "commonForceOrSkillDemand": "Unilateral pushing and anti-rotation under external perturbation while sprinting or bracing.",
    "recommendedExercisePatterns": [
      "Unilateral press",
      "Loaded carry",
      "Sled drive",
      "Anti-rotation press"
    ],
    "recommendedExercises": [
      "single-arm cable press",
      "farmer carry",
      "sled push",
      "Pallof press"
    ],
    "transferRationale": "Unilateral pressing, carries and anti-rotation share force transmission and bracing demands, but hand placement and opponent interaction are not reproduced.",
    "exerciseSelectionCautions": "Keep the shoulder centered and avoid aggressive end-range loading; use neutral-grip variants if pressing provokes symptoms.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10098592/",
      "https://www.ncbi.nlm.nih.gov/books/NBK554393/",
      "https://www.americanfootball.sport/a-guide-to-tackle-football/"
    ],
    "sourceSummary": "The records synthesize American-football biomechanics reviews, peer-reviewed cutting and tackling studies, quarterback throwing analyses, anatomy references, and governing-body guidance; confidence is reduced where position-specific evidence or direct exercise-to-performance transfer is limited."
  },
  {
    "id": "american-football-16",
    "sportId": "american-football",
    "label": "throwing",
    "movementFamily": "rotational and overhead skill",
    "bodyActions": [
      "Stride or plant, rotate pelvis and trunk, then accelerate the arm",
      "Decelerate the arm and regain balanced posture"
    ],
    "jointActions": [
      "Hip internal and external rotation",
      "Trunk rotation",
      "Shoulder external rotation then internal rotation",
      "Elbow extension then flexion",
      "Scapular upward rotation and protraction"
    ],
    "primeMovers": [
      "Pectoralis major",
      "Latissimus dorsi",
      "Subscapularis",
      "Anterior deltoid",
      "Triceps brachii",
      "Internal oblique"
    ],
    "assistingMuscles": [
      "Gluteus maximus",
      "External oblique",
      "Serratus anterior",
      "Teres major",
      "Brachialis"
    ],
    "stabilizers": [
      "Rotator cuff muscles",
      "Rhomboid muscles",
      "Middle trapezius",
      "Erector spinae",
      "Gluteus medius"
    ],
    "contractionRoles": [
      "Leg and trunk concentric sequencing",
      "rapid concentric arm acceleration",
      "eccentric posterior shoulder and scapular deceleration",
      "isometric trunk stabilization."
    ],
    "commonForceOrSkillDemand": "High-velocity proximal-to-distal force transfer with substantial shoulder deceleration demand.",
    "recommendedExercisePatterns": [
      "Rotational medicine-ball throw",
      "Landmine rotation",
      "Overhead press",
      "Scapular pulling"
    ],
    "recommendedExercises": [
      "medicine-ball rotational throw",
      "landmine rotation",
      "single-arm cable press",
      "face pull"
    ],
    "transferRationale": "The patterns train trunk rotation, unilateral force and shoulder-girdle control that are mechanically related to passing, but throwing accuracy, release and velocity are not guaranteed by lifting.",
    "exerciseSelectionCautions": "Avoid high-volume overhead work during heavy throwing periods; progress rotational throws and monitor shoulder or elbow soreness.",
    "evidenceConfidence": "high",
    "sources": [
      "https://journals.humankinetics.com/view/journals/jab/11/4/article-p443.xml",
      "https://ijspt.scholasticahq.com/article/142488-kinematic-sequencing-of-the-football-pass-using-inertial-motion-analysis",
      "https://www.ncbi.nlm.nih.gov/books/NBK554393/"
    ],
    "sourceSummary": "The records synthesize American-football biomechanics reviews, peer-reviewed cutting and tackling studies, quarterback throwing analyses, anatomy references, and governing-body guidance; confidence is reduced where position-specific evidence or direct exercise-to-performance transfer is limited."
  },
  {
    "id": "american-football-17",
    "sportId": "american-football",
    "label": "catching overhead",
    "movementFamily": "overhead reach and ball reception",
    "bodyActions": [
      "Accelerate hands to an overhead or high outside target",
      "Absorb the ball while maintaining shoulder and trunk control"
    ],
    "jointActions": [
      "Shoulder flexion and abduction",
      "Scapular upward rotation",
      "Elbow extension then flexion",
      "Wrist and finger flexion",
      "Trunk anti-extension"
    ],
    "primeMovers": [
      "Anterior deltoid",
      "Middle deltoid",
      "Serratus anterior",
      "Trapezius",
      "Wrist and finger flexor muscles"
    ],
    "assistingMuscles": [
      "Pectoralis major",
      "Triceps brachii",
      "Biceps brachii",
      "Rotator cuff muscles",
      "Erector spinae"
    ],
    "stabilizers": [
      "Rhomboid muscles",
      "Transversus abdominis",
      "Oblique muscles",
      "Gluteus medius",
      "Intrinsic hand muscles"
    ],
    "contractionRoles": [
      "Concentric reach",
      "eccentric shoulder and elbow absorption",
      "isometric scapular, trunk and hand closure control."
    ],
    "commonForceOrSkillDemand": "Overhead positioning, visual tracking, grip closure and balance under possible contact.",
    "recommendedExercisePatterns": [
      "Overhead carry",
      "Scapular control",
      "Unilateral press",
      "Grip training"
    ],
    "recommendedExercises": [
      "overhead carry",
      "face pull",
      "single-arm cable press",
      "farmer carry"
    ],
    "transferRationale": "These exercises overlap overhead endurance, scapular control, unilateral bracing and grip, while ball tracking and reception require direct practice.",
    "exerciseSelectionCautions": "Use pain-free overhead ranges and avoid fatigue-induced shoulder shrugging; catching drills should use appropriate ball speed and contact progression.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10098592/",
      "https://www.ncbi.nlm.nih.gov/books/NBK554393/",
      "https://www.americanfootball.sport/a-guide-to-tackle-football/"
    ],
    "sourceSummary": "The records synthesize American-football biomechanics reviews, peer-reviewed cutting and tackling studies, quarterback throwing analyses, anatomy references, and governing-body guidance; confidence is reduced where position-specific evidence or direct exercise-to-performance transfer is limited."
  },
  {
    "id": "american-football-18",
    "sportId": "american-football",
    "label": "hip turn",
    "movementFamily": "hip rotation and reorientation",
    "bodyActions": [
      "Rotate from a defensive or running stance to face a new line",
      "Coordinate feet, pelvis and trunk while preserving balance"
    ],
    "jointActions": [
      "Hip internal and external rotation",
      "Trunk rotation",
      "Knee flexion-extension",
      "Ankle inversion-eversion control"
    ],
    "primeMovers": [
      "Gluteus medius",
      "Gluteus maximus",
      "Adductor muscles",
      "Deep hip rotator muscles",
      "Oblique muscles"
    ],
    "assistingMuscles": [
      "Hamstring muscles",
      "Quadriceps femoris",
      "Iliopsoas",
      "Gastrocnemius"
    ],
    "stabilizers": [
      "Erector spinae",
      "Transversus abdominis",
      "Intrinsic foot muscles",
      "Gluteus minimus"
    ],
    "contractionRoles": [
      "Concentric hip and trunk rotation",
      "eccentric control of planted-leg braking",
      "isometric pelvic and trunk stabilization."
    ],
    "commonForceOrSkillDemand": "Rapid transverse-plane reorientation with unilateral foot-ground interaction.",
    "recommendedExercisePatterns": [
      "Rotational lunge",
      "Landmine rotation",
      "Single-leg balance",
      "Hip stability"
    ],
    "recommendedExercises": [
      "landmine rotation",
      "crossover step-up",
      "single-leg squat-to-stick",
      "lateral lunge"
    ],
    "transferRationale": "The selected movements share transverse-plane control and unilateral pelvic stability, but reactive hip turns require field-specific perception and footwork.",
    "exerciseSelectionCautions": "Avoid twisting on a fixed foot under heavy load; keep rotational range controlled and progress speed only after stable positions are automatic.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://www.mdpi.com/2075-4663/11/9/184",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10098592/",
      "https://www.ncbi.nlm.nih.gov/books/NBK554393/"
    ],
    "sourceSummary": "The records synthesize American-football biomechanics reviews, peer-reviewed cutting and tackling studies, quarterback throwing analyses, anatomy references, and governing-body guidance; confidence is reduced where position-specific evidence or direct exercise-to-performance transfer is limited."
  },
  {
    "id": "american-football-19",
    "sportId": "american-football",
    "label": "change of direction",
    "movementFamily": "multidirectional change of direction",
    "bodyActions": [
      "Brake, plant and accelerate in a new direction",
      "Manage center of mass while responding to a cue or opponent"
    ],
    "jointActions": [
      "Hip flexion, abduction-adduction and rotation",
      "Knee flexion-extension",
      "Ankle dorsiflexion and plantarflexion",
      "Trunk rotation and anti-rotation"
    ],
    "primeMovers": [
      "Gluteus maximus",
      "Gluteus medius",
      "Quadriceps femoris",
      "Hamstring muscles",
      "Adductor muscles"
    ],
    "assistingMuscles": [
      "Gastrocnemius",
      "Soleus",
      "Iliopsoas",
      "Oblique muscles"
    ],
    "stabilizers": [
      "Erector spinae",
      "Deep hip rotator muscles",
      "Transversus abdominis",
      "Intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Eccentric braking",
      "concentric re-acceleration",
      "isometric trunk and pelvic stiffness during the plant."
    ],
    "commonForceOrSkillDemand": "Repeated high-force braking and propulsion across variable angles and time constraints.",
    "recommendedExercisePatterns": [
      "Deceleration",
      "Lateral power",
      "Unilateral strength",
      "Reactive movement"
    ],
    "recommendedExercises": [
      "drop landing",
      "lateral bound",
      "single-leg squat-to-stick",
      "resisted sprint"
    ],
    "transferRationale": "These patterns develop shared braking, unilateral force and re-acceleration qualities; reactive decision-making and technique require multidirectional field practice.",
    "exerciseSelectionCautions": "Increase one variable at a time—angle, speed, volume or reaction demand—and maintain adequate recovery from sprint and plyometric work.",
    "evidenceConfidence": "high",
    "sources": [
      "https://www.mdpi.com/2075-4663/11/9/184",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10098592/",
      "https://www.ncbi.nlm.nih.gov/books/NBK554393/"
    ],
    "sourceSummary": "The records synthesize American-football biomechanics reviews, peer-reviewed cutting and tackling studies, quarterback throwing analyses, anatomy references, and governing-body guidance; confidence is reduced where position-specific evidence or direct exercise-to-performance transfer is limited."
  },
  {
    "id": "american-football-20",
    "sportId": "american-football",
    "label": "ball-carrying contact absorption",
    "movementFamily": "contact force absorption and locomotion",
    "bodyActions": [
      "Run while absorbing bumps and external perturbations",
      "Maintain ball security, balance and forward progress"
    ],
    "jointActions": [
      "Hip and knee flexion-extension",
      "Ankle plantarflexion",
      "Trunk anti-flexion and anti-rotation",
      "Shoulder and elbow flexion with grip closure"
    ],
    "primeMovers": [
      "Gluteus maximus",
      "Quadriceps femoris",
      "Hamstring muscles",
      "Soleus",
      "Latissimus dorsi"
    ],
    "assistingMuscles": [
      "Gastrocnemius",
      "Adductor muscles",
      "Biceps brachii",
      "Brachialis",
      "Pectoralis major"
    ],
    "stabilizers": [
      "Erector spinae",
      "Oblique muscles",
      "Transversus abdominis",
      "Gluteus medius",
      "Rotator cuff muscles",
      "Intrinsic hand muscles"
    ],
    "contractionRoles": [
      "Eccentric lower-body and trunk absorption",
      "concentric re-acceleration",
      "isometric grip, shoulder and torso bracing."
    ],
    "commonForceOrSkillDemand": "Whole-body load acceptance and balance preservation while carrying an implement and resisting contact.",
    "recommendedExercisePatterns": [
      "Loaded carry",
      "Sled drive",
      "Single-leg strength",
      "Anti-rotation bracing"
    ],
    "recommendedExercises": [
      "bear-hug carry",
      "farmer carry",
      "sled push",
      "Pallof press"
    ],
    "transferRationale": "Carries, sled work and unilateral strength overlap load carriage, bracing and force transmission, but ball security and collision skill remain sport-specific.",
    "exerciseSelectionCautions": "Use loads that allow normal gait and breathing; vary carry duration conservatively and do not substitute loaded carries for supervised contact preparation.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10098592/",
      "https://link.springer.com/article/10.1007/s10439-020-02625-7",
      "https://www.americanfootball.sport/a-guide-to-tackle-football/"
    ],
    "sourceSummary": "The records synthesize American-football biomechanics reviews, peer-reviewed cutting and tackling studies, quarterback throwing analyses, anatomy references, and governing-body guidance; confidence is reduced where position-specific evidence or direct exercise-to-performance transfer is limited."
  },
  {
    "id": "basketball-1",
    "sportId": "basketball",
    "label": "acceleration",
    "movementFamily": "linear acceleration",
    "bodyActions": [
      "Forward trunk lean, rapid projection of the center of mass, and repeated powerful steps."
    ],
    "jointActions": [
      "Hip and knee extension",
      "ankle plantarflexion",
      "coordinated shoulder flexion/extension."
    ],
    "primeMovers": [
      "Gluteus maximus",
      "quadriceps femoris",
      "triceps surae (gastrocnemius and soleus)."
    ],
    "assistingMuscles": [
      "Hamstrings",
      "iliopsoas",
      "adductor magnus",
      "anterior deltoid",
      "elbow flexors and extensors."
    ],
    "stabilizers": [
      "Gluteus medius",
      "deep hip rotators",
      "erector spinae",
      "abdominal wall",
      "intrinsic foot muscles."
    ],
    "contractionRoles": [
      "Concentric propulsion after brief eccentric loading",
      "isometric trunk control."
    ],
    "commonForceOrSkillDemand": "High horizontal ground-reaction force and rapid rate of force development.",
    "recommendedExercisePatterns": [
      "sled push",
      "split squat",
      "resisted march"
    ],
    "recommendedExercises": [
      "sled push",
      "split squat",
      "resisted march"
    ],
    "transferRationale": "These patterns train horizontal projection and unilateral-to-bilateral leg drive, sharing force direction and timing without claiming guaranteed sprint transfer.",
    "exerciseSelectionCautions": "Keep resisted loads light enough to preserve posture and step mechanics; progress speed gradually.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4234772/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8355634/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7857967/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed basketball biomechanics and sports-movement studies on jump shooting, landing, acceleration, deceleration, and change of direction, with evidence confidence kept moderate because exercise-to-sport transfer is inferred from shared mechanical demands rather than demonstrated as direct causal performance improvement."
  },
  {
    "id": "basketball-2",
    "sportId": "basketball",
    "label": "defensive shuffle",
    "movementFamily": "lateral locomotion",
    "bodyActions": [
      "Low center of mass with repeated side-to-side repositioning and short contacts."
    ],
    "jointActions": [
      "Hip abduction/adduction",
      "knee and hip flexion-extension",
      "ankle dorsiflexion/plantarflexion."
    ],
    "primeMovers": [
      "Gluteus medius",
      "adductor longus",
      "quadriceps femoris."
    ],
    "assistingMuscles": [
      "Gluteus maximus",
      "hamstrings",
      "soleus",
      "tensor fasciae latae."
    ],
    "stabilizers": [
      "Gluteus minimus",
      "deep hip rotators",
      "obliques",
      "peroneal muscles",
      "intrinsic foot muscles."
    ],
    "contractionRoles": [
      "Concentric lateral push-off, eccentric braking, and isometric posture."
    ],
    "commonForceOrSkillDemand": "Repeated lateral force production while maintaining frontal-plane alignment.",
    "recommendedExercisePatterns": [
      "lateral lunge",
      "lateral sled drag",
      "Copenhagen plank"
    ],
    "recommendedExercises": [
      "lateral lunge",
      "lateral sled drag",
      "Copenhagen plank"
    ],
    "transferRationale": "Lateral lunges and drags provide controlled frontal-plane loading and bracing relevant to shuffle demands.",
    "exerciseSelectionCautions": "Avoid excessive depth or valgus collapse; lateral strength work does not replace reactive defensive skill.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4234772/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8355634/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7857967/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed basketball biomechanics and sports-movement studies on jump shooting, landing, acceleration, deceleration, and change of direction, with evidence confidence kept moderate because exercise-to-sport transfer is inferred from shared mechanical demands rather than demonstrated as direct causal performance improvement."
  },
  {
    "id": "basketball-3",
    "sportId": "basketball",
    "label": "crossover step",
    "movementFamily": "change of direction",
    "bodyActions": [
      "Lateral push-off followed by diagonal crossing step and rapid reorientation."
    ],
    "jointActions": [
      "Hip rotation and abduction/adduction",
      "knee flexion-extension",
      "ankle plantarflexion."
    ],
    "primeMovers": [
      "Gluteus medius",
      "gluteus maximus",
      "adductor magnus",
      "quadriceps femoris."
    ],
    "assistingMuscles": [
      "Hamstrings",
      "soleus",
      "sartorius",
      "tensor fasciae latae."
    ],
    "stabilizers": [
      "Deep hip rotators",
      "obliques",
      "peroneal muscles",
      "intrinsic foot muscles."
    ],
    "contractionRoles": [
      "Concentric push-off, eccentric plant braking, and isometric control."
    ],
    "commonForceOrSkillDemand": "Multiplanar force redirection and high braking demand at the plant.",
    "recommendedExercisePatterns": [
      "crossover step-up",
      "lateral bound",
      "single-leg squat"
    ],
    "recommendedExercises": [
      "crossover step-up",
      "lateral bound",
      "single-leg squat"
    ],
    "transferRationale": "Unilateral step and bound patterns expose the athlete to diagonal projection and landing control similar to a crossover, with scalable load.",
    "exerciseSelectionCautions": "Begin with planned, submaximal angles; do not infer injury prevention or sport-performance causality.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4234772/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8355634/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7857967/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed basketball biomechanics and sports-movement studies on jump shooting, landing, acceleration, deceleration, and change of direction, with evidence confidence kept moderate because exercise-to-sport transfer is inferred from shared mechanical demands rather than demonstrated as direct causal performance improvement."
  },
  {
    "id": "basketball-4",
    "sportId": "basketball",
    "label": "hard deceleration",
    "movementFamily": "deceleration and braking",
    "bodyActions": [
      "Shortened steps, lowered center of mass, and progressive absorption of forward momentum."
    ],
    "jointActions": [
      "Hip and knee flexion",
      "ankle dorsiflexion",
      "trunk flexion control."
    ],
    "primeMovers": [
      "Quadriceps femoris",
      "gluteus maximus",
      "soleus."
    ],
    "assistingMuscles": [
      "Hamstrings",
      "adductor magnus",
      "gastrocnemius."
    ],
    "stabilizers": [
      "Gluteus medius",
      "abdominal wall",
      "erector spinae",
      "foot and ankle stabilizers."
    ],
    "contractionRoles": [
      "Predominantly eccentric braking followed by isometric alignment and possible concentric reacceleration."
    ],
    "commonForceOrSkillDemand": "Large braking impulse and controlled eccentric force absorption.",
    "recommendedExercisePatterns": [
      "split squat",
      "reverse lunge",
      "drop landing"
    ],
    "recommendedExercises": [
      "split squat",
      "reverse lunge",
      "drop landing"
    ],
    "transferRationale": "Split-stance lowering and landing patterns develop eccentric capacity and alignment under braking-like joint positions.",
    "exerciseSelectionCautions": "Use low heights and adequate recovery; speed, surface, footwear, and technique materially alter demand.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4234772/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8355634/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7857967/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed basketball biomechanics and sports-movement studies on jump shooting, landing, acceleration, deceleration, and change of direction, with evidence confidence kept moderate because exercise-to-sport transfer is inferred from shared mechanical demands rather than demonstrated as direct causal performance improvement."
  },
  {
    "id": "basketball-5",
    "sportId": "basketball",
    "label": "cutting",
    "movementFamily": "multidirectional change of direction",
    "bodyActions": [
      "Plant, absorb horizontal momentum, redirect the center of mass, and reaccelerate at an angle."
    ],
    "jointActions": [
      "Hip flexion-extension and rotation",
      "knee flexion-extension",
      "ankle dorsiflexion-plantarflexion."
    ],
    "primeMovers": [
      "Gluteus maximus",
      "gluteus medius",
      "quadriceps femoris",
      "adductor magnus."
    ],
    "assistingMuscles": [
      "Hamstrings",
      "soleus",
      "gastrocnemius",
      "sartorius."
    ],
    "stabilizers": [
      "Deep hip rotators",
      "abdominal obliques",
      "peroneal muscles",
      "intrinsic foot muscles."
    ],
    "contractionRoles": [
      "Eccentric absorption, isometric plant control, then concentric redirection."
    ],
    "commonForceOrSkillDemand": "High transverse/frontal-plane braking and rapid force reorientation.",
    "recommendedExercisePatterns": [
      "lateral bound",
      "single-leg squat-to-stick",
      "split squat"
    ],
    "recommendedExercises": [
      "lateral bound",
      "single-leg squat-to-stick",
      "split squat"
    ],
    "transferRationale": "Unilateral deceleration and bound-to-stick patterns overlap the mechanical sequence of absorbing and redirecting force.",
    "exerciseSelectionCautions": "Progress angle, speed, and perceptual reaction separately; avoid treating gym drills as technical cutting instruction.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4234772/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8355634/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7857967/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed basketball biomechanics and sports-movement studies on jump shooting, landing, acceleration, deceleration, and change of direction, with evidence confidence kept moderate because exercise-to-sport transfer is inferred from shared mechanical demands rather than demonstrated as direct causal performance improvement."
  },
  {
    "id": "basketball-6",
    "sportId": "basketball",
    "label": "jump shot",
    "movementFamily": "vertical jump and projectile release",
    "bodyActions": [
      "Countermovement, bilateral takeoff, aerial organization, and coordinated ball release."
    ],
    "jointActions": [
      "Hip/knee extension",
      "ankle plantarflexion",
      "shoulder flexion",
      "elbow extension",
      "wrist and finger flexion."
    ],
    "primeMovers": [
      "Quadriceps femoris",
      "gluteus maximus",
      "triceps surae",
      "triceps brachii."
    ],
    "assistingMuscles": [
      "Anterior deltoid",
      "pectoralis major",
      "serratus anterior",
      "forearm flexors."
    ],
    "stabilizers": [
      "Rotator cuff",
      "lower trapezius",
      "abdominal wall",
      "gluteus medius."
    ],
    "contractionRoles": [
      "Eccentric countermovement, concentric takeoff/release, and proximal isometric alignment."
    ],
    "commonForceOrSkillDemand": "Sequenced vertical impulse with repeatable upper-limb projection.",
    "recommendedExercisePatterns": [
      "countermovement jump",
      "push press",
      "medicine-ball chest pass"
    ],
    "recommendedExercises": [
      "countermovement jump",
      "push press",
      "medicine-ball chest pass"
    ],
    "transferRationale": "These exercises train broad leg-to-trunk-to-arm sequencing and rate of force development, while the precise shot remains a skill task.",
    "exerciseSelectionCautions": "Use loads that preserve jump and release mechanics; do not claim strength training directly improves shooting accuracy.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4234772/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8355634/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7857967/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed basketball biomechanics and sports-movement studies on jump shooting, landing, acceleration, deceleration, and change of direction, with evidence confidence kept moderate because exercise-to-sport transfer is inferred from shared mechanical demands rather than demonstrated as direct causal performance improvement."
  },
  {
    "id": "basketball-7",
    "sportId": "basketball",
    "label": "layup takeoff",
    "movementFamily": "approach jump",
    "bodyActions": [
      "Approach steps, penultimate braking, unilateral or bilateral takeoff, and airborne reach."
    ],
    "jointActions": [
      "Hip/knee extension",
      "ankle plantarflexion",
      "contralateral arm swing and shoulder elevation."
    ],
    "primeMovers": [
      "Gluteus maximus",
      "quadriceps femoris",
      "triceps surae."
    ],
    "assistingMuscles": [
      "Hamstrings",
      "adductor magnus",
      "iliopsoas",
      "anterior deltoid."
    ],
    "stabilizers": [
      "Gluteus medius",
      "trunk musculature",
      "intrinsic foot muscles",
      "rotator cuff."
    ],
    "contractionRoles": [
      "Eccentric approach absorption followed by concentric propulsion and aerial isometric control."
    ],
    "commonForceOrSkillDemand": "Unilateral approach-to-vertical conversion and timing-dependent impulse.",
    "recommendedExercisePatterns": [
      "single-leg bound",
      "step-up",
      "approach jump"
    ],
    "recommendedExercises": [
      "single-leg bound",
      "step-up",
      "approach jump"
    ],
    "transferRationale": "Unilateral bounds and step-ups provide scalable single-leg propulsion and force absorption related to takeoff mechanics.",
    "exerciseSelectionCautions": "Limit volume and use landing-quality criteria; approach timing and layup technique require court practice.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4234772/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8355634/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7857967/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed basketball biomechanics and sports-movement studies on jump shooting, landing, acceleration, deceleration, and change of direction, with evidence confidence kept moderate because exercise-to-sport transfer is inferred from shared mechanical demands rather than demonstrated as direct causal performance improvement."
  },
  {
    "id": "basketball-8",
    "sportId": "basketball",
    "label": "dunk takeoff",
    "movementFamily": "maximal approach jump",
    "bodyActions": [
      "High-speed approach, penultimate conversion, maximal vertical impulse, and arm swing."
    ],
    "jointActions": [
      "Hip/knee extension",
      "ankle plantarflexion",
      "shoulder flexion/extension."
    ],
    "primeMovers": [
      "Gluteus maximus",
      "quadriceps femoris",
      "triceps surae."
    ],
    "assistingMuscles": [
      "Hamstrings",
      "adductor magnus",
      "iliopsoas",
      "deltoid muscles."
    ],
    "stabilizers": [
      "Gluteus medius",
      "abdominal wall",
      "erector spinae",
      "foot and ankle stabilizers."
    ],
    "contractionRoles": [
      "Eccentric braking then ballistic concentric propulsion with aerial control."
    ],
    "commonForceOrSkillDemand": "High approach velocity, peak impulse, and landing absorption.",
    "recommendedExercisePatterns": [
      "countermovement jump",
      "trap-bar jump",
      "bounding"
    ],
    "recommendedExercises": [
      "countermovement jump",
      "trap-bar jump",
      "bounding"
    ],
    "transferRationale": "Loaded jumps and bounds can develop forceful extension and elastic projection, but dunking depends on technique, approach, and individual capacity.",
    "exerciseSelectionCautions": "Use conservative loading, low repetitions, and qualified supervision; do not chase fatigue in maximal jumps.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4234772/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8355634/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7857967/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed basketball biomechanics and sports-movement studies on jump shooting, landing, acceleration, deceleration, and change of direction, with evidence confidence kept moderate because exercise-to-sport transfer is inferred from shared mechanical demands rather than demonstrated as direct causal performance improvement."
  },
  {
    "id": "basketball-9",
    "sportId": "basketball",
    "label": "rebounding jump",
    "movementFamily": "reactive vertical jump",
    "bodyActions": [
      "Rapid countermovement, vertical contest, arm elevation, and controlled landing in traffic."
    ],
    "jointActions": [
      "Hip/knee extension",
      "ankle plantarflexion",
      "shoulder flexion/elevation."
    ],
    "primeMovers": [
      "Quadriceps femoris",
      "gluteus maximus",
      "triceps surae."
    ],
    "assistingMuscles": [
      "Hamstrings",
      "adductor magnus",
      "deltoid muscles",
      "triceps brachii."
    ],
    "stabilizers": [
      "Gluteus medius",
      "abdominal wall",
      "scapular stabilizers",
      "foot and ankle muscles."
    ],
    "contractionRoles": [
      "Eccentric preload, concentric takeoff, and eccentric landing absorption."
    ],
    "commonForceOrSkillDemand": "Repeated impulse production plus landing and contact control.",
    "recommendedExercisePatterns": [
      "jump-and-stick",
      "trap-bar jump",
      "drop landing"
    ],
    "recommendedExercises": [
      "jump-and-stick",
      "trap-bar jump",
      "drop landing"
    ],
    "transferRationale": "Jump-and-stick and landing progressions address takeoff-to-absorption sequencing relevant to repeated rebounding.",
    "exerciseSelectionCautions": "Control contact and landing density; avoid adding load before consistent bilateral and unilateral landing mechanics.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4234772/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8355634/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7857967/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed basketball biomechanics and sports-movement studies on jump shooting, landing, acceleration, deceleration, and change of direction, with evidence confidence kept moderate because exercise-to-sport transfer is inferred from shared mechanical demands rather than demonstrated as direct causal performance improvement."
  },
  {
    "id": "basketball-10",
    "sportId": "basketball",
    "label": "box-out",
    "movementFamily": "contact positioning",
    "bodyActions": [
      "Wide base, flexed stance, pelvis positioning, contact absorption, and reach while maintaining space."
    ],
    "jointActions": [
      "Hip/knee flexion-extension",
      "hip abduction/adduction and rotation",
      "shoulder elevation/retraction."
    ],
    "primeMovers": [
      "Quadriceps femoris",
      "gluteus maximus",
      "adductor magnus",
      "latissimus dorsi."
    ],
    "assistingMuscles": [
      "Gluteus medius",
      "hamstrings",
      "pectoralis major",
      "trapezius",
      "deltoid muscles."
    ],
    "stabilizers": [
      "Abdominal wall",
      "erector spinae",
      "deep hip rotators",
      "foot and ankle stabilizers",
      "rotator cuff."
    ],
    "contractionRoles": [
      "Isometric bracing with concentric positional adjustments and eccentric resistance to displacement."
    ],
    "commonForceOrSkillDemand": "Sustained whole-body force against contact and perturbation.",
    "recommendedExercisePatterns": [
      "split-squat isometric",
      "belt-squat hold",
      "farmer carry"
    ],
    "recommendedExercises": [
      "split-squat isometric",
      "belt-squat hold",
      "farmer carry"
    ],
    "transferRationale": "Isometrics and carries develop bracing and positional force, but opponent contact and rebounding judgment remain sport-specific.",
    "exerciseSelectionCautions": "Use predictable resistance and neutral joint positions; partner drills require coaching and communication.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4234772/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8355634/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7857967/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed basketball biomechanics and sports-movement studies on jump shooting, landing, acceleration, deceleration, and change of direction, with evidence confidence kept moderate because exercise-to-sport transfer is inferred from shared mechanical demands rather than demonstrated as direct causal performance improvement."
  },
  {
    "id": "basketball-11",
    "sportId": "basketball",
    "label": "crossover dribble",
    "movementFamily": "ball-handling change of direction",
    "bodyActions": [
      "Low stance, lateral weight shift, rapid foot repositioning, and unilateral hand transfer."
    ],
    "jointActions": [
      "Hip/knee flexion-extension",
      "hip rotation",
      "wrist and finger flexion-extension",
      "shoulder motion."
    ],
    "primeMovers": [
      "Gluteus medius",
      "quadriceps femoris",
      "adductor magnus",
      "forearm flexor muscles."
    ],
    "assistingMuscles": [
      "Hamstrings",
      "gluteus maximus",
      "wrist extensor muscles",
      "anterior deltoid."
    ],
    "stabilizers": [
      "Abdominal obliques",
      "deep hip rotators",
      "ankle stabilizers",
      "rotator cuff."
    ],
    "contractionRoles": [
      "Lower-limb eccentric braking/concentric push-off with rhythmic upper-limb control."
    ],
    "commonForceOrSkillDemand": "Fast perception-action coupling with low-position balance and hand control.",
    "recommendedExercisePatterns": [
      "lateral lunge",
      "split-stance cable press",
      "single-leg balance"
    ],
    "recommendedExercises": [
      "lateral lunge",
      "split-stance cable press",
      "single-leg balance"
    ],
    "transferRationale": "These patterns support unilateral base control and trunk stiffness that can complement, but not substitute for, dribbling practice.",
    "exerciseSelectionCautions": "Keep resistance secondary to coordination; avoid grip or shoulder fatigue that changes ball-control mechanics.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4234772/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8355634/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7857967/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed basketball biomechanics and sports-movement studies on jump shooting, landing, acceleration, deceleration, and change of direction, with evidence confidence kept moderate because exercise-to-sport transfer is inferred from shared mechanical demands rather than demonstrated as direct causal performance improvement."
  },
  {
    "id": "basketball-12",
    "sportId": "basketball",
    "label": "drive initiation",
    "movementFamily": "first-step acceleration",
    "bodyActions": [
      "Low stance, decisive first-step projection, forward trunk angle, and protective ball position."
    ],
    "jointActions": [
      "Hip/knee extension",
      "ankle plantarflexion",
      "trunk anti-extension/rotation",
      "shoulder and elbow positioning."
    ],
    "primeMovers": [
      "Gluteus maximus",
      "quadriceps femoris",
      "triceps surae."
    ],
    "assistingMuscles": [
      "Hamstrings",
      "adductor magnus",
      "iliopsoas",
      "pectoralis major",
      "anterior deltoid."
    ],
    "stabilizers": [
      "Gluteus medius",
      "abdominal wall",
      "erector spinae",
      "rotator cuff."
    ],
    "contractionRoles": [
      "Eccentric countermovement then concentric propulsion with isometric ball-control posture."
    ],
    "commonForceOrSkillDemand": "High first-step impulse under a low center of mass.",
    "recommendedExercisePatterns": [
      "sled acceleration",
      "split-stance jump",
      "resisted march"
    ],
    "recommendedExercises": [
      "sled acceleration",
      "split-stance jump",
      "resisted march"
    ],
    "transferRationale": "Resisted starts and split-stance jumps overlap the first-step projection and unilateral impulse demands.",
    "exerciseSelectionCautions": "Do not let sled load lengthen contact times excessively; preserve realistic first-step angles.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4234772/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8355634/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7857967/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed basketball biomechanics and sports-movement studies on jump shooting, landing, acceleration, deceleration, and change of direction, with evidence confidence kept moderate because exercise-to-sport transfer is inferred from shared mechanical demands rather than demonstrated as direct causal performance improvement."
  },
  {
    "id": "basketball-13",
    "sportId": "basketball",
    "label": "drop step",
    "movementFamily": "pivoting and post footwork",
    "bodyActions": [
      "Rotate around a support leg and step behind or around an opponent to create separation."
    ],
    "jointActions": [
      "Hip rotation",
      "knee flexion-extension",
      "ankle pivoting",
      "trunk rotation."
    ],
    "primeMovers": [
      "Gluteus maximus",
      "adductor magnus",
      "quadriceps femoris."
    ],
    "assistingMuscles": [
      "Hamstrings",
      "gluteus medius",
      "sartorius",
      "gastrocnemius."
    ],
    "stabilizers": [
      "Deep hip rotators",
      "abdominal obliques",
      "intrinsic foot muscles",
      "peroneal muscles."
    ],
    "contractionRoles": [
      "Eccentric support-leg loading, concentric drive/rotation, and isometric balance."
    ],
    "commonForceOrSkillDemand": "Unilateral rotational force and foot-ground friction management.",
    "recommendedExercisePatterns": [
      "rotational split squat",
      "landmine rotation",
      "step-behind lunge"
    ],
    "recommendedExercises": [
      "rotational split squat",
      "landmine rotation",
      "step-behind lunge"
    ],
    "transferRationale": "Rotational split squats and controlled step-behind patterns train support-leg loading and trunk-hip coordination.",
    "exerciseSelectionCautions": "Use controlled ranges and stable surfaces; pivot mechanics are sensitive to footwear and knee alignment.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4234772/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8355634/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7857967/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed basketball biomechanics and sports-movement studies on jump shooting, landing, acceleration, deceleration, and change of direction, with evidence confidence kept moderate because exercise-to-sport transfer is inferred from shared mechanical demands rather than demonstrated as direct causal performance improvement."
  },
  {
    "id": "basketball-14",
    "sportId": "basketball",
    "label": "pivot",
    "movementFamily": "rotational footwork",
    "bodyActions": [
      "One foot remains planted while pelvis and trunk rotate and the free foot repositions."
    ],
    "jointActions": [
      "Stance-leg knee/hip isometrics",
      "hip and trunk rotation",
      "ankle and foot pronation-supination control."
    ],
    "primeMovers": [
      "Gluteus medius",
      "quadriceps femoris",
      "gluteus maximus."
    ],
    "assistingMuscles": [
      "Adductor magnus",
      "hamstrings",
      "abdominal obliques",
      "deep hip rotators."
    ],
    "stabilizers": [
      "Intrinsic foot muscles",
      "peroneal muscles",
      "rotator cuff",
      "erector spinae."
    ],
    "contractionRoles": [
      "Isometric stance control with concentric rotation and eccentric deceleration."
    ],
    "commonForceOrSkillDemand": "Rotational control over a fixed support and rapid weight transfer.",
    "recommendedExercisePatterns": [
      "single-leg balance reach",
      "Pallof press",
      "split squat"
    ],
    "recommendedExercises": [
      "single-leg balance reach",
      "Pallof press",
      "split squat"
    ],
    "transferRationale": "Balance reaches and anti-rotation presses develop support-leg and trunk control that underpins pivot stability.",
    "exerciseSelectionCautions": "Avoid forced foot rotation or loaded twisting at end range; technical pivoting must be coached on court.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4234772/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8355634/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7857967/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed basketball biomechanics and sports-movement studies on jump shooting, landing, acceleration, deceleration, and change of direction, with evidence confidence kept moderate because exercise-to-sport transfer is inferred from shared mechanical demands rather than demonstrated as direct causal performance improvement."
  },
  {
    "id": "basketball-15",
    "sportId": "basketball",
    "label": "closeout",
    "movementFamily": "approach-to-braking defense",
    "bodyActions": [
      "Accelerate toward a shooter, shorten steps, lower the hips, and finish balanced with active hands."
    ],
    "jointActions": [
      "Hip/knee flexion-extension",
      "ankle dorsiflexion",
      "shoulder flexion/abduction."
    ],
    "primeMovers": [
      "Quadriceps femoris",
      "gluteus maximus",
      "gluteus medius",
      "soleus."
    ],
    "assistingMuscles": [
      "Hamstrings",
      "gastrocnemius",
      "anterior deltoid",
      "triceps brachii."
    ],
    "stabilizers": [
      "Abdominal wall",
      "hip rotators",
      "foot and ankle stabilizers",
      "rotator cuff."
    ],
    "contractionRoles": [
      "Concentric approach, eccentric braking, and isometric defensive stance."
    ],
    "commonForceOrSkillDemand": "Rapid transition from forward acceleration to controlled braking.",
    "recommendedExercisePatterns": [
      "sprint-to-stop",
      "lateral lunge",
      "split-squat isometric"
    ],
    "recommendedExercises": [
      "sprint-to-stop",
      "lateral lunge",
      "split-squat isometric"
    ],
    "transferRationale": "Sprint-to-stop and stance isometrics reproduce the broad approach-to-braking sequence with adjustable intensity.",
    "exerciseSelectionCautions": "Teach deceleration before maximal speed; active-hand movement should not compromise trunk or knee alignment.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4234772/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8355634/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7857967/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed basketball biomechanics and sports-movement studies on jump shooting, landing, acceleration, deceleration, and change of direction, with evidence confidence kept moderate because exercise-to-sport transfer is inferred from shared mechanical demands rather than demonstrated as direct causal performance improvement."
  },
  {
    "id": "basketball-16",
    "sportId": "basketball",
    "label": "backpedal",
    "movementFamily": "backward locomotion",
    "bodyActions": [
      "Rearward steps with posterior weight shift while retaining visual awareness and readiness to reaccelerate."
    ],
    "jointActions": [
      "Alternating hip extension/flexion",
      "knee flexion-extension",
      "ankle control",
      "trunk orientation."
    ],
    "primeMovers": [
      "Hamstrings",
      "gluteus maximus",
      "quadriceps femoris."
    ],
    "assistingMuscles": [
      "Soleus",
      "gastrocnemius",
      "iliopsoas",
      "adductor magnus."
    ],
    "stabilizers": [
      "Gluteus medius",
      "abdominal wall",
      "erector spinae",
      "foot and ankle stabilizers."
    ],
    "contractionRoles": [
      "Mixed concentric stepping, eccentric braking, and isometric postural control."
    ],
    "commonForceOrSkillDemand": "Backward force application and rapid transition to forward movement.",
    "recommendedExercisePatterns": [
      "backward sled drag",
      "reverse lunge",
      "backpedal-to-sprint"
    ],
    "recommendedExercises": [
      "backward sled drag",
      "reverse lunge",
      "backpedal-to-sprint"
    ],
    "transferRationale": "Backward drags and reverse lunges train posterior-chain force and controlled backward loading; transition speed remains skill-specific.",
    "exerciseSelectionCautions": "Use clear space and low speeds initially; avoid excessive backward lean or visual obstruction.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4234772/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8355634/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7857967/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed basketball biomechanics and sports-movement studies on jump shooting, landing, acceleration, deceleration, and change of direction, with evidence confidence kept moderate because exercise-to-sport transfer is inferred from shared mechanical demands rather than demonstrated as direct causal performance improvement."
  },
  {
    "id": "basketball-17",
    "sportId": "basketball",
    "label": "screen contact",
    "movementFamily": "contact bracing",
    "bodyActions": [
      "Braced stance absorbs or redirects external force while preserving position and upper-body organization."
    ],
    "jointActions": [
      "Hip/knee isometric flexion",
      "ankle stiffness",
      "trunk anti-rotation",
      "shoulder/scapular positioning."
    ],
    "primeMovers": [
      "Quadriceps femoris",
      "gluteus maximus",
      "adductor magnus",
      "soleus."
    ],
    "assistingMuscles": [
      "Gluteus medius",
      "hamstrings",
      "latissimus dorsi",
      "trapezius",
      "pectoralis major."
    ],
    "stabilizers": [
      "Abdominal wall",
      "erector spinae",
      "deep hip rotators",
      "intrinsic foot muscles",
      "rotator cuff."
    ],
    "contractionRoles": [
      "Predominantly isometric bracing with eccentric absorption and concentric repositioning."
    ],
    "commonForceOrSkillDemand": "Whole-body stiffness and force transmission under unpredictable contact.",
    "recommendedExercisePatterns": [
      "farmer carry",
      "split-squat isometric",
      "front-rack carry"
    ],
    "recommendedExercises": [
      "farmer carry",
      "split-squat isometric",
      "front-rack carry"
    ],
    "transferRationale": "Carries and split-stance isometrics provide bracing and positional force under external load without implying direct contact-performance gains.",
    "exerciseSelectionCautions": "Use submaximal predictable perturbations; contact drills need qualified coaching and appropriate rules.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4234772/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8355634/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7857967/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed basketball biomechanics and sports-movement studies on jump shooting, landing, acceleration, deceleration, and change of direction, with evidence confidence kept moderate because exercise-to-sport transfer is inferred from shared mechanical demands rather than demonstrated as direct causal performance improvement."
  },
  {
    "id": "basketball-18",
    "sportId": "basketball",
    "label": "overhead pass",
    "movementFamily": "overhead press/throw",
    "bodyActions": [
      "Stable base, forward weight transfer, overhead arm path, and release through the hands."
    ],
    "jointActions": [
      "Shoulder flexion/abduction",
      "elbow extension",
      "wrist and finger flexion",
      "trunk and hip extension."
    ],
    "primeMovers": [
      "Anterior deltoid",
      "triceps brachii",
      "pectoralis major",
      "serratus anterior."
    ],
    "assistingMuscles": [
      "Upper trapezius",
      "rotator cuff",
      "forearm flexor muscles",
      "gluteus maximus."
    ],
    "stabilizers": [
      "Lower trapezius",
      "rhomboid muscles",
      "abdominal wall",
      "lower-limb stabilizers."
    ],
    "contractionRoles": [
      "Concentric projection with eccentric arm deceleration and proximal isometric control."
    ],
    "commonForceOrSkillDemand": "Coordinated leg-to-trunk-to-arm force transfer and directional accuracy.",
    "recommendedExercisePatterns": [
      "medicine-ball overhead throw",
      "landmine press",
      "cable press"
    ],
    "recommendedExercises": [
      "medicine-ball overhead throw",
      "landmine press",
      "cable press"
    ],
    "transferRationale": "Ballistic throws and landmine presses share broad projection and proximal-to-distal sequencing, while pass accuracy remains technical.",
    "exerciseSelectionCautions": "Use appropriate ball mass and stop before release mechanics deteriorate; protect the shoulder with balanced pulling and cuff work.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4234772/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8355634/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7857967/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed basketball biomechanics and sports-movement studies on jump shooting, landing, acceleration, deceleration, and change of direction, with evidence confidence kept moderate because exercise-to-sport transfer is inferred from shared mechanical demands rather than demonstrated as direct causal performance improvement."
  },
  {
    "id": "basketball-19",
    "sportId": "basketball",
    "label": "chest pass",
    "movementFamily": "horizontal press and ballistic pass",
    "bodyActions": [
      "Bilateral base, forward weight transfer, horizontal arm projection, and hand release."
    ],
    "jointActions": [
      "Shoulder horizontal adduction",
      "elbow extension",
      "wrist/finger flexion",
      "scapular protraction."
    ],
    "primeMovers": [
      "Pectoralis major",
      "anterior deltoid",
      "triceps brachii",
      "serratus anterior."
    ],
    "assistingMuscles": [
      "Forearm flexor muscles",
      "gluteus maximus",
      "quadriceps femoris",
      "abdominal obliques."
    ],
    "stabilizers": [
      "Rotator cuff",
      "lower trapezius",
      "rhomboid muscles",
      "trunk and foot stabilizers."
    ],
    "contractionRoles": [
      "Concentric propulsion with eccentric arm deceleration and isometric trunk control."
    ],
    "commonForceOrSkillDemand": "Rapid horizontal impulse with coordinated whole-body transfer.",
    "recommendedExercisePatterns": [
      "medicine-ball chest pass",
      "push-up",
      "cable press"
    ],
    "recommendedExercises": [
      "medicine-ball chest pass",
      "push-up",
      "cable press"
    ],
    "transferRationale": "Chest throws and pressing patterns overlap horizontal projection and trunk-controlled force transfer.",
    "exerciseSelectionCautions": "Do not use excessive ball mass or fatigue; keep shoulders centered and use pain-free range.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4234772/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8355634/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7857967/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed basketball biomechanics and sports-movement studies on jump shooting, landing, acceleration, deceleration, and change of direction, with evidence confidence kept moderate because exercise-to-sport transfer is inferred from shared mechanical demands rather than demonstrated as direct causal performance improvement."
  },
  {
    "id": "basketball-20",
    "sportId": "basketball",
    "label": "lateral recovery",
    "movementFamily": "lateral recovery and change of direction",
    "bodyActions": [
      "Reorient after displacement, push laterally, regain flexed defensive posture, and restore alignment."
    ],
    "jointActions": [
      "Hip abduction/adduction and rotation",
      "knee flexion-extension",
      "ankle plantarflexion/dorsiflexion."
    ],
    "primeMovers": [
      "Gluteus medius",
      "gluteus maximus",
      "adductor magnus",
      "quadriceps femoris."
    ],
    "assistingMuscles": [
      "Hamstrings",
      "soleus",
      "gastrocnemius",
      "tensor fasciae latae."
    ],
    "stabilizers": [
      "Deep hip rotators",
      "abdominal obliques",
      "peroneal muscles",
      "intrinsic foot muscles."
    ],
    "contractionRoles": [
      "Eccentric braking followed by concentric lateral propulsion and isometric stance control."
    ],
    "commonForceOrSkillDemand": "Reactive multidirectional force production and repeated reacceleration.",
    "recommendedExercisePatterns": [
      "lateral bound",
      "crossover step-up",
      "lateral sled drag"
    ],
    "recommendedExercises": [
      "lateral bound",
      "crossover step-up",
      "lateral sled drag"
    ],
    "transferRationale": "Lateral bounds, step-ups, and drags train the broad braking-to-propulsion sequence relevant to recovery movement.",
    "exerciseSelectionCautions": "Progress from planned to reactive work; monitor cumulative high-intensity change-of-direction volume.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4234772/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8355634/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7857967/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed basketball biomechanics and sports-movement studies on jump shooting, landing, acceleration, deceleration, and change of direction, with evidence confidence kept moderate because exercise-to-sport transfer is inferred from shared mechanical demands rather than demonstrated as direct causal performance improvement."
  },
  {
    "id": "soccer-1",
    "sportId": "soccer",
    "label": "acceleration",
    "movementFamily": "locomotion and first-step propulsion",
    "bodyActions": [
      "forward projection",
      "rapid hip/knee extension"
    ],
    "jointActions": [
      "hip extension",
      "knee extension",
      "ankle plantarflexion"
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps femoris",
      "soleus"
    ],
    "assistingMuscles": [
      "hamstring muscles",
      "adductor magnus",
      "gastrocnemius"
    ],
    "stabilizers": [
      "gluteus medius",
      "transversus abdominis",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "concentric propulsion",
      "isometric trunk control"
    ],
    "commonForceOrSkillDemand": "high-force horizontal impulse and short ground contacts",
    "recommendedExercisePatterns": [
      "split squat",
      "hip thrust",
      "sled push",
      "calf raise"
    ],
    "recommendedExercises": [
      "split squat",
      "hip thrust",
      "sled push",
      "calf raise"
    ],
    "transferRationale": "Hip and knee extensors plus ankle stiffness help reproduce the force direction and unilateral control of the first steps; gym work supports capacity, not sprint skill.",
    "exerciseSelectionCautions": "Progress load and velocity separately; avoid treating bilateral strength as proof of faster acceleration.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pubmed.ncbi.nlm.nih.gov/9596356/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3786235/",
      "https://inside.fifa.com/health-and-medical/injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed soccer biomechanics and kicking reviews plus FIFA injury-prevention guidance; evidence is strongest for movement mechanics and general physical preparation, while direct gym-to-sport performance transfer remains limited or indirect for several technical and contact skills."
  },
  {
    "id": "soccer-2",
    "sportId": "soccer",
    "label": "max-speed sprinting",
    "movementFamily": "high-speed upright running",
    "bodyActions": [
      "cyclic hip flexion/extension",
      "stiff ankle rebound"
    ],
    "jointActions": [
      "hip extension/flexion",
      "knee extension then flexion",
      "ankle plantarflexion"
    ],
    "primeMovers": [
      "gluteus maximus",
      "hamstring muscles",
      "gastrocnemius"
    ],
    "assistingMuscles": [
      "quadriceps femoris",
      "iliopsoas",
      "soleus"
    ],
    "stabilizers": [
      "gluteus medius",
      "tibialis anterior",
      "trunk musculature"
    ],
    "contractionRoles": [
      "concentric propulsion",
      "eccentric late-swing hamstring braking",
      "elastic ankle recoil"
    ],
    "commonForceOrSkillDemand": "high velocity, stiffness, and late-swing braking",
    "recommendedExercisePatterns": [
      "Romanian deadlift",
      "Nordic hamstring curl",
      "hip thrust",
      "calf raise"
    ],
    "recommendedExercises": [
      "Romanian deadlift",
      "Nordic hamstring curl",
      "hip thrust",
      "calf raise"
    ],
    "transferRationale": "Posterior-chain and calf patterns address force production and braking demands that coexist in sprinting, while technical exposure remains essential.",
    "exerciseSelectionCautions": "Use conservative sprint volumes and hamstring progressions; do not infer injury prevention from one exercise.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pubmed.ncbi.nlm.nih.gov/9596356/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3786235/",
      "https://inside.fifa.com/health-and-medical/injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed soccer biomechanics and kicking reviews plus FIFA injury-prevention guidance; evidence is strongest for movement mechanics and general physical preparation, while direct gym-to-sport performance transfer remains limited or indirect for several technical and contact skills."
  },
  {
    "id": "soccer-3",
    "sportId": "soccer",
    "label": "cutting",
    "movementFamily": "angled deceleration and redirection",
    "bodyActions": [
      "plant-and-brake",
      "lateral re-acceleration"
    ],
    "jointActions": [
      "hip adduction/abduction and rotation",
      "knee flexion/extension",
      "ankle dorsiflexion"
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus medius",
      "adductor magnus"
    ],
    "assistingMuscles": [
      "gluteus maximus",
      "hamstring muscles",
      "soleus"
    ],
    "stabilizers": [
      "peroneal muscles",
      "intrinsic foot muscles",
      "obliquus externus abdominis"
    ],
    "contractionRoles": [
      "eccentric braking",
      "concentric redirection",
      "isometric frontal-plane control"
    ],
    "commonForceOrSkillDemand": "high braking impulse with single-leg alignment",
    "recommendedExercisePatterns": [
      "lateral lunge",
      "split squat",
      "lateral bound",
      "Copenhagen plank"
    ],
    "recommendedExercises": [
      "lateral lunge",
      "split squat",
      "lateral bound",
      "Copenhagen plank"
    ],
    "transferRationale": "Frontal-plane and unilateral strength overlaps with the plant, brake, and push-off sequence; actual cutting transfer requires reactive practice.",
    "exerciseSelectionCautions": "Control knee valgus and foot collapse; progress angle, speed, and decision demand gradually.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pubmed.ncbi.nlm.nih.gov/9596356/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3786235/",
      "https://inside.fifa.com/health-and-medical/injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed soccer biomechanics and kicking reviews plus FIFA injury-prevention guidance; evidence is strongest for movement mechanics and general physical preparation, while direct gym-to-sport performance transfer remains limited or indirect for several technical and contact skills."
  },
  {
    "id": "soccer-4",
    "sportId": "soccer",
    "label": "lateral shuffle",
    "movementFamily": "lateral repositioning",
    "bodyActions": [
      "sideways push-off",
      "rapid repeated foot contacts"
    ],
    "jointActions": [
      "hip abduction/adduction",
      "knee flexion",
      "ankle eversion/inversion control"
    ],
    "primeMovers": [
      "gluteus medius",
      "adductor magnus",
      "quadriceps femoris"
    ],
    "assistingMuscles": [
      "gluteus maximus",
      "soleus",
      "hamstring muscles"
    ],
    "stabilizers": [
      "peroneal muscles",
      "trunk musculature",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "concentric lateral push",
      "eccentric absorption",
      "isometric pelvic control"
    ],
    "commonForceOrSkillDemand": "repeated lateral force and low center of mass",
    "recommendedExercisePatterns": [
      "lateral lunge",
      "lateral bound",
      "Copenhagen plank",
      "split squat"
    ],
    "recommendedExercises": [
      "lateral lunge",
      "lateral bound",
      "Copenhagen plank",
      "split squat"
    ],
    "transferRationale": "Lateral lunges and bounds train the broad force directions and pelvic control used in shuffling without claiming identical timing.",
    "exerciseSelectionCautions": "Avoid excessive depth or unstable surfaces when fatigue degrades knee and ankle alignment.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pubmed.ncbi.nlm.nih.gov/9596356/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3786235/",
      "https://inside.fifa.com/health-and-medical/injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed soccer biomechanics and kicking reviews plus FIFA injury-prevention guidance; evidence is strongest for movement mechanics and general physical preparation, while direct gym-to-sport performance transfer remains limited or indirect for several technical and contact skills."
  },
  {
    "id": "soccer-5",
    "sportId": "soccer",
    "label": "deceleration",
    "movementFamily": "braking from running",
    "bodyActions": [
      "lowering center of mass",
      "absorbing forward momentum"
    ],
    "jointActions": [
      "hip flexion",
      "knee flexion",
      "ankle dorsiflexion"
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus maximus",
      "soleus"
    ],
    "assistingMuscles": [
      "hamstring muscles",
      "gluteus medius",
      "gastrocnemius"
    ],
    "stabilizers": [
      "adductor magnus",
      "trunk musculature",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "eccentric braking",
      "isometric posture",
      "concentric re-acceleration"
    ],
    "commonForceOrSkillDemand": "large eccentric load and braking impulse",
    "recommendedExercisePatterns": [
      "reverse lunge",
      "split squat",
      "step-down",
      "Nordic hamstring curl"
    ],
    "recommendedExercises": [
      "reverse lunge",
      "split squat",
      "step-down",
      "Nordic hamstring curl"
    ],
    "transferRationale": "Eccentric knee/hip capacity and unilateral control are relevant to braking; deceleration skill must still be trained at appropriate speeds.",
    "exerciseSelectionCautions": "Increase speed and stopping distance progressively; monitor soreness and prior lower-limb injury.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pubmed.ncbi.nlm.nih.gov/9596356/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3786235/",
      "https://inside.fifa.com/health-and-medical/injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed soccer biomechanics and kicking reviews plus FIFA injury-prevention guidance; evidence is strongest for movement mechanics and general physical preparation, while direct gym-to-sport performance transfer remains limited or indirect for several technical and contact skills."
  },
  {
    "id": "soccer-6",
    "sportId": "soccer",
    "label": "instep kick",
    "movementFamily": "maximal ball striking",
    "bodyActions": [
      "backswing",
      "pelvic/trunk rotation",
      "rapid swing and foot stabilization"
    ],
    "jointActions": [
      "hip extension then flexion",
      "knee flexion then extension",
      "ankle plantarflexion/stiffening"
    ],
    "primeMovers": [
      "quadriceps femoris",
      "iliopsoas",
      "gluteus maximus"
    ],
    "assistingMuscles": [
      "hamstring muscles",
      "adductor magnus",
      "gastrocnemius"
    ],
    "stabilizers": [
      "gluteus medius",
      "obliquus externus abdominis",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "eccentric backswing",
      "concentric knee/hip swing",
      "isometric plant-leg control"
    ],
    "commonForceOrSkillDemand": "unilateral proximal-to-distal sequencing and impact control",
    "recommendedExercisePatterns": [
      "split squat",
      "hip thrust",
      "cable rotation",
      "calf raise"
    ],
    "recommendedExercises": [
      "split squat",
      "hip thrust",
      "cable rotation",
      "calf raise"
    ],
    "transferRationale": "Strength patterns support the plant leg and proximal force base described in kicking biomechanics, but ball velocity depends strongly on technique and coordination.",
    "exerciseSelectionCautions": "Avoid overloading the kicking leg while neglecting plant-leg control; preserve full hip and knee range.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pubmed.ncbi.nlm.nih.gov/9596356/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3786235/",
      "https://inside.fifa.com/health-and-medical/injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed soccer biomechanics and kicking reviews plus FIFA injury-prevention guidance; evidence is strongest for movement mechanics and general physical preparation, while direct gym-to-sport performance transfer remains limited or indirect for several technical and contact skills."
  },
  {
    "id": "soccer-7",
    "sportId": "soccer",
    "label": "driven pass",
    "movementFamily": "driven pass",
    "bodyActions": [
      "short-to-medium firm ball strike"
    ],
    "jointActions": [
      "single-leg plant",
      "controlled hip swing",
      "directional follow-through"
    ],
    "primeMovers": [
      "hip rotation/flexion",
      "knee extension",
      "ankle stabilization"
    ],
    "assistingMuscles": [
      "quadriceps femoris",
      "adductor magnus",
      "gluteus medius"
    ],
    "stabilizers": [
      "iliopsoas",
      "gluteus maximus",
      "hamstring muscles"
    ],
    "contractionRoles": [
      "isometric plant",
      "concentric swing",
      "eccentric follow-through"
    ],
    "commonForceOrSkillDemand": "precision under moderate speed and variable angle",
    "recommendedExercisePatterns": [
      "split squat",
      "cable rotation",
      "single-leg RDL",
      "calf raise"
    ],
    "recommendedExercises": [
      "split squat",
      "cable rotation",
      "single-leg RDL",
      "calf raise"
    ],
    "transferRationale": "Unilateral strength and rotational control provide a plausible base for a firm pass, while accuracy is a technical skill rather than a gym outcome.",
    "exerciseSelectionCautions": "Use submaximal loads for rotational work and avoid forcing lumbar rotation.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pubmed.ncbi.nlm.nih.gov/9596356/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3786235/",
      "https://inside.fifa.com/health-and-medical/injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed soccer biomechanics and kicking reviews plus FIFA injury-prevention guidance; evidence is strongest for movement mechanics and general physical preparation, while direct gym-to-sport performance transfer remains limited or indirect for several technical and contact skills."
  },
  {
    "id": "soccer-8",
    "sportId": "soccer",
    "label": "long pass",
    "movementFamily": "long pass",
    "bodyActions": [
      "long-range instep striking"
    ],
    "jointActions": [
      "long backswing",
      "forceful hip swing",
      "stable plant and follow-through"
    ],
    "primeMovers": [
      "hip extension/flexion and rotation",
      "knee extension",
      "ankle plantarflexion"
    ],
    "assistingMuscles": [
      "quadriceps femoris",
      "gluteus maximus",
      "iliopsoas"
    ],
    "stabilizers": [
      "hamstring muscles",
      "adductor magnus",
      "gastrocnemius"
    ],
    "contractionRoles": [
      "eccentric wind-up",
      "concentric strike",
      "isometric stance control"
    ],
    "commonForceOrSkillDemand": "large range, high segmental speed, and balance",
    "recommendedExercisePatterns": [
      "Romanian deadlift",
      "split squat",
      "cable rotation",
      "hip thrust"
    ],
    "recommendedExercises": [
      "Romanian deadlift",
      "split squat",
      "cable rotation",
      "hip thrust"
    ],
    "transferRationale": "Posterior-chain and unilateral rotational patterns overlap with the force base and balance of long passing, but no direct performance claim is warranted.",
    "exerciseSelectionCautions": "Progress range and velocity; avoid excessive kicking-volume spikes alongside heavy lower-body training.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pubmed.ncbi.nlm.nih.gov/9596356/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3786235/",
      "https://inside.fifa.com/health-and-medical/injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed soccer biomechanics and kicking reviews plus FIFA injury-prevention guidance; evidence is strongest for movement mechanics and general physical preparation, while direct gym-to-sport performance transfer remains limited or indirect for several technical and contact skills."
  },
  {
    "id": "soccer-9",
    "sportId": "soccer",
    "label": "crossing",
    "movementFamily": "running or angled ball delivery",
    "bodyActions": [
      "approach run",
      "plant-leg stabilization",
      "rotational swing and elevated follow-through"
    ],
    "jointActions": [
      "hip rotation/abduction",
      "knee extension",
      "ankle stabilization"
    ],
    "primeMovers": [
      "gluteus medius",
      "quadriceps femoris",
      "adductor magnus"
    ],
    "assistingMuscles": [
      "gluteus maximus",
      "iliopsoas",
      "obliquus externus abdominis"
    ],
    "stabilizers": [
      "hamstring muscles",
      "soleus",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "eccentric approach braking",
      "concentric swing",
      "isometric plant control"
    ],
    "commonForceOrSkillDemand": "unilateral balance with directional precision",
    "recommendedExercisePatterns": [
      "single-leg RDL",
      "split squat",
      "cable rotation",
      "lateral lunge"
    ],
    "recommendedExercises": [
      "single-leg RDL",
      "split squat",
      "cable rotation",
      "lateral lunge"
    ],
    "transferRationale": "Unilateral hip control and rotation are relevant to crossing mechanics; exercise transfer should be viewed as general physical preparation.",
    "exerciseSelectionCautions": "Do not substitute loaded rotation for technical crossing; keep the plant knee tracking over the foot.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pubmed.ncbi.nlm.nih.gov/9596356/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3786235/",
      "https://inside.fifa.com/health-and-medical/injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed soccer biomechanics and kicking reviews plus FIFA injury-prevention guidance; evidence is strongest for movement mechanics and general physical preparation, while direct gym-to-sport performance transfer remains limited or indirect for several technical and contact skills."
  },
  {
    "id": "soccer-10",
    "sportId": "soccer",
    "label": "shooting",
    "movementFamily": "high-velocity ball striking",
    "bodyActions": [
      "approach and plant",
      "pelvis-to-trunk rotation",
      "rapid leg swing and follow-through"
    ],
    "jointActions": [
      "hip rotation/flexion",
      "knee extension",
      "ankle plantarflexion"
    ],
    "primeMovers": [
      "quadriceps femoris",
      "iliopsoas",
      "gluteus maximus"
    ],
    "assistingMuscles": [
      "adductor magnus",
      "hamstring muscles",
      "gastrocnemius"
    ],
    "stabilizers": [
      "gluteus medius",
      "obliquus externus abdominis",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "eccentric backswing",
      "concentric strike",
      "eccentric braking",
      "isometric plant"
    ],
    "commonForceOrSkillDemand": "maximal unilateral power and accuracy under pressure",
    "recommendedExercisePatterns": [
      "split squat",
      "hip thrust",
      "cable rotation",
      "medicine-ball rotational throw"
    ],
    "recommendedExercises": [
      "split squat",
      "hip thrust",
      "cable rotation",
      "medicine-ball rotational throw"
    ],
    "transferRationale": "Lower-body power and rotational sequencing are sensible preparatory targets, but shooting outcome is not established by these exercises alone.",
    "exerciseSelectionCautions": "Manage high-intensity kicking and rotational loads; prioritize technique, tissue tolerance, and bilateral development.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pubmed.ncbi.nlm.nih.gov/9596356/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3786235/",
      "https://inside.fifa.com/health-and-medical/injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed soccer biomechanics and kicking reviews plus FIFA injury-prevention guidance; evidence is strongest for movement mechanics and general physical preparation, while direct gym-to-sport performance transfer remains limited or indirect for several technical and contact skills."
  },
  {
    "id": "soccer-11",
    "sportId": "soccer",
    "label": "jumping header",
    "movementFamily": "jumping header",
    "bodyActions": [
      "vertical takeoff and aerial contact"
    ],
    "jointActions": [
      "countermovement",
      "bilateral or unilateral takeoff",
      "trunk and neck positioning"
    ],
    "primeMovers": [
      "hip/knee extension",
      "ankle plantarflexion",
      "cervical flexion/extension control"
    ],
    "assistingMuscles": [
      "gluteus maximus",
      "quadriceps femoris",
      "gastrocnemius"
    ],
    "stabilizers": [
      "soleus",
      "hamstring muscles",
      "adductor magnus"
    ],
    "contractionRoles": [
      "eccentric countermovement",
      "concentric takeoff",
      "isometric aerial bracing"
    ],
    "commonForceOrSkillDemand": "vertical impulse, timing, and safe landing",
    "recommendedExercisePatterns": [
      "jump squat",
      "calf raise",
      "split squat",
      "landing drill"
    ],
    "recommendedExercises": [
      "jump squat",
      "calf raise",
      "split squat",
      "landing drill"
    ],
    "transferRationale": "Jump patterns train takeoff and landing capacity; heading timing and neck-ball interaction remain sport-specific.",
    "exerciseSelectionCautions": "Teach landing mechanics and neck control; avoid implying resistance training prevents concussion.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pubmed.ncbi.nlm.nih.gov/9596356/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3786235/",
      "https://inside.fifa.com/health-and-medical/injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed soccer biomechanics and kicking reviews plus FIFA injury-prevention guidance; evidence is strongest for movement mechanics and general physical preparation, while direct gym-to-sport performance transfer remains limited or indirect for several technical and contact skills."
  },
  {
    "id": "soccer-12",
    "sportId": "soccer",
    "label": "standing header",
    "movementFamily": "stationary aerial ball contact",
    "bodyActions": [
      "braced stance",
      "trunk extension/flexion impulse",
      "neck positioning"
    ],
    "jointActions": [
      "ankle/knee/hip stabilization",
      "trunk flexion/extension",
      "cervical isometric control"
    ],
    "primeMovers": [
      "rectus abdominis",
      "obliquus externus abdominis",
      "erector spinae"
    ],
    "assistingMuscles": [
      "quadriceps femoris",
      "gluteus maximus",
      "sternocleidomastoid"
    ],
    "stabilizers": [
      "gluteus medius",
      "soleus",
      "deep cervical flexors"
    ],
    "contractionRoles": [
      "isometric stance",
      "concentric trunk impulse",
      "controlled cervical action"
    ],
    "commonForceOrSkillDemand": "timing, balance, and forceful but controlled contact",
    "recommendedExercisePatterns": [
      "Pallof press",
      "front plank",
      "split squat",
      "medicine-ball chest pass"
    ],
    "recommendedExercises": [
      "Pallof press",
      "front plank",
      "split squat",
      "medicine-ball chest pass"
    ],
    "transferRationale": "Trunk bracing and stance strength support body control, but no gym exercise is a substitute for heading technique or concussion protocols.",
    "exerciseSelectionCautions": "Avoid loaded cervical flexion/extension; follow governing-body heading guidance and age-appropriate exposure.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pubmed.ncbi.nlm.nih.gov/9596356/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3786235/",
      "https://inside.fifa.com/health-and-medical/injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed soccer biomechanics and kicking reviews plus FIFA injury-prevention guidance; evidence is strongest for movement mechanics and general physical preparation, while direct gym-to-sport performance transfer remains limited or indirect for several technical and contact skills."
  },
  {
    "id": "soccer-13",
    "sportId": "soccer",
    "label": "tackling",
    "movementFamily": "grounded or sliding challenge",
    "bodyActions": [
      "approach and plant",
      "low-level entry",
      "contact absorption and recovery"
    ],
    "jointActions": [
      "hip/knee flexion and extension",
      "ankle dorsiflexion",
      "trunk rotation"
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus maximus",
      "adductor magnus"
    ],
    "assistingMuscles": [
      "hamstring muscles",
      "gluteus medius",
      "soleus"
    ],
    "stabilizers": [
      "trunk musculature",
      "intrinsic foot muscles",
      "obliquus externus abdominis"
    ],
    "contractionRoles": [
      "eccentric lowering",
      "isometric bracing",
      "concentric recovery"
    ],
    "commonForceOrSkillDemand": "contact tolerance, low position, and rapid recovery",
    "recommendedExercisePatterns": [
      "split squat",
      "lateral lunge",
      "sled push",
      "front plank"
    ],
    "recommendedExercises": [
      "split squat",
      "lateral lunge",
      "sled push",
      "front plank"
    ],
    "transferRationale": "Unilateral leg and trunk bracing patterns overlap with entering and recovering from a tackle, while technique and rules govern safety.",
    "exerciseSelectionCautions": "Do not use maximal-contact drills as conditioning; coach legal technique and protect knees/ankles.",
    "evidenceConfidence": "limited",
    "sources": [
      "https://pubmed.ncbi.nlm.nih.gov/9596356/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3786235/",
      "https://inside.fifa.com/health-and-medical/injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed soccer biomechanics and kicking reviews plus FIFA injury-prevention guidance; evidence is strongest for movement mechanics and general physical preparation, while direct gym-to-sport performance transfer remains limited or indirect for several technical and contact skills."
  },
  {
    "id": "soccer-14",
    "sportId": "soccer",
    "label": "shielding",
    "movementFamily": "ball protection with opponent between ball and defender",
    "bodyActions": [
      "wide base",
      "hip rotation",
      "lateral pressure and trunk bracing"
    ],
    "jointActions": [
      "hip abduction/adduction/rotation",
      "knee flexion",
      "trunk anti-rotation"
    ],
    "primeMovers": [
      "gluteus medius",
      "adductor magnus",
      "obliquus externus abdominis"
    ],
    "assistingMuscles": [
      "gluteus maximus",
      "quadriceps femoris",
      "latissimus dorsi"
    ],
    "stabilizers": [
      "hamstring muscles",
      "soleus",
      "transversus abdominis"
    ],
    "contractionRoles": [
      "isometric bracing",
      "eccentric repositioning",
      "concentric pivot"
    ],
    "commonForceOrSkillDemand": "sustained contact, balance, and anti-rotation",
    "recommendedExercisePatterns": [
      "Copenhagen plank",
      "lateral lunge",
      "Pallof press",
      "suitcase carry"
    ],
    "recommendedExercises": [
      "Copenhagen plank",
      "lateral lunge",
      "Pallof press",
      "suitcase carry"
    ],
    "transferRationale": "Adductor, lateral-hip, and anti-rotation work mirrors the broad physical demands of shielding without reproducing opponent contact.",
    "exerciseSelectionCautions": "Progress adductor loading gradually; avoid excessive spinal twisting under load.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pubmed.ncbi.nlm.nih.gov/9596356/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3786235/",
      "https://inside.fifa.com/health-and-medical/injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed soccer biomechanics and kicking reviews plus FIFA injury-prevention guidance; evidence is strongest for movement mechanics and general physical preparation, while direct gym-to-sport performance transfer remains limited or indirect for several technical and contact skills."
  },
  {
    "id": "soccer-15",
    "sportId": "soccer",
    "label": "jockeying",
    "movementFamily": "defensive low stance and reactive mirroring",
    "bodyActions": [
      "low posture",
      "short lateral/diagonal steps",
      "braking and re-acceleration"
    ],
    "jointActions": [
      "hip/knee flexion",
      "hip abduction/adduction",
      "ankle dorsiflexion"
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus medius",
      "adductor magnus"
    ],
    "assistingMuscles": [
      "gluteus maximus",
      "soleus",
      "hamstring muscles"
    ],
    "stabilizers": [
      "peroneal muscles",
      "trunk musculature",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "isometric low-position control",
      "eccentric braking",
      "concentric steps"
    ],
    "commonForceOrSkillDemand": "repeated reactive lateral force and posture maintenance",
    "recommendedExercisePatterns": [
      "lateral lunge",
      "split squat isometric",
      "lateral bound",
      "Copenhagen plank"
    ],
    "recommendedExercises": [
      "lateral lunge",
      "split squat isometric",
      "lateral bound",
      "Copenhagen plank"
    ],
    "transferRationale": "Isometric split-stance and frontal-plane patterns support positional endurance; reactive perceptual skill requires field training.",
    "exerciseSelectionCautions": "Do not hold deep positions to failure; keep foot contacts quiet and progress reaction speed carefully.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pubmed.ncbi.nlm.nih.gov/9596356/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3786235/",
      "https://inside.fifa.com/health-and-medical/injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed soccer biomechanics and kicking reviews plus FIFA injury-prevention guidance; evidence is strongest for movement mechanics and general physical preparation, while direct gym-to-sport performance transfer remains limited or indirect for several technical and contact skills."
  },
  {
    "id": "soccer-16",
    "sportId": "soccer",
    "label": "backpedaling",
    "movementFamily": "backward locomotion",
    "bodyActions": [
      "backward propulsion",
      "visual tracking",
      "forefoot braking"
    ],
    "jointActions": [
      "hip extension/flexion",
      "knee flexion/extension",
      "ankle plantarflexion/dorsiflexion"
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps femoris",
      "soleus"
    ],
    "assistingMuscles": [
      "hamstring muscles",
      "gastrocnemius",
      "iliopsoas"
    ],
    "stabilizers": [
      "gluteus medius",
      "tibialis anterior",
      "trunk musculature"
    ],
    "contractionRoles": [
      "concentric backward propulsion",
      "eccentric braking",
      "isometric posture"
    ],
    "commonForceOrSkillDemand": "unfamiliar backward force direction and visual constraint",
    "recommendedExercisePatterns": [
      "reverse lunge",
      "reverse sled drag",
      "split squat",
      "calf raise"
    ],
    "recommendedExercises": [
      "reverse lunge",
      "reverse sled drag",
      "split squat",
      "calf raise"
    ],
    "transferRationale": "Reverse locomotion patterns provide directional exposure and leg strength; they do not replace perceptual backpedaling practice.",
    "exerciseSelectionCautions": "Begin slowly with clear space; avoid relying on unstable or overloaded backward movement.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pubmed.ncbi.nlm.nih.gov/9596356/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3786235/",
      "https://inside.fifa.com/health-and-medical/injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed soccer biomechanics and kicking reviews plus FIFA injury-prevention guidance; evidence is strongest for movement mechanics and general physical preparation, while direct gym-to-sport performance transfer remains limited or indirect for several technical and contact skills."
  },
  {
    "id": "soccer-17",
    "sportId": "soccer",
    "label": "hip turn",
    "movementFamily": "rapid reorientation",
    "bodyActions": [
      "pelvis/femur rotation",
      "weight transfer",
      "crossover or pivot step"
    ],
    "jointActions": [
      "hip internal/external rotation",
      "hip abduction/adduction",
      "knee flexion"
    ],
    "primeMovers": [
      "gluteus medius",
      "gluteus maximus",
      "adductor magnus"
    ],
    "assistingMuscles": [
      "deep hip rotator muscles",
      "hamstring muscles",
      "quadriceps femoris"
    ],
    "stabilizers": [
      "soleus",
      "trunk musculature",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "eccentric braking",
      "concentric rotational redirection",
      "isometric stance"
    ],
    "commonForceOrSkillDemand": "rotational change of direction with single-leg control",
    "recommendedExercisePatterns": [
      "rotational split squat",
      "cable rotation",
      "lateral lunge",
      "single-leg RDL"
    ],
    "recommendedExercises": [
      "rotational split squat",
      "cable rotation",
      "lateral lunge",
      "single-leg RDL"
    ],
    "transferRationale": "Rotational split squats and unilateral hinge work develop general hip/trunk control relevant to turning, while timing and footwork remain sport-specific.",
    "exerciseSelectionCautions": "Keep rotation distributed through hip and trunk; stop if knee or groin symptoms appear.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pubmed.ncbi.nlm.nih.gov/9596356/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3786235/",
      "https://inside.fifa.com/health-and-medical/injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed soccer biomechanics and kicking reviews plus FIFA injury-prevention guidance; evidence is strongest for movement mechanics and general physical preparation, while direct gym-to-sport performance transfer remains limited or indirect for several technical and contact skills."
  },
  {
    "id": "soccer-18",
    "sportId": "soccer",
    "label": "single-leg landing",
    "movementFamily": "unilateral force absorption",
    "bodyActions": [
      "ankle-foot contact",
      "hip/knee flexion",
      "pelvic and trunk stabilization"
    ],
    "jointActions": [
      "ankle dorsiflexion",
      "knee flexion",
      "hip flexion/abduction control"
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus maximus",
      "soleus"
    ],
    "assistingMuscles": [
      "hamstring muscles",
      "gastrocnemius",
      "adductor magnus"
    ],
    "stabilizers": [
      "gluteus medius",
      "intrinsic foot muscles",
      "transversus abdominis"
    ],
    "contractionRoles": [
      "eccentric absorption",
      "isometric stabilization",
      "concentric rebound"
    ],
    "commonForceOrSkillDemand": "vertical/horizontal impulse absorption and alignment",
    "recommendedExercisePatterns": [
      "step-down",
      "single-leg squat",
      "single-leg RDL",
      "calf raise"
    ],
    "recommendedExercises": [
      "step-down",
      "single-leg squat",
      "single-leg RDL",
      "calf raise"
    ],
    "transferRationale": "Unilateral eccentric strength and landing control are directly aligned with the movement’s mechanical demand; performance and injury outcomes still depend on whole programs.",
    "exerciseSelectionCautions": "Use progressive height and speed; prioritize quiet landing, knee tracking, and adequate recovery.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pubmed.ncbi.nlm.nih.gov/9596356/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3786235/",
      "https://inside.fifa.com/health-and-medical/injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed soccer biomechanics and kicking reviews plus FIFA injury-prevention guidance; evidence is strongest for movement mechanics and general physical preparation, while direct gym-to-sport performance transfer remains limited or indirect for several technical and contact skills."
  },
  {
    "id": "soccer-19",
    "sportId": "soccer",
    "label": "goalkeeper dive",
    "movementFamily": "lateral projection and landing",
    "bodyActions": [
      "lateral push-off",
      "airborne reach",
      "landing and roll absorption"
    ],
    "jointActions": [
      "hip/knee extension",
      "trunk lateral flexion/rotation",
      "shoulder flexion/abduction"
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps femoris",
      "gluteus medius"
    ],
    "assistingMuscles": [
      "adductor magnus",
      "hamstring muscles",
      "latissimus dorsi"
    ],
    "stabilizers": [
      "serratus anterior",
      "rotator cuff muscles",
      "obliquus externus abdominis"
    ],
    "contractionRoles": [
      "concentric push-off",
      "eccentric landing/roll",
      "isometric aerial bracing"
    ],
    "commonForceOrSkillDemand": "explosive lateral projection with safe multi-surface landing",
    "recommendedExercisePatterns": [
      "lateral bound",
      "medicine-ball rotational throw",
      "Turkish get-up",
      "Pallof press"
    ],
    "recommendedExercises": [
      "lateral bound",
      "medicine-ball rotational throw",
      "Turkish get-up",
      "Pallof press"
    ],
    "transferRationale": "Lateral power, trunk control, and get-up patterns prepare general qualities of a dive; goalkeeper technique and surface-specific landing are decisive.",
    "exerciseSelectionCautions": "Progress landing surface and height conservatively; protect shoulder, wrist, hip, and neck.",
    "evidenceConfidence": "limited",
    "sources": [
      "https://pubmed.ncbi.nlm.nih.gov/9596356/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3786235/",
      "https://inside.fifa.com/health-and-medical/injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed soccer biomechanics and kicking reviews plus FIFA injury-prevention guidance; evidence is strongest for movement mechanics and general physical preparation, while direct gym-to-sport performance transfer remains limited or indirect for several technical and contact skills."
  },
  {
    "id": "soccer-20",
    "sportId": "soccer",
    "label": "throw-in",
    "movementFamily": "legal overhead ball projection",
    "bodyActions": [
      "bilateral stance",
      "trunk extension then flexion",
      "overhead shoulder motion and release"
    ],
    "jointActions": [
      "shoulder flexion/extension",
      "elbow extension",
      "trunk flexion/rotation"
    ],
    "primeMovers": [
      "pectoralis major",
      "latissimus dorsi",
      "rectus abdominis"
    ],
    "assistingMuscles": [
      "triceps brachii",
      "deltoid muscle",
      "obliquus externus abdominis"
    ],
    "stabilizers": [
      "rotator cuff muscles",
      "serratus anterior",
      "quadriceps femoris"
    ],
    "contractionRoles": [
      "eccentric wind-up",
      "concentric trunk/shoulder drive",
      "isometric foot/scapular bracing"
    ],
    "commonForceOrSkillDemand": "ballistic overhead projection from a fixed two-foot base",
    "recommendedExercisePatterns": [
      "medicine-ball overhead throw",
      "pullover",
      "Pallof press",
      "front plank"
    ],
    "recommendedExercises": [
      "medicine-ball overhead throw",
      "pullover",
      "Pallof press",
      "front plank"
    ],
    "transferRationale": "Medicine-ball projection and trunk anti-rotation overlap with force sequencing, but throw-in distance and legality require specific practice.",
    "exerciseSelectionCautions": "Use light-to-moderate implement loads and pain-free shoulder range; maintain two-foot contact and avoid lumbar hyperextension.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pubmed.ncbi.nlm.nih.gov/9596356/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3786235/",
      "https://inside.fifa.com/health-and-medical/injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed soccer biomechanics and kicking reviews plus FIFA injury-prevention guidance; evidence is strongest for movement mechanics and general physical preparation, while direct gym-to-sport performance transfer remains limited or indirect for several technical and contact skills."
  },
  {
    "id": "baseball-1",
    "sportId": "baseball",
    "label": "batting rotation",
    "movementFamily": "rotational power and kinetic-chain transfer",
    "bodyActions": [
      "The hitter loads the lower body, separates pelvis and thorax, then rotates the trunk and accelerates the bat before braked follow-through."
    ],
    "jointActions": [
      "Hip internal/external rotation",
      "pelvic and thoracic rotation",
      "shoulder horizontal adduction and internal rotation",
      "elbow extension",
      "wrist flexion/ulnar deviation at release."
    ],
    "primeMovers": [
      "gluteus maximus",
      "internal oblique",
      "external oblique",
      "pectoralis major",
      "latissimus dorsi"
    ],
    "assistingMuscles": [
      "adductor magnus",
      "serratus anterior",
      "anterior deltoid",
      "triceps brachii",
      "flexor carpi ulnaris"
    ],
    "stabilizers": [
      "gluteus medius",
      "transversus abdominis",
      "multifidus",
      "rotator cuff muscles",
      "erector spinae"
    ],
    "contractionRoles": [
      "Eccentric load in the stride and separation phase",
      "rapid concentric segmental rotation",
      "isometric proximal bracing",
      "eccentric terminal braking."
    ],
    "commonForceOrSkillDemand": "High-rate transverse-plane force and timing under a short contact window.",
    "recommendedExercisePatterns": [
      "rotational medicine-ball throw",
      "cable chop",
      "landmine rotation",
      "split-stance cable press"
    ],
    "recommendedExercises": [
      "medicine-ball rotational throw",
      "cable chop",
      "landmine rotation",
      "split-stance cable press"
    ],
    "transferRationale": "These patterns share lower-body-to-trunk-to-arm sequencing and transverse-plane force transfer, but they train physical qualities rather than batting skill or bat speed causally.",
    "exerciseSelectionCautions": "Use submaximal volume when fatigued; avoid treating loaded rotation as a substitute for hitting practice; respect back and shoulder symptoms.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9950989/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3778685/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4675191/"
    ],
    "sourceSummary": "The enrichment is grounded primarily in peer-reviewed baseball pitching and hitting biomechanics reviews and a clinical biomechanics guide, with exercise-transfer rationales kept heuristic and no unsupported direct EMG or causal performance claims."
  },
  {
    "id": "baseball-2",
    "sportId": "baseball",
    "label": "pitching acceleration",
    "movementFamily": "overhand throwing and kinetic-chain propulsion",
    "bodyActions": [
      "The stride and lead-leg block allow pelvis and trunk rotation to precede rapid shoulder internal rotation and elbow extension toward release."
    ],
    "jointActions": [
      "Hip extension and rotation",
      "trunk rotation",
      "shoulder external-to-internal rotation",
      "elbow extension",
      "wrist flexion/pronation near release."
    ],
    "primeMovers": [
      "gluteus maximus",
      "adductor magnus",
      "internal oblique",
      "external oblique",
      "subscapularis",
      "pectoralis major"
    ],
    "assistingMuscles": [
      "latissimus dorsi",
      "anterior deltoid",
      "triceps brachii",
      "serratus anterior",
      "pronator teres"
    ],
    "stabilizers": [
      "gluteus medius",
      "hamstring muscles",
      "rotator cuff muscles",
      "lower trapezius",
      "multifidus"
    ],
    "contractionRoles": [
      "Concentric leg and trunk propulsion followed by concentric shoulder and elbow acceleration",
      "proximal isometric bracing."
    ],
    "commonForceOrSkillDemand": "Sequential high-velocity force transfer with a stable lead-leg base.",
    "recommendedExercisePatterns": [
      "medicine-ball scoop throw",
      "split-stance cable press",
      "landmine press",
      "rear-foot-elevated split squat"
    ],
    "recommendedExercises": [
      "medicine-ball rotational throw",
      "split-stance cable press",
      "landmine press",
      "rear-foot-elevated split squat"
    ],
    "transferRationale": "Lower-body ballistic and split-stance patterns overlap with force initiation and sequencing, while medicine-ball and landmine work can limit distal joint load relative to maximal throwing.",
    "exerciseSelectionCautions": "Do not chase throwing velocity with heavy arm work; preserve throwing-program workload, shoulder range, and technical supervision.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9950989/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3778685/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4675191/"
    ],
    "sourceSummary": "The enrichment is grounded primarily in peer-reviewed baseball pitching and hitting biomechanics reviews and a clinical biomechanics guide, with exercise-transfer rationales kept heuristic and no unsupported direct EMG or causal performance claims."
  },
  {
    "id": "baseball-3",
    "sportId": "baseball",
    "label": "pitching deceleration",
    "movementFamily": "arm deceleration and braking",
    "bodyActions": [
      "After release, the arm and trunk rapidly dissipate angular momentum while the athlete maintains posture and recovers balance."
    ],
    "jointActions": [
      "Shoulder horizontal adduction and external rotation",
      "scapular retraction/upward rotation",
      "trunk flexion and rotation",
      "hip and knee flexion during follow-through."
    ],
    "primeMovers": [
      "posterior deltoid",
      "infraspinatus",
      "teres minor",
      "rhomboid major",
      "middle trapezius"
    ],
    "assistingMuscles": [
      "latissimus dorsi",
      "subscapularis",
      "serratus anterior",
      "external oblique",
      "gluteus maximus"
    ],
    "stabilizers": [
      "supraspinatus",
      "lower trapezius",
      "rotator cuff muscles",
      "erector spinae",
      "gluteus medius"
    ],
    "contractionRoles": [
      "Predominantly eccentric posterior-shoulder and scapular braking with eccentric trunk and lower-body control."
    ],
    "commonForceOrSkillDemand": "Very high eccentric shoulder demand and rapid proximal force absorption.",
    "recommendedExercisePatterns": [
      "cable row",
      "face pull",
      "external-rotation cable work",
      "single-leg Romanian deadlift"
    ],
    "recommendedExercises": [
      "cable row",
      "face pull",
      "external-rotation cable work",
      "single-leg Romanian deadlift"
    ],
    "transferRationale": "Rows, face pulls, controlled external rotation, and unilateral hinges expose relevant braking and postural-control actions without claiming identical throwing kinetics.",
    "exerciseSelectionCautions": "Prioritize quality and low-to-moderate load; avoid painful end-range external rotation or excessive eccentric volume after throwing.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9950989/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3778685/"
    ],
    "sourceSummary": "The enrichment is grounded primarily in peer-reviewed baseball pitching and hitting biomechanics reviews and a clinical biomechanics guide, with exercise-transfer rationales kept heuristic and no unsupported direct EMG or causal performance claims."
  },
  {
    "id": "baseball-4",
    "sportId": "baseball",
    "label": "overhand throwing",
    "movementFamily": "overhand throwing",
    "bodyActions": [
      "A step and pelvic-trunk rotation precede arm elevation, acceleration, release, and follow-through."
    ],
    "jointActions": [
      "Hip extension/rotation",
      "thoracic rotation",
      "shoulder abduction and internal rotation",
      "elbow extension",
      "forearm pronation."
    ],
    "primeMovers": [
      "gluteus maximus",
      "internal oblique",
      "external oblique",
      "pectoralis major",
      "subscapularis"
    ],
    "assistingMuscles": [
      "latissimus dorsi",
      "anterior deltoid",
      "triceps brachii",
      "serratus anterior",
      "pronator teres"
    ],
    "stabilizers": [
      "rotator cuff muscles",
      "lower trapezius",
      "middle trapezius",
      "gluteus medius",
      "transversus abdominis"
    ],
    "contractionRoles": [
      "Concentric lower-body and trunk propulsion, concentric arm acceleration, proximal isometric control, and eccentric follow-through."
    ],
    "commonForceOrSkillDemand": "Whole-body sequencing plus high-speed shoulder rotation and distal release.",
    "recommendedExercisePatterns": [
      "medicine-ball throw",
      "cable lift",
      "landmine press",
      "one-arm cable row"
    ],
    "recommendedExercises": [
      "medicine-ball rotational throw",
      "cable lift",
      "landmine press",
      "one-arm cable row"
    ],
    "transferRationale": "The selected patterns reinforce stepping, trunk-to-arm force transfer, and scapular control; they cannot reproduce ball release, timing, or arm-care demands exactly.",
    "exerciseSelectionCautions": "Keep ballistic drills light and crisp; do not substitute gym pressing for a structured throwing progression.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9950989/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3778685/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4675191/"
    ],
    "sourceSummary": "The enrichment is grounded primarily in peer-reviewed baseball pitching and hitting biomechanics reviews and a clinical biomechanics guide, with exercise-transfer rationales kept heuristic and no unsupported direct EMG or causal performance claims."
  },
  {
    "id": "baseball-5",
    "sportId": "baseball",
    "label": "fielding ground balls",
    "movementFamily": "squat, hinge, ground transition",
    "bodyActions": [
      "Lower, hinge and reach to the ball, then extend to rise and throw."
    ],
    "jointActions": [
      "Hip/knee flexion, ankle dorsiflexion, hip hinge, spinal stabilization, hip/knee extension."
    ],
    "primeMovers": [
      "quadriceps muscles",
      "gluteus maximus",
      "hamstring muscles"
    ],
    "assistingMuscles": [
      "adductor magnus",
      "erector spinae",
      "forearm flexor muscles"
    ],
    "stabilizers": [
      "gluteus medius",
      "soleus",
      "transversus abdominis",
      "rotator cuff muscles"
    ],
    "contractionRoles": [
      "Eccentric lowering, isometric low-position control, concentric extension."
    ],
    "commonForceOrSkillDemand": "Repeated low posture, balance, reach, and rapid rise-to-throw transition.",
    "recommendedExercisePatterns": [
      "goblet squat",
      "Romanian deadlift",
      "lateral lunge",
      "one-arm cable row"
    ],
    "recommendedExercises": [
      "goblet squat",
      "Romanian deadlift",
      "lateral lunge",
      "one-arm cable row"
    ],
    "transferRationale": "Squat, hinge, lateral reach, and rowing patterns overlap with fielding posture and recovery.",
    "exerciseSelectionCautions": "Do not load deep flexion if hip, knee, or back tolerance is limited; skill and glove work remain specific.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9950989/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3778685/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4675191/"
    ],
    "sourceSummary": "The enrichment is grounded primarily in peer-reviewed baseball pitching and hitting biomechanics reviews and a clinical biomechanics guide, with exercise-transfer rationales kept heuristic and no unsupported direct EMG or causal performance claims."
  },
  {
    "id": "baseball-6",
    "sportId": "baseball",
    "label": "lateral fielding shuffle",
    "movementFamily": "lateral locomotion and braking",
    "bodyActions": [
      "Repeated side pushes reposition the feet and trunk without sacrificing readiness."
    ],
    "jointActions": [
      "Hip abduction/adduction, knee flexion-extension, ankle inversion/eversion, trunk anti-lateral-flexion."
    ],
    "primeMovers": [
      "gluteus medius",
      "gluteus maximus",
      "adductor magnus"
    ],
    "assistingMuscles": [
      "quadriceps muscles",
      "hamstring muscles",
      "gastrocnemius"
    ],
    "stabilizers": [
      "soleus",
      "tibialis anterior",
      "peroneus longus",
      "internal oblique"
    ],
    "contractionRoles": [
      "Concentric outside-leg push-off, eccentric braking, isometric trunk control."
    ],
    "commonForceOrSkillDemand": "Short lateral acceleration and controlled deceleration.",
    "recommendedExercisePatterns": [
      "lateral lunge",
      "lateral bound",
      "split squat",
      "Pallof press"
    ],
    "recommendedExercises": [
      "lateral lunge",
      "lateral bound",
      "split squat",
      "Pallof press"
    ],
    "transferRationale": "Unilateral lateral force and anti-rotation patterns share the support-leg and trunk demands.",
    "exerciseSelectionCautions": "Progress landing volume gradually; avoid crossing-foot drills when surface or athlete control is poor.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9950989/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3778685/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4675191/"
    ],
    "sourceSummary": "The enrichment is grounded primarily in peer-reviewed baseball pitching and hitting biomechanics reviews and a clinical biomechanics guide, with exercise-transfer rationales kept heuristic and no unsupported direct EMG or causal performance claims."
  },
  {
    "id": "baseball-7",
    "sportId": "baseball",
    "label": "sprinting from the plate",
    "movementFamily": "linear acceleration",
    "bodyActions": [
      "A short standing start projects the center of mass forward with alternating knee drive."
    ],
    "jointActions": [
      "Hip extension, knee extension, ankle plantarflexion, contralateral hip flexion, arm swing."
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps muscles",
      "hamstring muscles",
      "soleus"
    ],
    "assistingMuscles": [
      "gastrocnemius",
      "iliopsoas",
      "adductor magnus",
      "brachioradialis"
    ],
    "stabilizers": [
      "gluteus medius",
      "transversus abdominis",
      "tibialis anterior",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Concentric stance-leg propulsion with eccentric swing-leg braking and isometric trunk stiffness."
    ],
    "commonForceOrSkillDemand": "High horizontal force in the first steps.",
    "recommendedExercisePatterns": [
      "sprint",
      "sled push",
      "split squat",
      "calf raise"
    ],
    "recommendedExercises": [
      "sprint",
      "sled push",
      "split squat",
      "calf raise"
    ],
    "transferRationale": "Short sprints and resisted pushes target acceleration mechanics and lower-body force.",
    "exerciseSelectionCautions": "Use adequate recovery and acceleration distance; hamstring risk rises with poorly progressed high-speed running.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9950989/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3778685/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4675191/"
    ],
    "sourceSummary": "The enrichment is grounded primarily in peer-reviewed baseball pitching and hitting biomechanics reviews and a clinical biomechanics guide, with exercise-transfer rationales kept heuristic and no unsupported direct EMG or causal performance claims."
  },
  {
    "id": "baseball-8",
    "sportId": "baseball",
    "label": "base stealing start",
    "movementFamily": "reactive acceleration",
    "bodyActions": [
      "From a lead-off stance, the athlete repositions laterally and projects into the first forward steps."
    ],
    "jointActions": [
      "Hip abduction/adduction, ankle-foot repositioning, hip/knee extension, trunk inclination."
    ],
    "primeMovers": [
      "gluteus maximus",
      "gluteus medius",
      "quadriceps muscles"
    ],
    "assistingMuscles": [
      "hamstring muscles",
      "adductor magnus",
      "soleus",
      "gastrocnemius"
    ],
    "stabilizers": [
      "transversus abdominis",
      "tibialis anterior",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Rapid concentric push-off, eccentric first-step acceptance, isometric trunk control."
    ],
    "commonForceOrSkillDemand": "Decision-limited first-step projection rather than maximal velocity.",
    "recommendedExercisePatterns": [
      "sprint",
      "lateral bound",
      "split squat",
      "reaction-step drill"
    ],
    "recommendedExercises": [
      "sprint",
      "lateral bound",
      "split squat",
      "reaction-step drill"
    ],
    "transferRationale": "Short accelerations and lateral bounds share projection and unilateral force demands.",
    "exerciseSelectionCautions": "Do not use fatigue or maximal resisted loads to train reaction timing; timing must be practiced on the basepaths.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9950989/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3778685/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4675191/"
    ],
    "sourceSummary": "The enrichment is grounded primarily in peer-reviewed baseball pitching and hitting biomechanics reviews and a clinical biomechanics guide, with exercise-transfer rationales kept heuristic and no unsupported direct EMG or causal performance claims."
  },
  {
    "id": "baseball-9",
    "sportId": "baseball",
    "label": "rounding bases",
    "movementFamily": "curved sprinting and change of direction",
    "bodyActions": [
      "High-speed running around a curve requires lean, foot-placement adjustment, and braking decisions."
    ],
    "jointActions": [
      "Hip extension/abduction, knee extension, ankle plantarflexion, trunk lateral flexion and rotation."
    ],
    "primeMovers": [
      "gluteus maximus",
      "gluteus medius",
      "quadriceps muscles",
      "hamstring muscles"
    ],
    "assistingMuscles": [
      "soleus",
      "gastrocnemius",
      "adductor magnus",
      "external oblique"
    ],
    "stabilizers": [
      "transversus abdominis",
      "tibialis anterior",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Concentric propulsion, eccentric braking into the curve, isometric lateral trunk control."
    ],
    "commonForceOrSkillDemand": "High-speed curved acceleration with asymmetric support forces.",
    "recommendedExercisePatterns": [
      "curved sprint",
      "lateral bound",
      "single-leg Romanian deadlift",
      "split squat"
    ],
    "recommendedExercises": [
      "curved sprint",
      "lateral bound",
      "single-leg Romanian deadlift",
      "split squat"
    ],
    "transferRationale": "Curved sprints and unilateral strength expose lean, support-leg, and braking qualities.",
    "exerciseSelectionCautions": "Progress curvature and speed separately; manage foot, groin, and hamstring load.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9950989/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3778685/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4675191/"
    ],
    "sourceSummary": "The enrichment is grounded primarily in peer-reviewed baseball pitching and hitting biomechanics reviews and a clinical biomechanics guide, with exercise-transfer rationales kept heuristic and no unsupported direct EMG or causal performance claims."
  },
  {
    "id": "baseball-10",
    "sportId": "baseball",
    "label": "sliding",
    "movementFamily": "ground transition and momentum management",
    "bodyActions": [
      "The athlete descends rapidly, positions the hips and trunk, and manages friction while reaching the base."
    ],
    "jointActions": [
      "Hip/knee flexion, ankle dorsiflexion, trunk flexion, shoulder extension or flexion depending on slide technique."
    ],
    "primeMovers": [
      "quadriceps muscles",
      "gluteus maximus",
      "hamstring muscles"
    ],
    "assistingMuscles": [
      "iliopsoas",
      "adductor magnus",
      "rectus abdominis",
      "triceps brachii"
    ],
    "stabilizers": [
      "transversus abdominis",
      "gluteus medius",
      "rotator cuff muscles",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Eccentric descent and braking with isometric limb and trunk positioning."
    ],
    "commonForceOrSkillDemand": "Rapid low-position deceleration and safe contact management.",
    "recommendedExercisePatterns": [
      "goblet squat",
      "split squat isometric",
      "bear crawl",
      "get-up"
    ],
    "recommendedExercises": [
      "goblet squat",
      "split squat isometric",
      "bear crawl",
      "get-up"
    ],
    "transferRationale": "Low-position strength and controlled transitions can support general movement capacity, not slide technique itself.",
    "exerciseSelectionCautions": "Practice slides only under qualified supervision on an appropriate surface; gym drills do not remove collision or hand/finger risk.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9950989/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3778685/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4675191/"
    ],
    "sourceSummary": "The enrichment is grounded primarily in peer-reviewed baseball pitching and hitting biomechanics reviews and a clinical biomechanics guide, with exercise-transfer rationales kept heuristic and no unsupported direct EMG or causal performance claims."
  },
  {
    "id": "baseball-11",
    "sportId": "baseball",
    "label": "diving catch",
    "movementFamily": "explosive projection and ground recovery",
    "bodyActions": [
      "The fielder projects forward or laterally, reaches in flight, absorbs contact, and recovers."
    ],
    "jointActions": [
      "Hip/knee/ankle extension for takeoff, shoulder flexion/abduction, trunk bracing, eccentric landing."
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps muscles",
      "hamstring muscles"
    ],
    "assistingMuscles": [
      "gastrocnemius",
      "deltoid muscles",
      "pectoralis major",
      "forearm flexor muscles"
    ],
    "stabilizers": [
      "rotator cuff muscles",
      "serratus anterior",
      "transversus abdominis",
      "gluteus medius"
    ],
    "contractionRoles": [
      "Concentric projection, isometric airborne organization, eccentric contact absorption."
    ],
    "commonForceOrSkillDemand": "Reactive directional power plus safe landing and recovery.",
    "recommendedExercisePatterns": [
      "lateral bound",
      "box jump",
      "push-up",
      "bear crawl"
    ],
    "recommendedExercises": [
      "lateral bound",
      "box jump",
      "push-up",
      "bear crawl"
    ],
    "transferRationale": "Bounds, jumps, and ground locomotion develop general projection and landing capacities.",
    "exerciseSelectionCautions": "Progress from low amplitude and controlled landings; never use maximal diving as a conditioning substitute.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9950989/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3778685/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4675191/"
    ],
    "sourceSummary": "The enrichment is grounded primarily in peer-reviewed baseball pitching and hitting biomechanics reviews and a clinical biomechanics guide, with exercise-transfer rationales kept heuristic and no unsupported direct EMG or causal performance claims."
  },
  {
    "id": "baseball-12",
    "sportId": "baseball",
    "label": "vertical jump catch",
    "movementFamily": "vertical power and landing",
    "bodyActions": [
      "A countermovement produces triple extension, overhead reach, and a controlled landing."
    ],
    "jointActions": [
      "Hip/knee extension, ankle plantarflexion, shoulder flexion, elbow extension, hip/knee flexion on landing."
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps muscles",
      "soleus",
      "gastrocnemius"
    ],
    "assistingMuscles": [
      "hamstring muscles",
      "deltoid muscles",
      "triceps brachii",
      "serratus anterior"
    ],
    "stabilizers": [
      "gluteus medius",
      "rotator cuff muscles",
      "transversus abdominis",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Eccentric countermovement, concentric jump, isometric reach, eccentric landing."
    ],
    "commonForceOrSkillDemand": "Vertical impulse and multiplanar landing control.",
    "recommendedExercisePatterns": [
      "countermovement jump",
      "box jump",
      "split squat",
      "landmine press"
    ],
    "recommendedExercises": [
      "countermovement jump",
      "box jump",
      "split squat",
      "landmine press"
    ],
    "transferRationale": "Jump and split-stance patterns overlap with takeoff, force production, and landing control.",
    "exerciseSelectionCautions": "Use a box height that permits quiet landings; overhead loading is not required for jump development.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9950989/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3778685/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4675191/"
    ],
    "sourceSummary": "The enrichment is grounded primarily in peer-reviewed baseball pitching and hitting biomechanics reviews and a clinical biomechanics guide, with exercise-transfer rationales kept heuristic and no unsupported direct EMG or causal performance claims."
  },
  {
    "id": "baseball-13",
    "sportId": "baseball",
    "label": "crow hop",
    "movementFamily": "locomotor-to-throw transfer",
    "bodyActions": [
      "A gather and brief hop organize the feet and transfer ground force into a throw."
    ],
    "jointActions": [
      "Ankle plantarflexion, hip/knee extension, pelvic/trunk rotation, shoulder internal rotation and elbow extension."
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps muscles",
      "internal oblique",
      "external oblique"
    ],
    "assistingMuscles": [
      "hamstring muscles",
      "adductor magnus",
      "pectoralis major",
      "latissimus dorsi",
      "triceps brachii"
    ],
    "stabilizers": [
      "gluteus medius",
      "rotator cuff muscles",
      "serratus anterior",
      "transversus abdominis"
    ],
    "contractionRoles": [
      "Concentric push-off, airborne organization, eccentric landing/braking, then throwing propulsion."
    ],
    "commonForceOrSkillDemand": "Rhythmic repositioning and force transfer from lower body into the arm.",
    "recommendedExercisePatterns": [
      "medicine-ball rotational throw",
      "split-stance cable press",
      "step-up jump",
      "landmine rotation"
    ],
    "recommendedExercises": [
      "medicine-ball rotational throw",
      "split-stance cable press",
      "step-up jump",
      "landmine rotation"
    ],
    "transferRationale": "Hop-and-throw patterns address rhythm, unilateral force, and trunk rotation without claiming direct throwing gains.",
    "exerciseSelectionCautions": "Keep hops low and landings stable; avoid adding arm velocity when the lower-body rhythm is inconsistent.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9950989/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3778685/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4675191/"
    ],
    "sourceSummary": "The enrichment is grounded primarily in peer-reviewed baseball pitching and hitting biomechanics reviews and a clinical biomechanics guide, with exercise-transfer rationales kept heuristic and no unsupported direct EMG or causal performance claims."
  },
  {
    "id": "baseball-14",
    "sportId": "baseball",
    "label": "catcher squat",
    "movementFamily": "squat endurance and positional strength",
    "bodyActions": [
      "The catcher sustains a deep squat with ankle mobility, upright trunk, and repeated rises."
    ],
    "jointActions": [
      "Hip/knee flexion-extension, ankle dorsiflexion, trunk extension, hip abduction for knee tracking."
    ],
    "primeMovers": [
      "quadriceps muscles",
      "gluteus maximus",
      "adductor magnus"
    ],
    "assistingMuscles": [
      "soleus",
      "gastrocnemius",
      "erector spinae",
      "hamstring muscles"
    ],
    "stabilizers": [
      "gluteus medius",
      "transversus abdominis",
      "tibialis anterior",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Isometric holding, eccentric lowering, concentric rising."
    ],
    "commonForceOrSkillDemand": "Sustained deep-position force and repeated postural transitions.",
    "recommendedExercisePatterns": [
      "goblet squat",
      "front squat",
      "split squat isometric",
      "calf raise"
    ],
    "recommendedExercises": [
      "goblet squat",
      "front squat",
      "split squat isometric",
      "calf raise"
    ],
    "transferRationale": "Squats and isometrics build general lower-body capacity in a similar joint configuration.",
    "exerciseSelectionCautions": "Individualize depth and volume for hip, knee, ankle, and back tolerance; catching stance technique remains specific.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9950989/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3778685/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4675191/"
    ],
    "sourceSummary": "The enrichment is grounded primarily in peer-reviewed baseball pitching and hitting biomechanics reviews and a clinical biomechanics guide, with exercise-transfer rationales kept heuristic and no unsupported direct EMG or causal performance claims."
  },
  {
    "id": "baseball-15",
    "sportId": "baseball",
    "label": "catcher throw",
    "movementFamily": "squat-to-throw power",
    "bodyActions": [
      "The catcher rises, repositions, rotates, throws, and brakes the arm in a compressed time window."
    ],
    "jointActions": [
      "Hip/knee extension, pelvic/thoracic rotation, shoulder internal rotation, elbow extension, scapular control."
    ],
    "primeMovers": [
      "quadriceps muscles",
      "gluteus maximus",
      "internal oblique",
      "external oblique",
      "pectoralis major"
    ],
    "assistingMuscles": [
      "hamstring muscles",
      "adductor magnus",
      "latissimus dorsi",
      "triceps brachii",
      "serratus anterior"
    ],
    "stabilizers": [
      "rotator cuff muscles",
      "gluteus medius",
      "lower trapezius",
      "transversus abdominis"
    ],
    "contractionRoles": [
      "Concentric rise and rotation, rapid arm acceleration, eccentric braking, proximal isometric control."
    ],
    "commonForceOrSkillDemand": "High-rate squat-to-throw sequencing from a low base.",
    "recommendedExercisePatterns": [
      "goblet squat",
      "medicine-ball rotational throw",
      "split-stance cable press",
      "face pull"
    ],
    "recommendedExercises": [
      "goblet squat",
      "medicine-ball rotational throw",
      "split-stance cable press",
      "face pull"
    ],
    "transferRationale": "Combining a squat pattern, rotational throw, and scapular control mirrors broad physical components of the action.",
    "exerciseSelectionCautions": "Do not pair high throwing volume with high ballistic gym volume; monitor shoulder and knee symptoms.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9950989/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3778685/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4675191/"
    ],
    "sourceSummary": "The enrichment is grounded primarily in peer-reviewed baseball pitching and hitting biomechanics reviews and a clinical biomechanics guide, with exercise-transfer rationales kept heuristic and no unsupported direct EMG or causal performance claims."
  },
  {
    "id": "baseball-16",
    "sportId": "baseball",
    "label": "first-base stretch",
    "movementFamily": "unilateral reach and balance",
    "bodyActions": [
      "A support leg remains rooted while the athlete hinges and reaches to receive the ball."
    ],
    "jointActions": [
      "Hip hinge, hip abduction/adduction, knee extension, ankle stabilization, shoulder flexion."
    ],
    "primeMovers": [
      "gluteus maximus",
      "hamstring muscles",
      "quadriceps muscles"
    ],
    "assistingMuscles": [
      "adductor magnus",
      "gluteus medius",
      "deltoid muscles",
      "forearm flexor muscles"
    ],
    "stabilizers": [
      "soleus",
      "tibialis anterior",
      "transversus abdominis",
      "multifidus"
    ],
    "contractionRoles": [
      "Isometric support-leg balance, eccentric reach control, concentric recovery."
    ],
    "commonForceOrSkillDemand": "Unilateral reach with long-lever balance and rapid recovery.",
    "recommendedExercisePatterns": [
      "single-leg Romanian deadlift",
      "split squat",
      "single-leg balance",
      "cable row"
    ],
    "recommendedExercises": [
      "single-leg Romanian deadlift",
      "split squat",
      "single-leg balance",
      "cable row"
    ],
    "transferRationale": "Unilateral hinge, balance, and row patterns overlap with support-leg and reach control.",
    "exerciseSelectionCautions": "Use a stable range before adding reach distance; do not force end-range hamstring or groin stretch.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9950989/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3778685/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4675191/"
    ],
    "sourceSummary": "The enrichment is grounded primarily in peer-reviewed baseball pitching and hitting biomechanics reviews and a clinical biomechanics guide, with exercise-transfer rationales kept heuristic and no unsupported direct EMG or causal performance claims."
  },
  {
    "id": "baseball-17",
    "sportId": "baseball",
    "label": "rotational transfer",
    "movementFamily": "kinetic-chain force transfer",
    "bodyActions": [
      "Force is transmitted from the ground through pelvis and trunk to the bat or upper limb while the center remains controlled."
    ],
    "jointActions": [
      "Hip rotation, thoracic rotation, shoulder rotation, elbow extension, trunk anti-extension and anti-lateral-flexion."
    ],
    "primeMovers": [
      "gluteus maximus",
      "internal oblique",
      "external oblique",
      "adductor magnus",
      "latissimus dorsi"
    ],
    "assistingMuscles": [
      "pectoralis major",
      "serratus anterior",
      "anterior deltoid",
      "triceps brachii"
    ],
    "stabilizers": [
      "gluteus medius",
      "transversus abdominis",
      "multifidus",
      "rotator cuff muscles",
      "lower trapezius"
    ],
    "contractionRoles": [
      "Segmental concentric power with proximal isometric bracing and terminal eccentric braking."
    ],
    "commonForceOrSkillDemand": "Coordinated multiplanar force transfer rather than isolated muscle force.",
    "recommendedExercisePatterns": [
      "landmine rotation",
      "cable lift",
      "Pallof press",
      "medicine-ball rotational throw"
    ],
    "recommendedExercises": [
      "landmine rotation",
      "cable lift",
      "Pallof press",
      "medicine-ball rotational throw"
    ],
    "transferRationale": "Rotational and anti-rotation patterns provide complementary dynamic and isometric trunk demands.",
    "exerciseSelectionCautions": "Avoid excessive lumbar rotation; let hips and thorax share motion and keep loads technically manageable.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9950989/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3778685/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4675191/"
    ],
    "sourceSummary": "The enrichment is grounded primarily in peer-reviewed baseball pitching and hitting biomechanics reviews and a clinical biomechanics guide, with exercise-transfer rationales kept heuristic and no unsupported direct EMG or causal performance claims."
  },
  {
    "id": "baseball-18",
    "sportId": "baseball",
    "label": "single-leg pitching balance",
    "movementFamily": "unilateral balance and control",
    "bodyActions": [
      "During wind-up and leg lift, the support leg controls the pelvis and trunk while the free leg moves."
    ],
    "jointActions": [
      "Support-leg hip/knee flexion-extension, ankle inversion/eversion, pelvic control, trunk anti-rotation."
    ],
    "primeMovers": [
      "gluteus medius",
      "gluteus maximus",
      "quadriceps muscles"
    ],
    "assistingMuscles": [
      "hamstring muscles",
      "soleus",
      "gastrocnemius",
      "adductor magnus",
      "iliopsoas"
    ],
    "stabilizers": [
      "tibialis anterior",
      "peroneus longus",
      "intrinsic foot muscles",
      "transversus abdominis",
      "multifidus"
    ],
    "contractionRoles": [
      "Mostly isometric stabilization with small eccentric and concentric corrections."
    ],
    "commonForceOrSkillDemand": "Single-leg postural control under moving-segment and rotational demands.",
    "recommendedExercisePatterns": [
      "single-leg balance",
      "single-leg Romanian deadlift",
      "split squat isometric",
      "Pallof press"
    ],
    "recommendedExercises": [
      "single-leg balance",
      "single-leg Romanian deadlift",
      "split squat isometric",
      "Pallof press"
    ],
    "transferRationale": "Unilateral balance, hinge, and anti-rotation drills share support-leg control but not pitching timing.",
    "exerciseSelectionCautions": "Do not equate eyes-closed instability with pitching benefit; progress from stable, repeatable positions.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9950989/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3778685/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4675191/"
    ],
    "sourceSummary": "The enrichment is grounded primarily in peer-reviewed baseball pitching and hitting biomechanics reviews and a clinical biomechanics guide, with exercise-transfer rationales kept heuristic and no unsupported direct EMG or causal performance claims."
  },
  {
    "id": "baseball-19",
    "sportId": "baseball",
    "label": "scapular retraction",
    "movementFamily": "scapular control",
    "bodyActions": [
      "The scapula retracts and upwardly coordinates with thoracic posture while the humerus remains controlled."
    ],
    "jointActions": [
      "Scapular retraction, posterior tilt and upward rotation",
      "shoulder external rotation",
      "thoracic extension."
    ],
    "primeMovers": [
      "middle trapezius",
      "rhomboid major",
      "rhomboid minor"
    ],
    "assistingMuscles": [
      "posterior deltoid",
      "lower trapezius",
      "infraspinatus",
      "teres minor"
    ],
    "stabilizers": [
      "serratus anterior",
      "supraspinatus",
      "subscapularis",
      "transversus abdominis"
    ],
    "contractionRoles": [
      "Concentric retraction, eccentric return, and isometric scapular positioning."
    ],
    "commonForceOrSkillDemand": "Low-load shoulder-girdle control supporting repeated overhead actions.",
    "recommendedExercisePatterns": [
      "face pull",
      "cable row",
      "prone Y raise",
      "external-rotation cable work"
    ],
    "recommendedExercises": [
      "face pull",
      "cable row",
      "prone Y raise",
      "external-rotation cable work"
    ],
    "transferRationale": "Rows, Y raises, face pulls, and external rotation train scapular and cuff actions relevant to throwing preparation and recovery.",
    "exerciseSelectionCautions": "Avoid aggressive scapular pinning or painful ranges; retraction is not the sole goal of healthy overhead mechanics.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9950989/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3778685/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4675191/"
    ],
    "sourceSummary": "The enrichment is grounded primarily in peer-reviewed baseball pitching and hitting biomechanics reviews and a clinical biomechanics guide, with exercise-transfer rationales kept heuristic and no unsupported direct EMG or causal performance claims."
  },
  {
    "id": "baseball-20",
    "sportId": "baseball",
    "label": "trunk anti-rotation",
    "movementFamily": "trunk stabilization",
    "bodyActions": [
      "The trunk resists unwanted rotation while the hips, legs, or arms move and transfer force."
    ],
    "jointActions": [
      "Isometric trunk rotation and extension resistance",
      "hip rotation and shoulder motion occur around a braced center."
    ],
    "primeMovers": [
      "internal oblique",
      "external oblique",
      "transversus abdominis",
      "multifidus"
    ],
    "assistingMuscles": [
      "rectus abdominis",
      "quadratus lumborum",
      "latissimus dorsi",
      "gluteus medius"
    ],
    "stabilizers": [
      "diaphragm",
      "pelvic floor muscles",
      "erector spinae",
      "serratus anterior"
    ],
    "contractionRoles": [
      "Predominantly isometric resistance with eccentric control as external torque changes."
    ],
    "commonForceOrSkillDemand": "Proximal stiffness and force transfer during unilateral and rotational baseball actions.",
    "recommendedExercisePatterns": [
      "Pallof press",
      "side plank",
      "suitcase carry",
      "dead bug"
    ],
    "recommendedExercises": [
      "Pallof press",
      "side plank",
      "suitcase carry",
      "dead bug"
    ],
    "transferRationale": "Anti-rotation drills share trunk-bracing demands that can support, but cannot replace, hitting and throwing coordination.",
    "exerciseSelectionCautions": "Brace without breath-holding; avoid treating high trunk stiffness as universally beneficial or as injury prevention.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9950989/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3778685/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4675191/"
    ],
    "sourceSummary": "The enrichment is grounded primarily in peer-reviewed baseball pitching and hitting biomechanics reviews and a clinical biomechanics guide, with exercise-transfer rationales kept heuristic and no unsupported direct EMG or causal performance claims."
  },
  {
    "id": "track-and-field-1",
    "sportId": "track-and-field",
    "label": "block start",
    "movementFamily": "sprint acceleration",
    "bodyActions": [
      "Crouched projection into the first steps",
      "horizontal body angle is progressively raised."
    ],
    "jointActions": [
      "Hip, knee, and ankle extension against the blocks",
      "shoulder flexion and elbow extension support arm action."
    ],
    "primeMovers": [
      "Gluteus maximus",
      "quadriceps femoris",
      "triceps surae"
    ],
    "assistingMuscles": [
      "Hamstrings",
      "adductor magnus",
      "iliopsoas",
      "pectoralis major",
      "triceps brachii"
    ],
    "stabilizers": [
      "Erector spinae",
      "abdominal wall",
      "gluteus medius",
      "intrinsic foot muscles",
      "scapular stabilizers"
    ],
    "contractionRoles": [
      "Pre-tension isometric in the set",
      "concentric block push",
      "eccentric swing recovery",
      "stiff ankle support."
    ],
    "commonForceOrSkillDemand": "High horizontal impulse, rapid force development, and posture-preserving bilateral-to-unilateral transition.",
    "recommendedExercisePatterns": [
      "horizontal resisted push",
      "bilateral squat",
      "hip hinge",
      "ankle plantar-flexion",
      "anti-extension trunk"
    ],
    "recommendedExercises": [
      "sled push",
      "back squat",
      "Romanian deadlift",
      "standing calf raise",
      "ab wheel rollout"
    ],
    "transferRationale": "Sled pushing and lower-body strength reproduce the broad projection and extension vectors, while trunk and ankle work support force transfer; they do not reproduce block geometry or sprint timing.",
    "exerciseSelectionCautions": "Exercise choices are proxies for shared force, posture, and contraction demands rather than event-skill substitutes; progress load and velocity conservatively, preserve technical quality, and individualize for injury history, event phase, and training age.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6684547/",
      "https://worldathletics.org/about-iaaf/documents/research-centre"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed sprint and jump biomechanics, World Athletics technical/research materials, and throwing/event biomechanics sources; confidence is highest for sprint and jump force phases, while apparatus-specific transfer for pole vault and rotational throws remains an evidence-aware mechanical proxy rather than a causal performance claim."
  },
  {
    "id": "track-and-field-2",
    "sportId": "track-and-field",
    "label": "acceleration",
    "movementFamily": "sprint acceleration",
    "bodyActions": [
      "Progressive forward projection with forceful knee recovery and dorsiflexed foot contacts."
    ],
    "jointActions": [
      "Hip extension",
      "knee extension and flexion cycling",
      "ankle dorsiflexion at recovery and plantar-flexion at push-off."
    ],
    "primeMovers": [
      "Gluteus maximus",
      "hamstrings",
      "quadriceps femoris",
      "soleus",
      "gastrocnemius"
    ],
    "assistingMuscles": [
      "Iliopsoas",
      "rectus femoris",
      "adductor magnus",
      "tibialis anterior"
    ],
    "stabilizers": [
      "Gluteus medius",
      "abdominal wall",
      "erector spinae",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Concentric propulsive stance",
      "eccentric late-swing control",
      "near-isometric trunk and ankle stiffness."
    ],
    "commonForceOrSkillDemand": "Horizontal impulse and repeated high-rate contacts while maintaining front-side mechanics.",
    "recommendedExercisePatterns": [
      "resisted sprint",
      "unilateral squat",
      "hip hinge",
      "calf strength",
      "anti-rotation"
    ],
    "recommendedExercises": [
      "sled push",
      "split squat",
      "Romanian deadlift",
      "seated calf raise",
      "Pallof press"
    ],
    "transferRationale": "Resisted acceleration and unilateral strength share projection, extension, and pelvic-control demands, but transfer is mechanical overlap rather than a demonstrated causal performance guarantee.",
    "exerciseSelectionCautions": "Exercise choices are proxies for shared force, posture, and contraction demands rather than event-skill substitutes; progress load and velocity conservatively, preserve technical quality, and individualize for injury history, event phase, and training age.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6684547/",
      "https://worldathletics.org/about-iaaf/documents/research-centre",
      "https://pubmed.ncbi.nlm.nih.gov/35226345/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed sprint and jump biomechanics, World Athletics technical/research materials, and throwing/event biomechanics sources; confidence is highest for sprint and jump force phases, while apparatus-specific transfer for pole vault and rotational throws remains an evidence-aware mechanical proxy rather than a causal performance claim."
  },
  {
    "id": "track-and-field-3",
    "sportId": "track-and-field",
    "label": "upright sprinting",
    "movementFamily": "sprinting gait",
    "bodyActions": [
      "Tall cyclical gait with front-side knee lift, pawback, and elastic rebound."
    ],
    "jointActions": [
      "Rapid hip flexion-extension",
      "knee flexion-extension",
      "ankle dorsiflexion/plantar-flexion",
      "coordinated arm swing."
    ],
    "primeMovers": [
      "Hamstrings",
      "gluteus maximus",
      "iliopsoas",
      "quadriceps femoris",
      "soleus"
    ],
    "assistingMuscles": [
      "Rectus femoris",
      "adductor magnus",
      "gastrocnemius",
      "tibialis anterior"
    ],
    "stabilizers": [
      "Gluteus medius",
      "abdominal wall",
      "erector spinae",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Eccentric late-swing braking",
      "concentric stance propulsion",
      "brief isometric ankle and trunk stiffness."
    ],
    "commonForceOrSkillDemand": "Very short ground contact, elastic stiffness, and high limb-cycle frequency.",
    "recommendedExercisePatterns": [
      "max-velocity sprint",
      "single-leg strength",
      "hamstring eccentric",
      "ankle stiffness",
      "trunk control"
    ],
    "recommendedExercises": [
      "flying sprint",
      "Nordic hamstring curl",
      "single-leg Romanian deadlift",
      "standing calf raise",
      "dead bug"
    ],
    "transferRationale": "Hamstring eccentric and calf work target relevant tissue actions and sprint drills preserve coordination; gym exercises should support, not replace, high-speed running exposure.",
    "exerciseSelectionCautions": "Exercise choices are proxies for shared force, posture, and contraction demands rather than event-skill substitutes; progress load and velocity conservatively, preserve technical quality, and individualize for injury history, event phase, and training age.",
    "evidenceConfidence": "high",
    "sources": [
      "https://worldathletics.org/about-iaaf/documents/research-centre",
      "https://pubmed.ncbi.nlm.nih.gov/35226345/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed sprint and jump biomechanics, World Athletics technical/research materials, and throwing/event biomechanics sources; confidence is highest for sprint and jump force phases, while apparatus-specific transfer for pole vault and rotational throws remains an evidence-aware mechanical proxy rather than a causal performance claim."
  },
  {
    "id": "track-and-field-4",
    "sportId": "track-and-field",
    "label": "maximal-velocity sprinting",
    "movementFamily": "sprinting gait",
    "bodyActions": [
      "Upright high-speed flight with powerful backward leg action and rapid contacts."
    ],
    "jointActions": [
      "Hip extension and flexion",
      "knee extension in stance and flexion in recovery",
      "ankle stiffness and plantar-flexion."
    ],
    "primeMovers": [
      "Hamstrings",
      "gluteus maximus",
      "soleus",
      "gastrocnemius"
    ],
    "assistingMuscles": [
      "Quadriceps femoris",
      "iliopsoas",
      "adductor magnus",
      "rectus femoris"
    ],
    "stabilizers": [
      "Gluteus medius",
      "abdominal wall",
      "erector spinae",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Strong eccentric late-swing braking followed by concentric propulsion and spring-like ankle action."
    ],
    "commonForceOrSkillDemand": "High eccentric hamstring demand, vertical support, and elastic energy return.",
    "recommendedExercisePatterns": [
      "high-speed sprint",
      "hip extension",
      "hamstring eccentric",
      "calf isometric",
      "single-leg balance"
    ],
    "recommendedExercises": [
      "flying sprint",
      "barbell hip thrust",
      "Nordic hamstring curl",
      "isometric calf raise",
      "single-leg Romanian deadlift"
    ],
    "transferRationale": "The recommended patterns address hip-extension capacity, hamstring braking, and ankle stiffness, while only sprinting supplies event-specific maximal-velocity coordination.",
    "exerciseSelectionCautions": "Exercise choices are proxies for shared force, posture, and contraction demands rather than event-skill substitutes; progress load and velocity conservatively, preserve technical quality, and individualize for injury history, event phase, and training age.",
    "evidenceConfidence": "high",
    "sources": [
      "https://worldathletics.org/about-iaaf/documents/research-centre",
      "https://pubmed.ncbi.nlm.nih.gov/35226345/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed sprint and jump biomechanics, World Athletics technical/research materials, and throwing/event biomechanics sources; confidence is highest for sprint and jump force phases, while apparatus-specific transfer for pole vault and rotational throws remains an evidence-aware mechanical proxy rather than a causal performance claim."
  },
  {
    "id": "track-and-field-5",
    "sportId": "track-and-field",
    "label": "sprint deceleration",
    "movementFamily": "braking and force absorption",
    "bodyActions": [
      "Shortens steps and lowers the center of mass to dissipate momentum before reacceleration."
    ],
    "jointActions": [
      "Eccentric hip and knee flexion control",
      "ankle dorsiflexion control",
      "trunk inclination and pelvic control."
    ],
    "primeMovers": [
      "Quadriceps femoris",
      "gluteus maximus",
      "soleus"
    ],
    "assistingMuscles": [
      "Hamstrings",
      "adductor magnus",
      "gastrocnemius"
    ],
    "stabilizers": [
      "Gluteus medius",
      "abdominal wall",
      "erector spinae",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Predominantly eccentric braking, isometric trunk control, then concentric reacceleration."
    ],
    "commonForceOrSkillDemand": "Large braking impulse, frontal-plane control, and safe redistribution of ground reaction force.",
    "recommendedExercisePatterns": [
      "deceleration drill",
      "eccentric squat",
      "unilateral landing",
      "calf capacity",
      "anti-rotation"
    ],
    "recommendedExercises": [
      "drop landing",
      "front squat",
      "rear-foot-elevated split squat",
      "seated calf raise",
      "Pallof press"
    ],
    "transferRationale": "Eccentric squatting, unilateral landing, and trunk control overlap with braking demands; no weight-room exercise guarantees improved cutting or deceleration skill.",
    "exerciseSelectionCautions": "Exercise choices are proxies for shared force, posture, and contraction demands rather than event-skill substitutes; progress load and velocity conservatively, preserve technical quality, and individualize for injury history, event phase, and training age.",
    "evidenceConfidence": "high",
    "sources": [
      "https://worldathletics.org/about-iaaf/documents/research-centre",
      "https://pubmed.ncbi.nlm.nih.gov/29497391/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed sprint and jump biomechanics, World Athletics technical/research materials, and throwing/event biomechanics sources; confidence is highest for sprint and jump force phases, while apparatus-specific transfer for pole vault and rotational throws remains an evidence-aware mechanical proxy rather than a causal performance claim."
  },
  {
    "id": "track-and-field-6",
    "sportId": "track-and-field",
    "label": "hurdle takeoff",
    "movementFamily": "horizontal-to-vertical projection",
    "bodyActions": [
      "Penultimate-step lowering precedes rapid support-leg extension and lead-leg swing."
    ],
    "jointActions": [
      "Hip, knee, and ankle extension",
      "swing-leg hip flexion",
      "arm drive."
    ],
    "primeMovers": [
      "Gluteus maximus",
      "quadriceps femoris",
      "soleus",
      "gastrocnemius"
    ],
    "assistingMuscles": [
      "Hamstrings",
      "iliopsoas",
      "rectus femoris",
      "adductor magnus"
    ],
    "stabilizers": [
      "Gluteus medius",
      "abdominal wall",
      "erector spinae",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Eccentric penultimate preload",
      "concentric takeoff",
      "isometric trunk and ankle control."
    ],
    "commonForceOrSkillDemand": "Conversion of approach velocity into vertical clearance without excessive loss of horizontal speed.",
    "recommendedExercisePatterns": [
      "single-leg jump",
      "bound",
      "split squat",
      "calf plyometric",
      "trunk bracing"
    ],
    "recommendedExercises": [
      "single-leg box jump",
      "bounds",
      "rear-foot-elevated split squat",
      "pogos",
      "front plank"
    ],
    "transferRationale": "Unilateral jump and bound patterns reflect the plant-to-projection sequence, but hurdle rhythm, clearance height, and approach accuracy require event practice.",
    "exerciseSelectionCautions": "Exercise choices are proxies for shared force, posture, and contraction demands rather than event-skill substitutes; progress load and velocity conservatively, preserve technical quality, and individualize for injury history, event phase, and training age.",
    "evidenceConfidence": "high",
    "sources": [
      "https://worldathletics.org/about-iaaf/documents/research-centre",
      "https://pubmed.ncbi.nlm.nih.gov/30089292/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed sprint and jump biomechanics, World Athletics technical/research materials, and throwing/event biomechanics sources; confidence is highest for sprint and jump force phases, while apparatus-specific transfer for pole vault and rotational throws remains an evidence-aware mechanical proxy rather than a causal performance claim."
  },
  {
    "id": "track-and-field-7",
    "sportId": "track-and-field",
    "label": "hurdle clearance",
    "movementFamily": "hurdle mobility and flight",
    "bodyActions": [
      "Lead-leg flexion and extension combine with trail-leg abduction/external rotation and compact trunk repositioning."
    ],
    "jointActions": [
      "Lead hip flexion-extension and knee extension",
      "trail hip flexion, abduction, and external rotation",
      "ankle preparation for landing."
    ],
    "primeMovers": [
      "Iliopsoas",
      "rectus femoris",
      "sartorius",
      "gluteus medius"
    ],
    "assistingMuscles": [
      "Adductors",
      "hamstrings",
      "quadriceps femoris",
      "gluteus maximus"
    ],
    "stabilizers": [
      "Abdominal wall",
      "erector spinae",
      "pelvic stabilizers",
      "shoulder girdle"
    ],
    "contractionRoles": [
      "Concentric limb repositioning, isometric trunk control, and eccentric landing preparation."
    ],
    "commonForceOrSkillDemand": "Fast, asymmetric hip mobility and precise clearance with minimal vertical displacement.",
    "recommendedExercisePatterns": [
      "hip mobility",
      "low hurdle drill",
      "single-leg landing",
      "trunk control",
      "adductor strength"
    ],
    "recommendedExercises": [
      "hurdle mobility drill",
      "Cossack squat",
      "single-leg Romanian deadlift",
      "lateral step-down",
      "side plank"
    ],
    "transferRationale": "Mobility and unilateral control can support positions seen in clearance, but technical hurdle timing and morphology-specific range must be coached directly.",
    "exerciseSelectionCautions": "Exercise choices are proxies for shared force, posture, and contraction demands rather than event-skill substitutes; progress load and velocity conservatively, preserve technical quality, and individualize for injury history, event phase, and training age.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://worldathletics.org/about-iaaf/documents/research-centre",
      "https://pubmed.ncbi.nlm.nih.gov/30089292/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed sprint and jump biomechanics, World Athletics technical/research materials, and throwing/event biomechanics sources; confidence is highest for sprint and jump force phases, while apparatus-specific transfer for pole vault and rotational throws remains an evidence-aware mechanical proxy rather than a causal performance claim."
  },
  {
    "id": "track-and-field-8",
    "sportId": "track-and-field",
    "label": "long-jump takeoff",
    "movementFamily": "horizontal-to-vertical jump",
    "bodyActions": [
      "A single-leg plant converts approach speed into forward-upward projection with free-knee and arm swing."
    ],
    "jointActions": [
      "Stance hip/knee/ankle extension",
      "free hip and knee flexion",
      "ankle stiffness."
    ],
    "primeMovers": [
      "Gluteus maximus",
      "quadriceps femoris",
      "soleus",
      "gastrocnemius"
    ],
    "assistingMuscles": [
      "Hamstrings",
      "adductor magnus",
      "iliopsoas",
      "rectus femoris"
    ],
    "stabilizers": [
      "Gluteus medius",
      "abdominal wall",
      "erector spinae",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Eccentric plant absorption followed by rapid concentric extension and isometric stiffness."
    ],
    "commonForceOrSkillDemand": "High approach velocity, unilateral impulse, and tolerance of large plant forces.",
    "recommendedExercisePatterns": [
      "approach jump",
      "single-leg strength",
      "plyometric",
      "hip hinge",
      "landing control"
    ],
    "recommendedExercises": [
      "single-leg box jump",
      "split squat",
      "Romanian deadlift",
      "pogos",
      "drop landing"
    ],
    "transferRationale": "Unilateral strength and plyometrics share the plant and projection qualities, but takeoff-board accuracy and flight mechanics remain event-specific.",
    "exerciseSelectionCautions": "Exercise choices are proxies for shared force, posture, and contraction demands rather than event-skill substitutes; progress load and velocity conservatively, preserve technical quality, and individualize for injury history, event phase, and training age.",
    "evidenceConfidence": "high",
    "sources": [
      "https://worldathletics.org/about-iaaf/documents/research-centre",
      "https://pubmed.ncbi.nlm.nih.gov/30089292/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed sprint and jump biomechanics, World Athletics technical/research materials, and throwing/event biomechanics sources; confidence is highest for sprint and jump force phases, while apparatus-specific transfer for pole vault and rotational throws remains an evidence-aware mechanical proxy rather than a causal performance claim."
  },
  {
    "id": "track-and-field-9",
    "sportId": "track-and-field",
    "label": "triple-jump bound",
    "movementFamily": "repeated horizontal plyometrics",
    "bodyActions": [
      "Alternating hop, step, and jump actions maintain horizontal velocity through repeated single-leg landings."
    ],
    "jointActions": [
      "Repeated hip/knee flexion-extension",
      "ankle dorsiflexion/plantar-flexion",
      "pelvic rotation control."
    ],
    "primeMovers": [
      "Gluteus maximus",
      "quadriceps femoris",
      "soleus",
      "gastrocnemius"
    ],
    "assistingMuscles": [
      "Hamstrings",
      "adductor magnus",
      "rectus femoris"
    ],
    "stabilizers": [
      "Gluteus medius",
      "abdominal wall",
      "erector spinae",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "High eccentric landing load, concentric rebound, and isometric limb stiffness."
    ],
    "commonForceOrSkillDemand": "Repeated elastic impulse and fatigue-resistant unilateral force absorption.",
    "recommendedExercisePatterns": [
      "alternate bounds",
      "single-leg strength",
      "ankle stiffness",
      "eccentric landing",
      "trunk control"
    ],
    "recommendedExercises": [
      "bounds",
      "rear-foot-elevated split squat",
      "Nordic hamstring curl",
      "pogos",
      "single-leg Romanian deadlift"
    ],
    "transferRationale": "Bounds and unilateral strength directly resemble repeated support-to-rebound actions, but volume and intensity must be progressed carefully because event contacts are highly demanding.",
    "exerciseSelectionCautions": "Exercise choices are proxies for shared force, posture, and contraction demands rather than event-skill substitutes; progress load and velocity conservatively, preserve technical quality, and individualize for injury history, event phase, and training age.",
    "evidenceConfidence": "high",
    "sources": [
      "https://worldathletics.org/about-iaaf/documents/research-centre",
      "https://pubmed.ncbi.nlm.nih.gov/30089292/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed sprint and jump biomechanics, World Athletics technical/research materials, and throwing/event biomechanics sources; confidence is highest for sprint and jump force phases, while apparatus-specific transfer for pole vault and rotational throws remains an evidence-aware mechanical proxy rather than a causal performance claim."
  },
  {
    "id": "track-and-field-10",
    "sportId": "track-and-field",
    "label": "high-jump takeoff",
    "movementFamily": "vertical jump and rotation",
    "bodyActions": [
      "Curved approach and penultimate lowering lead to single-leg extension, free-knee drive, and backward rotation."
    ],
    "jointActions": [
      "Stance hip/knee/ankle extension",
      "free-leg hip flexion",
      "trunk and shoulder rotation."
    ],
    "primeMovers": [
      "Gluteus maximus",
      "quadriceps femoris",
      "soleus",
      "gastrocnemius"
    ],
    "assistingMuscles": [
      "Hamstrings",
      "iliopsoas",
      "rectus femoris",
      "adductor magnus"
    ],
    "stabilizers": [
      "Gluteus medius",
      "abdominal wall",
      "erector spinae",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Eccentric plant, concentric vertical impulse, and isometric posture before rotation."
    ],
    "commonForceOrSkillDemand": "Vertical impulse with curved-approach coordination and single-leg stiffness.",
    "recommendedExercisePatterns": [
      "single-leg jump",
      "countermovement jump",
      "split squat",
      "calf plyometric",
      "anti-rotation"
    ],
    "recommendedExercises": [
      "single-leg box jump",
      "countermovement jump",
      "split squat",
      "pogos",
      "Pallof press"
    ],
    "transferRationale": "Jump and unilateral patterns train broad projection and stiffness qualities, not the bar clearance, curve, or takeoff-angle technique.",
    "exerciseSelectionCautions": "Exercise choices are proxies for shared force, posture, and contraction demands rather than event-skill substitutes; progress load and velocity conservatively, preserve technical quality, and individualize for injury history, event phase, and training age.",
    "evidenceConfidence": "high",
    "sources": [
      "https://worldathletics.org/about-iaaf/documents/research-centre",
      "https://pubmed.ncbi.nlm.nih.gov/30089292/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed sprint and jump biomechanics, World Athletics technical/research materials, and throwing/event biomechanics sources; confidence is highest for sprint and jump force phases, while apparatus-specific transfer for pole vault and rotational throws remains an evidence-aware mechanical proxy rather than a causal performance claim."
  },
  {
    "id": "track-and-field-11",
    "sportId": "track-and-field",
    "label": "pole-vault plant",
    "movementFamily": "run-up-to-plant projection",
    "bodyActions": [
      "A fast run-up is preserved while the pole is lowered, hands are placed, and the takeoff leg braces."
    ],
    "jointActions": [
      "Hip/knee/ankle extension",
      "shoulder flexion and elbow extension",
      "wrist and grip stabilization."
    ],
    "primeMovers": [
      "Quadriceps femoris",
      "gluteus maximus",
      "soleus",
      "triceps brachii"
    ],
    "assistingMuscles": [
      "Hamstrings",
      "pectoralis major",
      "anterior deltoid",
      "latissimus dorsi"
    ],
    "stabilizers": [
      "Abdominal wall",
      "erector spinae",
      "serratus anterior",
      "rotator cuff",
      "forearm flexors"
    ],
    "contractionRoles": [
      "Eccentric takeoff absorption, concentric jump and arm action, mixed isometric bracing."
    ],
    "commonForceOrSkillDemand": "High-speed run-up accuracy, stiff takeoff, and overhead force acceptance.",
    "recommendedExercisePatterns": [
      "run-up sprint",
      "single-leg jump",
      "overhead press",
      "grip",
      "trunk bracing"
    ],
    "recommendedExercises": [
      "flying sprint",
      "single-leg box jump",
      "overhead press",
      "farmer carry",
      "front plank"
    ],
    "transferRationale": "These patterns support speed, single-leg projection, overhead bracing, and grip, but the pole's elastic return and inversion phases cannot be safely replicated in the gym.",
    "exerciseSelectionCautions": "Exercise choices are proxies for shared force, posture, and contraction demands rather than event-skill substitutes; progress load and velocity conservatively, preserve technical quality, and individualize for injury history, event phase, and training age.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://worldathletics.org/about-iaaf/documents/research-centre",
      "https://pubmed.ncbi.nlm.nih.gov/31977900/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed sprint and jump biomechanics, World Athletics technical/research materials, and throwing/event biomechanics sources; confidence is highest for sprint and jump force phases, while apparatus-specific transfer for pole vault and rotational throws remains an evidence-aware mechanical proxy rather than a causal performance claim."
  },
  {
    "id": "track-and-field-12",
    "sportId": "track-and-field",
    "label": "shot-put drive",
    "movementFamily": "explosive linear push",
    "bodyActions": [
      "From a flexed power position, the athlete drives through the legs and transfers force through the trunk to the implement."
    ],
    "jointActions": [
      "Hip/knee/ankle extension",
      "trunk rotation/extension",
      "shoulder horizontal adduction and elbow extension."
    ],
    "primeMovers": [
      "Gluteus maximus",
      "quadriceps femoris",
      "pectoralis major",
      "triceps brachii"
    ],
    "assistingMuscles": [
      "Adductor magnus",
      "obliques",
      "anterior deltoid",
      "latissimus dorsi"
    ],
    "stabilizers": [
      "Abdominal wall",
      "erector spinae",
      "gluteus medius",
      "serratus anterior",
      "wrist stabilizers"
    ],
    "contractionRoles": [
      "Eccentric loading, proximal-to-distal concentric sequencing, and isometric bracing."
    ],
    "commonForceOrSkillDemand": "High whole-body impulse and rapid force transfer from ground to implement.",
    "recommendedExercisePatterns": [
      "bilateral push",
      "split-stance press",
      "medicine-ball throw",
      "front squat",
      "anti-rotation"
    ],
    "recommendedExercises": [
      "medicine-ball chest pass",
      "push press",
      "front squat",
      "split squat",
      "Pallof press"
    ],
    "transferRationale": "Medicine-ball and push-press patterns share rapid leg-to-arm sequencing and release intent; they do not establish shot-specific technical or causal performance effects.",
    "exerciseSelectionCautions": "Exercise choices are proxies for shared force, posture, and contraction demands rather than event-skill substitutes; progress load and velocity conservatively, preserve technical quality, and individualize for injury history, event phase, and training age.",
    "evidenceConfidence": "high",
    "sources": [
      "https://worldathletics.org/about-iaaf/documents/research-centre",
      "https://pubmed.ncbi.nlm.nih.gov/31977900/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed sprint and jump biomechanics, World Athletics technical/research materials, and throwing/event biomechanics sources; confidence is highest for sprint and jump force phases, while apparatus-specific transfer for pole vault and rotational throws remains an evidence-aware mechanical proxy rather than a causal performance claim."
  },
  {
    "id": "track-and-field-13",
    "sportId": "track-and-field",
    "label": "shot-put release",
    "movementFamily": "ballistic pushing",
    "bodyActions": [
      "A braced front side permits rapid trunk action and elbow extension to release the shot."
    ],
    "jointActions": [
      "Hip and trunk extension/rotation",
      "shoulder horizontal adduction and flexion",
      "elbow extension",
      "wrist stabilization."
    ],
    "primeMovers": [
      "Pectoralis major",
      "triceps brachii",
      "anterior deltoid",
      "obliques"
    ],
    "assistingMuscles": [
      "Gluteus maximus",
      "adductor magnus",
      "latissimus dorsi",
      "serratus anterior"
    ],
    "stabilizers": [
      "Opposite hip",
      "abdominal wall",
      "erector spinae",
      "scapular stabilizers",
      "forearm muscles"
    ],
    "contractionRoles": [
      "Concentric propulsion after an isometric block, followed by eccentric deceleration."
    ],
    "commonForceOrSkillDemand": "Short-duration high-power push against a stable front-side block.",
    "recommendedExercisePatterns": [
      "medicine-ball chest pass",
      "push press",
      "rotational press",
      "trunk brace",
      "wrist stability"
    ],
    "recommendedExercises": [
      "medicine-ball chest pass",
      "push press",
      "half-kneeling cable press",
      "front plank",
      "farmer carry"
    ],
    "transferRationale": "Ballistic pressing and bracing overlap with release mechanics, while the shot's implement, circle, and legal technique require event-specific practice.",
    "exerciseSelectionCautions": "Exercise choices are proxies for shared force, posture, and contraction demands rather than event-skill substitutes; progress load and velocity conservatively, preserve technical quality, and individualize for injury history, event phase, and training age.",
    "evidenceConfidence": "high",
    "sources": [
      "https://worldathletics.org/about-iaaf/documents/research-centre",
      "https://pubmed.ncbi.nlm.nih.gov/31977900/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed sprint and jump biomechanics, World Athletics technical/research materials, and throwing/event biomechanics sources; confidence is highest for sprint and jump force phases, while apparatus-specific transfer for pole vault and rotational throws remains an evidence-aware mechanical proxy rather than a causal performance claim."
  },
  {
    "id": "track-and-field-14",
    "sportId": "track-and-field",
    "label": "discus rotation",
    "movementFamily": "rotational throwing",
    "bodyActions": [
      "Turns and pivots sequence force from rear support through hips and trunk into the arm and release."
    ],
    "jointActions": [
      "Ankle and knee pivoting",
      "hip internal/external rotation",
      "trunk rotation",
      "shoulder horizontal abduction/adduction",
      "wrist action."
    ],
    "primeMovers": [
      "Gluteus maximus",
      "quadriceps femoris",
      "obliques",
      "latissimus dorsi",
      "deltoid"
    ],
    "assistingMuscles": [
      "Adductor magnus",
      "pectoralis major",
      "serratus anterior",
      "triceps brachii",
      "gastrocnemius"
    ],
    "stabilizers": [
      "Gluteus medius",
      "abdominal wall",
      "erector spinae",
      "rotator cuff",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Eccentric entry/loading, concentric rotational acceleration, and isometric front-side bracing."
    ],
    "commonForceOrSkillDemand": "Sequential transverse-plane force and balance through multiple turns.",
    "recommendedExercisePatterns": [
      "rotational throw",
      "split-stance rotation",
      "single-leg balance",
      "hip drive",
      "anti-rotation"
    ],
    "recommendedExercises": [
      "medicine-ball rotational throw",
      "landmine rotation",
      "rear-foot-elevated split squat",
      "single-leg Romanian deadlift",
      "Pallof press"
    ],
    "transferRationale": "Rotational medicine-ball and landmine patterns share sequencing and bracing demands, but implement orbit, sector rules, and ring footwork are not reproduced by resistance exercises.",
    "exerciseSelectionCautions": "Exercise choices are proxies for shared force, posture, and contraction demands rather than event-skill substitutes; progress load and velocity conservatively, preserve technical quality, and individualize for injury history, event phase, and training age.",
    "evidenceConfidence": "high",
    "sources": [
      "https://worldathletics.org/about-iaaf/documents/research-centre",
      "https://pubmed.ncbi.nlm.nih.gov/31977900/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed sprint and jump biomechanics, World Athletics technical/research materials, and throwing/event biomechanics sources; confidence is highest for sprint and jump force phases, while apparatus-specific transfer for pole vault and rotational throws remains an evidence-aware mechanical proxy rather than a causal performance claim."
  },
  {
    "id": "track-and-field-15",
    "sportId": "track-and-field",
    "label": "hammer rotation",
    "movementFamily": "rotational orbit and pivoting",
    "bodyActions": [
      "Repeated turns maintain implement radius while alternating single- and double-support pivots."
    ],
    "jointActions": [
      "Ankle and knee pivoting",
      "hip rotation",
      "trunk anti-rotation/rotation",
      "shoulder and elbow isometric control",
      "grip."
    ],
    "primeMovers": [
      "Quadriceps femoris",
      "gluteus maximus",
      "obliques",
      "erector spinae"
    ],
    "assistingMuscles": [
      "Adductor magnus",
      "gluteus medius",
      "latissimus dorsi",
      "deltoid",
      "forearm flexors"
    ],
    "stabilizers": [
      "Abdominal wall",
      "pelvic stabilizers",
      "rotator cuff",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Mixed isometric bracing, eccentric support-leg control, and concentric turning."
    ],
    "commonForceOrSkillDemand": "Balance, rhythm, and force management under a continuously orbiting external load.",
    "recommendedExercisePatterns": [
      "rotational cable",
      "pivot",
      "anti-rotation",
      "grip",
      "single-leg strength"
    ],
    "recommendedExercises": [
      "cable woodchop",
      "landmine rotation",
      "farmer carry",
      "single-leg Romanian deadlift",
      "Pallof press"
    ],
    "transferRationale": "Cable, landmine, carry, and unilateral patterns develop general rotational control and grip, but the hammer's long-chain orbit and turning rhythm require specialized coaching.",
    "exerciseSelectionCautions": "Exercise choices are proxies for shared force, posture, and contraction demands rather than event-skill substitutes; progress load and velocity conservatively, preserve technical quality, and individualize for injury history, event phase, and training age.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://worldathletics.org/about-iaaf/documents/research-centre",
      "https://pubmed.ncbi.nlm.nih.gov/31977900/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed sprint and jump biomechanics, World Athletics technical/research materials, and throwing/event biomechanics sources; confidence is highest for sprint and jump force phases, while apparatus-specific transfer for pole vault and rotational throws remains an evidence-aware mechanical proxy rather than a causal performance claim."
  },
  {
    "id": "track-and-field-16",
    "sportId": "track-and-field",
    "label": "javelin approach",
    "movementFamily": "run-up and transition",
    "bodyActions": [
      "A relaxed run-up uses controlled crossover steps to prepare a braced throwing stance."
    ],
    "jointActions": [
      "Hip/knee/ankle cyclical actions",
      "crossover hip rotation",
      "shoulder and elbow positioning",
      "trunk control."
    ],
    "primeMovers": [
      "Gluteus maximus",
      "hamstrings",
      "quadriceps femoris",
      "soleus"
    ],
    "assistingMuscles": [
      "Gastrocnemius",
      "iliopsoas",
      "adductor magnus",
      "anterior deltoid"
    ],
    "stabilizers": [
      "Abdominal wall",
      "erector spinae",
      "gluteus medius",
      "scapular stabilizers",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Cyclic concentric/eccentric running, isometric posture, and controlled implement carriage."
    ],
    "commonForceOrSkillDemand": "Maintaining approach velocity while aligning the pelvis, trunk, and throwing arm for the block.",
    "recommendedExercisePatterns": [
      "approach sprint",
      "crossover drill",
      "single-leg strength",
      "trunk brace",
      "scapular control"
    ],
    "recommendedExercises": [
      "flying sprint",
      "split squat",
      "single-leg Romanian deadlift",
      "front plank",
      "face pull"
    ],
    "transferRationale": "Sprint and unilateral-control exercises support the approach and transition, but crossover rhythm and throwing alignment remain highly technical.",
    "exerciseSelectionCautions": "Exercise choices are proxies for shared force, posture, and contraction demands rather than event-skill substitutes; progress load and velocity conservatively, preserve technical quality, and individualize for injury history, event phase, and training age.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://worldathletics.org/about-iaaf/documents/research-centre",
      "https://pubmed.ncbi.nlm.nih.gov/31977900/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed sprint and jump biomechanics, World Athletics technical/research materials, and throwing/event biomechanics sources; confidence is highest for sprint and jump force phases, while apparatus-specific transfer for pole vault and rotational throws remains an evidence-aware mechanical proxy rather than a causal performance claim."
  },
  {
    "id": "track-and-field-17",
    "sportId": "track-and-field",
    "label": "javelin throw",
    "movementFamily": "rotational overhead throwing",
    "bodyActions": [
      "Crossover-to-block transition uses lower-body drive, trunk rotation, and a long overhead delivery path."
    ],
    "jointActions": [
      "Hip rotation/extension",
      "trunk rotation",
      "shoulder horizontal abduction then internal rotation",
      "elbow extension",
      "wrist flexion."
    ],
    "primeMovers": [
      "Obliques",
      "pectoralis major",
      "latissimus dorsi",
      "anterior deltoid",
      "triceps brachii"
    ],
    "assistingMuscles": [
      "Gluteus maximus",
      "adductor magnus",
      "serratus anterior",
      "pronator teres",
      "forearm flexors"
    ],
    "stabilizers": [
      "Front-leg hip and knee",
      "abdominal wall",
      "erector spinae",
      "rotator cuff",
      "scapular stabilizers"
    ],
    "contractionRoles": [
      "Eccentric stretch/loading, isometric front-side block, then proximal-to-distal concentric release."
    ],
    "commonForceOrSkillDemand": "Very high release velocity with lower-body block and shoulder-arm sequencing.",
    "recommendedExercisePatterns": [
      "overhead throw",
      "rotational throw",
      "split-stance press",
      "scapular control",
      "anti-rotation"
    ],
    "recommendedExercises": [
      "medicine-ball overhead throw",
      "medicine-ball rotational throw",
      "push press",
      "face pull",
      "Pallof press"
    ],
    "transferRationale": "Overhead and rotational medicine-ball work shares broad sequencing and release intent; loads, range, and volume require shoulder-specific screening and coaching.",
    "exerciseSelectionCautions": "Exercise choices are proxies for shared force, posture, and contraction demands rather than event-skill substitutes; progress load and velocity conservatively, preserve technical quality, and individualize for injury history, event phase, and training age.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://worldathletics.org/about-iaaf/documents/research-centre",
      "https://pubmed.ncbi.nlm.nih.gov/31977900/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed sprint and jump biomechanics, World Athletics technical/research materials, and throwing/event biomechanics sources; confidence is highest for sprint and jump force phases, while apparatus-specific transfer for pole vault and rotational throws remains an evidence-aware mechanical proxy rather than a causal performance claim."
  },
  {
    "id": "track-and-field-18",
    "sportId": "track-and-field",
    "label": "distance-running stride",
    "movementFamily": "endurance running gait",
    "bodyActions": [
      "Economical repeated stance and flight with moderate hip extension, knee recovery, and elastic ankle action."
    ],
    "jointActions": [
      "Hip extension/flexion",
      "knee flexion/extension",
      "ankle dorsiflexion/plantar-flexion under repeated contacts."
    ],
    "primeMovers": [
      "Soleus",
      "gastrocnemius",
      "gluteus maximus",
      "hamstrings"
    ],
    "assistingMuscles": [
      "Quadriceps femoris",
      "iliopsoas",
      "adductor magnus",
      "tibialis anterior"
    ],
    "stabilizers": [
      "Gluteus medius",
      "abdominal wall",
      "erector spinae",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Repeated eccentric impact absorption, concentric propulsion, and elastic ankle stiffness."
    ],
    "commonForceOrSkillDemand": "Large volume of submaximal contacts, running economy, and fatigue-resistant postural control.",
    "recommendedExercisePatterns": [
      "single-leg strength",
      "calf endurance",
      "hamstring capacity",
      "trunk endurance",
      "low-impact aerobic"
    ],
    "recommendedExercises": [
      "single-leg Romanian deadlift",
      "seated calf raise",
      "Nordic hamstring curl",
      "side plank",
      "step-up"
    ],
    "transferRationale": "Single-leg strength, calf capacity, and trunk endurance support tissue and posture demands, but endurance performance depends primarily on running-specific volume and metabolic training.",
    "exerciseSelectionCautions": "Exercise choices are proxies for shared force, posture, and contraction demands rather than event-skill substitutes; progress load and velocity conservatively, preserve technical quality, and individualize for injury history, event phase, and training age.",
    "evidenceConfidence": "high",
    "sources": [
      "https://worldathletics.org/about-iaaf/documents/research-centre",
      "https://pubmed.ncbi.nlm.nih.gov/35226345/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed sprint and jump biomechanics, World Athletics technical/research materials, and throwing/event biomechanics sources; confidence is highest for sprint and jump force phases, while apparatus-specific transfer for pole vault and rotational throws remains an evidence-aware mechanical proxy rather than a causal performance claim."
  },
  {
    "id": "track-and-field-19",
    "sportId": "track-and-field",
    "label": "race-walking stride",
    "movementFamily": "constrained endurance gait",
    "bodyActions": [
      "Alternating single support keeps the knee straight at contact, with pelvic rotation and continuous ground contact."
    ],
    "jointActions": [
      "Hip flexion/extension and rotation",
      "knee extension at contact",
      "ankle dorsiflexion/plantar-flexion",
      "shoulder counter-rotation."
    ],
    "primeMovers": [
      "Gluteus medius",
      "gluteus maximus",
      "iliopsoas",
      "quadriceps femoris"
    ],
    "assistingMuscles": [
      "Hamstrings",
      "adductor magnus",
      "soleus",
      "gastrocnemius",
      "obliques"
    ],
    "stabilizers": [
      "Abdominal wall",
      "erector spinae",
      "pelvic stabilizers",
      "intrinsic foot muscles",
      "scapular stabilizers"
    ],
    "contractionRoles": [
      "Eccentric support, concentric hip drive, and isometric pelvic/trunk control."
    ],
    "commonForceOrSkillDemand": "Rule-constrained gait economy, pelvic control, and continuous-contact rhythm.",
    "recommendedExercisePatterns": [
      "single-leg stance",
      "hip mobility",
      "calf capacity",
      "anti-rotation",
      "postural endurance"
    ],
    "recommendedExercises": [
      "step-up",
      "single-leg Romanian deadlift",
      "standing calf raise",
      "Pallof press",
      "side plank"
    ],
    "transferRationale": "Unilateral strength and pelvic/trunk control address general support demands; legal knee and contact constraints make race-walking technique itself non-substitutable.",
    "exerciseSelectionCautions": "Exercise choices are proxies for shared force, posture, and contraction demands rather than event-skill substitutes; progress load and velocity conservatively, preserve technical quality, and individualize for injury history, event phase, and training age.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://worldathletics.org/about-iaaf/documents/research-centre",
      "https://pubmed.ncbi.nlm.nih.gov/35226345/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed sprint and jump biomechanics, World Athletics technical/research materials, and throwing/event biomechanics sources; confidence is highest for sprint and jump force phases, while apparatus-specific transfer for pole vault and rotational throws remains an evidence-aware mechanical proxy rather than a causal performance claim."
  },
  {
    "id": "track-and-field-20",
    "sportId": "track-and-field",
    "label": "steeplechase barrier clearance",
    "movementFamily": "obstacle running and landing",
    "bodyActions": [
      "Approach-to-takeoff produces compact flight, deliberate landing, and immediate running transition."
    ],
    "jointActions": [
      "Hip/knee/ankle extension at takeoff",
      "hip flexion in flight",
      "eccentric knee/ankle control on landing."
    ],
    "primeMovers": [
      "Quadriceps femoris",
      "gluteus maximus",
      "hamstrings",
      "soleus",
      "gastrocnemius"
    ],
    "assistingMuscles": [
      "Iliopsoas",
      "rectus femoris",
      "adductor magnus",
      "tibialis anterior"
    ],
    "stabilizers": [
      "Gluteus medius",
      "abdominal wall",
      "erector spinae",
      "intrinsic foot muscles",
      "ankle stabilizers"
    ],
    "contractionRoles": [
      "Eccentric takeoff and landing absorption, concentric projection, and isometric midair posture."
    ],
    "commonForceOrSkillDemand": "Repeated obstacle clearance under fatigue with rapid return to running rhythm.",
    "recommendedExercisePatterns": [
      "low-barrier drill",
      "single-leg jump",
      "landing",
      "running",
      "calf stiffness"
    ],
    "recommendedExercises": [
      "hurdle mobility drill",
      "single-leg box jump",
      "drop landing",
      "step-up",
      "pogos"
    ],
    "transferRationale": "Barrier drills and landing progressions overlap with clearance and re-entry demands, but water-jump strategy, race rhythm, and fatigue tolerance require event-specific practice.",
    "exerciseSelectionCautions": "Exercise choices are proxies for shared force, posture, and contraction demands rather than event-skill substitutes; progress load and velocity conservatively, preserve technical quality, and individualize for injury history, event phase, and training age.",
    "evidenceConfidence": "high",
    "sources": [
      "https://worldathletics.org/about-iaaf/documents/research-centre",
      "https://pubmed.ncbi.nlm.nih.gov/30089292/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed sprint and jump biomechanics, World Athletics technical/research materials, and throwing/event biomechanics sources; confidence is highest for sprint and jump force phases, while apparatus-specific transfer for pole vault and rotational throws remains an evidence-aware mechanical proxy rather than a causal performance claim."
  },
  {
    "id": "swimming-1",
    "sportId": "swimming",
    "label": "freestyle pull",
    "movementFamily": "alternating underwater propulsion",
    "bodyActions": [
      "Reach, anchor the hand and forearm, then sweep the upper limb backward while the trunk rolls around the long axis."
    ],
    "jointActions": [
      "Shoulder extension and adduction with internal rotation",
      "elbow flexion during the early catch and extension toward exit",
      "scapular depression/retraction."
    ],
    "primeMovers": [
      "Latissimus dorsi",
      "pectoralis major",
      "teres major",
      "posterior deltoid."
    ],
    "assistingMuscles": [
      "Biceps brachii",
      "brachialis",
      "coracobrachialis",
      "triceps brachii",
      "lower trapezius."
    ],
    "stabilizers": [
      "Serratus anterior",
      "rotator cuff",
      "external obliques",
      "gluteus medius."
    ],
    "contractionRoles": [
      "Early catch uses isometric shoulder positioning and eccentric control",
      "propulsive phase is concentric shoulder extension/adduction with coordinated trunk rotation",
      "recovery is largely eccentric control."
    ],
    "commonForceOrSkillDemand": "Repeated unilateral pulling against water resistance with high shoulder-cycle volume and body-line preservation.",
    "recommendedExercisePatterns": [
      "straight-arm pulldown",
      "lat pulldown",
      "cable row",
      "half-kneeling cable pulldown"
    ],
    "recommendedExercises": [
      "straight-arm pulldown",
      "lat pulldown",
      "cable row",
      "half-kneeling cable pulldown"
    ],
    "transferRationale": "These patterns share shoulder extension/adduction, scapular control and trunk bracing, but do not reproduce aquatic propulsion or timing.",
    "exerciseSelectionCautions": "Prefer controlled loads and neutral shoulder mechanics; avoid forcing end-range internal rotation or training to fatigue when scapular control deteriorates.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3438875/",
      "https://www.jssm.org/hf.php?id=jssm-13-223.xml",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9566274/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed swimming biomechanics and sports-medicine literature on stroke mechanics, shoulder/scapular loading, swim starts, turns, and underwater undulatory propulsion; evidence confidence is moderate because gym exercises provide mechanical overlap rather than direct proof of sport-performance causation."
  },
  {
    "id": "swimming-2",
    "sportId": "swimming",
    "label": "freestyle catch",
    "movementFamily": "early propulsive catch",
    "bodyActions": [
      "Set the hand and forearm as a forward-facing paddle while the elbow remains relatively high and the body moves past the anchor."
    ],
    "jointActions": [
      "Shoulder flexion transitioning to extension",
      "elbow flexion",
      "scapular upward rotation/protraction with forearm pronation."
    ],
    "primeMovers": [
      "Latissimus dorsi",
      "pectoralis major",
      "teres major."
    ],
    "assistingMuscles": [
      "Biceps brachii",
      "brachialis",
      "serratus anterior",
      "anterior deltoid."
    ],
    "stabilizers": [
      "Rotator cuff",
      "lower trapezius",
      "obliques",
      "wrist flexors."
    ],
    "contractionRoles": [
      "Mostly isometric hand/forearm and scapular anchoring, followed by concentric pull and eccentric recovery."
    ],
    "commonForceOrSkillDemand": "Ability to create a stable proximal anchor while producing force without dropping the elbow.",
    "recommendedExercisePatterns": [
      "half-kneeling cable pulldown",
      "assisted pull-up",
      "straight-arm pulldown",
      "cable row"
    ],
    "recommendedExercises": [
      "half-kneeling cable pulldown",
      "assisted pull-up",
      "straight-arm pulldown",
      "cable row"
    ],
    "transferRationale": "Vertical pulling and straight-arm work approximate the shoulder/scapular force direction and bracing requirement; technical catch feel remains water-specific.",
    "exerciseSelectionCautions": "Do not chase a very deep shoulder stretch or aggressive high-elbow position under load; use pain-free range and coach scapular rhythm.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3438875/",
      "https://www.jssm.org/hf.php?id=jssm-13-223.xml",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9566274/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed swimming biomechanics and sports-medicine literature on stroke mechanics, shoulder/scapular loading, swim starts, turns, and underwater undulatory propulsion; evidence confidence is moderate because gym exercises provide mechanical overlap rather than direct proof of sport-performance causation."
  },
  {
    "id": "swimming-3",
    "sportId": "swimming",
    "label": "freestyle kick",
    "movementFamily": "hip-driven alternating kick",
    "bodyActions": [
      "Alternate small-amplitude leg motions from the hips while maintaining plantarflexed feet and a streamlined pelvis."
    ],
    "jointActions": [
      "Hip flexion/extension",
      "small knee flexion/extension",
      "ankle plantarflexion with limited inversion/eversion."
    ],
    "primeMovers": [
      "Iliopsoas",
      "rectus femoris",
      "gluteus maximus",
      "gastrocnemius",
      "soleus."
    ],
    "assistingMuscles": [
      "Hamstrings",
      "sartorius",
      "tibialis anterior during recovery control."
    ],
    "stabilizers": [
      "Gluteus medius",
      "deep abdominal muscles",
      "intrinsic foot muscles."
    ],
    "contractionRoles": [
      "Rhythmic reciprocal concentric/eccentric action with isometric trunk and pelvic alignment."
    ],
    "commonForceOrSkillDemand": "Repeated low-amplitude hip-to-ankle propulsion and ankle plantarflexion endurance rather than a large knee kick.",
    "recommendedExercisePatterns": [
      "straight-leg raise",
      "hip flexor raise",
      "glute bridge",
      "standing calf raise"
    ],
    "recommendedExercises": [
      "straight-leg raise",
      "hip flexor raise",
      "glute bridge",
      "standing calf raise"
    ],
    "transferRationale": "These exercises train hip flexion/extension and plantarflexion capacity that underpin the kick, without claiming identical hydrodynamic output.",
    "exerciseSelectionCautions": "Avoid excessive knee-dominant kicking, lumbar extension, or loaded ankle range that provokes calf/Achilles symptoms.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3438875/",
      "https://www.jssm.org/hf.php?id=jssm-13-223.xml",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9566274/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed swimming biomechanics and sports-medicine literature on stroke mechanics, shoulder/scapular loading, swim starts, turns, and underwater undulatory propulsion; evidence confidence is moderate because gym exercises provide mechanical overlap rather than direct proof of sport-performance causation."
  },
  {
    "id": "swimming-4",
    "sportId": "swimming",
    "label": "freestyle body rotation",
    "movementFamily": "axial rotation and roll",
    "bodyActions": [
      "Rotate the trunk and pelvis side-to-side to coordinate breathing and shoulder recovery while preserving a long body line."
    ],
    "jointActions": [
      "Thoracic and lumbar axial rotation",
      "scapular rotation",
      "hip internal/external rotation."
    ],
    "primeMovers": [
      "Internal oblique",
      "external oblique",
      "multifidus",
      "serratus anterior."
    ],
    "assistingMuscles": [
      "Transversus abdominis",
      "erector spinae",
      "gluteus medius",
      "hip rotators."
    ],
    "stabilizers": [
      "Rotator cuff",
      "deep neck flexors",
      "pelvic stabilizers."
    ],
    "contractionRoles": [
      "Concentric rotation is followed by eccentric return",
      "the trunk and support-side shoulder use isometric bracing."
    ],
    "commonForceOrSkillDemand": "Fast repeated roll with controlled range and minimal lateral sway.",
    "recommendedExercisePatterns": [
      "cable chop",
      "Pallof press",
      "side plank rotation",
      "dead bug"
    ],
    "recommendedExercises": [
      "cable chop",
      "Pallof press",
      "side plank rotation",
      "dead bug"
    ],
    "transferRationale": "Rotational and anti-rotational patterns develop trunk control that can support body-line maintenance during roll; stroke timing must still be learned in water.",
    "exerciseSelectionCautions": "Use thoracic-led rotation and keep the lumbar spine comfortable; do not add neck motion by lifting the head.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3438875/",
      "https://www.jssm.org/hf.php?id=jssm-13-223.xml",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9566274/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed swimming biomechanics and sports-medicine literature on stroke mechanics, shoulder/scapular loading, swim starts, turns, and underwater undulatory propulsion; evidence confidence is moderate because gym exercises provide mechanical overlap rather than direct proof of sport-performance causation."
  },
  {
    "id": "swimming-5",
    "sportId": "swimming",
    "label": "backstroke pull",
    "movementFamily": "supine alternating propulsion",
    "bodyActions": [
      "Pull water from overhead toward the hip while the body rolls and the opposite arm recovers."
    ],
    "jointActions": [
      "Shoulder extension/adduction and internal rotation in pull",
      "elbow flexion then extension",
      "scapular depression/retraction."
    ],
    "primeMovers": [
      "Latissimus dorsi",
      "pectoralis major",
      "teres major",
      "posterior deltoid."
    ],
    "assistingMuscles": [
      "Biceps brachii",
      "brachialis",
      "triceps brachii",
      "lower trapezius."
    ],
    "stabilizers": [
      "Serratus anterior",
      "rotator cuff",
      "obliques",
      "gluteus medius."
    ],
    "contractionRoles": [
      "Catch isometric, pull concentric, recovery eccentric, with continuous trunk isometric alignment."
    ],
    "commonForceOrSkillDemand": "Alternating overhead pulling in a supine body line and repeated shoulder rotation.",
    "recommendedExercisePatterns": [
      "neutral-grip pulldown",
      "cable row",
      "straight-arm pulldown",
      "assisted pull-up"
    ],
    "recommendedExercises": [
      "neutral-grip pulldown",
      "cable row",
      "straight-arm pulldown",
      "assisted pull-up"
    ],
    "transferRationale": "Pulling patterns overlap the major shoulder-extension and scapular demands while the supine roll and aquatic resistance remain specific.",
    "exerciseSelectionCautions": "Avoid rib flare and excessive lumbar arch; adjust grip and volume for shoulder tolerance.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3438875/",
      "https://www.jssm.org/hf.php?id=jssm-13-223.xml",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9566274/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed swimming biomechanics and sports-medicine literature on stroke mechanics, shoulder/scapular loading, swim starts, turns, and underwater undulatory propulsion; evidence confidence is moderate because gym exercises provide mechanical overlap rather than direct proof of sport-performance causation."
  },
  {
    "id": "swimming-6",
    "sportId": "swimming",
    "label": "backstroke kick",
    "movementFamily": "supine hip-driven flutter kick",
    "bodyActions": [
      "Produce alternating hip-driven kicks with relaxed knees and plantarflexed ankles while keeping the pelvis near the surface."
    ],
    "jointActions": [
      "Hip flexion/extension",
      "small knee motion",
      "ankle plantarflexion."
    ],
    "primeMovers": [
      "Iliopsoas",
      "gluteus maximus",
      "rectus femoris",
      "gastrocnemius",
      "soleus."
    ],
    "assistingMuscles": [
      "Hamstrings",
      "sartorius",
      "tibialis anterior."
    ],
    "stabilizers": [
      "Gluteus medius",
      "transversus abdominis",
      "intrinsic foot muscles."
    ],
    "contractionRoles": [
      "Reciprocal concentric/eccentric rhythm with isometric pelvis and trunk control."
    ],
    "commonForceOrSkillDemand": "Sustained alternating leg action with small amplitude and stable pelvis.",
    "recommendedExercisePatterns": [
      "straight-leg raise",
      "hip flexor raise",
      "glute bridge",
      "standing calf raise"
    ],
    "recommendedExercises": [
      "straight-leg raise",
      "hip flexor raise",
      "glute bridge",
      "standing calf raise"
    ],
    "transferRationale": "Hip and calf exercises address the primary land-based capacities of the kick but not buoyancy or ankle drag.",
    "exerciseSelectionCautions": "Keep knees soft rather than snapping them; limit volume if hip-flexor or lumbar fatigue changes the body line.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3438875/",
      "https://www.jssm.org/hf.php?id=jssm-13-223.xml",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9566274/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed swimming biomechanics and sports-medicine literature on stroke mechanics, shoulder/scapular loading, swim starts, turns, and underwater undulatory propulsion; evidence confidence is moderate because gym exercises provide mechanical overlap rather than direct proof of sport-performance causation."
  },
  {
    "id": "swimming-7",
    "sportId": "swimming",
    "label": "breaststroke pull",
    "movementFamily": "bilateral outsweep-insweep recovery",
    "bodyActions": [
      "Sweep the hands outward, catch water, draw the forearms and hands inward toward the chest, then shoot forward into recovery."
    ],
    "jointActions": [
      "Shoulder horizontal abduction/adduction and flexion",
      "elbow flexion then extension",
      "scapular protraction/retraction."
    ],
    "primeMovers": [
      "Pectoralis major",
      "latissimus dorsi",
      "anterior deltoid",
      "triceps brachii."
    ],
    "assistingMuscles": [
      "Biceps brachii",
      "brachialis",
      "serratus anterior",
      "coracobrachialis."
    ],
    "stabilizers": [
      "Rotator cuff",
      "lower trapezius",
      "abdominal muscles."
    ],
    "contractionRoles": [
      "Outsweep and catch include eccentric/isometric setting",
      "insweep is concentric adduction/flexion",
      "forward recovery is eccentric braking and streamline isometric."
    ],
    "commonForceOrSkillDemand": "Bilateral upper-limb force with precise timing between pull, breath and kick.",
    "recommendedExercisePatterns": [
      "cable fly",
      "chest-supported row",
      "cable press",
      "triceps pressdown"
    ],
    "recommendedExercises": [
      "cable fly",
      "chest-supported row",
      "cable press",
      "triceps pressdown"
    ],
    "transferRationale": "Pressing and pulling patterns overlap the bilateral arm force demands and scapular control, but breaststroke sequencing and resistance direction are aquatic-specific.",
    "exerciseSelectionCautions": "Use moderate range and avoid aggressive loaded horizontal abduction; coordinate with shoulder-health work.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3438875/",
      "https://www.jssm.org/hf.php?id=jssm-13-223.xml",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9566274/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed swimming biomechanics and sports-medicine literature on stroke mechanics, shoulder/scapular loading, swim starts, turns, and underwater undulatory propulsion; evidence confidence is moderate because gym exercises provide mechanical overlap rather than direct proof of sport-performance causation."
  },
  {
    "id": "swimming-8",
    "sportId": "swimming",
    "label": "breaststroke kick",
    "movementFamily": "whip kick propulsion",
    "bodyActions": [
      "Recover the heels toward the hips, rotate the feet outward, sweep the lower legs backward and inward, then snap together into streamline."
    ],
    "jointActions": [
      "Hip flexion/abduction/external rotation then extension/adduction/internal rotation",
      "knee flexion/extension",
      "ankle dorsiflexion then plantarflexion."
    ],
    "primeMovers": [
      "Adductor magnus",
      "adductor longus",
      "gluteus maximus",
      "hamstrings",
      "gastrocnemius."
    ],
    "assistingMuscles": [
      "Gracilis",
      "sartorius",
      "iliopsoas",
      "quadriceps",
      "soleus."
    ],
    "stabilizers": [
      "Gluteus medius",
      "deep hip rotators",
      "abdominal muscles",
      "foot stabilizers."
    ],
    "contractionRoles": [
      "Recovery is controlled eccentric knee/hip action",
      "propulsive whip is concentric adduction/extension with brief isometric squeeze."
    ],
    "commonForceOrSkillDemand": "Large frontal-plane adductor contribution, rapid leg whip and ankle-foot orientation.",
    "recommendedExercisePatterns": [
      "lateral squat",
      "adductor slide",
      "hamstring curl",
      "goblet squat"
    ],
    "recommendedExercises": [
      "lateral squat",
      "adductor slide",
      "hamstring curl",
      "goblet squat"
    ],
    "transferRationale": "These patterns train adductor, hamstring and squat capacities resembling the force-producing phases without claiming stroke-specific performance gains.",
    "exerciseSelectionCautions": "Progress adductor loading gradually; do not force turnout or knee valgus, and stop if groin pain appears.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3438875/",
      "https://www.jssm.org/hf.php?id=jssm-13-223.xml",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9566274/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed swimming biomechanics and sports-medicine literature on stroke mechanics, shoulder/scapular loading, swim starts, turns, and underwater undulatory propulsion; evidence confidence is moderate because gym exercises provide mechanical overlap rather than direct proof of sport-performance causation."
  },
  {
    "id": "swimming-9",
    "sportId": "swimming",
    "label": "butterfly pull",
    "movementFamily": "bilateral undulatory pull",
    "bodyActions": [
      "Enter both hands, catch, press water backward with simultaneous arms, then recover forward over the surface as the trunk undulates."
    ],
    "jointActions": [
      "Shoulder flexion into extension/adduction and internal rotation",
      "elbow flexion then extension",
      "scapular depression/protraction."
    ],
    "primeMovers": [
      "Latissimus dorsi",
      "pectoralis major",
      "teres major",
      "triceps brachii."
    ],
    "assistingMuscles": [
      "Biceps brachii",
      "anterior deltoid",
      "serratus anterior",
      "rectus abdominis."
    ],
    "stabilizers": [
      "Rotator cuff",
      "lower trapezius",
      "erector spinae",
      "gluteus maximus."
    ],
    "contractionRoles": [
      "Catch and recovery include isometric/eccentric control",
      "pull is concentric and linked to a wave-like trunk action."
    ],
    "commonForceOrSkillDemand": "High bilateral pulling demand synchronized with trunk undulation and repeated shoulder recovery.",
    "recommendedExercisePatterns": [
      "lat pulldown",
      "straight-arm pulldown",
      "cable row",
      "medicine-ball pullover"
    ],
    "recommendedExercises": [
      "lat pulldown",
      "straight-arm pulldown",
      "cable row",
      "medicine-ball pullover"
    ],
    "transferRationale": "Bilateral pulling and pullover patterns share broad shoulder and trunk force directions, but butterfly timing and water feel are not replicated.",
    "exerciseSelectionCautions": "Manage shoulder volume carefully; avoid deep fatigue, forced extension, or substituting lumbar hyperextension for thoracic/hip undulation.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3438875/",
      "https://www.jssm.org/hf.php?id=jssm-13-223.xml",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9566274/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed swimming biomechanics and sports-medicine literature on stroke mechanics, shoulder/scapular loading, swim starts, turns, and underwater undulatory propulsion; evidence confidence is moderate because gym exercises provide mechanical overlap rather than direct proof of sport-performance causation."
  },
  {
    "id": "swimming-10",
    "sportId": "swimming",
    "label": "dolphin kick",
    "movementFamily": "whole-body undulatory propulsion",
    "bodyActions": [
      "Transmit a wave from the trunk through the pelvis, knees and ankles with small, fast foot motion."
    ],
    "jointActions": [
      "Spinal flexion/extension",
      "hip flexion/extension",
      "knee flexion/extension",
      "ankle plantarflexion."
    ],
    "primeMovers": [
      "Rectus abdominis",
      "erector spinae",
      "gluteus maximus",
      "hamstrings",
      "gastrocnemius",
      "soleus."
    ],
    "assistingMuscles": [
      "Iliopsoas",
      "rectus femoris",
      "obliques",
      "quadriceps."
    ],
    "stabilizers": [
      "Transversus abdominis",
      "serratus anterior",
      "deep spinal stabilizers",
      "pelvic stabilizers."
    ],
    "contractionRoles": [
      "Alternating concentric/eccentric wave with isometric upper-body streamline."
    ],
    "commonForceOrSkillDemand": "Rhythmic proximal-to-distal sequencing and ankle stiffness under submerged resistance.",
    "recommendedExercisePatterns": [
      "hollow-body hold",
      "body-wave drill",
      "glute bridge",
      "standing calf raise"
    ],
    "recommendedExercises": [
      "hollow-body hold",
      "body-wave drill",
      "glute bridge",
      "standing calf raise"
    ],
    "transferRationale": "Hollow-body, hip-extension and calf patterns develop supporting capacities for an undulatory kick; they do not establish the aquatic wave automatically.",
    "exerciseSelectionCautions": "Keep wave amplitude controlled and avoid painful lumbar compression; prioritize technique and ankle mobility.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3438875/",
      "https://www.jssm.org/hf.php?id=jssm-13-223.xml",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9566274/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed swimming biomechanics and sports-medicine literature on stroke mechanics, shoulder/scapular loading, swim starts, turns, and underwater undulatory propulsion; evidence confidence is moderate because gym exercises provide mechanical overlap rather than direct proof of sport-performance causation."
  },
  {
    "id": "swimming-11",
    "sportId": "swimming",
    "label": "streamline",
    "movementFamily": "hydrodynamic body-line alignment",
    "bodyActions": [
      "Hold both arms overhead with hands stacked, elbows extended and ribs/pelvis aligned during glide."
    ],
    "jointActions": [
      "Shoulder flexion/elevation",
      "elbow extension",
      "scapular upward rotation/protraction",
      "trunk anti-extension."
    ],
    "primeMovers": [
      "Serratus anterior",
      "anterior deltoid",
      "triceps brachii."
    ],
    "assistingMuscles": [
      "Pectoralis major",
      "lower trapezius",
      "rotator cuff",
      "rectus abdominis."
    ],
    "stabilizers": [
      "Transversus abdominis",
      "gluteus maximus",
      "pelvic floor",
      "neck flexors."
    ],
    "contractionRoles": [
      "Predominantly isometric shoulder and trunk bracing with small eccentric corrections."
    ],
    "commonForceOrSkillDemand": "Maintain a narrow, rigid body line while minimizing drag after push-off or start.",
    "recommendedExercisePatterns": [
      "overhead carry",
      "hollow-body hold",
      "serratus wall slide",
      "dead bug"
    ],
    "recommendedExercises": [
      "overhead carry",
      "hollow-body hold",
      "serratus wall slide",
      "dead bug"
    ],
    "transferRationale": "Overhead carries, hollow holds and serratus work overlap the alignment and anti-extension demands; drag reduction and aquatic posture require pool practice.",
    "exerciseSelectionCautions": "Do not force shoulder flexion if it causes pain or rib flare; regress to wall-supported positions.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3438875/",
      "https://www.jssm.org/hf.php?id=jssm-13-223.xml",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9566274/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed swimming biomechanics and sports-medicine literature on stroke mechanics, shoulder/scapular loading, swim starts, turns, and underwater undulatory propulsion; evidence confidence is moderate because gym exercises provide mechanical overlap rather than direct proof of sport-performance causation."
  },
  {
    "id": "swimming-12",
    "sportId": "swimming",
    "label": "wall push-off",
    "movementFamily": "horizontal leg-drive push",
    "bodyActions": [
      "Plant the feet on the wall, flex hips and knees, then extend the lower limbs to project into streamline."
    ],
    "jointActions": [
      "Hip/knee/ankle extension",
      "trunk bracing",
      "shoulder flexion in streamline."
    ],
    "primeMovers": [
      "Gluteus maximus",
      "quadriceps",
      "gastrocnemius",
      "soleus."
    ],
    "assistingMuscles": [
      "Hamstrings",
      "adductor magnus",
      "triceps brachii",
      "serratus anterior."
    ],
    "stabilizers": [
      "Abdominals",
      "gluteus medius",
      "foot/ankle stabilizers",
      "rotator cuff."
    ],
    "contractionRoles": [
      "Loaded flexion is eccentric/isometric, followed by explosive concentric triple extension and isometric streamline."
    ],
    "commonForceOrSkillDemand": "Short-range high-force horizontal projection followed by immediate body-line control.",
    "recommendedExercisePatterns": [
      "split-stance leg press",
      "squat jump",
      "standing calf raise",
      "hollow-body hold"
    ],
    "recommendedExercises": [
      "split-stance leg press",
      "squat jump",
      "standing calf raise",
      "hollow-body hold"
    ],
    "transferRationale": "Leg press, jumps and calf work share extension and force-direction qualities; pool-wall angle, timing and tactile foot placement remain specific.",
    "exerciseSelectionCautions": "Use safe jump volume and avoid maximal depth or load when knees, hips or Achilles are symptomatic.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3438875/",
      "https://www.jssm.org/hf.php?id=jssm-13-223.xml",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9566274/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed swimming biomechanics and sports-medicine literature on stroke mechanics, shoulder/scapular loading, swim starts, turns, and underwater undulatory propulsion; evidence confidence is moderate because gym exercises provide mechanical overlap rather than direct proof of sport-performance causation."
  },
  {
    "id": "swimming-13",
    "sportId": "swimming",
    "label": "flip turn",
    "movementFamily": "tuck rotation and re-extension",
    "bodyActions": [
      "Accelerate into a forward somersault, compact the hips and knees, then extend to plant feet and push into streamline."
    ],
    "jointActions": [
      "Cervical/thoracic flexion and axial rotation",
      "hip/knee flexion then extension",
      "ankle plantarflexion."
    ],
    "primeMovers": [
      "Rectus abdominis",
      "iliopsoas",
      "rectus femoris",
      "gluteus maximus",
      "quadriceps."
    ],
    "assistingMuscles": [
      "Obliques",
      "hamstrings",
      "gastrocnemius",
      "soleus",
      "erector spinae."
    ],
    "stabilizers": [
      "Deep neck flexors",
      "shoulder stabilizers",
      "pelvic and foot stabilizers."
    ],
    "contractionRoles": [
      "Tuck is concentric flexion with eccentric braking",
      "foot plant is isometric/eccentric absorption followed by explosive extension."
    ],
    "commonForceOrSkillDemand": "Rapid reorientation, compact tuck, accurate foot placement and forceful wall exit.",
    "recommendedExercisePatterns": [
      "tuck roll",
      "dead bug",
      "squat jump",
      "leg press"
    ],
    "recommendedExercises": [
      "tuck roll",
      "dead bug",
      "squat jump",
      "leg press"
    ],
    "transferRationale": "These patterns support compression, trunk control and leg-drive qualities, but vestibular timing and wall orientation must be practiced in water.",
    "exerciseSelectionCautions": "Do not load cervical flexion; use coached rolls, adequate space and gradual speed progression.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3438875/",
      "https://www.jssm.org/hf.php?id=jssm-13-223.xml",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9566274/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed swimming biomechanics and sports-medicine literature on stroke mechanics, shoulder/scapular loading, swim starts, turns, and underwater undulatory propulsion; evidence confidence is moderate because gym exercises provide mechanical overlap rather than direct proof of sport-performance causation."
  },
  {
    "id": "swimming-14",
    "sportId": "swimming",
    "label": "open turn",
    "movementFamily": "two-hand touch, fold and push",
    "bodyActions": [
      "Touch with both hands, flex and rotate the body toward the wall, bring the feet under the body, then push away in streamline."
    ],
    "jointActions": [
      "Shoulder flexion",
      "elbow extension",
      "hip/knee flexion then extension",
      "trunk rotation."
    ],
    "primeMovers": [
      "Pectoralis major",
      "triceps brachii",
      "quadriceps",
      "gluteus maximus."
    ],
    "assistingMuscles": [
      "Latissimus dorsi",
      "hamstrings",
      "adductors",
      "obliques",
      "gastrocnemius."
    ],
    "stabilizers": [
      "Rotator cuff",
      "serratus anterior",
      "deep abdominals",
      "foot stabilizers."
    ],
    "contractionRoles": [
      "Touch uses isometric reach and eccentric absorption",
      "tuck is concentric flexion",
      "push-off is concentric triple extension with isometric streamline."
    ],
    "commonForceOrSkillDemand": "Bilateral touch accuracy, rapid compact repositioning and strong horizontal wall push.",
    "recommendedExercisePatterns": [
      "medicine-ball chest press",
      "goblet squat",
      "cable chop",
      "squat jump"
    ],
    "recommendedExercises": [
      "medicine-ball chest press",
      "goblet squat",
      "cable chop",
      "squat jump"
    ],
    "transferRationale": "Press, squat, rotation and jump patterns overlap component qualities but not the exact wall-touch choreography.",
    "exerciseSelectionCautions": "Avoid shoulder overreach at the touch; keep turn speed submaximal until technical accuracy is consistent.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3438875/",
      "https://www.jssm.org/hf.php?id=jssm-13-223.xml",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9566274/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed swimming biomechanics and sports-medicine literature on stroke mechanics, shoulder/scapular loading, swim starts, turns, and underwater undulatory propulsion; evidence confidence is moderate because gym exercises provide mechanical overlap rather than direct proof of sport-performance causation."
  },
  {
    "id": "swimming-15",
    "sportId": "swimming",
    "label": "diving start",
    "movementFamily": "block projection and entry",
    "bodyActions": [
      "Move from a crouched set position through rapid triple extension, flight alignment, water entry and streamline."
    ],
    "jointActions": [
      "Hip/knee/ankle extension",
      "shoulder flexion",
      "elbow extension",
      "spinal alignment."
    ],
    "primeMovers": [
      "Gluteus maximus",
      "quadriceps",
      "hamstrings",
      "gastrocnemius",
      "soleus."
    ],
    "assistingMuscles": [
      "Anterior deltoid",
      "triceps brachii",
      "serratus anterior",
      "erector spinae."
    ],
    "stabilizers": [
      "Rotator cuff",
      "abdominals",
      "gluteus medius",
      "foot stabilizers."
    ],
    "contractionRoles": [
      "Countermovement is eccentric, take-off concentric and flight/entry alignment is isometric with eccentric water-entry control."
    ],
    "commonForceOrSkillDemand": "Explosive horizontal/vertical projection, precise center of mass control and low-drag entry.",
    "recommendedExercisePatterns": [
      "trap-bar jump",
      "broad jump",
      "squat jump",
      "overhead carry"
    ],
    "recommendedExercises": [
      "trap-bar jump",
      "broad jump",
      "squat jump",
      "overhead carry"
    ],
    "transferRationale": "Jump and carry patterns train projection and body-line capacities, while block reaction, flight angle and entry are highly technical.",
    "exerciseSelectionCautions": "Use qualified coaching and safe landing/entry progressions; do not equate loaded jumps with dive skill.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3438875/",
      "https://www.jssm.org/hf.php?id=jssm-13-223.xml",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9566274/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed swimming biomechanics and sports-medicine literature on stroke mechanics, shoulder/scapular loading, swim starts, turns, and underwater undulatory propulsion; evidence confidence is moderate because gym exercises provide mechanical overlap rather than direct proof of sport-performance causation."
  },
  {
    "id": "swimming-16",
    "sportId": "swimming",
    "label": "underwater dolphin",
    "movementFamily": "streamlined submerged undulation",
    "bodyActions": [
      "Maintain streamline while producing repeated trunk-to-ankle waves after starts and turns."
    ],
    "jointActions": [
      "Spinal flexion/extension",
      "hip/knee motion",
      "ankle plantarflexion",
      "shoulder elevation."
    ],
    "primeMovers": [
      "Rectus abdominis",
      "erector spinae",
      "gluteus maximus",
      "hamstrings",
      "gastrocnemius",
      "soleus."
    ],
    "assistingMuscles": [
      "Obliques",
      "iliopsoas",
      "rectus femoris",
      "quadriceps."
    ],
    "stabilizers": [
      "Transversus abdominis",
      "serratus anterior",
      "rotator cuff",
      "pelvic stabilizers."
    ],
    "contractionRoles": [
      "Rhythmic mixed concentric/eccentric wave with isometric upper-limb and trunk alignment."
    ],
    "commonForceOrSkillDemand": "Underwater propulsion requires wave sequencing, ankle-foot control and low-drag posture.",
    "recommendedExercisePatterns": [
      "hollow-body hold",
      "body-wave drill",
      "glute bridge",
      "standing calf raise"
    ],
    "recommendedExercises": [
      "hollow-body hold",
      "body-wave drill",
      "glute bridge",
      "standing calf raise"
    ],
    "transferRationale": "The exercise set targets trunk stiffness, hip drive and plantarflexion that support the movement, without promising faster underwater times.",
    "exerciseSelectionCautions": "Respect breath-hold safety and avoid hyperventilation; keep amplitude low enough to preserve streamline and lumbar comfort.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3438875/",
      "https://www.jssm.org/hf.php?id=jssm-13-223.xml",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9566274/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed swimming biomechanics and sports-medicine literature on stroke mechanics, shoulder/scapular loading, swim starts, turns, and underwater undulatory propulsion; evidence confidence is moderate because gym exercises provide mechanical overlap rather than direct proof of sport-performance causation."
  },
  {
    "id": "swimming-17",
    "sportId": "swimming",
    "label": "breathing rotation",
    "movementFamily": "breath-linked axial rotation",
    "bodyActions": [
      "Roll the trunk and pelvis with controlled cervical turn so the mouth clears the surface while the opposite arm supports the body."
    ],
    "jointActions": [
      "Thoracic axial rotation",
      "cervical rotation",
      "shoulder flexion/extension",
      "hip rotation."
    ],
    "primeMovers": [
      "Internal oblique",
      "external oblique",
      "multifidus",
      "serratus anterior."
    ],
    "assistingMuscles": [
      "Deep neck rotators",
      "rotator cuff",
      "gluteus medius",
      "hip rotators."
    ],
    "stabilizers": [
      "Deep neck flexors",
      "lower trapezius",
      "transversus abdominis",
      "pelvic stabilizers."
    ],
    "contractionRoles": [
      "Concentric trunk roll and eccentric return with isometric support-side shoulder and neck stabilization."
    ],
    "commonForceOrSkillDemand": "Precisely timed rotation and breath access without lifting the head or disrupting propulsion.",
    "recommendedExercisePatterns": [
      "side plank rotation",
      "Pallof press",
      "cable chop",
      "dead bug"
    ],
    "recommendedExercises": [
      "side plank rotation",
      "Pallof press",
      "cable chop",
      "dead bug"
    ],
    "transferRationale": "Anti-rotation and controlled rotation build trunk control relevant to the roll, while breathing timing and buoyancy remain stroke-specific.",
    "exerciseSelectionCautions": "Avoid loaded end-range cervical rotation; keep the head aligned with the spine and stop for neck symptoms.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3438875/",
      "https://www.jssm.org/hf.php?id=jssm-13-223.xml",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9566274/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed swimming biomechanics and sports-medicine literature on stroke mechanics, shoulder/scapular loading, swim starts, turns, and underwater undulatory propulsion; evidence confidence is moderate because gym exercises provide mechanical overlap rather than direct proof of sport-performance causation."
  },
  {
    "id": "swimming-18",
    "sportId": "swimming",
    "label": "scapular protraction",
    "movementFamily": "scapulothoracic reach and anchor",
    "bodyActions": [
      "Glide the scapula around the rib cage during overhead reach and hand anchoring, then control return during pull/recovery."
    ],
    "jointActions": [
      "Scapular protraction/upward rotation and controlled retraction",
      "shoulder flexion."
    ],
    "primeMovers": [
      "Serratus anterior",
      "pectoralis minor",
      "anterior deltoid."
    ],
    "assistingMuscles": [
      "Upper trapezius",
      "lower trapezius",
      "pectoralis major."
    ],
    "stabilizers": [
      "Rotator cuff",
      "rhomboids",
      "thoracic extensors",
      "abdominal muscles."
    ],
    "contractionRoles": [
      "Concentric protraction and upward rotation with eccentric retraction control and isometric overhead positioning."
    ],
    "commonForceOrSkillDemand": "Stable scapular motion under repeated overhead cycles rather than rigid pinning of the shoulder blade.",
    "recommendedExercisePatterns": [
      "push-up-plus",
      "serratus punch",
      "serratus wall slide",
      "overhead carry"
    ],
    "recommendedExercises": [
      "push-up-plus",
      "serratus punch",
      "serratus wall slide",
      "overhead carry"
    ],
    "transferRationale": "These patterns directly train scapular protraction and upward-rotation capacity, but should complement rather than replace stroke technique.",
    "exerciseSelectionCautions": "Avoid shrugging or winging; use pain-free ranges and low-to-moderate fatigue because shoulder-cycle tolerance is a key constraint.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3438875/",
      "https://www.jssm.org/hf.php?id=jssm-13-223.xml",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9566274/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed swimming biomechanics and sports-medicine literature on stroke mechanics, shoulder/scapular loading, swim starts, turns, and underwater undulatory propulsion; evidence confidence is moderate because gym exercises provide mechanical overlap rather than direct proof of sport-performance causation."
  },
  {
    "id": "swimming-19",
    "sportId": "swimming",
    "label": "shoulder internal rotation",
    "movementFamily": "underwater medial-rotation pull",
    "bodyActions": [
      "Rotate the humerus medially while combining shoulder extension/adduction during the underwater pull."
    ],
    "jointActions": [
      "Glenohumeral internal rotation with extension/adduction",
      "scapular depression",
      "elbow flexion/extension."
    ],
    "primeMovers": [
      "Subscapularis",
      "pectoralis major",
      "latissimus dorsi",
      "teres major",
      "anterior deltoid."
    ],
    "assistingMuscles": [
      "Triceps brachii",
      "biceps brachii",
      "coracobrachialis",
      "serratus anterior."
    ],
    "stabilizers": [
      "Infraspinatus",
      "teres minor",
      "lower trapezius",
      "rotator cuff",
      "trunk muscles."
    ],
    "contractionRoles": [
      "Pull is concentric with eccentric control during recovery and co-contraction for humeral-head centering."
    ],
    "commonForceOrSkillDemand": "Repeated medial rotation under resistance with scapular control and high cumulative volume.",
    "recommendedExercisePatterns": [
      "band internal rotation",
      "cable internal rotation",
      "lat pulldown",
      "straight-arm pulldown"
    ],
    "recommendedExercises": [
      "band internal rotation",
      "cable internal rotation",
      "lat pulldown",
      "straight-arm pulldown"
    ],
    "transferRationale": "Rotator-cuff and pulldown patterns overlap the action and proximal control needs, but exercise volume must be balanced with external-rotation and scapular work.",
    "exerciseSelectionCautions": "Use light-to-moderate resistance and neutral humeral alignment; do not treat internal-rotation strengthening as a license for painful range or excessive volume.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3438875/",
      "https://www.jssm.org/hf.php?id=jssm-13-223.xml",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9566274/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed swimming biomechanics and sports-medicine literature on stroke mechanics, shoulder/scapular loading, swim starts, turns, and underwater undulatory propulsion; evidence confidence is moderate because gym exercises provide mechanical overlap rather than direct proof of sport-performance causation."
  },
  {
    "id": "swimming-20",
    "sportId": "swimming",
    "label": "finishing reach",
    "movementFamily": "terminal reach and wall-line extension",
    "bodyActions": [
      "Lengthen forward at the end of the stroke while keeping the trunk long, then decelerate after the wall touch or next entry."
    ],
    "jointActions": [
      "Shoulder flexion/elevation",
      "elbow extension",
      "scapular protraction/upward rotation",
      "trunk anti-extension."
    ],
    "primeMovers": [
      "Anterior deltoid",
      "serratus anterior",
      "triceps brachii",
      "pectoralis major."
    ],
    "assistingMuscles": [
      "Lower trapezius",
      "rotator cuff",
      "wrist/finger flexors",
      "rectus abdominis."
    ],
    "stabilizers": [
      "Transversus abdominis",
      "gluteus maximus",
      "pelvic stabilizers",
      "deep neck flexors."
    ],
    "contractionRoles": [
      "Reach is concentric, end-range line is isometric, and post-touch deceleration is eccentric."
    ],
    "commonForceOrSkillDemand": "Accurate terminal lengthening and body-line control under fatigue and changing breathing timing.",
    "recommendedExercisePatterns": [
      "landmine press",
      "triceps extension",
      "serratus wall slide",
      "hollow-body hold"
    ],
    "recommendedExercises": [
      "landmine press",
      "triceps extension",
      "serratus wall slide",
      "hollow-body hold"
    ],
    "transferRationale": "Pressing, triceps, serratus and anti-extension patterns overlap the terminal reach and alignment demands without reproducing aquatic timing.",
    "exerciseSelectionCautions": "Avoid rib flare and forced overhead range; prioritize smooth deceleration and shoulder comfort.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3438875/",
      "https://www.jssm.org/hf.php?id=jssm-13-223.xml",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9566274/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed swimming biomechanics and sports-medicine literature on stroke mechanics, shoulder/scapular loading, swim starts, turns, and underwater undulatory propulsion; evidence confidence is moderate because gym exercises provide mechanical overlap rather than direct proof of sport-performance causation."
  },
  {
    "id": "tennis-1",
    "sportId": "tennis",
    "label": "forehand",
    "movementFamily": "rotational striking",
    "bodyActions": [
      "Open or semi-open stance loads the outside leg, rotates pelvis and trunk, then accelerates the racquet into forehand contact."
    ],
    "jointActions": [
      "Hip and trunk transverse-plane rotation",
      "knee and ankle extension",
      "shoulder horizontal adduction and internal rotation",
      "elbow extension."
    ],
    "primeMovers": [
      "gluteus maximus",
      "internal oblique muscle",
      "external oblique muscle",
      "pectoralis major",
      "latissimus dorsi"
    ],
    "assistingMuscles": [
      "quadriceps femoris",
      "adductor muscle group",
      "anterior deltoid",
      "triceps brachii",
      "pronator teres"
    ],
    "stabilizers": [
      "gluteus medius",
      "transversus abdominis",
      "rotator cuff muscles",
      "serratus anterior",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Concentric propulsion during the strike, eccentric loading in preparation or braking, and isometric proximal bracing through contact."
    ],
    "commonForceOrSkillDemand": "Ground-reaction-force transfer from the support leg through pelvis and trunk to a high-velocity unilateral racquet strike.",
    "recommendedExercisePatterns": [
      "unilateral squat or split stance",
      "transverse-plane medicine-ball throw",
      "anti-rotation press"
    ],
    "recommendedExercises": [
      "front-foot-elevated split squat",
      "medicine-ball rotational throw",
      "Pallof press"
    ],
    "transferRationale": "These patterns overlap with unilateral loading, proximal-to-distal rotation, and trunk stiffness; they are preparatory strength proxies rather than technical substitutes.",
    "exerciseSelectionCautions": "Use loads that preserve tennis-like sequencing and shoulder control; do not infer that the exercise directly improves stroke performance or prevents injury.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC2577481/",
      "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0290320"
    ],
    "sourceSummary": "The records synthesize peer-reviewed tennis biomechanics and change-of-direction research plus strength-and-conditioning guidance, with moderate confidence for most movement-to-exercise transfer inferences and higher confidence for serve leg-drive mechanics; the file avoids unsupported direct EMG or causal performance claims."
  },
  {
    "id": "tennis-2",
    "sportId": "tennis",
    "label": "backhand",
    "movementFamily": "rotational striking",
    "bodyActions": [
      "Closed or neutral stance loads the legs and rotates the pelvis and trunk while the racquet travels across the body into backhand contact."
    ],
    "jointActions": [
      "Hip and trunk rotation",
      "knee extension",
      "shoulder horizontal abduction/adduction depending on one- or two-handed technique",
      "elbow extension",
      "wrist stabilization."
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps femoris",
      "external oblique muscle",
      "internal oblique muscle",
      "posterior deltoid"
    ],
    "assistingMuscles": [
      "adductor muscle group",
      "latissimus dorsi",
      "pectoralis major",
      "triceps brachii",
      "forearm extensor muscles"
    ],
    "stabilizers": [
      "gluteus medius",
      "rotator cuff muscles",
      "serratus anterior",
      "transversus abdominis",
      "ankle-foot stabilizers"
    ],
    "contractionRoles": [
      "Eccentric leg and trunk loading, concentric rotational and pushing/pulling action, and isometric racquet control at contact."
    ],
    "commonForceOrSkillDemand": "Rapid rotational force transfer with a stable base and controlled racquet-face orientation.",
    "recommendedExercisePatterns": [
      "split-stance push-pull",
      "rotational throw",
      "single-leg balance"
    ],
    "recommendedExercises": [
      "split-stance cable press",
      "medicine-ball rotational throw",
      "single-leg Romanian deadlift"
    ],
    "transferRationale": "The selected patterns train leg-to-trunk force transfer and unilateral balance shared by a backhand, without claiming identical muscle activation.",
    "exerciseSelectionCautions": "Use loads that preserve tennis-like sequencing and shoulder control; do not infer that the exercise directly improves stroke performance or prevents injury.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC2577481/",
      "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0290320"
    ],
    "sourceSummary": "The records synthesize peer-reviewed tennis biomechanics and change-of-direction research plus strength-and-conditioning guidance, with moderate confidence for most movement-to-exercise transfer inferences and higher confidence for serve leg-drive mechanics; the file avoids unsupported direct EMG or causal performance claims."
  },
  {
    "id": "tennis-3",
    "sportId": "tennis",
    "label": "serve",
    "movementFamily": "overhead propulsion",
    "bodyActions": [
      "Leg drive and trunk coil elevate the body while the hitting arm reaches, accelerates, and pronates into contact."
    ],
    "jointActions": [
      "Ankle, knee and hip extension",
      "trunk extension/rotation",
      "shoulder abduction and internal rotation",
      "elbow extension",
      "forearm pronation."
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus maximus",
      "internal oblique muscle",
      "pectoralis major",
      "latissimus dorsi"
    ],
    "assistingMuscles": [
      "hamstring muscle group",
      "gastrocnemius",
      "anterior deltoid",
      "triceps brachii",
      "pronator teres"
    ],
    "stabilizers": [
      "rotator cuff muscles",
      "serratus anterior",
      "transversus abdominis",
      "gluteus medius",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Eccentric preparation or braking, concentric propulsion or racquet acceleration, and isometric control at contact or during repositioning."
    ],
    "commonForceOrSkillDemand": "Rapid force production or absorption in the stated direction while preserving balance, timing, and racquet control.",
    "recommendedExercisePatterns": [
      "unilateral lower-body strength",
      "trunk anti-rotation or rotation",
      "elastic or directional footwork"
    ],
    "recommendedExercises": [
      "split squat",
      "medicine-ball rotational throw",
      "Pallof press"
    ],
    "transferRationale": "The patterns share broad force vectors, unilateral control, or trunk/shoulder demands with the movement; they do not reproduce perception, timing, racquet technique, or opponent interaction.",
    "exerciseSelectionCautions": "Use loads that preserve tennis-like sequencing and shoulder control; do not infer that the exercise directly improves stroke performance or prevents injury.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC2577481/",
      "https://journals.lww.com/nsca-scj/fulltext/2009/08000/biomechanics_of_the_tennis_serve__implications_for.4.aspx"
    ],
    "sourceSummary": "The records synthesize peer-reviewed tennis biomechanics and change-of-direction research plus strength-and-conditioning guidance, with moderate confidence for most movement-to-exercise transfer inferences and higher confidence for serve leg-drive mechanics; the file avoids unsupported direct EMG or causal performance claims."
  },
  {
    "id": "tennis-4",
    "sportId": "tennis",
    "label": "overhead smash",
    "movementFamily": "overhead propulsion",
    "bodyActions": [
      "Rapid preparation, leg-supported elevation, trunk rotation, and high point overhead racquet acceleration."
    ],
    "jointActions": [
      "Hip/knee/ankle extension",
      "trunk rotation",
      "shoulder flexion and internal rotation",
      "elbow extension",
      "forearm pronation."
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps femoris",
      "pectoralis major",
      "latissimus dorsi",
      "internal oblique muscle"
    ],
    "assistingMuscles": [
      "gastrocnemius",
      "anterior deltoid",
      "triceps brachii",
      "serratus anterior",
      "pronator teres"
    ],
    "stabilizers": [
      "rotator cuff muscles",
      "transversus abdominis",
      "gluteus medius",
      "ankle-foot stabilizers"
    ],
    "contractionRoles": [
      "Eccentric preparation or braking, concentric propulsion or racquet acceleration, and isometric control at contact or during repositioning."
    ],
    "commonForceOrSkillDemand": "Rapid force production or absorption in the stated direction while preserving balance, timing, and racquet control.",
    "recommendedExercisePatterns": [
      "unilateral lower-body strength",
      "trunk anti-rotation or rotation",
      "elastic or directional footwork"
    ],
    "recommendedExercises": [
      "split squat",
      "medicine-ball rotational throw",
      "Pallof press"
    ],
    "transferRationale": "The patterns share broad force vectors, unilateral control, or trunk/shoulder demands with the movement; they do not reproduce perception, timing, racquet technique, or opponent interaction.",
    "exerciseSelectionCautions": "Use loads that preserve tennis-like sequencing and shoulder control; do not infer that the exercise directly improves stroke performance or prevents injury.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC2577481/",
      "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0290320"
    ],
    "sourceSummary": "The records synthesize peer-reviewed tennis biomechanics and change-of-direction research plus strength-and-conditioning guidance, with moderate confidence for most movement-to-exercise transfer inferences and higher confidence for serve leg-drive mechanics; the file avoids unsupported direct EMG or causal performance claims."
  },
  {
    "id": "tennis-5",
    "sportId": "tennis",
    "label": "volley",
    "movementFamily": "compact push and reactive stance",
    "bodyActions": [
      "Short preparation from a balanced stance with a compact racquet push and immediate recovery."
    ],
    "jointActions": [
      "Hip/knee flexion-extension",
      "shoulder horizontal adduction",
      "elbow extension",
      "wrist stabilization."
    ],
    "primeMovers": [
      "quadriceps femoris",
      "pectoralis major",
      "anterior deltoid",
      "triceps brachii"
    ],
    "assistingMuscles": [
      "gluteus maximus",
      "serratus anterior",
      "forearm flexor muscles",
      "forearm extensor muscles"
    ],
    "stabilizers": [
      "gluteus medius",
      "rotator cuff muscles",
      "transversus abdominis",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Eccentric preparation or braking, concentric propulsion or racquet acceleration, and isometric control at contact or during repositioning."
    ],
    "commonForceOrSkillDemand": "Rapid force production or absorption in the stated direction while preserving balance, timing, and racquet control.",
    "recommendedExercisePatterns": [
      "unilateral lower-body strength",
      "trunk anti-rotation or rotation",
      "elastic or directional footwork"
    ],
    "recommendedExercises": [
      "split squat",
      "medicine-ball rotational throw",
      "Pallof press"
    ],
    "transferRationale": "The patterns share broad force vectors, unilateral control, or trunk/shoulder demands with the movement; they do not reproduce perception, timing, racquet technique, or opponent interaction.",
    "exerciseSelectionCautions": "Use loads that preserve tennis-like sequencing and shoulder control; do not infer that the exercise directly improves stroke performance or prevents injury.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC2577481/",
      "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0290320"
    ],
    "sourceSummary": "The records synthesize peer-reviewed tennis biomechanics and change-of-direction research plus strength-and-conditioning guidance, with moderate confidence for most movement-to-exercise transfer inferences and higher confidence for serve leg-drive mechanics; the file avoids unsupported direct EMG or causal performance claims."
  },
  {
    "id": "tennis-6",
    "sportId": "tennis",
    "label": "backhand volley",
    "movementFamily": "compact push and reactive stance",
    "bodyActions": [
      "Low compact stance supports a short backhand-side block and rapid repositioning."
    ],
    "jointActions": [
      "Knee and hip flexion",
      "shoulder horizontal abduction/adduction",
      "elbow extension",
      "forearm stabilization."
    ],
    "primeMovers": [
      "quadriceps femoris",
      "posterior deltoid",
      "triceps brachii",
      "pectoralis major"
    ],
    "assistingMuscles": [
      "gluteus maximus",
      "serratus anterior",
      "forearm extensor muscles",
      "adductor muscle group"
    ],
    "stabilizers": [
      "gluteus medius",
      "rotator cuff muscles",
      "transversus abdominis",
      "ankle-foot stabilizers"
    ],
    "contractionRoles": [
      "Eccentric preparation or braking, concentric propulsion or racquet acceleration, and isometric control at contact or during repositioning."
    ],
    "commonForceOrSkillDemand": "Rapid force production or absorption in the stated direction while preserving balance, timing, and racquet control.",
    "recommendedExercisePatterns": [
      "unilateral lower-body strength",
      "trunk anti-rotation or rotation",
      "elastic or directional footwork"
    ],
    "recommendedExercises": [
      "split squat",
      "medicine-ball rotational throw",
      "Pallof press"
    ],
    "transferRationale": "The patterns share broad force vectors, unilateral control, or trunk/shoulder demands with the movement; they do not reproduce perception, timing, racquet technique, or opponent interaction.",
    "exerciseSelectionCautions": "Use loads that preserve tennis-like sequencing and shoulder control; do not infer that the exercise directly improves stroke performance or prevents injury.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC2577481/",
      "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0290320"
    ],
    "sourceSummary": "The records synthesize peer-reviewed tennis biomechanics and change-of-direction research plus strength-and-conditioning guidance, with moderate confidence for most movement-to-exercise transfer inferences and higher confidence for serve leg-drive mechanics; the file avoids unsupported direct EMG or causal performance claims."
  },
  {
    "id": "tennis-7",
    "sportId": "tennis",
    "label": "slice",
    "movementFamily": "controlled rotational striking",
    "bodyActions": [
      "A forward step and racquet path produce a controlled underspin stroke with a low center of mass."
    ],
    "jointActions": [
      "Hip/knee flexion and extension",
      "trunk rotation",
      "shoulder extension/horizontal adduction",
      "elbow extension",
      "wrist stabilization."
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus maximus",
      "posterior deltoid",
      "latissimus dorsi"
    ],
    "assistingMuscles": [
      "hamstring muscle group",
      "external oblique muscle",
      "triceps brachii",
      "forearm extensor muscles"
    ],
    "stabilizers": [
      "gluteus medius",
      "rotator cuff muscles",
      "transversus abdominis",
      "adductor muscle group"
    ],
    "contractionRoles": [
      "Eccentric preparation or braking, concentric propulsion or racquet acceleration, and isometric control at contact or during repositioning."
    ],
    "commonForceOrSkillDemand": "Rapid force production or absorption in the stated direction while preserving balance, timing, and racquet control.",
    "recommendedExercisePatterns": [
      "unilateral lower-body strength",
      "trunk anti-rotation or rotation",
      "elastic or directional footwork"
    ],
    "recommendedExercises": [
      "split squat",
      "medicine-ball rotational throw",
      "Pallof press"
    ],
    "transferRationale": "The patterns share broad force vectors, unilateral control, or trunk/shoulder demands with the movement; they do not reproduce perception, timing, racquet technique, or opponent interaction.",
    "exerciseSelectionCautions": "Use loads that preserve tennis-like sequencing and shoulder control; do not infer that the exercise directly improves stroke performance or prevents injury.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC2577481/",
      "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0290320"
    ],
    "sourceSummary": "The records synthesize peer-reviewed tennis biomechanics and change-of-direction research plus strength-and-conditioning guidance, with moderate confidence for most movement-to-exercise transfer inferences and higher confidence for serve leg-drive mechanics; the file avoids unsupported direct EMG or causal performance claims."
  },
  {
    "id": "tennis-8",
    "sportId": "tennis",
    "label": "topspin drive",
    "movementFamily": "rotational striking",
    "bodyActions": [
      "Leg loading and pelvic-trunk rotation combine with upward racquet acceleration and forearm pronation."
    ],
    "jointActions": [
      "Hip/knee extension",
      "trunk rotation",
      "shoulder internal rotation",
      "elbow extension",
      "forearm pronation."
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps femoris",
      "internal oblique muscle",
      "pectoralis major",
      "latissimus dorsi"
    ],
    "assistingMuscles": [
      "hamstring muscle group",
      "anterior deltoid",
      "triceps brachii",
      "pronator teres"
    ],
    "stabilizers": [
      "gluteus medius",
      "rotator cuff muscles",
      "serratus anterior",
      "transversus abdominis"
    ],
    "contractionRoles": [
      "Eccentric preparation or braking, concentric propulsion or racquet acceleration, and isometric control at contact or during repositioning."
    ],
    "commonForceOrSkillDemand": "Rapid force production or absorption in the stated direction while preserving balance, timing, and racquet control.",
    "recommendedExercisePatterns": [
      "unilateral lower-body strength",
      "trunk anti-rotation or rotation",
      "elastic or directional footwork"
    ],
    "recommendedExercises": [
      "split squat",
      "medicine-ball rotational throw",
      "Pallof press"
    ],
    "transferRationale": "The patterns share broad force vectors, unilateral control, or trunk/shoulder demands with the movement; they do not reproduce perception, timing, racquet technique, or opponent interaction.",
    "exerciseSelectionCautions": "Use loads that preserve tennis-like sequencing and shoulder control; do not infer that the exercise directly improves stroke performance or prevents injury.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC2577481/",
      "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0290320"
    ],
    "sourceSummary": "The records synthesize peer-reviewed tennis biomechanics and change-of-direction research plus strength-and-conditioning guidance, with moderate confidence for most movement-to-exercise transfer inferences and higher confidence for serve leg-drive mechanics; the file avoids unsupported direct EMG or causal performance claims."
  },
  {
    "id": "tennis-9",
    "sportId": "tennis",
    "label": "lateral shuffle",
    "movementFamily": "lateral locomotion and change of direction",
    "bodyActions": [
      "Repeated side steps reposition the pelvis while the trunk remains available for the next shot."
    ],
    "jointActions": [
      "Hip abduction/adduction",
      "knee flexion-extension",
      "ankle eversion/inversion and plantarflexion."
    ],
    "primeMovers": [
      "gluteus medius",
      "quadriceps femoris",
      "adductor muscle group"
    ],
    "assistingMuscles": [
      "gluteus maximus",
      "hamstring muscle group",
      "gastrocnemius",
      "soleus"
    ],
    "stabilizers": [
      "transversus abdominis",
      "hip external rotators",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Eccentric preparation or braking, concentric propulsion or racquet acceleration, and isometric control at contact or during repositioning."
    ],
    "commonForceOrSkillDemand": "Rapid force production or absorption in the stated direction while preserving balance, timing, and racquet control.",
    "recommendedExercisePatterns": [
      "unilateral lower-body strength",
      "trunk anti-rotation or rotation",
      "elastic or directional footwork"
    ],
    "recommendedExercises": [
      "split squat",
      "medicine-ball rotational throw",
      "Pallof press"
    ],
    "transferRationale": "The patterns share broad force vectors, unilateral control, or trunk/shoulder demands with the movement; they do not reproduce perception, timing, racquet technique, or opponent interaction.",
    "exerciseSelectionCautions": "Use loads that preserve tennis-like sequencing and shoulder control; do not infer that the exercise directly improves stroke performance or prevents injury.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10009273/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC5304280/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed tennis biomechanics and change-of-direction research plus strength-and-conditioning guidance, with moderate confidence for most movement-to-exercise transfer inferences and higher confidence for serve leg-drive mechanics; the file avoids unsupported direct EMG or causal performance claims."
  },
  {
    "id": "tennis-10",
    "sportId": "tennis",
    "label": "split step",
    "movementFamily": "compact push and reactive stance",
    "bodyActions": [
      "Brief countermovement and elastic landing create a neutral base for the next directional push."
    ],
    "jointActions": [
      "Ankle, knee and hip flexion-extension",
      "foot stiffness",
      "trunk stabilization."
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus maximus",
      "gastrocnemius",
      "soleus"
    ],
    "assistingMuscles": [
      "hamstring muscle group",
      "gluteus medius",
      "adductor muscle group"
    ],
    "stabilizers": [
      "intrinsic foot muscles",
      "transversus abdominis",
      "hip external rotators"
    ],
    "contractionRoles": [
      "Eccentric preparation or braking, concentric propulsion or racquet acceleration, and isometric control at contact or during repositioning."
    ],
    "commonForceOrSkillDemand": "Rapid force production or absorption in the stated direction while preserving balance, timing, and racquet control.",
    "recommendedExercisePatterns": [
      "unilateral lower-body strength",
      "trunk anti-rotation or rotation",
      "elastic or directional footwork"
    ],
    "recommendedExercises": [
      "split squat",
      "medicine-ball rotational throw",
      "Pallof press"
    ],
    "transferRationale": "The patterns share broad force vectors, unilateral control, or trunk/shoulder demands with the movement; they do not reproduce perception, timing, racquet technique, or opponent interaction.",
    "exerciseSelectionCautions": "Use loads that preserve tennis-like sequencing and shoulder control; do not infer that the exercise directly improves stroke performance or prevents injury.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC5304280/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10009273/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed tennis biomechanics and change-of-direction research plus strength-and-conditioning guidance, with moderate confidence for most movement-to-exercise transfer inferences and higher confidence for serve leg-drive mechanics; the file avoids unsupported direct EMG or causal performance claims."
  },
  {
    "id": "tennis-11",
    "sportId": "tennis",
    "label": "crossover recovery",
    "movementFamily": "lateral locomotion and change of direction",
    "bodyActions": [
      "Crossover steps redirect the pelvis and center of mass toward court recovery after a wide stroke."
    ],
    "jointActions": [
      "Hip flexion/extension and rotation",
      "knee flexion-extension",
      "ankle push-off",
      "trunk rotation."
    ],
    "primeMovers": [
      "gluteus medius",
      "gluteus maximus",
      "quadriceps femoris",
      "adductor muscle group"
    ],
    "assistingMuscles": [
      "hamstring muscle group",
      "gastrocnemius",
      "external oblique muscle"
    ],
    "stabilizers": [
      "transversus abdominis",
      "hip external rotators",
      "ankle-foot stabilizers"
    ],
    "contractionRoles": [
      "Eccentric preparation or braking, concentric propulsion or racquet acceleration, and isometric control at contact or during repositioning."
    ],
    "commonForceOrSkillDemand": "Rapid force production or absorption in the stated direction while preserving balance, timing, and racquet control.",
    "recommendedExercisePatterns": [
      "unilateral lower-body strength",
      "trunk anti-rotation or rotation",
      "elastic or directional footwork"
    ],
    "recommendedExercises": [
      "split squat",
      "medicine-ball rotational throw",
      "Pallof press"
    ],
    "transferRationale": "The patterns share broad force vectors, unilateral control, or trunk/shoulder demands with the movement; they do not reproduce perception, timing, racquet technique, or opponent interaction.",
    "exerciseSelectionCautions": "Use loads that preserve tennis-like sequencing and shoulder control; do not infer that the exercise directly improves stroke performance or prevents injury.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10009273/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC5304280/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed tennis biomechanics and change-of-direction research plus strength-and-conditioning guidance, with moderate confidence for most movement-to-exercise transfer inferences and higher confidence for serve leg-drive mechanics; the file avoids unsupported direct EMG or causal performance claims."
  },
  {
    "id": "tennis-12",
    "sportId": "tennis",
    "label": "forward acceleration",
    "movementFamily": "linear acceleration and braking",
    "bodyActions": [
      "Forward projection uses aggressive backward-directed ground force and coordinated arm action."
    ],
    "jointActions": [
      "Hip, knee and ankle extension",
      "trunk inclination",
      "shoulder counter-swing."
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps femoris",
      "hamstring muscle group",
      "gastrocnemius"
    ],
    "assistingMuscles": [
      "soleus",
      "gluteus medius",
      "adductor muscle group"
    ],
    "stabilizers": [
      "transversus abdominis",
      "intrinsic foot muscles",
      "hip external rotators"
    ],
    "contractionRoles": [
      "Eccentric preparation or braking, concentric propulsion or racquet acceleration, and isometric control at contact or during repositioning."
    ],
    "commonForceOrSkillDemand": "Rapid force production or absorption in the stated direction while preserving balance, timing, and racquet control.",
    "recommendedExercisePatterns": [
      "unilateral lower-body strength",
      "trunk anti-rotation or rotation",
      "elastic or directional footwork"
    ],
    "recommendedExercises": [
      "split squat",
      "medicine-ball rotational throw",
      "Pallof press"
    ],
    "transferRationale": "The patterns share broad force vectors, unilateral control, or trunk/shoulder demands with the movement; they do not reproduce perception, timing, racquet technique, or opponent interaction.",
    "exerciseSelectionCautions": "Use loads that preserve tennis-like sequencing and shoulder control; do not infer that the exercise directly improves stroke performance or prevents injury.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10009273/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed tennis biomechanics and change-of-direction research plus strength-and-conditioning guidance, with moderate confidence for most movement-to-exercise transfer inferences and higher confidence for serve leg-drive mechanics; the file avoids unsupported direct EMG or causal performance claims."
  },
  {
    "id": "tennis-13",
    "sportId": "tennis",
    "label": "deceleration",
    "movementFamily": "linear acceleration and braking",
    "bodyActions": [
      "The athlete lowers the center of mass and absorbs horizontal momentum before the next action."
    ],
    "jointActions": [
      "Hip and knee flexion",
      "ankle dorsiflexion",
      "trunk control",
      "eccentric braking."
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus maximus",
      "hamstring muscle group"
    ],
    "assistingMuscles": [
      "soleus",
      "gastrocnemius",
      "gluteus medius",
      "adductor muscle group"
    ],
    "stabilizers": [
      "transversus abdominis",
      "hip external rotators",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Eccentric preparation or braking, concentric propulsion or racquet acceleration, and isometric control at contact or during repositioning."
    ],
    "commonForceOrSkillDemand": "Rapid force production or absorption in the stated direction while preserving balance, timing, and racquet control.",
    "recommendedExercisePatterns": [
      "unilateral lower-body strength",
      "trunk anti-rotation or rotation",
      "elastic or directional footwork"
    ],
    "recommendedExercises": [
      "split squat",
      "medicine-ball rotational throw",
      "Pallof press"
    ],
    "transferRationale": "The patterns share broad force vectors, unilateral control, or trunk/shoulder demands with the movement; they do not reproduce perception, timing, racquet technique, or opponent interaction.",
    "exerciseSelectionCautions": "Use loads that preserve tennis-like sequencing and shoulder control; do not infer that the exercise directly improves stroke performance or prevents injury.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://journals.lww.com/nsca-scj/fulltext/2008/12000/Efficient_Deceleration__The_Forgotten_Factor_in.9.aspx",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10009273/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed tennis biomechanics and change-of-direction research plus strength-and-conditioning guidance, with moderate confidence for most movement-to-exercise transfer inferences and higher confidence for serve leg-drive mechanics; the file avoids unsupported direct EMG or causal performance claims."
  },
  {
    "id": "tennis-14",
    "sportId": "tennis",
    "label": "open-stance rotation",
    "movementFamily": "rotational striking",
    "bodyActions": [
      "Outside-leg loading permits pelvis and trunk rotation without requiring a full step across the body."
    ],
    "jointActions": [
      "Hip internal/external rotation",
      "knee flexion-extension",
      "trunk rotation",
      "shoulder rotation."
    ],
    "primeMovers": [
      "gluteus maximus",
      "external oblique muscle",
      "internal oblique muscle",
      "quadriceps femoris"
    ],
    "assistingMuscles": [
      "adductor muscle group",
      "latissimus dorsi",
      "pectoralis major",
      "anterior deltoid"
    ],
    "stabilizers": [
      "gluteus medius",
      "rotator cuff muscles",
      "transversus abdominis",
      "ankle-foot stabilizers"
    ],
    "contractionRoles": [
      "Eccentric preparation or braking, concentric propulsion or racquet acceleration, and isometric control at contact or during repositioning."
    ],
    "commonForceOrSkillDemand": "Rapid force production or absorption in the stated direction while preserving balance, timing, and racquet control.",
    "recommendedExercisePatterns": [
      "unilateral lower-body strength",
      "trunk anti-rotation or rotation",
      "elastic or directional footwork"
    ],
    "recommendedExercises": [
      "split squat",
      "medicine-ball rotational throw",
      "Pallof press"
    ],
    "transferRationale": "The patterns share broad force vectors, unilateral control, or trunk/shoulder demands with the movement; they do not reproduce perception, timing, racquet technique, or opponent interaction.",
    "exerciseSelectionCautions": "Use loads that preserve tennis-like sequencing and shoulder control; do not infer that the exercise directly improves stroke performance or prevents injury.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC2577481/",
      "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0290320"
    ],
    "sourceSummary": "The records synthesize peer-reviewed tennis biomechanics and change-of-direction research plus strength-and-conditioning guidance, with moderate confidence for most movement-to-exercise transfer inferences and higher confidence for serve leg-drive mechanics; the file avoids unsupported direct EMG or causal performance claims."
  },
  {
    "id": "tennis-15",
    "sportId": "tennis",
    "label": "closed-stance drive",
    "movementFamily": "rotational striking",
    "bodyActions": [
      "Forward or diagonal step loads the front leg, then transfers force through pelvis, trunk, and racquet."
    ],
    "jointActions": [
      "Hip/knee extension",
      "trunk rotation",
      "shoulder horizontal adduction",
      "elbow extension."
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus maximus",
      "internal oblique muscle",
      "pectoralis major"
    ],
    "assistingMuscles": [
      "hamstring muscle group",
      "adductor muscle group",
      "latissimus dorsi",
      "triceps brachii"
    ],
    "stabilizers": [
      "gluteus medius",
      "rotator cuff muscles",
      "transversus abdominis",
      "ankle-foot stabilizers"
    ],
    "contractionRoles": [
      "Eccentric preparation or braking, concentric propulsion or racquet acceleration, and isometric control at contact or during repositioning."
    ],
    "commonForceOrSkillDemand": "Rapid force production or absorption in the stated direction while preserving balance, timing, and racquet control.",
    "recommendedExercisePatterns": [
      "unilateral lower-body strength",
      "trunk anti-rotation or rotation",
      "elastic or directional footwork"
    ],
    "recommendedExercises": [
      "split squat",
      "medicine-ball rotational throw",
      "Pallof press"
    ],
    "transferRationale": "The patterns share broad force vectors, unilateral control, or trunk/shoulder demands with the movement; they do not reproduce perception, timing, racquet technique, or opponent interaction.",
    "exerciseSelectionCautions": "Use loads that preserve tennis-like sequencing and shoulder control; do not infer that the exercise directly improves stroke performance or prevents injury.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC2577481/",
      "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0290320"
    ],
    "sourceSummary": "The records synthesize peer-reviewed tennis biomechanics and change-of-direction research plus strength-and-conditioning guidance, with moderate confidence for most movement-to-exercise transfer inferences and higher confidence for serve leg-drive mechanics; the file avoids unsupported direct EMG or causal performance claims."
  },
  {
    "id": "tennis-16",
    "sportId": "tennis",
    "label": "serve leg drive",
    "movementFamily": "vertical propulsion",
    "bodyActions": [
      "Countermovement and triple extension elevate the hitting shoulder and body into the serve."
    ],
    "jointActions": [
      "Ankle, knee and hip extension",
      "trunk extension",
      "foot-ground force application."
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus maximus",
      "gastrocnemius",
      "soleus"
    ],
    "assistingMuscles": [
      "hamstring muscle group",
      "gluteus medius",
      "adductor muscle group"
    ],
    "stabilizers": [
      "transversus abdominis",
      "intrinsic foot muscles",
      "hip external rotators"
    ],
    "contractionRoles": [
      "Eccentric preparation or braking, concentric propulsion or racquet acceleration, and isometric control at contact or during repositioning."
    ],
    "commonForceOrSkillDemand": "Rapid force production or absorption in the stated direction while preserving balance, timing, and racquet control.",
    "recommendedExercisePatterns": [
      "unilateral lower-body strength",
      "trunk anti-rotation or rotation",
      "elastic or directional footwork"
    ],
    "recommendedExercises": [
      "split squat",
      "medicine-ball rotational throw",
      "Pallof press"
    ],
    "transferRationale": "The patterns share broad force vectors, unilateral control, or trunk/shoulder demands with the movement; they do not reproduce perception, timing, racquet technique, or opponent interaction.",
    "exerciseSelectionCautions": "Use loads that preserve tennis-like sequencing and shoulder control; do not infer that the exercise directly improves stroke performance or prevents injury.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC2577481/",
      "https://journals.lww.com/nsca-scj/fulltext/2009/08000/biomechanics_of_the_tennis_serve__implications_for.4.aspx"
    ],
    "sourceSummary": "The records synthesize peer-reviewed tennis biomechanics and change-of-direction research plus strength-and-conditioning guidance, with moderate confidence for most movement-to-exercise transfer inferences and higher confidence for serve leg-drive mechanics; the file avoids unsupported direct EMG or causal performance claims."
  },
  {
    "id": "tennis-17",
    "sportId": "tennis",
    "label": "jumping forehand",
    "movementFamily": "plyometric rotational striking",
    "bodyActions": [
      "Approach and takeoff create airborne rotation, racquet acceleration, and landing absorption."
    ],
    "jointActions": [
      "Hip/knee/ankle extension",
      "trunk rotation",
      "shoulder internal rotation",
      "eccentric landing flexion."
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus maximus",
      "gastrocnemius",
      "external oblique muscle",
      "pectoralis major"
    ],
    "assistingMuscles": [
      "hamstring muscle group",
      "latissimus dorsi",
      "triceps brachii",
      "anterior deltoid"
    ],
    "stabilizers": [
      "rotator cuff muscles",
      "serratus anterior",
      "gluteus medius",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Eccentric preparation or braking, concentric propulsion or racquet acceleration, and isometric control at contact or during repositioning."
    ],
    "commonForceOrSkillDemand": "Rapid force production or absorption in the stated direction while preserving balance, timing, and racquet control.",
    "recommendedExercisePatterns": [
      "unilateral lower-body strength",
      "trunk anti-rotation or rotation",
      "elastic or directional footwork"
    ],
    "recommendedExercises": [
      "split squat",
      "medicine-ball rotational throw",
      "Pallof press"
    ],
    "transferRationale": "The patterns share broad force vectors, unilateral control, or trunk/shoulder demands with the movement; they do not reproduce perception, timing, racquet technique, or opponent interaction.",
    "exerciseSelectionCautions": "Use loads that preserve tennis-like sequencing and shoulder control; do not infer that the exercise directly improves stroke performance or prevents injury.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC2577481/",
      "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0290320"
    ],
    "sourceSummary": "The records synthesize peer-reviewed tennis biomechanics and change-of-direction research plus strength-and-conditioning guidance, with moderate confidence for most movement-to-exercise transfer inferences and higher confidence for serve leg-drive mechanics; the file avoids unsupported direct EMG or causal performance claims."
  },
  {
    "id": "tennis-18",
    "sportId": "tennis",
    "label": "drop-shot reach",
    "movementFamily": "low-center-of-mass reach",
    "bodyActions": [
      "Forward or lateral lowering permits precise racquet placement while preserving balance and recovery capacity."
    ],
    "jointActions": [
      "Hip/knee flexion",
      "ankle dorsiflexion",
      "trunk inclination",
      "shoulder positioning",
      "wrist stabilization."
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus maximus",
      "hamstring muscle group"
    ],
    "assistingMuscles": [
      "gastrocnemius",
      "adductor muscle group",
      "anterior deltoid",
      "forearm flexor muscles"
    ],
    "stabilizers": [
      "gluteus medius",
      "transversus abdominis",
      "rotator cuff muscles",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Eccentric preparation or braking, concentric propulsion or racquet acceleration, and isometric control at contact or during repositioning."
    ],
    "commonForceOrSkillDemand": "Rapid force production or absorption in the stated direction while preserving balance, timing, and racquet control.",
    "recommendedExercisePatterns": [
      "unilateral lower-body strength",
      "trunk anti-rotation or rotation",
      "elastic or directional footwork"
    ],
    "recommendedExercises": [
      "split squat",
      "medicine-ball rotational throw",
      "Pallof press"
    ],
    "transferRationale": "The patterns share broad force vectors, unilateral control, or trunk/shoulder demands with the movement; they do not reproduce perception, timing, racquet technique, or opponent interaction.",
    "exerciseSelectionCautions": "Use loads that preserve tennis-like sequencing and shoulder control; do not infer that the exercise directly improves stroke performance or prevents injury.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC2577481/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10009273/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed tennis biomechanics and change-of-direction research plus strength-and-conditioning guidance, with moderate confidence for most movement-to-exercise transfer inferences and higher confidence for serve leg-drive mechanics; the file avoids unsupported direct EMG or causal performance claims."
  },
  {
    "id": "tennis-19",
    "sportId": "tennis",
    "label": "wide-ball lunge",
    "movementFamily": "lateral locomotion and change of direction",
    "bodyActions": [
      "A deep lateral or diagonal step absorbs momentum, stabilizes the racket side, and initiates push-off."
    ],
    "jointActions": [
      "Hip abduction/adduction and flexion",
      "knee flexion-extension",
      "ankle dorsiflexion/plantarflexion."
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus maximus",
      "adductor muscle group",
      "gluteus medius"
    ],
    "assistingMuscles": [
      "hamstring muscle group",
      "gastrocnemius",
      "soleus"
    ],
    "stabilizers": [
      "transversus abdominis",
      "hip external rotators",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Eccentric preparation or braking, concentric propulsion or racquet acceleration, and isometric control at contact or during repositioning."
    ],
    "commonForceOrSkillDemand": "Rapid force production or absorption in the stated direction while preserving balance, timing, and racquet control.",
    "recommendedExercisePatterns": [
      "unilateral lower-body strength",
      "trunk anti-rotation or rotation",
      "elastic or directional footwork"
    ],
    "recommendedExercises": [
      "split squat",
      "medicine-ball rotational throw",
      "Pallof press"
    ],
    "transferRationale": "The patterns share broad force vectors, unilateral control, or trunk/shoulder demands with the movement; they do not reproduce perception, timing, racquet technique, or opponent interaction.",
    "exerciseSelectionCautions": "Use loads that preserve tennis-like sequencing and shoulder control; do not infer that the exercise directly improves stroke performance or prevents injury.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10009273/",
      "https://journals.lww.com/nsca-scj/fulltext/2008/12000/Efficient_Deceleration__The_Forgotten_Factor_in.9.aspx"
    ],
    "sourceSummary": "The records synthesize peer-reviewed tennis biomechanics and change-of-direction research plus strength-and-conditioning guidance, with moderate confidence for most movement-to-exercise transfer inferences and higher confidence for serve leg-drive mechanics; the file avoids unsupported direct EMG or causal performance claims."
  },
  {
    "id": "tennis-20",
    "sportId": "tennis",
    "label": "rotational recovery",
    "movementFamily": "rotational change of direction",
    "bodyActions": [
      "Braking is followed by pelvic-trunk reorientation, crossover or shuffle steps, and renewed acceleration."
    ],
    "jointActions": [
      "Hip rotation and extension",
      "knee flexion-extension",
      "ankle push-off",
      "trunk rotation."
    ],
    "primeMovers": [
      "gluteus medius",
      "gluteus maximus",
      "quadriceps femoris",
      "external oblique muscle"
    ],
    "assistingMuscles": [
      "hamstring muscle group",
      "adductor muscle group",
      "gastrocnemius",
      "soleus"
    ],
    "stabilizers": [
      "transversus abdominis",
      "hip external rotators",
      "ankle-foot stabilizers"
    ],
    "contractionRoles": [
      "Eccentric preparation or braking, concentric propulsion or racquet acceleration, and isometric control at contact or during repositioning."
    ],
    "commonForceOrSkillDemand": "Rapid force production or absorption in the stated direction while preserving balance, timing, and racquet control.",
    "recommendedExercisePatterns": [
      "unilateral lower-body strength",
      "trunk anti-rotation or rotation",
      "elastic or directional footwork"
    ],
    "recommendedExercises": [
      "split squat",
      "medicine-ball rotational throw",
      "Pallof press"
    ],
    "transferRationale": "The patterns share broad force vectors, unilateral control, or trunk/shoulder demands with the movement; they do not reproduce perception, timing, racquet technique, or opponent interaction.",
    "exerciseSelectionCautions": "Use loads that preserve tennis-like sequencing and shoulder control; do not infer that the exercise directly improves stroke performance or prevents injury.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10009273/",
      "https://journals.lww.com/nsca-scj/fulltext/2008/12000/Efficient_Deceleration__The_Forgotten_Factor_in.9.aspx"
    ],
    "sourceSummary": "The records synthesize peer-reviewed tennis biomechanics and change-of-direction research plus strength-and-conditioning guidance, with moderate confidence for most movement-to-exercise transfer inferences and higher confidence for serve leg-drive mechanics; the file avoids unsupported direct EMG or causal performance claims."
  },
  {
    "id": "volleyball-1",
    "sportId": "volleyball",
    "label": "approach jump",
    "movementFamily": "vertical jump and landing",
    "bodyActions": [
      "Penultimate-step braking, bilateral countermovement, arm swing, and rapid takeoff."
    ],
    "jointActions": [
      "Hip/knee/ankle flexion-extension",
      "ankle plantarflexion",
      "shoulder extension-to-flexion."
    ],
    "primeMovers": [
      "Gluteus maximus, quadriceps femoris, hamstrings, triceps surae"
    ],
    "assistingMuscles": [
      "Gluteus medius, iliopsoas, anterior deltoid, erector spinae"
    ],
    "stabilizers": [
      "Transversus abdominis, obliques, deep hip rotators, intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Eccentric dip and penultimate-step braking",
      "concentric triple extension",
      "isometric trunk alignment",
      "eccentric landing."
    ],
    "commonForceOrSkillDemand": "High rate of force development, horizontal-to-vertical impulse, repeated maximal jumps.",
    "recommendedExercisePatterns": [
      "power jump and triple-extension patterns"
    ],
    "recommendedExercises": [
      "Countermovement jumps",
      "Loaded jump squats",
      "Barbell back squats",
      "Hang power cleans"
    ],
    "transferRationale": "Squat/jump and triple-extension patterns share lower-limb impulse demands, while landing practice addresses the absorption phase; volleyball-specific evidence supports repeated jump and landing exposure, not guaranteed transfer. Use mechanical overlap as a training heuristic; it does not establish direct performance causation.",
    "exerciseSelectionCautions": "Land with quiet, aligned feet and progress volume conservatively; Olympic derivatives require coaching.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7917682/",
      "https://journals.sagepub.com/doi/abs/10.1177/1941738110374624",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10499142/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed volleyball biomechanics and strength-and-conditioning literature on repeated jumping, landing, change of direction, overhead hitting, and shoulder/elbow kinetics, while treating gym transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "volleyball-2",
    "sportId": "volleyball",
    "label": "vertical block jump",
    "movementFamily": "vertical jump and overhead reach",
    "bodyActions": [
      "Short dip, bilateral takeoff, vertical reach, and controlled landing near the net."
    ],
    "jointActions": [
      "Hip/knee/ankle extension",
      "shoulder flexion",
      "scapular upward rotation",
      "elbow extension."
    ],
    "primeMovers": [
      "Quadriceps femoris, gluteus maximus, triceps surae, anterior deltoid"
    ],
    "assistingMuscles": [
      "Hamstrings, serratus anterior, triceps brachii, gluteus medius"
    ],
    "stabilizers": [
      "Rotator cuff, lower trapezius, trunk, ankle and foot muscles"
    ],
    "contractionRoles": [
      "Eccentric countermovement",
      "concentric takeoff and reach",
      "isometric overhead positioning",
      "eccentric landing."
    ],
    "commonForceOrSkillDemand": "Repeated vertical impulse with overhead reach and rapid reset.",
    "recommendedExercisePatterns": [
      "vertical jump and overhead pressing patterns"
    ],
    "recommendedExercises": [
      "Countermovement jumps",
      "Squat jumps",
      "Push presses",
      "Landmine presses"
    ],
    "transferRationale": "The movement directly combines jump, reach, and landing demands described in volleyball conditioning literature. Use mechanical overlap as a training heuristic; it does not establish direct performance causation.",
    "exerciseSelectionCautions": "Avoid fatigue-driven valgus or forced overhead range; separate high-impact jumps from shoulder-heavy work when needed.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7917682/",
      "https://journals.sagepub.com/doi/abs/10.1177/1941738110374624",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10499142/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed volleyball biomechanics and strength-and-conditioning literature on repeated jumping, landing, change of direction, overhead hitting, and shoulder/elbow kinetics, while treating gym transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "volleyball-3",
    "sportId": "volleyball",
    "label": "spike",
    "movementFamily": "rotational overhead striking",
    "bodyActions": [
      "Approach jump, trunk-pelvis separation, arm cocking, rapid acceleration to ball contact, and deceleration."
    ],
    "jointActions": [
      "Hip/knee/ankle extension",
      "thoracic rotation",
      "shoulder external-to-internal rotation",
      "horizontal adduction",
      "elbow extension."
    ],
    "primeMovers": [
      "Pectoralis major, latissimus dorsi, anterior deltoid, triceps brachii, internal/external obliques"
    ],
    "assistingMuscles": [
      "Serratus anterior, subscapularis, teres major, gluteus maximus, quadriceps femoris"
    ],
    "stabilizers": [
      "Infraspinatus, supraspinatus, teres minor, lower trapezius, multifidus"
    ],
    "contractionRoles": [
      "Eccentric cocking",
      "concentric proximal-to-distal acceleration",
      "eccentric arm braking",
      "isometric scapular/trunk control."
    ],
    "commonForceOrSkillDemand": "High shoulder/elbow kinetics, whole-body sequencing, and repeated jump-land cycles.",
    "recommendedExercisePatterns": [
      "rotational throw, press/pull, and shoulder-control patterns"
    ],
    "recommendedExercises": [
      "Medicine-ball rotational throws",
      "Landmine presses",
      "Cable rows",
      "Serratus wall slides"
    ],
    "transferRationale": "Biomechanical literature identifies large upper-limb kinetics in spike actions; selected drills overlap sequencing and deceleration without claiming causal performance gains. Use mechanical overlap as a training heuristic; it does not establish direct performance causation.",
    "exerciseSelectionCautions": "Use light-to-moderate ballistic loads and prioritize shoulder deceleration; do not infer that strength work alone improves spike speed.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7917682/",
      "https://journals.sagepub.com/doi/abs/10.1177/1941738110374624",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10499142/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed volleyball biomechanics and strength-and-conditioning literature on repeated jumping, landing, change of direction, overhead hitting, and shoulder/elbow kinetics, while treating gym transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "volleyball-4",
    "sportId": "volleyball",
    "label": "overhead serve",
    "movementFamily": "overhead striking and kinetic-chain sequencing",
    "bodyActions": [
      "Stance-to-leg-drive action with trunk extension/rotation and overhead arm acceleration to contact."
    ],
    "jointActions": [
      "Hip/knee/ankle extension",
      "trunk rotation/extension",
      "shoulder flexion and internal rotation",
      "elbow extension."
    ],
    "primeMovers": [
      "Pectoralis major, latissimus dorsi, anterior deltoid, triceps brachii, obliques"
    ],
    "assistingMuscles": [
      "Gluteus maximus, quadriceps femoris, serratus anterior, teres major"
    ],
    "stabilizers": [
      "Rotator cuff, lower trapezius, multifidus, deep hip and foot muscles"
    ],
    "contractionRoles": [
      "Concentric leg and arm propulsion",
      "eccentric arm deceleration",
      "isometric proximal control."
    ],
    "commonForceOrSkillDemand": "Sequential kinetic-chain force and high-velocity overhead arm action.",
    "recommendedExercisePatterns": [
      "overhead throw, half-kneeling press, anti-rotation"
    ],
    "recommendedExercises": [
      "Medicine-ball overhead throws",
      "Half-kneeling landmine presses",
      "Cable chops",
      "Pallof presses"
    ],
    "transferRationale": "Serve/spike studies support the overhead kinetic-chain emphasis; gym choices train shared force directions and proximal control rather than the technical skill itself. Use mechanical overlap as a training heuristic; it does not establish direct performance causation.",
    "exerciseSelectionCautions": "Keep throws submaximal until mechanics are stable; avoid painful overhead loading and excessive lumbar extension.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7917682/",
      "https://journals.sagepub.com/doi/abs/10.1177/1941738110374624",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10499142/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed volleyball biomechanics and strength-and-conditioning literature on repeated jumping, landing, change of direction, overhead hitting, and shoulder/elbow kinetics, while treating gym transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "volleyball-5",
    "sportId": "volleyball",
    "label": "jump serve",
    "movementFamily": "jump plus overhead striking",
    "bodyActions": [
      "Approach and bilateral jump followed by trunk rotation and overhead strike, then landing."
    ],
    "jointActions": [
      "Hip/knee/ankle extension",
      "trunk rotation",
      "shoulder internal rotation/horizontal adduction",
      "elbow extension."
    ],
    "primeMovers": [
      "Quadriceps femoris, gluteus maximus, triceps surae, pectoralis major, latissimus dorsi"
    ],
    "assistingMuscles": [
      "Anterior deltoid, triceps brachii, obliques, serratus anterior, hamstrings"
    ],
    "stabilizers": [
      "Rotator cuff, lower trapezius, trunk, pelvis, ankle and foot muscles"
    ],
    "contractionRoles": [
      "Eccentric approach/countermovement",
      "concentric takeoff and arm acceleration",
      "eccentric landing and arm braking."
    ],
    "commonForceOrSkillDemand": "Combined vertical impulse, overhead speed, rotation, and landing absorption.",
    "recommendedExercisePatterns": [
      "jump, overhead throw, rotational power"
    ],
    "recommendedExercises": [
      "Approach jumps",
      "Medicine-ball overhead throws",
      "Medicine-ball rotational throws",
      "Drop landings"
    ],
    "transferRationale": "The combined demands are consistent with volleyball conditioning and serve/spike biomechanics, but exercise-to-serve transfer remains inferential. Use mechanical overlap as a training heuristic; it does not establish direct performance causation.",
    "exerciseSelectionCautions": "Limit ballistic contacts when landing quality deteriorates; use technical serving practice for skill, not heavier resistance.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7917682/",
      "https://journals.sagepub.com/doi/abs/10.1177/1941738110374624",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10499142/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed volleyball biomechanics and strength-and-conditioning literature on repeated jumping, landing, change of direction, overhead hitting, and shoulder/elbow kinetics, while treating gym transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "volleyball-6",
    "sportId": "volleyball",
    "label": "forearm pass",
    "movementFamily": "low stance and projection",
    "bodyActions": [
      "Flexed-knee stance, hip hinge, forearm platform, and subtle leg-driven projection."
    ],
    "jointActions": [
      "Hip/knee flexion-extension",
      "shoulder flexion",
      "scapular protraction",
      "elbow extension held near-isometric."
    ],
    "primeMovers": [
      "Quadriceps femoris, gluteus maximus, hamstrings, anterior deltoid"
    ],
    "assistingMuscles": [
      "Soleus, serratus anterior, forearm flexors/extensors, adductor magnus"
    ],
    "stabilizers": [
      "Rotator cuff, trunk, gluteus medius, ankle and foot muscles"
    ],
    "contractionRoles": [
      "Isometric platform and trunk control",
      "eccentric stance loading",
      "modest concentric leg extension."
    ],
    "commonForceOrSkillDemand": "Sustained low posture, precise platform angle, and repeated small force adjustments.",
    "recommendedExercisePatterns": [
      "isometric squat, split stance, anti-rotation"
    ],
    "recommendedExercises": [
      "Goblet squat holds",
      "Split-stance isometric holds",
      "Cable-resisted anti-rotation",
      "Front-foot-elevated split squats"
    ],
    "transferRationale": "The stance and shoulder/scapular roles are mechanically clear, while direct training effects on passing accuracy are not established. Use mechanical overlap as a training heuristic; it does not establish direct performance causation.",
    "exerciseSelectionCautions": "Do not turn a platform skill into heavy shoulder pressing; maintain comfortable knee and back positions.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7917682/",
      "https://journals.sagepub.com/doi/abs/10.1177/1941738110374624",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10499142/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed volleyball biomechanics and strength-and-conditioning literature on repeated jumping, landing, change of direction, overhead hitting, and shoulder/elbow kinetics, while treating gym transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "volleyball-7",
    "sportId": "volleyball",
    "label": "overhead set",
    "movementFamily": "overhead reach and precision projection",
    "bodyActions": [
      "Leg-assisted overhead hand set with fingertip contact above the forehead."
    ],
    "jointActions": [
      "Ankle/knee/hip extension",
      "shoulder flexion",
      "scapular upward rotation",
      "elbow/wrist/finger extension."
    ],
    "primeMovers": [
      "Quadriceps femoris, triceps surae, anterior/middle deltoid, triceps brachii"
    ],
    "assistingMuscles": [
      "Serratus anterior, upper/lower trapezius, finger flexors/extensors, gluteus maximus"
    ],
    "stabilizers": [
      "Rotator cuff, trunk, intrinsic hand and foot muscles"
    ],
    "contractionRoles": [
      "Concentric leg and arm extension",
      "brief isometric hand shaping",
      "eccentric postural reset."
    ],
    "commonForceOrSkillDemand": "Low-load precision projection with rapid postural alignment.",
    "recommendedExercisePatterns": [
      "push press and serratus-focused pressing"
    ],
    "recommendedExercises": [
      "Push presses",
      "Medicine-ball chest-to-overhead passes",
      "Landmine presses",
      "Serratus wall slides"
    ],
    "transferRationale": "Exercise selection overlaps leg-assisted overhead projection and scapular upward rotation, but setting precision is skill-specific. Use mechanical overlap as a training heuristic; it does not establish direct performance causation.",
    "exerciseSelectionCautions": "Use low loads and preserve hand/finger technique; avoid treating fingertip skill as a maximal-force task.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7917682/",
      "https://journals.sagepub.com/doi/abs/10.1177/1941738110374624",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10499142/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed volleyball biomechanics and strength-and-conditioning literature on repeated jumping, landing, change of direction, overhead hitting, and shoulder/elbow kinetics, while treating gym transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "volleyball-8",
    "sportId": "volleyball",
    "label": "lateral blocking shuffle",
    "movementFamily": "lateral locomotion and defensive positioning",
    "bodyActions": [
      "Repeated lateral steps in a semi-flexed posture while maintaining blocking alignment."
    ],
    "jointActions": [
      "Hip abduction/adduction",
      "knee flexion-extension",
      "ankle dorsiflexion/plantarflexion",
      "trunk lateral control."
    ],
    "primeMovers": [
      "Gluteus medius, adductor longus/magnus, quadriceps femoris"
    ],
    "assistingMuscles": [
      "Gluteus maximus, hamstrings, soleus, peroneal muscles"
    ],
    "stabilizers": [
      "Obliques, deep hip rotators, knee and ankle stabilizers, intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Eccentric braking",
      "concentric lateral push-off",
      "isometric pelvis/trunk control."
    ],
    "commonForceOrSkillDemand": "Frontal-plane propulsion and braking with repeated low-stance repositioning.",
    "recommendedExercisePatterns": [
      "lateral strength and resisted locomotion"
    ],
    "recommendedExercises": [
      "Lateral bounds",
      "Lateral lunges",
      "Sled drags",
      "Band-resisted shuffle intervals"
    ],
    "transferRationale": "The lateral and change-of-direction demands are directly represented in volleyball conditioning guidance; transfer is mechanical, not guaranteed. Use mechanical overlap as a training heuristic; it does not establish direct performance causation.",
    "exerciseSelectionCautions": "Progress frontal-plane volume gradually and avoid uncontrolled knee collapse; drills should match court spacing.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7917682/",
      "https://journals.sagepub.com/doi/abs/10.1177/1941738110374624",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10499142/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed volleyball biomechanics and strength-and-conditioning literature on repeated jumping, landing, change of direction, overhead hitting, and shoulder/elbow kinetics, while treating gym transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "volleyball-9",
    "sportId": "volleyball",
    "label": "crossover block step",
    "movementFamily": "lateral locomotion plus vertical jump",
    "bodyActions": [
      "Crossover to cover distance, braking, reorientation, and block-jump preparation."
    ],
    "jointActions": [
      "Hip rotation/abduction/adduction",
      "knee flexion-extension",
      "ankle dorsiflexion/plantarflexion."
    ],
    "primeMovers": [
      "Gluteus maximus, gluteus medius, adductor magnus, quadriceps femoris"
    ],
    "assistingMuscles": [
      "Hamstrings, triceps surae, sartorius, tensor fasciae latae"
    ],
    "stabilizers": [
      "Obliques, deep hip rotators, knee/ankle stabilizers, intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Eccentric deceleration",
      "concentric crossover propulsion",
      "isometric trunk control",
      "subsequent jump propulsion."
    ],
    "commonForceOrSkillDemand": "Multiplanar footwork followed by rapid force redirection and vertical impulse.",
    "recommendedExercisePatterns": [
      "crossover, lateral lunge, deceleration, jump"
    ],
    "recommendedExercises": [
      "Crossover step-ups",
      "Lateral lunges",
      "Deceleration runs",
      "Countermovement jumps"
    ],
    "transferRationale": "The exercise menu shares lateral redirection and jump preparation; exact crossover timing is technical and position-dependent. Use mechanical overlap as a training heuristic; it does not establish direct performance causation.",
    "exerciseSelectionCautions": "Teach foot placement before adding speed; avoid excessive crossover depth if hip or knee control is poor.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7917682/",
      "https://journals.sagepub.com/doi/abs/10.1177/1941738110374624",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10499142/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed volleyball biomechanics and strength-and-conditioning literature on repeated jumping, landing, change of direction, overhead hitting, and shoulder/elbow kinetics, while treating gym transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "volleyball-10",
    "sportId": "volleyball",
    "label": "dive",
    "movementFamily": "ground-oriented defensive locomotion",
    "bodyActions": [
      "Rapid forward/lateral lowering, trunk bracing, extended-arm contact, and controlled ground absorption."
    ],
    "jointActions": [
      "Hip/knee flexion",
      "trunk flexion/bracing",
      "shoulder flexion",
      "elbow extension",
      "wrist extension."
    ],
    "primeMovers": [
      "Quadriceps femoris, gluteus maximus, hamstrings, anterior deltoid, triceps brachii"
    ],
    "assistingMuscles": [
      "Serratus anterior, pectoralis major, iliopsoas, forearm muscles"
    ],
    "stabilizers": [
      "Rotator cuff, trunk, gluteus medius, wrist/hand and ankle muscles"
    ],
    "contractionRoles": [
      "Eccentric lowering/braking",
      "isometric bracing and contact",
      "concentric recovery when possible."
    ],
    "commonForceOrSkillDemand": "High-rate lowering, force absorption, and safe upper-limb ground contact.",
    "recommendedExercisePatterns": [
      "crawl, sprawl, reach, trunk brace"
    ],
    "recommendedExercises": [
      "Bear-crawl transitions",
      "Controlled sprawls",
      "Split-stance reaches",
      "Pallof presses"
    ],
    "transferRationale": "Volleyball sources identify dives and ground recovery as recurring demands, while the gym rationale is a cautious mechanical analogy. Use mechanical overlap as a training heuristic; it does not establish direct performance causation.",
    "exerciseSelectionCautions": "Learn landing surfaces and technique with a coach; never use loaded dives or substitute them for skill instruction.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7917682/",
      "https://journals.sagepub.com/doi/abs/10.1177/1941738110374624",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10499142/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed volleyball biomechanics and strength-and-conditioning literature on repeated jumping, landing, change of direction, overhead hitting, and shoulder/elbow kinetics, while treating gym transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "volleyball-11",
    "sportId": "volleyball",
    "label": "roll recovery",
    "movementFamily": "ground recovery and rotational transition",
    "bodyActions": [
      "Post-dive roll from ground contact through trunk/hip rotation to supported standing."
    ],
    "jointActions": [
      "Spinal/hip rotation and flexion-extension",
      "shoulder support",
      "knee/hip extension during stand-up."
    ],
    "primeMovers": [
      "External/internal obliques, rectus abdominis, gluteus maximus, quadriceps femoris"
    ],
    "assistingMuscles": [
      "Iliopsoas, serratus anterior, triceps brachii, hamstrings"
    ],
    "stabilizers": [
      "Multifidus, deep neck flexors, rotator cuff, hip and ankle stabilizers"
    ],
    "contractionRoles": [
      "Eccentric impact management",
      "isometric bracing",
      "concentric push-up and stand-up recovery."
    ],
    "commonForceOrSkillDemand": "Rapid orientation change and whole-body ground-to-standing transition.",
    "recommendedExercisePatterns": [
      "floor roll and get-up patterns"
    ],
    "recommendedExercises": [
      "Technical floor rolls",
      "Turkish get-up segments",
      "Half-kneeling-to-stand drills",
      "Bear-crawl transitions"
    ],
    "transferRationale": "Movement descriptions support the pattern, but evidence linking these exercises to volleyball outcomes is limited and skill-specific. Use mechanical overlap as a training heuristic; it does not establish direct performance causation.",
    "exerciseSelectionCautions": "Use soft surfaces and progressive ranges; exclude cervical loading and stop for pain or dizziness.",
    "evidenceConfidence": "limited",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7917682/",
      "https://journals.sagepub.com/doi/abs/10.1177/1941738110374624",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10499142/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed volleyball biomechanics and strength-and-conditioning literature on repeated jumping, landing, change of direction, overhead hitting, and shoulder/elbow kinetics, while treating gym transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "volleyball-12",
    "sportId": "volleyball",
    "label": "low defensive stance",
    "movementFamily": "isometric athletic stance",
    "bodyActions": [
      "Sustained hip/knee/ankle flexion with forward trunk inclination and ready weight distribution."
    ],
    "jointActions": [
      "Hip/knee flexion",
      "ankle dorsiflexion",
      "trunk inclination",
      "frontal-plane hip control."
    ],
    "primeMovers": [
      "Quadriceps femoris, soleus, gluteus medius"
    ],
    "assistingMuscles": [
      "Gluteus maximus, hamstrings, adductor magnus, tibialis anterior"
    ],
    "stabilizers": [
      "Obliques, transversus abdominis, deep hip rotators, knee/ankle/foot muscles"
    ],
    "contractionRoles": [
      "Predominantly isometric endurance with eccentric micro-adjustments and concentric repositioning."
    ],
    "commonForceOrSkillDemand": "Repeated low-posture endurance and readiness for acceleration.",
    "recommendedExercisePatterns": [
      "isometric squat and stance patterns"
    ],
    "recommendedExercises": [
      "Squat holds",
      "Split-stance holds",
      "Lateral-resistance stance work",
      "Goblet squat holds"
    ],
    "transferRationale": "The stance is directly observable, but optimal depth and duration vary by position, athlete, and tactical situation. Use mechanical overlap as a training heuristic; it does not establish direct performance causation.",
    "exerciseSelectionCautions": "Use tolerable joint angles and avoid prolonged fatigue that changes spinal or knee alignment.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7917682/",
      "https://journals.sagepub.com/doi/abs/10.1177/1941738110374624",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10499142/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed volleyball biomechanics and strength-and-conditioning literature on repeated jumping, landing, change of direction, overhead hitting, and shoulder/elbow kinetics, while treating gym transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "volleyball-13",
    "sportId": "volleyball",
    "label": "single-leg takeoff",
    "movementFamily": "unilateral jump",
    "bodyActions": [
      "Unilateral countermovement and forceful extension through one leg with contralateral drive."
    ],
    "jointActions": [
      "Hip/knee/ankle extension",
      "contralateral hip flexion",
      "frontal-plane pelvic control."
    ],
    "primeMovers": [
      "Gluteus maximus, quadriceps femoris, hamstrings, triceps surae"
    ],
    "assistingMuscles": [
      "Iliopsoas, adductor magnus, gluteus medius"
    ],
    "stabilizers": [
      "Obliques, deep hip rotators, knee/ankle stabilizers, intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Eccentric unilateral loading",
      "concentric propulsion",
      "isometric frontal-plane control",
      "eccentric landing."
    ],
    "commonForceOrSkillDemand": "Unilateral impulse and landing control under approach momentum.",
    "recommendedExercisePatterns": [
      "single-leg plyometric and split-squat patterns"
    ],
    "recommendedExercises": [
      "Single-leg bounds",
      "Step-up jumps",
      "Rear-foot-elevated split squats",
      "Single-leg squat-to-stick"
    ],
    "transferRationale": "Unilateral jump mechanics are a logical extension of volleyball approach variability, but no causal claim is made for the listed exercises. Use mechanical overlap as a training heuristic; it does not establish direct performance causation.",
    "exerciseSelectionCautions": "Start with low contacts and stable landings; monitor asymmetry and tendon irritability.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7917682/",
      "https://journals.sagepub.com/doi/abs/10.1177/1941738110374624",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10499142/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed volleyball biomechanics and strength-and-conditioning literature on repeated jumping, landing, change of direction, overhead hitting, and shoulder/elbow kinetics, while treating gym transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "volleyball-14",
    "sportId": "volleyball",
    "label": "bilateral takeoff",
    "movementFamily": "bilateral vertical jump",
    "bodyActions": [
      "Symmetrical countermovement followed by synchronized hip, knee, and ankle extension."
    ],
    "jointActions": [
      "Hip/knee extension",
      "ankle plantarflexion",
      "trunk stiffness."
    ],
    "primeMovers": [
      "Quadriceps femoris, gluteus maximus, hamstrings, triceps surae"
    ],
    "assistingMuscles": [
      "Adductor magnus, soleus, erector spinae"
    ],
    "stabilizers": [
      "Trunk, pelvis, knee, ankle and intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Eccentric dip",
      "concentric triple extension",
      "isometric alignment",
      "eccentric landing."
    ],
    "commonForceOrSkillDemand": "Bilateral vertical impulse and repeatability.",
    "recommendedExercisePatterns": [
      "squat and jump patterns"
    ],
    "recommendedExercises": [
      "Barbell back squats",
      "Countermovement jumps",
      "Loaded jump squats",
      "Hang power cleans"
    ],
    "transferRationale": "Repeated jumping is a defining volleyball demand and the selected patterns share the relevant bilateral force phases. Use mechanical overlap as a training heuristic; it does not establish direct performance causation.",
    "exerciseSelectionCautions": "Use load that preserves jump velocity and landing mechanics; high-volume plyometrics require recovery.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7917682/",
      "https://journals.sagepub.com/doi/abs/10.1177/1941738110374624",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10499142/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed volleyball biomechanics and strength-and-conditioning literature on repeated jumping, landing, change of direction, overhead hitting, and shoulder/elbow kinetics, while treating gym transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "volleyball-15",
    "sportId": "volleyball",
    "label": "landing",
    "movementFamily": "deceleration and landing",
    "bodyActions": [
      "Absorb jump momentum through coordinated hip, knee, ankle flexion with trunk and foot alignment."
    ],
    "jointActions": [
      "Hip/knee flexion",
      "ankle dorsiflexion",
      "controlled trunk flexion",
      "foot pronation/supination management."
    ],
    "primeMovers": [
      "Quadriceps femoris, gluteus maximus, hamstrings, soleus"
    ],
    "assistingMuscles": [
      "Gluteus medius, adductor magnus, tibialis anterior, gastrocnemius"
    ],
    "stabilizers": [
      "Obliques, deep hip rotators, knee/ankle stabilizers, intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Eccentric force absorption",
      "isometric alignment",
      "concentric reset."
    ],
    "commonForceOrSkillDemand": "High-impact eccentric braking and repeated landing exposure.",
    "recommendedExercisePatterns": [
      "landing mechanics and deceleration"
    ],
    "recommendedExercises": [
      "Drop landings",
      "Snap-downs",
      "Single-leg squat-to-stick",
      "Deceleration runs"
    ],
    "transferRationale": "Volleyball literature emphasizes repeated landing and lower-limb injury exposure; exercises train absorption but are not proven injury-prevention guarantees. Use mechanical overlap as a training heuristic; it does not establish direct performance causation.",
    "exerciseSelectionCautions": "Use appropriate box height and surface; quality and alignment take priority over fatigue or depth.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7917682/",
      "https://journals.sagepub.com/doi/abs/10.1177/1941738110374624",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10499142/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed volleyball biomechanics and strength-and-conditioning literature on repeated jumping, landing, change of direction, overhead hitting, and shoulder/elbow kinetics, while treating gym transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "volleyball-16",
    "sportId": "volleyball",
    "label": "overhead reach",
    "movementFamily": "overhead reach",
    "bodyActions": [
      "Arm elevation with scapular upward rotation and leg/trunk contribution to contact above shoulder height."
    ],
    "jointActions": [
      "Shoulder flexion/abduction",
      "scapular upward rotation/protraction",
      "elbow extension",
      "ankle plantarflexion as needed."
    ],
    "primeMovers": [
      "Anterior/middle deltoid, serratus anterior, upper/lower trapezius, triceps brachii"
    ],
    "assistingMuscles": [
      "Pectoralis minor/major, rotator-cuff muscles, triceps surae"
    ],
    "stabilizers": [
      "Rotator cuff, trunk, pelvis, wrist and foot muscles"
    ],
    "contractionRoles": [
      "Concentric elevation",
      "isometric end-range positioning",
      "eccentric lowering."
    ],
    "commonForceOrSkillDemand": "Repeated overhead reach with scapulohumeral coordination.",
    "recommendedExercisePatterns": [
      "scapular control and overhead carries"
    ],
    "recommendedExercises": [
      "Landmine presses",
      "Overhead carries",
      "Serratus wall slides",
      "Half-kneeling landmine presses"
    ],
    "transferRationale": "Overhead actions are central to volleyball and shoulder kinetics are documented, but this generic reach is less studied than serve/spike. Use mechanical overlap as a training heuristic; it does not establish direct performance causation.",
    "exerciseSelectionCautions": "Avoid painful end range and excessive rib flare; progress overhead volume separately from maximal hitting.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7917682/",
      "https://journals.sagepub.com/doi/abs/10.1177/1941738110374624",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10499142/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed volleyball biomechanics and strength-and-conditioning literature on repeated jumping, landing, change of direction, overhead hitting, and shoulder/elbow kinetics, while treating gym transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "volleyball-17",
    "sportId": "volleyball",
    "label": "shoulder swing",
    "movementFamily": "upper-limb striking",
    "bodyActions": [
      "Rapid arm acceleration through flexion/horizontal adduction or internal rotation, followed by braking."
    ],
    "jointActions": [
      "Shoulder horizontal adduction/internal rotation",
      "elbow extension",
      "scapular protraction",
      "trunk rotation."
    ],
    "primeMovers": [
      "Pectoralis major, latissimus dorsi, anterior deltoid, triceps brachii"
    ],
    "assistingMuscles": [
      "Serratus anterior, subscapularis, teres major, obliques"
    ],
    "stabilizers": [
      "Infraspinatus, supraspinatus, teres minor, lower trapezius, wrist/elbow stabilizers"
    ],
    "contractionRoles": [
      "Concentric acceleration",
      "eccentric deceleration",
      "isometric scapular and trunk control."
    ],
    "commonForceOrSkillDemand": "High-velocity overhead arm speed and substantial braking demand.",
    "recommendedExercisePatterns": [
      "ballistic throw and shoulder deceleration"
    ],
    "recommendedExercises": [
      "Medicine-ball throws",
      "Cable presses",
      "Cable rows",
      "Serratus wall slides"
    ],
    "transferRationale": "Serve/spike biomechanics document high shoulder and elbow kinetics; the exercise rationale remains shared-action based. Use mechanical overlap as a training heuristic; it does not establish direct performance causation.",
    "exerciseSelectionCautions": "Keep ballistic implements light and stop with pain or loss of scapular control; balance pressing with pulling and deceleration work.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7917682/",
      "https://journals.sagepub.com/doi/abs/10.1177/1941738110374624",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10499142/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed volleyball biomechanics and strength-and-conditioning literature on repeated jumping, landing, change of direction, overhead hitting, and shoulder/elbow kinetics, while treating gym transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "volleyball-18",
    "sportId": "volleyball",
    "label": "trunk rotation",
    "movementFamily": "rotational force transfer",
    "bodyActions": [
      "Transverse-plane rotation and anti-rotation linking pelvis, torso, and shoulder complex."
    ],
    "jointActions": [
      "Thoracic rotation",
      "pelvic rotation",
      "lumbar anti-rotation",
      "hip internal/external rotation."
    ],
    "primeMovers": [
      "External/internal obliques, gluteus maximus/medius, multifidus"
    ],
    "assistingMuscles": [
      "Transversus abdominis, erector spinae, adductor magnus, latissimus dorsi"
    ],
    "stabilizers": [
      "Deep spinal stabilizers, diaphragm, pelvic-floor and deep hip muscles"
    ],
    "contractionRoles": [
      "Concentric rotation",
      "eccentric braking",
      "isometric anti-rotation."
    ],
    "commonForceOrSkillDemand": "Sequential force transfer and proximal control during hitting and serving.",
    "recommendedExercisePatterns": [
      "chop, lift, rotation, anti-rotation"
    ],
    "recommendedExercises": [
      "Cable chops",
      "Cable lifts",
      "Landmine rotations",
      "Pallof presses"
    ],
    "transferRationale": "Whole-body sequencing and trunk rotation are supported by overhead-skill biomechanics, but exact muscle contributions vary by technique. Use mechanical overlap as a training heuristic; it does not establish direct performance causation.",
    "exerciseSelectionCautions": "Avoid forcing lumbar rotation; rotate through the thoracic spine and hips with a braced pelvis.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7917682/",
      "https://journals.sagepub.com/doi/abs/10.1177/1941738110374624",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10499142/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed volleyball biomechanics and strength-and-conditioning literature on repeated jumping, landing, change of direction, overhead hitting, and shoulder/elbow kinetics, while treating gym transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "volleyball-19",
    "sportId": "volleyball",
    "label": "quick acceleration",
    "movementFamily": "acceleration and sprint mechanics",
    "bodyActions": [
      "Short-step center-of-mass projection with forward lean and forceful hip/knee/ankle extension."
    ],
    "jointActions": [
      "Hip/knee extension",
      "ankle plantarflexion",
      "swing-leg hip flexion",
      "trunk inclination."
    ],
    "primeMovers": [
      "Gluteus maximus, hamstrings, quadriceps femoris, triceps surae"
    ],
    "assistingMuscles": [
      "Iliopsoas, adductor magnus, gluteus medius, tibialis anterior"
    ],
    "stabilizers": [
      "Trunk, pelvis, knee, ankle and foot muscles"
    ],
    "contractionRoles": [
      "Concentric propulsion",
      "eccentric braking between efforts",
      "isometric trunk control."
    ],
    "commonForceOrSkillDemand": "Short-burst acceleration and repeated starts/stops.",
    "recommendedExercisePatterns": [
      "horizontal force and resisted sprint patterns"
    ],
    "recommendedExercises": [
      "Resisted sprints",
      "Sled pushes",
      "Short shuttle starts",
      "Split-stance jumps"
    ],
    "transferRationale": "Volleyball conditioning sources describe frequent changes of direction and explosive efforts; direct acceleration data are less specific than jump/serve data. Use mechanical overlap as a training heuristic; it does not establish direct performance causation.",
    "exerciseSelectionCautions": "Keep resistance low enough to preserve acceleration posture; separate maximal sprinting from fatigued conditioning.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7917682/",
      "https://journals.sagepub.com/doi/abs/10.1177/1941738110374624",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10499142/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed volleyball biomechanics and strength-and-conditioning literature on repeated jumping, landing, change of direction, overhead hitting, and shoulder/elbow kinetics, while treating gym transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "volleyball-20",
    "sportId": "volleyball",
    "label": "backward defensive movement",
    "movementFamily": "backward locomotion and deceleration",
    "bodyActions": [
      "Backward shuffle or crossover with flexed hips/knees, torso organization, and rapid braking."
    ],
    "jointActions": [
      "Hip extension/abduction/adduction",
      "knee flexion-extension",
      "ankle dorsiflexion/plantarflexion",
      "trunk anti-rotation."
    ],
    "primeMovers": [
      "Quadriceps femoris, gluteus medius, gluteus maximus, hamstrings"
    ],
    "assistingMuscles": [
      "Adductor magnus, soleus, gastrocnemius, tibialis anterior"
    ],
    "stabilizers": [
      "Obliques, deep hip rotators, knee/ankle stabilizers, intrinsic foot muscles"
    ],
    "contractionRoles": [
      "Eccentric braking",
      "concentric repositioning",
      "isometric defensive posture."
    ],
    "commonForceOrSkillDemand": "Backward and lateral repositioning while maintaining visual and postural readiness.",
    "recommendedExercisePatterns": [
      "backward locomotion and multidirectional drills"
    ],
    "recommendedExercises": [
      "Backward sled drags",
      "Reverse lunges",
      "Multidirectional shuttle drills",
      "Lateral-resistance stance work"
    ],
    "transferRationale": "The movement is a recognized court-demand pattern, but evidence is stronger for general change-of-direction demands than this exact drill. Use mechanical overlap as a training heuristic; it does not establish direct performance causation.",
    "exerciseSelectionCautions": "Teach backward footwork slowly and avoid blind maximal-speed drills; maintain court awareness and knee alignment.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC7917682/",
      "https://journals.sagepub.com/doi/abs/10.1177/1941738110374624",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10499142/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed volleyball biomechanics and strength-and-conditioning literature on repeated jumping, landing, change of direction, overhead hitting, and shoulder/elbow kinetics, while treating gym transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "boxing-1",
    "sportId": "boxing",
    "label": "jab",
    "movementFamily": "straight-punch",
    "bodyActions": [
      "Rapid lead-arm projection from a balanced stance with subtle lower-body push and fast retraction."
    ],
    "jointActions": [
      "ankle plantarflexion",
      "knee/hip extension",
      "shoulder flexion and horizontal adduction",
      "elbow extension",
      "scapular protraction",
      "wrist stabilization."
    ],
    "primeMovers": [
      "pectoralis major",
      "anterior deltoid",
      "triceps brachii",
      "serratus anterior"
    ],
    "assistingMuscles": [
      "gastrocnemius",
      "soleus",
      "gluteus maximus",
      "external oblique",
      "internal oblique"
    ],
    "stabilizers": [
      "rotator cuff",
      "middle and lower trapezius",
      "gluteus medius",
      "deep trunk muscles"
    ],
    "contractionRoles": [
      "concentric projection",
      "brief isometric force transfer",
      "eccentric shoulder/elbow deceleration",
      "active retraction."
    ],
    "commonForceOrSkillDemand": "High-rate linear force with stance balance and rapid recovery.",
    "recommendedExercisePatterns": [
      "landmine press",
      "cable punch",
      "split squat",
      "Pallof press"
    ],
    "recommendedExercises": [
      "landmine press",
      "cable punch",
      "split squat",
      "Pallof press"
    ],
    "transferRationale": "Pressing plus stance and anti-rotation work overlaps the jab’s linear arm action and proximal support, but not its skill timing.",
    "exerciseSelectionCautions": "Use technically controlled loads and preserve boxing stance; gym exercises share selected force or muscle actions but do not reproduce timing, perception, opponent contact, or guarantee punch performance.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://journals.lww.com/nsca-jscr/fulltext/2020/04000/defining_the_phases_of_boxing_punches__a.22.aspx",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12729554/",
      "https://www.mdpi.com/2076-7363/14/21/9706"
    ],
    "sourceSummary": "The records synthesize peer-reviewed boxing punch and movement biomechanics with a boxing strength-training scoping review; evidence is strongest for general kinetic-chain and conditioning principles, while exercise-to-sport transfer remains an indirect heuristic rather than a causal performance claim."
  },
  {
    "id": "boxing-2",
    "sportId": "boxing",
    "label": "cross",
    "movementFamily": "straight-punch",
    "bodyActions": [
      "Rear-side drive transfers through pelvis and trunk into a straight rear-hand punch."
    ],
    "jointActions": [
      "rear ankle plantarflexion",
      "knee/hip extension",
      "pelvic/trunk rotation",
      "shoulder horizontal adduction",
      "elbow extension",
      "scapular protraction."
    ],
    "primeMovers": [
      "gluteus maximus",
      "pectoralis major",
      "anterior deltoid",
      "triceps brachii",
      "serratus anterior"
    ],
    "assistingMuscles": [
      "gastrocnemius",
      "soleus",
      "quadriceps",
      "internal oblique",
      "external oblique"
    ],
    "stabilizers": [
      "rotator cuff",
      "gluteus medius",
      "adductor magnus",
      "spinal erectors"
    ],
    "contractionRoles": [
      "concentric whole-chain acceleration",
      "isometric trunk linkage",
      "eccentric arm braking."
    ],
    "commonForceOrSkillDemand": "Proximal-to-distal sequencing and horizontal impulse.",
    "recommendedExercisePatterns": [
      "landmine press",
      "medicine-ball rotational throws",
      "split squat",
      "cable anti-rotation"
    ],
    "recommendedExercises": [
      "landmine press",
      "medicine-ball rotational throws",
      "split squat",
      "cable anti-rotation"
    ],
    "transferRationale": "Rotational pressing and medicine-ball projection train related sequencing and force direction without proving sport transfer.",
    "exerciseSelectionCautions": "Use technically controlled loads and preserve boxing stance; gym exercises share selected force or muscle actions but do not reproduce timing, perception, opponent contact, or guarantee punch performance.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://journals.lww.com/nsca-jscr/fulltext/2020/04000/defining_the_phases_of_boxing_punches__a.22.aspx",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12729554/",
      "https://www.mdpi.com/2076-7363/14/21/9706"
    ],
    "sourceSummary": "The records synthesize peer-reviewed boxing punch and movement biomechanics with a boxing strength-training scoping review; evidence is strongest for general kinetic-chain and conditioning principles, while exercise-to-sport transfer remains an indirect heuristic rather than a causal performance claim."
  },
  {
    "id": "boxing-3",
    "sportId": "boxing",
    "label": "lead hook",
    "movementFamily": "rotational-punch",
    "bodyActions": [
      "Lead-side horizontal swing driven by stance rotation and trunk turning."
    ],
    "jointActions": [
      "lead hip internal rotation",
      "pelvic/trunk rotation",
      "shoulder horizontal adduction",
      "elbow flexion held",
      "scapular protraction/retraction."
    ],
    "primeMovers": [
      "internal/external obliques",
      "pectoralis major",
      "anterior and middle deltoid",
      "serratus anterior"
    ],
    "assistingMuscles": [
      "gluteus maximus",
      "adductor magnus",
      "quadriceps",
      "triceps brachii"
    ],
    "stabilizers": [
      "rotator cuff",
      "gluteus medius",
      "foot intrinsics",
      "spinal erectors"
    ],
    "contractionRoles": [
      "concentric rotation",
      "isometric elbow angle",
      "eccentric deceleration and guard recovery."
    ],
    "commonForceOrSkillDemand": "Transverse-plane impulse with proximal bracing.",
    "recommendedExercisePatterns": [
      "medicine-ball rotational throws",
      "cable chops",
      "landmine press",
      "split squat"
    ],
    "recommendedExercises": [
      "medicine-ball rotational throws",
      "cable chops",
      "landmine press",
      "split squat"
    ],
    "transferRationale": "Rotational throws and cable chops share trunk rotation and leg-supported force transfer; they do not replicate impact or opponent distance.",
    "exerciseSelectionCautions": "Use technically controlled loads and preserve boxing stance; gym exercises share selected force or muscle actions but do not reproduce timing, perception, opponent contact, or guarantee punch performance.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://journals.lww.com/nsca-jscr/fulltext/2020/04000/defining_the_phases_of_boxing_punches__a.22.aspx",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12729554/",
      "https://www.mdpi.com/2076-7363/14/21/9706"
    ],
    "sourceSummary": "The records synthesize peer-reviewed boxing punch and movement biomechanics with a boxing strength-training scoping review; evidence is strongest for general kinetic-chain and conditioning principles, while exercise-to-sport transfer remains an indirect heuristic rather than a causal performance claim."
  },
  {
    "id": "boxing-4",
    "sportId": "boxing",
    "label": "rear hook",
    "movementFamily": "rotational-punch",
    "bodyActions": [
      "Rear-side rotational punch with larger pelvic and trunk contribution than a lead hook."
    ],
    "jointActions": [
      "rear hip internal rotation",
      "pelvic/trunk rotation",
      "shoulder horizontal adduction",
      "elbow flexion",
      "scapular motion."
    ],
    "primeMovers": [
      "external oblique",
      "internal oblique",
      "pectoralis major",
      "anterior deltoid",
      "serratus anterior"
    ],
    "assistingMuscles": [
      "gluteus maximus",
      "adductor magnus",
      "quadriceps",
      "triceps brachii"
    ],
    "stabilizers": [
      "rotator cuff",
      "gluteus medius",
      "soleus",
      "spinal erectors"
    ],
    "contractionRoles": [
      "concentric rotational acceleration",
      "isometric trunk transmission",
      "eccentric return."
    ],
    "commonForceOrSkillDemand": "High transverse-plane force while maintaining base.",
    "recommendedExercisePatterns": [
      "medicine-ball rotational throws",
      "cable chops",
      "landmine press",
      "split squat"
    ],
    "recommendedExercises": [
      "medicine-ball rotational throws",
      "cable chops",
      "landmine press",
      "split squat"
    ],
    "transferRationale": "The exercise set develops rotational power and support-leg strength that overlap the hook’s mechanics, with limited direct evidence for punch outcomes.",
    "exerciseSelectionCautions": "Use technically controlled loads and preserve boxing stance; gym exercises share selected force or muscle actions but do not reproduce timing, perception, opponent contact, or guarantee punch performance.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://journals.lww.com/nsca-jscr/fulltext/2020/04000/defining_the_phases_of_boxing_punches__a.22.aspx",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12729554/",
      "https://www.mdpi.com/2076-7363/14/21/9706"
    ],
    "sourceSummary": "The records synthesize peer-reviewed boxing punch and movement biomechanics with a boxing strength-training scoping review; evidence is strongest for general kinetic-chain and conditioning principles, while exercise-to-sport transfer remains an indirect heuristic rather than a causal performance claim."
  },
  {
    "id": "boxing-5",
    "sportId": "boxing",
    "label": "uppercut",
    "movementFamily": "rising/level-change punch",
    "bodyActions": [
      "Leg-supported upward punch from flexed stance with vertical and rotational trunk extension."
    ],
    "jointActions": [
      "ankle plantarflexion",
      "knee/hip extension",
      "trunk extension/rotation",
      "shoulder flexion",
      "elbow extension",
      "scapular upward rotation/protraction."
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps",
      "gastrocnemius",
      "anterior deltoid",
      "pectoralis major",
      "triceps brachii"
    ],
    "assistingMuscles": [
      "soleus",
      "hamstrings",
      "serratus anterior",
      "obliques"
    ],
    "stabilizers": [
      "rotator cuff",
      "spinal erectors",
      "gluteus medius",
      "foot/ankle stabilizers"
    ],
    "contractionRoles": [
      "concentric leg drive and punch",
      "isometric trunk transfer",
      "eccentric reset."
    ],
    "commonForceOrSkillDemand": "Vertical impulse from a lowered center of mass.",
    "recommendedExercisePatterns": [
      "push press",
      "medicine-ball scoop throws",
      "split squat",
      "cable lift"
    ],
    "recommendedExercises": [
      "push press",
      "medicine-ball scoop throws",
      "split squat",
      "cable lift"
    ],
    "transferRationale": "Triple-extension and upward-throw patterns share the rising force direction, but the uppercut remains a technical open-skill action.",
    "exerciseSelectionCautions": "Use technically controlled loads and preserve boxing stance; gym exercises share selected force or muscle actions but do not reproduce timing, perception, opponent contact, or guarantee punch performance.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://journals.lww.com/nsca-jscr/fulltext/2020/04000/defining_the_phases_of_boxing_punches__a.22.aspx",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12729554/",
      "https://www.mdpi.com/2076-7363/14/21/9706"
    ],
    "sourceSummary": "The records synthesize peer-reviewed boxing punch and movement biomechanics with a boxing strength-training scoping review; evidence is strongest for general kinetic-chain and conditioning principles, while exercise-to-sport transfer remains an indirect heuristic rather than a causal performance claim."
  },
  {
    "id": "boxing-6",
    "sportId": "boxing",
    "label": "overhand",
    "movementFamily": "rotational-punch",
    "bodyActions": [
      "Arcing rear-hand strike combining lateral trunk inclination, rotation, and shoulder flexion."
    ],
    "jointActions": [
      "rear hip/knee extension",
      "trunk rotation and lateral flexion",
      "shoulder flexion/horizontal adduction",
      "elbow extension",
      "scapular protraction."
    ],
    "primeMovers": [
      "external oblique",
      "internal oblique",
      "pectoralis major",
      "anterior deltoid",
      "triceps brachii"
    ],
    "assistingMuscles": [
      "gluteus maximus",
      "quadriceps",
      "serratus anterior",
      "latissimus dorsi"
    ],
    "stabilizers": [
      "rotator cuff",
      "gluteus medius",
      "spinal erectors",
      "foot/ankle stabilizers"
    ],
    "contractionRoles": [
      "concentric arc acceleration",
      "isometric trunk stiffness",
      "eccentric shoulder braking."
    ],
    "commonForceOrSkillDemand": "Large rotational impulse with shoulder control.",
    "recommendedExercisePatterns": [
      "medicine-ball rotational throws",
      "cable lifts",
      "landmine press",
      "split squat"
    ],
    "recommendedExercises": [
      "medicine-ball rotational throws",
      "cable lifts",
      "landmine press",
      "split squat"
    ],
    "transferRationale": "Diagonal throws and landmine pressing overlap the diagonal kinetic chain while avoiding claims of identical punch loading.",
    "exerciseSelectionCautions": "Use technically controlled loads and preserve boxing stance; gym exercises share selected force or muscle actions but do not reproduce timing, perception, opponent contact, or guarantee punch performance.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://journals.lww.com/nsca-jscr/fulltext/2020/04000/defining_the_phases_of_boxing_punches__a.22.aspx",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12729554/",
      "https://www.mdpi.com/2076-7363/14/21/9706"
    ],
    "sourceSummary": "The records synthesize peer-reviewed boxing punch and movement biomechanics with a boxing strength-training scoping review; evidence is strongest for general kinetic-chain and conditioning principles, while exercise-to-sport transfer remains an indirect heuristic rather than a causal performance claim."
  },
  {
    "id": "boxing-7",
    "sportId": "boxing",
    "label": "body shot",
    "movementFamily": "rising/level-change punch",
    "bodyActions": [
      "Lower-target punch performed with knee/hip flexion and forceful return through the trunk."
    ],
    "jointActions": [
      "hip/knee flexion then extension",
      "trunk rotation/flexion",
      "shoulder flexion/horizontal adduction",
      "elbow extension."
    ],
    "primeMovers": [
      "quadriceps",
      "gluteus maximus",
      "obliques",
      "pectoralis major",
      "anterior deltoid",
      "triceps brachii"
    ],
    "assistingMuscles": [
      "hamstrings",
      "adductor magnus",
      "serratus anterior",
      "gastrocnemius"
    ],
    "stabilizers": [
      "spinal erectors",
      "rotator cuff",
      "gluteus medius",
      "adductors"
    ],
    "contractionRoles": [
      "eccentric lowering",
      "concentric leg/trunk/punch drive",
      "eccentric recovery."
    ],
    "commonForceOrSkillDemand": "Force production from a compressed stance and rapid re-extension.",
    "recommendedExercisePatterns": [
      "front-foot-elevated split squat",
      "cable chops",
      "medicine-ball scoop throws",
      "Pallof press"
    ],
    "recommendedExercises": [
      "front-foot-elevated split squat",
      "cable chops",
      "medicine-ball scoop throws",
      "Pallof press"
    ],
    "transferRationale": "Unilateral leg and diagonal trunk exercises overlap the body-shot base and rise, but target height and defense are skill-specific.",
    "exerciseSelectionCautions": "Use technically controlled loads and preserve boxing stance; gym exercises share selected force or muscle actions but do not reproduce timing, perception, opponent contact, or guarantee punch performance.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://journals.lww.com/nsca-jscr/fulltext/2020/04000/defining_the_phases_of_boxing_punches__a.22.aspx",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12729554/",
      "https://www.mdpi.com/2076-7363/14/21/9706"
    ],
    "sourceSummary": "The records synthesize peer-reviewed boxing punch and movement biomechanics with a boxing strength-training scoping review; evidence is strongest for general kinetic-chain and conditioning principles, while exercise-to-sport transfer remains an indirect heuristic rather than a causal performance claim."
  },
  {
    "id": "boxing-8",
    "sportId": "boxing",
    "label": "slip",
    "movementFamily": "defensive-evasion and redirection",
    "bodyActions": [
      "Small lateral and rotational head displacement under a stable, loaded stance."
    ],
    "jointActions": [
      "ankle/knee/hip flexion",
      "hip shift",
      "trunk lateral flexion/rotation",
      "cervical motion kept controlled."
    ],
    "primeMovers": [
      "internal/external obliques",
      "quadratus lumborum",
      "gluteus medius"
    ],
    "assistingMuscles": [
      "gluteus maximus",
      "adductors",
      "quadriceps",
      "soleus"
    ],
    "stabilizers": [
      "deep cervical flexors",
      "spinal erectors",
      "foot/ankle stabilizers",
      "rotator cuff"
    ],
    "contractionRoles": [
      "eccentric braking into displacement",
      "isometric trunk/neck control",
      "concentric return."
    ],
    "commonForceOrSkillDemand": "Reactive balance, low-amplitude deceleration, and head-position control.",
    "recommendedExercisePatterns": [
      "lateral lunge",
      "cable anti-rotation",
      "single-leg balance",
      "split-squat isometric"
    ],
    "recommendedExercises": [
      "lateral lunge",
      "cable anti-rotation",
      "single-leg balance",
      "split-squat isometric"
    ],
    "transferRationale": "Lateral and anti-rotation patterns build supporting capacities, not the perceptual timing or exact cervical skill of slipping.",
    "exerciseSelectionCautions": "Use technically controlled loads and preserve boxing stance; gym exercises share selected force or muscle actions but do not reproduce timing, perception, opponent contact, or guarantee punch performance.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://journals.lww.com/nsca-jscr/fulltext/2020/04000/defining_the_phases_of_boxing_punches__a.22.aspx",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12729554/",
      "https://www.mdpi.com/2076-7363/14/21/9706"
    ],
    "sourceSummary": "The records synthesize peer-reviewed boxing punch and movement biomechanics with a boxing strength-training scoping review; evidence is strongest for general kinetic-chain and conditioning principles, while exercise-to-sport transfer remains an indirect heuristic rather than a causal performance claim."
  },
  {
    "id": "boxing-9",
    "sportId": "boxing",
    "label": "roll",
    "movementFamily": "defensive-evasion and redirection",
    "bodyActions": [
      "Circular duck-under movement combining squat-like lowering with lateral trunk travel and rise."
    ],
    "jointActions": [
      "hip/knee/ankle flexion and extension",
      "trunk rotation/lateral flexion",
      "controlled cervical alignment."
    ],
    "primeMovers": [
      "quadriceps",
      "gluteus maximus",
      "adductor magnus",
      "obliques"
    ],
    "assistingMuscles": [
      "hamstrings",
      "gastrocnemius",
      "gluteus medius",
      "soleus"
    ],
    "stabilizers": [
      "spinal erectors",
      "deep trunk muscles",
      "foot/ankle stabilizers"
    ],
    "contractionRoles": [
      "eccentric lowering",
      "concentric rise",
      "isometric trunk control",
      "eccentric redirection."
    ],
    "commonForceOrSkillDemand": "Repeated low-position force absorption and reorientation.",
    "recommendedExercisePatterns": [
      "lateral squat",
      "Cossack squat",
      "cable anti-rotation",
      "medicine-ball rotational throws"
    ],
    "recommendedExercises": [
      "lateral squat",
      "Cossack squat",
      "cable anti-rotation",
      "medicine-ball rotational throws"
    ],
    "transferRationale": "Squat and lateral-rotation patterns overlap joint excursions and bracing, but do not reproduce an incoming punch or timing.",
    "exerciseSelectionCautions": "Use technically controlled loads and preserve boxing stance; gym exercises share selected force or muscle actions but do not reproduce timing, perception, opponent contact, or guarantee punch performance.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://journals.lww.com/nsca-jscr/fulltext/2020/04000/defining_the_phases_of_boxing_punches__a.22.aspx",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12729554/",
      "https://www.mdpi.com/2076-7363/14/21/9706"
    ],
    "sourceSummary": "The records synthesize peer-reviewed boxing punch and movement biomechanics with a boxing strength-training scoping review; evidence is strongest for general kinetic-chain and conditioning principles, while exercise-to-sport transfer remains an indirect heuristic rather than a causal performance claim."
  },
  {
    "id": "boxing-10",
    "sportId": "boxing",
    "label": "pull-back",
    "movementFamily": "defensive-evasion and redirection",
    "bodyActions": [
      "Posterior weight shift and trunk withdrawal while preserving guard and stance."
    ],
    "jointActions": [
      "ankle dorsiflexion/plantarflexion",
      "knee/hip flexion",
      "trunk extension",
      "shoulder retraction."
    ],
    "primeMovers": [
      "gluteus maximus",
      "hamstrings",
      "quadriceps",
      "gastrocnemius"
    ],
    "assistingMuscles": [
      "soleus",
      "anterior tibialis",
      "latissimus dorsi",
      "posterior deltoid"
    ],
    "stabilizers": [
      "gluteus medius",
      "spinal erectors",
      "rotator cuff",
      "foot/ankle stabilizers"
    ],
    "contractionRoles": [
      "eccentric braking",
      "isometric guard",
      "concentric re-entry."
    ],
    "commonForceOrSkillDemand": "Posterior displacement and braking under visual reaction.",
    "recommendedExercisePatterns": [
      "reverse lunge",
      "sled drag",
      "Pallof press",
      "single-leg balance"
    ],
    "recommendedExercises": [
      "reverse lunge",
      "sled drag",
      "Pallof press",
      "single-leg balance"
    ],
    "transferRationale": "Reverse-stance and bracing exercises share posterior control, but transfer is a mechanical heuristic only.",
    "exerciseSelectionCautions": "Use technically controlled loads and preserve boxing stance; gym exercises share selected force or muscle actions but do not reproduce timing, perception, opponent contact, or guarantee punch performance.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://journals.lww.com/nsca-jscr/fulltext/2020/04000/defining_the_phases_of_boxing_punches__a.22.aspx",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12729554/",
      "https://www.mdpi.com/2076-7363/14/21/9706"
    ],
    "sourceSummary": "The records synthesize peer-reviewed boxing punch and movement biomechanics with a boxing strength-training scoping review; evidence is strongest for general kinetic-chain and conditioning principles, while exercise-to-sport transfer remains an indirect heuristic rather than a causal performance claim."
  },
  {
    "id": "boxing-11",
    "sportId": "boxing",
    "label": "parry",
    "movementFamily": "defensive-evasion and redirection",
    "bodyActions": [
      "Short hand/forearm redirection of an incoming line with a stable trunk and rapid recovery."
    ],
    "jointActions": [
      "shoulder internal/external rotation",
      "elbow flexion/extension",
      "scapular retraction/protraction",
      "wrist stabilization."
    ],
    "primeMovers": [
      "pectoralis major",
      "anterior deltoid",
      "triceps brachii",
      "serratus anterior"
    ],
    "assistingMuscles": [
      "biceps brachii",
      "pronator teres",
      "latissimus dorsi"
    ],
    "stabilizers": [
      "rotator cuff",
      "middle/lower trapezius",
      "deep trunk muscles"
    ],
    "contractionRoles": [
      "brief concentric redirection",
      "isometric wrist/shoulder control",
      "eccentric return."
    ],
    "commonForceOrSkillDemand": "Low-amplitude impulse absorption and precise timing.",
    "recommendedExercisePatterns": [
      "cable row",
      "one-arm cable press",
      "Pallof press",
      "band internal rotation"
    ],
    "recommendedExercises": [
      "cable row",
      "one-arm cable press",
      "Pallof press",
      "band internal rotation"
    ],
    "transferRationale": "Push-pull and shoulder-control patterns address capacity around the parry, not reactive interception skill.",
    "exerciseSelectionCautions": "Use technically controlled loads and preserve boxing stance; gym exercises share selected force or muscle actions but do not reproduce timing, perception, opponent contact, or guarantee punch performance.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://journals.lww.com/nsca-jscr/fulltext/2020/04000/defining_the_phases_of_boxing_punches__a.22.aspx",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12729554/",
      "https://www.mdpi.com/2076-7363/14/21/9706"
    ],
    "sourceSummary": "The records synthesize peer-reviewed boxing punch and movement biomechanics with a boxing strength-training scoping review; evidence is strongest for general kinetic-chain and conditioning principles, while exercise-to-sport transfer remains an indirect heuristic rather than a causal performance claim."
  },
  {
    "id": "boxing-12",
    "sportId": "boxing",
    "label": "high guard",
    "movementFamily": "guard and close-range control",
    "bodyActions": [
      "Raised forearms and hands protect the head while the trunk and legs absorb contact and preserve posture."
    ],
    "jointActions": [
      "shoulder flexion/abduction",
      "elbow flexion",
      "scapular upward rotation",
      "wrist/forearm isometrics",
      "hip/knee isometric flexion."
    ],
    "primeMovers": [
      "anterior deltoid",
      "biceps brachii",
      "serratus anterior",
      "pectoralis major"
    ],
    "assistingMuscles": [
      "triceps brachii",
      "forearm flexors",
      "quadriceps",
      "gluteus maximus"
    ],
    "stabilizers": [
      "rotator cuff",
      "trapezius",
      "spinal erectors",
      "obliques",
      "gluteus medius"
    ],
    "contractionRoles": [
      "predominantly isometric bracing with eccentric contact absorption and concentric repositioning."
    ],
    "commonForceOrSkillDemand": "Sustained guard endurance and whole-body bracing.",
    "recommendedExercisePatterns": [
      "overhead carry",
      "cable row",
      "split-squat isometric",
      "Pallof press"
    ],
    "recommendedExercises": [
      "overhead carry",
      "cable row",
      "split-squat isometric",
      "Pallof press"
    ],
    "transferRationale": "Carries and isometrics overlap bracing and shoulder endurance; contact tolerance and tactical guard use remain sport-specific.",
    "exerciseSelectionCautions": "Use technically controlled loads and preserve boxing stance; gym exercises share selected force or muscle actions but do not reproduce timing, perception, opponent contact, or guarantee punch performance.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://journals.lww.com/nsca-jscr/fulltext/2020/04000/defining_the_phases_of_boxing_punches__a.22.aspx",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12729554/",
      "https://www.mdpi.com/2076-7363/14/21/9706"
    ],
    "sourceSummary": "The records synthesize peer-reviewed boxing punch and movement biomechanics with a boxing strength-training scoping review; evidence is strongest for general kinetic-chain and conditioning principles, while exercise-to-sport transfer remains an indirect heuristic rather than a causal performance claim."
  },
  {
    "id": "boxing-13",
    "sportId": "boxing",
    "label": "lateral step",
    "movementFamily": "footwork displacement and pivot",
    "bodyActions": [
      "Sideways stance-preserving displacement with controlled push-off and foot placement."
    ],
    "jointActions": [
      "hip abduction/adduction",
      "knee flexion/extension",
      "ankle plantarflexion",
      "trunk anti-lateral-flexion."
    ],
    "primeMovers": [
      "gluteus medius",
      "adductor magnus",
      "gluteus maximus",
      "quadriceps"
    ],
    "assistingMuscles": [
      "hamstrings",
      "gastrocnemius",
      "soleus",
      "obliques"
    ],
    "stabilizers": [
      "foot intrinsics",
      "ankle stabilizers",
      "spinal erectors"
    ],
    "contractionRoles": [
      "concentric push-off",
      "eccentric landing/braking",
      "isometric single-leg control."
    ],
    "commonForceOrSkillDemand": "Lateral acceleration and stance geometry.",
    "recommendedExercisePatterns": [
      "lateral lunge",
      "lateral sled drag",
      "band walks",
      "single-leg balance"
    ],
    "recommendedExercises": [
      "lateral lunge",
      "lateral sled drag",
      "band walks",
      "single-leg balance"
    ],
    "transferRationale": "These patterns share frontal-plane force and unilateral control, but footwork transfer depends on technique and reaction.",
    "exerciseSelectionCautions": "Use technically controlled loads and preserve boxing stance; gym exercises share selected force or muscle actions but do not reproduce timing, perception, opponent contact, or guarantee punch performance.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://journals.lww.com/nsca-jscr/fulltext/2020/04000/defining_the_phases_of_boxing_punches__a.22.aspx",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12729554/",
      "https://www.mdpi.com/2076-7363/14/21/9706"
    ],
    "sourceSummary": "The records synthesize peer-reviewed boxing punch and movement biomechanics with a boxing strength-training scoping review; evidence is strongest for general kinetic-chain and conditioning principles, while exercise-to-sport transfer remains an indirect heuristic rather than a causal performance claim."
  },
  {
    "id": "boxing-14",
    "sportId": "boxing",
    "label": "pivot",
    "movementFamily": "footwork displacement and pivot",
    "bodyActions": [
      "Rotation around a planted or lightly loaded foot to create angle while maintaining balance."
    ],
    "jointActions": [
      "hip internal/external rotation",
      "knee flexion",
      "ankle inversion/eversion and plantarflexion",
      "trunk rotation."
    ],
    "primeMovers": [
      "gluteus maximus",
      "internal/external obliques",
      "deep hip rotators"
    ],
    "assistingMuscles": [
      "gluteus medius",
      "adductors",
      "quadriceps",
      "gastrocnemius"
    ],
    "stabilizers": [
      "foot intrinsics",
      "ankle stabilizers",
      "spinal erectors"
    ],
    "contractionRoles": [
      "concentric rotation",
      "eccentric braking",
      "isometric support-leg control."
    ],
    "commonForceOrSkillDemand": "Transverse-plane reorientation on a narrow base.",
    "recommendedExercisePatterns": [
      "medicine-ball rotational throws",
      "cable chops",
      "single-leg balance",
      "split squat"
    ],
    "recommendedExercises": [
      "medicine-ball rotational throws",
      "cable chops",
      "single-leg balance",
      "split squat"
    ],
    "transferRationale": "Rotational and unilateral patterns overlap pivot support, not the exact foot-ground friction or tactical angle.",
    "exerciseSelectionCautions": "Use technically controlled loads and preserve boxing stance; gym exercises share selected force or muscle actions but do not reproduce timing, perception, opponent contact, or guarantee punch performance.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://journals.lww.com/nsca-jscr/fulltext/2020/04000/defining_the_phases_of_boxing_punches__a.22.aspx",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12729554/",
      "https://www.mdpi.com/2076-7363/14/21/9706"
    ],
    "sourceSummary": "The records synthesize peer-reviewed boxing punch and movement biomechanics with a boxing strength-training scoping review; evidence is strongest for general kinetic-chain and conditioning principles, while exercise-to-sport transfer remains an indirect heuristic rather than a causal performance claim."
  },
  {
    "id": "boxing-15",
    "sportId": "boxing",
    "label": "forward step",
    "movementFamily": "footwork displacement and pivot",
    "bodyActions": [
      "Anterior displacement using lead-leg placement and rear-leg push-off without crossing the stance."
    ],
    "jointActions": [
      "hip/knee extension",
      "ankle plantarflexion",
      "contralateral hip stabilization",
      "trunk anti-flexion."
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps",
      "hamstrings",
      "gastrocnemius"
    ],
    "assistingMuscles": [
      "soleus",
      "adductor magnus",
      "gluteus medius"
    ],
    "stabilizers": [
      "foot/ankle stabilizers",
      "spinal erectors",
      "obliques"
    ],
    "contractionRoles": [
      "concentric propulsion",
      "eccentric landing",
      "isometric balance."
    ],
    "commonForceOrSkillDemand": "Short-burst horizontal acceleration with stance recovery.",
    "recommendedExercisePatterns": [
      "sled push",
      "split squat",
      "calf raise",
      "single-leg balance"
    ],
    "recommendedExercises": [
      "sled push",
      "split squat",
      "calf raise",
      "single-leg balance"
    ],
    "transferRationale": "Horizontal push and unilateral leg training overlap propulsion and support, without replicating boxing distance management.",
    "exerciseSelectionCautions": "Use technically controlled loads and preserve boxing stance; gym exercises share selected force or muscle actions but do not reproduce timing, perception, opponent contact, or guarantee punch performance.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://journals.lww.com/nsca-jscr/fulltext/2020/04000/defining_the_phases_of_boxing_punches__a.22.aspx",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12729554/",
      "https://www.mdpi.com/2076-7363/14/21/9706"
    ],
    "sourceSummary": "The records synthesize peer-reviewed boxing punch and movement biomechanics with a boxing strength-training scoping review; evidence is strongest for general kinetic-chain and conditioning principles, while exercise-to-sport transfer remains an indirect heuristic rather than a causal performance claim."
  },
  {
    "id": "boxing-16",
    "sportId": "boxing",
    "label": "backward step",
    "movementFamily": "footwork displacement and pivot",
    "bodyActions": [
      "Posterior displacement initiated by rear-foot placement and lead-leg push-off with controlled braking."
    ],
    "jointActions": [
      "hip/knee extension and flexion",
      "ankle plantarflexion/dorsiflexion",
      "trunk anti-extension."
    ],
    "primeMovers": [
      "gluteus maximus",
      "hamstrings",
      "quadriceps",
      "gastrocnemius"
    ],
    "assistingMuscles": [
      "soleus",
      "anterior tibialis",
      "gluteus medius",
      "adductors"
    ],
    "stabilizers": [
      "foot/ankle stabilizers",
      "spinal erectors",
      "obliques"
    ],
    "contractionRoles": [
      "concentric propulsion",
      "eccentric braking",
      "isometric stance control."
    ],
    "commonForceOrSkillDemand": "Posterior acceleration and deceleration while preserving guard.",
    "recommendedExercisePatterns": [
      "sled drag",
      "reverse lunge",
      "split squat",
      "single-leg balance"
    ],
    "recommendedExercises": [
      "sled drag",
      "reverse lunge",
      "split squat",
      "single-leg balance"
    ],
    "transferRationale": "Reverse locomotion and unilateral braking share force direction and balance demands, but not opponent-driven decision-making.",
    "exerciseSelectionCautions": "Use technically controlled loads and preserve boxing stance; gym exercises share selected force or muscle actions but do not reproduce timing, perception, opponent contact, or guarantee punch performance.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://journals.lww.com/nsca-jscr/fulltext/2020/04000/defining_the_phases_of_boxing_punches__a.22.aspx",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12729554/",
      "https://www.mdpi.com/2076-7363/14/21/9706"
    ],
    "sourceSummary": "The records synthesize peer-reviewed boxing punch and movement biomechanics with a boxing strength-training scoping review; evidence is strongest for general kinetic-chain and conditioning principles, while exercise-to-sport transfer remains an indirect heuristic rather than a causal performance claim."
  },
  {
    "id": "boxing-17",
    "sportId": "boxing",
    "label": "rotational punch drive",
    "movementFamily": "kinetic-chain power and repeated striking",
    "bodyActions": [
      "Sequential ground reaction, leg extension, pelvic/trunk rotation, and upper-limb acceleration."
    ],
    "jointActions": [
      "ankle plantarflexion",
      "knee/hip extension",
      "pelvic/trunk rotation",
      "shoulder horizontal adduction",
      "elbow extension",
      "scapular protraction."
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps",
      "gastrocnemius",
      "obliques",
      "pectoralis major",
      "anterior deltoid",
      "triceps brachii"
    ],
    "assistingMuscles": [
      "soleus",
      "adductor magnus",
      "serratus anterior",
      "latissimus dorsi"
    ],
    "stabilizers": [
      "rotator cuff",
      "gluteus medius",
      "spinal erectors",
      "foot/ankle stabilizers"
    ],
    "contractionRoles": [
      "concentric whole-chain acceleration",
      "isometric transfer",
      "eccentric deceleration."
    ],
    "commonForceOrSkillDemand": "High-rate proximal-to-distal force sequencing.",
    "recommendedExercisePatterns": [
      "medicine-ball rotational throws",
      "landmine press",
      "push press",
      "cable anti-rotation"
    ],
    "recommendedExercises": [
      "medicine-ball rotational throws",
      "landmine press",
      "push press",
      "cable anti-rotation"
    ],
    "transferRationale": "The exercise combination targets leg drive, rotation, pressing, and trunk linkage emphasized in punch biomechanics, but evidence for direct performance gains is not assumed.",
    "exerciseSelectionCautions": "Use technically controlled loads and preserve boxing stance; gym exercises share selected force or muscle actions but do not reproduce timing, perception, opponent contact, or guarantee punch performance.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://journals.lww.com/nsca-jscr/fulltext/2020/04000/defining_the_phases_of_boxing_punches__a.22.aspx",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12729554/",
      "https://www.mdpi.com/2076-7363/14/21/9706"
    ],
    "sourceSummary": "The records synthesize peer-reviewed boxing punch and movement biomechanics with a boxing strength-training scoping review; evidence is strongest for general kinetic-chain and conditioning principles, while exercise-to-sport transfer remains an indirect heuristic rather than a causal performance claim."
  },
  {
    "id": "boxing-18",
    "sportId": "boxing",
    "label": "level change",
    "movementFamily": "level-change-footwork",
    "bodyActions": [
      "Lowering the center of mass through coordinated leg flexion before displacement or attack."
    ],
    "jointActions": [
      "ankle dorsiflexion",
      "knee flexion/extension",
      "hip flexion/extension",
      "trunk isometric control."
    ],
    "primeMovers": [
      "quadriceps",
      "gluteus maximus",
      "hamstrings",
      "adductor magnus"
    ],
    "assistingMuscles": [
      "gastrocnemius",
      "soleus",
      "gluteus medius",
      "spinal erectors"
    ],
    "stabilizers": [
      "foot/ankle stabilizers",
      "obliques",
      "deep trunk muscles"
    ],
    "contractionRoles": [
      "eccentric lowering",
      "concentric recovery",
      "isometric trunk control."
    ],
    "commonForceOrSkillDemand": "Rapid force absorption and re-acceleration from a lower base.",
    "recommendedExercisePatterns": [
      "front-foot-elevated split squat",
      "goblet squat",
      "lateral squat",
      "split-squat isometric"
    ],
    "recommendedExercises": [
      "front-foot-elevated split squat",
      "goblet squat",
      "lateral squat",
      "split-squat isometric"
    ],
    "transferRationale": "Squat and split-stance patterns share lowering and re-extension, while boxing level changes remain technique- and context-dependent.",
    "exerciseSelectionCautions": "Use technically controlled loads and preserve boxing stance; gym exercises share selected force or muscle actions but do not reproduce timing, perception, opponent contact, or guarantee punch performance.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://journals.lww.com/nsca-jscr/fulltext/2020/04000/defining_the_phases_of_boxing_punches__a.22.aspx",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12729554/",
      "https://www.mdpi.com/2076-7363/14/21/9706"
    ],
    "sourceSummary": "The records synthesize peer-reviewed boxing punch and movement biomechanics with a boxing strength-training scoping review; evidence is strongest for general kinetic-chain and conditioning principles, while exercise-to-sport transfer remains an indirect heuristic rather than a causal performance claim."
  },
  {
    "id": "boxing-19",
    "sportId": "boxing",
    "label": "clinch control",
    "movementFamily": "guard and close-range control",
    "bodyActions": [
      "Close-range isometric pushing, pulling, framing, and trunk bracing while adjusting hip position."
    ],
    "jointActions": [
      "shoulder adduction/flexion",
      "elbow flexion",
      "scapular retraction/depression",
      "trunk anti-rotation",
      "hip/knee isometrics."
    ],
    "primeMovers": [
      "latissimus dorsi",
      "pectoralis major",
      "biceps brachii",
      "forearm flexors",
      "obliques"
    ],
    "assistingMuscles": [
      "posterior deltoid",
      "triceps brachii",
      "gluteus maximus",
      "adductor magnus"
    ],
    "stabilizers": [
      "rotator cuff",
      "trapezius",
      "serratus anterior",
      "spinal erectors",
      "gluteus medius"
    ],
    "contractionRoles": [
      "predominantly isometric with short concentric/eccentric positional changes."
    ],
    "commonForceOrSkillDemand": "Sustained contact force, grip, and posture under pressure.",
    "recommendedExercisePatterns": [
      "farmer carry",
      "cable row",
      "one-arm cable press",
      "Pallof press"
    ],
    "recommendedExercises": [
      "farmer carry",
      "cable row",
      "one-arm cable press",
      "Pallof press"
    ],
    "transferRationale": "Carries and push-pull bracing overlap contact posture and grip capacity, but clinch skill and legal context are not reproduced.",
    "exerciseSelectionCautions": "Use technically controlled loads and preserve boxing stance; gym exercises share selected force or muscle actions but do not reproduce timing, perception, opponent contact, or guarantee punch performance.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://journals.lww.com/nsca-jscr/fulltext/2020/04000/defining_the_phases_of_boxing_punches__a.22.aspx",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12729554/",
      "https://www.mdpi.com/2076-7363/14/21/9706"
    ],
    "sourceSummary": "The records synthesize peer-reviewed boxing punch and movement biomechanics with a boxing strength-training scoping review; evidence is strongest for general kinetic-chain and conditioning principles, while exercise-to-sport transfer remains an indirect heuristic rather than a causal performance claim."
  },
  {
    "id": "boxing-20",
    "sportId": "boxing",
    "label": "explosive combination punching",
    "movementFamily": "repeated-striking-combination",
    "bodyActions": [
      "Repeated straight and rotational punches linked by weight shifts, footwork, guard recovery, and fatigue-resistant rhythm."
    ],
    "jointActions": [
      "ankle/knee/hip extension",
      "trunk rotation",
      "shoulder flexion/horizontal adduction",
      "elbow extension",
      "scapular protraction/retraction."
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps",
      "gastrocnemius",
      "external oblique",
      "internal oblique",
      "pectoralis major",
      "anterior deltoid",
      "triceps brachii",
      "serratus anterior"
    ],
    "assistingMuscles": [
      "hamstrings",
      "soleus",
      "adductor magnus",
      "latissimus dorsi",
      "biceps brachii"
    ],
    "stabilizers": [
      "rotator cuff",
      "trapezius",
      "gluteus medius",
      "spinal erectors",
      "foot/ankle stabilizers"
    ],
    "contractionRoles": [
      "repeated concentric accelerations",
      "isometric force transfer",
      "eccentric braking and guard recovery."
    ],
    "commonForceOrSkillDemand": "Repeated high-output efforts with technical sequencing and local fatigue resistance.",
    "recommendedExercisePatterns": [
      "medicine-ball rotational throws",
      "push press",
      "sled push",
      "cable anti-rotation"
    ],
    "recommendedExercises": [
      "medicine-ball rotational throws",
      "push press",
      "sled push",
      "cable anti-rotation"
    ],
    "transferRationale": "Ballistic whole-body work plus leg drive and anti-rotation overlaps repeated combination demands; conditioning and skill transfer remain indirect.",
    "exerciseSelectionCautions": "Use technically controlled loads and preserve boxing stance; gym exercises share selected force or muscle actions but do not reproduce timing, perception, opponent contact, or guarantee punch performance.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://journals.lww.com/nsca-jscr/fulltext/2020/04000/defining_the_phases_of_boxing_punches__a.22.aspx",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12729554/",
      "https://www.mdpi.com/2076-7363/14/21/9706"
    ],
    "sourceSummary": "The records synthesize peer-reviewed boxing punch and movement biomechanics with a boxing strength-training scoping review; evidence is strongest for general kinetic-chain and conditioning principles, while exercise-to-sport transfer remains an indirect heuristic rather than a causal performance claim."
  },
  {
    "id": "mma-1",
    "sportId": "mma",
    "label": "jab",
    "movementFamily": "straight-line striking",
    "bodyActions": [
      "stance pressure, lead-arm shoulder flexion and elbow extension, rapid guard recovery"
    ],
    "jointActions": [
      "ankle plantar flexion",
      "knee/hip extension",
      "shoulder flexion",
      "elbow extension",
      "scapular protraction"
    ],
    "primeMovers": [
      "pectoralis major",
      "anterior deltoid",
      "triceps brachii"
    ],
    "assistingMuscles": [
      "serratus anterior",
      "rotator cuff",
      "gluteus maximus",
      "gastrocnemius"
    ],
    "stabilizers": [
      "transversus abdominis",
      "obliquus internus and externus",
      "gluteus medius",
      "forearm flexors"
    ],
    "contractionRoles": [
      "concentric projection",
      "eccentric retraction",
      "isometric stance and trunk bracing"
    ],
    "commonForceOrSkillDemand": "high-rate linear impulse with balance and repeatability",
    "recommendedExercisePatterns": [
      "cable press",
      "landmine punch",
      "medicine-ball chest pass",
      "push-up"
    ],
    "recommendedExercises": [
      "cable press",
      "landmine punch",
      "medicine-ball chest pass",
      "push-up"
    ],
    "transferRationale": "Gym patterns share linear pushing, proximal-to-distal sequencing, and guard-recovery bracing, but they do not reproduce timing, targeting, or opponent interaction.",
    "exerciseSelectionCautions": "Keep the load light enough for fast, controlled retraction; avoid shoulder or wrist pain and do not equate gym force with punch effectiveness",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://journals.lww.com/nsca-scj/fulltext/2013/10000/Evidence_Based_Guidelines_for_Strength_and.15.aspx",
      "https://www.tandfonline.com/doi/abs/10.1080/02640414.2020.1802093",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6714373/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed MMA and combat-sport biomechanics/conditioning reviews plus grappling-action research, while treating exercise-to-sport transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "mma-2",
    "sportId": "mma",
    "label": "cross",
    "movementFamily": "rotational striking",
    "bodyActions": [
      "rear-side drive, pelvis-trunk rotation, shoulder horizontal adduction and elbow extension"
    ],
    "jointActions": [
      "rear-foot pivot",
      "hip internal rotation",
      "trunk rotation",
      "shoulder horizontal adduction",
      "elbow extension"
    ],
    "primeMovers": [
      "pectoralis major",
      "anterior deltoid",
      "triceps brachii",
      "internal and external obliques"
    ],
    "assistingMuscles": [
      "gluteus maximus",
      "adductor magnus",
      "serratus anterior",
      "latissimus dorsi"
    ],
    "stabilizers": [
      "gluteus medius",
      "soleus",
      "rotator cuff",
      "erector spinae"
    ],
    "contractionRoles": [
      "concentric rotation and strike",
      "eccentric braking",
      "isometric foot and trunk control"
    ],
    "commonForceOrSkillDemand": "high-rate transverse-plane force transfer",
    "recommendedExercisePatterns": [
      "split-stance cable punch",
      "landmine rotational press",
      "medicine-ball rotational throw",
      "cable chop"
    ],
    "recommendedExercises": [
      "split-stance cable punch",
      "landmine rotational press",
      "medicine-ball rotational throw",
      "cable chop"
    ],
    "transferRationale": "The overlap is rotational sequencing from the ground through pelvis and trunk to the arm; technical velocity and impact mechanics remain sport-specific.",
    "exerciseSelectionCautions": "Control the pivot and lumbar position; progress rotational speed before load and avoid forcing end-range spinal rotation",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://journals.lww.com/nsca-scj/fulltext/2013/10000/Evidence_Based_Guidelines_for_Strength_and.15.aspx",
      "https://www.tandfonline.com/doi/abs/10.1080/02640414.2020.1802093",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6714373/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed MMA and combat-sport biomechanics/conditioning reviews plus grappling-action research, while treating exercise-to-sport transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "mma-3",
    "sportId": "mma",
    "label": "hook",
    "movementFamily": "rotational striking",
    "bodyActions": [
      "compact lead or rear arm arc with pelvis and trunk rotation and shoulder horizontal adduction"
    ],
    "jointActions": [
      "hip and trunk rotation",
      "shoulder horizontal adduction",
      "elbow flexion",
      "scapular protraction"
    ],
    "primeMovers": [
      "pectoralis major",
      "anterior deltoid",
      "obliquus internus and externus"
    ],
    "assistingMuscles": [
      "gluteus maximus",
      "adductor magnus",
      "serratus anterior",
      "biceps brachii"
    ],
    "stabilizers": [
      "rotator cuff",
      "gluteus medius",
      "soleus",
      "erector spinae"
    ],
    "contractionRoles": [
      "concentric arc",
      "eccentric arm recovery and trunk braking",
      "isometric base"
    ],
    "commonForceOrSkillDemand": "short-lever rotational acceleration and deceleration",
    "recommendedExercisePatterns": [
      "landmine rotational press",
      "cable rotational punch",
      "medicine-ball rotational throw",
      "split-stance cable press"
    ],
    "recommendedExercises": [
      "landmine rotational press",
      "cable rotational punch",
      "medicine-ball rotational throw",
      "split-stance cable press"
    ],
    "transferRationale": "Compact rotational pressing and medicine-ball work train shared trunk-to-arm force direction and braking demands without claiming direct transfer.",
    "exerciseSelectionCautions": "Use a compact elbow path, no ballistic loaded shoulder end range, and stop if anterior shoulder symptoms appear",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://journals.lww.com/nsca-scj/fulltext/2013/10000/Evidence_Based_Guidelines_for_Strength_and.15.aspx",
      "https://www.tandfonline.com/doi/abs/10.1080/02640414.2020.1802093",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6714373/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed MMA and combat-sport biomechanics/conditioning reviews plus grappling-action research, while treating exercise-to-sport transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "mma-4",
    "sportId": "mma",
    "label": "roundhouse kick",
    "movementFamily": "rotational kicking",
    "bodyActions": [
      "support-leg pivot, hip circumduction, knee extension and foot/leg impact preparation"
    ],
    "jointActions": [
      "support ankle plantar flexion and rotation",
      "hip extension/abduction/internal rotation",
      "knee extension",
      "trunk rotation"
    ],
    "primeMovers": [
      "gluteus maximus",
      "gluteus medius",
      "quadriceps femoris",
      "adductor magnus"
    ],
    "assistingMuscles": [
      "hamstring muscles",
      "gastrocnemius",
      "soleus",
      "iliopsoas"
    ],
    "stabilizers": [
      "tensor fasciae latae",
      "intrinsic foot muscles",
      "obliques",
      "soleus of support leg"
    ],
    "contractionRoles": [
      "concentric swing",
      "eccentric deceleration",
      "isometric single-leg balance"
    ],
    "commonForceOrSkillDemand": "high-speed unilateral rotation with impact tolerance and balance",
    "recommendedExercisePatterns": [
      "cable hip rotation",
      "split squat",
      "single-leg RDL",
      "landmine rotational press"
    ],
    "recommendedExercises": [
      "cable hip rotation",
      "split squat",
      "single-leg RDL",
      "landmine rotational press"
    ],
    "transferRationale": "These patterns address unilateral hip force, pivot control, and trunk rotation; they do not model kicking technique, range, or impact surface.",
    "exerciseSelectionCautions": "Prioritize a stable support foot and pelvis; do not add load to painful knee or hip rotation and use technical coaching for impact work",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://journals.lww.com/nsca-scj/fulltext/2013/10000/Evidence_Based_Guidelines_for_Strength_and.15.aspx",
      "https://www.tandfonline.com/doi/abs/10.1080/02640414.2020.1802093",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6714373/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed MMA and combat-sport biomechanics/conditioning reviews plus grappling-action research, while treating exercise-to-sport transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "mma-5",
    "sportId": "mma",
    "label": "front kick",
    "movementFamily": "linear kicking",
    "bodyActions": [
      "single-leg stance, hip flexion and knee extension, then rapid recoil"
    ],
    "jointActions": [
      "support-leg ankle/knee/hip stabilization",
      "kicking hip flexion",
      "knee extension",
      "trunk anti-extension"
    ],
    "primeMovers": [
      "iliopsoas",
      "rectus femoris",
      "quadriceps femoris",
      "tibialis anterior"
    ],
    "assistingMuscles": [
      "gluteus medius",
      "gluteus maximus",
      "hamstring muscles",
      "abdominal muscles"
    ],
    "stabilizers": [
      "soleus",
      "intrinsic foot muscles",
      "obliques",
      "erector spinae"
    ],
    "contractionRoles": [
      "concentric knee drive and extension",
      "eccentric recoil",
      "isometric support-leg bracing"
    ],
    "commonForceOrSkillDemand": "linear leg projection from a unilateral base",
    "recommendedExercisePatterns": [
      "cable knee drive",
      "split squat",
      "single-leg balance reach",
      "Pallof press"
    ],
    "recommendedExercises": [
      "cable knee drive",
      "split squat",
      "single-leg balance reach",
      "Pallof press"
    ],
    "transferRationale": "Cable knee-drive and unilateral patterns share hip flexion, knee extension, and support-leg control, while the kick remains skill- and distance-dependent.",
    "exerciseSelectionCautions": "Do not overload the knee extension or force hip range; maintain neutral trunk and use low resistance for speed",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://journals.lww.com/nsca-scj/fulltext/2013/10000/Evidence_Based_Guidelines_for_Strength_and.15.aspx",
      "https://www.tandfonline.com/doi/abs/10.1080/02640414.2020.1802093",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6714373/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed MMA and combat-sport biomechanics/conditioning reviews plus grappling-action research, while treating exercise-to-sport transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "mma-6",
    "sportId": "mma",
    "label": "knee strike",
    "movementFamily": "close-range linear striking",
    "bodyActions": [
      "hip flexion drive with close-range trunk bracing and possible pull from the arms"
    ],
    "jointActions": [
      "hip flexion",
      "knee flexion during chamber",
      "trunk flexion or anti-extension",
      "shoulder/elbow pulling"
    ],
    "primeMovers": [
      "iliopsoas",
      "rectus femoris",
      "pectineus",
      "rectus abdominis"
    ],
    "assistingMuscles": [
      "adductor longus",
      "gluteus maximus",
      "latissimus dorsi",
      "biceps brachii"
    ],
    "stabilizers": [
      "obliques",
      "gluteus medius",
      "erector spinae",
      "forearm flexors"
    ],
    "contractionRoles": [
      "concentric knee drive",
      "eccentric return",
      "isometric clinch and trunk control"
    ],
    "commonForceOrSkillDemand": "repeated high-rate hip drive against a constrained posture",
    "recommendedExercisePatterns": [
      "cable knee drive",
      "hanging knee raise",
      "bear-hug carry",
      "split squat"
    ],
    "recommendedExercises": [
      "cable knee drive",
      "hanging knee raise",
      "bear-hug carry",
      "split squat"
    ],
    "transferRationale": "The rationale is shared hip-drive, trunk-bracing, and clinch-like load carriage; no exercise is evidence of improved knee-strike damage.",
    "exerciseSelectionCautions": "Avoid lumbar flexion compensation and excessive hip-flexor volume; use a stable anchor and controlled range",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://journals.lww.com/nsca-scj/fulltext/2013/10000/Evidence_Based_Guidelines_for_Strength_and.15.aspx",
      "https://www.tandfonline.com/doi/abs/10.1080/02640414.2020.1802093",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6714373/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed MMA and combat-sport biomechanics/conditioning reviews plus grappling-action research, while treating exercise-to-sport transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "mma-7",
    "sportId": "mma",
    "label": "elbow strike",
    "movementFamily": "compact rotational striking",
    "bodyActions": [
      "short-range shoulder and elbow motion with trunk rotation and stable base"
    ],
    "jointActions": [
      "trunk rotation",
      "shoulder flexion/horizontal adduction",
      "elbow flexion or extension",
      "scapular protraction"
    ],
    "primeMovers": [
      "pectoralis major",
      "anterior deltoid",
      "triceps brachii",
      "obliques"
    ],
    "assistingMuscles": [
      "serratus anterior",
      "latissimus dorsi",
      "gluteus maximus",
      "adductor magnus"
    ],
    "stabilizers": [
      "rotator cuff",
      "gluteus medius",
      "erector spinae",
      "forearm muscles"
    ],
    "contractionRoles": [
      "concentric compact strike",
      "eccentric recovery",
      "isometric base and guard"
    ],
    "commonForceOrSkillDemand": "short-lever acceleration under close-range constraints",
    "recommendedExercisePatterns": [
      "half-kneeling cable punch",
      "cable chop",
      "landmine press",
      "push-up"
    ],
    "recommendedExercises": [
      "half-kneeling cable punch",
      "cable chop",
      "landmine press",
      "push-up"
    ],
    "transferRationale": "Half-kneeling and cable patterns constrain the base while linking trunk rotation to compact upper-limb action; contact skill is not reproduced.",
    "exerciseSelectionCautions": "Keep shoulder centration and avoid loaded elbow hyperextension; train speed and positioning rather than maximal resistance",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://journals.lww.com/nsca-scj/fulltext/2013/10000/Evidence_Based_Guidelines_for_Strength_and.15.aspx",
      "https://www.tandfonline.com/doi/abs/10.1080/02640414.2020.1802093",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6714373/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed MMA and combat-sport biomechanics/conditioning reviews plus grappling-action research, while treating exercise-to-sport transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "mma-8",
    "sportId": "mma",
    "label": "double-leg takedown",
    "movementFamily": "shot entry and bilateral takedown",
    "bodyActions": [
      "level change, penetration step, bilateral leg drive, lift or finish, and trunk brace"
    ],
    "jointActions": [
      "hip/knee flexion then extension",
      "ankle dorsiflexion/plantar flexion",
      "shoulder extension/adduction",
      "elbow flexion",
      "trunk anti-flexion"
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus maximus",
      "adductor magnus",
      "latissimus dorsi"
    ],
    "assistingMuscles": [
      "hamstring muscles",
      "gastrocnemius",
      "pectoralis major",
      "biceps brachii"
    ],
    "stabilizers": [
      "erector spinae",
      "transversus abdominis",
      "gluteus medius",
      "forearm flexors"
    ],
    "contractionRoles": [
      "eccentric level change",
      "concentric drive",
      "isometric squeeze and trunk stiffness"
    ],
    "commonForceOrSkillDemand": "rapid low-position force application with horizontal propulsion",
    "recommendedExercisePatterns": [
      "front squat",
      "sled push",
      "split-stance row",
      "farmer carry"
    ],
    "recommendedExercises": [
      "front squat",
      "sled push",
      "split-stance row",
      "farmer carry"
    ],
    "transferRationale": "These exercises overlap bilateral leg drive, low posture, pulling, and loaded locomotion identified in MMA conditioning reviews, but cannot substitute for coached penetration mechanics.",
    "exerciseSelectionCautions": "Do not chase depth or load at the expense of spinal position; separate heavy strength from high-volume technical shots",
    "evidenceConfidence": "high",
    "sources": [
      "https://journals.lww.com/nsca-scj/fulltext/2013/10000/Evidence_Based_Guidelines_for_Strength_and.15.aspx",
      "https://www.tandfonline.com/doi/abs/10.1080/02640414.2020.1802093",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6714373/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed MMA and combat-sport biomechanics/conditioning reviews plus grappling-action research, while treating exercise-to-sport transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "mma-9",
    "sportId": "mma",
    "label": "single-leg takedown",
    "movementFamily": "unilateral takedown",
    "bodyActions": [
      "level change, single-leg capture, posture control, running-the-pipe or finish"
    ],
    "jointActions": [
      "stance-leg hip/knee/ankle stabilization",
      "captured-leg hip flexion",
      "shoulder extension",
      "elbow flexion",
      "trunk anti-rotation"
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps femoris",
      "adductor magnus",
      "latissimus dorsi"
    ],
    "assistingMuscles": [
      "hamstring muscles",
      "biceps brachii",
      "pectoralis major",
      "brachialis"
    ],
    "stabilizers": [
      "gluteus medius",
      "soleus",
      "obliques",
      "forearm flexors"
    ],
    "contractionRoles": [
      "eccentric entry",
      "concentric drive and lift",
      "isometric grip and anti-rotation"
    ],
    "commonForceOrSkillDemand": "unilateral force and balance while manipulating an external mass",
    "recommendedExercisePatterns": [
      "rear-foot-elevated split squat",
      "single-leg RDL",
      "suitcase carry",
      "split-stance row"
    ],
    "recommendedExercises": [
      "rear-foot-elevated split squat",
      "single-leg RDL",
      "suitcase carry",
      "split-stance row"
    ],
    "transferRationale": "Unilateral lower-limb strength, anti-rotation, and pulling have mechanical overlap with a single-leg finish, but opponent balance and technique dominate outcomes.",
    "exerciseSelectionCautions": "Use supported progressions for balance; avoid twisting under load and keep the knee aligned over the foot",
    "evidenceConfidence": "high",
    "sources": [
      "https://journals.lww.com/nsca-scj/fulltext/2013/10000/Evidence_Based_Guidelines_for_Strength_and.15.aspx",
      "https://www.tandfonline.com/doi/abs/10.1080/02640414.2020.1802093",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6714373/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed MMA and combat-sport biomechanics/conditioning reviews plus grappling-action research, while treating exercise-to-sport transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "mma-10",
    "sportId": "mma",
    "label": "sprawl",
    "movementFamily": "defensive hip extension and anti-shot",
    "bodyActions": [
      "rapid hip extension and leg projection back while hands post and trunk resists collapse"
    ],
    "jointActions": [
      "hip extension",
      "knee extension",
      "ankle plantar flexion",
      "shoulder flexion/protraction",
      "trunk anti-flexion"
    ],
    "primeMovers": [
      "gluteus maximus",
      "hamstring muscles",
      "quadriceps femoris",
      "serratus anterior"
    ],
    "assistingMuscles": [
      "triceps brachii",
      "pectoralis major",
      "gastrocnemius",
      "erector spinae"
    ],
    "stabilizers": [
      "transversus abdominis",
      "obliques",
      "rotator cuff",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "rapid concentric hip extension",
      "eccentric landing/braking",
      "isometric post and brace"
    ],
    "commonForceOrSkillDemand": "reactive whole-body braking and hip displacement",
    "recommendedExercisePatterns": [
      "hip hinge",
      "sprawled plank hold",
      "sled push",
      "broad jump and stick"
    ],
    "recommendedExercises": [
      "hip hinge",
      "sprawled plank hold",
      "sled push",
      "broad jump and stick"
    ],
    "transferRationale": "Hip-hinge power, posting strength, and braking are shared qualities, but a sprawl is a reactive technical action rather than a generic conditioning drill.",
    "exerciseSelectionCautions": "Land softly with ribs controlled; scale impact and wrist loading, and avoid repeated fatigue-induced lumbar hyperextension",
    "evidenceConfidence": "high",
    "sources": [
      "https://journals.lww.com/nsca-scj/fulltext/2013/10000/Evidence_Based_Guidelines_for_Strength_and.15.aspx",
      "https://www.tandfonline.com/doi/abs/10.1080/02640414.2020.1802093",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6714373/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed MMA and combat-sport biomechanics/conditioning reviews plus grappling-action research, while treating exercise-to-sport transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "mma-11",
    "sportId": "mma",
    "label": "body-lock takedown",
    "movementFamily": "clinch lifting and rotation",
    "bodyActions": [
      "close-range trunk compression, hip extension, lift, rotation, and controlled descent"
    ],
    "jointActions": [
      "hip/knee extension",
      "trunk rotation",
      "shoulder extension/adduction",
      "elbow flexion",
      "forearm grip"
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps femoris",
      "adductor magnus",
      "latissimus dorsi"
    ],
    "assistingMuscles": [
      "hamstring muscles",
      "pectoralis major",
      "biceps brachii",
      "obliques"
    ],
    "stabilizers": [
      "erector spinae",
      "transversus abdominis",
      "gluteus medius",
      "forearm flexors"
    ],
    "contractionRoles": [
      "concentric lift and turn",
      "eccentric lowering",
      "isometric lock and brace"
    ],
    "commonForceOrSkillDemand": "heavy proximal force with rotational repositioning",
    "recommendedExercisePatterns": [
      "bear-hug carry",
      "Romanian deadlift",
      "rotational sandbag lift",
      "Pallof press"
    ],
    "recommendedExercises": [
      "bear-hug carry",
      "Romanian deadlift",
      "rotational sandbag lift",
      "Pallof press"
    ],
    "transferRationale": "Carries and hinges share hip extension, trunk stiffness, and close-load control; they are preparatory patterns, not proof of better takedown success.",
    "exerciseSelectionCautions": "Use a neutral spine and safe object height; never practice loaded rotation by wrenching the lumbar spine",
    "evidenceConfidence": "high",
    "sources": [
      "https://journals.lww.com/nsca-scj/fulltext/2013/10000/Evidence_Based_Guidelines_for_Strength_and.15.aspx",
      "https://www.tandfonline.com/doi/abs/10.1080/02640414.2020.1802093",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6714373/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed MMA and combat-sport biomechanics/conditioning reviews plus grappling-action research, while treating exercise-to-sport transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "mma-12",
    "sportId": "mma",
    "label": "hip throw",
    "movementFamily": "rotational throwing",
    "bodyActions": [
      "hip entry, body positioning, trunk rotation, leg drive and controlled projection"
    ],
    "jointActions": [
      "hip flexion then extension",
      "knee extension",
      "trunk rotation",
      "shoulder flexion/adduction",
      "elbow flexion"
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps femoris",
      "obliques",
      "latissimus dorsi"
    ],
    "assistingMuscles": [
      "adductor magnus",
      "hamstring muscles",
      "pectoralis major",
      "biceps brachii"
    ],
    "stabilizers": [
      "erector spinae",
      "gluteus medius",
      "rotator cuff",
      "forearm flexors"
    ],
    "contractionRoles": [
      "eccentric entry",
      "concentric lift/rotation",
      "isometric belt control"
    ],
    "commonForceOrSkillDemand": "whole-body rotational lift with a close external load",
    "recommendedExercisePatterns": [
      "sandbag shouldering",
      "clean pull",
      "split-stance rotational lift",
      "front squat"
    ],
    "recommendedExercises": [
      "sandbag shouldering",
      "clean pull",
      "split-stance rotational lift",
      "front squat"
    ],
    "transferRationale": "Close-load lifting and rotational sequencing are relevant preparation, while throw timing, kuzushi, and safe falling require coached practice.",
    "exerciseSelectionCautions": "Use a soft implement and technical progression; avoid maximal-load twisting or uncontrolled throws",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://journals.lww.com/nsca-scj/fulltext/2013/10000/Evidence_Based_Guidelines_for_Strength_and.15.aspx",
      "https://www.tandfonline.com/doi/abs/10.1080/02640414.2020.1802093",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6714373/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed MMA and combat-sport biomechanics/conditioning reviews plus grappling-action research, while treating exercise-to-sport transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "mma-13",
    "sportId": "mma",
    "label": "technical stand-up",
    "movementFamily": "ground-to-standing transition",
    "bodyActions": [
      "posting, hip withdrawal, guarded rise, and stable stance re-entry"
    ],
    "jointActions": [
      "shoulder extension/abduction",
      "hip flexion then extension",
      "knee extension",
      "ankle stabilization",
      "trunk anti-rotation"
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus maximus",
      "triceps brachii",
      "deltoid"
    ],
    "assistingMuscles": [
      "hamstring muscles",
      "iliopsoas",
      "serratus anterior",
      "obliques"
    ],
    "stabilizers": [
      "rotator cuff",
      "gluteus medius",
      "soleus",
      "transversus abdominis"
    ],
    "contractionRoles": [
      "isometric post",
      "concentric stand",
      "eccentric sit-down and protective control"
    ],
    "commonForceOrSkillDemand": "asymmetric ground-to-standing force and balance",
    "recommendedExercisePatterns": [
      "Turkish get-up",
      "half-kneeling press",
      "sit-to-stand",
      "suitcase carry"
    ],
    "recommendedExercises": [
      "Turkish get-up",
      "half-kneeling press",
      "sit-to-stand",
      "suitcase carry"
    ],
    "transferRationale": "Get-up and asymmetric carry patterns overlap posting, trunk control, and transition, but tactical guard and opponent threat are not represented.",
    "exerciseSelectionCautions": "Progress slowly, protect the posting wrist/shoulder, and use a stable surface before adding load",
    "evidenceConfidence": "high",
    "sources": [
      "https://journals.lww.com/nsca-scj/fulltext/2013/10000/Evidence_Based_Guidelines_for_Strength_and.15.aspx",
      "https://www.tandfonline.com/doi/abs/10.1080/02640414.2020.1802093",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6714373/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed MMA and combat-sport biomechanics/conditioning reviews plus grappling-action research, while treating exercise-to-sport transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "mma-14",
    "sportId": "mma",
    "label": "guard retention",
    "movementFamily": "ground mobility and framing",
    "bodyActions": [
      "hip flexion/abduction, pummeling legs, framing, and anti-rotation while maintaining space"
    ],
    "jointActions": [
      "hip flexion/abduction/external rotation",
      "shoulder flexion",
      "elbow extension",
      "trunk rotation"
    ],
    "primeMovers": [
      "iliopsoas",
      "gluteus medius",
      "adductor muscles",
      "serratus anterior"
    ],
    "assistingMuscles": [
      "rectus abdominis",
      "obliques",
      "pectoralis major",
      "triceps brachii"
    ],
    "stabilizers": [
      "rotator cuff",
      "deep hip rotators",
      "transversus abdominis",
      "neck flexors"
    ],
    "contractionRoles": [
      "isometric frames",
      "concentric hip repositioning",
      "eccentric return"
    ],
    "commonForceOrSkillDemand": "continuous grounded mobility and frame resistance",
    "recommendedExercisePatterns": [
      "hip switch",
      "Copenhagen plank",
      "dead bug",
      "Pallof press"
    ],
    "recommendedExercises": [
      "hip switch",
      "Copenhagen plank",
      "dead bug",
      "Pallof press"
    ],
    "transferRationale": "These patterns develop hip control, adductor capacity, and trunk anti-rotation that support ground movement, without claiming direct guard-retention improvement.",
    "exerciseSelectionCautions": "Use pain-free hip abduction and shoulder flexion; avoid forcing inversion or fatigue-driven cervical loading",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://journals.lww.com/nsca-scj/fulltext/2013/10000/Evidence_Based_Guidelines_for_Strength_and.15.aspx",
      "https://www.tandfonline.com/doi/abs/10.1080/02640414.2020.1802093",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6714373/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed MMA and combat-sport biomechanics/conditioning reviews plus grappling-action research, while treating exercise-to-sport transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "mma-15",
    "sportId": "mma",
    "label": "bridge-and-shrimp escape",
    "movementFamily": "ground bridging and hip escape",
    "bodyActions": [
      "hip extension bridge, lateral trunk curl, foot post, and space-creating hip translation"
    ],
    "jointActions": [
      "hip extension",
      "trunk lateral flexion/rotation",
      "hip abduction",
      "shoulder/elbow framing"
    ],
    "primeMovers": [
      "gluteus maximus",
      "hamstring muscles",
      "obliques",
      "gluteus medius"
    ],
    "assistingMuscles": [
      "adductor muscles",
      "rectus abdominis",
      "pectoralis major",
      "triceps brachii"
    ],
    "stabilizers": [
      "transversus abdominis",
      "deep hip rotators",
      "shoulder stabilizers",
      "neck flexors"
    ],
    "contractionRoles": [
      "concentric bridge/shrimp",
      "eccentric repositioning",
      "isometric frame"
    ],
    "commonForceOrSkillDemand": "short-burst hip displacement against bodyweight or pressure",
    "recommendedExercisePatterns": [
      "hip thrust",
      "lateral bear crawl",
      "dead bug",
      "Copenhagen plank"
    ],
    "recommendedExercises": [
      "hip thrust",
      "lateral bear crawl",
      "dead bug",
      "Copenhagen plank"
    ],
    "transferRationale": "Hip extension, lateral trunk control, and framed bracing overlap with the physical components of an escape; technique and opponent pressure remain decisive.",
    "exerciseSelectionCautions": "Keep the neck neutral and do not bridge through painful lumbar extension; use low-load high-quality repetitions",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://journals.lww.com/nsca-scj/fulltext/2013/10000/Evidence_Based_Guidelines_for_Strength_and.15.aspx",
      "https://www.tandfonline.com/doi/abs/10.1080/02640414.2020.1802093",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6714373/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed MMA and combat-sport biomechanics/conditioning reviews plus grappling-action research, while treating exercise-to-sport transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "mma-16",
    "sportId": "mma",
    "label": "ground-and-pound",
    "movementFamily": "top-control striking",
    "bodyActions": [
      "top-position base, shoulder flexion/horizontal adduction, elbow extension, and trunk rotation"
    ],
    "jointActions": [
      "hip/knee stabilization",
      "shoulder flexion/horizontal adduction",
      "elbow extension",
      "scapular protraction",
      "trunk rotation"
    ],
    "primeMovers": [
      "pectoralis major",
      "anterior deltoid",
      "triceps brachii",
      "serratus anterior"
    ],
    "assistingMuscles": [
      "latissimus dorsi",
      "obliques",
      "gluteus maximus",
      "rectus abdominis"
    ],
    "stabilizers": [
      "rotator cuff",
      "scapular stabilizers",
      "forearm flexors",
      "adductor muscles"
    ],
    "contractionRoles": [
      "concentric strike",
      "eccentric recovery",
      "isometric base and positional pressure"
    ],
    "commonForceOrSkillDemand": "repeated upper-limb impulse from a constrained base",
    "recommendedExercisePatterns": [
      "half-kneeling cable punch",
      "push-up",
      "front-rack hold",
      "Pallof press"
    ],
    "recommendedExercises": [
      "half-kneeling cable punch",
      "push-up",
      "front-rack hold",
      "Pallof press"
    ],
    "transferRationale": "Half-kneeling pushing and front-rack bracing share constrained-base force transfer; they do not establish greater ground-and-pound effectiveness.",
    "exerciseSelectionCautions": "Avoid high-volume ballistic shoulder loading and wrist collapse; prioritize a stable base and controlled range",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://journals.lww.com/nsca-scj/fulltext/2013/10000/Evidence_Based_Guidelines_for_Strength_and.15.aspx",
      "https://www.tandfonline.com/doi/abs/10.1080/02640414.2020.1802093",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6714373/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed MMA and combat-sport biomechanics/conditioning reviews plus grappling-action research, while treating exercise-to-sport transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "mma-17",
    "sportId": "mma",
    "label": "clinch pummeling",
    "movementFamily": "clinch hand-fighting",
    "bodyActions": [
      "reciprocal arm swimming, scapular motion, frames, posture, and foot repositioning"
    ],
    "jointActions": [
      "shoulder internal/external rotation",
      "elbow flexion/extension",
      "scapular protraction/retraction",
      "trunk anti-rotation"
    ],
    "primeMovers": [
      "deltoid",
      "pectoralis major",
      "latissimus dorsi",
      "biceps brachii"
    ],
    "assistingMuscles": [
      "triceps brachii",
      "serratus anterior",
      "forearm flexors",
      "lower trapezius"
    ],
    "stabilizers": [
      "rotator cuff",
      "obliques",
      "gluteus medius",
      "soleus"
    ],
    "contractionRoles": [
      "alternating concentric actions",
      "eccentric partner-force control",
      "isometric grip and posture"
    ],
    "commonForceOrSkillDemand": "repeated upper-body force under stance and contact constraints",
    "recommendedExercisePatterns": [
      "banded hand-fighting",
      "face pull",
      "row",
      "anti-rotation hold"
    ],
    "recommendedExercises": [
      "banded hand-fighting",
      "face pull",
      "row",
      "anti-rotation hold"
    ],
    "transferRationale": "Rows, face pulls, and anti-rotation work address scapular control, pulling, and posture; partner timing and tactile skill require live practice.",
    "exerciseSelectionCautions": "Avoid aggressive end-range shoulder rotation and excessive shrugging; keep resistance low enough to preserve scapular rhythm",
    "evidenceConfidence": "high",
    "sources": [
      "https://journals.lww.com/nsca-scj/fulltext/2013/10000/Evidence_Based_Guidelines_for_Strength_and.15.aspx",
      "https://www.tandfonline.com/doi/abs/10.1080/02640414.2020.1802093",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6714373/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed MMA and combat-sport biomechanics/conditioning reviews plus grappling-action research, while treating exercise-to-sport transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "mma-18",
    "sportId": "mma",
    "label": "cage wrestling drive",
    "movementFamily": "positional pushing and wall wrestling",
    "bodyActions": [
      "forward leg drive, trunk inclination, shoulder pressure, grip, and step-by-step wall pressure"
    ],
    "jointActions": [
      "hip/knee extension",
      "ankle plantar flexion",
      "shoulder extension/adduction",
      "elbow flexion",
      "trunk anti-flexion"
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps femoris",
      "hamstring muscles",
      "latissimus dorsi"
    ],
    "assistingMuscles": [
      "adductor magnus",
      "pectoralis major",
      "biceps brachii",
      "gastrocnemius"
    ],
    "stabilizers": [
      "erector spinae",
      "gluteus medius",
      "scapular stabilizers",
      "forearm flexors"
    ],
    "contractionRoles": [
      "concentric propulsion",
      "eccentric step absorption",
      "isometric pressure, grip, and brace"
    ],
    "commonForceOrSkillDemand": "sustained horizontal force and repeated repositioning",
    "recommendedExercisePatterns": [
      "sled push",
      "split squat",
      "row",
      "bear-hug carry"
    ],
    "recommendedExercises": [
      "sled push",
      "split squat",
      "row",
      "bear-hug carry"
    ],
    "transferRationale": "Sleds, split squats, rows, and carries overlap horizontal drive, unilateral stepping, pulling, and close-load bracing; wall tactics are not reproduced.",
    "exerciseSelectionCautions": "Use a friction-appropriate surface and avoid excessive spinal flexion; cap volume when grip or neck fatigue degrades posture",
    "evidenceConfidence": "high",
    "sources": [
      "https://journals.lww.com/nsca-scj/fulltext/2013/10000/Evidence_Based_Guidelines_for_Strength_and.15.aspx",
      "https://www.tandfonline.com/doi/abs/10.1080/02640414.2020.1802093",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6714373/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed MMA and combat-sport biomechanics/conditioning reviews plus grappling-action research, while treating exercise-to-sport transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "mma-19",
    "sportId": "mma",
    "label": "submission squeeze",
    "movementFamily": "isometric compression and control",
    "bodyActions": [
      "sustained clamp, hip adduction/flexion, upper-limb pulling, and trunk compression with small adjustments"
    ],
    "jointActions": [
      "hip adduction/flexion",
      "shoulder adduction/extension",
      "elbow flexion",
      "trunk anti-rotation/flexion"
    ],
    "primeMovers": [
      "adductor muscles",
      "pectoralis major",
      "latissimus dorsi",
      "biceps brachii"
    ],
    "assistingMuscles": [
      "forearm flexors",
      "rectus abdominis",
      "obliques",
      "gluteus maximus"
    ],
    "stabilizers": [
      "rotator cuff",
      "scapular stabilizers",
      "transversus abdominis",
      "deep hip rotators"
    ],
    "contractionRoles": [
      "predominantly isometric with concentric adjustments and eccentric release"
    ],
    "commonForceOrSkillDemand": "long-duration force maintenance and grip endurance",
    "recommendedExercisePatterns": [
      "Pallof press",
      "Copenhagen plank",
      "towel-grip row",
      "bear-hug hold"
    ],
    "recommendedExercises": [
      "Pallof press",
      "Copenhagen plank",
      "towel-grip row",
      "bear-hug hold"
    ],
    "transferRationale": "Anti-rotation, adductor isometrics, and grip pulling share force-maintenance demands, but submission outcomes depend on leverage, positioning, and rules.",
    "exerciseSelectionCautions": "Build isometric duration gradually; avoid breath holding, painful hip compression, or aggressive neck loading",
    "evidenceConfidence": "high",
    "sources": [
      "https://journals.lww.com/nsca-scj/fulltext/2013/10000/Evidence_Based_Guidelines_for_Strength_and.15.aspx",
      "https://www.tandfonline.com/doi/abs/10.1080/02640414.2020.1802093",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6714373/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed MMA and combat-sport biomechanics/conditioning reviews plus grappling-action research, while treating exercise-to-sport transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "mma-20",
    "sportId": "mma",
    "label": "scramble",
    "movementFamily": "reactive ground-to-standing transition",
    "bodyActions": [
      "rapid hip extension/flexion, rotation, posting, bridging, crawling, and standing under changing base"
    ],
    "jointActions": [
      "hip/knee extension and flexion",
      "trunk rotation",
      "shoulder posting",
      "elbow extension",
      "ankle repositioning"
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps femoris",
      "hamstring muscles",
      "obliques",
      "deltoid"
    ],
    "assistingMuscles": [
      "iliopsoas",
      "latissimus dorsi",
      "triceps brachii",
      "serratus anterior"
    ],
    "stabilizers": [
      "transversus abdominis",
      "rotator cuff",
      "gluteus medius",
      "gastrocnemius",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "rapid concentric repositioning",
      "eccentric deceleration",
      "isometric posts and bracing"
    ],
    "commonForceOrSkillDemand": "reactive multi-directional force with repeated transitions",
    "recommendedExercisePatterns": [
      "Turkish get-up",
      "sprawl",
      "lateral shuffle",
      "bear crawl",
      "farmer carry"
    ],
    "recommendedExercises": [
      "Turkish get-up",
      "sprawl",
      "lateral shuffle",
      "bear crawl",
      "farmer carry"
    ],
    "transferRationale": "Get-ups, sprawls, shuffles, crawls, and carries expose overlapping transition, bracing, locomotion, and deceleration qualities; scramble skill remains highly context-dependent.",
    "exerciseSelectionCautions": "Progress complexity before speed under fatigue; protect wrists, shoulders, knees, and neck and stop when landing mechanics deteriorate",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://journals.lww.com/nsca-scj/fulltext/2013/10000/Evidence_Based_Guidelines_for_Strength_and.15.aspx",
      "https://www.tandfonline.com/doi/abs/10.1080/02640414.2020.1802093",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6714373/"
    ],
    "sourceSummary": "The enrichment synthesizes peer-reviewed MMA and combat-sport biomechanics/conditioning reviews plus grappling-action research, while treating exercise-to-sport transfer as mechanical rationale rather than proof of causal performance improvement."
  },
  {
    "id": "brazilian-jiu-jitsu-1",
    "sportId": "brazilian-jiu-jitsu",
    "label": "shrimp",
    "movementFamily": "hip escape and space creation",
    "bodyActions": [
      "Supine lateral trunk curl and pelvic translation create a frame-and-foot escape angle."
    ],
    "jointActions": [
      "Lumbar/thoracic lateral flexion",
      "hip abduction, extension and external rotation",
      "shoulder/elbow extension in the post."
    ],
    "primeMovers": [
      "Gluteus maximus",
      "gluteus medius",
      "internal and external obliques"
    ],
    "assistingMuscles": [
      "Tensor fasciae latae",
      "hamstrings",
      "rectus abdominis",
      "adductor magnus"
    ],
    "stabilizers": [
      "Contralateral obliques",
      "deep hip rotators",
      "serratus anterior",
      "rotator cuff",
      "wrist extensors"
    ],
    "contractionRoles": [
      "Concentric hip drive and trunk curl",
      "eccentric reset",
      "isometric posting and bracing."
    ],
    "commonForceOrSkillDemand": "Repeated unilateral hip displacement against an opponent’s pressure while preserving a stable post.",
    "recommendedExercisePatterns": [
      "Hip extension and lateral-hip displacement"
    ],
    "recommendedExercises": [
      "hip thrust",
      "side plank",
      "dead bug",
      "single-leg glute bridge"
    ],
    "transferRationale": "Hip-extension and lateral-trunk exercises share the space-creation force direction, but cannot reproduce opponent timing or framing.",
    "exerciseSelectionCautions": "Do not load the cervical spine or force lumbar rotation; scale range and speed to mat skill.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC5294948/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC5260595/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Brazilian jiu-jitsu physiology and biomechanics studies, grip-specific research, and injury evidence, while keeping sport-transfer claims heuristic and acknowledging limited movement-specific causal evidence."
  },
  {
    "id": "brazilian-jiu-jitsu-2",
    "sportId": "brazilian-jiu-jitsu",
    "label": "bridge",
    "movementFamily": "bridging and hip-extension power",
    "bodyActions": [
      "Supine pelvic elevation, sometimes combined with rotation, lifts the hips and changes the base."
    ],
    "jointActions": [
      "Hip extension",
      "lumbar extension/anti-extension",
      "shoulder extension and scapular retraction against the mat."
    ],
    "primeMovers": [
      "Gluteus maximus",
      "hamstrings",
      "adductor magnus"
    ],
    "assistingMuscles": [
      "Erector spinae",
      "posterior deltoid",
      "latissimus dorsi"
    ],
    "stabilizers": [
      "Rectus abdominis",
      "internal and external obliques",
      "adductors",
      "scapular stabilizers"
    ],
    "contractionRoles": [
      "Concentric hip extension",
      "eccentric lowering",
      "isometric trunk and shoulder contact."
    ],
    "commonForceOrSkillDemand": "Short, high-force hip elevation and force absorption during positional escapes.",
    "recommendedExercisePatterns": [
      "Hip-extension pattern"
    ],
    "recommendedExercises": [
      "barbell hip thrust",
      "glute bridge",
      "Romanian deadlift",
      "front plank"
    ],
    "transferRationale": "Hip-extension strength and trunk stiffness are mechanically relevant to elevating the pelvis, but transfer is indirect.",
    "exerciseSelectionCautions": "Avoid excessive lumbar hyperextension and high-load bridging when rib, neck, or back symptoms are present.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC5294948/",
      "https://pubmed.ncbi.nlm.nih.gov/31879196/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Brazilian jiu-jitsu physiology and biomechanics studies, grip-specific research, and injury evidence, while keeping sport-transfer claims heuristic and acknowledging limited movement-specific causal evidence."
  },
  {
    "id": "brazilian-jiu-jitsu-3",
    "sportId": "brazilian-jiu-jitsu",
    "label": "technical stand-up",
    "movementFamily": "unilateral base transition",
    "bodyActions": [
      "From seated or supine, a hand post and one foot support a protected rise while the free leg retracts."
    ],
    "jointActions": [
      "Hip and knee extension",
      "ankle plantarflexion",
      "shoulder and elbow extension in the post",
      "trunk anti-rotation."
    ],
    "primeMovers": [
      "Quadriceps",
      "gluteus maximus",
      "hamstrings",
      "triceps brachii"
    ],
    "assistingMuscles": [
      "Gluteus medius",
      "gastrocnemius",
      "anterior deltoid",
      "forearm extensors"
    ],
    "stabilizers": [
      "Obliques",
      "rotator cuff",
      "wrist stabilizers",
      "deep hip rotators"
    ],
    "contractionRoles": [
      "Concentric leg drive and shoulder press",
      "eccentric lowering",
      "isometric hand post and trunk bracing."
    ],
    "commonForceOrSkillDemand": "Unilateral force production, balance, and rapid ground-to-standing repositioning.",
    "recommendedExercisePatterns": [
      "Unilateral squat/step-up pattern"
    ],
    "recommendedExercises": [
      "Turkish get-up",
      "split squat",
      "single-arm farmer carry",
      "half-kneeling cable press"
    ],
    "transferRationale": "Unilateral squat, get-up, carry, and anti-rotation patterns overlap with the base and posting demands.",
    "exerciseSelectionCautions": "Use a stable shoulder and pain-free wrist angle; prioritize the movement pattern before adding load.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC5294948/",
      "https://pubmed.ncbi.nlm.nih.gov/31879196/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Brazilian jiu-jitsu physiology and biomechanics studies, grip-specific research, and injury evidence, while keeping sport-transfer claims heuristic and acknowledging limited movement-specific causal evidence."
  },
  {
    "id": "brazilian-jiu-jitsu-4",
    "sportId": "brazilian-jiu-jitsu",
    "label": "guard retention",
    "movementFamily": "guard retention, inversion, and hip mobility",
    "bodyActions": [
      "The hips rotate, flex, abduct, and pummel the legs to keep the opponent aligned in front."
    ],
    "jointActions": [
      "Hip flexion/abduction/adduction and internal-external rotation",
      "trunk rotation",
      "shoulder/elbow flexion-extension for frames."
    ],
    "primeMovers": [
      "Iliopsoas",
      "rectus femoris",
      "adductor longus",
      "gluteus medius",
      "abdominal obliques"
    ],
    "assistingMuscles": [
      "Sartorius",
      "tensor fasciae latae",
      "hamstrings",
      "pectineus"
    ],
    "stabilizers": [
      "Deep hip rotators",
      "transversus abdominis",
      "serratus anterior",
      "rotator cuff"
    ],
    "contractionRoles": [
      "Rapid concentric repositioning",
      "eccentric braking",
      "intermittent isometric hooks and frames."
    ],
    "commonForceOrSkillDemand": "High-frequency multidirectional hip motion under unpredictable external load.",
    "recommendedExercisePatterns": [
      "Hip mobility and anti-rotation pattern"
    ],
    "recommendedExercises": [
      "Copenhagen plank",
      "banded hip rotation",
      "dead bug",
      "Pallof press"
    ],
    "transferRationale": "Hip-control and anti-rotation work develops relevant capacity, but technical retention depends on perception and timing.",
    "exerciseSelectionCautions": "Mobility drills should be controlled and non-forced; avoid end-range loading when knee, hip, or lumbar symptoms occur.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC5294948/",
      "https://pubmed.ncbi.nlm.nih.gov/31879196/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Brazilian jiu-jitsu physiology and biomechanics studies, grip-specific research, and injury evidence, while keeping sport-transfer claims heuristic and acknowledging limited movement-specific causal evidence."
  },
  {
    "id": "brazilian-jiu-jitsu-5",
    "sportId": "brazilian-jiu-jitsu",
    "label": "closed-guard squeeze",
    "movementFamily": "isometric clamps, hooks, and positional control",
    "bodyActions": [
      "The legs encircle the opponent and maintain trunk-to-pelvis contact through sustained compression."
    ],
    "jointActions": [
      "Bilateral hip adduction and flexion",
      "pelvic posterior tilt",
      "trunk flexion",
      "shoulder and elbow flexion for grips."
    ],
    "primeMovers": [
      "Adductor longus",
      "adductor magnus",
      "gracilis",
      "iliopsoas",
      "rectus abdominis"
    ],
    "assistingMuscles": [
      "Pectineus",
      "internal oblique",
      "external oblique",
      "hamstrings"
    ],
    "stabilizers": [
      "Gluteus medius",
      "deep hip rotators",
      "transversus abdominis",
      "scapular stabilizers"
    ],
    "contractionRoles": [
      "Predominantly isometric adductor and trunk compression with brief concentric closure and eccentric release."
    ],
    "commonForceOrSkillDemand": "Sustained adductor and trunk endurance while resisting posture-breaking forces.",
    "recommendedExercisePatterns": [
      "Adductor isometric and trunk-compression pattern"
    ],
    "recommendedExercises": [
      "Copenhagen plank",
      "adductor ball squeeze",
      "dead bug",
      "front plank"
    ],
    "transferRationale": "Adductor isometrics and trunk-control drills target shared force and endurance qualities without implying submission-specific causation.",
    "exerciseSelectionCautions": "Do not use maximal or prolonged breath-holding squeezes; keep knees and hips in tolerable alignment.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC5294948/",
      "https://pubmed.ncbi.nlm.nih.gov/31879196/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Brazilian jiu-jitsu physiology and biomechanics studies, grip-specific research, and injury evidence, while keeping sport-transfer claims heuristic and acknowledging limited movement-specific causal evidence."
  },
  {
    "id": "brazilian-jiu-jitsu-6",
    "sportId": "brazilian-jiu-jitsu",
    "label": "hip escape",
    "movementFamily": "hip escape and space creation",
    "bodyActions": [
      "Repeated unilateral hip extension and lateral displacement are assisted by a rigid frame."
    ],
    "jointActions": [
      "Hip extension/abduction",
      "trunk lateral flexion and rotation",
      "shoulder and elbow extension in the frame."
    ],
    "primeMovers": [
      "Gluteus maximus",
      "gluteus medius",
      "external oblique",
      "internal oblique"
    ],
    "assistingMuscles": [
      "Hamstrings",
      "tensor fasciae latae",
      "rectus abdominis",
      "adductor magnus"
    ],
    "stabilizers": [
      "Contralateral obliques",
      "deep hip rotators",
      "serratus anterior",
      "wrist stabilizers"
    ],
    "contractionRoles": [
      "Concentric hip drive and trunk repositioning",
      "eccentric reset",
      "isometric frame."
    ],
    "commonForceOrSkillDemand": "Repeated lateral escape efforts against compression and friction.",
    "recommendedExercisePatterns": [
      "Lateral hip displacement and anti-rotation"
    ],
    "recommendedExercises": [
      "side plank",
      "single-leg glute bridge",
      "Pallof press",
      "hip thrust"
    ],
    "transferRationale": "The exercises reinforce lateral hip force and trunk bracing that support, but do not replace, skilled hip-escape mechanics.",
    "exerciseSelectionCautions": "Keep the foot active and avoid turning the drill into uncontrolled lumbar twisting.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC5294948/",
      "https://pubmed.ncbi.nlm.nih.gov/31879196/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Brazilian jiu-jitsu physiology and biomechanics studies, grip-specific research, and injury evidence, while keeping sport-transfer claims heuristic and acknowledging limited movement-specific causal evidence."
  },
  {
    "id": "brazilian-jiu-jitsu-7",
    "sportId": "brazilian-jiu-jitsu",
    "label": "armbar hip extension",
    "movementFamily": "guard retention and lower-body clamping",
    "bodyActions": [
      "Pelvic elevation and hip extension tighten a leg clamp while the trunk aligns the opponent’s arm."
    ],
    "jointActions": [
      "Hip extension",
      "hip adduction and flexion in the clamp",
      "trunk flexion",
      "knee flexion."
    ],
    "primeMovers": [
      "Gluteus maximus",
      "hamstrings",
      "adductor magnus",
      "rectus abdominis"
    ],
    "assistingMuscles": [
      "Adductor longus",
      "gracilis",
      "pectineus",
      "internal oblique"
    ],
    "stabilizers": [
      "Deep hip rotators",
      "transversus abdominis",
      "upper back",
      "neck stabilizers"
    ],
    "contractionRoles": [
      "Concentric hip extension",
      "sustained isometric leg clamp",
      "eccentric return."
    ],
    "commonForceOrSkillDemand": "Hip-extension force combined with adductor endurance and precise limb positioning.",
    "recommendedExercisePatterns": [
      "Hip thrust plus adductor isometric pattern"
    ],
    "recommendedExercises": [
      "barbell hip thrust",
      "Copenhagen plank",
      "hamstring curl",
      "dead bug"
    ],
    "transferRationale": "The rationale is anatomical and mechanical; direct studies linking these exercises to armbar success were not identified.",
    "exerciseSelectionCautions": "Do not pursue extreme hip or knee angles under load; the gym exercise supports capacity, not armbar technique.",
    "evidenceConfidence": "limited",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC5294948/",
      "https://pubmed.ncbi.nlm.nih.gov/31879196/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Brazilian jiu-jitsu physiology and biomechanics studies, grip-specific research, and injury evidence, while keeping sport-transfer claims heuristic and acknowledging limited movement-specific causal evidence."
  },
  {
    "id": "brazilian-jiu-jitsu-8",
    "sportId": "brazilian-jiu-jitsu",
    "label": "triangle squeeze",
    "movementFamily": "isometric clamps, hooks, and positional control",
    "bodyActions": [
      "One leg crosses and the knees draw together while the hips flex and rotate to maintain a closed leg frame."
    ],
    "jointActions": [
      "Hip flexion and external rotation",
      "knee flexion",
      "adduction",
      "trunk flexion."
    ],
    "primeMovers": [
      "Adductor longus",
      "gracilis",
      "iliopsoas",
      "rectus abdominis"
    ],
    "assistingMuscles": [
      "Hamstrings",
      "sartorius",
      "pectineus",
      "internal oblique"
    ],
    "stabilizers": [
      "Gluteus medius",
      "deep hip rotators",
      "transversus abdominis",
      "cervical and shoulder stabilizers"
    ],
    "contractionRoles": [
      "Isometric knee-to-knee compression with concentric leg placement and eccentric release."
    ],
    "commonForceOrSkillDemand": "Sustained hip-adduction compression and trunk control.",
    "recommendedExercisePatterns": [
      "Adductor and hip-flexor control"
    ],
    "recommendedExercises": [
      "Copenhagen plank",
      "hanging knee raise",
      "adductor ball squeeze",
      "dead bug"
    ],
    "transferRationale": "Adductor and hip-flexor exercises reflect shared actions, while triangle application is highly technique- and position-dependent.",
    "exerciseSelectionCautions": "Avoid aggressive neck flexion or loaded end-range hip external rotation; use assisted variations.",
    "evidenceConfidence": "limited",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC5294948/",
      "https://pubmed.ncbi.nlm.nih.gov/31879196/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Brazilian jiu-jitsu physiology and biomechanics studies, grip-specific research, and injury evidence, while keeping sport-transfer claims heuristic and acknowledging limited movement-specific causal evidence."
  },
  {
    "id": "brazilian-jiu-jitsu-9",
    "sportId": "brazilian-jiu-jitsu",
    "label": "rear-naked-choke squeeze",
    "movementFamily": "grip fighting and upper-body pulling",
    "bodyActions": [
      "The arms close around the upper trunk/neck line while the elbows flex and the scapulae stabilize."
    ],
    "jointActions": [
      "Shoulder horizontal adduction",
      "elbow flexion",
      "scapular retraction/depression",
      "trunk anti-rotation."
    ],
    "primeMovers": [
      "Latissimus dorsi",
      "pectoralis major",
      "biceps brachii",
      "brachialis"
    ],
    "assistingMuscles": [
      "Brachioradialis",
      "posterior deltoid",
      "teres major",
      "forearm flexors"
    ],
    "stabilizers": [
      "Rotator cuff",
      "rhomboid major",
      "middle and lower trapezius",
      "obliques"
    ],
    "contractionRoles": [
      "Predominantly isometric clamp with brief concentric elbow and hand closure."
    ],
    "commonForceOrSkillDemand": "Upper-body pulling and grip endurance under sustained contact.",
    "recommendedExercisePatterns": [
      "Horizontal/vertical pulling and isometric grip"
    ],
    "recommendedExercises": [
      "neutral-grip row",
      "lat pulldown",
      "towel hang",
      "farmer carry"
    ],
    "transferRationale": "Rows, pulldowns, and grip holds share pulling and isometric demands; they do not model cervical or submission effects.",
    "exerciseSelectionCautions": "Never train by compressing the neck or using maximal choking simulations; keep cervical loading absent.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC5260595/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10563762/",
      "https://pubmed.ncbi.nlm.nih.gov/31879196/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Brazilian jiu-jitsu physiology and biomechanics studies, grip-specific research, and injury evidence, while keeping sport-transfer claims heuristic and acknowledging limited movement-specific causal evidence."
  },
  {
    "id": "brazilian-jiu-jitsu-10",
    "sportId": "brazilian-jiu-jitsu",
    "label": "guillotine squeeze",
    "movementFamily": "grip fighting and upper-body pulling",
    "bodyActions": [
      "An arm wraps the head-and-neck line while the elbows draw in and the trunk braces."
    ],
    "jointActions": [
      "Elbow flexion",
      "shoulder adduction and extension",
      "scapular depression",
      "trunk flexion/anti-extension."
    ],
    "primeMovers": [
      "Biceps brachii",
      "brachialis",
      "latissimus dorsi",
      "pectoralis major"
    ],
    "assistingMuscles": [
      "Brachioradialis",
      "teres major",
      "forearm flexors",
      "posterior deltoid"
    ],
    "stabilizers": [
      "Rotator cuff",
      "lower trapezius",
      "rhomboids",
      "obliques",
      "erector spinae"
    ],
    "contractionRoles": [
      "Isometric arm-and-trunk clamp with concentric closure and eccentric release."
    ],
    "commonForceOrSkillDemand": "Short-range pulling and sustained upper-body isometric force.",
    "recommendedExercisePatterns": [
      "Neutral pulling and safe arm isometrics"
    ],
    "recommendedExercises": [
      "neutral-grip row",
      "cable pulldown",
      "farmer carry",
      "Pallof press"
    ],
    "transferRationale": "Neutral pulls and trunk anti-rotation develop general capacity relevant to clamping, without claiming choke-performance transfer.",
    "exerciseSelectionCautions": "Do not load or compress the cervical spine; stop for neurological, vascular, or shoulder symptoms.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC5260595/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10563762/",
      "https://pubmed.ncbi.nlm.nih.gov/31879196/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Brazilian jiu-jitsu physiology and biomechanics studies, grip-specific research, and injury evidence, while keeping sport-transfer claims heuristic and acknowledging limited movement-specific causal evidence."
  },
  {
    "id": "brazilian-jiu-jitsu-11",
    "sportId": "brazilian-jiu-jitsu",
    "label": "hip-bump sweep",
    "movementFamily": "rotational sweeps and base disruption",
    "bodyActions": [
      "A seated hip extension and trunk rotation elevate and turn the opponent around a posting arm."
    ],
    "jointActions": [
      "Hip extension",
      "trunk rotation",
      "shoulder/elbow extension in the post",
      "knee extension."
    ],
    "primeMovers": [
      "Gluteus maximus",
      "quadriceps",
      "external oblique",
      "internal oblique"
    ],
    "assistingMuscles": [
      "Hamstrings",
      "adductor magnus",
      "rectus abdominis",
      "pectoralis major"
    ],
    "stabilizers": [
      "Adductors",
      "deep hip rotators",
      "rotator cuff",
      "wrist stabilizers"
    ],
    "contractionRoles": [
      "Concentric hip drive and rotation",
      "isometric post",
      "eccentric landing and repositioning."
    ],
    "commonForceOrSkillDemand": "Explosive unilateral hip and trunk force against a moving base.",
    "recommendedExercisePatterns": [
      "Rotational power and unilateral drive"
    ],
    "recommendedExercises": [
      "medicine-ball rotational throw",
      "split squat",
      "landmine rotation",
      "Pallof press"
    ],
    "transferRationale": "Rotational throws and split-stance strength overlap with force direction, but sweep success also requires leverage, grips, and timing.",
    "exerciseSelectionCautions": "Use low volume and controlled rotation; avoid ballistic twisting with a fatigued or painful lumbar spine.",
    "evidenceConfidence": "limited",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC5294948/",
      "https://pubmed.ncbi.nlm.nih.gov/31879196/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Brazilian jiu-jitsu physiology and biomechanics studies, grip-specific research, and injury evidence, while keeping sport-transfer claims heuristic and acknowledging limited movement-specific causal evidence."
  },
  {
    "id": "brazilian-jiu-jitsu-12",
    "sportId": "brazilian-jiu-jitsu",
    "label": "scissor sweep",
    "movementFamily": "rotational sweeps and base disruption",
    "bodyActions": [
      "One leg acts as a lever while the other sweeps laterally, with trunk rotation and grips redirecting the base."
    ],
    "jointActions": [
      "Hip flexion/extension and abduction/adduction",
      "trunk rotation",
      "knee extension",
      "shoulder/elbow isometric framing."
    ],
    "primeMovers": [
      "External oblique",
      "internal oblique",
      "adductor longus",
      "gluteus maximus"
    ],
    "assistingMuscles": [
      "Iliopsoas",
      "quadriceps",
      "hamstrings",
      "pectineus"
    ],
    "stabilizers": [
      "Deep hip rotators",
      "transversus abdominis",
      "serratus anterior",
      "shoulder stabilizers"
    ],
    "contractionRoles": [
      "Concentric sweep and hip drive",
      "eccentric braking",
      "isometric grips and frames."
    ],
    "commonForceOrSkillDemand": "Lever-based lateral force and trunk rotation under constraint.",
    "recommendedExercisePatterns": [
      "Lateral and rotational force pattern"
    ],
    "recommendedExercises": [
      "lateral lunge",
      "cable chop",
      "medicine-ball rotational throw",
      "Copenhagen plank"
    ],
    "transferRationale": "Lateral lunges, chops, and adductor work share components but not the opponent-dependent lever mechanics.",
    "exerciseSelectionCautions": "Do not force lumbar rotation or load a knee in valgus; build range before speed.",
    "evidenceConfidence": "limited",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC5294948/",
      "https://pubmed.ncbi.nlm.nih.gov/31879196/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Brazilian jiu-jitsu physiology and biomechanics studies, grip-specific research, and injury evidence, while keeping sport-transfer claims heuristic and acknowledging limited movement-specific causal evidence."
  },
  {
    "id": "brazilian-jiu-jitsu-13",
    "sportId": "brazilian-jiu-jitsu",
    "label": "wrestling stand-up",
    "movementFamily": "standing, passing, and pressure-based force production",
    "bodyActions": [
      "From the ground, the athlete posts and hand-fights, extends hips and legs, and rises to a safe angle."
    ],
    "jointActions": [
      "Hip and knee extension",
      "ankle plantarflexion",
      "shoulder/elbow extension and flexion during posts and grips",
      "trunk anti-rotation."
    ],
    "primeMovers": [
      "Gluteus maximus",
      "quadriceps",
      "hamstrings",
      "erector spinae"
    ],
    "assistingMuscles": [
      "Adductor magnus",
      "gastrocnemius",
      "latissimus dorsi",
      "forearm flexors"
    ],
    "stabilizers": [
      "Obliques",
      "gluteus medius",
      "rotator cuff",
      "wrist stabilizers",
      "cervical stabilizers"
    ],
    "contractionRoles": [
      "Concentric leg and hip extension",
      "eccentric level-change control",
      "isometric grips and posts."
    ],
    "commonForceOrSkillDemand": "Ground-to-standing transition with unilateral support and external pulling.",
    "recommendedExercisePatterns": [
      "Unilateral hinge/squat, carry, and pulling pattern"
    ],
    "recommendedExercises": [
      "trap-bar deadlift",
      "split squat",
      "single-arm farmer carry",
      "neutral-grip row"
    ],
    "transferRationale": "Deadlift, split squat, carry, and row patterns overlap with rising, bracing, and pulling demands.",
    "exerciseSelectionCautions": "Train the rise without cervical loading; use stable surfaces and stop if wrist or shoulder posting is painful.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC5294948/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC5260595/",
      "https://pubmed.ncbi.nlm.nih.gov/31879196/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Brazilian jiu-jitsu physiology and biomechanics studies, grip-specific research, and injury evidence, while keeping sport-transfer claims heuristic and acknowledging limited movement-specific causal evidence."
  },
  {
    "id": "brazilian-jiu-jitsu-14",
    "sportId": "brazilian-jiu-jitsu",
    "label": "guard pass drive",
    "movementFamily": "standing, passing, and pressure-based force production",
    "bodyActions": [
      "Forward hip and knee drive applies pressure while the trunk and arms maintain a stable passing frame."
    ],
    "jointActions": [
      "Hip/knee extension",
      "ankle plantarflexion",
      "shoulder flexion/adduction",
      "elbow extension",
      "trunk anti-extension."
    ],
    "primeMovers": [
      "Gluteus maximus",
      "quadriceps",
      "pectoralis major",
      "triceps brachii"
    ],
    "assistingMuscles": [
      "Hamstrings",
      "gastrocnemius",
      "anterior deltoid",
      "latissimus dorsi"
    ],
    "stabilizers": [
      "Rectus abdominis",
      "obliques",
      "erector spinae",
      "scapular stabilizers",
      "adductors"
    ],
    "contractionRoles": [
      "Concentric forward drive with eccentric braking and sustained isometric pressure."
    ],
    "commonForceOrSkillDemand": "Horizontal force production and whole-body bracing against a resisting opponent.",
    "recommendedExercisePatterns": [
      "Horizontal push, sled, and front-loaded carry"
    ],
    "recommendedExercises": [
      "sled push",
      "front-loaded carry",
      "split squat isometric",
      "front plank"
    ],
    "transferRationale": "Sleds, carries, and split-squat isometrics train general drive and bracing, not pass-specific skill.",
    "exerciseSelectionCautions": "Do not substitute maximal spinal compression or neck pressure for technical passing posture.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC5260595/",
      "https://pubmed.ncbi.nlm.nih.gov/31879196/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Brazilian jiu-jitsu physiology and biomechanics studies, grip-specific research, and injury evidence, while keeping sport-transfer claims heuristic and acknowledging limited movement-specific causal evidence."
  },
  {
    "id": "brazilian-jiu-jitsu-15",
    "sportId": "brazilian-jiu-jitsu",
    "label": "knee-cut pass",
    "movementFamily": "standing, passing, and pressure-based force production",
    "bodyActions": [
      "A lateral weight shift and knee path cut across the legs while the torso rotates and the upper body frames."
    ],
    "jointActions": [
      "Hip/knee extension and flexion",
      "hip adduction/abduction",
      "trunk rotation",
      "shoulder/elbow isometric framing."
    ],
    "primeMovers": [
      "Quadriceps",
      "gluteus maximus",
      "adductor magnus",
      "internal and external obliques"
    ],
    "assistingMuscles": [
      "Gluteus medius",
      "hamstrings",
      "pectineus",
      "latissimus dorsi"
    ],
    "stabilizers": [
      "Deep hip rotators",
      "transversus abdominis",
      "rotator cuff",
      "cervical stabilizers"
    ],
    "contractionRoles": [
      "Concentric leg drive",
      "eccentric lateral control",
      "isometric upper-body frame."
    ],
    "commonForceOrSkillDemand": "Lateral force, unilateral base control, and rotational pressure.",
    "recommendedExercisePatterns": [
      "Lateral lunge and anti-rotation pattern"
    ],
    "recommendedExercises": [
      "lateral lunge",
      "front-foot-elevated split squat",
      "Pallof press",
      "suitcase carry"
    ],
    "transferRationale": "Lateral unilateral strength and anti-rotation match components of the pass while technical knee positioning remains sport-specific.",
    "exerciseSelectionCautions": "Protect knee tracking and avoid forcing the knee across a resisting partner; use pain-free range.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC5294948/",
      "https://pubmed.ncbi.nlm.nih.gov/31879196/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Brazilian jiu-jitsu physiology and biomechanics studies, grip-specific research, and injury evidence, while keeping sport-transfer claims heuristic and acknowledging limited movement-specific causal evidence."
  },
  {
    "id": "brazilian-jiu-jitsu-16",
    "sportId": "brazilian-jiu-jitsu",
    "label": "body-lock pass",
    "movementFamily": "standing, passing, and pressure-based force production",
    "bodyActions": [
      "The athlete clamps the trunk, extends the hips, flexes the trunk, and steps laterally to compress and steer."
    ],
    "jointActions": [
      "Shoulder adduction",
      "elbow flexion",
      "hip extension",
      "trunk flexion/anti-rotation",
      "lateral stepping."
    ],
    "primeMovers": [
      "Latissimus dorsi",
      "pectoralis major",
      "gluteus maximus",
      "adductor magnus"
    ],
    "assistingMuscles": [
      "Biceps brachii",
      "hamstrings",
      "teres major",
      "forearm flexors"
    ],
    "stabilizers": [
      "Obliques",
      "erector spinae",
      "gluteus medius",
      "rotator cuff"
    ],
    "contractionRoles": [
      "Sustained isometric clamp with concentric hip and step drive and eccentric redirection."
    ],
    "commonForceOrSkillDemand": "Whole-body isometric compression plus lateral force and grip endurance.",
    "recommendedExercisePatterns": [
      "Loaded carry and sandbag clamp pattern"
    ],
    "recommendedExercises": [
      "bear-hug carry",
      "sandbag carry",
      "lateral-loaded carry",
      "Romanian deadlift"
    ],
    "transferRationale": "Bear-hug and loaded carries reproduce general clamp, bracing, and locomotor demands without opponent-specific leverage.",
    "exerciseSelectionCautions": "Keep the load away from the neck and avoid forced spinal flexion; choose manageable breathing and step quality.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC5260595/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10563762/",
      "https://pubmed.ncbi.nlm.nih.gov/31879196/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Brazilian jiu-jitsu physiology and biomechanics studies, grip-specific research, and injury evidence, while keeping sport-transfer claims heuristic and acknowledging limited movement-specific causal evidence."
  },
  {
    "id": "brazilian-jiu-jitsu-17",
    "sportId": "brazilian-jiu-jitsu",
    "label": "mount stabilization",
    "movementFamily": "isometric clamps, hooks, and positional control",
    "bodyActions": [
      "A wide base and small hip/trunk adjustments distribute weight and resist bridging or turning."
    ],
    "jointActions": [
      "Hip abduction/adduction",
      "knee flexion",
      "trunk anti-rotation and anti-extension",
      "ankle adjustments."
    ],
    "primeMovers": [
      "Gluteus medius",
      "adductor magnus",
      "quadriceps",
      "external oblique",
      "erector spinae"
    ],
    "assistingMuscles": [
      "Gluteus maximus",
      "hamstrings",
      "soleus",
      "transversus abdominis"
    ],
    "stabilizers": [
      "Deep hip rotators",
      "rotator cuff",
      "forearm flexors",
      "cervical stabilizers"
    ],
    "contractionRoles": [
      "Predominantly isometric base control with small concentric and eccentric corrections."
    ],
    "commonForceOrSkillDemand": "Sustained postural bracing while resisting multidirectional displacement.",
    "recommendedExercisePatterns": [
      "Unilateral isometric and anti-lateral-flexion pattern"
    ],
    "recommendedExercises": [
      "split squat isometric",
      "suitcase carry",
      "side plank",
      "Copenhagen plank"
    ],
    "transferRationale": "Unilateral isometrics, carries, and side planks build general base and anti-lateral-flexion capacity.",
    "exerciseSelectionCautions": "Use a neutral spine and avoid partner drills that load the neck or collapse the knees inward.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC5294948/",
      "https://pubmed.ncbi.nlm.nih.gov/31879196/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Brazilian jiu-jitsu physiology and biomechanics studies, grip-specific research, and injury evidence, while keeping sport-transfer claims heuristic and acknowledging limited movement-specific causal evidence."
  },
  {
    "id": "brazilian-jiu-jitsu-18",
    "sportId": "brazilian-jiu-jitsu",
    "label": "back-control hooks",
    "movementFamily": "isometric clamps, hooks, and positional control",
    "bodyActions": [
      "The legs insert and retain hooks while the trunk stays attached and the upper body controls the opponent."
    ],
    "jointActions": [
      "Hip flexion",
      "knee flexion",
      "ankle plantarflexion",
      "trunk flexion",
      "shoulder adduction and elbow flexion."
    ],
    "primeMovers": [
      "Iliopsoas",
      "hamstrings",
      "gastrocnemius",
      "rectus abdominis",
      "latissimus dorsi"
    ],
    "assistingMuscles": [
      "Sartorius",
      "adductors",
      "biceps brachii",
      "forearm flexors",
      "teres major"
    ],
    "stabilizers": [
      "Gluteus medius",
      "deep hip rotators",
      "transversus abdominis",
      "rotator cuff"
    ],
    "contractionRoles": [
      "Isometric hook retention with concentric insertion and eccentric adjustment."
    ],
    "commonForceOrSkillDemand": "Repeated leg-hook placement and posterior attachment under escape forces.",
    "recommendedExercisePatterns": [
      "Hip-flexor, hamstring, calf, and pulling pattern"
    ],
    "recommendedExercises": [
      "hanging knee raise",
      "hamstring curl",
      "calf raise isometric",
      "neutral-grip row"
    ],
    "transferRationale": "The exercise choices develop component strength and endurance; direct hook-retention transfer evidence is limited.",
    "exerciseSelectionCautions": "Avoid high-volume hanging if shoulder or lumbar symptoms exist; do not use neck traction to simulate attachment.",
    "evidenceConfidence": "limited",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC5260595/",
      "https://pubmed.ncbi.nlm.nih.gov/31879196/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Brazilian jiu-jitsu physiology and biomechanics studies, grip-specific research, and injury evidence, while keeping sport-transfer claims heuristic and acknowledging limited movement-specific causal evidence."
  },
  {
    "id": "brazilian-jiu-jitsu-19",
    "sportId": "brazilian-jiu-jitsu",
    "label": "grip fighting",
    "movementFamily": "grip fighting and upper-body pulling",
    "bodyActions": [
      "Repeated wrist, finger, elbow, and shoulder repositioning combines pulling, posting, and rotation."
    ],
    "jointActions": [
      "Wrist flexion/extension and radial-ulnar deviation",
      "finger flexion",
      "elbow flexion",
      "shoulder rotation and adduction."
    ],
    "primeMovers": [
      "Flexor digitorum profundus",
      "flexor digitorum superficialis",
      "brachioradialis",
      "biceps brachii",
      "latissimus dorsi"
    ],
    "assistingMuscles": [
      "Wrist extensors",
      "brachialis",
      "posterior deltoid",
      "pectoralis major",
      "forearm pronators"
    ],
    "stabilizers": [
      "Rotator cuff",
      "serratus anterior",
      "lower trapezius",
      "rhomboids",
      "trunk stabilizers"
    ],
    "contractionRoles": [
      "Short concentric pulls, eccentric yielding, and frequent submaximal-to-high isometric gripping."
    ],
    "commonForceOrSkillDemand": "Grip-specific isometric endurance and force production with fatigue-resistant scapular control.",
    "recommendedExercisePatterns": [
      "Grip carry, hang, wrist, and pulling pattern"
    ],
    "recommendedExercises": [
      "farmer carry",
      "towel hang",
      "wrist curl",
      "wrist extension",
      "neutral-grip row"
    ],
    "transferRationale": "Grip-specific testing shows grip type affects force production, while carries, hangs, and rows address related capacity rather than proving match improvement.",
    "exerciseSelectionCautions": "Progress grip volume gradually and balance flexor work with extensor conditioning; stop for numbness or elbow pain.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10563762/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC5260595/",
      "https://pubmed.ncbi.nlm.nih.gov/31879196/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Brazilian jiu-jitsu physiology and biomechanics studies, grip-specific research, and injury evidence, while keeping sport-transfer claims heuristic and acknowledging limited movement-specific causal evidence."
  },
  {
    "id": "brazilian-jiu-jitsu-20",
    "sportId": "brazilian-jiu-jitsu",
    "label": "inversion",
    "movementFamily": "guard retention, inversion, and hip mobility",
    "bodyActions": [
      "The trunk flexes and rotates as the hips move overhead or around the opponent while the shoulders and hands frame."
    ],
    "jointActions": [
      "Spinal flexion with controlled rotation",
      "hip flexion/adduction and rotation",
      "shoulder flexion",
      "wrist extension."
    ],
    "primeMovers": [
      "Rectus abdominis",
      "external and internal obliques",
      "iliopsoas",
      "adductor longus",
      "serratus anterior"
    ],
    "assistingMuscles": [
      "Rectus femoris",
      "sartorius",
      "pectineus",
      "latissimus dorsi",
      "wrist extensors"
    ],
    "stabilizers": [
      "Transversus abdominis",
      "deep hip rotators",
      "rotator cuff",
      "cervical and thoracic stabilizers"
    ],
    "contractionRoles": [
      "Concentric trunk/hip flexion",
      "eccentric spinal and hip control",
      "isometric shoulder and wrist frames."
    ],
    "commonForceOrSkillDemand": "Inverted body-line control, hip mobility, and safe load sharing through the shoulders and hands.",
    "recommendedExercisePatterns": [
      "Hollow-body, hanging hip-flexion, and thoracic-hip mobility pattern"
    ],
    "recommendedExercises": [
      "hollow-body hold",
      "hanging leg raise",
      "dead bug",
      "thoracic rotation"
    ],
    "transferRationale": "The rationale is based on shared trunk, hip, and shoulder actions; inversion-specific performance evidence is limited.",
    "exerciseSelectionCautions": "Do not load the neck or force end-range spinal flexion; use regression and coaching for shoulder/wrist tolerance.",
    "evidenceConfidence": "limited",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC5294948/",
      "https://pubmed.ncbi.nlm.nih.gov/31879196/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Brazilian jiu-jitsu physiology and biomechanics studies, grip-specific research, and injury evidence, while keeping sport-transfer claims heuristic and acknowledging limited movement-specific causal evidence."
  },
  {
    "id": "ice-hockey-1",
    "sportId": "ice-hockey",
    "label": "skating acceleration",
    "movementFamily": "acceleration and propulsion",
    "bodyActions": [
      "forward trunk inclination",
      "rapid unilateral skate push",
      "hip, knee, and ankle extension"
    ],
    "jointActions": [
      "hip extension and abduction",
      "knee extension",
      "ankle plantarflexion",
      "pelvic and trunk stabilization"
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps femoris",
      "hamstring group",
      "adductor magnus",
      "gastrocnemius",
      "soleus"
    ],
    "assistingMuscles": [
      "gluteus medius",
      "iliopsoas",
      "tensor fasciae latae",
      "peroneus longus",
      "peroneus brevis"
    ],
    "stabilizers": [
      "transversus abdominis",
      "internal oblique",
      "external oblique",
      "gluteus medius",
      "tibialis posterior",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "[object Object]"
    ],
    "commonForceOrSkillDemand": "Very high horizontal and lateral force application in the first strides, with short ground-contact opportunities and unstable edge support.",
    "recommendedExercisePatterns": [
      "unilateral lower-body strength",
      "horizontal resisted acceleration",
      "lateral force production",
      "anti-rotation bracing"
    ],
    "recommendedExercises": [
      "rear-foot-elevated split squat",
      "sled push",
      "lateral sled push",
      "single-leg Romanian deadlift",
      "Pallof press"
    ],
    "transferRationale": "These patterns train hip extension, unilateral force transfer, and trunk control that mechanically overlap with the first skating strides; they do not substitute for on-ice technique or establish a guaranteed speed gain.",
    "exerciseSelectionCautions": "Use conservative loads until knee-over-foot and pelvis control are consistent; avoid treating sled or split-squat strength as direct proof of skating improvement.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4431820/",
      "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0127324"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed on-ice skating biomechanics and muscle-activity research, peer-reviewed shooting biomechanics, and scholarly power-skating literature, while limiting transfer claims because direct gym-to-ice causal evidence is sparse for several contact and goalie-specific movements."
  },
  {
    "id": "ice-hockey-2",
    "sportId": "ice-hockey",
    "label": "forward stride",
    "movementFamily": "cyclical skating and edge control",
    "bodyActions": [
      "alternating lateral-to-rearward push",
      "single-leg glide",
      "limb recovery under the center of mass"
    ],
    "jointActions": [
      "hip extension and abduction",
      "knee flexion-extension",
      "ankle plantarflexion",
      "foot inversion/eversion control"
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps femoris",
      "hamstring group",
      "adductor magnus",
      "gastrocnemius",
      "soleus"
    ],
    "assistingMuscles": [
      "gluteus medius",
      "adductor longus",
      "iliopsoas",
      "tibialis anterior",
      "peroneus longus"
    ],
    "stabilizers": [
      "gluteus medius",
      "deep hip rotators",
      "transversus abdominis",
      "lumbar multifidus",
      "tibialis posterior",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "[object Object]"
    ],
    "commonForceOrSkillDemand": "Repeated submaximal-to-high unilateral propulsion and precise edge control over many stride cycles.",
    "recommendedExercisePatterns": [
      "single-leg squat pattern",
      "hip hinge",
      "lateral plyometric push-off",
      "calf and foot control"
    ],
    "recommendedExercises": [
      "single-leg squat",
      "single-leg Romanian deadlift",
      "skater bound",
      "standing calf raise",
      "tibialis raise"
    ],
    "transferRationale": "Unilateral strength and lateral elastic work share the support-leg and push-off demands of a skating stride, while the transfer remains indirect because blade-ice interaction and timing are not reproduced in the gym.",
    "exerciseSelectionCautions": "Progress landing volume gradually and keep the foot tripod and knee alignment controlled; do not force ankle range or use unstable surfaces as a proxy for skating skill.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4431820/",
      "https://ojs.ub.uni-konstanz.de/cpa/article/view/2985/2830"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed on-ice skating biomechanics and muscle-activity research, peer-reviewed shooting biomechanics, and scholarly power-skating literature, while limiting transfer claims because direct gym-to-ice causal evidence is sparse for several contact and goalie-specific movements."
  },
  {
    "id": "ice-hockey-3",
    "sportId": "ice-hockey",
    "label": "backward skating",
    "movementFamily": "cyclical skating and edge control",
    "bodyActions": [
      "low backward-facing stance",
      "repeated forward-directed skate-edge pushes",
      "controlled pelvis and trunk orientation"
    ],
    "jointActions": [
      "hip and knee flexion",
      "hip abduction and extension",
      "ankle dorsiflexion and edge control",
      "trunk anti-rotation"
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus maximus",
      "gluteus medius",
      "adductor magnus",
      "hamstring group"
    ],
    "assistingMuscles": [
      "soleus",
      "gastrocnemius",
      "tibialis anterior",
      "adductor longus",
      "iliopsoas"
    ],
    "stabilizers": [
      "transversus abdominis",
      "internal oblique",
      "lumbar multifidus",
      "deep hip rotators",
      "tibialis posterior",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "[object Object]"
    ],
    "commonForceOrSkillDemand": "Sustained low-center-of-mass control with backward visual orientation and repeated lateral force application.",
    "recommendedExercisePatterns": [
      "front-loaded squat",
      "unilateral lateral strength",
      "anti-rotation",
      "ankle dorsiflexion control"
    ],
    "recommendedExercises": [
      "goblet squat",
      "lateral lunge",
      "Copenhagen plank",
      "Pallof press",
      "tibialis raise"
    ],
    "transferRationale": "Flexed-leg strength, adductor capacity, and anti-rotation are shared physical qualities, but backward skating perception and blade edges must be trained on ice.",
    "exerciseSelectionCautions": "Adductor loading should be introduced progressively, especially for athletes with groin symptoms; keep squat depth within pain-free control.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4431820/",
      "https://ojs.ub.uni-konstanz.de/cpa/article/view/2985/2830"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed on-ice skating biomechanics and muscle-activity research, peer-reviewed shooting biomechanics, and scholarly power-skating literature, while limiting transfer claims because direct gym-to-ice causal evidence is sparse for several contact and goalie-specific movements."
  },
  {
    "id": "ice-hockey-4",
    "sportId": "ice-hockey",
    "label": "crossover",
    "movementFamily": "cyclical skating and edge control",
    "bodyActions": [
      "curved-path lateral acceleration",
      "crossing one skate over the other",
      "pelvic rotation around a curved trajectory"
    ],
    "jointActions": [
      "hip abduction and adduction",
      "hip internal and external rotation",
      "knee flexion-extension",
      "ankle edge stabilization"
    ],
    "primeMovers": [
      "gluteus medius",
      "gluteus maximus",
      "adductor magnus",
      "quadriceps femoris",
      "hamstring group"
    ],
    "assistingMuscles": [
      "adductor longus",
      "tensor fasciae latae",
      "deep hip rotators",
      "gastrocnemius",
      "soleus"
    ],
    "stabilizers": [
      "gluteus medius",
      "transversus abdominis",
      "internal oblique",
      "tibialis posterior",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "[object Object]"
    ],
    "commonForceOrSkillDemand": "High lateral and transverse-plane force with rapid alternating single-leg support on changing skate edges.",
    "recommendedExercisePatterns": [
      "lateral lunge",
      "lateral bound",
      "single-leg squat",
      "hip abductor/adductor strength",
      "anti-rotation"
    ],
    "recommendedExercises": [
      "lateral lunge",
      "skater bound",
      "single-leg squat",
      "Copenhagen plank",
      "Pallof press"
    ],
    "transferRationale": "Lateral and transverse-plane unilateral exercises reinforce the force and balance qualities used in crossovers, while curved skating coordination remains sport-specific.",
    "exerciseSelectionCautions": "Do not add high-volume bounds before the athlete can absorb landings quietly and maintain frontal-plane knee control.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4431820/",
      "https://ojs.ub.uni-konstanz.de/cpa/article/view/2985/2830"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed on-ice skating biomechanics and muscle-activity research, peer-reviewed shooting biomechanics, and scholarly power-skating literature, while limiting transfer claims because direct gym-to-ice causal evidence is sparse for several contact and goalie-specific movements."
  },
  {
    "id": "ice-hockey-5",
    "sportId": "ice-hockey",
    "label": "backward crossover",
    "movementFamily": "cyclical skating and edge control",
    "bodyActions": [
      "backward curved locomotion",
      "cross-step over the support skate",
      "low trunk and pelvis repositioning"
    ],
    "jointActions": [
      "hip abduction/adduction and rotation",
      "knee flexion-extension",
      "ankle edge control",
      "trunk anti-rotation"
    ],
    "primeMovers": [
      "gluteus medius",
      "gluteus maximus",
      "adductor magnus",
      "quadriceps femoris",
      "hamstring group"
    ],
    "assistingMuscles": [
      "adductor longus",
      "tensor fasciae latae",
      "deep hip rotators",
      "gastrocnemius",
      "soleus"
    ],
    "stabilizers": [
      "transversus abdominis",
      "internal oblique",
      "lumbar multifidus",
      "tibialis posterior",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "[object Object]"
    ],
    "commonForceOrSkillDemand": "Multiplanar force production under backward orientation, with demanding balance and edge precision.",
    "recommendedExercisePatterns": [
      "unilateral lateral strength",
      "adductor strength",
      "lateral plyometrics",
      "anti-rotation"
    ],
    "recommendedExercises": [
      "lateral lunge",
      "Copenhagen plank",
      "skater bound",
      "single-leg Romanian deadlift",
      "Pallof press"
    ],
    "transferRationale": "The selected patterns address lateral hip/adductor force and single-leg bracing that support crossover mechanics, but the backward visual and edge demands require on-ice practice.",
    "exerciseSelectionCautions": "Use lower amplitude and slower tempo if groin or knee control is limited; avoid assuming a Copenhagen plank reproduces the full skating action.",
    "evidenceConfidence": "limited",
    "sources": [
      "https://ojs.ub.uni-konstanz.de/cpa/article/view/2985/2830",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4431820/"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed on-ice skating biomechanics and muscle-activity research, peer-reviewed shooting biomechanics, and scholarly power-skating literature, while limiting transfer claims because direct gym-to-ice causal evidence is sparse for several contact and goalie-specific movements."
  },
  {
    "id": "ice-hockey-6",
    "sportId": "ice-hockey",
    "label": "hard stop",
    "movementFamily": "braking and change of direction",
    "bodyActions": [
      "rapid deceleration",
      "deep flexion with simultaneous skate-edge friction",
      "center-of-mass lowering"
    ],
    "jointActions": [
      "hip and knee flexion",
      "ankle dorsiflexion",
      "frontal-plane hip and knee control",
      "trunk bracing"
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus maximus",
      "hamstring group",
      "adductor magnus",
      "soleus"
    ],
    "assistingMuscles": [
      "gluteus medius",
      "gastrocnemius",
      "tibialis anterior",
      "adductor longus"
    ],
    "stabilizers": [
      "transversus abdominis",
      "lumbar multifidus",
      "gluteus medius",
      "tibialis posterior",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "[object Object]"
    ],
    "commonForceOrSkillDemand": "Very high eccentric force and frictional braking with limited time to absorb momentum before reacceleration.",
    "recommendedExercisePatterns": [
      "eccentric squat",
      "split-stance deceleration",
      "landing mechanics",
      "sled braking and acceleration"
    ],
    "recommendedExercises": [
      "front-foot-elevated split squat",
      "step-down",
      "drop landing",
      "sled push",
      "single-leg squat-to-stick"
    ],
    "transferRationale": "Eccentric lower-body training and controlled landing patterns share momentum absorption demands, but ice friction and blade angle are not reproduced off ice.",
    "exerciseSelectionCautions": "Introduce drop landings from low heights and stop if valgus, heel lift, or uncontrolled trunk motion appears; braking training is not injury prevention by itself.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://ojs.ub.uni-konstanz.de/cpa/article/view/2985/2830",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4431820/"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed on-ice skating biomechanics and muscle-activity research, peer-reviewed shooting biomechanics, and scholarly power-skating literature, while limiting transfer claims because direct gym-to-ice causal evidence is sparse for several contact and goalie-specific movements."
  },
  {
    "id": "ice-hockey-7",
    "sportId": "ice-hockey",
    "label": "directional cut",
    "movementFamily": "braking and change of direction",
    "bodyActions": [
      "forward approach",
      "hard plant and deceleration",
      "reorientation into a new skating line"
    ],
    "jointActions": [
      "hip flexion and rotation",
      "knee flexion",
      "ankle dorsiflexion and inversion/eversion control",
      "trunk rotation and anti-rotation"
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus maximus",
      "gluteus medius",
      "hamstring group",
      "adductor magnus"
    ],
    "assistingMuscles": [
      "soleus",
      "gastrocnemius",
      "adductor longus",
      "deep hip rotators",
      "tensor fasciae latae"
    ],
    "stabilizers": [
      "transversus abdominis",
      "internal oblique",
      "lumbar multifidus",
      "tibialis posterior",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "[object Object]"
    ],
    "commonForceOrSkillDemand": "Rapid deceleration followed by lateral or diagonal reacceleration, often under perceptual and tactical constraints.",
    "recommendedExercisePatterns": [
      "single-leg deceleration",
      "lateral push-off",
      "rotational strength",
      "anti-rotation"
    ],
    "recommendedExercises": [
      "step-down",
      "lateral lunge",
      "skater bound",
      "landmine rotation",
      "Pallof press"
    ],
    "transferRationale": "The exercises target force absorption, lateral drive, and trunk control that overlap with cutting, but decision timing and skate-edge mechanics require sport practice.",
    "exerciseSelectionCautions": "Keep cutting drills low volume when fatigued and progress from planned to reactive tasks only after consistent landing mechanics.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4431820/",
      "https://ojs.ub.uni-konstanz.de/cpa/article/view/2985/2830"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed on-ice skating biomechanics and muscle-activity research, peer-reviewed shooting biomechanics, and scholarly power-skating literature, while limiting transfer claims because direct gym-to-ice causal evidence is sparse for several contact and goalie-specific movements."
  },
  {
    "id": "ice-hockey-8",
    "sportId": "ice-hockey",
    "label": "slapshot",
    "movementFamily": "rotational striking and puck skills",
    "bodyActions": [
      "large backswing",
      "trunk rotation and flexion",
      "stick loading against the ice",
      "rapid release and follow-through"
    ],
    "jointActions": [
      "hip and thoracic rotation",
      "shoulder horizontal adduction and internal rotation",
      "elbow extension",
      "wrist flexion and pronation"
    ],
    "primeMovers": [
      "external oblique",
      "internal oblique",
      "pectoralis major",
      "latissimus dorsi",
      "anterior deltoid",
      "triceps brachii"
    ],
    "assistingMuscles": [
      "gluteus maximus",
      "adductor magnus",
      "serratus anterior",
      "biceps brachii",
      "pronator teres",
      "flexor carpi radialis"
    ],
    "stabilizers": [
      "erector spinae",
      "transversus abdominis",
      "rotator cuff",
      "rhomboid major",
      "middle trapezius",
      "lower trapezius"
    ],
    "contractionRoles": [
      "[object Object]"
    ],
    "commonForceOrSkillDemand": "High whole-body rotational power and proximal stability with a rapid stick-mediated release.",
    "recommendedExercisePatterns": [
      "medicine-ball rotational power",
      "landmine press/rotation",
      "horizontal pushing",
      "anti-rotation",
      "upper-body pulling"
    ],
    "recommendedExercises": [
      "medicine-ball rotational throw",
      "landmine rotation",
      "push press",
      "cable row",
      "Pallof press"
    ],
    "transferRationale": "Rotational throws and landmine work share sequencing and trunk-bracing demands; they develop general force qualities rather than proving faster or more accurate shooting.",
    "exerciseSelectionCautions": "Use submaximal rotational volume first and stop if lumbar extension substitutes for hip/thoracic rotation; preserve shoulder recovery and avoid chasing fatigue-based velocity.",
    "evidenceConfidence": "high",
    "sources": [
      "https://www.mdpi.com/2077-0383/14/6/2090",
      "https://thesportjournal.org/article/biomechanics-of-ice-hockey-slap-shots-which-stick-is-best/"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed on-ice skating biomechanics and muscle-activity research, peer-reviewed shooting biomechanics, and scholarly power-skating literature, while limiting transfer claims because direct gym-to-ice causal evidence is sparse for several contact and goalie-specific movements."
  },
  {
    "id": "ice-hockey-9",
    "sportId": "ice-hockey",
    "label": "wrist shot",
    "movementFamily": "rotational striking and puck skills",
    "bodyActions": [
      "compact weight shift",
      "stick and puck contact maintained through loading",
      "short trunk and shoulder rotation"
    ],
    "jointActions": [
      "hip and trunk rotation",
      "shoulder horizontal adduction",
      "elbow extension",
      "forearm pronation and wrist flexion"
    ],
    "primeMovers": [
      "pectoralis major",
      "anterior deltoid",
      "latissimus dorsi",
      "triceps brachii",
      "external oblique",
      "internal oblique"
    ],
    "assistingMuscles": [
      "serratus anterior",
      "gluteus maximus",
      "adductor magnus",
      "pronator teres",
      "flexor carpi radialis"
    ],
    "stabilizers": [
      "rotator cuff",
      "erector spinae",
      "transversus abdominis",
      "middle trapezius",
      "lower trapezius",
      "extensor carpi radialis"
    ],
    "contractionRoles": [
      "[object Object]"
    ],
    "commonForceOrSkillDemand": "Fast, compact force production with lower backswing and high requirements for accuracy and timing.",
    "recommendedExercisePatterns": [
      "medicine-ball chest pass",
      "cable press",
      "rotational press",
      "forearm control",
      "anti-rotation"
    ],
    "recommendedExercises": [
      "medicine-ball chest pass",
      "single-arm cable press",
      "landmine press",
      "cable row",
      "Pallof press"
    ],
    "transferRationale": "Short-range pressing, rotation, and trunk control overlap with the general force sequence of a wrist shot, but puck release and accuracy remain technical skills.",
    "exerciseSelectionCautions": "Keep pressing balanced with pulling and scapular control; avoid high-volume wrist loading if elbow or forearm irritation develops.",
    "evidenceConfidence": "high",
    "sources": [
      "https://www.mdpi.com/2077-0383/14/6/2090",
      "https://link.springer.com/article/10.1007/BF02844158"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed on-ice skating biomechanics and muscle-activity research, peer-reviewed shooting biomechanics, and scholarly power-skating literature, while limiting transfer claims because direct gym-to-ice causal evidence is sparse for several contact and goalie-specific movements."
  },
  {
    "id": "ice-hockey-10",
    "sportId": "ice-hockey",
    "label": "snap shot",
    "movementFamily": "rotational striking and puck skills",
    "bodyActions": [
      "rapid compact draw",
      "quick trunk and shoulder rotation",
      "whip-like release"
    ],
    "jointActions": [
      "hip and trunk rotation",
      "shoulder internal rotation and horizontal adduction",
      "elbow extension",
      "wrist flexion and forearm rotation"
    ],
    "primeMovers": [
      "pectoralis major",
      "latissimus dorsi",
      "anterior deltoid",
      "triceps brachii",
      "external oblique",
      "internal oblique"
    ],
    "assistingMuscles": [
      "serratus anterior",
      "gluteus maximus",
      "adductor magnus",
      "pronator teres",
      "flexor carpi ulnaris"
    ],
    "stabilizers": [
      "rotator cuff",
      "erector spinae",
      "transversus abdominis",
      "rhomboid major",
      "lower trapezius",
      "wrist extensors"
    ],
    "contractionRoles": [
      "[object Object]"
    ],
    "commonForceOrSkillDemand": "High rate of force development with less preparation time than a slap shot.",
    "recommendedExercisePatterns": [
      "ballistic rotational throw",
      "explosive push",
      "single-arm cable press",
      "anti-rotation"
    ],
    "recommendedExercises": [
      "medicine-ball rotational throw",
      "medicine-ball chest pass",
      "push press",
      "single-arm cable press",
      "Pallof press"
    ],
    "transferRationale": "Ballistic throws and fast pressing train general rate-of-force and trunk-to-arm sequencing that resemble the snap shot’s compact action, without claiming direct shot-performance causation.",
    "exerciseSelectionCautions": "Use full recovery between ballistic sets and prioritize precision over fatigue; limit shoulder volume when combined with extensive on-ice shooting.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://www.mdpi.com/2077-0383/14/6/2090",
      "https://link.springer.com/article/10.1007/BF02844158"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed on-ice skating biomechanics and muscle-activity research, peer-reviewed shooting biomechanics, and scholarly power-skating literature, while limiting transfer claims because direct gym-to-ice causal evidence is sparse for several contact and goalie-specific movements."
  },
  {
    "id": "ice-hockey-11",
    "sportId": "ice-hockey",
    "label": "one-timer",
    "movementFamily": "rotational striking and puck skills",
    "bodyActions": [
      "rapid repositioning into a loaded stance",
      "weight transfer",
      "one-motion full-body swing and follow-through"
    ],
    "jointActions": [
      "hip and trunk rotation",
      "lead-leg bracing",
      "shoulder horizontal adduction and internal rotation",
      "elbow extension",
      "wrist flexion"
    ],
    "primeMovers": [
      "external oblique",
      "internal oblique",
      "gluteus maximus",
      "adductor magnus",
      "pectoralis major",
      "latissimus dorsi"
    ],
    "assistingMuscles": [
      "quadriceps femoris",
      "anterior deltoid",
      "triceps brachii",
      "serratus anterior",
      "pronator teres",
      "flexor carpi radialis"
    ],
    "stabilizers": [
      "transversus abdominis",
      "erector spinae",
      "rotator cuff",
      "gluteus medius",
      "middle trapezius",
      "lower trapezius"
    ],
    "contractionRoles": [
      "[object Object]"
    ],
    "commonForceOrSkillDemand": "Very high timing, rapid force expression, and stable support-leg force transfer from a moving or changing puck.",
    "recommendedExercisePatterns": [
      "rotational medicine-ball throw",
      "split-stance power",
      "landmine rotation",
      "anti-rotation",
      "single-leg strength"
    ],
    "recommendedExercises": [
      "medicine-ball rotational throw",
      "landmine rotation",
      "rear-foot-elevated split squat",
      "cable row",
      "Pallof press"
    ],
    "transferRationale": "The patterns train general rotational power, split-stance bracing, and force sequencing; the pass-reading and millisecond timing must be developed through hockey practice.",
    "exerciseSelectionCautions": "Avoid maximal ballistic work when fatigued or when the athlete cannot control the lead-leg and trunk position; shoulder recovery is a programming priority.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://www.mdpi.com/2077-0383/14/6/2090",
      "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0127324"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed on-ice skating biomechanics and muscle-activity research, peer-reviewed shooting biomechanics, and scholarly power-skating literature, while limiting transfer claims because direct gym-to-ice causal evidence is sparse for several contact and goalie-specific movements."
  },
  {
    "id": "ice-hockey-12",
    "sportId": "ice-hockey",
    "label": "stick handling",
    "movementFamily": "rotational striking and puck skills",
    "bodyActions": [
      "repeated small-amplitude stick oscillations",
      "bilateral hand repositioning",
      "low-stance locomotor stabilization"
    ],
    "jointActions": [
      "shoulder flexion and rotation",
      "elbow flexion-extension",
      "forearm pronation-supination",
      "wrist flexion-extension",
      "trunk anti-rotation"
    ],
    "primeMovers": [
      "flexor digitorum profundus",
      "flexor digitorum superficialis",
      "extensor digitorum",
      "biceps brachii",
      "triceps brachii"
    ],
    "assistingMuscles": [
      "pectoralis major",
      "latissimus dorsi",
      "anterior deltoid",
      "pronator teres",
      "supinator",
      "serratus anterior"
    ],
    "stabilizers": [
      "rotator cuff",
      "middle trapezius",
      "lower trapezius",
      "transversus abdominis",
      "gluteus medius",
      "intrinsic hand muscles"
    ],
    "contractionRoles": [
      "[object Object]"
    ],
    "commonForceOrSkillDemand": "High coordination and grip endurance with repeated low-amplitude hand actions while skating or shielding the puck.",
    "recommendedExercisePatterns": [
      "farmer carry",
      "unilateral row",
      "wrist and forearm endurance",
      "low-stance isometric work"
    ],
    "recommendedExercises": [
      "farmer carry",
      "single-arm cable row",
      "wrist curl",
      "reverse wrist curl",
      "split-squat isometric hold"
    ],
    "transferRationale": "Carries, rows, and forearm endurance address grip, scapular, and trunk qualities that support stick control, but dexterity and puck perception are not gym-derived.",
    "exerciseSelectionCautions": "Balance flexor work with extensors and monitor medial/lateral elbow symptoms; keep grip training compatible with stick-handling and contact workloads.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://link.springer.com/content/pdf/10.1007/978-1-4939-3020-3.pdf#page=316",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4431820/"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed on-ice skating biomechanics and muscle-activity research, peer-reviewed shooting biomechanics, and scholarly power-skating literature, while limiting transfer claims because direct gym-to-ice causal evidence is sparse for several contact and goalie-specific movements."
  },
  {
    "id": "ice-hockey-13",
    "sportId": "ice-hockey",
    "label": "poke check",
    "movementFamily": "rotational striking and puck skills",
    "bodyActions": [
      "brief reach with the stick",
      "trunk and shoulder bracing",
      "rapid recovery to skating stance"
    ],
    "jointActions": [
      "shoulder flexion and protraction",
      "elbow extension",
      "wrist control",
      "hip and knee flexion",
      "trunk anti-rotation"
    ],
    "primeMovers": [
      "serratus anterior",
      "anterior deltoid",
      "pectoralis major",
      "triceps brachii",
      "quadriceps femoris"
    ],
    "assistingMuscles": [
      "latissimus dorsi",
      "biceps brachii",
      "gluteus maximus",
      "gluteus medius",
      "forearm flexor group"
    ],
    "stabilizers": [
      "rotator cuff",
      "lower trapezius",
      "middle trapezius",
      "transversus abdominis",
      "intrinsic foot muscles",
      "tibialis posterior"
    ],
    "contractionRoles": [
      "[object Object]"
    ],
    "commonForceOrSkillDemand": "Rapid low-amplitude reach and redirection without losing balance or the ability to accelerate.",
    "recommendedExercisePatterns": [
      "single-arm press",
      "unilateral row",
      "anti-rotation reach",
      "split-stance balance"
    ],
    "recommendedExercises": [
      "single-arm cable press",
      "single-arm cable row",
      "Pallof press",
      "rear-foot-elevated split squat",
      "farmer carry"
    ],
    "transferRationale": "Unilateral pressing/pulling and anti-rotation bracing share the reach-and-recover force demands, but stick contact accuracy and defensive timing are technical.",
    "exerciseSelectionCautions": "Avoid excessive loaded shoulder reach if scapular control is poor; train balance and recovery under coach supervision rather than adding unstable gym equipment.",
    "evidenceConfidence": "limited",
    "sources": [
      "https://link.springer.com/content/pdf/10.1007/978-1-4939-3020-3.pdf#page=316",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4431820/"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed on-ice skating biomechanics and muscle-activity research, peer-reviewed shooting biomechanics, and scholarly power-skating literature, while limiting transfer claims because direct gym-to-ice causal evidence is sparse for several contact and goalie-specific movements."
  },
  {
    "id": "ice-hockey-14",
    "sportId": "ice-hockey",
    "label": "body check",
    "movementFamily": "contact and resisted grappling",
    "bodyActions": [
      "accelerated approach",
      "low-body contact alignment",
      "whole-body force absorption and redirection"
    ],
    "jointActions": [
      "hip and knee flexion-extension",
      "ankle bracing",
      "trunk anti-flexion and anti-rotation",
      "shoulder and scapular stabilization"
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps femoris",
      "hamstring group",
      "adductor magnus",
      "pectoralis major",
      "latissimus dorsi"
    ],
    "assistingMuscles": [
      "gluteus medius",
      "gastrocnemius",
      "soleus",
      "anterior deltoid",
      "triceps brachii",
      "serratus anterior"
    ],
    "stabilizers": [
      "transversus abdominis",
      "internal oblique",
      "external oblique",
      "erector spinae",
      "rotator cuff",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "[object Object]"
    ],
    "commonForceOrSkillDemand": "High external-force absorption and production while maintaining legal body position and balance.",
    "recommendedExercisePatterns": [
      "sled drive",
      "heavy carry",
      "front-loaded squat",
      "split-stance strength",
      "anti-flexion bracing"
    ],
    "recommendedExercises": [
      "sled push",
      "farmer carry",
      "front squat",
      "rear-foot-elevated split squat",
      "front plank"
    ],
    "transferRationale": "Loaded carries, squats, and sleds develop general bracing and lower-body force qualities relevant to contact, but they cannot reproduce opponent interaction or establish collision safety.",
    "exerciseSelectionCautions": "Do not use maximal loads or deliberate impacts to simulate checking; coach spinal position, neck safety, and sport rules separately.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://journals.lww.com/nsca-jscr/fulltext/2021/12002/testing_specific_skating_performance_in_ice_hockey.11.aspx",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4431820/"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed on-ice skating biomechanics and muscle-activity research, peer-reviewed shooting biomechanics, and scholarly power-skating literature, while limiting transfer claims because direct gym-to-ice causal evidence is sparse for several contact and goalie-specific movements."
  },
  {
    "id": "ice-hockey-15",
    "sportId": "ice-hockey",
    "label": "board battle",
    "movementFamily": "contact and resisted grappling",
    "bodyActions": [
      "sustained bent-knee pushing and pulling",
      "edge-preserving repositioning",
      "upper-body leverage against resistance"
    ],
    "jointActions": [
      "hip and knee isometric flexion",
      "ankle edge stabilization",
      "shoulder extension and horizontal adduction",
      "elbow flexion",
      "trunk rotation and anti-rotation"
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus maximus",
      "adductor magnus",
      "latissimus dorsi",
      "pectoralis major",
      "flexor digitorum profundus"
    ],
    "assistingMuscles": [
      "hamstring group",
      "gluteus medius",
      "biceps brachii",
      "triceps brachii",
      "posterior deltoid",
      "forearm flexor group"
    ],
    "stabilizers": [
      "transversus abdominis",
      "internal oblique",
      "erector spinae",
      "rotator cuff",
      "rhomboid major",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "[object Object]"
    ],
    "commonForceOrSkillDemand": "Repeated high-force isometric and dynamic efforts in a confined space with unpredictable opponent resistance.",
    "recommendedExercisePatterns": [
      "heavy carry",
      "isometric split squat",
      "sled work",
      "staggered-stance row",
      "grip endurance"
    ],
    "recommendedExercises": [
      "farmer carry",
      "split-squat isometric hold",
      "sled push",
      "single-arm cable row",
      "towel hang"
    ],
    "transferRationale": "Carries, unilateral isometrics, rows, and sleds overlap with bracing and resisted force transfer, but board geometry, balance, and opponent tactics are not reproduced.",
    "exerciseSelectionCautions": "Limit prolonged gripping if elbow or hand symptoms arise; maintain neutral spine and avoid turning a fatigue drill into uncontrolled spinal flexion.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://journals.lww.com/nsca-jscr/fulltext/2021/12002/testing_specific_skating_performance_in_ice_hockey.11.aspx",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4431820/"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed on-ice skating biomechanics and muscle-activity research, peer-reviewed shooting biomechanics, and scholarly power-skating literature, while limiting transfer claims because direct gym-to-ice causal evidence is sparse for several contact and goalie-specific movements."
  },
  {
    "id": "ice-hockey-16",
    "sportId": "ice-hockey",
    "label": "faceoff pull",
    "movementFamily": "contact and resisted grappling",
    "bodyActions": [
      "low stance",
      "rapid bilateral or unilateral stick pull",
      "trunk rotation with leg-driven force transfer"
    ],
    "jointActions": [
      "shoulder extension",
      "elbow flexion",
      "forearm and wrist flexion",
      "hip and knee bracing",
      "trunk rotation and anti-rotation"
    ],
    "primeMovers": [
      "latissimus dorsi",
      "biceps brachii",
      "brachialis",
      "flexor digitorum profundus",
      "external oblique",
      "gluteus maximus"
    ],
    "assistingMuscles": [
      "posterior deltoid",
      "rhomboid major",
      "middle trapezius",
      "quadriceps femoris",
      "adductor magnus",
      "brachioradialis"
    ],
    "stabilizers": [
      "rotator cuff",
      "lower trapezius",
      "transversus abdominis",
      "lumbar multifidus",
      "gluteus medius",
      "intrinsic hand muscles"
    ],
    "contractionRoles": [
      "[object Object]"
    ],
    "commonForceOrSkillDemand": "Fast high-force pulling and grip engagement from a low, constrained stance.",
    "recommendedExercisePatterns": [
      "staggered-stance row",
      "heavy carry",
      "towel-grip pull",
      "landmine rotation",
      "anti-rotation"
    ],
    "recommendedExercises": [
      "single-arm cable row",
      "farmer carry",
      "towel hang",
      "landmine rotation",
      "Pallof press"
    ],
    "transferRationale": "Rows, grip work, and trunk rotation share the broad pulling and bracing qualities of a faceoff, but hand position, stick leverage, and opponent reaction remain sport-specific.",
    "exerciseSelectionCautions": "Use neutral or semi-supinated grips when possible and avoid jerking through the shoulder; progress towel work slowly for the fingers and elbows.",
    "evidenceConfidence": "limited",
    "sources": [
      "https://journals.lww.com/nsca-jscr/fulltext/2021/12002/testing_specific_skating_performance_in_ice_hockey.11.aspx",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4431820/"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed on-ice skating biomechanics and muscle-activity research, peer-reviewed shooting biomechanics, and scholarly power-skating literature, while limiting transfer claims because direct gym-to-ice causal evidence is sparse for several contact and goalie-specific movements."
  },
  {
    "id": "ice-hockey-17",
    "sportId": "ice-hockey",
    "label": "low skating stance",
    "movementFamily": "low-stance isometric endurance",
    "bodyActions": [
      "sustained hip, knee, and ankle flexion",
      "forward-compatible trunk position",
      "pelvic control during glide and push"
    ],
    "jointActions": [
      "hip flexion with extension capacity",
      "knee flexion",
      "ankle dorsiflexion",
      "trunk anti-flexion",
      "foot tripod control"
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus maximus",
      "hamstring group",
      "adductor magnus",
      "soleus"
    ],
    "assistingMuscles": [
      "gastrocnemius",
      "gluteus medius",
      "erector spinae",
      "adductor longus",
      "tibialis anterior"
    ],
    "stabilizers": [
      "transversus abdominis",
      "lumbar multifidus",
      "gluteus medius",
      "tibialis posterior",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "[object Object]"
    ],
    "commonForceOrSkillDemand": "Repeated or prolonged low-position support with enough reserve to accelerate, turn, and absorb contact.",
    "recommendedExercisePatterns": [
      "split-squat isometric",
      "front-loaded squat",
      "trunk anti-flexion",
      "calf endurance"
    ],
    "recommendedExercises": [
      "split-squat isometric hold",
      "front squat",
      "goblet squat",
      "front plank",
      "seated calf raise"
    ],
    "transferRationale": "Isometric and front-loaded squat patterns address general low-position force endurance and trunk control; they do not reproduce skating-specific blade balance.",
    "exerciseSelectionCautions": "Avoid forcing depth or lumbar flexion; use interval duration and load that preserve posture rather than chasing maximal burn.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4431820/",
      "https://ojs.ub.uni-konstanz.de/cpa/article/view/2985/2830"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed on-ice skating biomechanics and muscle-activity research, peer-reviewed shooting biomechanics, and scholarly power-skating literature, while limiting transfer claims because direct gym-to-ice causal evidence is sparse for several contact and goalie-specific movements."
  },
  {
    "id": "ice-hockey-18",
    "sportId": "ice-hockey",
    "label": "lateral goalie push",
    "movementFamily": "lateral goalie power and recovery",
    "bodyActions": [
      "explosive push from one skate edge",
      "lateral displacement",
      "controlled landing and re-centering"
    ],
    "jointActions": [
      "hip abduction and extension",
      "knee extension",
      "ankle plantarflexion",
      "pelvic stabilization",
      "trunk anti-lateral-flexion"
    ],
    "primeMovers": [
      "gluteus medius",
      "gluteus maximus",
      "adductor magnus",
      "quadriceps femoris",
      "hamstring group",
      "soleus"
    ],
    "assistingMuscles": [
      "gastrocnemius",
      "adductor longus",
      "tensor fasciae latae",
      "peroneus longus",
      "peroneus brevis"
    ],
    "stabilizers": [
      "transversus abdominis",
      "quadratus lumborum",
      "gluteus medius",
      "tibialis posterior",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "[object Object]"
    ],
    "commonForceOrSkillDemand": "High-rate lateral propulsion and deceleration from a wide, low base with repeated recovery demands.",
    "recommendedExercisePatterns": [
      "lateral sled push",
      "skater bound",
      "single-leg landing",
      "Copenhagen adductor work",
      "anti-lateral-flexion"
    ],
    "recommendedExercises": [
      "lateral sled push",
      "skater bound",
      "single-leg squat-to-stick",
      "Copenhagen plank",
      "suitcase carry"
    ],
    "transferRationale": "Lateral resisted pushes, bounds, adductor work, and unilateral landing control share force-direction and stabilization qualities; goalie-specific crease movement remains highly technical.",
    "exerciseSelectionCautions": "Progress lateral range and landing height conservatively; avoid forcing wide hip positions or adding load when the pelvis cannot remain controlled.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4431820/",
      "https://ojs.ub.uni-konstanz.de/cpa/article/view/2985/2830"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed on-ice skating biomechanics and muscle-activity research, peer-reviewed shooting biomechanics, and scholarly power-skating literature, while limiting transfer claims because direct gym-to-ice causal evidence is sparse for several contact and goalie-specific movements."
  },
  {
    "id": "ice-hockey-19",
    "sportId": "ice-hockey",
    "label": "goalie butterfly",
    "movementFamily": "lateral goalie power and recovery",
    "bodyActions": [
      "rapid low blocking posture",
      "wide knee separation with controlled hip positioning",
      "isometric hold followed by recovery"
    ],
    "jointActions": [
      "hip abduction and external rotation",
      "knee flexion",
      "ankle and lower-leg rotation",
      "trunk and pelvic stabilization"
    ],
    "primeMovers": [
      "gluteus medius",
      "gluteus maximus",
      "adductor magnus",
      "adductor longus",
      "quadriceps femoris"
    ],
    "assistingMuscles": [
      "hamstring group",
      "deep hip rotators",
      "tensor fasciae latae",
      "soleus",
      "gastrocnemius"
    ],
    "stabilizers": [
      "transversus abdominis",
      "quadratus lumborum",
      "gluteus medius",
      "rotator cuff",
      "tibialis posterior"
    ],
    "contractionRoles": [
      "[object Object]"
    ],
    "commonForceOrSkillDemand": "Repeated low-position blocking and recovery with substantial hip mobility, adductor control, and positional endurance.",
    "recommendedExercisePatterns": [
      "Copenhagen adductor work",
      "lateral hip strength",
      "half-kneeling transition",
      "trunk stability",
      "controlled squat"
    ],
    "recommendedExercises": [
      "Copenhagen plank",
      "lateral lunge",
      "half-kneeling get-up",
      "front plank",
      "goblet squat"
    ],
    "transferRationale": "Adductor and lateral-hip strength plus controlled transitions support general positional capacity, but the butterfly technique and required range are goalie-specific.",
    "exerciseSelectionCautions": "Do not force end-range hip abduction or external rotation; coordinate with goalie coaching and medical assessment for hip, groin, knee, or lumbar symptoms.",
    "evidenceConfidence": "limited",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4431820/",
      "https://ojs.ub.uni-konstanz.de/cpa/article/view/2985/2830"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed on-ice skating biomechanics and muscle-activity research, peer-reviewed shooting biomechanics, and scholarly power-skating literature, while limiting transfer claims because direct gym-to-ice causal evidence is sparse for several contact and goalie-specific movements."
  },
  {
    "id": "ice-hockey-20",
    "sportId": "ice-hockey",
    "label": "explosive crease recovery",
    "movementFamily": "lateral goalie power and recovery",
    "bodyActions": [
      "rise from low or sprawled position",
      "hip and knee extension",
      "lateral push and rapid re-centering"
    ],
    "jointActions": [
      "hip and knee extension",
      "ankle plantarflexion",
      "lateral hip abduction/adduction",
      "trunk repositioning and anti-rotation"
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps femoris",
      "hamstring group",
      "gluteus medius",
      "adductor magnus",
      "soleus"
    ],
    "assistingMuscles": [
      "gastrocnemius",
      "adductor longus",
      "tensor fasciae latae",
      "iliopsoas",
      "anterior deltoid"
    ],
    "stabilizers": [
      "transversus abdominis",
      "internal oblique",
      "quadratus lumborum",
      "rotator cuff",
      "tibialis posterior",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "[object Object]"
    ],
    "commonForceOrSkillDemand": "High-rate transition from floor or low posture to lateral movement, followed by braking and centered readiness.",
    "recommendedExercisePatterns": [
      "get-up variation",
      "lateral bound",
      "lateral resisted drive",
      "single-leg landing",
      "anti-rotation"
    ],
    "recommendedExercises": [
      "half-kneeling get-up",
      "skater bound",
      "lateral sled push",
      "single-leg squat-to-stick",
      "Pallof press"
    ],
    "transferRationale": "Get-up, lateral propulsion, landing, and anti-rotation patterns share broad rise-and-recover force demands, but crease-specific perception, equipment, and movement sequencing must be coached on ice.",
    "exerciseSelectionCautions": "Use low complexity first and protect the knees, hips, shoulders, and wrists during floor transitions; stop when recovery speed compromises alignment.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC4431820/",
      "https://ojs.ub.uni-konstanz.de/cpa/article/view/2985/2830"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed on-ice skating biomechanics and muscle-activity research, peer-reviewed shooting biomechanics, and scholarly power-skating literature, while limiting transfer claims because direct gym-to-ice causal evidence is sparse for several contact and goalie-specific movements."
  },
  {
    "id": "lacrosse-1",
    "sportId": "lacrosse",
    "label": "overhand shot",
    "movementFamily": "overhead rotational power",
    "bodyActions": [
      "Approach or set position, trunk extension/rotation, shoulder elevation and external-to-internal rotation, elbow extension, and wrist release."
    ],
    "jointActions": [
      "Hip and thoracic rotation",
      "spinal extension/rotation",
      "shoulder elevation and internal rotation",
      "elbow extension",
      "wrist flexion."
    ],
    "primeMovers": [
      "Pectoralis major, latissimus dorsi, anterior deltoid, triceps brachii, serratus anterior, external oblique, internal oblique, gluteus maximus."
    ],
    "assistingMuscles": [
      "Serratus anterior, posterior deltoid, brachialis, forearm flexor digitorum superficialis, forearm flexor digitorum profundus, hip adductors."
    ],
    "stabilizers": [
      "Rotator cuff, middle trapezius, lower trapezius, rhomboid major, wrist extensors, gluteus medius, deep hip rotators."
    ],
    "contractionRoles": [
      "Concentric proximal-to-distal acceleration",
      "eccentric shoulder/arm and trunk braking",
      "isometric lower-body bracing."
    ],
    "commonForceOrSkillDemand": "High-velocity stick acceleration and follow-through with lower-body-to-trunk force transfer.",
    "recommendedExercisePatterns": [
      "Medicine-ball rotational throw",
      "Cable lift",
      "Split squat",
      "Pallof press"
    ],
    "recommendedExercises": [
      "Medicine-ball rotational throw",
      "Cable lift",
      "Split squat",
      "Pallof press"
    ],
    "transferRationale": "These patterns train rotational impulse, split-stance force transfer, and anti-rotation control that share broad mechanics with shooting, but they do not reproduce stick timing or prove performance gains.",
    "exerciseSelectionCautions": "Use submaximal throws initially; avoid forcing lumbar extension or high-volume overhead work with shoulder or back symptoms.",
    "evidenceConfidence": "high",
    "sources": [
      "https://www.tandfonline.com/doi/full/10.1080/23335432.2015.1017608",
      "https://thesportjournal.org/article/description-of-phases-and-discrete-events-of-the-lacrosse-shot/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed lacrosse-shot biomechanics and sport-movement research with sports-medicine and strength-and-conditioning evidence; direct evidence for exercise-to-lacrosse performance transfer remains limited and is explicitly treated as mechanical rationale rather than causal proof."
  },
  {
    "id": "lacrosse-2",
    "sportId": "lacrosse",
    "label": "sidearm shot",
    "movementFamily": "rotational/horizontal arm power",
    "bodyActions": [
      "Split or moving stance with transverse-plane trunk rotation, horizontal arm path, elbow extension, and forearm/wrist snap."
    ],
    "jointActions": [
      "Hip/trunk rotation",
      "shoulder horizontal adduction and internal rotation",
      "elbow extension",
      "forearm pronation",
      "wrist flexion."
    ],
    "primeMovers": [
      "Pectoralis major, anterior deltoid, triceps brachii, latissimus dorsi, external oblique, internal oblique, gluteus maximus."
    ],
    "assistingMuscles": [
      "Serratus anterior, posterior deltoid, brachialis, pronator teres, forearm flexors, adductor magnus."
    ],
    "stabilizers": [
      "Rotator cuff, middle/lower trapezius, rhomboids, wrist extensors, gluteus medius, ankle-foot muscles."
    ],
    "contractionRoles": [
      "Concentric release",
      "eccentric follow-through",
      "isometric trunk and lead-leg control."
    ],
    "commonForceOrSkillDemand": "Fast transverse-plane release from a unilateral base while preserving accuracy.",
    "recommendedExercisePatterns": [
      "Medicine-ball side throw",
      "Cable rotation",
      "Split squat",
      "Pallof press"
    ],
    "recommendedExercises": [
      "Medicine-ball side throw",
      "Cable rotation",
      "Split squat",
      "Pallof press"
    ],
    "transferRationale": "Rotational throws and cable rotations develop comparable sequencing and trunk control; unilateral strength supports the base, without implying direct shot-speed causation.",
    "exerciseSelectionCautions": "Keep load light enough for speed and control; do not substitute loaded rotation for technical shooting practice.",
    "evidenceConfidence": "high",
    "sources": [
      "https://www.tandfonline.com/doi/full/10.1080/23335432.2015.1017608",
      "https://thesportjournal.org/article/description-of-phases-and-discrete-events-of-the-lacrosse-shot/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed lacrosse-shot biomechanics and sport-movement research with sports-medicine and strength-and-conditioning evidence; direct evidence for exercise-to-lacrosse performance transfer remains limited and is explicitly treated as mechanical rationale rather than causal proof."
  },
  {
    "id": "lacrosse-3",
    "sportId": "lacrosse",
    "label": "underhand shot",
    "movementFamily": "low-to-high rotational power",
    "bodyActions": [
      "Lowered center of mass, hip/knee extension with trunk rotation, shoulder extension-to-flexion, elbow extension, and wrist release."
    ],
    "jointActions": [
      "Hip/knee extension",
      "trunk rotation",
      "shoulder flexion/internal rotation",
      "elbow extension",
      "wrist flexion."
    ],
    "primeMovers": [
      "Gluteus maximus, quadriceps femoris, hamstrings, external oblique, internal oblique, pectoralis major, anterior deltoid, triceps brachii."
    ],
    "assistingMuscles": [
      "Adductor magnus, latissimus dorsi, serratus anterior, brachialis, forearm flexors."
    ],
    "stabilizers": [
      "Gluteus medius, deep hip rotators, rotator cuff, lower trapezius, ankle-foot muscles, wrist extensors."
    ],
    "contractionRoles": [
      "Eccentric lowering",
      "concentric leg drive and release",
      "eccentric braking and isometric balance."
    ],
    "commonForceOrSkillDemand": "Low-position force production followed by rapid upward and rotational projection.",
    "recommendedExercisePatterns": [
      "Goblet squat",
      "Split squat",
      "Cable chop",
      "Medicine-ball scoop toss"
    ],
    "recommendedExercises": [
      "Goblet squat",
      "Split squat",
      "Cable chop",
      "Medicine-ball scoop toss"
    ],
    "transferRationale": "Squat/split-squat and low-to-high throw patterns overlap with the shot's leg-drive and trunk-to-stick sequence, but not the sport skill itself.",
    "exerciseSelectionCautions": "Progress depth and rotation separately; protect knees, hips, and lumbar spine from rushed combined loading.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://www.tandfonline.com/doi/full/10.1080/23335432.2015.1017608",
      "https://thesportjournal.org/article/description-of-phases-and-discrete-events-of-the-lacrosse-shot/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed lacrosse-shot biomechanics and sport-movement research with sports-medicine and strength-and-conditioning evidence; direct evidence for exercise-to-lacrosse performance transfer remains limited and is explicitly treated as mechanical rationale rather than causal proof."
  },
  {
    "id": "lacrosse-4",
    "sportId": "lacrosse",
    "label": "passing",
    "movementFamily": "rotational pushing/throwing",
    "bodyActions": [
      "Coordinated trunk rotation with shoulder horizontal adduction/flexion, elbow extension, and wrist/finger control."
    ],
    "jointActions": [
      "Thoracic/hip rotation",
      "shoulder flexion/horizontal adduction",
      "elbow extension",
      "wrist/finger flexion."
    ],
    "primeMovers": [
      "Pectoralis major, anterior deltoid, triceps brachii, external oblique, internal oblique, serratus anterior."
    ],
    "assistingMuscles": [
      "Latissimus dorsi, posterior deltoid, brachialis, forearm flexors, gluteus maximus."
    ],
    "stabilizers": [
      "Rotator cuff, middle/lower trapezius, rhomboids, wrist extensors, gluteus medius, trunk musculature."
    ],
    "contractionRoles": [
      "Concentric propulsion",
      "eccentric arm braking",
      "isometric postural control."
    ],
    "commonForceOrSkillDemand": "Repeated accurate projection at variable distances while moving or bracing.",
    "recommendedExercisePatterns": [
      "Medicine-ball chest pass",
      "Cable press",
      "Pallof press",
      "Cable rotation"
    ],
    "recommendedExercises": [
      "Medicine-ball chest pass",
      "Cable press",
      "Pallof press",
      "Cable rotation"
    ],
    "transferRationale": "Chest passes and cable presses share upper-body projection; anti-rotation and rotation drills support force transfer, not passing accuracy or decision-making.",
    "exerciseSelectionCautions": "Avoid excessive pressing volume; balance pressing with pulling and scapular control.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://www.tandfonline.com/doi/full/10.1080/23335432.2015.1017608",
      "https://journals.lww.com/acsm-csmr/fulltext/2018/06000/Core_and_Back_Rehabilitation_for_High_speed.9.aspx"
    ],
    "sourceSummary": "The records synthesize peer-reviewed lacrosse-shot biomechanics and sport-movement research with sports-medicine and strength-and-conditioning evidence; direct evidence for exercise-to-lacrosse performance transfer remains limited and is explicitly treated as mechanical rationale rather than causal proof."
  },
  {
    "id": "lacrosse-5",
    "sportId": "lacrosse",
    "label": "catching",
    "movementFamily": "receiving/deceleration",
    "bodyActions": [
      "Shoulder and elbow flexion with forearm rotation and compliant wrist give to absorb ball momentum."
    ],
    "jointActions": [
      "Shoulder flexion",
      "elbow flexion",
      "forearm pronation/supination",
      "wrist extension/flexion."
    ],
    "primeMovers": [
      "Biceps brachii, brachialis, brachioradialis, posterior deltoid, pectoralis major."
    ],
    "assistingMuscles": [
      "Forearm flexor digitorum superficialis, forearm flexor digitorum profundus, triceps brachii, latissimus dorsi."
    ],
    "stabilizers": [
      "Rotator cuff, serratus anterior, middle/lower trapezius, wrist extensors, trunk, gluteus medius."
    ],
    "contractionRoles": [
      "Eccentric absorption followed by isometric capture and concentric repositioning."
    ],
    "commonForceOrSkillDemand": "Rapidly attenuating ball momentum while maintaining stick and body control.",
    "recommendedExercisePatterns": [
      "Eccentric row",
      "Medicine-ball catch",
      "Farmer carry",
      "Face pull"
    ],
    "recommendedExercises": [
      "Eccentric row",
      "Medicine-ball catch",
      "Farmer carry",
      "Face pull"
    ],
    "transferRationale": "Rows, catches, carries, and face pulls develop general pulling, grip, and scapular control relevant to receiving, with no claim of direct catching improvement.",
    "exerciseSelectionCautions": "Use low-velocity catches and neutral shoulder positions; stop for pain, instability, or numbness.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://www.tandfonline.com/doi/full/10.1080/23335432.2015.1017608",
      "https://journals.lww.com/acsm-csmr/fulltext/2018/06000/Core_and_Back_Rehabilitation_for_High_speed.9.aspx"
    ],
    "sourceSummary": "The records synthesize peer-reviewed lacrosse-shot biomechanics and sport-movement research with sports-medicine and strength-and-conditioning evidence; direct evidence for exercise-to-lacrosse performance transfer remains limited and is explicitly treated as mechanical rationale rather than causal proof."
  },
  {
    "id": "lacrosse-6",
    "sportId": "lacrosse",
    "label": "cradling",
    "movementFamily": "stick-control locomotion",
    "bodyActions": [
      "Low-amplitude shoulder, elbow, forearm, and wrist oscillations while pelvis and trunk stabilize during locomotion."
    ],
    "jointActions": [
      "Small shoulder/elbow excursions",
      "forearm pronation/supination",
      "wrist motion",
      "hip and ankle stabilization."
    ],
    "primeMovers": [
      "Forearm flexor digitorum superficialis, forearm flexor digitorum profundus, extensor carpi radialis, biceps brachii, triceps brachii."
    ],
    "assistingMuscles": [
      "Anterior deltoid, posterior deltoid, rotator cuff, brachioradialis, serratus anterior."
    ],
    "stabilizers": [
      "Middle/lower trapezius, rhomboids, external/internal oblique, gluteus medius, adductors, ankle-foot muscles."
    ],
    "contractionRoles": [
      "Low-amplitude cyclic concentric/eccentric work with sustained isometric shoulder, trunk, and pelvic control."
    ],
    "commonForceOrSkillDemand": "Fine motor stick control under running, contact, and visual-attentional demands.",
    "recommendedExercisePatterns": [
      "Farmer carry",
      "Suitcase carry",
      "Unilateral row",
      "Band walk"
    ],
    "recommendedExercises": [
      "Farmer carry",
      "Suitcase carry",
      "Unilateral row",
      "Band walk"
    ],
    "transferRationale": "Carries and unilateral rows build grip and proximal control while band walks address locomotor pelvic stability; they cannot replicate ball protection or skill perception.",
    "exerciseSelectionCautions": "Keep grip relaxed enough to avoid forearm overuse; vary carry duration and side.",
    "evidenceConfidence": "limited",
    "sources": [
      "https://www.tandfonline.com/doi/full/10.1080/23335432.2015.1017608",
      "https://journals.lww.com/acsm-csmr/fulltext/2018/06000/Core_and_Back_Rehabilitation_for_High_speed.9.aspx"
    ],
    "sourceSummary": "The records synthesize peer-reviewed lacrosse-shot biomechanics and sport-movement research with sports-medicine and strength-and-conditioning evidence; direct evidence for exercise-to-lacrosse performance transfer remains limited and is explicitly treated as mechanical rationale rather than causal proof."
  },
  {
    "id": "lacrosse-7",
    "sportId": "lacrosse",
    "label": "dodging",
    "movementFamily": "multidirectional acceleration/deceleration",
    "bodyActions": [
      "Rapid braking, lateral displacement, trunk lean, reacceleration, and stick-side shielding."
    ],
    "jointActions": [
      "Hip/knee flexion-extension",
      "hip abduction/adduction",
      "ankle dorsiflexion/plantarflexion",
      "trunk anti-rotation."
    ],
    "primeMovers": [
      "Gluteus maximus, quadriceps femoris, hamstrings, adductor magnus, gluteus medius, gastrocnemius, soleus."
    ],
    "assistingMuscles": [
      "Tensor fasciae latae, sartorius, external/internal oblique, erector spinae."
    ],
    "stabilizers": [
      "Deep hip rotators, ankle-foot muscles, trunk stabilizers, scapular stabilizers."
    ],
    "contractionRoles": [
      "Eccentric braking, concentric reacceleration, isometric torso control."
    ],
    "commonForceOrSkillDemand": "Repeated high-rate stop-start and lateral force redirection.",
    "recommendedExercisePatterns": [
      "Lateral bound",
      "Deceleration lunge",
      "Resisted sprint",
      "Split squat"
    ],
    "recommendedExercises": [
      "Lateral bound",
      "Deceleration lunge",
      "Resisted sprint",
      "Split squat"
    ],
    "transferRationale": "These patterns overlap with braking, unilateral force, and reacceleration; reactive opponent reading and stick protection remain sport-specific.",
    "exerciseSelectionCautions": "Progress landing and braking volume gradually; prioritize knee-over-foot alignment.",
    "evidenceConfidence": "high",
    "sources": [
      "https://www.tandfonline.com/doi/full/10.1080/23335432.2015.1017608",
      "https://journals.lww.com/acsm-csmr/fulltext/2018/06000/Core_and_Back_Rehabilitation_for_High_speed.9.aspx"
    ],
    "sourceSummary": "The records synthesize peer-reviewed lacrosse-shot biomechanics and sport-movement research with sports-medicine and strength-and-conditioning evidence; direct evidence for exercise-to-lacrosse performance transfer remains limited and is explicitly treated as mechanical rationale rather than causal proof."
  },
  {
    "id": "lacrosse-8",
    "sportId": "lacrosse",
    "label": "split dodge",
    "movementFamily": "unilateral change of direction",
    "bodyActions": [
      "Forward drive, hard plant, crossover/direction change, hip rotation, and trunk redirection."
    ],
    "jointActions": [
      "Hip/knee flexion-extension",
      "hip internal/external rotation",
      "ankle dorsiflexion",
      "trunk rotation/anti-rotation."
    ],
    "primeMovers": [
      "Gluteus maximus, quadriceps femoris, hamstrings, adductor magnus, gastrocnemius, soleus."
    ],
    "assistingMuscles": [
      "Gluteus medius, adductor longus, external/internal oblique, tensor fasciae latae."
    ],
    "stabilizers": [
      "Deep hip rotators, ankle-foot muscles, trunk, shoulder girdle."
    ],
    "contractionRoles": [
      "Eccentric plant, concentric push-off, isometric stick-side control."
    ],
    "commonForceOrSkillDemand": "Unilateral braking and lateral-to-linear redirection.",
    "recommendedExercisePatterns": [
      "Rear-foot-elevated split squat",
      "Lateral lunge",
      "Crossover bound",
      "Resisted sprint"
    ],
    "recommendedExercises": [
      "Rear-foot-elevated split squat",
      "Lateral lunge",
      "Crossover bound",
      "Resisted sprint"
    ],
    "transferRationale": "Unilateral strength and bounds provide mechanical preparation for planting and pushing, not a guarantee of better dodging.",
    "exerciseSelectionCautions": "Use stable surfaces and controlled amplitudes before reactive crossover work.",
    "evidenceConfidence": "high",
    "sources": [
      "https://www.tandfonline.com/doi/full/10.1080/23335432.2015.1017608",
      "https://journals.lww.com/acsm-csmr/fulltext/2018/06000/Core_and_Back_Rehabilitation_for_High_speed.9.aspx"
    ],
    "sourceSummary": "The records synthesize peer-reviewed lacrosse-shot biomechanics and sport-movement research with sports-medicine and strength-and-conditioning evidence; direct evidence for exercise-to-lacrosse performance transfer remains limited and is explicitly treated as mechanical rationale rather than causal proof."
  },
  {
    "id": "lacrosse-9",
    "sportId": "lacrosse",
    "label": "roll dodge",
    "movementFamily": "rotational change of direction",
    "bodyActions": [
      "Unilateral plant, body rotation around a defender, lateral push-off, and trunk/stick shielding."
    ],
    "jointActions": [
      "Hip/knee flexion-extension",
      "hip rotation",
      "trunk rotation/anti-rotation",
      "ankle push-off."
    ],
    "primeMovers": [
      "Gluteus maximus, quadriceps femoris, hamstrings, adductor magnus, external/internal oblique, gastrocnemius."
    ],
    "assistingMuscles": [
      "Gluteus medius, deep hip rotators, soleus, erector spinae, latissimus dorsi."
    ],
    "stabilizers": [
      "Ankle-foot muscles, trunk, scapular stabilizers."
    ],
    "contractionRoles": [
      "Eccentric loading, concentric rotation/push-off, isometric shielding."
    ],
    "commonForceOrSkillDemand": "Forceful plant and rotation under contact and spatial constraint.",
    "recommendedExercisePatterns": [
      "Lateral lunge",
      "Medicine-ball rotational throw",
      "Split squat",
      "Deceleration lunge"
    ],
    "recommendedExercises": [
      "Lateral lunge",
      "Medicine-ball rotational throw",
      "Split squat",
      "Deceleration lunge"
    ],
    "transferRationale": "The combination addresses unilateral loading, transverse-plane force, and braking; it does not reproduce defender interaction.",
    "exerciseSelectionCautions": "Avoid high-speed 180-degree work until deceleration mechanics are consistent.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://www.tandfonline.com/doi/full/10.1080/23335432.2015.1017608",
      "https://journals.lww.com/acsm-csmr/fulltext/2018/06000/Core_and_Back_Rehabilitation_for_High_speed.9.aspx"
    ],
    "sourceSummary": "The records synthesize peer-reviewed lacrosse-shot biomechanics and sport-movement research with sports-medicine and strength-and-conditioning evidence; direct evidence for exercise-to-lacrosse performance transfer remains limited and is explicitly treated as mechanical rationale rather than causal proof."
  },
  {
    "id": "lacrosse-10",
    "sportId": "lacrosse",
    "label": "faceoff clamp",
    "movementFamily": "low-position pulling and grip power",
    "bodyActions": [
      "Low crouch with braced trunk, rapid shoulder/wrist rotation, and forceful stick pull."
    ],
    "jointActions": [
      "Hip/knee/ankle flexion",
      "shoulder extension/adduction",
      "elbow flexion",
      "forearm rotation",
      "wrist flexion."
    ],
    "primeMovers": [
      "Quadriceps femoris, gluteus maximus, hamstrings, latissimus dorsi, biceps brachii, forearm flexors."
    ],
    "assistingMuscles": [
      "Adductor magnus, brachialis, pectoralis major, external/internal oblique, posterior deltoid."
    ],
    "stabilizers": [
      "Rotator cuff, scapular stabilizers, trunk, gluteus medius, knee/ankle stabilizers."
    ],
    "contractionRoles": [
      "Isometric setup",
      "concentric pulling",
      "eccentric repositioning."
    ],
    "commonForceOrSkillDemand": "Short-duration maximal pulling and grip force from a low stable base.",
    "recommendedExercisePatterns": [
      "Farmer carry",
      "Towel-grip row",
      "Split squat",
      "Pallof press"
    ],
    "recommendedExercises": [
      "Farmer carry",
      "Towel-grip row",
      "Split squat",
      "Pallof press"
    ],
    "transferRationale": "Carries, rows, split squats, and anti-rotation share grip, pulling, stance, and trunk-bracing demands without modeling faceoff timing.",
    "exerciseSelectionCautions": "Use neutral wrists and conservative grip volume; avoid maximal pulls in flexed lumbar positions.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://www.tandfonline.com/doi/full/10.1080/23335432.2015.1017608",
      "https://journals.lww.com/acsm-csmr/fulltext/2018/06000/Core_and_Back_Rehabilitation_for_High_speed.9.aspx"
    ],
    "sourceSummary": "The records synthesize peer-reviewed lacrosse-shot biomechanics and sport-movement research with sports-medicine and strength-and-conditioning evidence; direct evidence for exercise-to-lacrosse performance transfer remains limited and is explicitly treated as mechanical rationale rather than causal proof."
  },
  {
    "id": "lacrosse-11",
    "sportId": "lacrosse",
    "label": "ground-ball scoop",
    "movementFamily": "ground-to-standing hinge/squat",
    "bodyActions": [
      "Deep flexion to rapid leg and trunk extension while lifting and controlling the stick."
    ],
    "jointActions": [
      "Hip/knee/ankle flexion-extension",
      "spinal extension",
      "shoulder/elbow/wrist lifting."
    ],
    "primeMovers": [
      "Quadriceps femoris, gluteus maximus, hamstrings, erector spinae, biceps brachii, forearm flexors."
    ],
    "assistingMuscles": [
      "Adductor magnus, gluteus medius, latissimus dorsi, anterior deltoid, triceps brachii."
    ],
    "stabilizers": [
      "Trunk, ankle-foot muscles, scapular stabilizers, wrist extensors."
    ],
    "contractionRoles": [
      "Eccentric lowering",
      "concentric standing/lifting",
      "isometric stick control."
    ],
    "commonForceOrSkillDemand": "Fast rise from a low base while preserving balance and ball security.",
    "recommendedExercisePatterns": [
      "Goblet squat",
      "Trap-bar deadlift",
      "Loaded carry",
      "Row"
    ],
    "recommendedExercises": [
      "Goblet squat",
      "Trap-bar deadlift",
      "Loaded carry",
      "Row"
    ],
    "transferRationale": "Squat/hinge and carry patterns overlap with rising force and braced locomotion; scoop technique and visual tracking must be practiced separately.",
    "exerciseSelectionCautions": "Use a neutral spine and elevate the implement if mobility limits depth.",
    "evidenceConfidence": "high",
    "sources": [
      "https://www.tandfonline.com/doi/full/10.1080/23335432.2015.1017608",
      "https://journals.lww.com/acsm-csmr/fulltext/2018/06000/Core_and_Back_Rehabilitation_for_High_speed.9.aspx"
    ],
    "sourceSummary": "The records synthesize peer-reviewed lacrosse-shot biomechanics and sport-movement research with sports-medicine and strength-and-conditioning evidence; direct evidence for exercise-to-lacrosse performance transfer remains limited and is explicitly treated as mechanical rationale rather than causal proof."
  },
  {
    "id": "lacrosse-12",
    "sportId": "lacrosse",
    "label": "sprinting",
    "movementFamily": "linear acceleration",
    "bodyActions": [
      "Repeated single-leg hip extension, knee drive, knee extension, plantarflexion, and coordinated arm swing."
    ],
    "jointActions": [
      "Hip extension/flexion",
      "knee extension/flexion",
      "ankle plantarflexion/dorsiflexion",
      "shoulder counter-swing."
    ],
    "primeMovers": [
      "Gluteus maximus, hamstrings, quadriceps femoris, gastrocnemius, soleus."
    ],
    "assistingMuscles": [
      "Iliopsoas, rectus femoris, adductor magnus, tibialis anterior, biceps femoris."
    ],
    "stabilizers": [
      "Gluteus medius, adductors, intrinsic foot muscles, trunk, scapular stabilizers."
    ],
    "contractionRoles": [
      "Concentric propulsion with elastic eccentric-isometric stretch-shortening and isometric trunk control."
    ],
    "commonForceOrSkillDemand": "Repeated short acceleration bursts and high horizontal force.",
    "recommendedExercisePatterns": [
      "Resisted sprint",
      "Split-stance deadlift",
      "Hip thrust",
      "Calf raise"
    ],
    "recommendedExercises": [
      "Resisted sprint",
      "Split-stance deadlift",
      "Hip thrust",
      "Calf raise"
    ],
    "transferRationale": "Resisted acceleration and hip/calf strength share broad propulsive demands; sprinting skill and exposure must remain primary.",
    "exerciseSelectionCautions": "Progress sprint volume and intensity; allow recovery and monitor hamstring/calf symptoms.",
    "evidenceConfidence": "high",
    "sources": [
      "https://www.tandfonline.com/doi/full/10.1080/23335432.2015.1017608",
      "https://journals.lww.com/acsm-csmr/fulltext/2018/06000/Core_and_Back_Rehabilitation_for_High_speed.9.aspx"
    ],
    "sourceSummary": "The records synthesize peer-reviewed lacrosse-shot biomechanics and sport-movement research with sports-medicine and strength-and-conditioning evidence; direct evidence for exercise-to-lacrosse performance transfer remains limited and is explicitly treated as mechanical rationale rather than causal proof."
  },
  {
    "id": "lacrosse-13",
    "sportId": "lacrosse",
    "label": "lateral defensive shuffle",
    "movementFamily": "lateral locomotion",
    "bodyActions": [
      "Partial-squat stance, repeated lateral push-offs, foot repositioning, and upright trunk alignment."
    ],
    "jointActions": [
      "Hip abduction/adduction",
      "knee flexion-extension",
      "ankle eversion/inversion",
      "trunk anti-rotation."
    ],
    "primeMovers": [
      "Gluteus medius, adductor magnus, quadriceps femoris, gluteus maximus, gastrocnemius, soleus."
    ],
    "assistingMuscles": [
      "Tensor fasciae latae, sartorius, external/internal oblique, hamstrings."
    ],
    "stabilizers": [
      "Deep hip rotators, ankle-foot muscles, trunk, scapular muscles."
    ],
    "contractionRoles": [
      "Concentric lateral propulsion, eccentric braking, isometric defensive posture."
    ],
    "commonForceOrSkillDemand": "Sustained low stance with repeated lateral force application.",
    "recommendedExercisePatterns": [
      "Lateral squat",
      "Copenhagen plank",
      "Band walk",
      "Lateral sled drag"
    ],
    "recommendedExercises": [
      "Lateral squat",
      "Copenhagen plank",
      "Band walk",
      "Lateral sled drag"
    ],
    "transferRationale": "These patterns train frontal-plane hip/adductor capacity and lateral propulsion; defensive perception and stick positioning are not reproduced.",
    "exerciseSelectionCautions": "Adductor loading should be progressed gradually; avoid collapsing knees or excessive stance width.",
    "evidenceConfidence": "high",
    "sources": [
      "https://www.tandfonline.com/doi/full/10.1080/23335432.2015.1017608",
      "https://journals.lww.com/acsm-csmr/fulltext/2018/06000/Core_and_Back_Rehabilitation_for_High_speed.9.aspx"
    ],
    "sourceSummary": "The records synthesize peer-reviewed lacrosse-shot biomechanics and sport-movement research with sports-medicine and strength-and-conditioning evidence; direct evidence for exercise-to-lacrosse performance transfer remains limited and is explicitly treated as mechanical rationale rather than causal proof."
  },
  {
    "id": "lacrosse-14",
    "sportId": "lacrosse",
    "label": "backpedal",
    "movementFamily": "backward locomotion",
    "bodyActions": [
      "Repeated backward steps with posterior weight control, hip/knee flexion, dorsiflexion, and ready arms."
    ],
    "jointActions": [
      "Hip/knee flexion-extension",
      "ankle dorsiflexion/plantarflexion",
      "trunk anti-extension",
      "shoulder counter-swing."
    ],
    "primeMovers": [
      "Quadriceps femoris, gluteus maximus, hamstrings, tibialis anterior, soleus."
    ],
    "assistingMuscles": [
      "Gastrocnemius, iliopsoas, adductor magnus, erector spinae."
    ],
    "stabilizers": [
      "Gluteus medius, adductors, ankle-foot muscles, trunk, shoulder stabilizers."
    ],
    "contractionRoles": [
      "Eccentric landing/braking, concentric repositioning, isometric posture."
    ],
    "commonForceOrSkillDemand": "Backward locomotion with limited visual access and rapid transition to forward movement.",
    "recommendedExercisePatterns": [
      "Reverse sled drag",
      "Reverse lunge",
      "Eccentric squat",
      "Resisted sprint"
    ],
    "recommendedExercises": [
      "Reverse sled drag",
      "Reverse lunge",
      "Eccentric squat",
      "Resisted sprint"
    ],
    "transferRationale": "Reverse sleds/lunges and eccentric squats build posterior control; actual backpedal technique and field awareness require field practice.",
    "exerciseSelectionCautions": "Use clear space and controlled speed; avoid backward running on unstable surfaces.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://www.tandfonline.com/doi/full/10.1080/23335432.2015.1017608",
      "https://journals.lww.com/acsm-csmr/fulltext/2018/06000/Core_and_Back_Rehabilitation_for_High_speed.9.aspx"
    ],
    "sourceSummary": "The records synthesize peer-reviewed lacrosse-shot biomechanics and sport-movement research with sports-medicine and strength-and-conditioning evidence; direct evidence for exercise-to-lacrosse performance transfer remains limited and is explicitly treated as mechanical rationale rather than causal proof."
  },
  {
    "id": "lacrosse-15",
    "sportId": "lacrosse",
    "label": "checking",
    "movementFamily": "contact force and collision control",
    "bodyActions": [
      "Stick/body contact with trunk rotation, hip drive, elbow control, rapid deceleration, and force absorption."
    ],
    "jointActions": [
      "Hip/knee extension",
      "trunk rotation/anti-rotation",
      "shoulder horizontal adduction/flexion",
      "elbow extension",
      "cervical isometric control."
    ],
    "primeMovers": [
      "Gluteus maximus, quadriceps femoris, pectoralis major, latissimus dorsi, external/internal oblique, triceps brachii."
    ],
    "assistingMuscles": [
      "Adductor magnus, anterior deltoid, serratus anterior, hamstrings, erector spinae."
    ],
    "stabilizers": [
      "Rotator cuff, scapular stabilizers, trunk, neck musculature, hip and ankle stabilizers."
    ],
    "contractionRoles": [
      "Concentric contact force, eccentric impact absorption, isometric bracing."
    ],
    "commonForceOrSkillDemand": "Brief high-force contact while maintaining base and posture.",
    "recommendedExercisePatterns": [
      "Farmer carry",
      "Row",
      "Landmine press",
      "Pallof press"
    ],
    "recommendedExercises": [
      "Farmer carry",
      "Row",
      "Landmine press",
      "Pallof press"
    ],
    "transferRationale": "Carries, pulls, presses, and anti-rotation develop general bracing and force-transfer qualities; they do not certify safe checking technique.",
    "exerciseSelectionCautions": "Do not train collision intent with heavy uncontrolled loads; neck work should be coached and symptom-free.",
    "evidenceConfidence": "limited",
    "sources": [
      "https://www.tandfonline.com/doi/full/10.1080/23335432.2015.1017608",
      "https://journals.lww.com/acsm-csmr/fulltext/2018/06000/Core_and_Back_Rehabilitation_for_High_speed.9.aspx"
    ],
    "sourceSummary": "The records synthesize peer-reviewed lacrosse-shot biomechanics and sport-movement research with sports-medicine and strength-and-conditioning evidence; direct evidence for exercise-to-lacrosse performance transfer remains limited and is explicitly treated as mechanical rationale rather than causal proof."
  },
  {
    "id": "lacrosse-16",
    "sportId": "lacrosse",
    "label": "body positioning",
    "movementFamily": "athletic stance and positional control",
    "bodyActions": [
      "Continuous stance adjustment, lateral weight shifts, trunk orientation, and stick-side shielding."
    ],
    "jointActions": [
      "Hip/knee flexion",
      "hip abduction/adduction",
      "ankle dorsiflexion",
      "trunk anti-rotation",
      "shoulder positioning."
    ],
    "primeMovers": [
      "Quadriceps femoris, gluteus maximus, gluteus medius, adductor magnus, soleus, external/internal oblique."
    ],
    "assistingMuscles": [
      "Hamstrings, tensor fasciae latae, deep hip rotators, serratus anterior, forearm flexors."
    ],
    "stabilizers": [
      "Ankle-foot muscles, trunk, scapular stabilizers, grip muscles."
    ],
    "contractionRoles": [
      "Predominantly isometric bracing with concentric/eccentric micro-adjustments."
    ],
    "commonForceOrSkillDemand": "Sustained low stance and balance under perturbation and contact.",
    "recommendedExercisePatterns": [
      "Suitcase carry",
      "Split squat",
      "Lateral lunge",
      "Pallof press"
    ],
    "recommendedExercises": [
      "Suitcase carry",
      "Split squat",
      "Lateral lunge",
      "Pallof press"
    ],
    "transferRationale": "Unilateral loading and anti-rotation share base-control demands, while live positioning depends on opponent, ball, and tactical context.",
    "exerciseSelectionCautions": "Use manageable isometric durations and preserve breathing; do not chase fatigue at the expense of posture.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://www.tandfonline.com/doi/full/10.1080/23335432.2015.1017608",
      "https://journals.lww.com/acsm-csmr/fulltext/2018/06000/Core_and_Back_Rehabilitation_for_High_speed.9.aspx"
    ],
    "sourceSummary": "The records synthesize peer-reviewed lacrosse-shot biomechanics and sport-movement research with sports-medicine and strength-and-conditioning evidence; direct evidence for exercise-to-lacrosse performance transfer remains limited and is explicitly treated as mechanical rationale rather than causal proof."
  },
  {
    "id": "lacrosse-17",
    "sportId": "lacrosse",
    "label": "rotational shooting",
    "movementFamily": "rotational power",
    "bodyActions": [
      "Foot pressure transfers through hip and trunk rotation into shoulder, elbow, and wrist release."
    ],
    "jointActions": [
      "Ankle/hip rotation",
      "thoracic rotation",
      "shoulder internal rotation",
      "elbow extension",
      "wrist flexion."
    ],
    "primeMovers": [
      "Gluteus maximus, adductor magnus, external/internal oblique, pectoralis major, latissimus dorsi, anterior deltoid, triceps brachii."
    ],
    "assistingMuscles": [
      "Serratus anterior, posterior deltoid, forearm flexors, hamstrings."
    ],
    "stabilizers": [
      "Rotator cuff, middle/lower trapezius, gluteus medius, trunk, ankle-foot muscles."
    ],
    "contractionRoles": [
      "Concentric proximal-to-distal acceleration",
      "eccentric follow-through",
      "isometric base control."
    ],
    "commonForceOrSkillDemand": "High-rate whole-body rotational sequencing.",
    "recommendedExercisePatterns": [
      "Medicine-ball scoop toss",
      "Medicine-ball rotational throw",
      "Cable rotation",
      "Split squat"
    ],
    "recommendedExercises": [
      "Medicine-ball scoop toss",
      "Medicine-ball rotational throw",
      "Cable rotation",
      "Split squat"
    ],
    "transferRationale": "These drills share rotational sequencing and force transfer but cannot establish shot accuracy, release timing, or causal sport-performance benefit.",
    "exerciseSelectionCautions": "Keep medicine-ball loads light and throws crisp; avoid repeated maximal lumbar rotation.",
    "evidenceConfidence": "high",
    "sources": [
      "https://www.tandfonline.com/doi/full/10.1080/23335432.2015.1017608",
      "https://thesportjournal.org/article/description-of-phases-and-discrete-events-of-the-lacrosse-shot/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed lacrosse-shot biomechanics and sport-movement research with sports-medicine and strength-and-conditioning evidence; direct evidence for exercise-to-lacrosse performance transfer remains limited and is explicitly treated as mechanical rationale rather than causal proof."
  },
  {
    "id": "lacrosse-18",
    "sportId": "lacrosse",
    "label": "overhead checking",
    "movementFamily": "overhead contact/pushing",
    "bodyActions": [
      "Shoulder elevation/horizontal movement with trunk rotation, elbow extension, wrist control, and lower-body bracing."
    ],
    "jointActions": [
      "Shoulder elevation/flexion",
      "scapular upward rotation",
      "elbow extension",
      "wrist stabilization",
      "hip/knee bracing."
    ],
    "primeMovers": [
      "Anterior/middle deltoid, triceps brachii, pectoralis major, latissimus dorsi, serratus anterior, quadriceps femoris."
    ],
    "assistingMuscles": [
      "External/internal oblique, gluteus maximus, posterior deltoid, forearm flexors."
    ],
    "stabilizers": [
      "Rotator cuff, upper/lower trapezius, rhomboids, trunk, hips, wrists, neck musculature."
    ],
    "contractionRoles": [
      "Concentric overhead action",
      "eccentric lowering",
      "isometric scapular/trunk bracing."
    ],
    "commonForceOrSkillDemand": "Overhead force application under balance and contact constraints.",
    "recommendedExercisePatterns": [
      "Landmine press",
      "Overhead carry",
      "Row",
      "Dead bug"
    ],
    "recommendedExercises": [
      "Landmine press",
      "Overhead carry",
      "Row",
      "Dead bug"
    ],
    "transferRationale": "Landmine pressing and carries train overhead bracing with less fixed-path stress; rows and dead bugs support scapular and trunk control.",
    "exerciseSelectionCautions": "Use pain-free range and moderate loads; overhead work is not a substitute for coached checking rules.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://www.tandfonline.com/doi/full/10.1080/23335432.2015.1017608",
      "https://journals.lww.com/acsm-csmr/fulltext/2018/06000/Core_and_Back_Rehabilitation_for_High_speed.9.aspx"
    ],
    "sourceSummary": "The records synthesize peer-reviewed lacrosse-shot biomechanics and sport-movement research with sports-medicine and strength-and-conditioning evidence; direct evidence for exercise-to-lacrosse performance transfer remains limited and is explicitly treated as mechanical rationale rather than causal proof."
  },
  {
    "id": "lacrosse-19",
    "sportId": "lacrosse",
    "label": "jumping shot",
    "movementFamily": "jump-to-throw power",
    "bodyActions": [
      "Countermovement, triple extension, airborne trunk rotation and release, followed by controlled landing."
    ],
    "jointActions": [
      "Hip/knee/ankle extension",
      "trunk rotation",
      "shoulder elevation/internal rotation",
      "elbow extension",
      "landing flexion."
    ],
    "primeMovers": [
      "Gluteus maximus, quadriceps femoris, hamstrings, gastrocnemius, soleus, external/internal oblique, pectoralis major, triceps brachii."
    ],
    "assistingMuscles": [
      "Iliopsoas, rectus femoris, anterior deltoid, serratus anterior, latissimus dorsi."
    ],
    "stabilizers": [
      "Gluteus medius, deep hip rotators, trunk, rotator cuff, scapular stabilizers, ankle-foot muscles."
    ],
    "contractionRoles": [
      "Eccentric countermovement",
      "concentric takeoff/release",
      "isometric flight control",
      "eccentric landing absorption."
    ],
    "commonForceOrSkillDemand": "Coupled vertical propulsion, airborne release, and two-phase landing control.",
    "recommendedExercisePatterns": [
      "Countermovement jump",
      "Medicine-ball throw",
      "Split squat",
      "Snap-down"
    ],
    "recommendedExercises": [
      "Countermovement jump",
      "Medicine-ball throw",
      "Split squat",
      "Snap-down"
    ],
    "transferRationale": "Jumps and throws address broad propulsion and landing qualities; they do not reproduce stick timing or demonstrate shooting improvement.",
    "exerciseSelectionCautions": "Land quietly with aligned knees/feet; progress jump height and throw intensity separately before combining.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://www.tandfonline.com/doi/full/10.1080/23335432.2015.1017608",
      "https://thesportjournal.org/article/description-of-phases-and-discrete-events-of-the-lacrosse-shot/"
    ],
    "sourceSummary": "The records synthesize peer-reviewed lacrosse-shot biomechanics and sport-movement research with sports-medicine and strength-and-conditioning evidence; direct evidence for exercise-to-lacrosse performance transfer remains limited and is explicitly treated as mechanical rationale rather than causal proof."
  },
  {
    "id": "lacrosse-20",
    "sportId": "lacrosse",
    "label": "rapid deceleration",
    "movementFamily": "deceleration and braking",
    "bodyActions": [
      "Shortened steps, hip/knee flexion, ankle dorsiflexion, trunk control, and force redirection from forward or lateral motion."
    ],
    "jointActions": [
      "Hip/knee flexion",
      "ankle dorsiflexion",
      "trunk anti-flexion/anti-rotation",
      "foot pronation control."
    ],
    "primeMovers": [
      "Quadriceps femoris, gluteus maximus, hamstrings, soleus, gastrocnemius, adductor magnus."
    ],
    "assistingMuscles": [
      "Gluteus medius, tibialis anterior, sartorius, external/internal oblique, deep hip rotators."
    ],
    "stabilizers": [
      "Trunk, ankle-foot muscles, gluteus medius, deep hip rotators."
    ],
    "contractionRoles": [
      "Primarily eccentric braking, then isometric stabilization and concentric reacceleration."
    ],
    "commonForceOrSkillDemand": "High eccentric force absorption and rapid transition to another action.",
    "recommendedExercisePatterns": [
      "Snap-down",
      "Deceleration lunge",
      "Split squat",
      "Eccentric hamstring curl"
    ],
    "recommendedExercises": [
      "Snap-down",
      "Deceleration lunge",
      "Split squat",
      "Eccentric hamstring curl"
    ],
    "transferRationale": "These exercises develop braking positions, unilateral control, and posterior-chain capacity; transfer is mechanical rather than a guarantee of fewer injuries or faster play.",
    "exerciseSelectionCautions": "Increase speed and angle gradually; stop if pain, giving-way, or loss of alignment occurs.",
    "evidenceConfidence": "high",
    "sources": [
      "https://www.tandfonline.com/doi/full/10.1080/23335432.2015.1017608",
      "https://journals.lww.com/acsm-csmr/fulltext/2018/06000/Core_and_Back_Rehabilitation_for_High_speed.9.aspx"
    ],
    "sourceSummary": "The records synthesize peer-reviewed lacrosse-shot biomechanics and sport-movement research with sports-medicine and strength-and-conditioning evidence; direct evidence for exercise-to-lacrosse performance transfer remains limited and is explicitly treated as mechanical rationale rather than causal proof."
  },
  {
    "id": "rugby-1",
    "sportId": "rugby",
    "label": "acceleration",
    "movementFamily": "acceleration and horizontal force",
    "bodyActions": [
      "forward trunk lean",
      "rapid hip, knee and ankle extension",
      "arm drive"
    ],
    "jointActions": [
      "hip extension",
      "knee extension",
      "ankle plantarflexion",
      "trunk stabilization"
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps femoris",
      "hamstring muscle group",
      "triceps surae"
    ],
    "assistingMuscles": [
      "iliopsoas",
      "adductor muscle group",
      "rectus femoris",
      "anterior tibialis"
    ],
    "stabilizers": [
      "gluteus medius",
      "obliquus externus abdominis",
      "obliquus internus abdominis",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "concentric propulsion",
      "isometric trunk control",
      "eccentric braking between contacts"
    ],
    "commonForceOrSkillDemand": "high horizontal force and rapid force application during short accelerations",
    "recommendedExercisePatterns": [
      "resisted sprint",
      "sled push",
      "split squat",
      "Romanian deadlift"
    ],
    "recommendedExercises": [
      "resisted sprint",
      "sled push",
      "split squat",
      "Romanian deadlift"
    ],
    "transferRationale": "Shared projection and horizontal-force demands make these patterns useful general physical preparation, but they do not reproduce rugby perception, ball skills, or contact.",
    "exerciseSelectionCautions": "Progress sprint and sled loading gradually; preserve shin and trunk angles; stop if hamstring or calf symptoms emerge.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9924573/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8184906/",
      "https://bjsm.bmj.com/content/49/8/520"
    ],
    "sourceSummary": "The records synthesize peer-reviewed rugby biomechanics research on sprinting, tackling, scrummaging, and force demands with evidence-aware anatomical reasoning; direct exercise-to-performance causation and EMG claims were avoided, and confidence is lower for complex cooperative or reactive skills."
  },
  {
    "id": "rugby-2",
    "sportId": "rugby",
    "label": "maximal sprinting",
    "movementFamily": "linear speed and elastic running",
    "bodyActions": [
      "upright high-speed running",
      "cyclical hip flexion-extension",
      "knee lift",
      "stiff ankle contacts"
    ],
    "jointActions": [
      "hip extension/flexion",
      "knee extension/flexion",
      "ankle plantarflexion",
      "reciprocal shoulder motion"
    ],
    "primeMovers": [
      "gluteus maximus",
      "hamstring muscle group",
      "quadriceps femoris",
      "triceps surae"
    ],
    "assistingMuscles": [
      "iliopsoas",
      "rectus femoris",
      "gluteus medius",
      "adductor magnus"
    ],
    "stabilizers": [
      "soleus",
      "intrinsic foot muscles",
      "obliquus externus abdominis",
      "multifidus"
    ],
    "contractionRoles": [
      "concentric propulsion and swing",
      "eccentric hamstring braking",
      "isometric ankle and trunk stiffness"
    ],
    "commonForceOrSkillDemand": "maximal velocity and elastic repeated contacts",
    "recommendedExercisePatterns": [
      "resisted sprint",
      "Romanian deadlift",
      "lateral bounds",
      "loaded jumps"
    ],
    "recommendedExercises": [
      "resisted sprint",
      "Romanian deadlift",
      "lateral bounds",
      "loaded jumps"
    ],
    "transferRationale": "Hip-extension and elastic-contact exercises overlap with sprint force production, while transfer remains indirect without sprint technique and exposure management.",
    "exerciseSelectionCautions": "Use low volumes and full recovery; avoid fatigued maximal sprinting after heavy posterior-chain work.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9924573/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8184906/",
      "https://bjsm.bmj.com/content/49/8/520"
    ],
    "sourceSummary": "The records synthesize peer-reviewed rugby biomechanics research on sprinting, tackling, scrummaging, and force demands with evidence-aware anatomical reasoning; direct exercise-to-performance causation and EMG claims were avoided, and confidence is lower for complex cooperative or reactive skills."
  },
  {
    "id": "rugby-3",
    "sportId": "rugby",
    "label": "lateral cutting",
    "movementFamily": "braking and frontal-plane change of direction",
    "bodyActions": [
      "deceleration",
      "lateral trunk control",
      "single-leg plant",
      "hip abduction/adduction",
      "re-acceleration"
    ],
    "jointActions": [
      "hip and knee flexion-extension",
      "hip abduction/adduction",
      "ankle dorsiflexion/plantarflexion"
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus maximus",
      "gluteus medius",
      "adductor muscle group",
      "hamstring muscle group"
    ],
    "assistingMuscles": [
      "soleus",
      "gastrocnemius",
      "tensor fasciae latae",
      "sartorius"
    ],
    "stabilizers": [
      "obliquus externus abdominis",
      "obliquus internus abdominis",
      "intrinsic foot muscles",
      "deep hip rotators"
    ],
    "contractionRoles": [
      "eccentric braking",
      "isometric alignment",
      "concentric redirection"
    ],
    "commonForceOrSkillDemand": "high eccentric braking and lateral force acceptance",
    "recommendedExercisePatterns": [
      "lateral bounds",
      "lateral lunges",
      "split squat",
      "reverse sled drag"
    ],
    "recommendedExercises": [
      "lateral bounds",
      "lateral lunges",
      "split squat",
      "reverse sled drag"
    ],
    "transferRationale": "Unilateral frontal-plane strength and braking patterns share force-absorption features with cutting, but reactive decision-making and exact plant mechanics are sport-specific.",
    "exerciseSelectionCautions": "Control knee-over-foot alignment and progress amplitude before speed; respect groin and lateral-ankle history.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9924573/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8184906/",
      "https://bjsm.bmj.com/content/49/8/520"
    ],
    "sourceSummary": "The records synthesize peer-reviewed rugby biomechanics research on sprinting, tackling, scrummaging, and force demands with evidence-aware anatomical reasoning; direct exercise-to-performance causation and EMG claims were avoided, and confidence is lower for complex cooperative or reactive skills."
  },
  {
    "id": "rugby-4",
    "sportId": "rugby",
    "label": "sidestep",
    "movementFamily": "evasive lateral agility",
    "bodyActions": [
      "rapid lateral displacement",
      "single-leg loading",
      "counter-rotation",
      "outside-foot push-off"
    ],
    "jointActions": [
      "hip abduction/adduction",
      "knee flexion-extension",
      "ankle plantarflexion",
      "trunk rotation/anti-rotation"
    ],
    "primeMovers": [
      "gluteus medius",
      "gluteus maximus",
      "quadriceps femoris",
      "adductor muscle group",
      "triceps surae"
    ],
    "assistingMuscles": [
      "hamstring muscle group",
      "deep hip rotators",
      "tensor fasciae latae",
      "sartorius"
    ],
    "stabilizers": [
      "obliquus externus abdominis",
      "obliquus internus abdominis",
      "intrinsic foot muscles",
      "soleus"
    ],
    "contractionRoles": [
      "eccentric load acceptance",
      "concentric push-off",
      "isometric balance"
    ],
    "commonForceOrSkillDemand": "unpredictable lateral displacement and rapid re-acceleration",
    "recommendedExercisePatterns": [
      "lateral lunges",
      "lateral bounds",
      "skater squat",
      "Pallof press"
    ],
    "recommendedExercises": [
      "lateral lunges",
      "lateral bounds",
      "skater squat",
      "Pallof press"
    ],
    "transferRationale": "Lateral single-leg force and trunk control provide a physical base for sidestepping, but no gym exercise substitutes for perception-action coupling.",
    "exerciseSelectionCautions": "Begin with planned low-speed drills; avoid excessive valgus or uncontrolled foot collapse.",
    "evidenceConfidence": "limited",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9924573/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8184906/",
      "https://bjsm.bmj.com/content/49/8/520"
    ],
    "sourceSummary": "The records synthesize peer-reviewed rugby biomechanics research on sprinting, tackling, scrummaging, and force demands with evidence-aware anatomical reasoning; direct exercise-to-performance causation and EMG claims were avoided, and confidence is lower for complex cooperative or reactive skills."
  },
  {
    "id": "rugby-5",
    "sportId": "rugby",
    "label": "tackling",
    "movementFamily": "contact acceleration and whole-body force transfer",
    "bodyActions": [
      "lowered center of mass",
      "forward projection",
      "shoulder-to-torso contact",
      "leg drive",
      "wrap"
    ],
    "jointActions": [
      "hip/knee extension",
      "ankle plantarflexion",
      "shoulder flexion/adduction",
      "elbow flexion",
      "trunk anti-extension"
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus maximus",
      "hamstring muscle group",
      "pectoralis major",
      "latissimus dorsi"
    ],
    "assistingMuscles": [
      "triceps brachii",
      "adductor magnus",
      "gastrocnemius",
      "serratus anterior",
      "forearm flexor group"
    ],
    "stabilizers": [
      "obliquus externus abdominis",
      "obliquus internus abdominis",
      "erector spinae",
      "gluteus medius",
      "rotator cuff",
      "cervical extensor muscles"
    ],
    "contractionRoles": [
      "concentric leg drive",
      "isometric wrap and trunk bracing",
      "eccentric preparation"
    ],
    "commonForceOrSkillDemand": "high whole-body impulse and collision-force transmission",
    "recommendedExercisePatterns": [
      "sled push",
      "front squat",
      "bear-hug carry",
      "landmine press"
    ],
    "recommendedExercises": [
      "sled push",
      "front squat",
      "bear-hug carry",
      "landmine press"
    ],
    "transferRationale": "Lower-body projection, braced carries, and horizontal pressing overlap with general tackle force preparation; technical tackling and safety must be coached separately.",
    "exerciseSelectionCautions": "Never use live partner contact as a casual loading method; maintain safe cervical position and use qualified tackle coaching.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9924573/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8184906/",
      "https://bjsm.bmj.com/content/49/8/520"
    ],
    "sourceSummary": "The records synthesize peer-reviewed rugby biomechanics research on sprinting, tackling, scrummaging, and force demands with evidence-aware anatomical reasoning; direct exercise-to-performance causation and EMG claims were avoided, and confidence is lower for complex cooperative or reactive skills."
  },
  {
    "id": "rugby-6",
    "sportId": "rugby",
    "label": "tackle absorption",
    "movementFamily": "contact deceleration and robustness",
    "bodyActions": [
      "braced stance",
      "hip/knee yielding",
      "trunk alignment",
      "force attenuation",
      "re-stabilization"
    ],
    "jointActions": [
      "hip/knee flexion-extension",
      "ankle dorsiflexion",
      "trunk anti-flexion/anti-rotation"
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus maximus",
      "hamstring muscle group",
      "soleus",
      "abdominal wall"
    ],
    "assistingMuscles": [
      "adductor muscle group",
      "gluteus medius",
      "erector spinae",
      "obliquus externus abdominis",
      "rotator cuff"
    ],
    "stabilizers": [
      "cervical extensor muscles",
      "intrinsic foot muscles",
      "serratus anterior",
      "multifidus"
    ],
    "contractionRoles": [
      "eccentric absorption",
      "isometric bracing",
      "concentric recovery"
    ],
    "commonForceOrSkillDemand": "rapid external-force acceptance and post-contact recovery",
    "recommendedExercisePatterns": [
      "split squat isometric",
      "loaded carry",
      "reverse sled drag",
      "landing-stick drill"
    ],
    "recommendedExercises": [
      "split squat isometric",
      "loaded carry",
      "reverse sled drag",
      "landing-stick drill"
    ],
    "transferRationale": "Eccentric lower-limb and isometric trunk work shares broad force-absorption demands, but collision magnitude and technique are not recreated in the gym.",
    "exerciseSelectionCautions": "Use predictable external loads and progressive landings; do not equate soreness or load tolerance with collision readiness.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9924573/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8184906/",
      "https://bjsm.bmj.com/content/49/8/520"
    ],
    "sourceSummary": "The records synthesize peer-reviewed rugby biomechanics research on sprinting, tackling, scrummaging, and force demands with evidence-aware anatomical reasoning; direct exercise-to-performance causation and EMG claims were avoided, and confidence is lower for complex cooperative or reactive skills."
  },
  {
    "id": "rugby-7",
    "sportId": "rugby",
    "label": "rucking drive",
    "movementFamily": "low-position horizontal pushing",
    "bodyActions": [
      "low body position",
      "forward lean",
      "short-step leg drive",
      "shoulder and trunk pressure"
    ],
    "jointActions": [
      "hip/knee extension",
      "ankle plantarflexion",
      "shoulder flexion/adduction",
      "elbow extension"
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps femoris",
      "hamstring muscle group",
      "triceps surae",
      "pectoralis major"
    ],
    "assistingMuscles": [
      "triceps brachii",
      "latissimus dorsi",
      "adductor magnus",
      "serratus anterior",
      "forearm flexor group"
    ],
    "stabilizers": [
      "obliquus externus abdominis",
      "erector spinae",
      "gluteus medius",
      "rotator cuff",
      "cervical extensor muscles"
    ],
    "contractionRoles": [
      "concentric leg drive",
      "isometric shoulder/trunk bracing",
      "eccentric repositioning"
    ],
    "commonForceOrSkillDemand": "sustained low-angle horizontal force with short steps",
    "recommendedExercisePatterns": [
      "sled push",
      "bear-hug carry",
      "front squat",
      "anti-rotation press"
    ],
    "recommendedExercises": [
      "sled push",
      "bear-hug carry",
      "front squat",
      "anti-rotation press"
    ],
    "transferRationale": "Sleds and front-loaded carries reproduce some low-position force-vector and bracing demands without opponent unpredictability.",
    "exerciseSelectionCautions": "Keep neutral spine and avoid excessive cervical loading; use coached contact technique for any rugby-specific progression.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9924573/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8184906/",
      "https://bjsm.bmj.com/content/49/8/520"
    ],
    "sourceSummary": "The records synthesize peer-reviewed rugby biomechanics research on sprinting, tackling, scrummaging, and force demands with evidence-aware anatomical reasoning; direct exercise-to-performance causation and EMG claims were avoided, and confidence is lower for complex cooperative or reactive skills."
  },
  {
    "id": "rugby-8",
    "sportId": "rugby",
    "label": "mauling drive",
    "movementFamily": "resisted team-force transfer",
    "bodyActions": [
      "linked forward propulsion",
      "torso-to-torso bracing",
      "synchronized stepping",
      "anti-rotation"
    ],
    "jointActions": [
      "hip/knee extension",
      "ankle plantarflexion",
      "shoulder adduction",
      "trunk anti-rotation"
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps femoris",
      "hamstring muscle group",
      "triceps surae",
      "pectoralis major"
    ],
    "assistingMuscles": [
      "latissimus dorsi",
      "adductor magnus",
      "gluteus medius",
      "serratus anterior",
      "forearm flexor group"
    ],
    "stabilizers": [
      "obliquus externus abdominis",
      "obliquus internus abdominis",
      "erector spinae",
      "rotator cuff",
      "cervical extensor muscles"
    ],
    "contractionRoles": [
      "concentric group propulsion",
      "prolonged isometric bracing",
      "eccentric balance correction"
    ],
    "commonForceOrSkillDemand": "coordinated force transfer under external resistance and perturbation",
    "recommendedExercisePatterns": [
      "sled push",
      "sandbag bear-hug carry",
      "Pallof press",
      "split squat"
    ],
    "recommendedExercises": [
      "sled push",
      "sandbag bear-hug carry",
      "Pallof press",
      "split squat"
    ],
    "transferRationale": "Connected carries and anti-rotation drills offer mechanical overlap with braced team propulsion, but cannot establish group timing or maul legality.",
    "exerciseSelectionCautions": "Use stable implements before partner drills; avoid twisting under load and monitor shoulder/cervical position.",
    "evidenceConfidence": "limited",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9924573/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8184906/",
      "https://bjsm.bmj.com/content/49/8/520"
    ],
    "sourceSummary": "The records synthesize peer-reviewed rugby biomechanics research on sprinting, tackling, scrummaging, and force demands with evidence-aware anatomical reasoning; direct exercise-to-performance causation and EMG claims were avoided, and confidence is lower for complex cooperative or reactive skills."
  },
  {
    "id": "rugby-9",
    "sportId": "rugby",
    "label": "scrum push",
    "movementFamily": "sustained horizontal pushing",
    "bodyActions": [
      "deep flexed stance",
      "near-horizontal force application",
      "coordinated leg extension",
      "shoulder-girdle bracing"
    ],
    "jointActions": [
      "hip/knee extension",
      "ankle plantarflexion",
      "shoulder protraction/adduction",
      "trunk anti-flexion"
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus maximus",
      "hamstring muscle group",
      "triceps surae",
      "pectoralis major"
    ],
    "assistingMuscles": [
      "triceps brachii",
      "adductor magnus",
      "latissimus dorsi",
      "serratus anterior",
      "soleus"
    ],
    "stabilizers": [
      "erector spinae",
      "obliquus externus abdominis",
      "gluteus medius",
      "rotator cuff",
      "cervical extensor muscles"
    ],
    "contractionRoles": [
      "concentric leg drive",
      "isometric force transmission",
      "eccentric reset"
    ],
    "commonForceOrSkillDemand": "large sustained coordinated horizontal impulse",
    "recommendedExercisePatterns": [
      "sled push",
      "front squat",
      "belt-squat hold",
      "Pallof press"
    ],
    "recommendedExercises": [
      "sled push",
      "front squat",
      "belt-squat hold",
      "Pallof press"
    ],
    "transferRationale": "Research on scrum mechanics supports horizontal impulse and coordinated forward force as relevant qualities; gym patterns are preparatory, not scrum replicas.",
    "exerciseSelectionCautions": "Prioritize technique and progressive scrum-specific exposure; avoid maximal spinal loading in deep flexion.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9924573/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8184906/",
      "https://bjsm.bmj.com/content/49/8/520"
    ],
    "sourceSummary": "The records synthesize peer-reviewed rugby biomechanics research on sprinting, tackling, scrummaging, and force demands with evidence-aware anatomical reasoning; direct exercise-to-performance causation and EMG claims were avoided, and confidence is lower for complex cooperative or reactive skills."
  },
  {
    "id": "rugby-10",
    "sportId": "rugby",
    "label": "lineout jump",
    "movementFamily": "vertical power and landing control",
    "bodyActions": [
      "countermovement",
      "triple extension",
      "vertical take-off",
      "arm reach",
      "controlled landing"
    ],
    "jointActions": [
      "hip/knee extension",
      "ankle plantarflexion",
      "shoulder flexion",
      "landing hip/knee/ankle flexion"
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus maximus",
      "hamstring muscle group",
      "gastrocnemius",
      "soleus"
    ],
    "assistingMuscles": [
      "rectus femoris",
      "iliopsoas",
      "deltoid muscle group",
      "triceps surae"
    ],
    "stabilizers": [
      "gluteus medius",
      "intrinsic foot muscles",
      "rotator cuff",
      "serratus anterior",
      "abdominal wall"
    ],
    "contractionRoles": [
      "eccentric countermovement",
      "concentric take-off",
      "isometric reach",
      "eccentric landing"
    ],
    "commonForceOrSkillDemand": "vertical impulse, aerial timing, and landing control",
    "recommendedExercisePatterns": [
      "countermovement jump",
      "trap-bar jump",
      "loaded jump",
      "landing-stick drill"
    ],
    "recommendedExercises": [
      "countermovement jump",
      "trap-bar jump",
      "loaded jump",
      "landing-stick drill"
    ],
    "transferRationale": "Jump and landing exercises overlap with vertical impulse and force attenuation, while lineout timing, lifting support, and ball tracking require sport practice.",
    "exerciseSelectionCautions": "Use low-volume quality jumps; land quietly with knees aligned and avoid loaded jumps if fatigued.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9924573/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8184906/",
      "https://bjsm.bmj.com/content/49/8/520"
    ],
    "sourceSummary": "The records synthesize peer-reviewed rugby biomechanics research on sprinting, tackling, scrummaging, and force demands with evidence-aware anatomical reasoning; direct exercise-to-performance causation and EMG claims were avoided, and confidence is lower for complex cooperative or reactive skills."
  },
  {
    "id": "rugby-11",
    "sportId": "rugby",
    "label": "lineout lift",
    "movementFamily": "cooperative vertical lifting",
    "bodyActions": [
      "squat-to-stand lift",
      "coordinated leg extension",
      "partner support",
      "vertical stabilization"
    ],
    "jointActions": [
      "hip/knee extension",
      "ankle plantarflexion",
      "shoulder flexion/elevation",
      "scapular upward rotation"
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus maximus",
      "hamstring muscle group",
      "triceps surae",
      "deltoid muscle group"
    ],
    "assistingMuscles": [
      "trapezius",
      "serratus anterior",
      "rotator cuff",
      "forearm flexor group",
      "adductor magnus"
    ],
    "stabilizers": [
      "erector spinae",
      "abdominal wall",
      "gluteus medius",
      "intrinsic foot muscles",
      "multifidus"
    ],
    "contractionRoles": [
      "concentric lift",
      "isometric overhead/support bracing",
      "eccentric lowering"
    ],
    "commonForceOrSkillDemand": "cooperative load transfer and overhead stabilization",
    "recommendedExercisePatterns": [
      "front squat",
      "sandbag lift",
      "overhead carry",
      "split squat"
    ],
    "recommendedExercises": [
      "front squat",
      "sandbag lift",
      "overhead carry",
      "split squat"
    ],
    "transferRationale": "Squat-to-stand and overhead stabilization share broad force-production requirements, but partner safety, timing, and hand placement are not represented by solo exercises.",
    "exerciseSelectionCautions": "Progress partner lifting only with qualified coaching and clear communication; use stable loads and do not test fatigue-induced overhead instability.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9924573/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8184906/",
      "https://bjsm.bmj.com/content/49/8/520"
    ],
    "sourceSummary": "The records synthesize peer-reviewed rugby biomechanics research on sprinting, tackling, scrummaging, and force demands with evidence-aware anatomical reasoning; direct exercise-to-performance causation and EMG claims were avoided, and confidence is lower for complex cooperative or reactive skills."
  },
  {
    "id": "rugby-12",
    "sportId": "rugby",
    "label": "stiff-arm",
    "movementFamily": "unilateral upper-body contact leverage",
    "bodyActions": [
      "unilateral shoulder/elbow extension",
      "scapular protraction",
      "trunk anti-rotation",
      "lower-body drive"
    ],
    "jointActions": [
      "shoulder flexion/horizontal adduction",
      "elbow extension",
      "scapular protraction",
      "hip/knee extension"
    ],
    "primeMovers": [
      "triceps brachii",
      "pectoralis major",
      "anterior deltoid",
      "serratus anterior",
      "gluteus maximus"
    ],
    "assistingMuscles": [
      "latissimus dorsi",
      "forearm extensor group",
      "forearm flexor group",
      "quadriceps femoris",
      "adductor muscle group"
    ],
    "stabilizers": [
      "rotator cuff",
      "obliquus externus abdominis",
      "gluteus medius",
      "multifidus",
      "intrinsic wrist muscles"
    ],
    "contractionRoles": [
      "concentric arm extension and leg drive",
      "isometric shoulder/trunk control",
      "eccentric recoil"
    ],
    "commonForceOrSkillDemand": "unilateral force application while resisting trunk displacement",
    "recommendedExercisePatterns": [
      "landmine press",
      "one-arm cable press",
      "suitcase carry",
      "Pallof press"
    ],
    "recommendedExercises": [
      "landmine press",
      "one-arm cable press",
      "suitcase carry",
      "Pallof press"
    ],
    "transferRationale": "Unilateral pressing and anti-rotation exercises address general force transfer and bracing; they do not validate contact effectiveness or hand placement.",
    "exerciseSelectionCautions": "Use controlled ranges and neutral shoulder position; avoid aggressive neck or shoulder loading and separate technique coaching from strength work.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9924573/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8184906/",
      "https://bjsm.bmj.com/content/49/8/520"
    ],
    "sourceSummary": "The records synthesize peer-reviewed rugby biomechanics research on sprinting, tackling, scrummaging, and force demands with evidence-aware anatomical reasoning; direct exercise-to-performance causation and EMG claims were avoided, and confidence is lower for complex cooperative or reactive skills."
  },
  {
    "id": "rugby-13",
    "sportId": "rugby",
    "label": "passing",
    "movementFamily": "upper-body projection and coordination",
    "bodyActions": [
      "ball transfer",
      "shoulder horizontal movement",
      "elbow extension",
      "wrist release",
      "weight shift"
    ],
    "jointActions": [
      "shoulder horizontal adduction",
      "elbow extension",
      "wrist flexion/extension",
      "trunk rotation",
      "hip weight transfer"
    ],
    "primeMovers": [
      "pectoralis major",
      "anterior deltoid",
      "triceps brachii",
      "serratus anterior"
    ],
    "assistingMuscles": [
      "forearm flexor group",
      "forearm extensor group",
      "rotator cuff",
      "obliquus externus abdominis",
      "gluteus maximus"
    ],
    "stabilizers": [
      "trapezius",
      "rhomboid major",
      "gluteus medius",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "concentric projection",
      "isometric proximal stabilization",
      "eccentric follow-through"
    ],
    "commonForceOrSkillDemand": "rapid accurate projection with whole-body sequencing",
    "recommendedExercisePatterns": [
      "medicine-ball chest pass",
      "cable press",
      "one-arm cable row",
      "landmine press"
    ],
    "recommendedExercises": [
      "medicine-ball chest pass",
      "cable press",
      "one-arm cable row",
      "landmine press"
    ],
    "transferRationale": "Medicine-ball and cable patterns can reinforce general sequencing and force projection, but passing accuracy, ball spin, and timing require rugby practice.",
    "exerciseSelectionCautions": "Keep throws submaximal until technique is stable; avoid high-volume ballistic work with painful shoulders or elbows.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9924573/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8184906/",
      "https://bjsm.bmj.com/content/49/8/520"
    ],
    "sourceSummary": "The records synthesize peer-reviewed rugby biomechanics research on sprinting, tackling, scrummaging, and force demands with evidence-aware anatomical reasoning; direct exercise-to-performance causation and EMG claims were avoided, and confidence is lower for complex cooperative or reactive skills."
  },
  {
    "id": "rugby-14",
    "sportId": "rugby",
    "label": "rotational pass",
    "movementFamily": "transverse-plane power",
    "bodyActions": [
      "pelvis-to-trunk rotation",
      "shoulder horizontal adduction",
      "elbow extension",
      "weight transfer"
    ],
    "jointActions": [
      "hip/pelvis rotation",
      "trunk rotation",
      "shoulder horizontal adduction",
      "elbow extension"
    ],
    "primeMovers": [
      "obliquus externus abdominis",
      "obliquus internus abdominis",
      "gluteus maximus",
      "pectoralis major",
      "triceps brachii"
    ],
    "assistingMuscles": [
      "adductor magnus",
      "latissimus dorsi",
      "anterior deltoid",
      "serratus anterior",
      "forearm muscles"
    ],
    "stabilizers": [
      "transversus abdominis",
      "multifidus",
      "gluteus medius",
      "rotator cuff",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "concentric rotation and projection",
      "eccentric deceleration",
      "isometric bracing"
    ],
    "commonForceOrSkillDemand": "rapid transverse-plane force transfer and deceleration",
    "recommendedExercisePatterns": [
      "medicine-ball rotational throw",
      "landmine rotation",
      "cable chop",
      "Pallof press"
    ],
    "recommendedExercises": [
      "medicine-ball rotational throw",
      "landmine rotation",
      "cable chop",
      "Pallof press"
    ],
    "transferRationale": "Rotational throws and cable patterns share proximal-to-distal sequencing and braking demands, but they cannot establish pass selection or ball-release skill.",
    "exerciseSelectionCautions": "Use hips to initiate and keep the lumbar spine controlled; limit volume if rib, lumbar, or shoulder symptoms occur.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9924573/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8184906/",
      "https://bjsm.bmj.com/content/49/8/520"
    ],
    "sourceSummary": "The records synthesize peer-reviewed rugby biomechanics research on sprinting, tackling, scrummaging, and force demands with evidence-aware anatomical reasoning; direct exercise-to-performance causation and EMG claims were avoided, and confidence is lower for complex cooperative or reactive skills."
  },
  {
    "id": "rugby-15",
    "sportId": "rugby",
    "label": "kicking",
    "movementFamily": "unilateral striking and rotational skill",
    "bodyActions": [
      "single-leg support",
      "kicking-leg hip flexion and knee extension",
      "trunk rotation",
      "ankle-foot control"
    ],
    "jointActions": [
      "support-leg hip/knee/ankle stabilization",
      "kicking hip flexion",
      "knee extension",
      "trunk rotation"
    ],
    "primeMovers": [
      "iliopsoas",
      "rectus femoris",
      "quadriceps femoris",
      "gluteus maximus",
      "adductor muscle group"
    ],
    "assistingMuscles": [
      "hamstring muscle group",
      "gastrocnemius",
      "soleus",
      "gluteus medius",
      "sartorius"
    ],
    "stabilizers": [
      "obliquus externus abdominis",
      "deep hip rotators",
      "intrinsic foot muscles",
      "transversus abdominis"
    ],
    "contractionRoles": [
      "concentric swing",
      "eccentric leg deceleration",
      "isometric support-leg balance"
    ],
    "commonForceOrSkillDemand": "high-speed unilateral limb swing with precise support-base control",
    "recommendedExercisePatterns": [
      "single-leg Romanian deadlift",
      "split squat",
      "cable chop",
      "medicine-ball rotational throw"
    ],
    "recommendedExercises": [
      "single-leg Romanian deadlift",
      "split squat",
      "cable chop",
      "medicine-ball rotational throw"
    ],
    "transferRationale": "Unilateral hinge, split-stance strength, and rotation overlap with support-leg and trunk demands, while kicking accuracy and ball contact remain technical.",
    "exerciseSelectionCautions": "Avoid excessive kicking-leg volume after fatigue; progress support-leg balance and protect hip flexor/groin tissues.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9924573/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8184906/",
      "https://bjsm.bmj.com/content/49/8/520"
    ],
    "sourceSummary": "The records synthesize peer-reviewed rugby biomechanics research on sprinting, tackling, scrummaging, and force demands with evidence-aware anatomical reasoning; direct exercise-to-performance causation and EMG claims were avoided, and confidence is lower for complex cooperative or reactive skills."
  },
  {
    "id": "rugby-16",
    "sportId": "rugby",
    "label": "jumping catch",
    "movementFamily": "reactive aerial ability",
    "bodyActions": [
      "vertical/horizontal jump",
      "aerial body control",
      "arm elevation",
      "hand capture",
      "eccentric landing"
    ],
    "jointActions": [
      "hip/knee extension",
      "ankle plantarflexion",
      "shoulder flexion/elevation",
      "landing flexion"
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus maximus",
      "hamstring muscle group",
      "gastrocnemius",
      "deltoid muscle group"
    ],
    "assistingMuscles": [
      "soleus",
      "iliopsoas",
      "forearm flexor group",
      "serratus anterior",
      "rotator cuff"
    ],
    "stabilizers": [
      "gluteus medius",
      "intrinsic foot muscles",
      "abdominal wall",
      "trapezius",
      "multifidus"
    ],
    "contractionRoles": [
      "concentric take-off/reach",
      "isometric catch stabilization",
      "eccentric landing"
    ],
    "commonForceOrSkillDemand": "reactive jump, reach, and landing under visual constraints",
    "recommendedExercisePatterns": [
      "countermovement jump",
      "medicine-ball catch",
      "loaded jump",
      "landing-stick drill"
    ],
    "recommendedExercises": [
      "countermovement jump",
      "medicine-ball catch",
      "loaded jump",
      "landing-stick drill"
    ],
    "transferRationale": "Jumping and catching drills share general aerial coordination and force absorption, but visual competition for the ball and opponent contact require field practice.",
    "exerciseSelectionCautions": "Use safe landing space and soft implements; progress visual and contact constraints separately.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9924573/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8184906/",
      "https://bjsm.bmj.com/content/49/8/520"
    ],
    "sourceSummary": "The records synthesize peer-reviewed rugby biomechanics research on sprinting, tackling, scrummaging, and force demands with evidence-aware anatomical reasoning; direct exercise-to-performance causation and EMG claims were avoided, and confidence is lower for complex cooperative or reactive skills."
  },
  {
    "id": "rugby-17",
    "sportId": "rugby",
    "label": "ground-to-feet recovery",
    "movementFamily": "floor-to-standing agility",
    "bodyActions": [
      "prone/supine transition",
      "arm push",
      "rapid foot placement",
      "extension to standing"
    ],
    "jointActions": [
      "shoulder/elbow extension",
      "trunk flexion/rotation",
      "hip/knee extension",
      "ankle stabilization"
    ],
    "primeMovers": [
      "pectoralis major",
      "triceps brachii",
      "quadriceps femoris",
      "gluteus maximus",
      "abdominal wall"
    ],
    "assistingMuscles": [
      "anterior deltoid",
      "serratus anterior",
      "iliopsoas",
      "hamstring muscle group",
      "adductor muscle group"
    ],
    "stabilizers": [
      "obliquus externus abdominis",
      "multifidus",
      "gluteus medius",
      "intrinsic foot muscles",
      "rotator cuff"
    ],
    "contractionRoles": [
      "concentric push and stand-up",
      "eccentric lowering",
      "isometric bracing"
    ],
    "commonForceOrSkillDemand": "rapid multi-limb transition from ground under fatigue or pressure",
    "recommendedExercisePatterns": [
      "technical get-up",
      "bear crawl",
      "sprawl-to-stand",
      "split squat"
    ],
    "recommendedExercises": [
      "technical get-up",
      "bear crawl",
      "sprawl-to-stand",
      "split squat"
    ],
    "transferRationale": "Technical get-ups and crawl transitions share sequencing and floor-to-standing strength, but rugby recovery includes ball, opponent, and tactical constraints.",
    "exerciseSelectionCautions": "Teach controlled pathways first; protect wrists, shoulders, knees, and avoid rushing unstable transitions.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9924573/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8184906/",
      "https://bjsm.bmj.com/content/49/8/520"
    ],
    "sourceSummary": "The records synthesize peer-reviewed rugby biomechanics research on sprinting, tackling, scrummaging, and force demands with evidence-aware anatomical reasoning; direct exercise-to-performance causation and EMG claims were avoided, and confidence is lower for complex cooperative or reactive skills."
  },
  {
    "id": "rugby-18",
    "sportId": "rugby",
    "label": "ball-carrying drive",
    "movementFamily": "locomotion under external load",
    "bodyActions": [
      "forward running under load",
      "trunk bracing",
      "shoulder adduction",
      "grip",
      "repeated leg propulsion"
    ],
    "jointActions": [
      "hip/knee extension",
      "ankle plantarflexion",
      "shoulder flexion/adduction",
      "elbow/wrist stabilization"
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps femoris",
      "hamstring muscle group",
      "triceps surae",
      "latissimus dorsi"
    ],
    "assistingMuscles": [
      "forearm flexor group",
      "pectoralis major",
      "adductor magnus",
      "soleus",
      "serratus anterior"
    ],
    "stabilizers": [
      "obliquus externus abdominis",
      "erector spinae",
      "gluteus medius",
      "rotator cuff",
      "cervical extensor muscles"
    ],
    "contractionRoles": [
      "concentric running/drive",
      "isometric grip and trunk bracing",
      "eccentric braking"
    ],
    "commonForceOrSkillDemand": "repeated propulsion while carrying and resisting contact",
    "recommendedExercisePatterns": [
      "farmer carry",
      "bear-hug carry",
      "sled march",
      "split squat"
    ],
    "recommendedExercises": [
      "farmer carry",
      "bear-hug carry",
      "sled march",
      "split squat"
    ],
    "transferRationale": "Loaded carries and sled marches overlap with bracing, grip, and locomotion under resistance, but ball security, evasive skill, and contact are sport-specific.",
    "exerciseSelectionCautions": "Use symmetrical and offset loads progressively; maintain breathing and avoid excessive neck or lumbar extension.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9924573/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8184906/",
      "https://bjsm.bmj.com/content/49/8/520"
    ],
    "sourceSummary": "The records synthesize peer-reviewed rugby biomechanics research on sprinting, tackling, scrummaging, and force demands with evidence-aware anatomical reasoning; direct exercise-to-performance causation and EMG claims were avoided, and confidence is lower for complex cooperative or reactive skills."
  },
  {
    "id": "rugby-19",
    "sportId": "rugby",
    "label": "backward defensive movement",
    "movementFamily": "multidirectional locomotion and retreat",
    "bodyActions": [
      "reverse running",
      "posterior weight control",
      "hip/knee flexion",
      "plantarflexion",
      "visual repositioning"
    ],
    "jointActions": [
      "hip extension/flexion",
      "knee flexion/extension",
      "ankle plantarflexion/dorsiflexion",
      "trunk stabilization"
    ],
    "primeMovers": [
      "hamstring muscle group",
      "gluteus maximus",
      "quadriceps femoris",
      "triceps surae"
    ],
    "assistingMuscles": [
      "iliopsoas",
      "gluteus medius",
      "adductor muscle group",
      "soleus",
      "sartorius"
    ],
    "stabilizers": [
      "obliquus externus abdominis",
      "deep hip rotators",
      "intrinsic foot muscles",
      "multifidus"
    ],
    "contractionRoles": [
      "concentric reverse propulsion",
      "eccentric braking",
      "isometric posture"
    ],
    "commonForceOrSkillDemand": "retreat speed with limited visual information and rapid transition forward",
    "recommendedExercisePatterns": [
      "reverse sled drag",
      "reverse lunge",
      "backward shuffle",
      "Romanian deadlift"
    ],
    "recommendedExercises": [
      "reverse sled drag",
      "reverse lunge",
      "backward shuffle",
      "Romanian deadlift"
    ],
    "transferRationale": "Reverse drags and lunges provide posterior-chain and braking exposure, but defensive scanning and reactive transition must be trained on the field.",
    "exerciseSelectionCautions": "Start with clear space and low speed; avoid crossing feet or uncontrolled backward falls.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9924573/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8184906/",
      "https://bjsm.bmj.com/content/49/8/520"
    ],
    "sourceSummary": "The records synthesize peer-reviewed rugby biomechanics research on sprinting, tackling, scrummaging, and force demands with evidence-aware anatomical reasoning; direct exercise-to-performance causation and EMG claims were avoided, and confidence is lower for complex cooperative or reactive skills."
  },
  {
    "id": "rugby-20",
    "sportId": "rugby",
    "label": "change of direction",
    "movementFamily": "multidirectional agility",
    "bodyActions": [
      "braking",
      "center-of-mass reorientation",
      "lateral/diagonal push-off",
      "re-acceleration"
    ],
    "jointActions": [
      "hip/knee flexion-extension",
      "hip abduction/adduction",
      "ankle dorsiflexion/plantarflexion",
      "trunk anti-rotation"
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus maximus",
      "hamstring muscle group",
      "gluteus medius",
      "adductor muscle group"
    ],
    "assistingMuscles": [
      "triceps surae",
      "soleus",
      "sartorius",
      "tensor fasciae latae",
      "deep hip rotators"
    ],
    "stabilizers": [
      "obliquus externus abdominis",
      "obliquus internus abdominis",
      "intrinsic foot muscles",
      "multifidus"
    ],
    "contractionRoles": [
      "eccentric deceleration",
      "isometric alignment",
      "concentric re-acceleration"
    ],
    "commonForceOrSkillDemand": "high braking-to-propulsion demand under reactive constraints",
    "recommendedExercisePatterns": [
      "deceleration drill",
      "lateral bounds",
      "split squat",
      "sled push"
    ],
    "recommendedExercises": [
      "deceleration drill",
      "lateral bounds",
      "split squat",
      "sled push"
    ],
    "transferRationale": "Unilateral strength and braking drills share mechanical qualities with change of direction, but reactive perception and rugby-specific running lines are not captured.",
    "exerciseSelectionCautions": "Progress planned to reactive drills; keep deceleration volume conservative for groin, knee, Achilles, and hamstring tolerance.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9924573/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC8184906/",
      "https://bjsm.bmj.com/content/49/8/520"
    ],
    "sourceSummary": "The records synthesize peer-reviewed rugby biomechanics research on sprinting, tackling, scrummaging, and force demands with evidence-aware anatomical reasoning; direct exercise-to-performance causation and EMG claims were avoided, and confidence is lower for complex cooperative or reactive skills."
  },
  {
    "id": "golf-1",
    "sportId": "golf",
    "label": "backswing rotation",
    "movementFamily": "transverse-plane rotation",
    "bodyActions": [
      "Trail-side pelvis and thorax rotate away from target while the golfer maintains address posture and creates a reversible coil."
    ],
    "jointActions": [
      "Trail hip internal rotation/abduction",
      "pelvis and thorax axial rotation",
      "thoracic extension",
      "shoulder external rotation."
    ],
    "primeMovers": [
      "Internal and external oblique muscles",
      "erector spinae",
      "gluteus maximus",
      "gluteus medius."
    ],
    "assistingMuscles": [
      "Multifidus",
      "adductor magnus",
      "latissimus dorsi",
      "posterior deltoid",
      "rotator cuff."
    ],
    "stabilizers": [
      "Transversus abdominis",
      "pelvic floor",
      "foot intrinsics",
      "deep hip rotators."
    ],
    "contractionRoles": [
      "Obliques and hip rotators shorten or lengthen through the coil",
      "trunk and pelvis co-contract to preserve posture",
      "posterior tissues control range eccentrically."
    ],
    "commonForceOrSkillDemand": "Large but controlled transverse-plane range with posture and repeatability.",
    "recommendedExercisePatterns": [
      "Loaded rotation",
      "half-kneeling lift",
      "thoracic rotation",
      "split-stance mobility-strength."
    ],
    "recommendedExercises": [
      "Cable lift",
      "Landmine rotation",
      "Half-kneeling cable lift"
    ],
    "transferRationale": "These patterns share hip-to-trunk rotation and braced posture, but they train general capacity rather than the golf timing or club interaction.",
    "exerciseSelectionCautions": "Do not force lumbar rotation; scale range and load for hip/thoracic mobility and avoid turning a mobility drill into a maximal lift.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9227529/",
      "https://doi.org/10.2165/00007256-200535050-00005",
      "https://www.mytpi.com/articles/biomechanics/kinematic-sequence-basics"
    ],
    "sourceSummary": "The records synthesize a peer-reviewed systematic review of golf-swing kinematics, Sports Medicine biomechanics evidence on force production and accuracy, lumbar-load/ground-reaction research, and TPI biomechanics education, while limiting causal exercise-transfer claims because direct intervention evidence is not established for each movement."
  },
  {
    "id": "golf-2",
    "sportId": "golf",
    "label": "downswing rotation",
    "movementFamily": "rotational power and sequencing",
    "bodyActions": [
      "Pelvis begins rotating toward target, followed by thorax, arms, and club with rapid angular-velocity transfer."
    ],
    "jointActions": [
      "Lead hip extension/rotation",
      "pelvis and thorax rotation",
      "shoulder internal rotation/adduction",
      "elbow extension."
    ],
    "primeMovers": [
      "Gluteus maximus",
      "internal and external oblique muscles",
      "adductor magnus",
      "pectoralis major."
    ],
    "assistingMuscles": [
      "Latissimus dorsi",
      "anterior deltoid",
      "triceps brachii",
      "hamstrings."
    ],
    "stabilizers": [
      "Transversus abdominis",
      "multifidus",
      "gluteus medius",
      "rotator cuff",
      "scapular stabilizers."
    ],
    "contractionRoles": [
      "Hip and trunk muscles produce acceleration while distal segments are sequenced later",
      "proximal muscles also brake the segment after peak speed."
    ],
    "commonForceOrSkillDemand": "High-rate rotational power and proximal-to-distal sequencing.",
    "recommendedExercisePatterns": [
      "Ballistic rotational throw",
      "cable chop",
      "step-behind power",
      "medicine-ball scoop."
    ],
    "recommendedExercises": [
      "Medicine-ball rotational throw",
      "Cable chop",
      "Landmine rotation"
    ],
    "transferRationale": "Ballistic throws expose the athlete to rapid whole-body rotation and bracing, mechanically overlapping the sequence without proving better clubhead speed.",
    "exerciseSelectionCautions": "Use submaximal volumes, clear space, and bilateral directions; do not infer that throwing power directly improves a player’s score.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9227529/",
      "https://doi.org/10.2165/00007256-200535050-00005",
      "https://www.mytpi.com/articles/biomechanics/kinematic-sequence-basics"
    ],
    "sourceSummary": "The records synthesize a peer-reviewed systematic review of golf-swing kinematics, Sports Medicine biomechanics evidence on force production and accuracy, lumbar-load/ground-reaction research, and TPI biomechanics education, while limiting causal exercise-transfer claims because direct intervention evidence is not established for each movement."
  },
  {
    "id": "golf-3",
    "sportId": "golf",
    "label": "hip initiation",
    "movementFamily": "proximal sequencing",
    "bodyActions": [
      "Lead-side pelvic rotation and extension precede substantial thorax and arm acceleration."
    ],
    "jointActions": [
      "Lead hip extension and external rotation",
      "pelvis axial rotation",
      "lead knee extension",
      "thoracic rotation."
    ],
    "primeMovers": [
      "Gluteus maximus",
      "adductor magnus",
      "internal and external oblique muscles."
    ],
    "assistingMuscles": [
      "Gluteus medius",
      "hamstrings",
      "quadriceps femoris",
      "contralateral latissimus dorsi."
    ],
    "stabilizers": [
      "Lead-side hip rotators",
      "trunk stabilizers",
      "foot and ankle stabilizers."
    ],
    "contractionRoles": [
      "Gluteal and adductor force initiates rotation",
      "lead hip abductors and trunk co-contract to prevent collapse."
    ],
    "commonForceOrSkillDemand": "Timing of proximal force with single-leg/frontal-plane control.",
    "recommendedExercisePatterns": [
      "Split-stance rotation",
      "unilateral hip extension",
      "step-and-rotate",
      "anti-rotation."
    ],
    "recommendedExercises": [
      "Split squat",
      "Cable rotation",
      "Single-leg Romanian deadlift"
    ],
    "transferRationale": "Unilateral lower-body patterns can build the force and balance prerequisites for initiating rotation, while cable rotation adds a task-relevant direction.",
    "exerciseSelectionCautions": "Keep pelvis and knee aligned; use technique-first loads because sequencing cannot be isolated perfectly with a gym exercise.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9227529/",
      "https://www.mytpi.com/articles/biomechanics/kinematic-sequence-basics",
      "https://doi.org/10.1080/14763141.2012.670662"
    ],
    "sourceSummary": "The records synthesize a peer-reviewed systematic review of golf-swing kinematics, Sports Medicine biomechanics evidence on force production and accuracy, lumbar-load/ground-reaction research, and TPI biomechanics education, while limiting causal exercise-transfer claims because direct intervention evidence is not established for each movement."
  },
  {
    "id": "golf-4",
    "sportId": "golf",
    "label": "shoulder rotation",
    "movementFamily": "glenohumeral rotation and scapulohumeral control",
    "bodyActions": [
      "Humerus rotates relative to the scapula while the trunk carries the shoulder girdle through the swing."
    ],
    "jointActions": [
      "Glenohumeral internal/external rotation",
      "scapular retraction, upward rotation, and posterior tilt."
    ],
    "primeMovers": [
      "Subscapularis",
      "infraspinatus",
      "teres minor",
      "supraspinatus."
    ],
    "assistingMuscles": [
      "Pectoralis major",
      "latissimus dorsi",
      "posterior deltoid",
      "teres major."
    ],
    "stabilizers": [
      "Serratus anterior",
      "middle and lower trapezius",
      "rhomboid major",
      "rotator-cuff co-contraction."
    ],
    "contractionRoles": [
      "Cuff muscles rotate and center the humeral head",
      "opposing cuff fibers and scapular muscles brake and guide motion."
    ],
    "commonForceOrSkillDemand": "Repeated high-velocity shoulder rotation with proximal control.",
    "recommendedExercisePatterns": [
      "Low-load cuff rotation",
      "row-plus",
      "serratus press",
      "controlled pull."
    ],
    "recommendedExercises": [
      "Cable external rotation",
      "Face pull",
      "Chest-supported row"
    ],
    "transferRationale": "These exercises train shoulder rotation, scapular positioning, and posterior-chain control that support the arm segment, not the complete swing.",
    "exerciseSelectionCautions": "Avoid high-fatigue or painful end-range internal rotation; use individualized range and preserve scapular motion rather than pinning it back.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9227529/",
      "https://journals.lww.com/nsca-scj/_layouts/15/oaks.journals/downloadpdf.aspx?an=00126548-201310000-00001"
    ],
    "sourceSummary": "The records synthesize a peer-reviewed systematic review of golf-swing kinematics, Sports Medicine biomechanics evidence on force production and accuracy, lumbar-load/ground-reaction research, and TPI biomechanics education, while limiting causal exercise-transfer claims because direct intervention evidence is not established for each movement."
  },
  {
    "id": "golf-5",
    "sportId": "golf",
    "label": "weight shift",
    "movementFamily": "weight transfer and unilateral force acceptance",
    "bodyActions": [
      "Center of mass shifts from trail to lead side while the trunk remains organized and the feet exchange pressure."
    ],
    "jointActions": [
      "Ankle plantarflexion/dorsiflexion",
      "knee flexion-extension",
      "hip abduction/adduction and extension",
      "pelvic translation."
    ],
    "primeMovers": [
      "Gluteus medius",
      "gluteus maximus",
      "quadriceps femoris",
      "hamstrings."
    ],
    "assistingMuscles": [
      "Adductor magnus",
      "soleus",
      "gastrocnemius",
      "tibialis anterior."
    ],
    "stabilizers": [
      "Foot intrinsics",
      "trunk obliques",
      "hip rotators",
      "peroneal muscles."
    ],
    "contractionRoles": [
      "Lead-side muscles accept and redirect force eccentrically, then stabilize isometrically as the opposite side unloads."
    ],
    "commonForceOrSkillDemand": "Lateral/diagonal force acceptance, balance, and timing.",
    "recommendedExercisePatterns": [
      "Lateral bound and stick",
      "split squat",
      "step-up",
      "unilateral landing."
    ],
    "recommendedExercises": [
      "Lateral bound",
      "Split squat",
      "Step-up"
    ],
    "transferRationale": "Unilateral and lateral exercises overlap pressure transfer and force acceptance, but they do not reproduce club constraints or perceptual timing.",
    "exerciseSelectionCautions": "Begin with controlled step-and-stick variations; monitor knee valgus, foot collapse, and back symptoms.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9227529/",
      "https://doi.org/10.2165/00007256-200535050-00005"
    ],
    "sourceSummary": "The records synthesize a peer-reviewed systematic review of golf-swing kinematics, Sports Medicine biomechanics evidence on force production and accuracy, lumbar-load/ground-reaction research, and TPI biomechanics education, while limiting causal exercise-transfer claims because direct intervention evidence is not established for each movement."
  },
  {
    "id": "golf-6",
    "sportId": "golf",
    "label": "lead-leg bracing",
    "movementFamily": "deceleration and force transfer",
    "bodyActions": [
      "Lead hip, knee, and ankle accept momentum and provide a firm base for late downswing and follow-through."
    ],
    "jointActions": [
      "Hip extension/rotation",
      "knee extension with controlled flexion",
      "ankle dorsiflexion and plantarflexion."
    ],
    "primeMovers": [
      "Quadriceps femoris",
      "gluteus maximus",
      "hamstrings",
      "soleus."
    ],
    "assistingMuscles": [
      "Gluteus medius",
      "adductor magnus",
      "gastrocnemius."
    ],
    "stabilizers": [
      "Deep hip rotators",
      "foot intrinsics",
      "peroneal muscles",
      "trunk obliques."
    ],
    "contractionRoles": [
      "Quadriceps and hamstrings absorb load eccentrically",
      "gluteals and calf complex co-contract for a stiff but adaptable base."
    ],
    "commonForceOrSkillDemand": "Unilateral eccentric braking and frontal/transverse-plane stiffness.",
    "recommendedExercisePatterns": [
      "Split-squat isometric",
      "deceleration landing",
      "step-down",
      "unilateral strength."
    ],
    "recommendedExercises": [
      "Bulgarian split squat",
      "Step-down",
      "Single-leg squat"
    ],
    "transferRationale": "These patterns expose the lead side to unilateral force absorption and alignment demands relevant to bracing.",
    "exerciseSelectionCautions": "Do not chase maximal depth or load if ankle/hip mobility causes compensations; bracing is not a reason to lock the knee.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9227529/",
      "https://doi.org/10.1080/14763141.2012.670662"
    ],
    "sourceSummary": "The records synthesize a peer-reviewed systematic review of golf-swing kinematics, Sports Medicine biomechanics evidence on force production and accuracy, lumbar-load/ground-reaction research, and TPI biomechanics education, while limiting causal exercise-transfer claims because direct intervention evidence is not established for each movement."
  },
  {
    "id": "golf-7",
    "sportId": "golf",
    "label": "trail-leg drive",
    "movementFamily": "lower-body propulsion",
    "bodyActions": [
      "Trail hip and knee extend and the trail foot applies force as the pelvis begins to rotate toward target."
    ],
    "jointActions": [
      "Hip extension and external rotation",
      "knee extension",
      "ankle plantarflexion",
      "pelvic rotation."
    ],
    "primeMovers": [
      "Gluteus maximus",
      "quadriceps femoris",
      "hamstrings."
    ],
    "assistingMuscles": [
      "Adductor magnus",
      "soleus",
      "gastrocnemius",
      "gluteus medius."
    ],
    "stabilizers": [
      "Foot intrinsics",
      "ankle stabilizers",
      "trunk obliques",
      "hip rotators."
    ],
    "contractionRoles": [
      "Hip and knee extensors contract concentrically",
      "foot and hip stabilizers hold alignment as force is transmitted upward."
    ],
    "commonForceOrSkillDemand": "Ground-directed propulsion coupled to rotation.",
    "recommendedExercisePatterns": [
      "Hip hinge",
      "sled push",
      "staggered stance drive",
      "triple extension."
    ],
    "recommendedExercises": [
      "Sled push",
      "Romanian deadlift",
      "Jump squat"
    ],
    "transferRationale": "These patterns develop general hip extension and ground-force expression; they are not evidence that a particular lift changes swing mechanics.",
    "exerciseSelectionCautions": "Use loads that preserve posture; excessive vertical jumping or sled load may change rather than match the intended force direction.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9227529/",
      "https://doi.org/10.2165/00007256-200535050-00005"
    ],
    "sourceSummary": "The records synthesize a peer-reviewed systematic review of golf-swing kinematics, Sports Medicine biomechanics evidence on force production and accuracy, lumbar-load/ground-reaction research, and TPI biomechanics education, while limiting causal exercise-transfer claims because direct intervention evidence is not established for each movement."
  },
  {
    "id": "golf-8",
    "sportId": "golf",
    "label": "trunk anti-extension",
    "movementFamily": "trunk bracing and posture",
    "bodyActions": [
      "Resist lumbar extension and rib flare while hips and shoulders rotate around a controlled spine."
    ],
    "jointActions": [
      "Lumbar flexion control",
      "thoracic-pelvic dissociation",
      "hip extension without lumbar substitution."
    ],
    "primeMovers": [
      "Rectus abdominis",
      "internal and external oblique muscles",
      "transversus abdominis."
    ],
    "assistingMuscles": [
      "Gluteus maximus",
      "latissimus dorsi",
      "pectoralis major."
    ],
    "stabilizers": [
      "Multifidus",
      "diaphragm",
      "pelvic floor",
      "quadratus lumborum."
    ],
    "contractionRoles": [
      "Abdominal wall and spinal extensors co-contract isometrically",
      "gluteals limit anterior pelvic tilt",
      "small eccentric corrections manage motion."
    ],
    "commonForceOrSkillDemand": "Isometric trunk stiffness under limb movement and rotation.",
    "recommendedExercisePatterns": [
      "Dead bug",
      "front-plank pull",
      "ab-wheel regression",
      "loaded carry."
    ],
    "recommendedExercises": [
      "Dead bug",
      "Front plank",
      "Suitcase carry"
    ],
    "transferRationale": "Anti-extension exercises share the requirement to keep the ribcage and pelvis organized while limbs move, supporting general trunk control.",
    "exerciseSelectionCautions": "Avoid breath-holding and lumbar sag; regress lever length or load before adding instability.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9227529/",
      "https://journals.lww.com/nsca-scj/_layouts/15/oaks.journals/downloadpdf.aspx?an=00126548-201310000-00001"
    ],
    "sourceSummary": "The records synthesize a peer-reviewed systematic review of golf-swing kinematics, Sports Medicine biomechanics evidence on force production and accuracy, lumbar-load/ground-reaction research, and TPI biomechanics education, while limiting causal exercise-transfer claims because direct intervention evidence is not established for each movement."
  },
  {
    "id": "golf-9",
    "sportId": "golf",
    "label": "trunk anti-rotation",
    "movementFamily": "anti-rotation stability",
    "bodyActions": [
      "Resist unwanted torso rotation when asymmetric ground and club forces act through the body."
    ],
    "jointActions": [
      "Isometric control of lumbar/pelvic rotation",
      "hip abduction and foot pressure control."
    ],
    "primeMovers": [
      "Internal and external oblique muscles",
      "transversus abdominis",
      "multifidus."
    ],
    "assistingMuscles": [
      "Quadratus lumborum",
      "gluteus medius",
      "adductor magnus."
    ],
    "stabilizers": [
      "Diaphragm",
      "pelvic floor",
      "hip rotators",
      "serratus anterior."
    ],
    "contractionRoles": [
      "Trunk muscles primarily hold isometrically with low-amplitude eccentric corrections while hips and feet transmit force."
    ],
    "commonForceOrSkillDemand": "Asymmetric bracing and precise control rather than maximal range.",
    "recommendedExercisePatterns": [
      "Pallof press",
      "offset carry",
      "split-stance anti-rotation",
      "cable hold."
    ],
    "recommendedExercises": [
      "Pallof press",
      "Suitcase carry",
      "Half-kneeling cable hold"
    ],
    "transferRationale": "These patterns train resistance to external rotation and asymmetrical loading, a plausible shared physical quality but not a direct golf-performance intervention.",
    "exerciseSelectionCautions": "Keep pelvis square enough for the drill; do not turn anti-rotation into painful spinal rigidity or maximal breath-holding.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9227529/",
      "https://doi.org/10.1080/14763141.2012.670662",
      "https://journals.lww.com/nsca-scj/_layouts/15/oaks.journals/downloadpdf.aspx?an=00126548-201310000-00001"
    ],
    "sourceSummary": "The records synthesize a peer-reviewed systematic review of golf-swing kinematics, Sports Medicine biomechanics evidence on force production and accuracy, lumbar-load/ground-reaction research, and TPI biomechanics education, while limiting causal exercise-transfer claims because direct intervention evidence is not established for each movement."
  },
  {
    "id": "golf-10",
    "sportId": "golf",
    "label": "wrist hinge",
    "movementFamily": "distal lever control",
    "bodyActions": [
      "Maintain radial/ulnar wrist angle and forearm orientation during backswing and transition."
    ],
    "jointActions": [
      "Wrist flexion-extension and radial-ulnar deviation",
      "forearm pronation-supination",
      "finger flexion."
    ],
    "primeMovers": [
      "Flexor carpi radialis",
      "flexor carpi ulnaris",
      "extensor carpi radialis longus/brevis",
      "extensor carpi ulnaris."
    ],
    "assistingMuscles": [
      "Pronator teres",
      "pronator quadratus",
      "supinator",
      "brachioradialis."
    ],
    "stabilizers": [
      "Finger flexors",
      "intrinsic hand muscles",
      "rotator cuff",
      "scapular stabilizers."
    ],
    "contractionRoles": [
      "Forearm flexors/extensors co-contract isometrically to maintain the lever",
      "opposing groups control angle eccentrically during transition."
    ],
    "commonForceOrSkillDemand": "Fine distal-angle control under a moving implement and grip.",
    "recommendedExercisePatterns": [
      "Light wrist isometrics",
      "pronation/supination",
      "grip endurance",
      "cable hinge."
    ],
    "recommendedExercises": [
      "Wrist curl",
      "Reverse wrist curl",
      "Farmer carry"
    ],
    "transferRationale": "Forearm and grip exercises address local endurance and co-contraction needed to control a club, but do not establish the correct swing release.",
    "exerciseSelectionCautions": "Use light loads and neutral wrist alignment; avoid high-volume loaded deviation with elbow or wrist pain.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9227529/",
      "https://journals.lww.com/nsca-scj/_layouts/15/oaks.journals/downloadpdf.aspx?an=00126548-201310000-00001"
    ],
    "sourceSummary": "The records synthesize a peer-reviewed systematic review of golf-swing kinematics, Sports Medicine biomechanics evidence on force production and accuracy, lumbar-load/ground-reaction research, and TPI biomechanics education, while limiting causal exercise-transfer claims because direct intervention evidence is not established for each movement."
  },
  {
    "id": "golf-11",
    "sportId": "golf",
    "label": "wrist release",
    "movementFamily": "distal speed generation",
    "bodyActions": [
      "Timed wrist uncocking and forearm rotation deliver the club through impact and then decelerate it."
    ],
    "jointActions": [
      "Wrist flexion and ulnar deviation",
      "forearm pronation/supination",
      "elbow extension."
    ],
    "primeMovers": [
      "Flexor carpi ulnaris",
      "flexor carpi radialis",
      "pronator teres",
      "pronator quadratus."
    ],
    "assistingMuscles": [
      "Extensor carpi ulnaris",
      "supinator",
      "triceps brachii",
      "finger flexors."
    ],
    "stabilizers": [
      "Rotator cuff",
      "scapular stabilizers",
      "trunk and lead-leg stabilizers."
    ],
    "contractionRoles": [
      "Distal muscles accelerate the club late",
      "antagonists and proximal segments brake the arm-club system after impact."
    ],
    "commonForceOrSkillDemand": "High-speed distal coordination and eccentric braking.",
    "recommendedExercisePatterns": [
      "Low-load ballistic release",
      "medicine-ball scoop",
      "cable snap",
      "forearm rotation."
    ],
    "recommendedExercises": [
      "Medicine-ball scoop toss",
      "Cable woodchop",
      "Reverse wrist curl"
    ],
    "transferRationale": "Ballistic patterns can train intent and general release/braking qualities, but the evidence does not support claiming a causal clubhead-speed gain from one exercise.",
    "exerciseSelectionCautions": "Progress speed gradually; avoid heavy wrist snapping, uncontrolled catches, or pain at the medial/lateral elbow.",
    "evidenceConfidence": "limited",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9227529/",
      "https://doi.org/10.2165/00007256-200535050-00005",
      "https://doi.org/10.1080/14763141.2012.670662"
    ],
    "sourceSummary": "The records synthesize a peer-reviewed systematic review of golf-swing kinematics, Sports Medicine biomechanics evidence on force production and accuracy, lumbar-load/ground-reaction research, and TPI biomechanics education, while limiting causal exercise-transfer claims because direct intervention evidence is not established for each movement."
  },
  {
    "id": "golf-12",
    "sportId": "golf",
    "label": "scapular retraction",
    "movementFamily": "scapular control",
    "bodyActions": [
      "Scapulae retract and position the arms during set-up, backswing, and transition without excessive shrugging."
    ],
    "jointActions": [
      "Scapular retraction, depression, posterior tilt, and upward rotation."
    ],
    "primeMovers": [
      "Middle trapezius",
      "rhomboid major",
      "rhomboid minor."
    ],
    "assistingMuscles": [
      "Posterior deltoid",
      "lower trapezius",
      "latissimus dorsi."
    ],
    "stabilizers": [
      "Serratus anterior",
      "rotator cuff",
      "thoracic extensors."
    ],
    "contractionRoles": [
      "Retractors shorten concentrically and control return eccentrically",
      "serratus and cuff co-contract to keep the scapula moving on the thorax."
    ],
    "commonForceOrSkillDemand": "Scapular positioning with free, coordinated shoulder motion.",
    "recommendedExercisePatterns": [
      "Horizontal row",
      "prone retraction",
      "row-plus",
      "thoracic extension."
    ],
    "recommendedExercises": [
      "Chest-supported row",
      "Face pull",
      "Prone Y raise"
    ],
    "transferRationale": "Rows and face pulls build scapular strength/endurance that can support arm control, without implying a fixed “pin the shoulders back” swing cue.",
    "exerciseSelectionCautions": "Do not over-retract or depress the scapula; stop if shoulder symptoms increase and retain normal upward rotation.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9227529/",
      "https://journals.lww.com/nsca-scj/_layouts/15/oaks.journals/downloadpdf.aspx?an=00126548-201310000-00001"
    ],
    "sourceSummary": "The records synthesize a peer-reviewed systematic review of golf-swing kinematics, Sports Medicine biomechanics evidence on force production and accuracy, lumbar-load/ground-reaction research, and TPI biomechanics education, while limiting causal exercise-transfer claims because direct intervention evidence is not established for each movement."
  },
  {
    "id": "golf-13",
    "sportId": "golf",
    "label": "shoulder adduction",
    "movementFamily": "upper-limb linkage",
    "bodyActions": [
      "Upper arm moves toward the trunk through downswing and impact while the scapula and trunk coordinate the club path."
    ],
    "jointActions": [
      "Glenohumeral adduction and internal rotation",
      "scapular depression/protraction",
      "elbow extension."
    ],
    "primeMovers": [
      "Latissimus dorsi",
      "pectoralis major",
      "teres major."
    ],
    "assistingMuscles": [
      "Triceps brachii",
      "anterior deltoid",
      "coracobrachialis."
    ],
    "stabilizers": [
      "Rotator cuff",
      "serratus anterior",
      "trapezius",
      "trunk obliques."
    ],
    "contractionRoles": [
      "Adductors accelerate the arm",
      "cuff and scapular muscles center and brake the humerus while the trunk remains braced."
    ],
    "commonForceOrSkillDemand": "Linked upper-limb force with shoulder stability.",
    "recommendedExercisePatterns": [
      "Single-arm cable pull-in",
      "straight-arm pulldown",
      "row",
      "anti-rotation."
    ],
    "recommendedExercises": [
      "Single-arm cable row",
      "Straight-arm pulldown",
      "Pallof press"
    ],
    "transferRationale": "Unilateral pulls combine shoulder adduction with trunk control, approximating shared muscle actions while leaving golf-specific timing to practice.",
    "exerciseSelectionCautions": "Avoid shoulder depression and humeral anterior glide; use pain-free range and do not substitute lumbar extension for latissimus work.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9227529/",
      "https://journals.lww.com/nsca-scj/_layouts/15/oaks.journals/downloadpdf.aspx?an=00126548-201310000-00001"
    ],
    "sourceSummary": "The records synthesize a peer-reviewed systematic review of golf-swing kinematics, Sports Medicine biomechanics evidence on force production and accuracy, lumbar-load/ground-reaction research, and TPI biomechanics education, while limiting causal exercise-transfer claims because direct intervention evidence is not established for each movement."
  },
  {
    "id": "golf-14",
    "sportId": "golf",
    "label": "driving swing",
    "movementFamily": "full-swing rotational power",
    "bodyActions": [
      "Full-amplitude high-velocity rotation uses ground pressure, proximal sequencing, arm-club delivery, and follow-through braking."
    ],
    "jointActions": [
      "Hip/pelvis and thorax rotation",
      "lead-side extension",
      "shoulder rotation/adduction",
      "elbow extension",
      "wrist release."
    ],
    "primeMovers": [
      "Gluteus maximus",
      "quadriceps femoris",
      "internal/external oblique muscles",
      "pectoralis major",
      "latissimus dorsi."
    ],
    "assistingMuscles": [
      "Adductor magnus",
      "hamstrings",
      "deltoid",
      "triceps brachii",
      "forearm flexors/extensors."
    ],
    "stabilizers": [
      "Multifidus",
      "transversus abdominis",
      "gluteus medius",
      "rotator cuff",
      "feet/ankles."
    ],
    "contractionRoles": [
      "Sequential concentric acceleration is followed by eccentric braking and isometric posture control across the chain."
    ],
    "commonForceOrSkillDemand": "Maximal or near-maximal rotational speed, ground interaction, and accuracy.",
    "recommendedExercisePatterns": [
      "Medicine-ball throw",
      "rotational cable power",
      "unilateral lower-body strength",
      "deceleration."
    ],
    "recommendedExercises": [
      "Medicine-ball rotational throw",
      "Landmine rotation",
      "Bulgarian split squat",
      "Cable chop"
    ],
    "transferRationale": "These exercises cover major physical qualities—rotation, lower-body force, and bracing—but cannot reproduce club mass, ball contact, or technical skill.",
    "exerciseSelectionCautions": "Use progressive intensity and low fatigue; high-speed rotation is inappropriate during acute back, hip, shoulder, or elbow symptoms.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9227529/",
      "https://doi.org/10.2165/00007256-200535050-00005",
      "https://www.mytpi.com/articles/biomechanics/kinematic-sequence-basics"
    ],
    "sourceSummary": "The records synthesize a peer-reviewed systematic review of golf-swing kinematics, Sports Medicine biomechanics evidence on force production and accuracy, lumbar-load/ground-reaction research, and TPI biomechanics education, while limiting causal exercise-transfer claims because direct intervention evidence is not established for each movement."
  },
  {
    "id": "golf-15",
    "sportId": "golf",
    "label": "iron swing",
    "movementFamily": "rotational technique and force transfer",
    "bodyActions": [
      "Controlled rotational swing emphasizes posture, low-point control, forward shaft delivery, and repeatable ground contact."
    ],
    "jointActions": [
      "Pelvis/thorax rotation",
      "lead hip extension",
      "knee and ankle control",
      "shoulder adduction/internal rotation",
      "wrist angle maintenance."
    ],
    "primeMovers": [
      "Gluteus maximus",
      "quadriceps femoris",
      "hamstrings",
      "internal/external oblique muscles."
    ],
    "assistingMuscles": [
      "Pectoralis major",
      "latissimus dorsi",
      "adductor magnus",
      "forearm flexors."
    ],
    "stabilizers": [
      "Transversus abdominis",
      "multifidus",
      "gluteus medius",
      "rotator cuff",
      "foot intrinsics."
    ],
    "contractionRoles": [
      "Moderate concentric swing effort is constrained by isometric posture and eccentric control of backswing/follow-through."
    ],
    "commonForceOrSkillDemand": "Repeatable submaximal rotational force and low-point precision.",
    "recommendedExercisePatterns": [
      "Split-stance chop",
      "hinge",
      "unilateral squat",
      "anti-extension."
    ],
    "recommendedExercises": [
      "Split squat",
      "Cable chop",
      "Romanian deadlift",
      "Dead bug"
    ],
    "transferRationale": "These patterns support posture, unilateral base, and rotational force transfer without claiming they teach clubface or low-point control.",
    "exerciseSelectionCautions": "Favor controlled tempo and technical quality; avoid excessive loading if it changes the athlete’s address posture.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9227529/",
      "https://www.mytpi.com/articles/biomechanics/kinematic-sequence-basics",
      "https://doi.org/10.1080/14763141.2012.670662"
    ],
    "sourceSummary": "The records synthesize a peer-reviewed systematic review of golf-swing kinematics, Sports Medicine biomechanics evidence on force production and accuracy, lumbar-load/ground-reaction research, and TPI biomechanics education, while limiting causal exercise-transfer claims because direct intervention evidence is not established for each movement."
  },
  {
    "id": "golf-16",
    "sportId": "golf",
    "label": "pitching motion",
    "movementFamily": "submaximal rotational control",
    "bodyActions": [
      "Partial-amplitude swing modulates club speed and distance with precise trunk, shoulder, wrist, and foot control."
    ],
    "jointActions": [
      "Reduced pelvis/thorax rotation",
      "shoulder flexion/adduction",
      "elbow extension",
      "wrist hinge and release."
    ],
    "primeMovers": [
      "Internal/external oblique muscles",
      "gluteus maximus",
      "pectoralis major",
      "latissimus dorsi."
    ],
    "assistingMuscles": [
      "Deltoid",
      "triceps brachii",
      "forearm flexors/extensors",
      "adductor magnus."
    ],
    "stabilizers": [
      "Rotator cuff",
      "serratus anterior",
      "multifidus",
      "gluteus medius",
      "foot intrinsics."
    ],
    "contractionRoles": [
      "Controlled concentric acceleration and eccentric braking with substantial isometric posture and distal precision."
    ],
    "commonForceOrSkillDemand": "Low-to-moderate power with high distance-control and repeatability demands.",
    "recommendedExercisePatterns": [
      "Half-kneeling cable lift/chop",
      "tempo rotation",
      "single-arm press",
      "wrist control."
    ],
    "recommendedExercises": [
      "Half-kneeling cable lift",
      "Cable chop",
      "Face pull"
    ],
    "transferRationale": "Tempo and half-kneeling patterns reduce degrees of freedom while training trunk/shoulder coordination relevant to distance modulation.",
    "exerciseSelectionCautions": "Do not overstate transfer from kneeling drills; retain standing practice and use light, pain-free wrist loading.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9227529/",
      "https://www.mytpi.com/articles/biomechanics/kinematic-sequence-basics",
      "https://journals.lww.com/nsca-scj/_layouts/15/oaks.journals/downloadpdf.aspx?an=00126548-201310000-00001"
    ],
    "sourceSummary": "The records synthesize a peer-reviewed systematic review of golf-swing kinematics, Sports Medicine biomechanics evidence on force production and accuracy, lumbar-load/ground-reaction research, and TPI biomechanics education, while limiting causal exercise-transfer claims because direct intervention evidence is not established for each movement."
  },
  {
    "id": "golf-17",
    "sportId": "golf",
    "label": "bunker swing",
    "movementFamily": "variable-surface rotational power",
    "bodyActions": [
      "Open-stance swing uses a wider base, lower-body bracing, and forceful interaction with sand followed by a high finish."
    ],
    "jointActions": [
      "Hip abduction/adduction and rotation",
      "knee/ankle flexion-extension",
      "thorax rotation",
      "shoulder adduction",
      "wrist release."
    ],
    "primeMovers": [
      "Gluteus maximus",
      "adductor magnus",
      "quadriceps femoris",
      "internal/external oblique muscles."
    ],
    "assistingMuscles": [
      "Hamstrings",
      "pectoralis major",
      "latissimus dorsi",
      "forearm flexors/extensors."
    ],
    "stabilizers": [
      "Gluteus medius",
      "foot intrinsics",
      "ankle stabilizers",
      "rotator cuff",
      "multifidus."
    ],
    "contractionRoles": [
      "Lower body absorbs variable resistance eccentrically",
      "hips/trunk accelerate and stabilize",
      "upper limb releases and brakes the club."
    ],
    "commonForceOrSkillDemand": "Variable external resistance, open-stance balance, and rotational power.",
    "recommendedExercisePatterns": [
      "Sandbag lift",
      "scoop throw",
      "lateral lunge",
      "open-stance cable rotation."
    ],
    "recommendedExercises": [
      "Sandbag clean",
      "Medicine-ball scoop toss",
      "Lateral lunge",
      "Cable rotation"
    ],
    "transferRationale": "Variable-load carries/throws and lateral strength share bracing and force-direction challenges, but sand impact and club-soil interaction require actual skill practice.",
    "exerciseSelectionCautions": "Keep loads moderate and surfaces predictable; do not use unstable surfaces to mimic sand unless coached and medically appropriate.",
    "evidenceConfidence": "limited",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9227529/",
      "https://doi.org/10.2165/00007256-200535050-00005",
      "https://doi.org/10.1080/14763141.2012.670662"
    ],
    "sourceSummary": "The records synthesize a peer-reviewed systematic review of golf-swing kinematics, Sports Medicine biomechanics evidence on force production and accuracy, lumbar-load/ground-reaction research, and TPI biomechanics education, while limiting causal exercise-transfer claims because direct intervention evidence is not established for each movement."
  },
  {
    "id": "golf-18",
    "sportId": "golf",
    "label": "putting stroke",
    "movementFamily": "precision pendulum",
    "bodyActions": [
      "Small shoulder-and-arm pendulum motion occurs with quiet wrists, stable pelvis, and visual-motor precision."
    ],
    "jointActions": [
      "Shoulder flexion/horizontal adduction",
      "scapular rotation",
      "minimal wrist motion",
      "isometric hip and trunk control."
    ],
    "primeMovers": [
      "Anterior deltoid",
      "pectoralis major",
      "middle deltoid."
    ],
    "assistingMuscles": [
      "Rotator cuff",
      "posterior deltoid",
      "forearm flexors/extensors."
    ],
    "stabilizers": [
      "Serratus anterior",
      "middle/lower trapezius",
      "multifidus",
      "gluteus medius",
      "foot intrinsics."
    ],
    "contractionRoles": [
      "Shoulder muscles make low-amplitude concentric/eccentric adjustments",
      "trunk, wrist, and lower body remain mostly isometric."
    ],
    "commonForceOrSkillDemand": "Very low force, high precision, repeatability, and attentional demand.",
    "recommendedExercisePatterns": [
      "Low-load shoulder control",
      "scapular endurance",
      "anti-rotation",
      "breathing/posture."
    ],
    "recommendedExercises": [
      "Cable row",
      "Face pull",
      "Pallof press"
    ],
    "transferRationale": "These exercises can support postural and scapular endurance but have weak direct transfer to green-reading, touch, and visual-motor skill.",
    "exerciseSelectionCautions": "Keep loads light and avoid fatigue immediately before putting practice; do not treat strength work as a substitute for putting technique.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9227529/",
      "https://www.mytpi.com/articles/biomechanics/kinematic-sequence-basics",
      "https://journals.lww.com/nsca-scj/_layouts/15/oaks.journals/downloadpdf.aspx?an=00126548-201310000-00001"
    ],
    "sourceSummary": "The records synthesize a peer-reviewed systematic review of golf-swing kinematics, Sports Medicine biomechanics evidence on force production and accuracy, lumbar-load/ground-reaction research, and TPI biomechanics education, while limiting causal exercise-transfer claims because direct intervention evidence is not established for each movement."
  },
  {
    "id": "golf-19",
    "sportId": "golf",
    "label": "rotational deceleration",
    "movementFamily": "rotational braking",
    "bodyActions": [
      "Pelvis, thorax, arms, and club are slowed after impact while the golfer maintains balance and a controlled finish."
    ],
    "jointActions": [
      "Lead hip/knee/ankle stabilization",
      "trunk rotation deceleration",
      "shoulder horizontal abduction and external rotation."
    ],
    "primeMovers": [
      "Internal/external oblique muscles",
      "gluteus maximus",
      "gluteus medius",
      "hamstrings",
      "adductor magnus."
    ],
    "assistingMuscles": [
      "Posterior deltoid",
      "infraspinatus",
      "teres minor",
      "forearm extensors."
    ],
    "stabilizers": [
      "Multifidus",
      "rotator cuff",
      "foot intrinsics",
      "quadratus lumborum."
    ],
    "contractionRoles": [
      "Eccentric braking dominates, with isometric end-range control and co-contraction across lead side and shoulder."
    ],
    "commonForceOrSkillDemand": "High angular momentum absorption and finish control.",
    "recommendedExercisePatterns": [
      "Deceleration catch",
      "rotational throw-and-stick",
      "unilateral landing",
      "eccentric strength."
    ],
    "recommendedExercises": [
      "Medicine-ball rotational throw",
      "Lateral bound",
      "Bulgarian split squat",
      "Face pull"
    ],
    "transferRationale": "Catch-and-stick and unilateral eccentric work share braking and balance demands; they do not prove protection from injury or improved ball striking.",
    "exerciseSelectionCautions": "Begin with low-speed catches and predictable ranges; avoid maximal rotational catches when fatigued or symptomatic.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9227529/",
      "https://doi.org/10.2165/00007256-200535050-00005",
      "https://doi.org/10.1080/14763141.2012.670662"
    ],
    "sourceSummary": "The records synthesize a peer-reviewed systematic review of golf-swing kinematics, Sports Medicine biomechanics evidence on force production and accuracy, lumbar-load/ground-reaction research, and TPI biomechanics education, while limiting causal exercise-transfer claims because direct intervention evidence is not established for each movement."
  },
  {
    "id": "golf-20",
    "sportId": "golf",
    "label": "single-leg stabilization",
    "movementFamily": "unilateral balance",
    "bodyActions": [
      "Maintain pelvis, knee, ankle, and trunk alignment on one support leg during setup, weight transfer, and recovery."
    ],
    "jointActions": [
      "Hip abduction/external rotation",
      "knee flexion control",
      "ankle dorsiflexion/plantarflexion",
      "trunk anti-lateral-flexion."
    ],
    "primeMovers": [
      "Gluteus medius",
      "gluteus maximus",
      "quadriceps femoris",
      "hamstrings",
      "soleus."
    ],
    "assistingMuscles": [
      "Adductor magnus",
      "gastrocnemius",
      "tibialis anterior",
      "deep hip rotators."
    ],
    "stabilizers": [
      "Foot intrinsics",
      "peroneal muscles",
      "transversus abdominis",
      "multifidus",
      "quadratus lumborum."
    ],
    "contractionRoles": [
      "Mostly isometric alignment with eccentric corrections and concentric recovery from perturbation."
    ],
    "commonForceOrSkillDemand": "Single-leg balance, force acceptance, and postural consistency.",
    "recommendedExercisePatterns": [
      "Single-leg hinge",
      "step-down",
      "split squat",
      "carry",
      "reach and stick."
    ],
    "recommendedExercises": [
      "Single-leg Romanian deadlift",
      "Step-down",
      "Suitcase carry",
      "Bulgarian split squat"
    ],
    "transferRationale": "These exercises train unilateral hip, knee, ankle, and trunk control that overlaps a stable golf base, though balance skill remains task-specific.",
    "exerciseSelectionCautions": "Use external support initially; prioritize knee-over-foot alignment and avoid unstable-surface progressions that obscure force production.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9227529/",
      "https://doi.org/10.2165/00007256-200535050-00005"
    ],
    "sourceSummary": "The records synthesize a peer-reviewed systematic review of golf-swing kinematics, Sports Medicine biomechanics evidence on force production and accuracy, lumbar-load/ground-reaction research, and TPI biomechanics education, while limiting causal exercise-transfer claims because direct intervention evidence is not established for each movement."
  },
  {
    "id": "gymnastics-1",
    "sportId": "gymnastics",
    "label": "handstand",
    "movementFamily": "inverted straight-arm support",
    "bodyActions": [
      "Body inverted over hands with stacked trunk and active shoulder elevation."
    ],
    "jointActions": [
      "Wrist extension",
      "shoulder flexion",
      "scapular upward rotation/elevation",
      "elbow extension."
    ],
    "primeMovers": [
      "Anterior deltoid",
      "serratus anterior",
      "triceps brachii."
    ],
    "assistingMuscles": [
      "Upper trapezius",
      "pectoralis major",
      "rotator cuff."
    ],
    "stabilizers": [
      "Wrist and finger flexors",
      "obliques",
      "gluteus maximus",
      "quadriceps."
    ],
    "contractionRoles": [
      "Isometric shoulder/elbow support with active scapular elevation and wrist co-contraction."
    ],
    "commonForceOrSkillDemand": "High straight-arm compression, balance, and overhead line control.",
    "recommendedExercisePatterns": [
      "pike push-up",
      "wall handstand hold",
      "scapular push-up",
      "hollow-body hold"
    ],
    "recommendedExercises": [
      "pike push-up",
      "wall handstand hold",
      "scapular push-up",
      "hollow-body hold"
    ],
    "transferRationale": "These patterns share overhead support, scapular elevation, trunk stiffness, and balance, but not the full inverted skill.",
    "exerciseSelectionCautions": "Use wall or box progressions; avoid fatigue-driven lumbar extension and painful wrist loading.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10153482/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12179790/",
      "https://www.orthoinfo.org/staying-healthy/gymnastics-injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed gymnastics biomechanics and landing reviews plus AAOS gymnastics injury-prevention guidance, while marking complex skill-to-exercise transfer as moderate or limited because direct causal performance evidence is sparse."
  },
  {
    "id": "gymnastics-2",
    "sportId": "gymnastics",
    "label": "handstand push",
    "movementFamily": "inverted pressing",
    "bodyActions": [
      "Lowering and pressing the body vertically while inverted."
    ],
    "jointActions": [
      "Elbow flexion/extension",
      "shoulder flexion/extension",
      "scapular elevation/upward rotation."
    ],
    "primeMovers": [
      "Triceps brachii",
      "anterior deltoid",
      "serratus anterior."
    ],
    "assistingMuscles": [
      "Pectoralis major",
      "upper trapezius",
      "rotator cuff."
    ],
    "stabilizers": [
      "Wrist flexors/extensors",
      "trunk",
      "gluteus maximus."
    ],
    "contractionRoles": [
      "Eccentric descent, concentric press, and isometric lockout."
    ],
    "commonForceOrSkillDemand": "High overhead pressing strength with strict line control.",
    "recommendedExercisePatterns": [
      "overhead press",
      "pike push-up",
      "wall handstand hold",
      "triceps extension"
    ],
    "recommendedExercises": [
      "overhead press",
      "pike push-up",
      "wall handstand hold",
      "triceps extension"
    ],
    "transferRationale": "Pressing and overhead-support patterns overlap with force direction and scapular demands, not apparatus timing.",
    "exerciseSelectionCautions": "Scale range and load; protect wrists and shoulders; no claim of skill transfer without coaching.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10153482/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12179790/",
      "https://www.orthoinfo.org/staying-healthy/gymnastics-injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed gymnastics biomechanics and landing reviews plus AAOS gymnastics injury-prevention guidance, while marking complex skill-to-exercise transfer as moderate or limited because direct causal performance evidence is sparse."
  },
  {
    "id": "gymnastics-3",
    "sportId": "gymnastics",
    "label": "planche",
    "movementFamily": "straight-arm horizontal support",
    "bodyActions": [
      "Body held nearly horizontal with shoulders protracted and feet off the floor."
    ],
    "jointActions": [
      "Shoulder flexion",
      "scapular protraction",
      "elbow extension",
      "wrist extension."
    ],
    "primeMovers": [
      "Anterior deltoid",
      "pectoralis major",
      "triceps brachii."
    ],
    "assistingMuscles": [
      "Serratus anterior",
      "latissimus dorsi",
      "rectus abdominis."
    ],
    "stabilizers": [
      "Wrist flexors",
      "rotator cuff",
      "gluteus maximus",
      "quadriceps."
    ],
    "contractionRoles": [
      "Isometric straight-arm support with trunk and hip anti-extension."
    ],
    "commonForceOrSkillDemand": "Very high straight-arm shoulder torque and whole-body rigidity.",
    "recommendedExercisePatterns": [
      "planche lean",
      "pseudo-planche push-up",
      "scapular push-up",
      "hollow-body hold"
    ],
    "recommendedExercises": [
      "planche lean",
      "pseudo-planche push-up",
      "scapular push-up",
      "hollow-body hold"
    ],
    "transferRationale": "Leans and protraction drills reproduce shoulder-angle and trunk-bracing demands without reproducing planche balance.",
    "exerciseSelectionCautions": "Progress gradually; straight-arm loading can aggravate wrists, elbows, or anterior shoulders.",
    "evidenceConfidence": "limited",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10153482/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12179790/",
      "https://www.orthoinfo.org/staying-healthy/gymnastics-injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed gymnastics biomechanics and landing reviews plus AAOS gymnastics injury-prevention guidance, while marking complex skill-to-exercise transfer as moderate or limited because direct causal performance evidence is sparse."
  },
  {
    "id": "gymnastics-4",
    "sportId": "gymnastics",
    "label": "front lever",
    "movementFamily": "straight-arm horizontal pull/support",
    "bodyActions": [
      "Suspended body held horizontal with shoulders extended and trunk rigid."
    ],
    "jointActions": [
      "Shoulder extension",
      "scapular depression",
      "elbow extension",
      "hip extension."
    ],
    "primeMovers": [
      "Latissimus dorsi",
      "teres major",
      "long head of triceps brachii."
    ],
    "assistingMuscles": [
      "Posterior deltoid",
      "pectoralis major",
      "rectus abdominis."
    ],
    "stabilizers": [
      "Rotator cuff",
      "serratus anterior",
      "gluteus maximus",
      "wrist flexors."
    ],
    "contractionRoles": [
      "Isometric straight-arm shoulder extension and anti-extension trunk control."
    ],
    "commonForceOrSkillDemand": "High shoulder-extension torque and bodyline stiffness.",
    "recommendedExercisePatterns": [
      "front lever tuck hold",
      "straight-arm pulldown",
      "scapular pull-up",
      "hollow-body hold"
    ],
    "recommendedExercises": [
      "front lever tuck hold",
      "straight-arm pulldown",
      "scapular pull-up",
      "hollow-body hold"
    ],
    "transferRationale": "These exercises address shoulder extension, scapular depression, and bodyline control; they do not establish direct lever-skill improvement.",
    "exerciseSelectionCautions": "Use tuck/regressed levers; avoid swinging and anterior shoulder pain.",
    "evidenceConfidence": "limited",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10153482/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12179790/",
      "https://www.orthoinfo.org/staying-healthy/gymnastics-injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed gymnastics biomechanics and landing reviews plus AAOS gymnastics injury-prevention guidance, while marking complex skill-to-exercise transfer as moderate or limited because direct causal performance evidence is sparse."
  },
  {
    "id": "gymnastics-5",
    "sportId": "gymnastics",
    "label": "back lever",
    "movementFamily": "straight-arm horizontal support",
    "bodyActions": [
      "Suspended prone bodyline supported below rings or bar."
    ],
    "jointActions": [
      "Shoulder extension",
      "scapular retraction/depression",
      "elbow extension",
      "hip extension."
    ],
    "primeMovers": [
      "Pectoralis major",
      "latissimus dorsi",
      "posterior deltoid."
    ],
    "assistingMuscles": [
      "Teres major",
      "long head of triceps brachii",
      "rectus abdominis."
    ],
    "stabilizers": [
      "Rotator cuff",
      "serratus anterior",
      "gluteus maximus",
      "forearm muscles."
    ],
    "contractionRoles": [
      "Isometric straight-arm support with shoulder-extension and trunk control."
    ],
    "commonForceOrSkillDemand": "High passive/active shoulder extension and connective-tissue tolerance.",
    "recommendedExercisePatterns": [
      "back lever tuck hold",
      "straight-arm pulldown",
      "ring support hold",
      "hollow-body hold"
    ],
    "recommendedExercises": [
      "back lever tuck hold",
      "straight-arm pulldown",
      "ring support hold",
      "hollow-body hold"
    ],
    "transferRationale": "Regressed lever and ring-support patterns share straight-arm support and bodyline demands.",
    "exerciseSelectionCautions": "Do not force shoulder extension; use supervised progressions and stop for pain or instability.",
    "evidenceConfidence": "limited",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10153482/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12179790/",
      "https://www.orthoinfo.org/staying-healthy/gymnastics-injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed gymnastics biomechanics and landing reviews plus AAOS gymnastics injury-prevention guidance, while marking complex skill-to-exercise transfer as moderate or limited because direct causal performance evidence is sparse."
  },
  {
    "id": "gymnastics-6",
    "sportId": "gymnastics",
    "label": "muscle-up",
    "movementFamily": "explosive pull-to-push transition",
    "bodyActions": [
      "Powerful pull transitions the torso over a bar or rings into support."
    ],
    "jointActions": [
      "Shoulder adduction/extension then flexion",
      "elbow flexion then extension",
      "scapular depression/protraction."
    ],
    "primeMovers": [
      "Latissimus dorsi",
      "pectoralis major",
      "triceps brachii."
    ],
    "assistingMuscles": [
      "Biceps brachii",
      "posterior/anterior deltoid",
      "serratus anterior."
    ],
    "stabilizers": [
      "Rotator cuff",
      "forearm flexors",
      "abdominals",
      "gluteus maximus."
    ],
    "contractionRoles": [
      "Concentric pull and turnover with rapid eccentric/isometric control at support."
    ],
    "commonForceOrSkillDemand": "High relative pulling power, grip, and coordination.",
    "recommendedExercisePatterns": [
      "pull-up",
      "chest-to-bar pull-up",
      "straight-bar dip",
      "ring support hold"
    ],
    "recommendedExercises": [
      "pull-up",
      "chest-to-bar pull-up",
      "straight-bar dip",
      "ring support hold"
    ],
    "transferRationale": "Pulling plus dip and support patterns cover force components, but transition timing and technical skill require practice.",
    "exerciseSelectionCautions": "Use low rings/bands and strict prerequisites; avoid kipping under shoulder or elbow symptoms.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10153482/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12179790/",
      "https://www.orthoinfo.org/staying-healthy/gymnastics-injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed gymnastics biomechanics and landing reviews plus AAOS gymnastics injury-prevention guidance, while marking complex skill-to-exercise transfer as moderate or limited because direct causal performance evidence is sparse."
  },
  {
    "id": "gymnastics-7",
    "sportId": "gymnastics",
    "label": "ring dip",
    "movementFamily": "unstable straight-arm ring support",
    "bodyActions": [
      "Controlled descent and press between independent rings."
    ],
    "jointActions": [
      "Shoulder extension/flexion",
      "elbow flexion/extension",
      "scapular depression/protraction."
    ],
    "primeMovers": [
      "Pectoralis major",
      "triceps brachii",
      "anterior deltoid."
    ],
    "assistingMuscles": [
      "Latissimus dorsi",
      "serratus anterior",
      "coracobrachialis."
    ],
    "stabilizers": [
      "Rotator cuff",
      "wrist/forearm muscles",
      "trunk."
    ],
    "contractionRoles": [
      "Eccentric lowering, concentric pressing, and isometric ring stabilization."
    ],
    "commonForceOrSkillDemand": "Pressing strength plus high frontal/transverse-plane stability.",
    "recommendedExercisePatterns": [
      "parallel-bar dip",
      "ring support hold",
      "push-up",
      "triceps extension"
    ],
    "recommendedExercises": [
      "parallel-bar dip",
      "ring support hold",
      "push-up",
      "triceps extension"
    ],
    "transferRationale": "Dips reproduce pressing; ring support adds instability and straight-arm stabilization but not full apparatus specificity.",
    "exerciseSelectionCautions": "Limit depth to controlled shoulder range; regress instability for pain or poor scapular control.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10153482/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12179790/",
      "https://www.orthoinfo.org/staying-healthy/gymnastics-injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed gymnastics biomechanics and landing reviews plus AAOS gymnastics injury-prevention guidance, while marking complex skill-to-exercise transfer as moderate or limited because direct causal performance evidence is sparse."
  },
  {
    "id": "gymnastics-8",
    "sportId": "gymnastics",
    "label": "iron cross",
    "movementFamily": "straight-arm ring support",
    "bodyActions": [
      "Arms abducted near horizontal while body is suspended and rings stabilized."
    ],
    "jointActions": [
      "Shoulder adduction torque",
      "elbow extension",
      "scapular depression",
      "wrist stabilization."
    ],
    "primeMovers": [
      "Pectoralis major",
      "latissimus dorsi",
      "teres major."
    ],
    "assistingMuscles": [
      "Anterior deltoid",
      "triceps brachii",
      "coracobrachialis."
    ],
    "stabilizers": [
      "Rotator cuff",
      "serratus anterior",
      "forearm muscles",
      "trunk."
    ],
    "contractionRoles": [
      "Near-maximal isometric straight-arm shoulder adduction and depression."
    ],
    "commonForceOrSkillDemand": "Extreme shoulder torque and tendon/connective-tissue demand.",
    "recommendedExercisePatterns": [
      "ring support hold",
      "cable straight-arm pulldown",
      "isometric chest fly",
      "scapular depression"
    ],
    "recommendedExercises": [
      "ring support hold",
      "cable straight-arm pulldown",
      "isometric chest fly",
      "scapular depression"
    ],
    "transferRationale": "Assistance exercises develop relevant adduction/depression and support control, but evidence for direct cross transfer is limited.",
    "exerciseSelectionCautions": "Use very conservative assisted progressions; never substitute heavy fly loading for coached ring preparation.",
    "evidenceConfidence": "limited",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10153482/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12179790/",
      "https://www.orthoinfo.org/staying-healthy/gymnastics-injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed gymnastics biomechanics and landing reviews plus AAOS gymnastics injury-prevention guidance, while marking complex skill-to-exercise transfer as moderate or limited because direct causal performance evidence is sparse."
  },
  {
    "id": "gymnastics-9",
    "sportId": "gymnastics",
    "label": "L-sit",
    "movementFamily": "compression and seated support hold",
    "bodyActions": [
      "Hands support the body while hips flex and legs extend horizontally."
    ],
    "jointActions": [
      "Shoulder depression",
      "elbow extension",
      "hip flexion",
      "knee extension."
    ],
    "primeMovers": [
      "Iliopsoas",
      "rectus femoris",
      "rectus abdominis",
      "triceps brachii."
    ],
    "assistingMuscles": [
      "Pectineus",
      "sartorius",
      "quadriceps",
      "serratus anterior."
    ],
    "stabilizers": [
      "Scapular depressors",
      "wrist/hand muscles",
      "obliques."
    ],
    "contractionRoles": [
      "Isometric hip-flexor compression and straight-arm support."
    ],
    "commonForceOrSkillDemand": "High active hip flexion, compression, and shoulder depression.",
    "recommendedExercisePatterns": [
      "parallel-bar support hold",
      "seated leg lift",
      "hanging knee raise",
      "compression lift"
    ],
    "recommendedExercises": [
      "parallel-bar support hold",
      "seated leg lift",
      "hanging knee raise",
      "compression lift"
    ],
    "transferRationale": "These patterns share hip-flexor compression and support strength; exact lever and balance remain skill-specific.",
    "exerciseSelectionCautions": "Avoid lumbar rounding compensation and anterior hip pain; regress with bent knees.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10153482/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12179790/",
      "https://www.orthoinfo.org/staying-healthy/gymnastics-injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed gymnastics biomechanics and landing reviews plus AAOS gymnastics injury-prevention guidance, while marking complex skill-to-exercise transfer as moderate or limited because direct causal performance evidence is sparse."
  },
  {
    "id": "gymnastics-10",
    "sportId": "gymnastics",
    "label": "V-sit",
    "movementFamily": "compression and elevated seated support",
    "bodyActions": [
      "Supported body with hips deeply flexed and legs elevated above horizontal."
    ],
    "jointActions": [
      "Shoulder depression",
      "elbow extension",
      "hip flexion",
      "knee extension."
    ],
    "primeMovers": [
      "Iliopsoas",
      "rectus femoris",
      "rectus abdominis",
      "triceps brachii."
    ],
    "assistingMuscles": [
      "Sartorius",
      "pectineus",
      "quadriceps",
      "serratus anterior."
    ],
    "stabilizers": [
      "Wrist/hand muscles",
      "obliques",
      "scapular depressors."
    ],
    "contractionRoles": [
      "Isometric high-range compression and support."
    ],
    "commonForceOrSkillDemand": "Greater hip-flexion range and compression strength than an L-sit.",
    "recommendedExercisePatterns": [
      "L-sit hold",
      "seated leg lift",
      "compression lift",
      "parallel-bar support hold"
    ],
    "recommendedExercises": [
      "L-sit hold",
      "seated leg lift",
      "compression lift",
      "parallel-bar support hold"
    ],
    "transferRationale": "L-sit and compression patterns share the active range and support demands, but V-sit requires greater mobility and balance.",
    "exerciseSelectionCautions": "Do not chase range with spinal collapse; modify for hamstring, hip, or wrist limitations.",
    "evidenceConfidence": "limited",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10153482/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12179790/",
      "https://www.orthoinfo.org/staying-healthy/gymnastics-injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed gymnastics biomechanics and landing reviews plus AAOS gymnastics injury-prevention guidance, while marking complex skill-to-exercise transfer as moderate or limited because direct causal performance evidence is sparse."
  },
  {
    "id": "gymnastics-11",
    "sportId": "gymnastics",
    "label": "hollow-body hold",
    "movementFamily": "hollow/arch body-shape isometric",
    "bodyActions": [
      "Supine posterior pelvic tilt with shoulders and legs lifted in a rounded bodyline."
    ],
    "jointActions": [
      "Spinal flexion/anti-extension",
      "shoulder flexion",
      "hip flexion",
      "knee extension."
    ],
    "primeMovers": [
      "Rectus abdominis",
      "iliopsoas",
      "rectus femoris."
    ],
    "assistingMuscles": [
      "External/internal obliques",
      "serratus anterior",
      "pectoralis major."
    ],
    "stabilizers": [
      "Gluteus maximus",
      "quadriceps",
      "deep spinal stabilizers."
    ],
    "contractionRoles": [
      "Isometric anti-extension with controlled posterior pelvic tilt."
    ],
    "commonForceOrSkillDemand": "Bodyline stiffness and force transmission during tumbling and support.",
    "recommendedExercisePatterns": [
      "dead bug",
      "hollow rock",
      "reverse crunch",
      "plank"
    ],
    "recommendedExercises": [
      "dead bug",
      "hollow rock",
      "reverse crunch",
      "plank"
    ],
    "transferRationale": "These drills develop trunk anti-extension and body-shape awareness shared across skills, without proving better tumbling.",
    "exerciseSelectionCautions": "Keep ribs and pelvis controlled; regress lever length if lumbar extension appears.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10153482/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12179790/",
      "https://www.orthoinfo.org/staying-healthy/gymnastics-injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed gymnastics biomechanics and landing reviews plus AAOS gymnastics injury-prevention guidance, while marking complex skill-to-exercise transfer as moderate or limited because direct causal performance evidence is sparse."
  },
  {
    "id": "gymnastics-12",
    "sportId": "gymnastics",
    "label": "arch-body hold",
    "movementFamily": "hollow/arch body-shape isometric",
    "bodyActions": [
      "Prone bodyline uses spinal and hip extension with shoulders and legs elevated."
    ],
    "jointActions": [
      "Spinal extension",
      "shoulder flexion",
      "hip extension",
      "knee extension."
    ],
    "primeMovers": [
      "Erector spinae",
      "gluteus maximus",
      "posterior deltoid."
    ],
    "assistingMuscles": [
      "Hamstrings",
      "latissimus dorsi",
      "trapezius."
    ],
    "stabilizers": [
      "Rotator cuff",
      "multifidus",
      "obliques",
      "foot muscles."
    ],
    "contractionRoles": [
      "Isometric posterior-chain and shoulder-extension control."
    ],
    "commonForceOrSkillDemand": "Arch-shape stiffness and aerial bodyline control.",
    "recommendedExercisePatterns": [
      "back extension",
      "prone Y raise",
      "superman hold",
      "bird dog"
    ],
    "recommendedExercises": [
      "back extension",
      "prone Y raise",
      "superman hold",
      "bird dog"
    ],
    "transferRationale": "Posterior-chain and scapular endurance overlap with arch shaping, but aerial orientation and timing remain technical.",
    "exerciseSelectionCautions": "Avoid compressive lumbar hyperextension; use short holds and neutral neck.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10153482/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12179790/",
      "https://www.orthoinfo.org/staying-healthy/gymnastics-injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed gymnastics biomechanics and landing reviews plus AAOS gymnastics injury-prevention guidance, while marking complex skill-to-exercise transfer as moderate or limited because direct causal performance evidence is sparse."
  },
  {
    "id": "gymnastics-13",
    "sportId": "gymnastics",
    "label": "rope climb",
    "movementFamily": "vertical pulling and rope climbing",
    "bodyActions": [
      "Repeated hand-over-hand pulling with leg clamp, hip flexion, and standing-up actions."
    ],
    "jointActions": [
      "Shoulder adduction/extension",
      "elbow flexion",
      "hip/knee flexion-extension",
      "grip."
    ],
    "primeMovers": [
      "Latissimus dorsi",
      "biceps brachii",
      "brachialis",
      "forearm flexors."
    ],
    "assistingMuscles": [
      "Teres major",
      "posterior deltoid",
      "pectoralis major",
      "quadriceps."
    ],
    "stabilizers": [
      "Rotator cuff",
      "abdominals",
      "adductors",
      "gluteus maximus."
    ],
    "contractionRoles": [
      "Repeated concentric pulls with isometric grip and eccentric lowering."
    ],
    "commonForceOrSkillDemand": "Relative pulling strength, grip endurance, and whole-body coordination.",
    "recommendedExercisePatterns": [
      "rope climb",
      "towel pull-up",
      "pull-up",
      "farmer carry"
    ],
    "recommendedExercises": [
      "rope climb",
      "towel pull-up",
      "pull-up",
      "farmer carry"
    ],
    "transferRationale": "Pulling and grip exercises share vertical force and hand endurance, while foot locks and rope technique must be learned directly.",
    "exerciseSelectionCautions": "Use secure rope and qualified supervision; control descent to reduce elbow/shoulder overload.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10153482/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12179790/",
      "https://www.orthoinfo.org/staying-healthy/gymnastics-injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed gymnastics biomechanics and landing reviews plus AAOS gymnastics injury-prevention guidance, while marking complex skill-to-exercise transfer as moderate or limited because direct causal performance evidence is sparse."
  },
  {
    "id": "gymnastics-14",
    "sportId": "gymnastics",
    "label": "pull-up",
    "movementFamily": "vertical pulling",
    "bodyActions": [
      "Hanging body is raised by pulling the upper arms toward the torso."
    ],
    "jointActions": [
      "Shoulder adduction/extension",
      "elbow flexion",
      "scapular depression."
    ],
    "primeMovers": [
      "Latissimus dorsi",
      "biceps brachii",
      "brachialis."
    ],
    "assistingMuscles": [
      "Teres major",
      "posterior deltoid",
      "pectoralis major."
    ],
    "stabilizers": [
      "Rotator cuff",
      "lower trapezius",
      "forearm flexors",
      "trunk."
    ],
    "contractionRoles": [
      "Concentric ascent, isometric top control, eccentric descent."
    ],
    "commonForceOrSkillDemand": "High relative pulling strength and grip control.",
    "recommendedExercisePatterns": [
      "pull-up",
      "lat pulldown",
      "scapular pull-up",
      "eccentric pull-up"
    ],
    "recommendedExercises": [
      "pull-up",
      "lat pulldown",
      "scapular pull-up",
      "eccentric pull-up"
    ],
    "transferRationale": "These patterns share the principal joint actions and scapular control relevant to suspended pulling.",
    "exerciseSelectionCautions": "Avoid kipping until strict control exists; adjust grip and range for shoulder symptoms.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10153482/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12179790/",
      "https://www.orthoinfo.org/staying-healthy/gymnastics-injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed gymnastics biomechanics and landing reviews plus AAOS gymnastics injury-prevention guidance, while marking complex skill-to-exercise transfer as moderate or limited because direct causal performance evidence is sparse."
  },
  {
    "id": "gymnastics-15",
    "sportId": "gymnastics",
    "label": "press-to-handstand",
    "movementFamily": "inverted pressing and compression",
    "bodyActions": [
      "From pike/straddle, shoulders elevate while hips compress and body rises to handstand."
    ],
    "jointActions": [
      "Shoulder flexion/elevation",
      "elbow extension",
      "hip flexion then extension",
      "wrist extension."
    ],
    "primeMovers": [
      "Anterior deltoid",
      "serratus anterior",
      "triceps brachii",
      "iliopsoas."
    ],
    "assistingMuscles": [
      "Upper trapezius",
      "rectus femoris",
      "rectus abdominis",
      "pectoralis major."
    ],
    "stabilizers": [
      "Wrist/forearm muscles",
      "rotator cuff",
      "gluteus maximus",
      "obliques."
    ],
    "contractionRoles": [
      "Eccentric initiation, concentric press, and isometric handstand lockout."
    ],
    "commonForceOrSkillDemand": "High compression, overhead support, and precise center-of-mass control.",
    "recommendedExercisePatterns": [
      "pike press",
      "seated leg lift",
      "wall handstand hold",
      "negative handstand press"
    ],
    "recommendedExercises": [
      "pike press",
      "seated leg lift",
      "wall handstand hold",
      "negative handstand press"
    ],
    "transferRationale": "Press and compression patterns reproduce components of the action; skill-specific balance and mobility need direct practice.",
    "exerciseSelectionCautions": "Use boxes and straddle regressions; stop if wrists or shoulders cannot tolerate loading.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10153482/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12179790/",
      "https://www.orthoinfo.org/staying-healthy/gymnastics-injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed gymnastics biomechanics and landing reviews plus AAOS gymnastics injury-prevention guidance, while marking complex skill-to-exercise transfer as moderate or limited because direct causal performance evidence is sparse."
  },
  {
    "id": "gymnastics-16",
    "sportId": "gymnastics",
    "label": "tumbling takeoff",
    "movementFamily": "sprint-to-rebound propulsion",
    "bodyActions": [
      "Run and hurdle transition into rapid lower-limb extension and stiff floor rebound."
    ],
    "jointActions": [
      "Ankle plantarflexion",
      "knee extension",
      "hip extension",
      "shoulder flexion",
      "trunk stabilization."
    ],
    "primeMovers": [
      "Gluteus maximus",
      "quadriceps",
      "gastrocnemius",
      "soleus."
    ],
    "assistingMuscles": [
      "Hamstrings",
      "rectus femoris",
      "anterior deltoid",
      "plantar intrinsics."
    ],
    "stabilizers": [
      "Foot/ankle stabilizers",
      "gluteus medius",
      "trunk",
      "scapular stabilizers."
    ],
    "contractionRoles": [
      "Eccentric countermovement then explosive concentric triple extension with brief contact isometry."
    ],
    "commonForceOrSkillDemand": "High rate of force development, elastic stiffness, and precise contact timing.",
    "recommendedExercisePatterns": [
      "sprint",
      "countermovement jump",
      "pogo jump",
      "snap-down"
    ],
    "recommendedExercises": [
      "sprint",
      "countermovement jump",
      "pogo jump",
      "snap-down"
    ],
    "transferRationale": "Jump and sprint patterns share propulsion and contact qualities; they do not establish safer or better tumbling by themselves.",
    "exerciseSelectionCautions": "Keep volume low and landings coached; surface, fatigue, and prior injury matter.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10153482/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12179790/",
      "https://www.orthoinfo.org/staying-healthy/gymnastics-injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed gymnastics biomechanics and landing reviews plus AAOS gymnastics injury-prevention guidance, while marking complex skill-to-exercise transfer as moderate or limited because direct causal performance evidence is sparse."
  },
  {
    "id": "gymnastics-17",
    "sportId": "gymnastics",
    "label": "backflip",
    "movementFamily": "backward aerial rotation",
    "bodyActions": [
      "Explosive takeoff creates vertical impulse and backward angular momentum, followed by shape change and landing opening."
    ],
    "jointActions": [
      "Hip/knee/ankle extension",
      "trunk flexion-extension",
      "shoulder flexion/extension."
    ],
    "primeMovers": [
      "Gluteus maximus",
      "quadriceps",
      "gastrocnemius",
      "soleus."
    ],
    "assistingMuscles": [
      "Rectus abdominis",
      "iliopsoas",
      "hamstrings",
      "deltoids."
    ],
    "stabilizers": [
      "Trunk",
      "gluteus medius",
      "foot/ankle",
      "visual-vestibular systems."
    ],
    "contractionRoles": [
      "Concentric takeoff, isometric tuck/shape, active opening, eccentric landing absorption."
    ],
    "commonForceOrSkillDemand": "Vertical impulse, angular-momentum control, spatial orientation, and landing braking.",
    "recommendedExercisePatterns": [
      "countermovement jump",
      "hollow-body hold",
      "arch-body hold",
      "drop landing"
    ],
    "recommendedExercises": [
      "countermovement jump",
      "hollow-body hold",
      "arch-body hold",
      "drop landing"
    ],
    "transferRationale": "These drills target impulse, body shapes, and landing absorption, but the aerial skill requires supervised progressions.",
    "exerciseSelectionCautions": "Never self-teach from a flat surface; use qualified coach, appropriate apparatus, and progressions.",
    "evidenceConfidence": "limited",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10153482/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12179790/",
      "https://www.orthoinfo.org/staying-healthy/gymnastics-injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed gymnastics biomechanics and landing reviews plus AAOS gymnastics injury-prevention guidance, while marking complex skill-to-exercise transfer as moderate or limited because direct causal performance evidence is sparse."
  },
  {
    "id": "gymnastics-18",
    "sportId": "gymnastics",
    "label": "front flip",
    "movementFamily": "forward aerial rotation",
    "bodyActions": [
      "Forward takeoff and rotation use trunk/hip flexion before active opening for landing."
    ],
    "jointActions": [
      "Hip/knee/ankle extension",
      "trunk and hip flexion",
      "shoulder flexion",
      "knee extension."
    ],
    "primeMovers": [
      "Gluteus maximus",
      "quadriceps",
      "gastrocnemius",
      "soleus."
    ],
    "assistingMuscles": [
      "Rectus abdominis",
      "iliopsoas",
      "hamstrings",
      "anterior deltoid."
    ],
    "stabilizers": [
      "Trunk",
      "gluteus medius",
      "foot/ankle",
      "visual-vestibular systems."
    ],
    "contractionRoles": [
      "Concentric takeoff, flexion/shape control, active opening, eccentric landing."
    ],
    "commonForceOrSkillDemand": "Horizontal-to-vertical conversion, angular control, and landing timing.",
    "recommendedExercisePatterns": [
      "hurdle jump",
      "hollow-body hold",
      "snap-down",
      "drop landing"
    ],
    "recommendedExercises": [
      "hurdle jump",
      "hollow-body hold",
      "snap-down",
      "drop landing"
    ],
    "transferRationale": "Jump, bodyline, and landing drills overlap with components, not the complete forward-rotation skill.",
    "exerciseSelectionCautions": "Require qualified supervision and appropriate pit/trampoline progressions; avoid fatigue practice.",
    "evidenceConfidence": "limited",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10153482/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12179790/",
      "https://www.orthoinfo.org/staying-healthy/gymnastics-injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed gymnastics biomechanics and landing reviews plus AAOS gymnastics injury-prevention guidance, while marking complex skill-to-exercise transfer as moderate or limited because direct causal performance evidence is sparse."
  },
  {
    "id": "gymnastics-19",
    "sportId": "gymnastics",
    "label": "vault takeoff",
    "movementFamily": "sprint-to-board rebound and shoulder block",
    "bodyActions": [
      "High-speed approach contacts board, rebounds through legs, then transfers force through extended shoulders onto table."
    ],
    "jointActions": [
      "Ankle plantarflexion",
      "knee/hip extension",
      "shoulder flexion",
      "elbow extension",
      "scapular protraction."
    ],
    "primeMovers": [
      "Gluteus maximus",
      "quadriceps",
      "gastrocnemius",
      "soleus",
      "serratus anterior."
    ],
    "assistingMuscles": [
      "Hamstrings",
      "anterior deltoid",
      "triceps brachii",
      "pectoralis major."
    ],
    "stabilizers": [
      "Foot/ankle",
      "trunk",
      "rotator cuff",
      "wrists",
      "scapular stabilizers."
    ],
    "contractionRoles": [
      "Approach eccentric loading, explosive rebound, and brief isometric shoulder block."
    ],
    "commonForceOrSkillDemand": "High approach velocity, rapid force transfer, stiff contact, and overhead support.",
    "recommendedExercisePatterns": [
      "sprint",
      "hurdle jump",
      "plyometric push-up",
      "handstand snap-down"
    ],
    "recommendedExercises": [
      "sprint",
      "hurdle jump",
      "plyometric push-up",
      "handstand snap-down"
    ],
    "transferRationale": "Sprint/plyometric and overhead-block patterns share force transfer, but board/table timing is apparatus-specific.",
    "exerciseSelectionCautions": "Progress impact and volume cautiously; use coach, correct board distance, and wrist/shoulder screening.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10153482/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12179790/",
      "https://www.orthoinfo.org/staying-healthy/gymnastics-injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed gymnastics biomechanics and landing reviews plus AAOS gymnastics injury-prevention guidance, while marking complex skill-to-exercise transfer as moderate or limited because direct causal performance evidence is sparse."
  },
  {
    "id": "gymnastics-20",
    "sportId": "gymnastics",
    "label": "landing stabilization",
    "movementFamily": "landing absorption and postural control",
    "bodyActions": [
      "After aerial flight, the body accepts ground contact with coordinated flexion and recovers a stable posture."
    ],
    "jointActions": [
      "Ankle dorsiflexion/plantarflexion",
      "knee flexion/extension",
      "hip flexion/extension",
      "trunk control."
    ],
    "primeMovers": [
      "Quadriceps",
      "gluteus maximus",
      "soleus",
      "gastrocnemius."
    ],
    "assistingMuscles": [
      "Hamstrings",
      "gluteus medius",
      "adductors",
      "erector spinae."
    ],
    "stabilizers": [
      "Foot intrinsics",
      "ankle stabilizers",
      "trunk",
      "visual-vestibular systems."
    ],
    "contractionRoles": [
      "Eccentric absorption followed by isometric braking and concentric balance recovery."
    ],
    "commonForceOrSkillDemand": "Large impact forces, alignment, balance, and repeatability under fatigue.",
    "recommendedExercisePatterns": [
      "snap-down",
      "drop landing",
      "single-leg squat-to-stick",
      "step-down"
    ],
    "recommendedExercises": [
      "snap-down",
      "drop landing",
      "single-leg squat-to-stick",
      "step-down"
    ],
    "transferRationale": "Progressive landing drills share braking and alignment demands; they cannot guarantee injury prevention or competition transfer.",
    "exerciseSelectionCautions": "Use appropriate height/surface and quiet aligned contacts; stop for pain or loss of control.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC10153482/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12179790/",
      "https://www.orthoinfo.org/staying-healthy/gymnastics-injury-prevention"
    ],
    "sourceSummary": "The enrichment uses peer-reviewed gymnastics biomechanics and landing reviews plus AAOS gymnastics injury-prevention guidance, while marking complex skill-to-exercise transfer as moderate or limited because direct causal performance evidence is sparse."
  },
  {
    "id": "rowing-1",
    "sportId": "rowing",
    "label": "catch position",
    "movementFamily": "repeatable end-range preparation with stable foot pressure and torso control",
    "bodyActions": [
      "compressed bilateral setup",
      "forward trunk inclination and extended arms"
    ],
    "jointActions": [
      "hip and knee flexion",
      "ankle dorsiflexion",
      "shoulder flexion/protraction"
    ],
    "primeMovers": [
      "quadriceps, gluteus maximus, hamstrings"
    ],
    "assistingMuscles": [
      "iliacus, psoas major, tibialis anterior, serratus anterior"
    ],
    "stabilizers": [
      "multifidus, transversus abdominis, rotator cuff, intrinsic foot muscles"
    ],
    "contractionRoles": [
      "mostly isometric positioning",
      "eccentric control by hip/knee extensors and trunk extensors"
    ],
    "commonForceOrSkillDemand": "repeatable end-range preparation with stable foot pressure and torso control",
    "recommendedExercisePatterns": [
      "bilateral squat, front squat, Romanian deadlift, seated cable row"
    ],
    "recommendedExercises": [
      "Front squat",
      "Romanian deadlift",
      "seated cable row"
    ],
    "transferRationale": "The catch shares deep lower-limb flexion, forward hip position, extended-arm reach, and braced force-transfer demands; it is a mechanical preparation analogue, not a technical substitute.",
    "exerciseSelectionCautions": "Avoid forcing lumbar flexion or excessive slide length; use a controlled pause and load only within comfortable hip, ankle, and shoulder range.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://www.britishrowing.org/indoor-rowing/go-row-indoor/how-to-indoor-row/british-rowing-technique/",
      "https://www.concept2.com/training/rowing-technique",
      "https://pubmed.ncbi.nlm.nih.gov/21510717/"
    ],
    "sourceSummary": "The records synthesize British Rowing and Concept2 technique guidance with peer-reviewed rowing biomechanics, muscle-activity, injury-risk, and strength-testing literature; evidence is strongest for stroke sequencing and joint-action descriptions, while gym-transfer rationales remain mechanical heuristics rather than proof of causal performance improvement."
  },
  {
    "id": "rowing-2",
    "sportId": "rowing",
    "label": "leg drive",
    "movementFamily": "high bilateral force application early in the drive",
    "bodyActions": [
      "bilateral push from the foot stretcher with trunk held organized"
    ],
    "jointActions": [
      "knee extension",
      "hip extension",
      "ankle plantarflexion"
    ],
    "primeMovers": [
      "quadriceps, gluteus maximus, hamstrings"
    ],
    "assistingMuscles": [
      "soleus, gastrocnemius, adductor magnus"
    ],
    "stabilizers": [
      "transversus abdominis, spinal erectors, gluteus medius, intrinsic foot muscles"
    ],
    "contractionRoles": [
      "concentric propulsion with near-isometric trunk transfer and eccentric reset"
    ],
    "commonForceOrSkillDemand": "high bilateral force application early in the drive",
    "recommendedExercisePatterns": [
      "front squat, leg press, sled push, Romanian deadlift"
    ],
    "recommendedExercises": [
      "Front squat",
      "leg press",
      "sled push",
      "Romanian deadlift"
    ],
    "transferRationale": "These exercises overlap the bilateral lower-body force vector and proximal-to-distal drive sequence, while the rower still requires stroke-specific timing.",
    "exerciseSelectionCautions": "Do not turn the drive into an early arm pull or allow knees to collapse; avoid maximal loading when technique or back position deteriorates.",
    "evidenceConfidence": "high",
    "sources": [
      "https://www.britishrowing.org/indoor-rowing/go-row-indoor/how-to-indoor-row/british-rowing-technique/",
      "https://www.concept2.com/training/rowing-technique",
      "https://pubmed.ncbi.nlm.nih.gov/21510717/"
    ],
    "sourceSummary": "The records synthesize British Rowing and Concept2 technique guidance with peer-reviewed rowing biomechanics, muscle-activity, injury-risk, and strength-testing literature; evidence is strongest for stroke sequencing and joint-action descriptions, while gym-transfer rationales remain mechanical heuristics rather than proof of causal performance improvement."
  },
  {
    "id": "rowing-3",
    "sportId": "rowing",
    "label": "hip swing",
    "movementFamily": "sequenced hip-driven transfer without lumbar overextension",
    "bodyActions": [
      "torso opens after the legs, using the pelvis as the hinge"
    ],
    "jointActions": [
      "hip extension",
      "controlled trunk extension",
      "shoulder position maintained"
    ],
    "primeMovers": [
      "gluteus maximus, hamstrings, adductor magnus"
    ],
    "assistingMuscles": [
      "erector spinae, posterior deltoid, latissimus dorsi"
    ],
    "stabilizers": [
      "transversus abdominis, internal and external obliques, gluteus medius"
    ],
    "contractionRoles": [
      "concentric hip extension and trunk-angle change followed by eccentric recovery"
    ],
    "commonForceOrSkillDemand": "sequenced hip-driven transfer without lumbar overextension",
    "recommendedExercisePatterns": [
      "Romanian deadlift, hip thrust, cable pull-through, back extension"
    ],
    "recommendedExercises": [
      "Romanian deadlift",
      "hip thrust",
      "cable pull-through",
      "back extension"
    ],
    "transferRationale": "Hinge patterns train hip extension while demanding a rigid torso; the rationale is shared joint action and sequencing rather than proof of improved rowing performance.",
    "exerciseSelectionCautions": "Keep motion at the hips and stop before lumbar hyperextension; back-extension loading should be conservative for athletes with back symptoms.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://www.britishrowing.org/indoor-rowing/go-row-indoor/how-to-indoor-row/british-rowing-technique/",
      "https://www.concept2.com/training/rowing-technique",
      "https://pubmed.ncbi.nlm.nih.gov/21510717/"
    ],
    "sourceSummary": "The records synthesize British Rowing and Concept2 technique guidance with peer-reviewed rowing biomechanics, muscle-activity, injury-risk, and strength-testing literature; evidence is strongest for stroke sequencing and joint-action descriptions, while gym-transfer rationales remain mechanical heuristics rather than proof of causal performance improvement."
  },
  {
    "id": "rowing-4",
    "sportId": "rowing",
    "label": "arm pull",
    "movementFamily": "repeated horizontal pulling with coordinated shoulder and elbow action",
    "bodyActions": [
      "handle is drawn toward the lower ribs after leg and trunk acceleration"
    ],
    "jointActions": [
      "shoulder extension/adduction",
      "elbow flexion",
      "scapular retraction"
    ],
    "primeMovers": [
      "latissimus dorsi, biceps brachii, brachialis, posterior deltoid"
    ],
    "assistingMuscles": [
      "teres major, brachioradialis, middle trapezius, rhomboid major"
    ],
    "stabilizers": [
      "rotator cuff, lower trapezius, serratus anterior, wrist extensors"
    ],
    "contractionRoles": [
      "concentric pull with isometric grip and scapulothoracic control",
      "eccentric return"
    ],
    "commonForceOrSkillDemand": "repeated horizontal pulling with coordinated shoulder and elbow action",
    "recommendedExercisePatterns": [
      "seated cable row, chest-supported row, lat pulldown, one-arm dumbbell row"
    ],
    "recommendedExercises": [
      "Seated cable row",
      "chest-supported row",
      "lat pulldown",
      "one-arm dumbbell row"
    ],
    "transferRationale": "These patterns reproduce the principal upper-limb pulling actions while allowing torso and scapular control to be coached separately.",
    "exerciseSelectionCautions": "Do not shrug, yank, or excessively extend the shoulder; use a neutral wrist and avoid painful end-range shoulder motion.",
    "evidenceConfidence": "high",
    "sources": [
      "https://www.britishrowing.org/indoor-rowing/go-row-indoor/how-to-indoor-row/british-rowing-technique/",
      "https://www.concept2.com/training/rowing-technique",
      "https://pubmed.ncbi.nlm.nih.gov/21510717/"
    ],
    "sourceSummary": "The records synthesize British Rowing and Concept2 technique guidance with peer-reviewed rowing biomechanics, muscle-activity, injury-risk, and strength-testing literature; evidence is strongest for stroke sequencing and joint-action descriptions, while gym-transfer rationales remain mechanical heuristics rather than proof of causal performance improvement."
  },
  {
    "id": "rowing-5",
    "sportId": "rowing",
    "label": "finish position",
    "movementFamily": "terminal force absorption and posture control at the end of propulsion",
    "bodyActions": [
      "legs extended, hips open, slight trunk layback, handle at lower ribs"
    ],
    "jointActions": [
      "hip extension",
      "shoulder extension",
      "elbow flexion",
      "scapular retraction"
    ],
    "primeMovers": [
      "latissimus dorsi, gluteus maximus, biceps brachii, posterior deltoid"
    ],
    "assistingMuscles": [
      "hamstrings, teres major, middle trapezius, rhomboid major"
    ],
    "stabilizers": [
      "rectus abdominis, obliques, rotator cuff, lower trapezius"
    ],
    "contractionRoles": [
      "brief isometric end position after concentric pull",
      "eccentric preparation for recovery"
    ],
    "commonForceOrSkillDemand": "terminal force absorption and posture control at the end of propulsion",
    "recommendedExercisePatterns": [
      "seated cable row, hip thrust, chest-supported row, Pallof press"
    ],
    "recommendedExercises": [
      "Seated cable row",
      "hip thrust",
      "chest-supported row",
      "Pallof press"
    ],
    "transferRationale": "A controlled row lockout plus hip-extension exercise reflects the finish’s combined pull and pelvic control; it does not replicate handle velocity or water/ergometer rhythm.",
    "exerciseSelectionCautions": "Avoid leaning back by flexing or extending the lumbar spine; finish with elbows and shoulders controlled rather than forced behind the body.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://www.britishrowing.org/indoor-rowing/go-row-indoor/how-to-indoor-row/british-rowing-technique/",
      "https://www.concept2.com/training/rowing-technique",
      "https://pubmed.ncbi.nlm.nih.gov/21510717/"
    ],
    "sourceSummary": "The records synthesize British Rowing and Concept2 technique guidance with peer-reviewed rowing biomechanics, muscle-activity, injury-risk, and strength-testing literature; evidence is strongest for stroke sequencing and joint-action descriptions, while gym-transfer rationales remain mechanical heuristics rather than proof of causal performance improvement."
  },
  {
    "id": "rowing-6",
    "sportId": "rowing",
    "label": "recovery",
    "movementFamily": "repeatable low-force return and deceleration between strokes",
    "bodyActions": [
      "arms extend, trunk inclines, then knees flex toward the catch"
    ],
    "jointActions": [
      "elbow extension",
      "shoulder flexion",
      "trunk flexion from the hips",
      "knee and hip flexion"
    ],
    "primeMovers": [
      "hamstrings, iliacus, psoas major, quadriceps eccentrically"
    ],
    "assistingMuscles": [
      "triceps brachii, rectus femoris, tibialis anterior"
    ],
    "stabilizers": [
      "erector spinae, transversus abdominis, scapular stabilizers, foot muscles"
    ],
    "contractionRoles": [
      "eccentric braking and controlled flexion with isometric torso organization"
    ],
    "commonForceOrSkillDemand": "repeatable low-force return and deceleration between strokes",
    "recommendedExercisePatterns": [
      "hamstring curl, reverse lunge, controlled cable row eccentric, dead bug"
    ],
    "recommendedExercises": [
      "Hamstring curl",
      "reverse lunge",
      "controlled cable row eccentric",
      "dead bug"
    ],
    "transferRationale": "Eccentric strength and sequencing drills address the braking and return qualities of recovery, not the complete coordination or timing of rowing.",
    "exerciseSelectionCautions": "Use slow, pain-free range; do not collapse into spinal flexion or combine fatigue with uncontrolled slide speed.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://www.britishrowing.org/indoor-rowing/go-row-indoor/how-to-indoor-row/british-rowing-technique/",
      "https://www.concept2.com/training/rowing-technique",
      "https://pubmed.ncbi.nlm.nih.gov/21510717/"
    ],
    "sourceSummary": "The records synthesize British Rowing and Concept2 technique guidance with peer-reviewed rowing biomechanics, muscle-activity, injury-risk, and strength-testing literature; evidence is strongest for stroke sequencing and joint-action descriptions, while gym-transfer rationales remain mechanical heuristics rather than proof of causal performance improvement."
  },
  {
    "id": "rowing-7",
    "sportId": "rowing",
    "label": "scapular retraction",
    "movementFamily": "scapular control under repeated pulling",
    "bodyActions": [
      "scapulae approximate during the pull while humeri extend"
    ],
    "jointActions": [
      "scapular retraction and depression",
      "shoulder extension"
    ],
    "primeMovers": [
      "middle trapezius, rhomboid major, posterior deltoid"
    ],
    "assistingMuscles": [
      "latissimus dorsi, lower trapezius, teres major"
    ],
    "stabilizers": [
      "rotator cuff, serratus anterior, thoracic extensors"
    ],
    "contractionRoles": [
      "concentric retraction with isometric glenohumeral centering and eccentric protraction"
    ],
    "commonForceOrSkillDemand": "scapular control under repeated pulling",
    "recommendedExercisePatterns": [
      "chest-supported row, seated cable row, face pull, prone Y raise"
    ],
    "recommendedExercises": [
      "Chest-supported row",
      "seated cable row",
      "face pull",
      "prone Y raise"
    ],
    "transferRationale": "These exercises train retraction/depression with reduced need for compensatory lumbar movement, supporting a controlled pulling base.",
    "exerciseSelectionCautions": "Retraction is not maximal pinching; preserve scapular upward rotation and stop if anterior shoulder pain or numbness occurs.",
    "evidenceConfidence": "high",
    "sources": [
      "https://www.concept2.com/training/rowing-technique",
      "https://pubmed.ncbi.nlm.nih.gov/21510717/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12223773/"
    ],
    "sourceSummary": "The records synthesize British Rowing and Concept2 technique guidance with peer-reviewed rowing biomechanics, muscle-activity, injury-risk, and strength-testing literature; evidence is strongest for stroke sequencing and joint-action descriptions, while gym-transfer rationales remain mechanical heuristics rather than proof of causal performance improvement."
  },
  {
    "id": "rowing-8",
    "sportId": "rowing",
    "label": "shoulder extension",
    "movementFamily": "controlled shoulder extension coupled to trunk and handle motion",
    "bodyActions": [
      "upper arm travels posteriorly during the latter drive"
    ],
    "jointActions": [
      "glenohumeral extension and adduction",
      "scapular depression/retraction"
    ],
    "primeMovers": [
      "latissimus dorsi, posterior deltoid, teres major"
    ],
    "assistingMuscles": [
      "long head of triceps brachii, pectoralis major, rhomboid major"
    ],
    "stabilizers": [
      "rotator cuff, lower trapezius, serratus anterior"
    ],
    "contractionRoles": [
      "concentric extension in drive and eccentric control in recovery"
    ],
    "commonForceOrSkillDemand": "controlled shoulder extension coupled to trunk and handle motion",
    "recommendedExercisePatterns": [
      "straight-arm pulldown, lat pulldown, seated cable row, dumbbell pullover"
    ],
    "recommendedExercises": [
      "Straight-arm pulldown",
      "lat pulldown",
      "seated cable row",
      "dumbbell pullover"
    ],
    "transferRationale": "The exercises share shoulder-extension loading but should complement, not replace, technical sequencing from legs through trunk to arms.",
    "exerciseSelectionCautions": "Avoid forcing the humerus behind the trunk or depressing the shoulder aggressively; select a load that preserves rib and scapular control.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://www.concept2.com/training/rowing-technique",
      "https://pubmed.ncbi.nlm.nih.gov/21510717/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12223773/"
    ],
    "sourceSummary": "The records synthesize British Rowing and Concept2 technique guidance with peer-reviewed rowing biomechanics, muscle-activity, injury-risk, and strength-testing literature; evidence is strongest for stroke sequencing and joint-action descriptions, while gym-transfer rationales remain mechanical heuristics rather than proof of causal performance improvement."
  },
  {
    "id": "rowing-9",
    "sportId": "rowing",
    "label": "knee extension",
    "movementFamily": "bilateral knee-extension force applied through a fixed foot contact",
    "bodyActions": [
      "lower leg straightens during the first drive segment"
    ],
    "jointActions": [
      "knee extension with hip and ankle joints transmitting force"
    ],
    "primeMovers": [
      "quadriceps, especially vastus lateralis, vastus medialis, and rectus femoris"
    ],
    "assistingMuscles": [
      "gluteus maximus, soleus, gastrocnemius"
    ],
    "stabilizers": [
      "hamstrings, gluteus medius, adductors, transversus abdominis"
    ],
    "contractionRoles": [
      "concentric extension in drive",
      "eccentric knee flexion control in recovery"
    ],
    "commonForceOrSkillDemand": "bilateral knee-extension force applied through a fixed foot contact",
    "recommendedExercisePatterns": [
      "front squat, leg press, split squat, sled push"
    ],
    "recommendedExercises": [
      "Front squat",
      "leg press",
      "split squat",
      "sled push"
    ],
    "transferRationale": "These exercises load knee extension and foot-ground force transfer, with the caveat that rowing is seated and bilateral rather than a free-standing squat task.",
    "exerciseSelectionCautions": "Track knees over the feet and avoid abrupt lockout; regress depth or load for anterior knee symptoms.",
    "evidenceConfidence": "high",
    "sources": [
      "https://www.concept2.com/training/rowing-technique",
      "https://pubmed.ncbi.nlm.nih.gov/21510717/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12223773/"
    ],
    "sourceSummary": "The records synthesize British Rowing and Concept2 technique guidance with peer-reviewed rowing biomechanics, muscle-activity, injury-risk, and strength-testing literature; evidence is strongest for stroke sequencing and joint-action descriptions, while gym-transfer rationales remain mechanical heuristics rather than proof of causal performance improvement."
  },
  {
    "id": "rowing-10",
    "sportId": "rowing",
    "label": "hip extension",
    "movementFamily": "posterior-chain force and hip-dominant sequencing",
    "bodyActions": [
      "thighs move from flexion toward alignment with the trunk"
    ],
    "jointActions": [
      "hip extension",
      "pelvic control",
      "trunk held rigid"
    ],
    "primeMovers": [
      "gluteus maximus, hamstrings, adductor magnus"
    ],
    "assistingMuscles": [
      "posterior fibers of gluteus medius, erector spinae"
    ],
    "stabilizers": [
      "transversus abdominis, multifidus, obliques, hip abductors"
    ],
    "contractionRoles": [
      "concentric propulsion, eccentric slide return, isometric trunk bracing"
    ],
    "commonForceOrSkillDemand": "posterior-chain force and hip-dominant sequencing",
    "recommendedExercisePatterns": [
      "Romanian deadlift, hip thrust, kettlebell swing, cable pull-through"
    ],
    "recommendedExercises": [
      "Romanian deadlift",
      "hip thrust",
      "kettlebell swing",
      "cable pull-through"
    ],
    "transferRationale": "Hinge and thrust patterns share hip-extension demand and teach force production without making the lumbar spine the prime mover.",
    "exerciseSelectionCautions": "Maintain a neutral spine and use swing variations only with established hinge skill; reduce load if hamstring or back symptoms appear.",
    "evidenceConfidence": "high",
    "sources": [
      "https://www.concept2.com/training/rowing-technique",
      "https://pubmed.ncbi.nlm.nih.gov/21510717/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12223773/"
    ],
    "sourceSummary": "The records synthesize British Rowing and Concept2 technique guidance with peer-reviewed rowing biomechanics, muscle-activity, injury-risk, and strength-testing literature; evidence is strongest for stroke sequencing and joint-action descriptions, while gym-transfer rationales remain mechanical heuristics rather than proof of causal performance improvement."
  },
  {
    "id": "rowing-11",
    "sportId": "rowing",
    "label": "ankle plantarflexion",
    "movementFamily": "distal force transmission without losing foot contact",
    "bodyActions": [
      "foot presses into the stretcher as the drive finishes"
    ],
    "jointActions": [
      "ankle plantarflexion",
      "foot tripod stabilization"
    ],
    "primeMovers": [
      "soleus, gastrocnemius"
    ],
    "assistingMuscles": [
      "tibialis posterior, flexor hallucis longus, flexor digitorum longus"
    ],
    "stabilizers": [
      "intrinsic foot muscles, peroneus longus, tibialis anterior"
    ],
    "contractionRoles": [
      "concentric plantarflexion with eccentric dorsiflexion control on recovery"
    ],
    "commonForceOrSkillDemand": "distal force transmission without losing foot contact",
    "recommendedExercisePatterns": [
      "seated calf raise, standing calf raise, sled push, farmer carry"
    ],
    "recommendedExercises": [
      "Seated calf raise",
      "standing calf raise",
      "sled push",
      "farmer carry"
    ],
    "transferRationale": "Calf and loaded-locomotion patterns build plantarflexor capacity and foot stiffness that can support force transfer through the stretcher.",
    "exerciseSelectionCautions": "Do not chase maximal heel lift or let the arch collapse; use moderate range when the ankle or Achilles is irritable.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://www.concept2.com/training/rowing-technique",
      "https://pubmed.ncbi.nlm.nih.gov/21510717/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12223773/"
    ],
    "sourceSummary": "The records synthesize British Rowing and Concept2 technique guidance with peer-reviewed rowing biomechanics, muscle-activity, injury-risk, and strength-testing literature; evidence is strongest for stroke sequencing and joint-action descriptions, while gym-transfer rationales remain mechanical heuristics rather than proof of causal performance improvement."
  },
  {
    "id": "rowing-12",
    "sportId": "rowing",
    "label": "trunk bracing",
    "movementFamily": "stiff-but-breathable trunk force transfer across repeated strokes",
    "bodyActions": [
      "torso resists flexion, extension, and rotation while linking legs to handle"
    ],
    "jointActions": [
      "isometric anti-flexion, anti-extension, and anti-rotation"
    ],
    "primeMovers": [
      "transversus abdominis, internal oblique, external oblique, rectus abdominis, erector spinae"
    ],
    "assistingMuscles": [
      "multifidus, diaphragm, quadratus lumborum, latissimus dorsi"
    ],
    "stabilizers": [
      "pelvic-floor musculature, gluteus medius, rotator cuff"
    ],
    "contractionRoles": [
      "isometric co-contraction with brief adjustments as force changes"
    ],
    "commonForceOrSkillDemand": "stiff-but-breathable trunk force transfer across repeated strokes",
    "recommendedExercisePatterns": [
      "dead bug, front plank, suitcase carry, Pallof press"
    ],
    "recommendedExercises": [
      "Dead bug",
      "front plank",
      "suitcase carry",
      "Pallof press"
    ],
    "transferRationale": "These drills train anti-motion trunk control and breathing under load, a shared requirement for transferring leg force without excessive torso motion.",
    "exerciseSelectionCautions": "Brace without breath-holding for prolonged intervals; avoid treating maximal stiffness as a substitute for rowing posture and mobility.",
    "evidenceConfidence": "high",
    "sources": [
      "https://www.concept2.com/training/rowing-technique",
      "https://pubmed.ncbi.nlm.nih.gov/21510717/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12223773/"
    ],
    "sourceSummary": "The records synthesize British Rowing and Concept2 technique guidance with peer-reviewed rowing biomechanics, muscle-activity, injury-risk, and strength-testing literature; evidence is strongest for stroke sequencing and joint-action descriptions, while gym-transfer rationales remain mechanical heuristics rather than proof of causal performance improvement."
  },
  {
    "id": "rowing-13",
    "sportId": "rowing",
    "label": "trunk hinge",
    "movementFamily": "repeatable torso-angle change while preserving force transmission",
    "bodyActions": [
      "torso pivots from the hips between forward and open angles"
    ],
    "jointActions": [
      "hip hinge",
      "controlled trunk flexion/extension",
      "spinal stabilization"
    ],
    "primeMovers": [
      "gluteus maximus, hamstrings, erector spinae"
    ],
    "assistingMuscles": [
      "adductor magnus, latissimus dorsi, posterior deltoid"
    ],
    "stabilizers": [
      "transversus abdominis, obliques, multifidus, gluteus medius"
    ],
    "contractionRoles": [
      "concentric and eccentric hip-driven angle change with isometric spinal control"
    ],
    "commonForceOrSkillDemand": "repeatable torso-angle change while preserving force transmission",
    "recommendedExercisePatterns": [
      "dowel hip hinge, Romanian deadlift, cable pull-through, back extension"
    ],
    "recommendedExercises": [
      "Dowel hip hinge",
      "Romanian deadlift",
      "cable pull-through",
      "back extension"
    ],
    "transferRationale": "Hip-hinge practice maps to the rowing trunk-angle change and emphasizes moving from the hip rather than folding through the lumbar spine.",
    "exerciseSelectionCautions": "Use a short range until control is reliable; avoid loaded spinal flexion and stop with pain, radiating symptoms, or loss of neutral alignment.",
    "evidenceConfidence": "high",
    "sources": [
      "https://www.concept2.com/training/rowing-technique",
      "https://pubmed.ncbi.nlm.nih.gov/21510717/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12223773/"
    ],
    "sourceSummary": "The records synthesize British Rowing and Concept2 technique guidance with peer-reviewed rowing biomechanics, muscle-activity, injury-risk, and strength-testing literature; evidence is strongest for stroke sequencing and joint-action descriptions, while gym-transfer rationales remain mechanical heuristics rather than proof of causal performance improvement."
  },
  {
    "id": "rowing-14",
    "sportId": "rowing",
    "label": "grip endurance",
    "movementFamily": "long-duration submaximal grip without excessive forearm tension",
    "bodyActions": [
      "hands maintain handle contact through drive and recovery"
    ],
    "jointActions": [
      "finger flexion",
      "wrist stabilization",
      "elbow and shoulder co-contraction"
    ],
    "primeMovers": [
      "flexor digitorum profundus, flexor digitorum superficialis, flexor carpi radialis, flexor carpi ulnaris"
    ],
    "assistingMuscles": [
      "intrinsic hand muscles, brachioradialis, extensor carpi radialis longus"
    ],
    "stabilizers": [
      "wrist extensors, thumb musculature, rotator cuff, scapular stabilizers"
    ],
    "contractionRoles": [
      "predominantly isometric grip with intermittent adjustments"
    ],
    "commonForceOrSkillDemand": "long-duration submaximal grip without excessive forearm tension",
    "recommendedExercisePatterns": [
      "farmer carry, dead hang, suitcase carry, seated cable row"
    ],
    "recommendedExercises": [
      "Farmer carry",
      "dead hang",
      "suitcase carry",
      "seated cable row"
    ],
    "transferRationale": "Carries, hangs, and rows expose the hand and forearm to sustained gripping while allowing intensity and duration to be scaled.",
    "exerciseSelectionCautions": "Use a relaxed hook-like grip when appropriate; stop for numbness, tingling, or persistent elbow/wrist pain and avoid maximal hangs in unprepared athletes.",
    "evidenceConfidence": "high",
    "sources": [
      "https://www.concept2.com/training/rowing-technique",
      "https://pubmed.ncbi.nlm.nih.gov/21510717/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12223773/"
    ],
    "sourceSummary": "The records synthesize British Rowing and Concept2 technique guidance with peer-reviewed rowing biomechanics, muscle-activity, injury-risk, and strength-testing literature; evidence is strongest for stroke sequencing and joint-action descriptions, while gym-transfer rationales remain mechanical heuristics rather than proof of causal performance improvement."
  },
  {
    "id": "rowing-15",
    "sportId": "rowing",
    "label": "repeated pulling",
    "movementFamily": "upper-body pulling endurance with technique retained under repetition",
    "bodyActions": [
      "cyclic shoulder extension, scapular retraction, and elbow flexion"
    ],
    "jointActions": [
      "shoulder extension",
      "elbow flexion",
      "scapular retraction",
      "wrist stabilization"
    ],
    "primeMovers": [
      "latissimus dorsi, middle trapezius, rhomboid major, biceps brachii"
    ],
    "assistingMuscles": [
      "posterior deltoid, brachialis, brachioradialis, teres major"
    ],
    "stabilizers": [
      "rotator cuff, lower trapezius, serratus anterior, erector spinae"
    ],
    "contractionRoles": [
      "repeated concentric pulls, eccentric returns, isometric grip and trunk"
    ],
    "commonForceOrSkillDemand": "upper-body pulling endurance with technique retained under repetition",
    "recommendedExercisePatterns": [
      "seated cable row, chest-supported row, lat pulldown, inverted row"
    ],
    "recommendedExercises": [
      "Seated cable row",
      "chest-supported row",
      "lat pulldown",
      "inverted row"
    ],
    "transferRationale": "These exercises provide scalable pulling volume and reduce the need to use lumbar motion to create handle travel.",
    "exerciseSelectionCautions": "Balance pulling volume with pressing and shoulder-control work; avoid training to failure when scapular mechanics or grip posture deteriorates.",
    "evidenceConfidence": "high",
    "sources": [
      "https://www.concept2.com/training/rowing-technique",
      "https://pubmed.ncbi.nlm.nih.gov/21510717/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12223773/"
    ],
    "sourceSummary": "The records synthesize British Rowing and Concept2 technique guidance with peer-reviewed rowing biomechanics, muscle-activity, injury-risk, and strength-testing literature; evidence is strongest for stroke sequencing and joint-action descriptions, while gym-transfer rationales remain mechanical heuristics rather than proof of causal performance improvement."
  },
  {
    "id": "rowing-16",
    "sportId": "rowing",
    "label": "explosive start stroke",
    "movementFamily": "short-duration power and acceleration from a compressed start",
    "bodyActions": [
      "rapid leg-dominant force from the catch followed by hip swing and arm pull"
    ],
    "jointActions": [
      "rapid knee and hip extension",
      "ankle plantarflexion",
      "shoulder extension"
    ],
    "primeMovers": [
      "quadriceps, gluteus maximus, hamstrings, soleus"
    ],
    "assistingMuscles": [
      "gastrocnemius, adductor magnus, latissimus dorsi, posterior deltoid"
    ],
    "stabilizers": [
      "transversus abdominis, erector spinae, gluteus medius, rotator cuff"
    ],
    "contractionRoles": [
      "high-rate concentric force with isometric trunk transfer and eccentric reset"
    ],
    "commonForceOrSkillDemand": "short-duration power and acceleration from a compressed start",
    "recommendedExercisePatterns": [
      "sled push, jump squat, trap-bar deadlift, medicine-ball scoop toss"
    ],
    "recommendedExercises": [
      "Sled push",
      "jump squat",
      "trap-bar deadlift",
      "medicine-ball scoop toss"
    ],
    "transferRationale": "These patterns overlap rapid lower-body force production and whole-body sequencing; they do not establish that gym power training causes faster starts.",
    "exerciseSelectionCautions": "Use low volume and full recovery; do not sacrifice catch position, land stiffly, or use ballistic loading without landing and hinge competency.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://www.concept2.com/training/rowing-technique",
      "https://pubmed.ncbi.nlm.nih.gov/21510717/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12223773/"
    ],
    "sourceSummary": "The records synthesize British Rowing and Concept2 technique guidance with peer-reviewed rowing biomechanics, muscle-activity, injury-risk, and strength-testing literature; evidence is strongest for stroke sequencing and joint-action descriptions, while gym-transfer rationales remain mechanical heuristics rather than proof of causal performance improvement."
  },
  {
    "id": "rowing-17",
    "sportId": "rowing",
    "label": "high-rate stroke",
    "movementFamily": "high-cadence coordination and power-endurance",
    "bodyActions": [
      "rapidly repeated leg drive, hip swing, arm pull, and recovery"
    ],
    "jointActions": [
      "fast coordinated extension/flexion at knees, hips, shoulders, and elbows"
    ],
    "primeMovers": [
      "quadriceps, gluteus maximus, hamstrings, soleus, latissimus dorsi"
    ],
    "assistingMuscles": [
      "gastrocnemius, biceps brachii, posterior deltoid, forearm flexors"
    ],
    "stabilizers": [
      "abdominals, erector spinae, rotator cuff, scapular stabilizers, foot muscles"
    ],
    "contractionRoles": [
      "mixed repeated concentric-eccentric actions with brief isometric bracing"
    ],
    "commonForceOrSkillDemand": "high-cadence coordination and power-endurance",
    "recommendedExercisePatterns": [
      "rower intervals, air-bike intervals, sled push, kettlebell swing"
    ],
    "recommendedExercises": [
      "Rower intervals",
      "air-bike intervals",
      "sled push",
      "kettlebell swing"
    ],
    "transferRationale": "Intervals can train repeatability and rhythm while preserving a lower technical complexity than adding maximal resistance to every stroke.",
    "exerciseSelectionCautions": "Keep resistance and interval length appropriate to technique; high rate with shortened recovery can overload the back, forearms, or shoulders.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://www.concept2.com/training/rowing-technique",
      "https://pubmed.ncbi.nlm.nih.gov/21510717/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12223773/"
    ],
    "sourceSummary": "The records synthesize British Rowing and Concept2 technique guidance with peer-reviewed rowing biomechanics, muscle-activity, injury-risk, and strength-testing literature; evidence is strongest for stroke sequencing and joint-action descriptions, while gym-transfer rationales remain mechanical heuristics rather than proof of causal performance improvement."
  },
  {
    "id": "rowing-18",
    "sportId": "rowing",
    "label": "power stroke",
    "movementFamily": "whole-body power with proximal-to-distal sequencing",
    "bodyActions": [
      "strong full-sequence force application from legs through trunk to arms"
    ],
    "jointActions": [
      "knee and hip extension",
      "trunk-angle change",
      "shoulder extension",
      "elbow flexion"
    ],
    "primeMovers": [
      "quadriceps, gluteus maximus, hamstrings, latissimus dorsi"
    ],
    "assistingMuscles": [
      "soleus, adductor magnus, posterior deltoid, biceps brachii"
    ],
    "stabilizers": [
      "erector spinae, transversus abdominis, gluteus medius, rotator cuff"
    ],
    "contractionRoles": [
      "forceful concentric propulsion, eccentric recovery, isometric transfer"
    ],
    "commonForceOrSkillDemand": "whole-body power with proximal-to-distal sequencing",
    "recommendedExercisePatterns": [
      "trap-bar deadlift, front squat, seated cable row, medicine-ball scoop toss"
    ],
    "recommendedExercises": [
      "Trap-bar deadlift",
      "front squat",
      "seated cable row",
      "medicine-ball scoop toss"
    ],
    "transferRationale": "The combination trains lower-body force, trunk transfer, and horizontal pulling in separate controllable components; no direct performance guarantee is implied.",
    "exerciseSelectionCautions": "Avoid combining maximal lower-body and pulling loads when fatigued; maintain handle path, neutral spine, and controlled catch-to-drive transition.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://www.concept2.com/training/rowing-technique",
      "https://pubmed.ncbi.nlm.nih.gov/21510717/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12223773/"
    ],
    "sourceSummary": "The records synthesize British Rowing and Concept2 technique guidance with peer-reviewed rowing biomechanics, muscle-activity, injury-risk, and strength-testing literature; evidence is strongest for stroke sequencing and joint-action descriptions, while gym-transfer rationales remain mechanical heuristics rather than proof of causal performance improvement."
  },
  {
    "id": "rowing-19",
    "sportId": "rowing",
    "label": "sustained stroke cycle",
    "movementFamily": "aerobic power-endurance, rhythm, and technical consistency",
    "bodyActions": [
      "continuous drive, finish, and recovery at submaximal to moderate intensity"
    ],
    "jointActions": [
      "repeated bilateral knee/hip extension and flexion",
      "shoulder/elbow cycling",
      "trunk bracing"
    ],
    "primeMovers": [
      "quadriceps, gluteus maximus, hamstrings, latissimus dorsi"
    ],
    "assistingMuscles": [
      "soleus, gastrocnemius, middle trapezius, biceps brachii, forearm flexors"
    ],
    "stabilizers": [
      "erector spinae, transversus abdominis, rotator cuff, foot muscles"
    ],
    "contractionRoles": [
      "cyclic concentric drive, eccentric recovery, persistent isometric grip and trunk"
    ],
    "commonForceOrSkillDemand": "aerobic power-endurance, rhythm, and technical consistency",
    "recommendedExercisePatterns": [
      "rower steady-state, rower intervals, air-bike, sled push"
    ],
    "recommendedExercises": [
      "Rower steady-state",
      "rower intervals",
      "air-bike",
      "sled push"
    ],
    "transferRationale": "These patterns target repeatable whole-body work and pacing, with the rower offering the closest movement-specific practice.",
    "exerciseSelectionCautions": "Progress duration before intensity when needed; monitor technique, lumbar fatigue, skin/hand irritation, and recovery between sessions.",
    "evidenceConfidence": "high",
    "sources": [
      "https://www.concept2.com/training/rowing-technique",
      "https://pubmed.ncbi.nlm.nih.gov/21510717/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12223773/"
    ],
    "sourceSummary": "The records synthesize British Rowing and Concept2 technique guidance with peer-reviewed rowing biomechanics, muscle-activity, injury-risk, and strength-testing literature; evidence is strongest for stroke sequencing and joint-action descriptions, while gym-transfer rationales remain mechanical heuristics rather than proof of causal performance improvement."
  },
  {
    "id": "rowing-20",
    "sportId": "rowing",
    "label": "stroke deceleration",
    "movementFamily": "deceleration and reversal under repeated cyclic load",
    "bodyActions": [
      "force is absorbed as the handle slows at finish and the body reverses into recovery"
    ],
    "jointActions": [
      "eccentric shoulder and elbow control",
      "hip and knee flexion braking",
      "trunk-angle control"
    ],
    "primeMovers": [
      "hamstrings, quadriceps, latissimus dorsi, biceps brachii, erector spinae"
    ],
    "assistingMuscles": [
      "gluteus maximus, posterior deltoid, brachialis, gastrocnemius"
    ],
    "stabilizers": [
      "transversus abdominis, multifidus, rotator cuff, scapular stabilizers"
    ],
    "contractionRoles": [
      "eccentric braking followed by controlled reversal and isometric organization"
    ],
    "commonForceOrSkillDemand": "deceleration and reversal under repeated cyclic load",
    "recommendedExercisePatterns": [
      "Romanian deadlift, hamstring curl, controlled seated cable row, split squat"
    ],
    "recommendedExercises": [
      "Romanian deadlift",
      "hamstring curl",
      "controlled seated cable row",
      "split squat"
    ],
    "transferRationale": "Eccentric hinge, hamstring, pulling, and unilateral-leg work develops braking capacities relevant to reversal, but rowing-specific timing remains skill-dependent.",
    "exerciseSelectionCautions": "Use controlled tempos and avoid abrupt stops at end range; reduce volume if soreness or technique breakdown accumulates.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://www.concept2.com/training/rowing-technique",
      "https://pubmed.ncbi.nlm.nih.gov/21510717/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC12223773/"
    ],
    "sourceSummary": "The records synthesize British Rowing and Concept2 technique guidance with peer-reviewed rowing biomechanics, muscle-activity, injury-risk, and strength-testing literature; evidence is strongest for stroke sequencing and joint-action descriptions, while gym-transfer rationales remain mechanical heuristics rather than proof of causal performance improvement."
  },
  {
    "id": "skiing-1",
    "sportId": "skiing",
    "label": "carving turn",
    "movementFamily": "edging and turn control",
    "bodyActions": [
      "incline and angulate the body while flexing and extending the lower limbs to maintain edge engagement through the turn"
    ],
    "jointActions": [
      "ankle dorsiflexion and eversion/inversion control",
      "knee flexion-extension and frontal-plane control",
      "hip flexion, adduction-abduction and rotation",
      "trunk lateral flexion with anti-rotation"
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus maximus",
      "gluteus medius",
      "adductor magnus"
    ],
    "assistingMuscles": [
      "hamstring muscles",
      "soleus",
      "gastrocnemius",
      "tensor fasciae latae"
    ],
    "stabilizers": [
      "deep hip external rotators",
      "tibialis posterior",
      "peroneus longus",
      "erector spinae",
      "internal and external oblique muscles"
    ],
    "contractionRoles": [
      "eccentric quadriceps and hip-extensor control during loading",
      "isometric trunk and frontal-plane hip control",
      "concentric extension during turn release"
    ],
    "commonForceOrSkillDemand": "high sustained lower-limb edge pressure, bilateral-to-unilateral load transfer, and precise balance",
    "recommendedExercisePatterns": [
      "single-leg strength",
      "lateral force production",
      "eccentric squat control",
      "anti-rotation bracing"
    ],
    "recommendedExercises": [
      "lateral lunges",
      "rear-foot-elevated split squats",
      "single-leg squat-to-stick",
      "suitcase carries"
    ],
    "transferRationale": "These patterns share frontal-plane hip control, flexed-knee force acceptance, and trunk stiffness, but they do not reproduce ski-snow friction or technical steering.",
    "exerciseSelectionCautions": "Progress range and load gradually; do not equate gym symmetry with on-snow bilateral loading, and stop if knee pain or loss of foot control appears.",
    "evidenceConfidence": "high",
    "sources": [
      "https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2020.00025/full",
      "https://journals.humankinetics.com/view/journals/jab/28/6/article-p655.xml"
    ],
    "sourceSummary": "The records use peer-reviewed alpine-skiing biomechanics and ski-jump landing research, supplemented by FIS technique materials and strength-and-conditioning guidance; evidence supports shared mechanical demands and muscle roles but does not establish direct causal performance gains from the listed gym exercises."
  },
  {
    "id": "skiing-2",
    "sportId": "skiing",
    "label": "parallel turn",
    "movementFamily": "parallel steering",
    "bodyActions": [
      "coordinate both skis through flexion-extension, edging, and rotary steering while keeping the torso relatively stable"
    ],
    "jointActions": [
      "ankle dorsiflexion",
      "knee flexion-extension",
      "hip rotation and abduction",
      "trunk anti-rotation"
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus maximus",
      "gluteus medius"
    ],
    "assistingMuscles": [
      "hamstring muscles",
      "adductor magnus",
      "soleus",
      "gastrocnemius"
    ],
    "stabilizers": [
      "deep hip external rotators",
      "tibialis posterior",
      "peroneus longus",
      "erector spinae",
      "oblique muscles"
    ],
    "contractionRoles": [
      "eccentric braking in the loaded phase",
      "isometric alignment control",
      "concentric leg extension during transition"
    ],
    "commonForceOrSkillDemand": "repeated bilateral force modulation and rapid edge-to-edge coordination",
    "recommendedExercisePatterns": [
      "bilateral squat strength",
      "unilateral balance",
      "lateral movement",
      "trunk anti-rotation"
    ],
    "recommendedExercises": [
      "front squats",
      "lateral lunges",
      "single-leg Romanian deadlifts",
      "Pallof presses"
    ],
    "transferRationale": "The exercises develop shared lower-limb force and balance qualities, not the perceptual timing or ski geometry of a parallel turn.",
    "exerciseSelectionCautions": "Use technically controlled loads; avoid excessive valgus, lumbar rotation, or fatigue that changes the movement strategy.",
    "evidenceConfidence": "high",
    "sources": [
      "https://link.springer.com/article/10.1007/s40279-013-0132-z",
      "https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2020.00025/full"
    ],
    "sourceSummary": "The records use peer-reviewed alpine-skiing biomechanics and ski-jump landing research, supplemented by FIS technique materials and strength-and-conditioning guidance; evidence supports shared mechanical demands and muscle roles but does not establish direct causal performance gains from the listed gym exercises."
  },
  {
    "id": "skiing-3",
    "sportId": "skiing",
    "label": "edge transition",
    "movementFamily": "edge release and re-engagement",
    "bodyActions": [
      "release one edge and roll the feet, knees, and hips to establish the opposite edges"
    ],
    "jointActions": [
      "ankle inversion and eversion",
      "knee flexion-extension",
      "hip abduction-adduction",
      "pelvic rotation"
    ],
    "primeMovers": [
      "gluteus medius",
      "gluteus maximus",
      "quadriceps femoris"
    ],
    "assistingMuscles": [
      "adductor magnus",
      "soleus",
      "gastrocnemius",
      "hamstring muscles"
    ],
    "stabilizers": [
      "tibialis posterior",
      "peroneus longus",
      "deep hip rotators",
      "transversus abdominis"
    ],
    "contractionRoles": [
      "brief unloading through flexion",
      "concentric reorientation of the lower limbs",
      "isometric control at new edge engagement"
    ],
    "commonForceOrSkillDemand": "rapid coordination with low tolerance for balance error during pressure release",
    "recommendedExercisePatterns": [
      "lateral foot and hip control",
      "single-leg transition",
      "reactive balance"
    ],
    "recommendedExercises": [
      "skater bounds",
      "lateral step-ups",
      "hip airplanes",
      "single-leg deceleration"
    ],
    "transferRationale": "Unilateral lateral exercises expose the athlete to comparable center-of-mass transfer and pelvic control demands, without claiming direct technical transfer.",
    "exerciseSelectionCautions": "Begin with supported and planned variations before reactive bounds; protect the ankle and knee during rapid side-to-side work.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://link.springer.com/article/10.1007/s40279-013-0132-z",
      "https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2020.00025/full"
    ],
    "sourceSummary": "The records use peer-reviewed alpine-skiing biomechanics and ski-jump landing research, supplemented by FIS technique materials and strength-and-conditioning guidance; evidence supports shared mechanical demands and muscle roles but does not establish direct causal performance gains from the listed gym exercises."
  },
  {
    "id": "skiing-4",
    "sportId": "skiing",
    "label": "lateral weight shift",
    "movementFamily": "unilateral load transfer",
    "bodyActions": [
      "shift the center of mass over the supporting ski while maintaining pressure and alignment"
    ],
    "jointActions": [
      "ankle inversion-eversion",
      "knee flexion",
      "hip abduction-adduction",
      "trunk lateral flexion"
    ],
    "primeMovers": [
      "gluteus medius",
      "gluteus maximus",
      "quadriceps femoris"
    ],
    "assistingMuscles": [
      "adductor magnus",
      "soleus",
      "gastrocnemius",
      "hamstring muscles"
    ],
    "stabilizers": [
      "peroneus longus",
      "tibialis posterior",
      "deep hip rotators",
      "oblique muscles"
    ],
    "contractionRoles": [
      "isometric single-leg support",
      "eccentric control as mass shifts",
      "concentric push-off to the opposite side"
    ],
    "commonForceOrSkillDemand": "single-leg balance and controlled lateral force transfer",
    "recommendedExercisePatterns": [
      "unilateral squat",
      "lateral lunge",
      "loaded carry"
    ],
    "recommendedExercises": [
      "lateral lunges",
      "single-leg squats",
      "lateral step-ups",
      "suitcase carries"
    ],
    "transferRationale": "These exercises train lateral hip and foot control under unilateral loading; they are preparatory strength patterns rather than skiing simulations.",
    "exerciseSelectionCautions": "Use hand support or reduced range when balance is limited; maintain a quiet foot tripod and knee tracking.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2020.00025/full",
      "https://www.nsca.com/education/articles/kinetic-select/strength-and-conditioning-for-alpine-skiing/"
    ],
    "sourceSummary": "The records use peer-reviewed alpine-skiing biomechanics and ski-jump landing research, supplemented by FIS technique materials and strength-and-conditioning guidance; evidence supports shared mechanical demands and muscle roles but does not establish direct causal performance gains from the listed gym exercises."
  },
  {
    "id": "skiing-5",
    "sportId": "skiing",
    "label": "hip angulation",
    "movementFamily": "edge-angle generation",
    "bodyActions": [
      "laterally angle the hips relative to the skis and torso while maintaining balance and edge angle"
    ],
    "jointActions": [
      "hip abduction and lateral flexion",
      "hip internal-external rotation",
      "knee flexion",
      "ankle inversion-eversion"
    ],
    "primeMovers": [
      "gluteus medius",
      "gluteus minimus",
      "adductor magnus",
      "quadriceps femoris"
    ],
    "assistingMuscles": [
      "gluteus maximus",
      "tensor fasciae latae",
      "hamstring muscles",
      "soleus"
    ],
    "stabilizers": [
      "deep hip rotators",
      "tibialis posterior",
      "peroneus longus",
      "quadratus lumborum",
      "oblique muscles"
    ],
    "contractionRoles": [
      "isometric frontal-plane pelvic control",
      "eccentric control of knee and hip flexion",
      "concentric repositioning during release"
    ],
    "commonForceOrSkillDemand": "high frontal-plane control while preserving a centered trunk and ski-snow contact",
    "recommendedExercisePatterns": [
      "lateral hip strength",
      "single-leg hinge",
      "anti-lateral-flexion"
    ],
    "recommendedExercises": [
      "Copenhagen-style adductor work",
      "hip airplanes",
      "single-leg Romanian deadlifts",
      "suitcase carries"
    ],
    "transferRationale": "The patterns strengthen muscles that control pelvis and trunk position in the frontal plane, but do not establish the exact on-snow edge angle.",
    "exerciseSelectionCautions": "Adductor work should be progressed from short-lever to long-lever positions; avoid forcing hip range or lumbar side-bending.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://link.springer.com/article/10.1007/s40279-013-0132-z",
      "https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2020.00025/full"
    ],
    "sourceSummary": "The records use peer-reviewed alpine-skiing biomechanics and ski-jump landing research, supplemented by FIS technique materials and strength-and-conditioning guidance; evidence supports shared mechanical demands and muscle roles but does not establish direct causal performance gains from the listed gym exercises."
  },
  {
    "id": "skiing-6",
    "sportId": "skiing",
    "label": "knee flexion absorption",
    "movementFamily": "terrain-force absorption",
    "bodyActions": [
      "flex the knees and hips to shorten the legs and dissipate terrain-induced vertical forces"
    ],
    "jointActions": [
      "ankle dorsiflexion",
      "knee flexion",
      "hip flexion",
      "trunk stabilization"
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus maximus",
      "soleus"
    ],
    "assistingMuscles": [
      "hamstring muscles",
      "gastrocnemius",
      "adductor magnus"
    ],
    "stabilizers": [
      "gluteus medius",
      "tibialis posterior",
      "peroneus longus",
      "erector spinae",
      "oblique muscles"
    ],
    "contractionRoles": [
      "eccentric absorption at knee, hip, and ankle",
      "isometric trunk control",
      "concentric extension to regain stance height"
    ],
    "commonForceOrSkillDemand": "repeated eccentric work with a flexed stance and changing external forces",
    "recommendedExercisePatterns": [
      "eccentric squat",
      "step-down",
      "landing mechanics"
    ],
    "recommendedExercises": [
      "slow-tempo split squats",
      "controlled step-downs",
      "drop landings",
      "isometric squat holds"
    ],
    "transferRationale": "These patterns share joint flexion and eccentric force absorption; they cannot reproduce snow compliance, speed, or terrain unpredictability.",
    "exerciseSelectionCautions": "Use low landing heights and preserve knee alignment; eccentric soreness and fatigue can impair subsequent technical practice.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6539877/",
      "https://www.sciopen.com/article/10.1007/s42978-020-00096-9"
    ],
    "sourceSummary": "The records use peer-reviewed alpine-skiing biomechanics and ski-jump landing research, supplemented by FIS technique materials and strength-and-conditioning guidance; evidence supports shared mechanical demands and muscle roles but does not establish direct causal performance gains from the listed gym exercises."
  },
  {
    "id": "skiing-7",
    "sportId": "skiing",
    "label": "mogul absorption",
    "movementFamily": "repeated terrain absorption",
    "bodyActions": [
      "rapidly flex and extend the hips, knees, and ankles over successive bumps while stabilizing the upper body"
    ],
    "jointActions": [
      "ankle dorsiflexion-plantarflexion",
      "knee flexion-extension",
      "hip flexion-extension",
      "trunk anti-flexion"
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus maximus",
      "soleus"
    ],
    "assistingMuscles": [
      "hamstring muscles",
      "gastrocnemius",
      "adductor magnus"
    ],
    "stabilizers": [
      "gluteus medius",
      "deep hip rotators",
      "tibialis posterior",
      "erector spinae",
      "oblique muscles"
    ],
    "contractionRoles": [
      "cyclic eccentric-concentric leg action",
      "isometric trunk stabilization",
      "rapid concentric recovery between bumps"
    ],
    "commonForceOrSkillDemand": "high-rate repeated eccentric-concentric cycling and postural control",
    "recommendedExercisePatterns": [
      "repeated step-downs",
      "split-squat endurance",
      "low-impact plyometrics"
    ],
    "recommendedExercises": [
      "step-downs",
      "split-squat isometrics",
      "snap-downs",
      "loaded carries"
    ],
    "transferRationale": "The exercises develop repeatable lower-limb absorption and trunk endurance, not mogul-specific line choice or timing.",
    "exerciseSelectionCautions": "Keep volume below technical-failure levels and progress impact only after consistent landing mechanics.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2020.00025/full",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC3737900/"
    ],
    "sourceSummary": "The records use peer-reviewed alpine-skiing biomechanics and ski-jump landing research, supplemented by FIS technique materials and strength-and-conditioning guidance; evidence supports shared mechanical demands and muscle roles but does not establish direct causal performance gains from the listed gym exercises."
  },
  {
    "id": "skiing-8",
    "sportId": "skiing",
    "label": "jump takeoff",
    "movementFamily": "triple-extension power",
    "bodyActions": [
      "compress then extend the ankles, knees, and hips to generate upward impulse while maintaining ski alignment"
    ],
    "jointActions": [
      "ankle plantarflexion",
      "knee extension",
      "hip extension",
      "trunk bracing"
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps femoris",
      "soleus"
    ],
    "assistingMuscles": [
      "gastrocnemius",
      "hamstring muscles",
      "adductor magnus"
    ],
    "stabilizers": [
      "gluteus medius",
      "deep hip rotators",
      "erector spinae",
      "oblique muscles",
      "tibialis posterior"
    ],
    "contractionRoles": [
      "eccentric countermovement",
      "concentric triple extension",
      "isometric alignment at takeoff"
    ],
    "commonForceOrSkillDemand": "rapid vertical impulse and precise timing under ski and terrain constraints",
    "recommendedExercisePatterns": [
      "loaded jump",
      "countermovement jump",
      "split-stance power"
    ],
    "recommendedExercises": [
      "countermovement jumps",
      "loaded jumps",
      "jump squats",
      "split-stance drives"
    ],
    "transferRationale": "Jump patterns share impulse production and coordinated extension, but do not replicate ski takeoff speed, terrain, or aerial skill.",
    "exerciseSelectionCautions": "Use progressive landing and takeoff volumes; avoid maximal loading when fatigue degrades foot, knee, or trunk alignment.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6539877/",
      "https://www.sciopen.com/article/10.1007/s42978-020-00096-9"
    ],
    "sourceSummary": "The records use peer-reviewed alpine-skiing biomechanics and ski-jump landing research, supplemented by FIS technique materials and strength-and-conditioning guidance; evidence supports shared mechanical demands and muscle roles but does not establish direct causal performance gains from the listed gym exercises."
  },
  {
    "id": "skiing-9",
    "sportId": "skiing",
    "label": "landing",
    "movementFamily": "landing and deceleration",
    "bodyActions": [
      "contact the snow with flexed ankles, knees, and hips and absorb vertical and horizontal forces"
    ],
    "jointActions": [
      "ankle dorsiflexion",
      "knee flexion",
      "hip flexion",
      "trunk stabilization"
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus maximus",
      "hamstring muscles",
      "soleus",
      "gastrocnemius"
    ],
    "assistingMuscles": [
      "adductor magnus",
      "gluteus medius",
      "tibialis anterior"
    ],
    "stabilizers": [
      "deep hip rotators",
      "tibialis posterior",
      "peroneus longus",
      "erector spinae",
      "oblique muscles"
    ],
    "contractionRoles": [
      "pre-activation before contact",
      "eccentric force absorption",
      "isometric alignment and concentric recovery"
    ],
    "commonForceOrSkillDemand": "large impact forces with frontal-plane and sagittal-plane alignment demands",
    "recommendedExercisePatterns": [
      "drop landing",
      "single-leg landing",
      "eccentric squat"
    ],
    "recommendedExercises": [
      "drop landings",
      "single-leg squat-to-stick",
      "controlled step-downs",
      "split squats"
    ],
    "transferRationale": "Landing drills target shared force-absorption and alignment strategies; evidence does not establish that any one exercise prevents ski injury or improves performance causally.",
    "exerciseSelectionCautions": "Begin bilaterally and from low height; use qualified coaching for jump-specific or ski-jump preparation.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6539877/",
      "https://www.sciopen.com/article/10.1007/s42978-020-00096-9"
    ],
    "sourceSummary": "The records use peer-reviewed alpine-skiing biomechanics and ski-jump landing research, supplemented by FIS technique materials and strength-and-conditioning guidance; evidence supports shared mechanical demands and muscle roles but does not establish direct causal performance gains from the listed gym exercises."
  },
  {
    "id": "skiing-10",
    "sportId": "skiing",
    "label": "rotational aerial control",
    "movementFamily": "aerial rotation and angular-momentum control",
    "bodyActions": [
      "orient the skis and body in the air using coordinated trunk, hip, and shoulder rotation"
    ],
    "jointActions": [
      "trunk rotation",
      "hip internal-external rotation",
      "shoulder rotation",
      "ankle and knee repositioning"
    ],
    "primeMovers": [
      "internal and external oblique muscles",
      "gluteus medius",
      "gluteus maximus",
      "deep hip rotators"
    ],
    "assistingMuscles": [
      "rectus abdominis",
      "latissimus dorsi",
      "serratus anterior",
      "quadratus lumborum"
    ],
    "stabilizers": [
      "erector spinae",
      "rotator cuff muscles",
      "scapular stabilizers",
      "neck muscles",
      "ankle-foot muscles"
    ],
    "contractionRoles": [
      "concentric segmental rotation",
      "isometric trunk stiffness",
      "eccentric braking of angular motion before landing"
    ],
    "commonForceOrSkillDemand": "whole-body angular-momentum management with orientation and landing preparation",
    "recommendedExercisePatterns": [
      "rotational medicine-ball power",
      "anti-rotation",
      "land-and-stick"
    ],
    "recommendedExercises": [
      "medicine-ball rotational throws",
      "Pallof presses",
      "land-and-stick drills",
      "split-stance rotational strength"
    ],
    "transferRationale": "These exercises develop trunk rotation and braking qualities but cannot substitute for coached aerial technique or air awareness.",
    "exerciseSelectionCautions": "Use submaximal rotational loads and stable landings; avoid adding complexity faster than landing control develops.",
    "evidenceConfidence": "limited",
    "sources": [
      "https://link.springer.com/article/10.1007/s40279-013-0132-z",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6539877/"
    ],
    "sourceSummary": "The records use peer-reviewed alpine-skiing biomechanics and ski-jump landing research, supplemented by FIS technique materials and strength-and-conditioning guidance; evidence supports shared mechanical demands and muscle roles but does not establish direct causal performance gains from the listed gym exercises."
  },
  {
    "id": "skiing-11",
    "sportId": "skiing",
    "label": "pole plant",
    "movementFamily": "pole-assisted timing and upper-limb coordination",
    "bodyActions": [
      "place the pole with coordinated shoulder flexion, elbow control, and trunk timing"
    ],
    "jointActions": [
      "shoulder flexion",
      "elbow extension-flexion",
      "wrist stabilization",
      "trunk anti-rotation"
    ],
    "primeMovers": [
      "anterior deltoid",
      "triceps brachii",
      "serratus anterior",
      "internal and external oblique muscles"
    ],
    "assistingMuscles": [
      "pectoralis major",
      "latissimus dorsi",
      "forearm flexor and extensor muscles"
    ],
    "stabilizers": [
      "rotator cuff muscles",
      "middle and lower trapezius",
      "rhomboid muscles",
      "erector spinae"
    ],
    "contractionRoles": [
      "concentric pole placement",
      "brief isometric shoulder and trunk support",
      "eccentric release and repositioning"
    ],
    "commonForceOrSkillDemand": "rapid low-load upper-limb timing coupled to turn initiation and balance",
    "recommendedExercisePatterns": [
      "cable press",
      "anti-rotation",
      "scapular control"
    ],
    "recommendedExercises": [
      "cable punches",
      "Pallof presses",
      "landmine presses",
      "one-arm cable rows"
    ],
    "transferRationale": "Light pressing and anti-rotation work shares trunk and shoulder-control demands; it does not reproduce pole timing or snow contact.",
    "exerciseSelectionCautions": "Keep pole-like pressing light and pain-free; do not overload a planted shoulder or allow scapular winging.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://www.fis-ski.com/inside-fis/news/2023-24/alpine-skiing-technique-and-tactics",
      "https://www.nsca.com/education/articles/kinetic-select/strength-and-conditioning-for-alpine-skiing/"
    ],
    "sourceSummary": "The records use peer-reviewed alpine-skiing biomechanics and ski-jump landing research, supplemented by FIS technique materials and strength-and-conditioning guidance; evidence supports shared mechanical demands and muscle roles but does not establish direct causal performance gains from the listed gym exercises."
  },
  {
    "id": "skiing-12",
    "sportId": "skiing",
    "label": "skating stride",
    "movementFamily": "lateral push-off and glide",
    "bodyActions": [
      "abduct and extend one leg against the edge while transferring mass to the opposite gliding ski"
    ],
    "jointActions": [
      "hip abduction and extension",
      "knee extension",
      "ankle plantarflexion",
      "trunk stabilization"
    ],
    "primeMovers": [
      "gluteus medius",
      "gluteus maximus",
      "quadriceps femoris",
      "adductor magnus"
    ],
    "assistingMuscles": [
      "hamstring muscles",
      "soleus",
      "gastrocnemius",
      "tensor fasciae latae"
    ],
    "stabilizers": [
      "deep hip rotators",
      "tibialis posterior",
      "peroneus longus",
      "oblique muscles"
    ],
    "contractionRoles": [
      "eccentric loading of the push leg",
      "concentric lateral push-off",
      "isometric single-leg glide control"
    ],
    "commonForceOrSkillDemand": "repeated unilateral lateral propulsion and balance",
    "recommendedExercisePatterns": [
      "skater bound",
      "lateral lunge",
      "single-leg strength"
    ],
    "recommendedExercises": [
      "skater bounds",
      "lateral lunges",
      "lateral step-ups",
      "single-leg Romanian deadlifts"
    ],
    "transferRationale": "These patterns overlap in lateral impulse and pelvis control, but ski-edge mechanics and glide speed remain sport-specific.",
    "exerciseSelectionCautions": "Control landing width and knee position; reduce bound distance if the pelvis drops or the foot rolls.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2020.00025/full",
      "https://www.nsca.com/education/articles/kinetic-select/strength-and-conditioning-for-alpine-skiing/"
    ],
    "sourceSummary": "The records use peer-reviewed alpine-skiing biomechanics and ski-jump landing research, supplemented by FIS technique materials and strength-and-conditioning guidance; evidence supports shared mechanical demands and muscle roles but does not establish direct causal performance gains from the listed gym exercises."
  },
  {
    "id": "skiing-13",
    "sportId": "skiing",
    "label": "cross-country push-off",
    "movementFamily": "diagonal and lateral propulsion",
    "bodyActions": [
      "load the ski edge, extend hip and knee, and plantarflex to propel the body while the opposite limb glides"
    ],
    "jointActions": [
      "hip extension",
      "knee extension",
      "ankle plantarflexion",
      "contralateral trunk rotation"
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps femoris",
      "soleus",
      "gastrocnemius"
    ],
    "assistingMuscles": [
      "hamstring muscles",
      "gluteus medius",
      "adductor magnus",
      "latissimus dorsi"
    ],
    "stabilizers": [
      "tibialis posterior",
      "peroneus longus",
      "deep hip rotators",
      "erector spinae",
      "oblique muscles"
    ],
    "contractionRoles": [
      "eccentric loading before push-off",
      "concentric hip-knee-ankle propulsion",
      "isometric glide stabilization"
    ],
    "commonForceOrSkillDemand": "repeated submaximal propulsion with unilateral balance and endurance",
    "recommendedExercisePatterns": [
      "single-leg strength",
      "sled drive",
      "calf-hip extension",
      "aerobic incline work"
    ],
    "recommendedExercises": [
      "sled pushes",
      "split squats",
      "single-leg calf raises",
      "incline treadmill work"
    ],
    "transferRationale": "The selected patterns share propulsion and fatigue-resistant postural control, while actual cross-country skiing depends on snow and technique.",
    "exerciseSelectionCautions": "Match volume to endurance phase and protect the Achilles and plantar structures when adding calf work.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://www.fis-ski.com/cross-country/technique",
      "https://www.nsca.com/education/articles/kinetic-select/strength-and-conditioning-for-alpine-skiing/"
    ],
    "sourceSummary": "The records use peer-reviewed alpine-skiing biomechanics and ski-jump landing research, supplemented by FIS technique materials and strength-and-conditioning guidance; evidence supports shared mechanical demands and muscle roles but does not establish direct causal performance gains from the listed gym exercises."
  },
  {
    "id": "skiing-14",
    "sportId": "skiing",
    "label": "double-pole drive",
    "movementFamily": "bilateral poling and hip-hinge power",
    "bodyActions": [
      "hinge at the hips and trunk, press both poles, and extend to propel the body"
    ],
    "jointActions": [
      "hip flexion-extension",
      "shoulder extension",
      "elbow extension",
      "trunk flexion-extension"
    ],
    "primeMovers": [
      "latissimus dorsi",
      "triceps brachii",
      "posterior deltoid",
      "gluteus maximus",
      "hamstring muscles"
    ],
    "assistingMuscles": [
      "pectoralis major",
      "serratus anterior",
      "rectus abdominis",
      "soleus"
    ],
    "stabilizers": [
      "rotator cuff muscles",
      "middle and lower trapezius",
      "erector spinae",
      "oblique muscles",
      "deep hip rotators"
    ],
    "contractionRoles": [
      "eccentric hinge loading",
      "concentric arm and hip drive",
      "isometric trunk force transmission"
    ],
    "commonForceOrSkillDemand": "repeated bilateral upper-body propulsion linked to hip-hinge power and trunk stiffness",
    "recommendedExercisePatterns": [
      "straight-arm pull",
      "hip hinge",
      "medicine-ball power"
    ],
    "recommendedExercises": [
      "cable straight-arm pulldowns",
      "deadlifts",
      "medicine-ball slams",
      "front-loaded carries"
    ],
    "transferRationale": "The exercises share hip-hinge force transfer and shoulder extension, but pole leverage and snow friction are not reproduced.",
    "exerciseSelectionCautions": "Maintain neutral spinal position and shoulder tolerance; avoid turning high-repetition poling into lumbar extension or shoulder irritation.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://www.fis-ski.com/cross-country/technique",
      "https://www.nsca.com/education/articles/kinetic-select/strength-and-conditioning-for-alpine-skiing/"
    ],
    "sourceSummary": "The records use peer-reviewed alpine-skiing biomechanics and ski-jump landing research, supplemented by FIS technique materials and strength-and-conditioning guidance; evidence supports shared mechanical demands and muscle roles but does not establish direct causal performance gains from the listed gym exercises."
  },
  {
    "id": "skiing-15",
    "sportId": "skiing",
    "label": "uphill stride",
    "movementFamily": "uphill locomotion and endurance power",
    "bodyActions": [
      "alternate leg drive and pole assistance against gravity while maintaining forward posture"
    ],
    "jointActions": [
      "hip extension",
      "knee extension",
      "ankle plantarflexion",
      "shoulder extension",
      "trunk anti-flexion"
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps femoris",
      "soleus",
      "gastrocnemius"
    ],
    "assistingMuscles": [
      "hamstring muscles",
      "latissimus dorsi",
      "triceps brachii",
      "gluteus medius"
    ],
    "stabilizers": [
      "tibialis posterior",
      "peroneus longus",
      "erector spinae",
      "oblique muscles",
      "scapular stabilizers"
    ],
    "contractionRoles": [
      "concentric propulsion",
      "eccentric recovery between steps",
      "isometric trunk and pelvic control"
    ],
    "commonForceOrSkillDemand": "sustained uphill force production with repeated unilateral transitions",
    "recommendedExercisePatterns": [
      "incline locomotion",
      "step-up",
      "split-stance drive",
      "upper-body pull"
    ],
    "recommendedExercises": [
      "incline treadmill work",
      "step-ups",
      "sled pushes",
      "alternating split-stance drives"
    ],
    "transferRationale": "Incline and step-up patterns share gravity-resisted propulsion and unilateral endurance, but not ski grip or pole timing.",
    "exerciseSelectionCautions": "Use gradual incline and volume progression; monitor calf, Achilles, and low-back fatigue.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://www.fis-ski.com/cross-country/technique",
      "https://www.nsca.com/education/articles/kinetic-select/strength-and-conditioning-for-alpine-skiing/"
    ],
    "sourceSummary": "The records use peer-reviewed alpine-skiing biomechanics and ski-jump landing research, supplemented by FIS technique materials and strength-and-conditioning guidance; evidence supports shared mechanical demands and muscle roles but does not establish direct causal performance gains from the listed gym exercises."
  },
  {
    "id": "skiing-16",
    "sportId": "skiing",
    "label": "downhill stabilization",
    "movementFamily": "dynamic postural stabilization",
    "bodyActions": [
      "maintain a flexed centered stance while regulating edge pressure and terrain perturbations"
    ],
    "jointActions": [
      "ankle dorsiflexion",
      "knee and hip flexion",
      "trunk anti-flexion and anti-rotation",
      "hip abduction control"
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus maximus",
      "soleus",
      "hamstring muscles"
    ],
    "assistingMuscles": [
      "gastrocnemius",
      "adductor magnus",
      "gluteus medius"
    ],
    "stabilizers": [
      "deep hip rotators",
      "tibialis posterior",
      "peroneus longus",
      "erector spinae",
      "oblique muscles"
    ],
    "contractionRoles": [
      "predominantly isometric stance support",
      "continuous eccentric terrain corrections",
      "concentric repositioning"
    ],
    "commonForceOrSkillDemand": "sustained isometric endurance with unpredictable perturbations",
    "recommendedExercisePatterns": [
      "isometric squat",
      "single-leg stance",
      "perturbation balance",
      "carry"
    ],
    "recommendedExercises": [
      "isometric squat holds",
      "split-squat isometrics",
      "single-leg balance",
      "suitcase carries"
    ],
    "transferRationale": "These drills develop posture and perturbation tolerance, but balance devices cannot recreate the speed and consequences of downhill skiing.",
    "exerciseSelectionCautions": "Prefer stable surfaces and controlled perturbations; unstable-surface training should not replace strength or technical skiing.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2020.00025/full",
      "https://www.nsca.com/education/articles/kinetic-select/strength-and-conditioning-for-alpine-skiing/"
    ],
    "sourceSummary": "The records use peer-reviewed alpine-skiing biomechanics and ski-jump landing research, supplemented by FIS technique materials and strength-and-conditioning guidance; evidence supports shared mechanical demands and muscle roles but does not establish direct causal performance gains from the listed gym exercises."
  },
  {
    "id": "skiing-17",
    "sportId": "skiing",
    "label": "rapid direction change",
    "movementFamily": "reactive change of direction",
    "bodyActions": [
      "decelerate, redirect the center of mass, and re-edge or steer the skis"
    ],
    "jointActions": [
      "ankle dorsiflexion and inversion-eversion",
      "knee flexion-extension",
      "hip abduction-adduction",
      "trunk anti-rotation"
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus maximus",
      "gluteus medius",
      "adductor magnus"
    ],
    "assistingMuscles": [
      "hamstring muscles",
      "soleus",
      "gastrocnemius",
      "tensor fasciae latae"
    ],
    "stabilizers": [
      "deep hip rotators",
      "tibialis posterior",
      "peroneus longus",
      "erector spinae",
      "oblique muscles"
    ],
    "contractionRoles": [
      "eccentric braking",
      "concentric redirection",
      "isometric trunk and foot control"
    ],
    "commonForceOrSkillDemand": "high-rate braking and reorientation under lateral and rotational forces",
    "recommendedExercisePatterns": [
      "planned cutting",
      "lateral bound",
      "deceleration step",
      "anti-rotation"
    ],
    "recommendedExercises": [
      "lateral shuffle-to-stick drills",
      "skater bounds",
      "deceleration steps",
      "Pallof presses"
    ],
    "transferRationale": "The exercises share braking, redirection, and trunk-control qualities; they do not establish ski-specific edge timing or visual decision-making.",
    "exerciseSelectionCautions": "Progress from planned to reactive work and from low to high speed; avoid fatigue-induced valgus or uncontrolled stopping.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2020.00025/full",
      "https://link.springer.com/article/10.1007/s40279-013-0132-z"
    ],
    "sourceSummary": "The records use peer-reviewed alpine-skiing biomechanics and ski-jump landing research, supplemented by FIS technique materials and strength-and-conditioning guidance; evidence supports shared mechanical demands and muscle roles but does not establish direct causal performance gains from the listed gym exercises."
  },
  {
    "id": "skiing-18",
    "sportId": "skiing",
    "label": "eccentric braking",
    "movementFamily": "eccentric deceleration",
    "bodyActions": [
      "increase knee, hip, and ankle flexion while applying edge pressure to reduce forward speed"
    ],
    "jointActions": [
      "ankle dorsiflexion",
      "knee flexion",
      "hip flexion",
      "trunk bracing"
    ],
    "primeMovers": [
      "quadriceps femoris",
      "gluteus maximus",
      "hamstring muscles",
      "soleus",
      "gastrocnemius"
    ],
    "assistingMuscles": [
      "adductor magnus",
      "gluteus medius",
      "tibialis anterior"
    ],
    "stabilizers": [
      "deep hip rotators",
      "tibialis posterior",
      "peroneus longus",
      "erector spinae",
      "oblique muscles"
    ],
    "contractionRoles": [
      "primarily eccentric force absorption",
      "isometric alignment control",
      "concentric reset"
    ],
    "commonForceOrSkillDemand": "high eccentric knee and hip loading while maintaining edge and balance",
    "recommendedExercisePatterns": [
      "slow-tempo split squat",
      "step-down",
      "reverse sled",
      "deceleration landing"
    ],
    "recommendedExercises": [
      "slow-tempo split squats",
      "controlled step-downs",
      "reverse sled drags",
      "drop landings"
    ],
    "transferRationale": "Eccentric lower-limb exercises share force absorption and posture demands, but snow speed and edge pressure remain unique constraints.",
    "exerciseSelectionCautions": "Manage eccentric volume and recovery; do not use downhill walking or drop landings when pain or poor control is present.",
    "evidenceConfidence": "high",
    "sources": [
      "https://journals.humankinetics.com/view/journals/jab/28/6/article-p655.xml",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6539877/"
    ],
    "sourceSummary": "The records use peer-reviewed alpine-skiing biomechanics and ski-jump landing research, supplemented by FIS technique materials and strength-and-conditioning guidance; evidence supports shared mechanical demands and muscle roles but does not establish direct causal performance gains from the listed gym exercises."
  },
  {
    "id": "skiing-19",
    "sportId": "skiing",
    "label": "single-leg stabilization",
    "movementFamily": "unilateral balance and glide control",
    "bodyActions": [
      "balance over one ski with controlled ankle, knee, hip, and trunk alignment"
    ],
    "jointActions": [
      "ankle inversion-eversion",
      "knee flexion",
      "hip abduction and rotation",
      "trunk anti-lateral-flexion"
    ],
    "primeMovers": [
      "gluteus medius",
      "gluteus maximus",
      "quadriceps femoris"
    ],
    "assistingMuscles": [
      "hamstring muscles",
      "soleus",
      "gastrocnemius",
      "adductor magnus"
    ],
    "stabilizers": [
      "deep hip rotators",
      "tibialis posterior",
      "peroneus longus",
      "intrinsic foot muscles",
      "oblique muscles"
    ],
    "contractionRoles": [
      "isometric support",
      "eccentric perturbation correction",
      "concentric recovery"
    ],
    "commonForceOrSkillDemand": "single-limb postural control under moving support and changing pressure",
    "recommendedExercisePatterns": [
      "single-leg strength",
      "balance",
      "carry",
      "hip control"
    ],
    "recommendedExercises": [
      "single-leg Romanian deadlifts",
      "single-leg squat-to-stick",
      "hip airplanes",
      "suitcase carries"
    ],
    "transferRationale": "These exercises train unilateral hip, foot, and trunk control, but a stable gym surface is less demanding than a moving ski-snow interface.",
    "exerciseSelectionCautions": "Use external support before adding load or eyes-closed challenges; prioritize quality over instability complexity.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2020.00025/full",
      "https://www.nsca.com/education/articles/kinetic-select/strength-and-conditioning-for-alpine-skiing/"
    ],
    "sourceSummary": "The records use peer-reviewed alpine-skiing biomechanics and ski-jump landing research, supplemented by FIS technique materials and strength-and-conditioning guidance; evidence supports shared mechanical demands and muscle roles but does not establish direct causal performance gains from the listed gym exercises."
  },
  {
    "id": "skiing-20",
    "sportId": "skiing",
    "label": "trunk anti-rotation",
    "movementFamily": "axial stability and force transmission",
    "bodyActions": [
      "resist unwanted torso rotation while the legs steer, edge, or transfer force"
    ],
    "jointActions": [
      "isometric lumbar and thoracic control",
      "hip rotation dissociation",
      "scapulothoracic stabilization",
      "pelvic control"
    ],
    "primeMovers": [
      "internal and external oblique muscles",
      "transversus abdominis",
      "multifidus muscles"
    ],
    "assistingMuscles": [
      "quadratus lumborum",
      "gluteus medius",
      "gluteus maximus",
      "serratus anterior"
    ],
    "stabilizers": [
      "erector spinae",
      "deep hip rotators",
      "middle and lower trapezius",
      "rotator cuff muscles"
    ],
    "contractionRoles": [
      "isometric anti-rotation",
      "co-contraction during edge loading",
      "controlled eccentric rotation when repositioning"
    ],
    "commonForceOrSkillDemand": "transmit lower-limb force while preserving torso orientation and balance",
    "recommendedExercisePatterns": [
      "anti-rotation press",
      "unilateral carry",
      "split-stance rotation",
      "cable row"
    ],
    "recommendedExercises": [
      "Pallof presses",
      "suitcase carries",
      "one-arm cable rows",
      "split-stance rotational strength"
    ],
    "transferRationale": "Anti-rotation exercises share trunk stiffness and force-transfer demands, but they cannot reproduce the dynamic coupling of ski edging and terrain.",
    "exerciseSelectionCautions": "Use loads that permit normal breathing and neutral ribs-over-pelvis posture; avoid treating maximal trunk stiffness as universally beneficial.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://link.springer.com/article/10.1007/s40279-013-0132-z",
      "https://www.nsca.com/education/articles/kinetic-select/strength-and-conditioning-for-alpine-skiing/"
    ],
    "sourceSummary": "The records use peer-reviewed alpine-skiing biomechanics and ski-jump landing research, supplemented by FIS technique materials and strength-and-conditioning guidance; evidence supports shared mechanical demands and muscle roles but does not establish direct causal performance gains from the listed gym exercises."
  },
  {
    "id": "olympic-weightlifting-1",
    "sportId": "olympic-weightlifting",
    "label": "first pull",
    "movementFamily": "pulling/first-pull strength",
    "bodyActions": [
      "floor-to-knee bar lift with controlled knee extension and a steady torso",
      "the bar stays close to the shins"
    ],
    "jointActions": [
      "knee extension",
      "hip extension begins",
      "ankle dorsiflexion is controlled",
      "shoulder flexion is held",
      "spinal and scapular position is braced"
    ],
    "primeMovers": [
      "quadriceps",
      "gluteus maximus",
      "adductor magnus",
      "erector spinae"
    ],
    "assistingMuscles": [
      "latissimus dorsi",
      "hamstring muscles",
      "rectus abdominis",
      "transverse abdominis",
      "trapezius",
      "forearm flexor muscles"
    ],
    "stabilizers": [
      "lumbar multifidus",
      "obliquus externus abdominis",
      "obliquus internus abdominis",
      "gluteus medius",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "quadriceps and hip extensors shorten",
      "hamstrings lengthen or hold under tension",
      "erector spinae, latissimus dorsi, abdominals, and grip act mainly isometrically"
    ],
    "commonForceOrSkillDemand": "high-force bilateral pull with bar-path precision, trunk stiffness, and positional strength",
    "recommendedExercisePatterns": [
      "deadlift",
      "clean pull",
      "Romanian deadlift",
      "front squat"
    ],
    "recommendedExercises": [
      "deadlift",
      "clean pull",
      "Romanian deadlift",
      "front squat"
    ],
    "transferRationale": "The shared deadlift-like start and close-bar pull make these patterns useful for general force and position practice, but they do not reproduce the timing or technical constraints of a competition lift.",
    "exerciseSelectionCautions": "Use loads and ranges that preserve a neutral spine and bar proximity; do not infer that stronger deadlifting guarantees a better first pull.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6724589/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9919757/",
      "https://www.iwf.net/technical-and-competition-rules"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Olympic-lift biomechanics studies, a field-based snatch assessment, and International Weightlifting Federation rules; confidence reflects strong phase-mechanics evidence while gym-transfer rationales remain mechanical hypotheses rather than causal performance claims."
  },
  {
    "id": "olympic-weightlifting-2",
    "sportId": "olympic-weightlifting",
    "label": "second pull",
    "movementFamily": "explosive extension/high-pull",
    "bodyActions": [
      "bar passes the knees and accelerates through the power position with rapid hip, knee, and ankle extension and shoulder elevation"
    ],
    "jointActions": [
      "hip extension",
      "knee extension",
      "plantarflexion",
      "scapular elevation",
      "elbow flexion begins after extension"
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps",
      "adductor magnus",
      "gastrocnemius",
      "soleus",
      "trapezius"
    ],
    "assistingMuscles": [
      "hamstring muscles",
      "erector spinae",
      "latissimus dorsi",
      "deltoid muscles",
      "forearm flexor muscles"
    ],
    "stabilizers": [
      "rectus abdominis",
      "obliquus internus abdominis",
      "gluteus medius",
      "intrinsic foot muscles",
      "rotator cuff"
    ],
    "contractionRoles": [
      "hip, knee, and ankle extensors shorten rapidly",
      "trapezius elevates the scapula",
      "trunk and lats brace isometrically"
    ],
    "commonForceOrSkillDemand": "very high rate of force development and vertical bar acceleration",
    "recommendedExercisePatterns": [
      "clean pull",
      "snatch pull",
      "hang clean",
      "jump shrug"
    ],
    "recommendedExercises": [
      "clean pull",
      "snatch pull",
      "hang clean",
      "jump shrug"
    ],
    "transferRationale": "Pulling derivatives overlap the extension and bar-acceleration demands and allow load or height to be adjusted, while technical carryover remains indirect.",
    "exerciseSelectionCautions": "Do not turn the movement into an early arm pull; limit load if the bar drifts forward or the athlete loses whole-foot pressure.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6724589/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9919757/",
      "https://www.iwf.net/technical-and-competition-rules"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Olympic-lift biomechanics studies, a field-based snatch assessment, and International Weightlifting Federation rules; confidence reflects strong phase-mechanics evidence while gym-transfer rationales remain mechanical hypotheses rather than causal performance claims."
  },
  {
    "id": "olympic-weightlifting-3",
    "sportId": "olympic-weightlifting",
    "label": "triple extension",
    "movementFamily": "explosive triple-extension",
    "bodyActions": [
      "synchronized hip, knee, and ankle extension projects the bar and body vertically from the power position"
    ],
    "jointActions": [
      "hip extension",
      "knee extension",
      "plantarflexion",
      "scapular elevation",
      "torso remains braced"
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps",
      "gastrocnemius",
      "soleus",
      "adductor magnus"
    ],
    "assistingMuscles": [
      "hamstring muscles",
      "trapezius",
      "erector spinae",
      "latissimus dorsi",
      "deltoid muscles"
    ],
    "stabilizers": [
      "rectus abdominis",
      "oblique abdominal muscles",
      "gluteus medius",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "lower-limb extensors contract concentrically at high velocity",
      "trunk and shoulder girdle stabilize isometrically"
    ],
    "commonForceOrSkillDemand": "whole-body sequencing, vertical impulse, and high-velocity force expression",
    "recommendedExercisePatterns": [
      "clean pull",
      "snatch pull",
      "jump shrug",
      "push press"
    ],
    "recommendedExercises": [
      "clean pull",
      "snatch pull",
      "jump shrug",
      "push press"
    ],
    "transferRationale": "These exercises share coordinated lower-limb extension and vertical force direction, but no auxiliary drill alone establishes complete lift timing.",
    "exerciseSelectionCautions": "Avoid cueing a deliberate exaggerated jump or plantarflexion if it disrupts bar path; progress velocity and load separately.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6724589/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9919757/",
      "https://www.iwf.net/technical-and-competition-rules"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Olympic-lift biomechanics studies, a field-based snatch assessment, and International Weightlifting Federation rules; confidence reflects strong phase-mechanics evidence while gym-transfer rationales remain mechanical hypotheses rather than causal performance claims."
  },
  {
    "id": "olympic-weightlifting-4",
    "sportId": "olympic-weightlifting",
    "label": "clean pull",
    "movementFamily": "pulling/high-pull",
    "bodyActions": [
      "barbell pull from floor or blocks with progressive knee and hip extension, then shoulder elevation"
    ],
    "jointActions": [
      "knee extension",
      "hip extension",
      "plantarflexion",
      "scapular elevation",
      "elbows may flex late"
    ],
    "primeMovers": [
      "quadriceps",
      "gluteus maximus",
      "adductor magnus",
      "trapezius",
      "gastrocnemius",
      "soleus"
    ],
    "assistingMuscles": [
      "hamstring muscles",
      "erector spinae",
      "latissimus dorsi",
      "forearm flexor muscles",
      "deltoid muscles"
    ],
    "stabilizers": [
      "abdominal wall",
      "gluteus medius",
      "intrinsic foot muscles",
      "rotator cuff"
    ],
    "contractionRoles": [
      "lower-body and trapezius shortening",
      "spinal extensors, lats, abdominals, and grip largely isometric"
    ],
    "commonForceOrSkillDemand": "heavy-to-fast pulling with close-bar control and forceful finish",
    "recommendedExercisePatterns": [
      "deadlift",
      "clean pull",
      "hang clean",
      "barbell shrug"
    ],
    "recommendedExercises": [
      "deadlift",
      "clean pull",
      "hang clean",
      "barbell shrug"
    ],
    "transferRationale": "The clean pull is itself a competition-lift derivative; deadlifts and hang variations can target adjacent positions, but transfer is mechanical rather than guaranteed.",
    "exerciseSelectionCautions": "Keep the bar close and shoulders over it early; avoid excessive shrugging or lumbar extension to compensate for load.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6724589/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9919757/",
      "https://www.iwf.net/technical-and-competition-rules"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Olympic-lift biomechanics studies, a field-based snatch assessment, and International Weightlifting Federation rules; confidence reflects strong phase-mechanics evidence while gym-transfer rationales remain mechanical hypotheses rather than causal performance claims."
  },
  {
    "id": "olympic-weightlifting-5",
    "sportId": "olympic-weightlifting",
    "label": "snatch pull",
    "movementFamily": "wide-grip explosive pull",
    "bodyActions": [
      "wide-grip pull from floor through the second pull with vertical acceleration and active shoulder elevation"
    ],
    "jointActions": [
      "knee and hip extension",
      "plantarflexion",
      "scapular elevation",
      "shoulder external-rotation control",
      "elbows remain long until late"
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps",
      "adductor magnus",
      "trapezius",
      "gastrocnemius",
      "soleus"
    ],
    "assistingMuscles": [
      "hamstring muscles",
      "erector spinae",
      "latissimus dorsi",
      "deltoid muscles",
      "forearm flexor muscles"
    ],
    "stabilizers": [
      "rotator cuff",
      "serratus anterior",
      "abdominal wall",
      "gluteus medius",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "lower-body extensors and trapezius shorten rapidly",
      "trunk, lats, cuff, and grip stabilize"
    ],
    "commonForceOrSkillDemand": "wide-grip bar acceleration, balance, and high-rate extension",
    "recommendedExercisePatterns": [
      "snatch pull",
      "hang snatch",
      "overhead squat",
      "Romanian deadlift"
    ],
    "recommendedExercises": [
      "snatch pull",
      "hang snatch",
      "overhead squat",
      "Romanian deadlift"
    ],
    "transferRationale": "The derivative preserves the wide grip and pull trajectory; overhead squats address receiving positions, not the pull itself.",
    "exerciseSelectionCautions": "Use a grip width and load that do not provoke shoulder or wrist symptoms; avoid early elbow bend and forward bar displacement.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6724589/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9919757/",
      "https://www.iwf.net/technical-and-competition-rules"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Olympic-lift biomechanics studies, a field-based snatch assessment, and International Weightlifting Federation rules; confidence reflects strong phase-mechanics evidence while gym-transfer rationales remain mechanical hypotheses rather than causal performance claims."
  },
  {
    "id": "olympic-weightlifting-6",
    "sportId": "olympic-weightlifting",
    "label": "power clean",
    "movementFamily": "pull-under/front-rack catch",
    "bodyActions": [
      "explosive pull, rapid turnover, and catch above parallel in a front rack"
    ],
    "jointActions": [
      "hip, knee, and ankle extension",
      "elbow flexion/turnover",
      "wrist extension",
      "hip and knee flexion to absorb"
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps",
      "trapezius",
      "hamstring muscles",
      "gastrocnemius"
    ],
    "assistingMuscles": [
      "deltoid muscles",
      "brachialis",
      "biceps brachii",
      "erector spinae",
      "latissimus dorsi",
      "forearm flexor muscles"
    ],
    "stabilizers": [
      "rotator cuff",
      "abdominal wall",
      "upper trapezius",
      "wrists",
      "intrinsic foot muscles"
    ],
    "contractionRoles": [
      "pull and extension are concentric",
      "catch uses eccentric leg braking",
      "trunk and rack muscles stabilize"
    ],
    "commonForceOrSkillDemand": "high-velocity pull-under, turnover timing, and impact absorption",
    "recommendedExercisePatterns": [
      "hang clean",
      "clean pull",
      "front squat",
      "push press"
    ],
    "recommendedExercises": [
      "hang clean",
      "clean pull",
      "front squat",
      "push press"
    ],
    "transferRationale": "Hang cleans and clean pulls scale the pull and turnover; front squats develop the receiving strength, without proving direct performance gains.",
    "exerciseSelectionCautions": "Teach the rack and safe bail-out first; do not force wrist extension or catch depth when mobility or load control is inadequate.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6724589/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9919757/",
      "https://www.iwf.net/technical-and-competition-rules"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Olympic-lift biomechanics studies, a field-based snatch assessment, and International Weightlifting Federation rules; confidence reflects strong phase-mechanics evidence while gym-transfer rationales remain mechanical hypotheses rather than causal performance claims."
  },
  {
    "id": "olympic-weightlifting-7",
    "sportId": "olympic-weightlifting",
    "label": "squat clean",
    "movementFamily": "pull-under/deep squat",
    "bodyActions": [
      "explosive clean pull followed by turnover into a deep front-squat catch and stand"
    ],
    "jointActions": [
      "hip, knee, and ankle extension",
      "elbow turnover",
      "deep hip and knee flexion",
      "ankle dorsiflexion",
      "trunk extension control"
    ],
    "primeMovers": [
      "quadriceps",
      "gluteus maximus",
      "adductor magnus",
      "hamstring muscles",
      "trapezius"
    ],
    "assistingMuscles": [
      "erector spinae",
      "abdominal wall",
      "latissimus dorsi",
      "deltoid muscles",
      "brachialis",
      "soleus"
    ],
    "stabilizers": [
      "rotator cuff",
      "gluteus medius",
      "intrinsic foot muscles",
      "wrists",
      "upper back"
    ],
    "contractionRoles": [
      "pull is concentric",
      "descent and catch are eccentric",
      "recovery is concentric",
      "trunk and rack are isometric"
    ],
    "commonForceOrSkillDemand": "maximal coordination of pull-under, deep squat mobility, and recovery strength",
    "recommendedExercisePatterns": [
      "hang clean",
      "front squat",
      "clean pull",
      "overhead squat"
    ],
    "recommendedExercises": [
      "hang clean",
      "front squat",
      "clean pull",
      "overhead squat"
    ],
    "transferRationale": "Front squats and hang cleans target receiving strength and timing components; they remain partial substitutes for the full skill.",
    "exerciseSelectionCautions": "Require stable feet, knees tracking with toes, and a secure rack; reduce depth or load if balance, hip, ankle, or wrist control fails.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6724589/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9919757/",
      "https://www.iwf.net/technical-and-competition-rules"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Olympic-lift biomechanics studies, a field-based snatch assessment, and International Weightlifting Federation rules; confidence reflects strong phase-mechanics evidence while gym-transfer rationales remain mechanical hypotheses rather than causal performance claims."
  },
  {
    "id": "olympic-weightlifting-8",
    "sportId": "olympic-weightlifting",
    "label": "power snatch",
    "movementFamily": "pull-under/overhead catch",
    "bodyActions": [
      "wide-grip pull, turnover, and overhead catch above parallel with an active shoulder position"
    ],
    "jointActions": [
      "hip, knee, and ankle extension",
      "shoulder flexion and external-rotation control",
      "elbow extension",
      "hip and knee flexion in catch"
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps",
      "trapezius",
      "deltoid muscles",
      "triceps brachii"
    ],
    "assistingMuscles": [
      "hamstring muscles",
      "erector spinae",
      "latissimus dorsi",
      "serratus anterior",
      "forearm flexor muscles"
    ],
    "stabilizers": [
      "rotator cuff",
      "abdominal wall",
      "gluteus medius",
      "intrinsic foot muscles",
      "wrists"
    ],
    "contractionRoles": [
      "extension and pull are concentric",
      "catch absorbs eccentrically",
      "elbows and shoulders fix isometrically"
    ],
    "commonForceOrSkillDemand": "high-speed turnover, overhead receiving, and bar-path precision",
    "recommendedExercisePatterns": [
      "hang snatch",
      "snatch pull",
      "overhead squat",
      "push press"
    ],
    "recommendedExercises": [
      "hang snatch",
      "snatch pull",
      "overhead squat",
      "push press"
    ],
    "transferRationale": "Hang snatches and snatch pulls preserve parts of the power-snatch trajectory; overhead squats reinforce receiving alignment, not speed or timing.",
    "exerciseSelectionCautions": "Screen shoulder, thoracic, wrist, hip, and ankle mobility; use a manageable height and never chase a catch by leaning or softening the elbows.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6724589/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9919757/",
      "https://www.iwf.net/technical-and-competition-rules"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Olympic-lift biomechanics studies, a field-based snatch assessment, and International Weightlifting Federation rules; confidence reflects strong phase-mechanics evidence while gym-transfer rationales remain mechanical hypotheses rather than causal performance claims."
  },
  {
    "id": "olympic-weightlifting-9",
    "sportId": "olympic-weightlifting",
    "label": "squat snatch",
    "movementFamily": "pull-under/deep overhead squat",
    "bodyActions": [
      "wide-grip pull, rapid turnover, deep overhead-squat catch, and controlled recovery"
    ],
    "jointActions": [
      "hip, knee, and ankle extension",
      "shoulder flexion/external rotation",
      "elbow extension",
      "deep hip and knee flexion",
      "ankle dorsiflexion"
    ],
    "primeMovers": [
      "gluteus maximus",
      "quadriceps",
      "adductor magnus",
      "trapezius",
      "deltoid muscles",
      "triceps brachii"
    ],
    "assistingMuscles": [
      "hamstring muscles",
      "erector spinae",
      "latissimus dorsi",
      "serratus anterior",
      "soleus",
      "forearm flexor muscles"
    ],
    "stabilizers": [
      "rotator cuff",
      "abdominal wall",
      "gluteus medius",
      "intrinsic foot muscles",
      "wrists",
      "ankle stabilizers"
    ],
    "contractionRoles": [
      "pull and recovery are concentric",
      "descent/catch eccentric",
      "shoulder, trunk, and foot position largely isometric"
    ],
    "commonForceOrSkillDemand": "maximum coordination, mobility, speed under the bar, and overhead stability",
    "recommendedExercisePatterns": [
      "hang snatch",
      "snatch pull",
      "overhead squat",
      "front squat"
    ],
    "recommendedExercises": [
      "hang snatch",
      "snatch pull",
      "overhead squat",
      "front squat"
    ],
    "transferRationale": "These patterns share selected pull, squat, and overhead positions; the full snatch still requires specialized coaching and cannot be replaced by general strength work.",
    "exerciseSelectionCautions": "Use technique loads, stable overhead positions, and a safe miss strategy; stop if the bar is not stacked over the mid-foot or the knees collapse.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6724589/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9919757/",
      "https://www.iwf.net/technical-and-competition-rules"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Olympic-lift biomechanics studies, a field-based snatch assessment, and International Weightlifting Federation rules; confidence reflects strong phase-mechanics evidence while gym-transfer rationales remain mechanical hypotheses rather than causal performance claims."
  },
  {
    "id": "olympic-weightlifting-10",
    "sportId": "olympic-weightlifting",
    "label": "clean catch",
    "movementFamily": "front-rack catch",
    "bodyActions": [
      "rapid elbow turnover and front-rack reception while hips and knees flex to absorb the bar"
    ],
    "jointActions": [
      "elbow flexion then rapid extension/turnover",
      "hip and knee flexion",
      "ankle dorsiflexion",
      "trunk bracing"
    ],
    "primeMovers": [
      "quadriceps",
      "gluteus maximus",
      "upper trapezius",
      "deltoid muscles"
    ],
    "assistingMuscles": [
      "brachialis",
      "biceps brachii",
      "erector spinae",
      "latissimus dorsi",
      "abdominal wall",
      "forearm flexor muscles"
    ],
    "stabilizers": [
      "rotator cuff",
      "wrists",
      "gluteus medius",
      "intrinsic foot muscles",
      "thoracic extensors"
    ],
    "contractionRoles": [
      "lower limbs brake eccentrically",
      "shoulder and trunk fix isometrically",
      "elbows rotate rapidly"
    ],
    "commonForceOrSkillDemand": "timed impact absorption and stable front-rack reception",
    "recommendedExercisePatterns": [
      "hang clean",
      "front squat",
      "clean pull",
      "push press"
    ],
    "recommendedExercises": [
      "hang clean",
      "front squat",
      "clean pull",
      "push press"
    ],
    "transferRationale": "Front squats develop rack-supported catch strength and hang cleans provide turnover practice; neither establishes the complete catch under maximal speed.",
    "exerciseSelectionCautions": "Do not catch on the hands or permit elbows to drop; regress load and depth if wrists, elbows, shoulders, or knees cannot remain controlled.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6724589/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9919757/",
      "https://www.iwf.net/technical-and-competition-rules"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Olympic-lift biomechanics studies, a field-based snatch assessment, and International Weightlifting Federation rules; confidence reflects strong phase-mechanics evidence while gym-transfer rationales remain mechanical hypotheses rather than causal performance claims."
  },
  {
    "id": "olympic-weightlifting-11",
    "sportId": "olympic-weightlifting",
    "label": "snatch catch",
    "movementFamily": "overhead catch",
    "bodyActions": [
      "rapid turnover into overhead reception with hip and knee flexion and active shoulder fixation"
    ],
    "jointActions": [
      "shoulder flexion/external rotation",
      "elbow extension",
      "hip and knee flexion",
      "ankle dorsiflexion",
      "scapular upward rotation"
    ],
    "primeMovers": [
      "deltoid muscles",
      "triceps brachii",
      "trapezius",
      "serratus anterior",
      "quadriceps",
      "gluteus maximus"
    ],
    "assistingMuscles": [
      "rotator cuff",
      "latissimus dorsi",
      "erector spinae",
      "abdominal wall",
      "forearm flexor muscles"
    ],
    "stabilizers": [
      "gluteus medius",
      "intrinsic foot muscles",
      "wrists",
      "thoracic extensors",
      "ankle stabilizers"
    ],
    "contractionRoles": [
      "legs absorb eccentrically while arms, shoulders, trunk, and feet stabilize isometrically"
    ],
    "commonForceOrSkillDemand": "rapid overhead fixation and precise base-of-support control",
    "recommendedExercisePatterns": [
      "hang snatch",
      "overhead squat",
      "snatch pull",
      "push press"
    ],
    "recommendedExercises": [
      "hang snatch",
      "overhead squat",
      "snatch pull",
      "push press"
    ],
    "transferRationale": "Overhead squats and snatch variations share receiving alignment; they do not demonstrate that a stronger overhead hold causes better snatch outcomes.",
    "exerciseSelectionCautions": "Require active elbows and a stacked bar; avoid painful end ranges, unstable feet, or attempts to rescue a forward/backward miss.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6724589/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9919757/",
      "https://www.iwf.net/technical-and-competition-rules"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Olympic-lift biomechanics studies, a field-based snatch assessment, and International Weightlifting Federation rules; confidence reflects strong phase-mechanics evidence while gym-transfer rationales remain mechanical hypotheses rather than causal performance claims."
  },
  {
    "id": "olympic-weightlifting-12",
    "sportId": "olympic-weightlifting",
    "label": "front-squat recovery",
    "movementFamily": "squat recovery/front-loaded strength",
    "bodyActions": [
      "rise from the clean catch while maintaining an upright torso and front-rack bar position"
    ],
    "jointActions": [
      "knee extension",
      "hip extension",
      "ankle plantarflexion",
      "thoracic extension is held",
      "elbows remain elevated"
    ],
    "primeMovers": [
      "quadriceps",
      "gluteus maximus",
      "adductor magnus"
    ],
    "assistingMuscles": [
      "erector spinae",
      "abdominal wall",
      "trapezius",
      "latissimus dorsi",
      "soleus"
    ],
    "stabilizers": [
      "gluteus medius",
      "intrinsic foot muscles",
      "wrists",
      "upper back stabilizers"
    ],
    "contractionRoles": [
      "quadriceps and hip extensors shorten",
      "trunk, upper back, and rack stabilize isometrically"
    ],
    "commonForceOrSkillDemand": "front-loaded concentric strength from a deep position",
    "recommendedExercisePatterns": [
      "front squat",
      "clean pull",
      "split squat",
      "back squat"
    ],
    "recommendedExercises": [
      "front squat",
      "clean pull",
      "split squat",
      "back squat"
    ],
    "transferRationale": "Front squats most directly train the recovery pattern; unilateral squats add leg capacity but differ in balance and rack mechanics.",
    "exerciseSelectionCautions": "Maintain knee tracking and a rigid rack; avoid grinding repetitions or depth that causes pelvic collapse and lumbar compensation.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6724589/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9919757/",
      "https://www.iwf.net/technical-and-competition-rules"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Olympic-lift biomechanics studies, a field-based snatch assessment, and International Weightlifting Federation rules; confidence reflects strong phase-mechanics evidence while gym-transfer rationales remain mechanical hypotheses rather than causal performance claims."
  },
  {
    "id": "olympic-weightlifting-13",
    "sportId": "olympic-weightlifting",
    "label": "overhead-squat stabilization",
    "movementFamily": "overhead squat/positional stability",
    "bodyActions": [
      "hold or move through a squat with the bar stacked over the mid-foot and shoulders actively elevated"
    ],
    "jointActions": [
      "hip and knee flexion/extension",
      "ankle dorsiflexion",
      "shoulder flexion/external rotation",
      "scapular upward rotation",
      "elbow extension"
    ],
    "primeMovers": [
      "quadriceps",
      "gluteus maximus",
      "adductor magnus",
      "deltoid muscles",
      "trapezius",
      "serratus anterior"
    ],
    "assistingMuscles": [
      "rotator cuff",
      "triceps brachii",
      "latissimus dorsi",
      "erector spinae",
      "abdominal wall",
      "soleus"
    ],
    "stabilizers": [
      "gluteus medius",
      "intrinsic foot muscles",
      "wrists",
      "thoracic extensors",
      "ankle stabilizers"
    ],
    "contractionRoles": [
      "legs move eccentrically/concentrically",
      "overhead, trunk, and foot systems are predominantly isometric"
    ],
    "commonForceOrSkillDemand": "overhead mobility, balance, and positional stiffness under load",
    "recommendedExercisePatterns": [
      "overhead squat",
      "squat snatch",
      "snatch pull",
      "split squat"
    ],
    "recommendedExercises": [
      "overhead squat",
      "squat snatch",
      "snatch pull",
      "split squat"
    ],
    "transferRationale": "The overhead squat directly exposes receiving alignment and control; snatch pulls and split squats address complementary qualities only.",
    "exerciseSelectionCautions": "Use a dowel or light bar until mobility and balance are adequate; do not force depth or lumbar extension to keep the bar overhead.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6724589/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9919757/",
      "https://www.iwf.net/technical-and-competition-rules"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Olympic-lift biomechanics studies, a field-based snatch assessment, and International Weightlifting Federation rules; confidence reflects strong phase-mechanics evidence while gym-transfer rationales remain mechanical hypotheses rather than causal performance claims."
  },
  {
    "id": "olympic-weightlifting-14",
    "sportId": "olympic-weightlifting",
    "label": "split jerk",
    "movementFamily": "split-stance overhead power",
    "bodyActions": [
      "dip-drive propels the bar, feet split rapidly, and the athlete receives and stabilizes overhead"
    ],
    "jointActions": [
      "knee and hip extension",
      "plantarflexion",
      "elbow extension",
      "shoulder flexion",
      "hip/knee flexion during split landing"
    ],
    "primeMovers": [
      "quadriceps",
      "gluteus maximus",
      "gastrocnemius",
      "soleus",
      "triceps brachii",
      "deltoid muscles"
    ],
    "assistingMuscles": [
      "trapezius",
      "serratus anterior",
      "abdominal wall",
      "erector spinae",
      "hip adductors",
      "forearm flexor muscles"
    ],
    "stabilizers": [
      "rotator cuff",
      "gluteus medius",
      "intrinsic foot muscles",
      "ankle stabilizers",
      "wrists"
    ],
    "contractionRoles": [
      "dip-drive is concentric",
      "landing absorbs eccentrically",
      "overhead and split base stabilize isometrically"
    ],
    "commonForceOrSkillDemand": "high-rate vertical impulse, foot speed, and unilateral braking/stability",
    "recommendedExercisePatterns": [
      "push press",
      "push jerk",
      "jerk drive",
      "split squat"
    ],
    "recommendedExercises": [
      "push press",
      "push jerk",
      "jerk drive",
      "split squat"
    ],
    "transferRationale": "Push presses and jerk drives train propulsion while split squats train the receiving base; specialized timing and footwork remain lift-specific.",
    "exerciseSelectionCautions": "Practice foot placement and recovery before heavy loading; protect the knees and hips from uncontrolled split depth or valgus.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6724589/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9919757/",
      "https://www.iwf.net/technical-and-competition-rules"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Olympic-lift biomechanics studies, a field-based snatch assessment, and International Weightlifting Federation rules; confidence reflects strong phase-mechanics evidence while gym-transfer rationales remain mechanical hypotheses rather than causal performance claims."
  },
  {
    "id": "olympic-weightlifting-15",
    "sportId": "olympic-weightlifting",
    "label": "power jerk",
    "movementFamily": "bilateral jerk/overhead power",
    "bodyActions": [
      "vertical dip-drive followed by a two-foot re-bent-knee catch and overhead fixation"
    ],
    "jointActions": [
      "knee and hip extension",
      "plantarflexion",
      "elbow extension",
      "shoulder flexion",
      "knee/hip flexion in catch"
    ],
    "primeMovers": [
      "quadriceps",
      "gluteus maximus",
      "gastrocnemius",
      "soleus",
      "triceps brachii",
      "deltoid muscles"
    ],
    "assistingMuscles": [
      "trapezius",
      "serratus anterior",
      "abdominal wall",
      "erector spinae",
      "rotator cuff",
      "forearm flexor muscles"
    ],
    "stabilizers": [
      "gluteus medius",
      "intrinsic foot muscles",
      "wrists",
      "ankle stabilizers",
      "latissimus dorsi"
    ],
    "contractionRoles": [
      "leg drive and lockout are concentric",
      "catch absorbs eccentrically",
      "trunk, shoulder, and feet stabilize"
    ],
    "commonForceOrSkillDemand": "bilateral vertical impulse with fast re-bend and overhead fixation",
    "recommendedExercisePatterns": [
      "push press",
      "push jerk",
      "jerk drive",
      "front squat"
    ],
    "recommendedExercises": [
      "push press",
      "push jerk",
      "jerk drive",
      "front squat"
    ],
    "transferRationale": "Push jerk and jerk-drive work share propulsion and receiving concepts; front squats support the catch but do not replicate the ballistic timing.",
    "exerciseSelectionCautions": "Keep the dip vertical and land balanced; avoid excessive load if the elbows soften or the knees buckle on reception.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6724589/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9919757/",
      "https://www.iwf.net/technical-and-competition-rules"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Olympic-lift biomechanics studies, a field-based snatch assessment, and International Weightlifting Federation rules; confidence reflects strong phase-mechanics evidence while gym-transfer rationales remain mechanical hypotheses rather than causal performance claims."
  },
  {
    "id": "olympic-weightlifting-16",
    "sportId": "olympic-weightlifting",
    "label": "push jerk",
    "movementFamily": "dip-drive/overhead catch",
    "bodyActions": [
      "shallow dip-drive launches the bar, then knees re-bend to receive it overhead"
    ],
    "jointActions": [
      "knee and hip extension",
      "plantarflexion",
      "elbow extension",
      "shoulder flexion",
      "eccentric knee/hip flexion in catch"
    ],
    "primeMovers": [
      "quadriceps",
      "gluteus maximus",
      "gastrocnemius",
      "soleus",
      "triceps brachii",
      "deltoid muscles"
    ],
    "assistingMuscles": [
      "trapezius",
      "serratus anterior",
      "abdominal wall",
      "erector spinae",
      "rotator cuff",
      "forearm flexor muscles"
    ],
    "stabilizers": [
      "gluteus medius",
      "intrinsic foot muscles",
      "wrists",
      "ankle stabilizers",
      "latissimus dorsi"
    ],
    "contractionRoles": [
      "leg drive and lockout shorten",
      "catch and knee re-bend absorb eccentrically",
      "overhead system fixes isometrically"
    ],
    "commonForceOrSkillDemand": "coordinated dip-drive, press-under, and balanced two-foot catch",
    "recommendedExercisePatterns": [
      "push jerk",
      "push press",
      "jerk drive",
      "front squat"
    ],
    "recommendedExercises": [
      "push jerk",
      "push press",
      "jerk drive",
      "front squat"
    ],
    "transferRationale": "These exercises overlap the jerk's leg-driven propulsion and catch strength; transfer is a programming rationale, not a causal claim.",
    "exerciseSelectionCautions": "Do not turn the dip into a forward bow; use a stable rack and stop if the landing is asymmetrical or the bar is not centered.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6724589/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9919757/",
      "https://www.iwf.net/technical-and-competition-rules"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Olympic-lift biomechanics studies, a field-based snatch assessment, and International Weightlifting Federation rules; confidence reflects strong phase-mechanics evidence while gym-transfer rationales remain mechanical hypotheses rather than causal performance claims."
  },
  {
    "id": "olympic-weightlifting-17",
    "sportId": "olympic-weightlifting",
    "label": "jerk dip",
    "movementFamily": "dip-and-drive preparation",
    "bodyActions": [
      "controlled partial knee and hip flexion under a racked bar while the torso remains vertical"
    ],
    "jointActions": [
      "knee and hip flexion",
      "ankle dorsiflexion",
      "trunk and scapular position held"
    ],
    "primeMovers": [
      "quadriceps",
      "gluteus maximus",
      "soleus"
    ],
    "assistingMuscles": [
      "erector spinae",
      "abdominal wall",
      "trapezius",
      "latissimus dorsi",
      "forearm flexor muscles"
    ],
    "stabilizers": [
      "gluteus medius",
      "intrinsic foot muscles",
      "upper back stabilizers",
      "wrists"
    ],
    "contractionRoles": [
      "quadriceps and hip extensors lengthen eccentrically",
      "trunk and rack stabilize isometrically"
    ],
    "commonForceOrSkillDemand": "repeatable dip depth, vertical posture, and elastic loading",
    "recommendedExercisePatterns": [
      "front squat",
      "push press",
      "jerk drive",
      "split squat"
    ],
    "recommendedExercises": [
      "front squat",
      "push press",
      "jerk drive",
      "split squat"
    ],
    "transferRationale": "Front squats provide loaded leg strength and push presses add the dip-drive sequence, but neither guarantees a consistent jerk dip.",
    "exerciseSelectionCautions": "Use a light-to-moderate load and vertical dip; avoid rebounding through pain or allowing the chest and bar to pitch forward.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6724589/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9919757/",
      "https://www.iwf.net/technical-and-competition-rules"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Olympic-lift biomechanics studies, a field-based snatch assessment, and International Weightlifting Federation rules; confidence reflects strong phase-mechanics evidence while gym-transfer rationales remain mechanical hypotheses rather than causal performance claims."
  },
  {
    "id": "olympic-weightlifting-18",
    "sportId": "olympic-weightlifting",
    "label": "jerk drive",
    "movementFamily": "dip-drive propulsion",
    "bodyActions": [
      "forceful reversal from the dip into vertical leg extension to elevate the racked bar"
    ],
    "jointActions": [
      "knee and hip extension",
      "plantarflexion",
      "shoulder and elbow position held until press-under"
    ],
    "primeMovers": [
      "quadriceps",
      "gluteus maximus",
      "gastrocnemius",
      "soleus"
    ],
    "assistingMuscles": [
      "trapezius",
      "deltoid muscles",
      "triceps brachii",
      "erector spinae",
      "abdominal wall"
    ],
    "stabilizers": [
      "rotator cuff",
      "latissimus dorsi",
      "intrinsic foot muscles",
      "gluteus medius",
      "wrists"
    ],
    "contractionRoles": [
      "lower limbs shorten concentrically",
      "rack, trunk, and feet stabilize while the bar accelerates"
    ],
    "commonForceOrSkillDemand": "vertical impulse and forceful reversal with a fixed rack",
    "recommendedExercisePatterns": [
      "jerk drive",
      "push press",
      "front squat",
      "push jerk"
    ],
    "recommendedExercises": [
      "jerk drive",
      "push press",
      "front squat",
      "push jerk"
    ],
    "transferRationale": "Jerk drives and push presses share propulsion; the full jerk additionally requires rapid relocation and stable reception.",
    "exerciseSelectionCautions": "Keep the torso vertical and bar supported; reduce load if the athlete jumps forward, loses rack integrity, or hyperextends the lumbar spine.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6724589/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9919757/",
      "https://www.iwf.net/technical-and-competition-rules"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Olympic-lift biomechanics studies, a field-based snatch assessment, and International Weightlifting Federation rules; confidence reflects strong phase-mechanics evidence while gym-transfer rationales remain mechanical hypotheses rather than causal performance claims."
  },
  {
    "id": "olympic-weightlifting-19",
    "sportId": "olympic-weightlifting",
    "label": "split-stance stabilization",
    "movementFamily": "split-stance balance/overhead stability",
    "bodyActions": [
      "control a staggered lunge-like base under an upright trunk and, when used, an overhead load"
    ],
    "jointActions": [
      "hip abduction/adduction and rotation",
      "knee flexion/extension",
      "ankle dorsiflexion/plantarflexion",
      "shoulder fixation"
    ],
    "primeMovers": [
      "gluteus medius",
      "quadriceps",
      "gluteus maximus",
      "adductor magnus",
      "soleus"
    ],
    "assistingMuscles": [
      "hamstring muscles",
      "hip rotator muscles",
      "abdominal wall",
      "erector spinae",
      "serratus anterior",
      "rotator cuff"
    ],
    "stabilizers": [
      "intrinsic foot muscles",
      "ankle stabilizers",
      "wrists",
      "thoracic extensors"
    ],
    "contractionRoles": [
      "mostly isometric balance with eccentric/concentric corrections at hip, knee, and ankle"
    ],
    "commonForceOrSkillDemand": "unilateral base control, frontal/transverse-plane stability, and recovery positioning",
    "recommendedExercisePatterns": [
      "split squat",
      "reverse lunge",
      "overhead squat",
      "farmer carry"
    ],
    "recommendedExercises": [
      "split squat",
      "reverse lunge",
      "overhead squat",
      "farmer carry"
    ],
    "transferRationale": "Split squats and lunges train lower-body base control; overhead squats add overhead alignment, but neither reproduces jerk foot speed.",
    "exerciseSelectionCautions": "Use a short range and unloaded split first; do not allow the front knee to collapse or the rear foot to become unstable under a bar.",
    "evidenceConfidence": "moderate",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6724589/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9919757/",
      "https://www.iwf.net/technical-and-competition-rules"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Olympic-lift biomechanics studies, a field-based snatch assessment, and International Weightlifting Federation rules; confidence reflects strong phase-mechanics evidence while gym-transfer rationales remain mechanical hypotheses rather than causal performance claims."
  },
  {
    "id": "olympic-weightlifting-20",
    "sportId": "olympic-weightlifting",
    "label": "overhead lockout",
    "movementFamily": "overhead fixation",
    "bodyActions": [
      "full elbow extension with the bar stacked over shoulder, hip, knee, and foot"
    ],
    "jointActions": [
      "elbow extension",
      "shoulder flexion",
      "scapular upward rotation/elevation",
      "trunk and hip position held"
    ],
    "primeMovers": [
      "triceps brachii",
      "deltoid muscles",
      "trapezius",
      "serratus anterior"
    ],
    "assistingMuscles": [
      "rotator cuff",
      "latissimus dorsi",
      "abdominal wall",
      "erector spinae",
      "forearm flexor muscles"
    ],
    "stabilizers": [
      "gluteus medius",
      "intrinsic foot muscles",
      "ankle stabilizers",
      "thoracic extensors",
      "wrists"
    ],
    "contractionRoles": [
      "triceps may finish concentrically",
      "shoulders, scapulae, trunk, grip, and legs stabilize isometrically"
    ],
    "commonForceOrSkillDemand": "overhead support, lockout integrity, and alignment under load",
    "recommendedExercisePatterns": [
      "overhead press",
      "push press",
      "overhead squat",
      "farmer carry"
    ],
    "recommendedExercises": [
      "overhead press",
      "push press",
      "overhead squat",
      "farmer carry"
    ],
    "transferRationale": "Pressing and overhead-squat patterns train portions of lockout and support; they cannot establish the jerk's bar speed or receiving skill.",
    "exerciseSelectionCautions": "Use a bar path that stays over the mid-foot; avoid painful shoulder elevation, rib flare, or passive hanging on the joint structures.",
    "evidenceConfidence": "high",
    "sources": [
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC6724589/",
      "https://pmc.ncbi.nlm.nih.gov/articles/PMC9919757/",
      "https://www.iwf.net/technical-and-competition-rules"
    ],
    "sourceSummary": "The records synthesize peer-reviewed Olympic-lift biomechanics studies, a field-based snatch assessment, and International Weightlifting Federation rules; confidence reflects strong phase-mechanics evidence while gym-transfer rationales remain mechanical hypotheses rather than causal performance claims."
  }
] as const;

export const enrichedMovementById = new Map(enrichedSportMovements.map((movement) => [`${movement.sportId}/${movement.id}`, movement]));

export function getEnrichedMovement(sportId: string, movementId: string) {
  return enrichedMovementById.get(`${sportId}/${movementId}`);
}
