-- A local copy of the live objects the Backend V1 migrations touch, as they are in production
-- (definitions read from the live catalog on 28 September 2026: columns, policies, grants,
-- triggers and trigger functions). Everything else is a minimal stub. For validation only.
\set ON_ERROR_STOP on

create extension if not exists pgcrypto;
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;
create schema if not exists auth;
create schema if not exists private;
grant usage on schema public, auth to anon, authenticated, service_role;
grant usage on schema private to service_role;

-- Supabase's auth.uid(): the JWT subject of the current request.
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(coalesce(current_setting('request.jwt.claims', true), '{}')::jsonb ->> 'sub', '')::uuid
$$;
grant execute on function auth.uid() to anon, authenticated;

-- Stubs the live triggers read.
create table public.athlete_profiles (
  user_id uuid primary key,
  benchmark_subject_id uuid not null default gen_random_uuid(),
  benchmark_pool_opt_in boolean not null default false,
  default_bodyweight_kg numeric(7,3),
  date_of_birth date,
  declared_age_years numeric(5,2),
  sex_code smallint not null default 1,
  training_experience_years numeric(5,2),
  experience_level_code smallint not null default 0,
  primary_sport_id uuid
);
create table public.exercise_variants (id uuid primary key, parent_exercise_id uuid not null);
create table public.strength_exercise_scoring_policy (exercise_id uuid, load_semantics text, is_beta_enabled boolean default true, updated_at timestamptz default now());
create or replace function private.experience_level_from_years_v1(numeric) returns smallint language sql immutable as $$ select 0::smallint $$;
create table private.user_strength_benchmark_candidates (
  id uuid primary key default gen_random_uuid(),
  source_entry_id uuid not null unique,
  benchmark_subject_id uuid not null,
  exercise_id uuid not null,
  exercise_variant_id uuid,
  performed_on date not null,
  entry_type_code smallint not null,
  side_code smallint not null,
  load_kg numeric(10,4) not null,
  reps smallint not null,
  rir numeric(4,1),
  rpe numeric(4,1),
  load_semantics text not null,
  bodyweight_kg numeric(7,3) not null,
  age_years numeric(5,2) not null,
  sex_code smallint not null,
  sport_id uuid not null,
  verification_code smallint not null,
  consent_allowed boolean not null,
  pool_status_code smallint not null,
  active_for_percentiles boolean not null,
  quality_flags jsonb not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  training_experience_years numeric(5,2),
  experience_level_code smallint not null
);

-- The athlete tables, as live.
create table public.athlete_focus_areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  target_id uuid not null,
  intent_code text not null default 'build_capacity',
  laterality text not null default 'bilateral',
  priority smallint not null default 3,
  status text not null default 'active',
  effective_from date not null default current_date,
  effective_to date,
  provenance text not null default 'user_selected',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.athlete_focus_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  focus_area_id uuid not null references public.athlete_focus_areas(id) on delete cascade,
  observed_at timestamptz not null default now(),
  completion text,
  notes text,
  created_at timestamptz not null default now()
);
-- load_kg is GENERATED in production; a plain column here, which the live insert trigger fills
-- the same way, so the harness does not depend on a server version's generated-column rules.
create table public.athlete_strength_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  exercise_id uuid not null,
  exercise_variant_id uuid,
  performed_at timestamptz not null default now(),
  entry_type_code smallint not null default 1,
  source_code smallint not null default 1,
  side_code smallint not null default 0,
  reported_load_value numeric(9,3),
  reported_load_unit text default 'kg',
  load_kg numeric(10,4),
  reps smallint,
  rir numeric(4,1),
  rpe numeric(4,1),
  bodyweight_kg numeric(7,3) not null,
  age_years numeric(5,2) not null,
  sex_code smallint not null,
  sport_id uuid not null,
  load_semantics text not null default 'unknown',
  equipment_detail text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  training_experience_years numeric(5,2),
  experience_level_code smallint not null default 0,
  measurement_type text not null default 'loaded_reps',
  observation_payload jsonb not null default '{}'::jsonb,
  canonical_observation jsonb,
  measurement_resolver_version text,
  scoring_model_version text
);
create table public.athlete_strength_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  source_entry_id uuid not null references public.athlete_strength_entries(id) on delete cascade,
  previous_state_id uuid references public.athlete_strength_states(id),
  state_family text not null default 'capacity',
  state_type text not null default 'strength_genome_exercise_state',
  model_version text not null,
  observation_time timestamptz not null,
  effective_time timestamptz not null,
  computed_at timestamptz not null default now(),
  state_payload jsonb not null,
  validity_snapshot jsonb,
  created_at timestamptz not null default now()
);
create table public.app_exercise_source_mappings (
  id uuid primary key default gen_random_uuid(),
  local_catalog_id integer,
  supabase_exercise_id uuid not null,
  mapping_status text not null,
  mapping_method text not null
);
-- Two of the reference tables that carried write grants over a SELECT-only policy.
create table public.exercise_muscle_effect_priors (id uuid primary key default gen_random_uuid(), note text);
create table public.strength_norm_curve_aliases (id uuid primary key default gen_random_uuid(), note text);

alter table public.athlete_focus_areas enable row level security;
alter table public.athlete_focus_checkins enable row level security;
alter table public.athlete_strength_entries enable row level security;
alter table public.athlete_strength_states enable row level security;
alter table public.exercise_muscle_effect_priors enable row level security;
alter table public.strength_norm_curve_aliases enable row level security;
-- app_exercise_source_mappings: no RLS, no grant for anon/authenticated (as live).

-- Policies, as live.
create policy athlete_focus_areas_delete_own on public.athlete_focus_areas for delete to authenticated using ((select auth.uid()) = user_id);
create policy athlete_focus_areas_insert_own on public.athlete_focus_areas for insert to authenticated with check ((select auth.uid()) = user_id);
create policy athlete_focus_areas_select_own on public.athlete_focus_areas for select to authenticated using ((select auth.uid()) = user_id);
create policy athlete_focus_areas_update_own on public.athlete_focus_areas for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy athlete_focus_checkins_insert_own on public.athlete_focus_checkins for insert to authenticated with check ((select auth.uid()) = user_id);
create policy athlete_focus_checkins_select_own on public.athlete_focus_checkins for select to authenticated using ((select auth.uid()) = user_id);
create policy athlete_strength_entries_delete_own on public.athlete_strength_entries for delete to authenticated using ((select auth.uid()) = user_id);
create policy athlete_strength_entries_insert_own on public.athlete_strength_entries for insert to authenticated with check ((select auth.uid()) = user_id);
create policy athlete_strength_entries_select_own on public.athlete_strength_entries for select to authenticated using ((select auth.uid()) = user_id);
create policy athlete_strength_entries_update_own on public.athlete_strength_entries for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy athlete_strength_states_insert_own on public.athlete_strength_states for insert to authenticated with check ((select auth.uid()) = user_id);
create policy athlete_strength_states_select_own on public.athlete_strength_states for select to authenticated using ((select auth.uid()) = user_id);
create policy exercise_muscle_effect_priors_select on public.exercise_muscle_effect_priors for select to anon, authenticated using (true);
create policy strength_norm_curve_aliases_select on public.strength_norm_curve_aliases for select to anon, authenticated using (true);

-- Grants, as live.
grant all on public.athlete_focus_areas, public.athlete_focus_checkins, public.exercise_muscle_effect_priors, public.strength_norm_curve_aliases to anon, authenticated;
grant all on public.athlete_strength_entries, public.athlete_strength_states to authenticated;
grant select on public.athlete_profiles, public.exercise_variants, public.strength_exercise_scoring_policy to anon, authenticated;

-- Trigger functions and triggers, as live.
create or replace function private.set_updated_at() returns trigger language plpgsql set search_path to 'pg_catalog' as $$ begin new.updated_at := now(); return new; end; $$;

create or replace function private.prepare_athlete_strength_entry()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'private', 'auth'
as $function$
declare
  v_profile public.athlete_profiles%rowtype;
  v_policy_load_semantics text;
  v_variant_parent uuid;
  v_uid uuid;
begin
  v_uid := auth.uid();

  if v_uid is not null then
    new.user_id := v_uid;
  end if;

  select *
  into v_profile
  from public.athlete_profiles
  where user_id = new.user_id;

  if not found then
    raise exception 'ATHLETE_PROFILE_REQUIRED';
  end if;

  if new.exercise_variant_id is not null then
    select parent_exercise_id
    into v_variant_parent
    from public.exercise_variants
    where id = new.exercise_variant_id;

    if v_variant_parent is null then
      raise exception 'UNKNOWN_EXERCISE_VARIANT';
    end if;

    if v_variant_parent <> new.exercise_id then
      raise exception 'EXERCISE_VARIANT_PARENT_MISMATCH';
    end if;
  end if;

  if new.bodyweight_kg is null then
    new.bodyweight_kg := v_profile.default_bodyweight_kg;
  end if;

  if new.bodyweight_kg is null then
    raise exception 'BODYWEIGHT_REQUIRED';
  end if;

  if v_profile.date_of_birth is not null then
    new.age_years := round(
      ((new.performed_at::date - v_profile.date_of_birth)::numeric / 365.2425),
      2
    );
  elsif v_profile.declared_age_years is not null then
    new.age_years := v_profile.declared_age_years;
  else
    raise exception 'AGE_REQUIRED';
  end if;

  new.sex_code := v_profile.sex_code;
  new.training_experience_years := v_profile.training_experience_years;
  new.experience_level_code := coalesce(
    nullif(v_profile.experience_level_code,0),
    private.experience_level_from_years_v1(v_profile.training_experience_years),
    0
  );

  if new.sport_id is null then
    new.sport_id := v_profile.primary_sport_id;
  end if;

  if new.sport_id is null then
    raise exception 'SPORT_REQUIRED';
  end if;

  if new.reported_load_value is not null then
    new.load_kg := case lower(coalesce(new.reported_load_unit,'kg'))
      when 'kg' then new.reported_load_value
      when 'lb' then new.reported_load_value * 0.45359237
      else null
    end;
  elsif new.measurement_type='bodyweight_reps' then
    new.load_kg := 0;
  else
    new.load_kg := null;
  end if;

  select sep.load_semantics
  into v_policy_load_semantics
  from public.strength_exercise_scoring_policy sep
  where sep.exercise_id = new.exercise_id
  order by sep.is_beta_enabled desc, sep.updated_at desc
  limit 1;

  if new.measurement_type='weighted_bodyweight_reps' then
    new.load_semantics := 'additional_load';
  elsif new.measurement_type='bodyweight_reps' then
    new.load_semantics := 'bodyweight_reps';
  elsif v_policy_load_semantics is not null then
    new.load_semantics := v_policy_load_semantics;
  elsif new.load_semantics is null or btrim(new.load_semantics) = '' then
    new.load_semantics := 'unknown';
  end if;

  if new.observation_payload='{}'::jsonb then
    new.observation_payload :=
      case
        when new.measurement_type in ('loaded_reps','loaded_reps_estimate_only') then
          jsonb_strip_nulls(jsonb_build_object(
            'measurement_type',new.measurement_type,
            'load',new.reported_load_value,
            'unit',new.reported_load_unit,
            'reps',new.reps,
            'rir',new.rir,
            'rpe',new.rpe
          ))
        when new.measurement_type='bodyweight_reps' then
          jsonb_strip_nulls(jsonb_build_object(
            'measurement_type','bodyweight_reps',
            'reps',new.reps
          ))
        else '{}'::jsonb
      end;
  end if;

  new.observation_payload :=
    coalesce(new.observation_payload,'{}'::jsonb)
    || jsonb_build_object('age_years',new.age_years);

  new.measurement_resolver_version := coalesce(
    new.measurement_resolver_version,
    'strength_measurement_resolver_v1'
  );
  new.scoring_model_version := coalesce(
    new.scoring_model_version,
    'strength_beta_v2'
  );

  return new;
end;
$function$;

create or replace function private.sync_strength_benchmark_candidate()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'private'
as $function$
declare
  v_subject uuid;
  v_consent boolean;
begin
  if new.measurement_type not in ('loaded_reps','bodyweight_reps')
     or new.load_kg is null
     or new.reps is null then
    delete from private.user_strength_benchmark_candidates
    where source_entry_id=new.id;
    return new;
  end if;

  select benchmark_subject_id, benchmark_pool_opt_in
  into v_subject, v_consent
  from public.athlete_profiles
  where user_id = new.user_id;

  insert into private.user_strength_benchmark_candidates (
    source_entry_id, benchmark_subject_id, exercise_id, exercise_variant_id, performed_on,
    entry_type_code, side_code, load_kg, reps, rir, rpe, load_semantics, bodyweight_kg,
    age_years, sex_code, sport_id, training_experience_years, experience_level_code,
    verification_code, consent_allowed, pool_status_code, active_for_percentiles,
    quality_flags, created_at, updated_at
  )
  values (
    new.id, v_subject, new.exercise_id, new.exercise_variant_id, new.performed_at::date,
    new.entry_type_code, new.side_code, new.load_kg, new.reps, new.rir, new.rpe,
    new.load_semantics, new.bodyweight_kg, new.age_years, new.sex_code, new.sport_id,
    new.training_experience_years, new.experience_level_code,
    case when new.source_code in (2,4) then 2 when new.source_code = 3 then 3 else 1 end,
    coalesce(v_consent,false), 0, false, '[]'::jsonb, now(), now()
  )
  on conflict (source_entry_id) do update set
    benchmark_subject_id = excluded.benchmark_subject_id,
    exercise_id = excluded.exercise_id,
    exercise_variant_id = excluded.exercise_variant_id,
    performed_on = excluded.performed_on,
    entry_type_code = excluded.entry_type_code,
    side_code = excluded.side_code,
    load_kg = excluded.load_kg,
    reps = excluded.reps,
    rir = excluded.rir,
    rpe = excluded.rpe,
    load_semantics = excluded.load_semantics,
    bodyweight_kg = excluded.bodyweight_kg,
    age_years = excluded.age_years,
    sex_code = excluded.sex_code,
    sport_id = excluded.sport_id,
    training_experience_years = excluded.training_experience_years,
    experience_level_code = excluded.experience_level_code,
    verification_code = excluded.verification_code,
    consent_allowed = excluded.consent_allowed,
    updated_at = now();

  return new;
end;
$function$;

create trigger athlete_strength_entries_prepare before insert on public.athlete_strength_entries for each row execute function private.prepare_athlete_strength_entry();
create trigger athlete_strength_entries_set_updated_at before update on public.athlete_strength_entries for each row execute function private.set_updated_at();
create trigger athlete_strength_entries_sync_benchmark_candidate after insert or update on public.athlete_strength_entries for each row execute function private.sync_strength_benchmark_candidate();
