import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import type { User } from "../drizzle/schema";

/**
 * The two finish steps against a stand-in database that holds one live challenge and, for
 * sign-in, one saved passkey. The passkey library itself is real, so a response it rejects
 * has to be caught on the way through: a rejected passkey is "not verified", not a server fault.
 * Kept apart from localAuth.test.ts so this module mock does not touch those tests.
 */
const state = {
  inserts: 0,
  updates: 0,
};

const challengeRow = { id: 1, challenge: "x" };
const savedPasskey = {
  passkey: { id: 3, credentialId: "abc", publicKey: Buffer.from([]).toString("base64"), counter: 0, transports: null },
  user: { id: 1 },
};

function selectChain(rows: unknown[]) {
  const chain = {
    from: () => chain,
    innerJoin: () => chain,
    where: () => ({ limit: async () => rows }),
  };
  return chain;
}

const fakeDb = {
  // The challenge lookup selects whole rows; the passkey lookup names its columns.
  select: (fields?: unknown) => selectChain(fields ? [savedPasskey] : [challengeRow]),
  delete: () => ({ where: async () => undefined }),
  insert: () => ({ values: async () => { state.inserts += 1; } }),
  update: () => ({ set: () => ({ where: async () => { state.updates += 1; } }) }),
};

vi.mock("./db", () => ({ getDb: async () => fakeDb }));

const { finishPasskeyAuthentication, finishPasskeyRegistration } = await import("./localAuth");

const req = { protocol: "https", headers: { host: "example.com" }, get: () => "example.com" } as unknown as Request;
const res = { cookie: vi.fn() } as unknown as Response;

beforeEach(() => {
  state.inserts = 0;
  state.updates = 0;
});

afterEach(() => vi.restoreAllMocks());

describe("finishing a passkey the library rejects", () => {
  it("answers INVALID_PASSKEY when saving a malformed passkey, and saves nothing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await finishPasskeyRegistration({ id: 1 } as User, {}, req);

    expect(result).toEqual({ ok: false, code: "INVALID_PASSKEY" });
    expect(state.inserts).toBe(0);
    expect(JSON.parse(String(warn.mock.calls[0]?.[0]))).toMatchObject({ event: "passkey_verification_rejected", step: "register" });
  });

  it("answers INVALID_PASSKEY when signing in with a stale challenge, and starts no session", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const clientDataJSON = Buffer.from(JSON.stringify({ type: "webauthn.get", challenge: "other", origin: "https://example.com" })).toString("base64url");
    const response = { id: "abc", rawId: "abc", type: "public-key", response: { clientDataJSON, authenticatorData: "", signature: "" }, clientExtensionResults: {} };

    const result = await finishPasskeyAuthentication("athlete@example.com", response, req, res);

    expect(result).toEqual({ ok: false, code: "INVALID_PASSKEY" });
    expect(state.updates).toBe(0);
    expect(state.inserts).toBe(0);
    expect(res.cookie).not.toHaveBeenCalled();
    expect(JSON.parse(String(warn.mock.calls[0]?.[0]))).toMatchObject({ event: "passkey_verification_rejected", step: "authenticate" });
  });
});
