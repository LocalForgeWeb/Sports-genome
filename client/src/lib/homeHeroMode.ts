/**
 * How much of itself the product should introduce on Home.
 *
 * The dashboard opened with a full-bleed photograph, a "01 / athlete command
 * system" eyebrow, a display headline and a paragraph of positioning copy. That is
 * orienting the first time someone lands. On the fifth morning it is furniture
 * between the athlete and their training, and it pushes the state, the priority and
 * the next action - the three things the Home rule says the first viewport owes
 * them - below the fold.
 *
 * The coherent_personalization trait allows exactly this: adapt density and
 * emphasis, keep the semantics. Both modes show the same facts about the athlete's
 * sport and plan. Only the amount of introduction changes.
 */

export type HomeHeroMode = "introduce" | "compact";

export type HomeHistorySignals = {
  /** Sessions saved, in any state. */
  sessionCount: number;
  /** Lifts on the athlete's record. */
  observationCount: number;
  /** Exercises staged for the current training day. */
  stagedExerciseCount: number;
};

/**
 * An athlete who has done anything at all gets the compact hero.
 *
 * The bar is deliberately at the first action rather than at some threshold of
 * regular use: the introduction has already done its job by then, and a returning
 * athlete who trained once should not have to scroll past the pitch again.
 */
export function homeHeroMode(signals: HomeHistorySignals): HomeHeroMode {
  const hasHistory =
    signals.sessionCount > 0 || signals.observationCount > 0 || signals.stagedExerciseCount > 0;
  return hasHistory ? "compact" : "introduce";
}
