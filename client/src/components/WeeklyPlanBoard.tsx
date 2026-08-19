/** Modern Kinetic Field Manual: a compact weekly rail that makes the active draft and saved day plans visible. */
import type { Exercise } from "@/lib/exerciseCatalog";
import type { SplitDay } from "@/components/SplitDraftControls";

type WeeklyPlan = Record<string, Exercise[]>;

export function WeeklyPlanBoard({ days, activeIndex, plan, onChoose, onSave }: { days: SplitDay[]; activeIndex: number; plan: WeeklyPlan; onChoose: (index: number) => void; onSave: () => void }) {
  return <section className="weekly-plan-board" aria-label="Weekly plan board"><div className="weekly-plan-head"><div><p className="metric-label">Weekly map</p><h3>Build the week</h3></div><button onClick={onSave}>Save active day</button></div><div className="weekly-day-grid">{days.map((day, index) => { const key = `${index}-${day}`; const exercises = plan[key] || []; return <button key={key} onClick={() => onChoose(index)} aria-pressed={index === activeIndex} className={`weekly-day-card ${index === activeIndex ? "weekly-day-active" : ""}`}><span>Day {String(index + 1).padStart(2, "0")}</span><strong>{day}</strong><small>{exercises.length ? `${exercises.length} exercises saved` : index === activeIndex ? "Active draft" : "Not drafted"}</small></button>; })}</div></section>;
}
