import { plural } from "@/lib/plural";
import React, { useMemo } from "react";
import { ArrowRight, ArrowUpRight, Circle, CircleArrowRight, CircleCheck, CirclePlay, type LucideIcon } from "lucide-react";
import { trpc } from "@/lib/trpc";
import type { LiveSession } from "@/lib/liveSession";
import { mergeStrengthHistory } from "@/lib/unifiedStrengthHistory";
import { summarizeWithinAthleteStrengthComparisons } from "@/lib/withinAthleteStrengthChange";
import { confirmedChangeEmphasis, leadingConfirmedChange, selectHomePriority } from "@/lib/homeStateSummary";
import { directedChangeStateLabel } from "@/lib/changeStateCopy";
import { getRegistryReferenceForObservation, type RegistryReferenceProfile } from "@/lib/registryReference";
import type { TrainingSession } from "@/lib/trainingWeekSummary";
import { useAthleteRecord } from "@/lib/athleteRecord";
import type { DisplayWeightUnit } from "@/lib/weightUnits";
import { AnatomyFigure } from "@/components/anatomy/AnatomyFigure";
import { dayExerciseCount, emptyDayStore, type DaySlot, type WeeklyDayStore } from "@/lib/trainingDayPlan";
import { resolveNextWorkout, slotOfDayLabel, slotsDoneThisWeek, trainingWeekFor, type NextWorkoutChoice } from "@/lib/nextWorkout";
import { getGoalPrescription, type TrainingGoal } from "@/lib/workoutPlanner";
import { parseSetCount } from "@/lib/sessionVolume";
import { focusFrames, focusSummary, workoutFocus } from "@/lib/workoutFocus";
import { dayFigureFor } from "@/lib/dayFigures";

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

/** What Home reads to decide the next workout; never the day Plan happens to be showing (nextWorkout.ts). */
export type TodayPlan = {
  /** False while the saved plan is still being read: the module holds its shape and says nothing it could be wrong about. */
  ready: boolean;
  slots: readonly DaySlot[];
  /** Every saved plan week, with the day being edited written into its own week. */
  weeks: Readonly<Record<number, WeeklyDayStore>>;
  choice: NextWorkoutChoice | null;
};

export type TodayActionPanelProps = {
  plan: TodayPlan;
  live?: LiveSession | null;
  athleteName?: string;
  directAccess?: boolean;
  weightUnit?: DisplayWeightUnit;
  /** The training goal, for set counts a day has not set (the Plan's own fallback). */
  goal?: TrainingGoal;
  /** Opens a plan day: the tracker ready to start it, or Plan to edit it. */
  onOpenWorkout: (week: number, index: number, target: "tracker" | "day-plan") => void;
  onOpenTraining: () => void;
  onOpenTracker?: () => void;
  onOpenStrength: () => void;
  onOpenCatalog?: () => void;
  sexForReference?: string;
  birthYear?: number;
  /** For tests: the hour used to pick the greeting. */
  hour?: number;
  /** Where a completed workout's record lives. */
  onOpenProgress?: () => void;
};

export type PlanDayState = "live" | "trained" | "next" | "planned";
const planDayWord: Record<PlanDayState, string> = { live: "under way", trained: "done this week", next: "next up", planned: "planned" };
/** One icon shape per state, so a day reads the same without colour: done, under way, next, still to come. */
const planDayIcon: Record<PlanDayState, LucideIcon> = { trained: CircleCheck, live: CirclePlay, next: CircleArrowRight, planned: Circle };
const noWeek = emptyDayStore();

export function TodayActionPanel({ plan, live, athleteName, directAccess = true, weightUnit = "lb", goal = "Athleticism", onOpenWorkout, onOpenTraining, onOpenTracker, onOpenStrength, onOpenCatalog, sexForReference, birthYear, hour, onOpenProgress }: TodayActionPanelProps) {
  // Account-only routes, asked only when an account is the source. On the device stores they
  // were refused as unauthorised on every Home open, and each refusal told an athlete who
  // had never signed in that their sign-in had expired (B233).
  const sessions = trpc.workoutLog.list.useQuery(undefined, { enabled: !directAccess });
  const observations = trpc.strengthGenome.observations.useQuery(undefined, { enabled: !directAccess });
  const trackedSets = trpc.workoutLog.progressionHistory.useQuery(undefined, { enabled: !directAccess });
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
  // One definition for every count (B155, B265): the record, which already reads the
  // account's lifts and sessions when the account is the source. The account branch used to
  // count typed lifts only, and a different set of sessions, from Progress.
  const liftsLogged = record.liftsLogged;

  /**
   * The next workout, resolved once; the title, count, focus figure, actions and the strip all
   * read this one result, so they cannot describe different days (Sep 28 regression brief §4).
   * The week trained from is an explicit choice's, else the latest session's, else Week 1.
   */
  const weekNumbers = useMemo(() => Object.keys(plan.weeks).map(Number), [plan.weeks]);
  const trainingWeek = useMemo(() => trainingWeekFor({ choice: plan.choice, latestSessionDayLabel: record.latestSessionDayLabel, weeks: weekNumbers }), [plan.choice, record.latestSessionDayLabel, weekNumbers]);
  const weekStore = plan.weeks[trainingWeek] ?? noWeek;
  const next = useMemo(() => resolveNextWorkout({ ready: plan.ready, week: trainingWeek, slots: plan.slots, store: weekStore, completions: record.completionsThisWeek, choice: plan.choice }), [plan.ready, trainingWeek, plan.slots, weekStore, record.completionsThisWeek, plan.choice]);
  const nextWorkout = next.kind === "workout" || next.kind === "weekComplete" ? next : null;
  const nextExercises = useMemo(() => nextWorkout ? weekStore.plan[nextWorkout.slot.key] ?? [] : [], [nextWorkout, weekStore]);

  /**
   * The week, in plan slots: done this calendar week (by slot, whichever plan week the session
   * was started from), under way, next, or still to come. The fraction counts the same slots, so
   * its number always equals the checked chips; sessions beyond them are said separately.
   */
  const doneSlots = useMemo(() => slotsDoneThisWeek(record.completionsThisWeek), [record.completionsThisWeek]);
  const liveSlot = live ? slotOfDayLabel(live.dayLabel) : null;
  const planDays = useMemo(() => plan.slots.map((slot) => ({ slot, key: `${slot.ordinal} · ${slot.day}`, exerciseCount: dayExerciseCount(weekStore, slot.key) })), [plan.slots, weekStore]);
  const plannedDone = planDays.filter((day) => doneSlots.has(day.key)).length;
  const unbuiltDays = planDays.filter((day) => !day.exerciseCount).length;
  const moreThisWeek = Math.max(0, record.completedThisWeek - plannedDone);
  const stateForDay = (day: { slot: DaySlot; key: string }): PlanDayState =>
    liveSlot === day.key ? "live" : doneSlots.has(day.key) ? "trained" : !live && next.kind === "workout" && next.slot.index === day.slot.index ? "next" : "planned";

  /**
   * Workout focus: where the next workout's direct work lands, ranked by its sets (the day's own
   * prescriptions, else the goal default the Plan shows), with one figure turned and cropped to
   * that work. Planned focus only: never a rank, readiness or measured activation (§6).
   */
  const focus = useMemo(() => {
    if (!nextWorkout) return null;
    const prescriptions = weekStore.prescriptions[nextWorkout.slot.key] ?? {};
    return workoutFocus(nextExercises, (exercise, index) => parseSetCount(prescriptions[exercise.id] || getGoalPrescription(goal, index)));
  }, [nextWorkout, nextExercises, weekStore, goal]);
  const focusLine = focusSummary(focus);
  const focusFigure = next.kind === "workout" && !live ? focus?.figure ?? null : null;
  /**
   * The day's own figure artwork (lib/dayFigures), chosen by the day's name: the supplied
   * front-and-back illustration with the day's muscles in orange. A day whose artwork has not
   * been supplied keeps the planned-focus schematic below, which is drawn from the exercises.
   */
  const dayArt = next.kind === "workout" && !live ? dayFigureFor(next.slot.day) : null;
  const focusCaption = focus && focusFigure ? `Planned workout focus, ${focusFigure.side} view: ${focus.regions.map((region) => region.label).join(", ")}. From the exercises' primary muscles; not a strength rank, recovery readiness or measured activation.` : "";

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
    () => selectHomePriority({ collectableGate, hasConfirmedChange: leadingChange !== null, trackedChangeCount: trackedChanges.length, stagedExerciseCount: next.kind === "workout" ? next.exerciseCount : 0, observationCount: liftsLogged }),
    [collectableGate, leadingChange, trackedChanges.length, next, liftsLogged]
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
            <p className="today-action-count">{live.completedSets} of {plural(live.plannedSets, "set")} logged{live.exerciseName && live.setNumber ? ` · next: ${live.exerciseName}, set ${live.setNumber}` : " · every set logged"}</p>
          </div>
          <div className="today-action-actions">
            <button type="button" onClick={() => (onOpenTracker || onOpenTraining)()} className="today-action-cta">Resume {splitDayLabel(live.dayLabel).name} workout <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
            <button type="button" onClick={() => (onOpenTracker || onOpenTraining)()} className="today-action-secondary">View workout details <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
          </div>
        </div>
      : next.kind === "loading"
        ? <div className="today-action-primary today-action-loading" role="status" aria-label="Loading your plan">
            <div>
              <p className="metric-label">Your next workout</p>
              <span className="today-action-loading-title" />
              <span style={{ width: "40%" }} />
            </div>
            <span className="today-action-loading-cta" />
          </div>
      : next.kind === "workout"
        ? <div className={`today-action-primary${dayArt || focusFigure ? " today-action-with-focus" : ""}${dayArt ? " today-action-with-art" : ""}`}>
            <div className="today-action-copy">
              <p className="metric-label">Your next workout</p>
              <h2>{next.slot.day}</h2>
              <p className="today-action-position">Week {next.week} · {next.slot.ordinal}</p>
              <i className="today-action-rule" aria-hidden="true" />
              <p className="today-action-count">{next.exerciseCount} {next.exerciseCount === 1 ? "exercise" : "exercises"}</p>
              {focusLine && <p className="today-action-focus-line"><span>Workout focus</span> {focusLine}</p>}
            </div>
            {/* The day's figure: its supplied artwork where there is one, captioned with the
                muscles it highlights; otherwise the schematic of planned involvement - the
                exercises' primary muscles - drawn in the action colour so it cannot be read as
                a Strength rank. The focus line in the copy reads from the exercises either way. */}
            {dayArt
              ? <figure className="today-action-focus today-action-art">
                  <img src={dayArt.src} width={dayArt.width} height={dayArt.height} alt={dayArt.alt} decoding="async" />
                  <figcaption>{dayArt.muscles}</figcaption>
                </figure>
              : focusFigure && <figure className="today-action-focus">
              <AnatomyFigure view={focusFigure.side} frame={focusFrames[focusFigure.side][focusFigure.frame]} roles={focusFigure.roles} selectedKeys={[]} onSelect={() => undefined} labelFor={(key) => key} interactive={false} caption={focusCaption} compact />
              {/* Only primary muscles are painted, and the caption says so. */}
              <figcaption>Primary muscles</figcaption>
            </figure>}
            <div className="today-action-actions">
              {/* The plan carries no dates, so this is the next planned workout, opened at its
                  ready view; nothing starts until the athlete starts it there. */}
              <button type="button" onClick={() => onOpenWorkout(next.week, next.slot.index, "tracker")} className="today-action-cta">Open next workout <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
              <button type="button" onClick={() => onOpenWorkout(next.week, next.slot.index, "day-plan")} className="today-action-secondary">Edit plan <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
            </div>
          </div>
      : next.kind === "weekComplete"
        ? <div className="today-action-primary">
            <div className="today-action-copy">
              <p className="metric-label">Completed this week</p>
              <h2>Every built workout done</h2>
              <i className="today-action-rule" aria-hidden="true" />
              <p className="today-action-count">{unbuiltDays ? `Every day you have built is done; ${plural(unbuiltDays, "day")} not built yet.` : "Every planned workout is done."} The week starts again on Monday.</p>
            </div>
            <div className="today-action-actions">
              <button type="button" onClick={() => (onOpenProgress || onOpenStrength)()} className="today-action-cta">View workout summary <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
              <button type="button" onClick={() => onOpenWorkout(next.week, next.slot.index, "tracker")} className="today-action-secondary">Open {next.slot.day} again <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
            </div>
          </div>
          : <div className="today-action-primary today-action-empty">
              <div>
                <p className="metric-label">Your next workout</p>
                <h2>Build training around your goals</h2>
                <p className="today-action-count">No session built yet. Draft one from your sport's actions, or add exercises yourself.</p>
              </div>
              <div className="today-action-actions">
                <button type="button" onClick={onOpenTraining} className="today-action-cta">Build your first workout <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
                {onOpenCatalog && <button type="button" onClick={onOpenCatalog} className="today-action-secondary">Explore exercises <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>}
              </div>
            </div>}

    {/* Your week: one fraction whose two numbers share a scope, and the
        lifetime record beside it, each labelled with its scope. Zero is a
        number here, not a verdict. */}
    <section className="home-week" aria-label="Your week">
      <div className="home-section-head"><p className="metric-label">Your week</p><button type="button" className="home-link" onClick={onOpenTraining}>View plan <ArrowRight className="h-4 w-4" aria-hidden="true" /></button></div>
      {/* A summary, not a second day picker: one entry per plan day, in plan order - done this
          week, under way, next, or still to come - said in words and shape, never by colour
          alone. "View plan" is the way in; the entries do not change the next workout. No
          weekdays are claimed; the plan has none. */}
      {next.kind !== "loading" && next.kind !== "none" && planDays.length > 0 && <ol className="home-week-strip" aria-label="Planned workouts this week, in plan order">
        {planDays.map((day) => { const state = stateForDay(day); const Icon = planDayIcon[state]; const tag = state === "next" ? "Next" : state === "live" ? "Now" : null; return <li key={day.key} data-state={state} data-empty={day.exerciseCount ? undefined : ""} aria-current={tag ? "step" : undefined}><span className="home-week-chip"><Icon className="home-week-icon" aria-hidden="true" /><span>{day.slot.day}</span>{tag && <em className="home-week-tag">{tag}</em>}<small className="sr-only">, {planDayWord[state]}{day.exerciseCount ? "" : ", not built yet"}</small></span></li>; })}
      </ol>}
      <p className="home-week-line"><b className="stat-figure today-action-figure-accent">{plannedDone}</b> <span>of <b>{plan.slots.length}</b> planned {plan.slots.length === 1 ? "workout" : "workouts"} done this week{moreThisWeek > 0 ? ` · ${moreThisWeek} more ${moreThisWeek === 1 ? "session" : "sessions"} this week` : ""}</span></p>
      <button type="button" className="home-week-record" onClick={onOpenStrength} aria-label={`${lifetimeLine}, all time. View strength progress`}>{lifetimeLine}<small>all time</small></button>
    </section>

    {/* One insight, only where there is one: a larger change (15% or more), named from the
        same table as the Strength record and Progress, or the one measurement that would
        complete a comparison. */}
    {leadingChange
      ? <section className="today-action-state" aria-label="Where you are now">
          <p className="metric-label">Where you are now</p>
          <p className="today-action-state-headline" data-sg-change={changeEmphasis?.direction} data-sg-change-intensity={changeEmphasis?.intensity}>
            <strong>{leadingChange.exerciseName}</strong>
            <span className="today-action-state-delta">{leadingChange.relativeChangePercent >= 0 ? "+" : ""}{leadingChange.relativeChangePercent.toFixed(0)}%</span>
            <span className="today-action-state-tag">{directedChangeStateLabel(leadingChange)}</span>
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
