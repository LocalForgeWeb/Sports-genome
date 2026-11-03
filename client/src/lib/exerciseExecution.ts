/**
 * How an exercise is done, logged and credited, for the rows the catalog's own fields cannot
 * describe (the owner's Zercher, neck and bench handoff of 23 Oct 2026; see
 * exerciseCatalogZercherNeckBench.ts). Keyed by catalog id. The exercise detail renders it; the
 * logger reads its measure, load convention, head direction and setup fields; analysis reads its
 * roles. The atlas is not needed for any of it: an exercise is timed, directed or credited here
 * whether or not a body-region page maps it.
 *
 * Nothing here is measured: `roles` are qualitative (which muscles move the load, help, or hold
 * still), never percentages; `provisional` rows keep their catalog grade as a product judgement
 * and stay out of ranked recommendations, percentiles and estimated maxes.
 */

/** What one logged number of load means for this exercise. */
export type LoadConvention =
  /** The whole bar and its plates. */
  | "total_bar_mass"
  /** The number the machine's stack or display shows. */
  | "machine_display"
  /** The plates on one arm of a plate-loaded machine. */
  | "plates_per_arm"
  /** A Smith machine: the plates, or the total when the machine's bar weight is known; the athlete says which. */
  | "smith_declared"
  /** The plates hanging from a head harness. */
  | "suspended_external_mass"
  /** The athlete's own hand: force is not measured, so no load is logged. */
  | "manual_unmeasured";

/** A neck action whose sets are done to the left or the right; each set records which. */
export type HeadDirectionAction = "lateral_flexion" | "rotation";
export type NeckAction = "flexion" | "extension" | HeadDirectionAction;

/** A setup value recorded with the exercise in a workout, compared before two sets are called the same protocol. */
export type SetupField = "bar_type" | "start_height_cm" | "rom_note" | "setup_note" | "machine_model" | "seat_setting" | "pad_setting" | "attachment_setup" | "seat_or_bench_setting" | "load_convention" | "pause_seconds" | "hover_distance_cm";

/** Equipment the catalog's broad equipment word does not imply: Cable is not a head harness, Machine is not a neck machine. */
export type RequiredAccessory = "neck_machine" | "head_harness";

/** A muscle's part in the exercise, qualitatively: a catalog key, or a neck direction group (`neck.flexors`). */
export type ExerciseRole = { target: string; relationship: "direct" | "contributing" | "stabilizer"; mode: "dynamic" | "isometric" };

/** A source as the detail links it: `title` is the publisher and page or the index number (never a guessed article title); `supports` is what it is cited for, and its limit. */
export type ExerciseSource = { id: string; title: string; url: string; kind: string; supports: string };

export type ExerciseExecution = {
  /** The handoff's stable key. */
  key: string;
  group: "zercher" | "neck" | "bench";
  aliases: readonly string[];
  /** What makes this row a different exercise from its neighbours. */
  distinction: string;
  steps: readonly string[];
  measure: "reps" | "seconds";
  load: LoadConvention;
  loadRequired: boolean;
  /** The neck action, on neck rows. */
  neckAction: NeckAction | null;
  /** Sets are done to one side, recorded per set as the head's direction (never the arm). */
  headDirection: HeadDirectionAction | null;
  setupFields: readonly SetupField[];
  requires: readonly RequiredAccessory[];
  roles: readonly ExerciseRole[];
  sources: readonly ExerciseSource[];
  /** Grades are provisional product judgements: no rank, percentile, estimated max or automatic recommendation. */
  provisional: true;
  /**
   * `photo`: an exact photograph, viewed and approved through scripts/exercise-photos/curate.mjs
   * (docs/exercise-additions/media-review-2026-11-02.json). `fallback`: none matches the protocol
   * exactly, so the detail shows the equipment placeholder and the written steps, never a cousin.
   */
  media: "photo" | "fallback";
};

const SOURCES = {
  Z1: { id: "Z1", title: "EliteFTS: Zerchers, simple evaluations of complex movements", url: "https://elitefts.com/blogs/training/zerchers-simple-evaluations-of-complex-movements?constraint=powerlifting", kind: "practitioner technique", supports: "Distinguishing floor, elevated and top-down Zercher setups; not measured activation, superiority or injury probabilities." },
  Z2: { id: "Z2", title: "EliteFTS: Good mornings, understanding a great exercise", url: "https://elitefts.com/blogs/training/good-mornings-understanding-a-great-exercise", kind: "practitioner technique", supports: "Named Zercher good-morning variation; qualitative technique reference only." },
  N1: { id: "N1", title: "PubMed 8610245", url: "https://pubmed.ncbi.nlm.nih.gov/8610245/", kind: "primary anatomical function study", supports: "Direction-dependent neck muscle participation; not exercise-specific allocation percentages." },
  N2: { id: "N2", title: "PubMed 9516695", url: "https://pubmed.ncbi.nlm.nih.gov/9516695/", kind: "primary biomechanics study", supports: "Neck moment-generating capacity depends on muscle and direction; not a personal load conversion." },
  N3: { id: "N3", title: "PubMed 9189733", url: "https://pubmed.ncbi.nlm.nih.gov/9189733/", kind: "primary longitudinal study", supports: "Direct neck resistance training studied for size and strength; no universal optimum for every neck exercise." },
  N4: { id: "N4", title: "Rogers Athletic: the neck machine, set-up and use", url: "https://rogersathletic.com/updates/get-strong-blog/the-neck-machine-set-up-and-use/", kind: "manufacturer technique", supports: "Different machine configurations for flexion, extension and side bending; settings are model-specific." },
  B1: { id: "B1", title: "PubMed 33049982", url: "https://pubmed.ncbi.nlm.nih.gov/33049982/", kind: "primary EMG study", supports: "Bench inclination changes acute muscle excitation in the tested barbell protocol; not machine equivalence or hypertrophy percentages." },
  B2: { id: "B2", title: "Life Fitness: plate-loaded iso-lateral incline press", url: "https://www.lifefitness.com/en-us/catalog/strength-training/plate-loaded/plate-loaded-iso-lateral-incline-press", kind: "manufacturer equipment", supports: "Plate-loaded incline pressing with independent arms exists; no universal torque conversion." },
  B3: { id: "B3", title: "Life Fitness: incline press", url: "https://www.lifefitness.com/en-us/catalog/strength-training/plate-loaded/life-fitness-incline-press", kind: "manufacturer equipment", supports: "Machine design and movement path differ; user-facing machine setup matters." },
  M1: { id: "M1", title: "Free Exercise DB", url: "https://github.com/yuhonas/free-exercise-db", kind: "exercise media dataset", supports: "Candidate exercise photographs and metadata only; requires visual inspection before mapping." },
  M2: { id: "M2", title: "Free Exercise DB licence", url: "https://github.com/yuhonas/free-exercise-db/blob/main/LICENSE.md", kind: "license", supports: "Repository declares Unlicense; retain provenance and check asset-specific restrictions." },
  D1: { id: "D1", title: "Supabase: row level security", url: "https://supabase.com/docs/guides/database/postgres/row-level-security", kind: "official technical documentation", supports: "Grants and row policies both matter for exposed data; ownership tests required for user records." },
} as const satisfies Record<string, ExerciseSource>;

/**
 * The rows by catalog id. "zercher" alone names the whole family, so each Zercher row answers it,
 * as the reused Squat (164) and Carry (300) do (existingRowAliases): every picker then returns all
 * six protocols, each with its sublabel, and never picks one for the athlete (T01).
 */
export const exerciseExecutionById: ReadonlyMap<number, ExerciseExecution> = new Map<number, ExerciseExecution>([
  [421, {
    key: "zercher_deadlift_floor",
    group: "zercher",
    aliases: ["zercher", "zercher deadlift", "zercher floor pull", "floor zercher deadlift"],
    distinction: "Pulled from the floor with the bar in the crook of your elbows. Not a squat from the rack, and not a deadlift with your hands on the bar.",
    steps: [
      "Set a straight bar on the floor. Squat down and slide both elbow crooks under it.",
      "Brace your trunk and stand up through your hips and knees, keeping the bar tight in your elbows.",
      "Lower it to the floor under control and reset before the next rep.",
    ],
    measure: "reps",
    load: "total_bar_mass",
    loadRequired: true,
    neckAction: null,
    headDirection: null,
    setupFields: ["bar_type", "start_height_cm"],
    requires: [],
    roles: [{ target: "glutes", relationship: "direct", mode: "dynamic" }, { target: "quads", relationship: "direct", mode: "dynamic" }, { target: "hamstrings", relationship: "contributing", mode: "dynamic" }, { target: "adductors", relationship: "contributing", mode: "dynamic" }, { target: "abs", relationship: "stabilizer", mode: "isometric" }, { target: "lowerBack", relationship: "stabilizer", mode: "isometric" }, { target: "upperBack", relationship: "stabilizer", mode: "isometric" }, { target: "biceps", relationship: "stabilizer", mode: "isometric" }, { target: "brachialis", relationship: "stabilizer", mode: "isometric" }],
    sources: [SOURCES.Z1],
    provisional: true,
    media: "fallback",
  }],
  [422, {
    key: "zercher_block_pull",
    group: "zercher",
    aliases: ["zercher", "zercher rack pull", "elevated zercher deadlift", "zercher pin pull"],
    distinction: "Pulled from blocks or pins with the bar in your elbows. Note the starting height: a different height is a different exercise.",
    steps: [
      "Rest the bar on blocks or safety pins at a height you can repeat.",
      "Slide both elbow crooks under the bar, brace and stand up.",
      "Lower it onto the same supports and reset before the next rep.",
    ],
    measure: "reps",
    load: "total_bar_mass",
    loadRequired: true,
    neckAction: null,
    headDirection: null,
    setupFields: ["start_height_cm", "bar_type"],
    requires: [],
    roles: [{ target: "glutes", relationship: "direct", mode: "dynamic" }, { target: "quads", relationship: "direct", mode: "dynamic" }, { target: "hamstrings", relationship: "contributing", mode: "dynamic" }, { target: "adductors", relationship: "contributing", mode: "dynamic" }, { target: "abs", relationship: "stabilizer", mode: "isometric" }, { target: "lowerBack", relationship: "stabilizer", mode: "isometric" }, { target: "upperBack", relationship: "stabilizer", mode: "isometric" }, { target: "biceps", relationship: "stabilizer", mode: "isometric" }, { target: "brachialis", relationship: "stabilizer", mode: "isometric" }],
    sources: [SOURCES.Z1],
    provisional: true,
    media: "fallback",
  }],
  [423, {
    key: "zercher_good_morning",
    group: "zercher",
    aliases: ["zercher", "zercher hip hinge", "zercher Romanian deadlift", "zercher RDL"],
    distinction: "A hip hinge from standing with the bar in your elbows; the bar never touches the floor between reps. Also called a Zercher RDL.",
    steps: [
      "Unrack the bar into both elbow crooks and stand tall.",
      "With a slight knee bend, push your hips back and hinge forward, keeping the bar close.",
      "Drive your hips forward to stand. The bar never touches the floor between reps.",
    ],
    measure: "reps",
    load: "total_bar_mass",
    loadRequired: true,
    neckAction: null,
    headDirection: null,
    setupFields: ["bar_type", "rom_note"],
    requires: [],
    roles: [{ target: "hamstrings", relationship: "direct", mode: "dynamic" }, { target: "glutes", relationship: "direct", mode: "dynamic" }, { target: "adductors", relationship: "contributing", mode: "dynamic" }, { target: "abs", relationship: "stabilizer", mode: "isometric" }, { target: "lowerBack", relationship: "stabilizer", mode: "isometric" }, { target: "upperBack", relationship: "stabilizer", mode: "isometric" }, { target: "biceps", relationship: "stabilizer", mode: "isometric" }, { target: "brachialis", relationship: "stabilizer", mode: "isometric" }],
    sources: [SOURCES.Z1, SOURCES.Z2],
    provisional: true,
    media: "fallback",
  }],
  [424, {
    key: "zercher_hold",
    group: "zercher",
    aliases: ["zercher", "zercher static hold", "zercher isometric hold"],
    distinction: "Standing still with the bar in your elbows, for time. Walking with it is Zercher Carry.",
    steps: [
      "Unrack the bar into both elbow crooks and set a steady stance.",
      "Start the timer and hold still, trunk braced.",
      "Stop the timer and rerack. Walking with the bar is Zercher Carry.",
    ],
    measure: "seconds",
    load: "total_bar_mass",
    loadRequired: true,
    neckAction: null,
    headDirection: null,
    setupFields: ["bar_type"],
    requires: [],
    roles: [{ target: "abs", relationship: "stabilizer", mode: "isometric" }, { target: "lowerBack", relationship: "stabilizer", mode: "isometric" }, { target: "upperBack", relationship: "stabilizer", mode: "isometric" }, { target: "biceps", relationship: "stabilizer", mode: "isometric" }, { target: "brachialis", relationship: "stabilizer", mode: "isometric" }],
    sources: [SOURCES.Z1],
    provisional: true,
    media: "fallback",
  }],
  [425, {
    key: "machine_neck_flexion",
    group: "neck",
    aliases: ["machine neck flexion", "neck curl"],
    distinction: "On a neck machine, bending your head forward against the pad.",
    steps: [
      "Set the neck machine for flexion, following its own instructions, and sit with your torso supported.",
      "Bring your chin and head forward through a comfortable range, keeping your torso still.",
      "Return slowly to the start. One out-and-back is one rep.",
    ],
    measure: "reps",
    load: "machine_display",
    loadRequired: true,
    neckAction: "flexion",
    headDirection: null,
    setupFields: ["setup_note", "machine_model", "seat_setting", "pad_setting"],
    requires: ["neck_machine"],
    roles: [{ target: "neck.flexors", relationship: "direct", mode: "dynamic" }],
    sources: [SOURCES.N1, SOURCES.N2, SOURCES.N3, SOURCES.N4],
    provisional: true,
    media: "fallback",
  }],
  [426, {
    key: "machine_neck_extension",
    group: "neck",
    aliases: ["machine neck extension", "neck extension"],
    distinction: "On a neck machine, pressing your head back against the pad.",
    steps: [
      "Set the neck machine for extension, following its own instructions, and sit with your torso supported.",
      "Press your head back against the pad through a comfortable range, without swinging.",
      "Return slowly to the start. One out-and-back is one rep.",
    ],
    measure: "reps",
    load: "machine_display",
    loadRequired: true,
    neckAction: "extension",
    headDirection: null,
    setupFields: ["setup_note", "machine_model", "seat_setting", "pad_setting"],
    requires: ["neck_machine"],
    roles: [{ target: "neck.extensors", relationship: "direct", mode: "dynamic" }],
    sources: [SOURCES.N1, SOURCES.N2, SOURCES.N3, SOURCES.N4],
    provisional: true,
    media: "fallback",
  }],
  [427, {
    key: "machine_neck_lateral_flexion",
    group: "neck",
    aliases: ["machine neck lateral flexion", "side neck bend"],
    distinction: "On a neck machine, bending your head to one side. Each set records which side.",
    steps: [
      "Set the neck machine for side bending, following its own instructions, and sit with your torso supported.",
      "Bring your ear toward your shoulder on the chosen side, without turning your face or leaning.",
      "Return slowly to the start. One out-and-back is one rep.",
    ],
    measure: "reps",
    load: "machine_display",
    loadRequired: true,
    neckAction: "lateral_flexion",
    headDirection: "lateral_flexion",
    setupFields: ["setup_note", "machine_model", "seat_setting", "pad_setting"],
    requires: ["neck_machine"],
    roles: [{ target: "neck.lateral_flexors", relationship: "direct", mode: "dynamic" }],
    sources: [SOURCES.N1, SOURCES.N2, SOURCES.N3, SOURCES.N4],
    provisional: true,
    media: "fallback",
  }],
  [428, {
    key: "harness_neck_extension",
    group: "neck",
    aliases: ["seated harness neck extension", "neck extension"],
    distinction: "Seated and leaning forward, raising your head against plates hung from a head harness.",
    steps: [
      "Sit on a bench with a head harness on and the plates hanging in front, leaning forward with your hands on your knees.",
      "Raise your head back against the weight through a comfortable range, keeping your torso still.",
      "Lower it under control, without swinging.",
    ],
    measure: "reps",
    load: "suspended_external_mass",
    loadRequired: true,
    neckAction: "extension",
    headDirection: null,
    setupFields: ["setup_note"],
    requires: ["head_harness"],
    roles: [{ target: "neck.extensors", relationship: "direct", mode: "dynamic" }],
    sources: [SOURCES.N1, SOURCES.N2, SOURCES.N3],
    provisional: true,
    media: "photo",
  }],
  [429, {
    key: "cable_neck_flexion",
    group: "neck",
    aliases: ["cable harness neck flexion", "neck curl"],
    distinction: "A cable on a head harness, bending your head forward.",
    steps: [
      "Clip a head harness made for the purpose to the cable. Never loop a cable around your neck.",
      "Bring your chin and head forward against the cable, keeping your torso still.",
      "Return slowly to the start, without swinging.",
    ],
    measure: "reps",
    load: "machine_display",
    loadRequired: true,
    neckAction: "flexion",
    headDirection: null,
    setupFields: ["setup_note", "attachment_setup"],
    requires: ["head_harness"],
    roles: [{ target: "neck.flexors", relationship: "direct", mode: "dynamic" }],
    sources: [SOURCES.N1, SOURCES.N2, SOURCES.N3],
    provisional: true,
    media: "fallback",
  }],
  [430, {
    key: "cable_neck_extension",
    group: "neck",
    aliases: ["cable harness neck extension", "neck extension"],
    distinction: "A cable on a head harness, pressing your head back.",
    steps: [
      "Clip a head harness made for the purpose to the cable. Never loop a cable around your neck.",
      "Press your head back against the cable through a comfortable range, keeping your torso still.",
      "Return slowly to the start, without swinging.",
    ],
    measure: "reps",
    load: "machine_display",
    loadRequired: true,
    neckAction: "extension",
    headDirection: null,
    setupFields: ["setup_note", "attachment_setup"],
    requires: ["head_harness"],
    roles: [{ target: "neck.extensors", relationship: "direct", mode: "dynamic" }],
    sources: [SOURCES.N1, SOURCES.N2, SOURCES.N3],
    provisional: true,
    media: "fallback",
  }],
  [431, {
    key: "cable_neck_lateral_flexion",
    group: "neck",
    aliases: ["cable harness neck lateral flexion", "side neck bend"],
    distinction: "A cable on a head harness, bending your head to one side. Each set records which side.",
    steps: [
      "Clip a head harness made for the purpose to the cable. Never loop a cable around your neck.",
      "Bring your ear toward your shoulder on the chosen side, without turning your face or leaning.",
      "Return slowly to the start, without swinging.",
    ],
    measure: "reps",
    load: "machine_display",
    loadRequired: true,
    neckAction: "lateral_flexion",
    headDirection: "lateral_flexion",
    setupFields: ["setup_note", "attachment_setup"],
    requires: ["head_harness"],
    roles: [{ target: "neck.lateral_flexors", relationship: "direct", mode: "dynamic" }],
    sources: [SOURCES.N1, SOURCES.N2, SOURCES.N3],
    provisional: true,
    media: "fallback",
  }],
  [432, {
    key: "cable_neck_rotation",
    group: "neck",
    aliases: ["cable harness neck rotation", "neck rotation"],
    distinction: "A cable on a head harness, turning your head to one side. Each set records which side.",
    steps: [
      "Clip a head harness made for the purpose to the cable. Never loop a cable around your neck.",
      "Turn your face toward the chosen side against the cable, keeping your torso still.",
      "Return slowly to the start, without swinging.",
    ],
    measure: "reps",
    load: "machine_display",
    loadRequired: true,
    neckAction: "rotation",
    headDirection: "rotation",
    setupFields: ["setup_note", "attachment_setup"],
    requires: ["head_harness"],
    roles: [{ target: "neck.rotators", relationship: "direct", mode: "dynamic" }],
    sources: [SOURCES.N1, SOURCES.N2, SOURCES.N3],
    provisional: true,
    media: "fallback",
  }],
  [433, {
    key: "isometric_neck_flexion",
    group: "neck",
    aliases: ["isometric neck flexion", "neck curl", "manual neck flexion hold"],
    distinction: "Your own hand against your forehead: you push forward and hold still. The force is not measured.",
    steps: [
      "Sit tall with your torso supported and your head level.",
      "Press your hand against your forehead and push your head forward into it, without letting your head move.",
      "Build the effort slowly, keep breathing, and ease off slowly at the end.",
    ],
    measure: "seconds",
    load: "manual_unmeasured",
    loadRequired: false,
    neckAction: "flexion",
    headDirection: null,
    setupFields: ["setup_note"],
    requires: [],
    roles: [{ target: "neck.flexors", relationship: "direct", mode: "isometric" }],
    sources: [SOURCES.N1, SOURCES.N2, SOURCES.N3],
    provisional: true,
    media: "fallback",
  }],
  [434, {
    key: "isometric_neck_extension",
    group: "neck",
    aliases: ["isometric neck extension", "neck extension", "manual neck extension hold"],
    distinction: "Your own hand against the back of your head: you push back and hold still. The force is not measured.",
    steps: [
      "Sit tall with your torso supported and your head level.",
      "Press your hands against the back of your head and push your head back into them, without letting it move.",
      "Build the effort slowly, keep breathing, and ease off slowly at the end.",
    ],
    measure: "seconds",
    load: "manual_unmeasured",
    loadRequired: false,
    neckAction: "extension",
    headDirection: null,
    setupFields: ["setup_note"],
    requires: [],
    roles: [{ target: "neck.extensors", relationship: "direct", mode: "isometric" }],
    sources: [SOURCES.N1, SOURCES.N2, SOURCES.N3],
    provisional: true,
    media: "fallback",
  }],
  [435, {
    key: "isometric_neck_lateral_flexion",
    group: "neck",
    aliases: ["isometric neck lateral flexion", "side neck bend", "manual neck lateral flexion hold"],
    distinction: "Your own hand against the side of your head: you push toward that side and hold still. Each set records which side; the force is not measured.",
    steps: [
      "Sit tall with your torso supported and your head level.",
      "Press your hand against the side of your head and push toward it, without letting your head move.",
      "Build the effort slowly, keep breathing, and ease off slowly at the end.",
    ],
    measure: "seconds",
    load: "manual_unmeasured",
    loadRequired: false,
    neckAction: "lateral_flexion",
    headDirection: "lateral_flexion",
    setupFields: ["setup_note"],
    requires: [],
    roles: [{ target: "neck.lateral_flexors", relationship: "direct", mode: "isometric" }],
    sources: [SOURCES.N1, SOURCES.N2, SOURCES.N3],
    provisional: true,
    media: "fallback",
  }],
  [436, {
    key: "isometric_neck_rotation",
    group: "neck",
    aliases: ["isometric neck rotation", "neck rotation", "manual neck rotation hold"],
    distinction: "Your own hand against your temple: you try to turn toward that side and hold still. Each set records which side; the force is not measured.",
    steps: [
      "Sit tall with your torso supported and your head level.",
      "Press your hand against your temple and try to turn your face toward it, without letting your head move.",
      "Build the effort slowly, keep breathing, and ease off slowly at the end.",
    ],
    measure: "seconds",
    load: "manual_unmeasured",
    loadRequired: false,
    neckAction: "rotation",
    headDirection: "rotation",
    setupFields: ["setup_note"],
    requires: [],
    roles: [{ target: "neck.rotators", relationship: "direct", mode: "isometric" }],
    sources: [SOURCES.N1, SOURCES.N2, SOURCES.N3],
    provisional: true,
    media: "fallback",
  }],
  [437, {
    key: "plate_loaded_incline_press",
    group: "bench",
    // The last alias is the app's (2 Nov 2026), not the handoff's: "incline bench machine" is how
    // athletes ask for either incline machine, so this row answers it beside 12 (T02).
    aliases: ["incline plate loaded chest press", "incline lever press", "plate loaded incline bench machine"],
    distinction: "An incline press on a plate-loaded machine, often with arms that move separately. You log the plates on each arm.",
    steps: [
      "Set the seat so the handles start level with your upper chest.",
      "Press the handles up and away until your arms are straight.",
      "Lower them under control without resting on the stop.",
    ],
    measure: "reps",
    load: "plates_per_arm",
    loadRequired: true,
    neckAction: null,
    headDirection: null,
    setupFields: ["machine_model", "seat_or_bench_setting", "load_convention"],
    requires: [],
    roles: [{ target: "chest", relationship: "direct", mode: "dynamic" }, { target: "triceps", relationship: "contributing", mode: "dynamic" }, { target: "frontDelts", relationship: "contributing", mode: "dynamic" }],
    sources: [SOURCES.B1, SOURCES.B2, SOURCES.B3, SOURCES.M1],
    provisional: true,
    media: "photo",
  }],
  [438, {
    key: "selectorized_decline_press",
    group: "bench",
    aliases: ["decline stack chest press"],
    distinction: "A decline press on a machine with a weight stack. You log the number on the stack.",
    steps: [
      "Set the seat so the handles start level with your lower chest.",
      "Press the handles away until your arms are straight.",
      "Lower them under control without resting the stack.",
    ],
    measure: "reps",
    load: "machine_display",
    loadRequired: true,
    neckAction: null,
    headDirection: null,
    setupFields: ["machine_model", "seat_or_bench_setting", "load_convention"],
    requires: [],
    roles: [{ target: "chest", relationship: "direct", mode: "dynamic" }, { target: "triceps", relationship: "contributing", mode: "dynamic" }, { target: "frontDelts", relationship: "contributing", mode: "dynamic" }],
    sources: [SOURCES.B1],
    provisional: true,
    media: "fallback",
  }],
  [439, {
    key: "plate_loaded_decline_press",
    group: "bench",
    aliases: ["decline lever press"],
    distinction: "A decline press on a plate-loaded machine. You log the plates on each arm.",
    steps: [
      "Set the seat so the handles start level with your lower chest.",
      "Press the handles away until your arms are straight.",
      "Lower them under control without resting on the stop.",
    ],
    measure: "reps",
    load: "plates_per_arm",
    loadRequired: true,
    neckAction: null,
    headDirection: null,
    setupFields: ["machine_model", "seat_or_bench_setting", "load_convention"],
    requires: [],
    roles: [{ target: "chest", relationship: "direct", mode: "dynamic" }, { target: "triceps", relationship: "contributing", mode: "dynamic" }, { target: "frontDelts", relationship: "contributing", mode: "dynamic" }],
    sources: [SOURCES.B1, SOURCES.M1],
    provisional: true,
    media: "photo",
  }],
  [440, {
    key: "smith_decline_bench",
    group: "bench",
    aliases: ["decline smith press"],
    distinction: "A decline bench press on a Smith machine. You log the plates, and the bar only if you know what it weighs.",
    steps: [
      "Set a decline bench under the Smith bar, with the safety stops just above your chest.",
      "Unhook the bar and lower it under control to your lower chest.",
      "Press it back up, and rehook it at the end of the set.",
    ],
    measure: "reps",
    load: "smith_declared",
    loadRequired: true,
    neckAction: null,
    headDirection: null,
    setupFields: ["machine_model", "seat_or_bench_setting", "load_convention"],
    requires: [],
    roles: [{ target: "chest", relationship: "direct", mode: "dynamic" }, { target: "triceps", relationship: "contributing", mode: "dynamic" }, { target: "frontDelts", relationship: "contributing", mode: "dynamic" }],
    sources: [SOURCES.B1, SOURCES.M1],
    provisional: true,
    media: "photo",
  }],
  [441, {
    key: "barbell_floor_press",
    group: "bench",
    aliases: ["floor press barbell"],
    distinction: "A barbell bench press lying on the floor, so your elbows stop at the floor.",
    steps: [
      "Lie on the floor under the racked bar and take your bench-press grip.",
      "Lower until your upper arms touch the floor gently, and pause without bouncing.",
      "Press back up to straight arms.",
    ],
    measure: "reps",
    load: "total_bar_mass",
    loadRequired: true,
    neckAction: null,
    headDirection: null,
    setupFields: ["setup_note"],
    requires: [],
    roles: [{ target: "chest", relationship: "direct", mode: "dynamic" }, { target: "triceps", relationship: "contributing", mode: "dynamic" }, { target: "frontDelts", relationship: "contributing", mode: "dynamic" }],
    sources: [SOURCES.B1, SOURCES.M1],
    provisional: true,
    media: "photo",
  }],
  [442, {
    key: "paused_barbell_bench",
    group: "bench",
    aliases: ["pause bench", "competition style paused bench"],
    distinction: "A barbell bench press with a still pause on your chest each rep. Note how long the pause is.",
    steps: [
      "Lie on a flat bench and unrack the bar.",
      "Lower it to your chest and hold it still for the pause, without sinking or bouncing.",
      "Press it back up. The pause is part of the rep, not a separate set.",
    ],
    measure: "reps",
    load: "total_bar_mass",
    loadRequired: true,
    neckAction: null,
    headDirection: null,
    setupFields: ["pause_seconds"],
    requires: [],
    roles: [{ target: "chest", relationship: "direct", mode: "dynamic" }, { target: "triceps", relationship: "contributing", mode: "dynamic" }, { target: "frontDelts", relationship: "contributing", mode: "dynamic" }],
    sources: [SOURCES.B1],
    provisional: true,
    media: "fallback",
  }],
  [443, {
    key: "spoto_press",
    group: "bench",
    aliases: ["hover pause bench", "spoto bench"],
    distinction: "A barbell bench press that pauses just above your chest without touching it.",
    steps: [
      "Lie on a flat bench and unrack the bar.",
      "Lower it until it is just above your chest, the same distance each rep, and pause there without touching.",
      "Press it back up.",
    ],
    measure: "reps",
    load: "total_bar_mass",
    loadRequired: true,
    neckAction: null,
    headDirection: null,
    setupFields: ["pause_seconds", "hover_distance_cm"],
    requires: [],
    roles: [{ target: "chest", relationship: "direct", mode: "dynamic" }, { target: "triceps", relationship: "contributing", mode: "dynamic" }, { target: "frontDelts", relationship: "contributing", mode: "dynamic" }],
    sources: [SOURCES.B1],
    provisional: true,
    media: "fallback",
  }],
]);

/**
 * Search words for existing rows the handoff resolved to rather than duplicate: 12 Incline Machine
 * Chest Press (its machine stays unspecified, as old logs recorded it), 15 Smith Machine Incline
 * Press (the handoff's "Smith Machine Incline Bench Press"), 164 Zercher Squat, 300 Zercher Carry.
 */
export const existingRowAliases: ReadonlyMap<number, readonly string[]> = new Map<number, readonly string[]>([
  [12, ["incline bench machine", "machine incline press", "incline chest press machine"]],
  [15, ["smith machine incline bench press", "smith incline bench", "incline smith press"]],
  [164, ["zercher", "zercher front squat"]],
  [300, ["zercher", "zercher walk"]],
]);

/** The execution record for a catalog id, or null when the catalog row says all there is. */
export function exerciseExecutionOf(catalogId: number | null | undefined): ExerciseExecution | null {
  return catalogId === null || catalogId === undefined ? null : exerciseExecutionById.get(catalogId) ?? null;
}

/**
 * True for a catalog row whose grades are provisional product judgements, not measured effects:
 * the one gate every engine reads. Such a row gets no estimated 1RM, rank, percentile or strength
 * norm (not even one borrowed by a name that contains "bench press"), no name-based study
 * calibration or mechanics reading, and is never put into a plan, a sport movement's exercises or a
 * suggestion by the app on its own; the athlete adds it by choosing it.
 */
export function isProvisionalCatalogId(catalogId: number | null | undefined): boolean {
  return exerciseExecutionOf(catalogId)?.provisional === true;
}

/** Equipment a row needs beyond its broad catalog equipment word, or none. */
export function requiredAccessoriesOf(catalogId: number | null | undefined): readonly RequiredAccessory[] {
  return exerciseExecutionOf(catalogId)?.requires ?? [];
}

/** The accessories in words, as a picker row and the detail name them. */
export const requiredAccessoryLabels: Record<RequiredAccessory, string> = { neck_machine: "Neck machine", head_harness: "Head harness" };

/**
 * The words every picker finds a row by besides its name: its execution aliases, or, for an
 * existing row the handoff resolved to instead of duplicating, the aliases it gained.
 */
export function catalogAliasesOf(catalogId: number | null | undefined): readonly string[] {
  if (catalogId === null || catalogId === undefined) return [];
  return exerciseExecutionById.get(catalogId)?.aliases ?? existingRowAliases.get(catalogId) ?? [];
}

/**
 * One short line under a row's name that tells it apart from the rows a search returns with it:
 * "zercher" finds six protocols and "incline bench machine" two machines, and the names alone do
 * not say which is the floor pull or which machine is loaded by the arm. Set-up words only; the
 * detail has the rest.
 */
export const catalogSublabelById: ReadonlyMap<number, string> = new Map<number, string>([
  [164, "Squat · bar in the elbows"],
  [300, "Carry · walk with the bar in the elbows"],
  [421, "Floor pull · from the floor"],
  [422, "Elevated pull · from blocks or pins"],
  [423, "Hip hinge · top-down, no floor reset"],
  [424, "Hold · timed, standing still"],
  [425, "Neck machine · flexion"],
  [426, "Neck machine · extension"],
  [427, "Neck machine · side bend, left or right"],
  [428, "Head harness, plates · extension"],
  [429, "Cable and head harness · flexion"],
  [430, "Cable and head harness · extension"],
  [431, "Cable and head harness · side bend, left or right"],
  [432, "Cable and head harness · rotation, left or right"],
  [433, "Own hand · flexion hold, timed"],
  [434, "Own hand · extension hold, timed"],
  [435, "Own hand · side-bend hold, left or right"],
  [436, "Own hand · rotation hold, left or right"],
  [12, "Machine, type not specified · incline"],
  [15, "Smith machine · incline bench"],
  [437, "Plate-loaded machine · incline, plates per arm"],
  [438, "Selectorized stack · decline"],
  [439, "Plate-loaded machine · decline, plates per arm"],
  [440, "Smith machine · decline bench"],
  [441, "Barbell · on the floor, no bench"],
  [442, "Barbell · pause on the chest"],
  [443, "Barbell · pause just above the chest"],
]);

export function catalogSublabelOf(catalogId: number | null | undefined): string | null {
  return catalogId === null || catalogId === undefined ? null : catalogSublabelById.get(catalogId) ?? null;
}

/** The catalog muscle key a role names: the key itself, or `neck` for a neck direction group (`neck.flexors`). */
export function roleMuscleKey(target: string): string {
  return target.startsWith("neck.") ? "neck" : target;
}

/**
 * How analysis credits a row with execution roles, by catalog muscle key: `direct` where a muscle
 * is what the exercise is built on (moving the load, or holding it on a timed hold), `supporting`
 * where it helps move the load, `steadying` where it holds a joint still while others move the
 * load (the Zercher cradle's elbow flexors, the trunk). Steadying is never set credit; neck
 * directions all credit `neck`. Null for a row with no execution record, whose catalog tags are
 * read as before.
 */
export type ExecutionCredit = { direct: string[]; supporting: string[]; steadying: string[] };
export function executionCreditOf(catalogId: number | null | undefined): ExecutionCredit | null {
  const execution = exerciseExecutionOf(catalogId);
  if (!execution) return null;
  const keysFor = (relationship: ExerciseRole["relationship"]) => Array.from(new Set(execution.roles.filter((role) => role.relationship === relationship).map((role) => roleMuscleKey(role.target))));
  const direct = keysFor("direct");
  const supporting = keysFor("contributing").filter((key) => !direct.includes(key));
  const steadying = keysFor("stabilizer").filter((key) => !direct.includes(key) && !supporting.includes(key));
  return { direct, supporting, steadying };
}

/**
 * Which muscles one exercise's sets count for, as weekly and session volume read them: direct (its
 * primary tags) and supporting (its other tags). A row with execution roles is read from them
 * instead (executionCreditOf): a muscle that
 * moves the load, or is the target of a timed hold, is direct; one that helps is supporting; one
 * that only holds still while others move the load (the Zercher cradle's elbow flexors, the trunk)
 * gets no set credit; and every neck direction counts for the neck alone. Sets stay sets: a hold's
 * seconds never become reps here.
 */
export function setCreditMusclesOf(exercise: { id: number; catalogExerciseId?: number; primaryMuscles: readonly string[]; secondaryMuscles: readonly string[] }): { direct: string[]; support: string[] } {
  const credit = executionCreditOf(exercise.catalogExerciseId ?? exercise.id);
  if (credit) return { direct: credit.direct, support: credit.supporting };
  const direct = Array.from(new Set(exercise.primaryMuscles));
  return { direct, support: Array.from(new Set(exercise.secondaryMuscles.filter((muscle) => !direct.includes(muscle)))) };
}

/** What kind of reference a source is, in the words the detail labels it with. */
export type SourceKindLabel = "Scientific study" | "Manufacturer" | "Coaching reference" | "Image dataset" | "Licence" | "Technical documentation";
export function sourceKindLabel(source: Pick<ExerciseSource, "kind">): SourceKindLabel {
  const kind = source.kind.toLowerCase();
  if (kind.includes("study")) return "Scientific study";
  if (kind.startsWith("manufacturer")) return "Manufacturer";
  if (kind.startsWith("practitioner")) return "Coaching reference";
  if (kind.includes("dataset")) return "Image dataset";
  if (kind === "license") return "Licence";
  return "Technical documentation";
}
