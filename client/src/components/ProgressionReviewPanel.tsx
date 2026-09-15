import { useMemo } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, Check, Equal, Info, RotateCcw, TrendingUp } from "lucide-react";
import { exercises as catalogExercises, type Exercise } from "@/lib/exerciseCatalog";
import type { ExerciseSettings } from "@/lib/workoutPlanner";
import { getExerciseProgressionRecommendation, getMuscleSegmentSignals, getWeeklyProgressReview, type ExerciseProgressionRecommendation, type LoggedPerformanceSet, type MuscleSegmentSignal, type ProgressionExercise } from "@/lib/progressiveTraining";
import { getSegmentPrioritySuggestions, type SegmentPrioritySuggestion } from "@/lib/segmentPrioritySuggestions";
import { trpc } from "@/lib/trpc";

const signalStatusCopy: Record<MuscleSegmentSignal["status"], string> = {
  progressing: "Progressing",
  steady: "Steady",
  review: "Needs review",
  insufficient_data: "Not enough data yet",
};

function actionPresentation(action: ExerciseProgressionRecommendation["action"]) {
  if (action === "increase_load") return { label: "Consider load increase", Icon: ArrowUpRight, tone: "text-[#297045]" };
  if (action === "add_repetitions") return { label: "Add repetitions", Icon: TrendingUp, tone: "text-[var(--sg-info-strong)]" };
  if (action === "reduce_load") return { label: "Review load", Icon: ArrowDownRight, tone: "text-[#b55b39]" };
  if (action === "repeat") return { label: "Repeat current load", Icon: RotateCcw, tone: "text-[#547292]" };
  if (action === "hold") return { label: "Hold and recover", Icon: Equal, tone: "text-[#9a6d1e]" };
  return { label: "Log more comparable work", Icon: Activity, tone: "text-[var(--sg-text-subtle-on-light)]" };
}

export function buildProgressionExercises(workout: Exercise[], prescriptions: Record<number, string>, bodyWeight?: number, weightUnit: "lb" | "kg" = "lb"): ProgressionExercise[] {
  const bodyWeightKg = bodyWeight && bodyWeight > 0 ? (weightUnit === "kg" ? bodyWeight : bodyWeight * 0.45359237) : undefined;
  return workout.map((exercise) => ({ id: exercise.id, name: exercise.name, targetPrescription: prescriptions[exercise.id] || "3 × 8–12", primaryMuscles: exercise.primaryMuscles, bodyWeightKg }));
}

export function ProgressionReviewSummary({ exercises, history, catalog = [], availableEquipment = [], onApprove, onApproveSegment, onAddSuggestion }: { exercises: ProgressionExercise[]; history: LoggedPerformanceSet[]; catalog?: Exercise[]; availableEquipment?: string[]; onApprove?: (recommendation: ExerciseProgressionRecommendation) => void; onApproveSegment?: (signal: MuscleSegmentSignal) => void; onAddSuggestion?: (suggestion: SegmentPrioritySuggestion) => void }) {
  const recommendations = exercises.map((exercise) => getExerciseProgressionRecommendation(exercise, history));
  const segments = getMuscleSegmentSignals(exercises, history).filter((signal) => signal.status !== "insufficient_data").slice(0, 6);
  const weekly = getWeeklyProgressReview(exercises, history);

  return <section className="progression-review-panel" aria-label="Progression review">
    <div className="progression-review-head"><div><p className="metric-label">Progression review</p><h3>Use the log to decide the next exposure.</h3><p>Recommendations compare completed work within the same exercise and setup. You approve every change.</p></div><Activity className="h-5 w-5 text-[var(--sg-info-strong)]" /></div>
    <section className="progression-weekly-review" aria-label="Weekly progression review"><p className="metric-label">Week-over-week context</p>{weekly.latest && <p className="mt-1 text-xs font-bold text-[#173d69]">Week of {weekly.latest.weekStart}: {weekly.latest.completedSets} comparable sets{weekly.performanceChange !== undefined ? ` · ${(weekly.performanceChange * 100).toFixed(0)}% estimated exercise-context change` : ""}</p>}<p>{weekly.prompts[0]}</p></section>
    <div className="progression-recommendations">{recommendations.map((recommendation) => {
      const presentation = actionPresentation(recommendation.action);
      const Icon = presentation.Icon;
      const canApprove = recommendation.action !== "insufficient_data";
      return <article key={recommendation.exerciseId} className="progression-recommendation"><div><p className="metric-label">{recommendation.exerciseName}</p><p className={`mt-1 flex items-center gap-1 text-xs font-bold ${presentation.tone}`}><Icon className="h-3.5 w-3.5" />{presentation.label} <span className="font-normal text-[var(--sg-text-subtle-on-light)]">· {recommendation.confidence} confidence</span></p></div><p>{recommendation.rationale}</p>{recommendation.relativePerformance !== undefined && <small className="mt-2 block text-[var(--sg-text-subtle-on-light)]">Relative to your bodyweight: {recommendation.relativePerformance.toFixed(2)}. Only meaningful next to your own past logs for this exercise.</small>}{canApprove && onApprove && <button type="button" className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[.1em] text-[var(--sg-info-strong)]" onClick={() => onApprove(recommendation)}><Check className="h-3.5 w-3.5" /> Apply as next-session note</button>}</article>;
    })}</div>
    {segments.length > 0 && <div className="progression-segments"><div><p className="metric-label">How each muscle group is trending</p><p>Read from your own logs for these exercises. It is not a ranking against other people.</p></div>{segments.map((signal) => {
      const suggestions = getSegmentPrioritySuggestions(signal, exercises.map((exercise) => exercise.id), catalog, availableEquipment);
      return <article key={signal.muscle}><span className={`progression-status progression-status-${signal.status}`}>{signalStatusCopy[signal.status]}</span><strong>{signal.muscle.replace(/_/g, " ")}</strong>{signal.progressIndex !== undefined && <p className="mt-1 text-[11px] font-bold uppercase tracking-[.08em] text-[#47617a]">Your trend score: {signal.progressIndex}/100</p>}<p>{signal.rationale}</p>{signal.status === "review" && onApproveSegment && <button type="button" className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[.1em] text-[var(--sg-info-strong)]" onClick={() => onApproveSegment(signal)}><Check className="h-3.5 w-3.5" /> Mark for next plan review</button>}{signal.status === "review" && suggestions.length > 0 && <div className="mt-3 border-t border-[var(--sg-divider-on-light)] pt-3"><p className="text-[11px] font-bold uppercase tracking-[.09em] text-[var(--sg-text-subtle-on-light)]">Optional next-plan additions</p>{suggestions.map((suggestion) => <button key={suggestion.exerciseId} type="button" className="mt-2 flex w-full items-center justify-between gap-2 text-left text-xs font-bold text-[var(--sg-info-strong)]" onClick={() => onAddSuggestion?.(suggestion)}><span>Add {suggestion.exerciseName}</span><span className="font-normal text-[var(--sg-text-subtle-on-light)]">{suggestion.equipment}</span></button>)}<small className="mt-2 block text-[var(--sg-text-subtle-on-light)]">{suggestions[0].boundary}</small></div>}<small className="mt-2 block text-[var(--sg-text-subtle-on-light)]">{signal.boundary}</small></article>;
    })}</div>}
    <div className="progression-boundary"><Info className="h-3.5 w-3.5" />{weekly.boundary} Any bodyweight figure here is scaled to you and this exercise only — never a ranking against other people.</div>
  </section>;
}

export function ProgressionReviewPanel({ workout, prescriptions, settings, bodyWeight, weightUnit, onApprove, onApproveSegment, onAddSuggestion }: { workout: Exercise[]; prescriptions: Record<number, string>; settings: Record<number, ExerciseSettings>; bodyWeight?: number; weightUnit?: "lb" | "kg"; onApprove?: (recommendation: ExerciseProgressionRecommendation) => void; onApproveSegment?: (signal: MuscleSegmentSignal) => void; onAddSuggestion?: (suggestion: SegmentPrioritySuggestion) => void }) {
  const historyQuery = trpc.workoutLog.progressionHistory.useQuery(undefined, { refetchOnWindowFocus: false });
  const storedBodyContext = useMemo(() => {
    if (bodyWeight && bodyWeight > 0) return { bodyWeight, weightUnit };
    if (typeof window === "undefined") return undefined;
    try {
      const stored = JSON.parse(window.localStorage.getItem("gym-optimizer-athlete-profile-v1") || "null");
      const storedWeight = Number(stored?.baseline?.bodyWeight);
      return Number.isFinite(storedWeight) && storedWeight > 0 ? { bodyWeight: storedWeight, weightUnit: stored?.baseline?.weightUnit === "kg" ? "kg" as const : "lb" as const } : undefined;
    } catch { return undefined; }
  }, [bodyWeight, weightUnit]);
  const availableEquipment = useMemo(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = JSON.parse(window.localStorage.getItem("gym-optimizer-athlete-profile-v1") || "null");
      return Array.isArray(stored?.baseline?.equipment?.availableEquipment) ? stored.baseline.equipment.availableEquipment as string[] : [];
    } catch { return []; }
  }, []);
  const exercises = buildProgressionExercises(workout, prescriptions, storedBodyContext?.bodyWeight, storedBodyContext?.weightUnit);
  const history = (historyQuery.data || []) as LoggedPerformanceSet[];
  if (!workout.length) return null;
  if (historyQuery.isLoading) return <section className="progression-review-panel"><p className="metric-label">Progression review</p><p className="mt-2 text-xs text-[var(--sg-text-subtle-on-light)]">Loading comparable completed set history…</p></section>;
  return <ProgressionReviewSummary exercises={exercises} history={history} catalog={catalogExercises} availableEquipment={availableEquipment} onApprove={onApprove} onApproveSegment={onApproveSegment} onAddSuggestion={onAddSuggestion} />;
}
