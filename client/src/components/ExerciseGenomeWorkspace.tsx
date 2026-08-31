import { Activity, ArrowUpRight, ChevronRight, Dna, Search } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import type { SportMovementProfile } from "@/lib/sportMovementDatabase";
import type { EnrichedSportMovement } from "@/lib/enrichedSportMovementDatabase";
import { getExerciseActionConnection } from "@/lib/movementProgramAnalysis";
import { ExerciseGenomePanel } from "@/components/ExerciseGenomePanel";
import { trpc } from "@/lib/trpc";

type Props = {
  exercises: Exercise[];
  selectedExercise: Exercise;
  selectedMovement: SportMovementProfile;
  enrichedSelectedMovement?: EnrichedSportMovement;
  currentWorkout: Exercise[];
  goal: string;
  query: string;
  onQueryChange: (query: string) => void;
  onSelectExercise: (exerciseId: number) => void;
  onOpenBody: (muscle: string) => void;
  onInspect: (exercise: Exercise) => void;
};

export function ExerciseGenomeWorkspace({
  exercises,
  selectedExercise,
  selectedMovement,
  enrichedSelectedMovement,
  currentWorkout,
  goal,
  query,
  onQueryChange,
  onSelectExercise,
  onOpenBody,
  onInspect,
}: Props) {
  const connectedEvidence = trpc.researchEvidence.supabaseExercise.useQuery(
    { catalogExerciseId: selectedExercise.id },
    { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false }
  );
  const connectedInventory = trpc.researchEvidence.supabaseInventory.useQuery(
    undefined,
    { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false }
  );
  return <section className="exercise-genome-workspace space-y-5">
    <div className="view-header"><div><p className="metric-label">Exercise Genome laboratory</p><h1 className="mt-2 font-display text-5xl font-bold uppercase leading-[.82] text-[#17231f]">The exercise<br /><em className="text-[#2d6cdf]">intelligence layer.</em></h1></div><div className="view-header-note"><Dna className="h-5 w-5 text-[#2d6cdf]" /><p>{connectedInventory.data?.status === "connected" ? `${connectedInventory.data.localCatalogLinks} catalog exercises are linked to ${connectedInventory.data.studies} source records and ${connectedInventory.data.strengthNorms} source norm rows.` : "Intrinsic mechanics meet the selected sport action, goal, and current workout—not a single generic exercise score."}</p></div></div>
    <div className="grid gap-5 xl:grid-cols-[280px_1fr]">
      <aside className="dark-panel overflow-hidden"><div className="border-b border-white/10 p-4"><p className="metric-label !text-[#9eb3cb]">Explore {exercises.length} exercises</p><label className="mt-3 flex items-center gap-2 border border-white/15 bg-white/5 px-2"><Search className="h-3.5 w-3.5 text-[#a7b8ca]" /><input value={query} onChange={(event) => onQueryChange(event.target.value)} className="h-9 w-full bg-transparent text-xs text-white outline-none placeholder:text-[#8195ab]" placeholder="Search the genome" /></label></div>
        <div className="max-h-[690px] overflow-y-auto p-2">{exercises.map((exercise) => { const connection = getExerciseActionConnection(exercise, enrichedSelectedMovement); return <button type="button" key={exercise.id} onClick={() => onSelectExercise(exercise.id)} aria-current={selectedExercise.id === exercise.id ? "true" : undefined} className={`genome-selector-row-v2 ${selectedExercise.id === exercise.id ? "genome-selector-row-v2-active" : ""}`}><span className="font-display text-lg font-bold">{String(exercise.id).padStart(3, "0")}</span><span className="min-w-0 text-left"><span className="block truncate text-xs font-bold">{exercise.name}</span><span className="mt-0.5 block truncate text-[10px] text-[#8ba0b6]">{exercise.movement}</span><span className={`genome-selector-connection genome-selector-connection-${connection.label.toLowerCase().replace(/\s+/g, "-")}`} title={connection.detail}>{connection.label} <i>· {selectedMovement.label}</i></span></span><ChevronRight className="h-3.5 w-3.5" /></button>; })}</div>
      </aside>
      <div><div className="light-panel p-5"><p className="metric-label">Selected exercise / contextual profile</p><div className="mt-2 flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-display text-4xl font-bold uppercase leading-none text-[#102947]">{selectedExercise.name}</h2><p className="mt-2 text-xs text-[#5d7389]">Use the Genome tabs to move from fast recognition, to mechanics, to why the recommendation changes for this stack.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => onOpenBody(selectedExercise.primaryMuscles[0] || "abs")} className="inline-flex items-center gap-2 border border-[#c98524] px-3 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#8e5d12] hover:bg-[#f4c76a] hover:text-[#142019]">Open leading muscle in Body Lab <Activity className="h-4 w-4" /></button><button type="button" onClick={() => onInspect(selectedExercise)} className="inline-flex items-center gap-2 border border-[#2d6cdf] px-3 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#2d6cdf] hover:bg-[#2d6cdf] hover:text-white">Open full detail <ArrowUpRight className="h-4 w-4" /></button></div></div></div><ExerciseGenomePanel exercise={selectedExercise} context={{ goal, currentWorkout, sportMovement: selectedMovement }} supabaseEvidence={connectedEvidence.data} /></div>
    </div>
  </section>;
}
