-- Musculoskeletal Capacity & Injury Resilience (v2) — foundation.
--
-- Covers checklist items `model_context_focus_constraints` and the schema half of
-- `build_resilience_taxonomy`. Additive only:
--   * save_athlete_profile_v2 is kept and unchanged (legacy sport-mode clients).
--   * app_my_athlete_profile_v1 is kept and unchanged (versioned client contract).
--   * injury_resilience_recommendations is kept and unchanged; its sport_id NOT NULL
--     constraint is what stops sport evidence from silently becoming general evidence.
--
-- Private athlete rows are owner-scoped with the same four-policy RLS shape already used by
-- athlete_profiles and athlete_strength_entries. Reference rows stay public-read.

-- ---------------------------------------------------------------------------
-- 1. Context mode: sport participation is optional context, never a fake sport.
-- ---------------------------------------------------------------------------

alter table public.athlete_profiles
  add column if not exists sport_context_mode text not null default 'undecided';

alter table public.athlete_profiles
  drop constraint if exists athlete_profiles_sport_context_mode_check;
alter table public.athlete_profiles
  add constraint athlete_profiles_sport_context_mode_check
  check (sport_context_mode in ('sport','general','undecided'));

-- A mode and a sport ID can never disagree. NULL is never silently "general".
alter table public.athlete_profiles
  drop constraint if exists athlete_profiles_mode_sport_agreement_check;
alter table public.athlete_profiles
  add constraint athlete_profiles_mode_sport_agreement_check
  check (
    (sport_context_mode = 'sport' and primary_sport_id is not null)
    or (sport_context_mode in ('general','undecided') and primary_sport_id is null)
  );

comment on column public.athlete_profiles.sport_context_mode is
  'Explicit context state: sport | general | undecided. General and undecided are real states with a NULL primary_sport_id and are never implemented as a synthetic sport record.';

-- ---------------------------------------------------------------------------
-- 2. Canonical capacity/constraint taxonomy.
-- ---------------------------------------------------------------------------

create table if not exists public.resilience_targets (
  id uuid primary key default gen_random_uuid(),
  target_key text not null unique,
  name text not null,
  region text not null,
  target_type text not null check (target_type in ('body_region','functional_task','movement_pattern','tissue_system')),
  parent_target_id uuid references public.resilience_targets(id) on delete restrict,
  laterality_supported boolean not null default true,
  movement_pattern_id uuid references public.movement_patterns(id) on delete set null,
  status text not null default 'active' check (status in ('active','review','retired')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.resilience_targets is
  'Governed catalog of selectable capacity/function targets. A target is a positive goal object; it carries no diagnosis and no symptom meaning.';

create table if not exists public.resilience_presentation_types (
  id uuid primary key default gen_random_uuid(),
  presentation_key text not null unique,
  label text not null,
  description text,
  requires_clinician_context boolean not null default false,
  created_at timestamptz not null default now()
);

-- Non-destructive mapping of the 51 injury_region strings and 113 injury_or_constraint
-- strings already in the research tables. Source strings are never rewritten.
create table if not exists public.resilience_target_aliases (
  id uuid primary key default gen_random_uuid(),
  alias text not null,
  source_relation text not null check (source_relation in ('injury_resilience_recommendations.injury_region','injury_resilience_recommendations.injury_or_constraint','injury_constraints.injury_or_constraint','manual')),
  target_id uuid references public.resilience_targets(id) on delete restrict,
  presentation_type_id uuid references public.resilience_presentation_types(id) on delete restrict,
  review_status text not null default 'unresolved' check (review_status in ('unresolved','mapped','ambiguous','out_of_scope')),
  reviewer_note text,
  created_at timestamptz not null default now(),
  unique (alias, source_relation)
);

comment on table public.resilience_target_aliases is
  'Reviewable alias map. An unresolved or ambiguous row stays in the queue rather than being force-mapped; destructive inference is prohibited.';

create index if not exists resilience_target_aliases_review_idx
  on public.resilience_target_aliases (review_status) where review_status <> 'mapped';

-- Sport-agnostic evidence lives in its own relation. It has no sport_id column at all, so a
-- sport-derived row cannot be relabelled as general by setting a column to NULL.
create table if not exists public.resilience_recommendations_general (
  id uuid primary key default gen_random_uuid(),
  target_id uuid not null references public.resilience_targets(id) on delete restrict,
  presentation_type_id uuid references public.resilience_presentation_types(id) on delete restrict,
  exercise_id uuid references public.exercises(id) on delete restrict,
  intervention_component text not null,
  target_population text,
  evidence_type text not null,
  evidence_directness text not null default 'indirect',
  outcome_metric text,
  effect_value numeric,
  effect_size numeric,
  duration_weeks numeric,
  sessions_per_week numeric,
  dose_summary text,
  confidence_score numeric check (confidence_score >= 0 and confidence_score <= 1),
  source_study_id uuid not null references public.studies(id) on delete restrict,
  source_text text,
  rationale text,
  limitations text,
  review_status text not null default 'draft' check (review_status in ('draft','approved','rejected')),
  created_at timestamptz not null default now()
);

comment on table public.resilience_recommendations_general is
  'General and presentation-matched resilience routes. Rows are authored from source review; a sport-derived row may never be copied here merely to make it reusable. Only review_status = approved is app-visible.';

-- ---------------------------------------------------------------------------
-- 3. Private athlete context: targets, constraints, response.
-- ---------------------------------------------------------------------------

create table if not exists public.athlete_focus_areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  target_id uuid not null references public.resilience_targets(id) on delete restrict,
  intent_code text not null default 'build_capacity'
    check (intent_code in ('build_capacity','improve_function','maintain_capacity')),
  laterality text not null default 'bilateral'
    check (laterality in ('bilateral','left','right','unspecified')),
  priority smallint not null default 3 check (priority between 1 and 5),
  status text not null default 'active' check (status in ('active','paused','achieved','removed')),
  effective_from date not null default current_date,
  effective_to date,
  provenance text not null default 'user_selected'
    check (provenance in ('user_selected','coach_selected','imported')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (effective_to is null or effective_to >= effective_from)
);

comment on table public.athlete_focus_areas is
  'Positive capacity/function targets, independent of sport. Selecting a region here carries no symptom or diagnosis meaning.';

create index if not exists athlete_focus_areas_user_active_idx
  on public.athlete_focus_areas (user_id, status) where status = 'active';

create table if not exists public.athlete_training_constraints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  target_id uuid not null references public.resilience_targets(id) on delete restrict,
  constraint_type text not null check (constraint_type in ('proactive_none','symptomatic','recent_or_returning','prior_recurrent','clinician_restricted')),
  laterality text not null default 'unspecified'
    check (laterality in ('bilateral','left','right','unspecified')),
  severity_or_irritability smallint check (severity_or_irritability between 0 and 10),
  aggravating_context text,
  clinician_restriction text,
  user_reported_diagnosis text,
  status text not null default 'active' check (status in ('active','resolved','expired','superseded')),
  effective_from date not null default current_date,
  effective_to date,
  reconfirm_due_on date,
  provenance text not null default 'user_reported'
    check (provenance in ('user_reported','clinician_reported','coach_reported')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (effective_to is null or effective_to >= effective_from)
);

comment on table public.athlete_training_constraints is
  'What the plan must work around. Always user- or clinician-reported, never inferred from a selected focus area. system inference is stored elsewhere and displayed separately.';

create index if not exists athlete_training_constraints_user_active_idx
  on public.athlete_training_constraints (user_id, status) where status = 'active';

create table if not exists public.athlete_focus_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  focus_area_id uuid not null references public.athlete_focus_areas(id) on delete cascade,
  observed_at timestamptz not null default now(),
  completion text check (completion in ('completed','partial','missed')),
  function_or_load_tolerance smallint check (function_or_load_tolerance between 0 and 10),
  symptom_response smallint check (symptom_response between 0 and 10),
  next_day_response smallint check (next_day_response between 0 and 10),
  confidence smallint check (confidence between 0 and 10),
  rule_version text,
  notes text,
  created_at timestamptz not null default now()
);

comment on table public.athlete_focus_checkins is
  'Immutable response observations. Function/load tolerance is recorded separately from symptoms and adherence; NULL means not reported and is never read as success. Rows are insert-only: a correction is a new row, so a changed decision never rewrites history.';

create index if not exists athlete_focus_checkins_focus_observed_idx
  on public.athlete_focus_checkins (focus_area_id, observed_at desc);

-- ---------------------------------------------------------------------------
-- 4. RLS.
-- ---------------------------------------------------------------------------

alter table public.athlete_focus_areas enable row level security;
alter table public.athlete_training_constraints enable row level security;
alter table public.athlete_focus_checkins enable row level security;
alter table public.resilience_targets enable row level security;
alter table public.resilience_presentation_types enable row level security;
alter table public.resilience_target_aliases enable row level security;
alter table public.resilience_recommendations_general enable row level security;

do $$
declare t text;
begin
  foreach t in array array['athlete_focus_areas','athlete_training_constraints'] loop
    execute format('drop policy if exists %I on public.%I', t || '_select_own', t);
    execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t || '_select_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert_own', t);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t || '_insert_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_own', t);
    execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t || '_update_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_own', t);
    execute format('create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t || '_delete_own', t);
  end loop;
end $$;

-- Check-ins are insert-and-read only. No update or delete policy exists, so an observation
-- cannot be rewritten by a later decision.
drop policy if exists athlete_focus_checkins_select_own on public.athlete_focus_checkins;
create policy athlete_focus_checkins_select_own on public.athlete_focus_checkins
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists athlete_focus_checkins_insert_own on public.athlete_focus_checkins;
create policy athlete_focus_checkins_insert_own on public.athlete_focus_checkins
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- Reference catalogs are readable by any signed-in client; writes stay with the service role.
do $$
declare t text;
begin
  foreach t in array array['resilience_targets','resilience_presentation_types','resilience_target_aliases','resilience_recommendations_general'] loop
    execute format('drop policy if exists %I on public.%I', t || '_read', t);
    execute format('create policy %I on public.%I for select to authenticated using (true)', t || '_read', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 5. Versioned app contracts.
-- ---------------------------------------------------------------------------

-- Successor to app_my_athlete_profile_v1, which stays untouched for existing clients.
create or replace view public.app_my_athlete_profile_v2
with (security_invoker = true) as
select
  user_id,
  sport_context_mode,
  date_of_birth,
  declared_age_years,
  sex_code,
  primary_sport_id,
  default_bodyweight_kg,
  benchmark_pool_opt_in,
  training_experience_years,
  experience_level_code,
  created_at,
  updated_at
from public.athlete_profiles;

create or replace view public.app_resilience_target_catalog_v1
with (security_invoker = true) as
select
  t.id as target_id,
  t.target_key,
  t.name,
  t.region,
  t.target_type,
  t.laterality_supported,
  coalesce(
    (select array_agg(distinct a.alias order by a.alias)
       from public.resilience_target_aliases a
      where a.target_id = t.id and a.review_status = 'mapped'),
    '{}'::text[]
  ) as aliases,
  array_remove(array[
    case when exists (
      select 1 from public.resilience_recommendations_general g
       where g.target_id = t.id and g.review_status = 'approved'
         and g.presentation_type_id is null
    ) then 'general' end,
    case when exists (
      select 1 from public.resilience_recommendations_general g
       where g.target_id = t.id and g.review_status = 'approved'
         and g.presentation_type_id is not null
    ) then 'presentation_matched' end,
    case when exists (
      select 1 from public.resilience_target_aliases a
        join public.injury_resilience_recommendations r
          on r.injury_region = a.alias
       where a.target_id = t.id and a.review_status = 'mapped'
    ) then 'sport_specific' end
  ], null) as supported_routes
from public.resilience_targets t
where t.status = 'active';

comment on view public.app_resilience_target_catalog_v1 is
  'Selectable targets for onboarding and settings. supported_routes is empty when no reviewed evidence route covers the target, which is the signal for the insufficiency state rather than a borrowed recommendation.';

-- One read surface, three explicitly labelled routes. A sport-scoped row can only ever surface
-- as route_type = sport_specific because it comes from a relation that requires a sport_id.
create or replace view public.app_resilience_recommendations_v2
with (security_invoker = true) as
select
  g.id as recommendation_id,
  case when g.presentation_type_id is null then 'general' else 'presentation_matched' end as route_type,
  null::uuid as sport_id,
  g.target_id,
  p.presentation_key as presentation_type,
  g.exercise_id,
  g.intervention_component,
  g.dose_summary as dose,
  g.target_population as population,
  g.evidence_directness,
  g.confidence_score as confidence,
  g.limitations,
  'resilience_recommendations_general'::text as provenance
from public.resilience_recommendations_general g
left join public.resilience_presentation_types p on p.id = g.presentation_type_id
where g.review_status = 'approved'
union all
select
  r.id as recommendation_id,
  'sport_specific'::text as route_type,
  r.sport_id,
  a.target_id,
  r.injury_or_constraint as presentation_type,
  r.exercise_id,
  r.intervention_component,
  r.dose_summary as dose,
  r.target_population as population,
  r.evidence_type as evidence_directness,
  r.confidence_score as confidence,
  r.limitations,
  'injury_resilience_recommendations'::text as provenance
from public.injury_resilience_recommendations r
join public.resilience_target_aliases a
  on a.alias = r.injury_region
 and a.source_relation = 'injury_resilience_recommendations.injury_region'
 and a.review_status = 'mapped';

comment on view public.app_resilience_recommendations_v2 is
  'Unified read of resilience evidence with an explicit route_type. sport_specific rows keep their sport_id and are only applicable in sport mode; they are never served as general evidence.';

-- Reviewable queue of strings that are not yet mapped to a canonical target.
create or replace view public.resilience_target_alias_review_v1
with (security_invoker = true) as
select alias, source_relation, review_status, reviewer_note, created_at
from public.resilience_target_aliases
where review_status <> 'mapped';

-- ---------------------------------------------------------------------------
-- 6. save_athlete_profile_v3 — sport-optional write path.
-- v2 is intentionally left in place and still raises SPORT_REQUIRED.
-- ---------------------------------------------------------------------------

create or replace function public.save_athlete_profile_v3(
  p_sex_code smallint,
  p_sport_context_mode text,
  p_default_bodyweight_kg numeric,
  p_primary_sport_id uuid default null,
  p_date_of_birth date default null,
  p_declared_age_years numeric default null,
  p_training_experience_years numeric default null,
  p_experience_level_code smallint default null,
  p_benchmark_pool_opt_in boolean default false
)
returns public.athlete_profiles
language plpgsql
set search_path to 'pg_catalog','public','private'
as $function$
declare
  v_uid uuid;
  v_row public.athlete_profiles;
  v_exp_code smallint;
begin
  v_uid := auth.uid();
  if v_uid is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if p_sex_code not in (0,1,2,3) then raise exception 'INVALID_SEX_CODE'; end if;

  if p_sport_context_mode is null or p_sport_context_mode not in ('sport','general','undecided') then
    raise exception 'INVALID_SPORT_CONTEXT_MODE';
  end if;

  -- A sport ID is required only in sport mode. General and undecided must not carry one,
  -- so a sport can never be implied for a user who did not choose it.
  if p_sport_context_mode = 'sport' and p_primary_sport_id is null then
    raise exception 'SPORT_REQUIRED_FOR_SPORT_MODE';
  end if;
  if p_sport_context_mode in ('general','undecided') and p_primary_sport_id is not null then
    raise exception 'SPORT_NOT_ALLOWED_FOR_MODE';
  end if;

  if p_default_bodyweight_kg is null or p_default_bodyweight_kg <= 0 then raise exception 'BODYWEIGHT_REQUIRED'; end if;
  if p_date_of_birth is null and p_declared_age_years is null then raise exception 'AGE_OR_DATE_OF_BIRTH_REQUIRED'; end if;
  if p_date_of_birth is not null and p_date_of_birth > current_date then raise exception 'INVALID_DATE_OF_BIRTH'; end if;
  if p_training_experience_years is not null and (p_training_experience_years < 0 or p_training_experience_years > 80) then
    raise exception 'INVALID_TRAINING_EXPERIENCE_YEARS';
  end if;
  if p_experience_level_code is not null and p_experience_level_code not between 0 and 5 then
    raise exception 'INVALID_EXPERIENCE_LEVEL_CODE';
  end if;

  if p_training_experience_years is not null then
    v_exp_code := private.experience_level_from_years_v1(p_training_experience_years);
    if p_experience_level_code is not null and p_experience_level_code <> v_exp_code then
      raise exception 'EXPERIENCE_LEVEL_MISMATCH';
    end if;
  else
    v_exp_code := coalesce(p_experience_level_code,0);
  end if;

  insert into public.athlete_profiles(
    user_id,date_of_birth,declared_age_years,sex_code,sport_context_mode,primary_sport_id,
    default_bodyweight_kg,training_experience_years,experience_level_code,benchmark_pool_opt_in
  )
  values(
    v_uid,p_date_of_birth,p_declared_age_years,p_sex_code,p_sport_context_mode,p_primary_sport_id,
    p_default_bodyweight_kg,p_training_experience_years,v_exp_code,coalesce(p_benchmark_pool_opt_in,false)
  )
  on conflict (user_id) do update set
    date_of_birth=excluded.date_of_birth,
    declared_age_years=excluded.declared_age_years,
    sex_code=excluded.sex_code,
    sport_context_mode=excluded.sport_context_mode,
    primary_sport_id=excluded.primary_sport_id,
    default_bodyweight_kg=excluded.default_bodyweight_kg,
    training_experience_years=excluded.training_experience_years,
    experience_level_code=excluded.experience_level_code,
    benchmark_pool_opt_in=excluded.benchmark_pool_opt_in,
    updated_at=now()
  returning * into v_row;

  return v_row;
end;
$function$;

comment on function public.save_athlete_profile_v3 is
  'Sport-optional canonical profile write path. save_athlete_profile_v2 remains available and unchanged for legacy sport-mode clients.';
