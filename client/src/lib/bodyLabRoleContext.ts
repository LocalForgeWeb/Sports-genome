import { getEnrichedMovement } from "@/lib/enrichedSportMovementDatabase";

export type BodyLabRole = "Primary Mover" | "Synergist" | "Stabilizer" | "Supporting";
export type BodyLabEvidenceConfidence = "Direct evidence" | "Strong indirect evidence" | "Biomechanical model" | "Movement model";

export type BodyLabRoleDetail = {
  roles: BodyLabRole[];
  roleOrder: BodyLabRole[];
  confidence: BodyLabEvidenceConfidence;
  sourceScope: "Movement-specific evidence" | "General biomechanics" | "Movement-model fallback";
  sources: string[];
  phaseContext?: string;
};

export type BodyLabRoleContext = {
  primary: string[];
  supporting: string[];
  rolesByMuscle: Record<string, BodyLabRoleDetail>;
  methodology: string;
};

/**
 * What the Body Lab shows when the athlete has chosen no sport.
 *
 * Reported: an athlete picked "no sport" and a lower-back focus, and the Body Lab
 * showed them the wrestling penetration step. Nothing was random about it. With no
 * sport chosen, `selectedSport` falls back to `sportProfiles[0]`, which is
 * Wrestling; `activeSportId` becomes "wrestling"; and `findSportMovement` returns
 * that sport's first movement, which is the penetration step. Three ordinary
 * fallbacks in a row turned an empty answer into a confident wrong one.
 *
 * An empty role map is the honest value: no muscle is claimed for an action the
 * athlete never selected.
 */
export const noSportActionRoleContext: BodyLabRoleContext = {
  primary: [],
  supporting: [],
  rolesByMuscle: {},
  methodology: "No sport action is selected, so no muscle roles are shown. Pick a sport above to see what one of its actions asks of the body.",
};

const muscleAliases: Record<string, string[]> = {
  chest: ["pectoralis major", "pectoralis minor", "chest"],
  frontDelts: ["anterior deltoid"], sideDelts: ["lateral deltoid", "middle deltoid"], rearDelts: ["posterior deltoid"], shoulders: ["deltoid"],
  triceps: ["triceps"], biceps: ["biceps"], brachialis: ["brachialis"], brachioradialis: ["brachioradialis"], forearms: ["forearm", "wrist", "finger flexor", "finger extensor"],
  abs: ["rectus abdominis", "transversus abdominis", "abdominal wall", "abdominals"], obliques: ["oblique", "obliquus"], serratusAnterior: ["serratus"],
  hipFlexors: ["iliopsoas", "hip flexor"], tfl: ["tensor fasciae latae", "tfl"], quads: ["quadriceps", "rectus femoris", "vastus"], adductors: ["adductor", "gracilis", "pectineus"],
  abductors: ["gluteus medius", "gluteus minimus", "hip abductor"], glutes: ["gluteus maximus", "gluteal"], hamstrings: ["hamstring", "biceps femoris", "semitendinosus", "semimembranosus"],
  calves: ["gastrocnemius", "plantar flexor"], soleus: ["soleus"], tibialis: ["tibialis"], peroneals: ["perone"],
  lats: ["latissimus"], traps: ["trapezius"], rhomboids: ["rhomboid"], lowerBack: ["erector spinae", "multifidus", "lower back", "spinal erector"], rotatorCuff: ["rotator cuff", "infraspinatus", "supraspinatus", "teres minor", "subscapularis"],
};

const defaultRoleOrder: BodyLabRole[] = ["Primary Mover", "Synergist", "Stabilizer", "Supporting"];
export const getBodyLabRoleOrder = (contractionRoles: string[], jointActions: string[] = []): BodyLabRole[] => {
  const mechanicsContext = [...contractionRoles, ...jointActions].join(" ").toLowerCase();
  const hasExplicitStabilityDemand = /isometric|stabili[sz]|anti-rotation|brac|post(?:ing)?|attachment|clamp|connection|control/.test(mechanicsContext);
  const hasBrakingOrAbsorptionDemand = /eccentric|decelerat|brak|land|absorb|arrest/.test(mechanicsContext);
  if (hasExplicitStabilityDemand || hasBrakingOrAbsorptionDemand) return ["Primary Mover", "Stabilizer", "Synergist", "Supporting"];
  return defaultRoleOrder;
};
const confidenceFor = (value: string | undefined): BodyLabEvidenceConfidence => {
  const confidence = value?.toLowerCase() || "";
  if (confidence.includes("direct")) return "Direct evidence";
  if (confidence.includes("strong") || confidence.includes("high")) return "Strong indirect evidence";
  if (confidence.includes("moderate")) return "Biomechanical model";
  return "Movement model";
};

const keysForName = (name: string) => {
  if (name in muscleAliases) return [name];
  const normalized = name.toLowerCase();
  return Object.entries(muscleAliases).filter(([, aliases]) => aliases.some((alias) => normalized.includes(alias))).map(([key]) => key);
};

const appendRole = (rolesByMuscle: Record<string, BodyLabRoleDetail>, name: string, role: BodyLabRole, detail: Omit<BodyLabRoleDetail, "roles">) => {
  keysForName(name).forEach((key) => {
    const existing = rolesByMuscle[key];
    const roles = Array.from(new Set([...(existing?.roles || []), role])).sort((left, right) => detail.roleOrder.indexOf(left) - detail.roleOrder.indexOf(right));
    rolesByMuscle[key] = { ...detail, ...existing, roles };
  });
};

export function getBodyLabRoleContext(sportId: string, movementId: string, fallbackPrimary: string[], fallbackSupporting: string[]): BodyLabRoleContext {
  const movement = getEnrichedMovement(sportId, movementId);
  if (!movement) {
    const rolesByMuscle: Record<string, BodyLabRoleDetail> = {};
    const detail = { roleOrder: defaultRoleOrder, confidence: "Movement model" as const, sourceScope: "Movement-model fallback" as const, sources: [] };
    fallbackPrimary.forEach((name) => appendRole(rolesByMuscle, name, "Primary Mover", detail));
    fallbackSupporting.forEach((name) => appendRole(rolesByMuscle, name, "Supporting", detail));
    return { primary: Object.keys(rolesByMuscle).filter((key) => rolesByMuscle[key].roles.includes("Primary Mover")), supporting: Object.keys(rolesByMuscle).filter((key) => !rolesByMuscle[key].roles.includes("Primary Mover")), rolesByMuscle, methodology: "Roles are a qualitative fallback from the selected movement model, not measured activation or force." };
  }

  const rolesByMuscle: Record<string, BodyLabRoleDetail> = {};
  const phaseContext = movement.contractionRoles.filter(Boolean).slice(0, 2).join(" · ");
  const detail = { roleOrder: getBodyLabRoleOrder(movement.contractionRoles, movement.jointActions), confidence: confidenceFor(movement.evidenceConfidence), sourceScope: "Movement-specific evidence" as const, sources: movement.sources.slice(0, 2), ...(phaseContext ? { phaseContext } : {}) };
  movement.primeMovers.forEach((name) => appendRole(rolesByMuscle, name, "Primary Mover", detail));
  movement.assistingMuscles.forEach((name) => appendRole(rolesByMuscle, name, "Synergist", detail));
  movement.stabilizers.forEach((name) => appendRole(rolesByMuscle, name, "Stabilizer", detail));
  return { primary: Object.keys(rolesByMuscle).filter((key) => rolesByMuscle[key].roles.includes("Primary Mover")), supporting: Object.keys(rolesByMuscle).filter((key) => !rolesByMuscle[key].roles.includes("Primary Mover")), rolesByMuscle, methodology: "Roles describe qualitative contribution to the selected sporting action and its source-recorded contraction phases. They are not measured activation, force, or an individual capacity assessment." };
}
