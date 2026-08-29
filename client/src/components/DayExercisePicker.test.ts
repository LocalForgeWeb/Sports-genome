import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./DayExercisePicker.tsx", import.meta.url), "utf8");

describe("Training Day exercise finder disclosure", () => {
  it("keeps Stack Analysis separately reachable while hiding the full catalog toolset behind one clear finder control", () => {
    expect(source).toContain("<RateStackPanel");
    expect(source).toContain('<details className="day-exercise-disclosure">');
    expect(source).toContain("Find an exercise");
    expect(source).toContain("Search, filter, then add from the catalog");
  });

  it("retains split scope, muscle, equipment, inspection, and add behavior inside the disclosure", () => {
    expect(source).toContain('aria-label="Filter day exercises by muscle group"');
    expect(source).toContain('aria-label="Filter day exercises by equipment"');
    expect(source).toContain('setScope("all")');
    expect(source).toContain("onInspect(exercise)");
    expect(source).toContain("onAdd(exercise)");
  });

  it("prioritizes direct muscle matches and makes the number of matching catalog options visible before an athlete scans results", () => {
    expect(source).toContain("export function sortDayExerciseResults");
    expect(source).toContain("Direct target");
    expect(source).toContain("matching options");
    expect(source).toContain("Show more options");
  });
});
