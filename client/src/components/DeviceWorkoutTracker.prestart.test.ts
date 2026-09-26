// @vitest-environment jsdom
import React, { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DeviceWorkoutTracker } from "./DeviceWorkoutTracker";
import { deviceWorkoutHistoryKey, loadDeviceWorkoutSessions } from "@/lib/deviceWorkoutLog";
import { exercises } from "@/lib/exerciseCatalog";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const workout = [exercises[0], exercises[1], exercises[2]];
// 3 + 4 + 2: the per-set form counts by the sets written, not the leading number.
const prescriptions = { [exercises[0].id]: "3 × 8", [exercises[1].id]: "4 × 10/8/6/6", [exercises[2].id]: "2 × 12" };

type Props = Parameters<typeof DeviceWorkoutTracker>[0];

function mount(over: Partial<Props> = {}) {
  return render(createElement(DeviceWorkoutTracker, {
    workout, prescriptions, settings: {}, goal: "Athleticism", dayLabel: "Week 2 · Day 02 · Pull", onInspect: () => undefined, ...over,
  }));
}

const startButton = () => screen.getByRole("button", { name: /start workout/i }) as HTMLButtonElement;
const restClock = () => document.querySelector(".session-prestart-stepper b")!.textContent;

beforeEach(() => { window.localStorage.clear(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

/**
 * Handoff 08. Before a session starts, this screen states the day, its place in
 * the plan, its size, and one action; then the prescription as rows to read.
 * It is not the Plan editor and it is not the live tracker.
 */
describe("Session, before it starts", () => {
  it("names the day, its place in the plan and its size, once", () => {
    mount();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Pull");
    expect(document.querySelector(".session-prestart-position")!.textContent).toBe("Week 2 · Day 02");
    // The same set reader the Plan writes with: a "4 × 10/8/6/6" is four sets.
    expect(document.querySelector(".session-prestart-counts")!.textContent).toBe("3 exercises · 9 sets");
  });

  it("keeps a two-part label whole as the day's name and position", () => {
    mount({ dayLabel: "Week 1 · Push" });
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Push");
    expect(document.querySelector(".session-prestart-position")!.textContent).toBe("Week 1");
  });

  it("lists the prescription as rows to read, with no editing or completion controls", () => {
    mount();
    const rows = document.querySelectorAll(".session-prestart-row");
    expect(rows).toHaveLength(3);
    expect(rows[1].textContent).toContain(exercises[1].name);
    expect(rows[1].textContent).toContain("4 × 10/8/6/6");
    // Not the Plan editor: no reorder handles, no fields. Not the tracker: no
    // set to log, nothing marked complete before anything has happened.
    expect(document.querySelector(".day-order-controls")).toBeNull();
    expect(document.querySelector("input")).toBeNull();
    expect(document.querySelector("[aria-pressed]")).toBeNull();
    expect(screen.queryByRole("button", { name: /log set/i })).toBeNull();
    expect(document.querySelector(".live-set-card")).toBeNull();
  });

  it("opens an exercise's own detail from its row", () => {
    const onInspect = vi.fn();
    mount({ onInspect });
    fireEvent.click(document.querySelectorAll("button.session-prestart-row")[2]);
    expect(onInspect).toHaveBeenCalledWith(exercises[2]);
  });

  it("sends editing to Plan rather than editing here", () => {
    const onEditInPlan = vi.fn();
    mount({ onEditInPlan });
    fireEvent.click(screen.getByRole("button", { name: /edit in plan/i }));
    expect(onEditInPlan).toHaveBeenCalledTimes(1);
  });

  it("records nothing for merely being looked at", () => {
    mount();
    expect(window.localStorage.getItem(deviceWorkoutHistoryKey)).toBeNull();
    expect(loadDeviceWorkoutSessions()).toHaveLength(0);
  });

  it("starts one real session for the day shown, and hands over to the live tracker", () => {
    mount();
    const start = startButton();
    fireEvent.click(start);
    fireEvent.click(start);
    const sessions = loadDeviceWorkoutSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].status).toBe("active");
    expect(sessions[0].dayLabel).toBe("Week 2 · Day 02 · Pull");
    expect(sessions[0].exercises.map((exercise) => exercise.exerciseName)).toEqual(workout.map((exercise) => exercise.name));
    expect(sessions[0].exercises.map((exercise) => exercise.sets.length)).toEqual([3, 4, 2]);
    expect(document.querySelector(".session-prestart")).toBeNull();
    expect(document.querySelector(".live-set-card")).toBeTruthy();
  });

  it("resumes a session already on the device instead of offering to start another", () => {
    mount();
    fireEvent.click(startButton());
    cleanup();
    mount();
    expect(document.querySelector(".session-prestart")).toBeNull();
    expect(document.querySelector(".live-set-card")).toBeTruthy();
    expect(loadDeviceWorkoutSessions()).toHaveLength(1);
  });

  it("says the day is empty rather than offering to start it", () => {
    mount({ workout: [], onEditInPlan: () => undefined });
    expect(startButton().disabled).toBe(true);
    expect(document.querySelector(".session-prestart-counts")!.textContent).toBe("Nothing planned for this day yet");
    expect(document.querySelector(".session-prestart-list")).toBeNull();
    expect(screen.getByRole("button", { name: /build it in plan/i })).toBeTruthy();
  });

  it("draws the owner's day chooser under the day, and only before a session starts", () => {
    mount({ daySwitch: createElement("div", { className: "chooser-probe" }) });
    expect(document.querySelector(".session-prestart-hero .chooser-probe")).toBeTruthy();
    fireEvent.click(startButton());
    expect(document.querySelector(".chooser-probe")).toBeNull();
  });

  it("keeps preparation and options behind their own lines, closed", () => {
    mount();
    const details = Array.from(document.querySelectorAll<HTMLDetailsElement>("details.session-prestart-disclosure"));
    expect(details.map((item) => item.querySelector("summary")!.textContent)).toEqual(["Session preparation", "Workout options"]);
    expect(details.every((item) => !item.open)).toBe(true);
    expect(details[0].querySelector(".warmup-panel"), "preparation is the real panel").toBeTruthy();
  });
});

/**
 * The one option a session has before it starts. Plan writes a rest per
 * exercise; the session keeps one rest for the whole workout, so it starts on
 * the plan's usual answer, and on the athlete's if they change it here.
 */
describe("rest between sets", () => {
  const rest = (value: string) => ({ rest: value, notes: "", completed: false });

  it("starts on the rest the plan asks for most often", () => {
    mount({ settings: { [exercises[0].id]: rest("120 sec"), [exercises[1].id]: rest("120 sec"), [exercises[2].id]: rest("60 sec") } });
    expect(restClock()).toBe("2:00");
    fireEvent.click(startButton());
    expect(loadDeviceWorkoutSessions()[0].restSeconds).toBe(120);
  });

  it("falls back to the default when the plan says nothing", () => {
    mount();
    expect(restClock()).toBe("1:30");
    fireEvent.click(startButton());
    expect(loadDeviceWorkoutSessions()[0].restSeconds).toBe(90);
  });

  it("starts on the athlete's change, and says whose number it is", () => {
    mount({ settings: { [exercises[0].id]: rest("2 min") } });
    expect(restClock()).toBe("2:00");
    expect(document.querySelector(".session-prestart-option small")!.textContent).toContain("From your plan");
    fireEvent.click(screen.getByRole("button", { name: /longer rest/i }));
    fireEvent.click(screen.getByRole("button", { name: /longer rest/i }));
    fireEvent.click(screen.getByRole("button", { name: /shorter rest/i }));
    expect(restClock()).toBe("2:15");
    expect(document.querySelector(".session-prestart-option small")!.textContent).toContain("Set for this session");
    fireEvent.click(startButton());
    expect(loadDeviceWorkoutSessions()[0].restSeconds).toBe(135);
  });

  it("cannot be stepped below one step", () => {
    mount({ settings: { [exercises[0].id]: rest("15 sec") } });
    fireEvent.click(screen.getByRole("button", { name: /shorter rest/i }));
    expect(restClock()).toBe("0:15");
  });
});
