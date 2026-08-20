export type SessionHistoryItem = { id: number; title: string; startedAt: Date | string; completedSetCount: number; exerciseCount: number; dayLabel?: string | null; goal?: string | null };

export function getSessionHistorySummary(sessions: SessionHistoryItem[]) {
  return sessions.reduce((summary, session) => ({ sessions: summary.sessions + 1, completedSets: summary.completedSets + session.completedSetCount, exercises: summary.exercises + session.exerciseCount }), { sessions: 0, completedSets: 0, exercises: 0 });
}

export function formatSessionDate(value: Date | string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatSessionYear(value: Date | string) {
  return new Date(value).toLocaleDateString(undefined, { year: "numeric" });
}
