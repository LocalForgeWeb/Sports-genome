import { describe, expect, it } from "vitest";
import { movementDisplayLabel } from "@/lib/movementLabel";
import { sportMovementProfiles } from "@/lib/sportMovementDatabase";

describe("movementDisplayLabel", () => {
  it("reads the recording's action as a sentence that can wrap at the slash", () => {
    expect(movementDisplayLabel("overhook/whizzer")).toBe("Overhook / whizzer");
  });

  it("keeps an already spaced slash single-spaced and leaves the rest of the words alone", () => {
    expect(movementDisplayLabel("upper-body throw / hip-toss pattern")).toBe("Upper-body throw / hip-toss pattern");
    expect(movementDisplayLabel("double-leg shot")).toBe("Double-leg shot");
  });

  it("gives every stored action a non-empty label that starts with a capital", () => {
    for (const movement of sportMovementProfiles) {
      const shown = movementDisplayLabel(movement.label);
      expect(shown.length, movement.id).toBeGreaterThan(0);
      expect(shown[0], movement.id).toBe(shown[0].toUpperCase());
      expect(shown, movement.id).not.toMatch(/\S\/|\/\S/);
    }
  });
});
