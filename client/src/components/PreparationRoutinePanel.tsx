import { useState } from "react";
import { Check, ChevronDown, ListChecks } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import type { TrainingGoal } from "@/lib/workoutPlanner";
import { getStackWarmup } from "@/lib/preTrainingMobility";
import { useUtilityRecord } from "@/lib/utilityStore";
import { openUtility } from "@/lib/utilityTools";
import { drillPhotoSet } from "@/lib/exercisePhotos";
import { ExerciseMedia } from "@/components/ExerciseMedia";
import { PREP_RUN_STORE, PREP_STORE, activeRoutines, emptyPrepRunStore, emptyPrepStore, estimatedMinutes, isPrepRunStore, isPrepStore, localDate, routineForToday, skipPreparation, stepView, todaysRun, toggleStep, type PrepRunStore, type PrepStore } from "@/lib/preparationRoutines";
import "../utility-tools.css";

/**
 * The saved routine for today's workout, inside the pre-start Preparation section: its name, how
 * many drills, a short preview, and on View routine the steps to tick off. Optional throughout:
 * skipping it, or never choosing one, never stands between the athlete and Start. Ticking a
 * step is kept apart from the workout's sets and never counts as training volume.
 */
export function PreparationRoutinePanel({ dayLabel, workout, goal }: { dayLabel: string; workout: Exercise[]; goal: TrainingGoal }) {
  const [store] = useUtilityRecord<PrepStore>(PREP_STORE, emptyPrepStore, isPrepStore);
  const [runs, writeRuns] = useUtilityRecord<PrepRunStore>(PREP_RUN_STORE, emptyPrepRunStore, isPrepRunStore);
  const [open, setOpen] = useState(false);
  // A drill's photographs open under its step, one at a time, the way the warm-up list shows
  // them: the ticks and the order stay exactly where they were.
  const [photosOpen, setPhotosOpen] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const date = localDate();
  const today = routineForToday(store, runs, dayLabel, date);
  const suggestion = () => getStackWarmup(workout, goal).drills.map((drill) => drill.id);
  const hasRoutines = activeRoutines(store).length > 0;

  if (!today) {
    return <section className="prep-panel" aria-label="Saved preparation routine">
      <p className="prep-line"><ListChecks className="h-4 w-4" aria-hidden="true" /><span>No saved routine for {dayLabel.split(" · ").pop()}. The suggestion below is built from today's exercises.</span></p>
      <div className="ut-row-actions">
        {hasRoutines && <button type="button" className="prep-button" onClick={() => openUtility({ tool: "preparation", dayLabel, mode: "choose" })}>Choose routine</button>}
        <button type="button" className="prep-button" onClick={() => openUtility({ tool: "preparation", dayLabel, mode: "create", suggestedDrillIds: suggestion() })}>Save the suggestion as a routine</button>
      </div>
    </section>;
  }

  const { routine, scope } = today;
  const run = todaysRun(runs, dayLabel, date, routine.id);
  // Once a step is ticked, today's checklist is the snapshot it was ticked on, not later edits.
  const steps = run ? run.snapshot.steps : routine.steps;
  const name = run ? run.snapshot.name : routine.name;
  const minutes = estimatedMinutes(steps);
  const doneCount = run?.done.length ?? 0;
  const save = (next: PrepRunStore) => { if (!writeRuns(next)) setStatus("Couldn't save your progress on this device. You can still train."); else setStatus(""); };

  return <section className="prep-panel" aria-label="Saved preparation routine">
    <div className="prep-head">
      <p className="prep-title"><b>{name}</b><small>{scope === "today" ? "Chosen for today only" : `Assigned to ${dayLabel.split(" · ").slice(-2).join(" · ")}`}</small></p>
      <p className="prep-meta">{steps.length} drill{steps.length === 1 ? "" : "s"}{minutes ? ` · about ${minutes} min, estimated` : ""}{run?.skipped ? " · skipped today" : doneCount ? ` · ${doneCount} of ${steps.length} done` : ""}</p>
    </div>
    <p className="prep-preview">{steps.slice(0, 3).map((step) => stepView(step).name).join(" · ")}{steps.length > 3 ? ` · +${steps.length - 3} more` : ""}</p>
    <div className="ut-row-actions">
      <button type="button" className="prep-button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>{open ? "Hide routine" : "View routine"}<ChevronDown className={`ml-1 h-4 w-4 ${open ? "rotate-180" : ""}`} aria-hidden="true" /></button>
      <button type="button" className="prep-button" onClick={() => openUtility({ tool: "preparation", dayLabel, mode: "choose" })}>Choose routine</button>
      <button type="button" className="prep-button" onClick={() => openUtility({ tool: "preparation", dayLabel, mode: "create", suggestedDrillIds: suggestion() })}>Save routine</button>
    </div>
    {open && <ol className="prep-steps">{steps.map((step, index) => {
      const view = stepView(step);
      const done = Boolean(run?.done.includes(index));
      const photo = view.available ? drillPhotoSet(step.drillId) : null;
      return <li key={`${step.drillId}-${index}`} className={done ? "is-done" : ""}>
        <div className="prep-step-row">
          <label className="ut-check prep-step">
            <input type="checkbox" checked={done} onChange={() => save(toggleStep(runs, dayLabel, date, routine, scope, index, new Date().toISOString()))} />
            <span><b>{view.name}</b><small>{view.dose ? `${view.dose}${view.doseIsLibraryDefault ? " (library dose)" : ""}` : "No dose given"}</small></span>
          </label>
          {photo && <button type="button" className="prep-thumb" aria-expanded={photosOpen === index} aria-label={`${photosOpen === index ? "Hide" : "Show"} photos of ${view.name}`} onClick={() => setPhotosOpen((current) => (current === index ? null : index))}><ExerciseMedia exerciseId={-1} photo={photo} subject="drill" exerciseName={view.name} equipment="Bodyweight" variant="thumb" /></button>}
        </div>
        {photo && photosOpen === index && <div className="prep-photos"><ExerciseMedia exerciseId={-1} photo={photo} subject="drill" exerciseName={view.name} equipment="Bodyweight" variant="detail" /></div>}
        {!view.available && <p className="prep-missing">This drill is no longer in the library; shown as you saved it.</p>}
        {view.cue && <p className="prep-cue">{view.cue}</p>}
        {view.note && <p className="prep-cue"><span className="su-note-label">My note:</span> {view.note}</p>}
      </li>;
    })}</ol>}
    {open && <div className="ut-row-actions">
      {run?.skipped
        ? <button type="button" className="ut-link" onClick={() => save(skipPreparation(runs, dayLabel, date, routine, scope, false, new Date().toISOString()))}>Do preparation after all</button>
        : <button type="button" className="ut-link" onClick={() => { save(skipPreparation(runs, dayLabel, date, routine, scope, true, new Date().toISOString())); setOpen(false); }}>Skip preparation today</button>}
      {doneCount === steps.length && steps.length > 0 && <span className="prep-done"><Check className="h-4 w-4" aria-hidden="true" />All done</span>}
    </div>}
    <p className="ut-status" role="status" aria-live="polite">{status}</p>
  </section>;
}
