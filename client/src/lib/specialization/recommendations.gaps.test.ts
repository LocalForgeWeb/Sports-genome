import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { creditedMappingsFor, getSpecializationSummary, mappingKeyIn } from "@shared/specialization/exposure";
import { forearmActionIds as a, forearmMuscleIds as m } from "@shared/specialization/regions/forearm/ids";
import { forearmRegionData } from "@shared/specialization/regions/forearm";
import { categoryFor } from "@shared/specialization/rules";
import { calendarWeekInterval, planWeekInterval } from "@shared/specialization/time";
import type { ArmSide, ExerciseVariant, ExposureBout, GoalMetric, SpecializationGoal, SpecializationRegionData, SpecializationSummary, VariantMapping } from "@shared/specialization/types";
import type { PlannedExercise } from "./planBouts";
import { recommendFor, type RecommendationRequest, type RecommendationTarget } from "./recommendations";
import { catalogMusclesLookup } from "./useSpecializationSummary";
import { syntheticForearm } from "./__fixtures__/syntheticForearm";

/**
 * What each suggestion claims (pre-release review A2, A4, C6; brief §7 "Recommendations
 * explain a missing action or target gap", design §8 "Each candidate says why it fits"):
 * - a suggestion names only a target gap the calculator would fill with that exercise, and the
 *   kind of work an unmet target needs comes first; a target nothing can fill is said plainly;
 * - work the calculator counts only as incidental grip or steadying is never a suggestion and
 *   never "already covered by";
 * - a main action of the muscle with no direct work in the window leads, and says so;
 * - in completed mode an exercise already logged in the window is overlap, like a planned one.
 * Run on the real forearm content and on the synthetic fixture.
 */

const NOW = "2026-10-16T12:00:00.000Z";
const WEEK = calendarWeekInterval(NOW, "Europe/London");
const names = new Map(exercises.map((exercise) => [exercise.id, exercise.name] as const));
let sequence = 0;

/** One completed work set: reps and a hold, so every metric can read it. Both arms recorded, one, or none. */
const bout = (catalogExerciseId: number, arm: "both" | "left" | "right" | "none" = "both"): ExposureBout => {
  const id = `g${++sequence}`;
  return { id, mode: "completed", performedAt: "2026-10-14T18:00:00.000Z", sessionId: "s", sessionLabel: "Week 1 · Day 01 · Pull", planWeek: null, dayKey: null, exerciseEntryId: `e${catalogExerciseId}`, catalogExerciseId, exerciseName: names.get(catalogExerciseId) ?? `#${catalogExerciseId}`, matchedBy: "id", armSide: arm === "none" ? null : { side: arm, source: "recorded" }, legSide: null, straps: "no", warmup: false, effort: null, kind: "standard", segments: [{ id, reps: 12, loadKg: 20, holdSeconds: 30 }] };
};
const plannedBout = (catalogExerciseId: number): ExposureBout => ({ ...bout(catalogExerciseId), mode: "planned", performedAt: null, sessionId: null, planWeek: 1, dayKey: "0-Pull" });

const goal = (over: Partial<SpecializationGoal>): SpecializationGoal => ({ id: "g", regionId: "forearm", nodeId: m.flexorCarpiRadialis, actionId: null, side: "left", metric: "direct_dynamic_bouts", target: 10, period: "calendar_week", startsOn: "2026-10-01", endsOn: null, timezone: "Europe/London", createdAt: "", updatedAt: "", ...over });

function summary(region: SpecializationRegionData, bouts: ExposureBout[], side: ArmSide = "left", goals: SpecializationGoal[] = []): SpecializationSummary {
  return getSpecializationSummary({ region, bouts, interval: WEEK, side, mode: "completed", goals, catalogMusclesFor: catalogMusclesLookup(exercises), sourceRevision: "", planRevision: null, now: NOW });
}
function plannedSummary(region: SpecializationRegionData, bouts: ExposureBout[], side: ArmSide = "left"): SpecializationSummary {
  return getSpecializationSummary({ region, bouts, interval: planWeekInterval(1), side, mode: "planned", goals: [], catalogMusclesFor: catalogMusclesLookup(exercises), sourceRevision: "", planRevision: null, now: NOW });
}

function recommend(region: SpecializationRegionData, target: RecommendationTarget, over: Partial<RecommendationRequest> = {}) {
  const result = recommendFor({ region, target, side: "left", summary: summary(region, []), plannedExercises: [], catalog: exercises, equipmentProfile: null, ...over });
  if (result.kind !== "candidates") throw new Error(`expected candidates, got ${result.kind}`);
  return result;
}
const namesOf = (result: ReturnType<typeof recommend>) => result.candidates.map((candidate) => candidate.name);
const why = (result: ReturnType<typeof recommend>, name: string) => result.candidates.find((candidate) => candidate.name === name)!.why;
const pullDay = (catalogExerciseId: number): PlannedExercise => ({ catalogExerciseId, name: names.get(catalogExerciseId)!, days: [{ key: "0-Pull", label: "Day 01 · Pull" }] });

// ---------------------------------------------------------------- the synthetic fixture, extended

/**
 * The synthetic fixture plus what these rules need and it lacks: main actions for two
 * muscles, a dynamic finger exercise, a second wrist curl, a radial-deviation exercise and a
 * towel pull-up whose finger grip is a contributing hold on an exercise that is not a hold
 * (the calculator files that as incidental). Test assumptions, like the rest of the fixture.
 */
const extraVariant = (catalogExerciseId: number, catalogName: string, extra: Partial<ExerciseVariant> = {}): ExerciseVariant => ({ ...syntheticForearm.variants[0], id: `cat-${catalogExerciseId}`, catalogExerciseId, catalogName, ...extra });
const extraMapping = (catalogExerciseId: number, nodeId: string, actionId: string, relationship: VariantMapping["relationship"], muscleMode: VariantMapping["muscleMode"]): VariantMapping => ({
  id: `x-${catalogExerciseId}-${nodeId}-${actionId}`,
  versionKey: syntheticForearm.mappingVersion.key,
  variantId: `cat-${catalogExerciseId}`,
  nodeId,
  actionId,
  relationship,
  muscleMode,
  evidenceBasis: "inference",
  allocation: "individual",
  requiresNoStraps: false,
  rationale: "Synthetic test mapping.",
  reviewStatus: "reviewed",
  sources: [],
});
const extended: SpecializationRegionData = {
  ...syntheticForearm,
  nodeActions: [
    { nodeId: m.flexorCarpiRadialis, actionId: a.wristFlexion, role: "prime", claimId: "fcr.function" },
    { nodeId: m.flexorCarpiRadialis, actionId: a.radialDeviation, role: "prime", claimId: "fcr.function" },
    { nodeId: m.flexorDigitorumSuperficialis, actionId: a.fingersPipFlexion, role: "prime", claimId: "fds.function" },
  ],
  variants: [
    ...syntheticForearm.variants,
    extraVariant(401, "Finger Curl", { laterality: "bilateral" }),
    extraVariant(407, "Lever Radial Deviation", { laterality: "unilateral" }),
    extraVariant(410, "One-Arm Dumbbell Wrist Curl", { laterality: "unilateral" }),
    extraVariant(78, "Towel Pull-Up", { laterality: "bilateral", organization: "multi_joint" }),
  ],
  mappings: [
    ...syntheticForearm.mappings,
    extraMapping(401, m.flexorDigitorumSuperficialis, a.fingersPipFlexion, "direct", "dynamic"),
    extraMapping(407, m.flexorCarpiRadialis, a.radialDeviation, "direct", "dynamic"),
    extraMapping(410, m.flexorCarpiRadialis, a.wristFlexion, "direct", "dynamic"),
    extraMapping(78, m.flexorDigitorumSuperficialis, a.fingersPipFlexion, "contributing", "isometric"),
  ],
};

// ---------------------------------------------------------------- A2

describe("a suggestion names only a target gap the calculator would fill with it", () => {
  const holdSeconds = goal({ id: "hold-s", nodeId: m.flexorDigitorumSuperficialis, metric: "deliberate_hold_seconds", target: 120 });
  const dynamic = goal({ id: "dyn", nodeId: m.flexorDigitorumSuperficialis, metric: "direct_dynamic_bouts", target: 1 });

  it("forearm: a hold-only target puts the holds first, and only the holds claim it", () => {
    const result = recommend(forearmRegionData, { nodeId: m.flexorDigitorumSuperficialis }, { summary: summary(forearmRegionData, [], "left", [holdSeconds]) });
    // Eight holds since F3 added 419 Barbell Hold.
    expect(result.candidates.map((candidate) => candidate.relevance)).toEqual([...Array(8).fill("direct_isometric"), "direct_dynamic", "direct_dynamic"]);
    expect(namesOf(result).slice(0, 8)).toEqual(["Barbell Hold", "Dead Hang", "Farmer Hold", "Farmer’s Walk", "Gripper Hold", "Plate Pinch", "Suitcase Carry", "Towel Dead Hang"]);
    expect(why(result, "Dead Hang")).toBe("Direct middle-joint flexion hold for flexor digitorum superficialis; 0 of your 120 seconds of deliberate holds this week. The work is shared with flexor digitorum profundus; the evidence does not split it between them.");
    for (const name of ["Finger Curl", "Gripper Close"]) {
      expect(why(result, name)).toBe("Direct middle-joint flexion for flexor digitorum superficialis; not a hold, so it does not count toward your target of 120 seconds of deliberate holds this week. The work is shared with flexor digitorum profundus; the evidence does not split it between them.");
    }
    expect(result.candidates.map((candidate) => candidate.targetGap?.goal.id ?? null)).toEqual([...Array(8).fill("hold-s"), null, null]);
    // So "Add targeted exercise", which opens on the first candidate, opens on a hold.
    expect(result.candidates[0].relevance).toBe("direct_isometric");
  });

  it("forearm: with a dynamic and a hold target, each exercise names the one it fills and no dynamic exercise claims a hold", () => {
    const result = recommend(forearmRegionData, { nodeId: m.flexorDigitorumSuperficialis }, { summary: summary(forearmRegionData, [], "left", [dynamic, holdSeconds]) });
    for (const candidate of result.candidates) {
      if (candidate.relevance === "direct_dynamic") {
        expect(candidate.why).toContain("0 of your 1 direct dynamic bouts this week");
        expect(candidate.why).not.toMatch(/hold/);
      } else {
        expect(candidate.why).toContain("0 of your 120 seconds of deliberate holds this week");
        expect(candidate.why).not.toMatch(/direct dynamic/);
      }
    }
    expect(namesOf(result).slice(0, 2)).toEqual(["Finger Curl", "Gripper Close"]);
  });

  it("forearm: a target no reviewed exercise can fill is said plainly, not claimed by what is offered", () => {
    const goals = [goal({ id: "dyn", metric: "direct_dynamic_bouts", target: 2 }), goal({ id: "holds", metric: "deliberate_hold_bouts", target: 3 })];
    const result = recommend(forearmRegionData, { nodeId: m.flexorCarpiRadialis }, { summary: summary(forearmRegionData, [bout(139), bout(139)], "left", goals) });
    // The dynamic target is met, so the direct curls (with F3's cable and behind-the-back curls), the flexion-wind roller and
    // the radial-deviation lever are not offered again; the two rollers that only contribute to wrist flexion stay.
    expect([namesOf(result), result.skippedAtTarget]).toEqual([["Wrist Roller", "Wrist Roller, Extension Wind"], 6]);
    expect(result.candidates[0].why).toMatch(/^Helps with wrist flexion for flexor carpi radialis; it counts toward none of your targets here\./);
    expect(result.candidates[0].why).not.toMatch(/no reviewed exercise/);
    expect(result.candidates[0].why).not.toMatch(/0 of your 3/);
    expect(result.targetNote).toBe("No reviewed exercise for flexor carpi radialis counts toward your target of 3 deliberate hold bouts this week.");
  });

  /**
   * Final review F-accounting-1: with one target met and one not, most exercises are left out
   * as answering the met target; when the athlete then leaves out the rest, the empty list
   * names both causes, never "every exercise is excluded".
   */
  it("forearm: an empty list after exclusions names both causes when some exercises answer a met target", () => {
    const goals = [goal({ id: "dyn", side: "right", metric: "direct_dynamic_bouts", target: 3 }), goal({ id: "holds", side: "right", metric: "deliberate_hold_bouts", target: 3 })];
    const base = { side: "right" as const, summary: summary(forearmRegionData, [bout(139), bout(139), bout(139)], "right", goals) };
    const open = recommend(forearmRegionData, { nodeId: m.flexorCarpiRadialis }, base);
    expect([namesOf(open), open.skippedAtTarget, open.excludedCount]).toEqual([["Wrist Roller", "Wrist Roller, Extension Wind"], 6, 0]);
    const targetNote = "No reviewed exercise for flexor carpi radialis counts toward your target of 3 deliberate hold bouts this week.";
    const both = `${targetNote} The exercises that train this either answer a target you have already met or are left out by your choices under What is suggested.`;
    // Left out one by one, or through their equipment: the same two causes either way.
    for (const exclusions of [{ catalogExerciseIds: [141, 415] }, { equipment: ["Free weights"] }]) {
      const result = recommend(forearmRegionData, { nodeId: m.flexorCarpiRadialis }, { ...base, exclusions });
      expect([result.candidates, result.excludedCount, result.skippedAtTarget, result.emptyReason]).toEqual([[], 2, 6, both]);
      expect(result.emptyReason).not.toMatch(/Every/);
    }
    // With nothing met, the exclusions are the only cause, and "every" is true.
    const unmetOnly = { side: "right" as const, summary: summary(forearmRegionData, [], "right", [goals[1]]) };
    const all = recommend(forearmRegionData, { nodeId: m.flexorCarpiRadialis }, unmetOnly).candidates.map((candidate) => candidate.catalogExerciseId);
    expect(all.length).toBeGreaterThan(2);
    const none = recommend(forearmRegionData, { nodeId: m.flexorCarpiRadialis }, { ...unmetOnly, exclusions: { catalogExerciseIds: all } });
    expect([none.candidates, none.excludedCount, none.skippedAtTarget, none.emptyReason]).toEqual([[], all.length, 0, `${targetNote} Every reviewed exercise for this is left out by your choices under What is suggested.`]);
  });

  it("synthetic: a hold target leads with holds, a dynamic target with the dynamic exercise, and neither claims the other", () => {
    const holds = recommend(extended, { nodeId: m.flexorDigitorumSuperficialis }, { summary: summary(extended, [], "left", [goal({ nodeId: m.flexorDigitorumSuperficialis, metric: "deliberate_hold_bouts", target: 2 })]) });
    expect(namesOf(holds)).toEqual(["Dead Hang", "Farmer Hold", "Finger Curl"]);
    expect(why(holds, "Dead Hang")).toContain("; 0 of your 2 deliberate hold bouts this week.");
    expect(why(holds, "Finger Curl")).toContain("; not a hold, so it does not count toward your target of 2 deliberate hold bouts this week.");
    const moves = recommend(extended, { nodeId: m.flexorDigitorumSuperficialis }, { summary: summary(extended, [], "left", [goal({ nodeId: m.flexorDigitorumSuperficialis, metric: "direct_dynamic_bouts", target: 4 })]) });
    expect(namesOf(moves)).toEqual(["Finger Curl", "Dead Hang", "Farmer Hold"]);
    expect(why(moves, "Finger Curl")).toContain("; 0 of your 4 direct dynamic bouts this week.");
    expect(why(moves, "Farmer Hold")).toContain("; a hold, so it does not count toward your target of 4 direct dynamic bouts this week.");
  });

  /**
   * The rule itself, checked for every muscle and movement and every metric: an exercise
   * claims a target exactly when one logged set of it moves that target in the calculator.
   */
  for (const [label, region] of [["forearm", forearmRegionData], ["synthetic", extended]] as const) {
    it(`${label}: every claim matches what the calculator counts, for every muscle, movement and metric`, () => {
      const metrics: GoalMetric[] = ["direct_dynamic_bouts", "deliberate_hold_bouts", "deliberate_hold_seconds"];
      const targets: { target: RecommendationTarget; goal: Partial<SpecializationGoal> }[] = [
        ...region.nodes.map((node) => ({ target: { nodeId: node.id }, goal: { nodeId: node.id, actionId: null } })),
        ...region.actions.map((action) => ({ target: { actionId: action.id }, goal: { nodeId: null, actionId: action.id } })),
      ];
      let checked = 0;
      for (const { target, goal: where } of targets) {
        for (const metric of metrics) {
          const open = goal({ ...where, id: "open", metric, target: 1000 });
          const result = recommendFor({ region, target, side: "left", summary: summary(region, [], "left", [open]), plannedExercises: [], catalog: exercises, equipmentProfile: null });
          if (result.kind !== "candidates") continue;
          for (const candidate of result.candidates) {
            const value = summary(region, [bout(candidate.catalogExerciseId)], "left", [open]).goals[0].value;
            expect([candidate.name, Boolean(candidate.targetGap)]).toEqual([candidate.name, value > 0]);
            expect([candidate.name, candidate.why.includes("of your 1000")]).toEqual([candidate.name, value > 0]);
            checked += 1;
          }
        }
      }
      expect(checked).toBeGreaterThan(label === "forearm" ? 300 : 20);
    });
  }
});

// ---------------------------------------------------------------- A4

describe("work the calculator counts only as incidental is never a suggestion or already covered", () => {
  const fds = m.flexorDigitorumSuperficialis;

  it("forearm: Towel Pull-Up and Rope Climb are not finger-flexor suggestions, planned or logged, and stay elbow helpers", () => {
    for (const nodeId of [fds, m.flexorDigitorumProfundus]) {
      const planned = recommend(forearmRegionData, { nodeId }, { plannedExercises: [pullDay(78), pullDay(80)] });
      expect(namesOf(planned)).not.toContain("Towel Pull-Up");
      expect(namesOf(planned)).not.toContain("Rope Climb");
      expect(planned.alreadyCoveredBy).toEqual([]);
      const logged = recommend(forearmRegionData, { nodeId }, { summary: summary(forearmRegionData, [bout(78), bout(80)]) });
      expect(logged.alreadyCoveredBy).toEqual([]);
    }
    const elbow = recommend(forearmRegionData, { nodeId: m.brachioradialis });
    expect(elbow.candidates.filter((candidate) => [78, 80].includes(candidate.catalogExerciseId)).map((candidate) => candidate.relevance)).toEqual(["contributing", "contributing"]);
  });

  for (const [label, region] of [["forearm", forearmRegionData], ["synthetic", extended]] as const) {
    it(`${label}: no muscle is offered, or covered by, an exercise whose only credit for it is incidental or unknown`, () => {
      const variantById = new Map(region.variants.map((variant) => [variant.id, variant] as const));
      // What credits each node on this page: its own version, or an external member's home version once published (wave A:
      // the upper arm's rows credit the forearm page's biceps and brachialis), keyed as the page keys them.
      const reviewed = region.nodes.flatMap((node) => creditedMappingsFor(region, node.id)).filter((mapping) => mapping.reviewStatus === "reviewed");
      const mappingById = new Map(reviewed.map((mapping) => [mappingKeyIn(region, mapping), mapping] as const));
      const credit = (mapping: VariantMapping) => categoryFor(mapping.relationship, mapping.muscleMode, variantById.get(mapping.variantId)!.deliberateHold);
      let incidentalOnly = 0;
      for (const node of region.nodes) {
        const forNode = reviewed.filter((mapping) => mapping.nodeId === node.id);
        if (!forNode.length) continue;
        const onlyIncidental = Array.from(new Set(forNode.map((mapping) => mapping.variantId)))
          .filter((variantId) => forNode.filter((mapping) => mapping.variantId === variantId).every((mapping) => ["incidental_isometric", "unknown"].includes(credit(mapping)) || !["direct", "contributing"].includes(mapping.relationship)))
          .map((variantId) => variantById.get(variantId)!.catalogExerciseId);
        incidentalOnly += onlyIncidental.length;
        const plannedAll = onlyIncidental.filter((id) => names.has(id)).map(pullDay);
        const outcomes = [
          recommendFor({ region, target: { nodeId: node.id }, side: "left", summary: summary(region, []), plannedExercises: plannedAll, catalog: exercises, equipmentProfile: null }),
          recommendFor({ region, target: { nodeId: node.id }, side: "left", summary: summary(region, onlyIncidental.map((id) => bout(id))), plannedExercises: [], catalog: exercises, equipmentProfile: null }),
        ];
        for (const result of outcomes) {
          if (result.kind === "mapping_not_reviewed") continue;
          expect([node.id, result.alreadyCoveredBy.map((item) => item.name)]).toEqual([node.id, []]);
          if (result.kind !== "candidates") continue;
          for (const candidate of result.candidates) {
            expect([node.id, candidate.name, onlyIncidental.includes(candidate.catalogExerciseId)]).toEqual([node.id, candidate.name, false]);
            for (const id of candidate.mappingIds) expect([candidate.name, id, ["incidental_isometric", "unknown"].includes(credit(mappingById.get(id)!))]).toEqual([candidate.name, id, false]);
          }
        }
      }
      // The scan has something to bite on: grip held during rows, curls and pulls.
      expect(incidentalOnly).toBeGreaterThan(label === "forearm" ? 100 : 4);
    });
  }
});

// ---------------------------------------------------------------- C6: the missing main action

describe("a main action of the muscle with no direct work in the window comes first", () => {
  it("forearm: after four one-arm wrist curls, the ulnar-deviation exercise leads for flexor carpi ulnaris and says why", () => {
    const curls = [bout(139, "right"), bout(139, "right"), bout(139, "right"), bout(139, "right")];
    const result = recommend(forearmRegionData, { nodeId: m.flexorCarpiUlnaris }, { side: "right", summary: summary(forearmRegionData, curls, "right") });
    expect(result.missingActions).toEqual([a.ulnarDeviation]);
    // Direct work not yet logged, then the logged Wrist Curl (overlap), then work that only contributes.
    expect(namesOf(result)).toEqual(["Lever Ulnar Deviation", "Behind-the-Back Wrist Curl", "Cable Wrist Curl", "One-Arm Dumbbell Wrist Curl", "Wrist Roller, Flexion Wind", "Wrist Curl", "Wrist Roller", "Wrist Roller, Extension Wind"]);
    expect(result.candidates[0].why).toMatch(/^Ulnar deviation: no direct work in this window\. Direct ulnar deviation for flexor carpi ulnaris; 4 direct dynamic and 0 hold bouts in this window, no target set\./);
    expect(result.candidates[0].missingActions).toEqual([a.ulnarDeviation]);
    // Only the exercise that fills the missing action leads with it.
    expect(result.candidates.slice(1).every((candidate) => !candidate.why.startsWith("Ulnar deviation"))).toBe(true);
  });

  it("forearm: with a target, the missing action still leads among the exercises that fill it", () => {
    const goals = [goal({ nodeId: m.flexorCarpiUlnaris, side: "right", metric: "direct_dynamic_bouts", target: 10 })];
    const result = recommend(forearmRegionData, { nodeId: m.flexorCarpiUlnaris }, { side: "right", summary: summary(forearmRegionData, [bout(139, "right")], "right", goals) });
    expect(namesOf(result)[0]).toBe("Lever Ulnar Deviation");
    expect(result.candidates[0].why).toMatch(/^Ulnar deviation: no direct work in this window\. Direct ulnar deviation for flexor carpi ulnaris; 1 of your 10 direct dynamic bouts this week\./);
  });

  it("synthetic: after wrist curls, the radial-deviation exercise leads; the roller's steadying does not count as that action", () => {
    const result = recommend(extended, { nodeId: m.flexorCarpiRadialis }, { summary: summary(extended, [bout(139)]) });
    expect(result.missingActions).toEqual([a.radialDeviation]);
    expect(namesOf(result)).toEqual(["Lever Radial Deviation", "One-Arm Dumbbell Wrist Curl", "Wrist Roller", "Wrist Curl"]);
    expect(result.candidates[0].why).toBe("Radial deviation: no direct work in this window. Direct radial deviation for flexor carpi radialis; 1 direct dynamic and 0 hold bouts in this window, no target set.");
  });

  it("names no missing action when the muscle had no direct work at all, or every main action had some", () => {
    const none = recommend(extended, { nodeId: m.flexorCarpiRadialis });
    expect(none.missingActions).toEqual([]);
    expect(none.candidates.every((candidate) => !candidate.why.includes(": no direct work"))).toBe(true);
    const both = recommend(extended, { nodeId: m.flexorCarpiRadialis }, { summary: summary(extended, [bout(139), bout(407)]) });
    expect(both.missingActions).toEqual([]);
  });

  it("forearm: work with no arm recorded is not the arm's direct work, so no missing action is named beside 'it has no direct work'", () => {
    const noSide = [bout(410, "none"), bout(410, "none")];
    const result = recommend(forearmRegionData, { nodeId: m.flexorCarpiUlnaris }, { side: "right", summary: summary(forearmRegionData, noSide, "right") });
    expect(result.missingActions).toEqual([]);
    expect(result.candidates.every((candidate) => !candidate.why.includes(": no direct work"))).toBe(true);
    expect(why(result, "Lever Ulnar Deviation")).toMatch(/^Direct ulnar deviation for flexor carpi ulnaris; it has no direct work in this window\./);
    // Still the exercise just done: overlap, said with its missing side.
    const curl = result.candidates.find((candidate) => candidate.catalogExerciseId === 410)!;
    expect([curl.alreadyLogged, curl.loggedBouts]).toEqual([true, 2]);
    expect(curl.why).toMatch(/Already logged in this window: 2 sets with no arm recorded\.$/);
    expect(result.alreadyCoveredBy.map((item) => item.days.map((day) => day.label))).toEqual([["2 sets logged in this window with no arm recorded"]]);
  });

  it("forearm: work with no arm recorded on a main action still covers it", () => {
    const result = recommend(forearmRegionData, { nodeId: m.flexorCarpiUlnaris }, { side: "right", summary: summary(forearmRegionData, [bout(139, "right"), bout(408, "none")], "right") });
    expect(result.missingActions).toEqual([]);
    expect(result.candidates.every((candidate) => !candidate.why.includes(": no direct work"))).toBe(true);
    const lever = result.candidates.find((candidate) => candidate.catalogExerciseId === 408)!;
    expect(lever.why).toMatch(/Already logged in this window: 1 set with no arm recorded\.$/);
    // Some sets on the arm, some with no arm recorded: both counted, the second named.
    const some = recommend(forearmRegionData, { nodeId: m.flexorCarpiUlnaris }, { side: "right", summary: summary(forearmRegionData, [bout(410, "right"), bout(410, "none")], "right") });
    expect(some.alreadyCoveredBy.map((item) => [item.loggedBouts, item.days.map((day) => day.label)])).toEqual([[2, ["2 sets logged in this window, 1 with no arm recorded"]]]);
  });

  it("synthetic: a set counted as mixed is not direct work in the totals, so no missing action is named", () => {
    // The roller moves the wrist and steadies it in one set: mixed for flexor carpi radialis.
    const result = recommend(extended, { nodeId: m.flexorCarpiRadialis }, { summary: summary(extended, [bout(141)]) });
    expect(result.missingActions).toEqual([]);
    expect(why(result, "Lever Radial Deviation")).toMatch(/^Direct radial deviation for flexor carpi radialis; it has no direct work in this window\./);
    for (const candidate of result.candidates) expect(candidate.why).not.toContain(": no direct work");
  });

  it("in the plan, it says what is planned", () => {
    const result = recommend(extended, { nodeId: m.flexorCarpiRadialis }, { summary: plannedSummary(extended, [plannedBout(139), plannedBout(139)]), plannedExercises: [pullDay(139)] });
    expect(result.candidates[0].why).toBe("Radial deviation: no direct work planned in this week. Direct radial deviation for flexor carpi radialis; 2 direct dynamic and 0 hold bouts planned in this week, no target set.");
  });
});

// ---------------------------------------------------------------- C6: logged work is overlap

describe("an exercise already logged in the window is overlap, like a planned one", () => {
  it("forearm: a wrist curl logged this week ranks below the one-arm curl and is listed under already covered", () => {
    const result = recommend(forearmRegionData, { nodeId: m.flexorCarpiRadialis }, { summary: summary(forearmRegionData, [bout(139), bout(139), bout(139)]) });
    const order = namesOf(result);
    expect(order.indexOf("Wrist Curl")).toBeGreaterThan(order.indexOf("One-Arm Dumbbell Wrist Curl"));
    const curl = result.candidates.find((candidate) => candidate.name === "Wrist Curl")!;
    expect([curl.alreadyLogged, curl.loggedBouts, curl.alreadyPlanned]).toEqual([true, 3, false]);
    expect(curl.why).toContain("Already logged in this window: 3 sets.");
    expect(result.alreadyCoveredBy).toEqual([{ catalogExerciseId: 139, name: "Wrist Curl", days: [{ key: "logged", label: "3 sets logged in this window" }], category: "direct_dynamic", loggedBouts: 3 }]);
  });

  it("synthetic: an exercise both planned and logged is one already-covered entry with its days and its sets", () => {
    const result = recommend(extended, { nodeId: m.flexorCarpiRadialis }, { summary: summary(extended, [bout(139)]), plannedExercises: [pullDay(139)] });
    expect(result.alreadyCoveredBy).toEqual([{ catalogExerciseId: 139, name: "Wrist Curl", days: [{ key: "0-Pull", label: "Day 01 · Pull" }, { key: "logged", label: "1 set logged in this window" }], category: "direct_dynamic", loggedBouts: 1 }]);
    expect(why(result, "Wrist Curl")).toMatch(/Already in this plan week\. Already logged in this window: 1 set\.$/);
  });

  it("synthetic: work logged on the other arm, or in the plan view, is not logged overlap for this arm", () => {
    const otherArm = recommend(extended, { nodeId: m.flexorCarpiRadialis }, { summary: summary(extended, [bout(410, "right")]) });
    expect(otherArm.alreadyCoveredBy).toEqual([]);
    expect(otherArm.candidates.every((candidate) => !candidate.alreadyLogged)).toBe(true);
    const plan = recommend(extended, { nodeId: m.flexorCarpiRadialis }, { summary: plannedSummary(extended, [plannedBout(139)]) });
    expect(plan.alreadyCoveredBy).toEqual([]);
  });

  it("synthetic: a movement target reads logged work on any of the region's muscles for that movement", () => {
    const result = recommend(extended, { actionId: a.wristFlexion }, { summary: summary(extended, [bout(139)]) });
    expect(result.alreadyCoveredBy.map((item) => [item.name, item.loggedBouts])).toEqual([["Wrist Curl", 1]]);
    expect(namesOf(result).at(-1)).toBe("Wrist Curl");
  });
});
