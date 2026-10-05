import type { Exercise } from "@/lib/exerciseCatalog";
import { getWorkoutDiagnostics, type ExerciseSettings, type TrainingGoal } from "@/lib/workoutPlanner";
import { logicCalibration } from "@/lib/evidenceTraceability";

export function WorkoutHealthPanel({ workout, prescriptions, settings, goal = "Athleticism", gymMinutes = logicCalibration.workoutReview.defaultGymMinutes, equipmentSummary }: { workout: Exercise[]; prescriptions: Record<number, string>; settings: Record<number, ExerciseSettings>; goal?: TrainingGoal; gymMinutes?: number; equipmentSummary?: string }) {
  const diagnostics = getWorkoutDiagnostics(workout, prescriptions, settings, goal, gymMinutes);
  const signal = diagnostics.fatigueExposure >= logicCalibration.workoutReview.highFatigueReview ? "High" : diagnostics.fatigueExposure >= logicCalibration.workoutReview.moderateFatigueReview ? "Moderate" : "Managed";
  /**
   * The three numbers, explained where they sit (5 October 2026 brief §8): "161 total effort"
   * and "24% muscle overlap" stood on the page with no unit, and the planned-load word with no
   * marks. Each is a planning index from the workout as written; none measures the athlete.
   */
  const marks = `Planned load from the stack's systemic fatigue index (0–100): Managed below ${logicCalibration.workoutReview.moderateFatigueReview}, Moderate from ${logicCalibration.workoutReview.moderateFatigueReview}, High from ${logicCalibration.workoutReview.highFatigueReview}.`;
  return <section id="stack-review" className="workout-health-panel" aria-label="Workout review">
    <details className="workout-health-disclosure">
      <summary><div><p className="metric-label !text-[var(--sg-text-subtle-on-dark)]">Stack review</p><h3>Coach scan</h3></div><div><span className={`health-signal health-signal-${signal.toLowerCase()}`} title={marks} aria-label={`${signal} planning signal: planned load of this workout. ${marks}`}><i aria-hidden="true" />{signal} planned load</span><span className="health-review-link">Review recommendations</span></div></summary>
      <div className="workout-health-content">
        <div className="health-stat-grid"><div><strong>{diagnostics.totalSets}</strong><span>planned work sets</span></div><div><strong>~{diagnostics.estimatedMinutes}m</strong><span>estimated time</span></div><div><strong>{diagnostics.sessionLoad}</strong><span>total effort: sets × average RPE</span></div><div><strong>{diagnostics.redundancy}%</strong><span>muscle overlap index: how alike the exercises are, 0–100</span></div></div>
        <p className="health-boundary !px-0 !pb-0">{marks} Total effort multiplies the planned sets by the average RPE written on them (default {logicCalibration.workoutReview.defaultRpe}). Muscle overlap is the mean similarity of each pair of exercises in the stack, not a share of sets.</p>
        {equipmentSummary && <div className="health-block"><p className="metric-label !text-[var(--sg-text-subtle-on-dark)]">Automatic stack equipment</p><p className="health-prompt">{equipmentSummary}</p></div>}
        <div className="health-block"><p className="metric-label !text-[var(--sg-text-subtle-on-dark)]">Time budget / {diagnostics.gymTimeBudget.label}</p><p className="health-prompt">{diagnostics.gymTimeBudget.scopeCue}</p></div>
        <div className="health-block"><p className="metric-label !text-[var(--sg-text-subtle-on-dark)]">Set target / {diagnostics.target.goal}</p><p className="health-prompt">{diagnostics.target.sessionSetBand[0]}–{diagnostics.target.sessionSetBand[1]} working sets is what this app aims for in a session. {diagnostics.target.workingSetCue}.</p><p className="health-boundary !px-0 !pb-0">{diagnostics.target.repetitionCue} {diagnostics.target.restCue} {diagnostics.target.evidenceBoundary}</p></div>
        <div className="health-block"><p className="metric-label !text-[var(--sg-text-subtle-on-dark)]">Pattern balance</p><div className="health-chip-row">{diagnostics.dominantPatterns.length ? diagnostics.dominantPatterns.map(([pattern, count]) => <span key={pattern}>{pattern} <b>{count}</b></span>) : <span>No exercises yet</span>}</div></div>
        <div className="health-block"><p className="metric-label !text-[var(--sg-text-subtle-on-dark)]">Coach cue</p>{diagnostics.prompts.map((prompt) => <p key={prompt} className="health-prompt">{prompt}</p>)}</div>
        <p className="health-boundary">These are planning estimates from the workout as written. They are not a measured recovery, training-stress, performance, or medical readiness score.</p>
      </div>
    </details>
  </section>;
}
