// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deviceWorkoutHistoryKey, type DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { exercises, type Exercise } from "@/lib/exerciseCatalog";
import { buildDaySlots, emptyDayStore, type WeeklyDayStore } from "@/lib/trainingDayPlan";
import { getGoalPrescription } from "@/lib/workoutPlanner";
import { boutsFromSessions } from "@/lib/specialization/bouts";
import { boutsFromPlan } from "@/lib/specialization/planBouts";
import { catalogMusclesLookup } from "@/lib/specialization/useSpecializationSummary";
import { getSpecializationSummary } from "@shared/specialization/exposure";
import { forearmRegionData } from "@shared/specialization/regions/forearm";
import { calendarWeekInterval, planWeekInterval } from "@shared/specialization/time";
import type { ArmSide, ExposureBout, SpecializationSummary } from "@shared/specialization/types";

type Toast = { title: string; options?: { description?: string; action?: { label: string; onClick: () => void } } };
const toasts: Toast[] = [];
vi.mock("sonner", () => {
  const record = (title: string, options?: Toast["options"]) => { toasts.push({ title, options }); };
  return { toast: Object.assign(record, { success: record, error: record }), Toaster: () => null };
});

import { DeviceWorkoutTracker } from "./DeviceWorkoutTracker";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

/**
 * Swap and add in the middle of a workout, for an athlete tracking per-arm totals (`perArmSets`,
 * which Home passes with `askStraps`). On the real forearm data: a one-arm exercise coming in is
 * laid out Right then Left per planned set, exactly as a planned one is; a one-arm exercise going
 * out leaves its planned sets, not its rows; the sheet says the count before the confirm, and
 * Undo puts back exactly what was there. Without the gate nothing changes.
 */
const byId = (id: number) => exercises.find((exercise) => exercise.id === id)!;
const oneArmCurl = byId(410); // One-Arm Dumbbell Wrist Curl: unilateral
const hammerCurl = byId(132); // Hammer Curl: bilateral
const deadHang = byId(143); // Dead Hang: seconds

const DAY = "Week 1 · Day 01 · Pull";
const stored = (): DeviceWorkoutSession[] => JSON.parse(window.localStorage.getItem(deviceWorkoutHistoryKey) || "[]");
const card = () => document.querySelector(".live-set-card") as HTMLElement;
const type = (label: RegExp | string, value: string) => fireEvent.change(within(card()).getByLabelText(label), { target: { value } });
const logButton = () => within(card()).getByRole("button", { name: /^Log set/ }) as HTMLButtonElement;
const pressedArm = () => within(within(card()).getByRole("group", { name: /^Arm for set/ })).getAllByRole("button").filter((button) => button.getAttribute("aria-pressed") === "true").map((button) => button.textContent);
const sidesOf = (index: number) => stored()[0].exercises[index].sets.map((set) => set.side ?? null);

function start(workout: Exercise[], options: { perArmSets?: boolean; prescriptions?: Record<number, string> } = {}) {
  const prescriptions = options.prescriptions ?? Object.fromEntries(workout.map((exercise) => [exercise.id, "3 × 12"]));
  render(createElement(DeviceWorkoutTracker, { workout, prescriptions, settings: {}, goal: "Athleticism", dayLabel: DAY, weightUnit: "lb", perArmSets: options.perArmSets }));
  fireEvent.click(screen.getByRole("button", { name: /start workout/i }));
}
function choose(dialog: HTMLElement, query: string, name: string) {
  fireEvent.change(within(dialog).getByRole("searchbox"), { target: { value: query } });
  fireEvent.click(within(dialog).getAllByRole("button", { name: new RegExp(`^${name}`) })[0]);
}
function openSwap(query: string, name: string) {
  fireEvent.click(within(card()).getByRole("button", { name: "Swap exercise" }));
  const dialog = screen.getByRole("dialog", { name: /^Replace / });
  choose(dialog, query, name);
  return dialog;
}
const what = (dialog: HTMLElement) => dialog.querySelector("#swap-what")!.textContent;

beforeEach(() => { window.localStorage.clear(); toasts.length = 0; });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("Swapping a two-handed exercise for a one-arm one, with the gate", () => {
  it("says the count first, then builds Right and Left rows for each planned set with the arm preset", () => {
    start([hammerCurl], { perArmSets: true });
    const dialog = openSwap("one-arm dumbbell wrist curl", oneArmCurl.name);
    expect(what(dialog)).toBe(`Nothing is logged for Hammer Curl yet, so ${oneArmCurl.name} takes its place with the same 3 planned sets, done once with each arm: 6 sets.`);
    // Said again beside the confirm, where a phone's scrolled sheet still shows it.
    expect(dialog.querySelector(".swap-logging")!.textContent).toContain(`${oneArmCurl.name} gets 6 sets, one arm at a time.`);
    fireEvent.click(within(dialog).getByRole("button", { name: `Use ${oneArmCurl.name}` }));
    expect(toasts.at(-1)?.options?.description).toBe(`${oneArmCurl.name} takes Hammer Curl's place. ${oneArmCurl.name} has 6 sets, one arm at a time.`);
    expect(stored()[0].exercises[0]).toMatchObject({ exerciseName: oneArmCurl.name, perArm: true, plannedPrescription: "3 × 12" });
    expect(sidesOf(0)).toEqual(["right", "left", "right", "left", "right", "left"]);
    expect(card().querySelector(".live-set-prescription")!.textContent).toBe("Set 1 of 612 reps");
    expect(pressedArm()).toEqual(["Right"]);
    expect(document.querySelector(".session-progress strong")!.textContent).toBe("0/6 sets");
  });

  it("is undone exactly: the session is as it was before the swap", () => {
    start([hammerCurl], { perArmSets: true });
    const before = stored()[0];
    fireEvent.click(within(openSwap("one-arm dumbbell wrist curl", oneArmCurl.name)).getByRole("button", { name: `Use ${oneArmCurl.name}` }));
    act(() => toasts.at(-1)!.options!.action!.onClick());
    expect(stored()[0].exercises).toEqual(before.exercises);
  });

  it("gives what is left after a logged set, laid out the same way", () => {
    start([hammerCurl], { perArmSets: true });
    type(/^Weight/, "30");
    type("Reps", "12");
    fireEvent.click(logButton());
    const dialog = openSwap("one-arm dumbbell wrist curl", oneArmCurl.name);
    expect(what(dialog)).toBe(`Your 1 logged set stays with Hammer Curl. ${oneArmCurl.name} takes the remaining 2 sets, done once with each arm: 4 sets.`);
    fireEvent.click(within(dialog).getByRole("button", { name: `Use ${oneArmCurl.name}` }));
    expect(sidesOf(1)).toEqual(["right", "left", "right", "left"]);
  });

  it("logged as built, gives each arm the work the plan counts for the one-arm exercise", () => {
    start([hammerCurl], { perArmSets: true });
    fireEvent.click(within(openSwap("one-arm dumbbell wrist curl", oneArmCurl.name)).getByRole("button", { name: `Use ${oneArmCurl.name}` }));
    type(/^Weight/, "25");
    type("Reps", "12");
    for (let row = 0; row < 6; row += 1) fireEvent.click(logButton());
    fireEvent.click(screen.getByRole("button", { name: "Finish workout · add 6 sets to Progress" }));
    const session = stored()[0];
    const now = new Date().toISOString();
    const slots = buildDaySlots(["Pull"]);
    const store: WeeklyDayStore = { ...emptyDayStore(), plan: { [slots[0].key]: [oneArmCurl] }, prescriptions: { [slots[0].key]: { [oneArmCurl.id]: "3 × 12" } } };
    const planned = boutsFromPlan({ week: 1, slots, store, variants: forearmRegionData.variants, goal: "Athleticism" });
    const completed = boutsFromSessions([session], { catalog: exercises, variants: forearmRegionData.variants, fallbackUnit: "lb" });
    const summary = (bouts: ExposureBout[], side: ArmSide, mode: "planned" | "completed"): SpecializationSummary => getSpecializationSummary({
      region: forearmRegionData, bouts, side, mode, goals: [], catalogMusclesFor: catalogMusclesLookup(exercises), sourceRevision: "s", planRevision: mode === "planned" ? "p" : null, now,
      interval: mode === "planned" ? planWeekInterval(1, "UTC") : calendarWeekInterval(now, "UTC"),
    });
    const perNode = (value: SpecializationSummary) => value.nodes.map((node) => [node.nodeId, node.directDynamicBouts, node.contributingDynamicBouts]);
    for (const side of ["left", "right"] as const) {
      expect(summary(completed, side, "completed").regionDistinctBouts, side).toBe(3);
      expect(perNode(summary(completed, side, "completed")), side).toEqual(perNode(summary(planned, side, "planned")));
    }
  });
});

describe("Swapping a one-arm exercise laid out per arm for a two-handed one", () => {
  it("gives the planned 3 sets, not 6, and says so", () => {
    start([oneArmCurl], { perArmSets: true });
    const dialog = openSwap("hammer curl", "Hammer Curl");
    expect(what(dialog)).toBe(`Nothing is logged for ${oneArmCurl.name} yet, so Hammer Curl takes its place with the same 3 planned sets, not one per arm.`);
    expect(dialog.querySelector(".swap-logging")!.textContent).toContain("Hammer Curl gets 3 sets.");
    fireEvent.click(within(dialog).getByRole("button", { name: "Use Hammer Curl" }));
    expect(toasts.at(-1)?.options?.description).toBe(`Hammer Curl takes ${oneArmCurl.name}'s place. Hammer Curl has 3 sets.`);
    expect(stored()[0].exercises[0]).not.toHaveProperty("perArm");
    expect(sidesOf(0)).toEqual([null, null, null]);
    expect(document.querySelector(".session-progress strong")!.textContent).toBe("0/3 sets");
  });

  it("before a choice, names the planned sets rather than the rows", () => {
    start([oneArmCurl], { perArmSets: true });
    fireEvent.click(within(card()).getByRole("button", { name: "Swap exercise" }));
    expect(what(screen.getByRole("dialog", { name: /^Replace / }))).toBe(`Nothing is logged for ${oneArmCurl.name} yet, so the exercise you choose takes its place with the same 3 planned sets.`);
  });

  it("after one arm's set, turns the 5 one-arm sets left into 3, and Undo restores all six rows with their arms", () => {
    start([oneArmCurl], { perArmSets: true });
    const before = stored()[0];
    type(/^Weight/, "25");
    type("Reps", "12");
    fireEvent.click(logButton());
    const logged = stored()[0];
    const dialog = openSwap("hammer curl", "Hammer Curl");
    expect(what(dialog)).toBe(`Your 1 logged set stays with ${oneArmCurl.name}. Hammer Curl takes the 5 one-arm sets left as 3 sets, not one per arm.`);
    fireEvent.click(within(dialog).getByRole("button", { name: "Use Hammer Curl" }));
    expect(stored()[0].exercises.map((exercise) => [exercise.exerciseName, exercise.sets.length])).toEqual([[oneArmCurl.name, 1], ["Hammer Curl", 3]]);
    act(() => toasts.at(-1)!.options!.action!.onClick());
    expect(stored()[0].exercises).toEqual(logged.exercises);
    expect(sidesOf(0)).toEqual(before.exercises[0].sets.map((set) => set.side ?? null));
  });
});

describe("Adding a one-arm exercise mid-workout", () => {
  it("lays it out per arm with the gate, and says so before the confirm", () => {
    start([hammerCurl], { perArmSets: true });
    fireEvent.click(within(card()).getByRole("button", { name: "Add exercise" }));
    const dialog = screen.getByRole("dialog", { name: "Add an exercise" });
    choose(dialog, "one-arm dumbbell wrist curl", oneArmCurl.name);
    expect(what(dialog)).toBe(`${oneArmCurl.name} goes in straight after Hammer Curl, starting from the same sets and reps: 3 sets, done once with each arm: 6 sets. Nothing logged changes.`);
    fireEvent.click(within(dialog).getByRole("button", { name: `Add ${oneArmCurl.name}` }));
    expect(stored()[0].exercises[1]).toMatchObject({ exerciseName: oneArmCurl.name, perArm: true });
    expect(sidesOf(1)).toEqual(["right", "left", "right", "left", "right", "left"]);
    expect(toasts.at(-1)?.options?.description).toBe("After Hammer Curl, starting from the same sets and reps, done once with each arm: 6 sets.");
  });

  it("adds one row per planned set without the gate, as before", () => {
    start([hammerCurl]);
    fireEvent.click(within(card()).getByRole("button", { name: "Add exercise" }));
    const dialog = screen.getByRole("dialog", { name: "Add an exercise" });
    choose(dialog, "one-arm dumbbell wrist curl", oneArmCurl.name);
    expect(what(dialog)).toBe("It goes in straight after Hammer Curl, starting from the same sets and reps. Nothing logged changes.");
    fireEvent.click(within(dialog).getByRole("button", { name: `Add ${oneArmCurl.name}` }));
    expect(stored()[0].exercises[1]).not.toHaveProperty("perArm");
    expect(sidesOf(1)).toEqual([null, null, null]);
  });
});

describe("The count the sheet gives is the count the swap makes", () => {
  it("leaves out a typed set kept with the original, and counts it again when it is discarded", () => {
    start([hammerCurl]);
    type(/^Weight/, "30");
    type("Reps", "12");
    fireEvent.click(logButton());
    type("Reps", "9");
    const dialog = openSwap("cable curl", "Cable Curl");
    // 3 sets: 1 logged, 1 typed and kept with Hammer Curl (the default), 1 left to hand on.
    expect(what(dialog)).toBe("Your 1 logged set stays with Hammer Curl. The exercise you choose takes the remaining 1 set.");
    fireEvent.click(within(dialog).getByRole("radio", { name: /Discard it/ }));
    expect(what(dialog)).toBe("Your 1 logged set stays with Hammer Curl. The exercise you choose takes the remaining 2 sets.");
    fireEvent.click(within(dialog).getByRole("button", { name: /^Use / }));
    expect(stored()[0].exercises[1].sets).toHaveLength(2);
  });
});

describe("Without the gate, a swap is as it was", () => {
  it("swaps into a one-arm exercise row for row, with the old copy", () => {
    start([hammerCurl]);
    const dialog = openSwap("one-arm dumbbell wrist curl", oneArmCurl.name);
    expect(what(dialog)).toBe("Nothing is logged for Hammer Curl yet, so the exercise you choose takes its place with the same 3 sets.");
    expect(dialog.querySelector(".swap-logging")!.textContent).not.toContain(" gets ");
    fireEvent.click(within(dialog).getByRole("button", { name: `Use ${oneArmCurl.name}` }));
    expect(toasts.at(-1)?.options?.description).toBe(`${oneArmCurl.name} takes Hammer Curl's place.`);
    expect(stored()[0].exercises[0]).not.toHaveProperty("perArm");
    expect(sidesOf(0)).toEqual([null, null, null]);
  });
});

describe("A hold swapped in reads its prescription as a hold's", () => {
  it("reads the goal's pinned rep default as a hold's default, and says so", () => {
    start([hammerCurl], { prescriptions: { [hammerCurl.id]: getGoalPrescription("Athleticism", 0) } });
    const dialog = openSwap("dead hang", "Dead Hang");
    expect(dialog.textContent).toContain("The plan's 4 × 3–6 is the goal's rep default, so Dead Hang starts from a hold's: 4 × 30 sec.");
    fireEvent.click(within(dialog).getByRole("button", { name: "Use Dead Hang" }));
    expect(stored()[0].exercises[0]).toMatchObject({ exerciseName: deadHang.name, plannedPrescription: "4 × 30 sec" });
    expect(stored()[0].exercises[0].sets).toHaveLength(4);
    expect(card().querySelector(".live-set-prescription strong")!.textContent).toBe("30 sec");
  });

  it("keeps a target the athlete wrote, and says its numbers are seconds on the hold", () => {
    start([hammerCurl]);
    const dialog = openSwap("dead hang", "Dead Hang");
    expect(dialog.textContent).toContain("The plan's target (3 × 12) gives no unit; on Dead Hang its numbers are seconds.");
    fireEvent.click(within(dialog).getByRole("button", { name: "Use Dead Hang" }));
    expect(stored()[0].exercises[0].plannedPrescription).toBe("3 × 12");
    expect(card().querySelector(".live-set-prescription strong")!.textContent).toBe("12 sec");
  });
});
