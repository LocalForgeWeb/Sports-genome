import { describe, expect, it } from "vitest";
import { exercises } from "./exerciseCatalog";
import { analyzeSplitStack, coveragePoints } from "./splitStackAnalysis";
import { buildCoverageBars } from "./stackCoverageVisual";
import { pickerGapTargets, rankPickerResults } from "./pickerRanking";

/**
 * One coverage model for a Training Day (Backend V1 B115; inventory TR-01, TR-02, TR-11, TR-13).
 * The panel, the full analysis and the picker grade the day with the same numbers.
 */
const byName = (name: string) => {
  const found = exercises.find((exercise) => exercise.name === name);
  if (!found) throw new Error(`no catalog exercise named ${name}`);
  return found;
};
const legs = (...names: string[]) => analyzeSplitStack(names.map(byName), exercises, "Legs");
const bar = (analysis: ReturnType<typeof analyzeSplitStack>, muscle: string) => buildCoverageBars(analysis.ratings).find((entry) => entry.muscle === muscle)!;

describe("A surplus is said, not hidden (TR-11)", () => {
  it("bands and measures a heavily covered muscle from its uncapped sum", () => {
    const stacked = legs("Back Squat", "Leg Press", "Hack Squat");
    const quads = stacked.ratings.find((rating) => rating.muscle === "quads")!;
    expect(quads.rawScore).toBeGreaterThan(100);
    expect(quads.score).toBe(100);
    const quadsBar = bar(stacked, "quads");
    // It used to read "Covered +20" beside a state of "high".
    expect(quadsBar.band).toBe("heavy");
    expect(quadsBar.deltaToTarget).toBe(quads.rawScore! - quads.target);
    expect(quads.state).toBe("high");
  });
});

describe("A muscle's gap moves only with work on that muscle (TR-02)", () => {
  it("keeps the adductor shortfall where it was when an exercise that does not train them is added", () => {
    const before = bar(legs("Back Squat"), "adductors");
    const withHipThrust = bar(legs("Back Squat", "Barbell Hip Thrust"), "adductors");
    // Relative involvement used to move adductors from -7 to -15 on this change.
    expect(coveragePoints(byName("Barbell Hip Thrust"), "adductors")).toBe(0);
    expect(withHipThrust.deltaToTarget).toBe(before.deltaToTarget);
  });
});

describe("The picker leads with what closes the most shortfall (TR-13)", () => {
  it("ranks a candidate by the shortfall points it closes, capped at each gap", () => {
    const day = legs("Leg Extension");
    const gaps = pickerGapTargets(buildCoverageBars(day.ratings));
    expect(gaps.length).toBeGreaterThan(1);
    const candidates = ["Romanian Deadlift", "Standing Calf Raise", "Barbell Hip Thrust", "Nordic Hamstring Curl"].map(byName);
    const ranked = rankPickerResults(candidates, gaps);
    const closes = ranked.map((entry) => entry.closesPoints);
    // Sorted by points closed, highest first.
    expect([...closes].sort((a, b) => b - a)).toEqual(closes);
    // And each figure is what the panel's own model says the candidate adds, capped per gap.
    for (const entry of ranked) {
      const expected = gaps.reduce((total, gap) => total + Math.min(coveragePoints(entry.exercise, gap.muscle), -gap.deltaToTarget), 0);
      expect(entry.closesPoints).toBe(expected);
    }
  });

  it("puts an exercise that closes two gaps above one that closes a sliver of the worst", () => {
    const gaps = [
      { muscle: "hamstrings", deltaToTarget: -20, band: "short" as const },
      { muscle: "glutes", deltaToTarget: -18, band: "short" as const },
      { muscle: "calves", deltaToTarget: -5, band: "near" as const },
    ];
    const both = byName("Romanian Deadlift");
    const sliver = byName("Standing Calf Raise");
    const [first] = rankPickerResults([sliver, both], gaps);
    expect(first.exercise.name).toBe("Romanian Deadlift");
  });
});

describe("The catalog tags coverage is computed from (TR-12)", () => {
  it("tags Leg Extension as the quad isolation it is, and Copenhagen Plank as adductor work", () => {
    // Leg Extension carried glutes as a prime mover and adductors as support, which made a
    // quad-isolation machine close glute and adductor gaps; the Copenhagen Plank, the
    // standard adductor drill, had no adductor tag at all.
    expect(byName("Leg Extension")).toMatchObject({ primaryMuscles: ["quads"], secondaryMuscles: [], equipment: "Machine" });
    expect(byName("Copenhagen Plank").primaryMuscles).toEqual(["adductors"]);
    expect(coveragePoints(byName("Leg Extension"), "adductors")).toBe(0);
    expect(coveragePoints(byName("Copenhagen Plank"), "adductors")).toBeGreaterThan(0);
  });
});

describe("A surplus does not pay for a gap (B112)", () => {
  it("caps each target's share before averaging, so extra quad work cannot lift the day's score", () => {
    const covered = legs("Back Squat");
    const piledOn = legs("Back Squat", "Leg Press", "Hack Squat", "Leg Extension");
    const quads = piledOn.ratings.find((rating) => rating.muscle === "quads")!;
    expect(quads.rawScore).toBeGreaterThan(quads.target);
    // The overall score is the mean of each target's share capped at 100, recomputed here.
    const expected = Math.round(piledOn.ratings.reduce((total, rating) => total + Math.min(100, (rating.score / rating.target) * 100), 0) / piledOn.ratings.length);
    expect(piledOn.score).toBe(expected);
    // Whatever the quads carry, the hamstring gap moves only by the hamstring work added.
    const hamstringPoints = ["Leg Press", "Hack Squat", "Leg Extension"].reduce((total, name) => total + coveragePoints(byName(name), "hamstrings"), 0);
    expect(bar(piledOn, "hamstrings").deltaToTarget - bar(covered, "hamstrings").deltaToTarget).toBe(hamstringPoints);
  });
});
