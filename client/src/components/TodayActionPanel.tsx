import React, { useMemo } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import type { LiveSession } from "@/lib/liveSession";
import { mergeStrengthHistory } from "@/lib/unifiedStrengthHistory";
import { summarizeWithinAthleteStrengthComparisons } from "@/lib/withinAthleteStrengthChange";
import { confirmedChangeEmphasis, leadingConfirmedChange, selectHomePriority } from "@/lib/homeStateSummary";
import { getRegistryReferenceForObservation, type RegistryReferenceProfile } from "@/lib/registryReference";
import { summarizeTrainingWeek, type TrainingSession } from "@/lib/trainingWeekSummary";
import { useAthleteRecord } from "@/lib/athleteRecord";
import type { DisplayWeightUnit } from "@/lib/weightUnits";

/**
 * Home's first viewport, in the order a newcomer needs it:
 *
 *   1. Where you are: Home, with a greeting if the athlete gave a name.
 *   2. One primary action, decided by the actual state - a workout under way
 *      outranks everything; else the next planned workout; else the plan.
 *   3. Your week: planned against completed, both per week; the lifetime
 *      record beside it, labelled as lifetime.
 *   4. One insight about the record, only where there is one to give: a
 *      confirmed change on a lift, or the one measurement that would unlock a
 *      comparison. A first-lift prompt never sits above a workout.
 *
 * Every count comes from `useAthleteRecord`, the same definition Progress and
 * Strength read, so the three screens cannot disagree about the same athlete.
 */

/** Gate reasons the athlete can close themselves; kept in step with homeStateSummary. */
const collectableGateReasons = {
  body_mass_required: true,
  comparison_sex_required: true,
  age_required: true,
  load_required: true,
} as const;

/** "Week 2 · Day 02 · Pull" -> the day's name and where it sits in the plan. */
function splitDayLabel(dayLabel: string) {
  const parts = dayLabel.split(" · ").map((part) => part.trim()).filter(Boolean);
  return { name: parts[parts.length - 1] || dayLabel, position: parts.slice(0, -1).join(" · ") };
}

function greetingFor(name: string | undefined, hour: number): string {
  const time = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return name?.trim() ? `${time}, ${name.trim()}` : time;
}

export type TodayActionPanelProps = {
  stagedExerciseCount: number;
  trainingDays: number;
  activeDayLabel: string;
  live?: LiveSession | null;
  /** Whether any day of the plan holds exercises, so an empty selected day is told apart from no plan. */
  planHasDays?: boolean;
  athleteName?: string;
  directAccess?: boolean;
  weightUnit?: DisplayWeightUnit;
  onOpenTraining: () => void;
  onOpenTracker?: () => void;
  onOpenStrength: () => void;
  onOpenCatalog?: () => void;
  sexForReference?: string;
  birthYear?: number;
  /** For tests: the hour used to pick the greeting. */
  hour?: number;
};

export function TodayActionPanel({ stagedExerciseCount, trainingDays, activeDayLabel, live, planHasDays, athleteName, directAccess = true, weightUnit = "lb", onOpenTraining, onOpenTracker, onOpenStrength, onOpenCatalog, sexForReference, birthYear, hour }: TodayActionPanelProps) {
  const overview = trpc.strengthGenome.overview.useQuery();
  const sessions = trpc.workoutLog.list.useQuery();
  const observations = trpc.strengthGenome.observations.useQuery();
  const trackedSets = trpc.workoutLog.progressionHistory.useQuery();
  const referenceRows = trpc.strengthGenome.referenceRows.useQuery(undefined, { staleTime: 60 * 60 * 1000, refetchOnWindowFocus: false });
  const accountObservations = observations.data || [];
  const accountSessions = (sessions.data || []) as TrainingSession[];
  const record = useAthleteRecord({ directAccess, weightUnit, accountObservations, accountSessions });
  /**
   * "Completed this week" and "planned days" share one scope, the week, so they can
   * be read as a fraction. The lifetime counts beside them are labelled as such.
   * On an account the week is the account's saved sessions; on this device it is
   * the device's finished workouts - the same definition Progress reads.
   */
  const completedThisWeek = directAccess
    ? record.completedThisWeek
    : summarizeTrainingWeek((sessions.data || []) as TrainingSession[], trainingDays).completedThisWeek;
  const liftsLogged = directAccess ? record.liftsLogged : (overview.data?.observationCount ?? record.liftsLogged);
  const hasStagedWorkout = stagedExerciseCount > 0;
  const nextSession = splitDayLabel(activeDayLabel);

  const trackedChanges = useMemo(
    () =>
      summarizeWithinAthleteStrengthComparisons(
        mergeStrengthHistory(accountObservations, trackedSets.data || [])
      ).comparable,
    [accountObservations, trackedSets.data]
  );
  const leadingChange = useMemo(() => leadingConfirmedChange(trackedChanges), [trackedChanges]);
  const changeEmphasis = useMemo(() => leadingChange ? confirmedChangeEmphasis(leadingChange) : null, [leadingChange]);

  const athleteProfile = useMemo<RegistryReferenceProfile>(() => ({ sexForReference, birthYear }), [sexForReference, birthYear]);
  /**
   * The first saved test whose comparison is closed by something the athlete can still
   * supply. Gates the athlete cannot close - no reviewed study, or a study that simply
   * does not report their group - are not a prompt, because there is no action.
   */
  const collectableGate = useMemo(() => {
    const rows = referenceRows.data || [];
    if (rows.length === 0) return null;
    for (const observation of accountObservations) {
      const resolution = getRegistryReferenceForObservation(observation, rows, athleteProfile, new Date(observation.observedAt));
      if (resolution?.status === "unavailable" && resolution.reason in collectableGateReasons) {
        return { reason: resolution.reason, exerciseName: observation.exerciseName };
      }
    }
    return null;
  }, [referenceRows.data, accountObservations, athleteProfile]);

  /**
   * The record prompt, kept to the one case with an action the athlete can take
   * right now: a measurement that would complete a comparison. "Log your first
   * lift" and "stage a day" are not prompts any more - the primary action above
   * already says what to do, and a prompt above a workout under way was the
   * thing a first-time user tripped over.
   */
  const priority = useMemo(
    () => selectHomePriority({ collectableGate, hasConfirmedChange: leadingChange !== null, trackedChangeCount: trackedChanges.length, stagedExerciseCount, observationCount: liftsLogged }),
    [collectableGate, leadingChange, trackedChanges.length, stagedExerciseCount, liftsLogged]
  );
  const recordPrompt = priority.id.startsWith("gate:") ? priority : null;

  const lifetimeLine = `${liftsLogged} ${liftsLogged === 1 ? "lift" : "lifts"} logged · ${record.workoutsRecorded} ${record.workoutsRecorded === 1 ? "workout" : "workouts"} recorded`;

  return <section className="today-action-panel">
    <header className="home-head">
      <p className="metric-label">Home</p>
      <h1>{greetingFor(athleteName, hour ?? new Date().getHours())}</h1>
    </header>

    {live
      ? <div className="today-action-primary today-action-live">
          <div>
            <p className="metric-label">Continue your workout</p>
            <h2>{splitDayLabel(live.dayLabel).name}</h2>
            <p className="today-action-position">{splitDayLabel(live.dayLabel).position}</p>
            <p className="today-action-count">{live.completedSets} of {live.plannedSets} sets logged{live.exerciseName && live.setNumber ? ` · next: ${live.exerciseName}, set ${live.setNumber}` : " · every set logged"}</p>
          </div>
          <div className="today-action-actions">
            <button type="button" onClick={() => (onOpenTracker || onOpenTraining)()} className="today-action-cta">Resume {splitDayLabel(live.dayLabel).name} workout <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
            <button type="button" onClick={() => (onOpenTracker || onOpenTraining)()} className="today-action-secondary">View workout details <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
          </div>
        </div>
      : hasStagedWorkout
        ? <div className="today-action-primary">
            <div>
              <p className="metric-label">Your next workout</p>
              <h2>{nextSession.name}</h2>
              {nextSession.position && <p className="today-action-position">{nextSession.position}</p>}
              <i className="today-action-rule" aria-hidden="true" />
              <p className="today-action-count">{stagedExerciseCount} {stagedExerciseCount === 1 ? "exercise" : "exercises"}</p>
            </div>
            <div className="today-action-actions">
              <button type="button" onClick={() => (onOpenTracker || onOpenTraining)()} className="today-action-cta">Review workout <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
              <button type="button" onClick={onOpenTraining} className="today-action-secondary">Edit plan <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
            </div>
          </div>
        : planHasDays
          ? <div className="today-action-primary today-action-empty">
              <div>
                <p className="metric-label">Your next workout</p>
                <h2>Choose your next workout</h2>
                <p className="today-action-count">{activeDayLabel} is empty. Pick a day that has exercises, or add some to this one.</p>
              </div>
              <div className="today-action-actions">
                <button type="button" onClick={onOpenTraining} className="today-action-cta">Open training plan <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
                {onOpenCatalog && <button type="button" onClick={onOpenCatalog} className="today-action-secondary">Explore exercises <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>}
              </div>
            </div>
          : <div className="today-action-primary today-action-empty">
              <div>
                <p className="metric-label">Your next workout</p>
                <h2>Build training around your goals</h2>
                <p className="today-action-count">No session built yet. Draft one from your sport's actions, or add exercises yourself.</p>
              </div>
              <div className="today-action-actions">
                <button type="button" onClick={onOpenTraining} className="today-action-cta">Create your plan <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
                {onOpenCatalog && <button type="button" onClick={onOpenCatalog} className="today-action-secondary">Explore exercises <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>}
              </div>
            </div>}

    {/* Your week: one fraction whose two numbers share a scope, and the
        lifetime record beside it, each labelled with its scope. Zero is a
        number here, not a verdict. */}
    <section className="home-week" aria-label="Your week">
      <div className="home-section-head"><p className="metric-label">Your week</p><button type="button" className="home-link" onClick={onOpenTraining}>View plan <ArrowRight className="h-4 w-4" aria-hidden="true" /></button></div>
      <p className="home-week-line" aria-label={`${completedThisWeek} of ${trainingDays} planned ${trainingDays === 1 ? "workout" : "workouts"} completed this week`}><b className="stat-figure today-action-figure-accent" aria-hidden="true">{completedThisWeek}</b><span>of <b>{trainingDays}</b> planned {trainingDays === 1 ? "workout" : "workouts"} completed this week</span></p>
      <button type="button" className="home-week-record" onClick={onOpenStrength} aria-label={`${lifetimeLine}, all time. View strength progress`}>{lifetimeLine}<small>all time</small></button>
    </section>

    {/* One insight, only where there is one: a change the model confirms, or the
        one measurement that would complete a comparison. */}
    {leadingChange
      ? <section className="today-action-state" aria-label="Where you are now">
          <p className="metric-label">Where you are now</p>
          <p className="today-action-state-headline" data-sg-change={changeEmphasis?.direction} data-sg-change-intensity={changeEmphasis?.intensity}>
            <strong>{leadingChange.exerciseName}</strong>
            <span className="today-action-state-delta">{leadingChange.relativeChangePercent >= 0 ? "+" : ""}{leadingChange.relativeChangePercent.toFixed(0)}%</span>
            <span className="today-action-state-tag">{changeEmphasis?.direction === "loss" ? "Confirmed decline" : "Confirmed gain"}</span>
          </p>
          <small>Across {leadingChange.observationCount} logs since {leadingChange.firstPoint.observedAt.toLocaleDateString()}. Your own logs only — not a rank against other people.</small>
          <button type="button" className="home-link" onClick={onOpenStrength}>View strength progress <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button>
        </section>
      : recordPrompt
        ? <section className="today-action-priority" aria-label="Next for your record">
            <div>
              <p className="metric-label">Next for your record</p>
              <h2>{recordPrompt.headline}</h2>
              <p>{recordPrompt.detail}</p>
            </div>
            <button type="button" onClick={onOpenStrength} className="today-action-priority-cta">{recordPrompt.ctaLabel} <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></button>
          </section>
        : null}
  </section>;
}
