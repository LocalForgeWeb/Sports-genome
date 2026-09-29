import { describe, expect, it } from "vitest";
import { getStackWarmup, mobilityTagLabel, preTrainingMobilityLibrary } from "@/lib/preTrainingMobility";
import { exercises } from "@/lib/exerciseCatalog";
import { logicCalibration } from "@/lib/evidenceTraceability";

type WarmupGoal = Parameters<typeof getStackWarmup>[1];
const goals: WarmupGoal[] = ["Athleticism", "Muscle growth", "Max strength", "Capacity"];
const minutesOf = (drills: { minutes: number }[]) => drills.reduce((total, drill) => total + drill.minutes, 0);

describe("the warm-up picker", () => {
  it("gives an empty stack a whole-body warm-up", () => {
    const warmup = getStackWarmup([], "Max strength");
    expect(warmup.focusTags).toEqual([]);
    expect(warmup.drills.length).toBeGreaterThan(0);
    for (const drill of warmup.drills) expect(drill.tags, `${drill.name} is general prep`).toContain("general");
    expect(warmup.rationale).toBe("Matched to whole-body preparation demands in the active stack.");
    expect(warmup.estimatedMinutes).toBe(minutesOf(warmup.drills));
  });

  it("keeps every lift's warm-up short, free of repeats, timed right and in plain words", () => {
    for (const exercise of exercises) {
      for (const goal of goals) {
        const warmup = getStackWarmup([exercise], goal);
        const where = `${exercise.name} for ${goal}`;
        expect(warmup.drills.length, where).toBeGreaterThanOrEqual(1);
        expect(warmup.drills.length, where).toBeLessThanOrEqual(logicCalibration.mobility.maximumDrills);
        const ids = warmup.drills.map((drill) => drill.id);
        expect(new Set(ids).size, where).toBe(ids.length);
        expect(warmup.estimatedMinutes, where).toBe(minutesOf(warmup.drills));
        // Tag identifiers once reached this copy as "Matched to singleLeg, rotation, lateral demands".
        expect(warmup.rationale, where).not.toMatch(/[a-z][A-Z]/);
      }
    }
  });

  it("covers every phase for a single-leg lift and names it in plain words", () => {
    const splitSquat = exercises.find((exercise) => exercise.name === "Bulgarian Split Squat");
    expect(splitSquat, "the catalog has a Bulgarian split squat").toBeTruthy();
    const warmup = getStackWarmup([splitSquat!], "Athleticism");
    expect(new Set(warmup.drills.map((drill) => drill.phase))).toEqual(new Set(["raise", "mobilize", "activate", "rehearse"]));
    expect(warmup.focusTags).toContain("singleLeg");
    expect(warmup.rationale).toContain("single-leg");
    expect(warmup.rationale).not.toContain("singleLeg");
  });

  it("has a plain-words name for every tag the library uses", () => {
    for (const tag of new Set(preTrainingMobilityLibrary.flatMap((drill) => drill.tags))) {
      const label = mobilityTagLabel(tag);
      expect(label.length, tag).toBeGreaterThan(0);
      expect(label, tag).not.toMatch(/[A-Z]/);
    }
  });

  it("gives every drill in the library its own id", () => {
    const ids = preTrainingMobilityLibrary.map((drill) => drill.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
