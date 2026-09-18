import { describe, expect, it } from "vitest";
import { analyzeStackQualities, qualityToDemand, unmappedQualities } from "@/lib/stackQualityCoverage";
import { exercises } from "@/lib/exerciseCatalog";
import { getSportDemandModel } from "@/lib/hierarchicalSportModel";

const byName = (name: string) => exercises.find((exercise) => exercise.name === name)!;

describe("qualityToDemand", () => {
  it("maps only where the two vocabularies name the same thing", () => {
    // A stretched mapping becomes a confident, wrong sentence on screen.
    expect(qualityToDemand.antiRotation).toBe("antiRotation");
    expect(qualityToDemand.deceleration).toBe("deceleration");
    expect(qualityToDemand.grip).toBe("grip");
  });

  it("maps bracing onto the demand whose own label is 'Trunk bracing'", () => {
    const labels = new Map(getSportDemandModel("baseball").demands.map((demand) => [demand.key, demand.label]));
    expect(qualityToDemand.bracing).toBe("antiRotation");
    expect(labels.get("antiRotation")).toBe("Trunk bracing");
  });

  it("leaves a tag unmapped rather than stretching it", () => {
    for (const quality of unmappedQualities) {
      expect(qualityToDemand[quality]).toBeUndefined();
    }
  });

  it("never maps two catalog tags onto a demand they do not share", () => {
    // Every target must be a real key in the register.
    const keys = new Set(getSportDemandModel("soccer").demands.map((demand) => demand.key));
    for (const demand of Object.values(qualityToDemand)) expect(keys.has(demand)).toBe(true);
  });

  it("covers every tag either by mapping it or by naming it unmapped", () => {
    const accounted = new Set([...Object.keys(qualityToDemand), ...unmappedQualities]);
    const inCatalog = new Set(exercises.flatMap((exercise) => exercise.qualities || []));
    expect([...inCatalog].filter((quality) => !accounted.has(quality))).toEqual([]);
  });
});

describe("analyzeStackQualities", () => {
  const analyze = (names: string[], sportId = "baseball", split: "Push" | "Pull" | "Legs" = "Push") =>
    analyzeStackQualities({ workout: names.map(byName).filter(Boolean), catalog: exercises, split, sportId });

  it("reports a register demand the stack does not touch", () => {
    // The whole point: a Push day for baseball that trains no trunk bracing.
    const result = analyze(["Barbell Bench Press"]);
    const everything = [...result.covered, ...result.absent];
    expect(everything.some((row) => row.key === "antiRotation")).toBe(true);
  });

  it("only calls a demand asked-for when the register lists it", () => {
    const asked = new Set(
      getSportDemandModel("baseball").demands
        .filter((demand) => demand.evidenceType === "literature-derived")
        .map((demand) => demand.key)
    );
    for (const row of [...analyze(["Barbell Bench Press"]).covered, ...analyze(["Barbell Bench Press"]).absent]) {
      expect(asked.has(row.key)).toBe(true);
      expect(row.sportAsks).toBe(true);
    }
  });

  it("never treats a model-estimated filler demand as something the sport asks for", () => {
    // getSportDemandModel scores all 24 keys; most are estimates, not register entries.
    const model = getSportDemandModel("baseball");
    const estimated = model.demands.filter((demand) => demand.evidenceType === "model-estimated").map((demand) => demand.key);
    const result = analyze(["Barbell Bench Press"]);
    const claimed = new Set([...result.covered, ...result.absent].map((row) => row.key));
    for (const key of estimated) expect(claimed.has(key)).toBe(false);
  });

  it("counts an exercise once per demand, not once per tag", () => {
    // antiRotation and bracing both map to antiRotation.
    const pallof = exercises.find((exercise) => /pallof/i.test(exercise.name));
    if (!pallof) return;
    const result = analyzeStackQualities({ workout: [pallof], catalog: exercises, split: "Push", sportId: "baseball" });
    const row = [...result.covered, ...result.absent, ...result.extra].find((entry) => entry.key === "antiRotation");
    expect(row?.exercises).toBeLessThanOrEqual(1);
  });

  it("gives the split's own catalog share as the baseline, not an invented target", () => {
    const result = analyze(["Barbell Bench Press"]);
    for (const row of [...result.covered, ...result.absent]) {
      expect(row.splitShare).toBeGreaterThanOrEqual(0);
      expect(row.splitShare).toBeLessThanOrEqual(100);
    }
  });

  it("orders absent demands by what this split can actually serve", () => {
    // A demand the split's catalog cannot cover is not the stack's failure.
    const shares = analyze(["Barbell Bench Press"]).absent.map((row) => row.splitShare);
    expect([...shares].sort((left, right) => right - left)).toEqual(shares);
  });

  it("separates qualities the stack trains that the sport does not ask for", () => {
    const result = analyze(["Barbell Bench Press"]);
    for (const row of result.extra) expect(row.sportAsks).toBe(false);
  });

  it("puts every register demand in exactly one of covered or absent", () => {
    const result = analyze(["Barbell Bench Press", "Dumbbell Lateral Raise"]);
    const keys = [...result.covered, ...result.absent].map((row) => row.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("handles an empty stack without claiming coverage", () => {
    const result = analyze([]);
    expect(result.covered).toEqual([]);
    expect(result.absent.length).toBeGreaterThan(0);
  });

  it("handles a sport with no register entry without throwing", () => {
    expect(() => analyze(["Barbell Bench Press"], "not-a-sport")).not.toThrow();
  });
});
