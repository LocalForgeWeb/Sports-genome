/** Modern Kinetic Field Manual: a compact weekly rail that makes the active draft and saved day plans visible. */
import type { Exercise } from "@/lib/exerciseCatalog";
import type { SplitDay } from "@/lib/splitCycle";
import type { DayTrainingState } from "@/lib/liveSession";

type WeeklyPlan = Record<string, Exercise[]>;

/**
 * A day that has been trained no longer looks like one that was only written
 * down. Measured mid-workout, the day being trained read "6 exercises" — exactly
 * what it read before the session started, and what a day that will never be
 * trained reads too.
 */
export function WeeklyPlanBoard({ days, activeIndex, plan, trainingStateFor, onChoose, onSave }: { days: SplitDay[]; activeIndex: number; plan: WeeklyPlan; trainingStateFor?: (index: number) => DayTrainingState | null; onChoose: (index: number) => void; onSave: () => void }) {
  return <section className="weekly-plan-board" aria-label="Weekly plan board"><div className="weekly-plan-head"><div><p className="metric-label">Weekly map</p><h3>Build the week</h3></div><button onClick={onSave}>Save day</button></div><div className="weekly-day-grid">{days.map((day, index) => { const key = `${index}-${day}`; const exercises = plan[key] || []; const trained = trainingStateFor?.(index) || null; return <button key={key} onClick={() => onChoose(index)} aria-pressed={index === activeIndex} className={`weekly-day-card ${index === activeIndex ? "weekly-day-active" : ""}${trained ? ` weekly-day-${trained}` : ""}`}><span>Day {String(index + 1).padStart(2, "0")}{trained && <b className="weekly-day-state">{trained === "live" ? "Training now" : "Trained"}</b>}</span><strong>{day}</strong><small>{exercises.length ? `${exercises.length} exercise${exercises.length === 1 ? "" : "s"}` : index === activeIndex ? "Building now" : "Empty"}</small></button>; })}</div></section>;
}
