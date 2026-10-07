# Exercise expansion v1 — validation and release status

Brief: *Sports Genome — 50-exercise data and engine integration* (6 October 2026). Checked 7 October 2026 on branch `claude/training-day-navigation-workouts-83ro2c`.

## Release status

| Part | Status |
|---|---|
| App catalog, engines, planner, logger, history, search, media | **Integrated.** Ids 401-450 ship with the app; every check below passed on this branch |
| Database rows (exercise identity, muscle mappings, scoring policy) | **Prepared, not applied, not staging-verified.** Applying needs owner authorization (repository rule B009). Until then the server finds no row for 401-450, and a new exercise gets no curve rather than another exercise's (tested) |
| Research inputs | **Not complete.** 107 of the 161 muscle tags on the new records are authored estimates (32 records carry at least one), and 41 resistance curves are not established. The app uses them like any catalog tag; each is labelled per field in `evidence.json` and listed per record in `exercise-matrix.csv`. |
| Normative strength references | **Unavailable for all 50.** Routed to the explicit unsupported scoring policy; personal logging works normally |
| Photos | 12 of 50 have an exact-variation photo; 38 show the equipment placeholder (31: the source has no such photo; 7: a same-named photo shows a different setup) |

This is not a declaration of full completion: the authored-estimate muscle tags and unestablished curves are open research inputs, and the database rows are not applied.

## Dispositions (50)

| Disposition | Count |
|---|---|
| New record (ids 401-450, id = 400 + candidate number) | **50** |
| Alias of an existing record | 0 |
| Improvement to an existing record | 0 |
| Blocked | 0 |

The duplicate audit found no candidate that is the same exercise as an existing record. Each record's `distinctFrom` text names the nearest existing record and how it differs; for example, the Zercher Deadlift starts from the floor while the Zercher Squat (164) starts in a rack. Six requested names were made more specific, and each requested wording is kept as a search alias:

| Candidate | Requested | Canonical |
|---|---|---|
| E15 | Finger Curl | Barbell Finger Curl |
| E27 | Machine Lateral Raise — Unilateral | Unilateral Machine Lateral Raise |
| E30 | Hip Thrust Machine / Glute Drive | Hip Thrust Machine (alias Glute Drive) |
| E35 | Belt Squat — Loading Pin | Loading-Pin Belt Squat |
| E43 | Single-Arm Overhead Carry | Single-Arm Kettlebell Overhead Carry |
| E46 | Backward Overhead Sled Drag | kept; the ambiguous name was resolved to the Free Exercise DB "Sled Overhead Backward Walk" definition |

The database already holds an unmapped research row, "Neck Lateral Flexion Isometric" (band, manual or harness). It is broader than E07 and was not merged.

## Commands and results

Source and data checks (no browser):

| Command | Result |
|---|---|
| `pnpm check` (tsc) | exit 0 |
| `pnpm test` (vitest) | 374 files passed, 4 skipped; **3067 tests passed**, 6 skipped |
| `pnpm build` | exit 0 |
| `npx tsx scripts/exercise-expansion/diagnostics.ts` | 50 exercises, **0 validator errors** → `diagnostics.json` |
| `npx tsx scripts/exercise-expansion/migration.ts` | regenerates the prepared SQL; the parity test confirms the committed file matches the generator's output |

Expansion test files: `exerciseExpansion.validator.test.ts` (5), `exerciseExpansion.hazards.test.ts` (21), `exerciseExpansion.logging.test.ts` (14), `exerciseExpansion.migration.test.ts` (5). The full suite has no failing or newly skipped tests.

Runtime checks: Playwright on the production build (`pnpm build`, served from `dist/public`) at 320 px, 390 px and 1280 px, using a synthetic athlete and plan (no account data):

| Screen | Checked | Result |
|---|---|---|
| Exercise detail: Zercher Deadlift, Mechanics and Muscle Genome tabs | variation disclosure, "Logged as", "Kept apart from", no-curve message, figure | no overflow, no console errors |
| Active workout: Isometric Neck Lateral Flexion | Hold (s) box, Left/Right, entry note; a logged set stores `{seconds: "20", side: "left"}` | as expected |
| Active workout: Suitcase Carry | Weight per hand (kg) + Distance (m), side, no drop-set offer with its reason | as expected |
| Progress → recorded workouts (history) | `20 s hold · left`, `24 kg per hand · 30 m · left`, `40 lb assist × 8`, `CoC #1 × 5 · right`; none appears under strength progress | as expected |
| Body Lab → Wrestling → Hand fighting → Find exercises | movement context kept, no muscle filter; Dumbbell Forearm Pronation under *Muscle support (not counted)*; no neck exercise in any tier | as expected |
| Catalog list (search "carry") | five new carries listed; long names wrap clear of the add and favorite buttons (bounding boxes checked) | no collisions |
| Home focus | no raw muscle keys, `undefined` or `NaN` | clean |
| Train → Review, Week | "Neck extensors 11 direct", neck painted on the figure; new pattern rows (Neck lateral flexion, Forearm pronation, Neck extension) | no overflow, no raw keys |

Screenshots (scaled JPEGs) are in `screenshots/`. Exercise detail: `detail-zercher-mechanics-{320,390}.jpg`, `detail-zercher-muscles-desktop.jpg`. Neck logging: `logging-neck-hold-{320,390,desktop}.jpg`. Carry logging: `logging-suitcase-carry-{320,390,desktop}.jpg`. Movement support: `movement-support-hand-fighting-{390,desktop}.jpg`, `movement-support-hand-fighting-muscle-tier-390.jpg`. Week Review: `week-review-{320,390,desktop}.jpg`. Also `history-new-set-types-{320,390}.jpg`, `catalog-long-names-320.jpg` and `home-focus-390.jpg`. The Week Review images are full-page captures, so the fixed bottom navigation bar appears part-way down them.

## Gate coverage (G1-G6)

| Gate | Status across E01-E50 | Notes |
|---|---|---|
| G1 Identity | verified 50 | stable explicit ids, aliases, equipment, category and movement, `distinctFrom` |
| G2 Anatomy and evidence | verified 18, estimated-reviewed 32 | 54 muscle tags trace to a source and 107 are authored estimates; per-field origins are in `evidence.json` |
| G3 Numeric output | derived-tested 50 | eight fingerprint values, ten targeting factors per muscle, fatigue, practicality and similarity, all generated by the app's functions in `diagnostics.json`. Curves: 8 Isometric, 1 Lengthened, 41 not established (shown as unavailable) |
| G4 Analysis integration | derived-tested 50 | split coverage, week exposure, pattern board, movement-support tier, quality coverage |
| G5 Recording and references | **pending** 50 | the app side passes (measurement mode, load convention, sides, prescriptions, tracker, swaps, drop sets, history, e1RM eligibility). It stays pending because the database identity, mappings and policy are prepared but not applied |
| G6 Presentation and release | derived-tested 50 | search by canonical and requested name; a photo or a placeholder recorded in `media.json`; no unknown labels |

Missing-data exceptions and their tested behaviour:

- **Authored-estimate muscle tag.** Used like any catalog tag. Its origin is labelled per field in `evidence.json`, and the prepared database mapping gives it confidence 60, which marks an authored estimate.
- **No resistance curve.** The record shows "No curve is shown: no source established one for this setup." Similarity leaves the unknown bias out and spreads its weight over the other terms (`hazards`, neck-extension and similarity tests).
- **No photo.** The equipment placeholder is shown at the same size, with the exercise name. It is never another exercise's photo (`exercisePhotos.test.ts`, `media.json`).
- **No norm.** The prepared policy is `unsupported` (migration test). Strength Genome entry refuses holds, carries and assisted sets. 21 records are e1RM-ineligible, each with a stated reason (logging tests).
- **Database rows not applied.** The server's name fallback no longer lands on a row that belongs to another catalog id (hazards test).

## Brief §12 fixtures

Contract and data:

- [x] Every E01-E50 has a disposition and a matrix row (`exercise-matrix.csv`, 50 rows).
- [x] Unique stable ids; 401-450 are explicit, never positional (validator test: "holds exactly ids 401-450 ... after the untouched 400").
- [x] sportFit keys and grade enums; no empty names, unknown labels, unrecognised qualities, non-finite outputs or dangling joins (`validateExpansion`, 0 errors).
- [x] Every record has an explicit descriptor; inference applies only to the original 400.
- [x] Provenance per authored field (`evidence.json` fieldOrigins); derived values carry model revisions (`diagnostics.json`).
- [x] Required-data failures are errors, not warnings (validator test).

Numerical:

- [x] 3 direct + 4 supporting sets → 3 + 2 = 5, with 4 supporting sets performed (traps).
- [x] A muscle tagged both primary and secondary counts once (`weekReview.test.ts`); the validator rejects it in new records.
- [x] Two occurrences on different days stay separate; more sets change exposure, not mechanics.
- [x] New movement categories leave the week board's 12 common patterns unchanged (`commonMovementsUnchanged: true`).
- [x] Split tag-score tests and weekly-set tests stay separate.
- [x] Neck and forearm keys reach the figure, search, week rows and strength regions.
- [x] Unmapped anatomy renders as "Not counted", never as zero (Week Review legend).
- [x] Reverse Nordic, bear-hug carry, neck extension and single-leg seated curl hit their intended branches.
- [x] Representative originals keep their scores; `genome-v2-deltas.json` lists the 121 original records whose descriptive labels changed (patterns, force direction, stance). None changed fingerprint or muscle profile.
- [x] Ids, names and pattern groups of the original 400 are unchanged, so existing users' rank evidence is unchanged.

Movement and discovery:

- [x] Wrestling → Hand fighting keeps its context (runtime).
- [x] Shared-muscle exercises are labelled Muscle support (test and runtime).
- [x] No neck exercise is promoted for hand fighting.
- [x] Reverse Nordic ≠ Nordic hamstring curl; the assisted pull-up machine is kept out of records that name the pull-up.
- [x] Search: exercise search (canonical and requested names). The add-to-plan picker, swap sheet and Strength Genome entry use the same ranking. Universal search shares the alias table, and the import reader resolves new names (share test).
- [x] "Incline bench machine" resolves to Incline Machine Chest Press (validator test).
- [x] Equipment filters name the seven new equipment types; specialist equipment stays out of profiles that don't list it.

Session and persistence:

- [x] A timed set stays timed through save, reload and completion; seconds never become reps.
- [x] A carry stays load over distance, per hand, with its side.
- [x] An assisted set reads as assistance, with no volume and no strength estimate.
- [x] One dumbbell stays one dumbbell in the strength record.
- [x] Kg/lb: stored physical load is preserved (`deviceWorkoutLog.units.test.ts`). Seconds and metres don't depend on the weight unit.
- [x] Left and right are explicit; the next set offers the last hold's seconds but not its side.
- [x] A mid-session swap keeps completed sets and says when the measurement changes.
- [x] Drop set 100 × 5 → 70 × 6 → 50 × 10 stays one parent set: 3 stages, 21 reps, 1,420 lb·reps.
- [x] Share and import keep the catalog ids and their time and distance prescriptions. A catalog without the record (an older app) keeps it by name and prescription.
- [x] Sessions saved before these fields existed load unchanged.
- Account sync uploads strength observations only, so holds, carries, assisted and gripper sets never reach the account as lifts (logging tests). Session sets stay on the device, as before.

Reference and server:

- [x] Identity resolves by catalog id (prepared names `<name>__catalog_<id>`; server fallback test).
- [x] Every prepared mapping resolves a real muscle, with role, weight 0-1 and confidence 0-100.
- [x] Missing norms take the unsupported route; personal progress stays usable.
- [x] Holds, carry distances and gripper settings cannot reach e1RM.
- [ ] Reference policy, source eligibility and population filters: the code is unchanged; not re-run against the database.
- [x] Reruns add nothing twice. Every insert stops on conflict; this was checked statically, not executed against a database.
- [ ] Server cache refresh with the new rows: not testable until the migration is applied.

UX and presentation:

- [x] Catalog list, exercise detail, anatomy, active workout, history, Home focus and Week Review at 320, 390 and 1280 px.
- [x] Long names wrap clear of the add, favorite and swap controls.
- [x] Units and assistance wording are visible at entry time (Hold s, Weight per hand kg, Distance m, Assistance).
- [x] Variation detail sits behind a disclosure, and the evidence is one line.
- [x] Unavailable curves show a sentence, not an empty chart or a made-up polygon.
- [x] Placeholder thumbnails keep their dimensions and the exercise name.
- [x] Existing components and styles only.

## Engine and classification fixes

Model revisions: `exercise_genome_v1 → v2`, `muscle_targeting_v1 → v2`. Unchanged: `week_review_v1`, `split_targets_v1`, `sg_muscle_aggregate_v2`. No calibration constant was changed.

1. Typed per-id descriptors replace name-regex inference for the new records (patterns, joint actions, force direction, chain, stance, resistance, fingerprint and targeting predicates, study key, anatomy, stabilizers).
2. Whole-word pattern matching. Before this, "run" inside *Trunk* and *Crunch* gave 20 planks and crunches a locomotion pattern. Gait is now read from the name, so calf raises and drag curls are no longer called gait, and a bear-hug carry is no longer *Crawling*.
3. "Neck extension" no longer takes the generic *extension → shortened* curve.
4. Reverse Nordic no longer inherits the Nordic hamstring study and its direct-evidence floor. The seated leg-curl study is matched by meaning, not word order.
5. The "chin" inside "machine" kept every machine press off Push and Upper days. It is now matched at a word boundary.
6. The server's name fallback refuses a row whose catalog suffix belongs to another id.
7. Resistance bias "Isometric" and "Not established" (empty curve). Similarity renormalises when the bias is unknown.
8. Neck vocabulary end to end: `neckFlexors` and `neckExtensors`, figure regions (front and back), strength region and domains, week labels. The `Neck` category reaches Upper and Full Body days only.
9. Measurement modes (`load_reps`, `reps_only`, `setting_reps`, `assisted_reps`, `duration`, `load_duration`, `load_distance`) with laterality and e1RM eligibility. New load conventions: `assistance`, `resistance_setting`, `no_external_load`. Set fields: `seconds`, `distance`, `distanceUnit`, `setting`, `side`.
10. Evidence wording: *Model confidence* is shown separately from the research actually attached.

## Migration status

`supabase/prepared/exercise_expansion_v1/20261007120000_exercise_expansion_v1.sql` and its `.rollback.sql`: **prepared, not applied, not staging-verified.** Generated from the catalog by `scripts/exercise-expansion/migration.ts` and pinned by a parity test. It contains:

- 11 muscles the database lacks;
- 50 exercises named `<snake_name>__catalog_<id>`;
- identity mappings;
- muscle mappings with explicit role weights (0.75 primary, 0.40 secondary, 0.20 stabilizer; confidence 60);
- 50 `unsupported` scoring-policy rows.

It is idempotent. No database write was made. Reads were `select`s on reference tables only, and no athlete table was read.

## Remaining work

1. **Apply the migration** after owner authorization (B009). Then check that the server resolves 401-450 by catalog id and that a cache refresh surfaces the new rows.
2. **Exercise-specific muscle evidence** for the 107 authored-estimate tags (32 records; listed per record in the matrix `blockers` column). Part of this research was blocked: the session's network policy denied `pubmed.ncbi.nlm.nih.gov` and other scholarly hosts. Allowing them in the environment's network settings would let it continue.
3. **Resistance curves** for the 41 records marked *Not established*. Each needs a source that measured that setup.
4. **Photos** for the 38 records on the placeholder. The Free Exercise DB has no exact-variation pair for them (`media.json` lists the nearest candidates considered and why each was refused). This needs new photography or another licensed source.
5. **Norms.** None exist for these exact exercises and protocols; they stay unsupported until one does.
6. **Original-catalog database rows.** 70 rows (ids 301-350 and 381-400) lack the `__catalog_<id>` suffix. This was recorded in `inventory.md` and not changed, because changing it would alter what existing users' lifts resolve to.
