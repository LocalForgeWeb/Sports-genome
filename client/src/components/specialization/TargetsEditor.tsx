import { useState } from "react";
import { Plus, X } from "lucide-react";
import type { StoreWrite } from "@/lib/specialization/stores";
import { goalsForBothArms, goalProgressLabel } from "@shared/specialization/goals";
import type { ArmSide, GoalMetric, GoalPeriod, GoalProgress, SpecializationGoal } from "@shared/specialization/types";
import { goalMetricLabels } from "./model";

const metrics: GoalMetric[] = ["direct_dynamic_bouts", "deliberate_hold_bouts", "deliberate_hold_seconds"];
const periodLabels: Record<GoalPeriod, string> = { calendar_week: "Per calendar week", rolling_7d: "Per rolling 7 days" };

let goalSequence = 0;
const newGoalId = () => `goal-${Date.now().toString(36)}-${(goalSequence += 1).toString(36)}`;

/**
 * "Your target" in the muscle sheet (brief §7). A target is the athlete's intent, attached
 * to one muscle, one arm, one measure and one period; "Both arms" saves two, so the arms
 * stay comparable. Direct dynamic bouts, hold bouts and hold seconds are separate targets,
 * so a hold never hides inside a set count. No muscle gets a target it was not given:
 * without one the sheet says "Not targeted", never a deficit. Removing one offers Undo.
 */
export function TargetsEditor({ regionId, nodeId, nodeName, side, goals, progress, timeZone, todayKey, onSave, onRemove }: {
  regionId: string;
  nodeId: string;
  nodeName: string;
  side: ArmSide;
  /** Every saved target for this muscle, both arms. */
  goals: readonly SpecializationGoal[];
  /** Progress for the arm on screen, from the summary. */
  progress: readonly GoalProgress[];
  timeZone: string;
  todayKey: string;
  onSave: (goals: SpecializationGoal[]) => StoreWrite;
  onRemove: (goalId: string) => StoreWrite;
}) {
  const [open, setOpen] = useState(false);
  const [metric, setMetric] = useState<GoalMetric>("direct_dynamic_bouts");
  const [target, setTarget] = useState("");
  const [period, setPeriod] = useState<GoalPeriod>("calendar_week");
  const [arms, setArms] = useState<"this" | "both">("both");
  const [error, setError] = useState<string | null>(null);
  const [removed, setRemoved] = useState<SpecializationGoal | null>(null);
  const progressFor = (goal: SpecializationGoal) => progress.find((item) => item.goal.id === goal.id) ?? null;
  const sorted = [...goals].sort((left, right) => left.side.localeCompare(right.side) || metrics.indexOf(left.metric) - metrics.indexOf(right.metric));

  const save = () => {
    const value = Number(target);
    if (!target.trim() || !Number.isFinite(value) || value <= 0) { setError("Enter a target above zero."); return; }
    const now = new Date().toISOString();
    const draft = { id: newGoalId(), regionId, nodeId, actionId: null, metric, target: value, period, startsOn: todayKey, endsOn: null, timezone: timeZone, createdAt: now, updatedAt: now };
    const result = onSave(arms === "both" ? goalsForBothArms(draft) : [{ ...draft, side }]);
    if (!result.ok) { setError(result.reason); return; }
    setError(null);
    setTarget("");
    setOpen(false);
  };
  const remove = (goal: SpecializationGoal) => {
    const result = onRemove(goal.id);
    if (result.ok) setRemoved(goal); else setError(result.reason);
  };
  const undo = () => {
    if (!removed) return;
    const result = onSave([removed]);
    if (result.ok) setRemoved(null); else setError(result.reason);
  };

  return <div className="spz-targets">
    {sorted.length ? <ul className="spz-target-list">
      {sorted.map((goal) => {
        const current = progressFor(goal);
        return <li key={goal.id} className="spz-target" data-side={goal.side} data-current={goal.side === side || undefined}>
          <span>
            <b>{goal.side === "left" ? "Left arm" : "Right arm"} · {goalMetricLabels[goal.metric]}</b>
            <small>{goal.target} {periodLabels[goal.period].toLowerCase()}{goal.side === side ? ` · ${current ? current.label : goalProgressLabel(0, goal)}` : ""}</small>
          </span>
          <button type="button" className="spz-icon-button" onClick={() => remove(goal)} aria-label={`Remove the ${goal.side}-arm target of ${goal.target} ${goalMetricLabels[goal.metric].toLowerCase()} for ${nodeName}`}><X className="h-4 w-4" aria-hidden="true" /></button>
        </li>;
      })}
    </ul> : <p className="spz-note"><b>Not targeted.</b> Nothing here is behind: a muscle without a target has no gap to show.</p>}
    {removed && <p className="spz-inline-status" role="status">Target removed. <button type="button" className="spz-link" onClick={undo}>Undo</button></p>}
    {open ? <fieldset className="spz-target-form">
      <legend>New target for {nodeName}</legend>
      <div className="spz-radio-group" role="radiogroup" aria-label="What the target counts">
        {metrics.map((item) => <label key={item} className="spz-radio"><input type="radio" name={`spz-metric-${nodeId}`} checked={metric === item} onChange={() => setMetric(item)} /><span>{goalMetricLabels[item]}</span></label>)}
      </div>
      <label className="spz-field">
        <span>Target {metric === "deliberate_hold_seconds" ? "(seconds)" : "(bouts)"}</span>
        <input type="number" inputMode="numeric" min={1} step={1} value={target} onChange={(event) => setTarget(event.target.value)} />
      </label>
      <label className="spz-field">
        <span>Period</span>
        <select value={period} onChange={(event) => setPeriod(event.target.value as GoalPeriod)}>
          {(Object.keys(periodLabels) as GoalPeriod[]).map((item) => <option key={item} value={item}>{periodLabels[item]}</option>)}
        </select>
      </label>
      <div className="spz-segment" role="group" aria-label="Which arm">
        <button type="button" aria-pressed={arms === "both"} onClick={() => setArms("both")}>Both arms</button>
        <button type="button" aria-pressed={arms === "this"} onClick={() => setArms("this")}>{side === "left" ? "Left arm only" : "Right arm only"}</button>
      </div>
      <p className="spz-note">A target is what you intend to do, not a proven growth threshold. Numbers above 15 are fine. Both arms saves one target per arm, so each can be compared and changed on its own.</p>
      {error && <p className="spz-error" role="alert">{error}</p>}
      <div className="spz-actions">
        <button type="button" className="spz-primary" onClick={save}>Save target</button>
        <button type="button" className="spz-button" onClick={() => { setOpen(false); setError(null); }}>Cancel</button>
      </div>
    </fieldset> : <button type="button" className="spz-link" onClick={() => { setOpen(true); setRemoved(null); }}><Plus className="h-4 w-4" aria-hidden="true" />Set a target</button>}
  </div>;
}
