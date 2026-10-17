-- Specialization atlas, forearms first: schema `specialization`
-- (docs/specialization-atlas/04-database.md; design 02-design.md §9; owner's brief §8).
--
-- What it holds:
--   * Reference content, seeded from the TypeScript in shared/specialization by the
--     generated migration that follows this one (…_specialization_atlas_seed_v1.sql):
--     regions, anatomy nodes, joint actions, sources, claims and their sources, node
--     actions, diagram geometry, catalog exercises and their variants, versioned
--     variant → muscle mappings with their sources, and the published accounting rule.
--   * Goals and measurements, owner-only, shaped like the device records in
--     shared/specialization/types.ts (SpecializationGoal, SpecializationMeasurement) so a
--     later sync is a straight copy. Nothing writes them yet: today they live on the device.
--
-- No exposure ledger. Workouts, sets and drop-set stages live on the device
-- (localStorage); no server table holds a bout or a segment, so a ledger row would carry a
-- `source_bout_key` with nothing to reference: the dangling key the brief forbids.
-- Exposure is calculated on demand on the device from the same records the rest of the
-- app reads (01-reconciliation.md). A ledger can be added when bouts reach the server.
--
-- Access. The schema is not added to the Data API's exposed schemas, and default
-- privileges are not relied on: everything is revoked from public, anon, authenticated and
-- service_role, then granted narrowly. RLS is on for every table.
--   * anon: nothing, not even usage on the schema.
--   * authenticated: select on reference tables, where policies show only reviewed or
--     published rows (reviewed nodes and claims, published mapping versions and their
--     reviewed mappings, published rule versions); no write grant on any of them.
--     Select, insert, update and delete on goals and measurements, own rows only
--     (`(select auth.uid()) = user_id`; update has both USING and WITH CHECK).
--   * service_role: select, insert, update and delete on every table (it bypasses RLS);
--     no TRUNCATE, TRIGGER or REFERENCES. Execute on mapping_version_problems only.
--   * No SECURITY DEFINER function exists. Postgres gives PUBLIC execute on every new
--     function, and per-schema default privileges cannot take that away, so a migration
--     that adds a function must revoke it itself (section 9); a test walks pg_proc.
--
-- Integrity, beyond foreign keys and CHECK vocabularies that match types.ts:
--   * a node cannot become its own ancestor (trigger, not only the self-parent check);
--   * a node action rests on a FUNCTION claim of the SAME node (composite foreign key);
--   * mapping versions are created as drafts, published once, then immutable, rows and
--     sources alike; publishing is refused while the version breaks the publication rule
--     (specialization.mapping_version_problems, documented on the function);
--   * what a published or retired mapping version rests on is frozen with it: its
--     variants, the node actions its mappings name, the reviewed claims of the muscles it
--     maps (key, node, kind, statement, basis, review) and their sources, those muscles'
--     reviewed status, region, role and catalog muscle key, and the sources it cites (key,
--     url, title, evidence type). Changed content needs new keys and a new version;
--   * a published rule version is immutable;
--   * TRUNCATE, which fires no row trigger, is refused on the tables holding any of that
--     while a published or retired version (or a published rule) exists;
--   * goals: exactly one of muscle or movement, ends_on >= starts_on, an IANA time zone
--     (trigger against pg_timezone_names), and no two overlapping goals for the same
--     user, region, target, side, metric and period (exclusion constraint, btree_gist),
--     which holds under concurrent writes, unlike a check made before the write.
--
-- Idempotent: it can be applied twice (if not exists, create or replace, drop policy if
-- exists). No transaction control and nothing that cannot run inside a function, so the
-- file's text can also be run by EXECUTE inside one DO block (one call); a test checks
-- that this gives the same database as applying the file directly. Tested in PGlite
-- (Postgres 17 in WASM) under anon, two users and the service role:
-- server/specializationSchema.test.ts.
--
-- Rollback (drops the reference content and any goals or measurements with it):
--   drop schema if exists specialization cascade;
-- btree_gist is left installed; drop it only if nothing else uses it:
--   drop extension if exists btree_gist;

create extension if not exists btree_gist with schema extensions;

create schema if not exists specialization;

comment on schema specialization is
  'Specialization atlas: reference content seeded from shared/specialization (read-only to users, reviewed or published rows only) and owner-only goals and measurements. Not exposed through the Data API. See docs/specialization-atlas/04-database.md.';

-- ---------------------------------------------------------------------------
-- 1. Regions, anatomy, actions, sources, claims
-- ---------------------------------------------------------------------------

-- `reference` regions are named only because another region's nodes point into them
-- (the upper arm, for the biceps and brachialis a curl also loads); they have no page.
-- A region with a page also carries the page's words for it (RegionWording in types.ts) and
-- the measures its Progress offers, so a second region needs rows, not code or a new column.
create table if not exists specialization.regions (
  id text primary key check (id ~ '^[a-z][a-z0-9_]*$'),
  label text not null check (btrim(label) <> ''),
  heading text,
  sort_order integer not null default 0,
  status text not null check (status in ('production', 'fixture', 'reference')),
  body_map_keys text[] not null default '{}',
  entry_label text,
  -- A body-map key that names exactly one of the region's muscles: {"brachioradialis": "forearm.br"}.
  node_for_body_map_key jsonb not null default '{}'::jsonb check (jsonb_typeof(node_for_body_map_key) = 'object'),
  -- The list heading over another region's muscles credited here: 'Upper-arm muscles credited here'.
  external_group text check (btrim(external_group) <> ''),
  -- The kind of incidental work on the muscle bars and their key: 'grip' ('Incidental grip', '3 grip').
  incidental_work text check (btrim(incidental_work) <> ''),
  -- The line under Progress: 'Circumference and grip, by arm'.
  progress_subtitle text check (btrim(progress_subtitle) <> ''),
  -- The measures Progress offers, in order, from the measurements table's own list.
  measurement_metrics text[] not null default '{}' check (measurement_metrics <@ array['circumference_cm', 'grip_force_n']::text[]),
  constraint regions_page_copy check (
    status = 'reference'
    or (heading is not null and entry_label is not null and external_group is not null and incidental_work is not null and progress_subtitle is not null)
  )
);

create table if not exists specialization.actions (
  id text primary key check (id ~ '^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$'),
  joint text not null,
  label text not null,
  plain_description text not null,
  sort_order integer not null default 0
);

-- catalog_muscle_key is the client exercise catalog's muscle key ("forearms"); the catalog
-- is code, not a table, so it stays text. database_muscle is a real key into public.muscles.
create table if not exists specialization.nodes (
  id text primary key check (id ~ '^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$'),
  region_id text not null references specialization.regions (id),
  parent_id text references specialization.nodes (id),
  kind text not null check (kind in ('group', 'muscle', 'head', 'compartment')),
  role text not null check (role in ('target', 'adjacent', 'external', 'group')),
  name text not null check (btrim(name) <> ''),
  short_name text not null,
  aliases text[] not null default '{}',
  layer text not null check (layer in ('surface', 'intermediate', 'deep', 'mixed')),
  surface_visibility text not null check (surface_visibility in ('clear', 'partial', 'not_distinct', 'variable')),
  status text not null default 'draft' check (status in ('draft', 'reviewed', 'rejected')),
  catalog_muscle_key text,
  database_muscle text references public.muscles (canonical_name) on update cascade on delete set null,
  border text check (border in ('radial', 'ulnar', 'central', 'both')),
  location text not null,
  what_it_does text not null,
  shape_note text not null,
  caveats text[] not null default '{}',
  sort_order integer not null default 0,
  constraint nodes_not_own_parent check (parent_id is null or parent_id <> id)
);

create table if not exists specialization.sources (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique check (source_key ~ '^[A-Za-z][A-Za-z0-9_.-]*$'),
  url text not null check (url ~ '^https?://'),
  title text not null check (btrim(title) <> ''),
  doi text,
  evidence_type text not null
    check (evidence_type in ('anatomy', 'biomechanics', 'emg', 'longitudinal', 'systematic_review', 'product_assumption')),
  retrieved_on date not null,
  notes text
);

-- (id, node_id, kind) is unique so node_actions can require a function claim of its own
-- node with one foreign key; the brief's unique (id, node_id) is implied by it.
create table if not exists specialization.claims (
  id uuid primary key default gen_random_uuid(),
  claim_key text not null unique,
  node_id text not null references specialization.nodes (id),
  kind text not null check (kind in ('function', 'appearance', 'selectivity', 'variation')),
  statement text not null check (btrim(statement) <> ''),
  basis text not null
    check (basis in ('established_anatomy', 'experimental', 'anatomical_inference', 'product_assumption', 'unknown')),
  review_status text not null default 'draft' check (review_status in ('draft', 'reviewed', 'rejected')),
  reviewed_on date,
  review_note text,
  constraint claims_id_node_kind_key unique (id, node_id, kind),
  constraint claims_reviewed_has_date check (review_status <> 'reviewed' or reviewed_on is not null)
);

create table if not exists specialization.claim_sources (
  claim_id uuid not null references specialization.claims (id) on delete cascade,
  source_id uuid not null references specialization.sources (id),
  locator text,
  qualification text,
  sort_order integer not null default 0,
  primary key (claim_id, source_id)
);

create table if not exists specialization.node_actions (
  node_id text not null references specialization.nodes (id),
  action_id text not null references specialization.actions (id),
  role text not null check (role in ('prime', 'assist')),
  claim_id uuid not null,
  -- Constant, so the foreign key below accepts only a function claim.
  claim_kind text not null generated always as ('function'::text) stored,
  primary key (node_id, action_id),
  constraint node_actions_function_claim_of_same_node
    foreign key (claim_id, node_id, claim_kind) references specialization.claims (id, node_id, kind)
);

-- ---------------------------------------------------------------------------
-- 2. Diagram geometry (DiagramAsset in types.ts; drawn for the right arm)
-- ---------------------------------------------------------------------------

create table if not exists specialization.diagram_assets (
  id uuid primary key default gen_random_uuid(),
  region_id text not null references specialization.regions (id),
  asset_key text not null,
  version integer not null check (version > 0),
  view_box_width numeric not null check (view_box_width > 0),
  view_box_height numeric not null check (view_box_height > 0),
  license_note text not null check (btrim(license_note) <> ''),
  unique (asset_key, version)
);

-- A drawing's views (DiagramAsset.viewOrder): its own ids, in the order the page offers them,
-- with the words on their buttons (the forearm: Palm, Back, Thumb side; another region's might
-- be Front, Side, Rear). The CHECK fixes an id's shape, not a list, so a region drawn from other
-- sides is a data addition, not a schema change. Paths and labels name a view of their own
-- asset by foreign key, so nothing is drawn in a view the drawing does not declare.
create table if not exists specialization.diagram_views (
  asset_id uuid not null references specialization.diagram_assets (id) on delete cascade,
  view text not null check (view ~ '^[a-z][a-z0-9_]*$'),
  label text not null check (btrim(label) <> ''),
  sort_order integer not null,
  primary key (asset_id, view)
);

-- Only belly paths are selectable and painted with exposure, so a belly must name its node;
-- a tendon or ghost may name one for the selection outline, structure names none.
-- Layer ids are the drawing's own too (surface, intermediate, deep), checked for their shape.
create table if not exists specialization.diagram_paths (
  asset_id uuid not null references specialization.diagram_assets (id) on delete cascade,
  path_id text not null,
  view text not null check (view ~ '^[a-z][a-z0-9_]*$'),
  layer text not null check (layer ~ '^[a-z][a-z0-9_]*$'),
  kind text not null check (kind in ('belly', 'tendon', 'outline', 'bone', 'ghost', 'skin')),
  node_id text references specialization.nodes (id),
  d text not null,
  sort_order integer not null,
  primary key (asset_id, path_id),
  constraint diagram_paths_belly_has_node check (kind <> 'belly' or node_id is not null),
  constraint diagram_paths_view_declared foreign key (asset_id, view) references specialization.diagram_views (asset_id, view)
);

create table if not exists specialization.diagram_labels (
  asset_id uuid not null references specialization.diagram_assets (id) on delete cascade,
  view text not null check (view ~ '^[a-z][a-z0-9_]*$'),
  layer text not null check (layer ~ '^[a-z][a-z0-9_]*$'),
  sort_order integer not null,
  label_text text not null,
  x numeric not null,
  y numeric not null,
  anchor text not null check (anchor in ('start', 'middle', 'end')),
  primary key (asset_id, view, layer, sort_order),
  constraint diagram_labels_view_declared foreign key (asset_id, view) references specialization.diagram_views (asset_id, view)
);

-- ---------------------------------------------------------------------------
-- 3. Exercises and variants
-- ---------------------------------------------------------------------------

-- catalog_id is the client catalog's exercise id, the id the device records on every
-- logged exercise. supabase_exercise_id links the same exercise in public.exercises where
-- it exists there (resolved by the seed; catalog rows 401+ are not in public.exercises yet).
create table if not exists specialization.catalog_exercises (
  catalog_id integer primary key check (catalog_id > 0),
  name text not null check (btrim(name) <> ''),
  supabase_exercise_id uuid references public.exercises (id) on delete set null
);

create table if not exists specialization.exercise_variants (
  variant_key text primary key check (variant_key ~ '^[a-z0-9][a-z0-9_.:-]*$'),
  catalog_id integer not null references specialization.catalog_exercises (catalog_id),
  organization text not null check (organization in ('single_joint', 'multi_joint', 'task', 'mixed')),
  forearm_orientation text not null check (forearm_orientation in ('supinated', 'neutral', 'pronated', 'changing', 'unknown')),
  wrist_position text not null check (wrist_position in ('flexed', 'neutral', 'extended', 'changing', 'unknown')),
  grip_type text not null check (grip_type in ('overhand', 'underhand', 'neutral', 'mixed', 'hook', 'pinch', 'crush', 'open_hand', 'fingers_only', 'thumb', 'none', 'unknown')),
  straps text not null check (straps in ('yes', 'no', 'unknown', 'not_applicable')),
  laterality text not null check (laterality in ('bilateral', 'unilateral', 'either')),
  phase text not null check (phase in ('concentric_eccentric', 'eccentric_only', 'concentric_only', 'unspecified')),
  measure text not null check (measure in ('reps', 'seconds')),
  deliberate_hold boolean not null,
  -- Only where the exercise defines it; never a fabricated default.
  elbow_angle_deg numeric check (elbow_angle_deg >= 0 and elbow_angle_deg <= 180),
  notes text
);

-- ---------------------------------------------------------------------------
-- 4. Versioned mappings and the accounting rule
-- ---------------------------------------------------------------------------

create table if not exists specialization.mapping_versions (
  id uuid primary key default gen_random_uuid(),
  version_key text not null unique check (version_key ~ '^[a-z][a-z0-9_]*$'),
  region_id text not null references specialization.regions (id),
  state text not null default 'draft' check (state in ('draft', 'published', 'retired')),
  published_at timestamptz,
  method_notes text not null check (btrim(method_notes) <> ''),
  constraint mapping_versions_published_at check ((state = 'draft') = (published_at is null))
);

-- One row says how ONE muscle takes part in ONE variant for ONE joint action. A draft row
-- may sit in a published version: it is never shown to users and never counted (see the
-- publication rule, which also requires the action to be one the muscle performs).
create table if not exists specialization.variant_mappings (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references specialization.mapping_versions (id) on delete cascade,
  mapping_key text not null,
  variant_key text not null references specialization.exercise_variants (variant_key),
  node_id text not null references specialization.nodes (id),
  action_id text references specialization.actions (id),
  relationship text not null check (relationship in ('direct', 'contributing', 'stabilizer', 'incidental', 'unknown')),
  muscle_mode text not null check (muscle_mode in ('dynamic', 'isometric', 'mixed', 'unknown')),
  evidence_basis text not null check (evidence_basis in ('anatomy', 'biomechanics', 'emg', 'longitudinal', 'inference', 'unknown')),
  -- `shared`: the work is real but cannot be split between the listed muscles (FDS and FDP).
  allocation text not null default 'individual' check (allocation in ('individual', 'shared')),
  -- A grip mapping that a set logged with straps does not earn.
  requires_no_straps boolean not null default false,
  rationale text not null check (btrim(rationale) <> ''),
  review_status text not null default 'draft' check (review_status in ('draft', 'reviewed', 'rejected')),
  constraint variant_mappings_key unique (version_id, mapping_key),
  constraint variant_mappings_one_per_action unique nulls not distinct (version_id, variant_key, node_id, action_id)
);

create table if not exists specialization.mapping_sources (
  mapping_id uuid not null references specialization.variant_mappings (id) on delete cascade,
  source_id uuid not null references specialization.sources (id),
  locator text,
  limitation text,
  sort_order integer not null default 0,
  primary key (mapping_id, source_id)
);

-- A rule version is published when published_at is set; from then on it is immutable.
create table if not exists specialization.rule_versions (
  id text primary key check (id ~ '^[a-z][a-z0-9_]*$'),
  specification jsonb not null check (jsonb_typeof(specification) = 'object'),
  published_at timestamptz,
  notes text not null
);

-- ---------------------------------------------------------------------------
-- 5. Goals and measurements (owner-only)
-- ---------------------------------------------------------------------------

-- The id is the device's own id (`goal-…`, `…:left`), so a sync copies records as they
-- are; it is unique per user, so no user can collide with or block another's ids.
-- target <= 10000 is GOAL_TARGET_SANITY_MAX in shared/specialization/goals.ts: a typo
-- guard, not a recommendation (it also refuses NaN and infinity).
create table if not exists specialization.goals (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null check (char_length(id) between 1 and 200),
  region_id text not null references specialization.regions (id),
  node_id text references specialization.nodes (id),
  action_id text references specialization.actions (id),
  side text not null check (side in ('left', 'right')),
  metric text not null check (metric in ('direct_dynamic_bouts', 'deliberate_hold_bouts', 'deliberate_hold_seconds')),
  target numeric not null check (target > 0 and target <= 10000),
  period text not null check (period in ('calendar_week', 'rolling_7d')),
  starts_on date not null,
  ends_on date,
  timezone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  constraint goals_one_target check (num_nonnulls(node_id, action_id) = 1),
  constraint goals_dates_in_order check (ends_on is null or ends_on >= starts_on),
  -- One active goal per user, region, muscle-or-movement, side, metric and period. The
  -- prefixes keep a muscle id and a movement id from ever comparing equal; an open end
  -- runs forever; both dates are included (daterange '[]').
  constraint goals_no_overlap exclude using gist (
    user_id with =,
    region_id with =,
    (coalesce('node:' || node_id, 'action:' || action_id)) with =,
    side with =,
    metric with =,
    period with =,
    daterange(starts_on, ends_on, '[]') with &&
  )
);

-- protocol is the device's MeasurementProtocol object as it is, checked key by key: a
-- non-empty landmark; distanceFromLandmarkCm null or >= 0; posture and condition from the
-- app's lists; device null or text; timeOfDay null or HH:MM; no other keys.
create table if not exists specialization.measurements (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null check (char_length(id) between 1 and 200),
  region_id text not null references specialization.regions (id),
  side text not null check (side in ('left', 'right')),
  measured_at timestamptz not null,
  metric text not null check (metric in ('circumference_cm', 'grip_force_n')),
  -- 'Infinity' bound: numeric allows NaN and infinity, and NaN sorts above every number.
  value numeric not null check (value > 0 and value < 'Infinity'::numeric),
  protocol jsonb not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  constraint measurements_protocol_shape check (case when jsonb_typeof(protocol) = 'object' then coalesce(
    protocol - array['landmark', 'distanceFromLandmarkCm', 'posture', 'condition', 'device', 'timeOfDay'] = '{}'::jsonb
    and jsonb_typeof(protocol -> 'landmark') = 'string'
    and btrim(protocol ->> 'landmark') <> ''
    and case jsonb_typeof(protocol -> 'distanceFromLandmarkCm')
          when 'number' then (protocol ->> 'distanceFromLandmarkCm')::numeric >= 0
          when 'null' then true
          else protocol -> 'distanceFromLandmarkCm' is null
        end
    and jsonb_typeof(protocol -> 'posture') = 'string'
    and protocol ->> 'posture' in ('arm_relaxed_hanging', 'arm_extended_supported', 'elbow_90_supported', 'other')
    and jsonb_typeof(protocol -> 'condition') = 'string'
    and protocol ->> 'condition' in ('unpumped', 'pumped', 'unknown')
    and coalesce(jsonb_typeof(protocol -> 'device'), 'null') in ('string', 'null')
    and case jsonb_typeof(protocol -> 'timeOfDay')
          when 'string' then protocol ->> 'timeOfDay' ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
          when 'null' then true
          else protocol -> 'timeOfDay' is null
        end,
    false) else false end)
);

-- ---------------------------------------------------------------------------
-- 6. Indexes (the brief's three, plus foreign keys that are looked up or cascaded)
-- ---------------------------------------------------------------------------

create index if not exists goals_user_dates on specialization.goals (user_id, starts_on, ends_on);
create index if not exists measurements_user_date on specialization.measurements (user_id, measured_at);
create index if not exists mapping_variant_version on specialization.variant_mappings (variant_key, version_id);

create index if not exists nodes_parent_idx on specialization.nodes (parent_id) where parent_id is not null;
create index if not exists nodes_region_idx on specialization.nodes (region_id);
create index if not exists claims_node_idx on specialization.claims (node_id);
create index if not exists claim_sources_source_idx on specialization.claim_sources (source_id);
create index if not exists node_actions_action_idx on specialization.node_actions (action_id);
create index if not exists node_actions_claim_idx on specialization.node_actions (claim_id, node_id, claim_kind);
create index if not exists diagram_paths_node_idx on specialization.diagram_paths (node_id) where node_id is not null;
create index if not exists exercise_variants_catalog_idx on specialization.exercise_variants (catalog_id);
create index if not exists catalog_exercises_supabase_idx on specialization.catalog_exercises (supabase_exercise_id) where supabase_exercise_id is not null;
create index if not exists variant_mappings_node_idx on specialization.variant_mappings (node_id);
create index if not exists mapping_sources_source_idx on specialization.mapping_sources (source_id);
create index if not exists goals_node_idx on specialization.goals (node_id) where node_id is not null;
create index if not exists goals_action_idx on specialization.goals (action_id) where action_id is not null;

-- ---------------------------------------------------------------------------
-- 7. Rules as triggers (all SECURITY INVOKER, empty search_path)
-- ---------------------------------------------------------------------------

-- A node may not become its own ancestor. Parent changes take a transaction lock so two
-- concurrent changes cannot each pass the check and together make a loop.
create or replace function specialization.refuse_node_parent_cycle()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  if new.parent_id is null then
    return new;
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('specialization.nodes.parent_id'));
  if exists (
    with recursive up (id, depth) as (
      select new.parent_id, 1
      union all
      select n.parent_id, up.depth + 1
      from specialization.nodes n
      join up on n.id = up.id
      where n.parent_id is not null and up.depth < 1000
    )
    select 1 from up where up.id = new.id
  ) then
    raise exception 'node % cannot have % as its parent: that makes a cycle', new.id, new.parent_id
      using errcode = '23514';
  end if;
  return new;
end
$fn$;

create or replace trigger nodes_refuse_parent_cycle
  before insert or update of parent_id on specialization.nodes
  for each row execute function specialization.refuse_node_parent_cycle();

-- The publication rule, as one list of problems (null when there are none), so it can be
-- read before publishing as well as enforced when publishing:
--   1. the version has at least one mapping;
--   2. no mapping is rejected (remove rejected rows; they are not history);
--   3. every mapping, reviewed or draft, has at least one source;
--   4. every reviewed mapping has a source with a locator (where in the source);
--   5. every mapped muscle has a reviewed function claim;
--   6. every muscle a reviewed mapping credits is itself reviewed;
--   7. every mapping that names a joint action names one its muscle performs (a
--      node_actions row, which rests on that muscle's function claim);
--   8. the function claim behind a reviewed mapping's node action is itself reviewed;
--   9. and it has at least one source.
-- Rules 8 and 9 mean a reviewed mapping never rests on a claim users cannot read or one
-- with no citation; once published, that claim and its sources are frozen with the version
-- (guard_published_claim, guard_published_claim_source: a reviewed claim of a mapped muscle).
-- Draft rows may be published with the version: they keep their source and the
-- pending-review label, users never see them, and no total counts them, so their node
-- action may still rest on a draft claim. Moving one to reviewed means a new version.
create or replace function specialization.mapping_version_problems(p_version_id uuid)
returns text
language sql
stable
set search_path = ''
as $fn$
  with m as (
    select vm.*
    from specialization.variant_mappings vm
    where vm.version_id = p_version_id
  ),
  listed as (
    select 1 as ord, 'it has no mappings' as problem
    where not exists (select 1 from m)
    union all
    select 2, 'rejected mappings must be removed first: ' || string_agg(m.mapping_key, ', ' order by m.mapping_key)
    from m where m.review_status = 'rejected'
    having count(*) > 0
    union all
    select 3, 'mappings without a source: ' || string_agg(m.mapping_key, ', ' order by m.mapping_key)
    from m where not exists (select 1 from specialization.mapping_sources s where s.mapping_id = m.id)
    having count(*) > 0
    union all
    select 4, 'reviewed mappings without a located source: ' || string_agg(m.mapping_key, ', ' order by m.mapping_key)
    from m
    where m.review_status = 'reviewed'
      and not exists (
        select 1 from specialization.mapping_sources s
        where s.mapping_id = m.id and btrim(coalesce(s.locator, '')) <> ''
      )
    having count(*) > 0
    union all
    select 5, 'mapped muscles without a reviewed function claim: ' || string_agg(distinct m.node_id, ', ' order by m.node_id)
    from m
    where not exists (
      select 1 from specialization.claims c
      where c.node_id = m.node_id and c.kind = 'function' and c.review_status = 'reviewed'
    )
    having count(*) > 0
    union all
    select 6, 'reviewed mappings credit muscles that are not reviewed: ' || string_agg(distinct m.node_id, ', ' order by m.node_id)
    from m
    join specialization.nodes n on n.id = m.node_id
    where m.review_status = 'reviewed' and n.status <> 'reviewed'
    having count(*) > 0
    union all
    select 7, 'mappings credit a movement their muscle has no node action for: ' || string_agg(m.mapping_key, ', ' order by m.mapping_key)
    from m
    where m.action_id is not null
      and not exists (
        select 1 from specialization.node_actions na
        where na.node_id = m.node_id and na.action_id = m.action_id
      )
    having count(*) > 0
    union all
    select 8, 'reviewed mappings rest on a function claim that is not reviewed: ' || string_agg(m.mapping_key || ' (' || c.claim_key || ')', ', ' order by m.mapping_key)
    from m
    join specialization.node_actions na on na.node_id = m.node_id and na.action_id = m.action_id
    join specialization.claims c on c.id = na.claim_id
    where m.review_status = 'reviewed' and c.review_status <> 'reviewed'
    having count(*) > 0
    union all
    select 9, 'reviewed mappings rest on a function claim with no source: ' || string_agg(m.mapping_key || ' (' || c.claim_key || ')', ', ' order by m.mapping_key)
    from m
    join specialization.node_actions na on na.node_id = m.node_id and na.action_id = m.action_id
    join specialization.claims c on c.id = na.claim_id
    where m.review_status = 'reviewed'
      and not exists (select 1 from specialization.claim_sources cs where cs.claim_id = c.id)
    having count(*) > 0
  )
  select string_agg(problem, '; ' order by ord) from listed
$fn$;

comment on function specialization.mapping_version_problems(uuid) is
  'The mapping-version publication rule: null when the version may be published, else the problems. Enforced by the mapping_versions trigger; callable by the service role to check a draft first.';

-- Versions are created as drafts, may change while draft, are published once (when the
-- rule above passes), and may then only be retired. Published and retired versions are
-- never deleted.
create or replace function specialization.guard_mapping_version()
returns trigger
language plpgsql
set search_path = ''
as $fn$
declare
  v_problems text;
begin
  if tg_op = 'INSERT' then
    if new.state <> 'draft' then
      raise exception 'mapping version % must be created as a draft: add its mappings and sources, then publish it', new.version_key
        using errcode = '23514';
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.state <> 'draft' then
      raise exception 'mapping version % is %; it cannot be deleted', old.version_key, old.state
        using errcode = '23514';
    end if;
    return old;
  end if;

  if old.state = 'draft' then
    if new.state = 'retired' then
      raise exception 'mapping version % is a draft: delete it instead of retiring it', old.version_key
        using errcode = '23514';
    end if;
    if new.state = 'published' then
      new.published_at := coalesce(new.published_at, pg_catalog.now());
      -- Lock what the version is about to rest on (the rows the guards in section 7b
      -- freeze), so a concurrent change to one of them either commits first, and the
      -- check below and the published version see it, or waits for this publish and is
      -- then refused by its guard.
      perform 1 from specialization.exercise_variants ev
      where ev.variant_key in (select m.variant_key from specialization.variant_mappings m where m.version_id = new.id)
      for share;
      perform 1 from specialization.nodes n
      where n.id in (select m.node_id from specialization.variant_mappings m where m.version_id = new.id)
      for share;
      perform 1 from specialization.node_actions na
      where (na.node_id, na.action_id) in (
        select m.node_id, m.action_id from specialization.variant_mappings m where m.version_id = new.id and m.action_id is not null
      )
      for share;
      perform 1 from specialization.claims c
      where c.node_id in (select m.node_id from specialization.variant_mappings m where m.version_id = new.id)
      for share;
      perform 1 from specialization.claim_sources cs
      where cs.claim_id in (
        select c.id from specialization.claims c
        where c.node_id in (select m.node_id from specialization.variant_mappings m where m.version_id = new.id)
      )
      for share;
      perform 1 from specialization.sources s
      where s.id in (
        select ms.source_id from specialization.mapping_sources ms
        join specialization.variant_mappings m on m.id = ms.mapping_id
        where m.version_id = new.id
        union
        select cs.source_id from specialization.claim_sources cs
        join specialization.claims c on c.id = cs.claim_id
        where c.node_id in (select m.node_id from specialization.variant_mappings m where m.version_id = new.id)
      )
      for share;
      v_problems := specialization.mapping_version_problems(new.id);
      if v_problems is not null then
        raise exception 'mapping version % cannot be published: %', new.version_key, v_problems
          using errcode = '23514';
      end if;
    end if;
    return new;
  end if;

  if old.state = 'published' and new.state = 'retired'
     and (new.id, new.version_key, new.region_id, new.published_at, new.method_notes)
         is not distinct from (old.id, old.version_key, old.region_id, old.published_at, old.method_notes) then
    return new;
  end if;

  raise exception 'mapping version % is %; it cannot change. Publish a new version instead', old.version_key, old.state
    using errcode = '23514';
end
$fn$;

create or replace trigger mapping_versions_guard
  before insert or update or delete on specialization.mapping_versions
  for each row execute function specialization.guard_mapping_version();

-- Rows of a published or retired version are frozen. Inserts are checked AFTER the row is
-- written so an idempotent upsert that changes nothing (the seed applied twice) never
-- trips the guard; updates and deletes are checked before. The version row is locked
-- (FOR SHARE) so a publish running at the same moment waits for this write, and its
-- check then sees it.
create or replace function specialization.guard_published_mapping()
returns trigger
language plpgsql
set search_path = ''
as $fn$
declare
  v_state text;
  v_key text;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    select v.state, v.version_key into v_state, v_key
    from specialization.mapping_versions v
    where v.id = old.version_id
    for share;
    if found and v_state <> 'draft' then
      raise exception 'mapping % belongs to % version %; it cannot change. Publish a new version instead', old.mapping_key, v_state, v_key
        using errcode = '23514';
    end if;
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    select v.state, v.version_key into v_state, v_key
    from specialization.mapping_versions v
    where v.id = new.version_id
    for share;
    if found and v_state <> 'draft' then
      raise exception 'mapping version % is %; mappings cannot be added to it or moved into it', v_key, v_state
        using errcode = '23514';
    end if;
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end
$fn$;

create or replace trigger variant_mappings_guard_insert
  after insert on specialization.variant_mappings
  for each row execute function specialization.guard_published_mapping();

create or replace trigger variant_mappings_guard_change
  before update or delete on specialization.variant_mappings
  for each row execute function specialization.guard_published_mapping();

create or replace function specialization.guard_published_mapping_source()
returns trigger
language plpgsql
set search_path = ''
as $fn$
declare
  v_state text;
  v_key text;
  v_mapping_key text;
  v_mapping_ids uuid[];
  v_mapping_id uuid;
begin
  if tg_op = 'INSERT' then
    v_mapping_ids := array[new.mapping_id];
  elsif tg_op = 'DELETE' then
    v_mapping_ids := array[old.mapping_id];
  else
    v_mapping_ids := array[old.mapping_id, new.mapping_id];
  end if;
  foreach v_mapping_id in array v_mapping_ids loop
    select v.state, v.version_key, m.mapping_key into v_state, v_key, v_mapping_key
    from specialization.variant_mappings m
    join specialization.mapping_versions v on v.id = m.version_id
    where m.id = v_mapping_id
    for share of v;
    if found and v_state <> 'draft' then
      raise exception 'the sources of mapping % in % version % cannot change. Publish a new version instead', v_mapping_key, v_state, v_key
        using errcode = '23514';
    end if;
  end loop;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end
$fn$;

create or replace trigger mapping_sources_guard_insert
  after insert on specialization.mapping_sources
  for each row execute function specialization.guard_published_mapping_source();

create or replace trigger mapping_sources_guard_change
  before update or delete on specialization.mapping_sources
  for each row execute function specialization.guard_published_mapping_source();

create or replace function specialization.guard_published_rule_version()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  if old.published_at is not null then
    raise exception 'rule version % is published; it cannot change. Publish a new version id instead', old.id
      using errcode = '23514';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end
$fn$;

create or replace trigger rule_versions_guard
  before update or delete on specialization.rule_versions
  for each row execute function specialization.guard_published_rule_version();

-- ---------------------------------------------------------------------------
-- 7b. What a published version rests on is frozen with it
-- ---------------------------------------------------------------------------

-- A mapping version is more than its rows: a variant's deliberate_hold decides whether a
-- direct isometric mapping counts as a deliberate hold, a mapped muscle's region, role and
-- catalog muscle key decide whether its work is the region's, the publication rule rests
-- on the muscles' reviewed function claims and node actions, and users read the claims
-- (with their basis) and sources behind every row. While any published or retired
-- version depends on one of these rows, a change that would rewrite or remove it is
-- refused, for every role, the owner included. Adding is allowed (a new claim, node action, source or variant), and so
-- is an update that changes nothing (the seed applied again). A changed row needs a new
-- key and, where mappings must point at it, a new mapping version.
--
-- Concurrency: these guards take no lock of their own (they already hold the row they are
-- changing); publishing locks every row it rests on FOR SHARE first (guard_mapping_version),
-- so a change either commits before the publish checks, or waits and is then refused.
-- The one insert guarded here (a claim's source) locks the versions instead, like the
-- mapping guards above.

create or replace function specialization.guard_published_variant()
returns trigger
language plpgsql
set search_path = ''
as $fn$
declare
  v_versions text;
begin
  if tg_op = 'UPDATE' and new is not distinct from old then
    return new;
  end if;
  select string_agg(label, ', ' order by label) into v_versions
  from (
    select distinct v.version_key || ' (' || v.state || ')' as label
    from specialization.variant_mappings m
    join specialization.mapping_versions v on v.id = m.version_id
    where m.variant_key = old.variant_key and v.state <> 'draft'
  ) as used;
  if v_versions is not null then
    raise exception 'variant % is used by mapping version %; it cannot change or be deleted. Add the changed variant under a new key and map it in a new version', old.variant_key, v_versions
      using errcode = '23514';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end
$fn$;

create or replace trigger exercise_variants_guard_published
  before update or delete on specialization.exercise_variants
  for each row execute function specialization.guard_published_variant();

-- claim_kind is generated, so it is not yet computed in NEW here; compare the real columns.
create or replace function specialization.guard_published_node_action()
returns trigger
language plpgsql
set search_path = ''
as $fn$
declare
  v_versions text;
begin
  if tg_op = 'UPDATE'
     and (new.node_id, new.action_id, new.role, new.claim_id) is not distinct from (old.node_id, old.action_id, old.role, old.claim_id) then
    return new;
  end if;
  select string_agg(label, ', ' order by label) into v_versions
  from (
    select distinct v.version_key || ' (' || v.state || ')' as label
    from specialization.variant_mappings m
    join specialization.mapping_versions v on v.id = m.version_id
    where m.node_id = old.node_id and m.action_id = old.action_id and v.state <> 'draft'
  ) as used;
  if v_versions is not null then
    raise exception 'node action % % is named by mapping version %; it cannot change or be deleted', old.node_id, old.action_id, v_versions
      using errcode = '23514';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end
$fn$;

create or replace trigger node_actions_guard_published
  before update or delete on specialization.node_actions
  for each row execute function specialization.guard_published_node_action();

-- A mapped muscle stays reviewed (users read its rows only while it is), and keeps what
-- decides what its work counts toward: its region (whether its bouts are the region's),
-- its role and its catalog muscle key (which catalog-tagged work is region work). Its
-- names, descriptions, kind, parent and database muscle (which follows public.muscles on
-- update) may still be edited; a draft node is free.
create or replace function specialization.guard_published_node()
returns trigger
language plpgsql
set search_path = ''
as $fn$
declare
  v_versions text;
begin
  if tg_op = 'UPDATE'
     and (old.status <> 'reviewed'
          or (new.status = 'reviewed'
              and (new.region_id, new.role, new.catalog_muscle_key) is not distinct from (old.region_id, old.role, old.catalog_muscle_key))) then
    return new;
  end if;
  select string_agg(label, ', ' order by label) into v_versions
  from (
    select distinct v.version_key || ' (' || v.state || ')' as label
    from specialization.variant_mappings m
    join specialization.mapping_versions v on v.id = m.version_id
    where m.node_id = old.id and v.state <> 'draft'
  ) as used;
  if v_versions is not null then
    raise exception 'node % is mapped by mapping version %; it must stay reviewed and cannot be deleted, and its region, role and catalog muscle key, which decide what its work counts toward, cannot change. Add the changed muscle under a new id and map it in a new version', old.id, v_versions
      using errcode = '23514';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end
$fn$;

create or replace trigger nodes_guard_published
  before update or delete on specialization.nodes
  for each row execute function specialization.guard_published_node();

-- A reviewed claim on a mapped muscle keeps its key, node, kind, statement and basis (the
-- provenance label users read beside it: established anatomy, experimental, inference,
-- product assumption), stays reviewed, and is not deleted. Its review date and note may
-- still be edited; a draft or rejected claim was never shown or relied on, and is free.
create or replace function specialization.guard_published_claim()
returns trigger
language plpgsql
set search_path = ''
as $fn$
declare
  v_versions text;
begin
  if old.review_status <> 'reviewed'
     or (tg_op = 'UPDATE'
         and new.review_status = 'reviewed'
         and (new.claim_key, new.node_id, new.kind, new.statement, new.basis) is not distinct from (old.claim_key, old.node_id, old.kind, old.statement, old.basis)) then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;
  select string_agg(label, ', ' order by label) into v_versions
  from (
    select distinct v.version_key || ' (' || v.state || ')' as label
    from specialization.variant_mappings m
    join specialization.mapping_versions v on v.id = m.version_id
    where m.node_id = old.node_id and v.state <> 'draft'
  ) as used;
  if v_versions is not null then
    raise exception 'claim % is a reviewed claim on %, which mapping version % maps; its key, node, kind, statement, basis and review status cannot change and it cannot be deleted. Add the corrected claim under a new key', old.claim_key, old.node_id, v_versions
      using errcode = '23514';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end
$fn$;

create or replace trigger claims_guard_published
  before update or delete on specialization.claims
  for each row execute function specialization.guard_published_claim();

-- The sources of such a claim, like the sources of a published mapping: none added,
-- changed or removed. Inserts are checked after the write, as for mappings.
create or replace function specialization.guard_published_claim_source()
returns trigger
language plpgsql
set search_path = ''
as $fn$
declare
  v_claim_ids uuid[];
  v_claim_id uuid;
  v_key text;
  v_versions text;
begin
  if tg_op = 'INSERT' then
    v_claim_ids := array[new.claim_id];
    perform 1 from specialization.mapping_versions v
    where v.id in (
      select m.version_id from specialization.variant_mappings m
      join specialization.claims c on c.node_id = m.node_id
      where c.id = new.claim_id
    )
    for share;
  elsif tg_op = 'DELETE' then
    v_claim_ids := array[old.claim_id];
  else
    if new is not distinct from old then
      return new;
    end if;
    v_claim_ids := array[old.claim_id, new.claim_id];
  end if;
  foreach v_claim_id in array v_claim_ids loop
    select c.claim_key,
           (select string_agg(label, ', ' order by label)
            from (
              select distinct v.version_key || ' (' || v.state || ')' as label
              from specialization.variant_mappings m
              join specialization.mapping_versions v on v.id = m.version_id
              where m.node_id = c.node_id and v.state <> 'draft'
            ) as used)
      into v_key, v_versions
    from specialization.claims c
    where c.id = v_claim_id and c.review_status = 'reviewed';
    if v_versions is not null then
      raise exception 'the sources of claim % cannot change: it is a reviewed claim on a muscle that mapping version % maps. Add the corrected claim under a new key', v_key, v_versions
        using errcode = '23514';
    end if;
  end loop;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end
$fn$;

create or replace trigger claim_sources_guard_insert
  after insert on specialization.claim_sources
  for each row execute function specialization.guard_published_claim_source();

create or replace trigger claim_sources_guard_change
  before update or delete on specialization.claim_sources
  for each row execute function specialization.guard_published_claim_source();

-- A source a published version cites, through a mapping or a frozen claim, keeps its key,
-- url, title and evidence type, and is not deleted. Its DOI, retrieval date and notes may
-- still be edited.
create or replace function specialization.guard_published_source()
returns trigger
language plpgsql
set search_path = ''
as $fn$
declare
  v_versions text;
begin
  if tg_op = 'UPDATE'
     and (new.source_key, new.url, new.title, new.evidence_type) is not distinct from (old.source_key, old.url, old.title, old.evidence_type) then
    return new;
  end if;
  select string_agg(label, ', ' order by label) into v_versions
  from (
    select v.version_key || ' (' || v.state || ')' as label
    from specialization.mapping_sources ms
    join specialization.variant_mappings m on m.id = ms.mapping_id
    join specialization.mapping_versions v on v.id = m.version_id
    where ms.source_id = old.id and v.state <> 'draft'
    union
    select v.version_key || ' (' || v.state || ')'
    from specialization.claim_sources cs
    join specialization.claims c on c.id = cs.claim_id
    join specialization.variant_mappings m on m.node_id = c.node_id
    join specialization.mapping_versions v on v.id = m.version_id
    where cs.source_id = old.id and c.review_status = 'reviewed' and v.state <> 'draft'
  ) as cited;
  if v_versions is not null then
    raise exception 'source % is cited by mapping version %; its key, url, title and evidence type cannot change and it cannot be deleted. Add the corrected source under a new key', old.source_key, v_versions
      using errcode = '23514';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end
$fn$;

create or replace trigger sources_guard_published
  before update or delete on specialization.sources
  for each row execute function specialization.guard_published_source();

-- TRUNCATE fires no row trigger, so it would empty every table above at once. Refused on
-- each of them (a TRUNCATE ... CASCADE reaching one is refused too) while anything is
-- published; a database holding only drafts can still be cleared.
create or replace function specialization.refuse_truncate_while_published()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  if tg_table_name = 'rule_versions' then
    if exists (select 1 from specialization.rule_versions r where r.published_at is not null) then
      raise exception 'specialization.rule_versions holds a published rule version; it cannot be truncated'
        using errcode = '23514';
    end if;
  elsif exists (select 1 from specialization.mapping_versions v where v.state <> 'draft') then
    raise exception 'specialization.% holds rows that published or retired mapping versions rest on; it cannot be truncated', tg_table_name
      using errcode = '23514';
  end if;
  return null;
end
$fn$;

do $do$
declare
  t text;
begin
  foreach t in array array[
    'mapping_versions', 'variant_mappings', 'mapping_sources', 'rule_versions',
    'exercise_variants', 'nodes', 'node_actions', 'claims', 'claim_sources', 'sources'
  ] loop
    execute format(
      'create or replace trigger %I before truncate on specialization.%I for each statement execute function specialization.refuse_truncate_while_published()',
      t || '_refuse_truncate', t
    );
  end loop;
end
$do$;

-- IANA zones only, as Postgres knows them (the device checks the same with Intl).
create or replace function specialization.check_goal_timezone()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names z where z.name = new.timezone) then
    raise exception 'unknown time zone: %', new.timezone
      using errcode = '22023', hint = 'Use an IANA zone name such as Europe/London.';
  end if;
  return new;
end
$fn$;

create or replace trigger goals_check_timezone
  before insert or update of timezone on specialization.goals
  for each row execute function specialization.check_goal_timezone();

-- updated_at follows the last write, unless the write sets it itself (a sync carrying
-- the device's own time).
create or replace function specialization.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  if new.updated_at is not distinct from old.updated_at then
    new.updated_at := pg_catalog.now();
  end if;
  return new;
end
$fn$;

create or replace trigger goals_touch_updated_at
  before update on specialization.goals
  for each row execute function specialization.touch_updated_at();

create or replace trigger measurements_touch_updated_at
  before update on specialization.measurements
  for each row execute function specialization.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 8. Row-level security
-- ---------------------------------------------------------------------------

do $do$
declare
  t text;
begin
  foreach t in array array[
    'regions', 'actions', 'nodes', 'sources', 'claims', 'claim_sources', 'node_actions',
    'diagram_assets', 'diagram_views', 'diagram_paths', 'diagram_labels', 'catalog_exercises', 'exercise_variants',
    'mapping_versions', 'variant_mappings', 'mapping_sources', 'rule_versions', 'goals', 'measurements'
  ] loop
    execute format('alter table specialization.%I enable row level security', t);
  end loop;

  -- Reference rows with nothing unreviewed about them.
  foreach t in array array['actions', 'sources', 'diagram_assets', 'diagram_views', 'diagram_paths', 'diagram_labels', 'catalog_exercises', 'exercise_variants'] loop
    execute format('drop policy if exists %I on specialization.%I', t || '_read', t);
    execute format('create policy %I on specialization.%I for select to authenticated using (true)', t || '_read', t);
  end loop;

  -- Owner-only personal rows.
  foreach t in array array['goals', 'measurements'] loop
    execute format('drop policy if exists %I on specialization.%I', t || '_select_own', t);
    execute format('create policy %I on specialization.%I for select to authenticated using ((select auth.uid()) = user_id)', t || '_select_own', t);
    execute format('drop policy if exists %I on specialization.%I', t || '_insert_own', t);
    execute format('create policy %I on specialization.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t || '_insert_own', t);
    execute format('drop policy if exists %I on specialization.%I', t || '_update_own', t);
    execute format('create policy %I on specialization.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t || '_update_own', t);
    execute format('drop policy if exists %I on specialization.%I', t || '_delete_own', t);
    execute format('create policy %I on specialization.%I for delete to authenticated using ((select auth.uid()) = user_id)', t || '_delete_own', t);
  end loop;
end
$do$;

drop policy if exists regions_read on specialization.regions;
create policy regions_read on specialization.regions
  for select to authenticated using (status in ('production', 'reference'));

drop policy if exists nodes_read on specialization.nodes;
create policy nodes_read on specialization.nodes
  for select to authenticated using (status = 'reviewed');

drop policy if exists claims_read on specialization.claims;
create policy claims_read on specialization.claims
  for select to authenticated using (
    review_status = 'reviewed'
    and exists (select 1 from specialization.nodes n where n.id = node_id and n.status = 'reviewed')
  );

drop policy if exists claim_sources_read on specialization.claim_sources;
create policy claim_sources_read on specialization.claim_sources
  for select to authenticated using (
    exists (
      select 1 from specialization.claims c
      join specialization.nodes n on n.id = c.node_id
      where c.id = claim_id and c.review_status = 'reviewed' and n.status = 'reviewed'
    )
  );

drop policy if exists node_actions_read on specialization.node_actions;
create policy node_actions_read on specialization.node_actions
  for select to authenticated using (
    exists (
      select 1 from specialization.claims c
      join specialization.nodes n on n.id = c.node_id
      where c.id = claim_id and c.review_status = 'reviewed' and n.status = 'reviewed'
    )
  );

drop policy if exists mapping_versions_read on specialization.mapping_versions;
create policy mapping_versions_read on specialization.mapping_versions
  for select to authenticated using (state = 'published');

drop policy if exists variant_mappings_read on specialization.variant_mappings;
create policy variant_mappings_read on specialization.variant_mappings
  for select to authenticated using (
    review_status = 'reviewed'
    and exists (select 1 from specialization.mapping_versions v where v.id = version_id and v.state = 'published')
    and exists (select 1 from specialization.nodes n where n.id = node_id and n.status = 'reviewed')
  );

drop policy if exists mapping_sources_read on specialization.mapping_sources;
create policy mapping_sources_read on specialization.mapping_sources
  for select to authenticated using (
    exists (
      select 1 from specialization.variant_mappings m
      join specialization.mapping_versions v on v.id = m.version_id
      join specialization.nodes n on n.id = m.node_id
      where m.id = mapping_id and m.review_status = 'reviewed' and v.state = 'published' and n.status = 'reviewed'
    )
  );

drop policy if exists rule_versions_read on specialization.rule_versions;
create policy rule_versions_read on specialization.rule_versions
  for select to authenticated using (published_at is not null);

-- ---------------------------------------------------------------------------
-- 9. Privileges: revoke everything, then grant exactly what the policies need
-- ---------------------------------------------------------------------------

-- Functions: Postgres grants EXECUTE to PUBLIC on every function it creates, and
-- `alter default privileges in schema ...` cannot take that away (per-schema defaults only
-- add to the global ones), so nothing here relies on default privileges. The revoke below
-- covers the functions this file creates; a migration that adds a function must repeat
-- `revoke all on function ... from public, anon, authenticated` and grant only what is
-- meant. server/specializationSchema.test.ts walks pg_proc and fails on any function in
-- this schema that PUBLIC, anon or authenticated can execute.
revoke all on schema specialization from public, anon, authenticated, service_role;
revoke all on all tables in schema specialization from public, anon, authenticated, service_role;
revoke all on all sequences in schema specialization from public, anon, authenticated, service_role;
revoke all on all functions in schema specialization from public, anon, authenticated, service_role;

grant usage on schema specialization to authenticated, service_role;

grant select on
  specialization.regions, specialization.actions, specialization.nodes, specialization.sources,
  specialization.claims, specialization.claim_sources, specialization.node_actions,
  specialization.diagram_assets, specialization.diagram_views, specialization.diagram_paths, specialization.diagram_labels,
  specialization.catalog_exercises, specialization.exercise_variants,
  specialization.mapping_versions, specialization.variant_mappings, specialization.mapping_sources,
  specialization.rule_versions
  to authenticated;

grant select, insert, update, delete on specialization.goals, specialization.measurements to authenticated;

-- Not ALL: TRUNCATE would skip every row guard, and TRIGGER and REFERENCES are not needed.
grant select, insert, update, delete on all tables in schema specialization to service_role;
grant execute on function specialization.mapping_version_problems(uuid) to service_role;

comment on table specialization.goals is
  'Athlete targets (SpecializationGoal). Owner-only. A target is the athlete''s intent, never a recommendation; nothing raises one. Overlaps refused by goals_no_overlap.';
comment on table specialization.measurements is
  'Circumference and grip-force readings with their protocol (SpecializationMeasurement). Owner-only. Never read as the growth of one muscle.';
comment on table specialization.variant_mappings is
  'How one muscle takes part in one exercise variant for one joint action, inside an immutable mapping version. Users see reviewed rows of published versions only.';
comment on table specialization.rule_versions is
  'Published accounting rules (specialization_exposure_v1, …). Immutable once published_at is set.';
