// @vitest-environment jsdom
import React, { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deviceWorkoutHistoryKey, type DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { exercises } from "@/lib/exerciseCatalog";

type Toast = { title: string; options?: { description?: string; action?: { label: string; onClick: () => void } } };
const toasts: Toast[] = [];
vi.mock("sonner", () => {
  const record = (title: string, options?: Toast["options"]) => { toasts.push({ title, options }); };
  return { toast: Object.assign(record, { success: record, error: record }), Toaster: () => null };
});

import { DeviceWorkoutTracker } from "./DeviceWorkoutTracker";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const sissy = exercises.find((exercise) => exercise.name === "Sissy Squat")!;
const backSquat = exercises.find((exercise) => exercise.name === "Back Squat")!;
const bench = exercises.find((exercise) => exercise.name === "Barbell Bench Press")!;
const stored = (): DeviceWorkoutSession[] => JSON.parse(window.localStorage.getItem(deviceWorkoutHistoryKey) || "[]");
const card = () => document.querySelector(".live-set-card") as HTMLElement;
const type = (label: RegExp | string, value: string) => fireEvent.change(within(card()).getByLabelText(label), { target: { value } });

function mount(workout = [sissy, bench], extra: Record<string, unknown> = {}) {
  const prescriptions = Object.fromEntries(workout.map((exercise) => [exercise.id, "4 × 10"]));
  return render(createElement(DeviceWorkoutTracker, { workout, prescriptions, settings: {}, goal: "Athleticism", dayLabel: "Week 1 · Legs", weightUnit: "lb", ...extra }));
}
function start(workout?: typeof exercises, extra?: Record<string, unknown>) {
  const view = mount(workout, extra);
  fireEvent.click(screen.getByRole("button", { name: /start workout/i }));
  return view;
}
function logReps(reps: string) {
  type("Reps", reps);
  fireEvent.click(within(card()).getByRole("button", { name: /^Log set/ }));
}
function swapTo(query: string, name: string) {
  fireEvent.click(within(card()).getByRole("button", { name: "Swap exercise" }));
  const dialog = screen.getByRole("dialog", { name: /^Replace / });
  fireEvent.change(within(dialog).getByRole("searchbox"), { target: { value: query } });
  fireEvent.click(within(dialog).getAllByRole("button", { name: new RegExp(`^${name}`) })[0]);
  return dialog;
}

beforeEach(() => { window.localStorage.clear(); toasts.length = 0; });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("Swap exercise during a workout (owner example: Sissy Squat → Barbell Squat)", () => {
  it("keeps the 2 logged Sissy Squat sets and carries on tracking the barbell squat", () => {
    start();
    logReps("12");
    logReps("12");
    const dialog = swapTo("barbell squat", "Back Squat");
    expect(within(dialog).getByRole("heading", { level: 2 }).textContent).toBe("Replace Sissy Squat");
    expect(dialog.textContent).toContain("Your 2 logged sets stay with Sissy Squat. The exercise you choose takes the remaining 2 sets.");
    expect(dialog.textContent).toContain("This workout only");
    expect(dialog.textContent).toContain("No load is carried over from Sissy Squat.");
    expect(dialog.textContent).toContain("The rest timer is not changed.");
    fireEvent.click(within(dialog).getByRole("button", { name: "Use Back Squat" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(within(card()).getByRole("heading", { level: 4 }).textContent).toBe("Back Squat");
    expect(card().textContent).toContain("Switched from Sissy Squat after 2 sets");
    expect(card().textContent).toContain("Set 1 of 2");
    // No load came across: the weight box is empty, with no "Last set" from Sissy Squat.
    expect((within(card()).getByLabelText(/^Weight/) as HTMLInputElement).value).toBe("");
    expect(card().textContent).not.toContain("Last set");

    const [session] = stored();
    expect(session.exercises.map((exercise) => [exercise.exerciseName, exercise.sets.filter((set) => set.completed).length, exercise.sets.length])).toEqual([["Sissy Squat", 2, 2], ["Back Squat", 0, 2], ["Barbell Bench Press", 0, 4]]);
    expect(session.exercises[0]).toMatchObject({ catalogId: sissy.id, replacedBy: { exerciseName: "Back Squat", afterSets: 2 } });
    expect(toasts.at(-1)?.title).toBe("Swapped to Back Squat");

    // Tracking continues: the next set logged is the barbell squat's, at its own load.
    type(/^Weight/, "135");
    logReps("5");
    const after = stored()[0];
    expect(after.exercises[1].sets[0]).toMatchObject({ weight: "135", reps: "5", completed: true });
    expect(after.exercises[0].sets.map((set) => set.reps)).toEqual(["12", "12"]);
  });

  it("can be undone from its message until something is logged on the new exercise", () => {
    start();
    logReps("12");
    fireEvent.click(within(swapTo("back squat", "Back Squat")).getByRole("button", { name: "Use Back Squat" }));
    const undo = toasts.at(-1)!.options!.action!;
    expect(undo.label).toBe("Undo");
    act(() => undo.onClick());
    expect(within(card()).getByRole("heading", { level: 4 }).textContent).toBe("Sissy Squat");
    expect(stored()[0].exercises.map((exercise) => exercise.exerciseName)).toEqual(["Sissy Squat", "Barbell Bench Press"]);
    expect(stored()[0].exercises[0].sets.filter((set) => set.completed)).toHaveLength(1);

    fireEvent.click(within(swapTo("back squat", "Back Squat")).getByRole("button", { name: "Use Back Squat" }));
    const later = toasts.at(-1)!.options!.action!;
    type(/^Weight/, "135");
    logReps("5");
    act(() => later.onClick());
    expect(toasts.at(-1)?.title).toBe("This swap can't be undone now");
    expect(stored()[0].exercises[1]).toMatchObject({ exerciseName: "Back Squat" });
  });

  it("offers the plan change as a separate tick that names the slot, and makes it only when ticked", () => {
    const onReplaceInPlan = vi.fn(() => true);
    start(undefined, { onReplaceInPlan });
    const dialog = swapTo("back squat", "Back Squat");
    const tick = within(dialog).getByRole("checkbox", { name: /Also update this day in my plan/ });
    expect((tick as HTMLInputElement).checked).toBe(false);
    expect(dialog.textContent).toContain("Legs, exercise 1 of 2: Sissy Squat becomes Back Squat. Its sets and reps (4 × 10) stay.");
    fireEvent.click(tick);
    fireEvent.click(within(dialog).getByRole("button", { name: "Use Back Squat" }));
    expect(onReplaceInPlan).toHaveBeenCalledWith(sissy.id, backSquat.id);
    expect(toasts.at(-1)?.options?.description).toContain("Your plan's Legs now has Back Squat in its place.");
  });

  it("asks what to do with a typed, unlogged set, and reuses only its reps", () => {
    start();
    logReps("12");
    type(/weight/i, "20");
    type("Reps", "9");
    const dialog = swapTo("back squat", "Back Squat");
    expect(dialog.textContent).toContain("A set of Sissy Squat is typed but not logged");
    fireEvent.click(within(dialog).getByRole("radio", { name: /Use the reps for Back Squat/ }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Use Back Squat" }));
    expect((within(card()).getByLabelText("Reps") as HTMLInputElement).value).toBe("9");
    expect((within(card()).getByLabelText(/^Weight/) as HTMLInputElement).value).toBe("");
  });

  it("says there is nothing left when every set is logged, and adds the exercise instead", () => {
    start([sissy, bench], {});
    // Log Sissy Squat's four sets, then open its swap from the full workout list.
    for (let set = 0; set < 4; set += 1) logReps("10");
    fireEvent.click(screen.getByRole("button", { name: "Swap Sissy Squat" }));
    const dialog = screen.getByRole("dialog", { name: "Replace Sissy Squat" });
    expect(dialog.textContent).toContain("Every set of Sissy Squat is logged, so there is nothing left to swap.");
    fireEvent.change(within(dialog).getByRole("searchbox"), { target: { value: "back squat" } });
    fireEvent.click(within(dialog).getAllByRole("button", { name: /^Back Squat/ })[0]);
    fireEvent.click(within(dialog).getByRole("button", { name: "Add Back Squat" }));
    expect(stored()[0].exercises.map((exercise) => exercise.exerciseName)).toEqual(["Sissy Squat", "Back Squat", "Barbell Bench Press"]);
    expect(within(card()).getByRole("heading", { level: 4 }).textContent).toBe("Back Squat");
  });

  it("applies one confirm once, however many times it is tapped", () => {
    start();
    logReps("12");
    const dialog = swapTo("back squat", "Back Squat");
    const confirm = within(dialog).getByRole("button", { name: "Use Back Squat" });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    expect(stored()[0].exercises.filter((exercise) => exercise.exerciseName === "Back Squat")).toHaveLength(1);
  });

  it("comes back after a reload on the new exercise, with the swap recorded", () => {
    const view = start();
    logReps("12");
    fireEvent.click(within(swapTo("back squat", "Back Squat")).getByRole("button", { name: "Use Back Squat" }));
    view.unmount();
    mount();
    expect(within(card()).getByRole("heading", { level: 4 }).textContent).toBe("Back Squat");
    expect(card().textContent).toContain("Switched from Sissy Squat after 1 set");
  });
});

describe("Drop sets in the live tracker (owner example: 100 lb × 5 → 70 lb × 6 → 50 lb × 10)", () => {
  const addStage = (weight: string, reps: string) => {
    type(/^Weight/, weight);
    type("Reps", reps);
    fireEvent.click(within(card()).getByRole("button", { name: "Add drop" }));
  };

  it("records the three stages as one set, starts no rest between them, and shows it the same everywhere", () => {
    start([backSquat]);
    fireEvent.click(within(card()).getByRole("button", { name: "Drop set" }));
    addStage("100", "5");
    expect(within(card()).getByRole("list", { name: "Stages done" }).textContent).toContain("100 lb × 5");
    expect((within(card()).getByLabelText(/^Weight/) as HTMLInputElement).value).toBe("");
    expect(card().textContent).toContain("Stage 2 · lighter than 100 lb");
    // No rest between stages.
    expect(document.querySelector(".live-rest-state")?.textContent).toBe("Rest length");
    addStage("70", "6");
    type(/^Weight/, "50");
    type("Reps", "10");
    fireEvent.click(within(card()).getByRole("button", { name: "Finish drop set" }));

    const set = stored()[0].exercises[0].sets[0];
    expect(set).toMatchObject({ type: "drop", completed: true, weight: "100", reps: "5" });
    expect(set.stages!.map((stage) => [stage.weight, stage.reps])).toEqual([["100", "5"], ["70", "6"], ["50", "10"]]);
    expect(new Set(set.stages!.map((stage) => stage.id)).size).toBe(3);
    // One set of the three planned, and the rest starts now.
    expect(document.querySelector(".execution-head")?.textContent).toContain("1/4 sets");
    expect(document.querySelector(".live-rest-state")?.textContent).toBe("Resting");
    expect(card().textContent).toContain("Set 2 of 4");
    const queue = document.querySelector(".live-session-queue") as HTMLElement;
    expect(queue.textContent).toContain("Drop set · 100 lb × 5 → 70 lb × 6 → 50 lb × 10");
    expect(queue.textContent).toContain("1 drop set · 3 stages · 21 reps · 1,420 lb·reps");
  });

  it("keeps a heavier stage with a note rather than refusing it, and refuses a one-stage drop set", () => {
    start([backSquat]);
    fireEvent.click(within(card()).getByRole("button", { name: "Drop set" }));
    addStage("100", "5");
    addStage("110", "6");
    expect(within(card()).queryByRole("alert")).toBeNull();
    expect(within(card()).getByRole("status").textContent).toContain("Stage 2: This stage isn't lighter than the one before (100 lb). It's kept");
    expect(stored()[0].exercises[0].sets[0].stages!.map((stage) => stage.weight)).toEqual(["100", "110"]);
    fireEvent.click(within(card()).getByRole("button", { name: "Remove stage 2" }));
    fireEvent.click(within(card()).getByRole("button", { name: "Finish drop set" }));
    expect(within(card()).getByRole("alert").textContent).toContain("needs at least two stages");
    expect(stored()[0].exercises[0].sets[0].completed).toBe(false);
  });

  it("edits the last stage back into the boxes, and switches back to standard only with no stages", () => {
    start([backSquat]);
    fireEvent.click(within(card()).getByRole("button", { name: "Drop set" }));
    addStage("100", "5");
    expect((within(card()).getByRole("button", { name: "Standard" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(within(card()).getByRole("button", { name: /Edit stage 1/ }));
    expect((within(card()).getByLabelText(/^Weight/) as HTMLInputElement).value).toBe("100");
    expect((within(card()).getByRole("button", { name: "Standard" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("removes an accidental middle stage, keeping the set and the other stages in order, with Undo", () => {
    start([backSquat]);
    fireEvent.click(within(card()).getByRole("button", { name: "Drop set" }));
    addStage("100", "5");
    addStage("80", "4");
    addStage("70", "6");
    const ids = stored()[0].exercises[0].sets[0].stages!.map((stage) => stage.id);
    fireEvent.click(within(card()).getByRole("button", { name: "Remove stage 2" }));
    expect(stored()[0].exercises[0].sets[0].stages!.map((stage) => stage.weight)).toEqual(["100", "70"]);
    expect(toasts.at(-1)?.title).toBe("Removed stage 2");
    act(() => toasts.at(-1)!.options!.action!.onClick());
    const restored = stored()[0].exercises[0].sets[0].stages!;
    expect(restored.map((stage) => stage.weight)).toEqual(["100", "80", "70"]);
    expect(restored.map((stage) => stage.id)).toEqual(ids);
  });

  it("turns a set already logged into a drop set, its numbers becoming stage 1", () => {
    start([backSquat]);
    type(/^Weight/, "100");
    logReps("5");
    fireEvent.click(screen.getByRole("button", { name: `Make set 1 of ${backSquat.name} a drop set` }));
    expect(card().textContent).toContain("Set 1 of 4");
    expect(within(card()).getByRole("list", { name: "Stages done" }).textContent).toContain("100 lb × 5");
    addStage("70", "6");
    fireEvent.click(within(card()).getByRole("button", { name: "Finish drop set" }));
    const set = stored()[0].exercises[0].sets[0];
    expect(set).toMatchObject({ type: "drop", completed: true });
    expect(set.stages!.map((stage) => stage.weight)).toEqual(["100", "70"]);
  });

  it("resumes a drop set mid-way after a reload, with its stages", () => {
    const view = start([backSquat]);
    fireEvent.click(within(card()).getByRole("button", { name: "Drop set" }));
    addStage("100", "5");
    view.unmount();
    mount([backSquat]);
    expect(within(card()).getByRole("list", { name: "Stages done" }).textContent).toContain("100 lb × 5");
    expect(within(card()).getByRole("button", { name: "Finish drop set" })).toBeTruthy();
  });

  it("records kilograms and decimals as typed", () => {
    start([backSquat], { weightUnit: "kg" });
    fireEvent.click(within(card()).getByRole("button", { name: "Drop set" }));
    addStage("42.5", "6");
    addStage("30", "8");
    type(/^Weight/, "17.5");
    type("Reps", "12");
    fireEvent.click(within(card()).getByRole("button", { name: "Finish drop set" }));
    const queue = document.querySelector(".live-session-queue") as HTMLElement;
    expect(queue.textContent).toContain("Drop set · 42.5 kg × 6 → 30 kg × 8 → 17.5 kg × 12");
    expect(queue.textContent).toContain("705 kg·reps");
  });
});
