import { describe, expect, it } from "vitest";
import { getMovementRecommendations, getSportProgrammingContext, getSportSession } from "./movementRecommendations";
import { sportMovementProfiles } from "./sportMovementDatabase";

describe("hierarchy-aware sport recommendations", () => {
  it("exposes sport-model priorities as programming context rather than a fixed prescription", () => {
    const context = getSportProgrammingContext("wrestling", "greco-roman");
    expect(context.priorities).toContain("Maximal strength");
    expect(context.physiologicalDemands.length).toBeGreaterThan(2);
    expect(context.adaptationTargets.length).toBeGreaterThan(2);
    expect(context.modalityBoundary).toMatch(/sport practice/i);
    expect(context.exerciseRole).toMatch(/movement-transfer/i);
    expect(context.programmingBoundary).toMatch(/planning variables/i);
  });

  it("changes downstream rankings when a modifier changes the model context", () => {
    const freestyle = getSportSession("wrestling", "Athleticism", 8, undefined, "freestyle").map((item) => item.exercise.id);
    const greco = getSportSession("wrestling", "Athleticism", 8, undefined, "greco-roman").map((item) => item.exercise.id);
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
  });
});
