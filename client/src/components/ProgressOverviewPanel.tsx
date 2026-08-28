import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowUpRight, CalendarDays, Dumbbell, Info, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { summarizeWithinAthleteStrengthComparisons } from "@/lib/withinAthleteStrengthChange";
import { deviceWorkoutHistoryEvent, loadDeviceWorkoutSessions } from "@/lib/deviceWorkoutLog";

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
  const [deviceSessions, setDeviceSessions] = useState(() => loadDeviceWorkoutSessions());
  const [showComparisonDetails, setShowComparisonDetails] = useState(false);

  useEffect(() => {
    const refreshDeviceSessions = () => setDeviceSessions(loadDeviceWorkoutSessions());
    window.addEventListener(deviceWorkoutHistoryEvent, refreshDeviceSessions);
    return () => window.removeEventListener(deviceWorkoutHistoryEvent, refreshDeviceSessions);
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
  const latestObservation = observations.data?.[0];
  const strengthComparisonSummary = summarizeWithinAthleteStrengthComparisons(observations.data || []);
  const comparableStrengthChanges = strengthComparisonSummary.comparable;
  const nonComparableStrengthSets = strengthComparisonSummary.nonComparable;
  const deviceRecordCount = recordedSessions.filter((session) => session.storage === "device").length;

  return <section className="progress-review space-y-4">
    <header className="progress-review-head">
      <div><p className="metric-label !text-[#9fc4eb]">Your training record</p><h1 className="mt-2 font-display text-5xl font-bold uppercase leading-[.82] text-white">Progress from<br /><em className="text-[#62a5ff]">real work.</em></h1><p className="mt-3 text-sm leading-5 text-[#c9dcef]">Recorded sessions and test observations.</p></div>
      <Activity className="h-6 w-6 text-[#f2c14d]" aria-hidden="true" />
    </header>
    <div className="grid gap-3 md:grid-cols-2">
      <section className="dark-panel progress-stat-card"><div><p className="metric-label !text-[#a9bed4]">Completed days</p><p className="mt-2 font-display text-6xl font-bold leading-none text-white">{recordedSessions.length}</p><p className="mt-2 text-xs leading-5 text-[#c4d3e2]">{latestSession ? latestSession.title : "No recorded session yet."}</p>{deviceRecordCount > 0 && <p className="mt-1 text-[11px] text-[#c4d3e2]">{deviceRecordCount} stored on this device.</p>}</div><CalendarDays className="h-7 w-7 text-[#f2c14d]" /><button type="button" onClick={onOpenTraining} className="progress-text-action">Training Days <ArrowUpRight className="h-4 w-4" /></button></section>
      <section className="dark-panel progress-stat-card"><div><p className="metric-label !text-[#a9bed4]">Strength observations</p><p className="mt-2 font-display text-6xl font-bold leading-none text-white">{observations.data?.length || 0}</p><p className="mt-2 text-xs leading-5 text-[#c4d3e2]">{latestObservation ? latestObservation.exerciseName : "No test recorded yet."}</p></div><Dumbbell className="h-7 w-7 text-[#e4512e]" /><button type="button" onClick={onOpenStrength} className="progress-text-action">Strength Genome <Sparkles className="h-4 w-4" /></button></section>
    </div>
    <section className="dark-panel progress-records"><div className="progress-section-head"><div><p className="metric-label !text-[#a9bed4]">Recorded workouts</p><h2>Your completed sessions.</h2></div><span>{recordedSessions.length} total</span></div>{recordedSessions.length ? <div className="mt-4 grid gap-2 md:grid-cols-2">{recordedSessions.slice(0, 6).map((session) => <article key={session.id} className="progress-session-card"><p>{session.title}</p><small>{session.completedAt.toLocaleDateString()} · {session.exerciseCount} exercises · {session.completedSetCount} sets</small><span>{session.storage === "device" ? "Device" : "Account"}</span></article>)}</div> : <p className="progress-empty-copy">Complete a Tracker workout to create your first record.</p>}</section>
    <section className="dark-panel progress-comparison-card"><div className="progress-section-head"><div><p className="metric-label !text-[#a9bed4]">Repeated test context</p><h2>{comparableStrengthChanges.length ? "Recorded change" : "No comparable change yet."}</h2></div><button type="button" aria-expanded={showComparisonDetails} onClick={() => setShowComparisonDetails((current) => !current)} className="progress-disclosure"><Info className="h-4 w-4" />How it works</button></div>{comparableStrengthChanges.length > 0 && <div className="mt-4 grid gap-2 md:grid-cols-2">{comparableStrengthChanges.slice(0, 4).map((change) => <article key={`${change.exerciseName}-${change.latestObservedAt.toISOString()}`} className="progress-session-card"><p>{change.exerciseName}</p><strong>{change.loadChangeKg >= 0 ? "+" : ""}{change.loadChangeKg.toFixed(1)} kg</strong><small>{change.measurementType.replace(/_/g, " ")}{change.measurementType === "MULTI_REP" && change.repetitions ? ` · ${change.repetitions} reps` : ""}</small></article>)}</div>}{showComparisonDetails && <div className="progress-method-note">Repeat the same named test with matching setup and repetitions to compare recorded load. Non-matching records stay separate; this is not a population comparison or estimated strength score.</div>}{nonComparableStrengthSets.length > 0 && <p className="mt-3 text-xs leading-5 text-[#c4d3e2]">{nonComparableStrengthSets.length} comparison{nonComparableStrengthSets.length === 1 ? " is" : "s are"} withheld because the recorded setup differs.</p>}</section>
  </section>;
}
