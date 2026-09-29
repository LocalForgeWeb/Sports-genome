// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StackImportPanel } from "./StackImportPanel";

/**
 * The routine import is a layer over the Train page: it is announced as a
 * named dialog, focus moves into it, Escape closes it, and focus goes back to
 * Import plan when it closes.
 */
describe("StackImportPanel as a dialog", () => {
  afterEach(() => { document.body.innerHTML = ""; });

  it("is a dialog named by its heading", () => {
    render(React.createElement(StackImportPanel, { onClose: vi.fn(), onImport: vi.fn() }));
    expect(screen.getByRole("dialog", { name: /paste the full plan/i })).toBeTruthy();
  });

  it("moves focus to Close, not the prefilled text", () => {
    render(React.createElement(StackImportPanel, { onClose: vi.fn(), onImport: vi.fn() }));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Close routine import" }));
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    const onImport = vi.fn();
    render(React.createElement(StackImportPanel, { onClose, onImport }));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onImport).not.toHaveBeenCalled();
  });

  it("gives focus back to Import plan on close", () => {
    const opener = document.createElement("button");
    opener.textContent = "Import plan";
    document.body.appendChild(opener);
    opener.focus();
    const { unmount } = render(React.createElement(StackImportPanel, { onClose: vi.fn(), onImport: vi.fn() }));
    expect(document.activeElement).not.toBe(opener);
    unmount();
    expect(document.activeElement).toBe(opener);
  });

  it("leaves focus where the athlete put it when the page re-renders, and Escape uses the latest close", () => {
    const { rerender } = render(React.createElement(StackImportPanel, { onClose: vi.fn(), onImport: vi.fn() }));
    const textarea = screen.getByRole("textbox");
    textarea.focus();
    const latestClose = vi.fn();
    rerender(React.createElement(StackImportPanel, { onClose: latestClose, onImport: vi.fn() }));
    expect(document.activeElement).toBe(textarea);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(latestClose).toHaveBeenCalledTimes(1);
  });
});
