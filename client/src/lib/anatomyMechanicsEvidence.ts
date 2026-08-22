export interface AnatomyMechanicsEvidence {
  scope: string;
  sources: string[];
  boundary: string;
}

const mechanicsByMuscle: Record<string, AnatomyMechanicsEvidence> = {
  hamstrings: {
    scope: "Hamstring heads and regions are not mechanically interchangeable; architecture and modeled late-swing loading vary by head, posture, and task.",
    sources: ["Kellis et al., 2018 (PMID 30117053)", "Thelen et al., 2005 (PMID 15632676)"],
    boundary: "Sprint and strain results are model-derived or task-specific. They do not estimate this athlete’s force or injury risk.",
  },
  quads: {
    scope: "Quadriceps force capacity reflects muscle size, PCSA, pennation, moment arm, activation, and measurement location rather than one anatomical variable.",
    sources: ["Ward et al., 2009 (PMID 18972175)", "Balshaw et al., 2021 (PMID 33935234)"],
    boundary: "Architecture descriptions are group-level and method-specific, not a personal force estimate or a training prescription.",
  },
  calves: {
    scope: "The plantar-flexor system includes muscle, aponeurosis, and Achilles-tendon behavior; fascicle and tendon motion can differ from joint motion.",
    sources: ["Fukashiro et al., 2006 (PMID 16871004)", "Maganaris et al., 2006 (PMID 15972215)"],
    boundary: "The app does not infer personal tendon stiffness, tendon force, or operating length from a heat-map role index.",
  },
  soleus: {
    scope: "Soleus behavior is part of a coupled muscle–tendon system whose operating length and leverage change by task and individual geometry.",
    sources: ["Rubenson et al., 2012 (PMID 22771749)", "Fukashiro et al., 2006 (PMID 16871004)"],
    boundary: "Cohort gait findings do not determine an individual’s force–length state, capacity, or mobility need.",
  },
  biceps: {
    scope: "Elbow-flexor leverage changes with elbow angle, forearm orientation, and contraction state; biceps, brachialis, and brachioradialis share torque conditionally.",
    sources: ["Murray et al., 1995 (PMID 7775488)", "Hasson et al., 2012 (PMID 22431216)"],
    boundary: "Moment arm is leverage, not a direct muscle-force, activation, or hypertrophy score.",
  },
  brachialis: {
    scope: "Elbow-flexor leverage changes with elbow angle, forearm orientation, and contraction state; biceps, brachialis, and brachioradialis share torque conditionally.",
    sources: ["Murray et al., 1995 (PMID 7775488)", "Hasson et al., 2012 (PMID 22431216)"],
    boundary: "Moment arm is leverage, not a direct muscle-force, activation, or hypertrophy score.",
  },
  brachioradialis: {
    scope: "Elbow-flexor leverage changes with elbow angle, forearm orientation, and contraction state; biceps, brachialis, and brachioradialis share torque conditionally.",
    sources: ["Murray et al., 1995 (PMID 7775488)", "Hasson et al., 2012 (PMID 22431216)"],
    boundary: "Moment arm is leverage, not a direct muscle-force, activation, or hypertrophy score.",
  },
  triceps: {
    scope: "Elbow-extensor leverage and load sharing vary with elbow configuration, external moment, and subject geometry.",
    sources: ["Murray et al., 2000 (PMID 10828324)", "Elbow load-sharing study (PMID 20452784)"],
    boundary: "No fixed percentage of joint torque is assigned to a triceps head in this model.",
  },
  chest: {
    scope: "Pectoralis-major leverage is configuration-dependent and its regional fibers can contribute differently across elevation and horizontal-flexion positions.",
    sources: ["Hik & Ackland, 2019 (PMID 30411350)", "Kuechle et al., 1997 (PMID 9356931)"],
    boundary: "A regional moment-arm finding does not provide a personal activation, force, or hypertrophy estimate.",
  },
  frontDelts: {
    scope: "Deltoid regions have different configuration-dependent moment arms and should not be treated as one uniform line of action.",
    sources: ["Ackland et al., 2008 (PMID 18691376)", "Hik & Ackland, 2019 (PMID 30411350)"],
    boundary: "Leverage changes with position and does not predict individual force, stability, or injury risk.",
  },
  sideDelts: {
    scope: "Deltoid regions have different configuration-dependent moment arms and should not be treated as one uniform line of action.",
    sources: ["Ackland et al., 2008 (PMID 18691376)", "Hik & Ackland, 2019 (PMID 30411350)"],
    boundary: "Leverage changes with position and does not predict individual force, stability, or injury risk.",
  },
  rearDelts: {
    scope: "Deltoid regions have different configuration-dependent moment arms and should not be treated as one uniform line of action.",
    sources: ["Ackland et al., 2008 (PMID 18691376)", "Hik & Ackland, 2019 (PMID 30411350)"],
    boundary: "Leverage changes with position and does not predict individual force, stability, or injury risk.",
  },
  rotatorCuff: {
    scope: "Rotator-cuff and antagonist contributions can support joint stability, and static optimization may understate antagonistic activity.",
    sources: ["Hik & Ackland, 2019 (PMID 30411350)", "Static optimization study (PMID 31668905)"],
    boundary: "This does not diagnose stability, pathology, or injury risk and does not estimate cuff force for an individual.",
  },
};

const defaultEvidence: AnatomyMechanicsEvidence = {
  scope: "Muscle role depends on posture, joint position, external load, activation, and geometry. Architecture and leverage are capacity-related descriptors, not direct force readings.",
  sources: ["Lieber & Ward, 2011 (PMID 21502118)", "Moment-arm methods review (PMID 23998280)"],
  boundary: "The displayed values are standardized planning indices; the app does not infer individual architecture, force sharing, tendon properties, or injury risk.",
};

export function getAnatomyMechanicsEvidence(muscle: string): AnatomyMechanicsEvidence {
  return mechanicsByMuscle[muscle] || defaultEvidence;
}
