# Traces and the B115 gap discrepancy: Backend V1 discovery

- **Date:** 2026-09-28
- **Commit:** `1a1e630` on `claude/training-day-navigation-workouts-83ro2c`. The application code is identical to `52c8f52`: every commit since then touches only `docs/`.
- **Method:** read-only.
  - Code reading.
  - Scratch vitest runs against the real modules. The scratch config and tests live in the session scratchpad; none are in the repo.
  - Playwright against the dev server (`server/_core/index.ts` on port 3000), using a staged profile (wrestling, Athleticism, 3 days/week, lb). The dev server was stopped afterwards.
  - Supabase and MySQL were not reachable from the sandbox, so account-mode and server-side paths are covered by code reading only.
- **Scope:** brief §2 (discovery exit condition), §7.1 (B108–B117, especially B115) and §10.2 (B160–B166).
- **Legend:** **CONFIRMED** means reproduced numerically or in the browser. **HYPOTHESIS** means inferred from code and not executed end to end.

---

## 1. Every surface that shows a per-muscle coverage number, gap, shortfall or surplus

All paths are relative to `client/src/` unless they start with `server/` or `shared/`. "Model A" and "Model B" are the two contribution formulas described in §2.

| # | Surface (workspace → component) | What it prints | Function chain (file:line) | Inputs | Scope | Planned / logged | Target source | Contribution model |
|---|---|---|---|---|---|---|---|---|
| S1 | Plan (`day-plan`) → `RateStackPanel` dial | `88 /100` | `RateStackPanel.tsx:110` → `splitStackAnalysis.ts:38-55` (score at `:54`) | `customWorkout`, `activeSplitDay` | day | planned | `splitStackAnalysis.ts:13-21` (fixed per split) | A. Mean of per-muscle `min(100, score/target×100)` |
| S2 | Plan → `RateStackPanel` headline | "2 targets under. Quadriceps femoris is furthest behind, 24 points short." | `RateStackPanel.tsx:110-120` → `stackCoverageVisual.ts:69-79` (`deltaToTarget` at `:77`) → `summarizeCoverage` `:88-109` | same | day | planned | same | A |
| S3 | Plan → `RateStackPanel` "Short in this day" buttons | "Hip adductors **11 short**" | `RateStackPanel.tsx:126, 142-154` (same bars) | same | day | planned | same | A |
| S4 | Plan → `RateStackPanel` "Every target, measured" rows | `−11`, band word (Short / Close / Covered / Heavy) | `RateStackPanel.tsx:51-78, 180-199`. Band from `stackCoverageVisual.ts:42-47` | same | day | planned | same | A |
| S5 | Plan → "Add exercises" sheet (`DayExercisePicker`) "Short in this day" chips | "Hip adductors **-11**" | `DayExercisePicker.tsx:88-91` → `analyzeSplitStack` → `buildCoverageBars` → `pickerRanking.ts:29-34`. Rendered at `DayExercisePicker.tsx:181` | `activeWorkout` (= `customWorkout`), `split` | day | planned | same | A. The same call as S1–S4, run independently |
| S6 | Plan → picker header, count line and row tags | "Sorted to close Quadriceps femoris first", "Closes Hip adductors" | `DayExercisePicker.tsx:184, 186, 221` → `pickerRanking.ts:56-79` (tag match through `muscleVocabulary.ts:61-66`) | same | day | planned | same | A (sign only, no number) |
| S7 | Plan → RateStack → "Open full analysis" (`StackAnalysisPage`) target rows | "Hip adductors ↓ SHORT **−15**" | `StackAnalysisPage.tsx:182` → `stackMuscleAnalysis.ts:38-76` → `StackAnalysisPage.tsx:186-193` (re-bars with the same targets) → `stackCoverageVisual.ts:69-79`. Rendered in `:224` | `workout` prop | day | planned | `getSplitRequirements` = the same table | **B.** Genome involvement normalized to the day's most-loaded muscle |
| S8 | Full analysis → "What stands out" tips | "Quadriceps femoris is 34 points under target…" | `StackAnalysisPage.tsx:211-218` → `stackTips.ts:39-47` | S7 bars + session volumes | day | planned | same | B |
| S9 | Full analysis → index badge | `88 /100` | `RateStackPanel.tsx:224` (`targetIndex={analysis.score}`) | S1 | day | planned | same | **A** (on the same screen as B rows) |
| S10 | Full analysis → "Best next picks" | candidates for "the visible gaps" | `RateStackPanel.tsx:225` → `splitStackAnalysis.ts:44-53` | S1 | day | planned | same | **A** (gaps are A's, `state==="gap"` = below 65% of target) |
| S11 | Full analysis → "Inspect X · N% coverage", supporting involvement %, target-map shading | "Gluteal complex 100% coverage" | `StackAnalysisPage.tsx:222, 224` (`item.involvement`) | S7 | day | planned | none (relative only) | B |
| S12 | Full analysis → "Session volume" | "1.5 supporting sets, no direct work." | `StackAnalysisPage.tsx:194-197` → `sessionVolume.ts:63-91`. The default of 3 sets is at `:46-50` | `workout`, `prescriptions` | day | planned | 6 / 12 direct-set bands (`sessionVolume.ts:56-61`) | set counting, 0.5 per supporting set |
| S13 | Review (`review`) → `WeeklyMuscleVolumePanel` | "Hip adductors 0 direct · 2 supporting · BUILDING · 2" | `Home.tsx:483-484, 1661` → `WeeklyMuscleVolumePanel.tsx:9, 33` → `weeklyVolume.ts:29-52`. Status at `:54-58` | `dayStore` via `visibleDayPlan` (`trainingDayPlan.ts:142-152`), saved prescriptions, else `getGoalPrescription` (`workoutPlanner.ts:55-60`) | week (active week's saved days) | planned | 6 / 12 direct-set bands | set counting, 0.5 per supporting set, **goal default of 4 or 3 sets** |
| S14 | Review → `RecoverySpacingPanel` | shared muscles and set counts across consecutive days | `Home.tsx:1665` → `recoverySpacing.ts:24-50` | same as S13 | adjacent-day pairs | planned | consecutive-day thresholds | same as S13 |
| S15 | Matches (`recommended`) → "Movement intelligence" → `MovementIntelligencePanel` | "N% training coverage", covered/uncovered muscle lists | `Home.tsx:1584-1586` → `movementProgramAnalysis.ts:79-119` | `customWorkout`, selected sport action | day vs one sport action | planned | the action's prime/assisting/stabilizer list | boolean per muscle (≥1 tagged exercise) |
| S16 | Strength (`strength`) → body map | coverage mode: "On record". Rank mode: rank colour and name per region | §3(d) below | logged observations | lifetime record, 30 newest lifts | **logged** | reference norms (DB) | not coverage (rank) |
| — | Plan → `DayCapacityNote` | no number: the declared focus area and constraint posture | `DayCapacityNote.tsx:50-95` | `capacityFocus` | — | — | — | — |
| — | Workout (`tracker`), Progress | no per-muscle figure | — | — | — | — | — | — |

Consequences for §7.1:

- **B117:** every coverage surface is *planned*. No surface reports completed per-muscle exposure (CONFIRMED by grep of all consumers). Review's own header says "checks the planned workload, not what you have completed" (`Home.tsx:1652`).
- **B108:** the day targets are one fixed table per split (`splitStackAnalysis.ts:13-21`). They do not depend on goal, sport, frequency or preference, and there is no week target at all.
- **B109:** no target revision is stored with any result.

---

## 2. B115: adductor gap of 11 points in one place and 15 in another

### 2.1 Root cause (CONFIRMED, numerically and in the browser)

**Formula divergence.** It is not scope, not target, not stale state and not rounding.

Two components compute "points short of the split target" for the same muscle, from the same day, against the same target (Legs → adductors = 35). They use different contribution formulas:

- **Model A** is in `analyzeSplitStack` (`splitStackAnalysis.ts:38-43`).
  - Contribution is an absolute sum of catalog-tag weights: primary tag = 56, supporting tag = 24 (`evidenceTraceability.ts:229-230`), capped at 100.
  - Consumers: RateStackPanel (S1–S4) and the picker chips (S5).
  - Adductors = 24 × (number of exercises with an adductor supporting tag) + 56 × (number with an adductor primary tag).
- **Model B** is in `StackAnalysisPage.coverageByMuscle` (`StackAnalysisPage.tsx:186-193`), fed by `analyzeWholeStackMuscles` (`stackMuscleAnalysis.ts:59-75`).
  - It sums the genome `contribution × role weight`: prime 1.0, synergist 0.65, stabilizer 0.4 (`evidenceTraceability.ts:220-222`).
  - It then **normalizes so the day's single most-loaded muscle = 100** (`stackMuscleAnalysis.ts:70-74`).
  - Finally it subtracts the same absolute target (`stackCoverageVisual.ts:77`).
  - Consumers: the full analysis rows and tips (S7, S8).

With one adductor-supporting exercise in the day, Model A always prints −11 (24 − 35). Model B prints whatever the relative share happens to be.

### 2.2 Fixture and numbers

Fixture F4: Week 1 · Day 03 · Legs, built through the picker, no stored prescriptions, goal Athleticism.

| Exercise (catalog id) | Catalog tags (Model A input) | Genome profile (Model B input) |
|---|---|---|
| Leg Press (169) | P: quads, glutes · S: **adductors**, calves, abs | quads P82 · glutes P70 · **adductors S56** · calves S57 · abs S56 |
| Romanian Deadlift (186) | P: hamstrings, glutes · S: lowerBack, upperBack, forearms, abs | hamstrings P75 · glutes P73 · … |
| Seated Leg Curl (195) | P: hamstrings · S: calves, glutes | hamstrings P82 · calves S58 · glutes S57 |
| Standing Calf Raise (221) | P: calves · S: feet | calves P82 · feet S54 |

Adductors through each chain:

| Chain | Arithmetic | Displayed |
|---|---|---|
| A: RateStack S3 | score = 24 (Leg Press supporting tag). 24 − 35 = −11. 24 ≥ 0.65 × 35 = 22.75, so band "near" | **"Hip adductors 11 short"** |
| A: picker S5 | identical call | **"Hip adductors -11"** |
| B: full analysis S7 | raw = 56 × 0.65 = 36.40. Top muscle glutes raw = 70 + 73 + 57 × 0.65 = 180.05. round(36.40 / 180.05 × 100) = **20**. 20 − 35 = −15. 20 < 22.75, so band "short" | **"Hip adductors ↓ SHORT −15"** |
| Session volume S12 | Leg Press defaults to 3 sets × 0.5 | "1.5 supporting sets" |
| Review weekly S13 | Leg Press at index 0 uses the goal default "4 × 3–6": 4 × 0.5 | "0 direct · 2 supporting" |

The other targets on the same day also disagree:

| Muscle | A (RateStack, picker) | B (full analysis) |
|---|---|---|
| quads | −24 | −34 |
| hamstrings | +25 | +12 |
| glutes | +30 | +30 |
| calves | +60 | +47 |

Browser reproduction (Playwright, 1280×900; the add order is the fixture order). The picker chips after each add:

- after Leg Press: `Hamstrings -75 · Quadriceps femoris -24 · Gastrocnemius -16 · Gluteal complex -14 · Hip adductors -11`
- after all four exercises: `Quadriceps femoris -24 · Hip adductors -11`

The other surfaces, with all four exercises added:

- RateStack "Short in this day": `Quadriceps femoris 24 SHORT · Hip adductors 11 SHORT`
- Full analysis rows: `Quadriceps femoris ↓ SHORT −34 · Hip adductors ↓ SHORT −15`
- Full analysis badge: `88 /100`

A second fixture gives the same pair: Back Squat + Romanian Deadlift + Barbell Hip Thrust + Lying Leg Curl + Standing Calf Raise.

- A: adductors = −11.
- B: adductor raw 53.3 against glutes raw 260.1, so involvement 20 and a gap of −15.

Exhaustive search over the 36 distinct Legs tag-and-genome signatures, in days of 1–4 exercises, restricted to days where A prints −11:

- B produced 36 different values, from −24 to +30.
- The −11 / −15 pair is the second most frequent, with 3,315 combinations.

### 2.3 What was ruled out

- **Scope:** all three surfaces are day scope, planned, and read the same `customWorkout` for the same `activeSplitDay`. Review's weekly map (S13) prints sets, not points, so it cannot produce "11" or "15".
- **Target:** both models read the same table (`getSplitRequirements`, `splitStackAnalysis.ts:36`).
- **Stale state:** every chain is a `useMemo` on the live `workout` / `activeWorkout` prop (`RateStackPanel.tsx:110`, `DayExercisePicker.tsx:88-91`, `StackAnalysisPage.tsx:182`). There is no cache and no stored result. The browser run reads all three in one state.
- **Rounding:** Model A is integer arithmetic. Model B rounds once (`stackMuscleAnalysis.ts:74`), and rounding can move it by at most 1 point.

### 2.4 Why Model B is not a target comparison

These points come from the same scratch runs.

- **Unrelated exercises move the gap.** Take F1 (Back Squat + RDL + Lying Leg Curl + Standing Calf Raise): B's adductor gap is −7. Add Barbell Hip Thrust, which does not tag adductors: the gap becomes −15, because the denominator (glutes) grew from 192.1 to 260.1. Model A stays at −11 for both days.
- **The sign can flip.** Back Squat alone: A says adductors **−11 short**, while B says adductors **+30 covered**, because with one exercise the normalizer is small.
- B is a *relative share of the day's load* labelled as "points under target". It breaks B110 (contribution and target defined separately), B112 (one muscle's volume changes another's apparent gap) and B114 (one snapshot for summary and detail).

---

## 3. Traces from input to display (discovery exit condition)

### (a) One logged lift: tracker set → stored record → Progress and Strength

1. **Session creation.** `Home.tsx:1496` renders `DeviceWorkoutTracker` with `customWorkout` and `prescriptions`. "Start" runs `DeviceWorkoutTracker.tsx:271-280` → `makeSession` `:84-100`, which copies the day into a session. An exercise with no stored prescription gets **"3 × 8–12"** (`:93`); see TR-05.
2. **Set entry and completion.** `completeActiveSet` (`DeviceWorkoutTracker.tsx:296-314`) writes `{ weight, reps, height, completed: true }` as strings. Typed-but-uncompleted sets stay drafts (`deviceWorkoutLog.ts:111-113`).
3. **Checkpoint.** `persist` (`DeviceWorkoutTracker.tsx:261-269`) → `saveDeviceWorkoutSessions` (`deviceWorkoutLog.ts:75-85`) writes localStorage `sports-genome-device-workout-history-v1` (`:48`) and dispatches `sports-genome:device-workout-history` (`:83`).
   - `DeviceSetLog` has **no unit field** (`deviceWorkoutLog.ts:1-14`), and the load/save normalizers drop any extra field (`:59, :77`).
4. **Finish.** `finish` (`DeviceWorkoutTracker.tsx:356-375`) → `finalizeSession` (`deviceWorkoutLog.ts:156-174`) drops uncompleted sets and stamps `bodyMassKgAtCompletion`.
   - CONFIRMED: a 3-set exercise with 1 logged, 1 typed and 1 empty set ends with 1 set; `excludedDrafts` = 1.
5. **Derived observation.** `workoutStrengthObservations` (`workoutStrengthRecord.ts:116-156`) produces one observation per exercise per session: the heaviest logged set.
   - `loadKg = displayWeightToKilograms(weight, weightUnit)` (`:145`), where `weightUnit` is the **current** profile unit.
   - CONFIRMED: a stored `"225"` reads as 102.06 kg with the profile in lb, and as 225 kg after switching the profile to kg (TR-06).
6. **Progress display.** `ProgressOverviewPanel.tsx:49, 55-57` reloads on the event.
   - `:96-101` merges server observations, device observations and workout observations. The "Lifts logged" count and latest lift render at `:152-154`.
   - `:104` produces the unified history → within-athlete change → placements via `trpc.strengthPercentile.forLifts` (`:132-135`).
7. **Strength display.** `StrengthGenomePanel.tsx:541-561` gives the workout observations.
   - `:605-610` sets `activeObservations = (directAccess ? device : server) + workout`. Note that this is not the same set Progress counts (TR-14).
   - The same observations feed the rank request in trace (d).
8. **Account mirror (account mode only; HYPOTHESIS, since no Supabase access).**
   - `useAthleteSync.ts:152-190` re-derives the observations and queues them.
   - `reportedUnit: weightUnit` (`:172`) is the current unit, and `loadSemantics: "total_external_load"` (`:176`) is hard-coded.
   - `strengthSyncQueue.ts:84-120` inserts into Supabase `athlete_strength_entries` without an idempotency key (TR-09).

### (b) One exercise addition: picker Add → plan state → persistence → coverage → Undo

1. **Add.** `DayExercisePicker.tsx:186`, "Add" button → `onAdd(exercise)` → `Home.tsx:1629` → `addExercise` (`Home.tsx:895-907`).
   - It refuses a catalog id that is already present (`:896-899`).
   - Otherwise it appends to `customWorkout` (`:901`) and raises a toast with Undo (`:905`).
   - No prescription is stored for the new entry.
2. **Plan state.** `customWorkout` is the active day's draft (`Home.tsx:353`). The write-through effect (`Home.tsx:533-537`) commits it into `dayStore[draftDayKeyRef.current]` via `commitDay` (`trainingDayPlan.ts:109-118`).
   - The day identity is `draftDayKeyRef` (key `"<index>-<split>"`, `trainingDayPlan.ts:51`), not a visible label.
3. **Device persistence.** `Home.tsx:745-757` serializes every week into localStorage `gym-optimizer-workout-plan-v1` (account-scoped key, `Home.tsx:129`) and sets `serializedPlan`.
4. **Account persistence (HYPOTHESIS, no DB).**
   - `usePlanSync` (`Home.tsx:734-739` → `usePlanSync.ts:91-96`) debounces 1.5 s → `trpc.workoutPlan.save` (`server/routers.ts:503-514`) → `saveWorkoutPlan` (`server/workoutPlanSync.ts:80-112`).
   - The write is guarded by `resolvePlanWrite` (`:46-56`), a read-then-write with no conditional UPDATE. See TR-08.
5. **Coverage recompute.** The new `customWorkout` identity invalidates:
   - `RateStackPanel` memo (`RateStackPanel.tsx:110-112`);
   - the picker gaps memo (`DayExercisePicker.tsx:88-91`);
   - the ranking (`:92`);
   - the full analysis memos (`StackAnalysisPage.tsx:182-201`), if open.

   Review's weekly map recomputes on the next render from `dayStore` (`Home.tsx:482-484`). Nothing is cached, so B116 invalidation is correct *per surface*, but the surfaces disagree (§2).
6. **Undo.**
   - The add toast's Undo runs `setCustomWorkout(current => current.filter(item => catalogId(item) !== exercise.id))` (`Home.tsx:905`). It acts on **whatever day is active when Undo is pressed**, and it removes every entry with that catalog id, duplicates included.
   - Remove's Undo (`Home.tsx:964-980`) re-inserts at the old index of the **current** day.
   - Reorder's Undo (`Home.tsx:1011-1017`) moves by exercise id within the current day.
   - CONFIRMED in the browser (TR-04).

### (c) One coverage value: plan → contribution → target → gap → rendered

The traced value is the "Hip adductors 11 short" button, following fixture F4.

1. **Plan.** `customWorkout` = [Leg Press, Romanian Deadlift, Seated Leg Curl, Standing Calf Raise]; `activeSplitDay` = `"Legs"` (`Home.tsx:362, 466`).
2. **Picker contribution.** `DayExercisePicker.tsx:210-219` passes `workout`, `catalog = exercises` and `split` to `RateStackPanel`.
3. **Per-exercise contribution.** `analyzeSplitStack` (`splitStackAnalysis.ts:38-40`) → `involvement` (`:31-34`) → `trainsMuscle(exercise, "adductors")` (`muscleVocabulary.ts:61-66`) → Leg Press `"secondary"` → 24 points (`evidenceTraceability.ts:230`). The other three exercises give 0. rawScore = 24.
4. **Cap and state.** `score = min(100, 24) = 24`. `state` = `"ready"`, because 24 ≥ 35 × 0.65 (`splitStackAnalysis.ts:41-42`, `evidenceTraceability.ts:227`).
5. **Target.** 35, from `requirements.Legs` (`splitStackAnalysis.ts:16`).
6. **Gap.** `buildCoverageBars` gives `deltaToTarget = 24 − 35 = −11` (`stackCoverageVisual.ts:77`) and `band = "near"` (`:42-47`).
7. **Shortfall order.** `summarizeCoverage` (`stackCoverageVisual.ts:94-96`) sorts it second after quads (−24).
8. **Rendered.** `RateStackPanel.tsx:145-150` prints `Math.abs(−11)` → "11 short". The picker chip prints `gap.deltaToTarget` raw → "-11" (`DayExercisePicker.tsx:181`). The full analysis re-derives the same muscle through Model B → "−15" (§2).

### (d) One strength rank: lift → request → route → aggregation → region → colour and name

1. **Lift.** From trace (a) step 7, `activeObservations`, or a lift typed into the Strength form (`StrengthGenomePanel.tsx:562`, `addObservation`).
2. **Request build.** `muscleRankLifts` (`muscleRankLifts.ts:55-79`):
   - newest first;
   - filters to 0 < loadKg ≤ 1000 and 1–100 reps;
   - body mass = the value saved with the lift, else the weight log for that day, else the profile (`:42-47`);
   - `ageYears` comes from `ageAtLift`;
   - de-duplicated, and **capped at the 30 newest** (`:33, :77`).
   - CONFIRMED: a 180 kg best followed by 30 newer lighter lifts is not sent.
3. **Request.** `trpc.strengthProfile.muscleRanks.useQuery({ sex, lifts })` (`StrengthGenomePanel.tsx:637-640`) is enabled only with a sex and at least one lift. It travels as a GET.
4. **Route.** `server/routers.ts:465-481` is a public procedure with a zod-validated input of at most 30 lifts → `getMuscleProfile` (`server/supabaseStrengthProfile.ts:290-305`) with a 5-minute exercise-index cache (`:281-282, 293-296`).
5. **Scoring (HYPOTHESIS; the database functions were not executed).** `scoreMuscleProfile` (`server/supabaseStrengthProfile.ts:193-282`):
   - groups lifts by (saved body mass, age) (`:202-212`);
   - per group: RPC `score_strength_profile_v1` (`:183, :223`), then RPC `apply_strengthlevel_age_adjustment_v1` per exercise (`:185-186, :225-229`);
   - collects `{exercise_id, percentile, confidence}` (`:241-252`);
   - aggregates once through RPC `aggregate_muscle_strength_v1` (`:184, :264`);
   - validates each muscle (`:118+`, `:266`).
6. **Region.** `regionRanksFromMuscles` (`shared/capabilityRank.ts:317-340`) maps each canonical muscle to a region (`:196+`). The region representative is the muscle with the highest confidence, then the most evidence, then name. It is not a blend.
   - CONFIRMED: vastus_lateralis at the 62nd percentile (conf 0.7) and rectus_femoris at the 41st (conf 0.5) give region `quadriceps` = `regional`.
7. **Rank band.** `rankForPercentile` (`shared/capabilityRank.ts:123-126`) uses the raw value with inclusive lower bounds (CONFIRMED: 19.999 → prospect, 20 → jv, null → no rank).
8. **Colour and name.**
   - `StrengthGenomeBodyMap.tsx:73-81` builds `rankFor[muscleKey] = rank.id | "unscored"`.
   - `anatomy/AnatomyFigure.tsx:147-152` fills with `var(--sg-rank-<id>-color)` (`shared/capabilityRank.ts:130`, tokens in `capability-rank.css:11+`); unscored regions are hatched.
   - Row text is `"<shortName> · <ordinal percentile>"` (`StrengthGenomeBodyMap.tsx:91-101`), the accessible name comes from `:84-89`, and the detail uses `RankCard` (`CapabilityRank.tsx:90+`, `StrengthGenomePanel.tsx:280`).
   - While the request is pending, `regionRanks` is null, so the map stays in coverage mode with its own legend (`StrengthGenomePanel.tsx:642, 654-656`). This follows B088.

---

## 4. Material findings

| ID | Severity | B-IDs | Status | Finding and evidence | Suggested fix (one line) |
|---|---|---|---|---|---|
| TR-01 | High | B115, B110, B113, B114 | CONFIRMED (numeric and browser) | **The B115 root cause.** The same muscle, target and day are scored by two formulas.<br>• Model A: tag weights 56/24 (`splitStackAnalysis.ts:31-43`) → RateStack and picker.<br>• Model B: genome involvement normalized to the day's top muscle (`stackMuscleAnalysis.ts:70-74`, `StackAnalysisPage.tsx:186-193`) → full analysis.<br>• F4 gives "11 short" / "-11" against "−15"; quads 24 against 34. | Compute one coverage snapshot, from one model, in one place (a shared hook or engine), and pass it to RateStack, picker and full analysis. Present genome involvement only as a separate "relative involvement" measure, never subtracted from a target. |
| TR-02 | Medium | B110, B112, B113 | CONFIRMED | Model B's "points under target" is a relative share.<br>• Adding Barbell Hip Thrust (no adductor tag) moves adductors from −7 to −15.<br>• Back Squat alone reads adductors −11 short in A and +30 covered in B. | Retire the target delta on normalized involvement; if Model B is kept, define an absolute scale for it and a target in the same unit. |
| TR-03 | Medium | B114 | CONFIRMED (browser) | The full analysis screen mixes snapshots. The badge `88/100` and "Best next picks" come from Model A (`RateStackPanel.tsx:224-225`); the rows and the "What stands out" tips come from Model B. The screen can recommend closing a gap that its own rows grade differently. | Same fix as TR-01: one snapshot per screen. |
| TR-04 | High | B160, B162, B116 | CONFIRMED (browser) | Undo is bound to the *active* day, not to the operation.<br>• Remove Leg Press on Legs → switch to Push → Undo: Leg Press lands in **Push**, and Legs stays without it.<br>• Add Standing Calf Raise on Legs → switch to Pull → Undo: silent no-op; Legs keeps it.<br>• Code: `Home.tsx:905, 964-980, 1011-1017` all close over `setCustomWorkout`. | Record each operation with its day key and entry id; have Undo apply to that key in `dayStore` (or dismiss the toast when the day changes). |
| TR-05 | Medium | B093, B114, B091 | CONFIRMED (browser) | Three different set-count defaults apply to one unset prescription:<br>• Plan row `4 × 3–6` (`Home.tsx:1615` → `workoutPlanner.ts:55-60`);<br>• Review weekly map, 4 sets (`weeklyVolume.ts:33`);<br>• full analysis session volume, 3 sets (`sessionVolume.ts:46-50`);<br>• Workout tracker `3 × 8–12` (`DeviceWorkoutTracker.tsx:93`).<br>F4: plan shows 14 sets, tracker 12; adductors read 2 supporting sets on Review and 1.5 in the full analysis. | Store the goal default as the entry's prescription when an exercise is added (or resolve it through one shared function) and use it everywhere. |
| TR-06 | High | B048, B024, B025, B049 | CONFIRMED (numeric) | Logged weights are unitless strings (`deviceWorkoutLog.ts:1-14`) and are converted with the **current** profile unit at every read (`workoutStrengthRecord.ts:145`) and at sync (`useAthleteSync.ts:172`). A 225 lb set is sent to ranking as 102.06 kg, and as 225 kg after a unit switch. `loadSemantics` is hard-coded to `total_external_load` (`useAthleteSync.ts:176`). | Stamp the entry unit (and load convention) on each set at completion; read and sync with the stamped unit. |
| TR-07 | Medium | B063, B062, B083 | CONFIRMED for the request; HYPOTHESIS for the rank effect | Only the 30 newest lifts are sent (`muscleRankLifts.ts:33, 77`). An older best lift drops out of the request once 30 newer lifts exist, so logging lighter work can lower a region rank. | Select per exercise (best eligible plus most recent) before applying the cap, or move the selection server-side over the stored record. |
| TR-08 | High | B163, B033, B164, B020 | Decision logic CONFIRMED; end-to-end HYPOTHESIS | Plan sync can silently discard work:<br>• `usePlanSync` passes `updatedAt: null` for the device copy (`usePlanSync.ts:49`), so `choosePlan` always picks the server copy when contents differ (`planSyncDecision.ts:46`). Offline edits lose on the next pull.<br>• On conflict the hook adopts the server revision (`usePlanSync.ts:78`) and re-pushes the local plan, which `resolvePlanWrite` then accepts (`server/workoutPlanSync.ts:54-55`). That overwrites the other device's plan.<br>• `saveWorkoutPlan` reads, then writes without `WHERE revision = base` (`:87-100`). | Keep a real device `updatedAt`; on conflict, surface a merge or choice instead of re-pushing; make the UPDATE conditional on the base revision. |
| TR-09 | Low | B154, B033 | HYPOTHESIS | The tracker lift mirror uses `.insert()` into `athlete_strength_entries` with no operation key (`strengthSyncQueue.ts:108-110`). If the response is lost after a successful insert, the queue is kept and re-inserted. | Upsert on a stable key (for example the observation id `workout-<session>-<exercise>`) under a unique constraint. |
| TR-10 | Low | B114 (coverage detail) | CONFIRMED (browser) | The full analysis overlay (`position: fixed`) is clipped to the RateStack panel box: 299 px tall at 1280×900, with page content drawn over it. Cause: `animation: sg-surface-rise … both` on every `[class*="-panel"]` leaves `transform: translateY(0)` on `.rate-stack-panel` (`index.css:2850-2852, 2865-2868`), which becomes the containing block. It does not apply under reduced motion. | Portal the overlay to `document.body`, or drop the fill-mode transform on `.rate-stack-panel`. |
| TR-11 | Low | B113 | CONFIRMED | Model A caps each muscle at 100 before the delta (`splitStackAnalysis.ts:41`). With quads raw 168 (three primaries) the row shows "Covered +20", while `state` = `"high"`; targets ≥ 65 can never band "Heavy" (`stackCoverageVisual.ts:43`). The surplus is hidden, and the band and state disagree. | Compute the band and delta from the uncapped contribution and cap only the bar geometry. |
| TR-12 | Low | B107, B101, B019 | CONFIRMED (catalog dump) | The adductor catalog tags drive the gap:<br>• Leg Extension (171) is tagged P: quads, **glutes** · S: **adductors**, calves, abs.<br>• Copenhagen Plank (217) has no adductor tag at all.<br>• All 25 squat and lunge variants carry an identical adductor supporting tag.<br>So adductor coverage is tag-driven and partly spurious. | Review the tags for lower-body machines and adductor-specific drills before any coverage recalibration. |
| TR-13 | Low | B119, B123 | CONFIRMED (code) | The picker ranks "Closes X" by primary-tag match (`pickerRanking.ts:56-79`), not by the candidate's marginal effect on the reported gap (brief §7.2). | Rank by the change in the shared coverage snapshot for the candidate at its default prescription. |
| TR-14 | Low | B155, B117 | HYPOTHESIS (code) | Progress counts server + device + workout observations (`ProgressOverviewPanel.tsx:97-101`). Strength uses server **or** device, plus workout (`StrengthGenomePanel.tsx:605`). In account mode with device-typed lifts, "Lifts logged" differs between the two. There is also no logged per-muscle exposure surface (§1). | Define one observation set (a shared selector) for both screens; add a completed-exposure read model when B117 is built. |

---

## 5. Not verified

- **Account mode.** Supabase and MySQL were unreachable, so these were not executed:
  - the plan pull and push race (TR-08);
  - the strength-entry sync (TR-09);
  - the server observations list;
  - the `score_strength_profile_v1` → `apply_strengthlevel_age_adjustment_v1` → `aggregate_muscle_strength_v1` chain.

  Trace (d) steps 4–5 therefore come from code only. Whether TR-07 actually lowers a displayed rank depends on that aggregation.
- **The walkthrough's exact state is unknown.** Any day with exactly one adductor-supporting exercise, no adductor-primary exercise, and a top muscle roughly 4.9–5.1 times the adductor raw load reproduces 11 against 15 exactly. F4 and the five-exercise squat day are two such days; §2.2 gives the frequency.
- **Mobile layout** of the full analysis (TR-10) was checked only at 1280×900.
- The **duplicate-entry path** of add-Undo (removing every entry with that catalog id) was read from code, not run.

Scratch material (not in the repo) is in the session scratchpad:

- `vitest.b115.config.ts`
- `b115-chains.test.ts`, `b115-logged.test.ts`, `b115-sync.test.ts`, `b115-cap.test.ts`, `b115-detail.test.ts`
- `b115-browser.mjs`, `b115-undo.mjs`, `b115-defaults.mjs`
- screenshots `b115-*.png`
