import type { SportMovementProfile } from "./sportMovementDatabase";

export type EvidenceType = "literature-derived" | "model-estimated" | "expert-inference";
export type Confidence = "High" | "Moderate" | "Developing";

export type SportDemandKey =
  | "aerobicCapacity" | "anaerobicCapacity" | "repeatSprint" | "maxStrength" | "relativeStrength"
  | "power" | "rateOfForceDevelopment" | "speed" | "acceleration" | "deceleration"
  | "changeOfDirection" | "reactiveAgility" | "plyometricAbility" | "elasticStrength"
  | "isometricStrength" | "eccentricStrength" | "strengthEndurance" | "grip"
  | "rotationalPower" | "antiRotation" | "mobility" | "stability" | "coordination" | "balance";

export interface EvidenceBoundedDemand {
  key: SportDemandKey;
  label: string;
  score: number;
  confidence: Confidence;
  evidenceType: EvidenceType;
  reasoning: string;
}

export interface SportModifier {
  id: string;
  label: string;
  type: "position" | "event" | "style" | "stroke" | "distance" | "role";
  emphasis: string[];
  evidenceBoundary: string;
}

const labels: Record<SportDemandKey, string> = {
  aerobicCapacity: "Aerobic capacity", anaerobicCapacity: "High-intensity energy capacity", repeatSprint: "Repeated sprint ability",
  maxStrength: "Maximal strength", relativeStrength: "Relative strength", power: "Explosive power",
  rateOfForceDevelopment: "Rate of force development", speed: "Speed", acceleration: "Acceleration",
  deceleration: "Deceleration", changeOfDirection: "Change of direction", reactiveAgility: "Reactive agility",
  plyometricAbility: "Plyometric ability", elasticStrength: "Elastic strength", isometricStrength: "Isometric strength",
  eccentricStrength: "Eccentric strength", strengthEndurance: "Strength endurance", grip: "Grip endurance",
  rotationalPower: "Rotational power", antiRotation: "Trunk bracing", mobility: "Mobility",
  stability: "Stability", coordination: "Coordination", balance: "Balance",
};

type SportSeed = { demands: SportDemandKey[]; modifiers?: SportModifier[] };

const modifier = (id: string, label: string, type: SportModifier["type"], emphasis: string[], evidenceBoundary: string): SportModifier => ({ id, label, type, emphasis, evidenceBoundary });

const seeds: Record<string, SportSeed> = {
  wrestling: { demands: ["maxStrength", "isometricStrength", "power", "antiRotation", "grip", "strengthEndurance", "anaerobicCapacity"], modifiers: [modifier("freestyle", "Freestyle", "style", ["Level changes", "Leg attack force", "Mobility"], "Style comparisons are group-level associations, not athlete labels."), modifier("greco-roman", "Greco-Roman", "style", ["Upper-body clinch force", "Isometric trunk strength", "Power"], "Style evidence supports emphasis changes, not fixed individual thresholds."), modifier("folkstyle", "Folkstyle", "style", ["Mat control", "Stand-up transitions", "Sustained grip"], "Contextual wrestling modifier based on rules and movement demands.")] },
  "american-football": { demands: ["acceleration", "power", "maxStrength", "deceleration", "changeOfDirection", "repeatSprint", "antiRotation"], modifiers: [modifier("qb", "Quarterback", "position", ["Rotational projection", "Deceleration", "Shoulder/trunk control"], "Position context changes physical emphasis; it does not replace throwing skill practice."), modifier("rb", "Running back", "position", ["Acceleration", "Contact bracing", "Change of direction"], "Position modifier is descriptive and should be individualized."), modifier("wr-db", "Wide receiver / defensive back", "position", ["Max velocity", "Reactive acceleration", "Deceleration"], "Combine and match evidence support separate speed and change-of-direction contexts."), modifier("line", "Offensive / defensive line", "position", ["Maximal strength", "Isometric force", "Short-area power"], "Position group evidence is descriptive, not a universal body-size or strength target.")] },
  basketball: { demands: ["acceleration", "deceleration", "changeOfDirection", "plyometricAbility", "repeatSprint", "reactiveAgility", "stability"], modifiers: [modifier("guard", "Guard", "position", ["Acceleration/deceleration", "Repeated shuffling", "Change of direction"], "Position patterns are observational and should be normalized to playing time."), modifier("wing", "Wing", "position", ["High-speed movement", "Jumping", "Contact bracing"], "Position modifier summarizes match-demand evidence."), modifier("forward-center", "Forward / center", "position", ["Rebound contacts", "Vertical force", "Strength endurance"], "Role emphasis is descriptive, not an individual prescription.")] },
  soccer: { demands: ["aerobicCapacity", "repeatSprint", "speed", "acceleration", "deceleration", "changeOfDirection", "plyometricAbility"], modifiers: [modifier("field-player", "Field player", "role", ["Repeat sprint", "High-speed running", "Kicking support leg"], "High-speed thresholds vary by device and individual method."), modifier("goalkeeper", "Goalkeeper", "position", ["Lateral explosion", "Diving/bracing", "Reactive power"], "Goalkeeper demands differ from field-player running exposures.")] },
  baseball: { demands: ["rotationalPower", "antiRotation", "power", "eccentricStrength", "coordination", "stability"], modifiers: [modifier("pitcher", "Pitcher", "position", ["Kinetic-chain sequencing", "Arm deceleration", "Support-leg force"], "Pitching mechanics evidence is not a causal injury-prediction tool."), modifier("catcher", "Catcher", "position", ["Repeated squat endurance", "Throwing", "Hip mobility"], "Role modifier is contextual and should account for actual workload."), modifier("position-player", "Position player", "position", ["Batting rotation", "Short acceleration", "Fielding transitions"], "Role emphasis does not replace skill instruction.")] },
  "track-and-field": { demands: ["speed", "power", "rateOfForceDevelopment", "elasticStrength", "coordination"], modifiers: [modifier("sprint", "Sprint", "event", ["Acceleration", "Max velocity", "Elastic strength"], "Sprint transfer depends on event, technique, and training phase."), modifier("middle-distance", "Middle distance", "event", ["Aerobic power", "Speed reserve", "Running economy"], "Event modifier is a planning context, not a diagnostic."), modifier("distance", "Distance", "event", ["Aerobic capacity", "Strength endurance", "Economy"], "Distance requirements should be adjusted for actual event and volume."), modifier("jumps", "Jumps", "event", ["Approach speed", "Takeoff power", "Landing control"], "Jump event demands are phase-specific."), modifier("throws", "Throws", "event", ["Rotational/linear power", "Bracing", "Technical coordination"], "Throwing modifier does not substitute for coached event practice.")] },
  swimming: { demands: ["power", "strengthEndurance", "mobility", "stability", "coordination", "aerobicCapacity"], modifiers: [modifier("freestyle", "Freestyle", "stroke", ["Propulsion timing", "Shoulder endurance", "Turn force"], "Stroke-specific programming should complement pool practice."), modifier("butterfly", "Butterfly", "stroke", ["Trunk rhythm", "Shoulder endurance", "Undulation coordination"], "Stroke modifier is descriptive."), modifier("breaststroke", "Breaststroke", "stroke", ["Hip mobility", "Knee/hip coordination", "Turn force"], "Stroke modifier does not assess individual joint tolerance."), modifier("backstroke", "Backstroke", "stroke", ["Shoulder control", "Trunk alignment", "Turn force"], "Stroke modifier is contextual."), modifier("sprint", "Sprint distance", "distance", ["Start/turn power", "Anaerobic output", "Technique under speed"], "Distance effects require athlete-specific pool context.")] },
  tennis: { demands: ["reactiveAgility", "acceleration", "deceleration", "rotationalPower", "antiRotation", "repeatSprint", "coordination"], modifiers: [modifier("singles", "Singles", "role", ["Court coverage", "Repeat effort", "Deceleration"], "Match-demand context varies by surface and level."), modifier("doubles", "Doubles", "role", ["First-step speed", "Serve/return positioning", "Explosive coverage"], "Doubles modifies exposure, not technical skill needs.")] },
  volleyball: { demands: ["plyometricAbility", "power", "elasticStrength", "deceleration", "stability", "coordination"], modifiers: [modifier("setter", "Setter", "position", ["Repeated jumps", "Upper-body coordination", "Landing control"], "Position evidence is contextual."), modifier("hitter", "Hitter", "position", ["Approach jump", "Aerial power", "Landing"], "Performance depends heavily on sport skill and timing."), modifier("libero", "Libero", "position", ["Low-position movement", "Lateral defense", "Reactive acceleration"], "Role emphasis is descriptive.")] },
  boxing: { demands: ["anaerobicCapacity", "power", "rotationalPower", "antiRotation", "reactiveAgility", "strengthEndurance", "coordination"], modifiers: [modifier("amateur", "Amateur boxing", "style", ["Repeated high-intensity rounds", "Punch sequencing", "Footwork"], "Competition rules and round structure modify load.")] },
  mma: { demands: ["anaerobicCapacity", "power", "maxStrength", "grip", "isometricStrength", "strengthEndurance", "antiRotation"], modifiers: [modifier("striking", "Striking emphasis", "style", ["Rotational projection", "Footwork", "Trunk bracing"], "Style modifier should not overrule actual practice schedule."), modifier("grappling", "Grappling emphasis", "style", ["Isometric force", "Grip", "Transitions"], "Style modifier is contextual, not a competition-performance prediction.")] },
  "brazilian-jiu-jitsu": { demands: ["grip", "isometricStrength", "strengthEndurance", "antiRotation", "mobility", "anaerobicCapacity"], modifiers: [modifier("gi", "Gi", "style", ["Grip endurance", "Isometric pulling", "Positional control"], "Style-specific evidence is still population-limited."), modifier("no-gi", "No-gi", "style", ["Scrambling", "Hip control", "Body-lock force"], "Style modifier is a planning context.")] },
  "ice-hockey": { demands: ["power", "repeatSprint", "anaerobicCapacity", "balance", "deceleration", "changeOfDirection", "eccentricStrength"], modifiers: [modifier("skater", "Skater", "position", ["Skating acceleration", "Repeated shifts", "Turn transition"], "Skater demands are distinct from goalie profiles."), modifier("goalie", "Goalie", "position", ["Lateral repositioning", "Isometric holds", "Hip mobility"], "Goalie evidence should not be collapsed into skater norms.")] },
  lacrosse: { demands: ["repeatSprint", "acceleration", "deceleration", "changeOfDirection", "rotationalPower", "antiRotation", "coordination"], modifiers: [modifier("field", "Field player", "role", ["Intermittent running", "Shooting on move", "Contact bracing"], "Match demand varies by game format and position."), modifier("goalie", "Goalie", "position", ["Reactive movement", "Lateral force", "Position control"], "Goalie context is distinct from field-running exposure.")] },
  rugby: { demands: ["maxStrength", "power", "acceleration", "repeatSprint", "isometricStrength", "antiRotation", "strengthEndurance"], modifiers: [modifier("forward", "Forward", "position", ["Contact force", "Ruck/maul control", "Strength endurance"], "Forward-back differences are group-level descriptive patterns."), modifier("back", "Back", "position", ["Speed", "Repeat sprint", "Change of direction"], "Back-line emphasis should be individualized by position and match role.")] },
  golf: { demands: ["rotationalPower", "power", "stability", "balance", "coordination", "mobility"], modifiers: [modifier("drive", "Driver emphasis", "role", ["Ground-force sequencing", "Rotational power", "Clubhead speed context"], "Physical associations with clubhead speed are not direct causal prescriptions.")] },
  gymnastics: { demands: ["relativeStrength", "power", "isometricStrength", "mobility", "balance", "coordination", "eccentricStrength"], modifiers: [modifier("artistic", "Artistic gymnastics", "style", ["Takeoff/landing control", "Apparatus force", "Motor control"], "Gymnastics research should be interpreted with apparatus and skill context.")] },
  rowing: { demands: ["aerobicCapacity", "strengthEndurance", "power", "coordination", "stability", "repeatSprint"], modifiers: [modifier("sweep", "Sweep", "style", ["Asymmetric stroke organization", "Trunk coordination", "Leg drive"], "Sweep/scull distinctions are technique-specific."), modifier("scull", "Scull", "style", ["Symmetric stroke organization", "Leg drive", "Trunk sequencing"], "Modifier is biomechanical context, not a prescription.")] },
  skiing: { demands: ["eccentricStrength", "power", "isometricStrength", "balance", "coordination", "anaerobicCapacity"], modifiers: [modifier("alpine", "Alpine skiing", "style", ["Turn transition", "Terrain adaptation", "Eccentric re-stabilization"], "This profile is Alpine skiing; it does not represent cross-country skiing.")] },
  "olympic-weightlifting": { demands: ["power", "rateOfForceDevelopment", "maxStrength", "mobility", "stability", "coordination", "balance"], modifiers: [modifier("snatch", "Snatch", "event", ["Overhead receipt", "Bar speed", "Mobility"], "Event modifier should not be read as a substitute for technical coaching."), modifier("clean-and-jerk", "Clean & jerk", "event", ["Pull/receipt", "Split or power jerk fixation", "Strength"], "Event modifier is technical and contextual.")] },
};

const baseScore = (key: SportDemandKey, active: SportDemandKey[]) => active.includes(key) ? 0.78 : 0.32;

export function getSportModifiers(sportId: string): SportModifier[] {
  return seeds[sportId]?.modifiers || [];
}

export function getSportDemandModel(sportId: string, modifierId?: string) {
  const seed = seeds[sportId] || { demands: ["stability", "coordination", "strengthEndurance"] as SportDemandKey[] };
  const selectedModifier = seed.modifiers?.find((item) => item.id === modifierId);
  const demands: EvidenceBoundedDemand[] = (Object.keys(labels) as SportDemandKey[]).map((key) => ({
    key,
    label: labels[key],
    score: baseScore(key, seed.demands),
    confidence: (seed.demands.includes(key) ? "Moderate" : "Developing") as Confidence,
    evidenceType: (seed.demands.includes(key) ? "literature-derived" : "model-estimated") as EvidenceType,
    reasoning: seed.demands.includes(key) ? "Included as a sport-level demand from the reviewed evidence register." : "Retained as a lower-priority planning estimate; athlete and movement context may change it.",
  })).sort((a, b) => b.score - a.score);
  return { demands, selectedModifier, evidenceBoundary: "Scores are evidence-bounded planning comparisons, not measurements of an individual athlete or deterministic sport-performance targets." };
}

const adaptationFor = (demands: EvidenceBoundedDemand[]) => demands.slice(0, 3).map((demand) => `${demand.label.toLowerCase()} development`);

export function buildMovementReasoning(movement: SportMovementProfile, modifierId?: string) {
  const model = getSportDemandModel(movement.sportId, modifierId);
  const modifierText = model.selectedModifier ? `${model.selectedModifier.label}: ${model.selectedModifier.emphasis.join(", ")}` : "General sport profile";
  return {
    sport: movement.sportLabel,
    modifier: modifierText,
    movement: movement.label,
    biomechanics: movement.bodyActions,
    physicalQualities: model.demands.slice(0, 4).map((demand) => demand.label),
    adaptations: adaptationFor(model.demands),
    modality: "Select progressively loadable gym modalities that develop the identified capacity without trying to reproduce the sport skill under load.",
    exerciseBoundary: movement.gymTransferCue,
    evidenceBoundary: model.evidenceBoundary,
  };
}

export function classifyPreparation(exerciseName: string) {
  const name = exerciseName.toLowerCase();
  if (/sled|resisted sprint|medicine ball throw|loaded jump|landmine rotation|battle rope/.test(name)) return "Special physical preparation";
  if (/sprint|shot|serve|pitch|spike|takedown/.test(name)) return "Highly specific physical preparation";
  return "General physical preparation";
}
