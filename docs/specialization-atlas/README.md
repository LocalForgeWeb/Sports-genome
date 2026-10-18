# Muscle Specialization Atlas, forearms first: completion report

Owner's brief: [`brief-2026-10-16.md`](brief-2026-10-16.md). This page is the brief's §12 completion report: what exists, where, how it was tested, and what is still owed. Details live in the numbered notes. Counts, names and timings below were read from the code at `1cb619a` (18 Oct 2026) with scripts, not written from memory.

| Note | What it covers |
|---|---|
| [01-reconciliation.md](01-reconciliation.md) | Phase A: what already existed (schema, routes, muscle keys, set records) and the adapter map |
| [02-design.md](02-design.md) | The binding design: layers, ids, counting model, intervals, goals, page, recommendations, database, renderer contract |
| [03-anatomy-evidence.md](03-anatomy-evidence.md) | The anatomy content and how each claim was reviewed |
| [04-database.md](04-database.md) | Schema `specialization`, access, the seed and its drift guard, how it is applied |
| [05-mappings.md](05-mappings.md) | Exercise variants and variant → muscle mappings |
| [06-calculation.md](06-calculation.md) | The calculator as implemented, with the brief §11 test matrix |
| [07-logger.md](07-logger.md) | Logger changes: hold seconds, which arm, straps, a one-arm exercise's sets per arm |
| [08-diagram.md](08-diagram.md) | The forearm drawing, its generator and renderer, evidence |
| [09-page.md](09-page.md) | Body Lab → Specialize: the page, its sheets and its ways in |

## Existing tables reused, and what is new

- **Reused, unchanged:** the device workout log (`sports-genome-device-workout-history-v1`), the plan (`gym-optimizer-workout-plan-v1`), the exercise catalog (client code), `public.exercises` and `public.muscles` (referenced by foreign key from the new schema, never written). Workouts and sets stay on the device: no server table holds a bout, so there is **no exposure ledger table**; exposure is calculated on the device, on demand, from the same records Home, Review and Progress read (01-reconciliation.md, 04-database.md §2).
- **New, in schema `specialization`** (not exposed through the Data API; RLS on every table): **19 tables**, all created by `20261016120000_specialization_atlas_schema.sql`.
  - 17 reference tables: `regions`, `nodes`, `actions`, `sources`, `claims`, `claim_sources`, `node_actions`, `diagram_assets`, `diagram_views`, `diagram_paths`, `diagram_labels`, `catalog_exercises`, `exercise_variants`, `mapping_versions`, `variant_mappings`, `mapping_sources`, `rule_versions`.
  - 2 owner-only tables, `goals` and `measurements`, shaped like the device records for a later sync.
  - The seed, `20261016120100_specialization_atlas_seed_v1.sql`, fills the reference tables and creates nothing.
- **New on the device:** targets (`sports-genome-specialization-goals-v1`), measurements (`…-measurements-v1`) and suggestion exclusions (`…-exclusions-v1`), each under the account's scoped key. New optional fields on logged sets (`side`, `holdSeconds`, `warmup`), validated on load and kept through corrections, and on exercises: `straps` (validated) and `perArm` (written by the tracker when it builds a one-arm exercise's sets per arm, 07-logger.md; kept as stored). Older records load and save unchanged.
- **Catalog:** 16 new rows, 401–416 (Finger Curl, Gripper Close, Gripper Hold, Band Finger Extension, Lever Pronation, Lever Supination, Lever Radial Deviation, Lever Ulnar Deviation, Suitcase Carry, One-Arm Dumbbell Wrist Curl, One-Arm Dumbbell Reverse Wrist Curl, Band Thumb Flexion, Band Thumb Extension, Band Thumb Abduction, and the wrist roller by direction: "Wrist Roller, Extension Wind" and "Wrist Roller, Flexion Wind"); 416 in all. Catalog fixes: ids 139–141 movement tags, 139–145 duplicate secondary tags, 232 retagged (05-mappings.md).

## Seeded content, by count and id

- **Region** `forearm` (production) and `upper_arm` (reference only, for the two external contributors).
- **Nodes: 24**, all reviewed. 19 target muscles (`forearm.br`, `fcr`, `fcu`, `pl`, `fds`, `fdp`, `fpl`, `pt`, `pq`, `ecrl`, `ecrb`, `ecu`, `ed`, `edm`, `ei`, `apl`, `epb`, `epl`, `supinator`), 2 compartments (`forearm.anterior`, `forearm.posterior`), 1 adjacent (`forearm.anconeus`), 2 external contributors (`upper_arm.biceps`, `upper_arm.brachialis`). Layers: 12 surface, 1 middle (FDS), 9 deep, 2 mixed (the compartments).
- **Joint actions: 20; node actions: 38**, each resting on a function claim of the same node.
- **Claims: 60**, all reviewed (24 function, 24 appearance, 10 selectivity, 2 variation). **Sources: 71** (S1–S8, A1–A55, M1–M8).
- **Exercise variants: 119** (one default variant `cat-<id>` per mapped catalog exercise; 9 measured in seconds), on 119 catalog exercise rows.
- **Mappings: 418** in the published version `forearm_mappings_v1`: **413 reviewed**, **5 draft** (shown as "pending review", never counted, never exposed to users by the database):
  - `cat-144 → forearm.fpl`, `cat-145 → forearm.fpl`, `cat-299 → forearm.fpl`, `cat-409 → forearm.fpl`, `cat-317 → forearm.br`.
  - By relationship: 101 direct, 96 contributing, 206 incidental, 15 stabilizer (reviewed only: 101, 91, 206, 15). Evidence basis: 176 anatomy, 221 inference, 21 EMG. 934 mapping sources.
  - Every target muscle has at least one reviewed mapping; `forearm.anconeus` (adjacent) has none and is drawn hatched ("mapping not reviewed"). The two compartments are groups and are not mapped.
- **Accounting rule:** `specialization_exposure_v1` (shared/specialization/rules.ts), published 2026-10-16.
- **Drawing:** `forearm_schematic` v1, original artwork: palm (surface, middle, deep), back (surface, deep), thumb side (surface, deep): 7 layers, 127 paths, 28 labels.

## Extensibility: the deltoid fixture

`client/src/lib/specialization/__fixtures__/deltoidRegion.ts` is a non-production deltoid region, complete as a second region: anterior, lateral and posterior heads and a triceps external contributor; its own actions, variants and mappings; its own drawing from the front, the side and the rear (`viewOrder`: Front · Side · Rear, the lateral head drawn from the side); its own page words (`wording`) and circumference as its only measure (`measurementMetrics`).

- `regionAgnostic.test.ts` runs the same calculator, windows, goals, adapters and suggestions on it. Its source scan fails if the calculator, the adapters or any page source file (every non-test `.tsx`/`.ts` in `client/src/components/specialization/`) names a region or the forearm's view and group words in code or strings.
- `SpecializationPanel.deltoid.render.test.ts` renders the page on it with no deltoid code: Deltoid specialization, Front · Side · Rear, its own group heading and incidental word, circumference only, and no forearm word outside the published rule's text.
- `server/specializationSeed.test.ts` seeds it with no schema change (views are rows of `diagram_views`, region words and measures are columns of `regions`) and reads it back whole.

### Adding a production region

The schema, the calculator and the page's components take a second region as data. What it takes, file by file:

1. **Its data**, in `shared/specialization/regions/<id>/`: `region.ts` (the region record: label, heading, entry label, body-map keys, `nodeForBodyMapKey`, `wording`, `measurementMetrics`), `nodes.ts`, `actions.ts`, `nodeActions.ts`, `claims.ts`, `sources.ts`, `variants.ts`, `mappings.ts` (under its own mapping version key), `mappingSources.ts`, its drawing `diagram.generated.ts` (from its own generator, as `design/specialization/forearm/emit.mjs` writes the forearm's), `index.ts` (everything, for the page) and `logging.ts` (region, variants and mappings only, for the logger).
2. **Four lists that name the production regions**, all in `shared/specialization/`:
   - `regionIndex.ts`: the region record, for Home, Body Lab, Review and search (they must not load the region's data);
   - `registry.ts`: the full data, for the page and the seed;
   - `loggingRegions.ts`: the light data, for the workout logger (`loggingRegions.test.ts` fails until it matches the registry);
   - `holdCatalogIds.ts`: the catalog ids measured in seconds, a hand-kept copy for the app's first screens (`holdCatalogIds.test.ts` fails until a new hold is listed).
3. **Catalog rows** for exercises the catalog does not have (`client/src/lib/exerciseCatalog*.ts`). A catalog exercise both regions map keeps one variant `cat-<id>`, identical in both: the seed refuses a variant that differs between regions. External contributors that belong to a region with no page need a label in `referenceRegionLabels` (`scripts/specialization/emit-seed.ts`), as `upper_arm` has.
4. **Its seed rows**, in a new seed migration once v1 has been applied to production (`…_seed_v2.sql`; the applied file is history, 04-database.md §9).

None of that changes a table, a column, a type, the calculator or a page component. Still forearm-specific in code, to change when a second region ships:

- **The browser tab and the Back label after search** read `workspaceTitles.specialization`, "Forearm specialization" (`client/src/pages/Home.tsx`), on every region's page.
- **Search** offers one destination, "Forearm specialization", with forearm terms (`client/src/lib/universalSearch.ts`).
- **No region picker.** Body Lab's Specialize tab and search reopen the page as it was last left in this visit, which at first is the default region (`defaultSpecializationRegionId`); nothing on the page changes the region. A second region is reached from the Muscles map and Review (`regionForBodyMapKey`) or its address.
- **One rule for every region.** The calculator, the summary hook and "How this is counted" read `exposureRuleV1` (`specialization_exposure_v1`), whose text speaks of grip and straps. A region that needs other words needs a new rule version and code that picks the rule per region.
- **"Arm".** The page and the logger say arm ("Left arm", "Right arm", "Arm · Left · Right · Both", "no arm recorded"): right for the deltoid, wrong for a leg region such as the calves.
- **Two measures.** The device and the database know circumference (cm) and grip force (N) only (`MeasurementMetric`, the measurements table's check); another measure needs a type and a migration.
- **Content tests** (`forearmAnatomy.test.ts`, `forearmMappings.test.ts`, `forearmDiagram.test.ts`) check the forearm; a new region needs its own.

## Tests

- **Calculator and adapters** (`client/src/lib/specialization/`): the brief §11 matrix in `brief11.test.ts`, plus `exposure`, `bouts`, `planBouts`, `time` (DST), `goals`, `stores`, `recommendations` and `recommendations.gaps`, `useSpecializationSummary`, `progressSeries`, `regionRows`, `viewState`, `planChange`, `regionAgnostic`.
- **Content:** `forearmAnatomy.test.ts`, `forearmMappings.test.ts`, `forearmDiagram.test.ts`, `loggingRegions.test.ts`, `holdCatalogIds.test.ts`, `loggingPolicy.test.ts`.
- **The page** (`client/src/components/specialization/`): `specializationModel.test.ts`, `specializationSuggestions.test.ts`, `SpecializationPanel.render.test.ts`, `SpecializationPanel.deltoid.render.test.ts`, `SpecializationDiagram.render.test.ts`, `PlanChangeSheet.render.test.ts`, `PlanChangeSheet.holds.test.ts`, `Targets.render.test.ts`, `MeasurementsPanel.render.test.ts`.
- **The logger:** `DeviceWorkoutTracker.atlas.test.ts`, `.perArm.test.ts`, `.swapPerArm.test.ts`, `.prescription.test.ts`, `WorkoutSessionDetail.holds.test.ts`, `.holdSeconds.test.ts`, `ExerciseHistoryList.holds.test.ts`, `deviceWorkoutLog.atlas.test.ts`, `holdSetReaders.test.ts`, `sessionRecap.holdMeasure.test.ts`, `workoutSwap.perArm.test.ts`, `workoutPlanner.holdPrescription.test.ts` (07-logger.md lists what each covers).
- **Home** (`client/src/pages/`): `Home.specialization.test.ts` (the tab and Review's way in, the address, Back, an add written to its day, when the straps question is asked), `Home.specializationChange.test.ts` (add and swap from the page), `Home.specializationJourney.test.ts` (the whole journey, below), `Home.holdPrescription.test.ts`.
- **The database**, in real Postgres 17 via PGlite: `server/specializationSchema.test.ts` and `server/specializationSeed.test.ts` (RLS for anon, two users and the service role; constraints; immutability; publication; idempotence; rollback; the seed's drift guard).

Full suite at the time of writing: see the release section below.

## Release gates (brief §11, and §9's offline state)

Checked at `1cb619a` on 18 Oct 2026, and again at `c2b98e2`, the release head, after the final review's fixes (the summary and page timings below cover both; the bundle sizes are the release head's). Timings are on the sandbox's CPU (Node 22, and headless Chromium emulating an iPhone), not a phone. The scripts are in `scripts/specialization/release-gates/`; their output is in `evidence/release-gates-2026-10-18/`.

| Gate | Status | Evidence |
|---|---|---|
| Calculations tested against the production functions | Met | `brief11.test.ts` runs the brief's scenario table through the functions the page and the logger run (`getSpecializationSummary`, `boutsFromSessions`, `boutsFromPlan`, `previewPlannedChange`, `applySwap`, `finalizeSession`, `removeDeviceWorkoutSession`); 06-calculation.md §7 maps each row to its test. |
| RLS with anonymous, user A, user B and backend roles | Met, in PGlite | `server/specializationSchema.test.ts`: anon reads and writes nothing; user B cannot read, change, delete or forge user A's goals or measurements; signed-in users see reviewed nodes, claims and mappings and published versions, never draft rows, fixture regions or unpublished versions, and write no reference table; the service role reads and writes every table, still bound by the immutability triggers (04-database.md §5). |
| Schema constraints and migration rollback **in staging** | **Not in staging** | There is no staging database (docs/backend-v1/status.md B002: "no staging"; a staging project is owner-gated, docs/infrastructure-v2/status.md O8). The constraints, applying the schema twice, rollback with the header's SQL and a clean re-apply were tested in PGlite 0.4.6, which is PostgreSQL 17.5 (production runs 17.6), and each file wrapped as the one DO block a single SQL call needs gives the same database as the file applied directly (04-database.md §8). Production gets each migration once, each in one transaction, followed by the read-only checks in 04-database.md §9. |
| Original logging, weekly analysis and strength ranking still work | Met | The full suite (release section). The strength record skips holds and warm-ups, and no reader multiplies seconds by a load (07-logger.md, `holdSetReaders.test.ts`). `week_review_v1` is unchanged; the catalog fixes change what rows 139–145 and 232 give it (05-mappings.md). |
| One journey: coverage gap → exercise → exact day → logged bout → updated map | Met | `client/src/pages/Home.specializationJourney.test.ts`, through Home as an athlete moves: brachioradialis with no work and its drawing at rest; its suggested exercise added to Week 1 · Day 03 · Legs; that day started from Train and one set logged; back on the page, the row reads 1 direct dynamic bout and the drawing fills. |
| Muscle map checked against anatomical references | Partly | Checked against the atlas's sourced anatomy notes by an automated review, not by an anatomist (Limitations). |
| Phone screenshots: surface, deep, selected muscle, contribution ledger, add-exercise preview | Met | See Screenshots: each at 390 and 375, taken at the release head by `design/specialization/forearm/render-page.mjs` (18 Oct). |
| Bundle and asset sizes | Met | At `c2b98e2`, raw (gzip -9): the first screen's `App` chunk 893,916 (226,608) holds no drawing, claim or mapping text; the page's chunk `SpecializationPanel` 361,507 (103,354) holds the drawing, anatomy and calculator; Train adds `DeviceWorkoutTracker` 55,880 (17,263) and the variants and mappings, `mappings` 43,740 (10,767). 07-logger.md, "What each screen downloads". |
| Summary cost ("query plan") on representative data | Met, with a cost on long windows | No server query exists: the summary is computed on the device. `summary-cost.ts`, a year of 4 workouts a week (208 workouts, 4,056 sets, six exercises a workout, forearm work beside unmapped lifts): one arm's summary for this week or the rolling 7 days 6–19 ms (the mean of 20); both arms through the page's cache, computed once from empty, 12–20 ms, and 0.03–0.09 ms when the cache already holds them (an arm or window chosen again); Progress's 8 weekly summaries 57–70 ms; reading the log (source revision 50–56 ms, bouts 6.5–10 ms) once per change to it. A Custom window over the whole year costs 190–240 ms per arm. On a heavier year (312 workouts, 15,912 sets): this week 25–34 ms per arm, the whole year 0.7–0.9 s per arm. On the page (`page-cost.mjs`): tapping Specialize on Body Lab to the drawing drawn 346–380 ms with a week of history, 440–680 ms with the year, 0.9–1.8 s with the heavier year. That first figure includes fetching the page's code, which Home does not preload, from a local server (so no network time) and running it; on a phone's connection the download adds to it. Then Custom (the last 7 days) 44–190 ms; switching arm 20–110 ms, whether or not the cache holds the summary, since drawing the page takes most of it. The page's three summaries (this arm, the other arm, logged beside planned) each read the log through their own hook, so on open the log is read three times. The ranges span three runs of each script (the files hold the third); timings moved with the load other jobs put on the shared CPU. |
| Query plan for the owner-only tables | Met, in PGlite | `owner-table-plans.ts`: 2,002 accounts (2,000 added to the fixture's users A and B), 16,017 goals and 300,300 measurements, read as user A under RLS. A user's goals use an index on `user_id` (the `goals_no_overlap` exclusion index), a user's measurements `measurements_user_date (user_id, measured_at)`, with a date window in the index condition; each under 1 ms. |
| No private data in public sources or analytics | Met | Goals, measurements and exclusions are stored on the device only; nothing writes the two owner-only tables yet, and they are owner-only under RLS (tested). No file in `shared/specialization`, `client/src/lib/specialization` or `client/src/components/specialization` makes a network call (no `fetch`, tRPC, Supabase or beacon), and with the network off the page made no request (below). The seed and the reference tables hold only the atlas content. The client's only analytics is the Umami page-view script in `client/index.html`; the app sends it no event of its own. It can record the page's address, which holds only view choices (region, muscle, arm, window and its dates, mode, view, layer, map, plan week: `viewState.ts`), never a workout, goal or measurement value. |
| Offline state (§9) | Partly | The page reads only device storage. Opened once while online, it keeps working with the network off: switching arm and mode, reading the planned total and opening a muscle's sheet made no request, counted where the browser starts a request, not at the server (`page-offline.mjs`, `offline-checks.json`, `offline-after-load-390.png`). The app has no service worker, so if the network drops before the page's code has been downloaded, tapping Specialize shows the app-wide "Sports Genome hit a problem … Reload" screen rather than an offline message (`offline-before-load-390.png`); Reload brings the page back once online. The code gives every lazily loaded screen of the app the same behaviour (one error boundary for the whole app); only Specialize was checked. |

## Screenshots

Headless Chromium emulating an iPhone (viewport, `isMobile`, `hasTouch`, device scale 3), not an iPhone or Safari. All under `evidence/`.

The brief §11 set, at the release head (18 Oct), each at 390 × 844 and 375 × 667, by `design/specialization/forearm/render-page.mjs` (a week of forearm work and a four-day plan seeded on the device; `diagram-page-checks.json` records each shot's checks: no horizontal overflow, the tapped muscle pressed, the ledger heading on screen):

- **First screen:** `diagram-page-{390,375}-viewport.png`.
- **Surface view:** `diagram-page-{390,375}-palm-surface-right.png` (the map card).
- **Selected muscle:** `diagram-page-{390,375}-fcu-selected.png` (FCU tapped on the drawing as a finger would: the strip above the drawing, the muscle outlined and named).
- **Left arm, back view:** `diagram-page-{390,375}-back-surface-left.png` (the drawing mirrored, the words not).
- **Deep view:** `diagram-page-{390,375}-palm-deep-right.png`.
- **Contribution ledger:** `diagram-page-{390,375}-ledger.png` (FCU's sheet at "Where the numbers come from", the first exercise opened: each bout with its arm, its set and "Open this workout").
- **Add-exercise preview:** `diagram-page-{390,375}-add-preview.png` (the add sheet on a chosen day: planned totals before → after, the chosen muscle first).

Earlier and further evidence, also headless emulation: the drawing alone through the real component, every view and layer (`diagram-*.png`, 08-diagram.md); the page fixes (`page-fixes-2026-10-17/`, `page-followups-2026-10-17/`, `page-final-2026-10-17/`: the movement sheet and its ledger, Why this counts, the region-only list, a day's and a week's bouts, Not for me with its Undo, Progress with a best so far and a change of protocol, a toast's Undo); the logger (`logger-fixes-2026-10-17/`, 07-logger.md); offline (`release-gates-2026-10-18/`). The PNGs are 256-colour (quantized after capture) to keep the repository small.

## Release

- **Migrations, applied to production on 18 Oct 2026** (Supabase project `qiccnqkypbhlwpmjcsri`, Postgres 17.6) from commit `c2b98e2`, recorded in `supabase_migrations.schema_migrations` under the files' own versions, so the files keep their names: `20261016120000 specialization_atlas_schema` and `20261016120100 specialization_atlas_seed_v1`. Each was fetched at that commit, checked by SHA-256 against the repository file, executed and recorded in one transaction (`scripts/specialization/release/make-apply-sql.mjs`; 04-database.md §9 has why `execute_sql` and not `apply_migration`).
- **Verified in production, read-only:** every count above (24 nodes, 20 actions, 38 node actions, 60 claims, 71 sources, 119 variants, 418 mappings with 413 reviewed, 934 mapping sources, the drawing's 3 views and 127 paths); `forearm_mappings_v1` and `specialization_exposure_v1` published; 103 catalog rows linked to `public.exercises`; 19 tables with RLS and 25 policies; anon has no access to the schema, a signed-in user writes only goals and measurements; the Data API refuses the schema (PGRST106, exposed: public, graphql_public). Security advisor: nothing in `specialization`. Performance advisor: INFO only (new, unused indexes; foreign keys to the small reference tables without a covering index).
- **Left for the owner:** the `http` extension the apply used is still installed (a `DROP EXTENSION` on this project does not return; dashboard → Database → Extensions → http removes it).
- **Full suite at the release head:** 436 files and 4,002 tests passed, 6 skipped (`npx vitest run`); `npx tsc --noEmit -p .` clean; the seed's drift guard and the drawing's generator report current.
- **Pull request:** [LocalForgeWeb/Sports-genome#96](https://github.com/LocalForgeWeb/Sports-genome/pull/96), squash-merged into `main` on 18 Oct 2026 as `20d664a` ("Muscle Specialization Atlas, forearms first (#96)"), at head `7d32f0e`.
- **CI:** "Typecheck, test and build" passed on `7d32f0e` (GitHub Actions run 39086802103, 4 min 27 s); the Vercel preview built.
- **Production deploy:** Vercel deployment `dpl_4uaVZ4BtteUXMQJVD1J6Jvgmer9n` of `20d664a`, target production, READY 34 s after the merge and aliased to the production domains (`sports-genome-mauve.vercel.app` among them). Verified on 18 Oct at 01:37 UTC: `/api/health` answers `{"status":"ok","release":{"commit":"20d664a98988","deploymentId":"dpl_4uaVZ4BtteUXMQJVD1J6Jvgmer9n","environment":"production"}}`; `/?workspace=specialization&region=forearm` serves the app's page (200) with the release build's scripts; Vercel reports no runtime errors since. The page itself was checked in headless Chromium on the same client code before the merge (Screenshots); this sandbox cannot open the production domain in a browser, so no screenshot of the live site was taken.

## Limitations, said plainly

- **No measurement of internal load.** Every number is a count of logged or planned work (bouts, reps, hold seconds) credited by reviewed mappings. Nothing here measures muscle force, activation or growth, and the page never says otherwise.
- **The anatomy review was automated.** Each claim was checked against web-search excerpts of reputable sources (NCBI StatPearls, peer-reviewed papers, university anatomy pages), not by a clinician; six function claims rest on a single StatPearls source. A human anatomy review is recommended before this is presented as settled (03-anatomy-evidence.md).
- **A published version is frozen with everything it rests on.** Once `forearm_mappings_v1` is in the database, its variants, node actions, reviewed claims (their basis included) with their sources, the cited sources, and each mapped muscle's review, region, role and catalog key cannot be edited, un-reviewed or deleted, and the seed refuses content that would (04-database.md §4). A correction from a later anatomy review becomes a new claim key and a new mapping version (`forearm_mappings_v2`), with the old rows kept readable.
- **No staging run.** The migrations were tested in PGlite (PostgreSQL 17.5), not in a staging project, because none exists; production (17.6) is the first server Postgres they run on.
- **The drawing is a schematic**, checked against the atlas's anatomy notes and standard descriptions, not against a medical illustration review; it is not a growth forecast and does not bulge.
- **History before this release** has no recorded arm, hold seconds or straps: one-arm work from before reads as "no arm recorded" (counted for neither arm), holds logged as reps read as "time not recorded".
- **Catalog rows 401–416** have no `public.exercises` row or Supabase exercise mapping yet, so lifts logged on them stay on the device (the strength sync counts them as unmappable) and they are not scored for strength rank.
- **Goals, measurements and exclusions live on the device** under the account's key; the database tables for them exist but nothing syncs yet.
- **Five draft mappings** ship in the published version, shown as pending review; once reviewed they belong in `forearm_mappings_v2`.
- **Offline before the page has loaded** shows the app-wide error screen, not an offline message (Release gates).
- **Long windows cost more.** A Custom window over a year of history takes a few hundred milliseconds per arm on the sandbox's CPU, and opening the page with a heavy year about a second or more (Release gates).
- **A second production region** is data for the schema, calculator and components, but the tab title, search, the region choice, the rule's wording, the word "arm" and the two measures are still the forearm's ("Adding a production region").
- **Rules the owner may want to change:** a set logged in reps on an exercise now measured in seconds stays reps and is corrected in reps (07-logger.md); the published rule's text under "How this is counted" (`specialization_exposure_v1`) speaks of grip and straps on every region's page.
- **Two plan-editor edge cases:** on a hold, a target typed in the Plan editor that exactly matches a goal's rep default (for example "3 × 6–10") reads as that default, so it shows as "3 × 30 sec"; and a mid-workout swap of an exercise whose prescription varies by set ("3 × 10/8/6") starts the replacement's targets from the first planned set again (this predates the atlas; per-arm rows inherit it).
- **The smallest phones:** at 375 × 667 the selected muscle and the drawing's top are on the first screen in every state measured except **Back to …** together with Custom dates, which needs a small scroll; at 320 × 568 the page fits without sideways scrolling but the drawing is below the first screen (09-page.md).
- **Phone checks** are headless Chromium emulating an iPhone (viewport, touch, device scale 3), not a real iPhone or Safari.
