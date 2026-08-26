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
  evidenceScope: string;
  evidenceSources?: string[];
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

const modifier = (id: string, label: string, type: SportModifier["type"], emphasis: string[], evidenceBoundary: string): SportModifier => ({
  id,
  label,
  type,
  emphasis,
  evidenceScope: `Reviewed ${type} demand records within the sport evidence register; this modifier changes comparative priorities, not athlete measurements.`,
  evidenceBoundary,
});

const seeds: Record<string, SportSeed> = {
  wrestling: { demands: ["maxStrength", "isometricStrength", "power", "antiRotation", "grip", "strengthEndurance", "anaerobicCapacity", "aerobicCapacity"], modifiers: [modifier("freestyle", "Freestyle", "style", ["Level changes", "Leg attack force", "Mobility"], "Style comparisons are group-level associations, not athlete labels."), modifier("greco-roman", "Greco-Roman", "style", ["Upper-body clinch force", "Isometric trunk strength", "Power"], "Style evidence supports emphasis changes, not fixed individual thresholds."), modifier("folkstyle", "Folkstyle", "style", ["Mat control", "Stand-up transitions", "Sustained grip"], "Contextual wrestling modifier based on rules and movement demands.")] },
  "american-football": { demands: ["acceleration", "power", "maxStrength", "deceleration", "changeOfDirection", "repeatSprint", "antiRotation"], modifiers: [modifier("qb", "Quarterback", "position", ["Rotational projection", "Deceleration", "Shoulder/trunk control"], "Position context changes physical emphasis; it does not replace throwing skill practice."), modifier("rb", "Running back", "position", ["Acceleration", "Contact bracing", "Change of direction"], "Position modifier is descriptive and should be individualized."), modifier("wr-db", "Wide receiver / defensive back", "position", ["Max velocity", "Reactive acceleration", "Deceleration"], "Combine and match evidence support separate speed and change-of-direction contexts."), modifier("lb-te", "Linebacker / tight end", "position", ["Contact bracing", "Acceleration", "Repeated collision exposure"], "Hybrid position context is descriptive and must be individualized to actual role and workload."), modifier("line", "Offensive / defensive line", "position", ["Maximal strength", "Isometric force", "Short-area power"], "Position group evidence is descriptive, not a universal body-size or strength target.")] },
  basketball: { demands: ["acceleration", "deceleration", "changeOfDirection", "plyometricAbility", "repeatSprint", "reactiveAgility", "stability"], modifiers: [modifier("guard", "Guard", "position", ["Acceleration/deceleration", "Repeated shuffling", "Change of direction"], "Position patterns are observational and should be normalized to playing time."), modifier("wing", "Wing", "position", ["High-speed movement", "Jumping", "Contact bracing"], "Position modifier summarizes match-demand evidence."), modifier("forward", "Forward", "position", ["High-speed movement", "Multidirectional power", "Jumping"], "Forward patterns are group-level observations and should be normalized to competition context."), modifier("center", "Center", "position", ["Rebound contacts", "Vertical jump", "Interior isometric strength"], "Center patterns are group-level observations, not an individual prescription."), modifier("forward-center", "Forward / center", "position", ["Rebound contacts", "Vertical force", "Strength endurance"], "Legacy combined role context remains descriptive, not an individual prescription.")] },
  soccer: { demands: ["aerobicCapacity", "repeatSprint", "speed", "acceleration", "deceleration", "changeOfDirection", "plyometricAbility"], modifiers: [modifier("field-player", "Field player", "role", ["Repeat sprint", "High-speed running", "Kicking support leg"], "High-speed thresholds vary by device and individual method."), modifier("goalkeeper", "Goalkeeper", "position", ["Lateral explosion", "Diving/bracing", "Reactive power"], "Goalkeeper demands differ from field-player running exposures.")] },
  baseball: { demands: ["rotationalPower", "antiRotation", "power", "eccentricStrength", "coordination", "stability"], modifiers: [modifier("pitcher", "Pitcher", "position", ["Kinetic-chain sequencing", "Arm deceleration", "Support-leg force"], "Pitching mechanics evidence is not a causal injury-prediction tool."), modifier("catcher", "Catcher", "position", ["Repeated squat endurance", "Throwing", "Hip mobility"], "Role modifier is contextual and should account for actual workload."), modifier("position-player", "Position player", "position", ["Batting rotation", "Short acceleration", "Fielding transitions"], "Role emphasis does not replace skill instruction.")] },
  "track-and-field": { demands: ["speed", "power", "rateOfForceDevelopment", "elasticStrength", "coordination"], modifiers: [modifier("sprint", "Sprint", "event", ["Acceleration", "Max velocity", "Elastic strength"], "Sprint transfer depends on event, technique, and training phase."), modifier("hurdles", "Hurdles", "event", ["Sprint rhythm", "Hip mobility", "Elastic stiffness"], "Hurdle demands are event- and technique-specific."), modifier("middle-distance", "Middle distance", "event", ["Aerobic power", "Speed reserve", "Running economy"], "Event modifier is a planning context, not a diagnostic."), modifier("distance", "Distance", "event", ["Aerobic capacity", "Strength endurance", "Economy"], "Distance requirements should be adjusted for actual event and volume."), modifier("jumps", "Jumps", "event", ["Approach speed", "Takeoff power", "Landing control"], "Jump event demands are phase-specific."), modifier("throws", "Throws", "event", ["Rotational/linear power", "Bracing", "Technical coordination"], "Throwing modifier does not substitute for coached event practice."), modifier("multi-events", "Multi-events", "event", ["Mixed speed-power-endurance", "Technical variety", "Recovery management"], "Multi-event profiles require event-specific coaching and season context.")] },
  swimming: { demands: ["power", "strengthEndurance", "mobility", "stability", "coordination", "aerobicCapacity"], modifiers: [modifier("freestyle", "Freestyle", "stroke", ["Propulsion timing", "Shoulder endurance", "Turn force"], "Stroke-specific programming should complement pool practice."), modifier("butterfly", "Butterfly", "stroke", ["Trunk rhythm", "Shoulder endurance", "Undulation coordination"], "Stroke modifier is descriptive."), modifier("breaststroke", "Breaststroke", "stroke", ["Hip mobility", "Knee/hip coordination", "Turn force"], "Stroke modifier does not assess individual joint tolerance."), modifier("backstroke", "Backstroke", "stroke", ["Shoulder control", "Trunk alignment", "Turn force"], "Stroke modifier is contextual."), modifier("im", "Individual medley", "stroke", ["Stroke transitions", "Broad coordination", "Mixed propulsion demands"], "IM context summarizes stroke variation, not a direct training prescription."), modifier("sprint", "Sprint distance", "distance", ["Start/turn power", "Anaerobic output", "Technique under speed"], "Distance effects require athlete-specific pool context."), modifier("middle-distance", "Middle distance", "distance", ["Aerobic power", "Repeat pace", "Turn efficiency"], "Distance modifiers should be paired with actual pool volume and event context."), modifier("distance", "Distance", "distance", ["Aerobic capacity", "Strength endurance", "Economy"], "Distance modifiers describe general event context, not individual fatigue tolerance.")] },
  tennis: { demands: ["reactiveAgility", "acceleration", "deceleration", "rotationalPower", "antiRotation", "repeatSprint", "coordination"], modifiers: [modifier("singles", "Singles", "role", ["Court coverage", "Repeat effort", "Deceleration"], "Match-demand context varies by surface and level."), modifier("doubles", "Doubles", "role", ["First-step speed", "Serve/return positioning", "Explosive coverage"], "Doubles modifies exposure, not technical skill needs.")] },
  volleyball: { demands: ["plyometricAbility", "power", "elasticStrength", "deceleration", "stability", "coordination"], modifiers: [modifier("setter", "Setter", "position", ["Repeated jumps", "Upper-body coordination", "Landing control"], "Position evidence is contextual."), modifier("hitter", "Hitter", "position", ["Approach jump", "Aerial power", "Landing"], "Performance depends heavily on sport skill and timing."), modifier("libero", "Libero", "position", ["Low-position movement", "Lateral defense", "Reactive acceleration"], "Role emphasis is descriptive.")] },
  boxing: { demands: ["anaerobicCapacity", "power", "rotationalPower", "antiRotation", "reactiveAgility", "strengthEndurance", "coordination"], modifiers: [modifier("amateur", "Amateur boxing", "style", ["Repeated high-intensity rounds", "Punch sequencing", "Footwork"], "Competition rules and round structure modify load.")] },
  mma: { demands: ["anaerobicCapacity", "power", "maxStrength", "grip", "isometricStrength", "strengthEndurance", "antiRotation"], modifiers: [modifier("striking", "Striking emphasis", "style", ["Rotational projection", "Footwork", "Trunk bracing"], "Style modifier should not overrule actual practice schedule."), modifier("grappling", "Grappling emphasis", "style", ["Isometric force", "Grip", "Transitions"], "Style modifier is contextual, not a competition-performance prediction.")] },
  "brazilian-jiu-jitsu": { demands: ["grip", "isometricStrength", "strengthEndurance", "antiRotation", "mobility", "anaerobicCapacity"], modifiers: [modifier("gi", "Gi", "style", ["Grip endurance", "Isometric pulling", "Positional control"], "Style-specific evidence is still population-limited."), modifier("no-gi", "No-gi", "style", ["Scrambling", "Hip control", "Body-lock force"], "Style modifier is a planning context.")] },
  "ice-hockey": { demands: ["power", "repeatSprint", "anaerobicCapacity", "balance", "deceleration", "changeOfDirection", "eccentricStrength"], modifiers: [modifier("forward", "Forward", "position", ["Skating acceleration", "Repeated shifts", "Transition speed"], "Forward context is descriptive and differs by line role and playing time."), modifier("defense", "Defense", "position", ["Backward-to-forward transition", "Lateral turn control", "Strength endurance"], "Defense context does not replace skating technique or tactical role."), modifier("skater", "General skater", "position", ["Skating acceleration", "Repeated shifts", "Turn transition"], "Skater demands are distinct from goalie profiles."), modifier("goalie", "Goalie", "position", ["Lateral repositioning", "Isometric holds", "Hip mobility"], "Goalie evidence should not be collapsed into skater norms.")] },
  lacrosse: { demands: ["repeatSprint", "acceleration", "deceleration", "changeOfDirection", "rotationalPower", "antiRotation", "coordination"], modifiers: [modifier("field", "Field player", "role", ["Intermittent running", "Shooting on move", "Contact bracing"], "Match demand varies by game format and position."), modifier("goalie", "Goalie", "position", ["Reactive movement", "Lateral force", "Position control"], "Goalie context is distinct from field-running exposure.")] },
  rugby: { demands: ["maxStrength", "power", "acceleration", "repeatSprint", "isometricStrength", "antiRotation", "strengthEndurance"], modifiers: [modifier("forward", "Forward", "position", ["Contact force", "Ruck/maul control", "Strength endurance"], "Forward-back differences are group-level descriptive patterns."), modifier("back", "Back", "position", ["Speed", "Repeat sprint", "Change of direction"], "Back-line emphasis should be individualized by position and match role.")] },
  golf: { demands: ["rotationalPower", "power", "stability", "balance", "coordination", "mobility"], modifiers: [modifier("drive", "Driver emphasis", "role", ["Ground-force sequencing", "Rotational power", "Clubhead speed context"], "Physical associations with clubhead speed are not direct causal prescriptions.")] },
  gymnastics: { demands: ["relativeStrength", "power", "isometricStrength", "mobility", "balance", "coordination", "eccentricStrength"], modifiers: [modifier("artistic", "Artistic gymnastics", "style", ["Takeoff/landing control", "Apparatus force", "Motor control"], "Gymnastics research should be interpreted with apparatus and skill context.")] },
  rowing: { demands: ["aerobicCapacity", "strengthEndurance", "power", "coordination", "stability", "repeatSprint"], modifiers: [modifier("sweep", "Sweep", "style", ["Asymmetric stroke organization", "Trunk coordination", "Leg drive"], "Sweep/scull distinctions are technique-specific."), modifier("scull", "Scull", "style", ["Symmetric stroke organization", "Leg drive", "Trunk sequencing"], "Modifier is biomechanical context, not a prescription.")] },
  skiing: { demands: ["eccentricStrength", "power", "isometricStrength", "balance", "coordination", "anaerobicCapacity"], modifiers: [modifier("alpine", "Alpine skiing", "style", ["Turn transition", "Terrain adaptation", "Eccentric re-stabilization"], "This profile is Alpine skiing; it does not represent cross-country skiing.")] },
  "olympic-weightlifting": { demands: ["power", "rateOfForceDevelopment", "maxStrength", "mobility", "stability", "coordination", "balance"], modifiers: [modifier("snatch", "Snatch", "event", ["Overhead receipt", "Bar speed", "Mobility"], "Event modifier should not be read as a substitute for technical coaching."), modifier("clean-and-jerk", "Clean & jerk", "event", ["Pull/receipt", "Split or power jerk fixation", "Strength"], "Event modifier is technical and contextual.")] },
};

const modifierEvidenceSources: Record<string, string[]> = {
  wrestling: ["Wrestling evidence inventory — [PMID 28030533] physical/physiological review: aerobic recovery, anaerobic, strength, and power are population-level performance contexts; style, weight class, and tournament context remain distinct."],
  "american-football": ["[PMID 37050597] American-football monitoring scoping review: external-load and catch-skill applications were common; internal-load evidence remained a gap.", "American football evidence inventory — [S1] NCAA positional GPS/accelerometry, [S2] NFL player tracking, [S3] acceleration/deceleration systematic review."],
  basketball: ["[PMID 29039018] Basketball match-play systematic review: guard, forward, and center exposure differed at group level and should be normalized to playing time and competition context.", "[PMID 32134965] Basketball training- and match-load review: competition level changed internal and external load context, while acceleration/deceleration evidence remained insufficient for a universal profile.", "[PMID 31610639] Basketball fitness-testing review: few tests were basketball-specific; do not turn common jump, aerobic, anaerobic, speed, or agility tests into a universal performance battery.", "[PMID 40453900] Male basketball positional review: guards had greater distance and acceleration/deceleration context, forwards more high-speed movement, and centers more rebound and heart-rate context; sex and competition limits apply.", "[PMID 38444385] Youth basketball small-sided-games review: intermittent-fitness and change-of-direction findings were more consistent than repeated-sprint or linear-sprint effects."],
  soccer: ["Soccer evidence inventory — [PMID 29199782] male systematic review: competitive level, position, and age alter group-level physical profiles; this is not an individual target or causal prescription.", "[PMID 34347283] Elite male soccer biomarker review: longitudinal associations are not diagnostic thresholds or causal readiness scores.", "[PMID 33245512] Football-code short-sprint meta-analysis: no single acceleration method was best; use athlete, code, standard, and season context.", "[PMID 33423603] Male soccer HIIT meta-analysis: aerobic and repeated-sprint effects were more consistent than linear-sprint or jump transfer."],
  "ice-hockey": ["Ice hockey evidence inventory — reviewed position- and goalie-specific skating, shift, and transition-demand records."],
  "track-and-field": ["[PMID 40721687] Elite track-and-field review: event-specific competition features did not definitively distinguish medallists from non-medallists; avoid universal event profiles.", "Track & field evidence inventory — [S1] sprint-start review, [S2] 109-study sprint-phase systematic review, [S4] World Athletics biomechanics reports."],
  swimming: ["[PMID 26839618] Competitive-swimming longitudinal review: training responses varied by background and experience; no universal physiological marker, stroke, or distance prescription is inferred.", "Swimming evidence inventory — Kwok et al. (2021) front-crawl conditioning review; Vantorre et al. (2014) swim-start review; Gonjo & Olstad (2020) sprint-butterfly phase study."],
  tennis: ["[PMID 36752978] Tennis singles match-demand meta-analysis: intermittent multidirectional exposure varied by sex, level, and surface; it does not validate doubles or individual prescriptions.", "[PMID 37063547] Racket-sport internal-load review: aerobic-capacity and internal-load measures are population-level training context, not player-specific prescriptions."],
  volleyball: ["[PMID 41460726] Indoor-volleyball match-load review: jump exposure differed by position and sex; use as contextual workload information, not a dose prescription."],
  boxing: ["[PMID 35380916] Amateur-boxing acute-response review: competition, sparring, and simulation are distinct recovery contexts."],
  mma: ["[PMID 26993133] Adult male combat-sport review: grappling and striking success contexts differed; training priorities remain strategy- and practice-context dependent."],
  "brazilian-jiu-jitsu": ["[PMID 28194734] Brazilian jiu-jitsu systematic review: strength findings were more consistent than VO2max discrimination, while anaerobic and power evidence remained limited; no-gi extrapolation is constrained."],
  rugby: ["[PMID 41359906] Rugby-union systematic review: testing methods were heterogeneous and no universal essential battery was identified; use game-model and positional context."],
  golf: ["[PMID 32723013] Golf strength-and-conditioning review: average clubhead-speed, ball-speed, and distance changes varied across heterogeneous interventions and golfers.", "[PMID 34224506] Golf resistance-training review: combined general and coached golf-specific work showed larger average gains than general resistance training alone; no individual response is assured."],
  rowing: ["[PMID 40185480] Elite-rower review: no intensity-distribution or periodization model showed a clear universal advantage; monitor individual volume, intensity distribution, and recovery."],
  "olympic-weightlifting": ["[PMID 37640059] Olympic-weightlifting meta-analysis: short-sprint transfer should be tested rather than presumed; no significant acceleration or full-sprint advantage was established against comparators."],
};

const modifierEvidenceRecords: Record<string, Record<string, string[]>> = {
  "american-football": {
    qb: ["[S4–S5] American-football workload reviews: role adjustment is descriptive; no quarterback-specific dose is inferred."],
    rb: ["[S1] NCAA Division I positional GPS/accelerometry; [S4] workload-management review."],
    "wr-db": ["[S1] NCAA Division I positional GPS/accelerometry; [S2] 3-year NFL positional player-tracking review."],
    "lb-te": ["[S1] NCAA Division I positional GPS/accelerometry; [S4] workload-management review."],
    line: ["[S2] 3-year NFL positional player-tracking review: lower high-velocity exposure and greater contact context than non-linemen."],
  },
  "ice-hockey": {
    forward: ["[S3] Professional match analysis: playing-time-normalized acceleration/deceleration and positional load context."],
    defense: ["[S3] Professional match analysis: defensemen recorded greater high-threshold decelerations per minute."],
    skater: ["[S1] On-ice skating biomechanics; [S4] 107-study on-ice testing systematic review."],
    goalie: ["[S2] Wearable-technology scoping review: goalie context remains device- and protocol-dependent; no skater-norm substitution."],
  },
  "track-and-field": {
    sprint: ["[S1] Sprint-start narrative review; [S2] 109-study sprint-phase systematic review."],
    hurdles: ["[S4] World Athletics event biomechanics resource; sprint-phase reviews do not directly establish hurdle prescriptions."],
    "middle-distance": ["[S4] World Athletics event biomechanics resource; this is an event-context planning layer, not a universal load target."],
    distance: ["[S4] World Athletics event biomechanics resource; no sprint-study values are carried into distance guidance."],
    jumps: ["[S4] World Athletics event biomechanics resource; event-specific takeoff and landing work requires dedicated evidence."],
    throws: ["[S4] World Athletics event biomechanics resource; sprint findings are not treated as throw-event validation."],
    "multi-events": ["[S4] World Athletics event biomechanics resource; mixed-event priorities remain event and season-context dependent."],
  },
  swimming: {
    freestyle: ["[Kwok et al., 2021] Front-crawl strength and conditioning systematic review; evidence is front-crawl-specific."],
    butterfly: ["[Gonjo & Olstad, 2020] National-level sprint-butterfly start and turn segment study."],
    breaststroke: ["[Costa et al., 2015] Competitive-swimming longitudinal adaptation review; no front-crawl evidence is transferred as breaststroke fact."],
    backstroke: ["[Costa et al., 2015] Competitive-swimming longitudinal adaptation review; stroke-specific extrapolation is limited."],
    im: ["[Costa et al., 2015] Competitive-swimming longitudinal adaptation review; medley remains a mixed-stroke planning context."],
    sprint: ["[Vantorre et al., 2014] Swim-start biomechanics review; [Gonjo & Olstad, 2020] underwater phase study."],
    "middle-distance": ["[Costa et al., 2015] Competitive-swimming longitudinal adaptation review; event-distance response remains heterogeneous."],
    distance: ["[Costa et al., 2015] Competitive-swimming longitudinal adaptation review; no universal distance prescription is inferred."],
  },
};

Object.entries(modifierEvidenceRecords).forEach(([sportId, records]) => {
  seeds[sportId]?.modifiers?.forEach((item) => {
    const directRecords = records[item.id] || [];
    const sportRecords = modifierEvidenceSources[sportId] || [`${sportId} evidence inventory — reviewed source scope is limited to the selected role, event, stroke, distance, or style context.`];
    item.evidenceSources = [...directRecords, ...sportRecords];
  });
});

Object.entries(seeds).forEach(([sportId, seed]) => {
  seed.modifiers?.forEach((item) => {
    item.evidenceSources ||= modifierEvidenceSources[sportId] || [`${sportId} evidence inventory — reviewed source scope is limited to the selected role, event, stroke, distance, or style context.`];
    if (!/planning|not an athlete measurement|not a prescription/i.test(item.evidenceBoundary)) {
      item.evidenceBoundary = `${item.evidenceBoundary} This modifier is a planning context, not an athlete measurement or universal prescription.`;
    }
  });
});

const baseScore = (key: SportDemandKey, active: SportDemandKey[]) => active.includes(key) ? 0.78 : 0.32;

const modifierDemandMap: Record<string, SportDemandKey[]> = {
  strength: ["maxStrength", "relativeStrength"], power: ["power", "rateOfForceDevelopment"], acceleration: ["acceleration", "speed"], speed: ["speed", "acceleration"], deceleration: ["deceleration", "eccentricStrength"], "change of direction": ["changeOfDirection", "reactiveAgility"], contact: ["isometricStrength", "antiRotation"], bracing: ["antiRotation", "isometricStrength"], grip: ["grip", "isometricStrength"], endurance: ["strengthEndurance", "aerobicCapacity"], aerobic: ["aerobicCapacity", "strengthEndurance"], anaerobic: ["anaerobicCapacity", "repeatSprint"], mobility: ["mobility", "stability"], shoulder: ["stability", "strengthEndurance"], hip: ["mobility", "stability"], lateral: ["changeOfDirection", "deceleration"], jump: ["plyometricAbility", "elasticStrength"], landing: ["eccentricStrength", "deceleration"], rotation: ["rotationalPower", "antiRotation"], turn: ["coordination", "power"], technique: ["coordination", "stability"], balance: ["balance", "stability"],
};

function modifierBoosts(modifier?: SportModifier) {
  if (!modifier) return new Map<SportDemandKey, number>();
  const boosts = new Map<SportDemandKey, number>();
  const normalized = modifier.emphasis.join(" ").toLowerCase();
  for (const [token, demands] of Object.entries(modifierDemandMap)) {
    if (!normalized.includes(token)) continue;
    demands.forEach((demand) => boosts.set(demand, Math.max(boosts.get(demand) || 0, 0.08)));
  }
  return boosts;
}

export function getSportModifiers(sportId: string): SportModifier[] {
  return seeds[sportId]?.modifiers || [];
}

export function getSportDemandModel(sportId: string, modifierId?: string) {
  const seed = seeds[sportId] || { demands: ["stability", "coordination", "strengthEndurance"] as SportDemandKey[] };
  const activeModifier = seed.modifiers?.find((item) => item.id === modifierId);
  const selectedModifier = activeModifier ? {
    ...activeModifier,
    evidenceSources: activeModifier.evidenceSources || modifierEvidenceSources[sportId] || [`${sportId} evidence inventory — reviewed source scope documented in the project register.`],
  } : undefined;
  const boosts = modifierBoosts(selectedModifier);
  const demands: EvidenceBoundedDemand[] = (Object.keys(labels) as SportDemandKey[]).map((key) => ({
    key,
    label: labels[key],
    score: Math.min(0.9, baseScore(key, seed.demands) + (boosts.get(key) || 0)),
    confidence: (seed.demands.includes(key) ? "Moderate" : boosts.has(key) ? "Moderate" : "Developing") as Confidence,
    evidenceType: (seed.demands.includes(key) ? "literature-derived" : boosts.has(key) ? "expert-inference" : "model-estimated") as EvidenceType,
    reasoning: seed.demands.includes(key) ? (boosts.has(key) ? "Included in the sport-level evidence register and elevated by the selected role/event/style planning context." : "Included as a sport-level demand from the reviewed evidence register.") : boosts.has(key) ? "Elevated as a transparent role/event/style planning inference; athlete and movement context may change it." : "Retained as a lower-priority planning estimate; athlete and movement context may change it.",
  })).sort((a, b) => b.score - a.score);
  return { demands, selectedModifier, evidenceBoundary: "Scores are evidence-bounded planning comparisons, not measurements of an individual athlete or deterministic sport-performance targets." };
}

const adaptationFor = (demands: EvidenceBoundedDemand[]) => demands.slice(0, 3).map((demand) => `${demand.label.toLowerCase()} development`);

export function buildMovementReasoning(movement: SportMovementProfile, modifierId?: string) {
  const model = getSportDemandModel(movement.sportId, modifierId);
  const modifierText = model.selectedModifier ? `${model.selectedModifier.label}: ${model.selectedModifier.emphasis.join(", ")}` : "General sport profile";
  const priorities = model.demands.slice(0, 4);
  return {
    sport: movement.sportLabel,
    modifier: modifierText,
    modifierEvidenceScope: model.selectedModifier?.evidenceScope || "General sport-profile evidence register; no role, event, stroke, distance, or style modifier is active.",
    modifierEvidenceSources: model.selectedModifier?.evidenceSources || ["General sport evidence inventory — reviewed source scope documented in the project register."],
    movement: movement.label,
    biomechanics: movement.bodyActions,
    physiologicalDemands: priorities.map((demand) => `${demand.label} (${demand.evidenceType === "literature-derived" ? "reviewed sport evidence" : "planning inference"})`),
    physicalQualities: priorities.map((demand) => demand.label),
    physicalQualityKeys: priorities.map((demand) => demand.key),
    adaptations: adaptationFor(priorities),
    modality: "Use progressively loadable gym modalities to develop the identified capacity; do not treat gym work as a reproduction of sport skill under load.",
    exerciseRole: "Rank exercises by movement-transfer similarity and their distinct muscle-targeting contribution; select a diverse group rather than duplicate the same demand.",
    programming: "Use the athlete’s goal, available equipment, weekly schedule, and current training tolerance to set dose. Sport context changes priorities, not fixed sets, loads, or recovery targets.",
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
