// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deviceWorkoutHistoryKey, type DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { exercises } from "@/lib/exerciseCatalog";
import { setEntryFieldsFor } from "@/lib/setEntryFields";

const toasts: string[] = [];
vi.mock("sonner", () => {
  const record = (title: string) => { toasts.push(title); };
  return { toast: Object.assign(record, { success: record, error: record }), Toaster: () => null };
});

import { DeviceWorkoutTracker } from "./DeviceWorkoutTracker";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

/**
 * One workout, one record, however many tabs it is open in (Backend V1 B154, B158;
 * inventory PS-11). Reproduced before this change: Start opened a second active session
 * beside one started in another tab, and each tab wrote its whole copy back, so a set
 * logged in one tab was un-logged by the next write from the other.
 */
const loaded = exercises.find((exercise) => setEntryFieldsFor(exercise)[0]?.label === "Weight")!;
const props = { workout: [loaded], prescriptions: { [loaded.id]: "3 × 5" }, settings: {}, goal: "Athleticism" as const, dayLabel: "Day 01 · Legs", weightUnit: "lb" as const };
const stored = (): DeviceWorkoutSession[] => JSON.parse(window.localStorage.getItem(deviceWorkoutHistoryKey) || "[]");
const write = (sessions: DeviceWorkoutSession[]) => window.localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify(sessions));
const running = (sets: DeviceWorkoutSession["exercises"][number]["sets"]): DeviceWorkoutSession => ({
  id: "device-100", title: "Day 01 · Legs workout", dayLabel: "Day 01 · Legs", startedAt: new Date().toISOString(), status: "active", weightUnit: "lb",
  exercises: [{ id: `${loaded.id}-0`, exerciseName: loaded.name, plannedPrescription: "3 × 5", sets }],
});
const blank = () => ({ weight: "", reps: "", completed: false });
/** What the browser delivers to every other tab when one tab writes the key. */
const otherTabWrote = async () => { await act(async () => { window.dispatchEvent(new StorageEvent("storage", { key: deviceWorkoutHistoryKey })); }); };

beforeEach(() => { window.localStorage.clear(); toasts.length = 0; });
afterEach(() => cleanup());

describe("A second tab", () => {
  it("cannot start a second workout beside one already running", () => {
    render(createElement(DeviceWorkoutTracker, props));
    // Another tab starts a workout after this one loaded with none.
    write([running([blank(), blank(), blank()])]);
    fireEvent.click(screen.getByRole("button", { name: /start workout/i }));
    expect(stored().filter((session) => session.status === "active")).toHaveLength(1);
    expect(stored()[0].id).toBe("device-100");
    expect(toasts).toContain("A workout is already running");
  });

  it("does not un-log a set the other tab logged when this tab writes", () => {
    write([running([blank(), blank(), blank()])]);
    render(createElement(DeviceWorkoutTracker, props));
    // The other tab logs set 1 without this tab hearing about it.
    write([running([{ weight: "225", reps: "5", completed: true, unit: "lb" }, blank(), blank()])]);
    // This tab now types into set 2 from the full list.
    const setTwoWeight = document.querySelectorAll(".session-set-row")[1].querySelector("input")!;
    fireEvent.change(setTwoWeight, { target: { value: "230" } });
    const sets = stored()[0].exercises[0].sets;
    expect(sets[0]).toMatchObject({ weight: "225", completed: true });
    expect(sets[1]).toMatchObject({ weight: "230", unit: "lb" });
  });

  it("shows what the other tab logged as soon as it writes", async () => {
    write([running([blank(), blank(), blank()])]);
    render(createElement(DeviceWorkoutTracker, props));
    expect(document.querySelector(".execution-head")!.textContent).toContain("0/3 sets");
    write([running([{ weight: "225", reps: "5", completed: true, unit: "lb" }, blank(), blank()])]);
    await otherTabWrote();
    expect(document.querySelector(".execution-head")!.textContent).toContain("1/3 sets");
  });

  it("closes here when the workout is finished there, instead of bringing it back", async () => {
    write([running([blank(), blank(), blank()])]);
    render(createElement(DeviceWorkoutTracker, props));
    const finished = { ...running([{ weight: "225", reps: "5", completed: true, unit: "lb" as const }]), status: "completed" as const, completedAt: new Date().toISOString() };
    write([finished]);
    await otherTabWrote();
    expect(toasts).toContain("This workout was closed in another tab");
    expect(screen.getByRole("button", { name: /start workout/i })).toBeTruthy();
    expect(stored()).toEqual([finished]);
  });

  it("refuses an edit to a workout the other tab already finished, without a storage event", () => {
    write([running([blank(), blank(), blank()])]);
    render(createElement(DeviceWorkoutTracker, props));
    const finished = { ...running([{ weight: "225", reps: "5", completed: true, unit: "lb" as const }]), status: "completed" as const, completedAt: new Date().toISOString() };
    write([finished]);
    const setTwoWeight = document.querySelectorAll(".session-set-row")[1].querySelector("input")!;
    fireEvent.change(setTwoWeight, { target: { value: "230" } });
    expect(stored()).toEqual([finished]);
    expect(toasts).toContain("This workout was closed in another tab");
  });
});

describe("Finishing with nothing logged", () => {
  it("ends the workout and records nothing, so no count treats it as a workout (B155, B156)", () => {
    render(createElement(DeviceWorkoutTracker, props));
    fireEvent.click(screen.getByRole("button", { name: /start workout/i }));
    expect(stored()).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /finish workout early/i }));
    expect(screen.getByText(/Nothing is logged yet, so nothing will be recorded\./)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Finish now" }));
    expect(stored()).toEqual([]);
    expect(toasts).toContain("Workout ended, nothing recorded");
    expect(screen.getByRole("button", { name: /start workout/i })).toBeTruthy();
  });

  it("still records a workout with one logged set", () => {
    render(createElement(DeviceWorkoutTracker, props));
    fireEvent.click(screen.getByRole("button", { name: /start workout/i }));
    fireEvent.click(screen.getByRole("button", { name: /log set 1/i }));
    fireEvent.click(screen.getByRole("button", { name: /finish workout early/i }));
    fireEvent.click(screen.getByRole("button", { name: "Finish now" }));
    expect(stored()).toHaveLength(1);
    expect(stored()[0].status).toBe("completed");
    expect(screen.getByRole("heading", { name: "Workout saved" })).toBeTruthy();
  });
});
