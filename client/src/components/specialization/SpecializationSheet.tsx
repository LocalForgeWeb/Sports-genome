import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { isKeyForAnotherLayer } from "@/lib/modalLayer";
import { trapTabWithin } from "@/lib/modalBackground";
import "./plan-change.css";

/**
 * The page's bottom sheet: the muscle detail and the add/swap flow (design §7). The house
 * pattern of the Save to plan sheet: a bottom sheet on a phone and a dialog from 720 px, on
 * the navy of the app's other sheets, focus on the heading when it opens, Escape and the
 * scrim close it, Tab stays inside, and focus returns to what opened it. Whatever sits last
 * clears the home indicator: the footer pads with the bottom safe area, and without a footer
 * (the muscle sheet) the body does.
 */
export function SpecializationSheet({ id, eyebrow, title, subtitle, onClose, children, footer, focusKey }: {
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /**
   * What the sheet is about. The heading takes focus when the sheet opens and again only when
   * this changes (a new muscle is a new subject), never because the title's wording changed:
   * a control that rewords the title keeps focus. Without it, a change of `title` refocuses,
   * as before, until every caller passes a key.
   */
  focusKey?: string | number;
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
  // A new subject in the same sheet (a new muscle): the heading takes focus again.
  const subject = focusKey ?? title;
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, [subject]);

  return createPortal(<div className="spz-scrim" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={layerRef} className="spz-sheet sg-surface-dark" data-footless={footer ? undefined : ""} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`}>
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
