export type DeviceSetLog = { weight: string; reps: string; completed: boolean };
export type DeviceWorkoutExercise = {
  id: string;
  exerciseName: string;
  plannedPrescription: string;
  sets: DeviceSetLog[];
};
export type DeviceWorkoutSession = {
  id: string;
  title: string;
  dayLabel: string;
  startedAt: string;
  completedAt?: string;
  status: "active" | "completed";
  exercises: DeviceWorkoutExercise[];
};

export const deviceWorkoutHistoryKey = "sports-genome-device-workout-history-v1";
export const deviceWorkoutHistoryEvent = "sports-genome:device-workout-history";

export function loadDeviceWorkoutSessions(): DeviceWorkoutSession[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(deviceWorkoutHistoryKey) || "[]");
    return Array.isArray(parsed) ? parsed.map((session) => ({
      ...session,
      exercises: Array.isArray(session.exercises) ? session.exercises.map((exercise: DeviceWorkoutExercise) => ({
        ...exercise,
        sets: Array.isArray(exercise.sets) ? exercise.sets.map((set: DeviceSetLog) => ({ weight: String(set.weight || ""), reps: String(set.reps || ""), completed: Boolean(set.completed) })) : [],
      })) : [],
    })) as DeviceWorkoutSession[] : [];
  } catch {
    return [];
  }
}

export function saveDeviceWorkoutSessions(sessions: DeviceWorkoutSession[]) {
  if (typeof window === "undefined") return;
  const normalized = sessions.map((session) => ({ ...session, exercises: session.exercises.map((exercise) => ({ ...exercise, sets: exercise.sets.map((set) => ({ weight: set.weight, reps: set.reps, completed: set.completed })) })) }));
  window.localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify(normalized));
  window.dispatchEvent(new Event(deviceWorkoutHistoryEvent));
}
