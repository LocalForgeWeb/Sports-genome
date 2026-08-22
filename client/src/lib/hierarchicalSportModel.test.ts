import { describe, expect, it } from "vitest";
import { buildMovementReasoning, getSportDemandModel, getSportModifiers } from "./hierarchicalSportModel";
import { sportMovementProfiles } from "./sportMovementDatabase";

describe("hierarchical sport-to-program model", () => {
  it("provides the specified style modifiers without treating them as a separate sport", () => {
    expect(getSportModifiers("wrestling").map((item) => item.id)).toContain("greco-roman");
    const model = getSportDemandModel("wrestling", "greco-roman");
    expect(model.selectedModifier?.label).toBe("Greco-Roman");
    expect(model.evidenceBoundary).toMatch(/planning comparisons/i);
  });

  it("builds a complete sport-to-program reasoning path for an action", () => {
    const movement = sportMovementProfiles.find((item) => item.sportId === "soccer");
    expect(movement).toBeTruthy();
    if (!movement) return;
    const reasoning = buildMovementReasoning(movement, "field-player");
    expect(reasoning.sport).toBe("Soccer");
    expect(reasoning.biomechanics.length).toBeGreaterThan(10);
    expect(reasoning.physicalQualities.length).toBeGreaterThan(2);
    expect(reasoning.physiologicalDemands.length).toBeGreaterThan(2);
    expect(reasoning.modality).toMatch(/gym modalities/i);
    expect(reasoning.exerciseRole).toMatch(/transfer similarity/i);
    expect(reasoning.programming).toMatch(/goal/i);
    expect(reasoning.exerciseBoundary).toBeTruthy();
  });

  it("includes expanded football, hockey, track, and swimming contexts", () => {
    expect(getSportModifiers("american-football").map((item) => item.id)).toContain("lb-te");
    expect(getSportModifiers("ice-hockey").map((item) => item.id)).toContain("defense");
    expect(getSportModifiers("track-and-field").map((item) => item.id)).toContain("hurdles");
    expect(getSportModifiers("swimming").map((item) => item.id)).toEqual(expect.arrayContaining(["middle-distance", "distance", "im"]));
  });

  it("makes a role or event adjustment visible as a transparent hierarchy difference", () => {
    const general = getSportDemandModel("ice-hockey");
    const goalie = getSportDemandModel("ice-hockey", "goalie");
    const generalMobility = general.demands.find((item) => item.key === "mobility")?.score;
    const goalieMobility = goalie.demands.find((item) => item.key === "mobility")?.score;
    expect(goalieMobility).toBeGreaterThan(generalMobility || 0);
    expect(goalie.demands.find((item) => item.key === "mobility")?.evidenceType).toBe("expert-inference");
  });
});
