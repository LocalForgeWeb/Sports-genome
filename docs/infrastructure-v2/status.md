# Infrastructure V2: requirement status

Brief: *Sports Genome — Website Infrastructure V2* (7 Oct 2026). Work: 8–14 Oct 2026, branch `claude/repo-access-il8zy5`, merged to `main` with the owner's standing authorization.

**Start.**
- Starting commit: `b74c9d3`, the brief's commit, fast-forwarded from `5a8b651`. No dirty files.
- Another workstream (`claude/vigilant-galileo-u91fr3`: Home day figures, exercise photos, `docs/exercise-photo-checklist`) pushes to `main` at the same time. Its files were not touched; `main` was merged in before every push.

**Commits.**

| Commit | What |
|---|---|
| `f8d5b1b` | Request layer, timeouts, shared rate limit, preview isolation, CI smoke |
| `1dfbe68` | No year-long cache on missing assets; smoke order |
| `0337de7` | Function in `pdx1`; limiter breaker |
| `4b4c3dc` | Express request-parsing dependencies patched |
| `259ebda` | Deeper `/api` paths reach the function; `.env.example` |
| the commit adding this file | Docs, probes, monitor workflow, backup script, query retry rule |

**Status vocabulary (BASE04).** Source code alone never counts as production.

| Status | Meaning |
|---|---|
| **verified existing** | Already true before this pass, checked now |
| **implemented + tested** | Changed here, proven by tests or a local run |
| **production verified** | Running in production and checked there |
| **staged** | Prepared and tested where possible; not running until the owner acts |
| **blocked** | Needs access or a decision only the owner has |
| **open** | A known gap with a recommendation |

Priority: **P0** data loss or security exposure · **P1** reliability or diagnosis · **P2** hygiene.

Owner actions `O1`–`O12` are defined at the end, each with steps and how to verify.

## Working discipline

| ID | Pri | Status | Evidence | Location | Owner action | Blocker |
|---|---|---|---|---|---|---|
| BASE01 | P1 | done | Read: Backend V1 handoff, status, gates and prepared migrations; Sep 28 regression notes; the Oct 7 status. No `CLAUDE.md`/`AGENTS.md` exists. | `docs/backend-v1/`, `docs/regression-sep28/` | — | — |
| BASE02 | P1 | done | Start and other workstream recorded above. Merged before every push; no shared files edited. | this file | — | — |
| BASE03 | P1 | done | This table | `docs/infrastructure-v2/status.md` | — | — |
| BASE04 | P1 | done | Vocabulary above; every row uses it | — | — | — |
| BASE05 | P1 | done | Defects reproduced before fixing: preview writes to production, the 200 HTML for a missing asset, the readiness 404, cold-start fail-open, 4xx retries. Dormant code marked, not deleted: MySQL/sign-in, analytics tag, unused `axios`/`streamdown`. | architecture.md | — | — |
| BASE06 | P1 | done | No schema or data contract changed. The only migration is additive. Client changes: the Supabase-client environment gate, the zod jitless flag, and the query retry rule. | — | — | — |
| BASE07 | P1 | done | No queue, cache vendor, monitoring vendor or microservice. Shared limits use the existing Postgres; monitoring and alerts use the existing GitHub Actions and Issues. | — | — | — |
| BASE08 | P0 | done | Logs carry no bodies, queries, cookies, addresses or ids (test `http.test.ts`). Secrets named, never printed. Evidence files hold synthetic data only. | `server/_core/http.ts` | — | — |

## Architecture and environments

| ID | Pri | Status | Evidence | Location | Owner action | Blocker |
|---|---|---|---|---|---|---|
| ENV01 | P1 | production verified | Service table with purpose, environment, owner, callers, failure behaviour and state. Read from the Vercel and Supabase APIs. | architecture.md | — | — |
| ENV02 | P1 | verified existing | Browser anonymous Supabase session → `auth.uid()` → `user_id` under RLS. Server cookie → MySQL (dormant). No mapping between them (D-012). | architecture.md | Decide the mapping before sign-in ships | product decision |
| ENV03 | P1 | production verified | Names and classes only; Vercel env read without decrypting | architecture.md, `server/_core/config.ts` | — | — |
| ENV04 | P1 | production verified | `config_missing` log line, readiness `missingRequired`, features answer "unavailable"; no demo mode | `server/_core/config.ts`, `http.ts` | — | — |
| ENV05 | P0 | **production verified** (defect fixed) | Before: every preview and local build fell back to the production URL and key, so visitors signed in anonymously and wrote to production. Now only production builds use the defaults. The service key targets production only (env API). | `client/src/lib/supabaseClient.ts`, `supabaseClient.environment.test.ts` | O8 (staging project) | — |
| ENV06 | P2 | implemented + tested | Synthetic A/B athletes in local databases created and dropped per run; no production records copied | `supabase/prepared/backend_v1/validation/seed.sql`, `probes/access-matrix.sh` | — | — |
| ENV07 | P1 | production verified | Node 24 in CI and on Vercel; `engines >=22 <25`; pnpm 10.4.1 from `packageManager` only (stray devDependency removed); frozen lockfile | `package.json`, `ci.yml` | — | — |
| ENV08 | P2 | implemented | Every server name explained, no values | `.env.example` | — | — |
| ENV09 | P1 | production verified | No Vercel crons, no `pg_cron`/`pg_net`, no scheduled workflows. The monitor schedule is deliberately commented out. | architecture.md | — | — |

## Deployment

| ID | Pri | Status | Evidence | Location | Owner action | Blocker |
|---|---|---|---|---|---|---|
| CI01 | P1 | verified existing + extended | `ci.yml` existed (typecheck, test, build). Added the built-function smoke test, without duplicating jobs. | `.github/workflows/ci.yml` | — | — |
| CI02 | P1 | verified existing | `pnpm install --frozen-lockfile`, pnpm from `packageManager` | `ci.yml` | — | — |
| CI03 | P1 | verified existing, **not gating** | All steps run as required steps. But `main` is unprotected and Vercel deploys regardless. | deployment.md (G1) | **O11** | owner setting |
| CI04 | P0 | implemented + tested | `scripts/ci/smoke-serverless.mjs`: 14 checks through `api/[...path].js` | `scripts/ci/` | — | — |
| CI05 | P1 | production verified | Root, nested route, health, unknown API (single and deep), unknown procedure, readiness, share token and missing asset, checked in production. Unsupported method and 415 checked in the built-function smoke. | deployment.md | — | — |
| CI06 | P0 | **production verified** (defect fixed) | A missing `/assets/*.js` returned 200 HTML. Now a 404 with `max-age=0`. The year-long immutable rule added here was removed after it stuck to 404s. | `vercel.json`, `1dfbe68` | — | — |
| CI07 | P1 | verified existing | `contents: read`; `pull_request` only, no `pull_request_target`. The monitor alone holds `issues: write`. | workflows | O8 (CI secrets → non-prod) | — |
| CI08 | P2 | verified existing | CI cancels superseded runs but neither deploys nor migrates. The monitor never cancels a run in progress. Migrations are manual and one at a time. | deployment.md | — | — |
| CI09 | P1 | production verified | `/api/health` release `{commit, deploymentId, environment, region}`; `release` in every log line; schema state by query | deployment.md | — | — |
| CI10 | P1 | done | Expand → backend → frontend → verify → contract | deployment.md | — | — |
| CI11 | P1 | staged | Procedure with deployment IDs; Hobby limits rollback to the previous deployment; code rollback does not undo schema. Not exercised (it would move live traffic). | deployment.md | **O9** | owner go-ahead |
| CI12 | P1 | implemented + production verified (read-only) | `scripts/ops/smoke-deploy.mjs`, safe to repeat. No write check (no test account); design noted. | `scripts/ops/` | — | — |

## Database and migrations

| ID | Pri | Status | Evidence | Location | Owner action | Blocker |
|---|---|---|---|---|---|---|
| DB01 | P1 | production verified, **drift open** | 316 applied vs 11 files; recorded versions differ from file names | deployment.md | **O7** | DB password (`supabase link`) |
| DB02 | P2 | verified existing | Drizzle owns MySQL tables, Supabase owns Postgres; no overlap | deployment.md | — | — |
| DB03 | P1 | implemented + tested | Prepared migrations and `shared_rate_limit` run on a live-equivalent copy with synthetic rows, then re-applied | `evidence/v1-validation-rehearsal.txt` | — | — |
| DB04 | P1 | done | Pattern documented. The one migration applied here is additive; old code ignores it. | deployment.md | — | — |
| DB05 | P2 | n/a today | No backfills exist; rules written | deployment.md | — | — |
| DB06 | P1 | verified | PS-09 unique index: 0 rows today; duplicate query provided | deployment.md | Run the query before O1 if rows appear | — |
| DB07 | P2 | done | Lock and transaction notes per migration; `shared_rate_limit` locks nothing existing | deployment.md | — | — |
| DB08 | P1 | verified existing | Foreign keys, ownership policies and domain checks read from production; no new scientific limits | security-verification.md | — | — |
| DB09 | P1 | verified existing | Backend V1 idempotency and correction contracts untouched (PS-09 prepared); the access matrix covers ownership | — | O1 | — |
| DB10 | P1 | done | Each migration states its rollback; PS-09 reversal noted as dropping that column's data | deployment.md | — | — |
| DB11 | P0 | verified existing | Drizzle throws without `DATABASE_URL`; no linked Supabase config; validation scripts are local-only | deployment.md | — | — |

## Authorization and secrets

| ID | Pri | Status | Evidence | Location | Owner action | Blocker |
|---|---|---|---|---|---|---|
| SEC01 | P0 | implemented + tested (local copy); production read-only | 19/19 A/B/anon checks with guessed ids and ownership moves, before and after the prepared migrations. Production checks are read-only (tables empty). | `probes/access-matrix.*`, `evidence/access-matrix.txt` | O1 | — |
| SEC02 | P0 | production verified, **holes open** | Grants and RLS read separately; 228 TRUNCATE/TRIGGER/REFERENCES grants to client roles (SB-07) | security-verification.md | **O1** | owner authorization |
| SEC03 | P1 | production verified | `sg_rate_limit_hit` service-only, `search_path=''`. `get_strength_input_contract_v2` reviewed: read-only catalog, low risk. | security-verification.md | O10 (optional) | — |
| SEC04 | P1 | verified existing | Authorization keys only on `auth.uid()` or the server's own session lookup | — | — | — |
| SEC05 | P0 | implemented + tested (local copy) | Ownership move refused (live) or pinned by trigger (after migrations); legitimate updates work | `evidence/access-matrix.txt` | O1 | — |
| SEC06 | P0 | done | Scanner over bundle, tree and history; bundle and tree clean; 3 history locations | `scripts/ops/secret-scan.mjs` | O2 | — |
| SEC07 | P0 | **blocked** | `sb_secret_JZQ1…` in public history (`0d46326629`); unknown whether ever real. Rotation plan written; nothing revoked. | security-verification.md | **O2** | owner dashboard access |
| SEC08 | P1 | production verified | One public bucket of brand assets; no private media, uploads or signed links exist | security-verification.md | — | — |
| SEC09 | P1 | verified existing | `HttpOnly`/`Secure` cookie (dormant); JSON-only mutations (415) against CSRF; one trusted proxy hop | security-verification.md | Consider `SameSite=Lax` before sign-in ships | — |
| SEC10 | P1 | production verified (report-only) | Origins mapped; enforced in headless Chromium with 0 violations; shipped as report-only | `vercel.json`, `evidence/csp-violations.json` | **O6** | — |
| SEC11 | P0 | **production verified** (defect fixed) | Request-path packages patched (qs DoS reachable; critical proxy-addr advisory removed); remaining advisories unreachable | `4b4c3dc` | — | — |
| SEC12 | P1 | production verified | Readiness needs its token (404 otherwise, verified). No admin actions exist. | `http.ts` | O3 | — |

## Rate limits and cost controls

| ID | Pri | Status | Evidence | Location | Owner action | Blocker |
|---|---|---|---|---|---|---|
| RL01 | P1 | done | Route inventory: costly, sign-in, share creation, public reference | operations.md | — | — |
| RL02 | P0 | **production verified** | One Postgres counter per (scope, hashed address, minute); production rows appear per call with 32-hex buckets and no address | `sharedRateLimit.ts`, migration `20261009045659` | — | — |
| RL03 | P0 | implemented + tested | Four separate server processes on the real bundle allowed 30 together (shared) vs 48 per-instance; 200 concurrent calls allowed exactly 120 of 120 | `probes/shared-rate-limit.mjs`, `evidence/shared-rate-limit.json` | — | — |
| RL04 | P1 | tested; production consistent | `req.ip` behind one trusted hop; spoofed `X-Forwarded-For` prefix ignored (test). Vercel overwrites XFF (docs). | `sharedRateLimit.test.ts` | — | — |
| RL05 | P2 | done | Generous per-address allowances for shared networks; no accounts to combine with | operations.md | — | — |
| RL06 | P1 | **production verified** (defect fixed) | Windows, expiry and cleanup documented. Fail-open; the breaker now needs 3 failures in a row (a single cold-start timeout had disabled the shared limit for a minute; `pausedForMs: 0` seen in production after the fix). | `sharedRateLimit.ts`, `0337de7` | — | — |
| RL07 | P1 | implemented + tested | 429 + `Retry-After`; the client never retries a 4xx | `rateLimit.ts`, `lib/queryRetry.ts` | — | — |
| RL08 | P1 | partial | Body 4 MB, batch 10, `shares.mine` ≤ 50 enforced. `referenceRows` 1.17 MB per call is unlimited. | operations.md | **O12** | decision |
| RL09 | P1 | **open** | Public reference routes cached in memory (database load bounded), but not rate-limited (bandwidth) | operations.md | **O12** | decision |
| RL10 | P1 | implemented + tested | Buckets are HMAC(service key, address); no raw address, token or password stored or logged; `rate_limited` and `throttled` counts | `sharedRateLimit.test.ts` | — | — |

## Runtime

| ID | Pri | Status | Evidence | Location | Owner action | Blocker |
|---|---|---|---|---|---|---|
| RUN01 | P0 | **production verified** | Every server Supabase call has an 8 s budget (readiness 3 s, limiter 700 ms) and honours the caller's signal | `upstreamFetch` | — | — |
| RUN02 | P1 | implemented + tested | Browser retries only network failures and 5xx (≤ 3); the outbox resends only unacknowledged lifts | `lib/queryRetry.ts` | O1 (PS-09 dedupe) | — |
| RUN03 | P1 | done | Two retry layers, reads vs lift writes; server and SDK do not retry | operations.md | — | — |
| RUN04 | P2 | verified existing | No SQL pool in production (HTTP Data API); MySQL pool dormant | operations.md | — | — |
| RUN05 | P0 | **production verified** | JSON 400/413/500 with a reference; no stack, SQL or URL; one handler for both entry points | `http.ts`, smoke tests | — | — |
| RUN06 | P1 | production verified | tRPC keeps its codes; share page HTML; API 404 JSON; throttling is 429, not sign-out | smoke tests | — | — |
| RUN07 | P0 | **production verified** (defect fixed) | Deeper `/api` paths reached Vercel's text 404 (readiness unreachable). Now rewritten with a validated carrier; dot-segments refused; carriers select routes, never privileges. | `259ebda`, `apiDeployment.test.ts` | — | — |
| RUN08 | P2 | n/a | No scheduled or background jobs exist | architecture.md | — | — |
| RUN09 | P2 | n/a | Same | — | — | — |
| RUN10 | P1 | verified existing | Saving is device-first; analysis calls fail to "unavailable" | operations.md | — | — |

## Observability

| ID | Pri | Status | Evidence | Location | Owner action | Blocker |
|---|---|---|---|---|---|---|
| OBS01 | P1 | production verified | `X-Request-Id` on every response; error answers carry a reference | `http.ts` | — | — |
| OBS02 | P1 | production verified | `http_request` lines seen in production with release, category, procedures, duration and outcome | operations.md | — | — |
| OBS03 | P1 | done | Source per category (server logs vs Supabase API/Auth logs) | operations.md | — | — |
| OBS04 | P1 | production verified | `outcome` separates refused/throttled from fault | `http.ts` | — | — |
| OBS05 | P1 | production verified | Cheap public liveness; token-gated readiness | `http.ts` | O3 | — |
| OBS06 | P0 | **production verified** (defect fixed) | Health is JSON from the function; readiness was the platform 404 until `259ebda` | smoke scripts | — | — |
| OBS07 | P1 | staged | Read-only synthetic monitor workflow (manual only) | `production-monitor.yml` | **O5** | owner approval |
| OBS08 | P1 | done | Thresholds from measured baseline, stated as starting points | operations.md | — | — |
| OBS09 | P1 | **staged** | GitHub issue notifications as the destination; delivery test steps written; not run (would open a public issue) | operations.md | **O5** | owner approval |
| OBS10 | P1 | staged | One issue per incident, a reminder at most every 6 h, recovery close, runbook link | `production-monitor.yml` | O5 | — |
| OBS11 | P1 | production verified | Hobby keeps runtime logs 1 hour (measured); no sampling; no personal data in lines | operations.md | Upgrade only if needed | — |

## Backup and recovery

| ID | Pri | Status | Evidence | Location | Owner action | Blocker |
|---|---|---|---|---|---|---|
| REC01 | P0 | done | Inventory, including device-only workout history and the media bucket's only copy | recovery.md | — | — |
| REC02 | P0 | production verified: **no backups exist** | Free plan (API) + Supabase docs | recovery.md | **O4** | DB password |
| REC03 | P1 | proposed | RPO/RTO per data class, for the owner to confirm | recovery.md | confirm | decision |
| REC04 | P0 | staged | `scripts/ops/backup.sh`: dump + media + checksums + AES-256; tested end to end with stand-ins; not run on production | `scripts/ops/` | **O4** | DB password |
| REC05 | P0 | partial | Schema-level rehearsal: live-equivalent copy + synthetic records + 19 ownership checks pass in isolation. A real dump restore needs O4. | `evidence/` | O4 | — |
| REC06 | P1 | done | Nothing outbound exists in the data (no cron, net, webhooks or email); the restore steps check it | recovery.md | — | — |
| REC07 | P1 | done | Every place the project host is written; auth-id caveat | recovery.md | — | — |
| REC08 | P1 | done | Recent writes, outbox resends, soft-disabled shares, future tombstones | recovery.md | — | — |
| REC09 | P1 | done | Application rollback vs data repair vs full restore | recovery.md, deployment.md | — | — |
| REC10 | P0 | partial | 920 ms schema rehearsal measured; production restore time unmeasured | `evidence/v1-validation-rehearsal.txt` | O4 | — |

## Performance and cost

| ID | Pri | Status | Evidence | Location | Owner action | Blocker |
|---|---|---|---|---|---|---|
| PERF01 | P1 | measured (small sample) | Latency before/after region move; 1.17 MB payload; one limiter RPC plus one read per costly call | operations.md | — | — |
| PERF02 | P2 | not done | No slow query identified; plans need staging data | — | O8 | staging |
| PERF03 | P2 | verified existing | History is on the device; server list endpoints are bounded or dormant | operations.md | — | — |
| PERF04 | P1 | **production verified** | The region move removed a cross-country round trip from every server Supabase call: warm 720–909 ms → 320–343 ms; same outputs | `0337de7` | — | — |
| PERF05 | P2 | verified existing | Public reference data cached per instance with TTLs; no private data in any shared cache | operations.md | O12 | — |
| PERF06 | P0 | production verified | API and share pages `no-store`; disabled shares cannot linger in caches | smoke scripts | — | — |
| PERF07 | P1 | **production verified** (defect avoided) | Hashed assets on the platform default; missing chunks `max-age=0`; HTML revalidates | `vercel.json` | — | — |
| PERF08 | P2 | not done | Load test plan written; no staging, and production load not authorized | operations.md | O8 | staging |
| PERF09 | P1 | production verified | Vercel Hobby, Supabase Free, public GitHub: all read from the providers; upgrades listed as decisions | operations.md | decide | — |
| PERF10 | P1 | done | Signals for expensive routes; optional analysis is already separated from saving | operations.md | — | — |

## Release verification (section 12 of the brief)

| Scenario | Result | Where |
|---|---|---|
| Clean clone/build | Frozen install (offline) + tsc + 3,098 tests + build + smoke pass | CI, this pass |
| Preview deployment | SPA, API, deep API, share, missing asset and errors verified on previews `mlvbehoce`, `duq3p9ryy`, `mefnzaw9c`, `pp6i6ogpe` | deployment.md |
| User A guesses user B ids | Denied through RLS on the live-equivalent copy (19/19); production read-only paths denied | security-verification.md |
| Two rate-limit instances | 4 processes: 30 shared vs 48 per-instance | `evidence/shared-rate-limit.json` |
| Upstream analysis outage | 8 s budgets; analysis answers "unavailable"; device saving unaffected; limiter fails open (tests) | `http.test.ts`, `sharedRateLimit.test.ts` |
| Large/malformed requests | 413 / 400 JSON, no crash (smoke) | `smoke-serverless.mjs` |
| Backfill interrupted | n/a: no backfills | — |
| Old frontend during rollout | Only additive server changes; procedures unchanged | — |
| Restore rehearsal | Schema + synthetic records + ownership in isolation: pass. Real dump: O4. | recovery.md |
| Application rollback | Procedure written; every listed deployment works with today's schema. Not exercised: O9. | deployment.md |

| ID | Status | Evidence |
|---|---|---|
| QA01 | done | Probes and scripts kept: `docs/infrastructure-v2/probes/`, `scripts/ci/`, `scripts/ops/`; outputs in `evidence/` |
| QA02 | done | Each table above says local / preview / production |
| QA03 | partial | Re-checked on the final build:<br>• the full unit and render suite (3,098 tests) passes after every merge;<br>• the CSP probe, run in headless Chromium at 390 px with the policy **enforced**, opened nine workspaces, an exercise detail, a share link and the first-launch intro. No violations.<br>The probe checks that screens load under the policy, not their content. The product briefs' journey probes were not re-run. The UI changed in only two ways: the client environment gate (production unchanged) and the retry rule. |
| QA04 | done | Local databases dropped by their scripts. Stand-in servers stopped. No preview credentials created. Production rate-limit rows from the checks expire in 2 h. No synthetic production records written. |
| QA05 | done | Tests stopped at the changed contracts |

## Completion

| ID | Status |
|---|---|
| DONE01 | Benefits supported by results: see *Summary*. |
| DONE02 | Defects fixed are marked "(defect fixed)" above. Preventive hardening and already-satisfied rows are marked separately. |
| DONE03 | No iOS code, subscription work, product dashboard or second sync layer. |
| DONE04 | One production migration applied: additive `shared_rate_limit`, under the standing authorization to deploy. No destructive migration, no paid change, no credential revoked, no public rollout beyond the authorized pushes to `main`. |
| DONE05 | Every production-access dependency is an owner action below, with steps and verification. |
| DONE06 | See *Summary*: running vs staged vs ready. |

## Summary

**Running in production, verified there:**
- **Preview isolation.** Previews can no longer write to production.
- **One request layer.** Request ids, structured logs, JSON errors, 4 MB bodies, 8 s upstream budgets.
- **Shared rate limits.** The breaker is fixed.
- **The API runs beside its database.** About 2.4× faster warm calls.
- **Missing assets.** A missing asset is a 404, not the app shell.
- **Readiness reachable.** `/api/health/ready` reaches the function.
- **Request-path packages patched.**
- **CSP and Permissions-Policy.** Both headers are sent; the CSP is report-only.

**Implemented and tested, not production-specific:**
- CI smoke of the built function;
- post-deploy smoke script;
- secret scanner;
- access-matrix probe;
- query retry rule (ships with the docs commit);
- `.env.example`.

**Staged, waiting on the owner:**
- the production monitor and its alerts (O3, O5);
- the backup script (O4);
- CSP enforcement (O6);
- the Backend V1 migrations (O1).

**Not done:**
- load test and query plans (no staging);
- rollback rehearsal (O9);
- write smoke check;
- real backup restore (O4).

## Owner actions

Each action lists what it does, its steps, how to verify, and how to roll back.

### O1 · P0 · Apply the seven prepared Backend V1 migrations

**Effect.** Closes SB-07, SB-02, SB-03, SB-04, SB-06, PS-09 and PS-14. The athlete tables are empty, so no data changes.

**Steps.**
1. In Supabase → SQL editor, run each file in `supabase/prepared/backend_v1/` in name order.
2. Commit each under `supabase/migrations/` with the version Supabase records.

**Verify.**
```sql
select count(*) from information_schema.role_table_grants
where grantee in ('anon','authenticated')
  and privilege_type in ('TRUNCATE','TRIGGER','REFERENCES')
  and table_schema = 'public';
```
This must return 0. Also check that the `client_op_id` column exists on `athlete_strength_entries`, and re-run the read-only checks in security-verification.md.

**Rollback.** Each file's header.

### O2 · P0 · Confirm or rotate the key behind `sb_secret_JZQ1…`

**Steps.** Compare its prefix in Supabase → API Keys.
- If it matches a key: create a new secret key, put it in Vercel `SUPABASE_SERVICE_ROLE_KEY` (production), redeploy, verify, then revoke the old key.
- If it matches nothing: record "never real" here.

**Verify.** `/api/health/ready` is 200 with the new key, and the old key gets 401 from `/rest/v1/`.

### O3 · P1 · Set `HEALTH_CHECK_TOKEN`

**Steps.** Vercel → Settings → Environment Variables → Production → a long random value → redeploy.

**Verify.** With the header `x-health-token`, the endpoint returns 200 and `"status":"ready"`:
```sh
curl -H 'x-health-token: …' https://sports-genome-local-b96d.vercel.app/api/health/ready
```
Without the header it is a JSON 404.

### O4 · P0 · First backup and restore rehearsal

**Steps.**
1. Run, then keep the file privately:
   ```sh
   SUPABASE_DB_URL='<session pooler string>' sh scripts/ops/backup.sh ~/sports-genome-backups
   ```
2. Restore it into `supabase start` locally, per recovery.md.

**Verify.**
- The table counts match production.
- `COPY auth.users` is present in the dump.
- The per-step times are recorded in `evidence/restore-<date>.txt`.

**Repeat.** Weekly, or as often as the targets in recovery.md require.

### O5 · P1 · Turn on the production monitor

**Steps.** O3, then the steps in operations.md: add the secret, run, run the delivery test, uncomment `schedule`.

**Verify.**
- The delivery test opens an issue and emails.
- The next run closes it.
- Scheduled runs appear every 30 minutes.

This also keeps the Free project from pausing.

### O5b · P2 · Keep a second copy of the 12 media files

**Options.** Commit them under `client/public/brand/` from the backup. Or rely on O4.

**Verify.** `git ls-files | grep intro-source` (if committed).

### O6 · P1 · Enforce the CSP

**Steps.**
1. In `vercel.json`, rename `Content-Security-Policy-Report-Only` to `Content-Security-Policy`, merging in `frame-ancestors 'none'`.
2. On the preview, open the main screens and a share link.

**Verify.** No "Refused to…" console errors on any screen.

**Rollback.** Rename it back.

### O7 · P1 · Make the repository the migration history

**Steps.**
```sh
supabase link --project-ref qiccnqkypbhlwpmjcsri && supabase db pull
```
Commit the baseline. From then on, one file per change.

**Verify.** `supabase migration list` shows local and remote aligned.

### O8 · P2 · A staging project for CI and load tests

**Steps.**
1. Create a free Supabase project for staging.
2. Point the CI secrets and the preview/development `VITE_SUPABASE_URL` at it.
3. Load it from O4's dump with the athlete tables emptied.

**Verify.**
- The CI live tests run, not skip.
- The preview `/api/health/ready` reports the staging host.

### O9 · P1 · Rollback rehearsal

**Steps.** Vercel → Deployments → the previous production deployment → Instant Rollback. Check `/api/health`, then promote the latest deployment again.

**Verify.** The commit changes and then returns. About a minute.

### O10 · P2 (optional) · Revoke a function from signed-in clients

**Steps.**
```sql
revoke execute on function public.get_strength_input_contract_v2(uuid) from authenticated;
```
No client in this repository calls it.

**Verify.** The advisor WARN is gone.

**Rollback.** `grant execute … to authenticated`.

### O11 · P1 · Gate production on CI

**Steps.** In Vercel, require the `Typecheck, test and build` check before production, if the plan offers it. Otherwise protect `main` with that check.

**Verify.** A deliberately failing branch cannot reach production.

### O12 · P2 · Decide limits for public reference routes

**Options.** A per-instance limit on `referenceRows`, `powerliftingNorms`, `targetCatalog` and `researchEvidence.*`; CDN caching with a versioned key; or a smaller payload.

**Verify.** Repeated calls from one address get 429 past the chosen limit.
