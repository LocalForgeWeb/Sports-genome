// @vitest-environment jsdom
import React, { createElement, useState } from "react";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SpecializationPanel, type SpecializationPanelProps } from "./SpecializationPanel";
import { exercises } from "@/lib/exerciseCatalog";
import { defaultEquipmentProfile } from "@/lib/equipmentProfile";
import { loadRegionData } from "@/lib/specialization/loadRegion";
import { loadedRegionExtras, useRegionExtras } from "@/lib/specialization/regionExtras";
import { defaultSpecializationState, type SpecializationViewState } from "@/lib/specialization/viewState";
import { buildDaySlots, emptyDayStore } from "@/lib/trainingDayPlan";

/**
 * Nothing of tendon exposure is fetched before the section first opens (11-forearm-research-and-stack.md
 * §4.3, §7.5): not its code (`TendonExposure.tsx`, a chunk of its own), not the region's areas
 * (`regions/<region>/tendonAreas.ts`, through the extras loader), not the week summaries. The page's
 * closed card is all it has. Opening the card fetches both, once, and keeps the content mounted.
 */

const imports = vi.hoisted(() => ({ tendonExposure: 0 }));
vi.mock("./TendonExposure", async (importOriginal) => {
  imports.tendonExposure += 1;
  return importOriginal();
});
vi.mock("@/lib/specialization/regionExtras", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/specialization/regionExtras")>();
  return { ...actual, useRegionExtras: vi.fn(actual.useRegionExtras) };
});

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
if (!window.matchMedia) (window as unknown as Record<string, unknown>).matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
Element.prototype.scrollIntoView = () => {};
window.scrollBy = (() => {}) as typeof window.scrollBy;
window.scrollTo = (() => {}) as typeof window.scrollTo;

const slots = buildDaySlots(["Upper"]);

function Harness() {
  const [state, setState] = useState<SpecializationViewState>(defaultSpecializationState("forearm"));
  const props: SpecializationPanelProps = {
    state, onStateChange: setState,
    plan: { ready: true, slots, weeks: { 1: emptyDayStore() }, choice: null, activeWeek: 1 },
    catalog: exercises, equipmentProfile: defaultEquipmentProfile, accountId: null, goal: "Muscle growth", weightUnit: "lb",
    onApplyPlanChange: () => ({ ok: true, undo: () => {} }), onApplyPlanChanges: async () => ({ ok: false, reason: "Not here." }), aboutMeArea: null,
    onInspectExercise: () => {}, onOpenSession: () => {}, backLabel: null, onBack: null,
  };
  return createElement(SpecializationPanel, props);
}

beforeAll(async () => { await loadRegionData("forearm"); });
beforeEach(() => { window.localStorage.clear(); vi.mocked(useRegionExtras).mockClear(); });
afterEach(() => cleanup());

describe("tendon exposure, before and after it first opens", () => {
  it("fetches nothing of its own with the page, then its code and the region's areas once on first open, and stays mounted", async () => {
    render(createElement(Harness));
    await act(async () => {});
    const section = document.getElementById("spz-tendon") as HTMLDetailsElement;
    expect(section).not.toBeNull();
    // Closed: the card's summary only. No code, no areas, no extras asked for.
    expect(imports.tendonExposure).toBe(0);
    expect(loadedRegionExtras("forearm")).toBeUndefined();
    expect(vi.mocked(useRegionExtras).mock.calls.every(([, enabled]) => enabled === false)).toBe(true);
    expect(section.querySelector(".spz-tendon")).toBeNull();

    await act(async () => { section.open = true; fireEvent(section, new Event("toggle")); });
    await waitFor(() => expect(section.querySelector(".spz-tendon")).not.toBeNull(), { timeout: 10000 });
    expect(imports.tendonExposure).toBe(1);
    expect(loadedRegionExtras("forearm")?.tendonAreas?.length).toBe(4);

    // Closed again, the content stays (as Progress does), and opening again fetches nothing more.
    await act(async () => { section.open = false; fireEvent(section, new Event("toggle")); });
    expect(section.querySelector(".spz-tendon")).not.toBeNull();
    await act(async () => { section.open = true; fireEvent(section, new Event("toggle")); });
    expect(imports.tendonExposure).toBe(1);
  });
});
