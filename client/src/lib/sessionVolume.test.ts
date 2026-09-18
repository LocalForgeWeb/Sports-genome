import { describe, expect, it } from "vitest";
import {
  getSessionMuscleVolume,
  parseSetCount,
  volumeOutliers,
  volumeReadingCopy,
  defaultSetsPerExercise,
} from "@/lib/sessionVolume";
import { logicCalibration } from "@/lib/evidenceTraceability";
import type { Exercise } from "@/lib/exerciseCatalog";

const exercise = (over: Partial<Exercise> = {}): Exercise => ({
  id: 1,
  name: "Barbell Bench Press",
  sourceGroup: "",
  category: "",
  equipment: "barbell",
  movement: "Horizontal push",
  primaryMuscles: ["chest"],
  secondaryMuscles: ["triceps"],
  qualities: [],
  muscleGrade: "A",
  sportFit: {},
  ...over,
} as Exercise);

describe("parseSetCount", () => {
  it("reads the leading set count from a prescription", () => {
    expect(parseSetCount("4 x 8 @ RPE 8")).toBe(4);
  });

  it("falls back for a prescription with no leading count", () => {
    expect(parseSetCount("as many as possible")).toBe(defaultSetsPerExercise);
    expect(parseSetCount(undefined)).toBe(defaultSetsPerExercise);
  });

  it("never returns zero, which would erase the exercise from the count", () => {
    expect(parseSetCount("0 x 10")).toBe(defaultSetsPerExercise);
  });
});

describe("getSessionMuscleVolume", () => {
  it("counts direct sets on the primary muscle", () => {
    const [top] = getSessionMuscleVolume([exercise()], () => 4);
    expect(top).toMatchObject({ muscle: "chest", directSets: 4 });
  });

  it("counts supporting work at the register's half-set convention", () => {
    const volumes = getSessionMuscleVolume([exercise()], () => 4);
    const triceps = volumes.find((entry) => entry.muscle === "triceps");
    expect(triceps?.supportSets).toBe(4 * logicCalibration.exposure.secondarySetConvention);
  });

  it("never double-counts a muscle listed as both primary and secondary", () => {
    const volumes = getSessionMuscleVolume([exercise({ secondaryMuscles: ["chest", "triceps"] })], () => 3);
    const chest = volumes.find((entry) => entry.muscle === "chest");
    expect(chest?.supportSets).toBe(0);
    expect(chest?.directSets).toBe(3);
  });

  it("calls out a muscle getting only indirect work", () => {
    const triceps = getSessionMuscleVolume([exercise()], () => 3).find((entry) => entry.muscle === "triceps");
    expect(triceps?.reading).toBe("indirect-only");
    expect(triceps?.note).toContain("no direct work");
  });

  it("calls a single session carrying the whole weekly high mark heavy", () => {
    const [top] = getSessionMuscleVolume([exercise()], () => logicCalibration.exposure.highDirectSetBand);
    expect(top.reading).toBe("heavy");
    expect(top.note).toContain("high-exposure mark for a whole week");
  });

  it("calls a session clearing the established mark on its own solid", () => {
    const [top] = getSessionMuscleVolume([exercise()], () => logicCalibration.exposure.lowDirectSetBand);
    expect(top.reading).toBe("solid");
  });

  it("calls a small amount light", () => {
    const [top] = getSessionMuscleVolume([exercise()], () => 2);
    expect(top.reading).toBe("light");
  });

  it("says what weekly frequency the session's own volume implies, rather than guessing one", () => {
    // Nothing here knows how often this split recurs, so the note is arithmetic
    // the athlete can check, not a prediction about their week.
    const [top] = getSessionMuscleVolume([exercise()], () => 3);
    expect(top.sessionsForEstablished).toBe(2);
    expect(top.note).toContain("2× a week");
  });

  it("does not tell an athlete to repeat a session that already clears the mark", () => {
    const [top] = getSessionMuscleVolume([exercise()], () => 6);
    expect(top.note).not.toContain("× a week");
  });

  it("adds up sets across exercises sharing a muscle", () => {
    const [top] = getSessionMuscleVolume([exercise(), exercise({ id: 2, name: "Incline Press" })], () => 3);
    expect(top.directSets).toBe(6);
  });

  it("orders by direct work, so what is actually trained leads", () => {
    const volumes = getSessionMuscleVolume([exercise()], () => 4);
    expect(volumes[0].muscle).toBe("chest");
  });

  it("returns nothing for an empty session rather than inventing a row", () => {
    expect(getSessionMuscleVolume([])).toEqual([]);
  });

  it("gives every reading a word and a glyph, so colour is never the only cue", () => {
    for (const reading of ["none", "indirect-only", "light", "solid", "heavy"] as const) {
      expect(volumeReadingCopy[reading].label.length).toBeGreaterThan(0);
      expect(volumeReadingCopy[reading].glyph.length).toBeGreaterThan(0);
    }
  });
});

describe("volumeOutliers", () => {
  it("surfaces the heavy and the indirect-only, which are the two worth acting on", () => {
    const volumes = getSessionMuscleVolume([exercise()], () => logicCalibration.exposure.highDirectSetBand);
    const outliers = volumeOutliers(volumes);
    expect(outliers.heavy.map((entry) => entry.muscle)).toContain("chest");
    expect(outliers.indirectOnly.map((entry) => entry.muscle)).toContain("triceps");
  });

  it("is empty when nothing needs calling out", () => {
    const outliers = volumeOutliers(getSessionMuscleVolume([exercise({ secondaryMuscles: [] })], () => 3));
    expect(outliers.heavy).toEqual([]);
    expect(outliers.indirectOnly).toEqual([]);
  });
});
