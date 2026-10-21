// @vitest-environment jsdom
import React, { createElement, useState } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SpecializationPanel, type SpecializationPanelProps } from "./SpecializationPanel";
import { exercises } from "@/lib/exerciseCatalog";
import { defaultEquipmentProfile } from "@/lib/equipmentProfile";
import { deltoidIds, deltoidRegionData } from "@/lib/specialization/__fixtures__/deltoidRegion";
import { loadRegionData } from "@/lib/specialization/loadRegion";
import { clearSummaryCache } from "@/lib/specialization/useSpecializationSummary";
import { defaultSpecializationState, type SpecializationViewState } from "@/lib/specialization/viewState";
import { buildDaySlots, emptyDayStore } from "@/lib/trainingDayPlan";

/**
 * Brief §1 "Deltoid specialization can be added without a new schema or calculator" and §11
 * "New deltoid region fixture: same components/API work without forearm-specific branches":
 * the specialization page itself, rendered on the deltoid fixture. The fixture reaches the page
 * the way a production region would, through the light index and the region loader (both mocked
 * here only to hand it out; it is never registered), and the page shows it in the fixture's own
 * words: its label in the heading (two regions, so the heading picks between them), its
 * drawing's views (Front · Side · Rear), its external group, its incidental work and its one
 * measure from its own place and posture. Nothing of the forearm's shows through.
 */

vi.mock("@shared/specialization/regionIndex", async (importOriginal) => {
  const { indexWith } = await import("./__fixtures__/pageRegions");
  return indexWith(await importOriginal(), ["deltoid"]);
});
vi.mock("@/lib/specialization/loadRegion", async (importOriginal) => {
  const { loaderWith } = await import("./__fixtures__/pageRegions");
  return loaderWith(await importOriginal(), ["deltoid"]);
});

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
if (!window.matchMedia) (window as unknown as Record<string, unknown>).matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
Element.prototype.scrollIntoView = () => {};

const slots = buildDaySlots(["Upper"]);
const set = (weight: number, reps: number) => ({ weight: String(weight), reps: String(reps), unit: "kg", completed: true });
/** Wednesday of the week the clock is set to: three lateral raises and two presses, both arms. */
const sessions = [{
  id: "s-wed", title: "Upper", dayLabel: "Week 1 · Day 01 · Upper", startedAt: "2026-10-14T17:00:00.000Z", completedAt: "2026-10-14T18:00:00.000Z", status: "completed",
  exercises: [
    { id: "e1", exerciseName: "Dumbbell Lateral Raise", catalogId: 111, plannedPrescription: "3 × 12", sets: [set(10, 12), set(10, 12), set(10, 10)] },
    { id: "e2", exerciseName: "Barbell Overhead Press", catalogId: 101, plannedPrescription: "2 × 8", sets: [set(40, 8), set(40, 8)] },
  ],
}];

let lastState: SpecializationViewState | null = null;
/** The address changing under the open page (Back, a link), as Home would hand it a new state. */
let setHarnessState: ((next: SpecializationViewState) => void) | null = null;
function Harness(props: { initial?: Partial<SpecializationViewState> }) {
  const [state, setState] = useState<SpecializationViewState>({ ...defaultSpecializationState("deltoid"), ...props.initial });
  lastState = state;
  setHarnessState = setState;
  const props_: SpecializationPanelProps = {
    state,
    onStateChange: setState,
    plan: { ready: true, slots, weeks: { 1: emptyDayStore() }, choice: null, activeWeek: 1 },
    catalog: exercises,
    equipmentProfile: defaultEquipmentProfile,
    accountId: null,
    goal: "Athleticism",
    weightUnit: "kg",
    onApplyPlanChange: () => ({ ok: true, undo: () => {} }),
    onInspectExercise: () => {},
    onOpenSession: () => {},
    backLabel: null,
    onBack: null,
  };
  return createElement(SpecializationPanel, props_);
}

// The forearm's data loads on its own (loadRegion.ts); the deltoid's the mocked loader hands out at once.
beforeAll(async () => { await loadRegionData("forearm"); expect(deltoidRegionData.region.status).toBe("fixture"); });
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-16T12:00:00.000Z"));
  window.localStorage.clear();
  window.localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(sessions));
  clearSummaryCache();
  lastState = null;
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

const mapCard = () => screen.getByRole("region", { name: "Muscle map" });
const viewButtons = () => within(within(mapCard()).getByRole("group", { name: "View" })).getAllByRole("button");
/**
 * Everything the page says or labels, read aloud or not (text and accessible names), apart from
 * "How this is counted": that is the published accounting rule's own text (rules.ts,
 * specialization_exposure_v1), the same for every region and immutable once published, and it
 * names grip credit and straps as part of the rule. The region grid under the heading names the
 * other regions by design (the forearm among them), so it is left out too.
 */
const pageWords = () => {
  const page = document.body.cloneNode(true) as HTMLElement;
  page.querySelector("#spz-method")?.remove();
  page.querySelector("#spz-regions")?.remove();
  return [page.textContent ?? "", ...Array.from(page.querySelectorAll("[aria-label]")).map((element) => element.getAttribute("aria-label") ?? "")].join("\n");
};

describe("the specialization page on the deltoid fixture", () => {
  it("is the region's page in the region's own words", () => {
    render(createElement(Harness));
    expect(screen.getByRole("heading", { level: 1, name: "Deltoids" })).not.toBeNull();
    expect(viewButtons().map((button) => button.textContent)).toEqual(["Front", "Side", "Rear"]);
    expect(viewButtons().map((button) => button.getAttribute("aria-pressed"))).toEqual(["true", "false", "false"]);
    // Muscles of the region, then the external contributor under the fixture's own heading.
    expect(screen.getByRole("heading", { level: 3, name: "Muscles of the deltoids" })).not.toBeNull();
    expect(screen.getByRole("heading", { level: 3, name: "Other muscles credited here" })).not.toBeNull();
    expect(screen.getByRole("button", { name: /^Triceps brachii, Surface\. / })).not.toBeNull();
    expect(document.querySelector(".spz-legend-line")!.textContent).toMatch(/Incidental bracing · bar full at/);
    // Three two-handed lateral raises: three direct bouts on this arm, never six.
    expect(screen.getByRole("button", { name: /^Lateral deltoid, Surface\. 3 direct dynamic bouts/ })).not.toBeNull();
    expect(screen.getByRole("button", { name: /^Anterior deltoid, Surface\. 2 direct dynamic bouts/ })).not.toBeNull();
    expect(within(mapCard()).getByRole("group", { name: /^Deltoids, front view, surface layer\. 2 muscles to choose from\.$/ })).not.toBeNull();
  });

  it("says nothing of the forearm: no forearm, grip, palm or thumb side anywhere on the page", () => {
    render(createElement(Harness));
    expect(document.getElementById("spz-method")).not.toBeNull();
    expect(pageWords()).toMatch(/Deltoids/);
    expect(pageWords()).not.toMatch(/forearm|grip|palm|thumb side|pinky|upper-arm|wrist|dynamometer/i);
  });

  it("switches between the drawing's own views, keeping the first one out of the address", async () => {
    render(createElement(Harness));
    await act(async () => { fireEvent.click(viewButtons()[1]); });
    expect(lastState?.view).toBe("side");
    expect(viewButtons().map((button) => button.getAttribute("aria-pressed"))).toEqual(["false", "true", "false"]);
    expect(mapCard().querySelector(".spz-diagram")!.getAttribute("data-view")).toBe("side");
    expect(within(mapCard()).getByRole("group", { name: /^Deltoids, side view, surface layer\. 3 muscles/ })).not.toBeNull();
    await act(async () => { fireEvent.click(viewButtons()[0]); });
    expect(lastState?.view).toBeNull();
    expect(mapCard().querySelector(".spz-diagram")!.getAttribute("data-view")).toBe("front");
  });

  it("falls back to the drawing's first view when the address names one it does not have, and drops it from the address", async () => {
    render(createElement(Harness, { initial: { view: "palm" } }));
    expect(viewButtons().map((button) => button.getAttribute("aria-pressed"))).toEqual(["true", "false", "false"]);
    expect(mapCard().querySelector(".spz-diagram")!.getAttribute("data-view")).toBe("front");
    await act(async () => {});
    expect(lastState?.view).toBeNull();
  });

  it("leaves the first view out of the address when it is named, and keeps another", async () => {
    render(createElement(Harness, { initial: { view: "front" } }));
    await act(async () => {});
    expect(lastState?.view).toBeNull();
    cleanup();
    render(createElement(Harness, { initial: { view: "rear", nodeId: "deltoid.nonexistent" } }));
    await act(async () => {});
    // Two fixes at once (an unknown muscle) never undo each other: the rear view stays.
    expect([lastState?.view, lastState?.nodeId]).toEqual(["rear", null]);
  });

  it("lets the drawing's muscles be chosen: the lateral head from the side, its numbers above the drawing", async () => {
    render(createElement(Harness, { initial: { view: "side" } }));
    const drawing = within(mapCard()).getByRole("group", { name: /side view/ });
    expect(within(drawing).getAllByRole("button").map((button) => button.getAttribute("data-node")).sort()).toEqual([deltoidIds.anterior, deltoidIds.lateral, deltoidIds.posterior].sort());
    await act(async () => { fireEvent.click(within(drawing).getByRole("button", { name: /^Lateral deltoid\. / })); });
    expect(lastState?.nodeId).toBe(deltoidIds.lateral);
    const strip = within(mapCard()).getByRole("group", { name: "Selected muscle" });
    expect(within(strip).getByText("Lateral deltoid")).not.toBeNull();
    expect(within(strip).getByText(/^3 direct dynamic bouts/)).not.toBeNull();
    // The same muscle sheet opens from it, for this region's muscle.
    await act(async () => { fireEvent.click(within(strip).getByRole("button", { name: /Inspect coverage/ })); });
    const sheet = screen.getByRole("dialog", { name: "Lateral deltoid" });
    // The sheet, too, speaks in this region's words: its incidental work is "bracing", never grip.
    expect(within(sheet).getByText("Incidental bracing or steadying")).not.toBeNull();
    expect(sheet.textContent).not.toMatch(/forearm|grip|palm|thumb side|pinky|upper-arm|wrist|dynamometer/i);
  });

  it("offers circumference only under Progress, with the region's own subtitle", async () => {
    render(createElement(Harness));
    const summary = screen.getByText("Progress").closest("summary")!;
    expect(summary.textContent).toBe("ProgressCircumference, by arm");
    const details = summary.closest("details")!;
    await act(async () => { details.open = true; fireEvent(details, new Event("toggle")); });
    await act(async () => { fireEvent.click(within(details).getByRole("button", { name: "Add a reading" })); });
    expect(within(details).queryByRole("group", { name: "What was measured" })).toBeNull();
    expect(within(details).queryByRole("button", { name: "Grip strength" })).toBeNull();
    expect(within(details).getByLabelText(/^Circumference \(cm\)$/)).not.toBeNull();
    expect(within(details).getByLabelText(/^Tape \(optional\)$/)).not.toBeNull();
    expect(details.textContent).not.toMatch(/grip|dynamometer|forearm/i);
  });
});

describe("the same page on the forearm, for contrast", () => {
  it("reads the forearm's words from the forearm's data: Palm · Back · Thumb side, the upper-arm group, grip", async () => {
    render(createElement(Harness, { initial: { regionId: "forearm" } }));
    expect(screen.getByRole("heading", { level: 1, name: "Forearms" })).not.toBeNull();
    expect(viewButtons().map((button) => button.textContent)).toEqual(["Palm", "Back", "Thumb side"]);
    expect(screen.getByRole("heading", { level: 3, name: "Upper-arm muscles credited here" })).not.toBeNull();
    expect(document.querySelector(".spz-legend-line")!.textContent).toMatch(/Incidental grip · bar full at/);
    expect(screen.getByText("Progress").closest("summary")!.textContent).toBe("ProgressCircumference and grip, by arm");
    await act(async () => { fireEvent.click(viewButtons()[2]); });
    expect(lastState?.view).toBe("thumb");
    expect(within(mapCard()).getByRole("group", { name: /^Forearms, thumb side view, surface layer\./ })).not.toBeNull();
    await act(async () => { fireEvent.click(viewButtons()[0]); });
    expect(lastState?.view).toBeNull();
  });

  it("starts another region's reading afresh: a grip half-entered on the forearm leaves no dynamometer posture on the deltoids", async () => {
    render(createElement(Harness, { initial: { regionId: "forearm" } }));
    const details = () => screen.getByText("Progress").closest("details")!;
    await act(async () => { details().open = true; fireEvent(details(), new Event("toggle")); });
    await act(async () => { fireEvent.click(within(details()).getByRole("button", { name: "Add a reading" })); });
    await act(async () => { fireEvent.click(within(details()).getByRole("button", { name: "Grip strength" })); });
    expect((within(details()).getByLabelText(/^Posture$/) as HTMLSelectElement).value).toBe("elbow_90_supported");
    await act(async () => { setHarnessState!({ ...lastState!, regionId: "deltoid", nodeId: null, view: null }); });
    expect(screen.getByRole("heading", { level: 1, name: "Deltoids" })).not.toBeNull();
    // The page below the heading is the deltoid's own (keyed by region): nothing the forearm's left open carries over.
    expect(details().open).toBe(false);
    await act(async () => { details().open = true; fireEvent(details(), new Event("toggle")); });
    await act(async () => { fireEvent.click(within(details()).getByRole("button", { name: "Add a reading" })); });
    expect(within(details()).queryByRole("button", { name: "Grip strength" })).toBeNull();
    expect((within(details()).getByLabelText(/^Where \(landmark\)$/) as HTMLInputElement).value).toBe("Around the shoulder");
    expect((within(details()).getByLabelText(/^Posture$/) as HTMLSelectElement).value).toBe("arm_relaxed_hanging");
    expect(details().textContent).not.toMatch(/grip|dynamometer|forearm/i);
  });
});
