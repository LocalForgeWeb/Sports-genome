import { getEnrichedMovement } from "@/lib/enrichedSportMovementDatabase";

export type BodyLabRole = "Primary Mover" | "Synergist" | "Stabilizer" | "Supporting";
export type BodyLabEvidenceConfidence = "Direct evidence" | "Strong indirect evidence" | "Moderate biomechanical inference" | "Low-confidence inference";

export type BodyLabRoleDetail = {
  roles: BodyLabRole[];
  roleOrder: BodyLabRole[];
  confidence: BodyLabEvidenceConfidence;
  sourceScope: "Movement-specific evidence" | "General biomechanics" | "Movement-model fallback";
  sources: string[];
  explanation: string;
  phaseContext?: string;
};

export type BodyLabRoleContext = {
  primary: string[];
  supporting: string[];
  rolesByMuscle: Record<string, BodyLabRoleDetail>;
  methodology: string;
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
const roleOrderFor = (phaseContext: string): BodyLabRole[] => {
  if (phaseContext.toLowerCase().includes("isometric")) return ["Primary Mover", "Stabilizer", "Synergist", "Supporting"];
  return defaultRoleOrder;
};
const confidenceFor = (value: string | undefined): BodyLabEvidenceConfidence => {
  const confidence = value?.toLowerCase() || "";
  if (confidence.includes("direct")) return "Direct evidence";
  if (confidence.includes("strong") || confidence.includes("high")) return "Strong indirect evidence";
  if (confidence.includes("moderate")) return "Moderate biomechanical inference";
  return "Low-confidence inference";
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
    const detail = { roleOrder: defaultRoleOrder, confidence: "Low-confidence inference" as const, sourceScope: "Movement-model fallback" as const, sources: [], explanation: "This qualitative role comes from the selected movement model because a movement-specific enriched record is unavailable." };
    fallbackPrimary.forEach((name) => appendRole(rolesByMuscle, name, "Primary Mover", detail));
    fallbackSupporting.forEach((name) => appendRole(rolesByMuscle, name, "Supporting", detail));
    return { primary: Object.keys(rolesByMuscle).filter((key) => rolesByMuscle[key].roles.includes("Primary Mover")), supporting: Object.keys(rolesByMuscle).filter((key) => !rolesByMuscle[key].roles.includes("Primary Mover")), rolesByMuscle, methodology: "Roles are a qualitative fallback from the selected movement model, not measured activation or force." };
  }

  const rolesByMuscle: Record<string, BodyLabRoleDetail> = {};
  const phaseContext = movement.contractionRoles.filter(Boolean).slice(0, 2).join(" · ");
  const detail = { roleOrder: roleOrderFor(phaseContext), confidence: confidenceFor(movement.evidenceConfidence), sourceScope: "Movement-specific evidence" as const, sources: movement.sources.slice(0, 2), explanation: `${movement.label} is interpreted through its stated joint actions, force/skill demand, contraction roles, and movement-specific muscle-role record.`, ...(phaseContext ? { phaseContext } : {}) };
  movement.primeMovers.forEach((name) => appendRole(rolesByMuscle, name, "Primary Mover", detail));
  movement.assistingMuscles.forEach((name) => appendRole(rolesByMuscle, name, "Synergist", detail));
  movement.stabilizers.forEach((name) => appendRole(rolesByMuscle, name, "Stabilizer", detail));
  return { primary: Object.keys(rolesByMuscle).filter((key) => rolesByMuscle[key].roles.includes("Primary Mover")), supporting: Object.keys(rolesByMuscle).filter((key) => !rolesByMuscle[key].roles.includes("Primary Mover")), rolesByMuscle, methodology: "Roles describe qualitative contribution to the selected sporting action and its source-recorded contraction phases. They are not measured activation, force, or an individual capacity assessment." };
}
