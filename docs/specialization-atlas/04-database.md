# Specialization atlas: the database (16 Oct 2026)

The Postgres side of the atlas, as built. The design is `02-design.md` §9; why the app counts on the device is `01-reconciliation.md`. Nothing here has been applied to production: §9 says what the owner still has to do.

| File | What it is |
|---|---|
| `supabase/migrations/20261016120000_specialization_atlas_schema.sql` | Schema `specialization`: tables, rules as triggers, RLS, grants. Hand-written. Rollback in its header. |
| `supabase/migrations/20261016120100_specialization_atlas_seed_v1.sql` | The reference content as upserts, with deletes for rows the content no longer has (§7). **Generated**; never edit it by hand. |
| `scripts/specialization/emit-seed.ts` | The generator: `npx tsx scripts/specialization/emit-seed.ts` writes the seed, `--check` exits 1 when it is stale. |
| `server/fixtures/specializationPg.ts` | A Supabase-shaped Postgres 17 in WASM (PGlite) for the tests. |
| `server/specializationSchema.test.ts` | Structure, grants (tables and functions), RLS as anon / user A / user B / service role, every constraint and trigger, TRUNCATE, rollback, and the DO-block application compared with a direct one. |
| `server/specializationSeed.test.ts` | Drift guard, idempotence, the content read back field by field (regions with their page words and measures, and each drawing whole with its views), versioning, refused rewrites and removals under a published version, a cleaned draft, a second region with its own words and a drawing with its own views. |

## 1. Why a schema of its own, and who reaches it

`public` has open default privileges in this project (every new table there is granted to `anon` and `authenticated`), so the atlas lives in `specialization`, which has none (checked read-only on 16 Oct: no global default ACLs exist). The schema is **not** in the Data API's exposed schemas, so PostgREST cannot serve it, and `pg_graphql` is not installed in the project. Inside the database everything is revoked from `PUBLIC`, `anon`, `authenticated` and `service_role` and then granted narrowly (§5), so the grants are correct even if the schema is exposed one day.

Today nothing reads or writes it: the page reads the TypeScript content in its bundle and keeps goals and measurements on the device. The database copy exists so that a server-side summary, a later sync of goals and measurements, and the owner's own queries all read the same reviewed content the app counts with.

## 2. No exposure ledger

The brief's `exposure_ledger` is not created. Workouts, sets and drop-set stages live in `localStorage`; Supabase has no session, set, bout or segment table, so a ledger row's `source_bout_key` would point at nothing: the "dangling key" the brief forbids. Exposure is calculated on demand on the device from the records Home, Plan, Review and Progress already read (`06-calculation.md`). When bouts reach a server table, a ledger can be added with real composite keys to it.

## 3. Tables and keys

| Table | Key | Notes |
|---|---|---|
| `regions` | `id` (`forearm`) | `status`: `production`, `fixture`, or `reference` (a region that only holds another region's external contributors: `upper_arm`, for the biceps and brachialis; it has no page). `body_map_keys`, `entry_label`, and `node_for_body_map_key` (jsonb object: a body-map key that opens the page on one muscle, `{"brachioradialis": "forearm.br"}`). The page's words for the region (`RegionWording`): `external_group` ("Upper-arm muscles credited here"), `incidental_work` ("grip"), `progress_subtitle` ("Circumference and grip, by arm"), each non-blank; `measurement_metrics` (text array, in order: the measures Progress offers, from the measurements table's own list: `{circumference_cm, grip_force_n}` for the forearm). A region with a page must have its heading, entry label and the three words (`regions_page_copy`); a reference region has none and offers no measure. |
| `nodes` | `id` (`forearm.fcu`) | `region_id` → regions; `parent_id` → nodes; `database_muscle` → `public.muscles(canonical_name)` (a real key: all five values exist there); `catalog_muscle_key` stays text because the client catalog is code, not a table. `role`, `border`, `location`, `what_it_does`, `shape_note`, `caveats`, `sort_order` (content order). |
| `actions` | `id` (`wrist.flexion`) | |
| `sources` | `id` uuid; `source_key` unique (`S2`, `A14`, `M3`) | Keys are shared across regions: two regions may name one only with identical content (the generator refuses otherwise). |
| `claims` | `id` uuid; `claim_key` unique: `<region>:<claim id>` (`forearm:fcu.function`) | Claim ids are only unique inside one region's data (the deltoid fixture would also have an `anterior`), hence the prefix. Unique `(id, node_id, kind)`. `reviewed_on` is a date, as in the content. |
| `claim_sources` | `(claim_id, source_id)` | `locator`, `qualification`, `sort_order`. |
| `node_actions` | `(node_id, action_id)` | Foreign key `(claim_id, node_id, claim_kind)` → `claims(id, node_id, kind)` with `claim_kind` a stored constant `'function'`: the claim must be a **function** claim of the **same** node. The brief asked for `(claim_id, node_id)`; this is that plus the kind. |
| `diagram_assets` | `id` uuid; unique `(asset_key, version)` | View box, licence note. |
| `diagram_views` | `(asset_id, view)` | A drawing's views (`DiagramAsset.viewOrder`): `view`, the drawing's own id, checked for its shape (`^[a-z][a-z0-9_]*$`), not against a list; `label`, the words on its button ("Palm", "Thumb side"; the deltoid fixture's "Front", "Side", "Rear"), non-blank; `sort_order`, the order the page offers them. Cascades with its asset. |
| `diagram_paths` | `(asset_id, path_id)` | `view` → `diagram_views (asset_id, view)` of the same asset (`diagram_paths_view_declared`), so nothing is drawn in a view the drawing does not declare, and a view still drawn in cannot be deleted. `layer`: the drawing's own id too (surface, intermediate, deep), checked for its shape. `kind`, `node_id` (nullable; a belly must have one), `d`, `sort_order` (draw order). |
| `diagram_labels` | `(asset_id, view, layer, sort_order)` | "Thumb side", "Pinky side": text, x, y, anchor. `view` → `diagram_views` as on paths (`diagram_labels_view_declared`); `layer` as on paths. |
| `catalog_exercises` | `catalog_id` (the app catalog's id) | `name`; `supabase_exercise_id` → `public.exercises(id)`, null where the exercise is not there (§7). |
| `exercise_variants` | `variant_key` (`cat-139`) | Every execution dimension of `ExerciseVariant`, each with its vocabulary; `elbow_angle_deg` only where the exercise defines it. Frozen while a published version maps it (§4). |
| `mapping_versions` | `id` uuid; `version_key` unique | `region_id`, `state` (draft, published, retired), `published_at` (set exactly when not draft), `method_notes`. |
| `variant_mappings` | `id` uuid; unique `(version_id, mapping_key)` and unique nulls-not-distinct `(version_id, variant_key, node_id, action_id)` | `relationship`, `muscle_mode`, `evidence_basis`, `allocation`, `requires_no_straps`, `rationale`, `review_status`. |
| `mapping_sources` | `(mapping_id, source_id)` | `locator`, `limitation`, `sort_order`. |
| `rule_versions` | `id` (`specialization_exposure_v1`) | `specification` jsonb object, `published_at`, `notes`. |
| `goals` | `(user_id, id)` | §6. |
| `measurements` | `(user_id, id)` | §6. |

Every enumerated column has a CHECK vocabulary equal to the union in `shared/specialization/types.ts`; a test parses both and fails if they drift (`regions.measurement_metrics` is checked as an array contained in `MeasurementMetric`'s list). The diagram's view and layer ids are the exception: they belong to each drawing, so the database checks their shape only, and so does the seed generator before it writes them. So a second region (the deltoid fixture: its own words, circumference only, a drawing from the front, side and rear) is rows, not a new column or table (seed test). Indexes: the brief's `goals_user_dates`, `measurements_user_date`, `mapping_variant_version`, plus the foreign keys that are looked up or cascaded. Small reference foreign keys (a region on an asset or a version, an action on a mapping) are left unindexed on purpose; the project's advisors may list them as information.

## 4. Rules the database enforces

**Anatomy.**
- A node cannot become its own ancestor: a trigger walks up from the new parent (not only the self-parent CHECK). Parent changes take a transaction-scoped advisory lock, so two concurrent changes cannot each pass and together close a loop.
- A node action rests on a function claim of its own node (the composite foreign key above); turning that claim into another kind is refused too.

**Mapping versions: draft → published → retired.**
- A version is inserted as a draft, filled, then published by `update ... set state = 'published'`. Inserting one already published is refused.
- A draft may change freely and may be deleted. A draft cannot be retired (delete it).
- Once published, the version row, its mappings and their sources are immutable, for every role, the owner included. Its state may only move to `retired`. Published and retired versions cannot be deleted. Changing mappings means a new version key; the app chooses its version explicitly and never adds versions together.
- What the version rests on is frozen with it (next list).
- Row inserts are checked after the write, so an upsert that changes nothing (the seed applied again) never trips the guard; updates and deletes are checked before. The guards lock the version row `FOR SHARE`, so a publish running at the same moment as an insert waits for it, and its check then sees the row.

**What a published version rests on.** A version is more than its rows: a variant's `deliberate_hold` decides whether a direct isometric mapping counts as a deliberate hold (cat-403's FDS and FDP), the publication rule rests on the muscles' reviewed status, function claims and node actions, and users read the claims and sources behind every row. While any published **or retired** version depends on one of these rows, triggers refuse, for every role and the owner too:
- any change to, or deletion of, an `exercise_variants` row one of its mappings uses (an update that changes nothing passes);
- any change to, or deletion of, a `node_actions` row whose node and action one of its mappings names;
- a mapped muscle (`nodes`) leaving `reviewed`, or being deleted; its names and descriptions may still be edited;
- on a **reviewed** claim of a mapped muscle: a change of key, node, kind or statement, a review status other than `reviewed`, or deletion; its basis, review date and note may still be edited. A draft or rejected claim was never shown or relied on and stays free; a new claim may be added and reviewed, and is then frozen like the rest;
- adding, changing or removing a `claim_sources` row of such a claim;
- a change to the `source_key`, `url`, `title` or `evidence_type` of a source its mappings or such claims cite, or deleting it; its DOI, retrieval date and notes may still be edited.

A new record is always allowed: a new variant, node action, claim or source (only a frozen claim's own list of sources is closed, as above). A changed one needs a new key, and where mappings must point at it, a new mapping version. A claim found wrong after publication therefore stays as published and readable, in the content as well (the seed refuses content that drops it, §7); the correction is a new claim under a new key (§9). Publishing locks every row the version will rest on `FOR SHARE` before it checks the rule, so a change made at the same moment either commits first (and the check sees it) or waits and is then refused; the one guarded insert (a claim's source) locks the versions instead, like the mapping guards.

**TRUNCATE** fires no row trigger, so a statement-level `BEFORE TRUNCATE` trigger on `mapping_versions`, `variant_mappings`, `mapping_sources`, `rule_versions`, `exercise_variants`, `nodes`, `node_actions`, `claims`, `claim_sources` and `sources` refuses it while a published or retired version exists (`rule_versions`: while a published rule exists), `TRUNCATE ... CASCADE` from another table included. A database holding only drafts can still be cleared. The service role holds no TRUNCATE privilege at all (§5).

**The publication rule** (`specialization.mapping_version_problems(version_id)`, callable by the service role to check a draft first; the trigger runs it on publish). A version is published only when:
1. it has at least one mapping;
2. no mapping is `rejected` (rejected rows are removed before publishing; they are not history);
3. every mapping, reviewed **or draft**, has at least one source;
4. every reviewed mapping has a source with a locator (where in the source);
5. every mapped muscle has a reviewed function claim;
6. every muscle a reviewed mapping credits is itself reviewed;
7. every mapping that names a joint action names one its muscle performs (a `node_actions` row, so it rests on that muscle's function claim).

**Draft rows in a published version are allowed.** `forearm_mappings_v1` is published with 413 reviewed rows and 5 drafts (`cat-144`, `cat-145`, `cat-299`, `cat-409` → FPL; `cat-317` → brachioradialis). A draft row keeps its source and its pending-review label; RLS never shows it to a signed-in user, and the calculator never counts it (it appears as "pending review"). Reviewing one of them later means publishing `forearm_mappings_v2`, because v1 is frozen with them as drafts. Rule 7 is the content lane's own test made strict: that test only checks the action when the muscle has node actions at all; here an action must always be one of the muscle's node actions (all 418 forearm rows pass).

Not enforced at publication: a diagram link per mapped muscle. The diagram is optional (null until drawn) and the page has a list alternative, so a missing drawing must not block counting.

**Rule versions.** A rule version is published when `published_at` is set; from then on it can neither change nor be deleted.

**Goals.** Exactly one of muscle or movement; `ends_on >= starts_on`; `target > 0` and `<= 10000` (the device's `GOAL_TARGET_SANITY_MAX`, a typo guard; it also refuses NaN and infinity); the time zone must be in `pg_timezone_names` (trigger, on insert and on a zone change); and the exclusion constraint `goals_no_overlap` (btree_gist) refuses two goals for the same user, region, muscle-or-movement, side, metric and period whose date ranges share a day (`daterange(starts_on, ends_on, '[]')`, an open end runs forever; the muscle and movement ids are prefixed so they can never compare equal). An exclusion constraint holds under concurrent inserts, which a check before the write does not.

**Measurements.** `value > 0` and finite; `protocol` must be the device's `MeasurementProtocol` object: a non-empty `landmark`, `distanceFromLandmarkCm` null or ≥ 0, `posture` and `condition` from the app's lists, `device` null or text, `timeOfDay` null or `HH:MM`, and no other keys.

## 5. Access

| | anon | authenticated (a signed-in user) | service_role |
|---|---|---|---|
| Schema usage | no | yes | yes |
| `regions` | — | select: production and reference regions | select, insert, update, delete |
| `nodes` | — | select: `status = 'reviewed'` | select, insert, update, delete |
| `claims` | — | select: reviewed claims of reviewed nodes | select, insert, update, delete |
| `claim_sources`, `node_actions` | — | select: rows of reviewed claims of reviewed nodes | select, insert, update, delete |
| `actions`, `sources`, `diagram_*`, `catalog_exercises`, `exercise_variants` | — | select: all | select, insert, update, delete |
| `mapping_versions` | — | select: `state = 'published'` | select, insert, update, delete |
| `variant_mappings` | — | select: reviewed rows of published versions, on reviewed nodes | select, insert, update, delete |
| `mapping_sources` | — | select: sources of those rows | select, insert, update, delete |
| `rule_versions` | — | select: published | select, insert, update, delete |
| `goals`, `measurements` | — | select, insert, update, delete: own rows only; update has USING and WITH CHECK | select, insert, update, delete (bypasses RLS) |
| `mapping_version_problems()` | — | — | execute |
| every other function | — | — | — |

- RLS is on for every table. Owner policies use `(select auth.uid()) = user_id`, evaluated once per statement.
- No reference table grants insert, update or delete to `authenticated`.
- The service role has exactly select, insert, update and delete: not TRUNCATE (it would skip every row guard), TRIGGER or REFERENCES. The writes it has are still bound by the immutability triggers (§4).
- No `SECURITY DEFINER` function exists; every function pins `search_path = ''`.
- Trigger functions need no execute grant: Postgres checks that when the trigger is created, not when it fires.
- **A new function is executable by everyone until revoked.** Postgres gives `PUBLIC` EXECUTE on every function it creates, and `alter default privileges in schema ...` cannot take that away (per-schema defaults only add to the global ones), so nothing here relies on default privileges. The schema file's `revoke all on all functions in schema specialization from public, anon, authenticated, service_role` covers the functions it creates; **a later migration that adds a function (the planned summary RPC, for one) must revoke it from `public, anon, authenticated` itself and grant only what is meant.** `server/specializationSchema.test.ts` walks `pg_proc` with `aclexplode` (a NULL `proacl` counts as the default, PUBLIC EXECUTE) and fails when PUBLIC, `anon` or `authenticated` can execute any function in the schema outside its allow-list, which is empty today.

## 6. Goals and measurements: a straight copy of the device records

The columns are `SpecializationGoal` and `SpecializationMeasurement` field for field, so a sync is a copy:

| Device (`types.ts`) | Column |
|---|---|
| `id` (`goal-…`, `…:left`, `measure-…`) | `id text`, unique **per user**: the primary key is `(user_id, id)`, so two accounts can hold the same device id and no account can block another's. |
| `regionId`, `nodeId`, `actionId` | `region_id`, `node_id`, `action_id` (foreign keys) |
| `side`, `metric`, `period` | same names, same vocabularies |
| `target`, `value` | `numeric` |
| `startsOn`, `endsOn` | `date` |
| `timezone` | `text` (IANA, checked) |
| `measuredAt`, `createdAt`, `updatedAt` | `timestamptz` |
| `protocol` | `jsonb`, the object as it is (checked key by key) |
| `notes` | `text` |
| — | `user_id` (default `auth.uid()`, → `auth.users`, cascades on account deletion); measurements also get `created_at` and `updated_at` for sync bookkeeping. |

`updated_at` follows the last write unless the write sets it itself, so a sync can carry the device's own time. A stored goal whose `createdAt` is empty (the device reader tolerates that) takes the column default. The tests insert goals made by the device's own `goalsForBothArms` and a device-shaped measurement, read them back in the device's shape, and compare them whole.

## 7. The seed and its drift guard

`emit-seed.ts` reads `specializationRegions` (production regions only) and `exposureRuleV1`, checks every reference resolves (claims → nodes and sources, node actions → a function claim of that node, mappings → variant, node, action and sources, parents without cycles, shared keys without conflicts), and writes SQL:

- **Upserts keyed by the content's own keys**, `on conflict ... do update ... where (row) is distinct from (new row)`: applying it again touches no row (tested by comparing every row's `xmin` and `ctid` before and after).
- **Lookups by key with LEFT JOINs** for rows that point at other rows (claim sources, node actions, mappings, mapping sources): a key the database lacks becomes a NULL in a NOT NULL column and fails the whole migration rather than dropping a row.
- **Mapping versions** go in as drafts, get their rows and sources, then `update ... set state = 'published' where ... and state = 'draft'`, so the publication rule runs on the real rows. A version already published is left alone; changed content under its key, or under a variant, node action, claim or source it rests on, is refused by the database (§4), and the whole seed rolls back with the database's message, including unrelated changes in it (tested for each kind of row).
- **Sets the content owns end up exactly as the content has them**: a mapping version's mappings and their sources; the claims of the regions in the seed (a claim key carries its region, `forearm:…`), with their sources and the node actions resting on them; and a diagram asset version's views, paths and labels. Rows the content no longer has are deleted before the upserts (a drawing's views after its paths and labels: views are written first, so a path may move to a new view in the same seed, and a view is deleted once nothing is drawn in it), so a removal under a published version is refused like any other change (the seed fails naming the mapping, node action or claim), and a draft version or a draft claim is cleaned. Node actions go first and are matched by node, action and claim, so a draft claim can change kind, or a node action move to another claim, in one seed. Claims whose key names a region not in the seed are left alone.
- **It never deletes the records others point at**: regions, nodes (goals may point at one), actions, sources, catalog exercises and variants. A source or variant the content drops therefore stays in the database; one a published version rests on could not be deleted anyway.
- **Diagrams are optional.** A region without a drawing seeds none and the seed says so in a comment. The forearm drawing (`forearm_schematic` v1, 3 views, 127 paths, 28 labels; `08-diagram.md`) is seeded from `diagram.generated.ts`. Its views go in with their button words and order (`viewOrder`: Palm, Back, Thumb side); paths and labels are written in key order with whatever ids the drawing uses. The generator refuses an id the database would, a view without words, and a `viewOrder` that is not exactly the views drawn. The test reads each drawing back whole (views in order, every layer's paths and labels) and compares it with the content: the forearm's, and the deltoid fixture's front, side and rear, then a redraw that drops the rear view, renames and trims the side view, then one that moves every path to a new view, and back.
- **Regions** carry the page's words and measures (§3); a reference region is written with none.
- **Deterministic**: rows sorted by key (nodes parents first), no dates or counters from the run, region order irrelevant. Dollar-quoted text, with a tag chosen so no text can close it early.
- **Catalog links**: `supabase_exercise_id` is the `public.exercises` row with this catalog id under `source_repository = 'LocalForgeWeb/Sports-genome'` (unique by that table's own constraint), else the single row whose `canonical_name` ends `__catalog_<id>`, else null. In production on 16 Oct this resolved **103 of the then 117** catalog ids (the suffix alone would resolve 87; 16 rows such as `low_cable_row` carry the id without the suffix). The unresolved are the new forearm rows from 401 (401–416 today, 16 rows, with the wrist roller's 415 and 416), which are not in `public.exercises` yet; re-applying the seed links them once they are.
- **Size**: about 730 KB, mostly the 934 mapping-source rows with their locators and limitations, and the key lists the stale-row deletes keep.

What it carries today: 2 regions (`forearm`, reference `upper_arm`), 24 nodes, 20 actions, 38 node actions, 60 claims with 115 claim sources, 71 sources, 119 catalog exercises, 119 variants, `forearm_mappings_v1` published with 418 mappings (413 reviewed, 5 draft) and 934 mapping sources, 1 diagram asset (`forearm_schematic` v1, 3 views), rule `specialization_exposure_v1`.

**S9** (the backend's row-level security guide, brief §13) was removed from the forearm region's sources on 16 Oct: nothing in the region data cited it, it is not anatomy evidence, and its title named the backend vendor in athlete-facing source lists. It remains this document's implementation reference: https://supabase.com/docs/guides/database/postgres/row-level-security.

**Drift guard.** `server/specializationSeed.test.ts` runs the generator in memory and fails, naming the first differing line, unless the committed seed is byte for byte its output. Any content change (a node, a claim, a mapping, the rule, the drawing) therefore needs `npx tsx scripts/specialization/emit-seed.ts` and a commit of the regenerated file.

## 8. Tests and how faithful PGlite is

PGlite 0.4.6 runs Postgres **17.5** in WASM (production is 17.6); 0.5.x moved to Postgres 18, so the version is pinned. The harness creates `anon`, `authenticated` (no RLS bypass) and `service_role` (BYPASSRLS) as in production, `auth.users`, `auth.uid()` with production's definition, the `extensions` schema with btree_gist from PGlite's contrib build, and stubs of `public.muscles` and `public.exercises` with production's unique keys. Identity switches the way PostgREST does it: the JWT subject in `request.jwt.claim.sub`, then `SET ROLE`.

Differences that matter for reading the results:
- The bootstrap user is a superuser; production's `postgres` is not. It only applies migrations here (and is shown to be bound by the immutability triggers like everyone else).
- PGlite is a single connection, so the concurrency guards (the advisory lock on parent changes, `FOR SHARE` on versions, the exclusion constraint's behaviour under parallel inserts) are reasoned about here, not tested. The exclusion constraint itself is tested.

Covered: schema applied twice; RLS on every table; no ledger; the three indexes; no `SECURITY DEFINER` and a pinned `search_path` on every function; exact table grants per role, the service role's included; no function executable by PUBLIC, `anon` or `authenticated` (a `pg_proc` walk with `aclexplode`, shown to catch a function added without its own revoke); CHECK vocabularies equal to `types.ts`, and diagram view and layer ids accepted by shape (front, side, rear) and refused when malformed; a path or label in a view its drawing does not declare refused, a declared view still drawn in not deletable, and views gone with their asset; a region with a page refused without its words, a blank word or an unknown or null measure refused, a reference region needing none; anon refused at the schema; a signed-in user sees only reviewed or published rows (with hidden draft rows, a fixture region and an unpublished version and rule present beside them) and cannot write or truncate any reference table or run the publication check; user A writes, reads, changes and deletes own goals and measurements, user B can do none of that to A's rows nor write in A's name, A cannot hand a row to B; a signed-in role without a user id writes nothing; the service role does everything; parent cycles (direct and through three nodes); node actions on another node's or a non-function claim; published-version immutability for rows, sources and the version (as service role and as owner); what a published version rests on frozen with it, case by case, as service role and as owner (variants, node actions, a mapped muscle's review, reviewed claims and their sources, cited sources through a mapping and through a claim), with no-op updates, editable fields and unused rows left free, and a variant freezing when the first version using it is published; TRUNCATE refused to the service role on every table and to the owner on every frozen table, with and without CASCADE, while a database of drafts can still be cleared; each publication rule on its own, and a valid version with draft rows publishing and then retiring; rule immutability; goal overlap (refused and allowed cases), time zone, dates, one target, target bounds; measurement value and every protocol rule; rollback with the header's SQL and a clean re-apply of schema and seed; both files applied as one DO block each giving the same database as applying them directly (catalog, grants, policies, triggers, functions and every row compared, uuids by their keys), and a changed seed refused the same way through it. The seed tests add the drift guard, determinism, quoting, idempotence by row versions, the content read back whole (nodes, actions, sources, node actions, claims with sources, variants, every mapping with its sources in order, the version, the rule, the regions with their page words and measures, the forearm drawing with its views), catalog linking, refusal of edits under a published key, refusal of rewrites (variant, source, claim, node action, a muscle's review) and removals (mapping, mapping source, node action, claim, claim source) under the published version with nothing of that seed applied, a v2 beside v1, the deltoid fixture as a second region with its words, its one measure, its draft version and its drawing from the front, side and rear read back whole, redrawn twice and restored, that draft cleaned of removed mappings, mapping sources, node actions, claims and claim sources, a draft claim changing kind and a node action moving to another claim in one seed, and a drawing with its own view and layer ids; the generator refusing a view order that is not the views drawn, a view without words, a region without its words and a measure listed twice.

## 9. Applying it, and what is still owner-gated

Nothing has been applied to production. When the owner approves (`deployment.md`, "Rollout order"):

1. Regenerate the seed after the last content lane has merged (the diagram especially): `npx tsx scripts/specialization/emit-seed.ts`, run the two test files, commit.
2. Apply `20261016120000_specialization_atlas_schema.sql`, then the seed, with the Supabase MCP `apply_migration` (names `specialization_atlas_schema`, `specialization_atlas_seed_v1`) or the SQL editor. Where a file has to go through one SQL call, wrap its text in a DO block: `do $outer$ declare body text := $body$<file>$body$; begin execute body; end $outer$;` (neither tag occurs in either file; `asDoBlock` in `server/fixtures/specializationPg.ts` picks free ones). Neither file holds transaction control or anything a function cannot run, and the schema test shows the DO block gives the same database as applying the file directly, and the same refusal for a changed seed. Both are additive: a new schema and new objects, nothing existing changes. The one lock on existing tables: creating the foreign keys to `public.muscles` and `public.exercises` takes a SHARE ROW EXCLUSIVE lock on each, which blocks writes to them (not reads) until the schema migration commits, a fraction of a second (about 0.2 s in PGlite).
3. Read `select version, name from supabase_migrations.schema_migrations order by version desc limit 5` and rename both files to the versions Supabase recorded (the drift guard's path in `server/fixtures/specializationPg.ts` and in `emit-seed.ts` changes with the seed's name).
4. Verify read-only: the counts in §7; `select state, published_at from specialization.mapping_versions`; `select count(*) from specialization.catalog_exercises where supabase_exercise_id is not null` (103 expected); `select relname, relrowsecurity from pg_class where relnamespace = 'specialization'::regnamespace and relkind = 'r'`; the grants query in `server/specializationSchema.test.ts`; that `specialization` is absent from the Data API's exposed schemas; the security and performance advisors.

Owner-gated or open:
- **Production apply** (above), and keeping the schema off the Data API.
- **After the first production apply, the seed file is history.** A later content change must go into a new seed migration (e.g. `…_specialization_atlas_seed_v2.sql`, with the generator's output path and the drift guard moved to it), and changed mappings need a new version key: re-emitting into the applied file would make the repository disagree with what production ran.
- **Human review** of the 60 claims by a clinician or anatomist before the content is treated as reviewed (`03-anatomy-evidence.md` §8), and review of the 5 draft mappings, which then ship as `forearm_mappings_v2`. Best done before the first production apply: afterwards a reviewed claim a published version rests on cannot be edited or withdrawn (§4), so a correction is a new claim under a new key, and the old one stays readable, and stays in the content (the seed refuses dropping it), unless the owner decides how the page should treat it.
- **Catalog rows 401–416** are not in `public.exercises`; until they are, their `supabase_exercise_id` is null.
- **Retiring a version** is a hand-written `update ... set state = 'retired'` when a successor is live; the seed only publishes.
- **Nothing syncs goals or measurements** yet; the tables are ready for it.
