import type { Limb, RegionId } from "./types";
import { loggingTable, type LoggingTableRow } from "./loggingTable.generated";

/**
 * What the workout logger asks of one exercise, read from the atlas's logging table
 * (docs/specialization-atlas/02-design.md §6; 10-multi-region.md §6.4).
 *
 * The brief wants this information "out of the workout logger until relevant" and every
 * set entry kept from turning into a questionnaire (§6, "Muscle detail sheet"). So the
 * logger asks for nothing the atlas has not said matters for that exact exercise: a
 * Seconds box only where the variant is measured in seconds, and a straps question only
 * where a grip mapping depends on a bare hand. No side is asked, of an arm or a leg: both
 * sides are counted as one (owner, 20 Oct 2026). An exercise no production region maps gets
 * the default policy, which is exactly the logger as it was before the atlas existed.
 *
 * Region-agnostic on purpose: the table (`loggingTable.generated.ts`) is written from every
 * production region by scripts/specialization/emit-logging-table.ts, so a region added to the
 * registry is picked up with no change here. The tracker and the swap sheet import this
 * module, and the table holds a few facts per exercise, never a region's mappings, drawing,
 * claims or sources.
 *
 * What the athlete's targets decide (the straps question) is not here: that is
 * `loggerGatesFor` in client/src/lib/specialization/loggerGates.ts, read from this policy.
 */
export type LoggedSide = "left" | "right" | "both";

export interface LoggingPolicy {
  /** What the set's dose is entered in: reps, or the seconds of a hold. */
  measure: "reps" | "seconds";
  /**
   * Ask which side. Always false: both sides are counted as one (owner, 20 Oct 2026, "there's no
   * reason for a left and right arm", extended to every limb), so the side a set was done with
   * changes no number, and no arm or leg is asked. Kept so a later decision can ask again; a set
   * logged with a side before keeps it.
   */
  askSide: boolean;
  /**
   * The limb a side is recorded on (the variant's `sidedBy`): a set's `side` for the arm, `legSide`
   * for the leg; null where no side is. Nothing asks for one; a swap reads it to name the rows of a
   * workout left open from before 20 Oct 2026, built per side.
   */
  sideLimb: Limb | null;
  /**
   * Lay a planned set out as one row per arm. Always false: with both sides counted as one, a
   * planned one-side set is one row per planned set, so the logged week matches the planned week
   * (the plan counts it as one bout, planBouts.ts). Main's name, kept for its tests.
   */
  oneArm: boolean;
  /**
   * The side shown selected before the athlete has logged a set of this exercise in the
   * session. `both` for an exercise usually done with both arms (or legs) that may be done with
   * one; null for a one-side exercise, where which side goes first is the athlete's call.
   */
  sideDefault: LoggedSide | null;
  /** A grip mapping of this variant is not earned by a strapped set, so straps matter here. */
  strapsSensitive: boolean;
  /** The production regions with such a mapping of it, for the athlete's gates. */
  strapsBy: readonly RegionId[];
  /** The production regions that map it, for the athlete's gates. */
  mappedBy: readonly RegionId[];
}

/** The logger as it always was: reps, no side, no straps. */
export const defaultLoggingPolicy: LoggingPolicy = Object.freeze({ measure: "reps", askSide: false, sideLimb: null, oneArm: false, sideDefault: null, strapsSensitive: false, strapsBy: [], mappedBy: [] });

/** An exercise's row of the logging table, or null when no production region maps it. */
export function loggingEntryFor(catalogExerciseId: number | null | undefined, table: ReadonlyMap<number, LoggingTableRow> = loggingTable): LoggingTableRow | null {
  if (catalogExerciseId === null || catalogExerciseId === undefined || !Number.isFinite(catalogExerciseId)) return null;
  return table.get(catalogExerciseId) ?? null;
}

/**
 * The policy for a catalog exercise. The table is injectable so a test (or a fixture region)
 * can supply its own; by default it is the generated one, every production region's.
 *
 * Only reviewed mappings would credit work, but the straps question is about how the set was
 * done, which is worth recording whether or not the mapping is reviewed yet: a mapping reviewed
 * later can then read sets logged before the review. Rejected mappings say the claim does not
 * hold, so the table leaves them out and they ask nothing.
 */
export function loggingPolicyFor(catalogExerciseId: number | null | undefined, table: ReadonlyMap<number, LoggingTableRow> = loggingTable): LoggingPolicy {
  const row = loggingEntryFor(catalogExerciseId, table);
  if (!row) return defaultLoggingPolicy;
  const sideLimb = row.sidedBy === "none" ? null : row.sidedBy;
  // How the limb the side is recorded on works: the arms' laterality, or the legs'.
  const laterality = sideLimb === "arm" ? row.laterality : sideLimb === "leg" ? row.legLaterality : undefined;
  return {
    measure: row.measure === "seconds" ? "seconds" : "reps",
    // No side is asked, of an arm or a leg: both sides are counted as one (owner, 20 Oct 2026).
    askSide: false,
    sideLimb,
    // Nor is a planned one-side set laid out as a row per side: a set is a set.
    oneArm: false,
    // The side a set would start on, read from the variant, for a decision that asks again.
    sideDefault: laterality === "either" ? "both" : null,
    strapsSensitive: row.strapsBy.length > 0,
    strapsBy: row.strapsBy,
    mappedBy: row.mappedBy,
  };
}
