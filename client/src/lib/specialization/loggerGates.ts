import { isGoalActiveAt } from "@shared/specialization/goals";
import type { LoggingPolicy } from "@shared/specialization/loggingPolicy";
import type { RegionId, SpecializationGoal } from "@shared/specialization/types";

/**
 * What the workout logger asks of one athlete, per exercise, because of their targets
 * (docs/specialization-atlas/10-multi-region.md §6.4; 07-logger.md). The brief keeps the atlas
 * "out of the workout logger until relevant", and with several regions "relevant" is per
 * exercise: a calf target says nothing about straps on a deadlift.
 *
 * - **Straps**, only when the athlete has an active target in a region whose straps-sensitive
 *   mappings include the exercise.
 *
 * Nothing about sides is gated, or asked: both sides are counted as one (owner, 20 Oct 2026,
 * every paired region), so a planned set is one row for everyone and no arm or leg is asked
 * (10-multi-region.md, appendix "Both sides as one"). The rows per side wave 0 gated here are gone.
 *
 * Home builds the gates on the first screen, so this module reads no atlas data: an exercise's
 * regions come from its logging policy (`loggingPolicyFor` in shared/specialization/
 * loggingPolicy.ts), which only the tracker loads.
 */
export type ExerciseGates = {
  /** Ask "Straps · Used / Not used" on this exercise. */
  askStraps: boolean;
};

/** What the gates read of an exercise: its logging policy. */
export type GatedExercise = Pick<LoggingPolicy, "strapsBy" | "mappedBy">;

export interface LoggerGates {
  /** The regions where the athlete has an active target. */
  readonly targetRegionIds: ReadonlySet<RegionId>;
  /** One exercise's gates, from its logging policy. */
  of(exercise: GatedExercise): ExerciseGates;
}

/** Gates for an athlete with active targets in these regions. */
export function loggerGatesForRegions(regionIds: Iterable<RegionId>): LoggerGates {
  const targetRegionIds: ReadonlySet<RegionId> = new Set(regionIds);
  const targeted = (regions: readonly RegionId[]) => regions.some((id) => targetRegionIds.has(id));
  return {
    targetRegionIds,
    of: (exercise) => ({ askStraps: targeted(exercise.strapsBy) }),
  };
}

/** No target anywhere: no straps question, the logger as it was. */
export const noLoggerGates: LoggerGates = loggerGatesForRegions([]);

/** The gates for an athlete's goals: the regions of the goals active at `now`. */
export function loggerGatesFor(goals: readonly SpecializationGoal[], now: string = new Date().toISOString()): LoggerGates {
  return loggerGatesForRegions(goals.filter((goal) => isGoalActiveAt(goal, now)).map((goal) => goal.regionId));
}
