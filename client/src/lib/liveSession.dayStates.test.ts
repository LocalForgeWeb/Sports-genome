// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { loadDeviceWorkoutSessions, removeDeviceWorkoutSession, saveDeviceWorkoutSessions, type DeviceWorkoutSession } from "./deviceWorkoutLog";
import { useDayTrainingStates } from "./liveSession";

const push = "Week 1 · Day 01 · Push";

function finishedNow(id: string, dayLabel: string): DeviceWorkoutSession {
  const at = new Date().toISOString();
  return {
    id,
    title: "Push",
    dayLabel,
    startedAt: at,
    completedAt: at,
    status: "completed",
    exercises: [{ id: `${id}-e`, exerciseName: "Barbell Bench Press", plannedPrescription: "3 × 5", sets: [{ weight: "80", reps: "5", completed: true }] }],
  } as DeviceWorkoutSession;
}

/**
 * Measured in review: finish Push, open Progress, remove Push, open Plan. The
 * Plan strip still read "Trained" because it was recomputed only when a running
 * workout changed, and with none running nothing did. Home's week strip already
 * had the day as not done, so the two screens disagreed until a reload.
 */
describe("the Plan's day strip follows the workout log", () => {
  afterEach(() => { window.localStorage.clear(); });

  it("stops calling a day trained once its workout is removed, with no workout running", () => {
    saveDeviceWorkoutSessions([finishedNow("push", push)]);
    const { result } = renderHook(() => useDayTrainingStates());
    expect(result.current[push]).toBe("trained");

    act(() => { saveDeviceWorkoutSessions(removeDeviceWorkoutSession(loadDeviceWorkoutSessions(), "push")); });
    expect(result.current[push]).toBeUndefined();
  });

  it("marks a day trained as soon as its workout is saved", () => {
    const { result } = renderHook(() => useDayTrainingStates());
    expect(result.current[push]).toBeUndefined();
    act(() => { saveDeviceWorkoutSessions([finishedNow("push", push)]); });
    expect(result.current[push]).toBe("trained");
  });

  it("keeps the same answer when a write changes no day's state", () => {
    saveDeviceWorkoutSessions([finishedNow("push", push)]);
    const { result } = renderHook(() => useDayTrainingStates());
    const before = result.current;
    act(() => { saveDeviceWorkoutSessions(loadDeviceWorkoutSessions()); });
    expect(result.current).toBe(before);
  });
});
