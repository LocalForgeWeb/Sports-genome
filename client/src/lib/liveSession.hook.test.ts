// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { deviceWorkoutHistoryEvent, saveDeviceWorkoutSessions, type DeviceWorkoutSession } from "./deviceWorkoutLog";
import { useLiveSession } from "./liveSession";

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
