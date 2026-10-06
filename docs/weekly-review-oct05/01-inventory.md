# Weekly review rebuild: inventory

Brief: `Sports-Genome-Oct05-Weekly-Review-Visual-and-Utility-Rebuild-Claude.md` (5 October 2026), §10 "Inventory the existing Review components and calculations; identify daily versus weekly scope." This is what Train → Review was on 5 October 2026 at `18744d3`, before any change, as nine independent readers traced it (review page, weekly volume, recovery spacing, day-only panels, anatomy, plan model, patterns and coverage, routes and actions, tests and CSS records; transcripts in the session's workflow `wf_91affc84-f8b`). Line numbers are from that commit. `02-design.md` is what was built on it; `README.md` carries the brief's checkboxes and the evidence.

## 1. The page

One JSX branch in `client/src/pages/Home.tsx` (:2241-2263): `<section className="day-review-workspace">` with a head (`Review your week`; "Week {activeWeek} · {trainingDays} planned days · {activeSlot.ordinal} open · checks the planned workload, not what you have completed"; an Open workout / Resume button) and a `day-review-stack` of six panels in a fixed order: WarmupPanel, WeeklyMuscleVolumePanel, RecoverySpacingPanel, ProgrammingGuidePanel, WorkoutHealthPanel, ImportedPlanContext.

| Panel | Reads | Scope |
|---|---|---|
| WarmupPanel | `customWorkout` (the open day's draft, :394) and `goal` | day |
| WeeklyMuscleVolumePanel | `weeklyPlan` / `weeklyPrescriptions` = `visibleDayPlan(dayStore, splitDays)` (:651-653) | week (active week only) |
| RecoverySpacingPanel | the same week | week (active week only) |
| ProgrammingGuidePanel | `customWorkout`, `dayPrescriptions` (:597-600), `exerciseSettings` | day |
| WorkoutHealthPanel ("Coach scan") | the same day inputs | day |
| ImportedPlanContext | `dayStore.context[activeDayKey]` (:1543) | day |

So four of six panels read the open day under a heading that names the week, and the only hint of day scope is "{ordinal} open" in the subtitle and the day label inside the Planning guide summary. There was no Week/Day control, no week selector and no day strip on Review. The subtitle's "{trainingDays} planned days" is the frequency setting, while the volume panel's scope line counts saved days, so the two could disagree ("5 planned days" over "Planned · 3 saved days").

Ways in: the Train tab row (Plan / Review / Workout / Matches, `contextualWorkspaces.train` :181-186), Plan's pointer line "Warm-up, programming detail and the week's volume are on Review" (:2223), the universal-search destination "Review your week" (`lib/universalSearch.ts:195`), a direct `?workspace=review` address (:246-250, :341) and browser Back (:1191-1216). Every one of them kept whatever `activeSlot` / `activeWeek` Plan last had, with nothing resetting or declaring the day context on arrival. Home's "Your week" block offered only "View plan" (to Plan); no "Analyze week" or "Review week" control existed anywhere in the repository. Only Plan's `TrainingPlanHeader` could change the week, and `selectWeek` always navigated to Plan (:1654-1662, `applyWeek` :1631-1639).

`navigateWorkspace` (:1106-1134) only set the workspace, pushed `?workspace=review` and scrolled to the top; it never touched the active day, the week or `trainChoice`. Open workout (:2247) was the one thing on Review that set `trainChoice` (`chooseDayToTrain(activeSlot)` :1653), as Plan's own button does; RecoverySpacingPanel's "Open {day}" (:2258) called `selectTrainingDay` + `navigateWorkspace("day-plan")`, moving the inspected-day marker and leaving Review, with Back as the only way back.

The open day's draft reached the week panels through the auto-commit effect (:704-708, gated on hydration) or the day-switch effect (:689-695): one effect tick late, and not at all before hydration. `homePlan` (:618-623) already committed the draft synchronously (`commitDay(dayStore, draftDayKeyRef.current, activeDraft())`) for Home's next-workout rule.

## 2. The numbers

### Weekly muscle volume (`client/src/lib/weeklyVolume.ts`)

`getWeeklyMuscleVolume(plan, prescriptions, goal)` (:30-53), recomputed on every render of the panel. For each exercise of each saved day: sets = the leading integer of the saved prescription, else of `getGoalPrescription(goal, index)` (`workoutPlanner.ts:58-63`: 4 sets for the first two exercises on Max strength, Capacity and Athleticism, 3 after; Muscle growth 3 throughout), else 3. Regex `^\s*(\d+)`: "AMRAP", "Warm-up 2 × 10", "", "0 x 10" all read as 3; "3 × 8 / side" is 3 (no per-side doubling); "20 × 15" is 20, uncapped. Every primary muscle receives the full count as direct sets; every secondary muscle not already primary receives sets × 0.5 (`logicCalibration.exposure.secondarySetConvention`, `evidenceTraceability.ts:214`), applied exactly once per (exercise, muscle), and nothing downstream re-weights. A muscle in both lists of one exercise counts once, as direct (17 of 400 catalog exercises tag one muscle both ways). `equivalentSets = direct + support`; `daySets[dayKey]` carries the same attributed figure per day. Rows are created on first encounter, so a muscle with no work is absent, not zero, and the "Not planned" status (:56) was unreachable.

The panel (`WeeklyMuscleVolumePanel.tsx`) showed the top four rows, rows 5-8 behind "Show N more muscles", and silently omitted rows ranked 9 or lower while still counting them in "{N} attributed sets across all muscles this week" (Σ equivalentSets over all rows, :39, :73). The fixture of two days and three exercises (10 performed sets) gives 32.5 attributed sets across 12 rows, four of them never rendered. Three catalog keys (feet, hipFlexors, serratusAnterior; 9, 22 and 2 tags) were missing from `displayNames` (23 keys) and rendered as raw identifiers ("hipFlexors" for Cable Standing Knee Drive).

Group and specific keys coexist in the catalog: `shoulders` (7 primary / 12 secondary tags) beside `frontDelts` / `sideDelts` / `rearDelts`, and `upperBack` (56 / 39) beside `lats` and `traps`; 75 of 400 exercises carry a group key and a specific key together. Each is its own row and both enter the total; there is no roll-up anywhere. `muscleVocabulary.ts` states `upperBack` = rhomboids + mid trapezius, a sibling of lats and traps, not a parent; `shoulders` is a true umbrella over the three deltoid heads (`anatomyRegions.ts:35-38`).

The status bands (Building < 6, Established 6-11, High exposure 12+; `lowDirectSetBand` 6, `highDirectSetBand` 12, `evidenceTraceability.ts:218-219`) read direct sets only while the row figure, bar, by-day values and total include supporting attribution. Their only traceability entry is the generic "relative-model-calibration" planning estimate (`evidenceTraceability.ts:307-315`, co-contraction and mechanics-uncertainty sources), not a volume dose-response source; `trainingEvidence.ts:8-9` separately holds 10 weekly hard sets as a starting reference and 12-20 as a trained-study context, with sources, which the bands do not read. No study-backed basis for 6 or 12 was found. The panel's bar-scale floor of 12 was a literal (:24).

Four parsers, three calculators: the leading-integer regex and the 0.5 arithmetic are private copies in `weeklyVolume.ts:26-28,45`, `sessionVolume.ts:55,84` (exported `parseSetCount`) and `recoverySpacing.ts:22,32`; `workoutPlanner.ts:52` uses `/\d+/` anywhere, so the Day total (`getWorkoutDiagnostics.totalSets`) and the week map disagree on "Warm-up 2 × 10" (2 vs 3) or "RPE 8, autoregulated" (8 vs 3). `stackMuscleAnalysis.ts` is a different, day-only measure (genome contribution × role weight 1 / 0.65 / 0.4, normalised to the day's highest muscle, no set counts) used by StackAnalysisPage only.

### Recovery spacing (`client/src/lib/recoverySpacing.ts`)

`getRecoverySpacingAlerts` (:37-52) sorts saved days by the leading integer of their key and compares a day only with the saved day whose index is exactly one higher; a saved day with an empty slot between it and the next is not compared, with no wrap-around. `getDayExposure` (:26-35) recomputes the per-day attribution with its own copy of the parse and the 0.5 weight. A muscle is shared when both days give it at least 3 attributed sets (`consecutiveDayMinimumSets`, :46); `sharedExposure` is Σ min(previous, next) over shared muscles and the pair is "priority" from 8 (`consecutiveDayPriorityExposure`, :49-50), else "watch"; a pair with no shared muscle yields nothing. `getRecoverySpacingCoverage` (:59-69) lists compared and skipped pairs. The panel printed one block per pair with "Heavy shared exposure · neighbouring plan days (plan order, not dates)" or "Shared muscle exposure · …", up to four shared muscles as "{label} {prev} {n} / {next} {m} attributed sets", and an Open {next} button.

The plan carries no dates anywhere: `WeeklyDayStore` / `DaySlot` (`trainingDayPlan.ts:26-42`), `WeekSnapshot` / `StoredWeekSnapshot` / `StoredWorkoutPlan` (Home.tsx:115-117) and the server's `StoredPlanRecord` (`server/workoutPlanSync.ts:22-27`, a sync `updatedAt` only). "Adjacent" is plan order, never calendar days, and there is no rest marker: an empty slot is "a day not built yet, passed over, never called rest" (`nextWorkout.ts:21-22`).

### The Coach scan's numbers (`client/src/lib/workoutPlanner.ts:65-89`, `WorkoutHealthPanel.tsx`)

All three come from `getWorkoutDiagnostics(workout, prescriptions, settings, goal, gymMinutes = 60)` over the open day only. **Total effort** (the recording's 161) is `Math.round(totalSets × averageRpe)` (:75): the day's set count (first digits of each prescription, fallback 3) times the mean RPE setting (default 7), so an untouched day prints exactly 7 × sets (23 sets → 161). A set-RPE product with no stated scale and no upper bound. **Muscle overlap** (24%) is `getWorkoutGenome(workout).redundancy` (`exerciseGenome.ts:270-278`): the mean over every pair of the day's exercises of a composite similarity index = 100 × (0.40 × muscle Jaccard + 0.26 × movement-pattern Jaccard + 0.14 × resistance-profile match + 0.20 × quality Jaccard), clamped to 0-100, numerator Σ pair scores over C(n, 2) pairs, 0 below two exercises; muscles carry 40 % of it and the 0.5 supporting weight plays no part. **Managed planned load** is a three-way class of `fatigueExposure` = round(mean of each exercise's genome `fatigue.systemic`): High from 72, Moderate from 52 (`workoutReview.highFatigueReview` / `moderateFatigueReview`), else Managed; the underlying number was never shown and the marks never named.

### Split targets (`client/src/lib/splitStackAnalysis.ts`)

`analyzeSplitStack(workout, catalog, split)` (:57-75), revision `split_targets_v1` (:28, fingerprinted by `splitStackAnalysis.revision.test.ts`): each split has fixed muscle targets in points (:30-38); a primary tag adds 56 and a secondary 24 (`splitPrimaryTagWeight` / `splitSupportTagWeight`), resolved through `trainsMuscle` so the register's "rhomboids" reads the catalog's `upperBack`; a target is a gap under 65 % of its target (`splitCoverageGapRatio`) and high past target + 35; the day index is the mean of each target's ratio, capped at 100. It never reads `Exercise.movement`. Its gap chips route the day picker's muscle filter via `onFixMuscle` → `setMuscle(muscleFilterKey(target))`.

### Movement taxonomy (`client/src/lib/exerciseCatalog.ts:16`)

`Exercise.movement` is a free-text string with no enum or normaliser: 62 distinct values over 400 exercises, none empty, every exercise mapped to at least one muscle. The base catalog (300) and the expansion (100) share only 10 values, so near-duplicates coexist: "Hip hinge" (15) beside "Hinge" (2), "Squat / knee dominant" (19) beside "Squat" (3), "Ankle plantarflexion" (6) beside "Plantar flexion" (1). The twelve commonest: Horizontal push 64, Horizontal pull 31, Vertical pull 26, Elbow flexion 25, Trunk flexion / anti-extension 19, Squat / knee dominant 19, Elbow extension 18, Hip hinge 15, Scapular control 13, Rotation 13, Knee flexion 11, Hip extension 11; next Jump / plyometric 10, Vertical push 9, Diagonal push 9. Nothing on Review read the movement value; the only day-scope sport view (`analyzeStackQualities`, `stackQualityCoverage.ts:87-131`) joins catalog `qualities` tags to sport demands through `qualityToDemand` and counts exercises per demand.

Related, pre-existing and untouched by this brief: `splitAssignment.ts`'s substring rule treats "chin" as a Pull marker, and "machine" contains "chin", so eight machine presses and raises are excluded from Push and Upper; 50 catalog exercises match no split at all; the expansion's Lower body / Shoulders & posture / Core & rotation / Power & athletic categories appear in no split set. Recorded in `README.md` as follow-ups.

## 3. The anatomy figure (`client/src/components/anatomy/AnatomyFigure.tsx`)

An SVG from generated geometry (`figureGeometry.ts`, viewBox 676 × 1203) drawing 24 catalog muscle keys: 16 on the front, 15 on the back, 7 on both; five catalog keys (brachialis, serratusAnterior, tfl, peroneals, rotatorCuff) are declared undrawn (:62). Props: `view` ("front" | "back" | "both"), `roles`, `selectedKeys`, `selectedPart`, `onSelect(key, pathId?)`, `labelFor`, `onHover`, `rankFor` (rank encoding with a hatched "unscored" pattern), `describeFor`, `interactive`, `caption`, `compact`, `frame`, `captions`. Two paint encodings existed, categorical roles and categorical ranks, and no numeric intensity or exposure mode. Selection is one roving tab stop with arrow keys, Enter/Space, `aria-pressed` and a name from `labelFor` plus the role word or `describeFor`; a selected muscle is ringed on every body that draws it. Role colours are tokens in `anatomy-figure.css` (primary orange, supporting teal, stabilizing champagne, neutral #34495f); rank colours are the seven `--sg-rank-*` tokens; `anatomyRoleColors.test.ts` holds every role stop at least ΔE00 15 from every rank. The weekly volume keys its rows by the catalog key the figure uses, so 20 of its 26 keys need no translation; `shoulders` expands through `regionKeysForValue` to the three deltoid regions, `rhomboids` to `upperBack`. Three label dictionaries disagree on wording (AnatomyMap `muscleLabels`, 31 keys; `weeklyVolume.displayNames`, 23; `strengthRegionDefinitions`). The legend is not a shared component.

## 4. The plan model (`client/src/lib/trainingDayPlan.ts`, `Home.tsx`)

Up to three numbered weeks (`threeWeekPlan.ts`), each a `WeekSnapshot { days: WeeklyDayStore; activeDayIndex }`; a `WeeklyDayStore` holds `plan`, `prescriptions`, `settings` and `context` keyed by `${index}-${day}` ("0-Push"), slots derived from `splitDaysForFrequency(trainingDays)` with ordinal "Day 01" and label "Day 01 · Push". Serialised as `StoredWorkoutPlan { version: 2, ...activeWeekLegacyFields, weeks, activeWeek, nextWorkout? }` to localStorage under "gym-optimizer-workout-plan-v1" scoped per account, and pushed to the server as `planJson`. No plan name and no week name exist: a week is only "Week N". The active day is resolved every render from `(splitDays, activeSplitDayIndex, activeSplitDay)` with position authoritative. Lowering the frequency hides days rather than deleting them, and `visibleDayPlan` (:156-166) keeps hidden days out of the week. Set counts are edited only in ExercisePrescriptionRow's stepper and reps fields, written as "N × target" strings; an unset row falls back to the goal default. `addExercise` appends to the draft of the day the strip names and raises one toast with "View workout" and "Undo", every Undo bound to the day key captured at edit time (`editDay`).

## 5. Tests and CSS that pinned the old page

- `Home.review.test.ts`: the panel order inside `day-review-stack` (its end marker `{workspace === "genome"` no longer existed, so the slice covered the rest of the file), `<RecoverySpacingPanel plan={weeklyPlan}`, `day-review-open`, "Review your week", and the dark-ground repaint strings in `index.css` and the flattened-section rules in `workout-planner.css`.
- `Home.noRepeatedPages.test.ts`: no two workspaces share more than one component; a Week/Day split must live inside the one "review" workspace.
- `Home.mobileNavigation.test.ts`: `label: "Review", workspace: "review"`, WorkoutHealthPanel keeps `id="stack-review"`.
- `Home.reviewMatches.test.ts`: the recovery panel's Open {day} handler string.
- `TodayActionPanel.test.ts`: `onOpenTraining={() => navigateWorkspace("day-plan")}` and no `activeDayIndex={activeSlot.index} onChooseDay` in Home.
- `WeeklyMuscleVolumePanel.render.test.ts`, `recoverySpacing.test.ts`, `sessionVolume.test.ts`, `setPrescription.test.ts`, `stackMuscleAnalysis.test.ts`: the calculators and the old panel's copy, kept as the parity record.
- `typeScale.test.ts` (every `.css` under `client/src`, recursively: no literal font-size ≤ 16px, weights on the ladder, letter-spacing only the three tracking tokens, 0 or the monogram's -.3em), `typeFaces.test.ts`, `uiVocabulary.test.ts` (no "table(s)" in UI copy), `layoutIntegrity.test.ts` (top-level `client/src/*.css` only), `phoneGutter.styles.test.ts` (`--sg-gutter: clamp(16px, 4.5vw, 20px)` at ≤ 640px), `surfaces.styles.test.ts` (surfaces.css after index.css).
- CSS: `.day-review-workspace` carried no `sg-surface-*` class; the Train destination is a dark ground in both themes (`.destination-train`, index.css:1547), the legacy panels were repainted for it piecemeal (index.css:986-1035, 1204-1216, 1570-1576) and flattened with `!important` on every direct child of `.day-review-stack` (workout-planner.css:1040-1041); `.day-review-head h1` was on-light ink corrected only under `.destination-train`.

## 6. Numbers in the recording, resolved

| Number | Source | Verdict carried into `02-design.md` §6 |
|---|---|---|
| 344.5 attributed sets | Σ over all muscle rows (including the unrendered ones) of direct + 0.5 × secondary sets | methodology only; the board shows planned work sets |
| Glutes 37 / Pull 5.5, Legs 20, Sport Transfer 11.5 | one muscle's direct + supporting, and the same per saved day | kept, drawn, direct and supporting apart |
| Building / Established / High exposure | direct sets against 6 and 12, no recorded source | not shown as badges; named in the methodology as the register's landmarks |
| 161 total effort | sets × average RPE (default 7) | Day review only, with its definition |
| 24 % muscle overlap | mean pairwise exercise similarity index, 0-100 | Day review only, labelled an index with its definition |
| Managed planned load | systemic fatigue index under 52 | Day review only, the three marks named |
| Heavy shared exposure | Σ min across a pair ≥ 8; shared ≥ 3 on both days | the overlap criterion, stated beside the pair |
| Planned · 5 saved days / 23 sets | saved-day count; one day's set count | the strip's chips and the week's sum, scoped |

## 7. Open questions the inventory raised, and how the build answered them

- Which muscle vocabulary is canonical: the chart uses `displayNames` extended with the three missing keys; the figure's regions use AnatomyMap's `muscleLabels` (it draws soleus, brachioradialis and others the chart never lists). Not unified; a follow-up.
- Roll up `shoulders` / `upperBack` into their parts: no. Each tag is its own row; the figure paints an umbrella on every region it names; the methodology says so. A hierarchy is the owner's decision.
- Keep, re-source or demote the 6 / 12 bands: demoted to the methodology note with "no recorded source"; the constants stay for the day-scope readings that use them.
- Goal default by position (4 sets for the first two exercises): kept as the model is; the methodology names it.
- Zero rows: every split-target muscle of the week's slots is a row, so a zero is visible.
- Which parser: `sessionVolume.parseSetCount` for the week; the Coach scan keeps its own, and the data note says when a prescription does not read as written.
- Per-side, circuits, supersets, warm-ups: not represented in the plan model; stated, not guessed.
- Unknown mapping: an exercise with no muscle tags counts in the session total and in no muscle, is listed in a data note, and turns the figure's zero regions hatched (unknown) rather than resting (zero).
- Should `recoverySpacing` keep its own copy: the board no longer reads it; the module and its tests remain as the parity record and `weekReview.test.ts` holds the new result to it.
