import { plural } from "@/lib/plural";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Info } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { ConfirmDialog, type ConfirmDialogRequest } from "@/components/ConfirmDialog";
import { summarizeWithinAthleteStrengthComparisons, type ChangeState } from "@/lib/withinAthleteStrengthChange";
import { mergeStrengthHistory } from "@/lib/unifiedStrengthHistory";
import { deviceWorkoutHistoryEvent, isCompletedSet, isCompletedWorkout, loadDeviceWorkoutSessions, removeDeviceWorkoutSession, saveDeviceWorkoutSessions } from "@/lib/deviceWorkoutLog";
import { deviceStrengthObservationEvent, loadDeviceStrengthObservations } from "@/lib/deviceStrengthObservations";
import { loadSyncQueue, removeQueuedLiftsForSession, saveSyncQueue } from "@/lib/strengthSyncQueue";
import { workoutStrengthObservations } from "@/lib/workoutStrengthRecord";
import { bodyWeightLogEvent, currentBodyWeightKg, loadBodyWeightLog } from "@/lib/bodyWeightLog";
import { displayWeightToKilograms, type DisplayWeightUnit } from "@/lib/weightUnits";
import { liftsToPlace, percentileSexFor, summarizeProgressPercentiles, trendKey } from "@/lib/progressPercentiles";
import type { SexForReference } from "@/components/AthleteBaselineQuiz";

const changeStateCopy: Record<ChangeState, { label: string; tone: string }> = {
  insufficient_history: { label: "Not enough history yet", tone: "#9fb2c6" },
  stable: { label: "Stable", tone: "#9fb2c6" },
  directional_signal_emerging: { label: "Starting to move", tone: "#f2c14d" },
  meaningful_change_supported: { label: "Confirmed change", tone: "#4fae6c" },
};

type RecordedSessionCard = {
  id: string;
  title: string;
  completedAt: Date;
  completedSetCount: number;
  exerciseCount: number;
  storage: "device" | "account";
  /** A device record carries its exercises and sets; an account record carries counts only. */
  exercises?: { name: string; done: number; planned: number; skipped: boolean }[];
};

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
};

export function ProgressOverviewPanel({ onOpenStrength, onOpenTraining, sexForReference, baselineBodyWeight, weightUnit = "lb", birthYear, directAccess = true }: ProgressOverviewPanelProps) {
  // Account-only routes, asked only when an account is the source (B233; see TodayActionPanel).
  const sessions = trpc.workoutLog.list.useQuery(undefined, { enabled: !directAccess });
  const observations = trpc.strengthGenome.observations.useQuery(undefined, { enabled: !directAccess });
  const trackedSets = trpc.workoutLog.progressionHistory.useQuery(undefined, { enabled: !directAccess });
  const [deviceSessions, setDeviceSessions] = useState(() => loadDeviceWorkoutSessions());
  const [deviceObservations, setDeviceObservations] = useState(() => loadDeviceStrengthObservations());
  const [bodyWeightLog, setBodyWeightLog] = useState(() => loadBodyWeightLog());
  const [showComparisonDetails, setShowComparisonDetails] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<ConfirmDialogRequest | null>(null);

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
      exerciseCount: session.exercises.length,
      storage: "device" as const,
      exercises: session.exercises.map((exercise) => ({ name: exercise.exerciseName, done: exercise.sets.filter(isCompletedSet).length, planned: exercise.sets.length, skipped: exercise.sets.length > 0 && exercise.sets.every((set) => set.skipped) })),
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
   * A finished workout on this device can be taken back, like a typed lift. The list is read
   * fresh from storage rather than from this component's copy, as the tracker does; the save
   * announces itself, so this list, Home and the Strength Genome all refresh from it. An
   * account record has no removal route, so it offers none.
   */
  const requestSessionRemoval = (session: RecordedSessionCard) =>
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
        if (written) toast.success("Workout removed from this device.");
        else toast.error("This workout could not be removed", { description: "The device refused the save, so nothing changed." });
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
  return <section className="progress-review">
    <header className="progress-review-head">
      <div><h1>Progress</h1><p>Every workout you finished and every lift you logged.</p></div>
    </header>
    <div className="progress-facts" role="group" aria-label={`${plural(recordedSessions.length, "workout")} recorded, ${plural(loggedObservations.length, "lift")} logged`}>
      <div><b className="stat-figure">{recordedSessions.length}</b><strong>Workouts recorded</strong><small>{latestSession ? `Latest: ${latestSession.title}` : "No recorded session yet."}{deviceRecordCount > 0 ? ` · ${deviceRecordCount} on this device` : ""}</small></div>
      <button type="button" onClick={onOpenStrength}><b className="stat-figure">{loggedObservations.length}</b><strong>Lifts logged</strong><small>{latestObservation ? `Latest: ${latestObservation.exerciseName}` : "No lifts logged yet."}{placements.best && <> · Strongest placement: {placements.best.headline} · {placements.best.exerciseName}.</>}</small></button>
    </div>

    <section className="progress-records" aria-label="Recorded workouts">
      <div className="progress-section-head"><div><p className="metric-label">Recorded workouts</p><h2>Your completed sessions.</h2></div><span>{recordedSessions.length} total</span></div>
      {recordedSessions.length ? <ol className="progress-session-rows">{recordedSessions.slice(0, 8).map((session) => {
        /* The date and the counts come from the record, never from today's
           plan. A device record carries its sets, so the row opens on them; a
           record that logged nothing says so rather than being dressed up or
           dropped. An account record carries its counts only. */
        const facts = <><small>{session.completedAt.toLocaleDateString()} · {session.exerciseCount} {session.exerciseCount === 1 ? "exercise" : "exercises"} · {session.completedSetCount === 0 ? "no sets logged" : `${session.completedSetCount} ${session.completedSetCount === 1 ? "set" : "sets"}`}</small><span>{session.storage === "device" ? "Device" : "Account"}</span></>;
        return <li key={session.id}>{session.exercises ? <details className="progress-session-card"><summary><p>{session.title}</p>{facts}</summary><ul className="progress-session-sets">{session.exercises.map((exercise) => <li key={exercise.name}><span>{exercise.name}</span><b>{exercise.done} of {plural(exercise.planned, "set")}</b>{exercise.skipped ? <i>skipped</i> : null}</li>)}</ul><button type="button" className="progress-text-action" onClick={() => requestSessionRemoval(session)} aria-label={`Remove this workout: ${session.title}, ${session.completedAt.toLocaleDateString()}`}>Remove this workout</button></details> : <div className="progress-session-card"><p>{session.title}</p>{facts}</div>}</li>;
      })}</ol> : <p className="progress-empty-copy">Complete a Session workout to create your first record.</p>}
      <button type="button" onClick={onOpenTraining} className="progress-text-action">Open your plan <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button>
    </section>

    <section className="progress-comparison-card" aria-label="Strength progress">
      <div className="progress-section-head"><div><p className="metric-label">Strength progress</p><h2>{comparableStrengthChanges.length ? "Estimated change since your first log" : "No comparable history yet."}</h2></div></div>
      {comparableStrengthChanges.length > 0
        ? <ol className="progress-trend-rows">{comparableStrengthChanges.slice(0, 4).map((change) => { const placement = placements.cards.get(trendKey(change)); return <li key={trendKey(change)} className="progress-session-card"><p>{change.exerciseName}</p><strong style={{ color: changeStateCopy[change.changeState].tone }}>{change.observationCount < 2 ? "Baseline" : `${change.relativeChangePercent >= 0 ? "+" : ""}${change.relativeChangePercent.toFixed(0)}% est. 1RM`}</strong><small>{changeStateCopy[change.changeState].label} · {change.observationCount} {change.observationCount === 1 ? "log" : "logs"}</small>{placement && <em className="progress-percentile"><b>{placement.headline}</b> {placement.detail}{placement.bodyMassSource === "profile" ? " Read against your profile weight." : ""}</em>}</li>; })}</ol>
        : <p className="progress-empty-copy">{loggedObservations.length ? "Log the same lift again and its change starts tracking here." : "Log a lift in the Strength Genome to start a trend."}</p>}
      {placements.gap && <p className="progress-percentile-gap">{placements.gap}</p>}
      {/* A request that failed says so and can be tried again. Only while nothing was ever placed:
         a later refetch that fails keeps the placements already shown, and they still stand. */}
      {percentiles.isError && !percentiles.data && liftsForPercentile.length > 0 && <p className="progress-percentile-gap" role="status">Where these lifts sit against community curves could not be read just now. Your change tracking above does not need it. <button type="button" className="progress-text-action" disabled={percentiles.isFetching} onClick={() => void percentiles.refetch()}>{percentiles.isFetching ? "Trying again…" : "Try again"}</button></p>}
      {excludedStrengthSets.length > 0 && <p className="progress-excluded">{plural(excludedSetCount, "logged set")} outside the validated rep range for estimation {excludedSetCount === 1 ? "is" : "are"} recorded but not used for this trend.</p>}
      <button type="button" onClick={onOpenStrength} className="progress-text-action">Open Strength Genome <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button>
      <details className="progress-method"><summary onClick={() => setShowComparisonDetails((current) => !current)} aria-expanded={showComparisonDetails}><Info className="h-5 w-5" aria-hidden="true" /><span>How it works</span></summary><div className="progress-method-note">This pulls together your logged lifts and your completed sets, converting different rep counts to a comparable estimated one-rep max (est. 1RM, Epley formula). Stable means the change is small enough that it could just be day-to-day variation; a confirmed change is big enough to be real. The change tracks you against your own past only — never against anyone else. Where a lift sits is a separate reading: your latest log of it placed on sex- and bodyweight-matched community curves, the same placement the Strength Genome shows for that lift.</div></details>
    </section>
    {pendingRemoval && <ConfirmDialog {...pendingRemoval} onCancel={() => setPendingRemoval(null)} />}
  </section>;
}
