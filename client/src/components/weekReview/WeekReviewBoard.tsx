import { ArrowRight, ArrowUpRight, ChevronDown, Plus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnatomyFigure } from "@/components/anatomy/AnatomyFigure";
import { drawnMuscleKeys } from "@/components/anatomy/figureGeometry";
import { EXPOSURE_STEPS } from "@/components/anatomy/exposurePaint";
import { muscleLabels } from "@/components/AnatomyMap";
import type { Exercise } from "@/lib/exerciseCatalog";
import { logicCalibration } from "@/lib/evidenceTraceability";
import { COMMON_MOVEMENT_COUNT, exposureByRegion, setsFigure, type ExposureMetric, type WeekAnalysis, type WeekFinding, type WeekFindingAction, type WeekMuscle, type WeekOverlapPair, type WeekReviewSession } from "@/lib/weekReview";
import "./week-review.css";

/**
 * The week, as one board (5 October 2026 brief §3): the sessions in plan order, one strength
 * and one review point, muscle exposure on the figure and as a ranked chart that share a
 * selection and a scale, movement coverage from the catalog's own taxonomy, session overlap
 * between neighbouring sessions, and at most three suggested adjustments with an action each.
 * Everything reads one `WeekAnalysis`; nothing here re-counts a set.
 *
 * Actions leave for Plan (Edit a day, Add exercises), the exercise sheet (Inspect) or the
 * catalog (Find exercises). None of them changes Home's next workout: that stays with the
 * Sep 28 rules, and only an explicit Open workout sets it.
 */
export type WeekReviewBoardProps = {
  analysis: WeekAnalysis;
  /** False before the plan has hydrated: the layout holds its place with no numbers. */
  ready: boolean;
  onEditWeek: () => void;
  onEditDay: (dayKey: string, options?: { addExercises?: boolean }) => void;
  onInspectExercise: (exercise: Exercise) => void;
  onFindExercises?: (muscleKey: string) => void;
};

type Selection = { kind: "muscle"; key: string } | { kind: "pair"; id: string } | null;

/** From 900px the two bodies and the chart share a row; below it one body and a control to turn it. */
const wideQuery = "(min-width: 900px)";
function useWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const query = window.matchMedia(wideQuery);
    const update = () => setWide(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);
  return wide;
}

const FEATURED_ROWS = 6;
const SHOWN_FINDINGS = 3;
const regionLabel = (key: string) => muscleLabels[key] || key;
const shortDay = (day: string) => (day === "Sport Transfer" ? "Sport" : day === "Full Body" ? "Full" : day);
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

export function WeekReviewBoard({ analysis, ready, onEditWeek, onEditDay, onInspectExercise, onFindExercises }: WeekReviewBoardProps) {
  const [metric, setMetric] = useState<ExposureMetric>("direct");
  const [side, setSide] = useState<"front" | "back">("front");
  const [selection, setSelection] = useState<Selection>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [moreFindings, setMoreFindings] = useState(false);
  const wide = useWide();
  const exposureRef = useRef<HTMLElement | null>(null);
  const overlapRef = useRef<HTMLElement | null>(null);

  const built = analysis.sessions.filter((session) => session.state === "built");
  const ranked = useMemo(() => [...analysis.muscles].sort((a, b) => b[metric] - a[metric] || b.total - a.total || a.label.localeCompare(b.label)), [analysis.muscles, metric]);
  const max = Math.max(1, analysis.max[metric]);
  const selectedMuscle = selection?.kind === "muscle" ? analysis.muscles.find((muscle) => muscle.key === selection.key) ?? null : null;
  const selectedPair = selection?.kind === "pair" ? analysis.overlap.pairs.find((pair) => pair.id === selection.id) ?? null : null;

  // A selection that the week no longer has (a muscle edited away) is dropped, not kept as a ghost.
  useEffect(() => {
    if (selection?.kind === "muscle" && !analysis.muscles.some((muscle) => muscle.key === selection.key)) setSelection(null);
    if (selection?.kind === "pair" && !analysis.overlap.pairs.some((pair) => pair.id === selection.id)) setSelection(null);
    if (selectedSession && !built.some((session) => session.key === selectedSession)) setSelectedSession(null);
  }, [analysis, selection, selectedSession, built]);

  const exposure = useMemo(() => {
    const byRegion: Record<string, number | "unknown"> = exposureByRegion(analysis.muscles, metric);
    // An exercise with no muscle mapping is in the week: a region with nothing counted cannot be
    // called zero, so it is marked unknown rather than painted as rest.
    if (analysis.unmapped.length) for (const key of [...drawnMuscleKeys.front, ...drawnMuscleKeys.back]) if (!byRegion[key]) byRegion[key] = "unknown";
    return byRegion;
  }, [analysis.muscles, analysis.unmapped.length, metric]);

  const muscleForRegion = (region: string) => analysis.muscles.find((muscle) => muscle.key === region) ?? analysis.muscles.find((muscle) => muscle.figureKeys.includes(region)) ?? null;
  const selectMuscle = (key: string) => setSelection((current) => (current?.kind === "muscle" && current.key === key ? null : { kind: "muscle", key }));
  const selectPair = (id: string) => setSelection((current) => (current?.kind === "pair" && current.id === id ? null : { kind: "pair", id }));
  const act = (action: WeekFindingAction) => {
    if (action.type === "edit-day") { onEditDay(action.dayKey, { addExercises: action.addExercises }); return; }
    if (action.type === "select-muscle") { setSelection({ kind: "muscle", key: action.muscle }); setShowAll(true); exposureRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    setSelection({ kind: "pair", id: action.pairId });
    overlapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const strength = analysis.findings.find((finding) => finding.kind === "strength") ?? null;
  const review = analysis.findings.filter((finding) => finding.kind === "review");
  const metricWord = metric === "direct" ? "direct sets" : "attributed sets";
  const describeRegion = (region: string) => {
    const value = exposure[region];
    if (value === "unknown") return `${regionLabel(region)}, unknown: an exercise without a muscle mapping is in this week`;
    return `${regionLabel(region)}, ${value ? `${setsFigure(value)} ${metricWord}` : "no planned work"}`;
  };

  if (!ready) return <div className="wr-board wr-loading" role="status" aria-label="Loading the week"><span /><span /><span /><span /></div>;

  const strip = <ol className="wr-strip" aria-label="Sessions in plan order">
    {analysis.sessions.map((session) => <li key={session.key}>
      {session.state === "built"
        ? <button type="button" className="wr-chip" aria-pressed={selectedSession === session.key} onClick={() => setSelectedSession((current) => (current === session.key ? null : session.key))}>
          <span>{session.day}</span><small>{plural(session.exerciseCount, "exercise")} · {plural(session.workSets, "set")}</small>
        </button>
        : <span className="wr-chip" data-state="empty"><span>{session.day}</span><small>Not built</small></span>}
    </li>)}
  </ol>;

  if (!analysis.builtCount) return <div className="wr-board" data-state="empty">
    {strip}
    <div className="wr-empty">
      <p>Nothing is built in this week yet. The review begins when a day has exercises in it.</p>
      <button type="button" className="wr-primary" onClick={onEditWeek}><Plus className="h-4 w-4" aria-hidden="true" /> Add a workout</button>
    </div>
  </div>;

  const sessionOf = (key: string | null) => built.find((session) => session.key === key) ?? null;
  const highlighted = sessionOf(selectedSession);

  return <div className="wr-board">
    {strip}

    {(strength || review[0]) ? <div className="wr-points">
      {strength && <p className="wr-point" data-kind="strength"><span>Strength</span><b>{strength.headline}</b></p>}
      {review[0] && <p className="wr-point" data-kind="review"><span>Review</span><b>{review[0].headline}</b><button type="button" className="wr-link" onClick={() => act(review[0].action)}>{review[0].action.label} <ArrowRight className="h-4 w-4" aria-hidden="true" /></button></p>}
    </div> : <p className="wr-note">Nothing to flag from the saved plan: no heavy overlap, no split-target gap, no muscle concentrated on one session.</p>}

    <section className="wr-section wr-exposure" ref={exposureRef} aria-labelledby="wr-exposure-heading">
      <div className="wr-section-head">
        <div><h2 id="wr-exposure-heading">Muscle exposure</h2><p>Planned sets per muscle across the {plural(analysis.builtCount, "built session")}, on one scale: the week's largest, {setsFigure(max)}.</p></div>
        <div className="wr-segment" role="group" aria-label="What the figure and chart count">
          <button type="button" aria-pressed={metric === "direct"} onClick={() => setMetric("direct")}>Direct sets</button>
          <button type="button" aria-pressed={metric === "total"} onClick={() => setMetric("total")}>With support (est.)</button>
        </div>
      </div>
      <div className="wr-exposure-body">
        <div className="wr-figure">
          {!wide && <div className="wr-segment wr-figure-side" role="group" aria-label="Side of the body">
            <button type="button" aria-pressed={side === "front"} onClick={() => setSide("front")}>Front</button>
            <button type="button" aria-pressed={side === "back"} onClick={() => setSide("back")}>Back</button>
          </div>}
          <AnatomyFigure view={wide ? "both" : side} captions={wide} roles={{}} exposureFor={exposure} exposureMax={max} selectedKeys={selectedMuscle?.figureKeys ?? []} onSelect={(region) => { const muscle = muscleForRegion(region); if (muscle) selectMuscle(muscle.key); }} labelFor={regionLabel} describeFor={describeRegion} />
          <div className="wr-legend" aria-label="Figure legend">
            <span><i className="wr-swatch-neutral" /> No planned work</span>
            <span><span className="wr-ramp" aria-hidden="true">{Array.from({ length: EXPOSURE_STEPS }, (_, index) => <i key={index} style={{ background: `var(--sg-exposure-${index + 1})` }} />)}</span> Fewer to more {metricWord}; the top step is {setsFigure(max)}</span>
            {analysis.unmapped.length > 0 && <span><i className="wr-swatch-unknown" /> Unknown: an exercise without a muscle mapping is in this week</span>}
          </div>
        </div>
        <div className="wr-chart">
          <div className="wr-legend wr-chart-legend" aria-label="Chart legend">
            <span><i className="wr-swatch-direct" /> Direct sets</span>
            {metric === "total" && <span><i className="wr-swatch-support" /> Supporting contribution, estimated: each supporting set adds {logicCalibration.exposure.secondarySetConvention}</span>}
            {highlighted && <span className="wr-legend-session">Figures in brackets: {highlighted.day} alone</span>}
          </div>
          <ol className="wr-muscles" aria-label={`Muscles ranked by ${metricWord}`}>
            {(showAll ? ranked : ranked.slice(0, FEATURED_ROWS)).map((muscle) => <MuscleRow key={muscle.key} muscle={muscle} metric={metric} max={max} selected={selectedMuscle?.key === muscle.key} session={highlighted} onSelect={() => selectMuscle(muscle.key)} />)}
          </ol>
          {ranked.length > FEATURED_ROWS && <button type="button" className="wr-link wr-viewall" aria-expanded={showAll} onClick={() => setShowAll((value) => !value)}>{showAll ? "Show the first six" : `View all muscles (${ranked.length})`} <ChevronDown className="h-4 w-4" aria-hidden="true" /></button>}
        </div>
      </div>
      {selectedMuscle && <MuscleDetail muscle={selectedMuscle} metric={metric} builtCount={analysis.builtCount} highlighted={highlighted} onClose={() => setSelection(null)} onEditDay={onEditDay} onInspectExercise={onInspectExercise} onFindExercises={onFindExercises} />}
      {analysis.dataNotes.map((note) => <p key={note} className="wr-note">{note}</p>)}
      <details className="wr-method">
        <summary>How these numbers are counted <ChevronDown className="h-4 w-4" aria-hidden="true" /></summary>
        <p>A set counts 1.0 to each muscle the catalog tags as primary and {logicCalibration.exposure.secondarySetConvention} to each tagged as secondary, applied once. The set count is the leading number of the saved prescription, otherwise the goal's default (which gives the first two exercises of a day 4 sets on three of the four goals), otherwise {logicCalibration.workoutReview.defaultPrescriptionSets}. Summed over every muscle, the week attributes {setsFigure(analysis.attributedTotal)} sets against {analysis.workSets} planned: one performed set counts toward every muscle it is tagged with, which is why that total is not on the board. The catalog's "Deltoids" tag is painted on all three deltoid heads and "Upper back" means the rhomboids and mid trapezius; each tag is its own row and no row is a sum of others. The register's planning landmarks, {logicCalibration.exposure.lowDirectSetBand} and {logicCalibration.exposure.highDirectSetBand} direct sets a week, have no recorded source and are not shown as badges. Per-side prescriptions, warm-ups, circuits and supersets are not represented in the plan, so a prescription's leading number is its set count. This is a planning estimate from the plan as written, not a measure of recovery, growth or readiness.</p>
      </details>
    </section>

    <section className="wr-section" aria-labelledby="wr-coverage-heading">
      <div className="wr-section-head"><div><h2 id="wr-coverage-heading">Movement coverage</h2><p>Each exercise's movement value from the catalog; a marker where a session contains it.</p></div></div>
      <ol className="wr-coverage">
        {analysis.patterns.map((pattern) => <li key={pattern.movement} className="wr-pattern">
          {/* The row opens to the exercises that carry the pattern, each with the sheet. */}
          <details className="wr-pattern-detail">
            <summary>
              <span className="wr-pattern-name">{pattern.movement} <small>{plural(pattern.exercises.length, "exercise")}</small></span>
              <span className="wr-pattern-sessions">{built.map((session) => { const present = pattern.sessionKeys.includes(session.key); return <span key={session.key} data-present={present ? "" : undefined} aria-label={`${session.day}: ${present ? "present" : "not in this session"}`}>{shortDay(session.day)}</span>; })}</span>
            </summary>
            <ul className="wr-exercises" aria-label={`${pattern.movement} exercises`}>
              {pattern.exercises.map((row, index) => <li key={`${row.sessionKey}-${row.exercise.id}-${index}`} className="wr-exercise">
                <span><b>{row.exercise.name}</b><small>{row.day}</small></span>
                <button type="button" className="wr-link" onClick={() => onInspectExercise(row.exercise)}>Inspect</button>
              </li>)}
            </ul>
          </details>
        </li>)}
      </ol>
      {analysis.notPlanned.length > 0 && <p className="wr-absent"><b>Not planned</b> {analysis.notPlanned.join(" · ")} <small>({analysis.notPlanned.length} of the catalog's {COMMON_MOVEMENT_COUNT} commonest patterns)</small></p>}
      {analysis.unknownPattern.length > 0 && <p className="wr-absent"><b>Unknown mapping</b> {analysis.unknownPattern.map((item) => `${item.exercise.name} (${item.day})`).join(" · ")}</p>}
    </section>

    <section className="wr-section" ref={overlapRef} aria-labelledby="wr-overlap-heading">
      <div className="wr-section-head"><div><h2 id="wr-overlap-heading">Session overlap</h2><p>Sessions next to each other in plan order. The plan has no dates, so this says nothing about calendar spacing.</p></div></div>
      {analysis.builtCount < 2
        ? <p className="wr-note">Build a second session to compare neighbouring sessions.</p>
        : <>
          {analysis.overlap.pairs.length > 0 && <ol className="wr-pairs" aria-label="Neighbouring session pairs">
            {analysis.overlap.pairs.map((pair) => <li key={pair.id}><button type="button" className="wr-chip wr-pair" data-heavy={pair.heavy ? "" : undefined} aria-pressed={selectedPair?.id === pair.id} onClick={() => selectPair(pair.id)}>
              <span>{pair.aDay} → {pair.bDay}</span>
              <small>{pair.shared.length ? `${plural(pair.shared.length, "shared muscle")} · ${setsFigure(pair.sharedExposure)} sets${pair.heavy ? " · heavy" : ""}` : "No shared muscle"}</small>
            </button></li>)}
          </ol>}
          {analysis.overlap.pairs.length === 0 && <p className="wr-note">No two built sessions sit next to each other in plan order.</p>}
          {analysis.overlap.skipped.length > 0 && <p className="wr-note">Not compared: {analysis.overlap.skipped.map((pair) => `${pair.aDay} and ${pair.bDay}`).join(", ")}, with an unbuilt day between them.</p>}
          {selectedPair && <PairDetail pair={selectedPair} onClose={() => setSelection(null)} onEditDay={onEditDay} />}
        </>}
    </section>

    <section className="wr-section" aria-labelledby="wr-adjust-heading">
      <div className="wr-section-head"><div><h2 id="wr-adjust-heading">Suggested adjustments</h2><p>Each one names its evidence and offers an action; none of them changes the plan on its own.</p></div></div>
      {review.length
        ? <ol className="wr-findings">{(moreFindings ? review : review.slice(0, SHOWN_FINDINGS)).map((finding) => <FindingRow key={finding.id} finding={finding} onAct={act} />)}</ol>
        : <p className="wr-note">Nothing to adjust from the saved plan: no heavy overlap, no split-target gap, no muscle concentrated on one session.</p>}
      {review.length > SHOWN_FINDINGS && <button type="button" className="wr-link" aria-expanded={moreFindings} onClick={() => setMoreFindings((value) => !value)}>{moreFindings ? "Show fewer" : `Show ${review.length - SHOWN_FINDINGS} more`} <ChevronDown className="h-4 w-4" aria-hidden="true" /></button>}
    </section>
  </div>;
}

function MuscleRow({ muscle, metric, max, selected, session, onSelect }: { muscle: WeekMuscle; metric: ExposureMetric; max: number; selected: boolean; session: WeekReviewSession | null; onSelect: () => void }) {
  const pct = (value: number) => `${Math.min(100, (value / max) * 100)}%`;
  const onSession = session ? muscle.byDay.find((entry) => entry.sessionKey === session.key) : null;
  const value = muscle.total === 0
    ? "Not planned"
    : `${setsFigure(muscle.direct)} direct${muscle.supporting ? ` · ${setsFigure(muscle.supporting)} supporting (est.)` : ""}${onSession ? ` (${setsFigure(onSession[metric])})` : ""}`;
  return <li>
    <button type="button" className="wr-muscle" aria-pressed={selected} data-empty={muscle.total === 0 ? "" : undefined} onClick={onSelect}>
      <span className="wr-muscle-head"><span className="wr-muscle-name">{muscle.label}</span><span className="wr-muscle-value">{value}</span></span>
      <span className="wr-track" role="img" aria-label={`${muscle.label}: ${setsFigure(muscle[metric])} of the week's largest ${setsFigure(max)}`}>
        <i className="wr-bar-direct" style={{ width: pct(muscle.direct) }} />
        {metric === "total" && muscle.supporting > 0 && <i className="wr-bar-support" style={{ left: pct(muscle.direct), width: pct(muscle.supporting) }} />}
      </span>
    </button>
  </li>;
}

function MuscleDetail({ muscle, metric, builtCount, highlighted, onClose, onEditDay, onInspectExercise, onFindExercises }: { muscle: WeekMuscle; metric: ExposureMetric; builtCount: number; highlighted: WeekReviewSession | null; onClose: () => void; onEditDay: WeekReviewBoardProps["onEditDay"]; onInspectExercise: WeekReviewBoardProps["onInspectExercise"]; onFindExercises?: WeekReviewBoardProps["onFindExercises"] }) {
  const scale = Math.max(1, muscle[metric]);
  const pct = (value: number) => `${Math.min(100, (value / scale) * 100)}%`;
  return <section className="wr-detail" aria-label={`${muscle.label} by session`}>
    <header>
      <div><h3>{muscle.label}</h3><p>{muscle.total === 0 ? `Nothing in this week trains it; it is here because a split target names it.` : `${setsFigure(muscle.direct)} direct · ${setsFigure(muscle.supporting)} supporting (est.) across ${muscle.sessionsTrained} of ${plural(builtCount, "built session")}.`}</p></div>
      <button type="button" className="wr-close" onClick={onClose} aria-label={`Close ${muscle.label}`}><X className="h-4 w-4" aria-hidden="true" /></button>
    </header>
    <ol className="wr-days" aria-label={`${muscle.label} by session, as a share of its week`}>
      {muscle.byDay.map((day) => <li key={day.sessionKey} className="wr-day" data-selected={highlighted?.key === day.sessionKey ? "" : undefined}>
        <span className="wr-day-name">{day.day}</span>
        <span className="wr-track" role="img" aria-label={`${day.day}: ${setsFigure(day[metric])} of ${setsFigure(scale)}`}>
          <i className="wr-bar-direct" style={{ width: pct(day.direct) }} />
          {metric === "total" && day.supporting > 0 && <i className="wr-bar-support" style={{ left: pct(day.direct), width: pct(day.supporting) }} />}
        </span>
        <span className="wr-day-value">{day.total === 0 ? "0" : `${setsFigure(day.direct)}${day.supporting ? ` + ${setsFigure(day.supporting)}` : ""}`}</span>
        <button type="button" className="wr-link" onClick={() => onEditDay(day.sessionKey)}>Edit {day.day} <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button>
      </li>)}
    </ol>
    {muscle.exercises.length > 0 && <ul className="wr-exercises" aria-label={`Exercises that give ${muscle.label} work`}>
      {muscle.exercises.map((row, index) => <li key={`${row.sessionKey}-${row.exercise.id}-${index}`} className="wr-exercise">
        <span><b>{row.exercise.name}</b><small>{row.day} · {plural(row.sets, "set")} · {row.role === "direct" ? "direct" : `supporting, counted as ${setsFigure(row.contribution)}`}</small></span>
        <button type="button" className="wr-link" onClick={() => onInspectExercise(row.exercise)}>Inspect</button>
      </li>)}
    </ul>}
    {onFindExercises && <button type="button" className="wr-link" onClick={() => onFindExercises(muscle.key)}>Find exercises for {muscle.label.toLowerCase()} <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>}
  </section>;
}

function PairDetail({ pair, onClose, onEditDay }: { pair: WeekOverlapPair; onClose: () => void; onEditDay: WeekReviewBoardProps["onEditDay"] }) {
  const scale = Math.max(1, ...pair.shared.flatMap((item) => [item.aSets, item.bSets]));
  const pct = (value: number) => `${Math.min(100, (value / scale) * 100)}%`;
  return <section className="wr-detail" aria-label={`${pair.aDay} and ${pair.bDay} compared`}>
    <header>
      <div><h3>{pair.aDay} and {pair.bDay}</h3><p>A muscle is shared when both sessions give it at least {logicCalibration.exposure.consecutiveDayMinimumSets} attributed sets; the pair is heavy from {logicCalibration.exposure.consecutiveDayPriorityExposure} summed shared sets. {pair.shared.length ? `${setsFigure(pair.sharedExposure)} here${pair.heavy ? ": heavy" : ""}.` : "Nothing reaches that here."}</p></div>
      <button type="button" className="wr-close" onClick={onClose} aria-label={`Close ${pair.aDay} and ${pair.bDay}`}><X className="h-4 w-4" aria-hidden="true" /></button>
    </header>
    {pair.shared.length > 0 && <ol className="wr-shared" aria-label="Shared muscles, attributed sets on each session">
      {pair.shared.map((item) => <li key={item.key} className="wr-shared-row">
        <span className="wr-shared-name">{item.label}</span>
        <span className="wr-shared-bars">
          <span className="wr-track" role="img" aria-label={`${pair.aDay}: ${setsFigure(item.aSets)}`}><i className="wr-bar-a" style={{ width: pct(item.aSets) }} /></span>
          <span className="wr-track" role="img" aria-label={`${pair.bDay}: ${setsFigure(item.bSets)}`}><i className="wr-bar-b" style={{ width: pct(item.bSets) }} /></span>
        </span>
        <span className="wr-shared-values"><b>{shortDay(pair.aDay)}</b> {setsFigure(item.aSets)} <b>{shortDay(pair.bDay)}</b> {setsFigure(item.bSets)}</span>
      </li>)}
    </ol>}
    <div className="wr-actions">
      <button type="button" className="wr-button" onClick={() => onEditDay(pair.aKey)}>Edit {pair.aDay} <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button>
      <button type="button" className="wr-button" onClick={() => onEditDay(pair.bKey)}>Edit {pair.bDay} <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button>
    </div>
  </section>;
}

function FindingRow({ finding, onAct }: { finding: WeekFinding; onAct: (action: WeekFindingAction) => void }) {
  return <li className="wr-finding" data-rule={finding.rule}>
    <strong>{finding.headline}</strong>
    <p>{finding.reason}</p>
    <small>{finding.source}</small>
    <button type="button" className="wr-link" onClick={() => onAct(finding.action)}>{finding.action.label} <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
  </li>;
}
