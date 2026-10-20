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
 * The leg's side question and rows per leg (10-multi-region.md §2.1, §6.4). No leg region is in
 * production in wave 0, so nothing asks a leg yet; this injects the logging table a thigh and a core
 * region would write. A Bulgarian split squat is one leg at a time, named by the front leg; a
 * walking lunge may be done on one leg or alternating, named by the working leg; a side plank is
 * one-sided but mapped only by the core, which counts no side; a pendulum squat is two-legged.
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
const pressed = (group: HTMLElement) => within(group).getAllByRole("button").filter((button) => button.getAttribute("aria-pressed") === "true").map((button) => button.textContent);
const sidesOf = (index: number) => stored()[0].exercises[index].sets.map((set) => [set.side ?? null, set.legSide ?? null]);
const what = (dialog: HTMLElement) => dialog.querySelector("#swap-what")!.textContent;

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

describe("The leg's side question", () => {
  it("is labelled by the leg the exercise names, says so to a screen reader, and stores the answer as the leg's side", () => {
    mount([split]);
    startWorkout();
    const group = sideGroup()!;
    expect(group.getAttribute("aria-label")).toBe("Front leg for set 1 of Bulgarian Split Squat");
    expect(group.querySelector(".live-set-side-label")!.textContent).toBe("Front leg");
    expect(within(group).getAllByRole("button").map((button) => button.textContent)).toEqual(["Left", "Right", "Both"]);
    // One leg at a time: which leg goes first is the athlete's, so nothing is preselected.
    expect(pressed(group)).toEqual([]);
    fireEvent.click(within(group).getByRole("button", { name: "Left" }));
    type(/^Weight/, "20"); type("Reps", "10");
    log();
    expect(sidesOf(0)[0]).toEqual([null, "left"]);
    // The next set offers the other leg.
    expect(sideGroup()!.getAttribute("aria-label")).toBe("Front leg for set 2 of Bulgarian Split Squat");
    expect(pressed(sideGroup()!)).toEqual(["Right"]);
    log();
    log();
    expect(sidesOf(0)).toEqual([[null, "left"], [null, "right"], [null, "left"]]);
    // What Finish will record, with each set's leg.
    expect(Array.from(document.querySelectorAll(".live-done-summary li li")).map((node) => node.textContent)).toEqual(["20 kg × 10 · Left", "20 kg × 10 · Right", "20 kg × 10 · Left"]);
  });

  it("starts an either-leg exercise on Both and names it by the working leg", () => {
    mount([lunge], [], "1 × 12");
    startWorkout();
    expect(sideGroup()!.getAttribute("aria-label")).toBe("Working leg for set 1 of Walking Lunge");
    expect(pressed(sideGroup()!)).toEqual(["Both"]);
    type(/^Weight/, "16"); type("Reps", "12");
    log();
    expect(sidesOf(0)[0]).toEqual([null, "both"]);
    expect(Array.from(document.querySelectorAll(".live-done-summary li li")).map((node) => node.textContent)).toEqual(["16 kg × 12 · Both legs"]);
  });

  it("is not asked where no region counts the leg's side, or of a two-legged exercise", () => {
    mount([sidePlank, pendulum]);
    startWorkout();
    expect(sideGroup()).toBeNull();
    fireEvent.click(within(card()).getByRole("button", { name: /^Skip/ }));
    expect(sideGroup()).toBeNull();
  });
});

describe("Rows per leg, for an athlete with a target in a region that maps the exercise", () => {
  it("lays a planned one-leg set out as a Right and a Left row on the leg, and says each leg", () => {
    mount([split], ["thigh"]);
    expect(document.querySelector(".session-prestart-counts")!.textContent).toBe("1 exercise · 6 sets");
    expect(document.querySelector(".session-prestart-name small")!.textContent).toBe("3 × 10 · each leg");
    startWorkout();
    expect(stored()[0].exercises[0]).toMatchObject({ perArm: true });
    expect(sidesOf(0)).toEqual([[null, "right"], [null, "left"], [null, "right"], [null, "left"], [null, "right"], [null, "left"]]);
    expect(pressed(sideGroup()!)).toEqual(["Right"]);
    // Starting on the other leg re-alternates the rows still to do, on the leg.
    fireEvent.click(within(sideGroup()!).getByRole("button", { name: "Left" }));
    expect(sidesOf(0).map(([, leg]) => leg)).toEqual(["left", "right", "left", "right", "left", "right"]);
    fireEvent.click(screen.getByText("Full workout"));
    expect(Array.from(document.querySelectorAll(".session-set-row > strong")).map((node) => node.textContent)).toEqual(["Set 1 · Left", "Set 2 · Right", "Set 3 · Left", "Set 4 · Right", "Set 5 · Left", "Set 6 · Right"]);
    expect(document.querySelector(".session-exercise .exercise-media-dense small")!.textContent).toBe("3 × 10 · each leg");
  });

  it("keeps one row per planned set for an athlete whose targets are elsewhere", () => {
    mount([split], ["forearm"]);
    expect(document.querySelector(".session-prestart-name small")!.textContent).toBe("3 × 10");
    startWorkout();
    expect(stored()[0].exercises[0]).not.toHaveProperty("perArm");
    expect(sidesOf(0)).toEqual([[null, null], [null, null], [null, null]]);
  });

  it("carries each row's side where the question is not shown, and records it when the row is logged", () => {
    mount([sidePlank], ["core"], "2 × 30");
    expect(document.querySelector(".session-prestart-name small")!.textContent).toBe("2 × 30 · each leg");
    startWorkout();
    expect(sideGroup()).toBeNull();
    expect(sidesOf(0)).toEqual([[null, "right"], [null, "left"], [null, "right"], [null, "left"]]);
    type(/^Seconds/, "30");
    log();
    expect(stored()[0].exercises[0].sets[0]).toMatchObject({ completed: true, holdSeconds: "30", legSide: "right" });
    expect(stored()[0].exercises[0].sets[0]).not.toHaveProperty("side");
  });
});

describe("Swap and add with rows per leg", () => {
  it("names the leg in the sheet, beside the confirm and in the message after", () => {
    mount([pendulum], ["thigh"]);
    startWorkout();
    fireEvent.click(within(card()).getByRole("button", { name: "Swap exercise" }));
    const dialog = screen.getByRole("dialog", { name: /^Replace / });
    choose(dialog, "bulgarian split squat", split.name);
    expect(what(dialog)).toBe(`Nothing is logged for Pendulum Squat yet, so ${split.name} takes its place with the same 3 planned sets, done once with each leg: 6 sets.`);
    expect(dialog.querySelector(".swap-logging")!.textContent).toContain(`${split.name} gets 6 sets, one leg at a time.`);
    fireEvent.click(within(dialog).getByRole("button", { name: `Use ${split.name}` }));
    expect(toasts.at(-1)?.options?.description).toBe(`${split.name} takes Pendulum Squat's place with 6 sets, one leg at a time.`);
    expect(sidesOf(0)).toEqual([[null, "right"], [null, "left"], [null, "right"], [null, "left"], [null, "right"], [null, "left"]]);
  });

  it("says a one-leg exercise's rows go to a two-legged one not one per leg", () => {
    mount([split], ["thigh"]);
    startWorkout();
    fireEvent.click(within(card()).getByRole("button", { name: "Swap exercise" }));
    const dialog = screen.getByRole("dialog", { name: /^Replace / });
    choose(dialog, "pendulum squat", pendulum.name);
    expect(what(dialog)).toBe(`Nothing is logged for ${split.name} yet, so Pendulum Squat takes its place with the same 3 planned sets, not one per leg.`);
  });

  it("adds a one-leg exercise laid out per leg, and says each leg", () => {
    mount([pendulum], ["thigh"]);
    startWorkout();
    fireEvent.click(within(card()).getByRole("button", { name: "Add exercise" }));
    const dialog = screen.getByRole("dialog", { name: "Add an exercise" });
    choose(dialog, "bulgarian split squat", split.name);
    expect(what(dialog)).toBe(`${split.name} goes in straight after Pendulum Squat, starting from the same sets and reps: 3 sets, done once with each leg: 6 sets. Nothing logged changes.`);
    fireEvent.click(within(dialog).getByRole("button", { name: `Add ${split.name}` }));
    expect(sidesOf(1)).toEqual([[null, "right"], [null, "left"], [null, "right"], [null, "left"], [null, "right"], [null, "left"]]);
    expect(toasts.at(-1)?.options?.description).toBe("After Pendulum Squat, starting from the same sets and reps, done once with each leg: 6 sets.");
  });
});
