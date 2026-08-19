import { ArrowLeftRight, ChevronDown, X } from "lucide-react";

/** Modern Kinetic Field Manual: a compact planner panel that opens only on demand and never claims the active workspace. */
export type SplitDay = "Push" | "Pull" | "Legs" | "Upper" | "Lower" | "Full Body" | "Sport Transfer";
export type LoadoutMode = "Athletic Power" | "Strength Foundation" | "Hypertrophy Volume" | "Capacity Circuit" | "Sport Transfer";

const descriptions: Record<LoadoutMode, string> = {
  "Athletic Power": "Explosive, low-fatigue movement quality.",
  "Strength Foundation": "Compound patterns and repeatable force work.",
  "Hypertrophy Volume": "Regional coverage with controlled volume.",
  "Capacity Circuit": "Repeatability, carries, and robust work rate.",
  "Sport Transfer": "Selected sport action and movement carryover.",
};

export function SplitDraftControls({ days, activeDay, activeLoadout, onDay, onLoadout, onDraft, onClose, onMove }: { days: SplitDay[]; activeDay: SplitDay; activeLoadout: LoadoutMode; onDay: (day: SplitDay) => void; onLoadout: (loadout: LoadoutMode) => void; onDraft: () => void; onClose: () => void; onMove: () => void }) {
  return <div className="split-draft-controls"><div className="planner-panel-head"><div><p className="metric-label">Session planner</p><p className="mt-1 text-sm font-bold text-white">Draft without leaving your work.</p></div><div className="flex items-center gap-1"><button onClick={onMove} className="planner-icon-button" title="Move planner to the other screen edge" aria-label="Move planner"><ArrowLeftRight className="h-4 w-4" /></button><button onClick={onClose} className="planner-icon-button" title="Close planner" aria-label="Close planner"><X className="h-4 w-4" /></button></div></div><div className="split-row"><p className="metric-label">Training day</p><div className="split-chip-row">{days.map((day, index) => <button key={`${day}-${index}`} onClick={() => onDay(day)} className={`split-chip ${day === activeDay ? "split-chip-active" : ""}`}><span>{String(index + 1).padStart(2, "0")}</span>{day}</button>)}</div></div><div className="split-row split-row-loadout"><p className="metric-label">Loadout orientation</p><div className="split-chip-row">{(Object.keys(descriptions) as LoadoutMode[]).map((loadout) => <button key={loadout} onClick={() => onLoadout(loadout)} title={descriptions[loadout]} className={`loadout-chip ${loadout === activeLoadout ? "loadout-chip-active" : ""}`}>{loadout}</button>)}</div><div className="mt-3 flex items-center justify-between gap-3"><p className="split-helper">{descriptions[activeLoadout]}</p><button onClick={onDraft} className="split-draft-button">Draft this session</button></div></div><button onClick={onClose} className="planner-collapse-link">Collapse planner <ChevronDown className="h-3.5 w-3.5" /></button></div>;
}
