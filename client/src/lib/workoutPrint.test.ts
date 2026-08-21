import { describe, expect, it } from "vitest";
import { getPrintableTrackingLines, getPrintableWorkoutRows } from "./workoutPrint";
import type { Exercise } from "./exerciseCatalog";

const exercise: Exercise = { id: 1, name: "Cable Serratus Punch", category: "Shoulders & posture", primaryMuscles: ["serratusAnterior"], secondaryMuscles: ["chest"], movement: "Scapular protraction", equipment: "Cable", qualities: ["scapularControl"], sportFit: { Boxing: "A" } };

describe("printable workout rows", () => {
  it("keeps the selected prescription and coaching fields in a print-safe row", () => {
    expect(getPrintableWorkoutRows([exercise], { 1: "4 × 10–12" }, { 1: { rpe: "RPE 8", rest: "75 sec", notes: "Pause at full reach", completed: false } })).toMatchObject([{ order: 1, prescription: "4 × 10–12", rpe: "RPE 8", rest: "75 sec", notes: "Pause at full reach", trackingLines: ["Set 1: load / reps __________________", "Set 2: load / reps __________________", "Set 3: load / reps __________________", "Set 4: load / reps __________________"] }]);
  });

  it("uses timed round labels for timed prescriptions", () => {
    expect(getPrintableTrackingLines("4 × 30 sec")).toEqual(["Round 1: time / quality __________________", "Round 2: time / quality __________________", "Round 3: time / quality __________________", "Round 4: time / quality __________________"]);
  });
});
