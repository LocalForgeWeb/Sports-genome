import { describe, expect, it } from "vitest";
import { exerciseEvidenceCoverage, sportEvidenceCoverage } from "./evidenceCoverage";

describe("evidence coverage metadata", () => {
  it("returns a reviewed scope and boundary for every active sport profile", () => {
    const soccer = sportEvidenceCoverage("soccer");
    expect(soccer.confidence).toBe("High");
    expect(soccer.planningBoundary).toMatch(/do not replace technical practice/i);
  });

  it("classifies major catalog movement families as high-confidence mechanics coverage", () => {
    expect(exerciseEvidenceCoverage({ category: "Push", movementPattern: "Horizontal press", equipment: "Barbell" }).confidence).toBe("High");
    expect(exerciseEvidenceCoverage({ category: "Arms", movementPattern: "Curl", equipment: "Cable" }).sourceRange).toMatch(/Exercise-family/);
  });

  it("surfaces direct-study calibration only for named exercise families and keeps its evidence boundary", () => {
    const seatedCurl = exerciseEvidenceCoverage({ name: "Seated Leg Curl", category: "Legs", equipment: "Machine" });
    const bench = exerciseEvidenceCoverage({ name: "Incline Barbell Bench Press", category: "Chest & push", equipment: "Barbell" });

    expect(seatedCurl.sourceRange).toContain("MRI intervention");
    expect(seatedCurl.directScope).toContain("biarticular-hamstring");
    expect(bench.planningBoundary).toContain("not an EMG-derived hypertrophy score");
  });

  it("uses a shared catalog evidence context when one is available", () => {
    const coverage = exerciseEvidenceCoverage({
      name: "Example Exercise",
      evidenceContext: {
        rangeOfMotion: "Long-length partial",
        evidenceKind: "Direct longitudinal adaptation",
        sourceRange: "Verified intervention",
        summary: "A direct study finding.",
        counterevidence: "The finding remains protocol-specific.",
      },
    });

    expect(coverage.sourceRange).toContain("Long-length partial");
    expect(coverage.directScope).toBe("A direct study finding.");
    expect(coverage.planningBoundary).toBe("The finding remains protocol-specific.");
  });
});
