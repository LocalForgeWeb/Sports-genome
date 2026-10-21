import { describe, expect, it } from "vitest";
import { cycleSplitIndex, effectiveSplit, isRecommendedSplit, isSplitDay, readStoredSplit, splitDayTypes, splitDaysForFrequency, splitPresets, type SplitDay } from "./splitCycle";

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

describe("the athlete's own split", () => {
  it("is the recommended split until the athlete picks days", () => {
    expect(effectiveSplit(3, null)).toEqual(["Push", "Pull", "Legs"]);
    expect(effectiveSplit(4, [])).toEqual(["Upper", "Lower", "Upper", "Lower"]);
  });

  it("keeps the chosen days position by position, whatever the frequency would have picked", () => {
    expect(effectiveSplit(3, ["Upper", "Lower", "Full Body"])).toEqual(["Upper", "Lower", "Full Body"]);
    expect(effectiveSplit(2, ["Push", "Push"])).toEqual(["Push", "Push"]);
  });

  it("keeps what still fits when the week gets shorter and fills new days from the recommendation", () => {
    const chosen: SplitDay[] = ["Full Body", "Lower", "Full Body", "Pull"];
    expect(effectiveSplit(2, chosen)).toEqual(["Full Body", "Lower"]);
    // Day 05 was never chosen, so it is the five-day recommendation's fifth day.
    expect(effectiveSplit(5, chosen)).toEqual(["Full Body", "Lower", "Full Body", "Pull", "Sport Transfer"]);
  });

  it("knows a recommended week, so only a chosen one is stored", () => {
    expect(isRecommendedSplit(["Push", "Pull", "Legs"])).toBe(true);
    expect(isRecommendedSplit(["Upper", "Lower", "Upper", "Lower"])).toBe(true);
    expect(isRecommendedSplit(["Upper", "Lower", "Full Body"])).toBe(false);
    expect(isRecommendedSplit(["Push", "Pull"])).toBe(false);
  });

  it("reads a stored split only when every day is a real day type and the week is one to seven days", () => {
    expect(readStoredSplit(["Upper", "Lower"])).toEqual(["Upper", "Lower"]);
    expect(readStoredSplit(["Upper", "Arms"])).toBeNull();
    expect(readStoredSplit([])).toBeNull();
    expect(readStoredSplit(Array(8).fill("Push"))).toBeNull();
    expect(readStoredSplit("Push")).toBeNull();
    expect(readStoredSplit(undefined)).toBeNull();
  });

  it("offers every day type, and presets built only from them", () => {
    expect(new Set(splitDayTypes)).toEqual(new Set(["Push", "Pull", "Legs", "Upper", "Lower", "Full Body", "Sport Transfer"]));
    for (const preset of splitPresets) {
      expect(preset.days.every(isSplitDay), preset.id).toBe(true);
      expect(preset.days.length, preset.id).toBeLessThanOrEqual(7);
    }
    expect(new Set(splitPresets.map((preset) => preset.id)).size).toBe(splitPresets.length);
  });
});
