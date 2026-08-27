import { ArrowUpRight, ClipboardCheck, Dumbbell, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function TodayActionPanel({ stagedExerciseCount, trainingDays, activeDayLabel, onOpenTraining, onOpenStrength }: { stagedExerciseCount: number; trainingDays: number; activeDayLabel: string; onOpenTraining: () => void; onOpenStrength: () => void }) {
  const overview = trpc.strengthGenome.overview.useQuery();
  const sessions = trpc.workoutLog.list.useQuery();
  const completedCount = sessions.data?.filter(session => session.status === "completed").length || 0;
  const hasStagedWorkout = stagedExerciseCount > 0;
  const weekdayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  return <section className="today-action-panel">
    <div className="today-action-primary"><div><p className="metric-label !text-[#adc4dc]">Today / next action</p><h2>{hasStagedWorkout ? "Your training day is staged." : "Choose the next useful move."}</h2><p>{hasStagedWorkout ? `${stagedExerciseCount} exercises are staged for ${activeDayLabel}. Review the prescription, then start when you are ready.` : "No workout is staged yet. Design one from your available equipment and current sport context."}</p></div><button type="button" onClick={onOpenTraining} className="today-action-cta">{hasStagedWorkout ? "Open training day" : "Design training day"} <ArrowUpRight className="h-4 w-4" /></button></div>
    <div className="today-action-rhythm" aria-label={`${trainingDays} athlete-selected training days in this weekly plan`}><span>Weekly plan rhythm</span><div>{weekdayLabels.map((label, index) => <i key={`${label}-${index}`} className={index < trainingDays ? "today-rhythm-planned" : ""} aria-hidden="true">{label}</i>)}</div><small>{trainingDays} athlete-selected days · not a completion or readiness score</small></div>
    <div className="today-action-facts"><div><Dumbbell className="h-4 w-4" /><p><strong>{trainingDays} planned days</strong><span>athlete-selected weekly rhythm</span></p></div><div><ClipboardCheck className="h-4 w-4" /><p><strong>{completedCount} completed sessions</strong><span>saved training history</span></p></div><button type="button" onClick={onOpenStrength}><Sparkles className="h-4 w-4" /><p><strong>{overview.data?.observationCount || 0} strength observations</strong><span>{overview.data?.observationCount ? "continue your private record" : "add a baseline observation"}</span></p><ArrowUpRight className="h-4 w-4" /></button></div>
  </section>;
}
