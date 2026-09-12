import type { Exercise } from "@/lib/exerciseCatalog";
import { getWorkoutDiagnostics, type ExerciseSettings, type TrainingGoal } from "@/lib/workoutPlanner";
import { equipmentProfileSummary, type AthleteEquipmentProfile } from "@/lib/equipmentProfile";
import { logicCalibration } from "@/lib/evidenceTraceability";

function storedEquipmentSummary() {
  if (typeof window === "undefined") return undefined;
  try {
    const profile = JSON.parse(window.localStorage.getItem("gym-optimizer-athlete-profile-v1") || "null") as { baseline?: { equipment?: AthleteEquipmentProfile } } | null;
    return profile?.baseline?.equipment ? equipmentProfileSummary(profile.baseline.equipment) : undefined;
  } catch {
    return undefined;
  }
}

export function WorkoutHealthPanel({ workout, prescriptions, settings, goal = "Athleticism", gymMinutes = logicCalibration.workoutReview.defaultGymMinutes, equipmentSummary }: { workout: Exercise[]; prescriptions: Record<number, string>; settings: Record<number, ExerciseSettings>; goal?: TrainingGoal; gymMinutes?: number; equipmentSummary?: string }) {
  const diagnostics = getWorkoutDiagnostics(workout, prescriptions, settings, goal, gymMinutes);
  const signal = diagnostics.fatigueExposure >= logicCalibration.workoutReview.highFatigueReview ? "High" : diagnostics.fatigueExposure >= logicCalibration.workoutReview.moderateFatigueReview ? "Moderate" : "Managed";
  const activeEquipmentSummary = equipmentSummary || storedEquipmentSummary();
  return <section id="stack-review" className="workout-health-panel" aria-label="Session review">
    <details className="workout-health-disclosure">
      <summary><div><p className="metric-label !text-[#9cb4d0]">Stack review</p><h3>Coach scan</h3></div><div><span className={`health-signal health-signal-${signal.toLowerCase()}`}>{signal} planning signal</span><span className="health-review-link">Review</span></div></summary>
      <div className="workout-health-content">
        <div className="health-stat-grid"><div><strong>{diagnostics.totalSets}</strong><span>planned work sets</span></div><div><strong>~{diagnostics.estimatedMinutes}m</strong><span>estimated time</span></div><div><strong>{diagnostics.sessionLoad}</strong><span>total effort</span></div><div><strong>{diagnostics.redundancy}%</strong><span>muscle overlap</span></div></div>
        {activeEquipmentSummary && <div className="health-block"><p className="metric-label !text-[#9cb4d0]">Automatic stack equipment</p><p className="health-prompt">{activeEquipmentSummary}</p></div>}
        <div className="health-block"><p className="metric-label !text-[#9cb4d0]">Time budget / {diagnostics.gymTimeBudget.label}</p><p className="health-prompt">{diagnostics.gymTimeBudget.scopeCue}</p></div>
        <div className="health-block"><p className="metric-label !text-[#9cb4d0]">Set target / {diagnostics.target.goal}</p><p className="health-prompt">{diagnostics.target.sessionSetBand[0]}–{diagnostics.target.sessionSetBand[1]} working sets is what this app aims for in a session. {diagnostics.target.workingSetCue}.</p><p className="health-boundary !px-0 !pb-0">{diagnostics.target.repetitionCue} {diagnostics.target.restCue} {diagnostics.target.evidenceBoundary}</p></div>
        <div className="health-block"><p className="metric-label !text-[#9cb4d0]">Pattern balance</p><div className="health-chip-row">{diagnostics.dominantPatterns.length ? diagnostics.dominantPatterns.map(([pattern, count]) => <span key={pattern}>{pattern} <b>{count}</b></span>) : <span>No exercises yet</span>}</div></div>
        <div className="health-block"><p className="metric-label !text-[#9cb4d0]">Coach cue</p>{diagnostics.prompts.map((prompt) => <p key={prompt} className="health-prompt">{prompt}</p>)}</div>
        <p className="health-boundary">These are planning estimates from the workout as written. They are not a measured recovery, training-stress, performance, or medical readiness score.</p>
      </div>
    </details>
  </section>;
}
