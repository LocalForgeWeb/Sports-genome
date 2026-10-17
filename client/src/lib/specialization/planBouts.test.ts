import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { buildDaySlots, emptyDayStore, type WeeklyDayStore } from "@/lib/trainingDayPlan";
import { getGoalPrescription } from "@/lib/workoutPlanner";
import { getSpecializationSummary } from "@shared/specialization/exposure";
import { forearmRegionData } from "@shared/specialization/regions/forearm";
import { forearmMuscleIds } from "@shared/specialization/ids";
import { planWeekInterval } from "@shared/specialization/time";
import { boutsFromPlan, holdDefaultPrescription, plannedTarget, prescriptionOf } from "./planBouts";
import { catalogMusclesLookup } from "./useSpecializationSummary";

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
const plannedSummary = (store: WeeklyDayStore, side: "left" | "right") => getSpecializationSummary({
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
  it("defaults a hold to 3 × 30 sec and a rep exercise to the goal's default", () => {
    expect(holdDefaultPrescription).toBe("3 × 30 sec");
    expect(prescriptionOf(undefined, 0, "Muscle growth", "seconds")).toBe("3 × 30 sec");
    expect(prescriptionOf(undefined, 0, undefined, "seconds")).toBe("3 × 30 sec");
    expect(prescriptionOf(undefined, 0, "Muscle growth", "reps")).toBe(getGoalPrescription("Muscle growth", 0));
    expect(prescriptionOf(undefined, 2, "Athleticism")).toBe(getGoalPrescription("Athleticism", 2));
    expect(prescriptionOf(undefined, 0, undefined)).toBeUndefined();
    // A saved prescription is the athlete's, whatever the measure.
    expect(prescriptionOf("3 × 40", 0, "Muscle growth", "seconds")).toBe("3 × 40");
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

  it("still plans a one-arm exercise's sets once for each arm", () => {
    const bouts = plan(day([{ id: oneArmCurl.id, prescription: "3 × 12" }]));
    expect(bouts).toHaveLength(3);
    expect(bouts.every((bout) => bout.side === "bilateral" && bout.sideSource === "plan_assumption" && bout.segments[0].reps === 12)).toBe(true);
  });
});
