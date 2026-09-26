import { useMemo, useState } from "react";
import { LocalSearchScope } from "@/components/LocalSearchScope";
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import type { SportMovementProfile, SportProfile } from "@/lib/sportMovementDatabase";
import { sportEvidenceCoverage } from "@/lib/evidenceCoverage";
import { buildMovementReasoning, getSportModifiers } from "@/lib/hierarchicalSportModel";
import { emitInteractionFeedback } from "@/lib/interactionFeedback";

export function filterAtlasMovements(movements: SportMovementProfile[], query: string, family: string) {
  const normalized = query.trim().toLowerCase();
  return movements.filter((movement) => (family === "All" || movement.family === family) && (!normalized || `${movement.label} ${movement.family} ${movement.bodyActions} ${movement.primaryMuscles}`.toLowerCase().includes(normalized)));
}
export function sortAtlasMovements(movements: SportMovementProfile[], sort: "recommended" | "a-z" | "family") {
  if (sort === "a-z") return [...movements].sort((a, b) => a.label.localeCompare(b.label));
  if (sort === "family") return [...movements].sort((a, b) => a.family.localeCompare(b.family) || a.label.localeCompare(b.label));
  return movements;
}
function shortFamilyLabel(family: string) {
  const labels: Record<string, string> = { "anti-underhook and rotational clinch": "Clinch", "base recovery and positional reset": "Recovery", "level change and linear entry": "Takedowns", "bilateral takedown and horizontal force": "Takedowns", "unilateral takedown and anti-rotation": "Takedowns" };
  return labels[family] ?? family.replace(/ and .*/i, "").replace(/movement/ig, "").trim();
}

/**
 * The Movement Atlas, one column: the sport, the selected action with its
 * position in the list and a way to step through it, what the record says the
 * body does, why it matters (the record's own transfer cue), the way into Body
 * Lab, then the actions to explore and the demand model behind a line.
 *
 * It was a display headline in a gradient band, a tools card, a scrolling list
 * card and a "focus card" of the selected action - the action named in the
 * list and again in the card, with three disclosures inside the card.
 *
 * The reference draws a technical figure of the action beside the name. No
 * verified media exists for any action in this build
 * (docs/design-handoff/missing-illustrations.md), so nothing stands in for it:
 * a generated pose is not a coaching diagram.
 */
export function MovementAtlasPanel({ sportName, sportId, sports, movements, selectedMovement, query, family, onQuery, onFamily, onSport, onMovement, onOpenBody }: { sportName: string; sportId: string; sports: SportProfile[]; movements: SportMovementProfile[]; selectedMovement: SportMovementProfile; query: string; family: string; onQuery: (value: string) => void; onFamily: (value: string) => void; onSport: (sportId: string) => void; onMovement: (movement: SportMovementProfile) => void; onOpenBody: () => void }) {
  const [showAllFamilies, setShowAllFamilies] = useState(false);
  const [showAllActions, setShowAllActions] = useState(false);
  const [modifierId, setModifierId] = useState("");
  const [sort, setSort] = useState<"recommended" | "a-z" | "family">("recommended");
  const evidence = sportEvidenceCoverage(sportId);
  const modifiers = useMemo(() => getSportModifiers(sportId), [sportId]);
  const reasoning = useMemo(() => buildMovementReasoning(selectedMovement, modifierId || undefined), [selectedMovement, modifierId]);
  const families = useMemo(() => Array.from(new Set(movements.map((movement) => movement.family))).sort(), [movements]);
  const visible = sortAtlasMovements(filterAtlasMovements(movements, query, family), sort);
  const shownFamilies = showAllFamilies ? families : families.slice(0, 4);
  const shownActions = showAllActions ? visible : visible.slice(0, 7);
  /**
   * Where the selected action sits in the list being shown, so "03 / 08" and
   * the arrows mean the same list the athlete can see. An action filtered out
   * of the list has no position, and the arrows step from the list's start.
   */
  const position = visible.findIndex((movement) => movement.id === selectedMovement.id);
  const previous = position > 0 ? visible[position - 1] : null;
  const next = position >= 0 && position < visible.length - 1 ? visible[position + 1] : position < 0 ? visible[0] ?? null : null;
  const step = (movement: SportMovementProfile | null) => { if (!movement) return; emitInteractionFeedback(); onMovement(movement); };

  return <section className="movement-atlas-improved">
    <header className="atlas-improved-head"><div><h1>Movement Atlas</h1><p className="atlas-quiet-context">Explore how your sport moves.</p><p>{sportName} movement discovery</p></div></header>
    <div className="atlas-compact-selects">
      <label className="atlas-sport-select"><span className="sr-only">Sport</span><select value={sportId} onChange={(event) => { emitInteractionFeedback(); onSport(event.target.value); setModifierId(""); setShowAllActions(false); }} aria-label="Choose sport">{sports.map((sport) => <option key={sport.id} value={sport.id}>{sport.label}</option>)}</select><ChevronDown className="h-4 w-4" aria-hidden="true" /></label>
      {modifiers.length > 0 && <label className="atlas-sport-select"><span className="sr-only">Role, event or style</span><select value={modifierId} onChange={(event) => { emitInteractionFeedback(); setModifierId(event.target.value); }} aria-label="Choose a sport modifier"><option value="">General profile</option>{modifiers.map((modifier) => <option key={modifier.id} value={modifier.id}>{modifier.label}</option>)}</select><ChevronDown className="h-4 w-4" aria-hidden="true" /></label>}
    </div>

    <div className="atlas-selected">
      <p className="metric-label">{shortFamilyLabel(selectedMovement.family)}</p>
      <h2>{selectedMovement.label}</h2>
      <div className="atlas-stepper" role="group" aria-label="Step through actions">
        <button type="button" onClick={() => step(previous)} disabled={!previous} aria-label="Previous action"><ChevronLeft className="h-5 w-5" aria-hidden="true" /></button>
        <span aria-live="polite">{position >= 0 ? <><b>{String(position + 1).padStart(2, "0")}</b> / {String(visible.length).padStart(2, "0")}</> : <>Not in this list</>}</span>
        <button type="button" onClick={() => step(next)} disabled={!next} aria-label="Next action"><ChevronRight className="h-5 w-5" aria-hidden="true" /></button>
      </div>
    </div>

    <dl className="atlas-meta">
      <div><dt>Body actions</dt><dd>{selectedMovement.bodyActions}</dd></div>
      <div><dt>Prime movers</dt><dd>{selectedMovement.primaryMuscles}</dd></div>
      <div><dt>Muscle actions</dt><dd>{selectedMovement.muscleActions}</dd></div>
    </dl>

    <section className="atlas-why" aria-label="Why it matters">
      <h3>Why it matters</h3>
      <p>{selectedMovement.gymTransferCue}</p>
    </section>
    <button type="button" className="atlas-trace" onClick={() => { emitInteractionFeedback(); onOpenBody(); }}>Trace in Body Lab <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>

    <section className="atlas-explore" aria-label="Sport actions">
      <h3>Explore actions</h3>
      <div className="atlas-tools">
        <label className="atlas-search"><Search className="h-4 w-4" aria-hidden="true" /><input value={query} onChange={(event) => { onQuery(event.target.value); setShowAllActions(false); }} placeholder="Search an action or muscle" aria-label="Search sport actions" /></label>
        <LocalSearchScope scope={`Searching ${movements.length} ${sportName} actions.`} query={query} />
        <div className="atlas-family-row"><button type="button" onClick={() => { emitInteractionFeedback(); onFamily("All"); }} aria-pressed={family === "All"}>All</button>{shownFamilies.map((item) => <button type="button" key={item} onClick={() => { emitInteractionFeedback(); onFamily(item); }} aria-pressed={family === item}>{shortFamilyLabel(item)}</button>)}{families.length > 4 && <button type="button" className="atlas-more-filter" onClick={() => { emitInteractionFeedback(); setShowAllFamilies((value) => !value); }}><SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />{showAllFamilies ? "Less" : "Filters"}</button>}</div>
        <div className="atlas-list-meta"><span>{visible.length} {visible.length === 1 ? "movement" : "movements"}</span><label>Sort<select aria-label="Sort movements" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}><option value="recommended">Recommended</option><option value="a-z">A–Z</option><option value="family">Movement family</option></select></label></div>
      </div>
      {shownActions.length
        ? <><ol className="atlas-actions">{shownActions.map((movement) => <li key={movement.id}><button type="button" onClick={() => { emitInteractionFeedback(); onMovement(movement); }} aria-pressed={movement.id === selectedMovement.id} className="atlas-action-item"><i className="atlas-action-marker" aria-hidden="true" /><strong>{movement.label}</strong><ChevronRight className="h-4 w-4" aria-hidden="true" /></button></li>)}</ol>{visible.length > 7 && <button type="button" className="atlas-show-more" onClick={() => { emitInteractionFeedback(); setShowAllActions((value) => !value); }}>{showAllActions ? "Show fewer actions" : `Show all ${visible.length} actions`}<ChevronDown className={`h-4 w-4 ${showAllActions ? "rotate-180" : ""}`} aria-hidden="true" /></button>}</>
        : <div className="atlas-empty"><strong>No actions match this filter.</strong><p>Clear the filter or try a broader muscle or action term.</p></div>}
    </section>

    {/* The demand model and its provenance, each behind its own line. */}
    <details className="atlas-details"><summary>Movement demands <ChevronDown className="h-4 w-4" aria-hidden="true" /></summary><dl><div><dt>Stabilizers</dt><dd>{selectedMovement.stabilizers}</dd></div><div><dt>Sport context</dt><dd>{reasoning.sport} · {reasoning.modifier}</dd></div><div><dt>Movement demand</dt><dd>{reasoning.biomechanics}</dd></div><div><dt>Physiological demand</dt><dd>{reasoning.physiologicalDemands.join(" · ")}</dd></div><div><dt>Priority qualities</dt><dd>{reasoning.physicalQualities.join(" · ")}</dd></div><div><dt>Target adaptations</dt><dd>{reasoning.adaptations.join(" · ")}</dd></div><div><dt>Modality choice</dt><dd>{reasoning.modality}</dd></div><div><dt>Exercise role</dt><dd>{reasoning.exerciseRole} {reasoning.exerciseBoundary}</dd></div><div><dt>Programming context</dt><dd>{reasoning.programming}</dd></div><div><dt>Modifier evidence scope</dt><dd>{reasoning.modifierEvidenceScope}</dd></div><div><dt>Modifier sources</dt><dd>{reasoning.modifierEvidenceSources.join(" ")}</dd></div></dl><p>{reasoning.evidenceBoundary}</p></details>
    <details className="atlas-details atlas-evidence-boundary"><summary>Where this comes from <ChevronDown className="h-4 w-4" aria-hidden="true" /></summary><p><strong>{evidence.confidence} evidence coverage.</strong> {evidence.sourceRange}</p><p>{evidence.directScope}</p><p>Body actions summarize sport biomechanics and technical analysis. Listed muscles are likely, phase-dependent contributors—not direct activation readings or a fixed ranking for every athlete. {evidence.planningBoundary}</p></details>
  </section>;
}
