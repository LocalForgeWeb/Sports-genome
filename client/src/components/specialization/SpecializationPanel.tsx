import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import type { AthleteEquipmentProfile } from "@/lib/equipmentProfile";
import type { NextWorkoutChoice } from "@/lib/nextWorkout";
import { plannedExercisesInWeek } from "@/lib/specialization/planBouts";
import { recommendFor } from "@/lib/specialization/recommendations";
import { useSpecializationGoals, useSpecializationMeasurements } from "@/lib/specialization/stores";
import { useSpecializationExclusions } from "@/lib/specialization/exclusions";
import { intervalForView, useDeviceWorkoutSessions, useSpecializationSummary, type SpecializationPlanInput } from "@/lib/specialization/useSpecializationSummary";
import type { SpecializationPlanChange, SpecializationPlanChangeResult, SpecializationViewState } from "@/lib/specialization/viewState";
import { emptyDayStore, type DaySlot, type WeeklyDayStore } from "@/lib/trainingDayPlan";
import type { DisplayWeightUnit } from "@/lib/weightUnits";
import type { TrainingGoal } from "@/lib/workoutPlanner";
import { regionDataFor } from "@shared/specialization/registry";
import { exposureCategoryLabels, exposureRuleV1 } from "@shared/specialization/rules";
import { addDaysToDateKey, calendarWeekInterval, isDateKey, localDateKey, planWeekInterval } from "@shared/specialization/time";
import type { AnatomyNode, DiagramLayerId, DiagramViewId, NodeExposure, SpecializationRegionData } from "@shared/specialization/types";
import { MeasurementsPanel } from "./MeasurementsPanel";
import { MuscleSheet } from "./MuscleSheet";
import { PlanChangeSheet } from "./PlanChangeSheet";
import { SpecializationDiagram } from "./SpecializationDiagram";
import { BAR_SCALE, barParts, boutsByDay, directWorkBouts, exercisesInWindow, exposureSentence, fillForNode, findingsFor, goalMetricLabels, holdTime, goalsForNode, layerLabels, overlapsInWindow, selectableNodes, sortForList, targetBins, volumeBins, type Finding } from "./model";
import "@/components/anatomy/anatomy-figure.css";
import "./specialization.css";

/** What Home hands the page: its plan, the catalog, and the few actions that change Home's state. */
export type SpecializationPanelProps = {
  state: SpecializationViewState;
  /** Replaces the page state (and the URL entry); never pushes a history entry. */
  onStateChange: (next: SpecializationViewState) => void;
  plan: { ready: boolean; slots: DaySlot[]; weeks: Record<number, WeeklyDayStore>; choice: NextWorkoutChoice | null; activeWeek: number };
  catalog: Exercise[];
  equipmentProfile: AthleteEquipmentProfile;
  accountId: string | number | null;
  goal: TrainingGoal;
  /** The profile's unit: loads are shown in it, and a set with no recorded unit was typed in it. */
  weightUnit: DisplayWeightUnit;
  defaultPrescriptionFor: (index: number) => string;
  onApplyPlanChange: (change: SpecializationPlanChange) => SpecializationPlanChangeResult;
  onInspectExercise: (exercise: Exercise) => void;
  onOpenSession: (sessionId: string) => void;
  /** "Back to Review your week" when the page was opened from another screen. */
  backLabel: string | null;
  onBack: (() => void) | null;
};

const viewLabels: Record<DiagramViewId, string> = { palm: "Palm", back: "Back", thumb: "Thumb side" };
const layerControlLabels: Record<DiagramLayerId, string> = { surface: "Surface", intermediate: "Middle", deep: "Deep" };
const SHOWN_FINDINGS = 3;

/**
 * Body Lab → Specialize (Oct 16 forearm brief §6, design §7): one region, muscle by muscle,
 * from the athlete's own plan and logged work. Everything on it reads one summary per arm
 * from the calculator; the page only chooses what to show and in what words.
 */
export function SpecializationPanel(props: SpecializationPanelProps) {
  const data = regionDataFor(props.state.regionId);
  if (!data) return <section className="spz-page" aria-labelledby="spz-heading">
    <h1 id="spz-heading" className="spz-title">Specialization</h1>
    <p className="spz-note">That body region is not available.</p>
  </section>;
  return <SpecializationPage {...props} data={data} />;
}

function SpecializationPage({ data, state, onStateChange, plan, catalog, equipmentProfile, accountId, goal, weightUnit, defaultPrescriptionFor, onApplyPlanChange, onInspectExercise, onOpenSession, backLabel, onBack }: SpecializationPanelProps & { data: SpecializationRegionData }) {
  const timeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", []);
  const [nowIso, setNowIso] = useState(() => new Date().toISOString());
  useEffect(() => {
    // A page left open over midnight or a week boundary reads the new day when it is looked at again.
    const refresh = () => { if (document.visibilityState === "visible") setNowIso(new Date().toISOString()); };
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, []);
  const todayKey = localDateKey(nowIso, timeZone);
  const update = (patch: Partial<SpecializationViewState>) => onStateChange({ ...state, ...patch });

  const planWeek = state.planWeek ?? plan.activeWeek;
  const builtWeeks = useMemo(() => Object.keys(plan.weeks).map(Number).filter((week) => week > 0).sort((left, right) => left - right), [plan.weeks]);
  const weekStore = plan.weeks[planWeek];
  const planInput = useMemo<SpecializationPlanInput | null>(() => (plan.ready && weekStore ? { week: planWeek, slots: plan.slots, store: weekStore, goal } : null), [plan.ready, weekStore, planWeek, plan.slots, goal]);
  const interval = useMemo(() => intervalForView({ mode: state.mode, window: state.window, from: state.from, to: state.to, planWeek }, nowIso, timeZone, plan.activeWeek), [state.mode, state.window, state.from, state.to, planWeek, nowIso, timeZone, plan.activeWeek]);

  const { goals, save: saveGoals, remove: removeGoal } = useSpecializationGoals(accountId);
  const { measurements, save: saveMeasurement, remove: removeMeasurement } = useSpecializationMeasurements(accountId);
  const regionGoals = useMemo(() => goals.filter((item) => item.regionId === data.region.id), [goals, data.region.id]);
  const otherSide = state.limb === "left" ? "right" : "left";
  const here = useSpecializationSummary({ region: data, accountScope: accountId, interval, side: state.limb, mode: state.mode, plan: planInput, goals: regionGoals, catalog, fallbackUnit: weightUnit });
  const there = useSpecializationSummary({ region: data, accountScope: accountId, interval, side: otherSide, mode: state.mode, plan: planInput, goals: regionGoals, catalog, fallbackUnit: weightUnit });
  const summary = here.status === "ready" ? here.summary : null;
  const otherSummary = there.status === "ready" ? there.summary : null;
  /**
   * The ledger's comparison (design §4): the plan week paired with the calendar week. In
   * completed mode over this week it is the plan week as written; in planned mode, this
   * calendar week's logged work. Other windows have no pair: a plan carries no dates.
   */
  const pairMode = state.mode === "planned" ? "completed" : state.window === "week" ? "planned" : null;
  const pairInterval = useMemo(() => (pairMode === "planned" ? planWeekInterval(planWeek, timeZone) : calendarWeekInterval(nowIso, timeZone)), [pairMode, planWeek, timeZone, nowIso]);
  const pair = useSpecializationSummary({ region: data, accountScope: accountId, interval: pairInterval, side: state.limb, mode: pairMode ?? "planned", plan: planInput, goals: regionGoals, catalog, fallbackUnit: weightUnit });
  const pairSummary = pairMode && pair.status === "ready" ? pair.summary : null;
  const { exclusions, setExercise: setExerciseExcluded, setEquipment: setEquipmentExcluded } = useSpecializationExclusions(accountId);
  const sessions = useDeviceWorkoutSessions();

  const exposureById = useMemo(() => new Map((summary?.nodes ?? []).map((node) => [node.nodeId, node] as const)), [summary]);
  const exposureOf = (id: string): NodeExposure | null => exposureById.get(id) ?? null;
  const nodes = useMemo(() => selectableNodes(data), [data]);
  const selected = nodes.find((node) => node.id === state.nodeId) ?? null;
  const selectedExposure = selected ? exposureOf(selected.id) : null;
  // A hand-edited or stale address: an unknown muscle, or a plan week that is not built, is dropped from it.
  useEffect(() => {
    if (state.nodeId && !selected) onStateChange({ ...state, nodeId: null });
    else if (plan.ready && state.planWeek !== null && builtWeeks.length && !builtWeeks.includes(state.planWeek)) onStateChange({ ...state, planWeek: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.nodeId, selected, state.planWeek, plan.ready, builtWeeks]);

  const [sheet, setSheet] = useState<null | { kind: "muscle"; section?: "exercises" } | { kind: "change"; exerciseId: number }>(null);
  const [allFindings, setAllFindings] = useState(false);
  // Mounted once first opened and kept: a half-filled reading or its Undo survives closing the disclosure.
  const [progressOpened, setProgressOpened] = useState(false);
  const methodRef = useRef<HTMLDetailsElement>(null);

  const plannedExercises = useMemo(() => plannedExercisesInWeek(plan.slots, weekStore ?? emptyDayStore()), [plan.slots, weekStore]);
  const recommendations = useMemo(() => {
    if (!selected || !summary) return null;
    return recommendFor({ region: data, target: { nodeId: selected.id }, side: state.limb, summary, otherSideSummary: otherSummary, plannedExercises, catalog, equipmentProfile, exclusions });
  }, [selected, summary, otherSummary, plannedExercises, catalog, equipmentProfile, data, state.limb, exclusions]);
  const candidates = recommendations?.kind === "candidates" ? recommendations.candidates : [];

  const findings = useMemo(() => (summary ? findingsFor({ data, summary, otherSide: otherSummary }) : []), [data, summary, otherSummary]);
  const shownFindings = allFindings ? findings : findings.slice(0, SHOWN_FINDINGS);

  // The drawing: only the views and layers the asset has; the list stands in when there is none.
  const asset = data.diagram;
  const views = (Object.keys(viewLabels) as DiagramViewId[]).filter((view) => asset?.views[view]);
  const view: DiagramViewId = views.includes(state.view) ? state.view : views[0] ?? state.view;
  const layers = (Object.keys(layerControlLabels) as DiagramLayerId[]).filter((layer) => asset?.views[view]?.[layer]);
  const layer: DiagramLayerId = layers.includes(state.layer) ? state.layer : layers[0] ?? state.layer;
  const nameOf = (id: string) => data.nodes.find((node) => node.id === id)?.name ?? id;
  const fillFor = (id: string) => fillForNode(exposureOf(id), state.map, goalsForNode(summary, id));
  const describeFor = (id: string) => `${nameOf(id)}. ${exposureSentence(exposureOf(id))}`;

  const armWord = state.limb === "left" ? "left arm" : "right arm";
  const regionWord = data.region.label.toLowerCase();
  const [announcement, setAnnouncement] = useState("");
  const select = (nodeId: string | null) => {
    update({ nodeId });
    if (nodeId) setAnnouncement(`${nameOf(nodeId)} selected. ${exposureSentence(exposureOf(nodeId))}`);
  };
  useEffect(() => {
    if (summary) setAnnouncement(`${interval.label}, ${armWord}: ${summary.regionDistinctBouts} distinct ${regionWord} bouts.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interval.label, state.limb, state.mode]);

  const openMethod = () => {
    setSheet(null);
    const details = methodRef.current;
    if (!details) return;
    details.open = true;
    window.requestAnimationFrame(() => details.scrollIntoView({ block: "start", behavior: "smooth" }));
  };
  const inspect = (catalogExerciseId: number | null, name: string) => {
    const exercise = catalog.find((item) => (catalogExerciseId !== null ? item.id === catalogExerciseId : item.name === name));
    if (!exercise) return;
    setSheet(null);
    onInspectExercise(exercise);
  };
  /** "Add targeted exercise" starts an add: the best reviewed candidate in the add sheet, else the muscle's exercises. */
  const addTargeted = () => {
    if (candidates.length) setSheet({ kind: "change", exerciseId: candidates[0].catalogExerciseId });
    else setSheet({ kind: "muscle", section: "exercises" });
  };
  const runFinding = (finding: Finding) => {
    if (!finding.action) return;
    if (finding.action.kind === "method") { openMethod(); return; }
    select(finding.action.nodeId);
    setSheet(finding.action.kind === "add" ? { kind: "muscle", section: "exercises" } : { kind: "muscle" });
  };
  const chooseWindow = (window: SpecializationViewState["window"]) => {
    if (window !== "custom") { update({ window, from: null, to: null }); return; }
    update({ window, from: state.from ?? addDaysToDateKey(todayKey, -6), to: state.to ?? todayKey });
  };
  const setCustom = (field: "from" | "to", value: string) => {
    if (!isDateKey(value)) return;
    const from = field === "from" ? value : state.from ?? value;
    const to = field === "to" ? value : state.to ?? value;
    update({ window: "custom", from: from <= to ? from : to, to: from <= to ? to : from });
  };

  const groups: { id: string; title: string; nodes: AnatomyNode[] }[] = [
    { id: "target", title: `Muscles of the ${regionWord}`, nodes: nodes.filter((node) => node.role === "target") },
    { id: "adjacent", title: "Nearby", nodes: nodes.filter((node) => node.role === "adjacent") },
    { id: "external", title: "Upper-arm muscles credited here", nodes: nodes.filter((node) => node.role === "external") },
  ].filter((group) => group.nodes.length);

  const windowItems = summary ? exercisesInWindow(summary, data) : [];
  /** Distinct bouts per local day of a completed window, up to 31 days (brief §10: daily exposure distribution). */
  const days = useMemo(() => {
    if (!summary || state.mode !== "completed" || !interval.startAt || !interval.endAtExclusive) return null;
    const first = localDateKey(interval.startAt, timeZone);
    const last = localDateKey(new Date(Date.parse(interval.endAtExclusive) - 1).toISOString(), timeZone);
    const keys: string[] = [];
    for (let key = first; key <= last && keys.length <= 31; key = addDaysToDateKey(key, 1)) keys.push(key);
    if (keys.length > 31) return "too-long" as const;
    const counts = boutsByDay(summary, data, (iso) => localDateKey(iso, timeZone));
    return keys.map((key) => ({ key, label: new Date(`${key}T12:00:00Z`).toLocaleDateString(undefined, keys.length > 7 ? { day: "numeric", month: "short", timeZone: "UTC" } : { weekday: "short", timeZone: "UTC" }), bouts: counts.get(key) ?? 0 }));
  }, [summary, data, state.mode, interval.startAt, interval.endAtExclusive, timeZone]);
  const overlaps = summary ? overlapsInWindow(summary, data) : [];
  /** Notes the athlete left on the workouts that loaded the region in this window (design §5: the existing session note). */
  const notes = useMemo(() => {
    if (!summary || state.mode !== "completed") return [];
    const ids = new Set<string>();
    for (const node of summary.nodes) for (const row of node.contributions) if (row.sessionId) ids.add(row.sessionId);
    return sessions.filter((session) => ids.has(session.id) && session.note?.trim()).map((session) => ({ id: session.id, label: session.dayLabel || session.title, at: session.completedAt ?? session.startedAt, note: session.note!.trim() })).sort((left, right) => right.at.localeCompare(left.at)).slice(0, 5);
  }, [summary, sessions, state.mode]);
  // Planned against completed for the whole region, said as a plain count (brief §10: reward completed planned work, nothing more).
  const plannedBouts = state.mode === "planned" ? summary?.regionDistinctBouts ?? null : pairSummary?.regionDistinctBouts ?? null;
  const completedBouts = state.mode === "completed" ? (state.window === "week" ? summary?.regionDistinctBouts ?? null : null) : pairSummary?.regionDistinctBouts ?? null;

  const completeness = summary?.completeness;
  const hasWork = selectedExposure ? barParts(selectedExposure).direct + barParts(selectedExposure).other + barParts(selectedExposure).holds + barParts(selectedExposure).incidental + barParts(selectedExposure).rest > 0 : false;

  return <section className="spz-page" aria-labelledby="spz-heading">
    <header className="spz-head">
      {onBack && backLabel && <button type="button" className="spz-back" onClick={onBack}><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to {backLabel}</button>}
      <p className="metric-label">Body Lab · Specialize</p>
      <h1 id="spz-heading" className="spz-title">{data.region.heading}</h1>
      <p className="spz-lede">Each set counts once per muscle and once per arm, from your {state.mode === "planned" ? "plan as written" : "logged workouts"}. Holds stay in seconds and never become sets.</p>
    </header>

    <div className="spz-controls">
      <div className="spz-segment" role="group" aria-label="Planned or completed">
        <button type="button" aria-pressed={state.mode === "completed"} onClick={() => update({ mode: "completed" })}>Completed</button>
        <button type="button" aria-pressed={state.mode === "planned"} onClick={() => update({ mode: "planned" })}>Planned</button>
      </div>
      <div className="spz-segment" role="group" aria-label="Arm">
        <button type="button" aria-pressed={state.limb === "left"} onClick={() => update({ limb: "left" })}>Left arm</button>
        <button type="button" aria-pressed={state.limb === "right"} onClick={() => update({ limb: "right" })}>Right arm</button>
      </div>
      {state.mode === "completed"
        ? <div className="spz-segment" role="group" aria-label="Time window">
          <button type="button" aria-pressed={state.window === "week"} onClick={() => chooseWindow("week")}>This week</button>
          <button type="button" aria-pressed={state.window === "7d"} onClick={() => chooseWindow("7d")}>Rolling 7 days</button>
          <button type="button" aria-pressed={state.window === "custom"} onClick={() => chooseWindow("custom")}>Custom</button>
        </div>
        : <div className="spz-segment" role="group" aria-label="Plan week">
          {(builtWeeks.length ? builtWeeks : [planWeek]).map((week) => <button key={week} type="button" aria-pressed={week === planWeek} onClick={() => update({ planWeek: week === plan.activeWeek ? null : week })}>Week {week}</button>)}
        </div>}
      {state.mode === "completed" && state.window === "custom" && <div className="spz-dates">
        <label className="spz-field"><span>From</span><input type="date" value={state.from ?? ""} max={todayKey} onChange={(event) => setCustom("from", event.target.value)} /></label>
        <label className="spz-field"><span>To</span><input type="date" value={state.to ?? ""} max={todayKey} onChange={(event) => setCustom("to", event.target.value)} /></label>
      </div>}
    </div>
    <p className="spz-window"><b>{interval.label}</b> · {armWord}{state.mode === "planned" && !planInput ? (plan.ready ? ` · Week ${planWeek} has nothing planned yet` : " · your plan is loading") : ""}</p>
    {plannedBouts !== null && completedBouts !== null && (plannedBouts > 0 || completedBouts > 0) && <p className="spz-pair">This week, {armWord}, for the {regionWord}: <b>{completedBouts}</b> bout{completedBouts === 1 ? "" : "s"} logged · <b>{plannedBouts}</b> planned in Plan Week {planWeek}, as written.</p>}

    {here.status === "error" && <p className="spz-error" role="alert">The totals could not be worked out: {here.message}</p>}

    <section className="spz-card" aria-labelledby="spz-map-title">
      <div className="spz-card-head">
        <h2 id="spz-map-title">Muscle map</h2>
        {asset && <div className="spz-segment" role="group" aria-label="Colour by">
          <button type="button" aria-pressed={state.map === "volume"} onClick={() => update({ map: "volume" })}>Volume</button>
          <button type="button" aria-pressed={state.map === "target"} onClick={() => update({ map: "target" })}>Target</button>
        </div>}
      </div>
      {asset ? <>
        <div className="spz-diagram-controls">
          <div className="spz-segment" role="group" aria-label="View">
            {views.map((item) => <button key={item} type="button" aria-pressed={item === view} onClick={() => update({ view: item })}>{viewLabels[item]}</button>)}
          </div>
          {layers.length > 1 && <div className="spz-segment" role="group" aria-label="Layer">
            {layers.map((item) => <button key={item} type="button" aria-pressed={item === layer} onClick={() => update({ layer: item })}>{layerControlLabels[item]}</button>)}
          </div>}
        </div>
        <SpecializationDiagram asset={asset} view={view} layer={layer} mirrored={state.limb === "left"} fillFor={fillFor} selectedNodeId={selected?.id ?? null} onSelect={(id) => select(id === selected?.id ? null : id)} labelFor={(id) => data.nodes.find((node) => node.id === id)?.shortName ?? id} describeFor={describeFor} caption={`${data.region.label}, ${armWord}, ${viewLabels[view].toLowerCase()} view, ${layerControlLabels[layer].toLowerCase()} layer`} />
        <MapLegend map={state.map} />
      </> : <p className="spz-note">The drawing is not ready yet. Every muscle is in the list below, with the same numbers.</p>}
    </section>

    <section className="spz-selected" aria-labelledby="spz-selected-title">
      <h2 id="spz-selected-title" className="sr-only">Selected muscle</h2>
      {selected ? <>
        <p className="spz-selected-name"><b>{selected.name}</b><span className="spz-badge">{layerLabels[selected.layer]}</span></p>
        <p className="spz-selected-line">{exposureSentence(selectedExposure)}</p>
        {goalsForNode(summary, selected.id).map((progress) => <p key={progress.goal.id} className="spz-selected-goal">{goalMetricLabels[progress.goal.metric]}: {progress.label}</p>)}
        <div className="spz-actions">
          {hasWork || selectedExposure?.mappingCoverage !== "reviewed"
            ? <button type="button" className="spz-primary" onClick={() => setSheet({ kind: "muscle" })}>Inspect coverage <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
            : <button type="button" className="spz-primary" onClick={addTargeted}>Add targeted exercise <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>}
          <button type="button" className="spz-link spz-link-box" onClick={() => select(null)}>Clear</button>
        </div>
      </> : <p className="spz-selected-line">{summary ? `${summary.regionDistinctBouts} distinct bout${summary.regionDistinctBouts === 1 ? "" : "s"} touched the ${regionWord} on the ${armWord}${summary.regionUnknownSideBouts ? `, and ${summary.regionUnknownSideBouts} more had no arm recorded` : ""}.` : "Working out the totals…"} Choose a muscle for its numbers.</p>}
    </section>
    <p className="sr-only" aria-live="polite">{announcement}</p>

    <section className="spz-card" aria-labelledby="spz-list-title">
      <div className="spz-card-head">
        <h2 id="spz-list-title">Muscles, most direct work first</h2>
      </div>
      <p className="spz-legend-line"><i className="spz-key spz-key-direct" />Direct <i className="spz-key spz-key-other" />Other dynamic <i className="spz-key spz-key-holds" />Holds <i className="spz-key spz-key-incidental" />Incidental grip · bar full at {BAR_SCALE} bouts</p>
      {groups.map((group) => <div key={group.id} className="spz-group">
        {groups.length > 1 && <h3>{group.title}</h3>}
        <ul className="spz-rows">
          {sortForList(group.nodes, exposureOf).map((node) => <MuscleRow key={node.id} node={node} exposure={exposureOf(node.id)} selected={node.id === selected?.id} onOpen={() => { select(node.id); setSheet({ kind: "muscle" }); }} />)}
        </ul>
      </div>)}
    </section>

    <section className="spz-card" aria-labelledby="spz-findings-title">
      <div className="spz-card-head"><h2 id="spz-findings-title">Coverage to review</h2></div>
      {findings.length ? <>
        <ul className="spz-findings">
          {shownFindings.map((finding) => <li key={finding.id} className="spz-finding">
            <strong>{finding.title}</strong>
            <p>{finding.detail}</p>
            {finding.action && finding.actionLabel && <button type="button" className="spz-link" onClick={() => runFinding(finding)}>{finding.actionLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>}
          </li>)}
        </ul>
        {findings.length > SHOWN_FINDINGS && <button type="button" className="spz-link" aria-expanded={allFindings} onClick={() => setAllFindings((open) => !open)}>{allFindings ? "Show fewer" : `Show ${findings.length - SHOWN_FINDINGS} more`}</button>}
      </> : <p className="spz-note">Nothing to review: every set in this window has an arm, a reviewed mapping and a muscle to count for.</p>}
    </section>

    <div className="spz-disclosures">
      <details className="spz-disclosure spz-card">
        <summary><span><b>Exercises in this window</b><small>{windowItems.length ? `${windowItems.length} exercise${windowItems.length === 1 ? "" : "s"}` : "None yet"}</small></span><ChevronDown className="h-4 w-4" aria-hidden="true" /></summary>
        {days === "too-long" ? <p className="spz-note">Choose 31 days or fewer to see the work day by day.</p> : days && <ol className="spz-days" aria-label="Distinct bouts per day in this window">
          {days.map((day) => <li key={day.key} data-today={day.key === todayKey || undefined}><span className="spz-day-bar"><i style={{ height: `${Math.min(100, (day.bouts / 12) * 100)}%` }} /></span><b>{day.bouts}</b><small>{day.label}</small></li>)}
        </ol>}
        {windowItems.length ? <ul className="spz-exercise-list">
          {windowItems.map((item) => <li key={`${item.catalogExerciseId ?? item.name}`}>
            <span><b>{item.name}</b><small>{item.bouts} bout{item.bouts === 1 ? "" : "s"}{item.directFor.length ? ` · direct for ${item.directFor.join(", ")}` : " · no muscle here is its target"}</small></span>
            {item.catalogExerciseId !== null && <button type="button" className="spz-link" onClick={() => inspect(item.catalogExerciseId, item.name)}>About it</button>}
          </li>)}
        </ul> : <p className="spz-note">No exercise {state.mode === "planned" ? "planned" : "logged"} in this window loads a mapped {regionWord} muscle.</p>}
        {overlaps.length > 0 && <div className="spz-subsection">
          <h3>Same muscle, same {state.mode === "planned" ? "day" : "workout"}</h3>
          <ul className="spz-exercise-list">{overlaps.map((item) => <li key={item.key}><span><b>{item.nodeShortName}</b><small>{item.sessionLabel}{item.performedAt ? ` · ${new Date(item.performedAt).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}` : ""}: {item.exercises.join(" and ")} both load it directly.</small></span></li>)}</ul>
        </div>}
        {notes.length > 0 && <div className="spz-subsection">
          <h3>Your notes on these workouts</h3>
          <ul className="spz-exercise-list">{notes.map((item) => <li key={item.id}><span><b>{item.label}</b><small>{item.note}</small></span><button type="button" className="spz-link" onClick={() => onOpenSession(item.id)}>Open</button></li>)}</ul>
        </div>}
      </details>

      <details className="spz-disclosure spz-card">
        <summary><span><b>Targets</b><small>{regionGoals.length ? `${regionGoals.length} set` : "None set"}</small></span><ChevronDown className="h-4 w-4" aria-hidden="true" /></summary>
        {regionGoals.length ? <ul className="spz-exercise-list">
          {Array.from(new Set(regionGoals.map((item) => item.nodeId).filter((id): id is string => Boolean(id)))).map((nodeId) => <li key={nodeId}>
            <span><b>{nameOf(nodeId)}</b><small>{goalsForNode(summary, nodeId).map((progress) => `${goalMetricLabels[progress.goal.metric]}: ${progress.label}`).join(" · ") || `No target on the ${armWord}`}</small></span>
            <button type="button" className="spz-link" onClick={() => { select(nodeId); setSheet({ kind: "muscle" }); }}>Open</button>
          </li>)}
        </ul> : <p className="spz-note">No targets. Open a muscle to set one; a muscle without a target is not behind on anything.</p>}
      </details>

      <details className="spz-disclosure spz-card" onToggle={(event) => { if (event.currentTarget.open) setProgressOpened(true); }}>
        <summary><span><b>Progress</b><small>Circumference and grip, by arm</small></span><ChevronDown className="h-4 w-4" aria-hidden="true" /></summary>
        {/* Mounted when first opened, then kept: its weekly chart reads eight weeks of history. */}
        {progressOpened && <MeasurementsPanel data={data} side={state.limb} catalog={catalog} weightUnit={weightUnit} timeZone={timeZone} todayKey={todayKey} measurements={measurements} onSave={saveMeasurement} onRemove={removeMeasurement} />}
      </details>

      <details ref={methodRef} className="spz-disclosure spz-card" id="spz-method">
        <summary><span><b>How this is counted</b><small>{exposureRuleV1.id} · {data.mappingVersion.key}</small></span><ChevronDown className="h-4 w-4" aria-hidden="true" /></summary>
        <div className="spz-method">
          <p>{exposureRuleV1.specification.bout} {exposureRuleV1.specification.dropSet}</p>
          <p>{exposureRuleV1.specification.perNodeBout} {exposureRuleV1.specification.sides}</p>
          <dl className="spz-categories">{(Object.keys(exposureCategoryLabels) as (keyof typeof exposureCategoryLabels)[]).map((category) => <div key={category}><dt>{exposureCategoryLabels[category]}</dt><dd>{exposureRuleV1.specification.categories[category]}</dd></div>)}</dl>
          <p>{exposureRuleV1.specification.straps} {exposureRuleV1.specification.holds}</p>
          <p>{exposureRuleV1.specification.unmapped} {exposureRuleV1.specification.regionTotal}</p>
          <p><b>Not counted:</b> {exposureRuleV1.specification.excludedFromCompleted.join(" ")}</p>
          <ul className="spz-caveats">{exposureRuleV1.specification.notConverted.map((line) => <li key={line}>{line}</li>)}</ul>
          {completeness && <p><b>This window, {armWord}:</b> {completeness.boutsConsidered} sets considered: {completeness.boutsWithReviewedMapping} with a reviewed mapping, {completeness.boutsPendingReview} under review, {completeness.boutsRegionOnly} {regionWord} only. {completeness.boutsNameMatched} matched by name, {completeness.boutsUnknownSide} with no arm recorded. Left out: {completeness.boutsExcluded.notCompleted} not completed, {completeness.boutsExcluded.warmup} warm-ups.</p>}
          <p className="spz-note">{data.mappingVersion.methodNotes}</p>
        </div>
      </details>
    </div>

    {sheet?.kind === "muscle" && selected && <MuscleSheet
      data={data}
      node={selected}
      exposure={selectedExposure}
      side={state.limb}
      mode={state.mode}
      intervalLabel={interval.label}
      weightUnit={weightUnit}
      goals={regionGoals.filter((item) => item.nodeId === selected.id)}
      progress={goalsForNode(summary, selected.id)}
      timeZone={timeZone}
      todayKey={todayKey}
      recommendations={recommendations}
      initialSection={sheet.section}
      paired={pairMode && pairSummary ? { label: pairMode === "planned" ? `Plan Week ${planWeek}, as written` : "Logged this week", exposure: pairSummary.nodes.find((node) => node.nodeId === selected.id) ?? null } : null}
      exclusions={exclusions}
      onSetExerciseExcluded={setExerciseExcluded}
      onSetEquipmentExcluded={setEquipmentExcluded}
      onSaveGoals={(next) => saveGoals(next)}
      onRemoveGoal={removeGoal}
      onChooseExercise={(exerciseId) => setSheet({ kind: "change", exerciseId })}
      onInspectExercise={inspect}
      onOpenSession={(id) => { setSheet(null); onOpenSession(id); }}
      onOpenMethod={openMethod}
      onClose={() => setSheet(null)}
    />}
    {sheet?.kind === "change" && selected && <PlanChangeSheet
      data={data}
      side={state.limb}
      nodeId={selected.id}
      candidates={candidates}
      initialExerciseId={sheet.exerciseId}
      catalog={catalog}
      plan={{ slots: plan.slots, weeks: plan.weeks, week: planWeek }}
      goal={goal}
      defaultPrescriptionFor={defaultPrescriptionFor}
      onApply={onApplyPlanChange}
      onClose={() => setSheet(null)}
    />}
  </section>;
}

function MuscleRow({ node, exposure, selected, onOpen }: { node: AnatomyNode; exposure: NodeExposure | null; selected: boolean; onOpen: () => void }) {
  const parts = exposure ? barParts(exposure) : null;
  const unmapped = !exposure || exposure.mappingCoverage !== "reviewed";
  const width = (value: number) => `${(Math.min(value, BAR_SCALE) / BAR_SCALE) * 100}%`;
  let offset = 0;
  const segment = (value: number, kind: string) => {
    if (!value) return null;
    const left = offset;
    offset += value;
    if (left >= BAR_SCALE) return null;
    return <i key={kind} className={`spz-bar-${kind}`} style={{ left: width(left), width: width(Math.min(value, BAR_SCALE - left)) }} />;
  };
  const value = !exposure || exposure.mappingCoverage === "none" ? "Mapping not reviewed"
    : exposure.mappingCoverage === "pending_review" ? "Mapping under review"
    : [
      parts!.direct ? `${parts!.direct} direct` : "",
      parts!.other ? `${parts!.other} other` : "",
      parts!.holds ? `${parts!.holds} hold${parts!.holds === 1 ? "" : "s"} · ${holdTime(exposure.deliberateHoldSeconds)}` : "",
      parts!.incidental ? `${parts!.incidental} grip` : "",
      parts!.rest ? `${parts!.rest} mixed` : "",
    ].filter(Boolean).join(" · ") || "No work";
  return <li>
    <button type="button" className="spz-row" aria-pressed={selected} data-unmapped={unmapped || undefined} onClick={onOpen} aria-label={`${node.name}, ${layerLabels[node.layer]}. ${exposureSentence(exposure)} Open details.`}>
      <span className="spz-row-head">
        <span className="spz-row-name">{node.name}<small>{node.shortName}</small>{node.layer !== "surface" && <span className="spz-badge">{node.layer === "deep" ? "Deep" : "Middle"}</span>}</span>
        <span className="spz-row-value">{value}{exposure && directWorkBouts(exposure) > BAR_SCALE ? ` (${directWorkBouts(exposure)})` : ""}</span>
      </span>
      <span className="spz-track" aria-hidden="true" data-hatch={unmapped || undefined}>
        {parts && !unmapped && [segment(parts.direct, "direct"), segment(parts.other, "other"), segment(parts.holds, "holds"), segment(parts.incidental, "incidental"), segment(parts.rest, "rest")]}
      </span>
    </button>
  </li>;
}

function MapLegend({ map }: { map: "volume" | "target" }) {
  return <div className="spz-legend" aria-label="Map key">
    {map === "volume" ? <>
      <span><i className="spz-swatch-zero" />Mapped, no direct work</span>
      {volumeBins.map((label, index) => <span key={label}><i style={{ background: `var(--sg-exposure-${index + 1})` }} />{label}</span>)}
      <span className="spz-legend-unit">direct bouts (dynamic sets and deliberate holds, one each)</span>
    </> : <>
      <span><i className="spz-swatch-none" />Not targeted</span>
      {targetBins.map((label, index) => <span key={label}><i style={{ background: `var(--sg-exposure-${index + 1})` }} />{label}</span>)}
      <span className="spz-legend-unit">of your own target; above it keeps its number</span>
    </>}
    <span><i className="spz-swatch-hatch" />Mapping not reviewed</span>
  </div>;
}
