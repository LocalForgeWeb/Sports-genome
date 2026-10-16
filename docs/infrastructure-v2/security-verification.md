# Security verification

No secret value appears in this document. Keys are named by kind and location, never by value.

## How it was tested

| Where | What | Limits |
|---|---|---|
| **Production, read-only** (14 Oct) | Role simulation inside one transaction via `set local role` + JWT claims; SELECT only | The athlete tables are **empty** in production (0 auth users, 0 profiles, 0 entries), so "0 rows" there proves the grant path, not row isolation. Two write tests were attempted on 8 Oct: the tool timed out, nothing persisted (counts re-read as 0, no session left running), and they were not retried. |
| **Live-equivalent local copy** (PostgreSQL 16.15) | `supabase/prepared/backend_v1/validation/bootstrap.sql` recreates, from the live catalog, the tables, grants, policies and triggers of the athlete tables. Two synthetic athletes A and B. `docs/infrastructure-v2/probes/access-matrix.sh` runs 19 checks on the schema as live and again after the prepared migrations. | A copy, not production. It covers the four athlete tables the V1 findings touch (entries, states, focus areas, check-ins). |
| **Server** | Unit and integration tests; the built-function smoke test; requests to production | |

## Access matrix

### Row isolation with data present (local live-equivalent copy, `evidence/access-matrix.txt`)

| # | Actor | Attempt | As live today | After prepared V1 migrations |
|---|---|---|---|---|
| 1 | B | read A's strength entries | 0 rows ✅ | 0 rows ✅ |
| 2 | B | correct A's entry | 0 rows ✅ | 0 rows ✅ |
| 3 | B | delete A's entry | 0 rows ✅ | 0 rows ✅ |
| 4 + 17 | B | insert an entry naming A as owner | accepted, **stored as B's**: the insert trigger sets `user_id = auth.uid()`; 0 rows owned by A ✅ | same ✅ |
| 5, 6 | B | read / change A's focus area (guessed id) | 0 rows ✅ | 0 rows ✅ |
| 7 | B | read A's strength state | 0 rows ✅ | 0 rows ✅ |
| 8 + 18 | A | move own entry to B | refused `42501` (WITH CHECK) ✅ | accepted, but **owner stays A** (the SB-03 trigger pins `user_id`) ✅ |
| 9 + 19 | A | move own focus area to B | refused `42501` ✅ | refused `42501` ✅ |
| 10–12 | A | read and correct own rows (control) | allowed ✅ | allowed ✅ |
| 13 | anon | read strength entries | refused `42501` ✅ | refused ✅ |
| 14 | anon | read focus areas | 0 rows ✅ | 0 rows ✅ |
| 15 | anon | insert a focus area for A | refused `42501` ✅ | refused ✅ |
| 16 | anon | write a strength state | refused `42501` ✅ | refused ✅ |

On the first run, checks 4 and 8 "failed": the database accepted the statement. Reading the triggers showed the owner was pinned, so the probe now asserts **where the row ended up** (17–19), not whether the statement ran.

### Production, read-only (14 Oct)

| Actor | Table | Result |
|---|---|---|
| anon | `workout_shares` (2 rows exist) | denied `42501` |
| signed-in stranger | `workout_shares` | denied `42501`. Shares are reachable only through the server, by token. |
| anon | `athlete_profiles` | denied `42501` |
| signed-in stranger | `athlete_profiles`, `athlete_strength_entries`, `athlete_strength_states` | 0 rows (tables empty; see limits) |
| anon | `athlete_focus_areas`, `athlete_training_constraints` | 0 rows. anon holds grants, but every policy targets `authenticated`. |
| anon | `strength_norms` | denied `42501` (no anon grant) |
| signed-in | `strength_norms` | 3,512 rows. Reference data, intentionally public to signed-in clients. |
| anon / authenticated | `public.sg_rate_limit_hit`, `private.rate_limit_windows` | no execute, no select (verified with `has_function_privilege` / `has_table_privilege`); service role only |

**Policies read from production (SEC02, SEC05).**
- Every athlete table's policies are `TO authenticated` with `auth.uid() = user_id`: USING for select, update and delete; WITH CHECK for insert and update.
- `athlete_strength_states` has select and insert policies only.
- Public reference data is separated by grant and policy: `strength_norms` is select for signed-in users; `workout_shares` is server-only.

### Server paths

| Path | Who | Check |
|---|---|---|
| `protectedProcedure` routes (workout log, repair, plans, favourites, strength genome account data) | signed-in MySQL user | `ctx.user` from the session cookie; every query is scoped to `ctx.user.id`. In production no user can exist (no `DATABASE_URL`), so all answer UNAUTHORIZED. |
| `shares.*` | anyone, rate-limited | Read by token. Disable and list require the manage secret, sent in POST bodies only. |
| `/api/health/ready` (SEC12) | owner monitor | `x-health-token` must equal `HEALTH_CHECK_TOKEN`. Otherwise it is a JSON 404, including when the token is unset (today). Verified in production on `259ebda`. |
| Rewrite carriers `__trpc`, `__api`, `__sharePage` (RUN07) | anyone | They only rebuild a path. `__api` accepts plain segments only: dot-segments and empty segments are refused (test in `server/apiDeployment.test.ts`). Every route still applies its own checks; a carried path cannot reach readiness without the token. |

There are no admin actions in the API.

## Findings still open in production (owner action O1)

The seven Backend V1 holes are **still open in production**. The validation re-run on 14 Oct (`evidence/v1-validation-rehearsal.txt`, 920 ms) shows each one open on the live-equivalent copy and closed after the prepared migrations, with legitimate writes still working:

| Finding | Exploit on the live schema | Fix (prepared, not applied) |
|---|---|---|
| SB-07 | anon can TRUNCATE a reference table and a user table. RLS does not cover TRUNCATE. **228 TRUNCATE/TRIGGER/REFERENCES grants** to anon/authenticated in `public` (counted 8 Oct). | `20260928120000_backend_v1_table_grants.sql` |
| SB-02 | B attaches a check-in to A's focus area | `…120100_child_ownership.sql` |
| SB-03 | A rewrites sex/body weight on a stored entry, and the pool copies it | `…120200_entry_context_immutable.sql` |
| SB-04 | A writes a strength state directly | `…120300_states_server_only.sql` |
| SB-06 | anon cannot read even approved mappings | `…120400_approved_mappings_read.sql` |
| PS-09 | the same lift lands twice | `…120500_entry_client_op_id.sql` |
| PS-14 | a general athlete's lift is refused | `…120600_entry_sport_optional.sql` |

**Impact today:** no personal record is exposed, because the athlete tables are empty. The risk grows with the first real athlete.

**Steps:** see O1 in status.md. Apply the seven files in order in the Supabase SQL editor, then re-run the production read-only checks above.

**Rollback:**
- the grants file is reversed by re-granting;
- the others drop their trigger, policy or column (each file's header).

## Secret scan (SEC06, SEC07)

`node scripts/ops/secret-scan.mjs` scans:
- the built bundle (`dist/public`), including source maps (none are produced);
- every tracked file;
- every added line in git history.

It prints locations and kinds only.

| Where | Result |
|---|---|
| Built bundle | none. The Supabase **publishable** key is in the bundle by design and is not a secret. |
| Tracked files | none. Two secret-shaped test fixtures were replaced with `sb_secret_TESTONLY…` in `f8d5b1b`. |
| History | 3 locations, all `sb_secret_…` shapes: `0d46326629 server/supabaseServiceHeaders.test.ts` (32 characters, beginning `sb_secret_JZQ1`); `221688dc3e` and `a9052aca6d server/normsRegistryConnection.test.ts` (`sb_secret_abcdef…`, synthetic, used to test redaction) |

**The repository is public** (GitHub API, 14 Oct), so the `0d46326629` value (committed 23 Sept) is readable by anyone. Nothing shows whether it was a real key. **Owner action O2:**
1. In Supabase → Project Settings → API Keys, compare the secret keys' visible prefixes with `sb_secret_JZQ1`.
2. If one matches, create a new secret key, set it as `SUPABASE_SERVICE_ROLE_KEY` in Vercel (production), redeploy, check `/api/health/ready` is ready, **then** revoke the old key.
3. History cannot be cleaned by deleting the line. Rotation is the fix.

**Verification:** the old key gets 401 from `/rest/v1/`; production readiness is 200 with the new key.

## Other controls

| Control | State | Evidence |
|---|---|---|
| Cookies (SEC09) | The session cookie `go_email_session` is `HttpOnly`, `Secure` on HTTPS, `SameSite=None` on HTTPS. It is never set in production today (no sign-in). | `server/_core/cookies.ts` |
| CSRF (SEC09) | Mutations must be `application/json` (415 otherwise; tested in the smoke test). A cross-site JSON POST needs a CORS preflight the server never grants. | `requireJsonMutations` |
| Proxy trust, client address (SEC09, RL04) | `trust proxy = 1`: `req.ip` is the address Vercel appended. Vercel overwrites `X-Forwarded-For` by default (Vercel docs). | Test: a client-written `1.2.3.4` prefix is ignored. In production, three requests created three distinct hashed buckets, consistent with the fetch tool's changing egress address. Not provable without logging addresses, which the design avoids. |
| Logout | `auth.logout` deletes the server session row (by token hash) and clears the cookie; dormant in production | `server/localAuth.ts` `clearLocalSession` |
| Storage (SEC08) | One **public** bucket, 12 brand/UI assets. No private bucket, no user uploads, no signed links exist. User media therefore cannot share public rules by accident. | `storage.buckets`, `storage.objects` |
| Headers | nosniff, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, strict referrer, HSTS (platform), `Permissions-Policy` (camera, microphone, geolocation, payment and USB off) | Production responses |
| CSP (SEC10) | **Report-only**, mapped from the origins the app uses: self; Supabase https/wss; jsDelivr and GitHub raw for photos; Google Fonts. | Enforced in headless Chromium on the built app across the main screens: **0 violations** once zod runs jitless (`evidence/csp-violations.json`). |
| Dependencies (SEC11) | `4b4c3dc`: express 4.21.2 → 4.22.3 (qs 6.16.0, path-to-regexp 0.1.13, body-parser 1.20.8), proxy-addr 2.0.8 by override. Nothing else in the lockfile moved. | `pnpm audit --prod`: critical 1 → 0, high 18 → 17 |
| Security-definer functions (SEC03) | `public.sg_rate_limit_hit`: service role only, `search_path = ''`. `public.get_strength_input_contract_v2` (advisor WARN): executable by signed-in users; read-only, STABLE; reads one catalog table; no caller identity; `search_path = public, pg_temp`. **Low risk.** | Optional hardening (O10): revoke execute from `authenticated` if no client calls it (none in this repo does). |
| User-editable metadata (SEC04) | Not used for authorization anywhere. RLS keys on `auth.uid()` only; the server keys on its own session lookup. | |

**CSP: report-only until enforced.**
- No report endpoint is configured, so violations appear only in browser consoles.
- **To enforce (O6):** in `vercel.json`, rename the `Content-Security-Policy-Report-Only` header to `Content-Security-Policy` and merge it with the existing `frame-ancestors 'none'` value. Deploy to a preview, open Home, Plan, Progress, Strength, Body Lab, an exercise detail and a share link, and check the console for "Refused to…".
- **Rollback:** rename it back.

**Dependency advisories remaining in `pnpm audit --prod`:**
- `axios` and `streamdown` (with mermaid, dompurify, katex and lodash-es) are **not imported** anywhere.
- `drizzle-orm` serves MySQL only, which is not configured in production.
- `nanoid` is used by the dev server only.
- `lodash` comes in via `recharts`, client chart code with no untrusted template input.

Removing the unused packages is a cleanup for their owners (BASE05/BASE06), not a reachable risk.
