import { useMemo, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import { applyPlanChangeToRecord } from "@/lib/specialization/planChange";
import { boutsFromPlan } from "@/lib/specialization/planBouts";
import { previewPlannedChange, type PlannedValues, type RecommendationCandidate } from "@/lib/specialization/recommendations";
import type { SpecializationPlanChange, SpecializationPlanChangeResult } from "@/lib/specialization/viewState";
import { commitDay, emptyDayStore, loadDay, type DaySlot, type WeeklyDayStore } from "@/lib/trainingDayPlan";
import type { TrainingGoal } from "@/lib/workoutPlanner";
import { catalogIdOf } from "@/lib/workoutSwap";
import { variantForCatalogId } from "@shared/specialization/exposure";
import type { ArmSide, SpecializationRegionData } from "@shared/specialization/types";
import { formatSeconds } from "./model";
import { SpecializationSheet } from "./SpecializationSheet";

/**
 * Add or swap, into an exact plan day (brief §7, design §7 "Add or swap sheet"): pick the
 * exercise, the week and the day, add it or swap it for one already there, and see what
 * changes in PLANNED totals only before anything is saved. Save writes that one day through
 * Home (which shows Undo) and leaves the page where it was. A swap changes the plan only:
 * sets already logged keep the exercise they were logged as.
 */
export function PlanChangeSheet({ data, side, nodeId, candidates, initialExerciseId, catalog, plan, goal, defaultPrescriptionFor, onApply, onClose }: {
  data: SpecializationRegionData;
  side: ArmSide;
  /** The muscle the change is for; its row leads the preview. */
  nodeId: string;
  candidates: readonly RecommendationCandidate[];
  initialExerciseId: number;
  catalog: readonly Exercise[];
  plan: { slots: DaySlot[]; weeks: Record<number, WeeklyDayStore>; week: number };
  goal: TrainingGoal;
  defaultPrescriptionFor: (index: number) => string;
  onApply: (change: SpecializationPlanChange) => SpecializationPlanChangeResult;
  onClose: () => void;
}) {
  const weeks = useMemo(() => Object.keys(plan.weeks).map(Number).filter((week) => week > 0).sort((left, right) => left - right), [plan.weeks]);
  const [exerciseId, setExerciseId] = useState(initialExerciseId);
  const [week, setWeek] = useState(weeks.includes(plan.week) ? plan.week : weeks[0] ?? plan.week);
  const store = plan.weeks[week] ?? emptyDayStore();
  const [dayKey, setDayKey] = useState(() => plan.slots.find((slot) => !(store.plan[slot.key] ?? []).some((entry) => catalogIdOf(entry) === initialExerciseId))?.key ?? plan.slots[0]?.key ?? "");
  const [mode, setMode] = useState<"add" | "swap">("add");
  const [replaceEntryId, setReplaceEntryId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const incoming = catalog.find((exercise) => exercise.id === exerciseId) ?? null;
  const slot = plan.slots.find((item) => item.key === dayKey) ?? null;
  const dayRecord = slot ? loadDay(store, slot.key) : null;
  const nodeName = data.nodes.find((node) => node.id === nodeId)?.name ?? "this muscle";
  const change: SpecializationPlanChange | null = slot && incoming ? { week, slotIndex: slot.index, dayKey: slot.key, catalogExerciseId: incoming.id, ...(mode === "swap" && replaceEntryId !== null ? { replaceEntryId } : {}) } : null;

  const outcome = useMemo(() => {
    if (!change || !dayRecord || !incoming) return null;
    if (mode === "swap" && replaceEntryId === null) return null;
    return applyPlanChangeToRecord(dayRecord, change, incoming, defaultPrescriptionFor(dayRecord.workout.length));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week, dayKey, mode, replaceEntryId, exerciseId, store]);

  const preview = useMemo(() => {
    if (!outcome?.ok || !slot) return null;
    const before = boutsFromPlan({ week, slots: plan.slots, store, variants: data.variants, goal });
    const after = boutsFromPlan({ week, slots: plan.slots, store: commitDay(store, slot.key, outcome.record), variants: data.variants, goal });
    return previewPlannedChange({ region: data, before, after, side, planWeek: week });
  }, [outcome, slot, week, plan.slots, store, data, goal, side]);

  // What already in that day loads the same muscle: overlap said plainly, not scored.
  const loadsFocus = (catalogExerciseId: number) => {
    const variant = variantForCatalogId(data, catalogExerciseId);
    return Boolean(variant && data.mappings.some((mapping) => mapping.variantId === variant.id && mapping.nodeId === nodeId && mapping.reviewStatus === "reviewed" && mapping.versionKey === data.mappingVersion.key));
  };
  const dayExercises = dayRecord?.workout ?? [];
  const overlapping = dayExercises.filter((entry) => loadsFocus(catalogIdOf(entry)));

  const save = () => {
    if (!change || saving) return;
    if (mode === "swap" && replaceEntryId === null) { setError("Choose the exercise to swap out."); return; }
    setSaving(true);
    const result = onApply(change);
    if (result.ok) { onClose(); return; }
    setSaving(false);
    setError(result.reason);
  };

  const describe = (values: PlannedValues) => [
    values.directDynamicBouts ? `${values.directDynamicBouts} direct` : "",
    values.contributingDynamicBouts ? `${values.contributingDynamicBouts} other dynamic` : "",
    values.deliberateHoldBouts ? `${values.deliberateHoldBouts} holds (${formatSeconds(values.deliberateHoldSeconds)})` : "",
    values.incidentalBouts ? `${values.incidentalBouts} incidental` : "",
    values.mixedBouts ? `${values.mixedBouts} mixed` : "",
  ].filter(Boolean).join(" · ") || "none";
  const focusFirst = preview ? [...preview.nodes].sort((left, right) => (left.nodeId === nodeId ? -1 : right.nodeId === nodeId ? 1 : 0)) : [];
  const choices = candidates.map((candidate) => ({ catalogExerciseId: candidate.catalogExerciseId, name: candidate.name, why: candidate.why }));
  const listed = choices.some((choice) => choice.catalogExerciseId === exerciseId) || !incoming ? choices : [{ catalogExerciseId: incoming.id, name: incoming.name, why: "" }, ...choices];
  // Six at most, and always the one chosen.
  const shown = listed.slice(0, 6);
  const chosen = listed.find((choice) => choice.catalogExerciseId === exerciseId);
  if (chosen && !shown.includes(chosen)) shown.push(chosen);

  return <SpecializationSheet
    id="spz-change"
    eyebrow={`For ${nodeName} · ${side === "left" ? "left" : "right"} arm`}
    title={mode === "swap" ? "Swap into your plan" : "Add to your plan"}
    subtitle={<p>Nothing changes until you save. The preview counts planned work only; what you already logged stays as it is.</p>}
    onClose={onClose}
    footer={<>
      {error && <p className="spz-error" role="alert">{error}</p>}
      <div className="spz-actions">
        <button type="button" className="spz-primary" onClick={save} disabled={!outcome?.ok || saving}>{mode === "swap" ? "Save swap" : "Save to plan"}</button>
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
        {weeks.map((item) => <button key={item} type="button" className="spz-chip" aria-pressed={item === week} onClick={() => { setWeek(item); setReplaceEntryId(null); setError(null); }}>Week {item}</button>)}
      </div> : <p className="spz-note">Build a week in Plan first; there is no week to add to yet.</p>}
    </fieldset>

    <fieldset className="spz-fieldset">
      <legend>Day</legend>
      <div className="spz-chips">
        {plan.slots.map((item) => {
          const count = (store.plan[item.key] ?? []).length;
          return <button key={item.key} type="button" className="spz-chip" aria-pressed={item.key === dayKey} onClick={() => { setDayKey(item.key); setReplaceEntryId(null); setError(null); }}><span>{item.ordinal} · {item.day}</span><small>{count ? `${count} planned` : "Empty"}</small></button>;
        })}
      </div>
    </fieldset>

    <fieldset className="spz-fieldset">
      <legend>Add or swap</legend>
      <div className="spz-segment" role="group" aria-label="Add or swap">
        <button type="button" aria-pressed={mode === "add"} onClick={() => { setMode("add"); setError(null); }}>Add to the day</button>
        <button type="button" aria-pressed={mode === "swap"} onClick={() => { setMode("swap"); setError(null); }} disabled={!dayExercises.length}>Swap one out</button>
      </div>
      {mode === "swap" && <div className="spz-choice-list">
        {dayExercises.map((entry) => <label key={entry.id} className="spz-choice">
          <input type="radio" name="spz-change-replace" checked={replaceEntryId === entry.id} onChange={() => { setReplaceEntryId(entry.id); setError(null); }} />
          <span><b>{entry.name}</b><small>{loadsFocus(catalogIdOf(entry)) ? `Also loads ${nodeName}` : "Keeps its sets, reps and notes for the new exercise"}</small></span>
        </label>)}
        <p className="spz-note">A swap changes the plan only. Sets you already logged keep the exercise they were logged as.</p>
      </div>}
    </fieldset>

    <section className="spz-preview" aria-live="polite" aria-labelledby="spz-preview-title">
      <h3 id="spz-preview-title">Planned totals, Week {week}, {side} arm</h3>
      {outcome && !outcome.ok && <p className="spz-error">{outcome.reason}</p>}
      {mode === "swap" && replaceEntryId === null && <p className="spz-note">Choose the exercise to swap out to see the change.</p>}
      {preview && (preview.nodes.length ? <ul className="spz-preview-list">
        {focusFirst.map((row) => <li key={row.nodeId} data-focus={row.nodeId === nodeId || undefined}>
          <b>{row.name}</b>
          <span>{describe(row.before)} <ArrowRight className="h-3.5 w-3.5" aria-label="becomes" /> {describe(row.after)}</span>
        </li>)}
        <li><b>Distinct {data.region.label.toLowerCase()} bouts</b><span>{preview.regionDistinctBouts.before} <ArrowRight className="h-3.5 w-3.5" aria-label="becomes" /> {preview.regionDistinctBouts.after}</span></li>
      </ul> : <p className="spz-note">No mapped muscle's planned totals change.</p>)}
      {preview && !preview.nodes.some((row) => row.nodeId === nodeId) && <p className="spz-note">{nodeName}'s planned totals do not change with this.</p>}
      {overlapping.length > 0 && <p className="spz-note"><Check className="h-3.5 w-3.5" aria-hidden="true" /> Already in that day and loading {nodeName}: {overlapping.map((entry) => entry.name).join(", ")}.</p>}
    </section>
  </SpecializationSheet>;
}
