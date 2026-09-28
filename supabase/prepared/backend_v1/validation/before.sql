\set ON_ERROR_STOP on
-- On the schema as it is live: each hole the migrations close is open. Every block raises
-- 'HOLE CLOSED' if the exploit no longer works, so this script passing proves the finding.

-- SB-07: RLS is the only barrier. It stops anon's INSERT (no insert policy), but anon still
-- holds the privilege, and TRUNCATE is not subject to RLS at all: anon empties a reference table
-- and a user table.
begin;
insert into public.strength_norm_curve_aliases (note) values ('reference row');
set local role anon;
truncate public.strength_norm_curve_aliases;
truncate public.athlete_focus_checkins;
reset role;
do $$ begin
  if exists (select 1 from public.strength_norm_curve_aliases) then raise exception 'HOLE CLOSED: SB-07'; end if;
end $$;
rollback;
\echo 'before SB-07: anon truncated a reference table and a user table (RLS does not apply to TRUNCATE)'

-- SB-02: B attaches a check-in to A's focus area.
begin;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b"}', true) as _jwt \gset
set local role authenticated;
insert into public.athlete_focus_checkins (focus_area_id) values ('00000000-0000-0000-0000-0000000000fa');
rollback;
\echo 'before SB-02: B attached a check-in to A''s focus area'

-- SB-03: A edits the derived context of an entry after insert, and it reaches the pool.
begin;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a"}', true) as _jwt \gset
set local role authenticated;
update public.athlete_strength_entries set sex_code = 2, bodyweight_kg = 50 where id = '00000000-0000-0000-0000-0000000000e1';
reset role;
do $$ begin
  if (select sex_code from private.user_strength_benchmark_candidates where source_entry_id = '00000000-0000-0000-0000-0000000000e1') <> 2 then raise exception 'HOLE CLOSED: SB-03'; end if;
end $$;
rollback;
\echo 'before SB-03: A changed sex and body weight on a stored entry, and the pool copied them'

-- SB-04: A writes a derived strength state by hand.
begin;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a"}', true) as _jwt \gset
set local role authenticated;
insert into public.athlete_strength_states (user_id, source_entry_id, model_version, observation_time, effective_time, state_payload)
values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000e1', 'forged', now(), now(), '{"percentile": 99}');
rollback;
\echo 'before SB-04: A wrote a strength state directly'

-- SB-06: the browser cannot read even approved mappings.
begin;
set local role anon;
do $$ begin
  begin
    perform 1 from public.app_exercise_source_mappings where mapping_status = 'approved';
    raise exception 'HOLE CLOSED: SB-06';
  exception when insufficient_privilege then null;
  end;
end $$;
rollback;
\echo 'before SB-06: anon could not read approved mappings'

-- PS-09: the same lift sent twice lands twice.
begin;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a"}', true) as _jwt \gset
set local role authenticated;
insert into public.athlete_strength_entries (exercise_id, reported_load_value, reps, bodyweight_kg, age_years, sex_code, sport_id)
values ('00000000-0000-0000-0000-00000000000e', 90, 5, 80, 30, 1, '00000000-0000-0000-0000-000000000005'),
       ('00000000-0000-0000-0000-00000000000e', 90, 5, 80, 30, 1, '00000000-0000-0000-0000-000000000005');
do $$ begin
  if (select count(*) from public.athlete_strength_entries where reported_load_value = 90) <> 2 then raise exception 'HOLE CLOSED: PS-09'; end if;
end $$;
rollback;
\echo 'before PS-09: the same lift landed twice'

-- PS-14: a general athlete's lift is refused for want of a sport.
begin;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b"}', true) as _jwt \gset
set local role authenticated;
do $$ begin
  begin
    insert into public.athlete_strength_entries (exercise_id, reported_load_value, reps, bodyweight_kg, age_years, sex_code)
    values ('00000000-0000-0000-0000-00000000000e', 40, 8, 70, 25, 2);
    raise exception 'HOLE CLOSED: PS-14';
  exception when others then
    if sqlerrm not like '%SPORT_REQUIRED%' and sqlstate <> '23502' then raise; end if;
  end;
end $$;
rollback;
\echo 'before PS-14: a general athlete''s lift was refused (SPORT_REQUIRED)'
