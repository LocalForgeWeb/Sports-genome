import { useMemo, useState } from "react";
import { BarChart3, ChevronDown, ChevronRight, Maximize2, Wrench } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import type { TrainingSplit } from "@/lib/splitAssignment";
import { analyzeSplitStack } from "@/lib/splitStackAnalysis";
import {
  buildCoverageBars,
  coverageBandCopy,
  dialGeometry,
  scoreBand,
  summarizeCoverage,
  type CoverageBand,
  type CoverageBar,
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
 * Coverage against the split's target for one muscle.
 *
 * The mark is the point of the whole row: a fill on its own says "56", which
 * means nothing without knowing the split wanted 90.
 */
function CoverageRow({ bar }: { bar: CoverageBar }) {
  const band = coverageBandCopy[bar.band];
  const delta = bar.deltaToTarget;
  return (
    <li
      className={`rate-stack-row rate-stack-row-${bar.band}`}
      aria-label={`${label(bar.muscle)}, ${bar.role === "primary" ? "primary" : "support"} target: ${delta < 0 ? `${Math.abs(delta)} coverage points below` : delta > 0 ? `${delta} coverage points above` : "exactly at"} the ${bar.role} target. ${band.label}.`}
    >
      <span className="rate-stack-row-name" title={label(bar.muscle)}>
        {label(bar.muscle)}
        {/* The role used to be a group heading, which sorted the list by
            something nobody was asking about. It is a property of the row. */}
        <small>{bar.role === "primary" ? "Primary" : "Support"}</small>
      </span>
      <span className="rate-stack-row-track">
        <i className="rate-stack-row-fill" style={{ width: `${bar.fillPercent}%` }} />
        <b className="rate-stack-row-target" style={{ left: `${bar.targetPercent}%` }} aria-hidden="true" />
      </span>
      <span className="rate-stack-row-delta">
        {delta === 0 ? "on target" : `${delta > 0 ? "+" : "−"}${Math.abs(delta)}`}
      </span>
      <span className="rate-stack-row-band" title={band.meaning}>
        <i aria-hidden="true">{band.glyph}</i>
        {band.label}
      </span>
    </li>
  );
}

function BandTally({ band, count }: { band: CoverageBand; count: number }) {
  if (!count) return null;
  const copy = coverageBandCopy[band];
  return (
    <span className={`rate-stack-tally rate-stack-tally-${band}`} title={copy.meaning}>
      <i aria-hidden="true">{copy.glyph}</i>
      {count} {copy.label.toLowerCase()}
    </span>
  );
}

/**
 * How this day reads, in three stages.
 *
 * It used to be one stage: a gauge, a sentence, a band tally, two group headings,
 * every bar in the split, a legend, and a second disclosure explaining the score -
 * around 600px of chart on a phone, above an exercise list, on a page you came to
 * in order to edit a day. Everything there was true and almost none of it was the
 * next thing to do.
 *
 * So the panel now answers one question per stage:
 *   1. Is this day any good, and what is short?  (the gauge, one sentence, the
 *      shortfalls as buttons that open the picker already filtered)
 *   2. How does every target actually measure up?  (the bars, worst first)
 *   3. Why, per exercise, and what would fix it?  (the full analysis page)
 *
 * Nothing was deleted; the last two moved behind the question they answer.
 */
export function RateStackPanel({ workout, catalog, split, sportId, prescriptions, onAdd, onReplace: _onReplace, onFixMuscle }: { workout: Exercise[]; catalog: Exercise[]; split: TrainingSplit; sportId?: string; prescriptions?: Record<number, string>; onAdd: (exercise: Exercise) => void; onReplace: (outgoing: Exercise, incoming: Exercise) => void; onFixMuscle?: (muscle: string) => void; }) {
  const [open, setOpen] = useState(false);
  const analysis = useMemo(() => analyzeSplitStack(workout, catalog, split), [catalog, split, workout]);
  const bars = useMemo(() => buildCoverageBars(analysis.ratings), [analysis.ratings]);
  const summary = useMemo(() => summarizeCoverage(bars, label), [bars]);
  /**
   * "5 targets under, Pectoralis major 90 points short" is arithmetically true of
   * an empty day and reads as five failures before the athlete has added
   * anything. A day with nothing in it gets told that instead.
   */
  const headline = workout.length === 0
    ? `Nothing added yet — all ${bars.length} ${split.toLowerCase()} targets are open.`
    : summary.headline;
  /**
   * Under the mark first, worst first, because that is the order anyone reads
   * this in. Grouping by primary/support put three over-target rows above the
   * two the headline had just named as the problem.
   */
  const under = summary.shortfalls;
  const met = bars.filter((bar) => bar.deltaToTarget >= 0).sort((left, right) => left.deltaToTarget - right.deltaToTarget);

  return (
    <section className="rate-stack-panel">
      <header className="rate-stack-head">
        <CoverageDial score={analysis.score} />
        <div className="rate-stack-head-copy">
          <p className="rate-stack-eyebrow">
            <BarChart3 className="h-3.5 w-3.5" /> {split} coverage
          </p>
          <p className="rate-stack-headline">{headline}</p>
        </div>
      </header>

      {/* Stage one's only action: the shortfalls, as the search that closes them. */}
      {workout.length > 0 && under.length > 0 && <div className="rate-stack-fix">
        <p className="rate-stack-fix-label"><Wrench className="h-3.5 w-3.5" /> Short in this day</p>
        <ul className="rate-stack-fix-list">
          {under.slice(0, 3).map((bar) => <li key={bar.muscle}>
            {onFixMuscle
              ? <button type="button" onClick={() => onFixMuscle(bar.muscle)} aria-label={`Find ${label(bar.muscle)} exercises, ${Math.abs(bar.deltaToTarget)} points short`}>
                  <span>{label(bar.muscle)}</span><i>{Math.abs(bar.deltaToTarget)} short</i>
                </button>
              : <span className="rate-stack-fix-static"><span>{label(bar.muscle)}</span><i>{Math.abs(bar.deltaToTarget)} short</i></span>}
          </li>)}
          {under.length > 3 && <li className="rate-stack-fix-more">+{under.length - 3} more under target</li>}
        </ul>
      </div>}

      {workout.length === 0 ? (
        // Stage two is a disclosure over bars, and an empty day has none - but the
        // evidence boundary is not a property of the bars, so it stays stated.
        <div className="rate-stack-empty">
          <p>Add an exercise and the coverage bars fill in against each {split.toLowerCase()} target.</p>
          <p className="rate-stack-scope-note">What this score measures: {split.toLowerCase()} targets only.</p>
          <p className="rate-stack-boundary">{analysis.boundary}</p>
        </div>
      ) : (
        <details className="rate-stack-detail">
          <summary>
            <span>
              <strong>Every target, measured</strong>
              <small>{bars.length} {split.toLowerCase()} targets · how the score is built</small>
            </span>
            <ChevronDown className="h-4 w-4" />
          </summary>
          <div className="rate-stack-groups">
            <p className="rate-stack-tallies">
              <BandTally band="short" count={summary.short} />
              <BandTally band="near" count={summary.near} />
              <BandTally band="covered" count={summary.covered} />
              <BandTally band="heavy" count={summary.heavy} />
            </p>
            {under.length > 0 && (
              <div className="rate-stack-group">
                <p className="rate-stack-group-label">
                  Under target <small>furthest behind first</small>
                </p>
                <ul className="rate-stack-rows">
                  {under.map((bar) => <CoverageRow key={bar.muscle} bar={bar} />)}
                </ul>
              </div>
            )}
            {met.length > 0 && (
              <div className="rate-stack-group">
                <p className="rate-stack-group-label">
                  At or past target <small>nothing to do here</small>
                </p>
                <ul className="rate-stack-rows">
                  {met.map((bar) => <CoverageRow key={bar.muscle} bar={bar} />)}
                </ul>
              </div>
            )}
            <p className="rate-stack-legend">
              <span className="rate-stack-legend-target" aria-hidden="true" /> marks the {split.toLowerCase()} target each bar is measured against; the bar itself is what this day reached.
            </p>
            {/* The scope note was a second collapsed disclosure sitting under the
                first. It explains these bars, so it lives with them. */}
            <p className="rate-stack-scope-note">What this score measures: {split.toLowerCase()} targets only. Open the full analysis to inspect every muscle the stack involves.</p>
            <p className="rate-stack-boundary">{analysis.boundary}</p>
          </div>
        </details>
      )}

      <button onClick={() => setOpen(true)} className="rate-stack-trigger">
        <span>
          <Maximize2 className="h-4 w-4" /> Open full analysis
        </span>
        <small>{analysis.suggestions.length ? `${analysis.suggestions.length} suggested fix${analysis.suggestions.length === 1 ? "" : "es"}` : "body map and per-exercise breakdown"}</small>
        <ChevronRight className="h-4 w-4" />
      </button>

      {open && (
        <StackAnalysisPage
          workout={workout}
          split={split}
          dayLabel="Active Training Day"
          targetIndex={analysis.score}
          suggestions={analysis.suggestions}
          catalog={catalog}
          sportId={sportId}
          prescriptions={prescriptions}
          onAddSuggestion={onAdd}
          onClose={() => setOpen(false)}
          onInspectExercise={() => undefined}
        />
      )}
    </section>
  );
}
