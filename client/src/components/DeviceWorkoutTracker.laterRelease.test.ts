// @vitest-environment jsdom
import React, { createElement } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deviceWorkoutHistoryKey, type DeviceSetLog, type DeviceWorkoutExercise, type DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { exercises, type Exercise } from "@/lib/exerciseCatalog";
import { loggingPolicyFor } from "@shared/specialization/loggingPolicy";
import { loggerGatesForRegions } from "@/lib/specialization/loggerGates";

type Toast = { title: string; options?: { description?: string } };
const toasts: Toast[] = [];
vi.mock("sonner", () => {
  const record = (title: string, options?: Toast["options"]) => { toasts.push({ title, options }); };
  return { toast: Object.assign(record, { success: record, error: record }), Toaster: () => null };
});

import { DeviceWorkoutTracker } from "./DeviceWorkoutTracker";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

/**
 * A workout left open across a release (10-multi-region.md §2.1, §9.4): a second tab on a newer
 * deploy, or a rollback to the previous wave's, leaves rows this release did not write. What it
 * does not understand stays as stored when a set is logged, and rows built per leg on an exercise
 * it does not know (173 in wave 0) keep their sides on the leg, also through a swap. On the real
 * wave-0 logging table, where no leg region is in production.
 */
const byId = (id: number) => exercises.find((exercise) => exercise.id === id)!;
const bench = byId(1); // Barbell Bench Press: two-handed, nothing asked
const split = byId(173); // Bulgarian Split Squat: one leg at a time, no production region maps it in wave 0
const row = byId(46); // Dumbbell Row: one arm at a time, mapped by the forearm

const DAY = "Week 1 · Day 01 · Full body";
const stored = (): DeviceWorkoutSession[] => JSON.parse(window.localStorage.getItem(deviceWorkoutHistoryKey) || "[]");
const card = () => document.querySelector(".live-set-card") as HTMLElement;
const type = (label: RegExp | string, value: string) => fireEvent.change(within(card()).getByLabelText(label), { target: { value } });
const log = () => fireEvent.click(within(card()).getByRole("button", { name: /^Log set/ }));
const sidesOf = (index: number) => stored()[0].exercises[index].sets.map((set) => [set.side ?? null, set.legSide ?? null]);

/** An open workout as a later release left it on the device, then this release's tracker on it. */
function resume(exercise: Exercise, sets: Record<string, unknown>[], fields: Partial<DeviceWorkoutExercise> = {}, targets: string[] = []) {
  const session = { id: "later", title: "Workout", dayLabel: DAY, startedAt: new Date().toISOString(), status: "active", weightUnit: "kg", restSeconds: 90,
    exercises: [{ id: `${exercise.id}-0`, exerciseName: exercise.name, catalogId: exercise.id, plannedPrescription: "1 × 10", sets: sets as DeviceSetLog[], ...fields }] };
  window.localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify([session]));
  render(createElement(DeviceWorkoutTracker, { workout: [exercise], prescriptions: { [exercise.id]: "1 × 10" }, settings: {}, goal: "Athleticism", dayLabel: DAY, weightUnit: "kg", loggerGates: loggerGatesForRegions(targets) }));
}

beforeEach(() => { window.localStorage.clear(); toasts.length = 0; });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("Logging a set a later release wrote", () => {
  it("keeps every field this release does not know, and a leg side, as stored", () => {
    resume(bench, [
      { id: "a", weight: "", reps: "", completed: false, tempo: "3-1-1", legSide: "left" },
      { id: "b", weight: "", reps: "", completed: false, type: "cluster", stages: [{ id: "b-1", weight: "60", reps: "3", restSeconds: 15 }] },
    ]);
    type(/^Weight/, "60"); type("Reps", "10");
    log();
    expect(stored()[0].exercises[0].sets[0]).toMatchObject({ id: "a", weight: "60", reps: "10", completed: true, tempo: "3-1-1", legSide: "left" });
    // A set type this release does not know is logged as the standard set it reads as, with its type and stages kept.
    log();
    expect(stored()[0].exercises[0].sets[1]).toMatchObject({ id: "b", completed: true, type: "cluster", stages: [{ id: "b-1", weight: "60", reps: "3", restSeconds: 15 }] });
  });

  it("starts a drop set from no stages, never from the stages of a set type it does not know", () => {
    resume(bench, [{ id: "b", weight: "", reps: "", completed: false, type: "cluster", stages: [{ id: "b-1", weight: "60", reps: "3" }] }]);
    // Read as a standard set: no stages listed.
    expect(within(card()).getByRole("button", { name: "Standard" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(within(card()).getByRole("button", { name: /Drop set/ }));
    expect(stored()[0].exercises[0].sets[0]).toMatchObject({ type: "drop", stages: [] });
    expect(card().querySelector(".live-drop-stages")).toBeNull();
    expect(card().querySelector(".live-drop-next")!.textContent).toBe("Stage 1 · no rest between stages");
  });
});

describe("Rows built per leg on an exercise this release does not know", () => {
  const legRows = () => [{ id: "r", weight: "", reps: "", completed: false, legSide: "right" }, { id: "l", weight: "", reps: "", completed: false, legSide: "left" }];

  it("show their leg sides and say each leg, and are logged with the leg side and no arm side", () => {
    expect(loggingPolicyFor(split.id).sideLimb).toBeNull();
    resume(split, legRows(), { perArm: true });
    // Nothing is asked: no production region counts this exercise's side in wave 0.
    expect(within(card()).queryByRole("group", { name: /for set \d+ of/ })).toBeNull();
    fireEvent.click(screen.getByText("Full workout"));
    expect(Array.from(document.querySelectorAll(".session-set-row > strong")).map((node) => node.textContent)).toEqual(["Set 1 · Right", "Set 2 · Left"]);
    expect(document.querySelector(".session-exercise .exercise-media-dense small")!.textContent).toBe("1 × 10 · each leg");
    type(/^Weight/, "20"); type("Reps", "10");
    log();
    expect(sidesOf(0)[0]).toEqual([null, "right"]);
  });

  it("swapped to a one-arm exercise laid out per arm, give it Right and Left on the arm, and none on the leg", () => {
    expect(loggingPolicyFor(row.id).oneSide).toBe(true);
    resume(split, legRows(), { perArm: true }, ["forearm"]);
    fireEvent.click(within(card()).getByRole("button", { name: "Swap exercise" }));
    const dialog = screen.getByRole("dialog", { name: /^Replace / });
    fireEvent.change(within(dialog).getByRole("searchbox"), { target: { value: "dumbbell row" } });
    fireEvent.click(within(dialog).getAllByRole("button", { name: new RegExp(`^${row.name}`) })[0]);
    expect(dialog.querySelector("#swap-what")!.textContent).toBe(`Nothing is logged for ${split.name} yet, so ${row.name} takes its place with the same 1 planned set, done once with each arm: 2 sets.`);
    fireEvent.click(within(dialog).getByRole("button", { name: `Use ${row.name}` }));
    expect(stored()[0].exercises[0]).toMatchObject({ exerciseName: row.name, perArm: true });
    expect(sidesOf(0)).toEqual([["right", null], ["left", null]]);
    // The card asks the arm, preset from the row, and logs it there.
    const arm = within(card()).getByRole("group", { name: /^Arm for set 1 of/ });
    expect(within(arm).getAllByRole("button").filter((button) => button.getAttribute("aria-pressed") === "true").map((button) => button.textContent)).toEqual(["Right"]);
    type(/^Weight/, "30"); type("Reps", "10");
    log();
    expect(sidesOf(0)[0]).toEqual(["right", null]);
  });

  it("are named as one-leg sets in the swap sheet", () => {
    resume(split, legRows(), { perArm: true });
    fireEvent.click(within(card()).getByRole("button", { name: "Swap exercise" }));
    const dialog = screen.getByRole("dialog", { name: /^Replace / });
    fireEvent.change(within(dialog).getByRole("searchbox"), { target: { value: "barbell bench press" } });
    fireEvent.click(within(dialog).getAllByRole("button", { name: new RegExp(`^${bench.name}`) })[0]);
    expect(dialog.querySelector("#swap-what")!.textContent).toBe(`Nothing is logged for ${split.name} yet, so ${bench.name} takes its place with the same 1 planned set, not one per leg.`);
  });
});
