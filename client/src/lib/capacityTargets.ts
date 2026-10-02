/**
 * Finding targeted capacity from the rest of the app.
 *
 * The interaction contract fixes where this feature may live: "Resilience is a
 * cross-cutting lens, not a destination... never a permanent resilience tab"
 * (§6), with Onboarding, the Workout Builder, Programs and **Body Lab** as its
 * primary surfaces and Settings as a secondary one. So none of this adds a tab.
 * What it adds is the two paths the contract requires into a setting that
 * already exists: §11's "named/search/list path with the same authority as any
 * spatial tap", and Body Lab's own "expose regional targets without implying
 * diagnosis".
 *
 * Two rules shape everything here.
 *
 * `trainable-gaps-not-athlete-identities` forbids trait language in what the
 * product says: "Prefer 'Hamstring knee-flexion strength is below your wrestling
 * target range' over 'Weak hamstrings'... Avoid person/trait labels". That
 * governs labels, not the words an athlete types looking for the thing. So
 * "weak point" and "injury" are search terms below and appear in no label.
 *
 * `separate-capacity-targets-from-constraints` forbids inferring one from the
 * other: "interpreting any selected region as injured". Tapping a region in Body
 * Lab therefore proposes a target and never a constraint - the second question
 * is asked separately, by the card, in the athlete's own words.
 */

/**
 * What an athlete types when they are looking for this.
 *
 * Deliberately blunt. Someone whose shoulder hurts searches "shoulder pain" or
 * "injury", not "targeted capacity", and a search that only matches the label we
 * chose is a search that only works for people who already know where it is.
 */
export const capacityTargetSearchTerms = [
  "targeted capacity",
  "focus area",
  "weak point",
  "weak points",
  "weakness",
  "injury",
  "injuries",
  "injured",
  "rehab",
  "prehab",
  "pain",
  "hurt",
  "sore",
  "niggle",
  "tweak",
  "limitation",
  "restriction",
  "coming back from",
  "return to training",
  "work around",
  "something going on",
];

/**
 * How a Body Lab region relates to a catalog target.
 *
 * `same` - the target names this structure. Hamstrings are the hamstring target.
 * `region` - the target is the region this muscle sits in. The rotator cuff is
 *   not the shoulder, but an athlete who taps it and wants it more tolerant means
 *   the shoulder target, and the copy says which one it is offering.
 *
 * Anything absent from the map gets no proposal at all; the picker still opens.
 * A muscle is not silently promoted to a joint, and nothing here is a claim about
 * what a region does or what could be wrong with it.
 */
export type TargetRelation = "same" | "region";

export const capacityTargetForMuscle: Record<string, { targetKey: string; relation: TargetRelation }> = {
  hamstrings: { targetKey: "hamstring", relation: "same" },
  quads: { targetKey: "quadriceps", relation: "same" },
  calves: { targetKey: "calf_achilles", relation: "same" },
  soleus: { targetKey: "calf_achilles", relation: "same" },
  adductors: { targetKey: "groin_adductors", relation: "same" },
  forearms: { targetKey: "forearm", relation: "same" },
  feet: { targetKey: "foot", relation: "same" },
  lowerBack: { targetKey: "lumbar_spine", relation: "same" },

  shoulders: { targetKey: "shoulder", relation: "region" },
  frontDelts: { targetKey: "shoulder", relation: "region" },
  sideDelts: { targetKey: "shoulder", relation: "region" },
  rearDelts: { targetKey: "shoulder", relation: "region" },
  rotatorCuff: { targetKey: "shoulder", relation: "region" },
  hipFlexors: { targetKey: "hip", relation: "region" },
  abductors: { targetKey: "hip", relation: "region" },
  tfl: { targetKey: "hip", relation: "region" },
  glutes: { targetKey: "hip", relation: "region" },
  tibialis: { targetKey: "ankle", relation: "region" },
  peroneals: { targetKey: "ankle", relation: "region" },
};

export type CapacityProposal = { targetKey: string; relation: TargetRelation; name: string };

/**
 * What Body Lab can offer for the selected region, given the targets that are
 * actually selectable. An offer for a target the catalog cannot list is an offer
 * that lands on an empty picker, so it is not made.
 */
export function capacityProposalFor(
  muscle: string | null | undefined,
  targets: readonly { targetKey: string; name: string }[]
): CapacityProposal | null {
  if (!muscle) return null;
  const mapped = capacityTargetForMuscle[muscle];
  if (!mapped) return null;
  const entry = targets.find((target) => target.targetKey === mapped.targetKey);
  return entry ? { ...mapped, name: entry.name } : null;
}
