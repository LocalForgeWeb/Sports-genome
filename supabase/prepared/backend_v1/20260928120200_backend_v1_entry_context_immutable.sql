-- Backend V1 (SB-03; B024, B031, B150, B194). PREPARED, NOT APPLIED: needs owner authorization (B009).
--
-- The athlete context on a strength entry is derived from the profile when it is inserted
-- (`private.prepare_athlete_strength_entry`) and must not be edited afterwards: the UPDATE
-- policy let the owner change sex, age, body weight, sport, experience and measurement type,
-- and the AFTER UPDATE trigger copied the edited values into the private benchmark pool.
-- A BEFORE UPDATE trigger now keeps them as they were derived. The measurement itself (load,
-- reps, effort, notes) stays correctable.

create or replace function private.protect_strength_entry_context()
returns trigger
language plpgsql
set search_path to 'pg_catalog'
as $$
begin
  new.user_id := old.user_id;
  new.sex_code := old.sex_code;
  new.age_years := old.age_years;
  new.bodyweight_kg := old.bodyweight_kg;
  new.sport_id := old.sport_id;
  new.training_experience_years := old.training_experience_years;
  new.experience_level_code := old.experience_level_code;
  new.measurement_type := old.measurement_type;
  new.scoring_model_version := old.scoring_model_version;
  return new;
end;
$$;

drop trigger if exists athlete_strength_entries_protect_context on public.athlete_strength_entries;
create trigger athlete_strength_entries_protect_context
  before update on public.athlete_strength_entries
  for each row execute function private.protect_strength_entry_context();
