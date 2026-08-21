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
});
