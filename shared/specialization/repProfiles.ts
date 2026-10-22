import type { RegionExtras, SourceId, VariantId } from "./types";

/**
 * Rep guidance (docs/specialization-atlas, note 11, §5): starting ranges
 * per task family, held as region data (`regions/<region>/repProfiles.ts`) and assigned per
 * variant. Region-agnostic: a family's name, its ranges and which variants take it are data; this
 * file only reads them.
 *
 * What a profile is, and is not:
 * - the app's starting range for a kind of movement or a stationary hold, recorded as the source's
 *   practical default (`evidence: "starting_default"`), never a tested or optimal number;
 * - never per muscle: no weekly set number, maximum or muscle-specific optimum exists here;
 * - only on a variant whose own work is a movement or a stationary hold of the region (a reviewed
 *   direct mapping on one of its own target muscles), never on a carry or a multi-joint lift,
 *   which keep their whole-exercise prescriptions (`unprofiledVariants`, each with its reason).
 */

export type RepProfileMeasure = "reps" | "seconds";
/** Which of a profile's ranges a prescription takes: the strength range under a maximal-strength goal, else growth. */
export type RepRangeKind = "growth" | "strength";
export type RepRange = readonly [low: number, high: number];

export interface RepProfile {
  /** `<region>.<family>`, unique in the region. */
  id: string;
  /** The family as the page names it. */
  label: string;
  /** Reps, or the seconds of a stationary hold. */
  measure: RepProfileMeasure;
  /** The growth-practice range. */
  growth: RepRange;
  /** The strength-practice range, where the source gives one; null where it gives none. */
  strength: RepRange | null;
  /**
   * A hold's one written number per goal: the plan counts a written range by its low end
   * (planBouts `plannedTarget`), so a hold is written as one number, never as a range.
   */
  written?: { growth: number; strength: number };
  /** The only status a profile has: the app's starting default, not a tested optimum. */
  evidence: "starting_default";
  /** Traceability: the source's family key and the status the source gave its own numbers. */
  origin: { family: string; status: string };
  /** What the numbers are, in plain words, for review. */
  note: string;
}

export interface RepProfileAssignment {
  variantId: VariantId;
  profileId: string;
  /**
   * Whether the profile's strength range applies to this variant. False where the source gives
   * the family's strength range but not for this kind of drill (band drills), or the profile has
   * none; the growth range is then used under every goal.
   */
  strengthApplies: boolean;
  /**
   * The variant is for coverage, not volume: a reviewed family says so. The stack gives it one
   * set unless the athlete raises its row or a target asks for more (11 §3.4).
   */
  coverageOnly: boolean;
  /** Where `coverageOnly` is set: the reviewed words that say so, with where they are. */
  coverageNote?: string;
}

/** A variant with direct work on the region that deliberately takes no profile, and why. */
export interface UnprofiledVariant {
  variantId: VariantId;
  reason: string;
}

/** The library sources behind each sentence of the rep guidance (11 §5.3). */
export interface RepGuidanceCitations {
  /** "General training studies found growth across a wide range of reps …". */
  general: SourceId[];
  /** "Stopping 1 to 3 reps short of failure is a common starting point, not a rule." */
  effort: SourceId[];
  /** "Results from holds depend on their length, how hard they are and the intent." */
  holds: SourceId[];
}

/** A profile as it applies to one variant under one goal. */
export interface ResolvedRepRange {
  profile: RepProfile;
  assignment: RepProfileAssignment;
  kind: RepRangeKind;
  range: RepRange;
  /** True when a strength goal asked for the strength range and the variant or profile has none, so growth is used. */
  strengthWithheld: boolean;
}

const assignmentIndex = new WeakMap<RegionExtras, Map<VariantId, { profile: RepProfile; assignment: RepProfileAssignment }>>();

/** The profile and assignment of a variant, or null when it has none (or the region has no profiles). */
export function repProfileOf(extras: RegionExtras | null | undefined, variantId: VariantId): { profile: RepProfile; assignment: RepProfileAssignment } | null {
  if (!extras?.repProfiles?.length || !extras.repProfileAssignments?.length) return null;
  let index = assignmentIndex.get(extras);
  if (!index) {
    const profiles = new Map(extras.repProfiles.map((profile) => [profile.id, profile] as const));
    index = new Map();
    for (const assignment of extras.repProfileAssignments) {
      const profile = profiles.get(assignment.profileId);
      if (profile && !index.has(assignment.variantId)) index.set(assignment.variantId, { profile, assignment });
    }
    assignmentIndex.set(extras, index);
  }
  return index.get(variantId) ?? null;
}

/**
 * The range a variant's prescription takes: the strength range when `strength` is asked, the
 * profile has one and the assignment allows it; the growth range otherwise. Null without a profile.
 */
export function repRangeFor(extras: RegionExtras | null | undefined, variantId: VariantId, strength: boolean): ResolvedRepRange | null {
  const found = repProfileOf(extras, variantId);
  if (!found) return null;
  const { profile, assignment } = found;
  const useStrength = strength && assignment.strengthApplies && profile.strength !== null;
  return {
    profile,
    assignment,
    kind: useStrength ? "strength" : "growth",
    range: useStrength ? profile.strength! : profile.growth,
    strengthWithheld: strength && !useStrength,
  };
}

/** "10–25": a range as the plan writes it, with an en dash. */
export const rangeText = (range: RepRange): string => `${range[0]}–${range[1]}`;

/**
 * The written target of one set of a variant: a rep range ("10–25"), or a hold's one number in
 * seconds ("30 sec"). A hold that serves a seconds target is written at `holdSeconds` whatever the
 * goal (11 §3.4); otherwise at the profile's written number for the goal. Null without a profile.
 */
export function repTargetFor(extras: RegionExtras | null | undefined, variantId: VariantId, options: { strength: boolean; holdSeconds?: number | null }): { target: string; seconds: number | null; resolved: ResolvedRepRange } | null {
  const resolved = repRangeFor(extras, variantId, options.strength);
  if (!resolved) return null;
  if (resolved.profile.measure === "seconds") {
    const written = resolved.profile.written;
    const seconds = options.holdSeconds ?? (written ? written[resolved.kind] : resolved.range[0]);
    return { target: `${seconds} sec`, seconds, resolved };
  }
  return { target: rangeText(resolved.range), seconds: null, resolved };
}

/** `<sets> × <target>`: a prescription in the plan's own form ("3 × 10–25", "2 × 30 sec"). */
export const prescriptionText = (sets: number, target: string): string => `${sets} × ${target}`;

/**
 * The add sheet's default (11 §5.2): the goal's set count for the entry's place in the day, times
 * the variant's range for the goal ("3 × 10–25", "3 × 30 sec"). Null for a variant with no profile,
 * which keeps the plan's default and writes none, as shipped. The caller passes the set count
 * (`parseSetCount(getGoalPrescription(goal, position))`), so this stays free of the planner.
 */
export function repPrescriptionFor(extras: RegionExtras | null | undefined, variantId: VariantId, sets: number, options: { strength: boolean; holdSeconds?: number | null }): string | null {
  const found = repTargetFor(extras, variantId, options);
  return found ? prescriptionText(sets, found.target) : null;
}
