// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FeatureTour } from "./FeatureTour";
import { UniversalSearch } from "./UniversalSearch";

/**
 * The first-run guide is a modal: focus moves into it, Escape closes it, Tab
 * stays inside it, and focus goes back to whatever opened it.
 */
describe("FeatureTour keyboard behaviour", () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  function openFrom() {
    const opener = document.createElement("button");
    opener.textContent = "Open guide";
    document.body.appendChild(opener);
    opener.focus();
    return opener;
  }

  it("moves focus to Close guide when it opens", () => {
    openFrom();
    render(React.createElement(FeatureTour, { onClose: vi.fn(), onNavigate: vi.fn() }));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Close guide" }));
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    render(React.createElement(FeatureTour, { onClose, onNavigate: vi.fn() }));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("advances to the next step", () => {
    render(React.createElement(FeatureTour, { onClose: vi.fn(), onNavigate: vi.fn() }));
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("Start on Home");
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("Build and run a session");
  });

  it("gives focus back to the opener on close", () => {
    const opener = openFrom();
    const { unmount } = render(React.createElement(FeatureTour, { onClose: vi.fn(), onNavigate: vi.fn() }));
    expect(document.activeElement).not.toBe(opener);
    unmount();
    expect(document.activeElement).toBe(opener);
  });

  it("keeps Tab inside the guide", () => {
    render(React.createElement(FeatureTour, { onClose: vi.fn(), onNavigate: vi.fn() }));
    const buttons = screen.getAllByRole("button");
    const close = screen.getByRole("button", { name: "Close guide" });
    buttons[buttons.length - 1].focus();
    fireEvent.keyDown(document.activeElement!, { key: "Tab" });
    expect(document.activeElement).toBe(close);
    fireEvent.keyDown(document.activeElement!, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(buttons[buttons.length - 1]);
  });

  it("does not pull focus back to Close when the page re-renders it", () => {
    const { rerender } = render(React.createElement(FeatureTour, { onClose: vi.fn(), onNavigate: vi.fn() }));
    const next = screen.getByRole("button", { name: /Next/ });
    next.focus();
    const latestClose = vi.fn();
    rerender(React.createElement(FeatureTour, { onClose: latestClose, onNavigate: vi.fn() }));
    expect(document.activeElement).toBe(next);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(latestClose).toHaveBeenCalledTimes(1);
  });

  it("leaves Tab and Escape to search opened over it, then closes on the next Escape", () => {
    const onClose = vi.fn();
    render(React.createElement(React.Fragment, null,
      React.createElement(UniversalSearch, { onOpenResult: vi.fn() }),
      React.createElement(FeatureTour, { onClose, onNavigate: vi.fn() })));
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    const input = screen.getByRole("combobox", { name: /search muscles/i });
    expect(document.activeElement).toBe(input);
    fireEvent.keyDown(input, { key: "Tab" });
    expect(document.activeElement).toBe(input);
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("combobox", { name: /search muscles/i })).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(document.activeElement ?? window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
