import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { buildDaySlots, commitDay, emptyDayStore, type WeeklyDayStore } from "@/lib/trainingDayPlan";
import { directWorkCount } from "@shared/specialization/directWork";
import { getSpecializationSummary } from "@shared/specialization/exposure";
import { forearmRegionData } from "@shared/specialization/regions/forearm";
import { calendarWeekInterval, planWeekInterval } from "@shared/specialization/time";
import type { ExposureBout, SpecializationRegionData, SummarySide, VariantMapping } from "@shared/specialization/types";
import { boutsFromSessions } from "./bouts";
import { boutsFromPlan } from "./planBouts";
import { catalogMusclesLookup, planningVariantsFor } from "./useSpecializationSummary";
import { deltoidIds, deltoidRegionData } from "./__fixtures__/deltoidRegion";
import { fx, fxCore } from "./__fixtures__/multiRegion";
import { exercise, finished, workSet } from "./__fixtures__/syntheticForearm";

/**
 * The shared count of direct work (11-forearm-research-and-stack.md §3.3, §7.4): distinct bouts with
 * direct moving work on an own target muscle, and holds beside it, never added in. The stack's
 * total, the page's window line and the 3D panel all read it.
 */

const NOW = "2026-10-16T12:00:00.000Z";
const catalogMusclesFor = catalogMusclesLookup(exercises);
const byId = new Map(exercises.map((item) => [item.id, item] as const));

function planned(region: SpecializationRegionData, days: { id: number; prescription?: string }[][], side?: SummarySide) {
  const slots = buildDaySlots(days.map((_, index) => (["Push", "Pull", "Legs", "Upper", "Lower"] as const)[index]));
  let store: WeeklyDayStore = emptyDayStore();
  slots.forEach((slot, index) => {
    const workout = days[index].map((item) => byId.get(item.id)!);
    const prescriptions = Object.fromEntries(days[index].filter((item) => item.prescription).map((item) => [item.id, item.prescription!]));
    store = commitDay(store, slot.key, { workout, prescriptions, settings: {}, context: [] });
  });
  const bouts = boutsFromPlan({ week: 1, slots, store, variants: planningVariantsFor(region), goal: "Muscle growth" });
  return summarize(region, bouts, "planned", side);
}

function summarize(region: SpecializationRegionData, bouts: readonly ExposureBout[], mode: "planned" | "completed", side: SummarySide = region.region.sides.model === "midline" ? "midline" : "both") {
  return getSpecializationSummary({
    region,
    bouts,
    interval: mode === "planned" ? planWeekInterval(1) : calendarWeekInterval(NOW, "Europe/London"),
    side,
    mode,
    goals: [],
    catalogMusclesFor,
    sourceRevision: "",
    planRevision: null,
    now: NOW,
  });
}

describe("directWorkCount", () => {
  it("counts a set that credits three muscles once", () => {
    // 140 Reverse Wrist Curl: ECRL, ECRB and ECU direct dynamic, shared.
    const count = directWorkCount(forearmRegionData, planned(forearmRegionData, [[{ id: 140, prescription: "2 × 10–25" }]]));
    expect(count.moving).toBe(2);
    expect(count.musclesWithMovingWork).toEqual(["forearm.ecrl", "forearm.ecrb", "forearm.ecu"]);
    expect(count.holds).toEqual({ bouts: 0, boutIds: [], seconds: 0, withoutTime: 0 });
    expect(count.ownTargetMuscles).toBe(19);
  });

  it("counts a planned one-arm set once, as the plan writes one bout per planned set, and a two-handed one once", () => {
    const count = directWorkCount(forearmRegionData, planned(forearmRegionData, [[{ id: 410, prescription: "3 × 10–25" }, { id: 139, prescription: "2 × 10–25" }]]));
    expect(count.moving).toBe(5);
    expect(count.movingBoutIds.every((id) => !/left|right/.test(id))).toBe(true);
  });

  it("counts a mixed contribution with a direct moving part as moving work", () => {
    // A test assumption: the wrist curl's FCR also read as an isometric steadier, so one set loads it two ways.
    const extra: VariantMapping = { ...forearmRegionData.mappings.find((mapping) => mapping.id === "cat-139:forearm.fcr")!, id: "test-139-fcr-steady", relationship: "stabilizer", muscleMode: "isometric", actionId: "wrist.extension" };
    const region: SpecializationRegionData = { ...forearmRegionData, mappings: [...forearmRegionData.mappings, extra] };
    const summary = planned(region, [[{ id: 139, prescription: "1 × 10–25" }]]);
    const fcr = summary.nodes.find((node) => node.nodeId === "forearm.fcr")!;
    expect(fcr.contributions[0].category).toBe("mixed");
    expect(directWorkCount(region, summary).moving).toBe(1);
  });

  it("counts a Zercher carry in neither number: its brachioradialis hold is contributing, not direct", () => {
    const count = directWorkCount(forearmRegionData, planned(forearmRegionData, [[{ id: 300, prescription: "3 × 30 sec" }]]));
    expect(count.moving).toBe(0);
    expect(count.holds.bouts).toBe(0);
  });

  it("counts a deliberate hold in holds only, with its seconds once per bout, and a hold with no time recorded as such", () => {
    const sessions = [finished("s1", "2026-10-14T18:00:00.000Z", [
      exercise("e1", "Dead Hang", 143, [workSet({ id: "h1", reps: "", weight: "", holdSeconds: "40" }), workSet({ id: "h2", reps: "", weight: "" })]),
      exercise("e2", "Wrist Curl", 139, [workSet({ id: "w1" })]),
    ])];
    const bouts = boutsFromSessions(sessions, { catalog: exercises, fallbackUnit: "kg" });
    const count = directWorkCount(forearmRegionData, summarize(forearmRegionData, bouts, "completed"));
    expect(count.moving).toBe(1);
    // FDS and FDP both hold in the hang: the bout's 40 s count once, not once per muscle.
    expect(count.holds).toEqual({ bouts: 2, boutIds: ["h1", "h2"], seconds: 40, withoutTime: 1 });
  });

  it("counts no grip a strapped set withheld, and no draft row", () => {
    const sessions = [finished("s1", "2026-10-14T18:00:00.000Z", [
      exercise("e1", "Dead Hang", 143, [workSet({ id: "h1", reps: "", weight: "", holdSeconds: "30" })], { straps: "yes" }),
      // 409 Suitcase Carry: FPL's row is a draft; FDS and FDP hold.
      exercise("e2", "Suitcase Carry", 409, [workSet({ id: "c1", reps: "", weight: "", holdSeconds: "20" })]),
    ])];
    const summary = summarize(forearmRegionData, boutsFromSessions(sessions, { catalog: exercises, fallbackUnit: "kg" }), "completed");
    expect(directWorkCount(forearmRegionData, summary).holds.boutIds).toEqual(["c1"]);
  });

  it("reads the deltoid fixture with no deltoid code: own muscles only, never the external triceps", () => {
    const count = directWorkCount(deltoidRegionData, planned(deltoidRegionData, [[{ id: 111, prescription: "2 × 12" }, { id: 101, prescription: "1 × 8" }]]));
    expect(count.moving).toBe(3);
    expect(count.musclesWithMovingWork).toEqual([deltoidIds.anterior, deltoidIds.lateral]);
    expect(count.ownTargetMuscles).toBe(3);
  });

  it("reads a midline region on its midline summary", () => {
    const count = directWorkCount(fxCore, planned(fxCore, [[{ id: 241, prescription: "2 × 15" }, { id: 247, prescription: "2 × 30 sec" }]]));
    expect(count.moving).toBe(2);
    expect(count.holds.bouts).toBe(2);
    expect(count.holds.seconds).toBe(60);
    expect(count.musclesWithMovingWork).toEqual([fx.rectus]);
  });

  it("leaves out rows a per-side summary keeps apart with no side", () => {
    const sessions = [finished("s1", "2026-10-14T18:00:00.000Z", [exercise("e1", "One-Arm Dumbbell Wrist Curl", 410, [workSet({ id: "u1" })])])];
    const bouts = boutsFromSessions(sessions, { catalog: exercises, fallbackUnit: "kg" });
    // No arm recorded on a one-arm set: the dormant per-side summary keeps it apart; the page's both counts it.
    expect(directWorkCount(forearmRegionData, summarize(forearmRegionData, bouts, "completed", "left")).moving).toBe(0);
    expect(directWorkCount(forearmRegionData, summarize(forearmRegionData, bouts, "completed", "both")).moving).toBe(1);
  });
});
