import { useEffect, useRef } from "react";
import { Plus, X } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import { getExerciseGenome, type GenomeDimension } from "@/lib/exerciseGenome";
import { muscleLabels } from "@/components/AnatomyMap";
import { emitInteractionFeedback } from "@/lib/interactionFeedback";

/**
 * Two exercises side by side, from the data both already carry (brief 11B).
 *
 * One sheet, two items at most, aligned rows: each row is one fact with the
 * two values next to each other, so on a phone the eye reads across, not two
 * squeezed cards. A value neither record has is said to be missing, never
 * shown as zero. No winner is declared and nothing is scored here: the
 * fingerprint numbers are the model's own dimensions, unchanged, and the
 * athlete draws the conclusion. Adding uses the same destination contract as
 * everywhere else.
 */
const dimensionLabels: Record<GenomeDimension, string> = { hypertrophy: "Hypertrophy", strength: "Strength", power: "Power", stability: "Stability", mobility: "Mobility", sfr: "Stimulus-to-fatigue", skill: "Skill demand", practicality: "Practicality" };

type Row = { label: string; values: [string | null, string | null]; numeric?: boolean };

const muscles = (keys: readonly string[]) => keys.map((key) => muscleLabels[key] || key).join(" · ") || null;
const list = (items: readonly string[]) => (items.length ? items.join(" · ") : null);

export function compareRows(a: Exercise, b: Exercise): Row[] {
  const ga = getExerciseGenome(a);
  const gb = getExerciseGenome(b);
  const rows: Row[] = [
    { label: "Equipment", values: [a.equipment || null, b.equipment || null] },
    { label: "Movement", values: [a.movement || null, b.movement || null] },
    { label: "Category", values: [a.category || null, b.category || null] },
    { label: "Primary muscles", values: [muscles(a.primaryMuscles), muscles(b.primaryMuscles)] },
    { label: "Supporting muscles", values: [muscles(a.secondaryMuscles), muscles(b.secondaryMuscles)] },
    { label: "Qualities", values: [list(a.qualities), list(b.qualities)] },
    { label: "Stance", values: [ga?.stance ?? null, gb?.stance ?? null] },
    { label: "Chain", values: [ga?.chain ?? null, gb?.chain ?? null] },
    { label: "Resistance bias", values: [ga?.resistanceProfile.bias ?? null, gb?.resistanceProfile.bias ?? null] },
  ];
  for (const key of Object.keys(dimensionLabels) as GenomeDimension[]) {
    const va = ga?.fingerprint[key];
    const vb = gb?.fingerprint[key];
    rows.push({ label: dimensionLabels[key], numeric: true, values: [typeof va === "number" ? `${Math.round(va)} / 100` : null, typeof vb === "number" ? `${Math.round(vb)} / 100` : null] });
  }
  rows.push({ label: "Evidence", values: [ga?.evidence.quality ?? null, gb?.evidence.quality ?? null] });
  return rows;
}

export function ExerciseCompareSheet({ pair, destinationLabel, onAdd, onClose, onInspect }: {
  pair: [Exercise, Exercise];
  destinationLabel: string;
  onAdd: (exercise: Exercise) => void;
  onClose: () => void;
  /** Opens one exercise's own details, in place of the comparison. */
  onInspect: (exercise: Exercise) => void;
}) {
  const [a, b] = pair;
  const rows = compareRows(a, b);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { event.stopPropagation(); onClose(); } };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  return <div className="fixed inset-0 z-50 exercise-compare" role="dialog" aria-modal="true" aria-labelledby="exercise-compare-title">
    <div className="exercise-compare-sheet">
      <div className="exercise-compare-bar">
        <p className="metric-label">Compare</p>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close comparison" className="exercise-compare-close"><X className="h-5 w-5" aria-hidden="true" /></button>
      </div>
      <div className="exercise-compare-body">
        <h1 id="exercise-compare-title">{a.name} <span>vs</span> {b.name}</h1>
        <p className="exercise-compare-note">The same facts for both, from the catalog and the exercise model. A missing value is missing, not zero; neither is ranked above the other.</p>
        <div className="exercise-compare-columns" aria-hidden="true"><span /><span>{a.name}</span><span>{b.name}</span></div>
        <dl className="exercise-compare-rows">
          {rows.map((row) => <div key={row.label} className={row.numeric ? "is-numeric" : undefined}>
            <dt>{row.label}</dt>
            {row.values.map((value, index) => <dd key={index} data-for={index === 0 ? a.name : b.name}>{value ?? <em>Not available</em>}</dd>)}
          </div>)}
        </dl>
        <div className="exercise-compare-details">
          <button type="button" onClick={() => { emitInteractionFeedback(); onInspect(a); }}>View {a.name} details</button>
          <button type="button" onClick={() => { emitInteractionFeedback(); onInspect(b); }}>View {b.name} details</button>
        </div>
      </div>
      <div className="exercise-compare-actions">
        <button type="button" onClick={() => onAdd(a)} aria-label={`Add ${a.name} to ${destinationLabel}`}>Add {a.name} <Plus className="h-4 w-4" aria-hidden="true" /></button>
        <button type="button" onClick={() => onAdd(b)} aria-label={`Add ${b.name} to ${destinationLabel}`}>Add {b.name} <Plus className="h-4 w-4" aria-hidden="true" /></button>
        <p>Adds to {destinationLabel}.</p>
      </div>
    </div>
  </div>;
}
