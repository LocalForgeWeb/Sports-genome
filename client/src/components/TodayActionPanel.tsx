import React, { useMemo } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import type { LiveSession } from "@/lib/liveSession";
import { mergeStrengthHistory } from "@/lib/unifiedStrengthHistory";
import { summarizeWithinAthleteStrengthComparisons } from "@/lib/withinAthleteStrengthChange";
import { confirmedChangeEmphasis, leadingConfirmedChange, selectHomePriority } from "@/lib/homeStateSummary";
import { getRegistryReferenceForObservation, type RegistryReferenceProfile } from "@/lib/registryReference";
import { summarizeTrainingWeek, type TrainingSession } from "@/lib/trainingWeekSummary";

/**
 * Home's first viewport.
 *
 * The philosophy's primary Home rule is that the first viewport answers three
 * questions: current state and meaningful change, the highest-priority thing to
 * attend to, and the next best action. This panel carries all three, in that
 * order - the first two as single lines, so the third, the next session, is the
 * thing the eye lands on: its day, its place in the plan, its size, and Review
 * session / Edit plan, which refer to the same day.
 *
 * The change line is deliberately narrow. Only a change the within-athlete model
 * rates `meaningful_change_supported` gets a direction; anything below that
 * threshold sits inside estimator noise, and the trend-credibility rule is that
 * ordinary variation must not be narrated as progress. Everything else reports what
 * is tracked without inventing a story about it.
 */

/** Gate reasons the athlete can close themselves; kept in step with homeStateSummary. */
const collectableGateReasons = {
  body_mass_required: true,
  comparison_sex_required: true,
  age_required: true,
  load_required: true,
} as const;

/** The posture names the philosophy uses for the action mode uncertainty selects. */
const postureLabel = { act: "Act", inspect: "Inspect", measure: "Measure" } as const;

/** "Week 2 · Day 02 · Pull" -> the day's name and where it sits in the plan. */
function splitDayLabel(dayLabel: string) {
  const parts = dayLabel.split(" · ").map((part) => part.trim()).filter(Boolean);
  return { name: parts[parts.length - 1] || dayLabel, position: parts.slice(0, -1).join(" · ") };
}

export function TodayActionPanel({ stagedExerciseCount, trainingDays, activeDayLabel, live, onOpenTraining, onOpenTracker, onOpenStrength, sexForReference, birthYear }: { stagedExerciseCount: number; trainingDays: number; activeDayLabel: string; live?: LiveSession | null; onOpenTraining: () => void; onOpenTracker?: () => void; onOpenStrength: () => void; sexForReference?: string; birthYear?: number }) {
  const overview = trpc.strengthGenome.overview.useQuery();
  const sessions = trpc.workoutLog.list.useQuery();
  const observations = trpc.strengthGenome.observations.useQuery();
  const trackedSets = trpc.workoutLog.progressionHistory.useQuery();
  const referenceRows = trpc.strengthGenome.referenceRows.useQuery(undefined, { staleTime: 60 * 60 * 1000, refetchOnWindowFocus: false });
  /**
   * "Completed this week" is the app's own week (Monday, local time) counted from
   * saved sessions - a different scope from the lifetime record count beside it,
   * and from the planned days the athlete chose. Zero is a number, not a verdict.
   */
  const completedThisWeek = summarizeTrainingWeek((sessions.data || []) as TrainingSession[], trainingDays).completedThisWeek;
  const hasStagedWorkout = stagedExerciseCount > 0;
  const nextSession = splitDayLabel(activeDayLabel);

  const trackedChanges = useMemo(
    () =>
      summarizeWithinAthleteStrengthComparisons(
        mergeStrengthHistory(observations.data || [], trackedSets.data || [])
      ).comparable,
    [observations.data, trackedSets.data]
  );
  const leadingChange = useMemo(() => leadingConfirmedChange(trackedChanges), [trackedChanges]);
  /** Direction and intensity for the reveal; see confirmedChangeEmphasis for the rules. */
  const changeEmphasis = useMemo(() => leadingChange ? confirmedChangeEmphasis(leadingChange) : null, [leadingChange]);

  const athleteProfile = useMemo<RegistryReferenceProfile>(() => ({ sexForReference, birthYear }), [sexForReference, birthYear]);
  /**
   * The first saved test whose comparison is closed by something the athlete can still
   * supply. Gates the athlete cannot close - no reviewed study, or a study that simply
   * does not report their group - are not a priority, because there is no action.
   */
  const collectableGate = useMemo(() => {
    const rows = referenceRows.data || [];
    if (rows.length === 0) return null;
    for (const observation of observations.data || []) {
      const resolution = getRegistryReferenceForObservation(
        observation,
        rows,
        athleteProfile,
        new Date(observation.observedAt)
      );
      if (resolution?.status === "unavailable" && resolution.reason in collectableGateReasons) {
        return { reason: resolution.reason, exerciseName: observation.exerciseName };
      }
    }
    return null;
  }, [referenceRows.data, observations.data, athleteProfile]);

  const priority = useMemo(
    () =>
      selectHomePriority({
        collectableGate,
        hasConfirmedChange: leadingChange !== null,
        trackedChangeCount: trackedChanges.length,
        stagedExerciseCount,
        observationCount: (observations.data || []).length,
      }),
    [collectableGate, leadingChange, trackedChanges.length, stagedExerciseCount, observations.data]
  );

  /**
   * With nothing on record, "where you are now" and "where attention goes" are
   * the same sentence twice, so the priority slot - the one that carries a way
   * out - keeps the slot alone. Every other case leaves the state line in place:
   * even "N lifts tracked, no confirmed change yet" reports a count the priority
   * does not.
   */
  const stateRestatesPriority = priority.id === "first-lift";

  return <section className="today-action-panel">
    {!stateRestatesPriority && <div className="today-action-state">
      <p className="metric-label">Where you are now</p>
      {leadingChange
        ? <>
            <p
              className="today-action-state-headline"
              data-sg-change={changeEmphasis?.direction}
              data-sg-change-intensity={changeEmphasis?.intensity}
            >
              <strong>{leadingChange.exerciseName}</strong>
              <span className="today-action-state-delta">{leadingChange.relativeChangePercent >= 0 ? "+" : ""}{leadingChange.relativeChangePercent.toFixed(0)}%</span>
              <span className="today-action-state-tag">{changeEmphasis?.direction === "loss" ? "Confirmed decline" : "Confirmed gain"}</span>
            </p>
            <small>Across {leadingChange.observationCount} logs since {leadingChange.firstPoint.observedAt.toLocaleDateString()}. Your own logs only — not a rank against other people.</small>
          </>
        : <>
            <p className="today-action-state-headline">
              <strong>{trackedChanges.length ? `${trackedChanges.length} ${trackedChanges.length === 1 ? "lift" : "lifts"} tracked` : "No tracked lifts yet"}</strong>
            </p>
            <small>{trackedChanges.length
              ? "No change yet is large enough to call a real one rather than normal variation."
              : "Log the same lift twice and your change starts tracking here."}</small>
          </>}
    </div>}
    <div className={`today-action-priority today-action-priority-${priority.posture}`}>
      <div>
        <p className="metric-label">Where attention goes · {postureLabel[priority.posture]}</p>
        <h2>{priority.headline}</h2>
        <p>{priority.detail}</p>
      </div>
      <button type="button" onClick={priority.target === "strength" ? onOpenStrength : onOpenTraining} className="today-action-priority-cta">{priority.ctaLabel} <ArrowUpRight className="h-4 w-4" /></button>
    </div>
    {/* The next session, as the handoff draws it: the day's name as the title,
        its place in the plan and its size under it, one primary action and one
        secondary, both about this same day. A workout that is happening outranks
        anything this could suggest; a plan with nothing built offers to build it
        rather than a session that does not exist. */}
    {live
      ? <div className="today-action-primary today-action-live">
          <div>
            <p className="metric-label">Your session · in progress</p>
            <h2>{splitDayLabel(live.dayLabel).name}</h2>
            <p className="today-action-position">{splitDayLabel(live.dayLabel).position}</p>
            <p className="today-action-count">{live.completedSets} of {live.plannedSets} sets logged{live.exerciseName && live.setNumber ? ` · next: ${live.exerciseName}, set ${live.setNumber}` : ""}</p>
          </div>
          <div className="today-action-actions"><button type="button" onClick={() => (onOpenTracker || onOpenTraining)()} className="today-action-cta">Back to the workout <ArrowRight className="h-4 w-4" aria-hidden="true" /></button></div>
        </div>
      : hasStagedWorkout
        ? <div className="today-action-primary">
            <div>
              <p className="metric-label">Your next session</p>
              <h2>{nextSession.name}</h2>
              {nextSession.position && <p className="today-action-position">{nextSession.position}</p>}
              <i className="today-action-rule" aria-hidden="true" />
              <p className="today-action-count">{stagedExerciseCount} {stagedExerciseCount === 1 ? "exercise" : "exercises"}</p>
            </div>
            <div className="today-action-actions">
              <button type="button" onClick={() => (onOpenTracker || onOpenTraining)()} className="today-action-cta">Review session <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
              <button type="button" onClick={onOpenTraining} className="today-action-secondary">Edit plan <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
            </div>
          </div>
        : <div className="today-action-primary today-action-empty">
            <div>
              <p className="metric-label">Your next session</p>
              <h2>No session built yet</h2>
              <p className="today-action-count">{activeDayLabel} is empty. Build it from your sport's actions, or draft one in a tap.</p>
            </div>
            <div className="today-action-actions"><button type="button" onClick={onOpenTraining} className="today-action-cta">Create your plan <ArrowRight className="h-4 w-4" aria-hidden="true" /></button></div>
          </div>}
    {/* Three quiet facts with three different scopes: the days chosen for the
        plan, the sessions finished since Monday, the lifts ever logged. None is
        a readiness score, and none is a judgement of the others. */}
    <div className="today-action-facts" aria-label={`${trainingDays} planned days, ${completedThisWeek} completed this week, ${overview.data?.observationCount || 0} lifts logged`}>
      <div><b className="stat-figure today-action-figure-accent">{trainingDays}</b><strong>Planned days</strong></div>
      <div><b className="stat-figure">{completedThisWeek}</b><strong>Completed this week</strong></div>
      <button type="button" onClick={onOpenStrength}><b className="stat-figure">{overview.data?.observationCount || 0}</b><strong>Lifts logged</strong></button>
    </div>
  </section>;
}
