import { describe, expect, it } from "vitest";
import { GOAL_TARGET_SANITY_MAX, goalPeriodInterval, goalProgressLabel, goalsForBothArms, isGoalActive, isGoalActiveAt, validateGoal } from "@shared/specialization/goals";
import type { SpecializationGoal } from "@shared/specialization/types";

/**
 * Targets are the athlete's own (brief §7, design §5): any positive number, above 15
 * included; no default; one active target per muscle-or-movement, arm, measure and period.
 */

const goal = (over: Partial<SpecializationGoal> = {}): SpecializationGoal => ({
  id: "g1",
  regionId: "forearm",
  nodeId: "forearm.fcr",
  actionId: null,
  side: "left",
  metric: "direct_dynamic_bouts",
  target: 20,
  period: "calendar_week",
  startsOn: "2026-10-12",
  endsOn: null,
  timezone: "Europe/London",
  createdAt: "2026-10-12T08:00:00.000Z",
  updatedAt: "2026-10-12T08:00:00.000Z",
  ...over,
});

describe("validateGoal", () => {
  it("accepts high targets without comment: 20, 40, and anything up to the typo guard", () => {
    expect(validateGoal(goal({ target: 20 }), [])).toEqual({ ok: true });
    expect(validateGoal(goal({ target: 40 }), [])).toEqual({ ok: true });
    expect(validateGoal(goal({ metric: "deliberate_hold_seconds", target: 1800 }), [])).toEqual({ ok: true });
    expect(validateGoal(goal({ target: GOAL_TARGET_SANITY_MAX }), [])).toEqual({ ok: true });
  });

  it("refuses zero, negative, non-finite and absurd targets with a reason", () => {
    for (const target of [0, -3, Number.NaN, Number.POSITIVE_INFINITY, GOAL_TARGET_SANITY_MAX + 1]) {
      const result = validateGoal(goal({ target }), []);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason.length).toBeGreaterThan(10);
    }
  });

  it("needs exactly one of a muscle and a movement", () => {
    expect(validateGoal(goal({ nodeId: "forearm.fcr", actionId: "wrist.flexion" }), []).ok).toBe(false);
    expect(validateGoal(goal({ nodeId: null, actionId: null }), []).ok).toBe(false);
    expect(validateGoal(goal({ nodeId: null, actionId: "wrist.flexion" }), [])).toEqual({ ok: true });
  });

  it("checks the zone and the dates", () => {
    expect(validateGoal(goal({ timezone: "Mars/Olympus_Mons" }), []).ok).toBe(false);
    expect(validateGoal(goal({ startsOn: "2026-02-30" }), []).ok).toBe(false);
    expect(validateGoal(goal({ endsOn: "2026-10-11" }), []).ok).toBe(false);
    expect(validateGoal(goal({ endsOn: "2026-10-12" }), [])).toEqual({ ok: true });
  });

  it("refuses an overlapping target for the same muscle, arm, measure and period, and says which", () => {
    const existing = [goal({ id: "existing", target: 12 })];
    const result = validateGoal(goal({ id: "new", startsOn: "2026-11-02" }), existing);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("You already have a target of 12 direct dynamic bouts per calendar week for this, from 12 Oct 2026 with no end date. Change that one, or end it before this one starts.");
  });

  it("allows what does not overlap: another arm, measure, period, muscle, or dates that do not meet", () => {
    const existing = [goal({ id: "existing", endsOn: "2026-10-18" })];
    expect(validateGoal(goal({ id: "n1", side: "right" }), existing)).toEqual({ ok: true });
    expect(validateGoal(goal({ id: "n2", metric: "deliberate_hold_bouts" }), existing)).toEqual({ ok: true });
    expect(validateGoal(goal({ id: "n3", period: "rolling_7d" }), existing)).toEqual({ ok: true });
    expect(validateGoal(goal({ id: "n4", nodeId: "forearm.fcu" }), existing)).toEqual({ ok: true });
    expect(validateGoal(goal({ id: "n5", startsOn: "2026-10-19" }), existing)).toEqual({ ok: true });
    expect(validateGoal(goal({ id: "n6", startsOn: "2026-10-18" }), existing).ok).toBe(false);
  });

  it("does not compare a goal with its own earlier version when it is edited", () => {
    expect(validateGoal(goal({ target: 25 }), [goal()])).toEqual({ ok: true });
  });
});

describe("both arms, activity, periods and labels", () => {
  it("writes a both-arms entry as two explicit goals that do not clash with each other", () => {
    const { side: _side, ...draft } = goal({ id: "pair" });
    const [left, right] = goalsForBothArms(draft);
    expect([left.id, left.side, right.id, right.side]).toEqual(["pair:left", "left", "pair:right", "right"]);
    expect(validateGoal(right, [left])).toEqual({ ok: true });
  });

  it("is active from its start date through its end date, in its own zone", () => {
    const bounded = goal({ startsOn: "2026-10-12", endsOn: "2026-10-18" });
    expect(isGoalActive(bounded, "2026-10-11")).toBe(false);
    expect(isGoalActive(bounded, "2026-10-12")).toBe(true);
    expect(isGoalActive(bounded, "2026-10-18")).toBe(true);
    expect(isGoalActive(bounded, "2026-10-19")).toBe(false);
    expect(isGoalActive(goal(), "2027-06-01")).toBe(true);
    // 23:30 UTC on the 11th is already the 12th in London.
    expect(isGoalActiveAt(goal({ startsOn: "2026-10-12" }), "2026-10-11T23:30:00.000Z")).toBe(true);
    expect(isGoalActiveAt(goal({ startsOn: "2026-10-12", timezone: "America/New_York" }), "2026-10-11T23:30:00.000Z")).toBe(false);
  });

  it("is measured over its own period", () => {
    expect(goalPeriodInterval(goal({ period: "calendar_week" }), "2026-10-16T12:00:00Z").label).toBe("This week · 12–18 Oct");
    expect(goalPeriodInterval(goal({ period: "rolling_7d" }), "2026-10-16T12:00:00Z").startAt).toBe("2026-10-09T12:00:00.000Z");
  });

  it("labels progress as the athlete's own target, never as optimal", () => {
    expect(goalProgressLabel(8, goal({ target: 20 }))).toBe("8 of your 20");
    expect(goalProgressLabel(22, goal({ target: 20 }))).toBe("22 of your 20");
    expect(goalProgressLabel(90, goal({ metric: "deliberate_hold_seconds", target: 120 }))).toBe("90 of your 120 seconds");
    expect(goalProgressLabel(2.5, goal({ target: 7.5 }))).toBe("2.5 of your 7.5");
  });
});
