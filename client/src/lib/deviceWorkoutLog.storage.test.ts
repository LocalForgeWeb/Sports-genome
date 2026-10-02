// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  deviceWorkoutHistoryEvent, deviceWorkoutHistoryKey, loadDeviceWorkoutSessions, saveDeviceWorkoutSessions,
  type DeviceWorkoutSession,
} from "./deviceWorkoutLog";

/**
 * The continuity contract: a checkpoint is only "saved" once it reached the device, and a
 * failed write is reported rather than swallowed. Home, Progress and the sync all re-read
 * the history when its event fires, so the event must not fire for a write that never
 * happened. And whatever storage holds, reading it must not take the app down.
 */

beforeEach(() => window.localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("a corrupt history reads as empty, not as a crash", () => {
  it("reads unparseable JSON as no workouts", () => {
    window.localStorage.setItem(deviceWorkoutHistoryKey, "{oops");
    expect(loadDeviceWorkoutSessions()).toEqual([]);
  });

  it("reads JSON that is not a list as no workouts", () => {
    window.localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify({ a: 1 }));
    expect(loadDeviceWorkoutSessions()).toEqual([]);
  });

  it("fills in missing exercises and sets, drops an unknown unit and reads loose values as a set", () => {
    window.localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify([
      { id: "s", status: "active", weightUnit: "stone" },
      { id: "t", status: "completed", exercises: [{ id: "e", sets: "nope" }, { id: "f", sets: [{ weight: 5, completed: "yes" }] }] },
    ]));
    const [running, finished] = loadDeviceWorkoutSessions();
    expect(running.status).toBe("active");
    expect(running.exercises).toEqual([]);
    expect(running.weightUnit).toBeUndefined();
    expect(finished.exercises[0].sets).toEqual([]);
    expect(finished.exercises[1].sets[0]).toMatchObject({ weight: "5", reps: "", completed: true, skipped: false });
  });
});

describe("a refused checkpoint is reported, not swallowed", () => {
  const aSession: DeviceWorkoutSession = {
    id: "device-1", title: "Day 01 workout", dayLabel: "Day 01 · Legs", startedAt: "2026-09-01T10:00:00.000Z", status: "active",
    exercises: [{ id: "1-0", exerciseName: "Barbell Back Squat", plannedPrescription: "3 × 5", sets: [{ weight: "100", reps: "5", completed: true }] }],
  };

  it("returns true, stores the history and announces it once", () => {
    const listener = vi.fn();
    window.addEventListener(deviceWorkoutHistoryEvent, listener);
    try {
      expect(saveDeviceWorkoutSessions([])).toBe(true);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(window.localStorage.getItem(deviceWorkoutHistoryKey)).toBe("[]");
    } finally {
      window.removeEventListener(deviceWorkoutHistoryEvent, listener);
    }
  });

  it("returns false when the device refuses the write, keeps what was stored and announces nothing", () => {
    window.localStorage.setItem(deviceWorkoutHistoryKey, "[]");
    const listener = vi.fn();
    window.addEventListener(deviceWorkoutHistoryEvent, listener);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("full", "QuotaExceededError"); });
    try {
      expect(saveDeviceWorkoutSessions([aSession])).toBe(false);
      expect(listener).not.toHaveBeenCalled();
      expect(window.localStorage.getItem(deviceWorkoutHistoryKey)).toBe("[]");
    } finally {
      window.removeEventListener(deviceWorkoutHistoryEvent, listener);
    }
  });
});
