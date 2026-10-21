// @vitest-environment jsdom
import React, { createElement } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deviceWorkoutHistoryKey, type DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { exercises, type Exercise } from "@/lib/exerciseCatalog";

type Toast = { title: string; options?: { description?: string } };
const toasts: Toast[] = [];
vi.mock("sonner", () => {
  const record = (title: string, options?: Toast["options"]) => { toasts.push({ title, options }); };
  return { toast: Object.assign(record, { success: record, error: record }), Toaster: () => null };
});

/**
 * No leg is asked, and no planned set is laid out per leg (10-multi-region.md §6.4 and the appendix
 * "Both sides as one"): the owner's decision of 20 Oct 2026 ("there's no reason for a left and right
 * arm") holds for every paired region, so a one-leg exercise is logged as main logs a one-arm one,
 * one row per planned set with no side, and the logged week equals the planned week. No leg region is
 * in production in wave 0; this injects the logging table a thigh and a core region would write, so
 * the logger is held to the rule where a region does map the exercise. A Bulgarian split squat is one
 * leg at a time, named by the front leg; a walking lunge may be done on one leg or alternating; a side
 * plank is one-sided and mapped by the core; a pendulum squat is two-legged.
 */
vi.mock("@shared/specialization/loggingTable.generated", () => {
  const row = (fields: Record<string, unknown>) => ({ measure: "reps", laterality: "not_applicable", sidedBy: "none", sideCounted: false, strapsBy: [], mappedBy: ["thigh"], ...fields });
  return {
    loggingTable: new Map([
      [167, row({ legLaterality: "bilateral" })], // Pendulum Squat
      [173, row({ laterality: "either", legLaterality: "unilateral", sidedBy: "leg", sideAnchor: "front_leg", sideCounted: true })], // Bulgarian Split Squat
      [177, row({ laterality: "either", legLaterality: "either", sidedBy: "leg", sideAnchor: "working_leg", sideCounted: true })], // Walking Lunge
      [247, row({ measure: "seconds", legLaterality: "unilateral", sidedBy: "leg", sideAnchor: "bottom_leg", mappedBy: ["core"] })], // Side Plank
    ]),
  };
});

import { DeviceWorkoutTracker } from "./DeviceWorkoutTracker";
import { loggerGatesForRegions } from "@/lib/specialization/loggerGates";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const byId = (id: number) => exercises.find((exercise) => exercise.id === id)!;
const pendulum = byId(167);
const split = byId(173);
const lunge = byId(177);
const sidePlank = byId(247);

const DAY = "Week 1 · Day 02 · Legs";
const stored = (): DeviceWorkoutSession[] => JSON.parse(window.localStorage.getItem(deviceWorkoutHistoryKey) || "[]");
const card = () => document.querySelector(".live-set-card") as HTMLElement;
const type = (label: RegExp | string, value: string) => fireEvent.change(within(card()).getByLabelText(label), { target: { value } });
const log = () => fireEvent.click(within(card()).getByRole("button", { name: /^Log set/ }));
const sideGroup = () => within(card()).queryByRole("group", { name: /for set \d+ of/ });
const sidesOf = (index: number) => stored()[0].exercises[index].sets.map((set) => [set.side ?? null, set.legSide ?? null]);
const what = (dialog: HTMLElement) => dialog.querySelector("#swap-what")!.textContent;
const NO_SIDE = /\b(left|right|each leg|one leg at a time|per leg|each arm)\b/i;

function mount(workout: Exercise[], targets: string[] = [], prescription = "3 × 10") {
  const prescriptions = Object.fromEntries(workout.map((exercise) => [exercise.id, prescription]));
  render(createElement(DeviceWorkoutTracker, { workout, prescriptions, settings: {}, goal: "Athleticism", dayLabel: DAY, weightUnit: "kg", loggerGates: loggerGatesForRegions(targets) }));
}
const startWorkout = () => fireEvent.click(screen.getByRole("button", { name: /start workout/i }));
function choose(dialog: HTMLElement, query: string, name: string) {
  fireEvent.change(within(dialog).getByRole("searchbox"), { target: { value: query } });
  fireEvent.click(within(dialog).getAllByRole("button", { name: new RegExp(`^${name}`) })[0]);
}

beforeEach(() => { window.localStorage.clear(); toasts.length = 0; });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("No leg is asked: both sides are counted as one (owner, 20 Oct 2026)", () => {
  it("asks no leg of a one-leg, an either-leg or a one-sided exercise, and stores no side", () => {
    mount([split, lunge, sidePlank, pendulum], ["thigh", "core"], "1 × 10");
    startWorkout();
    for (const exercise of [split, lunge, sidePlank, pendulum]) {
      expect(sideGroup(), exercise.name).toBeNull();
      if (exercise.id === sidePlank.id) type(/^Seconds/, "30");
      else { type(/^Weight/, "20"); type("Reps", "10"); }
      log();
    }
    expect(stored()[0].exercises.map((_, index) => sidesOf(index))).toEqual([[[null, null]], [[null, null]], [[null, null]], [[null, null]]]);
    // What Finish will record names no leg.
    const done = Array.from(document.querySelectorAll(".live-done-summary li li")).map((node) => node.textContent);
    expect(done).toHaveLength(4);
    expect(done.join(" ")).not.toMatch(NO_SIDE);
  });
});

describe("One row per planned set, for every athlete: planned equals logged", () => {
  for (const targets of [[], ["thigh"], ["core"], ["forearm"]]) {
    it(`lays a planned one-leg set out as one row, with no leg, for an athlete with targets in ${targets.join(", ") || "no region"}`, () => {
      mount([split, sidePlank], targets);
      expect(document.querySelector(".session-prestart-counts")!.textContent).toBe("2 exercises · 6 sets");
      expect(Array.from(document.querySelectorAll(".session-prestart-name small")).map((node) => node.textContent)).toEqual(["3 × 10", "3 × 10"]);
      startWorkout();
      for (const index of [0, 1]) {
        expect(stored()[0].exercises[index]).not.toHaveProperty("perArm");
        expect(sidesOf(index)).toEqual([[null, null], [null, null], [null, null]]);
      }
      fireEvent.click(screen.getByText("Full workout"));
      expect(Array.from(document.querySelectorAll(".session-set-row > strong")).map((node) => node.textContent).join(" ")).not.toMatch(NO_SIDE);
    });
  }
});

describe("Swap and add keep one row per planned set", () => {
  it("swaps a two-legged exercise for a one-leg one with the same planned sets, and says no leg", () => {
    mount([pendulum], ["thigh"]);
    startWorkout();
    fireEvent.click(within(card()).getByRole("button", { name: "Swap exercise" }));
    const dialog = screen.getByRole("dialog", { name: /^Replace / });
    choose(dialog, "bulgarian split squat", split.name);
    // Main's words for a one-arm exercise (DeviceWorkoutTracker.swapPerArm.test.ts), the same for a leg.
    expect(what(dialog)).toBe("Nothing is logged for Pendulum Squat yet, so the exercise you choose takes its place with the same 3 sets.");
    expect(dialog.textContent).not.toMatch(NO_SIDE);
    fireEvent.click(within(dialog).getByRole("button", { name: `Use ${split.name}` }));
    expect(toasts.at(-1)?.options?.description).toBe(`${split.name} takes Pendulum Squat's place.`);
    expect(sidesOf(0)).toEqual([[null, null], [null, null], [null, null]]);
  });

  it("adds a one-leg exercise with the same sets and reps, one row each", () => {
    mount([pendulum], ["thigh"]);
    startWorkout();
    fireEvent.click(within(card()).getByRole("button", { name: "Add exercise" }));
    const dialog = screen.getByRole("dialog", { name: "Add an exercise" });
    choose(dialog, "bulgarian split squat", split.name);
    expect(what(dialog)).toBe("It goes in straight after Pendulum Squat, starting from the same sets and reps. Nothing logged changes.");
    fireEvent.click(within(dialog).getByRole("button", { name: `Add ${split.name}` }));
    expect(sidesOf(1)).toEqual([[null, null], [null, null], [null, null]]);
    expect(toasts.at(-1)?.options?.description).toBe("After Pendulum Squat, starting from the same sets and reps.");
  });
});
