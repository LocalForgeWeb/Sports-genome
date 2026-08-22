import { describe, expect, it } from "vitest";
import { getMovementRecommendations, getSportProgrammingContext, getSportSession, hierarchyTraceConstructionBoost, orderHierarchyConstructedSession, sprintPowerEvidenceRankAdjustment } from "./movementRecommendations";
import { sportMovementProfiles } from "./sportMovementDatabase";
import { exercises } from "./exerciseCatalog";

describe("hierarchy-aware sport recommendations", () => {
  it("exposes sport-model priorities as programming context rather than a fixed prescription", () => {
    const context = getSportProgrammingContext("wrestling", "greco-roman");
    expect(context.priorities).toContain("Maximal strength");
    expect(context.physiologicalDemands.length).toBeGreaterThan(2);
    expect(context.adaptationTargets.length).toBeGreaterThan(2);
    expect(context.modalityBoundary).toMatch(/sport practice/i);
    expect(context.exerciseRole).toMatch(/movement-transfer/i);
    expect(context.programmingBoundary).toMatch(/planning variables/i);
    expect(context.modifierEvidenceSources.join(" ")).toMatch(/evidence inventory/i);
  });

  it("exposes selected modifier sources in athlete programming context", () => {
    const context = getSportProgrammingContext("american-football", "wr-db");
    expect(context.modifierEvidenceSources.join(" ")).toMatch(/NFL positional player-tracking/i);
    expect(context.programmingBoundary).toMatch(/NFL positional player-tracking/i);
  });

  it("changes downstream rankings when a modifier changes the model context", () => {
    const freestyle = getSportSession("wrestling", "Athleticism", 8, undefined, "freestyle");
    const greco = getSportSession("wrestling", "Athleticism", 8, undefined, "greco-roman");
    expect(greco).not.toEqual(freestyle);
  });

  it("keeps movement-transfer similarity separate from muscle targeting and classifies preparation", () => {
    const sprintStart = sportMovementProfiles.find((item) => item.sportId === "track-and-field" && /start/i.test(item.label));
    expect(sprintStart).toBeTruthy();
    if (!sprintStart) return;
    const recommendations = getMovementRecommendations(sprintStart, 8);
    expect(recommendations[0].breakdown.movementTransferSimilarity).toBeTypeOf("number");
    expect(recommendations[0].breakdown.muscleMatch).toBeTypeOf("number");
    expect(["General physical preparation", "Special physical preparation", "Highly specific physical preparation"]).toContain(recommendations[0].preparation);
    expect(recommendations[0].hierarchy.movement).toBe(sprintStart.label);
    expect(recommendations[0].hierarchy.physiologicalDemands.length).toBeGreaterThan(0);
    expect(recommendations[0].hierarchy.physicalQualities.length).toBeGreaterThan(0);
    expect(recommendations[0].hierarchy.programming).toMatch(/planning variables|goal/i);
  });

  it("carries the active sport modifier hierarchy into constructed sport sessions", () => {
    const session = getSportSession("track-and-field", "Athleticism", 8, undefined, "sprint");
    expect(session.length).toBeGreaterThan(0);
    expect(session.every((item) => item.hierarchy.modifier.includes("Sprint"))).toBe(true);
    expect(session.some((item) => item.hierarchy.physicalQualities.some((quality) => /speed|power|rate of force/i.test(quality)))).toBe(true);
    expect(session.some((item) => item.hierarchyConstructionScore > 0)).toBe(true);
    expect(session.some((item) => hierarchyTraceConstructionBoost(item.exercise, item.hierarchy) === item.hierarchyConstructionScore)).toBe(true);
    const reverseOrdered = orderHierarchyConstructedSession([...session].reverse());
    expect(reverseOrdered.map((item) => item.exercise.id)).not.toEqual([...session].reverse().map((item) => item.exercise.id));
  });

  it("applies a capped, task-aligned sprint-and-power adjustment to actual recommendation scoring", () => {
    const sprintStart = sportMovementProfiles.find((item) => item.sportId === "track-and-field" && /start/i.test(item.label));
    const sprintSupport = exercises.find((exercise) => exercise.qualities.includes("sprintSupport"));
    const unrelated = exercises.find((exercise) => !exercise.qualities.some((quality) => ["sprintSupport", "power", "unilateral"].includes(quality)));
    expect(sprintStart && sprintSupport && unrelated).toBeTruthy();
    if (!sprintStart || !sprintSupport || !unrelated) return;
    expect(sprintPowerEvidenceRankAdjustment(sprintSupport, sprintStart)).toBeGreaterThan(0);
    expect(sprintPowerEvidenceRankAdjustment(sprintSupport, sprintStart)).toBeLessThanOrEqual(1.2);
    expect(sprintPowerEvidenceRankAdjustment(unrelated, sprintStart)).toBeLessThan(sprintPowerEvidenceRankAdjustment(sprintSupport, sprintStart));
  });
});
