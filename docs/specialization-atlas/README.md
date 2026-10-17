# Muscle Specialization Atlas, forearms first: completion report

Owner's brief: [`brief-2026-10-16.md`](brief-2026-10-16.md). This page is the brief's §12 completion report: what exists, where, how it was tested, and what is still owed. Details live in the numbered notes.

| Note | What it covers |
|---|---|
| [01-reconciliation.md](01-reconciliation.md) | Phase A: what already existed (schema, routes, muscle keys, set records) and the adapter map |
| [02-design.md](02-design.md) | The binding design: layers, ids, counting model, intervals, goals, page, recommendations, database, renderer contract |
| [03-anatomy-evidence.md](03-anatomy-evidence.md) | The anatomy content and how each claim was reviewed |
| [04-database.md](04-database.md) | Schema `specialization`, access, the seed and its drift guard, how it is applied |
| [05-mappings.md](05-mappings.md) | Exercise variants and variant → muscle mappings |
| [06-calculation.md](06-calculation.md) | The calculator as implemented, with the brief §11 test matrix |
| [07-logger.md](07-logger.md) | Logger changes: hold seconds, which arm, straps |
| [08-diagram.md](08-diagram.md) | The forearm drawing, its generator and renderer, evidence |
| [09-page.md](09-page.md) | Body Lab → Specialize: the page, its sheets and its ways in |

## Existing tables reused, and what is new

- **Reused, unchanged:** the device workout log (`sports-genome-device-workout-history-v1`), the plan (`gym-optimizer-workout-plan-v1`), the exercise catalog (client code), `public.exercises` and `public.muscles` (referenced by foreign key from the new schema, never written). Workouts and sets stay on the device: no server table holds a bout, so there is **no exposure ledger table**; exposure is calculated on the device, on demand, from the same records Home, Review and Progress read (01-reconciliation.md, 04-database.md §2).
- **New, in schema `specialization`** (not exposed through the Data API; RLS on every table): reference tables `regions`, `nodes`, `actions`, `sources`, `claims`, `claim_sources`, `node_actions`, `diagram_assets`, `diagram_paths`, `diagram_labels`, `catalog_exercises`, `exercise_variants`, `mapping_versions`, `variant_mappings`, `mapping_sources`, `rule_versions`; owner-only `goals` and `measurements` shaped like the device records for a later sync.
- **New on the device:** targets (`sports-genome-specialization-goals-v1`), measurements (`…-measurements-v1`) and suggestion exclusions (`…-exclusions-v1`), each under the account's scoped key. New optional fields on logged sets (`side`, `holdSeconds`, `warmup`) and exercises (`straps`), validated on load and kept through corrections; older records load and save unchanged.
- **Catalog:** 14 new rows, 401–414 (Finger Curl, Gripper Close, Gripper Hold, Band Finger Extension, Lever Pronation, Lever Supination, Lever Radial Deviation, Lever Ulnar Deviation, Suitcase Carry, One-Arm Dumbbell Wrist Curl, One-Arm Dumbbell Reverse Wrist Curl, Band Thumb Flexion, Band Thumb Extension, Band Thumb Abduction); 414 in all. Catalog fixes: ids 139–141 movement tags, 139–145 duplicate secondary tags, 232 retagged (05-mappings.md).

## Seeded content, by count and id

- **Region** `forearm` (production) and `upper_arm` (reference only, for the two external contributors).
- **Nodes: 24**, all reviewed. 19 target muscles (`forearm.br`, `fcr`, `fcu`, `pl`, `fds`, `fdp`, `fpl`, `pt`, `pq`, `ecrl`, `ecrb`, `ecu`, `ed`, `edm`, `ei`, `apl`, `epb`, `epl`, `supinator`), 2 compartments (`forearm.anterior`, `forearm.posterior`), 1 adjacent (`forearm.anconeus`), 2 external contributors (`upper_arm.biceps`, `upper_arm.brachialis`). Layers: 12 surface, 1 middle (FDS), 9 deep, 2 mixed (the compartments).
- **Joint actions: 20; node actions: 38**, each resting on a function claim of the same node.
- **Claims: 60**, all reviewed (24 function, 24 appearance, 10 selectivity, 2 variation). **Sources: 71** (S1–S8, A1–A55, M1–M8).
- **Exercise variants: 117** (one default variant `cat-<id>` per mapped catalog exercise).
- **Mappings: 404** in the published version `forearm_mappings_v1`: **399 reviewed**, **5 draft** (shown as "pending review", never counted, never exposed to users by the database):
  - `cat-144 → forearm.fpl`, `cat-145 → forearm.fpl`, `cat-299 → forearm.fpl`, `cat-409 → forearm.fpl`, `cat-317 → forearm.br`.
  - By relationship: 96 direct, 91 contributing, 202 incidental, 15 stabilizer.
  - Every target muscle has at least one reviewed mapping; `forearm.anconeus` (adjacent) has none and is drawn hatched ("mapping not reviewed").
- **Accounting rule:** `specialization_exposure_v1` (shared/specialization/rules.ts), published 2026-10-16.
- **Drawing:** `forearm_schematic` v1, original artwork: palm (surface, middle, deep), back (surface, deep), thumb side (surface, deep), 127 paths.

## Extensibility: the deltoid fixture

`client/src/lib/specialization/__fixtures__/deltoidRegion.ts` is a non-production deltoid region (anterior, lateral, posterior heads; a triceps external contributor; its own actions, variants, mappings and a small diagram). `regionAgnostic.test.ts` runs the same calculator, windows, goals and adapters on it, and a source scan checks that none of them names a region. The renderer's tests draw the deltoid diagram too. Adding a production region is data in `shared/specialization/registry.ts` and `regionIndex.ts`.

## Tests

Calculator and adapters (client/src/lib/specialization: the brief §11 matrix in `brief11.test.ts`, plus exposure, bouts, time and DST, goals, stores, recommendations, the summary hook, region-agnostic), anatomy and mappings content (`forearmAnatomy.test.ts`, `forearmMappings.test.ts`), the drawing (`forearmDiagram.test.ts`, `SpecializationDiagram.render.test.ts`), the logger (`DeviceWorkoutTracker.atlas.test.ts`, `WorkoutSessionDetail.holds.test.ts`, `deviceWorkoutLog.atlas.test.ts`, `holdSetReaders.test.ts`, `loggingPolicy.test.ts`), the page (`specializationModel.test.ts`, `SpecializationPanel.render.test.ts`, `PlanChangeSheet.render.test.ts`, `Targets.render.test.ts`, `MeasurementsPanel.render.test.ts`), Home (`Home.specialization.test.ts`, `Home.specializationChange.test.ts`), and the database in real Postgres 17 via PGlite (`server/specializationSchema.test.ts`, `server/specializationSeed.test.ts`: RLS for anon, two users and the service role; constraints; immutability; publication; idempotence; rollback; the seed's drift guard).

Full suite at the time of writing: see the release section below.

## Release

_Filled in at release: migration versions as recorded by Supabase, the pull request, CI, the production deploy and its verification._

## Limitations, said plainly

- **No measurement of internal load.** Every number is a count of logged or planned work (bouts, reps, hold seconds) credited by reviewed mappings. Nothing here measures muscle force, activation or growth, and the page never says otherwise.
- **The anatomy review was automated.** Each claim was checked against web-search excerpts of reputable sources (NCBI StatPearls, peer-reviewed papers, university anatomy pages), not by a clinician; six function claims rest on a single StatPearls source. A human anatomy review is recommended before this is presented as settled (03-anatomy-evidence.md).
- **The drawing is a schematic**, checked against the atlas's anatomy notes and standard descriptions, not against a medical illustration review; it is not a growth forecast and does not bulge.
- **History before this release** has no recorded arm, hold seconds or straps: one-arm work from before reads as "no arm recorded" (counted for neither arm), holds logged as reps read as "time not recorded".
- **Catalog rows 401–414** have no `public.exercises` row or Supabase exercise mapping yet, so lifts logged on them stay on the device (the strength sync counts them as unmappable) and they are not scored for strength rank.
- **Goals, measurements and exclusions live on the device** under the account's key; the database tables for them exist but nothing syncs yet.
- **Five draft mappings** ship in the published version, shown as pending review; once reviewed they belong in `forearm_mappings_v2`.
- **Phone checks** are headless Chromium emulating an iPhone (viewport, touch, device scale 3), not a real iPhone or Safari.
