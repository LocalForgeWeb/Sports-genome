// @vitest-environment jsdom
import React, { createElement } from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deviceWorkoutHistoryKey, type DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { exercises, type Exercise } from "@/lib/exerciseCatalog";
import { buildDaySlots, emptyDayStore, type WeeklyDayStore } from "@/lib/trainingDayPlan";
import { getGoalPrescription, type TrainingGoal } from "@/lib/workoutPlanner";
import { boutsFromSessions } from "@/lib/specialization/bouts";
import { boutsFromPlan } from "@/lib/specialization/planBouts";
import { catalogMusclesLookup } from "@/lib/specialization/useSpecializationSummary";
import { getSpecializationSummary } from "@shared/specialization/exposure";
import { forearmRegionData } from "@shared/specialization/regions/forearm";
import { calendarWeekInterval, planWeekInterval } from "@shared/specialization/time";
import type { ArmSide, ExposureBout, SpecializationSummary } from "@shared/specialization/types";

vi.mock("sonner", () => {
  const record = () => undefined;
  return { toast: Object.assign(record, { success: record, error: record }), Toaster: () => null };
});

import { DeviceWorkoutTracker } from "./DeviceWorkoutTracker";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

/**
 * A planned one-arm set is per arm (02-design.md §3 "each side", planBouts): "3 × 12" on a one-arm
 * wrist curl is three sets for each arm. For an athlete with a specialization target (`perArmSets`,
 * which Home passes with `askStraps`), the tracker builds the same plan as two rows per planned set,
 * Right then Left, so the workout logged as built gives each arm what the plan counts for it. These
 * run on the real forearm data: no variant is injected.
 */
const byId = (id: number) => exercises.find((exercise) => exercise.id === id)!;
const oneArmCurl = byId(410); // One-Arm Dumbbell Wrist Curl: unilateral
const hammerCurl = byId(132); // Hammer Curl: two dumbbells together, bilateral
const machinePreacher = byId(127); // Machine Preacher Curl: either
const deadHang = byId(143); // Dead Hang: seconds, both hands
const platePinch = byId(142); // Plate Pinch: seconds, one hand

const DAY = "Week 1 · Day 01 · Pull";
const stored = (): DeviceWorkoutSession[] => JSON.parse(window.localStorage.getItem(deviceWorkoutHistoryKey) || "[]");
const card = () => document.querySelector(".live-set-card") as HTMLElement;
const type = (label: RegExp | string, value: string) => fireEvent.change(within(card()).getByLabelText(label), { target: { value } });
const logButton = () => within(card()).getByRole("button", { name: /^Log set/ }) as HTMLButtonElement;
const arm = () => within(card()).getByRole("group", { name: /^Arm for set/ });
const pressedArm = () => within(arm()).getAllByRole("button").filter((button) => button.getAttribute("aria-pressed") === "true").map((button) => button.textContent);
const sides = () => stored()[0].exercises[0].sets.map((set) => set.side);

function mount(workout: Exercise[], options: { prescription?: string; perArmSets?: boolean; goal?: TrainingGoal; prescriptions?: Record<number, string> } = {}) {
  const prescriptions = options.prescriptions ?? Object.fromEntries(workout.map((exercise) => [exercise.id, options.prescription ?? "3 × 12"]));
  render(createElement(DeviceWorkoutTracker, { workout, prescriptions, settings: {}, goal: options.goal ?? "Athleticism", dayLabel: DAY, weightUnit: "lb", perArmSets: options.perArmSets }));
}
const startWorkout = () => fireEvent.click(screen.getByRole("button", { name: /start workout/i }));

beforeEach(() => window.localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("A planned one-arm set, for an athlete with a target", () => {
  it("builds two rows per planned set, Right then Left, and every count reads the rows", () => {
    mount([oneArmCurl], { perArmSets: true });
    expect(document.querySelector(".session-prestart-counts")!.textContent).toBe("1 exercise · 6 sets");
    expect(document.querySelector(".session-prestart-name small")!.textContent).toBe("3 × 12 · each arm");
    startWorkout();
    const built = stored()[0].exercises[0];
    expect(built).toMatchObject({ perArm: true, plannedPrescription: "3 × 12" });
    expect(sides()).toEqual(["right", "left", "right", "left", "right", "left"]);
    expect(built.sets.every((set) => !set.completed && set.id)).toBe(true);
    // The progress line, the card and the arm control all read the six rows.
    expect(document.querySelector(".session-progress strong")!.textContent).toBe("0/6 sets");
    expect(card().querySelector(".live-set-prescription")!.textContent).toBe("Set 1 of 612 reps");
    expect(pressedArm()).toEqual(["Right"]);
  });

  it("logs each row with its arm, and the logged week equals the planned week arm for arm", () => {
    mount([oneArmCurl], { perArmSets: true });
    startWorkout();
    type(/^Weight/, "25");
    type("Reps", "12");
    for (let row = 0; row < 6; row += 1) {
      expect(pressedArm()).toEqual([row % 2 === 0 ? "Right" : "Left"]);
      fireEvent.click(logButton());
    }
    expect(document.querySelector(".session-progress strong")!.textContent).toBe("6/6 sets");
    fireEvent.click(screen.getByRole("button", { name: "Finish workout · add 6 sets to Progress" }));
    const session = stored()[0];
    expect(session.status).toBe("completed");
    expect(session.exercises[0].sets.map((set) => [set.side, set.reps, set.weight])).toEqual([
      ["right", "12", "25"], ["left", "12", "25"], ["right", "12", "25"], ["left", "12", "25"], ["right", "12", "25"], ["left", "12", "25"],
    ]);

    // The atlas over the real forearm data: the same day planned, and the workout as logged.
    const now = new Date().toISOString();
    const catalogMusclesFor = catalogMusclesLookup(exercises);
    const slots = buildDaySlots(["Pull"]);
    const store: WeeklyDayStore = { ...emptyDayStore(), plan: { [slots[0].key]: [oneArmCurl] }, prescriptions: { [slots[0].key]: { [oneArmCurl.id]: "3 × 12" } } };
    const planned = boutsFromPlan({ week: 1, slots, store, variants: forearmRegionData.variants, goal: "Athleticism" });
    const completed = boutsFromSessions([session], { catalog: exercises, variants: forearmRegionData.variants, fallbackUnit: "lb" });
    const summary = (bouts: ExposureBout[], side: ArmSide, mode: "planned" | "completed"): SpecializationSummary => getSpecializationSummary({
      region: forearmRegionData, bouts, side, mode, goals: [], catalogMusclesFor, sourceRevision: "s", planRevision: mode === "planned" ? "p" : null, now,
      interval: mode === "planned" ? planWeekInterval(1, "UTC") : calendarWeekInterval(now, "UTC"),
    });
    const perNode = (value: SpecializationSummary) => value.nodes.map((node) => [node.nodeId, node.directDynamicBouts, node.contributingDynamicBouts, node.directDynamicReps]);
    for (const side of ["left", "right"] as const) {
      const plannedSide = summary(planned, side, "planned");
      const completedSide = summary(completed, side, "completed");
      expect(completedSide.regionDistinctBouts, side).toBe(3);
      expect(completedSide.regionDistinctBouts, side).toBe(plannedSide.regionDistinctBouts);
      expect(perNode(completedSide), side).toEqual(perNode(plannedSide));
      // A wrist curl's direct work lands somewhere, three bouts on each arm.
      expect(Math.max(...completedSide.nodes.map((node) => node.directDynamicBouts)), side).toBe(3);
    }
  });

  it("re-alternates the rows still to do when the athlete starts on the other arm", () => {
    mount([oneArmCurl], { perArmSets: true });
    startWorkout();
    fireEvent.click(within(arm()).getByRole("button", { name: "Left" }));
    expect(sides()).toEqual(["left", "right", "left", "right", "left", "right"]);
    type(/^Weight/, "25");
    type("Reps", "12");
    fireEvent.click(logButton());
    expect(pressedArm()).toEqual(["Right"]);
    // "Both" changes only its own row.
    fireEvent.click(within(arm()).getByRole("button", { name: "Both" }));
    expect(sides()).toEqual(["left", "both", "left", "right", "left", "right"]);
  });

  it("names each row's arm in the full workout list before it is logged", () => {
    mount([oneArmCurl], { perArmSets: true });
    startWorkout();
    fireEvent.click(screen.getByText("Full workout"));
    const headers = Array.from(document.querySelectorAll(".session-set-row > strong")).map((node) => node.textContent);
    expect(headers).toEqual(["Set 1 · Right", "Set 2 · Left", "Set 3 · Right", "Set 4 · Left", "Set 5 · Right", "Set 6 · Left"]);
    expect(document.querySelector(".session-exercise .exercise-media-dense small")!.textContent).toBe("3 × 12 · each arm");
  });

  it("reads a per-set prescription once per arm: 10, 10, 8, 8, 6, 6", () => {
    mount([oneArmCurl], { perArmSets: true, prescription: "3 × 10/8/6" });
    startWorkout();
    const targets: string[] = [];
    type(/^Weight/, "25");
    for (let row = 0; row < 6; row += 1) {
      targets.push(card().querySelector(".live-set-prescription strong")!.textContent ?? "");
      type("Reps", "8");
      fireEvent.click(logButton());
    }
    expect(targets).toEqual(["10 reps", "10 reps", "8 reps", "8 reps", "6 reps", "6 reps"]);
  });

  it("splits a one-arm hold the same way", () => {
    mount([platePinch], { perArmSets: true, prescription: "2 × 30" });
    expect(document.querySelector(".session-prestart-counts")!.textContent).toBe("1 exercise · 4 sets");
    startWorkout();
    expect(sides()).toEqual(["right", "left", "right", "left"]);
  });
});

describe("The gate", () => {
  it("is the one Home asks straps with: an athlete with an active specialization target", () => {
    const home = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    const tracker = home.split("\n").find((line) => line.includes("<DeviceWorkoutTracker "))!;
    expect(tracker).toContain("askStraps={askStraps} perArmSets={askStraps}");
    expect(home).toMatch(/const askStraps = useMemo\(\(\) => \{[^\n]*specializationGoals\.some\(\(item\) => isGoalActiveAt\(item, now\)\)/);
  });
});

describe("Everyone else, and every exercise that is not one-arm, is built as before", () => {
  it("builds one row per planned set without the gate, with no arm chosen", () => {
    mount([oneArmCurl]);
    expect(document.querySelector(".session-prestart-counts")!.textContent).toBe("1 exercise · 3 sets");
    expect(document.querySelector(".session-prestart-name small")!.textContent).toBe("3 × 12");
    startWorkout();
    const built = stored()[0].exercises[0];
    expect(built).not.toHaveProperty("perArm");
    expect(built.sets).toHaveLength(3);
    expect(built.sets.every((set) => set.side === undefined)).toBe(true);
    expect(pressedArm()).toEqual([]);
    expect(card().querySelector(".live-set-prescription")!.textContent).toBe("Set 1 of 312 reps");
  });

  it("never splits a two-handed or an either-arm exercise, even with the gate", () => {
    mount([hammerCurl, machinePreacher, deadHang], { perArmSets: true });
    expect(document.querySelector(".session-prestart-counts")!.textContent).toBe("3 exercises · 9 sets");
    startWorkout();
    for (const exercise of stored()[0].exercises) {
      expect(exercise).not.toHaveProperty("perArm");
      expect(exercise.sets).toHaveLength(3);
      expect(exercise.sets.every((set) => set.side === undefined)).toBe(true);
    }
  });
});

describe("A hold's default is a hold's (R1)", () => {
  it("gives a hold with no saved prescription 3 × 30 sec, never the goal's rep range read as seconds", () => {
    mount([deadHang, hammerCurl], { prescriptions: {}, goal: "Muscle growth" });
    const rows = Array.from(document.querySelectorAll(".session-prestart-name small")).map((node) => node.textContent);
    expect(rows[0]).toBe("3 × 30 sec");
    // A rep exercise keeps the goal's default.
    expect(rows[1]).toMatch(/^3 × \d+–\d+$/);
    startWorkout();
    expect(stored()[0].exercises[0].plannedPrescription).toBe("3 × 30 sec");
    expect(card().querySelector(".live-set-prescription strong")!.textContent).toBe("30 sec");
  });

  it("treats the goal's default that Home fills in for an unset hold as the default, keeping its set count", () => {
    // Home hands the tracker the day's map with every unset entry filled from the goal (dayPrescriptions).
    mount([deadHang], { prescriptions: { [deadHang.id]: getGoalPrescription("Athleticism", 0) }, goal: "Athleticism" });
    expect(document.querySelector(".session-prestart-name small")!.textContent).toBe("4 × 30 sec");
    startWorkout();
    expect(stored()[0].exercises[0].sets).toHaveLength(4);
    expect(card().querySelector(".live-set-prescription strong")!.textContent).toBe("30 sec");
  });

  it("still reads a built day's pinned default as the default after the hold is moved in the day", () => {
    // generateWeek pins "3 × 6–10" on the third entry; the athlete then moves the hang to the top.
    mount([deadHang, hammerCurl], { prescriptions: { [deadHang.id]: getGoalPrescription("Athleticism", 2), [hammerCurl.id]: "3 × 10" }, goal: "Athleticism" });
    expect(document.querySelector(".session-prestart-name small")!.textContent).toBe("3 × 30 sec");
    startWorkout();
    expect(stored()[0].exercises[0].plannedPrescription).toBe("3 × 30 sec");
    expect(card().querySelector(".live-set-prescription strong")!.textContent).toBe("30 sec");
  });

  it("reads a saved bare target on a hold as seconds, as the planned atlas now does", () => {
    mount([deadHang], { prescription: "3 × 40" });
    startWorkout();
    expect(card().querySelector(".live-set-prescription strong")!.textContent).toBe("40 sec");
  });
});

describe("The plan change offered with a swap names the sets and reps the slot will hold", () => {
  const openSwap = (query: string, name: string) => {
    fireEvent.click(within(card()).getByRole("button", { name: "Swap exercise" }));
    const dialog = screen.getByRole("dialog", { name: /^Replace / });
    fireEvent.change(within(dialog).getByRole("searchbox"), { target: { value: query } });
    fireEvent.click(within(dialog).getAllByRole("button", { name: new RegExp(`^${name}`) })[0]);
    return dialog;
  };

  it("reads a hang's pinned rep default as reps again for the rep exercise taking its slot", () => {
    // The hang's slot holds the goal's pinned "4 × 3–6": a hold reads it as 4 × 30 sec, a curl as 4 × 3–6.
    render(createElement(DeviceWorkoutTracker, { workout: [deadHang, oneArmCurl], prescriptions: { [deadHang.id]: getGoalPrescription("Athleticism", 0), [oneArmCurl.id]: "3 × 12" }, settings: {}, goal: "Athleticism", dayLabel: DAY, weightUnit: "lb", onReplaceInPlan: () => true }));
    startWorkout();
    expect(card().querySelector(".live-set-prescription strong")!.textContent).toBe("30 sec");
    const dialog = openSwap("hammer curl", "Hammer Curl");
    expect(dialog.textContent).toContain("Pull, exercise 1 of 2: Dead Hang becomes Hammer Curl. Its sets and reps (4 × 3–6) stay.");
  });
});

describe("A hold logs only with its seconds (R2)", () => {
  it("keeps Log set off and says why, in place, until whole seconds of at least 1 are in", () => {
    mount([deadHang]);
    startWorkout();
    expect(logButton().disabled).toBe(true);
    const hint = card().querySelector(".live-set-dose-hint")!;
    expect(hint.textContent).toBe("Add the seconds");
    expect(logButton().getAttribute("aria-describedby")).toBe(hint.id);
    // Done on the Seconds box logs nothing yet.
    fireEvent.keyDown(within(card()).getByLabelText(/^Seconds/), { key: "Enter" });
    expect(stored()[0].exercises[0].sets[0].completed).toBe(false);

    type(/^Seconds/, "0");
    expect(logButton().disabled).toBe(true);
    expect(card().querySelector(".live-set-dose-hint")!.textContent).toBe("Add the seconds: at least 1");
    fireEvent.click(logButton());
    expect(stored()[0].exercises[0].sets[0].completed).toBe(false);

    type(/^Seconds/, "035");
    expect(logButton().disabled).toBe(false);
    expect(card().querySelector(".live-set-dose-hint")).toBeNull();
    fireEvent.click(logButton());
    expect(stored()[0].exercises[0].sets[0]).toMatchObject({ completed: true, holdSeconds: "35", reps: "" });
    // The carried seconds are an offer the next set can log as it stands.
    expect(logButton().disabled).toBe(false);
  });

  it("does the same on a hold's row in the full workout list", () => {
    mount([deadHang]);
    startWorkout();
    fireEvent.click(screen.getByText("Full workout"));
    const row = () => document.querySelectorAll(".session-set-row")[1] as HTMLElement;
    const rowLog = () => within(row()).getByRole("button", { name: /Log set/ }) as HTMLButtonElement;
    expect(rowLog().disabled).toBe(true);
    expect(row().querySelector(".session-set-dose-hint")!.textContent).toBe("Add the seconds");
    fireEvent.click(rowLog());
    expect(stored()[0].exercises[0].sets[1].completed).toBe(false);
    fireEvent.change(within(row()).getByLabelText(/Seconds/), { target: { value: "40" } });
    expect(rowLog().disabled).toBe(false);
    fireEvent.click(rowLog());
    expect(stored()[0].exercises[0].sets[1]).toMatchObject({ completed: true, holdSeconds: "40", reps: "" });
  });

  it("leaves a rep exercise's Log set as it was", () => {
    mount([hammerCurl]);
    startWorkout();
    expect(logButton().disabled).toBe(false);
    expect(card().querySelector(".live-set-dose-hint")).toBeNull();
  });
});
