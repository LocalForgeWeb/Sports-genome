import type { BodySide, GoalMetric, GoalPeriod, NodeId, RegionId, SpecializationGoal, SpecializationRegion, SpecializationRegionData, StoredSide, SummaryInterval } from "./types";
import { regionIndexEntry } from "./regionIndex";
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

/**
 * What a target is checked against beyond its own fields: the region's sides and words, and the
 * muscles a new muscle target may name, its target members (10-multi-region.md §2.2).
 */
export type GoalScope = {
  region: Pick<SpecializationRegion, "id" | "sides" | "wording">;
  targetNodeIds: ReadonlySet<NodeId>;
};

/** The scope of a region's page: its record and the nodes it lists as targets (its own target muscles). */
export function goalScopeOf(data: Pick<SpecializationRegionData, "region" | "nodes">): GoalScope {
  return { region: data.region, targetNodeIds: new Set(data.nodes.filter((node) => node.role === "target").map((node) => node.id)) };
}

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

/**
 * Same muscle (or the same region's movement), same measure and same period. A muscle has one home
 * region, so a muscle target is compared by the muscle alone: a target re-homed to the muscle's home
 * and one saved there are the same target (10-multi-region.md §2.2). The side is not compared: both
 * sides count as one (the owner, 20 Oct 2026), so a target saved earlier for one arm and a new one
 * are the same target, as the database's goals_no_overlap holds them.
 */
export function sameGoalTarget(a: SpecializationGoal, b: SpecializationGoal): boolean {
  const subject = a.nodeId !== null ? a.nodeId === b.nodeId : b.nodeId === null && a.regionId === b.regionId && a.actionId === b.actionId;
  return subject && a.metric === b.metric && a.period === b.period;
}

type SideWording = Pick<SpecializationRegion, "sides" | "wording">;

/**
 * Whether a goal may be saved beside the ones that exist. Editing a goal passes its own id, so it
 * is never compared with its earlier self. The database refuses the same overlap with an exclusion
 * constraint; this says why before anything is written.
 *
 * The side must fit the region: left or right in a paired region, `midline` in a midline one. Since
 * both sides are counted as one (owner, 20 Oct 2026) a paired region's new target stores `right` as
 * a placeholder nothing reads, and no message names a side.
 * With the page's scope it also checks the muscle: a new muscle target names one of the region's
 * target muscles, and a target already saved on any other muscle (an external or adjacent one,
 * from before targets were limited) may only be ended, or removed (10-multi-region.md §2.2).
 * Without a scope the region's sides and words come from the registered index.
 */
export function validateGoal(goal: SpecializationGoal, existing: readonly SpecializationGoal[], scope?: GoalScope): GoalValidation {
  if (!nonEmpty(goal.id)) return { ok: false, reason: "The target has no id." };
  if (!nonEmpty(goal.regionId)) return { ok: false, reason: "Choose the body region this target belongs to." };
  const region: SideWording | null = scope?.region ?? regionIndexEntry(goal.regionId);
  const hasNode = nonEmpty(goal.nodeId);
  const hasAction = nonEmpty(goal.actionId);
  if (hasNode === hasAction) return { ok: false, reason: "A target is for one muscle or one movement, not both and not neither." };
  if (region?.sides.model === "midline") {
    if (goal.side !== "midline") return { ok: false, reason: "This region is counted as a whole, with no left or right. Save the target without a side." };
  } else if (goal.side !== "left" && goal.side !== "right") {
    return { ok: false, reason: "This target's side does not fit the region: a target here is stored as left or right, and work on either side counts toward it." };
  }
  if (!goalMetrics.includes(goal.metric)) return { ok: false, reason: "Choose what the target counts: direct dynamic bouts, deliberate hold bouts or hold seconds." };
  if (!goalPeriods.includes(goal.period)) return { ok: false, reason: "Choose whether the target is per calendar week or per rolling 7 days." };
  if (typeof goal.target !== "number" || !Number.isFinite(goal.target) || goal.target <= 0) return { ok: false, reason: "Enter a target above zero." };
  if (goal.target > GOAL_TARGET_SANITY_MAX) return { ok: false, reason: `Enter a target of ${GOAL_TARGET_SANITY_MAX.toLocaleString("en-US")} or less. A larger number is almost always a typo.` };
  if (!isValidTimeZone(goal.timezone)) return { ok: false, reason: "The target's time zone is not one this device recognises." };
  if (!isDateKey(goal.startsOn)) return { ok: false, reason: "Enter the date the target starts." };
  if (goal.endsOn !== null && !isDateKey(goal.endsOn)) return { ok: false, reason: "Enter a valid end date, or leave it open." };
  if (goal.endsOn !== null && goal.endsOn < goal.startsOn) return { ok: false, reason: "The end date is before the start date." };

  if (scope && goal.nodeId !== null && !scope.targetNodeIds.has(goal.nodeId)) {
    const earlier = existing.find((other) => other.id === goal.id);
    if (!earlier || !onlyEnds(earlier, goal)) return { ok: false, reason: "Targets are for this region's target muscles. You can end or remove this one." };
  }

  const clash = existing.find((other) => other.id !== goal.id && sameGoalTarget(goal, other) && rangesOverlap(goal, other));
  if (clash) {
    const from = shortDate(clash.startsOn);
    const until = clash.endsOn === null ? "with no end date" : `until ${shortDate(clash.endsOn)}`;
    return {
      ok: false,
      // No side is named: both sides are counted as one (owner, 20 Oct 2026).
      reason: `You already have a target of ${clash.target} ${metricWords[clash.metric]} ${periodWords[clash.period]} for this, from ${from} ${until}. Change that one, or end it before this one starts.`,
    };
  }
  return { ok: true };
}

/** The change ends the goal (an end date set, kept or brought forward) and touches nothing else but `updatedAt`. */
function onlyEnds(before: SpecializationGoal, after: SpecializationGoal): boolean {
  const { endsOn: _beforeEnd, updatedAt: _beforeUpdated, ...restBefore } = before;
  const { endsOn: _afterEnd, updatedAt: _afterUpdated, ...restAfter } = after;
  const unchanged = (Object.keys(restBefore) as (keyof typeof restBefore)[]).every((key) => restBefore[key] === restAfter[key]) && Object.keys(restAfter).length === Object.keys(restBefore).length;
  return unchanged && after.endsOn !== null && (before.endsOn === null || after.endsOn <= before.endsOn);
}

/**
 * The old "Both arms" choice: two explicit goals, one per side (brief §7, as first built). Since
 * both sides are counted as one (owner, 20 Oct 2026) the page saves a new target once and reads a
 * pair saved before as one (`collapseArmPairs`, stores.ts; the summary reads a `both` side the same
 * way); this stays for the pairs already on devices and their tests. A midline region's target has
 * one side, `midline`, and never comes through here.
 */
export function goalsForBothSides(draft: Omit<SpecializationGoal, "side">): [SpecializationGoal, SpecializationGoal] {
  const sides: BodySide[] = ["left", "right"];
  const [left, right] = sides.map((side) => ({ ...draft, id: `${draft.id}:${side}`, side }));
  return [left, right];
}

/** The name `goalsForBothSides` had when every region was paired by the arm. */
export const goalsForBothArms = goalsForBothSides;

/** A node's home region, from its id: `<region>.<slug>` (10-multi-region.md §1.2); null for an id without one. */
export function nodeHomeRegionId(nodeId: NodeId): RegionId | null {
  const dot = nodeId.indexOf(".");
  return dot > 0 ? nodeId.slice(0, dot) : null;
}

/** The side fits the region: left or right in a paired region, `midline` in a midline one. */
export function sideFitsRegion(region: Pick<SpecializationRegion, "sides">, side: StoredSide): boolean {
  return (region.sides.model === "midline") === (side === "midline");
}

/**
 * A stored target as it is read now (10-multi-region.md §2.2). A muscle target saved on another
 * region's page, on a muscle that page lists as external, keeps counting there until the muscle's
 * home region is in production; from then it is read as a target of the home region, with the same
 * id, and the next save writes it so. A target whose side the home cannot hold (a midline page's
 * target on a muscle whose home is paired) stays where it was saved: read as the home's, it would
 * match neither of the home's sides, so no page would show it or let it be ended. Every other
 * target is returned as it is. `homeOf` gives a registered region's record, or null.
 */
export function rehomedGoal(goal: SpecializationGoal, homeOf: (regionId: RegionId) => Pick<SpecializationRegion, "status" | "sides"> | null): SpecializationGoal {
  if (goal.nodeId === null) return goal;
  const homeId = nodeHomeRegionId(goal.nodeId);
  if (homeId === null || homeId === goal.regionId) return goal;
  const home = homeOf(homeId);
  if (home?.status !== "production" || !sideFitsRegion(home, goal.side)) return goal;
  return { ...goal, regionId: homeId };
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
