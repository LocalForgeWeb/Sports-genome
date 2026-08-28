/** Kinetic Field Manual: transparent goal-specific prescription guide for the active workout stack. */
import { BarChart3, Clock3, Layers3 } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import { getProgrammingTarget, getWorkoutDiagnostics, type ExerciseSettings, type TrainingGoal } from "@/lib/workoutPlanner";

export function ProgrammingGuidePanel({ workout, prescriptions, settings, goal }: { workout: Exercise[]; prescriptions: Record<number, string>; settings: Record<number, ExerciseSettings>; goal: TrainingGoal }) {
  const target = getProgrammingTarget(goal);
  const diagnostics = getWorkoutDiagnostics(workout, prescriptions, settings, goal);
  const inBand = diagnostics.totalSets >= target.sessionSetBand[0] && diagnostics.totalSets <= target.sessionSetBand[1];
  return <section className="programming-guide-panel" aria-label="Goal-specific programming guide"><div className="programming-guide-head"><div><p className="metric-label">Evidence-informed planning band</p><h3>{goal}</h3><p>Use this as an adjustable planning reference rather than a rigid rule. The active prescription remains fully editable.</p></div><BarChart3 className="h-5 w-5" /></div><div className="programming-guide-stats"><div><span><Layers3 className="h-3.5 w-3.5" /> session working sets</span><strong>{diagnostics.totalSets}</strong><small>{inBand ? "Inside the current planning band" : `Reference band: ${target.sessionSetBand[0]}–${target.sessionSetBand[1]}`}</small></div><div><span><Clock3 className="h-3.5 w-3.5" /> work-set approach</span><strong>{target.workingSetCue}</strong><small>{target.repetitionCue}</small></div></div><div className="programming-guide-cues"><article><span>Rest</span><p>{target.restCue}</p></article><article><span>Weekly context</span><p>{target.weeklyVolumeCue}</p></article></div><details className="programming-guide-boundary"><summary>Planning limits</summary><p>{target.evidenceBoundary}</p></details></section>;
}
