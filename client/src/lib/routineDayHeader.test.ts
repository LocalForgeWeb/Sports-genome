import { describe, expect, it } from "vitest";
import { isRoutineDayHeader, routineDayLabel } from "@/lib/routineDayHeader";

describe("recognising the start of a pasted training day", () => {
  it("accepts the split names the app plans with", () => {
    for (const line of ["Push", "Pull", "Legs", "Upper", "Lower", "Full Body", "Sport Transfer", "Push Day", "Lower day:"]) {
      expect(isRoutineDayHeader(line), line).toBe(true);
    }
  });

  /** The way a four-day week is actually written down, and the case that used to fold four days into one. */
  it("accepts a split name carrying an A/B or numbered marker", () => {
    for (const line of ["Upper A", "Upper B", "Lower A", "Push 1", "Pull 2", "Legs II", "Upper Body A"]) {
      expect(isRoutineDayHeader(line), line).toBe(true);
    }
  });

  it("accepts body-part day names and the joined pairs athletes write", () => {
    for (const line of ["Arms", "Chest", "Back", "Shoulders", "Chest & Triceps", "Back and Biceps", "Legs + Core", "Posterior Chain"]) {
      expect(isRoutineDayHeader(line), line).toBe(true);
    }
  });

  it("accepts numbered days and weekdays, with or without a split name", () => {
    for (const line of ["Day 1", "Day 2 — Upper", "Day 3: Legs", "Monday", "Wednesday — Push", "Week 2 Day 1 — Pull"]) {
      expect(isRoutineDayHeader(line), line).toBe(true);
    }
  });

  /**
   * The risk in widening the rule is swallowing an exercise. "Back" is a day, "Back Squat"
   * is a lift, and a heading that eats the first exercise of its own day is worse than one
   * that misses the heading.
   */
  it("never treats an exercise line as the start of a day", () => {
    for (const line of [
      "Back Squat", "Back Squat — 4 x 5", "Barbell Bench Press", "Chest Fly 3 x 12",
      "Leg Press — 3 x 12", "Arms: Barbell Curl 3 x 12", "Push Press 5 x 3", "Upper Cable Row",
      "Romanian Deadlift 3 x 8 @ RPE 8", "Farmer's Walk — 3 x 40 m",
    ]) {
      expect(isRoutineDayHeader(line), line).toBe(false);
    }
  });

  it("ignores prose, set instructions and anything long enough to be a note", () => {
    for (const line of [
      "Warm-up: band shoulder series",
      "Set 1: 10 reps, controlled tempo",
      "Rest 2-3 minutes between the heavy sets and keep the bar speed honest",
      "",
      "Notes",
    ]) {
      expect(isRoutineDayHeader(line), line).toBe(false);
    }
  });
});

describe("naming a pasted training day", () => {
  it("keeps the marker that tells two days of the same family apart", () => {
    expect(routineDayLabel("Upper A")).toBe("Upper A");
    expect(routineDayLabel("Upper B")).toBe("Upper B");
  });

  it("drops the scaffolding around the name", () => {
    expect(routineDayLabel("Push Day")).toBe("Push");
    expect(routineDayLabel("Day 2 — Upper")).toBe("Upper");
    expect(routineDayLabel("Day 3: Legs")).toBe("Legs");
    expect(routineDayLabel("Week 2 Day 1 — Pull")).toBe("Pull");
    expect(routineDayLabel("Lower day:")).toBe("Lower");
  });

  it("keeps a bare numbered day addressable rather than returning nothing", () => {
    expect(routineDayLabel("Day 1")).toBe("Day 1");
    expect(routineDayLabel("Monday")).toBe("Monday");
  });
});
