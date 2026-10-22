# Package records (exercises.json) against the shipped catalog (client/src/lib/exerciseCatalog*.ts, 416 rows) and variants (shared/specialization/variants/forearm.ts)

Match: **same** = the shipped row's definition (variants/forearm.ts notes) is the package's joint task; **same task, setup differs** = same action and counting, a set-up detail the package records (thick handle, seated vs kneeling) that no shipped attribute holds; **near** = a related row exists but is a different task; **none** = no row. Line numbers are variants/forearm.ts unless stated.

| Package id | Package name | Shipped row | Match | Notes |
|---|---|---|---|---|
| fa-01 | Seated barbell wrist curl | 139 Wrist Curl (:123) | same task, setup differs | 139 is kneeling, forearms on a bench (photo); package seated, forearms supported. Same action and mapping family. |
| fa-02 | Seated barbell reverse wrist curl | 140 Reverse Wrist Curl (:124) | same task, setup differs | as fa-01 |
| fa-03 | Behind-the-back barbell wrist curl | none | none | new row; wrist-curl family mappings (mappings.ts:170-177) |
| fa-04 | Barbell reverse curl | 135 Reverse Curl (:110) | same | barbell, palms down, wrist straight |
| fa-05 | Barbell reverse preacher curl | near 126 Preacher Curl (:101, supinated) | none | new row; pronatedCurl family (mappings.ts:158-166) |
| fa-06 | Barbell static hold | near 145 Farmer Hold (:152, "an implement in each hand") | none | one bar in both hands, overhand: new hold row (deliberateHold, seconds, straps unknown) |
| fa-07 | Barbell rollout / wrist roll (blocked) | 238 Barbell Rollout (abdominal, not forearm-mapped); 141/415/416 wrist rollers | ambiguous | the shipped catalog already holds both readings; resolution = pick one existing row, no new row |
| fa-08 | Thick-grip barbell curl | 121 Barbell Curl (:96) | same task, setup differs | no thick-handle attribute exists; package's own rule: no multiplier (START-HERE §2.1, S07) |
| fa-09 | Thick-grip Romanian deadlift | 42 / 186 Romanian Deadlift (:213-214) | same task, setup differs | catalog already has the name twice (05-mappings.md:271) |
| fa-10 | Barbell pronated wrist roll (blocked) | 140, 415, 401 are the three readings | ambiguous | resolution = pick one existing row |
| fa-11 | Dumbbell wrist curl | 410 One-Arm Dumbbell Wrist Curl (:130) | same | example-events.json logs it one-sided |
| fa-12 | Dumbbell reverse wrist curl | 411 One-Arm Dumbbell Reverse Wrist Curl (:131) | same | |
| fa-13 | Dumbbell neutral-grip wrist curl (blocked) | 407 Lever Radial Deviation (:132) if radial deviation | ambiguous | the package's own note asks for the resistance vector; 407 defines it |
| fa-14 | Dumbbell hammer curl | 132 Hammer Curl (:107) | same | |
| fa-15 | Dumbbell preacher hammer curl | none (126 is supinated) | none | new row; neutralCurl family (mappings.ts:148-155) |
| fa-16 | Dumbbell Zottman curl | 136 Zottman Curl (:111) | same | shipped already withholds rotation credit (mappings.ts:259-264), as the package asks |
| fa-17 | Levered dumbbell pronation | 405 Lever Pronation (:136) | same | elbow 90 defined; offset load required in both |
| fa-18 | Levered dumbbell supination | 406 Lever Supination (:137) | same | |
| fa-19 | Dumbbell radial deviation | 407 Lever Radial Deviation (:132) | same | resistance vector defined (arm straight, weight in front) |
| fa-20 | Dumbbell ulnar deviation | 408 Lever Ulnar Deviation (:133) | same | |
| fa-21 | Thick-grip dumbbell farmer carry | 299 Farmer's Walk (:153) | same task, setup differs | thick handle not recordable |
| fa-22 | One-arm dumbbell reverse wrist extension (alias of fa-12) | 411 | same | package alias resolves to 411 |
| fa-23 | Cable wrist curl | none (350 is extension) | none | new row "Cable Wrist Curl"; wristCurl family |
| fa-24 | Cable reverse wrist curl | 350 Cable Wrist Extension (:129) | same | 350 is `either`, bar or handle not defined |
| fa-25 | Cable reverse curl | none (128 Cable Curl supinated) | none | new row; pronatedCurl family |
| fa-26 | Rope cable hammer curl | 134 Rope Hammer Curl (:109) and 337 Rope Hammer Cable Curl (:115) | same (two shipped rows) | the catalog already holds this exercise twice, mapped identically |
| fa-27 | Behind-the-back cable curl (blocked) | 129 Bayesian Cable Curl (:104) if the elbow reading | ambiguous | elbow reading exists; the wrist reading would be a new row |
| fa-28 | Rope seated cable row | 332 Rope Cable Row (:185) | same | |
| fa-29 | Towel cable row | none (54 Seated Cable Row with a V-handle) | none | new row; rows family with crush grip like 78/80 (mappings.ts:318-321) |
| fa-30 | Lever pronation machine | near 405 (dumbbell lever) | none | machine load is device-specific (package note): new row, machine_displayed_load |
| fa-31 | Lever supination machine | near 406 | none | as fa-30 |
| fa-32-flexion | Lever wrist flexion machine | none | none | new row |
| fa-32-extension | Lever wrist extension machine | none | none | new row |
| fa-33 | Single-arm kettlebell farmer carry | 409 Suitcase Carry (:154, "one dumbbell or kettlebell in one hand") | same | |
| fa-34 | Bottoms-up kettlebell press | none | none | new row; no shipped mapping family (the four kettlebell rows 387-390 are listed unmapped with reasons, shared/specialization/regions/forearm/unmapped.ts:34-37) |
| fa-35 | Bottoms-up kettlebell clean | near 387 Kettlebell Clean (listed unmapped, unmapped.ts:34: "Ballistic: the bell rotates around the hand") | none | new row; the shipped review declined to map ballistic kettlebell grips |
| fa-36 | Kettlebell hammer curl | near 132 Hammer Curl (two dumbbells) | none | package: offset centre of mass adds wrist torque; new row or log as 132 |
| fa-37-flexion | Kettlebell wrist curl | near 410 | none | package keeps it separate for handle geometry |
| fa-37-extension | Kettlebell reverse wrist curl | near 411 | none | as above |
| fa-38 | Plate pinch hold | 142 Plate Pinch (:149) | same | FPL direct iso in both |
| fa-39 | Plate flips (blocked) | none | none | blocked in the package; no row |
| fa-40 | Plate wrist flexor curl with extended fingers (blocked) | none | none | blocked |
| fa-41 | Straight-bar dead hang | 143 Dead Hang (:150) | same | |
| fa-42 | Towel pull-up | 78 Towel Pull-Up (:207) | same | shipped grip is contributing, not incidental (mappings.ts:318-321) |
| fa-43 | Towel dead hang | 144 Towel Dead Hang (:151) | same | |
| fa-44 | Thick-bar dead hang | 143 Dead Hang | same task, setup differs | |
| fa-45 | Fingertip push-up | near 26 Standard Push-Up (not forearm-mapped) | none | new row; FDS/FDP isometric on a closed chain |
| fa-46 | Fingertip plank | near 246 RKC Plank | none | new hold row (seconds) |
| fa-47 | Spring gripper squeeze | 402 Gripper Close (:141) | same | 403 Gripper Hold is the sustained version |
| fa-48 | Ball squeeze | none (402 is a torsion spring) | none | new row; package splits repeated vs sustained |
| fa-49 | Crab walk | none | none | new row |
| fa-50-finger-close | Rice bucket finger closing | none | none | new row |
| fa-50-finger-open | Rice bucket finger opening | near 404 Band Finger Extension (:143) | none | same muscles as 404; new row |
| fa-50-pronation | Rice bucket pronation | near 405 | none | new row |
| fa-50-supination | Rice bucket supination | near 406 | none | new row |
| fa-50-wrist-flexion | Rice bucket wrist flexion | near 139/410 | none | new row |
| fa-50-wrist-extension | Rice bucket wrist extension | near 140/411 | none | new row |

Totals (57 records): 25 match a shipped row (19 the same task; 6 the same task with a set-up difference no shipped attribute records: fa-01, fa-02 seated; fa-08, fa-09, fa-21, fa-44 thick handle); 4 blocked records already have shipped rows for one of their readings (fa-07, fa-10, fa-13, fa-27); 2 blocked records have none (fa-39, fa-40); 26 records would need new catalog rows (fa-03, 05, 06, 15, 23, 25, 29, 30, 31, 32-flexion, 32-extension, 34, 35, 36, 37-flexion, 37-extension, 45, 46, 48, 49 and the six fa-50 rice-bucket actions).
