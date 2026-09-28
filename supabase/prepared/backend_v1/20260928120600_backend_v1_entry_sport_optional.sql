-- Backend V1 (PS-14; B019). PREPARED, NOT APPLIED: needs owner authorization (B009).
--
-- A general athlete has no sport, but every strength entry required one: the insert trigger
-- raised SPORT_REQUIRED unless the client sent a sport, and the client sent the browsing
-- fallback ("wrestling") for every athlete without one. The client now sends only a chosen
-- sport (batch 7), so the column becomes optional. An entry without a sport is not a sport
-- benchmark: the pool trigger removes and skips it instead of failing the insert.

alter table public.athlete_strength_entries alter column sport_id drop not null;

-- The live function, with the SPORT_REQUIRED check removed and nothing else changed.
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

-- The live function, with entries that have no sport kept out of the pool.
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
     or new.reps is null
     or new.sport_id is null then
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
