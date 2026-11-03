# Zercher, neck and bench additions: completion ledger (2 Nov 2026)

One row per proposal of the owner's handoff (`2026-10-23-zercher-neck-bench-handoff.md`), with the catalog id it resolved to (`exercise-addition-resolution.json`). Code: catalog rows in `client/src/lib/exerciseCatalogZercherNeckBench.ts`, execution records in `client/src/lib/exerciseExecution.ts`. Tests for every row: `client/src/lib/exerciseAdditions.contract.test.ts` (the data contract), `exerciseAdditions.discovery.test.ts` (search, gates, role credit, media), `client/src/components/ExerciseAdditions.render.test.ts` (detail, pickers, Body Lab), and the logging tests (`exerciseLogging.test.ts`, `DeviceWorkoutTracker.zercherNeckBench.test.ts`, `deviceWorkoutLog.zercherNeckBench.test.ts`, `sessionRecap.zercherNeckBench.test.ts`, `workoutSwap.zercherNeckBench.test.ts`, `neckWeek.test.ts`). Deployment: see the release's pull request.

| Key | Id | Row | Decision | Logged as | Mapping status | Media |
|---|---|---|---|---|---|---|
| `zercher_deadlift_floor` | 421 | Zercher Deadlift — Floor | new | Reps | Catalog-level roles; listed as not counted on the upper-arm page until a later upper-arm mapping version | Placeholder (no exact candidate) |
| `zercher_block_pull` | 422 | Zercher Block Pull | new | Reps | Catalog-level roles; listed as not counted on the upper-arm page until a later upper-arm mapping version | Placeholder (no exact candidate) |
| `zercher_good_morning` | 423 | Zercher Good Morning | new | Reps | Catalog-level roles; listed as not counted on the upper-arm page until a later upper-arm mapping version | Placeholder (no exact candidate) |
| `zercher_hold` | 424 | Zercher Hold | new | Seconds | Catalog-level roles; listed as not counted on the upper-arm page until a later upper-arm mapping version | Placeholder (no exact candidate) |
| `machine_neck_flexion` | 425 | Machine Neck Flexion | new | Reps | Catalog-level roles (neck); no body-region page maps neck yet | Placeholder (no exact candidate) |
| `machine_neck_extension` | 426 | Machine Neck Extension | new | Reps | Catalog-level roles (neck); no body-region page maps neck yet | Placeholder (no exact candidate) |
| `machine_neck_lateral_flexion` | 427 | Machine Neck Lateral Flexion | new | Reps; head direction per set | Catalog-level roles (neck); no body-region page maps neck yet | Placeholder (no exact candidate) |
| `harness_neck_extension` | 428 | Seated Harness Neck Extension | new | Reps | Catalog-level roles (neck); no body-region page maps neck yet | Approved photo (free-exercise-db `Seated_Head_Harness_Neck_Resistance`) |
| `cable_neck_flexion` | 429 | Cable Harness Neck Flexion | new | Reps | Catalog-level roles (neck); no body-region page maps neck yet | Placeholder (no exact candidate) |
| `cable_neck_extension` | 430 | Cable Harness Neck Extension | new | Reps | Catalog-level roles (neck); no body-region page maps neck yet | Placeholder (no exact candidate) |
| `cable_neck_lateral_flexion` | 431 | Cable Harness Neck Lateral Flexion | new | Reps; head direction per set | Catalog-level roles (neck); no body-region page maps neck yet | Placeholder (no exact candidate) |
| `cable_neck_rotation` | 432 | Cable Harness Neck Rotation | new | Reps; head direction per set | Catalog-level roles (neck); no body-region page maps neck yet | Placeholder (no exact candidate) |
| `isometric_neck_flexion` | 433 | Isometric Neck Flexion — Manual Resistance | new | Seconds | Catalog-level roles (neck); no body-region page maps neck yet | Rejected candidate, placeholder: Standing; the row is seated with the torso supported |
| `isometric_neck_extension` | 434 | Isometric Neck Extension — Manual Resistance | new | Seconds | Catalog-level roles (neck); no body-region page maps neck yet | Rejected candidate, placeholder: Standing; the row is seated with the torso supported |
| `isometric_neck_lateral_flexion` | 435 | Isometric Neck Lateral Flexion — Manual Resistance | new | Seconds; head direction per set | Catalog-level roles (neck); no body-region page maps neck yet | Rejected candidate, placeholder: Standing, one hand on the side of the head; the row is seated with the torso supported |
| `isometric_neck_rotation` | 436 | Isometric Neck Rotation — Manual Resistance | new | Seconds; head direction per set | Catalog-level roles (neck); no body-region page maps neck yet | Placeholder (no exact candidate) |
| `plate_loaded_incline_press` | 437 | Plate-Loaded Incline Chest Press | new | Reps | Catalog-level roles; listed as not counted on the upper-arm page until a later upper-arm mapping version | Approved photo (free-exercise-db `Leverage_Incline_Chest_Press`) |
| `selectorized_decline_press` | 438 | Selectorized Decline Chest Press | new | Reps | Catalog-level roles; listed as not counted on the upper-arm page until a later upper-arm mapping version | Placeholder (no exact candidate) |
| `plate_loaded_decline_press` | 439 | Plate-Loaded Decline Chest Press | new | Reps | Catalog-level roles; listed as not counted on the upper-arm page until a later upper-arm mapping version | Approved photo (free-exercise-db `Leverage_Decline_Chest_Press`) |
| `smith_incline_bench` | 15 | Smith Machine Incline Press | reuse | Existing | Existing row: no atlas change (catalog 15's own mappings) | Existing photo |
| `smith_decline_bench` | 440 | Smith Machine Decline Bench Press | new | Reps | Catalog-level roles; listed as not counted on the upper-arm page until a later upper-arm mapping version | Approved photo (free-exercise-db `Smith_Machine_Decline_Press`) |
| `barbell_floor_press` | 441 | Barbell Floor Press | new | Reps | Catalog-level roles; listed as not counted on the upper-arm page until a later upper-arm mapping version | Approved photo (free-exercise-db `Floor_Press`) |
| `paused_barbell_bench` | 442 | Paused Barbell Bench Press | new | Reps | Catalog-level roles; listed as not counted on the upper-arm page until a later upper-arm mapping version | Placeholder (no exact candidate) |
| `spoto_press` | 443 | Spoto Press | new | Reps | Catalog-level roles; listed as not counted on the upper-arm page until a later upper-arm mapping version | Placeholder (no exact candidate) |

Reused without a new row: 12 Incline Machine Chest Press (aliases "incline bench machine", "machine incline press"; its machine stays unspecified), 15 Smith Machine Incline Press (the handoff's Smith Machine Incline Bench Press), 164 Zercher Squat ("unilateral" removed from its qualities: it is a two-legged squat), 300 Zercher Carry ("grip" removed: the hands do not hold the bar; the atlas already credits no finger flexor).

**3 Nov 2026, the owner: "make sure everything is consistent and cohesive".** The detail now uses the logger's words, with a test that holds the two together (`ExerciseExecutionDetail.words.test.ts`):
- Each load line opens with the logger's load label ("Plates per arm", "Machine load", "Harness load", "Manual resistance · force not measured"). The history uses the same labels: "Machine load as displayed" is now "Machine load".
- The Smith choices read "Plates only" and "Plates + bar".
- The direction is "Head direction", or "Push / turn toward" on a hold.
- Setup lists only the values the logger asks for.
- "Setup" replaces "Set-up" throughout.

The steps are rewritten as plain technique for each row. Sources show their titles as links, with what each supports underneath. Train → Review's week board paints the Specialize drawing's red scale. Phone evidence is in `docs/specialization-atlas/evidence/consistency-2026-11-03/`.
