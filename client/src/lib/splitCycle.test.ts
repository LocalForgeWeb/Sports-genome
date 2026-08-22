import { describe, expect, it } from "vitest";
import { cycleSplitIndex, splitDaysForFrequency } from "./splitCycle";

describe("adaptive split cycling", () => {
  it("uses frequency-appropriate split sequences from one through seven training days", () => {
    expect(splitDaysForFrequency(1)).toEqual(["Full Body"]);
    expect(splitDaysForFrequency(3)).toEqual(["Push", "Pull", "Legs"]);
    expect(splitDaysForFrequency(5)).toEqual(["Push", "Pull", "Legs", "Upper", "Sport Transfer"]);
    expect(splitDaysForFrequency(7)).toContain("Sport Transfer");
  });

  it("cycles forward and backward through repeated day labels by index", () => {
    const days = splitDaysForFrequency(4);
    expect(cycleSplitIndex(days, 2, 1)).toBe(3);
    expect(cycleSplitIndex(days, 3, 1)).toBe(0);
    expect(cycleSplitIndex(days, 0, -1)).toBe(3);
  });
});
