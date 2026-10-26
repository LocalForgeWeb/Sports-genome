// @vitest-environment jsdom
import React, { createElement, useState } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { defaultEquipmentProfile } from "@/lib/equipmentProfile";
import { loadRegionData } from "@/lib/specialization/loadRegion";
import { clearSummaryCache } from "@/lib/specialization/useSpecializationSummary";
import { defaultSpecializationState, type SpecializationViewState } from "@/lib/specialization/viewState";
import { buildDaySlots, emptyDayStore } from "@/lib/trainingDayPlan";

/**
 * The forearm page with the owner's rendered plates as its Drawing (23 Oct 2026; 09-page.md "The
 * owner's plates"): nothing fetched until Drawing is on screen, then only the pass shown; the plates'
 * views and layers on the page's own controls; a deep muscle chosen from the list moving the page to
 * its pass; the credit under the key; the colours the page's own fills.
 */

const assets = vi.hoisted(() => ({ loads: [] as string[] }));
vi.mock("./plateAssets", () => ({
  loadPlatePass: (pass: { id: string }) => { assets.loads.push(pass.id); return new Promise(() => {}); },
  loadedPlatePass: () => null,
  platePublicUrl: (path: string) => `/${path}`,
}));
// jsdom has no WebGL: the model's stage is a stand-in, as in pageText.render.test.ts.
vi.mock("./anatomy3d/AnatomyModelStage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./anatomy3d/AnatomyModelStage")>()),
  AnatomyModelStage: ({ label }: { label: string }) => createElement("div", { className: "sg-anatomy3d-stage", role: "img", "aria-label": label }),
}));
import { SpecializationPanel } from "./SpecializationPanel";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
if (!window.matchMedia) (window as unknown as Record<string, unknown>).matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
Element.prototype.scrollIntoView = () => {};
window.scrollBy = (() => {}) as typeof window.scrollBy;

const slots = buildDaySlots(["Push", "Pull"]);
const set = (weight: number, reps: number) => ({ weight: String(weight), reps: String(reps), unit: "lb", completed: true });
const sessions = [{
  id: "s-tue", title: "Pull", dayLabel: "Week 1 · Day 02 · Pull", startedAt: "2026-10-13T17:00:00.000Z", completedAt: "2026-10-13T18:00:00.000Z", status: "completed",
  exercises: [{ id: "e1", exerciseName: "Hammer Curl", catalogId: 132, plannedPrescription: "3 × 12", sets: [set(30, 12), set(30, 12), set(30, 10)] }],
}];

let lastState: SpecializationViewState | null = null;
function Harness({ initial = {} }: { initial?: Partial<SpecializationViewState> }) {
  const [state, setState] = useState<SpecializationViewState>({ ...defaultSpecializationState("forearm"), ...initial });
  lastState = state;
  return createElement(SpecializationPanel, {
    state, onStateChange: setState,
    plan: { ready: true, slots, weeks: { 1: emptyDayStore() }, choice: null, activeWeek: 1 },
    catalog: exercises, equipmentProfile: defaultEquipmentProfile, accountId: null, goal: "Athleticism", weightUnit: "lb",
    onApplyPlanChange: () => ({ ok: true, undo: () => {} }), onInspectExercise: () => {}, onOpenSession: () => {},
    backLabel: null, onBack: null,
  });
}

beforeAll(async () => { await loadRegionData("forearm"); });
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-16T12:00:00.000Z"));
  window.localStorage.clear();
  window.localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(sessions));
  clearSummaryCache();
  assets.loads.length = 0;
  lastState = null;
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

const mapCard = () => screen.getByRole("region", { name: "Muscle map" });
const segment = (name: string) => within(within(mapCard()).getByRole("group", { name })).getAllByRole("button");

describe("the forearm's Drawing is the owner's plates", () => {
  it("fetches no plate while the 3D model is shown, then only the pass Drawing shows", async () => {
    render(createElement(Harness, { initial: { figure: "model" } }));
    await act(async () => {});
    expect(mapCard().querySelector(".sg-anatomy3d-stage")).not.toBeNull();
    expect(mapCard().querySelector(".spz-plate")).toBeNull();
    expect(assets.loads).toEqual([]);
    await act(async () => { fireEvent.click(within(mapCard()).getByRole("button", { name: "Drawing" })); });
    expect(mapCard().querySelector(".spz-plate")).not.toBeNull();
    expect(assets.loads).toEqual(["anterior-surface"]);
  });

  it("shows the plates, not the SVG, with their views and layers on the page's own controls, 44 px each", async () => {
    render(createElement(Harness));
    await act(async () => {});
    expect(mapCard().querySelector(".spz-diagram-svg")).toBeNull();
    expect(mapCard().querySelector(".spz-plate")!.getAttribute("data-pass")).toBe("anterior-surface");
    expect(segment("View").map((button) => [button.textContent, button.getAttribute("aria-pressed")])).toEqual([["Palm", "true"], ["Back", "false"], ["Thumb side", "false"]]);
    expect(segment("Layer").map((button) => button.textContent)).toEqual(["Surface", "Deep"]);
    await act(async () => { fireEvent.click(segment("View")[2]); });
    expect(lastState).toMatchObject({ view: "thumb", layer: "surface" });
    expect(mapCard().querySelector(".spz-plate")!.getAttribute("data-pass")).toBe("lateral-surface");
    await act(async () => { fireEvent.click(segment("Layer")[1]); });
    expect(mapCard().querySelector(".spz-plate")!.getAttribute("data-pass")).toBe("lateral-deep");
    expect(assets.loads).toEqual(["anterior-surface", "lateral-surface", "lateral-deep"]);
    // The chips name the pass's muscles by their short names, and the group is named as the SVG's was.
    expect(within(mapCard()).getByRole("group", { name: /^Forearms, thumb side view, deep layer\. 5 muscles to choose from\.$/ })).not.toBeNull();
    expect(Array.from(mapCard().querySelectorAll(".spz-plate-chip")).map((chip) => chip.textContent)).toEqual(["SUP", "APL", "EPL", "EPB", "FPL"]);
  });

  it("moves to the deep pass when a deep muscle is chosen from the list, and the chip there is pressed", async () => {
    render(createElement(Harness));
    await act(async () => {});
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /^Flexor digitorum profundus, Deep\./ })); });
    await act(async () => {});
    expect(lastState).toMatchObject({ nodeId: "forearm.fdp", view: null, layer: "deep" });
    expect(mapCard().querySelector(".spz-plate")!.getAttribute("data-pass")).toBe("anterior-deep");
    expect(mapCard().querySelector('.spz-plate-chip[data-node="forearm.fdp"]')!.getAttribute("aria-pressed")).toBe("true");
    // Only the pass it left (shown first) and the pass it went to were asked for.
    expect(assets.loads).toEqual(["anterior-surface", "anterior-deep"]);
  });

  it("follows a tap on a chip into the strip above, and colours each chip with the page's own fill", async () => {
    render(createElement(Harness));
    await act(async () => {});
    const br = mapCard().querySelector<HTMLElement>('.spz-plate-chip[data-node="forearm.br"]')!;
    expect(br.dataset.fill).toBe("bin-2");
    expect(mapCard().querySelector<HTMLElement>('.spz-plate-chip[data-node="forearm.fcu"]')!.dataset.fill).toBe("zero");
    await act(async () => { fireEvent.click(br); });
    expect(lastState?.nodeId).toBe("forearm.br");
    expect(within(within(mapCard()).getByRole("group", { name: "Selected muscle" })).getByText("Brachioradialis")).not.toBeNull();
    await act(async () => { fireEvent.click(within(mapCard()).getByRole("button", { name: "Target" })); });
    expect(br.dataset.fill).toBe("none");
  });

  it("credits the source under the key, and says how the drawing was made under How this is counted", async () => {
    render(createElement(Harness));
    await act(async () => {});
    const credit = mapCard().querySelector(".spz-plate-credit")!;
    expect(credit.textContent).toMatch(/^Adapted from the Open3Dmodel upper-limb model \(BodyParts3D, .*; Z-Anatomy, CC BY-SA 4\.0\): cropped, tinted and split by muscle\./);
    expect(mapCard().querySelector(".spz-legend")!.compareDocumentPosition(credit) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(document.getElementById("spz-method")!.textContent).toMatch(/Which muscle each part of the drawing shows was taken from the model's own muscle renders/);
    expect(document.getElementById("spz-method")!.textContent).not.toMatch(/original schematics/);
  });
});
