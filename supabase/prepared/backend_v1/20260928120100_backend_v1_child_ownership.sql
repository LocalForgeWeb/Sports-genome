-- Backend V1 (SB-02; B032, B180, B192). PREPARED, NOT APPLIED: needs owner authorization (B009).
--
-- A check-in's focus area must belong to the same user. The INSERT policy checked only the
-- child's own user_id, and foreign-key checks bypass RLS, so user B could attach a check-in or a
-- strength state to user A's focus area or entry (knowing its uuid), probe which uuids exist
-- through the FK error, and have A's delete cascade into B's rows.

drop policy if exists athlete_focus_checkins_insert_own on public.athlete_focus_checkins;
create policy athlete_focus_checkins_insert_own on public.athlete_focus_checkins
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.athlete_focus_areas parent
      where parent.id = focus_area_id and parent.user_id = (select auth.uid())
    )
  );

-- Strength states get no client insert at all (20260928120300), so only the check-in needs this.
