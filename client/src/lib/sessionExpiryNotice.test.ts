import { beforeEach, describe, expect, it } from "vitest";
import { expiryNotice, forgetSession, isExpiryError, markSessionSeen, resetSessionExpiryNoticeForTests, shouldNoticeExpiry } from "./sessionExpiryNotice";

/**
 * "Your sign-in has expired" used to fire on any refused request. In the device workspace
 * nobody is signed in, so opening About me (its passkeys query is account-only) told the
 * athlete a sign-in had lapsed that never existed.
 */
const refused = { data: { code: "UNAUTHORIZED" } };

beforeEach(() => { resetSessionExpiryNoticeForTests(); });

describe("the sign-in expiry notice", () => {
  it("stays quiet for an athlete who was never signed in", () => {
    expect(shouldNoticeExpiry(refused, 1_000)).toBe(false);
    expect(shouldNoticeExpiry(refused, 120_000)).toBe(false);
  });

  it("speaks once for a real lapse, then waits a minute before speaking again", () => {
    markSessionSeen();
    expect(shouldNoticeExpiry(refused, 1_000)).toBe(true);
    expect(shouldNoticeExpiry(refused, 30_000)).toBe(false);
    expect(shouldNoticeExpiry(refused, 61_001)).toBe(true);
  });

  it("speaks the first time even at time zero", () => {
    markSessionSeen();
    expect(shouldNoticeExpiry(refused, 0)).toBe(true);
  });

  it("ignores every failure that is not a refused sign-in", () => {
    markSessionSeen();
    expect(shouldNoticeExpiry(null, 1_000)).toBe(false);
    expect(shouldNoticeExpiry(undefined, 1_000)).toBe(false);
    expect(shouldNoticeExpiry(new Error("offline"), 1_000)).toBe(false);
    expect(shouldNoticeExpiry({ data: { code: "FORBIDDEN" } }, 1_000)).toBe(false);
    expect(shouldNoticeExpiry({ data: { code: "INTERNAL_SERVER_ERROR" } }, 1_000)).toBe(false);
  });

  it("does not tell an athlete who signed out that their sign-in expired", () => {
    markSessionSeen();
    forgetSession();
    expect(shouldNoticeExpiry(refused, 1_000)).toBe(false);
  });

  it("still recognises a refused sign-in for the no-retry rule, seen or not", () => {
    expect(isExpiryError(refused)).toBe(true);
    expect(isExpiryError({ data: { code: "NOT_FOUND" } })).toBe(false);
    expect(isExpiryError(null)).toBe(false);
  });

  // It used to say "Sign in again from About me to sync", and there is no sign-in there
  // (or anywhere in this build) to go back to. Revert when a real sign-in path ships.
  it("does not send the athlete to a sign-in control that is not there", () => {
    expect(expiryNotice.title).toBe("Your sign-in has expired");
    expect(expiryNotice.description).not.toMatch(/sign[ -]?in/i);
    expect(expiryNotice.description).not.toMatch(/about me/i);
    expect(expiryNotice.description).toBe("Everything stays saved on this device.");
  });
});
