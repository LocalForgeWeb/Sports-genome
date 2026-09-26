import { ArrowRight } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import type { EnrichedSportMovement } from "@/lib/enrichedSportMovementDatabase";
import type { SportMovementProfile } from "@/lib/sportMovementDatabase";
import { getExerciseActionConnection } from "@/lib/movementProgramAnalysis";

/**
 * The selected sport action, and what this exercise is to it. A "Supporting
 * link" is a shared assisting or stabilizing demand, not demonstrated transfer,
 * and the copy says so. `onOpenAction` is the way to the action itself.
 */
export function SelectedActionConnectionCard({ exercise, selectedMovement, enrichedSelectedMovement, onOpenAction }: { exercise: Exercise; selectedMovement: SportMovementProfile; enrichedSelectedMovement?: EnrichedSportMovement; onOpenAction?: () => void }) {
  const connection = getExerciseActionConnection(exercise, enrichedSelectedMovement);
  return <section className="inspection-action-connection" aria-label="Sport context"><div><p className="metric-label">Sport context</p><p className="inspection-action-connection-action">{selectedMovement.label}</p></div><div><span className={`inspection-action-connection-label inspection-action-connection-${connection.label.toLowerCase().replace(/\s+/g, "-")}`}>{connection.label}</span><p className="inspection-action-connection-detail">{connection.detail} This is a catalog mapping and gym-support signal, not evidence of direct skill or performance transfer.</p>{onOpenAction && <button type="button" className="inspection-action-connection-open" onClick={onOpenAction}>Open this action <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>}</div></section>;
}
