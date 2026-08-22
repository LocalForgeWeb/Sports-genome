import { describe, expect, it } from "vitest";
import { initialMovementForSport } from "./sportSwitching";

describe("sport switching", () => {
  it("resets to a valid sport-specific action rather than retaining an incompatible movement", () => {
    const soccer = initialMovementForSport("soccer");
    const swimming = initialMovementForSport("swimming");
    expect(soccer).toMatchObject({ sportId: "soccer", id: expect.any(String) });
    expect(swimming).toMatchObject({ sportId: "swimming", id: expect.any(String) });
    expect(soccer?.id).not.toBe(swimming?.id);
    expect(initialMovementForSport("unknown-sport")).toBeUndefined();
  });
});
