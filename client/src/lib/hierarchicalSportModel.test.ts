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
    expect(reasoning.exerciseBoundary).toBeTruthy();
  });
});
