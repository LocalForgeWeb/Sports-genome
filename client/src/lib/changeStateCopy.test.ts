import { describe, expect, it } from "vitest";
import { changeStateLabel, changeTone } from "./changeStateCopy";

describe("the change states, as every screen names them", () => {
  // Sep 30 §6: a first-versus-latest estimate is not evidence of a confirmed change.
  it("names the size of the change against the estimate, and never claims it is confirmed", () => {
    expect(changeStateLabel.stable).toBe("Within normal variation (under 6%)");
    expect(changeStateLabel.directional_signal_emerging).toBe("Early change (6–15%)");
    expect(changeStateLabel.meaningful_change_supported).toBe("Larger change (15% or more)");
    expect(Object.values(changeStateLabel).join(" ")).not.toMatch(/confirm/i);
  });

  it("colours a change by its direction, so a large drop is not drawn as a gain", () => {
    expect(changeTone({ changeState: "meaningful_change_supported", relativeChangePercent: 25 })).not.toBe(changeTone({ changeState: "meaningful_change_supported", relativeChangePercent: -25 }));
    expect(changeTone({ changeState: "stable", relativeChangePercent: 4 })).toBe(changeTone({ changeState: "stable", relativeChangePercent: -4 }));
  });
});
