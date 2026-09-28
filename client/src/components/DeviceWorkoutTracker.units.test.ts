// @vitest-environment jsdom
import React, { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DeviceWorkoutTracker } from "./DeviceWorkoutTracker";
import { deviceWorkoutHistoryKey, type DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { exercises } from "@/lib/exerciseCatalog";
import { setEntryFieldsFor } from "@/lib/setEntryFields";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

/**
 * The weight box used to say "lb" whatever the profile said, while every screen then
 * read the number in the profile's unit (Backend V1 PS-10, EN-08, TR-06). The box now
 * names the session's unit, and each set is stored with it.
 */
const loaded = exercises.find((exercise) => setEntryFieldsFor(exercise).length === 1 && setEntryFieldsFor(exercise)[0].label === "Weight")!;
const mount = (weightUnit: "lb" | "kg") => render(createElement(DeviceWorkoutTracker, {
  workout: [loaded], prescriptions: { [loaded.id]: "2 × 5" }, settings: {}, goal: "Athleticism", dayLabel: "Day 01 · Legs", weightUnit,
}));
const stored = (): DeviceWorkoutSession[] => JSON.parse(window.localStorage.getItem(deviceWorkoutHistoryKey) || "[]");
const weightBox = () => document.querySelector(".live-set-entry label") as HTMLElement;

beforeEach(() => window.localStorage.clear());
afterEach(() => cleanup());

describe("The tracker records weights in the athlete's unit", () => {
  it("labels the box kg for a kg athlete and stores the set as kg", () => {
    mount("kg");
    fireEvent.click(screen.getByRole("button", { name: /start workout/i }));
    expect(weightBox().querySelector("em")!.textContent).toBe("kg");
    fireEvent.change(weightBox().querySelector("input")!, { target: { value: "100" } });
    fireEvent.click(screen.getByRole("button", { name: /log set 1/i }));
    const [session] = stored();
    expect(session.weightUnit).toBe("kg");
    expect(session.exercises[0].sets[0]).toMatchObject({ weight: "100", unit: "kg", completed: true });
  });

  it("keeps a running session's unit when the profile changes mid-workout", () => {
    const view = mount("lb");
    fireEvent.click(screen.getByRole("button", { name: /start workout/i }));
    view.rerender(createElement(DeviceWorkoutTracker, {
      workout: [loaded], prescriptions: { [loaded.id]: "2 × 5" }, settings: {}, goal: "Athleticism", dayLabel: "Day 01 · Legs", weightUnit: "kg",
    }));
    expect(weightBox().querySelector("em")!.textContent).toBe("lb");
    fireEvent.change(weightBox().querySelector("input")!, { target: { value: "225" } });
    expect(stored()[0].exercises[0].sets[0]).toMatchObject({ weight: "225", unit: "lb" });
  });

  it("gives a session started before units were stored the profile's unit, marked inferred", () => {
    const legacy: DeviceWorkoutSession = {
      id: "device-7", title: "Day 01 workout", dayLabel: "Day 01 · Legs", startedAt: new Date().toISOString(), status: "active",
      exercises: [{ id: `${loaded.id}-0`, exerciseName: loaded.name, plannedPrescription: "2 × 5", sets: [{ weight: "80", reps: "5", completed: true }, { weight: "", reps: "", completed: false }] }],
    };
    window.localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify([legacy]));
    mount("kg");
    expect(weightBox().querySelector("em")!.textContent).toBe("kg");
    fireEvent.change(weightBox().querySelector("input")!, { target: { value: "85" } });
    const [session] = stored();
    expect(session).toMatchObject({ weightUnit: "kg", weightUnitInferred: true });
    expect(session.exercises[0].sets[1]).toMatchObject({ weight: "85", unit: "kg" });
  });
});
