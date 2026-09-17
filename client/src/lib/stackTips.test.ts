import { describe, expect, it } from "vitest";
import { buildStackTips, maxTips } from "@/lib/stackTips";
import type { CoverageBar } from "@/lib/stackCoverageVisual";
import type { DemandCoverage } from "@/lib/stackQualityCoverage";
import type { MuscleSessionVolume } from "@/lib/sessionVolume";

const bar = (over: Partial<CoverageBar> = {}): CoverageBar => ({
  muscle: "chest", role: "primary", band: "short", fillPercent: 20, targetPercent: 60, deltaToTarget: -41, ...over,
});
const volume = (over: Partial<MuscleSessionVolume> = {}): MuscleSessionVolume => ({
  muscle: "chest", directSets: 3, supportSets: 0, reading: "light", sessionsForEstablished: 2, note: "", ...over,
});
const demand = (over: Partial<DemandCoverage> = {}): DemandCoverage => ({
  key: "antiRotation", label: "Trunk bracing", exercises: 0, splitShare: 22, sportAsks: true, ...over,
});

const name = (muscle: string) => muscle.toUpperCase();
const build = (over: Partial<Parameters<typeof buildStackTips>[0]> = {}) =>
  buildStackTips({
    shortfalls: [], volumes: [], absentDemands: [], suggestionCount: 0,
    muscleName: name, splitTargets: new Set(["chest", "triceps"]), ...over,
  });

describe("buildStackTips", () => {
  it("leads with the worst coverage shortfall, carrying the figure it fired on", () => {
    // A tip without its number is indistinguishable from a canned one.
    const [tip] = build({ shortfalls: [bar()] });
    expect(tip.text).toContain("CHEST");
    expect(tip.text).toContain("41");
  });

  it("points at the suggested picks only when there are some", () => {
    expect(build({ shortfalls: [bar()], suggestionCount: 2 })[0].text).toContain("2 suggested picks");
    expect(build({ shortfalls: [bar()], suggestionCount: 0 })[0].text).not.toContain("suggested");
  });

  it("gets the singular right for one suggestion", () => {
    const text = build({ shortfalls: [bar()], suggestionCount: 1 })[0].text;
    expect(text).toContain("1 suggested pick below adds");
  });

  it("calls out a session carrying a whole week's high-exposure volume", () => {
    const tips = build({ volumes: [volume({ directSets: 12, reading: "heavy" })] });
    expect(tips.some((tip) => tip.kind === "volume" && tip.text.includes("12 direct sets"))).toBe(true);
  });

  it("flags a split target getting only indirect work", () => {
    const tips = build({ volumes: [volume({ muscle: "triceps", reading: "indirect-only", directSets: 0, supportSets: 2 })] });
    expect(tips.some((tip) => tip.text.includes("TRICEPS") && tip.text.includes("no direct work"))).toBe(true);
  });

  it("stays quiet about indirect work on a muscle the split does not target", () => {
    const tips = build({ volumes: [volume({ muscle: "calves", reading: "indirect-only", directSets: 0, supportSets: 2 })] });
    expect(tips).toEqual([]);
  });

  it("names a sport demand the stack does not train", () => {
    const [tip] = build({ absentDemands: [demand()] });
    expect(tip.text).toContain("trunk bracing");
    expect(tip.text).toContain("22%");
  });

  it("stays quiet about a demand this split's catalog can barely serve", () => {
    // Raising a gap the athlete cannot close from this split is noise.
    expect(build({ absentDemands: [demand({ splitShare: 3 })] })).toEqual([]);
  });

  it("never shows more than a panel can carry", () => {
    const tips = build({
      shortfalls: [bar(), bar({ muscle: "triceps" })],
      volumes: [volume({ directSets: 12, reading: "heavy" }), volume({ muscle: "triceps", reading: "indirect-only", directSets: 0, supportSets: 2 })],
      absentDemands: [demand()],
      suggestionCount: 2,
    });
    expect(tips.length).toBeLessThanOrEqual(maxTips);
  });

  it("says nothing at all when there is nothing to say", () => {
    expect(build()).toEqual([]);
  });

  it("gives every tip a stable id, so a re-render does not reshuffle them", () => {
    const first = build({ shortfalls: [bar()], absentDemands: [demand()] });
    const second = build({ shortfalls: [bar()], absentDemands: [demand()] });
    expect(first.map((tip) => tip.id)).toEqual(second.map((tip) => tip.id));
  });

  it("never tells the athlete what they should do", () => {
    const tips = build({
      shortfalls: [bar()],
      volumes: [volume({ directSets: 12, reading: "heavy" })],
      absentDemands: [demand()],
      suggestionCount: 2,
    });
    for (const tip of tips) {
      for (const word of ["you should", "must ", "need to", "always ", "never "]) {
        expect(tip.text.toLowerCase()).not.toContain(word);
      }
    }
  });
});
