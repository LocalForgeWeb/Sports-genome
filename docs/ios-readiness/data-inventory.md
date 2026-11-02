# Identity and data inventory (A01, A03, A04)

Written 2 Nov 2026 from the source at `0ee7bdbc` and later, plus read-only queries of the production Supabase project (`qiccnqkypbhlwpmjcsri`). The privacy draft at `/privacy` is drawn from this file. Update both together.

## 1. Three identities exist today, and nothing links them

```
                       ┌──────────────────────────────────────────────┐
  the device           │ localStorage (this browser / this app install)│
  ───────────          │                                                │
  "storage owner"  ───►│ key = base            (no one signed in: today)│
   (deviceRecordStore) │ key = base::<owner>   (a signed-in account id) │
                       └──────────────────────────────────────────────┘
                                     │ copies of lifts, profile fields
                                     ▼  (only when Supabase is configured)
  Supabase auth        ┌──────────────────────────────────────────────┐
  anonymous UUID   ───►│ athlete_profiles, athlete_strength_entries,   │
  (athleteIdentity.ts) │ athlete_focus_areas, athlete_training_…,      │
  one per device       │ athlete_focus_checkins, athlete_strength_states│
                       └──────────────────────────────────────────────┘

  Drizzle account      ┌──────────────────────────────────────────────┐
  users.id (MySQL int) │ users, emailCredentials, passkeys, sessions,  │
  (server/localAuth)   │ workoutSessions, workoutSetLogs, favourites   │
  sign-in turned off   └──────────────────────────────────────────────┘

  share links          workout_shares (server-only, service role): the snapshot the
  (no identity)        athlete approved; ownership = SHA-256 of a secret kept on the device.
```

- **Device storage owner.** The signed-in account's id (`Home.tsx` passes `user?.id`, the Drizzle `users.id`). In this build `directWorkspaceAccess = true` and no one signs in, so it is `null` and every record lives under its base key.
- **Supabase anonymous UUID.** Created by `signInAnonymously()` on first launch when the client is configured; the session is kept under `sports-genome-auth-v1`. **Production has 0 auth users and 0 rows in every `athlete_*` table** (queried 2 Nov 2026), so no athlete has a cloud copy today.
- **Drizzle account.** Email/password and passkeys over a session cookie (`server/localAuth.ts`). The UI is turned off. Its workout tables are not what the app writes: the app writes to the device.
- **Nothing links the Drizzle `users.id` (an integer) to the Supabase UUID.** They are separate identities, and so is the device.

## 2. Decision needed from the owner (A01)

Shipping recoverable accounts needs **one** canonical identity. Two workable options:

1. **Supabase auth is the account.** Upgrade the anonymous UUID in place (`updateUser({ email })` / Sign in with Apple), so cloud rows keep their owner. Retire the Drizzle auth tables, or keep them read-only for anyone who registered. RLS already enforces `auth.uid() = user_id`. *Recommended:* it is where the cloud rows already live, and the device's storage owner can become the Supabase UUID.
2. **The Drizzle account is the account.** Then the server must verify a Drizzle session and write cloud rows itself, with the service role, under a server-checked mapping `users.id ↔ auth UUID`. More server work, and RLS no longer protects writes made from the app.

Either way:
- **Cloud sync today copies only lifts and a few profile fields.** It is not a backup of the training history. The account screen must not call it one, and does not ("Saved on this device").
- **Password reset, session renewal and server-side deletion** are not built (see `status.md`, A01 and A04).

Nothing in this audit pass switched identities: the choice changes what "an account" means for every athlete.

## 3. Everything the app persists

**Scope:**
- *Owner* means the key is `base` while no one is signed in and `base::<owner>` once someone is (deviceRecordStore.ts, deviceStorageScope.ts).
- *Device* means one key for the whole device.

| Key / table | Holds | Scope | Recovery on bad data | Leaves the device? | In backup |
|---|---|---|---|---|---|
| `sports-genome-device-workout-history-v1` | every workout, set, stage, side, hold, unit, swap, note, active session | owner | quarantined copy `::unreadable::<time>`; saves refused until it is safe | no | yes |
| `sports-genome-device-strength-observations-v1` | typed lifts | owner | quarantined | no | yes |
| `sports-genome-body-weight-log-v1` | body-weight history | owner | quarantined | no | yes |
| `sports-genome-strength-sync-queue-v1` | lifts waiting to upload, each tied to its cloud owner | owner | quarantined | to `athlete_strength_entries` when configured | no (rebuilt from workouts) |
| `sports-genome-strength-synced-v1` | ids already uploaded | owner | quarantined | no | no |
| `gym-optimizer-athlete-profile-v1` | name, experience, sport, goal, optional body weight / sex / birth year | owner | read as defaults | sex, age in years, sport, default body weight → `athlete_profiles` when configured | yes |
| `gym-optimizer-workout-plan-v1` | the plan, week names, day layouts | owner | read as defaults | no | yes |
| `gym-optimizer-favorite-exercise-ids-v1` | favourites | owner | read as empty | no | yes |
| `sports-genome-specialization-goals-v1`, `-measurements-v1`, `-stacks-v1`, `-exclusions-v1`, `-region-v1` | specialization targets, measurements, stacks, exclusions, last region | owner | unread entries kept | no | yes (not region) |
| `sg-shared-by-me-v1` | tokens + **manage secrets** of links this device shared | owner | read as empty | the snapshot → `workout_shares` | **never** |
| `sg-saved-shares-v1` | copies of others' shared workouts saved here | owner | read as empty | no | no |
| `sports-genome-import-conflicts-v1` | imported records that clashed, kept for review | owner | quarantined | no | no |
| `sports-genome-recent-exercises-v1` | recent picks | device | read as empty | no | no |
| `sports-genome-benchmark-opt-in-v1` | anonymous comparison opt-in | device | off | `athlete_profiles.benchmark_pool_opt_in` | no |
| `sports-genome-auth-v1` | Supabase session (tokens) | device | signed out | to Supabase auth | **never** |
| `sports-genome-user-info` | cached Drizzle user | device | refetched | no | **never** |
| `sports-genome-supabase-reference-map-v1` | cached reference ids | device | refetched | no | no |
| theme, launch video, intro flags | preferences | device | defaults | no | no |

**Schema versions:**
- The profile carries `version: 3`.
- Workout sessions are read tolerantly: unknown fields are kept, unit-less sessions are marked `weightUnitInferred`.
- The backup format is `sports-genome-device-backup` v1.

**Reinstalling.**
- Uninstalling the iOS app, or clearing Safari's site data, deletes everything above. Device-only history does **not** survive that.
- The backup file is the only copy that does, until account sync exists.
- Safari and an installed app do not share storage, so installing the app does not bring web history across. Moving it is the backup journey in `backup-and-migration.md`.

## 4. What leaves the device

| Destination | What | When |
|---|---|---|
| Vercel (host) | IP, user agent, request paths; request logs | every load and API call |
| Supabase storage | IP, user agent | images, intro video |
| Google Fonts, jsDelivr, GitHub raw | IP, user agent | fonts, some exercise images |
| `workout_shares` | the approved workout snapshot, a hash of the manage secret | when the athlete creates a link |
| Supabase `athlete_*` | anonymous UUID, profile fields above, lifts | only when sync is configured (0 users in production today) |

No analytics or ads scripts ship: the umami tag is dropped unless configured, and production's HTML has none (fetched 2 Nov 2026).

## 5. Deletion (A04)

About me → Your data → **Delete my data** (`deviceDataDeletion.ts`) runs these steps in order:

1. **Shared links.** Turns off this device's shared links. Links that fail are kept, so a retry can turn them off.
2. **Cloud rows.** Deletes the cloud identity's rows that RLS lets an athlete delete: `athlete_strength_entries`, `athlete_focus_areas`, `athlete_training_constraints`, `athlete_profiles`. Then it signs out.
3. **This device.** Removes only this owner's records.

Each step reports its own result, and running the delete again is safe.

**Not yet possible from the app** (needs a service-role server endpoint that verifies the caller's Supabase JWT):
- deleting `athlete_focus_checkins` and `athlete_strength_states` (insert-only by design);
- deleting the anonymous auth user itself.

With 0 cloud users today this affects no one; it must exist before sync is switched on for the public.
