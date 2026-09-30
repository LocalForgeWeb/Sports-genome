// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { planFingerprint } from "./planSyncDecision";
import { planSyncBaseKey } from "./planSyncBase";

/**
 * The plan sync, end to end against a fake account API (Backend V1 SV-04, PS-04, PS-05).
 * Reproduced in discovery: on a conflict the hook took the account's revision and pushed the
 * stale plan again 1.5 s later ("phone stale edit", rev 7), and a first pull replaced a
 * device's offline edits with any differing account copy.
 */
const api = vi.hoisted(() => ({
  server: null as null | { planJson: string; planVersion: number; revision: number; updatedAt: Date },
  saves: [] as { planJson: string; baseRevision: number | null }[],
  respond: (_input: { planJson: string; baseRevision: number | null }) => ({ status: "saved", revision: 1, updatedAt: new Date() }) as unknown,
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    workoutPlan: {
      get: { useQuery: () => ({ data: api.server, isLoading: false, isError: false }) },
      save: { useMutation: () => ({ mutateAsync: async (input: { planJson: string; baseRevision: number | null }) => { api.saves.push(input); return api.respond(input); } }) },
    },
  },
}));

import { usePlanSync } from "./usePlanSync";

const plan = (label: string) => JSON.stringify({ version: 2, label });
const base = (json: string, revision: number) => window.localStorage.setItem(planSyncBaseKey(7), JSON.stringify({ revision, syncedHash: planFingerprint(json) }));
const mount = (planJson: string, onAdopt = vi.fn()) => ({ onAdopt, hook: renderHook(({ json }) => usePlanSync({ enabled: true, accountId: 7, planJson: json, planVersion: 2, onAdoptServerPlan: onAdopt }), { initialProps: { json: planJson } }) });
const flush = async (ms = 1_600) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };

beforeEach(() => { vi.useFakeTimers(); window.localStorage.clear(); api.server = null; api.saves = []; });
afterEach(() => { vi.useRealTimers(); });

describe("Pulling on sign-in", () => {
  it("keeps this device's offline edits when the account has not moved, and pushes them", async () => {
    api.server = { planJson: plan("synced"), planVersion: 2, revision: 4, updatedAt: new Date("2026-09-01") };
    base(plan("synced"), 4);
    api.respond = () => ({ status: "saved", revision: 5, updatedAt: new Date() });
    const { onAdopt, hook } = mount(plan("edited offline"));
    await flush();
    expect(onAdopt).not.toHaveBeenCalled();
    expect(api.saves).toEqual([{ planJson: plan("edited offline"), planVersion: 2, baseRevision: 4 }]);
    expect(hook.result.current.state).toBe("synced");
  });

  it("takes the account's copy when only the account changed", async () => {
    api.server = { planJson: plan("from the laptop"), planVersion: 2, revision: 5, updatedAt: new Date() };
    base(plan("synced"), 4);
    const { onAdopt } = mount(plan("synced"));
    await flush();
    expect(onAdopt).toHaveBeenCalledWith(plan("from the laptop"));
    expect(api.saves).toEqual([]);
  });

  it("asks when both changed, and replaces nothing", async () => {
    api.server = { planJson: plan("laptop edit"), planVersion: 2, revision: 5, updatedAt: new Date() };
    base(plan("synced"), 4);
    const { onAdopt, hook } = mount(plan("phone edit"));
    await flush(5_000);
    expect(hook.result.current.state).toBe("conflict");
    expect(onAdopt).not.toHaveBeenCalled();
    expect(api.saves).toEqual([]);
  });
});

describe("A conflict on save", () => {
  it("stops pushing instead of writing over the other device, until the athlete chooses", async () => {
    api.server = { planJson: plan("synced"), planVersion: 2, revision: 4, updatedAt: new Date() };
    base(plan("synced"), 4);
    api.respond = () => ({ status: "conflict", current: { planJson: plan("laptop edit"), planVersion: 2, revision: 6, updatedAt: new Date() } });
    const { hook } = mount(plan("synced"));
    await flush();
    hook.rerender({ json: plan("phone edit") });
    await flush();
    expect(api.saves).toHaveLength(1);
    expect(hook.result.current.state).toBe("conflict");
    // It used to push again on the other device's revision within 1.5 s.
    hook.rerender({ json: plan("phone edit, more") });
    await flush(10_000);
    expect(api.saves).toHaveLength(1);

    api.respond = () => ({ status: "saved", revision: 7, updatedAt: new Date() });
    await act(async () => { hook.result.current.resolveConflict("device"); });
    await flush(10);
    expect(api.saves.at(-1)).toMatchObject({ planJson: plan("phone edit, more"), baseRevision: 6 });
    expect(hook.result.current.state).toBe("synced");
  });

  it("loads the account's plan when the athlete takes it", async () => {
    api.server = { planJson: plan("laptop edit"), planVersion: 2, revision: 5, updatedAt: new Date() };
    base(plan("synced"), 4);
    const { onAdopt, hook } = mount(plan("phone edit"));
    await flush();
    await act(async () => { hook.result.current.resolveConflict("account"); });
    expect(onAdopt).toHaveBeenCalledWith(plan("laptop edit"));
    expect(JSON.parse(window.localStorage.getItem(planSyncBaseKey(7))!)).toEqual({ revision: 5, syncedHash: planFingerprint(plan("laptop edit")) });
  });
});
