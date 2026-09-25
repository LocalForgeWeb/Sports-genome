import { describe, expect, it } from "vitest";
import { compareRegionRecordRelevance, regionRelevanceForExerciseName, strengthRegionIdsForExerciseName } from "./workoutStrengthRecord";

const on = (exerciseName: string, observedAt: string) => ({ exerciseName, observedAt });

describe("How directly a lift measures a region", () => {
  /** The premise the ordering rests on: routes name their primary region first. */
  it("reads directness out of the order the routes already state", () => {
    expect(strengthRegionIdsForExerciseName("Preacher Curl")).toEqual(["biceps"]);
    expect(strengthRegionIdsForExerciseName("Lat Pulldown")).toEqual(["lats", "upper_back", "biceps"]);
    expect(strengthRegionIdsForExerciseName("Barbell Back Squat")[0]).toBe("quadriceps");
  });

  it("scores a targeted test above a compound that happens to involve the region", () => {
    expect(regionRelevanceForExerciseName("Preacher Curl", "biceps")).toEqual({ position: 0, breadth: 1 });
    expect(regionRelevanceForExerciseName("Lat Pulldown", "biceps")).toEqual({ position: 2, breadth: 3 });
  });

  /** A lift that never reaches the region sorts last, not first as a bare indexOf would. */
  it("puts a lift that does not reach the region behind every one that does", () => {
    expect(regionRelevanceForExerciseName("Barbell Back Squat", "biceps").position).toBe(Number.MAX_SAFE_INTEGER);
    expect(compareRegionRecordRelevance("biceps", on("Barbell Back Squat", "2026-09-22"), on("Lat Pulldown", "2020-01-01"))).toBeGreaterThan(0);
  });
});

describe("Which lift speaks for a region", () => {
  /**
   * The reported defect, exactly: a lat pulldown logged after a preacher curl took the
   * biceps record, and the curl - the one test of the three with a reviewed biceps
   * reference behind it - was not what the athlete was shown.
   */
  it("gives biceps to the preacher curl over a more recent lat pulldown", () => {
    const records = [on("Lat Pulldown", "2026-09-22T12:00:00.000Z"), on("Preacher Curl", "2026-09-01T12:00:00.000Z")]
      .sort((a, b) => compareRegionRecordRelevance("biceps", a, b));
    expect(records[0].exerciseName).toBe("Preacher Curl");
  });

  /** The same lat pulldown still speaks for lats, where it is the primary test. */
  it("still gives lats to the lat pulldown", () => {
    const records = [on("Preacher Curl", "2026-09-22T12:00:00.000Z"), on("Lat Pulldown", "2026-09-01T12:00:00.000Z")]
      .sort((a, b) => compareRegionRecordRelevance("lats", a, b));
    expect(records[0].exerciseName).toBe("Lat Pulldown");
  });

  it("prefers the narrower test when two name the region first", () => {
    // Hip thrust reaches two regions, the deadlift three; both lead with glutes.
    const records = [on("Deadlift", "2026-09-22T12:00:00.000Z"), on("Hip Thrust", "2026-09-01T12:00:00.000Z")]
      .sort((a, b) => compareRegionRecordRelevance("glutes", a, b));
    expect(records[0].exerciseName).toBe("Hip Thrust");
  });

  /** Recency still decides between two tests of equal standing - it is the tiebreak, not the rule. */
  it("takes the more recent of two equally direct tests", () => {
    const records = [on("Preacher Curl", "2026-01-01T12:00:00.000Z"), on("Barbell Curl", "2026-09-01T12:00:00.000Z")]
      .sort((a, b) => compareRegionRecordRelevance("biceps", a, b));
    expect(records[0].exerciseName).toBe("Barbell Curl");
  });
});
