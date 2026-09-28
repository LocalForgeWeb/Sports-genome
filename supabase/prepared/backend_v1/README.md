# Backend V1 — prepared Supabase migrations (NOT APPLIED)

These close the Supabase findings from the Backend V1 discovery (`docs/backend-v1/inventory/supabase.md`). They are **prepared and validated, not applied**: applying them to project `qiccnqkypbhlwpmjcsri` changes production and needs the owner's authorization (brief B009). They live here, not in `supabase/migrations/`, so no CLI push or GitHub integration picks them up.

| File | Finding | What it does |
|---|---|---|
| `20260928120000_backend_v1_table_grants.sql` | SB-07 | Revokes TRUNCATE/REFERENCES/TRIGGER from anon and authenticated everywhere, and INSERT/UPDATE/DELETE wherever no policy grants that command to that role; new tables grant them nothing by default. |
| `20260928120100_backend_v1_child_ownership.sql` | SB-02 | A check-in's focus area must belong to the same user. |
| `20260928120200_backend_v1_entry_context_immutable.sql` | SB-03 | Sex, age, body weight, sport, experience, measurement type and scoring version stay as derived at insert; load, reps and effort stay correctable. |
| `20260928120300_backend_v1_states_server_only.sql` | SB-04 | Clients can no longer write strength states (the server writes them). |
| `20260928120400_backend_v1_approved_mappings_read.sql` | SB-06 | The browser can read approved exercise mappings, and only those. |
| `20260928120500_backend_v1_entry_client_op_id.sql` | PS-09, SV-08 | A client id per synced lift, unique per user, so a resent lift is ignored. |
| `20260928120600_backend_v1_entry_sport_optional.sql` | PS-14 | A general athlete's lift needs no sport; a sportless entry stays out of the sport benchmark pool. |

## Validation

`validation/run.sh <psql args>` builds a local copy of the live objects these touch (`bootstrap.sql`, definitions read from the live catalog on 28 September 2026), seeds two athletes, then:

1. `before.sql` — proves each hole is **open** on the live-equivalent schema (it fails if one is already closed);
2. applies the seven migrations in order;
3. `after.sql` — proves each hole is **closed** and every legitimate write the app makes still works;
4. re-applies the migrations to show they are safe to run twice.

Result on 28 September 2026 (PostgreSQL 16.13): **ALL VALIDATION PASSED**. The run also caught a defect in the grants migration before it could reach production (a PL/pgSQL variable named like a `pg_policies` column).

Every table the browser writes (`athlete_profiles`, `athlete_strength_entries`, `athlete_focus_areas`, `athlete_training_constraints`) has `authenticated` policies for the commands it uses, so the grants migration removes only privileges no policy allowed.

## Applying (owner authorization required)

1. Apply the seven files in name order (for example with the Supabase MCP `apply_migration`, or `psql -v ON_ERROR_STOP=1`), then re-run the advisors.
2. **Paired client change for `…120500`** (ship after the column exists): in `client/src/lib/strengthSyncQueue.ts`, add `client_op_id: item.key` to each row and replace `.insert(rows)` with `.upsert(rows, { onConflict: "user_id,client_op_id", ignoreDuplicates: true })`; the 5,000-key local cap then stops mattering.
3. `…120400` makes the browser's queued lifts start landing for the first time (none ever has: `auth.users` is empty). The client already keeps unmappable lifts queued instead of dropping them.

## Rollback

Each file is reversible by hand: restore the previous grants/policies from `bootstrap.sql`, drop `athlete_strength_entries_protect_context` and `private.protect_strength_entry_context`, drop the `client_op_id` index/constraint/column, and re-create `prepare_athlete_strength_entry` / `sync_strength_benchmark_candidate` from `bootstrap.sql` (sport required again) after restoring `sport_id` NOT NULL — which fails if sportless entries exist by then.

## Not covered here (owner decisions)

- **SB-01 — the anonymous public surface.** Anonymous sign-in gives every visitor the `authenticated` role, which can read all 3,512 `strength_norms` rows (excluded and blocked included) and 20+ research tables and call 158 RPCs. Which of these are meant to be public is a product decision; once made, gate the rest with `(auth.jwt()->>'is_anonymous')::boolean is not true` or move them behind approved views.
- **SB-11 — the SECURITY DEFINER RPC callable by authenticated users**, and RPC EXECUTE grants generally: revoking blind risks breaking views and policies that call them; needs a per-function review.
- **SB-05 — the Supabase identity is not tied to the app account** and survives sign-out; needs the sign-in design (D-012).
