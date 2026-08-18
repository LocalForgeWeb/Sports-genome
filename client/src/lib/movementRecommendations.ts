/** Kinetic Field Manual: transparent, movement-led recommendation logic for athlete and coach decision support. */
import { exercises, type Exercise, type Grade } from "@/lib/exerciseCatalog";
import { sportMovementProfiles, type SportMovementProfile } from "@/lib/sportMovementDatabase";

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

export type MovementRecommendation = { exercise: Exercise; score: number; grade: Grade; matchedSignals: MovementSignal[]; matchedMuscles: string[]; rationale: string };

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

export function getMovementRecommendations(profile: SportMovementProfile, limit = 6): MovementRecommendation[] {
  const signals = getMovementSignals(profile);
  const profileMuscles = getMovementMuscles(profile);
  return exercises.map((exercise) => {
    const exerciseMuscles = [...exercise.primaryMuscles, ...exercise.secondaryMuscles];
    const matchedSignals = signals.filter((signal) => signalRules.find((rule) => rule.signal === signal)?.qualities.some((quality) => exercise.qualities.includes(quality)));
    const matchedMuscles = profileMuscles.filter((muscle) => exerciseMuscles.includes(muscle) || (muscle === "shoulders" && exerciseMuscles.some((item) => ["frontDelts", "sideDelts", "rearDelts"].includes(item))));
    const score = matchedSignals.length * 2.25 + matchedMuscles.length * 1.75 + (exercise.qualities.includes("power") && signals.includes("rotation") ? 1.25 : 0) + (exercise.qualities.includes("unilateral") && signals.includes("singleLeg") ? 1 : 0);
    const grade = gradeForScore(score);
    const rationale = `Shares ${matchedSignals.length ? matchedSignals.join(", ") : "support"} demand${matchedMuscles.length ? ` and ${matchedMuscles.join(", ")} involvement` : ""}.`;
    return { exercise, score, grade, matchedSignals, matchedMuscles, rationale };
  }).sort((a, b) => b.score - a.score || a.exercise.id - b.exercise.id).slice(0, limit);
}

export function getSportSession(sportId: string, goal: string, limit = 6): MovementRecommendation[] {
  const profiles = sportMovementProfiles.filter((profile) => profile.sportId === sportId);
  const pooled = new Map<number, MovementRecommendation>();
  profiles.forEach((profile) => getMovementRecommendations(profile, 10).forEach((result) => {
    const existing = pooled.get(result.exercise.id);
    const goalBoost = goal === "Athleticism" && result.exercise.qualities.some((quality) => ["power", "jumping", "sprintSupport", "rotation"].includes(quality)) ? 1.2 : goal === "Muscle growth" && result.exercise.qualities.includes("hypertrophy") ? 0.9 : goal === "Max strength" && result.exercise.qualities.includes("strength") ? 0.9 : 0;
    const candidate = { ...result, score: result.score + goalBoost };
    if (!existing || candidate.score > existing.score) pooled.set(result.exercise.id, candidate);
  }));
  return Array.from(pooled.values()).sort((a, b) => b.score - a.score || a.exercise.id - b.exercise.id).slice(0, limit);
}

export function findSportMovement(sportId: string, movementId?: string) {
  const movements = sportMovementProfiles.filter((profile) => profile.sportId === sportId);
  return movements.find((profile) => profile.id === movementId) || movements[0];
}
