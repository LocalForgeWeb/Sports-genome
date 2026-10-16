import { describe, expect, it } from "vitest";
import type { Contribution, GoalProgress, NodeExposure, SpecializationGoal, SpecializationSummary } from "@shared/specialization/types";
import { forearmRegionData } from "@shared/specialization/regions/forearm";
import { directWorkBouts, overlapsInWindow, exposureSentence, fillForNode, findingsFor, formatSegment, holdTime, ledgerByExercise, selectableNodes, sortForList, targetStep, volumeStep } from "./model";

/**
 * The page's own reading of a summary (design §7): fixed bins, honest blanks, the ledger's
 * grouping and the findings' order. The calculator's numbers are tested where they are made
 * (client/src/lib/specialization/*.test.ts); this is what the page says about them.
 */

const contribution = (overrides: Partial<Contribution>): Contribution => ({
  boutId: "b1", nodeId: "forearm.br", category: "direct_dynamic", parts: [], side: "bilateral", sideSource: "structural",
  catalogExerciseId: 132, exerciseName: "Hammer Curl", matchedBy: "id", sessionId: "s1", sessionLabel: "Pull",
  performedAt: "2026-10-13T17:00:00.000Z", kind: "standard", segments: [{ id: "b1", reps: 12, loadKg: 13.6, holdSeconds: null }],
  reps: 12, holdSeconds: 0, notes: [], sharedWith: [], ...overrides,
});

const node = (overrides: Partial<NodeExposure> = {}): NodeExposure => ({
  nodeId: "forearm.br", directDynamicBouts: 0, contributingDynamicBouts: 0, deliberateHoldBouts: 0, deliberateHoldSeconds: 0,
  incidentalBouts: 0, mixedBouts: 0, unknownBouts: 0, directDynamicReps: 0, contributingDynamicReps: 0,
  unknownSide: { bouts: 0, directDynamicBouts: 0, deliberateHoldBouts: 0, deliberateHoldSeconds: 0 },
  pendingReviewBouts: 0, mappingCoverage: "reviewed", contributions: [], ...overrides,
});

const goal = (overrides: Partial<SpecializationGoal> = {}): SpecializationGoal => ({
  id: "g1", regionId: "forearm", nodeId: "forearm.br", actionId: null, side: "right", metric: "direct_dynamic_bouts", target: 20,
  period: "calendar_week", startsOn: "2026-10-01", endsOn: null, timezone: "UTC", createdAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-01T00:00:00.000Z", ...overrides,
});
const progress = (value: number, target = 20): GoalProgress => ({ goal: goal({ target }), value, fraction: value / target, label: `${value} of your ${target}` });

const summary = (overrides: Partial<SpecializationSummary> = {}): SpecializationSummary => ({
  regionId: "forearm", interval: { kind: "calendar_week", startAt: null, endAtExclusive: null, timezone: "UTC", planWeek: null, label: "This week · 12–18 Oct" },
  side: "right", mode: "completed", mappingVersion: "forearm_mappings_v1", ruleVersion: "specialization_exposure_v1", sourceRevision: "", planRevision: null,
  nodes: forearmRegionData.nodes.map((item) => node({ nodeId: item.id })), regionDistinctBouts: 0, regionUnknownSideBouts: 0,
  regionUnclassified: { bouts: 0, exercises: [] }, goals: [],
  completeness: { boutsConsidered: 0, boutsWithReviewedMapping: 0, boutsPendingReview: 0, boutsRegionOnly: 0, boutsNameMatched: 0, boutsUnknownSide: 0, boutsExcluded: { notCompleted: 0, warmup: 0 } },
  calculatedAt: "2026-10-16T12:00:00.000Z", ...overrides,
});

describe("the map's fixed bins (brief §6: no silent rescaling)", () => {
  it("puts bouts in 0 · 1–2 · 3–5 · 6–9 · 10–14 · 15+", () => {
    expect([0, 1, 2, 3, 5, 6, 9, 10, 14, 15, 40].map(volumeStep)).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
  });
  it("reads target attainment in quarters, with everything at or above the target on the top step", () => {
    expect([0, 0.24, 0.25, 0.5, 0.74, 0.75, 0.99, 1, 2.5].map(targetStep)).toEqual([1, 1, 2, 3, 3, 4, 4, 5, 5]);
  });
});

describe("a muscle's fill", () => {
  it("hatches a muscle without a reviewed mapping, whatever the mode, so unknown never reads as untrained", () => {
    expect(fillForNode(node({ mappingCoverage: "none" }), "volume", [])).toEqual({ kind: "hatch" });
    expect(fillForNode(node({ mappingCoverage: "pending_review" }), "target", [progress(4)])).toEqual({ kind: "hatch" });
    expect(fillForNode(null, "volume", [])).toEqual({ kind: "hatch" });
  });
  it("draws mapped-but-no-work as its own thing, not as the first step", () => {
    expect(fillForNode(node(), "volume", [])).toEqual({ kind: "zero" });
  });
  it("leaves a muscle without a target unpainted in target mode: no fake deficit", () => {
    expect(fillForNode(node(), "target", [])).toEqual({ kind: "none" });
  });
  it("paints the target bin from the furthest-behind target when there are several", () => {
    const behind = { ...progress(2, 10) };
    const ahead = { ...progress(30, 20) };
    expect(fillForNode(node(), "target", [ahead, behind])).toEqual({ kind: "bin", step: 1 });
  });
  it("counts direct work once per bout: direct sets, deliberate holds and mixed bouts with a direct part, never the other arm's unknowns", () => {
    const exposure = node({
      directDynamicBouts: 2,
      contributions: [
        contribution({ boutId: "a" }),
        contribution({ boutId: "b", category: "deliberate_isometric" }),
        contribution({ boutId: "c", category: "mixed", parts: [{ mappingId: "m", actionId: null, relationship: "direct", muscleMode: "dynamic", category: "direct_dynamic" }, { mappingId: "n", actionId: null, relationship: "incidental", muscleMode: "isometric", category: "incidental_isometric" }] }),
        contribution({ boutId: "d", category: "incidental_isometric" }),
        contribution({ boutId: "e", category: "contributing_dynamic" }),
        contribution({ boutId: "f", side: "unknown" }),
      ],
    });
    expect(directWorkBouts(exposure)).toBe(3);
    expect(fillForNode(exposure, "volume", [])).toEqual({ kind: "bin", step: 2 });
  });
});

describe("what the page says about a muscle", () => {
  it("names missing mapping as missing mapping", () => {
    expect(exposureSentence(node({ mappingCoverage: "none" }))).toMatch(/No exercise is mapped/);
  });
  it("lists only the kinds of work that happened, holds in time, and keeps no-arm sets apart", () => {
    const sentence = exposureSentence(node({ directDynamicBouts: 6, contributingDynamicBouts: 2, deliberateHoldBouts: 2, deliberateHoldSeconds: 60, unknownSide: { bouts: 1, directDynamicBouts: 1, deliberateHoldBouts: 0, deliberateHoldSeconds: 0 } }));
    expect(sentence).toBe("6 direct dynamic bouts · 2 other dynamic · 2 deliberate holds, 1 min. 1 set with no arm recorded is kept apart.");
  });
  it("says a hold's time was not recorded rather than 0 s", () => {
    expect(holdTime(0)).toBe("time not recorded");
    expect(holdTime(45)).toBe("45 s");
    expect(holdTime(150)).toBe("2 min 30 s");
  });
  it("writes a segment as it was logged, in the athlete's unit", () => {
    expect(formatSegment({ id: "x", reps: 12, loadKg: 13.6, holdSeconds: null }, "lb")).toMatch(/^30(\.\d)? lb × 12$/);
    expect(formatSegment({ id: "x", reps: null, loadKg: null, holdSeconds: 30 }, "kg")).toBe("30 s");
    expect(formatSegment({ id: "x", reps: 10, loadKg: 0, holdSeconds: null }, "kg")).toBe("× 10");
  });
});

describe("the list and the ledger", () => {
  it("lists muscles, not the compartments that group them", () => {
    const ids = selectableNodes(forearmRegionData).map((item) => item.id);
    expect(ids).not.toContain("forearm.anterior");
    expect(ids).toContain("forearm.fdp");
  });
  it("sorts by direct work, then by all work, then in the region's own order", () => {
    const nodes = forearmRegionData.nodes.filter((item) => ["forearm.br", "forearm.fcr", "forearm.fcu"].includes(item.id));
    const exposures = new Map([
      ["forearm.br", node({ nodeId: "forearm.br", incidentalBouts: 4 })],
      ["forearm.fcr", node({ nodeId: "forearm.fcr", directDynamicBouts: 1, contributions: [contribution({ nodeId: "forearm.fcr" })] })],
      ["forearm.fcu", node({ nodeId: "forearm.fcu" })],
    ]);
    expect(sortForList(nodes, (id) => exposures.get(id) ?? null).map((item) => item.id)).toEqual(["forearm.fcr", "forearm.br", "forearm.fcu"]);
  });
  it("groups the ledger by exercise, busiest first, newest bout first inside each", () => {
    const groups = ledgerByExercise([
      contribution({ boutId: "1", catalogExerciseId: 139, exerciseName: "Wrist Curl", performedAt: "2026-10-12T10:00:00.000Z" }),
      contribution({ boutId: "2", catalogExerciseId: 132, exerciseName: "Hammer Curl", performedAt: "2026-10-13T10:00:00.000Z" }),
      contribution({ boutId: "3", catalogExerciseId: 139, exerciseName: "Wrist Curl", performedAt: "2026-10-15T10:00:00.000Z" }),
    ]);
    expect(groups.map((group) => group.name)).toEqual(["Wrist Curl", "Hammer Curl"]);
    expect(groups[0].rows.map((row) => row.boutId)).toEqual(["3", "1"]);
  });
});

describe("coverage to review", () => {
  it("is empty when there is nothing to say", () => {
    expect(findingsFor({ data: forearmRegionData, summary: summary(), otherSide: null }).filter((item) => item.id !== "no-mapping")).toEqual([]);
  });
  it("leads with a target the athlete set and is behind on, then what the numbers cannot see", () => {
    const findings = findingsFor({
      data: forearmRegionData,
      summary: summary({ goals: [progress(3)], regionUnknownSideBouts: 2, regionUnclassified: { bouts: 2, exercises: [{ name: "Cable Deadlift", catalogExerciseId: 354, bouts: 2 }] } }),
      otherSide: null,
    });
    expect(findings[0].title).toBe("Brachioradialis: 3 of your 20");
    expect(findings[0].detail).toMatch(/The target is yours, not a prescription/);
    expect(findings.map((item) => item.id).slice(1, 3)).toEqual(["unknown-side", "region-only"]);
    expect(findings.find((item) => item.id === "region-only")!.detail).toBe("Cable Deadlift is tagged with the forearms but not mapped to a muscle yet, so it adds to no single muscle.");
  });
  it("says nothing about a target already met", () => {
    expect(findingsFor({ data: forearmRegionData, summary: summary({ goals: [progress(25)] }), otherSide: null }).some((item) => item.id.startsWith("goal:"))).toBe(false);
  });
  it("states a difference between the arms in numbers, without judging it", () => {
    const withWork = (count: number) => summary({ nodes: forearmRegionData.nodes.map((item) => node({ nodeId: item.id, ...(item.id === "forearm.fcr" ? { directDynamicBouts: count, contributions: Array.from({ length: count }, (_, index) => contribution({ boutId: `x${index}`, nodeId: "forearm.fcr" })) } : {}) })) });
    const finding = findingsFor({ data: forearmRegionData, summary: { ...withWork(5), side: "left" }, otherSide: { ...withWork(2), side: "right" } }).find((item) => item.id.startsWith("arms:"));
    expect(finding?.title).toBe("Flexor carpi radialis: 5 direct bouts on the left arm, 2 on the right");
    expect(finding?.detail).not.toMatch(/imbalance|weak|behind/i);
  });
});

describe("the review of repeated exposure", () => {
  it("names a muscle loaded directly by two exercises in one workout, in plain words, and nothing else", () => {
    const fcr = node({ nodeId: "forearm.fcr", contributions: [
      contribution({ boutId: "w1", nodeId: "forearm.fcr", exerciseName: "Wrist Curl", catalogExerciseId: 139, sessionId: "s1", sessionLabel: "Push" }),
      contribution({ boutId: "w2", nodeId: "forearm.fcr", exerciseName: "One-Arm Dumbbell Wrist Curl", catalogExerciseId: 410, sessionId: "s1", sessionLabel: "Push" }),
      contribution({ boutId: "w3", nodeId: "forearm.fcr", exerciseName: "Wrist Curl", catalogExerciseId: 139, sessionId: "s2", sessionLabel: "Pull" }),
      contribution({ boutId: "w4", nodeId: "forearm.fcr", exerciseName: "Hammer Curl", catalogExerciseId: 132, sessionId: "s2", sessionLabel: "Pull", category: "incidental_isometric" }),
    ] });
    const result = overlapsInWindow(summary({ nodes: forearmRegionData.nodes.map((item) => (item.id === "forearm.fcr" ? fcr : node({ nodeId: item.id }))) }), forearmRegionData);
    expect(result.map((item) => [item.sessionLabel, item.nodeShortName, item.exercises])).toEqual([["Push", "FCR", ["One-Arm Dumbbell Wrist Curl", "Wrist Curl"]]]);
  });
});

describe("a target in planned mode", () => {
  it("names the plan week it was read over, not the calendar period", () => {
    const finding = findingsFor({ data: forearmRegionData, summary: summary({ mode: "planned", interval: { kind: "plan_week", startAt: null, endAtExclusive: null, timezone: "UTC", planWeek: 2, label: "Plan Week 2, as written" }, goals: [progress(3)] }), otherSide: null })[0];
    expect(finding.detail).toMatch(/right arm, Plan Week 2, as written\./);
    expect(finding.detail).not.toMatch(/calendar week/);
  });
});
