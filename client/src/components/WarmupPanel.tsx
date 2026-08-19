/** Kinetic Field Manual: exercise-aware mobility preparation shown before editable programming details. */
import { ChevronDown, Gauge, MoveRight, ShieldCheck } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import { getStackWarmup, preTrainingMobilityLibrary } from "@/lib/preTrainingMobility";
import type { TrainingGoal } from "@/lib/workoutPlanner";

const phaseLabel = { raise: "Raise", mobilize: "Mobilize", activate: "Activate", rehearse: "Rehearse" } as const;

export function WarmupPanel({ workout, goal }: { workout: Exercise[]; goal: TrainingGoal }) {
  const warmup = getStackWarmup(workout, goal);
  return <section className="warmup-panel" aria-label="Pre-training mobility recommendation"><div className="warmup-head"><div><p className="metric-label !text-[#93bde8]">Pre-training prep</p><h3>Move with intent</h3><p>{warmup.rationale}</p></div><div className="warmup-time"><Gauge className="h-4 w-4" /><strong>~{warmup.estimatedMinutes} min</strong><small>{warmup.drills.length} drills</small></div></div><div className="warmup-focus"><span>Stack signals</span><div>{warmup.focusTags.length ? warmup.focusTags.slice(0, 5).map((tag) => <b key={tag}>{tag.replace(/([A-Z])/g, " $1")}</b>) : <b>general prep</b>}</div></div><div className="warmup-drills">{warmup.drills.map((drill, index) => <article key={drill.id} className="warmup-drill"><span className={`warmup-phase warmup-phase-${drill.phase}`}>{String(index + 1).padStart(2, "0")}</span><div><div className="flex flex-wrap items-center gap-2"><strong>{drill.name}</strong><small>{phaseLabel[drill.phase]}</small></div><p>{drill.cue}</p></div><span className="warmup-dose">{drill.dose}</span></article>)}</div><div className="warmup-footer"><ShieldCheck className="h-4 w-4" /><p>Use a comfortable range, build heat before intensity, and rehearse the first loaded pattern with light sets. This is training preparation, not a medical screening.</p></div><details className="warmup-library"><summary>Browse the full {preTrainingMobilityLibrary.length}-drill preparation library <ChevronDown className="h-4 w-4" /></summary><div>{preTrainingMobilityLibrary.map((drill) => <article key={drill.id}><span>{phaseLabel[drill.phase]}</span><strong>{drill.name}</strong><small>{drill.dose} <MoveRight className="h-3 w-3" /> {drill.regions.join(", ")}</small></article>)}</div></details></section>;
}
