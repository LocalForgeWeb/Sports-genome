import { useEffect, useMemo, useState } from "react";
import { Check, Dumbbell, History, Loader2, LogIn, Play, Save, Weight } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import type { ExerciseSettings } from "@/lib/workoutPlanner";
import { trpc } from "@/lib/trpc";

type WeightUnit = "lb" | "kg";

export function plannedSetCount(prescription: string) {
  const match = prescription.match(/(\d+)\s*(?:x|×)/i);
  return Math.max(1, Math.min(12, Number(match?.[1] || 3)));
}

function formatSessionDate(value: Date | string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function SetLogger({ exerciseId, setNumber, setLog, unit, onSave, pending }: { exerciseId: number; setNumber: number; setLog?: { actualWeight: string | null; actualReps: number | null; completed: boolean }; unit: WeightUnit; onSave: (value: { weight?: number; reps?: number; completed: boolean }) => void; pending: boolean }) {
  const [weight, setWeight] = useState(setLog?.actualWeight || "");
  const [reps, setReps] = useState(setLog?.actualReps?.toString() || "");
  useEffect(() => {
    setWeight(setLog?.actualWeight || "");
    setReps(setLog?.actualReps?.toString() || "");
  }, [setLog?.actualReps, setLog?.actualWeight]);

  const complete = setLog?.completed || false;
  return <div className={`session-set-row ${complete ? "session-set-complete" : ""}`}>
    <strong>Set {setNumber}</strong>
    <label><span>Weight</span><input value={weight} inputMode="decimal" type="number" min="0" step="0.5" onChange={(event) => setWeight(event.target.value)} placeholder="—" /><em>{unit}</em></label>
    <label><span>Reps</span><input value={reps} inputMode="numeric" type="number" min="0" step="1" onChange={(event) => setReps(event.target.value)} placeholder="—" /></label>
    <button disabled={pending} onClick={() => onSave({ weight: weight ? Number(weight) : undefined, reps: reps ? Number(reps) : undefined, completed: !complete })} aria-pressed={complete}>
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : complete ? <Check className="h-3.5 w-3.5" /> : "Save"}
      <span>{complete ? "Saved" : "Save set"}</span>
    </button>
  </div>;
}

export function WorkoutExecutionPanel({ workout, prescriptions, settings, sportId, goal, dayLabel, isAuthenticated, onSignIn }: { workout: Exercise[]; prescriptions: Record<number, string>; settings: Record<number, ExerciseSettings>; sportId: string; goal: string; dayLabel: string; isAuthenticated: boolean; onSignIn: () => void }) {
  const utils = trpc.useUtils();
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [unit, setUnit] = useState<WeightUnit>("lb");
  const sessionQuery = trpc.workoutLog.get.useQuery({ sessionId: activeSessionId || 0 }, { enabled: Boolean(activeSessionId) && isAuthenticated, refetchOnWindowFocus: false });
  const historyQuery = trpc.workoutLog.list.useQuery(undefined, { enabled: isAuthenticated, refetchOnWindowFocus: false });
  const startMutation = trpc.workoutLog.start.useMutation({
    onSuccess: (session) => { if (session) { setActiveSessionId(session.id); utils.workoutLog.list.invalidate(); } },
  });
  const logSetMutation = trpc.workoutLog.logSet.useMutation({
    onSuccess: (session) => { utils.workoutLog.get.setData({ sessionId: session.id }, session); utils.workoutLog.list.invalidate(); },
  });
  const completeMutation = trpc.workoutLog.complete.useMutation({
    onSuccess: () => { utils.workoutLog.list.invalidate(); if (activeSessionId) utils.workoutLog.get.invalidate({ sessionId: activeSessionId }); },
  });

  const activeSession = sessionQuery.data;
  const activeExerciseMap = useMemo(() => new Map(activeSession?.exercises.map((exercise) => [exercise.catalogExerciseId || exercise.id, exercise]) || []), [activeSession?.exercises]);
  const completedSets = activeSession?.exercises.reduce((total, exercise) => total + exercise.setLogs.filter((set) => set.completed).length, 0) || 0;
  const plannedSets = activeSession?.exercises.reduce((total, exercise) => total + plannedSetCount(exercise.plannedPrescription), 0) || 0;
  const resumable = historyQuery.data?.find((session) => session.status === "active");

  const startWorkout = () => {
    if (!isAuthenticated) { onSignIn(); return; }
    if (!workout.length) return;
    startMutation.mutate({
      title: `${dayLabel} workout`, sportId, goal, dayLabel,
      exercises: workout.map((exercise, index) => ({
        catalogExerciseId: exercise.id,
        exerciseName: exercise.name,
        movement: exercise.movement,
        primaryMuscles: exercise.primaryMuscles,
        plannedPrescription: prescriptions[exercise.id] || "3 × 8–12",
        plannedRpe: settings[exercise.id]?.rpe,
        plannedRest: settings[exercise.id]?.rest,
      })),
    });
  };

  if (!isAuthenticated) return <section className="workout-execution-panel workout-auth-gate"><div><p className="metric-label">Save your training</p><h3>Sign in to log the work.</h3><p>Start this built workout, record actual weight and reps for every set, and keep the completed session in your private history.</p></div><button onClick={onSignIn}><LogIn className="h-4 w-4" /> Sign in to start</button></section>;

  if (activeSession?.status === "active") return <section className="workout-execution-panel"><div className="execution-head"><div><p className="metric-label">Live workout / {dayLabel}</p><h3>{completedSets} of {plannedSets || "—"} work sets saved</h3><p>Actual set data saves to your account as you go. Planned values remain visible for reference.</p></div><div className="execution-tools"><label><Weight className="h-3.5 w-3.5" /><select value={unit} onChange={(event) => setUnit(event.target.value as WeightUnit)} aria-label="Weight unit"><option value="lb">lb</option><option value="kg">kg</option></select></label><button onClick={() => completeMutation.mutate({ sessionId: activeSession.id })} disabled={completeMutation.isPending}>{completeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Finish workout</button></div></div><div className="session-exercise-list">{activeSession.exercises.map((exercise, index) => <article key={exercise.id} className="session-exercise"><div><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{exercise.exerciseName}</strong><small>{exercise.plannedPrescription}{exercise.plannedRpe ? ` · ${exercise.plannedRpe}` : ""}{exercise.plannedRest ? ` · ${exercise.plannedRest} rest` : ""}</small></div></div><div className="session-set-list">{Array.from({ length: plannedSetCount(exercise.plannedPrescription) }, (_, setIndex) => <SetLogger key={setIndex} exerciseId={exercise.id} setNumber={setIndex + 1} setLog={exercise.setLogs.find((set) => set.setNumber === setIndex + 1)} unit={unit} pending={logSetMutation.isPending} onSave={(value) => logSetMutation.mutate({ sessionExerciseId: exercise.id, setNumber: setIndex + 1, actualWeight: value.weight, weightUnit: unit, actualReps: value.reps, completed: value.completed })} />)}</div></article>)}</div></section>;

  return <section className="workout-execution-panel"><div className="execution-head"><div><p className="metric-label">Workout execution</p><h3>Start when the plan is ready.</h3><p>Each saved set records actual weight, reps, and completion in your account—not just the planned prescription.</p></div><button onClick={startWorkout} disabled={!workout.length || startMutation.isPending}>{startMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Start workout</button></div>{resumable && <button className="resume-workout" onClick={() => setActiveSessionId(resumable.id)}><Dumbbell className="h-4 w-4" /><span>Resume active: <strong>{resumable.title}</strong></span></button>}<div className="execution-history"><div><p className="metric-label">Saved history</p><History className="h-4 w-4" /></div>{historyQuery.isLoading ? <p>Loading your saved sessions…</p> : historyQuery.data?.filter((session) => session.status === "completed").length ? <div>{historyQuery.data.filter((session) => session.status === "completed").slice(0, 4).map((session) => <article key={session.id}><span>{formatSessionDate(session.startedAt)}</span><strong>{session.title}</strong><small>{session.completedSetCount} saved set{session.completedSetCount === 1 ? "" : "s"} · {session.exerciseCount} exercise{session.exerciseCount === 1 ? "" : "s"}</small></article>)}</div> : <p>Your completed sessions will appear here after you finish a workout.</p>}</div></section>;
}
