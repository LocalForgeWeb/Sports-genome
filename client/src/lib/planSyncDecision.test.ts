import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { choosePlan, planFingerprint, reconcilePlans, sameEditToleranceMs } from "./planSyncDecision";

const at = (iso: string) => new Date(iso);
const hook = readFileSync(join(process.cwd(), "client/src/lib/usePlanSync.ts"), "utf8");
const router = readFileSync(join(process.cwd(), "server/routers.ts"), "utf8");

/**
 * Both copies exist for good reasons: the device copy is what the athlete built
 * last, possibly offline, and the account copy is what another device saved.
 * Choosing wrongly in either direction silently deletes real work.
 */
describe("choosePlan", () => {
  it("takes the account's plan on a device that has none", () => {
    expect(choosePlan({ planJson: null, updatedAt: null }, { planJson: "{}", updatedAt: at("2026-09-17T10:00:00Z") }))
      .toEqual({ use: "server", reason: "only-copy" });
  });

  it("keeps the device's plan when the account has none", () => {
    expect(choosePlan({ planJson: "{}", updatedAt: at("2026-09-17T10:00:00Z") }, { planJson: null, updatedAt: null }))
      .toEqual({ use: "device", reason: "only-copy" });
  });

  it("does nothing when neither side has a plan", () => {
    expect(choosePlan({ planJson: null, updatedAt: null }, { planJson: null, updatedAt: null }))
      .toEqual({ use: "neither" });
  });

  it("treats identical content as agreement, whatever the clocks say", () => {
    const same = '{"version":2}';
    expect(choosePlan(
      { planJson: same, updatedAt: at("2020-01-01T00:00:00Z") },
      { planJson: same, updatedAt: at("2026-09-17T10:00:00Z") }
    )).toEqual({ use: "device", reason: "same" });
  });

  it("takes the account's plan when it is genuinely newer", () => {
    expect(choosePlan(
      { planJson: '{"a":1}', updatedAt: at("2026-09-17T09:00:00Z") },
      { planJson: '{"b":2}', updatedAt: at("2026-09-17T10:00:00Z") }
    )).toEqual({ use: "server", reason: "newer" });
  });

  it("keeps a plan built offline after the account's last write", () => {
    // The reconnect must not quietly replace work done without a network.
    expect(choosePlan(
      { planJson: '{"offline":true}', updatedAt: at("2026-09-17T11:00:00Z") },
      { planJson: '{"older":true}', updatedAt: at("2026-09-17T10:00:00Z") }
    )).toEqual({ use: "device", reason: "newer" });
  });

  it("treats near-simultaneous writes as one edit arriving twice", () => {
    // A phone and a server never agree to the millisecond.
    expect(choosePlan(
      { planJson: '{"a":1}', updatedAt: at("2026-09-17T10:00:02Z") },
      { planJson: '{"b":2}', updatedAt: at("2026-09-17T10:00:00Z") }
    )).toEqual({ use: "device", reason: "same" });
    expect(sameEditToleranceMs).toBeGreaterThanOrEqual(1_000);
  });

  it("prefers the copy that can prove when it was written", () => {
    expect(choosePlan(
      { planJson: '{"a":1}', updatedAt: null },
      { planJson: '{"b":2}', updatedAt: at("2026-09-17T10:00:00Z") }
    )).toEqual({ use: "server", reason: "newer" });
  });

  it("keeps the device's plan when neither side can date itself", () => {
    expect(choosePlan({ planJson: '{"a":1}', updatedAt: null }, { planJson: '{"b":2}', updatedAt: null }))
      .toEqual({ use: "device", reason: "same" });
  });
});

describe("the sync keeps the device authoritative while editing", () => {
  it("pulls once per sign-in rather than polling", () => {
    expect(hook).toContain("pulledRef");
    expect(hook).toContain("refetchOnWindowFocus: false");
  });

  it("debounces the push, since the builder rewrites the plan on every small edit", () => {
    expect(hook).toContain("window.setTimeout");
    expect(hook).toContain("1_500");
  });

  it("does not re-push a plan it already sent", () => {
    expect(hook).toContain("planJson === lastPushedRef.current");
  });

  it("treats a failed push as degraded rather than fatal", () => {
    // The device copy still holds everything.
    expect(hook).toContain('setState("offline")');
  });

  // Intentional change (Backend V1 SV-04, PS-05): adopting the winner's revision and pushing
  // again 1.5 s later overwrote the other device's plan. A conflict now stops the push and
  // waits for the athlete.
  it("stops on a conflict instead of pushing over the other device", () => {
    expect(hook).not.toContain("revisionRef.current = result.current.revision");
    expect(hook).toContain('setState("conflict");');
    expect(hook).toContain("if (!enabled || !pulledRef.current || !planJson || conflict) return;");
  });

  it("sends the revision this device last agreed with, so the server can detect a stale write", () => {
    expect(hook).toContain("void push(planJson, base?.revision ?? remote.data?.revision ?? null);");
  });
});

describe("reconcilePlans: this device, the account, and where they last agreed (PS-04)", () => {
  const plan = (label: string) => JSON.stringify({ version: 2, label });
  const agreedOn = (json: string, revision: number) => ({ revision, syncedHash: planFingerprint(json) });

  it("keeps this device's offline edits when the account has not moved", () => {
    // It used to take any differing account copy, because the device kept no edit time.
    expect(reconcilePlans({ planJson: plan("edited offline") }, { planJson: plan("synced"), revision: 4 }, agreedOn(plan("synced"), 4)))
      .toEqual({ use: "device", reason: "account-unchanged" });
  });

  it("takes the account's copy when only the account changed", () => {
    expect(reconcilePlans({ planJson: plan("synced") }, { planJson: plan("from the laptop"), revision: 5 }, agreedOn(plan("synced"), 4)))
      .toEqual({ use: "server", reason: "device-unchanged" });
  });

  it("asks when both changed since they last agreed", () => {
    expect(reconcilePlans({ planJson: plan("phone edit") }, { planJson: plan("laptop edit"), revision: 5 }, agreedOn(plan("synced"), 4)))
      .toEqual({ use: "conflict" });
  });

  it("asks when this device has never agreed with the account and the copies differ", () => {
    expect(reconcilePlans({ planJson: plan("this device") }, { planJson: plan("the account"), revision: 2 }, null)).toEqual({ use: "conflict" });
  });

  it("settles the easy cases without a base", () => {
    expect(reconcilePlans({ planJson: null }, { planJson: plan("a"), revision: 1 }, null)).toEqual({ use: "server", reason: "only-copy" });
    expect(reconcilePlans({ planJson: plan("a") }, { planJson: null, revision: null }, null)).toEqual({ use: "device", reason: "only-copy" });
    expect(reconcilePlans({ planJson: plan("a") }, { planJson: plan("a"), revision: 3 }, null)).toEqual({ use: "same" });
    expect(reconcilePlans({ planJson: null }, { planJson: null, revision: null }, null)).toEqual({ use: "neither" });
  });

  it("fingerprints a plan stably", () => {
    expect(planFingerprint(plan("a"))).toBe(planFingerprint(plan("a")));
    expect(planFingerprint(plan("a"))).not.toBe(planFingerprint(plan("b")));
  });
});

describe("the plan endpoints are account-scoped", () => {
  it("requires a signed-in athlete", () => {
    const block = router.slice(router.indexOf("workoutPlan: router({"));
    expect(block.slice(0, 700)).toContain("get: protectedProcedure");
    expect(block.slice(0, 700)).toContain("save: protectedProcedure");
  });

  it("reads and writes only the caller's own plan", () => {
    const block = router.slice(router.indexOf("workoutPlan: router({"), router.indexOf("workoutPlan: router({") + 900);
    expect(block).toContain("ctx.user.id");
    expect(block).not.toContain("input.userId");
  });

  it("bounds the payload at the schema rather than trusting the client", () => {
    const block = router.slice(router.indexOf("workoutPlan: router({"), router.indexOf("workoutPlan: router({") + 900);
    expect(block).toContain("z.string().max(maxPlanBytes)");
  });
});
