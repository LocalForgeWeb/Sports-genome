import type { ConstraintType, Laterality, ResilienceTargetCatalogEntry } from "@shared/resilienceContext";

/**
 * How the area the athlete chose is talked about when we ask how it is.
 *
 * The question used to be "Anything going on there right now?" - "there" being whatever
 * was picked one screen earlier, which the question itself never said. It now names the
 * area, and the side when one was given: "How is your left shoulder feeling?", "How are
 * your hamstrings feeling?", "How does sprinting feel right now?". The catalog's names
 * are labels ("Lower limb (general)", "Thoracic spine"), so each known target has the
 * words a person would use; anything the catalog adds later falls back to its own name.
 */
type Phrase = {
  /** The area, one of it: "shoulder". `plural` when the words themselves are plural ("hamstrings"). */
  one: string;
  plural?: boolean;
  /** Both sides at once: "shoulders". Absent where a side never applies. */
  both?: string;
  /** A movement task rather than a body part: asked as "How does … feel". */
  task?: boolean;
  /** A whole question, where the area does not fit "How is your …". */
  question?: string;
};

const phrases: Record<string, Phrase> = {
  ankle: { one: "ankle", both: "ankles" },
  calf_achilles: { one: "calf and Achilles", plural: true, both: "calves and Achilles" },
  elbow: { one: "elbow", both: "elbows" },
  foot: { one: "foot", both: "feet" },
  forearm: { one: "forearm", both: "forearms" },
  general_musculoskeletal: { one: "body", question: "How is your body feeling overall?" },
  groin_adductors: { one: "groin and adductors", plural: true, both: "groin and adductors" },
  hamstring: { one: "hamstring", both: "hamstrings" },
  hip: { one: "hip", both: "hips" },
  knee: { one: "knee", both: "knees" },
  lumbar_spine: { one: "low back" },
  lower_limb_general: { one: "leg", both: "legs" },
  neck: { one: "neck" },
  quadriceps: { one: "quad", both: "quads" },
  shoulder: { one: "shoulder", both: "shoulders" },
  spine_general: { one: "spine" },
  thoracic_spine: { one: "upper back" },
  upper_limb_general: { one: "arm", both: "arms" },
  wrist_hand: { one: "wrist and hand", plural: true, both: "wrists and hands" },
  tibia: { one: "shin", both: "shins" },
  bone_general: { one: "bones", plural: true, question: "How are your bones feeling?" },
  change_of_direction: { one: "changing direction", task: true },
  landing_deceleration: { one: "landing and slowing down", task: true },
  lifting_carrying: { one: "lifting and carrying", task: true },
  overhead_reaching: { one: "overhead reaching and throwing", task: true },
  sprinting: { one: "sprinting", task: true },
};

/** Words for a target the table above does not know yet, from its catalog name or, failing that, its key. */
function phraseFrom(name: string, task: boolean): Phrase {
  const words = name.replace(/\s*\(general\)\s*/i, "").replace(/_/g, " ").trim().toLowerCase();
  return { one: words, plural: !task && (/\band\b/.test(words) || /s$/.test(words)), task };
}

/**
 * The question for the chosen area. Without an area - the selection was lost, or the
 * catalog is offline and the key unreadable - it asks about "the area you chose" rather
 * than printing an empty name.
 */
export function areaQuestion(target: Pick<ResilienceTargetCatalogEntry, "targetKey" | "name" | "targetType" | "lateralitySupported"> | undefined, targetKey: string, laterality: Laterality): string {
  const key = target?.targetKey || targetKey;
  if (!key) return "How is the area you chose feeling?";
  const phrase = phrases[key] ?? phraseFrom(target?.name || key, target?.targetType === "functional_task");
  if (phrase.question) return phrase.question;
  // A side only counts where the area has sides; "Not sure" of the side asks about the area itself.
  const sided = (target ? target.lateralitySupported : Boolean(phrase.both)) && laterality !== "unspecified" ? laterality : null;
  if (phrase.task) {
    const where = sided === "left" ? " on your left side" : sided === "right" ? " on your right side" : sided === "bilateral" ? " on both sides" : " right now";
    return `How does ${phrase.one} feel${where}?`;
  }
  if (sided === "bilateral" && phrase.both) return `How are your ${phrase.both} feeling?`;
  const side = sided === "left" || sided === "right" ? `${sided} ` : "";
  return `How ${phrase.plural ? "are" : "is"} your ${side}${phrase.one} feeling?`;
}

/**
 * The answers, in the athlete's words. The values are the stored identifiers and keep
 * their meaning; only what they say changed. They describe the athlete's situation -
 * the old descriptions ("Loading gets qualified, and your response gets watched",
 * "Exposure gets rebuilt gradually") promised monitoring and rehabilitation the app does
 * not do. "Not sure" is its own answer (`unsure`), treated like any reported issue -
 * the plan is not adjusted automatically - and followed by the same red-flag check.
 */
export const constraintChoices: { value: ConstraintType; label: string; detail: string }[] = [
  { value: "proactive_none", label: "Feels fine", detail: "No current discomfort or limitation." },
  { value: "symptomatic", label: "Bothering me now", detail: "I'm noticing discomfort or difficulty with some movements." },
  { value: "recent_or_returning", label: "Returning after an issue", detail: "I'm getting back to training after an injury or problem in this area." },
  { value: "prior_recurrent", label: "An issue that comes and goes", detail: "It's not always present, but it has affected my training before." },
  { value: "clinician_restricted", label: "A clinician has limited what I can do", detail: "A doctor or physio has told me to avoid or limit some movements." },
  { value: "unsure", label: "Not sure", detail: "I'm not sure how to classify it." },
];
