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
