import { useMemo, useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, Archive, Check, Copy, Pencil, Plus, RotateCcw, Undo2, X } from "lucide-react";
import { UtilitySheet } from "@/components/UtilitySheet";
import { useUtilityRecord, utilityId } from "@/lib/utilityStore";
import type { DayRecord } from "@/lib/trainingDayPlan";
import { BLOCK_STORE, activeBlocks, archivedBlocks, blockFromDay, blockLimits, blockPreviewLine, duplicateBlock, editBlockEntries, emptyBlockStore, isBlockStore, previewBlockInsert, renameBlock, setBlockArchived, upsertBlock, type BlockAnchor, type BlockEntry, type BlockResolution, type BlockStore, type PlanBlock } from "@/lib/planBlocks";

export type BlockInsertOutcome = { ok: true; added: number; alreadyThere: string[]; omitted: string[]; anchorGone: boolean; undo: () => void } | { ok: false; message: string };

/**
 * Blocks for the open day: save some of its planned exercises as a named block, and insert a
 * saved block into it. Blocks are private to this account on this device and are never shared.
 * Inserting previews everything first, adds after what is there unless another place is chosen,
 * and can be undone as one step.
 */
export function PlanBlocksSheet({ dayLabel, day, liveWorkoutOnDay, initialMode = "list", onInsert, onClose }: {
  dayLabel: string;
  day: DayRecord;
  /** A workout for this day is running: inserting changes the plan, never that workout. */
  liveWorkoutOnDay: boolean;
  initialMode?: "list" | "save";
  onInsert: (block: PlanBlock, anchor: BlockAnchor, resolutions: BlockResolution) => BlockInsertOutcome;
  onClose: () => void;
}) {
  const [store, writeStore] = useUtilityRecord<BlockStore>(BLOCK_STORE, emptyBlockStore, isBlockStore);
  const [mode, setMode] = useState<{ kind: "list" } | { kind: "save" } | { kind: "insert"; blockId: string } | { kind: "edit"; blockId: string }>(initialMode === "save" ? { kind: "save" } : { kind: "list" });
  const [message, setMessage] = useState<{ tone: "ok" | "failed" | "info"; text: string; undo?: () => void } | null>(null);
  const blocks = activeBlocks(store);
  const archived = archivedBlocks(store);
  const commit = (next: BlockStore, text: string) => {
    const kept = writeStore(next);
    setMessage(kept ? { tone: "ok", text } : { tone: "failed", text: "Couldn't save on this device. What you entered is kept; try again." });
    return kept;
  };
  const block = (id: string) => store.blocks.find((item) => item.id === id);

  return <UtilitySheet eyebrow={dayLabel} title="Blocks" labelId="plan-blocks-title" onClose={onClose} wide>
    <div className="stp-body blk-body">
      {(mode.kind === "list" || mode.kind === "save") && <div className="ut-segment blk-tabs" role="tablist" aria-label="Blocks">
        <button type="button" role="tab" aria-selected={mode.kind === "list"} className={mode.kind === "list" ? "is-on" : ""} onClick={() => { setMode({ kind: "list" }); setMessage(null); }}>My blocks</button>
        <button type="button" role="tab" aria-selected={mode.kind === "save"} className={mode.kind === "save" ? "is-on" : ""} onClick={() => { setMode({ kind: "save" }); setMessage(null); }}>Save from this day</button>
      </div>}

      {mode.kind === "list" && <>
        {blocks.length === 0 ? <p className="ut-empty">Save a group of exercises to reuse it in another day.</p> : <ul className="blk-list" aria-label="My blocks">
          {blocks.map((item) => <li key={item.id}>
            <p className="blk-name"><b>{item.name}</b><small>{item.entries.length} exercise{item.entries.length === 1 ? "" : "s"}</small></p>
            {item.description && <p className="stp-note">{item.description}</p>}
            <p className="blk-preview">{blockPreviewLine(item)}</p>
            <div className="ut-row-actions">
              <button type="button" className="stp-secondary blk-insert" onClick={() => { setMode({ kind: "insert", blockId: item.id }); setMessage(null); }}><Plus className="mr-1 h-4 w-4" aria-hidden="true" />Insert…</button>
              <button type="button" className="ut-link" onClick={() => { setMode({ kind: "edit", blockId: item.id }); setMessage(null); }}><Pencil className="mr-1 inline h-4 w-4" aria-hidden="true" />Edit</button>
              <button type="button" className="ut-link" onClick={() => commit(duplicateBlock(store, item.id, utilityId("block"), new Date().toISOString()), `Copied “${item.name}”.`)}><Copy className="mr-1 inline h-4 w-4" aria-hidden="true" />Duplicate</button>
              <button type="button" className="ut-link" onClick={() => commit(setBlockArchived(store, item.id, true, new Date().toISOString()), `Archived “${item.name}”. Restore it from Archived below.`)}><Archive className="mr-1 inline h-4 w-4" aria-hidden="true" />Archive</button>
            </div>
          </li>)}
        </ul>}
        {archived.length > 0 && <details className="ut-disclosure"><summary>Archived <small>{archived.length}</small></summary>
          <ul className="blk-list">{archived.map((item) => <li key={item.id}><p className="blk-name"><b>{item.name}</b><small>{item.entries.length} exercise{item.entries.length === 1 ? "" : "s"}</small></p><button type="button" className="ut-link" onClick={() => commit(setBlockArchived(store, item.id, false, new Date().toISOString()), `Restored “${item.name}”.`)}><RotateCcw className="mr-1 inline h-4 w-4" aria-hidden="true" />Restore</button></li>)}</ul>
        </details>}
      </>}

      {mode.kind === "save" && <SaveBlockForm day={day} onSave={(fields, ids) => {
        const result = blockFromDay(day, ids, fields, { id: utilityId("block"), now: new Date().toISOString() });
        if (!result.ok) { setMessage({ tone: "info", text: result.message }); return false; }
        if (!commit(upsertBlock(store, result.block), `Saved “${result.block.name}” with ${result.block.entries.length} exercise${result.block.entries.length === 1 ? "" : "s"}. This day is unchanged.`)) return false;
        setMode({ kind: "list" });
        return true;
      }} />}

      {mode.kind === "insert" && block(mode.blockId) && <InsertPreview block={block(mode.blockId)!} day={day} dayLabel={dayLabel} liveWorkoutOnDay={liveWorkoutOnDay} onBack={() => setMode({ kind: "list" })} onInsert={(anchor, resolutions) => {
        const outcome = onInsert(block(mode.blockId)!, anchor, resolutions);
        if (!outcome.ok) { setMessage({ tone: "failed", text: outcome.message }); return; }
        const parts = [`Added ${outcome.added} exercise${outcome.added === 1 ? "" : "s"} from “${block(mode.blockId)!.name}” to ${dayLabel}.`];
        if (outcome.anchorGone && outcome.added) parts.push("The exercise you chose to put them before had been removed, so they went after the last exercise.");
        if (outcome.alreadyThere.length) parts.push(`Already in the day, so not added twice: ${outcome.alreadyThere.join(", ")}.`);
        if (outcome.omitted.length) parts.push(`Left out: ${outcome.omitted.join(", ")}.`);
        setMessage({ tone: "ok", text: parts.join(" "), undo: outcome.added ? outcome.undo : undefined });
        setMode({ kind: "list" });
      }} />}

      {mode.kind === "edit" && block(mode.blockId) && <EditBlockForm block={block(mode.blockId)!} onCancel={() => setMode({ kind: "list" })} onSave={(fields, entries) => {
        const now = new Date().toISOString();
        const renamed = renameBlock(store, mode.blockId, fields, now);
        if (!renamed.ok) { setMessage({ tone: "info", text: renamed.message }); return; }
        const edited = editBlockEntries(renamed.store, mode.blockId, entries, now);
        if (!edited.ok) { setMessage({ tone: "info", text: edited.message }); return; }
        if (commit(edited.store, `Saved changes to “${fields.name.trim()}”. Days it was already added to keep their own copies.`)) setMode({ kind: "list" });
      }} />}

      <div className="blk-status" role="status" aria-live="polite">
        {message && <p className={message.tone === "failed" ? "stp-warn" : "stp-note"}>{message.tone === "failed" && <AlertTriangle className="h-4 w-4" aria-hidden="true" />}{message.tone === "ok" && <Check className="mr-1 inline h-4 w-4" aria-hidden="true" />}{message.text}</p>}
        {message?.undo && <button type="button" className="stp-secondary" onClick={() => { message.undo?.(); setMessage({ tone: "info", text: "Undone: the exercises that insertion added were removed. Nothing else in the day changed." }); }}><Undo2 className="mr-2 h-4 w-4" aria-hidden="true" />Undo</button>}
      </div>
    </div>
  </UtilitySheet>;
}

function SaveBlockForm({ day, onSave }: { day: DayRecord; onSave: (fields: { name: string; description: string }, ids: number[]) => boolean }) {
  const [chosen, setChosen] = useState<number[]>(() => day.workout.map((entry) => entry.id));
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  if (!day.workout.length) return <p className="ut-empty">This day has no exercises yet. Add some, then save them as a block.</p>;
  const toggle = (id: number) => setChosen((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  return <form className="blk-form" onSubmit={(event) => { event.preventDefault(); onSave({ name, description }, chosen); }}>
    <fieldset className="blk-pick">
      <legend>Exercises to keep in the block <small>{chosen.length} of {day.workout.length}</small></legend>
      {day.workout.map((entry) => <label key={entry.id} className="ut-check blk-pick-row"><input type="checkbox" checked={chosen.includes(entry.id)} onChange={() => toggle(entry.id)} /><span><b>{entry.name}</b><small>{day.prescriptions[entry.id] || "Plan default"}</small></span></label>)}
    </fieldset>
    <label className="ut-field"><span>Block name</span><input value={name} maxLength={blockLimits.name} placeholder="e.g. Forearm finisher" onChange={(event) => setName(event.target.value)} /></label>
    <label className="ut-field"><span>Description <small>optional</small></span><input value={description} maxLength={blockLimits.description} placeholder="When you use it" onChange={(event) => setDescription(event.target.value)} /></label>
    <p className="stp-note">Saves the planned exercises, sets and reps, RPE, rest and notes. Not anything you've logged.</p>
    <div className="stp-actions"><button type="submit" className="stp-primary" disabled={!chosen.length}>Save block</button></div>
  </form>;
}

function InsertPreview({ block, day, dayLabel, liveWorkoutOnDay, onBack, onInsert }: { block: PlanBlock; day: DayRecord; dayLabel: string; liveWorkoutOnDay: boolean; onBack: () => void; onInsert: (anchor: BlockAnchor, resolutions: BlockResolution) => void }) {
  // Read from the day as it is now: an edit made while this is open is reflected before insert.
  const preview = useMemo(() => previewBlockInsert(day, block), [day, block]);
  // The place is held as the entry to go before, so an edit to the day while this is open can't
  // shift it onto a different exercise.
  const [chosenAnchor, setAnchor] = useState<BlockAnchor>(null);
  const anchorGone = chosenAnchor !== null && !day.workout.some((entry) => entry.id === chosenAnchor);
  const anchor = anchorGone ? null : chosenAnchor;
  const [resolutions, setResolutions] = useState<BlockResolution>({});
  const adding = preview.filter((item) => item.status === "add" || (item.status === "missing" && typeof resolutions[item.index] === "number")).length;
  const pending = preview.filter((item) => item.status === "missing" && resolutions[item.index] === undefined).length;
  return <div className="blk-form">
    <p className="stp-eyebrow">Insert “{block.name}”</p>
    <label className="ut-field"><span>Where in {dayLabel}</span>
      <select value={anchor === null ? "end" : String(anchor)} onChange={(event) => setAnchor(event.target.value === "end" ? null : Number(event.target.value))}>
        <option value="end">{day.workout.length ? "After the last exercise" : "Into the empty day"}</option>
        {day.workout.map((entry) => <option key={entry.id} value={entry.id}>Before {entry.name}</option>)}
      </select>
    </label>
    {anchorGone && <p className="stp-note">The exercise you chose to put this before was removed from the day, so it now goes after the last exercise.</p>}
    <ol className="blk-entries">{preview.map((item) => <li key={item.index} className={`blk-entry blk-entry-${item.status}`}>
      <p><b>{item.status === "missing" ? item.entry.name : item.exercise.name}</b><small>{[item.entry.prescription || "Plan default", item.entry.rpe, item.entry.rest ? `Rest ${item.entry.rest}` : ""].filter(Boolean).join(" · ")}</small></p>
      {item.status === "already-in-day" && <p className="stp-note">Already in this day, so it isn't added twice.</p>}
      {item.status === "missing" && <label className="ut-field"><span>Not in this catalog any more</span><select value={resolutions[item.index] === undefined ? "" : String(resolutions[item.index])} onChange={(event) => setResolutions((current) => ({ ...current, [item.index]: event.target.value === "omit" ? "omit" : Number(event.target.value) }))} aria-label={`What to do with ${item.entry.name}`}>
        <option value="" disabled>Choose…</option>
        {item.candidates.map((candidate) => <option key={candidate.id} value={candidate.id}>Use {candidate.name}</option>)}
        <option value="omit">Leave it out</option>
      </select></label>}
    </li>)}</ol>
    <p className="stp-note">Adds independent copies: changing this block later won't change them, and changing them won't change the block.{liveWorkoutOnDay ? " Your workout in progress isn't changed; this edits the plan." : ""}</p>
    {pending > 0 && <p className="stp-note">Choose what to do with {pending} exercise{pending === 1 ? "" : "s"} above to insert.</p>}
    <div className="stp-actions">
      <button type="button" className="stp-primary" disabled={pending > 0 || adding === 0} onClick={() => onInsert(anchor, resolutions)}>{adding ? `Add ${adding} to ${dayLabel.split(" · ").slice(-2).join(" · ")}` : "Nothing new to add"}</button>
      <button type="button" className="stp-secondary" onClick={onBack}>Back</button>
    </div>
  </div>;
}

function EditBlockForm({ block, onSave, onCancel }: { block: PlanBlock; onSave: (fields: { name: string; description: string }, entries: BlockEntry[]) => void; onCancel: () => void }) {
  const [name, setName] = useState(block.name);
  const [description, setDescription] = useState(block.description ?? "");
  const [entries, setEntries] = useState<BlockEntry[]>(() => block.entries.map((entry) => ({ ...entry })));
  const move = (index: number, by: -1 | 1) => setEntries((current) => {
    const next = [...current];
    const [item] = next.splice(index, 1);
    next.splice(index + by, 0, item);
    return next;
  });
  return <form className="blk-form" onSubmit={(event) => { event.preventDefault(); onSave({ name, description }, entries); }}>
    <p className="stp-eyebrow">Edit block</p>
    <label className="ut-field"><span>Block name</span><input value={name} maxLength={blockLimits.name} onChange={(event) => setName(event.target.value)} /></label>
    <label className="ut-field"><span>Description <small>optional</small></span><input value={description} maxLength={blockLimits.description} onChange={(event) => setDescription(event.target.value)} /></label>
    <ol className="blk-entries">{entries.map((entry, index) => <li key={`${entry.catalogExerciseId}-${index}`} className="blk-entry blk-edit-row">
      <p><b>{entry.name}</b></p>
      <label className="ut-field"><span className="sr-only">{entry.name} sets and reps</span><input value={entry.prescription} placeholder="Plan default" aria-label={`${entry.name} sets and reps`} onChange={(event) => setEntries((current) => current.map((item, at) => (at === index ? { ...item, prescription: event.target.value } : item)))} /></label>
      <span className="blk-edit-actions">
        <button type="button" className="plt-remove" aria-label={`Move ${entry.name} up`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp className="h-4 w-4" aria-hidden="true" /></button>
        <button type="button" className="plt-remove" aria-label={`Move ${entry.name} down`} disabled={index === entries.length - 1} onClick={() => move(index, 1)}><ArrowDown className="h-4 w-4" aria-hidden="true" /></button>
        <button type="button" className="plt-remove" aria-label={`Remove ${entry.name} from the block`} onClick={() => setEntries((current) => current.filter((_, at) => at !== index))}><X className="h-4 w-4" aria-hidden="true" /></button>
      </span>
    </li>)}</ol>
    <div className="stp-actions"><button type="submit" className="stp-primary">Save changes</button><button type="button" className="stp-secondary" onClick={onCancel}>Cancel</button></div>
  </form>;
}
