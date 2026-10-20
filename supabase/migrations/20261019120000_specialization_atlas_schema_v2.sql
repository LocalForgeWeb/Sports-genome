-- Specialization atlas, schema v2: one schema for several regions
-- (docs/specialization-atlas/10-multi-region.md §5.1; 04-database.md §10).
--
-- Applies after schema v1 (…_specialization_atlas_schema.sql) and seed v1, which production
-- recorded on 18 Oct 2026 and which are never edited again. What it adds:
--   * region_nodes: the muscles each region lists, with the node's role there (its home
--     role in its home region, external everywhere else), the order, the membership's own
--     caveats and whether the region still lists it. A goal on a muscle names one.
--   * region_actions: the joint actions each region offers, in order. A movement goal names one.
--   * variant_dimensions, variant_dimension_values, variant_attributes: what a variant's
--     forearm columns cannot say (the counting attributes sided_by, leg_laterality and
--     side_anchor, and descriptive ones such as knee or stance), held beside the variant so a
--     frozen variant row is never written. An attribute freezes when a version that maps its
--     variant is published.
--   * regions: the side model (paired by arm or by leg, or midline) and its words, the sentence
--     that names the region and a side, the catalog keys, the region-only tag scope, the heading
--     other pages put over the region's muscles, and the measures' default landmark and posture.
--     Written here for the forearm.
--   * diagram_assets.sides: whether a drawing shows one side, mirrored for the other, or both.
--   * not_applicable in exercise_variants' laterality, forearm_orientation and wrist_position;
--     variant_mappings.side_relation (same, opposite, both); side midline on goals and
--     measurements, the girth_cm metric and two postures; which goals may be written.
--   * mapping_version_problems and guard_mapping_version, restated in full: rule 10 always,
--     rules 11 and 12 when a draft is published; publishing locks what they read and freezes
--     the attributes it rests on.
--
-- Additive and idempotent: it can be applied twice. No transaction control and nothing a
-- function's EXECUTE cannot run, so it is applied as one DO block per file, like v1
-- (scripts/specialization/release/make-apply-sql.mjs). A replaced CHECK validates the rows
-- without writing them, and a column added with a constant default writes no row and fires no
-- trigger: over schema v1 and seed v1 it writes the forearm region row's new columns and new
-- rows in its own tables, and nothing else. It locks nothing outside schema specialization.
-- Tested in PGlite: server/specializationSchemaV2.test.ts.
--
-- Forward-only. v1's "drop schema if exists specialization cascade" is not a rollback any more:
-- it would destroy published history. One undo exists for this file, valid only while seed v3
-- is unrecorded: scripts/specialization/release/schema_v2_undo.sql (04-database.md §10).

-- ---------------------------------------------------------------------------
-- 1. Regions: sides, catalog keys, words and measure defaults; a drawing's sides
-- ---------------------------------------------------------------------------

-- side_model: paired (by side_limb, arm or leg) or midline (the core: counted once, no side).
-- side_word, side_word_plural: the limb the logger asks about, as the page names it ('arm',
-- 'arms'; 'side', 'sides' on the chest and back). on_side_template: the region and a side in a
-- sentence, '{side}' standing for left or right ('your {side} forearm'); a midline region's names
-- no side ('your core'). catalog_keys: the catalog muscle keys whose
-- tagged work is the region's (no longer derived from its target muscles), read within
-- region_only_tag_scope ('any': primary and secondary tags; 'primary'). external_heading: the
-- heading another region's page puts over this region's muscles. measurement_defaults: each
-- measure's default landmark and posture, {"<metric>": {"landmark": …, "posture": …}}.
alter table specialization.regions
  add column if not exists side_model text check (side_model in ('paired', 'midline')),
  add column if not exists side_limb text check (side_limb in ('arm', 'leg')),
  add column if not exists side_word text check (btrim(side_word) <> ''),
  add column if not exists side_word_plural text check (btrim(side_word_plural) <> ''),
  add column if not exists catalog_keys text[] not null default '{}',
  add column if not exists region_only_tag_scope text not null default 'any' check (region_only_tag_scope in ('any', 'primary')),
  add column if not exists external_heading text check (btrim(external_heading) <> ''),
  add column if not exists measurement_defaults jsonb not null default '{}'::jsonb check (jsonb_typeof(measurement_defaults) = 'object'),
  add column if not exists on_side_template text check (btrim(on_side_template) <> '');

-- The forearm as shipped: paired by arm, catalog key forearms (what its target muscles' keys
-- gave), primary and secondary tags. Written once, before the sides rule and the guard below
-- exist; applied again, it finds the side model set and touches nothing.
update specialization.regions
set side_model = 'paired',
    side_limb = 'arm',
    side_word = 'arm',
    side_word_plural = 'arms',
    catalog_keys = array['forearms'],
    region_only_tag_scope = 'any',
    external_heading = 'Forearm muscles credited here',
    measurement_defaults = '{"circumference_cm": {"landmark": "Thickest point", "posture": "arm_relaxed_hanging"}, "grip_force_n": {"landmark": "Dynamometer grip", "posture": "elbow_90_supported"}}'::jsonb,
    on_side_template = 'your {side} forearm'
where id = 'forearm' and side_model is null;

alter table specialization.regions drop constraint if exists regions_measurement_metrics_check;
alter table specialization.regions add constraint regions_measurement_metrics_check
  check (measurement_metrics <@ array['circumference_cm', 'grip_force_n', 'girth_cm']::text[]);

-- Production and fixture regions need a complete side model; a reference region needs none.
-- A paired region has a limb, its words and a sentence naming one side ('{side}' once); a
-- midline region has no limb and no words, and a sentence naming no side. Checked on the
-- stored row by an AFTER trigger, not by a CHECK: Postgres evaluates a CHECK on the row an
-- upsert proposes before it finds the conflict, so a seed that does not name these columns
-- (seed v1, which upserts the forearm row unchanged) would be refused. The rows already there
-- are checked once, below, with the same condition.
create or replace function specialization.check_region_sides()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  if not (case new.side_model
             when 'paired' then new.side_limb is not null and new.side_word is not null and new.side_word_plural is not null
               and new.on_side_template is not null and new.on_side_template like '%{side}%' and new.on_side_template not like '%{side}%{side}%'
             when 'midline' then new.side_limb is null and new.side_word is null and new.side_word_plural is null
               and new.on_side_template is not null and new.on_side_template not like '%{side}%'
             else new.status = 'reference' and new.side_limb is null and new.side_word is null and new.side_word_plural is null and new.on_side_template is null
           end) then
    raise exception 'region % (%) needs a complete side model: paired with a limb, its words and a sentence naming {side} once, or midline with no limb, no words and a sentence naming no side; only a reference region may have none', new.id, new.status
      using errcode = '23514';
  end if;
  return null;
end
$fn$;

do $do$
declare
  v_regions text;
begin
  select string_agg(r.id, ', ' order by r.id) into v_regions
  from specialization.regions r
  where not case r.side_model
              when 'paired' then r.side_limb is not null and r.side_word is not null and r.side_word_plural is not null
                and r.on_side_template is not null and r.on_side_template like '%{side}%' and r.on_side_template not like '%{side}%{side}%'
              when 'midline' then r.side_limb is null and r.side_word is null and r.side_word_plural is null
                and r.on_side_template is not null and r.on_side_template not like '%{side}%'
              else r.status = 'reference' and r.side_limb is null and r.side_word is null and r.side_word_plural is null and r.on_side_template is null
            end;
  if v_regions is not null then
    raise exception 'regions without a complete side model: %', v_regions
      using errcode = '23514';
  end if;
end
$do$;

create or replace trigger regions_sides_shape
  after insert or update on specialization.regions
  for each row execute function specialization.check_region_sides();

-- A drawing's sides: one_side, drawn for the subject's right side and mirrored for the left;
-- both_sides, drawn whole and never mirrored (a midline region's). Null reads as one_side: the
-- forearm's drawing, as published, leaves it out. Adding the column writes no row.
alter table specialization.diagram_assets
  add column if not exists sides text check (sides in ('one_side', 'both_sides'));

-- ---------------------------------------------------------------------------
-- 2. Variants and mappings
-- ---------------------------------------------------------------------------

-- not_applicable: the hands do no work (a leg press), or a column of the forearm's does not
-- apply (a squat has no forearm orientation). Widening validates the rows; it writes none.
alter table specialization.exercise_variants drop constraint if exists exercise_variants_laterality_check;
alter table specialization.exercise_variants add constraint exercise_variants_laterality_check
  check (laterality in ('bilateral', 'unilateral', 'either', 'not_applicable'));
alter table specialization.exercise_variants drop constraint if exists exercise_variants_forearm_orientation_check;
alter table specialization.exercise_variants add constraint exercise_variants_forearm_orientation_check
  check (forearm_orientation in ('supinated', 'neutral', 'pronated', 'changing', 'unknown', 'not_applicable'));
alter table specialization.exercise_variants drop constraint if exists exercise_variants_wrist_position_check;
alter table specialization.exercise_variants add constraint exercise_variants_wrist_position_check
  check (wrist_position in ('flexed', 'neutral', 'extended', 'changing', 'unknown', 'not_applicable'));

-- Where the mapped muscle is loaded, relative to the side the set records (the variant's side
-- anchor for a leg): the same side, the opposite side (a suitcase carry in the left hand loads
-- the right quadratus lumborum), or both. Every forearm_mappings_v1 row is 'same'.
alter table specialization.variant_mappings
  add column if not exists side_relation text not null default 'same' check (side_relation in ('same', 'opposite', 'both'));

-- ---------------------------------------------------------------------------
-- 3. The muscles and movements each region lists
-- ---------------------------------------------------------------------------

create table if not exists specialization.region_nodes (
  region_id text not null references specialization.regions (id),
  node_id text not null references specialization.nodes (id),
  role text not null check (role in ('target', 'adjacent', 'external', 'group')),
  sort_order integer not null default 0,
  caveats text[] not null default '{}',
  -- false once the content drops the member: the row stays, because goals point at it.
  listed boolean not null default true,
  primary key (region_id, node_id)
);
create index if not exists region_nodes_node_idx on specialization.region_nodes (node_id);

create table if not exists specialization.region_actions (
  region_id text not null references specialization.regions (id),
  action_id text not null references specialization.actions (id),
  sort_order integer not null default 0,
  listed boolean not null default true,
  primary key (region_id, action_id)
);

comment on table specialization.region_nodes is
  'The muscles each region lists (SpecializationRegionData members): role in that region (its home role in its home region, external everywhere else), order, caveats of the membership, and whether it is still listed. Rows are unlisted, never deleted. Readers use this, not nodes.role.';
comment on table specialization.region_actions is
  'The joint actions each region offers, in order, and whether it still lists them. Rows are unlisted, never deleted. Readers use this order, not actions.sort_order.';
comment on column specialization.nodes.role is
  'Legacy (schema v1): the role in the content forearm_mappings_v1 was published from; upper_arm.biceps and upper_arm.brachialis keep external for good. Frozen for mapped nodes. Readers use region_nodes.role.';
comment on column specialization.nodes.sort_order is
  'Legacy (schema v1): v1 rows keep their v1 values. Readers use region_nodes.sort_order.';
comment on column specialization.actions.sort_order is
  'Legacy (schema v1): v1 rows keep their v1 values. Readers use region_actions.sort_order.';

-- A membership's role says whether the region is the node's home: external exactly when it is
-- not. Checked when a membership is written, and when a node moves home (below).
create or replace function specialization.check_region_node_role()
returns trigger
language plpgsql
set search_path = ''
as $fn$
declare
  v_home text;
begin
  select n.region_id into v_home from specialization.nodes n where n.id = new.node_id;
  if v_home is not null and (new.role = 'external') <> (v_home <> new.region_id) then
    raise exception 'node % lives in region %, so its role in region % is %, not %', new.node_id, v_home, new.region_id,
      case when v_home = new.region_id then 'target, adjacent or group' else 'external' end, new.role
      using errcode = '23514';
  end if;
  return new;
end
$fn$;

create or replace trigger region_nodes_check_role
  before insert or update on specialization.region_nodes
  for each row execute function specialization.check_region_node_role();

create or replace function specialization.check_node_memberships()
returns trigger
language plpgsql
set search_path = ''
as $fn$
declare
  v_regions text;
begin
  if new.region_id is distinct from old.region_id then
    select string_agg(rn.region_id || ' (' || rn.role || ')', ', ' order by rn.region_id) into v_regions
    from specialization.region_nodes rn
    where rn.node_id = new.id and (rn.role = 'external') <> (rn.region_id <> new.region_id);
    if v_regions is not null then
      raise exception 'node % cannot move to region %: its memberships in % say it lives elsewhere', new.id, new.region_id, v_regions
        using errcode = '23514';
    end if;
  end if;
  return null;
end
$fn$;

create or replace trigger nodes_check_memberships
  after update of region_id on specialization.nodes
  for each row execute function specialization.check_node_memberships();

-- Memberships the published and retired versions were published under: each mapped node in its
-- version's region, with its own role there when it lives there, else external. Derived only
-- from frozen rows, so applying this again adds nothing; a row already there is left as it is.
insert into specialization.region_nodes (region_id, node_id, role, sort_order)
select distinct v.region_id, m.node_id,
       case when n.region_id = v.region_id then n.role else 'external' end,
       n.sort_order
from specialization.variant_mappings m
join specialization.mapping_versions v on v.id = m.version_id and v.state <> 'draft'
join specialization.nodes n on n.id = m.node_id
on conflict (region_id, node_id) do nothing;

-- The forearm's 20 actions, in v1's order.
insert into specialization.region_actions (region_id, action_id, sort_order)
select r.id, a.id, a.sort_order
from specialization.regions r
join specialization.actions a on a.id = any (array[
  'elbow.flexion', 'elbow.extension', 'forearm.pronation', 'forearm.supination', 'wrist.flexion', 'wrist.extension',
  'wrist.radial_deviation', 'wrist.ulnar_deviation', 'fingers.mcp_flexion', 'fingers.pip_flexion', 'fingers.dip_flexion',
  'fingers.extension', 'little_finger.extension', 'index_finger.extension', 'thumb.ip_flexion', 'thumb.cmc_abduction',
  'thumb.mcp_extension', 'thumb.ip_extension', 'hand.palmar_aponeurosis_tension', 'forearm.distal_radioulnar_stabilization'
])
where r.id = 'forearm'
on conflict (region_id, action_id) do nothing;

-- ---------------------------------------------------------------------------
-- 4. Variant attributes
-- ---------------------------------------------------------------------------

-- kind 'counting': the calculator and the logger read it (sided_by, leg_laterality,
-- side_anchor), and the publication rule requires it (rule 11). 'descriptive': mapping
-- rationales cite it; no rule reads it. Dimensions and values are the seed's rows, never this
-- file's.
create table if not exists specialization.variant_dimensions (
  id text primary key check (id ~ '^[a-z][a-z0-9_]*$'),
  label text not null check (btrim(label) <> ''),
  sort_order integer not null default 0,
  kind text not null check (kind in ('counting', 'descriptive'))
);

create table if not exists specialization.variant_dimension_values (
  dimension_id text not null references specialization.variant_dimensions (id),
  value text not null check (value ~ '^[a-z0-9][a-z0-9_]*$'),
  label text not null check (btrim(label) <> ''),
  sort_order integer not null default 0,
  primary key (dimension_id, value)
);

-- frozen_at: set by the publish of a version that maps the variant (guard_mapping_version), null
-- until then. The seed never writes it, so applying a seed again leaves it as it is.
create table if not exists specialization.variant_attributes (
  variant_key text not null references specialization.exercise_variants (variant_key),
  dimension_id text not null,
  value text not null,
  notes text,
  frozen_at timestamptz,
  primary key (variant_key, dimension_id),
  constraint variant_attributes_value_listed foreign key (dimension_id, value)
    references specialization.variant_dimension_values (dimension_id, value)
);
create index if not exists variant_attributes_value_idx on specialization.variant_attributes (dimension_id, value);

comment on table specialization.variant_attributes is
  'Execution attributes of a variant beyond its own columns (counting: sided_by, leg_laterality, side_anchor; descriptive: knee, stance, …). Frozen from the publish of a version that maps the variant (frozen_at); one added later is free until the next such publish.';

-- ---------------------------------------------------------------------------
-- 5. Goals and measurements
-- ---------------------------------------------------------------------------

-- midline: a goal or measure of a midline region (the core), or a girth around the trunk.
alter table specialization.goals drop constraint if exists goals_side_check;
alter table specialization.goals add constraint goals_side_check check (side in ('left', 'right', 'midline'));

-- A goal names a muscle or movement its region lists, as a key, so a membership a goal points at
-- cannot be deleted (the seed unlists it instead).
alter table specialization.goals drop constraint if exists goals_node_in_region;
alter table specialization.goals add constraint goals_node_in_region
  foreign key (region_id, node_id) references specialization.region_nodes (region_id, node_id);
alter table specialization.goals drop constraint if exists goals_action_in_region;
alter table specialization.goals add constraint goals_action_in_region
  foreign key (region_id, action_id) references specialization.region_actions (region_id, action_id);

alter table specialization.measurements drop constraint if exists measurements_side_check;
alter table specialization.measurements add constraint measurements_side_check check (side in ('left', 'right', 'midline'));
alter table specialization.measurements drop constraint if exists measurements_metric_check;
alter table specialization.measurements add constraint measurements_metric_check check (metric in ('circumference_cm', 'grip_force_n', 'girth_cm'));
-- A girth goes around the trunk, so it has no side; every other measure is of one limb.
alter table specialization.measurements drop constraint if exists measurements_side_metric;
alter table specialization.measurements add constraint measurements_side_metric check ((side = 'midline') = (metric = 'girth_cm'));
-- v1's protocol rule, with the postures arm_flexed and standing_relaxed.
alter table specialization.measurements drop constraint if exists measurements_protocol_shape;
alter table specialization.measurements add constraint measurements_protocol_shape check (case when jsonb_typeof(protocol) = 'object' then coalesce(
    protocol - array['landmark', 'distanceFromLandmarkCm', 'posture', 'condition', 'device', 'timeOfDay'] = '{}'::jsonb
    and jsonb_typeof(protocol -> 'landmark') = 'string'
    and btrim(protocol ->> 'landmark') <> ''
    and case jsonb_typeof(protocol -> 'distanceFromLandmarkCm')
          when 'number' then (protocol ->> 'distanceFromLandmarkCm')::numeric >= 0
          when 'null' then true
          else protocol -> 'distanceFromLandmarkCm' is null
        end
    and jsonb_typeof(protocol -> 'posture') = 'string'
    and protocol ->> 'posture' in ('arm_relaxed_hanging', 'arm_extended_supported', 'elbow_90_supported', 'arm_flexed', 'standing_relaxed', 'other')
    and jsonb_typeof(protocol -> 'condition') = 'string'
    and protocol ->> 'condition' in ('unpumped', 'pumped', 'unknown')
    and coalesce(jsonb_typeof(protocol -> 'device'), 'null') in ('string', 'null')
    and case jsonb_typeof(protocol -> 'timeOfDay')
          when 'string' then protocol ->> 'timeOfDay' ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
          when 'null' then true
          else protocol -> 'timeOfDay' is null
        end,
    false) else false end);

-- What a goal may name. Its side is midline exactly in a midline region. A new goal, or one
-- moved to another muscle or movement, names a muscle its region lists as a target, or a
-- movement its region lists. A goal already stored on anything else (a muscle the region lists
-- as adjacent or external, or no longer lists) stays, and may only be ended (ends_on, with
-- updated_at) or deleted. Runs as the caller, so a signed-in user is checked against the
-- memberships RLS shows them.
create or replace function specialization.check_goal_target()
returns trigger
language plpgsql
set search_path = ''
as $fn$
declare
  v_offered boolean;
  v_side_model text;
begin
  if num_nonnulls(new.node_id, new.action_id) <> 1 then
    return new; -- goals_one_target refuses it
  end if;
  if new.node_id is not null then
    v_offered := exists (
      select 1 from specialization.region_nodes rn
      where rn.region_id = new.region_id and rn.node_id = new.node_id and rn.role = 'target' and rn.listed
    );
  else
    v_offered := exists (
      select 1 from specialization.region_actions ra
      where ra.region_id = new.region_id and ra.action_id = new.action_id and ra.listed
    );
  end if;

  if tg_op = 'UPDATE' and not v_offered
     and (new.region_id, new.node_id, new.action_id) is not distinct from (old.region_id, old.node_id, old.action_id) then
    if (new.user_id, new.id, new.side, new.metric, new.target, new.period, new.starts_on, new.timezone, new.created_at)
         is distinct from (old.user_id, old.id, old.side, old.metric, old.target, old.period, old.starts_on, old.timezone, old.created_at)
       or (new.ends_on is null and old.ends_on is not null) then
      raise exception 'goal % is on %, which region % no longer offers as a target; it can only be ended or deleted', new.id, coalesce(new.node_id, new.action_id), new.region_id
        using errcode = '23514';
    end if;
    return new;
  end if;

  if not v_offered then
    if new.node_id is not null then
      raise exception 'node % is not a listed target muscle of region %; a target names one of the region''s own target muscles', new.node_id, new.region_id
        using errcode = '23514';
    end if;
    raise exception 'action % is not a listed movement of region %', new.action_id, new.region_id
      using errcode = '23514';
  end if;

  if tg_op = 'INSERT' or (new.region_id, new.side) is distinct from (old.region_id, old.side) then
    select r.side_model into v_side_model from specialization.regions r where r.id = new.region_id;
    if new.side = 'midline' and v_side_model is distinct from 'midline' then
      raise exception 'region % is not midline: a goal there is for the left or the right side', new.region_id
        using errcode = '23514';
    end if;
    if new.side <> 'midline' and v_side_model = 'midline' then
      raise exception 'region % is midline: a goal there has side midline', new.region_id
        using errcode = '23514';
    end if;
  end if;
  return new;
end
$fn$;

create or replace trigger goals_check_target
  before insert or update on specialization.goals
  for each row execute function specialization.check_goal_target();

-- ---------------------------------------------------------------------------
-- 6. The publication rule and publishing, restated in full
-- ---------------------------------------------------------------------------

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
--   9. and it has at least one source;
--  10. every mapped muscle is a listed member of the version's region (region_nodes).
-- And, read only while the version is a draft (guard_mapping_version runs this from its
-- BEFORE UPDATE trigger, while the stored row is still a draft, so they bind every publish
-- from schema v2 on and never re-judge a version already published):
--  11. every mapped variant has the counting attributes its region's side model reads:
--      sided_by always; leg_laterality in a leg-paired region or where sided_by is leg;
--      side_anchor where a leg-paired region maps a unilateral or either leg variant, or
--      where sided_by is leg; and a mapping on a variant that does not use the region's limb
--      (not_applicable) counts on both sides (side_relation both);
--  12. every mapped muscle's home is the version's region: a region credits another region's
--      muscle as that region's own versions do, never through a mapping of its own.
-- Rules 8 and 9 mean a reviewed mapping never rests on a claim users cannot read or one
-- with no citation; once published, that claim and its sources are frozen with the version
-- (guard_published_claim, guard_published_claim_source: a reviewed claim of a mapped muscle).
-- Draft rows may be published with the version: they keep their source and the
-- pending-review label, users never see them, and no total counts them, so their node
-- action may still rest on a draft claim. Moving one to reviewed means a new version.
-- forearm_mappings_v1 was published before attributes existed and maps the biceps and
-- brachialis, whose home is the upper arm: it passes rules 1 to 10.
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
  publishing as (
    select v.region_id, r.side_limb
    from specialization.mapping_versions v
    join specialization.regions r on r.id = v.region_id
    where v.id = p_version_id and v.state = 'draft'
  ),
  counted as (
    select ev.variant_key, ev.laterality, p.side_limb,
           (select a.value from specialization.variant_attributes a where a.variant_key = ev.variant_key and a.dimension_id = 'sided_by') as sided_by,
           (select a.value from specialization.variant_attributes a where a.variant_key = ev.variant_key and a.dimension_id = 'leg_laterality') as leg_laterality,
           (select a.value from specialization.variant_attributes a where a.variant_key = ev.variant_key and a.dimension_id = 'side_anchor') as side_anchor
    from specialization.exercise_variants ev
    cross join publishing p
    where ev.variant_key in (select m.variant_key from m)
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
    union all
    select 10, 'mapped muscles the version''s region does not list: ' || string_agg(distinct m.node_id, ', ' order by m.node_id)
    from m
    where not exists (
      select 1 from specialization.region_nodes rn
      join specialization.mapping_versions v on v.region_id = rn.region_id
      where v.id = p_version_id and rn.node_id = m.node_id and rn.listed
    )
    having count(*) > 0
    union all
    select 11, 'mapped variants without the counting attributes their region reads: ' || string_agg(missing.variant_key || ' (' || missing.dimensions || ')', ', ' order by missing.variant_key)
    from (
      select c.variant_key, concat_ws(', ',
               case when c.sided_by is null then 'sided_by' end,
               case when c.leg_laterality is null and (c.side_limb = 'leg' or c.sided_by = 'leg') then 'leg_laterality' end,
               case when c.side_anchor is null
                         and ((c.side_limb = 'leg' and c.leg_laterality in ('unilateral', 'either')) or c.sided_by = 'leg') then 'side_anchor' end) as dimensions
      from counted c
    ) as missing
    where missing.dimensions <> ''
    having count(*) > 0
    union all
    select 11, 'mappings on a variant that does not use the region''s limb must count on both sides (side_relation both): ' || string_agg(m.mapping_key, ', ' order by m.mapping_key)
    from m
    join counted c on c.variant_key = m.variant_key
    where m.side_relation <> 'both'
      and ((c.side_limb = 'arm' and c.laterality = 'not_applicable') or (c.side_limb = 'leg' and c.leg_laterality = 'not_applicable'))
    having count(*) > 0
    union all
    select 12, 'mapped muscles whose home is another region: ' || string_agg(distinct m.node_id, ', ' order by m.node_id)
    from m
    join specialization.nodes n on n.id = m.node_id
    join publishing p on p.region_id <> n.region_id
    having count(*) > 0
  )
  select string_agg(problem, '; ' order by ord, problem) from listed
$fn$;

comment on function specialization.mapping_version_problems(uuid) is
  'The mapping-version publication rule: null when the version may be published, else the problems. Rules 11 and 12 are read only while the version is a draft. Enforced by the mapping_versions trigger; callable by the service role to check a draft first.';

-- Versions are created as drafts, may change while draft, are published once (when the
-- rule above passes), and may then only be retired. Published and retired versions are
-- never deleted. Publishing freezes the attributes of the variants it maps that exist at that
-- moment (variant_attributes.frozen_at).
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
      -- Lock what the version is about to rest on (the rows the guards in section 7b of
      -- schema v1 and the guards of schema v2 freeze), so a concurrent change to one of them
      -- either commits first, and the check below and the published version see it, or waits
      -- for this publish and is then refused by its guard. The region first: rule 11 reads its
      -- side model, which its guard freezes once this version is published.
      perform 1 from specialization.regions r where r.id = new.region_id for share;
      perform 1 from specialization.region_nodes rn
      where rn.region_id = new.region_id
        and rn.node_id in (select m.node_id from specialization.variant_mappings m where m.version_id = new.id)
      for share;
      perform 1 from specialization.variant_attributes va
      where va.variant_key in (select m.variant_key from specialization.variant_mappings m where m.version_id = new.id)
      for share;
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
      update specialization.variant_attributes va
      set frozen_at = pg_catalog.now()
      where va.frozen_at is null
        and va.variant_key in (select m.variant_key from specialization.variant_mappings m where m.version_id = new.id);
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

-- ---------------------------------------------------------------------------
-- 7. What a published version rests on, continued
-- ---------------------------------------------------------------------------

-- A region a published or retired version belongs to keeps what decides what counts there:
-- its status (a production region stays one), its side model and limb, its catalog keys and
-- its region-only tag scope. Its words, order and measures may change.
create or replace function specialization.guard_published_region()
returns trigger
language plpgsql
set search_path = ''
as $fn$
declare
  v_versions text;
begin
  if tg_op = 'UPDATE'
     and (new.id, new.status, new.side_model, new.side_limb, new.catalog_keys, new.region_only_tag_scope)
         is not distinct from (old.id, old.status, old.side_model, old.side_limb, old.catalog_keys, old.region_only_tag_scope) then
    return new;
  end if;
  select string_agg(v.version_key || ' (' || v.state || ')', ', ' order by v.version_key) into v_versions
  from specialization.mapping_versions v
  where v.region_id = old.id and v.state <> 'draft';
  if v_versions is not null then
    raise exception 'region % has mapping version %; its status, side model, limb, catalog keys and region-only tag scope, which decide what counts there, cannot change and it cannot be deleted', old.id, v_versions
      using errcode = '23514';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end
$fn$;

create or replace trigger regions_guard_published
  before update or delete on specialization.regions
  for each row execute function specialization.guard_published_region();

-- A membership a published or retired version of its region maps keeps its role and stays
-- listed, and is not deleted: rule 10 reads it, and the page lists and credits the muscle by
-- it. Its order and caveats may change, and a membership may always be added.
create or replace function specialization.guard_published_region_node()
returns trigger
language plpgsql
set search_path = ''
as $fn$
declare
  v_versions text;
begin
  if tg_op = 'UPDATE'
     and (new.region_id, new.node_id, new.role, new.listed) is not distinct from (old.region_id, old.node_id, old.role, old.listed) then
    return new;
  end if;
  select string_agg(label, ', ' order by label) into v_versions
  from (
    select distinct v.version_key || ' (' || v.state || ')' as label
    from specialization.variant_mappings m
    join specialization.mapping_versions v on v.id = m.version_id
    where m.node_id = old.node_id and v.region_id = old.region_id and v.state <> 'draft'
  ) as used;
  if v_versions is not null then
    raise exception 'node % is mapped in region % by mapping version %; its role there cannot change, it stays listed and it cannot leave the region', old.node_id, old.region_id, v_versions
      using errcode = '23514';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end
$fn$;

create or replace trigger region_nodes_guard_published
  before update or delete on specialization.region_nodes
  for each row execute function specialization.guard_published_region_node();

-- An attribute frozen by a publish (frozen_at set) is not changed or deleted; an update that
-- changes nothing passes. Until then it is free: an attribute added after a version was
-- published stays correctable until the next publish of a version that maps its variant. The
-- one write that sets frozen_at is that publish's: from null to a time, nothing else changed.
create or replace function specialization.guard_frozen_variant_attribute()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  if tg_op = 'UPDATE' and new is not distinct from old then
    return new;
  end if;
  if old.frozen_at is not null then
    raise exception 'attribute % of variant % is frozen: a published mapping version rests on it, so it cannot change or be deleted. Add the corrected variant under a new key and map it in a new version', old.dimension_id, old.variant_key
      using errcode = '23514';
  end if;
  if tg_op = 'UPDATE' and new.frozen_at is not null
     and (new.variant_key, new.dimension_id, new.value, new.notes) is distinct from (old.variant_key, old.dimension_id, old.value, old.notes) then
    raise exception 'attribute % of variant % is frozen as it stands: freezing sets frozen_at and nothing else', old.dimension_id, old.variant_key
      using errcode = '23514';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end
$fn$;

create or replace trigger variant_attributes_guard_frozen
  before update or delete on specialization.variant_attributes
  for each row execute function specialization.guard_frozen_variant_attribute();

-- TRUNCATE fires no row trigger: v1's function is generic (tg_table_name), so only triggers are added.
do $do$
declare
  t text;
begin
  foreach t in array array['region_nodes', 'variant_attributes'] loop
    execute format(
      'create or replace trigger %I before truncate on specialization.%I for each statement execute function specialization.refuse_truncate_while_published()',
      t || '_refuse_truncate', t
    );
  end loop;
end
$do$;

-- ---------------------------------------------------------------------------
-- 8. Row-level security
-- ---------------------------------------------------------------------------

do $do$
declare
  t text;
begin
  foreach t in array array['region_nodes', 'region_actions', 'variant_dimensions', 'variant_dimension_values', 'variant_attributes'] loop
    execute format('alter table specialization.%I enable row level security', t);
  end loop;

  -- Reference rows with nothing unreviewed about them, like exercise_variants.
  foreach t in array array['variant_dimensions', 'variant_dimension_values', 'variant_attributes'] loop
    execute format('drop policy if exists %I on specialization.%I', t || '_read', t);
    execute format('create policy %I on specialization.%I for select to authenticated using (true)', t || '_read', t);
  end loop;
end
$do$;

-- Unlisted rows are shown too, so a goal's key always resolves; readers filter on listed.
drop policy if exists region_nodes_read on specialization.region_nodes;
create policy region_nodes_read on specialization.region_nodes
  for select to authenticated using (
    exists (select 1 from specialization.nodes n where n.id = node_id and n.status = 'reviewed')
    and exists (select 1 from specialization.regions r where r.id = region_id and r.status in ('production', 'reference'))
  );

drop policy if exists region_actions_read on specialization.region_actions;
create policy region_actions_read on specialization.region_actions
  for select to authenticated using (
    exists (select 1 from specialization.regions r where r.id = region_id and r.status in ('production', 'reference'))
  );

-- ---------------------------------------------------------------------------
-- 9. Privileges: v1's loops ran before these objects existed, so each is named
-- ---------------------------------------------------------------------------

-- No default privileges are written (schema v1, section 9). TRUNCATE, TRIGGER and REFERENCES
-- are never granted: TRUNCATE would skip every row guard.
revoke all on
  specialization.region_nodes, specialization.region_actions,
  specialization.variant_dimensions, specialization.variant_dimension_values, specialization.variant_attributes
  from public, anon, authenticated, service_role;
grant select on
  specialization.region_nodes, specialization.region_actions,
  specialization.variant_dimensions, specialization.variant_dimension_values, specialization.variant_attributes
  to authenticated;
grant select, insert, update, delete on
  specialization.region_nodes, specialization.region_actions,
  specialization.variant_dimensions, specialization.variant_dimension_values, specialization.variant_attributes
  to service_role;

-- Postgres gives PUBLIC execute on every new function; trigger functions need no grant. The two
-- restated functions keep their ACL (create or replace does not change it): execute on
-- mapping_version_problems for the service role only.
revoke all on function
  specialization.check_region_sides(),
  specialization.check_region_node_role(),
  specialization.check_node_memberships(),
  specialization.check_goal_target(),
  specialization.guard_published_region(),
  specialization.guard_published_region_node(),
  specialization.guard_frozen_variant_attribute()
  from public, anon, authenticated, service_role;
