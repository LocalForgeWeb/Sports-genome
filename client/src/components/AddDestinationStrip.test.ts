// @vitest-environment jsdom
import React, { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AddDestinationStrip } from "./AddDestinationStrip";
import type { DaySlot } from "@/lib/trainingDayPlan";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const slots = [
  { key: "0-Push", ordinal: "Day 01", day: "Push", index: 0, label: "Day 01 · Push" },
  { key: "1-Pull", ordinal: "Day 02", day: "Pull", index: 1, label: "Day 02 · Pull" },
  { key: "2-Legs", ordinal: "Day 03", day: "Legs", index: 2, label: "Day 03 · Legs" },
] as unknown as DaySlot[];

const counts: Record<string, number> = { "0-Push": 5, "1-Pull": 6 };

function mount(over: Partial<Parameters<typeof AddDestinationStrip>[0]> = {}) {
  return render(createElement(AddDestinationStrip, {
    week: 2, slots, activeIndex: 1, exerciseCountFor: (slot) => counts[slot.key] || 0, onChoose: () => undefined, ...over,
  }));
}

afterEach(cleanup);

/**
 * A plus button adds to the active training day, which is chosen on Plan and
 * was named nowhere on the screens that carry plus buttons.
 */
describe("the add-destination strip", () => {
  it("names the week and day a plus will add to", () => {
    mount();
    expect(document.querySelector(".add-destination > summary")!.textContent).toContain("Adding to Week 2 · Pull");
    expect(screen.getByText(/change/i)).toBeTruthy();
  });

  it("offers the same days Plan does, with what each already holds, and marks the current one", () => {
    mount();
    fireEvent.click(document.querySelector(".add-destination > summary")!);
    const options = screen.getAllByRole("button");
    expect(options.map((option) => option.textContent)).toEqual(["Day 01 · Push5 planned", "Day 02 · Pull6 planned", "Day 03 · LegsEmpty"]);
    expect(options.map((option) => option.getAttribute("aria-pressed"))).toEqual(["false", "true", "false"]);
  });

  it("changes the day through the owner's handler and closes", () => {
    const onChoose = vi.fn();
    mount({ onChoose });
    const details = document.querySelector<HTMLDetailsElement>(".add-destination")!;
    fireEvent.click(details.querySelector("summary")!);
    expect(details.open).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: /Day 03 · Legs/ }));
    expect(onChoose).toHaveBeenCalledWith(2);
    expect(details.open).toBe(false);
  });

  it("renders nothing for a plan with no days", () => {
    mount({ slots: [] });
    expect(document.querySelector(".add-destination")).toBeNull();
  });
});
