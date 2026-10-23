// @vitest-environment jsdom
import React, { createElement, useState } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SpecializationPanel, type SpecializationPanelProps } from "./SpecializationPanel";
import { clearTendonWeekCounts } from "./TendonExposure";
import { exercises } from "@/lib/exerciseCatalog";
import { defaultEquipmentProfile } from "@/lib/equipmentProfile";
import { deltoidIds, deltoidRegionData } from "@/lib/specialization/__fixtures__/deltoidRegion";
import { loadRegionData } from "@/lib/specialization/loadRegion";
import { clearSummaryCache } from "@/lib/specialization/useSpecializationSummary";
import { defaultSpecializationState, type SpecializationViewState } from "@/lib/specialization/viewState";
import { buildDaySlots, emptyDayStore } from "@/lib/trainingDayPlan";

/**
 * Tendon exposure on a second region with no code of its own (11-forearm-research-and-stack.md §4.6):
 * the deltoid fixture's content sets `sections.tendonExposure`, and its extras carry two areas
 * (`deltoidTendonAreas`), handed out by the region-extras loader as a region's own `tendonAreas.ts`
 * would be. The section shows them in the fixture's own words: its areas and groups, the lateral head
 * counted once in each area, the anterior head's draft pair kept out of that one group, the posterior
 * head not placed with its reason, the group's caveat; "Attaches at" on its muscle sheet; and nothing
 * of the forearm's, and none of §4.4's words.
 */

vi.mock("@shared/specialization/regionIndex", async (importOriginal) => {
  const { indexWith } = await import("./__fixtures__/pageRegions");
  return indexWith(await importOriginal(), ["deltoid"]);
});
vi.mock("@/lib/specialization/loadRegion", async (importOriginal) => {
  const { loaderWith } = await import("./__fixtures__/pageRegions");
  return loaderWith(await importOriginal(), ["deltoid"]);
});
// The deltoid's extras (rep profiles and tendon areas), merged as the loader merges a region's files: data only.
vi.mock("@/lib/specialization/regionExtras", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/specialization/regionExtras")>();
  const { deltoidRepProfiles, deltoidTendonAreas } = await import("@/lib/specialization/__fixtures__/deltoidRegion");
  const extras = { ...deltoidRepProfiles, ...deltoidTendonAreas, referenceSources: [] };
  const ready = { status: "ready" as const, extras };
  return {
    ...actual,
    useRegionExtras: (regionId: string, enabled?: boolean) => (regionId === "deltoid" ? ready : actual.useRegionExtras(regionId, enabled)),
    loadRegionExtras: (regionId: string) => (regionId === "deltoid" ? Promise.resolve(extras) : actual.loadRegionExtras(regionId)),
  };
});

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
if (!window.matchMedia) (window as unknown as Record<string, unknown>).matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
Element.prototype.scrollIntoView = () => {};
window.scrollBy = (() => {}) as typeof window.scrollBy;
window.scrollTo = (() => {}) as typeof window.scrollTo;

const slots = buildDaySlots(["Upper"]);
const set = (weight: number, reps: number) => ({ weight: String(weight), reps: String(reps), unit: "kg", completed: true });
/** Wednesday of the week the clock is set to: three lateral raises and two presses. */
const sessions = [{
  id: "s-wed", title: "Upper", dayLabel: "Week 1 · Day 01 · Upper", startedAt: "2026-10-14T17:00:00.000Z", completedAt: "2026-10-14T18:00:00.000Z", status: "completed",
  exercises: [
    { id: "e1", exerciseName: "Dumbbell Lateral Raise", catalogId: 111, plannedPrescription: "3 × 12", sets: [set(10, 12), set(10, 12), set(10, 10)] },
    { id: "e2", exerciseName: "Barbell Overhead Press", catalogId: 101, plannedPrescription: "2 × 8", sets: [set(40, 8), set(40, 8)] },
  ],
}];

function Harness() {
  const [state, setState] = useState<SpecializationViewState>(defaultSpecializationState("deltoid"));
  const props: SpecializationPanelProps = {
    state, onStateChange: setState,
    plan: { ready: true, slots, weeks: { 1: emptyDayStore() }, choice: null, activeWeek: 1 },
    catalog: exercises, equipmentProfile: defaultEquipmentProfile, accountId: null, goal: "Athleticism", weightUnit: "kg",
    onApplyPlanChange: () => ({ ok: true, undo: () => {} }), onApplyPlanChanges: async () => ({ ok: false, reason: "Not here." }), aboutMeArea: null,
    onInspectExercise: () => {}, onOpenSession: () => {}, backLabel: null, onBack: null,
  };
  return createElement(SpecializationPanel, props);
}

beforeAll(async () => { await loadRegionData("forearm"); expect(deltoidRegionData.region.status).toBe("fixture"); });
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-16T12:00:00.000Z"));
  window.localStorage.clear();
  window.localStorage.setItem("sports-genome-device-workout-history-v1", JSON.stringify(sessions));
  clearSummaryCache();
  clearTendonWeekCounts();
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

const section = () => document.getElementById("spz-tendon") as HTMLDetailsElement;
const click = async (element: Element) => { await act(async () => { fireEvent.click(element); }); await act(async () => {}); };
async function openSection() {
  await act(async () => { section().open = true; fireEvent(section(), new Event("toggle")); });
  await waitFor(() => expect(section().querySelector(".spz-tendon")).not.toBeNull(), { timeout: 10000 });
}
const areaButtons = () => Array.from(section().querySelectorAll<HTMLButtonElement>(".spz-tendon-area"));
const dialog = () => screen.getByRole("dialog");
const NEVER = /risk|safe|danger|injur|tendonitis|tendinitis|tendinopathy|overuse|overload|strain|damage|warning|alert|limit|budget|threshold|zone|spike|red flag|acwr|acute:chronic|push through|%/i;
const FOREARM = /forearm|grip|palm|thumb|pinky|upper-arm|wrist|elbow|finger|dynamometer/i;
const stringsOf = (root: Element) => [root.textContent ?? "", ...Array.from(root.querySelectorAll("[aria-label]")).map((element) => element.getAttribute("aria-label") ?? "")].join("\n");

describe("tendon exposure on the deltoid fixture", () => {
  it("shows the fixture's two areas, each set once per area, in its own words and none of the forearm's", async () => {
    render(createElement(Harness));
    await act(async () => {});
    expect(section().querySelector(":scope > summary")!.textContent).toBe("Tendon exposureSets by attachment area");
    await openSection();
    // Three raises (lateral head) and two presses (anterior head): five at the front; the raises only on the outside, where the anterior head is a draft.
    expect(areaButtons().map((button) => (button.textContent ?? "").replace(/\u00a0/g, " "))).toEqual(["Front of the shoulder · 5", "Outer shoulder · 3"]);
    const groups = () => Array.from(section().querySelectorAll(".spz-tendon-groups > li")).map((item) => item.textContent);
    expect(groups()).toEqual(["Front and side heads · 5 sets5 target · 0 holds · 0 other"]);
    await click(areaButtons()[1]);
    expect(groups()).toEqual(["Side and front heads · 3 sets3 target · 0 holds · 0 otherNot placed here yet: Anterior deltoid"]);
    // The posterior head is in no group: said once, with its reason.
    expect(section().querySelector(".spz-tendon-not-placed")!.textContent).toBe("Posterior deltoid Test fixture: a head in no group, so the not-placed line runs on a second region.");
    // A group's caveat is said with its sets.
    await click(areaButtons()[0]);
    await click(section().querySelector("button.spz-tendon-group")!);
    expect(dialog().textContent).toContain("Test fixture: a caveat, said on the page.");
    expect(stringsOf(dialog())).not.toMatch(FOREARM);
    await click(within(dialog()).getByRole("button", { name: "Close" }));
    (section().querySelector("#spz-tendon-method") as HTMLDetailsElement).open = true;
    expect(stringsOf(section())).not.toMatch(FOREARM);
    expect(stringsOf(section())).not.toMatch(NEVER);
  });

  it("says where the lateral head attaches on its sheet, and opens the section there", async () => {
    render(createElement(Harness));
    await act(async () => {});
    await click(Array.from(document.querySelectorAll<HTMLElement>(".spz-row")).find((row) => /^Lateral deltoid, /.test(row.getAttribute("aria-label") ?? ""))!);
    const line = await waitFor(() => { const found = dialog().querySelector(".spz-attaches"); expect(found).not.toBeNull(); return found!; });
    expect(line.querySelector("p")!.textContent).toBe("Attaches at: front of the shoulder (front and side heads), outer shoulder (side and front heads).");
    await click(within(line as HTMLElement).getByRole("button", { name: /See tendon exposure/ }));
    await waitFor(() => expect(section().querySelector(".spz-tendon")).not.toBeNull(), { timeout: 10000 });
    expect(areaButtons()[0].getAttribute("aria-pressed")).toBe("true");
    // The posterior head is placed nowhere: no line on its sheet, once the areas are there.
    await click(Array.from(document.querySelectorAll<HTMLElement>(".spz-row")).find((row) => /^Posterior deltoid, /.test(row.getAttribute("aria-label") ?? ""))!);
    expect(dialog().querySelector("h2")!.textContent).toBe(deltoidRegionData.nodes.find((node) => node.id === deltoidIds.posterior)!.name);
    expect(dialog().querySelector(".spz-attaches")).toBeNull();
  });
});
