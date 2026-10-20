import type { ArmSide, GoalMetric, GoalPeriod, SpecializationGoal, SummaryInterval } from "./types";
import { calendarWeekInterval, isDateKey, isValidTimeZone, localDateKey, rolling7dInterval } from "./time";

/**
 * Specialization targets (brief §7, design §5).
 *
 * A target is the athlete's own intent, not a threshold the app endorses: any positive
 * number is accepted, 20 or 40 as readily as 6, and nothing here ever raises one. The only
 * ceiling is a sanity bound that catches a typo (an extra zero or three), not a judgement
 * about volume. There is no default target; a muscle without one reads "Not targeted".
 */

export const goalMetrics: readonly GoalMetric[] = ["direct_dynamic_bouts", "deliberate_hold_bouts", "deliberate_hold_seconds"];
export const goalPeriods: readonly GoalPeriod[] = ["calendar_week", "rolling_7d"];

/** Catches a mistyped number; it is not a recommendation. Seconds can legitimately run into the thousands. */
export const GOAL_TARGET_SANITY_MAX = 10_000;

export type GoalValidation = { ok: true } | { ok: false; reason: string };

const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.trim() !== "";

const metricWords: Record<GoalMetric, string> = {
  direct_dynamic_bouts: "direct dynamic bouts",
  deliberate_hold_bouts: "deliberate hold bouts",
  deliberate_hold_seconds: "seconds of deliberate holds",
};

const periodWords: Record<GoalPeriod, string> = {
  calendar_week: "per calendar week",
  rolling_7d: "per rolling 7 days",
};

function shortDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** Two goals' date ranges share at least one day. An open end runs forever. */
function rangesOverlap(a: Pick<SpecializationGoal, "startsOn" | "endsOn">, b: Pick<SpecializationGoal, "startsOn" | "endsOn">): boolean {
  const aEndsAfterBStarts = a.endsOn === null || a.endsOn >= b.startsOn;
  const bEndsAfterAStarts = b.endsOn === null || b.endsOn >= a.startsOn;
  return aEndsAfterBStarts && bEndsAfterAStarts;
}

/** Same region, same muscle or action, same arm, same measure and same period. */
export function sameGoalTarget(a: SpecializationGoal, b: SpecializationGoal): boolean {
  return a.regionId === b.regionId && a.nodeId === b.nodeId && a.actionId === b.actionId && a.side === b.side && a.metric === b.metric && a.period === b.period;
}

/**
 * Whether a goal may be saved beside the ones that exist. Editing a goal passes its own
 * id, so it is never compared with its earlier self. The database refuses the same
 * overlap with an exclusion constraint; this says why before anything is written.
 */
export function validateGoal(goal: SpecializationGoal, existing: readonly SpecializationGoal[]): GoalValidation {
  if (!nonEmpty(goal.id)) return { ok: false, reason: "The target has no id." };
  if (!nonEmpty(goal.regionId)) return { ok: false, reason: "Choose the body region this target belongs to." };
  const hasNode = nonEmpty(goal.nodeId);
  const hasAction = nonEmpty(goal.actionId);
  if (hasNode === hasAction) return { ok: false, reason: "A target is for one muscle or one movement, not both and not neither." };
  if (goal.side !== "left" && goal.side !== "right") return { ok: false, reason: "Choose the left or the right arm. A target for both arms is saved as two." };
  if (!goalMetrics.includes(goal.metric)) return { ok: false, reason: "Choose what the target counts: direct dynamic bouts, deliberate hold bouts or hold seconds." };
  if (!goalPeriods.includes(goal.period)) return { ok: false, reason: "Choose whether the target is per calendar week or per rolling 7 days." };
  if (typeof goal.target !== "number" || !Number.isFinite(goal.target) || goal.target <= 0) return { ok: false, reason: "Enter a target above zero." };
  if (goal.target > GOAL_TARGET_SANITY_MAX) return { ok: false, reason: `Enter a target of ${GOAL_TARGET_SANITY_MAX.toLocaleString("en-US")} or less. A larger number is almost always a typo.` };
  if (!isValidTimeZone(goal.timezone)) return { ok: false, reason: "The target's time zone is not one this device recognises." };
  if (!isDateKey(goal.startsOn)) return { ok: false, reason: "Enter the date the target starts." };
  if (goal.endsOn !== null && !isDateKey(goal.endsOn)) return { ok: false, reason: "Enter a valid end date, or leave it open." };
  if (goal.endsOn !== null && goal.endsOn < goal.startsOn) return { ok: false, reason: "The end date is before the start date." };

  const clash = existing.find((other) => other.id !== goal.id && sameGoalTarget(goal, other) && rangesOverlap(goal, other));
  if (clash) {
    const from = shortDate(clash.startsOn);
    const until = clash.endsOn === null ? "with no end date" : `until ${shortDate(clash.endsOn)}`;
    return {
      ok: false,
      // No arm is named: both arms are counted as one (20 Oct 2026).
      reason: `You already have a target of ${clash.target} ${metricWords[clash.metric]} ${periodWords[clash.period]} for this, from ${from} ${until}. Change that one, or end it before this one starts.`,
    };
  }
  return { ok: true };
}

/**
 * "Both arms" is not a side: the entry becomes two explicit goals, one per arm, so left
 * and right can be compared and changed separately (brief §7).
 */
export function goalsForBothArms(draft: Omit<SpecializationGoal, "side">): [SpecializationGoal, SpecializationGoal] {
  const arms: ArmSide[] = ["left", "right"];
  const [left, right] = arms.map((side) => ({ ...draft, id: `${draft.id}:${side}`, side }));
  return [left, right];
}

/** Active on a local date: started, and not yet ended (the end date is included). */
export function isGoalActive(goal: Pick<SpecializationGoal, "startsOn" | "endsOn">, todayKey: string): boolean {
  return goal.startsOn <= todayKey && (goal.endsOn === null || todayKey <= goal.endsOn);
}

/** Active now, in the goal's own time zone. A goal with an unknown zone is never active. */
export function isGoalActiveAt(goal: SpecializationGoal, nowIso: string): boolean {
  if (!isValidTimeZone(goal.timezone)) return false;
  return isGoalActive(goal, localDateKey(nowIso, goal.timezone));
}

/** The window a goal is measured over right now: its own period, in its own zone. */
export function goalPeriodInterval(goal: Pick<SpecializationGoal, "period" | "timezone">, nowIso: string): SummaryInterval {
  return goal.period === "calendar_week" ? calendarWeekInterval(nowIso, goal.timezone) : rolling7dInterval(nowIso, goal.timezone);
}

const formatAmount = (value: number) => (Number.isInteger(value) ? String(value) : String(Math.round(value * 10) / 10));

/**
 * "8 of your 20", or "90 of your 120 seconds". Always "of your": the number is the
 * athlete's own target, never a claim about what is optimal.
 */
export function goalProgressLabel(value: number, goal: Pick<SpecializationGoal, "target" | "metric">): string {
  const unit = goal.metric === "deliberate_hold_seconds" ? " seconds" : "";
  return `${formatAmount(value)} of your ${formatAmount(goal.target)}${unit}`;
}
