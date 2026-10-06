import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Search, X } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import { rankExerciseMatches } from "@/lib/exerciseSearch";
import { isKeyForAnotherLayer } from "@/lib/modalLayer";
import { trapTabWithin } from "@/lib/modalBackground";
import { ExerciseMedia } from "@/components/ExerciseMedia";
import { swapMeasurementNotes, swapSuggestions, type DraftChoice, type PartialDropChoice, type SwapAssessment } from "@/lib/workoutSwap";
import type { DeviceWorkoutExercise } from "@/lib/deviceWorkoutLog";
import "../exercise-swap.css";

/**
 * "Swap exercise" during a workout (Oct 6 brief §3). A sheet titled for what it does -
 * "Replace Sissy Squat" - with search, equipment filters and suggestions of the same movement,
 * then one confirm button naming the choice: "Use Barbell Squat".
 *
 * Before the confirm it says exactly what will happen to the work already done, asks what to do
 * with anything typed but not logged, and says how the new exercise is logged when that differs.
 * The default scope is this workout only; changing the plan is a separate, opt-in tick that names
 * the slot it changes.
 */
export type SwapPlanOption = { available: true; slot: string } | { available: false; reason: string };

export type ExerciseSwapChoice = { target: Exercise; draft: DraftChoice; partialDrop: PartialDropChoice; alsoPlan: boolean };

export function ExerciseSwapSheet({ exercise, catalogEntry, catalog, assessment, inWorkout, lastLoggedFor, planOptionFor, onConfirm, onAdd, onClose }: {
  /** The session exercise being replaced. */
  exercise: DeviceWorkoutExercise;
  catalogEntry: Exercise | undefined;
  catalog: readonly Exercise[];
  assessment: SwapAssessment;
  /** Names of exercises already in this workout, marked in the list. */
  inWorkout: ReadonlySet<string>;
  /** "185 lb × 5", from the candidate's own history on this device; null when it has none. */
  lastLoggedFor: (exercise: Exercise) => string | null;
  /** Whether "Also update this day in my plan" can be offered for a candidate, and the slot it changes. Null hides it. */
  planOptionFor?: (exercise: Exercise) => SwapPlanOption | null;
  onConfirm: (choice: ExerciseSwapChoice) => void;
  onAdd: (target: Exercise) => void;
  onClose: () => void;
}) {
  const layerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [query, setQuery] = useState("");
  const [equipment, setEquipment] = useState<string>("All");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<DraftChoice>("keep");
  const [partialDrop, setPartialDrop] = useState<PartialDropChoice>("keep");
  const [alsoPlan, setAlsoPlan] = useState(false);
  /** One confirm per sheet: a double tap must not apply the swap twice. */
  const confirmed = useRef(false);
  const name = exercise.exerciseName;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    layerRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (isKeyForAnotherLayer(event, layerRef.current)) return;
      if (event.key === "Escape") { event.stopPropagation(); onCloseRef.current(); return; }
      if (layerRef.current) trapTabWithin(event, layerRef.current);
    };
    window.addEventListener("keydown", onKey, true);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey, true); document.body.style.overflow = overflow; if (opener?.isConnected) opener.focus({ preventScroll: true }); };
  }, []);

  const candidates = useMemo(() => catalog.filter((item) => item.name !== name), [catalog, name]);
  const equipmentChoices = useMemo(() => {
    const tally = new Map<string, number>();
    for (const item of candidates) tally.set(item.equipment, (tally.get(item.equipment) ?? 0) + 1);
    return ["All", ...Array.from(tally.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([value]) => value)];
  }, [candidates]);
  const byEquipment = (item: Exercise) => equipment === "All" || item.equipment === equipment;
  const suggestions = useMemo(() => swapSuggestions(catalogEntry, candidates, new Set()).filter(byEquipment), [catalogEntry, candidates, equipment]);
  const results = useMemo(() => (query.trim() ? rankExerciseMatches(candidates, query).map((match) => match.exercise).filter(byEquipment).slice(0, 40) : candidates.filter(byEquipment).slice().sort((a, b) => a.name.localeCompare(b.name))), [candidates, query, equipment]);
  const selected = selectedId === null ? null : candidates.find((item) => item.id === selectedId) ?? null;
  const planOption = selected && planOptionFor ? planOptionFor(selected) : null;
  const notes = selected ? swapMeasurementNotes(catalogEntry, selected, exercise.plannedPrescription) : [];
  const nothingLeft = assessment.kind === "nothing_left";

  const what = nothingLeft
    ? `Every set of ${name} is logged, so there is nothing left to swap. You can add another exercise straight after it instead.`
    : assessment.kind === "replace"
      ? `Nothing is logged for ${name} yet, so the exercise you choose takes its place with the same ${assessment.openSets} ${assessment.openSets === 1 ? "set" : "sets"}.`
      : `Your ${assessment.completedSets} logged ${assessment.completedSets === 1 ? "set stays" : "sets stay"} with ${name}. The exercise you choose takes the remaining ${assessment.openSets} ${assessment.openSets === 1 ? "set" : "sets"}.`;

  const confirm = () => {
    if (!selected || confirmed.current) return;
    confirmed.current = true;
    if (nothingLeft) onAdd(selected);
    else onConfirm({ target: selected, draft, partialDrop, alsoPlan: Boolean(alsoPlan && planOption?.available) });
  };

  const row = (item: Exercise) => {
    const on = item.id === selectedId;
    return <li key={item.id}>
      <button type="button" className="swap-option" aria-pressed={on} onClick={() => { setSelectedId(item.id); setAlsoPlan(false); }}>
        <ExerciseMedia exerciseId={item.id} exerciseName={item.name} equipment={item.equipment} variant="thumb" />
        <span className="swap-option-name"><strong>{item.name}</strong><small>{item.equipment} · {item.movement}{inWorkout.has(item.name) ? " · already in this workout" : ""}</small></span>
        <span className="swap-option-mark" aria-hidden="true">{on ? <Check /> : null}</span>
      </button>
    </li>;
  };

  return createPortal(
    <div className="swap-scrim" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={layerRef} className="swap-sheet sg-surface-dark" tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="swap-title" aria-describedby="swap-what">
        <header className="swap-head">
          <div>
            <p className="metric-label">Swap exercise</p>
            <h2 id="swap-title">Replace {name}</h2>
          </div>
          <button type="button" className="swap-close" onClick={onClose} aria-label="Close without swapping"><X aria-hidden="true" /></button>
        </header>
        <p id="swap-what" className="swap-what">{what}</p>

        <label className="swap-search">
          <span className="sr-only">Search exercises</span>
          <Search aria-hidden="true" />
          <input ref={searchRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search exercises" autoComplete="off" enterKeyHint="search" />
        </label>
        <p className="swap-scope-line">Searching all {candidates.length} exercises in the catalog{equipment !== "All" ? ` · ${equipment} only` : ""}.</p>
        <div className="swap-filters" role="group" aria-label="Equipment">
          {equipmentChoices.map((value) => <button key={value} type="button" aria-pressed={equipment === value} onClick={() => setEquipment(value)}>{value}</button>)}
        </div>

        <div className="swap-lists" role="group" aria-label={`Exercise to use instead of ${name}`}>
          {!query.trim() && suggestions.length > 0 && <section aria-label="Suggested">
            <h3>Suggested · same movement or muscles</h3>
            <ul>{suggestions.map(row)}</ul>
          </section>}
          <section aria-label={query.trim() ? "Results" : "All exercises"}>
            <h3>{query.trim() ? `${results.length} ${results.length === 1 ? "match" : "matches"}` : "All exercises"}</h3>
            {results.length ? <ul>{results.filter((item) => query.trim() || !suggestions.includes(item)).map(row)}</ul> : <p className="swap-empty">Nothing matches “{query}”{equipment !== "All" ? ` in ${equipment}` : ""}.</p>}
          </section>
        </div>

        {selected && !nothingLeft && <div className="swap-details">
          {assessment.partialDrop && <fieldset className="swap-choice">
            <legend>Your drop set on {name} has {assessment.partialDrop.stages} {assessment.partialDrop.stages === 1 ? "stage" : "stages"} so far</legend>
            <label className={partialDrop === "keep" ? "is-on" : ""}><input type="radio" name="swap-drop" checked={partialDrop === "keep"} onChange={() => setPartialDrop("keep")} /><span><b>Keep it with {name}</b><small>{assessment.partialDrop.stages >= 2 ? "Logged as a drop set of the stages done." : "One stage is logged as an ordinary set."}</small></span></label>
            <label className={partialDrop === "discard" ? "is-on" : ""}><input type="radio" name="swap-drop" checked={partialDrop === "discard"} onChange={() => setPartialDrop("discard")} /><span><b>Discard it</b><small>Nothing from it is recorded.</small></span></label>
          </fieldset>}
          {assessment.draftSets > 0 && <fieldset className="swap-choice">
            <legend>{assessment.draftSets === 1 ? `A set of ${name} is typed but not logged` : `${assessment.draftSets} sets of ${name} are typed but not logged`}</legend>
            <label className={draft === "keep" ? "is-on" : ""}><input type="radio" name="swap-draft" checked={draft === "keep"} onChange={() => setDraft("keep")} /><span><b>Keep it with {name}</b><small>Still not logged: you can log it from the full workout list.</small></span></label>
            <label className={draft === "discard" ? "is-on" : ""}><input type="radio" name="swap-draft" checked={draft === "discard"} onChange={() => setDraft("discard")} /><span><b>Discard it</b></span></label>
            <label className={draft === "reuse" ? "is-on" : ""}><input type="radio" name="swap-draft" checked={draft === "reuse"} onChange={() => setDraft("reuse")} /><span><b>Use the reps for {selected.name}</b><small>The load is not carried over.</small></span></label>
          </fieldset>}
          <div className="swap-logging">
            <h3>Logging {selected.name}</h3>
            <ul>
              <li>No load is carried over from {name}. {lastLoggedFor(selected) ? `Last logged ${selected.name}: ${lastLoggedFor(selected)}.` : `No ${selected.name} logged on this device yet.`}</li>
              {notes.map((note) => <li key={note}>{note}</li>)}
              <li>The rest timer is not changed.</li>
            </ul>
          </div>
          <fieldset className="swap-scope">
            <legend>Where the swap applies</legend>
            <p className="swap-scope-default"><Check aria-hidden="true" /> This workout only</p>
            {planOption && (planOption.available
              ? <label className="swap-plan"><input type="checkbox" checked={alsoPlan} onChange={(event) => setAlsoPlan(event.target.checked)} /><span><b>Also update this day in my plan</b><small>{planOption.slot}</small></span></label>
              : <p className="swap-plan-off">Your plan stays as it is: {planOption.reason}</p>)}
          </fieldset>
        </div>}

        <footer className="swap-actions">
          <button type="button" className="swap-cancel" onClick={onClose}>Cancel</button>
          <button type="button" className="swap-confirm" onClick={confirm} disabled={!selected}>
            {selected ? (nothingLeft ? `Add ${selected.name}` : `Use ${selected.name}`) : "Choose an exercise"}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
