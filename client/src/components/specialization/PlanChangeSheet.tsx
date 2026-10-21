import { useMemo, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import { applyPlanChangeToRecord } from "@/lib/specialization/planChange";
import { boutsFromPlan, plannedExercisesInWeek, prescriptionOf } from "@/lib/specialization/planBouts";
import { previewPlannedChange, type PlannedValues, type RecommendationCandidate } from "@/lib/specialization/recommendations";
import { planningVariantsFor } from "@/lib/specialization/useSpecializationSummary";
import type { SpecializationPlanChange, SpecializationPlanChangeResult } from "@/lib/specialization/viewState";
import { commitDay, emptyDayStore, loadDay, type DaySlot, type WeeklyDayStore } from "@/lib/trainingDayPlan";
import type { TrainingGoal } from "@/lib/workoutPlanner";
import { catalogIdOf } from "@/lib/workoutSwap";
import { creditedMappingsFor, variantForCatalogId } from "@shared/specialization/exposure";
import type { SpecializationRegionData, SummarySide } from "@shared/specialization/types";
import { holdTime } from "./model";
import { SpecializationSheet } from "./SpecializationSheet";

/** Where an add goes in the day: first, after one of its exercises (that entry's id), or at the end. */
type Placement = "first" | "end" | number;

/**
 * Add or swap, into an exact slot of an exact plan day (brief §7, "Choose exact week/day and
 * exercise slot before save"; design §7 "Add or swap sheet"): pick the exercise, the week and
 * the day, then add it where it should go or swap it for one already there, and see what
 * changes in PLANNED totals only before anything is saved.
 *
 * The week starts on the page's plan week and is named under the title; the day starts
 * unchosen, and Save waits until the athlete picks one. The preview runs the very edit Home
 * makes on Save (`applyPlanChangeToRecord`, on the same day of the same week), so what it
 * shows is what is written. Save writes that one day through Home (which shows Undo) and
 * leaves the page where it was. A swap changes the plan only: sets already logged keep the
 * exercise they were logged as.
 */
export function PlanChangeSheet({ data, side, nodeId, candidates, initialExerciseId, catalog, plan, goal, onApply, onClose }: {
  data: SpecializationRegionData;
  /** The summary's side: `both` on a paired region (both sides as one), `midline` on a midline one. */
  side: SummarySide;
  /** The muscle the change is for; its row leads the preview. */
  nodeId: string;
  candidates: readonly RecommendationCandidate[];
  initialExerciseId: number;
  catalog: readonly Exercise[];
  /** The plan's days and built weeks; `week` is the page's plan week, where the sheet starts. */
  plan: { slots: DaySlot[]; weeks: Record<number, WeeklyDayStore>; week: number };
  goal: TrainingGoal;
  onApply: (change: SpecializationPlanChange) => SpecializationPlanChangeResult;
  onClose: () => void;
}) {
  const weeks = useMemo(() => Object.keys(plan.weeks).map(Number).filter((week) => week > 0).sort((left, right) => left - right), [plan.weeks]);
  const [exerciseId, setExerciseId] = useState(initialExerciseId);
  const [week, setWeek] = useState(weeks.includes(plan.week) ? plan.week : weeks[0] ?? plan.week);
  // The day is the athlete's to choose: none is preselected, and Save waits for one.
  const [dayKey, setDayKey] = useState<string | null>(null);
  const [mode, setMode] = useState<"add" | "swap">("add");
  const [replaceEntryId, setReplaceEntryId] = useState<number | null>(null);
  const [placement, setPlacement] = useState<Placement>("end");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const store = useMemo(() => plan.weeks[week] ?? emptyDayStore(), [plan.weeks, week]);
  const incoming = useMemo(() => catalog.find((exercise) => exercise.id === exerciseId) ?? null, [catalog, exerciseId]);
  const slot = useMemo(() => (dayKey === null ? null : plan.slots.find((item) => item.key === dayKey) ?? null), [plan.slots, dayKey]);
  const dayRecord = useMemo(() => (slot ? loadDay(store, slot.key) : null), [store, slot]);
  const dayExercises = dayRecord?.workout ?? [];
  const nodeName = data.nodes.find((node) => node.id === nodeId)?.name ?? "this muscle";
  // A day with nothing in it has nothing to swap: the change is an add there.
  const swapping = mode === "swap" && dayExercises.length > 0;
  const replaced = swapping && replaceEntryId !== null ? dayExercises.find((entry) => entry.id === replaceEntryId) ?? null : null;

  // Where an add goes. After the day's last exercise is the end, so that slot is offered once, as "At the end".
  const afterIndex = typeof placement === "number" ? dayExercises.findIndex((entry) => entry.id === placement) : -1;
  const place: Placement = placement === "first" && dayExercises.length ? "first" : afterIndex >= 0 && afterIndex < dayExercises.length - 1 ? placement : "end";
  const insertAt = place === "first" ? 0 : typeof place === "number" ? afterIndex + 1 : undefined;

  const change = useMemo<SpecializationPlanChange | null>(() => {
    if (!slot || !incoming) return null;
    const base = { week, slotIndex: slot.index, dayKey: slot.key, catalogExerciseId: incoming.id };
    if (swapping) return replaceEntryId === null ? null : { ...base, replaceEntryId };
    return insertAt === undefined ? base : { ...base, insertAt };
  }, [slot, incoming, week, swapping, replaceEntryId, insertAt]);
  // The very edit Home makes on Save, on the same day, so the preview and the write agree.
  const outcome = useMemo(() => (change && dayRecord && incoming ? applyPlanChangeToRecord(dayRecord, change, incoming) : null), [change, dayRecord, incoming]);

  const preview = useMemo(() => {
    if (!outcome?.ok || !slot) return null;
    const before = boutsFromPlan({ week, slots: plan.slots, store, variants: planningVariantsFor(data), goal });
    const after = boutsFromPlan({ week, slots: plan.slots, store: commitDay(store, slot.key, outcome.record), variants: planningVariantsFor(data), goal });
    return previewPlannedChange({ region: data, before, after, side, planWeek: week });
  }, [outcome, slot, week, plan.slots, store, data, goal, side]);

  // What already in that day loads the same muscle: overlap said plainly, not scored.
  const loadsFocus = (catalogExerciseId: number) => {
    const variant = variantForCatalogId(data, catalogExerciseId);
    // As the muscle is credited here: an external member by its home's version once that region has one.
    return Boolean(variant && creditedMappingsFor(data, nodeId).some((mapping) => mapping.variantId === variant.id && mapping.reviewStatus === "reviewed"));
  };
  const overlapping = dayExercises.filter((entry) => loadsFocus(catalogIdOf(entry)));

  // "Already in" names the week chosen here, read from that week's own days, not the page's week.
  const plannedInWeek = useMemo(() => new Map(plannedExercisesInWeek(plan.slots, store).map((item) => [item.catalogExerciseId, item] as const)), [plan.slots, store]);

  const pick = (next: { week?: number; dayKey?: string }) => {
    if (next.week !== undefined) setWeek(next.week);
    if (next.dayKey !== undefined) setDayKey(next.dayKey);
    // The day's entries are another day's now: what was chosen among them no longer applies.
    setReplaceEntryId(null);
    setPlacement("end");
    setError(null);
  };

  const save = () => {
    if (!change || !outcome?.ok || saving) return;
    setSaving(true);
    const result = onApply(change);
    if (result.ok) { onClose(); return; }
    setSaving(false);
    setError(result.reason);
  };

  const describe = (values: PlannedValues) => [
    values.directDynamicBouts ? `${values.directDynamicBouts} direct` : "",
    values.contributingDynamicBouts ? `${values.contributingDynamicBouts} other dynamic` : "",
    values.deliberateHoldBouts ? `${values.deliberateHoldBouts} holds (${holdTime(values.deliberateHoldSeconds)})` : "",
    values.incidentalBouts ? `${values.incidentalBouts} incidental` : "",
    values.mixedBouts ? `${values.mixedBouts} mixed` : "",
  ].filter(Boolean).join(" · ") || "none";
  const focusFirst = preview ? [...preview.nodes].sort((left, right) => (left.nodeId === nodeId ? -1 : right.nodeId === nodeId ? 1 : 0)) : [];
  // The why was read in the muscle sheet; here each choice says what it needs and whether the chosen week has it.
  const detailOf = (catalogExerciseId: number, equipment: string | null, equipmentAvailable?: boolean) => {
    const planned = plannedInWeek.get(catalogExerciseId);
    return [
      equipment,
      planned ? `already in Week ${week} (${planned.days.map((day) => day.label).join(", ")})` : "",
      equipmentAvailable === false ? "not in your equipment" : "",
    ].filter(Boolean).join(" · ");
  };
  const choices = candidates.map((candidate) => ({ catalogExerciseId: candidate.catalogExerciseId, name: candidate.name, why: detailOf(candidate.catalogExerciseId, candidate.equipment, candidate.equipmentAvailable) }));
  const listed = choices.some((choice) => choice.catalogExerciseId === exerciseId) || !incoming ? choices : [{ catalogExerciseId: incoming.id, name: incoming.name, why: detailOf(incoming.id, incoming.equipment) }, ...choices];
  // Six at most, and always the one chosen.
  const shown = listed.slice(0, 6);
  const chosen = listed.find((choice) => choice.catalogExerciseId === exerciseId);
  if (chosen && !shown.includes(chosen)) shown.push(chosen);

  const lastEntry = dayExercises[dayExercises.length - 1];
  const placeLabel = place === "first" ? "First" : typeof place === "number" ? `After ${dayExercises[afterIndex].name}` : "At the end";
  // Under the title: where the change goes, as chosen so far.
  const where = [
    `Week ${week}`,
    slot ? slot.label : "Choose a day",
    !slot ? "" : swapping ? (replaced ? `In place of ${replaced.name}` : "Choose one to swap out") : dayExercises.length ? placeLabel : "",
  ].filter(Boolean).join(" · ");
  // Beside a disabled Save, why it is disabled: the choice still to make, or why this change cannot be
  // saved (on a phone the preview's own line is often below the fold).
  const hint = !slot ? "Choose a day" : swapping && replaceEntryId === null ? "Choose the exercise to swap out" : outcome && !outcome.ok ? outcome.reason : null;
  // Read with each exercise's measure, as the preview's planned bouts and Train read it: a hold's default is "4 × 30 sec".
  const measureOf = (catalogExerciseId: number) => variantForCatalogId(data, catalogExerciseId)?.measure;
  const plannedAs = outcome?.ok && !swapping && incoming ? prescriptionOf(outcome.record.prescriptions[incoming.id], outcome.index, goal, measureOf(incoming.id)) : undefined;
  // An add ahead of other exercises moves them down a place. One without a prescription of its
  // own reads as its place's default, so where that default differs its planned sets change: said
  // here, not left for the totals to show silently.
  const shifted = outcome?.ok && !swapping && dayRecord ? dayRecord.workout.slice(outcome.index).flatMap((entry, offset) => {
    if (dayRecord.prescriptions[entry.id]) return [];
    const was = prescriptionOf(undefined, outcome.index + offset, goal, measureOf(catalogIdOf(entry)));
    const now = prescriptionOf(undefined, outcome.index + offset + 1, goal, measureOf(catalogIdOf(entry)));
    return was && now && was !== now ? [{ id: entry.id, name: entry.name, was, now }] : [];
  }) : [];

  return <SpecializationSheet
    id="spz-change"
    eyebrow={`For ${nodeName}`}
    title={swapping ? "Swap into your plan" : "Add to your plan"}
    // The muscle is the subject; rewording the title for a swap keeps focus where it was.
    focusKey={nodeId}
    subtitle={<>
      <p className="spz-change-where">{where}</p>
      <p>Nothing changes until you save. The preview counts planned work only; what you already logged stays as it is.</p>
    </>}
    onClose={onClose}
    footer={<>
      {error && <p className="spz-error" role="alert">{error}</p>}
      {hint && <p className="spz-change-hint" id="spz-change-hint">{hint}</p>}
      <div className="spz-actions">
        <button type="button" className="spz-primary" onClick={save} disabled={!outcome?.ok || saving} aria-describedby={hint ? "spz-change-hint" : undefined}>{swapping ? "Save swap" : "Save to plan"}</button>
        <button type="button" className="spz-button" onClick={onClose}>Cancel</button>
      </div>
    </>}
  >
    <fieldset className="spz-fieldset">
      <legend>Exercise</legend>
      <div className="spz-choice-list">
        {shown.map((candidate) => <label key={candidate.catalogExerciseId} className="spz-choice">
          <input type="radio" name="spz-change-exercise" checked={exerciseId === candidate.catalogExerciseId} onChange={() => { setExerciseId(candidate.catalogExerciseId); setError(null); }} />
          <span><b>{candidate.name}</b>{candidate.why && <small>{candidate.why}</small>}</span>
        </label>)}
      </div>
    </fieldset>

    <fieldset className="spz-fieldset">
      <legend>Week</legend>
      {weeks.length ? <div className="spz-chips">
        {weeks.map((item) => <button key={item} type="button" className="spz-chip" aria-pressed={item === week} onClick={() => pick({ week: item })}>Week {item}</button>)}
      </div> : <p className="spz-note">Build a week in Plan first; there is no week to add to yet.</p>}
    </fieldset>

    <fieldset className="spz-fieldset">
      <legend>Day</legend>
      <div className="spz-chips">
        {plan.slots.map((item) => {
          const count = (store.plan[item.key] ?? []).length;
          return <button key={item.key} type="button" className="spz-chip" aria-pressed={item.key === dayKey} onClick={() => pick({ dayKey: item.key })}><span>{item.ordinal} · {item.day}</span><small>{count ? `${count} planned` : "Empty"}</small></button>;
        })}
      </div>
    </fieldset>

    {slot && <fieldset className="spz-fieldset">
      <legend>Add or swap</legend>
      <div className="spz-segment" role="group" aria-label="Add or swap">
        <button type="button" aria-pressed={!swapping} onClick={() => { setMode("add"); setError(null); }}>Add to the day</button>
        <button type="button" aria-pressed={swapping} onClick={() => { setMode("swap"); setError(null); }} disabled={!dayExercises.length}>Swap one out</button>
      </div>
      {!dayExercises.length && <p className="spz-note">{slot.label} is empty, so this adds it as the day's only exercise.</p>}
    </fieldset>}

    {slot && !swapping && dayExercises.length > 0 && <fieldset className="spz-fieldset">
      <legend>Where it goes</legend>
      <div className="spz-choice-list">
        <label className="spz-choice">
          <input type="radio" name="spz-change-slot" checked={place === "first"} onChange={() => { setPlacement("first"); setError(null); }} />
          <span><b>First</b><small>Before {dayExercises[0].name}</small></span>
        </label>
        {dayExercises.slice(0, -1).map((entry, index) => <label key={entry.id} className="spz-choice">
          <input type="radio" name="spz-change-slot" checked={place === entry.id} onChange={() => { setPlacement(entry.id); setError(null); }} />
          <span><b>After {entry.name}</b><small>Before {dayExercises[index + 1].name}</small></span>
        </label>)}
        <label className="spz-choice">
          <input type="radio" name="spz-change-slot" checked={place === "end"} onChange={() => { setPlacement("end"); setError(null); }} />
          <span><b>At the end</b><small>After {lastEntry.name}</small></span>
        </label>
      </div>
    </fieldset>}

    {slot && swapping && <fieldset className="spz-fieldset">
      <legend>Swap out</legend>
      <div className="spz-choice-list">
        {dayExercises.map((entry) => <label key={entry.id} className="spz-choice">
          <input type="radio" name="spz-change-replace" checked={replaceEntryId === entry.id} onChange={() => { setReplaceEntryId(entry.id); setError(null); }} />
          <span><b>{entry.name}</b><small>{loadsFocus(catalogIdOf(entry)) ? `Also loads ${nodeName}` : "Keeps its sets, reps and notes for the new exercise"}</small></span>
        </label>)}
      </div>
      <p className="spz-note">A swap changes the plan only. Sets you already logged keep the exercise they were logged as.</p>
    </fieldset>}

    <section className="spz-preview" aria-live="polite" aria-labelledby="spz-preview-title">
      <h3 id="spz-preview-title">Planned totals, Week {week}</h3>
      {!slot && <p className="spz-note">Choose a day to see what changes.</p>}
      {outcome && !outcome.ok && <p className="spz-error">{outcome.reason}</p>}
      {slot && swapping && replaceEntryId === null && <p className="spz-note">Choose the exercise to swap out to see the change.</p>}
      {plannedAs && <p className="spz-note">Planned as {plannedAs}, the default for that place in the day.</p>}
      {shifted.map((item) => <p key={item.id} className="spz-note">{item.name} moves down a place, so it is planned as {item.now} instead of {item.was}.</p>)}
      {preview && (preview.nodes.length ? <ul className="spz-preview-list">
        {focusFirst.map((row) => <li key={row.nodeId} data-focus={row.nodeId === nodeId || undefined}>
          <b>{row.name}</b>
          <span>{describe(row.before)} <ArrowRight className="h-3.5 w-3.5" aria-label="becomes" /> {describe(row.after)}</span>
        </li>)}
        <li><b>Distinct bouts in the {data.region.label.toLowerCase()}</b><span>{preview.regionDistinctBouts.before} <ArrowRight className="h-3.5 w-3.5" aria-label="becomes" /> {preview.regionDistinctBouts.after}</span></li>
      </ul> : <p className="spz-note">No mapped muscle's planned totals change.</p>)}
      {preview && !preview.nodes.some((row) => row.nodeId === nodeId) && <p className="spz-note">{nodeName}'s planned totals do not change with this.</p>}
      {overlapping.length > 0 && <p className="spz-note"><Check className="h-3.5 w-3.5" aria-hidden="true" /> Already in that day and loading {nodeName}: {overlapping.map((entry) => entry.name).join(", ")}.</p>}
    </section>
  </SpecializationSheet>;
}
