import type { Exercise } from "@/lib/exerciseCatalog";
import { getWorkoutDiagnostics, type ExerciseSettings, type TrainingGoal } from "@/lib/workoutPlanner";
import { equipmentProfileSummary, type AthleteEquipmentProfile } from "@/lib/equipmentProfile";

function storedEquipmentSummary() {
  if (typeof window === "undefined") return undefined;
  try {
    const profile = JSON.parse(window.localStorage.getItem("gym-optimizer-athlete-profile-v1") || "null") as { baseline?: { equipment?: AthleteEquipmentProfile } } | null;
    return profile?.baseline?.equipment ? equipmentProfileSummary(profile.baseline.equipment) : undefined;
  } catch {
    return undefined;
  }
}

export function WorkoutHealthPanel({ workout, prescriptions, settings, goal = "Athleticism", gymMinutes = 60, equipmentSummary }: { workout: Exercise[]; prescriptions: Record<number, string>; settings: Record<number, ExerciseSettings>; goal?: TrainingGoal; gymMinutes?: number; equipmentSummary?: string }) {
  const diagnostics = getWorkoutDiagnostics(workout, prescriptions, settings, goal, gymMinutes);
  const signal = diagnostics.fatigueExposure >= 72 ? "High" : diagnostics.fatigueExposure >= 52 ? "Moderate" : "Managed";
  const activeEquipmentSummary = equipmentSummary || storedEquipmentSummary();
  return <section className="workout-health-panel" aria-label="Session diagnostics">
    <div className="workout-health-head"><div><p className="metric-label !text-[#9cb4d0]">Session diagnostics</p><h3>Coach scan</h3></div><span className={`health-signal health-signal-${signal.toLowerCase()}`}>{signal} fatigue model</span></div>
    <div className="health-stat-grid"><div><strong>{diagnostics.totalSets}</strong><span>planned work sets</span></div><div><strong>~{diagnostics.estimatedMinutes}m</strong><span>time model</span></div><div><strong>{diagnostics.sessionLoad}</strong><span>set × RPE index</span></div><div><strong>{diagnostics.redundancy}%</strong><span>overlap estimate</span></div></div>
    {activeEquipmentSummary && <div className="health-block"><p className="metric-label !text-[#9cb4d0]">Automatic stack equipment</p><p className="health-prompt">{activeEquipmentSummary}</p></div>}
    <div className="health-block"><p className="metric-label !text-[#9cb4d0]">Time budget / {diagnostics.gymTimeBudget.label}</p><p className="health-prompt">{diagnostics.gymTimeBudget.scopeCue}</p></div>
    <div className="health-block"><p className="metric-label !text-[#9cb4d0]">Goal planning band / {diagnostics.target.goal}</p><p className="health-prompt">{diagnostics.target.sessionSetBand[0]}–{diagnostics.target.sessionSetBand[1]} working sets is this app’s current session planning band. {diagnostics.target.workingSetCue}.</p><p className="health-boundary !px-0 !pb-0">{diagnostics.target.repetitionCue} {diagnostics.target.restCue} {diagnostics.target.evidenceBoundary}</p></div>
    <div className="health-block"><p className="metric-label !text-[#9cb4d0]">Pattern balance</p><div className="health-chip-row">{diagnostics.dominantPatterns.length ? diagnostics.dominantPatterns.map(([pattern, count]) => <span key={pattern}>{pattern} <b>{count}</b></span>) : <span>Awaiting exercises</span>}</div></div>
    {diagnostics.redundancyFindings.length > 0 && <div className="health-block"><p className="metric-label !text-[#9cb4d0]">Overlap map / planning estimate</p><div className="space-y-2">{diagnostics.redundancyFindings.slice(0, 3).map((finding) => <div key={`${finding.first.id}-${finding.second.id}`} className="border border-white/10 px-3 py-2 text-xs"><p className="font-bold text-white">{finding.classification} · {finding.overlapScore}/100</p><p className="mt-1 text-[#b7c5d4]">{finding.first.name} + {finding.second.name}</p><p className="mt-1 leading-5 text-[#8fa5ba]">{finding.reason}</p></div>)}</div></div>}
    <div className="health-block"><p className="metric-label !text-[#9cb4d0]">Coach cue</p>{diagnostics.prompts.map((prompt) => <p key={prompt} className="health-prompt">{prompt}</p>)}</div>
    <p className="health-boundary">Planning estimates use the current prescription, exercise profile, and session stack. They are not a measured recovery, training stress, performance, or medical readiness score.</p>
  </section>;
}
