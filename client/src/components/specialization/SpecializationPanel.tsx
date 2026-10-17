import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import type { AthleteEquipmentProfile } from "@/lib/equipmentProfile";
import { trainingWeekFor, type NextWorkoutChoice } from "@/lib/nextWorkout";
import { plannedExercisesInWeek } from "@/lib/specialization/planBouts";
import { recommendFor, type RecommendationCandidate } from "@/lib/specialization/recommendations";
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
import type { AnatomyNode, DiagramLayerId, DiagramViewId, NodeExposure, SpecializationRegionData, SummaryMode } from "@shared/specialization/types";
import { BoutListSheet, type BoutList } from "./BoutListSheet";
import { MeasurementsPanel } from "./MeasurementsPanel";
import { MovementSheet } from "./MovementSheet";
import { MuscleSheet } from "./MuscleSheet";
import { splitTargets } from "./TargetsEditor";
import { TargetsOverview } from "./TargetsOverview";
import { PlanChangeSheet } from "./PlanChangeSheet";
import { SpecializationDiagram } from "./SpecializationDiagram";
import { BAR_SCALE, barParts, boutsByDay, directWorkBouts, exerciseKeyOf, exercisesInWindow, exposureSentence, fillForNode, findingsFor, goalMetricLabels, holdTime, goalsForNode, latestSessionDayLabel, layerLabels, movementFocusNodeId, overlapsInWindow, regionBoutRows, regionBoutRowsOnDay, selectableNodes, sortForList, targetBins, volumeBins, type DiagramFill, type Finding, type RegionBoutList } from "./model";
import "@/components/anatomy/anatomy-figure.css";
import "./specialization.css";

/** What Home hands the page: its plan, the catalog, and the few actions that change Home's state. */
export type SpecializationPanelProps = {
  state: SpecializationViewState;
  /** Replaces the page state (and the URL entry); never pushes a history entry. */
  onStateChange: (next: SpecializationViewState) => void;
  /**
   * Home's plan. `activeWeek` is the week Plan is showing or editing; the page reads the week
   * the athlete trains from instead (`trainingWeekFor`: an explicit choice, else the latest
   * workout's week, else Week 1), the rule Home's next workout follows (design §4).
   */
  plan: { ready: boolean; slots: DaySlot[]; weeks: Record<number, WeeklyDayStore>; choice: NextWorkoutChoice | null; activeWeek: number };
  catalog: Exercise[];
  equipmentProfile: AthleteEquipmentProfile;
  accountId: string | number | null;
  goal: TrainingGoal;
  /** The profile's unit: loads are shown in it, and a set with no recorded unit was typed in it. */
  weightUnit: DisplayWeightUnit;
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
const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

type SheetState =
  | { kind: "muscle"; section?: "exercises" }
  | { kind: "movement"; actionId: string }
  /** An add or swap, started from a muscle's exercises or from a movement's. */
  | { kind: "change"; exerciseId: number; from: { kind: "muscle" } | { kind: "movement"; actionId: string } }
  /**
   * The bouts behind a region total; `exerciseKey` narrows the region's bouts to one exercise,
   * `dayKey` to one local day (a bar of bouts per day). "pair" is the window line's logged
   * beside planned: this week's logged bouts, then the plan week's.
   */
  | { kind: "bouts"; list: RegionBoutList | "pair"; exerciseKey?: string; dayKey?: string };

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

function SpecializationPage({ data, state, onStateChange, plan, catalog, equipmentProfile, accountId, goal, weightUnit, onApplyPlanChange, onInspectExercise, onOpenSession, backLabel, onBack }: SpecializationPanelProps & { data: SpecializationRegionData }) {
  const timeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", []);
  const [nowIso, setNowIso] = useState(() => new Date().toISOString());
  useEffect(() => {
    // A page left open over midnight or a week boundary reads the new day when it is looked at
    // again: the windows, and (passed to every summary as its `now`) each target's own period.
    const refresh = () => { if (document.visibilityState === "visible") setNowIso(new Date().toISOString()); };
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, []);
  const todayKey = localDateKey(nowIso, timeZone);
  const update = (patch: Partial<SpecializationViewState>) => onStateChange({ ...state, ...patch });

  const sessions = useDeviceWorkoutSessions();
  const builtWeeks = useMemo(() => Object.keys(plan.weeks).map(Number).filter((week) => week > 0).sort((left, right) => left - right), [plan.weeks]);
  /**
   * The plan week being trained (design §4, `trainingWeekFor`): an explicit choice, else the
   * week of the latest workout, else Week 1. It is the default plan week, and the only one
   * this calendar week's logged work is set beside: a week only being edited has none.
   */
  const latestDayLabel = useMemo(() => latestSessionDayLabel(sessions), [sessions]);
  const trainingWeek = useMemo(() => trainingWeekFor({ choice: plan.choice, latestSessionDayLabel: latestDayLabel, weeks: builtWeeks }), [plan.choice, latestDayLabel, builtWeeks]);
  const planWeek = state.planWeek ?? trainingWeek;
  const weekStore = plan.weeks[planWeek];
  const planInput = useMemo<SpecializationPlanInput | null>(() => (plan.ready && weekStore ? { week: planWeek, slots: plan.slots, store: weekStore, goal } : null), [plan.ready, weekStore, planWeek, plan.slots, goal]);
  const trainingStore = plan.weeks[trainingWeek];
  const trainingPlanInput = useMemo<SpecializationPlanInput | null>(() => (plan.ready && trainingStore ? { week: trainingWeek, slots: plan.slots, store: trainingStore, goal } : null), [plan.ready, trainingStore, trainingWeek, plan.slots, goal]);
  const interval = useMemo(() => intervalForView({ mode: state.mode, window: state.window, from: state.from, to: state.to, planWeek }, nowIso, timeZone, trainingWeek), [state.mode, state.window, state.from, state.to, planWeek, nowIso, timeZone, trainingWeek]);

  const { goals, save: saveGoals, remove: removeGoal } = useSpecializationGoals(accountId);
  const { measurements, save: saveMeasurement, remove: removeMeasurement } = useSpecializationMeasurements(accountId);
  const regionGoals = useMemo(() => goals.filter((item) => item.regionId === data.region.id), [goals, data.region.id]);
  const activeTargets = splitTargets(regionGoals, localDateKey(nowIso, timeZone)).active.length;
  const otherSide = state.limb === "left" ? "right" : "left";
  // Planned mode before the plan has loaded: an empty plan would read as zeros, fake progress
  // and "behind" findings, so the page shows that it is loading instead (no numbers at all).
  const planLoading = state.mode === "planned" && !plan.ready;
  const here = useSpecializationSummary({ region: data, accountScope: accountId, interval, side: state.limb, mode: state.mode, plan: planInput, goals: regionGoals, catalog, fallbackUnit: weightUnit, now: nowIso });
  const there = useSpecializationSummary({ region: data, accountScope: accountId, interval, side: otherSide, mode: state.mode, plan: planInput, goals: regionGoals, catalog, fallbackUnit: weightUnit, now: nowIso });
  const summary = here.status === "ready" && !planLoading ? here.summary : null;
  const otherSummary = there.status === "ready" && !planLoading ? there.summary : null;
  /**
   * The ledger's comparison (design §4): this calendar week's logged work beside the plan week
   * being trained, and only that week. In completed mode over this week it is that plan week
   * as written; in planned mode, this week's logged work, when the week shown is the one being
   * trained. Other windows have no pair: a plan carries no dates.
   */
  const pairMode: SummaryMode | null = !plan.ready ? null : state.mode === "planned" ? (planWeek === trainingWeek ? "completed" : null) : state.window === "week" ? "planned" : null;
  const noPairNote = state.mode === "planned" && plan.ready && planInput && planWeek !== trainingWeek ? `Plan Week ${planWeek} is not the week you train from (Week ${trainingWeek}), so there is no logged week to compare.` : null;
  const pairInterval = useMemo(() => (pairMode === "planned" ? planWeekInterval(trainingWeek, timeZone) : calendarWeekInterval(nowIso, timeZone)), [pairMode, trainingWeek, timeZone, nowIso]);
  const pair = useSpecializationSummary({ region: data, accountScope: accountId, interval: pairInterval, side: state.limb, mode: pairMode ?? "planned", plan: trainingPlanInput, goals: regionGoals, catalog, fallbackUnit: weightUnit, now: nowIso });
  const pairSummary = pairMode && pair.status === "ready" ? pair.summary : null;
  const { exclusions, setExercise: setExerciseExcluded, setEquipment: setEquipmentExcluded } = useSpecializationExclusions(accountId);

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

  const [sheet, setSheet] = useState<SheetState | null>(null);
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
  /** An exercise's equipment from the catalog the recommender read, so the muscle sheet can say why a main action has no suggestion. */
  const equipmentById = useMemo(() => new Map(catalog.map((exercise) => [exercise.id, exercise.equipment ?? null] as const)), [catalog]);
  // A movement's exercises (brief §7: "A suggested exercise explicitly addresses the selected muscle/action").
  const movementId = sheet?.kind === "movement" ? sheet.actionId : sheet?.kind === "change" && sheet.from.kind === "movement" ? sheet.from.actionId : null;
  const movementRecommendations = useMemo(() => {
    if (!movementId || !summary) return null;
    return recommendFor({ region: data, target: { actionId: movementId }, side: state.limb, summary, otherSideSummary: otherSummary, plannedExercises, catalog, equipmentProfile, exclusions });
  }, [movementId, summary, otherSummary, plannedExercises, catalog, equipmentProfile, data, state.limb, exclusions]);
  const changeCandidates: RecommendationCandidate[] = sheet?.kind === "change" && sheet.from.kind === "movement"
    ? (movementRecommendations?.kind === "candidates" ? movementRecommendations.candidates : [])
    : candidates;
  // The muscle the add sheet leads its preview with: the selected one, or for a movement the
  // region muscle the chosen exercise is credited with for that movement.
  const changeNodeId = sheet?.kind !== "change" ? null
    : sheet.from.kind === "muscle" ? selected?.id ?? null
    : movementFocusNodeId(data, sheet.from.actionId, changeCandidates.find((item) => item.catalogExerciseId === sheet.exerciseId)?.mappingIds ?? []);

  const findings = useMemo(() => (summary ? findingsFor({ data, summary, otherSide: otherSummary }) : []), [data, summary, otherSummary]);
  const shownFindings = allFindings ? findings : findings.slice(0, SHOWN_FINDINGS);

  // The drawing: only the views and layers the asset has; the list stands in when there is none.
  const asset = data.diagram;
  const views = (Object.keys(viewLabels) as DiagramViewId[]).filter((view) => asset?.views[view]);
  const view: DiagramViewId = views.includes(state.view) ? state.view : views[0] ?? state.view;
  const layers = (Object.keys(layerControlLabels) as DiagramLayerId[]).filter((layer) => asset?.views[view]?.[layer]);
  const layer: DiagramLayerId = layers.includes(state.layer) ? state.layer : layers[0] ?? state.layer;
  const nameOf = (id: string) => data.nodes.find((node) => node.id === id)?.name ?? id;
  /** What stands in for numbers while there are none: the plan loading, the totals failing, or (briefly) being worked out. */
  const waiting = planLoading ? "Loading your plan…" : here.status === "error" ? "The totals could not be worked out." : "Working out the totals…";
  // No summary yet: every muscle is drawn plain, neither hatched ("not reviewed") nor empty ("no work").
  const fillFor = (id: string): DiagramFill => (summary ? fillForNode(exposureOf(id), state.map, goalsForNode(summary, id)) : { kind: "none" });
  const sentenceFor = (id: string) => (summary ? exposureSentence(exposureOf(id)) : waiting);
  const describeFor = (id: string) => `${nameOf(id)}. ${sentenceFor(id)}`;

  const armWord = state.limb === "left" ? "left arm" : "right arm";
  const regionWord = data.region.label.toLowerCase();
  const [announcement, setAnnouncement] = useState("");
  const select = (nodeId: string | null) => {
    update({ nodeId });
    if (nodeId) setAnnouncement(`${nameOf(nodeId)} selected. ${sentenceFor(nodeId)}`);
  };
  /**
   * The strip sits above the drawing, so a tap that changes its height (a longer sentence, a
   * target line, the region line giving way to a name) would move the drawing under the
   * finger. The strip's bottom edge is noted before the tap and the page scrolled by however
   * far it moved, so the drawing stays where it was touched.
   */
  const stripRef = useRef<HTMLDivElement>(null);
  const keepDrawing = useRef<{ nodeId: string | null; bottom: number } | null>(null);
  const tapDrawing = (id: string) => {
    const nodeId = id === selected?.id ? null : id;
    const strip = stripRef.current;
    keepDrawing.current = strip ? { nodeId, bottom: strip.getBoundingClientRect().bottom } : null;
    select(nodeId);
  };
  useLayoutEffect(() => {
    const kept = keepDrawing.current;
    keepDrawing.current = null;
    const strip = stripRef.current;
    if (!kept || !strip || kept.nodeId !== (state.nodeId ?? null)) return;
    const shift = strip.getBoundingClientRect().bottom - kept.bottom;
    if (Math.abs(shift) >= 1) window.scrollBy({ top: shift, behavior: "instant" });
  }, [state.nodeId]);
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
  const openSession = (id: string) => { setSheet(null); onOpenSession(id); };
  /** "Add targeted exercise" starts an add: the best reviewed candidate in the add sheet, else the muscle's exercises. */
  const addTargeted = () => {
    if (candidates.length) setSheet({ kind: "change", exerciseId: candidates[0].catalogExerciseId, from: { kind: "muscle" } });
    else setSheet({ kind: "muscle", section: "exercises" });
  };
  const runFinding = (finding: Finding) => {
    const action = finding.action;
    if (!action) return;
    if (action.kind === "method") { openMethod(); return; }
    if (action.kind === "movement") { setSheet({ kind: "movement", actionId: action.actionId }); return; }
    if (action.kind === "bouts") { setSheet({ kind: "bouts", list: action.list }); return; }
    select(action.nodeId);
    setSheet(action.kind === "add" ? { kind: "muscle", section: "exercises" } : { kind: "muscle" });
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
    const noon = (key: string) => new Date(`${key}T12:00:00Z`);
    return keys.map((key) => ({
      key,
      label: noon(key).toLocaleDateString(undefined, keys.length > 7 ? { day: "numeric", month: "short", timeZone: "UTC" } : { weekday: "short", timeZone: "UTC" }),
      /** "Tue 14 Oct": the bar's name, and the title of the sheet it opens. */
      long: noon(key).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }),
      bouts: counts.get(key) ?? 0,
    }));
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
  const pairShown = plannedBouts !== null && completedBouts !== null && (plannedBouts > 0 || completedBouts > 0);

  /** The sets behind a region total (brief §1: every total opens its set records). */
  const boutSheet = useMemo<null | { eyebrow: string; title: string; intro: string; lists: BoutList[] }>(() => {
    if (sheet?.kind !== "bouts" || !summary) return null;
    const eyebrow = `${data.region.label} · ${armWord}`;
    // A plan has done nothing yet: its sets are planned for a muscle, not sets that loaded one.
    const planned = summary.mode === "planned";
    if (sheet.list === "pair") {
      // The window line's pair (design §4): this calendar week's logged bouts, then the plan week being trained, as written.
      const logged = summary.mode === "completed" ? summary : pairSummary;
      const asWritten = summary.mode === "planned" ? summary : pairSummary;
      if (!logged || !asWritten || logged.mode !== "completed" || asWritten.mode !== "planned") return null;
      const unknown = regionBoutRows(logged, "unknown-side");
      // "Bouts", as the line that opened it counts them: each set once, however many muscles it loads.
      return {
        eyebrow,
        title: `${logged.regionDistinctBouts} logged · ${asWritten.regionDistinctBouts} planned`,
        intro: `${logged.interval.label}, logged, beside ${asWritten.interval.label}. Each set is one bout, however many muscles of the ${regionWord} it loads.`,
        lists: [
          { key: "logged", heading: `Logged on the ${armWord}: ${plural(logged.regionDistinctBouts, "bout")}`, note: null, rows: regionBoutRows(logged, "region"), empty: `Nothing logged for a muscle of the ${regionWord} on the ${armWord} this week.` },
          ...(unknown.length ? [{ key: "unknown", heading: `Logged with no arm recorded: ${plural(unknown.length, "bout")}`, note: "Kept apart and counted for neither arm.", rows: unknown }] : []),
          { key: "planned", heading: `Planned in Plan Week ${trainingWeek}: ${plural(asWritten.regionDistinctBouts, "bout")}`, note: null, rows: regionBoutRows(asWritten, "region"), empty: `Nothing planned for a muscle of the ${regionWord} on the ${armWord} in Plan Week ${trainingWeek}.` },
        ],
      };
    }
    if (sheet.list === "region" && sheet.dayKey) {
      // One bar of bouts per day: the same distinct bouts the bar counts, on that local day.
      const rows = regionBoutRowsOnDay(summary, sheet.dayKey, (iso) => localDateKey(iso, timeZone));
      const day = new Date(`${sheet.dayKey}T12:00:00Z`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
      return { eyebrow, title: day, intro: `${plural(rows.length, "distinct bout")} that day: every set that loaded a muscle of the ${regionWord} on the ${armWord}, each counted once however many muscles it loaded.`, lists: [{ key: "arm", heading: null, note: null, rows }] };
    }
    if (sheet.list === "region") {
      const onArm = regionBoutRows(summary, "region");
      if (sheet.exerciseKey) {
        const rows = onArm.filter((row) => exerciseKeyOf(row) === sheet.exerciseKey);
        return { eyebrow, title: rows[0]?.exerciseName ?? "Sets", intro: planned ? `${interval.label}: ${plural(rows.length, "set")} of it planned for a muscle of the ${regionWord} on the ${armWord}.` : `${interval.label}: ${plural(rows.length, "set")} of it loaded a muscle of the ${regionWord} on the ${armWord}.`, lists: [{ key: "arm", heading: null, note: null, rows }] };
      }
      const unknown = regionBoutRows(summary, "unknown-side");
      return {
        eyebrow,
        title: `${plural(summary.regionDistinctBouts, "distinct bout")}`,
        intro: planned
          ? `${interval.label}: every set planned for a muscle of the ${regionWord} on the ${armWord}, each counted once however many muscles it is planned for.`
          : `${interval.label}: every set that loaded a muscle of the ${regionWord} on the ${armWord}, each counted once however many muscles it loaded.`,
        lists: [
          { key: "arm", heading: unknown.length ? `On the ${armWord}` : null, note: null, rows: onArm },
          ...(unknown.length ? [{ key: "unknown", heading: "No arm recorded", note: "Kept apart and counted for neither arm.", rows: unknown }] : []),
        ],
      };
    }
    if (sheet.list === "unknown-side") {
      const rows = regionBoutRows(summary, "unknown-side");
      return { eyebrow, title: `${plural(rows.length, "set")} with no arm recorded`, intro: "They are kept apart and counted for neither arm. One-arm work logged from now on asks which arm.", lists: [{ key: "unknown", heading: null, note: null, rows }] };
    }
    const rows = regionBoutRows(summary, "region-only");
    return { eyebrow, title: `${plural(rows.length, "set")} for the ${regionWord} as a whole`, intro: `Tagged with the ${regionWord} in the exercise catalog, but no reviewed mapping says which muscles they train, so they add to no single muscle.`, lists: [{ key: "region-only", heading: null, note: null, rows }] };
  }, [sheet, summary, pairSummary, trainingWeek, timeZone, data.region.label, armWord, interval.label, regionWord]);

  const completeness = summary?.completeness;
  const hasWork = selectedExposure ? barParts(selectedExposure).direct + barParts(selectedExposure).other + barParts(selectedExposure).holds + barParts(selectedExposure).incidental + barParts(selectedExposure).rest > 0 : false;
  const regionBoutsBehind = summary ? summary.regionDistinctBouts + summary.regionUnknownSideBouts : 0;

  return <section className="spz-page" aria-labelledby="spz-heading">
    {/* The top of the page is kept short, so the selected muscle and the top of the drawing are on
        a 375 × 667 phone's first screen too (brief §6 "Mobile overview"): the heading on one line
        (the tab row above already says Body Lab · Specialize), the controls in two rows, and one
        line for the window and its totals. */}
    <div className="spz-top">
      <header className="spz-head">
        {onBack && backLabel && <button type="button" className="spz-back" onClick={onBack}><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to {backLabel}</button>}
        <h1 id="spz-heading" className="spz-title">{data.region.heading}</h1>
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
            {(builtWeeks.length ? builtWeeks : [planWeek]).map((week) => <button key={week} type="button" aria-pressed={week === planWeek} onClick={() => update({ planWeek: week === trainingWeek ? null : week })}>Week {week}</button>)}
          </div>}
        {state.mode === "completed" && state.window === "custom" && <div className="spz-dates">
          <label className="spz-field"><span>From</span><input type="date" value={state.from ?? ""} max={todayKey} onChange={(event) => setCustom("from", event.target.value)} /></label>
          <label className="spz-field"><span>To</span><input type="date" value={state.to ?? ""} max={todayKey} onChange={(event) => setCustom("to", event.target.value)} /></label>
        </div>}
      </div>
      {/* One line: the window, the arm, and (for this week) logged beside planned (design §4). The
          pair is a total, so it opens the sets behind it: with a pair the whole line is one
          button (44 px tall, the pair underlined and an arrow at its end), which keeps it to
          two lines on a phone. "Plan Week" and its number are joined by a no-break space. */}
      {pairShown
        ? <p className="spz-window"><button type="button" className="spz-window-open" onClick={() => setSheet({ kind: "bouts", list: "pair" })}><span><b>{interval.label}</b> · {armWord}: <span className="spz-pair">{state.mode === "planned"
          ? <><b>{plannedBouts}</b> bout{plannedBouts === 1 ? "" : "s"} planned · <b>{completedBouts}</b> logged this week</>
          : <><b>{completedBouts}</b> bout{completedBouts === 1 ? "" : "s"} logged · <b>{plannedBouts}</b> planned in Plan Week{"\u00a0"}{trainingWeek}</>}</span></span><ArrowRight className="h-4 w-4" aria-hidden="true" /></button></p>
        : <p className="spz-window"><b>{interval.label}</b> · {armWord}{state.mode === "planned" && !planInput ? (plan.ready ? ` · Week ${planWeek} has nothing planned yet` : " · your plan is loading") : ""}{noPairNote && <span className="spz-pair-note">: not the week you train from (Week {trainingWeek}), so there is no logged week to compare</span>}</p>}
    </div>

    {here.status === "error" && <p className="spz-error" role="alert">The totals could not be worked out: {here.message}</p>}

    <section className="spz-card spz-map" aria-labelledby="spz-map-title">
      {/* Two rows of controls on a phone: the heading beside the view, then the layer beside what
          the colours show. Each segment wraps onto its own row rather than push the page sideways. */}
      <div className="spz-section-head">
        <h2 id="spz-map-title">Muscle map</h2>
        {asset && <div className="spz-segment" role="group" aria-label="View">
          {views.map((item) => <button key={item} type="button" aria-pressed={item === view} onClick={() => update({ view: item })}>{viewLabels[item]}</button>)}
        </div>}
      </div>
      {asset && <div className="spz-diagram-controls">
        {layers.length > 1 && <div className="spz-segment" role="group" aria-label="Layer">
          {layers.map((item) => <button key={item} type="button" aria-pressed={item === layer} onClick={() => update({ layer: item })}>{layerControlLabels[item]}</button>)}
        </div>}
        <div className="spz-segment" role="group" aria-label="Colour by">
          <button type="button" aria-pressed={state.map === "volume"} onClick={() => update({ map: "volume" })}>Volume</button>
          <button type="button" aria-pressed={state.map === "target"} onClick={() => update({ map: "target" })}>Target</button>
        </div>
      </div>}
      {/* The selected muscle sits between the controls and the drawing (brief §6 "Mobile overview"):
          a tap on the drawing changes the words right above it, on the same screen. One action. */}
      <div ref={stripRef} className="spz-strip" role="group" aria-label="Selected muscle" data-empty={selected ? undefined : ""}>
        {selected ? <>
          <p className="spz-strip-name"><b>{selected.name}</b><span className="spz-badge">{layerLabels[selected.layer]}</span></p>
          <p className="spz-strip-line">{sentenceFor(selected.id)}</p>
          {goalsForNode(summary, selected.id).map((progress) => <p key={progress.goal.id} className="spz-strip-goal">{goalMetricLabels[progress.goal.metric]}: {progress.label}</p>)}
          <div className="spz-actions">
            {hasWork || !summary || selectedExposure?.mappingCoverage !== "reviewed"
              ? <button type="button" className="spz-primary" onClick={() => setSheet({ kind: "muscle" })}>Inspect coverage <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
              : <button type="button" className="spz-primary" onClick={addTargeted}>Add targeted exercise <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>}
            <button type="button" className="spz-link spz-link-box" onClick={() => select(null)}>Clear</button>
          </div>
        </> : <>
          <p className="spz-strip-line">{summary ? `${plural(summary.regionDistinctBouts, "distinct bout")} touched the ${regionWord} on the ${armWord}${summary.regionUnknownSideBouts ? `, and ${summary.regionUnknownSideBouts} more had no arm recorded` : ""}.` : waiting} Choose a muscle {asset ? "on the drawing or " : ""}in the list for its numbers.</p>
          {regionBoutsBehind > 0 && <div className="spz-actions">
            <button type="button" className="spz-link" onClick={() => setSheet({ kind: "bouts", list: "region" })}>See these sets <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
          </div>}
        </>}
      </div>
      {asset ? <>
        <SpecializationDiagram asset={asset} view={view} layer={layer} mirrored={state.limb === "left"} fillFor={fillFor} selectedNodeId={selected?.id ?? null} onSelect={tapDrawing} labelFor={(id) => data.nodes.find((node) => node.id === id)?.shortName ?? id} describeFor={describeFor} caption={`${data.region.label}, ${armWord}, ${viewLabels[view].toLowerCase()} view, ${layerControlLabels[layer].toLowerCase()} layer`} />
        <MapLegend map={state.map} />
      </> : <p className="spz-note">The drawing is not ready yet. Every muscle is in the list below, with the same numbers.</p>}
    </section>

    {/* The counting rule sits under the drawing, so the drawing starts on a phone's first screen (brief §6: the illustration above the fold). */}
    <p className="spz-lede">Each set counts once per muscle and once per arm, from your {state.mode === "planned" ? "plan as written" : "logged workouts"}. Holds stay in seconds and never become sets.</p>
    <p className="sr-only" aria-live="polite">{announcement}</p>

    <section className="spz-card" aria-labelledby="spz-list-title">
      <div className="spz-section-head">
        <h2 id="spz-list-title">Muscles, most direct work first</h2>
      </div>
      <p className="spz-legend-line"><i className="spz-key spz-key-direct" />Direct <i className="spz-key spz-key-other" />Other dynamic <i className="spz-key spz-key-holds" />Holds <i className="spz-key spz-key-incidental" />Incidental grip · bar full at {BAR_SCALE} bouts</p>
      {groups.map((group) => <div key={group.id} className="spz-group">
        {groups.length > 1 && <h3>{group.title}</h3>}
        <ul className="spz-rows">
          {sortForList(group.nodes, exposureOf).map((node) => <MuscleRow key={node.id} node={node} exposure={exposureOf(node.id)} waiting={summary ? null : waiting} selected={node.id === selected?.id} onOpen={() => { select(node.id); setSheet({ kind: "muscle" }); }} />)}
        </ul>
      </div>)}
    </section>

    <section className="spz-card" aria-labelledby="spz-findings-title">
      <div className="spz-section-head"><h2 id="spz-findings-title">Coverage to review</h2></div>
      {!summary ? <p className="spz-note">{waiting}</p> : findings.length ? <>
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
        <summary><span><b>Exercises in this window</b><small>{!summary ? waiting : windowItems.length ? `${windowItems.length} exercise${windowItems.length === 1 ? "" : "s"}` : "None yet"}</small></span><ChevronDown className="h-4 w-4" aria-hidden="true" /></summary>
        {days === "too-long" ? <p className="spz-note">Choose 31 days or fewer to see the work day by day.</p> : days && <>
          {/* Each bar is a total, so a day with work opens its sets (brief §1); a day with none has nothing to open. */}
          <ol className="spz-days" aria-label="Distinct bouts per day in this window">
            {days.map((day) => {
              const bar = <><span className="spz-day-bar"><i style={{ height: `${Math.min(100, (day.bouts / 12) * 100)}%` }} /></span><b>{day.bouts}</b><small>{day.label}</small></>;
              return <li key={day.key} data-today={day.key === todayKey || undefined}>
                {day.bouts > 0
                  ? <button type="button" className="spz-day" onClick={() => setSheet({ kind: "bouts", list: "region", dayKey: day.key })} aria-label={`${day.long}: ${plural(day.bouts, "distinct bout")}. See these sets`}>{bar}</button>
                  : <span className="spz-day">{bar}</span>}
              </li>;
            })}
          </ol>
          {days.some((day) => day.bouts > 0) && <p className="spz-note spz-days-note">A day with work opens its sets.</p>}
        </>}
        {!summary ? <p className="spz-note">{waiting}</p> : windowItems.length ? <ul className="spz-exercise-list">
          {windowItems.map((item) => <li key={`${item.catalogExerciseId ?? item.name}`}>
            <span><b>{item.name}</b><small>{item.bouts} bout{item.bouts === 1 ? "" : "s"}{item.directFor.length ? ` · direct for ${item.directFor.join(", ")}` : " · no muscle here is its target"}</small></span>
            <span className="spz-candidate-actions">
              <button type="button" className="spz-link" onClick={() => setSheet({ kind: "bouts", list: "region", exerciseKey: exerciseKeyOf({ catalogExerciseId: item.catalogExerciseId, exerciseName: item.name }) })} aria-label={`The sets of ${item.name}`}>Sets</button>
              {item.catalogExerciseId !== null && <button type="button" className="spz-link" onClick={() => inspect(item.catalogExerciseId, item.name)}>About it</button>}
            </span>
          </li>)}
        </ul> : <p className="spz-note">No exercise {state.mode === "planned" ? "planned" : "logged"} in this window loads a mapped muscle of the {regionWord}.</p>}
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
        <summary><span><b>Targets</b><small>{activeTargets ? `${activeTargets} active` : "None set"}</small></span><ChevronDown className="h-4 w-4" aria-hidden="true" /></summary>
        <TargetsOverview data={data} summary={summary} goals={regionGoals} side={state.limb} timeZone={timeZone} todayKey={todayKey} onSave={saveGoals} onRemove={removeGoal} onOpenMuscle={(nodeId) => { select(nodeId); setSheet({ kind: "muscle" }); }} onOpenMovement={(actionId) => setSheet({ kind: "movement", actionId })} />
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
      loading={planLoading}
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
      paired={pairMode && pairSummary ? { label: pairMode === "planned" ? `Plan Week ${trainingWeek}, as written` : "Logged this week", exposure: pairSummary.nodes.find((node) => node.nodeId === selected.id) ?? null } : null}
      pairNote={noPairNote}
      exclusions={exclusions}
      equipmentOf={(catalogExerciseId) => equipmentById.get(catalogExerciseId) ?? null}
      onSetExerciseExcluded={setExerciseExcluded}
      onSetEquipmentExcluded={setEquipmentExcluded}
      onSaveGoals={(next) => saveGoals(next)}
      onRemoveGoal={removeGoal}
      onChooseExercise={(exerciseId) => setSheet({ kind: "change", exerciseId, from: { kind: "muscle" } })}
      onInspectExercise={inspect}
      onOpenSession={openSession}
      onOpenMethod={openMethod}
      onClose={() => setSheet(null)}
    />}
    {sheet?.kind === "movement" && <MovementSheet
      data={data}
      actionId={sheet.actionId}
      summary={summary}
      loading={planLoading}
      side={state.limb}
      mode={state.mode}
      intervalLabel={interval.label}
      weightUnit={weightUnit}
      recommendations={movementRecommendations}
      exclusions={exclusions}
      onSetExerciseExcluded={setExerciseExcluded}
      onSetEquipmentExcluded={setEquipmentExcluded}
      onChooseExercise={(exerciseId) => setSheet({ kind: "change", exerciseId, from: { kind: "movement", actionId: sheet.actionId } })}
      onInspectExercise={inspect}
      onOpenSession={openSession}
      onOpenMuscle={(nodeId) => { select(nodeId); setSheet({ kind: "muscle" }); }}
      onOpenMethod={openMethod}
      onClose={() => setSheet(null)}
    />}
    {sheet?.kind === "bouts" && boutSheet && <BoutListSheet
      eyebrow={boutSheet.eyebrow}
      title={boutSheet.title}
      intro={boutSheet.intro}
      lists={boutSheet.lists}
      weightUnit={weightUnit}
      onOpenSession={openSession}
      onInspectExercise={inspect}
      onOpenMethod={openMethod}
      onClose={() => setSheet(null)}
    />}
    {sheet?.kind === "change" && changeNodeId && <PlanChangeSheet
      data={data}
      side={state.limb}
      nodeId={changeNodeId}
      candidates={changeCandidates}
      initialExerciseId={sheet.exerciseId}
      catalog={catalog}
      plan={{ slots: plan.slots, weeks: plan.weeks, week: planWeek }}
      goal={goal}
      onApply={onApplyPlanChange}
      onClose={() => setSheet(null)}
    />}
  </section>;
}

function MuscleRow({ node, exposure, waiting, selected, onOpen }: { node: AnatomyNode; exposure: NodeExposure | null; waiting: string | null; selected: boolean; onOpen: () => void }) {
  const parts = exposure ? barParts(exposure) : null;
  // While there is no summary (the plan loading), a row is neither "not reviewed" nor "no work": it waits.
  const unmapped = !waiting && (!exposure || exposure.mappingCoverage !== "reviewed");
  const width = (value: number) => `${(Math.min(value, BAR_SCALE) / BAR_SCALE) * 100}%`;
  let offset = 0;
  const segment = (value: number, kind: string) => {
    if (!value) return null;
    const left = offset;
    offset += value;
    if (left >= BAR_SCALE) return null;
    return <i key={kind} className={`spz-bar-${kind}`} style={{ left: width(left), width: width(Math.min(value, BAR_SCALE - left)) }} />;
  };
  const value = waiting ? (waiting.startsWith("Loading") ? "Loading" : waiting.startsWith("Working") ? "Working out" : "Not worked out")
    : !exposure || exposure.mappingCoverage === "none" ? "Mapping not reviewed"
    : exposure.mappingCoverage === "pending_review" ? "Mapping under review"
    : [
      parts!.direct ? `${parts!.direct} direct` : "",
      parts!.other ? `${parts!.other} other` : "",
      parts!.holds ? `${parts!.holds} hold${parts!.holds === 1 ? "" : "s"} · ${holdTime(exposure.deliberateHoldSeconds)}` : "",
      parts!.incidental ? `${parts!.incidental} grip` : "",
      parts!.rest ? `${parts!.rest} mixed` : "",
    ].filter(Boolean).join(" · ") || "No work";
  return <li>
    <button type="button" className="spz-row" aria-pressed={selected} data-unmapped={unmapped || undefined} onClick={onOpen} aria-label={`${node.name}, ${layerLabels[node.layer]}. ${waiting ?? exposureSentence(exposure)} Open details.`}>
      <span className="spz-row-head">
        <span className="spz-row-name">{node.name}<small>{node.shortName}</small>{node.layer !== "surface" && <span className="spz-badge">{node.layer === "deep" ? "Deep" : "Middle"}</span>}</span>
        <span className="spz-row-value">{value}{exposure && directWorkBouts(exposure) > BAR_SCALE ? ` (${directWorkBouts(exposure)})` : ""}</span>
      </span>
      <span className="spz-track" aria-hidden="true" data-hatch={unmapped || undefined}>
        {parts && !unmapped && !waiting && [segment(parts.direct, "direct"), segment(parts.other, "other"), segment(parts.holds, "holds"), segment(parts.incidental, "incidental"), segment(parts.rest, "rest")]}
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
