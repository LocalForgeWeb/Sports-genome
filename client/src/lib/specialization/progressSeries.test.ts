import { describe, expect, it } from "vitest";
import type { DeviceSetLog, DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { exercises } from "@/lib/exerciseCatalog";
import { forearmRegionData } from "@shared/specialization/regions/forearm";
import {
  CM_PER_INCH, KG_PER_LB, NEWTONS_PER_KGF, directlyMappedCatalogIds, formatPerformance, formatReading, formatScale, performanceSeries, progressAxis,
  progressUnitsFor, splitByAxis, toShownValue, toStoredValue, valueScale, wallClockAt, zonedDateTimeToIso,
} from "./progressSeries";

/**
 * The Progress disclosure's rules (brief §10, design §5), on the functions the panel calls:
 * canonical storage with the profile's units at the edges, a reading's local date and time
 * as one instant, one shared axis that draws only what falls inside it, and one comparable
 * point per session for an exercise matched by catalog id.
 */

const lb = progressUnitsFor("lb");
const kg = progressUnitsFor("kg");

describe("units", () => {
  it("types and reads inches and lb for an lb profile, cm and kg for a kg one, and stores cm and newtons", () => {
    expect(lb).toEqual({ length: "in", force: "lb" });
    expect(kg).toEqual({ length: "cm", force: "kg" });
    expect(toStoredValue("circumference_cm", 12.5, lb)).toBeCloseTo(12.5 * CM_PER_INCH, 10);
    expect(toStoredValue("circumference_cm", 31.5, kg)).toBe(31.5);
    expect(toStoredValue("grip_force_n", 100, lb)).toBeCloseTo(100 * KG_PER_LB * NEWTONS_PER_KGF, 10);
    expect(toStoredValue("grip_force_n", 45, kg)).toBeCloseTo(45 * NEWTONS_PER_KGF, 10);
  });

  it("round-trips what was typed", () => {
    for (const [metric, typed, units] of [["circumference_cm", 12.3, lb], ["circumference_cm", 31.7, kg], ["grip_force_n", 97.5, lb], ["grip_force_n", 44.2, kg]] as const) {
      expect(toShownValue(metric, toStoredValue(metric, typed, units), units)).toBeCloseTo(typed, 10);
    }
  });

  it("labels every value with its unit, and grip is always on a dynamometer", () => {
    expect(formatReading("circumference_cm", 31.75, lb)).toBe("12.5 in around");
    expect(formatReading("circumference_cm", 31.75, kg)).toBe("31.8 cm around");
    expect(formatReading("grip_force_n", 45 * NEWTONS_PER_KGF, kg)).toBe("45.0 kg on a dynamometer");
    expect(formatReading("grip_force_n", 100 * KG_PER_LB * NEWTONS_PER_KGF, lb)).toBe("100.0 lb on a dynamometer");
    expect(formatScale("circumference_cm", 30, 31, kg)).toBe("30.0 to 31.0 cm");
    expect(formatScale("circumference_cm", 30, 30, kg)).toBe("30.0 cm");
  });
});

describe("a reading's local date and time", () => {
  it("is the instant that date and time name in the page's zone", () => {
    expect(zonedDateTimeToIso("2026-10-10", "07:30", "UTC")).toBe("2026-10-10T07:30:00.000Z");
    expect(zonedDateTimeToIso("2026-10-10", "07:30", "America/New_York")).toBe("2026-10-10T11:30:00.000Z");
    expect(zonedDateTimeToIso("2026-01-10", "07:30", "America/New_York")).toBe("2026-01-10T12:30:00.000Z");
    expect(zonedDateTimeToIso("2026-07-01", "23:15", "Europe/London")).toBe("2026-07-01T22:15:00.000Z");
  });

  it("handles the clock changes: the first of a repeated time, and a skipped time just after the gap", () => {
    // 1 Nov 2026, New York: 01:30 happens twice; the first is EDT (UTC-4).
    expect(zonedDateTimeToIso("2026-11-01", "01:30", "America/New_York")).toBe("2026-11-01T05:30:00.000Z");
    // 8 Mar 2026, New York: 02:30 does not exist; it lands at 03:30 EDT.
    expect(zonedDateTimeToIso("2026-03-08", "02:30", "America/New_York")).toBe("2026-03-08T07:30:00.000Z");
  });

  it("refuses what is not a date or a time, and reads an instant back as its local date and time", () => {
    expect(zonedDateTimeToIso("2026-02-30", "07:30", "UTC")).toBeNull();
    expect(zonedDateTimeToIso("2026-10-10", "", "UTC")).toBeNull();
    expect(zonedDateTimeToIso("2026-10-10", "24:00", "UTC")).toBeNull();
    expect(wallClockAt(Date.parse("2026-10-10T11:30:00.000Z"), "America/New_York")).toEqual({ dateKey: "2026-10-10", time: "07:30" });
  });
});

describe("the shared time axis", () => {
  const axis = progressAxis("2026-10-16");

  it("is eight calendar weeks ending with this one", () => {
    expect(axis).toMatchObject({ firstMonday: "2026-08-24", endKeyExclusive: "2026-10-19", weeks: 8, days: 56, label: "24 Aug – 18 Oct" });
  });

  it("draws only what falls inside it and counts the rest", () => {
    const keys = ["2026-04-16", "2026-08-23", "2026-08-24", "2026-10-18", "2026-10-19", "2026-12-01"];
    expect(splitByAxis(keys, (key) => key, axis)).toEqual({ inside: ["2026-08-24", "2026-10-18"], older: 2, later: 2 });
  });

  it("reads its scale from the values it draws", () => {
    const scale = valueScale([30, 31])!;
    expect([scale.low, scale.high, scale.y(30), scale.y(31)]).toEqual([30, 31, 70, 14]);
    expect(valueScale([30])!.y(30)).toBe(42);
    expect(valueScale([])).toBeNull();
  });
});

// ---------------------------------------------------------------- performance

const set = (weight: number | "", reps: number | "", extra: Partial<DeviceSetLog> = {}): DeviceSetLog => ({ weight: String(weight), reps: String(reps), unit: "lb", completed: true, ...extra });
const session = (id: string, day: string, exercisesIn: DeviceWorkoutSession["exercises"], status: DeviceWorkoutSession["status"] = "completed"): DeviceWorkoutSession => ({
  id, title: "Pull", dayLabel: "Pull", startedAt: `${day}T17:00:00.000Z`, completedAt: `${day}T18:00:00.000Z`, status, weightUnit: "lb", exercises: exercisesIn,
});
const exercise = (id: string, name: string, catalogId: number | undefined, sets: DeviceSetLog[]) => ({ id, exerciseName: name, ...(catalogId !== undefined ? { catalogId } : {}), plannedPrescription: "3 × 10", sets });
const input = (side: "left" | "right" = "right", weightUnit: "lb" | "kg" = "lb") => ({ data: forearmRegionData, side, weightUnit, timeZone: "UTC", catalog: exercises });

describe("comparable exercise performance", () => {
  it("offers only exercises with a reviewed, direct mapping to a node of the region", () => {
    const ids = directlyMappedCatalogIds(forearmRegionData);
    expect(ids.has(132)).toBe(true); // Hammer Curl: brachioradialis, direct
    expect(ids.has(139)).toBe(true); // Wrist Curl
    expect(ids.has(121)).toBe(false); // Barbell Curl: the biceps (another region) is its direct work
    expect(ids.has(43)).toBe(false); // Barbell Row: grip is incidental
  });

  it("matches by catalog id only, never by name, and reads finished workouts only", () => {
    const series = performanceSeries([
      session("a", "2026-10-01", [exercise("e1", "Wrist Curl", undefined, [set(40, 12)]), exercise("e2", "My hammers", 132, [set(30, 10)])]),
      session("b", "2026-10-08", [exercise("e1", "Wrist Curl", undefined, [set(45, 12)])]),
      session("c", "2026-10-09", [exercise("e2", "Hammer Curl", 132, [set(30, 12)])], "active"),
    ], input());
    expect(series.map((item) => [item.catalogExerciseId, item.name, item.points.length])).toEqual([[132, "Hammer Curl", 1]]);
  });

  it("takes the top set of each session: heaviest, then most reps, completed only, in the profile's unit", () => {
    const series = performanceSeries([
      session("a", "2026-10-01", [exercise("e", "Hammer Curl", 132, [set(30, 12), set(35, 8), set(35, 10), set(50, 5, { completed: false, skipped: true }), set(60, 5, { completed: false }), set(70, 3, { warmup: true })])]),
      session("b", "2026-10-08", [exercise("e", "Hammer Curl", 132, [set(20, 8, { unit: "kg" })])]),
    ], input())[0];
    expect(series.metric).toBe("load");
    expect(series.points.map((point) => formatPerformance(point, series, "lb"))).toEqual(["35 lb × 10", "44.09 lb × 8"]);
    const inKg = performanceSeries([session("a", "2026-10-01", [exercise("e", "Hammer Curl", 132, [set(35, 10)])])], input("right", "kg"))[0];
    expect(formatPerformance(inKg.points[0], inKg, "kg")).toBe("15.88 kg × 10");
  });

  it("keeps the other arm out, counts a both-arms set for either arm, and keeps an unrecorded side but marks it", () => {
    // One-Arm Dumbbell Wrist Curl is done one arm at a time, so a set without a side is unknown.
    const history = [
      session("a", "2026-10-01", [exercise("e", "One-Arm Dumbbell Wrist Curl", 410, [set(25, 12, { side: "right" }), set(40, 12, { side: "left" })])]),
      session("b", "2026-10-05", [exercise("e", "One-Arm Dumbbell Wrist Curl", 410, [set(27.5, 10)])]),
      session("c", "2026-10-09", [exercise("e", "One-Arm Dumbbell Wrist Curl", 410, [set(30, 8, { side: "both" })])]),
    ];
    const right = performanceSeries(history, input("right"))[0];
    expect(right.points.map((point) => [point.load, point.sideUnrecorded])).toEqual([[25, false], [27.5, true], [30, false]]);
    const left = performanceSeries(history, input("left"))[0];
    expect(left.points.map((point) => point.load)).toEqual([40, 27.5, 30]);
  });

  it("reads a hold exercise as its longest hold, and a two-handed exercise without a side as both arms", () => {
    const series = performanceSeries([
      session("a", "2026-10-01", [exercise("e", "Dead Hang", 143, [set("", "", { holdSeconds: "40" }), set("", "", { holdSeconds: "55" })])]),
      session("b", "2026-10-08", [exercise("e", "Dead Hang", 143, [set(10, "", { holdSeconds: "30" })])]),
    ], input())[0];
    expect(series.metric).toBe("seconds");
    expect(series.points.map((point) => [formatPerformance(point, series, "lb"), point.sideUnrecorded])).toEqual([["55 s", false], ["30 s with 10 lb", false]]);
  });

  it("keeps sessions logged with straps on a line of their own", () => {
    const series = performanceSeries([
      session("a", "2026-10-01", [{ ...exercise("e", "Farmer Hold", 145, [set(100, "", { holdSeconds: "40" })]), straps: "yes" as const }]),
      session("b", "2026-10-08", [exercise("e", "Farmer Hold", 145, [set(100, "", { holdSeconds: "35" })])]),
    ], input());
    expect(series.map((item) => [item.key, item.straps, item.points.length]).sort()).toEqual([["145", false, 1], ["145:straps", true, 1]]);
  });
});
