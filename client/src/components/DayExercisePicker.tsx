import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Dumbbell, Plus, Search, SlidersHorizontal } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import { matchesTrainingSplit, type TrainingSplit } from "@/lib/splitAssignment";
import { muscleLabels } from "@/components/AnatomyMap";
import { LocalSearchScope } from "@/components/LocalSearchScope";
import { RateStackPanel } from "@/components/RateStackPanel";
import { analyzeSplitStack } from "@/lib/splitStackAnalysis";
import { buildCoverageBars } from "@/lib/stackCoverageVisual";
import { pickerGapTargets, rankPickerResults } from "@/lib/pickerRanking";
import { distinguishingMuscles, gapTagIsInformative, muscleLineIsInformative, sharedRowMuscles } from "@/lib/pickerRowFacts";

type DayExercisePickerProps = {
  exercises: Exercise[];
  activeWorkout: Exercise[];
  split: TrainingSplit;
  /** The athlete's sport, so the stack can be read against its demand register. */
  sportId?: string;
  /** Prescriptions for the active day, so set volume is the real one, not a default. */
  prescriptions?: Record<number, string>;
  onAdd: (exercise: Exercise) => void;
  onReplace: (outgoing: Exercise, incoming: Exercise) => void;
  onInspect: (exercise: Exercise) => void;
  /**
   * Bumped when something elsewhere on the day asks to add an exercise. A counter rather
   * than a boolean, so a second ask scrolls again, and closing the picker afterwards is
   * not immediately undone by the same value still being true.
   */
  openSignal?: number;
};

const initialResultLimit = 24;

export function sortDayExerciseResults(results: Exercise[], muscle: string) {
  return [...results].sort((left, right) => {
    if (muscle !== "all") {
      const directDifference = Number(right.primaryMuscles.includes(muscle)) - Number(left.primaryMuscles.includes(muscle));
      if (directDifference) return directDifference;
      const supportingDifference = Number(right.secondaryMuscles.includes(muscle)) - Number(left.secondaryMuscles.includes(muscle));
      if (supportingDifference) return supportingDifference;
    }
    return left.name.localeCompare(right.name);
  });
}

export function DayExercisePicker({ exercises, activeWorkout, split, sportId, prescriptions, openSignal = 0, onAdd, onReplace, onInspect }: DayExercisePickerProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  /**
   * Open on an empty day. The disclosure was collapsed unconditionally, so
   * adding the first exercise to a new day meant scrolling past the analysis and
   * expanding a panel before anything could be searched. Uncontrolled after the
   * first render, so toggling it still sticks.
   */
  const [pickerOpen, setPickerOpen] = useState(activeWorkout.length === 0);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<"split" | "all">("split");
  const [equipment, setEquipment] = useState("all");
  const [muscle, setMuscle] = useState("all");
  const [resultLimit, setResultLimit] = useState(initialResultLimit);
  const equipmentOptions = useMemo(() => Array.from(new Set(exercises.map((exercise) => exercise.equipment))).sort(), [exercises]);
  const muscleOptions = useMemo(() => Array.from(new Set(exercises.flatMap((exercise) => exercise.primaryMuscles))).sort(), [exercises]);
  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matched = exercises.filter((exercise) => {
      const matchesQuery = !normalizedQuery || `${exercise.name} ${exercise.movement} ${[...exercise.primaryMuscles, ...exercise.secondaryMuscles].flatMap((muscleKey) => [muscleKey, muscleLabels[muscleKey] || muscleKey]).join(" ")}`.toLowerCase().includes(normalizedQuery);
      const matchesMuscle = muscle === "all" || exercise.primaryMuscles.includes(muscle) || exercise.secondaryMuscles.includes(muscle);
      return matchesQuery && matchesMuscle && (scope === "all" || matchesTrainingSplit(exercise, split)) && (equipment === "all" || exercise.equipment === equipment);
    });
    return sortDayExerciseResults(matched, muscle);
  }, [exercises, equipment, muscle, query, scope, split]);
  /**
   * The same shortfalls the coverage panel above is already showing. Computing
   * them here is what lets the list answer the panel instead of sitting beside
   * it sorted alphabetically.
   */
  const gaps = useMemo(
    () => pickerGapTargets(buildCoverageBars(analyzeSplitStack(activeWorkout, exercises, split).ratings)),
    [activeWorkout, exercises, split]
  );
  const ranked = useMemo(() => rankPickerResults(results, gaps), [gaps, results]);
  const visibleRanked = ranked.slice(0, resultLimit);
  /**
   * What the rows on screen actually have to say for themselves.
   *
   * The list's header already names what it is sorted by. A row that repeats it
   * is a caption printed twenty-four times: on an empty Push day every option
   * closed the same gap, so every row read "Closes Pectoralis major, 90 short"
   * and every row led with "PECTORALIS MAJOR". Both lines are shown only where
   * they differ between rows, which is the only way they help anyone choose.
   */
  // Everything the header prints, so a row is only stripped of what the reader
  // has already been told - on an empty day every muscle is short, and removing
  // all of them left every row with nothing to say.
  //
  // Both, not one or the other. The header leads with the day's shortfalls and
  // falls back to the muscle filter, while this stripped only the filter, so a
  // Legs day filtered to quadriceps printed "Gluteal complex and Rectus
  // abdominis first" at the top and then "Also Gluteal complex" on all
  // twenty-four rows underneath it.
  const sortedBy = Array.from(new Set([
    ...(muscle !== "all" ? [muscle] : []),
    ...gaps.slice(0, 2).map((gap) => gap.muscle),
  ]));
  const showGapTag = gapTagIsInformative(visibleRanked);
  // What most of these rows would otherwise each say for themselves. Stated
  // once, above the list, so the rows that differ are the only ones that speak.
  const visibleExercises = visibleRanked.map((result) => result.exercise);
  const shared = sharedRowMuscles(visibleExercises, sortedBy);
  // Everything the reader has been told by the time they reach a row: what the
  // list is sorted by, and what the line above says most of it shares.
  const alreadyNamed = [...sortedBy, ...shared.muscles];
  const showMuscleLine = muscleLineIsInformative(visibleExercises, alreadyNamed);

  const existingCatalogIds = new Set(activeWorkout.map((exercise) => (exercise as Exercise & { catalogExerciseId?: number }).catalogExerciseId || exercise.id));

  useEffect(() => { setResultLimit(initialResultLimit); }, [equipment, muscle, query, scope, split]);

  // Opening from elsewhere has to arrive somewhere useful: the panel in view, expanded,
  // with the cursor already in the search field.
  useEffect(() => {
    if (!openSignal) return;
    setPickerOpen(true);
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    const focusTimer = window.setTimeout(() => searchRef.current?.focus(), 320);
    return () => window.clearTimeout(focusTimer);
  }, [openSignal]);

  return <section className="day-exercise-picker" ref={sectionRef} id="day-exercise-picker">
    <RateStackPanel workout={activeWorkout} catalog={exercises} split={split} sportId={sportId} prescriptions={prescriptions} onAdd={onAdd} onReplace={onReplace} />
    <details className="day-exercise-disclosure" open={pickerOpen} onToggle={(event) => setPickerOpen((event.currentTarget as HTMLDetailsElement).open)}>
      <summary>
        <span><p className="metric-label">Add to this day</p><strong>{activeWorkout.length ? "Find an exercise" : "Start with your first exercise"}</strong><small>{gaps.length ? `Sorted to close ${muscleLabels[gaps[0].muscle] || gaps[0].muscle} first` : "Search, filter, then add from the catalog"}</small></span>
        <span className="day-exercise-disclosure-action">Browse <ChevronDown className="h-4 w-4" /></span>
      </summary>
      <div className="day-exercise-picker-content">
        <div className="day-exercise-picker-head"><div><p className="metric-label">Build this day yourself</p><h3>Add exercises directly</h3><p>Start with split-matched options, then switch to the full catalog when you want a deliberate exception.</p></div><Dumbbell className="h-5 w-5" /></div>
        {gaps.length > 0 && activeWorkout.length > 0 && <div className="day-picker-gaps"><span className="day-picker-gaps-label">Short in this day</span>{gaps.map((gap) => <button key={gap.muscle} type="button" onClick={() => setMuscle(muscle === gap.muscle ? "all" : gap.muscle)} className={muscle === gap.muscle ? "day-picker-gap day-picker-gap-active" : "day-picker-gap"} aria-pressed={muscle === gap.muscle}>{muscleLabels[gap.muscle] || gap.muscle}<i>{gap.deltaToTarget}</i></button>)}{muscle !== "all" && <button type="button" className="day-picker-gap-clear" onClick={() => setMuscle("all")}>Clear</button>}</div>}
        <div className="day-picker-tools"><label><Search className="h-4 w-4" /><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${scope === "split" ? split : "all"} exercises`} /></label><select value={muscle} onChange={(event) => setMuscle(event.target.value)} aria-label="Filter day exercises by muscle group"><option value="all">All muscle groups</option>{muscleOptions.map((value) => <option key={value} value={value}>{muscleLabels[value] || value}</option>)}</select><select value={equipment} onChange={(event) => setEquipment(event.target.value)} aria-label="Filter day exercises by equipment"><option value="all">All equipment</option>{equipmentOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select><div className="day-picker-scope"><button onClick={() => setScope("split")} className={scope === "split" ? "day-picker-scope-active" : ""}><SlidersHorizontal className="h-3.5 w-3.5" /> {split} fit</button><button onClick={() => setScope("all")} className={scope === "all" ? "day-picker-scope-active" : ""}>All catalog</button></div></div>
        <LocalSearchScope scope={`Searching ${scope === "split" ? `${split}-compatible` : "all catalog"} exercises.`} query={query} />
        <p className="day-picker-result-count" aria-live="polite"><strong>{results.length}</strong> option{results.length === 1 ? "" : "s"}{gaps.length > 0 ? ` · ${gaps.map((gap) => muscleLabels[gap.muscle] || gap.muscle).slice(0, 2).join(" and ")} first` : muscle !== "all" ? ` · direct ${muscleLabels[muscle] || muscle} targets first` : scope === "split" ? ` · ${split}-compatible` : " · full catalog"}{shared.muscles.length > 0 && <span className="day-picker-result-shared">{shared.everyRow ? "All of these also work" : "Most of these also work"} {shared.muscles.map((muscleKey) => (muscleLabels[muscleKey] || muscleKey).toLowerCase()).join(" and ")}.</span>}</p>
        {muscle === "serratusAnterior" && <p className="day-picker-serratus-cue">Serratus anterior options are available: <strong>Cable Serratus Punch</strong> and <strong>Scapular Wall Slide</strong>. Both are permitted in the Push Day pool.</p>}
        <div className="day-picker-results">{visibleRanked.map(({ exercise, fillsGap, supportsGap }) => { const added = existingCatalogIds.has(exercise.id); const directTarget = muscle !== "all" && exercise.primaryMuscles.includes(muscle); const extraMuscles = distinguishingMuscles(exercise, alreadyNamed); return <div key={exercise.id} className={`day-picker-result${directTarget ? " day-picker-result-direct" : ""}${showGapTag && fillsGap ? " day-picker-result-fills" : ""}`}><button onClick={() => onInspect(exercise)}><div><strong>{exercise.name}</strong><small>{exercise.movement} · {exercise.equipment}</small>{showMuscleLine && extraMuscles.length > 0 && <em>Also {extraMuscles.map((muscleKey) => muscleLabels[muscleKey] || muscleKey).join(" · ")}</em>}{showGapTag ? (fillsGap ? <b className="day-picker-fills-tag">Closes {muscleLabels[fillsGap.muscle] || fillsGap.muscle}</b> : supportsGap ? <b className="day-picker-supports-tag">Supports {muscleLabels[supportsGap.muscle] || supportsGap.muscle}</b> : null) : null}</div></button><button disabled={added} onClick={() => onAdd(exercise)} aria-label={added ? `${exercise.name} is already in this day` : `Add ${exercise.name} to this day`}>{added ? "Added" : <><Plus className="h-4 w-4" /> Add</>}</button></div>; })}</div>
        {ranked.length > visibleRanked.length && <button type="button" className="day-picker-more" onClick={() => setResultLimit((current) => current + initialResultLimit)}>Show more options</button>}
        {!results.length && <p className="day-picker-empty">No exercises match this setup. Clear a filter or search the full catalog.</p>}
      </div>
    </details>
  </section>;
}
