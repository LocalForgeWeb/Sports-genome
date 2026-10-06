import type { ReactNode } from "react";
import "./week-review.css";

export type ReviewScope = "week" | "day";

/**
 * Which of the two things Review can look at is on screen.
 *
 * Review used to mix the two silently: a heading that named the week over four panels that
 * read the open day (5 October 2026 brief §2). The scope is now one explicit control next to
 * the title, and switching it changes the scope alone: not the day Plan has open, not the
 * week, and never Home's next workout.
 */
export function ReviewScopeControl({ scope, onScope }: { scope: ReviewScope; onScope: (scope: ReviewScope) => void }) {
  return <div className="wr-scope" role="group" aria-label="Review scope">
    <button type="button" aria-pressed={scope === "week"} onClick={() => onScope("week")}>Week</button>
    <button type="button" aria-pressed={scope === "day"} onClick={() => onScope("day")}>Day</button>
  </div>;
}

export function ReviewHead({ eyebrow = "Review", title, detail, scope, onScope, children }: { eyebrow?: string; title: string; detail?: string; scope: ReviewScope; onScope: (scope: ReviewScope) => void; children?: ReactNode }) {
  return <header className="wr-head">
    <div className="wr-head-title">
      <p className="metric-label">{eyebrow}</p>
      <h1>{title}</h1>
      {detail && <p className="wr-head-detail">{detail}</p>}
    </div>
    <div className="wr-head-controls">
      <ReviewScopeControl scope={scope} onScope={onScope} />
      {children}
    </div>
  </header>;
}

export type ReviewWeekOption = { week: number; ready: boolean; savedDays: number };

/** The week pills, as Plan draws them, selecting a week without leaving Review. */
export function ReviewWeekPills({ weeks, activeWeek, onSelect }: { weeks: readonly ReviewWeekOption[]; activeWeek: number; onSelect: (week: number) => void }) {
  const ready = weeks.filter((option) => option.ready);
  if (ready.length < 2) return null;
  return <div className="training-plan-weeks wr-weeks" role="group" aria-label="Review week">
    {ready.map(({ week, savedDays }) => <button key={week} type="button" aria-current={week === activeWeek ? "true" : undefined} onClick={() => onSelect(week)} className={`training-plan-week${week === activeWeek ? " training-plan-week-active" : ""}`}>
      Week {week}<small>{savedDays ? `${savedDays} saved` : "Empty"}</small>
    </button>)}
  </div>;
}
