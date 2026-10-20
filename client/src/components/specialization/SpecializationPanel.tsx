import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import { ArrowRight, ChevronDown, ChevronLeft } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import type { AthleteEquipmentProfile } from "@/lib/equipmentProfile";
import { trainingWeekFor, type NextWorkoutChoice } from "@/lib/nextWorkout";
import { loadedRegionData, loadRegionData } from "@/lib/specialization/loadRegion";
import { plannedExercisesInWeek } from "@/lib/specialization/planBouts";
import { recommendFor, type RecommendationCandidate } from "@/lib/specialization/recommendations";
import { useSpecializationGoals, useSpecializationMeasurements } from "@/lib/specialization/stores";
import { useSpecializationExclusions } from "@/lib/specialization/exclusions";
import { intervalForView, useDeviceWorkoutSessions, useSpecializationSummary, type SpecializationPlanInput } from "@/lib/specialization/useSpecializationSummary";
import { rememberRegion, withRegion, type SpecializationPlanChange, type SpecializationPlanChangeResult, type SpecializationViewState } from "@/lib/specialization/viewState";
import { emptyDayStore, type DaySlot, type WeeklyDayStore } from "@/lib/trainingDayPlan";
import type { DisplayWeightUnit } from "@/lib/weightUnits";
import type { TrainingGoal } from "@/lib/workoutPlanner";
import { goalScopeOf } from "@shared/specialization/goals";
import { regionIndexEntry, specializationRegionIndex } from "@shared/specialization/regionIndex";
import { currentExposureRule, exposureCategoryLabelsFor } from "@shared/specialization/rules";
import { addDaysToDateKey, calendarWeekInterval, isDateKey, localDateKey, planWeekInterval } from "@shared/specialization/time";
import type { AnatomyNode, DiagramLayerId, ExposureCategory, NodeExposure, RegionId, SpecializationGoal, SpecializationRegion, SpecializationRegionData, SummaryCompleteness, SummaryMode, SummarySide } from "@shared/specialization/types";
import { BoutListSheet, type BoutList } from "./BoutListSheet";
import { MeasurementsPanel } from "./MeasurementsPanel";
import { MovementSheet } from "./MovementSheet";
import { MuscleSheet } from "./MuscleSheet";
import { splitTargets } from "./TargetsEditor";
import { TargetsOverview } from "./TargetsOverview";
import { PlanChangeSheet } from "./PlanChangeSheet";
import { scrollToTopClear } from "./reveal";
import { SpecializationDiagram } from "./SpecializationDiagram";
import { BAR_SCALE, barParts, boutsByDay, directWorkBouts, drawingMirrored, exerciseKeyOf, exercisesInWindow, exposureSentence, fillForNode, findingsFor, goalMetricShortLabels, holdTime, goalsForNode, latestSessionDayLabel, layerLabels, listedUnmappedReasons, listedUnmappedSentences, movementFocusNodeId, overlapsInWindow, regionBoutRows, regionBoutRowsOnDay, selectableNodes, sortForList, targetBins, targetProgressText, volumeBins, type DiagramFill, type Finding, type RegionBoutList } from "./model";
import { rowSideTextFor, sideWordsFor, type SideWords } from "./sideWords";
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
  /**
   * The short name of the page that opened this one ("Muscles", "Review"; 9 characters or fewer,
   * Home's `workspaceShortTitles`), for the Back in the heading row; null when nothing opened it.
   */
  backLabel: string | null;
  onBack: (() => void) | null;
  /**
   * The page was opened with no region named and none remembered on this device: the region grid
   * starts open, once (docs/specialization-atlas/10-multi-region.md §6.1). Only with more than one
   * region to choose from.
   */
  chooseRegion?: boolean;
};

const layerControlLabels: Record<DiagramLayerId, string> = { surface: "Surface", intermediate: "Middle", deep: "Deep" };
const SHOWN_FINDINGS = 3;
const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;
const capitalised = (text: string) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text);

/**
 * Said plainly under "How this is counted" on every region (10-multi-region.md §8): what
 * "reviewed" means for the anatomy, the mappings and the drawing behind the numbers.
 */
const REVIEW_STATEMENT = "“Reviewed” means an automated agent checked each sentence against web-search excerpts and generated summaries of the cited sources on the date shown. It was not checked against the full texts, and not by a clinician or anatomist. A second automated review, with the same tools and limits, looked for errors; it is not peer review.";
const DRAWING_STATEMENT = "The drawings are original schematics checked against these notes, not reviewed by an anatomist.";

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
 * The region sentence: the region's distinct bouts on the side shown, in the region's words
 * ("12 distinct bouts touched your right forearm, and 2 more had no arm recorded."). Logged work
 * touched the region; a plan has done nothing yet, so its sets are planned for it, in its plan week
 * ("…planned for your right forearm in Plan Week 1"). `planWeek` is null where the words before the
 * sentence already name the plan week ("Plan Week 1, as written: …"), so it is said once.
 */
function regionSentence(words: SideWords, side: SummarySide, summary: { mode: SummaryMode; regionDistinctBouts: number; regionUnknownSideBouts: number }, planWeek: number | null): string {
  const where = words.onSide(side);
  const unsided = words.paired ? summary.regionUnknownSideBouts : 0;
  return summary.mode === "planned"
    // "Plan Week" and its number never part across lines (a no-break space).
    ? `${plural(summary.regionDistinctBouts, "distinct bout")} ${summary.regionDistinctBouts === 1 ? "is" : "are"} planned for ${where}${planWeek === null ? "" : ` in Plan Week ${planWeek}`}${unsided ? `, and ${unsided} more name ${words.noLimb}` : ""}.`
    : `${plural(summary.regionDistinctBouts, "distinct bout")} touched ${where}${unsided ? `, and ${unsided} more had ${words.noneRecorded}` : ""}.`;
}

/**
 * Body Lab → Specialize (Oct 16 forearm brief §6, design §7; 10-multi-region.md §6): one body
 * region at a time, muscle by muscle, from the athlete's own plan and logged work. The heading
 * row stays while the region's page is loaded and replaced: Back to the page that opened this
 * one, then the heading, which picks the region when there is more than one. Each region's data
 * loads on its own (`loadRegionData`), and the page below is keyed by region, so nothing one
 * region opened (a sheet, a finding, a disclosure) carries over to the next.
 */
export function SpecializationPanel(props: SpecializationPanelProps) {
  const { state, onStateChange, accountId, backLabel, onBack } = props;
  const region = specializationRegionIndex.find((item) => item.id === state.regionId) ?? null;
  const [, setLoads] = useState(0);
  /** A region whose data did not load: its import failed, or this build has no data for it. */
  const [failed, setFailed] = useState<{ regionId: RegionId; why: "import" | "missing" } | null>(null);
  const data = region ? loadedRegionData(region.id) : null;
  useEffect(() => {
    if (!region) return;
    // Loaded since this render (a load Home started beside the page's chunk can land between the
    // render and this effect): show it, rather than keep the loading line with nothing to end it.
    if (loadedRegionData(region.id)) {
      if (!data) setLoads((count) => count + 1);
      return;
    }
    let live = true;
    setFailed(null);
    loadRegionData(region.id).then(
      // A region the index offers but this build cannot load is not available, never a page of zeros.
      (loadedData) => { if (live) (loadedData ? setLoads((count) => count + 1) : setFailed({ regionId: region.id, why: "missing" })); },
      () => { if (live) setFailed({ regionId: region.id, why: "import" }); },
    );
    return () => { live = false; };
  }, [region, data]);
  // The region this account last opened on this device, so the page opens on it next time.
  useEffect(() => { if (region) rememberRegion(accountId, region.id); }, [accountId, region]);

  const { goals, save: saveGoals, remove: removeGoal } = useSpecializationGoals(accountId);
  // The persistent live region: what the page says on a change (a muscle, a window, a region picked).
  const [announcement, setAnnouncement] = useState("");
  /** The region just picked, announced with its count once its first summary is ready. */
  const [announceRegion, setAnnounceRegion] = useState<RegionId | null>(null);
  // The heading's toggle: focus returns to it after a region is opened from a muscle's sheet,
  // as after a pick from the grid, since the page it was on is replaced.
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [focusHead, setFocusHead] = useState(false);
  useEffect(() => {
    if (!focusHead) return;
    setFocusHead(false);
    toggleRef.current?.focus();
  }, [focusHead, state.regionId]);

  if (!region) return <section className="spz-page" aria-labelledby="spz-heading">
    <header className="spz-head">
      {onBack && backLabel && <BackButton label={backLabel} onBack={onBack} />}
      <h1 id="spz-heading" className="spz-title">Specialize</h1>
    </header>
    <p className="spz-note">That body region is not available.</p>
  </section>;

  const pick = (regionId: RegionId) => {
    if (regionId === state.regionId) return;
    setAnnounceRegion(regionId);
    onStateChange(withRegion(state, regionId));
  };
  /** Another region's page on one of its muscles (an external muscle's home), from its sheet: a region change, like a pick. */
  const openRegion = (regionId: RegionId, nodeId: string) => {
    setAnnounceRegion(regionId);
    setFocusHead(true);
    onStateChange(withRegion(state, regionId, nodeId));
  };
  const regionWord = region.label.toLowerCase();
  return <section className="spz-page" aria-labelledby="spz-heading">
    <RegionHead region={region} goals={goals} backLabel={backLabel} onBack={onBack} chooseRegion={props.chooseRegion ?? false} onPick={pick} toggleRef={toggleRef} />
    {data
      ? <SpecializationPage
        key={data.region.id}
        {...props}
        data={data}
        goalsStore={{ goals, save: saveGoals, remove: removeGoal }}
        announce={setAnnouncement}
        announceRegion={announceRegion === data.region.id}
        onRegionAnnounced={() => setAnnounceRegion(null)}
        onOpenRegion={openRegion}
      />
      : failed?.regionId === region.id
        ? failed.why === "missing"
          ? <p className="spz-note">That body region is not available.</p>
          // The browser keeps a failed import for the rest of the visit, so trying it again in place
          // never loads it (in Chromium no second request is made). A reload does, as the app's own
          // error screen offers; the address and the history entry keep the region and the Back.
          : <div className="spz-loading" role="alert">
            <p className="spz-error">The page for the {regionWord} could not be loaded. Reloading usually fixes this.</p>
            <button type="button" className="spz-button" onClick={() => window.location.reload()}>Reload</button>
          </div>
        // Never zeros while the region loads: one line, where the page will be.
        : <p className="spz-note spz-loading" role="status">Loading the {regionWord}…</p>}
    <p className="sr-only" aria-live="polite">{announcement}</p>
  </section>;
}

/** Back to the page that opened this one, by its short name ("‹ Muscles"), in the heading row. */
function BackButton({ label, onBack }: { label: string; onBack: () => void }) {
  return <button type="button" className="spz-back" onClick={onBack} aria-label={`Back to ${label}`}><ChevronLeft className="h-5 w-5" aria-hidden="true" />{label}</button>;
}

/**
 * The heading row (10-multi-region.md §6.1, the iOS title-menu pattern): Back to the page that
 * opened this one, by its short name, then the heading. With one region the heading is the
 * region's, as plain text. With more, the heading is the toggle: the region's label and a
 * chevron in a bordered button, visible at rest, that opens the grid of regions under the row.
 * Picking one replaces the page state (Back still returns to where the page was opened from),
 * closes the grid and leaves focus on the toggle; the current region, the toggle or Escape closes
 * it too. Each cell says how many active targets the athlete has there.
 */
function RegionHead({ region, goals, backLabel, onBack, chooseRegion, onPick, toggleRef }: {
  region: SpecializationRegion;
  goals: readonly SpecializationGoal[];
  backLabel: string | null;
  onBack: (() => void) | null;
  chooseRegion: boolean;
  onPick: (regionId: RegionId) => void;
  toggleRef: RefObject<HTMLButtonElement | null>;
}) {
  const choosing = specializationRegionIndex.length > 1;
  const [open, setOpen] = useState(() => choosing && chooseRegion);
  // Asked for after the row was drawn (the address had no region, and the account was read since): opened then, once.
  useEffect(() => { if (choosing && chooseRegion) setOpen(true); }, [choosing, chooseRegion]);
  const hintId = useId();
  const todayKey = localDateKey(new Date().toISOString(), Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const activeTargets = (regionId: RegionId) => splitTargets(goals.filter((goal) => goal.regionId === regionId), todayKey).active.length;
  const close = () => { setOpen(false); toggleRef.current?.focus(); };
  const pick = (regionId: RegionId) => {
    close();
    onPick(regionId);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape" || !open) return;
    event.stopPropagation();
    close();
  };
  return <div className="spz-head-wrap" onKeyDown={onKeyDown}>
    <header className="spz-head">
      {onBack && backLabel && <BackButton label={backLabel} onBack={onBack} />}
      <h1 id="spz-heading" className="spz-title">
        {choosing
          ? <button ref={toggleRef} type="button" className="spz-region-toggle" aria-expanded={open} aria-controls="spz-regions" aria-describedby={hintId} onClick={() => setOpen((shown) => !shown)}>
            <span>{region.label}</span><ChevronDown className="spz-region-chevron" aria-hidden="true" />
          </button>
          : region.heading}
      </h1>
      {choosing && <span id={hintId} className="sr-only">Choose a body region</span>}
    </header>
    {choosing && <div id="spz-regions" className="spz-regions" role="group" aria-label="Body region" hidden={!open}>
      {specializationRegionIndex.map((item) => {
        const targets = activeTargets(item.id);
        return <button key={item.id} type="button" className="spz-region" aria-pressed={item.id === region.id} onClick={() => (item.id === region.id ? close() : pick(item.id))}>
          <span>{item.label}</span>
          {targets > 0 && <small>{plural(targets, "target")}</small>}
        </button>;
      })}
    </div>}
  </div>;
}

type GoalsStore = ReturnType<typeof useSpecializationGoals>;

function SpecializationPage({ data, state, onStateChange, plan, catalog, equipmentProfile, accountId, goal, weightUnit, onApplyPlanChange, onInspectExercise, onOpenSession, goalsStore, announce, announceRegion, onRegionAnnounced, onOpenRegion }: SpecializationPanelProps & {
  data: SpecializationRegionData;
  goalsStore: GoalsStore;
  /** Says something in the panel's live region. */
  announce: (text: string) => void;
  /** This region was just picked: say its count once its first summary is ready. */
  announceRegion: boolean;
  onRegionAnnounced: () => void;
  /** Opens another region's page on one of its muscles. */
  onOpenRegion: (regionId: RegionId, nodeId: string) => void;
}) {
  const timeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", []);
  const datesId = useId();
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

  /** The region's side words; a midline region has no side, and every summary is for `midline`. */
  const words = useMemo(() => sideWordsFor(data.region), [data.region]);
  const sideText = useMemo(() => rowSideTextFor(data), [data]);
  const side: SummarySide = words.paired ? state.limb : "midline";
  const regionWord = data.region.label.toLowerCase();
  /** "right arm" in a heading or a short line; null on a midline region. */
  const sideShort = words.paired ? words.of(state.limb) : null;
  const categoryLabels = useMemo(() => exposureCategoryLabelsFor(data.region.wording), [data.region.wording]);

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

  const { goals, save: saveGoalsTo, remove: removeGoal } = goalsStore;
  // A new target is held to the region's target muscles and its sides (`goalScopeOf`, goals.ts).
  const goalScope = useMemo(() => goalScopeOf(data), [data]);
  const saveGoals = (next: SpecializationGoal[]) => saveGoalsTo(next, goalScope);
  // Undo writes back exactly what End or Remove took away, so it is not held to the new-target
  // rule: a target saved earlier on a muscle that is not a target here comes back too (§2.2).
  // The side, dates and overlap are still checked.
  const restoreGoals = (next: SpecializationGoal[]) => saveGoalsTo(next);
  const { measurements, save: saveMeasurement, remove: removeMeasurement } = useSpecializationMeasurements(accountId);
  const regionGoals = useMemo(() => goals.filter((item) => item.regionId === data.region.id), [goals, data.region.id]);
  const activeTargets = splitTargets(regionGoals, localDateKey(nowIso, timeZone)).active.length;
  const otherSide = state.limb === "left" ? "right" : "left";
  // Planned mode before the plan has loaded: an empty plan would read as zeros, fake progress
  // and "behind" findings, so the page shows that it is loading instead (no numbers at all).
  const planLoading = state.mode === "planned" && !plan.ready;
  const here = useSpecializationSummary({ region: data, accountScope: accountId, interval, side, mode: state.mode, plan: planInput, goals: regionGoals, catalog, fallbackUnit: weightUnit, now: nowIso });
  // The other side, for the difference between the sides; a midline region has none, and this reads the midline again (cached).
  const there = useSpecializationSummary({ region: data, accountScope: accountId, interval, side: words.paired ? otherSide : "midline", mode: state.mode, plan: planInput, goals: regionGoals, catalog, fallbackUnit: weightUnit, now: nowIso });
  const summary = here.status === "ready" && !planLoading ? here.summary : null;
  const otherSummary = words.paired && there.status === "ready" && !planLoading ? there.summary : null;
  /**
   * The ledger's comparison (design §4): this calendar week's logged work beside the plan week
   * being trained, and only that week. In completed mode over this week it is that plan week
   * as written; in planned mode, this week's logged work, when the week shown is the one being
   * trained. Other windows have no pair: a plan carries no dates.
   */
  const pairMode: SummaryMode | null = !plan.ready ? null : state.mode === "planned" ? (planWeek === trainingWeek ? "completed" : null) : state.window === "week" ? "planned" : null;
  const noPairNote = state.mode === "planned" && plan.ready && planInput && planWeek !== trainingWeek ? `Plan Week ${planWeek} is not the week you train from (Week ${trainingWeek}), so there is no logged week to compare.` : null;
  const pairInterval = useMemo(() => (pairMode === "planned" ? planWeekInterval(trainingWeek, timeZone) : calendarWeekInterval(nowIso, timeZone)), [pairMode, trainingWeek, timeZone, nowIso]);
  const pair = useSpecializationSummary({ region: data, accountScope: accountId, interval: pairInterval, side, mode: pairMode ?? "planned", plan: trainingPlanInput, goals: regionGoals, catalog, fallbackUnit: weightUnit, now: nowIso });
  const pairSummary = pairMode && pair.status === "ready" ? pair.summary : null;
  const { exclusions, setExercise: setExerciseExcluded, setEquipment: setEquipmentExcluded } = useSpecializationExclusions(accountId);

  const exposureById = useMemo(() => new Map((summary?.nodes ?? []).map((node) => [node.nodeId, node] as const)), [summary]);
  const exposureOf = (id: string): NodeExposure | null => exposureById.get(id) ?? null;
  const nodes = useMemo(() => selectableNodes(data), [data]);
  const selected = nodes.find((node) => node.id === state.nodeId) ?? null;
  const selectedExposure = selected ? exposureOf(selected.id) : null;
  const selectedGoals = selected ? [...goalsForNode(summary, selected.id)].sort((left, right) => left.fraction - right.fraction) : [];
  const stripGoal = selectedGoals[0] ?? null;
  const stripGoalsMore = Math.max(0, selectedGoals.length - 1);
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [allFindings, setAllFindings] = useState(false);
  // Mounted once first opened and kept: a half-filled reading or its Undo survives closing the disclosure.
  const [progressOpened, setProgressOpened] = useState(false);
  const methodRef = useRef<HTMLDetailsElement>(null);

  const plannedExercises = useMemo(() => plannedExercisesInWeek(plan.slots, weekStore ?? emptyDayStore()), [plan.slots, weekStore]);
  const recommendations = useMemo(() => {
    if (!selected || !summary) return null;
    return recommendFor({ region: data, target: { nodeId: selected.id }, side, summary, otherSideSummary: otherSummary, plannedExercises, catalog, equipmentProfile, exclusions });
  }, [selected, summary, otherSummary, plannedExercises, catalog, equipmentProfile, data, side, exclusions]);
  const candidates = recommendations?.kind === "candidates" ? recommendations.candidates : [];
  /** An exercise's equipment from the catalog the recommender read, so the muscle sheet can say why a main action has no suggestion. */
  const equipmentById = useMemo(() => new Map(catalog.map((exercise) => [exercise.id, exercise.equipment ?? null] as const)), [catalog]);
  // A movement's exercises (brief §7: "A suggested exercise explicitly addresses the selected muscle/action").
  const movementId = sheet?.kind === "movement" ? sheet.actionId : sheet?.kind === "change" && sheet.from.kind === "movement" ? sheet.from.actionId : null;
  const movementRecommendations = useMemo(() => {
    if (!movementId || !summary) return null;
    return recommendFor({ region: data, target: { actionId: movementId }, side, summary, otherSideSummary: otherSummary, plannedExercises, catalog, equipmentProfile, exclusions });
  }, [movementId, summary, otherSummary, plannedExercises, catalog, equipmentProfile, data, side, exclusions]);
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

  // The drawing: only the views and layers the asset has, in its order and its words (no view is
  // named here); the list stands in when there is none. No view in the address, or one this
  // drawing does not have, is its first view.
  const asset = data.diagram;
  const views = (asset?.viewOrder ?? []).filter((item) => asset?.views[item.id]);
  const shownView = views.find((item) => item.id === state.view) ?? views[0] ?? null;
  const view = shownView?.id ?? state.view ?? "";
  const layers = (Object.keys(layerControlLabels) as DiagramLayerId[]).filter((layer) => asset?.views[view]?.[layer]);
  const layer: DiagramLayerId = layers.includes(state.layer) ? state.layer : layers[0] ?? state.layer;
  const mirrored = asset !== null && drawingMirrored(data.region, asset, state.limb);

  // A hand-edited or stale address: an unknown muscle, a plan week that is not built, or a view
  // this drawing does not have (or its first view, which the address leaves out) is dropped from
  // it, all in one change so no fix overwrites another.
  const staleView = state.view !== null && views.length > 0 && (state.view !== shownView?.id || state.view === views[0].id);
  const staleWeek = plan.ready && state.planWeek !== null && builtWeeks.length > 0 && !builtWeeks.includes(state.planWeek);
  const staleNode = Boolean(state.nodeId) && !selected;
  useEffect(() => {
    if (!staleNode && !staleWeek && !staleView) return;
    onStateChange({ ...state, ...(staleNode ? { nodeId: null } : {}), ...(staleWeek ? { planWeek: null } : {}), ...(staleView ? { view: null } : {}) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staleNode, staleWeek, staleView]);
  const nameOf = (id: string) => data.nodes.find((node) => node.id === id)?.name ?? id;
  /** What stands in for numbers while there are none: the plan loading, the totals failing, or (briefly) being worked out. */
  const waiting = planLoading ? "Loading your plan…" : here.status === "error" ? "The totals could not be worked out." : "Working out the totals…";
  // No summary yet: every muscle is drawn plain, neither hatched ("not reviewed") nor empty ("no work").
  const fillFor = (id: string): DiagramFill => (summary ? fillForNode(exposureOf(id), state.map, goalsForNode(summary, id)) : { kind: "none" });
  const sentenceFor = (id: string) => (summary ? exposureSentence(exposureOf(id), data.region.wording.incidentalWork, words) : waiting);
  const describeFor = (id: string) => `${nameOf(id)}. ${sentenceFor(id)}`;

  const select = (nodeId: string | null) => {
    update({ nodeId });
    if (nodeId) announce(`${nameOf(nodeId)} selected. ${sentenceFor(nodeId)}`);
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
    // In planned mode the window's label names the plan week ("Plan Week 1, as written"), so the sentence does not again.
    if (summary && !announceRegion) announce(`${interval.label}: ${regionSentence(words, side, summary, null)}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interval.label, state.limb, state.mode]);
  // A region just picked from the heading: its label and its count, once there is a count to say.
  useEffect(() => {
    if (!announceRegion || !summary) return;
    announce(`${data.region.label}: ${regionSentence(words, side, summary, planWeek)}`);
    onRegionAnnounced();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announceRegion, summary]);

  /**
   * "How this is counted" from a sheet: the sheet closes, the method opens, and the athlete is
   * taken to it with focus on its heading (the summary), so the next swipe or Tab reads the
   * method, not the row the sheet was opened from. The frame runs after the sheet has unmounted
   * and handed focus back to its opener; this then moves it on. The page scrolls the method's
   * top to just under the sticky tab row.
   */
  const openMethod = () => {
    setSheet(null);
    const details = methodRef.current;
    if (!details) return;
    details.open = true;
    window.requestAnimationFrame(() => {
      details.querySelector<HTMLElement>(":scope > summary")?.focus({ preventScroll: true });
      scrollToTopClear(details);
    });
  };
  const inspect = (catalogExerciseId: number | null, name: string) => {
    const exercise = catalog.find((item) => (catalogExerciseId !== null ? item.id === catalogExerciseId : item.name === name));
    if (!exercise) return;
    setSheet(null);
    onInspectExercise(exercise);
  };
  const openSession = (id: string) => { setSheet(null); onOpenSession(id); };
  const openRegion = (regionId: RegionId, nodeId: string) => { setSheet(null); onOpenRegion(regionId, nodeId); };
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

  // The region's own muscles, those it lists nearby, then each other region's muscles credited
  // here under that region's own heading ("Upper-arm muscles credited here").
  const externalHomes = Array.from(new Set(nodes.filter((node) => node.role === "external").map((node) => node.regionId)));
  const groups: { id: string; title: string; nodes: AnatomyNode[] }[] = [
    { id: "target", title: `Muscles of the ${regionWord}`, nodes: nodes.filter((node) => node.role === "target") },
    { id: "adjacent", title: "Nearby", nodes: nodes.filter((node) => node.role === "adjacent") },
    ...externalHomes.map((home) => ({
      id: `external:${home}`,
      title: regionIndexEntry(home)?.wording.externalHeading ?? data.region.wording.externalGroup,
      nodes: nodes.filter((node) => node.role === "external" && node.regionId === home),
    })),
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
  const where = words.onSide(side);
  const boutSheet = useMemo<null | { eyebrow: string; title: string; intro: string; lists: BoutList[] }>(() => {
    if (sheet?.kind !== "bouts" || !summary) return null;
    const eyebrow = sideShort ? `${data.region.label} · ${sideShort}` : data.region.label;
    const keptApart = `Kept apart and ${words.neither}.`;
    // A plan has done nothing yet: its sets are planned for a muscle, not sets that loaded one.
    const planned = summary.mode === "planned";
    if (sheet.list === "pair") {
      // The window line's pair (design §4): this calendar week's logged bouts, then the plan week being trained, as written.
      const logged = summary.mode === "completed" ? summary : pairSummary;
      const asWritten = summary.mode === "planned" ? summary : pairSummary;
      if (!logged || !asWritten || logged.mode !== "completed" || asWritten.mode !== "planned") return null;
      const unknown = words.paired ? regionBoutRows(logged, "unknown-side") : [];
      // "Bouts", as the line that opened it counts them: each set once, however many muscles it loads.
      return {
        eyebrow,
        title: `${logged.regionDistinctBouts} logged · ${asWritten.regionDistinctBouts} planned`,
        intro: `${logged.interval.label}, logged, beside ${asWritten.interval.label}. Each set is one bout, however many muscles of the ${regionWord} it loads.`,
        lists: [
          { key: "logged", heading: `Logged for ${where}: ${plural(logged.regionDistinctBouts, "bout")}`, note: null, rows: regionBoutRows(logged, "region"), empty: `Nothing logged for ${where} this week.` },
          ...(unknown.length ? [{ key: "unknown", heading: `Logged with ${words.noneRecorded}: ${plural(unknown.length, "bout")}`, note: keptApart, rows: unknown }] : []),
          { key: "planned", heading: `Planned in Plan Week ${trainingWeek}: ${plural(asWritten.regionDistinctBouts, "bout")}`, note: null, rows: regionBoutRows(asWritten, "region"), empty: `Nothing planned for ${where} in Plan Week ${trainingWeek}.` },
        ],
      };
    }
    if (sheet.list === "region" && sheet.dayKey) {
      // One bar of bouts per day: the same distinct bouts the bar counts, on that local day.
      const rows = regionBoutRowsOnDay(summary, sheet.dayKey, (iso) => localDateKey(iso, timeZone));
      const day = new Date(`${sheet.dayKey}T12:00:00Z`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
      return { eyebrow, title: day, intro: `${plural(rows.length, "distinct bout")} that day: every set that touched ${where}, each counted once however many muscles it loaded.`, lists: [{ key: "side", heading: null, note: null, rows }] };
    }
    if (sheet.list === "region") {
      const onSideRows = regionBoutRows(summary, "region");
      if (sheet.exerciseKey) {
        const rows = onSideRows.filter((row) => exerciseKeyOf(row) === sheet.exerciseKey);
        return { eyebrow, title: rows[0]?.exerciseName ?? "Sets", intro: planned ? `${interval.label}: ${plural(rows.length, "set")} of it planned for ${where}.` : `${interval.label}: ${plural(rows.length, "set")} of it touched ${where}.`, lists: [{ key: "side", heading: null, note: null, rows }] };
      }
      const unknown = words.paired ? regionBoutRows(summary, "unknown-side") : [];
      return {
        eyebrow,
        title: `${plural(summary.regionDistinctBouts, "distinct bout")}`,
        intro: planned
          ? `${interval.label}: every set planned for ${where}, each counted once however many muscles it is planned for.`
          : `${interval.label}: every set that touched ${where}, each counted once however many muscles it loaded.`,
        lists: [
          { key: "side", heading: unknown.length ? capitalised(where) : null, note: null, rows: onSideRows },
          ...(unknown.length ? [{ key: "unknown", heading: words.noneRecordedTitle, note: keptApart, rows: unknown }] : []),
        ],
      };
    }
    if (sheet.list === "unknown-side") {
      const rows = regionBoutRows(summary, "unknown-side");
      return { eyebrow, title: `${plural(rows.length, "set")} with ${words.noneRecorded}`, intro: `They are kept apart and ${words.neither}. ${words.asksWhich}`, lists: [{ key: "unknown", heading: null, note: null, rows }] };
    }
    if (sheet.list === "listed-unmapped") {
      const rows = regionBoutRows(summary, "listed-unmapped");
      return { eyebrow, title: `${plural(rows.length, "set")} not counted here`, intro: listedUnmappedSentences(summary, data).join(" "), lists: [{ key: "listed-unmapped", heading: null, note: null, rows, reasons: listedUnmappedReasons(summary, data) }] };
    }
    const rows = regionBoutRows(summary, "region-only");
    return { eyebrow, title: `${plural(rows.length, "set")} for the ${regionWord} as a whole`, intro: `Tagged with the ${regionWord} in the exercise catalog, but no reviewed mapping says which muscles they train, so they add to no single muscle.`, lists: [{ key: "region-only", heading: null, note: null, rows }] };
  }, [sheet, summary, pairSummary, trainingWeek, timeZone, data, sideShort, words, where, interval.label, regionWord]);

  const completeness = summary?.completeness;
  const hasWork = selectedExposure ? barParts(selectedExposure).direct + barParts(selectedExposure).other + barParts(selectedExposure).holds + barParts(selectedExposure).incidental + barParts(selectedExposure).rest > 0 : false;
  const regionBoutsBehind = summary ? summary.regionDistinctBouts + (words.paired ? summary.regionUnknownSideBouts : 0) : 0;
  /** The strip with nothing selected: the region's distinct bouts on this side. */
  const regionLine = summary ? regionSentence(words, side, summary, planWeek) : waiting;
  // Behind the completeness counts in "How this is counted": the lists that exist open; what is not kept as a list is said.
  const regionOnlyRows = summary ? regionBoutRows(summary, "region-only") : [];
  const unknownSideRows = summary && words.paired ? regionBoutRows(summary, "unknown-side") : [];
  const listedUnmappedRows = summary ? regionBoutRows(summary, "listed-unmapped") : [];
  // The straps clause is said only on a region with a mapping that needs a bare hand (10-multi-region.md §4.3).
  const strapsSensitive = data.mappings.some((mapping) => mapping.requiresNoStraps) || data.externalMappingVersions.some((external) => external.mappings.some((mapping) => mapping.requiresNoStraps));
  const rule = currentExposureRule;

  return <>
    {/* The top of the page is kept short, so the selected muscle and the top of the drawing are on
        a 375 × 667 phone's first screen too (brief §6 "Mobile overview"): the heading row (the tab
        row above already says Body Lab · Specialize), the controls in two rows, and one line for
        the window and its totals. */}
    <div className="spz-top">
      <div className="spz-controls">
        <div className="spz-segment" role="group" aria-label="Planned or completed">
          <button type="button" aria-pressed={state.mode === "completed"} onClick={() => update({ mode: "completed" })}>Completed</button>
          <button type="button" aria-pressed={state.mode === "planned"} onClick={() => update({ mode: "planned" })}>Planned</button>
        </div>
        {/* The side, in the region's words ("Left leg · Right leg"); a midline region has none. */}
        {words.paired && <div className="spz-segment" role="group" aria-label={words.group}>
          <button type="button" aria-pressed={state.limb === "left"} onClick={() => update({ limb: "left" })}>{words.label("left")}</button>
          <button type="button" aria-pressed={state.limb === "right"} onClick={() => update({ limb: "right" })}>{words.label("right")}</button>
        </div>}
        {state.mode === "completed"
          ? <div className="spz-segment" role="group" aria-label="Time window">
            <button type="button" aria-pressed={state.window === "week"} onClick={() => chooseWindow("week")}>This week</button>
            <button type="button" aria-pressed={state.window === "7d"} onClick={() => chooseWindow("7d")}>Rolling 7 days</button>
            <button type="button" aria-pressed={state.window === "custom"} onClick={() => chooseWindow("custom")}>Custom</button>
          </div>
          : <div className="spz-segment" role="group" aria-label="Plan week">
            {(builtWeeks.length ? builtWeeks : [planWeek]).map((week) => <button key={week} type="button" aria-pressed={week === planWeek} onClick={() => update({ planWeek: week === trainingWeek ? null : week })}>Week {week}</button>)}
          </div>}
        {/* The labels sit beside their fields, one 44 px row for both from 375 px (stacked below it);
            each label is a grid column of its own, so the two dates get the same width. */}
        {state.mode === "completed" && state.window === "custom" && <div className="spz-field spz-dates">
          <label htmlFor={`${datesId}-from`}>From</label>
          <input id={`${datesId}-from`} type="date" value={state.from ?? ""} max={todayKey} onChange={(event) => setCustom("from", event.target.value)} />
          <label htmlFor={`${datesId}-to`}>To</label>
          <input id={`${datesId}-to`} type="date" value={state.to ?? ""} max={todayKey} onChange={(event) => setCustom("to", event.target.value)} />
        </div>}
      </div>
      {/* One line: the window, the side, and (for this week) logged beside planned (design §4). The
          pair is a total, so it opens the sets behind it: with a pair the whole line is one
          button (44 px tall, the pair underlined and an arrow at its end), which keeps it to
          two lines on a phone. "Plan Week" and its number are joined by a no-break space. */}
      {pairShown
        ? <p className="spz-window"><button type="button" className="spz-window-open" onClick={() => setSheet({ kind: "bouts", list: "pair" })}><span><b>{interval.label}</b>{sideShort ? ` · ${sideShort}` : ""}: <span className="spz-pair">{state.mode === "planned"
          ? <><b>{plannedBouts}</b> bout{plannedBouts === 1 ? "" : "s"} planned · <b>{completedBouts}</b> logged this week</>
          : <><b>{completedBouts}</b> bout{completedBouts === 1 ? "" : "s"} logged · <b>{plannedBouts}</b> planned in Plan Week{" "}{trainingWeek}</>}</span></span><ArrowRight className="h-4 w-4" aria-hidden="true" /></button></p>
        : <p className="spz-window"><b>{interval.label}</b>{sideShort ? ` · ${sideShort}` : ""}{state.mode === "planned" && !planInput ? (plan.ready ? ` · Week ${planWeek} has nothing planned yet` : " · your plan is loading") : ""}{noPairNote && <span className="spz-pair-note">: not the week you train from (Week {trainingWeek}), so there is no logged week to compare</span>}</p>}
    </div>

    {here.status === "error" && <p className="spz-error" role="alert">The totals could not be worked out: {here.message}</p>}

    <section className="spz-card spz-map" aria-labelledby="spz-map-title">
      {/* Two rows of controls on a phone: the heading beside the view, then the layer beside what
          the colours show. Each segment wraps onto its own row rather than push the page sideways. */}
      <div className="spz-section-head">
        <h2 id="spz-map-title">Muscle map</h2>
        {asset && <div className="spz-segment" role="group" aria-label="View">
          {views.map((item) => <button key={item.id} type="button" aria-pressed={item.id === view} onClick={() => update({ view: item.id === views[0].id ? null : item.id })}>{item.label}</button>)}
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
          {/* One line however many targets the muscle has, so the drawing stays on a small phone's
              first screen: the target furthest behind, and how many more the sheet lists. */}
          {stripGoal && <p className="spz-strip-goal">{goalMetricShortLabels[stripGoal.goal.metric]}: {targetProgressText(stripGoal, selectedExposure)}{stripGoalsMore ? ` · ${plural(stripGoalsMore, "more target")}` : ""}</p>}
          <div className="spz-actions">
            {hasWork || !summary || selectedExposure?.mappingCoverage !== "reviewed"
              ? <button type="button" className="spz-primary" onClick={() => setSheet({ kind: "muscle" })}>Inspect coverage <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
              : <button type="button" className="spz-primary" onClick={addTargeted}>Add targeted exercise <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>}
            <button type="button" className="spz-link spz-link-box" onClick={() => select(null)}>Clear</button>
          </div>
        </> : <>
          <p className="spz-strip-line">{regionLine} Choose a muscle {asset ? "on the drawing or " : ""}in the list for its numbers.</p>
          {regionBoutsBehind > 0 && <div className="spz-actions">
            <button type="button" className="spz-link" onClick={() => setSheet({ kind: "bouts", list: "region" })}>See these sets <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
          </div>}
        </>}
      </div>
      {asset ? <>
        <SpecializationDiagram asset={asset} nodes={data.nodes} view={view} layer={layer} mirrored={mirrored} fillFor={fillFor} selectedNodeId={selected?.id ?? null} onSelect={tapDrawing} labelFor={(id) => data.nodes.find((node) => node.id === id)?.shortName ?? id} describeFor={describeFor} caption={[data.region.label, sideShort, `${(shownView?.label ?? view).toLowerCase()} view`, `${layerControlLabels[layer].toLowerCase()} layer`].filter(Boolean).join(", ")} />
        <MapLegend map={state.map} />
      </> : <p className="spz-note">The drawing is not ready yet. Every muscle is in the list below, with the same numbers.</p>}
    </section>

    {/* The counting rule sits under the drawing, so the drawing starts on a phone's first screen (brief §6: the illustration above the fold). */}
    <p className="spz-lede">Each set counts once per muscle{words.paired ? ` and once ${words.perSide}` : ""}, from your {state.mode === "planned" ? "plan as written" : "logged workouts"}. Holds stay in seconds and never become sets.</p>

    <section className="spz-card" aria-labelledby="spz-list-title">
      <div className="spz-section-head">
        <h2 id="spz-list-title">Muscles, most direct work first</h2>
      </div>
      <p className="spz-legend-line"><i className="spz-key spz-key-direct" />Direct <i className="spz-key spz-key-other" />Other dynamic <i className="spz-key spz-key-holds" />Holds <i className="spz-key spz-key-incidental" />Incidental {data.region.wording.incidentalWork} · bar full at {BAR_SCALE} bouts</p>
      {groups.map((group) => <div key={group.id} className="spz-group">
        {groups.length > 1 && <h3>{group.title}</h3>}
        <ul className="spz-rows">
          {sortForList(group.nodes, exposureOf).map((node) => <MuscleRow key={node.id} node={node} exposure={exposureOf(node.id)} incidentalWork={data.region.wording.incidentalWork} sides={words} waiting={summary ? null : waiting} selected={node.id === selected?.id} onOpen={() => { select(node.id); setSheet({ kind: "muscle" }); }} />)}
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
      </> : <p className="spz-note">Nothing to review: every set in this window has {words.paired ? `${words.aLimb}, ` : ""}a reviewed mapping and a muscle to count for.</p>}
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
              <button type="button" className="spz-link spz-link-box" onClick={() => setSheet({ kind: "bouts", list: "region", exerciseKey: exerciseKeyOf({ catalogExerciseId: item.catalogExerciseId, exerciseName: item.name }) })} aria-label={`The sets of ${item.name}`}>Sets</button>
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
          <ul className="spz-exercise-list">{notes.map((item) => <li key={item.id}><span><b>{item.label}</b><small>{item.note}</small></span><button type="button" className="spz-link spz-link-box" onClick={() => onOpenSession(item.id)} aria-label={`Open ${item.label}`}>Open</button></li>)}</ul>
        </div>}
      </details>

      <details className="spz-disclosure spz-card">
        <summary><span><b>Targets</b><small>{activeTargets ? `${activeTargets} active` : "None set"}</small></span><ChevronDown className="h-4 w-4" aria-hidden="true" /></summary>
        <TargetsOverview data={data} summary={summary} goals={regionGoals} side={side} timeZone={timeZone} todayKey={todayKey} onSave={saveGoals} onRestore={restoreGoals} onRemove={removeGoal} onOpenMuscle={(nodeId) => { select(nodeId); setSheet({ kind: "muscle" }); }} onOpenMovement={(actionId) => setSheet({ kind: "movement", actionId })} />
      </details>

      <details className="spz-disclosure spz-card" onToggle={(event) => { if (event.currentTarget.open) setProgressOpened(true); }}>
        <summary><span><b>Progress</b><small>{data.region.wording.progressSubtitle}</small></span><ChevronDown className="h-4 w-4" aria-hidden="true" /></summary>
        {/* Mounted when first opened, then kept: its weekly chart reads eight weeks of history. */}
        {progressOpened && <MeasurementsPanel key={data.region.id} data={data} side={side} catalog={catalog} weightUnit={weightUnit} timeZone={timeZone} todayKey={todayKey} measurements={measurements} onSave={saveMeasurement} onRemove={removeMeasurement} onOpenSession={openSession} onInspectExercise={inspect} onOpenMethod={openMethod} />}
      </details>

      <details ref={methodRef} className="spz-disclosure spz-card" id="spz-method">
        <summary><span><b>How this is counted</b><small>{rule.id} · {data.mappingVersion.key}</small></span><ChevronDown className="h-4 w-4" aria-hidden="true" /></summary>
        <div className="spz-method">
          {/* The published rule's own text (rules.ts), the same on every region and never edited once published. */}
          <div className="spz-rule-text" data-rule={rule.id}>
            <p>{rule.specification.bout} {rule.specification.dropSet}</p>
            <p>{rule.specification.perNodeBout} {rule.specification.sides}</p>
            <dl className="spz-categories">{(Object.keys(categoryLabels) as ExposureCategory[]).map((category) => <div key={category}><dt>{categoryLabels[category]}</dt><dd>{rule.specification.categories[category]}</dd></div>)}</dl>
            <p>{strapsSensitive ? `${rule.specification.straps} ` : ""}{rule.specification.holds}</p>
            <p>{rule.specification.unmapped} {rule.specification.regionTotal}</p>
            <p><b>Not counted:</b> {rule.specification.excludedFromCompleted.join(" ")}</p>
            <ul className="spz-caveats">{rule.specification.notConverted.map((line) => <li key={line}>{line}</li>)}</ul>
          </div>
          {completeness && <p><b>This window{sideShort ? `, ${sideShort}` : ""}:</b> {completeness.boutsConsidered} sets considered: {completeness.boutsWithReviewedMapping} with a reviewed mapping, {completeness.boutsPendingReview} under review, {completeness.boutsRegionOnly} {regionWord} only. {completeness.boutsNameMatched} matched by name{words.paired ? `, ${completeness.boutsUnknownSide} with ${words.noneRecorded}` : ""}. Left out: {completeness.boutsExcluded.notCompleted} not completed, {completeness.boutsExcluded.warmup} warm-ups.</p>}
          {/* Each count that has its set records opens them (brief §1); the rest say where they are, or that they are not kept as a list. */}
          {completeness && (regionOnlyRows.length > 0 || unknownSideRows.length > 0) && <div className="spz-actions">
            {regionOnlyRows.length > 0 && <button type="button" className="spz-link" onClick={() => setSheet({ kind: "bouts", list: "region-only" })}>See the {plural(regionOnlyRows.length, "set")} for the {regionWord} only <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>}
            {unknownSideRows.length > 0 && <button type="button" className="spz-link" onClick={() => setSheet({ kind: "bouts", list: "unknown-side" })}>See the {plural(unknownSideRows.length, "set")} with {words.noneRecorded} <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>}
          </div>}
          {completeness && words.paired && <CompletenessNote completeness={completeness} unknownSideListed={unknownSideRows.length} regionOnlyWithNoSide={regionOnlyRows.filter((row) => row.side === "unknown").length} regionWord={regionWord} sides={words} />}
          {/* What is not counted, said plainly (10-multi-region.md §8): sets whose exercise tags the region but which it does not count, each with its reason. */}
          {summary && listedUnmappedRows.length > 0 && <>
            <p>{listedUnmappedSentences(summary, data).join(" ")}</p>
            <div className="spz-actions"><button type="button" className="spz-link" onClick={() => setSheet({ kind: "bouts", list: "listed-unmapped" })}>See {listedUnmappedRows.length === 1 ? "this set" : "these sets"} and why <ArrowRight className="h-4 w-4" aria-hidden="true" /></button></div>
          </>}
          <p className="spz-note spz-method-notes">{data.mappingVersion.methodNotes}</p>
          <p className="spz-note">{REVIEW_STATEMENT}{asset ? ` ${DRAWING_STATEMENT}` : ""}</p>
        </div>
      </details>
    </div>

    {sheet?.kind === "muscle" && selected && <MuscleSheet
      data={data}
      node={selected}
      exposure={selectedExposure}
      loading={planLoading}
      side={side}
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
      onRestoreGoals={restoreGoals}
      onRemoveGoal={removeGoal}
      onChooseExercise={(exerciseId) => setSheet({ kind: "change", exerciseId, from: { kind: "muscle" } })}
      onInspectExercise={inspect}
      onOpenSession={openSession}
      onOpenMethod={openMethod}
      onOpenRegion={openRegion}
      onClose={() => setSheet(null)}
    />}
    {sheet?.kind === "movement" && <MovementSheet
      data={data}
      actionId={sheet.actionId}
      summary={summary}
      loading={planLoading}
      side={side}
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
      sideText={sideText}
      weightUnit={weightUnit}
      onOpenSession={openSession}
      onInspectExercise={inspect}
      onOpenMethod={openMethod}
      onClose={() => setSheet(null)}
    />}
    {sheet?.kind === "change" && changeNodeId && <PlanChangeSheet
      data={data}
      side={side}
      nodeId={changeNodeId}
      candidates={changeCandidates}
      initialExerciseId={sheet.exerciseId}
      catalog={catalog}
      plan={{ slots: plan.slots, weeks: plan.weeks, week: planWeek }}
      goal={goal}
      onApply={onApplyPlanChange}
      onClose={() => setSheet(null)}
    />}
  </>;
}

function MuscleRow({ node, exposure, incidentalWork, sides, waiting, selected, onOpen }: { node: AnatomyNode; exposure: NodeExposure | null; incidentalWork: string; sides: SideWords; waiting: string | null; selected: boolean; onOpen: () => void }) {
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
      parts!.incidental ? `${parts!.incidental} ${incidentalWork}` : "",
      parts!.rest ? `${parts!.rest} mixed` : "",
    ].filter(Boolean).join(" · ") || "No work";
  return <li>
    <button type="button" className="spz-row" aria-pressed={selected} data-unmapped={unmapped || undefined} onClick={onOpen} aria-label={`${node.name}, ${layerLabels[node.layer]}. ${waiting ?? exposureSentence(exposure, incidentalWork, sides)} Open details.`}>
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

/**
 * What the completeness counts cannot open, said plainly (brief §1): where those sets are
 * listed instead, or that they are not kept as a list. Nothing when every count opens. Only a
 * paired region keeps sets apart for want of a side.
 */
function CompletenessNote({ completeness, unknownSideListed, regionOnlyWithNoSide, regionWord, sides }: { completeness: SummaryCompleteness; unknownSideListed: number; regionOnlyWithNoSide: number; regionWord: string; sides: SideWords }) {
  const lines: string[] = [];
  if (completeness.boutsNameMatched > 0) lines.push("Sets matched by name are among those above, marked “matched by name” where they are listed.");
  if (completeness.boutsPendingReview > 0) lines.push("Sets under review are listed under Not counted in each muscle's sheet.");
  // The sets with no side recorded fall in three places: those that loaded a muscle of the region
  // are the unknown-side list; those tagged with the region and mapped to no muscle (which have a
  // side only when the set recorded one or the exercise is two-sided) are in the region-only list;
  // the rest count for no muscle of it.
  if (regionOnlyWithNoSide > 0) {
    const one = regionOnlyWithNoSide === 1;
    lines.push(`${plural(regionOnlyWithNoSide, "set")} with ${sides.noneRecorded} ${one ? "is" : "are"} among the sets for the ${regionWord} only, and ${one ? "opens" : "open"} there.`);
  }
  const elsewhere = completeness.boutsUnknownSide - unknownSideListed - regionOnlyWithNoSide;
  if (elsewhere > 0) {
    const one = elsewhere === 1;
    const other = unknownSideListed + regionOnlyWithNoSide > 0;
    lines.push(`${other ? "The other" : "The"} ${one ? "set" : `${elsewhere} sets`} with ${sides.noneRecorded} ${one ? "counts" : "count"} for no muscle of the ${regionWord}, so no list of ${one ? "it" : "them"} opens here.`);
  }
  if (completeness.boutsExcluded.notCompleted + completeness.boutsExcluded.warmup > 0) lines.push("Sets not completed and warm-ups are left out of every total and not kept as a list, so they cannot be opened.");
  return lines.length ? <p className="spz-note">{lines.join(" ")}</p> : null;
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
