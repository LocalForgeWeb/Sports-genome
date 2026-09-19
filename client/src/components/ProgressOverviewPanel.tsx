import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowUpRight, CalendarDays, Dumbbell, Info, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { summarizeWithinAthleteStrengthComparisons, type ChangeState } from "@/lib/withinAthleteStrengthChange";
import { mergeStrengthHistory } from "@/lib/unifiedStrengthHistory";
import { deviceWorkoutHistoryEvent, loadDeviceWorkoutSessions } from "@/lib/deviceWorkoutLog";
import { deviceStrengthObservationEvent, loadDeviceStrengthObservations } from "@/lib/deviceStrengthObservations";
import { workoutStrengthObservations } from "@/lib/workoutStrengthRecord";

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
};

export function ProgressOverviewPanel({ onOpenStrength, onOpenTraining }: { onOpenStrength: () => void; onOpenTraining: () => void }) {
  const sessions = trpc.workoutLog.list.useQuery();
  const observations = trpc.strengthGenome.observations.useQuery();
  const trackedSets = trpc.workoutLog.progressionHistory.useQuery();
  const [deviceSessions, setDeviceSessions] = useState(() => loadDeviceWorkoutSessions());
  const [deviceObservations, setDeviceObservations] = useState(() => loadDeviceStrengthObservations());
  const [showComparisonDetails, setShowComparisonDetails] = useState(false);

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

  const recordedSessions = useMemo<RecordedSessionCard[]>(() => {
    const deviceRecords = deviceSessions.filter((session) => session.status === "completed").map((session) => ({
      id: session.id,
      title: session.title,
      completedAt: new Date(session.completedAt || session.startedAt),
      completedSetCount: session.exercises.reduce((total, exercise) => total + exercise.sets.filter((set) => set.completed).length, 0),
      exerciseCount: session.exercises.length,
      storage: "device" as const,
    }));
    const accountRecords = (sessions.data || []).filter((session) => session.status === "completed").map((session) => ({
      id: `account-${session.id}`,
      title: session.title,
      completedAt: new Date(session.completedAt || session.startedAt),
      completedSetCount: session.completedSetCount,
      exerciseCount: session.exerciseCount,
      storage: "account" as const,
    }));
    return [...deviceRecords, ...accountRecords].sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
  }, [deviceSessions, sessions.data]);

  const latestSession = recordedSessions[0];
  // "Lifts logged" counted server observations only, so an athlete training on
  // this device saw completed sessions above a count of zero. The record is
  // whatever is on this device plus whatever is on the account — the same
  // observations the Strength Genome reads.
  const workoutObservations = useMemo(() => workoutStrengthObservations(deviceSessions), [deviceSessions]);
  const loggedObservations = useMemo(
    () => [...(observations.data || []), ...deviceObservations, ...workoutObservations]
      .sort((a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime()),
    [observations.data, deviceObservations, workoutObservations],
  );
  const latestObservation = loggedObservations[0];
  const unifiedHistory = useMemo(
    () => mergeStrengthHistory(loggedObservations.map((observation) => ({ ...observation, loadKg: observation.loadKg ?? null, repetitions: observation.repetitions ?? null })), trackedSets.data || []),
    [loggedObservations, trackedSets.data]
  );
  const strengthComparisonSummary = summarizeWithinAthleteStrengthComparisons(unifiedHistory);
  const comparableStrengthChanges = strengthComparisonSummary.comparable;
  const excludedStrengthSets = strengthComparisonSummary.excluded;
  const deviceRecordCount = recordedSessions.filter((session) => session.storage === "device").length;

  return <section className="progress-review space-y-4">
    <header className="progress-review-head">
      <div><p className="metric-label !text-[#9fc4eb]">Your training record</p><h1 className="mt-2 font-display text-5xl font-bold uppercase leading-[.82] text-white">Progress from<br /><em className="text-[var(--sg-info)]">real work.</em></h1><p className="mt-3 text-sm leading-5 text-[var(--sg-text-muted-on-dark)]">Every session you finished and every lift you logged.</p></div>
      <Activity className="h-6 w-6 text-[var(--sg-text-subtle-on-dark)]" aria-hidden="true" />
    </header>
    <div className="grid gap-3 md:grid-cols-2">
      <section className="dark-panel progress-stat-card"><div><p className="metric-label !text-[var(--sg-text-subtle-on-dark)]">Completed days</p><p className="mt-2 font-display text-6xl font-bold leading-none text-white">{recordedSessions.length}</p><p className="mt-2 text-xs leading-5 text-[var(--sg-text-muted-on-dark)]">{latestSession ? latestSession.title : "No recorded session yet."}</p>{deviceRecordCount > 0 && <p className="mt-1 text-[11px] text-[var(--sg-text-muted-on-dark)]">{deviceRecordCount} stored on this device.</p>}</div><CalendarDays className="h-7 w-7 text-[var(--sg-text-subtle-on-dark)]" /><button type="button" onClick={onOpenTraining} className="progress-text-action">Training Days <ArrowUpRight className="h-4 w-4" /></button></section>
      <section className="dark-panel progress-stat-card"><div><p className="metric-label !text-[var(--sg-text-subtle-on-dark)]">Lifts logged</p><p className="mt-2 font-display text-6xl font-bold leading-none text-white">{loggedObservations.length}</p><p className="mt-2 text-xs leading-5 text-[var(--sg-text-muted-on-dark)]">{latestObservation ? latestObservation.exerciseName : "No lifts logged yet."}</p></div><Dumbbell className="h-7 w-7 text-[var(--sg-text-subtle-on-dark)]" /><button type="button" onClick={onOpenStrength} className="progress-text-action">Strength Genome <Sparkles className="h-4 w-4" /></button></section>
    </div>
    <section className="dark-panel progress-records"><div className="progress-section-head"><div><p className="metric-label !text-[var(--sg-text-subtle-on-dark)]">Recorded workouts</p><h2>Your completed sessions.</h2></div><span>{recordedSessions.length} total</span></div>{recordedSessions.length ? <div className="mt-4 grid gap-2 md:grid-cols-2">{recordedSessions.slice(0, 6).map((session) => <article key={session.id} className="progress-session-card"><p>{session.title}</p><small>{session.completedAt.toLocaleDateString()} · {session.exerciseCount} exercises · {session.completedSetCount} sets</small><span>{session.storage === "device" ? "Device" : "Account"}</span></article>)}</div> : <p className="progress-empty-copy">Complete a Tracker workout to create your first record.</p>}</section>
    <section className="dark-panel progress-comparison-card"><div className="progress-section-head"><div><p className="metric-label !text-[var(--sg-text-subtle-on-dark)]">Strength progress</p><h2>{comparableStrengthChanges.length ? "Estimated change since your first log" : "No comparable history yet."}</h2></div><button type="button" aria-expanded={showComparisonDetails} onClick={() => setShowComparisonDetails((current) => !current)} className="progress-disclosure"><Info className="h-4 w-4" />How it works</button></div>{comparableStrengthChanges.length > 0 && <div className="mt-4 grid gap-2 md:grid-cols-2">{comparableStrengthChanges.slice(0, 4).map((change) => <article key={`${change.exerciseName}-${change.laterality}`} className="progress-session-card"><p>{change.exerciseName}</p><strong style={{ color: changeStateCopy[change.changeState].tone }}>{change.relativeChangePercent >= 0 ? "+" : ""}{change.relativeChangePercent.toFixed(0)}% e1RM</strong><small>{changeStateCopy[change.changeState].label} · {change.observationCount} logs</small></article>)}</div>}{showComparisonDetails && <div className="progress-method-note">This pulls together your logged lifts and your completed sets, converting different rep counts to a comparable one-rep max estimate (Epley formula). Stable means the change is small enough that it could just be day-to-day variation; a confirmed change is big enough to be real. This tracks you against your own past only — never against anyone else.</div>}{excludedStrengthSets.length > 0 && <p className="mt-3 text-xs leading-5 text-[var(--sg-text-muted-on-dark)]">{excludedStrengthSets.reduce((total, item) => total + item.observationCount, 0)} logged set{excludedStrengthSets.length === 1 && excludedStrengthSets[0].observationCount === 1 ? "" : "s"} outside the validated rep range for estimation are recorded but not used for this trend.</p>}</section>
  </section>;
}
