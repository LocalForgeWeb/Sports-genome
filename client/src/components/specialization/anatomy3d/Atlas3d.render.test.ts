// @vitest-environment jsdom
import React, { createElement, useEffect, useState } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SpecializationPanel, type SpecializationPanelProps } from "../SpecializationPanel";
import { exercises } from "@/lib/exerciseCatalog";
import { defaultEquipmentProfile } from "@/lib/equipmentProfile";
import { defaultSpecializationState, type SpecializationViewState } from "@/lib/specialization/viewState";
import { clearSummaryCache } from "@/lib/specialization/useSpecializationSummary";
import { buildDaySlots, commitDay, emptyDayStore } from "@/lib/trainingDayPlan";
import { forearmAdjacentIds, forearmMuscleIds as m } from "@shared/specialization/ids";
import { regionDataFor } from "@shared/specialization/registry";
import { canonicalForModelSource } from "./modelIdentity";
import { muscleManifest } from "./muscleManifest";
import type { CanvasFailure, CanvasStatus } from "./modelTypes";

/**
 * The 3D view on the Specialize page (SG-FOREARM-INTEGRATION-20261019 §10). jsdom has no
 * WebGL, so only the canvas is replaced: a stand-in that reports what the real one is told
 * (the source id it is asked to show, the arm, reduced motion) and taps a structure by its
 * source id, as a tap on the model does. Everything else is the page as it ships: the lazy
 * chunk, the identity adapter, the data adapter, the sheets and the selection state.
 */

type CanvasProps = { selectedMuscleId: string | null; side: "left" | "right"; reducedMotion: boolean; label: string; onMuscleSelect: (id: string) => void; onStatusChange: (status: CanvasStatus, failure?: CanvasFailure) => void };
const canvas = vi.hoisted(() => ({ mounts: 0, unmounts: 0, last: null as null | Record<string, unknown>, outcome: "ready" as "ready" | "model" | "context-lost" }));

vi.mock("./ForearmCanvas", () => ({
  ForearmCanvas: (props: CanvasProps) => {
    useEffect(() => {
      canvas.mounts += 1;
      if (canvas.outcome === "ready") props.onStatusChange("ready");
      else props.onStatusChange("error", canvas.outcome);
      return () => { canvas.unmounts += 1; };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    canvas.last = { selectedMuscleId: props.selectedMuscleId, side: props.side, reducedMotion: props.reducedMotion, label: props.label };
    return createElement("div", { "data-testid": "fake-canvas", role: "img", "aria-label": props.label },
      muscleManifest.map((entry) => createElement("button", { key: entry.id, type: "button", "data-pick": entry.id, onClick: () => props.onMuscleSelect(entry.id) }, `tap ${entry.id}`)),
      createElement("button", { type: "button", "data-pick": "unknown", onClick: () => props.onMuscleSelect("not-a-structure") }, "tap unknown"));
  },
}));

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
let reduced = false;
const media = () => (window as unknown as Record<string, unknown>).matchMedia = (query: string) => ({ matches: reduced && query.includes("reduce"), addEventListener() {}, removeEventListener() {} });
Element.prototype.scrollIntoView = () => {};

/** A browser that can draw WebGL, as far as the page's check can tell. */
function withWebgl(on: boolean) {
  const target = window as unknown as Record<string, unknown>;
  if (on) {
    target.WebGLRenderingContext = function WebGLRenderingContext() {};
    HTMLCanvasElement.prototype.getContext = (() => ({ getExtension: () => ({ loseContext() {} }) })) as never;
  } else {
    delete target.WebGLRenderingContext;
  }
}

const data = regionDataFor("forearm")!;
const nameOf = (id: string) => data.nodes.find((node) => node.id === id)!.name;
const byId = (id: number) => exercises.find((exercise) => exercise.id === id)!;
const slots = buildDaySlots(["Push", "Pull"]);
const store = commitDay(emptyDayStore(), slots[1].key, { workout: [byId(140)], prescriptions: {}, settings: {}, context: [] });
const set = (weight: number, reps: number, extra: Record<string, unknown> = {}) => ({ weight: String(weight), reps: String(reps), unit: "lb", completed: true, ...extra });
const workout = {
  id: "s-arms", title: "Arms", dayLabel: "Week 1 · Day 02 · Pull", startedAt: "2026-10-14T17:00:00.000Z", completedAt: "2026-10-14T18:00:00.000Z", status: "completed",
  exercises: [
    { id: "e1", exerciseName: "Wrist Curl", catalogId: 139, plannedPrescription: "3 × 15", sets: [set(65, 15), set(65, 15), { ...set(65, 12), id: "d1", type: "drop", stages: [{ weight: "65", reps: "12" }, { weight: "45", reps: "8" }] }] },
    { id: "e2", exerciseName: "Hammer Curl", catalogId: 132, plannedPrescription: "2 × 10", sets: [set(35, 10, { side: "right" }), set(35, 10, { side: "right" })] },
  ],
};

function Harness(props: { initial?: Partial<SpecializationViewState>; onState?: (state: SpecializationViewState) => void; onInspect?: (name: string) => void }) {
  const [state, setState] = useState<SpecializationViewState>({ ...defaultSpecializationState("forearm"), ...props.initial });
  useEffect(() => { props.onState?.(state); });
  const panel: SpecializationPanelProps = {
    state,
    onStateChange: setState,
    plan: { ready: true, slots, weeks: { 1: store }, choice: null, activeWeek: 1 },
    catalog: exercises,
    equipmentProfile: defaultEquipmentProfile,
    accountId: null,
    goal: "Athleticism",
    weightUnit: "lb",
    onApplyPlanChange: () => ({ ok: true, undo: () => {} }),
    onInspectExercise: (exercise) => props.onInspect?.(exercise.name),
    onOpenSession: () => {},
    backLabel: null,
    onBack: null,
  };
  return createElement(SpecializationPanel, panel);
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-16T12:00:00.000Z"));
  window.localStorage.clear();
  window.localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify([workout]));
  clearSummaryCache();
  Object.assign(canvas, { mounts: 0, unmounts: 0, last: null, outcome: "ready" });
  reduced = false;
  media();
  withWebgl(true);
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

const click = async (element: Element) => { await act(async () => { fireEvent.click(element); }); };
/** The canvas is up and has reported how it went (the stage leaves "loading"). */
const ready = async () => {
  const fake = await screen.findByTestId("fake-canvas");
  await waitFor(() => expect(document.querySelector(".sg-anatomy3d-stage")?.getAttribute("data-status")).not.toBe("loading"));
  return fake;
};
const tap = async (sourceId: string) => click(document.querySelector(`[data-pick="${sourceId}"]`)!);
const detail = () => document.querySelector(".sg-anatomy3d-detail") as HTMLElement;
const bar = () => document.querySelector(".sg-anatomy3d-bar") as HTMLElement;
const choose = async (name: string) => {
  await click(screen.getByRole("button", { name: /^Choose muscle/ }));
  const sheet = screen.getByRole("dialog", { name: "Choose muscle" });
  await click(within(sheet).getByRole("button", { name: new RegExp(`^${name},`) }));
  await waitFor(() => expect(screen.queryByRole("dialog", { name: "Choose muscle" })).toBeNull());
};

describe("the 3D model is the page's map for the forearm", () => {
  it("opens on the 3D model when the browser can draw it, with the drawing one tap away", async () => {
    render(createElement(Harness));
    await ready();
    expect(screen.getByRole("button", { name: "3D model" }).getAttribute("aria-pressed")).toBe("true");
    expect(bar().textContent).toContain("Whole forearms");
    await click(screen.getByRole("button", { name: "Drawing" }));
    expect(screen.queryByTestId("fake-canvas")).toBeNull();
    expect(canvas.unmounts).toBe(1);
  });

  it("falls back to the drawing on a browser without WebGL, and says why when the model is asked for", async () => {
    withWebgl(false);
    const { unmount } = render(createElement(Harness));
    expect(screen.getByRole("button", { name: "Drawing" }).getAttribute("aria-pressed")).toBe("true");
    expect(document.querySelector(".sg-anatomy3d-stage")).toBeNull();
    unmount();
    render(createElement(Harness, { initial: { figure: "model" } }));
    expect(screen.getByRole("alert").textContent).toMatch(/cannot show the 3D model: WebGL is off/);
    await click(screen.getByRole("button", { name: "Show the drawing" }));
    expect(document.querySelector(".sg-anatomy3d-stage")).toBeNull();
  });
});

describe("selection: every structure, by model, list or link, to the same muscle", () => {
  it("selects each of the 20 structures from the model, and the model is told the same structure back", async () => {
    let latest: SpecializationViewState | null = null;
    render(createElement(Harness, { onState: (state) => { latest = state; } }));
    await ready();
    for (const entry of muscleManifest) {
      await tap(entry.id);
      const canonical = canonicalForModelSource(entry.id)!;
      expect(latest!.nodeId).toBe(canonical);
      expect(detail().querySelector("h3")?.textContent).toBe(nameOf(canonical));
      expect(bar().textContent).toContain(nameOf(canonical));
      expect(canvas.last?.selectedMuscleId).toBe(entry.id);
    }
    expect(canvas.mounts).toBe(1);
  });

  it("shows the same muscle whether it was tapped on the model, chosen in the list, or named in the link", async () => {
    const texts: string[] = [];
    let view = render(createElement(Harness));
    await ready();
    await tap("flexor-carpi-ulnaris");
    texts.push(detail().textContent!);
    view.unmount();
    view = render(createElement(Harness));
    await ready();
    await choose("Flexor carpi ulnaris");
    texts.push(detail().textContent!);
    expect(canvas.last?.selectedMuscleId).toBe("flexor-carpi-ulnaris");
    view.unmount();
    render(createElement(Harness, { initial: { nodeId: m.flexorCarpiUlnaris } }));
    await ready();
    texts.push(detail().textContent!);
    expect(canvas.last?.selectedMuscleId).toBe("flexor-carpi-ulnaris");
    expect(new Set(texts).size).toBe(1);
    expect(texts[0]).toContain("Wrist Curl");
  });

  it("follows rapid taps to the last one, with that muscle's numbers and no other's", async () => {
    render(createElement(Harness));
    await ready();
    await act(async () => {
      for (const id of ["brachioradialis", "supinator", "extensor-digitorum", "flexor-digitorum-profundus", "flexor-carpi-ulnaris"]) fireEvent.click(document.querySelector(`[data-pick="${id}"]`)!);
    });
    expect(detail().querySelector("h3")?.textContent).toBe("Flexor carpi ulnaris");
    expect(canvas.last?.selectedMuscleId).toBe("flexor-carpi-ulnaris");
    expect(detail().textContent).toContain("Wrist Curl");
  });

  it("lights every head of a multi-head muscle as one: one selection, one panel", async () => {
    render(createElement(Harness));
    await ready();
    for (const [source, canonical] of [["flexor-digitorum-superficialis", m.flexorDigitorumSuperficialis], ["pronator-teres", m.pronatorTeres], ["extensor-carpi-ulnaris", m.extensorCarpiUlnaris]] as const) {
      await tap(source);
      expect(canvas.last?.selectedMuscleId).toBe(source);
      expect(detail().querySelector("h3")?.textContent).toBe(nameOf(canonical));
    }
  });

  it("ignores a structure the adapter does not know, keeping the muscle that is selected (never a stale one)", async () => {
    render(createElement(Harness, { initial: { nodeId: m.flexorCarpiUlnaris } }));
    await ready();
    await tap("unknown");
    expect(detail().querySelector("h3")?.textContent).toBe("Flexor carpi ulnaris");
  });

  it("says plainly when a link names a muscle the atlas does not have, and shows the whole forearm", async () => {
    render(createElement(Harness, { initial: { nodeId: "forearm.not-a-muscle" } }));
    await ready();
    await waitFor(() => expect(document.querySelector('[data-status="unavailable"]')?.textContent).toMatch(/“forearm.not-a-muscle” is not a muscle in this atlas/));
    expect(bar().textContent).toContain("Whole forearms");
    expect(canvas.last?.selectedMuscleId).toBeNull();
  });

  it("Overview clears the selection and the model shows the whole forearm", async () => {
    render(createElement(Harness, { initial: { nodeId: m.flexorDigitorumProfundus } }));
    await ready();
    await click(screen.getByRole("button", { name: "Overview" }));
    expect(bar().textContent).toContain("Whole forearms");
    expect(canvas.last?.selectedMuscleId).toBeNull();
    expect(screen.queryByRole("button", { name: "Overview" })).toBeNull();
  });

  it("lists the upper-arm muscles credited here, marked as not in the model, with the model at its overview", async () => {
    render(createElement(Harness));
    await ready();
    await choose("Biceps brachii");
    expect(detail().textContent).toContain("Not in the 3D model");
    expect(canvas.last?.selectedMuscleId).toBeNull();
  });
});

describe("numbers: the mode and window on screen, both arms as one, and the model never reloads for them", () => {
  it("changes the numbers for a new window or mode without remounting the model; there is no arm to choose and no mirrored model", async () => {
    render(createElement(Harness, { initial: { nodeId: m.brachioradialis } }));
    await ready();
    expect(detail().textContent).toContain("Hammer Curl");
    await click(screen.getByRole("button", { name: "Rolling 7 days" }));
    await click(screen.getByRole("button", { name: "Planned" }));
    expect(detail().textContent).toMatch(/^Brachioradialis/);
    expect(detail().textContent).toContain("Planned");
    await click(screen.getByRole("button", { name: "Completed" }));
    expect(detail().textContent).toContain("Hammer Curl");
    // Both arms are counted as one (20 Oct 2026): no arm switch, and the one model is never mirrored.
    expect(screen.queryByRole("button", { name: "Left arm" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Right arm" })).toBeNull();
    expect(canvas.last?.side).toBe("right");
    expect(canvas.last?.label).not.toMatch(/\b(left|right) arm\b|mirrored/);
    expect(canvas.mounts).toBe(1);
    expect(canvas.unmounts).toBe(0);
  });

  it("tells a muscle with no mapping (missing) from one with no work (zero)", async () => {
    render(createElement(Harness, { initial: { nodeId: forearmAdjacentIds.anconeus } }));
    await ready();
    expect(detail().textContent).toMatch(/missing mapping, not missing training/);
    expect(detail().querySelector(".sg-anatomy3d-lead-number b")?.textContent).toBe("—");
    await tap("extensor-indicis");
    expect(detail().querySelector(".sg-anatomy3d-lead-number b")?.textContent).toBe("0");
    expect(detail().textContent).toMatch(/Nothing logged for it in this window/);
  });

  it("counts a drop set once, a two-handed set once, and one-arm work from either arm", async () => {
    render(createElement(Harness, { initial: { nodeId: m.flexorCarpiUlnaris } }));
    await ready();
    // Three two-handed sets, the third a drop set of two stages: three bouts, not six.
    expect(detail().querySelector(".sg-anatomy3d-lead-number b")?.textContent).toBe("3");
    expect(detail().textContent).toContain("both arms");
  });

  it("passes the reduced-motion setting to the model", async () => {
    reduced = true;
    media();
    render(createElement(Harness));
    await ready();
    expect(canvas.last?.reducedMotion).toBe(true);
  });
});

describe("actions open the real records and flows, and come back", () => {
  it("View contributions opens the muscle's ledger; closing returns to the same muscle with focus where it was", async () => {
    render(createElement(Harness, { initial: { nodeId: m.flexorCarpiUlnaris } }));
    await ready();
    const open = screen.getByRole("button", { name: /^View contributions/ });
    open.focus();
    await click(open);
    const sheet = screen.getByRole("dialog", { name: "Flexor carpi ulnaris" });
    expect(within(sheet).getByRole("heading", { name: "Where the numbers come from" })).toBeTruthy();
    expect(within(sheet).getAllByText("Wrist Curl").length).toBeGreaterThan(0);
    await click(within(sheet).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(detail().querySelector("h3")?.textContent).toBe("Flexor carpi ulnaris");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: /^View contributions/ }));
  });

  it("View opens the exercise by its catalog id", async () => {
    const inspected: string[] = [];
    render(createElement(Harness, { initial: { nodeId: m.flexorCarpiUlnaris }, onInspect: (name) => inspected.push(name) }));
    await ready();
    await click(screen.getByRole("button", { name: "View Wrist Curl" }));
    expect(inspected).toEqual(["Wrist Curl"]);
  });

  it("Add exercise opens the existing add flow for this muscle", async () => {
    render(createElement(Harness, { initial: { nodeId: m.extensorIndicis } }));
    await ready();
    await click(screen.getByRole("button", { name: /^Add exercise/ }));
    // The page's own add flow: an exercise reviewed for this muscle, with the week and day it goes to in view.
    const dialog = screen.getByRole("dialog", { name: "Add to your plan" });
    const legends = Array.from(dialog.querySelectorAll("legend")).map((legend) => legend.textContent);
    expect(legends).toEqual(expect.arrayContaining(["Exercise", "Week", "Day"]));
    expect(dialog.textContent).toContain("Extensor indicis");
  });
});

describe("Choose muscle: a sheet, and Back closes it first", () => {
  it("lists every selectable muscle as a 44 px button, grouped, with the selected one pressed", async () => {
    render(createElement(Harness, { initial: { nodeId: m.flexorDigitorumProfundus } }));
    await ready();
    await click(screen.getByRole("button", { name: /^Choose muscle/ }));
    const sheet = screen.getByRole("dialog", { name: "Choose muscle" });
    const rows = within(sheet).getAllByRole("button").filter((button) => button.classList.contains("sg-anatomy3d-pick"));
    // The whole forearm, then every muscle the page can select.
    expect(rows).toHaveLength(1 + data.nodes.filter((node) => node.kind === "muscle" || node.kind === "head").length);
    expect(within(sheet).getByRole("button", { name: /^Flexor digitorum profundus,/ }).getAttribute("aria-pressed")).toBe("true");
    expect(within(sheet).getByRole("button", { name: /^Anconeus,/ })).toBeTruthy();
    expect(within(sheet).getByRole("button", { name: /^Biceps brachii, .*not in the 3D model/ })).toBeTruthy();
  });

  it("closes on Back without leaving the page or changing the muscle, and leaves no extra history entry", async () => {
    render(createElement(Harness, { initial: { nodeId: m.flexorCarpiUlnaris } }));
    await ready();
    await click(screen.getByRole("button", { name: /^Choose muscle/ }));
    expect(window.history.state?.spzPicker).toBe(true);
    await act(async () => { window.history.back(); });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Choose muscle" })).toBeNull());
    expect(window.history.state?.spzPicker).toBeFalsy();
    expect(detail().querySelector("h3")?.textContent).toBe("Flexor carpi ulnaris");
  });

  it("applies a choice after its own history entry is gone", async () => {
    render(createElement(Harness));
    await ready();
    await choose("Supinator");
    expect(window.history.state?.spzPicker).toBeFalsy();
    expect(detail().querySelector("h3")?.textContent).toBe("Supinator");
    expect(canvas.last?.selectedMuscleId).toBe("supinator");
  });
});

describe("when the model cannot show", () => {
  it("says the model did not load, keeps Choose muscle working, and Try again builds a new canvas", async () => {
    canvas.outcome = "model";
    render(createElement(Harness));
    await ready();
    expect(screen.getByRole("alert").textContent).toMatch(/The 3D model did not load/);
    await choose("Flexor carpi ulnaris");
    expect(detail().querySelector("h3")?.textContent).toBe("Flexor carpi ulnaris");
    canvas.outcome = "ready";
    await click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(canvas.mounts).toBe(2));
    expect(canvas.unmounts).toBe(1);
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    expect(canvas.last?.selectedMuscleId).toBe("flexor-carpi-ulnaris");
  });

  it("offers to reload the model after the device drops the WebGL context", async () => {
    canvas.outcome = "context-lost";
    render(createElement(Harness));
    await ready();
    expect(screen.getByRole("alert").textContent).toMatch(/The device reset the 3D view/);
    expect(screen.getByRole("button", { name: "Reload the model" })).toBeTruthy();
  });
});

describe("for a screen reader", () => {
  it("names the model, its arm and its selection, and every control by what it does", async () => {
    render(createElement(Harness, { initial: { nodeId: m.flexorPollicisLongus } }));
    await ready();
    expect(screen.getByRole("img", { name: /^3D model of the forearms\. Flexor pollicis longus selected\. Every muscle is also in Choose muscle\.$/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Choose muscle/ }).getAttribute("aria-haspopup")).toBe("dialog");
    expect(screen.getByRole("heading", { name: "Flexor pollicis longus" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Show the muscles as" })).toBeTruthy();
  });
});
