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
 * The colour of a change: by direction, not by size. A 20% drop is a larger change, and it is
 * not good news, so it is not drawn in the colour of a gain.
 */
export function changeTone(change: Pick<WithinAthleteStrengthChange, "changeState" | "relativeChangePercent">): string {
  if (change.changeState === "stable" || change.changeState === "insufficient_history") return "#9fb2c6";
  return change.relativeChangePercent >= 0 ? "#5bc07a" : "#f2c14d";
}
