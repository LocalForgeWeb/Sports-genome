import { useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { deviceWorkoutHistoryEvent, loadDeviceWorkoutSessions } from "@/lib/deviceWorkoutLog";
import { exerciseHistory } from "@/lib/sessionRecap";
import type { DisplayWeightUnit } from "@/lib/weightUnits";
import "../exercise-history.css";

/**
 * "Your history" for one exercise (Oct 7 brief H07): the workouts on this device that did it,
 * newest first, each with its sets as logged. Shown in the exercise detail and, between sets, in
 * the live logger - read-only in both, so looking back never changes the set being typed (H09).
 * A row opens that workout's own detail when the host can take the athlete there.
 */
export function ExerciseHistoryList({ exerciseId, exerciseName, weightUnit, limit = 5, onOpenSession, excludeSessionId }: {
  exerciseId?: number;
  exerciseName: string;
  weightUnit: DisplayWeightUnit;
  limit?: number;
  onOpenSession?: (sessionId: string) => void;
  /** The workout being logged, which is not history yet. */
  excludeSessionId?: string;
}) {
  const [sessions, setSessions] = useState(() => loadDeviceWorkoutSessions());
  useEffect(() => {
    const refresh = () => setSessions(loadDeviceWorkoutSessions());
    window.addEventListener(deviceWorkoutHistoryEvent, refresh);
    return () => window.removeEventListener(deviceWorkoutHistoryEvent, refresh);
  }, []);
  const { entries, total } = useMemo(
    () => exerciseHistory({ exerciseName, catalogId: exerciseId }, sessions.filter((session) => session.id !== excludeSessionId), weightUnit, limit),
    [exerciseName, exerciseId, sessions, excludeSessionId, weightUnit, limit],
  );

  if (!entries.length) return <p className="exercise-history-empty">No {exerciseName} in a finished workout on this device yet.</p>;
  return <div className="exercise-history">
    <ol className="exercise-history-list">
      {entries.map((entry) => {
        const when = entry.completedAt.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
        const body = <>
          <span className="exercise-history-when"><strong>{when}</strong> · {entry.dayName}</span>
          <span className="exercise-history-sets">{entry.sets.map((set, index) => <span key={index}>{set.line}{set.detail ? <small> ({set.detail})</small> : null}</span>)}</span>
        </>;
        return <li key={entry.sessionId}>{onOpenSession
          ? <button type="button" onClick={() => onOpenSession(entry.sessionId)} aria-label={`View session: ${entry.dayName}, ${when}`}>{body}<ChevronRight aria-hidden="true" /></button>
          : <div>{body}</div>}</li>;
      })}
    </ol>
    {total > entries.length && <p className="exercise-history-more">{total - entries.length} earlier {total - entries.length === 1 ? "workout" : "workouts"} with {exerciseName} in Progress.</p>}
  </div>;
}
