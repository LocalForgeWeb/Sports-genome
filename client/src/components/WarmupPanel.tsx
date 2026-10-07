/** Kinetic Field Manual: exercise-aware mobility preparation shown before editable programming details. */
import { useState } from "react";
import { ChevronDown, Gauge, MoveRight, ShieldCheck } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import { getStackWarmup, mobilityTagLabel, preTrainingMobilityLibrary, type MobilityDrill } from "@/lib/preTrainingMobility";
import type { TrainingGoal } from "@/lib/workoutPlanner";
import { drillPhotoSet } from "@/lib/exercisePhotos";
import { ExerciseMedia } from "@/components/ExerciseMedia";

const phaseLabel = { raise: "Raise", mobilize: "Mobilize", activate: "Activate", rehearse: "Rehearse" } as const;

/** What a drill is done with, for the placeholder's icon when it has no photograph. */
const drillEquipment = (drill: MobilityDrill) => /band/i.test(drill.name) ? "Band" : /medicine/i.test(drill.name) ? "Medicine ball" : /bar|landmine|goblet|farmer/i.test(drill.name) ? "Free weights" : "Bodyweight";

/**
 * A drill's photograph beside its name. Where the source photographs the drill, the
 * thumbnail opens its start and finish frames under the cue - a stretch is mostly a
 * position, and the position is what a name cannot carry. Without one, the same frame
 * holds an icon, so the rows line up and no drill borrows another's photo.
 */
function DrillThumb({ drill, open, onToggle }: { drill: MobilityDrill; open?: boolean; onToggle?: () => void }) {
  const photo = drillPhotoSet(drill.id);
  const media = <ExerciseMedia exerciseId={-1} photo={photo} subject="drill" exerciseName={drill.name} equipment={drillEquipment(drill)} variant="thumb" />;
  if (!photo || !onToggle) return <span className="warmup-drill-thumb">{media}</span>;
  return <button type="button" className="warmup-drill-thumb" aria-expanded={Boolean(open)} aria-label={`${open ? "Hide" : "Show"} photos of ${drill.name}`} onClick={onToggle}>{media}</button>;
}

export function WarmupPanel({ workout, goal }: { workout: Exercise[]; goal: TrainingGoal }) {
  const warmup = getStackWarmup(workout, goal);
  // One drill's photos open at a time, so the list stays a list.
  const [photosOpen, setPhotosOpen] = useState<string | null>(null);
  return <section id="session-prep" className="warmup-panel" aria-label="Pre-training mobility recommendation"><div className="warmup-head"><div><p className="metric-label !text-[#93bde8]">Pre-training prep</p><h3>Move with intent</h3><p>{warmup.rationale}</p></div><div className="warmup-time"><Gauge className="h-4 w-4" /><strong>~{warmup.estimatedMinutes} min</strong><small>{warmup.drills.length} drills</small></div></div><div className="warmup-focus"><span>Stack signals</span><div>{warmup.focusTags.length ? warmup.focusTags.slice(0, 5).map((tag) => <b key={tag}>{mobilityTagLabel(tag)}</b>) : <b>general prep</b>}</div></div>{/* The drills, their phases, their cues and their doses ran to six cards and
    around a thousand pixels, opened on a page whose question is "is this day any
    good?" - a script for a warm-up you are not doing yet. The summary names every
    drill in order, which is the answer to "what would I warm up"; the cues and
    doses are one tap away, where you actually need them. */}
<details className="warmup-drills-detail"><summary><span><strong>The {warmup.drills.length} drills, in order</strong><small>{warmup.drills.map((drill) => drill.name).join(" · ")}</small></span><ChevronDown className="h-4 w-4" /></summary><div className="warmup-drills">{warmup.drills.map((drill, index) => <article key={drill.id} className="warmup-drill"><span className={`warmup-phase warmup-phase-${drill.phase}`}>{String(index + 1).padStart(2, "0")}</span><DrillThumb drill={drill} open={photosOpen === drill.id} onToggle={() => setPhotosOpen((current) => (current === drill.id ? null : drill.id))} /><div><div className="flex flex-wrap items-center gap-2"><strong>{drill.name}</strong><small>{phaseLabel[drill.phase]}</small></div><p>{drill.cue}</p></div><span className="warmup-dose">{drill.dose}</span>{photosOpen === drill.id && <div className="warmup-drill-photos"><ExerciseMedia exerciseId={-1} photo={drillPhotoSet(drill.id)} subject="drill" exerciseName={drill.name} equipment={drillEquipment(drill)} variant="detail" /></div>}</article>)}</div></details><div className="warmup-footer"><ShieldCheck className="h-4 w-4" /><p>Build heat before intensity. Training prep, not a medical screening.</p></div><details className="warmup-library"><summary>Browse the full {preTrainingMobilityLibrary.length}-drill preparation library <ChevronDown className="h-4 w-4" /></summary><div>{preTrainingMobilityLibrary.map((drill) => <article key={drill.id}><DrillThumb drill={drill} /><div><span>{phaseLabel[drill.phase]}</span><strong>{drill.name}</strong><small>{drill.dose} <MoveRight className="h-3 w-3" /> {drill.regions.join(", ")}</small></div></article>)}</div></details></section>;
}
