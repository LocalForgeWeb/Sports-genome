/**
 * What the forearm's evidence shows: the figures design/specialization/shared/render-evidence.mjs
 * draws through the real component, and the page design/specialization/shared/render-page.mjs
 * seeds, opens and taps (docs/specialization-atlas/08-diagram.md, "Evidence").
 */

/** The figures: every view and layer on each arm, one muscle selected per layer, and two more. */
export const FIGURES = {
  /** The region's label, as the page's caption starts ("Forearms, right arm, palm view, surface layer"). */
  label: "Forearms",
  /** The drawing is the right arm, mirrored for the left. */
  sides: [{ id: "right", words: "right arm", mirrored: false }, { id: "left", words: "left arm", mirrored: true }],
  /** The muscle selected on each view and layer, so the outline and the name show on every figure. */
  selected: { "palm-surface": "forearm.fcu", "palm-intermediate": "forearm.fds", "palm-deep": "forearm.fpl", "back-surface": "forearm.ecrb", "back-deep": "forearm.epl", "thumb-surface": "forearm.br", "thumb-deep": "forearm.supinator" },
  extra: [
    { id: "fills-at-rest", file: "palm-surface-at-rest", title: "Palm · Surface · right arm · nothing selected, no data", view: "palm", layer: "surface", side: "right", selected: null, fills: "rest" },
    { id: "not-on-layer", file: "selection-not-on-layer", title: "FDS selected, deep layer shown", view: "palm", layer: "deep", side: "right", selected: "forearm.fds", fills: "cycle" },
  ],
};

const set = (weight, reps) => ({ weight: String(weight), reps: String(reps), unit: "lb", completed: true });
const entries = (ids) => ids.map((id) => ({ entryId: id, catalogExerciseId: id }));
/** The four-day Upper/Lower split the profile builds, with forearm work on both Upper days, so planned totals and the add preview have days to show. */
const planWeek = { customWorkoutIds: [], weeklyPlanIds: {}, weeklyPlanEntries: { "0-Upper": entries([1, 45, 132]), "1-Lower": entries([167]), "2-Upper": entries([3, 139, 140]), "3-Lower": entries([168]) }, prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: {}, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 0 };

/** The page: a week of forearm work and a plan on the device, FCU tapped, the left arm from behind, the deep layer. */
export const PAGE = {
  /**
   * This week's workouts, before now: hammer curls, wrist curls and reverse wrist curls,
   * two-handed, so both arms get them. `at(share)` is a time that share of the way from this
   * week's Monday (UTC) to now, so the week's window always holds them.
   */
  sessions: (at) => [
    { id: "s1", title: "Pull", dayLabel: "Week 1 · Day 02 · Pull", startedAt: at(0.3), completedAt: at(0.35), status: "completed", exercises: [
      { id: "e1", exerciseName: "Hammer Curl", catalogId: 132, plannedPrescription: "3 × 12", sets: [set(30, 12), set(30, 12), set(30, 10)] },
      { id: "e2", exerciseName: "Wrist Curl", catalogId: 139, plannedPrescription: "4 × 15", sets: [set(60, 15), set(60, 15), set(60, 14), set(60, 12)] },
    ] },
    { id: "s2", title: "Upper", dayLabel: "Week 1 · Day 04 · Upper", startedAt: at(0.6), completedAt: at(0.65), status: "completed", exercises: [
      { id: "e3", exerciseName: "Reverse Wrist Curl", catalogId: 140, plannedPrescription: "3 × 15", sets: [set(30, 15), set(30, 15), set(30, 12)] },
      { id: "e4", exerciseName: "Wrist Curl", catalogId: 139, plannedPrescription: "4 × 15", sets: [set(60, 15), set(60, 15), set(60, 15), set(60, 12)] },
    ] },
  ],
  plan: { version: 2, ...planWeek, weeks: { "1": planWeek }, activeWeek: 1 },
  /** The muscle tapped on the first view's surface layer, as a finger would. */
  tap: "forearm.fcu",
  /** The page's side buttons, and the view shown on the left arm. */
  sides: { right: "Right arm", left: "Left arm" },
  otherView: "back",
  /** The plan day chosen in the add preview. */
  addDay: /^Day 02 · Lower/,
};
