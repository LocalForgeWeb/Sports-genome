import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, CloudOff, Dumbbell, Loader2, LogIn, Play, Save, Weight } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import type { ExerciseSettings } from "@/lib/workoutPlanner";
import { trpc } from "@/lib/trpc";
import { WorkoutHistoryTimeline } from "@/components/WorkoutHistoryTimeline";
import { classifyFailure, useWorkoutOutbox } from "@/hooks/useWorkoutOutbox";
import { haptics } from "@/lib/nativeShell";
import type { CompletePayload, LogSetPayload } from "@/lib/offlineQueue";
import { applyLocalComplete, applyLocalSetLog, cacheActiveSession, readCachedSession, type WorkoutSession } from "@/lib/offlineSession";

type WeightUnit = "lb" | "kg";

export function plannedSetCount(prescription: string) {
  const match = prescription.match(/(\d+)\s*(?:x|×)/i);
  return Math.max(1, Math.min(12, Number(match?.[1] || 3)));
}

function SetLogger({ exerciseId, setNumber, setLog, unit, onSave, pending }: { exerciseId: number; setNumber: number; setLog?: { actualWeight: string | null; actualReps: number | null; completed: boolean }; unit: WeightUnit; onSave: (value: { weight?: number; reps?: number; completed: boolean }) => void; pending: boolean }) {
  const [weight, setWeight] = useState(setLog?.actualWeight || "");
  const [reps, setReps] = useState(setLog?.actualReps?.toString() || "");
  useEffect(() => { setWeight(setLog?.actualWeight || ""); setReps(setLog?.actualReps?.toString() || ""); }, [setLog?.actualReps, setLog?.actualWeight]);
  const complete = setLog?.completed || false;
  return <div className={`session-set-row ${complete ? "session-set-complete" : ""}`}><strong>Set {setNumber}</strong><label><span>Weight</span><input value={weight} inputMode="decimal" type="number" min="0" step="0.5" onChange={(event) => setWeight(event.target.value)} placeholder="—" /><em>{unit}</em></label><label><span>Reps</span><input value={reps} inputMode="numeric" type="number" min="0" step="1" onChange={(event) => setReps(event.target.value)} placeholder="—" /></label><button disabled={pending} onClick={() => onSave({ weight: weight ? Number(weight) : undefined, reps: reps ? Number(reps) : undefined, completed: !complete })} aria-pressed={complete}>{pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : complete ? <Check className="h-3.5 w-3.5" /> : "Save"}<span>{complete ? "Saved" : "Save set"}</span></button></div>;
}

export function WorkoutExecutionPanel({ workout, prescriptions, settings, sportId, goal, dayLabel, isAuthenticated, onSignIn }: { workout: Exercise[]; prescriptions: Record<number, string>; settings: Record<number, ExerciseSettings>; sportId: string; goal: string; dayLabel: string; isAuthenticated: boolean; onSignIn: () => void }) {
  const utils = trpc.useUtils();
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [unit, setUnit] = useState<WeightUnit>("lb");
  const sessionQuery = trpc.workoutLog.get.useQuery({ sessionId: activeSessionId || 0 }, { enabled: Boolean(activeSessionId) && isAuthenticated, refetchOnWindowFocus: false });
  const historyQuery = trpc.workoutLog.list.useQuery(undefined, { enabled: isAuthenticated, refetchOnWindowFocus: false });
  const startMutation = trpc.workoutLog.start.useMutation({ onSuccess: (session) => { if (session) { setActiveSessionId(session.id); utils.workoutLog.list.invalidate(); } } });
  const logSetMutation = trpc.workoutLog.logSet.useMutation();
  const completeMutation = trpc.workoutLog.complete.useMutation();
  // Snapshot of the workout kept on the device. Covers the relaunch case: a
  // phone backgrounded mid-session and reclaimed by iOS comes back with no
  // session id and, in a basement gym, no way to ask the server for one.
  const [cachedSession, setCachedSession] = useState<WorkoutSession | null>(null);
  const activeSession = sessionQuery.data ?? cachedSession ?? undefined;
  const outbox = useWorkoutOutbox(useCallback(() => { utils.workoutLog.list.invalidate(); if (activeSessionId) utils.workoutLog.get.invalidate({ sessionId: activeSessionId }); }, [utils, activeSessionId]));
  useEffect(() => { if (sessionQuery.data) { setCachedSession(null); void cacheActiveSession(sessionQuery.data); } }, [sessionQuery.data]);
  useEffect(() => { if (activeSessionId) return; void readCachedSession().then((cached) => { if (cached?.status === "active") { setActiveSessionId(cached.id); setCachedSession(cached); } }); }, [activeSessionId]);
  // Every write lands in the UI first and reaches the network second. A set
  // tapped with no signal is still a set the athlete logged, so on a transport
  // failure it goes to the outbox rather than being lost or rolled back; only a
  // genuine server rejection reverts to the truth on the server.
  const saveSet = useCallback(async (payload: LogSetPayload) => {
    if (!activeSession) return;
    const sessionId = activeSession.id;
    // Updater form, not a value: two sets tapped in quick succession both read
    // `activeSession` from the same render, so writing a value computed from it
    // would silently discard the first tap's optimistic update.
    utils.workoutLog.get.setData({ sessionId }, (current) => applyLocalSetLog(current ?? activeSession, payload));
    void haptics.tap();
    try {
      const session = await logSetMutation.mutateAsync(payload);
      utils.workoutLog.get.setData({ sessionId: session.id }, session);
      utils.workoutLog.list.invalidate();
    } catch (error) {
      if (classifyFailure(error) === "retry") { await outbox.queueSetLog(sessionId, payload); return; }
      void haptics.warn();
      utils.workoutLog.get.invalidate({ sessionId });
    }
  }, [activeSession, logSetMutation, outbox, utils]);
  const finishWorkout = useCallback(async (payload: CompletePayload) => {
    if (!activeSession) return;
    utils.workoutLog.get.setData({ sessionId: payload.sessionId }, (current) => applyLocalComplete(current ?? activeSession, payload.sessionNotes));
    void haptics.success();
    try {
      await completeMutation.mutateAsync(payload);
      utils.workoutLog.list.invalidate();
      utils.workoutLog.get.invalidate({ sessionId: payload.sessionId });
    } catch (error) {
      if (classifyFailure(error) === "retry") { await outbox.queueComplete(payload); return; }
      utils.workoutLog.get.invalidate({ sessionId: payload.sessionId });
    }
  }, [activeSession, completeMutation, outbox, utils]);
  const completedSets = activeSession?.exercises.reduce((total, exercise) => total + exercise.setLogs.filter((set) => set.completed).length, 0) || 0;
  const plannedSets = activeSession?.exercises.reduce((total, exercise) => total + plannedSetCount(exercise.plannedPrescription), 0) || 0;
  const resumable = historyQuery.data?.find((session) => session.status === "active");
  const startWorkout = () => { if (!isAuthenticated) { onSignIn(); return; } if (!workout.length) return; startMutation.mutate({ title: `${dayLabel} workout`, sportId, goal, dayLabel, exercises: workout.map((exercise) => ({ catalogExerciseId: exercise.id, exerciseName: exercise.name, movement: exercise.movement, primaryMuscles: exercise.primaryMuscles, plannedPrescription: prescriptions[exercise.id] || "3 × 8–12", plannedRpe: settings[exercise.id]?.rpe, plannedRest: settings[exercise.id]?.rest })) }); };
  if (!isAuthenticated) return <section className="workout-execution-panel workout-auth-gate"><div><p className="metric-label">Save your training</p><h3>Sign in to log the work.</h3><p>Start this built workout, record actual weight and reps for every set, and keep the completed session in your private history.</p></div><button onClick={onSignIn}><LogIn className="h-4 w-4" /> Sign in to start</button></section>;
  if (activeSession?.status === "active") return <section className="workout-execution-panel"><div className="execution-head"><div><p className="metric-label">Live workout / {dayLabel}</p><h3>{completedSets} of {plannedSets || "—"} work sets saved</h3><p>Actual set data saves to your account as you go. Planned values remain visible for reference.</p>{outbox.pending > 0 && <p className="session-sync-pending"><CloudOff className="h-3.5 w-3.5" /> {outbox.pending} {outbox.pending === 1 ? "set is" : "writes are"} saved on this device and will sync when you are back online.</p>}</div><div className="execution-tools"><label><Weight className="h-3.5 w-3.5" /><select value={unit} onChange={(event) => setUnit(event.target.value as WeightUnit)} aria-label="Weight unit"><option value="lb">lb</option><option value="kg">kg</option></select></label><button onClick={() => void finishWorkout({ sessionId: activeSession.id })} disabled={completeMutation.isPending}>{completeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Finish workout</button></div></div><div className="session-exercise-list">{activeSession.exercises.map((exercise, index) => <article key={exercise.id} className="session-exercise"><div><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{exercise.exerciseName}</strong><small>{exercise.plannedPrescription}{exercise.plannedRpe ? ` · ${exercise.plannedRpe}` : ""}{exercise.plannedRest ? ` · ${exercise.plannedRest} rest` : ""}</small></div></div><div className="session-set-list">{Array.from({ length: plannedSetCount(exercise.plannedPrescription) }, (_, setIndex) => <SetLogger key={setIndex} exerciseId={exercise.id} setNumber={setIndex + 1} setLog={exercise.setLogs.find((set) => set.setNumber === setIndex + 1)} unit={unit} pending={logSetMutation.isPending} onSave={(value) => void saveSet({ sessionExerciseId: exercise.id, setNumber: setIndex + 1, actualWeight: value.weight, weightUnit: unit, actualReps: value.reps, completed: value.completed })} />)}</div></article>)}</div></section>;
  return <section className="workout-execution-panel"><div className="execution-head"><div><p className="metric-label">Workout execution</p><h3>Start when the plan is ready.</h3><p>Each saved set records actual weight, reps, and completion in your account—not just the planned prescription.</p></div><button onClick={startWorkout} disabled={!workout.length || startMutation.isPending}>{startMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Start workout</button></div>{resumable && <button className="resume-workout" onClick={() => setActiveSessionId(resumable.id)}><Dumbbell className="h-4 w-4" /><span>Resume active: <strong>{resumable.title}</strong></span></button>}<WorkoutHistoryTimeline sessions={historyQuery.data || []} isLoading={historyQuery.isLoading} /></section>;
}
