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

export type ExerciseSource = { id: string; url: string; kind: string; supports: string };

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
  Z1: { id: "Z1", url: "https://elitefts.com/blogs/training/zerchers-simple-evaluations-of-complex-movements?constraint=powerlifting", kind: "practitioner technique", supports: "Distinguishing floor, elevated and top-down Zercher setups; not measured activation, superiority or injury probabilities." },
  Z2: { id: "Z2", url: "https://elitefts.com/blogs/training/good-mornings-understanding-a-great-exercise", kind: "practitioner technique", supports: "Named Zercher good-morning variation; qualitative technique reference only." },
  N1: { id: "N1", url: "https://pubmed.ncbi.nlm.nih.gov/8610245/", kind: "primary anatomical function study", supports: "Direction-dependent neck muscle participation; not exercise-specific allocation percentages." },
  N2: { id: "N2", url: "https://pubmed.ncbi.nlm.nih.gov/9516695/", kind: "primary biomechanics study", supports: "Neck moment-generating capacity depends on muscle and direction; not a personal load conversion." },
  N3: { id: "N3", url: "https://pubmed.ncbi.nlm.nih.gov/9189733/", kind: "primary longitudinal study", supports: "Direct neck resistance training studied for size and strength; no universal optimum for every neck exercise." },
  N4: { id: "N4", url: "https://rogersathletic.com/updates/get-strong-blog/the-neck-machine-set-up-and-use/", kind: "manufacturer technique", supports: "Different machine configurations for flexion, extension and side bending; settings are model-specific." },
  B1: { id: "B1", url: "https://pubmed.ncbi.nlm.nih.gov/33049982/", kind: "primary EMG study", supports: "Bench inclination changes acute muscle excitation in the tested barbell protocol; not machine equivalence or hypertrophy percentages." },
  B2: { id: "B2", url: "https://www.lifefitness.com/en-us/catalog/strength-training/plate-loaded/plate-loaded-iso-lateral-incline-press", kind: "manufacturer equipment", supports: "Plate-loaded incline pressing with independent arms exists; no universal torque conversion." },
  B3: { id: "B3", url: "https://www.lifefitness.com/en-us/catalog/strength-training/plate-loaded/life-fitness-incline-press", kind: "manufacturer equipment", supports: "Machine design and movement path differ; user-facing machine setup matters." },
  M1: { id: "M1", url: "https://github.com/yuhonas/free-exercise-db", kind: "exercise media dataset", supports: "Candidate exercise photographs and metadata only; requires visual inspection before mapping." },
  M2: { id: "M2", url: "https://github.com/yuhonas/free-exercise-db/blob/main/LICENSE.md", kind: "license", supports: "Repository declares Unlicense; retain provenance and check asset-specific restrictions." },
  D1: { id: "D1", url: "https://supabase.com/docs/guides/database/postgres/row-level-security", kind: "official technical documentation", supports: "Grants and row policies both matter for exposed data; ownership tests required for user records." },
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
    distinction: "Starts in the elbow crooks on the floor; not a rack-start squat or a conventional deadlift.",
    steps: [
      "Start with a straight bar resting on the floor; position both elbow crooks under it before the working repetition.",
      "Brace the trunk and stand by extending hips and knees while keeping the load cradled.",
      "Return the bar under control and reset on the floor. A conventional hand-grip deadlift followed by a lap transfer is a different protocol.",
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
    distinction: "Starting height changes the protocol and PR comparison; never merge with floor pulls.",
    steps: [
      "Support the bar on stable blocks or pins and record bar-center starting height.",
      "Place the bar in both elbow crooks, brace and stand.",
      "Lower to the same supports and reset each repetition.",
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
    distinction: "RDL alias applies only to this top-down, no-floor-reset protocol. Keep floor and block pulls distinct.",
    steps: [
      "Unrack the bar into both elbow crooks and begin standing.",
      "Maintain a modest knee bend; hinge the hips backward with the bar cradled close.",
      "Extend the hips to stand; the bar does not reset on the floor between repetitions.",
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
    distinction: "Timed trunk and elbow-flexor isometrics; not dynamic curl sets or a hand-grip hold.",
    steps: [
      "Unrack a bar into both elbow crooks and stand in a stable stance.",
      "Keep the load and trunk position steady; start the timer once positioned.",
      "Stop the timer when the hold ends and rerack. Walking belongs to Zercher Carry.",
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
    distinction: "Equipment and resistance direction define this variant. Do not treat all neck exercises as interchangeable.",
    steps: [
      "Use a neck machine configured for this direction according to its own setup instructions; record model and seat/pad settings.",
      "Bring the chin and head forward through a controlled comfortable flexion range without moving the torso.",
      "Return slowly to the start; count one complete out-and-back movement as one repetition.",
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
    distinction: "Equipment and resistance direction define this variant. Do not treat all neck exercises as interchangeable.",
    steps: [
      "Use a neck machine configured for this direction according to its own setup instructions; record model and seat/pad settings.",
      "Extend the neck against resistance while keeping the torso supported; return under control without swinging.",
      "Return slowly to the start; count one complete out-and-back movement as one repetition.",
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
    distinction: "Equipment and resistance direction define this variant. Do not treat all neck exercises as interchangeable.",
    steps: [
      "Use a neck machine configured for this direction according to its own setup instructions; record model and seat/pad settings.",
      "Move the ear toward the shoulder on the selected side without turning the face or leaning the torso.",
      "Return slowly to the start; count one complete out-and-back movement as one repetition.",
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
    distinction: "Equipment and resistance direction define this variant. Do not treat all neck exercises as interchangeable.",
    steps: [
      "Sit with a secure head harness and suspended plates; incline the torso forward so gravity opposes neck extension.",
      "Extend the neck against resistance while keeping the torso supported; return under control without swinging.",
      "Record suspended plate mass and torso setup; do not equate it to a neck-machine stack value.",
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
    distinction: "Equipment and resistance direction define this variant. Do not treat all neck exercises as interchangeable.",
    steps: [
      "Use a purpose-designed, secure head harness attached to the pulley so the cable opposes the selected motion. Do not loop the cable around the throat.",
      "Bring the chin and head forward through a controlled comfortable flexion range without moving the torso.",
      "Keep the attachment and torso position repeatable; log pulley setting and harness configuration.",
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
    distinction: "Equipment and resistance direction define this variant. Do not treat all neck exercises as interchangeable.",
    steps: [
      "Use a purpose-designed, secure head harness attached to the pulley so the cable opposes the selected motion. Do not loop the cable around the throat.",
      "Extend the neck against resistance while keeping the torso supported; return under control without swinging.",
      "Keep the attachment and torso position repeatable; log pulley setting and harness configuration.",
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
    distinction: "Equipment and resistance direction define this variant. Do not treat all neck exercises as interchangeable.",
    steps: [
      "Use a purpose-designed, secure head harness attached to the pulley so the cable opposes the selected motion. Do not loop the cable around the throat.",
      "Move the ear toward the shoulder on the selected side without turning the face or leaning the torso.",
      "Keep the attachment and torso position repeatable; log pulley setting and harness configuration.",
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
    distinction: "Equipment and resistance direction define this variant. Do not treat all neck exercises as interchangeable.",
    steps: [
      "Use a purpose-designed, secure head harness attached to the pulley so the cable opposes the selected motion. Do not loop the cable around the throat.",
      "Turn the face toward the selected side against the opposing resistance; keep the torso still.",
      "Keep the attachment and torso position repeatable; log pulley setting and harness configuration.",
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
    distinction: "Left/right describes attempted head motion, not the arm applying resistance. Never infer numeric force from self-resistance.",
    steps: [
      "Sit with the head near neutral and the torso supported.",
      "Apply hand resistance at the forehead, opposing an attempt to flex forward; hold without actual head movement.",
      "Build and release tension smoothly while breathing; record the hold time, intended direction and effort.",
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
    distinction: "Left/right describes attempted head motion, not the arm applying resistance. Never infer numeric force from self-resistance.",
    steps: [
      "Sit with the head near neutral and the torso supported.",
      "Apply hand resistance at the back of the skull, opposing an attempt to extend backward; hold without actual head movement.",
      "Build and release tension smoothly while breathing; record the hold time, intended direction and effort.",
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
    distinction: "Left/right describes attempted head motion, not the arm applying resistance. Never infer numeric force from self-resistance.",
    steps: [
      "Sit with the head near neutral and the torso supported.",
      "Apply hand resistance at the side of the head, opposing an attempt to bend toward the selected side; hold without actual head movement.",
      "Build and release tension smoothly while breathing; record the hold time, intended direction and effort.",
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
    distinction: "Left/right describes attempted head motion, not the arm applying resistance. Never infer numeric force from self-resistance.",
    steps: [
      "Sit with the head near neutral and the torso supported.",
      "Apply hand resistance at the side of the forehead/temple, opposing an attempt to turn the face toward the selected side; hold without actual head movement.",
      "Build and release tension smoothly while breathing; record the hold time, intended direction and effort.",
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
    distinction: "Protocol-specific history; no inherited barbell-bench percentile or automatic machine conversion.",
    steps: [
      "Use the named incline or decline press and adjust the seat so the handles match its intended pressing path. Record the machine and settings.",
      "Press the handles away and return under control without bouncing the stop.",
      "For independent arms record each arm’s plate load; for a stack record the displayed setting. Do not assume either equals hand force.",
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
    distinction: "Protocol-specific history; no inherited barbell-bench percentile or automatic machine conversion.",
    steps: [
      "Use the named incline or decline press and adjust the seat so the handles match its intended pressing path. Record the machine and settings.",
      "Press the handles away and return under control without bouncing the stop.",
      "For independent arms record each arm’s plate load; for a stack record the displayed setting. Do not assume either equals hand force.",
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
    distinction: "Protocol-specific history; no inherited barbell-bench percentile or automatic machine conversion.",
    steps: [
      "Use the named incline or decline press and adjust the seat so the handles match its intended pressing path. Record the machine and settings.",
      "Press the handles away and return under control without bouncing the stop.",
      "For independent arms record each arm’s plate load; for a stack record the displayed setting. Do not assume either equals hand force.",
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
    distinction: "Protocol-specific history; no inherited barbell-bench percentile or automatic machine conversion.",
    steps: [
      "Place the appropriate incline or decline bench under the Smith bar and set the safety stops. Record bench setting and machine.",
      "Lower the bar in a controlled path toward the chest, then press upward while keeping the torso supported.",
      "Use the same load convention each session: plates-only or total including known effective bar resistance. Unknown effective bar resistance remains unknown.",
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
    distinction: "Protocol-specific history; no inherited barbell-bench percentile or automatic machine conversion.",
    steps: [
      "Lie on the floor under a racked bar and establish a stable grip and shoulder position.",
      "Lower until the upper arms contact the floor gently, pause without bouncing, then press.",
      "The floor limits shoulder excursion. Keep this history separate from bench-supported pressing.",
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
    distinction: "Protocol-specific history; no inherited barbell-bench percentile or automatic machine conversion.",
    steps: [
      "Set up on a flat bench and unrack the bar.",
      "Lower to chest contact and hold a deliberate motionless pause without bouncing.",
      "Press to the finish and record pause duration when known. Pausing does not create a separate logged set.",
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
    distinction: "Protocol-specific history; no inherited barbell-bench percentile or automatic machine conversion.",
    steps: [
      "Set up on a flat bench and unrack the bar.",
      "Lower to a small consistent hover above the chest; pause without touching the chest.",
      "Press to the finish. Record hover distance and pause duration when known.",
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
