import { describe, expect, it } from "vitest";
import { GOAL_TARGET_SANITY_MAX, goalPeriodInterval, goalProgressLabel, goalScopeOf, isGoalActive, isGoalActiveAt, nodeHomeRegionId, rehomedGoal, sameGoalTarget, validateGoal } from "@shared/specialization/goals";
import { forearmRegionData } from "@shared/specialization/regions/forearm";
import { forearmAdjacentIds, forearmMuscleIds } from "@shared/specialization/regions/forearm/ids";
import { upperArmMuscleIds } from "@shared/specialization/regions/upper_arm/ids";
import { regionIndexEntry } from "@shared/specialization/regionIndex";
import type { SpecializationGoal, SpecializationRegion } from "@shared/specialization/types";
import { fx, fxBack, fxCore, fxThigh } from "./__fixtures__/multiRegion";

/**
 * Targets are the athlete's own (brief §7, design §5): any positive number, above 15
 * included; no default; one active target per muscle-or-movement, measure and period, whichever
 * side it stores (both sides count as one, owner 20 Oct 2026).
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

  it("refuses an overlapping target for the same muscle, measure and period, and says which", () => {
    const existing = [goal({ id: "existing", target: 12 })];
    const result = validateGoal(goal({ id: "new", startsOn: "2026-11-02" }), existing);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("You already have a target of 12 direct dynamic bouts per calendar week for this, from 12 Oct 2026 with no end date. Change that one, or end it before this one starts.");
  });

  it("refuses the same target saved for the other arm: both sides count as one (owner, 20 Oct 2026), so the side is not part of a target", () => {
    const existing = [goal({ id: "existing", side: "left", target: 12 })];
    const result = validateGoal(goal({ id: "new", side: "right", startsOn: "2026-11-02" }), existing);
    expect(result).toEqual({ ok: false, reason: "You already have a target of 12 direct dynamic bouts per calendar week for this, from 12 Oct 2026 with no end date. Change that one, or end it before this one starts." });
    expect(sameGoalTarget(goal({ side: "left" }), goal({ side: "right" }))).toBe(true);
  });

  it("allows what does not overlap: another measure, period, muscle, or dates that do not meet", () => {
    const existing = [goal({ id: "existing", endsOn: "2026-10-18" })];
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

describe("both arms as one, activity, periods and labels", () => {
  /** What the old "Both arms" choice stored before 20 Oct 2026: two copies, one per arm. Nothing writes them now. */
  const savedPerArm = (over: Partial<SpecializationGoal> = {}) => (["left", "right"] as const).map((side) => goal({ id: `pair:${side}`, side, ...over }));

  it("holds a pair saved once per arm before 20 Oct as one target: a second copy is refused, as the database's goals_no_overlap refuses it", () => {
    const [left, right] = savedPerArm();
    expect(sameGoalTarget(left, right)).toBe(true);
    expect(validateGoal(right, [left]).ok).toBe(false);
  });

  it("lets either target of a pair saved once per arm with different numbers be ended, and changed only once the other is out of its way", () => {
    const [left, right] = savedPerArm();
    const pair = [left, { ...right, target: 9 }];
    // Ending only narrows a target's dates, so the overlap it already had does not refuse it.
    expect(validateGoal({ ...left, endsOn: "2026-10-16" }, pair)).toEqual({ ok: true });
    expect(validateGoal({ ...pair[1], endsOn: "2026-10-12" }, pair)).toEqual({ ok: true });
    // Any other change is a new overlap, said as one.
    expect(validateGoal({ ...left, target: 30 }, pair)).toEqual({ ok: false, reason: "You already have a target of 9 direct dynamic bouts per calendar week for this, from 12 Oct 2026 with no end date. Change that one, or end it before this one starts." });
    expect(validateGoal({ ...left, endsOn: "2026-10-16", startsOn: "2026-10-13" }, pair).ok).toBe(false);
    expect(validateGoal({ ...left, target: 30 }, [left, { ...pair[1], endsOn: "2026-10-11", startsOn: "2026-10-01" }])).toEqual({ ok: true });
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

  it("stores a paired region's target as left or right, and names no side in what it says (both sides as one, owner 20 Oct 2026)", () => {
    const sideless = "This target's side does not fit the region: a target here is stored as left or right, and work on either side counts toward it.";
    expect(validateGoal(legGoal({ side: "midline" }), [], thigh)).toEqual({ ok: false, reason: sideless });
    // The forearm, from the registered index when no scope is given.
    expect(validateGoal(goal({ side: "midline" }), [])).toEqual({ ok: false, reason: sideless });
    const clash = validateGoal(legGoal({ id: "new", side: "right" }), [legGoal({ id: "old", side: "right", target: 9 })], thigh);
    expect(clash.ok === false && clash.reason).toBe("You already have a target of 9 direct dynamic bouts per calendar week for this, from 12 Oct 2026 with no end date. Change that one, or end it before this one starts.");
    for (const reason of [sideless, clash.ok === false ? clash.reason : ""]) expect(reason).not.toMatch(/\b(arms?|legs?)\b|right-|left-/);
  });

  it("gives a midline region's target the side midline, and no other", () => {
    const coreGoal = (side: SpecializationGoal["side"]) => goal({ regionId: "fx_core", nodeId: fx.rectus, side });
    expect(validateGoal(coreGoal("midline"), [], core)).toEqual({ ok: true });
    for (const side of ["left", "right"] as const) expect(validateGoal(coreGoal(side), [], core)).toEqual({ ok: false, reason: "This region is counted as a whole, with no left or right. Save the target without a side." });
    const clash = validateGoal({ ...coreGoal("midline"), id: "again" }, [coreGoal("midline")], core);
    expect(clash.ok === false && clash.reason).toMatch(/^You already have a target of 20 direct dynamic bouts/);
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
  // The registered index before wave A (the upper arm a reference region, as wave 0 shipped it), and as it is (promoted, wave A).
  const before = (regionId: string): SpecializationRegion | null => {
    const entry = regionIndexEntry(regionId);
    return entry && regionId === "upper_arm" ? { ...entry, status: "reference" } : entry;
  };
  const after = regionIndexEntry;

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

  it("leaves a target whose side the home cannot hold where it was saved: a midline page's target on a muscle whose home is paired", () => {
    // The fixture core lists the back's quadratus lumborum; a core target on it is a midline target.
    const coreListed = goal({ id: "core-ql", regionId: fxCore.region.id, nodeId: fx.ql, side: "midline", metric: "deliberate_hold_bouts" });
    const regions = new Map([fxCore, fxBack].map((data) => [data.region.id, { ...data.region, status: "production" as const }] as const));
    const homeOf = (regionId: string) => regions.get(regionId) ?? null;
    expect(rehomedGoal(coreListed, homeOf)).toBe(coreListed);
    // Left where it was, it stays a target the core page can end.
    expect(validateGoal({ ...coreListed, endsOn: "2026-10-20" }, [coreListed], goalScopeOf(fxCore))).toEqual({ ok: true });
    // A paired target on the same muscle (saved on a paired page that lists it) moves to the back as before.
    const pairedListed = goal({ id: "paired-ql", regionId: "fx_other", nodeId: fx.ql, side: "left" });
    expect(rehomedGoal(pairedListed, homeOf)).toEqual({ ...pairedListed, regionId: fxBack.region.id });
  });

  it("moves the biceps' and brachialis' targets saved on the forearm page to the upper arm from wave A, read through its version (§2.2)", () => {
    // The index as it is: the upper arm is in production.
    expect(regionIndexEntry("upper_arm")?.status).toBe("production");
    for (const nodeId of [upperArmMuscleIds.biceps, upperArmMuscleIds.brachialis]) {
      const saved = goal({ id: `legacy-${nodeId}`, nodeId });
      const read = rehomedGoal(saved, regionIndexEntry);
      expect(read).toEqual({ ...saved, regionId: "upper_arm" });
      // On its home it is a target the upper arm's page offers: its own target muscle, ended and edited there.
      expect(validateGoal({ ...read, target: read.target + 1 }, [read]).ok, nodeId).toBe(true);
    }
    // The anconeus stays on the forearm page, read-only there.
    const anconeus = goal({ id: "anconeus", nodeId: forearmAdjacentIds.anconeus });
    expect(rehomedGoal(anconeus, regionIndexEntry)).toBe(anconeus);
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
