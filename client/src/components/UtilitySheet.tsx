import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { isKeyForAnotherLayer } from "@/lib/modalLayer";
import { trapTabWithin } from "@/lib/modalBackground";
import "../save-to-plan.css";
import "../utility-tools.css";

/**
 * The sheet the utility tools open in. It is the app's existing sheet (SaveToPlanDialog's
 * scrim, surface, header and close button, from save-to-plan.css) with the same layer rules:
 * focus moves to the heading, Tab stays inside, Escape closes only the layer that has focus,
 * the page behind does not scroll, and focus returns to whatever opened it.
 */
export function UtilitySheet({ eyebrow, title, labelId, onClose, children, wide = false }: { eyebrow?: string; title: string; labelId: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const layerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    headingRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (isKeyForAnotherLayer(event, layerRef.current)) return;
      if (event.key === "Escape") { event.stopPropagation(); onCloseRef.current(); return; }
      if (layerRef.current) trapTabWithin(event, layerRef.current);
    };
    window.addEventListener("keydown", onKey, true);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey, true); document.body.style.overflow = overflow; if (opener?.isConnected) opener.focus({ preventScroll: true }); };
  }, []);

  return createPortal(<div className="stp-scrim ut-scrim" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={layerRef} className={`stp-sheet sg-surface-dark ut-sheet${wide ? " ut-sheet-wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby={labelId}>
      <header className="stp-head">
        <div>
          {eyebrow && <p className="stp-eyebrow">{eyebrow}</p>}
          <h2 id={labelId} ref={headingRef} tabIndex={-1}>{title}</h2>
        </div>
        <button type="button" className="stp-close" onClick={onClose} aria-label="Close"><X className="h-5 w-5" aria-hidden="true" /></button>
      </header>
      {children}
    </div>
  </div>, document.body);
}
