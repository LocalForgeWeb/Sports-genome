import { useMemo, useState } from "react";
import { Archive, ArrowDown, ArrowUp, Check, Copy, Pencil, Plus, RotateCcw, X } from "lucide-react";
import { UtilitySheet } from "@/components/UtilitySheet";
import { useUtilityRecord, utilityId } from "@/lib/utilityStore";
import { preTrainingMobilityLibrary } from "@/lib/preTrainingMobility";
import { PREP_RUN_STORE, PREP_STORE, activeRoutines, archivedRoutines, assignRoutine, chooseForToday, duplicateRoutine, editRoutine, emptyPrepRunStore, emptyPrepStore, estimatedMinutes, isPrepRunStore, isPrepStore, localDate, prepLimits, routineForToday, routineFromDrills, setRoutineArchived, stepView, upsertRoutine, type PrepRunStore, type PrepStep, type PrepStore } from "@/lib/preparationRoutines";

const phaseLabel = { raise: "Raise", mobilize: "Mobilize", activate: "Activate", rehearse: "Rehearse" } as const;

/**
 * Preparation routines: choose one for today's workout or for the planned day, save one (from
 * the suggestion or from scratch), and keep the list tidy. Assigning never changes the day's
 * exercises; "Today only" never changes the assignment.
 */
export function PreparationRoutinesSheet({ dayLabel, mode: initialMode, suggestedDrillIds = [], onClose }: { dayLabel: string; mode: "choose" | "create" | "manage"; suggestedDrillIds?: string[]; onClose: () => void }) {
  const [store, writeStore] = useUtilityRecord<PrepStore>(PREP_STORE, emptyPrepStore, isPrepStore);
  const [runs, writeRuns] = useUtilityRecord<PrepRunStore>(PREP_RUN_STORE, emptyPrepRunStore, isPrepRunStore);
  const [mode, setMode] = useState<{ kind: "choose" } | { kind: "create" } | { kind: "edit"; id: string }>(initialMode === "create" ? { kind: "create" } : { kind: "choose" });
  const [message, setMessage] = useState<{ tone: "ok" | "failed" | "info"; text: string } | null>(null);
  const date = localDate();
  const current = routineForToday(store, runs, dayLabel, date);
  const assignedId = store.assignments[dayLabel];
  const dayName = dayLabel.split(" · ").slice(-2).join(" · ");
  const routines = activeRoutines(store);
  const archived = archivedRoutines(store);
  const keep = (kept: boolean, text: string) => { setMessage(kept ? { tone: "ok", text } : { tone: "failed", text: "Couldn't save on this device. Try again." }); return kept; };

  return <UtilitySheet eyebrow={dayLabel} title="Preparation routines" labelId="prep-routines-title" onClose={onClose} wide>
    <div className="stp-body prep-sheet">
      {mode.kind === "choose" && <>
        <p className="stp-note">A routine is your own ordered list of drills from the preparation library. It's optional, and it never counts as training volume.</p>
        {routines.length === 0 ? <p className="ut-empty">No saved routines yet. Save one from the suggestion, or build your own.</p> : <ul className="blk-list">{routines.map((routine) => {
          const minutes = estimatedMinutes(routine.steps);
          const isToday = current?.routine.id === routine.id;
          return <li key={routine.id} className={isToday ? "is-chosen" : ""}>
            <p className="blk-name"><b>{routine.name}</b><small>{routine.steps.length} drill{routine.steps.length === 1 ? "" : "s"}{minutes ? ` · about ${minutes} min, estimated` : ""}{assignedId === routine.id ? ` · assigned to ${dayName}` : ""}</small></p>
            <p className="blk-preview">{routine.steps.map((step) => stepView(step).name).join(" · ")}</p>
            <div className="ut-row-actions">
              <button type="button" className="stp-secondary prep-choice" onClick={() => keep(writeRuns(chooseForToday(runs, dayLabel, date, routine.id)), `“${routine.name}” is today's preparation. ${dayName}'s saved routine is unchanged.`)}>{isToday && current?.scope === "today" ? <Check className="mr-1 h-4 w-4" aria-hidden="true" /> : null}Use for today only</button>
              <button type="button" className="stp-secondary prep-choice" onClick={() => keep(writeStore(assignRoutine(store, dayLabel, routine.id)), `“${routine.name}” is assigned to ${dayName}. Its exercises are unchanged.`)}>{assignedId === routine.id ? <Check className="mr-1 h-4 w-4" aria-hidden="true" /> : null}Assign to {dayName}</button>
            </div>
            <div className="ut-row-actions">
              <button type="button" className="ut-link" onClick={() => { setMode({ kind: "edit", id: routine.id }); setMessage(null); }}><Pencil className="mr-1 inline h-4 w-4" aria-hidden="true" />Edit</button>
              <button type="button" className="ut-link" onClick={() => keep(writeStore(duplicateRoutine(store, routine.id, utilityId("prep"), new Date().toISOString())), `Copied “${routine.name}”.`)}><Copy className="mr-1 inline h-4 w-4" aria-hidden="true" />Duplicate</button>
              <button type="button" className="ut-link" onClick={() => keep(writeStore(setRoutineArchived(store, routine.id, true, new Date().toISOString())), `Archived “${routine.name}”${assignedId === routine.id ? `; ${dayName} no longer has a routine assigned` : ""}.`)}><Archive className="mr-1 inline h-4 w-4" aria-hidden="true" />Archive</button>
            </div>
          </li>;
        })}</ul>}
        <div className="ut-row-actions">
          {runs.today[`${date}|${dayLabel}`] && <button type="button" className="ut-link" onClick={() => keep(writeRuns(chooseForToday(runs, dayLabel, date, null)), `Today uses ${dayName}'s assigned routine again${assignedId ? "" : " (none)"}.`)}>Clear today's choice</button>}
          {assignedId && <button type="button" className="ut-link" onClick={() => keep(writeStore(assignRoutine(store, dayLabel, null)), `${dayName} has no routine assigned now.`)}>Unassign from {dayName}</button>}
        </div>
        <div className="stp-actions"><button type="button" className="stp-primary" onClick={() => { setMode({ kind: "create" }); setMessage(null); }}><Plus className="mr-2 h-5 w-5" aria-hidden="true" />New routine</button></div>
        {archived.length > 0 && <details className="ut-disclosure"><summary>Archived <small>{archived.length}</small></summary><ul className="blk-list">{archived.map((routine) => <li key={routine.id}><p className="blk-name"><b>{routine.name}</b></p><button type="button" className="ut-link" onClick={() => keep(writeStore(setRoutineArchived(store, routine.id, false, new Date().toISOString())), `Restored “${routine.name}”.`)}><RotateCcw className="mr-1 inline h-4 w-4" aria-hidden="true" />Restore</button></li>)}</ul></details>}
      </>}

      {mode.kind === "create" && <RoutineEditor title="New routine" initialName="" initialSteps={suggestedDrillIds.map((id) => ({ drillId: id, name: preTrainingMobilityLibrary.find((drill) => drill.id === id)?.name ?? id }))} fromSuggestion={suggestedDrillIds.length > 0} onCancel={() => setMode({ kind: "choose" })} onSave={(name, steps) => {
        const made = routineFromDrills(name, steps.map((step) => step.drillId), { id: utilityId("prep"), now: new Date().toISOString() });
        if (!made.ok) { setMessage({ tone: "info", text: made.message }); return; }
        const withDoses = editRoutine(upsertRoutine(store, made.routine), made.routine.id, { name, steps }, made.routine.createdAt);
        if (!withDoses.ok) { setMessage({ tone: "info", text: withDoses.message }); return; }
        if (keep(writeStore(withDoses.store), `Saved “${made.routine.name}”. Use it today or assign it to ${dayName}.`)) setMode({ kind: "choose" });
      }} />}

      {mode.kind === "edit" && (() => {
        const routine = store.routines.find((item) => item.id === mode.id);
        if (!routine) return null;
        return <RoutineEditor title="Edit routine" initialName={routine.name} initialSteps={routine.steps} onCancel={() => setMode({ kind: "choose" })} onSave={(name, steps) => {
          const edited = editRoutine(store, routine.id, { name, steps }, new Date().toISOString());
          if (!edited.ok) { setMessage({ tone: "info", text: edited.message }); return; }
          if (keep(writeStore(edited.store), `Saved “${name.trim()}”. Workouts already done keep what they showed.`)) setMode({ kind: "choose" });
        }} />;
      })()}

      <p className={message?.tone === "failed" ? "stp-warn" : "ut-status"} role="status" aria-live="polite">{message?.text ?? ""}</p>
    </div>
  </UtilitySheet>;
}

function RoutineEditor({ title, initialName, initialSteps, fromSuggestion = false, onSave, onCancel }: { title: string; initialName: string; initialSteps: PrepStep[]; fromSuggestion?: boolean; onSave: (name: string, steps: PrepStep[]) => void; onCancel: () => void }) {
  const [name, setName] = useState(initialName);
  const [steps, setSteps] = useState<PrepStep[]>(() => initialSteps.map((step) => ({ ...step })));
  const [adding, setAdding] = useState("");
  const options = useMemo(() => preTrainingMobilityLibrary.filter((drill) => !steps.some((step) => step.drillId === drill.id)), [steps]);
  const move = (index: number, by: -1 | 1) => setSteps((current) => { const next = [...current]; const [item] = next.splice(index, 1); next.splice(index + by, 0, item); return next; });
  const minutes = estimatedMinutes(steps);
  return <form className="blk-form" onSubmit={(event) => { event.preventDefault(); onSave(name, steps); }}>
    <p className="stp-eyebrow">{title}</p>
    {fromSuggestion && <p className="stp-note">Starts from today's suggestion. Reorder, remove or add drills from the library; a dose you type replaces the library's for this routine only.</p>}
    <label className="ut-field"><span>Routine name</span><input value={name} maxLength={prepLimits.name} placeholder="e.g. Lower-body prep" onChange={(event) => setName(event.target.value)} /></label>
    <ol className="blk-entries">{steps.map((step, index) => {
      const view = stepView(step);
      return <li key={`${step.drillId}-${index}`} className="blk-entry prep-edit-row">
        <p><b>{view.name}</b><small>{view.phase ? phaseLabel[view.phase] : "Not in the library any more"}</small></p>
        <label className="ut-field"><span className="sr-only">{view.name} dose</span><input value={step.dose ?? ""} maxLength={prepLimits.dose} placeholder={view.available ? `Library: ${stepView({ drillId: step.drillId, name: step.name }).dose}` : "Dose"} aria-label={`${view.name} dose`} onChange={(event) => setSteps((current) => current.map((item, at) => (at === index ? { ...item, dose: event.target.value } : item)))} /></label>
        <span className="blk-edit-actions">
          <button type="button" className="plt-remove" aria-label={`Move ${view.name} up`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp className="h-4 w-4" aria-hidden="true" /></button>
          <button type="button" className="plt-remove" aria-label={`Move ${view.name} down`} disabled={index === steps.length - 1} onClick={() => move(index, 1)}><ArrowDown className="h-4 w-4" aria-hidden="true" /></button>
          <button type="button" className="plt-remove" aria-label={`Remove ${view.name}`} onClick={() => setSteps((current) => current.filter((_, at) => at !== index))}><X className="h-4 w-4" aria-hidden="true" /></button>
        </span>
      </li>;
    })}</ol>
    <div className="plt-add">
      <label className="ut-field"><span>Add a drill</span><select value={adding} onChange={(event) => setAdding(event.target.value)}><option value="">Choose from the library…</option>{(["raise", "mobilize", "activate", "rehearse"] as const).map((phase) => <optgroup key={phase} label={phaseLabel[phase]}>{options.filter((drill) => drill.phase === phase).map((drill) => <option key={drill.id} value={drill.id}>{drill.name} · {drill.dose}</option>)}</optgroup>)}</select></label>
      <button type="button" className="stp-secondary" disabled={!adding || steps.length >= prepLimits.steps} onClick={() => { const drill = preTrainingMobilityLibrary.find((item) => item.id === adding); if (drill) setSteps((current) => [...current, { drillId: drill.id, name: drill.name }]); setAdding(""); }}>Add</button>
    </div>
    <p className="stp-note">{steps.length} drill{steps.length === 1 ? "" : "s"}{minutes ? ` · about ${minutes} min, estimated from the doses` : steps.length ? " · no time estimate: some doses are counted in reps or distance" : ""}</p>
    <div className="stp-actions"><button type="submit" className="stp-primary" disabled={!steps.length}>Save routine</button><button type="button" className="stp-secondary" onClick={onCancel}>Cancel</button></div>
  </form>;
}
