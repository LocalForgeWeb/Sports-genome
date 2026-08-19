import { useMemo, useState } from "react";
import { Check, ClipboardPaste, CornerDownRight, Layers3, X } from "lucide-react";
import { exercises, type Exercise } from "@/lib/exerciseCatalog";

/** Modern Kinetic Field Manual: paste once, inspect parsed days, then hand an editable routine to the Custom Builder. */
export type ImportedRoutineItem = { exercise: Exercise; prescription: string; raw: string; rpe?: string; rest?: string; notes?: string };
export type ImportedRoutineDay = { label: string; items: ImportedRoutineItem[]; unmatched: string[] };
export type ImportedRoutine = { title?: string; days: ImportedRoutineDay[]; unmatched: string[] };

function normalize(value: string) { return value.toLowerCase().replace(/[–—|,()[\]{}]/g, " ").replace(/\s+/g, " ").trim(); }
function isDayHeader(raw: string) {
  const value = raw.trim().replace(/[:\-–—]+$/, "");
  const split = "push|pull|legs|upper|lower|full body|full-body|sport transfer|conditioning|recovery|monday|tuesday|wednesday|thursday|friday|saturday|sunday";
  return new RegExp(`^(?:day\\s*\\d+(?:\\s*[-–—:]\\s*(?:${split}))?|(?:${split})(?:\\s+day)?)$`, "i").test(value);
}
function cleanDayLabel(raw: string) { return raw.trim().replace(/[:\-–—]+$/, "").replace(/^day\s*\d+\s*[-–—:]?\s*/i, "").replace(/\s+day$/i, "").trim() || raw.trim().replace(/[:\-–—]+$/, ""); }
function findExercise(name: string) {
  const normalized = normalize(name);
  const exact = exercises.find((exercise) => normalize(exercise.name) === normalized);
  return exact || exercises.find((exercise) => normalize(exercise.name).includes(normalized) || normalized.includes(normalize(exercise.name)));
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
  const exercise = name ? findExercise(name) : undefined;
  return { raw, exercise, prescription, rpe: rpeMatch ? `RPE ${rpeMatch[1]}` : undefined, rest: restMatch ? restMatch[1].replace(/^\d+\s*s$/i, (value) => `${value.slice(0, -1)} sec`) : undefined, notes: notes && !/^(rpe|rest)/i.test(notes) ? notes : undefined };
}
function parseRoutine(source: string): ImportedRoutine {
  const days: ImportedRoutineDay[] = [];
  const unmatched: string[] = [];
  let title: string | undefined;
  let active: ImportedRoutineDay | undefined;
  const ensureDay = () => { if (!active) { active = { label: "Imported session", items: [], unmatched: [] }; days.push(active); } return active; };
  source.split(/\n+/).map((line) => line.trim()).filter(Boolean).forEach((line) => {
    if (isDayHeader(line)) { active = { label: cleanDayLabel(line), items: [], unmatched: [] }; days.push(active); return; }
    const parsed = parseExerciseLine(line);
    if (parsed.exercise) { ensureDay().items.push({ exercise: parsed.exercise, prescription: parsed.prescription, raw: parsed.raw, rpe: parsed.rpe, rest: parsed.rest, notes: parsed.notes }); return; }
    if (!active && !title && line.length < 72) { title = line; return; }
    ensureDay().unmatched.push(line); unmatched.push(line);
  });
  return { title, days: days.filter((day) => day.items.length || day.unmatched.length), unmatched };
}

export function StackImportPanel({ onClose, onImport }: { onClose: () => void; onImport: (routine: ImportedRoutine) => void }) {
  const [source, setSource] = useState("Push Day\nBarbell Bench Press — 3 x 8 @ RPE 8 · Rest 120 sec\nCable Row — 3 x 10\n\nLower Day\nRomanian Deadlift — 3 x 8 · RPE 8\nBulgarian Split Squat — 3 x 8 (each leg)");
  const routine = useMemo(() => parseRoutine(source), [source]);
  const matched = routine.days.reduce((total, day) => total + day.items.length, 0);
  const loadedDays = routine.days.filter((day) => day.items.length);
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-[#06172d]/72 p-4 backdrop-blur-sm"><section className="stack-import-modal routine-import-modal"><div className="flex items-start justify-between gap-4"><div><p className="metric-label">Routine import</p><h3>Paste the full plan.</h3><p className="mt-2 max-w-xl text-xs leading-5 text-[#5a7491]">Use day headers, one exercise per line, and optional sets, reps, RPE, rest, or notes. Gym Optimizer previews every match before loading it into your editable weekly plan.</p></div><button onClick={onClose} aria-label="Close routine import" className="grid h-9 w-9 place-items-center rounded-full border border-[#c8d9ec] text-[#2a527f]"><X className="h-4 w-4" /></button></div><div className="mt-5 grid gap-4 lg:grid-cols-[1fr_.95fr]"><label className="stack-import-input"><span>Paste routine</span><textarea value={source} onChange={(event) => setSource(event.target.value)} placeholder="Day 1 — Push&#10;Barbell Bench Press — 3 x 8 @ RPE 8&#10;..." /></label><div className="stack-import-preview"><div className="flex items-start justify-between gap-3"><div><p className="metric-label">Parsed preview</p><p className="mt-1 text-xs text-[#56708d]">{matched} matched exercise{matched === 1 ? "" : "s"} across {loadedDays.length} workout day{loadedDays.length === 1 ? "" : "s"}.</p></div><Layers3 className="h-5 w-5 text-[#2d6cdf]" /></div><div className="routine-preview-days">{routine.days.length ? routine.days.map((day, dayIndex) => <details key={`${day.label}-${dayIndex}`} className="routine-preview-day" open={dayIndex === 0}><summary><span><strong>{day.label}</strong><small>{day.items.length} matched · {day.unmatched.length} needs review</small></span><CornerDownRight className="h-4 w-4" /></summary><div>{day.items.map((item, index) => <div key={`${item.raw}-${index}`} className="stack-import-row stack-import-match"><span><Check className="h-3.5 w-3.5" /></span><div><strong>{item.exercise.name}</strong><small>{item.prescription}{item.rpe ? ` · ${item.rpe}` : ""}{item.rest ? ` · ${item.rest} rest` : ""}</small></div></div>)}{day.unmatched.map((line, index) => <div key={`${line}-${index}`} className="stack-import-row stack-import-miss"><span>!</span><div><strong>{line}</strong><small>No catalog match — keep this line for review.</small></div></div>)}</div></details>) : <div className="routine-preview-empty">Paste a workout routine to preview day labels, matched exercises, and programming details.</div>}</div></div></div><div className="mt-5 flex flex-wrap items-center justify-between gap-3"><button onClick={onClose} className="text-[10px] font-bold uppercase tracking-[.11em] text-[#58718e]">Cancel</button><div className="text-right"><p className="text-[10px] text-[#6b829c]">{routine.unmatched.length ? `${routine.unmatched.length} line${routine.unmatched.length === 1 ? "" : "s"} will remain unassigned.` : "All visible lines matched."}</p><button disabled={!matched} onClick={() => onImport(routine)} className="stack-import-confirm"><ClipboardPaste className="h-4 w-4" /> Load {loadedDays.length > 1 ? `${loadedDays.length}-day routine` : "workout"}</button></div></div></section></div>;
}
