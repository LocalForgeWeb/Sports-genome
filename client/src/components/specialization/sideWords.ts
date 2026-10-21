import type { SpecializationRegion } from "@shared/specialization/types";

/**
 * The region's side words, for the one thing the page still says about sides (docs/specialization-
 * atlas/10-multi-region.md, appendix "Both sides as one"). Since the owner's decision of 20 Oct 2026
 * ("there's no reason for a left and right arm", extended to every paired region) the page counts
 * both sides as one: no switch, heading, caption, sentence or ledger row names a side, nothing is
 * kept apart for want of one, and targets and measurements have none. What is left is the sentence
 * that says so under "How this is counted", in the region's words ("Both arms count together…";
 * "Both sides…" on the chest and back, whose logger limb is the arm; "Both legs…"). A midline region
 * (the core) has no sides, and says that instead. No component writes a limb or a side noun of its own.
 */
export type SideWords = {
  /** False for a midline region: it has no left or right. */
  paired: boolean;
  /** The limb a side is recorded on for a paired region ("arm", "leg"); none on a midline region. */
  limb: "arm" | "leg" | null;
  /** The region's word for one side and for both: "arm" and "arms", "side" and "sides", "leg" and "legs". */
  one: string;
  many: string;
  /**
   * How both sides are counted, for "How this is counted", in place of the published rule's per-side
   * sentence: "Both arms count together: a set counts once, whichever arm or arms did it, and a set
   * with no arm recorded counts like any other." A midline region's: "Each set counts once for the
   * core, which has no left or right."
   */
  countedTogether: string;
  /** The same, without the clause about a set with no side recorded, as the 3D model's panel says it: "Both arms count together: a set counts once, whichever arm or arms did it." */
  countedOnce: string;
};

export function sideWordsFor(region: Pick<SpecializationRegion, "label" | "sides" | "wording">): SideWords {
  if (region.sides.model === "midline") {
    const once = `Each set counts once for the ${region.label.toLowerCase()}, which has no left or right.`;
    return { paired: false, limb: null, one: "", many: "", countedTogether: once, countedOnce: once };
  }
  const limb = region.sides.limb;
  const one = region.wording.sideWord ?? limb;
  const many = region.wording.sideWordPlural ?? `${one}s`;
  return {
    paired: true,
    limb,
    one,
    many,
    countedTogether: `Both ${many} count together: a set counts once, whichever ${one} or ${many} did it, and a set with no ${limb} recorded counts like any other.`,
    countedOnce: `Both ${many} count together: a set counts once, whichever ${one} or ${many} did it.`,
  };
}
