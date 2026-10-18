# Phase A: what exists, and how the atlas maps onto it (16 Oct 2026)

These are the brief's §8 "first reconcile existing ownership" results, read from the code at `b237f42` and from read-only queries against Supabase project `qiccnqkypbhlwpmjcsri`. The six raw reconnaissance reports were the inputs. This file keeps what decides the design.

## Where things actually live

| Brief assumes | What exists | Consequence |
|---|---|---|
| Server-side plans, sessions, sets, drop-set segments | **Device `localStorage` only.** Plans: `gym-optimizer-workout-plan-v1` (Home.tsx). Logged workouts: `sports-genome-device-workout-history-v1` (`DeviceWorkoutSession[]`, `deviceWorkoutLog.ts`). The MySQL tables `workoutSessions` / `workoutSessionExercises` / `workoutSetLogs` exist but nothing writes them (`DATABASE_URL` is unset in production, `WorkoutExecutionPanel` is never rendered). Supabase has no session, set, bout or segment table. | Exposure is **calculated on demand on the device**, from the same records Home, Plan, Review and Progress read. There is nothing on a server that a ledger row could foreign-key to, so **no `exposure_ledger` table is created**: shipping `source_bout_key` without a real target is exactly the "dangling key" the brief forbids. |
| Server authenticates the caller | No server-side identity in production: `ctx.user` is always null (no `DATABASE_URL`), the server never verifies a Supabase JWT, `auth.users` holds 0 rows, and `directWorkspaceAccess = true`. | Personal data (goals, measurements) lives on the device under the same account-scoped keys as the plan (`scopedKey`). The Supabase tables for goals and measurements are created with owner-only RLS so a future sync has a safe home, but nothing writes them yet. |
| An existing "Muscle Effect engine" to reuse | Two things carry the name: the client heuristic (`exerciseGenome.ts`, `muscleTargetingModel.ts`, 0–100 per exercise, no sets) and the uncalled SQL `muscle_effect_v1_*`. The weekly numbers the app actually shows come from a third rule in `weekReview.ts`: 1.0 per primary tag, 0.5 per secondary tag (`week_review_v1`). | The atlas **reuses the records and identities** the engines read (catalog ids, session/exercise/set structure, drop-set stages, `isCompletedSet`, `parseSetCount`, the plan store) and **sits beside** `week_review_v1` as its own versioned accounting model (`specialization_exposure_v1`). It does not change `week_review_v1`, the genome, or the strength ranks. |
| Muscles at node level | Catalog: one key, `forearms` (14 primary, 107 secondary). Body map: `forearms` (flexor, extensor, ulnar compartments) and a shape labelled `brachioradialis` that is really the radial extensor mass. Supabase `public.muscles`: `brachioradialis`, `forearm_flexors`, `forearm_extensors`. | 19 forearm **nodes** are added in a separate specialization catalog, each pointing at the existing catalog key it refines (`forearms`, `biceps`, `brachialis`) and the database muscle it refines. Existing broad history stays **region-level** unless an atlas mapping for that exercise id exists. |
| Exercise variants with grip, straps, orientation, wrist position | No variant model. Variants are separate catalog rows. Supabase `exercise_variants` has free-text grip/stance/angle only. | Each mapped catalog id gets one **default variant** record with explicit execution dimensions. A logged set can override the variable ones (side, straps). New catalog rows (ids 401+) are added for forearm actions the catalog cannot express at all. |
| Side per set | None. "Side" in the app means the front/back view. | New optional set field `side` (`left` / `right` / `both`), asked **only** on exercises the atlas maps as one-arm or either-arm. Two-handed implements are bilateral by definition, recorded on the variant. History with neither stays in an "unknown side" bucket. |
| Hold duration | None. Timed targets are text in the prescription, and sets are logged in reps. | New optional set field `holdSeconds`, shown as a "Seconds" box on hold exercises (dead hangs, farmer holds, pinches, carries) instead of reps. |
| Warm-up flag | None (the app logs work sets only). | The calculator excludes `warmup: true` if it ever appears. No logger control is added. |
| Stable bout and segment ids | Drop sets and their stages have stable ids. Standard sets have none and are addressed by index. | New sets get an id when created. For history, a bout id is derived from session, exercise and index. That is enough for an on-demand calculation, which is recomputed from the current records on every change rather than cached against old ids. |
| "This week" | Two meanings: calendar week (Monday 00:00, device time) for completed work; plan Week 1–3 (no dates) for Review. | Completed work uses calendar week, rolling 7 days or custom dates, in a named IANA time zone (DST-tested). Planned work is the plan week the athlete trains from (`trainingWeekFor`), shown with that label, because a plan has no dates. |

## Field-by-field adapter map

| Brief entity / field | Existing source | Adapter |
|---|---|---|
| Bout | `DeviceWorkoutExercise.sets[i]` in a completed `DeviceWorkoutSession` | `boutsFromSessions()`; id = `set.id`, else `${session.id}/${exercise.id}/${i}` |
| Segment | `DropStage` (drop sets) or the set itself | `stagesOf()` from `dropSets.ts`; a standard set is one segment |
| Completed | `isCompletedSet` (`completed && !skipped`), session `status: "completed"` | reused unchanged |
| Planned bout | plan week's day → entry → `parseSetCount(prescription)` | `boutsFromPlan()`; id = `plan/${week}/${dayKey}/${entryId}/${n}` |
| Exercise identity | `catalogId` (sessions since 6 Oct), else exact catalog name | resolved through the same rule as the tracker; name matches are labelled as such |
| Variant | none | `ExerciseVariant` per catalog id (`shared/specialization/regions/forearm/variants.ts`) |
| Side | none | `DeviceSetLog.side`, else the variant's structural laterality, else unknown |
| Straps | none | `DeviceWorkoutExercise.straps`, else unknown |
| Hold duration | none | `DeviceSetLog.holdSeconds` |
| Effort | `DeviceSetLog.effort` (`failure` / `not_to_failure`) | passed through; absent stays unknown (never defaults to failure) |
| Limiting factor (`limiting_factor`: target muscle / grip / other / unknown) | none | **Not asked, not recorded.** A question on every set is the questionnaire the brief rules out (§6: "avoid making every set entry a questionnaire"), and nothing the atlas counts would read the answer. Absent means unknown; never defaulted (not to target muscle, not to grip). |
| Lever arm (`lever_arm`, metres) | none | **Not recorded.** No exercise in the catalog defines one, and the brief (§8) allows it only for repeatability, never for muscle force; with a changing angle one number is not a torque curve. Absent means unknown; never defaulted. The elbow angle beside it is kept only where an exercise defines it (`ExerciseVariant.elbowAngleDeg`, `exercise_variants.elbow_angle_deg`). |
| Load | `weight` + `unit` + `loadConventionFor()` | `setWeightKg()` per segment; shown as external load, never as muscle force |
| Muscle node | `forearms` catalog key; `public.muscles` 3 forearm rows | `AnatomyNode.catalogMuscleKey`, `AnatomyNode.databaseMuscle` |
| Plan edit | `editDay`, `commitDay`, `writeIncomingDay`, `planWeeks` in Home | one new Home callback that writes an exact week and day |
| Goals, measurements | none | device stores under `scopedKey`; Supabase tables with owner RLS for later sync |

## Reused, extended, added

- **Reused unchanged:** catalog ids and exercise records, `isCompletedSet`, `stagesOf`, `parseSetCount`, `trainingWeekFor`, `scopedKey`, the plan store and its pure helpers, the exposure paint tokens, the sheet and modal-layer helpers, `holdPageBehind`.
- **Extended:** `DeviceSetLog` (`id` on creation, `side`, `holdSeconds`, `warmup` read and kept), `DeviceWorkoutExercise` (`straps`, and `perArm` when the tracker builds a one-arm exercise's sets per arm, 07-logger.md), `SetEntryMeasure` (`seconds`), the `Workspace` union (`specialization`), Body Lab's tabs, the Review muscle detail (a link), universal search (one destination), the exercise catalog (forearm rows 401–416, and fixes to rows 139–145 and 232, 05-mappings.md).
- **Added:** `shared/specialization/` (reference model, forearm content, rule version, calculator, time windows), `client/src/lib/specialization/` (adapters, stores, recommendations), `client/src/components/specialization/` (page, diagram, sheets), Supabase schema `specialization` (reference tables, goals, measurements), with RLS.

## Not touched

The strength percentile work on `main`, `strengthGenome*`, `capabilityRank`, `muscleAggregation` and its parity fixtures, `week_review_v1` arithmetic, the bottom navigation and its styling, and the logo.
