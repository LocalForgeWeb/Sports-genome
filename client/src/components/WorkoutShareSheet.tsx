import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, Download, FileText, Share, X } from "lucide-react";
import { toast } from "sonner";
import { isKeyForAnotherLayer } from "@/lib/modalLayer";
import { exportContextLine, exportCountLine, exportDayLine, exportFileName, pad2, shareMessage, workoutSummaryText, type WorkoutExport } from "@/lib/workoutExport";
import { canShareFiles, copyText, prepareWorkoutPdf, savePdf, shareWorkoutPdf } from "@/lib/workoutShare";
import "../workout-share.css";

/**
 * Share, in one place, saying exactly what leaves the app (Oct 2 brief §5–7).
 *
 * The day used to leave only by printing the page - the dark app, browser
 * headers and all - or by pasting the whole plan into a message. Here the
 * default is the system share sheet with the PDF attached and a two-line note;
 * the PDF can be saved instead, and the plain-text summary copied for anyone
 * who wants text. A preview of the document's first page and the note itself
 * are shown before anything is sent. Nothing here changes the plan.
 */
export function WorkoutShareSheet({ plan, weightUnit, onClose }: { plan: WorkoutExport; weightUnit: "lb" | "kg"; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState("");
  const layerRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // The PDF is made as the sheet opens, so the share tap can call the system sheet at once (Safari needs the gesture).
  useEffect(() => {
    let live = true;
    prepareWorkoutPdf(plan, weightUnit).then((made) => { if (live) setFile(made); }).catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [plan, weightUnit]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    layerRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (isKeyForAnotherLayer(event, layerRef.current)) return;
      if (event.key === "Escape") { event.stopPropagation(); onCloseRef.current(); return; }
      if (event.key !== "Tab" || !layerRef.current) return;
      const focusable = Array.from(layerRef.current.querySelectorAll<HTMLElement>("button:not(:disabled)"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      // From the sheet itself (where focus starts while the PDF is made), from outside it, or off either end: wrap.
      const outside = !active || active === layerRef.current || !layerRef.current.contains(active);
      if (event.shiftKey && (outside || active === first)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (outside || active === last)) { event.preventDefault(); first.focus(); }
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

  // Once the PDF is ready, Share takes focus - unless the athlete has already moved it inside the sheet.
  useEffect(() => { if (file && document.activeElement === layerRef.current) firstRef.current?.focus({ preventScroll: true }); }, [file]);
  const native = file ? canShareFiles(file) : true;
  const preparing = !file && !failed;
  const message = shareMessage(plan, { attached: true });
  const shown = plan.exercises.slice(0, 3);

  const sharing = useRef(false);
  const share = async () => {
    // A second tap while the system sheet is still up would make it reject ("InvalidStateError").
    if (!file || sharing.current) return;
    sharing.current = true;
    const outcome = await shareWorkoutPdf(plan, file).finally(() => { sharing.current = false; });
    if (outcome === "shared") { setStatus("Shared."); onClose(); }
    else if (outcome === "saved") { setStatus(`Saved ${file.name}. Attach it to your message.`); toast.success("PDF saved", { description: `${file.name} — attach it to your message.` }); }
    else if (outcome === "failed") setStatus("Sharing didn't open. Save the PDF instead.");
    else setStatus("");
  };
  const save = () => {
    if (!file) return;
    if (savePdf(file) === "saved") { setStatus(`Saved ${file.name}.`); toast.success("PDF saved", { description: file.name }); }
    else setStatus("This browser couldn't save the PDF.");
  };
  const copy = async () => {
    const outcome = await copyText(workoutSummaryText(plan));
    if (outcome === "copied") { setCopied(true); setStatus("Workout summary copied."); toast.success("Workout summary copied"); }
    else setStatus("Copying isn't allowed here. Select the text from the PDF instead.");
  };

  return createPortal(
    <div className="workout-share-scrim" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={layerRef} className="workout-share-sheet sg-surface-dark" tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="workout-share-title" aria-describedby="workout-share-what">
        <header className="workout-share-head">
          <div>
            <p className="metric-label">{exportDayLine(plan)}</p>
            <h2 id="workout-share-title">Share workout</h2>
          </div>
          <button type="button" className="workout-share-close" onClick={onClose} aria-label="Close sharing"><X className="h-4 w-4" aria-hidden="true" /></button>
        </header>

        {/* What will be sent: the document's first page in miniature, and the note that goes with it. */}
        <div className="workout-share-preview" id="workout-share-what">
          <div className="workout-share-page" aria-hidden="true">
            <p className="workout-share-page-brand">Sports Genome <span>Training plan</span></p>
            <p className="workout-share-page-day">{plan.dayName}</p>
            <p className="workout-share-page-facts">{[exportContextLine(plan), exportCountLine(plan)].filter(Boolean).join(" · ")}</p>
            <ol>{shown.map((exercise) => <li key={exercise.order}><b>{pad2(exercise.order)}</b> {exercise.name}<small>{[exercise.prescription, exercise.rpe, exercise.rest].filter(Boolean).join(" · ")}</small></li>)}</ol>
            {plan.exercises.length > shown.length && <p className="workout-share-page-more">+ {plan.exercises.length - shown.length} more</p>}
          </div>
          <div className="workout-share-says">
            <p><FileText className="h-4 w-4" aria-hidden="true" /><span><b>{exportFileName(plan)}</b> — the full prescription, with a line for every set.</span></p>
            <p className="workout-share-note-label">With this note</p>
            <blockquote>{message.split("\n").map((line) => <span key={line}>{line}</span>)}</blockquote>
          </div>
        </div>

        <div className="workout-share-actions">
          <button ref={firstRef} type="button" className="workout-share-primary" onClick={share} disabled={!file} aria-describedby="workout-share-primary-detail">
            <Share className="h-5 w-5" aria-hidden="true" />
            <span><b>{preparing ? "Preparing PDF…" : native ? "Share workout" : "Share workout as PDF"}</b><small id="workout-share-primary-detail">{native ? "Opens your share sheet with the PDF and this note." : "This browser can't attach files to a share, so the PDF is saved for you to send."}</small></span>
          </button>
          <button type="button" className="workout-share-option" onClick={save} disabled={!file}>
            <Download className="h-5 w-5" aria-hidden="true" />
            <span><b>Save PDF</b><small>A printable copy for the gym or a coach.</small></span>
          </button>
          <button type="button" className="workout-share-option" onClick={copy}>
            {copied ? <Check className="h-5 w-5" aria-hidden="true" /> : <Copy className="h-5 w-5" aria-hidden="true" />}
            <span><b>{copied ? "Summary copied" : "Copy workout summary"}</b><small>Plain text for Messages, Notes or email.</small></span>
          </button>
        </div>
        <p className="workout-share-status" role="status" aria-live="polite">{failed ? "The PDF couldn't be made on this device. You can still copy the summary." : status}</p>
      </div>
    </div>,
    document.body,
  );
}
