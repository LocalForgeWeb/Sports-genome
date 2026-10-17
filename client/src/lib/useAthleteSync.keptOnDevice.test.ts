// @vitest-environment jsdom
import { createElement } from "react";
import { act, cleanup, render, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { saveDeviceWorkoutSessions, type DeviceWorkoutSession } from "./deviceWorkoutLog";
import type { FlushResult, QueuedLift } from "./strengthSyncQueue";
import type { ReferenceMap } from "./supabaseReferenceMap";

/**
 * Lifts on catalog rows the account has no mapping for (the forearm rows 401–414) stay queued and
 * are never sent, as intended. They used to count as "waiting to upload" forever (R3). Once the
 * reference map has loaded they are counted apart, and the account card says they are kept on this
 * device; the queue itself is unchanged.
 */
const sync = vi.hoisted(() => ({ flushSyncQueue: vi.fn(), map: null as ReferenceMap | null, refreshed: undefined as ReferenceMap | null | undefined }));
vi.mock("@/lib/athleteIdentity", () => ({ ensureAthleteIdentity: async () => ({ userId: "u1", anonymous: true }), upsertAthleteProfile: vi.fn(async () => true), attachEmailToIdentity: vi.fn() }));
vi.mock("@/lib/supabaseReferenceMap", () => ({ loadCachedReferenceMap: () => sync.map, refreshReferenceMap: async () => { if (sync.refreshed !== undefined) sync.map = sync.refreshed; return sync.map; } }));
vi.mock("@/lib/strengthSyncQueue", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./strengthSyncQueue")>()),
  flushSyncQueue: sync.flushSyncQueue,
}));
vi.mock("@/lib/resilienceCatalogClient", () => ({ fetchTargetCatalogAsAthlete: async () => null }));
vi.mock("@/lib/capacityContext", () => ({ capacitySignature: () => "none", loadCapacityContext: async () => null, saveCapacityContext: async () => undefined }));

import { liftsKeptOnDevice, liftsWaitingToUpload, referenceMapChangedEvent, useAthleteSync } from "./useAthleteSync";
import { loadSyncQueue } from "./strengthSyncQueue";
import { AthleteAccountCard } from "@/components/AthleteAccountCard";

const idle: FlushResult = { sent: 0, remaining: 0, skipped: 0 };
const mapOf = (ids: number[]): ReferenceMap => ({ exerciseUuidByCatalogId: Object.fromEntries(ids.map((id) => [id, `uuid-${id}`])), sportUuidBySlug: {}, loadedAt: "2026-10-16T00:00:00.000Z" });
const lift = (key: string, catalogExerciseId: number): QueuedLift => ({
  key, queuedAt: "2026-10-16T00:00:00.000Z", athlete: {},
  lift: { catalogExerciseId, observedAt: "2026-10-16T00:00:00.000Z", measurementType: "estimated", reportedLoad: 45, reportedUnit: "lb", repetitions: 12, source: "device", loadSemantics: "total_external_load" } as QueuedLift["lift"],
});
const session = (exercises: { id: string; name: string; catalogId: number }[]): DeviceWorkoutSession => ({
  id: "s1", title: "Pull", dayLabel: "Monday", startedAt: "2026-10-16T10:00:00.000Z", completedAt: "2026-10-16T11:00:00.000Z", status: "completed", weightUnit: "lb",
  exercises: exercises.map((item) => ({ id: item.id, exerciseName: item.name, catalogId: item.catalogId, plannedPrescription: "3 × 12", sets: [{ weight: "45", reps: "12", unit: "lb", completed: true }] })),
});
const settle = async () => { await act(async () => { for (let i = 0; i < 5; i += 1) await Promise.resolve(); }); };

beforeEach(() => {
  window.localStorage.clear();
  sync.map = null;
  sync.refreshed = undefined;
  sync.flushSyncQueue.mockReset().mockResolvedValue(idle);
});
afterEach(() => cleanup());

describe("counting the outbox", () => {
  const queue = [lift("a", 1), lift("b", 401), lift("c", 410)];

  it("counts every queued lift as waiting until the reference map has loaded", () => {
    expect(liftsKeptOnDevice(queue, null)).toBe(0);
    expect(liftsWaitingToUpload(queue, null)).toBe(3);
    // An empty mapping read says nothing about which exercises the account lacks.
    expect(liftsKeptOnDevice(queue, mapOf([]))).toBe(0);
  });

  it("keeps the lifts whose exercise has no mapping apart once it has", () => {
    expect(liftsKeptOnDevice(queue, mapOf([1, 2]))).toBe(2);
    expect(liftsWaitingToUpload(queue, mapOf([1, 2]))).toBe(1);
    expect(liftsKeptOnDevice(queue, mapOf([1, 401, 410]))).toBe(0);
  });
});

describe("the sync's status", () => {
  it("leaves unmappable lifts queued but out of the waiting count, and counts them as kept", async () => {
    sync.map = mapOf([1]);
    saveDeviceWorkoutSessions([session([{ id: "e1", name: "Barbell Bench Press", catalogId: 1 }, { id: "e2", name: "Finger Curl", catalogId: 401 }])]);
    const { result } = renderHook(() => useAthleteSync({ weightUnit: "lb", appSports: [], enabled: true }));
    await settle();
    // The queue itself is unchanged: both lifts are still on it.
    expect(loadSyncQueue().map((item) => item.lift.catalogExerciseId).sort()).toEqual([1, 401]);
    expect(result.current.pending).toBe(1);
    expect(result.current.keptOnDevice).toBe(1);
  });

  it("counts everything as waiting while the map is unknown", async () => {
    saveDeviceWorkoutSessions([session([{ id: "e2", name: "Finger Curl", catalogId: 401 }])]);
    const { result } = renderHook(() => useAthleteSync({ weightUnit: "lb", appSports: [], enabled: true }));
    await settle();
    expect(result.current.pending).toBe(1);
    expect(result.current.keptOnDevice).toBe(0);
  });
});

describe("the account card", () => {
  const card = (props: { pending: number; keptOnDevice?: number }) => render(createElement(AthleteAccountCard, { identity: { userId: "u1", anonymous: true }, optedIn: false, onOptIn: vi.fn(), ...props })).container.textContent ?? "";

  it("says plainly how many lifts are kept on this device, and why", () => {
    expect(card({ pending: 0, keptOnDevice: 1 })).toContain("1 lift is kept on this device because its exercise cannot be uploaded to your account yet.");
    cleanup();
    const text = card({ pending: 2, keptOnDevice: 3 });
    expect(text).toContain("2 lifts are waiting to upload.");
    expect(text).toContain("3 lifts are kept on this device because their exercises cannot be uploaded to your account yet.");
  });

  it("reads the count again when the sync's map first loads, with no queue write in between", async () => {
    // Nothing cached yet: every queued lift counts as waiting, and none as kept.
    window.localStorage.setItem("sports-genome-strength-sync-queue-v1", JSON.stringify([lift("b", 410)]));
    const view = render(createElement(AthleteAccountCard, { identity: { userId: "u1", anonymous: true }, pending: 1, optedIn: false, onOptIn: vi.fn() }));
    expect(view.container.textContent).not.toContain("kept on this device");
    // The map arrives (and is cached by refreshReferenceMap); the sync hook says so.
    const said: string[] = [];
    const listen = (event: Event) => said.push(event.type);
    window.addEventListener(referenceMapChangedEvent, listen);
    sync.refreshed = mapOf([1]);
    renderHook(() => useAthleteSync({ weightUnit: "lb", appSports: [], enabled: false }));
    // Disabled, the hook asks for no map; enabled, it does, and the card follows the loaded map.
    expect(said).toEqual([]);
    renderHook(() => useAthleteSync({ weightUnit: "lb", appSports: [], enabled: true }));
    await settle();
    window.removeEventListener(referenceMapChangedEvent, listen);
    expect(said.length).toBeGreaterThan(0);
    expect(view.container.textContent).toContain("1 lift is kept on this device");
  });

  it("re-reads on the map event alone", () => {
    window.localStorage.setItem("sports-genome-strength-sync-queue-v1", JSON.stringify([lift("b", 410)]));
    const view = render(createElement(AthleteAccountCard, { identity: { userId: "u1", anonymous: true }, pending: 1, optedIn: false, onOptIn: vi.fn() }));
    expect(view.container.textContent).not.toContain("kept on this device");
    sync.map = mapOf([1]);
    act(() => { window.dispatchEvent(new Event(referenceMapChangedEvent)); });
    expect(view.container.textContent).toContain("1 lift is kept on this device");
  });

  it("reads the kept lifts from the stored queue when it is not told, and says nothing when there are none", () => {
    expect(card({ pending: 0 })).not.toContain("kept on this device");
    cleanup();
    sync.map = mapOf([1]);
    window.localStorage.setItem("sports-genome-strength-sync-queue-v1", JSON.stringify([lift("a", 1), lift("b", 410)]));
    expect(card({ pending: 1 })).toContain("1 lift is kept on this device");
  });
});
