import type { ExerciseVariant, VariantMapping } from "./types";
import { specializationLoggingRegions } from "./loggingRegions";

/**
 * What the workout logger asks of one exercise, read from the atlas's variant data
 * (docs/specialization-atlas/02-design.md §6).
 *
 * The brief wants this information "out of the workout logger until relevant" and every
 * set entry kept from turning into a questionnaire (§6, "Muscle detail sheet"). So the
 * logger asks for nothing the atlas has not said matters for that exact exercise: a
 * Seconds box only where the variant is measured in seconds, a side only where the
 * variant can be done one arm at a time, a straps question only where a grip mapping
 * depends on a bare hand. An exercise the atlas does not map gets the default policy,
 * which is exactly the logger as it was before the atlas existed.
 *
 * Region-agnostic on purpose: it reads every production region's variants, so a
 * deltoid or calf region added to the registry is picked up with no change here.
 *
 * It reads the regions through `loggingRegions.ts` (variants and mappings only), never through
 * `registry.ts`: the tracker and the swap sheet import this module, and the registry would
 * bring the atlas's drawing, claims and sources into the workout logger's download.
 */
export type LoggedSide = "left" | "right" | "both";

export interface LoggingPolicy {
  /** What the set's dose is entered in: reps, or the seconds of a hold. */
  measure: "reps" | "seconds";
  /** Ask which arm: the variant can be (or must be) done one arm at a time. */
  askSide: boolean;
  /**
   * The variant is one arm at a time by definition (laterality `unilateral`, not `either`): a
   * planned set of it is done once with each arm. The tracker reads this to lay a planned set
   * out as two rows, one per arm, for an athlete tracking per-arm totals.
   */
  oneArm: boolean;
  /**
   * The side shown selected before the athlete has logged a set of this exercise in the
   * session. `both` for an exercise usually done with both arms that may be done with
   * one; null for a one-arm exercise, where which arm goes first is the athlete's call.
   */
  sideDefault: LoggedSide | null;
  /** A grip mapping of this variant is not earned by a strapped set, so straps matter here. */
  strapsSensitive: boolean;
}

/** The logger as it always was: reps, no side, no straps. */
export const defaultLoggingPolicy: LoggingPolicy = Object.freeze({ measure: "reps", askSide: false, oneArm: false, sideDefault: null, strapsSensitive: false });

const productionRegions = () => specializationLoggingRegions.filter((data) => data.region.status === "production");

/** Every production region's variants: the default the logger reads. */
export function productionVariants(): ExerciseVariant[] {
  return productionRegions().flatMap((data) => data.variants);
}

/** Every production region's mappings, for the straps question. */
export function productionMappings(): VariantMapping[] {
  return productionRegions().flatMap((data) => data.mappings);
}

/**
 * The policy for a catalog exercise. Variants and mappings are injectable so a test (or
 * a fixture region) can supply its own; by default they are the production regions'.
 *
 * Only reviewed mappings would credit work, but the straps question is about how the set
 * was done, which is worth recording whether or not the mapping is reviewed yet: a
 * mapping reviewed later can then read sets logged before the review. Rejected mappings
 * are the exception: they say the claim does not hold, so they ask nothing.
 */
export function loggingPolicyFor(
  catalogExerciseId: number | null | undefined,
  variants: readonly ExerciseVariant[] = productionVariants(),
  mappings: readonly VariantMapping[] = productionMappings(),
): LoggingPolicy {
  if (catalogExerciseId === null || catalogExerciseId === undefined || !Number.isFinite(catalogExerciseId)) return defaultLoggingPolicy;
  const variant = variants.find((item) => item.catalogExerciseId === catalogExerciseId);
  if (!variant) return defaultLoggingPolicy;
  const askSide = variant.laterality === "unilateral" || variant.laterality === "either";
  return {
    measure: variant.measure === "seconds" ? "seconds" : "reps",
    askSide,
    oneArm: variant.laterality === "unilateral",
    // A two-handed implement never asks. "Either" is usually two arms at once (a pair of
    // dumbbells), so it starts on Both; a one-arm exercise starts unset.
    sideDefault: variant.laterality === "either" ? "both" : null,
    strapsSensitive: mappings.some((mapping) => mapping.variantId === variant.id && mapping.requiresNoStraps && mapping.reviewStatus !== "rejected"),
  };
}
