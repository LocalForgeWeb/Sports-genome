import React, { useEffect, useRef } from "react";
import { TriangleAlert, X } from "lucide-react";

export type ConfirmDialogRequest = {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  /**
   * What cancelling does, where "not the destructive option" is a real second
   * choice rather than simply abandoning the action. Switching training days
   * with unsaved edits is the case: both answers continue to the next day, and
   * the question is only which version of the day you leave behind.
   */
  onCancel?: () => void;
};

/**
 * Tier C confirmation per the philosophy's Reversible-action and destructive-confirmation
 * contract: names the affected object and consequence, and is visually distinguished (red,
 * not the brand orange used for routine actions) from ordinary feedback.
 */
export function ConfirmDialog({ title, body, confirmLabel, cancelLabel = "Cancel", onConfirm, onCancel }: Omit<ConfirmDialogRequest, "onCancel"> & { onCancel: () => void }) {
  const layerRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  // Every caller passes a fresh onCancel on each render; reading it through a ref
  // keeps the effect below from re-running and pulling focus off Confirm.
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  // Focus starts on the least destructive answer, Escape cancels without reaching
  // the layer underneath, Tab stays on the dialog's buttons, and focus goes back
  // to whatever asked the question once it is answered.
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null;
    cancelRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        event.preventDefault();
        onCancelRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const buttons = Array.from(layerRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (!first || !last) return;
      const active = document.activeElement;
      if (!(active instanceof Node) || !layerRef.current?.contains(active)) { event.preventDefault(); first.focus(); }
      else if (event.shiftKey && active === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && active === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
    // The opener belongs to this one question.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={layerRef} className="confirm-dialog-layer" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-body">
    <section className="confirm-dialog-card">
      <button type="button" onClick={onCancel} className="confirm-dialog-close" aria-label="Cancel">
        <X className="h-4 w-4" />
      </button>
      <div className="confirm-dialog-icon"><TriangleAlert className="h-5 w-5" /></div>
      <h2 id="confirm-dialog-title">{title}</h2>
      <p id="confirm-dialog-body">{body}</p>
      <div className="confirm-dialog-actions">
        <button ref={cancelRef} type="button" onClick={onCancel} className="confirm-dialog-cancel">{cancelLabel}</button>
        <button type="button" onClick={onConfirm} className="confirm-dialog-confirm">{confirmLabel}</button>
      </div>
    </section>
  </div>;
}
