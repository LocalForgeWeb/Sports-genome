import { useMemo, useState } from "react";
import { BarChart3, ChevronRight, Target } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import type { TrainingSplit } from "@/lib/splitAssignment";
import { analyzeSplitStack } from "@/lib/splitStackAnalysis";
import { StackAnalysisPage } from "@/components/StackAnalysisPage";
import "../rate-stack.css";

export function RateStackPanel({ workout, catalog, split, onAdd: _onAdd, onReplace: _onReplace }: { workout: Exercise[]; catalog: Exercise[]; split: TrainingSplit; onAdd: (exercise: Exercise) => void; onReplace: (outgoing: Exercise, incoming: Exercise) => void; }) {
  const [open, setOpen] = useState(false);
  const analysis = useMemo(() => analyzeSplitStack(workout, catalog, split), [catalog, split, workout]);
  return <section className="rate-stack-panel"><button onClick={() => setOpen(true)} className="rate-stack-trigger"><span><BarChart3 className="h-4 w-4" /> Analyze {split} stack</span><strong>{split} target index {analysis.score}/100</strong><ChevronRight className="h-4 w-4" /></button><details className="rate-stack-scope"><summary><Target className="h-3.5 w-3.5" /> Target-only score and planning note</summary><div><p>The index evaluates {split.toLowerCase()} targets only. Open the full body map to inspect all involved muscles.</p><p className="rate-stack-boundary">{analysis.boundary}</p></div></details>{open && <StackAnalysisPage workout={workout} split={split} dayLabel="Active Training Day" targetIndex={analysis.score} onClose={() => setOpen(false)} onInspectExercise={() => undefined} />}</section>;
}
