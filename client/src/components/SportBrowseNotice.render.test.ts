// @vitest-environment jsdom
import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SportBrowseNotice } from "./SportBrowseNotice";

afterEach(() => { cleanup(); });

const draw = (props: { browsing?: boolean; adoptClearsDays?: boolean; adoptClearsRole?: boolean } = {}) => render(createElement(SportBrowseNotice, {
  browsing: props.browsing ?? true,
  browsedSportLabel: "Soccer",
  ownSportLabel: "Wrestling",
  onAdopt: () => {},
  onReturn: () => {},
  ...(props.adoptClearsDays === undefined ? {} : { adoptClearsDays: props.adoptClearsDays }),
  ...(props.adoptClearsRole === undefined ? {} : { adoptClearsRole: props.adoptClearsRole }),
}));
const consequenceOfAdopting = () => document.getElementById(screen.getByRole("button", { name: /Make Soccer my sport/ }).getAttribute("aria-describedby")!)?.textContent ?? "";

/**
 * "Make Soccer my sport" clears every saved training day. The notice used to say
 * "Nothing here changes it" right beside that button, so the athlete learned
 * what the tap cost from the toast afterwards.
 */
describe("The browse notice says what adopting the sport costs before the tap", () => {
  it("states that the saved training days are cleared, and ties that line to the button", () => {
    draw();
    const adopt = screen.getByRole("button", { name: /Make Soccer my sport/ });
    const describedBy = adopt.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    const consequence = document.getElementById(describedBy!);
    expect(consequence?.textContent).toContain("clears your saved training days");
    expect(consequence?.textContent).toContain("undo");
    expect(document.body.textContent).not.toContain("Nothing here changes it");
  });

  it("names the role or style too, when the athlete has one to lose", () => {
    // chooseSport clears the old sport's role or style along with the days, so a
    // Freestyle wrestler has to hear about both before the tap, not after it.
    draw({ adoptClearsRole: true });
    expect(consequenceOfAdopting()).toBe("Making Soccer your sport clears your saved training days and your role or style. You can undo it straight after.");
  });

  it("does not mention a role or style the athlete never chose", () => {
    draw({ adoptClearsRole: false });
    expect(consequenceOfAdopting()).toBe("Making Soccer your sport clears your saved training days. You can undo it straight after.");
    expect(document.body.textContent).not.toContain("role or style");
  });

  it("says nothing about clearing when adopting would clear nothing", () => {
    draw({ adoptClearsDays: false });
    expect(document.body.textContent).not.toContain("clears your saved training days");
    expect(screen.getByRole("button", { name: /Make Soccer my sport/ }).getAttribute("aria-describedby")).toBeNull();
  });

  it("renders nothing while the athlete is on their own sport", () => {
    const { container } = draw({ browsing: false });
    expect(container.innerHTML).toBe("");
  });
});
