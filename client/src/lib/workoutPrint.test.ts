import { describe, expect, it } from "vitest";
import { buildWorkoutShareText, getPrintableTrackingLines, getPrintableWorkoutRows } from "./workoutPrint";
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

describe("buildWorkoutShareText", () => {
  const squat: Exercise = { ...exercise, id: 1, name: "Back Squat", primaryMuscles: ["quads"] };
  const plank: Exercise = { ...exercise, id: 2, name: "Plank", primaryMuscles: ["core"] };
  const rows = getPrintableWorkoutRows(
    [squat, plank],
    { 1: "3 × 5", 2: "2 × 45 sec" },
    { 1: { rpe: "RPE 8", rest: "3 min", notes: "belt on top set" } }
  );
  const text = buildWorkoutShareText(rows, { dayLabel: "Week 1 · Lower", goal: "strength", sport: "Rugby" });

  it("leads with the day, goal, and sport", () => {
    expect(text.split("\n")[0]).toBe("Week 1 · Lower");
    expect(text).toContain("Goal: strength");
    expect(text).toContain("Sport: Rugby");
  });

  it("numbers exercises in plan order", () => {
    expect(text).toContain("01. Back Squat");
    expect(text).toContain("02. Plank");
  });

  it("carries the prescription and per-exercise notes", () => {
    expect(text).toContain("3 × 5 · RPE 8 · 3 min rest");
    expect(text).toContain("Note: belt on top set");
  });

  it("keeps the blank tracking lines someone writes loads into", () => {
    // These are the reason the sheet exists; dropping them would make the
    // shared version useless at the rack.
    expect(text).toContain("Set 1: load / reps");
    expect(text).toContain("Set 3: load / reps");
    // "3 × 5" is three sets of five reps, so there is no fourth line.
    expect(text).not.toContain("Set 4: load / reps");
  });

  it("uses round wording for timed work", () => {
    expect(text).toContain("Round 1: time / quality");
  });

  it("omits the note line for an exercise without one", () => {
    expect(text).not.toContain("Note: \n");
  });
});
