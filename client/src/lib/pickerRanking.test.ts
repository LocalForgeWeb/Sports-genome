import { describe, expect, it } from "vitest";
import { pickerGapTargets, rankPickerResults, type GapTarget } from "@/lib/pickerRanking";
import type { CoverageBar } from "@/lib/stackCoverageVisual";
import type { Exercise } from "@/lib/exerciseCatalog";

const bar = (over: Partial<CoverageBar> = {}): CoverageBar => ({
  muscle: "chest", role: "primary", band: "short", fillPercent: 20, targetPercent: 60, deltaToTarget: -34, ...over,
});

const exercise = (name: string, primary: string[], secondary: string[] = []): Exercise => ({
  id: name.length, name, sourceGroup: "", category: "", equipment: "barbell", movement: "",
  primaryMuscles: primary, secondaryMuscles: secondary, qualities: [], muscleGrade: "A", sportFit: {},
} as Exercise);

const gaps: GapTarget[] = [
  { muscle: "serratusAnterior", deltaToTarget: -35, band: "short" },
  { muscle: "chest", deltaToTarget: -34, band: "short" },
];

describe("pickerGapTargets", () => {
  it("offers only the targets actually under their mark", () => {
    const targets = pickerGapTargets([bar(), bar({ muscle: "triceps", deltaToTarget: 11 })]);
    expect(targets.map((target) => target.muscle)).toEqual(["chest"]);
  });

  it("puts the worst shortfall first, since that is what to fix first", () => {
    const targets = pickerGapTargets([bar(), bar({ muscle: "serratusAnterior", deltaToTarget: -35 })]);
    expect(targets[0].muscle).toBe("serratusAnterior");
  });

  it("carries the band, so Short can outrank Close in the interface", () => {
    const targets = pickerGapTargets([bar({ band: "near", deltaToTarget: -8 })]);
    expect(targets[0].band).toBe("near");
  });

  it("returns nothing when every target is covered", () => {
    expect(pickerGapTargets([bar({ deltaToTarget: 25 })])).toEqual([]);
  });
});

describe("rankPickerResults", () => {
  const results = [
    exercise("Archer Push-Up", ["chest"]),
    exercise("Arnold Press", ["frontDelts"]),
    exercise("Cable Serratus Punch", ["serratusAnterior"]),
    exercise("Triceps Pushdown", ["triceps"], ["chest"]),
  ];

  it("leads with direct work on the worst gap", () => {
    // Alphabetically this was fourth of eighty-four.
    expect(rankPickerResults(results, gaps)[0].exercise.name).toBe("Cable Serratus Punch");
  });

  it("ranks direct work on any gap above supporting work on a worse one", () => {
    // A primary tag is what moves a target; a secondary tag barely does.
    const order = rankPickerResults(results, gaps).map((result) => result.exercise.name);
    expect(order.indexOf("Archer Push-Up")).toBeLessThan(order.indexOf("Triceps Pushdown"));
  });

  it("puts supporting work on a gap above an exercise that touches no gap", () => {
    const order = rankPickerResults(results, gaps).map((result) => result.exercise.name);
    expect(order.indexOf("Triceps Pushdown")).toBeLessThan(order.indexOf("Arnold Press"));
  });

  it("names which gap an option would close", () => {
    const [first] = rankPickerResults(results, gaps);
    expect(first.fillsGap?.muscle).toBe("serratusAnterior");
    expect(first.fillsGap?.deltaToTarget).toBe(-35);
  });

  it("marks supporting work as supporting, not as filling the gap", () => {
    const pushdown = rankPickerResults(results, gaps).find((result) => result.exercise.name === "Triceps Pushdown");
    expect(pushdown?.fillsGap).toBeNull();
    expect(pushdown?.supportsGap?.muscle).toBe("chest");
  });

  it("hides nothing - every option survives the ranking", () => {
    expect(rankPickerResults(results, gaps)).toHaveLength(results.length);
  });

  it("keeps the incoming order among equals, so search and filters still decide", () => {
    const noGaps = rankPickerResults(results, []);
    expect(noGaps.map((result) => result.exercise.name)).toEqual(results.map((item) => item.name));
  });

  it("is stable for options in the same tier", () => {
    const twoChest = [exercise("Zebra Press", ["chest"]), exercise("Alpha Press", ["chest"])];
    expect(rankPickerResults(twoChest, gaps).map((result) => result.exercise.name)).toEqual(["Zebra Press", "Alpha Press"]);
  });

  it("does nothing at all when the stack has no shortfall", () => {
    const ranked = rankPickerResults(results, []);
    expect(ranked.every((result) => result.fillsGap === null && result.supportsGap === null)).toBe(true);
  });
});
