import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";

/**
 * Registration against a stand-in database whose transaction fails the way MySQL does when
 * two requests register the same email at once: the unique index on the email lets one in
 * and the other's insert throws ER_DUP_ENTRY, nested in the driver's cause chain.
 * Kept apart from localAuth.test.ts so this module mock does not touch those tests.
 */
const state = { transactionError: null as unknown };

const fakeDb = {
  transaction: vi.fn(async () => { throw state.transactionError; }),
};

vi.mock("./db", () => ({ getDb: async () => fakeDb }));

const { registerEmailAccount } = await import("./localAuth");

const cookie = vi.fn();
const req = {} as Request;
const res = { cookie } as unknown as Response;

beforeEach(() => {
  state.transactionError = null;
  cookie.mockReset();
  fakeDb.transaction.mockClear();
});

describe("two registrations for one email at once", () => {
  it("answers the one that lost the race with EMAIL_EXISTS and starts no session", async () => {
    state.transactionError = Object.assign(new Error("Failed query"), { cause: { code: "ER_DUP_ENTRY", errno: 1062 } });

    const result = await registerEmailAccount({ email: "A@x.io", password: "twelve-chars-long" }, req, res);

    expect(result).toEqual({ ok: false, code: "EMAIL_EXISTS" });
    expect(fakeDb.transaction).toHaveBeenCalledTimes(1);
    expect(cookie).not.toHaveBeenCalled();
  });

  it("still fails on any other database error", async () => {
    state.transactionError = new Error("connection reset");

    await expect(registerEmailAccount({ email: "A@x.io", password: "twelve-chars-long" }, req, res)).rejects.toThrow("connection reset");
    expect(cookie).not.toHaveBeenCalled();
  });
});
