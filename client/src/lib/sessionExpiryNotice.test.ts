import { describe, expect, it } from "vitest";
import { expiryNotice, isExpiryError } from "./sessionExpiryNotice";

/**
 * The shared words and the refusal test. When to speak (never on the device store, once per
 * lapse, not after a deliberate sign-out) is lib/sessionNotice.ts's job and is tested there;
 * this module used to decide it with a flag and a 60-second window (Sep 28 regression brief §7).
 */
const refused = { data: { code: "UNAUTHORIZED" } };

describe("the sign-in expiry words", () => {
  it("recognises a refused sign-in, and nothing else, for the no-retry rule", () => {
    expect(isExpiryError(refused)).toBe(true);
    for (const other of [null, undefined, new Error("offline"), { data: { code: "FORBIDDEN" } }, { data: { code: "NOT_FOUND" } }, { data: { code: "INTERNAL_SERVER_ERROR" } }]) expect(isExpiryError(other)).toBe(false);
  });

  // It used to say "Sign in again from About me to sync", and there is no sign-in there (or
  // anywhere in this build) to go back to.
  it("does not send the athlete to a sign-in control that is not there", () => {
    expect(expiryNotice.title).toBe("You're signed out of your account");
    expect(expiryNotice.description).not.toMatch(/sign[ -]?in/i);
    expect(expiryNotice.description).not.toMatch(/about me/i);
    expect(expiryNotice.description).toBe("Changes you make are kept on this device.");
  });

  it("shares one toast id with the app-wide notice, so a control's own message replaces it", () => {
    expect(expiryNotice.id).toBe("session-expired");
  });
});
