# Specialization atlas: the workout logger (16 Oct 2026)

What the workout logger now asks and stores for the atlas (`02-design.md` §6), where the athlete sees it, and what was left out on purpose. The brief's rule for this part: keep it "out of the workout logger until relevant; avoid making every set entry a questionnaire."

## One rule: ask only where the atlas says it matters

`loggingPolicyFor(catalogId)` in `shared/specialization/loggingPolicy.ts` reads the variants and mappings of every production region in the registry and returns, for one catalog exercise:

| Field | Meaning | Comes from |
|---|---|---|
| `measure` | `"reps"` or `"seconds"` | the variant's `measure` |
| `askSide` | ask which arm | variant laterality `unilateral` or `either` |
| `sideDefault` | the arm shown before any set is logged | `both` for `either`, nothing for `unilateral` |
| `strapsSensitive` | straps change what the set earns | any non-rejected mapping of that variant with `requiresNoStraps` |

An exercise the atlas does not map gets the default policy (reps, no arm, no straps), which is the logger exactly as it was. Fixture regions (the test-only deltoid) are never read. Variants and mappings are injectable, so tests supply their own; in production they are the forearm's reviewed variants and mappings (05-mappings.md).

Only the two screens that need the policy import it: the live tracker (`DeviceWorkoutTracker.tsx`) and the swap sheet (`ExerciseSwapSheet.tsx`), both loaded lazily. `setEntryFields.ts` and `workoutSwap.ts` take the measure as an argument instead of importing the atlas, because they load with the app's first screens (through `sessionRecap.ts`), and the atlas's region data should load only with the screens that use it. In a production build the policy and the region data land in the tracker's chunk only.

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

- **Holds.** A hold has its load box (for a bodyweight hang, the optional "Added weight") and then **Seconds**, in place of Reps. The target reads "40 sec". The last set reads "Last set: 40 sec" or "Last set: 70 lb · 40 sec", and its seconds are carried into the box as an offer, marked the same way as carried reps. Next moves from the load to Seconds; Done on Seconds logs the set. The set is stored with `holdSeconds` and no reps. The "Standard / Drop set" choice is not shown: a hold has no reps to drop. A set of that exercise logged in reps before it was measured in seconds is shown as reps ("70 lb · 40 reps") and is never read as seconds.
- **Arm.** On a one-arm or either-arm exercise, a row "Arm · Left · Right · Both" sits above the entry boxes: four columns, every segment outlined at rest, the chosen one filled, each 44 px tall. Two-handed and unmapped exercises never show it.
  - It starts on the arm that comes next: after a Left set it offers Right, after a Right set Left, after a Both set Both.
  - Before any set is logged on that exercise, an either-arm exercise starts on Both and a one-arm exercise starts with nothing chosen.
  - The arm shown when the set is logged is the arm recorded, so a set done as offered needs no tap. A one-arm set logged with no arm chosen records none: the side stays unknown and is never guessed.
- **Straps.** "Straps · Used / Not used" appears below the effort toggle, only on an exercise whose grip mapping a strapped set does not earn **and** only when the tracker's `askStraps` prop is true. Home passes it once the athlete has a forearm goal; that wiring is the page lane's. It is two outlined 44 px pills, asked once per exercise. Tapping the chosen one again takes it back to "not recorded".
- **Logged-sets list** (under the card): "70 lb × 40 s · Left".
- **Full workout list:** a hold's rows take Seconds where other rows take Reps, and offer no drop set. A logged set's row header names its arm ("Set 1 · Left").

### The swap sheet

- It says how the new exercise is logged when that differs: "Dead Hang is logged in seconds held, not reps." or "Pull-Up is logged in reps, not seconds.".
- It drops the "set the reps as you go" note when the new exercise is a hold.
- A set typed but not logged can be reused only between two exercises measured the same way: "Use the seconds for Farmer Hold" between holds, "Use the reps for …" between rep exercises.
- Between a hold and a rep exercise that choice is not offered and nothing is carried. Seconds never become reps, and reps never become seconds.

### The recap after Finish, and a workout opened from Progress

- Sets read "30 s", "70 lb × 40 s · Left", "20 lb × 25 s · Both arms", "50 lb × 10 · Right".
- The exercise line adds "Straps used" or "Straps not used" where it was recorded.
- Working sets count holds like any set.
- **Correct a set:** on a hold, the editor asks Weight and Seconds ("Seconds are a whole number, at least 1."). The set keeps its arm, id, unit and effort, and the exercise keeps its straps record. Removing a set keeps the other sets' fields.
- An exercise's earlier workouts (between sets, and from Progress) show the same lines.

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

**Share and print** format the plan's prescription text (`shared/workoutShareFormat.ts`, `client/src/lib/workoutPrint.ts`), not logged sets. A "3 × 30 s" target already prints as a time, so nothing there changed. `progressiveTraining.ts` reads server set logs from `WorkoutExecutionPanel`, which is never rendered; it was not changed.

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
| `client/src/components/DeviceWorkoutTracker.atlas.test.ts` | registry mocked: Seconds instead of Reps, Next/Done, carried seconds, no drop set, arm control (only one-arm and either-arm, alternating, recorded), straps (only with `askStraps` and a straps-sensitive mapping), ids, swapping a hold, the saved recap |
| `client/src/components/WorkoutSessionDetail.holds.test.ts` | the detail screen's lines, straps line and correcting a hold in seconds |

The other tracker suites (`DeviceWorkoutTracker.*.test.ts`) run against the real forearm data and pass unchanged: an exercise they log that the atlas does not map behaves as before, and the straps question needs `askStraps`, which they do not pass.

## Phone check

Headless Chromium emulating an iPhone (`isMobile`, `hasTouch`, device scale 3), not a real iPhone or Safari. The build had test variants injected temporarily (Farmer Hold: seconds, either arm, straps-sensitive; Single-Arm Cable Row: one arm; Dead Hang: seconds), and Home passed `askStraps` for the shots; both were reverted before committing.

| Width | Screens checked | Result |
|---|---|---|
| 390 × 844 | live card with Seconds, Arm (Both preselected) and Straps; one-arm row on set 2 (Right preselected after a Left set); session detail with holds, arms and straps; correcting a hold | Arm segments 78 × 44 px, straps pills 63 × 44 and 85 × 44 px, entry inputs 18.4 px, no horizontal overflow |
| 375 × 667 | the same screens | Arm segments 74 × 44 px, no overflow |
| 430 × 932 | the two live cards and the session detail | Arm segments 90 × 44 px, no overflow |
