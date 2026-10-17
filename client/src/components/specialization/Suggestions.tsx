import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import type { SpecializationExclusions } from "@/lib/specialization/exclusions";
import type { Recommendations } from "@/lib/specialization/recommendations";
import type { StoreWrite } from "@/lib/specialization/stores";
import type { SpecializationRegionData, SummaryMode } from "@shared/specialization/types";
import { coveredWords, missingActionNote } from "./model";
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
};

/**
 * The exercises for one muscle or one movement (brief §7, design §8), shared by the muscle
 * sheet and the movement sheet: each with why it fits, the other muscles it loads, "Why this
 * counts" (the reviewed mappings and their sources), Add or swap, About it, and Not for me
 * with Undo; what the athlete left out, as toggles; and what in the plan already covers it.
 * Above the list, once: a target of the athlete's that no reviewed exercise can count toward
 * (the recommender's `targetNote`), and a main action of the muscle with no direct work that
 * no suggestion covers, with why (`missingActionNote`).
 */
export function Suggestions({ data, recommendations, exclusions, onSetExerciseExcluded, onSetEquipmentExcluded, onChooseExercise, onInspectExercise, nodeId = null, mode = "completed" }: SuggestionsProps) {
  const [excludedNow, setExcludedNow] = useState<{ id: number; name: string } | null>(null);
  const [exclusionError, setExclusionError] = useState<string | null>(null);
  const exclude = (id: number, name: string) => {
    const result = onSetExerciseExcluded(id, true);
    if (result.ok) { setExcludedNow({ id, name }); setExclusionError(null); } else setExclusionError(result.reason);
  };
  const candidateEquipment = recommendations?.kind === "candidates" ? recommendations.candidates.map((item) => item.equipment).filter((item): item is string => Boolean(item)) : [];
  const equipmentChoices = Array.from(new Set([...candidateEquipment, ...exclusions.equipment])).sort((left, right) => left.localeCompare(right));
  const excludedExercises = exclusions.catalogExerciseIds.map((id) => ({ id, name: data.variants.find((variant) => variant.catalogExerciseId === id)?.catalogName ?? `Exercise ${id}` }));
  const candidatesResult = recommendations?.kind === "candidates" ? recommendations : null;
  // With no candidate the empty reason already leads with the target note, so it is said once either way.
  const targetNote = candidatesResult && candidatesResult.candidates.length ? candidatesResult.targetNote ?? null : null;
  const missingNote = candidatesResult && nodeId ? missingActionNote({ data, nodeId, result: candidatesResult, mode, excludedExerciseIds: exclusions.catalogExerciseIds }) : null;

  return <>
    {targetNote && <p className="spz-note spz-suggest-note">{targetNote}</p>}
    {missingNote && <p className="spz-note spz-suggest-note">{missingNote}</p>}
    {!recommendations ? <p className="spz-note">Exercises appear once your plan has loaded.</p>
      : recommendations.kind === "mapping_not_reviewed" ? <p className="spz-note">{recommendations.message}</p>
      : recommendations.kind === "at_target" ? <p className="spz-note">{recommendations.note}</p>
      : recommendations.candidates.length ? <ul className="spz-candidates">
        {recommendations.candidates.slice(0, 5).map((candidate) => <li key={candidate.catalogExerciseId} className="spz-candidate">
          <span><b>{candidate.name}</b><small>{candidate.why}</small>{candidate.alsoLoads.length > 0 && <small>Also loads {candidate.alsoLoads.slice(0, 4).map((item) => item.name).join(", ")}{candidate.alsoLoads.length > 4 ? ` and ${candidate.alsoLoads.length - 4} more` : ""}.</small>}</span>
          <span className="spz-candidate-actions">
            <button type="button" className="spz-button" onClick={() => onChooseExercise(candidate.catalogExerciseId)}><Plus className="h-4 w-4" aria-hidden="true" />Add or swap</button>
            <button type="button" className="spz-link" onClick={() => onInspectExercise(candidate.catalogExerciseId, candidate.name)}>About it</button>
            <button type="button" className="spz-link" onClick={() => exclude(candidate.catalogExerciseId, candidate.name)} aria-label={`Do not suggest ${candidate.name}`}>Not for me</button>
          </span>
          <div className="spz-candidate-why"><WhyThisCounts data={data} mappingIds={candidate.mappingIds} /></div>
        </li>)}
      </ul> : <p className="spz-note">{recommendations.emptyReason ?? "No reviewed exercise fits your equipment and choices."}</p>}
    {excludedNow && <p className="spz-inline-status" role="status">{excludedNow.name} will not be suggested. <button type="button" className="spz-link" onClick={() => { if (onSetExerciseExcluded(excludedNow.id, false).ok) setExcludedNow(null); }}>Undo</button></p>}
    {exclusionError && <p className="spz-error" role="alert">{exclusionError}</p>}
    {(equipmentChoices.length > 0 || excludedExercises.length > 0) && <details className="spz-disclosure">
      <summary><span><b>What is suggested</b><small>{exclusions.catalogExerciseIds.length + exclusions.equipment.length ? `${exclusions.catalogExerciseIds.length + exclusions.equipment.length} left out by you` : "Nothing left out"}</small></span><ChevronDown className="h-4 w-4" aria-hidden="true" /></summary>
      {equipmentChoices.length > 0 && <div className="spz-chips" role="group" aria-label="Equipment to leave out of suggestions">
        {equipmentChoices.map((item) => {
          const off = exclusions.equipment.includes(item);
          return <button key={item} type="button" className="spz-chip" aria-pressed={off} onClick={() => { const result = onSetEquipmentExcluded(item, !off); setExclusionError(result.ok ? null : result.reason); }}><span>{item}</span><small>{off ? "Left out" : "Suggested"}</small></button>;
        })}
      </div>}
      {excludedExercises.length > 0 && <ul className="spz-exercise-list">{excludedExercises.map((item) => <li key={item.id}><span><b>{item.name}</b><small>Not suggested</small></span><button type="button" className="spz-link" onClick={() => onSetExerciseExcluded(item.id, false)}>Suggest again</button></li>)}</ul>}
    </details>}
    {recommendations && recommendations.kind !== "mapping_not_reviewed" && recommendations.alreadyCoveredBy.length > 0 && <div className="spz-covered">
      <p className="spz-note"><b>Already covered by</b></p>
      <ul className="spz-caveats">{recommendations.alreadyCoveredBy.map((item) => <li key={item.catalogExerciseId}>{coveredWords(item)}</li>)}</ul>
    </div>}
  </>;
}
