import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import type { DayRecord } from "@/lib/trainingDayPlan";
import { applyPlanChangeToRecord } from "./planChange";

const byId = (id: number) => exercises.find((exercise) => exercise.id === id)!;
const day = (): DayRecord => ({
  workout: [byId(132), byId(139)],
  prescriptions: { 132: "3 × 10–12", 139: "4 × 15" },
  settings: { 139: { rest: "60 sec", notes: "slow", completed: false } },
  context: [],
});
const change = { week: 2, slotIndex: 1, dayKey: "1-Pull", catalogExerciseId: 140 };

describe("an add or swap from the specialization page, on one exact day (brief §7)", () => {
  it("adds to the end with the given prescription and touches nothing else", () => {
    const outcome = applyPlanChangeToRecord(day(), { ...change, prescription: "3 × 20" }, byId(140), "3 × 8–12");
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.record.workout.map((exercise) => exercise.id)).toEqual([132, 139, 140]);
    expect(outcome.record.prescriptions).toEqual({ 132: "3 × 10–12", 139: "4 × 15", 140: "3 × 20" });
    expect(outcome.record.settings).toEqual(day().settings);
  });

  it("swaps in place and keeps the replaced exercise's prescription and settings", () => {
    const outcome = applyPlanChangeToRecord(day(), { ...change, replaceEntryId: 139 }, byId(140), "3 × 8–12");
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.record.workout.map((exercise) => exercise.id)).toEqual([132, 140]);
    expect(outcome.record.prescriptions).toEqual({ 132: "3 × 10–12", 140: "4 × 15" });
    expect(outcome.record.settings).toEqual({ 140: { rest: "60 sec", notes: "slow", completed: false } });
    expect(outcome.summary).toBe("Swapped Wrist Curl for Reverse Wrist Curl");
  });

  it("refuses an exercise the day already has, and a swap whose exercise has gone", () => {
    expect(applyPlanChangeToRecord(day(), { ...change, catalogExerciseId: 132 }, byId(132), "3 × 8")).toEqual({ ok: false, reason: "Hammer Curl is already in that day." });
    expect(applyPlanChangeToRecord(day(), { ...change, replaceEntryId: 999 }, byId(140), "3 × 8")).toEqual({ ok: false, reason: "The exercise to swap out is no longer in that day." });
  });

  it("never edits the record it was given (the preview reads it before saving)", () => {
    const record = day();
    const snapshot = JSON.stringify(record);
    applyPlanChangeToRecord(record, { ...change, replaceEntryId: 139 }, byId(140), "3 × 8");
    expect(JSON.stringify(record)).toBe(snapshot);
  });
});
