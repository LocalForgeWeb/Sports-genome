import { useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, ListTree } from "lucide-react";
import type { SportMovementProfile, SportProfile } from "@/lib/sportMovementDatabase";
import { getAdjacentMovement } from "@/lib/bodyLabNavigation";
import "../body-lab-navigator.css";

/**
 * What the body map is showing, and the control that changes it.
 *
 * This was a 386px card: a heading, a sentence explaining that a sport action
 * is not an exercise, a second heading captioning the pickers, two selects,
 * Previous/Next, a full-width orange browse button, and a line counting the
 * action's position. Measured on a 390px phone, the body itself began at
 * 968px — more than a full screen below the fold. An athlete opening a body
 * map did not see a body.
 *
 * The map is the point of the page, so everything above it has to earn its
 * height. What survives is the page's name, the sport and action being shown
 * as one line, and Change - which opens the two pickers, stepping and browse
 * only when the athlete means to use them.
 */
export function BodyLabNavigator({ sports, activeSportId, movements, selectedMovement, onSport, onMovement, onOpenAtlas }: { sports: SportProfile[]; activeSportId: string; movements: SportMovementProfile[]; selectedMovement: SportMovementProfile; onSport: (sportId: string) => void; onMovement: (movement: SportMovementProfile) => void; onOpenAtlas: () => void }) {
  const [changing, setChanging] = useState(false);
  const previous = getAdjacentMovement(movements, selectedMovement.id, -1);
  const next = getAdjacentMovement(movements, selectedMovement.id, 1);
  const sportLabel = sports.find((sport) => sport.id === activeSportId)?.label || "";

  return <section className="body-lab-navigator body-lab-selection" aria-label="Selected sport action">
    <div className="body-lab-selection-head">
      <h1>Body Lab</h1>
      <p className="body-lab-selection-context">
        <span className="body-lab-selection-sport">{sportLabel}</span>
        <i aria-hidden="true">/</i>
        <span className="body-lab-selection-action">{selectedMovement.label}</span>
        <button type="button" className="body-lab-selection-change" aria-expanded={changing} aria-controls="body-lab-selection-controls" onClick={() => setChanging((current) => !current)}>{changing ? "Done" : "Change"} <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
      </p>
    </div>

    {changing && <div id="body-lab-selection-controls" className="body-lab-selection-controls">
      <label>
        <span>Sport</span>
        <select value={activeSportId} onChange={(event) => onSport(event.target.value)}>
          {sports.map((sport) => <option key={sport.id} value={sport.id}>{sport.label}</option>)}
        </select>
      </label>
      <label>
        <span>Action</span>
        <select value={selectedMovement.id} onChange={(event) => { const movement = movements.find((item) => item.id === event.target.value); if (movement) onMovement(movement); }}>
          {movements.map((movement) => <option key={movement.id} value={movement.id}>{movement.label}</option>)}
        </select>
      </label>
      <div className="body-lab-navigator-actions">
        <button type="button" onClick={() => previous && onMovement(previous)} aria-label="Previous sport action"><ChevronLeft className="h-4 w-4" /></button>
        <button type="button" onClick={() => next && onMovement(next)} aria-label="Next sport action"><ChevronRight className="h-4 w-4" /></button>
        <button type="button" onClick={onOpenAtlas}><ListTree className="h-4 w-4" /> All {movements.length}</button>
      </div>
    </div>}
  </section>;
}
