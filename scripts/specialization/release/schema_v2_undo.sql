-- Undo of schema v2 (supabase/migrations/20261019120000_specialization_atlas_schema_v2.sql),
-- valid only before seed v3 is recorded (docs/specialization-atlas/10-multi-region.md §5.4;
-- 04-database.md §10). Not a migration: it is kept here, not in supabase/migrations, and run by
-- hand with the Supabase MCP execute_sql (one call), only if wave 0 has to come out of
-- production.
--
-- One DO block, so one transaction. It refuses, changing nothing, while any specialization
-- migration after seed v2 is recorded in supabase_migrations.schema_migrations (from seed v3 on
-- the database is forward-only: published versions rest on what schema v2 added), while any
-- variant uses not_applicable (v1's checks refuse it), while a version other than
-- forearm_mappings_v1 is published or any attribute is frozen (a publish under schema v2, by a
-- seed or by hand, rests on it), or while a goal names a muscle or movement that schema v2,
-- applied again, would not list before it adds the goals' keys. Otherwise it restores v1's
-- mapping_version_problems and guard_mapping_version as v1 wrote them; drops the five tables
-- (memberships, region actions, dimensions, values and attributes, with their rows), the
-- columns, constraints and triggers schema v2 added to v1's tables, and the functions it
-- created; restores v1's checks, v1's goals_no_overlap as v1 wrote it (keyed on the side again;
-- goals that schema v2's rule, which ignores the side, allows never clash under it) and v1's
-- comments; and deletes the schema_migrations rows of schema v2 and seed v2, so the apply tool
-- takes both again.
--
-- Its limit: what seed v2 wrote to v1's tables stays: the rows it added (an action, a variant)
-- and the one value it rewrote, the forearm's progress_subtitle ("Circumference and grip", no
-- longer "..., by arm"). They are valid under v1, and seed v2 applied again finds them in
-- place. A goal or measurement only schema v2 allows (side midline, girth_cm, a new posture)
-- makes a restored check fail, and the undo with it; production holds none.
--
-- Tested (server/specializationSchemaV2.test.ts › the undo): schema v1, seed v1, schema v2 and
-- the current seed, then this, give the database schema v1 and seed v1 gave, catalog and rows
-- table by table (goals_no_overlap and the side columns' comments included), a goal on a
-- forearm muscle and movement kept; schema v2 and the current seed then apply again; it refuses
-- after seed v3 is recorded, while a variant uses not_applicable, after a publish under schema
-- v2, and while a goal names what schema v2 would not list.
do $undo$
declare
  v_later text;
  v_variants text;
  v_versions text;
  v_goals text;
begin
  select string_agg(m.version || ' ' || m.name, ', ' order by m.version) into v_later
  from supabase_migrations.schema_migrations m
  where m.name like 'specialization\_atlas\_%' and m.version > '20261019120100';
  if v_later is not null then
    raise exception 'schema v2 cannot be undone: % is recorded, and from seed v3 on the specialization schema is forward-only', v_later
      using errcode = '55000';
  end if;
  select string_agg(ev.variant_key, ', ' order by ev.variant_key) into v_variants
  from specialization.exercise_variants ev
  where 'not_applicable' in (ev.laterality, ev.forearm_orientation, ev.wrist_position);
  if v_variants is not null then
    raise exception 'schema v2 cannot be undone: variants % use not_applicable, which schema v1''s checks refuse', v_variants
      using errcode = '55000';
  end if;
  -- A version published under schema v2 rests on rules 10 to 12, its memberships and its frozen
  -- attributes, however it was published (a seed, or by hand): the undo would drop them under it.
  -- forearm_mappings_v1 was published before schema v2. (Read only where schema v2's tables are.)
  select string_agg(v.version_key || ' (' || v.state || ')', ', ' order by v.version_key) into v_versions
  from specialization.mapping_versions v
  where v.state <> 'draft' and v.version_key <> 'forearm_mappings_v1';
  if v_versions is null and pg_catalog.to_regclass('specialization.variant_attributes') is not null then
    select 'attributes of ' || string_agg(distinct a.variant_key, ', ' order by a.variant_key) into v_versions
    from specialization.variant_attributes a
    where a.frozen_at is not null;
  end if;
  if v_versions is not null then
    raise exception 'schema v2 cannot be undone: a version published under it rests on what it added (%)', v_versions
      using errcode = '55000';
  end if;
  -- A goal names its membership and region action by key, and schema v2 applied again writes back
  -- only the memberships of published versions and the forearm's 20 actions before it adds those
  -- keys; a goal on anything else would make that apply fail.
  select string_agg(g.id, ', ' order by g.id) into v_goals
  from specialization.goals g
  where (g.node_id is not null and not exists (
          select 1 from specialization.variant_mappings m
          join specialization.mapping_versions v on v.id = m.version_id and v.state <> 'draft'
          where v.region_id = g.region_id and m.node_id = g.node_id))
     or (g.action_id is not null and not (g.region_id = 'forearm' and g.action_id = any (array[
          'elbow.flexion', 'elbow.extension', 'forearm.pronation', 'forearm.supination', 'wrist.flexion', 'wrist.extension',
          'wrist.radial_deviation', 'wrist.ulnar_deviation', 'fingers.mcp_flexion', 'fingers.pip_flexion', 'fingers.dip_flexion',
          'fingers.extension', 'little_finger.extension', 'index_finger.extension', 'thumb.ip_flexion', 'thumb.cmc_abduction',
          'thumb.mcp_extension', 'thumb.ip_extension', 'hand.palmar_aponeurosis_tension', 'forearm.distal_radioulnar_stabilization'
        ])));
  if v_goals is not null then
    raise exception 'schema v2 cannot be undone: goals % name a muscle or movement that schema v2, applied again, would not list first, so it could not be applied again', v_goals
      using errcode = '55000';
  end if;

  -- v1's publication rule and publishing, byte for byte as v1 wrote them (so not indented).
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

  -- Triggers schema v2 put on v1's tables, then its own tables (their triggers, policies and
  -- grants go with them), then its functions.
  drop trigger if exists regions_sides_shape on specialization.regions;
  drop trigger if exists regions_guard_published on specialization.regions;
  drop trigger if exists nodes_check_memberships on specialization.nodes;
  drop trigger if exists goals_check_target on specialization.goals;
  alter table specialization.goals drop constraint if exists goals_node_in_region;
  alter table specialization.goals drop constraint if exists goals_action_in_region;
  drop table if exists specialization.variant_attributes;
  drop table if exists specialization.variant_dimension_values;
  drop table if exists specialization.variant_dimensions;
  drop table if exists specialization.region_actions;
  drop table if exists specialization.region_nodes;
  drop function if exists specialization.check_region_sides();
  drop function if exists specialization.check_region_node_role();
  drop function if exists specialization.check_node_memberships();
  drop function if exists specialization.check_goal_target();
  drop function if exists specialization.guard_published_region();
  drop function if exists specialization.guard_published_region_node();
  drop function if exists specialization.guard_frozen_variant_attribute();

  -- Columns (their checks go with them), and v1's checks back as v1 wrote them.
  alter table specialization.regions
    drop column if exists side_model,
    drop column if exists side_limb,
    drop column if exists side_word,
    drop column if exists side_word_plural,
    drop column if exists catalog_keys,
    drop column if exists region_only_tag_scope,
    drop column if exists external_heading,
    drop column if exists measurement_defaults,
    drop column if exists on_side_template;
  alter table specialization.diagram_assets drop column if exists sides;
  alter table specialization.regions drop constraint if exists regions_measurement_metrics_check;
  alter table specialization.regions add constraint regions_measurement_metrics_check
    check (measurement_metrics <@ array['circumference_cm', 'grip_force_n']::text[]);
  alter table specialization.variant_mappings drop column if exists side_relation;
  alter table specialization.exercise_variants drop constraint if exists exercise_variants_laterality_check;
  alter table specialization.exercise_variants add constraint exercise_variants_laterality_check
    check (laterality in ('bilateral', 'unilateral', 'either'));
  alter table specialization.exercise_variants drop constraint if exists exercise_variants_forearm_orientation_check;
  alter table specialization.exercise_variants add constraint exercise_variants_forearm_orientation_check
    check (forearm_orientation in ('supinated', 'neutral', 'pronated', 'changing', 'unknown'));
  alter table specialization.exercise_variants drop constraint if exists exercise_variants_wrist_position_check;
  alter table specialization.exercise_variants add constraint exercise_variants_wrist_position_check
    check (wrist_position in ('flexed', 'neutral', 'extended', 'changing', 'unknown'));
  alter table specialization.goals drop constraint if exists goals_side_check;
  alter table specialization.goals add constraint goals_side_check check (side in ('left', 'right'));
  alter table specialization.goals drop constraint if exists goals_no_overlap;
  alter table specialization.goals add constraint goals_no_overlap exclude using gist (
    user_id with =,
    region_id with =,
    (coalesce('node:' || node_id, 'action:' || action_id)) with =,
    side with =,
    metric with =,
    period with =,
    daterange(starts_on, ends_on, '[]') with &&
  );
  comment on column specialization.goals.side is null;
  comment on column specialization.measurements.side is null;
  alter table specialization.measurements drop constraint if exists measurements_side_metric;
  alter table specialization.measurements drop constraint if exists measurements_side_check;
  alter table specialization.measurements add constraint measurements_side_check check (side in ('left', 'right'));
  alter table specialization.measurements drop constraint if exists measurements_metric_check;
  alter table specialization.measurements add constraint measurements_metric_check check (metric in ('circumference_cm', 'grip_force_n'));
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
    and protocol ->> 'posture' in ('arm_relaxed_hanging', 'arm_extended_supported', 'elbow_90_supported', 'other')
    and jsonb_typeof(protocol -> 'condition') = 'string'
    and protocol ->> 'condition' in ('unpumped', 'pumped', 'unknown')
    and coalesce(jsonb_typeof(protocol -> 'device'), 'null') in ('string', 'null')
    and case jsonb_typeof(protocol -> 'timeOfDay')
          when 'string' then protocol ->> 'timeOfDay' ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
          when 'null' then true
          else protocol -> 'timeOfDay' is null
        end,
    false) else false end);
  comment on column specialization.nodes.role is null;
  comment on column specialization.nodes.sort_order is null;
  comment on column specialization.actions.sort_order is null;

  delete from supabase_migrations.schema_migrations where version in ('20261019120000', '20261019120100');
end
$undo$;
