// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SessionDraftPanel } from "./SessionDraftPanel";
import { getGymTimeBudget } from "@/lib/gymTimeBudget";

afterEach(() => { document.body.innerHTML = ""; });

const draw = (props: Partial<Parameters<typeof SessionDraftPanel>[0]> = {}) =>
  render(React.createElement(SessionDraftPanel, {
    dayLabel: "Day 05 · Sport transfer",
    minutes: 60,
    budget: getGymTimeBudget(60),
    loadout: "Sport Transfer",
    exerciseCount: 0,
    estimatedMinutes: 45,
    replacingCount: 0,
    onMinutes: vi.fn(),
    onLoadout: vi.fn(),
    onDraft: vi.fn(),
    ...props,
  } as Parameters<typeof SessionDraftPanel>[0]));

describe("session draft duration picker", () => {
  it("says the unit once, in the question, rather than on all five buttons", () => {
    draw();
    expect(screen.getByText(/How many minutes have you got today\?/i)).toBeTruthy();
    const chips = [...document.querySelectorAll(".session-draft-chips-time .session-draft-chip")];
    expect(chips.map((chip) => (chip as HTMLElement).innerText ?? chip.textContent)).toEqual(["30", "45", "60", "75", "90+"]);
    expect(document.querySelectorAll(".session-draft-chips-time small")).toHaveLength(0);
  });

  it("still names the unit to a screen reader, which reads one button at a time", () => {
    // Dropping the visible repetition must not leave a button announced as "30".
    draw();
    expect(screen.getByLabelText("30 minutes")).toBeTruthy();
    expect(screen.getByLabelText("75 minutes")).toBeTruthy();
    expect(screen.getByLabelText("90 or more minutes")).toBeTruthy();
  });
});
