import { describe, expect, it, vi, beforeEach } from "vitest";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import type { SQL } from "drizzle-orm";

/**
 * The save against a stand-in database that behaves like MySQL for the two statements
 * that matter: an UPDATE matches only when its WHERE holds, and a second INSERT for the
 * same user hits the unique index. The WHERE is rendered by Drizzle's own MySQL dialect,
 * so the test reads the SQL that would actually be sent.
 */
const dialect = new MySqlDialect();
const state = {
  row: null as null | { planJson: string; planVersion: number; revision: number; updatedAt: Date },
  /** A save that lands between this request's read and its write. */
  raceTo: null as null | number,
  updates: [] as { sql: string; params: unknown[] }[],
  duplicateOnInsert: false,
};

const fakeDb = {
  select: () => ({ from: () => ({ where: () => ({ limit: async () => (state.row ? [{ ...state.row }] : []) }) }) }),
  update: () => ({
    set: (values: { planJson: string; planVersion: number; revision: number }) => ({
      where: async (condition: SQL) => {
        const rendered = dialect.sqlToQuery(condition);
        state.updates.push(rendered);
        if (state.raceTo !== null && state.row) { state.row.revision = state.raceTo; state.raceTo = null; }
        // The stand-in evaluates the one clause under test: `revision` = the value bound for it.
        const expectedRevision = rendered.params[rendered.params.length - 1];
        const matches = state.row !== null && state.row.revision === expectedRevision;
        if (matches) state.row = { ...state.row!, ...values, updatedAt: new Date() };
        return [{ affectedRows: matches ? 1 : 0 }];
      },
    }),
  }),
  insert: () => ({
    values: async (values: { planJson: string; planVersion: number; revision: number }) => {
      if (state.duplicateOnInsert) {
        state.row = { planJson: '{"won":"other device"}', planVersion: 2, revision: 1, updatedAt: new Date() };
        throw Object.assign(new Error("Failed query"), { cause: { code: "ER_DUP_ENTRY", errno: 1062 } });
      }
      state.row = { ...values, updatedAt: new Date() };
    },
  }),
};

vi.mock("./db", () => ({ getDb: async () => fakeDb }));

const { saveWorkoutPlan, isDuplicateKey, affectedRows } = await import("./workoutPlanSync");

beforeEach(() => {
  state.row = null; state.raceTo = null; state.updates = []; state.duplicateOnInsert = false;
});

describe("Saving a plan is one check-and-write", () => {
  it("puts the revision in the UPDATE's own WHERE", async () => {
    state.row = { planJson: "{}", planVersion: 2, revision: 4, updatedAt: new Date() };
    const result = await saveWorkoutPlan(7, { planJson: '{"mine":1}', planVersion: 2, baseRevision: 4 });
    expect(result).toMatchObject({ status: "saved", revision: 5 });
    expect(state.updates[0].sql).toMatch(/`userId` = \? and `athleteWorkoutPlans`\.`revision` = \?/);
    expect(state.updates[0].params).toEqual(expect.arrayContaining([7, 4]));
  });

  /** Two devices both read revision 4; the other one saves first. */
  it("turns a save that lost the race into a conflict instead of overwriting", async () => {
    state.row = { planJson: '{"theirs":1}', planVersion: 2, revision: 4, updatedAt: new Date() };
    state.raceTo = 5;
    const result = await saveWorkoutPlan(7, { planJson: '{"mine":1}', planVersion: 2, baseRevision: 4 });
    expect(result.status).toBe("conflict");
    expect(result.status === "conflict" && result.current.revision).toBe(5);
    expect(state.row?.planJson).toBe('{"theirs":1}');
  });

  it("turns two first saves at once into one save and one conflict, not a server error", async () => {
    state.duplicateOnInsert = true;
    const result = await saveWorkoutPlan(7, { planJson: '{"mine":1}', planVersion: 2, baseRevision: null });
    expect(result).toMatchObject({ status: "conflict", current: { planJson: '{"won":"other device"}' } });
  });

  it("recognises a duplicate key however the driver nests it", () => {
    expect(isDuplicateKey({ code: "ER_DUP_ENTRY" })).toBe(true);
    expect(isDuplicateKey({ cause: { cause: { errno: 1062 } } })).toBe(true);
    expect(isDuplicateKey(new Error("connection reset"))).toBe(false);
    expect(affectedRows({ affectedRows: 1 })).toBe(1);
    expect(affectedRows(undefined)).toBe(0);
  });
});
