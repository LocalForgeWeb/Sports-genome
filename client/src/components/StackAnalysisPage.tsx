import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowUpRight, BarChart3, ChevronRight, Map as MapIcon, Plus, Target, X } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import type { TrainingSplit } from "@/lib/splitAssignment";
import { getSplitRequirements, type StackSuggestion } from "@/lib/splitStackAnalysis";
import { buildProfileBars, describeProfileShape, profileAxisTicks, type LoadingMetrics } from "@/lib/loadingProfileVisual";
import { analyzeWholeStackMuscles } from "@/lib/stackMuscleAnalysis";
import { buildCoverageBars, coverageBandCopy } from "@/lib/stackCoverageVisual";
import { AnatomyMap, muscleLabels } from "@/components/AnatomyMap";
import "../stack-analysis.css";
import "../stack-analysis-supporting.css";

/**
 * The four demand indices as one shape on one axis.
 *
 * They were four bordered tiles, which hid the only thing they are for: these
 * measures matter relative to each other. A muscle loaded 80 in the stretch and
 * 25 at the top is a different exercise from the reverse, and four separate boxes
 * made those read the same.
 */
function LoadingProfile({ metrics }: { metrics: LoadingMetrics }) {
  const bars = buildProfileBars(metrics);
  const shape = describeProfileShape(metrics);
  return (
    <figure className="loading-profile">
      <figcaption className="loading-profile-caption">
        <span className="metric-label">Loading profile</span>
        <p className={`loading-profile-shape loading-profile-shape-${shape.bias}`}>{shape.summary}</p>
      </figcaption>
      <div className="loading-profile-plot">
        {profileAxisTicks.map((tick) => (
          <i key={tick} className="loading-profile-gridline" style={{ left: `${tick}%` }} aria-hidden="true" />
        ))}
        {bars.map((bar) => (
          <div key={bar.key} className="loading-profile-row" title={bar.meaning}>
            <span className="loading-profile-label">{bar.label}</span>
            <span className="loading-profile-track">
              <i style={{ width: `${bar.value}%` }} />
            </span>
            <span className="loading-profile-value">{bar.value}</span>
          </div>
        ))}
      </div>
      <p className="loading-profile-axis" aria-hidden="true"><span>0</span><span>50</span><span>100</span></p>
    </figure>
  );
}

/**
 * The same profile at row scale, so exercises can be compared down a column.
 *
 * Four bars rather than a polyline: a 4-point line across 44px is a shallow
 * squiggle that reads as a stray mark, while bars keep the shape legible and
 * echo the full-size chart above.
 */
function ProfileSpark({ metrics }: { metrics: LoadingMetrics }) {
  const shape = describeProfileShape(metrics);
  const bars = buildProfileBars(metrics);
  return (
    <span className="profile-spark" role="img" aria-label={`${shape.summary} ${bars.map((bar) => `${bar.label} ${bar.value}`).join(", ")}.`} title={shape.summary}>
      {bars.map((bar) => (
        <i key={bar.key} style={{ height: `${Math.max(6, bar.value)}%` }} />
      ))}
    </span>
  );
}

function TargetAdditions({ split, suggestions, onAddSuggestion }: { split: TrainingSplit; suggestions: StackSuggestion[]; onAddSuggestion?: (exercise: Exercise) => void }) {
  if (!suggestions.length) return null;
  const featured = suggestions.slice(0, 2);
  const remaining = suggestions.slice(featured.length);
  const optionRows = (items: StackSuggestion[]) => items.map((suggestion) => <article key={`${suggestion.muscle}-${suggestion.candidate.id}`}><div><strong>{suggestion.candidate.name}</strong><small>{muscleLabels[suggestion.muscle] || suggestion.muscle} · {suggestion.candidate.movement}</small>{suggestion.swapCue && <em>{suggestion.swapCue}</em>}</div>{onAddSuggestion && <button type="button" onClick={() => onAddSuggestion(suggestion.candidate)}><Plus className="h-3.5 w-3.5" /> Add</button>}</article>);
  return <section className="stack-analysis-next-picks"><div className="stack-analysis-next-picks-head"><div><p className="metric-label">Best next picks</p><p>Direct options for the visible {split.toLowerCase()} gaps.</p></div><small>{suggestions.length} option{suggestions.length === 1 ? "" : "s"}</small></div><div className="stack-analysis-next-pick-list">{optionRows(featured)}</div>{remaining.length > 0 && <details className="stack-analysis-more-picks"><summary>View {remaining.length} more compatible option{remaining.length === 1 ? "" : "s"}</summary><div>{optionRows(remaining)}</div></details>}<details className="stack-analysis-suggestion-boundary"><summary>Recommendation scope</summary><p>Suggestions use split-compatible catalog muscle tags for plan coverage. They are not activation measurements, individual outcome predictions, or sport-skill transfer evidence.</p></details></section>;
}

export function resolveStackMuscleSelection(selectedMuscle: string, availableMuscles: string[]) {
  return availableMuscles.includes(selectedMuscle) ? selectedMuscle : availableMuscles[0] || "";
}

export function StackAnalysisPage({ workout, split, dayLabel, targetIndex, suggestions = [], onAddSuggestion, onClose, onInspectExercise }: { workout: Exercise[]; split: TrainingSplit; dayLabel: string; targetIndex?: number; suggestions?: StackSuggestion[]; onAddSuggestion?: (exercise: Exercise) => void; onClose: () => void; onInspectExercise: (exerciseId: number) => void }) {
  const wholeStackAnalysis = useMemo(() => analyzeWholeStackMuscles(workout), [workout]);
  const targetMuscles = useMemo(() => new Set(getSplitRequirements(split).map((requirement) => requirement.muscle)), [split]);
  const targetAnalysis = useMemo(() => wholeStackAnalysis.filter((item) => targetMuscles.has(item.muscle)), [targetMuscles, wholeStackAnalysis]);
  const supportingAnalysis = useMemo(() => wholeStackAnalysis.filter((item) => !targetMuscles.has(item.muscle)), [targetMuscles, wholeStackAnalysis]);
  const coverageByMuscle = useMemo(() => {
    const requirements = getSplitRequirements(split);
    const ratings = requirements.map((requirement) => {
      const involvement = wholeStackAnalysis.find((item) => item.muscle === requirement.muscle)?.involvement ?? 0;
      return { ...requirement, score: involvement, state: "ready" as const };
    });
    return new Map(buildCoverageBars(ratings).map((bar) => [bar.muscle, bar]));
  }, [split, wholeStackAnalysis]);
  const [selectedMuscle, setSelectedMuscle] = useState("");
  const selected = targetAnalysis.find((item) => item.muscle === selectedMuscle) || targetAnalysis[0];

  useEffect(() => {
    const nextSelection = resolveStackMuscleSelection(selectedMuscle, targetAnalysis.map((item) => item.muscle));
    if (nextSelection !== selectedMuscle) setSelectedMuscle(nextSelection);
  }, [selectedMuscle, targetAnalysis]);

  const primary = targetAnalysis.filter((item) => item.primaryExercises > 0).map((item) => item.muscle);
  const secondary = targetAnalysis.filter((item) => item.primaryExercises === 0).map((item) => item.muscle);
  const muscleScores = useMemo(() => Object.fromEntries(targetAnalysis.map((item) => [item.muscle, item.involvement])), [targetAnalysis]);

  return <div className="stack-analysis-overlay" role="dialog" aria-modal="true" aria-label="Training Day stack analysis"><section className="stack-analysis-page"><header className="stack-analysis-head"><div><p className="metric-label">Training Day analysis</p><h1>{split} coverage</h1><p>{dayLabel}</p></div><button type="button" onClick={onClose} aria-label="Close stack analysis"><X className="h-5 w-5" /></button></header>{workout.length ? <main className="stack-analysis-main"><section className="stack-analysis-rank"><div className="stack-analysis-rank-head"><div><p className="metric-label">Split targets</p><h2>Coverage</h2></div>{targetIndex !== undefined && <strong className="stack-analysis-index-badge">{targetIndex}<small>/100</small></strong>}</div><p className="stack-analysis-hint">Target coverage is calculated from this split’s intended muscles only.</p><TargetAdditions split={split} suggestions={suggestions} onAddSuggestion={onAddSuggestion} /><div className="stack-analysis-list">{targetAnalysis.map((item, index) => { const bar = coverageByMuscle.get(item.muscle); return <button type="button" key={item.muscle} onClick={() => setSelectedMuscle(item.muscle)} className={`stack-analysis-row${item.muscle === selected?.muscle ? " stack-analysis-row-active" : ""}${bar ? ` stack-analysis-row-${bar.band}` : ""}`}><span>{String(index + 1).padStart(2, "0")}</span><div className="stack-analysis-row-copy"><strong>{muscleLabels[item.muscle] || item.muscle}</strong><small>{item.primaryExercises ? `${item.primaryExercises} direct` : `${item.supportingExercises} supporting`}</small><i>{bar && <b className="stack-analysis-row-fill" style={{ width: `${bar.fillPercent}%` }} />}{bar && <u className="stack-analysis-row-target" style={{ left: `${bar.targetPercent}%` }} aria-hidden="true" />}{!bar && <b style={{ width: `${item.involvement}%` }} />}</i></div><em className="stack-analysis-row-score">{bar ? <><small>{coverageBandCopy[bar.band].glyph} {coverageBandCopy[bar.band].label}</small>{bar.deltaToTarget > 0 ? "+" : bar.deltaToTarget < 0 ? "−" : ""}{Math.abs(bar.deltaToTarget) || "on target"}</> : <><small>coverage</small>{item.involvement}%</>}</em><ChevronRight className="h-4 w-4" /></button>; })}</div>{supportingAnalysis.length > 0 && <details className="stack-analysis-supporting"><summary><span>Supporting involvement</span><small>{supportingAnalysis.length} groups</small></summary><p>Supporting muscles are not included in the {split.toLowerCase()} target grade or the default target map.</p><div>{supportingAnalysis.map((item) => <span key={item.muscle}>{muscleLabels[item.muscle] || item.muscle} <b>{item.involvement}%</b></span>)}</div></details>}</section><section className="stack-analysis-body"><div className="stack-analysis-summary"><div><BarChart3 className="h-4 w-4" /><span>{workout.length} exercises</span></div><div><Target className="h-4 w-4" /><span>{targetAnalysis.length} targets</span></div></div><details className="stack-analysis-map-disclosure"><summary><span><MapIcon className="h-4 w-4" /> View split target map</span><small>Qualitative</small></summary><div className="stack-analysis-map-frame"><AnatomyMap primary={primary} secondary={secondary} muscleScores={muscleScores} showInspector={false} onSelect={setSelectedMuscle} /></div></details></section>{selected && <details className="stack-analysis-detail-disclosure"><summary><span>Inspect {muscleLabels[selected.muscle] || selected.muscle}</span><small>{selected.involvement}% coverage</small></summary><section className="stack-analysis-detail"><div className="stack-analysis-detail-head"><div><p className="metric-label">Selected {split.toLowerCase()} target / stack breakdown</p><h2>{muscleLabels[selected.muscle] || selected.muscle}</h2><p>{selected.primaryExercises ? `${selected.primaryExercises} exercise${selected.primaryExercises === 1 ? "" : "s"} uses this target muscle as a prime mover.` : "This target muscle works in a supporting role across the selected stack."}</p></div><span>{selected.involvement}%</span></div><LoadingProfile metrics={selected} /><div className="stack-analysis-contributions"><p className="metric-label stack-analysis-contribution-heading">Where this comes from<span>relative contribution, /100</span></p>{selected.contributions.map((contribution) => <article key={`${contribution.exerciseId}-${contribution.role}`}><button type="button" onClick={() => onInspectExercise(contribution.exerciseId)}><span className="contribution-copy"><strong>{contribution.exerciseName}</strong><small>{contribution.movement} · {contribution.role}</small></span><ProfileSpark metrics={contribution} /><span className="contribution-score">{contribution.involvement}<small>/100</small></span><ArrowUpRight className="h-3.5 w-3.5" /></button></article>)}</div></section></details>}<p className="stack-analysis-boundary">This visualization combines the catalog’s primary, synergist, and stabilizer classifications. It supports training-plan comparison and does not diagnose, measure electromyography, or guarantee an individual response.</p></main> : <div className="stack-analysis-empty"><Activity className="h-8 w-8" /><h2>Build a Training Day to analyze the stack.</h2><p>Add exercises first, then reopen Stack Analysis to see split-target coverage and optional supporting involvement.</p></div>}</section></div>;
}
