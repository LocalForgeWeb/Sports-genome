/** Split Draft Controls: fast, low-friction switching between plan orientations and individual training days. */
export type SplitDay = "Push" | "Pull" | "Legs" | "Upper" | "Lower" | "Full Body" | "Sport Transfer";
export type LoadoutMode = "Athletic Power" | "Strength Foundation" | "Hypertrophy Volume" | "Capacity Circuit" | "Sport Transfer";

const descriptions: Record<LoadoutMode, string> = {
  "Athletic Power": "Explosive, low-fatigue movement quality.",
  "Strength Foundation": "Compound patterns and repeatable force work.",
  "Hypertrophy Volume": "Regional coverage with controlled volume.",
  "Capacity Circuit": "Repeatability, carries, and robust work rate.",
  "Sport Transfer": "Selected sport action and movement carryover.",
};

export function SplitDraftControls({ days, activeDay, activeLoadout, onDay, onLoadout, onDraft }: { days: SplitDay[]; activeDay: SplitDay; activeLoadout: LoadoutMode; onDay: (day: SplitDay) => void; onLoadout: (loadout: LoadoutMode) => void; onDraft: () => void }) {
  return <div className="split-draft-controls"><div className="split-row"><p className="metric-label">Training day</p><div className="split-chip-row">{days.map((day, index) => <button key={`${day}-${index}`} onClick={() => onDay(day)} className={`split-chip ${day === activeDay ? "split-chip-active" : ""}`}><span>{String(index + 1).padStart(2, "0")}</span>{day}</button>)}</div></div><div className="split-row split-row-loadout"><p className="metric-label">Loadout orientation</p><div className="split-chip-row">{(Object.keys(descriptions) as LoadoutMode[]).map((loadout) => <button key={loadout} onClick={() => onLoadout(loadout)} title={descriptions[loadout]} className={`loadout-chip ${loadout === activeLoadout ? "loadout-chip-active" : ""}`}>{loadout}</button>)}</div><div className="mt-2 flex items-center justify-between gap-3"><p className="split-helper">{descriptions[activeLoadout]}</p><button onClick={onDraft} className="split-draft-button">Draft this session</button></div></div></div>;
}
