// @vitest-environment jsdom
import React, { createElement } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UniversalSearch } from "./UniversalSearch";
import type { SearchResult } from "@/lib/universalSearch";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;
afterEach(cleanup);

function open(onOpenResult: (result: SearchResult) => void = () => {}) {
  render(createElement(UniversalSearch, { onOpenResult }));
  fireEvent.click(screen.getByRole("button", { name: /search sports genome/i }));
  return screen.getByRole("combobox");
}

describe("universal search surface", () => {
  // "...from one predictable entry."
  it("offers one entry that names its scope before anything is typed", () => {
    open();
    expect(screen.getByRole("dialog", { name: /search/i })).toBeTruthy();
    expect(screen.getByText(/muscles, exercises, sports, sport actions, strength records and screens/i)).toBeTruthy();
  });

  // "Results identify object type and disambiguating context" and
  // "Group mixed result types".
  it("labels every result with its object type and context, under a group heading", () => {
    const input = open();
    fireEvent.change(input, { target: { value: "wrestling" } });

    const options = screen.getAllByRole("option");
    expect(options.length).toBeGreaterThan(0);
    options.forEach((option) => {
      // The type badge and the context line are both rendered, not one or the other.
      expect(option.querySelector(".universal-search-result-type")?.textContent?.trim()).toBeTruthy();
      expect(option.querySelector(".universal-search-result-copy small")?.textContent?.trim()).toBeTruthy();
    });
    expect(screen.getAllByRole("heading").length).toBeGreaterThan(0);
  });

  // "clear exact-name navigational matches outrank inferred/personalized suggestions"
  it("puts the exact match first and opens it on Enter", () => {
    const onOpenResult = vi.fn();
    const input = open(onOpenResult);
    fireEvent.change(input, { target: { value: "wrestling" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onOpenResult).toHaveBeenCalledTimes(1);
    expect(onOpenResult.mock.calls[0][0].label).toBe("Wrestling");
    // Choosing a result closes the sheet rather than leaving it over the object.
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("moves the active option with the arrow keys instead of only the pointer", () => {
    const input = open();
    fireEvent.change(input, { target: { value: "press" } });
    const before = screen.getAllByRole("option").findIndex((option) => option.getAttribute("aria-selected") === "true");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    const after = screen.getAllByRole("option").findIndex((option) => option.getAttribute("aria-selected") === "true");
    expect(after).toBe(before + 1);
  });

  // "Empty results offer alias correction, broader scope or adjacent categories."
  it("offers a correction rather than a dead end when nothing matches", () => {
    const input = open();
    fireEvent.change(input, { target: { value: "wrestlinggggg" } });
    expect(screen.queryAllByRole("option")).toHaveLength(0);

    const suggestions = screen.getByText(/did you mean/i).parentElement!;
    const correction = within(suggestions).getByRole("button", { name: "Wrestling" });
    fireEvent.click(correction);
    // Taking the correction runs the search rather than only filling the box.
    expect(screen.getAllByRole("option").some((o) => o.textContent?.includes("Wrestling"))).toBe(true);
  });

  it("states the scope again when there is no near neighbour to suggest", () => {
    const input = open();
    fireEvent.change(input, { target: { value: "zzzzqqqq" } });
    expect(screen.queryByText(/did you mean/i)).toBeNull();
    expect(screen.getAllByText(/muscles, exercises, sports, sport actions/i).length).toBeGreaterThan(0);
  });

  it("closes on Escape", () => {
    const input = open();
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
