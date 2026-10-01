# Backend V1 inventory: calculation engines

- **Date:** 2026-09-28
- **Commit:** `52c8f52d41218276cf381685ca5ae2e9f9f60818` ("Re-rank every lift at the age it was lifted at, once a birth year is given (#67)"), branch working tree clean apart from `docs/backend-v1/`
- **Database:** Supabase project `qiccnqkypbhlwpmjcsri`, public schema, read on 2026-09-27 via `pg_proc.prosrc` and small reference tables
- **Scope:** brief §4–§8 and §15.1–15.3 (B017, B048–B138, B242–B243, B287). Payments are out of scope.
- **Method:** read-only. I read the source, read the SQL function bodies, and called only functions marked STABLE or IMMUTABLE (`provolatile` `s`/`i`) to trace outputs. I wrote throwaway scratch tests in the session scratchpad, outside the repo, and they import the real modules. I also ran the existing tests: 15 engine test files, 246 tests, all passing. **No repo source, test or config file was changed.**
- **Markers:** **CONFIRMED** means shown by code, SQL or a runtime trace, with the citation given. **HYPOTHESIS** means inferred but not demonstrated.

---

## 1. Strength Genome (§5)

### 1.1 Modules

| File / object | Responsibility | Version id | Consumers |
|---|---|---|---|
| `shared/oneRepMaxEstimation.ts` | Epley e1RM for 1–12 reps; returns the load unchanged at 1 rep | `oneRepMaxEstimationMethod = "epley"` (method name only, no version) | `withinAthleteStrengthChange.ts:73`, `powerliftingReference.ts:202` |
| `shared/strengthPercentile.ts` | Beta route. e1RM is the mean of Epley and Brzycki on effective reps (reps + RIR). Places the value on a curve with linear interpolation and censors the tails. Applies the Strength Level age factor | `strength_beta_v1` (l.15), `strengthlevel_age_factor_v1` (l.233) | `server/supabaseStrengthCurves.ts` → tRPC `strengthPercentile.forLift/forLifts` (`routers.ts:483-494`) → `StrengthGenomePanel.tsx:248`, `ProgressOverviewPanel.tsx:132` |
| `server/supabaseStrengthCurves.ts` | Reads `app_strength_beta_curves_v1`, builds one curve ladder, matches catalog id or name, 5-minute cache | none (reuses the shared version) | routers above |
| `server/supabaseStrengthProfile.ts` | Muscle ranks. Groups lifts by saved bodyweight and age, then calls the RPCs `score_strength_profile_v1`, `apply_strengthlevel_age_adjustment_v1` and `aggregate_muscle_strength_v1` | echoes the DB `scoring_version`, plus `sg_capability_rank_v1` and `muscle_aggregate_structural_v1` | `strengthProfile.muscleRanks` (`routers.ts:465-482`) → `StrengthGenomePanel.tsx:637` |
| `shared/capabilityRank.ts` | Rank bands, confidence thresholds, mapping of the 58 DB muscles to Body Lab regions, choice of the region's representative muscle | `sg_capability_rank_v1`, `sg_rank_palette_v2`, `muscle_aggregate_structural_v1` | `StrengthGenomePanel`, `CapabilityRank.tsx`, server profile |
| `shared/normsReference.ts` | Research-grade route. Exact match on population and protocol, and reports a band between cut points (no interpolation) | none | `server/normsResolution.ts`, `client/src/lib/registryReference.ts` |
| `server/normsRegistry.ts`, `server/normsResolution.ts` | Load the approved `app_reference_eligibility` rows and bind them to server observations. `ageYearsAt` works from the exact date of birth | none | `strengthGenome.referenceComparisons`, `referenceRows`, `overview` |
| `client/src/lib/registryReference.ts` | Same matching run on the device, for device-local observations | none | `StrengthGenomePanel.tsx:214` |
| `client/src/lib/powerliftingReference.ts`, `server/powerliftingNormsReference.ts`, `shared/powerliftingNormsReference.ts` | van den Hoek 2024 powerlifting deciles. One strict path requires a declaration; a second path ranks ordinary gym logs using an Epley e1RM | `van_den_hoek_2024_powerlifting_relative_strength` | `StrengthGenomePanel.tsx:196-211, 228` |
| `shared/piper2021PreacherCurlReference.ts` | Piper 2021 preacher-curl 10RM bands by bodyweight class, hand-transcribed | `piper_2021_preacher_curl_10rm` | `StrengthGenomePanel.tsx:92-96` |
| `shared/strengthGenomeDefinitions.ts` | Domain and region vocabulary, alias routes, mapping of catalog muscles to regions. Holds no coefficients | none | `server/strengthGenome.ts` overview, `workoutStrengthRecord.ts` |
| `client/src/lib/withinAthleteStrengthChange.ts`, `unifiedStrengthHistory.ts` | Compares the first and latest Epley e1RM for each exercise and assigns a change state (thresholds 6% and 15%) | uses `"epley"` | Strength record sheet, Progress |
| `client/src/lib/workoutStrengthRecord.ts` | Turns a finished device workout into one MULTI_REP observation per exercise per session, using the heaviest set | none | StrengthGenomePanel, Progress, `useAthleteSync`, `athleteRecord` |
| `client/src/lib/muscleRankLifts.ts` | Picks which lifts go to muscle ranks: the newest 30 with a load | none | `StrengthGenomePanel.tsx:634` |
| `client/src/lib/progressiveTraining.ts` | Progression "estimatedPerformance": the mean of Epley values across completed sets | none | ProgressionReviewPanel |
| `client/src/lib/useAthleteSync.ts`, `strengthSyncQueue.ts` | Uploads device lifts to Supabase `athlete_strength_entries` | none | Home |
| **SQL (used by the app)** | `score_strength_profile_v1`, `score_strength_input_v1`, `score_strength_observation_v1`, `estimate_e1rm_for_strength_reference_v1`, `get_strength_e1rm_estimator_v1`, `estimate_e1rm_strengthlevel_v1`, `estimate_e1rm_v1`, `get_beta_strength_percentile_v1`/`_core`, `aggregate_muscle_strength_v1`, `sg_percentile_to_latent_v1`, `sg_latent_to_percentile_v1`, `apply_strengthlevel_age_adjustment_v1`, `strengthlevel_age_factor_v1`, `annotate_strength_reference_scope_v1`. All are STABLE or IMMUTABLE | outputs carry `strength_beta_v1`, but the estimator outputs carry `strength_beta_v2` / `strengthlevel_compatible_v1` | server profile |
| **SQL (not called by the app)** | `score_strength_v1`, `score_strength_v2` (the DB's own "authoritative_rank_path", which requires age), `score_strength_profile_v2`, `get_strength_percentile_v1`, `score_weighted_pull_chin_v1`, `estimate_weighted_bodyweight_strength_v1`, the isometric, timed-hold and carry scorers | `strength_beta_v2`, `strength_beta_v2_age_adjusted` | nothing in the repo (grep) |

### 1.2 Estimated-maximum methods (B056, B057, B058)

| # | Implementation | Formula | Reps accepted | RIR | Confidence | Used by |
|---|---|---|---|---|---|---|
| E1 | `shared/oneRepMaxEstimation.ts:12-17` | Epley `L·(1+r/30)`; returns L at r=1 | 1–12 | not accepted | none | within-athlete change, powerlifting "rank" |
| E2 | `shared/strengthPercentile.ts:159-183` | mean(Epley, Brzycki `36L/(37−r)`) on r+RIR | effective ≤ 12 (l.121) | `max(0, RIR ?? 0)` (l.171) | `1−0.05(r−1)`, floor 0.4 (l.141-144) | single-lift beta percentile |
| E3 | `client/src/lib/progressiveTraining.ts:120,155` | Epley averaged over all completed sets | uncapped | none | none | progression review |
| E4 | SQL `estimate_e1rm_v1` | mean(Epley, Brzycki) on r+RIR | reps 1–15, effective < 20, RIR 0–5 | null → 0, confidence −0.08 | step table 0.94…0.70 | DB best-effort path for exercises without a Strength Level curve |
| E5 | SQL `estimate_e1rm_strengthlevel_v1` | Brzycki if eff < 8; linear blend 8–10; Epley if eff > 10 | reps 1–15, effective < 20 | null → 0, confidence −0.08; RIR > 0 lowers confidence | step table 0.95…0.68 | **every muscle rank for exercises with Strength Level curves**, chosen by `get_strength_e1rm_estimator_v1` |

- Muscle ranks (E5) and the single-lift card (E2) disagree on the same lift; see §1.8.
- Only exercises with a policy `scoring_mode` get e1RM, so it is not run on carries or holds on the percentile path. `bodyweight_reps` exercises use a rep curve instead (`score_strength_input_v1`). **CONFIRMED.**
- Eligible exercise families: `strength_exercise_scoring_policy` (about 289 rows) covers `loaded_e1rm` and `bodyweight_reps`. Beta curves (`beta_fallback`, Strength Level) exist for 96 relative, 19 `lb_1rm`, 6 absolute `lb`, 25 reps and 1 carry exercise (query in §8).

### 1.3 Load and protocol input model (B048–B055)

| Concern | What the input model can represent | What is assumed | Evidence |
|---|---|---|---|
| Units (B048) | Device set: `weight: string` with **no unit** (`deviceWorkoutLog.ts:1-13`). Server workout set: `actualWeight` + `weightUnit` (`drizzle/schema.ts:109-110`). Manual observation: `loadKg decimal(8,2)` only, so the entry unit is lost (`schema.ts:443`) | Device history is read in **today's** display unit (`workoutStrengthRecord.ts:116-145`). Tracker sets with a null unit are treated as lb (`unifiedStrengthHistory.ts:32`) | CONFIRMED (scratch: the same stored "225" reads as 102.06 kg under lb and 225 kg under kg) |
| Per-hand vs total (B049, B244) | No field and no UI wording. The set label is just "Weight" (`setEntryFields.ts:28`); a grep for "per hand" or "each" in client/src finds nothing | DB policy expects `per_implement` (ONE dumbbell) for dumbbell exercises. The TS route ignores `load_semantics` (`supabaseStrengthCurves.ts:61`). The Supabase sync hardcodes `loadSemantics: "total_external_load"` (`useAthleteSync.ts:176`) | CONFIRMED. DB trace: DB bench 30 kg × 8 at bodyweight 80 → 43.10; 60 kg × 8 → `above_range` 95.00. What athletes actually type is a HYPOTHESIS |
| Unilateral (B050) | Manual form `laterality` BILATERAL/LEFT/RIGHT (`routers.ts:393`). Not on device sets. Tracker sets are hardcoded to BILATERAL (`unifiedStrengthHistory.ts:34`) | Muscle ranks and the beta route send no side. Single-arm DB variants alias to the bilateral DB curve with multiplier 1.00 (DB trace `single_arm_db_30x8` → 43.10 via `aliased_variant`) | CONFIRMED |
| Assistance (B051, B246) | `externalAssistance` is free text and is never read by any calculation (grep: only the form and storage) | Positive "Added weight" on bodyweight exercises (`setEntryFields.ts:29,40-44`); there is no negative or assistance convention | CONFIRMED |
| Bodyweight exercises (B052) | Rep curves via policy `bodyweight_reps` | Added load is **ignored**: DB Pull-Up +20 kg × 5 → 15.71, and Pull-Up bodyweight × 5 → 15.71. Unloaded bodyweight lifts never reach muscle ranks because of the `loadKg > 0` filter (`muscleRankLifts.ts:61`) | CONFIRMED (DB trace) |
| Machines (B053) | Policy `machine_displayed_load` compared against a machine-specific community curve, e.g. Leg Press with modifier 0.90 | The TS route ignores `confidence_modifier` (not selected, `supabaseStrengthCurves.ts:61`). There is no universal machine-to-free-weight conversion | CONFIRMED |
| ROM, tempo, grip, technique (B054) | Stored as text (`schema.ts`, `routers.ts:390-392`) | Never used in any calculation (grep) | CONFIRMED |
| Eligibility (B055) | DB: policy row or best-effort curve. TS: `beta_fallback` role, a 1RM-type curve, sex, bodyweight | Workout observations: heaviest completed, non-skipped set with reps (`workoutStrengthRecord.ts:129-139`). There is **no** warm-up, failed or partial flag in the set model | CONFIRMED |

### 1.4 Observation selection (B059–B063)

- **RIR (B059):** no client caller passes `repsInReserve` (a grep for `repsInReserve` in client/src finds 0 non-test hits). Muscle-rank observations carry no `rir` (`supabaseStrengthProfile.ts:201,211`). Recorded `rir` (`schema.ts`, the manual form) therefore never reaches any percentile route. Missing RIR is treated as 0, i.e. maximal effort, in both E2 and E4/E5 (E4/E5 only lower confidence). **CONFIRMED.**
- **Warm-up, failed, partial (B060):** not representable. A tracker set becomes an observation when it is completed with reps ≥ 1 (`unifiedStrengthHistory.ts:19-37`), so warm-ups enter the within-athlete trend. **CONFIRMED.**
- **Estimators shown (B061):** four different selections are on screen at once. **CONFIRMED.**
  1. Record sheet: the lift for the region ranked by relevance, then the most recent (`workoutStrengthRecord.ts:92-102`, `StrengthGenomePanel.tsx:136,142`).
  2. Progress placement: the latest point of the trend (`withinAthleteStrengthChange.ts:120-123`).
  3. Muscle ranks: the newest 30 lifts (`muscleRankLifts.ts:56-76`), then per exercise the **highest-confidence** observation (`aggregate_muscle_strength_v1`, `dedup` CTE: `order by exercise_id, obs_confidence desc, percentile desc`).
  4. Workout record: the heaviest set, not the best e1RM (`workoutStrengthRecord.ts:134-139`).
- **A weaker record lowers the displayed score (B063): yes.** **CONFIRMED** with live functions. `score_strength_profile_v1(80,'male', …)` with bench 100 kg × 10 alone gives a chest sternocostal percentile of **84.67** (State). Adding bench 80 kg × 3 gives **27.35** (JV), because the 3-rep set has confidence 0.82 against 0.76. Separately, the 30-lift recency window drops an older best lift (scratch: 31 lifts, the oldest being 140 kg, and the 140 kg lift was not sent).
- **Provenance (B062):** the muscle evidence lists exercise name, role and percentile, but no observation id, date or sample count (`supabaseStrengthProfile.ts:128-132`). **CONFIRMED.**

### 1.5 Percentile routes, populations, adjustments (B064–B071)

| Route | Population (B064) | Direct or transferred (B066) | Output type (B074) | Age | Sex | Bodyweight | Double-application risk (B067, B071) |
|---|---|---|---|---|---|---|---|
| Beta, TS (`strengthPercentile.ts`) | "Self-selected Strength Level community lifters (not general population)" (`strength_norm_source_policy.population_label`); anchors P5–P95 | Direct curves only. The view has no alias rows, so the TS route has no alias support | Interpolated percentile at 0.1 precision; tails censored | ×1/factor on e1RM for the Strength Level study only, ages 15–90 (l.329-339) | Sex-matched curve required | Ratio e1RM/BW for `x_bodyweight` curves (l.320-324) | None found. Age is applied once, to the compared value. Bodyweight is a plain ratio with no allometry (B071) |
| Beta, DB (`get_beta_strength_percentile_v1`) | same | Direct, then `strength_norm_curve_aliases` with an `e1rm_multiplier` and `confidence_modifier` | Percentile at 2 dp. **below_range/above_range return the anchor P5/P95 as a score** | `apply_strengthlevel_age_adjustment_v1` re-scores `e1rm/factor` once | same | Ratio | None found. `score_strength_v2` would apply age too, but the app does not call it |
| Research-grade (`normsReference.ts`) | Approved `app_reference_eligibility`: novice college-aged 10RM, ages 18–25 (male `lb`, female `lb_10rm`); `performance_norms` rows have no exercise link (exercise_id null) | Exact match only | Band label, never interpolated (l.248-261) | Row age band (inclusive) | Row sex | BW class (half-open, l.180-184) or ratio | None (no adjustment). **Female `lb_10rm` rows can never match** (EN-14) |
| Powerlifting "rank" (`powerliftingReference.ts:213-257`) | van den Hoek 2024 drug-tested, unequipped **competitors** (`strength_norm_source_policy.source_role = excluded`) | Estimated e1RM (Epley) against competition 1RM deciles | Decile band; relative strength rounded to 2 dp first (l.246) | Registry age band, otherwise **falls back to the 18–35 table for any age** (l.242-244). Uses **today's** age (`StrengthGenomePanel.tsx:210,337-339`) | M/F | Ratio | The age band is in the source and no factor is added, so no double application. Population substitution outside 18–35 |
| Piper 2021 (`piper2021PreacherCurlReference.ts`) | Pre-training college-aged males, 10RM, exact protocol | Exact | Band | 18–25 gate | male only | Bodyweight classes with gaps (EN-15) | none |

The DB itself annotates Strength Level results "Do not display this value as an unqualified percentile. Label it Community-lifter percentile" (`annotate_strength_reference_scope_v1`). The app card says "Nth percentile … among men who lift" (`strengthPercentileCard.ts:43-64`). **CONFIRMED.**

### 1.6 Rank bands (B078–B080)

`shared/capabilityRank.ts:69-104`: Prospect [0,20), JV [20,40), Varsity [40,60), Regional [60,80), State [80,95), National [95,99), World Stage [99,100]. Lower bounds are inclusive, upper bounds exclusive, and 100 is included (l.123-126). An invalid or missing value returns `null`, never Prospect (B080 satisfied, `UnscoredRankCard`).

- Rounding happens before banding: the DB rounds to 2 dp (`round(…,2)` in the aggregate) and TS rounds to 1 dp (`strengthPercentile.ts:211`). Scratch: a raw 19.96 becomes 20.0, which bands as JV instead of Prospect. TS single-lift results are not banded; only DB muscle scores are. Impact is small. **CONFIRMED.**
- Bands are applied only to DB muscle scores (`capabilityRank.ts:321,331`, `CapabilityRank.tsx:128`).

### 1.7 Muscle-region aggregation (B082–B088)

`aggregate_muscle_strength_v1` (SQL, STABLE) takes each exercise percentile, clamps it to [1,99] and converts it to a logit latent (÷1.702). The latent is multiplied by a role "signal transfer":

- primary: `0.70+0.30·cw`
- secondary: `0.25+0.60·cw`, capped at 0.80
- stabilizer: `0.05+0.35·cw`, capped at 0.35

The weighted mean uses the weight `mapping_conf·obs_conf·√cw·role` (1 / 0.75 / 0.35), with redundancy decay `0.55^(k−1)` within a movement pattern. Confidence is `min(0.98, 1−e^(−1.25·Σw))`. The client region shows the single muscle with the highest confidence, not a blend (`capabilityRank.ts:317-337`).

- **B083:** duplicates are collapsed per exercise_id (keeping the highest confidence, see EN-01). Correlated variants are decayed only when they share `movement_pattern`.
- **B084/B085:** role and contribution are kept separate. But the "muscle percentile" is a latent **shrunk toward 50**, not a reference percentile. A P95 lift gives a secondary muscle (cw 0.4) about P81; stabilizers sit near P50–55 (DB trace: bench P80 gives infraspinatus 53.91, serratus 55.11).
- **Ceiling:** anchors top out at P95 and the largest primary `contribution_weight` is 0.98, so transfer ≤ 0.994 and the best reachable muscle score is about 94.9. National and World Stage are unreachable. DB trace: bench 140 kg at bodyweight 65.77 gives exercise `above_range` 95.00 and muscle 94.79. **CONFIRMED.**
- **Superseded on the app side (D-016, 30 September 2026):** the app aggregates on the server (`server/muscleAggregation.ts`), the SQL above transcribed and pinned to its recorded outputs, plus directness: the muscle's contribution weight as a share of the exercise's mover contribution, multiplying the weight and ordering the lifts within a movement pattern. The database function is unchanged and no longer called by the app.
- **B086:** no side data reaches this path. **B087:** unranked lifts are listed by reason (`supabaseStrengthProfile.ts:253-261`). **B088:** in pending state the map shows coverage colours with a status line (`StrengthGenomePanel.tsx:651-656`). Whether that still misleads is a HYPOTHESIS.

### 1.8 Numeric trace: same lift, two routes (B081, B017)

Barbell Bench Press, male, bodyweight 65.77 kg, load 81.65 kg, no RIR. TS: `resolveStrengthPercentile` fed the live curve (anchors 0.5/1.0/1.25/1.5/2.0 ×BW at P5/20/50/80/95, cap 0.82). DB: `score_strength_input_v1('03c880ed-…',65.77,'male',81.65,'kg',r,null)`.

| reps | TS e1RM | TS pct | TS conf | DB method | DB e1RM | DB pct | DB conf |
|---|---|---|---|---|---|---|---|
| 1 | 81.65 | 49.0 | 0.82 | brzycki_SL | 81.650 | 48.97 | 0.82 |
| 3 | 88.13 | **60.8** | 0.82 | brzycki_SL | 86.453 | **57.74** | 0.82 |
| 5 | 93.56 | **70.7** | 0.80 | brzycki_SL | 91.856 | **67.59** | 0.82 |
| 8 | 102.39 | 81.7 | 0.65 | blend | 101.359 | 81.23 | 0.80 |
| 10 | 108.87 | 84.7 | 0.55 | blend | 108.867 | 84.66 | 0.76 |
| 12 | 115.94 | 87.9 | 0.45 | epley_SL | 114.310 | 87.14 | 0.70 |
| 13 | refused (`repetitions_out_of_range`) | — | — | epley_SL | 117.032 | 88.38 | 0.60 |
| 140 kg × 1 | refused `above_highest_anchor` (censoredAt 95) | — | — | — | 140 | 95.00 (`above_range`, censored) | 0.82 |

The TS/DB parity test fixes only `measuredOneRmKg` (`server/strengthPercentile.age.test.ts:31`), which is the one case where the estimators agree. At 3 reps the Body Lab rank (DB, 57.74 → Varsity before muscle transfer) and the record card (TS, "61st percentile") describe the same lift differently.

---

## 2. Muscle Effect (§6)

### 2.1 Modules

| File / object | Responsibility | Version id | Consumers |
|---|---|---|---|
| `client/src/lib/exerciseGenome.ts` | Exercise-level "fingerprint" (hypertrophy, strength, power, stability, mobility, sfr, skill, practicality) and a per-muscle profile (contribution, mechanicalLoading, longLengthLoading, peakContraction, stabilizationDemand, fatigueContribution, tier). Also `analyzeExerciseContext` (redundancy, "marginalValue" = 100 − redundancy) | none | exercise detail, stack analysis |
| `client/src/lib/muscleTargetingModel.ts` | Targeting score from a role prior plus mechanics signals | none | exerciseGenome |
| `client/src/lib/stackMuscleAnalysis.ts` | Stack involvement per muscle, normalised to the most-involved muscle (l.68-75) | none | `StackAnalysisPage.tsx:182-193` |
| `client/src/lib/sessionVolume.ts`, `weeklyVolume.ts` | Direct sets and supporting sets (×0.5) against 6/12-set bands | none | StackAnalysisPage, WeeklyMuscleVolumePanel |
| `client/src/lib/evidenceTraceability.ts` | `logicCalibration` constants (l.28-~300), each labelled with a `LogicValueKind` | none | all of the above |
| **SQL** `muscle_effect_v1` → `muscle_effect_v1_30`; versions up to `muscle_effect_v1_52` (`muscle_effect_scoring_versions`, 39 rows, all `beta`); `exercise_muscle_effect_priors` (355 rows, all `provenance_tier = mechanistic`, 105 with a study) | Workout-level effect with effort, ROM, power and contraction modifiers. Missing RIR uses an explicit effort factor of 0.72 (`muscle_effect_effort_v1`) | `muscle_effect_v1_1…v1_52` | **no consumer in the repo** (grep `muscle_effect` hits docs only) |

### 2.2 Dimensions (B089)

| Dimension | Scale | Computed in | Inputs |
|---|---|---|---|
| contribution / involvement | 0–100 relative (not sets) | `muscleTargetingModel` → `exerciseGenome.getMuscleProfile` | catalog tags, role, mechanics heuristics |
| mechanicalLoading | 0–100 | `exerciseGenome` | contribution + 6 if the strength fingerprint > 75 |
| longLengthLoading | 0–100 | `exerciseGenome` | contribution − 3 if the resistance bias is Lengthened, otherwise ×0.6 |
| peakContraction (shortened) | 0–100 | `exerciseGenome` | same pattern (×0.58) |
| stabilizationDemand | 0–100 | `exerciseGenome` | role base + stability × multiplier |
| fatigueContribution, fatigue.{local,systemic,grip,axial,technical} | 0–100 | `exerciseGenome` | fingerprint heuristics |
| hypertrophy / strength / power fingerprint | 0–100 | `exerciseGenome.getFingerprint` | quality tags, equipment and regex |
| effective volume | direct sets + 0.5 × supporting sets | `sessionVolume.ts:63-86`, `weeklyVolume.ts:29-53` | planned set count parsed from the prescription (default 3) |

- **B090/B092/B093:** client dimensions are exercise-level only. Reps, load, RIR and ROM do not change them; only set count feeds volume. **CONFIRMED.**
- **B091/B117:** there is no logged per-muscle exposure anywhere in the client. Coverage and volume read the plan (`weeklyVolume.ts`, `analyzeSplitStack`). `trainingWeekSummary.ts` counts only sessions and sets. Planned and logged are "separate" only in the sense that logged exposure is never computed. **CONFIRMED.**
- **B095:** three role conventions exist. `stackMuscleAnalysis` uses 1 / 0.65 / 0.4 (`evidenceTraceability.ts:218-222`). Volume counts every secondary as 0.5 with no stabilizer distinction. Split coverage uses 56 / 24 points. Stabilizer means "secondary with bracing quality and abs/obliques/lowerBack" (`exerciseGenome.ts` getMuscleProfile). **CONFIRMED.**
- **B097:** no tonnage or volume-load is computed in the app (grep). Not applicable. **CONFIRMED.**
- **B101:** all client coefficients are grouped under the "planning estimate" kind with general sources (`evidenceTraceability.ts` entry `relative-model-calibration`). There is no provenance per coefficient. DB priors are all tagged `mechanistic`. **CONFIRMED.**

---

## 3. Coverage (§7.1)

| File | Responsibility | Consumers |
|---|---|---|
| `client/src/lib/splitStackAnalysis.ts` | Hard-coded split targets (l.13-21); tag points 56 primary / 24 support per exercise (l.31-34); per-muscle score capped at 100; global score = mean of `min(score/target,1)` (l.54); state gap below 65% of target | `RateStackPanel.tsx:110`, `DayExercisePicker.tsx:88-91` |
| `client/src/lib/stackCoverageVisual.ts` | Bands short/near/covered/heavy (l.44-49), bars, `deltaToTarget = score − target` (l.77), headline | RateStackPanel, StackAnalysisPage, picker, stackTips |
| `client/src/components/StackAnalysisPage.tsx:186-193` | **Different score:** `analyzeWholeStackMuscles().involvement` (relative 0–100) set against the same targets | Stack analysis overlay |
| `client/src/lib/stackQualityCoverage.ts` | Counts quality tags against sport-register demands (literature-derived only) | StackAnalysisPage |

- **B108:** targets depend only on the split label. Goal, schedule, sport (apart from the fixed "Sport Transfer" split) and user preference have no effect. There is no target revision (B109). **CONFIRMED.**
- **B110/B113:** contribution is a tag count; **set count is ignored** (the `involvement()` function). Oversupply cannot compensate another muscle in the headline score because the ratio is capped per muscle (B112 satisfied for this model). Surplus shows only as the "heavy" band. **CONFIRMED.**
- **B111:** targets are all non-zero constants. `analyzeSplitStack` returns score 0 for an empty requirement list. No division by zero. **CONFIRMED.**
- **B114/B115:** summary and detail use different formulas (next item). **CONFIRMED.**
- Trace (scratch, Legs split, real catalog):

| Stack | adductors: rate panel / analysis page | hamstrings: rate / page | quads: rate / page |
|---|---|---|---|
| Back Squat + RDL | **−11 / 0** | −19 / −28 | −24 / −26 |
| + Leg Extension | +13 / +5 | −19 / **−43** | +20 / −6 |
| Goblet Squat, RDL, Seated Leg Curl, Standing Calf Raise | **−11 / −7** | +25 / +6 | −24 / −37 |

On the analysis page, adding a quad exercise worsened the hamstring gap from −28 to −43, because involvement is relative to the most-involved muscle, so the model is non-monotonic. The rate panel's adductor gap of −11 (= 35 − 24) matches one number from the walkthrough. Tying the "15" to this divergence is a HYPOTHESIS.

---

## 4. Recommendations (§7.2)

| File | What it ranks | Eligibility (B118/B120) | Ranking inputs (B119) | Tie-break (B126) | Reason codes (B123) |
|---|---|---|---|---|---|
| `client/src/lib/pickerRanking.ts` + `DayExercisePicker.tsx:70-91` | Add-exercise list | Split scope toggle, a manual equipment filter defaulting to "all", and a muscle filter. **The athlete's equipment profile is not applied** (`Home.tsx:1629` passes the full catalog) | Search relevance, then tier (primary tag on the worst gap / secondary tag / other), then gap rank | input index (catalog order) | `fillsGap`, `supportsGap`; `pickerRowFacts.ts` |
| `analyzeSplitStack` suggestions (`splitStackAnalysis.ts:45-53`) | 1 candidate for each of the first 2 gaps, plus a swap cue | split match, not already in the stack; no equipment check | tag points | name | `swapCue` text |
| `movementRecommendations.getMovementRecommendations` (Matches, `Home.tsx:453`) | Catalog for one sport action | **None**: no equipment or exclusion inputs | regex signals × quality tags (2.25), muscle alias matches (1.75), bonuses, sprint-evidence adjustment, registry adjustment ≤ 1.4 | exercise id (l.267) | `rationale` string chosen by rule order (l.146-162), `strengths`/`limitations` text; no stable codes |
| `getSportSession` (l.270-305) | Session list | equipment profile filter (l.280) | score + goal lift + hierarchy boost + greedy diversity penalties | exercise id | as above |
| `segmentPrioritySuggestions.ts` | Progression "review" muscles | available-equipment filter | primary-muscle match | — | rationale text |

- Marginal effect under the coverage model (B119) is **not** used anywhere. Every path matches tags. `exerciseGenome.analyzeExerciseContext.marginalValue` is `100 − redundancy`, not a coverage delta. **CONFIRMED.**
- Determinism: confirmed by running `getMovementRecommendations` twice for wrestling-14 and getting identical order. After an add, gaps are recomputed from `activeWorkout` (`DayExercisePicker.tsx:88-91`; B127 satisfied for tag gaps).
- The "match" percentages are synthesized from counts, e.g. `muscleMatch = 40 + 16·n`, `overall = 50 + 3.55·score` capped at 99 (`movementRecommendations.ts:164-198`), and are rendered in `Home.tsx:264-281`. **CONFIRMED.**
- B122: two catalog names are duplicated (Romanian Deadlift 42/186, Dumbbell Pullover 24/65; scratch). Name-keyed maps resolve to the last id (`strengthPercentileCard.ts:12`, `workoutStrengthRecord.ts:42`). **CONFIRMED.**

---

## 5. Sports transfer (§8)

Pipeline:

1. The sport id maps to the demand keys in `hierarchicalSportModel.ts` seeds (wrestling l.57). Every listed demand gets the same active priority of 0.78 and is marked `literature-derived`. Unlisted demands are `model-estimated`.
2. An action (`sportMovementDatabase.ts`, 425 profiles) maps to **signals** by regex over its free text (`movementRecommendations.ts:11-26,123-127`) and to **muscles** by alias substring (l.129-132).
3. Candidates are scored on overlap between signals and exercise quality tags plus muscle overlap (l.250-268).
4. Evidence: an action-level `evidenceConfidence` and `sources` in `enrichedSportMovementDatabase.ts`; the registry flag "Registry-verified" from `sport_exercise_recommendations` (202 rows, confidence 0.64–0.98, 35 rows with an effect size); `sprintPowerEvidence`.

Separately, the DB holds `sport_movements` (51), `movement_demands` (738) and `exercise_transfer_evidence` (282), which the app does not read. It reads only `sport_exercise_recommendations` via `server/supabaseSportProfile.ts:164-169`.

**Trace: wrestling-14 "overhook/whizzer"** (scratch, real modules):

- Text: "downward and inward shoulder-arm **press**ure … **posterior** deltoid … **grip** … rotational **clinch** … scapular **stabiliz**ers" (`sportMovementDatabase.ts:489-499`).
- Signals: `rotation, push, pull, grip, bracing, posterior`. The **push** signal comes from the substring "press" in "pressure". The **posterior** (hip-extension) signal comes from "posterior deltoid" (B130).
- Muscles: chest, frontDelts, rearDelts, shoulders, obliques, glutes, adductors, abductors, lats.
- Top 10: Split-Stance Cable Chest Press, Half-Kneeling Cable Chest Press, Alternating Landmine Press, Kettlebell Clean and Press (all 20.00), then Cable Wood Chop, Landmine Rotation, Landmine 180, Landmine Thruster, Landmine Split Jerk, Cable Resisted Push-Up (19.50). **Every row shows "99 match".** Ties are broken by id.
- The enriched record's own `recommendedExercises` (single-arm cable row, landmine rotation, suitcase carry, Pallof press; `enrichedSportMovementDatabase.ts:746-790`) are not used as ranking input. Only Landmine Rotation reaches the top 10 (#6).
- Evidence types (B133): `EvidenceType` exists at the demand level but is not carried per candidate. No causal transfer percentage is claimed; the score is labelled "match" (B134 partially satisfied).
- B135, B136 and B137 were not traced at runtime.

---

## 6. Duplicated calculations (B017) and engine versions (B287)

| Calculation | Implementations | Agree? |
|---|---|---|
| e1RM | E1–E5 (§1.2) | **No.** Up to 3.7% apart at 5 reps (mean vs Brzycki). Rep limits 12 vs 15. RIR null is confidence-penalised only in SQL |
| Curve placement | TS `placeOnCurve` vs SQL `get_beta_strength_percentile_v1_core` | **No.** Tails: censored in TS vs scored at the anchor in SQL. Equal-value ties: min vs midpoint. Rounding: 0.1 vs 0.01. Minimum anchors: 2 vs 3 distinct percentiles. Monotonicity: TS sorts by value, SQL rejects. Ladder choice: TS relative > absolute by length vs SQL `method_rank`. Aliases and multipliers: SQL only. `kg_1rm`: SQL only. `confidence_modifier`: SQL only |
| Age factor | TS `AGE_ANCHORS/AGE_FACTORS` vs SQL `strengthlevel_age_factor_v1` | Yes: identical tables and interpolation, pinned by test |
| Age at lift | server `ageYearsAt` (exact DOB, UTC); `registryReference.profileAgeYears` (UTC year difference); `normsCohort.ageAtLift` (local year difference, 5–100); `StrengthGenomePanel.ageFromBirthYear` (**today**) | No |
| Profile status rule | SQL `score_strength_profile_v1` vs `supabaseStrengthProfile.profileStatus` | Yes (transcribed) |
| Region mapping | `capabilityRank.muscleCanonicalNameToRegionId` (DB muscles), `strengthGenomeDefinitions.catalogMuscleRegionIds` (catalog tags), `strengthObservationRoutes` (aliases) | Different by design: rank vs "has a record" |
| Coverage per muscle | `analyzeSplitStack` (tag points) vs StackAnalysisPage (relative involvement) vs `sessionVolume`/`weeklyVolume` (sets) | **No** (§3 trace) |
| Role weights | 1/0.65/0.4; 1/0.5; 56/24 | No |
| Band labels | `normsReference.percentileBandLabel`, `powerliftingReference.decileBandLabel`, Piper `comparison` | Similar. The Piper top band is "at or above 95th", the others "above" |
| Powerlifting deciles | Hand-coded 18–35 (`powerliftingReference.ts:56-67`) vs DB rows | Fallback only |
| Muscle effect | client `exerciseGenome` vs DB `muscle_effect_v1_*` | Unrelated models; the DB engine is unused |
| Sport movements | client TS (425) vs DB `sport_movements` (51) | Separate datasets |

Version identifiers present:

- `strength_beta_v1`: TS, SQL aggregate and profile outputs, `strength_scoring_versions`.
- `strength_beta_v2`: SQL estimator, `score_strength_observation_v1` output, `strength_scoring_versions`.
- `strength_beta_v2_age_adjusted`: `score_strength_v2`.
- `strengthlevel_compatible_v1` (estimator), `strengthlevel_age_factor_v1`.
- `sg_capability_rank_v1`, `sg_rank_palette_v2`, `muscle_aggregate_structural_v1`.
- `muscle_effect_v1_1…v1_52`.
- `"epley"`, a method name with no version.
- Client muscle effect, coverage, recommendation and sport-transfer engines: **no version id**.

---

## 7. Units (B242, B243)

| Site | Constant | Use |
|---|---|---|
| `client/src/lib/weightUnits.ts:3` | 0.45359237 | display ↔ kg (all client conversion goes through here unless listed) |
| `shared/strengthPercentile.ts:37,323` | 0.45359237 | kg → lb for `lb` curves (calculation) |
| `shared/normsReference.ts:140,161` | 0.45359237 | kg → lb for registry rows (calculation) |
| `client/src/lib/progressiveTraining.ts:111` | 0.45359237 | canonical load (calculation) |
| `client/src/lib/useAthleteSync.ts:171` | 0.45359237 | kg → entry unit for upload, rounded to 2 dp |
| `client/src/components/AthleteBaselineQuiz.tsx:43` | 0.45359237 | bodyweight unit toggle |
| `client/src/components/ProgressionReviewPanel.tsx:26` | 0.45359237 | bodyweight to kg |
| SQL `estimate_e1rm_v1`, `estimate_e1rm_strengthlevel_v1`, `estimate_weighted_bodyweight_strength_v1`, `get_strength_percentile_v1_core`, `resolve_strength_measurement_v1`, `score_loaded_distance_strength_v1`, `score_timed_hold_strength_v1`, `score_weighted_pull_chin_v1` | 0.45359237 | lb → kg |
| SQL `get_beta_strength_percentile_v1_core`, `estimate_e1rm_*`, `get_strength_percentile_v1_core` | 2.20462262185 | kg → lb (relative error ≈ 6×10⁻¹³, effectively exact) |
| SQL isometric scorers | 4.4482216153 (lbf→N), 9.80665 (g) | force |

- **No inexact constant (2.2, 2.2046, 0.4536, 0.454) is used in any calculation.** The only `2.2` is test data (`client/src/lib/powerliftingRank.test.ts:79`). **CONFIRMED** (repo grep + `pg_proc` regex).
- Rounding happens at storage, not only at display. `loadKg`/`bodyMassKgAtTest` are `decimal(…,2)` (`drizzle/schema.ts:443-453`, `server/strengthGenome.ts:42-44`), so 100 lb is stored as 45.36 rather than 45.359237 (B242). The round trip breaks band edges (EN-15). **CONFIRMED.**
- B243: exact constants everywhere. Equivalence breaks through the unitless device history (EN-08) and storage rounding, not through constants.

---

## Material findings

| ID | Sev | B-IDs | Status | Finding and evidence | Suggested remediation |
|---|---|---|---|---|---|
| EN-01 | P1 | B061, B063, B083 | CONFIRMED | The muscle-rank aggregation keeps the **highest-confidence**, not the best, observation per exercise. Lower-rep sets carry higher confidence, so logging a lighter triple erases a strong 10-rep set. Live: `score_strength_profile_v1(80,'male',[bench 100×10])` gives chest 84.67; adding 80×3 gives 27.35 (`aggregate_muscle_strength_v1` `dedup` CTE) | Pick a documented best-performance observation per exercise (e.g. max percentile among eligible ones) and carry confidence separately. Add a monotonicity fixture |
| EN-02 | P1 | B061, B062, B063 | CONFIRMED | Muscle ranks see only the **newest 30** lifts (`muscleRankLifts.ts:33,56-76`), and a workout contributes its **heaviest** set rather than its best e1RM (`workoutStrengthRecord.ts:134-139`). An older best lift silently drops out (scratch) | Select one best eligible observation per exercise server-side, independent of recency, and return source observation ids |
| EN-03 | P1 | B017, B056, B057, B075 | CONFIRMED | The single-lift card (TS: mean E+B, ≤12 reps, tails censored) and the Body Lab ranks (DB: Strength Level Brzycki/blend/Epley, ≤15 reps, tails scored at P5/P95) disagree on the same lift. 180 lb × 3 at 145 lb: 60.8 vs 57.74. 140 kg × 1: refused vs 95.00 → muscle 94.79 (§1.8). The parity test pins only the 1RM case (`server/strengthPercentile.age.test.ts:31`) | Choose one estimator and one censoring rule and implement them once, or generate both from one spec. Add multi-rep and out-of-range parity fixtures against the DB |
| EN-04 | P1 | B287, B040, B288 | CONFIRMED | The version label does not match the method. Profile and aggregate outputs say `strength_beta_v1`, whose record says "mean of Epley and Brzycki… censor tails". The live path uses `estimate_e1rm_strengthlevel_v1` (self-labelled `strength_beta_v2`), and `score_strength_observation_v1` returns `scoring_version: strength_beta_v2` while its parent reports v1 | Give the live DB path its own version key, reflect it in `strength_scoring_versions`, and surface it in `MuscleProfileResult.scoringVersion` |
| EN-05 | P1 | B064, B065, B066, B031 | CONFIRMED | Gym logs of Back Squat, Barbell Bench Press and Conventional Deadlift are ranked against **competitive powerlifters** (DB `source_role = excluded`) using an Epley e1RM. When a birth year is set, this rank takes precedence over the community route (`StrengthGenomePanel.tsx:228,268`). Outside 18–35 without the registry it falls back to the 18–35 table (`powerliftingReference.ts:242-244`), and it uses today's age (`StrengthGenomePanel.tsx:210,337-339`) | Keep the competitor table on the strict declaration path only. Use the community route (or unsupported) for gym logs. Use age at lift |
| EN-06 | P1 | B059, B093, B253 | CONFIRMED | RIR is never passed. No client caller sets `repsInReserve`, and muscle-rank observations omit `rir` (`supabaseStrengthProfile.ts:201,211`). Missing RIR equals 0 (maximal effort) in E2/E4/E5 (`strengthPercentile.ts:171`) | Thread recorded RIR/RPE into both routes. Expose "effort unknown" explicitly and decide whether it should widen uncertainty or refuse |
| EN-07 | P1 | B049, B050, B244, B025 | CONFIRMED (code, DB trace); user behaviour HYPOTHESIS | Dumbbell load convention cannot be represented. There is no per-hand/total field or UI wording. The DB policy expects ONE dumbbell (`per_implement`). The sync hardcodes `total_external_load` (`useAthleteSync.ts:176`). TS ignores `load_semantics`. Entering the pair total turns 43.10 into 95.00 (DB bench trace) | Add an explicit load convention to set and observation entry. Normalise per policy. Record the convention with the observation |
| EN-08 | P1 | B048, B243, B024 | CONFIRMED | Device sets store weight with **no unit**. All history is re-read in the current display unit (`workoutStrengthRecord.ts:116-145`, callers `StrengthGenomePanel.tsx:559`, `ProgressOverviewPanel.tsx:96`, `useAthleteSync.ts:156`). Switching lb→kg in profile edit (`Home.tsx:1105`) turns 225 lb into 225 kg (scratch: 102.06 kg vs 225 kg). Tracker sets with a null unit default to lb (`unifiedStrengthHistory.ts:32`) | Stamp the entry unit on every set when it is logged. Migrate existing device history using the unit in effect at logging time where recoverable |
| EN-09 | P1 | B051, B052, B246 | CONFIRMED | Bodyweight exercises ignore added load: Pull-Up +20 kg × 5 and bodyweight × 5 both give 15.71 (`score_strength_input_v1` → `score_strength_rep_observation_v1`). Unloaded bodyweight lifts never reach muscle ranks (`muscleRankLifts.ts:61`). Assistance is free text only (`routers.ts:394`) | Route weighted bodyweight lifts to the existing `score_weighted_pull_chin_v1` family or return unsupported. Add a numeric assistance convention |
| EN-10 | P1 | B114, B115, B017 | CONFIRMED (divergence); B115 link HYPOTHESIS | The same split targets are scored by two formulas: rate panel and picker use tag points; `StackAnalysisPage.tsx:186-193` uses involvement relative to the most-involved muscle. Legs stack: adductors −11 vs 0/−7; hamstrings −19 vs −28, then −43 after adding Leg Extension (non-monotonic) | Compute one coverage snapshot and feed both surfaces from it. Retire the relative-involvement scoring for target gaps |
| EN-11 | P1 | B108, B109, B110, B117, B091 | CONFIRMED | Coverage ignores set count (`splitStackAnalysis.ts:31-34`). Targets are constants per split label (l.13-21) with no revision. No logged per-muscle exposure exists: every coverage and volume surface reads the plan | Define the target source and revision. Include the prescription dose. Add a separate completed-exposure computation from logged sets |
| EN-12 | P1 | B118, B119, B120, B123 | CONFIRMED | Recommendations are tag matches, not a marginal effect under the coverage model. The picker gets the full catalog (`Home.tsx:1629`) and Matches has no equipment input (`Home.tsx:453`, `movementRecommendations.ts:250`), so the saved equipment profile is not a hard constraint. Reasons are prose, not codes | Filter candidates by the equipment profile and exclusions first. Rank by the delta under the coverage snapshot. Emit stable reason codes |
| EN-13 | P1 | B129, B130, B132, B138 | CONFIRMED | Action demands come from regex over prose. For the whizzer, "pressure" yields **push** and "posterior deltoid" yields **posterior** (hip extension). The top 10 are chest presses, landmine press/thruster/jerk, all showing "99 match". The curated `recommendedExercises` for the action are unused (§5) | Map actions to structured demand dimensions (the enriched `jointActions`, `primeMovers`, `contractionRoles` already exist). Use word-boundary or structured matching. Stop capping every result at 99 |
| EN-14 | P1 | B066, B139, B140 | CONFIRMED (data + scratch) | All 880 approved **female** research-grade rows use unit `lb_10rm`. `kgToUnit` accepts only `kg`/`lb` (`normsReference.ts:159-163`), so every female comparison returns `unsupported_measurement_protocol` | Normalise the unit in the registry or teach `kgToUnit` the `lb_<n>rm` family. Add a female fixture |
| EN-15 | P1 | B242, B079, B044 | CONFIRMED (scratch) | Piper bodyweight bands have gaps (≤135 then ≥135.1, … `piper2021PreacherCurlReference.ts:23-32`), and body mass is stored in kg at 2 dp. 150 lb round-trips to 150.0025 lb, `bands.find(...)!` returns undefined, and `TypeError: reading 'cutPoints'` is thrown in the StrengthGenomePanel render path (l.92-96) when a full Piper declaration exists | Use half-open numeric bands with no gaps. Keep full precision (or the entry value and unit) for comparisons. Guard against no band |
| EN-16 | P1 | B076, B078, B085, B084 | CONFIRMED (data + trace) | Muscle "percentiles" are role-shrunk latents, not reference percentiles. Anchors top at P95 and primary contribution weight is ≤ 0.98, so the best reachable score is ≈ 94.9 (trace 94.79). **National and World Stage are unreachable**, and secondary or stabilizer muscles are pulled toward 50 | Label the muscle score as a product score, or re-map the bands. Show stabilizer-only regions as insufficient rather than ranked |
| EN-17 | P2 | B101, B068, B042 | CONFIRMED | Aggregation coefficients (0.70/0.30, 0.25/0.60, 0.05/0.35, redundancy decay 0.55, 1.702, 1.25, default confidences 0.65 and 0.5) have no recorded source. The server invents a 0.5 confidence when it is missing (`supabaseStrengthProfile.ts:245`) | Record each coefficient's kind and source. Refuse rather than default missing confidence |
| EN-18 | P2 | B017 | CONFIRMED (code) | The TS curve route ignores `confidence_modifier`, `load_semantics`, alias curves with `e1rm_multiplier` (the view has none), and the `kg_1rm` unit. It picks the ladder differently from SQL and has no monotonic check (`supabaseStrengthCurves.ts:59-149`) | Fold into EN-03: one resolver, or an exported view that already applies policy and aliases |
| EN-19 | P2 | B044, B079 | CONFIRMED | Rounding precedes banding: TS to 0.1 (`strengthPercentile.ts:211`), DB to 0.01. Scratch: 19.96 becomes 20.0 | Round only at display. Band on the raw value |
| EN-20 | P2 | B031, B070 | CONFIRMED | Four age-at-test computations with different semantics (§6) | One shared function with a documented date and timezone rule |
| EN-21 | P2 | B017, B060, B061 | CONFIRMED | Five e1RM implementations. The trend compares first vs latest (warm-up tracker sets included). The progression Epley has no rep cap | Consolidate on one versioned estimator. Add set type (warm-up/working/failed) to the log |
| EN-22 | P2 | B089, B090, B094, B095, B101 | CONFIRMED | Client muscle-effect dimensions are exercise-level 0–100 heuristics with no prescription or observed modifiers. Three role conventions exist. The DB `muscle_effect_v1_*` engine (52 versions, explicit RIR default) is not consumed | Decide which engine is canonical, document the scales, and unify the role weights |
| EN-23 | P2 | B064, B076 | CONFIRMED | The beta card says "percentile among men who lift" (`strengthPercentileCard.ts:43-64`). The DB requires the label "Community-lifter percentile" for this self-selected cohort (`annotate_strength_reference_scope_v1`) | Name the cohort in the card and the region detail |
| EN-24 | P2 | B122, B255 | CONFIRMED | Duplicate catalog names (Romanian Deadlift 42/186, Dumbbell Pullover 24/65). Name→id maps pick the last id, so id 42 logs use 186's curve and mappings | Resolve by catalog id end to end. Rename or merge the duplicates |
| EN-25 | P2 | B042, B134 | CONFIRMED | Match breakdown "percentages" are synthesized from counts (`movementRecommendations.ts:164-198`) and rendered (`Home.tsx:264-281`) | Show ordinal or categorical reasons instead of uncalibrated percentages |
| EN-26 | P2 | B071 | CONFIRMED (ratio); bias HYPOTHESIS | Bodyweight normalisation is a plain e1RM/BW ratio in TS (`strengthPercentile.ts:320-322`) and SQL (`…_core` `v_observed := p_e1rm_kg / p_bodyweight_kg`). Whether the Strength Level source is ratio-based was not verified | Verify against the source's own bodyweight model before release. Document the chosen model |
| EN-27 | P2 | B048, B242, B024 | CONFIRMED | Manual observations keep only kg at 2 dp. The entry unit and exact value are lost (`drizzle/schema.ts:443-453`) | Store the entry value and unit, and derive normalised kg at full precision |

---

## Not verified

- **UI runtime.** I did not drive the app in a browser or on iOS. Findings about rendered screens (precedence of the powerlifting rank, the Piper render crash, coverage-colour loading states) come from code paths and scratch unit calls, not observed screens.
- **B115 exact numbers.** I could not reconstruct the walkthrough's plan state. The −11 matches the rate-panel formula, but "15" is not reproduced.
- **What athletes actually enter for dumbbells** (per hand or pair) is unknown. No production data was read, and user tables were deliberately not queried.
- **VOLATILE SQL was not executed.** That includes `muscle_effect_v1_*`, `record_strength_entry_*`, `recalculate_*` and the regression/validation matrices. Muscle-effect DB behaviour was read from source only.
- **External sources were not checked.** I did not verify the Strength Level age table, the curves, or the van den Hoek and Piper values against their publications (B057, B068). Transcriptions were compared only between code and DB.
- **Not traced:** Supabase `athlete_strength_entries` (its generated `load_kg`, and whether anything consumes it), `score_strength_profile_v2`, the research `get_strength_percentile_v1`, B135–B137, and the non-sport or general-training path.
