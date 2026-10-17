# Forearm exercise variants and mappings (16 Oct 2026)

Which catalog exercises the forearm atlas maps, how each is done, and which forearm muscles it works and in what way. The brief is `brief-2026-10-16.md` (§4 exercise coverage, §5 counting, §11 release gates); the binding design is `02-design.md`. The data:

- `shared/specialization/regions/forearm/variants.ts`: one default variant per mapped catalog exercise, plus the two lists of exercises deliberately left unmapped.
- `shared/specialization/regions/forearm/mappings.ts`: the mappings and the published mapping version `forearm_mappings_v1`.
- `shared/specialization/regions/forearm/mappingSources.ts`: sources M1-M8 added for the mappings.
- `client/src/lib/exerciseCatalogForearm.ts`: the 16 new catalog rows (ids 401-416).
- `client/src/lib/specialization/forearmMappings.test.ts`: the rules below, as tests.

## Method

**Variants.** The catalog has no variant model, so each mapped exercise gets one default variant, `cat-<id>`, with its execution written out. The exercise's definition decides each dimension, then its photograph where the catalog shows one (`client/src/data/exercisePhotos.json`): "Dumbbell Curl" is photographed with two dumbbells curled together, so it is bilateral; "Dumbbell Row" is photographed one-arm, so it is unilateral. Where neither says, the dimension is `unknown` rather than a guess.

| Dimension | How it is set |
|---|---|
| organization | `single_joint` for curls, wrist, finger, thumb and lever work; `multi_joint` for rows, pulldowns, pull-ups, hinges, shrugs, hanging core work and battle ropes; `task` for hangs, holds, pinches and carries. |
| forearmOrientation | From the grip the exercise names or shows: palms up `supinated`, palms in `neutral`, palms down `pronated`; `changing` for the Zottman curl and the lever rotations; `unknown` where the handle is not defined (machine rows, deadlifts, whose grip varies). |
| wristPosition | `neutral` where the technique holds the wrist straight (curls, holds); `changing` where the wrist is the joint that moves; `unknown` on pulls and hinges, which do not define it. |
| gripType | The controlled vocabulary in `types.ts`. Deadlifts are `unknown` (double overhand, mixed and hook all occur); the Zottman curl is `unknown` because the grip changes within each rep and the vocabulary has no single word for that. |
| straps | `not_applicable` where a strap cannot help (curls, wrist and lever work, bands, pinches, grippers, the Zercher carry); `unknown` on pulls, hinges, shrugs, hangs and carries, where straps are used and the catalog cannot know. A logged set can still say yes or no. The Chin-Up Curl is `unknown`: the hands hold body weight. |
| laterality | `bilateral` only when both arms work in every set by definition: a bar, two implements, both hands on one handle, or arms alternating within the set (which still works each arm once per set). `unilateral` for one-arm exercises. `either` only where the catalog leaves it open: machine rows with independent handles, Machine Preacher Curl, Incline Cable Curl, Cable Wrist Extension, Single-Leg and Landmine Single-Leg Romanian Deadlifts, Chest-Supported Landmine Row. |
| measure, deliberateHold | `seconds` and a deliberate hold together on hangs, holds, pinches, carries and the gripper hold. Battle Rope Alternating Waves are timed (`seconds`) but are not a hold. Hanging leg and knee raises are counted in reps; their grip is incidental. |
| elbowAngleDeg | Only where the row defines it: 90 on Lever Pronation and Supination (forearm supported, elbow bent), 0 on the two deviation levers (arm straight at the side). Never a default. |

**Mappings.** One mapping per variant and muscle (the database's unique key), each naming a joint action, a relationship and a muscle mode separately:

- relationship: `direct` (the exercise is built on this muscle's action), `contributing` (it helps move the load), `stabilizer` (it steadies a joint that does not move), `incidental` (it holds the implement while something else is trained);
- muscle mode: `dynamic` (its joint moves through range) or `isometric` (it holds).

So a reverse curl is dynamic elbow flexion for the brachioradialis and isometric wrist-extensor stabilization in the same set (brief §11). The accounting category follows from `categoryFor` in `rules.ts`; a stabilizer or incidental mapping is always isometric, so it can never earn dynamic credit.

**Evidence and review.** `evidenceBasis` is `anatomy` where the mapping rests on what the muscle does (a wrist flexor in a wrist curl), `inference` where it rests on a judgement about role or size of part (a grip called incidental, the brachioradialis called a target of the hammer curl), and `emg` only where an EMG source is cited. A mapping is `reviewed` when the muscle's action is sourced (S4 forearm tables, S7, S8, and M8 for the biceps and brachialis) and its relationship is explained in its rationale; otherwise it is `draft`, shown as pending review and never counted. Every mapping, draft or not, cites at least one source with a locator and a limitation.

**What is not done.** No percentage split between muscles. No exercise is mapped to every forearm muscle (the widest are the wrist rollers, at seven: the undirected one with none direct, each directed one with only the group lifting the weight direct). No muscle of the hand itself (thenar muscles, interossei, lumbricals) is credited to the forearm; where they do real work (a pinch, a band spreading the fingers) the rationale says so. No mapping to a compartment group. No credit for a load the exercise does not define: the Zottman curl's turn at the top is not credited to the pronators or supinator, because a dumbbell turned about its own handle gives little resistance to the turn.

**For the calculator.** `allocation: "shared"` means the work is real but cannot be split among the other shared mappings of the same variant with the same relationship and mode (FDS with FDP; PT with PQ; FCR, ECRL and ECRB in radial deviation). Two shared groups can sit in one variant (the deviation levers have the shared deviators and the shared grip), so `sharedWith` should be read within relationship and mode, not across the whole variant. `requiresNoStraps` is true on the finger flexors of every pull, hinge, shrug, hang and carry, and only where the variant's straps are not `not_applicable` (tested).

## Catalog changes

**Fixes (Phase A defects).** Rows 139-141 were tagged "Grip isometric" although the wrist moves: they are now `Wrist flexion`, `Wrist extension` and `Wrist flexion and extension` (the catalog already used `Wrist extension` on Cable Wrist Extension, 350). Rows 139-145 listed `forearms` as both primary and secondary, which `week_review_v1` counted as 1.5 per set; the duplicate secondary is removed, so these rows now count 1.0. Hanging Knee Raise (232) was tagged primary and secondary `forearms` with the movement "Grip isometric"; it is now tagged exactly as Hanging Leg Raise (231) is (movement `Trunk flexion / anti-extension`, primary `abs`, secondary `obliques`, `hipFlexors`), with `forearms` added as a secondary for the grip. The database's own mapping for 232 is iliopsoas and rectus abdominis; the catalog keeps hip flexors secondary on both hanging raises for consistency, which is a catalog-wide choice this lane did not change.

Downstream effects checked: the full suite passed after the fixes with only the catalog-size pin changing; the movement-support broad-pattern rule (more than 15 exercises) is unaffected ("Grip isometric" drops to 5, the new movement labels hold 1-2 each, "Trunk flexion / anti-extension" was already broad); the familiar ranking lifts (`rankRecommendations.ts`) read the database's rankable snapshot, not catalog tags, so Wrist Curl and Hanging Knee Raise keep their roles; `scripts/movement-support-report.ts` re-checks its 232 note against the data, so the fixed defect drops out of the next report.

**New rows (ids 401-416).** Appended after the closed 301-400 expansion with literal ids, so no stored id moves. Each carries every engine field (source group, category, equipment from the existing vocabulary, movement, catalog muscle keys only, qualities, muscle grade, sport fit for all five sports with a plain cue). Sport-fit grades are modest; none is above A.

| Id | Name | Equipment | Movement | Load convention | Photo |
|---|---|---|---|---|---|
| 401 | Finger Curl | Barbell | Finger flexion | total load | `Finger_Curls` |
| 402 | Gripper Close | Free weights | Finger flexion | number on the implement | none |
| 403 | Gripper Hold | Free weights | Grip isometric | number on the implement | none |
| 404 | Band Finger Extension | Band | Finger extension | total load (default) | none |
| 405 | Lever Pronation | Dumbbells | Forearm pronation | total load | none (see below) |
| 406 | Lever Supination | Dumbbells | Forearm supination | total load | none (see below) |
| 407 | Lever Radial Deviation | Dumbbells | Wrist radial deviation | total load | none |
| 408 | Lever Ulnar Deviation | Dumbbells | Wrist ulnar deviation | total load | none |
| 409 | Suitcase Carry | Free weights | Loaded carry | per hand | none |
| 410 | One-Arm Dumbbell Wrist Curl | Dumbbells | Wrist flexion | per dumbbell | `Seated_One-Arm_Dumbbell_Palms-Up_Wrist_Curl` |
| 411 | One-Arm Dumbbell Reverse Wrist Curl | Dumbbells | Wrist extension | per dumbbell | `Seated_One-Arm_Dumbbell_Palms-Down_Wrist_Curl` |
| 412 | Band Thumb Flexion | Band | Thumb flexion | total load (default) | none |
| 413 | Band Thumb Extension | Band | Thumb extension | total load (default) | none |
| 414 | Band Thumb Abduction | Band | Thumb abduction | total load (default) | none |
| 415 | Wrist Roller, Extension Wind | Free weights | Wrist extension | total load | none |
| 416 | Wrist Roller, Flexion Wind | Free weights | Wrist flexion | total load | none |

The wrist roller (141) does not say which way it is wound, so it credits neither wrist group as direct. Rows 415 and 416 name the direction (brief §4: direction-specific segments): winding with palms down so the top of the roller turns toward you is a run of wrist extensions against the hanging weight; turning it away is a run of wrist flexions. The lifting group is direct dynamic, the other group contributing (it steadies and returns the hand between turns), and the grip on the handle incidental. An athlete who winds both ways in one set logs it as 141.

Grippers use the catalog's "Free weights" equipment, the nearest existing value for a small hand-held implement (Plate Pinch and Wrist Roller use it too); the equipment filter therefore offers them to anyone with dumbbells, a barbell or kettlebells. Load conventions for ids 401+ are the app's own (`APP_ONLY` in `shared/loadConventions.ts`), because the database's scoring policy has no rows for them; band rows take the default, as Band Pull-Apart and Lateral Band Walk already do.

**Photos.** The Free Exercise DB pairs at the pinned commit were downloaded and viewed. Taken, each row defined to match its photograph: `Finger_Curls` (seated, forearms on the thighs, palms up, the bar rolled to the fingertips and curled back), and the seated one-arm palms-up and palms-down dumbbell wrist curls. All three pairs are in movement order. They went through the existing pipeline: `curate.mjs` (hand-checked table), `dimensions.mjs`, `thumbnails.mjs` (the 227 existing thumbnails came out byte-identical), and a verdict each in `docs/exercise-photo-order/audit.json`.

Not taken: `Dumbbell_Lying_Pronation` and `Dumbbell_Lying_Supination`. The frames do show a forearm supported on a bench turning a dumbbell handle loaded at one end, but the source's own instructions describe an external rotation of the shoulder, and from two still frames it cannot be confirmed which way the forearm turns: on the "supination" pair the plate travels from above the hand to below it, which against gravity reads as the pronators doing the work. A photo that may show the opposite action teaches the wrong movement, so Lever Pronation and Lever Supination show the placeholder frame. The barbell "Palms-Up/Down Wrist Curl Over A Bench" pairs were already Wrist Curl's and Reverse Wrist Curl's photos.

## Families

| Family | Catalog ids | Mappings |
|---|---|---|
| Palms-up curls | 121-131, 137, 138, 336, 338-341 | biceps and brachialis direct dynamic (upper-arm contributors); BR contributing dynamic; FDS+FDP incidental isometric (138: straps can apply, so bare hands required) |
| Hammer / neutral curls | 132-134, 337, 342 | BR direct dynamic (a judgement about the exercise's purpose: EMG on forearm position is mixed, M1); brachialis direct; biceps contributing; grip incidental |
| Reverse curl | 135 | BR direct dynamic (M1: its share changes in pronation); brachialis direct; biceps contributing; ECRL, ECRB, ECU stabilizer isometric (M2); grip incidental |
| Zottman curl | 136 | BR, biceps, brachialis direct dynamic; wrist extensors stabilizer isometric on the palms-down lowering; grip incidental; the turn is not credited |
| Wrist curls | 139, 410 | FCR, FCU direct dynamic wrist flexion; PL contributing (absent in some people); grip incidental |
| Reverse wrist curls | 140, 411, 350 | ECRL, ECRB, ECU direct dynamic wrist extension (no selectivity between the radial pair is claimed); ED contributing (it assists wrist extension; this is not finger extension); grip incidental |
| Wrist roller | 141 | FCR, FCU, ECRL, ECRB, ECU contributing dynamic, shared, because the winding direction is not recorded; grip incidental |
| Wrist roller by direction | 415, 416 | Extension wind: ECRL, ECRB, ECU direct dynamic, FCR and FCU contributing. Flexion wind: FCR and FCU direct dynamic, the three extensors contributing. Grip incidental on both |
| Deviation levers | 407, 408 | radial: FCR, ECRL, ECRB direct dynamic, shared; ulnar: FCU, ECU direct dynamic, shared; grip incidental |
| Rotation levers | 405, 406 | pronation: PT, PQ direct dynamic, shared (M5: PQ leads at low torque, PT rises with torque); supination: supinator direct, biceps contributing, shared, with the elbow angle recorded (M5, M6); grip incidental |
| Finger flexion | 401, 402, 403 | FDS+FDP direct, shared: dynamic for the finger curl and gripper close, isometric for the gripper hold |
| Finger extension | 404 | ED direct dynamic; EDM and EI contributing; all shared |
| Thumb | 412, 413, 414 | FPL direct (tip flexion); EPL and EPB direct, shared (tip and knuckle extension); APL direct (abduction). Small-muscle coverage, not high-volume defaults |
| Pinch, hangs, holds, carries | 142, 143, 144, 145, 299, 409 | FDS+FDP direct isometric, shared, deliberate (bare hands required where straps exist); plate pinch adds FPL direct (M4); towel hang and carries add FPL contributing as draft; carries add the wrist extensors as stabilizers (M2) |
| Zercher carry | 300 | BR, biceps, brachialis contributing isometric (the bar sits in the elbows); no grip |
| Rows, pulldowns, pull-ups, chin-ups | 43-61, 66-77, 256-258, 327, 331, 332, 379, 383, 384 | BR contributing dynamic (the elbows bend under load); FDS+FDP incidental isometric, bare hands required (M3) |
| Towel pull-up, rope climb | 78, 80 | as pulls, with the grip contributing rather than incidental (it often limits the set) |
| Straight-arm work | 62, 79 | grip only: the elbows do not bend |
| Upright row | 317 | grip incidental; BR contributing as draft |
| Deadlifts, hinges, shrugs | 41, 42, 81-86, 186-189, 202-205, 263, 264 | FDS+FDP incidental isometric, bare hands required (M3; M7 for deadlift grip type); no BR |
| Hanging core work | 231, 232, 234 | FDS+FDP incidental isometric, bare hands required (hanging ab straps exist) |
| Battle ropes | 399, 400 | FDS+FDP incidental isometric; straps do not apply |

**Left unmapped on purpose** (they keep their region-level forearm tag; reasons in `unmappedForearmTaggedExercises`): the pullovers (24, 63, 64, 65), good mornings (190, 191), back extension and reverse hyperextension (200, 201), the medicine-ball throws (279, 280), the sleds (296-298), Cable Cuban Rotation (319), Cable High Pull (335), the triceps pressdowns and kickback (343-346, 348), and the kettlebell clean, snatch, clean and press and Turkish get-up (387-390). Every exercise tagged `forearms` as a primary muscle has a reviewed mapping, so `regionOnlyExercises` is empty; the test fails if a future primary-tagged row arrives without one or a listing.

## Per-exercise table

Abbreviations: dyn dynamic, iso isometric, contrib. contributing; "(shared)" allocation shared; "[no straps]" a strapped set earns no credit; **draft** pending review and not counted. FDS+FDP is one entry where both have the same mapping. Biceps and Brachialis are the upper-arm contributors.

| Id | Exercise | Variant | Mapped muscles |
|---|---|---|---|
| 41 | Conventional Deadlift | multi-joint · unknown · wrist unknown · grip unknown · straps unknown · bilateral · reps | FDS+FDP incidental iso (shared) [no straps] |
| 42 | Romanian Deadlift | multi-joint · unknown · wrist unknown · grip unknown · straps unknown · bilateral · reps | FDS+FDP incidental iso (shared) [no straps] |
| 43 | Barbell Bent-Over Row | multi-joint · pronated · wrist unknown · grip overhand · straps unknown · bilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 44 | Pendlay Row | multi-joint · pronated · wrist unknown · grip overhand · straps unknown · bilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 45 | Underhand Barbell Row | multi-joint · supinated · wrist unknown · grip underhand · straps unknown · bilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 46 | Dumbbell Row | multi-joint · neutral · wrist unknown · grip neutral · straps unknown · unilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 47 | Chest-Supported Dumbbell Row | multi-joint · unknown · wrist unknown · grip unknown · straps unknown · bilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 48 | Seal Row | multi-joint · unknown · wrist unknown · grip unknown · straps unknown · bilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 49 | Meadows Row | multi-joint · pronated · wrist unknown · grip overhand · straps unknown · unilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 50 | T-Bar Row | multi-joint · neutral · wrist unknown · grip neutral · straps unknown · bilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 51 | Chest-Supported T-Bar Row | multi-joint · unknown · wrist unknown · grip unknown · straps unknown · bilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 52 | Machine High Row | multi-joint · unknown · wrist unknown · grip unknown · straps unknown · either · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 53 | Machine Low Row | multi-joint · unknown · wrist unknown · grip unknown · straps unknown · either · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 54 | Seated Cable Row | multi-joint · neutral · wrist unknown · grip neutral · straps unknown · bilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 55 | Wide-Grip Cable Row | multi-joint · pronated · wrist unknown · grip overhand · straps unknown · bilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 56 | Single-Arm Cable Row | multi-joint · neutral · wrist unknown · grip neutral · straps unknown · unilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 57 | Lat Pulldown | multi-joint · pronated · wrist unknown · grip overhand · straps unknown · bilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 58 | Wide-Grip Lat Pulldown | multi-joint · pronated · wrist unknown · grip overhand · straps unknown · bilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 59 | Neutral-Grip Lat Pulldown | multi-joint · neutral · wrist unknown · grip neutral · straps unknown · bilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 60 | Underhand Lat Pulldown | multi-joint · supinated · wrist unknown · grip underhand · straps unknown · bilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 61 | Single-Arm Lat Pulldown | multi-joint · unknown · wrist unknown · grip unknown · straps unknown · unilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 62 | Straight-Arm Cable Pulldown | multi-joint · pronated · wrist unknown · grip overhand · straps unknown · bilateral · reps | FDS+FDP incidental iso (shared) [no straps] |
| 66 | Pull-Up | multi-joint · pronated · wrist unknown · grip overhand · straps unknown · bilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 67 | Chin-Up | multi-joint · supinated · wrist unknown · grip underhand · straps unknown · bilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 68 | Neutral-Grip Pull-Up | multi-joint · neutral · wrist unknown · grip neutral · straps unknown · bilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 69 | Wide-Grip Pull-Up | multi-joint · pronated · wrist unknown · grip overhand · straps unknown · bilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 70 | Weighted Pull-Up | multi-joint · pronated · wrist unknown · grip overhand · straps unknown · bilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 71 | Weighted Chin-Up | multi-joint · supinated · wrist unknown · grip underhand · straps unknown · bilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 72 | Commando Pull-Up | multi-joint · neutral · wrist unknown · grip neutral · straps unknown · bilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 73 | Archer Pull-Up | multi-joint · pronated · wrist unknown · grip overhand · straps unknown · bilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 74 | L-Sit Pull-Up | multi-joint · pronated · wrist unknown · grip overhand · straps unknown · bilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 75 | Inverted Row | multi-joint · pronated · wrist unknown · grip overhand · straps unknown · bilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 76 | Feet-Elevated Inverted Row | multi-joint · pronated · wrist unknown · grip overhand · straps unknown · bilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 77 | Ring Row | multi-joint · unknown · wrist unknown · grip unknown · straps unknown · bilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 78 | Towel Pull-Up | multi-joint · neutral · wrist unknown · grip crush · straps unknown · bilateral · reps | BR contrib. dyn; FDS+FDP contrib. iso (shared) [no straps] |
| 79 | Scapular Pull-Up | multi-joint · pronated · wrist unknown · grip overhand · straps unknown · bilateral · reps | FDS+FDP incidental iso (shared) [no straps] |
| 80 | Rope Climb | multi-joint · neutral · wrist unknown · grip crush · straps unknown · bilateral · reps | BR contrib. dyn; FDS+FDP contrib. iso (shared) [no straps] |
| 81 | Barbell Shrug | multi-joint · pronated · wrist unknown · grip overhand · straps unknown · bilateral · reps | FDS+FDP incidental iso (shared) [no straps] |
| 82 | Dumbbell Shrug | multi-joint · neutral · wrist unknown · grip neutral · straps unknown · bilateral · reps | FDS+FDP incidental iso (shared) [no straps] |
| 83 | Trap-Bar Shrug | multi-joint · neutral · wrist unknown · grip neutral · straps unknown · bilateral · reps | FDS+FDP incidental iso (shared) [no straps] |
| 84 | Cable Shrug | multi-joint · unknown · wrist unknown · grip unknown · straps unknown · bilateral · reps | FDS+FDP incidental iso (shared) [no straps] |
| 85 | Machine Shrug | multi-joint · unknown · wrist unknown · grip unknown · straps unknown · bilateral · reps | FDS+FDP incidental iso (shared) [no straps] |
| 86 | Incline Dumbbell Shrug | multi-joint · unknown · wrist unknown · grip unknown · straps unknown · bilateral · reps | FDS+FDP incidental iso (shared) [no straps] |
| 121 | Barbell Curl | single-joint · supinated · wrist neutral · grip underhand · straps not applicable · bilateral · reps | Biceps direct dyn; Brachialis direct dyn; BR contrib. dyn; FDS+FDP incidental iso (shared) |
| 122 | EZ-Bar Curl | single-joint · supinated · wrist neutral · grip underhand · straps not applicable · bilateral · reps | Biceps direct dyn; Brachialis direct dyn; BR contrib. dyn; FDS+FDP incidental iso (shared) |
| 123 | Dumbbell Curl | single-joint · supinated · wrist neutral · grip underhand · straps not applicable · bilateral · reps | Biceps direct dyn; Brachialis direct dyn; BR contrib. dyn; FDS+FDP incidental iso (shared) |
| 124 | Alternating Dumbbell Curl | single-joint · supinated · wrist neutral · grip underhand · straps not applicable · bilateral · reps | Biceps direct dyn; Brachialis direct dyn; BR contrib. dyn; FDS+FDP incidental iso (shared) |
| 125 | Incline Dumbbell Curl | single-joint · supinated · wrist neutral · grip underhand · straps not applicable · bilateral · reps | Biceps direct dyn; Brachialis direct dyn; BR contrib. dyn; FDS+FDP incidental iso (shared) |
| 126 | Preacher Curl | single-joint · supinated · wrist neutral · grip underhand · straps not applicable · bilateral · reps | Biceps direct dyn; Brachialis direct dyn; BR contrib. dyn; FDS+FDP incidental iso (shared) |
| 127 | Machine Preacher Curl | single-joint · supinated · wrist neutral · grip underhand · straps not applicable · either · reps | Biceps direct dyn; Brachialis direct dyn; BR contrib. dyn; FDS+FDP incidental iso (shared) |
| 128 | Cable Curl | single-joint · supinated · wrist neutral · grip underhand · straps not applicable · bilateral · reps | Biceps direct dyn; Brachialis direct dyn; BR contrib. dyn; FDS+FDP incidental iso (shared) |
| 129 | Bayesian Cable Curl | single-joint · supinated · wrist neutral · grip underhand · straps not applicable · unilateral · reps | Biceps direct dyn; Brachialis direct dyn; BR contrib. dyn; FDS+FDP incidental iso (shared) |
| 130 | Spider Curl | single-joint · supinated · wrist neutral · grip underhand · straps not applicable · bilateral · reps | Biceps direct dyn; Brachialis direct dyn; BR contrib. dyn; FDS+FDP incidental iso (shared) |
| 131 | Concentration Curl | single-joint · supinated · wrist neutral · grip underhand · straps not applicable · unilateral · reps | Biceps direct dyn; Brachialis direct dyn; BR contrib. dyn; FDS+FDP incidental iso (shared) |
| 132 | Hammer Curl | single-joint · neutral · wrist neutral · grip neutral · straps not applicable · bilateral · reps | BR direct dyn; Brachialis direct dyn; Biceps contrib. dyn; FDS+FDP incidental iso (shared) |
| 133 | Cross-Body Hammer Curl | single-joint · neutral · wrist neutral · grip neutral · straps not applicable · bilateral · reps | BR direct dyn; Brachialis direct dyn; Biceps contrib. dyn; FDS+FDP incidental iso (shared) |
| 134 | Rope Hammer Curl | single-joint · neutral · wrist neutral · grip neutral · straps not applicable · bilateral · reps | BR direct dyn; Brachialis direct dyn; Biceps contrib. dyn; FDS+FDP incidental iso (shared) |
| 135 | Reverse Curl | single-joint · pronated · wrist neutral · grip overhand · straps not applicable · bilateral · reps | BR direct dyn; Brachialis direct dyn; Biceps contrib. dyn; ECRL stabilizer iso; ECRB stabilizer iso; ECU stabilizer iso; FDS+FDP incidental iso (shared) |
| 136 | Zottman Curl | single-joint · changing · wrist neutral · grip unknown · straps not applicable · bilateral · reps | BR direct dyn; Biceps direct dyn; Brachialis direct dyn; ECRL stabilizer iso; ECRB stabilizer iso; ECU stabilizer iso; FDS+FDP incidental iso (shared) |
| 137 | Drag Curl | single-joint · supinated · wrist neutral · grip underhand · straps not applicable · bilateral · reps | Biceps direct dyn; Brachialis direct dyn; BR contrib. dyn; FDS+FDP incidental iso (shared) |
| 138 | Chin-Up Curl | single-joint · supinated · wrist neutral · grip underhand · straps unknown · bilateral · reps | Biceps direct dyn; Brachialis direct dyn; BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 139 | Wrist Curl | single-joint · supinated · wrist changing · grip underhand · straps not applicable · bilateral · reps | FCR direct dyn; FCU direct dyn; PL contrib. dyn; FDS+FDP incidental iso (shared) |
| 140 | Reverse Wrist Curl | single-joint · pronated · wrist changing · grip overhand · straps not applicable · bilateral · reps | ECRL direct dyn; ECRB direct dyn; ECU direct dyn; ED contrib. dyn; FDS+FDP incidental iso (shared) |
| 141 | Wrist Roller | single-joint · pronated · wrist changing · grip overhand · straps not applicable · bilateral · reps | FCR contrib. dyn (shared); FCU contrib. dyn (shared); ECRL contrib. dyn (shared); ECRB contrib. dyn (shared); ECU contrib. dyn (shared); FDS+FDP incidental iso (shared) |
| 142 | Plate Pinch | task · neutral · wrist neutral · grip pinch · straps not applicable · unilateral · seconds, hold | FDS+FDP direct iso (shared); FPL direct iso |
| 143 | Dead Hang | task · pronated · wrist neutral · grip overhand · straps unknown · bilateral · seconds, hold | FDS+FDP direct iso (shared) [no straps] |
| 144 | Towel Dead Hang | task · neutral · wrist neutral · grip crush · straps unknown · bilateral · seconds, hold | FDS+FDP direct iso (shared) [no straps]; FPL contrib. iso **draft** |
| 145 | Farmer Hold | task · neutral · wrist neutral · grip neutral · straps unknown · bilateral · seconds, hold | FDS+FDP direct iso (shared) [no straps]; FPL contrib. iso **draft**; ECRL stabilizer iso; ECRB stabilizer iso; ECU stabilizer iso |
| 186 | Romanian Deadlift | multi-joint · unknown · wrist unknown · grip unknown · straps unknown · bilateral · reps | FDS+FDP incidental iso (shared) [no straps] |
| 187 | Stiff-Leg Deadlift | multi-joint · unknown · wrist unknown · grip unknown · straps unknown · bilateral · reps | FDS+FDP incidental iso (shared) [no straps] |
| 188 | Single-Leg Romanian Deadlift | multi-joint · unknown · wrist unknown · grip unknown · straps unknown · either · reps | FDS+FDP incidental iso (shared) [no straps] |
| 189 | Dumbbell Romanian Deadlift | multi-joint · pronated · wrist unknown · grip overhand · straps unknown · bilateral · reps | FDS+FDP incidental iso (shared) [no straps] |
| 202 | Cable Pull-Through | multi-joint · neutral · wrist unknown · grip neutral · straps unknown · bilateral · reps | FDS+FDP incidental iso (shared) [no straps] |
| 203 | Kettlebell Swing | multi-joint · pronated · wrist unknown · grip overhand · straps unknown · bilateral · reps | FDS+FDP incidental iso (shared) [no straps] |
| 204 | Barbell Hip Hinge | multi-joint · unknown · wrist unknown · grip unknown · straps unknown · bilateral · reps | FDS+FDP incidental iso (shared) [no straps] |
| 205 | B-Stance Romanian Deadlift | multi-joint · unknown · wrist unknown · grip unknown · straps unknown · bilateral · reps | FDS+FDP incidental iso (shared) [no straps] |
| 231 | Hanging Leg Raise | multi-joint · pronated · wrist unknown · grip overhand · straps unknown · bilateral · reps | FDS+FDP incidental iso (shared) [no straps] |
| 232 | Hanging Knee Raise | multi-joint · pronated · wrist unknown · grip overhand · straps unknown · bilateral · reps | FDS+FDP incidental iso (shared) [no straps] |
| 234 | Toes-to-Bar | multi-joint · pronated · wrist unknown · grip overhand · straps unknown · bilateral · reps | FDS+FDP incidental iso (shared) [no straps] |
| 256 | Landmine Row | multi-joint · unknown · wrist unknown · grip unknown · straps unknown · unilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 257 | Meadows Landmine Row | multi-joint · pronated · wrist unknown · grip overhand · straps unknown · unilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 258 | Landmine T-Bar Row | multi-joint · neutral · wrist unknown · grip neutral · straps unknown · bilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 263 | Landmine Romanian Deadlift | multi-joint · unknown · wrist unknown · grip unknown · straps unknown · bilateral · reps | FDS+FDP incidental iso (shared) [no straps] |
| 264 | Landmine Single-Leg Romanian Deadlift | multi-joint · unknown · wrist unknown · grip unknown · straps unknown · either · reps | FDS+FDP incidental iso (shared) [no straps] |
| 299 | Farmer’s Walk | task · neutral · wrist neutral · grip neutral · straps unknown · bilateral · seconds, hold | FDS+FDP direct iso (shared) [no straps]; FPL contrib. iso **draft**; ECRL stabilizer iso; ECRB stabilizer iso; ECU stabilizer iso |
| 300 | Zercher Carry | task · supinated · wrist unknown · grip none · straps not applicable · bilateral · seconds, hold | BR contrib. iso; Biceps contrib. iso; Brachialis contrib. iso |
| 317 | Cable Upright Row | multi-joint · pronated · wrist unknown · grip overhand · straps unknown · bilateral · reps | BR contrib. dyn **draft**; FDS+FDP incidental iso (shared) [no straps] |
| 327 | Wide-Grip Cable Lat Pulldown | multi-joint · pronated · wrist unknown · grip overhand · straps unknown · bilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 331 | Low Cable Row | multi-joint · neutral · wrist unknown · grip neutral · straps unknown · bilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 332 | Rope Cable Row | multi-joint · neutral · wrist unknown · grip neutral · straps unknown · bilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 336 | Cable Biceps Curl | single-joint · supinated · wrist neutral · grip underhand · straps not applicable · bilateral · reps | Biceps direct dyn; Brachialis direct dyn; BR contrib. dyn; FDS+FDP incidental iso (shared) |
| 337 | Rope Hammer Cable Curl | single-joint · neutral · wrist neutral · grip neutral · straps not applicable · bilateral · reps | BR direct dyn; Brachialis direct dyn; Biceps contrib. dyn; FDS+FDP incidental iso (shared) |
| 338 | Incline Cable Curl | single-joint · supinated · wrist neutral · grip underhand · straps not applicable · either · reps | Biceps direct dyn; Brachialis direct dyn; BR contrib. dyn; FDS+FDP incidental iso (shared) |
| 339 | High Cable Curl | single-joint · supinated · wrist neutral · grip underhand · straps not applicable · bilateral · reps | Biceps direct dyn; Brachialis direct dyn; BR contrib. dyn; FDS+FDP incidental iso (shared) |
| 340 | Cable Concentration Curl | single-joint · supinated · wrist neutral · grip underhand · straps not applicable · unilateral · reps | Biceps direct dyn; Brachialis direct dyn; BR contrib. dyn; FDS+FDP incidental iso (shared) |
| 341 | Cable Spider Curl | single-joint · supinated · wrist neutral · grip underhand · straps not applicable · bilateral · reps | Biceps direct dyn; Brachialis direct dyn; BR contrib. dyn; FDS+FDP incidental iso (shared) |
| 342 | Cross-Body Cable Curl | single-joint · neutral · wrist neutral · grip neutral · straps not applicable · unilateral · reps | BR direct dyn; Brachialis direct dyn; Biceps contrib. dyn; FDS+FDP incidental iso (shared) |
| 350 | Cable Wrist Extension | single-joint · pronated · wrist changing · grip overhand · straps not applicable · either · reps | ECRL direct dyn; ECRB direct dyn; ECU direct dyn; ED contrib. dyn; FDS+FDP incidental iso (shared) |
| 379 | Cable Rotational Row | multi-joint · unknown · wrist unknown · grip unknown · straps unknown · unilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 383 | Chest-Supported Landmine Row | multi-joint · unknown · wrist unknown · grip unknown · straps unknown · either · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 384 | Offset Landmine Row | multi-joint · unknown · wrist unknown · grip unknown · straps unknown · unilateral · reps | BR contrib. dyn; FDS+FDP incidental iso (shared) [no straps] |
| 399 | Battle Rope Slams | multi-joint · unknown · wrist unknown · grip crush · straps not applicable · bilateral · reps | FDS+FDP incidental iso (shared) |
| 400 | Battle Rope Alternating Waves | multi-joint · unknown · wrist unknown · grip crush · straps not applicable · bilateral · seconds | FDS+FDP incidental iso (shared) |
| 401 | Finger Curl | single-joint · supinated · wrist neutral · grip fingers_only · straps not applicable · bilateral · reps | FDS+FDP direct dyn (shared) |
| 402 | Gripper Close | single-joint · neutral · wrist neutral · grip crush · straps not applicable · unilateral · reps | FDS+FDP direct dyn (shared) |
| 403 | Gripper Hold | single-joint · neutral · wrist neutral · grip crush · straps not applicable · unilateral · seconds, hold | FDS+FDP direct iso (shared) |
| 404 | Band Finger Extension | single-joint · unknown · wrist neutral · grip open_hand · straps not applicable · unilateral · reps | ED direct dyn (shared); EDM contrib. dyn (shared); EI contrib. dyn (shared) |
| 405 | Lever Pronation | single-joint · changing · wrist neutral · grip neutral · straps not applicable · unilateral · reps · elbow 90° | PT direct dyn (shared); PQ direct dyn (shared); FDS+FDP incidental iso (shared) |
| 406 | Lever Supination | single-joint · changing · wrist neutral · grip neutral · straps not applicable · unilateral · reps · elbow 90° | SUP direct dyn (shared); Biceps contrib. dyn (shared); FDS+FDP incidental iso (shared) |
| 407 | Lever Radial Deviation | single-joint · neutral · wrist changing · grip neutral · straps not applicable · unilateral · reps · elbow 0° | FCR direct dyn (shared); ECRL direct dyn (shared); ECRB direct dyn (shared); FDS+FDP incidental iso (shared) |
| 408 | Lever Ulnar Deviation | single-joint · neutral · wrist changing · grip neutral · straps not applicable · unilateral · reps · elbow 0° | FCU direct dyn (shared); ECU direct dyn (shared); FDS+FDP incidental iso (shared) |
| 409 | Suitcase Carry | task · neutral · wrist neutral · grip neutral · straps unknown · unilateral · seconds, hold | FDS+FDP direct iso (shared) [no straps]; FPL contrib. iso **draft**; ECRL stabilizer iso; ECRB stabilizer iso; ECU stabilizer iso |
| 410 | One-Arm Dumbbell Wrist Curl | single-joint · supinated · wrist changing · grip underhand · straps not applicable · unilateral · reps | FCR direct dyn; FCU direct dyn; PL contrib. dyn; FDS+FDP incidental iso (shared) |
| 411 | One-Arm Dumbbell Reverse Wrist Curl | single-joint · pronated · wrist changing · grip overhand · straps not applicable · unilateral · reps | ECRL direct dyn; ECRB direct dyn; ECU direct dyn; ED contrib. dyn; FDS+FDP incidental iso (shared) |
| 412 | Band Thumb Flexion | single-joint · unknown · wrist neutral · grip thumb · straps not applicable · unilateral · reps | FPL direct dyn |
| 413 | Band Thumb Extension | single-joint · unknown · wrist neutral · grip thumb · straps not applicable · unilateral · reps | EPL direct dyn (shared); EPB direct dyn (shared) |
| 414 | Band Thumb Abduction | single-joint · unknown · wrist neutral · grip thumb · straps not applicable · unilateral · reps | APL direct dyn |
| 415 | Wrist Roller, Extension Wind | single-joint · pronated · wrist changing · grip overhand · straps not applicable · bilateral · reps | FCR contrib. dyn; FCU contrib. dyn; ECRL direct dyn; ECRB direct dyn; ECU direct dyn; FDS+FDP incidental iso (shared) |
| 416 | Wrist Roller, Flexion Wind | single-joint · pronated · wrist changing · grip overhand · straps not applicable · bilateral · reps | FCR direct dyn; FCU direct dyn; ECRL contrib. dyn; ECRB contrib. dyn; ECU contrib. dyn; FDS+FDP incidental iso (shared) |

## Counts

119 variants and 418 mappings in `forearm_mappings_v1`: **413 reviewed, 5 draft**. All 19 core forearm muscles have at least one reviewed mapping.

Draft (pending review, not counted), by mapping id:

| Mapping id | Why it is draft |
|---|---|
| `cat-144:forearm.fpl` | Towel Dead Hang: the thumb wraps and presses the towel, but how much the long thumb flexor is loaded is not established. |
| `cat-145:forearm.fpl` | Farmer Hold: thumb on a handle; FPL's share of a handle grip, as opposed to a pinch (M4), is not established. |
| `cat-299:forearm.fpl` | Farmer's Walk: as Farmer Hold. |
| `cat-409:forearm.fpl` | Suitcase Carry: as Farmer Hold. |
| `cat-317:forearm.br` | Cable Upright Row: the elbows bend as the bar rises, but whether the elbow flexors move the load or mostly follow the shoulders is not established. |

Reviewed and draft mappings per muscle (reviewed / draft): BR 68/1, FCR 6/0, FCU 6/0, PL 2/0, FDS 114/0, FDP 114/0, FPL 2/4, PT 1/0, PQ 1/0, ECRL 12/0, ECRB 12/0, ECU 12/0, ED 4/0, EDM 1/0, EI 1/0, APL 1/0, EPB 1/0, EPL 1/0, supinator 1/0; upper-arm contributors biceps 27/0, brachialis 26/0.

Evidence basis across all 418: anatomy 176, inference 221, EMG 21. Categories the 413 reviewed mappings give a bout (`categoryFor`): direct dynamic 86, contributing dynamic 84, deliberate isometric 18, incidental isometric 225. The large incidental count is the grip on every row, pulldown, pull-up, hinge, shrug, curl and lever: visible as context, never dynamic credit.

## Sources added (M1-M8)

Found by web search on 16 Oct 2026 and read at abstract level; each mapping cites them only for what they measured. None measures growth.

| Id | Source | Used for |
|---|---|---|
| M1 | Kleiber, Kunz and Disselhorst-Klug 2015, Front Physiol (biceps and brachioradialis by hand position, surface EMG, 16 adults) | the brachioradialis's role by grip: contributing palms up, direct palms down; mixed evidence stated for the hammer curl |
| M2 | Mogk and Keir 2003, Ergonomics 46(9) (forearm muscle loading during gripping by posture) | wrist extensors as stabilizers in reverse and Zottman curls and in carries |
| M3 | Jukic et al. 2021, Physiology & Behavior 229 (lifting straps in the deadlift) | grip credit withheld from strapped sets |
| M4 | Goetz et al. 2012 (FPL block and pinch strength, PubMed 23101527) | FPL direct in the plate pinch |
| M5 | Kondi et al. 2026, Cureus (supinator vs biceps, PQ vs PT under a lever, pilot of 4) | shared pronation and supination |
| M6 | O'Sullivan and Gallwey 2002, J Electromyogr Kinesiol 12(4) (rotation torque by elbow and forearm angle) | recording the elbow angle on the rotation levers |
| M7 | Pratt et al. 2020, J Electromyogr Kinesiol (deadlift forearm EMG by grip type and sex) | grip exposure in deadlifts depends on set-up; cited only for that |
| M8 | TTUHSC El Paso arm muscle tables (companion to S4) | biceps and brachialis actions |

The anatomy table S4 itself could not be opened from this build environment (its host is refused by the network proxy); mappings cite it by the muscle's row, as the brief does, and the anatomy lane's claims carry the checked wording. Exact titles that could not be confirmed (M3, M4) are written as descriptions.

## Unresolved

1. **Lever pronation and supination photos.** The only candidate pairs were not used (see Photos). Thirteen of the 16 new rows show the placeholder frame and are not yet in `docs/exercise-photo-checklist/`.
2. **Five draft mappings** (above). They need a source on thumb loading in handle grips, and one on elbow-flexor work in the upright row, or they stay draft.
3. **Drafts inside a published version.** The version is published with its five drafts visible as pending review, as `02-design.md` §3 describes. The database lane's publish check ("fails while a mapping lacks a source or review") must accept draft rows in a published version, or the drafts must move to the next version. Every mapping has at least one source, so a source check alone passes.
4. **`sharedWith` semantics.** The calculator should group shared mappings within the same variant, relationship and mode (see Method), so the deviation levers' shared deviators are not listed as shared with their grip.
5. **Node actions.** `forearmNodeActions` was empty when this was written. The test that each mapping's action is among its muscle's node actions runs once the anatomy lane fills them; a mismatch then is a real disagreement to resolve, not a test to loosen. The mappings use FDS → middle-joint flexion, FDP → fingertip flexion, ED → finger extension (and wrist extension as an assist on reverse wrist curls), EPB → thumb-knuckle extension, APL → thumb abduction.
6. **Not credited, by design:** the hand's own muscles in pinches, band finger work and thumb abduction (a hand region); EPB's assist in thumb abduction; the pronators and supinator in the Zottman turn; finger motion when a wrist-curl bar is let roll to the fingertips.
7. **Band load convention.** Band rows take the default "whole load" convention, as the existing band rows do; a band has no standard mass. How the logger records band resistance is for the logger lane.
8. **Hanging Knee Raise tags.** The database maps 232 to iliopsoas and rectus abdominis; the catalog keeps hip flexors secondary on both hanging raises (231, 232). Making them primary on both is a catalog-wide decision left open.
9. **Duplicate catalog names.** "Romanian Deadlift" (42, 186) and "Dumbbell Pullover" (24, 65) each appear twice. Both Romanian deadlifts are mapped identically and both pullovers are unmapped, so a history matched by name lands the same either way.
10. **Gripper equipment.** "Free weights" is the nearest existing value; a dedicated grip-tool value would need the equipment profile to learn it.
