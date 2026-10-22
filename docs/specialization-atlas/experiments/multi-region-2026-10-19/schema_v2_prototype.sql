-- PROTOTYPE ONLY (scratch): what an additive ..._specialization_atlas_schema_v2.sql could hold.
-- Idempotent, no transaction control, nothing a function's EXECUTE cannot run.
-- The two function replacements (mapping_version_problems with rule 10, guard_mapping_version
-- with the new locks) are spliced in by exp2-schema-v2.ts from the v1 file's own text: a real
-- v2 file restates both functions in full.

-- ---------------------------------------------------------------------------
-- 1. A node in several regions, with a role per region
-- ---------------------------------------------------------------------------

create table if not exists specialization.region_nodes (
  region_id text not null references specialization.regions (id),
  node_id text not null references specialization.nodes (id),
  role text not null check (role in ('target', 'adjacent', 'external', 'group')),
  sort_order integer not null default 0,
  primary key (region_id, node_id)
);
create index if not exists region_nodes_node_idx on specialization.region_nodes (node_id);

comment on table specialization.region_nodes is
  'Which regions list a node, and its role in each (target, adjacent, external, group). Supersedes nodes.role for every reader; nodes.region_id stays the home region.';
comment on column specialization.nodes.role is
  'Legacy (v1): the role the node had in the content forearm_mappings_v1 was published from (upper_arm.biceps and upper_arm.brachialis: external). Frozen for mapped nodes; read region_nodes.role instead.';

-- Backfill exactly what the published and retired versions were published under: a mapped node
-- is a member of its version's region, with its own role there when it lives there, else
-- external. Derived only from frozen columns, so re-running it changes nothing.
insert into specialization.region_nodes (region_id, node_id, role, sort_order)
select distinct v.region_id, m.node_id,
       case when n.region_id = v.region_id then n.role else 'external' end,
       n.sort_order
from specialization.variant_mappings m
join specialization.mapping_versions v on v.id = m.version_id and v.state <> 'draft'
join specialization.nodes n on n.id = m.node_id
on conflict (region_id, node_id) do nothing;

create or replace function specialization.guard_published_region_node()
returns trigger
language plpgsql
set search_path = ''
as $fn$
declare
  v_versions text;
begin
  if tg_op = 'UPDATE'
     and (new.region_id, new.node_id, new.role) is not distinct from (old.region_id, old.node_id, old.role) then
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
    raise exception 'node % is mapped in region % by mapping version %; its role there cannot change and it cannot leave the region', old.node_id, old.region_id, v_versions
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

-- ---------------------------------------------------------------------------
-- 2. Execution dimensions other regions need, without touching frozen variant rows
-- ---------------------------------------------------------------------------

create table if not exists specialization.variant_dimensions (
  id text primary key check (id ~ '^[a-z][a-z0-9_]*$'),
  label text not null check (btrim(label) <> ''),
  sort_order integer not null default 0
);

create table if not exists specialization.variant_dimension_values (
  dimension_id text not null references specialization.variant_dimensions (id),
  value text not null check (value ~ '^[a-z0-9][a-z0-9_]*$'),
  label text not null check (btrim(label) <> ''),
  sort_order integer not null default 0,
  primary key (dimension_id, value)
);

create table if not exists specialization.variant_attributes (
  variant_key text not null references specialization.exercise_variants (variant_key),
  dimension_id text not null,
  value text not null,
  notes text,
  primary key (variant_key, dimension_id),
  constraint variant_attributes_value_listed foreign key (dimension_id, value)
    references specialization.variant_dimension_values (dimension_id, value)
);
create index if not exists variant_attributes_value_idx on specialization.variant_attributes (dimension_id, value);

-- A variant a published version maps keeps the attributes it has (an update that changes
-- nothing passes; notes may change); a new attribute may be added, since no published rule
-- reads one (if a later rule does, freeze inserts for the dimensions it reads too).
create or replace function specialization.guard_published_variant_attribute()
returns trigger
language plpgsql
set search_path = ''
as $fn$
declare
  v_versions text;
begin
  if tg_op = 'UPDATE'
     and (new.variant_key, new.dimension_id, new.value) is not distinct from (old.variant_key, old.dimension_id, old.value) then
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
    raise exception 'attribute % of variant % is used by mapping version %; it cannot change or be deleted', old.dimension_id, old.variant_key, v_versions
      using errcode = '23514';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end
$fn$;

create or replace trigger variant_attributes_guard_published
  before update or delete on specialization.variant_attributes
  for each row execute function specialization.guard_published_variant_attribute();

-- Region-neutral "does not apply" on the two forearm dimensions every variant must fill
-- (a squat has no forearm orientation). Widening validates the rows; it writes none.
alter table specialization.exercise_variants drop constraint if exists exercise_variants_forearm_orientation_check;
alter table specialization.exercise_variants add constraint exercise_variants_forearm_orientation_check
  check (forearm_orientation in ('supinated', 'neutral', 'pronated', 'changing', 'unknown', 'not_applicable'));
alter table specialization.exercise_variants drop constraint if exists exercise_variants_wrist_position_check;
alter table specialization.exercise_variants add constraint exercise_variants_wrist_position_check
  check (wrist_position in ('flexed', 'neutral', 'extended', 'changing', 'unknown', 'not_applicable'));

-- A goal on a muscle names one its region lists.
alter table specialization.goals drop constraint if exists goals_node_in_region;
alter table specialization.goals add constraint goals_node_in_region
  foreign key (region_id, node_id) references specialization.region_nodes (region_id, node_id);

-- TRUNCATE: the v1 function is generic (tg_table_name), so only triggers are added.
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
-- 3. RLS and privileges for the new tables and functions
-- ---------------------------------------------------------------------------

do $do$
declare
  t text;
begin
  foreach t in array array['region_nodes', 'variant_dimensions', 'variant_dimension_values', 'variant_attributes'] loop
    execute format('alter table specialization.%I enable row level security', t);
  end loop;
  foreach t in array array['variant_dimensions', 'variant_dimension_values', 'variant_attributes'] loop
    execute format('drop policy if exists %I on specialization.%I', t || '_read', t);
    execute format('create policy %I on specialization.%I for select to authenticated using (true)', t || '_read', t);
  end loop;
end
$do$;

drop policy if exists region_nodes_read on specialization.region_nodes;
create policy region_nodes_read on specialization.region_nodes
  for select to authenticated using (
    exists (select 1 from specialization.nodes n where n.id = node_id and n.status = 'reviewed')
    and exists (select 1 from specialization.regions r where r.id = region_id and r.status in ('production', 'reference'))
  );

revoke all on specialization.region_nodes, specialization.variant_dimensions, specialization.variant_dimension_values, specialization.variant_attributes
  from public, anon, authenticated, service_role;
grant select on specialization.region_nodes, specialization.variant_dimensions, specialization.variant_dimension_values, specialization.variant_attributes
  to authenticated;
grant select, insert, update, delete on specialization.region_nodes, specialization.variant_dimensions, specialization.variant_dimension_values, specialization.variant_attributes
  to service_role;

revoke all on function specialization.guard_published_region_node() from public, anon, authenticated, service_role;
revoke all on function specialization.guard_published_variant_attribute() from public, anon, authenticated, service_role;
