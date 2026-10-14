import { describe, expect, it } from "vitest";
import { rankOrdinal, rankPercentileText } from "./CapabilityRank";
import type { MuscleScore } from "@shared/capabilityRank";

/** A rank past the top anchor rests on an estimated lift and says so wherever it is printed (14 Oct 2026). */
const muscle = (percentile: number, estimated?: boolean): MuscleScore => ({
  muscleId: "m", canonicalName: "pectoralis_major", name: "Pectoralis major", percentile, confidence01: 0.7,
  evidenceCount: 1, movementPatternCount: 1, evidence: [], referenceGroups: [], ...(estimated ? { estimated } : {}),
});

describe("Printing a rank's percentile", () => {
  it("marks an estimated percentile with ≈ and (estimated), floored like every rank number", () => {
    expect(rankOrdinal(96.9, true)).toBe("≈ 96th (estimated)");
    expect(rankOrdinal(96.9, true, "percentile on its own")).toBe("≈ 96th percentile on its own (estimated)");
    expect(rankOrdinal(96.9)).toBe("96th");
    expect(rankOrdinal(41.2, false, "percentile")).toBe("41st percentile");
  });

  it("puts the estimate ahead of thin-evidence wording, which it already implies", () => {
    expect(rankPercentileText({ representative: muscle(97.2, true), confidence: "low" })).toBe("≈ 97th percentile (estimated)");
    expect(rankPercentileText({ representative: muscle(97.2, true), confidence: "high" })).toBe("≈ 97th percentile (estimated)");
    expect(rankPercentileText({ representative: muscle(41.6), confidence: "low" })).toBe("About 41st percentile");
    expect(rankPercentileText({ representative: muscle(41.6), confidence: "high" })).toBe("41st percentile");
  });
});
