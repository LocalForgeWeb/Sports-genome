import React from "react";
import { TriangleAlert, X } from "lucide-react";

export type ConfirmDialogRequest = {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
};

/**
 * Tier C confirmation per the philosophy's Reversible-action and destructive-confirmation
 * contract: names the affected object and consequence, and is visually distinguished (red,
 * not the brand orange used for routine actions) from ordinary feedback.
 */
export function ConfirmDialog({ title, body, confirmLabel, cancelLabel = "Cancel", onConfirm, onCancel }: ConfirmDialogRequest & { onCancel: () => void }) {
  return <div className="confirm-dialog-layer" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-body">
    <section className="confirm-dialog-card">
      <button type="button" onClick={onCancel} className="confirm-dialog-close" aria-label="Cancel">
        <X className="h-4 w-4" />
      </button>
      <div className="confirm-dialog-icon"><TriangleAlert className="h-5 w-5" /></div>
      <h2 id="confirm-dialog-title">{title}</h2>
      <p id="confirm-dialog-body">{body}</p>
      <div className="confirm-dialog-actions">
        <button type="button" onClick={onCancel} className="confirm-dialog-cancel">{cancelLabel}</button>
        <button type="button" onClick={onConfirm} className="confirm-dialog-confirm">{confirmLabel}</button>
      </div>
    </section>
  </div>;
}
