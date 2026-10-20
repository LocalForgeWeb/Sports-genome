import { describe, expect, it } from "vitest";
import { GOAL_TARGET_SANITY_MAX, goalPeriodInterval, goalProgressLabel, goalScopeOf, goalsForBothArms, goalsForBothSides, isGoalActive, isGoalActiveAt, nodeHomeRegionId, rehomedGoal, sameGoalTarget, validateGoal } from "@shared/specialization/goals";
import { forearmRegionData } from "@shared/specialization/regions/forearm";
import { forearmAdjacentIds, forearmMuscleIds } from "@shared/specialization/regions/forearm/ids";
import { upperArmMuscleIds } from "@shared/specialization/regions/upper_arm/ids";
import type { SpecializationGoal } from "@shared/specialization/types";
import { fx, fxCore, fxThigh } from "./__fixtures__/multiRegion";

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
    if (!result.ok) expect(result.reason).toBe("You already have a left-arm target of 12 direct dynamic bouts per calendar week for this, from 12 Oct 2026 with no end date. Change that one, or end it before this one starts.");
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

describe("goals in every region's words and sides (10-multi-region.md §2.2)", () => {
  const thigh = goalScopeOf(fxThigh);
  const core = goalScopeOf(fxCore);
  const legGoal = (over: Partial<SpecializationGoal> = {}) => goal({ regionId: "fx_thigh", nodeId: fx.quads, ...over });

  it("asks for a side in the region's own word, and says a clash in it", () => {
    const refused = validateGoal(legGoal({ side: "midline" }), [], thigh);
    expect(refused).toEqual({ ok: false, reason: "Choose the left or the right leg. A target for both legs is saved as two." });
    // The forearm's words, from the registered index when no scope is given.
    expect(validateGoal(goal({ side: "midline" }), [])).toEqual({ ok: false, reason: "Choose the left or the right arm. A target for both arms is saved as two." });
    const clash = validateGoal(legGoal({ id: "new", side: "right" }), [legGoal({ id: "old", side: "right", target: 9 })], thigh);
    expect(clash.ok === false && clash.reason).toBe("You already have a right-leg target of 9 direct dynamic bouts per calendar week for this, from 12 Oct 2026 with no end date. Change that one, or end it before this one starts.");
  });

  it("gives a midline region's target the side midline, and no other", () => {
    const coreGoal = (side: SpecializationGoal["side"]) => goal({ regionId: "fx_core", nodeId: fx.rectus, side });
    expect(validateGoal(coreGoal("midline"), [], core)).toEqual({ ok: true });
    for (const side of ["left", "right"] as const) expect(validateGoal(coreGoal(side), [], core)).toEqual({ ok: false, reason: "This region is counted as a whole, with no left or right. Save the target without a side." });
    const clash = validateGoal({ ...coreGoal("midline"), id: "again" }, [coreGoal("midline")], core);
    expect(clash.ok === false && clash.reason).toMatch(/^You already have a target of 20 direct dynamic bouts/);
  });

  it("splits both sides into two targets, as both arms always were", () => {
    const { side: _side, ...draft } = legGoal({ id: "pair" });
    expect(goalsForBothSides(draft).map((item) => [item.id, item.side])).toEqual([["pair:left", "left"], ["pair:right", "right"]]);
    expect(goalsForBothArms).toBe(goalsForBothSides);
  });
});

describe("targets only on a region's own target muscles (§2.2)", () => {
  const scope = goalScopeOf(forearmRegionData);
  const biceps = goal({ id: "biceps", nodeId: upperArmMuscleIds.biceps });
  const anconeus = goal({ id: "anconeus", nodeId: forearmAdjacentIds.anconeus });
  const NOT_A_TARGET = { ok: false, reason: "Targets are for this region's target muscles. You can end or remove this one." };

  it("lists the region's own targets: the forearm's 19 muscles, not the biceps, brachialis, anconeus or the compartments", () => {
    expect(Array.from(scope.targetNodeIds).sort()).toEqual(Object.values(forearmMuscleIds).sort());
  });

  it("refuses a new target on an external or an adjacent muscle", () => {
    expect(validateGoal(goal({ nodeId: forearmMuscleIds.flexorCarpiUlnaris }), [], scope)).toEqual({ ok: true });
    expect(validateGoal(biceps, [], scope)).toEqual(NOT_A_TARGET);
    expect(validateGoal(anconeus, [], scope)).toEqual(NOT_A_TARGET);
    // Without the page's scope (an older caller), only the fields are checked.
    expect(validateGoal(anconeus, [])).toEqual({ ok: true });
  });

  it("lets a target already on such a muscle be ended, and nothing else", () => {
    for (const saved of [biceps, anconeus]) {
      expect(validateGoal({ ...saved, endsOn: "2026-10-20", updatedAt: "2026-10-20T08:00:00.000Z" }, [saved], scope), saved.id).toEqual({ ok: true });
      expect(validateGoal({ ...saved, target: 25 }, [saved], scope), saved.id).toEqual(NOT_A_TARGET);
      expect(validateGoal({ ...saved, side: "right" }, [saved], scope), saved.id).toEqual(NOT_A_TARGET);
      // An ended one is not opened again, nor its end moved later.
      const ended = { ...saved, endsOn: "2026-10-20" };
      expect(validateGoal({ ...ended, endsOn: null }, [ended], scope), saved.id).toEqual(NOT_A_TARGET);
      expect(validateGoal({ ...ended, endsOn: "2026-10-30" }, [ended], scope), saved.id).toEqual(NOT_A_TARGET);
    }
  });
});

describe("a target on another region's muscle is re-homed on read (§2.2)", () => {
  const forearmListed = goal({ id: "legacy", nodeId: upperArmMuscleIds.biceps });
  const before = (regionId: string) => regionId === "forearm";
  const after = (regionId: string) => regionId === "forearm" || regionId === "upper_arm";

  it("reads a node's home from its id", () => {
    expect([nodeHomeRegionId(upperArmMuscleIds.biceps), nodeHomeRegionId(forearmMuscleIds.brachioradialis), nodeHomeRegionId("nodot")]).toEqual(["upper_arm", "forearm", null]);
  });

  it("keeps counting where it was saved until the muscle's home is in production, then is read as the home's, with the same id", () => {
    expect(rehomedGoal(forearmListed, before)).toBe(forearmListed);
    expect(rehomedGoal(forearmListed, after)).toEqual({ ...forearmListed, regionId: "upper_arm" });
  });

  it("leaves an adjacent muscle's target, a movement target and a home region's own target where they are", () => {
    const anconeus = goal({ id: "anconeus", nodeId: forearmAdjacentIds.anconeus });
    const movement = goal({ id: "move", nodeId: null, actionId: "elbow.flexion" });
    const home = goal({ id: "home", regionId: "upper_arm", nodeId: upperArmMuscleIds.biceps });
    for (const item of [anconeus, movement, home]) expect(rehomedGoal(item, after)).toBe(item);
  });

  it("is the same target as one saved on the home page: they clash, before and after the move", () => {
    const onHome = goal({ id: "new", regionId: "upper_arm", nodeId: upperArmMuscleIds.biceps, startsOn: "2026-11-02" });
    expect(sameGoalTarget(onHome, forearmListed)).toBe(true);
    expect(validateGoal(onHome, [forearmListed]).ok).toBe(false);
    expect(validateGoal(onHome, [rehomedGoal(forearmListed, after)]).ok).toBe(false);
    // A movement target is still its region's own.
    expect(sameGoalTarget(goal({ nodeId: null, actionId: "elbow.flexion" }), goal({ regionId: "upper_arm", nodeId: null, actionId: "elbow.flexion" }))).toBe(false);
  });
});
