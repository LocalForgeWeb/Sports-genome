import type { SplitDay } from "@/lib/splitCycle";

/**
 * Home's training-day figures: a front and a back figure side by side with the day's muscles in
 * orange (design/day-figures).
 *
 * One figure per split, chosen by the day's name and nothing else. Push is the supplied artwork;
 * every other day is that same drawing with its own muscle panels painted instead
 * (design/day-figures/derive.py), so the figures are one set. A day never shows a figure for
 * other muscles, because the picture says which muscles the day trains; a day with no entry
 * here would get the planned-focus schematic instead. The files are cut by
 * design/day-figures/build.py and the sizes below are what it wrote, pinned by
 * dayFigures.test.ts so a re-cut cannot leave a stale box reserved.
 */
export type DayFigure = {
  split: SplitDay;
  /** 720 px wide, for the hero. */
  src: string;
  /** 360 px wide, for compact rows. */
  srcSmall: string;
  width: number;
  height: number;
  /** The muscles the artwork highlights, in the owner's words, for the caption. */
  muscles: string;
  alt: string;
};

/** What each day's figure shows, in the owner's words for the five specified days. */
export const dayFigureMuscles: Record<SplitDay, string> = {
  Push: "Chest · delts · triceps",
  Pull: "Lats · traps and mid-back · rear delts · biceps",
  Legs: "Quads · glutes · hamstrings · calves",
  Upper: "Chest · shoulders · arms · upper back · abs",
  "Sport Transfer": "Obliques and core · hips · glutes · posterior chain · shoulder stabilisation",
  Lower: "Quads · glutes · hamstrings · calves",
  "Full Body": "Chest · back · shoulders · arms · core · legs",
};

const figure = (split: SplitDay, file: string, width: number, height: number): DayFigure => ({
  split,
  src: `/day-figures/${file}.webp`,
  srcSmall: `/day-figures/${file}-360.webp`,
  width,
  height,
  muscles: dayFigureMuscles[split],
  alt: `${split} day: ${dayFigureMuscles[split].toLowerCase().replace(/ · /g, ", ")} highlighted on a front and a back figure.`,
});

/** Every split's figure. Lower trains the Legs muscles, so it shows the Legs drawing. */
export const dayFigures: Record<SplitDay, DayFigure> = {
  Push: figure("Push", "push", 720, 778),
  Pull: figure("Pull", "pull", 720, 778),
  Legs: figure("Legs", "legs", 720, 778),
  Upper: figure("Upper", "upper", 720, 778),
  "Sport Transfer": figure("Sport Transfer", "sport-transfer", 720, 778),
  Lower: figure("Lower", "legs", 720, 778),
  "Full Body": figure("Full Body", "full-body", 720, 778),
};

export function dayFigureFor(day: string): DayFigure | null {
  // Own keys only: a day named "constructor" is not a split.
  return Object.prototype.hasOwnProperty.call(dayFigures, day) ? dayFigures[day as SplitDay] : null;
}
