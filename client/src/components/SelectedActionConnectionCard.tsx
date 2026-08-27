import type { Exercise } from "@/lib/exerciseCatalog";
import type { EnrichedSportMovement } from "@/lib/enrichedSportMovementDatabase";
import type { SportMovementProfile } from "@/lib/sportMovementDatabase";
import { getExerciseActionConnection } from "@/lib/movementProgramAnalysis";

export function SelectedActionConnectionCard({ exercise, selectedMovement, enrichedSelectedMovement }: { exercise: Exercise; selectedMovement: SportMovementProfile; enrichedSelectedMovement?: EnrichedSportMovement }) {
  const connection = getExerciseActionConnection(exercise, enrichedSelectedMovement);
  return <section className="inspection-action-connection"><div><p className="metric-label !text-[#9eb3cb]">Selected-action mapping</p><p className="mt-1 font-display text-2xl font-bold uppercase leading-none text-white">{selectedMovement.label}</p></div><div><span className={`inspection-action-connection-label inspection-action-connection-${connection.label.toLowerCase().replace(/\s+/g, "-")}`}>{connection.label}</span><p className="mt-3 text-sm leading-6 text-[#d1dce7]">{connection.detail} This is a catalog mapping and gym-support signal, not evidence of direct skill or performance transfer.</p></div></section>;
}
