import { describe, expect, it } from "vitest";
import { getBodyLabRoleContext, getBodyLabRoleOrder } from "./bodyLabRoleContext";

describe("Body Lab movement-specific role context", () => {
  it("uses the enriched movement record to distinguish prime movers, synergists, and stabilizers", () => {
    const context = getBodyLabRoleContext("wrestling", "wrestling-1", ["quads"], ["abs"]);
    expect(context.rolesByMuscle.glutes.roles).toContain("Primary Mover");
    expect(context.rolesByMuscle.hamstrings.roles).toContain("Synergist");
    expect(context.rolesByMuscle.obliques.roles).toContain("Stabilizer");
    expect(context.rolesByMuscle.glutes.confidence).toBe("Biomechanical model");
  });

  it("reads record muscle names with the shared table, so the calf's triceps surae is drawn as the calf, not the arm", () => {
    // Sep 30: Body Lab and the movement support tiers now read one alias table; the
    // old bare "triceps" alias drew basketball takeoffs as triceps-driven.
    const context = getBodyLabRoleContext("basketball", "basketball-7", [], []);
    expect(context.rolesByMuscle.calves.roles).toContain("Primary Mover");
    expect(context.rolesByMuscle.soleus.roles).toContain("Primary Mover");
    expect(context.rolesByMuscle.triceps).toBeUndefined();
    expect(getBodyLabRoleContext("wrestling", "wrestling-19", [], []).primary).toEqual(expect.arrayContaining(["glutes", "hamstrings", "lowerBack", "obliques"]));
  });

  it("falls back to the movement model when a record has no enriched evidence", () => {
    const context = getBodyLabRoleContext("test", "missing", ["quads"], ["abs"]);
    expect(context.rolesByMuscle.quads.roles).toEqual(["Primary Mover"]);
    expect(context.rolesByMuscle.abs.roles).toEqual(["Supporting"]);
    expect(context.rolesByMuscle.quads.confidence).toBe("Movement model");
  });

  it("uses source-recorded action phases and stability mechanics to list stabilizers before assisting roles", () => {
    const context = getBodyLabRoleContext("wrestling", "wrestling-1", ["quads"], ["abs"]);
    expect(context.rolesByMuscle.obliques.roleOrder).toEqual(["Primary Mover", "Stabilizer", "Synergist", "Supporting"]);
    expect(context.rolesByMuscle.obliques.phaseContext).toContain("isometric");
    expect(getBodyLabRoleOrder(["concentric propulsion"], ["hip extension"])).toEqual(["Primary Mover", "Synergist", "Stabilizer", "Supporting"]);
    expect(getBodyLabRoleOrder(["eccentric absorption with isometric trunk control"], ["trunk anti-rotation"])).toEqual(["Primary Mover", "Stabilizer", "Synergist", "Supporting"]);
    expect(getBodyLabRoleOrder(["eccentric braking"], ["knee flexion"])).toEqual(["Primary Mover", "Stabilizer", "Synergist", "Supporting"]);
  });
});
