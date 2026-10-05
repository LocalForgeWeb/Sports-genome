import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { filterStackForEquipment, type AthleteEquipmentProfile } from "@/lib/equipmentProfile";
import { Check, ChevronUp, Dumbbell, Minus, Plus, SlidersHorizontal, X } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import { matchesTrainingSplit, type TrainingSplit } from "@/lib/splitAssignment";
import { muscleLabels } from "@/components/AnatomyMap";
import { LocalSearchScope } from "@/components/LocalSearchScope";
import "../add-exercises.css";
import { useKeyboardInset } from "@/lib/keyboardInset";
import { SearchField } from "@/components/SearchField";
import { RateStackPanel } from "@/components/RateStackPanel";
import { analyzeSplitStack } from "@/lib/splitStackAnalysis";
import { buildCoverageBars, formatCoverageDelta } from "@/lib/stackCoverageVisual";
import { pickerGapTargets, rankPickerResults } from "@/lib/pickerRanking";
import { matchesAreGuesses, rankExerciseMatches, suggestExerciseNames } from "@/lib/exerciseSearch";
import { distinguishingMuscles, gapTagIsInformative, muscleLineIsInformative, sharedRowMuscles } from "@/lib/pickerRowFacts";
import { MuscleSelect } from "@/components/MuscleSelect";
import { muscleFilterKey, selectableMuscles, trainsMuscle } from "@/lib/muscleVocabulary";
import { spokenDestination } from "@/lib/catalogDiscovery";

type DayExercisePickerProps = {
  exercises: Exercise[];
  activeWorkout: Exercise[];
  split: TrainingSplit;
  /** The athlete's sport, so the stack can be read against its demand register. */
  sportId?: string;
  /** Prescriptions for the active day, so set volume is the real one, not a default. */
  prescriptions?: Record<number, string>;
  /**
   * The athlete's saved equipment. Suggested fixes only come from what they can use (EN-12);
   * the catalog below stays whole for adding anything by hand.
   */
  equipmentProfile?: AthleteEquipmentProfile;
  onAdd: (exercise: Exercise) => void;
  /**
   * Takes one entry out of the day. Given, the sheet can undo its own adds where they
   * happened: an exercise already in the day offers Remove instead of a dead "Added", and
   * the footer's count opens the day's list, so an exercise can come out without leaving
   * the sheet or finding it in the results first.
   */
  onRemove?: (entry: Exercise) => void;
  onReplace: (outgoing: Exercise, incoming: Exercise) => void;
  onInspect: (exercise: Exercise) => void;
  /**
   * True while "Add exercises" is open as a sheet over the day.
   *
   * It used to be a counter that scrolled the page down to this panel. Scrolling is not
   * opening: the athlete pressed a button and the page moved under them, leaving them to
   * work out that the thing they asked for was now somewhere below. A sheet arrives where
   * they are looking and closes back to where they were.
   */
  sheetOpen?: boolean;
  /** Where an add lands, in the plan's own words: "Week 1 · Legs". Falls back to the split. */
  destination?: string;
  /** The day as the plan names it ("Week 1 · Day 03 · Legs"), for the analysis surface. */
  dayLabel?: string;
  /** Opens that sheet from inside the panel - the coverage read-out's shortfalls do. */
  onOpenSheet?: () => void;
  onCloseSheet?: () => void;
};

const initialResultLimit = 24;

export function sortDayExerciseResults(results: Exercise[], muscle: string) {
  return [...results].sort((left, right) => {
    if (muscle !== "all") {
      const directDifference = Number(trainsMuscle(right, muscle) === "primary") - Number(trainsMuscle(left, muscle) === "primary");
      if (directDifference) return directDifference;
      const supportingDifference = Number(trainsMuscle(right, muscle) === "secondary") - Number(trainsMuscle(left, muscle) === "secondary");
      if (supportingDifference) return supportingDifference;
    }
    return left.name.localeCompare(right.name);
  });
}

export function DayExercisePicker({ exercises, activeWorkout, split, sportId, prescriptions, equipmentProfile, sheetOpen = false, destination, dayLabel, onOpenSheet, onCloseSheet, onAdd, onRemove, onReplace, onInspect }: DayExercisePickerProps) {
  const searchRef = useRef<HTMLInputElement | null>(null);
  const suggestionCatalog = useMemo(() => equipmentProfile ? filterStackForEquipment(exercises, equipmentProfile) : exercises, [equipmentProfile, exercises]);
  const destinationLabel = destination ?? split;
  // The footer's count is the day as persisted, including what was there before the
  // sheet opened; what this visit added and took out is said separately rather than
  // folded in. Counted by entry against the day as it opened, so adding one and removing
  // another reads as both, not as no change.
  const [entriesAtOpen, setEntriesAtOpen] = useState(() => new Set(activeWorkout.map((entry) => entry.id)));
  useEffect(() => { if (sheetOpen) setEntriesAtOpen(new Set(activeWorkout.map((entry) => entry.id))); }, [sheetOpen]); // eslint-disable-line react-hooks/exhaustive-deps
  const addedThisVisit = activeWorkout.filter((entry) => !entriesAtOpen.has(entry.id)).length;
  const removedThisVisit = Array.from(entriesAtOpen).filter((id) => !activeWorkout.some((entry) => entry.id === id)).length;
  const visitChanges = [addedThisVisit > 0 ? `${addedThisVisit} added` : "", removedThisVisit > 0 ? `${removedThisVisit} removed` : ""].filter(Boolean).join(", ");
  const countLine = `${activeWorkout.length} in ${destinationLabel}${visitChanges ? ` · ${visitChanges} now` : ""}`;
  // The day's own list, opened from that count.
  const [dayListOpen, setDayListOpen] = useState(false);
  useEffect(() => { if (!sheetOpen) setDayListOpen(false); }, [sheetOpen]);
  const dayListRef = useRef<HTMLOListElement | null>(null);
  const dayToggleRef = useRef<HTMLButtonElement | null>(null);
  /**
   * After a Remove in the day's list its row is gone, and focus would fall to the page.
   * It goes to the row that took that place (or the one before it), and to the count
   * once the list is empty, so removing several in a row is the same key each time.
   */
  const refocusDayList = useRef<{ index: number; length: number } | null>(null);
  useEffect(() => {
    const pending = refocusDayList.current;
    // Only once that removal has landed: one refused (the plan still loading) moves nothing.
    if (!pending || activeWorkout.length >= pending.length) return;
    refocusDayList.current = null;
    const { index } = pending;
    const buttons = dayListRef.current?.querySelectorAll<HTMLButtonElement>("button");
    if (buttons?.length) buttons[Math.min(index, buttons.length - 1)].focus();
    else dayToggleRef.current?.focus();
  }, [activeWorkout]);
  const catalogIdOf = (entry: Exercise) => (entry as Exercise & { catalogExerciseId?: number }).catalogExerciseId || entry.id;
  // A row stands for a catalog exercise; the entry it takes out is the latest one of it.
  const removeCatalogExercise = (exercise: Exercise) => {
    const entry = [...activeWorkout].reverse().find((item) => catalogIdOf(item) === exercise.id);
    if (entry) onRemove?.(entry);
  };
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<"split" | "all">("split");
  const [equipment, setEquipment] = useState("all");
  const [muscle, setMuscle] = useState("all");
  const [resultLimit, setResultLimit] = useState(initialResultLimit);
  const equipmentOptions = useMemo(() => Array.from(new Set(exercises.map((exercise) => exercise.equipment))).sort(), [exercises]);
  const muscleOptions = useMemo(() => selectableMuscles(exercises, (key) => muscleLabels[key] || key), [exercises]);
  /**
   * The filters narrow the pool; the search box then finds a name in it the
   * way an athlete types one - "reardelt fly", "trap bar", "romanain" - rather
   * than as an exact substring of the catalog's spelling. Without a query the
   * list keeps the muscle-aware order it has always had.
   */
  const candidates = useMemo(() => exercises.filter((exercise) => {
    const matchesMuscle = muscle === "all" || trainsMuscle(exercise, muscle) !== null;
    return matchesMuscle && (scope === "all" || matchesTrainingSplit(exercise, split)) && (equipment === "all" || exercise.equipment === equipment);
  }), [exercises, equipment, muscle, scope, split]);
  const searching = query.trim().length > 0;
  const results = useMemo(
    () => (searching ? rankExerciseMatches(candidates, query) : rankExerciseMatches(sortDayExerciseResults(candidates, muscle), "")),
    [candidates, muscle, query, searching],
  );
  const relevance = useMemo(() => new Map(results.map((match) => [match.exercise.id, match.score])), [results]);
  // Nothing is called this; these are the nearest spellings the pool has.
  const guessed = searching && matchesAreGuesses(results);
  const suggestions = useMemo(() => (searching && !results.length ? suggestExerciseNames(candidates, query) : []), [candidates, query, results.length, searching]);
  /**
   * The same shortfalls the coverage panel above is already showing. Computing
   * them here is what lets the list answer the panel instead of sitting beside
   * it sorted alphabetically.
   */
  const gaps = useMemo(
    () => pickerGapTargets(buildCoverageBars(analyzeSplitStack(activeWorkout, exercises, split).ratings)),
    [activeWorkout, exercises, split]
  );
  const ranked = useMemo(() => rankPickerResults(results.map((match) => match.exercise), gaps, relevance), [gaps, relevance, results]);
  const visibleRanked = ranked.slice(0, resultLimit);

  useEffect(() => { setResultLimit(initialResultLimit); }, [equipment, muscle, query, scope, split]);

  // The cursor starts in the search field, because searching is what the sheet is for.
  // The control that opened the sheet gets focus back when it closes. A Safari
  // tap does not focus a button, so the body is not treated as an opener; and one
  // that has gone (the empty day's "Add exercises" after the first add) is skipped.
  useEffect(() => {
    if (!sheetOpen) return;
    const active = document.activeElement;
    const opener = active instanceof HTMLElement && active !== document.body ? active : null;
    const focusTimer = window.setTimeout(() => searchRef.current?.focus(), 60);
    return () => {
      window.clearTimeout(focusTimer);
      // No scroll: the page-pinning cleanup below puts the athlete's place back.
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [sheetOpen]);

  // Escape closes it, the way every other layer over this page closes - the day's list
  // first, when that is open over the results.
  useEffect(() => {
    if (!sheetOpen || !onCloseSheet) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (dayListOpen) { setDayListOpen(false); dayToggleRef.current?.focus(); return; }
      onCloseSheet();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sheetOpen, onCloseSheet, dayListOpen]);

  /**
   * The page underneath holds still while the sheet is up.
   *
   * It did not: the sheet is a fixed layer, and the day page behind it stayed
   * scrollable. On iOS, focusing the search box makes Safari scroll the document
   * to reveal the field, and every keystroke re-checked it - so the site behind
   * the sheet moved up and down as the athlete typed. `overflow: hidden` on the
   * body is not enough there; pinning the body in place at its current offset
   * is, and the offset is put back when the sheet closes so nobody loses their
   * place on the day.
   */
  useEffect(() => {
    if (!sheetOpen) return;
    const body = document.body;
    const scrollY = window.scrollY;
    const previous = { position: body.style.position, top: body.style.top, left: body.style.left, right: body.style.right, width: body.style.width, overflow: body.style.overflow };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.left = previous.left;
      body.style.right = previous.right;
      body.style.width = previous.width;
      body.style.overflow = previous.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [sheetOpen]);

  /**
   * The sheet's rows, and the facts each one states, are built only while the
   * sheet is open. They were built on every render and then thrown away, and the
   * Plan page re-renders this panel on every keystroke in a reps field.
   *
   * Called, never mounted as `<PickerBody />`: an inner component is a new type on
   * every render, so React would remount it and the search box would lose focus
   * on each keystroke.
   */
  const renderPickerBody = () => {
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

    const existingCatalogIds = new Set(activeWorkout.map(catalogIdOf));

    return <>
  <div className="day-exercise-picker-content">
        <div className="day-exercise-picker-head"><div><p className="metric-label">Build this day yourself</p><h3>Add exercises directly</h3><p>Start with split-matched options, then switch to the full catalog when you want a deliberate exception.</p></div><Dumbbell className="h-5 w-5" /></div>
        {gaps.length > 0 && activeWorkout.length > 0 && <div className="day-picker-gaps"><span className="day-picker-gaps-label">Short in this day</span>{gaps.map((gap) => <button key={gap.muscle} type="button" onClick={() => setMuscle(muscle === muscleFilterKey(gap.muscle) ? "all" : muscleFilterKey(gap.muscle))} className={muscle === muscleFilterKey(gap.muscle) ? "day-picker-gap day-picker-gap-active" : "day-picker-gap"} aria-pressed={muscle === muscleFilterKey(gap.muscle)} aria-label={`${muscleLabels[gap.muscle] || gap.muscle}, ${formatCoverageDelta(gap.deltaToTarget)}`}><span>{muscleLabels[gap.muscle] || gap.muscle}</span><i aria-hidden="true">{gap.deltaToTarget < 0 ? "\u2212" : "+"}{Math.abs(gap.deltaToTarget)}</i></button>)}{muscle !== "all" && <button type="button" className="day-picker-gap-clear" onClick={() => setMuscle("all")}>Clear</button>}</div>}
        <div className="day-picker-tools"><SearchField ref={searchRef} className="day-picker-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${scope === "split" ? split : "all"} exercises`} aria-label={`Search ${scope === "split" ? split : "all"} exercises`} /><div className="day-picker-filter-row"><MuscleSelect muscles={muscleOptions} value={muscle} labelFor={(key) => muscleLabels[key] || key} onChange={setMuscle} allLabel="All muscles" /><select value={equipment} onChange={(event) => setEquipment(event.target.value)} aria-label="Filter day exercises by equipment"><option value="all">All equipment</option>{equipmentOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select></div><div className="day-picker-scope"><button type="button" aria-pressed={scope === "split"} onClick={() => setScope("split")} className={scope === "split" ? "day-picker-scope-active" : ""}><SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" /> {split} fit</button><button type="button" aria-pressed={scope === "all"} onClick={() => setScope("all")} className={scope === "all" ? "day-picker-scope-active" : ""}>All catalog</button></div></div>
        <LocalSearchScope scope={`Searching ${scope === "split" ? `${split}-compatible` : "all catalog"} exercises.`} query={query} />
        <p className="day-picker-result-count" aria-live="polite"><strong>{results.length}</strong> option{results.length === 1 ? "" : "s"}{gaps.length > 0 ? ` · ${gaps.map((gap) => muscleLabels[gap.muscle] || gap.muscle).slice(0, 2).join(" and ")} first` : muscle !== "all" ? ` · direct ${muscleLabels[muscle] || muscle} targets first` : scope === "split" ? ` · ${split}-compatible` : " · full catalog"}{guessed && <span className="day-picker-result-guess">Nothing is spelled “{query.trim()}” — these are the closest.</span>}{shared.muscles.length > 0 &&<span className="day-picker-result-shared">{shared.everyRow ? "All of these also work" : "Most of these also work"} {shared.muscles.map((muscleKey) => (muscleLabels[muscleKey] || muscleKey).toLowerCase()).join(" and ")}.</span>}</p>
        {muscle === "serratusAnterior" && <p className="day-picker-serratus-cue">Serratus anterior options are available: <strong>Cable Serratus Punch</strong> and <strong>Scapular Wall Slide</strong>. Both are permitted in the Push Day pool.</p>}
        <div className="day-picker-results">{visibleRanked.map(({ exercise, fillsGap, supportsGap }) => { const added = existingCatalogIds.has(exercise.id); const removable = added && Boolean(onRemove); const spoken = spokenDestination(destinationLabel); const directTarget = muscle !== "all" && exercise.primaryMuscles.includes(muscle); const extraMuscles = distinguishingMuscles(exercise, alreadyNamed); return <div key={exercise.id} className={`day-picker-result${directTarget ? " day-picker-result-direct" : ""}${showGapTag && fillsGap ? " day-picker-result-fills" : ""}${added ? " day-picker-result-added" : ""}`}><button onClick={() => onInspect(exercise)}><div><strong>{exercise.name}</strong><small>{exercise.movement} · {exercise.equipment}</small>{removable && <span className="day-picker-in-day"><Check className="h-3.5 w-3.5" aria-hidden="true" /> Added</span>}{showMuscleLine && extraMuscles.length > 0 && <em>Also {extraMuscles.map((muscleKey) => muscleLabels[muscleKey] || muscleKey).join(" · ")}</em>}{showGapTag ? (fillsGap ? <b className="day-picker-fills-tag">Closes {muscleLabels[fillsGap.muscle] || fillsGap.muscle}</b> : supportsGap ? <b className="day-picker-supports-tag">Supports {muscleLabels[supportsGap.muscle] || supportsGap.muscle}</b> : null) : null}</div></button>{/* One button whose job changes, so focus stays on it from Add to Remove and back. */}<button type="button" className={removable ? "day-picker-remove" : undefined} disabled={added && !removable} onClick={() => (removable ? removeCatalogExercise(exercise) : onAdd(exercise))} aria-label={removable ? `Remove ${exercise.name} from ${spoken}` : added ? `${exercise.name} is already in ${spoken}` : `Add ${exercise.name} to ${spoken}`}>{removable ? <><Minus className="h-4 w-4" aria-hidden="true" /> Remove</> : added ? <><Check className="h-4 w-4" aria-hidden="true" /> Added</> : <><Plus className="h-4 w-4" aria-hidden="true" /> Add</>}</button></div>; })}</div>
        {ranked.length > visibleRanked.length && <button type="button" className="day-picker-more" onClick={() => setResultLimit((current) => current + initialResultLimit)}>Show more options</button>}
        {!results.length && <p className="day-picker-empty">
          {searching
            ? <>Nothing here is called “{query.trim()}”.
              {suggestions.length > 0
                ? <> Did you mean {suggestions.map((name, index) => <span key={name}>{index > 0 ? (index === suggestions.length - 1 ? " or " : ", ") : " "}<button type="button" onClick={() => setQuery(name)}>{name}</button></span>)}?</>
                : scope === "split" ? <> <button type="button" onClick={() => setScope("all")}>Search the full catalog</button> or try a shorter word.</> : " Try a shorter word, or a different one."}
            </>
            : "No exercises match this setup. Clear a filter or search the full catalog."}
        </p>}
      </div>
  </>;
  };
  const pickerBody = sheetOpen ? renderPickerBody() : null;
  // The open keyboard lifts the sheet instead of covering its results and Done (iOS does not resize the layout for it).
  const keyboardInset = useKeyboardInset(Boolean(sheetOpen));

  /**
   * The catalog used to render twice on the Training Day: inline in a disclosure
   * below the day, and again in the sheet "Add exercises" opens. The inline copy
   * was 3,300px of the page's 6,400 - the largest thing on a screen whose job is
   * to show the day you are building, and a second copy of a surface that already
   * had a way in. It is gone; the sheet is the only catalog, and this section is
   * now only the day's read-out.
   */
  return <>
    <section className="day-exercise-picker" id="day-exercise-picker">
      <RateStackPanel
        workout={activeWorkout}
        catalog={suggestionCatalog}
        split={split}
        sportId={sportId}
        prescriptions={prescriptions}
        onAdd={onAdd}
        onReplace={onReplace}
        onFixMuscle={(target) => { setMuscle(muscleFilterKey(target)); setQuery(""); onOpenSheet?.(); }}
        dayLabel={dayLabel ?? destinationLabel}
        onAddExercises={onOpenSheet ? () => { setMuscle("all"); setQuery(""); onOpenSheet(); } : undefined}
      />
      {/* The "Find exercises for {gap}" card that sat here repeated the coverage panel's own
          fix action, on a white card inside the dark day (Sep 28 regression brief §8). */}
    </section>

    {/* Opened by "Add exercises". The same surface, over the day rather than below it. */}
    {sheetOpen && <div className="day-picker-sheet-scrim" style={keyboardInset ? ({ "--sg-keyboard-inset": `${keyboardInset}px` } as CSSProperties) : undefined} data-keyboard={keyboardInset ? "open" : undefined} onClick={(event) => { if (event.target === event.currentTarget) onCloseSheet?.(); }}>
      <section className="day-picker-sheet sg-surface-dark" role="dialog" aria-modal="true" aria-labelledby="day-picker-sheet-title">
        <header className="day-picker-sheet-head">
          <div><p className="metric-label">Add to {destinationLabel}</p><h2 id="day-picker-sheet-title">Add exercises</h2></div>
          <button type="button" onClick={() => onCloseSheet?.()} aria-label="Close add exercises"><X className="h-4 w-4" /></button>
        </header>
        {pickerBody}
        {dayListOpen && onRemove && <div id="day-picker-day-list" className="day-picker-day-list" role="region" aria-label={`In ${destinationLabel}`}>
          <p className="metric-label">In {destinationLabel}</p>
          {activeWorkout.length
            ? <ol ref={dayListRef}>{activeWorkout.map((entry, index) => <li key={entry.id}><span className="day-picker-day-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><span className="day-picker-day-name">{entry.name}</span><button type="button" onClick={() => { refocusDayList.current = { index, length: activeWorkout.length }; onRemove(entry); }} aria-label={`Remove ${entry.name} from ${spokenDestination(destinationLabel)}`}><Minus className="h-4 w-4" aria-hidden="true" /> Remove</button></li>)}</ol>
            : <p className="day-picker-day-empty">Nothing in this day yet.</p>}
        </div>}
        <footer className="day-picker-sheet-foot">
          {onRemove
            ? <button ref={dayToggleRef} type="button" className="day-picker-day-toggle" aria-expanded={dayListOpen} aria-controls="day-picker-day-list" onClick={() => setDayListOpen((open) => !open)}><span aria-live="polite">{countLine}</span><ChevronUp className="h-4 w-4" aria-hidden="true" /></button>
            : <span aria-live="polite">{countLine}</span>}
          <button type="button" onClick={() => onCloseSheet?.()}>Done</button>
        </footer>
      </section>
    </div>}
  </>;
}
