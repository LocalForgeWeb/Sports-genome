/**
 * What the athlete has actually done this week.
 *
 * The dashboard could tell you what to do next and how many movement records were
 * in the database, but nothing about your own last seven days - so a returning
 * athlete had no way to see whether they were on track, and an interrupted session
 * was invisible until they went hunting for it.
 *
 * Everything here is counted from saved sessions. Nothing is inferred, and a week
 * with no training reports zero rather than an encouraging number.
 */

export type TrainingSession = {
  id: number;
  title: string;
  dayLabel?: string | null;
  status: "active" | "completed" | "abandoned" | string;
  startedAt: string | Date;
  completedAt?: string | Date | null;
  exerciseCount?: number;
  completedSetCount?: number;
};

export type TrainingWeekSummary = {
  /** Sessions finished since the start of the week. */
  completedThisWeek: number;
  /** Training days the athlete chose, for context rather than judgement. */
  plannedDays: number;
  /** Sets logged this week across those sessions. */
  setsThisWeek: number;
  /** A session left open - the athlete can pick it straight back up. */
  resumable: TrainingSession | null;
  /** The most recent finished session, whenever it was. */
  lastCompleted: TrainingSession | null;
  /** Whole days since that session finished, or null when nothing is finished. */
  daysSinceLastSession: number | null;
};

const dayMs = 24 * 60 * 60 * 1000;

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Monday 00:00 in local time, which is where a training week starts for most plans. */
export function startOfTrainingWeek(now: Date): Date {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // getDay() is 0 for Sunday, which belongs to the week that began six days earlier.
  const offset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - offset);
  return start;
}

export function summarizeTrainingWeek(
  sessions: readonly TrainingSession[],
  plannedDays: number,
  now: Date = new Date()
): TrainingWeekSummary {
  const weekStart = startOfTrainingWeek(now);

  let completedThisWeek = 0;
  let setsThisWeek = 0;
  let resumable: TrainingSession | null = null;
  let lastCompleted: TrainingSession | null = null;

  for (const session of sessions) {
    const started = toDate(session.startedAt);
    const finished = toDate(session.completedAt);

    if (session.status === "completed") {
      // A session counts for the week it finished in, not the week it opened.
      const marker = finished ?? started;
      if (marker && marker >= weekStart) {
        completedThisWeek += 1;
        setsThisWeek += session.completedSetCount || 0;
      }
      const bestSoFar = toDate(lastCompleted?.completedAt ?? lastCompleted?.startedAt);
      if (marker && (!bestSoFar || marker > bestSoFar)) lastCompleted = session;
    }

    if (session.status === "active") {
      const bestSoFar = toDate(resumable?.startedAt);
      if (started && (!bestSoFar || started > bestSoFar)) resumable = session;
    }
  }

  const lastMarker = toDate(lastCompleted?.completedAt ?? lastCompleted?.startedAt);
  const daysSinceLastSession = lastMarker
    ? Math.max(0, Math.floor((now.getTime() - lastMarker.getTime()) / dayMs))
    : null;

  return {
    completedThisWeek,
    plannedDays,
    setsThisWeek,
    resumable,
    lastCompleted,
    daysSinceLastSession,
  };
}

/**
 * How long ago, in the words someone would actually use.
 *
 * "3 days ago" is what an athlete reads; a timestamp is what a database stores.
 */
export function relativeDayLabel(days: number | null): string {
  if (days === null) return "";
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "last week";
  return `${Math.floor(days / 7)} weeks ago`;
}
