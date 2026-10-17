# Specialization atlas: the workout logger (16 Oct 2026)

What the workout logger now asks and stores for the atlas (`02-design.md` §6), where the athlete sees it, and what was left out on purpose. The brief's rule for this part: keep it "out of the workout logger until relevant; avoid making every set entry a questionnaire."

## One rule: ask only where the atlas says it matters

`loggingPolicyFor(catalogId)` in `shared/specialization/loggingPolicy.ts` reads the variants and mappings of every production region through the logger's light region list (`shared/specialization/loggingRegions.ts`: each region's status, variants and mappings, never the drawing, claims or sources) and returns, for one catalog exercise:

| Field | Meaning | Comes from |
|---|---|---|
| `measure` | `"reps"` or `"seconds"` | the variant's `measure` |
| `askSide` | ask which arm | variant laterality `unilateral` or `either` |
| `oneArm` | one arm at a time by definition: a planned set is done once with each arm | variant laterality `unilateral` |
| `sideDefault` | the arm shown before any set is logged | `both` for `either`, nothing for `unilateral` |
| `strapsSensitive` | straps change what the set earns | any non-rejected mapping of that variant with `requiresNoStraps` |

An exercise the atlas does not map gets the default policy (reps, no arm, no straps), which is the logger exactly as it was. Fixture regions (the test-only deltoid) are never read. Variants and mappings are injectable, so tests supply their own; in production they are the forearm's reviewed variants and mappings (05-mappings.md).

The screens that load with the app's first screen (Home's Plan editor, picker, print and share; the recap, the session detail and an exercise's history through `sessionRecap.ts`) need one fact from the atlas, whether an exercise is measured in seconds. They read it from `shared/specialization/holdCatalogIds.ts`, the nine catalog ids the atlas measures in seconds (142 Plate Pinch, 143 Dead Hang, 144 Towel Dead Hang, 145 Farmer Hold, 299 Farmer's Walk, 300 Zercher Carry, 400 Battle Rope Alternating Waves, 403 Gripper Hold, 409 Suitcase Carry), which imports nothing. `client/src/lib/specialization/holdCatalogIds.test.ts` keeps it equal to the policy's and the variants' `measure`: a variant whose measure changes, or a new region with holds, fails that test until the list is updated.

### What each screen downloads (production build, 17 Oct 2026)

Measured with `npx vite build --outDir <scratch>` before and after this lane's changes (raw bytes, gzip -9 in brackets):

| Chunk | Before (d99cdc0) | After | What it holds of the atlas |
|---|---|---|---|
| `App` (first screen) | 898,665 (228,435) | 893,750 (226,842) | the light hold list and the one prescription reading (`prescriptionOf` in `workoutPlanner.ts`); no mapping, claim or diagram text |
| `DeviceWorkoutTracker` (Train) | 46,072 (13,990) + `planBouts` 5,255 (2,207) | 55,128 (17,052) | the logging policy, the swap itself (`workoutSwap.ts`) and the swap sheet; it imports the `mappings` chunk |
| `mappings` | 43,740 (10,760) | 43,740 (10,759) | the forearm's variants and mappings only; loaded by the tracker and the specialization page |
| `WorkoutSessionDetail` (the saved recap; a workout opened from Progress) | 8,868 (3,170), imported `mappings` | 8,066 (2,841), imports no atlas data | reads holds from the light list |
| `SpecializationPanel` (the page) | 340,319 (96,591) + `planBouts` 5,255 (2,207) | 345,129 (98,300) | the drawing, anatomy, claims, sources, and the planned-bout adapter (`boutsFromPlan`, no longer a chunk shared with the tracker) |

The App chunk is smaller because the swap logic moved out of it: `catalogIdOf` and `swapNote`, all the first screens read of a swap, live in `client/src/lib/workoutSwapRecord.ts`, and `workoutSwap.ts` (assess, apply, undo, add, the sheet's notes and suggestions) now loads with the tracker only. The diagram path ids, a mapping rationale, a claim statement and the planned-side note were searched for in the App chunk and are not there. Opening Train downloads the tracker, `mappings` and session-detail chunks, 30.7 kB gzip (0.5 kB more than before: the swap code that left App), on top of an App chunk 1.6 kB gzip smaller: 1.1 kB gzip less in all. Opening a workout from Progress no longer downloads `mappings`.

## What is stored

All fields are optional and validated by the one normalizer every screen reads through (`normalizeSet` and the exercise normalizer in `deviceWorkoutLog.ts`). Anything else stored there is dropped on load and on save, never read as a value.

| Field | On | Values kept | Written when |
|---|---|---|---|
| `side` | set | `left`, `right`, `both` | a set is logged on an exercise that asks the arm, with the arm shown selected |
| `holdSeconds` | set | whole seconds as digits (`"30"`); a whole number is read as its digits, leading zeros dropped; text, negatives and fractions dropped | a set is logged on a hold with seconds typed |
| `warmup` | set | `true` only | never by the logger (see below) |
| `straps` | exercise | `yes`, `no` | the athlete taps Used or Not used |
| `id` | set | any non-empty string | every new set, at creation |

- **A hold** is a set with `holdSeconds` and empty `reps`. `isHoldSet()` and `holdSecondsOf()` (never NaN) are what readers use.
- **Set ids.** Every new set gets an id when it is created: a new workout (`makeSession`), an exercise added after another (`addAfter`) and a swapped-in exercise (`applySwap`), all through `newSetId()`. Logging a set keeps its id. Sets are still addressed by position, as before. History logged before ids keeps none: nothing is migrated.
- **Straps unanswered** is "not recorded", which the calculator treats differently from "no" (`02-design.md` §3).

## Where the athlete sees it

### The live set card (Train → Workout)

- **Holds.** A hold has its load box (for a bodyweight hang, the optional "Added weight") and then **Seconds**, in place of Reps. The target reads "40 sec". The last set reads "Last set: 40 sec" or "Last set: 70 lb · 40 sec", and its seconds are carried into the box as an offer, marked the same way as carried reps. Next moves from the load to Seconds; Done on Seconds logs the set. The set is stored with `holdSeconds` and no reps. The "Standard / Drop set" choice is not shown: a hold has no reps to drop. A set of that exercise logged in reps before it was measured in seconds is shown as reps ("70 lb · 40 reps") and is never read as seconds (see "Reps logged before an exercise was measured in seconds").
- **A hold needs its seconds.** Log set stays off until whole seconds of at least 1 are in, and the card says why in place: "Add the seconds", or "Add the seconds: at least 1" after a 0, linked to the button by `aria-describedby`. Done on the keyboard logs nothing until then; seconds carried from the last set count. The full workout list's row does the same. The disabled button is drawn at full strength (no faded control), and the list's boxes are 16 px so iOS does not zoom.
- **The hold's target** is the plan's prescription read by `prescriptionOf` (see "One reading of a hold's prescription"): an unset hold, or one carrying the goal's pinned rep default, reads "4 × 30 sec" with the goal's set count, so the card says "30 sec", never "3–6 sec". A bare number the athlete wrote on a hold ("3 × 40") is seconds.
- **Arm.** On a one-arm or either-arm exercise, a row "Arm · Left · Right · Both" sits above the entry boxes: four columns, every segment outlined at rest, the chosen one filled, each 44 px tall. Two-handed and unmapped exercises never show it.
  - It starts on the arm that comes next: after a Left set it offers Right, after a Right set Left, after a Both set Both.
  - Before any set is logged on that exercise, an either-arm exercise starts on Both and a one-arm exercise starts with nothing chosen.
  - The arm shown when the set is logged is the arm recorded, so a set done as offered needs no tap. A one-arm set logged with no arm chosen records none: the side stays unknown and is never guessed.
- **Per-arm rows (the `perArmSets` gate).** For an athlete with an active specialization target (Home passes `perArmSets` from the same value as `askStraps`), a planned set of a one-arm exercise (`oneArm`, laterality `unilateral`) is two rows, Right then Left, each with its arm preset: "3 × 12" is 6 rows, the prestart line reads "3 × 12 · each arm" and "6 sets", and a per-set target "3 × 10/8/6" reads 10, 10, 8, 8, 6, 6. That is how the atlas counts the plan (a one-arm set count is per arm, `planBouts.ts`), so the plan logged as built gives each arm exactly the planned bouts. Picking the other arm on a row re-alternates the rows still to do; Both changes only its own row. Either-arm and two-handed exercises are never split, and without the gate every workout is built as before, one row per planned set.
- **Straps.** "Straps · Used / Not used" appears below the effort toggle, only on an exercise whose grip mapping a strapped set does not earn **and** only when the tracker's `askStraps` prop is true. Home passes it once the athlete has an active specialization target (`isGoalActiveAt`), the same value it passes as `perArmSets`. It is two outlined 44 px pills, asked once per exercise. Tapping the chosen one again takes it back to "not recorded".
- **Logged-sets list** (under the card): "70 lb × 40 s · Left".
- **Full workout list:** a hold's rows take Seconds where other rows take Reps, and offer no drop set. A logged set's row header names its arm ("Set 1 · Left").

### Swap and add in the middle of a workout

- The sheet says how the new exercise is logged when that differs: "Dead Hang is logged in seconds held, not reps." or "Pull-Up is logged in reps, not seconds.".
- It drops the "set the reps as you go" note when the new exercise is a hold.
- A set typed but not logged can be reused only between two exercises measured the same way: "Use the seconds for Farmer Hold" between holds, "Use the reps for …" between rep exercises.
- Between a hold and a rep exercise that choice is not offered and nothing is carried. Seconds never become reps, and reps never become seconds.
- **A hold swapped or added in** starts from the prescription it takes over, read by its own measure (`prescriptionOf`): the goal's rep default pinned on the plan entry becomes a hold's ("4 × 3–6" → "4 × 30 sec"), and the sheet says so: "The plan's 4 × 3–6 is the goal's rep default, so Dead Hang starts from a hold's: 4 × 30 sec." Text the athlete wrote is kept, with a note where a bare number will read as seconds: "The plan's target (3 × 12) gives no unit; on Dead Hang its numbers are seconds."
- **Per-arm rows under the gate.** A swap counts the plan in planned sets (`swapSets` in `workoutSwap.ts`, the count `applySwap` makes and the sheet shows), so the plan's work is the same whichever exercise does it:

  | Going out → coming in | The new exercise gets |
  |---|---|
  | one-arm, per-arm rows → two-handed or either-arm | one set for every two one-arm rows left (an odd one rounds up): 6 rows → 3 sets; Right of set 1 logged, 5 rows left → 3 sets |
  | two-handed → one-arm (gate on) | a Right and a Left row per set left, arm preset: 3 sets → 6 rows |
  | one-arm, per-arm rows → one-arm (gate on) | the same rows, each keeping its arm |
  | anything, gate off | one row per set left, as before |

  Adding an exercise (Add exercise, or "nothing left to swap") starts from the anchor's planned prescription, so it gets the anchor's planned sets, not its rows; a one-arm exercise added under the gate gets a Right and a Left row for each. With no row left to hand on, a swap still gives one planned set.
- **The sheet says the count before the confirm**, from the same function: "Nothing is logged for Hammer Curl yet, so One-Arm Dumbbell Wrist Curl takes its place with the same 3 planned sets, done once with each arm: 6 sets.", "… so Hammer Curl takes its place with the same 3 planned sets, not one per arm.", "Hammer Curl takes the 5 one-arm sets left as 3 sets, not one per arm.", "One-Arm Dumbbell Wrist Curl goes in straight after Hammer Curl, starting from the same sets and reps: 3 sets, done once with each arm: 6 sets." Where rows per arm come in, "Logging …" repeats it beside the confirm ("One-Arm Dumbbell Wrist Curl gets 6 sets, one arm at a time."), since on a phone the top line has often scrolled away, and the message after the swap ends with it. The count follows the choice for a typed set: one kept with the original is not handed on. Before an exercise is chosen, a per-arm original is described by its planned sets ("with the same 3 planned sets"), never its rows.
- **Undo** puts back exactly what was there: the original's rows, arms and `perArm` layout, and removes the new exercise, while nothing has been logged or typed on either.

### The recap after Finish, and a workout opened from Progress

- Sets read "30 s", "70 lb × 40 s · Left", "20 lb × 25 s · Both arms", "50 lb × 10 · Right".
- A hold logged with no seconds (before they were required) reads "Seconds not recorded", or "20 lb · seconds not recorded"; never "— lb × —".
- The exercise line adds "Straps used" or "Straps not used" where it was recorded.
- Working sets count holds like any set.
- **Correct a set:** on a hold, the editor asks Weight and Seconds ("Seconds are a whole number, at least 1."), and a hold logged with no seconds is corrected in seconds too; a reps patch on it is refused. The set keeps its arm, id, unit and effort, and the exercise keeps its straps record. Removing a set keeps the other sets' fields.
- An exercise's earlier workouts (between sets, and in the exercise detail: `exerciseHistory` in `sessionRecap.ts`, shown by `ExerciseHistoryList`) show the same lines, through the same `sessionRecap`.
- Whether a set is a hold is read from the set and from its exercise's measure, which every one of these readers takes from the light hold list by default (`MeasureOf` in `sessionRecap.ts`), so the recap, the session detail, Correct a set and the history cannot disagree.

### The account card (About me)

Lifts on catalog rows the account cannot take yet (no reference mapping, as for the forearm rows 401–414) stay in the sync queue and on the device. They are not counted as "waiting to upload"; the card names them apart: "1 lift is kept on this device because its exercise cannot be uploaded to your account yet." The count is re-read when the queue is saved, when another tab writes it, and when the sync's reference map changes (`sports-genome:reference-map`, `useAthleteSync.ts`). The queue itself is unchanged.

## One reading of a hold's prescription

A plan's default prescriptions are the goal's rep ranges ("4 × 3–6"), and the planner pins that text on every entry when it builds a day or a week. Read literally on a hold it would be "3–6 seconds". So every screen reads a plan entry's prescription through one function, `prescriptionOf(saved, index, goal, measure)` in `client/src/lib/workoutPlanner.ts`, beside the goal's defaults (`planBouts.ts` re-exports it):

- **A rep exercise**: the saved text, else the goal's default for its place in the day. Unchanged.
- **A hold, unset**: the goal's set count for its place with a hold's target, "4 × 30 sec" where the goal says "4 × 3–6" (`3 × 30 sec` with no goal). The set count is kept, so the weekly volume map, Today, the week review and the diagnostics, which count sets from the goal's default, count the same sets.
- **A hold carrying any goal's default for any place** (a pinned default, also after the entry moved or the goal changed): read as that default, "<its set count> × 30 sec".
- **Anything the athlete wrote** ("3 × 20–40", "4 × 45 sec", "3 × 40") is kept; a bare number on a hold is seconds.

The stored text is never rewritten: the planner still pins the goal's own text, so a rep exercise put in a hold's place (Plan's replace, or "Also update this day in my plan" after a swap) reads the goal's reps again. The swap's plan line reads the slot for the incoming exercise ("Its sets and reps (4 × 3–6) stay"), which is why the tracker is handed the saved map and resolves it itself.

| Screen | Reads it with the measure from |
|---|---|
| Plan editor rows and the sets & reps editor, the exercise picker's day read-out, print, share, Review's planning and health panels (Home `prescriptionFor` / `dayPrescriptions`) | the light hold list (`catalogMeasureOf`) |
| Train: the prestart counts, the rows, the card's target, swap and add (`DeviceWorkoutTracker`) | the logging policy |
| The planned atlas (`boutsFromPlan`) and the add sheet's "Planned as …" and "moves down a place" lines (`PlanChangeSheet`) | the region's variant |

The three sources are kept equal by `holdCatalogIds.test.ts`.

## Reps logged before an exercise was measured in seconds (a rule the owner can change)

A set on an exercise now measured in seconds that holds reps was logged before the atlas measured that exercise in seconds. **It stays a rep set**, everywhere:

| Reader | That set |
|---|---|
| The live card's last set | "Last set: 70 lb · 40 reps", not carried into Seconds |
| Recap, session detail, an exercise's history | "40 reps", "70 lb · 40 reps" |
| Correct a set | edits its reps (a reps patch is accepted; it is not a hold) |
| Strength record and sync queue | as before the atlas: a rep set |
| The calculator | reps on a segment; never hold seconds |

Its reps are never read as seconds, and nothing converts it. A set with neither reps nor seconds on such an exercise is a hold whose time was not recorded. The rule lives in one place, `isHoldOn` in `client/src/lib/sessionRecap.ts` (and the card's carried-dose line in `DeviceWorkoutTracker.tsx`); if the owner prefers to read such sets as holds, or to ask the athlete, those are the places to change.

## Every reader of reps and load meets holds

| Reader | A hold |
|---|---|
| Strength record (`workoutStrengthObservations`: estimated 1RM, ranks, percentiles, the sync queue) | skipped, and so is a warm-up |
| Volume-load (`setVolume`, `volumeText`) | none: seconds are never multiplied by a load |
| Reps (`totalReps`, `dropSetSummary`) | 0 reps, no NaN |
| Set lines (`performedSetLine`) | "30 s", "70 lb × 30 s", "+20 lb × 30 s" for a weighted bodyweight hang |
| Completed-set counts (recap totals, Progress, Home's record, live progress, finish) | counted as a completed set |
| Drafts (`isDraftSet`) | typed seconds are a draft, so Finish reports a hold typed and not logged |
| Carry-over (`lastCompletedSetFor`, `carriedEntryFor`) | carries the seconds |
| Swap undo (`canUndoSwap`) | typed seconds count as work |
| Corrections (`correctSet`) | edited in seconds, at least 1 and at most 86,400; reps refused |

**Share and print** format the plan's prescription text (`shared/workoutShareFormat.ts`, `client/src/lib/workoutPrint.ts`), not logged sets. They are handed Home's reading (`dayPrescriptions`, `prescriptionFor`), so an unset hold or one carrying a pinned rep default prints and shares as "4 × 30 sec", as Train shows it. `progressiveTraining.ts` reads server set logs from `WorkoutExecutionPanel`, which is never rendered; it was not changed.

## Deliberately not added

- **No warm-up control.** The app logs work sets only. `warmup: true` is read and kept, so that an import or a later control can mark one and the strength record and the calculator leave it out. Nothing in the logger asks for it, and nothing writes it.
- **No arm or straps in the full workout list rows.** Those rows are for fixing numbers. A set logged from there on a one-arm exercise records no arm, which is "unknown", not a guess.
- **No straps per set.** Straps are recorded once per exercise per workout, which is how the brief describes them.
- **No editing of arm or straps in "Correct a set".** The correction edits load and reps (or seconds) and keeps the arm and straps as recorded.
- **No conversion.** Seconds never become reps, sets or volume. Reps logged on an exercise before it was measured in seconds stay reps.
- **No drop sets on holds.**

## Tests

| File | Covers |
|---|---|
| `client/src/lib/specialization/loggingPolicy.test.ts` | the policy per variant, injected regions, fixture regions ignored |
| `client/src/lib/deviceWorkoutLog.atlas.test.ts` | normalizer keeps and validates side, seconds, warm-up and straps; set ids; drafts, finish and carry-over for holds |
| `client/src/lib/holdSetReaders.test.ts` | strength record, volume, reps and lines without NaN; recap and history lines; corrections; entry boxes; swap notes and reuse |
| `client/src/components/DeviceWorkoutTracker.atlas.test.ts` | the light region list mocked (`loggingRegions.ts`): Seconds instead of Reps, Next/Done, carried seconds, no drop set, arm control (only one-arm and either-arm, alternating, recorded), straps (only with `askStraps` and a straps-sensitive mapping), ids, swapping a hold, the saved recap |
| `client/src/components/WorkoutSessionDetail.holds.test.ts` | the detail screen's lines, straps line and correcting a hold in seconds |
| `client/src/components/WorkoutSessionDetail.holdSeconds.test.ts`, `client/src/lib/sessionRecap.holdMeasure.test.ts` | a hold logged without seconds: "Seconds not recorded", corrected in seconds, a reps patch refused; reps logged before read "40 reps"; the light hold list as every reader's default; an exercise's history read the same way |
| `client/src/components/ExerciseHistoryList.holds.test.ts` | the history list on a hold: seconds, "Seconds not recorded", old reps as reps, never "—" |
| `client/src/components/DeviceWorkoutTracker.perArm.test.ts` | per-arm rows under the gate (counts, targets per arm, re-alternation, the logged week equal to the planned week on the real data), the gate itself, the hold default and the seconds requirement |
| `client/src/lib/workoutSwap.perArm.test.ts` | `swapSets`, `applySwap` and `addAfter` with per-arm rows, both directions and one-arm to one-arm, with and without the gate; undo equal to the session before |
| `client/src/components/DeviceWorkoutTracker.swapPerArm.test.ts` | the same in the live tracker: the sheet's count, the line beside the confirm, the toast, the rows and arms built, Undo, the swapped-in week equal to the planned one on the real data, the count following a kept or discarded typed set, a hold swapped in reading its prescription as a hold's |
| `client/src/lib/workoutPlanner.holdPrescription.test.ts` | `prescriptionOf` for every goal, place and measure: the hold default, pinned defaults, the athlete's text, set counts kept; one function for Home, Train and the atlas |
| `client/src/lib/specialization/holdCatalogIds.test.ts` | the light hold list equal to the policy and the variants; it imports nothing |
| `client/src/pages/Home.holdPrescription.test.ts` | Home: the Plan editor rows, the editor's set count and the printed day show a hold's prescription in seconds, and Train starts from the same text |
| `client/src/components/specialization/PlanChangeSheet.holds.test.ts` | the add sheet's "Planned as" and "moves down a place" lines on holds |
| `client/src/components/DeviceWorkoutTracker.prescription.test.ts` | every Training Day surface reads the same prescriptions; the tracker gets the saved map and resolves it through `prescriptionOf` |

The other tracker suites (`DeviceWorkoutTracker.*.test.ts`) run against the real forearm data and pass unchanged: an exercise they log that the atlas does not map behaves as before, and the straps question needs `askStraps`, which they do not pass.

## Phone check

Headless Chromium emulating an iPhone (`isMobile`, `hasTouch`, device scale 3), not a real iPhone or Safari. The build had test variants injected temporarily (Farmer Hold: seconds, either arm, straps-sensitive; Single-Arm Cable Row: one arm; Dead Hang: seconds), and Home passed `askStraps` for the shots; both were reverted before committing.

| Width | Screens checked | Result |
|---|---|---|
| 390 × 844 | live card with Seconds, Arm (Both preselected) and Straps; one-arm row on set 2 (Right preselected after a Left set); session detail with holds, arms and straps; correcting a hold | Arm segments 78 × 44 px, straps pills 63 × 44 and 85 × 44 px, entry inputs 18.4 px, no horizontal overflow |
| 375 × 667 | the same screens | Arm segments 74 × 44 px, no overflow |
| 430 × 932 | the two live cards and the session detail | Arm segments 90 × 44 px, no overflow |

**17 Oct 2026, swap and add with per-arm rows, and the hold's prescription.** Same emulation, on the production build with the real forearm data and nothing injected: the gate was on because the seeded device had an active forearm target. Script: `design/specialization/forearm/render-logger.mjs` (after `npx vite build`). Screenshots at 390 and 375 and the measurements at all three widths: `evidence/logger-fixes-2026-10-17/` (`logger-checks.json`).

| Width | Screens checked | Result |
|---|---|---|
| 390 × 844 | Plan editor with Dead Hang unset, Hammer Curl unset and Farmer's Walk pinned "3 × 6–10" (Athleticism); Dead Hang's sets & reps editor open; Train: Hammer Curl swapped for One-Arm Dumbbell Wrist Curl (the sheet after the choice, the card after, the full workout rows); One-Arm Dumbbell Wrist Curl (6 rows) swapped for Wrist Curl | rows "4 × 30 sec", "4 × 3–6", "3 × 30 sec"; editor stepper 4, target "30 sec" in a 16 px, 44 px box; the sheet's line "… takes its place with the same 3 planned sets, done once with each arm: 6 sets." on screen with the choice; card "Set 1 of 6", Right preselected, arm segments 78 × 44 px; rows "Set 1 · Right" … "Set 6 · Left"; the other way "… the same 3 planned sets, not one per arm." and "Set 1 of 3"; confirm 48 px tall; no horizontal overflow |
| 375 × 667 | the same | the same text; arm segments 74 × 44 px; no overflow |
| 320 × 568 | the same | the same text; arm segments 56 × 44 px; no overflow |
