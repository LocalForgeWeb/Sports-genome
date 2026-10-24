import type { VariantDimensions } from "./dimensions";

/**
 * Descriptive attributes added to the forearm's records since forearm_mappings_v1 was published
 * (docs/specialization-atlas/10-multi-region.md §3). They are separate rows of
 * `variant_attributes`, never a column of the frozen `exercise_variants` record, and stay free
 * until a version that maps the variant is published.
 *
 * Wave A (requested by the upper arm's pulls, rows and curls mapping lane): `shoulder` on the curls
 * whose set-up fixes where the upper arm is held, which sets the length of the biceps' long head.
 * - `extended`, the arm behind the body: 125 Incline Dumbbell Curl and 338 Incline Cable Curl (arms
 *   hang behind a reclined trunk), 129 Bayesian Cable Curl (the arm drawn behind the body).
 * - `changing`: 137 Drag Curl. The elbows travel back as the bar rises, so the shoulder moves from
 *   the side to behind the body within each rep.
 * - `flexed`, the arm in front: 126 Preacher Curl and 127 Machine Preacher Curl (on the pad), 130
 *   Spider Curl and 341 Cable Spider Curl (hanging in front of an inclined chest), 131
 *   Concentration Curl and 340 Cable Concentration Curl (braced in front of a forward-leaning trunk).
 * - 339 High Cable Curl has none: its arms are raised out to the sides, which the vocabulary has no
 *   value for. It is not added for one exercise, since the long head's length is set mainly by
 *   flexion and extension (docs/specialization-atlas/regions/variants.md).
 */
export const forearmDescriptiveAttributes: Readonly<Record<number, VariantDimensions>> = {
  125: { shoulder: "extended" },
  129: { shoulder: "extended" },
  338: { shoulder: "extended" },
  137: { shoulder: "changing" },
  126: { shoulder: "flexed" },
  127: { shoulder: "flexed" },
  130: { shoulder: "flexed" },
  131: { shoulder: "flexed" },
  340: { shoulder: "flexed" },
  341: { shoulder: "flexed" },
};
