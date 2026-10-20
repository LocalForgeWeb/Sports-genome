import { useEffect, useId, useRef, useState, type FormEvent, type RefObject } from "react";
import { ChevronDown, Plus } from "lucide-react";
import type { StoreWrite } from "@/lib/specialization/stores";
import { goalProgressLabel, goalsForBothSides } from "@shared/specialization/goals";
import { addDaysToDateKey } from "@shared/specialization/time";
import type { GoalMetric, GoalPeriod, GoalProgress, SpecializationGoal, SpecializationRegion, SummarySide } from "@shared/specialization/types";
import { goalMetricLabels } from "./model";
import { revealClearOfBars } from "./reveal";
import { sideWordsFor, type SideWords } from "./sideWords";
import "./targets.css";

/*
 * Targets (brief §7, design §5): the athlete's own intent, attached to one muscle or one
 * movement, one side, one measure and one period. This file holds what the muscle sheet's
 * "Your target" and the page's Targets overview share: the form, the rows with Change / End /
 * Remove, the Undo that takes back every removal since the last other change, and the
 * read-only list of ended targets. Sides are said in the region's words (`sideWordsFor`); a
 * midline region's targets have no side, and its form asks for none.
 */

export const targetMetrics: readonly GoalMetric[] = ["direct_dynamic_bouts", "deliberate_hold_bouts", "deliberate_hold_seconds"];
export const targetPeriodLabels: Record<GoalPeriod, string> = { calendar_week: "Per calendar week", rolling_7d: "Per rolling 7 days" };
/** The words a target list needs: the region's side words. */
export type TargetWords = Pick<SpecializationRegion, "id" | "sides" | "wording">;
/** "Left arm"; nothing for a midline target. */
const sideLabelOf = (words: SideWords, side: SummarySide) => (side === "midline" ? null : words.label(side));
/** "left-arm" before "target"; nothing for a midline target. */
const sideAdjectiveOf = (words: SideWords, side: SummarySide) => (side === "midline" ? null : words.adjective(side));

let goalSequence = 0;
const newGoalId = () => `goal-${Date.now().toString(36)}-${(goalSequence += 1).toString(36)}`;

/** What a target is for: one muscle (a node) or one movement (a joint action). */
export type TargetSubject = { kind: "muscle" | "movement"; id: string; name: string };

/** One key per subject, the same for both sides: `muscle:forearm.br`, `movement:elbow.flexion`. */
export const subjectKeyOf = (goal: Pick<SpecializationGoal, "nodeId" | "actionId">): string =>
  goal.nodeId !== null ? `muscle:${goal.nodeId}` : `movement:${goal.actionId ?? ""}`;
const keyOfSubject = (subject: TargetSubject) => `${subject.kind}:${subject.id}`;

/** Ended: its last counting day is before today. A running target, or one starting later, is active. */
export function isTargetEnded(goal: Pick<SpecializationGoal, "endsOn">, todayKey: string): boolean {
  return goal.endsOn !== null && goal.endsOn < todayKey;
}

/** Active and ended targets, so a list never shows a finished target as if it still counted. */
export function splitTargets(goals: readonly SpecializationGoal[], todayKey: string): { active: SpecializationGoal[]; ended: SpecializationGoal[] } {
  const active: SpecializationGoal[] = [];
  const ended: SpecializationGoal[] = [];
  for (const goal of goals) (isTargetEnded(goal, todayKey) ? ended : active).push(goal);
  return { active, ended };
}

/** Left before right, then the three measures in their fixed order, then the period. */
export function sortTargets(goals: readonly SpecializationGoal[]): SpecializationGoal[] {
  return [...goals].sort((a, b) => a.side.localeCompare(b.side) || targetMetrics.indexOf(a.metric) - targetMetrics.indexOf(b.metric) || a.period.localeCompare(b.period));
}

/** "16 Oct 2026", read as a calendar date (no zone shifts it). */
export function formatDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

const isSeconds = (goal: Pick<SpecializationGoal, "metric">) => goal.metric === "deliberate_hold_seconds";
const amountOf = (goal: Pick<SpecializationGoal, "metric" | "target">) => `${goal.target}${isSeconds(goal) ? " seconds" : ""}`;
const capitalised = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
/** "Left-arm target for Brachioradialis"; "Target for Rectus abdominis" on a midline region. */
const targetFor = (words: SideWords, goal: SpecializationGoal, subjectName: string) => {
  const adjective = sideAdjectiveOf(words, goal.side);
  return adjective ? `${capitalised(adjective)} target for ${subjectName}` : `Target for ${subjectName}`;
};

/**
 * "the left-arm target of 20 direct dynamic bouts per calendar week for Brachioradialis", for
 * button names. The period (and a later start) is part of it: one side can hold the same number
 * per calendar week and per rolling 7 days, and each row's buttons need a name of their own.
 */
function describeTarget(words: SideWords, goal: SpecializationGoal, subjectName: string, todayKey: string): string {
  const what = isSeconds(goal) ? `${goal.target} seconds of deliberate holds` : `${goal.target} ${goalMetricLabels[goal.metric].toLowerCase()}`;
  const starts = goal.startsOn > todayKey ? ` starting ${formatDateKey(goal.startsOn)}` : "";
  const adjective = sideAdjectiveOf(words, goal.side);
  return `the ${adjective ? `${adjective} ` : ""}target of ${what} ${targetPeriodLabels[goal.period].toLowerCase()}${starts} for ${subjectName}`;
}

// ---------------------------------------------------------------- changes and Undo

type Undoable = { kind: "removed" | "ended" | "ended_unstarted"; goal: SpecializationGoal };

function undoMessage(words: SideWords, entries: readonly Undoable[], subjectName: (goal: SpecializationGoal) => string, todayKey: string): string {
  if (entries.length === 1) {
    const [{ kind, goal }] = entries;
    const which = targetFor(words, goal, subjectName(goal));
    if (kind === "removed") return `${which} removed.`;
    if (kind === "ended") return `${which} ended. It stops counting from today and is listed under Ended targets.`;
    const why = goal.startsOn > todayKey ? "It had not started yet" : "It started today";
    return `${which} ended. ${why}, so it is removed rather than kept as ended.`;
  }
  const removed = entries.filter((entry) => entry.kind === "removed").length;
  const ended = entries.length - removed;
  if (!ended) return `${removed} targets removed.`;
  if (!removed) return `${ended} targets ended.`;
  return `${removed} target${removed === 1 ? "" : "s"} removed and ${ended} ended.`;
}

export type TargetEdits = {
  /** The last change, said once in a polite live region. */
  message: string;
  /** A write the device refused, or an Undo that no longer fits. */
  error: string | null;
  /** Every removal or end since the last other change; one Undo restores them all. */
  undoable: readonly Undoable[];
  undoRef: RefObject<HTMLButtonElement | null>;
  statusRef: RefObject<HTMLParagraphElement | null>;
  remove: (goal: SpecializationGoal) => void;
  end: (goal: SpecializationGoal) => void;
  change: (goal: SpecializationGoal, target: number) => StoreWrite;
  undo: () => void;
  /** Another change was saved: the removals before it are final. */
  settle: (message?: string) => void;
};

/**
 * Remove, End, Change and Undo, over the page's store. Removing the left target and then the
 * right one keeps both for Undo, so a target saved for both sides comes back whole; saving
 * anything else makes the removals before it final, so Undo can never restore a target that
 * would now overlap a newer one. A target that has not started yet (it started today, or later)
 * has no days to keep, so ending it removes it — with the same Undo.
 *
 * Undo writes back exactly the targets it took away, through `onRestore`: a target saved before
 * targets were limited to the region's target muscles (10-multi-region.md §2.2) can be ended or
 * removed, so it must come back too, although a new one on that muscle would be refused.
 */
export function useTargetEdits({ region, onSave, onRestore = onSave, onRemove, todayKey, subjectName }: {
  region: TargetWords;
  onSave: (goals: SpecializationGoal[]) => StoreWrite;
  /** Writes back targets as they were before an End or a Remove (Undo); by default `onSave`. */
  onRestore?: (goals: SpecializationGoal[]) => StoreWrite;
  onRemove: (goalId: string) => StoreWrite;
  todayKey: string;
  subjectName: (goal: SpecializationGoal) => string;
}): TargetEdits {
  const words = sideWordsFor(region);
  const [undoable, setUndoable] = useState<Undoable[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const undoRef = useRef<HTMLButtonElement | null>(null);
  const statusRef = useRef<HTMLParagraphElement | null>(null);
  const [focus, setFocus] = useState<{ on: "undo" | "status"; count: number }>({ on: "undo", count: 0 });
  // The control that held focus is gone (a removed row, or Undo itself): focus moves to Undo,
  // the next thing anyone would want, or after Undo to the message saying what came back.
  // The message sits under the whole list, which on a phone is often below the fold or under
  // the bottom dock: it is brought into view and measured against the dock and the tab row
  // (`revealClearOfBars`; scroll-margin alone misses an Undo already on screen under the dock).
  useEffect(() => {
    if (!focus.count) return;
    const target = focus.on === "undo" ? undoRef.current : statusRef.current;
    if (!target) return;
    target.focus({ preventScroll: true });
    revealClearOfBars(target);
  }, [focus]);

  const record = (entry: Undoable) => {
    const next = undoable.some((item) => item.goal.id === entry.goal.id) ? undoable : [...undoable, entry];
    setUndoable(next);
    setMessage(undoMessage(words, next, subjectName, todayKey));
    setError(null);
    setFocus((current) => ({ on: "undo", count: current.count + 1 }));
  };
  const remove = (goal: SpecializationGoal) => {
    const result = onRemove(goal.id);
    if (!result.ok) { setError(result.reason); return; }
    record({ kind: "removed", goal });
  };
  const end = (goal: SpecializationGoal) => {
    if (goal.startsOn >= todayKey) {
      const result = onRemove(goal.id);
      if (!result.ok) { setError(result.reason); return; }
      record({ kind: "ended_unstarted", goal });
      return;
    }
    // Yesterday is its last counting day, so it stops counting from today.
    const result = onSave([{ ...goal, endsOn: addDaysToDateKey(todayKey, -1), updatedAt: new Date().toISOString() }]);
    if (!result.ok) { setError(result.reason); return; }
    record({ kind: "ended", goal });
  };
  const settle = (text = "") => {
    setUndoable([]);
    setMessage(text);
    setError(null);
  };
  const change = (goal: SpecializationGoal, target: number): StoreWrite => {
    const result = onSave([{ ...goal, target, updatedAt: new Date().toISOString() }]);
    if (result.ok) settle(`${targetFor(words, goal, subjectName(goal))} changed to ${amountOf({ ...goal, target })} ${targetPeriodLabels[goal.period].toLowerCase()}.`);
    return result;
  };
  const undo = () => {
    if (!undoable.length) return;
    const result = onRestore(undoable.map((entry) => entry.goal));
    if (!result.ok) { setError(result.reason); return; }
    settle(undoable.length === 1 ? "Target restored." : `${undoable.length} targets restored.`);
    setFocus((current) => ({ on: "status", count: current.count + 1 }));
  };
  return { message, error, undoable, undoRef, statusRef, remove, end, change, undo, settle };
}

/** The live message with its Undo, and any refusal, in place under the list. */
export function TargetEditStatus({ edits }: { edits: TargetEdits }) {
  return <>
    <div className="spz-tg-status">
      <p ref={edits.statusRef} role="status" tabIndex={-1}>{edits.message}</p>
      {edits.undoable.length > 0 && <button ref={edits.undoRef} type="button" className="spz-button" onClick={edits.undo}>Undo</button>}
    </div>
    {edits.error && <p className="spz-error" role="alert">{edits.error}</p>}
  </>;
}

// ---------------------------------------------------------------- rows

function ChangeTarget({ goal, description, onSave, onCancel }: {
  goal: SpecializationGoal;
  description: string;
  onSave: (target: number) => StoreWrite;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(String(goal.target));
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();
  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const target = Number(value);
    if (!value.trim() || !Number.isFinite(target) || target <= 0) { setError("Enter a target above zero."); return; }
    const result = onSave(target);
    if (!result.ok) setError(result.reason);
  };
  return <form className="spz-tg-change" noValidate onSubmit={submit} aria-label={`Change ${description}`}>
    <label className="spz-field">
      <span>New target ({isSeconds(goal) ? "seconds" : "bouts"} {targetPeriodLabels[goal.period].toLowerCase()})</span>
      <input ref={inputRef} type="number" inputMode="numeric" enterKeyHint="done" min={1} step={1} value={value} onChange={(event) => setValue(event.target.value)} aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined} />
    </label>
    {error && <p id={errorId} className="spz-error" role="alert">{error}</p>}
    <div className="spz-actions">
      <button type="submit" className="spz-primary">Save</button>
      <button type="button" className="spz-button" onClick={onCancel}>Cancel</button>
    </div>
  </form>;
}

function TargetRow({ words, goal, side, progress, subjectName, showSubject, readOnly, editing, onEdit, onStopEditing, edits, todayKey }: {
  words: SideWords;
  goal: SpecializationGoal;
  side: SummarySide;
  progress: GoalProgress | null;
  subjectName: string;
  showSubject: boolean;
  /** A target on a muscle that is not a target here: it can be ended or removed, not changed. */
  readOnly: boolean;
  editing: boolean;
  onEdit: () => void;
  onStopEditing: () => void;
  edits: TargetEdits;
  todayKey: string;
}) {
  const changeRef = useRef<HTMLButtonElement>(null);
  const wasEditing = useRef(false);
  useEffect(() => {
    if (wasEditing.current && !editing) changeRef.current?.focus();
    wasEditing.current = editing;
  }, [editing]);
  const description = describeTarget(words, goal, subjectName, todayKey);
  const startsLater = goal.startsOn > todayKey;
  const current = goal.side === side;
  // On this side, the summary's "8 of your 20"; with no summary yet, nothing rather than a guess.
  const label = !current || startsLater ? null : progress ? progress.label : null;
  return <li className="spz-target spz-tg-row" data-side={goal.side} data-current={current || undefined}>
    <span>
      <b>{[showSubject ? subjectName : null, sideLabelOf(words, goal.side), goalMetricLabels[goal.metric]].filter(Boolean).join(" · ")}</b>
      <small>
        {amountOf(goal)} {targetPeriodLabels[goal.period].toLowerCase()}
        {startsLater ? ` · starts ${formatDateKey(goal.startsOn)}` : ""}
        {goal.endsOn ? ` · until ${formatDateKey(goal.endsOn)}` : ""}
        {label ? ` · ${label}` : ""}
      </small>
    </span>
    {editing
      ? <ChangeTarget goal={goal} description={description} onSave={(target) => {
        // The same number is no change: nothing is written, so a pending Undo is kept.
        if (target === goal.target) { onStopEditing(); return { ok: true }; }
        const result = edits.change(goal, target);
        if (result.ok) onStopEditing();
        return result;
      }} onCancel={onStopEditing} />
      : <div className="spz-tg-actions">
        {!readOnly && <button ref={changeRef} type="button" className="spz-button" onClick={onEdit} aria-label={`Change ${description}`}>Change</button>}
        <button type="button" className="spz-button" onClick={() => edits.end(goal)} aria-label={`End ${description}`}>End</button>
        <button type="button" className="spz-button" onClick={() => edits.remove(goal)} aria-label={`Remove ${description}`}>Remove</button>
      </div>}
  </li>;
}

/**
 * Active targets as rows: each says its side, measure, number and period, this side's progress
 * ("8 of your 20"), and offers Change (the number, in place), End and Remove; a target on a muscle
 * that is not a target of this region (`readOnly`) offers End and Remove only.
 */
export function TargetRows({ region, goals, side, progress, edits, subjectName, showSubject = false, readOnly = () => false, todayKey, progressReady = true }: {
  region: TargetWords;
  goals: readonly SpecializationGoal[];
  side: SummarySide;
  progress: readonly GoalProgress[];
  edits: TargetEdits;
  subjectName: (goal: SpecializationGoal) => string;
  showSubject?: boolean;
  readOnly?: (goal: SpecializationGoal) => boolean;
  todayKey: string;
  /** False while the summary is not ready: rows then show no progress rather than a zero. */
  progressReady?: boolean;
}) {
  const words = sideWordsFor(region);
  const [editingId, setEditingId] = useState<string | null>(null);
  return <ul className="spz-target-list">
    {sortTargets(goals).map((goal) => {
      const found = progress.find((item) => item.goal.id === goal.id) ?? null;
      // A ready summary always reads an active target on its side; without one, say what it reads as so far.
      const shown = found ?? (progressReady && goal.side === side && goal.startsOn <= todayKey ? { goal, value: 0, fraction: 0, label: goalProgressLabel(0, goal) } : null);
      return <TargetRow key={goal.id} words={words} goal={goal} side={side} progress={shown} subjectName={subjectName(goal)} showSubject={showSubject} readOnly={readOnly(goal)}
        editing={editingId === goal.id} onEdit={() => setEditingId(goal.id)} onStopEditing={() => setEditingId(null)} edits={edits} todayKey={todayKey} />;
    })}
  </ul>;
}

/** Ended targets, read-only, with the dates they counted. */
export function EndedTargets({ region, goals, subjectName, showSubject = false }: {
  region: TargetWords;
  goals: readonly SpecializationGoal[];
  subjectName: (goal: SpecializationGoal) => string;
  showSubject?: boolean;
}) {
  if (!goals.length) return null;
  const words = sideWordsFor(region);
  const sorted = [...goals].sort((a, b) => (b.endsOn ?? "").localeCompare(a.endsOn ?? "") || a.side.localeCompare(b.side));
  return <details className="spz-disclosure spz-tg-ended">
    <summary><span><b>Ended targets ({goals.length})</b><small>No longer counted. Kept so you can see what you aimed for.</small></span><ChevronDown className="h-4 w-4" aria-hidden="true" /></summary>
    <ul className="spz-target-list">
      {sorted.map((goal) => <li key={goal.id} className="spz-target" data-side={goal.side}>
        <span>
          <b>{[showSubject ? subjectName(goal) : null, sideLabelOf(words, goal.side), goalMetricLabels[goal.metric]].filter(Boolean).join(" · ")}</b>
          <small>{amountOf(goal)} {targetPeriodLabels[goal.period].toLowerCase()} · {formatDateKey(goal.startsOn)} to {formatDateKey(goal.endsOn ?? goal.startsOn)}</small>
        </span>
      </li>)}
    </ul>
  </details>;
}

// ---------------------------------------------------------------- the form

/**
 * A new target: what it is for (fixed in the muscle sheet, chosen in the overview), what it
 * counts, the number, the period, and the sides. Nothing is filled in but the subject: the
 * number is always the athlete's own. "Both arms" saves two targets, one per side; a midline
 * region's target has no side, and the form asks for none.
 */
export function TargetForm({ region, side, timeZone, todayKey, subject, subjectGroups, onSave, onSaved, onCancel }: {
  region: TargetWords;
  side: SummarySide;
  timeZone: string;
  todayKey: string;
  /** The subject, when it is fixed (the muscle sheet). */
  subject?: TargetSubject;
  /** The choices, when the athlete picks the subject (the overview). */
  subjectGroups?: readonly { label: string; options: readonly TargetSubject[] }[];
  onSave: (goals: SpecializationGoal[]) => StoreWrite;
  onSaved: (goals: SpecializationGoal[], subject: TargetSubject) => void;
  onCancel: () => void;
}) {
  const uid = useId();
  const words = sideWordsFor(region);
  const [choice, setChoice] = useState("");
  const [metric, setMetric] = useState<GoalMetric>("direct_dynamic_bouts");
  const [target, setTarget] = useState("");
  const [period, setPeriod] = useState<GoalPeriod>("calendar_week");
  const [sides, setSides] = useState<"this" | "both">("both");
  const [error, setError] = useState<string | null>(null);
  const options = (subjectGroups ?? []).flatMap((group) => group.options);
  const chosen = subject ?? options.find((option) => keyOfSubject(option) === choice) ?? null;

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!chosen) { setError("Choose a muscle or a movement."); return; }
    const value = Number(target);
    if (!target.trim() || !Number.isFinite(value) || value <= 0) { setError("Enter a target above zero."); return; }
    const now = new Date().toISOString();
    const draft = {
      id: newGoalId(), regionId: region.id,
      nodeId: chosen.kind === "muscle" ? chosen.id : null,
      actionId: chosen.kind === "movement" ? chosen.id : null,
      metric, target: value, period, startsOn: todayKey, endsOn: null, timezone: timeZone, createdAt: now, updatedAt: now,
    };
    const goals: SpecializationGoal[] = !words.paired ? [{ ...draft, side: "midline" }] : sides === "both" ? goalsForBothSides(draft) : [{ ...draft, side }];
    const result = onSave(goals);
    if (!result.ok) { setError(result.reason); return; }
    setError(null);
    onSaved(goals, chosen);
  };

  return <form className="spz-tg-form" noValidate onSubmit={save}>
    <fieldset className="spz-target-form">
      <legend>{subject ? `New target for ${subject.name}` : "New target"}</legend>
      {!subject && <label className="spz-field">
        <span>Muscle or movement</span>
        <select value={choice} onChange={(event) => { setChoice(event.target.value); setError(null); }}>
          <option value="">Choose one</option>
          {(subjectGroups ?? []).map((group) => <optgroup key={group.label} label={group.label}>
            {group.options.map((option) => <option key={keyOfSubject(option)} value={keyOfSubject(option)}>{option.name}</option>)}
          </optgroup>)}
        </select>
      </label>}
      <div className="spz-tg-group-field">
        <span id={`${uid}-metric`} className="spz-tg-label">What it counts</span>
        <div className="spz-radio-group" role="radiogroup" aria-labelledby={`${uid}-metric`}>
          {targetMetrics.map((item) => <label key={item} className="spz-radio"><input type="radio" name={`${uid}-metric`} checked={metric === item} onChange={() => setMetric(item)} /><span>{goalMetricLabels[item]}</span></label>)}
        </div>
      </div>
      <label className="spz-field">
        <span>Target {metric === "deliberate_hold_seconds" ? "(seconds)" : "(bouts)"}</span>
        <input type="number" inputMode="numeric" enterKeyHint="done" min={1} step={1} value={target} onChange={(event) => setTarget(event.target.value)} />
      </label>
      <label className="spz-field">
        <span>Period</span>
        <select value={period} onChange={(event) => setPeriod(event.target.value as GoalPeriod)}>
          {(Object.keys(targetPeriodLabels) as GoalPeriod[]).map((item) => <option key={item} value={item}>{targetPeriodLabels[item]}</option>)}
        </select>
      </label>
      {words.paired && side !== "midline" && <div className="spz-tg-group-field">
        <span id={`${uid}-sides`} className="spz-tg-label">Which {words.one}</span>
        <div className="spz-segment" role="group" aria-labelledby={`${uid}-sides`}>
          <button type="button" aria-pressed={sides === "both"} onClick={() => setSides("both")}>{words.both}</button>
          <button type="button" aria-pressed={sides === "this"} onClick={() => setSides("this")}>{words.only(side)}</button>
        </div>
      </div>}
      <p className="spz-note">A target is what you intend to do, not a proven growth threshold. Numbers above 15 are fine.{words.paired ? ` ${words.both} saves one target ${words.perSide}, so each can be compared and changed on its own.` : ""}</p>
      {chosen?.kind === "movement" && <p className="spz-note">A movement target counts each bout once when that movement is direct work for any muscle on this page.</p>}
      {error && <p className="spz-error" role="alert">{error}</p>}
      <div className="spz-actions">
        <button type="submit" className="spz-primary">Save target</button>
        <button type="button" className="spz-button" onClick={onCancel}>Cancel</button>
      </div>
    </fieldset>
  </form>;
}

/** Focus goes back to the button that opened a form once the form closes. */
export function useReturnFocus(open: boolean): RefObject<HTMLButtonElement | null> {
  const ref = useRef<HTMLButtonElement | null>(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !open) ref.current?.focus();
    wasOpen.current = open;
  }, [open]);
  return ref;
}

// ---------------------------------------------------------------- the muscle sheet

/** What a saved target is said as once saved: "Saved: one target per arm for BR.", "Saved: a left-arm target for BR.", "Saved: a target for RA." */
export function savedMessage(region: TargetWords, saved: readonly SpecializationGoal[], subjectName: string): string {
  const words = sideWordsFor(region);
  if (saved.length === 2) return `Saved: one target ${words.perSide} for ${subjectName}.`;
  const adjective = saved[0] ? sideAdjectiveOf(words, saved[0].side) : null;
  return `Saved: a ${adjective ? `${adjective} ` : ""}target for ${subjectName}.`;
}

/** Said beside a target on a muscle that is not a target of the page's region (10-multi-region.md §2.2). */
export const READ_ONLY_TARGET_NOTE = "Targets are for this region's target muscles. You can end or remove this one.";

/**
 * "Your target" in the muscle sheet (brief §7). A target is the athlete's intent, attached
 * to one muscle, one side, one measure and one period; "Both arms" saves two, so the sides
 * stay comparable. Direct dynamic bouts, hold bouts and hold seconds are separate targets,
 * so a hold never hides inside a set count. No muscle gets a target it was not given:
 * without one the sheet says "Not targeted", never a deficit. A target can be changed or
 * ended in place; removing or ending offers Undo, which restores every removal since the
 * last other change.
 *
 * Only a target muscle of the region gets a new target (`canSet`); a target saved earlier on
 * another muscle is shown with End and Remove only (10-multi-region.md §2.2).
 */
export function TargetsEditor({ region, nodeId, nodeName, canSet, side, goals, progress, timeZone, todayKey, onSave, onRestore, onRemove }: {
  region: TargetWords;
  nodeId: string;
  nodeName: string;
  /** The muscle is a target of the page's region: targets can be set and changed. */
  canSet: boolean;
  side: SummarySide;
  /** Every saved target for this muscle, both sides, ended ones included. */
  goals: readonly SpecializationGoal[];
  /** Progress for the side on screen, from the summary. */
  progress: readonly GoalProgress[];
  timeZone: string;
  /** Today's local date (YYYY-MM-DD): what counts as ended, and the day a new target starts. */
  todayKey: string;
  onSave: (goals: SpecializationGoal[]) => StoreWrite;
  /** Undo's write: the targets as they were (`useTargetEdits`). */
  onRestore?: (goals: SpecializationGoal[]) => StoreWrite;
  onRemove: (goalId: string) => StoreWrite;
}) {
  const words = sideWordsFor(region);
  const [open, setOpen] = useState(false);
  const addRef = useReturnFocus(open);
  const subjectName = () => nodeName;
  const edits = useTargetEdits({ region, onSave, onRestore, onRemove, todayKey, subjectName });
  const { active, ended } = splitTargets(goals, todayKey);
  const onThisSide = active.some((goal) => goal.side === side);

  return <div className="spz-targets">
    {!canSet && active.length > 0 && <p className="spz-note">{READ_ONLY_TARGET_NOTE}</p>}
    {active.length ? <>
      <TargetRows region={region} goals={active} side={side} progress={progress} edits={edits} subjectName={subjectName} readOnly={() => !canSet} todayKey={todayKey} />
      {canSet && !onThisSide && side !== "midline" && <p className="spz-note"><b>Not targeted on the {words.of(side)}.</b> Only the other {words.one} has a target for this muscle.</p>}
    </> : canSet && <p className="spz-note"><b>Not targeted.</b> Nothing here is behind: a muscle without a target has no gap to show.</p>}
    <TargetEditStatus edits={edits} />
    {canSet && (open
      ? <TargetForm region={region} side={side} timeZone={timeZone} todayKey={todayKey} subject={{ kind: "muscle", id: nodeId, name: nodeName }} onSave={onSave}
        onSaved={(saved) => { edits.settle(savedMessage(region, saved, nodeName)); setOpen(false); }}
        onCancel={() => setOpen(false)} />
      : <button ref={addRef} type="button" className="spz-link" onClick={() => setOpen(true)}><Plus className="h-4 w-4" aria-hidden="true" />Set a target</button>)}
    <EndedTargets region={region} goals={ended} subjectName={subjectName} />
  </div>;
}
