// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AthleteBaselineQuiz } from "./AthleteBaselineQuiz";
import { birthYearRange } from "@/lib/birthYear";

const advance = () => fireEvent.click(screen.getByRole("button", { name: /^(Continue|Skip for now)$/ }));

/** Answer the quiz with its defaults, with no sport, up to the step headed by `heading`. */
function reach(heading: string) {
  const onComplete = vi.fn();
  render(React.createElement(AthleteBaselineQuiz, { sports: [], onComplete }));
  advance();
  fireEvent.click(screen.getByRole("button", { name: /General strength and resilience/ }));
  for (let guard = 0; guard < 20 && !screen.queryByText(heading); guard += 1) advance();
  expect(screen.getByText(heading)).toBeTruthy();
  return onComplete;
}

/**
 * A year the profile will not take, "199" or one in the future, used to be dropped without a
 * word when the plan was built. The quiz now says why, the same way About Me does.
 */
describe("Typing a birth year during onboarding", () => {
  afterEach(() => cleanup());

  it("says why a year will not be saved, and keeps one that will", () => {
    const onComplete = reach("if you want.");
    const year = screen.getByRole("textbox", { name: "Birth year" }) as HTMLInputElement;
    const { min, max } = birthYearRange();

    fireEvent.change(year, { target: { value: String(max + 5) } });
    expect(screen.getByRole("status").textContent).toBe(`Between ${min + 1} and ${max}.`);
    expect(year.getAttribute("aria-describedby")).toBe("athlete-quiz-birth-year-hint");

    fireEvent.focus(year);
    fireEvent.change(year, { target: { value: "199" } });
    expect(screen.queryByRole("status")).toBeNull();
    fireEvent.blur(year);
    expect(screen.getByRole("status").textContent).toBe("Four digits, like 1998.");

    fireEvent.focus(year);
    fireEvent.change(year, { target: { value: "1998" } });
    expect(screen.queryByRole("status")).toBeNull();
    expect(year.getAttribute("aria-describedby")).toBeNull();

    advance();
    fireEvent.click(screen.getByRole("button", { name: "Open my plan" }));
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ baseline: expect.objectContaining({ birthYear: 1998 }) }));
  });
});
