import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ClipboardPaste, CornerDownRight, Layers3, SlidersHorizontal, X } from "lucide-react";
import { isKeyForAnotherLayer } from "@/lib/modalLayer";
import { exercises, type Exercise } from "@/lib/exerciseCatalog";
import { isRoutineDayHeader, routineDayLabel } from "@/lib/routineDayHeader";
import { formatPrescription, parsePrescription } from "@/lib/setPrescription";
import { readSharedWorkoutText } from "@/lib/sharedWorkoutText";
import { shareTokenFromText, type PendingSharedSave } from "@/lib/shareLinks";
import { SharedLinkImportCard } from "@/components/SharedLinkImportCard";

/** Kinetic Field Manual: parse once, inspect confidence, then load only user-confirmed exercise identity into the editable plan. */
export type ImportConfidence = "exact" | "likely" | "confirmed" | "unmatched";
export type ImportCandidate = { exercise: Exercise; score: number };
export type ImportedRoutineItem = { exercise: Exercise; prescription: string; raw: string; rpe?: string; rest?: string; notes?: string; confidence: ImportConfidence; candidates: ImportCandidate[] };
export type ImportedRoutineContext = { raw: string; kind: "warm-up" | "set instruction" | "plan note" };
export type ImportedRoutineUnmatched = { raw: string; name?: string; prescription: string; rpe?: string; rest?: string; notes?: string; candidates: ImportCandidate[] };
export type ImportedRoutineDay = { label: string; items: ImportedRoutineItem[]; context: ImportedRoutineContext[]; unmatched: ImportedRoutineUnmatched[] };
/** `source` is "sports-genome" when the paste is a workout this app copied: its unmatched lines are real exercises, not stray text. */
export type ImportedRoutine = { title?: string; days: ImportedRoutineDay[]; unmatched: string[]; source?: "sports-genome" | "general" };

function normalize(value: string) { return value.toLowerCase().replace(/[–—|,()[\]{}]/g, " ").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim(); }
const isDayHeader = isRoutineDayHeader;
const cleanDayLabel = routineDayLabel;

function candidateMatches(name: string): ImportCandidate[] {
  const cleaned = name.replace(/\([^)]*\)/g, "");
  const candidates = Array.from(new Set([normalize(name), normalize(cleaned)])).filter(Boolean);
  const scored = exercises.map((exercise) => {
    const exerciseName = normalize(exercise.name);
    let score = 0;
    candidates.forEach((candidate) => {
      if (candidate === exerciseName) score = Math.max(score, 100);
      else if (exerciseName.includes(candidate) || candidate.includes(exerciseName)) score = Math.max(score, 78 - Math.min(18, Math.abs(exerciseName.length - candidate.length)));
      else {
        const tokens = candidate.split(" ").filter((token) => token.length > 2);
        const overlap = tokens.filter((token) => exerciseName.includes(token)).length;
        if (tokens.length >= 2 && overlap) score = Math.max(score, Math.round((overlap / tokens.length) * 64));
      }
    });
    return { exercise, score };
  }).filter((candidate) => candidate.score >= 38).sort((a, b) => b.score - a.score || a.exercise.id - b.exercise.id).slice(0, 4);
  return scored;
}

function classifyContextLine(raw: string): ImportedRoutineContext["kind"] | undefined {
  const value = raw.trim().toLowerCase();
  if (/^(?:set\s*\d+|week\s*\d+|block\s*\d+|round\s*\d+|circuit\s*\d+|exercise\s*\d+)\b/.test(value)) return "set instruction";
  if (/\b(?:warm[- ]?up|mobility|activation|dynamic prep|cool[- ]?down|stretch)\b/.test(value)) return "warm-up";
  if (/\b(?:rpe|rir|reps?\s*(?:short|in reserve)|to failure|tempo|rest|break|minutes?|seconds?|sec|sets?)\b/.test(value)) return "set instruction";
  if (/^(?:notes?|focus|cue|goal|progression|instructions?)\b/.test(value)) return "plan note";
  return undefined;
}

function parseExerciseLine(raw: string) {
  const compact = raw.replace(/^[-•*\d.)\s]+/, "").trim();
  const standard = compact.match(/(\d+)\s*(?:x|×)\s*(\d+(?:\s*[-–]\s*\d+)?(?:\s*(?:sec|seconds|min|minutes))?(?:\s*\/\s*\d+(?:\s*[-–]\s*\d+)?(?:\s*(?:sec|seconds|min|minutes))?)*)/i);
  const setsOf = compact.match(/(\d+)\s*sets?\s*(?:of\s*)?(\d+(?:\s*[-–]\s*\d+)?(?:\s*(?:sec|seconds|min|minutes))?(?:\s*\/\s*\d+(?:\s*[-–]\s*\d+)?(?:\s*(?:sec|seconds|min|minutes))?)*)/i);
  const match = standard || setsOf;
  const rpeMatch = compact.match(/(?:rpe\s*@?\s*|@\s*)(\d+(?:\.5)?)/i);
  const restMatch = compact.match(/(?:rest\s*[:@]?\s*)(\d+\s*(?:sec|seconds|s|min|minutes|m))/i);
  const name = normalize(match ? compact.slice(0, match.index) : compact).replace(/[-:]+$/, "").trim();
  // Normalised through the shared reader so an imported slash list is stored in
  // exactly the form the editor writes, spacing and all. A line with no sets and reps
  // has none: it used to be given "3 × 8–12", a prescription nobody wrote.
  const prescription = match ? formatPrescription(parsePrescription(`${match[1]} × ${match[2]}`).sets, /\//.test(match[2])) : "";
  const notes = compact.match(/\(([^)]+)\)/)?.[1] || compact.split(/\s+[·|]\s+/).slice(1).join(" · ") || "";
  return { raw, name, prescription, rpe: rpeMatch ? `RPE ${rpeMatch[1]}` : undefined, rest: restMatch ? restMatch[1].replace(/^\d+\s*s$/i, (value) => `${value.slice(0, -1)} sec`) : undefined, notes: notes && !/^(rpe|rest)/i.test(notes) ? notes : undefined };
}

/** A prescription as the editor writes it, or none. */
function normalisedPrescription(value: string): string {
  const trimmed = value.trim();
  if (!/^\d+\s*(?:×|x)\s*\S/i.test(trimmed)) return "";
  return formatPrescription(parsePrescription(trimmed).sets, /\//.test(trimmed));
}

/**
 * A workout Sports Genome copied, read line for line: its days, its exercises in
 * order by their catalog names, and each one's own prescription, RPE, rest and note.
 * Nothing is guessed or filled in.
 */
function parseSharedRoutine(source: string, manualMatches: Record<string, number>): ImportedRoutine | null {
  const shared = readSharedWorkoutText(source);
  if (!shared) return null;
  const unmatched: string[] = [];
  const days = shared.days.map((day): ImportedRoutineDay => {
    const items: ImportedRoutineItem[] = [];
    const missing: ImportedRoutineUnmatched[] = [];
    for (const line of day.lines) {
      const candidates = candidateMatches(line.name);
      const exact = exercises.find((exercise) => normalize(exercise.name) === normalize(line.name));
      const manual = exercises.find((exercise) => exercise.id === manualMatches[line.raw]);
      const entry = { prescription: normalisedPrescription(line.prescription), rpe: line.rpe, rest: line.rest, notes: line.notes };
      const resolved = manual ?? exact;
      if (resolved) items.push({ exercise: resolved, raw: line.raw, ...entry, confidence: manual ? "confirmed" : "exact", candidates });
      else { missing.push({ raw: line.raw, name: line.name, ...entry, candidates }); unmatched.push(line.raw); }
    }
    return { label: day.label, items, context: [], unmatched: missing };
  });
  return { title: shared.title, days, unmatched, source: "sports-genome" };
}

export function parseRoutine(source: string, manualMatches: Record<string, number>): ImportedRoutine {
  const shared = parseSharedRoutine(source, manualMatches);
  if (shared) return shared;
  const days: ImportedRoutineDay[] = [];
  const unmatched: string[] = [];
  let title: string | undefined;
  let active: ImportedRoutineDay | undefined;
  const ensureDay = () => { if (!active) { active = { label: "Imported session", items: [], context: [], unmatched: [] }; days.push(active); } return active; };
  source.split(/\n+/).map((line) => line.trim()).filter(Boolean).forEach((line) => {
    if (isDayHeader(line)) { active = { label: cleanDayLabel(line), items: [], context: [], unmatched: [] }; days.push(active); return; }
    const parsed = parseExerciseLine(line);
    const candidates = parsed.name ? candidateMatches(parsed.name) : [];
    const manualExercise = exercises.find((exercise) => exercise.id === manualMatches[line]);
    const first = candidates[0];
    const confidence: ImportConfidence = manualExercise ? "confirmed" : first?.score === 100 ? "exact" : first?.score >= 68 ? "likely" : "unmatched";
    const resolved = manualExercise || (confidence === "unmatched" ? undefined : first?.exercise);
    if (resolved) { ensureDay().items.push({ exercise: resolved, prescription: parsed.prescription, raw: line, rpe: parsed.rpe, rest: parsed.rest, notes: parsed.notes, confidence, candidates }); return; }
    const contextKind = classifyContextLine(line);
    if (contextKind) { ensureDay().context.push({ raw: line, kind: contextKind }); return; }
    if (!active && !title && line.length < 72 && !candidates.length) { title = line; return; }
    ensureDay().unmatched.push({ raw: line, prescription: parsed.prescription, rpe: parsed.rpe, rest: parsed.rest, notes: parsed.notes, candidates });
    unmatched.push(line);
  });
  return { title, days: days.filter((day) => day.items.length || day.unmatched.length || day.context.length), unmatched };
}

function confidenceLabel(confidence: ImportConfidence) { return confidence === "exact" ? "Exact catalog match" : confidence === "likely" ? "Likely match — review" : confidence === "confirmed" ? "Coach confirmed" : "Unmatched — choose a candidate"; }

/**
 * `onAddShared`, when given, turns a shared link anywhere in the paste - the bare link, the
 * message it was sent in, or a workout copied as text with its link - into the shared
 * workout itself (SharedLinkImportCard), added through the same dialog as the link's page.
 */
export function StackImportPanel({ onClose, onImport, onAddShared }: { onClose: () => void; onImport: (routine: ImportedRoutine) => void; onAddShared?: (pending: PendingSharedSave) => void }) {
  const [source, setSource] = useState("Push Day\nBarbell Bench Press — 3 x 8 @ RPE 8 · Rest 120 sec\nCable Row — 3 x 10\n\nLower Day\nRomanian Deadlift — 3 x 8 · RPE 8\nBulgarian Split Squat — 3 x 8 (each leg)");
  const [manualMatches, setManualMatches] = useState<Record<string, number>>({});
  const routine = useMemo(() => parseRoutine(source, manualMatches), [source, manualMatches]);
  const matched = routine.days.reduce((total, day) => total + day.items.length, 0);
  const reviewCount = routine.days.reduce((total, day) => total + day.items.filter((item) => item.confidence === "likely").length + day.unmatched.filter((item) => item.candidates.length).length, 0);
  const loadedDays = routine.days.filter((day) => day.items.length);
  const chooseMatch = (raw: string, value: string) => setManualMatches((current) => value ? { ...current, [raw]: Number(value) } : current);
  const linkToken = onAddShared ? shareTokenFromText(source) : null;
  // A paste that is only a link (or the message it came in) has nothing to read line by line.
  const linkOnly = Boolean(linkToken) && matched === 0;
  const textId = useId();
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [pasteStatus, setPasteStatus] = useState("");
  const canReadClipboard = typeof navigator !== "undefined" && typeof navigator.clipboard?.readText === "function";
  // One tap on a phone instead of clearing the example and long-pressing the box.
  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) { setPasteStatus("There's nothing copied yet. Copy the link or the plan, then tap Paste."); return; }
      setSource(text);
      setManualMatches({});
      setPasteStatus("");
    } catch {
      setPasteStatus("This browser didn't allow pasting from here. Paste into the box instead.");
      textRef.current?.focus();
      textRef.current?.select();
    }
  };
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // Home passes a fresh onClose on every render; reading it through a ref keeps
  // the effect below from re-running and pulling focus back to Close mid-edit.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Focus moves to Close rather than the prefilled textarea, so a phone keyboard
  // does not cover the preview. Escape closes it and focus goes back to Import plan,
  // the way every other layer over this page behaves.
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      // A layer opened over the import, such as search, handles its own keys.
      if (isKeyForAnotherLayer(event, dialogRef.current)) return;
      if (event.key === "Escape") { event.stopPropagation(); onCloseRef.current(); }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
    // The opener belongs to this one presentation of the import.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className="routine-import-scrim fixed inset-0 z-[70] bg-[#06172d]/72 p-4 backdrop-blur-sm"><section ref={dialogRef} className="stack-import-modal routine-import-modal" role="dialog" aria-modal="true" aria-labelledby="routine-import-title"><div className="flex items-start justify-between gap-4"><div><p className="metric-label">Routine import</p><h3 id="routine-import-title">Paste a link or a plan.</h3><p className="mt-2 max-w-xl text-xs leading-5 text-[var(--sg-text-subtle-on-light)]">A link someone shared with you adds their workout exactly as they sent it. A written plan works too: day headers, one exercise per line, and optional sets, reps, RPE, rest, or notes. Set headers, warm-ups, and plan instructions remain separate; ambiguous exercise names can be corrected before loading.</p></div><button ref={closeRef} type="button" onClick={onClose} aria-label="Close routine import" className="grid h-9 w-9 place-items-center rounded-full border border-[#c8d9ec] text-[#2a527f]"><X className="h-4 w-4" aria-hidden="true" /></button></div><div className="routine-import-body mt-5 grid gap-4 lg:grid-cols-[1fr_.95fr]"><div className="stack-import-input"><div className="stack-import-label-row"><label htmlFor={textId}>Paste a link or routine</label>{canReadClipboard && <button type="button" className="stack-import-paste" onClick={() => void pasteFromClipboard()}><ClipboardPaste className="h-4 w-4" aria-hidden="true" />Paste</button>}</div><textarea id={textId} ref={textRef} value={source} onChange={(event) => { setSource(event.target.value); setManualMatches({}); setPasteStatus(""); }} placeholder="https://…/s/… — or —&#10;Day 1 — Push&#10;Barbell Bench Press — 3 x 8 @ RPE 8&#10;..." /><p className="stack-import-status" role="status">{pasteStatus}</p></div><div className="stack-import-preview">{linkToken && onAddShared && <SharedLinkImportCard token={linkToken} onAdd={onAddShared} />}{!linkOnly && <><div className="flex items-start justify-between gap-3"><div><p className="metric-label">Parsed preview</p><p className="mt-1 text-xs text-[#56708d]">{matched} matched exercise{matched === 1 ? "" : "s"} across {loadedDays.length} workout day{loadedDays.length === 1 ? "" : "s"}. {reviewCount ? `${reviewCount} match${reviewCount === 1 ? "" : "es"} need review.` : "All identities are ready."}</p></div><Layers3 className="h-5 w-5 text-[var(--sg-info-strong)]" /></div><div className="routine-preview-days">{routine.days.length ? routine.days.map((day, dayIndex) => <details key={`${day.label}-${dayIndex}`} className="routine-preview-day" open={dayIndex === 0}><summary><span><strong>{day.label}</strong><small>{day.items.length} matched · {day.context.length} saved as plan context · {day.unmatched.length} unresolved</small></span><CornerDownRight className="h-4 w-4" /></summary><div>{day.items.map((item, index) => <div key={`${item.raw}-${index}`} className={`stack-import-row stack-import-match stack-import-${item.confidence}`}><span><Check className="h-3.5 w-3.5" /></span><div><strong>{item.exercise.name}</strong><small>{[item.prescription || "No sets given", item.rpe, item.rest ? `Rest ${item.rest}` : "", item.notes ? `Note: ${item.notes}` : ""].filter(Boolean).join(" · ")}</small><em>{confidenceLabel(item.confidence)}</em></div>{item.candidates.length > 1 && <label className="import-match-select"><span>Change</span><select value={item.exercise.id} onChange={(event) => chooseMatch(item.raw, event.target.value)} aria-label={`Confirm match for ${item.raw}`}>{item.candidates.map((candidate) => <option key={candidate.exercise.id} value={candidate.exercise.id}>{candidate.exercise.name}</option>)}</select></label>}</div>)}{day.context.map((item, index) => <div key={`${item.raw}-${index}`} className="stack-import-row stack-import-context"><span>↳</span><div><strong>{item.raw}</strong><small>{item.kind} saved separately from exercises.</small></div></div>)}{day.unmatched.map((item, index) => <div key={`${item.raw}-${index}`} className="stack-import-row stack-import-miss"><span><SlidersHorizontal className="h-3.5 w-3.5" /></span><div><strong>{item.raw}</strong><small>{item.candidates.length ? "Choose a catalog match or keep this line unresolved." : "No confident catalog match — keep this line for review."}</small></div>{item.candidates.length ? <label className="import-match-select"><span>Resolve</span><select value="" onChange={(event) => chooseMatch(item.raw, event.target.value)} aria-label={`Choose a catalog match for ${item.raw}`}><option value="">Choose exercise</option>{item.candidates.map((candidate) => <option key={candidate.exercise.id} value={candidate.exercise.id}>{candidate.exercise.name}</option>)}</select></label> : null}</div>)}</div></details>) : <div className="routine-preview-empty">Paste a link someone shared, or a workout routine to preview day labels, matched exercises, and programming details.</div>}</div></>}</div></div><div className="mt-5 flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={onClose} className="text-[11px] font-bold uppercase tracking-[.11em] text-[#58718e]">Cancel</button><div className="text-right">{linkOnly ? <p className="text-[11px] text-[var(--sg-text-subtle-on-light)]">Add it with the shared link above.</p> : <><p className="text-[11px] text-[var(--sg-text-subtle-on-light)]">{routine.unmatched.length ? `${routine.unmatched.length} line${routine.unmatched.length === 1 ? "" : "s"} remain unresolved and will not be added.` : "Exercises and plan context are separated."}</p><button type="button" disabled={!matched} onClick={() => onImport(routine)} className="stack-import-confirm"><ClipboardPaste className="h-4 w-4" /> Load {loadedDays.length > 1 ? `${loadedDays.length}-day routine` : "workout"}</button></>}</div></div></section></div>;
}
