import { describe, expect, it } from "vitest";
import { getAdjacentMovement } from "./bodyLabNavigation";
import type { SportMovementProfile } from "./sportMovementDatabase";

const movement = (id: string): SportMovementProfile => ({ id, sportId: "test", sportLabel: "Test", label: id, bodyActions: "", primaryMuscles: "", stabilizers: "", muscleActions: "", family: "", gymTransferCue: "" });

describe("Body Lab movement navigation", () => {
  it("cycles through actions and wraps at both ends", () => {
    const actions = [movement("one"), movement("two"), movement("three")];
    expect(getAdjacentMovement(actions, "one", -1)?.id).toBe("three");
    expect(getAdjacentMovement(actions, "three", 1)?.id).toBe("one");
  });
});
