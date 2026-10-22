import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { buildDaySlots, emptyDayStore, type WeeklyDayStore } from "@/lib/trainingDayPlan";
import { composeRegionData } from "@shared/specialization/compose";
import { getSpecializationSummary, indexRegion, nodeSideFor } from "@shared/specialization/exposure";
import { goalMetrics } from "@shared/specialization/goals";
import { forearmRegionData } from "@shared/specialization/regions/forearm";
import { forearmMuscleIds } from "@shared/specialization/regions/forearm/ids";
import { calendarWeekInterval, planWeekInterval } from "@shared/specialization/time";
import type { ExerciseVariant, ExposureBout, GoalMetric, NodeExposure, SpecializationGoal, SpecializationRegionData, SpecializationSummary, SummarySide } from "@shared/specialization/types";
import { movementLedger } from "@/components/specialization/model";
import { boutsFromSessions } from "./bouts";
import { boutsFromPlan } from "./planBouts";
import { catalogMusclesLookup } from "./useSpecializationSummary";
import { fx, fxBack, fxBackBeforeShoulder, fxBackContent, fxCore, fxShoulder, fxShoulderContent, fxThigh, fxVariants } from "./__fixtures__/multiRegion";
import { exercise, finished, workSet, type AtlasSet } from "./__fixtures__/syntheticForearm";

/**
 * 10-multi-region.md §2.1, "Consequences, each a test": the side rules on a page paired by the
 * leg, one paired by the arm whose side word is "side", and a midline page, completed and planned,
 * on the test regions of __fixtures__/multiRegion.ts and on the forearm's real data. Every summary
 * here also holds §2.2, each target's value equals its row (`goalsEqualRows`), and its region
 * totals and completeness are the ones its rows give (`expectCompletenessFromRows`).
 *
 * Since the owner's decision of 20 Oct 2026 (both sides as one, 10-multi-region.md, appendix "Both
 * sides as one") the page reads one summary per paired region, side `both`; the per-side rules
 * below stay as dormant, tested capability of the calculator, and every target check also runs on
 * `both`. "Planned equals logged as built" is the page's: one row per planned set, no side asked.
 */

const TZ = "Europe/London";
const NOW = "2026-10-16T12:00:00.000Z";
const WED = "2026-10-14T18:00:00.000Z";
const WEEK = calendarWeekInterval(NOW, TZ);
const catalogMusclesFor = catalogMusclesLookup(exercises);
const PAIRED: SummarySide[] = ["left", "right"];
const sidesOf = (region: SpecializationRegionData): SummarySide[] => (region.region.sides.model === "midline" ? ["midline"] : PAIRED);
/** The side the page reads: `both` on a paired region (both sides as one), `midline` on a midline one. */
const pageSideOf = (region: SpecializationRegionData): SummarySide => (region.region.sides.model === "midline" ? "midline" : "both");

function summarize(region: SpecializationRegionData, bouts: readonly ExposureBout[], side: SummarySide, mode: "completed" | "planned" = "completed", goals: SpecializationGoal[] = []): SpecializationSummary {
  const summary = getSpecializationSummary({ region, bouts, interval: mode === "completed" ? WEEK : planWeekInterval(1, TZ), side, mode, goals, catalogMusclesFor, sourceRevision: "s", planRevision: mode === "planned" ? "p" : null, now: NOW });
  expectCompletenessFromRows(region, summary);
  return summary;
}

/**
 * The region's totals and completeness are the ones its rows give (§2.1, §4.2). Each set the
 * region's own muscles show is read as a node row reads it: its counted contributions first, then
 * its withheld (strapped) rows, then its pending ones; the first that has it decides whether it is
 * on this side or kept apart, and whether reviewed work puts it here. So a set is in the distinct
 * bouts or the unknown-side set exactly as completeness counts it, and is counted as reviewed only
 * where reviewed work of the region's own puts it.
 */
function expectCompletenessFromRows(region: SpecializationRegionData, summary: SpecializationSummary): void {
  const own = indexRegion(region).regionNodeIds;
  const decided = new Map<string, { kind: number; on: boolean }>();
  const read = (boutId: string, kind: number, on: boolean) => {
    const was = decided.get(boutId);
    if (!was || kind < was.kind) decided.set(boutId, { kind, on });
    else if (kind === was.kind) was.on ||= on;
  };
  for (const node of summary.nodes.filter((item) => own.has(item.nodeId))) {
    for (const item of node.contributions) read(item.boutId, 0, item.countedSide !== "unknown");
    for (const item of node.notCounted ?? []) read(item.boutId, item.notes.includes("Mapping pending review") ? 2 : 1, item.countedSide !== "unknown");
  }
  const sets = Array.from(decided.values());
  const regionOnly = summary.regionUnclassifiedRows ?? [];
  const at = `${summary.regionId} ${summary.side} ${summary.mode}`;
  expect([summary.regionDistinctBouts, summary.regionUnknownSideBouts], at).toEqual([sets.filter((item) => item.kind === 0 && item.on).length, sets.filter((item) => item.kind === 0 && !item.on).length]);
  expect(summary.completeness, at).toMatchObject({
    boutsConsidered: sets.length + regionOnly.length,
    boutsWithReviewedMapping: sets.filter((item) => item.kind < 2).length,
    boutsPendingReview: sets.filter((item) => item.kind === 2).length,
    boutsRegionOnly: regionOnly.length,
    boutsUnknownSide: sets.filter((item) => !item.on).length + regionOnly.filter((item) => item.countedSide === "unknown").length,
  });
}

/** Sets of one exercise in one finished workout, as the logger stores them. */
let sessionCount = 0;
function logged(catalogId: number, sets: Partial<AtlasSet>[], holdSeconds?: string): ExposureBout[] {
  const name = exercises.find((item) => item.id === catalogId)!.name;
  const id = `w${++sessionCount}`;
  const session = finished(id, WED, [exercise(`${id}-e`, name, catalogId, sets.map((over, index) => workSet({ id: `${id}-${index}`, ...(holdSeconds ? { reps: "", holdSeconds } : {}), ...over })))]);
  return boutsFromSessions([session], { catalog: exercises, fallbackUnit: "kg" });
}

/** One plan day holding one exercise with a written prescription. */
function planned(catalogId: number, prescription: string, variants: readonly ExerciseVariant[]): ExposureBout[] {
  const slots = buildDaySlots(["Pull"]);
  const store: WeeklyDayStore = { ...emptyDayStore(), plan: { [slots[0].key]: [exercises.find((item) => item.id === catalogId)!] }, prescriptions: { [slots[0].key]: { [catalogId]: prescription } } };
  return boutsFromPlan({ week: 1, slots, store, variants });
}

const row = (summary: SpecializationSummary, nodeId: string) => summary.nodes.find((node) => node.nodeId === nodeId)!;
const credited = (node: NodeExposure) => node.directDynamicBouts + node.contributingDynamicBouts + node.deliberateHoldBouts + node.incidentalBouts + node.mixedBouts + node.unknownBouts;

const bucket: Record<GoalMetric, (node: NodeExposure) => number> = {
  direct_dynamic_bouts: (node) => node.directDynamicBouts,
  deliberate_hold_bouts: (node) => node.deliberateHoldBouts,
  deliberate_hold_seconds: (node) => node.deliberateHoldSeconds,
};
const wantedCategory: Record<GoalMetric, string> = { direct_dynamic_bouts: "direct_dynamic", deliberate_hold_bouts: "deliberate_isometric", deliberate_hold_seconds: "deliberate_isometric" };

/**
 * §2.2: a target's value equals its row. For every node and movement of the region, every metric
 * and every side, a target over the summary's own window reads exactly the node's bucket, and a
 * movement target the distinct bouts of the region's own muscles counted on that side whose part
 * is that movement and kind of work (seconds once per bout); and that is the movement sheet's own
 * total (model.ts `movementLedger`), so the sheet and the target never read one movement two ways.
 */
function goalsEqualRows(region: SpecializationRegionData, bouts: readonly ExposureBout[], mode: "completed" | "planned"): void {
  const own = indexRegion(region).regionNodeIds;
  for (const side of Array.from(new Set([...sidesOf(region), pageSideOf(region)]))) {
    const goals: SpecializationGoal[] = [];
    // A target is stored with a side of the region (`right` as the page's placeholder on a paired one); `both` reads every side.
    const base = { regionId: region.region.id, side: side === "both" ? ("right" as const) : side, target: 1, period: "calendar_week" as const, startsOn: "2026-01-01", endsOn: null, timezone: TZ, createdAt: "", updatedAt: "" };
    for (const metric of goalMetrics) {
      for (const node of region.nodes) goals.push({ ...base, id: `n:${node.id}:${metric}`, nodeId: node.id, actionId: null, metric });
      for (const action of region.actions) goals.push({ ...base, id: `a:${action.id}:${metric}`, nodeId: null, actionId: action.id, metric });
    }
    const summary = summarize(region, bouts, side, mode, goals);
    expect(summary.goals).toHaveLength(goals.length);
    for (const progress of summary.goals) {
      const { goal } = progress;
      if (goal.nodeId !== null) {
        expect(progress.value, `${side} ${goal.id}`).toBe(bucket[goal.metric](row(summary, goal.nodeId)));
        continue;
      }
      const counted = new Map<string, number>();
      for (const node of summary.nodes.filter((item) => own.has(item.nodeId))) {
        for (const contribution of node.contributions) {
          if (contribution.countedSide !== side) continue;
          if (contribution.parts.some((part) => part.actionId === goal.actionId && part.category === wantedCategory[goal.metric])) counted.set(contribution.boutId, contribution.holdSeconds);
        }
      }
      const expected = goal.metric === "deliberate_hold_seconds" ? Array.from(counted.values()).reduce((total, seconds) => total + seconds, 0) : counted.size;
      expect(progress.value, `${side} ${goal.id}`).toBe(expected);
      const { totals } = movementLedger(summary, region, goal.actionId!);
      expect(progress.value, `${side} ${goal.id}: the movement sheet's total`).toBe(
        goal.metric === "direct_dynamic_bouts" ? totals.directDynamicBouts : goal.metric === "deliberate_hold_bouts" ? totals.deliberateHoldBouts : totals.deliberateHoldSeconds,
      );
    }
  }
}

/** Per side, each node's counts and the region's distinct bouts. */
const perSide = (region: SpecializationRegionData, bouts: readonly ExposureBout[], mode: "completed" | "planned") =>
  sidesOf(region).map((side) => {
    const summary = summarize(region, bouts, side, mode);
    return { side, region: summary.regionDistinctBouts, unknown: summary.regionUnknownSideBouts, nodes: summary.nodes.map((node) => [node.nodeId, node.directDynamicBouts, node.contributingDynamicBouts, node.deliberateHoldBouts, node.deliberateHoldSeconds, node.incidentalBouts, node.unknownSide.bouts]) };
  });
/** The page's summary (`both` or `midline`), each node's counts and the region's distinct bouts: what "planned equals logged as built" compares. */
const onPage = (region: SpecializationRegionData, bouts: readonly ExposureBout[], mode: "completed" | "planned") => {
  const side = pageSideOf(region);
  const summary = summarize(region, bouts, side, mode);
  return { side, region: summary.regionDistinctBouts, unknown: summary.regionUnknownSideBouts, nodes: summary.nodes.map((node) => [node.nodeId, node.directDynamicBouts, node.contributingDynamicBouts, node.deliberateHoldBouts, node.deliberateHoldSeconds, node.incidentalBouts, node.unknownSide.bouts]) };
};

describe("a page paired by the leg", () => {
  it("counts a back squat once on each leg, logged with no side and planned", () => {
    const sets = logged(161, [{}, {}]);
    for (const side of PAIRED) {
      expect(row(summarize(fxThigh, sets, side), fx.quads).directDynamicBouts, side).toBe(2);
      expect(summarize(fxThigh, sets, side).regionDistinctBouts, side).toBe(2);
      expect(row(summarize(fxThigh, planned(161, "3 × 8", [fxVariants.backSquat]), side, "planned"), fx.quads).directDynamicBouts, side).toBe(3);
    }
    goalsEqualRows(fxThigh, sets, "completed");
  });

  it("counts a Bulgarian split squat logged Front leg: Right on the right leg only", () => {
    const sets = logged(173, [{ legSide: "right" }]);
    expect(row(summarize(fxThigh, sets, "right"), fx.quads).directDynamicBouts).toBe(1);
    expect(row(summarize(fxThigh, sets, "left"), fx.quads).directDynamicBouts).toBe(0);
    const [contribution] = row(summarize(fxThigh, sets, "right"), fx.quads).contributions;
    expect([contribution.countedSide, contribution.recordedSide, contribution.sideRelation]).toEqual(["right", { limb: "leg", side: "right", source: "recorded" }, "same"]);
    goalsEqualRows(fxThigh, sets, "completed");
  });

  it("credits the left hamstrings for a single-leg RDL logged Standing leg: Left, and keeps an arm-only side apart", () => {
    const sets = logged(188, [{ legSide: "left" }, { side: "left" }]);
    const left = summarize(fxThigh, sets, "left");
    expect(row(left, fx.hamstrings).directDynamicBouts).toBe(1);
    expect(row(summarize(fxThigh, sets, "right"), fx.hamstrings).directDynamicBouts).toBe(0);
    // An arm side says nothing about the legs (rule 6): kept apart, recorded side shown as the arm's.
    expect(left.regionUnknownSideBouts).toBe(1);
    const apart = row(left, fx.hamstrings).contributions.find((item) => item.countedSide === "unknown")!;
    expect(apart.recordedSide).toEqual({ limb: "arm", side: "left", source: "recorded" });
    goalsEqualRows(fxThigh, sets, "completed");
  });
});

describe("a page paired by the arm, with the side words of the back", () => {
  it("credits the right quadratus lumborum for a suitcase carry in the left hand, and the erectors on both sides", () => {
    const sets = logged(409, [{ side: "left" }], "40");
    const right = summarize(fxBack, sets, "right");
    const [ql] = row(right, fx.ql).contributions;
    // The ledger row reads "Right", noted "Left hand: opposite side".
    expect([ql.countedSide, ql.recordedSide, ql.sideRelation, ql.category]).toEqual(["right", { limb: "arm", side: "left", source: "recorded" }, "opposite", "deliberate_isometric"]);
    expect(row(summarize(fxBack, sets, "left"), fx.ql).deliberateHoldBouts).toBe(0);
    for (const side of PAIRED) {
      expect(row(summarize(fxBack, sets, side), fx.erectors).incidentalBouts, side).toBe(1);
      expect(summarize(fxBack, sets, side).regionDistinctBouts, side).toBe(1);
    }
    goalsEqualRows(fxBack, sets, "completed");
  });

  it("credits the right lat and both erectors for a one-arm row logged Right", () => {
    const sets = logged(46, [{ side: "right" }]);
    expect(row(summarize(fxBack, sets, "right"), fx.lat).directDynamicBouts).toBe(1);
    expect(row(summarize(fxBack, sets, "left"), fx.lat).directDynamicBouts).toBe(0);
    for (const side of PAIRED) expect(row(summarize(fxBack, sets, side), fx.erectors).incidentalBouts, side).toBe(1);
    goalsEqualRows(fxBack, sets, "completed");
  });

  it("with no side recorded, credits both erectors and keeps the row out of the unknown-side set; the lat's unknown stays on its row", () => {
    const sets = logged(46, [{}]);
    for (const side of PAIRED) {
      const summary = summarize(fxBack, sets, side);
      expect(row(summary, fx.erectors).incidentalBouts, side).toBe(1);
      expect(row(summary, fx.lat).unknownSide.directDynamicBouts, side).toBe(1);
      expect(row(summary, fx.lat).directDynamicBouts, side).toBe(0);
      expect([summary.regionDistinctBouts, summary.regionUnknownSideBouts], side).toEqual([1, 0]);
      expect(summary.regionBoutRows!.map((item) => item.countedSide), side).toEqual([side]);
      expect(summary.completeness.boutsUnknownSide, side).toBe(0);
    }
    goalsEqualRows(fxBack, sets, "completed");
  });

  it("credits an external muscle as its home region credits it, the same row on both pages, and its own rows until the home publishes", () => {
    const sets = [...logged(46, [{ side: "right" }]), ...logged(46, [{ side: "left" }, {}])];
    for (const side of PAIRED) {
      const here = row(summarize(fxBack, sets, side), fx.rearDelt);
      const home = row(summarize(fxShoulder, sets, side), fx.rearDelt);
      expect(here.contributions, side).toEqual(home.contributions.map((item) => ({ ...item, parts: item.parts.map((part) => ({ ...part, mappingId: `fx_shoulder_mappings_v1/${part.mappingId}` })) })));
      expect([here.directDynamicBouts, here.unknownSide.bouts], side).toEqual([1, 1]);
      // Before the shoulder publishes, the back's own row (contributing) is read.
      const before = row(summarize(fxBackBeforeShoulder, sets, side), fx.rearDelt);
      expect([before.directDynamicBouts, before.contributingDynamicBouts], side).toEqual([0, 1]);
    }
    expect(indexRegion(fxBack).creditedBy.get(fx.rearDelt)).toEqual({ versionKey: "fx_shoulder_mappings_v1", branch: "version.home" });
    expect(indexRegion(fxBackBeforeShoulder).creditedBy.get(fx.rearDelt)).toEqual({ versionKey: "fx_back_mappings_v1", branch: "version.listing_fallback" });
  });

  it("never groups shared work across two versions: the lat and the rear deltoid are both shared, by different versions", () => {
    const sets = logged(46, [{ side: "right" }]);
    const summary = summarize(fxBack, sets, "right");
    expect(row(summary, fx.lat).contributions[0].sharedWith).toEqual([]);
    expect(row(summary, fx.rearDelt).contributions[0].sharedWith).toEqual([]);
  });
});

describe("completeness agrees with the region totals when a set's own mappings read its sides differently", () => {
  // The back with its erectors' row on the one-arm row still a draft (loaded on both sides) beside the lat's reviewed row (the recorded side).
  const draftErectors = composeRegionData(
    { ...fxBackContent, mappings: fxBackContent.mappings.map((item) => (item.nodeId === fx.erectors && item.variantId === fxVariants.oneArmRow.id ? { ...item, reviewStatus: "draft" as const } : item)) },
    [fxShoulderContent],
  );

  it("logged Right: on the left only the pending erectors have it, so it is under review there, not reviewed", () => {
    const sets = logged(46, [{ side: "right" }]);
    const left = summarize(draftErectors, sets, "left");
    expect([left.regionDistinctBouts, left.regionUnknownSideBouts]).toEqual([0, 0]);
    expect(left.completeness).toMatchObject({ boutsConsidered: 1, boutsWithReviewedMapping: 0, boutsPendingReview: 1, boutsUnknownSide: 0 });
    expect(row(left, fx.erectors).pendingReviewBouts).toBe(1);
    const right = summarize(draftErectors, sets, "right");
    expect([right.regionDistinctBouts, right.completeness.boutsWithReviewedMapping, right.completeness.boutsPendingReview]).toEqual([1, 1, 0]);
  });

  it("no side recorded: the lat keeps it apart, so it is in the unknown-side set and counted with no side, though the pending erectors are on both sides", () => {
    const sets = logged(46, [{}]);
    for (const side of PAIRED) {
      const summary = summarize(draftErectors, sets, side);
      expect([summary.regionDistinctBouts, summary.regionUnknownSideBouts], side).toEqual([0, 1]);
      expect(summary.completeness, side).toMatchObject({ boutsConsidered: 1, boutsWithReviewedMapping: 1, boutsPendingReview: 0, boutsUnknownSide: 1 });
    }
  });
});

describe("a midline page", () => {
  it("counts a suitcase carry once, the obliques on the midline, and the quadratus lumborum as the back's distinct bouts, once", () => {
    const sets = [...logged(409, [{ side: "left" }, { side: "right" }], "30"), ...logged(409, [{}], "30")];
    const summary = summarize(fxCore, sets, "midline");
    expect(row(summary, fx.obliques).deliberateHoldBouts).toBe(3);
    expect(row(summary, fx.obliques).contributions.every((item) => item.countedSide === "midline")).toBe(true);
    expect(row(summary, fx.ql).deliberateHoldBouts).toBe(3);
    expect([summary.regionDistinctBouts, summary.regionUnknownSideBouts, summary.completeness.boutsUnknownSide]).toEqual([3, 0, 0]);
    goalsEqualRows(fxCore, sets, "completed");
  });

  it("counts a decline sit-up once, not once per arm, and a side plank with no side recorded", () => {
    const sets = [...logged(241, [{ side: "both" }, {}]), ...logged(247, [{}], "45")];
    const summary = summarize(fxCore, sets, "midline");
    expect(row(summary, fx.rectus).directDynamicBouts).toBe(2);
    expect(row(summary, fx.obliques).deliberateHoldBouts).toBe(1);
    expect(summary.regionDistinctBouts).toBe(3);
    goalsEqualRows(fxCore, sets, "completed");
  });

  it("refuses a side for a midline region, and a midline side for a paired one", () => {
    expect(() => summarize(fxCore, [], "left")).toThrow(/midline/);
    expect(() => summarize(fxBack, [], "midline")).toThrow(/for its two sides/);
    // And `both`, the page's side for a paired region, fits only a paired one.
    expect(() => summarize(fxCore, [], "both")).toThrow(/midline/);
    expect(() => summarize(fxBack, [], "both")).not.toThrow();
  });
});

describe("planned equals logged as built (§2.1), on the page: both sides as one", () => {
  // The tracker lays every planned set out as one row and asks no side (owner, 20 Oct 2026;
  // 07-logger.md, §6.4); the plan counts a planned set as one bout, assumed on both sides.
  const asBuilt = (variant: ExerciseVariant, sets: number, hold?: string) => {
    const rows: Partial<AtlasSet>[] = Array.from({ length: sets }, () => ({}));
    return logged(variant.catalogExerciseId, rows, hold);
  };
  const cases: [string, SpecializationRegionData, ExerciseVariant, string, string | undefined][] = [
    ["the core, 409 Suitcase Carry", fxCore, fxVariants.suitcaseCarry, "3 × 30 sec", "30"],
    ["the core, 247 Side Plank", fxCore, fxVariants.sidePlank, "3 × 30 sec", "30"],
    ["the back, 409 Suitcase Carry", fxBack, fxVariants.suitcaseCarry, "3 × 30 sec", "30"],
    ["the back, 46 Dumbbell Row", fxBack, fxVariants.oneArmRow, "3 × 12", undefined],
    ["the thigh, 173 Bulgarian Split Squat", fxThigh, fxVariants.splitSquat, "3 × 10", undefined],
    ["the thigh, 188 Single-Leg Romanian Deadlift", fxThigh, fxVariants.singleLegRdl, "3 × 10", undefined],
  ];
  for (const [label, region, variant, prescription, hold] of cases) {
    it(label, () => {
      const plan = planned(variant.catalogExerciseId, prescription, region.variants);
      const built = asBuilt(variant, 3, hold);
      expect(onPage(region, plan, "planned")).toEqual(onPage(region, built, "completed"));
      expect(onPage(region, plan, "planned").region).toBe(3);
      goalsEqualRows(region, plan, "planned");
      goalsEqualRows(region, built, "completed");
    });
  }

  for (const catalogId of [409, 46]) {
    it(`the forearm, ${catalogId}, on its real data: 3 for "3 × 12", planned and logged (and, per arm, dormant, still 3 planned on each arm)`, () => {
      const variant = forearmRegionData.variants.find((item) => item.catalogExerciseId === catalogId)!;
      const plan = planned(catalogId, variant.measure === "seconds" ? "3 × 30 sec" : "3 × 12", forearmRegionData.variants);
      const built = asBuilt(variant, 3, variant.measure === "seconds" ? "30" : undefined);
      expect(onPage(forearmRegionData, plan, "planned")).toEqual(onPage(forearmRegionData, built, "completed"));
      expect(onPage(forearmRegionData, plan, "planned").region).toBe(3);
      expect(perSide(forearmRegionData, plan, "planned").map((entry) => entry.region)).toEqual([3, 3]);
      goalsEqualRows(forearmRegionData, plan, "planned");
      goalsEqualRows(forearmRegionData, built, "completed");
    });
  }
});

describe("the forearm, a page paired by the arm, on its real data", () => {
  it("keeps every target equal to its row for a week of one-arm, two-handed and either-way work with and without sides", () => {
    const sets = [
      ...logged(410, [{ side: "right" }, { side: "left" }, {}]),
      ...logged(139, [{}, {}]),
      ...logged(350, [{ side: "both" }, { side: "left" }, {}]),
      ...logged(145, [{}, {}], "40"),
      ...logged(409, [{ side: "left" }, {}], "40"),
    ];
    goalsEqualRows(forearmRegionData, sets, "completed");
    expect(credited(row(summarize(forearmRegionData, sets, "left"), forearmMuscleIds.flexorCarpiUlnaris))).toBeGreaterThan(0);
  });

  it("counts a side recorded on a two-handed exercise on that side alone, as it did when the forearm shipped", () => {
    // 132 Hammer Curl: the logger does not ask the arm there, but an import or a swapped exercise can hold one.
    const sets = logged(132, [{ side: "left" }, { side: "both" }]);
    const [left, right] = PAIRED.map((side) => summarize(forearmRegionData, sets, side));
    expect([left.regionDistinctBouts, right.regionDistinctBouts]).toEqual([2, 1]);
    expect(left.regionBoutRows!.map((item) => [item.side, item.sideSource, item.countedSide, item.recordedSide])).toEqual([
      ["left", "recorded", "left", { limb: "arm", side: "left", source: "recorded" }],
      ["bilateral", "recorded", "left", { limb: "arm", side: "both", source: "recorded" }],
    ]);
    goalsEqualRows(forearmRegionData, sets, "completed");
  });
});

describe("nodeSideFor, rule by rule", () => {
  const arm = (side: "left" | "right" | "both") => ({ armSide: { side, source: "recorded" as const }, legSide: null });
  const leg = (side: "left" | "right" | "both") => ({ armSide: null, legSide: { side, source: "recorded" as const } });
  const none = { armSide: null, legSide: null };
  const backRegion = fxBack.region;
  const thighRegion = fxThigh.region;

  it("1. a midline region: once, midline, whatever was recorded", () => {
    expect(nodeSideFor(fxCore.region, fxVariants.suitcaseCarry, null, arm("left"))).toMatchObject({ sides: ["midline"], branch: "side.midline" });
    expect(nodeSideFor(fxCore.region, fxVariants.sidePlank, null, none)).toMatchObject({ sides: ["midline"], branch: "side.midline", recorded: null });
  });

  it("2. a mapping loaded on both sides: each side, side recorded or not", () => {
    for (const bout of [none, arm("left")]) expect(nodeSideFor(backRegion, fxVariants.oneArmRow, { sideRelation: "both" }, bout)).toMatchObject({ sides: ["left", "right"], branch: "side.arm.relation_both" });
  });

  it("3. two-sided by definition for the region's limb: each side, where no side of that limb was recorded", () => {
    expect(nodeSideFor(thighRegion, fxVariants.backSquat, null, none)).toMatchObject({ sides: ["left", "right"], branch: "side.leg.structural", source: "structural" });
    // A side recorded only for the other limb says nothing about this one.
    expect(nodeSideFor(thighRegion, fxVariants.backSquat, null, arm("left"))).toMatchObject({ sides: ["left", "right"], branch: "side.leg.structural", recorded: null });
  });

  it("4. a side recorded for the region's limb: that side, the other for an opposite mapping, both for Both", () => {
    expect(nodeSideFor(backRegion, fxVariants.oneArmRow, null, arm("right"))).toMatchObject({ sides: ["right"], branch: "side.arm.recorded" });
    expect(nodeSideFor(backRegion, fxVariants.suitcaseCarry, { sideRelation: "opposite" }, arm("left"))).toMatchObject({ sides: ["right"], branch: "side.arm.recorded_opposite" });
    expect(nodeSideFor(backRegion, fxVariants.oneArmRow, null, arm("both"))).toMatchObject({ sides: ["left", "right"], branch: "side.arm.recorded" });
    expect(nodeSideFor(thighRegion, fxVariants.splitSquat, null, { armSide: null, legSide: { side: "left", source: "plan_assumption" } })).toMatchObject({ sides: ["left"], source: "plan_assumption" });
  });

  it("4 before 3: a side recorded on an exercise two-sided for the region's limb counts on that side, as the forearm counted it when it shipped", () => {
    expect(nodeSideFor(thighRegion, fxVariants.backSquat, null, leg("left"))).toMatchObject({ sides: ["left"], branch: "side.leg.recorded", source: "recorded" });
    expect(nodeSideFor(thighRegion, fxVariants.backSquat, null, leg("both"))).toMatchObject({ sides: ["left", "right"], branch: "side.leg.recorded", source: "recorded" });
    expect(nodeSideFor(thighRegion, fxVariants.backSquat, { sideRelation: "opposite" }, leg("left"))).toMatchObject({ sides: ["right"], branch: "side.leg.recorded_opposite" });
  });

  it("5. a limb the exercise does not use gives no side; with no mapping to speak for it, the set's side is simply unknown (rule 6)", () => {
    expect(nodeSideFor(backRegion, fxVariants.legExtension, {}, leg("left"))).toMatchObject({ sides: [], branch: "side.arm.not_applicable", recorded: { limb: "leg", side: "left" } });
    expect(nodeSideFor(backRegion, fxVariants.legExtension, null, leg("left"))).toMatchObject({ sides: [], branch: "side.arm.unknown", recorded: { limb: "leg", side: "left" } });
  });

  it("6. anything else, a side recorded only for the other limb included, is unknown", () => {
    expect(nodeSideFor(thighRegion, fxVariants.singleLegRdl, null, arm("left"))).toMatchObject({ sides: [], branch: "side.leg.unknown", recorded: { limb: "arm", side: "left" } });
    expect(nodeSideFor(backRegion, fxVariants.oneArmRow, null, none)).toMatchObject({ sides: [], branch: "side.arm.unknown", recorded: null });
  });
});

describe("a movement's sheet and its target read one movement one way", () => {
  it("count a one-arm set logged with no arm on each side when one own muscle loads both sides, though another of its muscles keeps it apart", () => {
    // Wave B's kind of data on forearm muscles: one of two direct wrist-flexion mappings of a one-arm wrist curl loads both sides.
    const region: SpecializationRegionData = {
      ...forearmRegionData,
      mappings: forearmRegionData.mappings.map((mapping) => (mapping.variantId === "cat-410" && mapping.nodeId === forearmMuscleIds.flexorCarpiUlnaris ? { ...mapping, sideRelation: "both" as const } : mapping)),
    };
    const sets = logged(410, [{}]);
    for (const side of PAIRED) {
      const summary = summarize(region, sets, side);
      // The flexor carpi ulnaris counts it on this side; the flexor carpi radialis keeps it apart.
      expect(row(summary, forearmMuscleIds.flexorCarpiUlnaris).contributions.map((item) => item.countedSide), side).toEqual([side]);
      expect(row(summary, forearmMuscleIds.flexorCarpiRadialis).contributions.map((item) => item.countedSide), side).toEqual(["unknown"]);
      const ledger = movementLedger(summary, region, "wrist.flexion");
      expect(ledger.totals, side).toMatchObject({ directDynamicBouts: 1, unknownSideBouts: 0 });
      expect(ledger.bouts.map((bout) => [bout.countedSide, bout.categories]), side).toEqual([[side, ["direct_dynamic"]]]);
    }
    goalsEqualRows(region, sets, "completed");
  });
});
