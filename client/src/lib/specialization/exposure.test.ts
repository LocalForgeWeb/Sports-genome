import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { getSpecializationSummary, indexRegion } from "@shared/specialization/exposure";
import { externalContributorIds as ext, forearmActionIds as a, forearmGroupIds as g, forearmMuscleIds as m } from "@shared/specialization/regions/forearm/ids";
import { categoryFor } from "@shared/specialization/rules";
import { calendarWeekInterval, customInterval, planWeekInterval } from "@shared/specialization/time";
import type { ExposureBout, SpecializationGoal, SpecializationRegionData, SpecializationSummary, SummaryRequest } from "@shared/specialization/types";
import { forearmRegionData } from "@shared/specialization/regions/forearm";
import { syntheticForearm } from "./__fixtures__/syntheticForearm";
import { catalogMusclesLookup } from "./useSpecializationSummary";

/**
 * The calculator on plain bouts (design §3, rules.ts `specialization_exposure_v1`), against a
 * synthetic forearm-shaped region whose mappings are test assumptions (see the fixture).
 */

const NOW = "2026-10-16T12:00:00.000Z";
const WEEK = calendarWeekInterval(NOW, "Europe/London"); // 12–18 Oct
const WED = "2026-10-14T18:00:00.000Z";
const names = new Map(exercises.map((exercise) => [exercise.id, exercise.name] as const));
const catalogMusclesFor = catalogMusclesLookup(exercises);

let sequence = 0;
function bout(catalogExerciseId: number, over: Partial<ExposureBout> = {}): ExposureBout {
  const id = over.id ?? `b${String(++sequence).padStart(3, "0")}`;
  return {
    id,
    mode: "completed",
    performedAt: WED,
    sessionId: "s1",
    sessionLabel: "Week 1 · Day 01 · Pull",
    planWeek: null,
    dayKey: null,
    exerciseEntryId: "e1",
    catalogExerciseId,
    exerciseName: names.get(catalogExerciseId) ?? "Unknown",
    matchedBy: "id",
    // Both arms recorded, unless a test says otherwise.
    armSide: { side: "both", source: "recorded" },
    legSide: null,
    straps: "unknown",
    warmup: false,
    effort: null,
    kind: "standard",
    segments: [{ id, reps: 12, loadKg: 20, holdSeconds: null }],
    ...over,
  };
}
const times = (count: number, make: () => ExposureBout) => Array.from({ length: count }, make);
/** A bout's arm as the athlete recorded it; `noArm` when none was. */
const arm = (side: "left" | "right" | "both"): Partial<ExposureBout> => ({ armSide: { side, source: "recorded" } });
const noArm: Partial<ExposureBout> = { armSide: null };
const hold = (catalogExerciseId: number, seconds: number | null, over: Partial<ExposureBout> = {}) => {
  const id = over.id ?? `h${String(++sequence).padStart(3, "0")}`;
  return bout(catalogExerciseId, { id, segments: [{ id, reps: null, loadKg: 32, holdSeconds: seconds }], ...over });
};

function summarize(bouts: readonly ExposureBout[], over: Partial<SummaryRequest> = {}): SpecializationSummary {
  return getSpecializationSummary({ region: syntheticForearm, bouts, interval: WEEK, side: "left", mode: "completed", goals: [], catalogMusclesFor, sourceRevision: "src-test", planRevision: null, now: NOW, ...over });
}
const row = (summary: SpecializationSummary, nodeId: string) => summary.nodes.find((node) => node.nodeId === nodeId)!;
const counts = (summary: SpecializationSummary, nodeId: string) => {
  const node = row(summary, nodeId);
  return { direct: node.directDynamicBouts, other: node.contributingDynamicBouts, holds: node.deliberateHoldBouts, seconds: node.deliberateHoldSeconds, incidental: node.incidentalBouts, mixed: node.mixedBouts, unknown: node.unknownBouts };
};
const zero = { direct: 0, other: 0, holds: 0, seconds: 0, incidental: 0, mixed: 0, unknown: 0 };

const goal = (over: Partial<SpecializationGoal>): SpecializationGoal => ({
  id: "g",
  regionId: "forearm",
  nodeId: m.flexorCarpiRadialis,
  actionId: null,
  side: "left",
  metric: "direct_dynamic_bouts",
  target: 20,
  period: "calendar_week",
  startsOn: "2026-10-01",
  endsOn: null,
  timezone: "Europe/London",
  createdAt: "",
  updatedAt: "",
  ...over,
});

describe("the published category table (rules.ts categoryFor)", () => {
  it("keeps deliberate holds, incidental holding and dynamic work apart", () => {
    expect(categoryFor("direct", "dynamic", false)).toBe("direct_dynamic");
    expect(categoryFor("contributing", "dynamic", false)).toBe("contributing_dynamic");
    expect(categoryFor("direct", "isometric", true)).toBe("deliberate_isometric");
    expect(categoryFor("direct", "isometric", false)).toBe("incidental_isometric");
    expect(categoryFor("stabilizer", "isometric", true)).toBe("incidental_isometric");
    expect(categoryFor("incidental", "isometric", false)).toBe("incidental_isometric");
    expect(categoryFor("stabilizer", "dynamic", false)).toBe("unknown");
    expect(categoryFor("direct", "mixed", false)).toBe("mixed");
    expect(categoryFor("unknown", "dynamic", false)).toBe("unknown");
    expect(categoryFor("direct", "unknown", true)).toBe("unknown");
  });
});

describe("counting bouts per node", () => {
  it("counts each bout once per node in its category, with reps kept beside it", () => {
    const summary = summarize(times(2, () => bout(139)));
    expect(counts(summary, m.flexorCarpiRadialis)).toEqual({ ...zero, direct: 2 });
    expect(row(summary, m.flexorCarpiRadialis).directDynamicReps).toBe(24);
    expect(counts(summary, m.palmarisLongus)).toEqual({ ...zero, other: 2 });
    expect(row(summary, m.palmarisLongus).contributingDynamicReps).toBe(24);
    expect(counts(summary, m.flexorDigitorumSuperficialis)).toEqual({ ...zero, incidental: 2 });
    expect(summary.regionDistinctBouts).toBe(2);
  });

  it("never reads an older generation of mappings beside the current one", () => {
    const summary = summarize([bout(139)]);
    expect(row(summary, m.flexorCarpiRadialis).directDynamicBouts).toBe(1);
    expect(row(summary, m.flexorCarpiRadialis).contributions[0].parts.map((part) => part.mappingId)).toEqual(["sm-139-fcr-wrist.flexion"]);
  });

  it("gives one bout that loads a node two ways one count, under mixed, with both parts listed", () => {
    const summary = summarize([bout(141)]);
    expect(counts(summary, m.flexorCarpiRadialis)).toEqual({ ...zero, mixed: 1 });
    const [contribution] = row(summary, m.flexorCarpiRadialis).contributions;
    expect(contribution.category).toBe("mixed");
    // Parts are listed in mapping-id order.
    expect(contribution.parts.map((part) => [part.actionId, part.category])).toEqual([
      [a.wristFlexion, "direct_dynamic"],
      [a.radialDeviation, "incidental_isometric"],
    ]);
    expect(summary.regionDistinctBouts).toBe(1);
  });

  it("lets one bout show on several nodes while the region counts it once", () => {
    const summary = summarize([bout(139)]);
    expect(row(summary, m.flexorCarpiRadialis).directDynamicBouts).toBe(1);
    expect(row(summary, m.flexorCarpiUlnaris).directDynamicBouts).toBe(1);
    expect(summary.regionDistinctBouts).toBe(1);
  });

  it("names the nodes a shared allocation is shared with, grouping shared work of the same kind", () => {
    const summary = summarize([bout(140), hold(145, 30)]);
    // Reverse wrist curl: the extensors' shared dynamic work and the fingers' shared holding stay apart.
    expect(row(summary, m.extensorCarpiRadialisLongus).contributions[0].sharedWith).toEqual([m.extensorCarpiRadialisBrevis]);
    expect(row(summary, m.extensorCarpiUlnaris).contributions[0].sharedWith).toEqual([]);
    expect(row(summary, m.flexorDigitorumSuperficialis).contributions.find((item) => item.catalogExerciseId === 140)!.sharedWith).toEqual([m.flexorDigitorumProfundus]);
    // Farmer hold: different finger actions, one shared grip.
    expect(row(summary, m.flexorDigitorumSuperficialis).contributions.find((item) => item.catalogExerciseId === 145)!.sharedWith).toEqual([m.flexorDigitorumProfundus]);
  });

  it("credits external contributors without counting them as region work", () => {
    const region: SpecializationRegionData = {
      ...syntheticForearm,
      variants: [...syntheticForearm.variants, { ...syntheticForearm.variants[0], id: "cat-123", catalogExerciseId: 123, catalogName: "Dumbbell Curl" }],
      mappings: [...syntheticForearm.mappings, { ...syntheticForearm.mappings[0], id: "curl-biceps", variantId: "cat-123", nodeId: ext.biceps, actionId: a.elbowFlexion }],
    };
    // A bout is classified by the region's own muscles (10-multi-region.md §4.2). The curl maps
    // none of them, and the catalog tags it with the forearms: region-only work, whose credit to
    // the external muscle still shows on that muscle's row.
    const summary = summarize([bout(123)], { region });
    expect(row(summary, ext.biceps).directDynamicBouts).toBe(1);
    expect(summary.regionDistinctBouts).toBe(0);
    expect(summary.completeness).toMatchObject({ boutsConsidered: 1, boutsRegionOnly: 1, boutsWithReviewedMapping: 0 });
    // Not tagged with the region either: external-only, on the external row and in no total.
    const untagged = summarize([bout(123)], { region, catalogMusclesFor: () => null });
    expect(row(untagged, ext.biceps).directDynamicBouts).toBe(1);
    expect(untagged.regionDistinctBouts).toBe(0);
    expect(untagged.regionUnclassified.bouts).toBe(0);
    expect(untagged.completeness).toMatchObject({ boutsConsidered: 0, boutsRegionOnly: 0, boutsWithReviewedMapping: 0, boutsPendingReview: 0 });
  });
});

describe("what is not node credit", () => {
  it("keeps a generic compartment mapping on the compartment: no fan-out to its muscles", () => {
    const summary = summarize([bout(80)]);
    expect(counts(summary, g.anterior)).toEqual({ ...zero, incidental: 1 });
    for (const nodeId of [m.flexorCarpiRadialis, m.flexorCarpiUlnaris, m.palmarisLongus, m.flexorDigitorumSuperficialis, m.flexorDigitorumProfundus]) expect(counts(summary, nodeId)).toEqual(zero);
  });

  it("keeps work tagged with the region but not mapped at region level only", () => {
    const summary = summarize(times(2, () => bout(144)));
    expect(summary.regionUnclassified).toEqual({ bouts: 2, exercises: [{ name: "Towel Dead Hang", catalogExerciseId: 144, bouts: 2 }] });
    expect(summary.nodes.every((node) => node.contributions.length === 0)).toBe(true);
    expect(summary.regionDistinctBouts).toBe(0);
    expect(summary.completeness).toMatchObject({ boutsConsidered: 2, boutsRegionOnly: 2, boutsWithReviewedMapping: 0 });
  });

  it("ignores work that has nothing to do with the region", () => {
    expect(summarize([bout(1)]).completeness.boutsConsidered).toBe(0);
  });

  it("shows draft mappings as pending review and never counts them", () => {
    const summary = summarize([hold(142, 20)]);
    const fpl = row(summary, m.flexorPollicisLongus);
    expect(counts(summary, m.flexorPollicisLongus)).toEqual(zero);
    expect(fpl.pendingReviewBouts).toBe(1);
    expect(fpl.notCounted!.map((item) => item.notes)).toEqual([["Mapping pending review"]]);
    expect(summary.completeness.boutsPendingReview).toBe(1);
    expect(summary.regionDistinctBouts).toBe(0);
  });

  it("reports coverage from the mappings, independent of the window: unknown is never zero", () => {
    const summary = summarize([]);
    expect(row(summary, m.flexorCarpiRadialis).mappingCoverage).toBe("reviewed");
    expect(row(summary, m.flexorPollicisLongus).mappingCoverage).toBe("pending_review");
    expect(row(summary, m.extensorIndicis).mappingCoverage).toBe("none");
    expect(indexRegion(syntheticForearm).coverage.get(m.extensorIndicis)).toBe("none");
  });

  it("excludes warm-ups and unfinished or skipped sets, and says how many", () => {
    const summary = summarize([bout(139, { warmup: true }), bout(139, { excluded: "not_completed" }), bout(139)]);
    expect(row(summary, m.flexorCarpiRadialis).directDynamicBouts).toBe(1);
    expect(summary.completeness.boutsExcluded).toEqual({ notCompleted: 1, warmup: 1 });
    expect(summary.completeness.boutsConsidered).toBe(1);
  });
});

describe("sides", () => {
  it("counts a two-handed bout once for each arm and a one-arm bout for that arm only", () => {
    const bouts = [...times(3, () => bout(139, arm("both"))), ...times(2, () => bout(139, arm("left")))];
    expect(row(summarize(bouts, { side: "left" }), m.flexorCarpiRadialis).directDynamicBouts).toBe(5);
    expect(row(summarize(bouts, { side: "right" }), m.flexorCarpiRadialis).directDynamicBouts).toBe(3);
    expect(summarize(bouts, { side: "right" }).regionDistinctBouts).toBe(3);
  });

  it("keeps unknown-side bouts in their own bucket, never on either arm", () => {
    const bouts = times(3, () => bout(139, noArm));
    for (const side of ["left", "right"] as const) {
      const summary = summarize(bouts, { side });
      const fcr = row(summary, m.flexorCarpiRadialis);
      expect(fcr.directDynamicBouts).toBe(0);
      expect(fcr.unknownSide).toEqual({ bouts: 3, directDynamicBouts: 3, deliberateHoldBouts: 0, deliberateHoldSeconds: 0, pendingReviewBouts: 0 });
      expect(fcr.contributions.every((item) => item.side === "unknown" && item.countedSide === "unknown" && item.recordedSide === null)).toBe(true);
      expect(summary.regionDistinctBouts).toBe(0);
      expect(summary.regionUnknownSideBouts).toBe(3);
      expect(summary.completeness.boutsUnknownSide).toBe(3);
    }
  });

  it("keeps unknown-side work a draft mapping matched off both arms' under-review count, in its own bucket", () => {
    const bouts = times(2, () => hold(142, 40, noArm));
    for (const side of ["left", "right"] as const) {
      const summary = summarize(bouts, { side });
      const fpl = row(summary, m.flexorPollicisLongus);
      expect([fpl.pendingReviewBouts, fpl.unknownSide.pendingReviewBouts, fpl.unknownSide.bouts], side).toEqual([0, 2, 0]);
      expect(fpl.notCounted!.map((item) => item.side), side).toEqual(["unknown", "unknown"]);
      // The whole-window breakdown still lists them, as the sets with no arm they are.
      expect(summary.completeness).toMatchObject({ boutsPendingReview: 2, boutsUnknownSide: 2 });
    }
  });

  it("real forearm data: a one-arm carry with no arm recorded is under review for neither arm, and its credited grip is kept apart", () => {
    // Suitcase Carry (409): one-handed, timed; FDS and FDP reviewed, FPL still a draft mapping.
    const carries = times(2, () => hold(409, 40, { ...noArm, straps: "no" }));
    for (const side of ["left", "right"] as const) {
      const summary = summarize(carries, { region: forearmRegionData, side });
      const fpl = row(summary, m.flexorPollicisLongus);
      expect([fpl.pendingReviewBouts, fpl.unknownSide.pendingReviewBouts], side).toEqual([0, 2]);
      expect(fpl.notCounted!.map((item) => [item.side, item.notes.includes("Mapping pending review")]), side).toEqual([["unknown", true], ["unknown", true]]);
      const fds = row(summary, m.flexorDigitorumSuperficialis);
      expect([fds.deliberateHoldBouts, fds.unknownSide.deliberateHoldBouts, fds.unknownSide.deliberateHoldSeconds], side).toEqual([0, 2, 80]);
      expect(summary.nodes.reduce((total, node) => total + node.pendingReviewBouts, 0), side).toBe(0);
    }
    // Logged on the right, the same carries are the right arm's under-review work and not the left's.
    const right = times(2, () => hold(409, 40, { ...arm("right"), straps: "no" }));
    expect(row(summarize(right, { region: forearmRegionData, side: "right" }), m.flexorPollicisLongus).pendingReviewBouts).toBe(2);
    expect(row(summarize(right, { region: forearmRegionData, side: "left" }), m.flexorPollicisLongus).pendingReviewBouts).toBe(0);
  });
});

describe("holds and straps", () => {
  it("sums hold seconds over segments and never turns them into sets or reps", () => {
    const summary = summarize([...times(3, () => hold(145, 30)), hold(145, null)]);
    expect(counts(summary, m.flexorDigitorumSuperficialis)).toEqual({ ...zero, holds: 4, seconds: 90 });
    expect(row(summary, m.flexorDigitorumSuperficialis).directDynamicReps).toBe(0);
  });

  it("withholds bare-hand grip credit from a strapped set and lists it as not counted", () => {
    const summary = summarize([hold(143, 40, { straps: "yes" })]);
    const fds = row(summary, m.flexorDigitorumSuperficialis);
    expect(counts(summary, m.flexorDigitorumSuperficialis)).toEqual(zero);
    expect(fds.notCounted!.map((item) => item.notes)).toEqual([["Strapped: grip not counted"]]);
    expect(summary.regionDistinctBouts).toBe(0);
  });

  it("keeps the credit when straps were not recorded, and says so; says nothing when they were not used", () => {
    const unknown = summarize([hold(143, 40, { straps: "unknown" })]);
    expect(row(unknown, m.flexorDigitorumSuperficialis).deliberateHoldBouts).toBe(1);
    expect(row(unknown, m.flexorDigitorumSuperficialis).contributions[0].notes).toEqual(["Straps not recorded"]);
    const bare = summarize([hold(143, 40, { straps: "no" })]);
    expect(row(bare, m.flexorDigitorumSuperficialis).contributions[0].notes).toEqual([]);
  });

  it("notes a name match in the ledger, and no side: a planned set assumed on both sides says nothing of it (both sides as one)", () => {
    expect(row(summarize([bout(139, { matchedBy: "name" })]), m.flexorCarpiRadialis).contributions[0].notes).toEqual(["Matched by name"]);
    const planned = summarize([bout(139, { mode: "planned", performedAt: null, planWeek: 1, armSide: { side: "both", source: "plan_assumption" } })], { mode: "planned", interval: planWeekInterval(1) });
    const [contribution] = row(planned, m.flexorCarpiRadialis).contributions;
    expect(contribution.sideSource).toBe("plan_assumption");
    expect(contribution.notes).toEqual([]);
  });
});

describe("windows, modes and determinism", () => {
  it("reads completed and planned work separately", () => {
    const bouts = [bout(139), bout(139, { mode: "planned", performedAt: null, planWeek: 1 }), bout(139, { mode: "planned", performedAt: null, planWeek: 1 })];
    expect(row(summarize(bouts), m.flexorCarpiRadialis).directDynamicBouts).toBe(1);
    expect(row(summarize(bouts, { mode: "planned", interval: planWeekInterval(1) }), m.flexorCarpiRadialis).directDynamicBouts).toBe(2);
    expect(row(summarize(bouts, { mode: "planned", interval: planWeekInterval(2) }), m.flexorCarpiRadialis).directDynamicBouts).toBe(0);
  });

  it("includes the window's first instant and excludes its end", () => {
    expect(summarize([bout(139, { performedAt: WEEK.startAt })]).regionDistinctBouts).toBe(1);
    expect(summarize([bout(139, { performedAt: WEEK.endAtExclusive })]).regionDistinctBouts).toBe(0);
  });

  it("reads a duplicated record once", () => {
    const one = bout(139, { id: "same" });
    expect(row(summarize([one, { ...one }]), m.flexorCarpiRadialis).directDynamicBouts).toBe(1);
  });

  it("gives the same answer whatever order the bouts arrive in, oldest contribution first", () => {
    const bouts = [bout(139, { id: "s/e/10", performedAt: "2026-10-15T10:00:00.000Z" }), bout(139, { id: "s/e/2", performedAt: "2026-10-15T10:00:00.000Z" }), bout(139, { id: "s/e/1", performedAt: "2026-10-13T10:00:00.000Z" })];
    const forward = summarize(bouts);
    expect(summarize([...bouts].reverse())).toEqual(forward);
    expect(row(forward, m.flexorCarpiRadialis).contributions.map((item) => item.boutId)).toEqual(["s/e/1", "s/e/2", "s/e/10"]);
  });

  it("carries its versions, revisions and window, and is stamped with the request's now", () => {
    const summary = summarize([], { planRevision: "plan-abc" });
    expect(summary).toMatchObject({ regionId: "forearm", side: "left", mode: "completed", mappingVersion: "synthetic_forearm_v1", ruleVersion: "specialization_exposure_v2", sourceRevision: "src-test", planRevision: "plan-abc", calculatedAt: NOW, interval: WEEK });
    expect(summary.nodes.map((node) => node.nodeId)).toEqual(syntheticForearm.nodes.map((node) => node.id));
  });
});

describe("goal progress", () => {
  const lastWeek = customInterval("2026-10-05", "2026-10-11", "Europe/London");
  const lastWeekBout = () => bout(139, { performedAt: "2026-10-07T10:00:00.000Z" });

  it("reads each goal over its own period, not the window on screen", () => {
    const bouts = [...times(2, () => bout(139)), ...times(3, lastWeekBout)];
    const summary = summarize(bouts, { interval: lastWeek, goals: [goal({ target: 20 })] });
    expect(row(summary, m.flexorCarpiRadialis).directDynamicBouts).toBe(3);
    expect(summary.goals).toHaveLength(1);
    expect(summary.goals[0]).toMatchObject({ value: 2, fraction: 0.1, label: "2 of your 20" });
  });

  it("shows only active goals of this region and arm, and no goal at all when none is set", () => {
    const goals = [goal({ id: "right", side: "right" }), goal({ id: "future", startsOn: "2026-11-01" }), goal({ id: "other", regionId: "deltoid" }), goal({ id: "ended", endsOn: "2026-10-01" })];
    expect(summarize([bout(139)], { goals }).goals).toEqual([]);
    expect(summarize([bout(139)]).goals).toEqual([]);
  });

  it("counts a movement goal by distinct bouts, not by the muscles that share them", () => {
    const summary = summarize([...times(2, () => bout(140)), bout(135)], { goals: [goal({ nodeId: null, actionId: a.wristExtension, target: 10 })] });
    // Two reverse wrist curls load three extensors each: 2 bouts, not 6. A reverse curl only steadies the wrist.
    expect(summary.goals[0]).toMatchObject({ value: 2, label: "2 of your 10" });
  });

  it("sums hold seconds for a seconds goal and leaves unknown-side work out", () => {
    const bouts = [...times(3, () => hold(145, 30)), hold(145, 30, noArm)];
    const summary = summarize(bouts, { goals: [goal({ nodeId: m.flexorDigitorumSuperficialis, metric: "deliberate_hold_seconds", target: 120 })] });
    expect(summary.goals[0]).toMatchObject({ value: 90, fraction: 0.75, label: "90 of your 120 seconds" });
  });

  it("reads the plan week for a planned summary, which has no dates", () => {
    const planned = times(4, () => bout(139, { mode: "planned", performedAt: null, planWeek: 2 }));
    const summary = summarize(planned, { mode: "planned", interval: planWeekInterval(2), goals: [goal({ target: 20 })] });
    expect(summary.goals[0]).toMatchObject({ value: 4, label: "4 of your 20" });
  });
});
