import type { Limb, RegionId, SideAnchor } from "./types";
import { loggingTable, type LoggingTableRow } from "./loggingTable.generated";
import { countingDimensions } from "./variants/dimensions";

/**
 * What the workout logger asks of one exercise, read from the atlas's logging table
 * (docs/specialization-atlas/02-design.md §6; 10-multi-region.md §6.4).
 *
 * The brief wants this information "out of the workout logger until relevant" and every
 * set entry kept from turning into a questionnaire (§6, "Muscle detail sheet"). So the
 * logger asks for nothing the atlas has not said matters for that exact exercise: a
 * Seconds box only where the variant is measured in seconds, a side only where the
 * variant can be done one arm or one leg at a time and a region that counts that limb's
 * sides maps it, a straps question only where a grip mapping depends on a bare hand. An
 * exercise no production region maps gets the default policy, which is exactly the logger
 * as it was before the atlas existed.
 *
 * Region-agnostic on purpose: the table (`loggingTable.generated.ts`) is written from every
 * production region by scripts/specialization/emit-logging-table.ts, so a region added to the
 * registry is picked up with no change here. The tracker and the swap sheet import this
 * module, and the table holds a few facts per exercise, never a region's mappings, drawing,
 * claims or sources.
 *
 * What the athlete's targets decide (the straps question, rows per side) is not here: that is
 * `loggerGatesFor` in client/src/lib/specialization/loggerGates.ts, read from this policy.
 */
export type LoggedSide = "left" | "right" | "both";

export interface LoggingPolicy {
  /** What the set's dose is entered in: reps, or the seconds of a hold. */
  measure: "reps" | "seconds";
  /**
   * Ask which side: the variant can be (or must be) done one arm, or one leg, at a time (its
   * laterality on the limb it is sided by is `unilateral` or `either`), and a production region
   * paired by that limb maps it, so the side is counted. A side plank mapped only by the core
   * asks nothing.
   */
  askSide: boolean;
  /** The limb the side is recorded on (the variant's `sidedBy`): a set's `side` for the arm, `legSide` for the leg; null where no side is. */
  sideLimb: Limb | null;
  /** On the leg, which leg a side names (the front leg of a split squat); null on the arm. */
  sideAnchor: SideAnchor | null;
  /**
   * The variant is one side at a time by definition (laterality `unilateral` on its limb, not
   * `either`): a planned set of it is done once with each side. The tracker reads this, with the
   * athlete's gates, to lay a planned set out as two rows, one per side.
   */
  oneSide: boolean;
  /** `oneSide`, under the name it had when only arms were asked. */
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
export const defaultLoggingPolicy: LoggingPolicy = Object.freeze({ measure: "reps", askSide: false, sideLimb: null, sideAnchor: null, oneSide: false, oneArm: false, sideDefault: null, strapsSensitive: false, strapsBy: [], mappedBy: [] });

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
  const oneSide = laterality === "unilateral";
  return {
    measure: row.measure === "seconds" ? "seconds" : "reps",
    askSide: (oneSide || laterality === "either") && row.sideCounted,
    sideLimb,
    sideAnchor: sideLimb === "leg" ? row.sideAnchor ?? null : null,
    oneSide,
    oneArm: oneSide,
    // A two-handed implement never asks. "Either" is usually both at once (a pair of dumbbells),
    // so it starts on Both; a one-side exercise starts unset.
    sideDefault: laterality === "either" ? "both" : null,
    strapsSensitive: row.strapsBy.length > 0,
    strapsBy: row.strapsBy,
    mappedBy: row.mappedBy,
  };
}

/**
 * The side question's label: "Arm", or on the leg the leg the variant's side anchor names
 * ("Front leg", "Standing leg"; the words of `variants/dimensions.ts`), "Leg" when it names none.
 */
export function sideQuestionLabel(policy: Pick<LoggingPolicy, "sideLimb" | "sideAnchor">): string {
  if (policy.sideLimb !== "leg") return "Arm";
  return policy.sideAnchor ? countingDimensions.side_anchor.values[policy.sideAnchor] : "Leg";
}
