# Specialization atlas: design (16 Oct 2026)

What will be built, and the decisions each part is held to. The brief is `brief-2026-10-16.md`; why the architecture is device-first is `01-reconciliation.md`.

**Since 19 Oct, `10-multi-region.md` (the atlas for nine regions, wave 0 built on 20 Oct) supersedes §1, §2, §7 and §10 here where they differ**: shared libraries for actions, sources and variants, members and memberships, sides as region data, the heading as the region picker with Back in its row, a region's data loaded on its own. What follows is the forearm's design as first written, with the file names corrected.

## 1. Layers

| Layer | Where | Owns |
|---|---|---|
| Reference model | `shared/specialization/types.ts`, `ids.ts`, `rules.ts`, `registry.ts`, `regionIndex.ts`, `loggingTable.generated.ts`, `loggingPolicy.ts`, `holdCatalogIds.ts` | Types, stable ids, the published accounting rule, the region registry (full data, for the seed and the content tests) and its light twins: the regions' names, sides, words and entry points for the screens that link to the page and for the page's region picker, one generated row per mapped exercise for the workout logger, and the catalog ids measured in seconds for the first screens. Region-agnostic. |
| Region content | `shared/specialization/regions/forearm/*.ts`, with the shared libraries `shared/specialization/{actions,sources,variants}/` | The region record, nodes, members, node actions, claims, the mapping version and its mappings, and the listed unmapped exercises for the forearm (`region.ts`, `nodes.ts`, `members.ts`, `nodeActions.ts`, `claims.ts`, `mappings.ts`, `unmapped.ts`); its actions, sources and variants are records of the shared libraries (`actions/`, `sources/forearm.ts` and `sources/forearmMappings.ts`, `variants/forearm.ts`). Gathered without the drawing in `content.ts`, and with it in `index.ts`, which the page loads through `client/src/lib/specialization/loadRegion.ts`. Pure data. |
| Calculator | `shared/specialization/exposure.ts`, `time.ts`, `goals.ts` | `getSpecializationSummary()` over plain bouts; zoned intervals; goal validation and progress. No React, no storage, no client imports. |
| Device adapters | `client/src/lib/specialization/*.ts` | Plan and device sessions → bouts; goal and measurement stores; recommendations; the hook the page reads. |
| Page | `client/src/components/specialization/*.tsx`, CSS in the same folder (`specialization.css`, `specialization-diagram.css`, `plan-change.css`, `targets.css`, `progress.css`) | The Body Lab "Specialize" workspace, the diagram, the muscle sheet, the add/swap sheet, targets, measurements. Region-agnostic: shows any production region of the index, each loaded on its own (`loadRegion.ts`), with every side phrase from the region (`sideWords.ts`) and the heading as the region picker once there are two (10-multi-region.md §6). |
| Diagram geometry | `design/specialization/shared/*.mjs` (generator, checks, renderers) with the forearm's config and views in `design/specialization/forearm/` → `shared/specialization/regions/forearm/diagram.generated.ts` (generated; the seed reads it) | Palm, back and thumb-side views, surface and deep layers (and a middle layer on the palm side), bellies and tendons drawn apart, a path manifest validated against the node catalog. |
| Database | `supabase/migrations/*_specialization_*.sql`, `scripts/specialization/emit-seed.ts`, `server/specialization*.test.ts` | Schema `specialization`: reference tables seeded from the TypeScript content, goals and measurements with owner RLS. Tested in PGlite under anon, user A, user B and service roles. |

Tests for `shared/` code live under `client/src/lib/specialization/` (vitest does not collect `shared/`), and every test is a `.test.ts` file.

## 2. Ids

- Region: `forearm`. External region for contributors: `upper_arm`. Test fixture: `deltoid` (never registered in production).
- Nodes: `forearm.<abbr>` for the 19 muscles (`br, fcr, fcu, pl, fds, fdp, fpl, pt, pq, ecrl, ecrb, ecu, ed, edm, ei, apl, epb, epl, supinator`), groups `forearm.anterior` and `forearm.posterior`, adjacent `forearm.anconeus`, external `upper_arm.biceps` and `upper_arm.brachialis`. The full list is `regions/forearm/ids.ts` (`shared/specialization/ids.ts` keeps only the cross-region constants: the rule version and `variantIdFor`).
- Actions: `<joint>.<action>`, for example `wrist.flexion`, `forearm.pronation`, `fingers.dip_flexion`, `thumb.ip_flexion`. The full list is `shared/specialization/actions/ids.ts`.
- Variants: `cat-<catalogId>` (one default variant per catalog exercise).
- Mapping version `forearm_mappings_v1`. Rule version `specialization_exposure_v1`.
- Sources: short stable keys: `S1`–`S8` as in the brief (its S9 was removed: cited by nothing, 03-anatomy-evidence.md §3), `A1`–`A55` for anatomy references added during review, `M1`–`M8` for mapping sources.

## 3. Counting model (`specialization_exposure_v1`)

**Bout.** One logged work set, or one planned set. A drop set is one bout whose stages are its segments. A standard set is one bout with one segment.

**Excluded from completed totals.** Sets that are not `isCompletedSet`; sets marked `warmup`; anything in a session that is not `status: "completed"` (the live workout's draft and typed-but-unlogged sets); removed records (hard-deleted, so simply absent).

**Mapping lookup.** By catalog id. For sessions logged before ids were recorded, an exact catalog name match is used and labelled "matched by name". No fuzzy matching.

**Per mapping, a category:**

| Relationship | Mode | Variant is a deliberate hold | Category |
|---|---|---|---|
| direct | dynamic | — | `direct_dynamic` |
| contributing | dynamic | — | `contributing_dynamic` |
| direct or contributing | isometric | yes | `deliberate_isometric` |
| direct or contributing | isometric | no | `incidental_isometric` |
| stabilizer or incidental | isometric | — | `incidental_isometric` |
| any | mixed | — | `mixed` |
| unknown, or mode unknown | — | — | `unknown` |

**Per node and bout.** A node counts a bout **once**. If one bout gives a node two different categories (two actions in one set), the bout counts once under `mixed` and the parts are listed as components. Categories never overlap, so a node's bucket counts add up to the bouts that touched it.

**Totals per node:** `directDynamicBouts`, `contributingDynamicBouts`, `deliberateHoldBouts` and `deliberateHoldSeconds` (summed over segments), `incidentalBouts`, `mixedBouts`, `unknownBouts`, plus reps by category.

**Side.** A bout's side is `left`, `right`, `bilateral` or `unknown`. A bilateral bout counts once for each arm: 3 bilateral sets are 3 per side, not 6. A left bout leaves the right arm unchanged. Unknown-side bouts are reported in their own bucket and **never** added to either arm. Where the side comes from:
- the set's recorded `side`;
- else the variant's structural laterality (a barbell is two-handed);
- else, for planned unilateral work, "each side" (a product assumption, labelled in the ledger);
- else unknown.

**Straps.** A grip mapping marked `requiresNoStraps` does not credit a set logged with straps; it is listed as "strapped: grip not counted". Unknown straps keep the credit and say "straps not recorded".

**Not converted.** Hold seconds never become sets; external load × reps is labelled external volume-load, never muscle force; an incidental grip is never dynamic credit; a missing effort stays unknown.

**Unreviewed or missing mappings.** Draft mappings do not enter node totals; they appear as "pending review". An exercise tagged `forearms` in the catalog with no atlas mapping counts only in the **region-level unclassified** bucket and never fans out to nodes. A node with no reviewed mapping in the current mapping version, whatever the window, is drawn hatched ("mapping not reviewed"); a node with reviewed mappings but no work in the window is drawn empty. Unknown never reads as zero.

**Region total.** Distinct bout ids that touched any node of the region, per side. This is not the sum of node rows.

**Fractional accounting** is not offered in v1. The raw categories are the published model.

## 4. Intervals

- **Completed:** `calendar_week` (Monday 00:00 to the next Monday, in the chosen IANA zone), `rolling_7d` (now minus 7×24 h to now) or `custom` (two local dates, inclusive). Zone arithmetic uses `Intl` and is tested across DST in `America/New_York` and `Europe/London`. A session belongs to the interval holding its `completedAt` (else `startedAt`).
- **Planned:** the plan week the athlete trains from (`trainingWeekFor`), or the week chosen on the page. The page always names it ("Plan Week 2, as written"): the plan carries no dates.
- **Same interval:** the planned/completed toggle keeps the side, the window and the selection. Comparison in the ledger uses the plan week paired with the calendar week.

## 5. Goals, measurements and notes

- **Goal:** `{regionId, nodeId | actionId, side, metric, target, period, startsOn, endsOn?, timezone}`. Metrics are `direct_dynamic_bouts`, `deliberate_hold_bouts` and `deliberate_hold_seconds`. Any positive target is allowed, including above 15. There is no default target and no automatic increase. One active goal per region, target, side, metric and period: an overlapping one is refused with the reason. A "both arms" entry writes two explicit goals.
- **Progress copy:** "8 of your 20" / "40% of your target". Never "optimal". With no goal: "Not targeted".
- **Measurements:** circumference (cm) and grip force (N) per side, with a protocol: landmark, distance from it, posture, pumped or not, device, time of day. A new reading starts from the protocol of the latest reading for the same region, arm and measure, so the same place and posture are the default; a reading taken differently is marked on the chart. A region lists the measures it offers (`measurementMetrics`). Charts sit beside exposure on aligned time axes, never one shared y axis. No inference from circumference to a single muscle.
- **Notes:** the session note that already exists. The page lists recent notes from sessions that had work on the region. No new questionnaire.
- **Storage:** device, under `scopedKey("sports-genome-specialization-goals-v1")` and `scopedKey("sports-genome-specialization-measurements-v1")` (and the suggestion exclusions under `scopedKey("sports-genome-specialization-exclusions-v1")`), validated on load and tolerant of corrupt or refused storage.

## 6. Logger changes (only where relevant)

- New sets get `id` at creation.
- **Side:** a three-way control (`Left · Right · Both`) on the live set card only for atlas variants whose laterality is `unilateral` or `either`. After a one-arm set it offers the other arm, after a Both set Both; before any set is logged on the exercise in that workout, an either-arm exercise starts on Both and a one-arm exercise with nothing chosen. Two-handed exercises never show it.
- **Hold seconds:** a "Seconds" box replaces reps for variants whose measure is `seconds`. A set completes with seconds and no reps.
- **Straps:** `Straps · Used / Not used` on the exercise in the live workout, only for variants with a straps-sensitive grip mapping, and only once the athlete has an active specialization target ("until relevant").
- **Sets per arm:** with an active target, a planned set of a one-arm exercise is two rows, Right then Left, because the atlas counts a one-arm exercise's planned sets per arm (07-logger.md).
- Side and hold seconds survive `normalizeSet`, straps the exercise normalizer, and all three appear in the recap. Strength estimates, volume and percentiles skip hold sets.

## 7. Page

**Route:** workspace `specialization`, Body Lab's fourth tab **Specialize**. URL params: `region`, `node`, `limb` (`left`/`right`), `window` (`week`/`7d`/`custom`), `from`/`to` (custom), `mode` (`planned`/`completed`), `view` (the drawing's own view id; left out for the drawing's first view, and dropped when the drawing has no such view), `layer` (`surface`/`intermediate`/`deep`), `map` (`volume`/`target`), `pweek` (plan week). Changes inside the page use `replaceState`; entering the page pushes. Other workspaces strip these params. Back returns to the screen that opened it.

**Entry points:** Body Lab tab; the Muscles map's next step when the forearm or brachioradialis is selected; Review → Week → forearm muscle detail, "Explore forearm coverage" (opens with that plan week and `mode=planned`); universal search "Forearm specialization".

**Phone layout (390 × 844 first; the selected muscle and the top of the drawing are on the first screen at 375 × 667 and 430 × 932 too, in every state 09-page.md tabulates, Back with Custom dates included since wave 0):**
1. Heading "Forearm specialization", on one line from 375 px, with "‹ Muscles" (Back, by the opening page's short name) in the same row when another page opened it (10-multi-region.md §6.1). The tab row above it already names Body Lab · Specialize, so there is no eyebrow. What is counted is said under the map card.
2. Controls in two rows: Completed / Planned beside Left / Right arm; then the window (This week · Rolling 7 days · Custom, with Custom's two date fields inline, "From [date] To [date]"), or the plan weeks in Planned mode. Then one line: the window in words, the arm, and for this week the pair from §4 (logged beside planned). The pair is a total, so with a pair the whole line is one button (44 px tall, the pair underlined in link colour with an arrow at its end; its words stay on-dark ink, which reads at AA on the Body Lab blue where link ink does not) that opens the sets behind it: this week's logged bouts on the arm (and any with no arm recorded), then the plan week's.
3. Diagram card, its controls in two rows: the heading beside the view (Palm · Back · Thumb side); the layer (Surface · Middle · Deep, as each view has them: the palm side has a middle layer, FDS) beside the map (Volume · Target). Each segment wraps to a row of its own rather than push the page sideways. Thumb side and pinky side labelled on the drawing, mirrored for the left arm. Fixed bins with a numeric legend: 0 · 1–2 · 3–5 · 6–9 · 10–14 · 15+ bouts, on the existing `--sg-exposure-*` ramp (never the rank or role colours). Hatching means mapping not reviewed; an empty outline means mapped, no work. Target mode bins: under 25 %, 25–49 %, 50–74 %, 75–99 %, 100 % and over, with the number always shown.
4. Selected muscle, inside the card between its controls and the drawing: name, layer badge, one exposure sentence, its targets, and one CTA: "Inspect coverage" (opens the sheet), or "Add targeted exercise" when it has no work in the window. A tap on the drawing that changes this strip's height scrolls the page by as much, so the drawing stays under the finger.
5. Muscle list, sorted by direct bouts: name, layer badge, a stacked bar (direct, other dynamic, holds, incidental) and numbers. Deep muscles are marked "Deep".
6. "Coverage to review": the three most useful findings, then "Show N more".
7. Disclosures: Exercises in this window (bouts per day, each day with work a button that opens that day's bouts) · Targets · Progress (measurements) · How this is counted (rule and sources).

**Muscle sheet** (bottom sheet, the existing sheet pattern), in the brief's order: name, location, layer badge → What it does (with a small action glyph) → How it contributes to shape → exposure for the window and arm → contribution ledger (exercise → bout → segment) → your target (inline editor) → exercises for this muscle (§8: what nothing here can do said once above them, each with why, the already-covered list) → sources and method.

**Add or swap sheet:** pick the exercise → choose plan week and day → Add, or Swap with an exercise already in that day → preview the change in planned totals only (before → after per affected node, other muscles affected, overlap with exercises already there) → Save. Save writes that exact day, shows a toast with Undo, and leaves the page where it was.

**Motion and access:** sheet 200 ms (`--sg-motion-base`), bars 200 ms, no idle motion, reduced motion respected; 44 px targets; the selected muscle and updated totals announced through a polite live region; at 320 px everything wraps without horizontal overflow.

## 8. Recommendations

Candidates are exercises with a **reviewed** mapping that the calculator credits as work for the selected node or action: direct dynamic work, a direct deliberate hold, or a contributing mover's work. Relevance is read through the counting rule (`categoryFor`), so work counted only as incidental grip or steadying is never a candidate and never "already covered by". `recommendFor` (`client/src/lib/specialization/recommendations.ts`) ranks them by:
1. work that counts toward one of the athlete's unmet targets for it, as the calculator counts it: a dynamic-bouts target takes direct dynamic sets, a hold target takes deliberate holds, and a set that loads a muscle two ways counts as mixed, for neither;
2. direct work on one of the muscle's main (prime) actions that had no direct work in the window, when another of its actions had some on this arm;
3. relevance (direct dynamic above direct hold above contributing);
4. equipment available in the athlete's profile;
5. overlap: an exercise already in the plan week, or, in completed mode, already logged in the window (on this arm or with no arm recorded), ranks lower and is listed under "Already covered by", with its plan days and then the sets logged ("Wrist Curl: planned on Day 01 · Pull; 4 sets logged in this window");
6. laterality: one-arm work first when the selected arm is behind the other;
7. name.

Exclusions the athlete set (exercises, equipment) remove candidates outright. A kind of work whose every target is already met is not suggested again; contributing work, which answers no target, stays below the work that does.

Each candidate says why it fits and names only a target it can fill ("Direct wrist extension for extensor carpi ulnaris; 2 of your 10 direct dynamic bouts this week"); one that fills none of the athlete's targets says so, and why when the reason is the kind of work ("not a hold, so it does not count toward your target of 3 deliberate hold bouts this week"). A candidate for a missing main action leads with it ("Ulnar deviation: no direct work in this window."). Two things are said once, above the suggestions, rather than left to each candidate (`Suggestions.tsx`):
- a target no reviewed exercise can fill, the recommender's `targetNote` ("No reviewed exercise for flexor carpi radialis counts toward your target of 3 deliberate hold bouts this week."); with no candidate at all, the empty reason leads with it instead, so it is never said twice;
- a main action with no direct work that no candidate covers (`missingActionNote` in `model.ts`), in one sentence with why, worked out as the recommender decides: "Supination, a main action of this muscle, has no direct work in this window, and no reviewed exercise trains it directly yet." (the biceps, which Lever Supination trains only as a helper); "… the exercises that train it directly are left out by your choices under What is suggested" (the exercise or its equipment); or "… answer a target you have already met, so none is suggested". A fact about the records and the mapping: it names no target and no shortfall.

The "Already covered by" list is words: each exercise with the plan days it is on, then the sets logged in the window, never the logged entry read as a day.

A node with no reviewed mapping gets "This muscle's exercise mapping is not reviewed yet" instead of suggestions. Nothing is suggested only to raise a number. An above-target node gets no suggestions; it gets a neutral note on how much it already gets.

## 9. Database

The schema `specialization` holds:
- regions, nodes, actions, sources, claims, claim_sources, node_actions;
- diagram_assets, diagram_views, diagram_paths and diagram_labels;
- catalog_exercises and exercise_variants;
- mapping_versions, variant_mappings and mapping_sources;
- rule_versions;
- goals and measurements.

**Keys.**
- `catalog_exercises.supabase_exercise_id` references `public.exercises(id)` where the exercise exists there.
- Every other key is a real foreign key inside the schema.
- There is no ledger table (see `01-reconciliation.md`).

**Integrity rules.**
- Triggers refuse a parent cycle.
- A composite foreign key keeps each claim on its own node.
- Published mapping and rule versions are immutable.
- Publishing a mapping version runs the publication rule (04-database.md §4): every mapping needs a source, and reviewed mappings need what they rest on reviewed. Draft rows may stay in a published version: hidden from users, labelled pending review on the page, never counted.
- An exclusion constraint (btree_gist) refuses overlapping active goals.
- A trigger validates IANA zones against `pg_timezone_names`.

**Access.**
- RLS is enabled on every table.
- Reference rows are readable by `authenticated` only when reviewed or published; no write grants.
- Goals and measurements have owner-only select, insert, update and delete (`using` and `with check`).
- No `security definer`.
- Default grants are revoked.
- The schema is not added to the Data API.

**Seeding.** The seed SQL is generated from the TypeScript content (`scripts/specialization/emit-seed.ts`). A test fails if the committed seed drifts from it.

**Tests.** Migrations, constraints and RLS are tested in PGlite (real Postgres in WASM): apply, re-apply, roll back, re-apply.

**Production.** Applied additively through the Supabase MCP, then verified read-only. Each file is committed under the version Supabase recorded. Owner-gated and not yet done (04-database.md §9). There is no staging database, so PGlite is the only rehearsal.

## 10. Extensibility check

A `deltoid` fixture (`client/src/lib/specialization/__fixtures__/deltoidRegion.ts`) lives in tests only and is never registered. It is a second region in full: three heads and an external triceps, a handful of mappings, a small drawing from the front, the side and the rear (the lateral head drawn from the side), its own page words and circumference as its only measure. Everything that differs between regions is region data:
- **The drawing's views.** `DiagramAsset.viewOrder` lists the views in the page's order with the words on their buttons (forearm: Palm · Back · Thumb side; deltoid: Front · Side · Rear). A view id is the drawing's own, any `^[a-z][a-z0-9_]*$`, in TypeScript (`DiagramViewId` is a string), in the address and in the database (`diagram_views`). The page writes `view` to the address only when a view other than the drawing's first is chosen (choosing the first removes it); an address naming a view the drawing does not have, hand-edited or another region's, shows the first view.
- **The page's words.** `SpecializationRegion.wording`: the heading over external muscles ("Upper-arm muscles credited here"), the word for incidental work on the bars and their key ("grip": "Incidental grip", "3 grip"), and the Progress subtitle ("Circumference and grip, by arm").
- **The measures.** `SpecializationRegion.measurementMetrics`: Progress offers only these (forearm: circumference and grip; deltoid: circumference), each starting from its own landmark and posture.

Tests: the calculator, adapters and suggestions run on the fixture (`regionAgnostic.test.ts`); the page renders it with no deltoid code (`SpecializationPanel.deltoid.render.test.ts`: heading, Front · Side · Rear, the fixture's group heading and incidental word, the drawing's muscles selectable, circumference only, and no forearm, grip, palm or thumb-side word on the page outside "How this is counted"); the seed loads it with no schema change and reads it back whole (`specializationSeed.test.ts`); and a source scan fails if the calculator, the adapters or any page source file (every non-test `.tsx` and `.ts` in `client/src/components/specialization/`: the components, `model.ts`, `diagramGeometry.ts`) names a region or the forearm's view and group words in its code or strings (comments aside), with one allowed line, ActionGlyph's action-verb pattern.

Still forearm-worded on every region's page: "How this is counted" shows the published rule's own text (`rules.ts`, `specialization_exposure_v1`), which speaks of grip credit and straps. The muscle sheet's "Incidental … or steadying" line and the exposure sentence take their incidental word from `wording.incidentalWork` (`MuscleSheet.tsx`, `exposureParts` in `model.ts`).

Since wave 0 (10-multi-region.md §6) the browser tab title, the search destination, the region the Specialize tab opens, the side words ("arm", "leg", "side") and the measures are region data (the heading, `regionIndex`, `sideWordsFor`, `measurementMetrics` with `girth_cm`). What still names the forearm is the one published rule version, whose text speaks of grip and straps, until rule v2 (wave A). README.md ("Adding a production region") lists every file and list a new region needs.

## 11. Ownership for parallel work

| Lane | Files |
|---|---|
| Foundation (done first) | `shared/specialization/{types,ids,rules,registry}.ts` |
| Anatomy content and evidence | `shared/specialization/regions/forearm/{nodes,members,nodeActions,claims}.ts`, `shared/specialization/actions/`, `shared/specialization/sources/forearm.ts` (moved there from the region folder in wave 0) |
| Mappings and catalog | `shared/specialization/regions/forearm/{mappings,unmapped}.ts`, `shared/specialization/variants/forearm.ts`, `shared/specialization/sources/forearmMappings.ts` (wave 0's moves), catalog rows 401+, catalog fixes, photos for new rows |
| Calculator | `shared/specialization/{exposure,time,goals}.ts`, `client/src/lib/specialization/` adapters, deltoid fixture, calculator tests |
| Logger | `deviceWorkoutLog.ts`, `setEntryFields.ts`, `DeviceWorkoutTracker.tsx`, recap, readers that must skip holds |
| Diagram | `design/specialization/forearm/` (now the forearm's config and views; the shared generator is `design/specialization/shared/`), `shared/specialization/regions/forearm/diagram.generated.ts`, `client/src/components/specialization/SpecializationDiagram.tsx` |
| Database | `supabase/migrations/`, `scripts/specialization/`, `server/specialization*.test.ts`, `package.json` (PGlite) |
| Page and navigation (after the above) | `client/src/components/specialization/*`, `Home.tsx`, Review link, search, CSS |

## 12. Diagram renderer contract (room for a 3D viewer)

The page never depends on how the forearm is drawn. Any renderer takes the same props as `SpecializationDiagram`:
- `asset`, whose `viewOrder` names its views and the words for them;
- `view` (one of the asset's view ids) and `layer`;
- `mirrored` (left arm);
- `fillFor(nodeId)`, returning `bin n`, `zero`, `hatch` or `none`;
- `selectedNodeId`, `onSelect(nodeId)`, `labelFor(nodeId)`, `describeFor(nodeId)`, and an optional `caption`.

The counting, list, ledger, targets and add/swap flows read node ids only. Neither the page nor the renderer names a view: the view buttons, the drawing's caption and the "drawn in Palm · Middle" note read the asset's `viewOrder`.

On 16 Oct the owner showed a separate 3D upper-limb viewer in progress elsewhere. It uses the Open3Dmodel GLB, with Z-Anatomy and BodyParts3D content, and kebab-case mesh ids such as `brachioradialis`, `flexor-carpi-radialis` and `flexor-digitorum-profundus`. To plug it in later:
1. Map its mesh ids to node ids through node aliases.
2. Implement the props above.
3. Lazy-load it so Three.js and the model only download when the 3D view is opened.
4. Keep the SVG as the default and the fallback offline.

Licensing has to be cleared first:
- The CC BY-SA model needs attribution in the app, and any adapted model stays CC BY-SA.
- GPL viewer code must not be copied into this repository.
- Three.js (MIT) is fine.
