import { ArrowRight, ChevronDown } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import type { EnrichedSportMovement } from "@/lib/enrichedSportMovementDatabase";
import type { SportMovementProfile } from "@/lib/sportMovementDatabase";
import { getExerciseActionConnection, supportMatchMethod } from "@/lib/movementProgramAnalysis";
import { movementDisplayLabel } from "@/lib/movementLabel";

/**
 * The selected sport action, and what this exercise is to it: its movement
 * support tier (movement-specific, related pattern or muscle support) and the
 * reason. None of the three is demonstrated transfer, and the copy says so.
 * "How this match was made", closed, says which rule placed it and how
 * confident the movement record is, from how many sources. `onOpenAction` is
 * the way to the action itself.
 */
export function SelectedActionConnectionCard({ exercise, selectedMovement, enrichedSelectedMovement, onOpenAction }: { exercise: Exercise; selectedMovement: SportMovementProfile; enrichedSelectedMovement?: EnrichedSportMovement; onOpenAction?: () => void }) {
  const connection = getExerciseActionConnection(exercise, enrichedSelectedMovement);
  const method = enrichedSelectedMovement ? supportMatchMethod(exercise, enrichedSelectedMovement) : null;
  return <section className="inspection-action-connection" aria-label="Sport context"><div><p className="metric-label">Sport context</p><p className="inspection-action-connection-action">{movementDisplayLabel(selectedMovement.label)}</p></div><div><span className={`inspection-action-connection-label inspection-action-connection-${connection.label.toLowerCase().replace(/\s+/g, "-")}`}>{connection.label}</span><p className="inspection-action-connection-detail">{connection.detail} This is a catalog mapping and gym-support signal, not evidence of direct skill or performance transfer.</p>{method && <details className="inspection-action-connection-how"><summary>How this match was made <ChevronDown className="h-4 w-4" aria-hidden="true" /></summary><p>{method}</p></details>}{onOpenAction && <button type="button" className="inspection-action-connection-open" onClick={onOpenAction}>Open this action <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>}</div></section>;
}
