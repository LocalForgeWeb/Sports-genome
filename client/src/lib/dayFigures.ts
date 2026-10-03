import type { SplitDay } from "@/lib/splitCycle";

/**
 * Home's training-day figures: the supplied artwork for a day, a front and a back figure side
 * by side with the day's muscles in orange (design/day-figures).
 *
 * One figure per split, chosen by the day's name and nothing else. A day whose artwork has not
 * been supplied has no entry here, and Home draws its planned-focus schematic instead; it never
 * borrows another day's figure, because the picture says which muscles the day trains. The
 * files are cut by design/day-figures/build.py and the sizes below are what it wrote, pinned
 * by dayFigures.test.ts so a re-cut cannot leave a stale box reserved.
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

/** What each day's artwork shows, as specified; the figure for a day is added once its file is cut. */
export const dayFigureMuscles: Partial<Record<SplitDay, string>> = {
  Push: "Chest · delts · triceps",
  Pull: "Lats · traps and mid-back · rear delts · biceps",
  Legs: "Quads · glutes · hamstrings · calves",
  Upper: "Chest · shoulders · arms · upper back · abs",
  "Sport Transfer": "Obliques and core · hips · glutes · posterior chain · shoulder stabilisation",
};

const figure = (split: SplitDay, file: string, width: number, height: number): DayFigure => ({
  split,
  src: `/day-figures/${file}.webp`,
  srcSmall: `/day-figures/${file}-360.webp`,
  width,
  height,
  muscles: dayFigureMuscles[split] ?? "",
  alt: `${split} day: ${(dayFigureMuscles[split] ?? "").toLowerCase().replace(/ · /g, ", ")} highlighted on a front and a back figure.`,
});

/** The days whose artwork has been supplied and cut. Pull, Legs, Upper and Sport Transfer wait on theirs. */
export const dayFigures: Partial<Record<SplitDay, DayFigure>> = {
  Push: figure("Push", "push", 720, 778),
};

export function dayFigureFor(day: string): DayFigure | null {
  return (dayFigures as Record<string, DayFigure | undefined>)[day] ?? null;
}
