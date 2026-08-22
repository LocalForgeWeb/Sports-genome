import { describe, expect, it } from "vitest";
import { genomeTermInfo } from "./ExerciseGenomePanel";

describe("Exercise Genome term registry", () => {
  it("covers every displayed fingerprint, Muscle Genome, and Mechanics concept with a source-bounded explanation", () => {
    const requiredTerms = [
      "hypertrophy", "strength", "power", "stability", "mobility", "sfr", "skill", "practicality",
      "contribution", "mechanicalLoading", "longLengthLoading", "peakContraction", "stabilizationDemand",
      "movementPattern", "jointAction", "forceDirection", "kineticChain", "stance", "resistanceCurve", "resistanceBias", "stickingRegion",
      "localFatigue", "systemicFatigue", "axialFatigue", "gripFatigue",
    ] as const;
    requiredTerms.forEach((term) => {
      expect(genomeTermInfo[term].meaning.length).toBeGreaterThan(20);
      expect(genomeTermInfo[term].inputs.length).toBeGreaterThan(20);
      expect(genomeTermInfo[term].read.length).toBeGreaterThan(35);
    });
  });
});
