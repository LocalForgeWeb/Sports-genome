import { describe, expect, it } from "vitest";
import { getSessionHistorySummary, type SessionHistoryItem } from "./sessionHistory";

describe("session history summary", () => {
  it("aggregates completed sessions, sets, and exercises for timeline context", () => {
    const sessions: SessionHistoryItem[] = [
      { id: 1, title: "Push workout", startedAt: "2026-08-18T12:00:00Z", completedSetCount: 12, exerciseCount: 4 },
      { id: 2, title: "Pull workout", startedAt: "2026-08-19T12:00:00Z", completedSetCount: 15, exerciseCount: 5 },
    ];
    expect(getSessionHistorySummary(sessions)).toEqual({ sessions: 2, completedSets: 27, exercises: 9 });
  });
});
