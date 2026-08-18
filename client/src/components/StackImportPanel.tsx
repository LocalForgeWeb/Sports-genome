/** Pasted Stack Import: client-side parsing with transparent exact/close catalog matching and no external upload. */
import { useMemo, useState } from "react";
import { Check, ClipboardPaste, X } from "lucide-react";
import { exercises, type Exercise } from "@/lib/exerciseCatalog";

export type ImportedStackItem = { exercise: Exercise; prescription: string; raw: string };

function normalize(value: string) { return value.toLowerCase().replace(/[–—|,()[\]{}]/g, " ").replace(/\s+/g, " ").trim(); }
function parseLine(raw: string) {
  const match = raw.match(/(?:^|\s)(\d+)\s*(?:x|×)\s*(\d+(?:\s*[-–]\s*\d+)?|\d+\s*(?:sec|min))(?:(?:\s*@\s*|\s+rpe\s*)(\d+(?:\.5)?))?/i);
  const name = normalize(match ? raw.slice(0, match.index) : raw).replace(/[-:]+$/, "").trim();
  const prescription = match ? `${match[1]} × ${match[2]}${match[3] ? ` · RPE ${match[3]}` : ""}` : "3 × 8–12";
  const exact = exercises.find((exercise) => normalize(exercise.name) === name);
  const close = exact || exercises.find((exercise) => normalize(exercise.name).includes(name) || name.includes(normalize(exercise.name)));
  return { raw, name, prescription, exercise: close };
}

export function StackImportPanel({ onClose, onImport }: { onClose: () => void; onImport: (items: ImportedStackItem[]) => void }) {
  const [source, setSource] = useState("Barbell Bench Press — 3 x 8\nRomanian Deadlift — 3 x 8 · RPE 8\nCable Row — 3 x 10\nBulgarian Split Squat — 3 x 8");
  const parsed = useMemo(() => source.split(/\n+/).map((line) => line.trim()).filter(Boolean).map(parseLine), [source]);
  const matches = parsed.filter((item) => item.exercise) as (ReturnType<typeof parseLine> & { exercise: Exercise })[];
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-[#06172d]/72 p-4 backdrop-blur-sm"><section className="stack-import-modal"><div className="flex items-start justify-between gap-4"><div><p className="metric-label">Pasted stack import</p><h3>Bring your training in.</h3><p className="mt-2 text-xs leading-5 text-[#5a7491]">Paste one exercise per line. Optional notation such as <strong>3 x 8</strong> or <strong>4 × 30 sec @ RPE 7</strong> is carried into the builder.</p></div><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-[#c8d9ec] text-[#2a527f]"><X className="h-4 w-4" /></button></div><div className="mt-5 grid gap-4 lg:grid-cols-[1fr_.9fr]"><label className="stack-import-input"><span>Paste your stack</span><textarea value={source} onChange={(event) => setSource(event.target.value)} /></label><div className="stack-import-preview"><p className="metric-label">Match preview</p><p className="mt-1 text-xs text-[#56708d]">{matches.length} of {parsed.length} lines matched to the exercise catalog.</p><div className="mt-3 space-y-2">{parsed.map((item, index) => <div key={`${item.raw}-${index}`} className={`stack-import-row ${item.exercise ? "stack-import-match" : "stack-import-miss"}`}><span>{item.exercise ? <Check className="h-3.5 w-3.5" /> : "!"}</span><div><strong>{item.exercise?.name || item.raw}</strong><small>{item.exercise ? item.prescription : "No catalog match — edit or skip this line."}</small></div></div>)}</div></div></div><div className="mt-5 flex items-center justify-between gap-3"><button onClick={onClose} className="text-[10px] font-bold uppercase tracking-[.11em] text-[#58718e]">Cancel</button><button disabled={!matches.length} onClick={() => onImport(matches.map((item) => ({ exercise: item.exercise, prescription: item.prescription, raw: item.raw })))} className="stack-import-confirm"><ClipboardPaste className="h-4 w-4" /> Import {matches.length} exercise{matches.length === 1 ? "" : "s"}</button></div></section></div>;
}
