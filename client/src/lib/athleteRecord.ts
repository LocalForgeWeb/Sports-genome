/**
 * The athlete's record, read one way.
 *
 * Home counted lifts from the account's `strengthGenome.overview`, which answers
 * nothing without an account, while Strength counted the lifts typed on this
 * device plus the lifts carried across from finished workouts. The same athlete
 * saw "0 lifts logged" on one screen and "15 lifts recorded" on the next. This
 * is the one definition every screen reads:
 *
 *   lifts logged      = typed lifts (device store, or the account's when it is
 *                       the source) + one lift per exercise per finished workout
 *   regions covered   = strength regions with at least one of those lifts
 *   workouts recorded = finished workout sessions
 *   completed this week = finished workouts since Monday, local time
 *
 * Everything is derived from the same stores the writers write to, and the hook
 * re-reads on the events those writers fire, so a lift saved on Strength is on
 * Home the moment it is saved. Reads are synchronous, so there is no moment when
 * a screen shows an empty state for a record that has not loaded yet.
 */
import { useEffect, useState } from "react";
import { strengthRegionDefinitions } from "@shared/strengthGenomeDefinitions";
import { bodyWeightLogEvent, loadBodyWeightLog, type BodyWeightEntry } from "./bodyWeightLog";
import { deviceStrengthObservationEvent, loadDeviceStrengthObservations, type DeviceStrengthObservation } from "./deviceStrengthObservations";
import { deviceWorkoutHistoryEvent, isCompletedSet, isCompletedWorkout, loadDeviceWorkoutSessions, type DeviceWorkoutSession } from "./deviceWorkoutLog";
import { startOfTrainingWeek, summarizeTrainingWeek, type TrainingSession } from "./trainingWeekSummary";
import type { DisplayWeightUnit } from "./weightUnits";
import { strengthRegionIdsForExerciseName, workoutStrengthObservations, type WorkoutStrengthObservation } from "./workoutStrengthRecord";

export type RecordedLift = { id: string | number; exerciseName: string; observedAt: string | Date };

export type AthleteRecordSummary = {
  liftsLogged: number;
  /** Of those, the ones carried across from finished workouts rather than typed in. */
  liftsFromWorkouts: number;
  regionsCovered: number;
  regionTotal: number;
  workoutsRecorded: number;
  completedThisWeek: number;
  /** The day labels of those finished workouts ("Week 1 · Day 01 · Push"), so a plan day can be marked from its own record. */
  completedDayLabelsThisWeek: readonly string[];
  /** The same finished workouts with when each finished, so a choice made after one can be told apart (nextWorkout.ts). */
  completionsThisWeek: readonly { dayLabel: string; at: string }[];
  /** The plan day of the most recently started workout, running or finished, at any date. */
  latestSessionDayLabel: string | null;
  setsThisWeek: number;
  /**
   * The most recently finished workout on this device, for Home's way back into its recap (O08).
   * Device records only: those are the ones with a session detail to open.
   */
  latestFinished: { id: string; title: string; dayLabel: string; completedAt: string; exerciseCount: number; setCount: number } | null;
  /** Where the record lives, said in words for the screens that name it. */
  storage: "device" | "account";
};

export type AthleteRecordSources = {
  deviceObservations: readonly DeviceStrengthObservation[];
  deviceSessions: readonly DeviceWorkoutSession[];
  bodyWeightLog?: readonly BodyWeightEntry[];
  /** The account's typed lifts and sessions; used only when the account is the source. */
  accountObservations?: readonly RecordedLift[];
  accountSessions?: readonly TrainingSession[];
  /** True while the app runs on the device stores alone. */
  directAccess: boolean;
  weightUnit?: DisplayWeightUnit;
  now?: Date;
};

/** How many strength regions the record reaches: a region counts once whatever lifts land in it. */
export function countCoveredRegions(lifts: readonly { exerciseName: string }[]): number {
  const covered = new Set<string>();
  for (const lift of lifts) for (const regionId of strengthRegionIdsForExerciseName(lift.exerciseName)) covered.add(regionId);
  return strengthRegionDefinitions.filter((region) => covered.has(region.id)).length;
}

/** A finished device workout in the shape the week summary reads. */
export function deviceSessionsAsTraining(sessions: readonly DeviceWorkoutSession[]): TrainingSession[] {
  // A finish with nothing logged is not a workout; a running session stays, for resume.
  return sessions.filter((session) => session.status === "active" || isCompletedWorkout(session)).map((session, index) => ({
    id: index,
    title: session.title,
    dayLabel: session.dayLabel,
    status: session.status,
    startedAt: session.startedAt,
    completedAt: session.completedAt ?? null,
    exerciseCount: session.exercises.length,
    completedSetCount: session.exercises.reduce((total, exercise) => total + exercise.sets.filter(isCompletedSet).length, 0),
  }));
}

/** The newest finished workout with at least one completed set; the same definition Progress lists. */
export function latestFinishedOnDevice(sessions: readonly DeviceWorkoutSession[]): AthleteRecordSummary["latestFinished"] {
  const latest = sessions
    .filter(isCompletedWorkout)
    .map((session) => ({ session, at: new Date(session.completedAt ?? session.startedAt).getTime() }))
    .filter(({ at }) => Number.isFinite(at))
    .sort((a, b) => b.at - a.at)[0]?.session;
  if (!latest) return null;
  const done = latest.exercises.filter((exercise) => exercise.sets.some(isCompletedSet));
  return {
    id: latest.id,
    title: latest.title,
    dayLabel: latest.dayLabel,
    completedAt: latest.completedAt ?? latest.startedAt,
    exerciseCount: done.length,
    setCount: done.reduce((total, exercise) => total + exercise.sets.filter(isCompletedSet).length, 0),
  };
}

/** The typed lifts plus the workout-derived ones, newest first: the list Strength and Progress read. */
export function recordedLifts(sources: AthleteRecordSources): (RecordedLift | WorkoutStrengthObservation)[] {
  const typed: readonly RecordedLift[] = sources.directAccess ? sources.deviceObservations : (sources.accountObservations ?? []);
  const fromWorkouts = workoutStrengthObservations(sources.deviceSessions, sources.weightUnit ?? "lb", sources.bodyWeightLog ?? []);
  return [...typed, ...fromWorkouts].sort((a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime());
}

export function summarizeAthleteRecord(sources: AthleteRecordSources): AthleteRecordSummary {
  const lifts = recordedLifts(sources);
  const fromWorkouts = lifts.filter((lift) => (lift as WorkoutStrengthObservation).source === "workout").length;
  const sessions: TrainingSession[] = [
    ...deviceSessionsAsTraining(sources.deviceSessions),
    ...(sources.directAccess ? [] : (sources.accountSessions ?? [])),
  ];
  const week = summarizeTrainingWeek(sessions, 0, sources.now);
  // The same sessions and the same week the count reads, listed by the plan day they were for.
  const weekStart = startOfTrainingWeek(sources.now ?? new Date());
  const completionsThisWeek = sessions.flatMap((session) => {
    if (session.status !== "completed" || !session.dayLabel) return [];
    const marker = new Date(session.completedAt ?? session.startedAt);
    return !Number.isNaN(marker.getTime()) && marker >= weekStart ? [{ dayLabel: session.dayLabel, at: marker.toISOString() }] : [];
  });
  const completedDayLabelsThisWeek = Array.from(new Set(completionsThisWeek.map((completion) => completion.dayLabel)));
  const latestSession = sessions
    .filter((session) => session.dayLabel && !Number.isNaN(new Date(session.startedAt).getTime()))
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0];
  return {
    liftsLogged: lifts.length,
    liftsFromWorkouts: fromWorkouts,
    regionsCovered: countCoveredRegions(lifts),
    regionTotal: strengthRegionDefinitions.length,
    workoutsRecorded: sessions.filter((session) => session.status === "completed").length,
    completedThisWeek: week.completedThisWeek,
    completedDayLabelsThisWeek,
    completionsThisWeek,
    latestSessionDayLabel: latestSession?.dayLabel ?? null,
    setsThisWeek: week.setsThisWeek,
    latestFinished: latestFinishedOnDevice(sources.deviceSessions),
    storage: sources.directAccess ? "device" : "account",
  };
}

/** The device stores, kept in step with the events their writers fire. */
export function useDeviceRecordStores() {
  const [deviceSessions, setDeviceSessions] = useState(() => loadDeviceWorkoutSessions());
  const [deviceObservations, setDeviceObservations] = useState(() => loadDeviceStrengthObservations());
  const [bodyWeightLog, setBodyWeightLog] = useState(() => loadBodyWeightLog());
  useEffect(() => {
    const refreshSessions = () => setDeviceSessions(loadDeviceWorkoutSessions());
    const refreshObservations = () => setDeviceObservations(loadDeviceStrengthObservations());
    const refreshWeights = () => setBodyWeightLog(loadBodyWeightLog());
    const refreshAll = () => { refreshSessions(); refreshObservations(); refreshWeights(); };
    window.addEventListener(deviceWorkoutHistoryEvent, refreshSessions);
    window.addEventListener(deviceStrengthObservationEvent, refreshObservations);
    window.addEventListener(bodyWeightLogEvent, refreshWeights);
    window.addEventListener("storage", refreshAll);
    return () => {
      window.removeEventListener(deviceWorkoutHistoryEvent, refreshSessions);
      window.removeEventListener(deviceStrengthObservationEvent, refreshObservations);
      window.removeEventListener(bodyWeightLogEvent, refreshWeights);
      window.removeEventListener("storage", refreshAll);
    };
  }, []);
  return { deviceSessions, deviceObservations, bodyWeightLog };
}

export function useAthleteRecord(options: { directAccess: boolean; weightUnit?: DisplayWeightUnit; accountObservations?: readonly RecordedLift[]; accountSessions?: readonly TrainingSession[] }): AthleteRecordSummary {
  const stores = useDeviceRecordStores();
  return summarizeAthleteRecord({ ...stores, ...options });
}
