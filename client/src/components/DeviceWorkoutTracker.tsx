import { useEffect, useMemo, useState } from "react";
import { Check, Play, Save } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import type { ExerciseSettings } from "@/lib/workoutPlanner";
import { type DeviceWorkoutSession, loadDeviceWorkoutSessions, saveDeviceWorkoutSessions } from "@/lib/deviceWorkoutLog";

function plannedSetCount(prescription: string) {
  return Math.max(1, Math.min(12, Number(prescription.match(/(\d+)\s*(?:x|×)/i)?.[1] || 3)));
}

function makeSession(workout: Exercise[], prescriptions: Record<number, string>, dayLabel: string): DeviceWorkoutSession {
  return {
    id: `device-${Date.now()}`,
    title: `${dayLabel} workout`,
    dayLabel,
    startedAt: new Date().toISOString(),
    status: "active",
    exercises: workout.map((exercise, index) => {
      const plannedPrescription = prescriptions[exercise.id] || "3 × 8–12";
      return {
        id: `${exercise.id}-${index}`,
        exerciseName: exercise.name,
        plannedPrescription,
        sets: Array.from({ length: plannedSetCount(plannedPrescription) }, () => ({ weight: "", reps: "", rpe: "", completed: false })),
      };
    }),
  };
}

export function DeviceWorkoutTracker({ workout, prescriptions, dayLabel }: { workout: Exercise[]; prescriptions: Record<number, string>; settings: Record<number, ExerciseSettings>; dayLabel: string }) {
  const [activeSession, setActiveSession] = useState<DeviceWorkoutSession | null>(null);
  useEffect(() => {
    setActiveSession(loadDeviceWorkoutSessions().find((session) => session.status === "active") || null);
  }, []);
  const completed = useMemo(() => activeSession?.exercises.reduce((count, exercise) => count + exercise.sets.filter((set) => set.completed).length, 0) || 0, [activeSession]);
  const planned = useMemo(() => activeSession?.exercises.reduce((count, exercise) => count + exercise.sets.length, 0) || 0, [activeSession]);
  const persist = (next: DeviceWorkoutSession) => {
    setActiveSession(next);
    const prior = loadDeviceWorkoutSessions().filter((session) => session.id !== next.id);
    saveDeviceWorkoutSessions([next, ...prior]);
  };
  const start = () => {
    if (!workout.length) return;
    persist(makeSession(workout, prescriptions, dayLabel));
  };
  const updateSet = (exerciseId: string, setIndex: number, patch: Partial<DeviceWorkoutSession["exercises"][number]["sets"][number]>) => {
    if (!activeSession) return;
    persist({ ...activeSession, exercises: activeSession.exercises.map((exercise) => exercise.id !== exerciseId ? exercise : { ...exercise, sets: exercise.sets.map((set, index) => index === setIndex ? { ...set, ...patch } : set) }) });
  };
  const finish = () => {
    if (!activeSession) return;
    persist({ ...activeSession, status: "completed", completedAt: new Date().toISOString() });
    setActiveSession(null);
  };

  if (!activeSession) return <section id="workout-tracker" className="workout-execution-panel device-workout-tracker"><div className="execution-head"><div><p className="metric-label">Workout tracker</p><h3>Log the work.</h3><p>Start the selected saved day, then record actual weight, repetitions, optional effort, and completed sets. During temporary direct access, entries stay on this device and appear in Progress.</p></div><button onClick={start} disabled={!workout.length}><Play className="h-4 w-4" /> Start workout</button></div>{!workout.length && <p className="tracker-empty-state">Select a drafted Training Day before starting a workout.</p>}</section>;

  return <section id="workout-tracker" className="workout-execution-panel device-workout-tracker"><div className="execution-head"><div><p className="metric-label">Live workout / {activeSession.dayLabel}</p><h3>{completed} of {planned} sets saved</h3><p>Device-local session record. Finish this workout to add it to Progress.</p></div><button onClick={finish}><Save className="h-4 w-4" /> Finish workout</button></div><div className="session-exercise-list">{activeSession.exercises.map((exercise, exerciseIndex) => <article key={exercise.id} className="session-exercise"><div><span>{String(exerciseIndex + 1).padStart(2, "0")}</span><div><strong>{exercise.exerciseName}</strong><small>{exercise.plannedPrescription}</small></div></div><div className="session-set-list">{exercise.sets.map((set, setIndex) => <div key={setIndex} className={`session-set-row ${set.completed ? "session-set-complete" : ""}`}><strong>Set {setIndex + 1}</strong><label><span>Weight</span><input value={set.weight} inputMode="decimal" type="number" min="0" step="0.5" onChange={(event) => updateSet(exercise.id, setIndex, { weight: event.target.value })} placeholder="—" /><em>lb</em></label><label><span>Reps</span><input value={set.reps} inputMode="numeric" type="number" min="0" step="1" onChange={(event) => updateSet(exercise.id, setIndex, { reps: event.target.value })} placeholder="—" /></label><label><span>RPE</span><input value={set.rpe} inputMode="decimal" type="number" min="1" max="10" step="0.5" onChange={(event) => updateSet(exercise.id, setIndex, { rpe: event.target.value })} placeholder="—" /></label><button onClick={() => updateSet(exercise.id, setIndex, { completed: !set.completed })} aria-pressed={set.completed}>{set.completed ? <Check className="h-3.5 w-3.5" /> : "Save"}<span>{set.completed ? "Saved" : "Save set"}</span></button></div>)}</div></article>)}</div></section>;
}
