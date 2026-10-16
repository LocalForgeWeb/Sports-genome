# Specialization atlas: the database (16 Oct 2026)

The Postgres side of the atlas, as built. The design is `02-design.md` §9; why the app counts on the device is `01-reconciliation.md`. Nothing here has been applied to production: §9 says what the owner still has to do.

| File | What it is |
|---|---|
| `supabase/migrations/20261016120000_specialization_atlas_schema.sql` | Schema `specialization`: tables, rules as triggers, RLS, grants. Hand-written. Rollback in its header. |
| `supabase/migrations/20261016120100_specialization_atlas_seed_v1.sql` | The reference content as upserts. **Generated**; never edit it by hand. |
| `scripts/specialization/emit-seed.ts` | The generator: `npx tsx scripts/specialization/emit-seed.ts` writes the seed, `--check` exits 1 when it is stale. |
| `server/fixtures/specializationPg.ts` | A Supabase-shaped Postgres 17 in WASM (PGlite) for the tests. |
| `server/specializationSchema.test.ts` | Structure, grants, RLS as anon / user A / user B / service role, every constraint and trigger, rollback. |
| `server/specializationSeed.test.ts` | Drift guard, idempotence, the content read back field by field, versioning, a second region and a diagram. |

## 1. Why a schema of its own, and who reaches it

`public` has open default privileges in this project (every new table there is granted to `anon` and `authenticated`), so the atlas lives in `specialization`, which has none (checked read-only on 16 Oct: no global default ACLs exist). The schema is **not** in the Data API's exposed schemas, so PostgREST cannot serve it, and `pg_graphql` is not installed in the project. Inside the database everything is revoked from `PUBLIC`, `anon` and `authenticated` and then granted narrowly (§5), so the grants are correct even if the schema is exposed one day.

Today nothing reads or writes it: the page reads the TypeScript content in its bundle and keeps goals and measurements on the device. The database copy exists so that a server-side summary, a later sync of goals and measurements, and the owner's own queries all read the same reviewed content the app counts with.

## 2. No exposure ledger

The brief's `exposure_ledger` is not created. Workouts, sets and drop-set stages live in `localStorage`; Supabase has no session, set, bout or segment table, so a ledger row's `source_bout_key` would point at nothing: the "dangling key" the brief forbids. Exposure is calculated on demand on the device from the records Home, Plan, Review and Progress already read (`06-calculation.md`). When bouts reach a server table, a ledger can be added with real composite keys to it.

## 3. Tables and keys

| Table | Key | Notes |
|---|---|---|
| `regions` | `id` (`forearm`) | `status`: `production`, `fixture`, or `reference` (a region that only holds another region's external contributors: `upper_arm`, for the biceps and brachialis; it has no page). `body_map_keys`, `entry_label`, and `node_for_body_map_key` (jsonb object: a body-map key that opens the page on one muscle, `{"brachioradialis": "forearm.br"}`). |
| `nodes` | `id` (`forearm.fcu`) | `region_id` → regions; `parent_id` → nodes; `database_muscle` → `public.muscles(canonical_name)` (a real key: all five values exist there); `catalog_muscle_key` stays text because the client catalog is code, not a table. `role`, `border`, `location`, `what_it_does`, `shape_note`, `caveats`, `sort_order` (content order). |
| `actions` | `id` (`wrist.flexion`) | |
| `sources` | `id` uuid; `source_key` unique (`S2`, `A14`, `M3`) | Keys are shared across regions: two regions may name one only with identical content (the generator refuses otherwise). |
| `claims` | `id` uuid; `claim_key` unique: `<region>:<claim id>` (`forearm:fcu.function`) | Claim ids are only unique inside one region's data (the deltoid fixture would also have an `anterior`), hence the prefix. Unique `(id, node_id, kind)`. `reviewed_on` is a date, as in the content. |
| `claim_sources` | `(claim_id, source_id)` | `locator`, `qualification`, `sort_order`. |
| `node_actions` | `(node_id, action_id)` | Foreign key `(claim_id, node_id, claim_kind)` → `claims(id, node_id, kind)` with `claim_kind` a stored constant `'function'`: the claim must be a **function** claim of the **same** node. The brief asked for `(claim_id, node_id)`; this is that plus the kind. |
| `diagram_assets` | `id` uuid; unique `(asset_key, version)` | View box, licence note. |
| `diagram_paths` | `(asset_id, path_id)` | `view` (palm, back, thumb), `layer` (surface, intermediate, deep), `kind`, `node_id` (nullable; a belly must have one), `d`, `sort_order` (draw order). |
| `diagram_labels` | `(asset_id, view, layer, sort_order)` | "Thumb side", "Pinky side": text, x, y, anchor. |
| `catalog_exercises` | `catalog_id` (the app catalog's id) | `name`; `supabase_exercise_id` → `public.exercises(id)`, null where the exercise is not there (§7). |
| `exercise_variants` | `variant_key` (`cat-139`) | Every execution dimension of `ExerciseVariant`, each with its vocabulary; `elbow_angle_deg` only where the exercise defines it. |
| `mapping_versions` | `id` uuid; `version_key` unique | `region_id`, `state` (draft, published, retired), `published_at` (set exactly when not draft), `method_notes`. |
| `variant_mappings` | `id` uuid; unique `(version_id, mapping_key)` and unique nulls-not-distinct `(version_id, variant_key, node_id, action_id)` | `relationship`, `muscle_mode`, `evidence_basis`, `allocation`, `requires_no_straps`, `rationale`, `review_status`. |
| `mapping_sources` | `(mapping_id, source_id)` | `locator`, `limitation`, `sort_order`. |
| `rule_versions` | `id` (`specialization_exposure_v1`) | `specification` jsonb object, `published_at`, `notes`. |
| `goals` | `(user_id, id)` | §6. |
| `measurements` | `(user_id, id)` | §6. |

Every enumerated column has a CHECK vocabulary equal to the union in `shared/specialization/types.ts`; a test parses both and fails if they drift. Indexes: the brief's `goals_user_dates`, `measurements_user_date`, `mapping_variant_version`, plus the foreign keys that are looked up or cascaded. Small reference foreign keys (a region on an asset or a version, an action on a mapping) are left unindexed on purpose; the project's advisors may list them as information.

## 4. Rules the database enforces

**Anatomy.**
- A node cannot become its own ancestor: a trigger walks up from the new parent (not only the self-parent CHECK). Parent changes take a transaction-scoped advisory lock, so two concurrent changes cannot each pass and together close a loop.
- A node action rests on a function claim of its own node (the composite foreign key above); turning that claim into another kind is refused too.

**Mapping versions: draft → published → retired.**
- A version is inserted as a draft, filled, then published by `update ... set state = 'published'`. Inserting one already published is refused.
- A draft may change freely and may be deleted. A draft cannot be retired (delete it).
- Once published, the version row, its mappings and their sources are immutable, for every role, the owner included. Its state may only move to `retired`. Published and retired versions cannot be deleted. Changing mappings means a new version key; the app chooses its version explicitly and never adds versions together.
- Row inserts are checked after the write, so an upsert that changes nothing (the seed applied again) never trips the guard; updates and deletes are checked before. The guards lock the version row `FOR SHARE`, so a publish running at the same moment as an insert waits for it, and its check then sees the row.

**The publication rule** (`specialization.mapping_version_problems(version_id)`, callable by the service role to check a draft first; the trigger runs it on publish). A version is published only when:
1. it has at least one mapping;
2. no mapping is `rejected` (rejected rows are removed before publishing; they are not history);
3. every mapping, reviewed **or draft**, has at least one source;
4. every reviewed mapping has a source with a locator (where in the source);
5. every mapped muscle has a reviewed function claim;
6. every muscle a reviewed mapping credits is itself reviewed;
7. every mapping that names a joint action names one its muscle performs (a `node_actions` row, so it rests on that muscle's function claim).

**Draft rows in a published version are allowed.** `forearm_mappings_v1` is published with 399 reviewed rows and 5 drafts (`cat-144`, `cat-145`, `cat-299`, `cat-409` → FPL; `cat-317` → brachioradialis). A draft row keeps its source and its pending-review label; RLS never shows it to a signed-in user, and the calculator never counts it (it appears as "pending review"). Reviewing one of them later means publishing `forearm_mappings_v2`, because v1 is frozen with them as drafts. Rule 7 is the content lane's own test made strict: that test only checks the action when the muscle has node actions at all; here an action must always be one of the muscle's node actions (all 404 forearm rows pass).

Not enforced at publication: a diagram link per mapped muscle. The diagram is optional (null until drawn) and the page has a list alternative, so a missing drawing must not block counting.

**Rule versions.** A rule version is published when `published_at` is set; from then on it can neither change nor be deleted.

**Goals.** Exactly one of muscle or movement; `ends_on >= starts_on`; `target > 0` and `<= 10000` (the device's `GOAL_TARGET_SANITY_MAX`, a typo guard; it also refuses NaN and infinity); the time zone must be in `pg_timezone_names` (trigger, on insert and on a zone change); and the exclusion constraint `goals_no_overlap` (btree_gist) refuses two goals for the same user, region, muscle-or-movement, side, metric and period whose date ranges share a day (`daterange(starts_on, ends_on, '[]')`, an open end runs forever; the muscle and movement ids are prefixed so they can never compare equal). An exclusion constraint holds under concurrent inserts, which a check before the write does not.

**Measurements.** `value > 0` and finite; `protocol` must be the device's `MeasurementProtocol` object: a non-empty `landmark`, `distanceFromLandmarkCm` null or ≥ 0, `posture` and `condition` from the app's lists, `device` null or text, `timeOfDay` null or `HH:MM`, and no other keys.

## 5. Access

| | anon | authenticated (a signed-in user) | service_role |
|---|---|---|---|
| Schema usage | no | yes | yes |
| `regions` | — | select: production and reference regions | all |
| `nodes` | — | select: `status = 'reviewed'` | all |
| `claims` | — | select: reviewed claims of reviewed nodes | all |
| `claim_sources`, `node_actions` | — | select: rows of reviewed claims of reviewed nodes | all |
| `actions`, `sources`, `diagram_*`, `catalog_exercises`, `exercise_variants` | — | select: all | all |
| `mapping_versions` | — | select: `state = 'published'` | all |
| `variant_mappings` | — | select: reviewed rows of published versions, on reviewed nodes | all |
| `mapping_sources` | — | select: sources of those rows | all |
| `rule_versions` | — | select: published | all |
| `goals`, `measurements` | — | select, insert, update, delete: own rows only; update has USING and WITH CHECK | all (bypasses RLS) |
| `mapping_version_problems()` | — | — | execute |

- RLS is on for every table. Owner policies use `(select auth.uid()) = user_id`, evaluated once per statement.
- No reference table grants insert, update or delete to `authenticated`.
- No `SECURITY DEFINER` function exists; every function pins `search_path = ''`.
- Trigger functions need no execute grant: Postgres checks that when the trigger is created, not when it fires.
- `alter default privileges in schema specialization` removes the built-in execute-for-everyone on future functions.

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
- **Mapping versions** go in as drafts, get their rows and sources, then `update ... set state = 'published' where ... and state = 'draft'`, so the publication rule runs on the real rows. A version already published is left alone; changed content under its key is refused by the immutability trigger (tested: the whole seed then rolls back, including unrelated changes in it).
- **It never deletes reference rows** (goals may point at a node). The exception is a diagram asset version, which ends up holding exactly its drawing: stale paths and labels are deleted, the rest upserted.
- **Diagrams are optional.** The forearm diagram is `null` today (another lane is drawing it), so the seed says so in a comment. The test seeds the deltoid fixture's diagram to prove the path works, including a redraw that removes a path and changes a label.
- **Deterministic**: rows sorted by key (nodes parents first), no dates or counters from the run, region order irrelevant. Dollar-quoted text, with a tag chosen so no text can close it early.
- **Catalog links**: `supabase_exercise_id` is the `public.exercises` row with this catalog id under `source_repository = 'LocalForgeWeb/Sports-genome'` (unique by that table's own constraint), else the single row whose `canonical_name` ends `__catalog_<id>`, else null. In production on 16 Oct this resolves **103 of the 117** catalog ids (the suffix alone would resolve 87; 16 rows such as `low_cable_row` carry the id without the suffix). The 14 unresolved are the new forearm rows 401–414, which are not in `public.exercises` yet; re-applying the seed links them once they are.
- **Size**: about 535 KB, mostly the 916 mapping-source rows with their locators and limitations.

What it carries today: 2 regions (`forearm`, reference `upper_arm`), 24 nodes, 20 actions, 38 node actions, 60 claims with 115 claim sources, 71 sources, 117 catalog exercises, 117 variants, `forearm_mappings_v1` published with 404 mappings (399 reviewed, 5 draft) and 916 mapping sources, 0 diagram assets, rule `specialization_exposure_v1`.

**S9** (the backend's row-level security guide, brief §13) was removed from the forearm region's sources on 16 Oct: nothing in the region data cited it, it is not anatomy evidence, and its title named the backend vendor in athlete-facing source lists. It remains this document's implementation reference: https://supabase.com/docs/guides/database/postgres/row-level-security.

**Drift guard.** `server/specializationSeed.test.ts` runs the generator in memory and fails, naming the first differing line, unless the committed seed is byte for byte its output. Any content change (a node, a claim, a mapping, the rule, the drawing) therefore needs `npx tsx scripts/specialization/emit-seed.ts` and a commit of the regenerated file.

## 8. Tests and how faithful PGlite is

PGlite 0.4.6 runs Postgres **17.5** in WASM (production is 17.6); 0.5.x moved to Postgres 18, so the version is pinned. The harness creates `anon`, `authenticated` (no RLS bypass) and `service_role` (BYPASSRLS) as in production, `auth.users`, `auth.uid()` with production's definition, the `extensions` schema with btree_gist from PGlite's contrib build, and stubs of `public.muscles` and `public.exercises` with production's unique keys. Identity switches the way PostgREST does it: the JWT subject in `request.jwt.claim.sub`, then `SET ROLE`.

Differences that matter for reading the results:
- The bootstrap user is a superuser; production's `postgres` is not. It only applies migrations here (and is shown to be bound by the immutability triggers like everyone else).
- PGlite is a single connection, so the concurrency guards (the advisory lock on parent changes, `FOR SHARE` on versions, the exclusion constraint's behaviour under parallel inserts) are reasoned about here, not tested. The exclusion constraint itself is tested.

Covered: schema applied twice; RLS on every table; no ledger; the three indexes; no `SECURITY DEFINER` and a pinned `search_path` on every function; exact grants per role; CHECK vocabularies equal to `types.ts`; anon refused at the schema; a signed-in user sees only reviewed or published rows (with hidden draft rows, a fixture region and an unpublished version and rule present beside them) and cannot write or truncate any reference table or run the publication check; user A writes, reads, changes and deletes own goals and measurements, user B can do none of that to A's rows nor write in A's name, A cannot hand a row to B; a signed-in role without a user id writes nothing; the service role does everything; parent cycles (direct and through three nodes); node actions on another node's or a non-function claim; published-version immutability for rows, sources and the version (as service role and as owner); each publication rule on its own, and a valid version with draft rows publishing and then retiring; rule immutability; goal overlap (refused and allowed cases), time zone, dates, one target, target bounds; measurement value and every protocol rule; rollback with the header's SQL and a clean re-apply of schema and seed. The seed tests add the drift guard, determinism, quoting, idempotence by row versions, the content read back whole (nodes, actions, sources, node actions, claims with sources, variants, all 404 mappings with sources in order, the version, the rule, the regions), catalog linking, refusal of edits under a published key, a v2 beside v1, and the deltoid fixture as a second region with its draft version and diagram.

## 9. Applying it, and what is still owner-gated

Nothing has been applied to production. When the owner approves (`deployment.md`, "Rollout order"):

1. Regenerate the seed after the last content lane has merged (the diagram especially): `npx tsx scripts/specialization/emit-seed.ts`, run the two test files, commit.
2. Apply `20261016120000_specialization_atlas_schema.sql`, then the seed, with the Supabase MCP `apply_migration` (names `specialization_atlas_schema`, `specialization_atlas_seed_v1`) or the SQL editor. Both are additive: a new schema and new objects, nothing existing changes. The one lock on existing tables: creating the foreign keys to `public.muscles` and `public.exercises` takes a SHARE ROW EXCLUSIVE lock on each, which blocks writes to them (not reads) until the schema migration commits, a fraction of a second (about 0.2 s in PGlite).
3. Read `select version, name from supabase_migrations.schema_migrations order by version desc limit 5` and rename both files to the versions Supabase recorded (the drift guard's path in `server/fixtures/specializationPg.ts` and in `emit-seed.ts` changes with the seed's name).
4. Verify read-only: the counts in §7; `select state, published_at from specialization.mapping_versions`; `select count(*) from specialization.catalog_exercises where supabase_exercise_id is not null` (103 expected); `select relname, relrowsecurity from pg_class where relnamespace = 'specialization'::regnamespace and relkind = 'r'`; the grants query in `server/specializationSchema.test.ts`; that `specialization` is absent from the Data API's exposed schemas; the security and performance advisors.

Owner-gated or open:
- **Production apply** (above), and keeping the schema off the Data API.
- **After the first production apply, the seed file is history.** A later content change must go into a new seed migration (e.g. `…_specialization_atlas_seed_v2.sql`, with the generator's output path and the drift guard moved to it), and changed mappings need a new version key: re-emitting into the applied file would make the repository disagree with what production ran.
- **Human review** of the 60 claims by a clinician or anatomist before the content is treated as reviewed (`03-anatomy-evidence.md` §8), and review of the 5 draft mappings, which then ship as `forearm_mappings_v2`.
- **Catalog rows 401–414** are not in `public.exercises`; until they are, their `supabase_exercise_id` is null.
- **Retiring a version** is a hand-written `update ... set state = 'retired'` when a successor is live; the seed only publishes.
- **Nothing syncs goals or measurements** yet; the tables are ready for it.
