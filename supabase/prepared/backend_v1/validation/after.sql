\set ON_ERROR_STOP on
-- After the Backend V1 migrations: each hole is closed, and the legitimate paths still work.

-- SB-07
begin;
set local role anon;
do $$ begin
  begin insert into public.strength_norm_curve_aliases (note) values ('anon'); raise exception 'STILL OPEN: SB-07 insert';
  exception when insufficient_privilege then null; end;
  begin truncate public.strength_norm_curve_aliases; raise exception 'STILL OPEN: SB-07 truncate';
  exception when insufficient_privilege then null; end;
  begin truncate public.athlete_focus_checkins; raise exception 'STILL OPEN: SB-07 truncate user table';
  exception when insufficient_privilege then null; end;
  perform 1 from public.strength_norm_curve_aliases; -- reading is unchanged
end $$;
rollback;
begin;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b"}', true) as _jwt \gset
set local role authenticated;
insert into public.athlete_focus_areas (target_id) values ('00000000-0000-0000-0000-000000000078'); -- own writes still work
rollback;
\echo 'after SB-07: anon cannot write or truncate; athletes still write their own rows'

-- SB-02
begin;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b"}', true) as _jwt \gset
set local role authenticated;
do $$ begin
  begin
    insert into public.athlete_focus_checkins (focus_area_id) values ('00000000-0000-0000-0000-0000000000fa');
    raise exception 'STILL OPEN: SB-02';
  exception when insufficient_privilege then null;
  end;
end $$;
rollback;
begin;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a"}', true) as _jwt \gset
set local role authenticated;
insert into public.athlete_focus_checkins (focus_area_id) values ('00000000-0000-0000-0000-0000000000fa'); -- A, own area
rollback;
\echo 'after SB-02: B cannot attach to A''s focus area; A still checks in on their own'

-- SB-03
begin;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a"}', true) as _jwt \gset
set local role authenticated;
update public.athlete_strength_entries set sex_code = 2, bodyweight_kg = 50, sport_id = null, reps = 6 where id = '00000000-0000-0000-0000-0000000000e1';
reset role;
do $$
declare e record; c record;
begin
  select * into e from public.athlete_strength_entries where id = '00000000-0000-0000-0000-0000000000e1';
  select * into c from private.user_strength_benchmark_candidates where source_entry_id = e.id;
  if e.sex_code <> 1 or e.bodyweight_kg <> 80 or e.sport_id is null then raise exception 'STILL OPEN: SB-03 entry context changed'; end if;
  if e.reps <> 6 then raise exception 'SB-03 blocked a legitimate correction of reps'; end if;
  if c.sex_code <> 1 or c.reps <> 6 then raise exception 'SB-03 pool copy wrong'; end if;
end $$;
rollback;
\echo 'after SB-03: derived context stays as derived; reps are still correctable'

-- SB-04
begin;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a"}', true) as _jwt \gset
set local role authenticated;
do $$ begin
  begin
    insert into public.athlete_strength_states (user_id, source_entry_id, model_version, observation_time, effective_time, state_payload)
    values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000e1', 'forged', now(), now(), '{}');
    raise exception 'STILL OPEN: SB-04';
  exception when insufficient_privilege then null;
  end;
  perform 1 from public.athlete_strength_states; -- reading own states is unchanged
end $$;
rollback;
\echo 'after SB-04: clients cannot write strength states; reading them still works'

-- SB-06
begin;
set local role anon;
do $$ begin
  if (select count(*) from public.app_exercise_source_mappings) <> 1 then raise exception 'SB-06: expected exactly the approved mapping'; end if;
  if exists (select 1 from public.app_exercise_source_mappings where mapping_status <> 'approved') then raise exception 'SB-06: unapproved mapping visible'; end if;
end $$;
rollback;
\echo 'after SB-06: approved mappings are readable, nothing else'

-- PS-09
begin;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a"}', true) as _jwt \gset
set local role authenticated;
insert into public.athlete_strength_entries (exercise_id, reported_load_value, reps, bodyweight_kg, age_years, sex_code, sport_id, client_op_id)
values ('00000000-0000-0000-0000-00000000000e', 90, 5, 80, 30, 1, '00000000-0000-0000-0000-000000000005', 'workout-device-1-1-0');
insert into public.athlete_strength_entries (exercise_id, reported_load_value, reps, bodyweight_kg, age_years, sex_code, sport_id, client_op_id)
values ('00000000-0000-0000-0000-00000000000e', 90, 5, 80, 30, 1, '00000000-0000-0000-0000-000000000005', 'workout-device-1-1-0')
on conflict (user_id, client_op_id) do nothing;
do $$ begin
  if (select count(*) from public.athlete_strength_entries where client_op_id = 'workout-device-1-1-0') <> 1 then raise exception 'STILL OPEN: PS-09'; end if;
end $$;
rollback;
begin;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b"}', true) as _jwt \gset
set local role authenticated;
insert into public.athlete_strength_entries (exercise_id, reported_load_value, reps, bodyweight_kg, age_years, sex_code, client_op_id)
values ('00000000-0000-0000-0000-00000000000e', 90, 5, 70, 25, 2, 'workout-device-1-1-0'); -- same id, other user: allowed
rollback;
\echo 'after PS-09: a resent lift is ignored; two athletes may use the same client id'

-- PS-14
begin;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b"}', true) as _jwt \gset
set local role authenticated;
insert into public.athlete_strength_entries (id, exercise_id, reported_load_value, reps, bodyweight_kg, age_years, sex_code)
values ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-00000000000e', 40, 8, 70, 25, 2);
reset role;
do $$ begin
  if (select sport_id from public.athlete_strength_entries where id = '00000000-0000-0000-0000-0000000000e2') is not null then raise exception 'PS-14: sport invented'; end if;
  if exists (select 1 from private.user_strength_benchmark_candidates where source_entry_id = '00000000-0000-0000-0000-0000000000e2') then raise exception 'PS-14: sportless entry entered the pool'; end if;
  if not exists (select 1 from private.user_strength_benchmark_candidates where source_entry_id = '00000000-0000-0000-0000-0000000000e1') then raise exception 'PS-14: sport entry left the pool'; end if;
end $$;
rollback;
\echo 'after PS-14: a general athlete''s lift lands with no sport and stays out of the sport pool'
