-- SEC01/SEC05: who can read, change or re-own an athlete's rows, on the live-equivalent copy
-- that supabase/prepared/backend_v1/validation builds (same tables, grants and policies as
-- production for these four tables, read from the live catalog). Synthetic athletes A and B only.
-- Run through probes/access-matrix.sh; everything happens inside one transaction that is rolled back.
\set ON_ERROR_STOP on
\pset footer off
begin;

-- One state row for A, written the way the server writes it (as the table owner).
insert into public.athlete_strength_states (user_id, source_entry_id, model_version, observation_time, effective_time, state_payload)
values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000e1', 'probe', now(), now(), '{}');

-- Runs one statement as a role with a given JWT subject; reports rows touched or the refusal.
create function pg_temp.attempt(p_role text, p_sub text, p_sql text) returns text language plpgsql as $$
declare n int;
begin
  perform set_config('request.jwt.claims', case when p_sub is null then '{}' else json_build_object('sub', p_sub)::text end, true);
  execute format('set local role %I', p_role);
  execute p_sql;
  get diagnostics n = row_count;
  reset role;
  return n || ' rows';
exception when others then
  reset role;
  return 'refused ' || sqlstate;
end $$;

create temp table matrix (seq int, actor text, action text, expected text, observed text) on commit drop;
grant all on matrix to public;

\set a '''00000000-0000-0000-0000-00000000000a'''
\set b '''00000000-0000-0000-0000-00000000000b'''
\set e1 '''00000000-0000-0000-0000-0000000000e1'''
\set fa '''00000000-0000-0000-0000-0000000000fa'''
-- Expected values are regular expressions matched at the start of the observed text.

insert into matrix values
 (1,  'B', 'reads A''s strength entries',            '0 rows',  pg_temp.attempt('authenticated', :b, 'select 1 from public.athlete_strength_entries where user_id = ' || quote_literal(:a))),
 (2,  'B', 'corrects A''s entry (reps)',              '0 rows',  pg_temp.attempt('authenticated', :b, 'update public.athlete_strength_entries set reps = 6 where id = ' || quote_literal(:e1))),
 (3,  'B', 'deletes A''s entry',                      '0 rows',  pg_temp.attempt('authenticated', :b, 'delete from public.athlete_strength_entries where id = ' || quote_literal(:e1))),
 (4,  'B', 'inserts an entry naming A as owner',      'refused 42501|1 rows', pg_temp.attempt('authenticated', :b, 'insert into public.athlete_strength_entries (user_id, exercise_id, reported_load_value, reported_load_unit, reps, bodyweight_kg, age_years, sex_code, sport_id) values (' || quote_literal(:a) || ', ''00000000-0000-0000-0000-00000000000e'', 50, ''kg'', 5, 70, 25, 2, ''00000000-0000-0000-0000-000000000005'')')),
 (5,  'B', 'reads A''s focus area',                   '0 rows',  pg_temp.attempt('authenticated', :b, 'select 1 from public.athlete_focus_areas where id = ' || quote_literal(:fa))),
 (6,  'B', 'changes A''s focus area',                 '0 rows',  pg_temp.attempt('authenticated', :b, 'update public.athlete_focus_areas set user_id = user_id where id = ' || quote_literal(:fa))),
 (7,  'B', 'reads A''s strength state',               '0 rows',  pg_temp.attempt('authenticated', :b, 'select 1 from public.athlete_strength_states where user_id = ' || quote_literal(:a))),
 (8,  'A', 'moves own entry to B',                    'refused|1 rows', pg_temp.attempt('authenticated', :a, 'update public.athlete_strength_entries set user_id = ' || quote_literal(:b) || ' where id = ' || quote_literal(:e1))),
 (9,  'A', 'moves own focus area to B',               'refused 42501', pg_temp.attempt('authenticated', :a, 'update public.athlete_focus_areas set user_id = ' || quote_literal(:b) || ' where id = ' || quote_literal(:fa))),
 (10, 'A', 'reads own entry (legitimate)',            '1 rows',  pg_temp.attempt('authenticated', :a, 'select 1 from public.athlete_strength_entries where id = ' || quote_literal(:e1))),
 (11, 'A', 'corrects own entry reps (legitimate)',    '1 rows',  pg_temp.attempt('authenticated', :a, 'update public.athlete_strength_entries set reps = 6 where id = ' || quote_literal(:e1))),
 (12, 'A', 'reads own focus area (legitimate)',       '1 rows',  pg_temp.attempt('authenticated', :a, 'select 1 from public.athlete_focus_areas where id = ' || quote_literal(:fa))),
 (13, 'anon', 'reads strength entries',               'refused 42501', pg_temp.attempt('anon', null, 'select 1 from public.athlete_strength_entries')),
 (14, 'anon', 'reads focus areas',                    '0 rows',  pg_temp.attempt('anon', null, 'select 1 from public.athlete_focus_areas')),
 (15, 'anon', 'inserts a focus area for A',           'refused 42501', pg_temp.attempt('anon', null, 'insert into public.athlete_focus_areas (user_id, target_id) values (' || quote_literal(:a) || ', ''00000000-0000-0000-0000-000000000077'')')),
 (16, 'anon', 'writes a strength state',              'refused 42501', pg_temp.attempt('anon', null, 'insert into public.athlete_strength_states (user_id, source_entry_id, model_version, observation_time, effective_time, state_payload) values (' || quote_literal(:a) || ', ' || quote_literal(:e1) || ', ''probe'', now(), now(), ''{}'')'));

-- What 4 and 8 must prove is where the row ENDED UP, read back as the owner after the attempts:
-- a statement the database accepts is still safe if a trigger pinned the owner.
insert into matrix values
 (17, 'B', '...row 4: no row B wrote belongs to A',   '0 rows owned by A', (select count(*) || ' rows owned by A' from public.athlete_strength_entries where user_id = :a and id <> :e1)),
 (18, 'A', '...row 8: the entry still belongs to A',  'owner A',           (select case when user_id = :a then 'owner A' else 'owner changed' end from public.athlete_strength_entries where id = :e1)),
 (19, 'A', '...row 9: the focus area still belongs to A', 'owner A',       (select case when user_id = :a then 'owner A' else 'owner changed' end from public.athlete_focus_areas where id = :fa));

select seq, actor, action, expected, observed,
       case when observed ~ ('^(' || expected || ')') then 'PASS' else 'FAIL' end as result
from matrix order by seq;
select case when bool_and(observed ~ ('^(' || expected || ')')) then 'ACCESS MATRIX: ALL PASS' else 'ACCESS MATRIX: FAILURES ABOVE' end as verdict from matrix;
rollback;
