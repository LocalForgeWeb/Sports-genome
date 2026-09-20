import { describe, expect, it } from "vitest";
import {
  powerliftingRankMissingCopy,
  rankAgainstPowerliftingNorms,
  rankableOneRepMaxKg,
} from "@/lib/powerliftingReference";

const LB = 0.45359237;
/** The reported lift: 175 lb bench at 145 lb body weight, which is 1.21x. */
const reported = {
  exerciseName: "Barbell Bench Press",
  measurementType: "MEASURED_1RM",
  loadKg: 175 * LB,
  bodyMassKgAtTest: 145 * LB,
  sex: "male" as const,
  ageYears: 24,
};

describe("rankableOneRepMaxKg", () => {
  it("takes a measured max as it stands", () => {
    expect(rankableOneRepMaxKg({ exerciseName: "x", measurementType: "MEASURED_1RM", loadKg: 100 })).toEqual({ kg: 100, basis: "measured" });
  });

  it("estimates from a multi-rep set, and says that it did", () => {
    // Epley: 100 x 5 -> 116.67. Refusing to rank an ordinary working set was why
    // the screen had a number for nobody.
    const result = rankableOneRepMaxKg({ exerciseName: "x", measurementType: "MULTI_REP", loadKg: 100, repetitions: 5 });
    expect(result?.basis).toBe("estimated");
    expect(result?.kg).toBeCloseTo(116.67, 1);
  });

  it("treats a single rep as measured, because it is one", () => {
    expect(rankableOneRepMaxKg({ exerciseName: "x", measurementType: "MULTI_REP", loadKg: 100, repetitions: 1 })?.basis).toBe("measured");
  });

  it("refuses past the estimator's range rather than extrapolating", () => {
    expect(rankableOneRepMaxKg({ exerciseName: "x", measurementType: "MULTI_REP", loadKg: 100, repetitions: 20 })).toBeNull();
  });

  it("has nothing to rank without a load", () => {
    expect(rankableOneRepMaxKg({ exerciseName: "x", measurementType: "MEASURED_1RM", loadKg: null })).toBeNull();
  });
});

describe("rankAgainstPowerliftingNorms", () => {
  it("ranks the lift from the report, which the app previously refused to place", () => {
    const result = rankAgainstPowerliftingNorms(reported);
    expect(result.status).toBe("ranked");
    if (result.status !== "ranked") return;
    expect(result.relativeStrength).toBeCloseTo(1.21, 2);
    // Male bench cut points: 10th at 1.19, 20th at 1.31.
    expect(result.percentileBandLabel).toBe("10th–20th percentile");
    expect(result.basis).toBe("measured");
  });

  it("needs no competition declaration, which no gym lift could ever satisfy", () => {
    // The strict route required drug-tested, unequipped competition to be
    // confirmed before it would return anything at all.
    expect(rankAgainstPowerliftingNorms(reported).status).toBe("ranked");
  });

  it("ranks a working set too, and marks the max as estimated", () => {
    const result = rankAgainstPowerliftingNorms({ ...reported, measurementType: "MULTI_REP", loadKg: 135 * LB, repetitions: 5 });
    expect(result.status).toBe("ranked");
    if (result.status !== "ranked") return;
    expect(result.basis).toBe("estimated");
  });

  it("names the population, because a percentile without one is the misleading part", () => {
    const result = rankAgainstPowerliftingNorms(reported);
    if (result.status !== "ranked") throw new Error("expected a rank");
    expect(result.population).toContain("powerlifting competitors");
    expect(result.population).toContain("Male");
    expect(result.sourceUrl).toContain("sciencedirect");
  });

  it("places a strong lift above the table and a weak one below it", () => {
    const strong = rankAgainstPowerliftingNorms({ ...reported, loadKg: 145 * LB * 2.2 });
    const weak = rankAgainstPowerliftingNorms({ ...reported, loadKg: 145 * LB * 0.5 });
    expect(strong.status === "ranked" && strong.percentileBandLabel).toBe("Above the 90th percentile");
    expect(weak.status === "ranked" && weak.percentileBandLabel).toBe("Below the 10th percentile");
  });

  it("asks for the one missing field rather than explaining a study protocol", () => {
    expect(rankAgainstPowerliftingNorms({ ...reported, bodyMassKgAtTest: null })).toEqual({ status: "needs", missing: "body_mass" });
    expect(rankAgainstPowerliftingNorms({ ...reported, sex: undefined })).toEqual({ status: "needs", missing: "sex" });
    expect(rankAgainstPowerliftingNorms({ ...reported, ageYears: undefined })).toEqual({ status: "needs", missing: "age" });
    for (const copy of Object.values(powerliftingRankMissingCopy)) expect(copy).toMatch(/^Add /);
  });

  it("still ranks outside 18-35, against the published table, and says which band that is", () => {
    // Withholding a rank from a 40-year-old, when the closest published
    // reference is right there, is the behaviour being replaced.
    const result = rankAgainstPowerliftingNorms({ ...reported, ageYears: 44 });
    expect(result.status).toBe("ranked");
    if (result.status !== "ranked") return;
    expect(result.population).toContain("18–35");
  });

  it("prefers the registry's own age band when it has one", () => {
    const rows = [10, 50, 90].map((percentile) => ({
      exerciseName: "Barbell Bench Press" as const, sex: "male" as const,
      ageMin: 40, ageMax: 49, percentile, relativeStrength: percentile / 100 + 0.8,
    }));
    const result = rankAgainstPowerliftingNorms({ ...reported, ageYears: 44 }, rows);
    expect(result.status).toBe("ranked");
    if (result.status !== "ranked") return;
    expect(result.population).toContain("40–49");
  });

  it("says nothing at all for a lift the reference does not cover", () => {
    expect(rankAgainstPowerliftingNorms({ ...reported, exerciseName: "Cable Fly" })).toEqual({ status: "unsupported" });
  });
});
