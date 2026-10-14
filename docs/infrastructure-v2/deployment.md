# Deployment: gates, order, smoke checks, rollback

## What happens on a push

| Push to | CI (`.github/workflows/ci.yml`) | Vercel |
|---|---|---|
| `main` | Runs (push trigger) | Builds `pnpm build` and **promotes to production immediately** |
| any other branch | Runs only if a pull request is open | Builds a **preview** at its own URL (preview env: no service key, no browser Supabase client) |
| pull request (incl. forks) | Runs (`pull_request`, never `pull_request_target`) | Preview for same-repo branches |

`main` is **not protected** (GitHub API: `protected: false`), and Vercel does not wait for CI. So today a red CI run is only a signal. The production deploy has already happened. See *Gaps* below.

## CI gates (CI01–CI04, CI07, CI08)

One job, about a minute plus the smoke test, all steps required:
1. `pnpm install --frozen-lockfile`. pnpm comes from `packageManager` (10.4.1 with hash); Node is 24, as on Vercel.
2. `pnpm exec tsc --noEmit`.
3. `pnpm exec vitest run`. At the docs commit: 378 files passed, 4 skipped; 3,098 tests passed, 6 skipped. The skips are live-Supabase tests that need credentials CI may not have.
4. `pnpm build`: the Vite client plus two esbuild bundles (`dist/index.js` for the dev server, `dist/serverless.js` for the function).
5. **New:** `node scripts/ci/smoke-serverless.mjs` loads the function **through the platform's own entry file** (`api/[...path].js`) and serves it locally. It checks 14 things:
   - every asset the HTML shell references exists in the build;
   - the bundle resolves (no `ERR_MODULE_NOT_FOUND`);
   - `/api/health` is JSON from the backend;
   - readiness is hidden without its token, and reports degraded (503) without config;
   - a deeper `/api` path arriving through the rewrite reaches its route;
   - an unknown `/api` path is a JSON 404 that does not echo the query;
   - an unknown tRPC procedure is a 404 with `no-store`;
   - malformed JSON is a JSON 400 with no stack;
   - a non-JSON mutation is a 415;
   - an unsupported method is a JSON 404;
   - an unknown share token gets the HTML page, uncached;
   - every response carries a request id.

**Permissions and triggers (CI07).**
- `permissions: contents: read`.
- `pull_request` only (fork PRs get no secrets).
- No `pull_request_target` and no `workflow_run`.
- The test step reads three secrets *if* set. If they are set, they should point at a non-production project (owner action O8).

**Serialization (CI08).** CI cancels superseded runs per ref. That is safe because CI neither deploys nor migrates. Production migrations are applied by hand (see order below), one at a time, never from CI.

The staged `production-monitor.yml` has its own `concurrency` group and never cancels a run in progress.

## Release identity (CI09)

Every deployment answers `GET /api/health`, public and cheap:

```json
{"status":"ok","release":{"commit":"259ebdae5eab","deploymentId":"dpl_9rEUcQ7cTvdZEQA97aV8c5Smm4uF","environment":"production","region":"pdx1"},"time":"…"}
```

- Every API response carries `X-Request-Id`.
- Every request log line carries `release` (the commit).
- The client bundle carries its own build stamp: commit and build time, in `client/src/lib/buildStamp.ts`.
- **Schema state** is not in the manifest, because reading it costs a database call. Read it with:
  ```sql
  select version, name from supabase_migrations.schema_migrations order by version desc limit 5
  ```
  Latest on 14 Oct: `20261009045659 shared_rate_limit`. See *Migrations* for why the repository and the database disagree on version numbers.

## Rollout order (CI10, DB04)

For any change that touches both schema and code:
1. **Expand.**
   - Apply an additive, backward-compatible migration: a new table, column, function or grant. Nothing the running code depends on may change.
   - Test it first on a local copy. `supabase/prepared/backend_v1/validation/run.sh` and `docs/infrastructure-v2/probes/access-matrix.sh` show the pattern.
   - Apply in the Supabase SQL editor or with `apply_migration`, then **commit the same SQL** under `supabase/migrations/` with the version Supabase recorded.
2. **Backend.** Push code that can use the new shape but still tolerates the old one.
3. **Frontend.** It ships in the same deployment here, because client and function deploy together. Old browser tabs keep calling the previous procedures, so procedures are only *added* or widened, never renamed in one step.
4. **Verify.** Run `node scripts/ops/smoke-deploy.mjs https://sports-genome-local-b96d.vercel.app` and check `/api/health` shows the new commit. Watch the logs for `"outcome":"fault"` for 15 minutes (operations.md).
5. **Contract**, in a later release once no deployed code reads them: drop deprecated columns and functions.

Backfills (DB05) must be resumable and bounded: batches keyed by primary key, a checkpoint row, counts verified before any constraint is enforced. None exist in production today.

`shared_rate_limit` was applied this way: additive, tested twice on local Postgres 16 including a re-apply, applied, then grants verified.

## Smoke checks after a deploy (CI05, CI12, OBS06)

```sh
node scripts/ops/smoke-deploy.mjs https://sports-genome-local-b96d.vercel.app
HEALTH_CHECK_TOKEN=… node scripts/ops/smoke-deploy.mjs https://sports-genome-local-b96d.vercel.app   # adds the dependency check
```

The script is read-only, so it is safe to repeat and needs no test account and no cleanup. Its checks:
- the root shell and the six security headers;
- a nested app route;
- that the shell's entry chunk loads as JavaScript;
- a missing asset is a 404, not the shell, and is not cached for long;
- `/api/health` is backend JSON, `no-store`, with a request id;
- `/api/health/ready` reaches the function;
- unknown API path, unknown tRPC procedure and form-encoded mutation (415);
- an unknown share link opens the app, uncached.

It writes nothing. It calls no rate-limited procedure, because the 415 check is refused before tRPC. Its database contact is reads only: the share page's token lookup, and readiness when the token is given.

**Verified by hand in production**, through Vercel's fetch tool because the sandbox cannot reach the site directly, on `1dfbe68`, `4b4c3dc` and `259ebda`:
- health and release;
- missing asset is a 404 with `max-age=0`;
- unknown deep path is a JSON 404 without the query;
- unknown procedure is a 404;
- the share page is HTML with `no-store`;
- readiness is a JSON 404 without its token;
- tRPC reference data is a 200 from `pdx1`.

**Not done (CI12):** a write check. The app has no test account and writing into production share tables would leave synthetic rows. If one is wanted:
- create a share, read it, then disable it with its own manage secret;
- tag the snapshot as synthetic;
- delete the rows by token afterwards with the service key.

## Rollback (CI11, REC09)

**Application rollback** points production back at a previous deployment's build. No rebuild, about a second.
- **Hobby plans can roll back only to the immediately previous production deployment** (Vercel CLI docs). Older targets need **Promote** on that deployment, or a revert commit.
- Dashboard: Project → Deployments → the deployment → ⋯ → *Instant Rollback* (or *Promote*).
- CLI: `vercel rollback <deployment-id-or-url>`. Afterwards, `GET /api/health` must show the expected commit and deployment id.

**Known production deployments:**

| Deployment | Commit | What it is |
|---|---|---|
| `dpl_9rEUcQ7cTvdZEQA97aV8c5Smm4uF` | `259ebda` | Deeper /api paths reach the function |
| `dpl_8as3rgE2Z1qijMuHZFRKBZJ1Bdyh` | `4b4c3dc` | pdx1 region, breaker fix, patched express |
| `dpl_HXhxzXT1d3kXfCqmHRBdwjNf6hKH` | `1dfbe68` | First Infrastructure V2 release (iad1) |
| `dpl_Bdr1L3wcq8R331HuJKwYGMWzzpdS` | `d8ed33b` | Last release before Infrastructure V2 |

**Rolling back code does not undo database changes.** Every deployment above works with the current schema: `shared_rate_limit` is additive, and code without it simply never calls it. A deployment *older* than `1dfbe68` does not use the rate-limit table at all.

Database changes are rolled back by their own documented reverse SQL (each migration's header) or by a forward fix. **Never restore a whole database to undo a bad frontend release.** See recovery.md for the three kinds of recovery.

**Not exercised.** Running a rollback would move live traffic, so the procedure was not run against production. The owner can rehearse it in one minute: roll back, check `/api/health`, then promote the latest deployment again (O9).

## Migrations (DB01–DB11)

| Database | Framework | Repository | Applied | Drift |
|---|---|---|---|---|
| Supabase Postgres | Supabase migrations (SQL), applied through the dashboard or MCP | `supabase/migrations/`: **11 files** | **316** in `supabase_migrations.schema_migrations` | **Large.** Most production history was applied without a repository copy. Repository file versions also differ from the recorded ones (e.g. `20261008120000_shared_rate_limit.sql` was recorded as `20261009045659`). A `supabase db push` from this repository would try to re-apply them, so do not run it. |
| MySQL | Drizzle (`drizzle/`, 11 migrations) | 11 | unknown (no `DATABASE_URL` anywhere reachable) | Not active in production |

- **DB02 (one change, one history):** no schema change exists in both Drizzle and Supabase. The two databases own different tables.
- **Fix for the Supabase drift (owner, O7):** `supabase link --project-ref qiccnqkypbhlwpmjcsri && supabase db pull`. This writes the live schema as one baseline migration in `supabase/migrations/`. Commit it, and keep future changes as files named by the version Supabase records.
- **DB03/DB07/DB10:** each prepared or applied migration here was run against a local copy with synthetic rows, and re-applied to prove idempotence. Each states its rollback in its header.
  - `shared_rate_limit` takes no lock on existing tables (new objects only).
  - The seven prepared Backend V1 migrations take brief locks on four small tables. They are empty in production today: 0 auth users, 0 entries.
  - Reversibility: the grant revocation (SB-07) is reversible by re-granting; `client_op_id` (PS-09) adds a nullable column and a unique index, so its reversal drops data in that column only.
- **DB06:** the PS-09 unique index is on `(user_id, client_op_id)` where non-null. Today there are 0 rows, so there are no duplicates to reconcile. Re-check before applying if entries appear: `select user_id, client_op_id, count(*) from athlete_strength_entries where client_op_id is not null group by 1,2 having count(*) > 1`.
- **DB11:** no script defaults to production.
  - `drizzle.config.ts` throws without `DATABASE_URL`.
  - There is no `supabase/config.toml`, so the CLI must be linked deliberately.
  - The validation scripts create and drop their own local database.
  - The only hard-coded production URL in server code is a public share-preview image.

## Gaps (owner decisions)

- **G1. CI does not block production.** Options, in order of least disruption:
  1. Check *Project Settings → Deployment Checks* (or the equivalent "wait for checks" setting) in Vercel. If the plan offers it, require the CI job `Typecheck, test and build` before production promotion.
  2. Otherwise protect `main` in GitHub with that required check. Direct pushes by admins still bypass it, so sessions keep working, but merges through pull requests are gated.

  Until then, the monitor (operations.md) and instant rollback are the safety net.
- **G2.** Run the rollback rehearsal once (O9).
