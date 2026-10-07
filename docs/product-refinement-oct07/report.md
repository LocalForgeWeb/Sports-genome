# Oct 7 brief: what changed

**Commits.**
- `8680303`: recap and history.
- `8b75af5`: rank suggestions and comparisons.
- The docs commit that adds this file.

All are on `main` and `claude/repo-access-il8zy5`. The requirement-by-requirement table is in `status.md`.

**What was not verified.**
- All browser checks are headless Chromium with viewport emulation. No iPhone, no WebKit and no real person were involved.
- The sandbox cannot reach the ranking service or an account, so tRPC answers null in the probes.
- Anything that depends on a rank actually arriving, or on account data, was unit-tested only.

## What changed for users

### 1. Finishing a workout

**What happens when you tap Finish.** You now get a **Workout saved** screen instead of a toast. It shows:
- the day, the date, and "Saved on this device";
- three numbers: exercises, working sets, and "Start to finish · 52 min elapsed". The time is hidden when it can't be measured;
- each exercise you did, against its plan, for example "2 of 4 planned sets · 1 skipped · 1 not recorded". Each opens to its sets. A drop set stays one set with its stages;
- a **Not done** list that tells skipped work apart from work that was never recorded;
- an optional note;
- **Correct a set**: edit a set's weight or reps, or remove a set.

The actions are **Done**, **View in Progress** and **See what's next**.

**Finishing early.** If planned sets are still open, Finish asks in place first ("Finish now? … 4 planned sets stay not done"). **Keep going** returns you to the same set, with your drafts and the rest timer untouched.

### 2. History in Progress

**Bug fixed: the list was cut off.** Progress showed only the 8 newest workouts, with no way to reach older ones. Now:
- the list shows 10 at a time, with **Show N more**;
- at the bottom it says "That's every workout: N.";
- rows are grouped by month.

**Filters.** You can filter by **Exercise** and by **When** (30 days, 90 days, 12 months).
- The exercise filter goes by catalog identity, not name.
- The count reads "x of y" while a filter is on.
- **Clear filters** resets them.
- "No workouts match…" is a different state from having no history at all.
- If the account's workouts can't be loaded, that is said, with Try again, and this device's workouts stay listed.

**Opening a workout.** A row opens the same session detail as the Workout saved screen.
- The workout is in the address (`?session=`), so a reload keeps it open.
- Back returns to the same list position, with that row focused.
- An unknown ID shows "Workout not found".
- Removing a workout now happens from its detail.

**Corrections update everything.** A correction changes the one stored record. Progress, Strength and Home all read it.
- If that workout's lifts were already sent to the account, the app says the account keeps the old numbers. The account table is insert-only.
- Lifts not yet sent are re-queued with the corrected numbers.

**Repeat a workout.** A past workout's detail has **Repeat in your plan**. It opens the same Save to plan dialog used for pasted and shared workouts, so you pick the week and day, and add-after or replace, before anything changes.
- Only the exercises and their planned prescriptions are copied.
- Logged weights, completions, timestamps and notes stay in history.
- An exercise no longer in the catalog is named and left out.

### 3. Home

A **Last workout** row under "Your week" opens that exact workout's detail. It sits below the primary action, so a Resume button always comes first.

### 4. Strength: unranked muscle groups

The section is now **Add a comparable lift**.
- Each row shows its equipment and whether it is "compared on this exact lift" or "through a related lift".
- The familiar lift is tagged **Common option**, replacing "Most common", which had no usage data behind it.
- The button reads **Log this lift**, and goes under the text on phones so names don't get squeezed.

**New in the section.**
- An **Equipment** choice. If nothing is left after filtering, **Show any equipment** brings the list back. Your profile is never changed.
- **How lifts are compared**, opened on demand.
- A line when ranks can't be worked out right now, or you're offline. It says the lift is saved and will rank later.

**After saving a lift.** The saved message offers **Back to Chest**, to whichever group you came from.

**A group no lift can rank** (tibialis anterior) now also says this doesn't make it less important.

### 5. Trends compare like with like

Strength trends in Progress, Home and Strength are now grouped by exercise identity:
- the catalog ID where the record kept it;
- otherwise the ID that the name unambiguously points to;
- by name only where two catalog entries share it. "Romanian Deadlift" is both #42 and #186.

Side, and load added to a bodyweight movement, also split a series.

## Mounted owners (N01)

| Intent | Owner |
|---|---|
| Resume | `DeviceWorkoutTracker` (workspace `tracker`), state in `sports-genome-device-workout-history-v1` |
| Inspect a finished workout | `WorkoutSessionDetail`. Rendered by the tracker after Finish (`saved`), and by `ProgressOverviewPanel` for `?workspace=progress&session=<id>` (`history`) |
| Next training day | `TodayActionPanel` via `resolveNextWorkout`; prestart in `DeviceWorkoutTracker` |
| Hand fighting support | Body Lab → `CatalogDiscoveryPanel` with discovery params |
| One muscle | `StrengthGenomePanel` region sheet |
| Personal lift history | Strength record sheet; Progress trends (`withinAthleteStrengthChange`) |
| Weekly finding → plan | `WeekReviewBoard` → `onEditDay` |

## Dormant code (A06, P01)

**What is dormant.**
- `WorkoutExecutionPanel` is never rendered.
- `ProgressionReviewPanel` and `WorkoutHistoryTimeline` render only inside it.
- `getWeeklyProgressReview` is called only by ProgressionReviewPanel. It pools estimated performance across exercises, and its set type has no setup fields.

**Retired from Home.** Home listened for the panel's "approve" events. Those wrote a sentence into the exercise's notes and toasted "Progression note applied". Nothing live dispatched them. Home no longer imports the panel module or those listeners.

**Guarded.** `progressComparisonFixtures.test.ts` fails if any live file renders, imports or calls this path. The helper carries a DORMANT header explaining why.

## Recommendation actions (Q01)

| Action | Where | What it does |
|---|---|---|
| Add a workout | Weekly Review | Opens the plan editor |
| Edit &lt;day&gt; | Weekly Review | Opens that day in the plan |
| Inspect | Weekly Review | Opens the exercise detail |
| Find exercises for &lt;muscle&gt; | Weekly Review | Opens discovery for that muscle |
| Log this lift | Strength, unranked group | Opens Log a lift with that exercise chosen; nothing is saved until you save |

No live action changes a prescription or appends a note from a recommendation.

## Rank snapshot (S01–S03)

**What the snapshot now records.**
- The scorer name: `score_strength_profile_v1`.
- The schema version: 2.
- The resolution map:
  - `direct` → direct;
  - `aliased_variant` → related;
  - `aliased_rep_variant` → related.
- The number of exercises scored: 244.
- An md5 over the `id:name` lines: `7ecabf4b7e7c66bc89c4f4db8bab7a2e`.

**Catalog check.** I computed the same digest in the database, read-only, for those 244 IDs. It matches the app catalog exactly.
- The database links 330 of the app's 400 catalog IDs.
- The exercise table itself is unchanged; only metadata was added.

**Generator validation.** The generator now refuses, naming each row:
- unknown resolutions;
- weights outside (0, 1];
- duplicate IDs;
- rows with no name;
- rows with stabilizer mappings only.

Its first run found three stabilizer mappings with no weight (Inverted Row, Feet-Elevated Inverted Row and Ring Row, `upper_trapezius`). Stabilizers are dropped anyway, so these are reported as a warning, not an error.

## Tests and checks

**Typecheck and tests.**
- `npx tsc --noEmit`: clean.
- `npx vitest run`: 3067 passed, 6 skipped. The skipped ones are Supabase tests, which need credentials.
- `npx vite build`: OK.

**New test files.**
- `sessionRecap.test.ts` (10 tests): finalize outcome, recap model, corrections, note, outbox, and Last logged by ID.
- `ProgressOverviewPanel.history.test.ts` (7 tests).
- `progressComparisonFixtures.test.ts` (11 tests): the brief's eight fixtures, plus the dormant-path guard.
- `TodayActionPanel.week.render.test.ts`: 2 Last workout tests added.
- `rankRecommendations.test.ts`: rewritten for the new copy, plus snapshot, ID and generator tests.

**Browser probes.**
- `probes/recap-history.mjs`: 75/75 at 390, 320 and 1280 px, plus the Repeat journey at 390 px. Screenshots are in `evidence/`.
- Rank probe: 14/14, including Equipment and Back to Chest.
- Earlier probes rerun against this build:
  - swap/drop: 44/44 after updating three selectors for this brief's changes;
  - media: 20/20;
  - Oct 1: 27/34.
- The seven Oct 1 failures all target things later work intentionally replaced. Details are in `status.md` under O05.
- Rerun logs are in `evidence/rerun-*.txt`.

## Not done, and risks

**Not built.**
- **Exercise-specific history screen** (H07). The record sheet in Strength remains that view.
- **Weekly Review W-items** and **performance timing** (F01) were not audited this pass.

**Limitations in what was built.**
- **Filters reset on a full reload.** They live in component state; the open session does not, since it is in the address.
- **The account keeps corrected lifts' old numbers**, if they were already sent. Its table is insert-only, and the app says so when it happens.
- **Typed lifts have no catalog ID.** A typed "Romanian Deadlift" forms its own series, apart from workout logs of #42 or #186.

**Next verification step.** Run the recap and rank probes on a real iPhone (Safari), signed in to an account. That would cover:
- the account history error state;
- a rank arriving after "Log this lift" → Back to Chest.
