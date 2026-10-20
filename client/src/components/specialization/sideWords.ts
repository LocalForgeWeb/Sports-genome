import { onSide as regionOnSide } from "@shared/specialization/regionIndex";
import { variantFor } from "@shared/specialization/variants";
import { countingDimensions } from "@shared/specialization/variants/dimensions";
import type { BodySide, CountedSide, RecordedSide, SideAnchor, SideRelation, SpecializationRegion, SpecializationRegionData, SummarySide } from "@shared/specialization/types";

/**
 * Every side phrase the page uses, from the region's data (docs/specialization-atlas/
 * 10-multi-region.md §1.1, §2.2): the switch's words ("Left arm · Right arm", "Left side · Right
 * side", "Left leg · Right leg"), a side in a sentence ("your right forearm", the region's
 * `onSideTemplate`), and the limb the logger asks about ("3 sets had no arm recorded" on the chest,
 * whose side word is "side" but whose logger asks which arm). No component writes a limb or a side
 * noun of its own; a midline region (the core) has no side, and every phrase here is empty for it,
 * so a component that names a side asks `paired` first.
 */
export type SideWords = {
  /** False for a midline region: no switch, no side in a sentence, nothing kept apart for want of a side. */
  paired: boolean;
  /** The limb the logger asks about on a paired region ("arm", "leg"); none on a midline region. */
  limb: "arm" | "leg" | null;
  /** The region's word for one side and for both: "arm" and "arms", "side" and "sides", "leg" and "legs". */
  one: string;
  many: string;
  /** The switch's group name: "Arm", "Side", "Leg". */
  group: string;
  /** "Left arm": the switch's words, and a ledger row's side. */
  label: (side: BodySide) => string;
  /** "left arm", inside a sentence or a heading. */
  of: (side: BodySide) => string;
  /** "left-arm", before a noun ("a left-arm target"). */
  adjective: (side: BodySide) => string;
  /** "Left arm only". */
  only: (side: BodySide) => string;
  /** "your right forearm", "the left side of your chest"; a midline region's names no side ("your core"). */
  onSide: (side: SummarySide) => string;
  /** "Both arms": a target saved for each side. */
  both: string;
  /** "per arm", "per leg". */
  perSide: string;
  /** The limb the logger asks about, from the region's side model: "no arm", "no arm recorded", "No leg recorded". */
  noLimb: string;
  noneRecorded: string;
  noneRecordedTitle: string;
  /** "an arm", "a leg": "every set has an arm". */
  aLimb: string;
  /** "counted for neither arm", "counted for neither side". */
  neither: string;
  /** "One-arm work logged from now on asks which arm." */
  asksWhich: string;
  /** "Sets done with both arms count for each arm; only one-arm sets make the arms differ." */
  differ: string;
  /** "A set done with both arms counts for each arm." */
  bothCount: string;
};

const capitalised = (text: string) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text);
const withArticle = (word: string) => `${/^[aeiou]/i.test(word) ? "an" : "a"} ${word}`;

export function sideWordsFor(region: Pick<SpecializationRegion, "id" | "sides" | "wording">): SideWords {
  const onSide = (side: SummarySide) => regionOnSide(region, side);
  if (region.sides.model === "midline") {
    const none = () => "";
    return { paired: false, limb: null, one: "", many: "", group: "", label: none, of: none, adjective: none, only: none, onSide: () => regionOnSide(region, "midline"), both: "", perSide: "", noLimb: "", noneRecorded: "", noneRecordedTitle: "", aLimb: "", neither: "", asksWhich: "", differ: "", bothCount: "" };
  }
  const limb = region.sides.limb;
  const limbs = `${limb}s`;
  const one = region.wording.sideWord ?? limb;
  const many = region.wording.sideWordPlural ?? `${one}s`;
  const label = (side: BodySide) => `${capitalised(side)} ${one}`;
  return {
    paired: true,
    limb,
    one,
    many,
    group: capitalised(one),
    label,
    of: (side) => `${side} ${one}`,
    adjective: (side) => `${side}-${one}`,
    only: (side) => `${label(side)} only`,
    onSide,
    both: `Both ${many}`,
    perSide: `per ${one}`,
    noLimb: `no ${limb}`,
    noneRecorded: `no ${limb} recorded`,
    noneRecordedTitle: `No ${limb} recorded`,
    aLimb: withArticle(limb),
    neither: `counted for neither ${one}`,
    asksWhich: `One-${limb} work logged from now on asks which ${limb}.`,
    differ: `Sets done with both ${limbs} count for each ${one}; only one-${limb} sets make the ${many} differ.`,
    bothCount: `A set done with both ${limbs} counts for each ${one}.`,
  };
}

/** What a ledger row carries about its side (a muscle's contribution, or a bout behind a region total). */
export type SidedRow = {
  side: "left" | "right" | "bilateral" | "unknown";
  countedSide?: CountedSide;
  recordedSide?: RecordedSide | null;
  sideRelation?: SideRelation;
};

/**
 * A ledger row's side, by the side it is counted on (10-multi-region.md §2.1): "Right arm", or "No
 * arm recorded" for a row kept apart; nothing on a midline region. A summary made before rows
 * carried a counted side is read by its single side.
 */
export function rowSideLabel(words: SideWords, row: SidedRow): string | null {
  if (!words.paired) return null;
  const counted = row.countedSide ?? (row.side === "bilateral" ? null : row.side);
  if (counted === "left" || counted === "right") return words.label(counted);
  if (counted === "unknown") return words.noneRecordedTitle;
  return words.both;
}

/**
 * What the set recorded, where the row's counted side does not say it (10-multi-region.md §2.1):
 * the loaded hand for the arm ("Left hand: opposite side" for a suitcase carry credited on the
 * right), the variant's anchor leg for the leg ("Standing leg: left"). Nothing where the counted
 * side says it all, for a plan's assumed sides (the row says "Each side assumed"), on a midline
 * region, which names no side, or for a leg's side on a region paired by the arm, whose page names
 * no leg (the row says "No arm recorded").
 */
export function recordedSideNote(words: SideWords, row: SidedRow, anchor: SideAnchor | null | undefined): string | null {
  const recorded = row.recordedSide;
  if (!words.paired || !recorded || recorded.source === "plan_assumption") return null;
  if (words.limb === "arm" && recorded.limb === "leg") return null;
  const relation = row.sideRelation ?? "same";
  const hand = recorded.limb === "arm";
  const what = hand
    ? (recorded.side === "both" ? "Both hands" : `${capitalised(recorded.side)} hand`)
    : `${anchor ? countingDimensions.side_anchor.values[anchor] : capitalised(recorded.limb)}: ${recorded.side}`;
  const joined = (tail: string) => (hand ? `${what}: ${tail}` : `${what}, ${tail}`);
  if (row.countedSide === "unknown") return what;
  if (relation === "opposite") return joined("opposite side");
  if (relation === "both") return joined("both sides");
  return hand && recorded.side !== "both" ? null : what;
}

/** A ledger row's side in words: its label, then what the set recorded where that differs ("Right arm", "Left hand: opposite side"). */
export type RowSideText = (row: SidedRow & { catalogExerciseId: number | null }) => string[];

/**
 * The page's reader of a row's side: the region's side words, and each exercise's anchor leg from
 * its variant (the region's own, else the shared library's, for region-only work).
 */
export function rowSideTextFor(data: Pick<SpecializationRegionData, "region" | "variants">): RowSideText {
  const words = sideWordsFor(data.region);
  const anchors = new Map(data.variants.map((variant) => [variant.catalogExerciseId, variant.sideAnchor ?? null] as const));
  const anchorOf = (catalogExerciseId: number | null) => (catalogExerciseId === null ? null : anchors.has(catalogExerciseId) ? anchors.get(catalogExerciseId) ?? null : variantFor(catalogExerciseId)?.sideAnchor ?? null);
  return (row) => [rowSideLabel(words, row), recordedSideNote(words, row, anchorOf(row.catalogExerciseId))].filter((part): part is string => Boolean(part));
}
