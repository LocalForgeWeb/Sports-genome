/** Kinetic Field Manual: transparent goal-specific prescription guide for the active workout stack. */
import { ChevronDown, Clock3, Layers3 } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import { getProgrammingTarget, getWorkoutDiagnostics, type ExerciseSettings, type TrainingGoal } from "@/lib/workoutPlanner";

export function ProgrammingGuidePanel({ workout, prescriptions, settings, goal, dayLabel }: { workout: Exercise[]; prescriptions: Record<number, string>; settings: Record<number, ExerciseSettings>; goal: TrainingGoal; /** The day the count describes ("Week 1 · Day 04 · Upper"), so "0 work sets" is never read as the week. */ dayLabel?: string }) {
  const target = getProgrammingTarget(goal);
  const diagnostics = getWorkoutDiagnostics(workout, prescriptions, settings, goal);
  const inBand = diagnostics.totalSets >= target.sessionSetBand[0] && diagnostics.totalSets <= target.sessionSetBand[1];

  return <section className="programming-guide-panel" aria-label="Goal-specific programming guide">
    <details className="programming-guide-disclosure">
      <summary>
        {/* Title, then what the count is counting, then the one action - in that
            order. The count used to sit beside the title as a display-size number
            with no scope, so "0 work sets" read as a verdict on the week. */}
        <div><p className="metric-label">Planning guide</p><h3>{goal}</h3><p><strong>{diagnostics.totalSets} work sets</strong>{dayLabel ? ` in ${dayLabel}` : " in this workout"}{inBand ? " · inside the planning band" : ` · band ${target.sessionSetBand[0]}–${target.sessionSetBand[1]}`}</p></div>
        <div className="programming-guide-summary-signal"><span>Open planning guide</span><ChevronDown className="h-4 w-4" aria-hidden="true" /></div>
      </summary>
      <div className="programming-guide-details">
        <div className="programming-guide-intro"><p>Use this as an adjustable planning reference rather than a rigid rule. The active prescription remains fully editable.</p></div>
        <div className="programming-guide-stats"><div><span><Layers3 className="h-3.5 w-3.5" /> working sets in this workout</span><strong>{diagnostics.totalSets}</strong><small>{inBand ? "Inside the current planning band" : `Reference band: ${target.sessionSetBand[0]}–${target.sessionSetBand[1]}`}</small></div><div><span><Clock3 className="h-3.5 w-3.5" /> work-set approach</span><strong>{target.workingSetCue}</strong><small>{target.repetitionCue}</small></div></div>
        <div className="programming-guide-cues"><article><span>Rest</span><p>{target.restCue}</p></article><article><span>Weekly context</span><p>{target.weeklyVolumeCue}</p></article></div>
        <details className="programming-guide-boundary"><summary>Planning limits</summary><p>{target.evidenceBoundary}</p></details>
      </div>
    </details>
  </section>;
}
