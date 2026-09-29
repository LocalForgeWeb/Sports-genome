# Sep 28 regression repair: record

This records the repair made in response to the "Sports Genome Sep 28 Regression Repair" brief. It covers what was broken, what caused it, what changed, how each part was checked, and what is still open.

- **Branch:** `claude/training-day-navigation-workouts-83ro2c`.
- **Base:** `main` at #81, merged in.
- **"Before" build:** 5dd5b1e, batch 10, the production build the recording was made on.
- **"After" build:** this branch.

Screenshots were taken in Chromium at 390×844 (DPR 2) unless a file name gives another width. Before and after pairs use the same seed data and the same steps. The Google Fonts display face does not load in this sandbox, so headings render in the fallback face in every screenshot.

## Definition of done: status

| | |
|---|---|
| Home is a clear overview and entry point again | Yes. The collapsed column is gone. The hero shows the resolved next workout with its own focus figure, and the Sport focus is a compact preview. |
| Plan browsing does not change Home | Yes. Home keeps its own next workout (`lib/nextWorkout.ts`). The recording and journey J3 show it. |
| No collapsed columns, broken status symbols or repeated notices in the tested journeys | Yes. The journeys ran at 320/375/390/430 and at 125% text. Every toast was logged, and none was a sign-in notice. |
| Earlier improvements kept | Yes. Review's bars and labels and its numbers, the analysis overlay and its close behaviour, the exercise rows and Reorder, the rank icons and the dark body are unchanged. Review numbers were compared across builds and are identical. |

## Checklist by brief section

### §3 Home's movement-focus section (P0)
- [x] The section is full width at every tested width and text size, with no narrow orphan column. It is a compact **Sport focus** preview: the action, its body actions, and "Explore this movement".
- [x] "Explore this movement" opens the athlete's own sport and action, even after browsing another sport and pressing Back.

### §4 Next workout, separate from Plan browsing (P0)
- [x] Home resolves its next workout itself. An explicit choice made in the tracker's Change day wins until that day is trained. Otherwise it is the first built day not trained this calendar week. The choice is saved with the plan and survives a reload.
- [x] Browsing Plan tabs, the week pills, the destination strips or the recovery "Open" button never changes it.
- [x] A live session always wins, and Resume opens the same session.

### §5 Weekly strip
- [x] The strip is a summary, not a second day picker.
- [x] Each state has its own icon shape, using main's (#81) set: check, play, arrow, plain ring. "Next" and "Now" appear as tags.
- [x] Every state is also said in words to screen readers.
- [x] An empty day is shown as "not built yet", never as rest.

### §6 Hero visual
- [x] The workout focus comes from the resolved day. Regions are ranked by direct sets, in the Strength region vocabulary: "Chest · Shoulders", "Upper back · Lats · Shoulders".
- [x] The figure turns to the side where the work is: a Pull day shows the back.
- [x] The figure is cropped to the upper body, lower body or full body.
- [x] A day that trains nothing drawn gets no figure.

### §7 Sign-in notice
- [x] It appears at most once per lapse. It fires only when `auth.me` held an account and a protected call was then refused, and it clears when `auth.me` returns an account again.
- [x] It has a close button, so one tap closes it on a touch screen.
- [x] It has one action: "Account & sync" in this build ("Sign in" where a sign-in screen exists). The action opens About me on that group.
- [x] The lasting status is shown on About me's Account & sync row and as a dot on the Profile button.
- [x] Nothing calls a protected route on the device store. `protectedCalls.test.ts` reads every `protectedProcedure` from the server and fails on an ungated query. The four stragglers were auth.passkeys, the passkey enroll call, favorites.set and setPriority.
- [x] Toasts have one placement owner (`lib/feedbackClearance.ts`). They never cover the nav, the add-destination strip open or closed, the resume bar, the Strength sheet's action row, or the inspect actions. Measured at 4 widths.
- [x] "Changes you make are kept on this device" is true during a lapse: writes go to the account-scoped records. It is not claimed after a reload; see Open issues.

### §8 Plan and analysis
- [x] The empty day has one Add exercises action, its day and week, and an "Or import a plan" link.
- [x] On an empty day the action row, the profile prompt and "Saved" are hidden, and coverage shows "Not available yet" with no 0/100.
- [x] The Plan summary shows the coverage index with its scale, one sentence, the one gap worth closing first, and View analysis.
- [x] The bars, tallies, legend and methodology are in the analysis, once.
- [x] Every delta reads "N pts under/over target".
- [x] The band formerly called "Heavy" is now "Well past", because it is catalog-tag points, not sets.
- [x] Session volume has its own colours and units, and shows supporting sets as performed ("counted as N").
- [x] Sport demands name the catalog share as a caption.
- [x] Analysis rows are in the Plan's order.
- [x] The map uses the dark surface and training-day role wording.
- [x] The false "modeled from the day's prescriptions" caption is gone.
- [x] The loading-profile gridline sits on its "50".
- [x] The coverage model, targets, weights and thresholds are unchanged. The model tests pass untouched.
- [x] Adding an exercise updates the plan and the analysis live. From inside the analysis, the badge moves 74 → 90 while it stays open.

### §9 Review
- [x] Rows read "N direct + M supporting contribution". The legend says the 0.5 weight is already applied, and nothing is halved twice.
- [x] The status chip names its basis ("High exposure · 28 direct").
- [x] Recovery spacing uses the volume map's muscle names.
- [x] It counts heavy and plain overlaps apart.
- [x] It says which neighbouring pairs it compared and which it skipped.
- [x] It speaks of "neighbouring plan days (plan order, not dates)" and "attributed sets".
- [x] "Open <day>" opens that day on Plan.
- [x] Every number is identical to the before build for three plans (`evidence/review-numbers.json`).

### §10 Maps and picker
- [x] Role colours are defined once as tokens. Supporting is teal and primary is orange. Both are at least ΔE00 19 from every rank colour; supporting was 4 from State. A test measures this.
- [x] Row thumbnails hatch "Not scored" the way the main map does. It used to look the same as Prospect.
- [x] World Stage keeps its 1.5px edge.
- [x] One region-to-path mapping is shared: row, thumbnail, main map, badge and detail agree for Lats (journey J8).
- [x] The action picker shows labels in sentence case and no longer inherits the label's letter-spacing. It closes on a choice or on Escape, and focus returns to Change.

### §11 Matches
- [x] The number and the letter now carry different facts: the match for this action (50–99), and the exercise's own catalog tier (main #80).
- [x] Why leads with this exercise's rationale and what it shares with the action. It is still collapsed until opened, and each summary has its own accessible name.
- [x] The copy gives the real range and no longer claims the list is ranked on sport priorities.
- [x] "View workout" and Undo keep the day that received the exercise.

### §12 Shell
- [x] Nothing overflows sideways at any tested width or text size.
- [x] The status-area backdrop is opaque once the page scrolls.
- [x] main #79's `viewport-fit=cover` with the translucent status bar is kept. This branch had first switched to an opaque status bar; that was reverted in the merge.

## Mandatory journeys (§13)

All of these ran on the after build with a populated plan: Push 5, Pull 3, Legs 3, Upper empty, Sport Transfer 1. The result files are in `evidence/`.

| Journey | Result |
|---|---|
| Cold/warm Home | Push, "5 exercises", "Workout focus Chest · Shoulders", the front figure and "Open next workout" match cold and warm. No toasts. The loading placeholder was not caught, because the local plan hydrates before the first sample. |
| Scroll all of Home | scrollWidth equals the viewport at 320/375/390/430, at 100% and 125% text. No block is narrower than 60% of the column except the inline "Explore" link button. The strip tags stay inside their chips, and the backdrop is solid once scrolled. |
| Plan browsing | After browsing Pull, Legs and the empty Upper, Home still shows Push, including after a reload. "Open next workout" opens the Push pre-start. |
| Explicit day change | Change day → Pull in the tracker. Home then shows Pull with the back figure, and its action opens Pull. |
| Active session | Start Pull, go to Plan → Upper, then Home: the hero reads "Continue your workout · Pull" and the strip tag reads "Now". Resume opens the same session id, including after a reload. |
| Empty day | One Add button. Adding Bench Press gives 1 row and 33/100. Push then reads 80/100 with its headline. |
| Reauthentication | See the lapse results in `notice.json`. The notice appears once. One tap on its close button closes it. It does not return across Home, Progress, Strength, a refocus or a 61 s skew. "Account & sync" opens About me with that group open and in view, and the dot shows on the Profile button. After a reload with the lapsed cookie, no notice appears. The "Sign in" branch and the clear-on-success step are covered by unit tests (`sessionNotice.test.ts`), because this build has no sign-in screen. |
| Map consistency | For Lats, the row "Lats, State · 88th", the thumbnail rank, the map rank, the selection ring and the sheet all agree. |
| Review | Volume, totals and recovery numbers are identical to the before build for three plans. |
| Matches | Add to Legs (3 → 4), switch the strip to Pull, then Undo: Legs is back to 3 and Pull is unchanged. "View workout" opens Legs with the exercise on it. |

## Evidence

The before and after pairs are in `evidence/`:

| View | Before | After |
|---|---|---|
| Home top | `home-top-390-before.jpg` | `home-top-390-after.jpg` |
| Home bottom (the collapsed column) | `home-bottom-390-before.jpg` | `home-bottom-390-after.jpg` |
| Hero, Pull day | `hero-pull-390-before.jpg` | `hero-pull-390-after.jpg` |
| Hero, Push day | `hero-push-390-before.jpg` | `hero-push-390-after.jpg` |
| Empty Plan | `plan-empty-upper-390-before.jpg` | `plan-empty-upper-390-after.jpg` (plus 320, 430) |
| Populated Plan summary | `plan-summary-3ex-390-before.jpg`, `plan-summary-5ex-390-before.jpg` | `plan-summary-3ex-390-after.jpg`, `plan-summary-5ex-390-after.jpg` |
| Analysis | `analysis-top-390-before.jpg`, `analysis-map-390-before.jpg` | `analysis-top-390-after.jpg`, `analysis-map-390-after.jpg` |
| Body Lab picker and map | `bodylab-picker-390-before.jpg`, `bodylab-map-390-before.jpg` | `bodylab-picker-390-after.jpg`, `bodylab-map-390-after.jpg` |
| Strength rows | `strength-rows-390-before.jpg` | `strength-rows-390-after.jpg` |
| Review | `review-volume-390-before.jpg`, `review-recovery-390-before.jpg` | `review-volume-390-after.jpg`, `review-recovery-390-after.jpg` |
| Matches | `matches-390-before.jpg` | `matches-390-after.jpg` |
| Sign-in notice | `notice-aboutme-390-before.jpg`, `notice-favorite-390-before.jpg`, `notice-setfocus-covers-row-390-before.jpg` | `notice-lapse-390-after.jpg`, `notice-account-sync-390-after.jpg`, `toast-strength-sheet-390-after.jpg`, `toast-catalog-strip-open-390-after.jpg` |

**Recording (Plan browsing → Home → open workout):** `recording-plan-browse-home-open-before.webm` and `recording-plan-browse-home-open-after.webm`.
- **Before:** after browsing Pull, Legs and the empty Upper, Home reads "Choose your next workout", and its action opens Plan on the empty Upper.
- **After:** Home still reads Push, and its action opens the Push workout.

## Confirmed root causes

Each of these was reproduced in the browser or traced in code during diagnosis.

1. **Home's collapsed column.**
   - The hero's small figure and Home's movement section shared the class `home-focus`.
   - The figure's rules (a grid area, `width: clamp(5rem, 26vw, 7.5rem)`, and `display: none` below 360px) also landed on the section.
   - The section was squeezed into a 101px column, or hidden. main #79 found the same cause.
2. **Plan browsing changed Home.**
   - Home's "next workout" was the Plan's active day index.
   - Every Plan tab, week pill and destination strip wrote to that index.
   - Browsing to an empty day therefore turned Home into "Choose your next workout" and sent its action to Plan. This was saved, so it survived a reload.
3. **The week-strip symbols.**
   - Each state was an 11px CSS ring, dashed when planned. On a phone it read as a broken "C" or a spinner.
   - "Done" was counted by position, not by the day's own session.
4. **The hero figure.**
   - It listed the first four primary muscles in insertion order.
   - It always faced the front if any muscle was on the front, so a Pull day showed the biceps.
   - It drew a whole body into a 101px column.
5. **Repeated sign-in notices.**
   - Any UNAUTHORIZED answer raised the notice, held back only by a 60-second window in module state. It came back on every About me visit, refocus and reload.
   - On the device store it told athletes who had never signed in that their sign-in had "expired".
   - Four protected calls were still reachable on the device store: auth.passkeys, the passkey enroll call, favorites.set and setPriority.
   - The notice had no close button, and on touch screens a tap on it paused its timer.
   - Toast placement had two owners that disagreed. The CSS lift knew only two surfaces, so a toast covered the Strength sheet's "Set focus".
6. **The empty day.**
   - Its Add button and the action row's Add button did the same thing.
   - The action row also held two disabled buttons.
   - The 0/100 gauge and methodology rendered before anything was in the day.
   - The empty analysis promised "2 suggested fixes" it never showed.
7. **Coverage hierarchy.**
   - "Heavy" and the same colours were used both for coverage points and for Session volume's sets. One muscle read "heavy" in one place and "light" in the other.
   - Deltas had three spellings, none with a unit.
   - The analysis rows were ordered by involvement, with rank-like ordinals.
   - The analysis map was a white panel with near-invisible labels; its CSS selector leaked into the atlas's nested summary.
   - The Plan caption said coverage was "modeled from the day's prescriptions", but set counts are not in the model.
   - The gridline was offset by half the label column.
8. **Review.**
   - The recovery panel had its own muscle-name map, which lacked `upperBack` among others. A row printed the raw key.
   - It called every flagged pair "heavy".
   - It skipped pairs with an empty day between them while calling the whole plan "clear".
   - Its "Open <day>" only moved the active marker, because `openTrainingDay` stays on Review.
9. **Matches.**
   - The letter stamp was the match score bucketed into letters, while its label called it the catalog tier. It duplicated the number.
   - The Why panel's trace line was the same on every row.
   - The copy claimed a 0–100 range; the real range is 50–99.
   - The copy said the list was ranked on sport priorities, which it is not.
   - "View workout" opened whatever day was active.
10. **Maps.**
    - The supporting role gold was ΔE00 4 from the State rank.
    - Thumbnails painted "Not scored" flat pale, the same as Prospect.
    - A same-specificity rule held World Stage's edge at 1px.
    - The action picker's `<select>` inherited the label's 0.1em tracking.

## Hypotheses (not confirmed)

- **The "long menu over the diagram" (~45 s).** This is most likely iOS's own options list for the native `<select>`. It is bounded, and dismissed, by the OS. It cannot be captured in headless Chromium.
- **Pastel fills in the recording (~90–102 s).** These are most likely the pending state while ranks load, or the 180ms fill transition into rank colours.
- **Notice sightings at 9 s and 18 s.** These are more likely one toast held on screen by a tap than two separate toasts.
- **Athletes whose app-server session lapsed after `directWorkspaceAccess` shipped** (see Open issues). They may not see their account-scoped plan. Whether any such accounts exist cannot be checked from here.

## Files changed

The diff against `main` is 94 files: 52 source and document files, and 42 test files.

- **New modules:**
  - `lib/nextWorkout.ts`
  - `lib/workoutFocus.ts`
  - `lib/movementLabel.ts`
  - `lib/sessionNotice.ts`
  - `lib/accountAccess.ts`
  - `lib/feedbackClearance.ts`
  - `components/anatomy/rankPaint.ts`
  - `components/todayPlanFixture.ts` (test helper)
- **Home:** `pages/Home.tsx`, `components/TodayActionPanel.tsx`, `components/TrainingPlanHeader.tsx`, `lib/athleteRecord.ts`, `lib/liveSession.ts`.
- **Notice:**
  - `main.tsx`
  - `lib/sessionExpiryNotice.ts`, reduced to shared words
  - `_core/hooks/useAuth.ts`
  - `components/AthleteAboutMePanel.tsx`
  - `components/StrengthGenomePanel.tsx`
  - `components/ProgressionReviewPanel.tsx`
  - `components/WorkoutExecutionPanel.tsx`
  - `components/ui/sonner.tsx`
  - `components/SessionResumeBar.tsx`
  - `components/AddDestinationStrip.tsx`
  - `scripts/perf/measure-client.cjs`
- **Plan:**
  - Components: `components/RateStackPanel.tsx`, `components/StackAnalysisPage.tsx`, `components/DayExercisePicker.tsx`.
  - Libraries: `lib/stackCoverageVisual.ts`, `lib/sessionVolume.ts`, `lib/stackTips.ts`.
  - Styles: `rate-stack.css`, `stack-analysis.css`, `workout-planner.css`.
- **Review and Matches:** `components/WeeklyMuscleVolumePanel.tsx`, `components/RecoverySpacingPanel.tsx`, `lib/recoverySpacing.ts`, `lib/weeklyVolume.ts`, `lib/movementRecommendations.ts`.
- **Maps:**
  - Components: `components/AnatomyMap.tsx`, `components/anatomy/AnatomyFigure.tsx`, `components/anatomy/AnatomyRegionGrid.tsx`, `components/StrengthGenomeBodyMap.tsx`, `components/BodyLabNavigator.tsx`, `components/MovementAtlasPanel.tsx`.
  - Styles: `components/anatomy/anatomy-figure.css`, `anatomy-clean.css`, `capability-rank.css`, `body-lab-navigator.css`.
- **Shared styles:** `index.css`.
- **Documents:** `docs/backend-v1/decisions.md` (D-015 correction), `docs/backend-v1/handoff.md`, `docs/ux-polish/brief.md`.

Every existing test changed on purpose carries an inline "Intentional change, Sep 28 regression brief §x" note.

## Tests run

- **Typecheck:** `tsc --noEmit` is clean.
- **Unit tests:** `vitest run` gives 2,539 passed, 1 skipped, and 5 failed. All five need the Supabase network (asset MIME types, evidence runtime, exercise-evidence boundary, storage). The sandbox proxy refuses that network, and the same five fail on `main`.
- **Build:** `vite build` succeeds.
- **Model tests:** `coverageConsistency`, `splitStackAnalysis.revision` and `pickerRanking` pass without edits, which shows the coverage model did not change.
- **New tests:**
  - `nextWorkout.test.ts`
  - `workoutFocus.test.ts`
  - `movementLabel.test.ts`
  - `sessionNotice.test.ts`
  - `protectedCalls.test.ts`
  - `AthleteAboutMePanel.accountSession.test.ts`
  - `Home.emptyDay.test.ts`
  - `Home.reviewMatches.test.ts`
  - `anatomyRoleColors.test.ts` (ΔE00 against every rank)
  - `rankPaint.test.ts`
  - Additions to `StackAnalysisPage`, `stackCoverageVisual`, `recoverySpacing`, `WeeklyMuscleVolumePanel` and `BodyLabNavigator`.
- **Browser checks:** Playwright scripts ran against both builds. These scripts live in the session scratchpad, not in the repository. Their results are the JSON files in `evidence/`.

## Open issues

- **iOS Safari and WebKit are not tested.** Only Chromium, with mobile emulation, was run. The following need a device check:
  - the native action picker's system menu
  - the tap-to-pause toast behaviour, now closable in one tap
  - the status-bar area with `viewport-fit=cover`
  - localStorage eviction for sites that are not added to the home screen
- **A real lapse followed by a reload** leaves the account-scoped plan and profile on the device but unread. `auth.me` answers null and this build has no sign-in. Reading them without an account would weaken the shared-device isolation from PS-01/B173, so it needs an owner decision. Until then the notice says changes are "kept on this device" and does not claim they stay visible.
- **The "Sign in" action** (for builds with a sign-in screen) and **clearing the notice after a successful sign-in** are unit-tested only. This build has no sign-in screen.
- **The loading placeholder on a cold Home** exists, but was not caught in the local runs because the plan hydrates too fast.
- **The primary role colour** moved from red to orange so it cannot be read as the National rank. The Home hero already used orange.
- **Matches at 320px:** keeping main's catalog-tier stamp leaves some names on three lines. That is accepted as main's design choice.

## Release status

Deploy status is filled in when this merges.
