import { useMemo, useState } from "react";
import { ArrowUpRight, ChevronDown, Search } from "lucide-react";
import type { SportMovementProfile, SportProfile } from "@/lib/sportMovementDatabase";
import { sportEvidenceCoverage } from "@/lib/evidenceCoverage";
import { buildMovementReasoning, getSportModifiers } from "@/lib/hierarchicalSportModel";

/** Modern Kinetic Field Manual: one action decision first; research evidence unfolds only on demand. */
export function filterAtlasMovements(movements: SportMovementProfile[], query: string, family: string) {
  const normalized = query.trim().toLowerCase();
  return movements.filter((movement) => (family === "All" || movement.family === family) && (!normalized || `${movement.label} ${movement.family} ${movement.bodyActions} ${movement.primaryMuscles}`.toLowerCase().includes(normalized)));
}

export function MovementAtlasPanel({ sportName, sportId, sports, movements, selectedMovement, query, family, onQuery, onFamily, onSport, onMovement, onOpenBody }: { sportName: string; sportId: string; sports: SportProfile[]; movements: SportMovementProfile[]; selectedMovement: SportMovementProfile; query: string; family: string; onQuery: (value: string) => void; onFamily: (value: string) => void; onSport: (sportId: string) => void; onMovement: (movement: SportMovementProfile) => void; onOpenBody: () => void }) {
  const [showAllFamilies, setShowAllFamilies] = useState(false);
  const [showAllActions, setShowAllActions] = useState(false);
  const [modifierId, setModifierId] = useState("");
  const evidence = sportEvidenceCoverage(sportId);
  const modifiers = useMemo(() => getSportModifiers(sportId), [sportId]);
  const reasoning = useMemo(() => buildMovementReasoning(selectedMovement, modifierId || undefined), [selectedMovement, modifierId]);
  const families = useMemo(() => Array.from(new Set(movements.map((movement) => movement.family))).sort(), [movements]);
  const visible = filterAtlasMovements(movements, query, family);
  const shownFamilies = showAllFamilies ? families : families.slice(0, 5);
  const shownActions = showAllActions ? visible : visible.slice(0, 7);

  return <section className="movement-atlas-improved">
    <header className="atlas-improved-head">
      <div>
        <p className="metric-label">05 / movement atlas</p>
        <h1>Find the action.<br /><em>Then train it.</em></h1>
        <p>Search {sportName} actions by movement or muscle, then open only the detail you need.</p>
      </div>
      <div className="atlas-inventory"><strong>{visible.length}</strong><span>matching actions<br />{movements.length} for this sport</span></div>
    </header>

    <div className="atlas-tool-row">
      <div className="atlas-tool-main">
        <div className="atlas-sport-select"><span>Sport lens</span><select value={sportId} onChange={(event) => { onSport(event.target.value); setModifierId(""); setShowAllActions(false); }} aria-label="Choose sport">{sports.map((sport) => <option key={sport.id} value={sport.id}>{sport.label}</option>)}</select></div>
        {modifiers.length > 0 && <div className="atlas-sport-select"><span>Position / event / style</span><select value={modifierId} onChange={(event) => setModifierId(event.target.value)} aria-label="Choose a sport modifier"><option value="">General profile</option>{modifiers.map((modifier) => <option key={modifier.id} value={modifier.id}>{modifier.label}</option>)}</select></div>}
        <label><Search className="h-4 w-4" /><input value={query} onChange={(event) => { onQuery(event.target.value); setShowAllActions(false); }} placeholder="Search an action or muscle" aria-label="Search sport actions" /></label>
      </div>
      <div className="atlas-family-row"><button onClick={() => onFamily("All")} aria-pressed={family === "All"}>All actions</button>{shownFamilies.map((item) => <button key={item} onClick={() => onFamily(item)} aria-pressed={family === item}>{item}</button>)}{families.length > 5 && <button className="atlas-more-filter" onClick={() => setShowAllFamilies((value) => !value)}>{showAllFamilies ? "Fewer filters" : `+${families.length - 5} filters`}</button>}</div>
    </div>

    <div className="atlas-analysis-grid">
      <div className="atlas-action-list" aria-label="Sport actions">
        {shownActions.length ? <>{shownActions.map((movement, index) => <button key={movement.id} onClick={() => onMovement(movement)} aria-pressed={movement.id === selectedMovement.id} className="atlas-action-item"><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{movement.label}</strong><small>{movement.family}</small></div><ArrowUpRight className="h-4 w-4" /></button>)}{visible.length > 7 && <button className="atlas-show-more" onClick={() => setShowAllActions((value) => !value)}>{showAllActions ? "Show fewer actions" : `Show all ${visible.length} actions`}<ChevronDown className={`h-4 w-4 ${showAllActions ? "rotate-180" : ""}`} /></button>}</> : <div className="atlas-empty"><strong>No actions match this filter.</strong><p>Clear the filter or try a broader muscle or action term.</p></div>}
      </div>
      <article className="atlas-focus-card">
        <p className="metric-label">Selected action</p>
        <h2>{selectedMovement.label}</h2>
        <p>{selectedMovement.bodyActions}</p>
        <div className="atlas-quick-read"><span>Prime movers</span><strong>{selectedMovement.primaryMuscles}</strong></div>
        <details className="atlas-details"><summary>Why this action matters <ChevronDown className="h-4 w-4" /></summary><dl><div><dt>Stabilizers</dt><dd>{selectedMovement.stabilizers}</dd></div><div><dt>Training transfer</dt><dd>{selectedMovement.gymTransferCue}</dd></div></dl></details>
        <details className="atlas-details"><summary>Sport → program reasoning <ChevronDown className="h-4 w-4" /></summary><dl><div><dt>Sport context</dt><dd>{reasoning.sport} · {reasoning.modifier}</dd></div><div><dt>Modifier evidence scope</dt><dd>{reasoning.modifierEvidenceScope}</dd></div><div><dt>Modifier sources</dt><dd>{reasoning.modifierEvidenceSources.join(" ")}</dd></div><div><dt>Movement demand</dt><dd>{reasoning.biomechanics}</dd></div><div><dt>Physiological demand</dt><dd>{reasoning.physiologicalDemands.join(" · ")}</dd></div><div><dt>Priority qualities</dt><dd>{reasoning.physicalQualities.join(" · ")}</dd></div><div><dt>Target adaptations</dt><dd>{reasoning.adaptations.join(" · ")}</dd></div><div><dt>Modality choice</dt><dd>{reasoning.modality}</dd></div><div><dt>Exercise role</dt><dd>{reasoning.exerciseRole} {reasoning.exerciseBoundary}</dd></div><div><dt>Programming context</dt><dd>{reasoning.programming}</dd></div></dl><p>{reasoning.evidenceBoundary}</p></details>
        <details className="atlas-details atlas-evidence-boundary"><summary>Evidence and data boundary <ChevronDown className="h-4 w-4" /></summary><p><strong>{evidence.confidence} evidence coverage.</strong> {evidence.sourceRange}</p><p>{evidence.directScope}</p><p>Body actions summarize sport biomechanics and technical analysis. Listed muscles are likely, phase-dependent contributors—not direct activation readings or a fixed ranking for every athlete. {evidence.planningBoundary}</p></details>
        <button onClick={onOpenBody}>Trace in Body Lab <ArrowUpRight className="h-4 w-4" /></button>
      </article>
    </div>
  </section>;
}
