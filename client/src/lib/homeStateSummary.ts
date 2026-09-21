import type { WithinAthleteStrengthChange } from "./withinAthleteStrengthChange";

/**
 * Home's "current state and meaningful change" selection.
 *
 * The philosophy's trend-credibility rule is that a raw numerical difference is not
 * automatically a meaningful change: only a change the within-athlete model rates
 * `meaningful_change_supported` has cleared the estimator's own noise. Home therefore
 * narrates a direction for those and nothing else - a "starting to move" or "stable"
 * reading stays in the metric history rather than becoming a headline.
 */
export function leadingConfirmedChange(
  changes: readonly WithinAthleteStrengthChange[]
): WithinAthleteStrengthChange | null {
  let leading: WithinAthleteStrengthChange | null = null;
  for (const change of changes) {
    if (change.changeState !== "meaningful_change_supported") continue;
    if (!leading || Math.abs(change.relativeChangePercent) > Math.abs(leading.relativeChangePercent)) {
      leading = change;
    }
  }
  return leading;
}

/**
 * Home's priority slot.
 *
 * The Home rule reserves one slot for the single highest-value current priority -
 * the answer to "where should attention go?". Its stated failure modes are the
 * reason this returns exactly one item from a fixed order: if too many things
 * qualify the screen collapses back into a metric wall, and if the ranking is
 * unstable the dashboard reads as arbitrary.
 *
 * The posture comes from the uncertainty rule: confidence decides whether the next
 * step is act, inspect, or measure. Where a missing measurement is what stops the
 * app from interpreting anything, the priority is to collect it rather than to
 * prescribe training on top of the gap.
 */
export type HomePriorityPosture = "act" | "inspect" | "measure";

export type HomePriorityTarget = "day-plan" | "strength";

export type HomePriority = {
  id: string;
  posture: HomePriorityPosture;
  headline: string;
  detail: string;
  ctaLabel: string;
  target: HomePriorityTarget;
};

/** Gates an athlete can actually close by supplying something they already have. */
const collectableGates: Record<string, { headline: string; detail: string }> = {
  body_mass_required: {
    headline: "Add your test-day body weight",
    detail: "One saved lift matches a reviewed study on everything except body weight. Adding it completes the comparison.",
  },
  comparison_sex_required: {
    headline: "Add the sex to compare against",
    detail: "A saved lift matches a reviewed study, but the study reports separate male and female groups.",
  },
  age_required: {
    headline: "Add your age on the test day",
    detail: "A saved lift matches a reviewed study that reports its groups by age band.",
  },
  load_required: {
    headline: "Add the load you lifted",
    detail: "A saved test has no load recorded, so nothing can be compared or tracked from it.",
  },
};

export type HomePriorityInput = {
  /** An actionable registry gate, already filtered to one the athlete can close. */
  collectableGate: { reason: string; exerciseName: string } | null;
  hasConfirmedChange: boolean;
  trackedChangeCount: number;
  stagedExerciseCount: number;
  observationCount: number;
};

export function selectHomePriority(input: HomePriorityInput): HomePriority {
  // 1. A measurement the athlete can supply beats any prescription: the uncertainty
  //    rule defaults the next step toward collecting what is missing.
  const gate = input.collectableGate ? collectableGates[input.collectableGate.reason] : undefined;
  if (input.collectableGate && gate) {
    return {
      id: `gate:${input.collectableGate.reason}`,
      posture: "measure",
      headline: gate.headline,
      detail: `${gate.detail} (${input.collectableGate.exerciseName})`,
      ctaLabel: "Complete this test",
      target: "strength",
    };
  }

  // 2. Nothing logged at all: the useful move is a first measurement, not a plan.
  if (input.observationCount === 0) {
    return {
      id: "first-lift",
      posture: "measure",
      headline: "Log your first lift",
      detail: "Nothing recorded yet.",
      ctaLabel: "Open Strength Genome",
      target: "strength",
    };
  }

  // 3. A staged day is the concrete next commitment when one is missing.
  if (input.stagedExerciseCount === 0) {
    return {
      id: "stage-day",
      posture: "act",
      headline: "Stage your next training day",
      detail: "No day is built yet, so today has no prescribed work to follow.",
      ctaLabel: "Design training day",
      target: "day-plan",
    };
  }

  // 4. Logged, but never the same lift twice: change cannot be established at all.
  if (input.trackedChangeCount === 0) {
    return {
      id: "repeat-lift",
      posture: "measure",
      headline: "Repeat a lift you have already logged",
      detail: "Change is only measurable across repeat tests of the same lift, and none has been repeated yet.",
      ctaLabel: "Open Strength Genome",
      target: "strength",
    };
  }

  // 5. A confirmed change is worth reading before it changes the plan - the rule
  //    warns against over-prescribing on top of a result the athlete has not seen.
  if (input.hasConfirmedChange) {
    return {
      id: "review-change",
      posture: "inspect",
      headline: "Review the change on your record",
      detail: "One lift has moved enough to count as a real change. Read it before it drives your next block.",
      ctaLabel: "Open Strength Genome",
      target: "strength",
    };
  }

  return {
    id: "keep-training",
    posture: "act",
    headline: "Run the day you staged",
    detail: "Your tracked lifts are steady and a session is ready to go.",
    ctaLabel: "Open training day",
    target: "day-plan",
  };
}

/**
 * How Home should present a confirmed change.
 *
 * Two DNA traits meet here. `living_genome` wants motion that clarifies "what
 * changed, where, and why", so a confirmed change announces itself rather than
 * appearing as inert text. `earned_progress` scales celebration "with significance
 * and rarity" and names meaningless inflation as the anti-pattern, so the stronger
 * reveal is reserved for a gain well past the confirmation threshold.
 *
 * A decline is still change, and still legible - it just never gets the amplified
 * treatment. Celebrating a regression would be dishonest, and dramatising one would
 * be the punishment-heavy pattern the same trait rules out.
 */
export type ConfirmedChangeEmphasis = {
  direction: "gain" | "loss";
  intensity: "standard" | "pronounced";
};

/**
 * Twice the threshold at which a change is confirmed at all. Below this a change is
 * real but ordinary; above it, rare enough that the extra emphasis means something.
 */
const pronouncedChangePercent = 30;

export function confirmedChangeEmphasis(
  change: Pick<WithinAthleteStrengthChange, "relativeChangePercent">
): ConfirmedChangeEmphasis {
  const direction = change.relativeChangePercent >= 0 ? "gain" : "loss";
  const magnitude = Math.abs(change.relativeChangePercent);
  return {
    direction,
    intensity: direction === "gain" && magnitude >= pronouncedChangePercent ? "pronounced" : "standard",
  };
}
