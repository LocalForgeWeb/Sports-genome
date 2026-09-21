import { useEffect, useState } from "react";
import { Check, Dumbbell, Loader2, LogIn, Play, Save, Trash2, Weight } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import type { ExerciseSettings } from "@/lib/workoutPlanner";
import { trpc } from "@/lib/trpc";
import { ConfirmDialog, type ConfirmDialogRequest } from "@/components/ConfirmDialog";
import { WorkoutHistoryTimeline } from "@/components/WorkoutHistoryTimeline";
import { ProgressionReviewPanel } from "@/components/ProgressionReviewPanel";
import type { ExerciseProgressionRecommendation, MuscleSegmentSignal } from "@/lib/progressiveTraining";
import type { SegmentPrioritySuggestion } from "@/lib/segmentPrioritySuggestions";
import { renderableSetCount, repsForSet } from "@/lib/setPrescription";

type WeightUnit = "lb" | "kg";
type SetSaveValue = { weight?: number; reps?: number; completed: boolean };
export const PROGRESSION_APPROVAL_EVENT = "gym-optimizer:approve-progression";
export const SEGMENT_PRIORITY_APPROVAL_EVENT = "gym-optimizer:approve-segment-priority";
export const SEGMENT_SUGGESTION_APPROVAL_EVENT = "gym-optimizer:approve-segment-suggestion";

/**
 * The planner can write a target per set ("4 × 10/8/6/6"), so the count comes from
 * the same reader the editor writes with rather than the leading number. Reading the
 * leading number here while the device tracker and the print sheet read the list
 * meant the same workout offered a different number of set rows on each surface.
 */
export function plannedSetCount(prescription: string) {
  return renderableSetCount(prescription);
}

export function buildSetLogPayload(sessionExerciseId: number, setNumber: number, unit: WeightUnit, value: SetSaveValue) {
  return {
    sessionExerciseId,
    setNumber,
    actualWeight: value.weight,
    weightUnit: unit,
    actualReps: value.reps,
    completed: value.completed,
  };
}

export function resolvedWeightUnit(weightUnit?: WeightUnit): WeightUnit {
  return weightUnit ?? "lb";
}

/** A set counts as recorded once it carries any value the athlete typed. */
export function hasLoggedValue(setLog?: { actualWeight: string | null; actualReps: number | null; completed: boolean }) {
  return Boolean(setLog && (setLog.completed || setLog.actualWeight !== null || setLog.actualReps !== null));
}

function SetLogger({ setNumber, target, setLog, unit, onSave, onClear, pending, clearing }: {
  setNumber: number;
  /** What this particular set asks for, which a varied plan states per set. */
  target?: string;
  setLog?: { actualWeight: string | null; actualReps: number | null; completed: boolean };
  unit: WeightUnit;
  onSave: (value: SetSaveValue) => void;
  /** Absent until the set has something in it - there is nothing to remove from an empty row. */
  onClear?: () => void;
  pending: boolean;
  clearing: boolean;
}) {
  const [weight, setWeight] = useState(setLog?.actualWeight || "");
  const [reps, setReps] = useState(setLog?.actualReps?.toString() || "");
  useEffect(() => {
    setWeight(setLog?.actualWeight || "");
    setReps(setLog?.actualReps?.toString() || "");
  }, [setLog?.actualReps, setLog?.actualWeight]);
  const complete = setLog?.completed || false;

  return <div className={`session-set-row ${complete ? "session-set-complete" : ""}`}>
    <strong>Set {setNumber}{target ? <em> {target}</em> : null}</strong>
    <label><span>Weight</span><input value={weight} inputMode="decimal" type="number" min="0" step="0.5" onChange={(event) => setWeight(event.target.value)} placeholder="—" /><em>{unit}</em></label>
    <label><span>Reps</span><input value={reps} inputMode="numeric" type="number" min="0" step="1" onChange={(event) => setReps(event.target.value)} placeholder="—" /></label>
    <button disabled={pending} onClick={() => onSave({ weight: weight ? Number(weight) : undefined, reps: reps ? Number(reps) : undefined, completed: !complete })} aria-pressed={complete}>
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : complete ? <Check className="h-3.5 w-3.5" /> : null}
      <span>{complete ? "Saved" : "Save set"}</span>
    </button>
    {onClear && <button
      type="button"
      className="session-set-clear"
      disabled={clearing}
      onClick={onClear}
      aria-label={`Remove set ${setNumber}`}
      title={`Remove set ${setNumber}`}
    >{clearing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}</button>}
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
  const [unit, setUnit] = useState<WeightUnit>(() => resolvedWeightUnit(weightUnit));
  useEffect(() => setUnit(resolvedWeightUnit(weightUnit)), [weightUnit]);
  const sessionQuery = trpc.workoutLog.get.useQuery({ sessionId: activeSessionId || 0 }, { enabled: Boolean(activeSessionId) && isAuthenticated, refetchOnWindowFocus: false });
  const historyQuery = trpc.workoutLog.list.useQuery(undefined, { enabled: isAuthenticated, refetchOnWindowFocus: false });
  const startMutation = trpc.workoutLog.start.useMutation({ onSuccess: (session) => { if (session) { setActiveSessionId(session.id); utils.workoutLog.list.invalidate(); } } });
  const logSetMutation = trpc.workoutLog.logSet.useMutation({ onSuccess: (session) => { utils.workoutLog.get.setData({ sessionId: session.id }, session); utils.workoutLog.list.invalidate(); } });
  const completeMutation = trpc.workoutLog.complete.useMutation({ onSuccess: () => { utils.workoutLog.list.invalidate(); if (activeSessionId) utils.workoutLog.get.invalidate({ sessionId: activeSessionId }); } });
  /**
   * Removing a set the athlete mistyped. Until this existed, `removePasskey` was
   * the only destructive operation in the API, so a set logged as 225 instead of
   * 22.5 stayed in the history and in everything derived from it.
   */
  const clearSetMutation = trpc.repair.deleteWorkoutSet.useMutation({
    onSuccess: () => {
      if (activeSessionId) utils.workoutLog.get.invalidate({ sessionId: activeSessionId });
      utils.workoutLog.list.invalidate();
    },
  });
  const [pendingSetRemoval, setPendingSetRemoval] = useState<ConfirmDialogRequest | null>(null);

  const requestSetRemoval = (sessionExerciseId: number, setNumber: number, exerciseName: string) =>
    setPendingSetRemoval({
      title: `Remove set ${setNumber}?`,
      body: `The logged weight and reps for set ${setNumber} of ${exerciseName} are deleted, and stop counting toward progression. This cannot be undone.`,
      confirmLabel: "Remove set",
      onConfirm: () => {
        clearSetMutation.mutate({ sessionExerciseId, setNumber });
        setPendingSetRemoval(null);
      },
    });
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
        plannedRest: settings[exercise.id]?.rest,
      })),
    });
  };

  if (!isAuthenticated) return <section id="workout-tracker" className="workout-execution-panel workout-auth-gate"><div><p className="metric-label">Save your training</p><h3>Sign in to log the work.</h3><p>Start this built workout, record actual weight and repetitions for every set, and keep the completed session in your private history.</p></div><button onClick={onSignIn}><LogIn className="h-4 w-4" /> Sign in to start</button></section>;

  if (activeSession?.status === "active") return <section id="workout-tracker" className="workout-execution-panel">
    <div className="execution-head"><div><p className="metric-label">Live workout / {dayLabel}</p><h3>{completedSets} / {plannedSets || "—"} work sets logged</h3><p>Actual weight, reps, and completion save to your account as you go.</p></div><div className="execution-tools"><label><Weight className="h-3.5 w-3.5" /><select value={unit} onChange={(event) => setUnit(event.target.value as WeightUnit)} aria-label="Weight unit"><option value="lb">lb</option><option value="kg">kg</option></select></label><button onClick={() => completeMutation.mutate({ sessionId: activeSession.id })} disabled={completeMutation.isPending}>{completeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Finish workout</button></div></div>
    <div className="session-exercise-list">{activeSession.exercises.map((exercise, index) => <article key={exercise.id} className="session-exercise"><div><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{exercise.exerciseName}</strong><small>{exercise.plannedPrescription}{exercise.plannedRest ? ` · ${exercise.plannedRest} rest` : ""}</small></div></div><div className="session-set-list">{Array.from({ length: plannedSetCount(exercise.plannedPrescription) }, (_, setIndex) => <SetLogger key={setIndex} setNumber={setIndex + 1} target={repsForSet(exercise.plannedPrescription, setIndex)} setLog={exercise.setLogs.find((set) => set.setNumber === setIndex + 1)} unit={unit} pending={logSetMutation.isPending} clearing={clearSetMutation.isPending} onSave={(value) => logSetMutation.mutate(buildSetLogPayload(exercise.id, setIndex + 1, unit, value))} onClear={hasLoggedValue(exercise.setLogs.find((set) => set.setNumber === setIndex + 1)) ? () => requestSetRemoval(exercise.id, setIndex + 1, exercise.exerciseName) : undefined} />)}</div></article>)}</div>
    {clearSetMutation.isError && <p className="session-set-error" role="alert">That set could not be removed. It may already be gone — reload to see the current record.</p>}
    {pendingSetRemoval && <ConfirmDialog {...pendingSetRemoval} onCancel={() => setPendingSetRemoval(null)} />}
  </section>;

  return <section id="workout-tracker" className="workout-execution-panel"><div className="execution-head"><div><p className="metric-label">Workout execution</p><h3>Ready to train.</h3><p>Each logged set records actual weight, reps, and completion in your account—not just the planned prescription.</p></div><button onClick={startWorkout} disabled={!workout.length || startMutation.isPending}>{startMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Start workout</button></div>{startMutation.isError && <p className="session-set-error" role="alert">That workout could not be started. A very long per-set target can exceed what the session record holds — shorten it, or split the exercise.</p>}{resumable && <button className="resume-workout" onClick={() => setActiveSessionId(resumable.id)}><Dumbbell className="h-4 w-4" /><span>Resume active: <strong>{resumable.title}</strong></span></button>}<ProgressionReviewPanel workout={workout} prescriptions={prescriptions} settings={settings} bodyWeight={bodyWeight} weightUnit={weightUnit} onApprove={handleProgressionApproval} onApproveSegment={handleSegmentApproval} onAddSuggestion={handleSegmentSuggestion} /><WorkoutHistoryTimeline sessions={historyQuery.data || []} isLoading={historyQuery.isLoading} /></section>;
}
