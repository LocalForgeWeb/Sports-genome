# Exercise expansion v1 — inventory and field consumer graph

Brief: *Sports Genome — 50-exercise data and engine integration* (6 October 2026).
Prepared 7 October 2026.

## Where this was done

| Item | Value |
|---|---|
| Branch | `claude/training-day-navigation-workouts-83ro2c`, started from `origin/main` |
| Audited revision (brief §1) | `785421fb3ce771a7765c81c2053d88d53113b149` — identical to `origin/main` when work began; no drift to reconcile |
| Application environment | Vercel project `prj_ZuUcAMUz7BpCcniwEV7XWsQfvOzV` (production alias `sports-genome-mauve.vercel.app`) |
| Database environment | Supabase project `qiccnqkypbhlwpmjcsri`, read through the Supabase connector with SQL `select`s on reference tables only. No `athlete_*` table or other private record was read. Nothing was written: the migration in `supabase/prepared/exercise_expansion_v1/` is prepared, not applied (repository rule B009) |
| Web research | WebSearch and WebFetch both worked (checked separately before research began); findings are in `evidence.json` |
| Repository instructions | No `CLAUDE.md`. Scripts: `pnpm check` (tsc), `pnpm test` (vitest), `pnpm build`. CI (`.github/workflows/ci.yml`) runs the same three |

## Differences from the brief's audit

The brief's static audit matched the code at `785421f`. Three things it could not see, found while doing the work:

1. **"run" inside "Trunk" and "Crunch".** `getMovementPatterns` added *Locomotion* to every exercise whose text contained `run` — which is every *Trunk flexion / anti-extension* movement and every crunch. Twenty planks, crunches, leg raises and rollouts carried a locomotion pattern (and its joint actions). Fixed with whole-word matching.
2. **"chin" inside "machine".** `matchesTrainingSplit` excluded any exercise whose name contained `chin` from Push, to keep chin-ups out. Every machine press — Machine Chest Press, Incline Machine Chest Press, both Smith presses, Machine Shoulder Press, Machine Lateral Raise, Machine Triceps Extension — has `chin` inside `machine`, so none of them was ever offered on a Push or Upper day. Fixed at a word boundary; the validator found it when the new Seated Dip Machine reached no split.
3. **70 catalog rows have no `__catalog_<id>` suffix in the database.** Ids 301-350 and 381-400 carry `source_catalog_id` but a bare canonical name, so `findProfileExercise` / `findCurveExercise` can reach them only by display name (and the strength-profile index, filtered on `like *__catalog_*`, omits them). Not changed here (it would alter what existing users' lifts resolve to); recorded as open. The expansion's prepared rows all carry the suffix, and the name fallback can no longer land on a row that belongs to a different catalog id.

`docs/backend-v1/inventory/engines.md` is older than this code and was not used as a source of truth; `docs/exercise-rating-spec.md` is a proposal and is not the active schema (the genome still computes scores from tags and rules — now from stated predicates for the expansion).

## Active and dormant engines

| Engine | Status | Evidence |
|---|---|---|
| Exercise Genome (`exerciseGenome.ts`) | Active, revised to `exercise_genome_v2` | Read by every exercise view, the planner, recommendations and redundancy |
| Muscle targeting (`muscleTargetingModel.ts`) | Active, `muscle_targeting_v2` | Called per muscle by the genome |
| Study calibration (`exerciseStudyCalibration.ts`) | Active | Source of `evidenceContext` and the direct-evidence floor |
| Week Review (`weekReview.ts`) | Active, `week_review_v1` (unchanged) | Train → Review |
| Split coverage (`splitStackAnalysis.ts`) | Active, `split_targets_v1` (unchanged) | Plan day coverage |
| Server aggregation (`server/muscleAggregation.ts`) | Active, `sg_muscle_aggregate_v2` (unchanged) | Muscle ranks from scored lifts |
| `score_strength_profile_v1`, `apply_strengthlevel_age_adjustment_v1` | Active (RPC from `server/supabaseStrengthProfile.ts`) | Read, not changed |
| `exercise_muscle_effect_priors`, `exercise_modality_contract_v1`, `exercise_modality_composition_v1/v2`, `muscle_effect_scoring_versions` | **Dormant**: no server or client code reads them | Searched `server/`, `client/src/`, `shared/`. Not populated for the expansion, by design |

## Field → consumer graph

Each row is a field an expansion record supplies, the modules that read it, and what reads it wrong when it is missing. `field-contract.csv` is the same contract in machine-readable form.

| Field | Consumers |
|---|---|
| `id` | catalog assembly, plan entries (`catalogId`), device sessions, swap lineage, `exercisePhotos.json`, `loadConventions.ts`, `exerciseMeasurement.ts`, database `__catalog_<id>`; ids 401-450 are explicit, never positional |
| `name` | search (`exerciseSearch.ts`), movement support phrase matching, share/import, strength-route aliases, session identity |
| `sourceGroup`, `category` | catalog grouping, split pools (`splitAssignment.ts` — the new `Neck` category reaches Upper and Full Body only) |
| `equipment` | access filter (`equipmentProfile.ts`, seven new options), study fallback, set entry wording, practicality |
| `movement` | week-review pattern board (`commonMovements` — unchanged by the expansion), movement-support related tier, `BROAD_PATTERNS` (Hip hinge kept as one family: `SINGLE_FAMILY_PATTERNS`) |
| `primaryMuscles`, `secondaryMuscles` | genome muscle profile, split tag points (56/24), stack involvement, session and weekly exposure (1 / 0.5), adjacent overlap, figure regions, strength regions, movement-support muscle tier, Home focus |
| `qualities` | fingerprint, quality-derived patterns, sport demand coverage (`stackQualityCoverage.ts`) |
| `muscleGrade`, `sportFit` | catalog tier stamp, sport filters, recommendations |
| descriptor (`exerciseDescriptors.ts`) | genome patterns, joint actions, force direction, chain, stance, resistance profile, fingerprint and task predicates, targeting inputs, study key and qualification, anatomy labels, stabilizers, exercise-record setup text |
| measurement (`shared/exerciseMeasurement.ts`) | tracker entry boxes, count box, side choice, drop-set availability, set lines, volume, strength observations, Strength Genome entry refusal, default prescriptions, swap notes |
| load convention (`shared/loadConventions.ts`) | entry labels, set lines, volume basis, observation `loadSemantics`, database policy parity |
| photo mapping (`exercisePhotos.json`, `exercisePhotoOrder`/audit) | `ExerciseMedia` everywhere a row or record is shown |

## Model issues recorded, not retuned (brief §4.1)

- The fingerprint gives `Machine` equipment +6 hypertrophy while the machine-modality evidence note says equipment creates no default growth advantage. The constant is unchanged (`logicCalibration.fingerprint.hypertrophyMachineLift`); the tension is documented in `exerciseGenome.ts`.
- The fingerprint's strength dimension is driven by the `strength` tag and equipment; a single-joint forearm or neck exercise tagged `strength` reads close to a barbell press. The expansion follows its families' tagging (the wrist-curl family carries no `strength` tag) rather than retuning the constants.
- 17 original records list a muscle as both primary and secondary (e.g. Wrist Curl, every overhead press). Every consumer now counts it once as primary; the records themselves are unchanged. The expansion's validator forbids it for new records.
- Evidence wording: the genome's `confidence` was derived from the skill score and read as research confidence. It is now shown as *Model confidence*, beside a separate *research behind it* line taken from the study actually attached.
