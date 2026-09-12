// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog (Reversible-action and destructive-confirmation contract, Tier C)", () => {
  afterEach(() => { document.body.innerHTML = ""; });

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
