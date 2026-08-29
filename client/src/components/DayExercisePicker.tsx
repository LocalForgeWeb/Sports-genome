import { useMemo, useState } from "react";
import { ChevronDown, Dumbbell, Plus, Search, SlidersHorizontal } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import { matchesTrainingSplit, type TrainingSplit } from "@/lib/splitAssignment";
import { muscleLabels } from "@/components/AnatomyMap";
import { RateStackPanel } from "@/components/RateStackPanel";

type DayExercisePickerProps = {
  exercises: Exercise[];
  activeWorkout: Exercise[];
  split: TrainingSplit;
  onAdd: (exercise: Exercise) => void;
  onReplace: (outgoing: Exercise, incoming: Exercise) => void;
  onInspect: (exercise: Exercise) => void;
};

export function DayExercisePicker({ exercises, activeWorkout, split, onAdd, onReplace, onInspect }: DayExercisePickerProps) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<"split" | "all">("split");
  const [equipment, setEquipment] = useState("all");
  const [muscle, setMuscle] = useState("all");
  const equipmentOptions = useMemo(() => Array.from(new Set(exercises.map((exercise) => exercise.equipment))).sort(), [exercises]);
  const muscleOptions = useMemo(() => Array.from(new Set(exercises.flatMap((exercise) => exercise.primaryMuscles))).sort(), [exercises]);
  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return exercises.filter((exercise) => {
      const matchesQuery = !normalizedQuery || `${exercise.name} ${exercise.movement} ${[...exercise.primaryMuscles, ...exercise.secondaryMuscles].flatMap((muscleKey) => [muscleKey, muscleLabels[muscleKey] || muscleKey]).join(" ")}`.toLowerCase().includes(normalizedQuery);
      const matchesMuscle = muscle === "all" || exercise.primaryMuscles.includes(muscle) || exercise.secondaryMuscles.includes(muscle);
      return matchesQuery && matchesMuscle && (scope === "all" || matchesTrainingSplit(exercise, split)) && (equipment === "all" || exercise.equipment === equipment);
    }).slice(0, 12);
  }, [exercises, equipment, muscle, query, scope, split]);
  const existingCatalogIds = new Set(activeWorkout.map((exercise) => (exercise as Exercise & { catalogExerciseId?: number }).catalogExerciseId || exercise.id));

  return <section className="day-exercise-picker">
    <RateStackPanel workout={activeWorkout} catalog={exercises} split={split} onAdd={onAdd} onReplace={onReplace} />
    <details className="day-exercise-disclosure">
      <summary>
        <span><p className="metric-label">Add to this day</p><strong>Find an exercise</strong><small>Search, filter, then add from the catalog</small></span>
        <span className="day-exercise-disclosure-action">Browse <ChevronDown className="h-4 w-4" /></span>
      </summary>
      <div className="day-exercise-picker-content">
        <div className="day-exercise-picker-head"><div><p className="metric-label">Build this day yourself</p><h3>Add exercises directly</h3><p>Start with split-matched options, then switch to the full catalog when you want a deliberate exception.</p></div><Dumbbell className="h-5 w-5" /></div>
        <div className="day-picker-tools"><label><Search className="h-4 w-4" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${scope === "split" ? split : "all"} exercises`} /></label><select value={muscle} onChange={(event) => setMuscle(event.target.value)} aria-label="Filter day exercises by muscle group"><option value="all">All muscle groups</option>{muscleOptions.map((value) => <option key={value} value={value}>{muscleLabels[value] || value}</option>)}</select><select value={equipment} onChange={(event) => setEquipment(event.target.value)} aria-label="Filter day exercises by equipment"><option value="all">All equipment</option>{equipmentOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select><div className="day-picker-scope"><button onClick={() => setScope("split")} className={scope === "split" ? "day-picker-scope-active" : ""}><SlidersHorizontal className="h-3.5 w-3.5" /> {split} fit</button><button onClick={() => setScope("all")} className={scope === "all" ? "day-picker-scope-active" : ""}>All catalog</button></div></div>
        {muscle === "serratusAnterior" && <p className="day-picker-serratus-cue">Serratus anterior options are available: <strong>Cable Serratus Punch</strong> and <strong>Scapular Wall Slide</strong>. Both are permitted in the Push Day pool.</p>}
        <div className="day-picker-results">{results.map((exercise) => { const added = existingCatalogIds.has(exercise.id); return <div key={exercise.id} className="day-picker-result"><button onClick={() => onInspect(exercise)}><span>{String(exercise.id).padStart(3, "0")}</span><div><strong>{exercise.name}</strong><small>{exercise.movement} · {exercise.equipment}</small><em>{exercise.primaryMuscles.map((muscleKey) => muscleLabels[muscleKey] || muscleKey).join(" · ")}</em></div></button><button disabled={added} onClick={() => onAdd(exercise)} aria-label={`Add ${exercise.name} to this day`}>{added ? "Added" : <><Plus className="h-4 w-4" /> Add</>}</button></div>; })}</div>
        {!results.length && <p className="day-picker-empty">No exercises match this setup. Clear a filter or search the full catalog.</p>}
      </div>
    </details>
  </section>;
}
