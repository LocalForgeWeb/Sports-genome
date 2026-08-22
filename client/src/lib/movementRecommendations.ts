/** Kinetic Field Manual: transparent, movement-led recommendation logic for athlete and coach decision support. */
import { exercises, type Exercise, type Grade } from "@/lib/exerciseCatalog";
import { sportMovementProfiles, type SportMovementProfile } from "@/lib/sportMovementDatabase";
import { equipmentMatchesProfile, type AthleteEquipmentProfile } from "@/lib/equipmentProfile";
import { getSportDemandModel } from "@/lib/hierarchicalSportModel";

export type MovementSignal = "acceleration" | "braking" | "lateral" | "rotation" | "jump" | "push" | "pull" | "overhead" | "grip" | "bracing" | "posterior" | "knee" | "conditioning" | "singleLeg";

const signalRules: { signal: MovementSignal; matcher: RegExp; muscles: string[]; qualities: string[] }[] = [
  { signal: "acceleration", matcher: /acceleration|sprint|start|drive|push-off|stride|skating/i, muscles: ["glutes", "hamstrings", "quads", "calves"], qualities: ["sprintSupport", "locomotion", "power"] },
  { signal: "braking", matcher: /deceleration|braking|landing|absorption|hard stop|recovery|eccentric/i, muscles: ["quads", "glutes", "hamstrings", "calves"], qualities: ["deceleration", "unilateral", "bracing"] },
  { signal: "lateral", matcher: /lateral|shuffle|cut|crossover|sidestep|carving|edge|jockey|dodge|turn/i, muscles: ["abductors", "adductors", "glutes", "quads"], qualities: ["lateralControl", "unilateral", "deceleration"] },
  { signal: "rotation", matcher: /rotation|rotational|swing|shot|throw|punch|pass|kick|hip turn|pivot|cradling/i, muscles: ["obliques", "glutes", "abs", "shoulders"], qualities: ["rotation", "power", "antiRotation"] },
  { signal: "jump", matcher: /jump|takeoff|bound|vault|hurdle|dunk|rebounding|header|aerial/i, muscles: ["quads", "glutes", "calves"], qualities: ["jumping", "power", "elasticity"] },
  { signal: "push", matcher: /push|block|press|stiff-arm|tackle|scrum|drive|guard|handstand|lockout/i, muscles: ["chest", "triceps", "frontDelts", "quads"], qualities: ["strength", "bracing", "power"] },
  { signal: "pull", matcher: /pull|row|catch|grip|clinch|lock|faceoff|retraction|lever|rope/i, muscles: ["lats", "upperBack", "biceps", "forearms"], qualities: ["grip", "scapularControl", "strength"] },
  { signal: "overhead", matcher: /overhead|serve|spike|throw-in|pitch|streamline|reaching|release|butterfly/i, muscles: ["shoulders", "triceps", "traps", "rotatorCuff"], qualities: ["scapularControl", "strength", "power"] },
  { signal: "grip", matcher: /grip|hand|wrist|squeeze|cradle|stick|bat|racket|pummel/i, muscles: ["forearms", "biceps", "upperBack"], qualities: ["grip", "endurance"] },
  { signal: "bracing", matcher: /brace|anti-rotation|stabilization|stabilize|contact|box-out|shield|stance|isometric|balance/i, muscles: ["abs", "obliques", "glutes", "upperBack"], qualities: ["bracing", "antiRotation", "unilateral"] },
  { signal: "posterior", matcher: /hip extension|hinge|bridge|sprawl|backflip|posterior|hip swing/i, muscles: ["glutes", "hamstrings", "lowerBack"], qualities: ["strength", "eccentric", "sprintSupport"] },
  { signal: "knee", matcher: /squat|level change|knee extension|low stance|catch position|dip/i, muscles: ["quads", "glutes", "adductors"], qualities: ["strength", "hypertrophy", "unilateral"] },
  { signal: "conditioning", matcher: /sustained|repeated|high-rate|distance|cycle|recovery|running/i, muscles: ["quads", "glutes", "calves", "upperBack"], qualities: ["conditioning", "locomotion", "endurance"] },
  { signal: "singleLeg", matcher: /single-leg|unilateral|lead-leg|support leg|split stance|one foot/i, muscles: ["glutes", "quads", "abductors", "adductors"], qualities: ["unilateral", "lateralControl", "bracing"] },
];

const humanMuscleAliases: Record<string, string[]> = {
  chest: ["pectoralis", "pec"],
  frontDelts: ["anterior deltoid", "deltoid"],
  sideDelts: ["middle deltoid"],
  rearDelts: ["posterior deltoid"],
  shoulders: ["shoulder", "deltoid"],
  triceps: ["triceps"],
  biceps: ["biceps"],
  brachialis: ["brachialis"],
  forearms: ["forearm", "wrist", "finger"],
  abs: ["rectus abdominis", "abdominals", "abdominal"],
  obliques: ["oblique"],
  quads: ["quadriceps", "rectus femoris"],
  glutes: ["glute", "hip extensor"],
  hamstrings: ["hamstring"],
  calves: ["calf", "gastrocnemius", "soleus", "plantar flexor"],
  tibialis: ["tibialis"],
  adductors: ["adductor", "groin"],
  abductors: ["abductor", "gluteus medius", "gluteus minimus"],
  lats: ["latissimus", "lats"],
  upperBack: ["upper back", "rhomboid"],
  traps: ["trapezius", "traps"],
  lowerBack: ["spinal erector", "erector spinae"],
  rotatorCuff: ["rotator cuff"],
};

export type RecommendationBreakdown = {
  overall: number;
  muscleMatch: number;
  movementTransferSimilarity: number;
  jointActionMatch: number;
  physicalQualityMatch: number;
  forceDirectionMatch: number;
  stabilityMatch: number;
  velocityMatch: number;
  strengths: string[];
  limitations: string[];
};

export type PreparationClassification = "General physical preparation" | "Special physical preparation" | "Highly specific physical preparation";

export type MovementRecommendation = { exercise: Exercise; score: number; grade: Grade; matchedSignals: MovementSignal[]; matchedMuscles: string[]; preparation: PreparationClassification; rationale: string; breakdown: RecommendationBreakdown };

const hierarchyQualityMap: Record<string, string[]> = {
  maxStrength: ["strength"], relativeStrength: ["strength", "unilateral"], power: ["power", "jumping", "rotation"],
  rateOfForceDevelopment: ["power", "jumping", "sprintSupport"], acceleration: ["sprintSupport", "power", "unilateral"],
  deceleration: ["deceleration", "unilateral", "bracing"], changeOfDirection: ["lateralControl", "unilateral", "deceleration"],
  reactiveAgility: ["lateralControl", "unilateral", "coordination"], plyometricAbility: ["jumping", "power", "elasticity"],
  elasticStrength: ["jumping", "elasticity", "power"], isometricStrength: ["bracing", "antiRotation", "grip"],
  eccentricStrength: ["eccentric", "deceleration"], strengthEndurance: ["endurance", "conditioning"], grip: ["grip"],
  rotationalPower: ["rotation", "power"], antiRotation: ["antiRotation", "bracing"], mobility: ["mobility"],
  stability: ["bracing", "unilateral", "scapularControl"], coordination: ["coordination", "unilateral"],
  aerobicCapacity: ["conditioning", "locomotion"], anaerobicCapacity: ["conditioning", "power"], repeatSprint: ["sprintSupport", "conditioning", "power"],
  speed: ["sprintSupport", "power"], balance: ["unilateral", "bracing", "lateralControl"],
};

function hierarchyBoost(exercise: Exercise, sportId: string, modifierId?: string) {
  const model = getSportDemandModel(sportId, modifierId);
  const activeKeys = model.demands.filter((demand) => demand.score >= 0.7).map((demand) => demand.key);
  const qualityBoost = activeKeys.reduce((total, key) => total + (hierarchyQualityMap[key] || []).filter((quality) => exercise.qualities.includes(quality)).length * 0.34, 0);
  const emphasis = model.selectedModifier?.emphasis.join(" ").toLowerCase() || "";
  const text = `${exercise.name} ${exercise.movement} ${exercise.qualities.join(" ")} ${exercise.primaryMuscles.join(" ")}`.toLowerCase();
  const tokens = ["grip", "speed", "acceleration", "power", "isometric", "mobility", "rotation", "landing", "lateral", "aerobic", "hip", "shoulder", "jump", "bracing"];
  const modifierBoost = tokens.filter((token) => emphasis.includes(token) && text.includes(token)).length * 0.55;
  return qualityBoost + modifierBoost;
}

export function getSportProgrammingContext(sportId: string, modifierId?: string) {
  const model = getSportDemandModel(sportId, modifierId);
  const priorities = model.demands.filter((demand) => demand.score >= 0.7).slice(0, 4);
  const modifierEvidenceSources = model.selectedModifier?.evidenceSources || ["General sport evidence inventory — reviewed source scope documented in the project register."];
  return {
    modifierLabel: model.selectedModifier?.label || "General sport profile",
    modifierEvidenceSources,
    priorities: priorities.map((demand) => demand.label),
    physiologicalDemands: priorities.map((demand) => `${demand.label} (${demand.evidenceType === "literature-derived" ? "reviewed evidence" : "planning inference"})`),
    adaptationTargets: priorities.map((demand) => `${demand.label.toLowerCase()} development`),
    modalityBoundary: "Use gym work to build the identified capacities; sport practice remains the highest-specificity stimulus.",
    exerciseRole: "Choose a diverse mix of movement-transfer and muscle-targeting contributors; avoid treating a single exercise as the sport skill itself.",
    programmingBoundary: `Exercise order, load, repetitions, rest, and weekly exposure remain planning variables, not fixed outcomes of a sport label. Active modifier evidence: ${modifierEvidenceSources.join(" ")}`,
    evidenceBoundary: model.evidenceBoundary,
  };
}

export function getMovementSignals(profile: SportMovementProfile): MovementSignal[] {
  const haystack = `${profile.label} ${profile.bodyActions} ${profile.primaryMuscles} ${profile.stabilizers} ${profile.family}`;
  const found = signalRules.filter((rule) => rule.matcher.test(haystack)).map((rule) => rule.signal);
  return found.length ? found : ["bracing"];
}

export function getMovementMuscles(profile: SportMovementProfile): string[] {
  const haystack = `${profile.primaryMuscles} ${profile.stabilizers}`.toLowerCase();
  return Object.entries(humanMuscleAliases).filter(([, aliases]) => aliases.some((alias) => haystack.includes(alias))).map(([key]) => key);
}

function gradeForScore(score: number): Grade {
  if (score >= 12) return "SS";
  if (score >= 9) return "S";
  if (score >= 7) return "A";
  if (score >= 5) return "B";
  if (score >= 3) return "C";
  if (score >= 1) return "D";
  return "F";
}

const percentage = (value: number) => Math.max(0, Math.min(99, Math.round(value)));

function scoreReason(exercise: Exercise, matchedSignals: MovementSignal[], matchedMuscles: string[]) {
  const has = (signal: MovementSignal) => matchedSignals.includes(signal);
  const name = exercise.name.toLowerCase();
  const movement = exercise.movement.toLowerCase();
  if (movement.includes("lateral") || name.includes("lateral")) return "Adds frontal-plane strength and lateral hip control alongside the entry’s forward drive.";
  if (movement.includes("lunge") || name.includes("lunge")) return "Strong unilateral leg-drive match with greater single-leg control and stance stability demand.";
  if (name.includes("hack squat")) return "High-force knee-extension option for building leg drive with a more guided stability demand.";
  if (has("singleLeg") && exercise.qualities.includes("unilateral")) return "Strong unilateral force-production match with a meaningful single-leg stability demand.";
  if (has("lateral") && exercise.qualities.includes("lateralControl")) return "Adds frontal-plane strength and lateral hip control that the action demands.";
  if (has("rotation") && exercise.qualities.includes("rotation")) return "Builds rotational force with a clear trunk-to-hip transfer path.";
  if (has("acceleration") && has("knee")) return "Excellent match for leg drive, knee extension, and forward projection.";
  if (has("braking") && exercise.qualities.includes("deceleration")) return "Useful for controlled force absorption and position-aware braking.";
  if (has("overhead") && exercise.qualities.includes("scapularControl")) return "Supports overhead force with focused shoulder and scapular control.";
  if (has("pull") && exercise.qualities.includes("grip")) return "Reinforces pulling strength and grip control for the sport action.";
  if (matchedMuscles.length >= 3) return "Strong tissue match across several of the movement’s highest-demand muscles.";
  return "Useful accessory support, with more limited movement-specific transfer than the top choices.";
}

function buildBreakdown(exercise: Exercise, signals: MovementSignal[], matchedSignals: MovementSignal[], matchedMuscles: string[], score: number): RecommendationBreakdown {
  const signalCoverage = matchedSignals.length / Math.max(1, signals.length);
  const muscleMatch = percentage(40 + matchedMuscles.length * 16);
  const physicalQualityMatch = percentage(42 + signalCoverage * 54);
  const jointActionMatch = percentage(38 + Math.min(4, matchedSignals.length) * 14);
  const forceDirectionMatch = percentage(36 + (matchedSignals.some((item) => ["acceleration", "push", "pull", "rotation", "lateral"].includes(item)) ? 48 : 20));
  const movementTransferSimilarity = percentage(18 + signalCoverage * 52 + (matchedSignals.length >= 3 ? 16 : matchedSignals.length * 5) + (exercise.qualities.some((quality) => ["power", "unilateral", "rotation", "deceleration", "sprintSupport"].includes(quality)) ? 8 : 0));
  const stabilityMatch = percentage(34 + (exercise.qualities.some((quality) => ["unilateral", "bracing", "antiRotation", "scapularControl", "lateralControl"].includes(quality)) ? 50 : 20));
  const velocityMatch = percentage(30 + (exercise.qualities.some((quality) => ["power", "jumping", "sprintSupport", "elasticity"].includes(quality)) ? 53 : 20));
  const strengths = [
    matchedSignals.includes("singleLeg") && exercise.qualities.includes("unilateral") ? "unilateral force-production correspondence" : "",
    matchedSignals.includes("acceleration") && exercise.qualities.includes("power") ? "forward projection and acceleration qualities" : "",
    matchedSignals.includes("rotation") && exercise.qualities.includes("rotation") ? "trunk-to-hip rotational transfer" : "",
    matchedMuscles.length >= 2 ? `direct support for ${matchedMuscles.slice(0, 2).join(" and ")}` : "",
    exercise.qualities.includes("bracing") || exercise.qualities.includes("antiRotation") ? "position and trunk-stiffness demand" : "",
  ].filter(Boolean).slice(0, 3);
  const limitations = [
    velocityMatch < 58 ? "less velocity-specific than the sport action" : "",
    stabilityMatch < 58 ? "limited dedicated stability demand" : "",
    matchedMuscles.length < 2 ? "narrower tissue carryover than the highest-ranked options" : "",
  ].filter(Boolean).slice(0, 2);
  return {
    overall: percentage(50 + score * 3.55),
    muscleMatch,
    movementTransferSimilarity,
    jointActionMatch,
    physicalQualityMatch,
    forceDirectionMatch,
    stabilityMatch,
    velocityMatch,
    strengths: strengths.length ? strengths : ["general support for the selected movement pattern"],
    limitations: limitations.length ? limitations : ["use alongside more movement-specific work when transfer is the main goal"],
  };
}

function classifyPreparation(exercise: Exercise, matchedSignals: MovementSignal[], profile: SportMovementProfile): PreparationClassification {
  const text = `${exercise.name} ${exercise.movement} ${exercise.qualities.join(" ")}`.toLowerCase();
  const actionText = `${profile.label} ${profile.bodyActions}`.toLowerCase();
  const directSportAction = ["sprint", "jump", "throw", "pitch", "serve", "shot", "takedown", "skate", "row", "swim"].some((term) => text.includes(term) && actionText.includes(term));
  if (directSportAction && matchedSignals.length >= 3) return "Highly specific physical preparation";
  const specialMethod = ["sled", "landmine", "medicine ball", "plyometric", "jump", "battle rope", "cable rotation", "single-leg"].some((term) => text.includes(term)) || matchedSignals.length >= 3;
  return specialMethod ? "Special physical preparation" : "General physical preparation";
}

export function getMovementRecommendations(profile: SportMovementProfile, limit = 6): MovementRecommendation[] {
  const signals = getMovementSignals(profile);
  const profileMuscles = getMovementMuscles(profile);
  return exercises.map((exercise) => {
    const exerciseMuscles = [...exercise.primaryMuscles, ...exercise.secondaryMuscles];
    const matchedSignals = signals.filter((signal) => signalRules.find((rule) => rule.signal === signal)?.qualities.some((quality) => exercise.qualities.includes(quality)));
    const matchedMuscles = profileMuscles.filter((muscle) => exerciseMuscles.includes(muscle) || (muscle === "shoulders" && exerciseMuscles.some((item) => ["frontDelts", "sideDelts", "rearDelts"].includes(item))));
    const score = matchedSignals.length * 2.25 + matchedMuscles.length * 1.75 + (exercise.qualities.includes("power") && signals.includes("rotation") ? 1.25 : 0) + (exercise.qualities.includes("unilateral") && signals.includes("singleLeg") ? 1 : 0);
    const grade = gradeForScore(score);
    const rationale = scoreReason(exercise, matchedSignals, matchedMuscles);
    const breakdown = buildBreakdown(exercise, signals, matchedSignals, matchedMuscles, score);
    const preparation = classifyPreparation(exercise, matchedSignals, profile);
    return { exercise, score, grade, matchedSignals, matchedMuscles, preparation, rationale, breakdown };
  }).sort((a, b) => b.score - a.score || a.exercise.id - b.exercise.id).slice(0, limit);
}

export function getSportSession(sportId: string, goal: string, limit = 6, equipmentProfile?: AthleteEquipmentProfile, modifierId?: string): MovementRecommendation[] {
  const profiles = sportMovementProfiles.filter((profile) => profile.sportId === sportId);
  const pooled = new Map<number, MovementRecommendation>();
  profiles.forEach((profile) => getMovementRecommendations(profile, 10).forEach((result) => {
    const existing = pooled.get(result.exercise.id);
    const goalBoost = goal === "Athleticism" && result.exercise.qualities.some((quality) => ["power", "jumping", "sprintSupport", "rotation"].includes(quality)) ? 1.2 : goal === "Muscle growth" && result.exercise.qualities.includes("hypertrophy") ? 0.9 : goal === "Max strength" && result.exercise.qualities.includes("strength") ? 0.9 : 0;
    const candidate = { ...result, score: result.score + goalBoost + hierarchyBoost(result.exercise, sportId, modifierId) };
    if (!existing || candidate.score > existing.score) pooled.set(result.exercise.id, candidate);
  }));
  const allCandidates = Array.from(pooled.values());
  const candidates = equipmentProfile ? allCandidates.filter((candidate) => equipmentMatchesProfile(candidate.exercise.equipment, equipmentProfile.availableEquipment)) : allCandidates;
  candidates.sort((a, b) => b.score - a.score || a.exercise.id - b.exercise.id);
  const selected: MovementRecommendation[] = [];
  const muscleOverlap = (first: MovementRecommendation, second: MovementRecommendation) => {
    const firstMuscles = new Set([...first.exercise.primaryMuscles, ...first.exercise.secondaryMuscles]);
    const secondMuscles = new Set([...second.exercise.primaryMuscles, ...second.exercise.secondaryMuscles]);
    const shared = Array.from(firstMuscles).filter((muscle) => secondMuscles.has(muscle));
    return shared.length / Math.max(1, new Set([...Array.from(firstMuscles), ...Array.from(secondMuscles)]).size);
  };
  while (selected.length < limit && candidates.length) {
    const next = candidates.map((candidate) => {
      const sameMovement = selected.filter((item) => item.exercise.movement === candidate.exercise.movement).length;
      const sameEquipment = selected.filter((item) => item.exercise.equipment === candidate.exercise.equipment).length;
      const averageOverlap = selected.length ? selected.reduce((total, item) => total + muscleOverlap(candidate, item), 0) / selected.length : 0;
      const novelSignals = candidate.matchedSignals.filter((signal) => !selected.some((item) => item.matchedSignals.includes(signal))).length;
      const novelMuscles = candidate.matchedMuscles.filter((muscle) => !selected.some((item) => item.matchedMuscles.includes(muscle))).length;
      const diversityAdjustment = novelSignals * 2.2 + novelMuscles * 1.5 - sameMovement * 6.2 - averageOverlap * 5.5 - Math.max(0, sameEquipment - 2) * 0.7;
      return { candidate, diversifiedScore: candidate.score + diversityAdjustment };
    }).sort((a, b) => b.diversifiedScore - a.diversifiedScore || a.candidate.exercise.id - b.candidate.exercise.id)[0]?.candidate;
    if (!next) break;
    selected.push(next);
    candidates.splice(candidates.findIndex((candidate) => candidate.exercise.id === next.exercise.id), 1);
  }
  return selected;
}

export function findSportMovement(sportId: string, movementId?: string) {
  const movements = sportMovementProfiles.filter((profile) => profile.sportId === sportId);
  return movements.find((profile) => profile.id === movementId) || movements[0] || sportMovementProfiles[0];
}
