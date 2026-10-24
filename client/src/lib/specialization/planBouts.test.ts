import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { buildDaySlots, emptyDayStore, type WeeklyDayStore } from "@/lib/trainingDayPlan";
import { getGoalPrescription } from "@/lib/workoutPlanner";
import { getSpecializationSummary } from "@shared/specialization/exposure";
import { forearmRegionData } from "@shared/specialization/regions/forearm";
import { forearmMuscleIds } from "@shared/specialization/regions/forearm/ids";
import { planWeekInterval } from "@shared/specialization/time";
import { variantFor, variantLibrary } from "@shared/specialization/variants";
import { variantLookup } from "./bouts";
import { boutsFromPlan, holdDefaultPrescription, plannedTarget, prescriptionOf } from "./planBouts";
import { catalogMusclesLookup, planningVariantsFor } from "./useSpecializationSummary";
import { fxThigh } from "./__fixtures__/multiRegion";

/**
 * One reading of a bare target for the set card and the plan, by the exercise's measure (R1). The
 * card shows "40" on a hang as "40 sec"; the planned atlas used to read the same "3 × 40" as 40
 * reps, so every planned hold had 0 seconds, and a hold with no saved prescription took the goal's
 * rep range, which the card then showed as seconds.
 */
const byId = (id: number) => exercises.find((exercise) => exercise.id === id)!;
const deadHang = byId(143);
const oneArmCurl = byId(410);
const slots = buildDaySlots(["Pull"]);
const day = (entries: { id: number; prescription?: string }[]): WeeklyDayStore => ({
  ...emptyDayStore(),
  plan: { [slots[0].key]: entries.map((entry) => byId(entry.id)) },
  prescriptions: { [slots[0].key]: Object.fromEntries(entries.filter((entry) => entry.prescription).map((entry) => [entry.id, entry.prescription!])) },
});
const plan = (store: WeeklyDayStore) => boutsFromPlan({ week: 1, slots, store, variants: forearmRegionData.variants, goal: "Muscle growth" });
const plannedSummary = (store: WeeklyDayStore, side: "left" | "right" | "both") => getSpecializationSummary({
  region: forearmRegionData, bouts: plan(store), interval: planWeekInterval(1, "UTC"), side, mode: "planned", goals: [],
  catalogMusclesFor: catalogMusclesLookup(exercises), sourceRevision: "s", planRevision: "p", now: "2026-10-16T12:00:00.000Z",
});

describe("a bare target, read by the exercise's measure", () => {
  it("is seconds on an exercise measured in seconds and reps elsewhere; a written unit is taken as written", () => {
    expect(plannedTarget("40", "seconds")).toEqual({ reps: null, holdSeconds: 40 });
    expect(plannedTarget("20–30", "seconds")).toEqual({ reps: null, holdSeconds: 20 });
    expect(plannedTarget("40", "reps")).toEqual({ reps: 40, holdSeconds: null });
    expect(plannedTarget("40")).toEqual({ reps: 40, holdSeconds: null });
    expect(plannedTarget("1 min", "seconds")).toEqual({ reps: null, holdSeconds: 60 });
    expect(plannedTarget("10 reps", "seconds")).toEqual({ reps: 10, holdSeconds: null });
    expect(plannedTarget("40 m", "seconds")).toEqual({ reps: null, holdSeconds: null });
  });
});

describe("a hold never gets a rep default", () => {
  it("defaults a hold to 30-second sets, with the goal's set count, and a rep exercise to the goal's default", () => {
    expect(holdDefaultPrescription).toBe("3 × 30 sec");
    expect(prescriptionOf(undefined, 0, "Muscle growth", "seconds")).toBe("3 × 30 sec");
    // The goal's count for the place in the day, so the weekly volume map counts the same sets.
    expect(getGoalPrescription("Athleticism", 0)).toBe("4 × 3–6");
    expect(prescriptionOf(undefined, 0, "Athleticism", "seconds")).toBe("4 × 30 sec");
    expect(prescriptionOf(undefined, 2, "Athleticism", "seconds")).toBe("3 × 30 sec");
    expect(prescriptionOf(undefined, 0, undefined, "seconds")).toBe("3 × 30 sec");
    expect(prescriptionOf(undefined, 0, "Muscle growth", "reps")).toBe(getGoalPrescription("Muscle growth", 0));
    expect(prescriptionOf(undefined, 2, "Athleticism")).toBe(getGoalPrescription("Athleticism", 2));
    expect(prescriptionOf(undefined, 0, undefined)).toBeUndefined();
  });

  it("keeps what the athlete saved, and reads the goal's default pinned on a hold as the default", () => {
    expect(prescriptionOf("3 × 40", 0, "Muscle growth", "seconds")).toBe("3 × 40");
    expect(prescriptionOf("4 × 3–6", 1, "Athleticism", "reps")).toBe("4 × 3–6");
    // The planner and Home fill an unset entry with the goal's default; on a hold that is not a choice.
    expect(prescriptionOf(getGoalPrescription("Athleticism", 1), 1, "Athleticism", "seconds")).toBe("4 × 30 sec");
    expect(prescriptionOf(getGoalPrescription("Muscle growth", 0), 0, "Muscle growth", "seconds")).toBe("3 × 30 sec");
    // The pinned text stays with the entry when it moves within its day, or when the goal changes
    // after the week was built: it is still a rep default, read with its own set count.
    expect(prescriptionOf(getGoalPrescription("Athleticism", 2), 0, "Athleticism", "seconds")).toBe("3 × 30 sec");
    expect(prescriptionOf(getGoalPrescription("Athleticism", 0), 3, "Athleticism", "seconds")).toBe("4 × 30 sec");
    expect(prescriptionOf(getGoalPrescription("Capacity", 2), 2, "Muscle growth", "seconds")).toBe("3 × 30 sec");
    expect(prescriptionOf(getGoalPrescription("Max strength", 0), 0, undefined, "seconds")).toBe("4 × 30 sec");
    // On a rep exercise every goal default is kept as written; on a hold, anything else the athlete wrote is too.
    expect(prescriptionOf(getGoalPrescription("Capacity", 2), 0, "Athleticism", "reps")).toBe("3 × 12–20");
    expect(prescriptionOf("3 × 20–40", 0, "Athleticism", "seconds")).toBe("3 × 20–40");
    expect(prescriptionOf("4 × 45 sec", 0, "Athleticism", "seconds")).toBe("4 × 45 sec");
  });

  it("plans a hang moved within a built day as 30-second holds, not the rep range it was pinned with", () => {
    // Built under Athleticism at position 3 ("3 × 6–10"), then moved to the top of the day.
    const bouts = boutsFromPlan({ week: 1, slots, store: day([{ id: deadHang.id, prescription: getGoalPrescription("Athleticism", 2) }]), variants: forearmRegionData.variants, goal: "Athleticism" });
    expect(bouts.map((bout) => [bout.segments[0].reps, bout.segments[0].holdSeconds])).toEqual([[null, 30], [null, 30], [null, 30]]);
  });

  it("plans a pinned goal default on a hang as 30-second holds", () => {
    const bouts = plan(day([{ id: deadHang.id, prescription: getGoalPrescription("Muscle growth", 0) }]));
    expect(bouts.map((bout) => [bout.segments[0].reps, bout.segments[0].holdSeconds])).toEqual([[null, 30], [null, 30], [null, 30]]);
  });

  it("plans a saved 3 × 40 hang as 40 seconds a set, on both hands", () => {
    const bouts = plan(day([{ id: deadHang.id, prescription: "3 × 40" }]));
    expect(bouts.map((bout) => bout.segments[0])).toEqual(bouts.map((bout) => ({ id: bout.id, reps: null, loadKg: null, holdSeconds: 40 })));
    for (const side of ["left", "right"] as const) {
      const fds = plannedSummary(day([{ id: deadHang.id, prescription: "3 × 40" }]), side).nodes.find((node) => node.nodeId === forearmMuscleIds.flexorDigitorumSuperficialis)!;
      expect(fds.deliberateHoldBouts + fds.mixedBouts, side).toBe(3);
      expect(fds.deliberateHoldSeconds, side).toBe(120);
    }
  });

  it("plans a hang with no saved prescription as three 30-second holds, not reps", () => {
    const bouts = plan(day([{ id: deadHang.id }]));
    expect(bouts).toHaveLength(3);
    expect(bouts.every((bout) => bout.segments[0].holdSeconds === 30 && bout.segments[0].reps === null)).toBe(true);
    expect(plannedSummary(day([{ id: deadHang.id }]), "left").nodes.find((node) => node.nodeId === forearmMuscleIds.flexorDigitorumSuperficialis)!.deliberateHoldSeconds).toBe(90);
  });

  it("plans a one-arm exercise's set as one bout, assumed on both arms: planned equals logged, one row per set (both arms as one, owner 20 Oct 2026)", () => {
    const bouts = plan(day([{ id: oneArmCurl.id, prescription: "3 × 12" }]));
    expect(bouts.map((bout) => bout.id)).toEqual([1, 2, 3].map((n) => `plan/1/${slots[0].key}/410/${n}`));
    expect(bouts.every((bout) => bout.armSide?.side === "both" && bout.armSide.source === "plan_assumption" && bout.legSide === null && bout.segments[0].reps === 12 && bout.segments[0].id === bout.id)).toBe(true);
    // The page's summary, both arms as one: 3 for "3 × 12", as three rows logged give.
    expect(plannedSummary(day([{ id: oneArmCurl.id, prescription: "3 × 12" }]), "both").regionDistinctBouts).toBe(3);
    // A per-arm summary (dormant) still gives each arm 3, as the forearm first shipped it (6738eeb).
    for (const side of ["left", "right"] as const) {
      const summary = plannedSummary(day([{ id: oneArmCurl.id, prescription: "3 × 12" }]), side);
      expect(summary.regionDistinctBouts, side).toBe(3);
      expect(summary.regionBoutRows!.every((row) => row.countedSide === side), side).toBe(true);
    }
  });
});

describe("the variants a region's page lays the plan out by (planningVariantsFor)", () => {
  it("are the region's own, then the library's for the exercises tagged with its keys that it does not map, one list per region", () => {
    const list = planningVariantsFor(fxThigh);
    // The thigh's single-leg RDL is its own record, one leg at a time; the library's (the forearm's, either arm) would win a lookup over both, as a default id.
    expect(variantLookup(list)(188)?.id).toBe("fx-188");
    expect(variantLookup([...fxThigh.variants, ...variantLibrary])(188)?.id).toBe("cat-188");
    // An exercise the thigh neither maps nor is tagged with is not its work, so its page lays it out with no variant (wave A:
    // the page no longer loads the whole library; client/src/lib/specialization/loadRegion.test.ts).
    expect(variantLookup(list)(410)).toBeNull();
    expect(planningVariantsFor(fxThigh)).toBe(list);
    // The forearm's: its version's 119 records, the 9 the upper arm's rows for the biceps and brachialis map (wave A), then the
    // library's records of the forearm-tagged exercises it does not map, among them 24 Dumbbell Pullover (§11 decision 11(c)).
    const forearm = planningVariantsFor(forearmRegionData);
    expect(forearm.map((variant) => variant.id)).toEqual([...forearmRegionData.variants, ...(forearmRegionData.taggedVariants ?? [])].map((variant) => variant.id));
    expect([forearmRegionData.variants.length, forearmRegionData.taggedVariants?.length]).toEqual([128, 14]);
    expect(forearm.slice(0, 119)).toEqual(variantLibrary.slice(0, 119));
    for (const variant of forearm) expect(variant, variant.id).toEqual(variantFor(variant.catalogExerciseId));
    expect(variantLookup(forearm)(24)?.laterality).toBe("bilateral");
  });

  it("so the thigh's page plans a single-leg RDL by its own variant: one bout per planned set, assumed on both legs, as the tracker lays it out", () => {
    const bouts = boutsFromPlan({ week: 1, slots, store: day([{ id: 188, prescription: "3 × 10" }]), variants: planningVariantsFor(fxThigh) });
    expect(bouts.map((bout) => [bout.legSide, bout.armSide])).toEqual([1, 2, 3].map(() => [{ side: "both", source: "plan_assumption" }, null]));
  });
});
