import React from "react";
import { ArrowUpRight, CalendarCheck, PlayCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { relativeDayLabel, summarizeTrainingWeek, type TrainingSession } from "@/lib/trainingWeekSummary";

/**
 * The dashboard's "what have I actually done" layer.
 *
 * Home told the athlete what to do next and how many movement records existed in
 * the library, but nothing about their own week. An interrupted session was the
 * worst of it: it stayed open with no way back to it from here.
 *
 * Counts come from saved sessions only. A week with no training says zero.
 */
export function TrainingWeekPanel({ plannedDays, onOpenTracker, onOpenProgress }: {
  plannedDays: number;
  onOpenTracker: () => void;
  onOpenProgress: () => void;
}) {
  const sessions = trpc.workoutLog.list.useQuery();
  const summary = summarizeTrainingWeek((sessions.data || []) as TrainingSession[], plannedDays);
  const { completedThisWeek, setsThisWeek, resumable, lastCompleted, daysSinceLastSession } = summary;

  return <section className="training-week-panel">
    <div className="training-week-head">
      <div>
        <p className="metric-label">This week</p>
        <h2>{completedThisWeek} of {plannedDays} sessions done</h2>
      </div>
      <button type="button" onClick={onOpenProgress} className="training-week-link">
        Progress <ArrowUpRight className="h-4 w-4" />
      </button>
    </div>

    {/* Seven marks, one per planned day, filled by sessions actually finished. */}
    <div className="training-week-track" aria-label={`${completedThisWeek} of ${plannedDays} planned sessions completed this week`}>
      {Array.from({ length: Math.max(plannedDays, 1) }).map((_, index) => (
        <i key={index} className={index < completedThisWeek ? "is-done" : ""} aria-hidden="true" />
      ))}
    </div>

    {/* A session left open is the one thing here that is urgent, so it leads. */}
    {resumable && <button type="button" onClick={onOpenTracker} className="training-week-resume">
      <PlayCircle className="h-5 w-5" />
      <span>
        <strong>Pick up where you left off</strong>
        <small>{resumable.title}{resumable.dayLabel ? ` · ${resumable.dayLabel}` : ""}</small>
      </span>
      <ArrowUpRight className="h-4 w-4" />
    </button>}

    <div className="training-week-facts">
      <div>
        <CalendarCheck className="h-4 w-4" />
        <p>
          <b className="stat-figure">{setsThisWeek}</b>
          <strong>sets this week</strong>
        </p>
      </div>
      <div>
        <p>
          <strong>{lastCompleted ? lastCompleted.title : "No session yet"}</strong>
          <span>{lastCompleted ? `last session · ${relativeDayLabel(daysSinceLastSession)}` : "no sessions yet"}</span>
        </p>
      </div>
    </div>
  </section>;
}
