import React, { useMemo } from "react";
import { ArrowUpRight, ClipboardCheck, Dumbbell, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { mergeStrengthHistory } from "@/lib/unifiedStrengthHistory";
import { summarizeWithinAthleteStrengthComparisons } from "@/lib/withinAthleteStrengthChange";
import { confirmedChangeEmphasis, leadingConfirmedChange, selectHomePriority } from "@/lib/homeStateSummary";
import { getRegistryReferenceForObservation, type RegistryReferenceProfile } from "@/lib/registryReference";

/**
 * Home's scan layer.
 *
 * The philosophy's primary Home rule is that the first viewport answers three
 * questions: current state and meaningful change, the highest-priority thing to
 * attend to, and the next best action. This panel carries all three, in that order.
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

export function TodayActionPanel({ stagedExerciseCount, trainingDays, activeDayLabel, onOpenTraining, onOpenStrength, sexForReference, birthYear }: { stagedExerciseCount: number; trainingDays: number; activeDayLabel: string; onOpenTraining: () => void; onOpenStrength: () => void; sexForReference?: string; birthYear?: number }) {
  const overview = trpc.strengthGenome.overview.useQuery();
  const sessions = trpc.workoutLog.list.useQuery();
  const observations = trpc.strengthGenome.observations.useQuery();
  const trackedSets = trpc.workoutLog.progressionHistory.useQuery();
  const referenceRows = trpc.strengthGenome.referenceRows.useQuery(undefined, { staleTime: 60 * 60 * 1000, refetchOnWindowFocus: false });
  const completedCount = sessions.data?.filter(session => session.status === "completed").length || 0;
  const hasStagedWorkout = stagedExerciseCount > 0;
  const weekdayLabels = ["M", "T", "W", "T", "F", "S", "S"];

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
   * the same sentence twice.
   *
   * The state slot read "No tracked lifts yet / Log the same lift twice and your
   * change starts tracking here", and the priority slot directly beneath it read
   * "Log your first lift / Nothing is recorded yet, so there is no state to
   * interpret". Home opened with two stacked banners saying nothing is recorded,
   * and pushed the staged training day - the one thing the athlete could act on
   * today - down behind them.
   *
   * The priority slot already carries this state and carries a way out of it, so
   * it keeps the slot alone. Every other case leaves the state block in place:
   * even "N lifts tracked, no confirmed change yet" reports a count the priority
   * does not.
   */
  const stateRestatesPriority = priority.id === "first-lift";

  return <section className="today-action-panel">
    {!stateRestatesPriority && <div className="today-action-state">
      <p className="metric-label !text-[#adc4dc]">Where you are now</p>
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
        <p className="metric-label !text-[#adc4dc]">Where attention goes · {postureLabel[priority.posture]}</p>
        <h2>{priority.headline}</h2>
        <p>{priority.detail}</p>
      </div>
      <button type="button" onClick={priority.target === "strength" ? onOpenStrength : onOpenTraining} className="today-action-priority-cta">{priority.ctaLabel} <ArrowUpRight className="h-4 w-4" /></button>
    </div>
    <div className="today-action-primary"><div><p className="metric-label !text-[#adc4dc]">Today / next action</p><h2>{hasStagedWorkout ? "Your training day is staged." : "Choose the next useful move."}</h2><p>{hasStagedWorkout ? `${stagedExerciseCount} exercises are staged for ${activeDayLabel}. Review the prescription, then start when you are ready.` : "No workout is staged yet. Design one from your available equipment and current sport context."}</p></div><button type="button" onClick={onOpenTraining} className="today-action-cta">{hasStagedWorkout ? "Open training day" : "Design training day"} <ArrowUpRight className="h-4 w-4" /></button></div>
    <div className="today-action-rhythm" aria-label={`${trainingDays} training days you chose for this weekly plan`}><span>Weekly plan rhythm</span><div>{weekdayLabels.map((label, index) => <i key={`${label}-${index}`} className={index < trainingDays ? "today-rhythm-planned" : ""} aria-hidden="true">{label}</i>)}</div><small>{trainingDays} days you chose · not a completion or readiness score</small></div>
    {/* The figure is the fact. These read "5 planned days" in body type, with the
        number the same size as the words around it and a subtitle underneath
        restating the label - "your weekly rhythm" under "planned days". The
        number now carries the display face at a size you read from a distance,
        which is the treatment Progress already gives the same quantities. */}
    <div className="today-action-facts"><div><Dumbbell className="h-4 w-4" /><p><b className="stat-figure">{trainingDays}</b><strong>planned days</strong></p></div><div><ClipboardCheck className="h-4 w-4" /><p><b className="stat-figure">{completedCount}</b><strong>completed sessions</strong></p></div><button type="button" onClick={onOpenStrength}><Sparkles className="h-4 w-4" /><p><b className="stat-figure">{overview.data?.observationCount || 0}</b><strong>lifts logged</strong>{!overview.data?.observationCount && <span>log your first</span>}</p><ArrowUpRight className="h-4 w-4" /></button></div>
  </section>;
}
