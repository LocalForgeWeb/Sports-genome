// @vitest-environment jsdom
import React, { createElement } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deviceWorkoutHistoryKey, loadDeviceWorkoutSessions, type DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { exercises } from "@/lib/exerciseCatalog";
import { sessionRecap } from "@/lib/sessionRecap";

vi.mock("sonner", () => {
  const record = () => undefined;
  return { toast: Object.assign(record, { success: record, error: record }), Toaster: () => null };
});

import { DeviceWorkoutTracker } from "./DeviceWorkoutTracker";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

/**
 * The Zercher, neck and bench rows in the live logger (the owner's handoff of 23 Oct 2026, §3-4,
 * tests T05, T07-T10, T12, T13, T15-T17, T19, T20). Nothing here is mocked but the toasts: the
 * logger reads these rows' measures from the light hold list and their conventions from the light
 * logging facts, the way the app does.
 */
const byId = (id: number) => exercises.find((exercise) => exercise.id === id)!;
const zercherHold = byId(424);
const machineFlexion = byId(425);
const machineExtension = byId(426);
const machineSideBend = byId(427);
const manualSideBend = byId(435);
const manualRotation = byId(436);
const plateIncline = byId(437);
const selectorizedDecline = byId(438);
const smithDecline = byId(440);
const pausedBench = byId(442);
const blockPull = byId(422);

const stored = (): DeviceWorkoutSession[] => JSON.parse(window.localStorage.getItem(deviceWorkoutHistoryKey) || "[]");
const card = () => document.querySelector(".live-set-card") as HTMLElement;
const type = (label: RegExp | string, value: string) => fireEvent.change(within(card()).getByLabelText(label), { target: { value } });
const logButton = () => within(card()).getByRole("button", { name: /^Log set/ }) as HTMLButtonElement;
const log = () => fireEvent.click(logButton());
const direction = () => within(card()).queryByRole("group", { name: /^(Head direction|Push \/ turn toward), set/ });
const pressed = (group: HTMLElement) => within(group).getAllByRole("button").filter((button) => button.getAttribute("aria-pressed") === "true").map((button) => button.textContent);

function start(workout: typeof exercises, prescriptions: Record<number, string> = {}, weightUnit: "lb" | "kg" = "kg") {
  render(createElement(DeviceWorkoutTracker, { workout, prescriptions, settings: {}, goal: "Max strength", dayLabel: "Week 1 · Day 01 · Neck", weightUnit }));
  fireEvent.click(screen.getByRole("button", { name: /start workout/i }));
}

beforeEach(() => window.localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("a manual neck hold: seconds, a direction per set, and no load at all (T07)", () => {
  it("asks which way to push before the first set, says the force is not measured, and has no load box", () => {
    start([manualSideBend], { [manualSideBend.id]: "2 × 20 s" });
    const group = direction()!;
    expect(group.getAttribute("aria-label")).toBe("Push / turn toward, set 1");
    expect(pressed(group)).toEqual([]);
    expect(card().querySelector(".live-set-load-note")!.textContent).toBe("Manual resistance · force not measured");
    expect(within(card()).queryByLabelText(/^Weight/)).toBeNull();
    expect(within(card()).queryByLabelText("Reps")).toBeNull();
    expect(within(card()).getByLabelText(/^Seconds/)).toBeTruthy();
    // No drop sets on a hold, and no arm is asked.
    expect(within(card()).queryByRole("group", { name: "Set type" })).toBeNull();
    expect(within(card()).queryByRole("group", { name: /^Arm/ })).toBeNull();
    // Seconds alone do not log it: the direction is still to choose, and the card says so in place.
    type(/^Seconds/, "20");
    expect(logButton().disabled).toBe(true);
    expect(card().textContent).toContain("Choose Left or Right");
  });

  it("logs right 20 s then left 15 s as two sets, each with its own direction, remembered for the next set but changeable", () => {
    start([manualSideBend], { [manualSideBend.id]: "2 × 20 s" });
    fireEvent.click(within(direction()!).getByRole("button", { name: "Right" }));
    type(/^Seconds/, "20");
    log();
    // The next set shows Right chosen, carried from the last one.
    expect(pressed(direction()!)).toEqual(["Right"]);
    expect(card().querySelector(".live-set-last")!.textContent).toBe("Last set: Right · 20 sec");
    fireEvent.click(within(direction()!).getByRole("button", { name: "Left" }));
    type(/^Seconds/, "15");
    log();
    const sets = stored()[0].exercises[0].sets;
    expect(sets).toHaveLength(2);
    expect(sets.map((set) => [set.headDirection, set.holdSeconds, set.reps, set.weight, set.side])).toEqual([["right", "20", "", "", undefined], ["left", "15", "", "", undefined]]);
    // Read back exactly as done: no load line, never a 0 kg statement.
    const recap = sessionRecap(stored()[0], "kg");
    expect(recap.exercises[0].sets.map((set) => set.line)).toEqual(["Right · 20 s", "Left · 15 s"]);
    expect(recap.exercises[0].setup).toBe("Manual resistance · force not measured");
  });

  it("logs a rotation hold with Push / turn toward, and the queue row logs only with a direction", () => {
    start([manualRotation], { [manualRotation.id]: "2 × 20 s" });
    fireEvent.click(screen.getByText("Full workout"));
    const rows = Array.from(document.querySelectorAll(".session-set-row")) as HTMLElement[];
    const row = rows[0];
    fireEvent.change(within(row).getByLabelText("Seconds"), { target: { value: "25" } });
    expect((within(row).getByRole("button", { name: /Log set/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(row.textContent).toContain("Choose Left or Right");
    fireEvent.click(within(within(row).getByRole("group", { name: /^Push \/ turn toward, set 1/ })).getByRole("button", { name: "Left" }));
    fireEvent.click(within(row).getByRole("button", { name: /Log set/ }));
    expect(stored()[0].exercises[0].sets[0]).toMatchObject({ headDirection: "left", holdSeconds: "25", completed: true });
  });
});

describe("a dynamic neck set to a side (T16, T08)", () => {
  it("names the choice Head direction, logs 12 reps with the machine load, and never as seconds", () => {
    start([machineSideBend], { [machineSideBend.id]: "3 × 12" });
    expect(direction()!.getAttribute("aria-label")).toBe("Head direction, set 1");
    expect(within(card()).getByLabelText(/^Machine load/)).toBeTruthy();
    expect(within(card()).queryByLabelText(/^Seconds/)).toBeNull();
    fireEvent.click(within(direction()!).getByRole("button", { name: "Right" }));
    type(/^Machine load/, "15");
    type("Reps", "12");
    log();
    expect(stored()[0].exercises[0].sets[0]).toMatchObject({ headDirection: "right", weight: "15", reps: "12", completed: true });
    expect(stored()[0].exercises[0].sets[0].holdSeconds).toBeUndefined();
    expect(sessionRecap(stored()[0], "kg").exercises[0].sets[0].line).toBe("Right · 15 kg × 12");
  });

  it("asks no direction of a flexion row", () => {
    start([machineFlexion], { [machineFlexion.id]: "3 × 12" });
    expect(direction()).toBeNull();
    type(/^Machine load/, "20");
    type("Reps", "12");
    log();
    expect(stored()[0].exercises[0].sets[0].headDirection).toBeUndefined();
  });

  it("gives a neck row with nothing saved the goal's set count and no target: the athlete sets the reps or the time", () => {
    start([machineFlexion, manualSideBend]);
    const [flexion, sideBend] = stored()[0].exercises;
    // Max strength would pin "4 × 3–5" on the first two exercises: not on a neck row.
    expect([flexion.plannedPrescription, sideBend.plannedPrescription]).toEqual(["4 × your reps", "4 × your time"]);
    expect(flexion.sets).toHaveLength(4);
  });
});

describe("Zercher Hold: two 20 s holds at 60 kg (T05)", () => {
  it("logs seconds with the bar's weight and no reps, read back as 40 s over two holds", () => {
    start([zercherHold], { [zercherHold.id]: "2 × 20 s" });
    expect(within(card()).getByLabelText(/^Weight/)).toBeTruthy();
    expect(within(card()).queryByLabelText("Reps")).toBeNull();
    expect(direction()).toBeNull();
    type(/^Weight/, "60");
    type(/^Seconds/, "20");
    log();
    log();
    const sets = stored()[0].exercises[0].sets;
    expect(sets.map((set) => [set.weight, set.holdSeconds, set.reps])).toEqual([["60", "20", ""], ["60", "20", ""]]);
    expect(sets.reduce((total, set) => total + Number(set.holdSeconds), 0)).toBe(40);
    expect(sets.every((set) => !set.reps)).toBe(true);
    expect(sessionRecap(stored()[0], "kg").exercises[0].sets.map((set) => set.line)).toEqual(["60 kg × 20 s", "60 kg × 20 s"]);
  });
});

describe("plate-loaded presses and the Setup disclosure (T13, T14)", () => {
  it("labels the box Plates per arm, keeps Setup closed and optional, and records the machine and seat with the exercise", () => {
    start([plateIncline], { [plateIncline.id]: "3 × 8" });
    expect(within(card()).getByLabelText(/^Plates per arm/)).toBeTruthy();
    const setup = card().querySelector("details.live-set-setup") as HTMLDetailsElement;
    expect(setup.open).toBe(false);
    expect(setup.querySelector("summary")!.textContent).toContain("Optional · not recorded");
    // Logging never waits for the setup.
    type(/^Plates per arm/, "40");
    type("Reps", "8");
    expect(logButton().disabled).toBe(false);
    fireEvent.click(setup.querySelector("summary")!);
    expect(within(setup).getByText(/Load counted as/).textContent).toContain("Plates per arm");
    fireEvent.change(within(setup).getByLabelText("Machine"), { target: { value: "Hammer Strength" } });
    fireEvent.change(within(setup).getByLabelText("Seat or bench"), { target: { value: "4" } });
    log();
    expect(stored()[0].exercises[0].setup).toEqual({ machine_model: "Hammer Strength", seat_or_bench_setting: "4" });
    expect(stored()[0].exercises[0].sets[0]).toMatchObject({ weight: "40", reps: "8" });
    const recap = sessionRecap(stored()[0], "kg").exercises[0];
    expect(recap.sets[0].line).toBe("40 kg per arm × 8");
    expect(recap.setup).toBe("Plates per arm · Machine: Hammer Strength · Seat or bench: 4");
  });

  it("keeps 40 kg left and 50 kg right as two loads, never 90 kg, and starts the next set with its arms apart (T13)", () => {
    start([plateIncline], { [plateIncline.id]: "2 × 8" });
    fireEvent.click(within(card()).getByRole("button", { name: "Arms loaded differently" }));
    expect(within(card()).queryByLabelText(/^Plates per arm/)).toBeNull();
    // Both arms start empty: never one number copied to the other.
    expect((within(card()).getByLabelText(/^Left arm/) as HTMLInputElement).value).toBe("");
    type(/^Left arm/, "40");
    type(/^Right arm/, "50");
    type("Reps", "8");
    log();
    const [first, second] = stored()[0].exercises[0].sets;
    expect(first).toMatchObject({ leftLoad: "40", rightLoad: "50", weight: "", reps: "8", unit: "kg", completed: true });
    expect(JSON.stringify(first)).not.toContain("90");
    // The next set opens with the arms apart, offering the last set's plates.
    expect(second).toMatchObject({ leftLoad: "", rightLoad: "" });
    expect((within(card()).getByLabelText(/^Left arm/) as HTMLInputElement).value).toBe("40");
    expect(within(card()).getByRole("button", { name: "Arms loaded differently" }).getAttribute("aria-pressed")).toBe("true");
    expect(card().querySelector(".live-set-last")!.textContent).toBe("Last set: Left 40 kg · Right 50 kg × 8");
    expect(sessionRecap(stored()[0], "kg").exercises[0].sets[0].line).toBe("Left 40 kg · Right 50 kg × 8");
  });

  it("offers last time's setup only when asked, and a later workout keeps its own", () => {
    const earlier: DeviceWorkoutSession = {
      id: "earlier", title: "Push", dayLabel: "Week 1 · Day 01 · Neck", startedAt: "2026-10-20T10:00:00.000Z", completedAt: "2026-10-20T11:00:00.000Z", status: "completed", weightUnit: "kg",
      exercises: [{ id: "e1", exerciseName: plateIncline.name, catalogId: plateIncline.id, plannedPrescription: "3 × 8", setup: { machine_model: "Hammer Strength", seat_or_bench_setting: "4" }, sets: [{ weight: "40", reps: "8", unit: "kg", completed: true }] }],
    };
    window.localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify([earlier]));
    start([plateIncline], { [plateIncline.id]: "3 × 8" });
    // Nothing is carried on its own.
    expect(stored().find((session) => session.status === "active")!.exercises[0].setup).toBeUndefined();
    const setup = card().querySelector("details.live-set-setup") as HTMLDetailsElement;
    fireEvent.click(setup.querySelector("summary")!);
    fireEvent.click(within(setup).getByRole("button", { name: /Same as last time/ }));
    expect(stored().find((session) => session.status === "active")!.exercises[0].setup).toEqual({ machine_model: "Hammer Strength", seat_or_bench_setting: "4" });
    expect(within(setup).queryByRole("button", { name: /Same as last time/ })).toBeNull();
  });
});

describe("a Smith machine's load basis (T15)", () => {
  it("logs 40 kg of plates as plates only, said explicitly, with no bar added", () => {
    start([smithDecline], { [smithDecline.id]: "3 × 5" });
    expect(within(card()).getByLabelText(/^Plates only/)).toBeTruthy();
    type(/^Plates only/, "40");
    type("Reps", "5");
    log();
    const exercise = stored()[0].exercises[0];
    expect(exercise.setup).toEqual({ load_convention: "plates_only" });
    expect(exercise.sets[0]).toMatchObject({ weight: "40", reps: "5" });
    expect(sessionRecap(stored()[0], "kg").exercises[0].sets[0].line).toBe("40 kg × 5");
    expect(sessionRecap(stored()[0], "kg").exercises[0].setup).toContain("Plates only");
  });

  it("relabels the box when the athlete says the number includes a bar they know", () => {
    start([smithDecline], { [smithDecline.id]: "3 × 5" });
    const setup = card().querySelector("details.live-set-setup") as HTMLDetailsElement;
    fireEvent.click(setup.querySelector("summary")!);
    const basis = within(setup).getByRole("group", { name: /Load counted as/ });
    expect(pressed(basis)).toEqual(["Plates only"]);
    fireEvent.click(within(basis).getByRole("button", { name: "Plates + bar" }));
    expect(within(card()).getByLabelText(/^Plates \+ bar/)).toBeTruthy();
    type(/^Plates \+ bar/, "55");
    type("Reps", "5");
    log();
    expect(stored()[0].exercises[0]).toMatchObject({ setup: { load_convention: "total_known_bar" } });
    expect(stored()[0].exercises[0].sets[0].weight).toBe("55");
  });
});

describe("a paused bench set and a block pull's height (T17, T04)", () => {
  it("logs 5 reps with a 2 s pause as one set with the pause in its setup", () => {
    start([pausedBench], { [pausedBench.id]: "1 × 5" });
    const setup = card().querySelector("details.live-set-setup") as HTMLDetailsElement;
    fireEvent.click(setup.querySelector("summary")!);
    fireEvent.change(within(setup).getByLabelText(/^Pause/), { target: { value: "2" } });
    type(/^Weight/, "100");
    type("Reps", "5");
    log();
    const exercise = stored()[0].exercises[0];
    expect(exercise.sets.filter((set) => set.completed)).toHaveLength(1);
    expect(exercise.sets[0]).toMatchObject({ weight: "100", reps: "5" });
    expect(exercise.sets[0].holdSeconds).toBeUndefined();
    expect(exercise.setup).toEqual({ pause_seconds: "2" });
    const recap = sessionRecap(stored()[0], "kg").exercises[0];
    expect([recap.completed, recap.sets[0].line, recap.setup]).toEqual([1, "100 kg × 5", "Pause 2 s"]);
  });

  it("keeps a block's start height as typed, digits only, in the setup", () => {
    start([blockPull], { [blockPull.id]: "3 × 5" });
    const setup = card().querySelector("details.live-set-setup") as HTMLDetailsElement;
    fireEvent.click(setup.querySelector("summary")!);
    fireEvent.change(within(setup).getByLabelText(/^Start height/), { target: { value: "45cm" } });
    expect(stored()[0].exercises[0].setup).toEqual({ start_height_cm: "45" });
    expect(setup.querySelector("summary")!.textContent).toContain("Start height 45 cm");
  });
});

describe("a drop set on the selectorized decline press (T19)", () => {
  it("is one set with three stages, each a machine load and reps", () => {
    start([selectorizedDecline], { [selectorizedDecline.id]: "1 × 8" });
    fireEvent.click(within(within(card()).getByRole("group", { name: "Set type" })).getByRole("button", { name: /Drop set/ }));
    for (const [load, reps] of [["80", "8"], ["60", "6"], ["40", "10"]]) {
      type(/^Machine load/, load);
      type("Reps", reps);
      fireEvent.click(within(card()).getByRole("button", { name: /Add drop/ }));
    }
    fireEvent.click(screen.getByRole("button", { name: /Finish drop set/ }));
    const sets = stored()[0].exercises[0].sets;
    expect(sets).toHaveLength(1);
    expect(sets[0]).toMatchObject({ type: "drop", completed: true, weight: "80", reps: "8" });
    expect(sets[0].stages!.map((stage) => [stage.weight, stage.reps])).toEqual([["80", "8"], ["60", "6"], ["40", "10"]]);
    const recap = sessionRecap(stored()[0], "kg").exercises[0];
    expect(recap.completed).toBe(1);
    expect(recap.sets[0].line).toBe("Drop set · 80 kg × 8 → 60 kg × 6 → 40 kg × 10");
  });
});

describe("a swap from a timed manual hold to a dynamic machine row (T12)", () => {
  it("keeps the done hold in seconds with its direction, and gives the machine row reps, no direction and no setup", () => {
    start([manualSideBend], { [manualSideBend.id]: "3 × 20 s" });
    fireEvent.click(within(direction()!).getByRole("button", { name: "Right" }));
    type(/^Seconds/, "20");
    log();
    // The second set already has a direction chosen on it when the swap comes.
    fireEvent.click(within(direction()!).getByRole("button", { name: "Left" }));
    expect(stored()[0].exercises[0].sets[1].headDirection).toBe("left");
    fireEvent.click(within(card()).getByRole("button", { name: "Swap exercise" }));
    const sheet = screen.getByRole("dialog", { name: /^Replace / });
    fireEvent.change(within(sheet).getByRole("searchbox"), { target: { value: machineExtension.name } });
    fireEvent.click(within(sheet).getAllByRole("button", { name: new RegExp(`^${machineExtension.name}`) })[0]);
    fireEvent.click(within(sheet).getByRole("button", { name: `Use ${machineExtension.name}` }));
    const [original, replacement] = stored()[0].exercises;
    expect(original.catalogId).toBe(manualSideBend.id);
    expect(original.sets.filter((set) => set.completed).map((set) => [set.holdSeconds, set.reps, set.headDirection])).toEqual([["20", "", "right"]]);
    expect(replacement.catalogId).toBe(machineExtension.id);
    expect(replacement.setup).toBeUndefined();
    expect(replacement.sets.every((set) => !set.holdSeconds && !set.headDirection && !set.reps)).toBe(true);
    // The card now asks for reps and a machine load, and no direction.
    expect(within(card()).getByLabelText("Reps")).toBeTruthy();
    expect(within(card()).queryByLabelText(/^Seconds/)).toBeNull();
    expect(direction()).toBeNull();
  });
});

describe("a reload mid-workout and a finished workout read back (T20)", () => {
  it("resumes with the direction, the setup and the per-arm loads exactly as typed, and finishes with the same values", () => {
    start([plateIncline, manualSideBend], { [plateIncline.id]: "2 × 8", [manualSideBend.id]: "1 × 20 s" });
    const setup = card().querySelector("details.live-set-setup") as HTMLDetailsElement;
    fireEvent.click(setup.querySelector("summary")!);
    fireEvent.change(within(setup).getByLabelText("Machine"), { target: { value: "Plate Incline 2" } });
    fireEvent.click(within(card()).getByRole("button", { name: "Arms loaded differently" }));
    type(/^Left arm/, "40");
    type(/^Right arm/, "50");
    type("Reps", "8");
    log();
    cleanup();
    // The reload: the same storage, a fresh tracker.
    render(createElement(DeviceWorkoutTracker, { workout: [plateIncline, manualSideBend], prescriptions: {}, settings: {}, goal: "Max strength", dayLabel: "Week 1 · Day 01 · Neck", weightUnit: "kg" }));
    expect((within(card()).getByLabelText(/^Left arm/) as HTMLInputElement).value).toBe("40");
    fireEvent.change(within(card()).getByLabelText("Reps"), { target: { value: "7" } });
    log();
    fireEvent.click(within(direction()!).getByRole("button", { name: "Left" }));
    type(/^Seconds/, "20");
    log();
    fireEvent.click(screen.getByRole("button", { name: /Finish workout · add/ }));
    const [session] = loadDeviceWorkoutSessions();
    expect(session.status).toBe("completed");
    const [press, hold] = session.exercises;
    expect(press.setup).toEqual({ machine_model: "Plate Incline 2" });
    expect(press.sets.map((set) => [set.leftLoad, set.rightLoad, set.weight, set.reps])).toEqual([["40", "50", "", "8"], ["40", "50", "", "7"]]);
    expect(hold.sets.map((set) => [set.headDirection, set.holdSeconds])).toEqual([["left", "20"]]);
    // A second save of the same record changes nothing and adds no set.
    const before = window.localStorage.getItem(deviceWorkoutHistoryKey);
    window.localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify(loadDeviceWorkoutSessions()));
    expect(loadDeviceWorkoutSessions()).toEqual(JSON.parse(before!));
  });
});
