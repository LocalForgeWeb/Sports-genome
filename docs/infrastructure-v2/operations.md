# Operations: signals, thresholds, limits, incidents

## Plans and limits that shape everything here (PERF09)

| Provider | Plan | How verified | What it means |
|---|---|---|---|
| Vercel (team `local-b96d`) | **Hobby** | The logs API refused a 4.5-hour-old window: "The hobby plan does not retain runtime logs for the requested time range… Hobby retains 1 hour" | Runtime logs live **1 hour**. Rollback only to the previous production deployment. One function region. No log drains. |
| Supabase (org `wbbftrhxpnoxjdlurxyg`) | **Free** | `get_organization` → `plan: free` | **No automatic backups** (recovery.md). **The project pauses after about 7 days of low database activity** (Supabase docs: warning email a week before; resume within 90 days). Database 64 MB used. |
| GitHub | public repository | GitHub API `visibility: public` | Actions minutes are free. Workflow artifacts and issues are public. |

No paid feature was enabled or assumed.

The upgrades that would buy something, for the owner to decide (none is needed today):

| Upgrade | Buys |
|---|---|
| Supabase Pro | Daily backups for 7 days, no pausing |
| Vercel Pro | 1-day log retention, rollback to any deployment |

## Signals (OBS01–OBS04)

Every request gets an id:
- the caller's own, if well-formed; otherwise Vercel's `x-vercel-id`; otherwise a new UUID;
- returned in `X-Request-Id`;
- carried by every log line below;
- error answers quote a short reference.

**Nothing logs a body, query string, cookie, IP address, token or user id.**

| Event (JSON line) | Level | Fields | Meaning |
|---|---|---|---|
| `http_request` | info, or error for 5xx | `requestId, release, category (trpc · share-page · api-other · health · other), procedures[], method, status, durationMs, outcome` | One per request (health 2xx omitted). `outcome`: `ok`, `refused` (4xx: bad input, not signed in, not found), `throttled` (429), `fault` (5xx). **Alerts key on `fault` only** (OBS04). |
| `{scope:"api", reference, procedure, code:"INTERNAL_SERVER_ERROR", failure[]}` | error | error class and driver code down the cause chain, never messages | A tRPC fault. `failure[].name = "TimeoutError"` means an upstream (Supabase) call ran past 8 s. |
| `http_fault` | error | `requestId, reference, category, name` | A fault outside tRPC (an Express route) |
| `rate_limited` | warn | `retryAfterSeconds` | A caller got 429 + `Retry-After` |
| `rate_limit_store_unavailable` | warn | `reason (timeout · <status> · error), pausedForMs` | The shared limiter failed open. `pausedForMs > 0` means three failures in a row; the store is skipped for a minute. |
| `config_missing` | warn | `missing[], environment` | Once per instance in production when a required name is absent |

Where the categories in OBS03 come from:

| Category | Source |
|---|---|
| Save failures | **Workouts save on the device.** Account sync of lifts goes browser → Supabase directly, so watch Supabase → Logs → API for `/rest/v1/athlete_strength_entries` with status ≥ 400. Today there are none: no users. |
| Authentication errors | Supabase → Logs → Auth (anonymous sign-ins). Server sign-in is dormant. |
| Database timeouts | the tRPC fault line with `TimeoutError` |
| Expensive-analysis latency | `durationMs` of `strengthProfile.muscleRanks`, `strengthPercentile.*`, `sportsGenome.profile` |
| Job failures | none: there are no jobs |
| Throttling | `outcome:"throttled"` / `rate_limited` |

**Reading them:**
- Vercel → Project → Logs, filtered by text (e.g. `"outcome":"fault"`).
- Or `vercel logs --project sports-genome` (request logs, 24 h).
- Runtime log lines last 1 hour on Hobby.

## Health (OBS05, OBS06)

| Path | Cost | Who | Answers |
|---|---|---|---|
| `GET /api/health` | none (no dependency call) | anyone | `{"status":"ok","release":{commit, deploymentId, environment, region}}`, `no-store` |
| `GET /api/health/ready` + header `x-health-token` | one 1-row Supabase read, 3 s budget | owner monitor | 200 `ready` or 503 `degraded` with `config.missingRequired` and `dependencies.supabase {ok, status, ms}`. **A JSON 404 without the right token, and while `HEALTH_CHECK_TOKEN` is unset (today).** |

Both are verified in production to come from the function, not the SPA: health on every release; readiness since `259ebda` (before that, Vercel's own 404).

## Synthetic monitoring and alerting (OBS07, OBS09, OBS10): staged

`.github/workflows/production-monitor.yml` runs `scripts/ops/smoke-deploy.mjs` against production: read-only, 19 checks, 20 with the health token.
- **On failure:**
  - opens **one** issue, `Production check failing`, labelled `production-monitor`, listing the failing checks, the run link and this runbook;
  - while it stays open, adds at most one "Still failing" comment every 6 hours.
- **On recovery:** comments "Recovered" and closes the issue.
- **The alert is GitHub's issue notification** (web and email) to the repository's owner and watchers. No new vendor.

**It is staged:** only manual dispatch is on. To turn it on (O5):
1. Set `HEALTH_CHECK_TOKEN` in Vercel (production) to a long random value, and redeploy (O3).
2. Add the same value as a GitHub Actions secret `HEALTH_CHECK_TOKEN`. This adds the dependency check.
3. GitHub → Actions → *Production monitor* → *Run workflow*. Expect a green run and no issue.
4. **Test delivery** with *Run workflow* and `base_url = https://sports-genome-local-b96d.vercel.app/does-not-exist`. Expect an issue and an email. Run again with the default URL; expect "Recovered" and closed.
5. Uncomment the `schedule` (`7,37 * * * *`, every 30 minutes) and push.

**Side benefit:** each run reads the database (share lookup; readiness with the token), which keeps the Free-plan project from pausing for inactivity.

**Cost:** free (public repository). The issues are public; they contain check names and the release commit only.

## Baseline and proposed thresholds (OBS08)

These are operational starting points from a small sample, not performance guarantees.

**Measured** (production, a single synthetic client through Vercel's fetch tool, `shares.get` for an unknown token: one limiter RPC plus one read):

| | `iad1` (`1dfbe68`) | `pdx1` (`4b4c3dc`) |
|---|---|---|
| warm | 720, 781, 909 ms | 320, 343 ms |
| cold (new instance) | 1,087 ms | 736, 745 ms |

The function used to run in Washington while the database is in Oregon. Moving it to Portland (`0337de7`) cut warm latency about 2.4×.

A new instance's first shared-limit call still runs past its 700 ms budget. That one call falls back to the local limit, and the next uses the shared one again (`pausedForMs: 0` in the logs).

**Proposed alert rules** (apply in whatever tool reads the logs; the monitor covers availability):

| Signal | Threshold | Why |
|---|---|---|
| monitor check fails | 1 run | availability: health, routing, assets, share page |
| `outcome:"fault"` | ≥ 5 in 10 min, or > 2% of tRPC requests in 15 min | baseline is 0 |
| tRPC `durationMs` p95 | > 2,000 ms for 15 min | about 6× the warm baseline, above cold starts |
| `rate_limit_store_unavailable` with `pausedForMs > 0` | ≥ 3 in 10 min | the shared limit is effectively off |
| `outcome:"throttled"` | > 100 in 10 min | abuse, or a limit set too low for a busy gym |
| `config_missing` | any | misconfigured deployment |

## Retention and sampling (OBS11)

- **Retention:** Vercel runtime logs **1 hour** on Hobby (measured). Supabase logs follow its own plan retention (check Supabase → Logs).
  - Because the log window is so short, the monitor's issue body is the durable record of what failed and when.
  - For longer evidence, the owner can paste the request id and reference from the issue or a user's report into Vercel logs **within the hour**, or upgrade (decision).
- **Sampling:** none. One line per request is cheap at this volume.
- **Sensitivity:** lines carry no personal data, so a longer retention would raise no privacy question.

## Resource limits in force (RL01–RL10, RUN01–RUN05, PERF03, PERF08)

| Limit | Value | Where |
|---|---|---|
| Request body | 4 MB (dev server too, was 50 MB) | `BODY_LIMIT`; 400 for malformed JSON, 413 for oversized |
| tRPC batch | 10 procedures; each costly one is counted on its own | `MAX_BATCH_SIZE` |
| Upstream call budget | 8 s per Supabase call; 3 s for readiness; 700 ms for the shared limiter | `upstreamFetch` |
| Costly public routes (share create/get/disable/mine, `supabaseExercise`, sport profile, muscle ranks, percentiles) | 120/min per instance **and** 600/min per address across instances | `rateLimit.ts`, `sharedRateLimit.ts` |
| Sign-in routes | 20/min per instance, 60/min across instances (dormant) | |
| Share creation | 12/min per instance, 30/min across instances | |
| `shares.mine` | ≤ 50 items | zod |
| Shared-limit storage | rows per (scope, hashed address, minute); deleted after 2 h in batches of 500 | migration `shared_rate_limit` |

Notes:
- **Per-address allowances are generous on purpose (RL05):** a gym or school shares one address, so they stop scripts, not a room.
- There are no account-based limits because there are no accounts in production.
- **Retries (RUN02, RUN03).** Exactly two layers retry, and neither multiplies the other:
  1. **Reads:** the browser's query client, `lib/queryRetry.ts`. At most 3 attempts, for network failures and 5xx only. Since this pass it never retries a 4xx: before, 400, 403 and 404 were retried; 429 since `f8d5b1b`.
  2. **Lift writes to the account:** the device's strength-sync outbox (`lib/strengthSyncQueue.ts`). It resends unacknowledged lifts on the next flush, and only a row-specific rejection gets the one-at-a-time retry.

  The server and the Supabase SDK do not retry. Until the prepared PS-09 migration adds `client_op_id`, a resend after a lost acknowledgement can land a lift twice (O1).
- **Connection pools (RUN04):** none. The server reaches Postgres only over Supabase's HTTP Data API, so serverless fan-out cannot exhaust database connections. The MySQL pool (Drizzle) is dormant.
- **Analysis vs. saving (RUN10):** workouts save on the device first. Ranks, percentiles and evidence are separate optional calls whose failure shows "unavailable" and never blocks a save. Unchanged here.

**Not limited, and worth a decision (RL08, RL09):**
- **Public reference routes:** `strengthGenome.referenceRows`, `powerliftingNorms`, `resilience.targetCatalog`, `researchEvidence.*`.
- **Database load is bounded:** each is served from an in-memory cache (1 h for norms, 5 min for the others), so Supabase sees at most one read per instance per window.
- **What is open is bandwidth and compute:** `referenceRows` is **1.17 MB** of JSON per call (measured in production). A scripted client could spend the Hobby plan's transfer allowance.

Options, cheapest first:
1. Put these under the local per-instance limit only (no database round trip added).
2. Cache them at the CDN with a versioned key (PERF05; needs the reference version in the URL).
3. Shrink the payload.

## Performance notes (PERF01–PERF10)

- **Measured:** the latencies above and the `referenceRows` payload (1.17 MB uncompressed; served with Brotli).
- **Not done:** a load test (PERF08). There is no staging project with a service key, and load against production is not authorized. If a staging project exists (O8):
  - run 5, 10 and 20 concurrent clients for 2 minutes each against `shares.get` and `strengthPercentile.forLift`;
  - record requests/second, p50/p95 and the fault rate;
  - stop if p95 exceeds 2 s or faults exceed 1%.
- **Cache headers (PERF06, PERF07):**
  - API and share pages are `no-store`, verified in production. A disabled share cannot survive in a cache, and link-preview fetches get the current state.
  - Hashed assets keep the platform default. The year-long `immutable` rule added and then removed in this pass also stuck to **missing** chunks' 404s, which would have pinned deploy-skew failures.
  - A missing chunk is a 404 with `max-age=0` (verified).
- **History endpoints (PERF03):** history lives on the device. Server list endpoints are protected and dormant.

## Incident steps

1. **What broke?**
   - Open the monitor issue, or run `node scripts/ops/smoke-deploy.mjs https://sports-genome-local-b96d.vercel.app` locally.
   - The failing check names the layer:
     - static shell or assets: the build or CDN;
     - `/api/health`: the function;
     - readiness: Supabase or configuration;
     - share page: Supabase reads.
2. **Which release?** `GET /api/health` → `release.commit`, `deploymentId`. Compare with the last good one in deployment.md.
3. **Read the evidence within the hour.**
   - Vercel → Logs, filtered by `"outcome":"fault"` or by `X-Request-Id` / reference.
   - A `TimeoutError` or `rate_limit_store_unavailable` burst points at Supabase. Then check the Supabase status page and whether the project is **paused** (Free plan).
4. **Restore service.**
   - **A bad release:** Instant Rollback (deployment.md). Seconds; the database is untouched.
   - **Supabase paused:** dashboard → *Resume project*.
   - **Supabase down:** wait. The app keeps logging on devices, and server features show "unavailable".
   - **The shared limiter misbehaving:** set `RATE_LIMIT_SHARED=off` in Vercel and redeploy. Per-instance limits stay.
5. **Were records preserved?** Workouts live on devices, so a server incident does not lose them. Lifts queued for account sync resend later. Check Supabase → API logs for failed writes during the window.
6. **Close.** The monitor closes its own issue on recovery. Add a line to the issue: cause, fix commit, and whether a database change was involved.
