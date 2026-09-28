\set ON_ERROR_STOP on
-- Two athletes: A trains a sport; B is a general athlete with no sport.
insert into public.athlete_profiles (user_id, default_bodyweight_kg, declared_age_years, sex_code, primary_sport_id)
values ('00000000-0000-0000-0000-00000000000a', 80, 30, 1, '00000000-0000-0000-0000-000000000005'),
       ('00000000-0000-0000-0000-00000000000b', 70, 25, 2, null);
insert into public.strength_exercise_scoring_policy (exercise_id, load_semantics) values ('00000000-0000-0000-0000-00000000000e', 'total_external_load');
insert into public.athlete_focus_areas (id, user_id, target_id) values ('00000000-0000-0000-0000-0000000000fa', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000077');
insert into public.app_exercise_source_mappings (local_catalog_id, supabase_exercise_id, mapping_status, mapping_method)
values (1, '00000000-0000-0000-0000-00000000000e', 'approved', 'reviewed'), (2, '00000000-0000-0000-0000-00000000000f', 'pending', 'candidate');
-- A's entry, inserted as A.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a"}', false) as _jwt \gset
set role authenticated;
insert into public.athlete_strength_entries (id, exercise_id, reported_load_value, reported_load_unit, reps, bodyweight_kg, age_years, sex_code, sport_id)
values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-00000000000e', 100, 'kg', 5, 80, 30, 1, '00000000-0000-0000-0000-000000000005');
reset role;
