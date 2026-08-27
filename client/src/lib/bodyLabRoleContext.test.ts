import { describe, expect, it } from "vitest";
import { getBodyLabRoleContext } from "./bodyLabRoleContext";

describe("Body Lab movement-specific role context", () => {
  it("uses the enriched movement record to distinguish prime movers, synergists, and stabilizers", () => {
    const context = getBodyLabRoleContext("wrestling", "wrestling-1", ["quads"], ["abs"]);
    expect(context.rolesByMuscle.glutes.roles).toContain("Primary Mover");
    expect(context.rolesByMuscle.hamstrings.roles).toContain("Synergist");
    expect(context.rolesByMuscle.obliques.roles).toContain("Stabilizer");
    expect(context.rolesByMuscle.glutes.confidence).toBe("Moderate biomechanical inference");
  });

  it("uses an explicit low-confidence qualitative fallback when a movement lacks an enriched record", () => {
    const context = getBodyLabRoleContext("test", "missing", ["quads"], ["abs"]);
    expect(context.rolesByMuscle.quads.roles).toEqual(["Primary Mover"]);
    expect(context.rolesByMuscle.abs.roles).toEqual(["Supporting"]);
    expect(context.rolesByMuscle.quads.confidence).toBe("Low-confidence inference");
  });
});
