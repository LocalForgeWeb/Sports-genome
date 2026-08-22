import { describe, expect, it } from "vitest";
import { getSportProgrammingContext, getSportSession } from "./movementRecommendations";

describe("hierarchy-aware sport recommendations", () => {
  it("exposes sport-model priorities as programming context rather than a fixed prescription", () => {
    const context = getSportProgrammingContext("wrestling", "greco-roman");
    expect(context.priorities).toContain("Maximal strength");
    expect(context.modalityBoundary).toMatch(/sport practice/i);
    expect(context.programmingBoundary).toMatch(/planning variables/i);
  });

  it("changes downstream rankings when a modifier changes the model context", () => {
    const freestyle = getSportSession("wrestling", "Athleticism", 8, undefined, "freestyle").map((item) => item.exercise.id);
    const greco = getSportSession("wrestling", "Athleticism", 8, undefined, "greco-roman").map((item) => item.exercise.id);
    expect(greco).not.toEqual(freestyle);
  });
});
