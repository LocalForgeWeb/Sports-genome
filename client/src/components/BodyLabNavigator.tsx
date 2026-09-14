import { ChevronLeft, ChevronRight, ListTree } from "lucide-react";
import type { SportMovementProfile, SportProfile } from "@/lib/sportMovementDatabase";
import { getAdjacentMovement } from "@/lib/bodyLabNavigation";
import "../body-lab-navigator.css";

/**
 * The Body Lab selection header: what the body map is currently showing, and
 * the control that changes it, as one object.
 *
 * Previously these were two separate cards — a title card reading
 * "PENETRATION STEP" and, below it, an unlabelled pair of selects whose own
 * heading was `display: none` under 640px. Nothing connected the two, nothing
 * said the selected thing was a sport action rather than an exercise, and the
 * field labels rendered at 8.6px.
 *
 * "Body Lab anatomical interaction and mode contract": "Off-body panels must
 * explicitly identify and visually coordinate with their anatomical referent"
 * and "Keep the first action layer small and task-ranked; progressive
 * disclosure is for secondary actions, not hiding the likely next action."
 * "Cross-surface information-depth grammar contract": Scan "carries the minimum
 * truthful state/priority/next-step gist".
 */
export function BodyLabNavigator({ sports, activeSportId, movements, selectedMovement, onSport, onMovement, onOpenAtlas }: { sports: SportProfile[]; activeSportId: string; movements: SportMovementProfile[]; selectedMovement: SportMovementProfile; onSport: (sportId: string) => void; onMovement: (movement: SportMovementProfile) => void; onOpenAtlas: () => void }) {
  const previous = getAdjacentMovement(movements, selectedMovement.id, -1);
  const next = getAdjacentMovement(movements, selectedMovement.id, 1);
  const sportLabel = sports.find((sport) => sport.id === activeSportId)?.label || "";
  const position = movements.findIndex((movement) => movement.id === selectedMovement.id);

  return <section className="body-lab-navigator body-lab-selection" aria-label="Selected sport action">
    <div className="body-lab-selection-head">
      <p className="metric-label">Body Lab is showing · Sport action</p>
      <h1>{selectedMovement.label}</h1>
      <p className="body-lab-selection-context">{[sportLabel, selectedMovement.family].filter(Boolean).join(" · ")}</p>
      {/* Names the object type outright: athletes read a body map and assume the
          thing driving it is an exercise. */}
      <p className="body-lab-selection-explainer">
        This is a sport action, not a single exercise. The map below colours the muscles this action uses — tap one to see its role.
      </p>
    </div>

    <div className="body-lab-selection-controls">
      <p className="metric-label" id="body-lab-change-selection">Change what the map shows</p>
      <div className="body-lab-selection-fields">
        <label>
          <span>Sport</span>
          <select value={activeSportId} onChange={(event) => onSport(event.target.value)}>
            {sports.map((sport) => <option key={sport.id} value={sport.id}>{sport.label}</option>)}
          </select>
        </label>
        <label>
          <span>Sport action</span>
          <select value={selectedMovement.id} onChange={(event) => { const movement = movements.find((item) => item.id === event.target.value); if (movement) onMovement(movement); }}>
            {movements.map((movement) => <option key={movement.id} value={movement.id}>{movement.label}</option>)}
          </select>
        </label>
      </div>
      <div className="body-lab-navigator-actions" aria-describedby="body-lab-change-selection">
        <button onClick={() => previous && onMovement(previous)} aria-label="Previous sport action"><ChevronLeft className="h-4 w-4" /> Previous</button>
        <button onClick={() => next && onMovement(next)} aria-label="Next sport action">Next <ChevronRight className="h-4 w-4" /></button>
        <button onClick={onOpenAtlas}><ListTree className="h-4 w-4" /> Browse all {movements.length}</button>
      </div>
      {position >= 0 && <p className="body-lab-selection-position">Action {position + 1} of {movements.length} for {sportLabel}</p>}
    </div>
  </section>;
}
