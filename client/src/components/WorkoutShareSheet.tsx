import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, Download, ExternalLink, FileText, Link2, Share, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { isKeyForAnotherLayer } from "@/lib/modalLayer";
import { trapTabWithin } from "@/lib/modalBackground";
import { exportDayLine, type WorkoutExport } from "@/lib/workoutExport";
import { canShareFiles, copyText, prepareWorkoutPdf, savePdf, shareWorkoutPdf } from "@/lib/workoutShare";
import { buildShareSnapshot, defaultShareTitle, notesInScope, shareableDays, activeSourceDay, type ShareScope, type ShareSource } from "@/lib/shareSnapshot";
import { randomKey, rememberOwnedShare, shareUrl } from "@/lib/shareLinks";
import { shareExerciseCount, shareSnapshotText } from "@shared/workoutShareFormat";
import { shareLimits, type ShareSnapshot } from "@shared/workoutShare";
import { SharedWorkoutView } from "@/components/SharedWorkoutView";
import { SharedLinksManager } from "@/components/SharedLinksManager";
import "../workout-share.css";

/**
 * Share: choose what goes, see it as others will, then send a link.
 *
 * Content says what is being shared - this workout or the week - under a title the
 * sender can change, with an optional note and name, and with the exercises' notes
 * only if they choose. Preview is the shared page itself, drawn by the component the
 * recipient's page uses. Share creates the link - only when asked, never by opening
 * this sheet - and then offers the system share sheet, Copy link, and the page.
 * The workout as paste-ready text and the day's PDF stay as other ways to send it.
 *
 * A link is a copy: nothing done to the plan afterwards changes it. Creating it is
 * safe to retry - the same request key returns the same link - and one tap cannot
 * make two.
 */
const nativeShare = () => typeof navigator !== "undefined" && typeof navigator.share === "function";

export function WorkoutShareSheet({ plan, source, weightUnit, onClose }: { plan: WorkoutExport; source: ShareSource | null; weightUnit: "lb" | "kg"; onClose: () => void }) {
  const weekDays = source ? shareableDays(source) : [];
  const dayHasWork = Boolean(source && activeSourceDay(source)?.exercises.length);
  const [scope, setScope] = useState<ShareScope>(dayHasWork || !weekDays.length ? "day" : "week");
  const [title, setTitle] = useState(() => (source ? defaultShareTitle(source, scope) : plan.dayName));
  const [titleTouched, setTitleTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [attribution, setAttribution] = useState("");
  const [includeNotes, setIncludeNotes] = useState(false);
  const [fullPreview, setFullPreview] = useState(false);
  const [phase, setPhase] = useState<"compose" | "creating" | "ready" | "failed">("compose");
  const [failure, setFailure] = useState("");
  const [link, setLink] = useState<{ token: string; url: string } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [textCopied, setTextCopied] = useState(false);
  const [status, setStatus] = useState("");
  const [manageOpen, setManageOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pdfFailed, setPdfFailed] = useState(false);
  const attempt = useRef<{ requestKey: string; manageSecret: string; snapshot: ShareSnapshot } | null>(null);
  const creating = useRef(false);
  const layerRef = useRef<HTMLDivElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const create = trpc.shares.create.useMutation();

  const choices = { scope, title, description, attribution, includeNotes };
  const snapshot = useMemo<ShareSnapshot | null>(() => (source ? buildShareSnapshot(source, choices) : null), [source, scope, title, description, attribution, includeNotes]);
  const notes = useMemo(() => (source ? notesInScope(source, scope) : []), [source, scope]);
  const locked = phase === "creating" || phase === "ready";

  useEffect(() => {
    let live = true;
    prepareWorkoutPdf(plan, weightUnit).then((made) => { if (live) setFile(made); }).catch(() => { if (live) setPdfFailed(true); });
    return () => { live = false; };
  }, [plan, weightUnit]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    layerRef.current?.focus({ preventScroll: true });
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

  const chooseScope = (next: ShareScope) => {
    if (locked || !source) return;
    setScope(next);
    if (!titleTouched) setTitle(defaultShareTitle(source, next));
  };

  const createLink = async () => {
    if (!snapshot || creating.current || phase === "ready") return;
    creating.current = true;
    // A retry of the same content is the same request, so a link made by an attempt whose answer
    // was lost comes back rather than a second one; changed content is a new request.
    if (!attempt.current || attempt.current.snapshot !== snapshot) attempt.current = { requestKey: randomKey(18), manageSecret: randomKey(32), snapshot };
    const { requestKey, manageSecret } = attempt.current;
    setPhase("creating");
    setFailure("");
    setStatus("Creating link…");
    try {
      const result = await create.mutateAsync({ requestKey, manageSecret, snapshot });
      rememberOwnedShare({ token: result.token, manageSecret, title: snapshot.title, scope: snapshot.scope, version: result.version, createdAt: result.createdAt, exerciseCount: shareExerciseCount(snapshot), dayCount: snapshot.days.length, sourceKey: source ? (scope === "day" ? `w${source.week}:day:${activeSourceDay(source)?.key}` : `w${source.week}:week`) : undefined });
      setLink({ token: result.token, url: shareUrl(result.token) });
      setPhase("ready");
      setStatus("Link ready.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      setFailure(/isn't available|not available/i.test(message) ? "Sharing by link isn't available right now. You can still copy the workout as text below, or save the PDF." : "The link couldn't be created. Check your connection and try again — what you entered is kept.");
      setPhase("failed");
      setStatus("");
    } finally { creating.current = false; }
  };

  const shareMessage = snapshot ? (snapshot.scope === "day"
    ? `${snapshot.title} — ${shareExerciseCount(snapshot)} exercises. View the workout or save a copy in Sports Genome.`
    : `${snapshot.title} — ${snapshot.days.length} days, ${shareExerciseCount(snapshot)} exercises. View the week or save a copy in Sports Genome.`) : "";

  const sharing = useRef(false);
  const shareLink = async () => {
    if (!link || sharing.current) return;
    sharing.current = true;
    try {
      await navigator.share({ title: snapshot?.title, text: shareMessage, url: link.url });
      setStatus("Passed to the app you chose.");
    } catch (error) {
      // Closing the share sheet is a choice, not an error.
      if (!(error instanceof DOMException && error.name === "AbortError")) setStatus("Sharing didn't open. Copy the link instead.");
    } finally { sharing.current = false; }
  };
  const copyLink = async () => {
    if (!link) return;
    if ((await copyText(link.url)) === "copied") { setLinkCopied(true); setStatus("Link copied."); }
    else { setStatus("Copying isn't allowed here. The link is selected above — copy it from there."); linkInputRef.current?.focus(); linkInputRef.current?.select(); }
  };
  const copyAsText = async () => {
    if (!snapshot) return;
    if ((await copyText(shareSnapshotText(snapshot, link?.url))) === "copied") { setTextCopied(true); setStatus("Workout copied as text. Paste it into Sports Genome's Import plan, or into any message."); }
    else setStatus("Copying isn't allowed here. Save the PDF instead.");
  };
  const pdfShare = async () => {
    if (!file) return;
    const outcome = await shareWorkoutPdf(plan, file);
    if (outcome === "saved") setStatus(`Saved ${file.name}.`);
    else if (outcome === "failed") setStatus("Sharing didn't open. Save the PDF instead.");
  };
  const pdfSave = () => { if (file) setStatus(savePdf(file) === "saved" ? `Saved ${file.name}.` : "This browser couldn't save the PDF."); };

  const empty = !snapshot;
  const day = source ? activeSourceDay(source) : undefined;
  const weekCount = weekDays.reduce((sum, entry) => sum + entry.exercises.length, 0);

  return createPortal(
    <div className="workout-share-scrim" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={layerRef} className="workout-share-sheet sg-surface-dark" tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="workout-share-title">
        <header className="workout-share-head">
          <div>
            <p className="metric-label">{exportDayLine(plan)}</p>
            <h2 id="workout-share-title">{manageOpen ? "Your shared links" : "Share"}</h2>
          </div>
          <button type="button" className="workout-share-close" onClick={onClose} aria-label="Close sharing"><X className="h-4 w-4" aria-hidden="true" /></button>
        </header>

        {manageOpen ? <>
          <SharedLinksManager current={source && snapshot ? { key: scope === "day" ? `w${source.week}:day:${day?.key}` : `w${source.week}:week`, snapshot } : undefined} />
          <button type="button" className="share-text-button" onClick={() => setManageOpen(false)}>Back to sharing</button>
        </> : empty ? <div className="share-empty">
          <p><b>{scope === "day" ? `${day?.label ?? "This day"} has no exercises yet.` : "This week has no exercises yet."}</b></p>
          <p>Add exercises in Plan, then share it. A share is made only from planned exercises.</p>
          <button type="button" className="share-secondary" onClick={onClose}>Back to Plan</button>
        </div> : <>
          <section className="share-section" aria-labelledby="share-content-title">
            <h3 id="share-content-title">What you're sharing</h3>
            <div className="share-scope" role="radiogroup" aria-label="What to share">
              <label className={`share-scope-option ${scope === "day" ? "is-on" : ""}`}><input type="radio" name="share-scope" checked={scope === "day"} disabled={locked || !dayHasWork} onChange={() => chooseScope("day")} /><span><b>This workout</b><small>{day ? `${day.ordinal} · ${day.label} · ${day.exercises.length} exercise${day.exercises.length === 1 ? "" : "s"}` : ""}</small></span></label>
              <label className={`share-scope-option ${scope === "week" ? "is-on" : ""}`}><input type="radio" name="share-scope" checked={scope === "week"} disabled={locked || weekDays.length < 2} onChange={() => chooseScope("week")} /><span><b>Week {source?.week}</b><small>{weekDays.length < 2 ? "Plan more than one day to share the week" : `${weekDays.length} days · ${weekCount} exercises`}</small></span></label>
            </div>
            <label className="share-field"><span>Title</span><input value={title} maxLength={shareLimits.title} disabled={locked} onChange={(event) => { setTitle(event.target.value); setTitleTouched(true); }} /></label>
            <label className="share-field"><span>Note for the people you share it with <small>Optional</small></span><textarea value={description} maxLength={shareLimits.description} disabled={locked} rows={2} placeholder="What it's for, the equipment it needs, cues…" onChange={(event) => setDescription(event.target.value)} /></label>
            <label className="share-field"><span>Show your name <small>Optional — leave empty to share without one</small></span><input value={attribution} maxLength={shareLimits.attribution} disabled={locked} placeholder="e.g. Coach Sam" autoComplete="off" onChange={(event) => setAttribution(event.target.value)} /></label>
            {notes.length > 0 && <div className="share-notes">
              <label className="share-check"><input type="checkbox" checked={includeNotes} disabled={locked} onChange={(event) => setIncludeNotes(event.target.checked)} /><span>Include exercise notes ({notes.length})</span></label>
              {includeNotes && <ul>{notes.map((entry) => <li key={`${entry.day}-${entry.name}`}><b>{entry.name}</b>: {entry.notes}</li>)}</ul>}
            </div>}
            <p className="share-included">Shares the exercises in order with their sets and reps, RPE and rest{includeNotes ? ", and the notes above" : ""}. Never your logged sets, history, body measures or profile.</p>
          </section>

          <section className="share-section" aria-labelledby="share-preview-title">
            <h3 id="share-preview-title">Preview <small>What people with the link will see</small></h3>
            <div className="share-preview-frame">{snapshot && <SharedWorkoutView snapshot={snapshot} mode="preview" previewRows={fullPreview ? undefined : 3} headingLevel={2} />}</div>
            <button type="button" className="share-text-button" aria-expanded={fullPreview} onClick={() => setFullPreview((open) => !open)}>{fullPreview ? "Show less" : "Open full preview"}</button>
            <p className="share-access">Anyone with the link can view this copy. Changes to your plan won't change it.</p>
          </section>

          <section className="share-section" aria-labelledby="share-send-title">
            <h3 id="share-send-title">Share</h3>
            {phase !== "ready" && <button type="button" className="share-primary" onClick={createLink} disabled={phase === "creating"}><Link2 className="h-5 w-5" aria-hidden="true" />{phase === "creating" ? "Creating link…" : phase === "failed" ? "Try again" : "Create link"}</button>}
            {phase === "failed" && <p className="share-error" role="alert">{failure}</p>}
            {phase === "ready" && link && <div className="share-ready">
              <label className="share-link-field"><span className="sr-only">Share link</span><input ref={linkInputRef} readOnly value={link.url} onFocus={(event) => event.currentTarget.select()} /></label>
              <div className="share-ready-actions">
                {nativeShare() && <button type="button" className="share-primary" onClick={shareLink}><Share className="h-5 w-5" aria-hidden="true" />Share link</button>}
                <button type="button" className={nativeShare() ? "share-secondary" : "share-primary"} onClick={copyLink}>{linkCopied ? <Check className="h-5 w-5" aria-hidden="true" /> : <Copy className="h-5 w-5" aria-hidden="true" />}{linkCopied ? "Link copied" : "Copy link"}</button>
                <a className="share-secondary" href={link.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-5 w-5" aria-hidden="true" />Open link</a>
              </div>
              <p className="share-access">This link shares the version above. To change it later, publish an updated version from your shared links.</p>
            </div>}
            {/* The workout itself, ready to paste: always in view, with or without a link. */}
            <button type="button" className="share-option" onClick={copyAsText}>{textCopied ? <Check className="h-5 w-5" aria-hidden="true" /> : <Copy className="h-5 w-5" aria-hidden="true" />}<span><b>{textCopied ? "Copied as text" : "Copy as text"}</b><small>One line per exercise, with its sets, RPE and rest. Pastes into any notes or message, and straight into a plan with Import plan.</small></span></button>
            <details className="share-other">
              <summary>Other ways to share</summary>
              <div>
                <button type="button" className="share-option" onClick={canShareFiles(file ?? new File([], "x.pdf")) ? pdfShare : pdfSave} disabled={!file}>{canShareFiles(file ?? new File([], "x.pdf")) ? <FileText className="h-5 w-5" aria-hidden="true" /> : <Download className="h-5 w-5" aria-hidden="true" />}<span><b>{pdfFailed ? "PDF unavailable" : file ? `PDF of ${plan.dayOrdinal} · ${plan.dayName}` : "Preparing PDF…"}</b><small>A printable copy of this day, with a line for every set.</small></span></button>
              </div>
            </details>
            <button type="button" className="share-text-button" onClick={() => setManageOpen(true)}>Your shared links</button>
          </section>
        </>}
        <p className="workout-share-status" role="status" aria-live="polite">{status}</p>
      </div>
    </div>,
    document.body,
  );
}
