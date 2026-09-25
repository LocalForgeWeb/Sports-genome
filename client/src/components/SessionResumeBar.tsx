import { ChevronRight, Dot } from "lucide-react";
import type { LiveSession } from "@/lib/liveSession";

/**
 * The workout you are in the middle of, on every screen that is not it.
 *
 * Leaving the tracker used to lose the session from view entirely: nothing on
 * Plan, the week board, or Home said one was running, so "where was I" meant
 * remembering which tab it had been on and that there was anything to go back
 * to. A live workout is the most important thing on the device while it lasts,
 * and it was the only thing the app would not tell you about.
 *
 * It sits above the dock rather than inside the page, because it has to survive
 * the scroll and the navigation - the whole point is that it is there when you
 * have gone somewhere else. It is one tap, it never covers the dock, and it is
 * gone the moment the session is finished.
 */
export function SessionResumeBar({ live, onResume }: { live: LiveSession; onResume: () => void }) {
  const done = live.completedSets;
  const total = live.plannedSets;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  // What is in front of you right now, or the fact that nothing is.
  const now = live.exerciseName && live.setNumber && live.setCount
    ? `${live.exerciseName} · set ${live.setNumber} of ${live.setCount}`
    : "Every set logged — finish when you are ready";

  return (
    <button
      type="button"
      className="session-resume-bar"
      onClick={onResume}
      aria-label={`Resume your workout. ${live.dayLabel}, ${done} of ${total} sets logged. Now: ${now}`}
    >
      <span className="session-resume-dial" aria-hidden="true">
        <i style={{ width: `${percent}%` }} />
      </span>
      <span className="session-resume-copy">
        <strong>
          <Dot className="h-4 w-4" aria-hidden="true" />
          Workout under way
          <em>{done}/{total} sets</em>
        </strong>
        <small>{now}</small>
      </span>
      <span className="session-resume-action">Resume <ChevronRight className="h-4 w-4" aria-hidden="true" /></span>
    </button>
  );
}
