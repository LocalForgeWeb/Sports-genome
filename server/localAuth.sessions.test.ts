import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import type { SQL } from "drizzle-orm";
import type { Request, Response } from "express";

/**
 * Signing in against a stand-in database that records the statements a new session sends.
 * The DELETE's WHERE is rendered by Drizzle's own MySQL dialect, so the test reads the SQL
 * that would actually be sent. Kept apart from localAuth.test.ts so this module mock does
 * not touch those tests.
 */
const dialect = new MySqlDialect();
const state = {
  calls: [] as string[],
  deletes: [] as { sql: string; params: unknown[] }[],
  deleteFails: false,
};

const fakeDb = {
  transaction: async () => ({ ok: true as const, user: { id: 7 } }),
  delete: () => ({
    where: async (condition: SQL) => {
      state.calls.push("delete");
      state.deletes.push(dialect.sqlToQuery(condition));
      if (state.deleteFails) throw new Error("Lock wait timeout");
    },
  }),
  insert: () => ({ values: async () => { state.calls.push("insert"); } }),
};

vi.mock("./db", () => ({ getDb: async () => fakeDb }));

const { registerEmailAccount } = await import("./localAuth");

const cookie = vi.fn();
const req = { protocol: "https", headers: {} } as unknown as Request;
const res = { cookie } as unknown as Response;
const input = { email: "a@b.co", password: "x".repeat(12) };

beforeEach(() => {
  state.calls = []; state.deletes = []; state.deleteFails = false;
  cookie.mockReset();
});

afterEach(() => vi.restoreAllMocks());

describe("a new session sweeps the athlete's own expired sessions", () => {
  it("deletes only this athlete's sessions that have already expired", async () => {
    const before = Date.now();

    await registerEmailAccount(input, req, res);

    expect(state.deletes).toHaveLength(1);
    expect(state.deletes[0].sql).toMatch(/`userId` = \? and .*`expiresAt` < \?/);
    const [userId, cutoff] = state.deletes[0].params;
    expect(userId).toBe(7);
    // The timestamp column sends its Date as a UTC "YYYY-MM-DD HH:MM:SS.mmm" string.
    const cutoffTime = new Date(`${String(cutoff).replace(" ", "T")}Z`).getTime();
    expect(cutoffTime).toBeGreaterThanOrEqual(before);
    expect(cutoffTime).toBeLessThanOrEqual(Date.now());
  });

  it("sweeps before it saves the new session", async () => {
    await registerEmailAccount(input, req, res);

    expect(state.calls).toEqual(["delete", "insert"]);
  });

  it("still signs the athlete in when the sweep fails, and logs only the error's class", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    state.deleteFails = true;

    const result = await registerEmailAccount(input, req, res);

    expect(result).toMatchObject({ ok: true });
    expect(state.calls).toEqual(["delete", "insert"]);
    expect(cookie).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith("[Auth] Expired-session sweep skipped:", "Error");
  });
});
