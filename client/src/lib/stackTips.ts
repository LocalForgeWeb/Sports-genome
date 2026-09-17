/**
 * Tips that are readings of this stack, not advice from a list.
 *
 * Every tip here is generated from something already computed and shown further
 * down the same screen - a coverage shortfall, a session set count, a register
 * demand with no exercise against it. Each carries the figure it fired on, so an
 * athlete can check it against the bars rather than take it on faith, and none of
 * them says what the athlete *should* do beyond pointing at a control that exists.
 *
 * Canned tips were the alternative and they are worse than nothing: an athlete
 * who reads two tips that clearly do not know what is on their screen stops
 * reading the third, which is the one that mattered.
 */

import type { CoverageBar } from "@/lib/stackCoverageVisual";
import type { DemandCoverage } from "@/lib/stackQualityCoverage";
import type { MuscleSessionVolume } from "@/lib/sessionVolume";

export type StackTip = {
  id: string;
  kind: "gap" | "volume" | "quality";
  text: string;
};

/** Three is the most a panel can carry before it reads as noise. */
export const maxTips = 3;

export function buildStackTips({ shortfalls, volumes, absentDemands, suggestionCount, muscleName, splitTargets }: {
  shortfalls: readonly CoverageBar[];
  volumes: readonly MuscleSessionVolume[];
  absentDemands: readonly DemandCoverage[];
  suggestionCount: number;
  muscleName: (muscle: string) => string;
  /** Muscles the split actually targets, so an indirect-only note is relevant. */
  splitTargets: ReadonlySet<string>;
}): StackTip[] {
  const tips: StackTip[] = [];

  const worst = shortfalls[0];
  if (worst) {
    tips.push({
      id: `gap-${worst.muscle}`,
      kind: "gap",
      text: suggestionCount > 0
        ? `${muscleName(worst.muscle)} is ${Math.abs(worst.deltaToTarget)} points under target — the furthest behind. ${suggestionCount} suggested pick${suggestionCount === 1 ? "" : "s"} below add${suggestionCount === 1 ? "s" : ""} direct work for the gaps.`
        : `${muscleName(worst.muscle)} is ${Math.abs(worst.deltaToTarget)} points under target — the furthest behind in this split.`,
    });
  }

  const heavy = volumes.find((entry) => entry.reading === "heavy");
  if (heavy) {
    tips.push({
      id: `volume-heavy-${heavy.muscle}`,
      kind: "volume",
      text: `${muscleName(heavy.muscle)} takes ${heavy.directSets} direct sets in this one session — the register's high-exposure figure for a whole week.`,
    });
  }

  // Only worth saying for a muscle the split is supposed to be training.
  const indirect = volumes.find((entry) => entry.reading === "indirect-only" && splitTargets.has(entry.muscle));
  if (indirect) {
    tips.push({
      id: `volume-indirect-${indirect.muscle}`,
      kind: "volume",
      text: `${muscleName(indirect.muscle)} is a target of this split but gets only ${indirect.supportSets} supporting set${indirect.supportSets === 1 ? "" : "s"} here, no direct work.`,
    });
  }

  // A demand this split's own catalog can barely serve is not worth raising.
  const absent = absentDemands.find((demand) => demand.splitShare >= 10);
  if (absent) {
    tips.push({
      id: `quality-${absent.key}`,
      kind: "quality",
      text: `Your sport's demand register lists ${absent.label.toLowerCase()}. No exercise here trains it, though ${absent.splitShare}% of this split's catalog does.`,
    });
  }

  return tips.slice(0, maxTips);
}
