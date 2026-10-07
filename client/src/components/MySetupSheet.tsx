import { useMemo, useState } from "react";
import { Archive, Check, Copy, Pencil, Plus, RotateCcw, X } from "lucide-react";
import { UtilitySheet } from "@/components/UtilitySheet";
import { useUtilityRecord, utilityId } from "@/lib/utilityStore";
import { exercises } from "@/lib/exerciseCatalog";
import { SETUP_STORE, archiveSetup, draftChanged, draftFrom, duplicateSetup, emptySetupStore, isSetupStore, restoreSetup, saveSetup, selectSetup, selectedSetup, settingsLine, setupLimits, setupsFor, suggestedSettings, type SetupDraft, type SetupProfile, type SetupStore } from "@/lib/setupNotebook";

/**
 * My setup for one exercise: the athlete's own reminders (seat notch, cable height, handle,
 * stance), several per exercise, one chosen at a time by the athlete.
 *
 * Author-owned text, labelled as such and kept apart from the exercise record's "How this
 * variation is done". Saving never touches the catalog, the plan, past workouts or anything
 * shared by link.
 */
export function MySetupSheet({ catalogExerciseId, exerciseName, onClose }: { catalogExerciseId: number; exerciseName: string; onClose: () => void }) {
  const [store, writeStore] = useUtilityRecord<SetupStore>(SETUP_STORE, emptySetupStore, isSetupStore);
  const active = setupsFor(store, catalogExerciseId);
  const archived = setupsFor(store, catalogExerciseId, { archived: true });
  const chosen = selectedSetup(store, catalogExerciseId);
  const equipment = exercises.find((exercise) => exercise.id === catalogExerciseId)?.equipment;
  const suggestions = suggestedSettings(equipment);
  const [editing, setEditing] = useState<{ id?: string; draft: SetupDraft; base?: SetupProfile } | null>(() => (active.length ? null : { draft: draftFrom() }));
  const [message, setMessage] = useState<{ tone: "saved" | "failed" | "info"; text: string } | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState<null | (() => void)>(null);

  const dirty = editing ? draftChanged(editing.draft, editing.base) : false;
  /** Leaving a draft with typing in it asks first; nothing else does. */
  const leaveDraft = (then: () => void) => { if (dirty) setConfirmDiscard(() => then); else then(); };
  const commit = (next: SetupStore, text: string) => {
    const kept = writeStore(next);
    setMessage(kept ? { tone: "saved", text } : { tone: "failed", text: "Couldn't save on this device. Your typing is kept here; try again." });
    return kept;
  };

  const save = () => {
    if (!editing) return;
    const result = saveSetup(store, catalogExerciseId, editing.draft, { id: editing.id, newId: utilityId("setup"), now: new Date().toISOString(), select: true });
    if (!result.ok) { setMessage({ tone: "info", text: result.message }); return; }
    if (commit(result.store, `Saved “${result.setup.label}”. It's your chosen setup for ${exerciseName}.`)) setEditing(null);
  };
  const duplicate = (setup: SetupProfile) => leaveDraft(() => {
    const copy = duplicateSetup(store, setup.id, utilityId("setup"), new Date().toISOString());
    if (copy && commit(copy.store, `Copied “${setup.label}”. Rename it and change what differs.`)) setEditing({ id: copy.setup.id, draft: draftFrom(copy.setup), base: copy.setup });
  });
  const choose = (setup: SetupProfile) => commit(selectSetup(store, catalogExerciseId, setup.id), `Using “${setup.label}”.`);
  const archive = (setup: SetupProfile) => leaveDraft(() => { commit(archiveSetup(store, setup.id, new Date().toISOString()), `Archived “${setup.label}”. Restore it from Archived below.`); if (editing?.id === setup.id) setEditing(null); });
  const restore = (setup: SetupProfile) => commit(restoreSetup(store, setup.id, new Date().toISOString()), `Restored “${setup.label}”.`);
  const close = () => leaveDraft(onClose);

  return <UtilitySheet eyebrow={exerciseName} title="My setup" labelId="my-setup-title" onClose={close}>
    <div className="stp-body su-body">
      <p className="stp-note">Your own reminders for setting this exercise up: a seat notch, a cable height, a handle. They aren't checked by Sports Genome, and choosing one doesn't change your past workouts.</p>

      {!editing && <>
        {active.length === 0 ? <p className="ut-empty">No setup saved for {exerciseName} yet.</p> : <ul className="su-list" aria-label={`Setups for ${exerciseName}`}>
          {active.map((setup) => <li key={setup.id} className={setup.id === chosen?.id ? "is-chosen" : ""}>
            <div className="su-item-head">
              <p><b>{setup.label}</b>{setup.location && <small>{setup.location}</small>}</p>
              {setup.id === chosen?.id ? <span className="su-chosen"><Check className="h-4 w-4" aria-hidden="true" />Chosen</span> : <button type="button" className="stp-secondary su-choose" onClick={() => choose(setup)} aria-label={`Use ${setup.label}`}>Use this</button>}
            </div>
            {setup.settings.length > 0 && <p className="su-settings">{settingsLine(setup)}</p>}
            {setup.reminder && <p className="su-note"><span>My note</span>{setup.reminder}</p>}
            <div className="ut-row-actions">
              <button type="button" className="ut-link" onClick={() => setEditing({ id: setup.id, draft: draftFrom(setup), base: setup })}><Pencil className="mr-1 inline h-4 w-4" aria-hidden="true" />Edit</button>
              <button type="button" className="ut-link" onClick={() => duplicate(setup)}><Copy className="mr-1 inline h-4 w-4" aria-hidden="true" />Duplicate</button>
              <button type="button" className="ut-link" onClick={() => archive(setup)}><Archive className="mr-1 inline h-4 w-4" aria-hidden="true" />Archive</button>
            </div>
          </li>)}
        </ul>}
        {active.length > 1 && !chosen && <p className="stp-note">You have {active.length} setups for this exercise and none is chosen. Choose the one for where you're training.</p>}
        <div className="stp-actions"><button type="button" className="stp-primary" onClick={() => setEditing({ draft: draftFrom() })}><Plus className="mr-2 h-5 w-5" aria-hidden="true" />New setup</button></div>
      </>}

      {editing && <SetupEditor draft={editing.draft} suggestions={suggestions} isNew={!editing.id} onChange={(draft) => setEditing((current) => (current ? { ...current, draft } : current))} onSave={save} onCancel={() => leaveDraft(() => { setEditing(null); setMessage(null); })} canCancel={active.length > 0 || dirty} />}

      {confirmDiscard && <div className="stp-confirm" role="alertdialog" aria-labelledby="setup-discard-title">
        <p id="setup-discard-title"><b>Discard what you typed?</b></p>
        <p className="stp-note">Your changes to this setup haven't been saved.</p>
        <div className="stp-actions"><button type="button" className="stp-danger" onClick={() => { const then = confirmDiscard; setConfirmDiscard(null); setEditing(null); then(); }}>Discard</button><button type="button" className="stp-secondary" onClick={() => setConfirmDiscard(null)}>Keep editing</button></div>
      </div>}

      {archived.length > 0 && !editing && <details className="ut-disclosure">
        <summary>Archived <small>{archived.length}</small></summary>
        <ul className="su-list su-archived">{archived.map((setup) => <li key={setup.id}><div className="su-item-head"><p><b>{setup.label}</b>{setup.location && <small>{setup.location}</small>}</p><button type="button" className="ut-link" onClick={() => restore(setup)}><RotateCcw className="mr-1 inline h-4 w-4" aria-hidden="true" />Restore</button></div></li>)}</ul>
      </details>}

      <p className={`ut-status${message?.tone === "failed" ? " su-failed" : ""}`} role="status" aria-live="polite">{message?.text ?? ""}</p>
    </div>
  </UtilitySheet>;
}

function SetupEditor({ draft, suggestions, isNew, onChange, onSave, onCancel, canCancel }: { draft: SetupDraft; suggestions: string[]; isNew: boolean; onChange: (draft: SetupDraft) => void; onSave: () => void; onCancel: () => void; canCancel: boolean }) {
  const [showLocation, setShowLocation] = useState(Boolean(draft.location));
  const [showNote, setShowNote] = useState(Boolean(draft.reminder));
  const unused = useMemo(() => suggestions.filter((name) => !draft.settings.some((setting) => setting.name.toLowerCase() === name.toLowerCase())), [suggestions, draft.settings]);
  const setSetting = (index: number, field: "name" | "value", value: string) => onChange({ ...draft, settings: draft.settings.map((setting, at) => (at === index ? { ...setting, [field]: value } : setting)) });
  const addSetting = (name = "") => { if (draft.settings.length < setupLimits.settings) onChange({ ...draft, settings: [...draft.settings, { name, value: "" }] }); };
  return <form className="su-editor" onSubmit={(event) => { event.preventDefault(); onSave(); }}>
    <p className="stp-eyebrow">{isNew ? "New setup" : "Edit setup"}</p>
    <label className="ut-field"><span>Setup name</span><input value={draft.label} maxLength={setupLimits.label} placeholder="e.g. School gym" onChange={(event) => onChange({ ...draft, label: event.target.value })} /></label>
    {showLocation ? <label className="ut-field"><span>Where <small>optional, typed by you</small></span><input value={draft.location} maxLength={setupLimits.location} placeholder="e.g. Lincoln High weight room" onChange={(event) => onChange({ ...draft, location: event.target.value })} /></label> : <button type="button" className="ut-link su-add-optional" onClick={() => setShowLocation(true)}>+ Add where</button>}

    <fieldset className="su-settings-edit">
      <legend>Settings</legend>
      {draft.settings.map((setting, index) => <div key={index} className="su-setting-row">
        <label className="ut-field"><span className="sr-only">Setting {index + 1} name</span><input value={setting.name} maxLength={setupLimits.settingName} placeholder="Setting" aria-label={`Setting ${index + 1} name`} onChange={(event) => setSetting(index, "name", event.target.value)} /></label>
        <label className="ut-field"><span className="sr-only">Setting {index + 1} value</span><input value={setting.value} maxLength={setupLimits.settingValue} placeholder="e.g. 4" aria-label={`${setting.name || `Setting ${index + 1}`} value`} onChange={(event) => setSetting(index, "value", event.target.value)} /></label>
        <button type="button" className="plt-remove" aria-label={`Remove ${setting.name || `setting ${index + 1}`}`} onClick={() => onChange({ ...draft, settings: draft.settings.filter((_, at) => at !== index) })}><X className="h-4 w-4" aria-hidden="true" /></button>
      </div>)}
      <div className="ut-chips" role="group" aria-label="Add a setting">
        {unused.map((name) => <button key={name} type="button" onClick={() => addSetting(name)}>+ {name}</button>)}
        <button type="button" onClick={() => addSetting()}>+ Other</button>
      </div>
    </fieldset>

    {showNote ? <label className="ut-field"><span>My note <small>optional</small></span><textarea value={draft.reminder} maxLength={setupLimits.reminder} placeholder="e.g. Keep the same foot position" onChange={(event) => onChange({ ...draft, reminder: event.target.value })} /></label> : <button type="button" className="ut-link su-add-optional" onClick={() => setShowNote(true)}>+ Add a note</button>}

    <div className="stp-actions">
      <button type="submit" className="stp-primary">Save setup</button>
      {canCancel && <button type="button" className="stp-secondary" onClick={onCancel}>Cancel</button>}
    </div>
  </form>;
}
