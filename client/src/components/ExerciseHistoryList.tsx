import { useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { deviceWorkoutHistoryEvent, loadDeviceWorkoutSessions } from "@/lib/deviceWorkoutLog";
import { exerciseHistory, historyByProtocol, type ExerciseHistoryEntry } from "@/lib/sessionRecap";
import type { DisplayWeightUnit } from "@/lib/weightUnits";
import "../exercise-history.css";

/**
 * "Your history" for one exercise (Oct 7 brief H07): the workouts on this device that did it,
 * newest first, each with its sets as logged. Shown in the exercise detail and, between sets, in
 * the live logger - read-only in both, so looking back never changes the set being typed (H09).
 * A row opens that workout's own detail when the host can take the athlete there.
 *
 * On a row with setup values (the Zercher, neck and bench rows) each workout says the setup it
 * was done with, and workouts done with different setups are listed apart, under the setup they
 * share: a set is compared only with sets done the same way (sessionRecap `historyByProtocol`).
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

  const groups = useMemo(() => historyByProtocol(entries), [entries]);

  if (!entries.length) return <p className="exercise-history-empty">No {exerciseName} in a finished workout on this device yet.</p>;
  const list = (items: readonly ExerciseHistoryEntry[], label?: string) => <ol className="exercise-history-list" aria-label={label}>
    {items.map((entry) => {
      const when = entry.completedAt.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
      const body = <>
        <span className="exercise-history-when"><strong>{when}</strong> · {entry.dayName}</span>
        {groups.length === 1 && entry.setup && <span className="exercise-history-setup">{entry.setup}</span>}
        <span className="exercise-history-sets">{entry.sets.map((set, index) => <span key={index}>{set.line}{set.detail ? <small> ({set.detail})</small> : null}</span>)}</span>
      </>;
      return <li key={entry.sessionId}>{onOpenSession
        ? <button type="button" onClick={() => onOpenSession(entry.sessionId)} aria-label={`View session: ${entry.dayName}, ${when}`}>{body}<ChevronRight aria-hidden="true" /></button>
        : <div>{body}</div>}</li>;
    })}
  </ol>;
  return <div className="exercise-history">
    {groups.length > 1
      ? <>
        <p className="exercise-history-protocols">Different setups are listed apart: a set compares only with sets done the same way.</p>
        {groups.map((group) => <section key={group.protocolKey ?? ""} className="exercise-history-protocol">
          <h4>{group.setup ?? "Setup not recorded"}</h4>
          {list(group.entries, group.setup ?? "Setup not recorded")}
        </section>)}
      </>
      : list(entries)}
    {total > entries.length && <p className="exercise-history-more">{total - entries.length} earlier {total - entries.length === 1 ? "workout" : "workouts"} with {exerciseName} in Progress.</p>}
  </div>;
}
