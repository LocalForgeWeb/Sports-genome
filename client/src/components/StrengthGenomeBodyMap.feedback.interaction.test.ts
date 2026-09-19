// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { strengthRegionDefinitions } from "../../../shared/strengthGenomeDefinitions";

const feedback = vi.hoisted(() => ({ emit: vi.fn() }));

vi.mock("@/lib/interactionFeedback", () => ({ emitInteractionFeedback: feedback.emit }));

import { StrengthGenomeBodyMap } from "./StrengthGenomeBodyMap";

const biceps = strengthRegionDefinitions.find((region) => region.id === "biceps")!;
const chest = strengthRegionDefinitions.find((region) => region.id === "chest")!;
const regions = [
  { ...biceps, state: "OBSERVED_TEST_CONTEXT" as const },
  { ...chest, state: "INSUFFICIENT_DATA" as const },
];

describe("Strength Genome map interaction feedback", () => {
  afterEach(() => { feedback.emit.mockReset(); document.body.innerHTML = ""; });

  it("gives an optional feedback signal for the written region route, which needs no disclosure to open", () => {
    const onSelect = vi.fn();
    render(React.createElement(StrengthGenomeBodyMap, { regions, activePriorityIds: new Set<string>(), selectedRegionId: undefined, onSelect }));

    // No "Choose a region" summary to open first: the list is the primary route
    // now that both bodies share the canvas, so it is on screen already.
    expect(screen.queryByText("Choose a region")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Biceps, On record" }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining(biceps));
    expect(feedback.emit).toHaveBeenCalledTimes(1);
  });

  it("puts both bodies on one canvas, so there is no view to switch to", () => {
    render(React.createElement(StrengthGenomeBodyMap, { regions, activePriorityIds: new Set<string>(), selectedRegionId: undefined, onSelect: vi.fn() }));
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Front" })).toBeNull();
    expect(document.querySelector('.anatomy-figure[data-view="both"]')).toBeTruthy();
    // One canvas carrying both bodies: an anterior-only region and a
    // posterior-only one are drawn together, with no flip between them.
    expect(document.querySelector('.anatomy-muscle[data-muscle="chest"]')).toBeTruthy();
    expect(document.querySelector('.anatomy-muscle[data-muscle="glutes"]')).toBeTruthy();
  });

  it("keeps a rendered muscle region keyboard-addressable and routes its activation through optional feedback", () => {
    const onSelect = vi.fn();
    render(React.createElement(StrengthGenomeBodyMap, { regions, activePriorityIds: new Set<string>(), selectedRegionId: undefined, onSelect }));

    // The selectable unit is the canonical region, not one drawn path: both
    // sides and every visual subdivision answer to the same object.
    const muscle = document.querySelector<SVGGElement>('.anatomy-hit[aria-label^="Biceps"]')!;
    expect(muscle).toBeTruthy();
    expect(muscle.getAttribute("role")).toBe("button");
    // Roving tabindex — the figure is one stop in the page's tab order and
    // arrow keys move inside it, rather than 18 stops burying the rest of the
    // page. So exactly one region carries tabindex 0.
    const tabbable = document.querySelectorAll('.anatomy-hit[tabindex="0"]');
    expect(tabbable.length).toBe(1);
    expect(muscle.getAttribute("aria-label")).toBe("Biceps, primary role");

    fireEvent.keyDown(muscle, { key: "Enter" });
    expect(feedback.emit).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining(biceps));
  });

  it("puts the athlete's own recorded coverage on the figure, and nothing else", () => {
    render(React.createElement(StrengthGenomeBodyMap, { regions, activePriorityIds: new Set<string>(), selectedRegionId: undefined, onSelect: vi.fn() }));

    // Biceps has a lift on record; chest does not. Highlighting says where lifts
    // exist, never how strong the athlete is, so there is no third state.
    expect(document.querySelector('.anatomy-muscle[data-muscle="biceps"]')?.getAttribute("data-role")).toBe("primary");
    expect(document.querySelector('.anatomy-muscle[data-muscle="chest"]')?.getAttribute("data-role")).toBe("neutral");
  });
});
