# Swap an exercise mid-workout, and drop sets (Oct 6 brief §3–§5)

The owner's two examples, as built:
- **Swap.** During a workout, Sissy Squat is replaced with the barbell squat and tracking carries on. The catalog calls it **Back Squat**; "barbell squat" now finds it first.
- **Drop set.** 5 reps at 100 lb, 6 at 70 lb and 10 at 50 lb are recorded as one drop set with three stages:
  - Collapsed row: **Drop set · 100 lb × 5 → 70 lb × 6 → 50 lb × 10**
  - Detail line: **1 drop set · 3 stages · 21 reps · 1,420 lb·reps**

The photo half of the brief is reported in [`docs/exercise-media-audit/README.md`](../exercise-media-audit/README.md).

## Swap exercise

**Where to start it**
- The live set card has **Swap exercise** beside **Skip**, as a quiet secondary action under Log set.
- Each exercise in the Full workout list has **Swap**.

**The sheet** (`components/ExerciseSwapSheet.tsx`)
- It is titled **Replace Sissy Squat**.
- Search covers all 399 other catalog exercises, and the sheet says so.
- Equipment filter chips narrow the list.
- With no search typed, **Suggested · same movement or muscles** lists squats first for Sissy Squat; Back Squat is first.
- The confirm button names the choice: **Use Back Squat**. It stays pinned at the sheet's foot, so it remains reachable with the keyboard up.

**What happens to the work already done**
- The sheet says this in one sentence before anything is chosen.
- The swap is decided by `applySwap` in `lib/workoutSwap.ts`:

| Where the exercise stands | What the swap does |
|---|---|
| Nothing logged | Back Squat takes its place, with the same 4 sets. |
| 2 of 4 sets logged | The 2 sets stay with Sissy Squat, unchanged, under its name and catalog id. Back Squat is inserted straight after it with the remaining 2 sets. The workout still has the same number of sets, and tracking moves to Back Squat set 1 of 2. |
| A set typed but not logged | The athlete chooses: **Keep it with Sissy Squat** (still unlogged; it can be logged from the full list, and is left out at finish like any draft), **Discard it**, or **Use the reps for Back Squat** (the reps only, never the load). |
| A drop set under way | **Keep it with Sissy Squat** (logged as a drop set of the stages done; one stage becomes an ordinary set) or **Discard it**. |
| Every set logged | "Every set of Sissy Squat is logged, so there is nothing left to swap." The button becomes **Add Back Squat**, which adds it after Sissy Squat with the same prescription. |

**Logging the new exercise**
- No load is carried over. The new exercise's "Last logged" comes from its own history on this device, or the sheet says there is none.
- Where the logging convention differs, the sheet says so. For example: "Sissy Squat is logged as reps, with any weight added to the body; Back Squat as the whole load (bar and plates, or the bell)."
- The same goes for a box height, and for a timed target (such as "30 s") going to a rep-counted exercise.
- The rest timer is not touched, and the sheet says that too.

**Where the swap applies**
- The default is **This workout only**.
- **Also update this day in my plan** is a separate, unticked box. It names the exact slot, for example: "Legs, exercise 1 of 2: Sissy Squat becomes Back Squat. Its sets and reps (4 × 10) stay."
- Ticked, it uses the plan's own replace (`replaceInDay` in `pages/Home.tsx`, the same code as the plan's replace button). That keeps the prescription and coaching settings.
- It is not offered when:
  - the workout is from a different day than the one open in the plan;
  - the original isn't in that day;
  - the new exercise already is.
  In each case the sheet says why.

**Safety**
- **One write.** A swap is one checkpointed write. It carries a unique swap id, so the same confirm can never apply twice; the sheet also accepts only one confirm.
- **Undo.**
  - The message reads "Swapped to Back Squat · Your 2 logged sets stay with Sissy Squat." Its **Undo** puts the workout back exactly, including the plan if that was changed.
  - Undo works until anything is logged or typed on either exercise. After that, it says it can't, and why.
- **Reload.** After a reload, the workout resumes on Back Squat with the swap recorded.

**History**
- The original keeps `replacedBy`, and the new exercise keeps `swappedFrom`. Each record holds the other's name and catalog id, the number of sets done before the swap, and the time.
- The live card, the full list, the workout-complete summary and the Progress record all show "Switched from Sissy Squat after 2 sets" / "Switched to Back Squat after 2 sets".
- Strength records read each part as the exercise actually performed: Sissy Squat as bodyweight reps, Back Squat by its own load.

## Drop sets

**Logging one** (live set card)
- A **Standard / Drop set** switch appears wherever the set has a weight box.
- In a drop set:
  - **Add drop** records the stage. It starts no rest timer, and the boxes are left empty for the next stage.
  - **Finish drop set** records the last stage, closes the set, and starts the rest.
  - The stages done are listed above the boxes. **Undo** on the last stage puts its numbers back in the boxes to correct.
  - The hint under them reads "Stage 3 · lighter than 70 lb · no rest between stages".
  - The return key on the last box adds the stage.

**Validation** (`stageProblem`)
- Reps are whole and at least 1.
- A load is required where the exercise has one.
- Each drop must be lighter than the stage before. A stage at the same or a heavier load is refused with the reason. Units are compared exactly when stages mix lb and kg.
- A drop set needs at least two stages to count; Finish with one says so.
- On a bodyweight exercise, the added load may drop to none ("+45 lb × 6 → bodyweight × 8").

**Converting an existing set**
- **Make drop set** on a logged set in the full list turns its numbers into stage 1 and reopens it as the active set, to add its drops.
- If it is left unfinished, it stays the set it was.

**One set everywhere.** In the tracker's full list, the workout-complete summary and the Progress record, it is one row: the collapsed stage line, with "1 drop set · 3 stages · 21 reps · 1,420 lb·reps" under it.

### Data rules (`lib/dropSets.ts`)

**Counts.** The parent set counts once: in the set tally, Home's and Progress's set counts, the weekly totals (`trainingWeekSummary` reads the completed-set count), and the strength record's `setCount`.

**Volume.** Volume is load × reps over all stages, in the unit asked for, converting each stage from the unit it was typed in:
- **Total load and machine load:** what was moved.
- **Dumbbell and carry loads:** per implement, and said so ("1,420 lb·reps per dumbbell") rather than doubled.
- **Bodyweight movements:** no external volume.

**Strength estimates.** These read **stage 1 only**: an unfatigued set taken to the first drop. The stages are never added together, so there is no "21 reps at 100 lb". The later, fatigued stages stay identifiable as stages.

**Storage.**
- Each stage has a stable id (`<set id>-stage-<n>`). Stages are stored in order with their own unit.
- The parent's `weight`/`reps` mirror stage 1, so a reader that knows nothing of stages still reads one real set.

**A drop set left open at finish** keeps the stages that were done. Two or more stages make a drop set; one makes an ordinary set. The finish message says so, and a typed but un-added next stage is reported as left out.

## Code

| What | Where |
|---|---|
| Set and exercise model | `client/src/lib/deviceWorkoutLog.ts`: `DeviceSetLog.id/type/stages`, `DropStage`, `DeviceWorkoutExercise.catalogId/swappedFrom/replacedBy/addedDuringWorkout`, `isDropInProgress`, `settleDropSet`. Also `activePosition` (skips a swapped-out exercise) and `finalizeSession` (settles open drop sets). |
| Swap logic | `client/src/lib/workoutSwap.ts`: `assessSwap`, `applySwap`, `addAfter`, `canUndoSwap`, `undoSwap`, `swapNote`, `swapMeasurementNotes`, `swapSuggestions` |
| Drop-set rules and wording | `client/src/lib/dropSets.ts` |
| Swap sheet | `client/src/components/ExerciseSwapSheet.tsx`, `client/src/exercise-swap.css` |
| Tracker | `client/src/components/DeviceWorkoutTracker.tsx` (the swap and drop handlers, set-type switch, stage list, full-list rows, done summary), `client/src/workout-planner.css` (end of file) |
| Plan update | `client/src/pages/Home.tsx`: `replaceInDay`, `replaceInPlanFromWorkout` |
| Readers | `client/src/lib/workoutStrengthRecord.ts` (stage 1; catalog id first), `client/src/components/ProgressOverviewPanel.tsx` (sets per exercise, swap notes, keyed by session exercise id) |
| Search alias | `client/src/lib/exerciseSearch.ts`: "barbell squat" → Back Squat |

**Migrations and adapters.** None needed in the database.
- Workout sessions live on the device (`sports-genome-device-workout-history-v1`). The loader keeps the new fields, validates stages, and drops anything stored as a stage that isn't one.
- **Older sessions:**
  - Sessions from before this change have no `catalogId` and are read by name, as before.
  - Sets without a `type` are standard sets.
  - Nothing is rewritten.

## Share and export: the limitation

- **Shares.** Shared links, copied text and the PDF describe the **plan** (prescriptions), not performed sets. A swap made with "This workout only" therefore never appears in a share, which is the point of that scope; a swap made with the plan tick does, as the plan's new exercise. Drop sets are performed work, so no share or export carries them.
- **Account sync.** What reaches an account is the strength record. It reads stage 1 and counts the drop set once; the stages themselves stay on the device with the session.

## Checks actually run

**Code and unit tests**
- `npx tsc --noEmit` passes.
- `npx vitest run` passes except the same 5 `server/supabase*` tests that cannot reach Supabase from this sandbox (they failed identically before).
- New tests:
  - `client/src/lib/workoutSwap.test.ts` (14)
  - `client/src/lib/dropSets.test.ts` (9)
  - `client/src/components/DeviceWorkoutTracker.swapDrop.test.ts` (13, jsdom through the real component)
  - `client/src/components/ProgressOverviewPanel.swapDrop.test.ts` (1)
  - `client/src/components/ExerciseMedia.test.ts` (updated, 7)
  - `client/src/lib/exercisePhotos.test.ts` (updated, 11)
- **Contract test updated.** `client/src/localSearchScope.test.ts` exempts the swap sheet from offering "search the whole app". It already searches the whole catalog, and leaving mid-swap would abandon it; it states its scope in words instead.

**Browser checks** (`probes/acceptance.mjs`, 39/39, `evidence/acceptance.json`)
- These ran in headless Chromium against `vite preview` of the production build, driving the real UI.
- They are viewport emulations, not phones or people. Large text was emulated by setting the root font size to 140%; an open keyboard by a 390 × 500 viewport.

| Check | Result |
|---|---|
| Owner swap at 390 px: "barbell squat" finds Back Squat first; sheet titled "Replace Sissy Squat"; says the 2 logged sets stay; default "This workout only"; "Use Back Squat" on screen; suggestions include Back Squat; filters fully visible | pass |
| After the swap: card tracks Back Squat set 1 of 2 with "Switched from Sissy Squat after 2 sets"; weight box empty (no load carried); storage holds Sissy Squat 2/2 completed, Back Squat 2 sets, still 7 sets in all | pass |
| Owner drop set: no rest between stages; rest starts on Finish; full list shows the stage line and "1 drop set · 3 stages · 21 reps · 1,420 lb·reps"; stored as one set of three ordered stages; tally 4/7 (counted once) | pass |
| Reload mid-workout resumes past the finished Back Squat; Progress record shows both exercises, both swap notes and the drop set line with its totals | pass |
| 320, 375, 430, 1280 px, 140% text and a keyboard-sized viewport: sheet fits, no sideways scroll, "Use Back Squat" on screen, every control at least 44 px tall; drop-set controls fit | pass |
| Keyboard only: focus moves into the sheet; Enter on "Use Back Squat" swaps; Escape closes and returns focus to Swap exercise | pass |
| kg with decimals: "Drop set · 42.5 kg × 6 → 30 kg × 8 → 17.5 kg × 12", 705 kg·reps; nothing logged → replaced in place | pass |

**Defects the browser checks found, fixed before this report**
- The sheet's equipment filter row was squeezed to a sliver (a flex column shrinking its children).
- At 140% text, a stage line wrapped mid-number, and the two drop buttons squeezed.
- "Last set: 135 lb × 5" stayed on the card while the drops were being entered.

**Screenshots** (`evidence/`)

| Screenshot | Shows |
|---|---|
| `swap-1-before-390.png` | The card before the swap |
| `swap-2a-suggestions-390.png` | Suggestions |
| `swap-2-sheet-390.png`, `swap-3-sheet-details-390.png` | Search and choice |
| `swap-4-after-390.png` | Tracking Back Squat, with the Undo message |
| `drop-1-stages-390.png` | Two stages done, the third typed |
| `drop-2-queue-390.png` | The drop set as one row |
| `record-progress-390.png` | The finished record |
| `sheet-*.png`, `drop-*.png` | Each width, large text and keyboard |

## Not tested, or remaining

- **Real devices.** No phone, screen reader or real text-size setting was used; the checks above are emulations.
- **Fonts and logo.** Screenshots show fallback fonts and a placeholder logo, because the font and asset hosts are unreachable from here.
- **Supersets and circuits** don't exist in this app, so "keep superset membership" has nothing to apply to.
- **Planned drop sets.** Prescriptions are plain text, so a plan can't yet say "last set as a drop set". Drop sets are decided while logging.
- **Undo after a reload.** The Undo lives in the message, so it is gone after a reload. The swap itself is kept and can be swapped back.
