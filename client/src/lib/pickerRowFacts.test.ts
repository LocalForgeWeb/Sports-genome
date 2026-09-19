import { describe, expect, it } from "vitest";
import {
  distinguishingMuscles,
  gapTagIsInformative,
  muscleLineIsInformative,
  rowRelation,
} from "@/lib/pickerRowFacts";
import type { Exercise } from "@/lib/exerciseCatalog";
import type { GapTarget } from "@/lib/pickerRanking";

const gap: GapTarget = { muscle: "chest", deltaToTarget: -90, band: "short" };
const otherGap: GapTarget = { muscle: "frontDelts", deltaToTarget: -40, band: "short" };
const exercise = (primary: string[]): Exercise => ({
  id: primary.length, name: "x", sourceGroup: "", category: "", equipment: "barbell", movement: "",
  primaryMuscles: primary, secondaryMuscles: [], qualities: [], muscleGrade: "A", sportFit: {},
} as Exercise);

describe("rowRelation", () => {
  it("reads a row by how it answers the day's shortfall", () => {
    expect(rowRelation({ fillsGap: gap, supportsGap: null })).toBe("fills");
    expect(rowRelation({ fillsGap: null, supportsGap: gap })).toBe("supports");
    expect(rowRelation({ fillsGap: null, supportsGap: null })).toBe("other");
  });
});

describe("gapTagIsInformative", () => {
  it("is false when every visible row says the same thing", () => {
    // The reported screen: an empty Push day, where all 24 options close the
    // same gap, so all 24 carried "Closes Pectoralis major, 90 short".
    const allFill = Array.from({ length: 24 }, () => ({ fillsGap: gap, supportsGap: null }));
    expect(gapTagIsInformative(allFill)).toBe(false);
  });

  it("is true once rows differ, which is when the tag decides something", () => {
    expect(gapTagIsInformative([
      { fillsGap: gap, supportsGap: null },
      { fillsGap: null, supportsGap: gap },
    ])).toBe(true);
  });

  it("is true when some rows answer no shortfall at all", () => {
    expect(gapTagIsInformative([
      { fillsGap: gap, supportsGap: null },
      { fillsGap: null, supportsGap: null },
    ])).toBe(true);
  });

  it("says nothing about a single row, which has no neighbours to differ from", () => {
    expect(gapTagIsInformative([{ fillsGap: gap, supportsGap: null }])).toBe(false);
    expect(gapTagIsInformative([])).toBe(false);
  });
});

describe("distinguishingMuscles", () => {
  it("drops what the list header already states", () => {
    expect(distinguishingMuscles(exercise(["chest", "triceps"]), ["chest"])).toEqual(["triceps"]);
  });

  it("leaves nothing when the exercise only hits what was asked for", () => {
    expect(distinguishingMuscles(exercise(["chest"]), ["chest"])).toEqual([]);
  });

  it("keeps everything when the list is not sorted by a muscle", () => {
    expect(distinguishingMuscles(exercise(["chest", "triceps"]), [])).toEqual(["chest", "triceps"]);
  });
});

describe("muscleLineIsInformative", () => {
  it("is false when every row reduces to the same remainder", () => {
    const rows = [exercise(["chest", "triceps"]), exercise(["chest", "triceps"])];
    expect(muscleLineIsInformative(rows, ["chest"])).toBe(false);
  });

  it("is false when the remainder is empty for every row", () => {
    // Twenty-four rows all reading "PECTORALIS MAJOR" under a header that
    // already says Pectoralis major first.
    const rows = Array.from({ length: 24 }, () => exercise(["chest"]));
    expect(muscleLineIsInformative(rows, ["chest"])).toBe(false);
  });

  it("is true once the remainder tells two rows apart", () => {
    const rows = [exercise(["chest", "triceps"]), exercise(["chest", "frontDelts"])];
    expect(muscleLineIsInformative(rows, ["chest"])).toBe(true);
  });

  it("is true when some rows carry extra work and others do not", () => {
    expect(muscleLineIsInformative([exercise(["chest"]), exercise(["chest", "triceps"])], ["chest"])).toBe(true);
  });
});
