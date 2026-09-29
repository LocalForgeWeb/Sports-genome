// @vitest-environment jsdom
import React, { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MuscleSelect } from "./MuscleSelect";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const labels: Record<string, string> = { biceps: "Biceps brachii", chest: "Chest", upperBack: "Upper back" };
const labelFor = (key: string) => labels[key] || key;

const open = (onChange = vi.fn()) => {
  render(createElement(MuscleSelect, { muscles: ["upperBack", "biceps", "chest"], value: "all", labelFor, onChange }));
  const trigger = screen.getByRole("button", { name: "Filter day exercises by muscle group" });
  trigger.focus();
  fireEvent.click(trigger);
  return { onChange, trigger };
};

describe("the muscle filter list", () => {
  const sheetEscape = vi.fn();
  // Stands in for the add-exercises sheet, which closes on Escape from window.
  const sheetKeydown = (event: KeyboardEvent) => { if (event.key === "Escape") sheetEscape(); };
  afterEach(() => { cleanup(); window.removeEventListener("keydown", sheetKeydown); sheetEscape.mockReset(); });

  it("closes only itself on Escape and gives focus back to its trigger", () => {
    window.addEventListener("keydown", sheetKeydown);
    const { onChange, trigger } = open();
    const search = screen.getByLabelText("Search muscles");
    expect(document.activeElement).toBe(search);
    fireEvent.keyDown(search, { key: "Escape" });
    expect(screen.queryByLabelText("Search muscles")).toBeNull();
    expect(sheetEscape).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(trigger);
  });

  it("gives focus back to its trigger once a muscle is chosen", () => {
    const { onChange, trigger } = open();
    fireEvent.click(screen.getByRole("option", { name: "Chest" }));
    expect(onChange).toHaveBeenCalledWith("chest");
    expect(document.activeElement).toBe(trigger);
  });

  it("tells a screen reader which row the arrow keys have reached", () => {
    open();
    const search = screen.getByRole("combobox", { name: "Search muscles" });
    fireEvent.keyDown(search, { key: "ArrowDown" });
    const active = document.getElementById(search.getAttribute("aria-activedescendant") ?? "");
    expect(active).toBe(screen.getAllByRole("option")[1]);
    expect(active?.textContent).toBe("Upper back");
  });

  it("does not point at a list that is not there when nothing matches", () => {
    const { trigger } = open();
    expect(trigger.getAttribute("aria-controls")).toBeTruthy();
    const search = screen.getByRole("combobox", { name: "Search muscles" });
    fireEvent.change(search, { target: { value: "zzz" } });
    expect(search.getAttribute("aria-expanded")).toBe("false");
    expect(search.hasAttribute("aria-activedescendant")).toBe(false);
    expect(search.hasAttribute("aria-controls")).toBe(false);
    expect(trigger.hasAttribute("aria-controls")).toBe(false);
  });
});
