import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { exercises as catalog } from "@/lib/exerciseCatalog";
import { ExerciseMedia } from "@/components/ExerciseMedia";
import { muscleLabels } from "@/components/AnatomyMap";
import { shareDoseLine, shareExerciseCount, shareScopeLine } from "@shared/workoutShareFormat";
import type { ShareSnapshot } from "@shared/workoutShare";
import "../shared-workout.css";

/**
 * A shared workout, as a recipient reads it - and, in the composer, as the sender
 * previews it. One component for both, so the preview is the page.
 *
 * The workout comes first: its name, who shared it if they said, what it is (a
 * workout or a week, how many exercises), then the exercises in order with their
 * prescriptions, each with its details a tap away. Nothing here edits anything.
 */
/** An exercise's details, behind one line; its photographs load only once it is opened. */
function RowDetails({ name, known, movement, equipment, muscles }: { name: string; known?: (typeof catalog)[number]; movement?: string; equipment?: string; muscles: string[] }) {
  const [open, setOpen] = useState(false);
  return <details className="sw-details" onToggle={(event) => setOpen((event.currentTarget as HTMLDetailsElement).open)}>
    <summary>Details<ChevronDown className="h-4 w-4" aria-hidden="true" /></summary>
    <dl>
      {movement && <div><dt>Movement</dt><dd>{movement}</dd></div>}
      {equipment && <div><dt>Equipment</dt><dd>{equipment}</dd></div>}
      {muscles.length > 0 && <div><dt>Main muscles</dt><dd>{muscles.join(", ")}</dd></div>}
      {!known && <div><dt>Catalog</dt><dd>This exercise isn't in Sports Genome's catalog here. Its name and prescription are kept as the sender wrote them.</dd></div>}
    </dl>
    {open && known && <ExerciseMedia exerciseId={known.id} exerciseName={name} equipment={known.equipment} variant="detail" />}
  </details>;
}

const formatDate = (iso?: string) => {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

export function SharedWorkoutView({ snapshot, mode = "page", previewRows, createdAt, version, actions, headingLevel = 1 }: {
  snapshot: ShareSnapshot;
  mode?: "page" | "preview";
  /** In the composer's compact preview, how many rows of each day to show before "+ N more". */
  previewRows?: number;
  createdAt?: string;
  version?: number;
  /** The page's actions (Save a copy), placed after the summary and before the content. */
  actions?: ReactNode;
  headingLevel?: 1 | 2;
}) {
  const Title = headingLevel === 1 ? "h1" : "h2";
  const DayHeading = headingLevel === 1 ? "h2" : "h3";
  const equipment = Array.from(new Set(snapshot.days.flatMap((day) => day.exercises.map((exercise) => exercise.equipment || catalog.find((item) => item.id === exercise.catalogId)?.equipment || "").filter(Boolean))));
  const shared = formatDate(createdAt);
  const context = [snapshot.sport, snapshot.goal].filter(Boolean).join(" · ");
  const defaults = snapshot.days.some((day) => day.exercises.some((exercise) => exercise.prescriptionIsDefault));
  return <article className={`sw-view sw-view-${mode}`}>
    <header className="sw-head">
      <p className="sw-scope">{shareScopeLine(snapshot)}</p>
      <Title className="sw-title">{snapshot.title}</Title>
      {snapshot.attribution && <p className="sw-by">Shared by {snapshot.attribution}</p>}
      {snapshot.description && <p className="sw-description">{snapshot.description}</p>}
      <dl className="sw-facts">
        {equipment.length > 0 && <div><dt>Equipment</dt><dd>{equipment.join(", ")}</dd></div>}
        {context && <div><dt>Built for</dt><dd>{context}</dd></div>}
        {(shared || version) && <div><dt>Shared</dt><dd>{[shared, version && version > 1 ? `version ${version}` : ""].filter(Boolean).join(" · ")}</dd></div>}
      </dl>
    </header>
    {actions}
    {snapshot.scope === "week" && snapshot.days.length > 1 && mode === "page" && <nav className="sw-overview" aria-label="Days in this week">
      <ol>{snapshot.days.map((day, index) => <li key={day.order}><a href={`#sw-day-${day.order}`}><span>Day {index + 1}</span> {day.label}<small>{day.exercises.length} exercise{day.exercises.length === 1 ? "" : "s"}</small></a></li>)}</ol>
    </nav>}
    {snapshot.days.map((day, index) => {
      const rows = previewRows ? day.exercises.slice(0, previewRows) : day.exercises;
      return <section key={day.order} id={`sw-day-${day.order}`} className="sw-day" aria-labelledby={`sw-day-title-${day.order}`}>
        <DayHeading id={`sw-day-title-${day.order}`} className="sw-day-title"><span>Day {index + 1}</span>{day.label}</DayHeading>
        <ol className="sw-rows">
          {rows.map((exercise) => {
            const known = exercise.catalogId != null ? catalog.find((item) => item.id === exercise.catalogId) : undefined;
            const muscles = (known?.primaryMuscles ?? []).map((key) => muscleLabels[key] || key);
            const dose = shareDoseLine(exercise);
            return <li key={exercise.order} className="sw-row">
              <span className="sw-order" aria-hidden="true">{exercise.order}</span>
              <div className="sw-thumb">{known ? <ExerciseMedia exerciseId={known.id} exerciseName={exercise.name} equipment={known.equipment} variant="thumb" /> : <span className="sw-thumb-missing" aria-hidden="true" />}</div>
              <div className="sw-row-body">
                <p className="sw-name"><span className="sr-only">{exercise.order}. </span>{exercise.name}</p>
                <p className="sw-dose">{dose || "No prescription given"}{exercise.prescriptionIsDefault && <span className="sw-default"> · plan default</span>}</p>
                {exercise.notes && <p className="sw-note">Note: {exercise.notes}</p>}
                {mode === "page" && <RowDetails name={exercise.name} known={known} movement={exercise.movement || known?.movement} equipment={exercise.equipment || known?.equipment} muscles={muscles} />}
              </div>
            </li>;
          })}
        </ol>
        {previewRows && day.exercises.length > rows.length && <p className="sw-more">+ {day.exercises.length - rows.length} more in this day</p>}
      </section>;
    })}
    {defaults && mode === "page" && <p className="sw-footnote">"Plan default" marks a prescription the sender hadn't set; it is the default their plan showed for their goal.</p>}
    {mode === "page" && <p className="sw-footnote">{shareExerciseCount(snapshot)} exercises, as planned by the sender. No logged results, history or personal details are part of a shared workout.</p>}
  </article>;
}
