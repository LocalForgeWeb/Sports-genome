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

  it("gives an optional feedback signal for the accessible recorded-region selection and view switch", () => {
    const onSelect = vi.fn();
    render(React.createElement(StrengthGenomeBodyMap, { regions, activePriorityIds: new Set<string>(), selectedRegionId: undefined, onSelect }));

    fireEvent.click(screen.getByText("Choose a region"));
    fireEvent.click(screen.getByText("Biceps"));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining(biceps));
    expect(feedback.emit).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(feedback.emit).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: "Front" })).toBeTruthy();
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
