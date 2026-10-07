import { plural } from "@/lib/plural";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, ChevronRight, Info } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { ConfirmDialog, type ConfirmDialogRequest } from "@/components/ConfirmDialog";
import { summarizeWithinAthleteStrengthComparisons } from "@/lib/withinAthleteStrengthChange";
import { changeStateLabel, changeTone } from "@/lib/changeStateCopy";
import { mergeStrengthHistory } from "@/lib/unifiedStrengthHistory";
import { deviceWorkoutHistoryEvent, isCompletedSet, isCompletedWorkout, loadDeviceWorkoutSessions, removeDeviceWorkoutSession, saveDeviceWorkoutSessions, type DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { WorkoutSessionDetail } from "@/components/WorkoutSessionDetail";
import { exercises as exerciseCatalog } from "@/lib/exerciseCatalog";
import { deviceStrengthObservationEvent, loadDeviceStrengthObservations } from "@/lib/deviceStrengthObservations";
import { loadSyncQueue, removeQueuedLiftsForSession, saveSyncQueue } from "@/lib/strengthSyncQueue";
import { workoutStrengthObservations } from "@/lib/workoutStrengthRecord";
import { bodyWeightLogEvent, currentBodyWeightKg, loadBodyWeightLog } from "@/lib/bodyWeightLog";
import { displayWeightToKilograms, type DisplayWeightUnit } from "@/lib/weightUnits";
import { liftsToPlace, percentileSexFor, summarizeProgressPercentiles, trendKey } from "@/lib/progressPercentiles";
import type { SexForReference } from "@/components/AthleteBaselineQuiz";
import "../progress-history.css";

type RecordedSessionCard = {
  id: string;
  title: string;
  completedAt: Date;
  completedSetCount: number;
  exerciseCount: number;
  storage: "device" | "account";
  /** The exercises a device record holds, by identity (catalog ID, else the recorded name); an account record carries counts only. */
  exerciseKeys?: string[];
  note?: string;
};

/** A history page: enough rows to scan a month or two, then "Show more" until the real end. */
export const HISTORY_PAGE_SIZE = 10;
const historyRanges = [
  { value: "all", label: "Any time", days: null },
  { value: "30", label: "Last 30 days", days: 30 },
  { value: "90", label: "Last 90 days", days: 90 },
  { value: "365", label: "Last 12 months", days: 365 },
] as const;
type HistoryRange = (typeof historyRanges)[number]["value"];

/**
 * One exercise's identity in history (H11): its catalog ID when the record carries one, so two
 * variants that read alike stay apart; the recorded name only for records older than catalog IDs.
 */
export function historyExerciseKey(exercise: { catalogId?: number; exerciseName: string }): string {
  if (exercise.catalogId !== undefined) return `id:${exercise.catalogId}`;
  const match = exerciseCatalog.find((item) => item.name === exercise.exerciseName);
  return match ? `id:${match.id}` : `name:${exercise.exerciseName}`;
}

type ProgressOverviewPanelProps = {
  onOpenStrength: () => void;
  onOpenTraining: () => void;
  /** What the athlete answered, unmapped; the curves split on male/female and anything else is not placed. */
  sexForReference?: SexForReference;
  /** The profile weight, in the athlete's unit, read against a lift that carries no weight of its own. */
  baselineBodyWeight?: number;
  weightUnit?: DisplayWeightUnit;
  /** From About Me. Each lift is placed at the age it was lifted at, whenever the year was given. */
  birthYear?: number;
  /**
   * True while the app runs on the device stores alone. Decides whose typed lifts and
   * sessions count, exactly as Home and Strength decide it (B155, B265).
   */
  directAccess?: boolean;
  /**
   * The finished workout open in Progress (its ID travels in the address, so a reload or a shared
   * link opens the same one). Without these the panel keeps the choice itself.
   */
  sessionId?: string | null;
  onOpenSession?: (id: string) => void;
  onCloseSession?: () => void;
  /** Repeat a finished workout into the plan, through the page's Save to plan dialog (H10). */
  onRepeatSession?: (session: DeviceWorkoutSession) => void;
};

export function ProgressOverviewPanel({ onOpenStrength, onOpenTraining, sexForReference, baselineBodyWeight, weightUnit = "lb", birthYear, directAccess = true, sessionId, onOpenSession, onCloseSession, onRepeatSession }: ProgressOverviewPanelProps) {
  // Account-only routes, asked only when an account is the source (B233; see TodayActionPanel).
  const sessions = trpc.workoutLog.list.useQuery(undefined, { enabled: !directAccess });
  const observations = trpc.strengthGenome.observations.useQuery(undefined, { enabled: !directAccess });
  const trackedSets = trpc.workoutLog.progressionHistory.useQuery(undefined, { enabled: !directAccess });
  const [deviceSessions, setDeviceSessions] = useState(() => loadDeviceWorkoutSessions());
  const [deviceObservations, setDeviceObservations] = useState(() => loadDeviceStrengthObservations());
  const [bodyWeightLog, setBodyWeightLog] = useState(() => loadBodyWeightLog());
  const [showComparisonDetails, setShowComparisonDetails] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<ConfirmDialogRequest | null>(null);
  const [localSession, setLocalSession] = useState<string | null>(null);
  const [exerciseFilter, setExerciseFilter] = useState("");
  const [rangeFilter, setRangeFilter] = useState<HistoryRange>("all");
  const [visibleCount, setVisibleCount] = useState(HISTORY_PAGE_SIZE);
  const returnTo = useRef<string | null>(null);
  const focusListNext = useRef(false);
  const listHeadingRef = useRef<HTMLHeadingElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const controlled = onOpenSession !== undefined;
  const openSessionId = controlled ? sessionId ?? null : localSession;
  const openSession = (id: string) => { returnTo.current = id; if (controlled) onOpenSession(id); else setLocalSession(id); };
  const closeSession = () => { if (controlled) onCloseSession?.(); else setLocalSession(null); };

  useEffect(() => {
    const refreshDeviceSessions = () => setDeviceSessions(loadDeviceWorkoutSessions());
    window.addEventListener(deviceWorkoutHistoryEvent, refreshDeviceSessions);
    return () => window.removeEventListener(deviceWorkoutHistoryEvent, refreshDeviceSessions);
  }, []);
  useEffect(() => {
    const refresh = () => setDeviceObservations(loadDeviceStrengthObservations());
    window.addEventListener(deviceStrengthObservationEvent, refresh);
    return () => window.removeEventListener(deviceStrengthObservationEvent, refresh);
  }, []);
  useEffect(() => {
    const refresh = () => setBodyWeightLog(loadBodyWeightLog());
    window.addEventListener(bodyWeightLogEvent, refresh);
    return () => window.removeEventListener(bodyWeightLogEvent, refresh);
  }, []);

  const recordedSessions = useMemo<RecordedSessionCard[]>(() => {
    // The shared definitions: a workout is a finish with at least one completed set, and a
    // set counts when it was marked done and not skipped - the same count Home shows.
    const deviceRecords = deviceSessions.filter(isCompletedWorkout).map((session) => ({
      id: session.id,
      title: session.title,
      completedAt: new Date(session.completedAt || session.startedAt),
      completedSetCount: session.exercises.reduce((total, exercise) => total + exercise.sets.filter(isCompletedSet).length, 0),
      exerciseCount: session.exercises.filter((exercise) => exercise.sets.some(isCompletedSet)).length,
      storage: "device" as const,
      exerciseKeys: session.exercises.filter((exercise) => exercise.sets.some(isCompletedSet)).map(historyExerciseKey),
      note: session.note,
    }));
    const accountRecords = (directAccess ? [] : (sessions.data || [])).filter((session) => session.status === "completed").map((session) => ({
      id: `account-${session.id}`,
      title: session.title,
      completedAt: new Date(session.completedAt || session.startedAt),
      completedSetCount: session.completedSetCount,
      exerciseCount: session.exerciseCount,
      storage: "account" as const,
    }));
    return [...deviceRecords, ...accountRecords].sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
  }, [deviceSessions, sessions.data, directAccess]);

  const latestSession = recordedSessions[0];
  // The record Home and Strength read (athleteRecord.recordedLifts): the typed lifts of
  // whichever store is the source - this device's, or the account's - plus the lifts carried
  // across from finished workouts. Progress used to add both stores together, so its count
  // could differ from Home's for the same athlete.
  const workoutObservations = useMemo(() => workoutStrengthObservations(deviceSessions, weightUnit, bodyWeightLog), [deviceSessions, weightUnit, bodyWeightLog]);
  const loggedObservations = useMemo(
    () => [...(directAccess ? deviceObservations : (observations.data || [])), ...workoutObservations]
      .sort((a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime()),
    [observations.data, deviceObservations, workoutObservations, directAccess],
  );
  const latestObservation = loggedObservations[0];
  const unifiedHistory = useMemo(
    () => mergeStrengthHistory(loggedObservations.map((observation) => ({ ...observation, loadKg: observation.loadKg ?? null, repetitions: observation.repetitions ?? null })), trackedSets.data || []),
    [loggedObservations, trackedSets.data]
  );
  const strengthComparisonSummary = useMemo(() => summarizeWithinAthleteStrengthComparisons(unifiedHistory), [unifiedHistory]);
  const comparableStrengthChanges = strengthComparisonSummary.comparable;
  const excludedStrengthSets = strengthComparisonSummary.excluded;
  const excludedSetCount = excludedStrengthSets.reduce((total, item) => total + item.observationCount, 0);
  const deviceRecordCount = recordedSessions.filter((session) => session.storage === "device").length;

  /**
   * History (Oct 7 brief §6). Every finished workout is reachable: the list shows a page at a time
   * and says when it has reached the end. Filters narrow it by exercise (by identity, not name) and
   * by date; they reset only when the athlete asks. Account records carry counts only, so an
   * exercise filter can only match this device's workouts, and the list says so.
   */
  const exerciseOptions = useMemo(() => {
    const names = new Map<string, string>();
    for (const session of deviceSessions.filter(isCompletedWorkout)) {
      for (const exercise of session.exercises) {
        if (!exercise.sets.some(isCompletedSet)) continue;
        const key = historyExerciseKey(exercise);
        if (!names.has(key)) names.set(key, exercise.exerciseName);
      }
    }
    return Array.from(names, ([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [deviceSessions]);
  const range = historyRanges.find((option) => option.value === rangeFilter) ?? historyRanges[0];
  const filtersActive = exerciseFilter !== "" || range.days !== null;
  const filteredSessions = useMemo(() => {
    const since = range.days === null ? null : Date.now() - range.days * 24 * 60 * 60 * 1000;
    return recordedSessions.filter((session) =>
      (since === null || session.completedAt.getTime() >= since)
      && (exerciseFilter === "" || (session.exerciseKeys?.includes(exerciseFilter) ?? false)));
  }, [recordedSessions, exerciseFilter, range.days]);
  const shownSessions = filteredSessions.slice(0, visibleCount);
  const monthGroups = useMemo(() => {
    const groups: { key: string; label: string; sessions: RecordedSessionCard[] }[] = [];
    for (const session of shownSessions) {
      const key = `${session.completedAt.getFullYear()}-${session.completedAt.getMonth()}`;
      const last = groups[groups.length - 1];
      if (last?.key === key) last.sessions.push(session);
      else groups.push({ key, label: session.completedAt.toLocaleDateString(undefined, { month: "long", year: "numeric" }), sessions: [session] });
    }
    return groups;
  }, [shownSessions]);
  const clearFilters = () => { setExerciseFilter(""); setRangeFilter("all"); setVisibleCount(HISTORY_PAGE_SIZE); };
  // An exercise that left the record (its workouts removed) is no longer a filter that can match.
  useEffect(() => { if (exerciseFilter && !exerciseOptions.some((option) => option.value === exerciseFilter)) setExerciseFilter(""); }, [exerciseFilter, exerciseOptions]);
  // Back from a workout lands on the row it was opened from, in the same filtered, paged list.
  useEffect(() => {
    if (openSessionId !== null) return;
    // A workout removed from its detail: the list it belonged to takes focus, not the page top.
    if (focusListNext.current) { focusListNext.current = false; listHeadingRef.current?.focus({ preventScroll: true }); return; }
    if (!returnTo.current) return;
    const row = listRef.current?.querySelector<HTMLElement>(`[data-session-row="${CSS.escape(returnTo.current)}"]`);
    returnTo.current = null;
    if (row) { row.scrollIntoView?.({ block: "center" }); row.focus({ preventScroll: true }); }
  }, [openSessionId]);

  /**
   * A finished workout on this device can be taken back, like a typed lift. The list is read
   * fresh from storage rather than from this component's copy, as the tracker does; the save
   * announces itself, so this list, Home and the Strength Genome all refresh from it. An
   * account record has no removal route, so it offers none.
   */
  const requestSessionRemoval = (session: { id: string; title: string; completedAt: Date }) =>
    setPendingRemoval({
      title: "Remove this workout?",
      body: `${session.title} from ${session.completedAt.toLocaleDateString()} is deleted from this device. It stops counting in your workouts, your strength trends and your muscle ranks. This cannot be undone.`,
      confirmLabel: "Remove workout",
      onConfirm: () => {
        setPendingRemoval(null);
        const sessions = loadDeviceWorkoutSessions();
        const removed = sessions.find((entry) => entry.id === session.id && entry.status === "completed");
        // Its lifts not yet sent leave the account outbox first: the save below wakes the
        // sync, which would otherwise read them from the queue and send them. If the save
        // is refused, the workout stays and its lifts are queued again on the next sync.
        if (removed) saveSyncQueue(removeQueuedLiftsForSession(loadSyncQueue(), removed));
        const written = saveDeviceWorkoutSessions(removeDeviceWorkoutSession(sessions, session.id));
        if (!written) { toast.error("This workout could not be removed", { description: "The device refused the save, so nothing changed." }); return; }
        toast.success("Workout removed from this device.");
        // The detail it was removed from closes with it; the list it came from is where focus returns.
        returnTo.current = null;
        focusListNext.current = true;
        if (openSessionId === session.id) closeSession();
      },
    });

  /**
   * Where each lift sits, against sex- and bodyweight-matched community curves.
   *
   * The same route, request and copy as the Strength Genome's record sheet, so a lift
   * has one placement wherever it is read. The trend's latest log is what gets placed;
   * its own recorded weight is read against when it has one, the profile's otherwise,
   * and the card says which.
   */
  const percentileSex = percentileSexFor(sexForReference);
  const fallbackBodyMassKg = currentBodyWeightKg(bodyWeightLog)
    ?? (baselineBodyWeight && baselineBodyWeight > 0 ? displayWeightToKilograms(baselineBodyWeight, weightUnit) : null);
  // Account rows carry the weight as a decimal string, device rows as a number; one reading.
  const bodyMassKgById = useMemo(
    () => new Map(loggedObservations.flatMap((observation) => { const mass = Number(observation.bodyMassKgAtTest); return Number.isFinite(mass) && mass > 0 ? [[String(observation.id), mass] as const] : []; })),
    [loggedObservations],
  );
  const liftsForPercentile = useMemo(
    () => liftsToPlace(comparableStrengthChanges.slice(0, 4), unifiedHistory, bodyMassKgById, { sex: percentileSex, fallbackBodyMassKg, birthYear }),
    [comparableStrengthChanges, unifiedHistory, bodyMassKgById, percentileSex, fallbackBodyMassKg, birthYear],
  );
  const percentiles = trpc.strengthPercentile.forLifts.useQuery(
    { lifts: liftsForPercentile.map((lift) => lift.request) },
    { enabled: liftsForPercentile.length > 0, staleTime: 5 * 60 * 1000, retry: false },
  );
  const placements = useMemo(
    () => summarizeProgressPercentiles(liftsForPercentile, percentiles.data, percentileSex),
    [liftsForPercentile, percentiles.data, percentileSex],
  );

  /**
   * Handoff 10. One column: the record's counts as quiet facts, the sessions
   * as open rows that open the record they stand for, the strength trend as
   * rows with the method behind a line. The four bordered panels and the
   * grid of bordered cards inside them are gone. Nothing here is planned
   * work: every number is something the athlete finished or logged.
   */
  if (openSessionId) {
    return <section className="progress-review">
      <WorkoutSessionDetail
        key={openSessionId}
        sessionId={openSessionId}
        weightUnit={weightUnit}
        variant="history"
        onBack={closeSession}
        onRepeat={onRepeatSession}
        onRemove={(session) => requestSessionRemoval({ id: session.id, title: session.title, completedAt: new Date(session.completedAt || session.startedAt) })}
      />
      {pendingRemoval && <ConfirmDialog {...pendingRemoval} onCancel={() => setPendingRemoval(null)} />}
    </section>;
  }

  return <section className="progress-review">
    <header className="progress-review-head">
      <div><h1>Progress</h1><p>Every workout you finished and every lift you logged.</p></div>
    </header>
    <div className="progress-facts" role="group" aria-label={`${plural(recordedSessions.length, "workout")} recorded, ${plural(loggedObservations.length, "lift")} logged`}>
      <div><b className="stat-figure">{recordedSessions.length}</b><strong>Workouts recorded</strong><small>{latestSession ? `Latest: ${latestSession.title}` : "No recorded session yet."}{deviceRecordCount > 0 ? ` · ${deviceRecordCount} on this device` : ""}</small></div>
      <button type="button" onClick={onOpenStrength}><b className="stat-figure">{loggedObservations.length}</b><strong>Lifts logged</strong><small>{latestObservation ? `Latest: ${latestObservation.exerciseName}` : "No lifts logged yet."}{placements.best && <> · Strongest placement: {placements.best.headline} · {placements.best.exerciseName}.</>}</small></button>
    </div>

    <section className="progress-records" aria-label="Recorded workouts">
      <div className="progress-section-head"><div><p className="metric-label">Recorded workouts</p><h2 ref={listHeadingRef} tabIndex={-1}>Your completed sessions.</h2></div><span>{filtersActive ? `${filteredSessions.length} of ${recordedSessions.length}` : `${recordedSessions.length} total`}</span></div>
      {recordedSessions.length > 0 && <div className="progress-history-toolbar" role="group" aria-label="Filter workouts">
        <label><span>Exercise</span><select value={exerciseFilter} onChange={(event) => { setExerciseFilter(event.target.value); setVisibleCount(HISTORY_PAGE_SIZE); }}>
          <option value="">All exercises</option>
          {exerciseOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select></label>
        <label><span>When</span><select value={rangeFilter} onChange={(event) => { setRangeFilter(event.target.value as HistoryRange); setVisibleCount(HISTORY_PAGE_SIZE); }}>
          {historyRanges.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select></label>
        {filtersActive && <button type="button" onClick={clearFilters}>Clear filters</button>}
      </div>}
      {sessions.isError && !directAccess && <p className="progress-history-error" role="status">Your account's workouts could not be loaded just now{recordedSessions.length ? "; the ones below are from this device" : ""}. <button type="button" className="progress-text-action" disabled={sessions.isFetching} onClick={() => void sessions.refetch()}>{sessions.isFetching ? "Trying again…" : "Try again"}</button></p>}
      <div ref={listRef}>
        {recordedSessions.length === 0
          ? <p className="progress-empty-copy">Complete a Session workout to create your first record.</p>
          : filteredSessions.length === 0
            ? <div className="progress-history-nomatch" role="status"><p>No workouts match {exerciseFilter ? `${exerciseOptions.find((option) => option.value === exerciseFilter)?.label ?? "this exercise"}${range.days !== null ? ` in the ${range.label.toLowerCase()}` : ""}` : `the ${range.label.toLowerCase()}`}.</p><button type="button" onClick={clearFilters}>Clear filters</button></div>
            : monthGroups.map((group) => <section key={group.key} className="progress-history-month" aria-label={group.label}>
              <h3>{group.label}</h3>
              <ol className="progress-session-rows">{group.sessions.map((session) => {
                /* The date and the counts come from the record, never from today's plan. A device
                   record opens its full detail; an account record carries its counts only. */
                const facts = <small>{session.completedAt.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })} · {plural(session.exerciseCount, "exercise")} · {session.completedSetCount === 0 ? "no sets logged" : plural(session.completedSetCount, "set")}{session.storage === "account" ? " · Account" : ""}</small>;
                return <li key={session.id}>{session.storage === "device"
                  ? <button type="button" className="progress-session-card progress-session-open" data-session-row={session.id} onClick={() => openSession(session.id)} aria-label={`View session: ${session.title}, ${session.completedAt.toLocaleDateString()}`}>
                    <p>{session.title}</p>{facts}{session.note ? <em className="progress-session-note">{session.note}</em> : null}<ChevronRight aria-hidden="true" />
                  </button>
                  : <div className="progress-session-card"><p>{session.title}</p>{facts}</div>}</li>;
              })}</ol>
            </section>)}
        {filteredSessions.length > shownSessions.length
          ? <button type="button" className="progress-history-more" onClick={() => setVisibleCount((count) => count + HISTORY_PAGE_SIZE)}>Show {Math.min(HISTORY_PAGE_SIZE, filteredSessions.length - shownSessions.length)} more <span>({shownSessions.length} of {filteredSessions.length} shown)</span></button>
          : filteredSessions.length > HISTORY_PAGE_SIZE && <p className="progress-history-end">That's every workout{filtersActive ? " that matches" : ""}: {filteredSessions.length}.</p>}
        {exerciseFilter && recordedSessions.some((session) => session.storage === "account") && <p className="progress-history-end">Account workouts list counts only, so the exercise filter covers this device's workouts.</p>}
      </div>
      <button type="button" onClick={onOpenTraining} className="progress-text-action">Open your plan <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button>
    </section>

    <section className="progress-comparison-card" aria-label="Strength progress">
      <div className="progress-section-head"><div><p className="metric-label">Strength progress</p><h2>{comparableStrengthChanges.length ? "Estimated change since your first log" : "No comparable history yet."}</h2></div></div>
      {comparableStrengthChanges.length > 0
        ? <ol className="progress-trend-rows">{comparableStrengthChanges.slice(0, 4).map((change) => { const placement = placements.cards.get(trendKey(change)); return <li key={trendKey(change)} className="progress-session-card"><p>{change.exerciseName}</p><strong style={{ color: changeTone(change) }}>{change.observationCount < 2 ? "Baseline" : `${change.relativeChangePercent >= 0 ? "+" : ""}${change.relativeChangePercent.toFixed(0)}% est. 1RM`}</strong><small>{changeStateLabel[change.changeState]} · {change.observationCount} {change.observationCount === 1 ? "log" : "logs"}</small>{placement && <em className="progress-percentile"><b>{placement.headline}</b> {placement.detail}{placement.bodyMassSource === "profile" ? " Read against your profile weight." : ""}</em>}</li>; })}</ol>
        : <p className="progress-empty-copy">{loggedObservations.length ? "Log the same lift again and its change starts tracking here." : "Log a lift in the Strength Genome to start a trend."}</p>}
      {placements.gap && <p className="progress-percentile-gap">{placements.gap}</p>}
      {/* A request that failed says so and can be tried again. Only while nothing was ever placed:
         a later refetch that fails keeps the placements already shown, and they still stand. */}
      {percentiles.isError && !percentiles.data && liftsForPercentile.length > 0 && <p className="progress-percentile-gap" role="status">Where these lifts sit against community curves could not be read just now. Your change tracking above does not need it. <button type="button" className="progress-text-action" disabled={percentiles.isFetching} onClick={() => void percentiles.refetch()}>{percentiles.isFetching ? "Trying again…" : "Try again"}</button></p>}
      {excludedStrengthSets.length > 0 && <p className="progress-excluded">{plural(excludedSetCount, "logged set")} outside the validated rep range for estimation {excludedSetCount === 1 ? "is" : "are"} recorded but not used for this trend.</p>}
      <button type="button" onClick={onOpenStrength} className="progress-text-action">Open Strength Genome <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button>
      <details className="progress-method"><summary onClick={() => setShowComparisonDetails((current) => !current)} aria-expanded={showComparisonDetails}><Info className="h-5 w-5" aria-hidden="true" /><span>How it works</span></summary><div className="progress-method-note">This pulls together your logged lifts and your completed sets, converting different rep counts to a comparable estimated one-rep max (est. 1RM: Brzycki below 8 reps, Epley above 10, a blend between). The change compares your first and latest logs of each lift. Under 6% is within normal variation for the estimate, 6–15% is an early change and 15% or more is a larger change: the size of the change in your estimate, not proof of it. The change tracks you against your own past only — never against anyone else. Where a lift sits is a separate reading: your latest log of it placed on sex- and bodyweight-matched community curves, the same placement the Strength Genome shows for that lift.</div></details>
    </section>
    {pendingRemoval && <ConfirmDialog {...pendingRemoval} onCancel={() => setPendingRemoval(null)} />}
  </section>;
}
