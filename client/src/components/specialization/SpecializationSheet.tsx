import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { isKeyForAnotherLayer } from "@/lib/modalLayer";
import { trapTabWithin } from "@/lib/modalBackground";

/**
 * The page's bottom sheet: the muscle detail and the add/swap flow (design §7). The house
 * pattern of the Save to plan sheet: a bottom sheet on a phone and a dialog from 720 px, on
 * the navy of the app's other sheets, focus on the heading when it opens, Escape and the
 * scrim close it, Tab stays inside, and focus returns to what opened it.
 */
export function SpecializationSheet({ id, eyebrow, title, subtitle, onClose, children, footer }: {
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
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
    return () => {
      window.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = overflow;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);
  // A new muscle in the same sheet is a new subject: the heading takes focus again.
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, [title]);

  return createPortal(<div className="spz-scrim" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={layerRef} className="spz-sheet sg-surface-dark" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`}>
      <header className="spz-sheet-head">
        <div>
          <p className="spz-eyebrow">{eyebrow}</p>
          <h2 id={`${id}-title`} ref={headingRef} tabIndex={-1}>{title}</h2>
          {subtitle && <div className="spz-sheet-subtitle">{subtitle}</div>}
        </div>
        <button type="button" className="spz-close" onClick={onClose} aria-label="Close"><X className="h-5 w-5" aria-hidden="true" /></button>
      </header>
      <div className="spz-sheet-body">{children}</div>
      {footer && <footer className="spz-sheet-foot">{footer}</footer>}
    </div>
  </div>, document.body);
}
