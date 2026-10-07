/**
 * The 50-exercise expansion (brief of 6 October 2026), candidates E01-E50.
 *
 * Every record here has a fixed id, `400 + candidate number`, written out rather than derived from
 * array position: exerciseCatalogExpansion.ts numbers its records by position, so anything inserted
 * there would renumber every record after it and break saved plans, sessions and database joins.
 * Ids are never reused; a candidate that is withdrawn keeps its number retired.
 *
 * Each record has two halves:
 * - the catalog fields every consumer already reads (`Exercise`), and
 * - a descriptor (exerciseDescriptors.ts) stating the inputs the genome and targeting model would
 *   otherwise infer from the name, plus the exact setup, entry wording and aliases.
 *
 * What is authored and what is computed: muscles, roles, setup and mechanics descriptors are
 * authored from the sources in docs/exercise-expansion-v1/evidence.json. `muscleGrade` and
 * `sportFit` are the catalog's ordinal product rubric (below), not physiology measurements. Every
 * score (fingerprint, targeting, coverage, exposure) is computed by the existing engines from these
 * inputs and exported to docs/exercise-expansion-v1/diagnostics.json by scripts/exercise-expansion.
 *
 * Rubric. muscleGrade: S for multi-joint loaded patterns, carries and sleds; A for single-joint,
 * isometric and band work (the catalog uses only these two). sportFit: how directly the trained
 * capacity appears in that sport's common demands, graded on the same scale as the closest
 * existing family, with the help text naming the capacity rather than a promised transfer.
 */
import type { Exercise, Grade, Sport } from "./exerciseCatalog";
import type { ExerciseDescriptor, FingerprintPredicates, GenomeTaskPredicates, TargetingPredicates } from "./exerciseDescriptors";

type Fit = [Grade, string];
type Record5 = Record<Sport, Fit>;

const fit = (grades: Record5): Exercise["sportFit"] => ({
  tennis: { grade: grades.tennis[0], movementHelp: grades.tennis[1] },
  basketball: { grade: grades.basketball[0], movementHelp: grades.basketball[1] },
  soccer: { grade: grades.soccer[0], movementHelp: grades.soccer[1] },
  baseball: { grade: grades.baseball[0], movementHelp: grades.baseball[1] },
  combat: { grade: grades.combat[0], movementHelp: grades.combat[1] },
});

const NECK: Record5 = { tennis: ["D", "head stability"], basketball: ["C", "contact robustness"], soccer: ["B", "heading and contact"], baseball: ["D", "head stability"], combat: ["A", "head and neck control in contact"] };
const FOREARM: Record5 = { tennis: ["A", "racquet-face control"], basketball: ["C", "ball handling"], soccer: ["D", "little direct transfer"], baseball: ["A", "bat and ball control"], combat: ["A", "wrist control in grips"] };
const WRIST_FLEX: Record5 = { tennis: ["A", "racquet grip"], basketball: ["B", "ball protection"], soccer: ["D", "little direct transfer"], baseball: ["A", "bat and ball control"], combat: ["S", "grip strength"] };
const CRUSH: Record5 = { tennis: ["A", "racquet grip"], basketball: ["B", "ball protection"], soccer: ["D", "little direct transfer"], baseball: ["A", "bat and ball control"], combat: ["S", "crush grip on sleeves and wrists"] };
const FINGER_EXT: Record5 = { tennis: ["B", "forearm balance for gripping"], basketball: ["C", "hand robustness"], soccer: ["D", "little direct transfer"], baseball: ["B", "forearm balance for gripping"], combat: ["B", "forearm balance for gripping"] };
const PINCH: Record5 = { tennis: ["B", "fingertip and thumb control"], basketball: ["B", "ball control"], soccer: ["D", "little direct transfer"], baseball: ["B", "fingertip and thumb control"], combat: ["A", "pinch and fingertip grip"] };
const DIP: Record5 = { tennis: ["C", "pressing capacity"], basketball: ["B", "contact strength"], soccer: ["C", "contact tolerance"], baseball: ["C", "pressing capacity"], combat: ["B", "frames and posting"] };
const PULL: Record5 = { tennis: ["B", "racquet deceleration & posture"], basketball: ["B", "rebounding position & contact"], soccer: ["C", "shielding support"], baseball: ["A", "throwing/batting deceleration"], combat: ["A", "pulling in clinches"] };
const SQUAT: Record5 = { tennis: ["A", "braking & lateral push-off"], basketball: ["A", "jumping & cutting"], soccer: ["A", "acceleration & cutting"], baseball: ["A", "ground-force production"], combat: ["A", "stance & level changes"] };
const HINGE: Record5 = { tennis: ["B", "hip drive"], basketball: ["A", "jumping & contact"], soccer: ["A", "sprint hip extension"], baseball: ["A", "ground-force production"], combat: ["A", "lifting and level changes"] };
const CURL: Record5 = { tennis: ["B", "sprint & deceleration"], basketball: ["B", "sprint & deceleration"], soccer: ["A", "sprint & hamstring capacity"], baseball: ["B", "sprint & deceleration"], combat: ["C", "knee-flexion capacity"] };
const KNEE_ECC: Record5 = { tennis: ["B", "braking"], basketball: ["A", "landing & jumping"], soccer: ["A", "deceleration & kicking"], baseball: ["C", "braking"], combat: ["B", "kneeling positions"] };
const LATERAL: Record5 = { tennis: ["A", "lateral push-off"], basketball: ["A", "lateral defence & cutting"], soccer: ["A", "cutting"], baseball: ["B", "lateral stride"], combat: ["A", "lateral stance changes"] };
const HIP_FLEX: Record5 = { tennis: ["B", "first-step knee drive"], basketball: ["B", "knee drive"], soccer: ["A", "sprinting & kicking"], baseball: ["C", "stride leg lift"], combat: ["B", "knee drive & kicks"] };
const SHOULDER: Record5 = { tennis: ["B", "shoulder capacity for serving"], basketball: ["B", "shoulder capacity"], soccer: ["C", "shoulder capacity"], baseball: ["B", "shoulder capacity"], combat: ["B", "shoulder capacity"] };
const TRUNK_EXT: Record5 = { tennis: ["B", "posture under load"], basketball: ["B", "posture under load"], soccer: ["B", "posture under load"], baseball: ["B", "posture under load"], combat: ["B", "posture under load"] };
const ROTATION: Record5 = { tennis: ["A", "stroke rotation"], basketball: ["B", "trunk control"], soccer: ["B", "trunk control"], baseball: ["A", "swing and throw rotation"], combat: ["A", "rotational strikes and throws"] };
const GLUTE: Record5 = { tennis: ["A", "hip extension for push-off"], basketball: ["A", "jumping & hip extension"], soccer: ["A", "sprint hip extension"], baseball: ["A", "ground-force production"], combat: ["B", "hip drive"] };
const CARRY: Record5 = { tennis: ["B", "court movement capacity"], basketball: ["A", "contact & court capacity"], soccer: ["A", "repeated effort under load"], baseball: ["B", "general athletic capacity"], combat: ["S", "carries, clinch strength & grip"] };
const OVERHEAD: Record5 = { tennis: ["A", "overhead shoulder stability"], basketball: ["B", "shoulder stability"], soccer: ["C", "shoulder stability"], baseball: ["A", "overhead shoulder control"], combat: ["A", "shoulder stability under load"] };
const SANDBAG: Record5 = { tennis: ["B", "whole-body force"], basketball: ["A", "contact & whole-body force"], soccer: ["B", "whole-body force"], baseball: ["B", "whole-body force"], combat: ["S", "lifting a resisting load"] };
const SLED: Record5 = { tennis: ["B", "repeated effort"], basketball: ["B", "repeated effort"], soccer: ["B", "repeated effort"], baseball: ["B", "repeated effort"], combat: ["A", "pulling and grip endurance"] };
const SIDE_BEND: Record5 = { tennis: ["B", "lateral trunk strength"], basketball: ["B", "lateral trunk strength"], soccer: ["B", "lateral trunk strength"], baseball: ["B", "lateral trunk strength"], combat: ["B", "lateral trunk strength"] };
const LIFT: Record5 = { tennis: ["A", "trunk control through rotation"], basketball: ["B", "trunk control"], soccer: ["B", "trunk control"], baseball: ["A", "trunk control through rotation"], combat: ["A", "trunk control through rotation"] };

const fp = (set: Partial<FingerprintPredicates> = {}): FingerprintPredicates => ({
  freeWeight: false, unilateral: false, ballistic: false, complex: false, machine: false, isolation: false,
  strengthPattern: false, deepRange: false, axialPattern: false, rackCost: false, ...set,
});
const task = (set: Partial<GenomeTaskPredicates> = {}): GenomeTaskPredicates => ({ gripTask: false, axialTask: false, needsSpace: false, specialistEquipment: false, ...set });
const tgt = (set: Partial<TargetingPredicates> = {}): TargetingPredicates => ({
  forceVector: "gravity", unilateral: false, ballistic: false, eccentric: false, lengthened: false, broadMoment: false, momentArm: "default", forceLength: "default", ...set,
});

const notEstablished = (why: string): ExerciseDescriptor["resistance"] => ({ bias: "Not established", stickingRegion: why, peakRegion: "Not established by the sources reviewed", curve: [] });
const held = (what: string): ExerciseDescriptor["resistance"] => ({ bias: "Isometric", stickingRegion: `No repetition range: ${what}`, peakRegion: "Constant position", curve: [] });
const MACHINE_CURVE = "Set by this machine's cam or lever geometry, which differs between makers";

type Addition = { exercise: Omit<Exercise, "evidenceContext">; descriptor: ExerciseDescriptor };

const NECK_GROUP = "Neck — Expansion v1";
const GRIP_GROUP = "Forearm & Grip — Expansion v1";
const MACHINE_GROUP = "Machines — Expansion v1";
const LOWER_GROUP = "Barbell & Lower Body — Expansion v1";
const CARRY_GROUP = "Carries, Sleds & Trunk — Expansion v1";

const additions: Addition[] = [
  // E01-E08: the neck. Two catalog keys, flexors (front) and extensors (back), so the figure,
  // the week and the strength regions can tell them apart.
  {
    exercise: { id: 401, name: "Neck Flexion Machine", sourceGroup: NECK_GROUP, category: "Neck", equipment: "Machine", movement: "Neck flexion", primaryMuscles: ["neckFlexors"], secondaryMuscles: [], qualities: ["strength", "hypertrophy"], muscleGrade: "A", sportFit: fit(NECK) },
    descriptor: {
      id: 401, candidate: "E01", requestedName: "Neck Flexion Machine",
      setup: "Seated in a multi-direction neck machine, facing the pad with the forehead on it and the torso upright and still. Bring the chin toward the chest against the stack, then return to neutral.",
      entryNote: "Weight is the number on the stack. It is not comparable with another make of neck machine.",
      aliases: ["neck flexion", "neck machine flexion", "4 way neck flexion", "four way neck flexion", "cervical flexion machine"],
      distinctFrom: "No neck exercise existed in the catalog. Not abdominal flexion: the trunk stays still and only the cervical spine moves.",
      movementPatterns: ["Neck flexion"], jointActions: ["Cervical flexion"], forceDirection: "Sagittal: head pushed forward against the pad", chain: "Open", stance: "Bilateral",
      resistance: notEstablished(MACHINE_CURVE),
      fingerprint: fp({ machine: true, isolation: true }), task: task({ specialistEquipment: true }),
      targeting: tgt({ forceVector: "guided", momentArm: "focused" }),
      studyKey: "machine-modality",
      anatomy: { neckFlexors: "Sternocleidomastoid, longus colli and capitis, anterior scalenes" }, stabilizers: [],
    },
  },
  {
    exercise: { id: 402, name: "Neck Extension Machine", sourceGroup: NECK_GROUP, category: "Neck", equipment: "Machine", movement: "Neck extension", primaryMuscles: ["neckExtensors"], secondaryMuscles: ["traps"], qualities: ["strength", "hypertrophy"], muscleGrade: "A", sportFit: fit(NECK) },
    descriptor: {
      id: 402, candidate: "E02", requestedName: "Neck Extension Machine",
      setup: "Seated in a multi-direction neck machine with the back of the head on the pad and the torso upright. Extend the head back from slight flexion to neutral against the stack.",
      entryNote: "Weight is the number on the stack. It is not comparable with another make of neck machine.",
      aliases: ["neck extension", "neck machine extension", "4 way neck extension", "four way neck extension", "cervical extension machine"],
      distinctFrom: "Cervical extension only: not a back or trunk extension, and not the triceps 'extension' family the name might suggest.",
      movementPatterns: ["Neck extension"], jointActions: ["Cervical extension"], forceDirection: "Sagittal: head pushed back against the pad", chain: "Open", stance: "Bilateral",
      resistance: notEstablished(MACHINE_CURVE),
      fingerprint: fp({ machine: true, isolation: true }), task: task({ specialistEquipment: true }),
      targeting: tgt({ forceVector: "guided", momentArm: "focused" }),
      studyKey: "machine-modality",
      anatomy: { neckExtensors: "Splenius capitis and cervicis, semispinalis capitis and cervicis", traps: "Upper trapezius" }, stabilizers: [],
    },
  },
  {
    exercise: { id: 403, name: "Neck Lateral Flexion Machine", sourceGroup: NECK_GROUP, category: "Neck", equipment: "Machine", movement: "Neck lateral flexion", primaryMuscles: ["neckFlexors", "neckExtensors"], secondaryMuscles: ["traps"], qualities: ["strength", "hypertrophy", "unilateral"], muscleGrade: "A", sportFit: fit(NECK) },
    descriptor: {
      id: 403, candidate: "E03", requestedName: "Neck Lateral Flexion Machine",
      setup: "Seated side-on in a multi-direction neck machine with the side of the head on the pad. Tilt the ear toward the shoulder against the stack, then switch sides. A set is one side; log the side.",
      entryNote: "Weight is the number on the stack. Log each side as its own set and name the side.",
      aliases: ["neck lateral flexion", "neck side flexion machine", "4 way neck side", "four way neck lateral"],
      distinctFrom: "Lateral flexion of the neck only: not a trunk side bend, and not counted once per side twice.",
      movementPatterns: ["Neck lateral flexion"], jointActions: ["Cervical lateral flexion"], forceDirection: "Frontal: head pushed sideways against the pad", chain: "Open", stance: "Unilateral",
      resistance: notEstablished(MACHINE_CURVE),
      fingerprint: fp({ machine: true, isolation: true, unilateral: true }), task: task({ specialistEquipment: true }),
      targeting: tgt({ forceVector: "guided", momentArm: "focused", unilateral: true }),
      studyKey: "machine-modality",
      anatomy: { neckFlexors: "Same-side sternocleidomastoid and scalenes", neckExtensors: "Same-side splenius and semispinalis", traps: "Upper trapezius" }, stabilizers: [],
    },
  },
  {
    exercise: { id: 404, name: "Harness Neck Extension", sourceGroup: NECK_GROUP, category: "Neck", equipment: "Neck harness", movement: "Neck extension", primaryMuscles: ["neckExtensors"], secondaryMuscles: ["traps"], qualities: ["strength", "hypertrophy"], muscleGrade: "A", sportFit: fit(NECK) },
    descriptor: {
      id: 404, candidate: "E04", requestedName: "Harness Neck Extension",
      setup: "Seated at the end of a bench, torso leaning forward with hands on the knees, plates hanging from a head harness. Lift the head from flexion back to neutral and lower under control.",
      entryNote: "Weight is the plates on the harness (leave out the harness itself). It is not a machine stack or a neck torque.",
      aliases: ["neck harness extension", "head harness", "neck harness", "harness neck"],
      distinctFrom: "Free-hanging plates on a harness: kept apart from the machine (402) and band (406) extensions because the load means something different in each.",
      movementPatterns: ["Neck extension"], jointActions: ["Cervical extension"], forceDirection: "Gravity: plates hang from the head, resisted by extending", chain: "Open", stance: "Bilateral",
      resistance: notEstablished("Changes with torso lean and head angle; no source measured it"),
      fingerprint: fp({ freeWeight: true, isolation: true }), task: task({ specialistEquipment: true }),
      targeting: tgt({ forceVector: "gravity", momentArm: "focused" }),
      studyKey: null,
      anatomy: { neckExtensors: "Splenius capitis and cervicis, semispinalis capitis and cervicis", traps: "Upper trapezius" }, stabilizers: [],
    },
  },
  {
    exercise: { id: 405, name: "Band-Resisted Neck Flexion", sourceGroup: NECK_GROUP, category: "Neck", equipment: "Band", movement: "Neck flexion", primaryMuscles: ["neckFlexors"], secondaryMuscles: [], qualities: ["strength", "endurance"], muscleGrade: "A", sportFit: fit(NECK) },
    descriptor: {
      id: 405, candidate: "E05", requestedName: "Band-Resisted Neck Flexion",
      setup: "A band anchored behind you at head height and looped over the forehead. Step forward until it is taut, then bring the chin toward the chest and return.",
      entryNote: "Name the band (colour or rating) and the anchor distance; a band has no weight to enter.",
      aliases: ["band neck flexion", "banded neck flexion", "neck flexion band"],
      distinctFrom: "Band resistance rises as it stretches; kept apart from the machine version (401), and the band is recorded as a setting, never converted to kilograms.",
      movementPatterns: ["Neck flexion"], jointActions: ["Cervical flexion"], forceDirection: "Band line from behind the head", chain: "Open", stance: "Bilateral",
      resistance: notEstablished("Depends on the band and how far it is stretched"),
      fingerprint: fp({ isolation: true }), task: task(),
      targeting: tgt({ forceVector: "band", momentArm: "focused" }),
      studyKey: null,
      anatomy: { neckFlexors: "Sternocleidomastoid, longus colli and capitis, anterior scalenes" }, stabilizers: [],
    },
  },
  {
    exercise: { id: 406, name: "Band-Resisted Neck Extension", sourceGroup: NECK_GROUP, category: "Neck", equipment: "Band", movement: "Neck extension", primaryMuscles: ["neckExtensors"], secondaryMuscles: ["traps"], qualities: ["strength", "endurance"], muscleGrade: "A", sportFit: fit(NECK) },
    descriptor: {
      id: 406, candidate: "E06", requestedName: "Band-Resisted Neck Extension",
      setup: "A band anchored in front at head height and looped behind the head. Step back until it is taut, then take the head back to neutral and return.",
      entryNote: "Name the band (colour or rating) and the anchor distance; a band has no weight to enter.",
      aliases: ["band neck extension", "banded neck extension", "neck extension band"],
      distinctFrom: "Kept apart from the machine (402) and harness (404) extensions; the band is a setting, not a load.",
      movementPatterns: ["Neck extension"], jointActions: ["Cervical extension"], forceDirection: "Band line from in front of the head", chain: "Open", stance: "Bilateral",
      resistance: notEstablished("Depends on the band and how far it is stretched"),
      fingerprint: fp({ isolation: true }), task: task(),
      targeting: tgt({ forceVector: "band", momentArm: "focused" }),
      studyKey: null,
      anatomy: { neckExtensors: "Splenius capitis and cervicis, semispinalis capitis and cervicis", traps: "Upper trapezius" }, stabilizers: [],
    },
  },
  {
    exercise: { id: 407, name: "Isometric Neck Lateral Flexion", sourceGroup: NECK_GROUP, category: "Neck", equipment: "Bodyweight", movement: "Neck lateral flexion", primaryMuscles: ["neckFlexors", "neckExtensors"], secondaryMuscles: ["traps"], qualities: ["stability", "strength", "unilateral"], muscleGrade: "A", sportFit: fit(NECK) },
    descriptor: {
      id: 407, candidate: "E07", requestedName: "Isometric Neck Lateral Flexion",
      setup: "Head upright and still. Place one hand on the same side of the head and press the head into it, building tension slowly, without the head moving. Hold, release slowly, then the other side.",
      entryNote: "Record the hold in seconds and the side. Resistance is your own hand; nothing is typed as a weight.",
      aliases: ["isometric neck side", "neck side hold", "isometric neck lateral", "manual neck lateral flexion"],
      distinctFrom: "A hold against your own hand: no load and no repetitions, so it is timed and never becomes a one-rep max.",
      movementPatterns: ["Neck lateral flexion"], jointActions: ["Cervical lateral flexion (isometric)"], forceDirection: "Frontal: head pressed sideways into the hand", chain: "Closed", stance: "Unilateral",
      resistance: held("the head is held still against the hand"),
      fingerprint: fp({ isolation: true, unilateral: true }), task: task(),
      targeting: tgt({ forceVector: "self", momentArm: "focused", unilateral: true }),
      studyKey: null,
      anatomy: { neckFlexors: "Same-side sternocleidomastoid and scalenes", neckExtensors: "Same-side splenius and semispinalis", traps: "Upper trapezius" }, stabilizers: [],
    },
  },
  {
    exercise: { id: 408, name: "Isometric Neck Rotation", sourceGroup: NECK_GROUP, category: "Neck", equipment: "Bodyweight", movement: "Neck rotation", primaryMuscles: ["neckFlexors", "neckExtensors"], secondaryMuscles: [], qualities: ["stability", "strength", "unilateral"], muscleGrade: "A", sportFit: fit(NECK) },
    descriptor: {
      id: 408, candidate: "E08", requestedName: "Isometric Neck Rotation",
      setup: "Head upright and still. Place a hand on the side of the forehead and try to turn the head into it without it moving. Hold, release slowly, then the other direction.",
      entryNote: "Record the hold in seconds and the direction. No weight is typed and there is no movement range.",
      aliases: ["isometric neck rotation", "neck rotation hold", "manual neck rotation"],
      distinctFrom: "Resists rotation without moving: no dynamic rotation curve is attached to it.",
      movementPatterns: ["Neck rotation"], jointActions: ["Cervical rotation (isometric)"], forceDirection: "Transverse: head turned into the hand", chain: "Closed", stance: "Unilateral",
      resistance: held("the head is held still against the hand"),
      fingerprint: fp({ isolation: true, unilateral: true }), task: task(),
      targeting: tgt({ forceVector: "self", momentArm: "focused", unilateral: true }),
      studyKey: null,
      anatomy: { neckFlexors: "Opposite-side sternocleidomastoid", neckExtensors: "Same-side splenius capitis and cervicis" }, stabilizers: [],
    },
  },

  // E09-E18: forearm, wrist and hand. The catalog tags all of it `forearms`; the descriptor names
  // the muscles that key stands for in each exercise, so the record says pronator, not "forearm".
  {
    exercise: { id: 409, name: "Dumbbell Forearm Pronation", sourceGroup: GRIP_GROUP, category: "Arms & grip", equipment: "Dumbbells", movement: "Forearm pronation", primaryMuscles: ["forearms"], secondaryMuscles: [], qualities: ["strength", "endurance", "unilateral"], muscleGrade: "A", sportFit: fit(FOREARM) },
    descriptor: {
      id: 409, candidate: "E09", requestedName: "Dumbbell Forearm Pronation",
      setup: "Seated with the forearm supported on a bench or thigh, elbow bent to about a right angle and the wrist past the edge. Hold one end of a dumbbell so the other end is the lever, and turn the palm down from palm-up or neutral.",
      entryNote: "Weight is the one dumbbell, but where you hold the handle changes the effort: keep the grip position the same to compare sets.",
      aliases: ["forearm pronation", "dumbbell pronation", "pronation", "wrist pronation", "db pronation"],
      distinctFrom: "Rotation of the forearm, not wrist flexion: kept apart from the wrist curl (139) and from supination (410).",
      movementPatterns: ["Forearm pronation"], jointActions: ["Forearm pronation"], forceDirection: "Rotational: lever turned about the forearm's long axis", chain: "Open", stance: "Unilateral",
      resistance: notEstablished("Set by the lever length (grip position) and forearm angle"),
      fingerprint: fp({ freeWeight: true, isolation: true, unilateral: true }), task: task(),
      targeting: tgt({ momentArm: "focused", unilateral: true }),
      studyKey: "free-weight-modality",
      anatomy: { forearms: "Pronator teres, pronator quadratus" }, stabilizers: [],
    },
  },
  {
    exercise: { id: 410, name: "Dumbbell Forearm Supination", sourceGroup: GRIP_GROUP, category: "Arms & grip", equipment: "Dumbbells", movement: "Forearm supination", primaryMuscles: ["forearms"], secondaryMuscles: ["biceps"], qualities: ["strength", "endurance", "unilateral"], muscleGrade: "A", sportFit: fit(FOREARM) },
    descriptor: {
      id: 410, candidate: "E10", requestedName: "Dumbbell Forearm Supination",
      setup: "Same support as pronation: forearm on a bench or thigh, elbow at about a right angle, holding one end of a dumbbell. Turn the palm up from palm-down or neutral.",
      entryNote: "Weight is the one dumbbell; keep the grip position on the handle the same to compare sets.",
      aliases: ["forearm supination", "dumbbell supination", "supination", "wrist supination", "db supination"],
      distinctFrom: "Not a curl: the elbow does not bend. Kept apart from pronation (409) and from the curl family.",
      movementPatterns: ["Forearm supination"], jointActions: ["Forearm supination"], forceDirection: "Rotational: lever turned about the forearm's long axis", chain: "Open", stance: "Unilateral",
      resistance: notEstablished("Set by the lever length (grip position) and forearm angle"),
      fingerprint: fp({ freeWeight: true, isolation: true, unilateral: true }), task: task(),
      targeting: tgt({ momentArm: "focused", unilateral: true }),
      studyKey: "free-weight-modality",
      anatomy: { forearms: "Supinator", biceps: "Biceps brachii (a supinator with the elbow bent)" }, stabilizers: [],
    },
  },
  {
    exercise: { id: 411, name: "Dumbbell Wrist Radial Deviation", sourceGroup: GRIP_GROUP, category: "Arms & grip", equipment: "Dumbbells", movement: "Wrist radial deviation", primaryMuscles: ["forearms"], secondaryMuscles: [], qualities: ["strength", "endurance", "unilateral"], muscleGrade: "A", sportFit: fit(FOREARM) },
    descriptor: {
      id: 411, candidate: "E11", requestedName: "Dumbbell Wrist Radial Deviation",
      setup: "Standing, arm straight at the side, holding one end of a dumbbell with the loaded end in front. Tip the loaded end up by bending the wrist toward the thumb side, then lower.",
      entryNote: "Weight is the one dumbbell; keep the grip position the same to compare sets.",
      aliases: ["radial deviation", "wrist radial deviation", "dumbbell radial deviation", "thumb side wrist raise"],
      distinctFrom: "Sideways wrist motion toward the thumb, not wrist flexion: a wrist-curl search alias does not stand for it.",
      movementPatterns: ["Wrist radial deviation"], jointActions: ["Wrist radial deviation"], forceDirection: "Lever raised in front by tilting the wrist", chain: "Open", stance: "Unilateral",
      resistance: notEstablished("Set by the lever length (grip position)"),
      fingerprint: fp({ freeWeight: true, isolation: true, unilateral: true }), task: task(),
      targeting: tgt({ momentArm: "focused", unilateral: true }),
      studyKey: "free-weight-modality",
      anatomy: { forearms: "Flexor carpi radialis, extensor carpi radialis longus and brevis, abductor pollicis longus" }, stabilizers: [],
    },
  },
  {
    exercise: { id: 412, name: "Dumbbell Wrist Ulnar Deviation", sourceGroup: GRIP_GROUP, category: "Arms & grip", equipment: "Dumbbells", movement: "Wrist ulnar deviation", primaryMuscles: ["forearms"], secondaryMuscles: [], qualities: ["strength", "endurance", "unilateral"], muscleGrade: "A", sportFit: fit(FOREARM) },
    descriptor: {
      id: 412, candidate: "E12", requestedName: "Dumbbell Wrist Ulnar Deviation",
      setup: "Standing, arm straight at the side, holding one end of a dumbbell with the loaded end behind. Tip the loaded end up behind you by bending the wrist toward the little-finger side, then lower.",
      entryNote: "Weight is the one dumbbell; keep the grip position the same to compare sets.",
      aliases: ["ulnar deviation", "wrist ulnar deviation", "dumbbell ulnar deviation", "little finger side wrist raise"],
      distinctFrom: "Sideways wrist motion toward the little finger: kept apart from radial deviation (411) and wrist flexion.",
      movementPatterns: ["Wrist ulnar deviation"], jointActions: ["Wrist ulnar deviation"], forceDirection: "Lever raised behind by tilting the wrist", chain: "Open", stance: "Unilateral",
      resistance: notEstablished("Set by the lever length (grip position)"),
      fingerprint: fp({ freeWeight: true, isolation: true, unilateral: true }), task: task(),
      targeting: tgt({ momentArm: "focused", unilateral: true }),
      studyKey: "free-weight-modality",
      anatomy: { forearms: "Flexor carpi ulnaris, extensor carpi ulnaris" }, stabilizers: [],
    },
  },
  {
    exercise: { id: 413, name: "Cable Wrist Flexion", sourceGroup: GRIP_GROUP, category: "Arms & grip", equipment: "Cable", movement: "Wrist flexion", primaryMuscles: ["forearms"], secondaryMuscles: [], qualities: ["hypertrophy", "grip", "endurance"], muscleGrade: "A", sportFit: fit(WRIST_FLEX) },
    descriptor: {
      id: 413, candidate: "E13", requestedName: "Cable Wrist Flexion",
      setup: "Seated facing a low pulley with a straight bar, palms up, forearms resting on the thighs and the wrists just past the knees. Curl the wrists up, then lower under control.",
      entryNote: "Weight is the number on the stack. Pulley ratios differ, so it is not comparable with a free-weight wrist curl.",
      aliases: ["cable wrist curl", "seated cable wrist curl", "low pulley wrist curl", "cable wrist flexion"],
      distinctFrom: "The cable counterpart of Cable Wrist Extension (350); the free-weight Wrist Curl (139) is a separate record because its load means something different.",
      movementPatterns: ["Wrist flexion"], jointActions: ["Wrist flexion"], forceDirection: "Cable line from the low pulley", chain: "Open", stance: "Bilateral",
      resistance: notEstablished("Set by the cable angle relative to the forearm"),
      fingerprint: fp({ isolation: true }), task: task({ gripTask: true }),
      targeting: tgt({ forceVector: "cable", momentArm: "focused" }),
      studyKey: null,
      anatomy: { forearms: "Flexor carpi radialis and ulnaris, palmaris longus, finger flexors" }, stabilizers: [],
    },
  },
  {
    exercise: { id: 414, name: "Behind-the-Back Barbell Wrist Curl", sourceGroup: GRIP_GROUP, category: "Arms & grip", equipment: "Barbell", movement: "Wrist flexion", primaryMuscles: ["forearms"], secondaryMuscles: [], qualities: ["hypertrophy", "grip", "endurance"], muscleGrade: "A", sportFit: fit(WRIST_FLEX) },
    descriptor: {
      id: 414, candidate: "E14", requestedName: "Behind-the-Back Barbell Wrist Curl",
      setup: "Standing, holding a barbell behind the hips at arm's length with the palms facing back. Curl the wrists up toward the ceiling, then lower; only the wrists move.",
      entryNote: "Weight is the whole bar with its plates.",
      aliases: ["behind the back wrist curl", "standing behind back wrist curl", "behind back barbell wrist curl"],
      distinctFrom: "Standing with the bar behind the body and no forearm support: not the supported, seated Wrist Curl (139).",
      movementPatterns: ["Wrist flexion"], jointActions: ["Wrist flexion", "Finger flexion"], forceDirection: "Gravity: bar hangs behind the hips", chain: "Open", stance: "Bilateral",
      resistance: notEstablished("No source measured it for this posture"),
      fingerprint: fp({ freeWeight: true, isolation: true }), task: task({ gripTask: true }),
      targeting: tgt({ momentArm: "focused" }),
      studyKey: "free-weight-modality",
      anatomy: { forearms: "Wrist flexors and finger flexors" }, stabilizers: [],
    },
  },
  {
    exercise: { id: 415, name: "Barbell Finger Curl", sourceGroup: GRIP_GROUP, category: "Arms & grip", equipment: "Barbell", movement: "Finger flexion", primaryMuscles: ["forearms"], secondaryMuscles: [], qualities: ["grip", "endurance", "hypertrophy"], muscleGrade: "A", sportFit: fit(CRUSH) },
    descriptor: {
      id: 415, candidate: "E15", requestedName: "Finger Curl",
      setup: "Seated, forearms on the thighs, holding a barbell palms up. Open the fingers so the bar rolls down to the last finger joints, then close the hand to roll it back up.",
      entryNote: "Weight is the whole bar with its plates.",
      aliases: ["finger curl", "finger curls", "barbell finger roll", "finger roll"],
      distinctFrom: "The fingers move, not the wrist: kept apart from the wrist curl, and the barbell is the one implement this record means.",
      movementPatterns: ["Finger flexion"], jointActions: ["Finger flexion"], forceDirection: "Gravity: bar rolls down the fingers", chain: "Open", stance: "Bilateral",
      resistance: notEstablished("No source measured it"),
      fingerprint: fp({ freeWeight: true, isolation: true }), task: task({ gripTask: true }),
      targeting: tgt({ momentArm: "focused" }),
      studyKey: "free-weight-modality",
      anatomy: { forearms: "Flexor digitorum superficialis and profundus" }, stabilizers: [],
    },
  },
  {
    exercise: { id: 416, name: "Hand Gripper Close", sourceGroup: GRIP_GROUP, category: "Arms & grip", equipment: "Hand gripper", movement: "Grip crush", primaryMuscles: ["forearms"], secondaryMuscles: [], qualities: ["grip", "strength", "unilateral"], muscleGrade: "A", sportFit: fit(CRUSH) },
    descriptor: {
      id: 416, candidate: "E16", requestedName: "Hand Gripper Close",
      setup: "A torsion-spring hand gripper in one hand. A rep counts when the handles touch; open fully between reps.",
      entryNote: "Name the gripper (model and rating) as the setting. A rating is not a measured grip force.",
      aliases: ["gripper", "hand gripper", "gripper close", "crush gripper", "captains of crush"],
      distinctFrom: "A spring with a rating, not a weight: no kilograms and no grip-force percentile.",
      movementPatterns: ["Grip crush"], jointActions: ["Finger flexion", "Thumb flexion and opposition"], forceDirection: "Handles squeezed together", chain: "Open", stance: "Unilateral",
      resistance: notEstablished("A spring resists more as it closes; the gripper's own curve was not measured"),
      fingerprint: fp({ isolation: true, unilateral: true }), task: task({ gripTask: true, specialistEquipment: true }),
      targeting: tgt({ forceVector: "band", momentArm: "focused", unilateral: true }),
      studyKey: null,
      anatomy: { forearms: "Flexor digitorum superficialis and profundus, thenar muscles" }, stabilizers: [],
    },
  },
  {
    exercise: { id: 417, name: "Rubber-Band Finger Extension", sourceGroup: GRIP_GROUP, category: "Arms & grip", equipment: "Band", movement: "Finger extension", primaryMuscles: ["forearms"], secondaryMuscles: [], qualities: ["endurance", "unilateral"], muscleGrade: "A", sportFit: fit(FINGER_EXT) },
    descriptor: {
      id: 417, candidate: "E17", requestedName: "Rubber-Band Finger Extension",
      setup: "A rubber band around the fingertips and thumb. Open the hand fully against the band, then close slowly.",
      entryNote: "Name the band if you like; there is no weight to enter, just reps.",
      aliases: ["finger extension", "band finger extension", "rubber band finger", "finger extensor band"],
      distinctFrom: "Opening the hand, not extending the wrist: kept apart from wrist extension (350) and from crush grip.",
      movementPatterns: ["Finger extension"], jointActions: ["Finger extension", "Thumb extension"], forceDirection: "Band around the fingers, opened outward", chain: "Open", stance: "Unilateral",
      resistance: notEstablished("Depends on the band"),
      fingerprint: fp({ isolation: true, unilateral: true }), task: task(),
      targeting: tgt({ forceVector: "band", momentArm: "focused", unilateral: true }),
      studyKey: null,
      anatomy: { forearms: "Extensor digitorum, extensor pollicis longus and brevis" }, stabilizers: [],
    },
  },
  {
    exercise: { id: 418, name: "Hub Grip Lift", sourceGroup: GRIP_GROUP, category: "Arms & grip", equipment: "Grip hub", movement: "Grip isometric", primaryMuscles: ["forearms"], secondaryMuscles: [], qualities: ["grip", "strength", "unilateral"], muscleGrade: "A", sportFit: fit(PINCH) },
    descriptor: {
      id: 418, candidate: "E18", requestedName: "Hub Grip Lift",
      setup: "A plate hub on a loading pin. Pinch the hub's rim with the fingertips and thumb of one hand, lift it to standing and hold. A lift counts when it leaves the floor and is held for the stated time.",
      entryNote: "Weight is everything on the pin (pin and plates). Name the hub as the setting; record the hold in seconds.",
      aliases: ["hub lift", "plate hub", "hub", "hub pinch", "grip hub"],
      distinctFrom: "Not a plate pinch (142) and not a dynamometer test: different hubs are different tests, so the hub is recorded with every lift.",
      movementPatterns: ["Grip isometric"], jointActions: ["Thumb opposition (isometric)", "Finger flexion (isometric)"], forceDirection: "Gravity: load hangs from the pinched hub", chain: "Open", stance: "Unilateral",
      resistance: held("the hub is pinched and held"),
      fingerprint: fp({ freeWeight: true, isolation: true, unilateral: true }), task: task({ gripTask: true, specialistEquipment: true }),
      targeting: tgt({ momentArm: "focused", unilateral: true }),
      studyKey: null,
      anatomy: { forearms: "Thumb flexors and adductor pollicis, finger flexors" }, stabilizers: [],
    },
  },

  // E19-E30: machines and guided-bar variants.
  {
    exercise: { id: 419, name: "Seated Dip Machine", sourceGroup: MACHINE_GROUP, category: "Arms & push", equipment: "Machine", movement: "Dip", primaryMuscles: ["triceps"], secondaryMuscles: ["chest", "frontDelts"], qualities: ["strength", "hypertrophy"], muscleGrade: "S", sportFit: fit(DIP) },
    descriptor: {
      id: 419, candidate: "E19", requestedName: "Seated Dip Machine",
      setup: "Seated in a selectorized dip machine, elbows in at the sides and bent to about a right angle. Press the handles down to just short of lockout, then return.",
      entryNote: "Weight is the number on the stack: load pressed, not body weight.",
      aliases: ["dip machine", "seated dip", "machine dip", "triceps dip machine"],
      distinctFrom: "A seated press-down against a stack: not a bodyweight dip (40), and not the assisted dip (420) where the stack helps.",
      movementPatterns: ["Dip"], jointActions: ["Elbow extension", "Shoulder extension", "Scapular depression"], forceDirection: "Downward press against the handles", chain: "Open", stance: "Bilateral",
      resistance: notEstablished(MACHINE_CURVE),
      fingerprint: fp({ machine: true, strengthPattern: true }), task: task(),
      targeting: tgt({ forceVector: "guided", broadMoment: true, momentArm: "compound" }),
      studyKey: "machine-modality",
      anatomy: { triceps: "Triceps brachii", chest: "Pectoralis major, sternocostal fibres", frontDelts: "Anterior deltoid" }, stabilizers: [],
    },
  },
  {
    exercise: { id: 420, name: "Assisted Dip Machine", sourceGroup: MACHINE_GROUP, category: "Chest & push", equipment: "Machine", movement: "Dip", primaryMuscles: ["triceps", "chest"], secondaryMuscles: ["frontDelts"], qualities: ["strength", "hypertrophy"], muscleGrade: "S", sportFit: fit(DIP) },
    descriptor: {
      id: 420, candidate: "E20", requestedName: "Assisted Dip Machine",
      setup: "Kneeling or standing on the counterweight platform, hands on the dip handles. Lower until the upper arms are about level with the floor and press back up; the stack takes part of your body weight.",
      entryNote: "The number is assistance, not load: more assistance is an easier set. Progress is less assistance for the same reps.",
      aliases: ["assisted dip", "assisted dips", "counterweight dip", "gravitron dip"],
      distinctFrom: "Assistance, not added load: kept apart from Parallel-Bar Dip (40) and from the Seated Dip Machine (419).",
      movementPatterns: ["Dip"], jointActions: ["Elbow extension", "Shoulder extension", "Scapular depression"], forceDirection: "Vertical: body lowered and pressed up between the handles", chain: "Closed", stance: "Bilateral",
      resistance: notEstablished("Body weight minus a counterweight; the lever ratio differs between machines"),
      fingerprint: fp({ machine: true, strengthPattern: true }), task: task(),
      targeting: tgt({ forceVector: "guided", broadMoment: true, momentArm: "compound" }),
      studyKey: "machine-modality",
      anatomy: { triceps: "Triceps brachii", chest: "Pectoralis major, sternocostal fibres", frontDelts: "Anterior deltoid" }, stabilizers: [],
    },
  },
  {
    exercise: { id: 421, name: "Assisted Pull-Up Machine", sourceGroup: MACHINE_GROUP, category: "Back & pull", equipment: "Machine", movement: "Vertical pull", primaryMuscles: ["lats"], secondaryMuscles: ["biceps", "upperBack", "rearDelts", "forearms"], qualities: ["strength", "hypertrophy", "grip"], muscleGrade: "S", sportFit: fit(PULL) },
    descriptor: {
      id: 421, candidate: "E21", requestedName: "Assisted Pull-Up Machine",
      setup: "Kneeling on the counterweight pad, hands on the pull-up handles. Pull until the chin clears the handles and lower fully; the stack takes part of your body weight.",
      entryNote: "The number is assistance, not load: more assistance is an easier set. A band-assisted or weighted pull-up is a different record.",
      aliases: ["assisted pull up", "assisted pullup", "assisted pull-ups", "gravitron", "counterweight pull up", "assisted chin up machine"],
      distinctFrom: "Machine assistance: not a weighted pull-up (70), not a band-assisted pull-up, and not scored as a pull-up's reps.",
      movementPatterns: ["Vertical pull"], jointActions: ["Shoulder adduction", "Elbow flexion", "Scapular depression"], forceDirection: "Vertical: body pulled up to the handles", chain: "Closed", stance: "Bilateral",
      resistance: notEstablished("Body weight minus a counterweight; the lever ratio differs between machines"),
      fingerprint: fp({ machine: true }), task: task({ gripTask: true }),
      targeting: tgt({ forceVector: "guided", broadMoment: true, momentArm: "compound" }),
      studyKey: "machine-modality",
      anatomy: { lats: "Latissimus dorsi", biceps: "Biceps brachii, brachialis", upperBack: "Rhomboids, middle and lower trapezius", rearDelts: "Posterior deltoid", forearms: "Finger flexors (grip)" }, stabilizers: [],
    },
  },
  {
    exercise: { id: 422, name: "Belt Squat Machine", sourceGroup: MACHINE_GROUP, category: "Knee dominant", equipment: "Machine", movement: "Squat / knee dominant", primaryMuscles: ["quads", "glutes"], secondaryMuscles: ["adductors"], qualities: ["strength", "hypertrophy"], muscleGrade: "S", sportFit: fit(SQUAT) },
    descriptor: {
      id: 422, candidate: "E22", requestedName: "Belt Squat Machine",
      setup: "A belt-squat machine: the belt at the hips is attached to the machine's lever or stack, and the athlete squats on its platform holding the handles. No load rests on the spine.",
      entryNote: "Weight is what the machine shows or the plates on its lever. It is not comparable with a cable or loading-pin belt squat.",
      aliases: ["belt squat", "belt squat machine", "hip belt squat", "lever belt squat"],
      distinctFrom: "The machine version: the Cable Belt Squat (351) and the Loading-Pin Belt Squat (435) load the belt differently, so their numbers are kept apart.",
      movementPatterns: ["Squat"], jointActions: ["Hip flexion / extension", "Knee extension", "Ankle dorsiflexion / plantarflexion"], forceDirection: "Vertical / ground-reaction through the hip belt", chain: "Closed", stance: "Bilateral",
      resistance: notEstablished(MACHINE_CURVE),
      fingerprint: fp({ machine: true, strengthPattern: true }), task: task({ specialistEquipment: true }),
      targeting: tgt({ forceVector: "guided", broadMoment: true, momentArm: "compound" }),
      studyKey: "machine-modality",
      anatomy: { quads: "Vastus lateralis and medialis, rectus femoris", glutes: "Gluteus maximus", adductors: "Adductor magnus" }, stabilizers: [],
    },
  },
  {
    exercise: { id: 423, name: "Horizontal Seated Leg Press", sourceGroup: MACHINE_GROUP, category: "Knee dominant", equipment: "Machine", movement: "Squat / knee dominant", primaryMuscles: ["quads", "glutes"], secondaryMuscles: ["adductors"], qualities: ["strength", "hypertrophy"], muscleGrade: "S", sportFit: fit(SQUAT) },
    descriptor: {
      id: 423, candidate: "E23", requestedName: "Horizontal Seated Leg Press",
      setup: "A selectorized seated leg press with the platform in front and the push horizontal. Feet on the platform, press out to just short of locking the knees and return.",
      entryNote: "Weight is the number on the stack. It is not comparable with a 45-degree sled leg press.",
      aliases: ["seated leg press", "horizontal leg press", "selectorized leg press", "machine leg press"],
      distinctFrom: "A horizontal, stack-loaded press: kept apart from the generic Leg Press (169) because the stack value is not the sled's plate load.",
      movementPatterns: ["Squat"], jointActions: ["Hip extension", "Knee extension", "Ankle plantarflexion"], forceDirection: "Horizontal press into the platform", chain: "Closed", stance: "Bilateral",
      resistance: notEstablished(MACHINE_CURVE),
      fingerprint: fp({ machine: true, strengthPattern: true }), task: task(),
      targeting: tgt({ forceVector: "guided", broadMoment: true, momentArm: "compound" }),
      studyKey: "machine-modality",
      studyQualification: "Leg-press ROM trials used their own machines; none is assumed to be this horizontal seated model.",
      anatomy: { quads: "Vastus lateralis and medialis, rectus femoris", glutes: "Gluteus maximus", adductors: "Adductor magnus" }, stabilizers: [],
    },
  },
  {
    exercise: { id: 424, name: "Smith Machine Bulgarian Split Squat", sourceGroup: MACHINE_GROUP, category: "Knee dominant", equipment: "Machine", movement: "Unilateral knee dominant", primaryMuscles: ["quads", "glutes"], secondaryMuscles: ["adductors"], qualities: ["strength", "hypertrophy", "unilateral"], muscleGrade: "S", sportFit: fit(SQUAT) },
    descriptor: {
      id: 424, candidate: "E24", requestedName: "Smith Machine Bulgarian Split Squat",
      setup: "Smith bar across the upper back, front foot under the bar and the rear foot's laces on a bench behind. Lower straight down and stand back up; finish one leg, then the other.",
      entryNote: "Weight is the plates on the Smith bar (Smith bars are counterbalanced differently). Reps are per leg; a set is one leg's set, counted once.",
      aliases: ["smith bulgarian split squat", "smith machine split squat", "smith rear foot elevated split squat", "smith bss"],
      distinctFrom: "Guided bar: kept apart from the free-weight Bulgarian Split Squat (173).",
      movementPatterns: ["Squat", "Lunge"], jointActions: ["Hip flexion / extension", "Knee extension", "Ankle dorsiflexion / plantarflexion"], forceDirection: "Vertical along the Smith rails", chain: "Closed", stance: "Unilateral",
      resistance: notEstablished("Guided bar path; no source measured this variation"),
      fingerprint: fp({ machine: true, unilateral: true, strengthPattern: true, deepRange: true, rackCost: true }), task: task({ axialTask: true }),
      targeting: tgt({ forceVector: "guided", unilateral: true, broadMoment: true, momentArm: "compound" }),
      studyKey: "machine-modality",
      anatomy: { quads: "Vastus lateralis and medialis, rectus femoris", glutes: "Gluteus maximus", adductors: "Adductor magnus" }, stabilizers: [],
    },
  },
  {
    exercise: { id: 425, name: "Smith Machine Romanian Deadlift", sourceGroup: MACHINE_GROUP, category: "Posterior chain", equipment: "Machine", movement: "Hip hinge", primaryMuscles: ["hamstrings", "glutes"], secondaryMuscles: ["lowerBack", "forearms"], qualities: ["strength", "hypertrophy"], muscleGrade: "S", sportFit: fit(HINGE) },
    descriptor: {
      id: 425, candidate: "E25", requestedName: "Smith Machine Romanian Deadlift",
      setup: "Holding the Smith bar at arm's length, knees soft. Push the hips back and lower the bar down the thighs until the hamstrings limit the hinge, then stand tall.",
      entryNote: "Weight is the plates on the Smith bar. Not comparable with a free-bar Romanian deadlift.",
      aliases: ["smith rdl", "smith machine rdl", "smith romanian deadlift"],
      distinctFrom: "Guided bar path: kept apart from both free-bar Romanian Deadlift records (42 and 186).",
      movementPatterns: ["Hinge"], jointActions: ["Hip flexion / extension", "Spinal anti-flexion", "Knee flexion control"], forceDirection: "Vertical along the Smith rails", chain: "Closed", stance: "Bilateral",
      resistance: notEstablished("Guided bar path; no source measured this variation"),
      fingerprint: fp({ machine: true, strengthPattern: true, axialPattern: true, rackCost: true }), task: task({ gripTask: true, axialTask: true }),
      targeting: tgt({ forceVector: "guided", lengthened: true, broadMoment: true, momentArm: "compound", forceLength: "lengthened" }),
      studyKey: "rdl-hinge",
      studyQualification: "The hinge sources tested free-bar Romanian and stiff-leg deadlifts; the Smith machine's fixed bar path was not tested.",
      anatomy: { hamstrings: "Semitendinosus, semimembranosus, biceps femoris long head", glutes: "Gluteus maximus", lowerBack: "Erector spinae", forearms: "Finger flexors (grip)" }, stabilizers: ["lowerBack"],
    },
  },
  {
    exercise: { id: 426, name: "Smith Machine Reverse Lunge", sourceGroup: MACHINE_GROUP, category: "Knee dominant", equipment: "Machine", movement: "Unilateral knee dominant", primaryMuscles: ["quads", "glutes"], secondaryMuscles: ["adductors", "hamstrings"], qualities: ["strength", "hypertrophy", "unilateral"], muscleGrade: "S", sportFit: fit(SQUAT) },
    descriptor: {
      id: 426, candidate: "E26", requestedName: "Smith Machine Reverse Lunge",
      setup: "Smith bar across the upper back. Step one foot back into a lunge, lower until the back knee nears the floor, and drive back to standing. One leg per set, or alternate and count reps per leg.",
      entryNote: "Weight is the plates on the Smith bar. Reps are per leg; a set is counted once.",
      aliases: ["smith reverse lunge", "smith machine lunge", "smith rear lunge"],
      distinctFrom: "A step back and return, not a stationary split squat (424), and guided: kept apart from the free Reverse Lunge (175).",
      movementPatterns: ["Lunge"], jointActions: ["Hip flexion / extension", "Knee extension", "Ankle dorsiflexion / plantarflexion"], forceDirection: "Vertical along the Smith rails", chain: "Closed", stance: "Unilateral",
      resistance: notEstablished("Guided bar path; no source measured this variation"),
      fingerprint: fp({ machine: true, unilateral: true, strengthPattern: true, deepRange: true, rackCost: true }), task: task({ axialTask: true }),
      targeting: tgt({ forceVector: "guided", unilateral: true, broadMoment: true, momentArm: "compound" }),
      studyKey: "machine-modality",
      anatomy: { quads: "Vastus lateralis and medialis, rectus femoris", glutes: "Gluteus maximus", adductors: "Adductor magnus", hamstrings: "Hamstrings" }, stabilizers: [],
    },
  },
  {
    exercise: { id: 427, name: "Unilateral Machine Lateral Raise", sourceGroup: MACHINE_GROUP, category: "Shoulders", equipment: "Machine", movement: "Shoulder abduction", primaryMuscles: ["sideDelts"], secondaryMuscles: ["traps"], qualities: ["strength", "hypertrophy", "unilateral"], muscleGrade: "A", sportFit: fit(SHOULDER) },
    descriptor: {
      id: 427, candidate: "E27", requestedName: "Machine Lateral Raise — Unilateral",
      setup: "A lateral-raise machine used one arm at a time: pad on the outside of the upper arm, raise to about shoulder height and lower. Finish one arm, then the other.",
      entryNote: "Weight is the number on the stack, moved by one arm. Not comparable with the two-arm Machine Lateral Raise (113).",
      aliases: ["machine lateral raise unilateral", "single arm machine lateral raise", "one arm machine lateral raise", "unilateral lateral raise machine"],
      distinctFrom: "One arm against the whole stack: its history is kept apart from the two-arm Machine Lateral Raise (113).",
      movementPatterns: ["Shoulder abduction"], jointActions: ["Shoulder abduction", "Scapular upward rotation"], forceDirection: "Pad pushed outward and up", chain: "Open", stance: "Unilateral",
      resistance: notEstablished(MACHINE_CURVE),
      fingerprint: fp({ machine: true, isolation: true, unilateral: true }), task: task(),
      targeting: tgt({ forceVector: "guided", unilateral: true, momentArm: "focused" }),
      studyKey: "machine-modality",
      anatomy: { sideDelts: "Middle deltoid", traps: "Upper trapezius" }, stabilizers: [],
    },
  },
  {
    exercise: { id: 428, name: "Seated Back Extension Machine", sourceGroup: MACHINE_GROUP, category: "Posterior chain", equipment: "Machine", movement: "Trunk extension", primaryMuscles: ["lowerBack"], secondaryMuscles: ["glutes", "hamstrings"], qualities: ["strength", "endurance", "posture"], muscleGrade: "A", sportFit: fit(TRUNK_EXT) },
    descriptor: {
      id: 428, candidate: "E28", requestedName: "Seated Back Extension Machine",
      setup: "Seated in a selectorized back-extension machine with the pad across the upper back and the thighs and hips held by the restraints. Extend the trunk back against the pad, then return.",
      entryNote: "Weight is the number on the stack. How much the hips move depends on the restraints, so keep the setup the same.",
      aliases: ["back extension machine", "seated back extension", "lumbar extension machine", "machine back extension"],
      distinctFrom: "Seated trunk extension with the pelvis held: not the 45-Degree Back Extension (200), which is mostly hip extension, and not a neck extension.",
      movementPatterns: ["Trunk extension"], jointActions: ["Lumbar extension", "Hip extension (limited by the restraints)"], forceDirection: "Trunk pushed back against the pad", chain: "Open", stance: "Bilateral",
      resistance: notEstablished(MACHINE_CURVE),
      fingerprint: fp({ machine: true, isolation: true }), task: task(),
      targeting: tgt({ forceVector: "guided", momentArm: "focused" }),
      studyKey: "machine-modality",
      anatomy: { lowerBack: "Lumbar erector spinae, multifidus", glutes: "Gluteus maximus", hamstrings: "Hamstrings" }, stabilizers: [],
    },
  },
  {
    exercise: { id: 429, name: "Rotary Torso Machine", sourceGroup: MACHINE_GROUP, category: "Core", equipment: "Machine", movement: "Rotation", primaryMuscles: ["obliques"], secondaryMuscles: ["abs"], qualities: ["rotation", "strength", "unilateral"], muscleGrade: "A", sportFit: fit(ROTATION) },
    descriptor: {
      id: 429, candidate: "E29", requestedName: "Rotary Torso Machine",
      setup: "Seated in a rotary torso machine with the hips and legs fixed and the chest against the pads. Rotate the trunk against the stack to one side and return; set the machine for the other side.",
      entryNote: "Weight is the number on the stack. Record the side you rotate toward.",
      aliases: ["rotary torso", "torso rotation machine", "seated torso rotation", "machine twist", "rotary machine"],
      distinctFrom: "Seated rotation against a stack: not a cable chop, a side bend (448) or the half-kneeling lift (450).",
      movementPatterns: ["Rotation"], jointActions: ["Trunk rotation"], forceDirection: "Transverse: trunk turned against the stack", chain: "Open", stance: "Unilateral",
      resistance: notEstablished(MACHINE_CURVE),
      fingerprint: fp({ machine: true, isolation: true, unilateral: true }), task: task(),
      targeting: tgt({ forceVector: "guided", unilateral: true, momentArm: "focused" }),
      studyKey: "machine-modality",
      anatomy: { obliques: "External oblique (opposite side), internal oblique (same side)", abs: "Rectus abdominis" }, stabilizers: [],
    },
  },
  {
    exercise: { id: 430, name: "Hip Thrust Machine", sourceGroup: MACHINE_GROUP, category: "Hips & glutes", equipment: "Machine", movement: "Hip extension", primaryMuscles: ["glutes"], secondaryMuscles: ["hamstrings", "adductors"], qualities: ["strength", "hypertrophy"], muscleGrade: "S", sportFit: fit(GLUTE) },
    descriptor: {
      id: 430, candidate: "E30", requestedName: "Hip Thrust Machine / Glute Drive",
      setup: "A hip-thrust machine: back on the pad, the belt or roller across the hips, feet on the platform. Drive the hips up to full extension and lower.",
      entryNote: "Weight is what the machine shows or the plates on it. Not comparable with a barbell hip thrust.",
      aliases: ["glute drive", "hip thrust machine", "machine hip thrust", "glute drive machine", "hip thrust machine glute drive"],
      distinctFrom: "One canonical record for the machine (Glute Drive is a brand name kept as an alias): not the Smith (207), cable (360) or barbell (206) thrust.",
      movementPatterns: ["Hip extension"], jointActions: ["Hip extension"], forceDirection: "Horizontal-to-vertical drive into the hip belt", chain: "Closed", stance: "Bilateral",
      resistance: notEstablished(MACHINE_CURVE),
      fingerprint: fp({ machine: true }), task: task(),
      targeting: tgt({ forceVector: "guided", broadMoment: true, momentArm: "compound" }),
      studyKey: "hip-thrust-pattern",
      studyQualification: "The hip-thrust sources tested the barbell hip thrust; this machine's path and load display were not tested.",
      anatomy: { glutes: "Gluteus maximus", hamstrings: "Hamstrings", adductors: "Adductor magnus" }, stabilizers: [],
    },
  },

  // E31-E40: barbell, specialty bar and lower-body variants.
  {
    exercise: { id: 431, name: "Zercher Deadlift", sourceGroup: LOWER_GROUP, category: "Posterior chain", equipment: "Barbell", movement: "Hip hinge", primaryMuscles: ["glutes", "hamstrings"], secondaryMuscles: ["quads", "lowerBack", "upperBack", "biceps", "abs"], qualities: ["strength", "bracing", "grip"], muscleGrade: "S", sportFit: fit(HINGE) },
    descriptor: {
      id: 431, candidate: "E31", requestedName: "Zercher Deadlift",
      setup: "The bar starts on the floor (or low blocks). Squat down, hook the bar into the crooks of the elbows with the hands together, brace, and stand up with it; lower it back to the floor each rep.",
      entryNote: "Weight is the whole bar with its plates.",
      aliases: ["zercher deadlift", "zercher dl", "zercher pull from floor"],
      distinctFrom: "Starts on the floor with the bar in the elbows: not the Zercher Squat (164, from a rack) or the Zercher Carry (300), and it is not a conventional deadlift, so no deadlift norm applies.",
      movementPatterns: ["Hinge", "Anti-movement bracing"], jointActions: ["Hip flexion / extension", "Knee extension", "Spinal anti-flexion", "Elbow flexion (isometric)"], forceDirection: "Vertical / ground-reaction", chain: "Closed", stance: "Bilateral",
      resistance: notEstablished("No source measured this variation"),
      fingerprint: fp({ freeWeight: true, strengthPattern: true, axialPattern: true, rackCost: true }), task: task({ axialTask: true }),
      targeting: tgt({ broadMoment: true, momentArm: "compound" }),
      studyKey: "free-weight-modality",
      anatomy: { glutes: "Gluteus maximus", hamstrings: "Hamstrings", quads: "Quadriceps", lowerBack: "Erector spinae", upperBack: "Rhomboids, middle trapezius", biceps: "Biceps brachii, brachialis (isometric hold)", abs: "Rectus abdominis, transversus abdominis" }, stabilizers: ["lowerBack", "abs"],
    },
  },
  {
    exercise: { id: 432, name: "Trap-Bar Deadlift", sourceGroup: LOWER_GROUP, category: "Posterior chain", equipment: "Trap bar", movement: "Hip hinge", primaryMuscles: ["quads", "glutes"], secondaryMuscles: ["hamstrings", "lowerBack", "traps", "forearms"], qualities: ["strength", "grip"], muscleGrade: "S", sportFit: fit(HINGE) },
    descriptor: {
      id: 432, candidate: "E32", requestedName: "Trap-Bar Deadlift",
      setup: "Standing inside a hexagonal (trap) bar, hands on the side handles. Lift from the floor to standing. Note whether you used the high or the low handles: they are different starting heights.",
      entryNote: "Weight is the whole bar with its plates. High and low handles are not the same lift; keep to one to compare.",
      aliases: ["trap bar deadlift", "hex bar deadlift", "hex-bar deadlift", "trap bar dl", "hex bar dl", "trap bar", "hex bar"],
      distinctFrom: "The load sits beside the body: not the Conventional Deadlift (41), and straight-bar deadlift norms do not apply to it.",
      movementPatterns: ["Hinge", "Squat"], jointActions: ["Hip flexion / extension", "Knee extension", "Spinal anti-flexion", "Grip isometric"], forceDirection: "Vertical / ground-reaction", chain: "Closed", stance: "Bilateral",
      resistance: notEstablished("No source measured a curve for it"),
      fingerprint: fp({ freeWeight: true, strengthPattern: true, axialPattern: true, rackCost: true }), task: task({ gripTask: true, axialTask: true }),
      targeting: tgt({ broadMoment: true, momentArm: "compound" }),
      studyKey: "free-weight-modality",
      anatomy: { quads: "Quadriceps", glutes: "Gluteus maximus", hamstrings: "Hamstrings", lowerBack: "Erector spinae", traps: "Upper trapezius (isometric)", forearms: "Finger flexors (grip)" }, stabilizers: ["lowerBack"],
    },
  },
  {
    exercise: { id: 433, name: "Sumo Deadlift", sourceGroup: LOWER_GROUP, category: "Posterior chain", equipment: "Barbell", movement: "Hip hinge", primaryMuscles: ["glutes", "quads", "adductors"], secondaryMuscles: ["hamstrings", "lowerBack", "traps", "forearms"], qualities: ["strength", "grip"], muscleGrade: "S", sportFit: fit(HINGE) },
    descriptor: {
      id: 433, candidate: "E33", requestedName: "Sumo Deadlift",
      setup: "Feet set wide, toes out, the bar over mid-foot and the hands inside the knees. Push the floor apart and stand up with the bar; lower it to the floor each rep.",
      entryNote: "Weight is the whole bar with its plates.",
      aliases: ["sumo deadlift", "sumo dl", "wide stance deadlift", "sumo"],
      distinctFrom: "Wide stance with the hands inside the knees: its own record and history, not the Conventional Deadlift (41) with its tags copied.",
      movementPatterns: ["Hinge"], jointActions: ["Hip extension", "Hip external rotation / abduction control", "Knee extension", "Spinal anti-flexion"], forceDirection: "Vertical / ground-reaction", chain: "Closed", stance: "Bilateral",
      resistance: notEstablished("No source measured a curve for it"),
      fingerprint: fp({ freeWeight: true, strengthPattern: true, axialPattern: true, rackCost: true }), task: task({ gripTask: true, axialTask: true }),
      targeting: tgt({ broadMoment: true, momentArm: "compound" }),
      studyKey: "free-weight-modality",
      anatomy: { glutes: "Gluteus maximus", quads: "Vastus lateralis and medialis", adductors: "Adductor magnus", hamstrings: "Hamstrings", lowerBack: "Erector spinae", traps: "Upper trapezius (isometric)", forearms: "Finger flexors (grip)" }, stabilizers: ["lowerBack"],
    },
  },
  {
    exercise: { id: 434, name: "Safety-Bar Squat", sourceGroup: LOWER_GROUP, category: "Knee dominant", equipment: "Safety squat bar", movement: "Squat / knee dominant", primaryMuscles: ["quads", "glutes"], secondaryMuscles: ["adductors", "upperBack", "lowerBack", "abs"], qualities: ["strength", "hypertrophy", "bracing"], muscleGrade: "S", sportFit: fit(SQUAT) },
    descriptor: {
      id: 434, candidate: "E34", requestedName: "Safety-Bar Squat",
      setup: "A cambered safety squat bar on the upper back with its handles held in front. Squat to depth and stand up.",
      entryNote: "Weight is the whole bar with its plates. Safety bars weigh more than a standard bar and differ by maker.",
      aliases: ["safety squat bar squat", "ssb squat", "safety bar squat", "yoke bar squat"],
      distinctFrom: "Its own bar and history: back-squat norms are not presented as measured for it.",
      movementPatterns: ["Squat", "Anti-movement bracing"], jointActions: ["Hip flexion / extension", "Knee extension", "Ankle dorsiflexion / plantarflexion", "Spinal anti-flexion"], forceDirection: "Vertical / ground-reaction", chain: "Closed", stance: "Bilateral",
      resistance: notEstablished("No source measured a curve for it"),
      fingerprint: fp({ freeWeight: true, strengthPattern: true, axialPattern: true, rackCost: true }), task: task({ axialTask: true, specialistEquipment: true }),
      targeting: tgt({ broadMoment: true, momentArm: "compound" }),
      studyKey: "free-weight-modality",
      anatomy: { quads: "Quadriceps", glutes: "Gluteus maximus", adductors: "Adductor magnus", upperBack: "Rhomboids, middle trapezius", lowerBack: "Erector spinae", abs: "Rectus abdominis" }, stabilizers: ["lowerBack", "abs"],
    },
  },
  {
    exercise: { id: 435, name: "Loading-Pin Belt Squat", sourceGroup: LOWER_GROUP, category: "Knee dominant", equipment: "Loading pin", movement: "Squat / knee dominant", primaryMuscles: ["quads", "glutes"], secondaryMuscles: ["adductors"], qualities: ["strength", "hypertrophy"], muscleGrade: "S", sportFit: fit(SQUAT) },
    descriptor: {
      id: 435, candidate: "E35", requestedName: "Belt Squat — Loading Pin",
      setup: "A dip or belt-squat belt with a chain to a loading pin of plates hanging between two raised platforms. Squat between the platforms and stand up.",
      entryNote: "Weight is the plates and the pin together. It is not a machine reading.",
      aliases: ["belt squat loading pin", "dip belt squat", "loading pin belt squat", "plate belt squat"],
      distinctFrom: "Plates hanging from a belt: not the Belt Squat Machine (422) or the Cable Belt Squat (351), so no machine reading is assumed.",
      movementPatterns: ["Squat"], jointActions: ["Hip flexion / extension", "Knee extension", "Ankle dorsiflexion / plantarflexion"], forceDirection: "Vertical: load hangs from the hip belt", chain: "Closed", stance: "Bilateral",
      resistance: notEstablished("No source measured a curve for it"),
      fingerprint: fp({ freeWeight: true, strengthPattern: true }), task: task({ specialistEquipment: true }),
      targeting: tgt({ broadMoment: true, momentArm: "compound" }),
      studyKey: null,
      anatomy: { quads: "Quadriceps", glutes: "Gluteus maximus", adductors: "Adductor magnus" }, stabilizers: [],
    },
  },
  {
    exercise: { id: 436, name: "Reverse Nordic Curl", sourceGroup: LOWER_GROUP, category: "Knee dominant", equipment: "Bodyweight", movement: "Knee extension", primaryMuscles: ["quads"], secondaryMuscles: ["abs"], qualities: ["eccentric", "strength", "deceleration"], muscleGrade: "A", sportFit: fit(KNEE_ECC) },
    descriptor: {
      id: 436, candidate: "E36", requestedName: "Reverse Nordic Curl",
      setup: "Kneeling upright with the hips straight. Lean the whole body back as one piece by letting the knees bend, as far as you can control, then return by straightening the knees.",
      entryNote: "Reps with your body weight. Anything held is added load.",
      aliases: ["reverse nordic", "reverse nordics", "kneeling quad lean", "sissy lean"],
      distinctFrom: "Lengthened eccentric work for the quadriceps: it does not take the Nordic hamstring study or its hamstring evidence, despite the name.",
      movementPatterns: ["Knee extension"], jointActions: ["Knee extension (eccentric control)", "Hip extension held"], forceDirection: "Gravity: the body leans back about the knees", chain: "Closed", stance: "Bilateral",
      resistance: { bias: "Lengthened", stickingRegion: "Deepest lean, where the knees are most bent", peakRegion: "The lever arm of the body about the knee grows as you lean back", curve: [] },
      fingerprint: fp({ freeWeight: true, isolation: true, deepRange: true }), task: task(),
      targeting: tgt({ eccentric: true, lengthened: true, momentArm: "focused", forceLength: "lengthened" }),
      studyKey: null,
      anatomy: { quads: "Rectus femoris, vasti", abs: "Rectus abdominis (holding the hips straight)" }, stabilizers: ["abs"],
    },
  },
  {
    exercise: { id: 437, name: "Dumbbell Lateral Lunge", sourceGroup: LOWER_GROUP, category: "Knee dominant", equipment: "Dumbbells", movement: "Lateral lunge", primaryMuscles: ["quads", "glutes", "adductors"], secondaryMuscles: ["abductors", "hamstrings"], qualities: ["strength", "unilateral", "lateralControl"], muscleGrade: "S", sportFit: fit(LATERAL) },
    descriptor: {
      id: 437, candidate: "E37", requestedName: "Dumbbell Lateral Lunge",
      setup: "A dumbbell in each hand. Step wide to one side, sit back onto that leg with the other straight, then push back to the start. Finish one side or alternate; count reps per side.",
      entryNote: "Weight is one dumbbell. Reps are per side; a set is counted once.",
      aliases: ["dumbbell side lunge", "db lateral lunge", "lateral lunge", "side lunge"],
      distinctFrom: "Free dumbbells: kept apart from the Landmine (262) and Cable (372) lateral lunges.",
      movementPatterns: ["Lunge"], jointActions: ["Hip flexion / extension", "Hip abduction / adduction", "Knee extension"], forceDirection: "Lateral push-off and return", chain: "Closed", stance: "Unilateral",
      resistance: notEstablished("No source measured a curve for it"),
      fingerprint: fp({ freeWeight: true, unilateral: true, deepRange: true }), task: task({ gripTask: true }),
      targeting: tgt({ unilateral: true, broadMoment: true, momentArm: "compound" }),
      studyKey: "free-weight-modality",
      anatomy: { quads: "Quadriceps", glutes: "Gluteus maximus", adductors: "Adductor magnus and longus", abductors: "Gluteus medius", hamstrings: "Hamstrings" }, stabilizers: ["abductors"],
    },
  },
  {
    exercise: { id: 438, name: "Single-Leg Seated Leg Curl", sourceGroup: LOWER_GROUP, category: "Posterior chain", equipment: "Machine", movement: "Knee flexion", primaryMuscles: ["hamstrings"], secondaryMuscles: ["calves"], qualities: ["strength", "hypertrophy", "unilateral"], muscleGrade: "A", sportFit: fit(CURL) },
    descriptor: {
      id: 438, candidate: "E38", requestedName: "Single-Leg Seated Leg Curl",
      setup: "Seated leg-curl machine, thigh pad down, one leg at a time. Curl the heel under the seat and return to near straight.",
      entryNote: "Weight is the number on the stack, moved by one leg. Not comparable with the two-leg Seated Leg Curl (195).",
      aliases: ["single leg seated leg curl", "one leg seated leg curl", "unilateral seated leg curl", "seated leg curl single leg"],
      distinctFrom: "One leg at a time: its history is kept apart from the two-leg Seated Leg Curl (195).",
      movementPatterns: ["Knee flexion"], jointActions: ["Knee flexion"], forceDirection: "Pad pulled down and back", chain: "Open", stance: "Unilateral",
      resistance: notEstablished(MACHINE_CURVE),
      fingerprint: fp({ machine: true, isolation: true, unilateral: true }), task: task(),
      targeting: tgt({ forceVector: "guided", unilateral: true, momentArm: "focused" }),
      studyKey: "seated-leg-curl",
      studyQualification: "The seated-versus-prone trial is the attached source; how far its finding applies to one-leg sets depends on the protocol details recorded in the evidence ledger.",
      anatomy: { hamstrings: "Semitendinosus, semimembranosus, biceps femoris long and short heads", calves: "Gastrocnemius" }, stabilizers: [],
    },
  },
  {
    exercise: { id: 439, name: "Single-Leg Lying Leg Curl", sourceGroup: LOWER_GROUP, category: "Posterior chain", equipment: "Machine", movement: "Knee flexion", primaryMuscles: ["hamstrings"], secondaryMuscles: ["calves"], qualities: ["strength", "hypertrophy", "unilateral"], muscleGrade: "A", sportFit: fit(CURL) },
    descriptor: {
      id: 439, candidate: "E39", requestedName: "Single-Leg Lying Leg Curl",
      setup: "Lying face down on a leg-curl machine, one leg at a time. Curl the heel toward the glutes and lower to near straight.",
      entryNote: "Weight is the number on the stack, moved by one leg. Not comparable with the two-leg Lying Leg Curl (194).",
      aliases: ["single leg lying leg curl", "one leg lying leg curl", "single leg prone leg curl", "unilateral lying leg curl"],
      distinctFrom: "Lying (hips extended) and one leg: kept apart from the seated curls and from the Standing Single-Leg Curl (196).",
      movementPatterns: ["Knee flexion"], jointActions: ["Knee flexion"], forceDirection: "Pad pulled toward the glutes", chain: "Open", stance: "Unilateral",
      resistance: notEstablished(MACHINE_CURVE),
      fingerprint: fp({ machine: true, isolation: true, unilateral: true }), task: task(),
      targeting: tgt({ forceVector: "guided", unilateral: true, momentArm: "focused" }),
      studyKey: "machine-modality",
      anatomy: { hamstrings: "Semitendinosus, semimembranosus, biceps femoris long and short heads", calves: "Gastrocnemius" }, stabilizers: [],
    },
  },
  {
    exercise: { id: 440, name: "Seated Dumbbell Hip Flexion", sourceGroup: LOWER_GROUP, category: "Hips & glutes", equipment: "Dumbbells", movement: "Hip flexion", primaryMuscles: ["hipFlexors"], secondaryMuscles: ["quads", "abs"], qualities: ["strength", "unilateral", "sprintSupport"], muscleGrade: "A", sportFit: fit(HIP_FLEX) },
    descriptor: {
      id: 440, candidate: "E40", requestedName: "Seated Dumbbell Hip Flexion",
      setup: "Sitting tall on the edge of a bench, a dumbbell placed across the lower thigh just above the knee and steadied with the hand. Lift the knee as high as you can without leaning back, then lower.",
      entryNote: "Weight is the one dumbbell on the thigh. Reps are per leg; a set is counted once.",
      aliases: ["seated hip flexion", "dumbbell hip flexion", "seated knee raise", "seated psoas raise"],
      distinctFrom: "Hip flexion past 90 degrees with the load on the thigh: not a seated leg exercise for the quadriceps, and not the cable knee drive (375).",
      movementPatterns: ["Hip flexion"], jointActions: ["Hip flexion"], forceDirection: "Gravity: dumbbell on the thigh", chain: "Open", stance: "Unilateral",
      resistance: notEstablished("No source measured a curve for it"),
      fingerprint: fp({ freeWeight: true, isolation: true, unilateral: true }), task: task(),
      targeting: tgt({ unilateral: true, momentArm: "focused" }),
      studyKey: "free-weight-modality",
      anatomy: { hipFlexors: "Iliopsoas", quads: "Rectus femoris", abs: "Rectus abdominis (holding the trunk upright)" }, stabilizers: ["abs"],
    },
  },

  // E41-E50: carries, sandbag, sled and trunk.
  {
    exercise: { id: 441, name: "Suitcase Carry", sourceGroup: CARRY_GROUP, category: "Conditioning", equipment: "Dumbbells", movement: "Loaded carry", primaryMuscles: ["obliques", "forearms"], secondaryMuscles: ["lowerBack", "abductors", "traps", "abs"], qualities: ["antiRotation", "bracing", "grip", "locomotion", "lateralControl"], muscleGrade: "S", sportFit: fit(CARRY) },
    descriptor: {
      id: 441, candidate: "E41", requestedName: "Suitcase Carry",
      setup: "One dumbbell in one hand at the side, walk tall without leaning toward or away from it. Switch hands and walk the same distance.",
      entryNote: "Weight is the one dumbbell. Record the distance (or time) and the hand.",
      aliases: ["suitcase carry", "single arm farmer carry", "one arm farmer walk", "suitcase walk", "offset carry"],
      distinctFrom: "One hand loaded: the trunk resists side-bending. Not the Farmer's Walk (299), and not the dynamic Dumbbell Side Bend (449).",
      movementPatterns: ["Carry", "Anti-movement bracing", "Locomotion"], jointActions: ["Trunk anti-lateral-flexion", "Hip stabilization", "Grip isometric"], forceDirection: "Gravity on one side; the trunk resists bending", chain: "Closed", stance: "Mixed",
      resistance: held("the load is held while walking"),
      fingerprint: fp({ freeWeight: true, unilateral: true }), task: task({ gripTask: true, axialTask: true, needsSpace: true }),
      targeting: tgt({ unilateral: true }),
      studyKey: null,
      anatomy: { obliques: "Opposite-side internal and external obliques", forearms: "Finger flexors (grip)", lowerBack: "Quadratus lumborum, erector spinae", abductors: "Gluteus medius", traps: "Upper trapezius", abs: "Rectus abdominis" }, stabilizers: ["lowerBack", "abductors", "abs"],
    },
  },
  {
    exercise: { id: 442, name: "Front-Rack Kettlebell Carry", sourceGroup: CARRY_GROUP, category: "Conditioning", equipment: "Kettlebell", movement: "Loaded carry", primaryMuscles: ["abs", "upperBack"], secondaryMuscles: ["forearms", "biceps", "obliques", "glutes"], qualities: ["bracing", "locomotion", "conditioning"], muscleGrade: "S", sportFit: fit(CARRY) },
    descriptor: {
      id: 442, candidate: "E42", requestedName: "Front-Rack Kettlebell Carry",
      setup: "Two kettlebells held in the front rack (bells resting on the forearms, hands at the chest), walk tall. This record is the two-bell carry; a single-bell front-rack carry is a different, offset exercise.",
      entryNote: "Weight is one kettlebell (each hand). Record the distance or time.",
      aliases: ["double kettlebell front rack carry", "front rack carry", "kettlebell rack walk", "double kb rack carry"],
      distinctFrom: "Load in front of the trunk, not at the sides: not the Farmer's Walk (299) or the Zercher Carry (300).",
      movementPatterns: ["Carry", "Anti-movement bracing", "Locomotion"], jointActions: ["Trunk anti-extension", "Elbow flexion (isometric)", "Hip stabilization"], forceDirection: "Gravity in front of the trunk", chain: "Closed", stance: "Mixed",
      resistance: held("the bells are held in the rack while walking"),
      fingerprint: fp({ freeWeight: true }), task: task({ gripTask: true, axialTask: true, needsSpace: true }),
      targeting: tgt(),
      studyKey: "free-weight-modality",
      anatomy: { abs: "Rectus abdominis, transversus abdominis", upperBack: "Rhomboids, middle trapezius", forearms: "Wrist and finger flexors", biceps: "Biceps brachii, brachialis (isometric)", obliques: "Obliques", glutes: "Gluteus maximus" }, stabilizers: ["obliques"],
    },
  },
  {
    exercise: { id: 443, name: "Single-Arm Kettlebell Overhead Carry", sourceGroup: CARRY_GROUP, category: "Conditioning", equipment: "Kettlebell", movement: "Loaded carry", primaryMuscles: ["shoulders", "traps", "obliques"], secondaryMuscles: ["rotatorCuff", "serratusAnterior", "triceps", "abs"], qualities: ["overhead", "bracing", "antiRotation", "locomotion"], muscleGrade: "S", sportFit: fit(OVERHEAD) },
    descriptor: {
      id: 443, candidate: "E43", requestedName: "Single-Arm Overhead Carry",
      setup: "One kettlebell locked out overhead, arm straight and biceps by the ear, walk tall. Switch arms and walk the same distance.",
      entryNote: "Weight is the one kettlebell. Record the distance (or time) and the arm. There is no press repetition to estimate from it.",
      aliases: ["single arm overhead carry", "overhead carry", "waiter carry", "waiters walk", "overhead kettlebell carry", "one arm overhead carry"],
      distinctFrom: "Held overhead and walked: not an overhead press, and no press estimate is made from it.",
      movementPatterns: ["Carry", "Anti-movement bracing", "Locomotion"], jointActions: ["Shoulder flexion (held overhead)", "Scapular upward rotation", "Trunk anti-lateral-flexion"], forceDirection: "Gravity overhead on one side", chain: "Closed", stance: "Mixed",
      resistance: held("the bell is held overhead while walking"),
      fingerprint: fp({ freeWeight: true, unilateral: true, deepRange: true }), task: task({ axialTask: true, needsSpace: true }),
      targeting: tgt({ unilateral: true }),
      studyKey: "free-weight-modality",
      anatomy: { shoulders: "Deltoid", traps: "Upper and lower trapezius", obliques: "Obliques", rotatorCuff: "Rotator cuff", serratusAnterior: "Serratus anterior", triceps: "Triceps brachii", abs: "Rectus abdominis" }, stabilizers: ["rotatorCuff", "abs"],
    },
  },
  {
    exercise: { id: 444, name: "Sandbag Bear-Hug Carry", sourceGroup: CARRY_GROUP, category: "Conditioning", equipment: "Sandbag", movement: "Loaded carry", primaryMuscles: ["upperBack", "abs"], secondaryMuscles: ["biceps", "lowerBack", "quads", "glutes"], qualities: ["bracing", "locomotion", "conditioning", "grip"], muscleGrade: "S", sportFit: fit(CARRY) },
    descriptor: {
      id: 444, candidate: "E44", requestedName: "Sandbag Bear-Hug Carry",
      setup: "A sandbag hugged to the chest with the arms wrapped around it, walk upright.",
      entryNote: "Weight is the sandbag. Record the distance or time.",
      aliases: ["bear hug carry", "bear-hug carry", "sandbag carry", "sandbag hug carry", "bear hug sandbag walk"],
      distinctFrom: "A hug carry, not a bear crawl: it never takes the Crawling pattern because of the word 'bear'.",
      movementPatterns: ["Carry", "Anti-movement bracing", "Locomotion"], jointActions: ["Trunk anti-flexion", "Shoulder adduction (isometric)", "Elbow flexion (isometric)", "Hip stabilization"], forceDirection: "Gravity in front of the trunk", chain: "Closed", stance: "Mixed",
      resistance: held("the bag is held while walking"),
      fingerprint: fp({ freeWeight: true }), task: task({ gripTask: true, axialTask: true, needsSpace: true, specialistEquipment: true }),
      targeting: tgt(),
      studyKey: null,
      anatomy: { upperBack: "Rhomboids, middle trapezius", abs: "Rectus abdominis, transversus abdominis", biceps: "Biceps brachii (isometric)", lowerBack: "Erector spinae", quads: "Quadriceps", glutes: "Gluteus maximus" }, stabilizers: ["lowerBack"],
    },
  },
  {
    exercise: { id: 445, name: "Sandbag Ground-to-Shoulder", sourceGroup: CARRY_GROUP, category: "Power & athletic", equipment: "Sandbag", movement: "Explosive hinge", primaryMuscles: ["glutes", "hamstrings", "quads"], secondaryMuscles: ["upperBack", "biceps", "lowerBack", "traps", "abs"], qualities: ["power", "strength", "conditioning", "bracing"], muscleGrade: "S", sportFit: fit(SANDBAG) },
    descriptor: {
      id: 445, candidate: "E45", requestedName: "Sandbag Ground-to-Shoulder",
      setup: "Sandbag on the floor between the feet. Hinge, grab it, lap it if needed, then drive the hips through to pop it onto one shoulder; stand tall, return it to the floor, and alternate shoulders. A rep counts when you stand tall with it on the shoulder.",
      entryNote: "Weight is the sandbag. Reps count both shoulders together (alternate each rep).",
      aliases: ["sandbag to shoulder", "sandbag shouldering", "ground to shoulder", "sandbag shoulder", "bag to shoulder"],
      distinctFrom: "A ballistic lift to one shoulder: not a carry and not a clean, and no one-rep max is estimated from it.",
      movementPatterns: ["Hinge", "Power expression", "Anti-movement bracing"], jointActions: ["Hip extension", "Knee extension", "Trunk extension", "Elbow flexion"], forceDirection: "Vertical / ground-reaction", chain: "Closed", stance: "Bilateral",
      resistance: notEstablished("No source measured a curve for it"),
      fingerprint: fp({ freeWeight: true, ballistic: true, strengthPattern: true, axialPattern: true }), task: task({ gripTask: true, axialTask: true, specialistEquipment: true }),
      targeting: tgt({ ballistic: true, broadMoment: true, momentArm: "compound" }),
      studyKey: null,
      anatomy: { glutes: "Gluteus maximus", hamstrings: "Hamstrings", quads: "Quadriceps", upperBack: "Rhomboids, middle trapezius", biceps: "Biceps brachii", lowerBack: "Erector spinae", traps: "Upper trapezius", abs: "Rectus abdominis" }, stabilizers: ["lowerBack", "abs"],
    },
  },
  {
    exercise: { id: 446, name: "Backward Overhead Sled Drag", sourceGroup: CARRY_GROUP, category: "Conditioning", equipment: "Sled", movement: "Resisted locomotion / drag", primaryMuscles: ["quads", "shoulders"], secondaryMuscles: ["calves", "upperBack", "abs"], qualities: ["conditioning", "locomotion", "overhead", "bracing"], muscleGrade: "S", sportFit: fit(SLED) },
    descriptor: {
      id: 446, candidate: "E46", requestedName: "Backward Overhead Sled Drag",
      setup: "Face the sled holding the strap handles directly overhead with the elbows straight, and walk backward keeping the arms up the whole way (the Free Exercise DB's 'Sled Overhead Backward Walk').",
      entryNote: "Weight is the sled and its plates; the surface changes how hard it is. Record the distance.",
      aliases: ["sled overhead backward walk", "overhead sled drag", "backward overhead sled walk", "overhead backward sled drag"],
      distinctFrom: "Arms held overhead the whole way: not the Backward Sled Drag (297) with the hands low, so a regular drag is never substituted for it.",
      movementPatterns: ["Locomotion", "Anti-movement bracing"], jointActions: ["Knee extension", "Hip extension", "Shoulder flexion (held overhead)", "Trunk anti-extension"], forceDirection: "Backward walk against a forward-pulling strap", chain: "Closed", stance: "Mixed",
      resistance: held("the arms are held overhead while walking"),
      fingerprint: fp({ rackCost: true, deepRange: true }), task: task({ gripTask: true, needsSpace: true, specialistEquipment: true }),
      targeting: tgt(),
      studyKey: null,
      anatomy: { quads: "Quadriceps", shoulders: "Deltoid (holding the arms overhead)", calves: "Gastrocnemius, soleus", upperBack: "Middle trapezius, rhomboids", abs: "Rectus abdominis" }, stabilizers: ["abs"],
    },
  },
  {
    exercise: { id: 447, name: "Sled Rope Pull", sourceGroup: CARRY_GROUP, category: "Conditioning", equipment: "Sled", movement: "Horizontal pull", primaryMuscles: ["lats", "upperBack", "forearms"], secondaryMuscles: ["biceps", "rearDelts", "abs"], qualities: ["grip", "conditioning", "strength"], muscleGrade: "S", sportFit: fit(SLED) },
    descriptor: {
      id: 447, candidate: "E47", requestedName: "Sled Rope Pull",
      setup: "Standing still in an athletic stance with a rope tied to the sled, pull the sled toward you hand over hand until it arrives.",
      entryNote: "Weight is the sled and its plates; the surface changes the real resistance. Record the rope length pulled.",
      aliases: ["sled rope pull", "rope sled pull", "hand over hand sled pull", "sled pull rope"],
      distinctFrom: "A stationary hand-over-hand pull, not walking: kept apart from the sled drags (297, 446) and the march (398).",
      movementPatterns: ["Horizontal pull"], jointActions: ["Shoulder extension", "Elbow flexion", "Grip isometric", "Trunk anti-flexion"], forceDirection: "Horizontal pull along the rope", chain: "Closed", stance: "Bilateral",
      resistance: notEstablished("Plate load is not the horizontal resistance: surface friction sets it"),
      fingerprint: fp({ rackCost: true }), task: task({ gripTask: true, needsSpace: true, specialistEquipment: true }),
      targeting: tgt({ broadMoment: true, momentArm: "compound" }),
      studyKey: null,
      anatomy: { lats: "Latissimus dorsi", upperBack: "Rhomboids, middle trapezius", forearms: "Finger flexors (grip)", biceps: "Biceps brachii", rearDelts: "Posterior deltoid", abs: "Rectus abdominis" }, stabilizers: ["abs"],
    },
  },
  {
    exercise: { id: 448, name: "Cable Side Bend", sourceGroup: CARRY_GROUP, category: "Core", equipment: "Cable", movement: "Lateral flexion", primaryMuscles: ["obliques"], secondaryMuscles: ["lowerBack", "abs"], qualities: ["strength", "lateralControl", "unilateral"], muscleGrade: "A", sportFit: fit(SIDE_BEND) },
    descriptor: {
      id: 448, candidate: "E48", requestedName: "Cable Side Bend",
      setup: "Standing side-on to a low pulley, handle in the near hand. Let the cable pull you into a side bend toward it, then bend away from the stack to upright and slightly past.",
      entryNote: "Weight is the number on the stack. Record the side that does the work (away from the stack).",
      aliases: ["cable side bend", "cable lateral flexion", "low pulley side bend", "standing cable side bend"],
      distinctFrom: "Bending sideways against the cable: not rotation (429) or anti-rotation (450), and not a high-pulley side crunch.",
      movementPatterns: ["Lateral flexion"], jointActions: ["Trunk lateral flexion"], forceDirection: "Cable line from the low pulley", chain: "Open", stance: "Unilateral",
      resistance: notEstablished("Set by the cable angle to the trunk"),
      fingerprint: fp({ isolation: true, unilateral: true }), task: task(),
      targeting: tgt({ forceVector: "cable", unilateral: true, momentArm: "focused" }),
      studyKey: null,
      anatomy: { obliques: "Internal and external obliques (working side)", lowerBack: "Quadratus lumborum", abs: "Rectus abdominis" }, stabilizers: [],
    },
  },
  {
    exercise: { id: 449, name: "Dumbbell Side Bend", sourceGroup: CARRY_GROUP, category: "Core", equipment: "Dumbbells", movement: "Lateral flexion", primaryMuscles: ["obliques"], secondaryMuscles: ["lowerBack", "abs"], qualities: ["strength", "lateralControl", "unilateral"], muscleGrade: "A", sportFit: fit(SIDE_BEND) },
    descriptor: {
      id: 449, candidate: "E49", requestedName: "Dumbbell Side Bend",
      setup: "Standing with one dumbbell in one hand at the side. Bend toward the dumbbell, then bend back to upright and slightly past; finish the reps, then switch hands.",
      entryNote: "Weight is the one dumbbell. Reps on one side make the set; record the side.",
      aliases: ["dumbbell side bend", "db side bend", "side bend", "standing side bend"],
      distinctFrom: "Dynamic side bends for reps: not the Suitcase Carry (441), which is a timed or distance hold.",
      movementPatterns: ["Lateral flexion"], jointActions: ["Trunk lateral flexion"], forceDirection: "Gravity on one side", chain: "Open", stance: "Unilateral",
      resistance: notEstablished("No source measured a curve for it"),
      fingerprint: fp({ freeWeight: true, isolation: true, unilateral: true }), task: task(),
      targeting: tgt({ unilateral: true, momentArm: "focused" }),
      studyKey: "free-weight-modality",
      anatomy: { obliques: "Internal and external obliques (opposite the dumbbell)", lowerBack: "Quadratus lumborum", abs: "Rectus abdominis" }, stabilizers: [],
    },
  },
  {
    exercise: { id: 450, name: "Half-Kneeling Cable Lift", sourceGroup: CARRY_GROUP, category: "Core", equipment: "Cable", movement: "Anti-rotation", primaryMuscles: ["obliques", "abs"], secondaryMuscles: ["frontDelts", "triceps", "glutes"], qualities: ["antiRotation", "bracing", "balance", "unilateral"], muscleGrade: "A", sportFit: fit(LIFT) },
    descriptor: {
      id: 450, candidate: "E50", requestedName: "Half-Kneeling Cable Lift",
      setup: "Half-kneeling side-on to a low pulley with a rope or bar, the inside knee down. Pull the handle across the body and press it up and away (low to high), keeping the trunk from turning, then return.",
      entryNote: "Weight is the number on the stack. Record the side (the side the cable comes from).",
      aliases: ["half kneeling lift", "cable lift", "kneeling cable lift", "low to high lift", "half kneeling cable lift"],
      distinctFrom: "Low to high with the trunk held still: not the high-to-low wood chop (250), the standing reverse chop (377), or the Pallof press.",
      movementPatterns: ["Anti-movement bracing"], jointActions: ["Trunk anti-rotation", "Shoulder flexion", "Elbow extension"], forceDirection: "Diagonal: low to high across the body", chain: "Mixed", stance: "Unilateral",
      resistance: notEstablished("Set by the cable angle"),
      fingerprint: fp({ unilateral: true }), task: task(),
      targeting: tgt({ forceVector: "cable", unilateral: true }),
      studyKey: null,
      anatomy: { obliques: "Internal and external obliques", abs: "Rectus abdominis, transversus abdominis", frontDelts: "Anterior deltoid", triceps: "Triceps brachii", glutes: "Gluteus maximus (kneeling side)" }, stabilizers: ["glutes"],
    },
  },
];

/** The catalog records, ids 401-450. */
export const addedExercises: Exercise[] = additions.map(({ exercise }) => exercise);

/** Their descriptors, read through exerciseDescriptors.ts. */
export const additionDescriptors: ExerciseDescriptor[] = additions.map(({ descriptor }) => descriptor);

/** Search aliases keyed by canonical name, merged into the search index. */
export const additionAliases: Record<string, string[]> = Object.fromEntries(additions.map(({ exercise, descriptor }) => [exercise.name, descriptor.aliases]));
