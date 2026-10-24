/**
 * What the upper arm's evidence shows: the figures design/specialization/shared/render-evidence.mjs
 * draws through the real component, and the page design/specialization/shared/render-page.mjs
 * seeds, opens and taps once the region has a page (docs/specialization-atlas/regions/upper_arm/diagram.md).
 */

/**
 * The figures: every view and layer as the page shows them, one muscle selected per layer, and
 * the other muscles of the surface layers selected in turn. The page never mirrors the drawing
 * while both arms count as one (10-multi-region.md, "Both sides as one"), so it is drawn
 * unmirrored only: the subject's right arm, with no side named in the captions.
 */
export const FIGURES = {
  /** The region's label as the page will read it once promoted (§1.1), as the page's caption starts ("Upper arms, front view, surface layer"). */
  label: "Upper arms",
  sides: [{ id: "right", words: null, mirrored: false }],
  /** The muscle selected on each view and layer, so the outline and the name show on every figure. */
  selected: { "front-surface": "upper_arm.biceps", "front-deep": "upper_arm.brachialis", "back-surface": "upper_arm.triceps_long", "back-deep": "upper_arm.triceps_medial" },
  extra: [
    { id: "front-surface-brachialis", file: "front-surface-brachialis-outcrop", title: "Front · Surface · brachialis (its outcrop) selected", view: "front", layer: "surface", side: "right", selected: "upper_arm.brachialis", fills: "cycle" },
    { id: "front-surface-br", file: "front-surface-br", title: "Front · Surface · brachioradialis selected", view: "front", layer: "surface", side: "right", selected: "forearm.br", fills: "cycle" },
    { id: "front-deep-cb", file: "front-deep-cb", title: "Front · Deep · coracobrachialis selected", view: "front", layer: "deep", side: "right", selected: "upper_arm.coracobrachialis", fills: "cycle" },
    { id: "back-surface-trilat", file: "back-surface-trilat", title: "Back · Surface · lateral head selected", view: "back", layer: "surface", side: "right", selected: "upper_arm.triceps_lateral", fills: "cycle" },
    { id: "back-surface-trimed", file: "back-surface-trimed-outcrop", title: "Back · Surface · medial head (its outcrop) selected", view: "back", layer: "surface", side: "right", selected: "upper_arm.triceps_medial", fills: "cycle" },
    { id: "fills-at-rest", file: "front-surface-at-rest", title: "Front · Surface · nothing selected, no data", view: "front", layer: "surface", side: "right", selected: null, fills: "rest" },
    { id: "not-on-layer", file: "selection-not-on-layer", title: "Long head selected, front view shown", view: "front", layer: "surface", side: "right", selected: "upper_arm.triceps_long", fills: "cycle" },
  ],
};

const set = (weight, reps) => ({ weight: String(weight), reps: String(reps), unit: "lb", completed: true });
const entries = (ids) => ids.map((id) => ({ entryId: id, catalogExerciseId: id }));
/** A four-day Upper/Lower split with arm work on both Upper days, so planned totals and the add preview have days to show. */
const planWeek = { customWorkoutIds: [], weeklyPlanIds: {}, weeklyPlanEntries: { "0-Upper": entries([1, 121, 150]), "1-Lower": entries([167]), "2-Upper": entries([3, 132, 155]), "3-Lower": entries([168]) }, prescriptions: {}, exerciseSettings: {}, weeklyPrescriptions: {}, weeklySettings: {}, importedPlanContext: {}, activeDayIndex: 0 };

/**
 * The page, once the integration lane promotes the region (render-page.mjs needs it to have a
 * page): a week of curls and triceps work and a plan on the device, the biceps tapped, the back view.
 */
export const PAGE = {
  /** This week's workouts, before now. `at(share)` is a time that share of the way from this week's Monday (UTC) to now. */
  sessions: (at) => [
    { id: "s1", title: "Upper", dayLabel: "Week 1 · Day 01 · Upper", startedAt: at(0.3), completedAt: at(0.35), status: "completed", exercises: [
      { id: "e1", exerciseName: "Barbell Curl", catalogId: 121, plannedPrescription: "3 × 10", sets: [set(70, 10), set(70, 10), set(70, 8)] },
      { id: "e2", exerciseName: "Cable Triceps Pushdown", catalogId: 150, plannedPrescription: "3 × 12", sets: [set(60, 12), set(60, 12), set(60, 11)] },
    ] },
    { id: "s2", title: "Upper", dayLabel: "Week 1 · Day 03 · Upper", startedAt: at(0.6), completedAt: at(0.65), status: "completed", exercises: [
      { id: "e3", exerciseName: "Hammer Curl", catalogId: 132, plannedPrescription: "3 × 12", sets: [set(30, 12), set(30, 12), set(30, 10)] },
      { id: "e4", exerciseName: "Dumbbell Overhead Triceps Extension", catalogId: 155, plannedPrescription: "3 × 12", sets: [set(50, 12), set(50, 12), set(50, 10)] },
    ] },
  ],
  plan: { version: 2, ...planWeek, weeks: { "1": planWeek }, activeWeek: 1 },
  /** The muscle tapped on the first view's surface layer, as a finger would. */
  tap: "upper_arm.biceps",
  /** No side buttons: both arms count as one. The second view shown. */
  otherView: "back",
  /** The plan day chosen in the add preview. */
  addDay: /^Day 02 · Lower/,
};
