import { afterEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { hasPasskeyOption, nextPasswordFailureState, verifyPasskeyAuthentication, verifyPasskeyRegistration } from "./localAuth";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
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

describe("passkey verification the library rejects", () => {
  afterEach(() => vi.restoreAllMocks());

  it("reports a stale challenge as not verified instead of throwing, and logs no detail", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const clientDataJSON = Buffer.from(JSON.stringify({ type: "webauthn.get", challenge: "other", origin: "https://example.com" })).toString("base64url");

    const result = await verifyPasskeyAuthentication({
      response: { id: "abc", rawId: "abc", type: "public-key", response: { clientDataJSON, authenticatorData: "", signature: "" }, clientExtensionResults: {} },
      expectedChallenge: "x",
      expectedOrigin: "https://example.com",
      expectedRPID: "example.com",
      credential: { id: "abc", publicKey: new Uint8Array(), counter: 0 },
    });

    expect(result).toEqual({ verified: false });
    expect(warn).toHaveBeenCalledTimes(1);
    const logged = String(warn.mock.calls[0]?.[0]);
    expect(JSON.parse(logged)).toEqual({ scope: "auth", event: "passkey_verification_rejected", step: "authenticate" });
    expect(logged).not.toContain("other");
  });

  it("reports a malformed registration as not verified instead of throwing", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await verifyPasskeyRegistration({
      response: {} as Parameters<typeof verifyPasskeyRegistration>[0]["response"],
      expectedChallenge: "x",
      expectedOrigin: "https://example.com",
      expectedRPID: "example.com",
    });

    expect(result).toEqual({ verified: false });
  });

  it("refuses an oversized credential id before it reaches the database", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    const attempt = caller.auth.passkeyAuthenticationVerify({ email: "athlete@example.com", response: { id: "a".repeat(2000) } });

    await expect(attempt).rejects.toBeInstanceOf(TRPCError);
    await expect(attempt).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
