import { afterEach, describe, expect, it, vi } from "vitest";
import { emitInteractionFeedback } from "./interactionFeedback";

/**
 * Vibration is a best-effort extra on a tap: where the browser offers it the athlete feels
 * the tap, and where it does not (Safari, a blocked page, a server render) the tap still works.
 */
describe("interaction feedback fallback", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("vibrates briefly by default and passes a given pattern through", () => {
    const vibrate = vi.fn(() => true);
    vi.stubGlobal("navigator", { vibrate });

    emitInteractionFeedback();
    emitInteractionFeedback([10, 30]);

    expect(vibrate).toHaveBeenNthCalledWith(1, 12);
    expect(vibrate).toHaveBeenNthCalledWith(2, [10, 30]);
  });

  it("does not let a refused vibration break the tap", () => {
    vi.stubGlobal("navigator", { vibrate: () => { throw new Error("blocked"); } });
    expect(() => emitInteractionFeedback()).not.toThrow();
  });

  it("does nothing where the browser has no vibration (Safari)", () => {
    vi.stubGlobal("navigator", {});
    expect(() => emitInteractionFeedback()).not.toThrow();
  });

  it("does nothing where there is no navigator at all", () => {
    vi.stubGlobal("navigator", undefined);
    expect(() => emitInteractionFeedback()).not.toThrow();
  });
});
