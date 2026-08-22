export interface SprintPowerEvidenceContext {
  topics: string[];
  sourceLabels: string[];
  supportedUse: string;
  planningBoundary: string;
}

const contexts = {
  acceleration: {
    topics: ["Sprint acceleration mechanics", "Force orientation"],
    sourceLabels: ["Sprint mechanics and horizontal force orientation · PMIDs 26733889, 22422028, 21364480, 19863962"],
    supportedUse: "Use acceleration as a multidimensional movement demand involving body position, propulsive and braking impulse, force orientation, and lower-limb mechanics.",
    planningBoundary: "These records are primarily acute biomechanics, associations, modeling, or theory. They do not select a single causal muscle, exercise, or technique for an athlete.",
  },
  resistedSprint: {
    topics: ["Resisted sprinting", "Early acceleration"],
    sourceLabels: ["Resisted-sprint reviews and trials · PMIDs 29926369, 39392558, 39253367, 40961280, 37536676"],
    supportedUse: "Treat sled and other resistance methods as load- and modality-specific options for an acceleration-oriented exposure.",
    planningBoundary: "No universal sled load, superiority claim, or consistent maximum-velocity transfer is inferred; towing, pushing, vests, and assisted methods remain distinct exposures.",
  },
  forceVelocity: {
    topics: ["Force–velocity monitoring", "Ballistic power"],
    sourceLabels: ["F–V measurement, intervention, and review evidence · PMIDs 30273283, 40593873, 41766810, 39604155"],
    supportedUse: "Use force–velocity characteristics as repeated, task-specific monitoring descriptors and as hypotheses for reviewing force or velocity emphasis.",
    planningBoundary: "An inferred F–V imbalance is not a deterministic individualized prescription; estimates change with test setup, distance, timing gates, and model assumptions.",
  },
  rfdPower: {
    topics: ["Rate of force development", "Power training"],
    sourceLabels: ["RFD methodology and power-training evidence · PMIDs 26941023, 29266685, 32034703, 26063470, 35025093"],
    supportedUse: "Represent early force production and power as task-specific qualities that may be trained with movement-appropriate strength, ballistic, or plyometric work.",
    planningBoundary: "RFD and power outcomes are protocol- and exercise-specific; group evidence does not prescribe one load, time window, or transfer outcome for an athlete.",
  },
  plyometric: {
    topics: ["Reactive strength", "Plyometric transfer"],
    sourceLabels: ["SSC and plyometric reviews · PMIDs 36906633, 32915430, 37036542, 38602544"],
    supportedUse: "Distinguish vertical, horizontal, unilateral, bilateral, and reactive plyometric exposures when considering jump or short-sprint support.",
    planningBoundary: "RSI and jump changes are task-specific monitoring or training outcomes, not a readiness diagnosis, a fixed drop-height prescription, or guaranteed sport transfer.",
  },
  cod: {
    topics: ["Change of direction", "Braking and re-acceleration"],
    sourceLabels: ["COD biomechanics and training evidence · PMIDs 40668491, 27139591, 40416610, 41762640"],
    supportedUse: "Represent pre-planned COD using braking, propulsion, approach/exit velocity, trunk/COM position, and lower-limb mechanics.",
    planningBoundary: "Pre-planned COD does not equal reactive agility, and correlational determinants or pooled modalities do not create an individual technique or dosage rule.",
  },
  repeatSprint: {
    topics: ["Repeated-sprint ability", "Sprint maintenance"],
    sourceLabels: ["Repeated-sprint reviews and interventions · PMIDs 21780851, 21846163, 38041768, 33909274, 40220211"],
    supportedUse: "Separate best and mean sprint output from sprint decrement and recovery capacity; retain work-to-rest geometry when comparing sessions or tests.",
    planningBoundary: "No universal RSA test or single best intervention is established, and improved sprint output does not automatically mean improved fatigue resistance or match transfer.",
  },
} as const;

function has(text: string, expression: RegExp) {
  return expression.test(text);
}

export function getSprintPowerEvidenceContext(movement: { label: string; family?: string; bodyActions?: string[] | string }): SprintPowerEvidenceContext | null {
  const text = `${movement.label} ${movement.family || ""} ${Array.isArray(movement.bodyActions) ? movement.bodyActions.join(" ") : movement.bodyActions || ""}`.toLowerCase();
  const matches = [
    has(text, /sprint|acceleration|max(?:imum)? velocity/) ? contexts.acceleration : null,
    has(text, /resisted sprint|sled/) ? contexts.resistedSprint : null,
    has(text, /force.?velocity|ballistic/) ? contexts.forceVelocity : null,
    has(text, /rate of force|power/) ? contexts.rfdPower : null,
    has(text, /jump|plyometric|elastic|rebound/) ? contexts.plyometric : null,
    has(text, /change of direction|cut|deceleration|re-acceleration|lateral/) ? contexts.cod : null,
    has(text, /repeat(?:ed)? sprint|repeat sprint|sprint maintenance/) ? contexts.repeatSprint : null,
  ].filter(Boolean) as (typeof contexts)[keyof typeof contexts][];

  if (!matches.length) return null;
  return {
    topics: Array.from(new Set(matches.flatMap((match) => match.topics))),
    sourceLabels: Array.from(new Set(matches.flatMap((match) => match.sourceLabels))),
    supportedUse: matches.map((match) => match.supportedUse).join(" "),
    planningBoundary: matches.map((match) => match.planningBoundary).join(" "),
  };
}
