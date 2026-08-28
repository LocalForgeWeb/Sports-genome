export type DeviceSetLog = { weight: string; reps: string; rpe: string; completed: boolean };
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
    return Array.isArray(parsed) ? parsed as DeviceWorkoutSession[] : [];
  } catch {
    return [];
  }
}

export function saveDeviceWorkoutSessions(sessions: DeviceWorkoutSession[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify(sessions));
  window.dispatchEvent(new Event(deviceWorkoutHistoryEvent));
}
