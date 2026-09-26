// @vitest-environment jsdom
import React, { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BodyLabNavigator } from "./BodyLabNavigator";
import { sportMovementProfiles, sportProfiles } from "@/lib/sportMovementDatabase";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
afterEach(cleanup);

const sport = sportProfiles[0];
const movements = sportMovementProfiles.filter((movement) => movement.sportId === sport.id);

function mount(over: Partial<Parameters<typeof BodyLabNavigator>[0]> = {}) {
  return render(createElement(BodyLabNavigator, {
    sports: sportProfiles, activeSportId: sport.id, movements, selectedMovement: movements[1],
    onSport: () => undefined, onMovement: () => undefined, onOpenAtlas: () => undefined, ...over,
  }));
}

/**
 * Handoff 03: the selected sport/action context with a clear Change entry.
 * The controls that change it earn their height only when they are wanted.
 */
describe("the Body Lab head", () => {
  it("names the page, and the sport and action it is showing, on one line", () => {
    mount();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Body Lab");
    const context = document.querySelector(".body-lab-selection-context")!.textContent;
    expect(context).toContain(sport.label);
    expect(context).toContain(movements[1].label);
  });

  it("keeps the pickers behind Change, and puts them away again", () => {
    mount();
    expect(document.querySelector("select")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /change/i }));
    expect(document.querySelectorAll("select")).toHaveLength(2);
    expect(screen.getByRole("button", { name: /done/i }).getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: /done/i }));
    expect(document.querySelector("select")).toBeNull();
  });

  it("changes the action, steps through them and browses them through the owner's handlers", () => {
    const onMovement = vi.fn();
    const onOpenAtlas = vi.fn();
    mount({ onMovement, onOpenAtlas });
    fireEvent.click(screen.getByRole("button", { name: /change/i }));
    fireEvent.change(document.querySelectorAll("select")[1], { target: { value: movements[3].id } });
    expect(onMovement).toHaveBeenLastCalledWith(movements[3]);
    fireEvent.click(screen.getByRole("button", { name: /next sport action/i }));
    expect(onMovement).toHaveBeenLastCalledWith(movements[2]);
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`All ${movements.length}`) }));
    expect(onOpenAtlas).toHaveBeenCalledTimes(1);
  });
});
