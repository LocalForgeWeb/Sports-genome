// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { strengthRegionDefinitions } from "../../../shared/strengthGenomeDefinitions";

const feedback = vi.hoisted(() => ({ emit: vi.fn() }));

vi.mock("body-muscles", () => ({
  ViewSide: { FRONT: "front", BACK: "back" },
  BodyChart: class {
    constructor(container: HTMLElement, options: { onMuscleClick: (muscleId: string) => void }) {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.classList.add("body-chart-muscle");
      path.setAttribute("role", "button");
      path.setAttribute("tabindex", "0");
      path.setAttribute("aria-label", "Biceps");
      path.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") options.onMuscleClick("biceps-left"); });
      svg.appendChild(path);
      container.appendChild(svg);
    }
    update() {}
    destroy() {}
  },
}));
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

  it("keeps a rendered muscle path keyboard-addressable and routes its activation through optional feedback", () => {
    const onSelect = vi.fn();
    render(React.createElement(StrengthGenomeBodyMap, { regions, activePriorityIds: new Set<string>(), selectedRegionId: undefined, onSelect }));
    const muscle = document.querySelector<SVGPathElement>(".strength-body-chart .body-chart-muscle")!;
    expect(muscle.getAttribute("role")).toBe("button");
    expect(muscle.getAttribute("tabindex")).toBe("0");
    expect(muscle.getAttribute("aria-label")).toBe("Biceps");
    fireEvent.keyDown(muscle, { key: "Enter" });
    expect(feedback.emit).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining(biceps));
  });
});
