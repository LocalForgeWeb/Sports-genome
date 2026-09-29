// @vitest-environment jsdom
import { useMemo } from "react";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { deviceWorkoutHistoryEvent, deviceWorkoutHistoryKey, loadDeviceWorkoutSessions, saveDeviceWorkoutSessions, type DeviceWorkoutSession } from "./deviceWorkoutLog";
import { useLiveSession, useWorkoutLogWrites } from "./liveSession";

const set = (over: Partial<DeviceWorkoutSession["exercises"][number]["sets"][number]> = {}) =>
  ({ weight: "", reps: "", completed: false, ...over });

function running(over: Partial<DeviceWorkoutSession> = {}): DeviceWorkoutSession {
  return {
    id: "device-1",
    title: "Day 05 workout",
    dayLabel: "Week 1 · Day 05 · Sport Transfer",
    startedAt: "2026-09-25T10:00:00.000Z",
    status: "active",
    exercises: [
      { id: "a", exerciseName: "Box Jump", plannedPrescription: "4 × 3–5", sets: [set({ weight: "20", reps: "5", completed: true }), set(), set(), set()] },
      { id: "b", exerciseName: "Skater Bound", plannedPrescription: "4 × 3–5", sets: [set(), set(), set(), set()] },
    ],
    ...over,
  };
}

function withSet(session: DeviceWorkoutSession, setIndex: number, patch: Partial<DeviceWorkoutSession["exercises"][number]["sets"][number]>): DeviceWorkoutSession {
  return {
    ...session,
    exercises: session.exercises.map((exercise, index) => index !== 0 ? exercise : {
      ...exercise,
      sets: exercise.sets.map((item, i) => i === setIndex ? { ...item, ...patch } : item),
    }),
  };
}

/**
 * Every keystroke in the tracker's weight box is a checkpoint, and every return
 * to the app is a `focus`. Each used to hand Home a new summary, so all of Home
 * rendered again while the workout it described had not changed at all.
 */
describe("the live workout summary changes only when the workout does", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("keeps the same summary, and renders nothing, on a return to the app or a half-typed weight", () => {
    saveDeviceWorkoutSessions([running()]);
    let renders = 0;
    const { result } = renderHook(() => { renders += 1; return useLiveSession(); });
    const before = result.current;
    const rendersBefore = renders;
    expect(before?.completedSets).toBe(1);

    act(() => { window.dispatchEvent(new Event("focus")); });
    act(() => { saveDeviceWorkoutSessions([withSet(running(), 1, { weight: "2" })]); });
    act(() => { window.dispatchEvent(new Event(deviceWorkoutHistoryEvent)); });

    expect(result.current).toBe(before);
    expect(renders).toBe(rendersBefore);
  });

  it("hands over a new summary once a set is completed", () => {
    saveDeviceWorkoutSessions([running()]);
    const { result } = renderHook(() => useLiveSession());
    const before = result.current;

    act(() => { saveDeviceWorkoutSessions([withSet(running(), 1, { weight: "22", reps: "5", completed: true })]); });

    expect(result.current).not.toBe(before);
    expect(result.current?.completedSets).toBe(2);
    expect(result.current?.setNumber).toBe(3);
  });

  it("clears the summary once the workout is finished", () => {
    saveDeviceWorkoutSessions([running()]);
    const { result } = renderHook(() => useLiveSession());
    expect(result.current).not.toBeNull();

    act(() => { saveDeviceWorkoutSessions([running({ status: "completed", completedAt: "2026-09-25T11:00:00.000Z" })]); });

    expect(result.current).toBeNull();
  });
});

/** How Home's Plan rows read the log: parsed once, keyed on the count of saves. */
function useLogKeyedOnWrites(listening: boolean) {
  const writes = useWorkoutLogWrites(listening);
  return useMemo(() => (writes === null ? [] : loadDeviceWorkoutSessions()), [writes]);
}
const typedWeight = (log: DeviceWorkoutSession[]) => log[0]?.exercises[0]?.sets[1]?.weight;

/**
 * Because the summary keeps its identity through such saves, a copy of the log
 * keyed on the summary kept the log from before them. The count of saves moves
 * on every one of them.
 */
describe("the count of saves to the workout log", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("moves on a save that leaves the live summary as it was, so a copy of the log keyed on it is read again", () => {
    saveDeviceWorkoutSessions([running()]);
    const { result } = renderHook(() => ({ live: useLiveSession(), log: useLogKeyedOnWrites(true) }));
    const before = result.current;
    expect(typedWeight(before.log)).toBe("");

    act(() => { saveDeviceWorkoutSessions([withSet(running(), 1, { weight: "22" })]); });

    expect(result.current.live).toBe(before.live);
    expect(typedWeight(result.current.log)).toBe("22");
  });

  it("moves when another tab changes the log, and not when it changes anything else", () => {
    const { result } = renderHook(() => useWorkoutLogWrites(true));
    const before = result.current;

    act(() => { window.dispatchEvent(new StorageEvent("storage", { key: "gym-optimizer-workout-plan-v1" })); });
    expect(result.current).toBe(before);

    act(() => { window.dispatchEvent(new StorageEvent("storage", { key: deviceWorkoutHistoryKey })); });
    expect(result.current).not.toBe(before);
  });

  it("renders nothing while not listening, and the copy catches up with the saves it missed once it listens again", () => {
    saveDeviceWorkoutSessions([running()]);
    let renders = 0;
    const { result, rerender } = renderHook(({ listening }) => { renders += 1; return useLogKeyedOnWrites(listening); }, { initialProps: { listening: true } });
    expect(typedWeight(result.current)).toBe("");

    rerender({ listening: false });
    const rendersBefore = renders;
    act(() => { saveDeviceWorkoutSessions([withSet(running(), 1, { weight: "22" })]); });
    expect(renders).toBe(rendersBefore);

    rerender({ listening: true });
    expect(typedWeight(result.current)).toBe("22");
  });
});
