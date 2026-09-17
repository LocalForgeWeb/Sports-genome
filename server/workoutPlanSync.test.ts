import { describe, expect, it } from "vitest";
import { maxPlanBytes, resolvePlanWrite, type StoredPlanRecord } from "./workoutPlanSync";

const stored = (overrides: Partial<StoredPlanRecord> = {}): StoredPlanRecord => ({
  planJson: '{"version":2}',
  planVersion: 2,
  revision: 4,
  updatedAt: new Date("2026-09-17T10:00:00Z"),
  ...overrides,
});

/**
 * Every device that edits offline produces a plan that believes it is current, so
 * the hard part is not storing the plan but deciding which one wins. Last-write-wins
 * would let a phone that sat in a pocket with a stale plan erase a session built on
 * a laptop an hour earlier, simply by saving second.
 */
describe("resolvePlanWrite", () => {
  it("accepts the first plan an athlete ever saves", () => {
    expect(resolvePlanWrite({ planJson: "{}", baseRevision: null }, null)).toEqual({ action: "write", revision: 1 });
  });

  it("accepts an edit made on top of the current revision", () => {
    expect(resolvePlanWrite({ planJson: "{}", baseRevision: 4 }, stored())).toEqual({ action: "write", revision: 5 });
  });

  it("refuses a write built on a revision another device has already replaced", () => {
    const result = resolvePlanWrite({ planJson: "{}", baseRevision: 3 }, stored({ revision: 4 }));
    expect(result).toMatchObject({ action: "reject", reason: "stale" });
  });

  it("hands back the current plan so the loser can reconcile rather than guess", () => {
    const current = stored({ revision: 9, planJson: '{"built":"elsewhere"}' });
    const result = resolvePlanWrite({ planJson: "{}", baseRevision: 2 }, current);
    expect(result).toMatchObject({ reason: "stale", current: { planJson: '{"built":"elsewhere"}' } });
  });

  it("refuses a device that has never seen the server's copy", () => {
    // Writing blind would delete whatever is already there.
    const result = resolvePlanWrite({ planJson: "{}", baseRevision: null }, stored());
    expect(result).toMatchObject({ action: "reject", reason: "stale" });
  });

  it("increments from the stored revision, not from the client's claim", () => {
    const result = resolvePlanWrite({ planJson: "{}", baseRevision: 7 }, stored({ revision: 7 }));
    expect(result).toEqual({ action: "write", revision: 8 });
  });

  it("refuses a plan beyond the size ceiling before touching anything else", () => {
    const huge = "x".repeat(maxPlanBytes + 1);
    expect(resolvePlanWrite({ planJson: huge, baseRevision: null }, null)).toEqual({
      action: "reject", reason: "too-large",
    });
  });

  it("accepts a plan exactly at the ceiling", () => {
    const atLimit = "x".repeat(maxPlanBytes);
    expect(resolvePlanWrite({ planJson: atLimit, baseRevision: null }, null)).toMatchObject({ action: "write" });
  });
});
