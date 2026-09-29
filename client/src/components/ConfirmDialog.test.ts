// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
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

  /**
   * A list whose rows each carry their own Remove button, like Progress's recorded
   * workouts or the Strength Genome's recent lifts: confirming takes away the row, and
   * with it the button that asked the question.
   */
  function RemovableRows({ onConfirmed }: { onConfirmed?: () => void }) {
    const [rows, setRows] = React.useState(["Push", "Pull"]);
    const [asking, setAsking] = React.useState<string | null>(null);
    return React.createElement("main", null,
      React.createElement("section", { "aria-label": "Recorded workouts" },
        React.createElement("h2", null, "Your completed sessions."),
        React.createElement("ul", null, rows.map((row) => React.createElement("li", { key: row },
          React.createElement("button", { type: "button", onClick: () => setAsking(row) }, `Remove ${row}`)))),
        React.createElement("button", { type: "button" }, "Open your plan")),
      asking && React.createElement(ConfirmDialog, {
        ...request,
        onConfirm: () => { setAsking(null); setRows((current) => current.filter((row) => row !== asking)); onConfirmed?.(); },
        onCancel: () => setAsking(null),
      }));
  }

  it("hands focus to the list's heading when confirming removes the control that asked", () => {
    render(React.createElement(RemovableRows));
    const opener = screen.getByRole("button", { name: "Remove Push" });
    opener.focus();
    fireEvent.click(opener);
    fireEvent.click(screen.getByRole("button", { name: "Remove set" }));

    expect(opener.isConnected).toBe(false);
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Your completed sessions." }));
    // The heading takes focus only while it has it; it does not join the Tab order.
    const heading = document.activeElement as HTMLElement;
    expect(heading.tabIndex).toBe(-1);
    heading.blur();
    expect(heading.hasAttribute("tabindex")).toBe(false);
  });

  it("still gives focus back to the control that asked when cancelling leaves it in place", () => {
    render(React.createElement(RemovableRows));
    const opener = screen.getByRole("button", { name: "Remove Pull" });
    opener.focus();
    fireEvent.click(opener);
    fireEvent.click(within(screen.getByRole("alertdialog")).getByText("Cancel"));
    expect(document.activeElement).toBe(opener);
  });

  it("leaves focus where the page put it when confirming already moved it on", () => {
    let planButton: HTMLElement | null = null;
    render(React.createElement(RemovableRows, { onConfirmed: () => planButton?.focus() }));
    planButton = screen.getByRole("button", { name: "Open your plan" });
    const opener = screen.getByRole("button", { name: "Remove Push" });
    opener.focus();
    fireEvent.click(opener);
    fireEvent.click(screen.getByRole("button", { name: "Remove set" }));
    expect(document.activeElement).toBe(planButton);
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
