// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { saveDeviceWorkoutSessions, type DeviceWorkoutSession } from "./deviceWorkoutLog";
import type { FlushResult } from "./strengthSyncQueue";

/**
 * A sync asked for while a send is still waiting on the network used to be dropped. A workout
 * finished during a slow upload was then neither queued nor sent until some unrelated event
 * fired, although the outbox promises a finished workout is on it straight away.
 */
const sync = vi.hoisted(() => ({ flushSyncQueue: vi.fn() }));
vi.mock("@/lib/athleteIdentity", () => ({ ensureAthleteIdentity: async () => ({ userId: "u1", anonymous: true }), upsertAthleteProfile: vi.fn() }));
vi.mock("@/lib/supabaseReferenceMap", () => ({ loadCachedReferenceMap: () => null, refreshReferenceMap: async () => null }));
vi.mock("@/lib/strengthSyncQueue", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./strengthSyncQueue")>()),
  flushSyncQueue: sync.flushSyncQueue,
}));
vi.mock("@/lib/resilienceCatalogClient", () => ({ fetchTargetCatalogAsAthlete: async () => null }));
vi.mock("@/lib/capacityContext", () => ({ capacitySignature: () => "none", loadCapacityContext: async () => null, saveCapacityContext: async () => undefined }));

import { useAthleteSync } from "./useAthleteSync";
import { loadSyncQueue } from "./strengthSyncQueue";

const STABLE = [{ id: "wrestling", label: "Wrestling" }] as const;
const idle: FlushResult = { sent: 0, remaining: 0, skipped: 0 };
const benchKey = "workout-s1-e1";
const finishedBench: DeviceWorkoutSession = {
  id: "s1",
  title: "Push",
  dayLabel: "Monday",
  startedAt: "2026-09-28T10:00:00.000Z",
  completedAt: "2026-09-28T11:00:00.000Z",
  status: "completed",
  weightUnit: "kg",
  exercises: [{ id: "e1", exerciseName: "Barbell Bench Press", plannedPrescription: "3 x 5", sets: [{ weight: "100", reps: "5", unit: "kg", completed: true }] }],
};

const mount = () => renderHook(() => useAthleteSync({ weightUnit: "kg", appSports: STABLE, enabled: true }));
const settle = async () => { await act(async () => { for (let i = 0; i < 5; i += 1) await Promise.resolve(); }); };
const queuedKeys = () => loadSyncQueue().map((item) => item.key);

/** Makes the next flush hang until the test lets it go, the way a slow gym network does. */
function holdNextFlush() {
  let release: () => void = () => {};
  sync.flushSyncQueue.mockReturnValueOnce(new Promise<FlushResult>((resolve) => { release = () => resolve(idle); }));
  return () => release();
}

beforeEach(() => {
  window.localStorage.clear();
  sync.flushSyncQueue.mockReset().mockResolvedValue(idle);
});

afterEach(() => { cleanup(); });

describe("A sync asked for while a send is in flight", () => {
  it("queues and sends a workout finished during a slow upload once that upload settles", async () => {
    const { result } = mount();
    await settle();
    const release = holdNextFlush();
    act(() => { result.current.syncNow(); });
    const before = sync.flushSyncQueue.mock.calls.length;

    act(() => { saveDeviceWorkoutSessions([finishedBench]); });
    expect(queuedKeys()).not.toContain(benchKey);
    expect(sync.flushSyncQueue).toHaveBeenCalledTimes(before);

    await act(async () => { release(); });
    await settle();
    expect(sync.flushSyncQueue).toHaveBeenCalledTimes(before + 1);
    expect(queuedKeys()).toContain(benchKey);
  });

  it("merges several requests during one send into a single rerun", async () => {
    const { result } = mount();
    await settle();
    const release = holdNextFlush();
    act(() => { result.current.syncNow(); });
    const before = sync.flushSyncQueue.mock.calls.length;

    act(() => { saveDeviceWorkoutSessions([finishedBench]); result.current.syncNow(); result.current.syncNow(); });
    await act(async () => { release(); });
    await settle();
    expect(sync.flushSyncQueue).toHaveBeenCalledTimes(before + 1);
  });

  it("sends once, with no extra rerun, when nothing was in flight", async () => {
    mount();
    await settle();
    const before = sync.flushSyncQueue.mock.calls.length;

    act(() => { saveDeviceWorkoutSessions([finishedBench]); });
    await settle();
    expect(sync.flushSyncQueue).toHaveBeenCalledTimes(before + 1);
    expect(queuedKeys()).toContain(benchKey);
  });

  it("starts nothing when the send settles after the app has gone", async () => {
    const { result, unmount } = mount();
    await settle();
    const release = holdNextFlush();
    act(() => { result.current.syncNow(); });
    act(() => { saveDeviceWorkoutSessions([finishedBench]); });
    const before = sync.flushSyncQueue.mock.calls.length;

    unmount();
    await act(async () => { release(); });
    await settle();
    expect(sync.flushSyncQueue).toHaveBeenCalledTimes(before);
  });
});
