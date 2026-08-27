import { describe, expect, it } from "vitest";
import { hasPasskeyOption, nextPasswordFailureState } from "./localAuth";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./localAuth.ts", import.meta.url), "utf8");

describe("standalone email authentication safeguards", () => {
  it("locks an email credential on the fifth consecutive failed password", () => {
    const beforeLock = nextPasswordFailureState(3, 1_000);
    const locked = nextPasswordFailureState(4, 1_000);

    expect(beforeLock).toEqual({ failedAttempts: 4, lockedUntil: null, locked: false });
    expect(locked.failedAttempts).toBe(0);
    expect(locked.locked).toBe(true);
    expect(locked.lockedUntil?.getTime()).toBe(901_000);
  });

  it("offers passkey authentication only when the email account has an enrolled credential", () => {
    expect(hasPasskeyOption(0)).toBe(false);
    expect(hasPasskeyOption(1)).toBe(true);
  });

  it("uses the current Sports Genome identity for a passkey registration prompt", () => {
    expect(source).toContain('rpName: "Sports Genome"');
    expect(source).toContain('"Sports Genome athlete"');
    expect(source).not.toContain('rpName: "Gym Optimizer"');
  });
});
