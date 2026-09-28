-- Backend V1 (SB-06; B020, B168, B169, B170). PREPARED, NOT APPLIED: needs owner authorization (B009).
--
-- The browser resolves catalog exercise ids to database exercise uuids through
-- `app_exercise_source_mappings` before syncing a lift, but the table had no grant and no policy
-- for anon or authenticated, so the read failed and every queued lift was dropped as unmappable.
-- Approved mappings - the only ones the client reads - become readable; nothing else does.

alter table public.app_exercise_source_mappings enable row level security;
grant select on public.app_exercise_source_mappings to anon, authenticated;
drop policy if exists app_exercise_source_mappings_select_approved on public.app_exercise_source_mappings;
create policy app_exercise_source_mappings_select_approved on public.app_exercise_source_mappings
  for select to anon, authenticated
  using (mapping_status = 'approved');
