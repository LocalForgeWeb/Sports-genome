import type { LegLaterality, SideAnchor, SidedBy } from "../types";

/**
 * The vocabulary of variant attributes (docs/specialization-atlas/10-multi-region.md §3; the
 * database's `variant_dimensions` and `variant_dimension_values`), each dimension and value with
 * the words the database stores, in their order.
 *
 * Counting dimensions decide what is counted and on which side; their values are fixed by the
 * schema, and the types in types.ts are checked against them here. Descriptive dimensions say how
 * an exercise is done (a straight or bent knee on a calf raise); no published rule reads them,
 * and mapping rationales cite them. The variants lane may add a descriptive value or dimension
 * here; a counting one is a schema change. Only the seed and the tests read the words, so the
 * library's index does not re-export them into the logger's and the page's code.
 */

export const countingDimensions = {
  sided_by: {
    label: "Limb whose side is recorded",
    values: { arm: "Arm", leg: "Leg", none: "No side recorded" } satisfies Record<SidedBy, string>,
  },
  leg_laterality: {
    label: "Legs",
    values: { bilateral: "Both legs in every set", unilateral: "One leg at a time", either: "One leg or both", not_applicable: "The legs do no work" } satisfies Record<LegLaterality, string>,
  },
  side_anchor: {
    label: "The leg a recorded side names",
    values: { working_leg: "Working leg", front_leg: "Front leg", stance_leg: "Standing leg", top_leg: "Top leg", bottom_leg: "Bottom leg" } satisfies Record<SideAnchor, string>,
  },
} as const;

export const descriptiveDimensions = {
  knee: { label: "Knee", values: { straight: "Straight", bent: "Bent", changing: "Bends and straightens" } },
  hip: { label: "Hip", values: { flexed: "Bent", neutral: "Neutral", extended: "Extended", changing: "Bends and straightens" } },
  torso: { label: "Torso", values: { upright: "Upright", inclined: "Inclined", horizontal: "Horizontal", supine: "Lying face up", prone: "Lying face down", changing: "Changes through the set" } },
  bench: { label: "Bench", values: { flat: "Flat", incline: "Incline", decline: "Decline", none: "No bench" } },
  plane: { label: "Direction of the load", values: { vertical: "Vertical", horizontal: "Horizontal", diagonal: "Diagonal", changing: "Changes through the set" } },
  grip_width: { label: "Grip width", values: { narrow: "Narrow", shoulder: "Shoulder width", wide: "Wide" } },
  stance: { label: "Stance", values: { bilateral: "Both feet level", split: "Split stance", single_leg: "One leg", staggered: "Staggered" } },
  range: { label: "Range of motion", values: { full: "Full", lengthened_partial: "Partial, at long muscle length", shortened_partial: "Partial, at short muscle length" } },
  // Added by wave A (the upper arm): where the upper arm is held at the shoulder, which sets how
  // long the two-joint heads are (the biceps' and the triceps' long heads cross the shoulder).
  shoulder: { label: "Upper arm at the shoulder", values: { extended: "Arm behind the body", neutral: "Arm at the side", flexed: "Arm raised in front", overhead: "Arm overhead", changing: "Moves through the set" } },
} as const;

export type CountingDimension = keyof typeof countingDimensions;
export type DescriptiveDimension = keyof typeof descriptiveDimensions;
export type DescriptiveValue<D extends DescriptiveDimension> = keyof (typeof descriptiveDimensions)[D]["values"];

/** A variant's descriptive attributes, dimension to value. */
export type VariantDimensions = { [D in DescriptiveDimension]?: DescriptiveValue<D> };
