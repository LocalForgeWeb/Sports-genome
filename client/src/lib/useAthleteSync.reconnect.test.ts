// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IdentityState } from "./athleteIdentity";
import type { ReferenceMap } from "./supabaseReferenceMap";

/**
 * An offline launch leaves the athlete with no account id and no exercise map, and About me
 * says the record "will sync when it is back". Both used to be asked for once per launch, so
 * queued lifts waited for a reload however long the network had been back.
 */
const sync = vi.hoisted(() => ({
  ensureAthleteIdentity: vi.fn(),
  refreshReferenceMap: vi.fn(),
  flushSyncQueue: vi.fn(),
}));
vi.mock("@/lib/athleteIdentity", () => ({ ensureAthleteIdentity: sync.ensureAthleteIdentity, upsertAthleteProfile: vi.fn() }));
vi.mock("@/lib/supabaseReferenceMap", () => ({ loadCachedReferenceMap: () => null, refreshReferenceMap: sync.refreshReferenceMap }));
vi.mock("@/lib/strengthSyncQueue", () => ({
  enqueueLifts: () => [],
  flushSyncQueue: sync.flushSyncQueue,
  loadSyncQueue: () => [],
  loadSyncedKeys: () => [],
  saveSyncQueue: () => true,
}));
vi.mock("@/lib/resilienceCatalogClient", () => ({ fetchTargetCatalogAsAthlete: async () => null }));
vi.mock("@/lib/capacityContext", () => ({ capacitySignature: () => "none", loadCapacityContext: async () => null, saveCapacityContext: async () => undefined }));

import { useAthleteSync } from "./useAthleteSync";

const appSports = [{ id: "wrestling", label: "Wrestling" }] as const;
const unreachable: IdentityState = { userId: null, anonymous: true, reason: "unreachable" };
const signedIn: IdentityState = { userId: "user-1", anonymous: true };
const map: ReferenceMap = { exerciseUuidByCatalogId: { 1: "00000000-0000-0000-0000-00000000000e" }, sportUuidBySlug: {}, loadedAt: "2026-09-28T12:00:00.000Z" };

const mount = () => renderHook(() => useAthleteSync({ weightUnit: "kg", appSports, enabled: true }));
const settle = async () => { await act(async () => { for (let i = 0; i < 5; i += 1) await Promise.resolve(); }); };
const goOnline = async () => { await act(async () => { window.dispatchEvent(new Event("online")); }); await settle(); };
const lastFlush = () => sync.flushSyncQueue.mock.calls.at(-1) as [string | null, (catalogId: number) => string | undefined];

beforeEach(() => {
  window.localStorage.clear();
  sync.ensureAthleteIdentity.mockReset();
  sync.refreshReferenceMap.mockReset();
  sync.flushSyncQueue.mockReset().mockResolvedValue({ sent: 0, remaining: 0, skipped: 0 });
});

describe("Coming back online after an offline launch", () => {
  it("asks for the account id and the exercise map again, and sends the queue with them", async () => {
    sync.ensureAthleteIdentity.mockResolvedValueOnce(unreachable).mockResolvedValueOnce(signedIn);
    sync.refreshReferenceMap.mockResolvedValueOnce(null).mockResolvedValueOnce(map);
    const { result } = mount();
    await settle();
    expect(result.current.identity.reason).toBe("unreachable");
    expect(lastFlush()[0]).toBeNull();

    await goOnline();
    expect(sync.ensureAthleteIdentity).toHaveBeenCalledTimes(2);
    expect(sync.refreshReferenceMap).toHaveBeenCalledTimes(2);
    expect(result.current.identity.userId).toBe("user-1");
    expect(lastFlush()[0]).toBe("user-1");
    expect(lastFlush()[1](1)).toBe("00000000-0000-0000-0000-00000000000e");
  });

  it("keeps a map that arrives after the account id", async () => {
    let deliverMap: (value: ReferenceMap) => void = () => {};
    sync.ensureAthleteIdentity.mockResolvedValueOnce(unreachable).mockResolvedValueOnce(signedIn);
    sync.refreshReferenceMap.mockResolvedValueOnce(null).mockReturnValueOnce(new Promise<ReferenceMap>((resolve) => { deliverMap = resolve; }));
    mount();
    await settle();
    await goOnline();
    expect(lastFlush()[0]).toBe("user-1");
    expect(lastFlush()[1](1)).toBeUndefined();

    await act(async () => { deliverMap(map); });
    await settle();
    expect(lastFlush()[1](1)).toBe("00000000-0000-0000-0000-00000000000e");
  });

  it("asks again when the app is shown again, where no online event fires", async () => {
    sync.ensureAthleteIdentity.mockResolvedValueOnce(unreachable).mockResolvedValueOnce(signedIn);
    sync.refreshReferenceMap.mockResolvedValue(map);
    const { result } = mount();
    await settle();
    await act(async () => { document.dispatchEvent(new Event("visibilitychange")); });
    await settle();
    expect(sync.ensureAthleteIdentity).toHaveBeenCalledTimes(2);
    expect(result.current.identity.userId).toBe("user-1");
  });

  it("does not ask again when the account service is not set up, which a retry cannot change", async () => {
    sync.ensureAthleteIdentity.mockResolvedValue({ userId: null, anonymous: true, reason: "not_configured" });
    sync.refreshReferenceMap.mockResolvedValue(map);
    mount();
    await settle();
    await goOnline();
    expect(sync.ensureAthleteIdentity).toHaveBeenCalledTimes(1);
  });
});
