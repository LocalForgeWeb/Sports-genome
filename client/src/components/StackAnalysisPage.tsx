import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowUpRight, BarChart3, ChevronRight, Target, X } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import type { TrainingSplit } from "@/lib/splitAssignment";
import { analyzeWholeStackMuscles } from "@/lib/stackMuscleAnalysis";
import { AnatomyMap, muscleLabels } from "@/components/AnatomyMap";
import "../stack-analysis.css";

function MetricBar({ label, value }: { label: string; value: number }) {
  return <div className="stack-analysis-metric"><div><span>{label}</span><strong>{value}</strong></div><i><b style={{ width: `${value}%` }} /></i></div>;
}

export function resolveStackMuscleSelection(selectedMuscle: string, availableMuscles: string[]) {
  return availableMuscles.includes(selectedMuscle) ? selectedMuscle : availableMuscles[0] || "";
}

export function StackAnalysisPage({ workout, split, dayLabel, onClose, onInspectExercise }: { workout: Exercise[]; split: TrainingSplit; dayLabel: string; onClose: () => void; onInspectExercise: (exerciseId: number) => void }) {
  const analysis = useMemo(() => analyzeWholeStackMuscles(workout), [workout]);
  const [selectedMuscle, setSelectedMuscle] = useState("");
  const selected = analysis.find((item) => item.muscle === selectedMuscle) || analysis[0];

  useEffect(() => {
    const nextSelection = resolveStackMuscleSelection(selectedMuscle, analysis.map((item) => item.muscle));
    if (nextSelection !== selectedMuscle) setSelectedMuscle(nextSelection);
  }, [analysis, selectedMuscle]);

  const primary = analysis.filter((item) => item.primaryExercises > 0).map((item) => item.muscle);
  const secondary = analysis.filter((item) => item.primaryExercises === 0).map((item) => item.muscle);
  const muscleScores = useMemo(() => Object.fromEntries(analysis.map((item) => [item.muscle, item.involvement])), [analysis]);

  return <div className="stack-analysis-overlay" role="dialog" aria-modal="true" aria-label="Training Day stack analysis"><section className="stack-analysis-page"><header className="stack-analysis-head"><div><p className="metric-label !text-[#9ebfe0]">Training Day / whole-stack analysis</p><h1>{dayLabel}<span>/</span> {split} muscle map</h1><p>All muscles are calculated from every exercise in this Training Day, then ranked by cumulative catalog-based involvement. Select a muscle to inspect how each movement contributes.</p></div><button onClick={onClose} aria-label="Close stack analysis"><X className="h-5 w-5" /></button></header>{workout.length ? <main className="stack-analysis-main"><section className="stack-analysis-body"><div className="stack-analysis-summary"><div><BarChart3 className="h-4 w-4" /><span>{workout.length} exercises</span></div><div><Target className="h-4 w-4" /><span>{analysis.length} worked muscle groups</span></div></div><AnatomyMap primary={primary} secondary={secondary} muscleScores={muscleScores} showInspector={false} onSelect={setSelectedMuscle} /></section><section className="stack-analysis-rank"><div className="stack-analysis-rank-head"><div><p className="metric-label">Muscle ranking</p><h2>Whole set involvement</h2></div><Activity className="h-5 w-5" /></div><p className="stack-analysis-hint">A higher rank means more combined involvement across this complete training stack, not a direct measurement of individual muscle activation.</p><div className="stack-analysis-list">{analysis.map((item, index) => <button key={item.muscle} onClick={() => setSelectedMuscle(item.muscle)} className={item.muscle === selected?.muscle ? "stack-analysis-row stack-analysis-row-active" : "stack-analysis-row"}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{muscleLabels[item.muscle] || item.muscle}</strong><small>{item.primaryExercises ? `${item.primaryExercises} prime-mover ${item.primaryExercises === 1 ? "movement" : "movements"}` : `${item.supportingExercises} supporting ${item.supportingExercises === 1 ? "movement" : "movements"}`}</small><i><b style={{ width: `${item.involvement}%` }} /></i></div><em>{item.involvement}%</em><ChevronRight className="h-4 w-4" /></button>)}</div></section>{selected && <section className="stack-analysis-detail"><div className="stack-analysis-detail-head"><div><p className="metric-label">Selected muscle / full-stack breakdown</p><h2>{muscleLabels[selected.muscle] || selected.muscle}</h2><p>{selected.primaryExercises ? `${selected.primaryExercises} exercise${selected.primaryExercises === 1 ? "" : "s"} uses this muscle as a prime mover.` : "This muscle works in a supporting or stabilizing role across the selected stack."}</p></div><span>{selected.involvement}%</span></div><div className="stack-analysis-metrics"><MetricBar label="Mechanical loading" value={selected.mechanicalLoading} /><MetricBar label="Long-length challenge" value={selected.longLengthLoading} /><MetricBar label="Peak contraction" value={selected.peakContraction} /><MetricBar label="Stabilization demand" value={selected.stabilizationDemand} /></div><div className="stack-analysis-contributions"><p className="metric-label">Movement-by-movement contribution</p>{selected.contributions.map((contribution) => <article key={`${contribution.exerciseId}-${contribution.role}`}><button onClick={() => onInspectExercise(contribution.exerciseId)}><div><strong>{contribution.exerciseName}</strong><small>{contribution.movement} · {contribution.role}</small></div><span>{contribution.involvement}/100 <ArrowUpRight className="h-3.5 w-3.5" /></span></button><div><MetricBar label="Load" value={contribution.mechanicalLoading} /><MetricBar label="Length" value={contribution.longLengthLoading} /><MetricBar label="Peak" value={contribution.peakContraction} /><MetricBar label="Stability" value={contribution.stabilizationDemand} /></div></article>)}</div></section>}<p className="stack-analysis-boundary">This visualization combines the catalog’s primary, synergist, and stabilizer classifications. It supports training-plan comparison and does not diagnose, measure electromyography, or guarantee an individual response.</p></main> : <div className="stack-analysis-empty"><Activity className="h-8 w-8" /><h2>Build a Training Day to analyze the stack.</h2><p>Add exercises first, then reopen Stack Analysis to see full-body involvement and movement-by-movement detail.</p></div>}</section></div>;
}
