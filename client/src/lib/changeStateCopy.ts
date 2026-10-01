import type { ChangeState, WithinAthleteStrengthChange } from "@/lib/withinAthleteStrengthChange";

/**
 * What each change state is called, wherever a change is shown. The Strength record and
 * Progress read this one table, so a lift cannot be "early change" on one screen and something
 * stronger on the other.
 *
 * A change state compares the first and the latest estimated 1RM of one lift, and nothing
 * more: two logs are enough, and no check of variance, session count or time span stands
 * behind it. So the names give the size of the change against the estimate's usual error and
 * claim nothing beyond that. None of them says "confirmed". The thresholds are
 * withinAthleteStrengthChange's, unchanged.
 */
export const changeStateLabel: Record<ChangeState, string> = {
  insufficient_history: "Not enough history yet",
  stable: "Within normal variation (under 6%)",
  directional_signal_emerging: "Early change (6–15%)",
  meaningful_change_supported: "Larger change (15% or more)",
};

/**
 * The same names with the direction in them, for a change shown on its own, as on Home: a 25%
 * gain is a "Larger gain (15% or more)" there and a "Larger change (15% or more)" in the
 * Strength record and Progress, never "Confirmed gain". The direction is in the words as well
 * as the colour.
 */
export function directedChangeStateLabel(change: Pick<WithinAthleteStrengthChange, "changeState" | "relativeChangePercent">): string {
  const gain = change.relativeChangePercent >= 0;
  switch (change.changeState) {
    case "directional_signal_emerging": return gain ? "Early gain (6–15%)" : "Early decline (6–15%)";
    case "meaningful_change_supported": return gain ? "Larger gain (15% or more)" : "Larger decline (15% or more)";
    default: return changeStateLabel[change.changeState];
  }
}

/**
 * The colour of a change: by direction, not by size. A 20% drop is a larger change, and it is
 * not good news, so it is not drawn in the colour of a gain.
 */
export function changeTone(change: Pick<WithinAthleteStrengthChange, "changeState" | "relativeChangePercent">): string {
  if (change.changeState === "stable" || change.changeState === "insufficient_history") return "#9fb2c6";
  return change.relativeChangePercent >= 0 ? "#5bc07a" : "#f2c14d";
}
