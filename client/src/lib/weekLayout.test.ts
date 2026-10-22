import { describe, expect, it } from "vitest";
import { splitDaysForFrequency } from "./splitCycle";
import { dayTypes, describeDays, matchingPreset, readDayLayout, resolveSplit, splitPresets, withDayType } from "./weekLayout";

/**
 * The athlete's own week (owner, 22 Oct 2026): any day can be any kind of day, five Upper days
 * included, and the common splits are all offered ready-made.
 */
describe("the week's layout", () => {
  it("offers every kind of day the app can build", () => {
    expect([...dayTypes].sort()).toEqual(["Full Body", "Legs", "Lower", "Pull", "Push", "Sport Transfer", "Upper"]);
  });

  it("reads only a layout it can use", () => {
    expect(readDayLayout(["Upper", "Upper"])).toEqual(["Upper", "Upper"]);
    expect(readDayLayout(["Upper", "Arms"])).toBeNull();
    expect(readDayLayout([])).toBeNull();
    expect(readDayLayout(Array(8).fill("Upper"))).toBeNull();
    expect(readDayLayout("Upper")).toBeNull();
    expect(readDayLayout(undefined)).toBeNull();
  });

  it("is the suggestion until the athlete chooses, then their choice day by day", () => {
    expect(resolveSplit(4, null)).toEqual(splitDaysForFrequency(4));
    expect(resolveSplit(5, ["Upper", "Upper", "Upper", "Upper", "Upper"])).toEqual(["Upper", "Upper", "Upper", "Upper", "Upper"]);
    // Fewer days: the first ones. More days than were chosen: the suggestion fills the rest.
    expect(resolveSplit(3, ["Upper", "Upper", "Upper", "Upper", "Upper"])).toEqual(["Upper", "Upper", "Upper"]);
    expect(resolveSplit(5, ["Legs", "Legs"])).toEqual(["Legs", "Legs", ...splitDaysForFrequency(5).slice(2)]);
  });

  it("changes one day and keeps what the days past this week held", () => {
    expect(withDayType(["Upper", "Lower", "Upper"], null, 1, "Upper")).toEqual(["Upper", "Upper", "Upper"]);
    expect(withDayType(["Upper", "Lower"], ["Upper", "Lower", "Push", "Pull"], 0, "Legs")).toEqual(["Legs", "Lower", "Push", "Pull"]);
  });

  it("names the common splits, each once, and marks the suggestion on the one it is", () => {
    const four = splitPresets(4);
    expect(four.map((preset) => preset.name)).toEqual(["Full body", "Upper / Lower", "Push / Pull / Legs", "Push / Pull / Legs + Upper / Lower", "Upper / Lower / Full body", "Upper every day", "Lower every day"]);
    expect(four.filter((preset) => preset.suggested).map((preset) => preset.name)).toEqual(["Upper / Lower"]);
    for (const days of [1, 2, 3, 4, 5, 6, 7]) {
      const presets = splitPresets(days);
      expect(new Set(presets.map((preset) => preset.days.join("|"))).size, `${days} days`).toBe(presets.length);
      expect(presets.every((preset) => preset.days.length === days)).toBe(true);
      expect(presets.filter((preset) => preset.suggested)).toHaveLength(1);
    }
  });

  it("offers the suggestion first when it is none of the named splits", () => {
    const five = splitPresets(5);
    expect(five[0]).toEqual({ id: "suggested", name: "Suggested", days: splitDaysForFrequency(5), suggested: true });
    expect(five.find((preset) => preset.name === "Upper every day")?.days).toEqual(["Upper", "Upper", "Upper", "Upper", "Upper"]);
  });

  it("knows which ready-made week a layout is, and says it short", () => {
    expect(matchingPreset(["Push", "Pull", "Legs"])?.name).toBe("Push / Pull / Legs");
    expect(matchingPreset(["Push", "Legs", "Pull"])).toBeNull();
    expect(describeDays(["Upper", "Full Body", "Sport Transfer"])).toBe("Upper · Full body · Sport");
  });
});
