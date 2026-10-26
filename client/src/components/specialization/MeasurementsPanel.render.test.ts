// @vitest-environment jsdom
import React, { createElement, useState } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MeasurementsPanel, type MeasurementsPanelProps } from "./MeasurementsPanel";
import type { DeviceSetLog } from "@/lib/deviceWorkoutLog";
import { exercises } from "@/lib/exerciseCatalog";
import type { StoreWrite } from "@/lib/specialization/stores";
import { forearmRegionData } from "@shared/specialization/regions/forearm";
import type { SpecializationMeasurement } from "@shared/specialization/types";
import { deltoidRegionData } from "@/lib/specialization/__fixtures__/deltoidRegion";

/**
 * The Progress disclosure, rendered (brief §10, design §5): a backdated reading keeps the date
 * and time it was taken, the charts draw only their eight weeks, an lb profile types inches and
 * lb and stores cm and newtons, and exercise performance compares one exercise, by catalog id,
 * one top set per session. Both arms are one (owner, 20 Oct 2026): the panel reads the page's
 * summary of both, a reading and a set have no arm, and nothing asks which arm or names one.
 */

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const NEWTONS_PER_KGF = 9.80665;
const KG_PER_LB = 0.45359237;
const historyKey = "sports-genome-device-workout-history-v1";

const reading = (id: string, measuredAt: string, value: number, extra: Partial<SpecializationMeasurement> = {}): SpecializationMeasurement => ({
  id, regionId: "forearm", side: "right", measuredAt, metric: "circumference_cm", value,
  protocol: { landmark: "Thickest point", distanceFromLandmarkCm: null, posture: "arm_relaxed_hanging", condition: "unpumped", device: null, timeOfDay: measuredAt.slice(11, 16) },
  notes: null, ...extra,
});

let saved: SpecializationMeasurement[] = [];
let opened: string[] = [];
let methodOpened = 0;
let setFromOutside: ((props: Partial<MeasurementsPanelProps>) => void) | null = null;

function Harness(props: Partial<MeasurementsPanelProps> & { initial?: SpecializationMeasurement[] }) {
  const [entries, setEntries] = useState<SpecializationMeasurement[]>(props.initial ?? []);
  const [overrides, setOverrides] = useState<Partial<MeasurementsPanelProps>>({});
  setFromOutside = setOverrides;
  const onSave = (entry: SpecializationMeasurement): StoreWrite => {
    saved.push(entry);
    setEntries((list) => [...list.filter((item) => item.id !== entry.id), entry]);
    return { ok: true };
  };
  const onRemove = (id: string): StoreWrite => {
    setEntries((list) => list.filter((item) => item.id !== id));
    return { ok: true };
  };
  return createElement(MeasurementsPanel, {
    data: forearmRegionData,
    side: "both",
    catalog: exercises,
    weightUnit: "kg",
    timeZone: "UTC",
    todayKey: "2026-10-16",
    measurements: entries,
    onSave,
    onRemove,
    onOpenSession: (id: string) => { opened.push(id); },
    onInspectExercise: () => {},
    onOpenMethod: () => { methodOpened += 1; },
    ...props,
    ...overrides,
  });
}

const set = (weight: number | "", reps: number | "", extra: Partial<DeviceSetLog> = {}): DeviceSetLog => ({ weight: String(weight), reps: String(reps), unit: "lb", completed: true, ...extra });
const workout = (id: string, day: string, list: unknown[], status = "completed") => ({ id, title: "Pull", dayLabel: "Pull", startedAt: `${day}T17:00:00.000Z`, completedAt: `${day}T18:00:00.000Z`, status, weightUnit: "lb", exercises: list });
const logged = (id: string, name: string, catalogId: number | undefined, sets: DeviceSetLog[]) => ({ id, exerciseName: name, ...(catalogId !== undefined ? { catalogId } : {}), plannedPrescription: "3 × 10", sets });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-16T12:00:00.000Z"));
  window.localStorage.clear();
  saved = [];
  opened = [];
  methodOpened = 0;
  setFromOutside = null;
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

const field = (name: RegExp) => screen.getByLabelText(name) as HTMLInputElement;
const type = async (name: RegExp, value: string) => { await act(async () => { fireEvent.change(field(name), { target: { value } }); }); };
const click = async (name: RegExp | string, scope: HTMLElement = document.body) => { await act(async () => { fireEvent.click(within(scope).getByRole("button", { name })); }); };
const figure = (caption: RegExp) => screen.getAllByRole("figure").find((item) => caption.test(item.querySelector("figcaption")?.textContent ?? ""))!;

describe("a new reading", () => {
  it("defaults to now today, asks for the time of an earlier day, and stores the chosen date and time", async () => {
    render(createElement(Harness));
    await click("Add a reading");
    expect(field(/^Date$/).value).toBe("2026-10-16");
    expect(field(/^Time$/).value).toBe("12:00");
    expect(field(/^Time$/).type).toBe("time");

    await type(/^Circumference \(cm\)$/, "31.5");
    await type(/^Date$/, "2026-10-10");
    // Now's time would be a guess for another day: the field empties and is asked for.
    expect(field(/^Time$/).value).toBe("");
    await click("Save reading");
    expect(screen.getByRole("alert").textContent).toMatch(/Enter the time it was measured/);
    expect(saved).toHaveLength(0);

    await type(/^Time$/, "07:30");
    await click("Save reading");
    expect(saved).toHaveLength(1);
    expect(saved[0].measuredAt).toBe("2026-10-10T07:30:00.000Z");
    expect(saved[0].protocol.timeOfDay).toBe("07:30");
    expect(saved[0].value).toBe(31.5);
    expect(screen.getByRole("status").textContent).toBe("Saved 31.5 cm around, 10 Oct at 07:30.");
    // Stored on the one side a stored reading names, as main stores it; no arm was asked.
    expect(saved[0].side).toBe("right");
    expect(screen.queryByRole("group", { name: "Which arm" })).toBeNull();
  });

  it("builds the instant in the page's zone, not the device's", async () => {
    render(createElement(Harness, { timeZone: "America/New_York" }));
    await click("Add a reading");
    expect(field(/^Time$/).value).toBe("08:00");
    await type(/^Circumference \(cm\)$/, "31");
    await type(/^Date$/, "2026-10-10");
    await type(/^Time$/, "07:30");
    await click("Save reading");
    expect(saved[0].measuredAt).toBe("2026-10-10T11:30:00.000Z");
    expect(saved[0].protocol.timeOfDay).toBe("07:30");
  });

  it("keeps a typed time when the date changes, and refuses a time later than now", async () => {
    render(createElement(Harness));
    await click("Add a reading");
    await type(/^Circumference \(cm\)$/, "31");
    await type(/^Time$/, "18:45");
    await click("Save reading");
    expect(screen.getByRole("alert").textContent).toMatch(/later than now/);
    await type(/^Date$/, "2026-10-12");
    expect(field(/^Time$/).value).toBe("18:45");
    await click("Save reading");
    expect(saved[0].measuredAt).toBe("2026-10-12T18:45:00.000Z");
  });
});

describe("the charts' eight weeks", () => {
  it("does not draw a reading six months old, counts it as not shown, and leaves it out of the scale", async () => {
    render(createElement(Harness, { initial: [
      reading("old", "2026-04-16T07:00:00.000Z", 50),
      reading("a", "2026-10-01T07:00:00.000Z", 30),
      reading("b", "2026-10-14T07:00:00.000Z", 31, { protocol: { ...reading("x", "2026-10-14T07:00:00.000Z", 1).protocol, condition: "pumped" } }),
      reading("future", "2026-12-01T07:00:00.000Z", 29),
    ] }));
    const chart = figure(/^Circumference/);
    expect(chart.querySelectorAll("circle.spz-chart-dot")).toHaveLength(2);
    expect(chart.textContent).toMatch(/Scale 30\.0 to 31\.0 cm · open dots were pumped/);
    expect(chart.textContent).toMatch(/1 older reading is not shown\./);
    expect(chart.textContent).toMatch(/1 reading is dated after this week and not shown\./);
    expect(chart.querySelector("svg")?.getAttribute("aria-label")).toMatch(/^2 circumference readings in these 8 weeks, 30\.0 to 31\.0 cm\./);
  });

  it("draws readings saved earlier on either arm as one series, naming no arm", () => {
    render(createElement(Harness, { initial: [
      reading("l", "2026-10-01T07:00:00.000Z", 30, { side: "left" }),
      reading("r", "2026-10-14T07:00:00.000Z", 31),
    ] }));
    const chart = figure(/^Circumference/);
    expect(chart.querySelectorAll("circle.spz-chart-dot")).toHaveLength(2);
    expect(within(screen.getByRole("list", { name: "Latest readings" })).getAllByRole("listitem")).toHaveLength(2);
    expect(document.body.textContent).not.toMatch(/\b(left|right) arm\b/i);
  });

  it("puts every chart on the same axis: a week sits at the same x in each", async () => {
    window.localStorage.setItem(historyKey, JSON.stringify([
      workout("w1", "2026-10-01", [logged("e", "Hammer Curl", 132, [set(30, 10)])]),
      workout("w2", "2026-10-14", [logged("e", "Hammer Curl", 132, [set(35, 10)])]),
    ]));
    render(createElement(Harness, { initial: [reading("a", "2026-10-01T07:00:00.000Z", 30), reading("b", "2026-10-14T07:00:00.000Z", 31)] }));
    const xs = (caption: RegExp) => Array.from(figure(caption).querySelectorAll("circle.spz-chart-dot")).map((dot) => dot.getAttribute("cx"));
    expect(xs(/^Circumference/)).toEqual(xs(/^Hammer Curl/));
    const ticks = (caption: RegExp) => Array.from(figure(caption).querySelectorAll("g line")).map((line) => line.getAttribute("x1")).join(",");
    expect(ticks(/^Circumference/)).toBe(ticks(/^Sets per week/));
  });
});

describe("units follow the profile", () => {
  it("lets an lb profile type inches and store cm, and see them back in inches", async () => {
    render(createElement(Harness, { weightUnit: "lb" }));
    await click("Add a reading");
    await type(/^Circumference \(in\)$/, "12.5");
    await type(/^Distance from the landmark \(in, optional\)$/, "2");
    await click("Save reading");
    expect(saved[0].metric).toBe("circumference_cm");
    expect(saved[0].value).toBeCloseTo(31.75, 10);
    expect(saved[0].protocol.distanceFromLandmarkCm).toBeCloseTo(5.08, 10);
    const list = screen.getByRole("list", { name: "Latest readings" });
    expect(within(list).getByText("12.5 in around")).not.toBeNull();
    expect(list.textContent).toMatch(/Thickest point, 2 in/);
  });

  it("takes grip in lb on the dynamometer and stores newtons", async () => {
    render(createElement(Harness, { weightUnit: "lb" }));
    await click("Add a reading");
    await click("Grip strength");
    await type(/^Grip \(lb on the dynamometer\)$/, "100");
    await click("Save reading");
    expect(saved[0].metric).toBe("grip_force_n");
    expect(saved[0].value).toBeCloseTo(100 * KG_PER_LB * NEWTONS_PER_KGF, 8);
    expect(saved[0].protocol.distanceFromLandmarkCm).toBeNull();
    expect(screen.getByText("100.0 lb on a dynamometer")).not.toBeNull();
    expect(figure(/^Grip strength on a dynamometer \(lb; its own measure, not exercise load\)/)).toBeDefined();
  });

  it("shows a kg profile cm and kg", async () => {
    const pumpedGrip = reading("p", "2026-10-15T19:00:00.000Z", 40 * NEWTONS_PER_KGF, { metric: "grip_force_n" });
    pumpedGrip.protocol = { ...pumpedGrip.protocol, condition: "pumped" };
    render(createElement(Harness, { initial: [reading("g", "2026-10-14T07:00:00.000Z", 45 * NEWTONS_PER_KGF, { metric: "grip_force_n" }), pumpedGrip] }));
    expect(screen.getByText("45.0 kg on a dynamometer")).not.toBeNull();
    // A grip reading taken pumped is drawn hollow, and its chart says what a hollow dot is.
    const gripChart = figure(/^Grip strength on a dynamometer \(kg;/);
    expect(gripChart.querySelectorAll('circle[data-condition="pumped"]')).toHaveLength(1);
    expect(gripChart.textContent).toMatch(/Scale 40\.0 to 45\.0 kg · open dots were pumped/);
    await click("Add a reading");
    expect(field(/^Circumference \(cm\)$/)).toBeDefined();
  });
});

describe("the region's own measures", () => {
  const select = (name: RegExp) => screen.getByLabelText(name) as HTMLSelectElement;

  it("offers the forearm circumference and grip, each starting from its own place, posture and instrument", async () => {
    render(createElement(Harness));
    await click("Add a reading");
    const measured = screen.getByRole("group", { name: "What was measured" });
    expect(within(measured).getAllByRole("button").map((button) => button.textContent)).toEqual(["Circumference", "Grip strength"]);
    expect(field(/^Where \(landmark\)$/).value).toBe("Thickest point");
    expect(select(/^Posture$/).value).toBe("arm_relaxed_hanging");
    expect(field(/^Tape \(optional\)$/)).toBeDefined();
    await click("Grip strength", measured);
    expect(field(/^Where \(landmark\)$/).value).toBe("Dynamometer grip");
    expect(select(/^Posture$/).value).toBe("elbow_90_supported");
    expect(field(/^Dynamometer \(optional\)$/)).toBeDefined();
    // Back to the tape: its own place and posture again, never the dynamometer's elbow at 90°.
    await click("Circumference", measured);
    expect(field(/^Where \(landmark\)$/).value).toBe("Thickest point");
    expect(select(/^Posture$/).value).toBe("arm_relaxed_hanging");
  });

  it("offers a region only the measures it lists: the deltoid fixture records circumference, with no dynamometer anywhere", async () => {
    const { container } = render(createElement(Harness, { data: deltoidRegionData }));
    expect(figure(/^Circumference \(cm\)$/)).toBeDefined();
    await click("Add a reading");
    expect(screen.queryByRole("group", { name: "What was measured" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Grip strength" })).toBeNull();
    expect(field(/^Tape \(optional\)$/)).toBeDefined();
    expect(select(/^Posture$/).value).toBe("arm_relaxed_hanging");
    expect(container.textContent).not.toMatch(/grip|dynamometer|forearm/i);
    await type(/^Circumference \(cm\)$/, "48");
    await click("Save reading");
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ regionId: "deltoid", metric: "circumference_cm", value: 48, protocol: { landmark: "Around the shoulder", posture: "arm_relaxed_hanging" } });
    expect(container.textContent).toMatch(/Sets per week on the deltoids/);
  });

  it("still draws readings of a measure the region no longer lists, rather than hiding them", () => {
    const old = reading("g", "2026-10-14T07:00:00.000Z", 45 * NEWTONS_PER_KGF, { metric: "grip_force_n", regionId: "deltoid" });
    render(createElement(Harness, { data: deltoidRegionData, initial: [old] }));
    expect(figure(/^Grip strength on a dynamometer \(kg;/)).toBeDefined();
    expect(figure(/^Circumference \(cm\)$/)).toBeDefined();
  });
});

describe("exercise performance", () => {
  it("lists only directly mapped exercises with two sessions or more, matched by catalog id", async () => {
    window.localStorage.setItem(historyKey, JSON.stringify([
      workout("w1", "2026-10-01", [
        logged("a", "Hammer Curl", 132, [set(30, 10)]),
        logged("b", "Barbell Curl", 121, [set(60, 8)]),
        logged("c", "Wrist Curl", undefined, [set(40, 12)]),
        logged("d", "Reverse Wrist Curl", 140, [set(20, 12)]),
      ]),
      workout("w2", "2026-10-08", [
        logged("a", "Hammer Curl", 132, [set(35, 8)]),
        logged("b", "Barbell Curl", 121, [set(65, 8)]),
        logged("c", "Wrist Curl", undefined, [set(45, 12)]),
      ]),
      workout("w3", "2026-10-15", [logged("d", "Reverse Wrist Curl", 140, [set(25, 12)])], "active"),
    ]));
    render(createElement(Harness));
    const select = screen.getByLabelText("Exercise") as HTMLSelectElement;
    expect(Array.from(select.options).map((option) => option.textContent)).toEqual(["Hammer Curl · 2 sessions"]);
    expect(screen.getByText("One exact exercise per chart.")).not.toBeNull();
  });

  it("plots the top set of each session in the profile's unit, with a text summary", async () => {
    window.localStorage.setItem(historyKey, JSON.stringify([
      workout("w1", "2026-10-01", [logged("a", "Hammer Curl", 132, [set(30, 12), set(35, 8), set(35, 10), { ...set(50, 5), completed: false, skipped: true }])]),
      workout("w2", "2026-10-08", [logged("a", "Hammer Curl", 132, [set(20, 8, { unit: "kg" })])]),
      workout("w0", "2026-03-02", [logged("a", "Hammer Curl", 132, [set(25, 10)])]),
    ]));
    render(createElement(Harness, { weightUnit: "lb" }));
    const chart = figure(/^Hammer Curl: top set each session$/);
    const summary = within(chart).getByRole("list");
    expect(Array.from(summary.querySelectorAll("li")).map((item) => item.textContent)).toEqual(["1 Oct: 35 lb × 10", "8 Oct: 44.09 lb × 8, heaviest top set so far"]);
    expect(chart.querySelector("svg")?.getAttribute("aria-label")).toMatch(/2 sessions from 1 Oct to 8 Oct, first 35 lb × 10, latest 44\.09 lb × 8/);
    // Heavier than every earlier session, the March one included: said as the record it is.
    expect(chart.querySelector(".spz-chart-best-line")?.textContent).toBe("Heaviest top set so far: 44.09 lb × 8, 8 Oct (ringed)");
    expect(chart.textContent).toMatch(/Scale 35 to 44\.09 lb/);
    expect(chart.textContent).toMatch(/1 older session is not shown\./);
  });

  it("counts every arm's sets as one: the top set of a session is its heaviest, whichever arm, and a set with no arm recorded is not marked", async () => {
    window.localStorage.setItem(historyKey, JSON.stringify([
      workout("w1", "2026-10-01", [logged("a", "One-Arm Dumbbell Wrist Curl", 410, [set(25, 12, { side: "right" }), set(40, 12, { side: "left" })])]),
      workout("w2", "2026-10-08", [logged("a", "One-Arm Dumbbell Wrist Curl", 410, [set(27.5, 10)])]),
    ]));
    render(createElement(Harness, { weightUnit: "lb" }));
    const chart = figure(/^One-Arm Dumbbell Wrist Curl: top set each session$/);
    expect(chart.querySelectorAll("circle.spz-chart-dot")).toHaveLength(2);
    expect(chart.querySelectorAll("rect.spz-progress-marker")).toHaveLength(0);
    expect(Array.from(within(chart).getByRole("list").querySelectorAll("li")).map((item) => item.textContent)).toEqual(["1 Oct: 40 lb × 12", "8 Oct: 27.5 lb × 10"]);
    expect(chart.textContent).not.toMatch(/Squares|no arm|\b(left|right)\b/i);
  });

  it("leaves a session with no load entered off the load line and says so, rather than drawing it at zero", async () => {
    window.localStorage.setItem(historyKey, JSON.stringify([
      workout("w1", "2026-10-01", [logged("a", "Hammer Curl", 132, [set(30, 10)])]),
      workout("w2", "2026-10-05", [logged("a", "Hammer Curl", 132, [set("", 12)])]),
      workout("w3", "2026-10-08", [logged("a", "Hammer Curl", 132, [set(35, 8)])]),
    ]));
    render(createElement(Harness, { weightUnit: "lb" }));
    const chart = figure(/^Hammer Curl: top set each session$/);
    expect(chart.querySelectorAll("circle.spz-chart-dot")).toHaveLength(2);
    expect(Array.from(within(chart).getByRole("list").querySelectorAll("li")).map((item) => item.textContent)).toEqual(["1 Oct: 30 lb × 10", "8 Oct: 35 lb × 8, heaviest top set so far"]);
    expect(chart.textContent).toMatch(/Scale 30 to 35 lb/);
    expect(chart.textContent).toMatch(/1 session with no load entered is not shown\./);
    expect((screen.getByLabelText("Exercise") as HTMLSelectElement).options[0].textContent).toBe("Hammer Curl · 2 sessions");
  });

  it("says so plainly when nothing qualifies", () => {
    render(createElement(Harness));
    expect(screen.getByText(/No exercise that works the forearms directly has two finished sessions in these 8 weeks\./)).not.toBeNull();
  });
});

describe("focus", () => {
  it("moves to what replaces the control that had it: the form, Add a reading, Undo", async () => {
    render(createElement(Harness, { initial: [reading("a", "2026-10-14T07:00:00.000Z", 31)] }));
    await click("Add a reading");
    expect(document.activeElement?.textContent).toBe("Circumference");
    await type(/^Circumference \(cm\)$/, "31.5");
    await click("Save reading");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Add a reading" }));
    await click("Add a reading");
    await click("Cancel");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Add a reading" }));
    await click(/^Remove the reading of 31\.0 cm around/);
    const undo = screen.getByRole("button", { name: "Undo" });
    expect(document.activeElement).toBe(undo);
    // A text link alone is 36 px wide; the box class gives it the 44 px target.
    expect(undo.classList.contains("spz-link-box")).toBe(true);
    await click("Undo");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Add a reading" }));
  });
});

describe("kept across re-renders", () => {
  it("keeps a half-filled reading and the Undo through new props", async () => {
    render(createElement(Harness, { initial: [reading("a", "2026-10-14T07:00:00.000Z", 31)] }));
    await click(/^Remove the reading of 31\.0 cm around/);
    expect(screen.getByRole("status").textContent).toMatch(/Reading removed/);
    await click("Add a reading");
    await type(/^Circumference \(cm\)$/, "32");
    await type(/^Date$/, "2026-10-12");
    await type(/^Time$/, "06:15");
    // The page re-renders with new props (a new summary, a later today): nothing resets.
    await act(async () => { setFromOutside?.({ todayKey: "2026-10-17", measurements: [] }); });
    expect(field(/^Circumference \(cm\)$/).value).toBe("32");
    expect(field(/^Date$/).value).toBe("2026-10-12");
    expect(field(/^Time$/).value).toBe("06:15");
    expect(screen.getByRole("status").textContent).toMatch(/Reading removed/);
    await click("Undo");
    expect(saved.map((entry) => entry.id)).toEqual(["a"]);
  });
});

describe("the weekly bars open their bouts (brief §1: every total opens its set records)", () => {
  it("makes each week with work a button that opens that week's bouts with Open this workout; a week with none is not a button", async () => {
    window.localStorage.setItem(historyKey, JSON.stringify([
      workout("w1", "2026-10-01", [logged("a", "Hammer Curl", 132, [set(30, 10), set(30, 10)])]),
      workout("w2", "2026-10-14", [logged("a", "Hammer Curl", 132, [set(35, 10)])]),
    ]));
    render(createElement(Harness));
    const weeks = screen.getByRole("list", { name: "Sets per week" });
    expect(within(weeks).getAllByRole("listitem")).toHaveLength(8);
    const buttons = within(weeks).getAllByRole("button");
    expect(buttons.map((button) => button.getAttribute("aria-label"))).toEqual(["Week of 28 Sep: 2 sets. See them", "Week of 12 Oct: 1 set. See them"]);
    // The count a week's button shows is the bar's, and the sheet lists the same bouts.
    expect(buttons[0].textContent).toBe("28 Sep2");
    await click("Week of 28 Sep: 2 sets. See them");
    const sheet = screen.getByRole("dialog", { name: "Week of 28 Sep" });
    expect(sheet.textContent).toMatch(/28 Sep – 4 Oct: 2 sets on the forearms, each counted once\./);
    expect(within(sheet).getByText("Hammer Curl")).not.toBeNull();
    const open = within(sheet).getAllByRole("button", { name: /Open this workout/ });
    expect(open).toHaveLength(2);
    await act(async () => { fireEvent.click(open[0]); });
    expect(opened).toEqual(["w1"]);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("hands How this is counted to the page, closing the week's sheet", async () => {
    window.localStorage.setItem(historyKey, JSON.stringify([workout("w2", "2026-10-14", [logged("a", "Hammer Curl", 132, [set(35, 10)])])]));
    render(createElement(Harness));
    await click(/^Week of 12 Oct/);
    await click("How this is counted", screen.getByRole("dialog"));
    expect(methodOpened).toBe(1);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("measured bests so far (brief §10: measured performance milestones, nothing about growth)", () => {
  const hold = (seconds: number): DeviceSetLog => ({ weight: "", reps: "", holdSeconds: String(seconds), unit: "lb", completed: true }) as DeviceSetLog;
  const addDays = (key: string, days: number) => new Date(Date.parse(`${key}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
  const hangs = (values: number[]) => values.map((seconds, index) => workout(`h${index}`, addDays("2026-09-30", 7 * index), [logged("a", "Dead Hang", 143, [hold(seconds)])]));

  it("rings the session whose longest hold beats every earlier one, and says it as a fact", async () => {
    window.localStorage.setItem(historyKey, JSON.stringify(hangs([40, 80, 75])));
    render(createElement(Harness));
    const chart = figure(/^Dead Hang: longest hold each session$/);
    expect(chart.querySelectorAll("[data-best]")).toHaveLength(1);
    expect(chart.querySelector(".spz-chart-best-line")?.textContent).toBe("Longest hold so far: 80 s, 7 Oct (ringed)");
    // The ring sits on the 80 s session's dot.
    const dots = Array.from(chart.querySelectorAll("circle.spz-chart-dot"));
    const ring = chart.querySelector("[data-best]")!;
    expect(ring.getAttribute("cx")).toBe(dots[1].getAttribute("cx"));
    expect(ring.getAttribute("cy")).toBe(dots[1].getAttribute("cy"));
    expect(chart.querySelector("svg")?.getAttribute("aria-label")).toMatch(/Longest hold so far: 80 s, 7 Oct\.$/);
    expect(chart.textContent).not.toMatch(/grow|gain|stronger|improv|because/i);
  });

  it("says nothing when no session has beaten the ones before it", async () => {
    window.localStorage.setItem(historyKey, JSON.stringify(hangs([80, 40, 75])));
    render(createElement(Harness));
    const chart = figure(/^Dead Hang: longest hold each session$/);
    expect(chart.querySelector("[data-best]")).toBeNull();
    expect(chart.querySelector(".spz-chart-best-line")).toBeNull();
  });

  it("reads the whole history: a session older than the eight weeks still counts as an earlier one", async () => {
    window.localStorage.setItem(historyKey, JSON.stringify([
      workout("old", "2026-03-02", [logged("a", "Dead Hang", 143, [hold(90)])]),
      ...hangs([40, 80, 75]),
    ]));
    render(createElement(Harness));
    const chart = figure(/^Dead Hang: longest hold each session$/);
    expect(chart.querySelector(".spz-chart-best-line")).toBeNull();
  });

  it("rings the highest grip reading taken the same way, and gives circumference no best", () => {
    const grip = (id: string, at: string, kg: number, protocol: Partial<SpecializationMeasurement["protocol"]> = {}) => {
      const entry = reading(id, at, kg * NEWTONS_PER_KGF, { metric: "grip_force_n" });
      entry.protocol = { ...entry.protocol, landmark: "Dynamometer grip", posture: "elbow_90_supported", ...protocol };
      return entry;
    };
    render(createElement(Harness, { initial: [
      grip("g1", "2026-09-30T07:00:00.000Z", 40),
      grip("g2", "2026-10-07T07:00:00.000Z", 45),
      // Pumped, so another protocol: neither beaten by nor beating the unpumped readings.
      grip("g3", "2026-10-10T19:00:00.000Z", 50, { condition: "pumped" }),
      grip("g4", "2026-10-14T07:00:00.000Z", 42),
      reading("c1", "2026-10-01T07:00:00.000Z", 30),
      reading("c2", "2026-10-14T07:00:00.000Z", 31),
    ] }));
    const gripChart = figure(/^Grip strength on a dynamometer/);
    expect(gripChart.querySelector(".spz-chart-best-line")?.textContent).toBe("Highest grip reading so far at this place, posture and condition: 45.0 kg on a dynamometer, 7 Oct (ringed)");
    expect(gripChart.querySelectorAll("[data-best]")).toHaveLength(1);
    const circumference = figure(/^Circumference/);
    expect(circumference.querySelector("[data-best]")).toBeNull();
    expect(circumference.querySelector(".spz-chart-best-line")).toBeNull();
  });
});

describe("a repeatable protocol (brief §10: location, distance, posture, time and condition)", () => {
  const select = (name: RegExp) => screen.getByLabelText(name) as HTMLSelectElement;
  const taped = (id: string, at: string, value: number, protocol: Partial<SpecializationMeasurement["protocol"]>) => {
    const entry = reading(id, at, value);
    entry.protocol = { ...entry.protocol, ...protocol };
    return entry;
  };
  const week1 = { landmark: "5 cm below elbow crease", distanceFromLandmarkCm: 5, posture: "elbow_90_supported" as const, condition: "unpumped" as const, device: "Gulick tape" };

  it("starts a new reading from the last one of the same measure, and says so", async () => {
    render(createElement(Harness, { initial: [taped("a", "2026-10-07T07:00:00.000Z", 31.5, week1)] }));
    await click("Add a reading");
    expect(field(/^Where \(landmark\)$/).value).toBe("5 cm below elbow crease");
    expect(field(/^Distance from the landmark \(cm, optional\)$/).value).toBe("5");
    expect(select(/^Posture$/).value).toBe("elbow_90_supported");
    expect(select(/^Condition$/).value).toBe("unpumped");
    expect(field(/^Tape \(optional\)$/).value).toBe("Gulick tape");
    expect(screen.getByText(/^Filled in from your last reading \(7 Oct\): place, posture, condition and tape\./)).not.toBeNull();
    await type(/^Circumference \(cm\)$/, "31.8");
    await click("Save reading");
    expect(saved[0].protocol).toMatchObject({ landmark: "5 cm below elbow crease", distanceFromLandmarkCm: 5, posture: "elbow_90_supported", device: "Gulick tape" });
  });

  it("falls back to a measure's own defaults where it has no reading, per measure, and asks no arm", async () => {
    render(createElement(Harness, { initial: [taped("a", "2026-10-07T07:00:00.000Z", 31.5, week1)] }));
    await click("Add a reading");
    // Grip has no reading: its own place and posture, never the tape's.
    await click("Grip strength");
    expect(field(/^Where \(landmark\)$/).value).toBe("Dynamometer grip");
    expect(select(/^Posture$/).value).toBe("elbow_90_supported");
    expect(field(/^Dynamometer \(optional\)$/).value).toBe("");
    await click("Circumference");
    expect(field(/^Where \(landmark\)$/).value).toBe("5 cm below elbow crease");
    expect(screen.queryByRole("group", { name: "Which arm" })).toBeNull();
  });

  it("keeps what the athlete typed through new props, and shows a distance in inches for an lb profile", async () => {
    render(createElement(Harness, { weightUnit: "lb", initial: [taped("a", "2026-10-07T07:00:00.000Z", 31.75, { ...week1, distanceFromLandmarkCm: 5.08 })] }));
    await click("Add a reading");
    expect(field(/^Distance from the landmark \(in, optional\)$/).value).toBe("2");
    await type(/^Where \(landmark\)$/, "Wrist crease");
    expect(screen.queryByText(/^Filled in from your last reading/)).toBeNull();
    await act(async () => { setFromOutside?.({ todayKey: "2026-10-17" }); });
    expect(field(/^Where \(landmark\)$/).value).toBe("Wrist crease");
  });

  it("draws a reading taken at a different place or posture as a diamond, and the scale line counts them", () => {
    render(createElement(Harness, { initial: [
      taped("a", "2026-09-30T07:00:00.000Z", 31.5, week1),
      taped("b", "2026-10-07T07:00:00.000Z", 31.6, { ...week1, landmark: "  5 CM below elbow crease " }),
      taped("c", "2026-10-14T07:00:00.000Z", 33, { ...week1, landmark: "Thickest point", distanceFromLandmarkCm: null }),
      taped("d", "2026-10-15T07:00:00.000Z", 33.1, { ...week1, landmark: "Thickest point", distanceFromLandmarkCm: null, posture: "arm_relaxed_hanging" }),
    ] }));
    const chart = figure(/^Circumference/);
    // Case and spacing in the landmark are not a change; a new landmark, distance or posture is.
    expect(chart.querySelectorAll('polygon[data-protocol="changed"]')).toHaveLength(2);
    expect(chart.querySelectorAll("circle.spz-chart-dot")).toHaveLength(2);
    expect(chart.textContent).toMatch(/Scale 31\.5 to 33\.1 cm · 2 diamonds: readings at a different place or posture than the one before/);
    expect(chart.querySelector("svg")?.getAttribute("aria-label")).toMatch(/2 taken at a different place or posture than the one before\./);
  });
});
