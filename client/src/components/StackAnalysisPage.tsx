import { plural } from "@/lib/plural";
import { isKeyForAnotherLayer } from "@/lib/modalLayer";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Activity, BarChart3, ChevronDown, ChevronRight, Lightbulb, Map as MapIcon, Plus, Target, X } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import { logicCalibration } from "@/lib/evidenceTraceability";
import type { TrainingSplit } from "@/lib/splitAssignment";
import { analyzeSplitStack, COVERAGE_TARGET_REVISION, getSplitRequirements, splitStackModelBoundary, type StackSuggestion } from "@/lib/splitStackAnalysis";
import { buildProfileBars, describeProfileShape, profileAxisTicks, type LoadingMetrics } from "@/lib/loadingProfileVisual";
import { analyzeWholeStackMuscles } from "@/lib/stackMuscleAnalysis";
import { buildCoverageBars, coverageBandCopy, coverageScaleMaximum, formatCoverageDelta, summarizeCoverage, type CoverageBand } from "@/lib/stackCoverageVisual";
import { analyzeStackQualities } from "@/lib/stackQualityCoverage";
import { getSessionMuscleVolume, parseSetCount, supportingSetsText, volumeReadingCopy } from "@/lib/sessionVolume";
import { buildStackTips } from "@/lib/stackTips";
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
          <i key={tick} className="loading-profile-gridline" style={{ "--tick": tick } as React.CSSProperties} aria-hidden="true" />
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
  return <section className="stack-analysis-next-picks"><div className="stack-analysis-next-picks-head"><div><p className="metric-label">Best next picks</p><p>Direct options for the visible {split.toLowerCase()} gaps.</p></div><small>{suggestions.length} option{suggestions.length === 1 ? "" : "s"}</small></div><div className="stack-analysis-next-pick-list">{optionRows(featured)}</div>{remaining.length > 0 && <details className="stack-analysis-more-picks"><summary>View {remaining.length} more compatible option{remaining.length === 1 ? "" : "s"}</summary><div>{optionRows(remaining)}</div></details>}</section>;
}

/** The section each tip's figure comes from, so a set count is never read as coverage. */
const tipBasis: Record<string, string> = { gap: "Coverage", volume: "Workload", quality: "Sport demands" };

/**
 * Readings of this stack, placed where they are read first.
 *
 * Each carries the figure it fired on so it can be checked against the bars
 * below, rather than taken on faith. They sat inside Coverage, where a set-count
 * tip read as a coverage finding (Sep 30 brief §7); now they head the page, each
 * named by the section its figure comes from.
 */
function StackTips({ tips }: { tips: { id: string; kind: string; text: string }[] }) {
  if (!tips.length) return null;
  return (
    <section className="stack-tips" aria-label="What stands out in this stack">
      <p className="metric-label">What stands out</p>
      <ul>
        {tips.map((tip) => (
          <li key={tip.id} className={`stack-tip stack-tip-${tip.kind}`}>
            <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{tipBasis[tip.kind] && <b className="stack-tip-basis">{tipBasis[tip.kind]} · </b>}{tip.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * The sport's demand register against what this stack trains.
 *
 * Both vocabularies already existed - catalog `qualities` tags and
 * `SportDemandKey`s - and had never been joined, so an athlete could not see
 * that their sport asks for trunk bracing and their stack contains none of it.
 * The per-demand baseline is the split's own catalog share, not an invented
 * target: a demand this split cannot serve is not the stack's failure.
 */
function QualityCoverage({ analysis, split }: { analysis: NonNullable<ReturnType<typeof analyzeStackQualities>>; split: TrainingSplit }) {
  const rows = analysis.covered.concat(analysis.absent);
  if (!rows.length) return null;
  return (
    <section className="quality-coverage">
      <h3 className="metric-label stack-analysis-contribution-heading">
        Sport demands<span>from your sport's register, against this stack</span>
      </h3>
      <ul className="quality-rows">
        {rows.map((row) => (
          <li key={row.key} className={row.exercises ? "quality-row quality-row-covered" : "quality-row quality-row-absent"}>
            <span className="quality-row-name">{row.label}</span>
            <span className="quality-row-count">
              <i aria-hidden="true">{row.exercises ? "✓" : "—"}</i>
              {row.exercises ? `${row.exercises} exercise${row.exercises === 1 ? "" : "s"}` : "none here"}
            </span>
            {/* The catalog's share, not this stack's: it was drawn as a filled bar beside the
                stack's own count, as if it were the stack's coverage (Sep 28 regression brief §8). */}
            <span className="quality-row-share">
              <small>{row.splitShare}% of {split.toLowerCase()}-fit catalog exercises carry it</small>
            </span>
          </li>
        ))}
      </ul>
      {analysis.extra.length > 0 && (
        <p className="quality-extra">
          Also trained, not on the register: {analysis.extra.slice(0, 4).map((row) => row.label.toLowerCase()).join(", ")}.
        </p>
      )}
    </section>
  );
}

/**
 * Workload: session set volume per muscle, with too-little and too-much called out.
 *
 * Every bar is direct sets plus supporting sets at half a set, on one scale. Only the
 * direct count was printed, so Anterior deltoid's bar was the longest on the chart while
 * its number read "3 sets" beside Pectoralis major's "6 sets" (Sep 30 brief §7). Both
 * values are printed now, and the scale's maximum is named.
 */
function SessionVolume({ volumes, muscleName }: { volumes: ReturnType<typeof getSessionMuscleVolume>; muscleName: (muscle: string) => string }) {
  if (!volumes.length) return null;
  const widest = Math.max(...volumes.map((entry) => entry.directSets + entry.supportSets), 1);
  return (
    <section className="stack-analysis-body stack-analysis-workload session-volume" aria-labelledby="stack-analysis-workload-title">
      <div className="stack-analysis-section-head">
        <p className="metric-label">Session volume</p>
        <h2 id="stack-analysis-workload-title">Workload</h2>
        <p className="stack-analysis-basis">Sets per muscle from your prescriptions. Not coverage points.</p>
      </div>
      <ul className="session-volume-rows">
        {volumes.map((entry) => {
          const copy = volumeReadingCopy[entry.reading];
          const supporting = entry.supportSets ? supportingSetsText(entry.supportSetsPerformed ?? entry.supportSets, entry.supportSets) : "";
          return (
            <li key={entry.muscle} className={`session-volume-row session-volume-${entry.reading}`} title={entry.note} aria-label={`${muscleName(entry.muscle)}: ${entry.directSets} direct ${entry.directSets === 1 ? "set" : "sets"}${supporting ? `, ${supporting}` : ""}. ${copy.label}.`}>
              <span className="session-volume-name">{muscleName(entry.muscle)}</span>
              <span className="session-volume-sets">{entry.directSets}<small> direct</small></span>
              <span className="session-volume-reading"><i aria-hidden="true">{copy.glyph}</i>{copy.label}</span>
              <span className="session-volume-track">
                <i className="session-volume-direct" style={{ width: `${(entry.directSets / widest) * 100}%` }} />
                <i className="session-volume-support" style={{ width: `${(entry.supportSets / widest) * 100}%` }} />
              </span>
              {supporting && <span className="session-volume-supporting">+ {supporting}</span>}
            </li>
          );
        })}
      </ul>
      <p className="session-volume-legend">
        <span><i className="session-volume-key-direct" aria-hidden="true" /> direct sets</span>
        <span><i className="session-volume-key-support" aria-hidden="true" /> supporting, at a half set each</span>
      </p>
      <p className="session-volume-scale">Every bar is on one scale, 0 to {Number(widest.toFixed(1))} sets.</p>
    </section>
  );
}

/** How many targets fall in one band, in the band's word and glyph. Moved here with the bars. */
function BandTally({ band, count }: { band: CoverageBand; count: number }) {
  if (!count) return null;
  const copy = coverageBandCopy[band];
  return (
    <span className={`stack-analysis-tally stack-analysis-tally-${band}`} title={copy.meaning}>
      <i aria-hidden="true">{copy.glyph}</i>
      {count} {copy.label.toLowerCase()}
    </span>
  );
}

/** Where the map's two colours come from on a training day, not a sporting action. */
const trainingDayRoleMethodology = "Prime mover: a prime mover in at least one exercise in this day. Supporting: a synergist or stabilizer only. From the catalog's muscle classifications; not activation, force or a measured response.";

export function resolveStackMuscleSelection(selectedMuscle: string, availableMuscles: string[]) {
  return availableMuscles.includes(selectedMuscle) ? selectedMuscle : availableMuscles[0] || "";
}

const possessive = (name: string) => (name.endsWith("s") ? `${name}'` : `${name}'s`);

/**
 * The Inspect summary's metric line: relative involvement as a share of the day's highest
 * muscle on the same basis, named. It read "100% of the day's most-worked muscle", which
 * sounded like sets and sat under set counts that disagreed with it (Sep 30 brief §7).
 */
export function describeRelativeInvolvement(selected: { involvement: number; rawInvolvement: number }, highest: { muscle: string; rawInvolvement: number } | undefined, muscleName: (muscle: string) => string) {
  if (!highest || selected.rawInvolvement >= highest.rawInvolvement) return "Highest relative involvement in this day";
  return `${selected.involvement}% of ${possessive(muscleName(highest.muscle))} involvement, the day's highest`;
}

const { primaryRoleWeight, synergistRoleWeight, stabilizerRoleWeight } = logicCalibration.exposure;
/** What relative involvement is made of, said where the figure is read. */
export const relativeInvolvementBasis = `From exercise roles in the catalog genome: prime mover ×${primaryRoleWeight}, synergist ×${synergistRoleWeight}, stabilizer ×${stabilizerRoleWeight}, summed over this day's exercises. Set counts are not included; see Workload for sets.`;

export function StackAnalysisPage({ workout, split, dayLabel, targetIndex, suggestions = [], catalog = [], sportId, prescriptions, ratings, boundary = splitStackModelBoundary, onAddSuggestion, onClose, onAddExercises }: { workout: Exercise[]; split: TrainingSplit; dayLabel: string; /** The opening panel's own coverage ratings, so both views name one gap. */ ratings?: Parameters<typeof buildCoverageBars>[0]; /** The coverage model's own statement of what its numbers are. */ boundary?: string; targetIndex?: number; suggestions?: StackSuggestion[]; catalog?: Exercise[]; sportId?: string; prescriptions?: Record<number, string>; onAddSuggestion?: (exercise: Exercise) => void; onClose: () => void; /** Opens the day's picker from the empty state, bound to the same day. */ onAddExercises?: () => void }) {
  const wholeStackAnalysis = useMemo(() => analyzeWholeStackMuscles(workout), [workout]);
  const targetMuscles = useMemo(() => new Set(getSplitRequirements(split).map((requirement) => requirement.muscle)), [split]);
  const targetAnalysis = useMemo(() => wholeStackAnalysis.filter((item) => targetMuscles.has(item.muscle)), [targetMuscles, wholeStackAnalysis]);
  const supportingAnalysis = useMemo(() => wholeStackAnalysis.filter((item) => !targetMuscles.has(item.muscle)), [targetMuscles, wholeStackAnalysis]);
  // The same coverage the panel that opened this page showed (D02): its ratings
  // are handed in, so the gap the summary named is the gap this page explains.
  // Without them the page computes the same model itself - never the relative
  // involvement below, which is a share of the day's highest muscle and moved a
  // muscle's "gap" when an unrelated exercise was added (TR-01, TR-02, B115).
  const coverageRatings = useMemo(() => ratings ?? analyzeSplitStack(workout, catalog, split).ratings, [split, workout, catalog, ratings]);
  const coverageByMuscle = useMemo(() => new Map(buildCoverageBars(coverageRatings).map((bar) => [bar.muscle, bar])), [coverageRatings]);
  /**
   * Every split target, in the Plan summary's order: under target worst first, then the
   * rest nearest first (Sep 28 regression brief §8). It listed only the targets the day
   * involved, numbered 01, 02... by genome involvement, so the order and the numbering
   * disagreed with the gap the Plan had just named.
   */
  const coverageSummary = useMemo(() => summarizeCoverage(Array.from(coverageByMuscle.values()), (muscle) => muscleLabels[muscle] || muscle), [coverageByMuscle]);
  const coverageRows = useMemo(() => {
    const met = Array.from(coverageByMuscle.values()).filter((bar) => bar.deltaToTarget >= 0).sort((left, right) => left.deltaToTarget - right.deltaToTarget);
    return coverageSummary.shortfalls.concat(met);
  }, [coverageByMuscle, coverageSummary]);
  const coverageScale = useMemo(() => coverageScaleMaximum(coverageRatings), [coverageRatings]);
  const sessionVolumes = useMemo(
    () => getSessionMuscleVolume(workout, (exercise) => parseSetCount(prescriptions?.[exercise.id])),
    [prescriptions, workout]
  );
  const qualityCoverage = useMemo(
    () => sportId && catalog.length ? analyzeStackQualities({ workout, catalog, split, sportId }) : null,
    [catalog, split, sportId, workout]
  );

  const [selectedMuscle, setSelectedMuscle] = useState("");
  const selected = targetAnalysis.find((item) => item.muscle === selectedMuscle) || targetAnalysis[0];

  useEffect(() => {
    const nextSelection = resolveStackMuscleSelection(selectedMuscle, targetAnalysis.map((item) => item.muscle));
    if (nextSelection !== selectedMuscle) setSelectedMuscle(nextSelection);
  }, [selectedMuscle, targetAnalysis]);

  /**
   * A coverage row opens Inspect and brings it into view. The row only changed the closed
   * summary, about 2000px further down, so on a phone nothing visibly happened (Sep 30
   * brief §7). Focus goes to Inspect's summary, so the keyboard lands where the screen does.
   */
  const inspectRef = useRef<HTMLDetailsElement>(null);
  const [inspectOpen, setInspectOpen] = useState(false);
  const [inspectRequest, setInspectRequest] = useState(0);
  const inspectMuscle = (muscle: string) => {
    setSelectedMuscle(muscle);
    setInspectOpen(true);
    setInspectRequest((count) => count + 1);
  };
  /**
   * The figure only selects. Inspect opens directly under the map, and the figure and focus stay
   * put. When a map tap also scrolled to Inspect and focused it, every tap pushed the figure
   * off-screen, so comparing a second muscle meant scrolling back past the detail.
   */
  const showFromMap = (muscle: string) => {
    setSelectedMuscle(muscle);
    setInspectOpen(true);
  };
  useEffect(() => {
    const details = inspectRef.current;
    if (!inspectRequest || !details) return;
    details.querySelector("summary")?.focus({ preventScroll: true });
    // The page's header is sticky; stop below it rather than underneath it.
    const header = overlayRef.current?.querySelector<HTMLElement>(".stack-analysis-head");
    details.style.scrollMarginTop = `${(header?.offsetHeight ?? 0) + 12}px`;
    const reduceMotion = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    details.scrollIntoView?.({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });
  }, [inspectRequest]);
  const highestMuscle = wholeStackAnalysis[0];
  const muscleName = (muscle: string) => muscleLabels[muscle] || muscle;

  const tips = useMemo(() => buildStackTips({
    shortfalls: Array.from(coverageByMuscle.values()).filter((bar) => bar.deltaToTarget < 0).sort((left, right) => left.deltaToTarget - right.deltaToTarget),
    volumes: sessionVolumes,
    absentDemands: qualityCoverage?.absent || [],
    suggestionCount: suggestions.length,
    muscleName: (muscle) => muscleLabels[muscle] || muscle,
    splitTargets: targetMuscles,
  }), [coverageByMuscle, qualityCoverage, sessionVolumes, suggestions.length, targetMuscles]);

  const primary = targetAnalysis.filter((item) => item.primaryExercises > 0).map((item) => item.muscle);
  const secondary = targetAnalysis.filter((item) => item.primaryExercises === 0).map((item) => item.muscle);
  const muscleScores = useMemo(() => Object.fromEntries(targetAnalysis.map((item) => [item.muscle, item.involvement])), [targetAnalysis]);

  const overlayRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // The panel passes a fresh onClose on every render, and adding a suggestion from
  // here re-renders it; reading onClose through a ref keeps the effect below from
  // re-running, bouncing focus behind the overlay and dropping the scroll lock.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Escape closes it and focus comes back to Open full analysis, the way every
  // other layer over this page behaves. The page behind holds still while it is up.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      // Search opened over the analysis closes itself first and hands the page
      // back locked; closing the analysis under it would unlock the page early.
      if (isKeyForAnotherLayer(event, overlayRef.current)) return;
      if (event.key === "Escape") { event.stopPropagation(); onCloseRef.current(); }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = previousOverflow;
      if (opener && opener !== document.body && opener.isConnected) opener.focus?.({ preventScroll: true });
    };
    // The opener and the scroll lock belong to this one presentation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rendered at the document body, not inside the coverage panel: a transformed
  // ancestor turns `position: fixed` into a box inside itself, which is how this
  // full-height surface came to draw as a small inset scroller under the panel.
  const page = (
    <div ref={overlayRef} className="stack-analysis-overlay" role="dialog" aria-modal="true" aria-label="Training Day stack analysis">
      <section className="stack-analysis-page">
        {/* "{split} coverage" titled a page that also measures sets and relative involvement (Sep 30 brief §7). */}
        <header className="stack-analysis-head"><div><p className="metric-label">Training Day</p><h1>{split} analysis</h1><p>{dayLabel}</p></div><button ref={closeRef} type="button" onClick={onClose} aria-label="Close stack analysis"><X className="h-5 w-5" aria-hidden="true" /> Close</button></header>
        {workout.length ? (
          /* Three measures, three named sections (Sep 30 brief §7): Coverage counts catalog tags
             against the split's targets, Workload counts prescribed sets, and Muscle breakdown
             weighs exercise roles. They shared boxes, and only coverage had a heading. */
          <main className="stack-analysis-main">
            <StackTips tips={tips} />
            <section className="stack-analysis-rank" aria-labelledby="stack-analysis-coverage-title">
              <div className="stack-analysis-rank-head"><div><p className="metric-label">Split targets</p><h2 id="stack-analysis-coverage-title">Coverage</h2></div>{targetIndex !== undefined && <strong className="stack-analysis-index-badge" aria-label={`Coverage index ${targetIndex} out of 100`}>{targetIndex}<small>/100</small><em>coverage index</em></strong>}</div>
              <p className="stack-analysis-basis">Catalog muscle tags against the {split.toLowerCase()} targets. Not sets.</p>
              {/* It read "4 targets" under tallies that counted 5: the targets this day trains, not the split's. */}
              <div className="stack-analysis-summary"><div><BarChart3 className="h-4 w-4" aria-hidden="true" /><span>{plural(workout.length, "exercise")}</span></div><div><Target className="h-4 w-4" aria-hidden="true" /><span>{targetAnalysis.length} of {coverageRows.length} targets trained</span></div></div>
              <TargetAdditions split={split} suggestions={suggestions} onAddSuggestion={onAddSuggestion} />
              <p className="stack-analysis-tallies"><BandTally band="short" count={coverageSummary.short} /><BandTally band="near" count={coverageSummary.near} /><BandTally band="covered" count={coverageSummary.covered} /><BandTally band="heavy" count={coverageSummary.heavy} /></p>
              <div className="stack-analysis-list">{coverageRows.map((bar) => {
                const item = targetAnalysis.find((entry) => entry.muscle === bar.muscle);
                const band = coverageBandCopy[bar.band];
                const name = muscleName(bar.muscle);
                const role = `${bar.role === "primary" ? "Primary" : "Support"} target · ${item ? (item.primaryExercises ? `prime mover in ${plural(item.primaryExercises, "exercise")}` : `supporting in ${plural(item.supportingExercises, "exercise")}`) : "not trained in this day"}`;
                // The bar is its own row of the grid, the full width of every row, so one
                // percentage draws one length; inside the copy column it shrank with the score.
                const content = <><div className="stack-analysis-row-copy"><strong>{name}</strong><small>{role}</small></div><em className="stack-analysis-row-score" title={band.meaning}><small>{band.glyph} {band.label}</small>{formatCoverageDelta(bar.deltaToTarget, { short: true })}</em><i className="stack-analysis-row-bar"><b className="stack-analysis-row-fill" style={{ width: `${bar.fillPercent}%` }} /><u className="stack-analysis-row-target" style={{ left: `${bar.targetPercent}%` }} aria-hidden="true" /></i></>;
                const describe = `${name}, ${role}: ${formatCoverageDelta(bar.deltaToTarget)}. ${band.label}.`;
                return item
                  ? <button type="button" key={bar.muscle} aria-label={`${describe} Opens its muscle breakdown.`} onClick={() => inspectMuscle(item.muscle)} className={`stack-analysis-row stack-analysis-row-${bar.band}${item.muscle === selected?.muscle ? " stack-analysis-row-active" : ""}`}>{content}<ChevronRight className="stack-analysis-row-chevron h-4 w-4" aria-hidden="true" /></button>
                  : <div key={bar.muscle} aria-label={describe} className={`stack-analysis-row stack-analysis-row-${bar.band} stack-analysis-row-untrained`}>{content}</div>;
              })}</div>
              <p className="stack-analysis-legend"><span className="stack-analysis-legend-target" aria-hidden="true" /> marks each {split.toLowerCase()} target; the bar is what this day reached, in coverage points on one scale from 0 to {coverageScale}.</p>
              {qualityCoverage && <QualityCoverage analysis={qualityCoverage} split={split} />}
            </section>
            {/* One column beside Coverage on wide screens: Workload, then Muscle breakdown directly
                under it. Muscle breakdown spanned the full width below Coverage, which left about
                800px of empty column beside Coverage at 1280px. */}
            <div className="stack-analysis-aside">
              <SessionVolume volumes={sessionVolumes} muscleName={muscleName} />
              <section className="stack-analysis-breakdown" aria-labelledby="stack-analysis-breakdown-title">
                <div className="stack-analysis-section-head"><p className="metric-label">Relative involvement</p><h2 id="stack-analysis-breakdown-title">Muscle breakdown</h2><p className="stack-analysis-basis">From exercise roles in the catalog genome, as a share of the day's highest muscle. Not sets.</p></div>
                {/* The map comes before Inspect, so a muscle picked on the figure opens its summary directly below the figure. */}
                <details className="stack-analysis-map-disclosure"><summary><span><MapIcon className="h-4 w-4" /> View split target map</span><small>Qualitative</small></summary>{/* destination-body: the atlas's dark surface is defined for Body Lab; without it the
    map drew as a white panel with near-invisible labels on this dark page. */}<div className="stack-analysis-map-frame destination-body"><AnatomyMap primary={primary} secondary={secondary} muscleScores={muscleScores} showInspector={false} onSelect={(muscle) => (targetAnalysis.some((item) => item.muscle === muscle) ? showFromMap(muscle) : setSelectedMuscle(muscle))} roleSource="training-day" roleMethodology={trainingDayRoleMethodology} /></div></details>
                {selected && (
                  <details ref={inspectRef} className="stack-analysis-detail-disclosure" open={inspectOpen} onToggle={(event) => setInspectOpen(event.currentTarget.open)}>
                    {/* Two lines: the action, then its figure. Side by side they squeezed the action
                        into a 132px column three lines tall, with no sign it opened (Sep 30 brief §7). */}
                    <summary><span className="stack-analysis-inspect-action">Inspect {muscleName(selected.muscle)}</span><small className="stack-analysis-inspect-metric">{describeRelativeInvolvement(selected, highestMuscle, muscleName)}</small><ChevronDown className="stack-analysis-inspect-chevron h-4 w-4" aria-hidden="true" /></summary>
                    <section className="stack-analysis-detail">
                      {/* h3: the muscle belongs under Muscle breakdown, not beside it in the outline. */}
                      <div className="stack-analysis-detail-head"><div><p className="metric-label">Selected {split.toLowerCase()} target / stack breakdown</p><h3>{muscleName(selected.muscle)}</h3><p>{selected.primaryExercises ? `${plural(selected.primaryExercises, "exercise")} ${selected.primaryExercises === 1 ? "uses" : "use"} this target muscle as a prime mover.` : "This target muscle works in a supporting role across the selected stack."}</p></div><span>{selected.involvement}%<small>relative involvement</small></span></div>
                      <p className="stack-analysis-basis stack-analysis-detail-basis">{relativeInvolvementBasis}</p>
                      <LoadingProfile metrics={selected} />
                      {/* Static rows: each was a button whose handler did nothing (Sep 30 brief §7). */}
                      <div className="stack-analysis-contributions"><p className="metric-label stack-analysis-contribution-heading">Where this comes from<span>contribution index, 0–100, before role weighting</span></p>{selected.contributions.map((contribution, index) => <article key={`${contribution.exerciseId}-${contribution.role}-${index}`}><div className="contribution-row"><span className="contribution-copy"><strong>{contribution.exerciseName}</strong><small>{contribution.movement} · {contribution.role}</small></span><ProfileSpark metrics={contribution} /><span className="contribution-score">{contribution.involvement}</span></div></article>)}</div>
                    </section>
                  </details>
                )}
                {supportingAnalysis.length > 0 && <details className="stack-analysis-supporting"><summary><span>Supporting involvement</span><small>{plural(supportingAnalysis.length, "group")}</small></summary><p>Not {split.toLowerCase()} targets, so not in the coverage index. Each figure is a share of {highestMuscle ? `${possessive(muscleName(highestMuscle.muscle))} involvement, the day's highest` : "the day's highest muscle"}.</p><div>{supportingAnalysis.map((item) => <span key={item.muscle}>{muscleName(item.muscle)} <b>{item.involvement}%</b></span>)}</div></details>}
              </section>
            </div>
            {/* The methodology, once, behind one disclosure. It was said in six places across the
                Plan and this page, twice in full (Sep 28 regression brief §8). It covers all three
                measures, so it no longer sits under a coverage heading (Sep 30 brief §7). */}
            <details className="stack-analysis-method"><summary>How these figures are calculated</summary><div><p>{boundary}</p><p>The coverage index is the average, over the {coverageRows.length} {split.toLowerCase()} targets, of how much of its target each reaches, counting at most 100 per target. Set counts are not counted. Target set: {COVERAGE_TARGET_REVISION}.</p><p>Reaching every target means this day's catalog tags cover the split. It does not mean the workload is optimal or that you are recovered.</p><p>Best next picks use split-compatible catalog muscle tags. They are not activation measurements, individual outcome predictions, or sport-skill transfer evidence.</p><p>Workload counts the sets in your prescriptions: direct sets in full, supporting sets at half a set each.</p><p>Muscle breakdown weighs each exercise's role in the catalog genome (prime mover ×{primaryRoleWeight}, synergist ×{synergistRoleWeight}, stabilizer ×{stabilizerRoleWeight}) and shows each muscle as a share of the day's highest; it does not count sets. The body map uses the same primary, synergist and stabilizer classifications. This supports training-plan comparison and does not diagnose, measure electromyography, or guarantee an individual response.</p></div></details>
          </main>
        ) : <div className="stack-analysis-empty"><Activity className="h-6 w-6" aria-hidden="true" /><h2>No exercises in {split} yet</h2><p>{dayLabel} has nothing to analyse. Add exercises and the coverage against every {split.toLowerCase()} target fills in here.</p>{onAddExercises ? <button type="button" className="stack-analysis-empty-action" onClick={onAddExercises}><Plus className="h-4 w-4" aria-hidden="true" /> Add exercises</button> : <p className="stack-analysis-empty-hint">Add exercises to the day from the plan and reopen this analysis.</p>}</div>}
      </section>
    </div>
  );
  return typeof document === "undefined" ? page : createPortal(page, document.body);
}
