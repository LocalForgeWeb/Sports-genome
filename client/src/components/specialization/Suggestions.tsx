import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Plus } from "lucide-react";
import type { SpecializationExclusions } from "@/lib/specialization/exclusions";
import type { Recommendations } from "@/lib/specialization/recommendations";
import type { StoreWrite } from "@/lib/specialization/stores";
import type { SpecializationRegionData, SummaryMode } from "@shared/specialization/types";
import { coveredWords, missingActionNote } from "./model";
import { revealClearOfBars } from "./reveal";
import { WhyThisCounts } from "./WhyThisCounts";

export type SuggestionsProps = {
  data: SpecializationRegionData;
  /** Null while the plan (and so the summary) is loading. */
  recommendations: Recommendations | null;
  exclusions: SpecializationExclusions;
  onSetExerciseExcluded: (catalogExerciseId: number, excluded: boolean) => StoreWrite;
  onSetEquipmentExcluded: (equipment: string, excluded: boolean) => StoreWrite;
  onChooseExercise: (catalogExerciseId: number) => void;
  onInspectExercise: (catalogExerciseId: number | null, name: string) => void;
  /** The muscle the exercises are for (the muscle sheet), so a main action nothing here trains is said plainly. */
  nodeId?: string | null;
  /** Completed or planned: whether "no direct work" is in the window or in the plan week. */
  mode?: SummaryMode;
  /** An exercise's equipment, from the catalog the recommender read: tells an equipment the athlete left out apart from a target already met. */
  equipmentOf?: (catalogExerciseId: number) => string | null;
  /**
   * The app's starting range beside each suggested exercise ("10–25 reps", "10–30 s holds";
   * 11-forearm-research-and-stack.md §5.2), null where it has none; absent where the sheet shows no ranges.
   */
  rangeOf?: (catalogExerciseId: number) => string | null;
  /** Said once above the suggestions: what the ranges are, or that they are loading. */
  rangesNote?: ReactNode;
};

/** How many suggestions a sheet lists. */
const SHOWN = 5;

/**
 * The exercises for one muscle or one movement (brief §7, design §8), shared by the muscle
 * sheet and the movement sheet: each with why it fits, the other muscles it loads, "Why this
 * counts" (the reviewed mappings and their sources), Add or swap, About it, and Not for me
 * with Undo; what the athlete left out, as toggles; and what in the plan already covers it.
 * Above the list, once: a target of the athlete's that no reviewed exercise can count toward
 * (the recommender's `targetNote`), and a main action of the muscle with no direct work that
 * no suggestion covers, with why (`missingActionNote`).
 *
 * Not for me acts at once and says so where the athlete is (CLAUDE.md: Undo over confirm,
 * "offer Undo in the message"): the line with its Undo takes the removed row's place in the
 * list, and focus moves to that Undo, since the button that had it is gone. After Undo, focus
 * goes back to the restored exercise's Not for me or, when it is no longer among those shown,
 * to a line saying it is suggested again.
 */
export function Suggestions({ data, recommendations, exclusions, onSetExerciseExcluded, onSetEquipmentExcluded, onChooseExercise, onInspectExercise, nodeId = null, mode = "completed", equipmentOf, rangeOf, rangesNote = null }: SuggestionsProps) {
  const [excludedNow, setExcludedNow] = useState<{ id: number; name: string; index: number } | null>(null);
  const [restored, setRestored] = useState<{ id: number; name: string } | null>(null);
  const [exclusionError, setExclusionError] = useState<string | null>(null);
  /** Where focus goes once a change is drawn; `index` is the place in "What is suggested" a Suggest again had. */
  const [focusOn, setFocusOn] = useState<{ on: "undo" | "restored" | "excluded"; index: number; count: number }>({ on: "undo", index: 0, count: 0 });
  const undoRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const restoredRef = useRef<HTMLParagraphElement>(null);
  const choicesRef = useRef<HTMLDetailsElement>(null);
  const excludedListRef = useRef<HTMLUListElement>(null);
  const messageId = useId();

  const exclude = (id: number, name: string, index: number) => {
    const result = onSetExerciseExcluded(id, true);
    if (!result.ok) { setExclusionError(result.reason); return; }
    setExcludedNow({ id, name, index });
    setRestored(null);
    setExclusionError(null);
    setFocusOn((current) => ({ on: "undo", index: 0, count: current.count + 1 }));
  };
  const undo = (item: { id: number; name: string }) => {
    const result = onSetExerciseExcluded(item.id, false);
    if (!result.ok) { setExclusionError(result.reason); return; }
    setExcludedNow(null);
    setRestored({ id: item.id, name: item.name });
    setExclusionError(null);
    setFocusOn((current) => ({ on: "restored", index: 0, count: current.count + 1 }));
  };
  /** "Suggest again" in What is suggested: its row goes, so focus moves to the next one left (or the disclosure). */
  const suggestAgain = (item: { id: number; name: string }, index: number) => {
    const result = onSetExerciseExcluded(item.id, false);
    if (!result.ok) { setExclusionError(result.reason); return; }
    setRestored({ id: item.id, name: item.name });
    setExclusionError(null);
    setFocusOn((current) => ({ on: "excluded", index, count: current.count + 1 }));
  };
  const toggleEquipment = (item: string, off: boolean) => {
    const result = onSetEquipmentExcluded(item, !off);
    setExclusionError(result.ok ? null : result.reason);
    // The list changes under it: a line about an earlier restore would now be out of place.
    if (result.ok) setRestored(null);
  };
  // Once the change is drawn: the new Undo; after Undo, the restored exercise's Not for me (else
  // the line saying it is back); after Suggest again, the next exercise left out, else the
  // disclosure, else the restored exercise as after Undo. Never the page body.
  useEffect(() => {
    if (!focusOn.count) return;
    const restoredTarget = () => listRef.current?.querySelector<HTMLButtonElement>(`[data-exclude="${restored?.id ?? ""}"]`) ?? restoredRef.current;
    const left = () => Array.from(excludedListRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
    const target = focusOn.on === "undo"
      ? undoRef.current
      : focusOn.on === "restored"
        ? restoredTarget()
        : left()[Math.min(focusOn.index, left().length - 1)] ?? choicesRef.current?.querySelector<HTMLElement>(":scope > summary") ?? restoredTarget();
    if (!target) return;
    target.focus({ preventScroll: true });
    revealClearOfBars(target);
    // Only a new change moves focus, never a re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusOn]);

  // An exercise brought back some other way ("Suggest again") has nothing left to undo.
  const pending = excludedNow && exclusions.catalogExerciseIds.includes(excludedNow.id) ? excludedNow : null;
  const candidateEquipment = recommendations?.kind === "candidates" ? recommendations.candidates.map((item) => item.equipment).filter((item): item is string => Boolean(item)) : [];
  const equipmentChoices = Array.from(new Set([...candidateEquipment, ...exclusions.equipment])).sort((left, right) => left.localeCompare(right));
  const excludedExercises = exclusions.catalogExerciseIds.map((id) => ({ id, name: data.variants.find((variant) => variant.catalogExerciseId === id)?.catalogName ?? `Exercise ${id}` }));
  const candidatesResult = recommendations?.kind === "candidates" ? recommendations : null;
  // With no candidate the empty reason already leads with the target note, so it is said once either way.
  const targetNote = candidatesResult && candidatesResult.candidates.length ? candidatesResult.targetNote ?? null : null;
  const missingNote = candidatesResult && nodeId ? missingActionNote({ data, nodeId, result: candidatesResult, mode, exclusions, equipmentOf }) : null;
  const shown = candidatesResult ? candidatesResult.candidates.slice(0, SHOWN) : [];
  const restoredShown = restored !== null && shown.some((candidate) => candidate.catalogExerciseId === restored.id);

  /** "Lever Ulnar Deviation will not be suggested. Undo", where its row was. */
  const undoLine = pending ? <p className="spz-inline-status" role="status">
    <span id={messageId}>{pending.name} will not be suggested.</span>
    <button ref={undoRef} type="button" className="spz-link spz-link-box" aria-describedby={messageId} onClick={() => undo(pending)}>Undo</button>
  </p> : null;
  const rows = shown.map((candidate, index) => <li key={candidate.catalogExerciseId} className="spz-candidate">
    <span><b>{candidate.name}</b><small>{candidate.why}</small>{rangeOf?.(candidate.catalogExerciseId) && <small className="spz-range">Starting range: {rangeOf(candidate.catalogExerciseId)}</small>}{candidate.alsoLoads.length > 0 && <small>Also loads {candidate.alsoLoads.slice(0, 4).map((item) => item.name).join(", ")}{candidate.alsoLoads.length > 4 ? ` and ${candidate.alsoLoads.length - 4} more` : ""}.</small>}</span>
    <span className="spz-candidate-actions">
      <button type="button" className="spz-button" onClick={() => onChooseExercise(candidate.catalogExerciseId)}><Plus className="h-4 w-4" aria-hidden="true" />Add or swap</button>
      <button type="button" className="spz-link" onClick={() => onInspectExercise(candidate.catalogExerciseId, candidate.name)}>About it</button>
      <button type="button" className="spz-link" data-exclude={candidate.catalogExerciseId} onClick={() => exclude(candidate.catalogExerciseId, candidate.name, index)} aria-label={`Do not suggest ${candidate.name}`}>Not for me</button>
    </span>
    <div className="spz-candidate-why"><WhyThisCounts data={data} mappingIds={candidate.mappingIds} /></div>
  </li>);
  if (undoLine && rows.length) rows.splice(Math.min(pending!.index, rows.length), 0, <li key="undo" className="spz-candidate spz-candidate-undo">{undoLine}</li>);

  return <>
    {targetNote && <p className="spz-note spz-suggest-note">{targetNote}</p>}
    {missingNote && <p className="spz-note spz-suggest-note">{missingNote}</p>}
    {rows.length > 0 && rangesNote}
    {!recommendations ? <p className="spz-note">Exercises appear once your plan has loaded.</p>
      : recommendations.kind === "mapping_not_reviewed" ? <p className="spz-note">{recommendations.message}</p>
      : recommendations.kind === "at_target" ? <p className="spz-note">{recommendations.note}</p>
      : rows.length ? <ul ref={listRef} className="spz-candidates">{rows}</ul>
      // The last suggestion left out: its Undo stays where the list was, above why there is none.
      : <>{undoLine}<p className="spz-note">{recommendations.emptyReason ?? "No reviewed exercise fits your equipment and choices."}</p></>}
    {/* Brought back but no longer among the five shown: said, so focus has somewhere to land. */}
    {restored && !restoredShown && <p ref={restoredRef} className="spz-inline-status" role="status" tabIndex={-1}>{restored.name} is suggested again.</p>}
    {exclusionError && <p className="spz-error" role="alert">{exclusionError}</p>}
    {(equipmentChoices.length > 0 || excludedExercises.length > 0) && <details ref={choicesRef} className="spz-disclosure">
      <summary><span><b>What is suggested</b><small>{exclusions.catalogExerciseIds.length + exclusions.equipment.length ? `${exclusions.catalogExerciseIds.length + exclusions.equipment.length} left out by you` : "Nothing left out"}</small></span><ChevronDown className="h-4 w-4" aria-hidden="true" /></summary>
      {equipmentChoices.length > 0 && <div className="spz-chips" role="group" aria-label="Equipment to leave out of suggestions">
        {equipmentChoices.map((item) => {
          const off = exclusions.equipment.includes(item);
          return <button key={item} type="button" className="spz-chip" aria-pressed={off} onClick={() => toggleEquipment(item, off)}><span>{item}</span><small>{off ? "Left out" : "Suggested"}</small></button>;
        })}
      </div>}
      {excludedExercises.length > 0 && <ul ref={excludedListRef} className="spz-exercise-list">{excludedExercises.map((item, index) => <li key={item.id}><span><b>{item.name}</b><small>Not suggested</small></span><button type="button" className="spz-link" onClick={() => suggestAgain(item, index)}>Suggest again</button></li>)}</ul>}
    </details>}
    {recommendations && recommendations.kind !== "mapping_not_reviewed" && recommendations.alreadyCoveredBy.length > 0 && <div className="spz-covered">
      <p className="spz-note"><b>Already covered by</b></p>
      <ul className="spz-caveats">{recommendations.alreadyCoveredBy.map((item) => <li key={item.catalogExerciseId}>{coveredWords(item)}</li>)}</ul>
    </div>}
  </>;
}
