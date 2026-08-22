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
    expect(reasoning.modifierEvidenceScope).toMatch(/reviewed/i);
    expect(reasoning.modifierEvidenceSources.join(" ")).toMatch(/soccer evidence inventory/i);
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
    expect(goalie.selectedModifier?.evidenceSources?.join(" ")).toMatch(/Wearable-technology/i);
  });

  it("attaches direct source records to expanded football, hockey, track, and swimming modifiers", () => {
    expect(getSportDemandModel("american-football", "wr-db").selectedModifier?.evidenceSources?.join(" ")).toMatch(/NFL positional player-tracking/i);
    expect(getSportDemandModel("ice-hockey", "defense").selectedModifier?.evidenceSources?.join(" ")).toMatch(/high-threshold decelerations/i);
    expect(getSportDemandModel("track-and-field", "sprint").selectedModifier?.evidenceSources?.join(" ")).toMatch(/109-study/i);
    expect(getSportDemandModel("swimming", "freestyle").selectedModifier?.evidenceSources?.join(" ")).toMatch(/front-crawl/i);
  });

  it("attaches concrete reviewed references to expanded track and swimming modifiers", () => {
    expect(getSportDemandModel("track-and-field", "sprint").selectedModifier?.evidenceSources?.join(" ")).toMatch(/109-study/i);
    expect(getSportDemandModel("swimming", "freestyle").selectedModifier?.evidenceSources?.join(" ")).toMatch(/Kwok/i);
  });

  it("attaches explicit evidence scope, boundary, and source metadata to every configured modifier", () => {
    const sportIds = [...new Set(sportMovementProfiles.map((movement) => movement.sportId))];
    sportIds.forEach((sportId) => {
      getSportModifiers(sportId).forEach((item) => {
        expect(item.evidenceScope).toMatch(/reviewed/i);
        expect(item.evidenceBoundary.length).toBeGreaterThan(20);
        expect(item.evidenceSources?.length).toBeGreaterThan(0);
      });
    });
  });
});
