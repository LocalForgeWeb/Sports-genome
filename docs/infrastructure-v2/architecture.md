# Architecture: what actually runs

Verified on 13–14 October 2026 against the live systems, not only the source. "Verified" below means one of:
- read from the provider: Vercel project and env API, Supabase catalog, GitHub API;
- a request to the deployed site;
- a test in this repository.

## The pieces

| Service | Purpose | Environment | Owner / access | Callers | Failure behaviour | State |
|---|---|---|---|---|---|---|
| **Browser app** (React 19, Vite) | The whole product UI. Workouts, plans and history live on the device (localStorage). | Built by Vercel to `dist/public`, served by Vercel's CDN | Repo `LocalForgeWeb/Sports-genome` | Athletes | Works offline for logging. Server-backed panels say "unavailable". | Active |
| **API function** `api/[...path].js` → `dist/serverless.js` (Express + tRPC) | Evidence library, ranks, percentiles, sport profile, resilience catalog, shared-workout links, share-page link previews | Vercel, Node 24.x, region **pdx1** (Portland) since `0337de7`; it was `iad1` before | Vercel team `local-b96d`, project `prj_ZuUcAMUz7BpCcniwEV7XWsQfvOzV` | Browser (tRPC), link-preview bots (`/s/:token`) | JSON errors with a reference. 8 s budget per upstream call. Features answer "unavailable" without their config. | Active |
| **Supabase Postgres** `qiccnqkypbhlwpmjcsri` | Research and evidence data, norms, ranks, shares, athlete tables, the rate-limit counter | Postgres 17.6, us-west-2. Org plan **Free** (read via API) | Supabase org `wbbftrhxpnoxjdlurxyg` | API function (service key, over the Data API); browser (publishable key + anonymous session) | Server features degrade to "unavailable". Device logging is unaffected. | Active. 64 MB, 316 applied migrations |
| **Supabase Auth** | Anonymous sign-in, so the browser has an `auth.uid()` for row-level security | Same project | Same | Browser | No session means no account sync; device logging is unaffected | Active, **0 users** today |
| **Supabase Storage** bucket `sports-genome-assets` | App icons, intro video, header badge, two state images | Same project. Public bucket, 12 objects, about 3.4 MB | Same | Browser, share-page head | Broken images / no intro video | Active. **Its only copy**: none of the 12 files is in the repo |
| **MySQL via Drizzle** (`DATABASE_URL`) | Email/passkey sign-in, account workout logs, plans, favourites | **Not configured in any Vercel environment** (env listing shows no `DATABASE_URL`). Sign-in is also off in the build (`directWorkspaceAccess = true`). | Unknown host | `protectedProcedure` routes | Every protected route answers UNAUTHORIZED (the context has no user) | **Dormant.** Kept, not deleted (BASE05). |
| **GitHub Actions** `ci.yml` | Frozen install, typecheck, tests, build, built-function smoke | GitHub-hosted runners, Node 24 | Repo (public) | Pushes to main, pull requests | Red check. Vercel still deploys (see deployment.md). | Active |
| **GitHub Actions** `production-monitor.yml` | Read-only synthetic check of production, one issue per incident | Same | Same | Manual dispatch only | n/a | **Staged.** Schedule off until the owner approves (operations.md). |
| **External read-only origins** | Exercise photos (`cdn.jsdelivr.net`, fallback `raw.githubusercontent.com`); fonts (`fonts.googleapis.com`, `fonts.gstatic.com`) | Third-party CDNs | n/a | Browser | Placeholder image / fallback font | Active |
| **Higgsfield API** (`scripts/higgsfield`) | Offline image-generation tool | Developer machine only. `HF_API_KEY` is not in any Vercel environment. | Owner | Developer | n/a | Tooling, not runtime |
| **Analytics tag** (umami placeholder) | None | Dropped at build unless both `VITE_ANALYTICS_*` are set (they are not) | n/a | n/a | n/a | Dormant |

**Scheduled jobs (ENV09, RUN08):** none run anywhere.
- No `crons` in `vercel.json`.
- No `pg_cron` or `pg_net` extension in Postgres (extensions present: `supabase_vault`).
- No `schedule:` trigger in any workflow.

The production monitor's schedule is deliberately commented out. Staging cannot run a production job because there is none to run.

## Request path

```
browser ──HTTPS──> Vercel CDN ──(static: dist/public, SPA fallback)──> index.html / hashed assets
                       │
                       ├─ /api/trpc/*        rewrite ?__trpc=…   ┐
                       ├─ /api/<a>/<b>…      rewrite ?__api=…    ├─> function (pdx1) ── Supabase Data API (service key)
                       ├─ /api/<one>         direct              │                    └─ Postgres (us-west-2)
                       └─ /s/<token>         rewrite ?__sharePage┘
browser ──HTTPS──> Supabase Data API + Auth (publishable key, anonymous session, RLS)
```

`api/[...path].js` matches **one** path segment under this framework preset. Every deeper path therefore needs a rewrite: tRPC had one, and since `259ebda` all other deeper paths do too. The function rebuilds the path from the carried value, accepting only plain segments.

## Identity, end to end (ENV02)

There are two identity systems, and nothing maps one to the other.

1. **Browser → Supabase (active).**
   - `supabase.auth.signInAnonymously()` creates the session, stored under `sports-genome-auth-v1`.
   - Every athlete table (`athlete_profiles`, `athlete_strength_entries`, `athlete_strength_states`, `athlete_focus_areas`, `athlete_training_constraints`) is keyed by `user_id`. Row-level security enforces `auth.uid() = user_id`: USING on reads and deletes, WITH CHECK on inserts, both on updates.
   - The insert trigger `prepare_athlete_strength_entry` overwrites `user_id` with the caller's `auth.uid()`, so a client cannot write a row "for" someone else.
   - Tested in security-verification.md.
2. **Browser → API → MySQL (dormant).**
   - The tRPC context reads the `go_email_session` cookie, which maps to `local_auth_sessions` and then `users` in MySQL.
   - With no `DATABASE_URL` in production, `ctx.user` is always null.
3. **The server's own identity toward Supabase** is the service-role key: production-only, server-only, never in a bundle.
   - It reads reference data and writes shares and rate-limit counters. It never acts "as" an athlete.
   - Shared-workout links are capabilities: a random token plus a manage secret that only the creating device holds.
   - The `workout_shares` table has RLS on, no policies and no client grants, so only the server reaches it.

Before sign-in ships, the two systems need an explicit mapping, or a decision that one replaces the other (Backend V1 decision D-012). That is product work, not part of this brief.

## Configuration names (ENV03)

Names and classes only. Values are never printed. Server classification lives in `server/_core/config.ts`; every name is explained in `.env.example`.

| Name | Read by | Class | Secret | Set in Vercel (verified via the env API, values not decrypted) |
|---|---|---|---|---|
| `VITE_SUPABASE_URL` | browser build and server | required | no (public URL) | production, preview, development |
| `VITE_SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_ANON_KEY` | browser build | optional | no (meant to ship) | not set. **Production builds only** fall back to the committed production value. |
| `SUPABASE_SERVICE_ROLE_KEY` | server | required | **yes** | production only (sensitive) |
| `DATABASE_URL` | server (Drizzle/MySQL) | optional | yes | not set |
| `HEALTH_CHECK_TOKEN` | server, `/api/health/ready` | optional | yes | **not set** (owner action O3) |
| `RATE_LIMIT_SHARED` | server | optional (`off` disables the shared limit) | no | not set (shared limit on) |
| `SHARE_STORE` | server | local-only | no | not set; ignored in production |
| `VERCEL_ENV`, `VERCEL_GIT_COMMIT_SHA`, `VERCEL_DEPLOYMENT_ID`, `VERCEL_REGION` | build and server | platform | no | set by Vercel |
| `HF_API_KEY`, `HF_API_BASE_URL` | `scripts/higgsfield` | developer-only | yes | not set (correct) |
| CI secrets `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | `ci.yml` test step | optional | yes | Unknown (not readable). The live tests skip when they are empty. |

**Missing config never becomes a demo mode or another environment's data (ENV04).**
- The server logs one `config_missing` line per instance, naming the missing names.
- `/api/health/ready` reports `missingRequired`.
- Each feature answers "unavailable".

## Environment boundaries (ENV05, ENV06)

| | Production | Preview (every branch push) | Local |
|---|---|---|---|
| Browser Supabase client | production project (committed defaults) | **none**: URL is set, publishable key is not, and the production fallback applies only to production builds (fixed in `f8d5b1b`) | none unless `.env` sets a project |
| Server service key | yes | **no** (the variable targets production only) | only if the developer sets one |
| Shared rate limit | on | off (no key) | off |
| Data | live | cannot reach production data through the app | memory share store; synthetic fixtures in tests and `supabase/prepared/backend_v1/validation/seed.sql` |

**Before `f8d5b1b`**, every preview and local build fell back to the production URL and publishable key. Opening any preview signed the visitor in anonymously to production and wrote their profile and lifts there.
- `client/src/lib/supabaseClient.environment.test.ts` pins the new behaviour.

**Synthetic fixtures (ENV06)** are the two athletes in the Backend V1 seed and the test fixtures. They live only in local databases created and dropped by the scripts, so cleanup is the `drop database` at the end of each run. No production record has been copied anywhere.

## Toolchain (ENV07)

| | Version | Where it is pinned |
|---|---|---|
| Node (hosting) | 24.x | Vercel project setting (read via API) |
| Node (CI) | 24 | `ci.yml` (was 22 until `f8d5b1b`) |
| Node (allowed) | `>=22 <25` | `package.json` `engines` |
| pnpm | 10.4.1 | `packageManager` (with hash). The stray `pnpm@^10.15.1` devDependency that disagreed with it was removed in `f8d5b1b`. |
| Lockfile | `pnpm-lock.yaml`; CI runs `--frozen-lockfile` | |
| Postgres (production) | 17.6.1.166 | Supabase |
| Postgres (local verification) | 16.15 | the sandbox's packages |
| Supabase CLI | not used by the app; needed only for `scripts/ops/backup.sh` | |
