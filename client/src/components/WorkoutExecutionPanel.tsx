import { useEffect, useState } from "react";
import { Check, Dumbbell, Loader2, LogIn, Play, Save, Weight } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import type { ExerciseSettings } from "@/lib/workoutPlanner";
import { trpc } from "@/lib/trpc";
import { WorkoutHistoryTimeline } from "@/components/WorkoutHistoryTimeline";
import { ProgressionReviewPanel } from "@/components/ProgressionReviewPanel";
import type { ExerciseProgressionRecommendation, MuscleSegmentSignal } from "@/lib/progressiveTraining";
import type { SegmentPrioritySuggestion } from "@/lib/segmentPrioritySuggestions";

type WeightUnit = "lb" | "kg";
type SetSaveValue = { weight?: number; reps?: number; rpe?: number; completed: boolean };
export const PROGRESSION_APPROVAL_EVENT = "gym-optimizer:approve-progression";
export const SEGMENT_PRIORITY_APPROVAL_EVENT = "gym-optimizer:approve-segment-priority";
export const SEGMENT_SUGGESTION_APPROVAL_EVENT = "gym-optimizer:approve-segment-suggestion";

export function plannedSetCount(prescription: string) {
  const match = prescription.match(/(\d+)\s*(?:x|×)/i);
  return Math.max(1, Math.min(12, Number(match?.[1] || 3)));
}

export function buildSetLogPayload(sessionExerciseId: number, setNumber: number, unit: WeightUnit, value: SetSaveValue) {
  return {
    sessionExerciseId,
    setNumber,
    actualWeight: value.weight,
    weightUnit: unit,
    actualReps: value.reps,
    actualRpe: value.rpe,
    completed: value.completed,
  };
}

function SetLogger({ setNumber, setLog, unit, onSave, pending }: {
  setNumber: number;
  setLog?: { actualWeight: string | null; actualReps: number | null; actualRpe?: string | null; completed: boolean };
  unit: WeightUnit;
  onSave: (value: SetSaveValue) => void;
  pending: boolean;
}) {
  const [weight, setWeight] = useState(setLog?.actualWeight || "");
  const [reps, setReps] = useState(setLog?.actualReps?.toString() || "");
  const [rpe, setRpe] = useState(setLog?.actualRpe || "");
  useEffect(() => {
    setWeight(setLog?.actualWeight || "");
    setReps(setLog?.actualReps?.toString() || "");
    setRpe(setLog?.actualRpe || "");
  }, [setLog?.actualReps, setLog?.actualWeight, setLog?.actualRpe]);
  const complete = setLog?.completed || false;

  return <div className={`session-set-row ${complete ? "session-set-complete" : ""}`}>
    <strong>Set {setNumber}</strong>
    <label><span>Weight</span><input value={weight} inputMode="decimal" type="number" min="0" step="0.5" onChange={(event) => setWeight(event.target.value)} placeholder="—" /><em>{unit}</em></label>
    <label><span>Reps</span><input value={reps} inputMode="numeric" type="number" min="0" step="1" onChange={(event) => setReps(event.target.value)} placeholder="—" /></label>
    <label><span>RPE</span><input value={rpe} inputMode="decimal" type="number" min="1" max="10" step="0.5" onChange={(event) => setRpe(event.target.value)} placeholder="—" /></label>
    <button disabled={pending} onClick={() => onSave({ weight: weight ? Number(weight) : undefined, reps: reps ? Number(reps) : undefined, rpe: rpe ? Number(rpe) : undefined, completed: !complete })} aria-pressed={complete}>
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : complete ? <Check className="h-3.5 w-3.5" /> : "Save"}
      <span>{complete ? "Saved" : "Save set"}</span>
    </button>
  </div>;
}

export function WorkoutExecutionPanel({ workout, prescriptions, settings, sportId, goal, dayLabel, isAuthenticated, onSignIn, bodyWeight, weightUnit, onApproveProgression, onApproveSegment, onAddSegmentSuggestion }: {
  workout: Exercise[];
  prescriptions: Record<number, string>;
  settings: Record<number, ExerciseSettings>;
  sportId: string;
  goal: string;
  dayLabel: string;
  isAuthenticated: boolean;
  onSignIn: () => void;
  bodyWeight?: number;
  weightUnit?: "lb" | "kg";
  onApproveProgression?: (recommendation: ExerciseProgressionRecommendation) => void;
  onApproveSegment?: (signal: MuscleSegmentSignal) => void;
  onAddSegmentSuggestion?: (suggestion: SegmentPrioritySuggestion) => void;
}) {
  const utils = trpc.useUtils();
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [unit, setUnit] = useState<WeightUnit>("lb");
  const sessionQuery = trpc.workoutLog.get.useQuery({ sessionId: activeSessionId || 0 }, { enabled: Boolean(activeSessionId) && isAuthenticated, refetchOnWindowFocus: false });
  const historyQuery = trpc.workoutLog.list.useQuery(undefined, { enabled: isAuthenticated, refetchOnWindowFocus: false });
  const startMutation = trpc.workoutLog.start.useMutation({ onSuccess: (session) => { if (session) { setActiveSessionId(session.id); utils.workoutLog.list.invalidate(); } } });
  const logSetMutation = trpc.workoutLog.logSet.useMutation({ onSuccess: (session) => { utils.workoutLog.get.setData({ sessionId: session.id }, session); utils.workoutLog.list.invalidate(); } });
  const completeMutation = trpc.workoutLog.complete.useMutation({ onSuccess: () => { utils.workoutLog.list.invalidate(); if (activeSessionId) utils.workoutLog.get.invalidate({ sessionId: activeSessionId }); } });
  const activeSession = sessionQuery.data;
  const completedSets = activeSession?.exercises.reduce((total, exercise) => total + exercise.setLogs.filter((set) => set.completed).length, 0) || 0;
  const plannedSets = activeSession?.exercises.reduce((total, exercise) => total + plannedSetCount(exercise.plannedPrescription), 0) || 0;
  const resumable = historyQuery.data?.find((session) => session.status === "active");
  const handleProgressionApproval = (recommendation: ExerciseProgressionRecommendation) => {
    if (onApproveProgression) { onApproveProgression(recommendation); return; }
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(PROGRESSION_APPROVAL_EVENT, { detail: recommendation }));
  };
  const handleSegmentApproval = (signal: MuscleSegmentSignal) => {
    if (onApproveSegment) { onApproveSegment(signal); return; }
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(SEGMENT_PRIORITY_APPROVAL_EVENT, { detail: signal }));
  };
  const handleSegmentSuggestion = (suggestion: SegmentPrioritySuggestion) => {
    if (onAddSegmentSuggestion) { onAddSegmentSuggestion(suggestion); return; }
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(SEGMENT_SUGGESTION_APPROVAL_EVENT, { detail: suggestion }));
  };

  const startWorkout = () => {
    if (!isAuthenticated) { onSignIn(); return; }
    if (!workout.length) return;
    startMutation.mutate({
      title: `${dayLabel} workout`, sportId, goal, dayLabel,
      exercises: workout.map((exercise) => ({
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

  if (!isAuthenticated) return <section className="workout-execution-panel workout-auth-gate"><div><p className="metric-label">Save your training</p><h3>Sign in to log the work.</h3><p>Start this built workout, record actual weight, repetitions, and effort for every set, and keep the completed session in your private history.</p></div><button onClick={onSignIn}><LogIn className="h-4 w-4" /> Sign in to start</button></section>;

  if (activeSession?.status === "active") return <section className="workout-execution-panel">
    <div className="execution-head"><div><p className="metric-label">Live workout / {dayLabel}</p><h3>{completedSets} of {plannedSets || "—"} work sets saved</h3><p>Actual set data, including optional RPE, saves to your account as you go. Planned values remain visible for reference.</p></div><div className="execution-tools"><label><Weight className="h-3.5 w-3.5" /><select value={unit} onChange={(event) => setUnit(event.target.value as WeightUnit)} aria-label="Weight unit"><option value="lb">lb</option><option value="kg">kg</option></select></label><button onClick={() => completeMutation.mutate({ sessionId: activeSession.id })} disabled={completeMutation.isPending}>{completeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Finish workout</button></div></div>
    <div className="session-exercise-list">{activeSession.exercises.map((exercise, index) => <article key={exercise.id} className="session-exercise"><div><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{exercise.exerciseName}</strong><small>{exercise.plannedPrescription}{exercise.plannedRpe ? ` · ${exercise.plannedRpe}` : ""}{exercise.plannedRest ? ` · ${exercise.plannedRest} rest` : ""}</small></div></div><div className="session-set-list">{Array.from({ length: plannedSetCount(exercise.plannedPrescription) }, (_, setIndex) => <SetLogger key={setIndex} setNumber={setIndex + 1} setLog={exercise.setLogs.find((set) => set.setNumber === setIndex + 1)} unit={unit} pending={logSetMutation.isPending} onSave={(value) => logSetMutation.mutate(buildSetLogPayload(exercise.id, setIndex + 1, unit, value))} />)}</div></article>)}</div>
  </section>;

  return <section className="workout-execution-panel"><div className="execution-head"><div><p className="metric-label">Workout execution</p><h3>Start when the plan is ready.</h3><p>Each saved set records actual weight, reps, optional RPE, and completion in your account—not just the planned prescription.</p></div><button onClick={startWorkout} disabled={!workout.length || startMutation.isPending}>{startMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Start workout</button></div>{resumable && <button className="resume-workout" onClick={() => setActiveSessionId(resumable.id)}><Dumbbell className="h-4 w-4" /><span>Resume active: <strong>{resumable.title}</strong></span></button>}<ProgressionReviewPanel workout={workout} prescriptions={prescriptions} settings={settings} bodyWeight={bodyWeight} weightUnit={weightUnit} onApprove={handleProgressionApproval} onApproveSegment={handleSegmentApproval} onAddSuggestion={handleSegmentSuggestion} /><WorkoutHistoryTimeline sessions={historyQuery.data || []} isLoading={historyQuery.isLoading} /></section>;
}
