# Recovery: inventory, backups, rehearsal

**Today no automatic backup exists of the production database or its media.**
- The Supabase organisation is on the **Free plan** (read via the API, 14 Oct). Supabase's backup docs say daily backups start at Pro and PITR is a paid add-on. For Free projects they recommend regular `supabase db dump` exports kept off-site.
- Storage objects are never part of a database backup.

This pass prepared and tested the tooling for that export. Running it needs the database password, which only the owner has (O4).

## What would have to be recovered (REC01)

| Asset | Size / count (14 Oct) | Holds | Only copy? |
|---|---|---|---|
| Supabase Postgres `qiccnqkypbhlwpmjcsri` | 64 MB; 316 applied migrations | Research and evidence reference data (the bulk); norms (3,512 `strength_norms` rows); 2 workout shares; rate-limit counters (transient, 2 h); athlete tables (**empty**); `auth.users` (**0**) | **Yes.** Most of the schema has no repository copy (deployment.md, *Migrations*). |
| Supabase Storage `sports-genome-assets` (public) | 12 objects, about 3.4 MB (manifest: `scripts/ops/storage-manifest.json`) | App icons, intro video, header badge, two state images | **Yes.** None is in the repository. |
| Athletes' devices (localStorage) | per device | Workout history, plans, drafts, corrections: **the authoritative copy of every athlete's training** | **Yes.** Account sync is dormant, and exports cover one training day (PDF/share), not history. Cleared site data loses it. This is product work: a history export, or sync once sign-in ships. |
| Source and built releases | GitHub (public), every Vercel deployment | Code, migrations in `supabase/migrations`, prepared migrations, docs | No: GitHub plus any clone, and Vercel keeps past builds |
| Configuration | 2 names in Vercel (architecture.md) | URL (public); service key, also re-issuable from the Supabase dashboard | Re-creatable |
| Identity | Supabase Auth, anonymous users | `auth.users` ids are the `user_id` that owns every athlete row | In the database (backed up with it, if the dump includes `auth`; see the verify step) |
| MySQL (Drizzle) | not configured anywhere reachable | n/a | Nothing to back up while dormant |

## Backup state (REC02)

| Store | Schedule | Retention | Last successful | Access owner | Method |
|---|---|---|---|---|---|
| Postgres | **none** | n/a | **none known** | Supabase org owner | `scripts/ops/backup.sh` (prepared, tested with stand-ins) |
| Storage bucket | **none** | n/a | none | same | the same script (`storage-backup.mjs`, public URLs, size-checked) |
| Devices | none | n/a | none | each athlete | none (product gap above) |
| Source | every push | GitHub | continuous | repo admin | git |
| Releases | every deploy | Vercel retention | continuous | Vercel team | Instant Rollback / Promote |

### The backup script (REC04)

```sh
SUPABASE_DB_URL='<Session pooler connection string>' sh scripts/ops/backup.sh ~/sports-genome-backups
```

It runs on the owner's machine. It needs the Supabase CLI (which uses Docker), Node 22+ and gpg. It does three things:
- **Dumps the database:** `supabase db dump` three times (roles, schema, data with `COPY`).
- **Copies the media bucket:** all 12 objects, each checked against its expected size.
- **Packages the result:** writes `SHA256SUMS`, tars it, and encrypts with AES-256 (gpg, passphrase prompted). The output is `sports-genome-backup-<UTC stamp>.tar.gz.gpg`.

Keep the file in the owner's own private storage, and keep the passphrase somewhere else.

**Why not a scheduled GitHub workflow:** this repository is **public**, so a workflow artifact would be downloadable by anyone. Encryption alone is not access control. A workflow was drafted, then removed for that reason.

**Tested here** (no production access):
- with a stand-in for `supabase db dump` and a local server serving the 12 objects at their real sizes, the script produced an encrypted file;
- decrypting it gave `roles.sql`, `schema.sql`, `data.sql`, `storage/` (12 files), and `sha256sum -c` passed;
- a stand-in object one byte short made the script fail and write nothing.

**Not tested:** a real dump of production.

## Proposed targets (REC03): owner to confirm

These are proposals, not guarantees.

| Data | Proposed data loss (RPO) | Proposed time to restore (RTO) | Needs |
|---|---|---|---|
| Reference and evidence data | 7 days (it changes by deliberate imports) | 4 hours | A weekly `backup.sh` run (free) |
| Shares | 7 days (a lost share is re-created from the device) | 4 hours | Same |
| Athlete rows, **once real athletes sync** | ≤ 24 hours | 4 hours | A daily dump, or Pro daily backups (about $25/month; owner decision, not enabled) |
| Media | 7 days | 1 hour | Weekly run; or commit the 12 public assets to the repository (O5b) |

**Achieved so far:** schema-level only (below). Restoring a real production dump has not been measured.

## Restore rehearsal (REC05, REC10)

### Done: live-equivalent schema and synthetic records, isolated

On local PostgreSQL 16.15 in the sandbox (no network path to production):
1. `supabase/prepared/backend_v1/validation/run.sh`:
   - builds the athlete-table schema from definitions read off the live catalog;
   - seeds two synthetic athletes;
   - proves the seven open holes, applies the prepared migrations, proves them closed and legitimate writes working, re-applies them harmlessly, and drops the database.
   - **920 ms end to end**, all passing (`evidence/v1-validation-rehearsal.txt`).
2. `docs/infrastructure-v2/probes/access-matrix.sh` checks ownership on the same copy: **19 of 19** before and after (`evidence/access-matrix.txt`).
3. `supabase/migrations/20261008120000_shared_rate_limit.sql` applied twice; 200 concurrent calls allowed exactly 120 of a 120 limit (8 Oct).

This proves the ownership rules survive a rebuild from definitions. It does **not** prove a production backup restores, because none exists yet.

### To do once a backup exists (owner, O4): restore into an isolated database

1. **Decrypt and verify.**
   ```sh
   gpg -d sports-genome-backup-<stamp>.tar.gz.gpg | tar -xz
   (cd backup && sha256sum -c SHA256SUMS)
   ```
2. **Target.**
   - Either the Supabase CLI's local stack (`supabase init && supabase start`, with Docker; connection string from `supabase status`), or a **new** Supabase project. Never the production project.
   - Plain Postgres is not enough: the dump expects Supabase's roles (`anon`, `authenticated`, `service_role`) and extensions.
   - Nothing outbound runs from the data alone: no `pg_cron`, no `pg_net`, no webhooks, no email (anonymous users only). Check: `select extname from pg_extension`.
3. **Load.**
   ```sh
   psql "$TARGET" -v ON_ERROR_STOP=1 --single-transaction \
     -f backup/roles.sql -f backup/schema.sql \
     -c 'set session_replication_role = replica' -f backup/data.sql
   ```
4. **Verify.**
   - **Counts:** row counts of `strength_norms`, `workout_shares`, `exercises` and the evidence tables match the counts taken from production at backup time. Record them in the backup log.
   - **Policies:** `select count(*) from pg_policies where schemaname = 'public'` matches production.
   - **Identity:** `grep -c 'COPY auth.users' backup/data.sql`. If zero, the dump left out `auth`, and athlete rows would lose their owners on restore. Add an `auth` data dump before relying on it.
   - **Ownership:** run the production read-only role checks from security-verification.md against the restored database.
   - **Media:** each file in `backup/storage` has its manifest size.
5. **Record:** wall-clock time per step and any error, in `docs/infrastructure-v2/evidence/restore-<date>.txt`. That is the measured RTO.

## Bringing the app back on a restored project (REC07)

Restoring tables is not enough. The project's host is written in several places:
1. **Vercel env:**
   - `VITE_SUPABASE_URL` (all targets);
   - `SUPABASE_SERVICE_ROLE_KEY` (production; the new project's secret key);
   - `VITE_SUPABASE_PUBLISHABLE_KEY` (production). Production builds otherwise fall back to the **old** project's committed publishable key in `client/src/lib/supabaseClient.ts`.
2. **Code that names the host:**
   - `client/src/lib/supabaseClient.ts` (production defaults);
   - `server/sharePage.ts` (`SHARE_PREVIEW_IMAGE`);
   - `client/index.html` (icons, intro video);
   - `vercel.json` CSP (`img-src`, `media-src`, `connect-src`).

   Find them all with `git grep qiccnqkypbhlwpmjcsri`.
3. **Media:** upload `backup/storage/*` to a public bucket named `sports-genome-assets`.
4. **Auth:** devices hold sessions signed by the old project. They will sign in anonymously again with **new** ids. Rows owned by the old ids stay orphaned unless `auth.users` was restored with the same ids **and** the new project accepts them. In practice: restore into the same project where possible (Supabase's own restore), or accept that anonymous history re-syncs from devices.
5. **Rate limit:** `private.rate_limit_windows` restores empty or stale, which is harmless. Counters are per minute.

## Recent writes, deletions, queued retries (REC08)

- **Writes after the backup** are lost from the database. Devices still hold the athletes' own history.
  - Their strength-sync outbox resends lifts that were never acknowledged.
  - Lifts that *were* acknowledged after the backup are not resent. They stay on the device and are missing in the account.
- **Duplicates:** without the prepared PS-09 migration (`client_op_id`), a resent lift can land twice. One more reason for O1.
- **Deletions and disables:**
  - There is no account-deletion flow yet (SV-09, product work), so no deletion request can be lost today.
  - Share **disables** are soft, so a restore from before a disable brings the share back. Before reopening a restored database, re-apply every disable made after the backup time. At 2 shares this is manual; keep a log once there are more.
  - Once account deletion exists, it must write a tombstone outside the restorable tables, so a restore cannot bring a deleted athlete back.

## Which kind of recovery (REC09)

| Problem | Use | Not |
|---|---|---|
| A bad frontend or API release | **Application rollback** (deployment.md). Seconds; the database is untouched. | A database restore |
| A bad migration or bad rows | **Data repair**: the migration's documented reverse SQL, or a targeted fix in a transaction, tested first on a local copy | A full restore, which loses every later write |
| Project lost or corrupted | **Full restore** (above), then REC07 | |
| An athlete's device cleared | Nothing server-side today | (product gap) |
