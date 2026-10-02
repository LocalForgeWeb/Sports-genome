-- Backend V1 (PS-09, SV-08; B168, B170, B261). PREPARED, NOT APPLIED: needs owner authorization (B009).
--
-- Lift sync was deduplicated only in the browser's local storage, so a committed insert whose
-- response was lost, two tabs, a synced-key list past its 5,000 cap, or an identity reset sent the
-- same lift again as a new row. Each synced lift now carries the client's own id for it
-- (`workout-<session>-<exercise>`), unique per user, and the client upserts with
-- `onConflict: "user_id,client_op_id", ignoreDuplicates: true` (the paired client change,
-- recorded in docs/backend-v1/handoff.md, ships with this migration).

alter table public.athlete_strength_entries add column if not exists client_op_id text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'athlete_strength_entries_client_op_id_length') then
    alter table public.athlete_strength_entries
      add constraint athlete_strength_entries_client_op_id_length check (client_op_id is null or char_length(client_op_id) between 1 and 200);
  end if;
end $$;
create unique index if not exists athlete_strength_entries_user_client_op_id
  on public.athlete_strength_entries (user_id, client_op_id);
