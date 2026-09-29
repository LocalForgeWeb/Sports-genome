// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AthleteBaselineQuiz } from "./AthleteBaselineQuiz";
import type { SportProfile } from "@/lib/sportMovementDatabase";

const sports = [{ id: "soccer", label: "Soccer", movementFamilies: [] }] as unknown as SportProfile[];

const advance = () => fireEvent.click(screen.getByRole("button", { name: /^(Continue|Skip for now)$/ }));

/** Step forward with the default answers until the step headed by `heading` is showing. */
function advanceTo(heading: string) {
  for (let guard = 0; guard < 20 && !screen.queryByText(heading); guard += 1) advance();
  expect(screen.getByText(heading)).toBeTruthy();
}

/** Start the quiz and answer its first questions in the given context mode. */
function startQuiz(mode: "sport" | "general" | "undecided") {
  const onComplete = vi.fn();
  render(React.createElement(AthleteBaselineQuiz, { sports, onComplete }));
  advance();
  const modeLabel = { sport: /I train for a sport/, general: /General strength and resilience/, undecided: /Decide later/ }[mode];
  fireEvent.click(screen.getByRole("button", { name: modeLabel }));
  advance();
  if (mode === "sport") {
    fireEvent.click(screen.getByRole("button", { name: /Choose your sport/ }));
    fireEvent.click(screen.getByRole("option", { name: /Soccer/ }));
    advance();
  }
  return onComplete;
}

/** Answer the quiz with its defaults, in the given context mode, up to the last step. */
function reachPreview(mode: "sport" | "general" | "undecided") {
  const onComplete = startQuiz(mode);
  advanceTo("all set.");
  return onComplete;
}

describe("The quiz's last step offers only what it will do", () => {
  afterEach(() => cleanup());

  it.each(["general", "undecided"] as const)("offers one way on, to an empty plan, when there is no sport (%s)", (mode) => {
    const onComplete = reachPreview(mode);
    expect(screen.queryByRole("button", { name: /Build my plan/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Skip" })).toBeNull();
    expect(screen.getByText(/Your plan starts empty, ready for you to fill\./)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Open my plan" }));
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ stackMode: "custom", sportContextMode: mode }));
  });

  it("still builds a suggested plan from a sport's demands", () => {
    const onComplete = reachPreview("sport");
    expect(screen.queryByRole("button", { name: "Open my plan" })).toBeNull();
    expect(screen.getByRole("button", { name: "Skip" })).toBeTruthy();
    expect(screen.getByText("Here is what we will build from. Nothing here is locked.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Build my plan/ }));
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ stackMode: "suggested", sportContextMode: "sport", sportId: "soccer" }));
  });
});

describe("The quiz's typed fields for assistive tech", () => {
  afterEach(() => cleanup());

  it("names each typed field by what it holds, not by the unit beside it", () => {
    startQuiz("general");
    advanceTo("call you?");
    expect(screen.getByRole("textbox", { name: "Preferred name" })).toBeTruthy();

    advanceTo("kilograms?");
    fireEvent.click(screen.getByRole("button", { name: /Kilograms/ }));
    advanceTo("if you want.");
    expect(screen.getByRole("textbox", { name: "Body weight in kg" })).toBeTruthy();
    expect(screen.queryByRole("textbox", { name: "kg" })).toBeNull();
    expect(screen.getByRole("textbox", { name: "Birth year" })).toBeTruthy();
  });
});
