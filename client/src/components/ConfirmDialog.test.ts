// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";
import { UniversalSearch } from "./UniversalSearch";

describe("ConfirmDialog (Reversible-action and destructive-confirmation contract, Tier C)", () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  it("names the affected object and consequence, and requires an explicit confirm click", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(React.createElement(ConfirmDialog, {
      title: "Restart onboarding?",
      body: "This permanently deletes every saved training day across all weeks.",
      confirmLabel: "Restart onboarding",
      onConfirm,
      onCancel,
    }));
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    expect(screen.getByText("Restart onboarding?")).toBeTruthy();
    expect(screen.getByText("This permanently deletes every saved training day across all weeks.")).toBeTruthy();
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Restart onboarding" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("cancels via the Cancel button without confirming", () => {
    const onConfirm = vi.fn();
    const onCancelViaButton = vi.fn();
    render(React.createElement(ConfirmDialog, {
      title: "Remove this passkey?",
      body: "Device passkey 1 will no longer be able to sign in.",
      confirmLabel: "Remove passkey",
      onConfirm,
      onCancel: onCancelViaButton,
    }));
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancelViaButton).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("cancels via the close icon without confirming", () => {
    const onConfirm = vi.fn();
    const onCancelViaClose = vi.fn();
    render(React.createElement(ConfirmDialog, {
      title: "Remove this passkey?",
      body: "Device passkey 1 will no longer be able to sign in.",
      confirmLabel: "Remove passkey",
      onConfirm,
      onCancel: onCancelViaClose,
    }));
    fireEvent.click(screen.getByLabelText("Cancel"));
    expect(onCancelViaClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

describe("ConfirmDialog keyboard behaviour", () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  const request = {
    title: "Remove this set?",
    body: "Set 2 of Back squat will be removed from this session.",
    confirmLabel: "Remove set",
  };

  it("moves focus to the Cancel answer, not the destructive one", () => {
    render(React.createElement(ConfirmDialog, { ...request, onConfirm: vi.fn(), onCancel: vi.fn() }));
    expect(document.activeElement).toBe(screen.getByText("Cancel"));
    expect(document.activeElement?.className).toBe("confirm-dialog-cancel");
  });

  it("cancels on Escape without letting the layer underneath also close", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const underneath = vi.fn();
    window.addEventListener("keydown", underneath);
    try {
      render(React.createElement(ConfirmDialog, { ...request, onConfirm, onCancel }));
      fireEvent.keyDown(document.activeElement!, { key: "Escape" });
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onConfirm).not.toHaveBeenCalled();
      expect(underneath).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener("keydown", underneath);
    }
  });

  it("gives focus back to the control that asked the question", () => {
    const opener = document.createElement("button");
    opener.textContent = "Remove set";
    document.body.appendChild(opener);
    opener.focus();
    const { unmount } = render(React.createElement(ConfirmDialog, { ...request, onConfirm: vi.fn(), onCancel: vi.fn() }));
    expect(document.activeElement).not.toBe(opener);
    unmount();
    expect(document.activeElement).toBe(opener);
  });

  it("leaves focus on Confirm when the page re-renders the dialog", () => {
    const { rerender } = render(React.createElement(ConfirmDialog, { ...request, onConfirm: vi.fn(), onCancel: () => undefined }));
    const confirm = screen.getByRole("button", { name: "Remove set" });
    confirm.focus();
    const latestCancel = vi.fn();
    rerender(React.createElement(ConfirmDialog, { ...request, onConfirm: vi.fn(), onCancel: latestCancel }));
    expect(document.activeElement).toBe(confirm);
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    expect(latestCancel).toHaveBeenCalledTimes(1);
  });

  it("keeps Tab on the dialog's own buttons", () => {
    render(React.createElement(ConfirmDialog, { ...request, onConfirm: vi.fn(), onCancel: vi.fn() }));
    const confirm = screen.getByRole("button", { name: "Remove set" });
    const close = screen.getByLabelText("Cancel");
    confirm.focus();
    fireEvent.keyDown(document.activeElement!, { key: "Tab" });
    expect(document.activeElement).toBe(close);
    fireEvent.keyDown(document.activeElement!, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(confirm);
  });

  it("leaves Tab and Escape to search opened over it, then cancels on the next Escape", () => {
    const onCancel = vi.fn();
    render(React.createElement(React.Fragment, null,
      React.createElement(UniversalSearch, { onOpenResult: vi.fn() }),
      React.createElement(ConfirmDialog, { ...request, onConfirm: vi.fn(), onCancel })));
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    const input = screen.getByRole("combobox", { name: /search muscles/i });
    expect(document.activeElement).toBe(input);
    fireEvent.keyDown(input, { key: "Tab" });
    expect(document.activeElement).toBe(input);
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("combobox", { name: /search muscles/i })).toBeNull();
    expect(onCancel).not.toHaveBeenCalled();
    fireEvent.keyDown(document.activeElement ?? window, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
