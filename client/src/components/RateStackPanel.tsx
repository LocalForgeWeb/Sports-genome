import { useMemo, useState } from "react";
import { BarChart3, ChevronRight, Maximize2, Target } from "lucide-react";
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
      aria-label={`${label(bar.muscle)}: ${delta < 0 ? `${Math.abs(delta)} coverage points below` : delta > 0 ? `${delta} coverage points above` : "exactly at"} the ${bar.role} target. ${band.label}.`}
    >
      <span className="rate-stack-row-name" title={label(bar.muscle)}>{label(bar.muscle)}</span>
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

export function RateStackPanel({ workout, catalog, split, sportId, prescriptions, onAdd, onReplace: _onReplace }: { workout: Exercise[]; catalog: Exercise[]; split: TrainingSplit; sportId?: string; prescriptions?: Record<number, string>; onAdd: (exercise: Exercise) => void; onReplace: (outgoing: Exercise, incoming: Exercise) => void; }) {
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
  const primary = bars.filter((bar) => bar.role === "primary");
  const support = bars.filter((bar) => bar.role === "support");

  return (
    <section className="rate-stack-panel">
      <header className="rate-stack-head">
        <CoverageDial score={analysis.score} />
        <div className="rate-stack-head-copy">
          <p className="rate-stack-eyebrow">
            <BarChart3 className="h-3.5 w-3.5" /> {split} coverage
          </p>
          <p className="rate-stack-headline">{headline}</p>
          {workout.length > 0 && <p className="rate-stack-tallies">
            <BandTally band="short" count={summary.short} />
            <BandTally band="near" count={summary.near} />
            <BandTally band="covered" count={summary.covered} />
            <BandTally band="heavy" count={summary.heavy} />
          </p>}
        </div>
      </header>

      {workout.length === 0 ? (
        <p className="rate-stack-empty">Add an exercise and the coverage bars fill in against each {split.toLowerCase()} target.</p>
      ) : (
        <div className="rate-stack-groups">
          {primary.length > 0 && (
            <div className="rate-stack-group">
              <p className="rate-stack-group-label">
                Primary targets <small>the split is built on these</small>
              </p>
              <ul className="rate-stack-rows">
                {primary.map((bar) => <CoverageRow key={bar.muscle} bar={bar} />)}
              </ul>
            </div>
          )}
          {support.length > 0 && (
            <div className="rate-stack-group">
              <p className="rate-stack-group-label">
                Support targets <small>lower targets, still counted</small>
              </p>
              <ul className="rate-stack-rows">
                {support.map((bar) => <CoverageRow key={bar.muscle} bar={bar} />)}
              </ul>
            </div>
          )}
          <p className="rate-stack-legend">
            <span className="rate-stack-legend-fill" aria-hidden="true" /> coverage reached
            <span className="rate-stack-legend-target" aria-hidden="true" /> {split.toLowerCase()} target
          </p>
        </div>
      )}

      <button onClick={() => setOpen(true)} className="rate-stack-trigger">
        <span>
          <Maximize2 className="h-4 w-4" /> Open full analysis
        </span>
        <small>{analysis.suggestions.length ? `${analysis.suggestions.length} suggested fix${analysis.suggestions.length === 1 ? "" : "es"}` : "body map and per-exercise breakdown"}</small>
        <ChevronRight className="h-4 w-4" />
      </button>

      <details className="rate-stack-scope">
        <summary>
          <Target className="h-3.5 w-3.5" /> What this score measures
        </summary>
        <div>
          <p>This score looks at {split.toLowerCase()} targets only. Open the full analysis to inspect every muscle the stack involves.</p>
          <p className="rate-stack-boundary">{analysis.boundary}</p>
        </div>
      </details>

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
