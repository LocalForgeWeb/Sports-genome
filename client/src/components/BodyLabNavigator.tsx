import { ChevronLeft, ChevronRight, ListTree } from "lucide-react";
import type { SportMovementProfile, SportProfile } from "@/lib/sportMovementDatabase";
import { getAdjacentMovement } from "@/lib/bodyLabNavigation";
import "../body-lab-navigator.css";

export function BodyLabNavigator({ sports, activeSportId, movements, selectedMovement, onSport, onMovement, onOpenAtlas }: { sports: SportProfile[]; activeSportId: string; movements: SportMovementProfile[]; selectedMovement: SportMovementProfile; onSport: (sportId: string) => void; onMovement: (movement: SportMovementProfile) => void; onOpenAtlas: () => void }) {
  const previous = getAdjacentMovement(movements, selectedMovement.id, -1);
  const next = getAdjacentMovement(movements, selectedMovement.id, 1);
  return <section className="body-lab-navigator" aria-label="Body Lab movement navigation"><div><p className="metric-label">Movement navigator</p><strong>Keep exploring without leaving Body Lab.</strong></div><label><span>Sport</span><select value={activeSportId} onChange={(event) => onSport(event.target.value)}>{sports.map((sport) => <option key={sport.id} value={sport.id}>{sport.label}</option>)}</select></label><label><span>Sport action</span><select value={selectedMovement.id} onChange={(event) => { const movement = movements.find((item) => item.id === event.target.value); if (movement) onMovement(movement); }}>{movements.map((movement) => <option key={movement.id} value={movement.id}>{movement.label}</option>)}</select></label><div className="body-lab-navigator-actions"><button onClick={() => previous && onMovement(previous)} aria-label="Previous sport action"><ChevronLeft className="h-4 w-4" /> Previous</button><button onClick={() => next && onMovement(next)} aria-label="Next sport action">Next <ChevronRight className="h-4 w-4" /></button><button onClick={onOpenAtlas}><ListTree className="h-4 w-4" /> All movements</button></div></section>;
}
