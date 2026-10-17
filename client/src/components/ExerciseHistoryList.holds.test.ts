// @vitest-environment jsdom
import React, { createElement } from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { saveDeviceWorkoutSessions, type DeviceSetLog, type DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { ExerciseHistoryList } from "./ExerciseHistoryList";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

/**
 * An exercise's earlier workouts, between sets and in the exercise detail, read a hold as the
 * session detail does: its seconds, or "Seconds not recorded" for one logged before seconds were
 * required, and never "— lb × —". It reads the light list of holds, not the atlas's region data.
 */
const hangWorkout = (id: string, completedAt: string, sets: DeviceSetLog[]): DeviceWorkoutSession => ({
  id, title: "Pull workout", dayLabel: "Week 1 · Day 01 · Pull", startedAt: completedAt, completedAt, status: "completed", weightUnit: "lb",
  exercises: [{ id: `${id}-hang`, exerciseName: "Dead Hang", catalogId: 143, plannedPrescription: "3 × 30 sec", sets }],
});

beforeEach(() => window.localStorage.clear());
afterEach(() => cleanup());

describe("ExerciseHistoryList on a hold", () => {
  it("shows seconds, a missing time as not recorded, and old reps as reps", () => {
    saveDeviceWorkoutSessions([
      hangWorkout("old", "2026-10-01T10:00:00.000Z", [{ id: "a", weight: "", reps: "40", completed: true }]),
      hangWorkout("mid", "2026-10-08T10:00:00.000Z", [{ id: "b", weight: "", reps: "", completed: true }, { id: "c", weight: "20", reps: "", unit: "lb", completed: true }]),
      hangWorkout("new", "2026-10-15T10:00:00.000Z", [{ id: "d", weight: "", reps: "", holdSeconds: "30", completed: true }, { id: "e", weight: "25", reps: "", holdSeconds: "45", unit: "lb", completed: true }]),
    ]);
    render(createElement(ExerciseHistoryList, { exerciseId: 143, exerciseName: "Dead Hang", weightUnit: "lb" }));
    const rows = Array.from(document.querySelectorAll(".exercise-history-sets")).map((node) => Array.from(node.children).map((set) => set.textContent));
    expect(rows).toEqual([["30 s", "25 lb × 45 s"], ["Seconds not recorded", "20 lb · seconds not recorded"], ["40 reps"]]);
    expect(document.body.textContent).not.toContain("—");
  });
});
