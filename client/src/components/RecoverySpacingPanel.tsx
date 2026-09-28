import { ArrowRight, ChevronDown } from "lucide-react";
import type { TrainingGoal } from "@/lib/workoutPlanner";
import type { WeeklyPlan, WeeklyPrescriptionStore } from "@/lib/weeklyVolume";
import { getRecoverySpacingAlerts } from "@/lib/recoverySpacing";
import "../recovery-spacing.css";

/**
 * How adjacent planned sessions share muscles.
 *
 * The check compares saved days in plan order; the plan carries no dates, so it
 * speaks of adjacent planned sessions, never of consecutive calendar days. An
 * overlap is a fact about the plan, not a finding about recovery, so it is
 * stated as a comparison - "Trapezius · Push 4.5 / Pull 7" - with the two
 * sessions named on every value, and without a warning icon: the reader decides.
 */
export function RecoverySpacingPanel({ plan, prescriptions, goal, onOpenDay }: { plan: WeeklyPlan; prescriptions: WeeklyPrescriptionStore; goal: TrainingGoal; /** Opens that day in the plan, so the comparison has somewhere to act. */ onOpenDay?: (dayName: string) => void }) {
  const alerts = getRecoverySpacingAlerts(plan, prescriptions, goal);
  const savedDays = Object.values(plan).filter((workout) => workout.length).length;
  const summary = savedDays < 2
    ? "Save at least two training days to compare how adjacent sessions share muscles."
    : alerts.length
      ? `${alerts.length} adjacent ${alerts.length === 1 ? "pair shares" : "pairs share"} heavy muscle exposure in the saved plan.`
      : "No heavy shared muscle exposure between adjacent saved days.";
  return <section className="recovery-spacing-panel" aria-label="Recovery spacing between saved training days">
    <div className="recovery-spacing-head"><div><p className="metric-label">Saved-week spacing</p><h3>Recovery spacing</h3><p>{summary}</p></div></div>
    {alerts.length ? <div className="recovery-spacing-list">{alerts.map((alert) => <article key={`${alert.previousDay}-${alert.nextDay}`} className={`recovery-spacing-${alert.severity}`}>
      <div className="recovery-spacing-row-head">
        <div><strong>{alert.previousDay} → {alert.nextDay}</strong><small>{alert.severity === "priority" ? "Heavy shared exposure" : "Shared muscle exposure"} · adjacent planned sessions</small></div>
        {onOpenDay && <button type="button" onClick={() => onOpenDay(alert.nextDay)}>Open {alert.nextDay} <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>}
      </div>
      <ul className="recovery-spacing-muscles">
        {alert.sharedMuscles.slice(0, 4).map((muscle) => <li key={muscle.muscle}><span>{muscle.label}</span><span className="recovery-spacing-values"><b>{alert.previousDay}</b> {muscle.previousSets} <i aria-hidden="true">/</i> <b>{alert.nextDay}</b> {muscle.nextSets} <small>sets</small></span></li>)}
        {alert.sharedMuscles.length > 4 && <li className="recovery-spacing-more">+{alert.sharedMuscles.length - 4} more shared</li>}
      </ul>
    </article>)}</div> : savedDays >= 2 ? <p className="recovery-spacing-clear">Spacing check clear for the saved plan. It reads planned sets only, not readiness, sleep, sport practice or pain.</p> : null}
    <details className="recovery-spacing-details"><summary>How this spacing check works <ChevronDown className="h-4 w-4" /></summary><p>It compares saved days that sit next to each other in plan order; the plan has no dates, so it says nothing about calendar spacing. A muscle is listed when it has at least three estimated sets on both days; primary-muscle sets count fully and supporting-muscle exposure counts at half. An overlap is a planning prompt to consider moving a muscle slot, lowering the second day's direct sets or inserting a lower-overlap day. It is not a recovery, injury or medical assessment, and it does not say how much rest is needed.</p></details>
  </section>;
}
