import { useMemo, useState } from "react";
import { Check, ClipboardPaste, CornerDownRight, Layers3, SlidersHorizontal, X } from "lucide-react";
import { exercises, type Exercise } from "@/lib/exerciseCatalog";

/** Kinetic Field Manual: parse once, inspect confidence, then load only user-confirmed exercise identity into the editable plan. */
export type ImportConfidence = "exact" | "likely" | "confirmed" | "unmatched";
export type ImportCandidate = { exercise: Exercise; score: number };
export type ImportedRoutineItem = { exercise: Exercise; prescription: string; raw: string; rpe?: string; rest?: string; notes?: string; confidence: ImportConfidence; candidates: ImportCandidate[] };
export type ImportedRoutineContext = { raw: string; kind: "warm-up" | "set instruction" | "plan note" };
export type ImportedRoutineUnmatched = { raw: string; prescription: string; rpe?: string; rest?: string; notes?: string; candidates: ImportCandidate[] };
export type ImportedRoutineDay = { label: string; items: ImportedRoutineItem[]; context: ImportedRoutineContext[]; unmatched: ImportedRoutineUnmatched[] };
export type ImportedRoutine = { title?: string; days: ImportedRoutineDay[]; unmatched: string[] };

function normalize(value: string) { return value.toLowerCase().replace(/[–—|,()[\]{}]/g, " ").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim(); }
function isDayHeader(raw: string) {
  const value = raw.trim().replace(/[:\-–—]+$/, "");
  const split = "push|pull|legs|upper|lower|full body|full-body|sport transfer|conditioning|recovery|monday|tuesday|wednesday|thursday|friday|saturday|sunday";
  return new RegExp(`^(?:day\\s*\\d+(?:\\s*[-–—:]\\s*(?:${split}))?|(?:${split})(?:\\s+day)?)$`, "i").test(value);
}
function cleanDayLabel(raw: string) { return raw.trim().replace(/[:\-–—]+$/, "").replace(/^day\s*\d+\s*[-–—:]?\s*/i, "").replace(/\s+day$/i, "").trim() || raw.trim().replace(/[:\-–—]+$/, ""); }

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
  const standard = compact.match(/(\d+)\s*(?:x|×)\s*(\d+(?:\s*[-–]\s*\d+)?(?:\s*(?:sec|seconds|min|minutes))?)/i);
  const setsOf = compact.match(/(\d+)\s*sets?\s*(?:of\s*)?(\d+(?:\s*[-–]\s*\d+)?(?:\s*(?:sec|seconds|min|minutes))?)/i);
  const match = standard || setsOf;
  const rpeMatch = compact.match(/(?:rpe\s*@?\s*|@\s*)(\d+(?:\.5)?)/i);
  const restMatch = compact.match(/(?:rest\s*[:@]?\s*)(\d+\s*(?:sec|seconds|s|min|minutes|m))/i);
  const name = normalize(match ? compact.slice(0, match.index) : compact).replace(/[-:]+$/, "").trim();
  const prescription = match ? `${match[1]} × ${match[2]}` : "3 × 8–12";
  const notes = compact.match(/\(([^)]+)\)/)?.[1] || compact.split(/\s+[·|]\s+/).slice(1).join(" · ") || "";
  return { raw, name, prescription, rpe: rpeMatch ? `RPE ${rpeMatch[1]}` : undefined, rest: restMatch ? restMatch[1].replace(/^\d+\s*s$/i, (value) => `${value.slice(0, -1)} sec`) : undefined, notes: notes && !/^(rpe|rest)/i.test(notes) ? notes : undefined };
}

function parseRoutine(source: string, manualMatches: Record<string, number>): ImportedRoutine {
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

export function StackImportPanel({ onClose, onImport }: { onClose: () => void; onImport: (routine: ImportedRoutine) => void }) {
  const [source, setSource] = useState("Push Day\nBarbell Bench Press — 3 x 8 @ RPE 8 · Rest 120 sec\nCable Row — 3 x 10\n\nLower Day\nRomanian Deadlift — 3 x 8 · RPE 8\nBulgarian Split Squat — 3 x 8 (each leg)");
  const [manualMatches, setManualMatches] = useState<Record<string, number>>({});
  const routine = useMemo(() => parseRoutine(source, manualMatches), [source, manualMatches]);
  const matched = routine.days.reduce((total, day) => total + day.items.length, 0);
  const reviewCount = routine.days.reduce((total, day) => total + day.items.filter((item) => item.confidence === "likely").length + day.unmatched.filter((item) => item.candidates.length).length, 0);
  const loadedDays = routine.days.filter((day) => day.items.length);
  const chooseMatch = (raw: string, value: string) => setManualMatches((current) => value ? { ...current, [raw]: Number(value) } : current);
  return <div className="routine-import-scrim fixed inset-0 z-[70] bg-[#06172d]/72 p-4 backdrop-blur-sm"><section className="stack-import-modal routine-import-modal"><div className="flex items-start justify-between gap-4"><div><p className="metric-label">Routine import</p><h3>Paste the full plan.</h3><p className="mt-2 max-w-xl text-xs leading-5 text-[#5a7491]">Use day headers, one exercise per line, and optional sets, reps, RPE, rest, or notes. Set headers, warm-ups, and plan instructions remain separate; ambiguous exercise names can be corrected before loading.</p></div><button onClick={onClose} aria-label="Close routine import" className="grid h-9 w-9 place-items-center rounded-full border border-[#c8d9ec] text-[#2a527f]"><X className="h-4 w-4" /></button></div><div className="routine-import-body mt-5 grid gap-4 lg:grid-cols-[1fr_.95fr]"><label className="stack-import-input"><span>Paste routine</span><textarea value={source} onChange={(event) => { setSource(event.target.value); setManualMatches({}); }} placeholder="Day 1 — Push&#10;Barbell Bench Press — 3 x 8 @ RPE 8&#10;Set 1: 10 reps, controlled tempo&#10;..." /></label><div className="stack-import-preview"><div className="flex items-start justify-between gap-3"><div><p className="metric-label">Parsed preview</p><p className="mt-1 text-xs text-[#56708d]">{matched} matched exercise{matched === 1 ? "" : "s"} across {loadedDays.length} workout day{loadedDays.length === 1 ? "" : "s"}. {reviewCount ? `${reviewCount} match${reviewCount === 1 ? "" : "es"} need review.` : "All identities are ready."}</p></div><Layers3 className="h-5 w-5 text-[#2d6cdf]" /></div><div className="routine-preview-days">{routine.days.length ? routine.days.map((day, dayIndex) => <details key={`${day.label}-${dayIndex}`} className="routine-preview-day" open={dayIndex === 0}><summary><span><strong>{day.label}</strong><small>{day.items.length} matched · {day.context.length} saved as plan context · {day.unmatched.length} unresolved</small></span><CornerDownRight className="h-4 w-4" /></summary><div>{day.items.map((item, index) => <div key={`${item.raw}-${index}`} className={`stack-import-row stack-import-match stack-import-${item.confidence}`}><span><Check className="h-3.5 w-3.5" /></span><div><strong>{item.exercise.name}</strong><small>{item.prescription}{item.rpe ? ` · ${item.rpe}` : ""}{item.rest ? ` · ${item.rest} rest` : ""}</small><em>{confidenceLabel(item.confidence)}</em></div>{item.candidates.length > 1 && <label className="import-match-select"><span>Change</span><select value={item.exercise.id} onChange={(event) => chooseMatch(item.raw, event.target.value)} aria-label={`Confirm match for ${item.raw}`}>{item.candidates.map((candidate) => <option key={candidate.exercise.id} value={candidate.exercise.id}>{candidate.exercise.name}</option>)}</select></label>}</div>)}{day.context.map((item, index) => <div key={`${item.raw}-${index}`} className="stack-import-row stack-import-context"><span>↳</span><div><strong>{item.raw}</strong><small>{item.kind} saved separately from exercises.</small></div></div>)}{day.unmatched.map((item, index) => <div key={`${item.raw}-${index}`} className="stack-import-row stack-import-miss"><span><SlidersHorizontal className="h-3.5 w-3.5" /></span><div><strong>{item.raw}</strong><small>{item.candidates.length ? "Choose a catalog match or keep this line unresolved." : "No confident catalog match — keep this line for review."}</small></div>{item.candidates.length ? <label className="import-match-select"><span>Resolve</span><select value="" onChange={(event) => chooseMatch(item.raw, event.target.value)} aria-label={`Choose a catalog match for ${item.raw}`}><option value="">Choose exercise</option>{item.candidates.map((candidate) => <option key={candidate.exercise.id} value={candidate.exercise.id}>{candidate.exercise.name}</option>)}</select></label> : null}</div>)}</div></details>) : <div className="routine-preview-empty">Paste a workout routine to preview day labels, matched exercises, and programming details.</div>}</div></div></div><div className="mt-5 flex flex-wrap items-center justify-between gap-3"><button onClick={onClose} className="text-[10px] font-bold uppercase tracking-[.11em] text-[#58718e]">Cancel</button><div className="text-right"><p className="text-[10px] text-[#6b829c]">{routine.unmatched.length ? `${routine.unmatched.length} line${routine.unmatched.length === 1 ? "" : "s"} remain unresolved and will not be added.` : "Exercises and plan context are separated."}</p><button disabled={!matched} onClick={() => onImport(routine)} className="stack-import-confirm"><ClipboardPaste className="h-4 w-4" /> Load {loadedDays.length > 1 ? `${loadedDays.length}-day routine` : "workout"}</button></div></div></section></div>;
}
