# Specialization atlas: the workout logger (16 Oct 2026)

What the workout logger now asks and stores for the atlas (`02-design.md` §6), where the athlete sees it, and what was left out on purpose. The brief's rule for this part: keep it "out of the workout logger until relevant; avoid making every set entry a questionnaire."

Updated 20 Oct 2026 for several regions (`10-multi-region.md` §2.1, §6.4; wave 0, lane 0c): the logger reads one generated table instead of every region's variants and mappings, a set can record the leg's side in a field of its own, the straps question and rows per side are gated per exercise by the regions the athlete has targets in, and stored sets keep fields this code does not know. The forearm is still the only production region, so nothing an athlete sees changes; see "Several regions (20 Oct 2026)" below.

> **21 Oct 2026, both sides as one.** `main` (d8d95f4, owner, 20 Oct: "there's no reason for a left and right arm") stopped asking the arm and laying a one-arm set out per arm; the merge of `main` into wave 0 holds the same for every limb (`10-multi-region.md`, appendix "Both sides as one"). The logger asks no side, of an arm or a leg, and builds one row per planned set for every athlete, so the logged week equals the planned week; the gates are straps only. Removed: the set card's side control and its words, `defaultSideFor`, `chooseSide`, `withSideFrom`, `sideQuestionLabel`, the policy's `oneSide` and `sideAnchor`, the rows per side a plan, a swap or an add built, and the gates' `perSideRows`. Kept: a set's `side` and `legSide` and an exercise's `perArm`, read, shown and logged as stored, for the rows a workout left open from before 20 Oct holds; the policy's `askSide` and `oneArm` (always false) and `sideLimb`; the logging table's columns. Where this note describes the arm or leg question or rows per side, it describes the logger before 20 Oct.

## One rule: ask only where the atlas says it matters

`loggingPolicyFor(catalogId)` in `shared/specialization/loggingPolicy.ts` reads the exercise's row of the logging table (`shared/specialization/loggingTable.generated.ts`, below) and returns:

| Field | Meaning | Comes from |
|---|---|---|
| `measure` | `"reps"` or `"seconds"` | the variant's `measure` |
| `askSide` | ask which side | laterality on the `sidedBy` limb `unilateral` or `either`, and a production region paired by that limb maps it |
| `sideLimb` | the limb asked and stored: `arm` (the set's `side`) or `leg` (`legSide`); none where no side is recorded | the variant's `sidedBy` |
| `sideAnchor` | on the leg, which leg a side names | the variant's `sideAnchor` |
| `oneSide` (alias `oneArm`) | one side at a time by definition: a planned set is done once with each side | laterality `unilateral` on the `sidedBy` limb |
| `sideDefault` | the side shown before any set is logged | `both` for `either`, nothing for `unilateral` |
| `strapsSensitive`, `strapsBy` | straps change what the set earns, and in which regions | the production regions with a non-rejected mapping of the variant with `requiresNoStraps` |
| `mappedBy` | the production regions that map the exercise | non-rejected mappings |

An exercise no production region maps gets the default policy (reps, no side, no straps), which is the logger exactly as it was. Fixture regions (the test-only deltoid) are never read. The table is injectable, so tests supply their own; in production it is written from the forearm's variants and mappings (05-mappings.md). For the forearm every field the policy had before gives what it gave at 6738eeb, for every catalog exercise (`loggingTable.test.ts`).

### The logging table

`npx tsx scripts/specialization/emit-logging-table.ts` writes `loggingTable.generated.ts` from the registry and the variant library (`variantFor`): one row per catalog exercise a production region maps, with its measure, `laterality`, `legLaterality`, `sidedBy`, `sideAnchor`, `sideCounted` (a production region paired by the `sidedBy` limb maps it), `strapsBy` and `mappedBy`. A rejected mapping maps nothing. The emitter refuses a mapping of a variant that is not the current one for its exercise, and a variant sided by the leg with no side anchor. `--check` exits 1 when either generated file is stale, and `client/src/lib/specialization/loggingTable.test.ts` regenerates both in memory and fails on any difference. The table replaced `loggingRegions.ts` and `regions/forearm/logging.ts` (each region's variants and mappings, which the tracker used to load whole); no region has a logging file of its own now, and the light-import test walks every region folder to keep it so.

The screens that load with the app's first screen (Home's Plan editor, picker, print and share; the recap, the session detail and an exercise's history through `sessionRecap.ts`) need one fact from the atlas, whether an exercise is measured in seconds. They read it from `shared/specialization/holdCatalogIds.ts`, the catalog ids the atlas measures in seconds (142 Plate Pinch, 143 Dead Hang, 144 Towel Dead Hang, 145 Farmer Hold, 299 Farmer's Walk, 300 Zercher Carry, 400 Battle Rope Alternating Waves, 403 Gripper Hold, 409 Suitcase Carry), which imports nothing. The same emitter writes it from the same rows: exactly the exercises a production region maps with a variant measured in seconds, the forearm's nine in wave 0. `holdCatalogIds.test.ts` holds it to the policy and the variants as well.

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

Measured again at `1cb619a` (18 Oct, `npx vite build`, raw and gzip -9): `App` 893,916 (226,927), `DeviceWorkoutTracker` 55,880 (17,345), `mappings` 43,740 (10,759), `WorkoutSessionDetail` 8,066 (2,842), `SpecializationPanel` 351,217 (100,170). At the release head `c2b98e2`: `App` 893,916 (226,608), `DeviceWorkoutTracker` 55,880 (17,263), `mappings` 43,740 (10,767), `WorkoutSessionDetail` 8,066 (2,876), `SpecializationPanel` 361,507 (103,354) (the final review's page fixes: Progress's bests and protocol marks, the week and Not-counted lists). The drawing's paths are in `SpecializationPanel` and in no other chunk; there is no separate `registry` chunk.

## What is stored

All fields are optional, and every screen reads them through the normalizers in `deviceWorkoutLog.ts`. `normalizeSet` validates the set fields it knows (a value it does not accept is dropped, never read as a value) and, since 20 Oct, keeps what it does not understand exactly as stored (`unknownSetFields`): every field it does not know, a drop stage's field it does not know, and a set type a later release adds (a name other than `standard` and `drop`) with its stages. Every save rewrites the whole history through it, so what a later release adds survives a save by this one; before 20 Oct it was dropped on the next save. Logging a set on the card keeps the same fields, so a row a later release wrote (a second tab on a newer deploy, or a rollback to the previous wave's, `10-multi-region.md` §9.4) keeps them when this release logs it. Every reader asks `type === "drop"`, so a set of a later type reads as the standard set its weight and reps give; tapping Drop set on it starts a drop set with no stages, never with that type's. The exercise normalizer validates `straps` only (anything but `yes` or `no` is dropped); other exercise fields, `perArm` among them, are kept as stored.

| Field | On | Values kept | Written when |
|---|---|---|---|
| `side` | set | `left`, `right`, `both` | a set is logged on an exercise that asks the arm, with the arm shown selected; a row laid out per arm has it from the start |
| `legSide` | set | `left`, `right`, `both` | the same for the leg, named by the exercise's side anchor; never written to `side` |
| `holdSeconds` | set | whole seconds as digits (`"30"`); a whole number is read as its digits, leading zeros dropped; text, negatives and fractions dropped | a set is logged on a hold with seconds typed |
| `warmup` | set | `true` only | never by the logger (see below) |
| `straps` | exercise | `yes`, `no` | the athlete taps Used or Not used |
| `perArm` | exercise | `true` as written; kept as stored, not validated, and read as on or off | the tracker builds a one-side exercise's rows per side (on its arm or its leg) under the per-side rows gate, at the start or by a swap or add (below); the name is the one stored since 17 Oct |
| `id` | set | any non-empty string | every new set, at creation |

- **A hold** is a set with `holdSeconds` and empty `reps`. `isHoldSet()` and `holdSecondsOf()` (never NaN) are what readers use.
- **Set ids.** Every new set gets an id when it is created: a new workout (`makeSession`), an exercise added after another (`addAfter`) and a swapped-in exercise (`applySwap`), all through `newSetId()`. Logging a set keeps its id. Sets are still addressed by position, as before. History logged before ids keeps none: nothing is migrated.
- **Straps unanswered** is "not recorded", which the calculator treats differently from "no" (`02-design.md` §3).

## Where the athlete sees it

### The live set card (Train → Workout)

- **Holds.** A hold has its load box (for a bodyweight hang, the optional "Added weight") and then **Seconds**, in place of Reps. The target reads "40 sec". The last set reads "Last set: 40 sec" or "Last set: 70 lb · 40 sec", and its seconds are carried into the box as an offer, marked the same way as carried reps. Next moves from the load to Seconds; Done on Seconds logs the set. The set is stored with `holdSeconds` and no reps. The "Standard / Drop set" choice is not shown: a hold has no reps to drop. A set of that exercise logged in reps before it was measured in seconds is shown as reps ("70 lb · 40 reps") and is never read as seconds (see "Reps logged before an exercise was measured in seconds").
- **A hold needs its seconds.** Log set stays off until whole seconds of at least 1 are in, and the card says why in place: "Add the seconds", or "Add the seconds: at least 1" after a 0, linked to the button by `aria-describedby`. Done on the keyboard logs nothing until then; seconds carried from the last set count. The full workout list's row does the same. The disabled button is drawn at full strength (no faded control), and the list's boxes are 16 px so iOS does not zoom.
- **The hold's target** is the plan's prescription read by `prescriptionOf` (see "One reading of a hold's prescription"): an unset hold, or one carrying the goal's pinned rep default, reads "4 × 30 sec" with the goal's set count, so the card says "30 sec", never "3–6 sec". A bare number the athlete wrote on a hold ("3 × 40") is seconds.
- **Arm.** On a one-arm or either-arm exercise, a row "Arm · Left · Right · Both" sits above the entry boxes: four columns, every segment outlined at rest, the chosen one filled, each 44 px tall and at least 44 px wide. Two-handed and unmapped exercises never show it. On an exercise sided by the leg the row names the leg its side anchor names, "Front leg · Left · Right · Both" (see "Several regions").
  - It starts on the arm that comes next: after a Left set it offers Right, after a Right set Left, after a Both set Both.
  - Before any set is logged on that exercise, an either-arm exercise starts on Both and a one-arm exercise starts with nothing chosen.
  - The arm shown when the set is logged is the arm recorded, so a set done as offered needs no tap. A one-arm set logged with no arm chosen records none: the side stays unknown and is never guessed.
- **Per-arm rows (the per-side rows gate).** For an athlete with an active target in a region that maps the exercise (`loggerGatesFor`, below; before 20 Oct, any active target), a planned set of a one-arm exercise (`oneArm`, laterality `unilateral`) is two rows, Right then Left, each with its arm preset: "3 × 12" is 6 rows, the prestart line reads "3 × 12 · each arm" and "6 sets", and a per-set target "3 × 10/8/6" reads 10, 10, 8, 8, 6, 6. That is how the atlas counts the plan (a one-arm set count is per arm, `planBouts.ts`), so the plan logged as built gives each arm exactly the planned bouts. Picking the other arm on a row re-alternates the rows still to do; Both changes only its own row. Either-arm and two-handed exercises are never split, and without the gate every workout is built as before, one row per planned set.
- **Straps.** "Straps · Used / Not used" appears below the effort toggle, only on an exercise whose grip mapping a strapped set does not earn **and** only for an athlete with an active target in a region that has such a mapping of it (`loggerGatesFor`, below; before 20 Oct, any active target). It is two outlined 44 px pills, asked once per exercise. Tapping the chosen one again takes it back to "not recorded".
- **Logged-sets list** (under the card): "70 lb × 40 s · Left".
- **Full workout list:** a hold's rows take Seconds where other rows take Reps, and offer no drop set. A logged set's row header names its arm ("Set 1 · Left").

### Swap and add in the middle of a workout

- The sheet says how the new exercise is logged when that differs: "Dead Hang is logged in seconds held, not reps." or "Pull-Up is logged in reps, not seconds.".
- It drops the "set the reps as you go" note when the new exercise is a hold.
- A set typed but not logged can be reused only between two exercises measured the same way: "Use the seconds for Farmer Hold" between holds, "Use the reps for …" between rep exercises.
- Between a hold and a rep exercise that choice is not offered and nothing is carried. Seconds never become reps, and reps never become seconds.
- **A hold swapped or added in** starts from the prescription it takes over, read by its own measure (`prescriptionOf`): the goal's rep default pinned on the plan entry becomes a hold's ("4 × 3–6" → "4 × 30 sec"), and the sheet says so: "The plan's 4 × 3–6 is the goal's rep default, so Dead Hang starts from a hold's: 4 × 30 sec." Text the athlete wrote is kept, with a note where a bare number will read as seconds: "The plan's target (3 × 12) gives no unit; on Dead Hang its numbers are seconds."
- **A rep exercise swapped or added in place of a hold** reads the plan entry again, never the hold's "30 sec" as a rep target. Where the hold still holds what its plan entry gave it (its own entry in the day open in the plan, or, for a hold that was itself swapped in, the entry it replaced), the tracker's `incomingFor` reads that entry's saved text with the incoming exercise's measure, as the sheet's plan line does: a hang on the goal's "4 × 3–6" (or unset) reads "4 × 30 sec", and a Wrist Curl in its place starts from "4 × 3–6". The sheet says so ("4 × 30 sec is Dead Hang's default as a hold, so Wrist Curl starts from the goal's: 4 × 3–6.") beside "Its sets and reps (4 × 3–6) stay.", and says nothing about a time. A time the athlete wrote on the hold ("3 × 45 sec") is kept, with "The plan's target (3 × 45 sec) is a time; sets here are logged in reps, so set the reps as you go." A workout from a day other than the one open in the plan is not read against that plan.
- **Adding** names what the new exercise starts from when its own measure reads the anchor's prescription differently, since the add sheet has no "Logging …" list: "Wrist Curl goes in straight after Dead Hang, starting from 4 × 3–6. Nothing logged changes." / "Dead Hang goes in straight after Hammer Curl, starting from 4 × 30 sec.", and the message after it ends the same way.
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

### Several regions (20 Oct 2026)

Wave 0 of `10-multi-region.md` readies the logger for regions paired by the leg and for the midline core. The forearm stays the only production region, so for an athlete every screen is as it was; the leg path is proved on fixture tables.

- **The leg's side is its own field.** `side` stays the arm's, as stored since 16 Oct; `legSide` holds the leg's, read, validated and written the same way (`deviceWorkoutLog.ts`), read by the summary's source revision (`revision.ts`), and copied with `side` when a swap hands rows on (`workoutSwap.ts`). A reader that drops `legSide` leaves the set with no leg side, which is never counted: the readers as shipped on 18 Oct (copied from 6738eeb into `client/src/lib/__fixtures__/workoutLogReaders.6738eeb.ts`) drop it on their next save and read the set's arm side, or none, never the leg's (`deviceWorkoutLog.legSide.test.ts`).
- **The question names the limb.** The arm keeps "Arm · Left · Right · Both". On the leg the label is the leg the variant's side anchor names, in the words of `variants/dimensions.ts`: "Working leg", "Front leg", "Standing leg", "Top leg", "Bottom leg" ("Front leg · Left · Right · Both"), and the group's label follows ("Front leg for set 2 of Bulgarian Split Squat"). The defaults and the alternation are the arm's (after Left, Right; `either` starts on Both). Logged sets read "· Left", "· Right" or "· Both legs". A variant sided by neither limb, or one no region paired by its limb maps (a side plank mapped only by the core), asks nothing.
- **Gates per exercise.** `loggerGatesFor(goals)` in `client/src/lib/specialization/loggerGates.ts` takes the regions of the athlete's active goals; for each exercise, from its policy, it gives the straps question only when one of those regions is in `strapsBy`, and rows per side only for a `oneSide` exercise when one of them is in `mappedBy`, a paired region or the midline core alike, so the plan logged as built is the plan on every page (`planBouts` splits a planned one-side set the same way). Home builds the gates from the goals and passes them to the tracker (`loggerGates`); the module reads no atlas data, so the first screen does not load the table. A calf target no longer turns on straps for a deadlift.
- **Rows per side on the leg.** A planned set of a one-leg exercise is a Right and a Left row with `legSide` preset; rows carry their side even where the question is not shown (a side plank under a core target), and logging a row records it. The prestart line and the full workout list say "3 × 10 · each leg"; the swap sheet, the line beside its confirm and the messages say "done once with each leg", "one leg at a time", "not one per leg". Rows handed from one limb's exercise to the other's keep their order, Right then Left, on the new limb.
- **Rows say their own limb.** A workout left open across a release can hold rows a later release built per leg on an exercise this one does not know (173 in wave 0), or on one it sides by the other limb (188 once it is sided by the leg). Rows laid out per side are built with a side on their limb, every one, so `rowsLimbOf` in `workoutSwap.ts` reads the limb from the rows (the one more of them hold a side on) before the logging policy: the full workout list says "1 × 10 · each leg" and "Set 1 · Right", the swap sheet "not one per leg", and a swap to a one-arm exercise laid out per arm gives it Right and Left on the arm and no leg side. The card's question, and the side a pick writes, stay the policy's.
- **The side question itself is not gated** (`10-multi-region.md` §11, decision 3): it is asked of every athlete, as the forearm's arm is today.
- **Holds** are still the variants a production region maps with `measure: "seconds"`: the forearm's nine.

**What each screen downloads** (`npx vite build --outDir <scratch>`, 7444849 against this lane's head, raw bytes, gzip -9 in brackets):

| Chunk | Before | After | |
|---|---|---|---|
| `App` (first screen) | 894,301 (226,958) | 894,744 (227,138) | +443: the gates (no table) and `normalizeSet`'s list of known fields |
| `index`, `framework` | 139,512, 199,630 | the same | |
| `DeviceWorkoutTracker` (Train) | 55,880 (17,349) + `variants` 46,843 (11,888) | 70,565 (18,521), no `variants` | the table instead of the regions' variants and mappings: opening Train downloads 32,158 B raw (10,716 gzip) less |
| `SpecializationPanel` (the page) | 373,954 (107,925) + `variants` 46,843 (11,888) | 420,844 (118,175) | the `variants` chunk, now used by the page alone, is folded into it: the page's download is 47 B larger in all |
| `WorkoutSessionDetail` | 8,066 | 8,066 | |

A gate on the page's size should count the page chunk with the chunks it loads: the page chunk alone grew by the chunk it absorbed.

**Phone check** (headless Chromium emulating an iPhone: viewport, `isMobile`, `hasTouch`, device scale 3; not an iPhone, not Safari). The production builds of 7444849 and of this lane, the device seeded with a plan of 46 Dumbbell Row (one arm at a time, a grip a strapped set does not earn) and Pendulum Squat, with and without an active forearm target, on Train. At 390 × 844 and 375 × 667 the live set card is the same byte for byte in both builds (its screenshot and its markup): with the target, "Set 1 of 6", "Arm · Left · Right · Both" with Right preselected (segments 78 × 44 px at 390, 74 × 44 at 375) and "Straps · Used / Not used" (64 × 44 and 87 × 44 px); without it, "Set 1 of 3", the arm row with nothing chosen and no straps question; entry inputs 18.4 px, no horizontal overflow. A build with leg rows injected for 173 and 188 showed the longest label, "Standing leg", squeezing the segments to 34 px at 320; each segment now keeps at least 2.75rem and the label wraps onto two lines (44 px at 320, 52 at 375, 56 at 390). The arm's row is unchanged by it. Each wave that adds a leg variant screenshots the set cards for 173 Bulgarian Split Squat and 217 Copenhagen Plank at 375 and 390 (`10-multi-region.md` §6.4).

## The recap after Finish, and a workout opened from Progress

- Sets read "30 s", "70 lb × 40 s · Left", "20 lb × 25 s · Both arms", "50 lb × 10 · Right"; a set of a leg-sided exercise reads its `legSide` as the live set card does, "40 kg × 8 · Left", "· Both legs" (`setSideLabel` in `sessionRecap.ts`, which the card's words share; `sessionRecap.legSide.test.ts`; added in the release review, latent until wave D maps a leg variant).
- A hold logged with no seconds (before they were required) reads "Seconds not recorded", or "20 lb · seconds not recorded"; never "— lb × —".
- The exercise line adds "Straps used" or "Straps not used" where it was recorded.
- Working sets count holds like any set.
- **Correct a set:** on a hold, the editor asks Weight and Seconds ("Seconds are a whole number, at least 1."), and a hold logged with no seconds is corrected in seconds too; a reps patch on it is refused. The set keeps its arm, id, unit and effort, and the exercise keeps its straps record. Removing a set keeps the other sets' fields.
- An exercise's earlier workouts (between sets, and in the exercise detail: `exerciseHistory` in `sessionRecap.ts`, shown by `ExerciseHistoryList`) show the same lines, through the same `sessionRecap`.
- Whether a set is a hold is read from the set and from its exercise's measure, which every one of these readers takes from the light hold list by default (`MeasureOf` in `sessionRecap.ts`), so the recap, the session detail, Correct a set and the history cannot disagree.

### The account card (About me)

Lifts on catalog rows the account cannot take yet (no reference mapping, as for the forearm rows 401–416) stay in the sync queue and on the device. They are not counted as "waiting to upload"; the card names them apart: "1 lift is kept on this device because its exercise cannot be uploaded to your account yet." The count is re-read when the queue is saved, when another tab writes it, and when the sync's reference map changes (`sports-genome:reference-map`, `useAthleteSync.ts`). The queue itself is unchanged.

## One reading of a hold's prescription

A plan's default prescriptions are the goal's rep ranges ("4 × 3–6"), and the planner pins that text on every entry when it builds a day or a week. Read literally on a hold it would be "3–6 seconds". So every screen reads a plan entry's prescription through one function, `prescriptionOf(saved, index, goal, measure)` in `client/src/lib/workoutPlanner.ts`, beside the goal's defaults (`planBouts.ts` re-exports it):

- **A rep exercise**: the saved text, else the goal's default for its place in the day. Unchanged.
- **A hold, unset**: the goal's set count for its place with a hold's target, "4 × 30 sec" where the goal says "4 × 3–6" (`3 × 30 sec` with no goal). The set count is kept, so the weekly volume map, Today, the week review and the diagnostics, which count sets from the goal's default, count the same sets.
- **A hold carrying any goal's default for any place** (a pinned default, also after the entry moved or the goal changed): read as that default, "<its set count> × 30 sec".
- **Anything the athlete wrote** ("3 × 20–40", "4 × 45 sec", "3 × 40") is kept; a bare number on a hold is seconds.

The stored text is never rewritten: the planner still pins the goal's own text, so a rep exercise put in a hold's place (Plan's replace, or "Also update this day in my plan" after a swap) reads the goal's reps again. The swap's plan line reads the slot for the incoming exercise ("Its sets and reps (4 × 3–6) stay"), and so does the prescription a swapped-in or added exercise starts from (a rep exercise in a hold's place starts from "4 × 3–6", not "4 × 30 sec"), which is why the tracker is handed the saved map and resolves it itself.

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

### A workout left open across the release

A workout started before this release and resumed after it keeps what it was built with: on a hold, the goal's rep default pinned as its prescription ("3 × 6–10"), and any reps typed into a hold set. The tracker reads that workout the way it builds a new one, without rewriting anything stored: the card and the full list read the prescription through the same `prescriptionOf`, so a pinned goal default on a hold reads "3 × 30 sec" and athlete text stays as typed; and on an exercise measured in seconds, reps typed into a set that was not logged do not make it a draft (there is no Reps box to show them in, so "typed, not logged" never appears over empty boxes). Sets logged in reps stay rep sets, as above. Test: `DeviceWorkoutTracker.atlas.test.ts` › A workout left open across the release.

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
| `client/src/lib/specialization/loggingPolicy.test.ts` | the policy per row of a fixture table: no side asked and no planned set split, of an arm or a leg, the limb and the side a set would start on still read from the variant, straps; no side question to label; the forearm's exercises from the generated table |
| `client/src/lib/specialization/loggingTable.test.ts` | both generated files equal to the emitter's output and to the registry; every catalog exercise's policy equal to the policy as shipped at 6738eeb; the emitter on fixture regions (body order, paired and midline, rejected mappings, fixture regions ignored, a missing anchor and a replaced variant refused); the logger's modules importing nothing heavy, every region folder walked |
| `client/src/lib/specialization/loggerGates.test.ts` | straps exactly as before for an athlete with forearm targets and one without (ended and future goals included), and no row per side for anyone; per-exercise straps gating across several regions on a fixture table, nothing gated about sides |
| `client/src/lib/deviceWorkoutLog.legSide.test.ts` | `legSide` and unknown set fields through this release's readers, and through the readers as shipped (no leg side read as an arm side); a drop stage's unknown fields and a later set type with its stages kept; the source revision |
| `client/src/lib/workoutSwap.legSide.test.ts` | rows per leg swapped and added: sides copied together, moved across limbs; the rows' own limb read before the policy (173 unknown in wave 0, 188 sided the other way, an arm side picked on a leg row) |
| `client/src/components/DeviceWorkoutTracker.laterRelease.test.ts` | a workout left open across a release, on the real wave-0 table: logging a row keeps a later release's fields and set type; Drop set on such a set starts with no stages; rows per leg on 173 show their legs, are logged on the leg, are named one-leg sets in the swap sheet, and swapped to 46 give one row per planned set with no side and no arm asked |
| `client/src/components/DeviceWorkoutTracker.legSide.test.ts` | on a fixture table where a thigh and a core map the exercises: no leg asked of a one-leg, an either-leg or a one-sided hold exercise, and no side stored; one row per planned set whatever the athlete's targets; a swap and an add with `main`'s words, one row each |
| `client/src/lib/deviceWorkoutLog.atlas.test.ts` | normalizer keeps and validates side, seconds, warm-up and straps; set ids; drafts, finish and carry-over for holds |
| `client/src/lib/holdSetReaders.test.ts` | strength record, volume, reps and lines without NaN; recap and history lines; corrections; entry boxes; swap notes and reuse |
| `client/src/components/DeviceWorkoutTracker.atlas.test.ts` | the logging table mocked: Seconds instead of Reps, Next/Done, carried seconds, no drop set, arm control (only one-arm and either-arm, alternating, recorded), straps (only with a forearm target and a straps-sensitive mapping), ids, swapping a hold, the saved recap |
| `client/src/components/WorkoutSessionDetail.holds.test.ts` | the detail screen's lines, straps line and correcting a hold in seconds |
| `client/src/components/WorkoutSessionDetail.holdSeconds.test.ts`, `client/src/lib/sessionRecap.holdMeasure.test.ts` | a hold logged without seconds: "Seconds not recorded", corrected in seconds, a reps patch refused; reps logged before read "40 reps"; the light hold list as every reader's default; an exercise's history read the same way |
| `client/src/components/ExerciseHistoryList.holds.test.ts` | the history list on a hold: seconds, "Seconds not recorded", old reps as reps, never "—" |
| `client/src/components/DeviceWorkoutTracker.perArm.test.ts` | per-arm rows under the gate (counts, targets per arm, re-alternation, the logged week equal to the planned week on the real data), the gate itself, the hold default and the seconds requirement |
| `client/src/lib/workoutSwap.perArm.test.ts` | `swapSets`, `applySwap` and `addAfter` with per-arm rows, both directions and one-arm to one-arm, with and without the gate; undo equal to the session before; the sheet's notes on a hold's default, each way round |
| `client/src/components/DeviceWorkoutTracker.swapPerArm.test.ts` | the same in the live tracker: the sheet's count, the line beside the confirm, the toast, the rows and arms built, Undo, the swapped-in week equal to the planned one on the real data, the count following a kept or discarded typed set, a hold swapped in reading its prescription as a hold's, a rep exercise swapped or added in place of a hold (pinned, unset, itself swapped in) starting from the plan's reps, a written time kept, another day's plan not read |
| `client/src/lib/workoutPlanner.holdPrescription.test.ts` | `prescriptionOf` for every goal, place and measure: the hold default, pinned defaults, the athlete's text, set counts kept; one function for Home, Train and the atlas |
| `client/src/lib/specialization/holdCatalogIds.test.ts` | the light hold list equal to the policy, the table and the variants; the forearm's nine |
| `client/src/pages/Home.holdPrescription.test.ts` | Home: the Plan editor rows, the editor's set count and the printed day show a hold's prescription in seconds, and Train starts from the same text |
| `client/src/components/specialization/PlanChangeSheet.holds.test.ts` | the add sheet's "Planned as" and "moves down a place" lines on holds |
| `client/src/components/DeviceWorkoutTracker.prescription.test.ts` | every Training Day surface reads the same prescriptions; the tracker gets the saved map and resolves it through `prescriptionOf` |

The other tracker suites (`DeviceWorkoutTracker.*.test.ts`) run against the real forearm data and pass unchanged: an exercise they log that the atlas does not map behaves as before, and the straps question needs gates, which they do not pass. The per-arm suites pass gates for a forearm target (`loggerGatesForRegions(["forearm"])`) where they passed `perArmSets` before.

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
| 390, 375 and 320 (review) | Dead Hang on the goal's pinned "4 × 3–6" ("Set 1 of 4 · 30 sec") swapped for Wrist Curl; Wrist Curl added after the hang | the sheet's notes "Wrist Curl is logged in reps, not seconds." and "4 × 30 sec is Dead Hang's default as a hold, so Wrist Curl starts from the goal's: 4 × 3–6." above the plan line "… Its sets and reps (4 × 3–6) stay.", no time note; card after "Set 1 of 4 · 3–6 reps"; add sheet "Wrist Curl goes in straight after Dead Hang, starting from 4 × 3–6. Nothing logged changes."; no horizontal overflow (`swap-*-hold-to-reps-*.png`, `add-*-reps-after-hold-sheet.png`) |
