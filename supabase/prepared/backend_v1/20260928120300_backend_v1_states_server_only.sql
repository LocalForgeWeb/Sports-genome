-- Backend V1 (SB-04; B024, B194). PREPARED, NOT APPLIED: needs owner authorization (B009).
--
-- Strength states are derived results (`state_payload`, `model_version`, `computed_at`). Clients
-- could insert them directly, and `app_strength_history_v2` shows the latest by `computed_at`, so
-- a hand-written row won. Nothing in the app writes states from the browser; they are written by
-- the server (service role) only. Reading your own states is unchanged.

revoke insert, update, delete on public.athlete_strength_states from anon, authenticated;
drop policy if exists athlete_strength_states_insert_own on public.athlete_strength_states;
