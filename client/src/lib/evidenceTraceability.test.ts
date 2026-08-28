import { describe, expect, it } from "vitest";
import { evidenceTraceability, logicCalibration } from "./evidenceTraceability";

describe("evidence-to-logic traceability", () => {
  it("gives every registered logic family a purpose, boundary, and source or product rationale", () => {
    expect(evidenceTraceability.length).toBeGreaterThanOrEqual(5);
    evidenceTraceability.forEach((entry) => {
      expect(entry.rationale.length).toBeGreaterThan(20);
      expect(entry.athleteBoundary.length).toBeGreaterThan(20);
      expect(entry.kind === "product constraint" || entry.kind === "athlete-entered value" || entry.sourceUrls?.length).toBeTruthy();
    });
  });

  it("keeps model calibration named and bounded rather than exposing unlabelled magic values", () => {
    expect(logicCalibration.exposure.secondarySetConvention).toBe(0.5);
    expect(logicCalibration.sportDemand.priorityFilter).toBe(0.7);
    expect(logicCalibration.recommendation.sprintPowerAdjustmentCap).toBe(1.2);
    expect(logicCalibration.targeting.rolePriorWeight + logicCalibration.targeting.mechanicsFactorsWeight).toBe(1);
    expect(logicCalibration.movementProgramAnalysis.closelySimilarMuscleOverlap).toBeGreaterThan(logicCalibration.movementProgramAnalysis.sameMovementMuscleOverlap);
    expect(logicCalibration.recommendation.assistanceFallbackLimit).toBeGreaterThan(logicCalibration.recommendation.assistanceLimit);
    expect(logicCalibration.fingerprint.fatigueStrengthThreshold).toBeGreaterThan(logicCalibration.exerciseGenome.contextualGradeB);
  });

  it("keeps external strength references separate, qualified, and unavailable when their source conditions do not match", () => {
    const entry = evidenceTraceability.find((item) => item.id === "source-qualified-strength-references");
    expect(entry?.sourceUrls).toContain("https://strengthlevel.com/terms-and-conditions");
    expect(entry?.athleteBoundary).toContain("Unmatched, incomplete, unlicensed, or generic observations remain unavailable");
  });
});
