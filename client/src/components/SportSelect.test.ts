// @vitest-environment jsdom
import React, { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SportSelect } from "./SportSelect";
import type { SportProfile } from "@/lib/sportMovementDatabase";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
afterEach(cleanup);

const sport = (id: string, label: string, movementFamilies: string[]): SportProfile =>
  ({ id, label, movementFamilies } as unknown as SportProfile);

// Deliberately out of alphabetical order, the way the database stores them.
const sports = [
  sport("wrestling", "Wrestling", ["Level change and penetration entry", "Clinch control, pulling, and rotational steering"]),
  sport("ice-hockey", "Ice hockey", ["Acceleration and propulsion", "contact and resisted grappling"]),
  sport("baseball", "Baseball", ["Overhand throwing and arm deceleration"]),
  sport("brazilian-jiu-jitsu", "Brazilian jiu-jitsu", ["Hip escape and space creation"]),
];
const labelFor = (profile: SportProfile) => profile.label === "Brazilian jiu-jitsu" ? "BJJ" : profile.label;

const open = (onChange = vi.fn()) => {
  render(createElement(SportSelect, { sports, value: "", onChange, labelFor }));
  fireEvent.click(screen.getByRole("button", { name: /choose your sport/i }));
  return onChange;
};
// queryAll, not getAll: "no options" is a result this suite asserts on, not a
// lookup failure, and getAllByRole throws on an empty list.
const options = () => screen.queryAllByRole("option").map((node) => node.querySelector("strong")?.textContent);
const type = (value: string) => fireEvent.change(screen.getByLabelText("Search sports"), { target: { value } });

describe("choosing a sport from a searchable list", () => {
  it("opens to the full list in alphabetical order, by the name actually shown", () => {
    open();
    // BJJ sorts under B, not under the stored "Brazilian jiu-jitsu".
    expect(options()).toEqual(["Baseball", "BJJ", "Ice hockey", "Wrestling"]);
  });

  it("puts the search field under the athlete's cursor, so typing just works", () => {
    open();
    expect(screen.getByLabelText("Search sports")).toBe(document.activeElement);
  });

  it("filters by name, including the stored name behind a short display label", () => {
    open();
    type("wre");
    expect(options()).toEqual(["Wrestling"]);
    // "BJJ" is what is shown; "jiu" is what someone would type.
    type("jiu");
    expect(options()).toEqual(["BJJ"]);
  });

  it("does not let a two-letter query drag in movement-family noise", () => {
    open();
    // "ac" opens "Acceleration and propulsion" but appears in no sport name, so
    // it isolates the gate: below three characters the family search stays shut.
    type("ac");
    expect(options()).toEqual([]);
    expect(screen.getByText(/No sport matches/)).toBeTruthy();
    // No list is drawn, so the trigger must not name one.
    expect(screen.getByRole("button", { name: /choose your sport/i }).hasAttribute("aria-controls")).toBe(false);
    // One more character, and the same query reaches the family it describes.
    type("acc");
    expect(options()).toEqual(["Ice hockey"]);
  });

  it("matches a movement family from a word boundary, and says which one", () => {
    open();
    type("grappling");
    expect(options()).toEqual(["Ice hockey"]);
    // Ice hockey lists "contact and resisted grappling" while wrestling calls the
    // same thing a clinch. Stating the reason is what stops that reading as a bug.
    expect(screen.getByText('Matches “contact and resisted grappling”')).toBeTruthy();
  });

  it("commits on click and closes", () => {
    const onChange = open();
    fireEvent.click(screen.getAllByRole("option")[0]);
    expect(onChange).toHaveBeenCalledWith("baseball");
    expect(screen.queryByLabelText("Search sports")).toBeNull();
  });

  it("moves with the arrow keys and commits on Enter", () => {
    const onChange = open();
    const search = screen.getByLabelText("Search sports");
    fireEvent.keyDown(search, { key: "ArrowDown" });
    fireEvent.keyDown(search, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("brazilian-jiu-jitsu");
  });

  it("closes on Escape without choosing anything", () => {
    const onChange = open();
    fireEvent.keyDown(screen.getByLabelText("Search sports"), { key: "Escape" });
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("Search sports")).toBeNull();
  });

  it("tells a screen reader which row the arrow keys have reached", () => {
    open();
    const search = screen.getByRole("combobox", { name: "Search sports" });
    expect(search.getAttribute("aria-expanded")).toBe("true");
    fireEvent.keyDown(search, { key: "ArrowDown" });
    const active = document.getElementById(search.getAttribute("aria-activedescendant") ?? "");
    expect(active?.getAttribute("role")).toBe("option");
    expect(active?.querySelector("strong")?.textContent).toBe("BJJ");
  });

  it("gives focus back to the trigger when Escape closes the list", () => {
    open();
    fireEvent.keyDown(screen.getByLabelText("Search sports"), { key: "Escape" });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: /choose your sport/i }));
  });

  it("gives focus back to the trigger once a sport is chosen, by Enter or by click", () => {
    open();
    fireEvent.keyDown(screen.getByLabelText("Search sports"), { key: "Enter" });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: /choose your sport/i }));
    fireEvent.click(screen.getByRole("button", { name: /choose your sport/i }));
    fireEvent.click(screen.getAllByRole("option")[2]);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: /choose your sport/i }));
  });

  it("shows the chosen sport on the trigger rather than making the athlete reopen it", () => {
    render(createElement(SportSelect, { sports, value: "ice-hockey", onChange: vi.fn(), labelFor }));
    expect(screen.getByRole("button", { name: /ice hockey/i })).toBeTruthy();
  });
});
