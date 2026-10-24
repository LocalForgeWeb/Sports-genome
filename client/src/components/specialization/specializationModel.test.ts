import { describe, expect, it } from "vitest";
import type { Contribution, GoalProgress, NodeExposure, RegionBoutRow, SpecializationGoal, SpecializationSummary } from "@shared/specialization/types";
import { forearmRegionData } from "@shared/specialization/regions/forearm";
import { directWorkBouts, evidenceBasisLabels, overlapsInWindow, exposureSentence, fillForNode, findingsFor, formatSegment, holdTime, holdTimeOf, latestSessionDayLabel, ledgerByExercise, mappingsBehind, movementFocusNodeId, movementLedger, regionBoutRows, selectableNodes, sortForList, targetStep, volumeStep } from "./model";

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
        // Kept apart for want of an arm: wave 0 says so in the row's counted side.
        contribution({ boutId: "f", side: "unknown", countedSide: "unknown" }),
      ],
      // A one-arm summary keeps the set with no arm apart, and says so here.
      unknownSide: { bouts: 1, directDynamicBouts: 1, deliberateHoldBouts: 0, deliberateHoldSeconds: 0, pendingReviewBouts: 0 },
    });
    expect(directWorkBouts(exposure)).toBe(3);
    expect(fillForNode(exposure, "volume", [])).toEqual({ kind: "bin", step: 2 });
  });

  it("counts a set with no arm recorded when the summary is for both arms (20 Oct 2026)", () => {
    const exposure = node({
      directDynamicBouts: 2,
      contributions: [contribution({ boutId: "a" }), contribution({ boutId: "f", side: "unknown" })],
      unknownSide: { bouts: 0, directDynamicBouts: 0, deliberateHoldBouts: 0, deliberateHoldSeconds: 0, pendingReviewBouts: 0 },
    });
    expect(directWorkBouts(exposure)).toBe(2);
  });
});

describe("what the page says about a muscle", () => {
  it("names missing mapping as missing mapping", () => {
    expect(exposureSentence(node({ mappingCoverage: "none" }), "grip")).toMatch(/No exercise is mapped/);
  });
  it("lists only the kinds of work that happened, holds in time, and names no arm (both arms as one, 20 Oct 2026)", () => {
    const sentence = exposureSentence(node({ directDynamicBouts: 6, contributingDynamicBouts: 2, deliberateHoldBouts: 2, deliberateHoldSeconds: 60 }), "grip");
    expect(sentence).toBe("6 direct dynamic bouts · 2 other dynamic · 2 deliberate holds, 1 min.");
  });
  it("names sets under review once, with no arm kept apart", () => {
    // The page's summary counts both arms as one, so it keeps nothing apart for want of an arm.
    const sentence = exposureSentence(node({ pendingReviewBouts: 3 }), "grip");
    expect(sentence).toBe("No work for it in this window. 3 sets matched a mapping still under review and are not counted.");
  });
  it("names incidental work in the region's own word", () => {
    // The forearm's words as shipped (17 Oct), unchanged in wave 0 (10-multi-region.md §9.1).
    expect(exposureSentence(node({ incidentalBouts: 4 }), "grip")).toBe("4 incidental grip or steadying.");
    expect(exposureSentence(node({ incidentalBouts: 4 }), "bracing")).toBe("4 incidental bracing or steadying.");
    // A region whose word is steadying says it once.
    expect(exposureSentence(node({ incidentalBouts: 4 }), "steadying")).toBe("4 incidental steadying.");
  });
  it("says a hold's time was not recorded rather than 0 s", () => {
    expect(holdTime(0)).toBe("time not recorded");
    expect(holdTime(45)).toBe("45 s");
    expect(holdTime(150)).toBe("2 min 30 s");
  });
  it("says holds with no time recorded apart from the time the others recorded (11-forearm-research-and-stack.md §7.1)", () => {
    const hold = (boutId: string, seconds: number | null) => ({ boutId, nodeId: "n", category: "deliberate_isometric", parts: [], countedSide: "both", holdSeconds: seconds ?? 0, segments: [{ id: `${boutId}-1`, reps: null, loadKg: null, holdSeconds: seconds }] } as unknown as NodeExposure["contributions"][number]);
    const holding = (contributions: NodeExposure["contributions"]) => node({ deliberateHoldBouts: contributions.length, deliberateHoldSeconds: contributions.reduce((total, item) => total + item.holdSeconds, 0), contributions });
    expect(holdTimeOf(holding([hold("a", 45), hold("b", null)]))).toBe("45 s recorded; 1 hold with no time recorded");
    expect(holdTimeOf(holding([hold("a", 30), hold("b", null), hold("c", null)]))).toBe("30 s recorded; 2 holds with no time recorded");
    // Every hold timed: the time; none timed: not recorded, never 0 s.
    expect(holdTimeOf(holding([hold("a", 45), hold("b", 30)]))).toBe("1 min 15 s");
    expect(holdTimeOf(holding([hold("a", null)]))).toBe("time not recorded");
    expect(exposureSentence(holding([hold("a", 45), hold("b", null)]), "grip")).toBe("2 deliberate holds, 45 s recorded; 1 hold with no time recorded.");
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
    expect(findingsFor({ data: forearmRegionData, summary: summary() }).filter((item) => item.id !== "no-mapping")).toEqual([]);
  });
  it("leads with a target the athlete set and is behind on, then what the numbers cannot see", () => {
    const findings = findingsFor({
      data: forearmRegionData,
      summary: summary({ goals: [progress(3)], regionUnclassified: { bouts: 2, exercises: [{ name: "Cable Deadlift", catalogExerciseId: 354, bouts: 2 }] } }),
    });
    expect(findings[0].title).toBe("Brachioradialis: 3 of your 20");
    expect(findings[0].detail).toMatch(/The target is yours, not a prescription/);
    expect(findings[1].id).toBe("region-only");
    expect(findings.find((item) => item.id === "region-only")!.detail).toBe("Cable Deadlift is tagged with the forearms but not mapped to a muscle yet, so it adds to no single muscle.");
  });
  it("counts sets under review once, and names no arm", () => {
    const nodes = forearmRegionData.nodes.map((item) => node({ nodeId: item.id, ...(item.id === "forearm.fpl" ? { pendingReviewBouts: 3, mappingCoverage: "pending_review" as const } : {}) }));
    const finding = findingsFor({ data: forearmRegionData, summary: summary({ nodes }) }).find((item) => item.id === "pending-review")!;
    expect(finding.detail).toBe("3 sets in this window matched a mapping that is not reviewed yet. They are shown in the ledger and not counted.");
  });
  it("says nothing about a target already met", () => {
    expect(findingsFor({ data: forearmRegionData, summary: summary({ goals: [progress(25)] }) }).some((item) => item.id.startsWith("goal:"))).toBe(false);
  });
  it("states no difference between the arms: both arms are one count (owner, 20 Oct 2026)", () => {
    const withWork = summary({ side: "both", nodes: forearmRegionData.nodes.map((item) => node({ nodeId: item.id, ...(item.id === "forearm.fcr" ? { directDynamicBouts: 5, contributions: Array.from({ length: 5 }, (_, index) => contribution({ boutId: `x${index}`, nodeId: "forearm.fcr", side: index < 3 ? "left" : "right" })) } : {}) })) });
    const findings = findingsFor({ data: forearmRegionData, summary: withWork });
    expect(findings.some((item) => item.id.startsWith("sides:") || item.id === "unknown-side")).toBe(false);
    expect(findings.map((item) => `${item.title} ${item.detail}`).join(" ")).not.toMatch(/\b(left|right|arms?)\b/i);
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

describe("totals that open their sets (brief §1: every total opens the set records)", () => {
  const movementGoal = (value: number): GoalProgress => {
    const target = goal({ id: "mv", nodeId: null, actionId: "wrist.extension", target: 10 });
    return { goal: target, value, fraction: value / 10, label: `${value} of your 10` };
  };
  it("gives a movement target behind its own action: the movement's sets and exercises", () => {
    const finding = findingsFor({ data: forearmRegionData, summary: summary({ goals: [movementGoal(3)] }) })[0];
    expect(finding.title).toBe("Wrist extension: 3 of your 10");
    expect(finding.action).toEqual({ kind: "movement", actionId: "wrist.extension" });
    expect(finding.actionLabel).toBe("See its sets and exercises");
  });
  it("opens the work mapped to no muscle, not only the method; no list is kept of sets with no arm", () => {
    const findings = findingsFor({ data: forearmRegionData, summary: summary({ regionUnclassified: { bouts: 1, exercises: [{ name: "Dumbbell Pullover", catalogExerciseId: 24, bouts: 1 }] } }) });
    expect(findings.find((item) => item.id === "unknown-side")).toBeUndefined();
    expect(findings.find((item) => item.id === "region-only")).toMatchObject({ action: { kind: "bouts", list: "region-only" }, actionLabel: "See these sets" });
  });
  it("hands back the rows behind each region total, and none for a summary made without them", () => {
    const row: RegionBoutRow = { boutId: "r1", side: "bilateral", sideSource: "recorded", catalogExerciseId: 24, exerciseName: "Dumbbell Pullover", matchedBy: "id", sessionId: "s1", sessionLabel: "Pull", performedAt: "2026-10-13T17:00:00.000Z", kind: "standard", segments: [] };
    const withRows = summary({ regionBoutRows: [{ ...row, boutId: "a" }], regionUnclassifiedRows: [row] });
    expect(regionBoutRows(withRows, "region").map((item) => item.boutId)).toEqual(["a"]);
    expect(regionBoutRows(withRows, "region-only").map((item) => item.boutId)).toEqual(["r1"]);
    expect(regionBoutRows(summary(), "region")).toEqual([]);
    // The ledger groups any row that names its exercise, region rows included.
    expect(ledgerByExercise([row, { ...row, boutId: "r2" }]).map((group) => [group.name, group.rows.length])).toEqual([["Dumbbell Pullover", 2]]);
  });
});

describe("a movement's own ledger (brief §7: targets attach to a muscle or an action)", () => {
  const part = (mappingId: string, actionId: string | null, category: Contribution["category"]): Contribution["parts"][number] => ({ mappingId, actionId, relationship: "direct", muscleMode: "dynamic", category });
  const withNodes = (rows: Record<string, Contribution[]>) => summary({ nodes: forearmRegionData.nodes.map((item) => node({ nodeId: item.id, contributions: rows[item.id] ?? [] })) });
  it("lists each bout once however many muscles moved it, with the muscles and the kinds of work", () => {
    const result = movementLedger(withNodes({
      "forearm.ecrl": [contribution({ boutId: "rw1", nodeId: "forearm.ecrl", exerciseName: "Reverse Wrist Curl", catalogExerciseId: 140, parts: [part("m-ecrl", "wrist.extension", "direct_dynamic")] })],
      "forearm.ecu": [contribution({ boutId: "rw1", nodeId: "forearm.ecu", exerciseName: "Reverse Wrist Curl", catalogExerciseId: 140, parts: [part("m-ecu", "wrist.extension", "direct_dynamic")] })],
      "forearm.ed": [contribution({ boutId: "rw1", nodeId: "forearm.ed", exerciseName: "Reverse Wrist Curl", catalogExerciseId: 140, parts: [part("m-ed", "wrist.extension", "contributing_dynamic")] })],
      "forearm.br": [contribution({ boutId: "rc1", nodeId: "forearm.br", exerciseName: "Reverse Curl", catalogExerciseId: 135, parts: [part("m-br", "elbow.flexion", "direct_dynamic"), part("m-br2", "wrist.extension", "incidental_isometric")] })],
      // Kept apart for want of an arm, as only a per-arm summary (dormant) keeps one: wave 0 says so in the row's counted side.
      "forearm.fcr": [contribution({ boutId: "x1", nodeId: "forearm.fcr", side: "unknown", countedSide: "unknown", parts: [part("m-fcr", "wrist.extension", "direct_dynamic")] })],
      "forearm.fcu": [contribution({ boutId: "w1", nodeId: "forearm.fcu", parts: [part("m-fcu", "wrist.flexion", "direct_dynamic")] })],
    }), forearmRegionData, "wrist.extension");
    const byId = new Map(result.bouts.map((bout) => [bout.boutId, bout] as const));
    expect(Array.from(byId.keys()).sort()).toEqual(["rc1", "rw1", "x1"]);
    expect(byId.get("rw1")).toMatchObject({ nodeIds: ["forearm.ecrl", "forearm.ecu", "forearm.ed"], categories: ["direct_dynamic", "contributing_dynamic"], mappingIds: ["m-ecrl", "m-ecu", "m-ed"] });
    expect(byId.get("rc1")).toMatchObject({ nodeIds: ["forearm.br"], categories: ["incidental_isometric"], mappingIds: ["m-br2"] });
    // As a movement target counts: distinct bouts, this arm's only; no arm is apart and counted for neither.
    expect(result.totals).toEqual({ directDynamicBouts: 1, deliberateHoldBouts: 0, deliberateHoldSeconds: 0, otherBouts: 1, unknownSideBouts: 1 });
  });
  it("reads only the region's own muscles, as the movement target does", () => {
    const external = summary({ nodes: [node({ nodeId: "upper_arm.biceps", contributions: [contribution({ boutId: "c1", nodeId: "upper_arm.biceps", parts: [part("m-bi", "elbow.flexion", "contributing_dynamic")] })] })] });
    expect(movementLedger(external, forearmRegionData, "elbow.flexion").bouts).toEqual([]);
  });
  it("counts hold seconds once per bout", () => {
    const hold = (nodeId: string) => contribution({ boutId: "h1", nodeId, category: "deliberate_isometric", holdSeconds: 40, parts: [{ ...part(`m-${nodeId}`, "fingers.pip_flexion", "deliberate_isometric"), muscleMode: "isometric" }] });
    const result = movementLedger(withNodes({ "forearm.fds": [hold("forearm.fds")], "forearm.fdp": [hold("forearm.fdp")] }), forearmRegionData, "fingers.pip_flexion");
    expect(result.totals).toMatchObject({ deliberateHoldBouts: 1, deliberateHoldSeconds: 40 });
  });
  it("leads an add for a movement with the muscle the chosen exercise is credited with for it", () => {
    const regionIds = new Set(forearmRegionData.nodes.filter((item) => item.regionId === "forearm").map((item) => item.id));
    const mapping = forearmRegionData.mappings.find((item) => item.reviewStatus === "reviewed" && item.actionId === "wrist.extension" && regionIds.has(item.nodeId))!;
    expect(movementFocusNodeId(forearmRegionData, "wrist.extension", [mapping.id])).toBe(mapping.nodeId);
    const mover = movementFocusNodeId(forearmRegionData, "wrist.extension", []);
    expect(forearmRegionData.nodeActions.some((row) => row.nodeId === mover && row.actionId === "wrist.extension")).toBe(true);
  });
});

describe("why an exercise counts (brief §2–§3: mapping-level evidence, told apart)", () => {
  it("finds the mappings behind a credit, each once, skipping ids the region does not have", () => {
    // Two of the forearm's own muscles' rows (from wave A the upper arm's rows credit the biceps and brachialis, so the forearm's
    // own rows for them are behind no credit on its page).
    const [first, second] = forearmRegionData.mappings.filter((item) => item.nodeId.startsWith("forearm."));
    expect(mappingsBehind(forearmRegionData, [first.id, "nope", second.id, first.id]).map((item) => item.id)).toEqual([first.id, second.id]);
  });
  it("labels inference, anatomy reference and measurement differently", () => {
    expect(new Set([evidenceBasisLabels.inference, evidenceBasisLabels.anatomy, evidenceBasisLabels.emg]).size).toBe(3);
    expect(evidenceBasisLabels.inference).toBe("Inferred from anatomy");
    expect(evidenceBasisLabels.emg).toBe("Measured by EMG");
  });
});

describe("the plan week being trained", () => {
  it("is read from the latest workout that names a plan day", () => {
    expect(latestSessionDayLabel([
      { dayLabel: "Week 1 · Day 01 · Push", startedAt: "2026-10-12T17:00:00.000Z" },
      { dayLabel: "Week 2 · Day 02 · Pull", startedAt: "2026-10-14T17:00:00.000Z" },
      { dayLabel: "", startedAt: "2026-10-15T17:00:00.000Z" },
      { dayLabel: "Week 3 · Day 01 · Push", startedAt: "not a date" },
    ])).toBe("Week 2 · Day 02 · Pull");
    expect(latestSessionDayLabel([])).toBeNull();
  });
});

describe("a target in planned mode", () => {
  it("names the plan week it was read over, not the calendar period", () => {
    const finding = findingsFor({ data: forearmRegionData, summary: summary({ mode: "planned", interval: { kind: "plan_week", startAt: null, endAtExclusive: null, timezone: "UTC", planWeek: 2, label: "Plan Week 2, as written" }, goals: [progress(3)] }) })[0];
    expect(finding.detail).toMatch(/^Direct dynamic bouts, Plan Week 2, as written\./);
    expect(finding.detail).not.toMatch(/calendar week/);
  });
});
