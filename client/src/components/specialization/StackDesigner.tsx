import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ArrowRight, ChevronDown, Minus, Plus } from "lucide-react";
import type { AthleteEquipmentProfile } from "@/lib/equipmentProfile";
import type { Exercise } from "@/lib/exerciseCatalog";
import type { SpecializationExclusions } from "@/lib/specialization/exclusions";
import { useRegionExtras } from "@/lib/specialization/regionExtras";
import {
  STACK_RULES,
  bringBackMovement,
  chooseExercise,
  dayChoicesFor,
  defaultStackSettings,
  designStack,
  leaveOutMovement,
  moveRow,
  pageSideOf,
  plannedSummaryFor,
  setRowSets,
  type StackDesign,
  type StackEdits,
  type StackInput,
  type StackMovementState,
  type StackRow,
  type StackSettings,
  type StackTarget,
} from "@/lib/specialization/stack";
import { lastChoiceFor, removeStackRecord, saveStackRecord, stackEntriesState, stackForWeek, stackRecordFrom, storeWithoutEntries, type StackRecordEntry, type useSpecializationStacks } from "@/lib/specialization/stackStore";
import type { AccountScope } from "@/lib/specialization/stores";
import { regionStackWord, type SpecializationAreaReport, type SpecializationPlanBatchChange, type SpecializationStackProps } from "@/lib/specialization/viewState";
import { loadDay, type DaySlot, type WeeklyDayStore } from "@/lib/trainingDayPlan";
import type { TrainingGoal } from "@/lib/workoutPlanner";
import { catalogIdOf } from "@/lib/workoutSwap";
import { directWorkCount } from "@shared/specialization/directWork";
import { rangeText } from "@shared/specialization/repProfiles";
import type { GoalMetric, NodeExposure, RegionExtras, SpecializationGoal, SpecializationRegionData, SummaryMode } from "@shared/specialization/types";
import { REP_EFFORT_SENTENCE, REP_RANGE_SENTENCE, holdRangeSentence, holdTime } from "./model";
import { revealClearOfBars } from "./reveal";
import { sideWordsFor } from "./sideWords";
import "./stack.css";

/**
 * The stack designer, inside the page's "Design a stack" card (docs/specialization-atlas/
 * 11-forearm-research-and-stack.md §3.2–§3.12, lane S4). Fetched when the card first opens (§3.10):
 * this file, the designer (`stack.ts`), the batch apply (`planBatch.ts`, through Home) and the
 * region's rep profiles are never part of the closed page.
 *
 * The athlete sets one number, the region's direct moving sets a week (both sides as one, the
 * plan's own included); the designer (`designStack`) chooses the exercises and their days, and this
 * card says what changes, right under the number, beside one Add. Every sentence here is written
 * from the design's values; none comes from the designer. Phone first (CLAUDE.md): the number, its
 * effect and Add come first and fit one screen; every control is outlined or filled, at least
 * 44 × 44 px, visible at rest; the number field is 16 px; nothing is a popup (Change opens in
 * place); Leave out, Add and Take it out act at once and offer Undo. Region-agnostic: the region's
 * words come from its data (`regionStackWord`, `sideWordsFor`, the movements' and profiles' labels).
 *
 * Nothing here gives a muscle a number of its own, calls a number optimal or a goal, or names a
 * side: the total is the athlete's choice, and the ranges are the app's starting ranges (§5.3).
 */

type Stacks = ReturnType<typeof useSpecializationStacks>;

export type StackDesignerProps = {
  data: SpecializationRegionData;
  /** The card's plan week: the page's plan week in Planned mode, the week being trained in Completed mode. */
  week: number;
  /** The page's mode: in Completed mode the card says it reads the plan as written. */
  mode: SummaryMode;
  plan: { ready: boolean; slots: DaySlot[]; weeks: Record<number, WeeklyDayStore> };
  catalog: readonly Exercise[];
  equipmentProfile: AthleteEquipmentProfile | null;
  exclusions: SpecializationExclusions;
  /** The athlete's targets for the region. */
  goals: readonly SpecializationGoal[];
  goal: TrainingGoal;
  /** The athlete's gym window, in minutes. */
  gymMinutes: number;
  accountId: AccountScope;
  nowIso: string;
  timeZone: string;
  /** The account's stack records (the page's hook, so one listener serves the card and its summary). */
  stacks: Stacks;
  onApplyPlanChanges: SpecializationStackProps["onApplyPlanChanges"] | undefined;
  aboutMeArea: SpecializationAreaReport | null;
  /** Says something in the page's polite live region. */
  announce: (text: string) => void;
};

/** What the athlete has chosen in this design: the total (null: the starting value), the settings and the row edits. */
type Draft = { total: number | null; settings: StackSettings; edits: StackEdits };

const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;
const lowerFirst = (text: string) => (text ? text.charAt(0).toLowerCase() + text.slice(1) : text);
/** "a", "a and b", "a, b and c". */
const listWords = (items: readonly string[]) => (items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`);
const metricUnit: Record<GoalMetric, string> = { direct_dynamic_bouts: "", deliberate_hold_bouts: "", deliberate_hold_seconds: " s" };

export function StackDesigner(props: StackDesignerProps) {
  const extras = useRegionExtras(props.data.region.id);
  const store = props.plan.weeks[props.week];
  if (!props.plan.ready) return <p className="spz-note" role="status">Your plan is still loading.</p>;
  if (!store) return <p className="spz-note">Build Plan Week {props.week} in Plan first.</p>;
  if (!props.plan.slots.length) return <p className="spz-note">Your plan has no training days yet. Choose your days in Plan first.</p>;
  if (extras.status === "loading") return <p className="spz-note" role="status">Loading starting ranges…</p>;
  // Never a default in the profiles' place: without them there is no design to show.
  if (extras.status === "error") return <div className="spz-loading" role="alert">
    <p className="spz-error">The starting ranges could not be loaded. Reloading usually fixes this.</p>
    <button type="button" className="spz-button" onClick={() => window.location.reload()}>Reload</button>
  </div>;
  return <StackDesignerBody {...props} store={store} extras={extras.extras} />;
}

/** One finished action on the plan, said in the card with its Undo; or that it was undone. */
type Done = { kind: "added" | "changed" | "removed"; text: string; detail: string; undo: () => void } | { kind: "undone"; text: string };

function StackDesignerBody({ data, week, mode, plan, catalog, equipmentProfile, exclusions, goals, goal, gymMinutes, accountId, nowIso, timeZone, stacks, onApplyPlanChanges, aboutMeArea, announce, store, extras }: StackDesignerProps & { store: WeeklyDayStore; extras: RegionExtras | null }) {
  const regionId = data.region.id;
  const noun = regionStackWord(data.region);
  const words = useMemo(() => sideWordsFor(data.region), [data.region]);
  const ids = useId();
  const nodeName = (nodeId: string) => lowerFirst(data.nodes.find((node) => node.id === nodeId)?.name ?? nodeId);

  // ---- the week's stack, if this account added one, and its entries as the plan holds them now
  const record = stackForWeek(stacks, regionId, week);
  const entries = useMemo(() => (record ? stackEntriesState(record, store) : null), [record, store]);
  const hasStack = Boolean(entries && entries.asWritten.length + entries.changed.length > 0);
  const elsewhere = useMemo(() => {
    if (hasStack) return null;
    return stacks.stacks.find((item) => {
      if (item.regionId !== regionId || item.planWeek === week || !plan.weeks[item.planWeek]) return false;
      const state = stackEntriesState(item, plan.weeks[item.planWeek]);
      return state.asWritten.length + state.changed.length > 0;
    }) ?? null;
  }, [hasStack, stacks.stacks, regionId, week, plan.weeks]);
  const lastChoice = lastChoiceFor(stacks, regionId);

  const [done, setDone] = useState<Done | null>(null);
  /** "design": the athlete asked for the design (Change the total, Design for Week N); "auto": what the week holds decides. */
  const [view, setView] = useState<"auto" | "design">("auto");
  const showing: "added" | "elsewhere" | "design" = view === "design" ? "design"
    : hasStack || done?.kind === "added" || done?.kind === "changed" ? "added"
    : elsewhere ? "elsewhere" : "design";
  /** Change the total: a design on the week without the stack's own entries, which Add replaces. */
  const changing = showing === "design" && hasStack;
  const baseStore = useMemo(() => (changing && entries ? storeWithoutEntries(store, entries.asWritten) : store), [changing, entries, store]);

  const inputOf = (draft: Draft): StackInput => ({
    region: data, extras, catalog, plan: { week, slots: plan.slots, store: baseStore, goal, gymMinutes }, goals, equipment: equipmentProfile, exclusions,
    settings: draft.settings, edits: draft.edits, total: draft.total, now: nowIso, timeZone,
  });
  const [draft, setDraft] = useState<Draft>(() => {
    const settings = lastChoice?.settings ?? defaultStackSettings;
    // A total the athlete sees is theirs from then on: it never rises by itself (§3.3).
    const first: Draft = { total: null, settings, edits: {} };
    return { ...first, total: designStack(inputOf(first)).total };
  });
  /** The athlete has not changed the total since it was set for them: the starting sentence still says why it is what it is. */
  const [startedFrom, setStartedFrom] = useState<"start" | "stack" | "last" | null>("start");

  const input = useMemo(() => inputOf(draft), [data, extras, catalog, week, plan.slots, baseStore, goal, gymMinutes, goals, equipmentProfile, exclusions, draft, nowIso.slice(0, 16), timeZone]); // eslint-disable-line react-hooks/exhaustive-deps
  const design = useMemo(() => designStack(input), [input]);

  // A setting that lowers what can be placed lowers the total with it; raising it again never raises the total.
  useEffect(() => {
    if (draft.total !== null && design.total < draft.total) setDraft((current) => ({ ...current, total: design.total }));
  }, [design.total, draft.total]);

  /** The live region's line for a design: "14 direct moving sets a week: 11 exercises over 3 days". */
  const sayDesign = (shown: StackDesign) => `${plural(shown.total, "direct moving set")} a week: ${plural(shown.added.exercises, "exercise")} over ${plural(shown.added.days, "day")}`;
  const [pendingSay, setPendingSay] = useState(0);
  useEffect(() => {
    if (pendingSay) announce(sayDesign(design));
    // Only a committed change is said, once its design is drawn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSay]);
  const commit = (next: Draft) => { setDraft(next); setPendingSay((count) => count + 1); };
  const commitInput = (next: StackInput) => commit({ total: next.total, settings: next.settings, edits: next.edits ?? {} });

  // ---- the total: − and + commit at once; the field commits on blur, Enter or Done, and clamps then
  const { min, max, fitsTime } = design.range;
  const minNote = `The lowest is ${min}: your plan's own.`;
  const settingsAtMost = (design.settings.days === null || design.settings.days.length === plan.slots.length) && design.settings.perDay >= STACK_RULES.exercisesPerDay.max;
  const maxNote = max >= STACK_RULES.maxTotal ? `${STACK_RULES.maxTotal} is the most the stack takes.` : `These settings place at most ${max}.${settingsAtMost ? "" : ` Allow another day or more ${noun} exercises a day to place more.`}`;
  const [typed, setTyped] = useState<string | null>(null);
  const [limit, setLimit] = useState<{ at: string; text: string } | null>(null);
  const setTotal = (value: number) => {
    setStartedFrom(null);
    commit({ ...draft, total: value });
  };
  const step = (delta: 1 | -1) => {
    const next = design.total + delta;
    if (next < min || next > max) {
      const text = delta < 0 ? minNote : maxNote;
      setLimit({ at: "total", text });
      announce(text);
      return;
    }
    setLimit(null);
    setTotal(next);
  };
  const commitTyped = () => {
    if (typed === null) return;
    const value = Number.parseInt(typed, 10);
    setTyped(null);
    if (!Number.isFinite(value)) { setLimit(null); return; }
    const clamped = Math.min(max, Math.max(min, value));
    setLimit(value < min ? { at: "total", text: minNote } : value > max ? { at: "total", text: maxNote } : null);
    if (clamped !== design.total || draft.total !== clamped) setTotal(clamped);
  };
  const typedValue = typed !== null && /^\d+$/.test(typed.trim()) ? Number.parseInt(typed, 10) : null;
  // Said in place while typing, never replacing what is typed.
  const typingNote = typedValue === null ? null : typedValue < min ? minNote : typedValue > max ? maxNote : null;
  const totalNote = typingNote ?? (limit?.at === "total" ? limit.text : null);

  // ---- where focus goes after an action that removes the control that had it
  const doneRef = useRef<HTMLElement | null>(null);
  const leftRef = useRef<HTMLButtonElement | null>(null);
  const [focusOn, setFocusOn] = useState<{ on: "done" | "left"; count: number }>({ on: "done", count: 0 });
  useEffect(() => {
    if (!focusOn.count) return;
    const target = focusOn.on === "done" ? doneRef.current : leftRef.current;
    if (!target) return;
    target.focus({ preventScroll: true });
    revealClearOfBars(target);
  }, [focusOn]);
  const focusDone = () => setFocusOn((current) => ({ on: "done", count: current.count + 1 }));

  // ---- rows: one open at a time; Change opens in place
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [changeRow, setChangeRow] = useState<string | null>(null);
  /** Leave out's line, where the row was: "Thumb abduction left out · total 14 → 13 · Undo". */
  const [leftOut, setLeftOut] = useState<{ text: string; previous: Draft; dayKey: string } | null>(null);
  const leaveOut = (row: StackRow) => {
    const labels = row.movementKeys.map((key) => design.movements.find((movement) => movement.key === key)?.label ?? key);
    let next = input;
    let shown = design;
    for (const key of row.movementKeys) {
      next = leaveOutMovement(next, shown, key);
      shown = designStack(next);
    }
    setLeftOut({ text: `${listWords(labels)} left out · total ${design.total} → ${shown.total}`, previous: draft, dayKey: row.dayKey });
    setOpenRow(null);
    setChangeRow(null);
    setLimit(null);
    setStartedFrom(null);
    commitInput(next);
    setFocusOn((current) => ({ on: "left", count: current.count + 1 }));
  };
  const undoLeaveOut = () => {
    if (!leftOut) return;
    commit(leftOut.previous);
    setLeftOut(null);
  };

  // ---- settings say their effect as they change; "See each muscle" works its numbers out only while open
  const [settingsSaid, setSettingsSaid] = useState<string | null>(null);
  const [musclesOpen, setMusclesOpen] = useState(false);

  // ---- Add, Change the total, Take it out: one batch each through Home, one Undo
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storeNote, setStoreNote] = useState<string | null>(null);
  const entryIdOf = (entry: StackRecordEntry) => loadDay(store, entry.dayKey).workout.find((exercise) => catalogIdOf(exercise) === entry.catalogExerciseId)?.id ?? null;
  const removalsOf = (list: readonly StackRecordEntry[]): SpecializationPlanBatchChange[] => list.flatMap((entry) => {
    const entryId = entryIdOf(entry);
    return entryId === null ? [] : [{ kind: "remove" as const, dayKey: entry.dayKey, entryId, catalogExerciseId: entry.catalogExerciseId, prescription: entry.prescription }];
  });
  const pageCountOn = (weekStore: WeeklyDayStore) => directWorkCount(data, plannedSummaryFor(input, weekStore)).moving;

  const add = async () => {
    if (busy || !onApplyPlanChanges || !design.changes.length) return;
    setBusy(true);
    setError(null);
    const replaced = changing && record ? record : null;
    const removals = replaced && entries ? removalsOf(entries.asWritten) : [];
    const adds: SpecializationPlanBatchChange[] = design.changes.map((change) => ({ kind: "add", dayKey: change.dayKey, catalogExerciseId: change.catalogExerciseId, prescription: change.prescription }));
    const createdAt = new Date().toISOString();
    const next = stackRecordFrom(design, `stack-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, createdAt, draft.settings);
    // Either Undo (the card's or the notice's) forgets this stack and keeps the one it replaced.
    const result = await onApplyPlanChanges({ week, changes: [...removals, ...adds] }, {
      onUndo: () => {
        removeStackRecord(next.id, accountId);
        if (replaced) saveStackRecord(replaced, accountId);
      },
    });
    setBusy(false);
    if (!result.ok) { setError(result.reason); return; }
    const kept = stacks.saveStack(next);
    stacks.saveChoice({ regionId, total: design.total, settings: draft.settings, updatedAt: createdAt });
    setStoreNote(kept.ok ? null : "This device did not keep a note of the stack, so the card cannot take it out for you later. Your plan has it all the same.");
    const sets = design.added.movingSets;
    const text = replaced
      ? `Changed your stack in Plan Week ${week}: ${replaced.total} → ${design.total} direct moving sets`
      : `Added ${plural(sets, "set")} to Plan Week ${week}`;
    setDone({ kind: replaced ? "changed" : "added", text, detail: `The page now shows ${plural(design.counts.after.moving, "direct moving set")} for Plan Week ${week}.`, undo: result.undo });
    setView("auto");
    setLeftOut(null);
    announce(`${text}. ${result.message}.`);
    focusDone();
  };
  const takeOut = async () => {
    if (busy || !onApplyPlanChanges || !record || !entries) return;
    const removals = removalsOf(entries.asWritten);
    if (!removals.length) return;
    setBusy(true);
    setError(null);
    const removed = record;
    const result = await onApplyPlanChanges({ week, changes: removals }, { onUndo: () => { saveStackRecord(removed, accountId); } });
    setBusy(false);
    if (!result.ok) { setError(result.reason); return; }
    stacks.remove(removed.id);
    const text = `Took your stack out of Plan Week ${week}`;
    setDone({ kind: "removed", text, detail: `The page now shows ${plural(pageCountOn(storeWithoutEntries(store, entries.asWritten)), "direct moving set")} for Plan Week ${week}.`, undo: result.undo });
    setView("auto");
    announce(`${text}. ${result.message}.`);
    focusDone();
  };
  const undoDone = () => {
    if (!done || done.kind === "undone") return;
    done.undo();
    setDone({ kind: "undone", text: `Undone: Plan Week ${week} is as it was.` });
    announce(`Undone: Plan Week ${week} is as it was.`);
    focusDone();
  };
  const startDesign = (from: "stack" | "last") => {
    const settings = from === "stack" && record ? record.settings : lastChoice?.settings ?? draft.settings;
    const total = from === "stack" && record ? record.total : lastChoice?.total ?? null;
    setDraft({ total, settings, edits: {} });
    setStartedFrom(total === null ? "start" : from);
    setLimit(null);
    setLeftOut(null);
    setDone(null);
    setView("design");
  };

  // ---------------------------------------------------------------- views

  const completedNote = mode === "completed" ? <p className="spz-note">Built from your plan as written; sets you logged are not counted here.</p> : null;
  const doneLine = done && <p className="spz-inline-status spz-stack-done" role="status" ref={done.kind === "undone" ? (element) => { doneRef.current = element; } : undefined} tabIndex={done.kind === "undone" ? -1 : undefined}>
    <span id={`${ids}-done`}>{done.text}</span>
    {done.kind !== "undone" && <button ref={(element) => { doneRef.current = element; }} type="button" className="spz-link spz-link-box" aria-describedby={`${ids}-done`} onClick={undoDone}>Undo</button>}
  </p>;
  const doneDetail = done && done.kind !== "undone" ? <p className="spz-note">{done.detail}</p> : null;

  if (showing === "elsewhere" && elsewhere) {
    return <div className="spz-stack-body">
      {completedNote}
      {doneLine}
      <p className="spz-inline-status"><span>Your stack is in Week {elsewhere.planWeek}, not Week {week}</span><button type="button" className="spz-button" onClick={() => startDesign("last")}>Design for Week {week}</button></p>
    </div>;
  }

  if (showing === "added") {
    const current = record && entries ? entries : null;
    const asWritten = current?.asWritten ?? [];
    const nameOf = (catalogExerciseId: number) => catalog.find((exercise) => exercise.id === catalogExerciseId)?.name ?? `Exercise ${catalogExerciseId}`;
    const dayOf = (dayKey: string) => plan.slots.find((slot) => slot.key === dayKey)?.label ?? dayKey;
    const byDay = plan.slots.map((slot) => ({ slot, items: asWritten.filter((entry) => entry.dayKey === slot.key) })).filter((group) => group.items.length);
    return <div className="spz-stack-body">
      {completedNote}
      {doneLine}
      {doneDetail}
      <p className="spz-stack-status"><b>Your stack: {plural(pageCountOn(store), "direct moving set")} in Week {week}</b></p>
      {byDay.length > 0 && <ul className="spz-stack-entries">
        {byDay.map((group) => <li key={group.slot.key}><b>{group.slot.label}</b><span>{group.items.map((entry) => `${nameOf(entry.catalogExerciseId)} ${entry.prescription}`).join(" · ")}</span></li>)}
      </ul>}
      {current && current.changed.length > 0 && <p className="spz-note">Changed since the stack added {current.changed.length === 1 ? "it" : "them"}, so counted as your plan's own: {listWords(current.changed.map((entry) => `${nameOf(entry.catalogExerciseId)} (${dayOf(entry.dayKey)})`))}.</p>}
      {current && current.missing.length > 0 && <p className="spz-note">No longer in your plan: {listWords(current.missing.map((entry) => `${nameOf(entry.catalogExerciseId)} (${dayOf(entry.dayKey)})`))}.</p>}
      {storeNote && <p className="spz-note">{storeNote}</p>}
      {error && <p className="spz-error" role="alert">{error}</p>}
      {current && <div className="spz-actions">
        <button type="button" className="spz-button" onClick={() => startDesign("stack")}>Change the total</button>
        {asWritten.length > 0 && onApplyPlanChanges && <button type="button" className="spz-button" aria-busy={busy || undefined} onClick={() => { void takeOut(); }}>Take it out</button>}
      </div>}
      {current && !asWritten.length && <p className="spz-note">Every entry of the stack has changed since it was added, so they are your plan's own and stay as they are.</p>}
    </div>;
  }

  // ---- the design
  const before = design.counts.before;
  const after = design.counts.after;
  const overDays = design.days.filter((day) => day.changed && day.overWindow);
  const changedDays = design.days.filter((day) => day.changed);
  const holdSecondsAdded = after.holds.seconds - before.holds.seconds;
  const rowsByDay = design.days.map((day) => ({ day, rows: design.rows.filter((row) => row.dayKey === day.dayKey) })).filter((group) => group.rows.length || leftOut?.dayKey === group.day.dayKey);
  const movementLabel = (key: string) => design.movements.find((movement) => movement.key === key)?.label ?? key;
  const startSentence = startedFrom === "stack" ? `It starts at your stack's ${design.total}. No number suits everyone; change it any time.`
    : startedFrom === "last" ? `It starts at ${design.total}, your last total here. No number suits everyone; change it any time.`
    : startedFrom === "start" ? startWords(design, noun) : null;

  const addLabel = changing
    ? `Replace your stack: ${plural(design.added.movingSets, "set")}${design.added.holdSets ? ` and ${plural(design.added.holdSets, "hold")}` : ""} (${plural(design.added.exercises, "exercise")}, ${plural(design.added.days, "day")}) in Week ${week}`
    : `Add ${plural(design.added.movingSets, "set")}${design.added.holdSets ? ` and ${plural(design.added.holdSets, "hold")}` : ""} (${plural(design.added.exercises, "exercise")}, ${plural(design.added.days, "day")}) to Week ${week}`;
  const nothingToAdd = design.total <= design.own && !design.added.holdSets
    ? `Your plan already has ${design.own}. The stack never removes your own exercises.`
    : "Nothing to add at these settings.";

  return <div className="spz-stack-body">
    {completedNote}
    {doneLine}
    <p className="spz-stack-lede">Pick a weekly number; the app chooses the exercises and puts them on your plan days.</p>
    {changing && <p className="spz-note">Designing again on Plan Week {week} as it is without your stack. Adding replaces the stack's own entries; anything you changed stays.</p>}

    <div className="spz-stack-total" role="group" aria-labelledby={`${ids}-label`}>
      <label id={`${ids}-label`} htmlFor={`${ids}-total`}>Direct {noun} sets a week</label>
      <div className="spz-stack-stepper">
        <button type="button" className="spz-icon-button" aria-label="One set fewer" aria-disabled={design.total <= min || undefined} aria-describedby={totalNote ? `${ids}-limit` : undefined} onClick={() => step(-1)}><Minus className="h-5 w-5" aria-hidden="true" /></button>
        <input
          id={`${ids}-total`}
          className="spz-stack-number"
          type="number"
          inputMode="numeric"
          enterKeyHint="done"
          min={min}
          max={max}
          step={1}
          value={typed ?? String(design.total)}
          aria-describedby={`${ids}-range${totalNote ? ` ${ids}-limit` : ""}`}
          onChange={(event) => setTyped(event.target.value)}
          onBlur={commitTyped}
          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter") { event.preventDefault(); commitTyped(); }
            if (event.key === "Escape") { setTyped(null); }
          }}
        />
        <button type="button" className="spz-icon-button" aria-label="One set more" aria-disabled={design.total >= max || undefined} aria-describedby={totalNote ? `${ids}-limit` : undefined} onClick={() => step(1)}><Plus className="h-5 w-5" aria-hidden="true" /></button>
      </div>
      <p id={`${ids}-range`} className="spz-note">From {min} (your plan's own) to {max} · {fitsTime >= max ? "all fit your gym time" : `about ${Math.max(min, fitsTime)} fit your gym time`}</p>
      {totalNote && <p id={`${ids}-limit`} className="spz-stack-limit">{totalNote}</p>}
      {startSentence && <p className="spz-note">{startSentence}</p>}
    </div>

    <div className="spz-stack-changes" aria-label="What changes">
      <p><b>What changes</b></p>
      <p>Direct moving sets {before.moving} → {after.moving} · muscles with direct work {before.musclesWithMovingWork.length} → {after.musclesWithMovingWork.length} of {after.ownTargetMuscles}</p>
      {design.added.holdSets > 0 && <p>Holds: + {design.added.holdSets}{holdSecondsAdded > 0 ? ` (${holdSecondsAdded} s)` : ""}, not part of the total</p>}
      {overDays.length > 0 && <p>{plural(overDays.length, "day")} over your gym time</p>}
    </div>

    {error && <p className="spz-error" role="alert">{error}</p>}
    {design.changes.length > 0 && onApplyPlanChanges
      ? <button type="button" className="spz-primary spz-stack-add" aria-busy={busy || undefined} onClick={() => { void add(); }}>{addLabel}</button>
      : <p className="spz-note">{design.changes.length ? "Adding to the plan is not available here." : nothingToAdd}</p>}
    <p className="spz-note">Your own exercises and their sets stay as they are.</p>
    {changing && <button type="button" className="spz-button" onClick={() => { setView("auto"); setError(null); }}>Keep your stack as it is</button>}

    {changedDays.length > 0 && <ul className="spz-stack-daylines" aria-label="The days it changes">
      {changedDays.map((day) => <li key={day.dayKey}>
        <p>{day.label}: +{day.addedSets} · {day.exercisesBefore} → {day.exercisesAfter} exercises · about {Math.round(day.minutesAfter)} of your {day.gymMinutes} min{words.paired && day.secondSideMinutes > 0 ? `, plus about ${day.secondSideMinutes} min for the second ${words.one} on one-${words.one} sets` : ""}</p>
        {day.planPromptsAdded.map((prompt) => <p key={prompt} className="spz-note">Plan, about {day.label}: “{prompt}”</p>)}
      </li>)}
    </ul>}

    {rowsByDay.length > 0 && <section className="spz-stack-days" aria-labelledby={`${ids}-days`}>
      <h3 id={`${ids}-days`} className="spz-stack-heading">The stack, by day</h3>
      {rowsByDay.map(({ day, rows }) => <div key={day.dayKey} className="spz-stack-day">
        <h4>{day.label}</h4>
        {leftOut?.dayKey === day.dayKey && <p className="spz-inline-status" role="status">
          <span id={`${ids}-left`}>{leftOut.text}</span>
          <button ref={leftRef} type="button" className="spz-link spz-link-box" aria-describedby={`${ids}-left`} onClick={undoLeaveOut}>Undo</button>
        </p>}
        {rows.length > 0 && <ul className="spz-stack-rows">
          {rows.map((row) => <StackRowItem
            key={row.key}
            row={row}
            design={design}
            input={input}
            words={words}
            open={openRow === row.key}
            changing={changeRow === row.key}
            limit={limit?.at === `row:${row.key}` ? limit.text : null}
            nodeName={nodeName}
            movementLabel={movementLabel}
            variantNotes={data.variants.find((variant) => variant.id === row.variantId)?.notes ?? null}
            onToggle={() => { setOpenRow(openRow === row.key ? null : row.key); setChangeRow(null); setLimit(null); }}
            onToggleChange={() => setChangeRow(changeRow === row.key ? null : row.key)}
            onSets={(sets) => {
              if (sets < STACK_RULES.smallestEntry || sets > STACK_RULES.maxSetsPerSession) {
                const text = sets < STACK_RULES.smallestEntry ? `${STACK_RULES.smallestEntry} is the fewest; use Leave out.` : `${STACK_RULES.maxSetsPerSession} is the most in one session.`;
                setLimit({ at: `row:${row.key}`, text });
                announce(text);
                return;
              }
              setLimit(null);
              setStartedFrom(null);
              commitInput(setRowSets(input, design, row.key, sets));
            }}
            onMove={(dayKey) => { setChangeRow(null); commitInput(moveRow(input, row.key, dayKey)); }}
            onChoose={(movementKey, catalogExerciseId) => { setChangeRow(null); setOpenRow(null); commitInput(chooseExercise(input, movementKey, catalogExerciseId)); }}
            onLeaveOut={() => leaveOut(row)}
          />)}
        </ul>}
      </div>)}
    </section>}

    <StackSettingsPanel design={design} slots={plan.slots} noun={noun} onChange={(settings, what) => { setLimit(null); commit({ ...draft, settings }); setSettingsSaid(what); }} />
    {settingsSaid && <p className="spz-note" role="status">{settingsSaid}: {settingsEffect(design)}</p>}

    <details className="spz-disclosure spz-stack-more" onToggle={(event) => setMusclesOpen(event.currentTarget.open)}>
      <summary><span><b>See each muscle</b><small>Planned before and after, Week {week}</small></span><ChevronDown className="h-4 w-4" aria-hidden="true" /></summary>
      {musclesOpen && <MuscleChanges data={data} input={input} design={design} baseStore={baseStore} />}
    </details>

    <NotInThisStack data={data} design={design} noun={noun} nodeName={nodeName} catalog={catalog} onBringBack={(key) => { setLeftOut(null); setStartedFrom(null); commitInput(bringBackMovement(input, key)); }} />

    {aboutMeArea && <p className="spz-note spz-stack-about">Your answer in About me for the {data.region.label.toLowerCase()}: “{aboutMeArea.answer}”. You can start lower or leave movements out.</p>}

    <details className="spz-disclosure spz-stack-more">
      <summary><span><b>How the stack is built</b><small>Its rules, and the starting ranges</small></span><ChevronDown className="h-4 w-4" aria-hidden="true" /></summary>
      <HowItIsBuilt extras={extras} words={words} noun={noun} />
    </details>
  </div>;
}

// ---------------------------------------------------------------- the words built from a design's numbers

/**
 * The starting sentence (§3.3), from its numbers: "It starts at 14: your plan's 3, and one set for
 * each of the 11 movements your plan does not train directly yet. No number suits everyone; change
 * it any time."
 */
export function startWords(design: StackDesign, noun: string): string {
  const { start, own } = design;
  const parts = [`your plan's ${own}`];
  if (start.targetSets) parts.push(`${start.targetSets} for your targets`);
  const reach = start.movementsReachable;
  const fit = start.movementsFit;
  if (reach && fit < reach) parts.push(`one set for ${fit} of the ${plural(reach, "movement")} your plan does not train directly yet; ${reach - fit === 1 ? "one does" : `${reach - fit} do`} not fit at ${design.settings.perDay} ${noun} exercises a day`);
  else if (reach) parts.push(`one set for ${reach === 1 ? "the one movement" : `each of the ${reach} movements`} your plan does not train directly yet`);
  const head = parts.length === 1 ? `${parts[0]} own` : `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
  const time = start.cappedByTime ? ", as far as your gym time allows" : "";
  const none = !reach && !start.targetSets ? " Your plan already gives every movement the stack can reach direct work." : "";
  return `It starts at ${start.value}: ${head}${time}.${none} No number suits everyone; change it any time.`;
}

/** What a settings change did: the most the settings place, and the total's exercises and days now. */
function settingsEffect(design: StackDesign): string {
  return `these settings place at most ${design.range.max}; ${plural(design.total, "direct moving set")} now, ${plural(design.added.exercises, "exercise")} over ${plural(design.added.days, "day")}${design.added.holdSets ? `, and ${plural(design.added.holdSets, "hold")} apart` : ""}.`;
}

// ---------------------------------------------------------------- one row of the stack

function StackRowItem({ row, design, input, words, open, changing, limit, nodeName, movementLabel, variantNotes, onToggle, onToggleChange, onSets, onMove, onChoose, onLeaveOut }: {
  row: StackRow;
  design: StackDesign;
  input: StackInput;
  words: ReturnType<typeof sideWordsFor>;
  open: boolean;
  changing: boolean;
  limit: string | null;
  nodeName: (nodeId: string) => string;
  movementLabel: (key: string) => string;
  variantNotes: string | null;
  onToggle: () => void;
  onToggleChange: () => void;
  onSets: (sets: number) => void;
  onMove: (dayKey: string) => void;
  onChoose: (movementKey: string, catalogExerciseId: number) => void;
  onLeaveOut: () => void;
}) {
  const ids = useId();
  const label = `${row.name} · ${row.prescription}${row.oneSided && words.paired ? ` · each ${words.one}` : ""}`;
  // The muscles it gives direct work to, in the region's order; a group the evidence does not split is said as one.
  const groups = row.sharedNodeIds.filter((group) => group.every((id) => row.directNodeIds.includes(id)));
  const said = new Set<string>();
  const direct: string[] = [];
  for (const nodeId of row.directNodeIds) {
    if (said.has(nodeId)) continue;
    const group = groups.find((item) => item.includes(nodeId));
    if (group) { group.forEach((id) => said.add(id)); direct.push(`${listWords(group.map(nodeName))} (shared; the evidence does not split it)`); }
    else { said.add(nodeId); direct.push(nodeName(nodeId)); }
  }
  const targetLine = (goalId: string) => {
    const target = design.targets.find((item) => item.goalId === goalId);
    return target ? `Toward your target for ${targetSubject(target, nodeName, input)}: ${target.after}${metricUnit[target.metric]} of ${target.target}${metricUnit[target.metric]}.` : null;
  };
  const reasons = row.reasons.flatMap((reason) => {
    if (reason.kind === "movement") return [`None in your plan this week (${listWords(reason.movementKeys.map((key) => lowerFirst(movementLabel(key))))}).`];
    if (reason.kind === "target") return reason.goalIds.map(targetLine).filter((line): line is string => line !== null);
    if (reason.kind === "more_sets") return ["More sets: the rest of your number, spread evenly over the stack's exercises."];
    if (reason.kind === "coverage_only") return ["One set: these drills are for coverage, not volume. Raise it here if you want more."];
    return ["Its sets are yours, set here."];
  });
  const exerciseDays = new Set(design.rows.filter((other) => other.catalogExerciseId === row.catalogExerciseId).map((other) => other.dayKey)).size;
  const leaveLabel = row.movementKeys.length
    ? exerciseDays > 1 ? `Leave out ${listWords(row.movementKeys.map((key) => lowerFirst(movementLabel(key))))} (${exerciseDays} days)` : "Leave out"
    : null;
  const movement: StackMovementState | undefined = design.movements.find((item) => row.movementKeys.includes(item.key));
  const dayChoices = changing ? dayChoicesFor(input, design, row.key) : [];
  const exerciseChoices = movement?.choices ?? [];
  return <li className="spz-stack-row-item">
    <button type="button" className="spz-stack-row" aria-expanded={open} aria-controls={`${ids}-detail`} onClick={onToggle}>
      <span>{label}</span>
      <ChevronDown className="h-4 w-4" aria-hidden="true" />
    </button>
    {open && <div id={`${ids}-detail`} className="spz-stack-row-detail">
      {direct.length > 0 && <p>Direct work for {listWords(direct)}</p>}
      {reasons.map((line) => <p key={line} className="spz-note">{line}</p>)}
      <p className="spz-note">{row.equipment}{variantNotes ? ` · ${variantNotes}` : ""}</p>
      <p className="spz-note">{row.profile
        ? `The app's starting range for ${lowerFirst(row.profile.label)} work, not a tested one${row.profile.strengthWithheld ? "; it keeps that range under Max strength too" : ""}.`
        : "No starting range for this exercise: it takes the plan's default for its place in the day."}</p>
      <p className="spz-stack-legend" id={`${ids}-sets`}>Sets this session</p>
      <div className="spz-stack-controls">
        <span className="spz-stack-sets" role="group" aria-labelledby={`${ids}-sets`}>
          <button type="button" className="spz-icon-button" aria-label={`One set fewer: ${row.name}, ${row.dayLabel}`} aria-disabled={row.sets <= STACK_RULES.smallestEntry || undefined} aria-describedby={limit ? `${ids}-limit` : undefined} onClick={() => onSets(row.sets - 1)}><Minus className="h-5 w-5" aria-hidden="true" /></button>
          <span className="spz-stack-value">{row.sets}</span>
          <button type="button" className="spz-icon-button" aria-label={`One set more: ${row.name}, ${row.dayLabel}`} aria-disabled={row.sets >= STACK_RULES.maxSetsPerSession || undefined} aria-describedby={limit ? `${ids}-limit` : undefined} onClick={() => onSets(row.sets + 1)}><Plus className="h-5 w-5" aria-hidden="true" /></button>
        </span>
        <button type="button" className="spz-button" aria-expanded={changing} aria-controls={`${ids}-change`} onClick={onToggleChange}>Change</button>
        {leaveLabel && <button type="button" className="spz-button" onClick={onLeaveOut}>{leaveLabel}</button>}
      </div>
      {limit && <p id={`${ids}-limit`} className="spz-stack-limit">{limit}</p>}
      {!leaveLabel && <p className="spz-note">It is here for your target: lower its sets or the total to take it out.</p>}
      {changing && <div id={`${ids}-change`} className="spz-stack-change">
        <p className="spz-stack-legend">Day</p>
        <div className="spz-chips">
          {dayChoices.map((choice) => <button key={choice.dayKey} type="button" className="spz-chip" aria-pressed={choice.current} onClick={() => { if (!choice.current) onMove(choice.dayKey); }}>{choice.label}</button>)}
        </div>
        {dayChoices.length <= 1 && <p className="spz-note">No other allowed day has room for it at these settings.</p>}
        <p className="spz-stack-legend">Exercise</p>
        {movement && exerciseChoices.length > 1
          ? <div className="spz-chips">
            {exerciseChoices.map((choice) => <button key={choice.catalogExerciseId} type="button" className="spz-chip" aria-pressed={choice.catalogExerciseId === row.catalogExerciseId} onClick={() => { if (choice.catalogExerciseId !== row.catalogExerciseId) onChoose(movement.key, choice.catalogExerciseId); }}><span>{choice.name}</span><small>{choice.equipment}</small></button>)}
          </div>
          : <p className="spz-note">{row.name} is the only reviewed exercise for {movement ? lowerFirst(movement.label) : "this"} that your equipment and choices allow.</p>}
      </div>}
    </div>}
  </li>;
}

/** A target's subject in a sentence: its muscle, or its movement. */
function targetSubject(target: Pick<StackTarget, "nodeId" | "actionId">, nodeName: (nodeId: string) => string, input: StackInput): string {
  if (target.nodeId) return nodeName(target.nodeId);
  const action = input.region.actions.find((item) => item.id === target.actionId);
  return action ? lowerFirst(action.label) : "a movement";
}

// ---------------------------------------------------------------- Settings

function StackSettingsPanel({ design, slots, noun, onChange }: { design: StackDesign; slots: readonly DaySlot[]; noun: string; onChange: (settings: StackSettings, what: string) => void }) {
  const ids = useId();
  const settings = design.settings;
  const allowed = settings.days ?? slots.map((slot) => slot.key);
  const [note, setNote] = useState<string | null>(null);
  const base: StackSettings = { days: settings.days, perDay: settings.perDay, holds: settings.holds };
  const toggleDay = (slot: DaySlot) => {
    const on = allowed.includes(slot.key);
    if (on && allowed.length === 1) { setNote("Keep at least one day: the stack needs somewhere to go."); return; }
    const next = slots.map((item) => item.key).filter((key) => (key === slot.key ? !on : allowed.includes(key)));
    setNote(null);
    onChange({ ...base, days: next.length === slots.length ? null : next }, `${slot.label} ${on ? "left out" : "allowed"}`);
  };
  const { min, max } = STACK_RULES.exercisesPerDay;
  const perDay = (delta: 1 | -1) => {
    const value = settings.perDay + delta;
    if (value < min || value > max) { setNote(value < min ? `${min} a day is the fewest.` : `${max} a day is the most.`); return; }
    setNote(null);
    onChange({ ...base, perDay: value }, `${value} ${noun} exercises a day`);
  };
  const holds = (on: boolean) => {
    if (on === settings.holdsOn && settings.holds !== null) return;
    setNote(null);
    onChange({ ...base, holds: on }, on ? "Holds on" : "Holds off");
  };
  const days = allowed.length;
  return <details className="spz-disclosure spz-stack-more spz-stack-settings">
    <summary><span><b>Settings</b><small>{plural(days, "day")} · {settings.perDay} {noun} exercises a day · holds {settings.holdsOn ? "on" : "off"}</small></span><ChevronDown className="h-4 w-4" aria-hidden="true" /></summary>
    <div className="spz-stack-settings-body">
      <p className="spz-stack-legend" id={`${ids}-days`}>Days</p>
      <div className="spz-chips" role="group" aria-labelledby={`${ids}-days`}>
        {slots.map((slot) => <button key={slot.key} type="button" className="spz-chip" aria-pressed={allowed.includes(slot.key)} aria-disabled={(allowed.includes(slot.key) && allowed.length === 1) || undefined} onClick={() => toggleDay(slot)}>{slot.label}</button>)}
      </div>
      <p className="spz-stack-legend" id={`${ids}-per-day`}>{noun.charAt(0).toUpperCase() + noun.slice(1)} exercises a day</p>
      <div className="spz-stack-stepper" role="group" aria-labelledby={`${ids}-per-day`}>
        <button type="button" className="spz-icon-button" aria-label={`One fewer ${noun} exercise a day`} aria-disabled={settings.perDay <= min || undefined} onClick={() => perDay(-1)}><Minus className="h-5 w-5" aria-hidden="true" /></button>
        <span className="spz-stack-value">{settings.perDay}</span>
        <button type="button" className="spz-icon-button" aria-label={`One more ${noun} exercise a day`} aria-disabled={settings.perDay >= max || undefined} onClick={() => perDay(1)}><Plus className="h-5 w-5" aria-hidden="true" /></button>
      </div>
      <p className="spz-note">Your plan's own {noun} exercises with direct work count among them.</p>
      <p className="spz-stack-legend" id={`${ids}-holds`}>Holds</p>
      <div className="spz-segment" role="group" aria-labelledby={`${ids}-holds`}>
        <button type="button" aria-pressed={!settings.holdsOn} onClick={() => holds(false)}>Off</button>
        <button type="button" aria-pressed={settings.holdsOn} onClick={() => holds(true)}>On</button>
      </div>
      <p className="spz-note">{settings.holdsByTarget ? "On by itself: you have a hold target here. " : ""}Holds are counted apart, never in the total.</p>
      {note && <p className="spz-stack-limit" role="status">{note}</p>}
    </div>
  </details>;
}

// ---------------------------------------------------------------- See each muscle

function MuscleChanges({ data, input, design, baseStore }: { data: SpecializationRegionData; input: StackInput; design: StackDesign; baseStore: WeeklyDayStore }) {
  const beforeSummary = plannedSummaryFor(input, baseStore);
  const afterSummary = plannedSummaryFor(input, design.storeAfter);
  const describe = (node: NodeExposure | undefined) => {
    if (!node) return "none";
    return [
      node.directDynamicBouts ? `${node.directDynamicBouts} direct` : "",
      node.contributingDynamicBouts ? `${node.contributingDynamicBouts} helper` : "",
      node.deliberateHoldBouts ? `${plural(node.deliberateHoldBouts, "hold")} (${holdTime(node.deliberateHoldSeconds)})` : "",
      node.incidentalBouts ? `${node.incidentalBouts} incidental` : "",
      node.mixedBouts ? `${node.mixedBouts} mixed` : "",
    ].filter(Boolean).join(" · ") || "none";
  };
  const beforeOf = new Map(beforeSummary.nodes.map((node) => [node.nodeId, node] as const));
  const afterOf = new Map(afterSummary.nodes.map((node) => [node.nodeId, node] as const));
  const shown = data.nodes.filter((node) => node.role === "target" || describe(beforeOf.get(node.id)) !== describe(afterOf.get(node.id)));
  const targets = design.targets.filter((target) => target.status !== "other_region");
  const nodeName = (nodeId: string) => lowerFirst(data.nodes.find((node) => node.id === nodeId)?.name ?? nodeId);
  return <div className="spz-stack-muscles">
    <p className="spz-note">Planned totals only, as the rest of this page counts them; what you logged stays as it is. Direct, helper, hold and incidental work are counted apart.</p>
    <ul className="spz-preview-list">
      {shown.map((node) => {
        const was = describe(beforeOf.get(node.id));
        const now = describe(afterOf.get(node.id));
        return <li key={node.id} data-focus={was !== now || undefined}><b>{node.name}</b><span>{was === now ? `${now} · no change` : <>{was} <ArrowRight className="h-3.5 w-3.5" aria-label="becomes" /> {now}</>}</span></li>;
      })}
    </ul>
    {targets.length > 0 && <>
      <p className="spz-stack-legend">Your targets after</p>
      <ul className="spz-caveats">{targets.map((target) => {
        const subject = targetSubject(target, nodeName, input);
        return <li key={target.goalId}>{subject.charAt(0).toUpperCase() + subject.slice(1)}: {target.after}{metricUnit[target.metric]} of your {target.target}{metricUnit[target.metric]}</li>;
      })}</ul>
    </>}
  </div>;
}

// ---------------------------------------------------------------- Not in this stack (§3.11)

function NotInThisStack({ data, design, noun, nodeName, catalog, onBringBack }: { data: SpecializationRegionData; design: StackDesign; noun: string; nodeName: (nodeId: string) => string; catalog: readonly Exercise[]; onBringBack: (movementKey: string) => void }) {
  const label = (key: string) => lowerFirst(design.movements.find((movement) => movement.key === key)?.label ?? key);
  const nameOf = (catalogExerciseId: number) => catalog.find((exercise) => exercise.id === catalogExerciseId)?.name ?? `Exercise ${catalogExerciseId}`;
  const days = design.settings.days?.length ?? design.days.length;
  const items: { key: string; node: ReactNode }[] = [];

  for (const movement of design.movements.filter((item) => item.status === "left_out")) {
    items.push({ key: `left:${movement.key}`, node: <><span>{movement.label}: left out by you.</span>
      <button type="button" className="spz-link spz-link-box" aria-label={`Bring back ${movement.label}`} onClick={() => onBringBack(movement.key)}>Bring back</button>
    </> });
  }
  const { byTotal, byRoom, holdsNoRoom } = design.cut;
  if (byTotal.movementKeys.length) items.push({ key: "total", node: <span>Left out at this total: {listWords(byTotal.movementKeys.map(label))}. Raise the total by {byTotal.raiseBy} to reach {byTotal.movementKeys.length === 1 ? "it" : "them"}.</span> });
  if (byRoom.movementKeys.length) items.push({ key: "room", node: <span>With {plural(days, "day")} and {design.settings.perDay} {noun} exercises a day, {plural(byRoom.movementKeys.length, "movement")} {byRoom.movementKeys.length === 1 ? "does" : "do"} not fit ({listWords(byRoom.movementKeys.map(label))}). {byRoom.perDayToFit ? `Allow ${byRoom.perDayToFit} a day to reach ${byRoom.movementKeys.length === 1 ? "it" : "them"}.` : "Allow another day to reach them."}</span> });
  if (holdsNoRoom.catalogExerciseIds.length) items.push({ key: "holds", node: <span>Holds: no room at {design.settings.perDay} {noun} exercises a day. {holdsNoRoom.perDayToFit ? `Allow ${holdsNoRoom.perDayToFit} a day to add ${listWords(holdsNoRoom.catalogExerciseIds.map(nameOf))}.` : "Allow another day to add them."}</span> });
  const movingOpen = design.movements.filter((movement) => movement.mode === "moving" && movement.status !== "in_plan");
  const noMoving = movingOpen.length > 0 && movingOpen.every((movement) => movement.status === "not_usable");
  if (noMoving) items.push({ key: "none", node: <span>No moving {noun} exercise fits your equipment.{design.settings.holdsOn ? "" : " Turn on Holds in Settings to add a hold."}</span> });
  for (const movement of design.movements.filter((item) => item.status === "not_usable" && item.unusable.length)) {
    const why = movement.unusable.map((item) => (item.why === "equipment" ? `${item.name} needs ${item.equipment.toLowerCase()} (not in your equipment)` : item.why === "excluded_exercise" ? `${item.name}: you chose Not for me` : `${item.name}: you left ${item.equipment.toLowerCase()} out of suggestions`));
    items.push({ key: `unusable:${movement.key}`, node: <span>{movement.label}: {why.join("; ")}.</span> });
  }
  if (design.gaps.length) {
    const helpers = Array.from(new Set(design.gaps.flatMap((gap) => gap.helpers.map((helper) => nameOf(helper.catalogExerciseId)))));
    const gapWords = design.gaps.map((gap) => `${nodeName(gap.nodeId)} (${lowerFirst(actionWords(data, gap.actionId))})`);
    items.push({ key: "gaps", node: <span>No reviewed exercise trains these directly, so the stack cannot give them direct sets: {listWords(gapWords)}.{helpers.length ? ` ${listWords(helpers.length > 3 ? [...helpers.slice(0, 3), `${helpers.length - 3} more`] : helpers)} work them as helpers.` : ""}</span> });
  }
  for (const target of design.targets) {
    const unit = metricUnit[target.metric];
    const subject = `your target for ${targetLabel(target, nodeName, data)}`;
    if (target.status === "no_reviewed_exercise") items.push({ key: `t:${target.goalId}`, node: <span>No reviewed exercise counts toward {subject} ({target.target}{unit}).</span> });
    else if (target.status === "not_usable") items.push({ key: `t:${target.goalId}`, node: <span>No reviewed exercise for {subject} fits your equipment and choices.</span> });
    else if (target.status === "left_out") items.push({ key: `t:${target.goalId}`, node: <span>The movement for {subject} is left out of this design.</span> });
    else if (target.status === "holds_off") items.push({ key: `t:${target.goalId}`, node: <span>{subject.charAt(0).toUpperCase() + subject.slice(1)} is in holds: turn on Holds in Settings to fill it.</span> });
    else if (target.status === "short") items.push({ key: `t:${target.goalId}`, node: <span>Toward {subject} of {target.target}{unit}: these settings place {target.after - target.before}{unit}; {target.target - target.after}{unit} short.</span> });
  }
  if (design.cut.unplaced.length) items.push({ key: "unplaced", node: <span>{plural(design.cut.unplaced.length, "session")} found no allowed day with room. Allow another day or more {noun} exercises a day.</span> });
  if (!items.length) return null;
  return <section className="spz-stack-out" aria-labelledby="spz-stack-out">
    <h3 id="spz-stack-out" className="spz-stack-heading">Not in this stack</h3>
    <ul>{items.map((item) => <li key={item.key} className="spz-inline-status">{item.node}</li>)}</ul>
  </section>;
}

/** A joint action in the region's own words. */
const actionWords = (data: SpecializationRegionData, actionId: string) => data.actions.find((action) => action.id === actionId)?.label ?? actionId;
function targetLabel(target: StackTarget, nodeName: (nodeId: string) => string, data: SpecializationRegionData): string {
  if (target.nodeId) return nodeName(target.nodeId);
  return target.actionId ? lowerFirst(actionWords(data, target.actionId)) : "a movement";
}

// ---------------------------------------------------------------- How the stack is built

function HowItIsBuilt({ extras, words, noun }: { extras: RegionExtras | null; words: ReturnType<typeof sideWordsFor>; noun: string }) {
  const order = (extras?.repProfiles ?? []).filter((profile) => profile.measure === "reps").map((profile) => lowerFirst(profile.label));
  const hold = (extras?.repProfiles ?? []).find((profile) => profile.measure === "seconds");
  const cited = new Set([...(extras?.repGuidanceCitations?.general ?? []), ...(extras?.repGuidanceCitations?.effort ?? []), ...(hold ? extras?.repGuidanceCitations?.holds ?? [] : [])]);
  const sources = (extras?.referenceSources ?? []).filter((source) => cited.has(source.id));
  const restSeconds = Math.round(STACK_RULES.restMinutes * 60);
  return <div className="spz-method">
    <p>The stack fills your own unmet targets first, then gives every movement your plan does not train directly one set, then spreads the rest of your number evenly over its exercises, one set at a time to the exercise with the fewest. No muscle is given a number of its own, and drills for coverage keep one set unless you raise them.</p>
    <p>It uses reviewed exercises only, those your equipment and your choices allow: the fewest that reach every movement, one exercise per movement for the week, so you repeat it and can compare sets.</p>
    <p>At most {STACK_RULES.maxSetsPerSession} sets of an exercise in one session and {STACK_RULES.maxSessionsPerWeek} sessions a week; never the same exercise twice in a day; how many {noun} exercises a day is yours to set, your plan's own included. Days are kept within your gym time where they can be, and one muscle's work off neighbouring plan days where the days allow.</p>
    <p>Minutes are the Plan's own estimate: about {STACK_RULES.minutesPerSet} min of work a set plus {restSeconds} s rest.{words.paired ? ` A one-${words.one} set is done with each ${words.one}; the second ${words.one} takes about ${STACK_RULES.minutesPerSet} min more a set, said beside its day.` : ""}</p>
    {order.length > 0 && <p>Within a day the stack's exercises go after your own, in this order: {listWords(order)}, holds last.</p>}
    <p>The total is your choice: the stack writes no target, never raises the total by itself, and never removes or changes your own exercises.</p>
    <p>{REP_RANGE_SENTENCE}</p>
    {hold && <p>{holdRangeSentence(rangeText(hold.growth))}</p>}
    <p>{REP_EFFORT_SENTENCE}</p>
    <p>A stack added on another device, or an entry you changed after it was added, counts as your plan's own.</p>
    <p>A set here is what the rest of this page calls a bout: one set, and a drop set counts once.</p>
    {sources.length > 0 && <ul className="spz-sources">{sources.map((source) => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul>}
  </div>;
}

