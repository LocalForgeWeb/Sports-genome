// @vitest-environment jsdom
import React, { createElement } from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deviceWorkoutHistoryKey, type DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { exercises } from "@/lib/exerciseCatalog";

vi.mock("sonner", () => {
  const record = () => undefined;
  return { toast: Object.assign(record, { success: record, error: record }), Toaster: () => null };
});

/**
 * The atlas's variant data, injected through the logger's light region list (the logger never
 * reads the full registry). Here a dead hang and a farmer hold are measured in seconds; a hammer
 * curl may be done with one arm or two; a single-arm cable row is one arm at a time; the hold and
 * the row carry a grip mapping that a strapped set does not earn. The bench press is not mapped
 * at all.
 */
vi.mock("@shared/specialization/loggingRegions", () => {
  const variant = (catalogExerciseId: number, catalogName: string, measure: string, laterality: string, deliberateHold: boolean) => ({
    id: `cat-${catalogExerciseId}`, catalogExerciseId, catalogName, organization: "task", forearmOrientation: "neutral", wristPosition: "neutral",
    gripType: "neutral", straps: "unknown", laterality, phase: "unspecified", measure, deliberateHold, elbowAngleDeg: null, notes: null,
  });
  const grip = (variantId: string) => ({
    id: `${variantId}-grip`, versionKey: "test", variantId, nodeId: "forearm.fds", actionId: "fingers.pip_flexion", relationship: "direct",
    muscleMode: "isometric", evidenceBasis: "inference", allocation: "shared", requiresNoStraps: true, rationale: "test", reviewStatus: "reviewed", sources: [],
  });
  const region = {
    region: { id: "forearm", label: "Forearms", heading: "Forearm specialization", sortOrder: 10, status: "production" },
    variants: [
      variant(143, "Dead Hang", "seconds", "bilateral", true),
      variant(145, "Farmer Hold", "seconds", "either", true),
      variant(132, "Hammer Curl", "reps", "either", false),
      variant(56, "Single-Arm Cable Row", "reps", "unilateral", false),
      variant(142, "Plate Pinch", "seconds", "unilateral", true),
    ],
    mappings: [grip("cat-145"), grip("cat-56")],
  };
  return { specializationLoggingRegions: [region] };
});

import { DeviceWorkoutTracker } from "./DeviceWorkoutTracker";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const byId = (id: number) => exercises.find((exercise) => exercise.id === id)!;
const deadHang = byId(143);
const farmerHold = byId(145);
const hammerCurl = byId(132);
const cableRow = byId(56);
const bench = exercises.find((exercise) => exercise.name === "Barbell Bench Press")!;

const stored = (): DeviceWorkoutSession[] => JSON.parse(window.localStorage.getItem(deviceWorkoutHistoryKey) || "[]");
const card = () => document.querySelector(".live-set-card") as HTMLElement;
const type = (label: RegExp | string, value: string) => fireEvent.change(within(card()).getByLabelText(label), { target: { value } });
const log = () => fireEvent.click(within(card()).getByRole("button", { name: /^Log set/ }));
const arm = () => within(card()).queryByRole("group", { name: /^Arm for set/ });
const pressed = (group: HTMLElement) => within(group).getAllByRole("button").filter((button) => button.getAttribute("aria-pressed") === "true").map((button) => button.textContent);

function start(workout: typeof exercises, options: { prescription?: string; askStraps?: boolean } = {}) {
  const prescriptions = Object.fromEntries(workout.map((exercise) => [exercise.id, options.prescription ?? "3 × 30"]));
  render(createElement(DeviceWorkoutTracker, { workout, prescriptions, settings: {}, goal: "Athleticism", dayLabel: "Week 1 · Day 01 · Pull", weightUnit: "lb", askStraps: options.askStraps }));
  fireEvent.click(screen.getByRole("button", { name: /start workout/i }));
}

beforeEach(() => window.localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("A hold is logged in seconds, not reps", () => {
  it("shows a Seconds box in place of Reps, reads the target as seconds, and logs seconds with no reps", () => {
    start([deadHang, bench]);
    expect(within(card()).queryByLabelText("Reps")).toBeNull();
    expect(within(card()).getByLabelText(/^Seconds/)).toBeTruthy();
    // A bodyweight hang keeps its optional added-weight box.
    expect(within(card()).getByLabelText(/^Added weight/)).toBeTruthy();
    expect(card().querySelector(".live-set-prescription")!.textContent).toContain("30 sec");
    // No drop sets on a hold: there are no reps to drop.
    expect(within(card()).queryByRole("group", { name: "Set type" })).toBeNull();

    type(/^Seconds/, "35");
    log();
    const set = stored()[0].exercises[0].sets[0];
    expect(set).toMatchObject({ holdSeconds: "35", reps: "", completed: true });
  });

  it("carries the seconds to the next set and logs it from the keyboard's Done", () => {
    start([deadHang]);
    type(/^Seconds/, "40");
    log();
    const seconds = within(card()).getByLabelText(/^Seconds/) as HTMLInputElement;
    expect(seconds.value).toBe("40");
    expect(seconds.hasAttribute("data-carried")).toBe(true);
    expect(seconds.getAttribute("enterkeyhint")).toBe("done");
    expect(card().querySelector(".live-set-last")!.textContent).toBe("Last set: 40 sec");
    fireEvent.keyDown(seconds, { key: "Enter" });
    expect(stored()[0].exercises[0].sets[1]).toMatchObject({ holdSeconds: "40", reps: "", completed: true });
  });

  it("moves from the load box to Seconds with Next, and logs a weighted hold", () => {
    start([farmerHold]);
    const load = within(card()).getByLabelText(/^Weight/) as HTMLInputElement;
    expect(load.getAttribute("enterkeyhint")).toBe("next");
    type(/^Weight/, "70");
    fireEvent.keyDown(load, { key: "Enter" });
    expect(document.activeElement).toBe(within(card()).getByLabelText(/^Seconds/));
    type(/^Seconds/, "45");
    log();
    expect(stored()[0].exercises[0].sets[0]).toMatchObject({ weight: "70", unit: "lb", holdSeconds: "45", reps: "" });
  });

  it("shows a hold logged in reps before it was measured in seconds as reps, never as seconds", () => {
    const earlier: DeviceWorkoutSession = {
      id: "old", title: "Pull workout", dayLabel: "Week 1 · Day 01 · Pull", startedAt: "2026-10-01T10:00:00.000Z", completedAt: "2026-10-01T10:40:00.000Z", status: "completed", weightUnit: "lb",
      exercises: [{ id: "old-carry", exerciseName: farmerHold.name, catalogId: farmerHold.id, plannedPrescription: "1 × 40", sets: [{ weight: "70", reps: "40", unit: "lb", completed: true }] }],
    };
    window.localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify([earlier]));
    start([farmerHold]);
    expect(card().querySelector(".live-set-last")!.textContent).toBe("Last logged: 70 lb · 40 reps");
    expect((within(card()).getByLabelText(/^Seconds/) as HTMLInputElement).value).toBe("");
  });

  it("leaves an unmapped exercise exactly as it was: Reps, and drop sets on offer", () => {
    start([bench]);
    expect(within(card()).getByLabelText("Reps")).toBeTruthy();
    expect(within(card()).queryByLabelText(/^Seconds/)).toBeNull();
    expect(within(card()).getByRole("group", { name: "Set type" })).toBeTruthy();
    expect(arm()).toBeNull();
    expect(within(card()).queryByRole("group", { name: /^Straps/ })).toBeNull();
  });

  it("takes seconds in the full workout list for a hold, and reps for everything else", () => {
    start([deadHang, bench]);
    fireEvent.click(screen.getByText("Full workout"));
    const rows = Array.from(document.querySelectorAll(".session-exercise"));
    expect(rows[0].textContent).toContain("Seconds");
    expect(rows[0].textContent).not.toContain("Reps");
    expect(rows[1].textContent).toContain("Reps");
    expect(rows[0].querySelector(".session-set-to-drop")).toBeNull();
  });
});

describe("Swapping a hold", () => {
  const pullUp = byId(66);
  const swapTo = (query: string, name: string) => {
    fireEvent.click(within(card()).getByRole("button", { name: "Swap exercise" }));
    const dialog = screen.getByRole("dialog", { name: /^Replace / });
    fireEvent.change(within(dialog).getByRole("searchbox"), { target: { value: query } });
    fireEvent.click(within(dialog).getAllByRole("button", { name: new RegExp(`^${name}`) })[0]);
    return dialog;
  };

  it("hands typed seconds to another hold, as seconds", () => {
    start([deadHang, bench]);
    type(/^Seconds/, "35");
    const dialog = swapTo("farmer hold", "Farmer Hold");
    fireEvent.click(within(dialog).getByRole("radio", { name: /Use the seconds for Farmer Hold/ }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Use Farmer Hold" }));
    expect((within(card()).getByLabelText(/^Seconds/) as HTMLInputElement).value).toBe("35");
    expect((within(card()).getByLabelText(/^Weight/) as HTMLInputElement).value).toBe("");
  });

  it("says a rep exercise is logged in reps, and does not offer to turn typed seconds into reps", () => {
    start([deadHang, bench]);
    type(/^Seconds/, "35");
    const dialog = swapTo("pull-up", pullUp.name);
    expect(dialog.textContent).toContain(`${pullUp.name} is logged in reps, not seconds.`);
    expect(within(dialog).queryByRole("radio", { name: /^Use the (reps|seconds)/ })).toBeNull();
    expect((within(dialog).getByRole("radio", { name: /^Keep it with Dead Hang/ }) as HTMLInputElement).checked).toBe(true);
  });
});

describe("No arm is asked: both arms are counted as one (owner, 20 Oct 2026)", () => {
  it.each([["a one-arm exercise", () => cableRow], ["an either-arm exercise", () => hammerCurl], ["a two-handed hold", () => deadHang], ["an unmapped lift", () => bench]])("asks no arm on %s", (_name, exercise) => {
    start([exercise()]);
    expect(arm()).toBeNull();
  });

  it("logs a set with no arm, rather than guessing one", () => {
    start([cableRow]);
    log();
    expect(stored()[0].exercises[0].sets[0]).not.toHaveProperty("side");
  });

  it("gives each straps choice a 44 px target, visible at rest", () => {
    // jsdom does not lay out, so the rule is read from the stylesheet the controls use.
    const css = readFileSync(resolve(process.cwd(), "client/src/set-side.css"), "utf8");
    const selector = ".live-set-straps button";
    const rule = css.slice(css.indexOf(`${selector} {`), css.indexOf("}", css.indexOf(`${selector} {`)));
    expect(rule, selector).toContain("min-height: 2.75rem");
    expect(rule, `${selector} has a border at rest`).toMatch(/border: 1px solid/);
    expect(css).not.toMatch(/:hover/);
  });
});

describe("Straps, only for a forearm goal and a grip that needs a bare hand", () => {
  it("is not asked without a forearm goal, even where it would matter", () => {
    start([cableRow]);
    expect(within(card()).queryByRole("group", { name: /^Straps/ })).toBeNull();
  });

  it("is not asked of an exercise whose credit does not depend on straps", () => {
    start([hammerCurl], { askStraps: true });
    expect(within(card()).queryByRole("group", { name: /^Straps/ })).toBeNull();
  });

  it("records Used or Not used on the exercise, and a second tap takes it back to not recorded", () => {
    start([cableRow], { askStraps: true });
    const group = within(card()).getByRole("group", { name: "Straps on Single-Arm Cable Row" });
    expect(pressed(group)).toEqual([]);
    fireEvent.click(within(group).getByRole("button", { name: "Used" }));
    expect(stored()[0].exercises[0].straps).toBe("yes");
    fireEvent.click(within(card()).getByRole("button", { name: "Used" }));
    expect(stored()[0].exercises[0]).not.toHaveProperty("straps");
    fireEvent.click(within(card()).getByRole("button", { name: "Not used" }));
    expect(stored()[0].exercises[0].straps).toBe("no");
  });
});

describe("Set ids", () => {
  it("gives every new set an id when the workout starts, and keeps it when the set is logged", () => {
    start([bench, deadHang]);
    const ids = stored()[0].exercises.flatMap((exercise) => exercise.sets.map((set) => set.id));
    expect(ids.every((id) => typeof id === "string" && id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
    type(/^Weight/, "185"); type("Reps", "5");
    log();
    expect(stored()[0].exercises[0].sets[0]).toMatchObject({ id: ids[0], completed: true });
  });
});

describe("The saved workout shows what was recorded", () => {
  it("shows the hold in seconds and the straps", () => {
    start([farmerHold], { prescription: "1 × 40", askStraps: true });
    expect(arm()).toBeNull();
    fireEvent.click(within(card()).getByRole("button", { name: "Used" }));
    type(/^Weight/, "70");
    type(/^Seconds/, "40");
    log();
    expect(document.querySelector(".live-done-summary")!.textContent).toContain("70 lb × 40 s");
    expect(document.querySelector(".live-done-summary")!.textContent).not.toMatch(/Left|Right/);
    fireEvent.click(screen.getByRole("button", { name: /^Finish workout/ }));
    const saved = document.querySelector("[data-session-detail]") as HTMLElement;
    expect(within(saved).getByRole("heading", { name: "Workout saved" })).toBeTruthy();
    expect(saved.textContent).toContain("70 lb × 40 s");
    expect(saved.textContent).toContain("Straps used");
    expect(saved.textContent).not.toMatch(/NaN|reps/);
    expect(stored()[0]).toMatchObject({ status: "completed", exercises: [{ straps: "yes", sets: [{ holdSeconds: "40", reps: "" }] }] });
    expect(stored()[0].exercises[0].sets[0]).not.toHaveProperty("side");
  });
});

describe("A workout left open across the release", () => {
  it("reads a hold's pinned rep default as seconds, and does not call reps typed before a draft", async () => {
    const { getGoalPrescription } = await import("@/lib/workoutPlanner");
    // Built before holds were measured in seconds: the goal's rep default pinned on Dead Hang,
    // set 1 logged in reps, set 2 with reps typed but not logged.
    const pinned = getGoalPrescription("Athleticism", 0);
    const legacy: DeviceWorkoutSession = {
      id: "device-legacy", title: "Pull", dayLabel: "Week 1 · Day 01 · Pull", startedAt: new Date().toISOString(), status: "active",
      exercises: [{ id: "hang", exerciseName: deadHang.name, catalogId: deadHang.id, plannedPrescription: pinned, sets: [
        { weight: "", reps: "40", completed: true },
        { weight: "", reps: "35", completed: false },
        { weight: "", reps: "", completed: false },
      ] }],
    } as DeviceWorkoutSession;
    window.localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify([legacy]));
    render(createElement(DeviceWorkoutTracker, { workout: [deadHang], prescriptions: {}, settings: {}, goal: "Athleticism", dayLabel: "Week 1 · Day 01 · Pull", weightUnit: "lb" }));
    // The card reads the target as a new session would: "30 sec", never the rep range with "sec" on it.
    const target = card().querySelector(".live-set-prescription")!.textContent!;
    expect(target).toContain("30 sec");
    expect(target).not.toMatch(/\d+[–-]\d+ sec/);
    // The full list says the same, and the reps typed into set 2 (no Reps box on a hold) are not a draft.
    fireEvent.click(document.querySelector(".live-session-queue > summary")!);
    const list = document.querySelector(".session-exercise-list")!;
    expect(list.textContent).toContain("× 30 sec");
    expect(list.textContent).not.toContain("typed, not logged");
    // Nothing stored was rewritten.
    expect(stored()[0].exercises[0]).toMatchObject({ plannedPrescription: pinned, sets: [{ reps: "40" }, { reps: "35" }, { reps: "" }] });
  });
});
