import { useMemo, useState } from "react";
import { BarChart3, ChevronRight, Maximize2, Wrench } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import type { TrainingSplit } from "@/lib/splitAssignment";
import { analyzeSplitStack } from "@/lib/splitStackAnalysis";
import {
  buildCoverageBars,
  dialGeometry,
  formatCoverageDelta,
  scoreBand,
  summarizeCoverage,
} from "@/lib/stackCoverageVisual";
import { StackAnalysisPage } from "@/components/StackAnalysisPage";
import { muscleLabels } from "@/components/AnatomyMap";
import "../rate-stack.css";

const label = (muscle: string) => muscleLabels[muscle] || muscle;

/** A half-circle gauge for the split's overall coverage. */
function CoverageDial({ score }: { score: number }) {
  const band = scoreBand(score);
  const dial = useMemo(() => dialGeometry(score), [score]);
  return (
    <div className={`rate-stack-dial rate-stack-dial-${band}`}>
      <svg viewBox={dial.viewBox} aria-hidden="true">
        <path d={dial.path} className="rate-stack-dial-track" strokeLinecap="round" />
        <path
          d={dial.path}
          className="rate-stack-dial-value"
          strokeLinecap="round"
          strokeDasharray={dial.length}
          strokeDashoffset={dial.offset}
        />
      </svg>
      <p className="rate-stack-dial-readout">
        <strong>{score}</strong>
        <small>/100</small>
      </p>
    </div>
  );
}

/**
 * How this day reads, as a summary; the detail is one tap away.
 *
 * It used to be one stage: a gauge, a sentence, a band tally, two group headings,
 * every bar in the split, a legend, and a second disclosure explaining the score -
 * around 600px of chart on a phone, above an exercise list, on a page you came to
 * in order to edit a day. It was then three stages, with the bars behind a
 * disclosure here and again, sorted differently, in the analysis.
 *
 * Now the Plan says four things (Sep 28 regression brief §8): the coverage index, one
 * sentence about it, the one gap worth closing first as the search that closes it, and
 * "View analysis". The bars, tallies, legend and methodology live in the analysis, once.
 * An empty day has no index at all: a 0/100 gauge read as a scored failure before
 * anything had been added.
 */
export function RateStackPanel({ workout, catalog, split, sportId, prescriptions, onAdd, onReplace: _onReplace, onFixMuscle, dayLabel = "Active Training Day", onAddExercises }: { workout: Exercise[]; catalog: Exercise[]; split: TrainingSplit; sportId?: string; prescriptions?: Record<number, string>; onAdd: (exercise: Exercise) => void; onReplace: (outgoing: Exercise, incoming: Exercise) => void; onFixMuscle?: (muscle: string) => void; /** The day in the plan's words ("Week 1 · Day 05 · Legs"), named on the analysis surface. */ dayLabel?: string; /** Opens the day's exercise picker; the analysis offers it on a day emptied while it is open. */ onAddExercises?: () => void; }) {
  const [open, setOpen] = useState(false);
  const analysis = useMemo(() => analyzeSplitStack(workout, catalog, split), [catalog, split, workout]);
  const bars = useMemo(() => buildCoverageBars(analysis.ratings), [analysis.ratings]);
  const summary = useMemo(() => summarizeCoverage(bars, label), [bars]);
  const worst = summary.shortfalls[0];

  // Still rendered on a day emptied while the analysis is open (an Undo), which then shows
  // its own empty state rather than vanishing under the athlete.
  const analysisPage = open && (
    <StackAnalysisPage
      workout={workout}
      split={split}
      ratings={analysis.ratings}
      dayLabel={dayLabel}
      targetIndex={analysis.score}
      suggestions={analysis.suggestions}
      catalog={catalog}
      sportId={sportId}
      prescriptions={prescriptions}
      boundary={analysis.boundary}
      onAddSuggestion={onAdd}
      onClose={() => setOpen(false)}
      onAddExercises={onAddExercises ? () => { setOpen(false); onAddExercises(); } : undefined}
      onInspectExercise={() => undefined}
    />
  );

  if (workout.length === 0) {
    return (
      <section className="rate-stack-panel rate-stack-panel-pending">
        <p className="rate-stack-eyebrow">
          <BarChart3 className="h-3.5 w-3.5" /> {split} coverage
        </p>
        <p className="rate-stack-headline">Not available yet</p>
        <p className="rate-stack-scope-note">It appears after the first exercise, measured against the {bars.length} {split.toLowerCase()} targets.</p>
        {analysisPage}
      </section>
    );
  }

  return (
    <section className="rate-stack-panel">
      <header className="rate-stack-head">
        <CoverageDial score={analysis.score} />
        <div className="rate-stack-head-copy">
          <p className="rate-stack-eyebrow">
            <BarChart3 className="h-3.5 w-3.5" /> {split} coverage index
          </p>
          <p className="rate-stack-headline">{summary.headline}</p>
          {/* The scale, named once and short: the methodology is in the analysis. */}
          <p className="rate-stack-scope-note">Out of 100, from catalog muscle tags. Not workload or recovery.</p>
        </div>
      </header>

      {/* The one gap worth closing first, as the search that closes it. */}
      {worst && <div className="rate-stack-fix">
        <p className="rate-stack-fix-label"><Wrench className="h-3.5 w-3.5" /> Furthest behind</p>
        <ul className="rate-stack-fix-list">
          <li>
            {onFixMuscle
              ? <button type="button" onClick={() => onFixMuscle(worst.muscle)} aria-label={`Find ${label(worst.muscle)} exercises, ${formatCoverageDelta(worst.deltaToTarget)}`}>
                  <span>{label(worst.muscle)}</span><i>{formatCoverageDelta(worst.deltaToTarget, { short: true })}</i>
                </button>
              : <span className="rate-stack-fix-static"><span>{label(worst.muscle)}</span><i>{formatCoverageDelta(worst.deltaToTarget, { short: true })}</i></span>}
          </li>
          {summary.shortfalls.length > 1 && <li className="rate-stack-fix-more">{summary.shortfalls.length - 1} more {summary.shortfalls.length === 2 ? "target" : "targets"} under</li>}
        </ul>
      </div>}

      <button type="button" onClick={() => setOpen(true)} className="rate-stack-trigger">
        <span>
          <Maximize2 className="h-4 w-4" /> View analysis
        </span>
        <small>{analysis.suggestions.length ? `${analysis.suggestions.length} suggested fix${analysis.suggestions.length === 1 ? "" : "es"}` : `every ${split.toLowerCase()} target, body map and per-exercise breakdown`}</small>
        <ChevronRight className="h-4 w-4" />
      </button>

      {analysisPage}
    </section>
  );
}
