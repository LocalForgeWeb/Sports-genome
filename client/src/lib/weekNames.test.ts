import { describe, expect, it } from "vitest";
import { cleanWeekName, readWeekNames, storedWeekNames, weekLabel, weekNameMaxLength, withWeekName } from "./weekNames";

describe("week names", () => {
  it("tidies a typed name: trims, folds spaces and line breaks, and caps the length", () => {
    expect(cleanWeekName("  Heavy   week \n 1 ")).toBe("Heavy week 1");
    expect(cleanWeekName("   ")).toBe("");
    const long = cleanWeekName("A".repeat(40));
    expect(long).toHaveLength(weekNameMaxLength);
    // Counted in characters, so an emoji is never cut in half.
    expect(Array.from(cleanWeekName("🔥".repeat(30)))).toHaveLength(weekNameMaxLength);
  });

  it("reads only the names of Week 1 to 3 from a saved plan, and nothing malformed", () => {
    expect(readWeekNames({ "1": " Heavy ", "2": "", "3": 7, "4": "Extra" })).toEqual({ 1: "Heavy" });
    expect(readWeekNames(undefined)).toEqual({});
    expect(readWeekNames(["Heavy"])).toEqual({});
    expect(readWeekNames("Heavy")).toEqual({});
  });

  it("sets, renames and removes one week's name, and keeps the same object when nothing changes", () => {
    const named = withWeekName({}, 2, "Deload");
    expect(named).toEqual({ 2: "Deload" });
    expect(withWeekName(named, 2, " Deload ")).toBe(named);
    expect(withWeekName(named, 2, "Peak")).toEqual({ 2: "Peak" });
    expect(withWeekName(named, 2, "  ")).toEqual({});
    expect(withWeekName(named, 1, "Heavy")).toEqual({ 1: "Heavy", 2: "Deload" });
    expect(named).toEqual({ 2: "Deload" });
  });

  it("saves nothing until a week has a name, so an unnamed plan is written as before", () => {
    expect(storedWeekNames({})).toBeUndefined();
    expect(storedWeekNames({ 3: "Peak", 1: "Heavy" })).toEqual({ "1": "Heavy", "3": "Peak" });
  });

  it("puts the name beside the number, never in place of it", () => {
    expect(weekLabel(2, { 2: "Deload" })).toBe("Week 2: Deload");
    expect(weekLabel(1, { 2: "Deload" })).toBe("Week 1");
    expect(weekLabel(3)).toBe("Week 3");
  });
});
